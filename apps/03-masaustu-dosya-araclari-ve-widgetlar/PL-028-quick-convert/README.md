# PL-028 · Quick Convert

> Desteklenen dosyaları sürükle-bırak ile farklı biçimlere dönüştürür.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-028` · `quick-convert` |
| Kategori | 03 · Masaüstü, dosya araçları ve widget’lar — PL-021–030 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS |
| Dağıtım biçimi | masaüstü uygulaması, widget |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-028 · Quick Convert` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f98193b5c3ef18528e0c83) |

## Ne işe yarar

**Kullanıcı ve problem:** Günlük görsel/metin/dosya biçimi dönüşümlerini farklı sitelerde yapan kişiler.

**Kısa tanım (Hub kataloğu):** Desteklenen dosyaları sürükle-bırak ile farklı biçimlere dönüştürür.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M dosya bırakma widget’ı

- Windows
- Linux
- macOS

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Dosyayı bırak, desteklenen dönüşümü seç, sonucu yeni dosyaya kaydet; kaynak korunur. İlk sürüm görüntü boyutu/format + metin encoding.

### Yapay zekânın rolü

İhtiyaç cümlesinden doğru dönüşüm ayarını önerir; gerçek dönüştürme deterministik motorlarda.

## Teknik bağımlılık ve sınırlar

Codec ve biçim lisansları, yürütülebilir içerik ve bozuk dosya kontrolleri. Desteklenmeyen format açıkça belirtilir.

## Gelir hipotezi

Tek seferlik çevrimdışı lisans; Pro toplu kuyruk.

## Doğrulama ölçütü

Desteklenen fixture’larda veri kaybı/çökme sıfır; çıktı boyutu ve kalitesi gösterilir.

## Öncelik ve efor

P1 · M; buluta yükleme gerektirmeyen temel araç.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-028-<konu>` veya `claude/PL-028-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** W / L / M dosya bırakma widget’ı
- **Kullanıcı ve problem:** Günlük görsel/metin/dosya biçimi dönüşümlerini farklı sitelerde yapan kişiler.
- **MVP ve temel akış:** Dosyayı bırak, desteklenen dönüşümü seç, sonucu yeni dosyaya kaydet; kaynak korunur. İlk sürüm görüntü boyutu/format + metin encoding.
- **Yapay zekânın rolü:** İhtiyaç cümlesinden doğru dönüşüm ayarını önerir; gerçek dönüştürme deterministik motorlarda.
- **Teknik bağımlılık ve sınır:** Codec ve biçim lisansları, yürütülebilir içerik ve bozuk dosya kontrolleri. Desteklenmeyen format açıkça belirtilir.
- **Gelir hipotezi:** Tek seferlik çevrimdışı lisans; Pro toplu kuyruk.
- **Doğrulama ölçütü:** Desteklenen fixture’larda veri kaybı/çökme sıfır; çıktı boyutu ve kalitesi gösterilir.
- **Öncelik ve efor:** P1 · M; buluta yükleme gerektirmeyen temel araç.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
