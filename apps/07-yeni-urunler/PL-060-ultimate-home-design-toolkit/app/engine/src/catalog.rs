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
/// Parçanın biçimi; hepsi `min`–`max` kutusunun içine oturur.
#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
#[serde(rename_all = "lowercase", tag = "type", content = "r")]
pub enum Shape {
    Box,
    /// Kenarları `r` mm yuvarlatılmış kutu (minder, şilte, gövde).
    Round(f64),
    /// Dikey silindir (ayak, direk, abajur, saksı).
    Cyl,
    /// Elipsoit (yaprak kümesi, ampul).
    Ball,
}

#[derive(Debug, Clone)]
pub struct Part {
    pub min: [f64; 3],
    pub max: [f64; 3],
    pub material: &'static str,
    pub shape: Shape,
}

const fn it(id: &'static str, name: &'static str, group: &'static str, size: [f64; 3], price: f64, rooms: &'static [&'static str]) -> CatalogItem {
    CatalogItem { id, name, group, size, price, rooms, mount: 0.0 }
}

pub fn items() -> Vec<CatalogItem> {
    let mut v = vec![
        it("kanepe-3", "Üçlü kanepe", "Oturma", [2200.0, 920.0, 850.0], 38_000.0, &["salon"]),
        it("kanepe-2", "İkili kanepe", "Oturma", [1600.0, 900.0, 850.0], 27_000.0, &["salon", "calisma"]),
        it("kose-koltuk", "Köşe koltuk", "Oturma", [2600.0, 1800.0, 850.0], 52_000.0, &["salon"]),
        it("puf", "Puf", "Oturma", [600.0, 600.0, 420.0], 3_400.0, &["salon", "yatak"]),
        it("bar-taburesi", "Bar taburesi", "Oturma", [400.0, 400.0, 750.0], 2_600.0, &["mutfak", "salon"]),
        it("konsol", "Konsol", "Depolama", [1200.0, 400.0, 800.0], 7_800.0, &["antre", "salon"]),
        it("boy-aynasi", "Boy aynası", "Dekor", [600.0, 60.0, 1700.0], 2_900.0, &["antre", "yatak", "giyinme"]),
        it("kolon", "Kolon 30 × 30", "Yapı", [300.0, 300.0, 2850.0], 0.0, &["salon"]),
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
    // konumlu ürünler: mount ≥ 0 zeminden yükseklik, -1 sarkıt (tavandan 90 cm), -2 tavana gömme
    let m = |id, name, group, size, price, rooms, mount| CatalogItem { id, name, group, size, price, rooms, mount };
    v.extend([
        m("avize", "Avize", "Aydınlatma", [800.0, 800.0, 520.0], 9_800.0, &["salon", "yatak"] as &[&str], -1.0),
        m("lambader", "Lambader", "Aydınlatma", [420.0, 420.0, 1650.0], 4_200.0, &["salon", "yatak", "calisma"], 0.0),
        m("ankastre-spot", "Ankastre spot", "Aydınlatma", [120.0, 120.0, 14.0], 480.0, &["salon", "mutfak", "banyo", "antre"], -2.0),
        m("aplik", "Aplik", "Aydınlatma", [160.0, 110.0, 260.0], 1_450.0, &["antre", "yatak", "banyo"], 1700.0),
        m("masa-lambasi", "Masa lambası", "Aydınlatma", [260.0, 260.0, 460.0], 1_650.0, &["yatak", "calisma"], 550.0),
        m("tv-55", "TV 55 inç", "Elektronik", [1230.0, 60.0, 710.0], 28_000.0, &["salon", "yatak"], 1000.0),
        m("tv-65", "TV 65 inç", "Elektronik", [1450.0, 60.0, 830.0], 42_000.0, &["salon"], 950.0),
        m("soundbar", "Soundbar", "Elektronik", [900.0, 100.0, 70.0], 6_500.0, &["salon"], 530.0),
        m("hoparlor", "Kule hoparlör", "Elektronik", [250.0, 300.0, 1000.0], 9_000.0, &["salon"], 0.0),
        m("laptop", "Dizüstü bilgisayar", "Elektronik", [340.0, 240.0, 230.0], 38_000.0, &["calisma"], 750.0),
        m("oyun-konsolu", "Oyun konsolu", "Elektronik", [300.0, 250.0, 80.0], 21_000.0, &["salon"], 530.0),
        m("tablo-yatay", "Tablo · yatay", "Tablo", [1000.0, 30.0, 700.0], 2_400.0, &["salon", "yatak", "antre"], 1300.0),
        m("tablo-dikey", "Tablo · dikey", "Tablo", [500.0, 30.0, 700.0], 1_600.0, &["salon", "yatak", "antre"], 1350.0),
        m("tablo-uclu", "Tablo · üçlü set", "Tablo", [1560.0, 30.0, 600.0], 3_900.0, &["salon", "yatak"], 1350.0),
        m("agac", "Ağaç", "Dış mekân", [2600.0, 2600.0, 4500.0], 6_500.0, &["dis"], 0.0),
        m("cam-agaci", "Çam ağacı", "Dış mekân", [1800.0, 1800.0, 4000.0], 5_200.0, &["dis"], 0.0),
        m("cali", "Çalı", "Dış mekân", [900.0, 900.0, 800.0], 650.0, &["dis"], 0.0),
        m("cim-alan", "Dekoratif çim", "Dış mekân", [3000.0, 3000.0, 25.0], 1_900.0, &["dis"], 0.0),
        m("cakil-alan", "Dekoratif çakıl taşı", "Dış mekân", [2000.0, 2000.0, 20.0], 1_400.0, &["dis"], 0.0),
        m("tas-yol", "Basamak taşları", "Dış mekân", [600.0, 2400.0, 30.0], 1_200.0, &["dis"], 0.0),
        m("bahce-lambasi", "Bahçe lambası", "Dış mekân", [200.0, 200.0, 900.0], 1_850.0, &["dis"], 0.0),
        m("sezlong", "Şezlong", "Dış mekân", [700.0, 1900.0, 380.0], 7_400.0, &["dis"], 0.0),
        m("saksi-buyuk", "Büyük saksı", "Dış mekân", [600.0, 600.0, 1100.0], 2_100.0, &["dis"], 0.0),
    ]);
    v.push(CatalogItem { id: "sarkit-lamba", name: "Sarkıt lamba", group: "Aydınlatma", size: [500.0, 500.0, 320.0], price: 3_500.0, rooms: &["salon", "mutfak", "yatak", "calisma", "antre"], mount: -1.0 });
    v
}

pub fn item(id: &str) -> Option<CatalogItem> {
    items().into_iter().find(|i| i.id == id)
}

fn bx(x0: f64, y0: f64, z0: f64, x1: f64, y1: f64, z1: f64, m: &'static str) -> Part {
    Part { min: [x0, y0, z0], max: [x1, y1, z1], material: m, shape: Shape::Box }
}

/// Kutu parçalarına gerçekçi biçim atar: kumaş ve şilte yuvarlatılır, ayak ve direkler
/// silindir, yaprak ve ampuller elipsoit olur.
fn refine(id: &str, parts: &mut [Part]) {
    for p in parts.iter_mut() {
        let d = [p.max[0] - p.min[0], p.max[1] - p.min[1], p.max[2] - p.min[2]];
        let least = d[0].min(d[1]).min(d[2]);
        let m = p.material;
        p.shape = if m == "bitki-yesil" || m == "yaprak-koyu" {
            Shape::Ball
        } else if m == "govde" {
            Shape::Cyl
        } else if m == "lamba-isik" {
            match id {
                "avize" => Shape::Ball,
                "aplik" => Shape::Round(25.0),
                _ => Shape::Cyl,
            }
        } else if m.starts_with("kumas") || m == "hali-bej" && least > 40.0 {
            if least >= 50.0 { Shape::Round((least * 0.32).min(60.0)) } else { Shape::Box }
        } else if m == "seramik-beyaz" || (m == "beton" && id == "saksi-buyuk") {
            if matches!(id, "bitki" | "saksi-buyuk") { Shape::Cyl } else if least >= 40.0 { Shape::Round((least * 0.3).min(40.0)) } else { Shape::Box }
        } else if d[0] <= 90.0 && d[2] <= 90.0 && d[1] >= 120.0 && matches!(m, "siyah-mat" | "metal-krom" | "ahsap-ceviz" | "ahsap-mese") {
            Shape::Cyl
        } else if (m.starts_with("lake") || (m == "metal-krom" && id == "buzdolabi")) && least >= 200.0 {
            Shape::Round(14.0)
        } else if id == "puf" && m == "siyah-mat" {
            Shape::Cyl
        } else {
            Shape::Box
        };
    }
}

/// Parçalar, katalogdaki ölçüye göre (size) üretilir. Nesne ölçeği dönüşümde uygulanır.
pub fn parts(id: &str) -> Vec<Part> {
    let mut v = raw_parts(id);
    refine(id, &mut v);
    v
}

fn raw_parts(id: &str) -> Vec<Part> {
    let Some(item) = item(id) else { return vec![] };
    let [w, d, h] = item.size;
    let (hw, hd) = (w / 2.0, d / 2.0);
    match id {
        "kanepe-3" | "kanepe-2" => vec![
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
        "kose-koltuk" => vec![
            bx(-hw, 0.0, -hd, hw, 120.0, -hd + 950.0, "siyah-mat"),
            bx(-hw, 120.0, -hd, hw, 420.0, -hd + 950.0, "kumas-gri"),
            bx(-hw, 120.0, -hd + 950.0, -hw + 950.0, 420.0, hd, "kumas-gri"),
            bx(-hw, 420.0, -hd, hw, h, -hd + 220.0, "kumas-gri"),
            bx(-hw, 420.0, -hd + 220.0, -hw + 180.0, 640.0, hd, "kumas-gri"),
            bx(hw - 180.0, 420.0, -hd + 220.0, hw, 640.0, -hd + 950.0, "kumas-gri"),
            bx(-hw + 300.0, 420.0, -hd + 230.0, -hw + 760.0, 760.0, -hd + 380.0, "kumas-lacivert"),
            bx(hw - 760.0, 420.0, -hd + 230.0, hw - 300.0, 760.0, -hd + 380.0, "kumas-lacivert"),
        ],
        "puf" => vec![bx(-hw + 40.0, 0.0, -hd + 40.0, hw - 40.0, 60.0, hd - 40.0, "siyah-mat"), bx(-hw, 60.0, -hd, hw, h, hd, "kumas-lacivert")],
        "boy-aynasi" => vec![bx(-hw, 0.0, -hd, hw, h, hd - 10.0, "siyah-mat"), bx(-hw + 30.0, 30.0, hd - 10.0, hw - 30.0, h - 30.0, hd, "ayna")],
        "kolon" => vec![bx(-hw, 0.0, -hd, hw, h, hd, "beton")],
        "orta-sehpa" | "yemek-masasi" | "calisma-masasi" | "bar-taburesi" => {
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
        "tv-unitesi" | "komodin" | "ayakkabilik" | "konsol" => vec![
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
        "avize" => {
            let mut v = vec![bx(-6.0, 300.0, -6.0, 6.0, 900.0, 6.0, "metal-krom"), bx(-hw, 250.0, -22.0, hw, 290.0, 22.0, "metal-krom"), bx(-22.0, 250.0, -hd, 22.0, 290.0, hd, "metal-krom")];
            for (x, z) in [(-hw + 70.0, 0.0), (hw - 70.0, 0.0), (0.0, -hd + 70.0), (0.0, hd - 70.0), (0.0, 0.0)] {
                v.push(bx(x - 55.0, 60.0, z - 55.0, x + 55.0, 250.0, z + 55.0, "lamba-isik"));
            }
            v
        }
        "lambader" => vec![
            bx(-150.0, 0.0, -150.0, 150.0, 30.0, 150.0, "siyah-mat"),
            bx(-12.0, 30.0, -12.0, 12.0, 1300.0, 12.0, "siyah-mat"),
            bx(-hw, 1300.0, -hd, hw, h, hd, "lamba-isik"),
        ],
        "ankastre-spot" => vec![bx(-hw, 0.0, -hd, hw, 4.0, hd, "lamba-isik"), bx(-hw - 8.0, 4.0, -hd - 8.0, hw + 8.0, h, hd + 8.0, "pvc-beyaz")],
        "aplik" => vec![bx(-40.0, 60.0, -hd, 40.0, 180.0, -hd + 25.0, "metal-krom"), bx(-hw, 40.0, -hd + 25.0, hw, h, hd, "lamba-isik")],
        "masa-lambasi" => vec![bx(-70.0, 0.0, -70.0, 70.0, 25.0, 70.0, "metal-krom"), bx(-8.0, 25.0, -8.0, 8.0, 260.0, 8.0, "metal-krom"), bx(-hw, 260.0, -hd, hw, h, hd, "lamba-isik")],
        "tv-55" | "tv-65" => vec![bx(-hw, 0.0, -hd, hw, h, hd - 8.0, "siyah-mat"), bx(-hw + 12.0, 12.0, hd - 8.0, hw - 12.0, h - 12.0, hd, "ekran")],
        "soundbar" | "oyun-konsolu" => vec![bx(-hw, 0.0, -hd, hw, h, hd, "siyah-mat"), bx(-hw + 20.0, h * 0.4, hd, hw - 20.0, h * 0.6, hd + 2.0, "metal-krom")],
        "hoparlor" => vec![bx(-hw, 0.0, -hd, hw, h, hd, "lake-antrasit"), bx(-70.0, h - 260.0, hd, 70.0, h - 120.0, hd + 6.0, "siyah-mat"), bx(-90.0, 200.0, hd, 90.0, 560.0, hd + 6.0, "siyah-mat")],
        "laptop" => vec![bx(-hw, 0.0, -hd, hw, 16.0, hd, "metal-krom"), bx(-hw, 16.0, -hd, hw, h, -hd + 10.0, "metal-krom"), bx(-hw + 10.0, 26.0, -hd + 10.0, hw - 10.0, h - 10.0, -hd + 12.0, "ekran")],
        "tablo-yatay" | "tablo-dikey" => vec![
            bx(-hw, 0.0, -hd, hw, h, hd - 6.0, "ahsap-ceviz"),
            bx(-hw + 30.0, 30.0, hd - 6.0, hw - 30.0, h - 30.0, hd - 2.0, "tablo-c"),
            bx(-hw + 30.0, 30.0, hd - 2.0, -hw * 0.1, h * 0.55, hd, "tablo-b"),
            bx(-hw * 0.1, h * 0.4, hd - 2.0, hw - 30.0, h - 30.0, hd, "tablo-a"),
        ],
        "tablo-uclu" => (0..3)
            .flat_map(|k| {
                let x0 = -hw + k as f64 * 530.0;
                let c = ["tablo-a", "tablo-b", "tablo-c"][k];
                vec![bx(x0, 0.0, -hd, x0 + 500.0, h, hd - 6.0, "siyah-mat"), bx(x0 + 20.0, 20.0, hd - 6.0, x0 + 480.0, h - 20.0, hd, c)]
            })
            .collect(),
        "agac" => vec![
            bx(-140.0, 0.0, -140.0, 140.0, 1900.0, 140.0, "govde"),
            bx(-hw, 1700.0, -hd, hw, 3200.0, hd, "bitki-yesil"),
            bx(-hw * 0.75, 3200.0, -hd * 0.75, hw * 0.75, 4000.0, hd * 0.75, "yaprak-koyu"),
            bx(-hw * 0.45, 4000.0, -hd * 0.45, hw * 0.45, h, hd * 0.45, "bitki-yesil"),
        ],
        "cam-agaci" => {
            let mut v = vec![bx(-110.0, 0.0, -110.0, 110.0, 700.0, 110.0, "govde")];
            for k in 0..6 {
                let s = 1.0 - k as f64 / 6.5;
                let y = 600.0 + k as f64 * (h - 600.0) / 6.0;
                v.push(bx(-hw * s, y, -hd * s, hw * s, y + (h - 600.0) / 6.0, hd * s, if k % 2 == 0 { "yaprak-koyu" } else { "bitki-yesil" }));
            }
            v
        }
        "cali" => vec![bx(-hw, 0.0, -hd, hw, h * 0.7, hd, "yaprak-koyu"), bx(-hw * 0.7, h * 0.7, -hd * 0.7, hw * 0.7, h, hd * 0.7, "bitki-yesil")],
        "cim-alan" => vec![bx(-hw, 0.0, -hd, hw, h, hd, "cim")],
        "cakil-alan" => vec![bx(-hw, 0.0, -hd, hw, h, hd, "cakil")],
        "tas-yol" => (0..4).map(|k| bx(-hw + 40.0 * (k % 2) as f64, 0.0, -hd + k as f64 * 620.0, hw - 40.0 * ((k + 1) % 2) as f64, h, -hd + k as f64 * 620.0 + 520.0, "cakil")).collect(),
        "bahce-lambasi" => vec![bx(-30.0, 0.0, -30.0, 30.0, h - 180.0, 30.0, "siyah-mat"), bx(-hw * 0.7, h - 180.0, -hd * 0.7, hw * 0.7, h - 20.0, hd * 0.7, "lamba-isik"), bx(-hw, h - 20.0, -hd, hw, h, hd, "siyah-mat")],
        "sezlong" => vec![
            bx(-hw, 180.0, -hd + 500.0, hw, 260.0, hd, "ahsap-mese"),
            bx(-hw, 180.0, -hd, hw, h, -hd + 520.0, "ahsap-mese"),
            bx(-hw + 30.0, 260.0, -hd + 520.0, hw - 30.0, 320.0, hd - 30.0, "kumas-beyaz"),
            bx(-hw + 40.0, 0.0, -hd + 80.0, -hw + 90.0, 180.0, -hd + 130.0, "ahsap-mese"),
            bx(hw - 90.0, 0.0, -hd + 80.0, hw - 40.0, 180.0, -hd + 130.0, "ahsap-mese"),
            bx(-hw + 40.0, 0.0, hd - 130.0, -hw + 90.0, 180.0, hd - 80.0, "ahsap-mese"),
            bx(hw - 90.0, 0.0, hd - 130.0, hw - 40.0, 180.0, hd - 80.0, "ahsap-mese"),
        ],
        "saksi-buyuk" => vec![bx(-hw, 0.0, -hd, hw, 480.0, hd, "beton"), bx(-hw * 0.8, 480.0, -hd * 0.8, hw * 0.8, 850.0, hd * 0.8, "yaprak-koyu"), bx(-hw * 0.5, 850.0, -hd * 0.5, hw * 0.5, h, hd * 0.5, "bitki-yesil")],
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
            if i.id == "kanepe-3" {
                assert!(p.iter().any(|q| matches!(q.shape, Shape::Round(_))), "kanepe minderleri yuvarlatılmalı");
                assert!(p.iter().any(|q| q.shape == Shape::Cyl), "kanepe ayakları silindir olmalı");
            }
        }
        assert_eq!(items().iter().filter(|i| i.id == "kanepe-3").count(), 1);
    }
}
