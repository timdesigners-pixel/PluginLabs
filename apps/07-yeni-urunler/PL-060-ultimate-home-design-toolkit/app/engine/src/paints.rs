//! Renk sistemleri: duvar ve cephe boyası için standart renk kartelaları.
//!
//! RAL Classic renk kodları ve sRGB yaklaşık değerleri `data/ral-classic.json` dosyasındadır
//! (kaynak: ral-colors, MIT; Wikipedia "List of RAL colors"). Renk adları arayüzün dil dosyalarındadır.
//! Ekran ve render değerleri yaklaşıktır; uygulama öncesi fiziksel renk kartelası esas alınmalıdır.

use crate::model::{Material, Scene};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Swatch {
    pub code: String,
    pub hex: String,
    pub group: String,
}

/// İçe aktarılmış renk kartelası. `colors[].code` kartela içinde benzersizdir.
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct PaintSystem {
    pub id: String,
    pub name: String,
    pub colors: Vec<PaintColor>,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct PaintColor {
    pub code: String,
    pub name: String,
    pub hex: String,
    pub group: String,
}

pub const MAX_COLORS: usize = 5000;

pub fn ral_classic() -> Vec<Swatch> {
    serde_json::from_str(include_str!("../data/ral-classic.json")).unwrap_or_default()
}

/// "#RRGGBB" → doğrusal RGB (0–1).
pub fn hex_to_linear(hex: &str) -> Option<[f32; 3]> {
    let h = hex.trim().trim_start_matches('#');
    if h.len() != 6 || !h.chars().all(|c| c.is_ascii_hexdigit()) {
        return None;
    }
    let ch = |i: usize| u8::from_str_radix(&h[i..i + 2], 16).ok().map(|v| crate::store::to_linear(v as f32 / 255.0));
    Some([ch(0)?, ch(2)?, ch(4)?])
}

/// Renk sisteminden boya kaplaması ekler (varsa olanı döndürür). `target`: duvar | cephe.
pub fn add(scene: &mut Scene, system: &str, code: &str, target: &str) -> Result<String, String> {
    let category = if target == "cephe" { "cephe" } else { "duvar" };
    let side = if category == "cephe" { "dis" } else { "ic" };
    let (id, name, hex) = if system == "ral-classic" {
        let sw = ral_classic().into_iter().find(|s| s.code == code).ok_or("@paint_unknown_code")?;
        (format!("ral{}-{}", sw.code, side), format!("RAL {}", sw.code), sw.hex)
    } else {
        let sys = scene.paint_systems.iter().find(|p| p.id == system).ok_or("@paint_unknown_system")?;
        let c = sys.colors.iter().find(|c| c.code == code).ok_or("@paint_unknown_code")?;
        let label = if c.name.is_empty() || c.name == c.code { c.code.clone() } else { format!("{} · {}", c.name, c.code) };
        (format!("p-{}-{}-{}", sys.id, crate::formula::slug(&c.code), side), format!("{} — {}", sys.name, label), c.hex.clone())
    };
    if !scene.materials.iter().any(|m| m.id == id) {
        let color = hex_to_linear(&hex).ok_or("@paint_unknown_code")?;
        // mat iç boya, dış cephe boyası biraz daha pürüzlü
        let roughness = if category == "cephe" { 0.92 } else { 0.86 };
        scene.materials.push(Material { id: id.clone(), name, color, roughness, category: category.into(), ..Default::default() });
    }
    Ok(id)
}

fn srgb_hex(r: f32, g: f32, b: f32) -> String {
    let q = |x: f32| (x.clamp(0.0, 1.0) * 255.0).round() as u8;
    format!("#{:02X}{:02X}{:02X}", q(r), q(g), q(b))
}

/// CIE Lab (D50, Adobe ASE) → sRGB hex.
fn lab_hex(l: f32, a: f32, b: f32) -> String {
    let fy = (l + 16.0) / 116.0;
    let fx = fy + a / 500.0;
    let fz = fy - b / 200.0;
    let inv = |t: f32| if t > 6.0 / 29.0 { t * t * t } else { 3.0 * (6.0f32 / 29.0).powi(2) * (t - 4.0 / 29.0) };
    let (x, y, z) = (0.9642 * inv(fx), inv(fy), 0.8251 * inv(fz));
    // Bradford ile D65'e uyarlanmış XYZ → doğrusal sRGB
    let r = 3.1338561 * x - 1.6168667 * y - 0.4906146 * z;
    let g = -0.9787684 * x + 1.9161415 * y + 0.0334540 * z;
    let bl = 0.0719453 * x - 0.2289914 * y + 1.4052427 * z;
    let s = |v: f32| crate::store::to_srgb(v.clamp(0.0, 1.0));
    srgb_hex(s(r), s(g), s(bl))
}

fn find_hex(s: &str) -> Option<String> {
    let t = s.trim().trim_start_matches('#');
    (t.len() == 6 && t.chars().all(|c| c.is_ascii_hexdigit())).then(|| format!("#{}", t.to_uppercase()))
}

/// Adobe Swatch Exchange (ASE) ikili dosyası.
fn parse_ase(d: &[u8]) -> Result<Vec<PaintColor>, String> {
    let bad = || "@palette_unreadable".to_string();
    if d.len() < 12 || &d[0..4] != b"ASEF" {
        return Err(bad());
    }
    let u16_at = |i: usize| -> Result<u16, String> { d.get(i..i + 2).map(|b| u16::from_be_bytes([b[0], b[1]])).ok_or_else(bad) };
    let u32_at = |i: usize| -> Result<u32, String> { d.get(i..i + 4).map(|b| u32::from_be_bytes([b[0], b[1], b[2], b[3]])).ok_or_else(bad) };
    let f32_at = |i: usize| -> Result<f32, String> { u32_at(i).map(f32::from_bits) };
    let blocks = u32_at(8)? as usize;
    let mut i = 12;
    let mut group = String::new();
    let mut out = vec![];
    for _ in 0..blocks.min(MAX_COLORS * 4) {
        let kind = u16_at(i)?;
        let len = u32_at(i + 2)? as usize;
        let body = i + 6;
        let end = body.checked_add(len).filter(|e| *e <= d.len()).ok_or_else(bad)?;
        let name = || -> Result<(String, usize), String> {
            let n = u16_at(body)? as usize;
            let raw: Vec<u16> = (0..n).map(|k| u16_at(body + 2 + k * 2)).collect::<Result<_, _>>()?;
            Ok((String::from_utf16_lossy(&raw).trim_end_matches('\0').trim().to_string(), body + 2 + n * 2))
        };
        match kind {
            0xC001 => group = name()?.0,
            0xC002 => group.clear(),
            0x0001 => {
                let (nm, p) = name()?;
                let model = d.get(p..p + 4).ok_or_else(bad)?;
                let v = |k: usize| f32_at(p + 4 + k * 4);
                let hex = match model {
                    b"RGB " => srgb_hex(v(0)?, v(1)?, v(2)?),
                    b"CMYK" => {
                        let k = v(3)?;
                        srgb_hex((1.0 - v(0)?) * (1.0 - k), (1.0 - v(1)?) * (1.0 - k), (1.0 - v(2)?) * (1.0 - k))
                    }
                    b"LAB " => lab_hex(v(0)? * 100.0, v(1)?, v(2)?),
                    b"Gray" => {
                        let g = v(0)?;
                        srgb_hex(g, g, g)
                    }
                    _ => return Err(bad()),
                };
                out.push(PaintColor { code: nm.clone(), name: nm, hex, group: group.clone() });
            }
            _ => {}
        }
        i = end;
    }
    Ok(out)
}

/// GIMP/Inkscape .gpl: "R G B  Ad" satırları.
fn parse_gpl(t: &str) -> Vec<PaintColor> {
    let mut out = vec![];
    for line in t.lines().map(str::trim) {
        if line.is_empty() || line.starts_with('#') || line.starts_with("GIMP") || line.contains(':') && !line.chars().next().map_or(false, |c| c.is_ascii_digit()) {
            continue;
        }
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 3 {
            continue;
        }
        let ch: Vec<f32> = parts[..3].iter().filter_map(|x| x.parse::<u16>().ok()).filter(|x| *x <= 255).map(|x| x as f32 / 255.0).collect();
        if ch.len() == 3 {
            let name = parts[3..].join(" ");
            let hex = srgb_hex(ch[0], ch[1], ch[2]);
            out.push(PaintColor { code: if name.is_empty() { hex.clone() } else { name.clone() }, name, hex, group: String::new() });
        }
    }
    out
}

/// CSV: her satırda bir "#RRGGBB" (ya da RRGGBB) alanı; ondan önceki alanlar kod ve ad, sonraki alan grup.
fn parse_csv(t: &str) -> Vec<PaintColor> {
    let mut out = vec![];
    for line in t.lines() {
        let sep = if line.contains(';') { ';' } else if line.contains('\t') { '\t' } else { ',' };
        let cells: Vec<String> = line.split(sep).map(|c| c.trim().trim_matches('"').trim().to_string()).collect();
        let Some(hi) = cells.iter().position(|c| find_hex(c).is_some()) else { continue };
        let hex = find_hex(&cells[hi]).unwrap();
        let before: Vec<&String> = cells[..hi].iter().filter(|c| !c.is_empty()).collect();
        let (code, name) = match before.len() {
            0 => (hex.clone(), String::new()),
            1 => (before[0].clone(), before[0].clone()),
            _ => (before[0].clone(), before[1].clone()),
        };
        let group = cells.get(hi + 1).cloned().unwrap_or_default();
        out.push(PaintColor { code, name, hex, group });
    }
    out
}

/// Kartela dosyasını okur: ASE (ikili) ya da GPL / CSV (metin).
pub fn parse_palette(file_name: &str, text: Option<&str>, data: Option<&[u8]>) -> Result<Vec<PaintColor>, String> {
    let lower = file_name.to_lowercase();
    let mut colors = if let Some(d) = data.filter(|d| d.starts_with(b"ASEF")) {
        parse_ase(d)?
    } else {
        let t = match (text, data) {
            (Some(t), _) => t.to_string(),
            (None, Some(d)) => String::from_utf8(d.to_vec()).map_err(|_| "@palette_unreadable")?,
            _ => return Err("@palette_unreadable".into()),
        };
        if lower.ends_with(".gpl") || t.trim_start().starts_with("GIMP Palette") { parse_gpl(&t) } else { parse_csv(&t) }
    };
    if colors.len() > MAX_COLORS {
        return Err("@palette_too_big".into());
    }
    // kodlar kartela içinde benzersiz olmalı
    let mut seen = std::collections::HashSet::new();
    for c in colors.iter_mut() {
        c.code = c.code.chars().take(60).collect();
        c.name = c.name.chars().take(80).collect();
        c.group = c.group.chars().take(60).collect();
        let base = c.code.clone();
        let mut n = 2;
        while !seen.insert(c.code.clone()) {
            c.code = format!("{base} ({n})");
            n += 1;
        }
    }
    if colors.is_empty() {
        return Err("@palette_empty".into());
    }
    Ok(colors)
}

/// Kartelayı sahneye ekler; aynı adla yeniden içe aktarılırsa günceller.
pub fn import(scene: &mut Scene, name: &str, colors: Vec<PaintColor>) -> String {
    let name: String = name.trim().chars().take(60).collect();
    let name = if name.is_empty() { "Kartela".to_string() } else { name };
    let mut id = format!("k-{}", crate::formula::slug(&name).chars().take(32).collect::<String>());
    if id == "k-" {
        id = "k-kartela".into();
    }
    if let Some(p) = scene.paint_systems.iter_mut().find(|p| p.id == id) {
        p.colors = colors;
        p.name = name;
    } else {
        scene.paint_systems.push(PaintSystem { id: id.clone(), name, colors });
    }
    id
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ral_table_and_paint_material() {
        let t = ral_classic();
        assert_eq!(t.len(), 215);
        assert!(t.iter().any(|s| s.code == "9010" && s.hex == "#F7F9EF"));
        let mut s = Scene::default();
        let id = add(&mut s, "ral-classic", "7016", "duvar").unwrap();
        assert_eq!(id, "ral7016-ic");
        assert_eq!(add(&mut s, "ral-classic", "7016", "duvar").unwrap(), id, "aynı renk bir kez eklenir");
        let m = s.materials.iter().find(|m| m.id == id).unwrap();
        // antrasit: doğrusal değer sRGB değerinden belirgin biçimde küçük
        assert!(m.color[0] < 0.05 && m.category == "duvar");
        assert!(add(&mut s, "ral-classic", "0000", "duvar").is_err());
        assert_eq!(hex_to_linear("#FFFFFF").unwrap(), [1.0, 1.0, 1.0]);
    }

    fn ase_color(name: &str, model: &[u8; 4], v: &[f32]) -> Vec<u8> {
        let mut b = vec![];
        let u: Vec<u16> = name.encode_utf16().chain(std::iter::once(0)).collect();
        b.extend((u.len() as u16).to_be_bytes());
        for c in u {
            b.extend(c.to_be_bytes());
        }
        b.extend(model);
        for x in v {
            b.extend(x.to_be_bytes());
        }
        b.extend(0u16.to_be_bytes());
        let mut blk = 1u16.to_be_bytes().to_vec();
        blk.extend((b.len() as u32).to_be_bytes());
        blk.extend(b);
        blk
    }

    #[test]
    fn imports_brand_palettes_ase_gpl_csv() {
        let mut ase = b"ASEF".to_vec();
        ase.extend([0, 1, 0, 0]);
        ase.extend(3u32.to_be_bytes());
        let g: Vec<u16> = "Mutfak".encode_utf16().chain(std::iter::once(0)).collect();
        let mut gb = (g.len() as u16).to_be_bytes().to_vec();
        for c in g {
            gb.extend(c.to_be_bytes());
        }
        ase.extend(0xC001u16.to_be_bytes());
        ase.extend((gb.len() as u32).to_be_bytes());
        ase.extend(gb);
        ase.extend(ase_color("Kum Beji 1234", b"RGB ", &[0.8, 0.7, 0.5]));
        ase.extend(ase_color("Beyaz", b"LAB ", &[1.0, 0.0, 0.0]));
        let c = parse_palette("firma.ase", None, Some(&ase)).unwrap();
        assert_eq!(c.len(), 2);
        assert_eq!((c[0].hex.as_str(), c[0].group.as_str()), ("#CCB380", "Mutfak"));
        assert_eq!(c[1].hex, "#FFFFFF", "Lab beyaz → sRGB beyaz");
        let gpl = "GIMP Palette\nName: Test\nColumns: 4\n# yorum\n 46  50  54\tAntrasit 7016\n255 255 255 Beyaz\n";
        let c = parse_palette("x.gpl", Some(gpl), None).unwrap();
        assert_eq!((c[0].code.as_str(), c[0].hex.as_str()), ("Antrasit 7016", "#2E3236"));
        let csv = "kod;ad;hex;grup\nTR-101;Kireç Beyazı;#F4F1E8;Beyazlar\nTR-102;Kum;D9C8A9;\nTR-101;Kopya;#000000;\n";
        let c = parse_palette("x.csv", Some(csv), None).unwrap();
        assert_eq!(c.len(), 3);
        assert_eq!((c[0].code.as_str(), c[0].name.as_str(), c[0].group.as_str()), ("TR-101", "Kireç Beyazı", "Beyazlar"));
        assert_eq!(c[2].code, "TR-101 (2)", "yinelenen kod benzersizleşir");
        assert!(parse_palette("x.csv", Some("ad,renk\n"), None).is_err());
        let mut s = Scene::default();
        let sid = import(&mut s, "Örnek Firma", c);
        assert_eq!(sid, "k-ornek_firma");
        let id = add(&mut s, &sid, "TR-101", "cephe").unwrap();
        let m = s.materials.iter().find(|m| m.id == id).unwrap();
        assert_eq!((m.category.as_str(), m.name.as_str()), ("cephe", "Örnek Firma — Kireç Beyazı · TR-101"));
        let back: Scene = serde_json::from_str(&serde_json::to_string(&s).unwrap()).unwrap();
        assert_eq!(back.paint_systems[0].colors.len(), 3, "kartela proje dosyasında saklanır");
    }
}
