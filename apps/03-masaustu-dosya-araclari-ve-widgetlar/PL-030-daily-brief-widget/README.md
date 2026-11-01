# PL-030 · Daily Brief Widget

> Takvim, görev ve seçilen kaynaklardan günlük bir özet hazırlayıp widget üzerinde gösterir.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-030` · `daily-brief-widget` |
| Kategori | 03 · Masaüstü, dosya araçları ve widget’lar — PL-021–030 |
| Durum | 01.11.2026: **0.1.0 Windows uygulaması yayımlandı** — [daily-brief-widget-v0.1.0](https://github.com/timdesigners-pixel/pluginlabs-dagitim/releases/tag/daily-brief-widget-v0.1.0) (`pluginlabs-dagitim`, Windows runner: test + duman testi + SHA256 + BUILD-INFO + Windows ekran görüntüleri); kaynak [app/](app/README.md); Hub 0.4.9 kataloğunda · Notion durumu: Yeni fikir · Xtreme dashboard notlarından türetildi |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS |
| Dağıtım biçimi | masaüstü uygulaması, widget |
| Geliştirme deposu | Henüz yok — kaynak bu klasörün [`app/`](app/README.md) alt klasöründe (ön geliştirme alanı; bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)); Windows derlemesi ve sürüm dosyaları `pluginlabs-dagitim` deposunda (iş akışı: [`app/ci/`](app/ci/pluginlabs-dagitim-daily-brief-widget-windows.yml)) |
| Codex projesi | `PL-030 · Daily Brief Widget` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f98193b5c3ef18528e0c83) |

## Ne işe yarar

**Kullanıcı ve problem:** Güne başlarken takvim, görev ve yaklaşan ödemeyi ayrı yerlerden kontrol eden kişiler.

**Kısa tanım (Hub kataloğu):** Takvim, görev ve seçilen kaynaklardan günlük bir özet hazırlayıp widget üzerinde gösterir.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M widget; bağlı takvim/görev sağlayıcıları

- Windows
- Linux
- macOS

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kullanıcının seçtiği kaynaklardan bugün görünümü; önce yerel görev + izinli takvim. Veri zamanı ve kaynak bağlantısı görünür.

### Yapay zekânın rolü

Günü kısa plana dönüştürür; çakışmaları öneri olarak gösterir, takvimi otomatik değiştirmez.

## Teknik bağımlılık ve sınırlar

OAuth kapsamları ve kaynak yenileme süreleri; hassas başlıkları gizleme modu. Sağlık/finans verisi ilk sürüm dışında.

## Gelir hipotezi

Ücretsiz tek kaynak; Pro çoklu kaynak ve kişisel briefing.

## Doğrulama ölçütü

Sabah özeti okuma ≥%60; yanlış/eskimiş etkinlik oranı \<%1.

## Öncelik ve efor

P1 · M; Xtreme bağımsız ürün olarak taşınmaz, bu dar modül yeniden kullanılır.

## 0.1.0 sürümü (Windows)

Yerel görevler + eklediğiniz takvimlerden (yerel etkinlik, `.ics` dosyası, Google/Outlook gizli iCal adresi; **yalnız okuma**) bugün görünümü ve her zaman üstte, sürüklenebilir **widget**. Etkinlik ve saatli görev çakışmaları yalnız **öneri** olarak gösterilir; takvim değiştirilmez (Notion: "takvimi otomatik değiştirmez"). Görevler çalışma saatlerindeki boş aralıklara kural tabanlı **kısa plan** olarak yerleştirilir; isteğe bağlı MyMind planı Hub üzerinden, onaylı ve veri azaltılmış (hassas başlıklar her zaman "Özel …"). **Hassas başlık gizleme modu**, her kaynağın **veri zamanı ve bağlantısı** (eskimiş veri işaretlenir), sabah bildirimi ve Notion doğrulama ölçütleri (sabah özeti okuma oranı, yanlış/eskimiş etkinlik oranı). OAuth hesap girişi ve sağlık/finans kaynakları bu sürümde yok. Ayrıntı, ekran görüntüleri ve kabul: [app/README.md](app/README.md).

![Daily Brief Widget — bugün görünümü](app/docs/screenshots/masaustu-01-bugun.png)

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-030-<konu>` veya `claude/PL-030-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir · Xtreme dashboard notlarından türetildi
- **Platform:** W / L / M widget; bağlı takvim/görev sağlayıcıları
- **Kullanıcı ve problem:** Güne başlarken takvim, görev ve yaklaşan ödemeyi ayrı yerlerden kontrol eden kişiler.
- **MVP ve temel akış:** Kullanıcının seçtiği kaynaklardan bugün görünümü; önce yerel görev + izinli takvim. Veri zamanı ve kaynak bağlantısı görünür.
- **Yapay zekânın rolü:** Günü kısa plana dönüştürür; çakışmaları öneri olarak gösterir, takvimi otomatik değiştirmez.
- **Teknik bağımlılık ve sınır:** OAuth kapsamları ve kaynak yenileme süreleri; hassas başlıkları gizleme modu. Sağlık/finans verisi ilk sürüm dışında.
- **Gelir hipotezi:** Ücretsiz tek kaynak; Pro çoklu kaynak ve kişisel briefing.
- **Doğrulama ölçütü:** Sabah özeti okuma ≥%60; yanlış/eskimiş etkinlik oranı \<%1.
- **Öncelik ve efor:** P1 · M; Xtreme bağımsız ürün olarak taşınmaz, bu dar modül yeniden kullanılır.

## Taslak kaynağı

PL-030, mevcut dashboard fikrinin daraltılmış ürün önerisidir: <mention url="https://app.notion.com/p/32c8aa13d8f98038b4b6e2420edbfa29" />

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
