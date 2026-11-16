//! Serbest ölçülü mekânlar: fotoğraftan ya da elle girilen ölçülerden kurulan dikdörtgen odalar.
//!
//! Her mekân iç ölçüleriyle (genişlik × derinlik × yükseklik) tutulur; duvarları bu kayıttan
//! üretilir. Bir ölçü değiştiğinde duvarlar, döşeme ve tavan yeniden kurulur. Yan yana eklenen
//! mekânlar ortak duvarı paylaşır; böylece odalardan daire ve yapı oluşur.

use crate::model::{Camera, Level, Opening, OpeningKind, Scene, Wall};
use crate::photo::{FitCamera, FitOpening};
use serde::{Deserialize, Serialize};

pub const MIN_SIDE: f64 = 1000.0;
pub const MAX_SIDE: f64 = 30_000.0;
pub const MIN_HEIGHT: f64 = 2000.0;
pub const MAX_HEIGHT: f64 = 6000.0;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct Space {
    pub id: String,
    pub name: String,
    /// İç hacmin arka-sol köşesi (plan, mm). Arka duvar küçük y tarafındadır.
    pub position: [f64; 2],
    /// İç genişlik (x), iç derinlik (y) ve net yükseklik (mm).
    pub width: f64,
    pub depth: f64,
    pub height: f64,
    /// Duvar kalınlığı (mm).
    pub wall: f64,
    /// foto, elle
    pub source: String,
    /// Fotoğrafın çekildiği bakış (varsa): render'ı aynı açıdan almak için.
    pub camera: Option<Camera>,
}
impl Default for Space {
    fn default() -> Self {
        Space { id: String::new(), name: "Oda".into(), position: [0.0, 0.0], width: 4000.0, depth: 4000.0, height: 2650.0, wall: 125.0, source: "elle".into(), camera: None }
    }
}
impl Space {
    pub fn rect(&self) -> ([f64; 2], [f64; 2]) {
        (self.position, [self.position[0] + self.width, self.position[1] + self.depth])
    }
    pub fn outer(&self) -> ([f64; 2], [f64; 2]) {
        let (a, b) = self.rect();
        ([a[0] - self.wall, a[1] - self.wall], [b[0] + self.wall, b[1] + self.wall])
    }
    pub fn center(&self) -> [f64; 2] {
        [self.position[0] + self.width / 2.0, self.position[1] + self.depth / 2.0]
    }
}

fn is_space_wall(w: &Wall) -> bool {
    w.generated && w.id.starts_with('O')
}

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

struct Edge {
    space: usize,
    name: &'static str,
    fixed_x: bool,
    c: f64,
    s0: f64,
    s1: f64,
    out: f64,
}

fn edges(i: usize, s: &Space) -> [Edge; 4] {
    let (a, b) = s.rect();
    let t = s.wall;
    [
        Edge { space: i, name: "G", fixed_x: false, c: a[1] - t / 2.0, s0: a[0] - t, s1: b[0] + t, out: -1.0 },
        Edge { space: i, name: "K", fixed_x: false, c: b[1] + t / 2.0, s0: a[0] - t, s1: b[0] + t, out: 1.0 },
        Edge { space: i, name: "B", fixed_x: true, c: a[0] - t / 2.0, s0: a[1], s1: b[1], out: -1.0 },
        Edge { space: i, name: "D", fixed_x: true, c: b[0] + t / 2.0, s0: a[1], s1: b[1], out: 1.0 },
    ]
}

/// Mekân kayıtlarından duvarları yeniden üretir. `modules::rebuild` sonrasında çağrılır.
pub fn rebuild(scene: &mut Scene) -> Vec<String> {
    let mut notes = vec![];
    if scene.spaces.is_empty() {
        for l in scene.levels.iter_mut() {
            l.walls.retain(|w| !is_space_wall(w));
        }
        return notes;
    }
    if scene.levels.is_empty() {
        scene.levels.push(Level::default());
    }
    let st = scene.standard.clone();
    let tallest = scene.spaces.iter().map(|s| s.height).fold(0.0, f64::max);
    let level = &mut scene.levels[0];
    if scene.modules.is_empty() {
        level.elevation = st.bottom_slab;
        level.slab = st.bottom_slab;
        level.height = tallest;
    } else {
        level.height = level.height.max(tallest);
    }
    let el = level.elevation;
    let all: Vec<Edge> = scene.spaces.iter().enumerate().flat_map(|(i, s)| edges(i, s)).collect();
    let mut walls = vec![];
    for e in &all {
        let sp = &scene.spaces[e.space];
        // karşı yönlü, aynı eksendeki komşu kenarla örtüşen bölüm ortak duvardır
        let mut joints = vec![];
        let mut owner = true;
        for o in all.iter().filter(|o| o.space != e.space && o.fixed_x == e.fixed_x && o.out != e.out && (o.c - e.c).abs() < 1.0) {
            let (a, b) = (e.s0.max(o.s0), e.s1.min(o.s1));
            if b - a > 1.0 {
                joints.push((a, b));
                if o.space < e.space {
                    owner = false;
                }
            }
        }
        let mut segs: Vec<(f64, f64, bool)> = subtract(e.s0, e.s1, &joints).into_iter().map(|(a, b)| (a, b, false)).collect();
        if owner {
            segs.extend(joints.iter().map(|&(a, b)| (a, b, true)));
        }
        segs.sort_by(|p, q| p.0.partial_cmp(&q.0).unwrap());
        for (x0, x1, joint) in segs {
            let (pa, pb) = if e.fixed_x { ([e.c, x0], [e.c, x1]) } else { ([x0, e.c], [x1, e.c]) };
            let dir = if e.fixed_x { [0.0, 1.0] } else { [1.0, 0.0] };
            let normal = if e.fixed_x { [e.out, 0.0] } else { [0.0, e.out] };
            let right = [dir[1], -dir[0]];
            let side = if right[0] * normal[0] + right[1] * normal[1] > 0.0 { 1 } else { -1 };
            walls.push(Wall {
                id: format!("{}-{}{}", sp.id, e.name, (x0 - e.s0).round() as i64),
                a: pa,
                b: pb,
                thickness: sp.wall,
                height: None,
                material: String::new(),
                exterior: !joint,
                structural: false,
                generated: true,
                outer: String::new(),
                outside: if joint { 0 } else { side },
                shell: Some([0.0, el + sp.height + st.top_slab]),
            });
        }
    }
    let level = &mut scene.levels[0];
    let keep: std::collections::HashMap<String, (String, String)> = level.walls.iter().filter(|w| is_space_wall(w)).map(|w| (w.id.clone(), (w.material.clone(), w.outer.clone()))).collect();
    level.walls.retain(|w| !is_space_wall(w));
    for mut w in walls {
        if let Some((m, o)) = keep.get(&w.id) {
            w.material = m.clone();
            w.outer = o.clone();
        }
        level.walls.push(w);
    }
    let mut archived = vec![];
    let snapshot = level.walls.clone();
    let lid = level.id.clone();
    level.openings.retain(|o| match snapshot.iter().find(|w| w.id == o.wall) {
        Some(w) if o.offset >= -1.0 && o.offset + o.width <= w.length() + 1.0 => true,
        _ => {
            archived.push(serde_json::json!({"type": "opening", "level": lid, "item": o}));
            false
        }
    });
    if !archived.is_empty() {
        notes.push(format!("{} açıklık ölçü değişikliği nedeniyle arşivlendi", archived.len()));
        scene.archive.extend(archived);
    }
    for (i, a) in scene.spaces.iter().enumerate() {
        for b in scene.spaces.iter().skip(i + 1) {
            let ((a0, a1), (b0, b1)) = (a.rect(), b.rect());
            if a0[0] < b1[0] && b0[0] < a1[0] && a0[1] < b1[1] && b0[1] < a1[1] {
                notes.push(format!("{} ile {} üst üste biniyor", a.name, b.name));
            }
        }
    }
    notes
}

fn next_id(scene: &Scene) -> String {
    let mut k = scene.spaces.len() + 1;
    loop {
        let id = format!("O{k}");
        if !scene.spaces.iter().any(|s| s.id == id) {
            return id;
        }
        k += 1;
    }
}

/// Yeni mekânın yeri: ilk mekân başlangıca, sonrakiler seçilen mekânın yanına (ortak duvarla).
pub fn place(scene: &Scene, s: &Space, beside: Option<&str>, side: &str) -> [f64; 2] {
    let anchor = beside.and_then(|id| scene.spaces.iter().find(|x| x.id == id)).or(scene.spaces.last());
    match anchor {
        Some(a) => {
            let t = a.wall.max(s.wall);
            match side {
                "sol" => [a.position[0] - t - s.width, a.position[1]],
                "on" => [a.position[0], a.position[1] + a.depth + t],
                "arka" => [a.position[0], a.position[1] - t - s.depth],
                _ => [a.position[0] + a.width + t, a.position[1]],
            }
        }
        None => {
            let pts: Vec<[f64; 2]> = scene.levels.iter().flat_map(|l| l.walls.iter().flat_map(|w| [w.a, w.b])).collect();
            if pts.is_empty() {
                [0.0, 0.0]
            } else {
                let (_, mx) = crate::geom::bbox(&pts);
                [mx[0] + 2000.0, 0.0]
            }
        }
    }
}

fn clamp_dims(s: &mut Space) {
    s.width = (s.width.clamp(MIN_SIDE, MAX_SIDE) / 10.0).round() * 10.0;
    s.depth = (s.depth.clamp(MIN_SIDE, MAX_SIDE) / 10.0).round() * 10.0;
    s.height = (s.height.clamp(MIN_HEIGHT, MAX_HEIGHT) / 10.0).round() * 10.0;
    s.wall = s.wall.clamp(60.0, 500.0);
}

/// İç ölçü koordinatındaki bir açıklığı taşıyan duvar parçasını bulur.
fn wall_for(scene: &Scene, s: &Space, side: &str, offset: f64, width: f64) -> Option<(String, f64)> {
    let (a, b) = s.rect();
    let t = s.wall;
    let (fixed_x, c, start) = match side {
        "sol" => (true, a[0] - t / 2.0, a[1] + offset),
        "sag" => (true, b[0] + t / 2.0, a[1] + offset),
        "on" => (false, b[1] + t / 2.0, a[0] + offset),
        _ => (false, a[1] - t / 2.0, a[0] + offset),
    };
    let level = scene.levels.first()?;
    level.walls.iter().filter(|w| is_space_wall(w)).find_map(|w| {
        let vertical = (w.a[0] - w.b[0]).abs() < 0.5;
        if vertical != fixed_x {
            return None;
        }
        let (wc, w0, w1) = if vertical { (w.a[0], w.a[1], w.b[1]) } else { (w.a[1], w.a[0], w.b[0]) };
        ((wc - c).abs() < 1.0 && start >= w0 - 0.5 && start + width <= w1 + 0.5).then(|| (w.id.clone(), start - w0))
    })
}

/// Mekân ekler, duvarlarını kurar, zemini adlandırır ve açıklıklarını yerleştirir.
pub fn add(scene: &mut Scene, mut s: Space, openings: &[FitOpening], cam: Option<&FitCamera>, beside: Option<&str>, side: &str) -> Result<(String, Vec<String>), String> {
    clamp_dims(&mut s);
    s.id = next_id(scene);
    if s.name.trim().is_empty() {
        s.name = format!("Oda {}", scene.spaces.len() + 1);
    }
    s.position = place(scene, &s, beside, side);
    let el = scene.levels.first().map(|l| l.elevation).unwrap_or(scene.standard.bottom_slab);
    if let Some(c) = cam {
        let eye = [s.position[0] + c.x, el + c.height, s.position[1] + c.back];
        s.camera = Some(Camera { eye, target: [eye[0] + c.dir[0] * 2000.0, eye[1] + c.dir[1] * 2000.0, eye[2] - c.dir[2] * 2000.0], fov: c.fov.clamp(10.0, 120.0) });
    }
    let id = s.id.clone();
    let center = s.center();
    let name = s.name.clone();
    scene.spaces.push(s.clone());
    let mut notes = rebuild(scene);
    let lid = scene.levels[0].id.clone();
    if let Err(e) = crate::plan::name_room(scene, &lid, center, "salon", Some(name)) {
        notes.push(format!("Zemin kaplaması atanamadı: {e}"));
    }
    let mut n = scene.levels[0].openings.len();
    for o in openings {
        let door = o.kind != "window";
        // oda yüksekliğine ve duvar boyuna sığdır
        let height = o.height.min(s.height - o.sill.max(0.0) - 50.0);
        let Some((wall, offset)) = wall_for(scene, &s, &o.wall, o.offset.max(0.0), o.width) else {
            notes.push("Bir açıklık duvara sığmadığı için eklenmedi".into());
            continue;
        };
        n += 1;
        let op = Opening { id: format!("{id}-A{n}"), wall, kind: if door { OpeningKind::Door } else { OpeningKind::Window }, offset, width: o.width, height, sill: if door { 0.0 } else { o.sill }, price: 0.0, swing: "sol-ice".into() };
        match crate::plan::validate_opening(&scene.levels[0], &op) {
            Ok(()) => scene.levels[0].openings.push(op),
            Err(e) => notes.push(format!("Açıklık eklenmedi: {e}")),
        }
    }
    Ok((id, notes))
}

/// Mekânın ölçülerini günceller. `lock` açıkken tek bir ölçü değişse de oran korunur:
/// diğer ölçüler, açıklıklar ve kamera aynı katsayıyla büyür.
pub fn resize(scene: &mut Scene, id: &str, width: Option<f64>, depth: Option<f64>, height: Option<f64>, lock: bool) -> Result<Vec<String>, String> {
    let i = scene.spaces.iter().position(|s| s.id == id).ok_or("Mekân bulunamadı")?;
    let old = scene.spaces[i].clone();
    let mut s = old.clone();
    if lock {
        let k = width.map(|v| v / old.width).or(depth.map(|v| v / old.depth)).or(height.map(|v| v / old.height)).unwrap_or(1.0);
        let lo = (MIN_SIDE / old.width.min(old.depth)).max(MIN_HEIGHT / old.height);
        let hi = (MAX_SIDE / old.width.max(old.depth)).min(MAX_HEIGHT / old.height);
        if !(k.is_finite() && k > 0.0) || lo > hi {
            return Err("Geçersiz ölçü".into());
        }
        let k = k.clamp(lo, hi);
        s.width = old.width * k;
        s.depth = old.depth * k;
        s.height = old.height * k;
        let prefix = format!("{id}-");
        let t = old.wall;
        if let Some(level) = scene.levels.first_mut() {
            let horizontal: std::collections::HashSet<String> = level.walls.iter().filter(|w| w.id.starts_with(&prefix) && (w.a[1] - w.b[1]).abs() < 0.5).map(|w| w.id.clone()).collect();
            for o in level.openings.iter_mut().filter(|o| o.wall.starts_with(&prefix)) {
                // yatay duvarlar köşede duvar kalınlığı kadar uzar; iç ölçü o noktadan başlar
                let lead = if horizontal.contains(&o.wall) { t } else { 0.0 };
                o.offset = (o.offset - lead) * k + lead;
                o.width *= k;
                o.height *= k;
                o.sill *= k;
            }
            let el = level.elevation;
            if let Some(c) = s.camera.as_mut() {
                let rel = [c.eye[0] - old.position[0], c.eye[1] - el, c.eye[2] - old.position[1]];
                let dir = [c.target[0] - c.eye[0], c.target[1] - c.eye[1], c.target[2] - c.eye[2]];
                c.eye = [old.position[0] + rel[0] * k, el + rel[1] * k, old.position[1] + rel[2] * k];
                c.target = [c.eye[0] + dir[0], c.eye[1] + dir[1], c.eye[2] + dir[2]];
            }
        }
    } else {
        if let Some(v) = width {
            s.width = v;
        }
        if let Some(v) = depth {
            s.depth = v;
        }
        if let Some(v) = height {
            s.height = v;
        }
    }
    clamp_dims(&mut s);
    // tek parça zemini olan odada çokgeni doğrudan yeni ölçüye taşı
    let (o0, o1) = old.rect();
    let (n0, n1) = s.rect();
    if let Some(level) = scene.levels.first_mut() {
        let inside: Vec<usize> = level
            .rooms
            .iter()
            .enumerate()
            .filter(|(_, r)| {
                let c = crate::geom::centroid(&r.polygon);
                c[0] > o0[0] && c[0] < o1[0] && c[1] > o0[1] && c[1] < o1[1]
            })
            .map(|(k, _)| k)
            .collect();
        if inside.len() == 1 {
            level.rooms[inside[0]].polygon = vec![n0, [n1[0], n0[1]], n1, [n0[0], n1[1]]];
        }
    }
    scene.spaces[i] = s;
    Ok(rebuild(scene))
}

/// Mekânı arşive taşır (silme yok); zemin kaydı da arşivlenir.
pub fn archive(scene: &mut Scene, id: &str) -> Result<(), String> {
    let i = scene.spaces.iter().position(|s| s.id == id).ok_or("Mekân bulunamadı")?;
    let s = scene.spaces.remove(i);
    let (a, b) = s.rect();
    let mut rooms = vec![];
    if let Some(level) = scene.levels.first_mut() {
        level.rooms.retain(|r| {
            let c = crate::geom::centroid(&r.polygon);
            let inside = c[0] > a[0] && c[0] < b[0] && c[1] > a[1] && c[1] < b[1];
            if inside {
                rooms.push(r.clone());
            }
            !inside
        });
    }
    scene.archive.push(serde_json::json!({"type": "space", "item": s, "rooms": rooms}));
    rebuild(scene);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn empty() -> Scene {
        Scene { levels: vec![Level::default()], ..Default::default() }
    }

    #[test]
    fn single_room_has_four_walls_floor_and_exact_net_area() {
        let mut s = empty();
        let (id, notes) = add(&mut s, Space { width: 4200.0, depth: 5000.0, height: 2700.0, ..Default::default() }, &[], None, None, "sag").unwrap();
        assert!(notes.is_empty(), "{notes:?}");
        assert_eq!(id, "O1");
        let l = &s.levels[0];
        assert_eq!(l.walls.len(), 4);
        assert_eq!(l.rooms.len(), 1);
        let area = crate::geom::area(&l.rooms[0].polygon) / 1e6;
        assert!((area - 21.0).abs() < 0.15, "alan {area}");
        assert_eq!(l.height, 2700.0);
        let m = crate::mesh::build(&s, &crate::mesh::MeshOptions::default());
        let (_, mx) = m.bounds();
        assert!((mx[1] as f64 - (150.0 + 2700.0 + s.standard.top_slab)).abs() < 1.0);
    }

    #[test]
    fn neighbours_share_one_wall_and_form_a_flat() {
        let mut s = empty();
        add(&mut s, Space { width: 4000.0, depth: 4000.0, ..Default::default() }, &[], None, None, "sag").unwrap();
        add(&mut s, Space { width: 3000.0, depth: 4000.0, ..Default::default() }, &[], None, Some("O1"), "sag").unwrap();
        let l = &s.levels[0];
        // ortak duvar tek parça ve iç duvar
        let shared: Vec<&Wall> = l.walls.iter().filter(|w| w.outside == 0).collect();
        assert_eq!(shared.len(), 1);
        assert_eq!(l.walls.len(), 7);
        assert_eq!(l.rooms.len(), 2);
        assert!((s.spaces[1].position[0] - 4125.0).abs() < 0.5);
    }

    #[test]
    fn resize_updates_walls_and_keeps_proportion_when_locked() {
        let mut s = empty();
        let door = FitOpening { wall: "arka".into(), kind: "door".into(), offset: 1000.0, width: 900.0, sill: 0.0, height: 2100.0 };
        let (id, notes) = add(&mut s, Space { width: 4000.0, depth: 5000.0, height: 2500.0, ..Default::default() }, &[door], None, None, "sag").unwrap();
        assert!(notes.is_empty(), "{notes:?}");
        assert_eq!(s.levels[0].openings.len(), 1);
        assert!((s.levels[0].openings[0].offset - 1125.0).abs() < 0.5);
        resize(&mut s, &id, Some(4400.0), None, None, false).unwrap();
        assert_eq!((s.spaces[0].width, s.spaces[0].depth), (4400.0, 5000.0));
        let area = crate::geom::area(&s.levels[0].rooms[0].polygon) / 1e6;
        assert!((area - 22.0).abs() < 0.15, "alan {area}");
        resize(&mut s, &id, None, None, Some(2750.0), true).unwrap();
        let sp = &s.spaces[0];
        assert!((sp.width - 4840.0).abs() < 1.0 && (sp.depth - 5500.0).abs() < 1.0 && sp.height == 2750.0);
        let o = &s.levels[0].openings[0];
        assert!((o.width - 990.0).abs() < 1.0 && (o.offset - 1225.0).abs() < 1.0, "{o:?}");
    }

    #[test]
    fn photo_openings_and_camera_land_in_the_room() {
        let mut s = empty();
        let ops = [
            FitOpening { wall: "arka".into(), kind: "window".into(), offset: 1200.0, width: 1600.0, sill: 900.0, height: 1300.0 },
            FitOpening { wall: "sag".into(), kind: "door".into(), offset: 600.0, width: 900.0, sill: 0.0, height: 2100.0 },
        ];
        let cam = FitCamera { x: 1500.0, back: 3800.0, height: 1400.0, dir: [0.2, -0.1, 0.97], fov: 52.0 };
        add(&mut s, Space { width: 4500.0, depth: 4100.0, height: 2700.0, source: "foto".into(), ..Default::default() }, &ops, Some(&cam), None, "sag").unwrap();
        let l = &s.levels[0];
        assert_eq!(l.openings.len(), 2);
        assert!(l.openings[0].wall.starts_with("O1-G") && l.openings[1].wall.starts_with("O1-D"));
        let c = s.spaces[0].camera.as_ref().unwrap();
        assert_eq!(c.eye, [1500.0, 150.0 + 1400.0, 3800.0]);
        assert!(c.target[2] < c.eye[2], "kamera arka duvara (küçük y) bakar");
    }

    #[test]
    fn archive_moves_space_out_without_deleting() {
        let mut s = empty();
        let (id, _) = add(&mut s, Space::default(), &[], None, None, "sag").unwrap();
        archive(&mut s, &id).unwrap();
        assert!(s.spaces.is_empty() && s.levels[0].walls.is_empty() && s.levels[0].rooms.is_empty());
        assert_eq!(s.archive.last().unwrap()["type"], "space");
    }
}
