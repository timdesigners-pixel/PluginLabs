//! Ölçü ve metraj hesabı.

use crate::formula::{slug, Vars};
use crate::geom;
use crate::model::{OpeningKind, Scene};
use crate::units::{MM2_PER_M2, MM3_PER_M3};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct RoomMeasure {
    pub id: String,
    pub name: String,
    pub kind: String,
    pub level: String,
    pub area_m2: f64,
    pub perimeter_m: f64,
    pub height_m: f64,
    pub volume_m3: f64,
    pub wall_gross_m2: f64,
    pub openings_m2: f64,
    pub wall_net_m2: f64,
    pub skirting_m: f64,
    pub doors: u32,
    pub windows: u32,
    pub window_m2: f64,
    /// Pencere alanı / zemin alanı (gün ışığı oranı).
    pub daylight_ratio: f64,
    pub centroid: [f64; 2],
    pub width_m: f64,
    pub depth_m: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct WallMeasure {
    pub id: String,
    pub level: String,
    pub length_m: f64,
    pub height_m: f64,
    pub thickness_cm: f64,
    pub gross_m2: f64,
    pub openings_m2: f64,
    pub net_m2: f64,
    pub volume_m3: f64,
    pub exterior: bool,
}

#[derive(Debug, Clone, Serialize, Default)]
pub struct Totals {
    pub rooms: u32,
    pub floor_area_m2: f64,
    pub wet_area_m2: f64,
    pub ceiling_area_m2: f64,
    pub perimeter_m: f64,
    pub wall_net_m2: f64,
    pub wall_length_m: f64,
    pub wall_volume_m3: f64,
    pub exterior_wall_m2: f64,
    pub volume_m3: f64,
    pub skirting_m: f64,
    pub doors: u32,
    pub windows: u32,
    pub window_m2: f64,
    pub paint_litres: f64,
    pub footprint_w_m: f64,
    pub footprint_d_m: f64,
    pub gross_area_m2: f64,
    pub objects: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct MeasureReport {
    pub rooms: Vec<RoomMeasure>,
    pub walls: Vec<WallMeasure>,
    pub totals: Totals,
    pub warnings: Vec<String>,
}

fn r2(v: f64) -> f64 {
    (v * 100.0).round() / 100.0
}

pub fn measure(scene: &Scene) -> MeasureReport {
    let mut rooms = vec![];
    let mut walls = vec![];
    let mut t = Totals::default();
    let mut warnings = vec![];
    let mut all_pts: Vec<[f64; 2]> = vec![];

    for level in &scene.levels {
        for w in &level.walls {
            let len = w.length();
            let h = w.h(level);
            let ops: f64 = level
                .openings
                .iter()
                .filter(|o| o.wall == w.id)
                .map(|o| o.width.min(len) * o.height.min(h))
                .sum();
            let gross = len * h;
            all_pts.push(w.a);
            all_pts.push(w.b);
            for o in level.openings.iter().filter(|o| o.wall == w.id) {
                if o.offset < -1.0 || o.offset + o.width > len + 1.0 {
                    warnings.push(format!("@opening_exceeds_length|id={}", o.id));
                }
                if o.sill + o.height > h + 1.0 {
                    warnings.push(format!("@opening_exceeds_height|id={}", o.id));
                }
            }
            let wm = WallMeasure {
                id: w.id.clone(),
                level: level.id.clone(),
                length_m: r2(len / 1000.0),
                height_m: r2(h / 1000.0),
                thickness_cm: r2(w.thickness / 10.0),
                gross_m2: r2(gross / MM2_PER_M2),
                openings_m2: r2(ops / MM2_PER_M2),
                net_m2: r2((gross - ops).max(0.0) / MM2_PER_M2),
                volume_m3: r2((gross - ops).max(0.0) * w.thickness / MM3_PER_M3),
                exterior: w.exterior,
            };
            t.wall_length_m += len / 1000.0;
            t.wall_volume_m3 += (gross - ops).max(0.0) * w.thickness / MM3_PER_M3;
            if w.exterior {
                t.exterior_wall_m2 += (gross - ops).max(0.0) / MM2_PER_M2;
            }
            walls.push(wm);
        }

        for room in &level.rooms {
            if room.polygon.len() < 3 {
                warnings.push(format!("@room_polygon_missing|room={}", room.name.replace('|', "/")));
                continue;
            }
            let poly = &room.polygon;
            let area = geom::area(poly);
            let per = geom::perimeter(poly);
            let h = room.ceiling_height.unwrap_or(level.height);
            let (mut doors, mut windows, mut ops, mut win_area, mut door_width) = (0u32, 0u32, 0.0, 0.0, 0.0);
            for o in &level.openings {
                let Some(w) = level.walls.iter().find(|w| w.id == o.wall) else { continue };
                let len = w.length().max(1.0);
                let mid = geom::lerp(w.a, w.b, ((o.offset + o.width * 0.5) / len).clamp(0.0, 1.0));
                let touches = (0..poly.len()).any(|i| geom::dist_to_segment(mid, poly[i], poly[(i + 1) % poly.len()]) <= w.thickness * 0.6 + 5.0);
                if !touches {
                    continue;
                }
                let a = o.width * o.height;
                ops += a;
                match o.kind {
                    OpeningKind::Door => {
                        doors += 1;
                        door_width += o.width;
                    }
                    OpeningKind::Window => {
                        windows += 1;
                        win_area += a;
                    }
                }
            }
            let gross = per * h;
            let (mn, mx) = geom::bbox(poly);
            let rm = RoomMeasure {
                id: room.id.clone(),
                name: room.name.clone(),
                kind: room.kind.clone(),
                level: level.id.clone(),
                area_m2: r2(area / MM2_PER_M2),
                perimeter_m: r2(per / 1000.0),
                height_m: r2(h / 1000.0),
                volume_m3: r2(area * h / MM3_PER_M3),
                wall_gross_m2: r2(gross / MM2_PER_M2),
                openings_m2: r2(ops / MM2_PER_M2),
                wall_net_m2: r2((gross - ops).max(0.0) / MM2_PER_M2),
                skirting_m: r2((per - door_width).max(0.0) / 1000.0),
                doors,
                windows,
                window_m2: r2(win_area / MM2_PER_M2),
                daylight_ratio: if area > 0.0 { r2(win_area / area) } else { 0.0 },
                centroid: geom::centroid(poly),
                width_m: r2((mx[0] - mn[0]) / 1000.0),
                depth_m: r2((mx[1] - mn[1]) / 1000.0),
            };
            if rm.kind != "banyo" && rm.kind != "antre" && rm.kind != "balkon" && rm.windows == 0 {
                warnings.push(format!("{}: pencere yok", rm.name));
            } else if matches!(rm.kind.as_str(), "salon" | "yatak" | "calisma") && rm.daylight_ratio < 0.10 {
                warnings.push(format!("@low_daylight|room={}|p={:.0}", rm.name.replace('|', "/"), rm.daylight_ratio * 100.0));
            }
            t.rooms += 1;
            t.floor_area_m2 += area / MM2_PER_M2;
            t.ceiling_area_m2 += area / MM2_PER_M2;
            if matches!(room.kind.as_str(), "banyo" | "mutfak" | "balkon") {
                t.wet_area_m2 += area / MM2_PER_M2;
            }
            t.perimeter_m += per / 1000.0;
            t.wall_net_m2 += (gross - ops).max(0.0) / MM2_PER_M2;
            t.volume_m3 += area * h / MM3_PER_M3;
            t.skirting_m += rm.skirting_m;
            all_pts.extend(poly.iter().copied());
            rooms.push(rm);
        }
        for o in &level.openings {
            match o.kind {
                OpeningKind::Door => t.doors += 1,
                OpeningKind::Window => {
                    t.windows += 1;
                    t.window_m2 += o.width * o.height / MM2_PER_M2;
                }
            }
            if !level.walls.iter().any(|w| w.id == o.wall) {
                warnings.push(format!("@opening_wall_missing|id={}", o.id));
            }
        }
    }
    let cp = &scene.cost;
    t.paint_litres = t.wall_net_m2 * cp.paint_coats.max(1.0) / cp.paint_coverage_m2_per_l.max(0.1) + t.ceiling_area_m2 / cp.paint_coverage_m2_per_l.max(0.1);
    if !all_pts.is_empty() {
        let (mn, mx) = geom::bbox(&all_pts);
        t.footprint_w_m = (mx[0] - mn[0]) / 1000.0;
        t.footprint_d_m = (mx[1] - mn[1]) / 1000.0;
    }
    let wall_footprint: f64 = scene.levels.iter().flat_map(|l| l.walls.iter()).map(|w| w.length() * w.thickness).sum::<f64>() / MM2_PER_M2;
    t.gross_area_m2 = t.floor_area_m2 + wall_footprint * 0.5;
    t.objects = scene.objects.iter().map(|o| o.quantity.max(1)).sum();
    for f in [
        &mut t.floor_area_m2,
        &mut t.wet_area_m2,
        &mut t.ceiling_area_m2,
        &mut t.perimeter_m,
        &mut t.wall_net_m2,
        &mut t.wall_length_m,
        &mut t.wall_volume_m3,
        &mut t.exterior_wall_m2,
        &mut t.volume_m3,
        &mut t.skirting_m,
        &mut t.window_m2,
        &mut t.paint_litres,
        &mut t.footprint_w_m,
        &mut t.footprint_d_m,
        &mut t.gross_area_m2,
    ] {
        *f = r2(*f);
    }
    warnings.dedup();
    MeasureReport { rooms, walls, totals: t, warnings }
}

/// Formül dilinde kullanılabilen değişkenler.
pub fn variables(scene: &Scene, m: &MeasureReport) -> Vars {
    let t = &m.totals;
    let mut v = Vars::new();
    let mut put = |k: &str, x: f64| {
        v.insert(k.to_string(), x);
    };
    put("floor_area", t.floor_area_m2);
    put("gross_area", t.gross_area_m2);
    put("wet_area", t.wet_area_m2);
    put("ceiling_area", t.ceiling_area_m2);
    put("perimeter", t.perimeter_m);
    put("wall_area", t.wall_net_m2);
    put("wall_length", t.wall_length_m);
    put("wall_volume", t.wall_volume_m3);
    put("exterior_wall_area", t.exterior_wall_m2);
    put("volume", t.volume_m3);
    put("skirting", t.skirting_m);
    put("doors", t.doors as f64);
    put("windows", t.windows as f64);
    put("window_area", t.window_m2);
    put("paint_l", t.paint_litres);
    put("rooms", t.rooms as f64);
    put("objects", t.objects as f64);
    put("height", scene.levels.first().map(|l| l.height / 1000.0).unwrap_or(2.7));
    put("region_index", scene.cost.region_index);
    put("labour_index", scene.cost.labour_index);
    put("tier", scene.cost.tier.multiplier());
    for r in &m.rooms {
        let s = slug(&r.name);
        if s.is_empty() {
            continue;
        }
        v.insert(format!("{s}_area"), r.area_m2);
        v.insert(format!("{s}_wall"), r.wall_net_m2);
        v.insert(format!("{s}_perimeter"), r.perimeter_m);
    }
    // oda türüne göre toplam alanlar: area_salon, area_yatak, …
    for r in &m.rooms {
        let k = format!("area_{}", slug(&r.kind));
        *v.entry(k).or_insert(0.0) += r.area_m2;
    }
    v
}

/// Kullanıcının ölçü fonksiyonlarını sırayla çalıştırır; sonuçlar sonraki formüllere değişken olur.
pub fn run_measure_functions(scene: &Scene, vars: &mut Vars) -> Vec<FunctionResult> {
    use crate::model::FunctionKind;
    let mut out = vec![];
    for f in scene.functions.iter().filter(|f| f.enabled && f.kind == FunctionKind::Measure) {
        let r = crate::formula::evaluate(&f.expr, vars);
        if let Ok(x) = r {
            vars.insert(slug(&f.id), x);
        }
        out.push(FunctionResult { id: f.id.clone(), name: f.name.clone(), unit: f.unit.clone(), value: r.as_ref().ok().map(|x| r2(*x)), error: r.err() });
    }
    out
}

#[derive(Debug, Clone, Serialize)]
pub struct FunctionResult {
    pub id: String,
    pub name: String,
    pub unit: String,
    pub value: Option<f64>,
    pub error: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::*;

    pub fn box_room() -> Scene {
        let mut s = Scene::default();
        let l = &mut s.levels[0];
        l.height = 2500.0;
        let pts = [[0.0, 0.0], [4000.0, 0.0], [4000.0, 3000.0], [0.0, 3000.0]];
        for i in 0..4 {
            l.walls.push(Wall { id: format!("W{i}"), a: pts[i], b: pts[(i + 1) % 4], thickness: 200.0, ..Default::default() });
        }
        l.openings.push(Opening { id: "D1".into(), wall: "W0".into(), kind: OpeningKind::Door, offset: 500.0, width: 900.0, height: 2000.0, ..Default::default() });
        l.openings.push(Opening { id: "P1".into(), wall: "W2".into(), kind: OpeningKind::Window, offset: 1000.0, width: 1500.0, height: 1200.0, sill: 900.0, ..Default::default() });
        l.rooms.push(Room { id: "R1".into(), name: "Salon".into(), kind: "salon".into(), polygon: pts.to_vec(), ..Default::default() });
        s
    }

    #[test]
    fn room_metrics() {
        let s = box_room();
        let m = measure(&s);
        let r = &m.rooms[0];
        assert_eq!(r.area_m2, 12.0);
        assert_eq!(r.perimeter_m, 14.0);
        assert_eq!(r.volume_m3, 30.0);
        assert_eq!(r.wall_gross_m2, 35.0);
        assert_eq!(r.openings_m2, 3.6); // 1,8 + 1,8
        assert_eq!(r.wall_net_m2, 31.4);
        assert_eq!(r.skirting_m, 13.1);
        assert_eq!((r.doors, r.windows), (1, 1));
        assert_eq!(r.daylight_ratio, 0.15);
        assert_eq!(m.walls[0].net_m2, 8.2);
        assert_eq!(m.totals.doors, 1);
        // boya: 31,4 * 2 / 10 + 12 / 10 = 7,48 l
        assert_eq!(m.totals.paint_litres, 7.48);
        assert!(m.warnings.is_empty(), "{:?}", m.warnings);
    }

    #[test]
    fn variables_and_user_functions() {
        let mut s = box_room();
        s.functions.push(UserFunction { id: "seramik".into(), name: "Seramik kutusu".into(), expr: "ceil(floor_area * 1.1 / 1.44)".into(), ..Default::default() });
        s.functions.push(UserFunction { id: "yedek".into(), name: "Yedek".into(), expr: "seramik + 1".into(), ..Default::default() });
        let m = measure(&s);
        let mut v = variables(&s, &m);
        assert_eq!(v["salon_area"], 12.0);
        assert_eq!(v["area_salon"], 12.0);
        let res = run_measure_functions(&s, &mut v);
        assert_eq!(res[0].value, Some(10.0));
        assert_eq!(res[1].value, Some(11.0));
    }

    #[test]
    fn warns_on_overflowing_opening() {
        let mut s = box_room();
        s.levels[0].openings[0].offset = 3500.0;
        assert!(measure(&s).warnings.iter().any(|w| w.contains("@opening_exceeds_length")));
    }
}
