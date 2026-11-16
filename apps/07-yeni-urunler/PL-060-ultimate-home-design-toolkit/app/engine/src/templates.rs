//! Varsayılan malzemeler, örnek birim fiyatlar ve "Evinizi hazırlayın" plan üreticisi.
//!
//! Birim fiyatlar yalnız başlangıç değerleridir; kullanıcı Maliyet ekranında düzenler.

use crate::catalog;
use crate::model::*;

fn mat(id: &str, name: &str, cat: &str, color: [f32; 3], roughness: f32, metallic: f32, price_m2: f64) -> Material {
    // türüne göre varsayılan prosedürel doku
    let (texture, texture_scale) = if id.starts_with("parke") {
        ("parke", 1200.0)
    } else if id.starts_with("ahsap") || id == "kaplama-ahsap" || id == "kapi-ahsap" || id == "govde" {
        ("ahsap", 900.0)
    } else if id.starts_with("seramik") {
        ("karo", 600.0)
    } else if id == "mermer" {
        ("mermer", 1400.0)
    } else if id.starts_with("beton") || id == "dis-cephe" {
        ("beton", 1600.0)
    } else if id.starts_with("kumas") {
        ("kumas", 1000.0)
    } else if id.starts_with("hali") {
        ("hali", 1000.0)
    } else if id == "cim" || id == "zemin-dis" {
        ("cim", 2000.0)
    } else if id == "cakil" || id == "kaplama-tas" {
        ("tas", 900.0)
    } else {
        ("", 1000.0)
    };
    Material { id: id.into(), name: name.into(), color, roughness, metallic, emission: 0.0, opacity: 1.0, price_m2, category: cat.into(), texture: texture.into(), texture_scale }
}

pub fn default_materials() -> Vec<Material> {
    let mut v = vec![
        mat("boya-beyaz", "Duvar boyası · kırık beyaz", "duvar", [0.86, 0.85, 0.82], 0.9, 0.0, 0.0),
        mat("boya-krem", "Duvar boyası · krem", "duvar", [0.88, 0.82, 0.70], 0.9, 0.0, 0.0),
        mat("boya-adacayi", "Duvar boyası · adaçayı", "duvar", [0.56, 0.64, 0.55], 0.9, 0.0, 0.0),
        mat("dis-cephe", "Dış cephe sıvası", "duvar", [0.78, 0.76, 0.72], 0.95, 0.0, 0.0),
        mat("tavan-beyaz", "Tavan boyası", "tavan", [0.92, 0.92, 0.91], 0.95, 0.0, 0.0),
        mat("parke-mese", "Laminat parke · meşe", "zemin", [0.62, 0.45, 0.29], 0.55, 0.0, 650.0),
        mat("parke-ceviz", "Laminat parke · ceviz", "zemin", [0.40, 0.27, 0.17], 0.5, 0.0, 780.0),
        mat("seramik-gri", "Seramik · açık gri", "zemin", [0.70, 0.71, 0.72], 0.35, 0.0, 750.0),
        mat("seramik-beyaz", "Seramik · beyaz", "zemin", [0.93, 0.93, 0.93], 0.2, 0.0, 700.0),
        mat("mermer", "Mermer", "zemin", [0.90, 0.89, 0.87], 0.15, 0.0, 2400.0),
        mat("beton", "Beton", "zemin", [0.55, 0.55, 0.54], 0.9, 0.0, 0.0),
        mat("zemin-dis", "Dış zemin", "dis", [0.20, 0.26, 0.17], 1.0, 0.0, 0.0),
        mat("cam", "Cam", "dograma", [0.85, 0.92, 0.95], 0.02, 0.0, 0.0),
        mat("pvc-beyaz", "PVC doğrama", "dograma", [0.94, 0.94, 0.94], 0.4, 0.0, 0.0),
        mat("kapi-ahsap", "Kapı · ahşap", "dograma", [0.55, 0.40, 0.27], 0.5, 0.0, 0.0),
        mat("metal-krom", "Metal · krom", "metal", [0.82, 0.83, 0.85], 0.15, 1.0, 0.0),
        mat("ayna", "Ayna", "metal", [0.92, 0.93, 0.95], 0.0, 1.0, 0.0),
        mat("siyah-mat", "Mat siyah", "genel", [0.04, 0.04, 0.045], 0.7, 0.0, 0.0),
        mat("lake-beyaz", "Lake · beyaz", "mobilya", [0.90, 0.90, 0.89], 0.3, 0.0, 0.0),
        mat("lake-antrasit", "Lake · antrasit", "mobilya", [0.18, 0.19, 0.21], 0.35, 0.0, 0.0),
        mat("ahsap-ceviz", "Ahşap · ceviz", "mobilya", [0.36, 0.23, 0.14], 0.45, 0.0, 0.0),
        mat("ahsap-mese", "Ahşap · meşe", "mobilya", [0.70, 0.54, 0.36], 0.5, 0.0, 0.0),
        mat("kumas-gri", "Kumaş · gri", "tekstil", [0.42, 0.43, 0.45], 0.95, 0.0, 0.0),
        mat("kumas-lacivert", "Kumaş · lacivert", "tekstil", [0.13, 0.19, 0.34], 0.95, 0.0, 0.0),
        mat("kumas-beyaz", "Kumaş · beyaz", "tekstil", [0.88, 0.87, 0.84], 0.95, 0.0, 0.0),
        mat("hali-bej", "Halı · bej", "tekstil", [0.72, 0.64, 0.52], 1.0, 0.0, 0.0),
        mat("bitki-yesil", "Bitki", "dekor", [0.16, 0.36, 0.14], 0.8, 0.0, 0.0),
    ];
    for (id, name, c) in [
        ("kirik-beyaz", "Kırık beyaz", [0.88, 0.87, 0.83]),
        ("kum-beji", "Kum beji", [0.80, 0.72, 0.58]),
        ("acik-gri", "Açık gri", [0.72, 0.73, 0.74]),
        ("antrasit", "Antrasit", [0.22, 0.23, 0.25]),
        ("adacayi", "Adaçayı", [0.56, 0.64, 0.55]),
        ("toprak", "Toprak", [0.58, 0.38, 0.27]),
        ("krem", "Krem", [0.90, 0.84, 0.71]),
        ("beyaz", "Beyaz", [0.94, 0.94, 0.93]),
    ] {
        v.push(mat(&format!("dis-{id}"), &format!("Dış cephe boyası · {name}"), "cephe", c, 0.85, 0.0, 0.0));
        v.push(mat(&format!("ic-{id}"), &format!("İç cephe boyası · {name}"), "ic-boya", c, 0.9, 0.0, 0.0));
    }
    v.push(mat("kaplama-tas", "Cephe kaplaması · taş", "kaplama", [0.55, 0.51, 0.46], 0.9, 0.0, 1_850.0));
    v.push(mat("kaplama-ahsap", "Cephe kaplaması · ahşap", "kaplama", [0.52, 0.36, 0.22], 0.6, 0.0, 1_400.0));
    v.push(mat("kaplama-kompozit", "Cephe kaplaması · alüminyum kompozit", "kaplama", [0.30, 0.32, 0.35], 0.3, 0.6, 1_650.0));
    v.push(mat("beton-kabuk", "Beton kabuk", "kabuk", [0.62, 0.62, 0.60], 0.85, 0.0, 0.0));
    v.push(mat("ekran", "Ekran", "genel", [0.02, 0.02, 0.03], 0.08, 0.0, 0.0));
    v.push(mat("cim", "Çim", "dis", [0.20, 0.45, 0.13], 1.0, 0.0, 0.0));
    v.push(mat("cakil", "Çakıl taşı", "dis", [0.62, 0.60, 0.57], 0.95, 0.0, 0.0));
    v.push(mat("govde", "Ağaç gövdesi", "dis", [0.30, 0.20, 0.12], 0.9, 0.0, 0.0));
    v.push(mat("yaprak-koyu", "Yaprak · koyu", "dis", [0.09, 0.27, 0.10], 0.85, 0.0, 0.0));
    v.push(mat("tablo-a", "Tablo · kiremit", "dekor", [0.80, 0.36, 0.22], 0.7, 0.0, 0.0));
    v.push(mat("tablo-b", "Tablo · gece mavisi", "dekor", [0.15, 0.30, 0.50], 0.7, 0.0, 0.0));
    v.push(mat("tablo-c", "Tablo · kum", "dekor", [0.90, 0.80, 0.56], 0.7, 0.0, 0.0));
    let mut lamp = mat("lamba-isik", "Lamba ışığı", "isik", [1.0, 0.86, 0.66], 0.5, 0.0, 0.0);
    lamp.emission = 9.0;
    v.push(lamp);
    for m in &mut v {
        if m.id == "cam" {
            m.opacity = 0.12;
        }
    }
    v
}

fn rate(id: &str, name: &str, group: &str, basis: Basis, unit: &str, mat: f64, lab: f64, waste: f64, breaks: Vec<(f64, f64)>, tiered: bool) -> RateItem {
    RateItem { id: id.into(), name: name.into(), group: group.into(), basis, unit: unit.into(), material_price: mat, labour_price: lab, waste, breaks, tiered, enabled: true }
}

pub fn default_rates() -> Vec<RateItem> {
    vec![
        rate("parke", "Parke döşeme işçiliği (kuru alanlar)", "Zemin", Basis::Formula("floor_area - wet_area".into()), "m²", 0.0, 180.0, 0.0, vec![(100.0, 0.04), (300.0, 0.08)], true),
        rate("seramik", "Seramik döşeme işçiliği (ıslak hacimler)", "Zemin", Basis::WetArea, "m²", 0.0, 450.0, 0.0, vec![(60.0, 0.05)], true),
        rate("supurgelik", "Süpürgelik", "Zemin", Basis::Skirting, "m", 120.0, 45.0, 0.05, vec![], true),
        rate("siva-tamir", "Alçı ve sıva onarımı", "Duvar", Basis::WallNetArea, "m²", 60.0, 90.0, 0.0, vec![], false),
        rate("boya", "İç cephe boyası (malzeme)", "Duvar", Basis::PaintLitres, "lt", 260.0, 0.0, 0.05, vec![(50.0, 0.06), (150.0, 0.12)], true),
        rate("boya-iscilik", "Boya işçiliği (duvar)", "Duvar", Basis::WallNetArea, "m²", 0.0, 140.0, 0.0, vec![], false),
        rate("tavan-iscilik", "Tavan boyası işçiliği", "Duvar", Basis::CeilingArea, "m²", 0.0, 95.0, 0.0, vec![], false),
        rate("ic-kapi", "İç kapı (takım)", "Doğrama", Basis::Doors, "adet", 9_500.0, 1_500.0, 0.0, vec![(6.0, 0.05)], true),
        rate("pencere", "PVC pencere ve cam", "Doğrama", Basis::Formula("window_area".into()), "m²", 7_200.0, 900.0, 0.0, vec![], true),
        rate("elektrik", "Elektrik tesisatı yenileme", "Tesisat", Basis::FloorArea, "m²", 300.0, 350.0, 0.0, vec![], true),
        rate("sihhi", "Sıhhi tesisat", "Tesisat", Basis::WetArea, "m²", 900.0, 800.0, 0.0, vec![], true),
        rate("aydinlatma", "Aydınlatma noktası", "Tesisat", Basis::Rooms, "adet", 2_500.0, 400.0, 0.0, vec![], true),
        rate("temizlik", "İnşaat sonrası temizlik ve nakliye", "Genel", Basis::Fixed, "sabit", 0.0, 12_000.0, 0.0, vec![], false),
    ]
}

/// Model adımı: seçilen modül adetlerinden zemin kat dizilimi kurar (uzun kenarlar yan yana).
pub fn layout_modules(counts: &[(u32, u32)]) -> Vec<Module> {
    let mut out = vec![];
    let mut y = 0.0;
    let mut n = 0;
    for &(len, qty) in counts {
        if !crate::modules::LENGTHS.contains(&len) {
            continue;
        }
        for _ in 0..qty.min(12) {
            n += 1;
            out.push(Module { id: format!("M{n}"), length: len, floor: 0, position: [0.0, y], rotated: false, on: None });
            y += crate::modules::WIDTH;
        }
    }
    out
}

/// Boş proje: modül seçilmemiş tek katlı sahne.
pub fn new_project(project_no: &str) -> Scene {
    let mut s = Scene { name: "Yeni proje".into(), project_no: project_no.into(), ..Default::default() };
    s.levels[0].walls.clear();
    s
}

fn add(s: &mut Scene, level: &str, cat: &str, x: f64, y: f64, rot: f64) {
    let Some(item) = catalog::item(cat) else { return };
    let n = s.objects.len() + 1;
    let h = s.standard.net_height;
    let z = if item.mount < 0.0 { h - 900.0 } else { item.mount };
    s.objects.push(Object { id: format!("N{n}"), name: item.name.into(), mesh: format!("cat:{cat}"), level: level.into(), position: [x, y, z], rotation: rot, scale: [1.0; 3], material: None, price: item.price, quantity: 1, motor: None });
}

fn op(s: &mut Scene, wall: &str, std: &str, offset: f64, sill: Option<f64>) {
    let st = crate::plan::standard_openings().into_iter().find(|o| o.id == std).unwrap();
    let l = &mut s.levels[0];
    let id = format!("{}{}", if st.kind == OpeningKind::Door { "K" } else { "P" }, l.openings.len() + 1);
    l.openings.push(Opening { id, wall: wall.into(), kind: st.kind, offset, width: st.width, height: st.height, sill: sill.unwrap_or(st.sill), price: 0.0, swing: "sol-ice".into() });
}

/// Örnek proje: iki adet 4 × 10 modül, bölmeler, mahaller, kapı/pencere ve mobilya.
pub fn demo_scene() -> Scene {
    let mut s = new_project("UHD-2026-000001");
    s.name = "Örnek proje · 2 × (4 × 10)".into();
    s.modules = layout_modules(&[(10, 2)]);
    crate::modules::rebuild(&mut s);
    let t = s.standard.partition;
    for (id, a, b) in [("B1", [2000.0, 4000.0], [8000.0, 4000.0]), ("B2", [3800.0, 4000.0], [3800.0, 8000.0]), ("B3", [6000.0, 4000.0], [6000.0, 8000.0])] {
        s.levels[0].walls.push(Wall { id: id.into(), a, b, thickness: t, ..Default::default() });
    }
    op(&mut s, "M1-G2000", "dis-kapi", 300.0, None);
    op(&mut s, "M1-G2000", "p250", 2400.0, None);
    op(&mut s, "M1-D0", "p140", 1300.0, Some(1000.0));
    op(&mut s, "M1-B0", "p200", 1000.0, None);
    op(&mut s, "B1", "ic-kapi", 600.0, None);
    op(&mut s, "B1", "ic-kapi", 2400.0, None);
    op(&mut s, "B1", "ic-kapi", 4600.0, None);
    op(&mut s, "M2-K2000", "p140", 200.0, None);
    op(&mut s, "M2-K2000", "p70", 2550.0, None);
    op(&mut s, "M2-K2000", "p140", 4300.0, None);
    op(&mut s, "M2-B0", "p140", 1300.0, None);
    op(&mut s, "M2-D0", "p200", 1000.0, None);
    for (p, kind, name) in [([5000.0, 2000.0], "salon", "Salon ve mutfak"), ([2000.0, 6000.0], "yatak", "Ebeveyn yatak odası"), ([4900.0, 6000.0], "banyo", "Banyo"), ([8000.0, 6000.0], "yatak", "Çocuk odası")] {
        crate::plan::name_room(&mut s, "L0", p, kind, Some(name.into())).expect("örnek mahal kapalı olmalı");
    }
    let f = [
        ("kanepe-3", 585.0, 2000.0, -90.0),
        ("tv-unitesi", 3700.0, 2000.0, 90.0),
        ("hali", 2100.0, 2000.0, 0.0),
        ("orta-sehpa", 2000.0, 2000.0, 90.0),
        ("berjer", 2050.0, 3420.0, 180.0),
        ("sarkit-lamba", 2100.0, 2000.0, 0.0),
        ("ocak", 9575.0, 450.0, 90.0),
        ("tezgah", 9575.0, 1350.0, 90.0),
        ("evye", 9575.0, 2350.0, 90.0),
        ("buzdolabi", 9525.0, 3500.0, 90.0),
        ("ada", 7600.0, 2000.0, 90.0),
        ("yemek-masasi", 5800.0, 2600.0, 0.0),
        ("sandalye", 5400.0, 1950.0, 0.0),
        ("sandalye", 6200.0, 1950.0, 0.0),
        ("sandalye", 5400.0, 3250.0, 180.0),
        ("sandalye", 6200.0, 3250.0, 180.0),
        ("sarkit-lamba", 5800.0, 2600.0, 0.0),
        ("sarkit-lamba", 7600.0, 2000.0, 0.0),
        ("bitki", 4300.0, 3600.0, 0.0),
        ("cift-yatak", 2700.0, 6000.0, 90.0),
        ("komodin", 3500.0, 4900.0, 90.0),
        ("komodin", 3500.0, 7100.0, 90.0),
        ("gardirop", 1300.0, 4425.0, 0.0),
        ("sarkit-lamba", 2000.0, 6000.0, 0.0),
        ("dus-kabini", 5500.0, 7425.0, 180.0),
        ("klozet", 4300.0, 7550.0, 180.0),
        ("lavabo", 4075.0, 5600.0, -90.0),
        ("camasir", 5650.0, 4500.0, 90.0),
        ("tek-yatak", 6700.0, 6850.0, 180.0),
        ("calisma-masasi", 9575.0, 6000.0, 90.0),
        ("sandalye", 9000.0, 6000.0, -90.0),
        ("gardirop", 8800.0, 4425.0, 0.0),
        ("sarkit-lamba", 8000.0, 6000.0, 0.0),
    ];
    for (c, x, y, r) in f {
        add(&mut s, "L0", c, x, y, r);
    }
    s.functions = vec![
        UserFunction { id: "seramik_kutu".into(), name: "Seramik kutusu (1,44 m²/kutu)".into(), kind: FunctionKind::Measure, expr: "ceil(wet_area * 1.10 / 1.44)".into(), unit: "kutu".into(), ..Default::default() },
        UserFunction { id: "klima".into(), name: "Klima (her 20 m² kuru alana 1)".into(), kind: FunctionKind::Cost, expr: "ceil((floor_area - wet_area) / 20)".into(), unit: "adet".into(), is_amount: false, unit_price: 21_000.0, enabled: true },
    ];
    s.camera = Camera { eye: [-6500.0, 11000.0, -7500.0], target: [5000.0, 800.0, 4000.0], fov: 45.0 };
    s
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geom;
    #[test]
    fn demo_is_consistent() {
        let s = demo_scene();
        let m = crate::measure::measure(&s);
        assert!(m.warnings.is_empty(), "{:?}", m.warnings);
        assert_eq!(m.rooms.len(), 4);
        for o in &s.objects {
            let p = [o.position[0], o.position[1]];
            assert!(s.levels[0].rooms.iter().any(|r| geom::point_in_poly(p, &r.polygon)), "{} ({:?}) oda dışında", o.name, p);
        }
        for o in &s.levels[0].openings {
            crate::plan::validate_opening(&s.levels[0], o).unwrap_or_else(|e| panic!("{}: {e}", o.id));
        }
        // net alan: 2 modül × 36,56 m² + açılan birleşim bandı − bölmeler
        assert!(m.totals.floor_area_m2 > 66.0 && m.totals.floor_area_m2 < 74.5, "{}", m.totals.floor_area_m2);
    }

    #[test]
    fn layout_places_modules_side_by_side() {
        let m = layout_modules(&[(4, 1), (10, 2), (11, 3)]);
        assert_eq!(m.len(), 3);
        assert_eq!(m[2].position, [0.0, 8000.0]);
    }
}
