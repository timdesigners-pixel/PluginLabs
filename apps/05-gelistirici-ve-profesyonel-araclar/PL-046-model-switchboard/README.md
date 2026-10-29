# PL-046 · Model Switchboard

> Model sağlayıcılarını, istek maliyetlerini ve aynı görevde ürettikleri yanıtları karşılaştırır.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-046` · `model-switchboard` |
| Kategori | 05 · Geliştirici ve profesyonel araçlar — PL-041–050 |
| Durum | Yeni fikir |
| Öncelik / efor | P2 · L |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-046 · Model Switchboard` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981059dfad209ce1240d1) |

## Ne işe yarar

**Kullanıcı ve problem:** Birden çok model sağlayıcısının maliyet, anahtar ve çıktılarını karşılaştırmak isteyen kişiler.

**Kısa tanım (Hub kataloğu):** Model sağlayıcılarını, istek maliyetlerini ve aynı görevde ürettikleri yanıtları karşılaştırır.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M geliştirici/kullanıcı paneli

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Resmi API anahtarıyla tek panel; model kataloğu, istek maliyeti tahmini ve aynı görevde yan yana değerlendirme. İlk sürüm iki sağlayıcı.

### Yapay zekânın rolü

Görev türüne göre model önerir; hız/kalite ölçümünü kayıtlı test sonucuna bağlar.

## Teknik bağımlılık ve sınırlar

Fiyatlar sağlayıcıdan doğrulanmalı ve tarihli olmalı; limit aşımı için kullanıcı bütçe tavanı. Tüketici web hesabı çerezi kullanılmaz.

## Gelir hipotezi

Pro yerel istemci; ekip bütçe/anahtar politikası. API faturası ayrıca açıkça belirtilir.

## Doğrulama ölçütü

Görev başına gerçek maliyet görünürlüğü %100; bütçe tavanı aşımı sıfır hedefi.

## Öncelik ve efor

P2 · L; sağlayıcı sözleşmeleri ve sürekli katalog bakımı.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-046-<konu>` veya `claude/PL-046-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome + W / L / M geliştirici/kullanıcı paneli
- **Kullanıcı ve problem:** Birden çok model sağlayıcısının maliyet, anahtar ve çıktılarını karşılaştırmak isteyen kişiler.
- **MVP ve temel akış:** Resmi API anahtarıyla tek panel; model kataloğu, istek maliyeti tahmini ve aynı görevde yan yana değerlendirme. İlk sürüm iki sağlayıcı.
- **Yapay zekânın rolü:** Görev türüne göre model önerir; hız/kalite ölçümünü kayıtlı test sonucuna bağlar.
- **Teknik bağımlılık ve sınır:** Fiyatlar sağlayıcıdan doğrulanmalı ve tarihli olmalı; limit aşımı için kullanıcı bütçe tavanı. Tüketici web hesabı çerezi kullanılmaz.
- **Gelir hipotezi:** Pro yerel istemci; ekip bütçe/anahtar politikası. API faturası ayrıca açıkça belirtilir.
- **Doğrulama ölçütü:** Görev başına gerçek maliyet görünürlüğü %100; bütçe tavanı aşımı sıfır hedefi.
- **Öncelik ve efor:** P2 · L; sağlayıcı sözleşmeleri ve sürekli katalog bakımı.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
