# PL-051 · Tweakster

> PluginLabs ailesinin Windows PC hızlandırma uygulaması.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-051` · `tweakster` |
| Kategori | 06 · Bağımsız ürün depoları — PL-051–053 |
| Durum | Depo 28.10.2026’da açıldı; kod henüz yok (tweakster README) · PL numarası Codex’ten teyit edilecek |
| Hedef platformlar | Windows |
| Dağıtım biçimi | masaüstü uygulaması |
| Geliştirme deposu | [timdesigners-pixel/tweakster](https://github.com/timdesigners-pixel/tweakster) — *eşleşme teyit edilecek* |
| Codex projesi | `PL-051 · Tweakster` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4088aa13d8f981c4989de0a071b81ef3) |

## Ne işe yarar

**Kısa tanım (kullanıcı beyanı, 28.10.2026):** PluginLabs ailesinin Windows PC hızlandırma uygulaması.

## Hangi platformlar için yayınlanır

**Platform tanımı (Codex proje adından):** Windows masaüstü (Codex: PL · Masaüstü · Tweakster)

- Windows

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kaynak: kullanıcı beyanı (28.10.2026) — “Tweakster (PC hızlandırma uygulaması)”. Ayrıntılı özellik listesi henüz tanımlanmadı; kod yazıldıkça tweakster deposundan tamamlanacak.

## Teknik bağımlılık ve sınırlar

Depo kuralları (tweakster README): Her ayar değişikliği geri alınabilir olmalı; uygulamadan önce geri yükleme noktası alınır. Yönetici izni yalnız gerektiği adımda istenir. Kabul manifesti: PluginLabs docs/ecosystem-v1/contracts/app-manifest.schema.json (rollback kapısı zorunlu).

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-051-<konu>` veya `claude/PL-051-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
