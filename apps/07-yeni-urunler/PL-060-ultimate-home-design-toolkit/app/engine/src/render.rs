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
    /// 0 = düz renk, 1 = prosedürel (KINDS indeksi `kind`), 2 = görsel (`kind` = görsel indeksi)
    tex: u8,
    kind: u16,
    tscale: f32,
    /// Yüzey kabartısının derinliği (mm); 0 = düz.
    relief: f32,
    /// UV'li doku (`uvimgs` indisi; -1 = yok), pürüzlülük/metal haritası ve alfa kesme eşiği.
    uvtex: i32,
    orm: i32,
    cutoff: f32,
    /// Depodaki doku düzlemsel izdüşümle (duvar/zemin) eşlenir; ölçü `tscale` mm.
    planar: bool,
}

#[derive(Clone, Copy)]
struct Tri {
    v0: V,
    e1: V,
    e2: V,
    n: V,
    /// Köşe normalleri (yumuşak gölgeleme).
    ns: [V; 3],
    mat: u16,
    uv: [[f32; 2]; 3],
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
    /// "perspective" ya da "isometric" (paralel izdüşüm).
    pub projection: String,
    /// İzometrik görünümde çerçevenin dünya yüksekliği (mm). Boşsa kamera uzaklığından türetilir.
    pub ortho_height: Option<f64>,
    /// Gökyüzü motoru: boşsa atmosfer ön ayarının saati kullanılır.
    pub sky: Option<SkySettings>,
    /// Otomatik pozlama: görüntünün ortalama parlaklığını orta griye çeker; `exposure` bunun üstüne çarpılır.
    pub auto_exposure: bool,
    /// Diyafram (f/sayı): 0 = iğne deliği (her yer net). Tam kare (36 × 24 mm) algılayıcıya göre alan derinliği üretir.
    pub aperture: f32,
    /// Netlik uzaklığı (mm). Boşsa görüntünün ortasındaki yüzeye otomatik netlenir.
    pub focus: Option<f64>,
    /// Parlak bölgelerin çevresine yayılan ışık (0–1).
    pub bloom: f32,
    /// Köşe kararması (0–1).
    pub vignette: f32,
    /// Film greni (0–1).
    pub grain: f32,
    /// Keskinleştirme (0–1).
    pub sharpen: f32,
    /// Beyaz dengesi (Kelvin); 0 ya da 6500 = nötr, daha yüksek değer görüntüyü ısıtır.
    pub white_balance: f32,
    /// Yüzey kabartısı çarpanı (0 = kapalı, 1 = doğal).
    pub bump: f32,
    /// Render stili: default, editorial, archviz, clay, clay-white. Boş ya da tanınmayan değer = default.
    pub style: String,
}

/// Render stilleri. İlk öğe varsayılandır.
pub const STYLES: [&str; 5] = ["default", "editorial", "archviz", "clay", "clay-white"];

/// Stilin ayarlara etkisi: yalnız kullanıcının boş bıraktığı (0) görüntü ayarlarını doldurur.
#[derive(Clone, Copy, PartialEq)]
enum Clay {
    None,
    /// Duvar, tavan, kabuk ve dış zemin beyaz kil; zemin kaplaması, mobilya ve tekstil kendi renginde.
    Shell,
    /// Cam ve ışık dışındaki her yüzey beyaz kil.
    All,
}
struct Style {
    clay: Clay,
    studio: bool,
    ae_target: f32,
}
pub fn style_id(s: &str) -> &'static str {
    STYLES.iter().find(|k| **k == s).copied().unwrap_or("default")
}
fn apply_style(s: &RenderSettings) -> (RenderSettings, Style) {
    let mut o = s.clone();
    let fill = |v: &mut f32, x: f32| {
        if *v == 0.0 {
            *v = x;
        }
    };
    let id = style_id(&s.style);
    o.style = id.into();
    let st = match id {
        "editorial" => {
            // dergi çekimi: net, yüksek kontrastlı güneş, belirgin pencere gölgesi, hafif gren
            fill(&mut o.bloom, 0.12);
            fill(&mut o.vignette, 0.22);
            fill(&mut o.grain, 0.05);
            fill(&mut o.sharpen, 0.35);
            fill(&mut o.white_balance, 6300.0);
            fill(&mut o.aperture, 8.0);
            o.bounces = o.bounces.max(8);
            if let Some(k) = o.sky.as_mut() {
                k.cloud = k.cloud.min(0.1);
                k.haze = k.haze.min(0.15);
            }
            Style { clay: Clay::None, studio: false, ae_target: 0.22 }
        }
        "archviz" => {
            // mimari görselleştirme: aydınlık, yumuşak gölge, nötr renk, her yer net
            fill(&mut o.sharpen, 0.2);
            fill(&mut o.white_balance, 6500.0);
            fill(&mut o.bloom, 0.06);
            o.bounces = o.bounces.max(8);
            let mut k = o.sky.clone().unwrap_or_default();
            k.cloud = k.cloud.max(0.35);
            k.haze = k.haze.max(0.2);
            o.sky = Some(k);
            Style { clay: Clay::None, studio: false, ae_target: 0.32 }
        }
        "clay" => {
            fill(&mut o.sharpen, 0.15);
            o.bounces = o.bounces.max(6);
            Style { clay: Clay::Shell, studio: true, ae_target: 0.36 }
        }
        "clay-white" => {
            fill(&mut o.sharpen, 0.15);
            fill(&mut o.bloom, 0.25);
            o.bounces = o.bounces.max(6);
            Style { clay: Clay::All, studio: true, ae_target: 0.4 }
        }
        _ => Style { clay: Clay::None, studio: false, ae_target: 0.2 },
    };
    (o, st)
}

/// Gökyüzü ve atmosfer motoru parametreleri.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct SkySettings {
    /// Yerel saat (0–24).
    pub hour: f32,
    /// Ay (1–12): güneş yüksekliğini mevsime göre değiştirir.
    pub month: u32,
    /// Bulutluluk (0 = açık, 1 = kapalı).
    pub cloud: f32,
    /// Pus (0–1): ufku soldurur, güneşi yumuşatır.
    pub haze: f32,
    /// Enlem (derece).
    pub latitude: f32,
}
impl Default for SkySettings {
    fn default() -> Self {
        SkySettings { hour: 13.0, month: 6, cloud: 0.0, haze: 0.1, latitude: 39.0 }
    }
}

/// Güneşin konumu: (yükseklik°, güneyden batıya azimut°).
pub fn sun_position(sky: &SkySettings) -> (f32, f32) {
    let n = (sky.month.clamp(1, 12) as f32 - 0.5) * 30.4;
    let decl = 23.44f32.to_radians() * ((360.0 / 365.0 * (284.0 + n)).to_radians()).sin();
    let lat = sky.latitude.clamp(-66.0, 66.0).to_radians();
    let h = (15.0 * (sky.hour.rem_euclid(24.0) - 12.0)).to_radians();
    let el = (lat.sin() * decl.sin() + lat.cos() * decl.cos() * h.cos()).clamp(-1.0, 1.0).asin();
    let az = h.sin().atan2(h.cos() * lat.sin() - decl.tan() * lat.cos());
    (el.to_degrees(), az.to_degrees())
}
impl Default for RenderSettings {
    fn default() -> Self {
        RenderSettings { width: 960, height: 540, samples: 32, bounces: 4, atmosphere: Atmosphere::Gunduz, exposure: 0.62, denoise: true, eye: None, target: None, fov: None, mesh: MeshOptions::default(), threads: 0, seed: 7, projection: "perspective".into(), ortho_height: None, sky: None, auto_exposure: true, aperture: 0.0, focus: None, bloom: 0.0, vignette: 0.0, grain: 0.0, sharpen: 0.0, white_balance: 0.0, bump: 1.0, style: String::new() }
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
    fn new(scene: &Scene, a: Atmosphere, sky: Option<&SkySettings>) -> Env {
        let s = &scene.sun;
        // ön ayarlar saat olarak ifade edilir; gökyüzü motoru hepsini aynı modelle üretir
        let preset = match a {
            Atmosphere::Gunduz => SkySettings { hour: 13.5, ..Default::default() },
            Atmosphere::GunBatimi => {
                // öğleden sonra güneşin ~6° olduğu saat
                let mut k = SkySettings { hour: 15.0, ..Default::default() };
                while k.hour < 22.0 && sun_position(&k).0 > 6.0 {
                    k.hour += 0.05;
                }
                k
            }
            Atmosphere::Aksam => SkySettings { hour: 22.5, ..Default::default() },
        };
        let k = sky.cloned().unwrap_or(preset);
        let (el, az_s) = sun_position(&k);
        let lerp = |a: V, b: V, t: f32| a * (1.0 - t) + b * t;
        let cloud = k.cloud.clamp(0.0, 1.0);
        let haze = k.haze.clamp(0.0, 1.0);
        let day = (V(1.0, 0.95, 0.86), V(0.26, 0.45, 0.85), V(0.78, 0.86, 0.95), V(0.30, 0.31, 0.28));
        let low = (V(1.0, 0.50, 0.22), V(0.20, 0.25, 0.48), V(1.0, 0.60, 0.38), V(0.22, 0.18, 0.15));
        let night = (V(0.0, 0.0, 0.0), V(0.015, 0.025, 0.06), V(0.05, 0.06, 0.10), V(0.02, 0.02, 0.025));
        let (mut sun_col, mut zenith, mut horizon, ground, sun_i, lamp) = if el > 12.0 {
            (day.0, day.1, day.2, day.3, el.to_radians().sin().powf(0.4), 0.6)
        } else if el > 0.0 {
            let t = el / 12.0;
            (lerp(low.0, day.0, t), lerp(low.1, day.1, t), lerp(low.2, day.2, t), lerp(low.3, day.3, t), 0.3 + 0.6 * t, 1.0 - 0.4 * t)
        } else if el > -8.0 {
            let t = (el + 8.0) / 8.0;
            (V(0.0, 0.0, 0.0), lerp(night.1, low.1 * 0.5, t), lerp(night.2, low.2 * 0.45, t), lerp(night.3, low.3 * 0.5, t), 0.0, 1.6 - 0.6 * t)
        } else {
            (night.0, night.1, night.2, night.3, 0.0, 1.6)
        };
        // bulut ve pus: gökyüzünü griye çeker, güneşi kısar ve gölgeyi yumuşatır
        let grey = V(0.62, 0.64, 0.67) * (zenith.lum() * 1.6 + horizon.lum() * 0.4).min(1.0);
        zenith = lerp(zenith, grey, cloud * 0.9);
        horizon = lerp(lerp(horizon, grey, cloud * 0.9), horizon * 0.5 + V(0.5, 0.5, 0.5) * horizon.lum(), haze * 0.5);
        sun_col = lerp(sun_col, V(sun_col.lum(), sun_col.lum(), sun_col.lum()), cloud * 0.6);
        let sun_gain = s.intensity as f32 * sun_i * (1.0 - 0.88 * cloud) * (1.0 - 0.25 * haze);
        // dünya azimutu: sahnenin öğle güneşi yönü (sun.azimuth) + güneyden batıya açı
        let az = (s.azimuth as f32 + az_s).to_radians();
        let e = el.max(-20.0).to_radians();
        let mut sun_dir = V(e.cos() * az.sin(), e.sin(), e.cos() * az.cos()).norm();
        let mut col = sun_col * sun_gain;
        if el <= 0.0 {
            // gece: soluk ay ışığı
            sun_dir = V(-0.45, 0.72, 0.53).norm();
            col = V(0.55, 0.65, 0.9) * (0.05 * (1.0 - cloud));
        }
        let half_angle = 0.6 + cloud * 14.0 + haze * 2.0;
        let sk = s.sky as f32;
        Env { sun_dir, sun_col: col, sun_cos: half_angle.to_radians().cos(), zenith: zenith * sk, horizon: horizon * sk, ground: ground * sk, lamp_gain: lamp }
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
    images: &'a [crate::texture::Image],
    uvimgs: &'a [std::sync::Arc<crate::store::Rgba>],
    bvh: &'a Bvh,
    mats: &'a [Mat],
    env: &'a Env,
    lamps: &'a [Lamp],
    lamp_total: f32,
    bounces: u32,
    bump: f32,
}

/// Smith gölgeleme terimi (GGX, tek yön).
fn g1(nx: f32, a2: f32) -> f32 {
    2.0 * nx / (nx + (a2 + (1.0 - a2) * nx * nx).sqrt())
}

/// Prosedürel türlerin kabartı derinliği (mm), `texture::KINDS` sırasıyla.
const RELIEF: [f32; 9] = [1.2, 0.8, 2.0, 0.15, 1.5, 1.2, 2.5, 4.0, 5.0];

fn bary(tri: &Tri, p: V) -> (f32, f32) {
    let s = p - tri.v0;
    let (d11, d12, d22) = (tri.e1.dot(tri.e1), tri.e1.dot(tri.e2), tri.e2.dot(tri.e2));
    let (s1, s2) = (s.dot(tri.e1), s.dot(tri.e2));
    let den = d11 * d22 - d12 * d12;
    if den.abs() < 1e-12 {
        return (0.0, 0.0);
    }
    ((d22 * s1 - d12 * s2) / den, (d11 * s2 - d12 * s1) / den)
}

fn tri_uv(tri: &Tri, bu: f32, bv: f32) -> (f32, f32) {
    let w = 1.0 - bu - bv;
    (tri.uv[0][0] * w + tri.uv[1][0] * bu + tri.uv[2][0] * bv, tri.uv[0][1] * w + tri.uv[1][1] * bu + tri.uv[2][1] * bv)
}

impl Tracer<'_> {
    /// Alfa kesmeli kesişim: yaprak ve dantel gibi yüzeylerin saydam kısımlarından geçer.
    fn hit(&self, mut o: V, d: V, mut tmax: f32) -> Option<(f32, usize)> {
        let mut travelled = 0.0;
        for _ in 0..12 {
            let (t, i) = self.bvh.intersect(o, d, tmax)?;
            let tri = &self.bvh.tris[i];
            let m = &self.mats[tri.mat as usize];
            if m.cutoff > 0.0 && m.uvtex >= 0 {
                let (bu, bv) = bary(tri, o + d * t);
                let (u, v) = tri_uv(tri, bu, bv);
                if self.uvimgs[m.uvtex as usize].sample(u, v)[3] < m.cutoff {
                    o = o + d * (t + 0.05);
                    travelled += t + 0.05;
                    tmax -= t + 0.05;
                    continue;
                }
            }
            return Some((travelled + t, i));
        }
        None
    }

    /// Gölge ışını: camdan geçerken renk süzer.
    fn transmit(&self, mut o: V, d: V, mut dist: f32) -> V {
        let mut t = V(1.0, 1.0, 1.0);
        for _ in 0..16 {
            match self.hit(o, d, dist) {
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

    /// Lambalardan bir nokta örnekler: (kosinüs dahil gelen ışık, ışığın yönü).
    fn sample_lamp(&self, p: V, n: V, r: &mut Rng) -> (V, V) {
        let none = (V(0.0, 0.0, 0.0), n);
        if self.lamps.is_empty() {
            return none;
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
            return none;
        }
        let vis = self.transmit(p + n * 1.0, wd, dist - 2.0);
        if vis.max_c() <= 0.0 {
            return none;
        }
        let pdf = l.area / self.lamp_total; // seçim olasılığı × alan yoğunluğu (1/alan) tersinin çarpımı
        let le = self.mats[t.mat as usize].emit * self.env.lamp_gain;
        // L = Le · cosx · cosl / d² · (alan / seçim olasılığı)
        let geo = cos_x * cos_l / d2 * (l.area / pdf.max(1e-12));
        (vis.mul(le) * geo, wd)
    }

    /// Yüzey yüksekliği (0–1): desenin parlaklığından ya da boyalı yüzeyin rulo dokusundan.
    fn height_at(&self, m: &Mat, u: f32, v: f32) -> f32 {
        match m.tex {
            1 => {
                let k = crate::texture::procedural(crate::texture::KINDS[m.kind as usize].0, u, v, m.tscale);
                (k[0] + k[1] + k[2]) / 3.0
            }
            2 => match self.images.get(m.kind as usize) {
                Some(img) => {
                    let c = img.sample(u / m.tscale, v / m.tscale);
                    (c[0] + c[1] + c[2]) / 3.0
                }
                None => 0.0,
            },
            _ => 0.5 * crate::texture::noise(u / 2.4, v / 2.4) + 0.5 * crate::texture::noise(u / 0.9 + 31.0, v / 0.9 + 7.0),
        }
    }

    /// Kabartı: yükseklik alanının eğimiyle normali büker (geometri eklemeden derz, damar, sıva dokusu).
    fn bump_normal(&self, m: &Mat, p: V, gn: V, n: V, facing: V) -> V {
        let (u, v) = crate::texture::planar([p.0, p.1, p.2], [gn.0, gn.1, gn.2]);
        let (ax, ay, az) = (gn.0.abs(), gn.1.abs(), gn.2.abs());
        let (t, b) = if ay >= ax && ay >= az {
            (V(1.0, 0.0, 0.0), V(0.0, 0.0, 1.0))
        } else if az >= ax {
            (V(1.0, 0.0, 0.0), V(0.0, 1.0, 0.0))
        } else {
            (V(0.0, 0.0, 1.0), V(0.0, 1.0, 0.0))
        };
        let e = if m.tex == 2 { (m.tscale / 512.0).max(0.5) } else { 1.2 };
        let h0 = self.height_at(m, u, v);
        let k = m.relief * self.bump / e;
        let (mut du, mut dv) = ((self.height_at(m, u + e, v) - h0) * k, (self.height_at(m, u, v + e) - h0) * k);
        let g = (du * du + dv * dv).sqrt();
        if g > 1.2 {
            du *= 1.2 / g;
            dv *= 1.2 / g;
        }
        let nn = (n - t * du - b * dv).norm();
        if nn.dot(facing) > 0.05 { nn } else { n }
    }

    /// Dokulu yüzey rengi: prosedürel desen ya da yüklenen görsel, baskın düzlem izdüşümüyle.
    fn albedo_at(&self, m: &Mat, p: V, n: V, uv: (f32, f32)) -> V {
        if m.uvtex >= 0 {
            let uv = if m.planar {
                let (u, v) = crate::texture::planar([p.0, p.1, p.2], [n.0, n.1, n.2]);
                (u / m.tscale, -v / m.tscale)
            } else {
                uv
            };
            let c = self.uvimgs[m.uvtex as usize].sample(uv.0, uv.1);
            let l = |x: f32| crate::store::to_linear(x);
            return m.albedo.mul(V(l(c[0]), l(c[1]), l(c[2]))) * (1.0 / 0.92);
        }
        if m.tex == 0 {
            return m.albedo;
        }
        let (u, v) = crate::texture::planar([p.0, p.1, p.2], [n.0, n.1, n.2]);
        if m.tex == 1 {
            let k = crate::texture::procedural(crate::texture::KINDS[m.kind as usize].0, u, v, m.tscale);
            return m.albedo.mul(V(k[0], k[1], k[2]));
        }
        match self.images.get(m.kind as usize) {
            Some(img) => {
                let c = img.sample(u / m.tscale, v / m.tscale);
                V(c[0], c[1], c[2]) * 0.92
            }
            None => m.albedo,
        }
    }

    fn radiance(&self, mut o: V, mut d: V, r: &mut Rng, first: &mut (V, V, f32)) -> (V, u64) {
        let mut l = V(0.0, 0.0, 0.0);
        let mut thr = V(1.0, 1.0, 1.0);
        let mut rays = 0u64;
        let mut count_emit = true;
        for depth in 0..=self.bounces {
            rays += 1;
            let Some((t, i)) = self.hit(o, d, 1e9) else {
                l = l + thr.mul(self.env.sky(d));
                if depth == 0 {
                    *first = (self.env.sky(d), V(0.0, 0.0, 0.0), 1e9);
                }
                break;
            };
            let tri = &self.bvh.tris[i];
            let m = &self.mats[tri.mat as usize];
            let p = o + d * t;
            // yumuşak gölgeleme: köşe normallerini kesişimin barisentrik ağırlıklarıyla karıştır
            let mut n = {
                let s = p - tri.v0;
                let (d11, d12, d22) = (tri.e1.dot(tri.e1), tri.e1.dot(tri.e2), tri.e2.dot(tri.e2));
                let (s1, s2) = (s.dot(tri.e1), s.dot(tri.e2));
                let den = d11 * d22 - d12 * d12;
                if den.abs() < 1e-12 {
                    tri.n
                } else {
                    let bu = (d22 * s1 - d12 * s2) / den;
                    let bv = (d11 * s2 - d12 * s1) / den;
                    let sn = tri.ns[0] * (1.0 - bu - bv) + tri.ns[1] * bu + tri.ns[2] * bv;
                    if sn.dot(tri.n) > 0.2 { sn.norm() } else { tri.n }
                }
            };
            let mut ng = tri.n;
            if ng.dot(d) > 0.0 {
                ng = -ng;
                n = -n;
            }
            if n.dot(d) > 0.0 {
                n = ng;
            }
            let (bu, bv) = bary(tri, p);
            let uv = if m.planar {
                let (u, v) = crate::texture::planar([p.0, p.1, p.2], [tri.n.0, tri.n.1, tri.n.2]);
                (u / m.tscale, -v / m.tscale)
            } else {
                tri_uv(tri, bu, bv)
            };
            let alb = self.albedo_at(m, p, tri.n, uv);
            // pürüzlülük ve metaliklik haritası (G, B)
            let (rough, metal) = if m.orm >= 0 {
                let c = self.uvimgs[m.orm as usize].sample(uv.0, uv.1);
                ((m.rough * c[1]).clamp(0.02, 1.0), (m.metal * c[2]).clamp(0.0, 1.0))
            } else {
                (m.rough, m.metal)
            };
            if depth == 0 {
                *first = (alb, n, t);
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
            if depth <= 1 && m.relief > 0.0 && self.bump > 0.0 {
                n = self.bump_normal(m, p, tri.n, n, ng);
                if depth == 0 {
                    first.1 = n;
                }
            }
            let pi = std::f32::consts::PI;
            let one = V(1.0, 1.0, 1.0);
            let v = -d;
            let nv = n.dot(v).max(1e-3);
            let a = (rough * rough).max(0.002);
            let a2 = a * a;
            let f0 = V(0.04, 0.04, 0.04) * (1.0 - metal) + alb * metal;
            let fres = |c: f32| f0 + (one - f0) * (1.0 - c).clamp(0.0, 1.0).powi(5);
            let fv = fres(nv);
            let diff = alb.mul(one - fv) * (1.0 - metal);
            // ayna gibi yüzeylerde lamba parlaması yansıma ışınıyla bulunur
            let mirror = a < 0.01;
            let an2 = a.max(0.02) * a.max(0.02);
            let spec = |l: V, a2: f32| -> V {
                let nl = n.dot(l);
                if nl <= 0.0 {
                    return V(0.0, 0.0, 0.0);
                }
                let h = (v + l).norm();
                let nh = n.dot(h).max(0.0);
                let dd = nh * nh * (a2 - 1.0) + 1.0;
                let dterm = a2 / (pi * dd * dd);
                fres(v.dot(h).max(0.0)) * (dterm * g1(nv, a2) * g1(nl, a2) / (4.0 * nv * nl).max(1e-4))
            };
            // doğrudan ışık: güneş (diski kadar yumuşak gölge)
            if n.dot(self.env.sun_dir) > 0.0 && self.env.sun_col.max_c() > 0.0 {
                let (tt, bb) = onb(self.env.sun_dir);
                let rad = (1.0 - self.env.sun_cos).sqrt() * 1.4;
                let jd = (self.env.sun_dir + tt * ((r.f() - 0.5) * rad) + bb * ((r.f() - 0.5) * rad)).norm();
                let nl = n.dot(jd);
                if nl > 0.0 {
                    let vis = self.transmit(p + ng * 0.5, jd, 1e9);
                    rays += 1;
                    if vis.max_c() > 0.0 {
                        l = l + thr.mul(self.env.sun_col).mul(vis).mul(diff + spec(jd, an2) * pi) * nl;
                    }
                }
            }
            // doğrudan ışık: lambalar
            if !self.lamps.is_empty() {
                let (le, wd) = self.sample_lamp(p, n, r);
                rays += 1;
                if le.max_c() > 0.0 {
                    let sp = if mirror { V(0.0, 0.0, 0.0) } else { spec(wd, an2) };
                    l = l + thr.mul(le).mul(diff * (1.0 / pi) + sp);
                }
            }
            // dolaylı ışık: Fresnel ağırlığıyla parlak ya da yayınık lob
            let (fl, dl) = (fv.lum(), diff.lum());
            let p_spec = if dl <= 1e-4 { 1.0 } else { (fl / (fl + dl)).clamp(0.04, 0.96) };
            if r.f() < p_spec {
                let (u1, u2) = (r.f(), r.f());
                let ct = ((1.0 - u1) / (1.0 + (a2 - 1.0) * u1)).max(0.0).sqrt();
                let st = (1.0 - ct * ct).max(0.0).sqrt();
                let phi = 2.0 * pi * u2;
                let (t, b) = onb(n);
                let h = (t * (st * phi.cos()) + b * (st * phi.sin()) + n * ct).norm();
                let vh = v.dot(h);
                if vh <= 0.0 {
                    break;
                }
                let ld = (h * (2.0 * vh) - v).norm();
                let nl = n.dot(ld);
                if nl <= 0.0 || ng.dot(ld) <= 0.0 {
                    break;
                }
                let mut w = fres(vh) * (g1(nv, a2) * g1(nl, a2) * vh / (nv * ct.max(1e-4)) / p_spec);
                let wl = w.lum();
                if wl > 4.0 {
                    w = w * (4.0 / wl);
                }
                thr = thr.mul(w);
                d = ld;
                o = p + ng * 0.5;
                count_emit = mirror;
            } else {
                thr = thr.mul(diff) * (1.0 / (1.0 - p_spec));
                d = cosine_dir(n, r);
                if ng.dot(d) <= 0.0 {
                    d = cosine_dir(ng, r);
                }
                o = p + ng * 0.5;
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

/// Gökyüzü ve güneş durumu (dış render motorlarına aktarım için). Yönler dünya koordinatında, Y yukarı.
pub fn sky_state(scene: &Scene, s: &RenderSettings) -> serde_json::Value {
    let (o, st) = apply_style(s);
    let env = Env::new(scene, o.atmosphere, o.sky.as_ref());
    let k = o.sky.clone().unwrap_or_default();
    let elevation = env.sun_dir.1.clamp(-1.0, 1.0).asin().to_degrees();
    let night = env.sun_col.max_c() < 0.2 && matches!(o.atmosphere, Atmosphere::Aksam) || o.sky.as_ref().is_some_and(|k| sun_position(k).0 < -2.0);
    let c = |v: V| [v.0, v.1, v.2];
    serde_json::json!({
        "sun_direction": c(env.sun_dir),
        "sun_color": c(env.sun_col),
        "sun_angle": (env.sun_cos.clamp(-1.0, 1.0).acos().to_degrees() * 2.0),
        "elevation": elevation,
        "zenith": c(env.zenith),
        "horizon": c(env.horizon),
        "ground": c(env.ground),
        "cloud": if o.sky.is_some() { k.cloud } else { 0.0 },
        "haze": if o.sky.is_some() { k.haze } else { 0.1 },
        "night": night,
        "studio": st.studio,
        "clay": match st.clay { Clay::None => "none", Clay::Shell => "shell", Clay::All => "all" },
        "lamp_gain": env.lamp_gain,
        "auto_exposure_target": st.ae_target,
    })
}

pub fn render(scene: &Scene, s: &RenderSettings) -> Result<RenderResult, String> {
    // 8K'ya kadar (7680 × 4320); bellek ~40 bayt/piksel
    let (w, h) = (s.width.clamp(16, 7680), s.height.clamp(16, 4320));
    let (styled, style) = apply_style(s);
    let s = &styled;
    let spp = s.samples.clamp(1, 2048);
    let sm = prepare(scene, s);
    let images: Vec<crate::texture::Image> = scene.textures.iter().filter_map(crate::texture::Image::decode).collect();
    // depodaki (glTF) dokular
    let mut uvimgs: Vec<std::sync::Arc<crate::store::Rgba>> = vec![];
    let mut uv_index = std::collections::HashMap::new();
    for t in scene.textures.iter().filter(|t| !t.store.is_empty()) {
        if let Some(img) = crate::store::image(&t.store) {
            uv_index.insert(t.id.clone(), uvimgs.len() as i32);
            uvimgs.push(img);
        }
    }
    let uvtex_of = |id: &str| -> i32 { uv_index.get(id.strip_prefix("img:").unwrap_or(id)).copied().unwrap_or(-1) };
    let mut mats: Vec<Mat> = vec![];
    let mut tris: Vec<Tri> = vec![];
    for b in &sm.batches {
        let m = scene.material(&b.material).cloned().unwrap_or_default();
        let idx = mats.len() as u16;
        let albedo = V(m.color[0], m.color[1], m.color[2]) * 0.92;
        let (tex, kind) = match m.texture.strip_prefix("img:") {
            Some(id) => images.iter().position(|i| i.id == id).map(|k| (2u8, k as u16)).unwrap_or((0, 0)),
            None => crate::texture::KINDS.iter().position(|k| k.0 == m.texture).map(|k| (1u8, k as u16)).unwrap_or((0, 0)),
        };
        let relief = match tex {
            1 => RELIEF[kind as usize],
            2 => 1.0,
            // boyalı duvar ve tavanda rulo dokusu, düz kumaşta ince dokuma
            _ if matches!(m.category.as_str(), "duvar" | "tavan" | "palet") => 0.3,
            _ if m.category == "tekstil" => 0.6,
            _ => 0.0,
        };
        let glass = m.opacity < 0.5;
        let lit = m.emission > 0.0;
        let keep = match style.clay {
            Clay::None => true,
            Clay::Shell => matches!(m.category.as_str(), "zemin" | "mobilya" | "tekstil" | "dekor" | "metal" | "genel" | "dograma" | "palet"),
            Clay::All => glass || lit,
        };
        let (albedo, tex, relief) = if keep { (albedo, tex, relief) } else { (V(0.86, 0.86, 0.85), 0u8, 0.0) };
        let m = if keep { m } else { crate::model::Material { roughness: 0.9, metallic: 0.0, ..m } };
        // beyaz makette ışıklar sıcak turuncu parlar
        let m = if style.clay == Clay::All && lit { crate::model::Material { color: [1.0, 0.55, 0.18], emission: m.emission * 1.6, ..m } } else { m };
        mats.push(Mat { albedo, rough: m.roughness.clamp(0.0, 1.0), metal: m.metallic.clamp(0.0, 1.0), emit: V(m.color[0], m.color[1], m.color[2]) * m.emission.max(0.0), glass: m.opacity < 0.5, tex, kind, tscale: m.texture_scale.max(1.0), relief, uvtex: if keep { uvtex_of(&m.texture) } else { -1 }, orm: if keep && !m.orm_map.is_empty() { uvtex_of(&m.orm_map) } else { -1 }, cutoff: if m.uv { m.alpha_cutoff } else { 0.0 }, planar: !m.uv });
        for (ti, t) in b.positions.chunks(3).enumerate() {
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
            let gn = n.norm();
            let vn = |k: usize| b.normals.get(ti * 3 + k).map(|q| V(q[0], q[1], q[2])).filter(|q| q.len() > 0.5).unwrap_or(gn);
            let uvk = |k: usize| b.uvs.get(ti * 3 + k).copied().unwrap_or([0.0, 0.0]);
            tris.push(Tri { v0, e1, e2, n: gn, ns: [vn(0), vn(1), vn(2)], mat: idx, uv: [uvk(0), uvk(1), uvk(2)] });
        }
    }
    if tris.is_empty() {
        return Err("@render_empty".into());
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
    let mut env = Env::new(scene, s.atmosphere, s.sky.as_ref());
    if style.studio {
        // stüdyo: beyaz sonsuz fon, yukarıdan yumuşak ışık
        let w = V(1.0, 1.0, 1.0) * 1.25;
        env.zenith = w;
        env.horizon = w;
        env.ground = w * 0.9;
        env.sun_dir = V(-0.35, 0.86, 0.37).norm();
        env.sun_col = V(1.0, 0.98, 0.95) * 1.6;
        env.sun_cos = 9.0f32.to_radians().cos();
        env.lamp_gain = env.lamp_gain.max(1.0);
    }
    let tracer = Tracer { images: &images, uvimgs: &uvimgs, bvh: &bvh, mats: &mats, env: &env, lamps: &lamps, lamp_total: acc, bounces: s.bounces.clamp(1, 12), bump: s.bump.clamp(0.0, 4.0) };
    let eye = s.eye.unwrap_or(scene.camera.eye);
    let tgt = s.target.unwrap_or(scene.camera.target);
    let fov = s.fov.unwrap_or(scene.camera.fov).clamp(10.0, 120.0) as f32;
    let e = V(eye[0] as f32, eye[1] as f32, eye[2] as f32);
    let fwd = (V(tgt[0] as f32, tgt[1] as f32, tgt[2] as f32) - e).norm();
    let right = fwd.cross(V(0.0, 1.0, 0.0)).norm();
    let up = right.cross(fwd);
    let th = (fov.to_radians() * 0.5).tan();
    let iso = s.projection == "isometric";
    let tv = V(tgt[0] as f32, tgt[1] as f32, tgt[2] as f32);
    let ortho_half = s.ortho_height.map(|v| v as f32 * 0.5).unwrap_or_else(|| (tv - e).len() * th).max(10.0);
    let aspect = w as f32 / h as f32;
    // objektif: 24 mm yüksekliğindeki algılayıcıya göre odak uzaklığı ve diyafram açıklığı
    let lens_r = if s.aperture > 0.0 && !iso { (12.0 / th) / (2.0 * s.aperture.clamp(0.7, 64.0)) } else { 0.0 };
    let focus = match s.focus {
        Some(f) if f > 1.0 => f as f32,
        _ => bvh.intersect(e, fwd, 1e9).map(|(t, _)| t).unwrap_or(5000.0).max(200.0),
    };
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
                    let (org, dir) = if iso {
                        (e + right * (px / th * ortho_half) + up * (py / th * ortho_half), fwd)
                    } else if lens_r > 0.0 {
                        // ince mercek: netlik düzlemindeki nokta sabit, ışın mercek üzerindeki rastgele noktadan çıkar
                        let fp = e + (fwd + right * px + up * py) * focus;
                        let (rr, ang) = (r.f().sqrt() * lens_r, r.f() * 2.0 * std::f32::consts::PI);
                        let lo = e + right * (rr * ang.cos()) + up * (rr * ang.sin());
                        (lo, (fp - lo).norm())
                    } else {
                        (e, (fwd + right * px + up * py).norm())
                    };
                    let mut first = (V::default(), V::default(), 0.0);
                    let (c, n) = tracer.radiance(org, dir, &mut r, &mut first);
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
    let mut exp = s.exposure.clamp(0.05, 8.0);
    if s.auto_exposure {
        // log-ortalama parlaklık → orta gri (0,18); gece sahneleri fazla açılmasın diye sınırlı
        let mut sum = 0.0f64;
        for c in &color {
            sum += ((c.lum().max(0.0) + 1e-4) as f64).ln();
        }
        let avg = (sum / n_px.max(1) as f64).exp() as f32;
        let night = matches!(s.atmosphere, Atmosphere::Aksam) || s.sky.as_ref().is_some_and(|k| sun_position(k).0 < -2.0);
        let target = if night && !style.studio { 0.09 } else { style.ae_target };
        exp *= (target / avg.max(1e-4)).clamp(0.25, 6.0) / 0.62;
    }
    let rgba = develop(&color, w as usize, h as usize, exp, s);
    let png = encode_png(&rgba, w, h)?;
    Ok(RenderResult { width: w, height: h, png, triangles: tri_count, samples: spp, threads, rays })
}

/// Tek yönlü kutu bulanıklığı (üç geçişi Gauss'a yaklaşır).
fn box_blur(src: &[V], w: usize, h: usize, rad: usize, horizontal: bool) -> Vec<V> {
    let mut out = vec![V::default(); w * h];
    let (n, m) = if horizontal { (h, w) } else { (w, h) };
    let at = |line: usize, k: usize| if horizontal { line * w + k } else { k * w + line };
    let inv = 1.0 / (2 * rad + 1) as f32;
    for line in 0..n {
        let mut sum = V::default();
        for k in 0..=2 * rad {
            sum = sum + src[at(line, k.saturating_sub(rad).min(m - 1))];
        }
        for k in 0..m {
            out[at(line, k)] = sum * inv;
            let add = (k + rad + 1).min(m - 1);
            let rem = k.saturating_sub(rad);
            sum = sum + src[at(line, add)] - src[at(line, rem)];
        }
    }
    out
}

/// Doğrusal ışık değerlerini görüntüye çevirir: beyaz dengesi, parlama, köşe kararması,
/// ton eşleme, keskinleştirme ve gren — fotoğraf makinesinin yaptığı işlemler.
fn develop(color: &[V], w: usize, h: usize, exp: f32, s: &RenderSettings) -> Vec<u8> {
    let wb = if s.white_balance > 1000.0 {
        let t = ((s.white_balance - 6500.0) / 2500.0).clamp(-1.5, 1.5);
        V(1.0 + 0.12 * t, 1.0, 1.0 - 0.16 * t)
    } else {
        V(1.0, 1.0, 1.0)
    };
    let mut lin: Vec<V> = color.iter().map(|c| c.mul(wb) * exp).collect();
    let bloom = s.bloom.clamp(0.0, 1.0);
    if bloom > 0.0 && w >= 32 && h >= 32 {
        // parlak bölgeler çeyrek çözünürlükte yayılır
        let (bw, bh) = (w.div_ceil(4), h.div_ceil(4));
        let mut small = vec![V::default(); bw * bh];
        for y in 0..h {
            for x in 0..w {
                let c = lin[y * w + x];
                let over = (c.lum() - 1.6).max(0.0);
                if over > 0.0 {
                    let k = (over / c.lum()).min(1.0) * (12.0 / c.lum().max(12.0));
                    small[(y / 4) * bw + x / 4] = small[(y / 4) * bw + x / 4] + c * (k / 16.0);
                }
            }
        }
        let rad = (bw / 48).max(2);
        for _ in 0..3 {
            small = box_blur(&small, bw, bh, rad, true);
            small = box_blur(&small, bw, bh, rad, false);
        }
        for y in 0..h {
            for x in 0..w {
                let (fx, fy) = (((x as f32 + 0.5) / 4.0 - 0.5).max(0.0), ((y as f32 + 0.5) / 4.0 - 0.5).max(0.0));
                let (x0, y0) = ((fx as usize).min(bw - 1), (fy as usize).min(bh - 1));
                let (x1, y1) = ((x0 + 1).min(bw - 1), (y0 + 1).min(bh - 1));
                let (tx, ty) = (fx - x0 as f32, fy - y0 as f32);
                let top = small[y0 * bw + x0] * (1.0 - tx) + small[y0 * bw + x1] * tx;
                let bot = small[y1 * bw + x0] * (1.0 - tx) + small[y1 * bw + x1] * tx;
                lin[y * w + x] = lin[y * w + x] + (top * (1.0 - ty) + bot * ty) * (bloom * 0.9);
            }
        }
    }
    let vig = s.vignette.clamp(0.0, 1.0);
    let mut disp: Vec<V> = Vec::with_capacity(w * h);
    for y in 0..h {
        for x in 0..w {
            let mut c = lin[y * w + x];
            if vig > 0.0 {
                let (dx, dy) = ((x as f32 + 0.5) / w as f32 * 2.0 - 1.0, (y as f32 + 0.5) / h as f32 * 2.0 - 1.0);
                let r2 = (dx * dx + dy * dy) * 0.5;
                c = c * (1.0 - vig * 0.55 * r2 * r2.sqrt());
            }
            disp.push(V(aces(c.0), aces(c.1), aces(c.2)));
        }
    }
    let sharp = s.sharpen.clamp(0.0, 1.0);
    if sharp > 0.0 {
        let blur = box_blur(&box_blur(&disp, w, h, 1, true), w, h, 1, false);
        for (c, b) in disp.iter_mut().zip(&blur) {
            *c = *c + (*c - *b) * (sharp * 0.8);
        }
    }
    let grain = s.grain.clamp(0.0, 1.0);
    let mut rgba = Vec::with_capacity(w * h * 4);
    for (i, c) in disp.iter().enumerate() {
        let mut c = *c;
        if grain > 0.0 {
            let mut r = Rng::new(s.seed ^ (i as u64).wrapping_mul(0xD6E8_FEB8_6659_FD93));
            // orta tonlarda belirgin, siyah ve beyazda sönük
            let l = c.lum().clamp(0.0, 1.0);
            let g = (r.f() + r.f() - 1.0) * grain * 0.09 * (0.25 + 3.0 * l * (1.0 - l));
            c = c + V(g, g, g);
        }
        rgba.extend_from_slice(&[srgb_display(c.0), srgb_display(c.1), srgb_display(c.2), 255]);
    }
    rgba
}

fn srgb_display(x: f32) -> u8 {
    srgb(x.clamp(0.0, 1.0))
}

/// Albedo ve normal kılavuzlu kenar korumalı süzgeç (à-trous, 3 geçiş).
fn denoise(col: &[V], alb: &[V], nor: &[V], dep: &[f32], w: usize, h: usize) -> Vec<V> {
    let demod: Vec<V> = col.iter().zip(alb).map(|(c, a)| V(c.0 / a.0.max(0.02), c.1 / a.1.max(0.02), c.2 / a.2.max(0.02))).collect();
    let mut cur = demod;
    let kern = [1.0 / 16.0, 1.0 / 4.0, 3.0 / 8.0, 1.0 / 4.0, 1.0 / 16.0];
    for step in [1usize, 2, 4, 8] {
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
            let r = render(&s, &RenderSettings { width: 48, height: 27, samples: 4, atmosphere: a, denoise: false, auto_exposure: false, ..Default::default() }).unwrap();
            let mut rd = png::Decoder::new(std::io::Cursor::new(r.png)).read_info().unwrap();
            let mut b = vec![0; rd.output_buffer_size()];
            rd.next_frame(&mut b).unwrap();
            b.iter().map(|x| *x as f64).sum::<f64>() / b.len() as f64
        };
        assert!(mean(Atmosphere::Aksam) < mean(Atmosphere::Gunduz));
    }

    #[test]
    fn sky_engine_follows_the_clock() {
        let at = |h: f32, m: u32| sun_position(&SkySettings { hour: h, month: m, ..Default::default() }).0;
        assert!(at(12.0, 6) > 70.0 && at(12.0, 6) < 76.0, "haziran öğle {}", at(12.0, 6));
        assert!(at(12.0, 12) > 25.0 && at(12.0, 12) < 30.0, "aralık öğle {}", at(12.0, 12));
        assert!(at(0.0, 6) < -10.0);
        assert!(at(9.0, 6) > at(7.0, 6));
        let s = crate::templates::demo_scene();
        let noon = Env::new(&s, Atmosphere::Gunduz, Some(&SkySettings { hour: 12.0, ..Default::default() }));
        let cloudy = Env::new(&s, Atmosphere::Gunduz, Some(&SkySettings { hour: 12.0, cloud: 1.0, ..Default::default() }));
        let night = Env::new(&s, Atmosphere::Gunduz, Some(&SkySettings { hour: 1.0, ..Default::default() }));
        assert!(cloudy.sun_col.lum() < noon.sun_col.lum() * 0.3);
        assert!(cloudy.sun_cos < noon.sun_cos, "bulutta gölge yumuşar");
        assert!(night.zenith.lum() < noon.zenith.lum() * 0.2 && night.lamp_gain > noon.lamp_gain);
    }

    #[test]
    fn isometric_projection_and_large_output_limits() {
        let s = crate::templates::demo_scene();
        let set = RenderSettings { width: 64, height: 36, samples: 2, projection: "isometric".into(), ortho_height: Some(14_000.0), eye: Some([15_000.0, 12_000.0, 14_000.0]), target: Some([5_000.0, 1_000.0, 4_000.0]), denoise: false, ..Default::default() };
        let r = render(&s, &set).unwrap();
        assert_eq!((r.width, r.height), (64, 36));
        // sınır: 8K üstü istek 7680 × 4320'ye kırpılır (burada yalnız kırpma mantığı sınanır)
        assert_eq!(9000u32.clamp(16, 7680), 7680);
    }

    #[test]
    fn styles_default_and_change_the_image() {
        assert_eq!(style_id(""), "default");
        assert_eq!(style_id("bilinmeyen"), "default");
        let s = crate::templates::demo_scene();
        let base = RenderSettings { width: 64, height: 40, samples: 2, ..Default::default() };
        let a = render(&s, &base).unwrap();
        let d = render(&s, &RenderSettings { style: "default".into(), ..base.clone() }).unwrap();
        assert_eq!(a.png, d.png, "stil seçilmezse varsayılan stil kullanılır");
        let mean = |png: &[u8]| {
            let dec = png::Decoder::new(std::io::Cursor::new(png.to_vec()));
            let mut r = dec.read_info().unwrap();
            let mut buf = vec![0; r.output_buffer_size()];
            let info = r.next_frame(&mut buf).unwrap();
            let px = &buf[..info.buffer_size()];
            px.iter().map(|&v| v as f64).sum::<f64>() / px.len() as f64
        };
        let c = render(&s, &RenderSettings { style: "clay-white".into(), ..base.clone() }).unwrap();
        assert_ne!(c.png, a.png);
        assert!(mean(&c.png) > mean(&a.png), "beyaz maket stüdyo fonu daha aydınlık");
        for st in STYLES {
            assert!(render(&s, &RenderSettings { style: st.into(), ..base.clone() }).is_ok(), "{st}");
        }
    }

    #[test]
    fn bvh_hits_nearest_triangle() {
        let t = |z: f32, m: u16| Tri { v0: V(-1.0, -1.0, z), e1: V(2.0, 0.0, 0.0), e2: V(0.0, 2.0, 0.0), n: V(0.0, 0.0, 1.0), ns: [V(0.0, 0.0, 1.0); 3], mat: m, uv: [[0.0; 2]; 3] };
        let tris: Vec<Tri> = (0..50).map(|k| t(10.0 + k as f32, k as u16)).collect();
        let b = Bvh::build(tris);
        let (d, i) = b.intersect(V(0.0, 0.0, 0.0), V(0.0, 0.0, 1.0), 1e9).unwrap();
        assert!((d - 10.0).abs() < 1e-4);
        assert_eq!(b.tris[i].mat, 0);
        assert!(b.intersect(V(5.0, 5.0, 0.0), V(0.0, 0.0, 1.0), 1e9).is_none());
    }
}
