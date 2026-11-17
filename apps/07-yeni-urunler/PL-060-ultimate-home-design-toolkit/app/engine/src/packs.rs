//! Genişleme paketleri: Tiny House ve Van Builder.
//!
//! Paketler PluginLabs Hub üzerinden satın alınır. Hub, yayıncının imzaladığı lisansı
//! (`UHPK1.<yük>.<imza>`, Ed25519) saklar ve uygulamaya verir; motor lisansı burada,
//! gömülü yayıncı anahtarlarıyla doğrular. Doğrulanmamış lisansla paket şablonu ve
//! hesapları çalışmaz.

use crate::model::{Object, Scene};
use crate::photo::FitOpening;
use crate::spaces::Space;
use base64::Engine as _;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Mutex;

pub const APP: &str = "PL-060";
pub const TINY: &str = "uhd-tiny-house";
pub const VAN: &str = "uhd-van-builder";
pub const PACKS: [&str; 2] = [TINY, VAN];

/// Yayıncı (PluginLabs) lisans imza anahtarları: base64, 32 bayt Ed25519 açık anahtar.
fn publisher_keys() -> Vec<[u8; 32]> {
    let raw: Vec<String> = serde_json::from_str(include_str!("../data/pack-keys.json")).unwrap_or_default();
    let mut keys: Vec<[u8; 32]> = raw.iter().filter_map(|k| decode_key(k)).collect();
    keys.extend(PREVIEW_KEYS.lock().map(|k| k.clone()).unwrap_or_default());
    keys
}

/// Yalnız tarayıcı önizlemesinin test düzeneği ekler (WebAssembly köprüsü); masaüstü uygulaması çağırmaz.
static PREVIEW_KEYS: Mutex<Vec<[u8; 32]>> = Mutex::new(Vec::new());
pub fn trust_preview_key(b64: &str) -> bool {
    match decode_key(b64) {
        Some(k) => PREVIEW_KEYS.lock().map(|mut v| v.push(k)).is_ok(),
        None => false,
    }
}

fn decode_key(b64: &str) -> Option<[u8; 32]> {
    let b = base64::engine::general_purpose::STANDARD.decode(b64.trim()).ok()?;
    b.try_into().ok()
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct License {
    pub pack: String,
    pub app: String,
    /// Lisans numarası (Hub'da gösterilir).
    pub lic: String,
    /// Düzenlenme tarihi (YYYY-AA-GG).
    pub iat: String,
}

/// Lisansı doğrular: biçim, imza, uygulama ve paket kimliği.
pub fn verify(token: &str) -> Result<License, String> {
    let bad = || "@pack_license_invalid".to_string();
    let t = token.trim();
    if t.len() > 2048 {
        return Err(bad());
    }
    let mut parts = t.split('.');
    let (Some("UHPK1"), Some(body), Some(sig), None) = (parts.next(), parts.next(), parts.next(), parts.next()) else { return Err(bad()) };
    let url = base64::engine::general_purpose::URL_SAFE_NO_PAD;
    let payload = url.decode(body).map_err(|_| bad())?;
    let sig: [u8; 64] = url.decode(sig).map_err(|_| bad())?.try_into().map_err(|_| bad())?;
    let sig = Signature::from_bytes(&sig);
    let signed = format!("UHPK1.{body}");
    let ok = publisher_keys().iter().any(|k| VerifyingKey::from_bytes(k).is_ok_and(|vk| vk.verify(signed.as_bytes(), &sig).is_ok()));
    if !ok {
        return Err(bad());
    }
    let lic: License = serde_json::from_slice(&payload).map_err(|_| bad())?;
    if lic.app != APP || !PACKS.contains(&lic.pack.as_str()) {
        return Err("@pack_license_other".into());
    }
    Ok(lic)
}

/// Geçerli lisansların açtığı paketler.
pub fn owned(tokens: &[String]) -> Vec<String> {
    let mut v: Vec<String> = tokens.iter().filter_map(|t| verify(t).ok()).map(|l| l.pack).collect();
    v.sort();
    v.dedup();
    v
}

fn require(tokens: &[String], pack: &str) -> Result<(), String> {
    if owned(tokens).iter().any(|p| p == pack) {
        Ok(())
    } else {
        Err("@pack_locked".into())
    }
}

/// Hazır gövde: iç ölçüler (mm), duvar kalınlığı, taşıma sınırı (kg).
#[derive(Clone, Debug, Serialize)]
pub struct Preset {
    pub id: &'static str,
    pub pack: &'static str,
    pub width: f64,
    pub depth: f64,
    pub height: f64,
    pub wall: f64,
    /// Tiny House: römork azami toplam ağırlığı; Van: araç faydalı yükü (kg).
    pub limit_kg: f64,
    /// Tiny House: boş römork ağırlığı (kg).
    pub tare_kg: f64,
}

pub fn presets() -> Vec<Preset> {
    let th = |id, len: f64| Preset { id, pack: TINY, width: 2310.0, depth: len - 240.0, height: 3250.0, wall: 120.0, limit_kg: 3500.0, tare_kg: 750.0 };
    let van = |id, depth, height, payload| Preset { id, pack: VAN, width: 1750.0, depth, height, wall: 60.0, limit_kg: payload, tare_kg: 0.0 };
    vec![
        th("th-6", 6000.0),
        th("th-72", 7200.0),
        th("th-85", 8500.0),
        van("van-l2h2", 3200.0, 1800.0, 1100.0),
        van("van-l3h2", 3700.0, 1800.0, 1200.0),
        van("van-l3h3", 3700.0, 2050.0, 1150.0),
        van("van-l4h3", 4300.0, 2050.0, 1000.0),
    ]
}

/// Ürün başına teknik değer: ağırlık (kg), güç (W), günlük çalışma (saat), akü (Wh), güneş (W), su (L).
#[derive(Clone, Copy, Debug, Default, Serialize)]
pub struct Spec {
    pub kg: f64,
    pub watt: f64,
    pub hours: f64,
    pub battery_wh: f64,
    pub solar_w: f64,
    pub water_l: f64,
}

pub fn spec(id: &str) -> Spec {
    let s = |kg, watt, hours| Spec { kg, watt, hours, ..Default::default() };
    match id {
        "th-loft-yatak" => s(85.0, 0.0, 0.0),
        "th-depolu-merdiven" => s(95.0, 0.0, 0.0),
        "th-katlanir-masa" => s(15.0, 0.0, 0.0),
        "th-kompakt-mutfak" => s(70.0, 1800.0, 1.0),
        "th-dar-buzdolabi" => s(40.0, 90.0, 8.0),
        "th-kompost-tuvalet" => s(18.0, 3.0, 24.0),
        "th-mini-dus" => s(45.0, 0.0, 0.0),
        "th-sandikli-bank" => s(35.0, 0.0, 0.0),
        "th-panel-isitici" => s(8.0, 1000.0, 4.0),
        "th-dar-camasir" => s(60.0, 1500.0, 0.5),
        "van-teker-kemeri" => s(4.0, 0.0, 0.0),
        "van-yatak-platform" => s(60.0, 0.0, 0.0),
        "van-mutfak-blogu" => s(45.0, 0.0, 0.0),
        "van-buzdolabi-12v" => s(22.0, 45.0, 10.0),
        "van-temiz-su" => Spec { kg: 8.0, water_l: 70.0, ..Default::default() },
        "van-gri-su" => s(5.0, 0.0, 0.0),
        "van-aku" => Spec { kg: 22.0, battery_wh: 2560.0, ..Default::default() },
        "van-invertor" => s(6.0, 20.0, 6.0),
        "van-gunes-paneli" => Spec { kg: 24.0, solar_w: 400.0, ..Default::default() },
        "van-dizel-isitici" => s(5.0, 25.0, 8.0),
        "van-portatif-tuvalet" => s(5.0, 0.0, 0.0),
        "van-tavan-dolabi" => s(12.0, 0.0, 0.0),
        "van-tavan-fani" => s(3.0, 30.0, 5.0),
        "van-led" => s(1.0, 12.0, 5.0),
        // temel katalogdan sık kullanılanlar (yaklaşık)
        "buzdolabi" => s(70.0, 120.0, 8.0),
        "camasir" => s(70.0, 1500.0, 0.5),
        "tek-yatak" => s(45.0, 0.0, 0.0),
        "cift-yatak" => s(70.0, 0.0, 0.0),
        "dus-kabini" => s(55.0, 0.0, 0.0),
        "lavabo" => s(30.0, 0.0, 0.0),
        "klozet" => s(30.0, 0.0, 0.0),
        "sandalye" => s(5.0, 0.0, 0.0),
        "ankastre-spot" => s(0.2, 5.0, 5.0),
        "laptop" => s(2.0, 60.0, 4.0),
        _ => s(20.0, 0.0, 0.0),
    }
}

fn place(s: &mut Scene, cat: &str, x: f64, y: f64, rot: f64, height: f64) {
    let Some(item) = crate::catalog::item(cat) else { return };
    let n = s.objects.len() + 1;
    let z = match item.mount {
        m if m == -3.0 => height + 200.0,
        m if m == -2.0 => height - item.size[2] - 2.0,
        m if m < 0.0 => height - 900.0,
        m => m,
    };
    s.objects.push(Object { id: format!("N{n}"), name: item.name.into(), mesh: format!("cat:{cat}"), level: s.levels[0].id.clone(), position: [x, y, z], rotation: rot, scale: [1.0; 3], material: None, price: item.price, quantity: 1, motor: None });
}

/// Paket şablonundan yeni proje kurar (lisans gerekir).
pub fn preset_scene(tokens: &[String], preset: &str, project_no: &str, name: &str) -> Result<(Scene, Vec<String>), String> {
    let p = presets().into_iter().find(|p| p.id == preset).ok_or("@pack_unknown_preset")?;
    require(tokens, p.pack)?;
    let mut s = crate::templates::new_project(project_no);
    s.name = name.chars().take(60).collect();
    s.pack_preset = p.id.into();
    s.standard.net_height = p.height;
    s.standard.exterior_wall = p.wall;
    let van = p.pack == VAN;
    // dış yüz: Tiny House ahşap kaplama, Van beyaz araç boyası
    s.facade = if van { "lake-beyaz".into() } else { "kaplama-ahsap".into() };
    let openings: Vec<FitOpening> = if van {
        vec![
            FitOpening { wall: "sag".into(), kind: "door".into(), offset: 250.0, width: 1270.0, sill: 0.0, height: p.height - 100.0 },
            FitOpening { wall: "on".into(), kind: "door".into(), offset: 100.0, width: p.width - 200.0, sill: 0.0, height: p.height - 100.0 },
        ]
    } else {
        vec![
            FitOpening { wall: "sag".into(), kind: "door".into(), offset: p.depth / 2.0 - 400.0, width: 800.0, sill: 0.0, height: 2000.0 },
            FitOpening { wall: "sol".into(), kind: "window".into(), offset: p.depth / 2.0 - 600.0, width: 1200.0, sill: 900.0, height: 1000.0 },
            FitOpening { wall: "on".into(), kind: "window".into(), offset: 550.0, width: 1200.0, sill: 1000.0, height: 900.0 },
            FitOpening { wall: "arka".into(), kind: "window".into(), offset: 700.0, width: 900.0, sill: 2300.0, height: 600.0 },
        ]
    };
    let space = Space { name: name.chars().take(40).collect(), width: p.width, depth: p.depth, height: p.height, wall: p.wall, source: "paket".into(), ..Default::default() };
    let (id, notes) = crate::spaces::add(&mut s, space, &openings, None, None, "sag")?;
    let sp = s.spaces.iter().find(|x| x.id == id).cloned().ok_or("@pack_unknown_preset")?;
    let [x0, y0] = sp.position;
    let (w, d, h) = (sp.width, sp.depth, sp.height);
    if van {
        // arka bölümde garajlı yatak, ortada mutfak ve buzdolabı; teker kemerleri iki yanda
        place(&mut s, "van-teker-kemeri", x0 + 115.0, y0 + d - 1300.0, 90.0, h);
        place(&mut s, "van-teker-kemeri", x0 + w - 115.0, y0 + d - 1300.0, 90.0, h);
        place(&mut s, "van-yatak-platform", x0 + w / 2.0, y0 + d - 700.0, 0.0, h);
        place(&mut s, "van-mutfak-blogu", x0 + 225.0, y0 + 1100.0, 90.0, h);
        place(&mut s, "van-buzdolabi-12v", x0 + 280.0, y0 + 1980.0, 90.0, h);
        place(&mut s, "van-temiz-su", x0 + w / 2.0 + 300.0, y0 + d - 600.0, 0.0, h);
        place(&mut s, "van-aku", x0 + w / 2.0 - 400.0, y0 + d - 500.0, 0.0, h);
        place(&mut s, "van-invertor", x0 + w / 2.0 - 400.0, y0 + d - 900.0, 0.0, h);
        place(&mut s, "van-tavan-dolabi", x0 + 175.0, y0 + 1100.0, 90.0, h);
        place(&mut s, "van-tavan-fani", x0 + w / 2.0, y0 + 1600.0, 0.0, h);
        place(&mut s, "van-gunes-paneli", x0 + w / 2.0, y0 + d / 2.0, 90.0, h);
    } else {
        // arka uçta asma kat yatak ve banyo, önde oturma; ortada mutfak ve merdiven
        place(&mut s, "th-loft-yatak", x0 + w / 2.0, y0 + 1000.0, 0.0, h);
        place(&mut s, "th-mini-dus", x0 + 350.0, y0 + 350.0, 0.0, h);
        place(&mut s, "th-kompost-tuvalet", x0 + w - 300.0, y0 + 330.0, 0.0, h);
        place(&mut s, "th-depolu-merdiven", x0 + w - 300.0, y0 + 2000.0 + 900.0, 180.0, h);
        place(&mut s, "th-kompakt-mutfak", x0 + 300.0, y0 + d / 2.0 + 200.0, 90.0, h);
        place(&mut s, "th-dar-buzdolabi", x0 + 275.0, y0 + d / 2.0 + 1250.0, 90.0, h);
        place(&mut s, "th-sandikli-bank", x0 + w / 2.0, y0 + d - 250.0, 180.0, h);
        place(&mut s, "th-katlanir-masa", x0 + w / 2.0, y0 + d - 900.0, 0.0, h);
        place(&mut s, "th-panel-isitici", x0 + w - 45.0, y0 + d - 1200.0, 270.0, h);
    }
    Ok((s, notes))
}

/// Paket hesabı: Tiny House için yol ve ağırlık, Van için faydalı yük ve enerji bütçesi.
pub fn check(scene: &Scene, tokens: &[String], pack: &str, preset: Option<&str>) -> Result<Value, String> {
    require(tokens, pack)?;
    let sp = scene.spaces.first().ok_or("@pack_no_space")?;
    let preset = preset.filter(|p| !p.is_empty()).unwrap_or(scene.pack_preset.as_str());
    let p = presets().into_iter().find(|p| p.id == preset && p.pack == pack);
    let items: Vec<(&Object, Spec)> = scene.objects.iter().filter_map(|o| o.mesh.strip_prefix("cat:").map(|c| (o, spec(c)))).collect();
    let item_kg: f64 = items.iter().map(|(o, s)| s.kg * o.quantity.max(1) as f64).sum();
    let (w, d, h, t) = (sp.width / 1000.0, sp.depth / 1000.0, sp.height / 1000.0, sp.wall / 1000.0);
    let floor = w * d;
    let walls = 2.0 * (w + d) * h;
    let row = |id: &str, value: f64, limit: f64, unit: &str, ok: bool| json!({"id": id, "value": (value * 10.0).round() / 10.0, "limit": limit, "unit": unit, "ok": ok});
    if pack == TINY {
        let limit = p.as_ref().map(|p| p.limit_kg).unwrap_or(3500.0);
        let tare = p.as_ref().map(|p| p.tare_kg).unwrap_or(750.0);
        let (ow, ol) = ((w + 2.0 * t) * 1000.0, (d + 2.0 * t) * 1000.0);
        // römork tabanı 55 cm, çatı yapısı 20 cm
        let road_h = 550.0 + sp.height + 200.0;
        // yapı ağırlığı: hafif ahşap karkas, ahşap lifi yalıtım ve ince kaplama (kg/m²: zemin, duvar, çatı)
        let shell = floor * 40.0 + walls * 20.0 + floor * 20.0;
        let total = tare + shell + item_kg;
        Ok(json!({"pack": pack, "rows": [
            row("outer_width", ow, 2550.0, "mm", ow <= 2550.0 + 0.5),
            row("road_height", road_h, 4000.0, "mm", road_h <= 4000.0 + 0.5),
            row("outer_length", ol, 8500.0, "mm", ol <= 8500.0 + 0.5),
            row("shell_kg", tare + shell, 0.0, "kg", true),
            row("items_kg", item_kg, 0.0, "kg", true),
            row("total_kg", total, limit, "kg", total <= limit),
        ]}))
    } else {
        let limit = p.as_ref().map(|p| p.limit_kg).unwrap_or(1100.0);
        // yalıtım + kaplama: duvar, tavan ve zemin (kg/m²)
        let lining = (walls + 2.0 * floor) * 6.5;
        let water: f64 = items.iter().map(|(o, s)| s.water_l * o.quantity.max(1) as f64).sum();
        let people = 150.0;
        let load = lining + item_kg + water + people;
        let daily: f64 = items.iter().map(|(o, s)| s.watt * s.hours * o.quantity.max(1) as f64).sum();
        let battery: f64 = items.iter().map(|(o, s)| s.battery_wh * o.quantity.max(1) as f64).sum();
        // ortalama 4 tepe güneş saati, %75 sistem verimi
        let solar: f64 = items.iter().map(|(o, s)| s.solar_w * o.quantity.max(1) as f64).sum::<f64>() * 4.0 * 0.75;
        // güneşsiz özerklik: akünün %90'ı kullanılabilir, hiç güneş üretimi yok
        let days = if daily < 1.0 { 99.0 } else { (battery * 0.9 / daily).min(99.0) };
        Ok(json!({"pack": pack, "rows": [
            row("lining_kg", lining, 0.0, "kg", true),
            row("items_kg", item_kg + water, 0.0, "kg", true),
            row("payload_kg", load, limit, "kg", load <= limit),
            row("daily_wh", daily, 0.0, "Wh", true),
            row("solar_wh", solar, 0.0, "Wh", true),
            row("battery_wh", battery, 0.0, "Wh", battery > 0.0),
            row("autonomy_days", days, 2.0, "days", days >= 2.0),
        ]}))
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use ed25519_dalek::{Signer, SigningKey};

    /// Yalnız testte kullanılan imza anahtarı (sabit tohum).
    pub fn test_license(pack: &str) -> String {
        let sk = SigningKey::from_bytes(&[7u8; 32]);
        trust_preview_key(&base64::engine::general_purpose::STANDARD.encode(sk.verifying_key().to_bytes()));
        let url = base64::engine::general_purpose::URL_SAFE_NO_PAD;
        let body = url.encode(json!({"pack": pack, "app": APP, "lic": "T-1", "iat": "2026-11-17"}).to_string());
        let signed = format!("UHPK1.{body}");
        format!("{signed}.{}", url.encode(sk.sign(signed.as_bytes()).to_bytes()))
    }

    #[test]
    fn license_signature_and_gating() {
        let tok = test_license(TINY);
        assert_eq!(verify(&tok).unwrap().pack, TINY);
        assert_eq!(owned(&[tok.clone(), "çöp".into()]), vec![TINY.to_string()]);
        // yük değiştirilirse imza tutmaz
        let mut parts: Vec<&str> = tok.split('.').collect();
        let forged = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(json!({"pack": VAN, "app": APP, "lic": "T-1", "iat": "2026-11-17"}).to_string());
        parts[1] = &forged;
        assert!(verify(&parts.join(".")).is_err());
        // başka anahtarla imzalanmış lisans geçmez
        let other = SigningKey::from_bytes(&[9u8; 32]);
        let url = base64::engine::general_purpose::URL_SAFE_NO_PAD;
        let body = url.encode(json!({"pack": VAN, "app": APP, "lic": "X", "iat": "2026-11-17"}).to_string());
        let signed = format!("UHPK1.{body}");
        assert!(verify(&format!("{signed}.{}", url.encode(other.sign(signed.as_bytes()).to_bytes()))).is_err());
        assert_eq!(preset_scene(&[tok.clone()], "van-l3h2", "T", "Van").unwrap_err(), "@pack_locked");
    }

    #[test]
    fn tiny_house_preset_meets_road_limits() {
        let tok = vec![test_license(TINY)];
        let (s, notes) = preset_scene(&tok, "th-72", "T", "Tiny").unwrap();
        assert!(notes.is_empty(), "{notes:?}");
        assert_eq!(s.levels[0].openings.len(), 4);
        assert!(s.objects.iter().any(|o| o.mesh == "cat:th-loft-yatak" && (o.position[2] - 2000.0).abs() < 1.0));
        let r = check(&s, &tok, TINY, Some("th-72")).unwrap();
        let get = |id: &str| r["rows"].as_array().unwrap().iter().find(|x| x["id"] == id).unwrap().clone();
        assert_eq!(get("outer_width")["value"], 2550.0);
        assert_eq!(get("road_height")["value"], 4000.0);
        assert_eq!(get("outer_length")["value"], 7200.0);
        assert_eq!(get("total_kg")["ok"], true, "{}", get("total_kg"));
        // 8,5 m gövde 3,5 t römork sınırını aşar: uyarı verilir
        let (s, _) = preset_scene(&tok, "th-85", "T", "Tiny").unwrap();
        let r = check(&s, &tok, TINY, Some("th-85")).unwrap();
        assert!(r["rows"].as_array().unwrap().iter().any(|x| x["id"] == "total_kg" && x["ok"] == false));
    }

    #[test]
    fn van_preset_payload_and_energy() {
        let tok = vec![test_license(VAN)];
        let (s, notes) = preset_scene(&tok, "van-l3h2", "T", "Van").unwrap();
        assert!(notes.is_empty(), "{notes:?}");
        assert_eq!(s.levels[0].openings.len(), 2, "sürgü kapı + arka kapılar");
        let r = check(&s, &tok, VAN, Some("van-l3h2")).unwrap();
        let get = |id: &str| r["rows"].as_array().unwrap().iter().find(|x| x["id"] == id).unwrap().clone();
        assert_eq!(get("battery_wh")["value"], 2560.0);
        assert_eq!(get("solar_wh")["value"], 1200.0);
        assert!(get("daily_wh")["value"].as_f64().unwrap() > 400.0);
        assert_eq!(get("payload_kg")["ok"], true, "{}", get("payload_kg"));
        assert_eq!(get("autonomy_days")["ok"], true);
        let days = get("autonomy_days")["value"].as_f64().unwrap();
        assert!(days > 2.0 && days < 6.0, "2,3 kWh akü / günlük tüketim: {days}");
        assert!(check(&s, &[], VAN, None).is_err(), "lisanssız hesap çalışmaz");
    }
}
