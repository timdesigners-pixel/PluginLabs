//! Sahneden üçgen ağı üretir (3B görünüm, render ve OBJ dışa aktarma için).
//! Dünya: X = plan x, Y = yukarı, Z = plan y; birim mm.

use crate::catalog;
use crate::geom;
use crate::model::{Object, OpeningKind, Scene};
use crate::modules;
use serde::{Deserialize, Serialize};

pub type V3 = [f64; 3];

#[derive(Debug, Clone, Default, Serialize)]
pub struct Batch {
    pub material: String,
    /// Üçgen köşeleri (her üç köşe bir üçgen).
    pub positions: Vec<[f32; 3]>,
    pub normals: Vec<[f32; 3]>,
    /// Modelin kendi doku koordinatları (yalnız UV'li malzemelerde; yoksa boş).
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub uvs: Vec<[f32; 2]>,
}

impl Batch {
    /// UV dizisini köşe sayısına tamamlar (UV'siz köşeler 0,0).
    pub fn pad_uvs(&mut self) {
        self.uvs.resize(self.positions.len(), [0.0, 0.0]);
    }
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct SceneMesh {
    pub batches: Vec<Batch>,
}

impl SceneMesh {
    fn batch(&mut self, m: &str) -> &mut Batch {
        if let Some(i) = self.batches.iter().position(|b| b.material == m) {
            return &mut self.batches[i];
        }
        self.batches.push(Batch { material: m.to_string(), ..Default::default() });
        self.batches.last_mut().unwrap()
    }
    pub fn triangle_count(&self) -> usize {
        self.batches.iter().map(|b| b.positions.len() / 3).sum()
    }
    pub fn bounds(&self) -> ([f32; 3], [f32; 3]) {
        let mut mn = [f32::INFINITY; 3];
        let mut mx = [f32::NEG_INFINITY; 3];
        for b in &self.batches {
            for p in &b.positions {
                for k in 0..3 {
                    mn[k] = mn[k].min(p[k]);
                    mx[k] = mx[k].max(p[k]);
                }
            }
        }
        (mn, mx)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct MeshOptions {
    /// Gösterilecek katlar (boşsa tümü).
    pub levels: Vec<String>,
    /// En üst katın tavanı/çatısı çizilsin mi? (kesit görünümde kapalı)
    pub roof: bool,
    pub ground: bool,
    pub furniture: bool,
    pub openings: bool,
    /// Zemin düzleminin malzemesi (stüdyo önizlemesinde nötr gri).
    pub ground_material: String,
}
impl Default for MeshOptions {
    fn default() -> Self {
        MeshOptions { levels: vec![], roof: true, ground: true, furniture: true, openings: true, ground_material: "zemin-dis".into() }
    }
}

fn add(a: V3, b: V3) -> V3 {
    [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}
fn mul(a: V3, s: f64) -> V3 {
    [a[0] * s, a[1] * s, a[2] * s]
}
fn cross(a: V3, b: V3) -> V3 {
    [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}
fn dot(a: V3, b: V3) -> f64 {
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}
fn norm(a: V3) -> V3 {
    let l = dot(a, a).sqrt();
    if l < 1e-12 {
        [0.0, 1.0, 0.0]
    } else {
        mul(a, 1.0 / l)
    }
}
fn f(a: V3) -> [f32; 3] {
    [a[0] as f32, a[1] as f32, a[2] as f32]
}

/// Dörtgen yüz: p, p+e1, p+e1+e2, p+e2; dış yönü `out` olacak şekilde sarılır.
fn quad(b: &mut Batch, p: V3, e1: V3, e2: V3, out: V3) {
    let mut n = cross(e1, e2);
    let (e1, e2) = if dot(n, out) < 0.0 {
        n = mul(n, -1.0);
        (e2, e1)
    } else {
        (e1, e2)
    };
    let n = f(norm(n));
    let (a, c, d, e) = (p, add(p, e1), add(add(p, e1), e2), add(p, e2));
    for v in [a, c, d, a, d, e] {
        b.positions.push(f(v));
        b.normals.push(n);
    }
}

/// Yönlü kutu: o + a·u + b·v + c·w (a, b, c ∈ [0, 1]).
pub fn push_box(b: &mut Batch, o: V3, u: V3, v: V3, w: V3) {
    let c = add(o, mul(add(add(u, v), w), 0.5));
    let faces = [(o, u, v), (o, v, w), (o, w, u), (add(o, w), u, v), (add(o, u), v, w), (add(o, v), w, u)];
    for (p, e1, e2) in faces {
        let fc = add(p, mul(add(e1, e2), 0.5));
        let out = [fc[0] - c[0], fc[1] - c[1], fc[2] - c[2]];
        quad(b, p, e1, e2, out);
    }
}

/// Köşe normalleriyle üçgen; sarım, normallerin ortalamasına göre düzeltilir.
fn tri_n(b: &mut Batch, p: [V3; 3], n: [V3; 3]) {
    let g = cross([p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]], [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]]);
    let avg = add(add(n[0], n[1]), n[2]);
    let order = if dot(g, avg) >= 0.0 { [0, 1, 2] } else { [0, 2, 1] };
    for k in order {
        b.positions.push(f(p[k]));
        b.normals.push(f(norm(n[k])));
    }
}

/// Biçimli parça: `o + a·u + b·v + c·w` kutusunun içine oturur (u, v, w kenar vektörleri).
pub fn push_shape(b: &mut Batch, shape: catalog::Shape, o: V3, u: V3, v: V3, w: V3) {
    use catalog::Shape;
    let len = |a: V3| dot(a, a).sqrt();
    let (lu, lv, lw) = (len(u), len(v), len(w));
    if lu < 1e-6 || lv < 1e-6 || lw < 1e-6 {
        return;
    }
    let (uh, vh, wh) = (mul(u, 1.0 / lu), mul(v, 1.0 / lv), mul(w, 1.0 / lw));
    let c = add(o, mul(add(add(u, v), w), 0.5));
    let h = [lu / 2.0, lv / 2.0, lw / 2.0];
    // yerel (merkezli) nokta ve normal → dünya
    let wp = |q: V3| add(c, add(add(mul(uh, q[0]), mul(vh, q[1])), mul(wh, q[2])));
    let wn = |q: V3| norm(add(add(mul(uh, q[0]), mul(vh, q[1])), mul(wh, q[2])));
    match shape {
        Shape::Box => push_box(b, o, u, v, w),
        Shape::Round(r) => {
            let r = r.min(h[0] * 0.98).min(h[1] * 0.98).min(h[2] * 0.98).max(0.5);
            let list = |hh: f64| [-hh, -(hh - 0.29 * r), -(hh - r), hh - r, hh - 0.29 * r, hh];
            let point = |q: V3, face: V3| -> (V3, V3) {
                let inner = [q[0].clamp(-(h[0] - r), h[0] - r), q[1].clamp(-(h[1] - r), h[1] - r), q[2].clamp(-(h[2] - r), h[2] - r)];
                let d = [q[0] - inner[0], q[1] - inner[1], q[2] - inner[2]];
                let n = if dot(d, d) < 1e-9 { face } else { norm(d) };
                (add(inner, mul(n, r)), n)
            };
            for axis in 0..3 {
                let (a1, a2) = ((axis + 1) % 3, (axis + 2) % 3);
                let (l1, l2) = (list(h[a1]), list(h[a2]));
                for sgn in [-1.0, 1.0] {
                    let mut face = [0.0; 3];
                    face[axis] = sgn;
                    for i in 0..5 {
                        for j in 0..5 {
                            let mk = |x: f64, y: f64| {
                                let mut q = [0.0; 3];
                                q[axis] = sgn * h[axis];
                                q[a1] = x;
                                q[a2] = y;
                                let (p, n) = point(q, face);
                                (wp(p), wn(n))
                            };
                            let (p00, p10, p11, p01) = (mk(l1[i], l2[j]), mk(l1[i + 1], l2[j]), mk(l1[i + 1], l2[j + 1]), mk(l1[i], l2[j + 1]));
                            tri_n(b, [p00.0, p10.0, p11.0], [p00.1, p10.1, p11.1]);
                            tri_n(b, [p00.0, p11.0, p01.0], [p00.1, p11.1, p01.1]);
                        }
                    }
                }
            }
        }
        Shape::Cyl => {
            let n = 18;
            for k in 0..n {
                let (a0, a1) = (std::f64::consts::TAU * k as f64 / n as f64, std::f64::consts::TAU * (k + 1) as f64 / n as f64);
                let rim = |a: f64, y: f64| [h[0] * a.cos(), y, h[2] * a.sin()];
                let rn = |a: f64| [a.cos() / h[0].max(1e-6), 0.0, a.sin() / h[2].max(1e-6)];
                let (b0, b1, t1, t0) = (rim(a0, -h[1]), rim(a1, -h[1]), rim(a1, h[1]), rim(a0, h[1]));
                tri_n(b, [wp(b0), wp(b1), wp(t1)], [wn(rn(a0)), wn(rn(a1)), wn(rn(a1))]);
                tri_n(b, [wp(b0), wp(t1), wp(t0)], [wn(rn(a0)), wn(rn(a1)), wn(rn(a0))]);
                let up = wn([0.0, 1.0, 0.0]);
                let dn = wn([0.0, -1.0, 0.0]);
                tri_n(b, [wp([0.0, h[1], 0.0]), wp(t0), wp(t1)], [up, up, up]);
                tri_n(b, [wp([0.0, -h[1], 0.0]), wp(b1), wp(b0)], [dn, dn, dn]);
            }
        }
        Shape::Ball => {
            let (lat, lon) = (8, 14);
            let pt = |i: usize, j: usize| -> (V3, V3) {
                let th = std::f64::consts::PI * i as f64 / lat as f64;
                let ph = std::f64::consts::TAU * j as f64 / lon as f64;
                let d = [th.sin() * ph.cos(), th.cos(), th.sin() * ph.sin()];
                (wp([d[0] * h[0], d[1] * h[1], d[2] * h[2]]), wn([d[0] / h[0], d[1] / h[1], d[2] / h[2]]))
            };
            for i in 0..lat {
                for j in 0..lon {
                    let (p00, p10, p11, p01) = (pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1));
                    if i > 0 {
                        tri_n(b, [p00.0, p10.0, p01.0], [p00.1, p10.1, p01.1]);
                    }
                    if i < lat - 1 {
                        tri_n(b, [p10.0, p11.0, p01.0], [p10.1, p11.1, p01.1]);
                    }
                }
            }
        }
    }
}

fn world(p: [f64; 2], y: f64) -> V3 {
    [p[0], y, p[1]]
}

/// Dikdörtgenden dikdörtgen delik çıkararak en çok 4 dikdörtgen döner.
fn rect_minus(r: ([f64; 2], [f64; 2]), h: ([f64; 2], [f64; 2])) -> Vec<([f64; 2], [f64; 2])> {
    let (mn, mx) = r;
    let hmn = [h.0[0].max(mn[0]), h.0[1].max(mn[1])];
    let hmx = [h.1[0].min(mx[0]), h.1[1].min(mx[1])];
    if hmn[0] >= hmx[0] || hmn[1] >= hmx[1] {
        return vec![r];
    }
    let mut out = vec![];
    if hmn[1] > mn[1] {
        out.push((mn, [mx[0], hmn[1]]));
    }
    if hmx[1] < mx[1] {
        out.push(([mn[0], hmx[1]], mx));
    }
    if hmn[0] > mn[0] {
        out.push(([mn[0], hmn[1]], [hmn[0], hmx[1]]));
    }
    if hmx[0] < mx[0] {
        out.push(([hmx[0], hmn[1]], [mx[0], hmx[1]]));
    }
    out
}

fn slab(m: &mut SceneMesh, mat: &str, r: ([f64; 2], [f64; 2]), y0: f64, y1: f64, holes: &[([f64; 2], [f64; 2])]) {
    let mut parts = vec![r];
    for h in holes {
        parts = parts.into_iter().flat_map(|p| rect_minus(p, *h)).collect();
    }
    let b = m.batch(mat);
    for (mn, mx) in parts {
        push_box(b, [mn[0], y0, mn[1]], [mx[0] - mn[0], 0.0, 0.0], [0.0, y1 - y0, 0.0], [0.0, 0.0, mx[1] - mn[1]]);
    }
}

/// Plan dönüşümü: yerel (x, z) → plan (x, y), açı derece.
pub fn rot2(x: f64, z: f64, deg: f64) -> [f64; 2] {
    let (s, c) = deg.to_radians().sin_cos();
    [x * c - z * s, x * s + z * c]
}

fn stair_holes(scene: &Scene) -> Vec<([f64; 2], [f64; 2])> {
    scene
        .objects
        .iter()
        .filter(|o| o.mesh == "cat:merdiven")
        .map(|o| {
            let it = catalog::item("merdiven").unwrap();
            let (hw, hd) = (it.size[0] * o.scale[0] / 2.0, it.size[1] * o.scale[2] / 2.0);
            let c: Vec<[f64; 2]> = [(-hw, -hd), (hw, -hd), (hw, hd), (-hw, hd)].iter().map(|&(x, z)| { let r = rot2(x, z, o.rotation); [r[0] + o.position[0], r[1] + o.position[1]] }).collect();
            geom::bbox(&c)
        })
        .collect()
}

pub fn build(scene: &Scene, opt: &MeshOptions) -> SceneMesh {
    let mut m = SceneMesh::default();
    let st = &scene.standard;
    let show = |id: &str| opt.levels.is_empty() || opt.levels.iter().any(|l| l == id);
    let top_visible = scene.levels.iter().filter(|l| show(&l.id)).map(|l| l.id.clone()).max();
    let interior = if scene.interior.is_empty() { "boya-beyaz".to_string() } else { scene.interior.clone() };
    let facade = if scene.facade.is_empty() { "beton-kabuk".to_string() } else { scene.facade.clone() };
    let holes = stair_holes(&scene);

    // modül döşemeleri
    for md in &scene.modules {
        let lid = modules::level_id(md.floor);
        if !show(&lid) {
            continue;
        }
        let r = modules::rect(md, scene);
        let base = md.floor as f64 * st.stack();
        let up_holes: Vec<_> = if md.floor > 0 { holes.clone() } else { vec![] };
        slab(&mut m, "beton-kabuk", r, base, base + st.bottom_slab, &up_holes);
        let covered = scene.modules.iter().any(|u| u.floor == md.floor + 1 && u.on.as_deref() == Some(&md.id));
        let is_top = Some(lid.clone()) == top_visible;
        if opt.roof || !is_top {
            let y0 = base + st.bottom_slab + st.net_height;
            let h = if covered { holes.clone() } else { vec![] };
            slab(&mut m, "beton-kabuk", r, y0, y0 + st.top_slab, &h);
            // tavan yüzü
            let b = m.batch("tavan-beyaz");
            let t = st.exterior_wall;
            let (mn, mx) = r;
            quad(b, [mn[0] + t, y0 - 1.0, mn[1] + t], [mx[0] - mn[0] - 2.0 * t, 0.0, 0.0], [0.0, 0.0, mx[1] - mn[1] - 2.0 * t], [0.0, -1.0, 0.0]);
        }
    }

    // serbest mekânların döşemesi ve tavanı
    if let Some(l0) = scene.levels.first().filter(|l| show(&l.id)) {
        let el = l0.elevation;
        for sp in &scene.spaces {
            let (omn, omx) = sp.outer();
            slab(&mut m, "beton-kabuk", (omn, omx), 0.0, el, &[]);
            if opt.roof || Some(l0.id.clone()) != top_visible {
                let y0 = el + sp.height;
                slab(&mut m, "beton-kabuk", (omn, omx), y0, y0 + st.top_slab, &[]);
                let (a, _) = sp.rect();
                quad(m.batch("tavan-beyaz"), [a[0], y0 - 1.0, a[1]], [sp.width, 0.0, 0.0], [0.0, 0.0, sp.depth], [0.0, -1.0, 0.0]);
            }
        }
    }

    for level in scene.levels.iter().filter(|l| show(&l.id)) {
        let el = level.elevation;
        // zemin kaplamaları
        for r in &level.rooms {
            if r.polygon.len() < 3 {
                continue;
            }
            let tris = geom::triangulate(&r.polygon);
            let b = m.batch(if r.floor.is_empty() { "parke-mese" } else { &r.floor });
            for t in tris {
                let (a, c, d) = (world(r.polygon[t[0]], el + 2.0), world(r.polygon[t[1]], el + 2.0), world(r.polygon[t[2]], el + 2.0));
                // plan saat yönü tersi → dünya yukarı bakan yüz için sırayı çevir
                let n = cross([c[0] - a[0], c[1] - a[1], c[2] - a[2]], [d[0] - a[0], d[1] - a[1], d[2] - a[2]]);
                let order = if n[1] >= 0.0 { [a, c, d] } else { [a, d, c] };
                for v in order {
                    b.positions.push(f(v));
                    b.normals.push([0.0, 1.0, 0.0]);
                }
            }
        }
        // duvarlar
        for w in &level.walls {
            let len = w.length();
            if len < 1.0 {
                continue;
            }
            let d = [(w.b[0] - w.a[0]) / len, (w.b[1] - w.a[1]) / len];
            let right = [d[1], -d[0]];
            let ext = if w.generated { 0.0 } else { w.thickness / 2.0 };
            let (y0, y1) = match w.shell {
                Some([b, t]) => (b, t),
                None => (el, el + w.h(level)),
            };
            let ops: Vec<_> = level.openings.iter().filter(|o| o.wall == w.id && opt.openings).collect();
            let mut cuts: Vec<f64> = vec![-ext, len + ext];
            for o in &ops {
                cuts.push(o.offset.clamp(0.0, len));
                cuts.push((o.offset + o.width).clamp(0.0, len));
            }
            cuts.sort_by(|a, b| a.partial_cmp(b).unwrap());
            cuts.dedup_by(|a, b| (*a - *b).abs() < 0.5);
            let inner = if w.material.is_empty() { interior.as_str() } else { w.material.as_str() };
            let outer_mat = if w.outside != 0 { if w.outer.is_empty() { facade.as_str() } else { w.outer.as_str() } } else { inner };
            // dış yarı = outside yönündeki yarı
            let side = if w.outside >= 0 { 1.0 } else { -1.0 };
            let half = w.thickness / 2.0;
            for k in 0..cuts.len().saturating_sub(1) {
                let (s0, s1) = (cuts[k], cuts[k + 1]);
                if s1 - s0 < 0.5 {
                    continue;
                }
                let mid = (s0 + s1) / 2.0;
                let mut spans = vec![(y0, y1)];
                if let Some(o) = ops.iter().find(|o| mid > o.offset && mid < o.offset + o.width) {
                    let oy0 = el + o.sill;
                    let oy1 = el + o.sill + o.height;
                    spans = vec![(y0, oy0), (oy1, y1)];
                }
                for (a, bb) in spans {
                    if bb - a < 0.5 {
                        continue;
                    }
                    let p0 = [w.a[0] + d[0] * s0, w.a[1] + d[1] * s0];
                    let u = [d[0] * (s1 - s0), 0.0, d[1] * (s1 - s0)];
                    let v = [0.0, bb - a, 0.0];
                    // iç yarı (outside'ın tersi) ve dış yarı
                    let inner_w = [-right[0] * side * half, 0.0, -right[1] * side * half];
                    let outer_w = [right[0] * side * half, 0.0, right[1] * side * half];
                    let o = world(p0, a);
                    push_box(m.batch(inner), o, u, v, inner_w);
                    push_box(m.batch(outer_mat), o, u, v, outer_w);
                }
            }
            // doğramalar
            for o in &ops {
                let p0 = [w.a[0] + d[0] * o.offset, w.a[1] + d[1] * o.offset];
                let base = el + o.sill;
                let ws = o.width;
                let hs = o.height;
                let fr = 50.0;
                let depth = (w.thickness * 0.5).min(70.0);
                let off = [-right[0] * depth / 2.0, 0.0, -right[1] * depth / 2.0];
                let ud = [d[0], 0.0, d[1]];
                let across = [right[0] * depth, 0.0, right[1] * depth];
                let frame_mat = if o.kind == OpeningKind::Door { "kapi-ahsap" } else { "pvc-beyaz" };
                let o0 = add(world(p0, base), off);
                // kasa: sol, sağ, üst (+ pencerede alt)
                push_box(m.batch(frame_mat), o0, mul(ud, fr), [0.0, hs, 0.0], across);
                push_box(m.batch(frame_mat), add(o0, mul(ud, ws - fr)), mul(ud, fr), [0.0, hs, 0.0], across);
                push_box(m.batch(frame_mat), add(o0, [0.0, hs - fr, 0.0]), mul(ud, ws), [0.0, fr, 0.0], across);
                match o.kind {
                    OpeningKind::Window => {
                        push_box(m.batch(frame_mat), o0, mul(ud, ws), [0.0, fr, 0.0], across);
                        let g0 = add(add(o0, mul(ud, fr)), add([0.0, fr, 0.0], mul(across, 0.45)));
                        push_box(m.batch("cam"), g0, mul(ud, ws - 2.0 * fr), [0.0, hs - 2.0 * fr, 0.0], mul(across, 0.1));
                        if ws > 1600.0 {
                            let n = (ws / 1200.0).floor() as i32;
                            for k in 1..=n {
                                let x = ws * k as f64 / (n + 1) as f64;
                                push_box(m.batch(frame_mat), add(o0, mul(ud, x - fr / 2.0)), mul(ud, fr), [0.0, hs, 0.0], across);
                            }
                        }
                    }
                    OpeningKind::Door => {
                        if w.exterior {
                            let l0 = add(add(o0, mul(ud, fr)), mul(across, 0.3));
                            push_box(m.batch("kapi-ahsap"), l0, mul(ud, ws - 2.0 * fr), [0.0, hs - fr, 0.0], mul(across, 0.4));
                        } else {
                            // iç kapı kanadı 90° açık, menteşe tarafına göre
                            let hinge_right = o.swing.starts_with("sag");
                            let inward = !o.swing.ends_with("disa");
                            let hx = if hinge_right { ws - fr } else { fr };
                            let dir = if inward { -1.0 } else { 1.0 };
                            let leaf = [right[0] * dir * (ws - 2.0 * fr), 0.0, right[1] * dir * (ws - 2.0 * fr)];
                            let p = add(world(p0, base), add(mul(ud, hx), mul([right[0] * dir, 0.0, right[1] * dir], half)));
                            let thick = mul(ud, if hinge_right { -40.0 } else { 40.0 });
                            push_box(m.batch("kapi-ahsap"), p, thick, [0.0, hs - fr - 10.0, 0.0], leaf);
                        }
                    }
                }
            }
        }
        // mobilya ve nesneler
        if opt.furniture {
            for o in scene.objects.iter().filter(|o| o.level == level.id) {
                push_object(&mut m, scene, o, el);
            }
        }
    }
    if opt.ground {
        let (mut mn, mut mx) = ([0.0f64, 0.0], [10_000.0f64, 8_000.0]);
        let mut pts = vec![];
        for l in &scene.levels {
            for w in &l.walls {
                pts.push(w.a);
                pts.push(w.b);
            }
        }
        if !pts.is_empty() {
            let bb = geom::bbox(&pts);
            mn = bb.0;
            mx = bb.1;
        }
        let pad = 40_000.0;
        let b = m.batch(if opt.ground_material.is_empty() { "zemin-dis" } else { &opt.ground_material });
        quad(b, [mn[0] - pad, -2.0, mn[1] - pad], [mx[0] - mn[0] + 2.0 * pad, 0.0, 0.0], [0.0, 0.0, mx[1] - mn[1] + 2.0 * pad], [0.0, 1.0, 0.0]);
    }
    m.batches.retain(|b| !b.positions.is_empty());
    for b in m.batches.iter_mut().filter(|b| !b.uvs.is_empty()) {
        b.pad_uvs();
    }
    m
}

pub fn push_object(m: &mut SceneMesh, scene: &Scene, o: &Object, elevation: f64) {
    let base = [o.position[0], elevation + o.position[2], o.position[1]];
    let sc = o.scale;
    let tf = |p: [f64; 3]| -> V3 {
        let r = rot2(p[0] * sc[0], p[2] * sc[2], o.rotation);
        [base[0] + r[0], base[1] + p[1] * sc[1], base[2] + r[1]]
    };
    let axis = |p: [f64; 3]| -> V3 {
        let r = rot2(p[0], p[2], o.rotation);
        [r[0], p[1], r[1]]
    };
    if let Some(cat) = o.mesh.strip_prefix("cat:") {
        for p in catalog::parts(cat) {
            let mat = match (&o.material, p.material) {
                (_, "lamba-isik") | (_, "cam") | (_, "ayna") => p.material.to_string(),
                (Some(x), _) if !x.is_empty() => x.clone(),
                _ => p.material.to_string(),
            };
            let origin = tf(p.min);
            let u = axis([(p.max[0] - p.min[0]) * sc[0], 0.0, 0.0]);
            let v = [0.0, (p.max[1] - p.min[1]) * sc[1], 0.0];
            let w = axis([0.0, 0.0, (p.max[2] - p.min[2]) * sc[2]]);
            push_shape(m.batch(&mat), p.shape, origin, u, v, w);
        }
    } else if let Some(asset) = scene.meshes.iter().find(|a| a.id == o.mesh) {
        // ağır modeller varlık deposunda; küçükler sahnenin içinde
        let stored = if asset.store.is_empty() { None } else { crate::store::mesh(&asset.store) };
        let (positions, normals, uvs, indices) = match &stored {
            Some(d) => (&d.positions, &d.normals, &d.uvs, &d.indices),
            None => (&asset.positions, &asset.normals, &asset.uvs, &asset.indices),
        };
        for g in &asset.groups {
            let mat = o.material.clone().filter(|x| !x.is_empty()).unwrap_or_else(|| g.material.clone());
            let b = m.batch(&mat);
            let with_uv = !uvs.is_empty();
            if with_uv {
                b.pad_uvs();
            }
            let end = (g.start + g.count).min(indices.len() as u32);
            for k in g.start..end {
                let i = indices[k as usize] as usize;
                let Some(p) = positions.get(i) else { continue };
                let n = normals.get(i).copied().unwrap_or([0.0, 1.0, 0.0]);
                b.positions.push(f(tf([p[0] as f64, p[1] as f64, p[2] as f64])));
                b.normals.push(f(norm(axis([n[0] as f64 / sc[0].max(1e-6), n[1] as f64 / sc[1].max(1e-6), n[2] as f64 / sc[2].max(1e-6)]))));
                if with_uv {
                    b.uvs.push(uvs.get(i).copied().unwrap_or([0.0, 0.0]));
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn box_normals_point_outward_and_winding_matches() {
        let mut b = Batch::default();
        push_box(&mut b, [0.0, 0.0, 0.0], [2.0, 0.0, 0.0], [0.0, 3.0, 0.0], [0.0, 0.0, 4.0]);
        assert_eq!(b.positions.len(), 36);
        let c = [1.0f32, 1.5, 2.0];
        for t in 0..12 {
            let (p0, p1, p2) = (b.positions[t * 3], b.positions[t * 3 + 1], b.positions[t * 3 + 2]);
            let e1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
            let e2 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
            let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
            let to = [p0[0] - c[0], p0[1] - c[1], p0[2] - c[2]];
            assert!(n[0] * to[0] + n[1] * to[1] + n[2] * to[2] > 0.0, "üçgen {t} içe bakıyor");
        }
    }

    #[test]
    fn demo_scene_builds_reasonable_mesh() {
        let s = crate::templates::demo_scene();
        let m = build(&s, &MeshOptions::default());
        let tris = m.triangle_count();
        assert!(tris > 1500 && tris < 200_000, "{tris}");
        let (mn, mx) = m.bounds();
        assert!(mx[1] >= 3199.0 && mx[1] < 3300.0, "yükseklik {}", mx[1]);
        assert!(mn[1] <= -1.0);
        assert!(m.batches.iter().any(|b| b.material == "cam"));
        assert!(m.batches.iter().any(|b| b.material == "beton-kabuk"));
        let cut = build(&s, &MeshOptions { roof: false, ..Default::default() });
        assert!(cut.triangle_count() < tris);
    }

    #[test]
    fn shaped_parts_stay_inside_their_box_and_have_unit_normals() {
        use crate::catalog::Shape;
        for shape in [Shape::Round(40.0), Shape::Cyl, Shape::Ball, Shape::Box] {
            let mut b = Batch::default();
            push_shape(&mut b, shape, [100.0, 0.0, -50.0], [400.0, 0.0, 0.0], [0.0, 300.0, 0.0], [0.0, 0.0, 200.0]);
            assert!(b.positions.len() >= 36 && b.positions.len() % 3 == 0, "{shape:?}");
            for p in &b.positions {
                assert!(p[0] >= 99.9 && p[0] <= 500.1 && p[1] >= -0.1 && p[1] <= 300.1 && p[2] >= -50.1 && p[2] <= 150.1, "{shape:?} kutudan taştı: {p:?}");
            }
            for n in &b.normals {
                assert!((n[0] * n[0] + n[1] * n[1] + n[2] * n[2] - 1.0).abs() < 1e-3);
            }
            // üçgenler dışa bakar
            let c = [300.0f32, 150.0, 50.0];
            let out = b.positions.chunks(3).filter(|t| {
                let e1 = [t[1][0] - t[0][0], t[1][1] - t[0][1], t[1][2] - t[0][2]];
                let e2 = [t[2][0] - t[0][0], t[2][1] - t[0][1], t[2][2] - t[0][2]];
                let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
                let m = [(t[0][0] + t[1][0] + t[2][0]) / 3.0 - c[0], (t[0][1] + t[1][1] + t[2][1]) / 3.0 - c[1], (t[0][2] + t[1][2] + t[2][2]) / 3.0 - c[2]];
                n[0] * m[0] + n[1] * m[1] + n[2] * m[2] >= -1e-3
            }).count();
            assert_eq!(out, b.positions.len() / 3, "{shape:?}: içe bakan üçgen var");
        }
    }

    #[test]
    fn slab_hole_decomposition() {
        let parts = rect_minus(([0.0, 0.0], [10.0, 4.0]), ([2.0, 1.0], [3.0, 5.0]));
        let area: f64 = parts.iter().map(|(a, b)| (b[0] - a[0]) * (b[1] - a[1])).sum();
        assert_eq!(area, 40.0 - 3.0);
    }
}
