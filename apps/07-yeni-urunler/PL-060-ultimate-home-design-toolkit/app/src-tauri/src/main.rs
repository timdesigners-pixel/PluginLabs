//! Ultimate Home Design Toolkit — Tauri 2 masaüstü kabuğu.
//! Hesapların tamamı `uhd-engine` içinde; burada yalnız dosya diyalogları, otomatik kayıt
//! ve PluginLabs Hub (MyMind) köprüsü vardır. Ağ erişimi yalnız 127.0.0.1:47632'dir.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cycles;
mod polyhaven;
mod vault;

use base64::Engine as _;
use serde::Serialize;
use std::path::PathBuf;
use tauri::Manager;

type R<T> = Result<T, String>;
const HUB: &str = "http://127.0.0.1:47632";
const MAX_TEXT: u64 = 256 * 1024 * 1024;
const MAX_OBJ: u64 = 64 * 1024 * 1024;
const MAX_PROMPT: usize = 6000;

#[derive(Serialize)]
struct OpenedFile {
    name: String,
    text: String,
}

#[tauri::command]
async fn engine(cmd: String, payload: String) -> String {
    tauri::async_runtime::spawn_blocking(move || uhd_engine::api::call(&cmd, &payload))
        .await
        .unwrap_or_else(|e| serde_json::json!({"ok": false, "error": format!("Motor görevi durdu: {e}")}).to_string())
}

fn autosave_path(app: &tauri::AppHandle) -> R<PathBuf> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("otomatik-kayit.uhds"))
}

#[tauri::command]
fn autosave_write(app: tauri::AppHandle, text: String) -> R<()> {
    if text.len() as u64 > MAX_TEXT || !text.starts_with("UHDS/") {
        return Err("Geçersiz otomatik kayıt".into());
    }
    let p = autosave_path(&app)?;
    let tmp = p.with_extension("tmp");
    std::fs::write(&tmp, text).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, &p).map_err(|e| e.to_string())
}

#[tauri::command]
fn autosave_read(app: tauri::AppHandle) -> R<Option<String>> {
    let p = autosave_path(&app)?;
    match std::fs::metadata(&p) {
        Ok(m) if m.len() <= MAX_TEXT => Ok(std::fs::read_to_string(&p).ok()),
        _ => Ok(None),
    }
}

fn filter(kind: &str) -> R<(&'static str, &'static [&'static str])> {
    Ok(match kind {
        "uhds" => ("Ultimate Home sahnesi", &["uhds"]),
        "obj" => ("Wavefront OBJ / MTL", &["obj", "mtl"]),
        "mtl" => ("MTL malzeme", &["mtl"]),
        "png" => ("PNG görüntü", &["png"]),
        _ => return Err("Bilinmeyen dosya türü".into()),
    })
}

#[tauri::command]
async fn open_files(kind: String) -> R<Vec<OpenedFile>> {
    let (label, exts) = filter(&kind)?;
    if kind != "uhds" && kind != "obj" {
        return Err("Bu tür açılamaz".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        let dlg = rfd::FileDialog::new().add_filter(label, exts);
        let picked: Vec<PathBuf> = if kind == "obj" { dlg.pick_files().unwrap_or_default() } else { dlg.pick_file().into_iter().collect() };
        let limit = if kind == "obj" { MAX_OBJ } else { MAX_TEXT };
        let mut out = vec![];
        for p in picked.into_iter().take(4) {
            let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
            if !exts.contains(&ext.as_str()) {
                continue;
            }
            let len = std::fs::metadata(&p).map_err(|e| e.to_string())?.len();
            if len > limit {
                return Err(format!("{} çok büyük", p.display()));
            }
            let text = std::fs::read_to_string(&p).map_err(|_| "Dosya UTF-8 metin olarak okunamadı".to_string())?;
            out.push(OpenedFile { name: p.file_name().and_then(|n| n.to_str()).unwrap_or("dosya").to_string(), text });
        }
        Ok(out)
    })
    .await
    .map_err(|e| e.to_string())?
}

fn safe_name(name: &str, ext: &str) -> String {
    let stem: String = name.chars().filter(|c| c.is_alphanumeric() || matches!(c, '-' | '_' | '.')).take(80).collect();
    let stem = stem.trim_end_matches(&format!(".{ext}")).trim_matches('.').to_string();
    format!("{}.{ext}", if stem.is_empty() { "ultimate-home".into() } else { stem })
}

#[tauri::command]
async fn save_file(kind: String, name: String, text: Option<String>, base64: Option<String>) -> R<Option<String>> {
    let (label, exts) = filter(&kind)?;
    let ext = exts[0];
    let bytes = match (text, base64) {
        (Some(t), _) => t.into_bytes(),
        (None, Some(b)) => base64::engine::general_purpose::STANDARD.decode(b).map_err(|_| "Geçersiz görüntü verisi".to_string())?,
        _ => return Err("Kaydedilecek içerik yok".into()),
    };
    if bytes.len() as u64 > MAX_TEXT {
        return Err("İçerik çok büyük".into());
    }
    let file = safe_name(&name, ext);
    tauri::async_runtime::spawn_blocking(move || {
        let Some(mut p) = rfd::FileDialog::new().add_filter(label, &[ext]).set_file_name(&file).save_file() else { return Ok(None) };
        if p.extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase()) != Some(ext.to_string()) {
            p.set_extension(ext);
        }
        std::fs::write(&p, bytes).map_err(|e| e.to_string())?;
        Ok(Some(p.display().to_string()))
    })
    .await
    .map_err(|e| e.to_string())?
}

fn agent(secs: u64) -> ureq::Agent {
    ureq::AgentBuilder::new().redirects(0).timeout(std::time::Duration::from_secs(secs)).build()
}

#[tauri::command]
async fn hub_status() -> serde_json::Value {
    tauri::async_runtime::spawn_blocking(|| {
        let has_key = vault::read().is_some_and(|k| !k.is_empty());
        let alive = agent(3).get(&format!("{HUB}/health")).call().is_ok();
        let reason = match (alive, has_key) {
            (false, _) => "PluginLabs Hub çalışmıyor. Hub'ı açın ve MyMind'ı başlatın.",
            (true, false) => "Hub istemci anahtarı kayıtlı değil. Hub'da bu uygulamaya izin verip anahtarı kaydedin.",
            _ => "",
        };
        serde_json::json!({"available": alive && has_key, "hub": alive, "key": has_key, "reason": reason})
    })
    .await
    .unwrap_or_else(|_| serde_json::json!({"available": false, "reason": "Durum okunamadı"}))
}

#[tauri::command]
fn hub_set_key(key: String) -> R<()> {
    let k = key.trim();
    if k.len() < 8 || k.len() > 512 || k.chars().any(|c| c.is_control() || c.is_whitespace()) {
        return Err("Anahtar biçimi geçersiz".into());
    }
    vault::write(k)
}

/// Kullanıcının önizlediği metni Hub'a gönderir. Metin günlüğe yazılmaz.
#[tauri::command]
async fn mymind(prompt: String, approved: bool) -> R<serde_json::Value> {
    if !approved {
        return Err("Gönderim için açık onay gerekli".into());
    }
    if prompt.trim().is_empty() || prompt.chars().count() > MAX_PROMPT {
        return Err(format!("Metin boş ya da {MAX_PROMPT} karakter sınırını aşıyor"));
    }
    let key = vault::read().ok_or("Hub istemci anahtarı kayıtlı değil")?;
    tauri::async_runtime::spawn_blocking(move || {
        let r = agent(30)
            .post(&format!("{HUB}/v1/chat/completions"))
            .set("Authorization", &format!("Bearer {key}"))
            .send_json(serde_json::json!({"model": "mymind-lite", "messages": [{"role": "user", "content": prompt}], "max_tokens": 512, "temperature": 0.3, "stream": false}))
            .map_err(|_| "Hub yanıt vermedi; izin ve bağlantıyı kontrol edin".to_string())?;
        let data: serde_json::Value = r.into_json().map_err(|_| "Yanıt okunamadı".to_string())?;
        let text = data["choices"][0]["message"]["content"].as_str().ok_or("Metin yanıtı yok")?;
        Ok(serde_json::json!({"text": text.chars().take(6000).collect::<String>(), "source": "PluginLabs Hub · MyMind"}))
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Model dosyası seçer: .glb ya da .gltf (+ başvurduğu .bin ve dokular, yalnız aynı klasörün içinden) ya da .obj.
#[tauri::command]
async fn open_model() -> R<Option<serde_json::Value>> {
    tauri::async_runtime::spawn_blocking(|| {
        let Some(p) = rfd::FileDialog::new().add_filter("3B model", &["glb", "gltf"]).pick_file() else { return Ok(None) };
        let enc = base64::engine::general_purpose::STANDARD;
        let dir = p.parent().ok_or("@gltf_invalid")?.canonicalize().map_err(|e| e.to_string())?;
        let main = p.file_name().and_then(|n| n.to_str()).unwrap_or("model.gltf").to_string();
        let bytes = std::fs::read(&p).map_err(|e| e.to_string())?;
        if bytes.len() as u64 > 256 * 1024 * 1024 {
            return Err("@gltf_too_large".into());
        }
        let mut files = serde_json::Map::new();
        if main.to_lowercase().ends_with(".gltf") {
            let j: serde_json::Value = serde_json::from_slice(&bytes).map_err(|_| "@gltf_invalid".to_string())?;
            let mut total = bytes.len() as u64;
            let uris = j["buffers"].as_array().into_iter().flatten().chain(j["images"].as_array().into_iter().flatten()).filter_map(|b| b["uri"].as_str()).filter(|u| !u.starts_with("data:"));
            for u in uris {
                let rel = u.replace("%20", " ");
                let f = dir.join(&rel).canonicalize().map_err(|_| format!("@gltf_missing_file|name={}", rel.replace('|', "/")))?;
                if !f.starts_with(&dir) {
                    return Err("@gltf_invalid".into());
                }
                let b = std::fs::read(&f).map_err(|e| e.to_string())?;
                total += b.len() as u64;
                if total > 256 * 1024 * 1024 {
                    return Err("@gltf_too_large".into());
                }
                files.insert(rel, serde_json::json!(enc.encode(b)));
            }
        }
        files.insert(main.clone(), serde_json::json!(enc.encode(bytes)));
        let name = p.file_stem().and_then(|n| n.to_str()).unwrap_or("Model").to_string();
        Ok(Some(serde_json::json!({"main": main, "files": files, "name": name})))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn ph_list(app: tauri::AppHandle, kind: String) -> R<serde_json::Value> {
    tauri::async_runtime::spawn_blocking(move || polyhaven::list(&app, &kind)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn ph_thumb(app: tauri::AppHandle, id: String) -> R<String> {
    tauri::async_runtime::spawn_blocking(move || polyhaven::thumb(&app, &id)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn ph_model(app: tauri::AppHandle, id: String, res: String) -> R<serde_json::Value> {
    tauri::async_runtime::spawn_blocking(move || polyhaven::model(&app, &id, &res)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn ph_texture(app: tauri::AppHandle, id: String, res: String) -> R<serde_json::Value> {
    tauri::async_runtime::spawn_blocking(move || polyhaven::texture(&app, &id, &res)).await.map_err(|e| e.to_string())?
}

#[tauri::command]
fn cycles_status(app: tauri::AppHandle) -> serde_json::Value {
    match cycles::find(&app) {
        Some(p) => serde_json::json!({"available": true, "path": p.display().to_string()}),
        None => serde_json::json!({"available": false}),
    }
}

#[tauri::command]
async fn cycles_pick(app: tauri::AppHandle) -> R<Option<String>> {
    let picked = tauri::async_runtime::spawn_blocking(|| rfd::FileDialog::new().add_filter("Blender", &["exe", ""]).pick_file()).await.map_err(|e| e.to_string())?;
    match picked {
        Some(p) => {
            cycles::set_path(&app, &p)?;
            Ok(Some(p.display().to_string()))
        }
        None => Ok(None),
    }
}

/// Sahneyi motorda Cycles paketine çevirir ve Blender ile render eder.
#[tauri::command]
async fn cycles_render(app: tauri::AppHandle, payload: String) -> R<String> {
    tauri::async_runtime::spawn_blocking(move || {
        let r: serde_json::Value = serde_json::from_str(&uhd_engine::api::call("export_cycles", &payload)).map_err(|e| e.to_string())?;
        if r["ok"].as_bool() != Some(true) {
            return Err(r["error"].as_str().unwrap_or("@cycles_failed").to_string());
        }
        let png = cycles::render(&app, &r["data"].to_string())?;
        Ok(base64::engine::general_purpose::STANDARD.encode(png))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
fn cycles_cancel() {
    cycles::cancel();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![engine, autosave_write, autosave_read, open_files, save_file, hub_status, hub_set_key, mymind, cycles_status, cycles_pick, cycles_render, cycles_cancel, open_model, ph_list, ph_thumb, ph_model, ph_texture])
        .run(tauri::generate_context!())
        .expect("Ultimate Home başlatılamadı");
}
