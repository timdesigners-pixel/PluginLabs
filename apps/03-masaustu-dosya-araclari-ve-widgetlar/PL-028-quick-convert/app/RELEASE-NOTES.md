# Quick Convert 0.1.0 — önizleme (Windows)

İlk çalışan sürüm. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `QuickConvert-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `QuickConvert-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri, test verisi)

## Neler var
- **Sürükle-bırak:** ana penceredeki alana ya da masaüstünde her zaman üstte duran, sürüklenebilir **bırakma kutusuna** bırakın; bırakma kutusu isteğe bağlı olarak geçerli ayarlarla hemen dönüştürür. "Dosya seç" ve "Birlikte aç" da çalışır.
- **Görüntü:** PNG, JPEG, WebP, GIF (ilk kare), BMP → PNG, JPEG, WebP. Kalite, hedef boyut (en fazla … KB; kalite kendiliğinden düşürülür), kutuya sığdırma ya da yüzde (oran korunur, asla büyütülmez), JPEG için saydam alan rengi. Hazır ayarlar: E-posta/WhatsApp, Web (WebP), Instagram 1080×1350, Kayıpsız PNG, En fazla 200 KB.
- **Metin kodlaması:** UTF-8, UTF-8 (BOM'lu, Excel için), UTF-16 LE/BE, Windows-1254 (Türkçe ANSI); otomatik algılama (BOM, UTF-16 deseni, katı UTF-8 doğrulaması); satır sonu CRLF/LF. Hedefte gösterilemeyen karakterler (ör. Windows-1254'te “₺”) varsayılan olarak dönüştürmeyi durdurur ve listelenir; izin verirseniz “?” yazılır.
- **Kaynak korunur, çıktı doğrulanır:** kaynak yalnız okunur (öncesi/sonrası SHA-256 karşılaştırılır); sonuç “-donusturuldu” ekli **yeni** dosyaya yazılır, var olan dosyanın üzerine yazılmaz. Görüntü çıktısı yeniden açılır, biçimi ve ölçüleri denetlenir; metin geri çözülerek kayıpsızlık doğrulanır.
- **Boyut ve kalite gösterilir:** her sonuçta yeni boyut ve değişim yüzdesi, piksel ölçüleri, kalite ve kaynakla karşılaştırmalı PSNR (dB) ölçüsü.
- **Desteklenmeyen açıkça söylenir:** yürütülebilir (.exe/.dll, ELF), betik (#!), PDF, Office/ZIP, RAR/7z, HEIC/AVIF, TIFF, ICO, SVG içerikten tanınır ve nedeniyle reddedilir; uzantı içerikle uyuşmazsa uyarılır.
- **Ayar önerisi:** "Ne istiyorsunuz?" kutusuna yazılan cümleden kurala dayalı yerel öneri (gerekçeli) ve isteğe bağlı **MyMind** önerisi (PluginLabs Hub üzerinden): yalnız ihtiyaç cümlesi ile dosyanın türü/ölçüsü gönderilir, dosya adı/yolu/içeriği gönderilmez; her istekte onay; yanıt yalnız izinli alanlarla doğrulanır; siz uygulamadıkça ayarlara yazılmaz. Dönüştürmeyi MyMind yapmaz.
- **Geçmiş:** son 300 dönüşüm (boyut, ölçü, kalite), "Klasörde göster"; Windows kasasıyla (DPAPI) şifreli.
- Ctrl+K komut paleti, Ctrl+Enter dönüştür, Ctrl+1–3 bölümler; hareketi azalt seçeneği (sistem ayarı da izlenir).

## Sınırlar
- Görüntü en fazla 50 MB, 16384 px kenar ve 100 MP; metin en fazla 20 MB; kuyrukta 50 dosya. Toplu kuyruk (Pro) ve HEIC/AVIF/PDF gibi biçimler sonraki sürümler için değerlendirilecek.
- Yeniden kodlanan görüntüde EXIF/konum gibi meta veriler çıktıya taşınmaz (yön bilgisi uygulanır).
- Doğrulama: birim testleri ve gerçek Electron penceresinde otomatik duman testi (Windows + Linux). Windows DPI, ekran okuyucu ve gerçek masaüstünde elle test yapılmadı.
