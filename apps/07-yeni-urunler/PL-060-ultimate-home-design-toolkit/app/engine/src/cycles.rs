//! Cycles (Blender) render motoru için sahne paketi.
//!
//! Dahili ışın izleyicinin yanında, fotoğraf gerçekliğinde çıktı için sahne Blender'ın Cycles
//! motoruna aktarılır. Paket yalnız veridir: üçgenler (malzemeye göre), PBR malzemeleri,
//! dokular (PNG, base64), pencere ışık portalları, güneş/gökyüzü, kamera ve görüntü ayarları.
//! Paketi `cycles/uhd_cycles.py` okur ve render eder. Koordinatlar dünya milimetresidir (Y yukarı).

use crate::mesh;
use crate::model::{OpeningKind, Scene};
use crate::render::{self, RenderSettings};
use base64::Engine;
use serde_json::{json, Value};

pub const FORMAT: &str = "uhd-cycles/1";

fn round1(v: f32) -> f32 {
    (v * 10.0).round() / 10.0
}

/// Pencerelerin iç yüzüne konacak ışık portalları: merkez, genişlik, yükseklik, duvar yönü ve içe bakan normal.
fn portals(scene: &Scene, s: &RenderSettings) -> Vec<Value> {
    let mut out = vec![];
    for l in &scene.levels {
        if !s.mesh.levels.is_empty() && !s.mesh.levels.contains(&l.id) {
            continue;
        }
        for o in l.openings.iter().filter(|o| o.kind == OpeningKind::Window) {
            let Some(w) = l.walls.iter().find(|w| w.id == o.wall) else { continue };
            let len = w.length();
            if len < 1.0 || w.outside == 0 {
                continue;
            }
            let d = [(w.b[0] - w.a[0]) / len, (w.b[1] - w.a[1]) / len];
            let right = [d[1], -d[0]];
            let side = if w.outside >= 0 { 1.0 } else { -1.0 };
            // içe bakan yön: dış yüzün tersi
            let inward = [-right[0] * side, -right[1] * side];
            let mid = o.offset + o.width / 2.0;
            let c = [w.a[0] + d[0] * mid + inward[0] * (w.thickness / 2.0 + 5.0), w.a[1] + d[1] * mid + inward[1] * (w.thickness / 2.0 + 5.0)];
            let y = l.elevation + o.sill + o.height / 2.0;
            out.push(json!({"center": [c[0], y, c[1]], "width": o.width, "height": o.height, "along": [d[0], 0.0, d[1]], "inward": [inward[0], 0.0, inward[1]]}));
        }
    }
    out
}

/// Sahne paketini üretir. `tile` prosedürel desen karosunun piksel kenarıdır.
pub fn export(scene: &Scene, s: &RenderSettings, tile: usize) -> Result<Value, String> {
    let m = mesh::build(scene, &s.mesh);
    if m.batches.is_empty() {
        return Err("@render_empty".into());
    }
    let e = base64::engine::general_purpose::STANDARD;
    let tile = tile.clamp(64, 2048);
    let mut materials = vec![];
    let mut batches = vec![];
    for b in &m.batches {
        let mat = scene.material(&b.material).cloned().unwrap_or_default();
        let texture = if let Some(id) = mat.texture.strip_prefix("img:") {
            scene.textures.iter().find(|t| t.id == id).and_then(|t| {
                let rgb = e.decode(&t.rgb).ok()?;
                let rgba: Vec<u8> = rgb.chunks(3).flat_map(|c| [c[0], c[1], c[2], 255]).collect();
                let png = render::encode_png(&rgba, t.width, t.height).ok()?;
                Some(json!({"png": e.encode(png), "scale": mat.texture_scale, "kind": "image"}))
            })
        } else if crate::texture::KINDS.iter().any(|k| k.0 == mat.texture) {
            // desen, renk dahil karo olarak pişirilir; kabartı aynı karonun parlaklığından alınır
            let rgb = crate::texture::tile(&mat.texture, mat.color, mat.texture_scale, tile);
            let rgba: Vec<u8> = rgb.chunks(3).flat_map(|c| [c[0], c[1], c[2], 255]).collect();
            let png = render::encode_png(&rgba, tile as u32, tile as u32)?;
            Some(json!({"png": e.encode(png), "scale": mat.texture_scale, "kind": mat.texture}))
        } else {
            None
        };
        materials.push(json!({
            "id": mat.id, "color": mat.color, "roughness": mat.roughness, "metallic": mat.metallic,
            "emission": mat.emission, "opacity": mat.opacity, "category": mat.category, "texture": texture,
        }));
        let p: Vec<f32> = b.positions.iter().flat_map(|q| q.iter().map(|x| round1(*x))).collect();
        let n: Vec<f32> = b.normals.iter().flat_map(|q| q.iter().map(|x| (x * 1000.0).round() / 1000.0)).collect();
        batches.push(json!({"material": b.material, "positions": p, "normals": n}));
    }
    let eye = s.eye.unwrap_or(scene.camera.eye);
    let target = s.target.unwrap_or(scene.camera.target);
    let fov = s.fov.unwrap_or(scene.camera.fov).clamp(10.0, 120.0);
    let sky = render::sky_state(scene, s);
    Ok(json!({
        "format": FORMAT,
        "unit": "mm",
        "up": "y",
        "width": s.width.clamp(16, 7680),
        "height": s.height.clamp(16, 4320),
        "samples": s.samples.clamp(1, 16384),
        "bounces": s.bounces.clamp(1, 32),
        "style": render::style_id(&s.style),
        "camera": {"eye": eye, "target": target, "fov": fov, "projection": s.projection, "ortho_height": s.ortho_height, "aperture": s.aperture, "focus": s.focus},
        "sky": sky,
        "exposure": s.exposure,
        "auto_exposure": s.auto_exposure,
        "post": {"bloom": s.bloom, "vignette": s.vignette, "grain": s.grain, "sharpen": s.sharpen, "white_balance": s.white_balance},
        "materials": materials,
        "batches": batches,
        "portals": portals(scene, s),
        "triangles": m.triangle_count(),
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exports_demo_with_textures_lamps_and_portals() {
        let s = crate::templates::demo_scene();
        let set = RenderSettings { style: "editorial".into(), ..Default::default() };
        let v = export(&s, &set, 64).unwrap();
        assert_eq!(v["format"], FORMAT);
        assert_eq!(v["style"], "editorial");
        let mats = v["materials"].as_array().unwrap();
        assert_eq!(mats.len(), v["batches"].as_array().unwrap().len());
        assert!(mats.iter().any(|m| m["texture"]["png"].as_str().is_some_and(|p| p.len() > 100)), "dokular PNG olarak gömülür");
        assert!(mats.iter().any(|m| m["emission"].as_f64().unwrap_or(0.0) > 0.0), "lambalar ışık yayar");
        assert!(!v["portals"].as_array().unwrap().is_empty(), "pencerelere ışık portalı");
        let b = &v["batches"][0];
        assert_eq!(b["positions"].as_array().unwrap().len(), b["normals"].as_array().unwrap().len());
        assert!(v["sky"]["sun_direction"].as_array().unwrap().len() == 3);
    }

    #[test]
    fn portal_faces_into_the_room() {
        let s = crate::templates::demo_scene();
        let v = export(&s, &RenderSettings::default(), 64).unwrap();
        // demo modülleri x: 0–10000, y: 0–8000 aralığında; içe bakan normal merkeze yönelir
        for p in v["portals"].as_array().unwrap() {
            let c = &p["center"];
            let n = &p["inward"];
            let to_mid = [5000.0 - c[0].as_f64().unwrap(), 4000.0 - c[2].as_f64().unwrap()];
            assert!(to_mid[0] * n[0].as_f64().unwrap() + to_mid[1] * n[2].as_f64().unwrap() > 0.0, "{p}");
        }
    }
}
