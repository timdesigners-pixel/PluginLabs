# Devir notu — PL-047…050 · Permission Radar, Offline Aid, Invoice Inbox, Decision Board

**Tarih:** 08.11.2026 · **Bırakan:** Claude Code (zamanlanmış görev) · **Dal:** `claude/optimistic-goodall-jvy598` (main 4bf9be5 üzerine) · **PR:** taslak (bu dal)

## Yapılanlar
- Başlangıç denetimi: `pluginlabs-dagitim` release listesinde PL-040–046 0.1.0 vardı; PL-047–050 kaynakları `main`'de (f3f45be) hazır olduğu ve README'leri "hazır" dediği hâlde **release yoktu**. Hub kataloğunda (`src/catalog.cjs`) ve `registry/projects.json`'da PL-040–050'nin hiçbiri yayımlanmış görünmüyordu.
- PL-047 Permission Radar, PL-048 Offline Aid, PL-049 Invoice Inbox, PL-050 Decision Board yerelde doğrulandı (npm test + Linux xvfb duman testi) ve `pluginlabs-dagitim` iş akışlarıyla Windows'ta yayımlandı:
  | Ürün | Release | Çalıştırma | Taşınabilir exe (indirilip doğrulandı) |
  | --- | --- | --- | --- |
  | Permission Radar | `permission-radar-v0.1.0` | 42463858861 (kaynak 92f1adb) | 81 533 092 bayt · `7fd7efd2…bead1` · MZ |
  | Offline Aid | `offline-aid-v0.1.0` | 42463963204 (kaynak fcaa640) | 81 513 812 bayt · `c62b0cf2…2322` · MZ |
  | Invoice Inbox | `invoice-inbox-v0.1.0` | 42463965530 (kaynak fcaa640) | 81 525 831 bayt · `86d70e2f…6de7` · MZ |
  | Decision Board | `decision-board-v0.1.0` | 42463966730 (kaynak fcaa640) | 81 517 153 bayt · `4c46de51…767b` · MZ |
  Her BUILD-INFO'da `DUMAN TESTİ GEÇTİ … win32 · electron 33.2.1`.
- Düzeltmeler: Decision Board ağırlık seçicisindeki satır içi `style` CSP (`style-src 'self'`) ihlali yüzünden duman testi düşüyordu → `.db-weight-select` sınıfı; `ariaLabel` → `aria-label`. Permission Radar etki düzeyi rozetleri ve Markdown raporu Türkçe karakterli (DÜŞÜK/YÜKSEK/KRİTİK).
- Hub 0.4.27 kataloğu: PL-040–050 (11 uygulama) eklendi; PL-040–046 boyutları dağıtım dosyasından (HTTP Range), hash'leri SHA256SUMS'tan.
- Kayıtlar: `registry/projects.json` (durum + release), `apps/README.md`, `docs/UYGULAMALAR.md`, PL-047–050 README durum satırları, `README.md` (gerçek Hub ekranları `docs/screenshots/release-0.4.27/`), `RELEASE-NOTES.md`.

## Kalanlar
- [ ] PR birleşmesi ve Hub 0.4.27 Windows yayını (`hub-windows.yml`, publish=true; MH-3/MH-8). Hub yayını `main` dışından yapılmadı.
- [ ] Gerçek Windows masaüstünde elle kabul (DPI, klavye, ekran okuyucu) — yalnız runner duman testi var.
- [ ] Windows sürümü olmayan kalan ürünler: PL-005–014 (fikir aşaması; Notion kartları tek özet satırı). Sıra PL-005 Finansal Asistan.

## Alınan kararlar
- Ürün deposu açılmadı; PL-025 modeli sürdü (kaynak PluginLabs `apps/…/app`, derleme `pluginlabs-dagitim`).
- PL-048/049/050 aynı kaynak commit'inden (fcaa640) paralel derlendi; PL-047 ayrı commit'ten (92f1adb).
- Hub'daki "Ürün önizlemesi v0.2.0" (Notion kartı) kayıtları korunur; önceki sürümlerdeki davranışla aynı.

## Değişen dosyalar
- `apps/05-…/PL-047-permission-radar/app/{app.js,src/core.js,docs/screenshots/*}`, `apps/05-…/PL-050-decision-board/app/{app.js,app.css,docs/screenshots/*}`, PL-047–050 `README.md`
- `src/catalog.cjs`, `registry/projects.json`, `apps/README.md`, `docs/UYGULAMALAR.md`, `package.json`, `package-lock.json`, `README.md`, `RELEASE-NOTES.md`, `docs/screenshots/release-0.4.27/*`, `docs/ortak-calisma/AKTIF-ISLER.md`
- `pluginlabs-dagitim`: `claude/{permission-radar,offline-aid,invoice-inbox,decision-board}-v0.1.0` dalları (yalnız iş akışı dosyası)

## Çalıştırılan komutlar ve sonuçları
| Komut | Sonuç |
| --- | --- |
| `npm test` (PL-047/048/049/050) | 10/10 · 10/10 · 11/11 · 11/11 |
| `xvfb-run node tests/desktop-smoke.cjs` (dört uygulama) | Geçti (Linux, electron 33.2.1); PL-050 düzeltmeden önce CSP hatasıyla düşüyordu |
| `pluginlabs-dagitim` iş akışları | 4/4 başarılı (Windows runner) |
| `npm test` (Hub) | 33/33 |
| `xvfb-run npm run test:ui` (Hub) | native + extension UI PASS |

## Test edilmeyenler / riskler
- Gerçek Windows masaüstünde elle deneme yapılmadı; Hub ekranları Linux/Xvfb.
- Hub üzerinden kurulum (indir + hash doğrula + aç) bu oturumda uçtan uca denenmedi; katalog değerleri dağıtım dosyalarıyla eşleştirildi.
- Paketler imzasız (SmartScreen uyarısı).

## Sonraki ajan için ilk adım
- Bu PR birleşince `hub-windows.yml`'i publish=true ile çalıştırın; ardından PL-005 Finansal Asistan için kapsam/MVP (Notion kartı) okunarak PL-025 modeliyle 0.1.0.
