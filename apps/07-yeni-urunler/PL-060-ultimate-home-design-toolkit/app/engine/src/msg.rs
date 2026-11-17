//! Arayüzün çevireceği iletiler: "@anahtar|ad=değer|…". Metinler dil dosyalarındadır (ui/locales).

/// Bir adla ilişkili hata: "{ad}: {neden}". Neden iç içe bir ileti olabilir; ayırıcısı kaçışlanır.
pub fn named(name: &str, reason: &str) -> String {
    format!("@named_error|name={}|reason={}", name.replace('|', "/"), reason.replace('|', "¦"))
}

#[cfg(test)]
mod tests {
    #[test]
    fn nests_a_keyed_reason() {
        assert_eq!(super::named("Salon", "@opening_overlap|id=P1"), "@named_error|name=Salon|reason=@opening_overlap¦id=P1");
    }
}
