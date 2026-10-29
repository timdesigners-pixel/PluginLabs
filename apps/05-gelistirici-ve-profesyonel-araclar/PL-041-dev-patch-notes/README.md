# PL-041 · Dev Patch Notes

> Git değişikliklerinden kaynak commit bağlantıları içeren düzenlenebilir sürüm notları hazırlar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-041` · `dev-patch-notes` |
| Kategori | 05 · Geliştirici ve profesyonel araçlar — PL-041–050 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3), tarayıcı yan paneli |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-041 · Dev Patch Notes` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981059dfad209ce1240d1) |

## Ne işe yarar

**Kullanıcı ve problem:** Kod değişikliğini kullanıcıya anlaşılır sürüm notuna dönüştürmek isteyen küçük ekipler.

**Kısa tanım (Hub kataloğu):** Git değişikliklerinden kaynak commit bağlantıları içeren düzenlenebilir sürüm notları hazırlar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome yan paneli + W / L / M geliştirici aracı

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Seçilen git diff/commit listesini içe al; değişiklikleri özellik/düzeltme başlıklarına ayır, kaynak commit bağlantısıyla düzenlenebilir not üret.

### Yapay zekânın rolü

Kod farkından davranış değişikliği taslağı çıkarır; test geçişi veya performans artışı kanıtsız yazılmaz.

## Teknik bağımlılık ve sınırlar

Yalnız seçili depo/veri; API anahtarı ve sır taraması. Otomatik commit, push ve yayın yok.

## Gelir hipotezi

Freemium bireysel; ekip başına Pro ve özel şablonlar.

## Doğrulama ölçütü

10 sürümde editör düzeltme süresinde ≥%50 azalma; uydurma teslim iddiası sıfır.

## Öncelik ve efor

P1 · M; geliştiricinin onayladığı yayın notu aracı.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-041-<konu>` veya `claude/PL-041-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome yan paneli + W / L / M geliştirici aracı
- **Kullanıcı ve problem:** Kod değişikliğini kullanıcıya anlaşılır sürüm notuna dönüştürmek isteyen küçük ekipler.
- **MVP ve temel akış:** Seçilen git diff/commit listesini içe al; değişiklikleri özellik/düzeltme başlıklarına ayır, kaynak commit bağlantısıyla düzenlenebilir not üret.
- **Yapay zekânın rolü:** Kod farkından davranış değişikliği taslağı çıkarır; test geçişi veya performans artışı kanıtsız yazılmaz.
- **Teknik bağımlılık ve sınır:** Yalnız seçili depo/veri; API anahtarı ve sır taraması. Otomatik commit, push ve yayın yok.
- **Gelir hipotezi:** Freemium bireysel; ekip başına Pro ve özel şablonlar.
- **Doğrulama ölçütü:** 10 sürümde editör düzeltme süresinde ≥%50 azalma; uydurma teslim iddiası sıfır.
- **Öncelik ve efor:** P1 · M; geliştiricinin onayladığı yayın notu aracı.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
