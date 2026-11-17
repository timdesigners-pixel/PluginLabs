//! Yerel sahne dosyası: `.uhds` (Ultimate Home Design Scene).
//!
//! Biçim: ilk satır başlık, ardından sahnenin JSON gövdesi.
//! `UHDS/1 sha256=<64 hex> bytes=<gövde bayt sayısı>\n<json>`
//! Gövde bütünlüğü SHA-256 ile doğrulanır; sürüm yükseltmesi `migrate` içinde yapılır.

use crate::model::Scene;
use serde::Serialize;
use sha2::{Digest, Sha256};

pub const FORMAT: &str = "UHDS";
pub const VERSION: u32 = 1;
pub const EXTENSION: &str = "uhds";
pub const MAX_BYTES: usize = 256 * 1024 * 1024;

#[derive(Debug, Clone, Serialize)]
pub struct FileInfo {
    pub version: u32,
    pub bytes: usize,
    pub sha256: String,
    pub migrated: bool,
    pub modules: usize,
    pub levels: usize,
    pub objects: usize,
    pub meshes: usize,
}

fn hex(d: &[u8]) -> String {
    d.iter().map(|b| format!("{b:02x}")).collect()
}

pub fn save(scene: &Scene) -> Result<String, String> {
    let body = serde_json::to_string(scene).map_err(|e| e.to_string())?;
    if body.len() > MAX_BYTES {
        return Err("@scene_too_large".into());
    }
    let sum = hex(&Sha256::digest(body.as_bytes()));
    Ok(format!("{FORMAT}/{VERSION} sha256={sum} bytes={}\n{body}", body.len()))
}

pub fn load(text: &str) -> Result<(Scene, FileInfo), String> {
    if text.len() > MAX_BYTES + 200 {
        return Err("@file_too_large".into());
    }
    let (head, body) = text.split_once('\n').ok_or("@scene_header_missing")?;
    let head = head.trim_end_matches('\r');
    let mut parts = head.split(' ');
    let fmt = parts.next().unwrap_or("");
    let (name, ver) = fmt.split_once('/').ok_or("@not_uhds")?;
    if name != FORMAT {
        return Err("@not_uhds".into());
    }
    let ver: u32 = ver.parse().map_err(|_| "@version_unreadable")?;
    if ver > VERSION {
        return Err(format!("@scene_newer|version={ver}"));
    }
    let mut sum = None;
    let mut bytes = None;
    for p in parts {
        if let Some(v) = p.strip_prefix("sha256=") {
            sum = Some(v.to_string());
        } else if let Some(v) = p.strip_prefix("bytes=") {
            bytes = v.parse::<usize>().ok();
        }
    }
    let sum = sum.ok_or("@checksum_missing")?;
    if bytes != Some(body.len()) {
        return Err("@file_truncated".into());
    }
    let actual = hex(&Sha256::digest(body.as_bytes()));
    if actual != sum.to_lowercase() {
        return Err("@file_corrupt".into());
    }
    let value: serde_json::Value = serde_json::from_str(body).map_err(|e| format!("@scene_unreadable|error={}", e.to_string().replace('|', "/")))?;
    let (value, migrated) = migrate(value, ver);
    let scene: Scene = serde_json::from_value(value).map_err(|e| format!("@scene_invalid|error={}", e.to_string().replace('|', "/")))?;
    let info = FileInfo { version: ver, bytes: body.len(), sha256: actual, migrated, modules: scene.modules.len(), levels: scene.levels.len(), objects: scene.objects.len(), meshes: scene.meshes.len() };
    Ok((scene, info))
}

/// Eski sürümleri güncel modele taşır. Şimdilik tek sürüm var; alanlar varsayılanlarla dolar.
fn migrate(v: serde_json::Value, from: u32) -> (serde_json::Value, bool) {
    (v, from < VERSION)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_and_integrity() {
        let s = crate::templates::demo_scene();
        let text = save(&s).unwrap();
        assert!(text.starts_with("UHDS/1 sha256="));
        let (back, info) = load(&text).unwrap();
        assert_eq!(back.objects.len(), s.objects.len());
        assert_eq!(back.modules.len(), 2);
        assert_eq!(info.version, 1);
        assert_eq!(serde_json::to_string(&back).unwrap(), serde_json::to_string(&s).unwrap());
        let tampered = text.replacen("Salon ve mutfak", "Salon ve mutfaK", 1);
        assert!(load(&tampered).unwrap_err() == "@file_corrupt");
        let cut = &text[..text.len() - 10];
        assert!(load(cut).unwrap_err() == "@file_truncated");
        assert!(load("UHDS/9 sha256=00 bytes=2\n{}").unwrap_err().starts_with("@scene_newer"));
        assert!(load("merhaba").is_err());
    }
}
