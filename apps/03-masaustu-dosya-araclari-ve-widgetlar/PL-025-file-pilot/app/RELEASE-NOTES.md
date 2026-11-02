# File Pilot 0.1.0 — önizleme (Windows)

İlk sürüm. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `FilePilot-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `FilePilot-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `BENCH-windows.json` (paketlenmiş uygulamada ölçülen arama doğrulaması), `windows-*.png` (Windows runner'ında alınan gerçek pencere görüntüleri, test verisiyle)

## Neler var
- Seçtiğiniz klasörleri (en fazla 12) bu bilgisayarda indeksler: dosya adı, klasör yolu ve metin dosyalarının içeriği (txt, md, csv, json, log, html, xml, yaml, rtf, kod dosyaları…). Değişmeyen dosyalar yeniden okunmaz.
- Hatırladığınız birkaç sözcükle arama: Türkçe ekler ve aksanlar sorun değil ("odeme" → "ödemeler"), dosya adı ve klasör eşleşmesi öne çıkar.
- Süzgeçler: `#etiket`, `tür:metin|veri|web|kod|diger`, `uzantı:md`, `"tam ifade"`, `-hariç`; tür çipleri.
- Eşleşen bölüm önizlemesi: satır numaralı, eşleşen sözcükler işaretli; dosyayı aç, klasörde göster, yolu kopyala (klavye kısayollarıyla).
- Etiketler (dosyaya dokunmadan, yalnız indekste) ve benzer belge önerisi (içerik benzerliği).
- MyMind (PluginLabs Hub, yerel) ile anlamsal soru: önce yerel arama en ilgili ≤8 dosyayı bulur; onay penceresi tam olarak neyin gideceğini gösterir (soru + dosya adları + ≤360 karakterlik bölümler; tam yol, klasör, etiket, tarih gitmez). Yanıt dosyaya ve satıra bağlanır; alıntı dosyadaki metinle karşılaştırılır, tutmayan "doğrulanamadı" diye işaretlenir.
- İndeks Windows kasasıyla (DPAPI) şifreli tutulur. Dosyalar yalnız okunur: taşıma, silme, yeniden adlandırma yoktur.

## Doğrulama
- Notion ölçütü "1000 belgede bilinen dosyayı ilk 5 sonuçta bulma ≥ %90; p95 sorgu ≤ 1 sn" sentetik 1000 belgelik derlemde ölçülür (paketlenmiş uygulamada da: `BENCH-windows.json`). Linux'ta ilk 5 isabeti %99, p95 ≈ 7 ms. **Sentetiktir:** kullanıcı yalnız konunun genel sözcüklerini hatırlıyorsa (ör. yalnız "fatura ödeme") isabet belirgin düşer; geliştirmede tekdüze derlemle %66 ölçüldü.
- Birim testleri (çekirdek, tarayıcı, kıyaslama) ve gerçek Electron penceresinde otomatik duman testi (Windows runner + Linux xvfb).

## Sınırlar
- PDF ve Office (docx/xlsx) içerikleri bu sürümde okunmaz; adıyla bulunur. Şifreli/ikili dosyaların içeriği okunmaz.
- Dosya izleme yok: değişiklikler açılışta ya da "Yeniden tara" ile alınır.
- Linux/macOS paketi yok. Windows DPI, ekran okuyucu ve gerçek masaüstünde elle test yapılmadı.
