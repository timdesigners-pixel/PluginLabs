use serde::{Deserialize, Serialize};

/// Görüntüleme ve içe aktarma birimi. İç hesaplar her zaman milimetredir.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum Unit {
    Mm,
    #[default]
    Cm,
    M,
    In,
    Ft,
}

impl Unit {
    /// 1 birimin milimetre karşılığı.
    pub fn mm(self) -> f64 {
        match self {
            Unit::Mm => 1.0,
            Unit::Cm => 10.0,
            Unit::M => 1000.0,
            Unit::In => 25.4,
            Unit::Ft => 304.8,
        }
    }
    pub fn to_mm(self, v: f64) -> f64 {
        v * self.mm()
    }
    pub fn from_mm(self, mm: f64) -> f64 {
        mm / self.mm()
    }
    pub fn label(self) -> &'static str {
        match self {
            Unit::Mm => "mm",
            Unit::Cm => "cm",
            Unit::M => "m",
            Unit::In => "in",
            Unit::Ft => "ft",
        }
    }
    pub fn parse(s: &str) -> Option<Unit> {
        match s.trim().to_lowercase().as_str() {
            "mm" => Some(Unit::Mm),
            "cm" => Some(Unit::Cm),
            "m" => Some(Unit::M),
            "in" | "inch" => Some(Unit::In),
            "ft" | "feet" => Some(Unit::Ft),
            _ => None,
        }
    }
}

pub const MM2_PER_M2: f64 = 1_000_000.0;
pub const MM3_PER_M3: f64 = 1_000_000_000.0;

/// Türkçe sayı biçimi: binlik ayırıcı nokta, ondalık virgül (ör. 1.249,90).
pub fn fmt_tr(v: f64, decimals: usize) -> String {
    if !v.is_finite() {
        return "—".into();
    }
    let s = format!("{:.*}", decimals, v.abs());
    let (int, frac) = match s.split_once('.') {
        Some((a, b)) => (a.to_string(), Some(b.to_string())),
        None => (s.clone(), None),
    };
    let mut grouped = String::new();
    for (i, ch) in int.chars().enumerate() {
        if i > 0 && (int.len() - i) % 3 == 0 {
            grouped.push('.');
        }
        grouped.push(ch);
    }
    let neg = v < 0.0 && s.chars().any(|c| c != '0' && c != '.');
    let mut out = String::new();
    if neg {
        out.push('-');
    }
    out.push_str(&grouped);
    if let Some(f) = frac {
        out.push(',');
        out.push_str(&f);
    }
    out
}

pub fn fmt_try(v: f64) -> String {
    format!("{} ₺", fmt_tr(v, 2))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn conversions_roundtrip() {
        for u in [Unit::Mm, Unit::Cm, Unit::M, Unit::In, Unit::Ft] {
            let mm = u.to_mm(3.5);
            assert!((u.from_mm(mm) - 3.5).abs() < 1e-12);
        }
        assert_eq!(Unit::Ft.to_mm(1.0), 304.8);
        assert_eq!(Unit::parse("CM"), Some(Unit::Cm));
    }
    #[test]
    fn turkish_format() {
        assert_eq!(fmt_tr(1249.9, 2), "1.249,90");
        assert_eq!(fmt_tr(1234567.0, 0), "1.234.567");
        assert_eq!(fmt_tr(-12.5, 1), "-12,5");
        assert_eq!(fmt_tr(0.0, 2), "0,00");
        assert_eq!(fmt_try(999.0), "999,00 ₺");
    }
}
