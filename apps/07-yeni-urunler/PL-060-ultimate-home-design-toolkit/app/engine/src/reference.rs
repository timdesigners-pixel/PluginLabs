//! Görselden referans: renk paleti, parlaklık/sıcaklık, gökyüzü ve pozlama önerisi,
//! en yakın kaplamalar ve kütüphanedeki en yakın ürünler.
//!
//! Tümü yerelde, küçültülmüş görsel (en çok 128 × 128) üzerinde klasik görüntü
//! istatistikleriyle yapılır; görsel hiçbir yere gönderilmez. Ürün eşleştirme renk ve
//! oran tabanlı bir ön eşleştirmedir (öğrenilmiş gömme modeli kullanmaz).

use crate::catalog;
use crate::model::Scene;
use crate::render::SkySettings;
use serde::Serialize;

type C = [f32; 3];

#[derive(Debug, Clone, Serialize)]
pub struct Swatch {
    pub color: C,
    pub share: f32,
}

#[derive(Debug, Clone, Serialize)]
pub struct Match {
    pub id: String,
    pub name: String,
    pub group: String,
    /// 0–1, yüksek = daha yakın.
    pub score: f32,
}

#[derive(Debug, Clone, Serialize)]
pub struct Reference {
    pub palette: Vec<Swatch>,
    pub brightness: f32,
    /// Pozitif = sıcak (kırmızı ağırlıklı), negatif = soğuk.
    pub warmth: f32,
    pub saturation: f32,
    /// ic | dis-gunduz | gun-batimi | gece
    pub lighting: String,
    pub sky: SkySettings,
    pub exposure: f32,
    pub interior: Option<String>,
    pub floor: Option<String>,
    pub facade: Option<String>,
    /// Ufuk çizgisinin tahmini konumu (0 = üst, 1 = alt) ve önerilen kamera.
    pub horizon: f32,
    pub camera: String,
    pub fov: f32,
    pub matches: Vec<Match>,
}

fn dist(a: C, b: C) -> f32 {
    // parlaklığa daha az, renk tonuna daha çok duyarlı
    let (dr, dg, db) = (a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    (2.0 * dr * dr + 4.0 * dg * dg + 3.0 * db * db).sqrt() / 3.0
}
fn luma(c: C) -> f32 {
    0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
fn mean(px: &[C]) -> C {
    if px.is_empty() {
        return [0.5; 3];
    }
    let s = px.iter().fold([0.0f32; 3], |a, c| [a[0] + c[0], a[1] + c[1], a[2] + c[2]]);
    let n = px.len() as f32;
    [s[0] / n, s[1] / n, s[2] / n]
}

fn kmeans(px: &[C], k: usize) -> Vec<Swatch> {
    let mut sorted: Vec<C> = px.to_vec();
    sorted.sort_by(|a, b| luma(*a).partial_cmp(&luma(*b)).unwrap());
    let mut cen: Vec<C> = (0..k).map(|i| sorted[(i * 2 + 1) * sorted.len() / (2 * k)]).collect();
    let mut counts = vec![0usize; k];
    for _ in 0..10 {
        let mut sum = vec![[0.0f32; 3]; k];
        counts = vec![0; k];
        for p in px {
            let j = (0..k).min_by(|&a, &b| dist(*p, cen[a]).partial_cmp(&dist(*p, cen[b])).unwrap()).unwrap();
            for c in 0..3 {
                sum[j][c] += p[c];
            }
            counts[j] += 1;
        }
        for j in 0..k {
            if counts[j] > 0 {
                cen[j] = [sum[j][0] / counts[j] as f32, sum[j][1] / counts[j] as f32, sum[j][2] / counts[j] as f32];
            }
        }
    }
    let mut out: Vec<Swatch> = (0..k).filter(|&j| counts[j] > 0).map(|j| Swatch { color: cen[j].map(|v| (v * 1000.0).round() / 1000.0), share: counts[j] as f32 / px.len() as f32 }).collect();
    out.sort_by(|a, b| b.share.partial_cmp(&a.share).unwrap());
    out
}

fn nearest(scene: &Scene, cats: &[&str], c: C) -> Option<String> {
    scene.materials.iter().filter(|m| cats.contains(&m.category.as_str())).min_by(|a, b| dist(a.color, c).partial_cmp(&dist(b.color, c)).unwrap()).map(|m| m.id.clone())
}

/// `rgb`: satır satır RGB baytları (genişlik × yükseklik × 3).
pub fn analyze(scene: &Scene, width: usize, height: usize, rgb: &[u8]) -> Result<Reference, String> {
    if !(4..=128).contains(&width) || !(4..=128).contains(&height) || rgb.len() != width * height * 3 {
        return Err("Görsel örneği 4–128 piksel kenarlı RGB olmalı".into());
    }
    let px: Vec<C> = rgb.chunks(3).map(|p| [p[0] as f32 / 255.0, p[1] as f32 / 255.0, p[2] as f32 / 255.0]).collect();
    let row = |y: usize| &px[y * width..(y + 1) * width];
    let band = |y0: usize, y1: usize| -> Vec<C> { (y0..y1).flat_map(|y| row(y).iter().copied()).collect() };
    let all = mean(&px);
    let top = mean(&band(0, height / 3));
    let bottom = mean(&band(height * 2 / 3, height));
    let brightness = luma(all);
    let warmth = all[0] - all[2];
    let saturation = px.iter().map(|c| c.iter().cloned().fold(0.0, f32::max) - c.iter().cloned().fold(1.0, f32::min)).sum::<f32>() / px.len() as f32;
    // ufuk: orta bantta satır parlaklığının en çok değiştiği yer
    let rows: Vec<f32> = (0..height).map(|y| luma(mean(row(y)))).collect();
    let mut horizon = 0.5;
    let mut best = 0.0;
    for y in height / 6..height * 5 / 6 {
        let d = (rows[y] - rows[y - 1]).abs() + (rows[(y + 1).min(height - 1)] - rows[y]).abs() * 0.5;
        if d > best {
            best = d;
            horizon = y as f32 / height as f32;
        }
    }
    let blue_top = top[2] > top[0] + 0.06 && luma(top) > 0.45;
    let warm_top = top[0] > top[2] + 0.12 && luma(top) > 0.3;
    let (lighting, sky) = if brightness < 0.2 {
        ("gece", SkySettings { hour: 22.0, ..Default::default() })
    } else if warm_top && brightness < 0.62 {
        ("gun-batimi", SkySettings { hour: 19.4, haze: 0.3, ..Default::default() })
    } else if blue_top {
        ("dis-gunduz", SkySettings { hour: 13.0, cloud: (0.35 - saturation).clamp(0.0, 0.6), ..Default::default() })
    } else {
        // iç mekân ya da kapalı hava: parlaklıktan saat, doygunluktan bulut
        ("ic", SkySettings { hour: (9.0 + brightness * 6.0).clamp(8.0, 16.0), cloud: (0.5 - saturation * 1.5).clamp(0.0, 0.8), ..Default::default() })
    };
    let outdoor = lighting != "ic";
    let (camera, fov) = if !outdoor { ("ic", 68.0) } else if horizon < 0.35 { ("kusbakisi", 40.0) } else { ("perspektif", 45.0) };
    // ürün eşleştirme: kenar rengine (arka plan) benzemeyen piksellerin kutusu ve rengi
    let mut border: Vec<C> = vec![];
    for y in 0..height {
        for x in 0..width {
            if x == 0 || y == 0 || x == width - 1 || y == height - 1 {
                border.push(px[y * width + x]);
            }
        }
    }
    let bg = mean(&border);
    let (mut x0, mut y0, mut x1, mut y1) = (width, height, 0usize, 0usize);
    let mut obj: Vec<C> = vec![];
    for y in 0..height {
        for x in 0..width {
            let c = px[y * width + x];
            if dist(c, bg) > 0.11 {
                obj.push(c);
                x0 = x0.min(x);
                y0 = y0.min(y);
                x1 = x1.max(x);
                y1 = y1.max(y);
            }
        }
    }
    let matches = if obj.len() * 25 > px.len() && x1 > x0 && y1 > y0 {
        let oc = mean(&obj);
        // arayüz görseli en-boy oranını koruyarak küçültür
        let aspect = (x1 - x0 + 1) as f32 / (y1 - y0 + 1) as f32;
        let mut m: Vec<Match> = catalog::items()
            .iter()
            .map(|it| {
                // parça hacmiyle ağırlıklı ortalama renk
                let (mut col, mut wsum) = ([0.0f32; 3], 0.0f32);
                for p in catalog::parts(it.id) {
                    let v = ((p.max[0] - p.min[0]) * (p.max[1] - p.min[1]) * (p.max[2] - p.min[2])).max(1.0) as f32;
                    let mc = scene.material(p.material).map(|m| m.color).unwrap_or([0.7; 3]);
                    for k in 0..3 {
                        col[k] += mc[k] * v;
                    }
                    wsum += v;
                }
                let col = col.map(|v| v / wsum.max(1.0));
                let ia = (it.size[0] / it.size[2].max(1.0)) as f32;
                let ia2 = (it.size[1] / it.size[2].max(1.0)) as f32; // yandan görünüş
                let da = (aspect / ia).ln().abs().min((aspect / ia2).ln().abs());
                let d = dist(col, oc) * 1.4 + da * 0.35;
                Match { id: it.id.into(), name: it.name.into(), group: it.group.into(), score: ((1.0 - d).clamp(0.0, 1.0) * 100.0).round() / 100.0 }
            })
            .collect();
        m.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        m.truncate(6);
        m
    } else {
        vec![]
    };
    Ok(Reference {
        palette: kmeans(&px, 5),
        brightness: (brightness * 100.0).round() / 100.0,
        warmth: (warmth * 100.0).round() / 100.0,
        saturation: (saturation * 100.0).round() / 100.0,
        lighting: lighting.into(),
        sky,
        exposure: (0.62 * (brightness / 0.45).clamp(0.55, 1.9) * 100.0).round() / 100.0,
        interior: nearest(scene, &["ic-boya", "duvar"], if outdoor { all } else { top }),
        floor: nearest(scene, &["zemin"], bottom),
        facade: nearest(scene, &["cephe", "kabuk"], if outdoor { mean(&band(height / 3, height * 2 / 3)) } else { top }),
        horizon: (horizon * 100.0).round() / 100.0,
        camera: camera.into(),
        fov,
        matches,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn img(w: usize, h: usize, f: impl Fn(usize, usize) -> [u8; 3]) -> Vec<u8> {
        let mut out = Vec::with_capacity(w * h * 3);
        for y in 0..h {
            for x in 0..w {
                out.extend_from_slice(&f(x, y));
            }
        }
        out
    }

    #[test]
    fn outdoor_day_sunset_and_night_are_recognised() {
        let s = crate::templates::demo_scene();
        let day = analyze(&s, 32, 32, &img(32, 32, |_, y| if y < 14 { [120, 170, 240] } else { [90, 130, 70] })).unwrap();
        assert_eq!(day.lighting, "dis-gunduz");
        assert!((day.horizon - 0.44).abs() < 0.08, "ufuk {}", day.horizon);
        let sunset = analyze(&s, 32, 32, &img(32, 32, |_, y| if y < 16 { [230, 130, 70] } else { [60, 45, 40] })).unwrap();
        assert_eq!(sunset.lighting, "gun-batimi");
        assert!(sunset.warmth > 0.2);
        let night = analyze(&s, 32, 32, &img(32, 32, |_, _| [12, 14, 26])).unwrap();
        assert_eq!(night.lighting, "gece");
        assert!(night.exposure < day.exposure);
    }

    #[test]
    fn interior_palette_maps_to_nearest_materials() {
        let s = crate::templates::demo_scene();
        // adaçayı duvar, ceviz zemin
        let r = analyze(&s, 24, 24, &img(24, 24, |_, y| if y < 15 { [143, 163, 140] } else { [102, 69, 43] })).unwrap();
        assert_eq!(r.lighting, "ic");
        assert!(r.interior.as_deref().is_some_and(|m| m.ends_with("adacayi")), "{:?}", r.interior);
        assert_eq!(r.floor.as_deref(), Some("parke-ceviz"));
        assert_eq!(r.palette.len(), 2);
        assert!((r.palette.iter().map(|p| p.share).sum::<f32>() - 1.0).abs() < 1e-4);
    }

    #[test]
    fn object_on_plain_background_matches_similar_furniture() {
        let s = crate::templates::demo_scene();
        // beyaz zeminde geniş, alçak, lacivert bir nesne
        let r = analyze(&s, 48, 48, &img(48, 48, |x, y| if (6..42).contains(&x) && (20..36).contains(&y) { [34, 48, 88] } else { [245, 245, 245] })).unwrap();
        assert!(!r.matches.is_empty());
        assert!(r.matches.windows(2).all(|w| w[0].score >= w[1].score));
        let ids: Vec<&str> = r.matches.iter().map(|m| m.id.as_str()).collect();
        assert!(ids.contains(&"puf") || ids.contains(&"berjer") || ids.contains(&"kanepe-3") || ids.contains(&"kanepe-2"), "{ids:?}");
        // düz renk görselde nesne yok
        assert!(analyze(&s, 16, 16, &img(16, 16, |_, _| [200, 200, 200])).unwrap().matches.is_empty());
        assert!(analyze(&s, 2, 2, &[0; 12]).is_err());
    }
}
