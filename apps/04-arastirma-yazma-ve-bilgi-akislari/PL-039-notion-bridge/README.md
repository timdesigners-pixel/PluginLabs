# PL-039 · Notion Bridge

> Seçilen içeriği Notion veritabanı alanlarına eşler ve kayıt öncesi taslak önizlemesi gösterir.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-039` · `notion-bridge` |
| Kategori | 04 · Araştırma, yazma ve bilgi akışları — PL-031–040 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-039 · Notion Bridge` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981c08edfda43643b31fc) |

## Ne işe yarar

**Kullanıcı ve problem:** Web ve masaüstü verilerini Notion’daki doğru alana elle aktaran kullanıcılar.

**Kısa tanım (Hub kataloğu):** Seçilen içeriği Notion veritabanı alanlarına eşler ve kayıt öncesi taslak önizlemesi gösterir.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M bağlantı penceresi

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

İzinli Notion hedefi seç → şemayı oku → alan eşleştir → taslak önizle → kaydet. İlk sürüm tek veri tabanına kart ekleme.

### Yapay zekânın rolü

Metni veritabanı alanlarına ayırır; olmayan property uydurmaz ve belirsiz alanı boş bırakır.

## Teknik bağımlılık ve sınırlar

Notion yetkileri/rate limitleri ve API değişimleri; ayrıcalık yükseltmez. Var olan sayfa içeriğini sessizce değiştirmez.

## Gelir hipotezi

Freemium yakalama; Pro çoklu şema ve ekip onay akışı.

## Doğrulama ölçütü

Şema uyumsuz kayıt sıfır; aynı girdiyi tekrar çalıştırmada mükerrer kayıt oluşmaması.

## Öncelik ve efor

P1 · M; yerel dosya erişimi için masaüstü köprüsü.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-039-<konu>` veya `claude/PL-039-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome + W / L / M bağlantı penceresi
- **Kullanıcı ve problem:** Web ve masaüstü verilerini Notion’daki doğru alana elle aktaran kullanıcılar.
- **MVP ve temel akış:** İzinli Notion hedefi seç → şemayı oku → alan eşleştir → taslak önizle → kaydet. İlk sürüm tek veri tabanına kart ekleme.
- **Yapay zekânın rolü:** Metni veritabanı alanlarına ayırır; olmayan property uydurmaz ve belirsiz alanı boş bırakır.
- **Teknik bağımlılık ve sınır:** Notion yetkileri/rate limitleri ve API değişimleri; ayrıcalık yükseltmez. Var olan sayfa içeriğini sessizce değiştirmez.
- **Gelir hipotezi:** Freemium yakalama; Pro çoklu şema ve ekip onay akışı.
- **Doğrulama ölçütü:** Şema uyumsuz kayıt sıfır; aynı girdiyi tekrar çalıştırmada mükerrer kayıt oluşmaması.
- **Öncelik ve efor:** P1 · M; yerel dosya erişimi için masaüstü köprüsü.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
