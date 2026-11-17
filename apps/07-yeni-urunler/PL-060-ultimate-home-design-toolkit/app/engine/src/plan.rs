//! İç plan araçları: 10 cm hassas, 90° hizalı bölme çizimi, tek tıkla mahal algılama,
//! standart kapı/pencere ölçüleri ve yerleşim doğrulaması.

use crate::geom::{self, P2};
use crate::model::{Level, Opening, OpeningKind, Room, Scene, Wall};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct StdOpening {
    pub id: &'static str,
    pub label: &'static str,
    pub kind: OpeningKind,
    pub width: f64,
    pub height: f64,
    pub sill: f64,
    /// Alt kot (parapet) değiştirilebilir mi?
    pub sill_editable: bool,
}

pub fn standard_openings() -> Vec<StdOpening> {
    let d = |id, label, w| StdOpening { id, label, kind: OpeningKind::Door, width: w, height: 2350.0, sill: 0.0, sill_editable: false };
    let p = |id, label, w, h, sill, e| StdOpening { id, label, kind: OpeningKind::Window, width: w, height: h, sill, sill_editable: e };
    vec![
        d("ic-kapi", "İç kapı 90×235", 900.0),
        d("dis-kapi", "Dış kapı 100×235", 1000.0),
        d("banyo-kapi", "Banyo kapısı 80×235", 800.0),
        d("cift-kapi", "Çift kanat kapı 140×235", 1400.0),
        d("surgu-kapi", "Sürgü kapı 160×235", 1600.0),
        p("p100", "Pencere 100×235", 1000.0, 2350.0, 0.0, false),
        p("p200", "Pencere 200×235", 2000.0, 2350.0, 0.0, false),
        p("p250", "Pencere 250×235", 2500.0, 2350.0, 0.0, false),
        p("p400", "Pencere 400×235", 4000.0, 2350.0, 0.0, false),
        p("p600", "Pencere 600×235", 6000.0, 2350.0, 0.0, false),
        p("p140", "Pencere 140×140", 1400.0, 1400.0, 900.0, true),
        p("p70", "Pencere 70×70", 700.0, 700.0, 1500.0, true),
        p("p60-100", "Pencere 60×100", 600.0, 1000.0, 1200.0, true),
        p("p100-140", "Pencere 100×140", 1000.0, 1400.0, 900.0, true),
        p("p200-140", "Pencere 200×140", 2000.0, 1400.0, 900.0, true),
        p("p300-140", "Pencere 300×140", 3000.0, 1400.0, 900.0, true),
    ]
}

pub const ROOM_KINDS: [(&str, &str); 10] = [
    ("salon", "Salon"),
    ("mutfak", "Mutfak"),
    ("yatak", "Yatak odası"),
    ("banyo", "Banyo / WC"),
    ("giyinme", "Giyinme"),
    ("kiler", "Kiler"),
    ("calisma", "Çalışma"),
    ("camasir", "Çamaşır"),
    ("antre", "Antre / hol"),
    ("diger", "Diğer"),
];

/// Çizim noktasını 10 cm ızgaraya ve önceki noktaya göre 90°'ye hizalar.
pub fn snap_point(p: P2, from: Option<P2>, grid: f64) -> P2 {
    let g = grid.max(1.0);
    let mut q = [(p[0] / g).round() * g, (p[1] / g).round() * g];
    if let Some(a) = from {
        if (q[0] - a[0]).abs() >= (q[1] - a[1]).abs() {
            q[1] = a[1];
        } else {
            q[0] = a[0];
        }
    }
    q
}

/// Duvar yüzüne en yakın nokta: (duvar kimliği, a ucundan uzaklık, mesafe).
pub fn nearest_wall(level: &Level, p: P2) -> Option<(String, f64, f64)> {
    let mut best: Option<(String, f64, f64)> = None;
    for w in &level.walls {
        let d = geom::dist_to_segment(p, w.a, w.b);
        if best.as_ref().map_or(true, |b| d < b.2) {
            let ab = geom::sub(w.b, w.a);
            let l = w.length().max(1e-9);
            let t = ((p[0] - w.a[0]) * ab[0] + (p[1] - w.a[1]) * ab[1]) / l;
            best = Some((w.id.clone(), t.clamp(0.0, l), d));
        }
    }
    best
}

/// Açıklık yerleşimini doğrular; hata metni döner.
pub fn validate_opening(level: &Level, o: &Opening) -> Result<(), String> {
    let w = level.walls.iter().find(|w| w.id == o.wall).ok_or("@wall_not_found")?;
    if w.structural {
        return Err("@shear_wall_no_openings".into());
    }
    let len = w.length();
    if o.offset < -0.5 || o.offset + o.width > len + 0.5 {
        return Err(format!("@opening_too_wide|wall={:.2}|opening={:.2}", len / 1000.0, o.width / 1000.0));
    }
    if o.sill + o.height > level.height + 0.5 {
        return Err("@opening_too_tall".into());
    }
    for x in level.openings.iter().filter(|x| x.wall == o.wall && x.id != o.id) {
        if o.offset < x.offset + x.width - 0.5 && x.offset < o.offset + o.width - 0.5 {
            return Err(format!("@opening_overlap|id={}", x.id));
        }
    }
    Ok(())
}

/// Tıklanan noktaya en yakın uygun konuma açıklık yerleştirir.
pub fn place_opening(level: &Level, std_id: &str, p: P2, id: String) -> Result<Opening, String> {
    let s = standard_openings().into_iter().find(|s| s.id == std_id).ok_or("@unknown_opening")?;
    let (wid, t, d) = nearest_wall(level, p).ok_or("@no_walls")?;
    let w = level.walls.iter().find(|w| w.id == wid).unwrap();
    if d > w.thickness * 0.5 + 400.0 {
        return Err("@click_on_wall".into());
    }
    let len = w.length();
    let offset = ((t - s.width / 2.0) / 100.0).round() * 100.0;
    let offset = offset.clamp(0.0, (len - s.width).max(0.0));
    let o = Opening { id, wall: wid, kind: s.kind, offset, width: s.width, height: s.height, sill: s.sill, price: 0.0, swing: "sol-ice".into() };
    validate_opening(level, &o)?;
    Ok(o)
}

#[derive(Debug, Clone, Serialize)]
pub struct Detected {
    pub polygon: Vec<P2>,
    pub area_m2: f64,
    pub width_m: f64,
    pub depth_m: f64,
}

/// Duvarlarla çevrili kapalı alanı bulur (açıklıklar alanı açmaz). Izgara 5–10 mm.
pub fn detect_room(level: &Level, p: P2) -> Result<Detected, String> {
    if level.walls.is_empty() {
        return Err("@no_walls".into());
    }
    let mut pts = vec![];
    for w in &level.walls {
        pts.push(w.a);
        pts.push(w.b);
    }
    let (mut mn, mut mx) = geom::bbox(&pts);
    let pad = 400.0;
    mn = [mn[0] - pad, mn[1] - pad];
    mx = [mx[0] + pad, mx[1] + pad];
    let cell = {
        let span = (mx[0] - mn[0]).max(mx[1] - mn[1]);
        if span <= 16_000.0 {
            5.0
        } else if span <= 30_000.0 {
            10.0
        } else {
            (span / 3000.0).ceil()
        }
    };
    let nx = ((mx[0] - mn[0]) / cell).ceil() as usize;
    let ny = ((mx[1] - mn[1]) / cell).ceil() as usize;
    if nx * ny > 12_000_000 {
        return Err("@plan_too_large".into());
    }
    let mut grid = vec![0u8; nx * ny];
    for w in &level.walls {
        let len = w.length();
        if len < 1.0 {
            continue;
        }
        let d = [(w.b[0] - w.a[0]) / len, (w.b[1] - w.a[1]) / len];
        let n = [-d[1], d[0]];
        // bölmeler uçlarda yarım kalınlık uzatılır (birleşimlerde boşluk kalmasın)
        let ext = if w.generated { 0.0 } else { w.thickness / 2.0 };
        let ht = w.thickness / 2.0;
        let corners = [
            [w.a[0] - d[0] * ext + n[0] * ht, w.a[1] - d[1] * ext + n[1] * ht],
            [w.a[0] - d[0] * ext - n[0] * ht, w.a[1] - d[1] * ext - n[1] * ht],
            [w.b[0] + d[0] * ext + n[0] * ht, w.b[1] + d[1] * ext + n[1] * ht],
            [w.b[0] + d[0] * ext - n[0] * ht, w.b[1] + d[1] * ext - n[1] * ht],
        ];
        let (bmn, bmx) = geom::bbox(&corners);
        let i0 = (((bmn[0] - mn[0]) / cell).floor().max(0.0)) as usize;
        let i1 = (((bmx[0] - mn[0]) / cell).ceil() as usize).min(nx);
        let j0 = (((bmn[1] - mn[1]) / cell).floor().max(0.0)) as usize;
        let j1 = (((bmx[1] - mn[1]) / cell).ceil() as usize).min(ny);
        for j in j0..j1 {
            for i in i0..i1 {
                let c = [mn[0] + (i as f64 + 0.5) * cell, mn[1] + (j as f64 + 0.5) * cell];
                let r = [c[0] - w.a[0], c[1] - w.a[1]];
                let along = r[0] * d[0] + r[1] * d[1];
                let across = r[0] * n[0] + r[1] * n[1];
                if along > -ext - 1e-6 && along < len + ext + 1e-6 && across.abs() < ht {
                    grid[j * nx + i] = 1;
                }
            }
        }
    }
    let si = ((p[0] - mn[0]) / cell).floor();
    let sj = ((p[1] - mn[1]) / cell).floor();
    if si < 0.0 || sj < 0.0 || si as usize >= nx || sj as usize >= ny {
        return Err("@point_outside".into());
    }
    let start = sj as usize * nx + si as usize;
    if grid[start] == 1 {
        return Err("@clicked_on_wall".into());
    }
    let mut stack = vec![start];
    grid[start] = 2;
    let mut count = 0usize;
    while let Some(k) = stack.pop() {
        count += 1;
        let (i, j) = (k % nx, k / nx);
        if i == 0 || j == 0 || i == nx - 1 || j == ny - 1 {
            return Err("@area_not_closed".into());
        }
        for nk in [k - 1, k + 1, k - nx, k + nx] {
            if grid[nk] == 0 {
                grid[nk] = 2;
                stack.push(nk);
            }
        }
    }
    // sınır izleme: dolu hücrelerin dış kenarlarını saat yönü tersine zincirle
    use std::collections::HashMap;
    let mut next: HashMap<(usize, usize), Vec<(usize, usize)>> = HashMap::new();
    let filled = |i: usize, j: usize| grid[j * nx + i] == 2;
    for j in 1..ny - 1 {
        for i in 1..nx - 1 {
            if !filled(i, j) {
                continue;
            }
            if !filled(i, j - 1) {
                next.entry((i, j)).or_default().push((i + 1, j));
            }
            if !filled(i + 1, j) {
                next.entry((i + 1, j)).or_default().push((i + 1, j + 1));
            }
            if !filled(i, j + 1) {
                next.entry((i + 1, j + 1)).or_default().push((i, j + 1));
            }
            if !filled(i - 1, j) {
                next.entry((i, j + 1)).or_default().push((i, j));
            }
        }
    }
    let mut loops: Vec<Vec<(usize, usize)>> = vec![];
    while let Some((&s, _)) = next.iter().find(|(_, v)| !v.is_empty()) {
        let mut lp = vec![s];
        let mut cur = s;
        loop {
            let Some(v) = next.get_mut(&cur) else { break };
            let Some(n) = v.pop() else { break };
            if n == s {
                break;
            }
            lp.push(n);
            cur = n;
            if lp.len() > 4 * (nx + ny) * 4 {
                break;
            }
        }
        loops.push(lp);
    }
    let to_world = |v: &(usize, usize)| [mn[0] + v.0 as f64 * cell, mn[1] + v.1 as f64 * cell];
    let outer = loops
        .iter()
        .map(|l| l.iter().map(to_world).collect::<Vec<P2>>())
        .max_by(|a, b| geom::area(a).partial_cmp(&geom::area(b)).unwrap())
        .ok_or("@boundary_not_found")?;
    // doğrusal köşeleri sadeleştir
    let mut poly: Vec<P2> = vec![];
    let n = outer.len();
    for k in 0..n {
        let a = outer[(k + n - 1) % n];
        let b = outer[k];
        let c = outer[(k + 1) % n];
        let cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
        if cr.abs() > 1e-6 {
            poly.push([(b[0] * 10.0).round() / 10.0, (b[1] * 10.0).round() / 10.0]);
        }
    }
    let (bmn, bmx) = geom::bbox(&poly);
    Ok(Detected {
        area_m2: ((count as f64 * cell * cell / 1e6) * 100.0).round() / 100.0,
        width_m: ((bmx[0] - bmn[0]) / 10.0).round() / 100.0,
        depth_m: ((bmx[1] - bmn[1]) / 10.0).round() / 100.0,
        polygon: poly,
    })
}

/// Tıklanan kapalı alanı adlandırır; aynı alanda oda varsa türünü ve adını günceller.
pub fn name_room(scene: &mut Scene, level_id: &str, p: P2, kind: &str, name: Option<String>) -> Result<Room, String> {
    let label = ROOM_KINDS.iter().find(|k| k.0 == kind).map(|k| k.1).ok_or("@unknown_room_type")?;
    let level = scene.levels.iter_mut().find(|l| l.id == level_id).ok_or("@level_not_found")?;
    let det = detect_room(level, p)?;
    let floor = match kind {
        "banyo" | "camasir" => "seramik-gri",
        "mutfak" | "kiler" => "seramik-beyaz",
        _ => "parke-mese",
    };
    if let Some(r) = level.rooms.iter_mut().find(|r| geom::point_in_poly(p, &r.polygon)) {
        let same_kind = r.kind == kind;
        r.polygon = det.polygon;
        r.kind = kind.into();
        if let Some(n) = name {
            r.name = n;
        } else if !same_kind {
            r.name = label.into();
        }
        r.floor = floor.into();
        return Ok(r.clone());
    }
    let same = level.rooms.iter().filter(|r| r.kind == kind).count();
    let mut k = level.rooms.len() + 1;
    let id = loop {
        let cand = format!("{}-R{k}", level.id);
        if !level.rooms.iter().any(|r| r.id == cand) {
            break cand;
        }
        k += 1;
    };
    let r = Room { id, name: name.unwrap_or_else(|| if same > 0 { format!("{label} {}", same + 1) } else { label.into() }), kind: kind.into(), polygon: det.polygon, floor: floor.into(), ceiling_height: None };
    level.rooms.push(r.clone());
    Ok(r)
}

/// Odaların algılanmış çokgenlerini mevcut duvarlara göre yeniler (duvar değişince).
pub fn refresh_rooms(scene: &mut Scene) -> Vec<String> {
    let mut warn = vec![];
    for l in scene.levels.iter_mut() {
        let snapshot = l.clone();
        for r in l.rooms.iter_mut() {
            let probe = interior_point(&r.polygon);
            match detect_room(&snapshot, probe) {
                Ok(d) => r.polygon = d.polygon,
                Err(e) => warn.push(crate::msg::named(&r.name, &e)),
            }
        }
    }
    warn
}

/// Çokgenin içinde kalan bir nokta (iç bükey çokgenler için de).
pub fn interior_point(poly: &[P2]) -> P2 {
    let c = geom::centroid(poly);
    if geom::point_in_poly(c, poly) {
        return c;
    }
    for t in geom::triangulate(poly) {
        let (a, b, d) = (poly[t[0]], poly[t[1]], poly[t[2]]);
        let m = [(a[0] + b[0] + d[0]) / 3.0, (a[1] + b[1] + d[1]) / 3.0];
        if geom::area(&[a, b, d]) > 1e4 {
            return m;
        }
    }
    c
}

/// Yeni bölme duvarı (10 cm, 90° hizalı).
pub fn partition(scene: &Scene, a: P2, b: P2, id: String, thickness: Option<f64>) -> Result<Wall, String> {
    let a = snap_point(a, None, 100.0);
    let b = snap_point(b, Some(a), 100.0);
    if geom::dist(a, b) < 200.0 {
        return Err("@partition_too_short".into());
    }
    let t = thickness.filter(|t| t.is_finite()).map(|t| t.clamp(50.0, 400.0)).unwrap_or(scene.standard.partition);
    Ok(Wall { id, a, b, thickness: t, ..Default::default() })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::*;

    fn module_scene() -> Scene {
        let mut s = Scene::default();
        s.modules = vec![Module { id: "M1".into(), length: 10, ..Default::default() }];
        crate::modules::rebuild(&mut s);
        s
    }

    #[test]
    fn detects_net_area_of_single_module() {
        let s = module_scene();
        let d = detect_room(&s.levels[0], [5000.0, 2000.0]).unwrap();
        // 9,75 × 3,75 m net
        assert!((d.area_m2 - 36.56).abs() < 0.02, "{}", d.area_m2);
        assert_eq!((d.width_m, d.depth_m), (9.75, 3.75));
        assert_eq!(d.polygon.len(), 4);
    }

    #[test]
    fn partition_splits_rooms_and_doors_do_not_leak() {
        let mut s = module_scene();
        let w = partition(&s, [6000.0, 0.0], [6020.0, 4000.0], "B1".into(), None).unwrap();
        assert_eq!(w.b, [6000.0, 4000.0]);
        s.levels[0].walls.push(w);
        let o = place_opening(&s.levels[0], "ic-kapi", [6000.0, 2000.0], "K1".into()).unwrap();
        assert_eq!(o.wall, "B1");
        s.levels[0].openings.push(o);
        let left = detect_room(&s.levels[0], [3000.0, 2000.0]).unwrap();
        let right = detect_room(&s.levels[0], [8000.0, 2000.0]).unwrap();
        assert!((left.area_m2 - 5.825 * 3.75).abs() < 0.03, "{}", left.area_m2);
        assert!((right.area_m2 - 3.825 * 3.75).abs() < 0.03, "{}", right.area_m2);
        let r = name_room(&mut s, "L0", [3000.0, 2000.0], "salon", None).unwrap();
        assert_eq!(r.name, "Salon");
        let r2 = name_room(&mut s, "L0", [3000.0, 2000.0], "mutfak", None).unwrap();
        assert_eq!((r2.name.as_str(), s.levels[0].rooms.len()), ("Mutfak", 1));
    }

    #[test]
    fn piers_reject_openings_and_open_area_is_reported() {
        let s = module_scene();
        let e = place_opening(&s.levels[0], "p140", [500.0, 0.0], "P1".into()).unwrap_err();
        assert!(e == "@shear_wall_no_openings", "{e}");
        let ok = place_opening(&s.levels[0], "p250", [5000.0, 0.0], "P2".into()).unwrap();
        assert_eq!((ok.offset, ok.width), (1800.0, 2500.0));
        let mut open = s.clone();
        open.levels[0].walls.retain(|w| w.id != "M1-B0");
        assert!(detect_room(&open.levels[0], [5000.0, 2000.0]).unwrap_err() == "@area_not_closed");
    }

    #[test]
    fn snapping() {
        assert_eq!(snap_point([1234.0, 5678.0], None, 100.0), [1200.0, 5700.0]);
        assert_eq!(snap_point([3000.0, 120.0], Some([0.0, 0.0]), 100.0), [3000.0, 0.0]);
    }
}
