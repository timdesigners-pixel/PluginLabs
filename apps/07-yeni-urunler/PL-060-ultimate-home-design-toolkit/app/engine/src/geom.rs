//! 2B plan geometrisi (mm).

pub type P2 = [f64; 2];

pub fn sub(a: P2, b: P2) -> P2 {
    [a[0] - b[0], a[1] - b[1]]
}
pub fn len(a: P2) -> f64 {
    (a[0] * a[0] + a[1] * a[1]).sqrt()
}
pub fn dist(a: P2, b: P2) -> f64 {
    len(sub(a, b))
}
pub fn lerp(a: P2, b: P2, t: f64) -> P2 {
    [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

/// İşaretli alan (saat yönü tersine pozitif), mm².
pub fn signed_area(poly: &[P2]) -> f64 {
    if poly.len() < 3 {
        return 0.0;
    }
    let mut s = 0.0;
    for i in 0..poly.len() {
        let a = poly[i];
        let b = poly[(i + 1) % poly.len()];
        s += a[0] * b[1] - b[0] * a[1];
    }
    s * 0.5
}
pub fn area(poly: &[P2]) -> f64 {
    signed_area(poly).abs()
}
pub fn perimeter(poly: &[P2]) -> f64 {
    if poly.len() < 2 {
        return 0.0;
    }
    (0..poly.len()).map(|i| dist(poly[i], poly[(i + 1) % poly.len()])).sum()
}
pub fn centroid(poly: &[P2]) -> P2 {
    let a = signed_area(poly);
    if a.abs() < 1e-9 {
        let n = poly.len().max(1) as f64;
        let s = poly.iter().fold([0.0, 0.0], |acc, p| [acc[0] + p[0], acc[1] + p[1]]);
        return [s[0] / n, s[1] / n];
    }
    let (mut cx, mut cy) = (0.0, 0.0);
    for i in 0..poly.len() {
        let p = poly[i];
        let q = poly[(i + 1) % poly.len()];
        let f = p[0] * q[1] - q[0] * p[1];
        cx += (p[0] + q[0]) * f;
        cy += (p[1] + q[1]) * f;
    }
    [cx / (6.0 * a), cy / (6.0 * a)]
}
pub fn bbox(poly: &[P2]) -> (P2, P2) {
    let mut mn = [f64::INFINITY; 2];
    let mut mx = [f64::NEG_INFINITY; 2];
    for p in poly {
        mn = [mn[0].min(p[0]), mn[1].min(p[1])];
        mx = [mx[0].max(p[0]), mx[1].max(p[1])];
    }
    (mn, mx)
}
pub fn point_in_poly(p: P2, poly: &[P2]) -> bool {
    let mut inside = false;
    let n = poly.len();
    let mut j = n.wrapping_sub(1);
    for i in 0..n {
        let (a, b) = (poly[i], poly[j]);
        if (a[1] > p[1]) != (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0] {
            inside = !inside;
        }
        j = i;
    }
    inside
}
/// Noktanın doğru parçasına uzaklığı.
pub fn dist_to_segment(p: P2, a: P2, b: P2) -> f64 {
    let ab = sub(b, a);
    let l2 = ab[0] * ab[0] + ab[1] * ab[1];
    if l2 < 1e-12 {
        return dist(p, a);
    }
    let t = (((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2).clamp(0.0, 1.0);
    dist(p, lerp(a, b, t))
}

fn cross(o: P2, a: P2, b: P2) -> f64 {
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
}

/// Kulak kırpma üçgenleme. Çokgen saat yönünde de olsa sonuç saat yönü tersine üçgenlerdir.
pub fn triangulate(poly: &[P2]) -> Vec<[usize; 3]> {
    let n = poly.len();
    if n < 3 {
        return vec![];
    }
    let mut idx: Vec<usize> = (0..n).collect();
    if signed_area(poly) < 0.0 {
        idx.reverse();
    }
    let mut out = Vec::with_capacity(n - 2);
    let mut guard = 0usize;
    while idx.len() > 3 && guard < n * n + 10 {
        guard += 1;
        let m = idx.len();
        let mut clipped = false;
        for i in 0..m {
            let (ia, ib, ic) = (idx[(i + m - 1) % m], idx[i], idx[(i + 1) % m]);
            let (a, b, c) = (poly[ia], poly[ib], poly[ic]);
            if cross(a, b, c) <= 1e-9 {
                continue;
            }
            let mut ear = true;
            for &k in &idx {
                if k == ia || k == ib || k == ic {
                    continue;
                }
                let p = poly[k];
                if cross(a, b, p) >= 0.0 && cross(b, c, p) >= 0.0 && cross(c, a, p) >= 0.0 {
                    ear = false;
                    break;
                }
            }
            if ear {
                out.push([ia, ib, ic]);
                idx.remove(i);
                clipped = true;
                break;
            }
        }
        if !clipped {
            break;
        }
    }
    if idx.len() == 3 {
        out.push([idx[0], idx[1], idx[2]]);
    } else if idx.len() > 3 {
        // Bozuk (kendini kesen) çokgen: yelpaze ile tamamla.
        for i in 1..idx.len() - 1 {
            out.push([idx[0], idx[i], idx[i + 1]]);
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rectangle_measures() {
        let r = vec![[0.0, 0.0], [4000.0, 0.0], [4000.0, 3000.0], [0.0, 3000.0]];
        assert_eq!(area(&r), 12_000_000.0);
        assert_eq!(perimeter(&r), 14_000.0);
        assert_eq!(centroid(&r), [2000.0, 1500.0]);
        assert!(point_in_poly([100.0, 100.0], &r));
        assert!(!point_in_poly([5000.0, 100.0], &r));
    }
    #[test]
    fn l_shape_triangulation_covers_area() {
        let l = vec![[0.0, 0.0], [6.0, 0.0], [6.0, 2.0], [2.0, 2.0], [2.0, 5.0], [0.0, 5.0]];
        let tris = triangulate(&l);
        assert_eq!(tris.len(), 4);
        let sum: f64 = tris.iter().map(|t| area(&[l[t[0]], l[t[1]], l[t[2]]])).sum();
        assert!((sum - area(&l)).abs() < 1e-9);
        // saat yönündeki çokgen de çalışır
        let mut cw = l.clone();
        cw.reverse();
        let sum2: f64 = triangulate(&cw).iter().map(|t| area(&[cw[t[0]], cw[t[1]], cw[t[2]]])).sum();
        assert!((sum2 - area(&l)).abs() < 1e-9);
    }
    #[test]
    fn segment_distance() {
        assert_eq!(dist_to_segment([5.0, 3.0], [0.0, 0.0], [10.0, 0.0]), 3.0);
        assert_eq!(dist_to_segment([-4.0, 3.0], [0.0, 0.0], [10.0, 0.0]), 5.0);
    }
}
