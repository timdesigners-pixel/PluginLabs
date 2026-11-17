//! Ağır varlık deposu: yüksek poligonlu ağlar ve sıkıştırılmış doku dosyaları.
//!
//! Sahne JSON'u her komutta arayüzle motor arasında taşındığı için büyük veriler sahnede tutulmaz;
//! içerik özetiyle (SHA-256) anahtarlanan bu depoya konur, sahne yalnız anahtarı taşır.
//! Proje dosyası kaydedilirken veriler dosyaya gömülür, açılırken depoya geri yüklenir.

use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};

/// Depodaki ağ verisi (nesne uzayı, mm, Y yukarı).
#[derive(Clone, Debug, Default)]
pub struct MeshData {
    pub positions: Vec<[f32; 3]>,
    pub normals: Vec<[f32; 3]>,
    pub uvs: Vec<[f32; 2]>,
    pub indices: Vec<u32>,
}

/// Depodaki dosya (JPEG/PNG doku).
#[derive(Clone, Debug)]
pub struct Blob {
    pub mime: String,
    pub bytes: Vec<u8>,
}

/// Çözülmüş doku: sRGB/veri baytları, RGBA.
#[derive(Clone, Debug)]
pub struct Rgba {
    pub w: usize,
    pub h: usize,
    pub px: Vec<u8>,
    pub has_alpha: bool,
}

impl Rgba {
    /// Çift doğrusal örnekleme, 0–1; (u, v) tekrar eder, glTF düzeninde v aşağı doğrudur.
    pub fn sample(&self, u: f32, v: f32) -> [f32; 4] {
        let x = (u - u.floor()) * self.w as f32 - 0.5;
        let y = (v - v.floor()) * self.h as f32 - 0.5;
        let (x0, y0) = (x.floor(), y.floor());
        let (fx, fy) = (x - x0, y - y0);
        let at = |i: f32, j: f32| {
            let k = ((j.rem_euclid(self.h as f32) as usize) * self.w + i.rem_euclid(self.w as f32) as usize) * 4;
            [self.px[k] as f32, self.px[k + 1] as f32, self.px[k + 2] as f32, self.px[k + 3] as f32]
        };
        let (a, b, c, d) = (at(x0, y0), at(x0 + 1.0, y0), at(x0, y0 + 1.0), at(x0 + 1.0, y0 + 1.0));
        let mut o = [0.0; 4];
        for k in 0..4 {
            let top = a[k] + (b[k] - a[k]) * fx;
            let bot = c[k] + (d[k] - c[k]) * fx;
            o[k] = (top + (bot - top) * fy) / 255.0;
        }
        o
    }
}

type Map<T> = Mutex<HashMap<String, Arc<T>>>;
fn meshes() -> &'static Map<MeshData> {
    static M: OnceLock<Map<MeshData>> = OnceLock::new();
    M.get_or_init(Default::default)
}
fn files() -> &'static Map<Blob> {
    static M: OnceLock<Map<Blob>> = OnceLock::new();
    M.get_or_init(Default::default)
}
fn decoded() -> &'static Map<Rgba> {
    static M: OnceLock<Map<Rgba>> = OnceLock::new();
    M.get_or_init(Default::default)
}

fn digest(parts: &[&[u8]]) -> String {
    let mut h = Sha256::new();
    for p in parts {
        h.update((p.len() as u64).to_le_bytes());
        h.update(p);
    }
    h.finalize().iter().take(12).map(|b| format!("{b:02x}")).collect()
}

fn bytes_of<T: Copy>(v: &[T]) -> &[u8] {
    // f32/u32 dizileri düz bellek; yalnız özet için okunur
    unsafe { std::slice::from_raw_parts(v.as_ptr() as *const u8, std::mem::size_of_val(v)) }
}

pub fn put_mesh(m: MeshData) -> String {
    let key = format!("m{}", digest(&[bytes_of(&m.positions), bytes_of(&m.normals), bytes_of(&m.uvs), bytes_of(&m.indices)]));
    meshes().lock().unwrap().entry(key.clone()).or_insert_with(|| Arc::new(m));
    key
}

pub fn mesh(key: &str) -> Option<Arc<MeshData>> {
    meshes().lock().ok()?.get(key).cloned()
}

pub fn put_file(mime: &str, bytes: Vec<u8>) -> String {
    let key = format!("f{}", digest(&[mime.as_bytes(), &bytes]));
    files().lock().unwrap().entry(key.clone()).or_insert_with(|| Arc::new(Blob { mime: mime.into(), bytes }));
    key
}

pub fn file(key: &str) -> Option<Arc<Blob>> {
    files().lock().ok()?.get(key).cloned()
}

pub fn has(key: &str) -> bool {
    if key.starts_with('m') {
        mesh(key).is_some()
    } else {
        file(key).is_some()
    }
}

/// PNG ya da JPEG çözer (en çok 8192 piksel kenar).
pub fn decode_bytes(bytes: &[u8]) -> Option<Rgba> {
    if bytes.starts_with(&[0x89, b'P', b'N', b'G']) {
        let mut dec = png::Decoder::new(std::io::Cursor::new(bytes));
        dec.set_transformations(png::Transformations::EXPAND | png::Transformations::STRIP_16);
        let mut r = dec.read_info().ok()?;
        let mut buf = vec![0; r.output_buffer_size()];
        let info = r.next_frame(&mut buf).ok()?;
        let (w, h) = (info.width as usize, info.height as usize);
        if w == 0 || h == 0 || w > 8192 || h > 8192 {
            return None;
        }
        let src = &buf[..info.buffer_size()];
        let mut px = Vec::with_capacity(w * h * 4);
        let mut has_alpha = false;
        match info.color_type {
            png::ColorType::Rgba => {
                px.extend_from_slice(src);
                has_alpha = src.chunks(4).any(|c| c[3] < 250);
            }
            png::ColorType::Rgb => src.chunks(3).for_each(|c| px.extend_from_slice(&[c[0], c[1], c[2], 255])),
            png::ColorType::GrayscaleAlpha => src.chunks(2).for_each(|c| {
                has_alpha |= c[1] < 250;
                px.extend_from_slice(&[c[0], c[0], c[0], c[1]])
            }),
            png::ColorType::Grayscale => src.iter().for_each(|&g| px.extend_from_slice(&[g, g, g, 255])),
            png::ColorType::Indexed => return None,
        }
        return Some(Rgba { w, h, px, has_alpha });
    }
    if bytes.starts_with(&[0xFF, 0xD8]) {
        let mut dec = jpeg_decoder::Decoder::new(std::io::Cursor::new(bytes));
        let data = dec.decode().ok()?;
        let info = dec.info()?;
        let (w, h) = (info.width as usize, info.height as usize);
        if w == 0 || h == 0 || w > 8192 || h > 8192 {
            return None;
        }
        let mut px = Vec::with_capacity(w * h * 4);
        match info.pixel_format {
            jpeg_decoder::PixelFormat::RGB24 => data.chunks(3).for_each(|c| px.extend_from_slice(&[c[0], c[1], c[2], 255])),
            jpeg_decoder::PixelFormat::L8 => data.iter().for_each(|&g| px.extend_from_slice(&[g, g, g, 255])),
            _ => return None,
        }
        return Some(Rgba { w, h, px, has_alpha: false });
    }
    None
}

/// Depodaki dokunun çözülmüş hâli (önbellekli).
pub fn image(key: &str) -> Option<Arc<Rgba>> {
    if let Some(i) = decoded().lock().ok()?.get(key).cloned() {
        return Some(i);
    }
    let blob = file(key)?;
    let img = Arc::new(decode_bytes(&blob.bytes)?);
    decoded().lock().ok()?.insert(key.into(), img.clone());
    Some(img)
}

/// sRGB (0–1) → doğrusal.
pub fn to_linear(c: f32) -> f32 {
    if c <= 0.04045 {
        c / 12.92
    } else {
        ((c + 0.055) / 1.055).powf(2.4)
    }
}

/// Doğrusal → sRGB (0–1).
pub fn to_srgb(c: f32) -> f32 {
    if c <= 0.0031308 {
        12.92 * c
    } else {
        1.055 * c.powf(1.0 / 2.4) - 0.055
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keys_are_content_hashes_and_png_decodes() {
        let m = MeshData { positions: vec![[0.0, 0.0, 0.0], [1.0, 0.0, 0.0], [0.0, 1.0, 0.0]], normals: vec![[0.0, 0.0, 1.0]; 3], uvs: vec![[0.0, 0.0]; 3], indices: vec![0, 1, 2] };
        let a = put_mesh(m.clone());
        assert_eq!(a, put_mesh(m));
        assert!(a.starts_with('m') && mesh(&a).is_some());
        // 2×1 RGBA PNG: kırmızı opak, yeşil saydam
        let png = crate::render::encode_png(&[255, 0, 0, 255, 0, 255, 0, 255], 2, 1).unwrap();
        let k = put_file("image/png", png);
        let img = image(&k).unwrap();
        assert_eq!((img.w, img.h), (2, 1));
        let c = img.sample(0.25, 0.5);
        assert!(c[0] > 0.99 && c[1] < 0.01);
        assert!((to_linear(0.5) - 0.214).abs() < 0.001);
    }
}
