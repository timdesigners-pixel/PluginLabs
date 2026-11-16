//! Fotoğraf ölçüleriyle kurulan döşeli bir odayı fotoğraf kalitesi ayarlarıyla render eder:
//! `cargo run --release --example photo_cli -- <çıktı.png> [genişlik] [yükseklik] [örnek] [saat] [diyafram]`
use serde_json::{json, Value};
use uhd_engine::api::call;

fn data(cmd: &str, payload: Value) -> Value {
    let r: Value = serde_json::from_str(&call(cmd, &payload.to_string())).unwrap();
    assert!(r["ok"].as_bool().unwrap_or(false), "{cmd}: {}", r["error"]);
    r["data"].clone()
}

fn main() {
    let a: Vec<String> = std::env::args().collect();
    let out = a.get(1).cloned().unwrap_or_else(|| "oda.png".into());
    let w: u32 = a.get(2).and_then(|x| x.parse().ok()).unwrap_or(1500);
    let h: u32 = a.get(3).and_then(|x| x.parse().ok()).unwrap_or(1000);
    let spp: u32 = a.get(4).and_then(|x| x.parse().ok()).unwrap_or(128);
    let hour: f32 = a.get(5).and_then(|x| x.parse().ok()).unwrap_or(15.5);
    let aperture: f32 = a.get(6).and_then(|x| x.parse().ok()).unwrap_or(5.6);

    let scene = json!({"name": "Fotoğraftan oda", "levels": [{"id": "L0"}]});
    let openings = json!([
        {"wall": "arka", "kind": "window", "offset": 1000.0, "width": 2400.0, "sill": 400.0, "height": 1900.0},
        {"wall": "sag", "kind": "door", "offset": 3600.0, "width": 900.0, "sill": 0.0, "height": 2100.0}
    ]);
    let d = data("add_space", json!({"scene": scene, "space": {"name": "Salon", "width": 4500.0, "depth": 5200.0, "height": 2700.0, "source": "foto"}, "openings": openings}));
    let mut scene = d["scene"].clone();
    scene["interior"] = json!("boya-beyaz");
    // güneş öğleden sonra arka duvardaki pencereden içeri düşsün
    scene["sun"]["azimuth"] = json!(130.0);
    let mut n = 0;
    let mut put = |scene: &mut Value, id: &str, name: &str, x: f64, y: f64, z: f64, rot: f64| {
        n += 1;
        scene["objects"].as_array_mut().unwrap().push(json!({"id": format!("N{n}"), "name": name, "mesh": format!("cat:{id}"), "level": "L0", "position": [x, y, z], "rotation": rot}));
    };
    put(&mut scene, "hali", "Halı", 2250.0, 2500.0, 0.0, 90.0);
    put(&mut scene, "kanepe-3", "Üçlü kanepe", 2250.0, 3700.0, 0.0, 180.0);
    put(&mut scene, "orta-sehpa", "Orta sehpa", 2250.0, 2450.0, 0.0, 0.0);
    put(&mut scene, "berjer", "Berjer", 3700.0, 1900.0, 0.0, -60.0);
    put(&mut scene, "lambader", "Lambader", 3950.0, 900.0, 0.0, 0.0);
    put(&mut scene, "sarkit-lamba", "Sarkıt lamba", 2250.0, 2450.0, 2700.0 - 900.0, 0.0);
    put(&mut scene, "bitki", "Saksı bitkisi", 520.0, 700.0, 0.0, 0.0);
    put(&mut scene, "konsol", "Konsol", 320.0, 2600.0, 0.0, 90.0);
    put(&mut scene, "tablo-yatay", "Tablo", 40.0, 2600.0, 1350.0, 90.0);
    put(&mut scene, "masa-lambasi", "Masa lambası", 320.0, 2150.0, 800.0, 0.0);
    let d = data("motor", json!({"scene": scene, "kind": "perde", "params": {"width": 2900.0, "height": 2550.0, "open": 0.85}, "at": [2200.0, 130.0]}));
    let scene = d["scene"].clone();

    let settings = json!({
        "width": w, "height": h, "samples": spp, "bounces": 8,
        "eye": [900.0, 1500.0, 5050.0], "target": [2900.0, 1050.0, 600.0], "fov": 62.0,
        "sky": {"hour": hour, "month": 9, "haze": 0.25},
        "aperture": aperture, "bloom": 0.15, "vignette": 0.3, "grain": 0.1, "sharpen": 0.3, "white_balance": 6900.0
    });
    let r = data("render", json!({"scene": scene, "settings": settings}));
    use base64::Engine;
    std::fs::write(&out, base64::engine::general_purpose::STANDARD.decode(r["png"].as_str().unwrap()).unwrap()).unwrap();
    eprintln!("{out}: {}x{} · {} üçgen · {} ışın · {:.0} ms", r["width"], r["height"], r["triangles"], r["rays"], r["ms"].as_f64().unwrap_or(0.0));
}
