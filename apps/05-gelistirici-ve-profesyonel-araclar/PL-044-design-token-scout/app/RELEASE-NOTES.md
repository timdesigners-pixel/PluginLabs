# Design Token Scout 0.1.0 — önizleme (Windows)

PL-044 Design Token Scout'un ilk Windows masaüstü sürümü. Seçilen arayüzün computed style JSON, CSS ve HTML örneklerinden **renk, yazı, boşluk ve köşe yarıçapı** değerlerini çıkarır, yakın değerleri kümeleyerek token tekrarını azaltır ve **kullanıcı onayıyla W3C Design Tokens JSON** üretir.

## Dosyalar
- `DesignTokenScout-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne)
- `DesignTokenScout-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png`

## Neler var
- **Stil ve Computed Style çıkarımı:** `hex`/`rgb`/`hsl` renkleri, `font-family`/`font-size`/`font-weight`/`line-height` tipografi değerlerini, `padding`/`margin`/`gap` boşluklarını ve `border-radius` köşe yarıçaplarını ayrıştırır.
- **Yakın değer kümelemesi:** ayarlanabilir RGB Öklid mesafesi ve piksel toleransı ile sapmalı değerleri (`#7c6cff` / `#7d6dff`, `15px` / `16px`) tek token adayında birleştirir (%26,3 tekrar azalması).
- **Doğrulama ölçütü:** örnek 5 sayfa (varsayılan, form, veri tablosu, modal ve hover/focus dinamik durumları) üzerinde 22 ana tasarım değerini %100 kapsar (hedef ≥ %90).
- **Kullanıcı onaylı çıktı:** yalnız onaylanan adaylar W3C Design Tokens JSON (`$value`, `$type`), CSS `:root` değişkenleri ve Markdown belgesine aktarılır.
- **MyMind / yerel model:** yalnız loopback (`127.0.0.1`/`localhost`) üzerinden, her istekte onayla semantik token hiyerarşisi önerisi.
