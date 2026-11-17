//! Mekân fotoğrafından oda ölçüsü: tek görüntü metrolojisi.
//!
//! Kullanıcı fotoğrafta arka duvarın dört köşesini ve yan duvarların zeminle birleştiği
//! çizgilerden birer noktayı işaretler. Birbirine dik üç doğrultunun kaçış noktalarından
//! odak uzaklığı ve kamera yönelimi bulunur; köşeler zemin ve duvar düzlemleriyle
//! kesiştirilerek genişlik, derinlik ve yükseklik oranları hesaplanır. Bilinen tek bir
//! uzunluk (tavan yüksekliği, genişlik ya da kamera yüksekliği) oranları milimetreye çevirir.
//!
//! Görüntü pikselleri motora gelmez; yalnız işaretlenen noktaların koordinatları gelir.

use serde::{Deserialize, Serialize};

type V3 = [f64; 3];

fn dot(a: V3, b: V3) -> f64 {
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}
fn cross(a: V3, b: V3) -> V3 {
    [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}
fn sub(a: V3, b: V3) -> V3 {
    [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
fn add(a: V3, b: V3) -> V3 {
    [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}
fn mul(a: V3, s: f64) -> V3 {
    [a[0] * s, a[1] * s, a[2] * s]
}
fn len(a: V3) -> f64 {
    dot(a, a).sqrt()
}
fn unit(a: V3) -> V3 {
    let l = len(a);
    if l < 1e-12 { a } else { mul(a, 1.0 / l) }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct Reference {
    /// yukseklik (tavan), genislik (arka duvar), kamera (objektifin zeminden yüksekliği), derinlik (görünen yan duvar boyu)
    pub kind: String,
    pub mm: f64,
}
impl Default for Reference {
    fn default() -> Self {
        Reference { kind: "yukseklik".into(), mm: 2650.0 }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct PhotoOpening {
    /// arka, sol, sag
    pub wall: String,
    /// door, window
    pub kind: String,
    pub a: [f64; 2],
    pub b: [f64; 2],
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct PhotoInput {
    /// Görüntü boyutu (piksel).
    pub width: f64,
    pub height: f64,
    /// Arka duvar köşeleri: zemin-sol, zemin-sağ, tavan-sağ, tavan-sol.
    pub bl: [f64; 2],
    pub br: [f64; 2],
    pub tr: [f64; 2],
    pub tl: [f64; 2],
    /// Sol ve sağ duvarın zeminle birleştiği çizgide, kameraya yakın birer nokta.
    pub left: Option<[f64; 2]>,
    pub right: Option<[f64; 2]>,
    /// Yatay görüş açısı (derece). Verilirse kaçış noktası hesabının yerine geçer.
    pub fov: Option<f64>,
    pub reference: Reference,
    pub openings: Vec<PhotoOpening>,
    /// İşaretleme hatası varsayımı (piksel); tolerans hesabında kullanılır.
    pub pixel_error: f64,
}
impl Default for PhotoInput {
    fn default() -> Self {
        PhotoInput { width: 0.0, height: 0.0, bl: [0.0; 2], br: [0.0; 2], tr: [0.0; 2], tl: [0.0; 2], left: None, right: None, fov: None, reference: Reference::default(), openings: vec![], pixel_error: 2.0 }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct FitOpening {
    pub wall: String,
    pub kind: String,
    /// arka: sol duvardan; sol/sag: arka duvardan uzaklık (mm).
    pub offset: f64,
    pub width: f64,
    pub sill: f64,
    pub height: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct FitCamera {
    /// Sol duvardan, arka duvardan ve zeminden uzaklık (mm).
    pub x: f64,
    pub back: f64,
    pub height: f64,
    /// Bakış yönü: (sağa, yukarı, arka duvara doğru).
    pub dir: [f64; 3],
    /// Dikey görüş açısı (derece).
    pub fov: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct Tolerance {
    pub width: f64,
    pub depth: f64,
    pub height: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct PhotoFit {
    pub width: f64,
    /// Önerilen oda derinliği: görünen derinlik ile kameranın arka duvara uzaklığının büyüğü.
    pub depth: f64,
    /// Fotoğrafta işaretlenen yan duvar noktalarına kadar ölçülen derinlik.
    pub depth_visible: f64,
    pub height: f64,
    pub focal_px: f64,
    pub fov_h: f64,
    pub focal_35: f64,
    /// kacis-noktalari, kullanici, varsayilan
    pub focal_source: String,
    pub camera: FitCamera,
    /// 0–1: zemin ve duvar düzlemlerinden gelen iki ayrı hesabın birbirini tutma oranı.
    pub consistency: f64,
    pub tolerance: Tolerance,
    pub ratio_width_height: f64,
    pub ratio_depth_width: f64,
    pub openings: Vec<FitOpening>,
    /// Hesaplanan kutunun fotoğraf üzerine geri izdüşümü (piksel çizgileri).
    pub outline: Vec<[[f64; 2]; 2]>,
    pub notes: Vec<String>,
}

struct Raw {
    f: f64,
    source: &'static str,
    x: V3,
    y: V3,
    z: V3,
    p_bl: V3,
    p_br: V3,
    w: f64,
    h: f64,
    d_vis: f64,
    d_cam: f64,
    cam_h: f64,
    cons: f64,
}

/// Kaçış noktası: iki doğrunun kesişimi (homojen, birim boy).
fn vanish(a0: V3, a1: V3, b0: V3, b1: V3) -> V3 {
    unit(cross(cross(a0, a1), cross(b0, b1)))
}

fn solve(inp: &PhotoInput) -> Result<Raw, String> {
    if inp.width < 16.0 || inp.height < 16.0 {
        return Err("@photo_no_size".into());
    }
    // merkezlenmiş ve görüntü genişliğine bölünmüş koordinatlar (sayısal kararlılık)
    let s = inp.width;
    let c = [inp.width / 2.0, inp.height / 2.0];
    let h = |p: [f64; 2]| -> V3 { [(p[0] - c[0]) / s, (p[1] - c[1]) / s, 1.0] };
    let (bl, br, tr, tl) = (h(inp.bl), h(inp.br), h(inp.tr), h(inp.tl));
    if len(sub(bl, br)) < 0.02 || len(sub(bl, tl)) < 0.02 || len(sub(br, tr)) < 0.02 {
        return Err("@photo_corners_close".into());
    }
    let vx = vanish(bl, br, tl, tr);
    let vy = vanish(bl, tl, br, tr);
    let vz = match (inp.left, inp.right) {
        (Some(l), Some(r)) if len(sub(h(l), bl)) > 0.02 && len(sub(h(r), br)) > 0.02 => Some(vanish(bl, h(l), br, h(r))),
        _ => None,
    };
    // odak: dik doğrultu çiftlerinin kaçış noktaları  f² = −(x₁x₂ + y₁y₂) / (w₁w₂)
    let mut cand = vec![];
    let mut pair = |u: V3, v: V3| {
        if u[2].abs() > 0.033 && v[2].abs() > 0.033 {
            let f2 = -(u[0] * v[0] + u[1] * v[1]) / (u[2] * v[2]);
            if f2 > 0.0 {
                let f = f2.sqrt();
                if (0.25..=6.0).contains(&f) {
                    cand.push(f);
                }
            }
        }
    };
    if let Some(z) = vz {
        pair(vx, z);
        pair(vy, z);
    }
    pair(vx, vy);
    cand.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let (f, source) = match inp.fov {
        Some(fov) if (15.0..=150.0).contains(&fov) => (0.5 / (fov.to_radians() / 2.0).tan(), "kullanici"),
        _ if !cand.is_empty() => (cand[cand.len() / 2], "kacis-noktalari"),
        // telefon ana kamerası: yaklaşık 26 mm eşdeğeri, yatay 69°
        _ => (0.5 / (69.0f64.to_radians() / 2.0).tan(), "varsayilan"),
    };
    let dir = |v: V3| unit([v[0], v[1], v[2] * f]);
    let ray = |p: V3| -> V3 { [p[0], p[1], f] };
    // düşey: aşağı bakan; derinlik: kameradan uzağa
    let mut y = dir(vy);
    if y[1] < 0.0 {
        y = mul(y, -1.0);
    }
    let (x, z) = match vz {
        Some(vz) => {
            let dz = dir(vz);
            let mut z = unit(sub(dz, mul(y, dot(dz, y))));
            if z[2] < 0.0 {
                z = mul(z, -1.0);
            }
            (cross(y, z), z)
        }
        None => {
            let dx = dir(vx);
            let x = unit(sub(dx, mul(y, dot(dx, y))));
            let mut z = cross(x, y);
            if z[2] < 0.0 {
                z = mul(z, -1.0);
            }
            (cross(y, z), z)
        }
    };
    let mut x = unit(x);
    let p_bl = ray(bl);
    let cam_h = dot(y, p_bl);
    let den = dot(y, ray(br));
    if cam_h <= 1e-6 || den <= 1e-6 {
        return Err("@photo_floor_above_horizon".into());
    }
    let p_br = mul(ray(br), cam_h / den);
    let mut w = dot(x, sub(p_br, p_bl));
    if w < 0.0 {
        x = mul(x, -1.0);
        w = -w;
    }
    let d_cam = dot(z, p_bl);
    let d_cam_r = dot(z, p_br);
    if d_cam <= 1e-6 || d_cam_r <= 1e-6 || w < 1e-6 {
        return Err("@photo_wall_behind".into());
    }
    let top = |p: V3, base: V3, d: f64| -> Result<f64, String> {
        let k = dot(z, ray(p));
        if k <= 1e-6 {
            return Err("@photo_ceiling_failed".into());
        }
        Ok(dot(y, sub(base, mul(ray(p), d / k))))
    };
    let (hl, hr) = (top(tl, p_bl, d_cam)?, top(tr, p_br, d_cam_r)?);
    let hh = (hl + hr) / 2.0;
    if hh <= 1e-6 {
        return Err("@photo_ceiling_below".into());
    }
    let mut d_vis: f64 = 0.0;
    for (p, base) in [(inp.left, p_bl), (inp.right, p_br)] {
        if let Some(p) = p {
            let r = ray(h(p));
            let k = dot(y, r);
            if k > 1e-6 {
                d_vis = d_vis.max(dot(z, sub(base, mul(r, cam_h / k))));
            }
        }
    }
    let cons = (1.0 - (d_cam_r - d_cam).abs() / w.max(1e-9) - (hl - hr).abs() / hh).clamp(0.0, 1.0);
    Ok(Raw { f, source, x, y, z, p_bl, p_br, w, h: hh, d_vis, d_cam, cam_h, cons })
}

fn scale_of(r: &Raw, reference: &Reference) -> Result<f64, String> {
    let base = match reference.kind.as_str() {
        "genislik" => r.w,
        "kamera" => r.cam_h,
        "derinlik" => r.d_vis,
        _ => r.h,
    };
    if base <= 1e-9 || !(reference.mm > 0.0) {
        return Err("@photo_reference_failed".into());
    }
    Ok(reference.mm / base)
}

fn dims(r: &Raw, reference: &Reference) -> Result<(f64, f64, f64, f64), String> {
    let k = scale_of(r, reference)?;
    let d_vis = r.d_vis * k;
    let inside = {
        let cx = -dot(r.x, r.p_bl);
        cx > 0.0 && cx < r.w
    };
    // kamera odanın içindeyse oda en az kameranın durduğu yere kadar uzanır
    let depth = if inside { d_vis.max(r.d_cam * k + 300.0) } else { d_vis.max(1000.0) };
    Ok((r.w * k, depth, r.h * k, d_vis))
}

pub fn fit(inp: &PhotoInput) -> Result<PhotoFit, String> {
    let r = solve(inp)?;
    let k = scale_of(&r, &inp.reference)?;
    let (w, depth, hh, d_vis) = dims(&r, &inp.reference)?;
    let s = inp.width;
    let c = [inp.width / 2.0, inp.height / 2.0];
    let hpt = |p: [f64; 2]| -> V3 { [(p[0] - c[0]) / s, (p[1] - c[1]) / s, r.f] };

    // açıklıklar: işaretlenen iki nokta ilgili duvar düzlemiyle kesiştirilir
    let mut notes = vec![];
    let mut openings = vec![];
    for o in &inp.openings {
        let hit = |p: [f64; 2]| -> Option<(f64, f64)> {
            let ray = hpt(p);
            let q = match o.wall.as_str() {
                "sol" => mul(ray, dot(r.x, r.p_bl) / dot(r.x, ray)),
                "sag" => mul(ray, dot(r.x, r.p_br) / dot(r.x, ray)),
                _ => mul(ray, r.d_cam / dot(r.z, ray)),
            };
            if !q[2].is_finite() || q[2] <= 0.0 {
                return None;
            }
            let along = match o.wall.as_str() {
                "sol" | "sag" => dot(r.z, sub(r.p_bl, q)),
                _ => dot(r.x, sub(q, r.p_bl)),
            };
            Some((along * k, dot(r.y, sub(r.p_bl, q)) * k))
        };
        match (hit(o.a), hit(o.b)) {
            (Some(a), Some(b)) => {
                let door = o.kind != "window";
                let (u0, u1) = (a.0.min(b.0), a.0.max(b.0));
                let (v0, v1) = (a.1.min(b.1), a.1.max(b.1));
                let sill = if door { 0.0 } else { v0.max(0.0) };
                let round = |v: f64| (v / 10.0).round() * 10.0;
                let fo = FitOpening { wall: if o.wall.is_empty() { "arka".into() } else { o.wall.clone() }, kind: if door { "door".into() } else { "window".into() }, offset: round(u0), width: round(u1 - u0), sill: round(sill), height: round(v1 - sill) };
                if fo.width >= 300.0 && fo.height >= 300.0 {
                    openings.push(fo);
                } else {
                    notes.push("@photo_opening_small".into());
                }
            }
            _ => notes.push("@photo_opening_off_wall".into()),
        }
    }

    // tolerans: her nokta ±piksel hatası kadar oynatılır, ölçülerdeki en büyük sapma alınır
    let e = inp.pixel_error.clamp(0.25, 20.0);
    let mut tol = Tolerance::default();
    let mut vary = |q: &PhotoInput| {
        if let Ok(rr) = solve(q) {
            if let Ok((ww, dd, h2, _)) = dims(&rr, &inp.reference) {
                tol.width = tol.width.max((ww - w).abs());
                tol.depth = tol.depth.max((dd - depth).abs());
                tol.height = tol.height.max((h2 - hh).abs());
            }
        }
    };
    for which in 0..6 {
        for (dx, dy) in [(e, 0.0), (-e, 0.0), (0.0, e), (0.0, -e)] {
            let mut q = inp.clone();
            let p = match which {
                0 => Some(&mut q.bl),
                1 => Some(&mut q.br),
                2 => Some(&mut q.tr),
                3 => Some(&mut q.tl),
                4 => q.left.as_mut(),
                _ => q.right.as_mut(),
            };
            if let Some(p) = p {
                p[0] += dx;
                p[1] += dy;
                vary(&q);
            }
        }
    }

    // kutunun geri izdüşümü
    let world = |xx: f64, up: f64, back: f64| -> V3 { add(add(add(r.p_bl, mul(r.x, xx / k)), mul(r.y, -up / k)), mul(r.z, -back / k)) };
    let corners: Vec<V3> = [(0.0, 0.0, 0.0), (w, 0.0, 0.0), (w, hh, 0.0), (0.0, hh, 0.0), (0.0, 0.0, depth), (w, 0.0, depth), (w, hh, depth), (0.0, hh, depth)].iter().map(|&(a, b, d)| world(a, b, d)).collect();
    let edges = [(0, 1), (1, 2), (2, 3), (3, 0), (4, 5), (5, 6), (6, 7), (7, 4), (0, 4), (1, 5), (2, 6), (3, 7)];
    let near = r.f * 0.08;
    let mut outline = vec![];
    for (a, b) in edges {
        let (mut p, mut q) = (corners[a], corners[b]);
        if p[2] < near && q[2] < near {
            continue;
        }
        if p[2] < near {
            let t = (near - p[2]) / (q[2] - p[2]);
            p = add(p, mul(sub(q, p), t));
        }
        if q[2] < near {
            let t = (near - q[2]) / (p[2] - q[2]);
            q = add(q, mul(sub(p, q), t));
        }
        let px = |v: V3| [v[0] / v[2] * r.f * s + c[0], v[1] / v[2] * r.f * s + c[1]];
        outline.push([px(p), px(q)]);
    }

    match r.source {
        "varsayilan" => notes.push("@photo_focal_assumed".into()),
        "kullanici" => {}
        _ => {}
    }
    if inp.left.is_none() || inp.right.is_none() {
        notes.push("@photo_no_side_points".into());
    }
    if r.cons < 0.9 {
        notes.push("@photo_not_rectangular".into());
    }
    let cam_x = -dot(r.x, r.p_bl) * k;
    if cam_x < 0.0 || cam_x > w {
        notes.push("@photo_camera_outside".into());
    }
    let fov_h = 2.0 * (0.5 / r.f).atan().to_degrees();
    let fov_v = 2.0 * ((inp.height / inp.width) * 0.5 / r.f).atan().to_degrees();
    Ok(PhotoFit {
        width: w.round(),
        depth: depth.round(),
        depth_visible: d_vis.round(),
        height: hh.round(),
        focal_px: r.f * s,
        fov_h,
        focal_35: 18.0 / (fov_h.to_radians() / 2.0).tan(),
        focal_source: r.source.into(),
        camera: FitCamera { x: cam_x, back: r.d_cam * k, height: r.cam_h * k, dir: [r.x[2], -r.y[2], r.z[2]], fov: fov_v },
        consistency: r.cons,
        tolerance: Tolerance { width: tol.width.round(), depth: tol.depth.round(), height: tol.height.round() },
        ratio_width_height: w / hh,
        ratio_depth_width: depth / w,
        openings,
        outline,
        notes,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Bilinen bir odayı bilinen bir kamerayla görüntüye düşürür.
    struct Cam {
        pos: V3,
        right: V3,
        up: V3,
        fwd: V3,
        f: f64,
        w: f64,
        h: f64,
    }
    impl Cam {
        /// Oda eksenleri: X sağa, Y yukarı, Z arka duvara doğru. `yaw` sağa, `pitch` yukarı (derece).
        fn new(pos: V3, yaw: f64, pitch: f64, fov_h: f64, w: f64, h: f64) -> Cam {
            let (ya, pa) = (yaw.to_radians(), pitch.to_radians());
            let fwd = [ya.sin() * pa.cos(), pa.sin(), ya.cos() * pa.cos()];
            let right = unit(cross([0.0, 1.0, 0.0], fwd));
            let up = cross(fwd, right);
            Cam { pos, right, up, fwd, f: w / 2.0 / (fov_h.to_radians() / 2.0).tan(), w, h }
        }
        fn px(&self, p: V3) -> [f64; 2] {
            let d = sub(p, self.pos);
            let z = dot(d, self.fwd);
            [self.w / 2.0 + self.f * dot(d, self.right) / z, self.h / 2.0 - self.f * dot(d, self.up) / z]
        }
    }

    fn input(cam: &Cam, w: f64, h: f64, back: f64, sl: f64, sr: f64) -> PhotoInput {
        PhotoInput {
            width: cam.w,
            height: cam.h,
            bl: cam.px([0.0, 0.0, back]),
            br: cam.px([w, 0.0, back]),
            tr: cam.px([w, h, back]),
            tl: cam.px([0.0, h, back]),
            left: Some(cam.px([0.0, 0.0, back - sl])),
            right: Some(cam.px([w, 0.0, back - sr])),
            ..Default::default()
        }
    }

    #[test]
    fn recovers_room_from_oblique_photo() {
        // 4,2 × 5,0 × 2,7 m oda; kamera sol duvardan 1,5 m, arka duvardan 3,8 m, 1,4 m yüksekte
        let cam = Cam::new([1500.0, 1400.0, 0.0], 17.0, -6.0, 66.0, 4000.0, 3000.0);
        let mut inp = input(&cam, 4200.0, 2700.0, 3800.0, 2600.0, 1900.0);
        inp.reference = Reference { kind: "yukseklik".into(), mm: 2700.0 };
        let f = fit(&inp).unwrap();
        assert_eq!(f.focal_source, "kacis-noktalari");
        assert!((f.width - 4200.0).abs() < 15.0, "genişlik {}", f.width);
        assert!((f.height - 2700.0).abs() < 2.0);
        assert!((f.depth_visible - 2600.0).abs() < 15.0, "görünen derinlik {}", f.depth_visible);
        assert!((f.depth - 4100.0).abs() < 20.0, "derinlik {}", f.depth);
        assert!((f.fov_h - 66.0).abs() < 0.5, "görüş açısı {}", f.fov_h);
        assert!((f.camera.x - 1500.0).abs() < 15.0 && (f.camera.back - 3800.0).abs() < 15.0 && (f.camera.height - 1400.0).abs() < 10.0);
        assert!(f.consistency > 0.99);
        assert!((f.ratio_width_height - 4200.0 / 2700.0).abs() < 0.01);
        // geri izdüşüm işaretlenen köşelerden geçer
        let near = |p: [f64; 2]| f.outline.iter().any(|e| e.iter().any(|q| (q[0] - p[0]).hypot(q[1] - p[1]) < 3.0));
        assert!(near(inp.bl) && near(inp.br) && near(inp.tr) && near(inp.tl));
        assert!(f.tolerance.width > 0.0 && f.tolerance.width < 150.0);
    }

    #[test]
    fn other_references_give_the_same_room() {
        let cam = Cam::new([2600.0, 1550.0, 0.0], -22.0, -3.0, 74.0, 4032.0, 3024.0);
        let mut inp = input(&cam, 3600.0, 2850.0, 4400.0, 3000.0, 3400.0);
        inp.reference = Reference { kind: "genislik".into(), mm: 3600.0 };
        let a = fit(&inp).unwrap();
        assert!((a.height - 2850.0).abs() < 15.0, "yükseklik {}", a.height);
        inp.reference = Reference { kind: "kamera".into(), mm: 1550.0 };
        let b = fit(&inp).unwrap();
        assert!((b.width - 3600.0).abs() < 20.0 && (b.height - 2850.0).abs() < 15.0);
    }

    #[test]
    fn frontal_photo_needs_field_of_view_and_says_so() {
        // tam karşıdan, eğimsiz çekim: kaçış noktaları sonsuzda, odak bulunamaz
        let cam = Cam::new([2000.0, 1400.0, 0.0], 0.0, 0.0, 69.0, 4000.0, 3000.0);
        let mut inp = input(&cam, 4000.0, 2600.0, 3500.0, 2000.0, 2000.0);
        inp.reference = Reference { kind: "yukseklik".into(), mm: 2600.0 };
        let f = fit(&inp).unwrap();
        assert_eq!(f.focal_source, "varsayilan");
        assert!(f.notes.iter().any(|n| n == "@photo_focal_assumed"));
        // genişlik/yükseklik oranı odaktan bağımsızdır
        assert!((f.width - 4000.0).abs() < 5.0);
        inp.fov = Some(69.0);
        let g = fit(&inp).unwrap();
        assert_eq!(g.focal_source, "kullanici");
        assert!((g.depth_visible - 2000.0).abs() < 10.0 && (g.camera.back - 3500.0).abs() < 10.0);
    }

    #[test]
    fn openings_are_measured_on_their_walls() {
        let cam = Cam::new([1800.0, 1450.0, 0.0], 12.0, -4.0, 68.0, 4000.0, 3000.0);
        let mut inp = input(&cam, 4500.0, 2700.0, 4000.0, 2500.0, 2500.0);
        inp.reference = Reference { kind: "yukseklik".into(), mm: 2700.0 };
        // arka duvarda pencere: soldan 1,2 m, 1,6 × 1,3 m, denizlik 0,9 m
        inp.openings.push(PhotoOpening { wall: "arka".into(), kind: "window".into(), a: cam.px([1200.0, 900.0, 4000.0]), b: cam.px([2800.0, 2200.0, 4000.0]) });
        // sağ duvarda kapı: arka duvardan 0,6 m, 0,9 × 2,1 m
        inp.openings.push(PhotoOpening { wall: "sag".into(), kind: "door".into(), a: cam.px([4500.0, 0.0, 3400.0]), b: cam.px([4500.0, 2100.0, 2500.0]) });
        let f = fit(&inp).unwrap();
        assert_eq!(f.openings.len(), 2);
        let w = &f.openings[0];
        assert!((w.offset - 1200.0).abs() < 15.0 && (w.width - 1600.0).abs() < 15.0 && (w.sill - 900.0).abs() < 15.0 && (w.height - 1300.0).abs() < 15.0, "{w:?}");
        let d = &f.openings[1];
        assert!((d.offset - 600.0).abs() < 15.0 && (d.width - 900.0).abs() < 15.0 && d.sill == 0.0 && (d.height - 2100.0).abs() < 15.0, "{d:?}");
    }

    #[test]
    fn rejects_degenerate_marks() {
        let inp = PhotoInput { width: 1000.0, height: 800.0, bl: [100.0, 100.0], br: [101.0, 100.0], tr: [900.0, 100.0], tl: [100.0, 50.0], ..Default::default() };
        assert!(fit(&inp).is_err());
    }
}
