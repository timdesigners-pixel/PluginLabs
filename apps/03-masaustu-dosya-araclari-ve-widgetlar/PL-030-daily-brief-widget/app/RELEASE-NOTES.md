# Daily Brief Widget 0.1.0 — önizleme (Windows)

İlk çalışan sürüm. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `DailyBrief-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `DailyBrief-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri, test verisi)

## Neler var
- **Bugün görünümü:** tüm gün ve saatli etkinlikler (kaynak adıyla), şu anki/geçmiş etkinlik, sıradaki etkinlik geri sayımı; gecikmiş ve bugünkü görevler; çalışma saatlerinde dolu/boş süre.
- **Widget:** her zaman üstte, sürüklenebilir küçük pencere (konumu hatırlanır): sıradaki etkinlik, kalan etkinlikler, bugünün görevleri (işaretlenebilir), çakışma ve eskimiş veri uyarısı, veri zamanı, "Okudum".
- **Takvimler (yalnız okuma):** yerel etkinlikler; `.ics` dosyası içe aktarma; Google/Outlook gizli iCal adresi ya da herhangi bir https `.ics` aboneliği (eklerken onay, 15 dk–24 sa yenileme). RFC 5545: saat dilimleri (IANA ve Windows adları), tüm gün, DURATION, haftalık/günlük/aylık/yıllık tekrar (INTERVAL, COUNT, UNTIL, BYDAY), EXDATE, tek tekrarı değiştiren kayıtlar, iptal edilen etkinlikler.
- **Çakışmalar (öneri):** çakışan etkinlikler ve etkinlikle çakışan saatli görevler; takvim otomatik değiştirilmez.
- **Kısa plan:** gecikmiş, bugünkü ve yüksek öncelikli tarihsiz görevler çalışma saatleri içindeki boş aralıklara yerleştirilir; sığmayanlar gösterilir.
- **Hassas başlık gizleme:** tek tıkla (widget'tan da) "Özel etkinlik / Özel görev"; hassas kelime listesi, takvimin "özel" etkinlikleri, hassas işaretli görevler, "tüm başlıkları hassas say" takvimleri.
- **Veri zamanı:** her takvimin son okunma zamanı ve bağlantısı (adresin yalnız alan adı); yenileme süresinin iki katını aşan veri "eskimiş" diye işaretlenir; okuma hataları gösterilir.
- **Sabah bildirimi:** seçilen saatte (ya da sonra açılınca) günde bir kez özet bildirimi.
- **Ölçüler (Notion doğrulama ölçütü):** son 14 günde sabah özeti okuma oranı (hedef ≥%60) ve yanlış/eskimiş etkinlik oranı (hedef <%1; eskimiş kaynaktan gösterilen + sizin "yanlış" işaretledikleriniz).
- **MyMind (PluginLabs Hub üzerinden, isteğe bağlı):** "Günü kısa plana dönüştür". Hassas başlıklar her zaman "Özel …" olarak gider; yer, takvim adı/adresi ve notlar gönderilmez. Her istekte onay; yanıt doğrulanır (saat biçimi, en fazla 8 adım; etkinlik iptali/silme öneren adımlar atılır). Plan yalnız gösterilir.
- **Yedek:** JSON dışa/içe aktarma (abonelik adresleri yedeğe yazılmaz); içe aktarma görevleri yinelemez.

## Sınırlar
- Hesap girişi (Google/Microsoft OAuth) yok; gizli iCal adresi ya da `.ics` dosyası kullanılır. Takvime yazma yok (bilinçli).
- Saat diliminde bilinmeyen adlar yerel saat sayılır ve sayısı gösterilir; BYSETPOS gibi ileri tekrar kuralları desteklenmez.
- Sağlık/finans verisi kaynakları, Linux/macOS paketi yok. Windows DPI, ekran okuyucu ve gerçek masaüstünde elle test yapılmadı; doğrulama ölçütleri gerçek kullanıcıyla ölçülmedi.
