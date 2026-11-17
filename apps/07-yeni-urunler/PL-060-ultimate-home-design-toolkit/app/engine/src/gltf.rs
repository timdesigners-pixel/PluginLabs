//! glTF 2.0 içe aktarma (.glb ya da .gltf + .bin + dokular).
//!
//! Desteklenen: üçgen ilkelleri, düğüm hiyerarşisi (matris ya da TRS), POSITION / NORMAL / TEXCOORD_0,
//! 8/16/32 bit indisler, PBR metalik-pürüzlülük malzemesi (renk, normal ve metalik-pürüzlülük dokuları,
//! renk ve pürüz katsayıları), alfa kesme (MASK) ve saydamlık (BLEND), ışıyan malzeme.
//! Draco sıkıştırmalı dosyalar desteklenmez. Geometri ve dokular varlık deposuna konur (`store`).

use crate::model::{Material, MeshAsset, MeshGroup, TextureAsset};
use crate::store::{self, MeshData};
use base64::Engine;
use serde_json::Value;
use std::collections::{BTreeMap, HashMap};

pub const MAX_TRIANGLES: usize = 3_000_000;
pub const MAX_BYTES: usize = 256 * 1024 * 1024;

#[derive(Debug)]
pub struct Imported {
    pub mesh: MeshAsset,
    pub materials: Vec<Material>,
    pub textures: Vec<TextureAsset>,
    pub size_mm: [f32; 3],
    pub triangles: usize,
    pub warnings: Vec<String>,
}

type M4 = [f64; 16];
const ID: M4 = [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0];

/// Sütun öncelikli 4×4 çarpım (glTF düzeni).
fn mul(a: &M4, b: &M4) -> M4 {
    let mut o = [0.0; 16];
    for c in 0..4 {
        for r in 0..4 {
            o[c * 4 + r] = (0..4).map(|k| a[k * 4 + r] * b[c * 4 + k]).sum();
        }
    }
    o
}

fn trs(n: &Value) -> M4 {
    if let Some(m) = n["matrix"].as_array().filter(|m| m.len() == 16) {
        let mut o = [0.0; 16];
        for (i, v) in m.iter().enumerate() {
            o[i] = v.as_f64().unwrap_or(0.0);
        }
        return o;
    }
    let g = |k: &str, d: &[f64]| -> Vec<f64> { n[k].as_array().map(|a| a.iter().map(|x| x.as_f64().unwrap_or(0.0)).collect()).filter(|v: &Vec<f64>| v.len() == d.len()).unwrap_or_else(|| d.to_vec()) };
    let t = g("translation", &[0.0, 0.0, 0.0]);
    let q = g("rotation", &[0.0, 0.0, 0.0, 1.0]);
    let s = g("scale", &[1.0, 1.0, 1.0]);
    let (x, y, z, w) = (q[0], q[1], q[2], q[3]);
    let r = [
        1.0 - 2.0 * (y * y + z * z), 2.0 * (x * y + z * w), 2.0 * (x * z - y * w),
        2.0 * (x * y - z * w), 1.0 - 2.0 * (x * x + z * z), 2.0 * (y * z + x * w),
        2.0 * (x * z + y * w), 2.0 * (y * z - x * w), 1.0 - 2.0 * (x * x + y * y),
    ];
    [r[0] * s[0], r[1] * s[0], r[2] * s[0], 0.0, r[3] * s[1], r[4] * s[1], r[5] * s[1], 0.0, r[6] * s[2], r[7] * s[2], r[8] * s[2], 0.0, t[0], t[1], t[2], 1.0]
}

/// Normal dönüşümü: üst 3×3'ün ters devriği.
fn normal_matrix(m: &M4) -> [f64; 9] {
    let a = [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
    let det = a[0] * (a[4] * a[8] - a[5] * a[7]) - a[3] * (a[1] * a[8] - a[2] * a[7]) + a[6] * (a[1] * a[5] - a[2] * a[4]);
    let d = if det.abs() < 1e-20 { 1.0 } else { det };
    // kofaktör matrisi / det = ters devrik
    [
        (a[4] * a[8] - a[5] * a[7]) / d, -(a[3] * a[8] - a[5] * a[6]) / d, (a[3] * a[7] - a[4] * a[6]) / d,
        -(a[1] * a[8] - a[2] * a[7]) / d, (a[0] * a[8] - a[2] * a[6]) / d, -(a[0] * a[7] - a[1] * a[6]) / d,
        (a[1] * a[5] - a[2] * a[4]) / d, -(a[0] * a[5] - a[2] * a[3]) / d, (a[0] * a[4] - a[1] * a[3]) / d,
    ]
}

struct Doc<'a> {
    j: Value,
    buffers: Vec<std::borrow::Cow<'a, [u8]>>,
}

fn data_uri(uri: &str) -> Option<Vec<u8>> {
    let (_, b64) = uri.strip_prefix("data:")?.split_once(";base64,")?;
    base64::engine::general_purpose::STANDARD.decode(b64).ok()
}

/// "textures/a%20b.jpg" → dosya tablosundaki ad; yalnız göreli yollar, üst klasöre çıkış yok.
fn lookup<'f>(files: &'f HashMap<String, Vec<u8>>, uri: &str) -> Option<&'f Vec<u8>> {
    let clean = uri.replace("%20", " ");
    if clean.contains("..") || clean.starts_with('/') || clean.contains(':') {
        return None;
    }
    files.get(&clean).or_else(|| {
        let base = clean.rsplit('/').next()?;
        files.iter().find(|(k, _)| k.rsplit('/').next() == Some(base)).map(|(_, v)| v)
    })
}

impl Doc<'_> {
    fn view(&self, i: usize) -> Result<(&[u8], usize), String> {
        let v = &self.j["bufferViews"][i];
        let b = v["buffer"].as_u64().ok_or("@gltf_invalid")? as usize;
        let buf = self.buffers.get(b).ok_or("@gltf_invalid")?;
        let off = v["byteOffset"].as_u64().unwrap_or(0) as usize;
        let len = v["byteLength"].as_u64().ok_or("@gltf_invalid")? as usize;
        let s = buf.get(off..off + len).ok_or("@gltf_invalid")?;
        Ok((s, v["byteStride"].as_u64().unwrap_or(0) as usize))
    }

    /// Erişimciyi f32 vektörlere okur (normalize tamsayılar dahil).
    fn floats(&self, a: usize, n: usize) -> Result<Vec<Vec<f32>>, String> {
        let acc = &self.j["accessors"][a];
        if acc.get("sparse").is_some() {
            return Err("@gltf_sparse".into());
        }
        let count = acc["count"].as_u64().ok_or("@gltf_invalid")? as usize;
        let ct = acc["componentType"].as_u64().unwrap_or(0);
        let norm = acc["normalized"].as_bool().unwrap_or(false);
        let csize = match ct {
            5126 | 5125 => 4,
            5123 | 5122 => 2,
            5121 | 5120 => 1,
            _ => return Err("@gltf_invalid".into()),
        };
        let Some(view) = acc["bufferView"].as_u64() else { return Ok(vec![vec![0.0; n]; count]) };
        let (bytes, stride) = self.view(view as usize)?;
        let off = acc["byteOffset"].as_u64().unwrap_or(0) as usize;
        let stride = if stride == 0 { csize * n } else { stride };
        let mut out = Vec::with_capacity(count);
        for i in 0..count {
            let base = off + i * stride;
            let mut v = Vec::with_capacity(n);
            for k in 0..n {
                let p = base + k * csize;
                let b = bytes.get(p..p + csize).ok_or("@gltf_invalid")?;
                let x = match ct {
                    5126 => f32::from_le_bytes([b[0], b[1], b[2], b[3]]),
                    5125 => u32::from_le_bytes([b[0], b[1], b[2], b[3]]) as f32,
                    5123 => {
                        let u = u16::from_le_bytes([b[0], b[1]]) as f32;
                        if norm { u / 65535.0 } else { u }
                    }
                    5122 => {
                        let s = i16::from_le_bytes([b[0], b[1]]) as f32;
                        if norm { (s / 32767.0).max(-1.0) } else { s }
                    }
                    5121 => {
                        let u = b[0] as f32;
                        if norm { u / 255.0 } else { u }
                    }
                    _ => {
                        let s = b[0] as i8 as f32;
                        if norm { (s / 127.0).max(-1.0) } else { s }
                    }
                };
                v.push(x);
            }
            out.push(v);
        }
        Ok(out)
    }

    fn indices(&self, a: usize) -> Result<Vec<u32>, String> {
        let acc = &self.j["accessors"][a];
        let count = acc["count"].as_u64().ok_or("@gltf_invalid")? as usize;
        let ct = acc["componentType"].as_u64().unwrap_or(0);
        let (bytes, stride) = self.view(acc["bufferView"].as_u64().ok_or("@gltf_invalid")? as usize)?;
        let off = acc["byteOffset"].as_u64().unwrap_or(0) as usize;
        let size = match ct {
            5125 => 4,
            5123 => 2,
            5121 => 1,
            _ => return Err("@gltf_invalid".into()),
        };
        let stride = if stride == 0 { size } else { stride };
        (0..count)
            .map(|i| {
                let p = off + i * stride;
                let b = bytes.get(p..p + size).ok_or_else(|| "@gltf_invalid".to_string())?;
                Ok(match size {
                    4 => u32::from_le_bytes([b[0], b[1], b[2], b[3]]),
                    2 => u16::from_le_bytes([b[0], b[1]]) as u32,
                    _ => b[0] as u32,
                })
            })
            .collect()
    }
}

/// `files`: dosya adı → bayt; `main`: .glb ya da .gltf dosyasının adı.
pub fn import(id: &str, name: &str, files: &HashMap<String, Vec<u8>>, main: &str) -> Result<Imported, String> {
    let total: usize = files.values().map(|v| v.len()).sum();
    if total > MAX_BYTES {
        return Err("@gltf_too_large".into());
    }
    let src = files.get(main).ok_or("@gltf_missing_main")?;
    let mut warnings = vec![];
    // GLB kabı: başlık + JSON parçası + isteğe bağlı BIN parçası
    let (json_bytes, glb_bin): (&[u8], Option<&[u8]>) = if src.starts_with(b"glTF") {
        let rd = |o: usize| src.get(o..o + 4).map(|b| u32::from_le_bytes([b[0], b[1], b[2], b[3]]) as usize);
        let jl = rd(12).ok_or("@gltf_invalid")?;
        let j = src.get(20..20 + jl).ok_or("@gltf_invalid")?;
        let mut bin = None;
        let p = 20 + jl;
        if let (Some(bl), Some(kind)) = (rd(p), rd(p + 4)) {
            if kind == 0x004E_4942 {
                bin = src.get(p + 8..p + 8 + bl);
            }
        }
        (j, bin)
    } else {
        (src.as_slice(), None)
    };
    let j: Value = serde_json::from_slice(json_bytes).map_err(|_| "@gltf_invalid".to_string())?;
    for ext in j["extensionsRequired"].as_array().into_iter().flatten() {
        let e = ext.as_str().unwrap_or("");
        if e == "KHR_draco_mesh_compression" || e == "EXT_meshopt_compression" {
            return Err("@gltf_compressed".into());
        }
        if e != "KHR_materials_emissive_strength" && e != "KHR_texture_transform" {
            warnings.push(format!("@gltf_extension|name={e}"));
        }
    }
    let mut buffers = vec![];
    for (i, b) in j["buffers"].as_array().into_iter().flatten().enumerate() {
        let data: std::borrow::Cow<[u8]> = match b["uri"].as_str() {
            Some(u) if u.starts_with("data:") => data_uri(u).ok_or("@gltf_invalid")?.into(),
            Some(u) => lookup(files, u).ok_or_else(|| format!("@gltf_missing_file|name={}", u.replace('|', "/")))?.as_slice().into(),
            None if i == 0 => glb_bin.ok_or("@gltf_invalid")?.into(),
            None => return Err("@gltf_invalid".into()),
        };
        buffers.push(data);
    }
    let doc = Doc { j, buffers };
    let j = &doc.j;

    // dokular: görsel → depo
    let mut tex_keys: HashMap<usize, (String, String)> = HashMap::new(); // görsel indisi → (anahtar, mime)
    let image_of = |tex: &Value| -> Option<usize> { j["textures"][tex["index"].as_u64()? as usize]["source"].as_u64().map(|x| x as usize) };
    let mut textures: Vec<TextureAsset> = vec![];
    let mut tex_id = |img: usize, textures: &mut Vec<TextureAsset>, warnings: &mut Vec<String>| -> Option<String> {
        let key = if let Some(k) = tex_keys.get(&img) {
            k.clone()
        } else {
            let im = &j["images"][img];
            let (bytes, mime): (Vec<u8>, String) = if let Some(u) = im["uri"].as_str() {
                let b = if u.starts_with("data:") { data_uri(u) } else { lookup(files, u).cloned() };
                let Some(b) = b else {
                    warnings.push(format!("@gltf_missing_file|name={}", u.replace('|', "/")));
                    return None;
                };
                let mime = if u.to_lowercase().ends_with(".png") { "image/png" } else { "image/jpeg" };
                (b, mime.into())
            } else {
                let (b, _) = doc.view(im["bufferView"].as_u64()? as usize).ok()?;
                (b.to_vec(), im["mimeType"].as_str().unwrap_or("image/png").into())
            };
            let Some(dec) = store::decode_bytes(&bytes) else {
                warnings.push("@gltf_texture_format".into());
                return None;
            };
            let k = store::put_file(&mime, bytes);
            let tid = format!("{id}-t{}", tex_keys.len() + 1);
            textures.push(TextureAsset { id: tid.clone(), name: im["name"].as_str().unwrap_or("").chars().take(60).collect(), width: dec.w as u32, height: dec.h as u32, store: k.clone(), mime: mime.clone(), ..Default::default() });
            tex_keys.insert(img, (tid.clone(), mime));
            (tid, String::new())
        };
        Some(key.0)
    };

    // malzemeler
    let mut materials: Vec<Material> = vec![];
    let mats = j["materials"].as_array().cloned().unwrap_or_default();
    for (k, m) in mats.iter().enumerate() {
        let pbr = &m["pbrMetallicRoughness"];
        let f = |v: &Value, i: usize, d: f64| v.as_array().and_then(|a| a.get(i)).and_then(|x| x.as_f64()).unwrap_or(d) as f32;
        let base = &pbr["baseColorFactor"];
        let mut mat = Material {
            id: format!("{id}-m{}", k + 1),
            name: m["name"].as_str().map(|s| s.chars().take(60).collect()).unwrap_or_else(|| format!("{name} {}", k + 1)),
            color: [f(base, 0, 1.0), f(base, 1, 1.0), f(base, 2, 1.0)],
            roughness: pbr["roughnessFactor"].as_f64().unwrap_or(1.0) as f32,
            metallic: pbr["metallicFactor"].as_f64().unwrap_or(1.0) as f32,
            category: "model".into(),
            uv: true,
            ..Default::default()
        };
        if let Some(img) = image_of(&pbr["baseColorTexture"]) {
            if let Some(t) = tex_id(img, &mut textures, &mut warnings) {
                mat.texture = format!("img:{t}");
            }
        }
        if let Some(img) = image_of(&pbr["metallicRoughnessTexture"]) {
            mat.orm_map = tex_id(img, &mut textures, &mut warnings).unwrap_or_default();
        }
        if let Some(img) = image_of(&m["normalTexture"]) {
            mat.normal_map = tex_id(img, &mut textures, &mut warnings).unwrap_or_default();
        }
        match m["alphaMode"].as_str() {
            Some("MASK") => mat.alpha_cutoff = m["alphaCutoff"].as_f64().unwrap_or(0.5) as f32,
            Some("BLEND") => {
                let a = f(base, 3, 1.0);
                if mat.texture.is_empty() {
                    mat.opacity = a;
                } else {
                    mat.alpha_cutoff = 0.5;
                }
            }
            _ => {}
        }
        let em = &m["emissiveFactor"];
        let e = (f(em, 0, 0.0) + f(em, 1, 0.0) + f(em, 2, 0.0)) / 3.0;
        if e > 0.01 && m["emissiveTexture"].is_null() {
            let strength = m["extensions"]["KHR_materials_emissive_strength"]["emissiveStrength"].as_f64().unwrap_or(1.0) as f32;
            mat.emission = e * strength * 3.0;
        }
        materials.push(mat);
    }
    let default_mat = format!("{id}-m0");

    // düğümler ve ilkeller
    let mut data = MeshData::default();
    let mut by_mat: BTreeMap<String, Vec<u32>> = BTreeMap::new();
    let mut need_default = false;
    let roots: Vec<usize> = match j["scenes"][j["scene"].as_u64().unwrap_or(0) as usize]["nodes"].as_array() {
        Some(a) => a.iter().filter_map(|x| x.as_u64().map(|x| x as usize)).collect(),
        None => {
            let n = j["nodes"].as_array().map(|a| a.len()).unwrap_or(0);
            let mut child = vec![false; n];
            for nd in j["nodes"].as_array().into_iter().flatten() {
                for c in nd["children"].as_array().into_iter().flatten() {
                    if let Some(c) = c.as_u64() {
                        if (c as usize) < n {
                            child[c as usize] = true;
                        }
                    }
                }
            }
            (0..n).filter(|i| !child[*i]).collect()
        }
    };
    let mut stack: Vec<(usize, M4, usize)> = roots.into_iter().map(|r| (r, ID, 0)).collect();
    let mut skipped = 0usize;
    while let Some((ni, parent, depth)) = stack.pop() {
        if depth > 64 {
            continue;
        }
        let node = &j["nodes"][ni];
        let world = mul(&parent, &trs(node));
        for c in node["children"].as_array().into_iter().flatten() {
            if let Some(c) = c.as_u64() {
                stack.push((c as usize, world, depth + 1));
            }
        }
        let Some(mi) = node["mesh"].as_u64() else { continue };
        let nm = normal_matrix(&world);
        for prim in j["meshes"][mi as usize]["primitives"].as_array().into_iter().flatten() {
            if prim["mode"].as_u64().unwrap_or(4) != 4 {
                skipped += 1;
                continue;
            }
            if prim["extensions"].get("KHR_draco_mesh_compression").is_some() {
                return Err("@gltf_compressed".into());
            }
            let attrs = &prim["attributes"];
            let Some(pa) = attrs["POSITION"].as_u64() else { continue };
            let pos = doc.floats(pa as usize, 3)?;
            let nor = match attrs["NORMAL"].as_u64() {
                Some(a) => Some(doc.floats(a as usize, 3)?),
                None => None,
            };
            let uv = match attrs["TEXCOORD_0"].as_u64() {
                Some(a) => Some(doc.floats(a as usize, 2)?),
                None => None,
            };
            let idx: Vec<u32> = match prim["indices"].as_u64() {
                Some(a) => doc.indices(a as usize)?,
                None => (0..pos.len() as u32).collect(),
            };
            let base = data.positions.len() as u32;
            for (i, p) in pos.iter().enumerate() {
                let (x, y, z) = (p[0] as f64, p[1] as f64, p[2] as f64);
                let w = [world[0] * x + world[4] * y + world[8] * z + world[12], world[1] * x + world[5] * y + world[9] * z + world[13], world[2] * x + world[6] * y + world[10] * z + world[14]];
                // glTF metre → mm
                data.positions.push([(w[0] * 1000.0) as f32, (w[1] * 1000.0) as f32, (w[2] * 1000.0) as f32]);
                let n = nor.as_ref().and_then(|n| n.get(i)).map(|n| {
                    let v = [nm[0] * n[0] as f64 + nm[3] * n[1] as f64 + nm[6] * n[2] as f64, nm[1] * n[0] as f64 + nm[4] * n[1] as f64 + nm[7] * n[2] as f64, nm[2] * n[0] as f64 + nm[5] * n[1] as f64 + nm[8] * n[2] as f64];
                    let l = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt().max(1e-12);
                    [(v[0] / l) as f32, (v[1] / l) as f32, (v[2] / l) as f32]
                });
                data.normals.push(n.unwrap_or([0.0, 0.0, 0.0]));
                data.uvs.push(uv.as_ref().and_then(|u| u.get(i)).map(|u| [u[0], u[1]]).unwrap_or([0.0, 0.0]));
            }
            // ayna dönüşümünde üçgen yönünü koru
            let flip = {
                let a = [world[0], world[1], world[2], world[4], world[5], world[6], world[8], world[9], world[10]];
                a[0] * (a[4] * a[8] - a[5] * a[7]) - a[3] * (a[1] * a[8] - a[2] * a[7]) + a[6] * (a[1] * a[5] - a[2] * a[4]) < 0.0
            };
            let mat = match prim["material"].as_u64() {
                Some(m) if (m as usize) < materials.len() => materials[m as usize].id.clone(),
                _ => {
                    need_default = true;
                    default_mat.clone()
                }
            };
            let list = by_mat.entry(mat).or_default();
            for t in idx.chunks(3) {
                if t.len() < 3 || t.iter().any(|&k| k as usize >= pos.len()) {
                    continue;
                }
                if flip {
                    list.extend_from_slice(&[base + t[0], base + t[2], base + t[1]]);
                } else {
                    list.extend_from_slice(&[base + t[0], base + t[1], base + t[2]]);
                }
            }
            if by_mat.values().map(|v| v.len()).sum::<usize>() / 3 > MAX_TRIANGLES {
                return Err("@gltf_too_many_triangles".into());
            }
        }
    }
    if skipped > 0 {
        warnings.push(format!("@gltf_skipped_primitives|n={skipped}"));
    }
    let tris: usize = by_mat.values().map(|v| v.len()).sum::<usize>() / 3;
    if tris == 0 {
        return Err("@gltf_no_triangles".into());
    }
    if need_default {
        materials.push(Material { id: default_mat, name: name.into(), color: [0.8, 0.8, 0.8], roughness: 0.6, category: "model".into(), ..Default::default() });
    }
    // eksik normaller: yüz normallerinden yumuşak köşe normali
    let mut groups = vec![];
    for (mat, list) in by_mat {
        groups.push(MeshGroup { material: mat, start: data.indices.len() as u32, count: list.len() as u32 });
        data.indices.extend(list);
    }
    if data.normals.iter().any(|n| n == &[0.0, 0.0, 0.0]) {
        let mut acc = vec![[0.0f32; 3]; data.positions.len()];
        for t in data.indices.chunks(3) {
            let (a, b, c) = (data.positions[t[0] as usize], data.positions[t[1] as usize], data.positions[t[2] as usize]);
            let e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
            let e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
            let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
            for &k in t {
                for d in 0..3 {
                    acc[k as usize][d] += n[d];
                }
            }
        }
        for (i, n) in data.normals.iter_mut().enumerate() {
            if *n == [0.0, 0.0, 0.0] {
                let a = acc[i];
                let l = (a[0] * a[0] + a[1] * a[1] + a[2] * a[2]).sqrt().max(1e-20);
                *n = [a[0] / l, a[1] / l, a[2] / l];
            }
        }
    }
    // tabanı sıfıra, merkezi eksene taşı (OBJ içe aktarmayla aynı)
    let mut mn = [f32::INFINITY; 3];
    let mut mx = [f32::NEG_INFINITY; 3];
    for &i in &data.indices {
        let p = data.positions[i as usize];
        for k in 0..3 {
            mn[k] = mn[k].min(p[k]);
            mx[k] = mx[k].max(p[k]);
        }
    }
    let off = [(mn[0] + mx[0]) / 2.0, mn[1], (mn[2] + mx[2]) / 2.0];
    for p in &mut data.positions {
        *p = [p[0] - off[0], p[1] - off[1], p[2] - off[2]];
    }
    let size = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]];
    if size.iter().any(|s| *s > 200_000.0) {
        warnings.push("@obj_too_big".into());
    } else if size.iter().all(|s| *s < 50.0) {
        warnings.push("@obj_too_small".into());
    }
    let key = store::put_mesh(data);
    Ok(Imported {
        mesh: MeshAsset { id: id.into(), name: name.chars().take(80).collect(), groups, source: "gltf".into(), store: key, triangles: tris as u32, size: Some(size), ..Default::default() },
        materials,
        textures,
        size_mm: size,
        triangles: tris,
        warnings,
    })
}

#[cfg(test)]
pub mod tests {
    use super::*;

    /// Test için küçük bir GLB: iki düğüm (biri 90° döndürülmüş, biri ölçekli), UV'li ve dokulu malzeme, alfa kesme.
    pub fn sample_glb() -> Vec<u8> {
        let mut bin: Vec<u8> = vec![];
        let f = |b: &mut Vec<u8>, v: &[f32]| v.iter().for_each(|x| b.extend_from_slice(&x.to_le_bytes()));
        // birim kare (XZ düzlemi, Y yukarı bakan), 4 köşe
        f(&mut bin, &[0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0]);
        f(&mut bin, &[0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0]);
        f(&mut bin, &[0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]);
        for i in [0u16, 2, 1, 0, 3, 2] {
            bin.extend_from_slice(&i.to_le_bytes());
        }
        let png = crate::render::encode_png(&[200, 30, 30, 255, 30, 200, 30, 0, 30, 30, 200, 255, 220, 220, 220, 255], 2, 2).unwrap();
        let img_off = bin.len();
        bin.extend_from_slice(&png);
        while bin.len() % 4 != 0 {
            bin.push(0);
        }
        let json = serde_json::json!({
            "asset": {"version": "2.0"},
            "scene": 0, "scenes": [{"nodes": [0, 1]}],
            "nodes": [
                {"mesh": 0, "translation": [0.0, 0.5, 0.0]},
                {"mesh": 0, "rotation": [0.0, 0.0, 0.7071068, 0.7071068], "scale": [2.0, 2.0, 2.0], "translation": [3.0, 0.0, 0.0]}
            ],
            "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1, "TEXCOORD_0": 2}, "indices": 3, "material": 0}]}],
            "materials": [{"name": "Kumaş", "pbrMetallicRoughness": {"baseColorTexture": {"index": 0}, "metallicFactor": 0.0, "roughnessFactor": 0.8}, "alphaMode": "MASK"}],
            "textures": [{"source": 0}],
            "images": [{"bufferView": 4, "mimeType": "image/png"}],
            "buffers": [{"byteLength": bin.len()}],
            "bufferViews": [
                {"buffer": 0, "byteOffset": 0, "byteLength": 48},
                {"buffer": 0, "byteOffset": 48, "byteLength": 48},
                {"buffer": 0, "byteOffset": 96, "byteLength": 32},
                {"buffer": 0, "byteOffset": 128, "byteLength": 12},
                {"buffer": 0, "byteOffset": img_off, "byteLength": png.len()}
            ],
            "accessors": [
                {"bufferView": 0, "componentType": 5126, "count": 4, "type": "VEC3", "min": [0, 0, 0], "max": [1, 0, 1]},
                {"bufferView": 1, "componentType": 5126, "count": 4, "type": "VEC3"},
                {"bufferView": 2, "componentType": 5126, "count": 4, "type": "VEC2"},
                {"bufferView": 3, "componentType": 5123, "count": 6, "type": "SCALAR"}
            ]
        });
        let mut j = serde_json::to_vec(&json).unwrap();
        while j.len() % 4 != 0 {
            j.push(b' ');
        }
        let mut out = vec![];
        out.extend_from_slice(b"glTF");
        out.extend_from_slice(&2u32.to_le_bytes());
        out.extend_from_slice(&((12 + 8 + j.len() + 8 + bin.len()) as u32).to_le_bytes());
        out.extend_from_slice(&(j.len() as u32).to_le_bytes());
        out.extend_from_slice(&0x4E4F_534Au32.to_le_bytes());
        out.extend_from_slice(&j);
        out.extend_from_slice(&(bin.len() as u32).to_le_bytes());
        out.extend_from_slice(&0x004E_4942u32.to_le_bytes());
        out.extend_from_slice(&bin);
        out
    }

    #[test]
    fn imports_glb_with_nodes_textures_and_alpha() {
        let mut files = HashMap::new();
        files.insert("deneme.glb".to_string(), sample_glb());
        let r = import("g1", "Deneme", &files, "deneme.glb").unwrap();
        assert_eq!(r.triangles, 4);
        assert_eq!(r.materials.len(), 1);
        let m = &r.materials[0];
        assert!(m.uv && m.texture == "img:g1-t1" && m.alpha_cutoff == 0.5 && (m.roughness - 0.8).abs() < 1e-6 && m.metallic == 0.0);
        assert_eq!(r.textures.len(), 1);
        assert!(store::image(&r.textures[0].store).unwrap().has_alpha);
        let data = store::mesh(&r.mesh.store).unwrap();
        assert_eq!(data.uvs.len(), data.positions.len());
        // tabanı sıfırda; ikinci kopya 90° döndürülüp 2 kat büyütüldü: 2 m yüksekliğe ulaşır
        let min_y = data.positions.iter().map(|p| p[1]).fold(f32::INFINITY, f32::min);
        let max_y = data.positions.iter().map(|p| p[1]).fold(f32::NEG_INFINITY, f32::max);
        assert!(min_y.abs() < 1e-3 && (max_y - 2000.0).abs() < 1.0, "{min_y} {max_y}");
        // döndürülen kopyanın normali +Y'den -X'e döner
        assert!(data.normals.iter().any(|n| (n[0] + 1.0).abs() < 1e-3));
        assert!((r.size_mm[0] - 3000.0).abs() < 1.0, "{:?}", r.size_mm);
    }

    #[test]
    fn project_file_embeds_and_restores_stored_assets() {
        let mut files = HashMap::new();
        files.insert("d.glb".to_string(), sample_glb());
        let r = import("g9", "Gömülü", &files, "d.glb").unwrap();
        let mut s = crate::templates::demo_scene();
        let key = r.mesh.store.clone();
        s.meshes.push(r.mesh);
        s.textures.extend(r.textures);
        s.materials.extend(r.materials);
        s.objects.push(crate::model::Object { id: "G".into(), mesh: "g9".into(), level: "L0".into(), position: [2000.0, 2000.0, 0.0], ..Default::default() });
        let light = serde_json::to_string(&s).unwrap();
        let text = crate::scene_file::save(&s).unwrap();
        assert!(text.len() > light.len() + 100, "ağır veri dosyaya gömülür");
        let (back, _) = crate::scene_file::load(&text).unwrap();
        let m = back.meshes.iter().find(|m| m.id == "g9").unwrap();
        assert_eq!(m.store, key);
        assert!(m.positions.is_empty() && back.textures.iter().all(|t| t.data.is_empty()));
        let built = crate::mesh::build(&back, &crate::mesh::MeshOptions::default());
        assert!(built.batches.iter().any(|b| b.material == "g9-m1" && b.uvs.len() == b.positions.len() && !b.uvs.is_empty()));
        // dahili render dokulu modelle çalışır
        let set = crate::render::RenderSettings { width: 48, height: 32, samples: 2, ..Default::default() };
        assert!(crate::render::render(&back, &set).is_ok());
    }

    #[test]
    fn gltf_with_external_files_and_rejects_bad_input() {
        let glb = sample_glb();
        let jl = u32::from_le_bytes([glb[12], glb[13], glb[14], glb[15]]) as usize;
        let mut j: Value = serde_json::from_slice(&glb[20..20 + jl]).unwrap();
        let bin = glb[20 + jl + 8..].to_vec();
        j["buffers"][0]["uri"] = "parca.bin".into();
        let mut files = HashMap::new();
        files.insert("model.gltf".to_string(), serde_json::to_vec(&j).unwrap());
        files.insert("parca.bin".to_string(), bin);
        assert_eq!(import("g2", "Dış", &files, "model.gltf").unwrap().triangles, 4);
        files.remove("parca.bin");
        assert!(import("g3", "x", &files, "model.gltf").unwrap_err().starts_with("@gltf_missing_file"));
        j["buffers"][0]["uri"] = "../../gizli.bin".into();
        files.insert("model.gltf".to_string(), serde_json::to_vec(&j).unwrap());
        assert!(import("g4", "x", &files, "model.gltf").is_err(), "üst klasöre çıkan yol reddedilir");
        j["extensionsRequired"] = serde_json::json!(["KHR_draco_mesh_compression"]);
        files.insert("model.gltf".to_string(), serde_json::to_vec(&j).unwrap());
        assert_eq!(import("g5", "x", &files, "model.gltf").unwrap_err(), "@gltf_compressed");
    }
}
