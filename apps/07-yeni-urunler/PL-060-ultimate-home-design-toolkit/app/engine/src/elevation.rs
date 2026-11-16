//! Cephe görünüşü (tel kafes): modül kabukları, döşeme çizgileri ve o cepheye bakan
//! kapı/pencereler. Karşılama ekranındaki önden bakış önizlemesi için.

use crate::model::{OpeningKind, Scene};
use crate::modules;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Elevation {
    /// [x0, y0, x1, y1, tür] — tür: 0 kabuk, 1 açıklık, 2 döşeme/parapet, 3 zemin, 4 doğrama ayrıntısı. mm; y yukarı.
    pub lines: Vec<[f64; 5]>,
    pub bounds: [f64; 4],
    pub modules: usize,
    pub openings: usize,
}

fn rect(out: &mut Vec<[f64; 5]>, x0: f64, y0: f64, x1: f64, y1: f64, kind: f64) {
    out.push([x0, y0, x1, y0, kind]);
    out.push([x1, y0, x1, y1, kind]);
    out.push([x1, y1, x0, y1, kind]);
    out.push([x0, y1, x0, y0, kind]);
}

/// `side`: on (güney, y küçük), arka, sol (x küçük), sag.
pub fn build(scene: &Scene, side: &str) -> Result<Elevation, String> {
    let edge = match side {
        "on" => 'G',
        "arka" => 'K',
        "sol" => 'B',
        "sag" => 'D',
        _ => return Err("Bilinmeyen cephe".into()),
    };
    let st = &scene.standard;
    let horizontal = edge == 'G' || edge == 'K';
    // arka ve sağ cephede soldan sağa yön tersine döner
    let flip = edge == 'K' || edge == 'B';
    let h = |v: f64| if flip { -v } else { v };
    let mut lines = vec![];
    let mut count = 0;
    for m in &scene.modules {
        let (mn, mx) = modules::rect(m, scene);
        let (a, b) = if horizontal { (mn[0], mx[0]) } else { (mn[1], mx[1]) };
        let base = m.floor as f64 * st.stack();
        let covered = scene.modules.iter().any(|u| u.floor == m.floor + 1 && u.on.as_deref() == Some(&m.id));
        let top = base + if covered { st.stack() } else { st.storey() };
        rect(&mut lines, h(a), base, h(b), top, 0.0);
        lines.push([h(a), base + st.bottom_slab, h(b), base + st.bottom_slab, 2.0]);
        lines.push([h(a), base + st.bottom_slab + st.net_height, h(b), base + st.bottom_slab + st.net_height, 2.0]);
        if !covered {
            lines.push([h(a), base + st.stack(), h(b), base + st.stack(), 2.0]);
        }
    }
    for l in &scene.levels {
        for o in &l.openings {
            let Some(w) = l.walls.iter().find(|w| w.id == o.wall) else { continue };
            // üretilmiş duvar kimliği: "<modül>-<kenar harfi><başlangıç>"
            let on_side = w.generated && w.exterior && w.id.rsplit('-').next().and_then(|t| t.chars().next()) == Some(edge);
            if !on_side {
                continue;
            }
            let start = if horizontal { w.a[0].min(w.b[0]) } else { w.a[1].min(w.b[1]) };
            let (x0, x1) = (h(start + o.offset), h(start + o.offset + o.width));
            let (y0, y1) = (l.elevation + o.sill, l.elevation + o.sill + o.height);
            rect(&mut lines, x0, y0, x1, y1, 1.0);
            count += 1;
            match o.kind {
                OpeningKind::Door => {
                    let inset = 60.0 * (x1 - x0).signum();
                    rect(&mut lines, x0 + inset, y0, x1 - inset, y1 - 60.0, 4.0);
                }
                OpeningKind::Window => {
                    let n = (o.width / 1200.0).floor().max(1.0) as i32;
                    for k in 1..=n {
                        let x = x0 + (x1 - x0) * k as f64 / (n + 1) as f64;
                        lines.push([x, y0, x, y1, 4.0]);
                    }
                }
            }
        }
    }
    if lines.is_empty() {
        return Err("Cephe için önce modül ekleyin".into());
    }
    let (mut x0, mut y0, mut x1, mut y1) = (f64::INFINITY, 0.0f64, f64::NEG_INFINITY, 0.0f64);
    for l in &lines {
        x0 = x0.min(l[0]).min(l[2]);
        x1 = x1.max(l[0]).max(l[2]);
        y0 = y0.min(l[1]).min(l[3]);
        y1 = y1.max(l[1]).max(l[3]);
    }
    let pad = (x1 - x0) * 0.08 + 400.0;
    lines.push([x0 - pad, 0.0, x1 + pad, 0.0, 3.0]);
    Ok(Elevation { lines, bounds: [x0 - pad, y0, x1 + pad, y1], modules: scene.modules.len(), openings: count })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn front_elevation_of_demo() {
        let s = crate::templates::demo_scene();
        let e = build(&s, "on").unwrap();
        // ön cephede dış kapı ve 250×235 pencere var (M1'in G kenarı)
        assert_eq!(e.openings, 2);
        assert_eq!(e.bounds[3], 3200.0);
        assert!(e.lines.iter().any(|l| l[4] == 1.0 && (l[2] - l[0]).abs() == 1000.0), "dış kapı 100 cm");
        assert!(e.lines.iter().any(|l| l[4] == 3.0));
        let back = build(&s, "arka").unwrap();
        assert_eq!(back.openings, 3);
        assert!(back.lines.iter().filter(|l| l[4] == 0.0).all(|l| l[0] <= 0.0 && l[2] <= 0.0), "arka cephe yansıtılır");
        assert_eq!(build(&s, "sag").unwrap().openings, 2);
        assert!(build(&s, "cati").is_err());
        assert!(build(&crate::templates::new_project("x"), "on").is_err());
    }
}
