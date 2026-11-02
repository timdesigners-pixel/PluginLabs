PluginLabs Hub 0.4.14 — PluginLabs Advanced arayüzü, Akış panosu ve Widget düzenleyici.

- Tasarım sistemi: PluginLabs Advanced (v2.0.0) depoya kuruldu (`design-system/pluginlabs-advanced`, eski `pluginlabs-design` `design-system/_arsiv/` altında). Hub arayüzü Advanced bileşenleri ve değerlerine taşındı; Hub Yeşil ve Iris paletleri ile koyu/açık tema korundu.
- Üst menü (Dosya, Görünüm, Araçlar, Yardım), kayan akış bandı, sunucu ve bağlantı durum kartları, istatistik kartları, Ctrl+K komut paleti (opak panel), renkli menü simgeleri; menüde kaydırma çubuğu yok.
- Genel bakış: girişte başlığın altında işlem düğmeli My Mind sunucusu ve Uygulama bağlantısı durum kartları ile ilerleme çubuklu istatistik kartları; özgün düzen (karşılama, “Çalışma alanınız için”, kaynaklar ve API kartı) olduğu gibi korunur; sonunda Akış panosu — Veri akışı, Günün kombini, Günün menüsü, Bugün, Yaklaşan ödemeler, Fiyat düşüşleri, Yakalanan kodlar, Son notlar, Kazıma görevleri, Odak ve My Mind widget'ları. Şimdilik My Mind dışındakiler ÖRNEK VERİ gösterir ve "Örnek veri" rozeti taşır; uygulama yüklüyse ilgili widget genişler. Uygulamalar Hub'a veri akıtmaya başlayana kadar gerçek veri yoktur.
- Ayarlar: beş sekme (Görünüm, Widget'lar, Veri ve gizlilik, Bağlantılar, Kısayollar, Hakkında) ve Widget düzenleyici (widget ekle/çıkar, sıra, varsayılana dön; bu cihazda saklanır). Hub sürümü artık gerçek değeri gösterir (önceden 0.3.0 yazıyordu).
- Uygulamalarım: istatistik kartları, tür süzgeci, ızgara/liste görünümü, boş durum. My Mind sayfasındaki kart boşluğu düzeltildi.
- Üst başlıkta "Pro'ya geç" düğmesi var; Pro planı henüz yoktur, düğme bunu açıklayan bir pencere açar.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Windows DPI ve klavye kabulü ayrıca yapılmamıştır.

---

PluginLabs Hub 0.4.13 — Özel MyMind modeli ve istemci sıcaklığı.

- My Mind: kendi eğitilmiş GGUF modelini içe aktarma (GGUF imzası, 1 MB–8 GB sınırı, aynı klasördeki SHA256SUMS ile SHA-256 doğrulaması, geçici dosya temizliği), katalog/özel model kaynağı seçimi, kaldırma. Model aynı `mymind-lite` API adıyla sunulur; istemcilerde değişiklik gerekmez.
- API: `/v1/chat/completions` istemcinin `temperature` değerini (0–1) iletir; verilmezse 0,4. Önceden her istek 0,4 ile gidiyordu.
- Eski kayıtlar: model kaynağı olmayan durum dosyası katalog modeliyle açılır.
- Bu sürüm, ayrı yayımlanmamış 0.4.11 (MyWishlist 0.1.0) ve 0.4.12 (The Ultimate Upscaler 0.1.0) katalog değişikliklerini de içerir.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir.

---

PluginLabs Hub 0.4.12 — The Ultimate Upscaler 0.1.0 kataloğa eklendi.

- Katalog: The Ultimate Upscaler 0.1.0 (PL-056; cihazda görsel büyütme: Otomatik/Fotoğraf/Çizim/Piksel/Yumuşak profilleri, önce/sonra karşılaştırma, toplu sıra, MyMind ile yalnız ölçümlerle onaylı ayar önerisi; Chrome eklentisi sağ tık ile aynı sürümde). Boyut ve SHA-256 dağıtım deposundaki dosyayla doğrulandı.
- Tasarım sistemi: `upscaler` (`#38bdf8`) aksanı eklendi; Tork birleştirmesinde kaybolan `gardrop` (`#e879f9`) aksanı geri getirildi. Kanonik kaynak ve iki skill kopyası eşit.
- Hub'ın kendi davranışı değişmedi.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir.

---

PluginLabs Hub 0.4.11 — MyWishlist 0.1.0 kataloğa eklendi.

- Katalog: MyWishlist 0.1.0 (PL-054; Rust/Tauri Windows uygulaması + Chrome eklentisi: istek listeleri, öncelik, fiyat takibi ve uyarılar, ürün adıyla çok sitede arama ve karşılaştırma, sepet planı, alışveriş asistanı, MyMind ile ekleme, ekran görüntüsünden tanıma). Boyut ve SHA-256 kaynak sürümdeki taşınabilir exe’den alındı.
- Hub'ın kendi davranışı değişmedi.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Electron ve paketleme zincirindeki güvenlik bulguları (issue #3) açıktır.

---

PluginLabs Hub 0.4.10 — MyMind AI 0.1.0 kataloğa eklendi.

- Katalog: Gardrop 0.1.0 (PL-055; dijital gardırop: parçalar, kombinler, “Bugün ne giysem?”, giyim günlüğü, analiz, istek listesi, MyMind ile onaylı kombin önerisi; Chrome eklentisi aynı sürümde). SHA-256 ve boyut dağıtım deposundaki dosyayla doğrulandı.
- Tasarım sistemi: `gardrop` ürün aksanı (`#e879f9`) kanonik kaynağa ve iki skill kopyasına eklendi.
- Hub'ın kendi davranışı değişmedi.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Electron ve paketleme zincirindeki güvenlik bulguları (issue #3) açıktır.

---

PluginLabs Hub 0.4.9 — Leo Helper 0.9.2 kataloğa eklendi.

- Katalog: Leo Helper 0.9.2 (Alınan kodlar sayfası ve şartların kaydı: başarılı her kod, alındığı andaki şartlarıyla saklanır; şart, durum ve not sonradan düzeltilir). SHA-256 ve boyut dağıtım deposundaki dosyayla doğrulandı.
- Hub'ın kendi davranışı değişmedi.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Electron ve paketleme zincirindeki güvenlik bulguları (issue #3) açıktır.

---

PluginLabs Hub 0.4.8 — Leo Helper 0.9.1 kataloğa eklendi.

- Katalog: Leo Helper 0.9.1 (kod takibi: uygunluk göstergesi, mesaj önizlemesi, sınıflandırma, kod şartları). SHA-256 ve boyut dağıtım deposundaki dosyayla doğrulandı.
- Hub'ın kendi davranışı değişmedi.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Electron ve paketleme zincirindeki güvenlik bulguları (issue #3) açıktır.

---

PluginLabs Hub 0.4.7 — PluginLabs Scrapper 0.7.0 kataloğa eklendi.

- Katalog: PluginLabs Scrapper 0.7.0 (ürün ekranları tek Alışveriş bölümünde; ham veriyi değiştirmeyen dönüşüm katmanıyla Veri Kazıma Stüdyosu, otomatik düzenleme, CSV/JSON/XLSX/SQLite çıktısı; parolaları şifreli tutan Site Rehberi). SHA-256 ve boyut dağıtım deposundaki dosyayla doğrulandı.
- Hub'ın kendi davranışı değişmedi.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Electron ve paketleme zincirindeki güvenlik bulguları (issue #3) açıktır.

---

PluginLabs Hub 0.4.6 — Mutfak Atölyesi 0.4.1 kataloğa eklendi.

- Katalog: Mutfak Atölyesi 0.4.1 (Windows x64 taşınabilir zip; PluginLabs Tasarım Sistemi arayüzü, Ctrl+K komut paleti). SHA-256 ve boyut dağıtım deposundaki dosyayla doğrulandı; gerçek indirme + açma + başlatma yolu uçtan uca denendi.
- Hub: zip olarak dağıtılan uygulamalar için isteğe bağlı `launch` alanı (arşivden çıkan exe'nin göreli yolu). Yol, arşiv yolu kurallarıyla doğrulanır; kurulum klasörünün dışına çıkamaz. Mevcut exe uygulamaların davranışı değişmedi.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Mutfak Atölyesi için Windows'ta WebView2 Runtime gerekir. Electron ve paketleme zincirindeki güvenlik bulguları (issue #3) açıktır.

---

PluginLabs Hub 0.4.5 — Leo Helper 0.9.0 kataloğa eklendi.

- Katalog: Leo Helper 0.9.0 (Tauri/Rust; gömülü kod tarayıcısı, Telegram bağlantısı, makro ile öğretme, 5 hedefe aynı anda otomatik kod girişi, sonuç algılama). SHA-256 ve boyut dağıtım deposundaki dosyayla doğrulandı.
- Hub'ın kendi davranışı değişmedi.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Electron ve paketleme zincirindeki güvenlik bulguları (issue #3) açıktır.

---

PluginLabs Hub 0.4.4 — PluginLabs Scrapper 0.6.0 kataloğa eklendi.

- Katalog: PluginLabs Scrapper 0.6.0 (PluginLabs Tasarım Sistemi uyumu, Ctrl+K komut paleti, sade tarayıcı arayüzü). SHA-256 ve boyut dağıtım deposundaki dosyayla doğrulandı.
- Hub'ın kendi davranışı değişmedi.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Electron ve paketleme zincirindeki güvenlik bulguları (issue #3) açıktır.

---

PluginLabs Hub 0.4.3 — PluginLabs Scrapper 0.5.1 kataloğa eklendi.

- Katalog: PluginLabs Scrapper 0.5.1 (gerçek siteler için düzeltmeler: akıllı seçim, RSS/WordPress API kaynakları, önizleme tanıları, kılavuz). SHA-256 ve boyut dağıtım deposundaki dosyayla doğrulandı.
- Hub'ın kendi davranışı değişmedi.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Electron ve paketleme zincirindeki güvenlik bulguları (issue #3) açıktır.

---

PluginLabs Hub 0.4.2 — PluginLabs Scrapper 0.5.0 kataloğa eklendi.

- Katalog: PluginLabs Scrapper 0.5.0 (Kazıma Stüdyosu: gömülü tarayıcı, oturumlar, görsel seçici, zamanlanmış görevler, MyWishlist/Bahis Dünyası aktarımı). SHA-256 ve boyut dağıtım deposundaki dosyayla doğrulandı.
- Hub'ın kendi davranışı değişmedi.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Electron ve paketleme zincirindeki güvenlik bulguları (issue #3) açıktır.

---

PluginLabs Hub 0.4.1 — PluginLabs Scrapper 0.4.1 kataloğa eklendi.

- Katalog: PluginLabs Scrapper 0.4.1 (sol menü genişledi, gezinme öğeleri tek satır, ince/düz scrollbar). SHA-256 ve boyut dağıtım deposundaki dosyayla doğrulandı.
- Hub'ın kendi davranışı değişmedi.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Electron ve paketleme zincirindeki güvenlik bulguları (issue #3) açıktır.

---

PluginLabs Hub 0.4.0 — uygulamalar Hub'dan kurulabilir, MUST HAVE şartnamesi.

- Uygulama dosyaları herkese açık dağıtım deposundan (timdesigners-pixel/pluginlabs-dagitim) indirilir; özel depolar yüzünden oluşan 404 hatası giderildi. Kurulumdan önce SHA-256 doğrulaması aynen sürüyor.
- Katalog: Mind Palace 1.11.1, Leo Helper 0.8.0, PluginLabs Scrapper 0.4.0 (yeni), Finansal Asistan 0.1.0 (yeni), Flow Dock 0.1.0.
- Güncelleme denetimi dağıtım deposunu okur; her uygulama yalnız kendi `<id>-v` önekli, ön sürüm olmayan etiketlerini görür.
- Her proje için MUST HAVE şartnamesi (docs/MUST-HAVE.md) AGENTS.md'ye eklendi.
- Windows paketi artık GitHub Windows runner'ında main'den derlenir (hub-windows.yml); SHA256SUMS.txt ve BUILD-INFO.json içerir.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Electron ve paketleme zincirindeki güvenlik bulguları (issue #3) açıktır.
