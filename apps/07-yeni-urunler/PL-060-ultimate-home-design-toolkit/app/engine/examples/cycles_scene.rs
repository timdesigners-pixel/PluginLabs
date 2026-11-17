//! Cycles sahne paketi üretir: `cargo run --release --example cycles_scene -- <sahne.json> [kamera|oda] [stil] [genişlik] [yükseklik] [örnek] [saat]`
//! Kamera: on, perspektif, izometrik, izometrik-kesit, ic; "oda" fotoğraftan kurulmuş döşeli örnek salonu kullanır.
use serde_json::{json, Value};
use uhd_engine::api::call;

fn data(cmd: &str, payload: Value) -> Value {
    let r: Value = serde_json::from_str(&call(cmd, &payload.to_string())).unwrap();
    assert!(r["ok"].as_bool().unwrap_or(false), "{cmd}: {}", r["error"]);
    r["data"].clone()
}

fn room() -> Value {
    let scene = json!({"name": "Salon", "levels": [{"id": "L0"}]});
    let openings = json!([{"wall": "arka", "kind": "window", "offset": 900.0, "width": 2600.0, "sill": 300.0, "height": 2100.0}, {"wall": "sag", "kind": "door", "offset": 3700.0, "width": 900.0, "sill": 0.0, "height": 2100.0}]);
    let mut scene = data("add_space", json!({"scene": scene, "space": {"name": "Salon", "width": 4500.0, "depth": 5400.0, "height": 2800.0, "source": "foto"}, "openings": openings}))["scene"].clone();
    scene["materials"].as_array_mut().unwrap().push(json!({"id": "boya-petrol", "name": "Petrol mavisi", "category": "duvar", "color": [0.10, 0.33, 0.37], "roughness": 0.8}));
    scene["materials"].as_array_mut().unwrap().push(json!({"id": "kadife-zumrut", "name": "Kadife", "category": "tekstil", "color": [0.02, 0.22, 0.17], "roughness": 0.9}));
    scene["interior"] = json!("boya-petrol");
    scene["sun"]["azimuth"] = json!(150.0);
    let mut n = 0;
    let mut put = |scene: &mut Value, id: &str, x: f64, y: f64, z: f64, rot: f64, mat: Option<&str>| {
        n += 1;
        scene["objects"].as_array_mut().unwrap().push(json!({"id": format!("N{n}"), "name": id, "mesh": format!("cat:{id}"), "level": "L0", "position": [x, y, z], "rotation": rot, "material": mat}));
    };
    put(&mut scene, "hali", 2000.0, 3300.0, 0.0, 90.0, None);
    put(&mut scene, "kanepe-3", 1900.0, 2300.0, 0.0, 0.0, Some("kadife-zumrut"));
    put(&mut scene, "puf", 2800.0, 3200.0, 0.0, 0.0, None);
    put(&mut scene, "berjer", 3700.0, 1300.0, 0.0, -40.0, Some("kadife-zumrut"));
    put(&mut scene, "lambader", 500.0, 1400.0, 0.0, 0.0, None);
    put(&mut scene, "bitki", 4150.0, 600.0, 0.0, 0.0, None);
    put(&mut scene, "konsol", 250.0, 3600.0, 0.0, 90.0, None);
    put(&mut scene, "tablo-uclu", 30.0, 3600.0, 1350.0, 90.0, None);
    put(&mut scene, "sarkit-lamba", 2000.0, 3000.0, 2800.0 - 900.0, 0.0, None);
    scene
}

fn main() {
    let a: Vec<String> = std::env::args().collect();
    let out = a.get(1).cloned().unwrap_or_else(|| "sahne.json".into());
    let cam = a.get(2).cloned().unwrap_or_else(|| "oda".into());
    let style = a.get(3).cloned().unwrap_or_default();
    let w: u32 = a.get(4).and_then(|x| x.parse().ok()).unwrap_or(1600);
    let h: u32 = a.get(5).and_then(|x| x.parse().ok()).unwrap_or(1000);
    let spp: u32 = a.get(6).and_then(|x| x.parse().ok()).unwrap_or(256);
    let hour: f32 = a.get(7).and_then(|x| x.parse().ok()).unwrap_or(15.5);
    let sky = json!({"hour": hour, "month": 9, "haze": 0.15});
    let (scene, c, roof) = if cam == "oda" {
        let s = room();
        (s, json!({"eye": [3900.0, 1350.0, 5300.0], "target": [1500.0, 1100.0, 300.0], "fov": 55.0}), true)
    } else {
        let s = data("demo", json!({}))["scene"].clone();
        let name = if cam == "izometrik-kesit" { "izometrik" } else { cam.as_str() };
        let c = data("camera_preset", json!({"scene": s, "name": name}));
        (s, c, cam != "izometrik-kesit")
    };
    let settings = json!({"width": w, "height": h, "samples": spp, "bounces": 10, "eye": c["eye"], "target": c["target"], "fov": c["fov"], "projection": c.get("projection").cloned().unwrap_or(json!("perspective")), "ortho_height": c.get("orthoHeight").cloned().unwrap_or(Value::Null), "sky": sky, "style": style, "aperture": if cam == "oda" { 5.6 } else { 0.0 }, "mesh": {"roof": roof}});
    let pkg = data("export_cycles", json!({"scene": scene, "settings": settings, "tile": 1024}));
    std::fs::write(&out, pkg.to_string()).unwrap();
    eprintln!("{out}: {} üçgen", pkg["triangles"]);
}
