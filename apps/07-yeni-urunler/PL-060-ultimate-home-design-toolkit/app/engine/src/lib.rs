//! Ultimate Home Design Toolkit motoru.
//!
//! Tüm iç ölçüler milimetredir. Plan düzlemi (x, y); 3B dünyada X = x, Z = y, Y yukarı.
//! Arayüz yalnız [`api::call`] üzerinden JSON ile konuşur; aynı kod Tauri kabuğunda yerel,
//! tarayıcı önizlemesinde WebAssembly olarak çalışır.

pub mod api;
pub mod catalog;
pub mod cost;
pub mod cycles;
pub mod elevation;
pub mod formula;
pub mod geom;
pub mod measure;
pub mod mesh;
pub mod model;
pub mod motors;
pub mod modules;
pub mod msg;
pub mod plan;
pub mod reference;
pub mod obj;
pub mod packs;
pub mod paints;
pub mod palette;
pub mod photo;
pub mod render;
pub mod scene_file;
pub mod spaces;
pub mod store;
pub mod gltf;
pub mod templates;
pub mod texture;
pub mod units;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const PRODUCT: &str = "Ultimate Home Design Toolkit";
