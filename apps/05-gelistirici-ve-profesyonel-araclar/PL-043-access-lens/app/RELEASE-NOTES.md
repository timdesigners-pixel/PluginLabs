# Access Lens 0.1.0 — önizleme (Windows)

PL-043 Access Lens'in ilk Windows masaüstü sürümü. Seçilen HTML ve CSS kesitlerinde **kontrast, etiket, odak sırası ve semantik erişilebilirlik** sorunlarını raporlar; sorun seçildiğinde **ilgili öğeyi ve satır numarasını** gösterir. **Standart sürümü (`WCAG 2.2`) ve kural motoru (`AccessLens-Rules 1.0.0`) açıkça görünür; otomatik denetim sonucu erişilebilirlik sertifikası olarak sunulmaz.**

## Dosyalar
- `AccessLens-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne)
- `AccessLens-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png`

## Neler var
- **12 WCAG 2.2 kuralı:** AA (4.5:1 / büyük metin 3:1) ve AAA (7:1 / 4.5:1) kontrast oranı + erişilebilir renk önerisi, `img[alt]`, form `label`/`aria-label`, boş `button` ve belirsiz `a` adı, pozitif `tabindex`, klavyesiz `onclick` div/span, `outline: none`, `html[lang]`, `<main>` landmark ve başlık düzeyi atlama (`h1` → `h3`).
- **İlgili öğe vurgusu ve düzeltme taslağı:** bulgu seçildiğinde kaynak kodda ilgili satır işaretlenir ve uygulanabilir düzeltme taslağı sunulur.
- **Manuel kontrol listesi:** klavye erişimi, görünür odak, ekran okuyucu okuma sırası ve %200 büyütme/yeniden akış maddeleri.
- **Doğrulama ölçütü:** bilinen 4 fixture üzerinde %100 bulgu duyarlılığı (11/11) ve %0 kritik yanlış olumlu (hedef < %5).
- **MyMind / yerel model:** yalnız loopback (`127.0.0.1`/`localhost`), her istekte onay ve kişisel veri maskelemesiyle sade açıklama ve düzeltme taslağı.
- **Dışa aktarma:** Markdown rapor (`.md`), CSV tablo (`.csv`, formül enjeksiyonu korumalı) ve JSON yedek.
