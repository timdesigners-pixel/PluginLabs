# Screenshot Studio 0.1.0 — önizleme (Windows)

İlk çalışan sürüm. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `ScreenshotStudio-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `ScreenshotStudio-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri ve uygulamanın gerçek bir çıktısı, test verisi)

## Neler var
- **Yakalama:** bölge (tam ekran seçim katmanı; fare ya da klavye: oklar, Alt+oklar, Enter, Ctrl+A), tüm ekran, açık bir pencere, görüntü dosyası (PNG/JPEG/BMP/GIF/WebP) ve pano. Genel kısayol (varsayılan Ctrl+Shift+X; Ctrl+Alt+S, Ctrl+Shift+2, PrtSc ya da kapalı). Yakalarken pencere gizlenir.
- **İşaretleme:** ok, kutu, otomatik artan **numara**, metin, vurgu, bulanıklaştırma, **kalıcı maske**, kırpma; 7 renk; seç/taşı/sil; geri al/yinele (Ctrl+Z / Ctrl+Y); araç kısayolları V A R N T H B M C.
- **Pencere çerçevesi:** yok / boşluk ve gölge / pencere (başlık çubuğu, isteğe bağlı başlık); 4 zemin.
- **Hassas alan adayları (cihazda):** görüntüdeki yazı Tesseract ile çevrimdışı okunur; e-posta, telefon, IBAN (mod 97), kart numarası (Luhn), T.C. kimlik (sağlama), IP, API anahtarı/erişim belirteci, "şifre:/PIN:/token:" gibi etiketli değerler ve bağlantıdaki gizli parametreler **aday** olarak işaretlenir. Siz kabul etmedikçe maskelenmez; aday listesinde değerin kendisi değil kısaltılmış ipucu gösterilir.
- **Kalıcı maske, piksel piksel doğrulama:** maskeler her zaman en son çizilir. Kopyalama/kaydetme öncesinde çıktı ana süreçte yeniden çözülür ve her maskenin içindeki **her piksel** maske rengine birebir eşit mi denetlenir; değilse hiçbir şey yazılmaz/kopyalanmaz. JPEG, doğrulanmış bu piksellerden üretilir.
- **Panoya kopyala / kaydet:** PNG ya da JPEG; yeni dosya (var olanın üzerine yazılmaz), varsayılan `Resimler\Screenshot Studio`.
- **Ölçüm (Notion ölçütü):** yakalamadan ilk dışa aktarmaya hazırlık süresi (canlı sayaç, hedef ≤30 sn), medyan süre, ≤30 sn oranı, doğrulanan maskeli çıktı ve aday kabul oranı.
- **MyMind (isteğe bağlı, PluginLabs Hub üzerinden):** kurallarla bulunamayan ad, soyad, adres parçası gibi ek adaylar. Her istekte onay; yalnız **rakam içermeyen** okunmuş kelimeler gönderilir — görüntü, konumlar, numaralar ve zaten maskelenen değerler gönderilmez. Yanıt yalnız gönderilen kelimelerle sınırlıdır.
- Ctrl+K komut paleti; hareketi azalt seçeneği (sistem ayarı da izlenir).

## Sınırlar
- Aday önerisi sızıntı olmayacağını **garanti etmez**; OCR okuyamadığı yazıyı (çok küçük, el yazısı, görsel içinde) işaretleyemez. Görüntüyü kendiniz de gözden geçirin.
- "Bulanıklaştır" yalnız görsel vurgudur; hassas veri için Maske kullanın.
- Kısayol yalnız uygulama açıkken çalışır (sistem tepsisi/oturum açılışında başlatma yok). Pencere yakalama, küçültülmüş pencereleri yakalayamayabilir.
- Doğrulama: birim testleri ve gerçek Electron pencerelerinde otomatik duman testi (Windows runner + Linux xvfb; bağımsız OCR ile maskelenen değerlerin çıktıda okunamadığı denetlendi). Kullanıcı ölçütü (gerçek kullanıcıda ≤30 sn) ölçülmedi; Windows DPI, çoklu ekran ve ekran okuyucu elle denenmedi.
