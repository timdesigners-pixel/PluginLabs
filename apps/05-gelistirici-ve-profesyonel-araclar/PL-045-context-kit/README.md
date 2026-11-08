# PL-045 · Context Kit

> Seçilen dosya ve sayfalardan boyut sınırı olan, önizlenebilir AI bağlam paketleri hazırlar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-045` · `context-kit` |
| Kategori | 05 · Geliştirici ve profesyonel araçlar — PL-041–050 |
| Durum | 08.11.2026: **0.1.0 Windows uygulaması yayımlandı** — [context-kit-v0.1.0](https://github.com/timdesigners-pixel/pluginlabs-dagitim/releases/tag/context-kit-v0.1.0) (`pluginlabs-dagitim`, Windows runner: test + duman testi + SHA256 + BUILD-INFO + Windows ekran görüntüleri); kaynak [app/](app/README.md); Hub 0.4.31 kataloğunda · Notion durumu: Yeni fikir |
| Öncelik / efor | P0 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — kaynak bu klasörün [`app/`](app/README.md) alt klasöründe (ön geliştirme alanı; bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)); Windows derlemesi ve sürüm dosyaları `pluginlabs-dagitim` deposunda (iş akışı: [`app/ci/`](app/ci/pluginlabs-dagitim-context-kit-windows.yml)) |
| Codex projesi | `PL-045 · Context Kit` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981059dfad209ce1240d1) |

## Ne işe yarar

**Kullanıcı ve problem:** AI’a yanlış veya gereksiz dosyaları bağlam olarak verip zaman/kota kaybeden kullanıcılar.

**Kısa tanım (Hub kataloğu):** Seçilen dosya ve sayfalardan boyut sınırı olan, önizlenebilir AI bağlam paketleri hazırlar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M; Chrome kaynak seçici

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Klasör/sayfa seç → ilgili parçaları ve dosya ağacını önizle → sır filtresi → boyut limitli bağlam paketi dışa aktar.

### Yapay zekânın rolü

Göreve göre dosya/parça sıralaması ve kısa bağlam özeti; tüm depoyu otomatik göndermez.

## Teknik bağımlılık ve sınırlar

Hariç tutma kuralları, sır/kişisel veri işaretleme ve token tahmini. Kaynak içi istem enjeksiyonları talimat sayılmaz.

## Gelir hipotezi

Ücretsiz yerel paketleme; Pro değerlendirme ve ekip reçeteleri.

## Doğrulama ölçütü

Test görevinde gerekli bağlam kapsaması ≥%90; paket boyutunda ≥%40 azalma hedefi.

## Öncelik ve efor

P0 · M; AI maliyetini somut görevle ölçen niş ürün.

## 0.1.0 sürümü (Windows)

Notion MVP akışı: **klasör/sayfa seç → ilgili parçaları ve dosya ağacını önizle → sır filtresi → boyut limitli bağlam paketi dışa aktar.** Proje klasörü salt okunur taranır (sembolik bağlantı izlenmez, hariç klasörlere girilmez); sayfalar yapıştırma, pano ya da .html/.md/.txt belgesiyle eklenir. Dosyalar parçalara bölünür ve görev terimleriyle (yol, içerik, parça başlığı) puanlanır; token bütçesine sığan en ilgili parçalar ve dosya ağacı pakete girer; dosya/parça sabitlenebilir ya da dışlanabilir.

Teknik sınır (Notion): **hariç tutma kuralları, sır/kişisel veri işaretleme ve token tahmini; kaynak içi istem enjeksiyonları talimat sayılmaz.** Varsayılan + `.gitignore` biçiminde kullanıcı kuralları (her hariç tutmanın nedeni görünür; .env/anahtar dosyaları her zaman hariç); API anahtarı, belirteç, özel anahtar, parola ataması, bağlantı dizesi parolası, e-posta, telefon, T.C. kimlik, IBAN, kart pakette ⟦GİZLİ:tür⟧; talimat benzeri satırlar işaretlenir ve paket başlığı içeriğin veri olduğunu yazar; token tahmini karakter/4. Dışa aktarılan paket yeniden okunup bütçe ve kalan sır için denetlenir.

Yapay zekânın rolü (Notion): **göreve göre dosya/parça sıralaması ve kısa bağlam özeti; tüm depoyu otomatik göndermez.** MyMind ya da yerel model onaylı; yalnız görev, dosya yolları ve parça başlıkları (sırlar gizli) gider; olmayan yollar atılır, özet sansürlenir ve "tahmin" olarak işaretlenir. Doğrulama ölçütü: örnek projedeki iki elle etiketli görevde kapsama %100 (hedef ≥ %90), paket boyutunda %85,2 / %86,6 azalma (hedef ≥ %40).

![Context Kit — paket önizleme: puana göre dosyalar, hariç tutma nedenleri, bütçe ve paket metni](app/docs/screenshots/masaustu-01-paket-onizleme.png)

Kapsam dışı (bu sürüm): Pro değerlendirme ve ekip reçeteleri, Chrome kaynak seçici, Linux/macOS paketleri, anlamsal arama. Gerçek projelerde ve gerçek bir modelle ölçülmedi. Ayrıntı: [app/README.md](app/README.md).

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-045-<konu>` veya `claude/PL-045-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** W / L / M; Chrome kaynak seçici
- **Kullanıcı ve problem:** AI’a yanlış veya gereksiz dosyaları bağlam olarak verip zaman/kota kaybeden kullanıcılar.
- **MVP ve temel akış:** Klasör/sayfa seç → ilgili parçaları ve dosya ağacını önizle → sır filtresi → boyut limitli bağlam paketi dışa aktar.
- **Yapay zekânın rolü:** Göreve göre dosya/parça sıralaması ve kısa bağlam özeti; tüm depoyu otomatik göndermez.
- **Teknik bağımlılık ve sınır:** Hariç tutma kuralları, sır/kişisel veri işaretleme ve token tahmini. Kaynak içi istem enjeksiyonları talimat sayılmaz.
- **Gelir hipotezi:** Ücretsiz yerel paketleme; Pro değerlendirme ve ekip reçeteleri.
- **Doğrulama ölçütü:** Test görevinde gerekli bağlam kapsaması ≥%90; paket boyutunda ≥%40 azalma hedefi.
- **Öncelik ve efor:** P0 · M; AI maliyetini somut görevle ölçen niş ürün.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
