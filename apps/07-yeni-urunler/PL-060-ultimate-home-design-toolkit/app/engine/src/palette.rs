//! Renk paleti içe aktarma: onaltılık renk listeleri (`#RRGGBB`, `#RGB`; düz metin, JSON,
//! CSS) ve GIMP `.gpl` satırları (`R G B ad`). En çok 64 renk, yinelenenler atılır.

use crate::model::{Material, Scene};

pub const MAX_COLORS: usize = 64;
pub const MAX_BYTES: usize = 512 * 1024;

fn hex(s: &[u8]) -> Option<u8> {
    let v = |c: u8| (c as char).to_digit(16).map(|d| d as u8);
    Some(v(s[0])? * 16 + v(s[1])?)
}

/// Metinden (ad, renk) çiftleri çıkarır.
pub fn parse(text: &str) -> Result<Vec<(String, [f32; 3])>, String> {
    if text.len() > MAX_BYTES {
        return Err("Palet dosyası 512 KB sınırını aşıyor".into());
    }
    let mut out: Vec<(String, [f32; 3])> = vec![];
    let mut push = |name: String, c: [u8; 3]| {
        let col = [c[0] as f32 / 255.0, c[1] as f32 / 255.0, c[2] as f32 / 255.0];
        if out.len() < MAX_COLORS && !out.iter().any(|(_, o)| *o == col) {
            out.push((name, col));
        }
    };
    for line in text.lines() {
        let t = line.trim();
        if t.is_empty() || t.starts_with("GIMP") || t.starts_with("Name:") || t.starts_with("Columns:") {
            continue;
        }
        let b = t.as_bytes();
        let mut found = false;
        let mut i = 0;
        while i < b.len() {
            if b[i] == b'#' {
                let run = b[i + 1..].iter().take_while(|c| c.is_ascii_hexdigit()).count();
                if run == 6 || run == 8 {
                    if let (Some(r), Some(g), Some(bl)) = (hex(&b[i + 1..i + 3]), hex(&b[i + 3..i + 5]), hex(&b[i + 5..i + 7])) {
                        push(format!("#{}", &t[i + 1..i + 7].to_uppercase()), [r, g, bl]);
                        found = true;
                    }
                } else if run == 3 {
                    let d = |k: usize| (b[i + 1 + k] as char).to_digit(16).unwrap() as u8 * 17;
                    push(format!("#{}", &t[i + 1..i + 4].to_uppercase()), [d(0), d(1), d(2)]);
                    found = true;
                }
                i += 1 + run;
            } else {
                i += 1;
            }
        }
        if found || t.starts_with('#') {
            continue;
        }
        // GPL: "R G B ad"
        let mut it = t.split_whitespace();
        let nums: Vec<u8> = it.by_ref().take(3).filter_map(|x| x.parse::<u8>().ok()).collect();
        if nums.len() == 3 {
            let name: String = it.collect::<Vec<_>>().join(" ");
            push(if name.is_empty() { format!("{} {} {}", nums[0], nums[1], nums[2]) } else { name.chars().take(40).collect() }, [nums[0], nums[1], nums[2]]);
        }
    }
    if out.is_empty() {
        return Err("Dosyada renk bulunamadı (#RRGGBB ya da “R G B ad” satırları beklenir)".into());
    }
    Ok(out)
}

/// Paleti sahneye kaplama olarak ekler (tür: `palet`); eklenen kimlikleri döner.
pub fn import(scene: &mut Scene, palette_name: &str, text: &str) -> Result<Vec<String>, String> {
    let colors = parse(text)?;
    let base = crate::formula::slug(palette_name);
    let base = if base.is_empty() { "palet".to_string() } else { base.chars().take(24).collect() };
    let mut ids = vec![];
    for (name, color) in colors {
        let mut k = 1;
        let id = loop {
            let c = format!("palet-{base}-{k}");
            if !scene.materials.iter().any(|m| m.id == c) {
                break c;
            }
            k += 1;
        };
        scene.materials.push(Material { id: id.clone(), name: format!("{} · {}", palette_name.chars().take(30).collect::<String>(), name), color, roughness: 0.85, category: "palet".into(), ..Default::default() });
        ids.push(id);
    }
    Ok(ids)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_hex_lists_json_and_gpl() {
        let p = parse("#FF0000\n#0f0, #00F\n[\"#112233\", \"#112233\"]\n").unwrap();
        assert_eq!(p.len(), 4, "yinelenen renk atılır");
        assert_eq!(p[0].1, [1.0, 0.0, 0.0]);
        assert_eq!(p[1].1, [0.0, 1.0, 0.0]);
        let g = parse("GIMP Palette\nName: Ev\nColumns: 4\n# yorum\n200  180 150\tKum beji\n 34 48 88 Lacivert\n").unwrap();
        assert_eq!(g.len(), 2);
        assert_eq!(g[0].0, "Kum beji");
        assert!((g[1].1[2] - 88.0 / 255.0).abs() < 1e-6);
        assert!(parse("merhaba dünya").is_err());
        assert!(parse(&"#123456\n".repeat(200)).unwrap().len() == 1);
    }

    #[test]
    fn import_adds_palette_materials() {
        let mut s = Scene::default();
        let n = s.materials.len();
        let ids = import(&mut s, "Yaz Evi", "#E8DCC8\n#6B8F71\n#2B3A55").unwrap();
        assert_eq!(ids, vec!["palet-yaz_evi-1", "palet-yaz_evi-2", "palet-yaz_evi-3"]);
        assert_eq!(s.materials.len(), n + 3);
        assert!(s.materials.iter().filter(|m| m.category == "palet").all(|m| m.name.starts_with("Yaz Evi")));
        let more = import(&mut s, "Yaz Evi", "#000000").unwrap();
        assert_eq!(more, vec!["palet-yaz_evi-4"]);
    }
}
