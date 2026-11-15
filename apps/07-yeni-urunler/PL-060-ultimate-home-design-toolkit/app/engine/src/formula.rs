//! Kullanıcı fonksiyonları için güvenli formül dili.
//!
//! Desteklenenler: sayılar (`12.5`), değişkenler (`floor_area`), `+ - * / ^ %`,
//! karşılaştırma (`< <= > >= == !=`, sonuç 1/0), parantez ve
//! `min max ceil floor round abs sqrt pow if clamp` fonksiyonları.
//! Kod çalıştırma, döngü ya da dış erişim yoktur; uzunluk ve derinlik sınırlıdır.

use std::collections::BTreeMap;

pub const MAX_LEN: usize = 600;
const MAX_DEPTH: usize = 48;

#[derive(Debug, Clone, PartialEq)]
enum Tok {
    Num(f64),
    Id(String),
    Op(&'static str),
    LParen,
    RParen,
    Comma,
}

fn lex(src: &str) -> Result<Vec<Tok>, String> {
    if src.len() > MAX_LEN {
        return Err(format!("Formül en fazla {MAX_LEN} karakter olabilir"));
    }
    let c: Vec<char> = src.chars().collect();
    let mut i = 0;
    let mut out = vec![];
    while i < c.len() {
        let ch = c[i];
        if ch.is_whitespace() {
            i += 1;
            continue;
        }
        if ch.is_ascii_digit() || (ch == '.' && c.get(i + 1).is_some_and(|d| d.is_ascii_digit())) {
            let s = i;
            while i < c.len() && (c[i].is_ascii_digit() || c[i] == '.') {
                i += 1;
            }
            if i < c.len() && (c[i] == 'e' || c[i] == 'E') {
                let save = i;
                i += 1;
                if i < c.len() && (c[i] == '+' || c[i] == '-') {
                    i += 1;
                }
                if i < c.len() && c[i].is_ascii_digit() {
                    while i < c.len() && c[i].is_ascii_digit() {
                        i += 1;
                    }
                } else {
                    i = save;
                }
            }
            let t: String = c[s..i].iter().collect();
            out.push(Tok::Num(t.parse().map_err(|_| format!("Geçersiz sayı: {t}"))?));
            continue;
        }
        if ch.is_alphabetic() || ch == '_' {
            let s = i;
            while i < c.len() && (c[i].is_alphanumeric() || c[i] == '_') {
                i += 1;
            }
            out.push(Tok::Id(c[s..i].iter().collect::<String>().to_lowercase()));
            continue;
        }
        let two: String = c[i..(i + 2).min(c.len())].iter().collect();
        let op2 = match two.as_str() {
            "<=" => Some("<="),
            ">=" => Some(">="),
            "==" => Some("=="),
            "!=" => Some("!="),
            "&&" => Some("&&"),
            "||" => Some("||"),
            _ => None,
        };
        if let Some(o) = op2 {
            out.push(Tok::Op(o));
            i += 2;
            continue;
        }
        let t = match ch {
            '+' => Tok::Op("+"),
            '-' => Tok::Op("-"),
            '*' => Tok::Op("*"),
            '/' => Tok::Op("/"),
            '^' => Tok::Op("^"),
            '%' => Tok::Op("%"),
            '<' => Tok::Op("<"),
            '>' => Tok::Op(">"),
            '(' => Tok::LParen,
            ')' => Tok::RParen,
            ',' | ';' => Tok::Comma,
            _ => return Err(format!("Beklenmeyen karakter: '{ch}'")),
        };
        out.push(t);
        i += 1;
    }
    Ok(out)
}

#[derive(Debug, Clone)]
pub enum Expr {
    Num(f64),
    Var(String),
    Neg(Box<Expr>),
    Bin(&'static str, Box<Expr>, Box<Expr>),
    Call(String, Vec<Expr>),
}

struct Parser {
    t: Vec<Tok>,
    p: usize,
    depth: usize,
}

impl Parser {
    fn peek(&self) -> Option<&Tok> {
        self.t.get(self.p)
    }
    fn next(&mut self) -> Option<Tok> {
        let t = self.t.get(self.p).cloned();
        self.p += 1;
        t
    }
    fn enter(&mut self) -> Result<(), String> {
        self.depth += 1;
        if self.depth > MAX_DEPTH {
            Err("Formül çok derin".into())
        } else {
            Ok(())
        }
    }
    fn binary(&mut self, level: usize) -> Result<Expr, String> {
        const LEVELS: [&[&str]; 5] = [&["||"], &["&&"], &["<", "<=", ">", ">=", "==", "!="], &["+", "-"], &["*", "/", "%"]];
        if level == LEVELS.len() {
            return self.power();
        }
        self.enter()?;
        let mut lhs = self.binary(level + 1)?;
        while let Some(Tok::Op(o)) = self.peek() {
            let o = *o;
            if !LEVELS[level].contains(&o) {
                break;
            }
            self.p += 1;
            let rhs = self.binary(level + 1)?;
            lhs = Expr::Bin(o, Box::new(lhs), Box::new(rhs));
        }
        self.depth -= 1;
        Ok(lhs)
    }
    fn power(&mut self) -> Result<Expr, String> {
        self.enter()?;
        let base = self.unary()?;
        let r = if let Some(Tok::Op("^")) = self.peek() {
            self.p += 1;
            let exp = self.power()?; // sağdan birleşimli
            Expr::Bin("^", Box::new(base), Box::new(exp))
        } else {
            base
        };
        self.depth -= 1;
        Ok(r)
    }
    fn unary(&mut self) -> Result<Expr, String> {
        self.enter()?;
        let r = match self.peek() {
            Some(Tok::Op("-")) => {
                self.p += 1;
                Expr::Neg(Box::new(self.unary()?))
            }
            Some(Tok::Op("+")) => {
                self.p += 1;
                self.unary()?
            }
            _ => self.atom()?,
        };
        self.depth -= 1;
        Ok(r)
    }
    fn atom(&mut self) -> Result<Expr, String> {
        match self.next() {
            Some(Tok::Num(n)) => Ok(Expr::Num(n)),
            Some(Tok::Id(name)) => {
                if let Some(Tok::LParen) = self.peek() {
                    self.p += 1;
                    let mut args = vec![];
                    if !matches!(self.peek(), Some(Tok::RParen)) {
                        loop {
                            args.push(self.binary(0)?);
                            match self.next() {
                                Some(Tok::Comma) => continue,
                                Some(Tok::RParen) => break,
                                _ => return Err(format!("{name}(…) kapatılmadı")),
                            }
                        }
                    } else {
                        self.p += 1;
                    }
                    Ok(Expr::Call(name, args))
                } else {
                    Ok(Expr::Var(name))
                }
            }
            Some(Tok::LParen) => {
                let e = self.binary(0)?;
                match self.next() {
                    Some(Tok::RParen) => Ok(e),
                    _ => Err("Kapanış parantezi eksik".into()),
                }
            }
            Some(t) => Err(format!("Beklenmeyen öğe: {t:?}")),
            None => Err("Formül eksik bitti".into()),
        }
    }
}

pub fn parse(src: &str) -> Result<Expr, String> {
    let t = lex(src)?;
    if t.is_empty() {
        return Err("Formül boş".into());
    }
    let mut p = Parser { t, p: 0, depth: 0 };
    let e = p.binary(0)?;
    if p.p != p.t.len() {
        return Err("Formülün sonunda fazladan öğe var".into());
    }
    Ok(e)
}

pub type Vars = BTreeMap<String, f64>;

pub fn eval(e: &Expr, vars: &Vars) -> Result<f64, String> {
    let v = match e {
        Expr::Num(n) => *n,
        Expr::Var(name) => match name.as_str() {
            "pi" => std::f64::consts::PI,
            _ => *vars.get(name).ok_or_else(|| format!("Bilinmeyen değişken: {name}"))?,
        },
        Expr::Neg(x) => -eval(x, vars)?,
        Expr::Bin(op, a, b) => {
            let x = eval(a, vars)?;
            let y = eval(b, vars)?;
            match *op {
                "+" => x + y,
                "-" => x - y,
                "*" => x * y,
                "/" => {
                    if y == 0.0 {
                        return Err("Sıfıra bölme".into());
                    }
                    x / y
                }
                "%" => {
                    if y == 0.0 {
                        return Err("Sıfıra göre mod".into());
                    }
                    x % y
                }
                "^" => x.powf(y),
                "<" => (x < y) as i32 as f64,
                "<=" => (x <= y) as i32 as f64,
                ">" => (x > y) as i32 as f64,
                ">=" => (x >= y) as i32 as f64,
                "==" => ((x - y).abs() < 1e-9) as i32 as f64,
                "!=" => ((x - y).abs() >= 1e-9) as i32 as f64,
                "&&" => (x != 0.0 && y != 0.0) as i32 as f64,
                "||" => (x != 0.0 || y != 0.0) as i32 as f64,
                _ => return Err(format!("Bilinmeyen işlem {op}")),
            }
        }
        Expr::Call(f, args) => {
            let need = |n: usize| -> Result<(), String> {
                if args.len() == n {
                    Ok(())
                } else {
                    Err(format!("{f}() {n} değer bekler"))
                }
            };
            match f.as_str() {
                "if" => {
                    need(3)?;
                    if eval(&args[0], vars)? != 0.0 {
                        eval(&args[1], vars)?
                    } else {
                        eval(&args[2], vars)?
                    }
                }
                "min" | "max" => {
                    if args.is_empty() {
                        return Err(format!("{f}() en az bir değer bekler"));
                    }
                    let mut it = args.iter().map(|a| eval(a, vars));
                    let mut acc = it.next().unwrap()?;
                    for x in it {
                        let x = x?;
                        acc = if f == "min" { acc.min(x) } else { acc.max(x) };
                    }
                    acc
                }
                "ceil" => {
                    need(1)?;
                    eval(&args[0], vars)?.ceil()
                }
                "floor" => {
                    need(1)?;
                    eval(&args[0], vars)?.floor()
                }
                "abs" => {
                    need(1)?;
                    eval(&args[0], vars)?.abs()
                }
                "sqrt" => {
                    need(1)?;
                    let x = eval(&args[0], vars)?;
                    if x < 0.0 {
                        return Err("Negatif sayının karekökü".into());
                    }
                    x.sqrt()
                }
                "pow" => {
                    need(2)?;
                    eval(&args[0], vars)?.powf(eval(&args[1], vars)?)
                }
                "clamp" => {
                    need(3)?;
                    let (x, lo, hi) = (eval(&args[0], vars)?, eval(&args[1], vars)?, eval(&args[2], vars)?);
                    x.max(lo).min(hi)
                }
                "round" => {
                    if args.len() == 1 {
                        eval(&args[0], vars)?.round()
                    } else {
                        need(2)?;
                        let d = eval(&args[1], vars)?.clamp(0.0, 9.0);
                        let k = 10f64.powf(d.round());
                        (eval(&args[0], vars)? * k).round() / k
                    }
                }
                _ => return Err(format!("Bilinmeyen fonksiyon: {f}()")),
            }
        }
    };
    if !v.is_finite() {
        return Err("Sonuç sonlu bir sayı değil".into());
    }
    Ok(v)
}

pub fn evaluate(src: &str, vars: &Vars) -> Result<f64, String> {
    eval(&parse(src)?, vars)
}

/// Formülde geçen değişken adları (doğrulama ve arayüz ipuçları için).
pub fn variables(src: &str) -> Result<Vec<String>, String> {
    fn walk(e: &Expr, out: &mut Vec<String>) {
        match e {
            Expr::Var(v) if v != "pi" => {
                if !out.contains(v) {
                    out.push(v.clone())
                }
            }
            Expr::Neg(x) => walk(x, out),
            Expr::Bin(_, a, b) => {
                walk(a, out);
                walk(b, out)
            }
            Expr::Call(_, a) => a.iter().for_each(|x| walk(x, out)),
            _ => {}
        }
    }
    let mut out = vec![];
    walk(&parse(src)?, &mut out);
    Ok(out)
}

/// Değişken adı için güvenli kısa ad: küçük harf, Türkçe karakterler sadeleşir.
pub fn slug(s: &str) -> String {
    let mut out = String::new();
    for ch in s.to_lowercase().chars() {
        let c = match ch {
            'ç' => 'c',
            'ğ' => 'g',
            'ı' => 'i',
            'ö' => 'o',
            'ş' => 's',
            'ü' => 'u',
            'â' => 'a',
            'î' => 'i',
            'û' => 'u',
            c if c.is_ascii_alphanumeric() => c,
            _ => '_',
        };
        if c == '_' && out.ends_with('_') {
            continue;
        }
        out.push(c);
    }
    out.trim_matches('_').to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    fn v(pairs: &[(&str, f64)]) -> Vars {
        pairs.iter().map(|(k, v)| (k.to_string(), *v)).collect()
    }
    #[test]
    fn arithmetic_and_precedence() {
        let e = Vars::new();
        assert_eq!(evaluate("1 + 2 * 3", &e).unwrap(), 7.0);
        assert_eq!(evaluate("(1 + 2) * 3", &e).unwrap(), 9.0);
        assert_eq!(evaluate("2 ^ 3 ^ 2", &e).unwrap(), 512.0);
        assert_eq!(evaluate("-2 ^ 2", &e).unwrap(), 4.0);
        assert_eq!(evaluate("10 % 4", &e).unwrap(), 2.0);
        assert_eq!(evaluate("1.5e3", &e).unwrap(), 1500.0);
    }
    #[test]
    fn variables_and_functions() {
        let vars = v(&[("floor_area", 82.4), ("doors", 5.0)]);
        assert_eq!(evaluate("ceil(floor_area / 1.44 * 1.08)", &vars).unwrap(), 62.0);
        assert_eq!(evaluate("if(doors > 4, 1500, 900)", &vars).unwrap(), 1500.0);
        assert_eq!(evaluate("round(floor_area * 1.1, 1)", &vars).unwrap(), 90.6);
        assert_eq!(evaluate("max(1, doors, 3)", &vars).unwrap(), 5.0);
        assert_eq!(evaluate("clamp(doors, 0, 2)", &vars).unwrap(), 2.0);
        assert_eq!(variables("a + b * a").unwrap(), vec!["a", "b"]);
    }
    #[test]
    fn errors_are_reported() {
        let e = Vars::new();
        assert!(evaluate("1 / 0", &e).unwrap_err().contains("Sıfır"));
        assert!(evaluate("unknown + 1", &e).unwrap_err().contains("Bilinmeyen"));
        assert!(evaluate("(1 + 2", &e).is_err());
        assert!(evaluate("1 +", &e).is_err());
        assert!(evaluate("system(1)", &e).is_err());
        assert!(evaluate(&"(".repeat(200), &e).is_err());
        assert!(evaluate(&"1+".repeat(400), &e).is_err());
    }
    #[test]
    fn slugs() {
        assert_eq!(slug("Çocuk Odası 2"), "cocuk_odasi_2");
        assert_eq!(slug("  Banyo / WC "), "banyo_wc");
    }
}
