//! Komut satırından render: `cargo run --release --example render_cli -- <çıktı.png> [kamera] [atmosfer] [genişlik] [yükseklik] [örnek] [saat] [kesit]`
//! Kamera: on, arka, sag, sol, kusbakisi, perspektif, izometrik, ic. Atmosfer: gunduz, gun-batimi, aksam.
use serde_json::{json, Value};
use uhd_engine::api::call;

fn main() {
    let a: Vec<String> = std::env::args().collect();
    let out = a.get(1).cloned().unwrap_or_else(|| "render.png".into());
    let cam = a.get(2).cloned().unwrap_or_else(|| "perspektif".into());
    let atm = a.get(3).cloned().unwrap_or_else(|| "gunduz".into());
    let w: u32 = a.get(4).and_then(|x| x.parse().ok()).unwrap_or(1280);
    let h: u32 = a.get(5).and_then(|x| x.parse().ok()).unwrap_or(720);
    let spp: u32 = a.get(6).and_then(|x| x.parse().ok()).unwrap_or(64);
    let demo: Value = serde_json::from_str(&call("demo", "")).unwrap();
    let scene = demo["data"]["scene"].clone();
    let c: Value = serde_json::from_str(&call("camera_preset", &json!({"scene": scene, "name": cam}).to_string())).unwrap();
    let c = &c["data"];
    let roof = cam != "kusbakisi" && a.get(8).map(|x| x != "kesit").unwrap_or(true);
    // 7. bağımsız değişken: saat (ör. 17.5) → gökyüzü motoru
    let sky = a.get(7).and_then(|x| x.parse::<f32>().ok()).map(|h| json!({"hour": h})).unwrap_or(Value::Null);
    let r: Value = serde_json::from_str(&call("render", &json!({"scene": scene, "atmosphere": atm, "settings": {"width": w, "height": h, "samples": spp, "eye": c["eye"], "target": c["target"], "fov": c["fov"], "projection": c.get("projection").cloned().unwrap_or(json!("perspective")), "ortho_height": c.get("orthoHeight").cloned().unwrap_or(Value::Null), "sky": sky, "mesh": {"roof": roof}}}).to_string())).unwrap();
    let d = &r["data"];
    use base64::Engine;
    let png = base64::engine::general_purpose::STANDARD.decode(d["png"].as_str().expect("render hatası")).unwrap();
    std::fs::write(&out, png).unwrap();
    eprintln!("{out}: {}x{} · {} üçgen · {} iş parçacığı · {} ışın · {:.0} ms", d["width"], d["height"], d["triangles"], d["threads"], d["rays"], d["ms"].as_f64().unwrap_or(0.0));
}
