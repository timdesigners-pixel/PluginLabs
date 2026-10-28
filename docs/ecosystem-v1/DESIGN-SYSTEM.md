# PluginLabs Design System v1 — Görünümü koruyan sözleşme
Referans: GitHub main ui/styles.css blob 1bebbfa53c5a9573ae9298f0454b74c3876073c7; 28 Ekim 2026. İlk sözleşmenin kaynak referansıdır; v1 devamında JSON'dan üretilen CSS runtime'a bağlanmıştır.

## Mevcut değerler
Inter Variable yerel latin/latin-ext; Segoe UI, Arial, sans-serif. Body 16px/1.6. Son CSS override: paragraf line-height 1.75, kart açıklaması 14px, nav 14px/gap 10px. Sidebar normal 268px, <=1150px 230px. Eski 248/210px kuralları sonradan eziliyor.
Arka plan #101214; yüzey #191c1f; ikincil #202427; sidebar #151719; çizgi #2a2e31; metin #edf0eb; ikincil #929a9e; vurgu #c1f78a.
Genel radius token 16px; gerçek kart 12px, menü 8px, düğme ve form 7px, dialog 15px. Dialog son width 650px. Bunlar tek radius'a zorlanmaz.
Hero gradient: radial-gradient(ellipse at 85% 60%, #384d32 0%, #232e25 26%, #1d2420 62%). API kartı: radial-gradient(at 100% 0%, #29312a, #191d1e 70%). Aynen korunur.
Mevcut CSS'de no-preference içinde 5 saniyelik sürekli breathe animasyonu var. Yeni “sürekli dekoratif animasyon ekleme” politikasıyla farkı legacy istisna olarak kayıtlıdır; bu çalışmada kaldırılmaz.

## Rol / ürün / platform katmanları
1. Kaynak token: mevcut Hub değerleri. tokens.json portable kaynaktır; `scripts/design-tokens.cjs` Hub için CSS üretir. Ürün override değerleri Hub'a uygulanmaz.
2. Anlamsal rol: background, surface, text, muted, border, accent, focus, feedback. Kanıtı olmayan status rengi icat edilmez.
3. Ürün override: Flow Dock'un belgelenmiş mavi vurgusu #8ab4f8 korunabilir; Hub yeşiline zorlanmaz. Flow Dock #25272b/#363940/#f3f4f6 değerleri kendi şartnamesidir, Hub'dan çıkarılmış değildir.
4. Platform adaptörü: Electron/CSS, WPF ResourceDictionary, web veya eklenti. WPF'e CSS import edilmez; aynı anlamsal roller dönüştürülür. Mobil için ayrı doğrulama gerekir.

## Bileşen sözleşmeleri
| Bileşen | Gerekli durumlar ve davranış |
|---|---|
| Navigation | Seçili/hover/focus/disabled, etiket, klavye erişimi; mevcut Hub yerleşimi korunur |
| Button | Normal/hover/focus/loading/disabled/error; çift işlem engeli |
| Field | Görünür label, yardım, bağlı hata, Türkçe, veri kaybetmeme |
| Card | Başlık/açıklama/platform/kurulum durumu ve açık eylem |
| Dialog | Odak içeride, Escape, açana odak dönüşü, görünür iptal |
| Toast/Progress | Ekran okuyucuya durum, yalnız renkle anlam vermeme |
| App details | Sürüm/platform/izin/hash/yayıncı/uyumluluk/geri alma |

Yeni ürünlerde boşluk ölçeği 4/8/12/16/24/32/48; normal metin 4.5:1, büyük metin ve anlamlı UI sınırları 3:1 kabul hedefidir. Kaynak palet bu hedefleri geçmiş olarak işaretlenmez. Hareket tercihi desteklenir. Hover 120–180ms, panel/modal 180–240ms yeni iş politikasıdır; mevcut 150ms button geçişi korunur.
Koyu varsayılan korunur. Light/System gelecekteki özellik önerisidir; bu tur eklenmiş değildir.

## Kabul kaydı
Her ürün designSystemVersion, source SHA, platform, checkedAt, screenshot yolları, contrast, keyboard, focus, Turkish glyph, reducedMotion, DPI ve state sonuçlarını sunar. Sonuçlar passed/failed/not-run olabilir. Her zorunlu kontrol passed olmadıkça “uyumlu” etiketi verilmez.
1000×700 ve Windows 100/150/200% ölçek; gerçek uygulama ekranları; aynı veriyle önce/sonra karşılaştırma. Runtime token entegrasyonunda kaynak hash'leri değişir; aynı platform/veri/pencere boyutunda hesaplanan stiller, geometri ve ekran görüntüleri karşılaştırılır. Görsel eşdeğerlik kaynak hash eşitliğiyle karıştırılmaz.
