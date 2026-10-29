# PL-045 · Context Kit

> Seçilen dosya ve sayfalardan boyut sınırı olan, önizlenebilir AI bağlam paketleri hazırlar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-045` · `context-kit` |
| Kategori | 05 · Geliştirici ve profesyonel araçlar — PL-041–050 |
| Durum | Yeni fikir |
| Öncelik / efor | P0 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
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
