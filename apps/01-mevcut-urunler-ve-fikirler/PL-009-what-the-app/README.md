# PL-009 · What the App!

> Uygulamaları keşfetmeyi, karşılaştırmayı ve uygun kurulum kaynağına ulaşmayı sağlar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-009` · `what-the-app` |
| Kategori | 01 · Mevcut ürünler ve fikirler — PL-001–010 |
| Durum | Mevcut fikir · uygulama keşif/paketleme yönü |
| Öncelik / efor | P2 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-009 · What the App!` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981edbfa2cdc55d867114) |

## Ne işe yarar

**Kullanıcı ve problem:** İhtiyacına uygun yazılımı bulup kurulum seçeneklerini karşılaştırmak isteyen kullanıcılar.

**Kısa tanım (Hub kataloğu):** Uygulamaları keşfetmeyi, karşılaştırmayı ve uygun kurulum kaynağına ulaşmayı sağlar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome keşif sayfası + W / L / M kurulum yardımcısı

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

İhtiyaç soruları, küratörlü araç kartları ve platforma uygun liste. İlk sürüm yalnız doğrulanmış resmi indirme bağlantılarını açar.

### Yapay zekânın rolü

İhtiyacı özelliklere dönüştürür; neden önerildiğini ve alternatifleri açıklar.

## Teknik bağımlılık ve sınırlar

Kurulumlar açık kullanıcı seçimiyle; sessiz toplu yükleme ve yönetici işlemleri varsayılan kapalı. Fiyat ve sürüm bilgileri tarihli.

## Gelir hipotezi

Ücretsiz keşif; ücretli ekip kurulum profilleri. Sponsorlu öneri varsa ayrıştırılır.

## Doğrulama ölçütü

İlk oturumda uygun araç bulma ≥%70; bozuk resmi bağlantı \<%1.

## Öncelik ve efor

P2 · M; özgün içerik ve bakım gerektirir.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-009-<konu>` veya `claude/PL-009-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut fikir · uygulama keşif/paketleme yönü
- **Platform:** Chrome keşif sayfası + W / L / M kurulum yardımcısı
- **Kullanıcı ve problem:** İhtiyacına uygun yazılımı bulup kurulum seçeneklerini karşılaştırmak isteyen kullanıcılar.
- **MVP ve temel akış:** İhtiyaç soruları, küratörlü araç kartları ve platforma uygun liste. İlk sürüm yalnız doğrulanmış resmi indirme bağlantılarını açar.
- **Yapay zekânın rolü:** İhtiyacı özelliklere dönüştürür; neden önerildiğini ve alternatifleri açıklar.
- **Teknik bağımlılık ve sınır:** Kurulumlar açık kullanıcı seçimiyle; sessiz toplu yükleme ve yönetici işlemleri varsayılan kapalı. Fiyat ve sürüm bilgileri tarihli.
- **Gelir hipotezi:** Ücretsiz keşif; ücretli ekip kurulum profilleri. Sponsorlu öneri varsa ayrıştırılır.
- **Doğrulama ölçütü:** İlk oturumda uygun araç bulma ≥%70; bozuk resmi bağlantı \<%1.
- **Öncelik ve efor:** P2 · M; özgün içerik ve bakım gerektirir.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
