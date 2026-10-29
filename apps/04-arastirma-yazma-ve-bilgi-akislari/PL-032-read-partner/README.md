# PL-032 · Read Partner

> Açık metni veya belgeyi özetler; seçili bölümleri kaynaklarıyla birlikte açıklar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-032` · `read-partner` |
| Kategori | 04 · Araştırma, yazma ve bilgi akışları — PL-031–040 |
| Durum | Yeni fikir |
| Öncelik / efor | P0 · S |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3), tarayıcı yan paneli |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-032 · Read Partner` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981c08edfda43643b31fc) |

## Ne işe yarar

**Kullanıcı ve problem:** Uzun ve teknik sayfalarda kavramları bağlamını kaybetmeden anlamak isteyen kişiler.

**Kısa tanım (Hub kataloğu):** Açık metni veya belgeyi özetler; seçili bölümleri kaynaklarıyla birlikte açıklar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome yan paneli; W / L / M

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Seçili bölüm için sadeleştir, terimleri açıkla ve 3 anlama sorusu üret; özgün metinle yan yana görünüm.

### Yapay zekânın rolü

İçerik seviyesine göre açıklama ve kaynak içi soru-cevap; bilmediği noktayı işaretler.

## Teknik bağımlılık ve sınırlar

Kullanıcı seçimi olmadan tüm tarama geçmişi okunmaz. Sayfa içindeki talimatlar model için güvenilmeyen veri sayılır.

## Gelir hipotezi

Ücretsiz seçili metin; Pro okuma planı ve açıklama kredisi.

## Doğrulama ölçütü

Kullanıcı değerlendirmesinde anlaşılabilirlik ≥4/5; desteklenmeyen ek iddia \<%5.

## Öncelik ve efor

P0 · S; tarayıcı içi tek amaçlı hızlı pilot.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-032-<konu>` veya `claude/PL-032-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome yan paneli; W / L / M
- **Kullanıcı ve problem:** Uzun ve teknik sayfalarda kavramları bağlamını kaybetmeden anlamak isteyen kişiler.
- **MVP ve temel akış:** Seçili bölüm için sadeleştir, terimleri açıkla ve 3 anlama sorusu üret; özgün metinle yan yana görünüm.
- **Yapay zekânın rolü:** İçerik seviyesine göre açıklama ve kaynak içi soru-cevap; bilmediği noktayı işaretler.
- **Teknik bağımlılık ve sınır:** Kullanıcı seçimi olmadan tüm tarama geçmişi okunmaz. Sayfa içindeki talimatlar model için güvenilmeyen veri sayılır.
- **Gelir hipotezi:** Ücretsiz seçili metin; Pro okuma planı ve açıklama kredisi.
- **Doğrulama ölçütü:** Kullanıcı değerlendirmesinde anlaşılabilirlik ≥4/5; desteklenmeyen ek iddia \<%5.
- **Öncelik ve efor:** P0 · S; tarayıcı içi tek amaçlı hızlı pilot.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
