# PL-055 · MyMind AI

> PluginLabs ailesinin ortak yerel yapay zekâ uygulaması: bilgisayardaki küçük dil modelini (Hub MyMind Lite, LM Studio, Ollama) tek pencerede kullanır, ürünlerin MyMind ihtiyaçlarını doğrulanmış görev şablonlarıyla karşılar; Chrome eklentisi ve diğer ürünler onaylı yerel köprüyle bağlanır.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-055` · `mymind-ai` |
| Kategori | 07 · Yeni ürünler — PL-054+ |
| Durum | v0.1.0 · Windows uygulaması (Rust + Tauri 2) + Chrome MV3 eklentisi |
| Hedef platformlar | Windows, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | [timdesigners-pixel/mymind-ai](https://github.com/timdesigners-pixel/mymind-ai) |
| Sürüm | [v0.1.0](https://github.com/timdesigners-pixel/mymind-ai/releases/tag/v0.1.0) · Hub kataloğu: `mymind-ai` |

## Ne işe yarar

**Kısa tanım (01.11.2026):** PluginLabs ailesinin ortak yerel yapay zekâ uygulaması: bilgisayardaki küçük dil modelini (Hub MyMind Lite, LM Studio, Ollama) tek pencerede kullanır, ürünlerin MyMind ihtiyaçlarını doğrulanmış görev şablonlarıyla karşılar; Chrome eklentisi ve diğer ürünler onaylı yerel köprüyle bağlanır.

## Hangi platformlar için yayınlanır

**Platform tanımı:** Windows uygulaması + Chrome eklentisi

- Windows
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Sağlayıcı seç (Hub anahtarı Windows kasasında; LM Studio/Ollama yalnız loopback) → sohbet veya görev şablonu → çıktı alan alan doğrulanır → kullanıcı isterse taslak olarak kaydeder. Eklenti: eşleştir → seçim/sayfa metnini önizle ve düzenle → masaüstünde tam metinle onayla → doğrulanmış yanıt.

### Yapay zekânın rolü

Özet, analiz, görev/not taslağı, etiket, başlık sadeleştirme (dayanak denetimli), kategori, sonuç sınıflandırma, ihtiyaçtan özelliğe, karşılaştırma, yeniden yazma, çeviri, bağlama dayalı soru. Vision, araç çağrısı, bilgisayar kullanımı ve eğitim yok.

### Ayrıntılı özellik kapsamı

- **Kaynak şartname:** Notion kartı yok. Şartname: mind-palace/MYMIND.md (MyMind Lite sınırları), PluginLabs docs/ecosystem-v1/MY-MIND.md (ortak AI katmanı, sözleşme taslağı), docs/MUST-HAVE.md MH-6 ve ürün README’lerindeki MyMind ihtiyaçları.

## Teknik bağımlılık ve sınırlar

İstek ≤6000, bağlam ≤6000 karakter, ≤512 token, 30 sn; prompt/yanıt günlüğe yazılmaz; köprü yalnız 127.0.0.1, web Origin’i reddedilir, her istek masaüstünde onaylanır (5 dk).

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-055-<konu>` veya `claude/PL-055-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

---
Oluşturma: 01.11.2026 (Claude Code) · Notion kartı yok; kaynak: MyMind şartnameleri ve ürün README'leri → `registry/projects.json` → bu dosya. Ayrıntılı kullanım ve ekran görüntüleri ürün deposunun README'sindedir.
