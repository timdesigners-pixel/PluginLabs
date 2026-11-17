//! Poly Haven (CC0) varlık indirici: yüksek detaylı modeller (glTF) ve PBR doku setleri.
//!
//! Yalnız `api.polyhaven.com`, `dl.polyhaven.org` ve küçük resimler için `cdn.polyhaven.com` adreslerine
//! HTTPS ile bağlanılır; yönlendirme izlenmez. Her dosyanın MD5 özeti API'nin verdiğiyle karşılaştırılır,
//! toplam boyut sınırlıdır. İndirilenler uygulama veri klasöründe önbelleğe alınır.

use base64::Engine as _;
use md5::{Digest, Md5};
use std::collections::HashMap;
use std::io::Read;
use std::path::PathBuf;
use tauri::Manager;

type R<T> = Result<T, String>;
const API: &str = "https://api.polyhaven.com";
const ALLOWED: [&str; 3] = ["https://api.polyhaven.com/", "https://dl.polyhaven.org/", "https://cdn.polyhaven.com/"];
const MAX_TOTAL: u64 = 200 * 1024 * 1024;
const MAX_LIST: u64 = 32 * 1024 * 1024;

fn agent() -> ureq::Agent {
    ureq::AgentBuilder::new().redirects(0).timeout(std::time::Duration::from_secs(90)).user_agent("PluginLabs-UltimateHome/0.1").build()
}

fn get(url: &str, limit: u64) -> R<Vec<u8>> {
    if !ALLOWED.iter().any(|a| url.starts_with(a)) {
        return Err("@ph_host".into());
    }
    let r = agent().get(url).call().map_err(|_| "@ph_network".to_string())?;
    let mut buf = vec![];
    r.into_reader().take(limit + 1).read_to_end(&mut buf).map_err(|_| "@ph_network".to_string())?;
    if buf.len() as u64 > limit {
        return Err("@ph_too_large".into());
    }
    Ok(buf)
}

fn valid_id(id: &str) -> bool {
    !id.is_empty() && id.len() <= 80 && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}

fn cache_dir(app: &tauri::AppHandle) -> R<PathBuf> {
    let d = app.path().app_data_dir().map_err(|e| e.to_string())?.join("polyhaven");
    std::fs::create_dir_all(&d).map_err(|e| e.to_string())?;
    Ok(d)
}

/// Varlık listesi (models | textures); 24 saat önbellekli. Yalnız arayüzün kullandığı alanlar döner.
pub fn list(app: &tauri::AppHandle, kind: &str) -> R<serde_json::Value> {
    if kind != "models" && kind != "textures" {
        return Err("@ph_kind".into());
    }
    let path = cache_dir(app)?.join(format!("liste-{kind}.json"));
    let fresh = std::fs::metadata(&path).ok().and_then(|m| m.modified().ok()).and_then(|t| t.elapsed().ok()).is_some_and(|e| e.as_secs() < 86_400);
    let raw = if fresh {
        std::fs::read(&path).map_err(|e| e.to_string())?
    } else {
        let b = get(&format!("{API}/assets?t={kind}"), MAX_LIST)?;
        let _ = std::fs::write(&path, &b);
        b
    };
    let v: serde_json::Value = serde_json::from_slice(&raw).map_err(|_| "@ph_invalid".to_string())?;
    let mut out = vec![];
    for (id, a) in v.as_object().ok_or("@ph_invalid")? {
        if !valid_id(id) {
            continue;
        }
        out.push(serde_json::json!({
            "id": id, "name": a["name"], "categories": a["categories"], "tags": a["tags"],
            "polycount": a["polycount"], "dimensions": a["dimensions"],
            "authors": a["authors"].as_object().map(|o| o.keys().cloned().collect::<Vec<_>>().join(", ")).unwrap_or_default(),
        }));
    }
    Ok(serde_json::json!(out))
}

/// Küçük resim (PNG, base64); önbellekli.
pub fn thumb(app: &tauri::AppHandle, id: &str) -> R<String> {
    if !valid_id(id) {
        return Err("@ph_id".into());
    }
    let path = cache_dir(app)?.join("kucuk").join(format!("{id}.png"));
    let bytes = match std::fs::read(&path) {
        Ok(b) => b,
        Err(_) => {
            let b = get(&format!("https://cdn.polyhaven.com/asset_img/thumbs/{id}.png?width=256&height=256"), 4 * 1024 * 1024)?;
            if let Some(p) = path.parent() {
                let _ = std::fs::create_dir_all(p);
            }
            let _ = std::fs::write(&path, &b);
            b
        }
    };
    Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
}

fn fetch_checked(url: &str, md5: Option<&str>, cache: &std::path::Path, budget: &mut u64) -> R<Vec<u8>> {
    if let Ok(b) = std::fs::read(cache) {
        if md5.is_none_or(|m| format!("{:x}", Md5::digest(&b)) == m) {
            return Ok(b);
        }
    }
    let b = get(url, *budget)?;
    if let Some(m) = md5 {
        if format!("{:x}", Md5::digest(&b)) != m {
            return Err("@ph_checksum".into());
        }
    }
    *budget = budget.saturating_sub(b.len() as u64);
    if let Some(p) = cache.parent() {
        let _ = std::fs::create_dir_all(p);
    }
    let _ = std::fs::write(cache, &b);
    Ok(b)
}

/// Model indirir: glTF + .bin + dokular → { main, files: {ad: base64}, license }.
pub fn model(app: &tauri::AppHandle, id: &str, res: &str) -> R<serde_json::Value> {
    if !valid_id(id) || !["1k", "2k", "4k"].contains(&res) {
        return Err("@ph_id".into());
    }
    let info: serde_json::Value = serde_json::from_slice(&get(&format!("{API}/files/{id}"), 4 * 1024 * 1024)?).map_err(|_| "@ph_invalid".to_string())?;
    let g = &info["gltf"][res]["gltf"];
    let main_url = g["url"].as_str().ok_or("@ph_invalid")?;
    let main = main_url.rsplit('/').next().unwrap_or("model.gltf").to_string();
    let dir = cache_dir(app)?.join("modeller").join(id).join(res);
    let mut budget = MAX_TOTAL;
    let mut files: HashMap<String, String> = HashMap::new();
    let enc = base64::engine::general_purpose::STANDARD;
    let b = fetch_checked(main_url, g["md5"].as_str(), &dir.join(&main), &mut budget)?;
    files.insert(main.clone(), enc.encode(b));
    for (name, f) in g["include"].as_object().into_iter().flatten() {
        // yalnız göreli, alt klasör içi adlar
        if name.contains("..") || name.starts_with('/') || name.contains('\\') || name.contains(':') {
            return Err("@ph_invalid".into());
        }
        let url = f["url"].as_str().ok_or("@ph_invalid")?;
        let b = fetch_checked(url, f["md5"].as_str(), &dir.join(name), &mut budget)?;
        files.insert(name.clone(), enc.encode(b));
    }
    Ok(serde_json::json!({"main": main, "files": files, "license": "Poly Haven · CC0"}))
}

/// Doku seti indirir: renk, normal (OpenGL) ve ARM (AO-pürüz-metal) ya da pürüz haritası.
pub fn texture(app: &tauri::AppHandle, id: &str, res: &str) -> R<serde_json::Value> {
    if !valid_id(id) || !["1k", "2k", "4k"].contains(&res) {
        return Err("@ph_id".into());
    }
    let info: serde_json::Value = serde_json::from_slice(&get(&format!("{API}/files/{id}"), 4 * 1024 * 1024)?).map_err(|_| "@ph_invalid".to_string())?;
    let dir = cache_dir(app)?.join("dokular").join(id).join(res);
    let mut budget = MAX_TOTAL;
    let enc = base64::engine::general_purpose::STANDARD;
    let mut maps = serde_json::Map::new();
    for (key, field) in [("diff", "Diffuse"), ("nor", "nor_gl"), ("arm", "arm"), ("rough", "Rough")] {
        let f = &info[field][res]["jpg"];
        let Some(url) = f["url"].as_str() else { continue };
        let b = fetch_checked(url, f["md5"].as_str(), &dir.join(format!("{key}.jpg")), &mut budget)?;
        maps.insert(key.into(), serde_json::json!(enc.encode(b)));
    }
    if !maps.contains_key("diff") {
        return Err("@ph_invalid".into());
    }
    Ok(serde_json::json!({"maps": maps, "license": "Poly Haven · CC0"}))
}
