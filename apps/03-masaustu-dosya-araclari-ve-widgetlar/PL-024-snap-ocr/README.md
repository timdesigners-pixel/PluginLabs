# PL-024 · Snap OCR

> Ekranın seçilen bölümündeki yazıları OCR ile metne dönüştürür.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-024` · `snap-ocr` |
| Kategori | 03 · Masaüstü, dosya araçları ve widget’lar — PL-021–030 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS |
| Dağıtım biçimi | masaüstü uygulaması, yüzen balon |
| Geliştirme deposu | [timdesigners-pixel/snap-ocr](https://github.com/timdesigners-pixel/snap-ocr) · Windows **v0.1.0** ([release](https://github.com/timdesigners-pixel/snap-ocr/releases/tag/v0.1.0)) |
| Codex projesi | `PL-024 · Snap OCR` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f98193b5c3ef18528e0c83) |

## Ne işe yarar

**Kullanıcı ve problem:** Görüntüdeki yazıyı yeniden yazarak zaman kaybeden kullanıcılar.

**Kısa tanım (Hub kataloğu):** Ekranın seçilen bölümündeki yazıları OCR ile metne dönüştürür.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M ekran alanı aracı + küçük balon

- Windows
- Linux
- macOS

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kısayol → ekran bölgesi seç → metin çıkar → düzelt/kopyala. İlk sürüm Türkçe/İngilizce ekran görüntüsü.

### Yapay zekânın rolü

OCR sonrası düzen ve tablo satırlarını toparlar; çeviri ayrı isteğe bağlı eylem.

## Teknik bağımlılık ve sınırlar

Ekran yakalama izinleri ve Linux portal/Wayland davranışı; yerel OCR varsayılan. Gizli alan otomatik gönderilmez.

## Gelir hipotezi

Ücretsiz OCR kotası; Pro tablo ve toplu görüntü.

## Doğrulama ölçütü

Temsilî test kümesinde karakter doğruluğu ≥%95; kaynak görüntüye geri bağlantı.

## Öncelik ve efor

P1 · M; işletim sistemi izinleri için ayrı adaptör.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-024-<konu>` veya `claude/PL-024-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** W / L / M ekran alanı aracı + küçük balon
- **Kullanıcı ve problem:** Görüntüdeki yazıyı yeniden yazarak zaman kaybeden kullanıcılar.
- **MVP ve temel akış:** Kısayol → ekran bölgesi seç → metin çıkar → düzelt/kopyala. İlk sürüm Türkçe/İngilizce ekran görüntüsü.
- **Yapay zekânın rolü:** OCR sonrası düzen ve tablo satırlarını toparlar; çeviri ayrı isteğe bağlı eylem.
- **Teknik bağımlılık ve sınır:** Ekran yakalama izinleri ve Linux portal/Wayland davranışı; yerel OCR varsayılan. Gizli alan otomatik gönderilmez.
- **Gelir hipotezi:** Ücretsiz OCR kotası; Pro tablo ve toplu görüntü.
- **Doğrulama ölçütü:** Temsilî test kümesinde karakter doğruluğu ≥%95; kaynak görüntüye geri bağlantı.
- **Öncelik ve efor:** P1 · M; işletim sistemi izinleri için ayrı adaptör.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
