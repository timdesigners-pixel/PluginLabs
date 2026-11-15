//! Parametrik mobilya ve donatı kataloğu. Modeller kutu parçalarından üretilir;
//! dış model dosyası, marka ya da üçüncü taraf görseli kullanılmaz.

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct CatalogItem {
    pub id: &'static str,
    pub name: &'static str,
    pub group: &'static str,
    /// Genişlik × derinlik × yükseklik (mm).
    pub size: [f64; 3],
    pub price: f64,
    pub rooms: &'static [&'static str],
    /// Varsayılan zemin yüksekliği (mm). Sarkıt lambalar tavana göre konumlanır.
    pub mount: f64,
}

/// Nesnenin yerel koordinatında bir kutu: x genişlik, y yukarı, z derinlik.
/// Merkez tabanın ortasıdır (x, z ∈ [-W/2, W/2]).
#[derive(Debug, Clone)]
pub struct Part {
    pub min: [f64; 3],
    pub max: [f64; 3],
    pub material: &'static str,
}

const fn it(id: &'static str, name: &'static str, group: &'static str, size: [f64; 3], price: f64, rooms: &'static [&'static str]) -> CatalogItem {
    CatalogItem { id, name, group, size, price, rooms, mount: 0.0 }
}

pub fn items() -> Vec<CatalogItem> {
    let mut v = vec![
        it("kanepe-3", "Üçlü kanepe", "Oturma", [2200.0, 920.0, 850.0], 38_000.0, &["salon"]),
        it("berjer", "Berjer", "Oturma", [850.0, 850.0, 900.0], 14_500.0, &["salon", "yatak", "calisma"]),
        it("orta-sehpa", "Orta sehpa", "Masa", [1100.0, 600.0, 420.0], 6_500.0, &["salon"]),
        it("tv-unitesi", "TV ünitesi", "Depolama", [1800.0, 450.0, 520.0], 11_000.0, &["salon"]),
        it("yemek-masasi", "Yemek masası", "Masa", [1600.0, 900.0, 750.0], 16_000.0, &["salon", "mutfak"]),
        it("sandalye", "Sandalye", "Oturma", [450.0, 500.0, 900.0], 3_200.0, &["salon", "mutfak", "calisma"]),
        it("cift-yatak", "Çift kişilik yatak", "Yatak", [1700.0, 2100.0, 1000.0], 32_000.0, &["yatak"]),
        it("tek-yatak", "Tek kişilik yatak", "Yatak", [1000.0, 2050.0, 900.0], 15_000.0, &["yatak"]),
        it("komodin", "Komodin", "Depolama", [500.0, 400.0, 550.0], 3_900.0, &["yatak"]),
        it("gardirop", "Gardırop", "Depolama", [2000.0, 600.0, 2200.0], 27_000.0, &["yatak", "antre"]),
        it("calisma-masasi", "Çalışma masası", "Masa", [1200.0, 600.0, 750.0], 7_500.0, &["calisma", "yatak"]),
        it("kitaplik", "Kitaplık", "Depolama", [900.0, 350.0, 2000.0], 8_000.0, &["salon", "calisma", "yatak"]),
        it("tezgah", "Alt dolap + tezgâh", "Mutfak", [1200.0, 600.0, 900.0], 14_000.0, &["mutfak", "salon"]),
        it("alt-dolap", "Alt dolap", "Mutfak", [600.0, 600.0, 900.0], 6_500.0, &["mutfak", "salon"]),
        it("boy-dolabi", "Boy dolabı", "Mutfak", [600.0, 600.0, 2200.0], 12_500.0, &["mutfak", "salon", "kiler"]),
        it("ada", "Mutfak adası", "Mutfak", [1800.0, 900.0, 900.0], 26_000.0, &["mutfak", "salon"]),
        it("evye", "Evye dolabı", "Mutfak", [800.0, 600.0, 900.0], 11_000.0, &["mutfak", "salon"]),
        it("ocak", "Ocak dolabı", "Mutfak", [600.0, 600.0, 900.0], 13_500.0, &["mutfak", "salon"]),
        it("camasir", "Çamaşır makinesi", "Banyo", [600.0, 600.0, 850.0], 22_000.0, &["banyo", "camasir"]),
        it("merdiven", "Merdiven", "Yapı", [1000.0, 4000.0, 3120.0], 45_000.0, &["salon", "antre"]),
        it("mutfak-tezgahi", "Mutfak tezgâhı (alt + üst dolap)", "Mutfak", [3000.0, 600.0, 2200.0], 48_000.0, &["mutfak"]),
        it("buzdolabi", "Buzdolabı", "Mutfak", [700.0, 700.0, 1850.0], 36_000.0, &["mutfak"]),
        it("dus-kabini", "Duş kabini", "Banyo", [900.0, 900.0, 2000.0], 14_000.0, &["banyo"]),
        it("lavabo", "Lavabo dolabı", "Banyo", [600.0, 450.0, 850.0], 6_000.0, &["banyo"]),
        it("klozet", "Klozet", "Banyo", [380.0, 650.0, 800.0], 7_000.0, &["banyo"]),
        it("hali", "Halı", "Tekstil", [2000.0, 3000.0, 12.0], 8_500.0, &["salon", "yatak"]),
        it("bitki", "Saksı bitkisi", "Dekor", [500.0, 500.0, 1300.0], 1_800.0, &["salon", "calisma", "antre"]),
        it("ayakkabilik", "Ayakkabılık", "Depolama", [1000.0, 380.0, 1000.0], 5_400.0, &["antre"]),
    ];
    v.push(CatalogItem { id: "sarkit-lamba", name: "Sarkıt lamba", group: "Aydınlatma", size: [500.0, 500.0, 320.0], price: 3_500.0, rooms: &["salon", "mutfak", "yatak", "calisma", "antre"], mount: -1.0 });
    v
}

pub fn item(id: &str) -> Option<CatalogItem> {
    items().into_iter().find(|i| i.id == id)
}

fn bx(x0: f64, y0: f64, z0: f64, x1: f64, y1: f64, z1: f64, m: &'static str) -> Part {
    Part { min: [x0, y0, z0], max: [x1, y1, z1], material: m }
}

/// Parçalar, katalogdaki ölçüye göre (size) üretilir. Nesne ölçeği dönüşümde uygulanır.
pub fn parts(id: &str) -> Vec<Part> {
    let Some(item) = item(id) else { return vec![] };
    let [w, d, h] = item.size;
    let (hw, hd) = (w / 2.0, d / 2.0);
    match id {
        "kanepe-3" => vec![
            bx(-hw + 60.0, 0.0, -hd + 60.0, -hw + 120.0, 120.0, -hd + 120.0, "siyah-mat"),
            bx(hw - 120.0, 0.0, -hd + 60.0, hw - 60.0, 120.0, -hd + 120.0, "siyah-mat"),
            bx(-hw + 60.0, 0.0, hd - 120.0, -hw + 120.0, 120.0, hd - 60.0, "siyah-mat"),
            bx(hw - 120.0, 0.0, hd - 120.0, hw - 60.0, 120.0, hd - 60.0, "siyah-mat"),
            bx(-hw, 120.0, -hd, hw, 300.0, hd, "kumas-gri"),
            bx(-hw + 180.0, 300.0, -hd + 230.0, hw - 180.0, 440.0, hd, "kumas-gri"),
            bx(-hw, 300.0, -hd, hw, h, -hd + 230.0, "kumas-gri"),
            bx(-hw, 300.0, -hd + 230.0, -hw + 180.0, 620.0, hd, "kumas-gri"),
            bx(hw - 180.0, 300.0, -hd + 230.0, hw, 620.0, hd, "kumas-gri"),
            bx(-hw + 260.0, 440.0, -hd + 240.0, -hw + 640.0, 760.0, -hd + 380.0, "kumas-lacivert"),
            bx(hw - 640.0, 440.0, -hd + 240.0, hw - 260.0, 760.0, -hd + 380.0, "kumas-lacivert"),
        ],
        "berjer" => vec![
            bx(-hw + 60.0, 0.0, -hd + 60.0, hw - 60.0, 140.0, hd - 60.0, "ahsap-ceviz"),
            bx(-hw, 140.0, -hd, hw, 420.0, hd, "kumas-lacivert"),
            bx(-hw, 420.0, -hd, hw, h, -hd + 180.0, "kumas-lacivert"),
            bx(-hw, 420.0, -hd + 180.0, -hw + 130.0, 640.0, hd, "kumas-lacivert"),
            bx(hw - 130.0, 420.0, -hd + 180.0, hw, 640.0, hd, "kumas-lacivert"),
        ],
        "orta-sehpa" | "yemek-masasi" | "calisma-masasi" => {
            let top = if id == "orta-sehpa" { 40.0 } else { 36.0 };
            let mat = if id == "calisma-masasi" { "ahsap-mese" } else { "ahsap-ceviz" };
            let leg = 50.0;
            let mut v = vec![bx(-hw, h - top, -hd, hw, h, hd, mat)];
            for (sx, sz) in [(-1.0, -1.0), (1.0, -1.0), (-1.0, 1.0), (1.0, 1.0)] {
                let cx = sx * (hw - 60.0);
                let cz = sz * (hd - 60.0);
                v.push(bx(cx - leg / 2.0, 0.0, cz - leg / 2.0, cx + leg / 2.0, h - top, cz + leg / 2.0, "siyah-mat"));
            }
            v
        }
        "sandalye" => vec![
            bx(-hw, 430.0, -hd, hw, 470.0, hd, "ahsap-mese"),
            bx(-hw, 470.0, -hd, hw, h, -hd + 40.0, "ahsap-mese"),
            bx(-hw + 10.0, 0.0, -hd + 10.0, -hw + 40.0, 430.0, -hd + 40.0, "siyah-mat"),
            bx(hw - 40.0, 0.0, -hd + 10.0, hw - 10.0, 430.0, -hd + 40.0, "siyah-mat"),
            bx(-hw + 10.0, 0.0, hd - 40.0, -hw + 40.0, 430.0, hd - 10.0, "siyah-mat"),
            bx(hw - 40.0, 0.0, hd - 40.0, hw - 10.0, 430.0, hd - 10.0, "siyah-mat"),
        ],
        "tv-unitesi" | "komodin" | "ayakkabilik" => vec![
            bx(-hw, 60.0, -hd, hw, h, hd, if id == "komodin" { "ahsap-ceviz" } else { "lake-antrasit" }),
            bx(-hw + 30.0, 0.0, -hd + 30.0, hw - 30.0, 60.0, hd - 30.0, "siyah-mat"),
            bx(-hw + 20.0, h * 0.5, hd, hw - 20.0, h * 0.5 + 8.0, hd + 4.0, "metal-krom"),
        ],
        "cift-yatak" | "tek-yatak" => vec![
            bx(-hw, 0.0, -hd, hw, 300.0, hd, "ahsap-ceviz"),
            bx(-hw + 40.0, 300.0, -hd + 80.0, hw - 40.0, 520.0, hd - 30.0, "kumas-beyaz"),
            bx(-hw, 0.0, -hd, hw, h, -hd + 80.0, "kumas-gri"),
            bx(-hw + 80.0, 520.0, -hd + 110.0, hw - 80.0, 610.0, -hd + 480.0, "kumas-beyaz"),
            bx(-hw + 40.0, 525.0, -hd + 700.0, hw - 40.0, 560.0, hd - 30.0, "kumas-lacivert"),
        ],
        "gardirop" | "kitaplik" => {
            let mat = if id == "gardirop" { "lake-beyaz" } else { "ahsap-mese" };
            let mut v = vec![bx(-hw, 0.0, -hd, hw, h, hd, mat)];
            if id == "kitaplik" {
                let mut y = 380.0;
                while y < h - 100.0 {
                    v.push(bx(-hw + 30.0, y, hd - 4.0, hw - 30.0, y + 24.0, hd + 2.0, "ahsap-ceviz"));
                    y += 400.0;
                }
            } else {
                v.push(bx(-2.0, 100.0, hd, 2.0, h - 60.0, hd + 6.0, "siyah-mat"));
                v.push(bx(-80.0, h * 0.45, hd + 6.0, -40.0, h * 0.55, hd + 30.0, "metal-krom"));
                v.push(bx(40.0, h * 0.45, hd + 6.0, 80.0, h * 0.55, hd + 30.0, "metal-krom"));
            }
            v
        }
        "mutfak-tezgahi" => vec![
            bx(-hw, 100.0, -hd, hw, 860.0, hd, "lake-beyaz"),
            bx(-hw, 0.0, -hd + 40.0, hw, 100.0, hd - 40.0, "siyah-mat"),
            bx(-hw, 860.0, -hd, hw, 900.0, hd + 20.0, "mermer"),
            bx(-hw, 1450.0, -hd, hw, h, -hd + 350.0, "lake-beyaz"),
            bx(-hw + 900.0, 900.0, -hd + 150.0, -hw + 1500.0, 915.0, hd - 100.0, "metal-krom"),
            bx(hw - 900.0, 900.0, -hd + 120.0, hw - 300.0, 905.0, hd - 80.0, "siyah-mat"),
        ],
        "tezgah" | "alt-dolap" | "evye" | "ocak" | "ada" => {
            let mut v = vec![
                bx(-hw, 100.0, -hd, hw, h - 40.0, hd, "lake-beyaz"),
                bx(-hw + 20.0, 0.0, -hd + 40.0, hw - 20.0, 100.0, hd - 40.0, "siyah-mat"),
                bx(-hw, h - 40.0, -hd, hw, h, hd + 20.0, "mermer"),
            ];
            if id == "evye" {
                v.push(bx(-hw + 120.0, h, -hd + 120.0, hw - 120.0, h + 6.0, hd - 100.0, "metal-krom"));
                v.push(bx(-20.0, h, -hd + 40.0, 20.0, h + 260.0, -hd + 90.0, "metal-krom"));
            }
            if id == "ocak" {
                v.push(bx(-hw + 40.0, h, -hd + 60.0, hw - 40.0, h + 5.0, hd - 60.0, "siyah-mat"));
            }
            for k in 0..((w / 600.0).round() as i32).max(1) {
                let x0 = -hw + k as f64 * (w / ((w / 600.0).round().max(1.0)));
                v.push(bx(x0 + 260.0, h - 160.0, hd, x0 + 340.0, h - 140.0, hd + 25.0, "metal-krom"));
            }
            v
        }
        "boy-dolabi" => vec![
            bx(-hw, 100.0, -hd, hw, h, hd, "lake-beyaz"),
            bx(-hw + 20.0, 0.0, -hd + 40.0, hw - 20.0, 100.0, hd - 40.0, "siyah-mat"),
            bx(hw - 80.0, h * 0.4, hd, hw - 60.0, h * 0.6, hd + 25.0, "metal-krom"),
        ],
        "camasir" => vec![
            bx(-hw, 0.0, -hd, hw, h, hd, "lake-beyaz"),
            bx(-180.0, 200.0, hd, 180.0, 560.0, hd + 20.0, "cam"),
            bx(-hw + 30.0, h - 120.0, hd, hw - 30.0, h - 30.0, hd + 6.0, "siyah-mat"),
        ],
        "merdiven" => {
            let steps = 18;
            let rise = h / steps as f64;
            let run = d / steps as f64;
            (0..steps)
                .map(|k| bx(-hw, 0.0, -hd + k as f64 * run, hw, (k + 1) as f64 * rise, -hd + (k + 1) as f64 * run, "beton"))
                .collect()
        }
        "buzdolabi" => vec![
            bx(-hw, 0.0, -hd, hw, h, hd, "metal-krom"),
            bx(-hw + 20.0, 600.0, hd, -hw + 50.0, 1400.0, hd + 40.0, "siyah-mat"),
        ],
        "dus-kabini" => vec![
            bx(-hw, 0.0, -hd, hw, 60.0, hd, "seramik-beyaz"),
            bx(-hw, 60.0, hd - 8.0, hw, h, hd, "cam"),
            bx(hw - 8.0, 60.0, -hd, hw, h, hd, "cam"),
            bx(-hw + 100.0, 1900.0, -hd + 40.0, -hw + 300.0, 1920.0, -hd + 240.0, "metal-krom"),
        ],
        "lavabo" => vec![
            bx(-hw, 150.0, -hd, hw, 700.0, hd, "ahsap-mese"),
            bx(-hw, 700.0, -hd, hw, h, hd, "seramik-beyaz"),
            bx(-30.0, h, -hd + 40.0, 30.0, h + 180.0, -hd + 90.0, "metal-krom"),
            bx(-hw + 20.0, 1100.0, -hd, hw - 20.0, 1800.0, -hd + 20.0, "ayna"),
        ],
        "klozet" => vec![
            bx(-hw + 60.0, 0.0, -hd + 180.0, hw - 60.0, 400.0, hd, "seramik-beyaz"),
            bx(-hw, 380.0, -hd + 150.0, hw, 430.0, hd, "seramik-beyaz"),
            bx(-hw, 400.0, -hd, hw, h, -hd + 180.0, "seramik-beyaz"),
        ],
        "hali" => vec![bx(-hw, 0.0, -hd, hw, h, hd, "hali-bej")],
        "bitki" => vec![
            bx(-160.0, 0.0, -160.0, 160.0, 380.0, 160.0, "seramik-beyaz"),
            bx(-hw * 0.8, 380.0, -hd * 0.8, hw * 0.8, 820.0, hd * 0.8, "bitki-yesil"),
            bx(-hw * 0.6, 820.0, -hd * 0.6, hw * 0.6, 1100.0, hd * 0.6, "bitki-yesil"),
            bx(-hw * 0.35, 1100.0, -hd * 0.35, hw * 0.35, h, hd * 0.35, "bitki-yesil"),
        ],
        "sarkit-lamba" => vec![
            bx(-6.0, 260.0, -6.0, 6.0, 900.0, 6.0, "siyah-mat"),
            bx(-hw, 60.0, -hd, hw, h - 60.0, hd, "lamba-isik"),
            bx(-hw - 10.0, h - 60.0, -hd - 10.0, hw + 10.0, h, hd + 10.0, "siyah-mat"),
        ],
        _ => vec![bx(-hw, 0.0, -hd, hw, h, hd, "lake-beyaz")],
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn every_item_has_parts_inside_reasonable_bounds() {
        for i in items() {
            let p = parts(i.id);
            assert!(!p.is_empty(), "{}", i.id);
            for q in &p {
                for k in 0..3 {
                    assert!(q.min[k] <= q.max[k], "{} ters kutu", i.id);
                }
            }
        }
        assert_eq!(items().iter().filter(|i| i.id == "kanepe-3").count(), 1);
    }
}
