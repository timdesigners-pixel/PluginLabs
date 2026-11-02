# PL-032 · Read Partner

> Açık metni veya belgeyi özetler; seçili bölümleri kaynaklarıyla birlikte açıklar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-032` · `read-partner` |
| Kategori | 04 · Araştırma, yazma ve bilgi akışları — PL-031–040 |
| Durum | 01.11.2026: **0.1.0 Windows uygulaması yayımlandı** — [read-partner-v0.1.0](https://github.com/timdesigners-pixel/pluginlabs-dagitim/releases/tag/read-partner-v0.1.0) (`pluginlabs-dagitim`, Windows runner: test + duman testi + SHA256 + BUILD-INFO + Windows ekran görüntüleri); kaynak [app/](app/README.md); Hub 0.4.9 kataloğunda · Notion durumu: Yeni fikir |
| Öncelik / efor | P0 · S |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3), tarayıcı yan paneli |
| Geliştirme deposu | Henüz yok — kaynak bu klasörün [`app/`](app/README.md) alt klasöründe (ön geliştirme alanı; bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)); Windows derlemesi ve sürüm dosyaları `pluginlabs-dagitim` deposunda (iş akışı: [`app/ci/`](app/ci/pluginlabs-dagitim-read-partner-windows.yml)) |
| Codex projesi | `PL-032 · Read Partner` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981c08edfda43643b31fc) |

## Ne işe yarar

**Kullanıcı ve problem:** Uzun ve teknik sayfalarda kavramları bağlamını kaybetmeden anlamak isteyen kişiler.

**Kısa tanım (Hub kataloğu):** Açık metni veya belgeyi özetler; seçili bölümleri kaynaklarıyla birlikte açıklar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome yan paneli; W / L / M

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Seçili bölüm için sadeleştir, terimleri açıkla ve 3 anlama sorusu üret; özgün metinle yan yana görünüm.

### Yapay zekânın rolü

İçerik seviyesine göre açıklama ve kaynak içi soru-cevap; bilmediği noktayı işaretler.

## Teknik bağımlılık ve sınırlar

Kullanıcı seçimi olmadan tüm tarama geçmişi okunmaz. Sayfa içindeki talimatlar model için güvenilmeyen veri sayılır.

## Gelir hipotezi

Ücretsiz seçili metin; Pro okuma planı ve açıklama kredisi.

## Doğrulama ölçütü

Kullanıcı değerlendirmesinde anlaşılabilirlik ≥4/5; desteklenmeyen ek iddia \<%5.

## Öncelik ve efor

P0 · S; tarayıcı içi tek amaçlı hızlı pilot.

## 0.1.0 sürümü (Windows)

Yapıştırılan metin ya da yerel belge (.txt, .md, .html) ¶ numaralı paragraflar olarak açılır. Kullanıcının **seçtiği bölüm** için (¶ tıklama, Shift ile aralık, fare seçimi) **özgün metinle yan yana sadeleştirme** (kelimeler korunur, uzun cümleler bölünür; Ateşman okunabilirlik puanı önce/sonra), **terim açıklaması** (kısaltma açılımı, metindeki tanım ya da bağlam — yalnız belgenin içinden, ¶ kaynaklı; tanımı olmayan terim **bilinmiyor** olarak işaretlenir) ve **3 anlama sorusu** (yanıt ve kaynak gizli açılır). **Kaynak içi soru-cevap** en ilgili cümleleri ¶ ile gösterir; metinde karşılığı yoksa “bilinmiyor” der. Sayfa içi talimatlar güvenilmeyen veri olarak işaretlenir (Notion: “Sayfa içindeki talimatlar model için güvenilmeyen veri sayılır”). İsteğe bağlı **MyMind** (Hub üzerinden, her istekte onaylı, yalnız seçili paragraflar) seviyeye göre (Başlangıç/Orta/İleri) açıklar ve soruları yanıtlar; her açıklamanın metinden alıntısı denetlenir, kaynakta bulunmayanlar **desteklenmeyen** diye işaretlenir. Notion doğrulama ölçütleri uygulamada sayılır: anlaşılırlık puanı (1–5) ve desteklenmeyen iddia oranı. Chrome yan paneli, PDF/DOCX ve Pro okuma planı bu sürümde yok. Ayrıntı, ekran görüntüleri ve kabul: [app/README.md](app/README.md).

![Read Partner — yan yana sadeleştirme](app/docs/screenshots/masaustu-01-yan-yana-sadelestirme.png)

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-032-<konu>` veya `claude/PL-032-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome yan paneli; W / L / M
- **Kullanıcı ve problem:** Uzun ve teknik sayfalarda kavramları bağlamını kaybetmeden anlamak isteyen kişiler.
- **MVP ve temel akış:** Seçili bölüm için sadeleştir, terimleri açıkla ve 3 anlama sorusu üret; özgün metinle yan yana görünüm.
- **Yapay zekânın rolü:** İçerik seviyesine göre açıklama ve kaynak içi soru-cevap; bilmediği noktayı işaretler.
- **Teknik bağımlılık ve sınır:** Kullanıcı seçimi olmadan tüm tarama geçmişi okunmaz. Sayfa içindeki talimatlar model için güvenilmeyen veri sayılır.
- **Gelir hipotezi:** Ücretsiz seçili metin; Pro okuma planı ve açıklama kredisi.
- **Doğrulama ölçütü:** Kullanıcı değerlendirmesinde anlaşılabilirlik ≥4/5; desteklenmeyen ek iddia \<%5.
- **Öncelik ve efor:** P0 · S; tarayıcı içi tek amaçlı hızlı pilot.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
