# Devir notu — PL-043 · Access Lens

**Tarih:** 07.11.2026 · **Bırakan:** Claude Code (zamanlanmış görev) · **Dal:** `claude/optimistic-goodall-b0r0p3` (PL-042 dalı `claude/optimistic-goodall-i341gx` ee81247 üzerine) · **PR:** #92 (taslak)

## Yapılanlar
- Access Lens 0.1.0 Windows uygulaması (Electron, PL-025 modeli): kaynak `apps/05-gelistirici-ve-profesyonel-araclar/PL-043-access-lens/app`.
- Denetim penceresi (`desktop/auditor.js`): görünmez (offscreen), her denetimde yeni bellek içi oturum (`denetim-<n>`), sandbox, izin/indirme/yeni pencere reddi, ilk yüklemeden sonra gezinme engeli; yerel dosya/yapıştırmada uzak kaynak engeli (ayarla açılır); "sayfa betikleri kapalı" = CSP `script-src 'none'` (yanıt başlığı ya da geçici kopyaya meta).
- Kural motoru axe-core 4.14.0 (MPL-2.0, pakete dahil) yalıtılmış dünyada (`executeJavaScriptInIsolatedWorld`, dünya 1043); `desktop/page-audit.js` odak sırası, başlık/bölge yapısı ve fixture `data-beklenen` işaretlerini de toplar; benzersiz seçici üretir.
- Çekirdek (`src/core.js`): motor çıktısı → Türkçe bulgu (önem, WCAG ölçütü/düzeyi/sürümü, en iyi uygulama), manuel kontrol ayrı, HTML parçasında kişisel veri maskeleme, özet, yeniden denetim farkı, odak sırası uyarıları, fixture doğrulaması (doğru bulgu / beklenmeyen / kaçırılan, kritik-ciddi yanlış olumlu oranı), Markdown/JSON/CSV rapor (formül koruması, uyarı + elle kontrol listesi), MyMind isteği (adres yok, maskeli) ve yanıt denetimi (uyumluluk/sertifika/puan iddiası cümleleri atılır).
- 3 fixture (`src/fixtures/`): 17 bilinen sorun; axe-core ile 17/17 doğru, 0 beklenmeyen bulgu.
- `pluginlabs-dagitim` `claude/access-lens-v0.1.0` dalında Windows derleme/yayın iş akışı (kaynak PluginLabs@7e8fe75); `access-lens-v0.1.0` release'i.
- Kayıtlar: registry, `apps/README.md`, `docs/UYGULAMALAR.md`, ürün README; Hub 0.4.28 kataloğu ve sürüm notu.

## Kalanlar
- [ ] PR zinciri: #90 (PL-040) → #91 (PL-041) → PL-042 (`claude/optimistic-goodall-i341gx`, 19:58'den beri açık, PR/yayın yok) → #92. PL-042 yayımlanırsa Hub sürüm numarası (0.4.28) çakışır; birleştirmede yeniden numaralandırın.
- [ ] Gerçek web sitelerinde elle kabul (SPA'lar, çerez bannerları, `alert()` kullanan sayfalar — görünmez pencerede engelleyebilir; 30/120 sn zaman aşımı var), Windows DPI, ekran okuyucu.
- [ ] Chrome eklentisi (tarayıcıdaki sayfayı yerinde denetleme; giriş gerektiren sayfalar için), Pro rapor geçmişi/ekip takibi — sonraki faz.

## Alınan kararlar
- Kural motoru olarak kendi kural kümesi yerine axe-core (Notion: "standart sürümü ve kural motoru çıktısı görünür"); sürüm sabit 4.14.0.
- `webPreferences.javascript=false` yalıtılmış dünyayı da durdurduğu için kullanılmadı; betik kapatma CSP ile.
- Aynı bölümün yeniden kullanımı (`clearStorageData`) ikinci denetimde takıldığı ve hemen `destroy()` sonraki yüklemeyi ERR_FAILED ile bozduğu için: her denetimde yeni bölüm + önceki pencerenin düzgün kapanmasını bekleme.
- Puan üretilmez; rapor ve arayüzde "sertifika değildir" uyarısı sabit.
- Bu çalıştırma eski `main`'den başladığı için önce PL-040'ı yineledi (fa68448; yayımlanmadı, atıldı). Sonraki çalıştırmalar işe başlamadan açık PR'ları ve `optimistic-goodall-*` dallarını denetlemeli.

## Değişen dosyalar
- `apps/05-gelistirici-ve-profesyonel-araclar/PL-043-access-lens/app/**` (yeni)
- `apps/05-gelistirici-ve-profesyonel-araclar/PL-043-access-lens/README.md`, `apps/README.md`, `docs/UYGULAMALAR.md`, `registry/projects.json`, `docs/ortak-calisma/AKTIF-ISLER.md`
- `src/catalog.cjs`, `package.json`, `package-lock.json`, `README.md`, `RELEASE-NOTES.md` (Hub 0.4.28)

## Çalıştırılan komutlar ve sonuçları
| Komut | Sonuç |
| --- | --- |
| `npm test` (app) | 9/9 geçti (Linux; Windows runner'da da) |
| `xvfb-run node tests/desktop-smoke.cjs docs/screenshots` | DUMAN TESTİ GEÇTİ (Linux, electron 33.2.1; gerçek axe-core denetimi, yerel test sunucusu, taklit Hub) |
| `electron-builder --linux dir` | app.asar içinde axe-core, page-audit.js ve fixture'lar doğrulandı (yerel paketleme denemesi; yayımlanmadı) |
| `pluginlabs-dagitim` iş akışı | çalıştırma 42424984184 |

## Test edilmeyenler / riskler
- Gerçek internet sayfalarına karşı denenmedi (yalnız yerel test sunucusu ve fixture'lar). Ölçütler yalnız 3 uydurma fixture'da.
- Paketler imzasız (SmartScreen uyarısı).

## Sonraki ajan için ilk adım
- PL-042'nin durumunu denetleyin (dal `claude/optimistic-goodall-i341gx`); bitmemişse sahipliği devralmadan önce o çalıştırmanın gerçekten durduğunu doğrulayın. Sonraki Windows sürümü olmayan ürün: **PL-044 Design Token Scout** (bu dalın üzerine).
