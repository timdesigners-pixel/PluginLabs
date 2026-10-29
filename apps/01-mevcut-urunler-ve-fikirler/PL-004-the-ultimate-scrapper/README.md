# PL-004 · The Ultimate Scrapper

> Seçilen web sayfalarından ürün bilgilerini çıkarır ve kaynaklarıyla birlikte arşivler.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-004` · `the-ultimate-scrapper` |
| Kategori | 01 · Mevcut ürünler ve fikirler — PL-001–010 |
| Durum | Mevcut ayrıntılı proje planı · dağıtım durumu doğrulanmadı |
| Öncelik / efor | P1 · L |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-004 · The Ultimate Scrapper` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981edbfa2cdc55d867114) |

## Ne işe yarar

**Kullanıcı ve problem:** Favori ürün ve ilanlarını farklı sitelerde kaybeden alışveriş ve koleksiyon kullanıcıları.

**Kısa tanım (Hub kataloğu):** Seçilen web sayfalarından ürün bilgilerini çıkarır ve kaynaklarıyla birlikte arşivler.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M arşivci

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

İlk iki izinli kaynakta kullanıcı başlatmalı kaydetme; standart ürün kartı, fiyat/stok geçmişi, yerel görsel ve CSV/JSON arşivi.

### Yapay zekânın rolü

Başlık normalizasyonu, kategori önerisi ve olası aynı ürün eşleştirmesi; fiyat değeri kaynak DOM/API verisinden alınır.

## Teknik bağımlılık ve sınırlar

Kaynak koşulları, oturum yetkisi ve oran sınırı. Captcha atlatılmaz; erişim engelinde kullanıcıya dönülür. DOM bağlayıcı testleri gerekir.

## Gelir hipotezi

Ücretsiz sınırlı liste; Pro geçmiş ve izleme kotası. Ortaklık geliri varsa açık etiketli.

## Doğrulama ölçütü

İki kaynaktan %95 eksiksiz alan çıkarma; mükerrer kart oranı \<%2.

## Öncelik ve efor

P1 · L; kaynak bakım maliyeti ürün maliyetine dahil.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-004-<konu>` veya `claude/PL-004-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut ayrıntılı proje planı · dağıtım durumu doğrulanmadı
- **Platform:** Chrome + W / L / M arşivci
- **Kullanıcı ve problem:** Favori ürün ve ilanlarını farklı sitelerde kaybeden alışveriş ve koleksiyon kullanıcıları.
- **MVP ve temel akış:** İlk iki izinli kaynakta kullanıcı başlatmalı kaydetme; standart ürün kartı, fiyat/stok geçmişi, yerel görsel ve CSV/JSON arşivi.
- **Yapay zekânın rolü:** Başlık normalizasyonu, kategori önerisi ve olası aynı ürün eşleştirmesi; fiyat değeri kaynak DOM/API verisinden alınır.
- **Teknik bağımlılık ve sınır:** Kaynak koşulları, oturum yetkisi ve oran sınırı. Captcha atlatılmaz; erişim engelinde kullanıcıya dönülür. DOM bağlayıcı testleri gerekir.
- **Gelir hipotezi:** Ücretsiz sınırlı liste; Pro geçmiş ve izleme kotası. Ortaklık geliri varsa açık etiketli.
- **Doğrulama ölçütü:** İki kaynaktan %95 eksiksiz alan çıkarma; mükerrer kart oranı \<%2.
- **Öncelik ve efor:** P1 · L; kaynak bakım maliyeti ürün maliyetine dahil.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
