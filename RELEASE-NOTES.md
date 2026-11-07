PluginLabs Hub 0.4.21 — Leo Helper 0.9.4 ve MyMind AI 0.1.2.

- Leo Helper 0.9.4: eksik/oyun/iptal kodlarda otomatik hazırlama ve giriş engeli; akıştaki adaylar korunur.
- MyMind AI 0.1.2: PL-059 ürün kartı kimliği; güncel Windows ve Chrome paketleri.
- Katalog URL, boyut ve SHA256 değerleri gerçek paketlerle eşleşir. PL-059 Notion kartı ve yayın merkezi bağlandı.
- 33 Hub testi ve iki gerçek Electron UI akışı geçti; paketlenmiş Windows EXE üzerinde iki ürünün sürümleri ayrıca doğrulandı.
- Windows yayın iş akışı kilitli Playwright sürümünü kullanır; eski 1.49.1'e geçici indirme kaldırıldı.
- Qwen3-4B özel model eğitimi henüz tamamlanmadı. Uygulama sürümüyle model eğitimi ayrı kabul edilir.

![Leo Helper kataloğu](https://raw.githubusercontent.com/timdesigners-pixel/PluginLabs/main/docs/screenshots/release-0.4.21/02-leo-helper.png)

Geri alma: Hub 0.4.20 paketini kullanın; uygulama verisi ve işletim sistemi kasasını koruyun. İmzasız Windows paketidir.

---

PluginLabs Hub 0.4.20 — Flow Dock 0.2.0 ön sürüm entegrasyonu.

- Doğrulanmış 4.069.376 baytlık Rust/Tauri taşınabilir paket; SHA-256 dağıtım dosyası indirilerek doğrulandı.
- Katalogda açık ön sürüm etiketi; Windows 11 native doğrulaması geçti, Server 2025 native açılışı başarısız.
- Güncelleme denetimi yalnız katalogda açıkça işaretlenmiş mevcut ön sürüm etiketini kabul eder; diğer ön sürümler dışlanır, daha yeni kararlı sürümler kabul edilir.
- Kurgu bu yayına dahil değil; kesin yayımlanmış manifest bekleniyor.

---

PluginLabs Hub 0.4.19 — Gardrop 0.2.1

- Gardrop 0.2.1: seçili MyWishlist aktarımı, fiyatlı kombin kolajı, 14 üretilmiş ürün fotoğrafı ve model üzerinde sabit demo görseli; MyMind metin isteği ve önizleme.
- Katalog boyut/SHA256 değerleri Windows runner kaynak release paketinden alındı; dağıtım aynası aynı dosyaları sunar.
- Gerçekçi kişisel giydirme ve 3B renderer uygulanmadı. İmzasız Windows sürümüdür.

---

PluginLabs Hub 0.4.18 — Genel bakış widget'larına örnek görseller.

- Günün kombini (Gardrop) ve Günün menüsü (Mutfak Atölyesi: kahvaltı, öğle, akşam) widget'larında SVG çizimlerin yerine örnek fotoğraf görselleri. Görseller Google Gemini ile üretildi, uygulamayla birlikte gelir (`ui/img/`, WebP, toplam ~70 KB) ve internetten yüklenmez.
- Altyazılar “Örnek görsel (AI ile üretildi)” olarak işaretlendi. Kendi fotoğrafınızı eklemek, değiştirmek ve kaldırmak eskisi gibi çalışır; fotoğrafı kaldırınca örnek görsel geri gelir.
- Arayüz testi örnek görselin gerçekten yüklendiğini de denetler (`naturalWidth > 0`; CSP `img-src 'self'` korunur).
- Eski SVG çizimler kodda yedek olarak duruyor.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Windows DPI ve klavye kabulü ayrıca yapılmamıştır.

---

PluginLabs Hub 0.4.17 — PluginLabs Advanced düğme varyantları (PLC-001 … 004) Hub genelinde tutarlı kullanılıyor.

- İkincil (secondary) düğme: asıl eylem olmayan kapatma düğmeleri (uygulama ve ürün bilgisi pencerelerinde “Kapat”) artık ikincil; Genel bakış › Kaynak kütüphanesi satırlarında “＋ Ekle” / “Yönet” ikincil küçük düğme (önceden çıplak metin bağlantısıydı).
- Hayalet (ghost) düğme: “Vazgeç” (paketi kaldır, tarayıcı ve uygulama eklentisi pencereleri) ve süren işlerin “İptal” düğmeleri; Genel bakış’taki “Tüm uygulamalar” ve “Tümünü gör” bağlantıları ghost küçük düğme.
- Yükleme durumu: işlem sürerken düğme “İşleniyor…” yazısı yerine PLC-001 yükleme durumuna geçer (etiket genişliği korunur, varyant rengine uygun döner simge, aria-busy). Katalog kartında süren yükleme döner simgeli ikincil düğmeyle gösterilir; tıklayınca iptal eder.
- Gradient düğme: üst çubuktaki “Pro’ya geç” ve karşılama alanındaki “My Mind’ı keşfet” korunur; gradient ve tehlike (danger) düğmelerine üzerine gelme durumu eklendi.
- Birincil, bölünmüş (Yükle ▾), segment ve simge düğmeleri değişmedi.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Windows DPI ve klavye kabulü ayrıca yapılmamıştır.

---

PluginLabs Hub 0.4.16 — Kanal API'si (canlı veri akışı ve uygulamalar arası köprü) ve My Mind hazır görevleri.

- Kanallar: uygulamalar `POST /v1/channels/<ad-alanı>.<konu>` ile veri yayınlar; Genel bakış widget'ları (kodlar, fiyat düşüşleri, notlar, kazıma görevleri, yaklaşan ödemeler, veri akışı) “Canlı · <uygulama>” rozetiyle gerçek veriyi gösterir; süre dolunca örnek veriye döner. Yayın izni kendi ad alanıyla sınırlıdır; veri boyut, derinlik, süre ve hız sınırlıdır; yalnızca bellekte tutulur.
- Köprü: yayıncı `share` ile açtığı kanalı başka bir uygulama `GET /v1/channels/<kanal>` veya canlı `GET /v1/stream` (SSE) ile okuyabilir. Varsayılan olarak yalnızca Hub arayüzü okur. Yeni izinler: `channels.publish`, `channels.read`.
- Arayüz: API ve izinler sayfasında “Kanallar ve köprüler” tablosu (yayıncı, paylaşım, güncelleme, Kapat); anahtar oluştururken isteğe bağlı kanal ad alanı; istemci tablosunda ad alanı.
- My Mind: 12 hazır görev (özetle, yeniden yaz, etiket, kod ayıklama, çeviri, gün planı, görev parçalama, kombin, menü, fiyat notu, harcama sınıfı, metinden yanıt). `GET /v1/mymind/capabilities`, `POST /v1/mymind/run`; SDK `hub.mymind.*`. Girdi veri olarak işlenir, çıktı doğrulanır. My Mind sayfasında görev kataloğu listelenir.
- SDK: `publish`, `read`, `channels`, `subscribe`, `mymind.capabilities`, `mymind.run`.
- Belgeler: `docs/ecosystem-v1/KANAL-API.md`, `docs/ecosystem-v1/MYMIND-YETENEKLER.md`.

Uygulamaların bu kanallara yayın yapması kendi sürümlerinde yapılacaktır; bu sürüm Hub tarafını ve sözleşmeyi getirir. İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Windows DPI ve klavye kabulü ayrıca yapılmamıştır.

---

PluginLabs Hub 0.4.15 — Üst çerçeve menüsü, bölünmüş Yükle düğmesi, uygulama logo karoları ve fotoğraf alanlı widget'lar.

- Üst çerçeve: Dosya / Görünüm / Araçlar / Yardım menüsü pencerenin en üstünde, tüm genişlikte (PLC-029 başlık çubuğu kalıbı: logo, başlık, menüler, “Her şeyi ara · Ctrl K”). Kenar çubuğu ve içerik bunun altında başlar.
- Sayfa geçişi: menüden bir sayfaya tıklayınca sayfa artık en üstten açılır (önceden bir miktar aşağıdan başlıyordu).
- Çalışma alanınız için: kartlarda yalnızca uygulama logosu, ad ve boyut var; “Yükle” bölünmüş düğmedir (indirme oku simgesi, ▾ ile açılan menüde Detaylı bilgi, Ayarlar ve paket bilgisi, Kaynağı gör). Tüm uygulama kartlarında ve “+ Yükle” düğmelerinde artı yerine indirme oku kullanılır.
- Uygulama simgeleri: tasarım sistemindeki uygulama logo karoları (iki harfli kısaltma + ürün aksanı; ürün aksanı olmayanlara palet rengi).
- Günün kombini ve Günün menüsü widget'ları: fotoğraf alanları. Varsayılan olarak ÇİZİM önizlemesi gösterilir; kendi fotoğrafınızı (kombin) ve yemek fotoğraflarını ekleyebilirsiniz. Fotoğraflar yalnızca bu cihazda saklanır (küçültülüp yerel depoya yazılır), hiçbir yere gönderilmez. Sizin üzerinizde gerçekçi kombin görüntüsü üretimi yoktur; bu, Gardrop'un sanal deneme özelliğine bağlıdır ve henüz yok.
- Tasarım sistemi bileşenleri: karşılama kahramanı (OnboardingHero), eklenti satırları anahtarlı (ExtensionRow), izin isteği kartı (PermissionCard), güncelleme kartı (UpdateCard), indirme satırı (InstallRow), durum çubuğu (StatusBar). Tüm düğmeler tasarım sistemindeki Button bileşeniyle birebir (pl-btn; yazı boyutu, ağırlık, köşe, yükseklik); “+”, “↻”, “▶”, “↗” harf simgeleri çizgi ikonlarıyla değişti. Önceden Hub'ın genel yazı kuralı düğme yazı değerlerini eziyordu.
- Daha fazla tasarım sistemi bileşeni: Filtre çubuğu + seçim kutusu (Keşfet/Kaynak), karşılama başlığı ve duyuru bandı (Genel bakış), hap gezinme (Eklenti yöneticisi), proje kenar çubuğu (Uygulama kataloğu), HUD metrik + HUD tablo (API ve izinler), modal başlık/gövde/alt yapısı; widget'larda gün şeridi + ajanda, karanlık görev kartı (başlangıç görevleri gerçek veriyle), büyük sayı üçlüsü, bütçe göstergesi, aktivite karosu, yemek kartı, saat-hava + iklim çipleri, iş kuyruğu, değerleme hesaplayıcı (çalışır), kişi kartı, cihaz anahtar karosu. Widget verileri “Örnek veri” rozetiyle işaretlidir (başlangıç görevleri ve My Mind widget'ı gerçek).

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Windows DPI ve klavye kabulü ayrıca yapılmamıştır.

---

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
