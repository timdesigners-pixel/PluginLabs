//! Arayüzün tek giriş noktası: `call(komut, json) -> json`.
//! Yanıt her zaman `{"ok":true,"data":…}` ya da `{"ok":false,"error":"…"}` biçimindedir.

use crate::model::{Scene, Tier};
use crate::render::{Atmosphere, RenderSettings};
use crate::units::Unit;
use crate::{catalog, cost, formula, measure, mesh, modules, obj, photo, plan, render, scene_file, spaces, templates};
use base64::Engine;
use serde::Deserialize;
use serde_json::{json, Value};

pub const MAX_PAYLOAD: usize = 300 * 1024 * 1024;

fn arg<T: for<'de> Deserialize<'de>>(v: &Value, k: &str) -> Result<T, String> {
    serde_json::from_value(v.get(k).cloned().unwrap_or(Value::Null)).map_err(|e| format!("'{k}' alanı geçersiz: {e}"))
}
fn opt<T: for<'de> Deserialize<'de>>(v: &Value, k: &str) -> Option<T> {
    v.get(k).and_then(|x| serde_json::from_value(x.clone()).ok())
}
fn scene_of(v: &Value) -> Result<Scene, String> {
    arg::<Scene>(v, "scene")
}

pub fn call(cmd: &str, payload: &str) -> String {
    let r = if payload.len() > MAX_PAYLOAD { Err("İstek çok büyük".to_string()) } else { dispatch(cmd, payload) };
    match r {
        Ok(d) => json!({"ok": true, "data": d}).to_string(),
        Err(e) => json!({"ok": false, "error": e}).to_string(),
    }
}

/// Sahne üzerinde düzenleme yapan komutların ortak sonu: modülleri ve odaları yeniler.
fn finish(mut s: Scene, extra: Value) -> Result<Value, String> {
    let mut notes = modules::rebuild(&mut s);
    notes.extend(spaces::rebuild(&mut s));
    let warn = plan::refresh_rooms(&mut s);
    Ok(json!({"scene": s, "notes": notes, "roomWarnings": warn, "extra": extra}))
}

fn camera_preset(s: &Scene, name: &str, room: Option<&str>) -> Result<Value, String> {
    let m = mesh::build(s, &mesh::MeshOptions { ground: false, furniture: false, ..Default::default() });
    let (mn, mx) = m.bounds();
    if !mn[0].is_finite() {
        return Err("Sahne boş".into());
    }
    let c = [(mn[0] + mx[0]) as f64 / 2.0, (mx[1] as f64) * 0.35, (mn[2] + mx[2]) as f64 / 2.0];
    let size = ((mx[0] - mn[0]).max(mx[2] - mn[2])) as f64;
    let dist = size * 1.25 + 6000.0;
    let h = mx[1] as f64;
    let (eye, target, fov) = match name {
        "on" => ([c[0] - size * 0.15, h * 0.55 + 1600.0, mn[2] as f64 - dist], c, 42.0),
        "arka" => ([c[0] + size * 0.15, h * 0.55 + 1600.0, mx[2] as f64 + dist], c, 42.0),
        "sag" => ([mx[0] as f64 + dist, h * 0.55 + 1600.0, c[2] - size * 0.15], c, 42.0),
        "sol" => ([mn[0] as f64 - dist, h * 0.55 + 1600.0, c[2] + size * 0.15], c, 42.0),
        "kusbakisi" => ([c[0] + 1.0, size * 1.6 + 8000.0, c[2] + size * 0.35], [c[0], 0.0, c[2]], 40.0),
        "perspektif" => ([mn[0] as f64 - size * 0.55, h + size * 0.75, mn[2] as f64 - size * 0.65], c, 45.0),
        "izometrik" => {
            // klasik izometri: 45° azimut, 35,264° yükseklik
            let d = size * 2.2 + 8000.0;
            let eye = [c[0] - d * 0.5774, c[1] + d * 0.5774, c[2] - d * 0.5774];
            return Ok(json!({"eye": eye, "target": c, "fov": 30.0, "projection": "isometric", "orthoHeight": size * 0.95 + h * 0.9 + 800.0}));
        }
        "ic" => {
            let level = s.levels.first().ok_or("Kat yok")?;
            let r = match room {
                Some(id) => s.levels.iter().flat_map(|l| l.rooms.iter()).find(|r| r.id == id),
                None => level.rooms.iter().max_by(|a, b| crate::geom::area(&a.polygon).partial_cmp(&crate::geom::area(&b.polygon)).unwrap()),
            }
            .ok_or("İç mekân için önce bir mahal adlandırın")?;
            let lv = s.levels.iter().find(|l| l.rooms.iter().any(|x| x.id == r.id)).unwrap();
            let (a, b) = crate::geom::bbox(&r.polygon);
            let y = lv.elevation + 1500.0;
            let wide = b[0] - a[0] >= b[1] - a[1];
            if wide {
                ([a[0] + 250.0, y, a[1] + 250.0], [b[0], lv.elevation + 900.0, (a[1] + b[1]) / 2.0], 72.0)
            } else {
                ([a[0] + 250.0, y, a[1] + 250.0], [(a[0] + b[0]) / 2.0, lv.elevation + 900.0, b[1]], 72.0)
            }
        }
        _ => return Err("Bilinmeyen kamera açısı".into()),
    };
    Ok(json!({"eye": eye, "target": target, "fov": fov}))
}

/// MyMind'a gidecek veri azaltılmış özet: kişisel ad, proje numarası, dosya yolu ve fiyat içermez.
pub fn mymind_summary(s: &Scene) -> String {
    let m = measure::measure(s);
    let mut lines = vec![];
    use crate::units::fmt_tr;
    lines.push(format!("Konut: {} modül, {} kat, net alan yaklaşık {} m².", s.modules.len(), s.levels.len(), fmt_tr(m.totals.floor_area_m2, 0)));
    for r in &m.rooms {
        let kind = plan::ROOM_KINDS.iter().find(|k| k.0 == r.kind).map(|k| k.1).unwrap_or("Mahal");
        lines.push(format!("- {} ({}): {} m², {} pencere, {} kapı, gün ışığı oranı %{}", kind, r.name.chars().take(30).collect::<String>(), fmt_tr(r.area_m2, 1), r.windows, r.doors, fmt_tr(r.daylight_ratio * 100.0, 0)));
    }
    let mut counts: std::collections::BTreeMap<String, u32> = Default::default();
    for o in &s.objects {
        *counts.entry(o.name.clone()).or_default() += o.quantity.max(1);
    }
    if !counts.is_empty() {
        lines.push(format!("Donatı: {}.", counts.iter().map(|(k, v)| format!("{v} {k}")).collect::<Vec<_>>().join(", ")));
    }
    lines.push(format!("Kalite düzeyi: {}.", s.cost.tier.label()));
    lines.join("\n")
}

fn dispatch(cmd: &str, payload: &str) -> Result<Value, String> {
    let v: Value = if payload.trim().is_empty() { json!({}) } else { serde_json::from_str(payload).map_err(|e| format!("JSON okunamadı: {e}"))? };
    match cmd {
        "info" => Ok(json!({"product": crate::PRODUCT, "version": crate::VERSION, "format": format!("{}/{}", scene_file::FORMAT, scene_file::VERSION), "extension": scene_file::EXTENSION})),
        "demo" => finish(templates::demo_scene(), json!(null)),
        "new" => {
            let no: String = opt(&v, "projectNo").unwrap_or_else(|| "UHD-2026-000000".into());
            Ok(json!({"scene": templates::new_project(&no)}))
        }
        "catalog" => Ok(json!({
            "furniture": catalog::items(),
            "previews": catalog::items().iter().map(|i| (i.id.to_string(), catalog::parts(i.id).iter().map(|p| json!({"min": p.min, "max": p.max, "material": p.material})).collect::<Vec<_>>())).collect::<std::collections::BTreeMap<_, _>>(),
            "modules": modules::specs(),
            "openings": plan::standard_openings(),
            "roomKinds": plan::ROOM_KINDS.iter().map(|(k, l)| json!({"id": k, "label": l})).collect::<Vec<_>>(),
            "units": ["mm", "cm", "m", "in", "ft"],
        })),
        // ---- Model ve katlar
        "set_modules" => {
            let mut s = scene_of(&v)?;
            let counts: Vec<(u32, u32)> = arg(&v, "counts")?;
            let two: bool = opt(&v, "twoStorey").unwrap_or(false);
            let keep: Vec<crate::model::Module> = s.modules.clone();
            let mut next = templates::layout_modules(&counts);
            // aynı sıradaki modüllerin konumunu koru
            for (i, m) in next.iter_mut().enumerate() {
                if let Some(old) = keep.iter().filter(|k| k.floor == 0).nth(i) {
                    if old.length == m.length {
                        m.position = old.position;
                        m.rotated = old.rotated;
                    }
                }
            }
            if two {
                for u in keep.iter().filter(|m| m.floor == 1) {
                    if next.iter().any(|g| Some(&g.id) == u.on.as_ref()) {
                        next.push(u.clone());
                    }
                }
            }
            s.modules = next;
            if !two {
                s.levels.retain(|l| l.id == "L0");
            }
            finish(s, json!(null))
        }
        "move_module" => {
            let mut s = scene_of(&v)?;
            let id: String = arg(&v, "id")?;
            let pos: [f64; 2] = arg(&v, "position")?;
            let p = modules::snap(&s, &id, pos, opt(&v, "tolerance").unwrap_or(400.0));
            let m = s.modules.iter_mut().find(|m| m.id == id).ok_or("Modül bulunamadı")?;
            if m.floor > 0 {
                return Err("Üst kat modülü serbest kaydırılamaz".into());
            }
            m.position = p;
            let ov = modules::overlaps(&s);
            finish(s, json!({"overlaps": ov}))
        }
        "rotate_module" => {
            let mut s = scene_of(&v)?;
            let id: String = arg(&v, "id")?;
            let m = s.modules.iter_mut().find(|m| m.id == id).ok_or("Modül bulunamadı")?;
            if m.floor > 0 {
                return Err("Üst kat modülü alttaki modülle birlikte döner".into());
            }
            // merkez etrafında 90°
            let l = m.length as f64 * 1000.0;
            let (w, d) = if m.rotated { (modules::WIDTH, l) } else { (l, modules::WIDTH) };
            let c = [m.position[0] + w / 2.0, m.position[1] + d / 2.0];
            m.rotated = !m.rotated;
            m.position = [((c[0] - d / 2.0) / 100.0).round() * 100.0, ((c[1] - w / 2.0) / 100.0).round() * 100.0];
            let ov = modules::overlaps(&s);
            finish(s, json!({"overlaps": ov}))
        }
        "toggle_upper" => {
            let mut s = scene_of(&v)?;
            let ground: String = arg(&v, "ground")?;
            if !s.modules.iter().any(|m| m.id == ground && m.floor == 0) {
                return Err("Zemin modülü bulunamadı".into());
            }
            if let Some(i) = s.modules.iter().position(|m| m.floor == 1 && m.on.as_deref() == Some(&ground)) {
                s.modules.remove(i);
            } else {
                let n = s.modules.len() + 1;
                s.modules.push(crate::model::Module { id: format!("U{n}"), floor: 1, on: Some(ground), ..Default::default() });
            }
            if !s.modules.iter().any(|m| m.floor == 1) {
                s.levels.retain(|l| l.id == "L0");
            }
            finish(s, json!(null))
        }
        // ---- İç plan
        "add_partition" => {
            let mut s = scene_of(&v)?;
            let level: String = arg(&v, "level")?;
            let a: [f64; 2] = arg(&v, "a")?;
            let b: [f64; 2] = arg(&v, "b")?;
            let n = s.levels.iter().map(|l| l.walls.len()).sum::<usize>() + 1;
            let mut k = n;
            let id = loop {
                let c = format!("B{k}");
                if !s.levels.iter().any(|l| l.walls.iter().any(|w| w.id == c)) {
                    break c;
                }
                k += 1;
            };
            let w = plan::partition(&s, a, b, id, opt(&v, "thickness"))?;
            s.levels.iter_mut().find(|l| l.id == level).ok_or("Kat bulunamadı")?.walls.push(w.clone());
            finish(s, json!({"wall": w}))
        }
        "name_room" => {
            let mut s = scene_of(&v)?;
            let level: String = arg(&v, "level")?;
            let p: [f64; 2] = arg(&v, "point")?;
            let kind: String = arg(&v, "kind")?;
            let r = plan::name_room(&mut s, &level, p, &kind, opt(&v, "name"))?;
            finish(s, json!({"room": r}))
        }
        "detect_room" => {
            let s = scene_of(&v)?;
            let level: String = arg(&v, "level")?;
            let p: [f64; 2] = arg(&v, "point")?;
            let l = s.levels.iter().find(|l| l.id == level).ok_or("Kat bulunamadı")?;
            Ok(serde_json::to_value(plan::detect_room(l, p)?).unwrap())
        }
        "place_opening" => {
            let mut s = scene_of(&v)?;
            let level: String = arg(&v, "level")?;
            let p: [f64; 2] = arg(&v, "point")?;
            let std: String = arg(&v, "std")?;
            let n = s.levels.iter().map(|l| l.openings.len()).sum::<usize>() + 1;
            let l = s.levels.iter_mut().find(|l| l.id == level).ok_or("Kat bulunamadı")?;
            let mut k = n;
            let id = loop {
                let c = format!("A{k}");
                if !l.openings.iter().any(|o| o.id == c) {
                    break c;
                }
                k += 1;
            };
            let o = plan::place_opening(l, &std, p, id)?;
            l.openings.push(o.clone());
            finish(s, json!({"opening": o}))
        }
        "validate_opening" => {
            let s = scene_of(&v)?;
            let level: String = arg(&v, "level")?;
            let o: crate::model::Opening = arg(&v, "opening")?;
            let l = s.levels.iter().find(|l| l.id == level).ok_or("Kat bulunamadı")?;
            plan::validate_opening(l, &o)?;
            Ok(json!(true))
        }
        "refresh" => finish(scene_of(&v)?, json!(null)),
        "nearest_wall" => {
            let s = scene_of(&v)?;
            let level: String = arg(&v, "level")?;
            let p: [f64; 2] = arg(&v, "point")?;
            let l = s.levels.iter().find(|l| l.id == level).ok_or("Kat bulunamadı")?;
            Ok(json!(plan::nearest_wall(l, p)))
        }
        // ---- Ölçü, maliyet, fonksiyon
        "measure" => {
            let s = scene_of(&v)?;
            let m = measure::measure(&s);
            let mut vars = measure::variables(&s, &m);
            let fr = measure::run_measure_functions(&s, &mut vars);
            Ok(json!({"report": m, "functions": fr, "variables": vars}))
        }
        "estimate" => {
            let mut s = scene_of(&v)?;
            if let Some(t) = opt::<Tier>(&v, "tier") {
                s.cost.tier = t;
            }
            Ok(serde_json::to_value(cost::estimate(&s)).unwrap())
        }
        "scaling" => {
            let s = scene_of(&v)?;
            let factors: Vec<f64> = opt(&v, "factors").unwrap_or_else(|| vec![0.5, 0.75, 1.0, 1.25, 1.5, 2.0]);
            let units: Vec<u32> = opt(&v, "units").unwrap_or_else(|| vec![1, 2, 5, 10, 25, 50]);
            Ok(serde_json::to_value(cost::scaling(&s, &factors, &units)).unwrap())
        }
        "eval_formula" => {
            let s = scene_of(&v)?;
            let expr: String = arg(&v, "expr")?;
            let m = measure::measure(&s);
            let mut vars = measure::variables(&s, &m);
            measure::run_measure_functions(&s, &mut vars);
            let used = formula::variables(&expr)?;
            let val = formula::evaluate(&expr, &vars)?;
            Ok(json!({"value": val, "uses": used}))
        }
        // ---- 3B, render, dosyalar
        "mesh" => {
            let s = scene_of(&v)?;
            let o: mesh::MeshOptions = opt(&v, "options").unwrap_or_default();
            let m = mesh::build(&s, &o);
            let groups: Vec<Value> = m
                .batches
                .iter()
                .map(|b| {
                    let mat = s.material(&b.material).cloned().unwrap_or_default();
                    let p: Vec<f32> = b.positions.iter().flat_map(|p| p.iter().map(|x| (x * 10.0).round() / 10.0)).collect();
                    let n: Vec<f32> = b.normals.iter().flat_map(|p| p.iter().map(|x| (x * 1000.0).round() / 1000.0)).collect();
                    json!({"material": b.material, "color": mat.color, "roughness": mat.roughness, "metallic": mat.metallic, "emission": mat.emission, "opacity": mat.opacity, "textured": !mat.texture.is_empty(), "scale": mat.texture_scale, "positions": p, "normals": n})
                })
                .collect();
            Ok(json!({"groups": groups, "triangles": m.triangle_count(), "bounds": m.bounds()}))
        }
        "camera_preset" => {
            let s = scene_of(&v)?;
            let name: String = arg(&v, "name")?;
            camera_preset(&s, &name, opt::<String>(&v, "room").as_deref())
        }
        "render" => {
            let s = scene_of(&v)?;
            let mut set: RenderSettings = opt(&v, "settings").unwrap_or_default();
            if let Some(a) = opt::<Atmosphere>(&v, "atmosphere") {
                set.atmosphere = a;
            }
            let t0 = now_ms();
            let r = render::render(&s, &set)?;
            let b64 = base64::engine::general_purpose::STANDARD.encode(&r.png);
            Ok(json!({"png": b64, "width": r.width, "height": r.height, "triangles": r.triangles, "samples": r.samples, "threads": r.threads, "rays": r.rays, "ms": now_ms() - t0}))
        }
        "export_cycles" => {
            let s = scene_of(&v)?;
            let mut set: RenderSettings = opt(&v, "settings").unwrap_or_default();
            if let Some(a) = opt::<Atmosphere>(&v, "atmosphere") {
                set.atmosphere = a;
            }
            crate::cycles::export(&s, &set, opt::<usize>(&v, "tile").unwrap_or(1024))
        }
        "import_obj" => {
            let mut s = scene_of(&v)?;
            let text: String = arg(&v, "obj")?;
            let mtl: Option<String> = opt(&v, "mtl");
            let unit = opt::<String>(&v, "unit").and_then(|u| Unit::parse(&u)).unwrap_or(Unit::M);
            let z_up: bool = opt(&v, "zUp").unwrap_or(false);
            let name: String = opt(&v, "name").unwrap_or_else(|| "Model".into());
            let mut k = s.meshes.len() + 1;
            let id = loop {
                let c = format!("obj{k}");
                if !s.meshes.iter().any(|m| m.id == c) {
                    break c;
                }
                k += 1;
            };
            let imp = obj::import(&id, &name, &text, mtl.as_deref(), unit, z_up)?;
            for m in &imp.materials {
                if !s.materials.iter().any(|x| x.id == m.id) {
                    s.materials.push(m.clone());
                }
            }
            s.meshes.push(imp.mesh.clone());
            if opt::<bool>(&v, "place").unwrap_or(true) {
                let at: [f64; 2] = opt(&v, "at").unwrap_or([1000.0, 1000.0]);
                let level: String = opt(&v, "level").unwrap_or_else(|| "L0".into());
                let n = s.objects.len() + 1;
                s.objects.push(crate::model::Object { id: format!("N{n}x"), name: imp.mesh.name.clone(), mesh: id.clone(), level, position: [at[0], at[1], 0.0], ..Default::default() });
            }
            Ok(json!({"scene": s, "id": id, "triangles": imp.triangles, "size": imp.size_mm, "warnings": imp.warnings}))
        }
        "export_obj" => {
            let s = scene_of(&v)?;
            let o: mesh::MeshOptions = opt(&v, "options").unwrap_or(mesh::MeshOptions { ground: false, ..Default::default() });
            let m = mesh::build(&s, &o);
            let base: String = opt(&v, "basename").unwrap_or_else(|| "ev".into());
            let base = crate::formula::slug(&base);
            let base = if base.is_empty() { "ev".to_string() } else { base };
            let (o_txt, m_txt) = obj::export(&s, &m, &format!("{base}.mtl"));
            Ok(json!({"obj": o_txt, "mtl": m_txt, "triangles": m.triangle_count(), "basename": base}))
        }
        "photo_room" => {
            let inp: photo::PhotoInput = arg(&v, "photo")?;
            Ok(json!(photo::fit(&inp)?))
        }
        "add_space" => {
            let mut s = scene_of(&v)?;
            let sp: spaces::Space = arg(&v, "space")?;
            let openings: Vec<photo::FitOpening> = opt(&v, "openings").unwrap_or_default();
            let cam: Option<photo::FitCamera> = opt(&v, "camera");
            let beside: Option<String> = opt(&v, "beside");
            let side: String = opt(&v, "side").unwrap_or_else(|| "sag".into());
            let (id, notes) = spaces::add(&mut s, sp, &openings, cam.as_ref(), beside.as_deref(), &side)?;
            if let Some(c) = s.spaces.iter().find(|x| x.id == id).and_then(|x| x.camera.clone()) {
                s.camera = c;
            }
            finish(s, json!({"id": id, "notes": notes}))
        }
        "set_space" => {
            let mut s = scene_of(&v)?;
            let id: String = arg(&v, "id")?;
            if let Some(name) = opt::<String>(&v, "name") {
                if let Some(sp) = s.spaces.iter_mut().find(|x| x.id == id) {
                    sp.name = name.chars().take(40).collect();
                }
            }
            let notes = spaces::resize(&mut s, &id, opt(&v, "width"), opt(&v, "depth"), opt(&v, "height"), opt(&v, "lock").unwrap_or(false))?;
            finish(s, json!({"id": id, "notes": notes}))
        }
        "archive_space" => {
            let mut s = scene_of(&v)?;
            let id: String = arg(&v, "id")?;
            spaces::archive(&mut s, &id)?;
            finish(s, json!({"id": id}))
        }
        "reference_image" => {
            let s = scene_of(&v)?;
            let w: usize = arg(&v, "width")?;
            let h: usize = arg(&v, "height")?;
            let b64: String = arg(&v, "rgb")?;
            let rgb = base64::engine::general_purpose::STANDARD.decode(b64).map_err(|_| "Görsel verisi okunamadı".to_string())?;
            Ok(serde_json::to_value(crate::reference::analyze(&s, w, h, &rgb)?).unwrap())
        }
        "motor_defaults" => Ok(crate::motors::defaults()),
        "add_texture" => {
            let mut s = scene_of(&v)?;
            let name: String = opt(&v, "name").unwrap_or_else(|| "Doku".into());
            let id = crate::texture::add_texture(&mut s, &name, arg(&v, "width")?, arg(&v, "height")?, &arg::<String>(&v, "rgb")?)?;
            Ok(json!({"scene": s, "id": id, "look": format!("img:{id}")}))
        }
        "texture_tiles" => {
            // 3B önizleme için: dokulu her malzemenin tekrar eden karosu
            let s = scene_of(&v)?;
            let size: usize = opt::<usize>(&v, "size").unwrap_or(64).clamp(16, 128);
            let mut out = serde_json::Map::new();
            for m in s.materials.iter().filter(|m| !m.texture.is_empty()) {
                let e = base64::engine::general_purpose::STANDARD;
                if let Some(id) = m.texture.strip_prefix("img:") {
                    if let Some(t) = s.textures.iter().find(|t| t.id == id) {
                        out.insert(m.id.clone(), json!({"width": t.width, "height": t.height, "rgb": t.rgb, "scale": m.texture_scale}));
                    }
                } else if crate::texture::KINDS.iter().any(|k| k.0 == m.texture) {
                    out.insert(m.id.clone(), json!({"width": size, "height": size, "rgb": e.encode(crate::texture::tile(&m.texture, m.color, m.texture_scale, size)), "scale": m.texture_scale}));
                }
            }
            Ok(Value::Object(out))
        }
        "texture_kinds" => Ok(json!(crate::texture::KINDS.iter().map(|(k, l)| json!({"id": k, "label": l})).collect::<Vec<_>>())),
        "import_palette" => {
            let mut s = scene_of(&v)?;
            let name: String = opt(&v, "name").unwrap_or_else(|| "Palet".into());
            let ids = crate::palette::import(&mut s, &name, &arg::<String>(&v, "text")?)?;
            Ok(json!({"scene": s, "ids": ids}))
        }
        "elevation" => {
            let s = scene_of(&v)?;
            let side: String = opt(&v, "side").unwrap_or_else(|| "on".into());
            Ok(serde_json::to_value(crate::elevation::build(&s, &side)?).unwrap())
        }
        "object_render" => {
            // Stüdyo önizlemesi: tek ürün, nötr zemin, yumuşak gün ışığı, yol izleme.
            let base = scene_of(&v)?;
            let mut s = templates::new_project("onizleme");
            s.materials = base.materials.clone();
            s.textures = base.textures.clone();
            s.levels[0].elevation = 0.0;
            if !s.materials.iter().any(|m| m.id == "studyo") {
                s.materials.push(crate::model::Material { id: "studyo".into(), name: "Stüdyo zemini".into(), color: [0.78, 0.78, 0.77], roughness: 1.0, category: "dis".into(), ..Default::default() });
            }
            let mut obj = crate::model::Object { id: "N1".into(), rotation: opt(&v, "rotation").unwrap_or(-28.0), position: [5000.0, 4000.0, 0.0], ..Default::default() };
            let size: [f64; 3];
            if let Some(kind) = opt::<String>(&v, "motor") {
                let g = crate::motors::generate(&kind, v.get("params").cloned().unwrap_or(json!({})), "onizleme")?;
                for m in &g.materials {
                    if !s.materials.iter().any(|x| x.id == m.id) {
                        s.materials.push(m.clone());
                    }
                }
                size = g.size;
                obj.mesh = "onizleme".into();
                s.meshes.push(g.mesh);
            } else if let Some(cat) = opt::<String>(&v, "cat") {
                let it = catalog::item(&cat).ok_or("Ürün bulunamadı")?;
                size = it.size;
                obj.mesh = format!("cat:{cat}");
                obj.material = opt::<String>(&v, "material").filter(|m| !m.is_empty());
            } else {
                let id: String = arg(&v, "mesh")?;
                let a = base.meshes.iter().find(|m| m.id == id).ok_or("Model bulunamadı")?;
                let (mut mn, mut mx) = ([f32::INFINITY; 3], [f32::NEG_INFINITY; 3]);
                for p in &a.positions {
                    for k in 0..3 {
                        mn[k] = mn[k].min(p[k]);
                        mx[k] = mx[k].max(p[k]);
                    }
                }
                size = [(mx[0] - mn[0]) as f64, (mx[2] - mn[2]) as f64, (mx[1] - mn[1]) as f64];
                obj.mesh = id;
                s.meshes.push(a.clone());
            }
            s.objects.push(obj);
            let big = size[0].max(size[1]).max(size[2]).max(200.0);
            let dist = big * 2.1 + 600.0;
            let set = RenderSettings {
                width: opt::<u32>(&v, "width").unwrap_or(640).clamp(64, 1920),
                height: opt::<u32>(&v, "height").unwrap_or(480).clamp(64, 1080),
                samples: opt::<u32>(&v, "samples").unwrap_or(32).clamp(1, 512),
                bounces: 4,
                eye: Some([5000.0 + dist * 0.62, size[2] * 0.55 + dist * 0.42, 4000.0 + dist * 0.68]),
                target: Some([5000.0, size[2] * 0.45, 4000.0]),
                fov: Some(34.0),
                sky: Some(render::SkySettings { hour: 10.5, cloud: 0.35, haze: 0.2, ..Default::default() }),
                mesh: mesh::MeshOptions { ground_material: "studyo".into(), ..Default::default() },
                ..Default::default()
            };
            let r = render::render(&s, &set)?;
            Ok(json!({"png": base64::engine::general_purpose::STANDARD.encode(&r.png), "width": r.width, "height": r.height, "triangles": r.triangles, "samples": r.samples}))
        }
        "motor_preview" => {
            let kind: String = arg(&v, "kind")?;
            let g = crate::motors::generate(&kind, v.get("params").cloned().unwrap_or(json!({})), "onizleme")?;
            let base = templates::default_materials();
            let groups: Vec<Value> = g
                .mesh
                .groups
                .iter()
                .map(|gr| {
                    let mat = g.materials.iter().chain(base.iter()).find(|m| m.id == gr.material).cloned().unwrap_or_default();
                    let pos: Vec<f32> = g.mesh.indices[gr.start as usize..(gr.start + gr.count) as usize].iter().flat_map(|&i| g.mesh.positions[i as usize].map(|x| x.round())).collect();
                    let nrm: Vec<f32> = g.mesh.indices[gr.start as usize..(gr.start + gr.count) as usize].iter().flat_map(|&i| g.mesh.normals[i as usize].map(|x| (x * 1000.0).round() / 1000.0)).collect();
                    json!({"material": gr.material, "color": mat.color, "opacity": mat.opacity, "roughness": mat.roughness, "metallic": mat.metallic, "emission": mat.emission, "textured": !mat.texture.is_empty(), "scale": mat.texture_scale, "texture": mat.texture, "positions": pos, "normals": nrm})
                })
                .collect();
            Ok(json!({"groups": groups, "size": g.size, "price": g.price, "name": g.name, "triangles": g.triangles}))
        }
        "motor" => {
            let mut s = scene_of(&v)?;
            let kind: String = arg(&v, "kind")?;
            let params = v.get("params").cloned().unwrap_or(json!({}));
            let mut k = s.meshes.len() + 1;
            let id = loop {
                let c = format!("motor{k}");
                if !s.meshes.iter().any(|m| m.id == c) {
                    break c;
                }
                k += 1;
            };
            let g = crate::motors::generate(&kind, params.clone(), &id)?;
            for m in &g.materials {
                if !s.materials.iter().any(|x| x.id == m.id) {
                    s.materials.push(m.clone());
                }
            }
            let at: [f64; 2] = opt(&v, "at").unwrap_or([1500.0, 1500.0]);
            let level: String = opt(&v, "level").unwrap_or_else(|| "L0".into());
            let mut n = s.objects.len() + 1;
            let oid = loop {
                let c = format!("N{n}");
                if !s.objects.iter().any(|o| o.id == c) {
                    break c;
                }
                n += 1;
            };
            s.objects.push(crate::model::Object { id: oid.clone(), name: g.name.clone(), mesh: id.clone(), level, position: [at[0], at[1], g.mount], rotation: opt(&v, "rotation").unwrap_or(0.0), price: g.price, motor: Some(json!({"kind": kind, "params": params})), ..Default::default() });
            s.meshes.push(g.mesh);
            Ok(json!({"scene": s, "object": oid, "mesh": id, "size": g.size, "price": g.price, "triangles": g.triangles}))
        }
        "save_scene" => Ok(json!({"text": scene_file::save(&scene_of(&v)?)?})),
        "load_scene" => {
            let text: String = arg(&v, "text")?;
            let (s, info) = scene_file::load(&text)?;
            Ok(json!({"scene": s, "info": info}))
        }
        "check" => {
            let s = scene_of(&v)?;
            Ok(json!(check(&s)))
        }
        "mymind_summary" => Ok(json!({"text": mymind_summary(&scene_of(&v)?)})),
        _ => Err(format!("Bilinmeyen komut: {cmd}")),
    }
}

/// Proje kontrolü: teslim öncesi uyarılar.
pub fn check(s: &Scene) -> Vec<Value> {
    let mut out = vec![];
    let mut push = |level: &str, text: String| out.push(json!({"level": level, "text": text}));
    if s.modules.is_empty() {
        push("hata", "Henüz modül seçilmedi".into());
    }
    for (a, b) in modules::overlaps(s) {
        push("hata", format!("{a} ve {b} modülleri üst üste biniyor"));
    }
    let m = measure::measure(s);
    for w in &m.warnings {
        push("uyari", w.clone());
    }
    for l in &s.levels {
        if l.rooms.is_empty() && !l.walls.is_empty() {
            push("uyari", format!("{}: adlandırılmış mahal yok", l.name));
        }
        for r in &l.rooms {
            let rm = m.rooms.iter().find(|x| x.id == r.id);
            if rm.is_some_and(|x| x.doors == 0) && r.kind != "salon" {
                push("uyari", format!("{}: kapı bulunamadı", r.name));
            }
        }
        for o in &l.openings {
            if let Err(e) = plan::validate_opening(l, o) {
                push("hata", format!("{}: {e}", o.id));
            }
        }
        if l.id != "L0" && !s.objects.iter().any(|o| o.mesh == "cat:merdiven") {
            push("uyari", format!("{} için merdiven yerleştirilmedi", l.name));
        }
    }
    if !s.levels.iter().flat_map(|l| l.openings.iter()).any(|o| o.kind == crate::model::OpeningKind::Door && s.wall(&o.wall).is_some_and(|(_, w)| w.exterior)) && !s.modules.is_empty() {
        push("uyari", "Dış kapı yok".into());
    }
    out
}

fn now_ms() -> f64 {
    #[cfg(not(target_arch = "wasm32"))]
    {
        std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs_f64() * 1000.0).unwrap_or(0.0)
    }
    #[cfg(target_arch = "wasm32")]
    {
        0.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ok(r: &str) -> Value {
        let v: Value = serde_json::from_str(r).unwrap();
        assert_eq!(v["ok"], true, "{r}");
        v["data"].clone()
    }

    #[test]
    fn full_flow_through_json_api() {
        let d = ok(&call("new", r#"{"projectNo":"UHD-2026-123456"}"#));
        let s = d["scene"].clone();
        let d = ok(&call("set_modules", &json!({"scene": s, "counts": [[10, 1], [6, 1]]}).to_string()));
        let s = d["scene"].clone();
        assert_eq!(s["modules"].as_array().unwrap().len(), 2);
        let d = ok(&call("add_partition", &json!({"scene": s, "level": "L0", "a": [6000, 0], "b": [6000, 4000]}).to_string()));
        let s = d["scene"].clone();
        let d = ok(&call("name_room", &json!({"scene": s, "level": "L0", "point": [3000, 2000], "kind": "salon"}).to_string()));
        let s = d["scene"].clone();
        let d = ok(&call("place_opening", &json!({"scene": s, "level": "L0", "point": [4000, 0], "std": "dis-kapi"}).to_string()));
        let s = d["scene"].clone();
        let e: Value = serde_json::from_str(&call("place_opening", &json!({"scene": s, "level": "L0", "point": [200, 0], "std": "p140"}).to_string())).unwrap();
        assert_eq!(e["ok"], false);
        let d = ok(&call("toggle_upper", &json!({"scene": s, "ground": "M1"}).to_string()));
        let s = d["scene"].clone();
        assert_eq!(s["levels"].as_array().unwrap().len(), 2);
        let est = ok(&call("estimate", &json!({"scene": s}).to_string()));
        assert!(est["total"].as_f64().unwrap() > 0.0);
        let saved = ok(&call("save_scene", &json!({"scene": s}).to_string()));
        let back = ok(&call("load_scene", &json!({"text": saved["text"]}).to_string()));
        assert_eq!(back["info"]["modules"], 3);
        let cam = ok(&call("camera_preset", &json!({"scene": s, "name": "ic"}).to_string()));
        assert!(cam["fov"].as_f64().unwrap() > 60.0);
        let chk = ok(&call("check", &json!({"scene": s}).to_string()));
        assert!(chk.as_array().unwrap().iter().any(|x| x["text"].as_str().unwrap().contains("merdiven")));
        let m = ok(&call("motor", &json!({"scene": s, "kind": "perde", "params": {"kind": "tul", "width": 2000}, "at": [3000, 300]}).to_string()));
        let s = m["scene"].clone();
        assert_eq!(s["objects"].as_array().unwrap().last().unwrap()["motor"]["kind"], "perde");
        assert!(ok(&call("motor_preview", &json!({"kind": "havuz", "params": {"shape": "oval"}}).to_string()))["triangles"].as_u64().unwrap() > 50);
        let mesh = ok(&call("mesh", &json!({"scene": s, "options": {"roof": false}}).to_string()));
        assert!(mesh["triangles"].as_u64().unwrap() > 100);
    }

    #[test]
    fn textures_palette_elevation_and_studio_render() {
        let s = serde_json::to_value(templates::demo_scene()).unwrap();
        use base64::Engine as _;
        let raw: Vec<u8> = (0..16 * 16).flat_map(|i| if (i / 4 + i / 64) % 2 == 0 { [200u8, 40, 40] } else { [240, 230, 210] }).collect();
        let tx = ok(&call("add_texture", &json!({"scene": s, "name": "Kareli", "width": 16, "height": 16, "rgb": base64::engine::general_purpose::STANDARD.encode(&raw)}).to_string()));
        assert_eq!(tx["look"], "img:tx1");
        let s = tx["scene"].clone();
        let pv = ok(&call("motor_preview", &json!({"kind": "perde", "params": {"kind": "fon", "look": "img:tx1", "look_scale": 300}}).to_string()));
        assert!(pv["groups"].as_array().unwrap().iter().any(|g| g["texture"] == "img:tx1"));
        let m = ok(&call("motor", &json!({"scene": s, "kind": "perde", "params": {"kind": "fon", "look": "img:tx1"}}).to_string()));
        let s = m["scene"].clone();
        let tiles = ok(&call("texture_tiles", &json!({"scene": s, "size": 32}).to_string()));
        assert_eq!(tiles["parke-mese"]["width"], 32);
        assert!(tiles.as_object().unwrap().values().any(|t| t["width"] == 16), "yüklenen doku karosu döner");
        let pal = ok(&call("import_palette", &json!({"scene": s, "name": "Deneme", "text": "#AABBCC\n#102030"}).to_string()));
        assert_eq!(pal["ids"].as_array().unwrap().len(), 2);
        let el = ok(&call("elevation", &json!({"scene": s, "side": "on"}).to_string()));
        assert_eq!(el["openings"], 2);
        let r = ok(&call("object_render", &json!({"scene": s, "cat": "kanepe-3", "width": 96, "height": 72, "samples": 4}).to_string()));
        assert!(r["png"].as_str().unwrap().len() > 500);
        let r2 = ok(&call("object_render", &json!({"scene": s, "motor": "yatak", "params": {}, "width": 96, "height": 72, "samples": 2}).to_string()));
        assert!(r2["triangles"].as_u64().unwrap() > 1000);
    }

    #[test]
    fn mymind_summary_is_data_reduced() {
        let s = templates::demo_scene();
        let t = mymind_summary(&s);
        assert!(t.contains("m²"));
        assert!(!t.contains("₺") && !t.contains("UHD-") && !t.contains("price"));
        assert!(t.len() < 6000, "MyMind sınırı");
    }

    #[test]
    fn errors_are_json() {
        let v: Value = serde_json::from_str(&call("yok", "{}")).unwrap();
        assert_eq!(v["ok"], false);
        let v: Value = serde_json::from_str(&call("measure", "{bozuk")).unwrap();
        assert_eq!(v["ok"], false);
    }
}
