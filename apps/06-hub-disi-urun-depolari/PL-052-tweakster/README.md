# PL-052 · Tweakster

> PluginLabs ailesinin Windows PC hızlandırma uygulaması.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-052` · `tweakster` |
| Kategori | 06 · Bağımsız ürün depoları — PL-051–053 |
| Durum | 01.11.2026: **0.1.0 Windows uygulaması** yayımlandı — [release v0.1.0](https://github.com/timdesigners-pixel/tweakster/releases/tag/v0.1.0) (imzasız önizleme) |
| Hedef platformlar | Windows |
| Dağıtım biçimi | masaüstü uygulaması |
| Geliştirme deposu | [timdesigners-pixel/tweakster](https://github.com/timdesigners-pixel/tweakster) |
| Codex projesi | `PL-052 · Tweakster` — ikinci klasör: PluginLabs |
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

### 0.1.0 (01.11.2026, Claude Code — depo kodundan)

- Genel bakış: işlemci, bellek, disk, başlangıç, temizlenebilir alan, güç planı; yerel kurallarla gerekçeli öneriler.
- Başlangıç programları: Run anahtarları (kullanıcı, tüm kullanıcılar 64/32 bit) ve Başlangıç klasörü; Görev Yöneticisi yöntemiyle (StartupApproved) aç/kapa, komut silinmez; güvenlik/sürücü öğeleri "Kapatmayın".
- 8 geri alınabilir HKCU ince ayarı (önce → sonra önizleme), güç planı geçişi, %TEMP%/çökme dökümü/hata raporu temizliği (karantina, geri al, kalıcı boşalt).
- Geçmiş ve geri al; değişiklik öncesi Windows geri yükleme noktası (UAC yalnız o adımda) + Tweakster'ın kendi geri alma kaydı.
- MyMind (Hub üzerinden): yalnız sayısal özetle öncelikli öneri; onaylı, doğrulanmış, kendiliğinden uygulanmaz.
- Doğrulama: 13 birim testi; Windows runner'ında gerçek HKCU kayıt defteri, StartupApproved ve güç planıyla uygula → doğrula → geri al duman testi. Geri yükleme noktası/UAC CI'da taklit; hız artışı ölçülmedi.

## Teknik bağımlılık ve sınırlar

Depo kuralları (tweakster README): Her ayar değişikliği geri alınabilir olmalı; uygulamadan önce geri yükleme noktası alınır. Yönetici izni yalnız gerektiği adımda istenir. Kabul manifesti: PluginLabs docs/ecosystem-v1/contracts/app-manifest.schema.json (rollback kapısı zorunlu).

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-052-<konu>` veya `claude/PL-052-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
