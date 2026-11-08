# Devir notu — PL-044 · Design Token Scout

**Tarih:** 08.11.2026 · **Bırakan:** Claude Code (zamanlanmış görev) · **Dal:** `claude/optimistic-goodall-ma7hov` (PL-043 dalı `claude/optimistic-goodall-b0r0p3` d8c7526 üzerine) · **PR:** taslak (bu dal)

## Yapılanlar
- Design Token Scout 0.1.0 Windows uygulaması (Electron, PL-025 modeli): kaynak `apps/05-gelistirici-ve-profesyonel-araclar/PL-044-design-token-scout/app`. Kabuk PL-043 Access Lens'ten uyarlandı (yalıtılmış sayfa penceresi, onaylar, DPAPI kasası, MyMind loopback istemcisi).
- Tarama penceresi (`desktop/scanner.js`): görünmez, her taramada yeni bellek içi oturum (`tarama-<n>`), sandbox, izin/indirme/yeni pencere reddi, ilk yüklemeden sonra gezinme engeli; yerel dosya/yapıştırmada uzak kaynak engeli; betik kapatma CSP ile.
- Tarama betiği (`desktop/page-scan.js`, yalıtılmış dünya 1044): görünür öğelerden (en çok 5000) renk (rolüyle), yazı, boşluk (margin:auto ortalaması atlanır), köşe, gölge; kullanım sayısı + 3 örnek seçici; `:root` değişkenleri; durum kuralları (`:hover/:focus/...`, değişkenler çözülür); gövde temel stili; renk biçimleme DOM'a eklenmeyen tuvalle. Sayfa değiştirilmez.
- Çekirdek (`src/core.js`): renk ayrıştırma, CIELAB ΔE76 kümeleme (değer = en çok kullanılan üye; uydurma yok), ad önerisi (Lab kroması ile nötr/ton ailesi, L* basamağı, gövde boyutu `md`, gövde ailesi `base`, 4/8 px ızgarası, köşe/gölge ölçekleri, sayfa değişkeni adı korunur), anlamsal takma adlar (metin/zemin gövdeden, kenarlık, vurgu, durum), çapa önerisi (değişken/gövde/başlık), ad doğrulama, kapsama ve tekrar düşüşü, örnek sayfa doğrulaması, DTCG JSON / CSS / Markdown (yalnız onaylı), MyMind isteği (yalnız tür/değer/kullanım/ad) ve yanıt doğrulaması.
- 5 örnek sayfa (`src/fixtures/`): 91 ana değer, 6 yakın renk çifti; 89/91 (%97,8; en düşük sayfa %94,4), 6/6 birleşme.
- `pluginlabs-dagitim` `claude/design-token-scout-v0.1.0` dalında Windows derleme/yayın iş akışı (kaynak PluginLabs@4b38dfc); `design-token-scout-v0.1.0` release'i.
- Kayıtlar: registry, `apps/README.md`, `docs/UYGULAMALAR.md`, ürün README; Hub 0.4.29 kataloğu ve sürüm notu.

## Kalanlar
- [ ] PR zinciri: #90 (PL-040) → #91 (PL-041) → PL-042 (`claude/optimistic-goodall-i341gx`, PR/yayın yok) → #92 (PL-043) → bu PR. Hub sürüm numaraları (0.4.26–0.4.29) PL-042 yayımlanırsa çakışır; birleştirmede yeniden numaralandırın.
- [ ] Hub'ın kendisi (0.4.29) henüz yayımlanmadı: MUST HAVE 8 için PR'lar birleştikten sonra insan onayıyla Hub release'i gerekir.
- [ ] Gerçek web sitelerinde elle kabul (SPA, çerez bannerı, başka alan adından stil sayfaları), Windows DPI.
- [ ] Chrome eklentisi (tarayıcıdaki sayfayı yerinde örnekleme; giriş gerektiren sayfalar), birden çok sayfayı birleştirme, tasarım aracı bağlayıcısı — sonraki faz.

## Alınan kararlar
- Token değeri hiçbir zaman ortalama/yeni renk değildir; kümenin en çok kullanılan üyesidir (Notion: "kopyalama yerine sistem çıkarma").
- Notion "≥%90 kapsama" ölçütü için seyrek ama yapısal değerler (sayfa değişkeni, gövde stili, h1–h6 boyutu) eşik altında da önerilir; aksi hâlde tek kullanımlık başlık boyutu ve gövde zemini kaçıyordu (%89 → %97,8).
- Gri tonlar HSL doygunluğuyla değil Lab kromasıyla (<16) nötr sayılır ("slate" griler mavi adlanmasın diye).
- Dışa aktarma onaysız reddedilir; takma ad yalnız gösterdiği token onaylıysa yazılır.

## Değişen dosyalar
- `apps/05-gelistirici-ve-profesyonel-araclar/PL-044-design-token-scout/app/**` (yeni)
- `apps/05-gelistirici-ve-profesyonel-araclar/PL-044-design-token-scout/README.md`, `apps/README.md`, `docs/UYGULAMALAR.md`, `registry/projects.json`, `docs/ortak-calisma/AKTIF-ISLER.md`
- `src/catalog.cjs`, `package.json`, `package-lock.json`, `README.md`, `RELEASE-NOTES.md` (Hub 0.4.29)

## Çalıştırılan komutlar ve sonuçları
| Komut | Sonuç |
| --- | --- |
| `npm test` (app) | 10/10 geçti (Linux; Windows runner'da da) |
| `xvfb-run node tests/desktop-smoke.cjs docs/screenshots` | DUMAN TESTİ GEÇTİ (Linux, electron 33.2.1; gerçek tarama, yerel test sunucusu, taklit Hub) |
| `npm test` (Hub) | 33/33 geçti |
| `pluginlabs-dagitim` iş akışı | çalıştırma 42427568096 |

## Test edilmeyenler / riskler
- Gerçek internet sayfalarına karşı denenmedi (yalnız yerel test sunucusu ve örnek sayfalar). Kapsama yalnız 5 uydurma örnek sayfada ölçüldü.
- Paketler imzasız (SmartScreen uyarısı).

## Sonraki ajan için ilk adım
- PL-042'nin durumunu denetleyin (dal `claude/optimistic-goodall-i341gx`). Sonraki Windows sürümü olmayan ürün: **PL-045 Context Kit** (bu dalın üzerine).
