//! Hazır modül sistemi: modül ölçüleri, taşıyıcı perde kuralı ve kabuk duvarlarının üretimi.
//!
//! Modül dış ölçüsü 4 m × L m (L = 3…10). Uzun kenarların iki ucunda taşıyıcı perde beton
//! bulunur; ortadaki açıklık ve 4 m kısa kenar açılabilir. Modüller yan yana geldiğinde
//! birleşen kenarların açılabilir bölümü açılır, perde bölümleri her durumda kapalı kalır.

use crate::model::{Level, Module, Scene, Wall};
use serde::Serialize;

pub const WIDTH: f64 = 4000.0;
pub const LENGTHS: [u32; 8] = [3, 4, 5, 6, 7, 8, 9, 10];

#[derive(Debug, Clone, Serialize)]
pub struct ModuleSpec {
    pub length: u32,
    pub area_m2: f64,
    /// Uzun kenarın her iki ucundaki perde boyu (m).
    pub pier_m: f64,
    /// Uzun kenarın ortasındaki açılabilir bölüm (m).
    pub open_m: f64,
}

pub fn pier_mm(length: u32) -> f64 {
    match length {
        3 | 4 => 1000.0,
        5 | 6 => 1500.0,
        _ => 2000.0,
    }
}

pub fn specs() -> Vec<ModuleSpec> {
    LENGTHS
        .iter()
        .map(|&l| {
            let p = pier_mm(l);
            ModuleSpec { length: l, area_m2: 4.0 * l as f64, pier_m: p / 1000.0, open_m: (l as f64 * 1000.0 - 2.0 * p) / 1000.0 }
        })
        .collect()
}

/// Modülün plan dikdörtgeni (min, max), mm.
pub fn rect(m: &Module, scene: &Scene) -> ([f64; 2], [f64; 2]) {
    let base = if m.floor > 0 {
        m.on.as_ref().and_then(|id| scene.modules.iter().find(|g| &g.id == id && g.floor == 0)).unwrap_or(m)
    } else {
        m
    };
    let l = base.length as f64 * 1000.0;
    let (w, d) = if base.rotated { (WIDTH, l) } else { (l, WIDTH) };
    let p = base.position;
    (p, [p[0] + w, p[1] + d])
}

/// Bir aralıktan (s0,s1) çıkarılacak aralıkları düşer.
fn subtract(s0: f64, s1: f64, cuts: &[(f64, f64)]) -> Vec<(f64, f64)> {
    let mut parts = vec![(s0, s1)];
    for &(c0, c1) in cuts {
        let mut next = vec![];
        for (a, b) in parts {
            if c1 <= a || c0 >= b {
                next.push((a, b));
                continue;
            }
            if c0 > a {
                next.push((a, c0));
            }
            if c1 < b {
                next.push((c1, b));
            }
        }
        parts = next;
    }
    parts.into_iter().filter(|(a, b)| b - a > 1.0).collect()
}

pub fn level_id(floor: u32) -> String {
    format!("L{floor}")
}

/// Kat seviyelerini ve modül kabuk duvarlarını yeniden kurar.
/// Kullanıcının çizdiği bölmeler, açıklıklar ve odalar korunur; kaybolan duvara bağlı
/// açıklıklar arşive taşınır.
pub fn rebuild(scene: &mut Scene) -> Vec<String> {
    let mut notes = vec![];
    if scene.modules.is_empty() {
        return notes;
    }
    let st = scene.standard.clone();
    let t = st.exterior_wall;
    // Üst kat modüllerinin dayanağını doğrula.
    let ground: Vec<String> = scene.modules.iter().filter(|m| m.floor == 0).map(|m| m.id.clone()).collect();
    let before = scene.modules.len();
    let mut seen_on = vec![];
    scene.modules.retain(|m| {
        if m.floor == 0 {
            return true;
        }
        let ok = m.on.as_ref().is_some_and(|g| ground.contains(g)) && !seen_on.contains(&m.on);
        seen_on.push(m.on.clone());
        ok
    });
    if scene.modules.len() != before {
        notes.push("@upper_module_removed".into());
    }
    let max_floor = scene.modules.iter().map(|m| m.floor).max().unwrap_or(0);
    for f in 0..=max_floor {
        let id = level_id(f);
        if !scene.levels.iter().any(|l| l.id == id) {
            scene.levels.push(Level { id: id.clone(), name: if f == 0 { "Zemin kat".into() } else { format!("{f}. kat") }, ..Default::default() });
        }
    }
    for l in scene.levels.iter_mut() {
        let f: f64 = l.id.trim_start_matches('L').parse().unwrap_or(0.0);
        l.elevation = f * st.stack() + st.bottom_slab;
        l.height = st.net_height;
        l.slab = st.bottom_slab;
    }
    let rects: Vec<(Module, [f64; 2], [f64; 2])> = scene
        .modules
        .iter()
        .map(|m| {
            let mut e = m.clone();
            if let Some(g) = m.on.as_ref().and_then(|id| scene.modules.iter().find(|g| &g.id == id)) {
                e.length = g.length;
                e.rotated = g.rotated;
                e.position = g.position;
            }
            let (a, b) = rect(m, scene);
            (e, a, b)
        })
        .collect();
    let covered = |m: &Module| m.floor == 0 && scene.modules.iter().any(|u| u.floor == 1 && u.on.as_deref() == Some(&m.id));
    let mut new_walls: Vec<(String, Wall)> = vec![];
    for (m, mn, mx) in &rects {
        let lvl = level_id(m.floor);
        let base = m.floor as f64 * st.stack();
        let top = base + if covered(m) { st.stack() } else { st.storey() };
        let long_x = !m.rotated;
        // kenarlar: (ad, sabit eksen x mi?, sabit değer, s0, s1, dışarısı +1/-1, uzun kenar mı)
        let edges = [
            ("G", false, mn[1], mn[0], mx[0], -1.0, long_x),
            ("K", false, mx[1], mn[0], mx[0], 1.0, long_x),
            ("B", true, mn[0], mn[1], mx[1], -1.0, !long_x),
            ("D", true, mx[0], mn[1], mx[1], 1.0, !long_x),
        ];
        for (name, fixed_x, c, s0, s1, out, long) in edges {
            let pier = if long { pier_mm(m.length) } else { 0.0 };
            let piers = if long { vec![(s0, s0 + pier), (s1 - pier, s1)] } else { vec![] };
            // komşu modülle birleşen bölümler
            let mut joints = vec![];
            for (o, omn, omx) in &rects {
                if o.id == m.id || o.floor != m.floor {
                    continue;
                }
                let (oc, os0, os1) = if fixed_x {
                    (if out > 0.0 { omn[0] } else { omx[0] }, omn[1], omx[1])
                } else {
                    (if out > 0.0 { omn[1] } else { omx[1] }, omn[0], omx[0])
                };
                if (oc - c).abs() < 1.0 {
                    let a = s0.max(os0);
                    let b = s1.min(os1);
                    if b - a > 1.0 {
                        joints.push((a, b));
                    }
                }
            }
            let open_joint: Vec<(f64, f64)> = joints.iter().flat_map(|&(a, b)| subtract(a, b, &piers)).collect();
            let solid = subtract(s0, s1, &open_joint);
            // perde ve normal bölümlere ayır
            let mut segs: Vec<(f64, f64, bool)> = vec![];
            for (a, b) in solid {
                for (pa, pb) in &piers {
                    let x0 = a.max(*pa);
                    let x1 = b.min(*pb);
                    if x1 - x0 > 1.0 {
                        segs.push((x0, x1, true));
                    }
                }
                for (x0, x1) in subtract(a, b, &piers) {
                    segs.push((x0, x1, false));
                }
            }
            segs.sort_by(|p, q| p.0.partial_cmp(&q.0).unwrap());
            let inset = c - out * t / 2.0;
            for (x0, x1, structural) in segs {
                let in_joint = joints.iter().any(|&(a, b)| x0 >= a - 1.0 && x1 <= b + 1.0);
                let (pa, pb) = if fixed_x { ([inset, x0], [inset, x1]) } else { ([x0, inset], [x1, inset]) };
                // dışarısı a→b yönünün sağında mı solunda mı?
                let dir = if fixed_x { [0.0, 1.0] } else { [1.0, 0.0] };
                let normal = if fixed_x { [out, 0.0] } else { [0.0, out] };
                let right = [dir[1], -dir[0]];
                let side = if right[0] * normal[0] + right[1] * normal[1] > 0.0 { 1 } else { -1 };
                let id = format!("{}-{}{}", m.id, name, (x0 - s0).round() as i64);
                new_walls.push((
                    lvl.clone(),
                    Wall {
                        id,
                        a: pa,
                        b: pb,
                        thickness: t,
                        height: None,
                        material: String::new(),
                        exterior: !in_joint,
                        structural,
                        generated: true,
                        outer: String::new(),
                        outside: if in_joint { 0 } else { side },
                        shell: Some([base, top]),
                    },
                ));
            }
        }
    }
    // eski üretilmiş duvarların dış kaplamasını koru
    let mut outer_keep = std::collections::HashMap::new();
    for l in &scene.levels {
        for w in l.walls.iter().filter(|w| w.generated && !w.outer.is_empty()) {
            outer_keep.insert(w.id.clone(), w.outer.clone());
        }
    }
    for l in scene.levels.iter_mut() {
        l.walls.retain(|w| !w.generated || w.id.starts_with('O'));
    }
    for (lvl, mut w) in new_walls {
        if let Some(o) = outer_keep.get(&w.id) {
            w.outer = o.clone();
        }
        if let Some(l) = scene.levels.iter_mut().find(|l| l.id == lvl) {
            l.walls.push(w);
        }
    }
    // duvarı kaybolan ya da artık perde/dışında kalan açıklıkları arşivle
    let mut archived = vec![];
    for l in scene.levels.iter_mut() {
        let walls = l.walls.clone();
        l.openings.retain(|o| match walls.iter().find(|w| w.id == o.wall) {
            Some(w) if !w.structural && o.offset >= -1.0 && o.offset + o.width <= w.length() + 1.0 => true,
            _ => {
                archived.push(serde_json::json!({"type": "opening", "level": l.id, "item": o}));
                false
            }
        });
    }
    if !archived.is_empty() {
        notes.push(format!("@openings_archived_modules|n={}", archived.len()));
        scene.archive.extend(archived);
    }
    notes
}

/// Modül sürüklenirken en yakın modül kenarına hizalar (yaklaşınca yapışır).
pub fn snap(scene: &Scene, id: &str, pos: [f64; 2], tol: f64) -> [f64; 2] {
    let Some(m) = scene.modules.iter().find(|m| m.id == id) else { return pos };
    let mut probe = m.clone();
    probe.position = pos;
    let (mn, mx) = rect(&probe, scene);
    let size = [mx[0] - mn[0], mx[1] - mn[1]];
    let mut best = [(tol, 0.0), (tol, 0.0)];
    for o in scene.modules.iter().filter(|o| o.id != id && o.floor == 0) {
        let (omn, omx) = rect(o, scene);
        for k in 0..2 {
            for (mine, theirs) in [(mn[k], omx[k]), (mx[k], omn[k]), (mn[k], omn[k]), (mx[k], omx[k])] {
                let d = theirs - mine;
                if d.abs() < best[k].0 {
                    best[k] = (d.abs(), d);
                }
            }
        }
    }
    let r = |v: f64| (v / 100.0).round() * 100.0;
    let mut out = [r(pos[0]), r(pos[1])];
    for k in 0..2 {
        if best[k].0 < tol {
            out[k] = pos[k] + best[k].1;
        }
    }
    let _ = size;
    out
}

/// Zemin modülleri birbirinin içine giriyor mu?
pub fn overlaps(scene: &Scene) -> Vec<(String, String)> {
    let g: Vec<&Module> = scene.modules.iter().filter(|m| m.floor == 0).collect();
    let mut out = vec![];
    for i in 0..g.len() {
        for j in i + 1..g.len() {
            let (a0, a1) = rect(g[i], scene);
            let (b0, b1) = rect(g[j], scene);
            let ix = a1[0].min(b1[0]) - a0[0].max(b0[0]);
            let iy = a1[1].min(b1[1]) - a0[1].max(b0[1]);
            if ix > 1.0 && iy > 1.0 {
                out.push((g[i].id.clone(), g[j].id.clone()));
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::*;

    fn two_side_by_side() -> Scene {
        let mut s = Scene::default();
        s.levels[0].walls.clear();
        s.modules = vec![
            Module { id: "M1".into(), length: 10, position: [0.0, 0.0], ..Default::default() },
            Module { id: "M2".into(), length: 10, position: [0.0, 4000.0], ..Default::default() },
        ];
        rebuild(&mut s);
        s
    }

    #[test]
    fn spec_table_matches_pier_rule() {
        let sp = specs();
        assert_eq!(sp.len(), 8);
        let m10 = sp.iter().find(|s| s.length == 10).unwrap();
        assert_eq!((m10.pier_m, m10.open_m, m10.area_m2), (2.0, 6.0, 40.0));
        let m3 = &sp[0];
        assert_eq!((m3.pier_m, m3.open_m), (1.0, 1.0));
    }

    #[test]
    fn single_module_shell() {
        let mut s = Scene::default();
        s.modules = vec![Module { id: "M1".into(), length: 10, ..Default::default() }];
        rebuild(&mut s);
        let w = &s.levels[0].walls;
        // iki uzun kenar: perde + açılabilir + perde; iki kısa kenar: tek parça
        assert_eq!(w.len(), 8);
        assert_eq!(w.iter().filter(|w| w.structural).count(), 4);
        assert!(w.iter().all(|w| w.exterior && w.generated && w.outside != 0));
        let st = w.iter().find(|w| w.id == "M1-G0").unwrap();
        assert_eq!((st.a, st.b), ([0.0, 62.5], [2000.0, 62.5]));
        assert_eq!(s.levels[0].elevation, 150.0);
    }

    #[test]
    fn joined_modules_open_middle_keep_piers() {
        let s = two_side_by_side();
        let w = &s.levels[0].walls;
        // birleşim kenarında yalnız perdeler kalır (her modülden 2'şer)
        let joint: Vec<&Wall> = w.iter().filter(|w| w.id.starts_with("M1-K") || w.id.starts_with("M2-G")).collect();
        assert_eq!(joint.len(), 4);
        assert!(joint.iter().all(|w| w.structural && !w.exterior));
        let total: f64 = joint.iter().map(|w| w.length()).sum();
        assert_eq!(total, 8000.0);
    }

    #[test]
    fn upper_floor_sits_on_ground_module() {
        let mut s = two_side_by_side();
        s.modules.push(Module { id: "U1".into(), floor: 1, on: Some("M2".into()), length: 3, ..Default::default() });
        s.modules.push(Module { id: "U2".into(), floor: 1, on: Some("M9".into()), ..Default::default() });
        let n = rebuild(&mut s);
        assert_eq!(s.modules.len(), 3, "dayanaksız modül kaldırılır");
        assert!(!n.is_empty());
        let (mn, mx) = rect(&s.modules[2], &s);
        assert_eq!((mn, mx), ([0.0, 4000.0], [10000.0, 8000.0]));
        let l1 = s.levels.iter().find(|l| l.id == "L1").unwrap();
        assert_eq!(l1.elevation, 3120.0 + 150.0);
        assert_eq!(l1.walls.len(), 8);
        // altındaki modülün kabuğu parapetsiz biter
        let g = s.levels[0].walls.iter().find(|w| w.id == "M2-K0").unwrap();
        assert_eq!(g.shell, Some([0.0, 3120.0]));
    }

    #[test]
    fn openings_on_lost_walls_are_archived() {
        let mut s = two_side_by_side();
        s.levels[0].openings.push(Opening { id: "P1".into(), wall: "M1-G2000".into(), kind: OpeningKind::Window, offset: 1000.0, width: 2000.0, height: 2350.0, ..Default::default() });
        rebuild(&mut s);
        assert_eq!(s.levels[0].openings.len(), 1);
        s.modules[1].position = [0.0, -4000.0];
        rebuild(&mut s);
        assert!(s.levels[0].openings.is_empty());
        assert_eq!(s.archive.len(), 1);
    }

    #[test]
    fn snapping_and_overlap() {
        let mut s = two_side_by_side();
        let p = snap(&s, "M2", [130.0, 4170.0], 400.0);
        assert_eq!(p, [0.0, 4000.0]);
        s.modules[1].position = [0.0, 2000.0];
        assert_eq!(overlaps(&s).len(), 1);
    }
}
