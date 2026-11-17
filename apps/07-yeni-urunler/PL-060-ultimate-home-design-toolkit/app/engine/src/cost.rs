//! Maliyet tahmini ve ölçekleme.

use crate::formula::{self, slug, Vars};
use crate::measure::{self, MeasureReport};
use crate::model::{Basis, FunctionKind, Scene, Tier};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct CostLine {
    pub id: String,
    pub name: String,
    pub group: String,
    pub unit: String,
    pub quantity: f64,
    pub quantity_with_waste: f64,
    pub material: f64,
    pub labour: f64,
    pub discount: f64,
    pub total: f64,
    pub note: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct GroupTotal {
    pub group: String,
    pub total: f64,
    pub share: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CostReport {
    pub tier: Tier,
    pub lines: Vec<CostLine>,
    pub groups: Vec<GroupTotal>,
    pub material_total: f64,
    pub labour_total: f64,
    pub discount_total: f64,
    pub subtotal: f64,
    pub contingency: f64,
    pub vat: f64,
    pub total: f64,
    pub per_m2: f64,
    pub floor_area_m2: f64,
    pub errors: Vec<String>,
}

fn r2(v: f64) -> f64 {
    (v * 100.0).round() / 100.0
}

fn discount_rate(breaks: &[(f64, f64)], qty: f64) -> f64 {
    breaks.iter().filter(|(q, _)| qty >= *q).map(|(_, d)| d.clamp(0.0, 0.9)).fold(0.0, f64::max)
}

pub fn quantity(basis: &Basis, m: &MeasureReport, vars: &Vars) -> Result<f64, String> {
    let t = &m.totals;
    Ok(match basis {
        Basis::FloorArea => t.floor_area_m2,
        Basis::WallNetArea => t.wall_net_m2,
        Basis::CeilingArea => t.ceiling_area_m2,
        Basis::Skirting => t.skirting_m,
        Basis::Doors => t.doors as f64,
        Basis::Windows => t.windows as f64,
        Basis::PaintLitres => t.paint_litres,
        Basis::Volume => t.volume_m3,
        Basis::WetArea => t.wet_area_m2,
        Basis::Rooms => t.rooms as f64,
        Basis::Fixed => 1.0,
        Basis::Formula(f) => formula::evaluate(f, vars)?,
    })
}

pub fn estimate(scene: &Scene) -> CostReport {
    let m = measure::measure(scene);
    estimate_with(scene, &m, scene.cost.tier)
}

pub fn estimate_with(scene: &Scene, m: &MeasureReport, tier: Tier) -> CostReport {
    let cp = &scene.cost;
    let mut vars = measure::variables(scene, m);
    vars.insert("tier".into(), tier.multiplier());
    let mut errors = vec![];
    for r in measure::run_measure_functions(scene, &mut vars) {
        if let Some(e) = r.error {
            errors.push(crate::msg::named(&r.name, &e));
        }
    }
    let region = cp.region_index.clamp(0.1, 10.0);
    let labour_idx = cp.labour_index.clamp(0.1, 10.0);
    let mut lines = vec![];
    for rate in cp.rates.iter().filter(|r| r.enabled) {
        let q = match quantity(&rate.basis, m, &vars) {
            Ok(q) => q.max(0.0),
            Err(e) => {
                errors.push(crate::msg::named(&rate.name, &e));
                continue;
            }
        };
        if q <= 0.0 {
            continue;
        }
        let qw = q * (1.0 + rate.waste.clamp(0.0, 1.0));
        let tm = if rate.tiered { tier.multiplier() } else { 1.0 };
        let mat = qw * rate.material_price * tm * region;
        let lab = q * rate.labour_price * labour_idx * region;
        let d = discount_rate(&rate.breaks, qw);
        let disc = mat * d;
        let total = mat + lab - disc;
        lines.push(CostLine {
            id: rate.id.clone(),
            name: rate.name.clone(),
            group: rate.group.clone(),
            unit: rate.unit.clone(),
            quantity: r2(q),
            quantity_with_waste: r2(qw),
            material: r2(mat),
            labour: r2(lab),
            discount: r2(disc),
            total: r2(total),
            note: if d > 0.0 { format!("@quantity_discount|p={:.0}", d * 100.0) } else { String::new() },
        });
    }
    // Açıklık birim fiyatları (kapı / pencere doğramaları)
    let mut door_sum = 0.0;
    let mut win_sum = 0.0;
    for l in &scene.levels {
        for o in &l.openings {
            match o.kind {
                crate::model::OpeningKind::Door => door_sum += o.price,
                crate::model::OpeningKind::Window => win_sum += o.price,
            }
        }
    }
    for (id, name, sum) in [("acik-kapi", "Kapı doğraması (açıklık fiyatları)", door_sum), ("acik-pencere", "Pencere doğraması (açıklık fiyatları)", win_sum)] {
        if sum > 0.0 {
            let v = sum * tier.multiplier() * region;
            lines.push(CostLine { id: id.into(), name: name.into(), group: "Doğrama".into(), unit: "sabit".into(), quantity: 1.0, quantity_with_waste: 1.0, material: r2(v), labour: 0.0, discount: 0.0, total: r2(v), note: String::new() });
        }
    }
    // Kaplama kütüphanesi: zemin kaplamaları (mahal alanı × m² fiyatı, %8 fire)
    let mut floors: std::collections::BTreeMap<String, f64> = Default::default();
    for l in &scene.levels {
        for r in &l.rooms {
            if let Some(rm) = m.rooms.iter().find(|x| x.id == r.id) {
                *floors.entry(r.floor.clone()).or_default() += rm.area_m2;
            }
        }
    }
    for (mat_id, area) in floors {
        let Some(mat) = scene.material(&mat_id) else { continue };
        if mat.price_m2 <= 0.0 || area <= 0.0 {
            continue;
        }
        let qw = area * 1.08;
        let v = qw * mat.price_m2 * tier.multiplier() * region;
        lines.push(CostLine { id: format!("zemin-{mat_id}"), name: format!("Zemin kaplaması · {}", mat.name), group: "Kaplama".into(), unit: "m²".into(), quantity: r2(area), quantity_with_waste: r2(qw), material: r2(v), labour: 0.0, discount: 0.0, total: r2(v), note: "Kaplama kütüphanesi fiyatı".into() });
    }
    // Kaplama kütüphanesi: dış cephe kaplamaları (duvar yüzeyi − açıklıklar, %5 fire)
    let mut clad: std::collections::BTreeMap<String, f64> = Default::default();
    for l in &scene.levels {
        for w in l.walls.iter().filter(|w| w.outside != 0 && !w.outer.is_empty()) {
            let h = w.shell.map(|s| s[1] - s[0]).unwrap_or_else(|| w.h(l));
            let ops: f64 = l.openings.iter().filter(|o| o.wall == w.id).map(|o| o.width * o.height).sum();
            *clad.entry(w.outer.clone()).or_default() += (w.length() * h - ops).max(0.0) / crate::units::MM2_PER_M2;
        }
    }
    for (mat_id, area) in clad {
        let Some(mat) = scene.material(&mat_id) else { continue };
        if mat.price_m2 <= 0.0 || area <= 0.0 {
            continue;
        }
        let qw = area * 1.05;
        let v = qw * mat.price_m2 * tier.multiplier() * region;
        lines.push(CostLine { id: format!("cephe-{mat_id}"), name: mat.name.clone(), group: "Kaplama".into(), unit: "m²".into(), quantity: r2(area), quantity_with_waste: r2(qw), material: r2(v), labour: 0.0, discount: 0.0, total: r2(v), note: "Kaplama kütüphanesi fiyatı".into() });
    }
    // Kullanıcı maliyet fonksiyonları
    for f in scene.functions.iter().filter(|f| f.enabled && f.kind == FunctionKind::Cost) {
        match formula::evaluate(&f.expr, &vars) {
            Ok(x) => {
                let (q, total) = if f.is_amount { (1.0, x) } else { (x, x * f.unit_price) };
                let total = total * region;
                vars.insert(slug(&f.id), x);
                lines.push(CostLine {
                    id: f.id.clone(),
                    name: f.name.clone(),
                    group: "Kullanıcı fonksiyonu".into(),
                    unit: if f.unit.is_empty() { "adet".into() } else { f.unit.clone() },
                    quantity: r2(q),
                    quantity_with_waste: r2(q),
                    material: r2(total),
                    labour: 0.0,
                    discount: 0.0,
                    total: r2(total),
                    note: format!("ƒ {}", f.expr),
                });
            }
            Err(e) => errors.push(crate::msg::named(&f.name, &e)),
        }
    }
    if cp.include_furniture {
        let mut furn: std::collections::BTreeMap<String, (f64, u32)> = Default::default();
        for o in &scene.objects {
            if o.price <= 0.0 {
                continue;
            }
            let e = furn.entry(o.name.clone()).or_insert((0.0, 0));
            e.0 += o.price * o.quantity.max(1) as f64;
            e.1 += o.quantity.max(1);
        }
        for (name, (sum, n)) in furn {
            let v = sum * tier.multiplier() * region;
            lines.push(CostLine {
                id: format!("mobilya-{}", slug(&name)),
                name,
                group: "Mobilya ve donatı".into(),
                unit: "adet".into(),
                quantity: n as f64,
                quantity_with_waste: n as f64,
                material: r2(v),
                labour: 0.0,
                discount: 0.0,
                total: r2(v),
                note: String::new(),
            });
        }
    }
    let material_total: f64 = lines.iter().map(|l| l.material).sum();
    let labour_total: f64 = lines.iter().map(|l| l.labour).sum();
    let discount_total: f64 = lines.iter().map(|l| l.discount).sum();
    let subtotal: f64 = lines.iter().map(|l| l.total).sum();
    let contingency = subtotal * cp.contingency.clamp(0.0, 1.0);
    let vat = (subtotal + contingency) * cp.vat.clamp(0.0, 1.0);
    let total = subtotal + contingency + vat;
    let mut groups: Vec<GroupTotal> = vec![];
    for l in &lines {
        match groups.iter_mut().find(|g| g.group == l.group) {
            Some(g) => g.total += l.total,
            None => groups.push(GroupTotal { group: l.group.clone(), total: l.total, share: 0.0 }),
        }
    }
    for g in &mut groups {
        g.share = if subtotal > 0.0 { r2(g.total / subtotal) } else { 0.0 };
        g.total = r2(g.total);
    }
    groups.sort_by(|a, b| b.total.partial_cmp(&a.total).unwrap_or(std::cmp::Ordering::Equal));
    let fa = m.totals.floor_area_m2;
    CostReport {
        tier,
        lines,
        groups,
        material_total: r2(material_total),
        labour_total: r2(labour_total),
        discount_total: r2(discount_total),
        subtotal: r2(subtotal),
        contingency: r2(contingency),
        vat: r2(vat),
        total: r2(total),
        per_m2: if fa > 0.0 { r2(total / fa) } else { 0.0 },
        floor_area_m2: fa,
        errors,
    }
}

/// Plan alanını ölçekler (doğrusal kat sayı = √alan oranı); mobilyalar ölçeklenmez.
pub fn scale_plan(scene: &Scene, area_factor: f64) -> Scene {
    let k = area_factor.clamp(0.05, 25.0).sqrt();
    let mut s = scene.clone();
    for l in &mut s.levels {
        for w in &mut l.walls {
            w.a = [w.a[0] * k, w.a[1] * k];
            w.b = [w.b[0] * k, w.b[1] * k];
        }
        for o in &mut l.openings {
            o.offset *= k;
        }
        for r in &mut l.rooms {
            for p in &mut r.polygon {
                *p = [p[0] * k, p[1] * k];
            }
        }
    }
    for o in &mut s.objects {
        o.position[0] *= k;
        o.position[1] *= k;
    }
    s
}

#[derive(Debug, Clone, Serialize)]
pub struct ScalePoint {
    pub factor: f64,
    pub floor_area_m2: f64,
    pub total: f64,
    pub per_m2: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct UnitPoint {
    pub units: u32,
    pub total: f64,
    pub per_unit: f64,
    pub saving: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct TierPoint {
    pub tier: Tier,
    pub label: String,
    pub total: f64,
    pub per_m2: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ScalingReport {
    pub area_curve: Vec<ScalePoint>,
    pub units: Vec<UnitPoint>,
    pub tiers: Vec<TierPoint>,
    /// Alan esnekliği: %1 alan artışında toplamın % değişimi.
    pub elasticity: f64,
}

/// Maliyet ölçeklemesi: alan eğrisi, çoklu konut (seri üretim) ve kalite düzeyleri.
pub fn scaling(scene: &Scene, factors: &[f64], unit_counts: &[u32]) -> ScalingReport {
    let mut area_curve = vec![];
    for &f in factors.iter().take(24) {
        let s = scale_plan(scene, f);
        let r = estimate(&s);
        area_curve.push(ScalePoint { factor: f, floor_area_m2: r.floor_area_m2, total: r.total, per_m2: r.per_m2 });
    }
    let base = estimate(scene);
    let mut units = vec![];
    for &n in unit_counts.iter().take(12) {
        let n = n.clamp(1, 10_000);
        // Seri üretim: malzeme miktarı n katına çıkar, miktar indirimleri buna göre işler;
        // ek olarak ölçek ekonomisi: işçilik öğrenme eğrisi (%90, her iki katta).
        let mut s = scene.clone();
        for r in &mut s.cost.rates {
            r.breaks = r.breaks.iter().map(|(q, d)| (q / n as f64, *d)).collect();
        }
        let r = estimate(&s);
        let learn = 0.9f64.powf((n as f64).log2());
        let labour_saving = r.labour_total * (1.0 - learn);
        let per_unit_sub = r.subtotal - labour_saving;
        let per_unit = per_unit_sub * (1.0 + s.cost.contingency) * (1.0 + s.cost.vat);
        units.push(UnitPoint { units: n, total: r2(per_unit * n as f64), per_unit: r2(per_unit), saving: if base.total > 0.0 { r2(1.0 - per_unit / base.total) } else { 0.0 } });
    }
    let m = measure::measure(scene);
    let tiers = Tier::ALL
        .iter()
        .map(|&t| {
            let r = estimate_with(scene, &m, t);
            TierPoint { tier: t, label: t.label().into(), total: r.total, per_m2: r.per_m2 }
        })
        .collect();
    let elasticity = {
        let a = estimate(&scale_plan(scene, 1.01));
        if base.total > 0.0 {
            r2((a.total / base.total - 1.0) / 0.01)
        } else {
            0.0
        }
    };
    ScalingReport { area_curve, units, tiers, elasticity }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::*;

    fn simple() -> Scene {
        let mut s = Scene::default();
        let l = &mut s.levels[0];
        l.height = 2500.0;
        let pts = [[0.0, 0.0], [4000.0, 0.0], [4000.0, 3000.0], [0.0, 3000.0]];
        for i in 0..4 {
            l.walls.push(Wall { id: format!("W{i}"), a: pts[i], b: pts[(i + 1) % 4], thickness: 200.0, ..Default::default() });
        }
        // zemin "beton" (m² fiyatı 0): kaplama kütüphanesi satırı bu testlerde devreye girmez
        l.rooms.push(Room { id: "R1".into(), name: "Salon".into(), kind: "salon".into(), polygon: pts.to_vec(), floor: "beton".into(), ..Default::default() });
        s.cost.rates = vec![RateItem { id: "parke".into(), name: "Parke".into(), basis: Basis::FloorArea, unit: "m²".into(), material_price: 100.0, labour_price: 50.0, waste: 0.1, breaks: vec![(10.0, 0.05)], ..Default::default() }];
        s.cost.vat = 0.2;
        s.cost.contingency = 0.1;
        s
    }

    #[test]
    fn line_math_is_exact() {
        let s = simple();
        let r = estimate(&s);
        let l = &r.lines[0];
        assert_eq!(l.quantity, 12.0);
        assert_eq!(l.quantity_with_waste, 13.2);
        assert_eq!(l.material, 1320.0);
        assert_eq!(l.labour, 600.0);
        assert_eq!(l.discount, 66.0);
        assert_eq!(l.total, 1854.0);
        assert_eq!(r.contingency, 185.4);
        assert_eq!(r.vat, 407.88);
        assert_eq!(r.total, 2447.28);
        assert_eq!(r.per_m2, 203.94);
    }

    #[test]
    fn tiers_region_and_formula_lines() {
        let mut s = simple();
        s.cost.tier = Tier::Premium;
        s.cost.region_index = 1.2;
        s.cost.rates.push(RateItem { id: "f".into(), name: "Formül".into(), basis: Basis::Formula("floor_area * 2".into()), material_price: 10.0, tiered: false, ..Default::default() });
        s.functions.push(UserFunction { id: "klima".into(), name: "Klima".into(), kind: FunctionKind::Cost, expr: "ceil(floor_area / 20)".into(), unit_price: 1000.0, ..Default::default() });
        let r = estimate(&s);
        let parke = &r.lines[0];
        assert_eq!(parke.material, r2(13.2 * 100.0 * 1.65 * 1.2));
        let f = r.lines.iter().find(|l| l.id == "f").unwrap();
        assert_eq!(f.material, 288.0);
        let k = r.lines.iter().find(|l| l.id == "klima").unwrap();
        assert_eq!(k.quantity, 1.0);
        assert_eq!(k.total, 1200.0);
        assert!(r.errors.is_empty());
    }

    #[test]
    fn scaling_is_monotonic_and_units_save() {
        let s = simple();
        let sc = scaling(&s, &[0.5, 1.0, 2.0], &[1, 4, 16]);
        assert!(sc.area_curve[0].total < sc.area_curve[1].total && sc.area_curve[1].total < sc.area_curve[2].total);
        assert!((sc.area_curve[2].floor_area_m2 - 24.0).abs() < 0.05);
        assert_eq!(sc.units[0].saving, 0.0);
        assert!(sc.units[2].per_unit < sc.units[1].per_unit);
        assert!(sc.tiers[0].total < sc.tiers[1].total && sc.tiers[1].total < sc.tiers[2].total);
        assert!(sc.elasticity > 0.5 && sc.elasticity < 1.5, "{}", sc.elasticity);
    }

    #[test]
    fn material_library_prices_feed_cost() {
        let mut s = simple();
        s.cost.rates.clear();
        s.levels[0].rooms[0].floor = "mermer".into(); // 2.400 ₺/m²
        s.levels[0].walls[0].outside = 1;
        s.levels[0].walls[0].outer = "kaplama-tas".into(); // 1.850 ₺/m²
        let r = estimate(&s);
        let f = r.lines.iter().find(|l| l.id == "zemin-mermer").unwrap();
        assert_eq!(f.material, r2(12.0 * 1.08 * 2400.0));
        let c = r.lines.iter().find(|l| l.id == "cephe-kaplama-tas").unwrap();
        assert_eq!(c.quantity, 10.0); // 4 m × 2,5 m
        assert_eq!(c.material, r2(10.0 * 1.05 * 1850.0));
    }

    #[test]
    fn bad_formula_reports_error() {
        let mut s = simple();
        s.cost.rates.push(RateItem { id: "x".into(), name: "Bozuk".into(), basis: Basis::Formula("nope * 2".into()), material_price: 1.0, ..Default::default() });
        let r = estimate(&s);
        assert_eq!(r.errors.len(), 1);
    }
}
