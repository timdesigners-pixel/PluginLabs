# PL-022 · Twin Finder

> Dosya özetlerini karşılaştırarak yinelenen dosyaları bulur ve temizleme önizlemesi sunar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-022` · `twin-finder` |
| Kategori | 03 · Masaüstü, dosya araçları ve widget’lar — PL-021–030 |
| Durum | Yeni fikir · birebir kopya taraması deneyiminden |
| Öncelik / efor | P0 · M |
| Hedef platformlar | Windows, Linux, macOS |
| Dağıtım biçimi | masaüstü uygulaması |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-022 · Twin Finder` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f98193b5c3ef18528e0c83) |

## Ne işe yarar

**Kullanıcı ve problem:** Aynı dosyaların farklı klasörlerde alan kaplamasını çözmek isteyen kişiler.

**Kısa tanım (Hub kataloğu):** Dosya özetlerini karşılaştırarak yinelenen dosyaları bulur ve temizleme önizlemesi sunar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M masaüstü

- Windows
- Linux
- macOS

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Önce boyut, sonra SHA-256/byte doğrulama; kanonik kopya seçimi, bağımlılık koruması, karantina ve geri alma.

### Yapay zekânın rolü

AI sadece benzer ad/içerik açıklamasına yardım eder; birebir eşitlik model kararıyla belirlenmez.

## Teknik bağımlılık ve sınırlar

Program bileşenleri, bulut yer tutucuları, sembolik bağlantılar ve aktif dosyalar korunur. Silme varsayılan değil, karantina varsayılan.

## Gelir hipotezi

Ücretsiz sınırlı tarama; Pro büyük koleksiyon ve ağ klasörü incelemesi.

## Doğrulama ölçütü

Yanlış birebir eşitlik sıfır; 10 GB test arşivinde süre ve bellek ölçümü.

## Öncelik ve efor

P0 · M; Desk Tidy’den farkı organizasyon değil içerik bütünlüğü ve alan.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-022-<konu>` veya `claude/PL-022-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir · birebir kopya taraması deneyiminden
- **Platform:** W / L / M masaüstü
- **Kullanıcı ve problem:** Aynı dosyaların farklı klasörlerde alan kaplamasını çözmek isteyen kişiler.
- **MVP ve temel akış:** Önce boyut, sonra SHA-256/byte doğrulama; kanonik kopya seçimi, bağımlılık koruması, karantina ve geri alma.
- **Yapay zekânın rolü:** AI sadece benzer ad/içerik açıklamasına yardım eder; birebir eşitlik model kararıyla belirlenmez.
- **Teknik bağımlılık ve sınır:** Program bileşenleri, bulut yer tutucuları, sembolik bağlantılar ve aktif dosyalar korunur. Silme varsayılan değil, karantina varsayılan.
- **Gelir hipotezi:** Ücretsiz sınırlı tarama; Pro büyük koleksiyon ve ağ klasörü incelemesi.
- **Doğrulama ölçütü:** Yanlış birebir eşitlik sıfır; 10 GB test arşivinde süre ve bellek ölçümü.
- **Öncelik ve efor:** P0 · M; Desk Tidy’den farkı organizasyon değil içerik bütünlüğü ve alan.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
