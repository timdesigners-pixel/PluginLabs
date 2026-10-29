# PL-054 · PinCart

> Webde gezinirken ürünleri işaretleyerek kaydeden; katalogda kaynak site, rakip fiyatlar, açıklama, özellik ve görselleri gösteren tarayıcı eklentisi (çalışma adı; kaynak fikir: MyWishlist).

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-054` · `pincart` |
| Kategori | 07 · Yeni ürünler — PL-054+ |
| Durum | Yeni fikir · kullanıcı notundan ürünleştirme |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-054 · PinCart` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4088aa13d8f9819d9319c134d29ccae1) |

## Ne işe yarar

**Kullanıcı ve problem:** Webde gezinirken beğendiği ürünleri farklı sitelerde sepet, favori ve sekme olarak dağınık bırakan; sonra fiyatı, satıcısı ve özelliklerini yeniden aramak zorunda kalan alışveriş kullanıcıları.

**Kısa tanım (kullanıcı beyanı, 28.10.2026):** Webde gezinirken ürünleri işaretleyerek kaydeden; katalogda kaynak site, rakip fiyatlar, açıklama, özellik ve görselleri gösteren tarayıcı eklentisi (çalışma adı; kaynak fikir: MyWishlist).

## Hangi platformlar için yayınlanır

**Platform tanımı (Codex proje adından):** Chrome (ve Chromium tarayıcılar) eklentisi; aynı tarayıcıyla W / L / M

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Ürün sayfasında tek tıkla işaretle → ürün adı, fiyat, görseller, açıklama, özellikler ve kaynak site otomatik kaydedilir → katalog ekranında listele, filtrele, etiketle → “alındı” işaretle → JSON/CSV içe/dışa aktar. İlk sürüm yerel depolama ve yapısal veri (JSON-LD/microdata) okuyan ürün sayfaları.

### Yapay zekânın rolü

Aynı ürünü farklı sitelerde eşleştirir, benzer ürün önerir, özellikleri karşılaştırma tablosuna dönüştürür; fiyat ve stok değerleri her zaman kaynaktan okunur.

### Ayrıntılı özellik kapsamı

- **Ad önerisi:** Çalışma adı PinCart (işaretle → kaydet → sepete dönüştür). Alternatifler: Wishkeeper, Göz Hapsi. Nihai ad kullanıcı kararıdır.
- **İşaretleyerek kaydet:** Sayfadaki ürün kartını veya ürün sayfasını tek tıkla (simge, sağ tık menüsü veya kısayol) kaydetme; yanlış algılanan alanı elle düzeltme.
- **Katalog:** Tüm kayıtların kart/liste görünümü; site, kategori, etiket, fiyat aralığı, alındı/bekliyor filtreleri; arama.
- **Kaynak site ve rakip fiyatlar:** Bulunduğu site, son görülen fiyat ve tarih; aynı ürünün diğer sitelerdeki teklifleri ve fiyat farkı.
- **Ürün ayrıntısı:** Açıklama, teknik özellikler, varyantlar ve görsel galeri; en iyi görselin kapak olarak seçilmesi.
- **İçe / dışa aktarma:** JSON ve CSV; başka cihaza taşıma ve yedek.
- **Alındı olarak işaretleme:** Satın alınan ürün, alınan fiyat ve tarihle arşive taşınır; silinmez.
- **Bütçe planı:** Liste/koleksiyon başına bütçe, öncelik sırası, planlanan ay; toplam ve kalan bütçe.
- **Benzer ürünler:** Kaydedilen ürüne benzer alternatiflerin kaynaklı listesi.
- **Fiyat düşüşü uyarısı (Pro):** Hedef fiyat veya yüzde düşüşte bildirim.
- **Koleksiyonlar ve paylaşım:** Doğum günü, ev, teknoloji gibi listeler; salt okunur paylaşım bağlantısı (sonraki faz).
- **Sepete dönüştür:** Seçili ürünlerden PL-004 sepet planı oluşturma; ödeme otomatik değil.
- **Veri modeli (öneri):** WishItem (id, title, url, sourceSite, price, currency, seenAt, images, primaryImage, description, attributes, variant, tags, collectionId, status: bekliyor|alındı|arşiv, purchasedPrice, purchasedAt) · Collection (id, ad, bütçe, para birimi, planlanan dönem) · Offer ve WatchRule PL-004 ile ortak şema. Kimlikler UUID, tarihler ISO 8601.
- **Geliştirme işleri:** PC-01 işaretleyerek kaydet + yapısal veri okuyucu (3 sitede ≥%95) · PC-02 katalog/filtre/arama (500 kayıtta ≤1 sn) · PC-03 alındı işaretleme ve arşiv · PC-04 JSON/CSV içe/dışa aktarma (kayıp sıfır) · PC-05 bütçe planı (deterministik toplam) · PC-06 rakip fiyat ve benzer ürün (PL-004 motoru; her teklif kaynak ve tarihli).

## Teknik bağımlılık ve sınırlar

Kullanıcı işaretlemeden sayfa okunmaz; rakip fiyatlar yalnız izinli/erişilebilir kaynaklardan ve tarihli gösterilir. Captcha ve bot koruması aşılmaz. Hesap parolası ve ödeme bilgisi toplanmaz; satın alma otomatik yapılmaz. MV3 servis çalışanı nedeniyle sürekli arka plan fiyat taraması garanti edilmez.

## Gelir hipotezi

Ücretsiz sınırlı katalog; Pro fiyat alarmı, rakip fiyat karşılaştırma, bütçe planı ve cihazlar arası eşitleme. Ortaklık (affiliate) bağlantısı kullanılırsa açık etiketlenir.

## Doğrulama ölçütü

İşaretlenen üründe ad/fiyat/görsel/kaynak alanı ≥%95 eksiksiz; ilk haftada kullanıcı başına ≥5 kayıt; içe/dışa aktarmada veri kaybı sıfır.

## Öncelik ve efor

P1 · M (öneri); PL-004 The Ultimate Scrapper’ın takip/sepet motorunu kullanan hafif tüketici ön yüzü.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-054-<konu>` veya `claude/PL-054-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
