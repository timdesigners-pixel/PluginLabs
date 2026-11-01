# PL-019 · Compare Lens

> Açık sayfalardaki ürün ve hizmet bilgilerini ortak ölçütlerle yan yana karşılaştırır.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-019` · `compare-lens` |
| Kategori | 02 · Kişisel arşiv ve Chrome araçları — PL-011–020 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | [timdesigners-pixel/compare-lens](https://github.com/timdesigners-pixel/compare-lens) · Windows sürümü [v0.1.0](https://github.com/timdesigners-pixel/compare-lens/releases/tag/v0.1.0) |
| Codex projesi | `PL-019 · Compare Lens` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981caa69dd557ce408743) |

## Ne işe yarar

**Kullanıcı ve problem:** Açık ürün veya hizmet sayfalarını aynı ölçütlerle yan yana karşılaştırmak isteyen kişiler.

**Kısa tanım (Hub kataloğu):** Açık sayfalardaki ürün ve hizmet bilgilerini ortak ölçütlerle yan yana karşılaştırır.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome; W / L / M tarayıcı

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Seçilen 2–5 sekmeden fiyat, özellik ve koşul alanlarını kaynak bağlantılarıyla matrise koy; eksik alanı bilinmiyor göster.

### Yapay zekânın rolü

Ürünlerden ziyade kullanıcının ölçütlerine göre farkları özetler; ölçülmemiş puan uydurmaz.

## Teknik bağımlılık ve sınırlar

Yalnız kullanıcı seçtiği sayfalara erişim; reklam/ortaklık sıralaması satın alınamaz. Son görülen zaman kaydı gerekir.

## Gelir hipotezi

Ücretsiz karşılaştırma kotası; Pro kayıtlı karar şablonları.

## Doğrulama ölçütü

Kaynaklı alan doğruluğu ≥%95; kullanıcı karar süresinde ≥%30 düşüş.

## Öncelik ve efor

P1 · M; Scrapper geçmiş tutar, bu ürün anlık karar matrisi üretir.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-019-<konu>` veya `claude/PL-019-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome; W / L / M tarayıcı
- **Kullanıcı ve problem:** Açık ürün veya hizmet sayfalarını aynı ölçütlerle yan yana karşılaştırmak isteyen kişiler.
- **MVP ve temel akış:** Seçilen 2–5 sekmeden fiyat, özellik ve koşul alanlarını kaynak bağlantılarıyla matrise koy; eksik alanı bilinmiyor göster.
- **Yapay zekânın rolü:** Ürünlerden ziyade kullanıcının ölçütlerine göre farkları özetler; ölçülmemiş puan uydurmaz.
- **Teknik bağımlılık ve sınır:** Yalnız kullanıcı seçtiği sayfalara erişim; reklam/ortaklık sıralaması satın alınamaz. Son görülen zaman kaydı gerekir.
- **Gelir hipotezi:** Ücretsiz karşılaştırma kotası; Pro kayıtlı karar şablonları.
- **Doğrulama ölçütü:** Kaynaklı alan doğruluğu ≥%95; kullanıcı karar süresinde ≥%30 düşüş.
- **Öncelik ve efor:** P1 · M; Scrapper geçmiş tutar, bu ürün anlık karar matrisi üretir.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
