# PL-051 · Extension Manager / Eklenti Yöneticisi

> Eklenti yöneticisi (Chrome eklentisi).

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-051` · `extension-manager` |
| Kategori | 06 · Bağımsız ürün depoları — PL-051–053 |
| Durum | 01.11.2026: **1.1.0 Windows uygulaması + Chrome eklentisi** yayımlandı — [release v1.1.0](https://github.com/timdesigners-pixel/extension-manager/releases/tag/v1.1.0) (imzasız önizleme) |
| Hedef platformlar | Windows, Chrome |
| Dağıtım biçimi | masaüstü uygulaması (Windows), Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | [timdesigners-pixel/extension-manager](https://github.com/timdesigners-pixel/extension-manager) |
| Codex projesi | `PL-051 · Extension Manager / Eklenti Yöneticisi` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4088aa13d8f981c4989de0a071b81ef3) |

## Ne işe yarar

**Kısa tanım (kullanıcı beyanı, 28.10.2026):** Eklenti yöneticisi (Chrome eklentisi).

## Hangi platformlar için yayınlanır

**Platform tanımı (Codex proje adından):** Chrome eklentisi (Codex: PL · Eklenti · Extension Manager)

- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kaynak: kullanıcı beyanı (28.10.2026) — “Extension Manager / Eklenti Yöneticisi (Chrome eklentisi)”. Ayrıntılı özellik listesi extension-manager deposundan tamamlanacak.

### 1.1.0 (01.11.2026, Claude Code — depo kodundan)

- Windows uygulaması: Chrome, Edge, Brave, Vivaldi ve Chromium'un tüm profillerindeki eklentiler tek listede (tarayıcı dosyaları yalnız okunur; hesap e-postası okunmaz).
- Gerekçeli izin riski ("Neden bu risk seviyesi?"), süzgeçler (açık/kapalı, yüksek risk, mağaza dışı, birden çok profilde, Notion, Manifest V2), `#etiket` araması.
- Kopyalar (aynı eklenti birden çok profilde, sürüm farkı) ve aynı ad + farklı kimlik (taklit olabilir).
- Anlık görüntüye göre değişiklikler: eklenen, kaldırılan, güncellenen, açılıp kapatılan, yeni izin alan.
- Not/etiket; "Tarayıcıda yönet" (doğru profilde eklenti sayfası — açma/kapatma/kaldırma orada, çünkü Chrome tercihleri imzalı); CSV/JSON/kurulum listesi.
- MyMind (Hub üzerinden): onaylı, veri azaltılmış (yol/profil/site/kimlik/not gönderilmez), doğrulanmış gözden geçirme önerisi.
- Chrome eklentisi (1.0.0 kodu) `extension/` klasörüne taşındı; release'te zip.
- Doğrulama: 19 birim testi; Linux xvfb ve Windows runner'ında gerçek Electron duman testi (örnek profil ağacı + Windows'ta runner'ın gerçek tarayıcı klasörleri). Eklentili gerçek kullanıcı profili, DPI ve ekran okuyucu elle denenmedi.

## Teknik bağımlılık ve sınırlar

PluginLabs Hub içindeki “Eklenti yöneticisi” ekranı ve Hub Tarayıcı Uzantısı (Browser Bridge) ile aynı ürün değildir; ayrı tutulur.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-051-<konu>` veya `claude/PL-051-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
