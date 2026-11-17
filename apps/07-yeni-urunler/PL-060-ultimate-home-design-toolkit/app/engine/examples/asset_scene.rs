//! glTF modelleriyle döşenmiş bir sahneden Cycles paketi (ve isteğe bağlı dahili render) üretir:
//! `cargo run --release --example asset_scene -- <ayar.json> <sahne.json> [dahili.png]`
//!
//! ayar.json: { "room": {width, depth, height, wall_color, floor}, "models": [{dir, main, at:[x,y], rot, z, scale}],
//!              "camera": {eye, target, fov}, "render": { RenderSettings alanları } }
use base64::Engine;
use serde_json::{json, Value};
use std::collections::HashMap;
use uhd_engine::api::call;

fn data(cmd: &str, payload: Value) -> Value {
    let r: Value = serde_json::from_str(&call(cmd, &payload.to_string())).unwrap();
    assert!(r["ok"].as_bool().unwrap_or(false), "{cmd}: {}", r["error"]);
    r["data"].clone()
}

fn read_dir(dir: &std::path::Path, base: &std::path::Path, out: &mut HashMap<String, String>) {
    for e in std::fs::read_dir(dir).unwrap().flatten() {
        let p = e.path();
        if p.is_dir() {
            read_dir(&p, base, out);
        } else {
            let rel = p.strip_prefix(base).unwrap().to_string_lossy().replace('\\', "/");
            out.insert(rel, base64::engine::general_purpose::STANDARD.encode(std::fs::read(&p).unwrap()));
        }
    }
}

fn main() {
    let a: Vec<String> = std::env::args().collect();
    let cfg: Value = serde_json::from_str(&std::fs::read_to_string(&a[1]).unwrap()).unwrap();
    let room = &cfg["room"];
    let openings = cfg["openings"].clone();
    let mut scene = data("add_space", json!({"scene": {"name": "Salon", "levels": [{"id": "L0"}]}, "space": {"name": "Salon", "width": room["width"], "depth": room["depth"], "height": room["height"], "source": "foto"}, "openings": openings}))["scene"].clone();
    if let Some(c) = room.get("wall_color") {
        scene["materials"].as_array_mut().unwrap().push(json!({"id": "boya-ozel", "name": "Duvar", "category": "duvar", "color": c, "roughness": 0.85}));
        scene["interior"] = json!("boya-ozel");
    }
    if let Some(f) = room.get("floor").and_then(|f| f.as_str()) {
        for lv in scene["levels"].as_array_mut().unwrap() {
            for r in lv["rooms"].as_array_mut().unwrap() {
                r["floor"] = json!(f);
            }
        }
    }
    if let Some(az) = cfg.get("sun_azimuth") {
        scene["sun"]["azimuth"] = az.clone();
    }
    for o in cfg["catalog"].as_array().into_iter().flatten() {
        let n = scene["objects"].as_array().unwrap().len() + 1;
        scene["objects"].as_array_mut().unwrap().push(json!({"id": format!("C{n}"), "name": o["id"], "mesh": format!("cat:{}", o["id"].as_str().unwrap()), "level": "L0", "position": [o["at"][0], o["at"][1], o.get("z").cloned().unwrap_or(json!(0.0))], "rotation": o.get("rot").cloned().unwrap_or(json!(0.0)), "material": o.get("material").cloned().unwrap_or(Value::Null)}));
    }
    for m in cfg["models"].as_array().into_iter().flatten() {
        let dir = std::path::PathBuf::from(m["dir"].as_str().unwrap());
        let mut files = HashMap::new();
        read_dir(&dir, &dir, &mut files);
        let r = data("import_gltf", json!({"scene": scene, "files": files, "main": m["main"], "name": m["main"], "at": m["at"], "z": m.get("z").cloned().unwrap_or(json!(0.0)), "license": "Poly Haven · CC0"}));
        scene = r["scene"].clone();
        let oid = r["object"].as_str().unwrap().to_string();
        for o in scene["objects"].as_array_mut().unwrap() {
            if o["id"] == oid.as_str() {
                o["rotation"] = m.get("rot").cloned().unwrap_or(json!(0.0));
                if let Some(s) = m.get("scale") {
                    o["scale"] = json!([s, s, s]);
                }
            }
        }
        eprintln!("{}: {} üçgen, {:?}", m["main"], r["triangles"], r["size"]);
    }
    let mut settings = cfg["render"].clone();
    for k in ["eye", "target", "fov"] {
        settings[k] = cfg["camera"][k].clone();
    }
    let pkg = data("export_cycles", json!({"scene": scene, "settings": settings, "tile": 1024}));
    std::fs::write(&a[2], pkg.to_string()).unwrap();
    eprintln!("{}: {} üçgen", a[2], pkg["triangles"]);
    if let Some(png) = a.get(3) {
        let r = data("render", json!({"scene": scene, "settings": settings}));
        std::fs::write(png, base64::engine::general_purpose::STANDARD.decode(r["png"].as_str().unwrap()).unwrap()).unwrap();
        eprintln!("{png}: dahili render {:.0} ms", r["ms"].as_f64().unwrap_or(0.0));
    }
}
