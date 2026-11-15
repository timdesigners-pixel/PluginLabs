//! Fiziksel tabanlı yol izleme (path tracing) render motoru.
//!
//! BVH hızlandırma, güneş + gökyüzü + yayıcı (lamba) ışıkları için doğrudan ışık örnekleme,
//! yumuşak gölgeler, cam geçirgenliği, metal/parlak yansımalar, ACES ton eşleme ve
//! albedo/normal kılavuzlu gürültü azaltma. Yerelde çok iş parçacıklı çalışır.

use crate::mesh::{self, MeshOptions, SceneMesh};
use crate::model::Scene;
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Default, PartialEq)]
struct V(f32, f32, f32);
impl V {
    fn dot(self, o: V) -> f32 {
        self.0 * o.0 + self.1 * o.1 + self.2 * o.2
    }
    fn cross(self, o: V) -> V {
        V(self.1 * o.2 - self.2 * o.1, self.2 * o.0 - self.0 * o.2, self.0 * o.1 - self.1 * o.0)
    }
    fn len(self) -> f32 {
        self.dot(self).sqrt()
    }
    fn norm(self) -> V {
        let l = self.len();
        if l > 1e-20 {
            self * (1.0 / l)
        } else {
            V(0.0, 1.0, 0.0)
        }
    }
    fn mul(self, o: V) -> V {
        V(self.0 * o.0, self.1 * o.1, self.2 * o.2)
    }
    fn max_c(self) -> f32 {
        self.0.max(self.1).max(self.2)
    }
    fn min_v(self, o: V) -> V {
        V(self.0.min(o.0), self.1.min(o.1), self.2.min(o.2))
    }
    fn max_v(self, o: V) -> V {
        V(self.0.max(o.0), self.1.max(o.1), self.2.max(o.2))
    }
    fn get(self, k: usize) -> f32 {
        match k {
            0 => self.0,
            1 => self.1,
            _ => self.2,
        }
    }
    fn lum(self) -> f32 {
        0.2126 * self.0 + 0.7152 * self.1 + 0.0722 * self.2
    }
}
impl std::ops::Add for V {
    type Output = V;
    fn add(self, o: V) -> V {
        V(self.0 + o.0, self.1 + o.1, self.2 + o.2)
    }
}
impl std::ops::Sub for V {
    type Output = V;
    fn sub(self, o: V) -> V {
        V(self.0 - o.0, self.1 - o.1, self.2 - o.2)
    }
}
impl std::ops::Mul<f32> for V {
    type Output = V;
    fn mul(self, s: f32) -> V {
        V(self.0 * s, self.1 * s, self.2 * s)
    }
}
impl std::ops::Neg for V {
    type Output = V;
    fn neg(self) -> V {
        V(-self.0, -self.1, -self.2)
    }
}

struct Rng(u64);
impl Rng {
    fn new(seed: u64) -> Rng {
        let mut r = Rng(seed.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407));
        r.next();
        r
    }
    fn next(&mut self) -> u32 {
        let old = self.0;
        self.0 = old.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        let x = (((old >> 18) ^ old) >> 27) as u32;
        let rot = (old >> 59) as u32;
        x.rotate_right(rot)
    }
    fn f(&mut self) -> f32 {
        (self.next() >> 8) as f32 * (1.0 / 16_777_216.0)
    }
}

#[derive(Clone, Copy)]
struct Mat {
    albedo: V,
    rough: f32,
    metal: f32,
    emit: V,
    glass: bool,
}

#[derive(Clone, Copy)]
struct Tri {
    v0: V,
    e1: V,
    e2: V,
    n: V,
    mat: u16,
}

#[derive(Clone, Copy, Default)]
struct Node {
    mn: V,
    mx: V,
    /// iç düğümde sol çocuk, yaprakta ilk üçgen
    a: u32,
    /// yaprakta üçgen sayısı (0 = iç düğüm)
    n: u32,
}

struct Bvh {
    nodes: Vec<Node>,
    tris: Vec<Tri>,
}

impl Bvh {
    fn build(mut tris: Vec<Tri>) -> Bvh {
        let mut nodes = Vec::with_capacity(tris.len() * 2 / 3 + 1);
        nodes.push(Node::default());
        let mut stack = vec![(0usize, 0usize, tris.len())];
        let cen = |t: &Tri| t.v0 + (t.e1 + t.e2) * (1.0 / 3.0);
        while let Some((ni, s, e)) = stack.pop() {
            let mut mn = V(f32::INFINITY, f32::INFINITY, f32::INFINITY);
            let mut mx = -mn;
            let mut cmn = mn;
            let mut cmx = mx;
            for t in &tris[s..e] {
                for p in [t.v0, t.v0 + t.e1, t.v0 + t.e2] {
                    mn = mn.min_v(p);
                    mx = mx.max_v(p);
                }
                let c = cen(t);
                cmn = cmn.min_v(c);
                cmx = cmx.max_v(c);
            }
            nodes[ni].mn = mn;
            nodes[ni].mx = mx;
            if e - s <= 4 {
                nodes[ni].a = s as u32;
                nodes[ni].n = (e - s) as u32;
                continue;
            }
            // SAH (yüzey alanı sezgisi) ile 12 kutulu bölme
            let area = |a: V, b: V| {
                let d = b - a;
                if d.0 < 0.0 {
                    0.0
                } else {
                    d.0 * d.1 + d.1 * d.2 + d.2 * d.0
                }
            };
            const BINS: usize = 12;
            let mut best = (f32::INFINITY, 0usize, 0.0f32);
            for axis in 0..3 {
                let lo = cmn.get(axis);
                let span = cmx.get(axis) - lo;
                if span <= 1e-6 {
                    continue;
                }
                let inf = V(f32::INFINITY, f32::INFINITY, f32::INFINITY);
                let mut bmn = [inf; BINS];
                let mut bmx = [-inf; BINS];
                let mut cnt = [0usize; BINS];
                for t in &tris[s..e] {
                    let b = (((cen(t).get(axis) - lo) / span * BINS as f32) as usize).min(BINS - 1);
                    cnt[b] += 1;
                    for p in [t.v0, t.v0 + t.e1, t.v0 + t.e2] {
                        bmn[b] = bmn[b].min_v(p);
                        bmx[b] = bmx[b].max_v(p);
                    }
                }
                let mut ra = [0f32; BINS];
                let mut rc = [0usize; BINS];
                let (mut amn, mut amx, mut ac) = (inf, -inf, 0);
                for b in (1..BINS).rev() {
                    amn = amn.min_v(bmn[b]);
                    amx = amx.max_v(bmx[b]);
                    ac += cnt[b];
                    ra[b] = area(amn, amx);
                    rc[b] = ac;
                }
                let (mut lmn, mut lmx, mut lc) = (inf, -inf, 0);
                for b in 0..BINS - 1 {
                    lmn = lmn.min_v(bmn[b]);
                    lmx = lmx.max_v(bmx[b]);
                    lc += cnt[b];
                    if lc == 0 || rc[b + 1] == 0 {
                        continue;
                    }
                    let cost = area(lmn, lmx) * lc as f32 + ra[b + 1] * rc[b + 1] as f32;
                    if cost < best.0 {
                        best = (cost, axis, lo + span * (b + 1) as f32 / BINS as f32);
                    }
                }
            }
            let leaf_cost = area(mn, mx) * (e - s) as f32;
            if !best.0.is_finite() || (best.0 >= leaf_cost && e - s <= 8) {
                nodes[ni].a = s as u32;
                nodes[ni].n = (e - s) as u32;
                continue;
            }
            let (axis, split) = (best.1, best.2);
            let mut i = s;
            let mut j = e;
            while i < j {
                if cen(&tris[i]).get(axis) < split {
                    i += 1;
                } else {
                    j -= 1;
                    tris.swap(i, j);
                }
            }
            let mid = if i == s || i == e { (s + e) / 2 } else { i };
            if i == s || i == e {
                tris[s..e].select_nth_unstable_by(mid - s, |a, b| cen(a).get(axis).partial_cmp(&cen(b).get(axis)).unwrap_or(std::cmp::Ordering::Equal));
            }
            let l = nodes.len();
            nodes.push(Node::default());
            nodes.push(Node::default());
            nodes[ni].a = l as u32;
            nodes[ni].n = 0;
            stack.push((l, s, mid));
            stack.push((l + 1, mid, e));
        }
        Bvh { nodes, tris }
    }

    fn hit_box(n: &Node, o: V, inv: V, tmax: f32) -> f32 {
        let mut t0 = 0.0f32;
        let mut t1 = tmax;
        for k in 0..3 {
            let a = (n.mn.get(k) - o.get(k)) * inv.get(k);
            let b = (n.mx.get(k) - o.get(k)) * inv.get(k);
            let (a, b) = if a < b { (a, b) } else { (b, a) };
            t0 = t0.max(a);
            t1 = t1.min(b);
            if t0 > t1 {
                return f32::INFINITY;
            }
        }
        t0
    }

    /// En yakın kesişim: (t, üçgen indeksi).
    fn intersect(&self, o: V, d: V, tmax: f32) -> Option<(f32, usize)> {
        let inv = V(1.0 / d.0, 1.0 / d.1, 1.0 / d.2);
        let mut best = tmax;
        let mut hit = None;
        let mut stack = [0u32; 64];
        let mut sp = 1;
        while sp > 0 {
            sp -= 1;
            let n = &self.nodes[stack[sp] as usize];
            if Self::hit_box(n, o, inv, best) >= best {
                continue;
            }
            if n.n > 0 {
                for i in n.a..n.a + n.n {
                    let t = &self.tris[i as usize];
                    let p = d.cross(t.e2);
                    let det = t.e1.dot(p);
                    if det.abs() < 1e-9 {
                        continue;
                    }
                    let id = 1.0 / det;
                    let s = o - t.v0;
                    let u = s.dot(p) * id;
                    if !(0.0..=1.0).contains(&u) {
                        continue;
                    }
                    let q = s.cross(t.e1);
                    let v = d.dot(q) * id;
                    if v < 0.0 || u + v > 1.0 {
                        continue;
                    }
                    let tt = t.e2.dot(q) * id;
                    if tt > 1e-3 && tt < best {
                        best = tt;
                        hit = Some((tt, i as usize));
                    }
                }
            } else if sp + 2 <= stack.len() {
                let (l, r) = (n.a, n.a + 1);
                let tl = Self::hit_box(&self.nodes[l as usize], o, inv, best);
                let tr = Self::hit_box(&self.nodes[r as usize], o, inv, best);
                // yakın çocuk en son itilir (önce ziyaret edilir)
                let (near, far, tn, tf) = if tl <= tr { (l, r, tl, tr) } else { (r, l, tr, tl) };
                if tf < best {
                    stack[sp] = far;
                    sp += 1;
                }
                if tn < best {
                    stack[sp] = near;
                    sp += 1;
                }
            }
        }
        hit
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "kebab-case")]
pub enum Atmosphere {
    #[default]
    Gunduz,
    GunBatimi,
    Aksam,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct RenderSettings {
    pub width: u32,
    pub height: u32,
    pub samples: u32,
    pub bounces: u32,
    pub atmosphere: Atmosphere,
    pub exposure: f32,
    pub denoise: bool,
    /// Boşsa sahne kamerası.
    pub eye: Option<[f64; 3]>,
    pub target: Option<[f64; 3]>,
    pub fov: Option<f64>,
    pub mesh: MeshOptions,
    pub threads: u32,
    pub seed: u64,
}
impl Default for RenderSettings {
    fn default() -> Self {
        RenderSettings { width: 960, height: 540, samples: 32, bounces: 4, atmosphere: Atmosphere::Gunduz, exposure: 0.62, denoise: true, eye: None, target: None, fov: None, mesh: MeshOptions::default(), threads: 0, seed: 7 }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct RenderResult {
    pub width: u32,
    pub height: u32,
    pub png: Vec<u8>,
    pub triangles: usize,
    pub samples: u32,
    pub threads: u32,
    pub rays: u64,
}

struct Env {
    sun_dir: V,
    sun_col: V,
    sun_cos: f32,
    zenith: V,
    horizon: V,
    ground: V,
    lamp_gain: f32,
}

impl Env {
    fn new(scene: &Scene, a: Atmosphere) -> Env {
        let s = &scene.sun;
        let (az, el, sun_i, lamp) = match a {
            Atmosphere::Gunduz => (s.azimuth, s.elevation, s.intensity as f32, 0.6),
            Atmosphere::GunBatimi => (s.azimuth - 40.0, 7.0, s.intensity as f32 * 0.85, 1.0),
            Atmosphere::Aksam => (s.azimuth, -12.0, 0.0, 1.6),
        };
        let (az, el) = (az.to_radians() as f32, el.to_radians() as f32);
        let sun_dir = V(el.cos() * az.sin(), el.sin(), el.cos() * az.cos()).norm();
        let sky = s.sky as f32;
        let (sun_col, zenith, horizon, ground) = match a {
            Atmosphere::Gunduz => (V(1.0, 0.95, 0.86), V(0.26, 0.45, 0.85), V(0.78, 0.86, 0.95), V(0.30, 0.31, 0.28)),
            Atmosphere::GunBatimi => (V(1.0, 0.55, 0.26), V(0.20, 0.25, 0.48), V(1.0, 0.62, 0.40), V(0.22, 0.18, 0.15)),
            Atmosphere::Aksam => (V(0.0, 0.0, 0.0), V(0.015, 0.025, 0.06), V(0.05, 0.06, 0.10), V(0.02, 0.02, 0.025)),
        };
        Env { sun_dir, sun_col: sun_col * sun_i, sun_cos: (0.6f32).to_radians().cos(), zenith: zenith * sky, horizon: horizon * sky, ground: ground * sky, lamp_gain: lamp }
    }
    fn sky(&self, d: V) -> V {
        if d.1 < 0.0 {
            return self.ground * (1.0 + d.1 * 0.5);
        }
        let t = d.1.powf(0.45);
        let base = self.horizon * (1.0 - t) + self.zenith * t;
        // güneş çevresindeki parlama
        let c = d.dot(self.sun_dir).max(0.0);
        base + self.sun_col * (c.powf(64.0) * 0.25)
    }
}

fn onb(n: V) -> (V, V) {
    let a = if n.0.abs() > 0.9 { V(0.0, 1.0, 0.0) } else { V(1.0, 0.0, 0.0) };
    let t = a.cross(n).norm();
    (t, n.cross(t))
}

fn cosine_dir(n: V, r: &mut Rng) -> V {
    let (u1, u2) = (r.f(), r.f());
    let rr = u1.sqrt();
    let phi = 2.0 * std::f32::consts::PI * u2;
    let (t, b) = onb(n);
    (t * (rr * phi.cos()) + b * (rr * phi.sin()) + n * (1.0 - u1).max(0.0).sqrt()).norm()
}

struct Lamp {
    tri: usize,
    area: f32,
    cdf: f32,
}

struct Tracer<'a> {
    bvh: &'a Bvh,
    mats: &'a [Mat],
    env: &'a Env,
    lamps: &'a [Lamp],
    lamp_total: f32,
    bounces: u32,
}

impl Tracer<'_> {
    /// Gölge ışını: camdan geçerken renk süzer.
    fn transmit(&self, mut o: V, d: V, mut dist: f32) -> V {
        let mut t = V(1.0, 1.0, 1.0);
        for _ in 0..4 {
            match self.bvh.intersect(o, d, dist) {
                None => return t,
                Some((h, i)) => {
                    let m = &self.mats[self.bvh.tris[i].mat as usize];
                    if !m.glass {
                        return V(0.0, 0.0, 0.0);
                    }
                    t = t.mul(m.albedo * 0.92);
                    o = o + d * (h + 1e-2);
                    dist -= h + 1e-2;
                }
            }
        }
        V(0.0, 0.0, 0.0)
    }

    fn sample_lamp(&self, p: V, n: V, r: &mut Rng) -> V {
        if self.lamps.is_empty() {
            return V(0.0, 0.0, 0.0);
        }
        let x = r.f() * self.lamp_total;
        let k = self.lamps.partition_point(|l| l.cdf < x).min(self.lamps.len() - 1);
        let l = &self.lamps[k];
        let t = &self.bvh.tris[l.tri];
        let (mut u, mut v) = (r.f(), r.f());
        if u + v > 1.0 {
            u = 1.0 - u;
            v = 1.0 - v;
        }
        let q = t.v0 + t.e1 * u + t.e2 * v;
        let w = q - p;
        let d2 = w.dot(w).max(1.0);
        let dist = d2.sqrt();
        let wd = w * (1.0 / dist);
        let cos_x = n.dot(wd);
        let cos_l = t.n.dot(-wd).abs();
        if cos_x <= 0.0 || cos_l <= 0.0 {
            return V(0.0, 0.0, 0.0);
        }
        let vis = self.transmit(p + n * 1.0, wd, dist - 2.0);
        if vis.max_c() <= 0.0 {
            return V(0.0, 0.0, 0.0);
        }
        let pdf = l.area / self.lamp_total; // seçim olasılığı × alan yoğunluğu (1/alan) tersinin çarpımı
        let le = self.mats[t.mat as usize].emit * self.env.lamp_gain;
        // L = Le · cosx · cosl / d² · (alan / seçim olasılığı)
        let geo = cos_x * cos_l / d2 * (l.area / pdf.max(1e-12));
        vis.mul(le) * geo
    }

    fn radiance(&self, mut o: V, mut d: V, r: &mut Rng, first: &mut (V, V, f32)) -> (V, u64) {
        let mut l = V(0.0, 0.0, 0.0);
        let mut thr = V(1.0, 1.0, 1.0);
        let mut rays = 0u64;
        let mut count_emit = true;
        for depth in 0..=self.bounces {
            rays += 1;
            let Some((t, i)) = self.bvh.intersect(o, d, 1e9) else {
                l = l + thr.mul(self.env.sky(d));
                if depth == 0 {
                    *first = (self.env.sky(d), V(0.0, 0.0, 0.0), 1e9);
                }
                break;
            };
            let tri = &self.bvh.tris[i];
            let m = &self.mats[tri.mat as usize];
            let p = o + d * t;
            let mut n = tri.n;
            if n.dot(d) > 0.0 {
                n = -n;
            }
            if depth == 0 {
                *first = (m.albedo, n, t);
            }
            if m.emit.max_c() > 0.0 {
                if count_emit {
                    l = l + thr.mul(m.emit * self.env.lamp_gain);
                }
                break;
            }
            if m.glass {
                // ince cam: Fresnel olasılığıyla yansı, aksi hâlde geç
                let c = (-d.dot(n)).clamp(0.0, 1.0);
                let f = 0.04 + 0.96 * (1.0 - c).powi(5);
                if r.f() < f {
                    d = (d - n * (2.0 * d.dot(n))).norm();
                    o = p + n * 0.5;
                } else {
                    thr = thr.mul(m.albedo * 0.95);
                    o = p - n * 0.5;
                }
                count_emit = true;
                continue;
            }
            let spec_p = (m.metal + (1.0 - m.metal) * (0.04 + 0.25 * (1.0 - m.rough).powi(2))).clamp(0.0, 0.98);
            if r.f() < spec_p {
                let refl = (d - n * (2.0 * d.dot(n))).norm();
                let a = m.rough * m.rough;
                let j = V(r.f() * 2.0 - 1.0, r.f() * 2.0 - 1.0, r.f() * 2.0 - 1.0) * a;
                let nd = (refl + j).norm();
                if nd.dot(n) <= 0.0 {
                    break;
                }
                let tint = if m.metal > 0.5 { m.albedo } else { V(1.0, 1.0, 1.0) };
                thr = thr.mul(tint);
                d = nd;
                o = p + n * 0.5;
                count_emit = m.rough < 0.3;
            } else {
                // doğrudan ışık: güneş
                let sun_c = n.dot(self.env.sun_dir);
                if sun_c > 0.0 && self.env.sun_col.max_c() > 0.0 {
                    let (tt, bb) = onb(self.env.sun_dir);
                    let rad = (1.0 - self.env.sun_cos).sqrt() * 1.4;
                    let jd = (self.env.sun_dir + tt * ((r.f() - 0.5) * rad) + bb * ((r.f() - 0.5) * rad)).norm();
                    let vis = self.transmit(p + n * 0.5, jd, 1e9);
                    rays += 1;
                    l = l + thr.mul(m.albedo).mul(self.env.sun_col).mul(vis) * sun_c;
                }
                // doğrudan ışık: lambalar
                if !self.lamps.is_empty() {
                    let le = self.sample_lamp(p, n, r);
                    rays += 1;
                    l = l + thr.mul(m.albedo).mul(le) * (1.0 / std::f32::consts::PI);
                }
                thr = thr.mul(m.albedo);
                d = cosine_dir(n, r);
                o = p + n * 0.5;
                count_emit = false;
            }
            if depth >= 2 {
                let q = thr.max_c().clamp(0.05, 0.95);
                if r.f() > q {
                    break;
                }
                thr = thr * (1.0 / q);
            }
        }
        (l, rays)
    }
}

fn aces(x: f32) -> f32 {
    ((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)).clamp(0.0, 1.0)
}
fn srgb(x: f32) -> u8 {
    let c = if x <= 0.003_130_8 { 12.92 * x } else { 1.055 * x.powf(1.0 / 2.4) - 0.055 };
    (c.clamp(0.0, 1.0) * 255.0 + 0.5) as u8
}

pub fn prepare(scene: &Scene, s: &RenderSettings) -> SceneMesh {
    mesh::build(scene, &s.mesh)
}

pub fn render(scene: &Scene, s: &RenderSettings) -> Result<RenderResult, String> {
    let (w, h) = (s.width.clamp(16, 3840), s.height.clamp(16, 2160));
    let spp = s.samples.clamp(1, 2048);
    let sm = prepare(scene, s);
    let mut mats: Vec<Mat> = vec![];
    let mut tris: Vec<Tri> = vec![];
    for b in &sm.batches {
        let m = scene.material(&b.material).cloned().unwrap_or_default();
        let idx = mats.len() as u16;
        let albedo = V(m.color[0], m.color[1], m.color[2]) * 0.92;
        mats.push(Mat { albedo, rough: m.roughness.clamp(0.0, 1.0), metal: m.metallic.clamp(0.0, 1.0), emit: V(m.color[0], m.color[1], m.color[2]) * m.emission.max(0.0), glass: m.opacity < 0.5 });
        for t in b.positions.chunks(3) {
            if t.len() < 3 {
                continue;
            }
            let v0 = V(t[0][0], t[0][1], t[0][2]);
            let e1 = V(t[1][0], t[1][1], t[1][2]) - v0;
            let e2 = V(t[2][0], t[2][1], t[2][2]) - v0;
            let n = e1.cross(e2);
            if n.len() < 1e-6 {
                continue;
            }
            tris.push(Tri { v0, e1, e2, n: n.norm(), mat: idx });
        }
    }
    if tris.is_empty() {
        return Err("Render edilecek geometri yok".into());
    }
    let tri_count = tris.len();
    let bvh = Bvh::build(tris);
    let mut lamps = vec![];
    let mut acc = 0.0;
    for (i, t) in bvh.tris.iter().enumerate() {
        if mats[t.mat as usize].emit.max_c() > 0.0 {
            let a = t.e1.cross(t.e2).len() * 0.5;
            acc += a;
            lamps.push(Lamp { tri: i, area: a, cdf: acc });
        }
    }
    let env = Env::new(scene, s.atmosphere);
    let tracer = Tracer { bvh: &bvh, mats: &mats, env: &env, lamps: &lamps, lamp_total: acc, bounces: s.bounces.clamp(1, 12) };
    let eye = s.eye.unwrap_or(scene.camera.eye);
    let tgt = s.target.unwrap_or(scene.camera.target);
    let fov = s.fov.unwrap_or(scene.camera.fov).clamp(10.0, 120.0) as f32;
    let e = V(eye[0] as f32, eye[1] as f32, eye[2] as f32);
    let fwd = (V(tgt[0] as f32, tgt[1] as f32, tgt[2] as f32) - e).norm();
    let right = fwd.cross(V(0.0, 1.0, 0.0)).norm();
    let up = right.cross(fwd);
    let th = (fov.to_radians() * 0.5).tan();
    let aspect = w as f32 / h as f32;
    let n_px = (w * h) as usize;
    let mut color = vec![V::default(); n_px];
    let mut albedo = vec![V::default(); n_px];
    let mut normal = vec![V::default(); n_px];
    let mut depth = vec![0f32; n_px];
    let threads = {
        #[cfg(target_arch = "wasm32")]
        {
            1
        }
        #[cfg(not(target_arch = "wasm32"))]
        {
            let hw = std::thread::available_parallelism().map(|n| n.get() as u32).unwrap_or(4);
            if s.threads == 0 { hw } else { s.threads.min(hw.max(1)) }.clamp(1, 64)
        }
    };
    let render_rows = |y0: u32, y1: u32, col: &mut [V], alb: &mut [V], nor: &mut [V], dep: &mut [f32]| -> u64 {
        let mut rays = 0u64;
        for y in y0..y1 {
            for x in 0..w {
                let k = ((y - y0) * w + x) as usize;
                let mut r = Rng::new(s.seed ^ ((y as u64) << 32 | x as u64).wrapping_mul(0x9E37_79B9_7F4A_7C15));
                let mut sum = V::default();
                let mut f_alb = V::default();
                let mut f_nor = V::default();
                let mut f_dep = 0.0;
                for _ in 0..spp {
                    let px = ((x as f32 + r.f()) / w as f32 * 2.0 - 1.0) * th * aspect;
                    let py = (1.0 - (y as f32 + r.f()) / h as f32 * 2.0) * th;
                    let dir = (fwd + right * px + up * py).norm();
                    let mut first = (V::default(), V::default(), 0.0);
                    let (c, n) = tracer.radiance(e, dir, &mut r, &mut first);
                    rays += n;
                    // aşırı parlak örnekleri bastır (ateş böceği)
                    let lum = c.lum();
                    let c = if lum > 40.0 { c * (40.0 / lum) } else { c };
                    sum = sum + c;
                    f_alb = f_alb + first.0;
                    f_nor = f_nor + first.1;
                    f_dep += first.2;
                }
                let inv = 1.0 / spp as f32;
                col[k] = sum * inv;
                alb[k] = f_alb * inv;
                nor[k] = f_nor * inv;
                dep[k] = f_dep * inv;
            }
        }
        rays
    };
    let mut rays = 0u64;
    #[cfg(target_arch = "wasm32")]
    {
        rays += render_rows(0, h, &mut color, &mut albedo, &mut normal, &mut depth);
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        let rows_per = h.div_ceil(threads).max(1);
        let chunk = (rows_per * w) as usize;
        let results: Vec<u64> = std::thread::scope(|sc| {
            let mut handles = vec![];
            for (i, (((c, a), n), d)) in color.chunks_mut(chunk).zip(albedo.chunks_mut(chunk)).zip(normal.chunks_mut(chunk)).zip(depth.chunks_mut(chunk)).enumerate() {
                let y0 = i as u32 * rows_per;
                let y1 = (y0 + rows_per).min(h);
                let f = &render_rows;
                handles.push(sc.spawn(move || f(y0, y1, c, a, n, d)));
            }
            handles.into_iter().map(|h| h.join().unwrap_or(0)).collect()
        });
        rays += results.iter().sum::<u64>();
    }
    if s.denoise && spp < 512 {
        color = denoise(&color, &albedo, &normal, &depth, w as usize, h as usize);
    }
    let exp = s.exposure.clamp(0.05, 8.0);
    let mut rgba = Vec::with_capacity(n_px * 4);
    for c in &color {
        let c = *c * exp;
        rgba.extend_from_slice(&[srgb(aces(c.0)), srgb(aces(c.1)), srgb(aces(c.2)), 255]);
    }
    let png = encode_png(&rgba, w, h)?;
    Ok(RenderResult { width: w, height: h, png, triangles: tri_count, samples: spp, threads, rays })
}

/// Albedo ve normal kılavuzlu kenar korumalı süzgeç (à-trous, 3 geçiş).
fn denoise(col: &[V], alb: &[V], nor: &[V], dep: &[f32], w: usize, h: usize) -> Vec<V> {
    let demod: Vec<V> = col.iter().zip(alb).map(|(c, a)| V(c.0 / a.0.max(0.02), c.1 / a.1.max(0.02), c.2 / a.2.max(0.02))).collect();
    let mut cur = demod;
    let kern = [1.0 / 16.0, 1.0 / 4.0, 3.0 / 8.0, 1.0 / 4.0, 1.0 / 16.0];
    for step in [1usize, 2, 4] {
        let mut out = vec![V::default(); w * h];
        for y in 0..h {
            for x in 0..w {
                let k = y * w + x;
                let (n0, d0, c0) = (nor[k], dep[k], cur[k]);
                let mut sum = V::default();
                let mut ws = 0.0;
                for j in 0..5 {
                    for i in 0..5 {
                        let xx = x as isize + (i as isize - 2) * step as isize;
                        let yy = y as isize + (j as isize - 2) * step as isize;
                        if xx < 0 || yy < 0 || xx >= w as isize || yy >= h as isize {
                            continue;
                        }
                        let q = yy as usize * w + xx as usize;
                        let wn = n0.dot(nor[q]).max(0.0).powi(32);
                        let wd = (-((dep[q] - d0).abs() / (d0 * 0.02 + 1.0))).exp();
                        let dc = (cur[q].lum() - c0.lum()).abs();
                        let wc = (-dc / (0.6 + c0.lum() * 0.5)).exp();
                        let wt = kern[i] * kern[j] * wn * wd * wc;
                        sum = sum + cur[q] * wt;
                        ws += wt;
                    }
                }
                out[k] = if ws > 1e-8 { sum * (1.0 / ws) } else { c0 };
            }
        }
        cur = out;
    }
    cur.iter().zip(alb).map(|(c, a)| V(c.0 * a.0.max(0.02), c.1 * a.1.max(0.02), c.2 * a.2.max(0.02))).collect()
}

pub fn encode_png(rgba: &[u8], w: u32, h: u32) -> Result<Vec<u8>, String> {
    let mut out = vec![];
    {
        let mut enc = png::Encoder::new(&mut out, w, h);
        enc.set_color(png::ColorType::Rgba);
        enc.set_depth(png::BitDepth::Eight);
        let mut wr = enc.write_header().map_err(|e| e.to_string())?;
        wr.write_image_data(rgba).map_err(|e| e.to_string())?;
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_demo_and_lights_it() {
        let s = crate::templates::demo_scene();
        let set = RenderSettings { width: 96, height: 54, samples: 4, bounces: 3, ..Default::default() };
        let r = render(&s, &set).unwrap();
        assert_eq!((r.width, r.height), (96, 54));
        assert_eq!(&r.png[1..4], b"PNG");
        assert!(r.rays > 96 * 54 * 4);
        let dec = png::Decoder::new(std::io::Cursor::new(&r.png));
        let mut reader = dec.read_info().unwrap();
        let mut buf = vec![0; reader.output_buffer_size()];
        reader.next_frame(&mut buf).unwrap();
        let mean: f64 = buf.chunks(4).map(|p| (p[0] as f64 + p[1] as f64 + p[2] as f64) / 3.0).sum::<f64>() / (96.0 * 54.0);
        assert!(mean > 30.0 && mean < 240.0, "ortalama parlaklık {mean}");
    }

    #[test]
    fn evening_is_darker_than_day() {
        let s = crate::templates::demo_scene();
        let mean = |a| {
            let r = render(&s, &RenderSettings { width: 48, height: 27, samples: 4, atmosphere: a, denoise: false, ..Default::default() }).unwrap();
            let mut rd = png::Decoder::new(std::io::Cursor::new(r.png)).read_info().unwrap();
            let mut b = vec![0; rd.output_buffer_size()];
            rd.next_frame(&mut b).unwrap();
            b.iter().map(|x| *x as f64).sum::<f64>() / b.len() as f64
        };
        assert!(mean(Atmosphere::Aksam) < mean(Atmosphere::Gunduz));
    }

    #[test]
    fn bvh_hits_nearest_triangle() {
        let t = |z: f32, m: u16| Tri { v0: V(-1.0, -1.0, z), e1: V(2.0, 0.0, 0.0), e2: V(0.0, 2.0, 0.0), n: V(0.0, 0.0, 1.0), mat: m };
        let tris: Vec<Tri> = (0..50).map(|k| t(10.0 + k as f32, k as u16)).collect();
        let b = Bvh::build(tris);
        let (d, i) = b.intersect(V(0.0, 0.0, 0.0), V(0.0, 0.0, 1.0), 1e9).unwrap();
        assert!((d - 10.0).abs() < 1e-4);
        assert_eq!(b.tris[i].mat, 0);
        assert!(b.intersect(V(5.0, 5.0, 0.0), V(0.0, 0.0, 1.0), 1e9).is_none());
    }
}
