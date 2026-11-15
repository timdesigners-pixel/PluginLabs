//! Sahne veri modeli. Tüm uzunluklar milimetredir.

use crate::geom::P2;
use crate::units::Unit;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct Scene {
    pub name: String,
    pub unit: Unit,
    pub levels: Vec<Level>,
    pub materials: Vec<Material>,
    pub meshes: Vec<MeshAsset>,
    pub objects: Vec<Object>,
    pub cost: CostProfile,
    pub functions: Vec<UserFunction>,
    pub camera: Camera,
    pub sun: Sun,
    /// Arşivlenmiş öğeler (silme yok; geri alınabilir).
    pub archive: Vec<serde_json::Value>,
    /// Hazır yapı modülleri (4 m genişlik, 3–10 m boy).
    pub modules: Vec<Module>,
    pub standard: BuildStandard,
    /// Plan üzerindeki revizyon notları.
    pub notes: Vec<Note>,
    pub project_no: String,
    /// Dış cephe boyası (malzeme kimliği).
    pub facade: String,
    /// İç cephe boyası (malzeme kimliği).
    pub interior: String,
}

impl Default for Scene {
    fn default() -> Self {
        Scene {
            name: "Yeni ev".into(),
            unit: Unit::Cm,
            levels: vec![Level::default()],
            materials: crate::templates::default_materials(),
            meshes: vec![],
            objects: vec![],
            cost: CostProfile::default(),
            functions: vec![],
            camera: Camera::default(),
            sun: Sun::default(),
            archive: vec![],
            modules: vec![],
            standard: BuildStandard::default(),
            notes: vec![],
            project_no: String::new(),
            facade: "beton-kabuk".into(),
            interior: "boya-beyaz".into(),
        }
    }
}

/// Yapı standardı (mm). Varsayılan: dış duvar 12,5 cm, iç bölme 10 cm, net iç 285 cm, kat 320 cm.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct BuildStandard {
    pub exterior_wall: f64,
    pub partition: f64,
    pub net_height: f64,
    pub bottom_slab: f64,
    pub top_slab: f64,
    pub parapet: f64,
}
impl Default for BuildStandard {
    fn default() -> Self {
        BuildStandard { exterior_wall: 125.0, partition: 100.0, net_height: 2850.0, bottom_slab: 150.0, top_slab: 120.0, parapet: 80.0 }
    }
}
impl BuildStandard {
    /// Modülün toplam dış yüksekliği (döşemeler + net iç + parapet).
    pub fn storey(&self) -> f64 {
        self.bottom_slab + self.net_height + self.top_slab + self.parapet
    }
    /// Üst kat modülünün oturduğu kot (alt modülün üst döşemesinin üstü).
    pub fn stack(&self) -> f64 {
        self.bottom_slab + self.net_height + self.top_slab
    }
}

/// Hazır modül: dış ölçüsü genişlik (4 m) × boy (3–10 m).
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct Module {
    pub id: String,
    /// Boy (m): 3–10.
    pub length: u32,
    /// 0 = zemin, 1 = üst kat.
    pub floor: u32,
    /// Sol-alt köşe (mm), yalnız zemin modüllerinde kullanılır.
    pub position: [f64; 2],
    /// true: boy y ekseni boyunca.
    pub rotated: bool,
    /// Üst kat modülünün üzerine oturduğu zemin modülü.
    pub on: Option<String>,
}
impl Default for Module {
    fn default() -> Self {
        Module { id: String::new(), length: 10, floor: 0, position: [0.0, 0.0], rotated: false, on: None }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct Note {
    pub id: String,
    pub level: String,
    pub position: [f64; 2],
    pub text: String,
}

impl Scene {
    pub fn material(&self, id: &str) -> Option<&Material> {
        self.materials.iter().find(|m| m.id == id)
    }
    pub fn wall(&self, id: &str) -> Option<(&Level, &Wall)> {
        self.levels.iter().find_map(|l| l.walls.iter().find(|w| w.id == id).map(|w| (l, w)))
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct Level {
    pub id: String,
    pub name: String,
    pub elevation: f64,
    pub height: f64,
    pub slab: f64,
    pub walls: Vec<Wall>,
    pub openings: Vec<Opening>,
    pub rooms: Vec<Room>,
}
impl Default for Level {
    fn default() -> Self {
        Level { id: "L0".into(), name: "Zemin kat".into(), elevation: 150.0, height: 2850.0, slab: 150.0, walls: vec![], openings: vec![], rooms: vec![] }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct Wall {
    pub id: String,
    pub a: P2,
    pub b: P2,
    pub thickness: f64,
    /// Boşsa kat yüksekliği kullanılır.
    pub height: Option<f64>,
    pub material: String,
    /// Dış duvar ise yalnız iç yüzü boyanır.
    pub exterior: bool,
    /// Taşıyıcı perde beton: silinemez, kapı/pencere alamaz.
    pub structural: bool,
    /// Modülden otomatik üretildi (modüller değişince yeniden kurulur).
    pub generated: bool,
    /// Dış yüz malzemesi (cephe kaplaması/boyası); boşsa sahnenin cephe boyası.
    pub outer: String,
    /// Dış yüzün plan yönündeki normali (a→b'nin sağı = 1, solu = -1, 0 = iç duvar).
    pub outside: i8,
    /// Kabuk duvarı ise taban ve tavan kotları (mm, dünya).
    pub shell: Option<[f64; 2]>,
}
impl Default for Wall {
    fn default() -> Self {
        Wall { id: String::new(), a: [0.0, 0.0], b: [1000.0, 0.0], thickness: 100.0, height: None, material: String::new(), exterior: false, structural: false, generated: false, outer: String::new(), outside: 0, shell: None }
    }
}
impl Wall {
    pub fn length(&self) -> f64 {
        crate::geom::dist(self.a, self.b)
    }
    pub fn h(&self, level: &Level) -> f64 {
        self.height.unwrap_or(level.height)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum OpeningKind {
    #[default]
    Door,
    Window,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct Opening {
    pub id: String,
    pub wall: String,
    pub kind: OpeningKind,
    /// Duvarın `a` ucundan açıklığın başlangıcına uzaklık.
    pub offset: f64,
    pub width: f64,
    pub height: f64,
    pub sill: f64,
    pub price: f64,
    /// Kapı açılımı: sol/sağ menteşe, içe/dışa.
    pub swing: String,
}
impl Default for Opening {
    fn default() -> Self {
        Opening { id: String::new(), wall: String::new(), kind: OpeningKind::Door, offset: 500.0, width: 900.0, height: 2350.0, sill: 0.0, price: 0.0, swing: "sol-ice".into() }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct Room {
    pub id: String,
    pub name: String,
    /// salon, yatak, mutfak, banyo, antre, balkon, calisma, diger
    pub kind: String,
    pub polygon: Vec<P2>,
    pub floor: String,
    pub ceiling_height: Option<f64>,
}
impl Default for Room {
    fn default() -> Self {
        Room { id: String::new(), name: "Oda".into(), kind: "diger".into(), polygon: vec![], floor: "parke-mese".into(), ceiling_height: None }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct Material {
    pub id: String,
    pub name: String,
    pub color: [f32; 3],
    pub roughness: f32,
    pub metallic: f32,
    pub emission: f32,
    pub opacity: f32,
    /// Birim fiyat (₺ / m²) — zemin ve duvar kaplamalarında kullanılır.
    pub price_m2: f64,
    pub category: String,
}
impl Default for Material {
    fn default() -> Self {
        Material { id: String::new(), name: String::new(), color: [0.8, 0.8, 0.8], roughness: 0.8, metallic: 0.0, emission: 0.0, opacity: 1.0, price_m2: 0.0, category: "genel".into() }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct MeshGroup {
    pub material: String,
    pub start: u32,
    pub count: u32,
}

/// İçe aktarılmış 3B model (OBJ). Konumlar milimetredir, Y yukarı.
#[derive(Clone, Debug, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct MeshAsset {
    pub id: String,
    pub name: String,
    pub positions: Vec<[f32; 3]>,
    pub normals: Vec<[f32; 3]>,
    pub indices: Vec<u32>,
    pub groups: Vec<MeshGroup>,
    pub source: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct Object {
    pub id: String,
    pub name: String,
    /// `cat:<katalog-id>` ya da içe aktarılmış model kimliği.
    pub mesh: String,
    pub level: String,
    /// Plan konumu (x, y) ve zeminden yükseklik (z) — mm.
    pub position: [f64; 3],
    /// Y ekseni etrafında dönüş (derece).
    pub rotation: f64,
    pub scale: [f64; 3],
    pub material: Option<String>,
    pub price: f64,
    pub quantity: u32,
}
impl Default for Object {
    fn default() -> Self {
        Object { id: String::new(), name: String::new(), mesh: String::new(), level: "L0".into(), position: [0.0; 3], rotation: 0.0, scale: [1.0; 3], material: None, price: 0.0, quantity: 1 }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum Tier {
    Ekonomik,
    #[default]
    Standart,
    Premium,
}
impl Tier {
    pub fn multiplier(self) -> f64 {
        match self {
            Tier::Ekonomik => 0.72,
            Tier::Standart => 1.0,
            Tier::Premium => 1.65,
        }
    }
    pub fn label(self) -> &'static str {
        match self {
            Tier::Ekonomik => "Ekonomik",
            Tier::Standart => "Standart",
            Tier::Premium => "Premium",
        }
    }
    pub const ALL: [Tier; 3] = [Tier::Ekonomik, Tier::Standart, Tier::Premium];
}

/// Maliyet kaleminin miktar dayanağı.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case", tag = "type", content = "value")]
pub enum Basis {
    FloorArea,
    WallNetArea,
    CeilingArea,
    Skirting,
    Doors,
    Windows,
    PaintLitres,
    Volume,
    WetArea,
    Rooms,
    Fixed,
    Formula(String),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct RateItem {
    pub id: String,
    pub name: String,
    pub group: String,
    pub basis: Basis,
    pub unit: String,
    pub material_price: f64,
    pub labour_price: f64,
    /// Fire oranı (0,08 = %8).
    pub waste: f64,
    /// Miktar indirimi basamakları: (eşik miktar, indirim oranı).
    pub breaks: Vec<(f64, f64)>,
    /// Kalite düzeyinden etkilenir mi?
    pub tiered: bool,
    pub enabled: bool,
}
impl Default for RateItem {
    fn default() -> Self {
        RateItem { id: String::new(), name: String::new(), group: "Genel".into(), basis: Basis::Fixed, unit: "adet".into(), material_price: 0.0, labour_price: 0.0, waste: 0.0, breaks: vec![], tiered: true, enabled: true }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct CostProfile {
    pub currency: String,
    pub tier: Tier,
    /// Bölge fiyat endeksi (1,00 = referans).
    pub region_index: f64,
    /// İşçilik endeksi (1,00 = referans).
    pub labour_index: f64,
    pub vat: f64,
    pub contingency: f64,
    pub paint_coverage_m2_per_l: f64,
    pub paint_coats: f64,
    pub rates: Vec<RateItem>,
    pub include_furniture: bool,
}
impl Default for CostProfile {
    fn default() -> Self {
        CostProfile {
            currency: "TRY".into(),
            tier: Tier::Standart,
            region_index: 1.0,
            labour_index: 1.0,
            vat: 0.20,
            contingency: 0.08,
            paint_coverage_m2_per_l: 10.0,
            paint_coats: 2.0,
            rates: crate::templates::default_rates(),
            include_furniture: true,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum FunctionKind {
    #[default]
    Measure,
    Cost,
}

/// Kullanıcının eklediği hesap fonksiyonu (güvenli formül dili).
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct UserFunction {
    pub id: String,
    pub name: String,
    pub kind: FunctionKind,
    pub expr: String,
    pub unit: String,
    /// Maliyet fonksiyonunda sonuç tutar mı (true) yoksa miktar mı (false)?
    pub is_amount: bool,
    pub unit_price: f64,
    pub enabled: bool,
}
impl Default for UserFunction {
    fn default() -> Self {
        UserFunction { id: String::new(), name: String::new(), kind: FunctionKind::Measure, expr: "0".into(), unit: String::new(), is_amount: false, unit_price: 0.0, enabled: true }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct Camera {
    /// Dünya koordinatı (mm): X = plan x, Y = yukarı, Z = plan y.
    pub eye: [f64; 3],
    pub target: [f64; 3],
    pub fov: f64,
}
impl Default for Camera {
    fn default() -> Self {
        Camera { eye: [-3500.0, 9500.0, 13500.0], target: [5000.0, 0.0, 4000.0], fov: 50.0 }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct Sun {
    pub azimuth: f64,
    pub elevation: f64,
    pub intensity: f64,
    pub sky: f64,
}
impl Default for Sun {
    fn default() -> Self {
        Sun { azimuth: 215.0, elevation: 38.0, intensity: 2.4, sky: 0.8 }
    }
}
