# Devir notu — PL-038 · Action Inbox

**Tarih:** 07.11.2026 · **Bırakan:** Claude Code (zamanlanmış görev) · **Dal:** `claude/optimistic-goodall-7pbtt8` (PL-037 dalı #85 + güncel `main` üzerine) · **PR:** taslak (bu dal)

## Yapılanlar
- Action Inbox 0.1.0 Windows uygulaması (Electron, PL-025 modeli): kaynak `apps/04-arastirma-yazma-ve-bilgi-akislari/PL-038-action-inbox/app`.
- Yakalama: Metin yakala penceresi (kaynak türü/başlık/http(s) adresi), Panodan yakala, genel kısayol Ctrl+Alt+I, .txt/.md dosyası. Otomatik kaynak izleme yok (Notion MVP).
- Çekirdek (`src/core.js`): liste satırı/eylem cümlesi ayırma, fiil, son tarih (yakalama gününe göre; yakalamanın başka yerinden gelirse işaretli), materyal, kişi ataması taslağı; yineleme tespiti (benzerlik ≥ %60) ve birleştirme; ölçüler (haftalık kaynaklı tamamlama, yinelenen görev oranı = kabulden sonra birleştirilen / kabul edilen; önlenen yineleme); MD/ICS/CSV; MyMind isteği (kişi adları [KişiN], hassas değerler ⟦n⟧, kaynak adresi gönderilmez) ve yanıt denetimi.
- Ana pencere (İnceleme kuyruğu / Görevler / Ölçüler ve ayarlar) + görev kutusu (widget) penceresi.
- `pluginlabs-dagitim` `claude/action-inbox-v0.1.0` dalında Windows derleme/yayın iş akışı (kaynak PluginLabs@59a539e); `action-inbox-v0.1.0` release'i.
- Kayıtlar: registry, `apps/README.md`, `docs/UYGULAMALAR.md`, ürün README; Hub 0.4.24 kataloğu (`src/catalog.cjs`) ve sürüm notu.

## Kalanlar
- [ ] PR'ların sırayla birleşmesi (#83 → #84 → #85 → bu dal) ve Hub 0.4.24 Windows yayını (MH-3/MH-8; kullanıcı onayı).
- [ ] Gerçek Windows masaüstünde elle deneme: genel kısayol (başka uygulamayla çakışma), widget her zaman üstte, DPI, ekran okuyucu.
- [ ] Chrome eklentisi (sayfada seçili metni sağ tıkla yakalama → yerel köprü) — sonraki faz.
- [ ] Note Master görev şeması / Flow Dock hızlı yakalama ortaklığı (Notion "Öncelik ve efor").

## Alınan kararlar
- Ürün deposu açılmadı (oturum depo açamıyor); kaynak PluginLabs `apps/…/app`, derleme `pluginlabs-dagitim` (PL-025–037 ile aynı model).
- Kişi ataması yalnız kullanıcı "Atamayı onaylıyorum" dediğinde onaylı; aksi her yerde "taslak".
- Toplu kabul olası yinelemeleri bekletir; tek tek "Yine de ayrı görev" gerekir.
- Örnek doğruluk ölçüsü kayıttaki `orig` (yakalama anındaki kural önerisi) üzerinden — kullanıcı düzenlemesi ölçümü bozmaz.

## Değişen dosyalar
- `apps/04-arastirma-yazma-ve-bilgi-akislari/PL-038-action-inbox/app/**` (yeni)
- `apps/04-arastirma-yazma-ve-bilgi-akislari/PL-038-action-inbox/README.md`, `apps/README.md`, `docs/UYGULAMALAR.md`, `registry/projects.json`, `docs/ortak-calisma/AKTIF-ISLER.md`
- `src/catalog.cjs`, `package.json`, `package-lock.json`, `README.md`, `RELEASE-NOTES.md` (Hub 0.4.24)

## Çalıştırılan komutlar ve sonuçları
| Komut | Sonuç |
| --- | --- |
| `npm test` (app) | 10/10 geçti (Linux; Windows runner'da da) |
| `xvfb-run node tests/desktop-smoke.cjs docs/screenshots` | DUMAN TESTİ GEÇTİ (Linux, electron 33.2.1; Windows runner'da da) |
| `pluginlabs-dagitim` iş akışı | çalıştırma 42379528611 |
| `npm test` (Hub) | bkz. PR açıklaması |

## Test edilmeyenler / riskler
- Notion ölçütleri yalnız uydurma, elle etiketli 11 adaylık örnekte ölçüldü; gerçek kullanımda ve gerçek modelle ölçülmedi.
- Ad tanıma kalıp tabanlı: bazı adlar kaçabilir; MyMind isteğinde büyük harfli bazı sözcükler (ör. "Drive'a") gereğinden fazla gizlenebilir (gizlilik yönünde hata).
- Paketler imzasız (SmartScreen uyarısı).

## Sonraki ajan için ilk adım
- Sıradaki Windows sürümü olmayan ürün: **PL-039 Notion Bridge**. Bu dalın üzerine çalışın (zincir: #83 → #84 → #85 → bu PR).
