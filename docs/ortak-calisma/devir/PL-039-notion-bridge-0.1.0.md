# Devir notu — PL-039 · Notion Bridge

**Tarih:** 07.11.2026 · **Bırakan:** Claude Code (zamanlanmış görev) · **Dal:** `claude/optimistic-goodall-k3dz9d` (PL-038 dalı #86 + güncel `main` üzerine) · **PR:** taslak (bu dal)

## Yapılanlar
- Notion Bridge 0.1.0 Windows uygulaması (Electron, PL-025 modeli): kaynak `apps/04-arastirma-yazma-ve-bilgi-akislari/PL-039-notion-bridge/app`.
- Notion MVP akışı: izinli hedef (kullanıcının dahili entegrasyon anahtarı, DPAPI) → şema okuma (`GET /v1/databases/{id}`) → kural tabanlı alan eşleme → taslak önizleme → onaylı kayıt (`POST /v1/pages`). Tek veritabanı.
- Çekirdek (`src/core.js`): veritabanı kimliği ayrıştırma (yalnız https notion.so/site/com), Notion şema ayrıştırma, tür dönüşümleri, eşleme ("Alan: değer", başlık, bağlantı, tek tarih/e-posta/telefon, tek seçenek, #etiket, Not alanı), şema doğrulaması, Notion gövdesi, parmak izi + başlık/bağlantı anahtarıyla mükerrer tespiti, MyMind isteği (hassas değerler ⟦n⟧; kaynak adresi/başlığı/anahtar gönderilmez) ve yanıt denetimi (şemada olmayan alan/seçenek/tür hatası atılır), Notion CSV/MD.
- Ağ (`desktop/net.js`): Notion'da yalnız üç uç izinli (istemci tarafı beyaz liste), PATCH/DELETE yok, `redirect: error`, 429'da Retry-After (≤10 sn) ile tek yeniden deneme; Hub/yerel model yalnız loopback.
- Ana pencere: Taslaklar / Hedef ve şema / Kayıtlar (Kaydedilen, Mükerrer, Arşiv) / Ölçüler ve ayarlar.
- `pluginlabs-dagitim` `claude/notion-bridge-v0.1.0` dalında Windows derleme/yayın iş akışı (kaynak PluginLabs@ce9f8a8); `notion-bridge-v0.1.0` release'i.
- Kayıtlar: registry, `apps/README.md`, `docs/UYGULAMALAR.md`, ürün README; Hub 0.4.25 kataloğu (`src/catalog.cjs`) ve sürüm notu.
- Güncel `main` (Codex Hub 0.4.21: Leo 0.9.4, MyMind 0.1.2) bu dala birleştirildi; çakışmalar iki tarafın kayıtları korunarak çözüldü, sürüm 0.4.25.

## Kalanlar
- [ ] PR'ların sırayla birleşmesi (#83 → #84 → #85 → #86 → bu dal) ve Hub 0.4.25 Windows yayını (MH-3/MH-8; kullanıcı onayı). `main`'deki Hub 0.4.21 numarası ile yığındaki 0.4.21–0.4.24 çakışıyor; birleşik yayın 0.4.25.
- [ ] Gerçek bir Notion çalışma alanında elle kabul: anahtar, paylaşılmamış veritabanı (404 mesajı), şema okuma, kayıt, başlık sorgusu, 429 davranışı; çok kaynaklı ("data source") veritabanları.
- [ ] Gerçek Windows masaüstünde elle deneme: genel kısayol Ctrl+Alt+N (çakışma), DPI, ekran okuyucu.
- [ ] Chrome eklentisi (sayfadan seçip gönderme → yerel köprü), Pro çoklu şema ve ekip onay akışı — sonraki faz.

## Alınan kararlar
- Ürün deposu açılmadı; kaynak PluginLabs `apps/…/app`, derleme `pluginlabs-dagitim` (PL-025–038 ile aynı model).
- Notion API sürümü `2022-06-28` (sabit); OAuth yerine dahili entegrasyon anahtarı (kullanıcı yalnız paylaştığı veritabanına erişim verir; ayrıcalık yükseltilmez).
- Örnek şemayla Notion'a kayıt yapılmaz (kimlik sahte); yalnız CSV dışa aktarılır.
- "Şema uyumsuz kayıt" ölçüsü = Notion'un 400 ile reddettiği gönderimler; kayıttan önce yerelde yakalananlar ayrı sayılır ("kayıttan önce yakalanan uyumsuz taslak").
- Şemada karşılığı olmayan "X: …" biçimindeki **ilk** satır bilinmeyen alan sayılmaz, başlık adayıdır (ör. "Mevcut kart: tasarım ilkeleri").

## Değişen dosyalar
- `apps/04-arastirma-yazma-ve-bilgi-akislari/PL-039-notion-bridge/app/**` (yeni)
- `apps/04-arastirma-yazma-ve-bilgi-akislari/PL-039-notion-bridge/README.md`, `apps/README.md`, `docs/UYGULAMALAR.md`, `registry/projects.json`, `docs/ortak-calisma/AKTIF-ISLER.md`
- `src/catalog.cjs`, `package.json`, `package-lock.json`, `README.md`, `RELEASE-NOTES.md` (Hub 0.4.25)

## Çalıştırılan komutlar ve sonuçları
| Komut | Sonuç |
| --- | --- |
| `npm test` (app) | 13/13 geçti (Linux; Windows runner'da da) |
| `xvfb-run node tests/desktop-smoke.cjs docs/screenshots` | DUMAN TESTİ GEÇTİ (Linux, electron 33.2.1; taklit Notion API + taklit Hub) |
| `pluginlabs-dagitim` iş akışı | çalıştırma 42383971671 |
| `npm test` (Hub) | 33/33 geçti |

## Test edilmeyenler / riskler
- Gerçek Notion API'ye karşı denenmedi; hata kodları ve yanıt biçimi Notion belgelerine göre taklit edildi.
- Eşleme kural tabanlı; "tahmin" işaretli alanlar kullanıcı kontrolüne bırakılır. Ölçütler yalnız uydurma, elle etiketli 3 örnekte (27 alan) ölçüldü.
- Paketler imzasız (SmartScreen uyarısı).

## Sonraki ajan için ilk adım
- Sıradaki Windows sürümü olmayan ürün: **PL-040 Insight Table**. Bu dalın üzerine çalışın (zincir: #83 → #84 → #85 → #86 → bu PR).
