//! Parametrik tasarım motorları: perde, halı, yatak (baza + başlık), nevresim ve havuz.
//!
//! Her motor parametrelerden bir [`Generated`] üretir: üçgen ağı (mm, Y yukarı, taban
//! merkezi orijinde), gerekirse yeni malzemeler, ölçü ve tahmini fiyat. Üretilen ağ
//! sahneye `MeshAsset` olarak eklenir; render, 3B görünüm ve OBJ dışa aktarma aynı yolu kullanır.

use crate::model::{Material, MeshAsset, MeshGroup};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::f64::consts::PI;

type P = [f64; 3];

#[derive(Debug, Clone, Serialize)]
pub struct Generated {
    pub mesh: MeshAsset,
    pub materials: Vec<Material>,
    pub name: String,
    /// Genişlik × derinlik × yükseklik (mm).
    pub size: [f64; 3],
    pub price: f64,
    /// Zeminden yükseklik (mm).
    pub mount: f64,
    pub triangles: usize,
}

/// Tüm motorlarda ortak görünüm ayarı.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Style {
    /// Kumaş/halı görünümü: boş (motorun kendi dokusu), prosedürel tür (ör. `kumas`, `hali`)
    /// ya da yüklenen görsel `img:<doku kimliği>`.
    pub look: String,
    /// Desenin bir tekrarının ölçüsü (mm).
    pub look_scale: f32,
    /// Ayrıntı düzeyi: 1 hızlı, 2 ayrıntılı, 3 çok ayrıntılı (daha çok üçgen).
    pub detail: u32,
}
impl Default for Style {
    fn default() -> Self {
        Style { look: String::new(), look_scale: 600.0, detail: 2 }
    }
}

/// Malzemeye göre üçgen toplayıcı.
#[derive(Default)]
struct Gen {
    tris: BTreeMap<String, Vec<[P; 3]>>,
    materials: Vec<Material>,
    style: Style,
}

impl Gen {
    fn with(style: &Style) -> Gen {
        Gen { style: Style { detail: style.detail.clamp(1, 3), ..style.clone() }, ..Default::default() }
    }
    fn d(&self) -> usize {
        self.style.detail.clamp(1, 3) as usize
    }
    fn tri(&mut self, m: &str, a: P, b: P, c: P) {
        self.tris.entry(m.to_string()).or_default().push([a, b, c]);
    }
    fn quad(&mut self, m: &str, a: P, b: P, c: P, d: P) {
        self.tri(m, a, b, c);
        self.tri(m, a, c, d);
    }
    fn boxx(&mut self, m: &str, mn: P, mx: P) {
        let (x0, y0, z0, x1, y1, z1) = (mn[0], mn[1], mn[2], mx[0], mx[1], mx[2]);
        self.quad(m, [x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]);
        self.quad(m, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
        self.quad(m, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
        self.quad(m, [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]);
        self.quad(m, [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]);
        self.quad(m, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    }
    /// Parametrik yüzey: (u, v) ∈ [0, 1]²; hücre malzemesini `mat(i, j)` seçer.
    fn surface(&mut self, nu: usize, nv: usize, f: impl Fn(f64, f64) -> P, mat: impl Fn(usize, usize) -> String) {
        for j in 0..nv {
            for i in 0..nu {
                let (u0, u1) = (i as f64 / nu as f64, (i + 1) as f64 / nu as f64);
                let (v0, v1) = (j as f64 / nv as f64, (j + 1) as f64 / nv as f64);
                let m = mat(i, j);
                self.quad(&m, f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1));
            }
        }
    }
    /// Y ekseni boyunca çokgen prizma (silindir yaklaşımı).
    fn prism_x(&mut self, m: &str, x0: f64, x1: f64, cy: f64, cz: f64, r: f64, sides: usize) {
        for k in 0..sides {
            let (a0, a1) = (2.0 * PI * k as f64 / sides as f64, 2.0 * PI * (k + 1) as f64 / sides as f64);
            let p = |x: f64, a: f64| [x, cy + r * a.sin(), cz + r * a.cos()];
            self.quad(m, p(x0, a0), p(x1, a0), p(x1, a1), p(x0, a1));
            self.tri(m, [x0, cy, cz], p(x0, a1), p(x0, a0));
            self.tri(m, [x1, cy, cz], p(x1, a0), p(x1, a1));
        }
    }
    fn material(&mut self, id: &str, name: &str, color: [f32; 3], roughness: f32, opacity: f32, category: &str) {
        if !self.materials.iter().any(|m| m.id == id) {
            let texture = if id.starts_with("hali") { "hali" } else if category == "tekstil" { "kumas" } else if id == "traverten" { "mermer" } else if id.starts_with("havuz-fayans") { "karo" } else { "" };
            let texture_scale = if id.starts_with("havuz-fayans") { 300.0 } else { 1000.0 };
            // yüklenen ya da seçilen görünüm kumaş ve halı malzemelerine uygulanır
            let (texture, texture_scale) = if category == "tekstil" && !self.style.look.is_empty() { (self.style.look.as_str(), self.style.look_scale.max(10.0)) } else { (texture, texture_scale) };
            self.materials.push(Material { id: id.into(), name: name.into(), color, roughness, metallic: 0.0, emission: 0.0, opacity, price_m2: 0.0, category: category.into(), texture: texture.into(), texture_scale });
        }
    }
    fn finish(self, id: &str, name: &str, price: f64, mount: f64) -> Generated {
        let mut positions = vec![];
        let mut normals = vec![];
        let mut indices = vec![];
        let mut groups = vec![];
        let (mut mn, mut mx) = ([f64::INFINITY; 3], [f64::NEG_INFINITY; 3]);
        for (mat, tris) in &self.tris {
            let start = indices.len() as u32;
            // aynı konumu paylaşan köşelerde alan ağırlıklı normal ortalaması (yumuşak kıvrımlar)
            let key = |p: &P| ((p[0] * 4.0).round() as i64, (p[1] * 4.0).round() as i64, (p[2] * 4.0).round() as i64);
            let mut acc: std::collections::HashMap<(i64, i64, i64), [f64; 3]> = std::collections::HashMap::new();
            for t in tris {
                let e1 = [t[1][0] - t[0][0], t[1][1] - t[0][1], t[1][2] - t[0][2]];
                let e2 = [t[2][0] - t[0][0], t[2][1] - t[0][1], t[2][2] - t[0][2]];
                let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
                for p in t {
                    let a = acc.entry(key(p)).or_insert([0.0; 3]);
                    for k in 0..3 {
                        a[k] += n[k];
                    }
                }
            }
            for t in tris {
                let e1 = [t[1][0] - t[0][0], t[1][1] - t[0][1], t[1][2] - t[0][2]];
                let e2 = [t[2][0] - t[0][0], t[2][1] - t[0][1], t[2][2] - t[0][2]];
                let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
                let l = (n[0] * n[0] + n[1] * n[1] + n[2] * n[2]).sqrt();
                if l < 1e-9 {
                    continue;
                }
                for p in t {
                    for k in 0..3 {
                        mn[k] = mn[k].min(p[k]);
                        mx[k] = mx[k].max(p[k]);
                    }
                    indices.push(positions.len() as u32);
                    positions.push([p[0] as f32, p[1] as f32, p[2] as f32]);
                    let fnrm = [n[0] / l, n[1] / l, n[2] / l];
                    let a = acc[&key(p)];
                    let al = (a[0] * a[0] + a[1] * a[1] + a[2] * a[2]).sqrt();
                    // keskin kenarlar (≈ 50° üstü) düz kalır
                    let sn = if al > 1e-9 && (a[0] * fnrm[0] + a[1] * fnrm[1] + a[2] * fnrm[2]) / al > 0.64 { [a[0] / al, a[1] / al, a[2] / al] } else { fnrm };
                    normals.push([sn[0] as f32, sn[1] as f32, sn[2] as f32]);
                }
            }
            groups.push(MeshGroup { material: mat.clone(), start, count: indices.len() as u32 - start });
        }
        // taban merkezini orijine taşı
        let off = [((mn[0] + mx[0]) / 2.0) as f32, mn[1] as f32, ((mn[2] + mx[2]) / 2.0) as f32];
        for p in &mut positions {
            *p = [p[0] - off[0], p[1] - off[1], p[2] - off[2]];
        }
        let triangles = indices.len() / 3;
        Generated {
            mesh: MeshAsset { id: id.into(), name: name.into(), positions, normals, indices, groups, source: "motor".into() },
            materials: self.materials,
            name: name.into(),
            size: [mx[0] - mn[0], mx[2] - mn[2], mx[1] - mn[1]],
            price: (price / 10.0).round() * 10.0,
            mount,
            triangles,
        }
    }
}

fn col_id(prefix: &str, c: [f32; 3], extra: u32) -> String {
    format!("{prefix}-{:02x}{:02x}{:02x}-{extra}", (c[0].clamp(0.0, 1.0) * 255.0) as u8, (c[1].clamp(0.0, 1.0) * 255.0) as u8, (c[2].clamp(0.0, 1.0) * 255.0) as u8)
}
fn shade(c: [f32; 3], k: f32) -> [f32; 3] {
    [(c[0] * k).min(1.0), (c[1] * k).min(1.0), (c[2] * k).min(1.0)]
}

/* ───────────── Perde motoru ───────────── */

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Curtain {
    pub width: f64,
    pub height: f64,
    /// tul | fon | tul-fon | stor
    pub kind: String,
    /// Pile sıklığı (pile / metre).
    pub pleats: f64,
    /// Pile derinliği (mm).
    pub depth: f64,
    /// korniş | rustik | kemer-duz | kemer-kavisli
    pub header: String,
    /// Saydamlık: 0 = tam saydam, 1 = ışık geçirmez. Tül için 0,2–0,6.
    pub opacity: f64,
    pub color: [f32; 3],
    pub color2: [f32; 3],
    /// duz | cizgili | bordur
    pub pattern: String,
    /// Fon panellerinin açıklığı (0 = kapalı, 1 = tamamen yanlara toplanmış).
    pub open: f64,
    #[serde(flatten)]
    pub style: Style,
}
impl Default for Curtain {
    fn default() -> Self {
        Curtain { width: 2600.0, height: 2600.0, kind: "tul-fon".into(), pleats: 9.0, depth: 70.0, header: "rustik".into(), opacity: 0.35, color: [0.93, 0.92, 0.88], color2: [0.42, 0.47, 0.52], pattern: "duz".into(), open: 0.6, style: Style::default() }
    }
}

/// Dalgalı kumaş paneli: x ∈ [x0, x1], yukarıdan asılı.
#[allow(clippy::too_many_arguments)]
fn drape(g: &mut Gen, x0: f64, x1: f64, y0: f64, y1: f64, z: f64, pleats_per_m: f64, depth: f64, mats: [&str; 2], pattern: &str) {
    let w = x1 - x0;
    if w < 20.0 {
        return;
    }
    let n = ((w / 1000.0 * pleats_per_m).round().max(1.0)) as usize;
    let seg = 4 + 4 * g.d();
    let nu = n * seg;
    let nv = 4 + 4 * g.d();
    let (m0, m1) = (mats[0].to_string(), mats[1].to_string());
    let pat = pattern.to_string();
    g.surface(
        nu,
        nv,
        |u, v| {
            // üstte derli toplu, alta doğru pile açılır ve hafifçe sallanır
            let amp = depth * 0.5 * (0.55 + 0.45 * v);
            let phase = 2.0 * PI * n as f64 * u;
            let sway = (3.0 * PI * u + 1.3).sin() * depth * 0.12 * v;
            [x0 + w * u, y1 - (y1 - y0) * v, z + amp * phase.sin() + sway]
        },
        |i, j| match pat.as_str() {
            "cizgili" if (i / seg) % 2 == 1 => m1.clone(),
            "bordur" if j >= nv - 1 => m1.clone(),
            _ => m0.clone(),
        },
    );
}

pub fn curtain(p: &Curtain, id: &str) -> Result<Generated, String> {
    let w = p.width.clamp(400.0, 8000.0);
    let h = p.height.clamp(400.0, 3400.0);
    let depth = p.depth.clamp(15.0, 160.0);
    let pleats = p.pleats.clamp(3.0, 18.0);
    let mut g = Gen::with(&p.style);
    let sheer_op = (p.opacity.clamp(0.1, 0.6)) as f32;
    let tul = col_id("perde-tul", p.color, (sheer_op * 100.0) as u32);
    let fon = col_id("perde-fon", p.color2, 100);
    let fon2 = col_id("perde-fon", shade(p.color2, 0.6), 101);
    let tul2 = col_id("perde-tul", shade(p.color, 0.82), (sheer_op * 100.0) as u32 + 1);
    g.material(&tul, "Tül perde", p.color, 0.9, sheer_op, "tekstil");
    g.material(&tul2, "Tül perde · ikinci ton", shade(p.color, 0.82), 0.9, sheer_op, "tekstil");
    g.material(&fon, "Fon perde", p.color2, 0.95, 1.0, "tekstil");
    g.material(&fon2, "Fon perde · ikinci ton", shade(p.color2, 0.6), 0.95, 1.0, "tekstil");
    let top = h;
    let hem = 25.0; // zeminden pay
    let mut area = 0.0;
    match p.kind.as_str() {
        "tul" => {
            drape(&mut g, -w / 2.0, w / 2.0, hem, top, 0.0, pleats, depth, [&tul, &tul2], &p.pattern);
            area += w * h * 2.2;
        }
        "fon" | "tul-fon" => {
            if p.kind == "tul-fon" {
                drape(&mut g, -w / 2.0, w / 2.0, hem, top, 0.0, pleats, depth * 0.6, [&tul, &tul2], "duz");
                area += w * h * 2.0;
            }
            let open = p.open.clamp(0.0, 0.92);
            let panel = w * (1.0 - open) / 2.0;
            let zf = if p.kind == "tul-fon" { depth + 30.0 } else { 0.0 };
            // toplanan kumaş daha sık pile yapar
            let dens = pleats / (1.0 - open * 0.75).max(0.2);
            drape(&mut g, -w / 2.0, -w / 2.0 + panel, hem, top, zf, dens.min(26.0), depth, [&fon, &fon2], &p.pattern);
            drape(&mut g, w / 2.0 - panel, w / 2.0, hem, top, zf, dens.min(26.0), depth, [&fon, &fon2], &p.pattern);
            area += w * h * 2.4;
        }
        "stor" => {
            let drop = h * (1.0 - p.open.clamp(0.0, 0.9));
            g.prism_x("metal-krom", -w / 2.0, w / 2.0, top - 30.0, 0.0, 28.0, 10);
            let m = if p.opacity < 0.7 { &tul } else { &fon };
            g.boxx(m, [-w / 2.0 + 15.0, top - drop, -3.0], [w / 2.0 - 15.0, top - 30.0, 3.0]);
            g.boxx("metal-krom", [-w / 2.0 + 15.0, top - drop - 18.0, -8.0], [w / 2.0 - 15.0, top - drop, 8.0]);
            area += w * drop;
        }
        other => return Err(format!("@unknown_curtain|value={other}")),
    }
    let zc = if p.kind == "tul-fon" { (depth + 30.0) / 2.0 } else { 0.0 };
    let mut header_price = 0.0;
    if p.kind != "stor" {
        match p.header.as_str() {
            "rustik" => {
                g.prism_x("ahsap-ceviz", -w / 2.0 - 120.0, w / 2.0 + 120.0, top + 35.0, zc, 16.0, 10);
                for sx in [-1.0, 1.0] {
                    let x = sx * (w / 2.0 + 120.0);
                    g.boxx("ahsap-ceviz", [x - 28.0, top + 7.0, zc - 28.0], [x + 28.0, top + 63.0, zc + 28.0]);
                }
                // halkalar: ayrıntı düzeyi 2 ve üstünde
                if g.d() >= 2 {
                    let rings = ((w / 1000.0 * pleats).round() as usize).clamp(4, 60);
                    for k in 0..rings {
                        let x = -w / 2.0 + (k as f64 + 0.5) * w / rings as f64;
                        g.prism_x("metal-krom", x - 4.0, x + 4.0, top + 35.0, zc, 24.0, 8);
                        g.boxx("metal-krom", [x - 2.0, top - 6.0, zc - 2.0], [x + 2.0, top + 12.0, zc + 2.0]);
                    }
                }
                header_price = w / 1000.0 * 650.0 + 400.0;
            }
            "kemer-duz" => {
                g.boxx(&fon, [-w / 2.0 - 60.0, top - 260.0, zc - depth - 40.0], [w / 2.0 + 60.0, top + 20.0, zc + depth + 60.0]);
                header_price = w / 1000.0 * 900.0;
            }
            "kemer-kavisli" => {
                let swags = ((w / 900.0).round().max(1.0)) as usize;
                let zf = zc + depth + 50.0;
                let f2 = fon2.clone();
                let f1 = fon.clone();
                g.surface(
                    swags * 10,
                    4,
                    |u, v| {
                        let s = (PI * swags as f64 * u).sin().abs();
                        let drop = 220.0 + 160.0 * s;
                        [-w / 2.0 - 60.0 + (w + 120.0) * u, top + 20.0 - drop * v, zf + 25.0 * s * v]
                    },
                    |_, j| if j == 3 { f2.clone() } else { f1.clone() },
                );
                g.boxx(&fon, [-w / 2.0 - 60.0, top, zc - depth - 40.0], [w / 2.0 + 60.0, top + 20.0, zf]);
                header_price = w / 1000.0 * 1400.0;
            }
            _ => {
                g.boxx("pvc-beyaz", [-w / 2.0 - 40.0, top, zc - 25.0], [w / 2.0 + 40.0, top + 22.0, zc + 25.0]);
                header_price = w / 1000.0 * 280.0;
            }
        }
    }
    let unit = match p.kind.as_str() {
        "tul" => 190.0,
        "stor" => 520.0,
        "fon" => 430.0,
        _ => 340.0,
    };
    let name = match p.kind.as_str() {
        "tul" => "Tül perde",
        "fon" => "Fon perde",
        "stor" => "Stor perde",
        _ => "Tül + fon perde",
    };
    Ok(g.finish(id, name, area / 1e6 * unit + header_price, 0.0))
}

/* ───────────── Halı motoru ───────────── */

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Rug {
    /// dikdortgen | yuvarlak | oval | yolluk
    pub shape: String,
    pub width: f64,
    pub length: f64,
    /// duz | bordur | cizgili | dama | madalyon
    pub pattern: String,
    pub color: [f32; 3],
    pub color2: [f32; 3],
    /// Hav yüksekliği (mm).
    pub pile: f64,
    pub fringe: bool,
    #[serde(flatten)]
    pub style: Style,
}
impl Default for Rug {
    fn default() -> Self {
        Rug { shape: "dikdortgen".into(), width: 2000.0, length: 2900.0, pattern: "bordur".into(), color: [0.72, 0.64, 0.52], color2: [0.30, 0.22, 0.20], pile: 12.0, fringe: false, style: Style::default() }
    }
}

/// Desen: (u, v) ∈ [-1, 1]² için 0 ya da 1.
fn rug_pattern(pat: &str, u: f64, v: f64, round: bool) -> usize {
    let r = if round { (u * u + v * v).sqrt() } else { u.abs().max(v.abs()) };
    match pat {
        "bordur" => (r > 0.8 && r < 0.93) as usize,
        "cizgili" => (((v + 1.0) * 4.5).floor() as i64 % 2).unsigned_abs() as usize,
        "dama" => ((((u + 1.0) * 3.0).floor() + ((v + 1.0) * 3.0).floor()) as i64 % 2).unsigned_abs() as usize,
        "madalyon" => ((u * u + v * v).sqrt() < 0.36 || (r > 0.84 && r < 0.94) || ((u.abs() - v.abs()).abs() < 0.07 && r < 0.6 && r > 0.42)) as usize,
        _ => 0,
    }
}

pub fn rug(p: &Rug, id: &str) -> Result<Generated, String> {
    let pile = p.pile.clamp(3.0, 60.0);
    let (mut w, mut l) = (p.width.clamp(400.0, 6000.0), p.length.clamp(400.0, 8000.0));
    let round = matches!(p.shape.as_str(), "yuvarlak" | "oval");
    if p.shape == "yuvarlak" {
        l = w;
    }
    if p.shape == "yolluk" {
        w = w.min(1000.0);
        l = l.max(w * 2.5);
    }
    let mut g = Gen::with(&p.style);
    let rough = if pile > 25.0 { 1.0 } else { 0.92 };
    let m = [col_id("hali", p.color, pile as u32), col_id("hali", p.color2, pile as u32 + 1)];
    g.material(&m[0], "Halı · ana renk", p.color, rough, 1.0, "tekstil");
    g.material(&m[1], "Halı · desen", p.color2, rough, 1.0, "tekstil");
    let pat = p.pattern.clone();
    if round {
        let (rings, sectors) = (12usize, 56usize);
        for i in 0..rings {
            for j in 0..sectors {
                let (r0, r1) = (i as f64 / rings as f64, (i + 1) as f64 / rings as f64);
                let (a0, a1) = (2.0 * PI * j as f64 / sectors as f64, 2.0 * PI * (j + 1) as f64 / sectors as f64);
                let pt = |r: f64, a: f64| [w / 2.0 * r * a.cos(), pile, l / 2.0 * r * a.sin()];
                let rc = (r0 + r1) / 2.0;
                let ac = (a0 + a1) / 2.0;
                let k = rug_pattern(&pat, rc * ac.cos(), rc * ac.sin(), true);
                g.quad(&m[k], pt(r0, a0), pt(r0, a1), pt(r1, a1), pt(r1, a0));
                if i == rings - 1 {
                    let (b0, b1) = ([w / 2.0 * a0.cos(), 0.0, l / 2.0 * a0.sin()], [w / 2.0 * a1.cos(), 0.0, l / 2.0 * a1.sin()]);
                    g.quad(&m[k], pt(1.0, a0), pt(1.0, a1), b1, b0);
                }
            }
        }
    } else {
        let (nx, nz) = (28usize, 28usize);
        let m2 = m.clone();
        let pat2 = pat.clone();
        g.surface(
            nx,
            nz,
            |u, v| [-w / 2.0 + w * u, pile, l / 2.0 - l * v],
            |i, j| m2[rug_pattern(&pat2, (i as f64 + 0.5) / nx as f64 * 2.0 - 1.0, (j as f64 + 0.5) / nz as f64 * 2.0 - 1.0, false)].clone(),
        );
        let edge = &m[0];
        g.quad(edge, [-w / 2.0, 0.0, -l / 2.0], [-w / 2.0, pile, -l / 2.0], [w / 2.0, pile, -l / 2.0], [w / 2.0, 0.0, -l / 2.0]);
        g.quad(edge, [-w / 2.0, 0.0, l / 2.0], [w / 2.0, 0.0, l / 2.0], [w / 2.0, pile, l / 2.0], [-w / 2.0, pile, l / 2.0]);
        g.quad(edge, [-w / 2.0, 0.0, -l / 2.0], [-w / 2.0, 0.0, l / 2.0], [-w / 2.0, pile, l / 2.0], [-w / 2.0, pile, -l / 2.0]);
        g.quad(edge, [w / 2.0, 0.0, -l / 2.0], [w / 2.0, pile, -l / 2.0], [w / 2.0, pile, l / 2.0], [w / 2.0, 0.0, l / 2.0]);
        if p.fringe {
            let n = (w / 40.0) as usize;
            for k in 0..n {
                let x = -w / 2.0 + (k as f64 + 0.25) * w / n as f64;
                for s in [-1.0, 1.0] {
                    let z = s * l / 2.0;
                    g.boxx(&m[1], [x, 0.0, z.min(z + s * 70.0)], [x + w / n as f64 * 0.5, 4.0, z.max(z + s * 70.0)]);
                }
            }
        }
    }
    let area = if round { PI * w * l / 4.0 } else { w * l } / 1e6;
    let unit = 700.0 + pile * 28.0 + if pat == "duz" { 0.0 } else { 260.0 };
    let name = match p.shape.as_str() {
        "yuvarlak" => "Yuvarlak halı",
        "oval" => "Oval halı",
        "yolluk" => "Yolluk",
        _ => "Halı",
    };
    Ok(g.finish(id, name, area * unit, 0.0))
}

/* ───────────── Yatak (baza + başlık) ve nevresim motoru ───────────── */

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Bedding {
    pub on: bool,
    pub color: [f32; 3],
    pub color2: [f32; 3],
    /// duz | cizgili | dama
    pub pattern: String,
    pub pillows: u32,
    /// Ayak ucu örtüsü (runner).
    pub throw: bool,
}
impl Default for Bedding {
    fn default() -> Self {
        Bedding { on: true, color: [0.90, 0.89, 0.86], color2: [0.36, 0.44, 0.52], pattern: "duz".into(), pillows: 2, throw: true }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Bed {
    /// Yatak genişliği ve boyu (mm): 900/1000/1200/1400/1600/1800/2000 × 1900/2000.
    pub width: f64,
    pub length: f64,
    /// sandikli | ayakli | dusuk
    pub base: String,
    pub base_color: [f32; 3],
    pub mattress: f64,
    /// duz | kapitone | kemerli | kulakli | yok
    pub headboard: String,
    pub headboard_height: f64,
    pub headboard_color: [f32; 3],
    pub bedding: Bedding,
    #[serde(flatten)]
    pub style: Style,
}
impl Default for Bed {
    fn default() -> Self {
        Bed { width: 1600.0, length: 2000.0, base: "sandikli".into(), base_color: [0.42, 0.43, 0.45], mattress: 260.0, headboard: "kapitone".into(), headboard_height: 1250.0, headboard_color: [0.42, 0.43, 0.45], bedding: Bedding::default(), style: Style::default() }
    }
}

/// Nevresim takımı: yorgan (yanlardan sarkar, hafif kabarık), baş kısmında katlama, yastıklar.
/// Yatak üst yüzeyi y = `top`, baş ucu z = -l/2.
fn bedding(g: &mut Gen, b: &Bedding, w: f64, l: f64, top: f64) {
    let m = [col_id("nevresim", b.color, 0), col_id("nevresim", b.color2, 1), col_id("nevresim", [0.94, 0.94, 0.92], 2)];
    g.material(&m[0], "Nevresim · ana renk", b.color, 0.95, 1.0, "tekstil");
    g.material(&m[1], "Nevresim · ikinci renk", b.color2, 0.95, 1.0, "tekstil");
    g.material(&m[2], "Yastık kılıfı", [0.94, 0.94, 0.92], 0.95, 1.0, "tekstil");
    let fold = 420.0; // baş ucundan katlama mesafesi
    let drop = 260.0;
    let puff = 55.0;
    let (z0, z1) = (-l / 2.0 + fold, l / 2.0);
    let pat = b.pattern.clone();
    let mm = m.clone();
    let cell = move |i: usize, j: usize| -> String {
        match pat.as_str() {
            "cizgili" if (i / 3) % 2 == 1 => mm[1].clone(),
            "dama" if (i / 4 + j / 4) % 2 == 1 => mm[1].clone(),
            _ => mm[0].clone(),
        }
    };
    // üst yüzey: kabarık ve hafif kırışık
    let (nu, nv) = (12 * g.d() + 12, 12 * g.d() + 12);
    let height = move |u: f64, v: f64| {
        let edge = (1.0 - (2.0 * u - 1.0).abs().powi(6)) * (1.0 - (2.0 * v - 1.0).abs().powi(6));
        top + 18.0 + puff * edge + 6.0 * ((u * 9.0).sin() * (v * 7.0 + 0.6).cos())
    };
    g.surface(nu, nv, |u, v| [-w / 2.0 - 25.0 + (w + 50.0) * u, height(u, v), z1 + 25.0 - (z1 + 25.0 - z0) * v], &cell);
    // yan ve ayak ucu sarkmaları
    let c2 = cell.clone();
    g.surface(nu, 3, |u, v| [-w / 2.0 - 25.0 + (w + 50.0) * u, height(u, 0.0) - (drop + 18.0) * v, z1 + 25.0 + 12.0 * (PI * v).sin()], |i, _| c2(i, 0));
    for s in [-1.0, 1.0] {
        let c3 = cell.clone();
        g.surface(
            nv,
            3,
            |u, v| [s * (w / 2.0 + 25.0 + 12.0 * (PI * v).sin()), height(if s < 0.0 { 0.0 } else { 1.0 }, 1.0 - u) - (drop + 18.0) * v, z0 + (z1 + 25.0 - z0) * u],
            move |i, _| c3(if s < 0.0 { 0 } else { nu - 1 }, nv - 1 - i),
        );
    }
    // katlama bandı
    g.boxx(&m[1], [-w / 2.0 - 25.0, top + 20.0, z0 - 60.0], [w / 2.0 + 25.0, top + 20.0 + puff + 22.0, z0 + 200.0]);
    // yastıklar
    let n = b.pillows.clamp(1, 6) as usize;
    let per_row = if w >= 1400.0 { 2 } else { 1 };
    let pw = if per_row == 2 { (w - 120.0) / 2.0 } else { (w - 160.0).min(700.0) };
    for k in 0..n {
        let row = k / per_row;
        let colx = k % per_row;
        let cx = if per_row == 2 { (colx as f64 - 0.5) * (pw + 40.0) } else { 0.0 };
        let cz = -l / 2.0 + 200.0 + row as f64 * 60.0;
        let base = top + 15.0 + row as f64 * 110.0;
        let mat = if row % 2 == 0 { m[2].clone() } else { m[1].clone() };
        let ph = 150.0;
        let pd = 360.0;
        let (pu, pv) = (6 + 4 * g.d(), 4 + 4 * g.d());
        g.surface(
            pu,
            pv,
            |u, v| {
                let (a, c) = (2.0 * u - 1.0, 2.0 * v - 1.0);
                let bulge = (1.0 - a.abs().powi(4)) * (1.0 - c.abs().powi(4));
                [cx + a * pw / 2.0, base + ph * bulge.powf(0.6), cz + c * pd / 2.0]
            },
            |_, _| mat.clone(),
        );
        g.boxx(&mat, [cx - pw / 2.0, base - 5.0, cz - pd / 2.0], [cx + pw / 2.0, base + 8.0, cz + pd / 2.0]);
    }
    if b.throw {
        g.boxx(&m[1], [-w / 2.0 - 32.0, top - drop * 0.75, l / 2.0 - 620.0], [w / 2.0 + 32.0, top + 18.0 + puff + 26.0, l / 2.0 - 200.0]);
    }
}

pub fn bed(p: &Bed, id: &str) -> Result<Generated, String> {
    let w = p.width.clamp(800.0, 2200.0);
    let l = p.length.clamp(1800.0, 2200.0);
    let mh = p.mattress.clamp(120.0, 400.0);
    let mut g = Gen::with(&p.style);
    let bm = col_id("baza", p.base_color, 0);
    let hm = col_id("baslik", p.headboard_color, 0);
    let hm2 = col_id("baslik", shade(p.headboard_color, 0.78), 1);
    g.material(&bm, "Baza kumaşı", p.base_color, 0.9, 1.0, "tekstil");
    g.material(&hm, "Başlık kumaşı", p.headboard_color, 0.9, 1.0, "tekstil");
    g.material(&hm2, "Başlık kumaşı · gölge ton", shade(p.headboard_color, 0.78), 0.9, 1.0, "tekstil");
    let (base_top, mut price) = match p.base.as_str() {
        "sandikli" => {
            g.boxx(&bm, [-w / 2.0, 40.0, -l / 2.0], [w / 2.0, 360.0, l / 2.0]);
            g.boxx("siyah-mat", [-w / 2.0 + 40.0, 0.0, -l / 2.0 + 40.0], [w / 2.0 - 40.0, 40.0, l / 2.0 - 40.0]);
            (360.0, w / 1000.0 * 9500.0)
        }
        "ayakli" => {
            g.boxx(&bm, [-w / 2.0, 160.0, -l / 2.0], [w / 2.0, 300.0, l / 2.0]);
            for (sx, sz) in [(-1.0, -1.0), (1.0, -1.0), (-1.0, 1.0), (1.0, 1.0)] {
                let (x, z) = (sx * (w / 2.0 - 70.0), sz * (l / 2.0 - 70.0));
                g.boxx("ahsap-ceviz", [x - 30.0, 0.0, z - 30.0], [x + 30.0, 160.0, z + 30.0]);
            }
            (300.0, w / 1000.0 * 7200.0)
        }
        "dusuk" => {
            g.boxx("ahsap-mese", [-w / 2.0 - 120.0, 0.0, -l / 2.0 - 40.0], [w / 2.0 + 120.0, 180.0, l / 2.0 + 120.0]);
            (180.0, w / 1000.0 * 8400.0)
        }
        other => return Err(format!("@unknown_base|value={other}")),
    };
    // şilte
    g.boxx("kumas-beyaz", [-w / 2.0 + 10.0, base_top, -l / 2.0 + 10.0], [w / 2.0 - 10.0, base_top + mh, l / 2.0 - 10.0]);
    price += w / 1000.0 * (6500.0 + mh * 22.0);
    let top = base_top + mh;
    // başlık (z = -l/2 arkasında)
    let hh = p.headboard_height.clamp(700.0, 1800.0);
    let zb = -l / 2.0;
    let t = 110.0;
    match p.headboard.as_str() {
        "yok" => {}
        "duz" => {
            g.boxx(&hm, [-w / 2.0 - 40.0, 0.0, zb - t], [w / 2.0 + 40.0, hh, zb]);
            price += w / 1000.0 * 3200.0;
        }
        "kapitone" => {
            g.boxx(&hm2, [-w / 2.0 - 40.0, 0.0, zb - t], [w / 2.0 + 40.0, hh, zb - 30.0]);
            let cols = ((w + 80.0) / 280.0).round().max(2.0) as usize;
            let rows = ((hh - top + 60.0) / 240.0).round().max(2.0) as usize;
            let (cw, rh) = ((w + 80.0) / cols as f64, (hh - top + 60.0) / rows as f64);
            for i in 0..cols {
                for j in 0..rows {
                    let x0 = -w / 2.0 - 40.0 + i as f64 * cw;
                    let y0 = top - 60.0 + j as f64 * rh;
                    // her panel hafif kabarık: iki kademeli kutu
                    g.boxx(&hm, [x0 + 6.0, y0 + 6.0, zb - 30.0], [x0 + cw - 6.0, y0 + rh - 6.0, zb - 8.0]);
                    g.boxx(&hm, [x0 + 30.0, y0 + 30.0, zb - 8.0], [x0 + cw - 30.0, y0 + rh - 30.0, zb + 6.0]);
                }
            }
            price += w / 1000.0 * 5200.0;
        }
        "kemerli" => {
            g.boxx(&hm, [-w / 2.0 - 40.0, 0.0, zb - t], [w / 2.0 + 40.0, hh - 260.0, zb]);
            let n = 20usize;
            for k in 0..n {
                let (u0, u1) = (k as f64 / n as f64, (k + 1) as f64 / n as f64);
                let x = |u: f64| -w / 2.0 - 40.0 + (w + 80.0) * u;
                let y = |u: f64| hh - 260.0 + 260.0 * (PI * u).sin();
                let ym = y((u0 + u1) / 2.0);
                g.boxx(&hm, [x(u0), hh - 260.0, zb - t], [x(u1), ym, zb]);
            }
            price += w / 1000.0 * 4600.0;
        }
        "kulakli" => {
            g.boxx(&hm, [-w / 2.0 - 40.0, 0.0, zb - t], [w / 2.0 + 40.0, hh, zb]);
            for s in [-1.0, 1.0] {
                let x = s * (w / 2.0 + 40.0);
                g.boxx(&hm2, [x.min(x + s * 90.0), 0.0, zb - t], [x.max(x + s * 90.0), hh, zb + 420.0]);
            }
            price += w / 1000.0 * 5600.0;
        }
        other => return Err(format!("@unknown_headboard|value={other}")),
    }
    if p.bedding.on {
        bedding(&mut g, &p.bedding, w, l, top);
        price += w / 1000.0 * 2400.0 + p.bedding.pillows as f64 * 450.0;
    }
    let name = format!("Yatak {}×{} · {} baza{}", (w / 10.0) as i64, (l / 10.0) as i64, match p.base.as_str() { "ayakli" => "ayaklı", "dusuk" => "düşük", _ => "sandıklı" }, match p.headboard.as_str() { "yok" => "", "duz" => " · düz başlık", "kemerli" => " · kemerli başlık", "kulakli" => " · kulaklı başlık", _ => " · kapitone başlık" });
    Ok(g.finish(id, &name, price, 0.0))
}

/// Yalnız nevresim takımı (mevcut bir yatağın üzerine): `top` şilte üst kotu.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct BeddingSet {
    pub width: f64,
    pub length: f64,
    pub top: f64,
    pub bedding: Bedding,
    #[serde(flatten)]
    pub style: Style,
}
impl Default for BeddingSet {
    fn default() -> Self {
        BeddingSet { width: 1600.0, length: 2000.0, top: 520.0, bedding: Bedding::default(), style: Style::default() }
    }
}
pub fn bedding_set(p: &BeddingSet, id: &str) -> Result<Generated, String> {
    let mut g = Gen::with(&p.style);
    let (w, l) = (p.width.clamp(800.0, 2200.0), p.length.clamp(1800.0, 2200.0));
    let top = p.top.clamp(100.0, 900.0);
    bedding(&mut g, &Bedding { on: true, ..p.bedding.clone() }, w, l, top);
    let price = w / 1000.0 * 2400.0 + p.bedding.pillows as f64 * 450.0;
    // sarkan kenarlar şiltenin altına iner: nesne en alt noktasından konumlanır
    Ok(g.finish(id, &format!("Nevresim takımı {}×{}", (w / 10.0) as i64, (l / 10.0) as i64), price, (top - 260.0).max(0.0)))
}

/* ───────────── Havuz oluşturucu ───────────── */

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Pool {
    /// dikdortgen | oval | yuvarlak | l
    pub shape: String,
    pub width: f64,
    pub length: f64,
    pub depth: f64,
    /// Kenar taşı genişliği (mm).
    pub coping: f64,
    pub water: [f32; 3],
    pub steps: bool,
    pub lights: bool,
}
impl Default for Pool {
    fn default() -> Self {
        Pool { shape: "dikdortgen".into(), width: 4000.0, length: 8000.0, depth: 1500.0, coping: 350.0, water: [0.45, 0.80, 0.90], steps: true, lights: true }
    }
}

pub fn pool(p: &Pool, id: &str) -> Result<Generated, String> {
    let (mut w, l) = (p.width.clamp(1500.0, 15000.0), p.length.clamp(1500.0, 30000.0));
    let c = p.coping.clamp(150.0, 800.0);
    let depth = p.depth.clamp(600.0, 3000.0);
    let mut g = Gen::default();
    // Su ince ve saydam bir yüzeydir; altındaki fayans rengi derinlikle koyulaşır.
    let k = (1.0 - (depth - 600.0) / 2400.0 * 0.45) as f32;
    g.material("havuz-su", "Havuz suyu", p.water, 0.04, 0.3, "dis");
    g.material(&format!("havuz-fayans-{}", (k * 100.0) as u32), "Havuz fayansı", shade([0.30, 0.66, 0.84], k), 0.25, 1.0, "dis");
    g.material("traverten", "Traverten kenar taşı", [0.86, 0.80, 0.70], 0.7, 1.0, "dis");
    let tile = format!("havuz-fayans-{}", (k * 100.0) as u32);
    let (rim, water_y, floor_y) = (60.0, 32.0, 6.0);
    let round = matches!(p.shape.as_str(), "oval" | "yuvarlak");
    if p.shape == "yuvarlak" {
        w = w.min(l);
    }
    let ll = if p.shape == "yuvarlak" { w } else { l };
    match p.shape.as_str() {
        "oval" | "yuvarlak" => {
            let s = 64usize;
            for j in 0..s {
                let (a0, a1) = (2.0 * PI * j as f64 / s as f64, 2.0 * PI * (j + 1) as f64 / s as f64);
                let e = |rx: f64, rz: f64, a: f64, y: f64| [rx * a.cos(), y, rz * a.sin()];
                let (rx, rz) = (w / 2.0, ll / 2.0);
                g.tri(&tile, [0.0, floor_y, 0.0], e(rx, rz, a1, floor_y), e(rx, rz, a0, floor_y));
                g.tri("havuz-su", [0.0, water_y, 0.0], e(rx, rz, a1, water_y), e(rx, rz, a0, water_y));
                // kenar taşı halkası
                g.quad("traverten", e(rx, rz, a0, rim), e(rx, rz, a1, rim), e(rx + c, rz + c, a1, rim), e(rx + c, rz + c, a0, rim));
                g.quad("traverten", e(rx + c, rz + c, a0, 0.0), e(rx + c, rz + c, a0, rim), e(rx + c, rz + c, a1, rim), e(rx + c, rz + c, a1, 0.0));
                g.quad(&tile, e(rx, rz, a0, floor_y), e(rx, rz, a1, floor_y), e(rx, rz, a1, rim), e(rx, rz, a0, rim));
            }
        }
        "dikdortgen" | "l" => {
            // L: ana gövde + yan kol
            let mut rects = vec![(-w / 2.0, -ll / 2.0, w / 2.0, ll / 2.0)];
            if p.shape == "l" {
                rects.push((w / 2.0, ll / 2.0 - ll * 0.42, w / 2.0 + w * 0.7, ll / 2.0));
            }
            for &(x0, z0, x1, z1) in &rects {
                g.quad(&tile, [x0, floor_y, z0], [x0, floor_y, z1], [x1, floor_y, z1], [x1, floor_y, z0]);
                g.quad("havuz-su", [x0, water_y, z0], [x0, water_y, z1], [x1, water_y, z1], [x1, water_y, z0]);
            }
            let (bx0, bz0, bx1, bz1) = rects.iter().fold((f64::INFINITY, f64::INFINITY, f64::NEG_INFINITY, f64::NEG_INFINITY), |a, r| (a.0.min(r.0), a.1.min(r.1), a.2.max(r.2), a.3.max(r.3)));
            // kenar taşı: dış çerçeve + L boşluğunu dolduran parça
            g.boxx("traverten", [bx0 - c, 0.0, bz0 - c], [bx1 + c, rim, bz0]);
            g.boxx("traverten", [bx0 - c, 0.0, bz1], [bx1 + c, rim, bz1 + c]);
            g.boxx("traverten", [bx0 - c, 0.0, bz0], [bx0, rim, bz1]);
            g.boxx("traverten", [bx1, 0.0, bz0], [bx1 + c, rim, bz1]);
            if p.shape == "l" {
                g.boxx("traverten", [w / 2.0, 0.0, bz0], [bx1, rim, ll / 2.0 - ll * 0.42]);
            }
            if p.steps {
                for s in 0..3 {
                    let d = 300.0 * (s + 1) as f64;
                    g.boxx(&tile, [-w / 2.0, floor_y, -ll / 2.0], [-w / 2.0 + (w * 0.4).min(1800.0), floor_y + 8.0 - s as f64 * 2.0, -ll / 2.0 + d]);
                }
            }
        }
        other => return Err(format!("@unknown_pool|value={other}")),
    }
    if p.lights {
        g.materials.push(Material { id: "havuz-isik".into(), name: "Havuz aydınlatması".into(), color: [0.75, 0.93, 1.0], roughness: 0.5, metallic: 0.0, emission: 5.0, opacity: 1.0, price_m2: 0.0, category: "isik".into(), ..Default::default() });
        let n = ((ll / 2500.0).round().max(1.0)) as usize;
        for kk in 0..n {
            let z = -ll / 2.0 + (kk as f64 + 0.5) * ll / n as f64;
            let x = if round { 0.0 } else { w / 2.0 - 220.0 };
            g.boxx("havuz-isik", [x - 90.0, floor_y + 1.0, z - 90.0], [x + 90.0, floor_y + 9.0, z + 90.0]);
        }
    }
    let area = if round { PI * w * ll / 4.0 } else { w * ll * if p.shape == "l" { 1.29 } else { 1.0 } } / 1e6;
    let price = area * (9500.0 + depth * 4.2) + (w + ll) * 2.0 / 1000.0 * (c / 1000.0) * 3200.0;
    let name = match p.shape.as_str() {
        "oval" => "Oval havuz",
        "yuvarlak" => "Yuvarlak havuz",
        "l" => "L havuz",
        _ => "Havuz",
    };
    Ok(g.finish(id, name, price, 0.0))
}

/// Motor adına göre üretir. `params` ilgili motorun JSON parametreleridir.
pub fn generate(kind: &str, params: serde_json::Value, id: &str) -> Result<Generated, String> {
    fn de<T: for<'a> Deserialize<'a>>(v: serde_json::Value) -> Result<T, String> {
        serde_json::from_value(v).map_err(|e| format!("@params_invalid|error={}", e.to_string().replace('|', "/")))
    }
    match kind {
        "perde" => curtain(&de::<Curtain>(params)?, id),
        "hali" => rug(&de::<Rug>(params)?, id),
        "yatak" => bed(&de::<Bed>(params)?, id),
        "nevresim" => bedding_set(&de::<BeddingSet>(params)?, id),
        "havuz" => pool(&de::<Pool>(params)?, id),
        _ => Err(format!("@unknown_generator|value={kind}")),
    }
}

/// Arayüz formları için varsayılan parametreler.
pub fn defaults() -> serde_json::Value {
    serde_json::json!({"perde": Curtain::default(), "hali": Rug::default(), "yatak": Bed::default(), "nevresim": BeddingSet::default(), "havuz": Pool::default()})
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid(g: &Generated) {
        assert!(g.triangles > 0 && g.mesh.indices.len() == g.triangles * 3);
        assert_eq!(g.mesh.positions.len(), g.mesh.normals.len());
        assert!(g.mesh.positions.iter().all(|p| p.iter().all(|v| v.is_finite())));
        let miny = g.mesh.positions.iter().map(|p| p[1]).fold(f32::INFINITY, f32::min);
        assert!(miny.abs() < 0.01, "taban y=0 olmalı: {miny}");
        assert!(g.mesh.groups.iter().map(|x| x.count).sum::<u32>() as usize == g.mesh.indices.len());
        assert!(g.price > 0.0);
    }

    #[test]
    fn curtain_kinds_pleats_and_headers() {
        let base = curtain(&Curtain::default(), "p").unwrap();
        valid(&base);
        assert!((base.size[2] - 2600.0).abs() < 120.0, "yükseklik {:?}", base.size);
        // pile sıklığı arttıkça üçgen sayısı artar
        let dense = curtain(&Curtain { kind: "tul".into(), pleats: 14.0, ..Default::default() }, "p").unwrap();
        let sparse = curtain(&Curtain { kind: "tul".into(), pleats: 5.0, ..Default::default() }, "p").unwrap();
        assert!(dense.triangles > sparse.triangles * 2);
        // tül saydam, fon ışık geçirmez malzeme üretir
        assert!(dense.materials.iter().any(|m| m.id.starts_with("perde-tul") && m.opacity < 0.5));
        let fon = curtain(&Curtain { kind: "fon".into(), header: "kemer-kavisli".into(), pattern: "cizgili".into(), ..Default::default() }, "p").unwrap();
        valid(&fon);
        assert!(fon.mesh.groups.iter().all(|g| !g.material.starts_with("perde-tul")));
        assert!(fon.mesh.groups.len() >= 2, "çizgili desen iki ton kullanır");
        for (k, h) in [("stor", "korniş"), ("tul-fon", "kemer-duz"), ("tul", "rustik")] {
            valid(&curtain(&Curtain { kind: k.into(), header: h.into(), ..Default::default() }, "p").unwrap());
        }
        assert!(curtain(&Curtain { kind: "jaluzi".into(), ..Default::default() }, "p").is_err());
    }

    #[test]
    fn rug_shapes_and_patterns() {
        for shape in ["dikdortgen", "yuvarlak", "oval", "yolluk"] {
            for pat in ["duz", "bordur", "cizgili", "dama", "madalyon"] {
                let r = rug(&Rug { shape: shape.into(), pattern: pat.into(), fringe: true, ..Default::default() }, "h").unwrap();
                valid(&r);
                if pat != "duz" {
                    assert!(r.mesh.groups.len() >= 2, "{shape}/{pat}: desen iki renk kullanmalı");
                }
            }
        }
        let round = rug(&Rug { shape: "yuvarlak".into(), width: 1800.0, length: 3000.0, ..Default::default() }, "h").unwrap();
        assert!((round.size[0] - round.size[1]).abs() < 1.0, "yuvarlak halı eşit çaplı");
        assert!((round.size[2] - 12.0).abs() < 0.5);
    }

    #[test]
    fn bed_base_headboard_combinations_and_bedding_fit() {
        for base in ["sandikli", "ayakli", "dusuk"] {
            for head in ["duz", "kapitone", "kemerli", "kulakli", "yok"] {
                let b = bed(&Bed { base: base.into(), headboard: head.into(), ..Default::default() }, "y").unwrap();
                valid(&b);
                if head != "yok" {
                    assert!((b.size[2] - 1250.0).abs() < 2.0, "{base}/{head} başlık yüksekliği {}", b.size[2]);
                }
            }
        }
        // nevresim yatak ölçüsüne uyar: genişlik = yatak + sarkma payı
        for w in [900.0, 1400.0, 1800.0] {
            let s = bedding_set(&BeddingSet { width: w, ..Default::default() }, "n").unwrap();
            valid(&s);
            assert!(s.size[0] > w + 40.0 && s.size[0] < w + 110.0, "{w}: {}", s.size[0]);
        }
        let two = bedding_set(&BeddingSet { width: 1600.0, bedding: Bedding { pillows: 4, pattern: "dama".into(), ..Default::default() }, ..Default::default() }, "n").unwrap();
        let one = bedding_set(&BeddingSet { width: 1600.0, bedding: Bedding { pillows: 2, ..Default::default() }, ..Default::default() }, "n").unwrap();
        assert!(two.triangles > one.triangles);
    }

    #[test]
    fn look_and_detail_change_material_and_tessellation() {
        let lo = curtain(&Curtain { kind: "tul".into(), style: Style { detail: 1, ..Default::default() }, ..Default::default() }, "p").unwrap();
        let hi = curtain(&Curtain { kind: "tul".into(), style: Style { detail: 3, look: "img:tx1".into(), look_scale: 400.0 }, ..Default::default() }, "p").unwrap();
        assert!(hi.triangles > lo.triangles * 2);
        assert!(hi.materials.iter().filter(|m| m.category == "tekstil").all(|m| m.texture == "img:tx1" && m.texture_scale == 400.0));
        assert!(lo.materials.iter().any(|m| m.texture == "kumas"));
        // yumuşak normaller: komşu üçgenler köşe normalini paylaşır
        let distinct: std::collections::HashSet<[i32; 3]> = hi.mesh.normals.iter().map(|n| [(n[0] * 50.0) as i32, (n[1] * 50.0) as i32, (n[2] * 50.0) as i32]).collect();
        assert!(distinct.len() > 40, "kıvrımlı yüzeyde çok sayıda farklı normal olmalı: {}", distinct.len());
        let r = generate("hali", serde_json::json!({"look": "hali", "detail": 3, "pattern": "dama"}), "h").unwrap();
        valid(&r);
    }

    #[test]
    fn pool_shapes() {
        for shape in ["dikdortgen", "oval", "yuvarlak", "l"] {
            let p = pool(&Pool { shape: shape.into(), ..Default::default() }, "v").unwrap();
            valid(&p);
            assert!(p.mesh.groups.iter().any(|g| g.material == "havuz-su"));
            assert!(p.materials.iter().any(|m| m.id == "havuz-su" && m.opacity < 0.5));
        }
        let r = pool(&Pool { shape: "dikdortgen".into(), width: 3000.0, length: 6000.0, coping: 300.0, ..Default::default() }, "v").unwrap();
        assert_eq!([r.size[0], r.size[1]], [3600.0, 6600.0]);
        assert!(generate("havuz", serde_json::json!({"shape": "ucgen"}), "v").is_err());
        assert!(generate("robot", serde_json::json!({}), "v").is_err());
    }
}
