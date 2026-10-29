# PL-004 · The Ultimate Scrapper

> Web sayfalarından ürün, ilan ve tablo verisini toplayan; fiyat/stok takibi yapan ve alışveriş listesinden sepet planı hazırlayan veri madencisi ve alışveriş asistanı.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-004` · `the-ultimate-scrapper` |
| Kategori | 01 · Mevcut ürünler ve fikirler — PL-001–010 |
| Durum | Mevcut ayrıntılı proje planı · dağıtım durumu doğrulanmadı |
| Öncelik / efor | P1 · L |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | [timdesigners-pixel/the-ultimate-scrapper](https://github.com/timdesigners-pixel/the-ultimate-scrapper) |
| Codex projesi | `PL-004 · The Ultimate Scrapper` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981edbfa2cdc55d867114) |

## Ne işe yarar

**Kullanıcı ve problem:** Favori ürün ve ilanlarını farklı sitelerde kaybeden alışveriş ve koleksiyon kullanıcıları.

**Kısa tanım (Hub kataloğu):** Web sayfalarından ürün, ilan ve tablo verisini toplayan; fiyat/stok takibi yapan ve alışveriş listesinden sepet planı hazırlayan veri madencisi ve alışveriş asistanı.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M arşivci

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

İlk iki izinli kaynakta kullanıcı başlatmalı kaydetme; standart ürün kartı, fiyat/stok geçmişi, yerel görsel ve CSV/JSON arşivi.

### Yapay zekânın rolü

Başlık normalizasyonu, kategori önerisi ve olası aynı ürün eşleştirmesi; fiyat değeri kaynak DOM/API verisinden alınır.

### Ayrıntılı özellik kapsamı

- **v2 · Konumlandırma (29.10.2026):** Kullanıcı kararıyla ürün yalnız ürün ve fiyat kazıyan bir arşivci olmaktan çıkarılıp veri madencisi ve alışveriş asistanı (The Ultimate Scrapper — Data Miner & Shopping Assistant) olarak genişletildi. İlk kart korunur; bu alanlar geliştirme şartnamesidir. Yeni efor önerisi: P1 · XL.
- **v2 · Kazıma motoru:** Sayfa ve liste kazıma; önce JSON-LD, microdata ve OpenGraph gibi yapısal veriyi, yoksa DOM seçicilerini okur. Görsel seçici kaydedici ile alan tıklanıp etiketlenir, tarif (recipe) olarak kaydedilir ve aynı sitedeki diğer sayfalara uygulanır. Sayfalama, “daha fazla yükle” ve sonsuz kaydırma.
- **v2 · Veri toplama (Data Miner):** Çok kaynaklı veri setleri; normalizasyon, tekilleştirme ve aynı ürün eşleştirme. Masaüstü botuyla zamanlanmış toplama ve değişiklik geçmişi. Dışa aktarma: CSV, JSON, XLSX, SQLite ve arşiv paketi (veri + görseller).
- **v2 · Fiyat ve stok takibi:** İzleme listesi; hedef fiyat, yüzde düşüş, stok geldi/bitti ve varyant/satıcı değişikliği kuralları. Fiyat geçmişi grafiği, en düşük/ortalama fiyat ve geçmişe göre gerçek indirim göstergesi. Masaüstü/mobil bildirim, sessiz saatler, kaynak başına kontrol sıklığı sınırı.
- **v2 · Çok sayfalı tablo okuma:** HTML tabloları ve sanal kaydırmalı veri tablolarını algılar; sonraki düğmesi, sayfa numaraları veya URL deseniyle tüm sayfaları dolaşıp tek veri setinde birleştirir. Başlık eşleştirme, birleşik hücreler, sütun tipi çıkarımı, tekrar satır ayıklama, kaldığı sayfadan devam; atlanan sayfa ve okunamayan satır raporu.
- **v2 · Otomatik sepet oluşturma:** Alışveriş veya izleme listesinden her kalem için uygun teklifi (fiyat + kargo + teslim süresi + satıcı puanı) seçen sepet planı; tek veya çok siteli bölünmüş sepet, bütçe tavanı, toplam maliyet özeti. Kullanıcı onayıyla desteklenen sitelerde sepete ekleme. Ödeme ve sipariş onayı hiçbir zaman otomatik yapılmaz.
- **v2 · Alışveriş asistanı:** Doğal dil isteğini arama ölçütlerine çevirir; adayları kaynaklı karşılaştırma tablosunda sunar, eksik bilgiyi bilinmiyor olarak gösterir. Model fiyat üretmez; fiyat, stok, toplam ve kargo kaynaktan okunur ve deterministik hesaplanır.
- **v2 · Sınırlar:** Kullanıcı başlatmalı ve kullanıcının kendi oturumuyla; captcha, bot koruması veya ücret duvarı aşılmaz. ToS/robots farkındalığı ve oran sınırı. Parola ve ödeme bilgisi toplanmaz; çerezler OS kasasında şifreli. Sepete ekleme yalnız test edilmiş bağlayıcılarda, önizleme ve geri alma ile. Zamanlanmış takip masaüstü botu gerektirir (MV3 sınırı). Ortak çekirdek: PL-040, PL-019, PL-020, PL-054.
- **v2 · Platformlar:** Chrome eklentisi (seçici kaydedici, sayfa/tablo okuma, sepete ekleme) · W / L / M masaüstü botu (zamanlayıcı, toplu toplama, yerel veritabanı, görsel arşivi) · mobil uygulama (bildirim ve çevrimdışı görüntüleme).
- **v2 · Veri modeli eklemeleri:** Dataset, ScrapeRecipe, TableExtract, Offer, WatchRule, Alert, CartPlan, CartItem; UUID kimlik, ISO 8601 tarih, SQL uyumlu ve API-dostu şema.
- **v2 · Geliştirme işleri:** TUS-01 yapısal veri + DOM okuyucu (iki kaynakta ≥%95) · TUS-02 görsel seçici kaydedici ve tarif (10 sayfada doğru alan) · TUS-03 çok sayfalı tablo (20 sayfada satır sayısı birebir, tekrar sıfır, devam) · TUS-04 izleme kuralları ve bildirim (çift bildirim sıfır) · TUS-05 sepet planı (bütçe tavanı, deterministik toplam) · TUS-06 onaylı sepete ekleme (onaysız ekleme ve ödeme adımı sıfır) · TUS-07 doğal dil alışveriş isteği (kaynaksız iddia sıfır) · TUS-08 dışa aktarma ve arşiv (kayıp sıfır).

## Teknik bağımlılık ve sınırlar

Kaynak koşulları, oturum yetkisi ve oran sınırı. Captcha atlatılmaz; erişim engelinde kullanıcıya dönülür. DOM bağlayıcı testleri gerekir.

## Gelir hipotezi

Ücretsiz sınırlı liste; Pro geçmiş ve izleme kotası. Ortaklık geliri varsa açık etiketli.

## Doğrulama ölçütü

İki kaynaktan %95 eksiksiz alan çıkarma; mükerrer kart oranı \<%2.

## Öncelik ve efor

P1 · L; kaynak bakım maliyeti ürün maliyetine dahil.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-004-<konu>` veya `claude/PL-004-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut ayrıntılı proje planı · dağıtım durumu doğrulanmadı
- **Platform:** Chrome + W / L / M arşivci
- **Kullanıcı ve problem:** Favori ürün ve ilanlarını farklı sitelerde kaybeden alışveriş ve koleksiyon kullanıcıları.
- **MVP ve temel akış:** İlk iki izinli kaynakta kullanıcı başlatmalı kaydetme; standart ürün kartı, fiyat/stok geçmişi, yerel görsel ve CSV/JSON arşivi.
- **Yapay zekânın rolü:** Başlık normalizasyonu, kategori önerisi ve olası aynı ürün eşleştirmesi; fiyat değeri kaynak DOM/API verisinden alınır.
- **Teknik bağımlılık ve sınır:** Kaynak koşulları, oturum yetkisi ve oran sınırı. Captcha atlatılmaz; erişim engelinde kullanıcıya dönülür. DOM bağlayıcı testleri gerekir.
- **Gelir hipotezi:** Ücretsiz sınırlı liste; Pro geçmiş ve izleme kotası. Ortaklık geliri varsa açık etiketli.
- **Doğrulama ölçütü:** İki kaynaktan %95 eksiksiz alan çıkarma; mükerrer kart oranı \<%2.
- **Öncelik ve efor:** P1 · L; kaynak bakım maliyeti ürün maliyetine dahil.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
