//! Wavefront OBJ/MTL içe ve dışa aktarma.

use crate::mesh::SceneMesh;
use crate::model::{Material, MeshAsset, MeshGroup, Scene};
use crate::units::Unit;
use serde::Serialize;
use std::collections::HashMap;

pub const MAX_OBJ_BYTES: usize = 64 * 1024 * 1024;
pub const MAX_VERTICES: usize = 3_000_000;
pub const MAX_TRIANGLES: usize = 3_000_000;

#[derive(Debug, Clone, Serialize)]
pub struct Imported {
    pub mesh: MeshAsset,
    pub materials: Vec<Material>,
    pub size_mm: [f32; 3],
    pub triangles: usize,
    pub warnings: Vec<String>,
}

fn parse_floats<'a>(it: impl Iterator<Item = &'a str>, n: usize) -> Option<Vec<f32>> {
    let v: Vec<f32> = it.take(n).filter_map(|x| x.parse::<f32>().ok()).filter(|x| x.is_finite()).collect();
    if v.len() == n {
        Some(v)
    } else {
        None
    }
}

/// MTL metnini ayrıştırır: Kd, Ks, Ns, d/Tr, Ke.
pub fn parse_mtl(text: &str, prefix: &str) -> Vec<Material> {
    let mut out: Vec<Material> = vec![];
    for line in text.lines() {
        let mut it = line.split_whitespace();
        let Some(k) = it.next() else { continue };
        match k {
            "newmtl" => {
                let name: String = it.collect::<Vec<_>>().join(" ");
                out.push(Material { id: format!("{prefix}{}", crate::formula::slug(&name)), name: name.chars().take(80).collect(), category: "ice-aktarilan".into(), ..Default::default() });
            }
            "Kd" => {
                if let (Some(m), Some(c)) = (out.last_mut(), parse_floats(it, 3)) {
                    m.color = [c[0].clamp(0.0, 1.0), c[1].clamp(0.0, 1.0), c[2].clamp(0.0, 1.0)];
                }
            }
            "Ns" => {
                if let (Some(m), Some(c)) = (out.last_mut(), parse_floats(it, 1)) {
                    m.roughness = (1.0 - (c[0] / 1000.0).clamp(0.0, 1.0).sqrt()).clamp(0.02, 1.0);
                }
            }
            "Pm" => {
                if let (Some(m), Some(c)) = (out.last_mut(), parse_floats(it, 1)) {
                    m.metallic = c[0].clamp(0.0, 1.0);
                }
            }
            "Pr" => {
                if let (Some(m), Some(c)) = (out.last_mut(), parse_floats(it, 1)) {
                    m.roughness = c[0].clamp(0.02, 1.0);
                }
            }
            "d" => {
                if let (Some(m), Some(c)) = (out.last_mut(), parse_floats(it, 1)) {
                    m.opacity = c[0].clamp(0.0, 1.0);
                }
            }
            "Tr" => {
                if let (Some(m), Some(c)) = (out.last_mut(), parse_floats(it, 1)) {
                    m.opacity = (1.0 - c[0]).clamp(0.0, 1.0);
                }
            }
            "Ke" => {
                if let (Some(m), Some(c)) = (out.last_mut(), parse_floats(it, 3)) {
                    m.emission = c.iter().cloned().fold(0.0, f32::max) * 8.0;
                }
            }
            _ => {}
        }
    }
    out
}

fn idx(tok: &str, n: usize) -> Option<usize> {
    let v: i64 = tok.parse().ok()?;
    let i = if v < 0 { n as i64 + v } else { v - 1 };
    if i >= 0 && (i as usize) < n {
        Some(i as usize)
    } else {
        None
    }
}

/// OBJ'yi içe aktarır. Model mm'ye çevrilir, tabanı y = 0'a, merkezi x/z = 0'a taşınır.
/// `z_up` true ise Z yukarı kabul edilir (çoğu CAD dışa aktarımı).
pub fn import(id: &str, name: &str, obj: &str, mtl: Option<&str>, unit: Unit, z_up: bool) -> Result<Imported, String> {
    if obj.len() > MAX_OBJ_BYTES {
        return Err("@obj_too_large".into());
    }
    let prefix = format!("{id}-");
    let mut materials = mtl.map(|t| parse_mtl(t, &prefix)).unwrap_or_default();
    let scale = unit.mm() as f32;
    let mut v: Vec<[f32; 3]> = vec![];
    let mut vn: Vec<[f32; 3]> = vec![];
    let mut out_p: Vec<[f32; 3]> = vec![];
    let mut out_n: Vec<[f32; 3]> = vec![];
    let mut indices: Vec<u32> = vec![];
    let mut groups: Vec<MeshGroup> = vec![];
    let mut cache: HashMap<(usize, Option<usize>), u32> = HashMap::new();
    let mut current = format!("{prefix}varsayilan");
    let mut warnings = vec![];
    let mut bad_faces = 0usize;
    let mut need_flat: Vec<bool> = vec![];
    for line in obj.lines() {
        let line = line.trim();
        let mut it = line.split_whitespace();
        let Some(k) = it.next() else { continue };
        match k {
            "v" => {
                if v.len() >= MAX_VERTICES {
                    return Err("@obj_too_many_vertices".into());
                }
                let Some(c) = parse_floats(it, 3) else { return Err(format!("@obj_bad_vertex|line={}", line.chars().take(60).collect::<String>().replace('|', "/"))) };
                let p = if z_up { [c[0], c[2], -c[1]] } else { [c[0], c[1], c[2]] };
                v.push([p[0] * scale, p[1] * scale, p[2] * scale]);
            }
            "vn" => {
                if let Some(c) = parse_floats(it, 3) {
                    vn.push(if z_up { [c[0], c[2], -c[1]] } else { [c[0], c[1], c[2]] });
                }
            }
            "usemtl" => {
                let name: String = it.collect::<Vec<_>>().join(" ");
                current = format!("{prefix}{}", crate::formula::slug(&name));
                if !materials.iter().any(|m| m.id == current) {
                    materials.push(Material { id: current.clone(), name: name.chars().take(80).collect(), category: "ice-aktarilan".into(), ..Default::default() });
                }
            }
            "f" => {
                let mut poly: Vec<(usize, Option<usize>)> = vec![];
                for t in it {
                    let mut parts = t.split('/');
                    let pi = parts.next().and_then(|x| idx(x, v.len()));
                    let _ti = parts.next();
                    let ni = parts.next().and_then(|x| if x.is_empty() { None } else { idx(x, vn.len()) });
                    match pi {
                        Some(p) => poly.push((p, ni)),
                        None => {
                            poly.clear();
                            break;
                        }
                    }
                }
                if poly.len() < 3 {
                    bad_faces += 1;
                    continue;
                }
                if groups.last().map_or(true, |g| g.material != current) {
                    groups.push(MeshGroup { material: current.clone(), start: indices.len() as u32, count: 0 });
                }
                for k in 1..poly.len() - 1 {
                    if indices.len() / 3 >= MAX_TRIANGLES {
                        return Err("@obj_too_many_triangles".into());
                    }
                    for key in [poly[0], poly[k], poly[k + 1]] {
                        let flat = key.1.is_none();
                        // normal yoksa köşeler paylaşılmaz (düz gölgeleme)
                        let i = if flat {
                            out_p.push(v[key.0]);
                            out_n.push([0.0, 0.0, 0.0]);
                            need_flat.push(true);
                            (out_p.len() - 1) as u32
                        } else {
                            *cache.entry(key).or_insert_with(|| {
                                out_p.push(v[key.0]);
                                out_n.push(vn[key.1.unwrap()]);
                                need_flat.push(false);
                                (out_p.len() - 1) as u32
                            })
                        };
                        indices.push(i);
                    }
                    groups.last_mut().unwrap().count += 3;
                }
            }
            _ => {}
        }
    }
    if indices.is_empty() {
        return Err("@obj_no_faces".into());
    }
    if bad_faces > 0 {
        warnings.push(format!("@obj_bad_faces|n={bad_faces}"));
    }
    // normal hesapla
    for t in indices.chunks(3) {
        let (a, b, c) = (out_p[t[0] as usize], out_p[t[1] as usize], out_p[t[2] as usize]);
        let e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        let e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        let l = (n[0] * n[0] + n[1] * n[1] + n[2] * n[2]).sqrt().max(1e-20);
        for &i in t {
            if need_flat[i as usize] {
                out_n[i as usize] = [n[0] / l, n[1] / l, n[2] / l];
            }
        }
    }
    // tabanı sıfıra, merkezi eksene taşı
    let mut mn = [f32::INFINITY; 3];
    let mut mx = [f32::NEG_INFINITY; 3];
    for p in &out_p {
        for k in 0..3 {
            mn[k] = mn[k].min(p[k]);
            mx[k] = mx[k].max(p[k]);
        }
    }
    let off = [(mn[0] + mx[0]) / 2.0, mn[1], (mn[2] + mx[2]) / 2.0];
    for p in &mut out_p {
        *p = [p[0] - off[0], p[1] - off[1], p[2] - off[2]];
    }
    let size = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]];
    if size.iter().any(|s| *s > 200_000.0) {
        warnings.push("@obj_too_big".into());
    } else if size.iter().all(|s| *s < 50.0) {
        warnings.push("@obj_too_small".into());
    }
    let tris = indices.len() / 3;
    Ok(Imported {
        mesh: MeshAsset { id: id.into(), name: name.chars().take(80).collect(), positions: out_p, normals: out_n, indices, groups, source: "obj".into() },
        materials,
        size_mm: size,
        triangles: tris,
        warnings,
    })
}

/// Sahne ağını metre biriminde OBJ + MTL olarak yazar.
pub fn export(scene: &Scene, mesh: &SceneMesh, mtl_name: &str) -> (String, String) {
    use std::fmt::Write;
    let mut obj = String::new();
    let _ = writeln!(obj, "# {} {} — {}", crate::PRODUCT, crate::VERSION, scene.name.replace(['\n', '\r'], " "));
    let _ = writeln!(obj, "# birim: metre, Y yukarı");
    let _ = writeln!(obj, "mtllib {mtl_name}");
    let mut base = 1usize;
    for b in &mesh.batches {
        let _ = writeln!(obj, "o {}", b.material);
        let _ = writeln!(obj, "usemtl {}", b.material);
        for p in &b.positions {
            let _ = writeln!(obj, "v {:.4} {:.4} {:.4}", p[0] / 1000.0, p[1] / 1000.0, p[2] / 1000.0);
        }
        for n in &b.normals {
            let _ = writeln!(obj, "vn {:.4} {:.4} {:.4}", n[0], n[1], n[2]);
        }
        for t in 0..b.positions.len() / 3 {
            let i = base + t * 3;
            let _ = writeln!(obj, "f {0}//{0} {1}//{1} {2}//{2}", i, i + 1, i + 2);
        }
        base += b.positions.len();
    }
    let mut mtl = String::new();
    let _ = writeln!(mtl, "# {} malzemeleri", crate::PRODUCT);
    for b in &mesh.batches {
        let m = scene.material(&b.material).cloned().unwrap_or_default();
        let _ = writeln!(mtl, "newmtl {}", b.material);
        let _ = writeln!(mtl, "Kd {:.4} {:.4} {:.4}", m.color[0], m.color[1], m.color[2]);
        let _ = writeln!(mtl, "Ns {:.1}", (1.0 - m.roughness).powi(2) * 1000.0);
        let _ = writeln!(mtl, "Pr {:.3}\nPm {:.3}", m.roughness, m.metallic);
        let _ = writeln!(mtl, "d {:.3}", m.opacity);
        if m.emission > 0.0 {
            let _ = writeln!(mtl, "Ke {:.3} {:.3} {:.3}", m.color[0], m.color[1], m.color[2]);
        }
        let _ = writeln!(mtl, "illum 2\n");
    }
    (obj, mtl)
}

#[cfg(test)]
mod tests {
    use super::*;

    const CUBE: &str = "mtllib k.mtl\nv 0 0 0\nv 1 0 0\nv 1 1 0\nv 0 1 0\nv 0 0 1\nv 1 0 1\nv 1 1 1\nv 0 1 1\nusemtl Kirmizi\nf 1 2 3 4\nf 5 8 7 6\nf 1 5 6 2\nf 2 6 7 3\nf 3 7 8 4\nf -4 -8 -5 -1\n";
    const MTL: &str = "newmtl Kirmizi\nKd 0.8 0.1 0.1\nNs 250\nd 1\n";

    #[test]
    fn imports_cube_with_negative_indices_and_quads() {
        let r = import("ice1", "Küp", CUBE, Some(MTL), Unit::M, false).unwrap();
        assert_eq!(r.triangles, 12);
        assert_eq!(r.size_mm, [1000.0, 1000.0, 1000.0]);
        assert_eq!(r.mesh.groups.len(), 1);
        let m = r.materials.iter().find(|m| m.id == "ice1-kirmizi").unwrap();
        assert_eq!(m.color, [0.8, 0.1, 0.1]);
        let min_y = r.mesh.positions.iter().map(|p| p[1]).fold(f32::INFINITY, f32::min);
        assert_eq!(min_y, 0.0);
        assert!(r.mesh.normals.iter().all(|n| (n[0] * n[0] + n[1] * n[1] + n[2] * n[2] - 1.0).abs() < 1e-4));
    }

    #[test]
    fn rejects_garbage() {
        assert!(import("x", "x", "hello world", None, Unit::M, false).is_err());
        assert!(import("x", "x", "v 1 2\nf 1 2 3", None, Unit::M, false).is_err());
        let r = import("x", "x", "v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 9\nf 1 2 3", None, Unit::Cm, true).unwrap();
        assert_eq!(r.triangles, 1);
        assert_eq!(r.warnings.len(), 2);
    }

    #[test]
    fn export_roundtrip_keeps_triangle_count() {
        let s = crate::templates::demo_scene();
        let mesh = crate::mesh::build(&s, &Default::default());
        let (obj, mtl) = export(&s, &mesh, "ev.mtl");
        let back = import("rt", "rt", &obj, Some(&mtl), Unit::M, false).unwrap();
        assert_eq!(back.triangles, mesh.triangle_count());
        assert!(mtl.contains("newmtl cam"));
    }
}
