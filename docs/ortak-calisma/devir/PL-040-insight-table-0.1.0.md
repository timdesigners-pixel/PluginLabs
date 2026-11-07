# Devir notu — PL-040 · Insight Table

**Tarih:** 07.11.2026 · **Bırakan:** Claude Code (zamanlanmış görev) · **Dal:** `claude/optimistic-goodall-0ll2v2` (güncel `main` 7ebd429 üzerine) · **PR:** taslak (bu dal)

## Yapılanlar
- Insight Table 0.1.0 Windows uygulaması (Electron, PL-025 modeli): kaynak `apps/04-arastirma-yazma-ve-bilgi-akislari/PL-040-insight-table/app`.
- Notion MVP akışı: seçili tablo/liste → sütun önizlemesi → veri tipi kontrolü → CSV/JSON; kullanıcının verdiği tek sayfa (pano HTML'i, Ctrl+Alt+T, yapıştırma, .html/.csv/.tsv/.md/.txt). Sayfa indirilmez, site taraması yok.
- Çekirdek (`src/core.js`, bağımlılıksız): HTML ayrıştırıcı (rowspan/colspan, thead/th, çok satırlı başlık, br, varlıklar; script/style ve nav/header/footer/aside listeleri ile iç içe yerleşim tabloları atlanır), ul/ol ("Anahtar: değer" sütunlara), dl; RFC 4180 CSV, ayraç ve başlık tahmini, Markdown tablo; TR/EN sayı (sütun → tablo → ayar kanıt zinciri), para birimi, yüzde, tarih (GG.AA/AA-GG kanıtı, takvim denetimi), evet/hayır, e-posta/bağlantı/telefon; işaretler (tür, tarih, ayraç, birim, eksik, boş işareti, mükerrer, birleştirilmiş); kişisel veri sütunu tanıma + maskele/çıkar/koru, metin içi maskeleme; CSV formül enjeksiyonu koruması + gidiş-dönüş karşılaştırması; JSON (kaynak, sütunlar, satırlar, uyarılar); MyMind isteği (kişisel veri sütunu değerleri ve kaynak adresi/başlık gönderilmez) ve yanıt denetimi (hücre değeri önerileri atılır).
- Ana pencere: Tablolar (liste + sütun önizleme ızgarası, uyarılar, kişisel veri, MyMind) / Arşiv / Ölçüler ve ayarlar.
- `pluginlabs-dagitim` `claude/insight-table-v0.1.0` dalında Windows derleme/yayın iş akışı (kaynak PluginLabs@a697439); `insight-table-v0.1.0` release'i.
- Kayıtlar: registry, `apps/README.md`, `docs/UYGULAMALAR.md`, ürün README; Hub 0.4.26 kataloğu (`src/catalog.cjs`) ve sürüm notu.

## Kalanlar
- [ ] PR birleşmesi ve Hub 0.4.26 Windows yayını (MH-3/MH-8; insan onayı).
- [ ] Gerçek sayfalarda elle kabul: Chrome/Edge'den kopyalanan tablolar (Windows CF_HTML), Wikipedia benzeri karmaşık tablolar, Excel'de CSV açılışı (Türkçe yerel ayar).
- [ ] Gerçek Windows masaüstünde elle deneme: Ctrl+Alt+T çakışması, DPI, ekran okuyucu.
- [ ] Chrome eklentisi (sayfada tablo seçici), Pro toplu temizleme/dönüşüm reçeteleri, Linux/macOS paketleri — sonraki faz.

## Alınan kararlar
- Ürün deposu açılmadı; kaynak PluginLabs `apps/…/app`, derleme `pluginlabs-dagitim` (PL-025–039 ile aynı model).
- Sütun türü eşiği %80; altında metin kalır. Baştaki sıfırlı ve >15 haneli sayılar metin; kişisel veri sütunundaki numaralar sayıya çevrilmez.
- Türüne uymayan hücre varsayılan olarak kaynak metniyle yazılır (ayar: boş). "Hücre doğruluğu" = dışa aktarılan JSON değerinin elle etiketli beklenen değere eşitliği (84 hücre, %100).
- Birleştirilmiş hücreler (rowspan/colspan) kopyalanır ve bilgi işaretiyle gösterilir.
- Genel kısayol Ctrl+Alt+T (Action Inbox Ctrl+Alt+I, Notion Bridge Ctrl+Alt+N kullanıyor).

## Değişen dosyalar
- `apps/04-arastirma-yazma-ve-bilgi-akislari/PL-040-insight-table/app/**` (yeni), `…/PL-040-insight-table/README.md`
- `apps/README.md`, `docs/UYGULAMALAR.md`, `registry/projects.json`, `docs/ortak-calisma/AKTIF-ISLER.md`
- `src/catalog.cjs`, `package.json`, `package-lock.json`, `README.md`, `RELEASE-NOTES.md` (Hub 0.4.26)

## Çalıştırılan komutlar ve sonuçları
| Komut | Sonuç |
| --- | --- |
| `npm test` (app) | 13/13 geçti (Linux; Windows runner'da da) |
| `xvfb-run node tests/desktop-smoke.cjs docs/screenshots` | DUMAN TESTİ GEÇTİ (Linux, electron 33.2.1; taklit Hub/yerel model) |
| `pluginlabs-dagitim` iş akışı | çalıştırma 42399061852 — başarılı (win32, DPAPI kasası etkin) |
| Taşınabilir exe indirildi | SHA-256 846762b4…7603, 81 534 020 bayt, MZ başlığı — SHA256SUMS ile aynı |
| `npm test` (Hub) | 33/33 geçti |

## Test edilmeyenler / riskler
- Hub `npm run test:ui` bu değişiklikte çalıştırılmadı (yalnız katalog verisi değişti).
- Gerçek web sayfalarından kopyalanan pano içeriğiyle denenmedi; Windows panosundaki HTML biçimi Electron `clipboard.readHTML` ile okunur (duman testi Electron panosuna yazıp okur).
- Ölçütler yalnız uydurma örnek tablolarda ölçüldü. Paketler imzasız (SmartScreen uyarısı).

## Sonraki ajan için ilk adım
- Sıradaki Windows sürümü olmayan ürün: **PL-041 Dev Patch Notes**. Bu dalın üzerine çalışın (bu PR birleşmediyse).
