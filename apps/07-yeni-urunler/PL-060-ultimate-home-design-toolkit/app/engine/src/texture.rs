//! Yüzey dokuları: prosedürel desenler (parke, ahşap, karo, mermer, beton, kumaş, halı,
//! çim, taş) ve kullanıcının yüklediği görsel dokular.
//!
//! UV gerektirmez: desen, yüzeyin baskın eksenine göre dünya koordinatından (mm) üretilir
//! (üç düzlemli izdüşüm). Aynı fonksiyonlar render motorunda ve 3B önizleme karolarında kullanılır.

use crate::model::{Scene, TextureAsset};
use base64::Engine;

pub const MAX_TEXTURE_EDGE: usize = 512;
pub const KINDS: [(&str, &str); 9] = [
    ("parke", "Parke"),
    ("ahsap", "Ahşap damarı"),
    ("karo", "Karo / seramik"),
    ("mermer", "Mermer"),
    ("beton", "Beton"),
    ("kumas", "Kumaş dokuması"),
    ("hali", "Halı havı"),
    ("cim", "Çim"),
    ("tas", "Doğal taş"),
];

fn hash(x: i32, y: i32) -> f32 {
    let mut h = (x as u32).wrapping_mul(0x9E37_79B1) ^ (y as u32).wrapping_mul(0x85EB_CA6B);
    h ^= h >> 15;
    h = h.wrapping_mul(0x2C1B_3C6D);
    h ^= h >> 12;
    h = h.wrapping_mul(0x297A_2D39);
    h ^= h >> 15;
    (h & 0x00FF_FFFF) as f32 / 16_777_215.0
}

/// Değer gürültüsü, 0–1.
pub fn noise(x: f32, y: f32) -> f32 {
    let (xi, yi) = (x.floor(), y.floor());
    let (fx, fy) = (x - xi, y - yi);
    let (sx, sy) = (fx * fx * (3.0 - 2.0 * fx), fy * fy * (3.0 - 2.0 * fy));
    let (i, j) = (xi as i32, yi as i32);
    let a = hash(i, j) + (hash(i + 1, j) - hash(i, j)) * sx;
    let b = hash(i, j + 1) + (hash(i + 1, j + 1) - hash(i, j + 1)) * sx;
    a + (b - a) * sy
}

pub fn fbm(x: f32, y: f32) -> f32 {
    let mut s = 0.0;
    let mut a = 0.5;
    let (mut px, mut py) = (x, y);
    for _ in 0..4 {
        s += a * noise(px, py);
        px = px * 2.03 + 17.1;
        py = py * 2.03 + 9.7;
        a *= 0.5;
    }
    s / 0.9375
}

fn fract(x: f32) -> f32 {
    x - x.floor()
}

/// Prosedürel desen: (u, v) mm; dönen değer taban renge uygulanacak çarpandır.
pub fn procedural(kind: &str, u: f32, v: f32, scale: f32) -> [f32; 3] {
    let s = scale.max(1.0);
    let g = |k: f32| [k, k, k];
    match kind {
        "parke" => {
            let (pw, pl) = (s * 0.158, s);
            let row = (v / pw).floor();
            let off = hash(row as i32, 7) * pl;
            let col = ((u + off) / pl).floor();
            let tone = 0.84 + 0.26 * hash(row as i32, col as i32);
            let grain = 1.0 + 0.07 * ((v + 26.0 * fbm(u / 380.0, v / 36.0)) * 0.42).sin();
            let gap = if fract(v / pw) < 0.014 || fract((u + off) / pl) < 0.0028 { 0.58 } else { 1.0 };
            let k = tone * grain * gap;
            [k * 1.02, k, k * 0.96]
        }
        "ahsap" => {
            let k = 0.82 + 0.34 * fbm(u / (s * 0.3), v / (s * 0.014)) + 0.04 * ((u + 40.0 * noise(u / 200.0, v / 30.0)) * 0.05).sin();
            [k * 1.02, k, k * 0.95]
        }
        "karo" => {
            let (fu, fv) = (fract(u / s), fract(v / s));
            let j = 4.0 / s;
            if fu < j || fv < j {
                g(0.55)
            } else {
                g(0.95 + 0.07 * hash((u / s).floor() as i32, (v / s).floor() as i32) + 0.03 * (noise(u / 40.0, v / 40.0) - 0.5))
            }
        }
        "mermer" => {
            let t = u / s * 2.6 + 3.6 * fbm(u / s * 1.7, v / s * 1.7);
            let vein = 1.0 - (t * std::f32::consts::PI).sin().abs();
            let k = 1.0 - 0.34 * vein.powi(7) - 0.07 * (fbm(u / s * 5.0, v / s * 5.0) - 0.5);
            [k, k, k * 1.01]
        }
        "beton" => {
            let mut k = 0.9 + 0.2 * (fbm(u / (s * 0.25), v / (s * 0.25)) - 0.5);
            if noise(u / 9.0, v / 9.0) > 0.93 {
                k *= 0.82;
            }
            g(k)
        }
        "kumas" => {
            let f = 2.0 * std::f32::consts::PI / (s * 0.0032).max(1.2);
            g(0.93 + 0.07 * (u * f).sin() * (v * f).sin() + 0.06 * (noise(u / 55.0, v / 55.0) - 0.5))
        }
        "hali" => g(0.86 + 0.26 * noise(u / 5.0, v / 5.0)),
        "cim" => {
            let k = 0.72 + 0.56 * fbm(u / (s * 0.12), v / (s * 0.12));
            [k * 0.94, k, k * 0.8]
        }
        "tas" => {
            let c = s * 0.3;
            let (gx, gy) = ((u / c).floor() as i32, (v / c).floor() as i32);
            let (mut d1, mut d2, mut id) = (9.0f32, 9.0f32, 0.0);
            for j in -1..=1 {
                for i in -1..=1 {
                    let (cx, cy) = (gx + i, gy + j);
                    let px = (cx as f32 + 0.15 + 0.7 * hash(cx, cy)) * c;
                    let py = (cy as f32 + 0.15 + 0.7 * hash(cy, cx + 31)) * c;
                    let d = ((u - px).powi(2) + (v - py).powi(2)).sqrt() / c;
                    if d < d1 {
                        d2 = d1;
                        d1 = d;
                        id = hash(cx + 5, cy - 3);
                    } else if d < d2 {
                        d2 = d;
                    }
                }
            }
            if d2 - d1 < 0.06 {
                g(0.5)
            } else {
                g(0.82 + 0.32 * id + 0.05 * (noise(u / 30.0, v / 30.0) - 0.5))
            }
        }
        _ => g(1.0),
    }
}

/// Çözülmüş görsel doku (0–1 sRGB).
#[derive(Clone)]
pub struct Image {
    pub id: String,
    pub w: usize,
    pub h: usize,
    pub px: Vec<[f32; 3]>,
    pub mean: [f32; 3],
}

impl Image {
    pub fn decode(t: &TextureAsset) -> Option<Image> {
        let raw = base64::engine::general_purpose::STANDARD.decode(&t.rgb).ok()?;
        let (w, h) = (t.width as usize, t.height as usize);
        if w == 0 || h == 0 || w > MAX_TEXTURE_EDGE || h > MAX_TEXTURE_EDGE || raw.len() != w * h * 3 {
            return None;
        }
        let px: Vec<[f32; 3]> = raw.chunks(3).map(|c| [c[0] as f32 / 255.0, c[1] as f32 / 255.0, c[2] as f32 / 255.0]).collect();
        let n = px.len() as f32;
        let s = px.iter().fold([0.0f32; 3], |a, c| [a[0] + c[0], a[1] + c[1], a[2] + c[2]]);
        Some(Image { id: t.id.clone(), w, h, mean: [s[0] / n, s[1] / n, s[2] / n], px })
    }
    /// Çift doğrusal örnekleme; (u, v) tekrar eder, v yukarı doğrudur.
    pub fn sample(&self, u: f32, v: f32) -> [f32; 3] {
        let x = fract(u) * self.w as f32 - 0.5;
        let y = (1.0 - fract(v)) * self.h as f32 - 0.5;
        let (x0, y0) = (x.floor(), y.floor());
        let (fx, fy) = (x - x0, y - y0);
        let at = |i: f32, j: f32| self.px[(j.rem_euclid(self.h as f32) as usize) * self.w + i.rem_euclid(self.w as f32) as usize];
        let (a, b, c, d) = (at(x0, y0), at(x0 + 1.0, y0), at(x0, y0 + 1.0), at(x0 + 1.0, y0 + 1.0));
        let mut o = [0.0; 3];
        for k in 0..3 {
            let top = a[k] + (b[k] - a[k]) * fx;
            let bot = c[k] + (d[k] - c[k]) * fx;
            o[k] = top + (bot - top) * fy;
        }
        o
    }
}

/// Yüklenecek görsel dokuyu doğrular ve sahneye ekler; kimliğini döner.
pub fn add_texture(scene: &mut Scene, name: &str, width: usize, height: usize, rgb_b64: &str) -> Result<String, String> {
    if !(2..=MAX_TEXTURE_EDGE).contains(&width) || !(2..=MAX_TEXTURE_EDGE).contains(&height) {
        return Err(format!("@texture_bad_size|max={MAX_TEXTURE_EDGE}"));
    }
    let raw = base64::engine::general_purpose::STANDARD.decode(rgb_b64).map_err(|_| "@texture_unreadable".to_string())?;
    if raw.len() != width * height * 3 {
        return Err("@texture_size_mismatch".into());
    }
    if scene.textures.len() >= 64 {
        return Err("@texture_limit".into());
    }
    let mut k = scene.textures.len() + 1;
    let id = loop {
        let c = format!("tx{k}");
        if !scene.textures.iter().any(|t| t.id == c) {
            break c;
        }
        k += 1;
    };
    scene.textures.push(TextureAsset { id: id.clone(), name: name.chars().take(60).collect(), width: width as u32, height: height as u32, rgb: rgb_b64.to_string(), ..Default::default() });
    Ok(id)
}

/// Yüzey normaline göre baskın düzlemde (u, v) mm.
pub fn planar(p: [f32; 3], n: [f32; 3]) -> (f32, f32) {
    let (ax, ay, az) = (n[0].abs(), n[1].abs(), n[2].abs());
    if ay >= ax && ay >= az {
        (p[0], p[2])
    } else if az >= ax {
        (p[0], p[1])
    } else {
        (p[2], p[1])
    }
}

/// 3B önizleme için tekrar eden karo (RGB bayt). Kenar uzunluğu `scale` mm'ye karşılık gelir.
pub fn tile(kind: &str, color: [f32; 3], scale: f32, size: usize) -> Vec<u8> {
    let mut out = Vec::with_capacity(size * size * 3);
    for j in 0..size {
        for i in 0..size {
            let (u, v) = (i as f32 / size as f32 * scale, (size - 1 - j) as f32 / size as f32 * scale);
            let m = procedural(kind, u, v, scale);
            for k in 0..3 {
                out.push(((color[k] * m[k]).clamp(0.0, 1.0) * 255.0 + 0.5) as u8);
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn noise_is_bounded_and_deterministic() {
        for k in 0..200 {
            let (x, y) = (k as f32 * 0.37 - 20.0, k as f32 * 0.91);
            let n = noise(x, y);
            assert!((0.0..=1.0).contains(&n));
            assert_eq!(n, noise(x, y));
            assert!((0.0..=1.0001).contains(&fbm(x, y)));
        }
    }

    #[test]
    fn procedural_kinds_vary_but_stay_near_one() {
        for (kind, _) in KINDS {
            let mut lo = f32::INFINITY;
            let mut hi = f32::NEG_INFINITY;
            for j in 0..60 {
                for i in 0..60 {
                    let m = procedural(kind, i as f32 * 23.0, j as f32 * 17.0, 600.0);
                    lo = lo.min(m[1]);
                    hi = hi.max(m[1]);
                }
            }
            assert!(lo > 0.3 && hi < 1.6, "{kind}: {lo}..{hi}");
            assert!(hi - lo > 0.05, "{kind} deseni düz");
        }
        assert_eq!(procedural("yok", 1.0, 2.0, 100.0), [1.0, 1.0, 1.0]);
    }

    #[test]
    fn tile_grout_lines_and_image_sampling() {
        let t = tile("karo", [0.8, 0.8, 0.8], 600.0, 64);
        assert_eq!(t.len(), 64 * 64 * 3);
        // sol kenar derz (koyu), orta açık
        assert!(t[63 * 64 * 3] < t[(32 * 64 + 32) * 3]);
        let mut s = Scene::default();
        // 2×2: kırmızı, yeşil / mavi, beyaz
        let raw: Vec<u8> = vec![255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255];
        let b64 = base64::engine::general_purpose::STANDARD.encode(&raw);
        let id = add_texture(&mut s, "deneme", 2, 2, &b64).unwrap();
        let img = Image::decode(&s.textures[0]).unwrap();
        assert_eq!(id, "tx1");
        let c = img.sample(0.25, 0.75); // sol üst piksel merkezi
        assert!(c[0] > 0.95 && c[1] < 0.05);
        assert!((img.mean[0] - 0.5).abs() < 0.01);
        assert!(add_texture(&mut s, "x", 2, 2, "!!").is_err());
        assert!(add_texture(&mut s, "x", 1000, 2, &b64).is_err());
        assert_eq!(planar([1.0, 2.0, 3.0], [0.0, 1.0, 0.0]), (1.0, 3.0));
        assert_eq!(planar([1.0, 2.0, 3.0], [1.0, 0.0, 0.0]), (3.0, 2.0));
    }
}
