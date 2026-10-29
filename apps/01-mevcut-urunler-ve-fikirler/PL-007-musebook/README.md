# PL-007 · Musebook

> Görselleri ve ilham kaynaklarını koleksiyonlarda toplar; etiketleme ve görsel arama sunar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-007` · `musebook` |
| Kategori | 01 · Mevcut ürünler ve fikirler — PL-001–010 |
| Durum | Mevcut fikir · Proje ve Fikirler notu |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-007 · Musebook` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981edbfa2cdc55d867114) |

## Ne işe yarar

**Kullanıcı ve problem:** Tasarımcıların ilham görselleri, bağlantıları ve varlıkları tekrar bulamaması.

**Kısa tanım (Hub kataloğu):** Görselleri ve ilham kaynaklarını koleksiyonlarda toplar; etiketleme ve görsel arama sunar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M görsel kütüphane

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Görsel/URL yakalama, panolar, renk ve kaynak alanları, yerel küçük resimler; lisans/atıf bilgisi için ayrı alan.

### Yapay zekânın rolü

Görsel benzerlik, renk/konu etiketleri ve doğal dille koleksiyon arama.

## Teknik bağımlılık ve sınırlar

Üçüncü taraf görsellerin hakları ve indirme izni korunur; ticari yeniden kullanım için lisans doğrulaması gerekir.

## Gelir hipotezi

Ücretsiz kişisel pano; Pro koleksiyon boyutu ve ekip panoları.

## Doğrulama ölçütü

100 öğelik test koleksiyonunda aranan görsele ilk 5 sonuçta erişim ≥%85.

## Öncelik ve efor

P1 · M; Pinterest modülünden farklı olarak kaynak bağımsız varlık arşivi.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-007-<konu>` veya `claude/PL-007-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut fikir · Proje ve Fikirler notu
- **Platform:** Chrome + W / L / M görsel kütüphane
- **Kullanıcı ve problem:** Tasarımcıların ilham görselleri, bağlantıları ve varlıkları tekrar bulamaması.
- **MVP ve temel akış:** Görsel/URL yakalama, panolar, renk ve kaynak alanları, yerel küçük resimler; lisans/atıf bilgisi için ayrı alan.
- **Yapay zekânın rolü:** Görsel benzerlik, renk/konu etiketleri ve doğal dille koleksiyon arama.
- **Teknik bağımlılık ve sınır:** Üçüncü taraf görsellerin hakları ve indirme izni korunur; ticari yeniden kullanım için lisans doğrulaması gerekir.
- **Gelir hipotezi:** Ücretsiz kişisel pano; Pro koleksiyon boyutu ve ekip panoları.
- **Doğrulama ölçütü:** 100 öğelik test koleksiyonunda aranan görsele ilk 5 sonuçta erişim ≥%85.
- **Öncelik ve efor:** P1 · M; Pinterest modülünden farklı olarak kaynak bağımsız varlık arşivi.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
