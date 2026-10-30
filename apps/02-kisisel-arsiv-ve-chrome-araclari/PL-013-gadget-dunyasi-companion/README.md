# PL-013 · Gadget Dünyası Companion

> Ürün bilgilerini, incelemeleri ve fiyatları bir araya getirerek teknoloji ürünlerini karşılaştırır.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-013` · `gadget-dunyasi-companion` |
| Kategori | 02 · Kişisel arşiv ve Chrome araçları — PL-011–020 |
| Durum | Mevcut isim/fikir · bu kapsam yeni öneri |
| Öncelik / efor | P2 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | [timdesigners-pixel/gadget-dunyasi-companion](https://github.com/timdesigners-pixel/gadget-dunyasi-companion) |
| Codex projesi | `PL-013 · Gadget Dünyası Companion` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981caa69dd557ce408743) |

## Ne işe yarar

**Kullanıcı ve problem:** Aksesuar ve cihaz özelliklerini, uyumluluklarını ve satın alma notlarını dağınık tutan kullanıcılar.

**Kısa tanım (Hub kataloğu):** Ürün bilgilerini, incelemeleri ve fiyatları bir araya getirerek teknoloji ürünlerini karşılaştırır.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M ürün paneli

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kullanıcı eklediği ürün kartlarını teknik özellik, cihaz uyumluluğu ve resmi kaynak bağlantısıyla karşılaştırır. İlk sürüm iki ürün türü.

### Yapay zekânın rolü

Kullanım ihtiyacına göre özellik farklarını açıklar; tahmini uyumluluğu kesin bilgi gibi sunmaz.

## Teknik bağımlılık ve sınırlar

Canlı fiyat/özellikler tarihli kaynakla tutulur; izinsiz mağaza kazıması yerine izinli veri veya manuel giriş.

## Gelir hipotezi

Ücretsiz karşılaştırma; Pro cihaz envanteri ve bakım hatırlatıcıları. Reklam varsa etiketlenir.

## Doğrulama ölçütü

20 senaryoda uygunluk açıklaması uzman/kullanıcı değerlendirmesiyle ≥%80 yararlı.

## Öncelik ve efor

P2 · M; Ultimate Scrapper’dan farkı fiyat izleme yerine cihaz uyumluluğu.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-013-<konu>` veya `claude/PL-013-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut isim/fikir · bu kapsam yeni öneri
- **Platform:** Chrome + W / L / M ürün paneli
- **Kullanıcı ve problem:** Aksesuar ve cihaz özelliklerini, uyumluluklarını ve satın alma notlarını dağınık tutan kullanıcılar.
- **MVP ve temel akış:** Kullanıcı eklediği ürün kartlarını teknik özellik, cihaz uyumluluğu ve resmi kaynak bağlantısıyla karşılaştırır. İlk sürüm iki ürün türü.
- **Yapay zekânın rolü:** Kullanım ihtiyacına göre özellik farklarını açıklar; tahmini uyumluluğu kesin bilgi gibi sunmaz.
- **Teknik bağımlılık ve sınır:** Canlı fiyat/özellikler tarihli kaynakla tutulur; izinsiz mağaza kazıması yerine izinli veri veya manuel giriş.
- **Gelir hipotezi:** Ücretsiz karşılaştırma; Pro cihaz envanteri ve bakım hatırlatıcıları. Reklam varsa etiketlenir.
- **Doğrulama ölçütü:** 20 senaryoda uygunluk açıklaması uzman/kullanıcı değerlendirmesiyle ≥%80 yararlı.
- **Öncelik ve efor:** P2 · M; Ultimate Scrapper’dan farkı fiyat izleme yerine cihaz uyumluluğu.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
