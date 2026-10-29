# PL-014 · Social Saves Organizer

> Kaydedilmiş sosyal medya içeriklerini kaynaklarıyla toplar, etiketler ve koleksiyonlara ayırır.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-014` · `social-saves-organizer` |
| Kategori | 02 · Kişisel arşiv ve Chrome araçları — PL-011–020 |
| Durum | Mevcut Instagram kaydedilenleri düzenleme görevi |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | [timdesigners-pixel/social-saves-organizer](https://github.com/timdesigners-pixel/social-saves-organizer) |
| Codex projesi | `PL-014 · Social Saves Organizer` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981caa69dd557ce408743) |

## Ne işe yarar

**Kullanıcı ve problem:** Kaydettiği sosyal içerikleri daha sonra bulamayan kullanıcılar.

**Kısa tanım (Hub kataloğu):** Kaydedilmiş sosyal medya içeriklerini kaynaklarıyla toplar, etiketler ve koleksiyonlara ayırır.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M kişisel arşiv

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kullanıcının erişebildiği dışa aktarım veya açıkça seçtiği bağlantıları al; kategori, not, etiket, bozuk bağlantı ve koleksiyon görünümü sun.

### Yapay zekânın rolü

Başlık/açıklamadan konu etiketi ve benzer içerik kümeleri; bulunmayan içeriği uydurmaz.

## Teknik bağımlılık ve sınırlar

Instagram’ın tüm kaydedilenlere erişen bir API sunduğu varsayılmaz. İlk sürüm URL/izinli dışa aktarım; hesap parolası alınmaz.

## Gelir hipotezi

Freemium koleksiyon; Pro toplu düzenleme ve yerel arama.

## Doğrulama ölçütü

500 kayıtta kullanıcıca kabul edilen etiket ≥%85; yeniden bulma süresinde ≥%50 azalma.

## Öncelik ve efor

P1 · M; tek kaynaklı dar MVP, Musebook ile ortak koleksiyon şeması.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-014-<konu>` veya `claude/PL-014-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut Instagram kaydedilenleri düzenleme görevi
- **Platform:** Chrome + W / L / M kişisel arşiv
- **Kullanıcı ve problem:** Kaydettiği sosyal içerikleri daha sonra bulamayan kullanıcılar.
- **MVP ve temel akış:** Kullanıcının erişebildiği dışa aktarım veya açıkça seçtiği bağlantıları al; kategori, not, etiket, bozuk bağlantı ve koleksiyon görünümü sun.
- **Yapay zekânın rolü:** Başlık/açıklamadan konu etiketi ve benzer içerik kümeleri; bulunmayan içeriği uydurmaz.
- **Teknik bağımlılık ve sınır:** Instagram’ın tüm kaydedilenlere erişen bir API sunduğu varsayılmaz. İlk sürüm URL/izinli dışa aktarım; hesap parolası alınmaz.
- **Gelir hipotezi:** Freemium koleksiyon; Pro toplu düzenleme ve yerel arama.
- **Doğrulama ölçütü:** 500 kayıtta kullanıcıca kabul edilen etiket ≥%85; yeniden bulma süresinde ≥%50 azalma.
- **Öncelik ve efor:** P1 · M; tek kaynaklı dar MVP, Musebook ile ortak koleksiyon şeması.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
