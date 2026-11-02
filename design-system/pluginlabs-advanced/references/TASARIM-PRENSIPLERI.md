# PluginLabs Advanced — Tasarım Prensipleri

> **Sürüm:** 2.0.0 · **Tarih:** 01.11.2026 · **Kapsam:** PluginLabs Hub ve altındaki tüm masaüstü uygulamaları, tarayıcı eklentileri ve web yüzeyleri (Leo Helper, Mind Palace, Design Replicator, Mutfak Atölyesi, Flow Dock, Tweakster, Extension Manager, MyMind, The Ultimate Scrapper, MyWishlist)
> **Katmanlar:** Temel katman (PLC-001…079) + Advanced masaüstü katmanı (PLA-001…102) · **Toplam:** 181 komponent
> **Ortak kaynak:** Bu dosya Claude Code ve Codex tarafından aynı şekilde okunur. İki ajan da aynı kuralları uygular; çelişki durumunda bu dosya kazanır.

---

## 0. Altın Kural — Mevcut Tasarıma Dokunma

PluginLabs Advanced bir **katmandır, yeniden boyama değildir.**

| Kural | Neden |
|---|---|
| Hiçbir global reset, `*`, `body`, `html`, `button` gibi element seçici yazılmaz | Mevcut uygulamaların görünümü bozulmaz |
| Tüm tokenlar `--pl-` önekli, tüm sınıflar `pl-` önekli | Çakışma imkânsız hale gelir |
| Sistem yalnız `[data-pl]` kapsayıcısı içinde devreye girer | Opt-in: hangi ekranın taşınacağına geliştirici karar verir |
| Tüm kurallar `@layer pl` içinde; tokenlar `:where()` ile sıfır özgüllükte | Katmansız uygulama CSS'i özgüllükten bağımsız her zaman kazanır |
| Yükleme sırası sabittir: `pl-tokens.css` → `pl-components.css` → `pl-advanced.css` | Advanced sınıfları temel sınıfları genişletir, ezmez |
| Mevcut bir ekran **taşınırken** önce ekran görüntüsü alınır, sonra yeni sürüm yan yana karşılaştırılır | Görsel gerileme yakalanır |
| Silme yok, arşivleme var: eski stil dosyaları `_arsiv/GG.AA.YYYY/` altına taşınır | Geri dönüş garantisi |

---

## 1. Tasarım Karakteri

**"Gece atölyesi, masaüstü ölçeğinde."** PluginLabs; koyu, sakin, yoğun bilgi taşıyan ama ferah hissettiren bir araç ailesidir. Advanced katman bu karakteri tam ekran masaüstü uygulamalarına taşır: yüzen pencereler, cam katmanlar, komuta ekranları, medya vitrinleri ve kokpit göstergeleri.

1. **Önce içerik.** Krom (çerçeve, kenarlık, gölge) en aza iner; veri, kod, görsel ve sahne öne çıkar.
2. **Tek aksan.** Her ekranda yalnız bir vurgu rengi baskındır: ürünün aksanı ya da yüzeyin aksanı (HUD camgöbeği, Neon limon, Kokpit mavi). Marka gradyanı yalnız Hub kimliğinde, onboarding'de ve "Pro" anlarında kullanılır.
3. **Derinlik = ton.** Katmanlar `bg-0 → bg-4` arası ton farkıyla ayrılır. Gölge yalnız *yüzen* öğelerde (pencere, menü, modal, toast, tooltip, sahne üstü kartlar).
4. **Mono = makine dili.** Etiketler, kısayollar, sürüm numaraları, sayılar, kod, zaman kodu ve durum kodları mono ve harf aralıklıdır. HUD rakamları Rajdhani ile yazılır. İnsan dili sans.
5. **Tek kahraman.** Her ekranda tek bir odak alanı vardır: sahne (3B plan, kamera), kahraman (vitrin), grafik (genel bakış) ya da zaman çizelgesi. Diğer her şey onu çevreler.
6. **Klavye birinci sınıf vatandaştır.** Her eylemin bir kısayolu, her listenin ok tuşu gezinmesi, her ekranın ⌘K komut paleti vardır.
7. **Durum her zaman görünür.** Bağlantı, senkron, kayıt, canlı yayın, AI işleme durumları renk + ikon + metin üçlüsüyle gösterilir; yalnız renge güvenilmez.
8. **Geri alınabilirlik.** Yıkıcı eylemler "Arşivle" diye adlandırılır, onay ister ve toast içinde "Geri al" sunar.

---

## 2. Renk

### 2.1 Zemin katmanları

| Token | Karanlık | Açık | Kullanım |
|---|---|---|---|
| `--pl-bg-0` | `#090d18` | `#f4f6fb` | Uygulama zemini, pencere |
| `--pl-bg-1` | `#0e1322` | `#ffffff` | Kenar çubuğu, ana panel |
| `--pl-bg-2` | `#141a2c` | `#ffffff` | Kart, tablo satırı |
| `--pl-bg-3` | `#1b2238` | `#eef1f7` | Hover, input zemini |
| `--pl-bg-4` | `#232b45` | `#e3e8f2` | Aktif / seçili |

### 2.2 Metin

| Token | Karanlık | Kullanım | Kontrast (bg-1 üzerinde) |
|---|---|---|---|
| `--pl-fg-1` | `#f2f5fb` | Başlık, birincil değer | 16.9:1 |
| `--pl-fg-2` | `#b6c0d4` | Gövde metni | 10.1:1 |
| `--pl-fg-3` | `#7b869c` | Yardımcı metin, etiket | 5.1:1 (AA) |
| `--pl-fg-4` | `#566078` | Pasif / devre dışı | yalnız dekoratif |
| `--pl-on-media` | `#ffffff` | Görsel / karartma üstü metin | temadan bağımsız |

### 2.3 Marka ve anlamsal renkler

| Rol | Token | Değer | Kural |
|---|---|---|---|
| Marka (Iris) | `--pl-brand` | `#7c6cff` | Hub aksanı, logo |
| Marka 2 (Cyan) | `--pl-brand-2` | `#22d3ee` | Gradyan ucu, bağlantı |
| Altın | `--pl-gold` | `#f0b429` | **Yalnız** Pro rozeti, tutar/fiyat vurgusu, MyMind |
| Başarı | `--pl-success` | `#34d399` | Kuruldu, bağlı, fiyat düştü |
| Uyarı | `--pl-warning` | `#fbbf24` | Güncelleme var, limit yakın |
| Tehlike | `--pl-danger` | `#f87171` | Hata, bağlantı koptu, fiyat arttı |
| Bilgi | `--pl-info` | `#60a5fa` | Nötr bildirim |
| Canlı | `--pl-live` | `#ff3b5c` | **Yalnız** CANLI / REC göstergesi |

Her anlamsal rengin bir `-soft` (%14 opaklık) eşi vardır: rozet ve callout zemini için.

### 2.4 Ürün aksanları

Ürün kimliği **yalnız** `data-pl-product` niteliğiyle verilir; komponentler `--pl-accent` okur, sabit renk yazmaz. Aksanın türevleri (`--pl-accent-soft`, `--pl-accent-line`, `--pl-glow*`, `--pl-grad-accent`) aksanı değiştiren her kapsayıcıda otomatik yeniden hesaplanır.

| Ürün | `data-pl-product` | Aksan | Platform |
|---|---|---|---|
| PluginLabs Hub | `hub` | `#7c6cff` Iris | Masaüstü |
| Leo Helper | `leo` | `#22d3ee` Cyan | Eklenti |
| Mind Palace | `mindpalace` | `#a78bfa` Lavanta | Eklenti / Masaüstü |
| Design Replicator | `replicator` | `#f472b6` Pembe | Eklenti |
| Mutfak Atölyesi | `mutfak` | `#fb923c` Turuncu | Eklenti / Web |
| Flow Dock | `flowdock` | `#2dd4bf` Teal | Masaüstü |
| Tweakster | `tweakster` | `#a3e635` Limon | Masaüstü |
| Extension Manager | `extman` | `#60a5fa` Mavi | Eklenti |
| MyMind (ortak AI) | `mymind` | `#f0b429` Altın | Servis / tüm ürünler |
| The Ultimate Scrapper | `scrapper` | `#f87171` Mercan | Eklenti |
| MyWishlist (PL-054) | `wishlist` | `#fb7185` Gül | Eklenti |

**Kurallar**
- Aksan; birincil buton, aktif sekme/ray öğesi, odak halkası, seçili satır, ilerleme, oynatma kafası dışındaki seçim çerçeveleri ve logo karosunda kullanılır. Başka yerde kullanılmaz.
- Aksan rengi büyük metin zemini olarak kullanılmaz. İstisna: ekranda tek olan "vurgu kartı" (PLA-023 Neon Vurgu, PLA-081 Genel Bakış) — metni `--pl-fg-on-accent`.
- Anlamsal renkler aksanla yarışmaz: başarı durumları her zaman ikon + metin taşır.

### 2.5 Veri görselleştirme paleti

| Sıra | Token | Değer | Not |
|---|---|---|---|
| 1 | `--pl-viz-1` | `#7c6cff` | Birincil seri |
| 2 | `--pl-viz-2` | `#22d3ee` | |
| 3 | `--pl-viz-3` | `#f472b6` | |
| 4 | `--pl-viz-4` | `#fbbf24` | |
| 5 | `--pl-viz-5` | `#34d399` | |
| 6 | `--pl-viz-6` | `#fb923c` | |
| 7 | `--pl-viz-7` | `#60a5fa` | |
| 8 | `--pl-viz-8` | `#a3e635` | |
| ızgara | `--pl-viz-grid` | `rgb(255 255 255 / .06)` | Soft yüzeyde koyu |

- Sıra sabittir; seri sayısı 5'i geçerse "Diğer" grubuna toplanır.
- Kategori renkleri (oda, proje, takım) aynı paletten gelir ve kod içinde `--c` değişkeniyle verilir: `style="--c:var(--pl-viz-3)"`.
- Ayırt edilmesi gereken iki seri yalnız ton değil açıklık farkı da taşır (1 ↔ 4, 2 ↔ 3).

### 2.6 Gradyan ve medya yer tutucuları

| Token | Kullanım |
|---|---|
| `--pl-grad-aurora` | Cam yüzeyin arkasındaki zemin, onboarding |
| `--pl-grad-iris` · `--pl-grad-sunset` · `--pl-grad-ocean` · `--pl-grad-ember` · `--pl-grad-lime` · `--pl-grad-gold` | Kampanya kartı, sıcaklık karosu, kapak/avatar yer tutucu |
| `--pl-scrim-bottom` · `--pl-scrim-left` | Görsel üstü metin için karartma (her zaman birlikte `--pl-on-media`) |
| `--pl-media-1…6` | Gerçek görsel yokken poster/sahne yer tutucu radyal gradyanlar |

Gradyan bir **zemin**dir; metin, kenarlık ya da ikon rengi olarak kullanılmaz (tek istisna: logo kelime işareti).

---

## 3. Yüzey Temaları — `data-pl-surface`

Yüzey, tema (`data-pl-theme`) ve aksan (`data-pl-product`) ile birleşebilen üçüncü eksendir. Zemin, çizgi, metin ve gerekiyorsa aksanı birlikte değiştirir.

| Kod | Karakter | Ne zaman | Aksan |
|---|---|---|---|
| *(yok)* | Gece atölyesi koyu zemin | Varsayılan tüm ekranlar | Ürün aksanı |
| `glass` | Buzlu cam katmanlar | Renkli/fotoğraflı zemin üzerinde gezinme, kat planı, medya | Ürün aksanı |
| `hud` | Siyah-mavi zemin, camgöbeği çizgi, ızgara doku | Komuta merkezi, IoT/fabrika, güvenlik, sağlık monitörü | `--pl-hud` sabit |
| `neon` | Yüksek kontrastlı koyu zemin | Canlı skor, turnuva, oyun, gerçek zamanlı yarış | `--pl-neon` sabit |
| `soft` | Açık pastel, büyük köşeler, yumuşak gölge | İK, klinik, CRM, tüketici panelleri (`data-pl-theme="light"` ile) | Ürün aksanı |
| `cockpit` | Saf siyah, mavi yaylar | Araç HMI, drone yer istasyonu, cihaz kumandası | `--pl-hmi-arc` sabit |

**Kurallar**
- Bir pencerede tek yüzey. Yüzeyler iç içe geçmez; tek istisna `glass` panelin `soft` ya da gradyan zemin üzerinde durmasıdır.
- `glass` her zaman arkasında görsel veya gradyan olan bir alanda kullanılır; düz zeminde cam efekti anlamsızdır.
- `hud`, `neon`, `cockpit` kendi koyu metin değerlerini zorlar; açık tema altında da koyu kalır.

```html
<div data-pl data-pl-theme="dark" data-pl-surface="hud" data-pl-product="flowdock" lang="tr"> … </div>
<div data-pl data-pl-theme="light" data-pl-surface="soft" data-pl-product="hub" lang="tr"> … </div>
```

---

## 4. Tipografi

| Rol | Font | Boyut / satır | Ağırlık | Not |
|---|---|---|---|---|
| Display XL | Inter | 64 / 0.9 | 300–700 | Büyük sayı üçlüsü, yaşamsal değer (`--pl-text-6xl`) |
| Display | Inter | 36–48 / 1.1 | 700 | Onboarding, kahraman, boş durum başlığı |
| H1 | Inter | 28 / 1.2 | 700 | Sayfa başlığı |
| H2 | Inter | 22 / 1.25 | 600 | Bölüm başlığı |
| H3 | Inter | 16–18 / 1.3 | 600 | Kart başlığı |
| Gövde | Inter | 14 / 1.5 | 400 | Varsayılan |
| Küçük | Inter | 13 / 1.45 | 400 | Yardımcı metin |
| Etiket | JetBrains Mono | 11 / 1.3, `letter-spacing: .08em`, BÜYÜK HARF | 500 | Bölüm üst etiketi, tablo başlığı |
| Sayı | JetBrains Mono | bağlama göre | 600 | `font-variant-numeric: tabular-nums` |
| HUD rakamı | Rajdhani | 28–48 / 0.9 | 700 | Yalnız `hud` yüzeyi ve ekipman sayaçları (`--pl-font-hud`) |
| Kod | JetBrains Mono | 13 / 1.6 | 400 | Kod blokları, log, zaman kodu |

**Display kuralları**
- Büyük rakamlar `letter-spacing: var(--pl-tracking-display)` (−.035em) ile sıkıştırılır.
- İnce (300) display yalnız açık zeminde ve 48px üstünde kullanılır (Soft yüzey İK paneli).
- Birim her zaman rakamın %42'si boyutunda ve `--pl-fg-3` renginde: `.pl-unit`.

**Biçim kuralları (TR)**
- Tarih: `GG.AA.YYYY` (01.11.2026), saat `SS:DD` (24 saat), zaman kodu `SS:DD:SS:KK`.
- Para: binlik ayraç nokta, ondalık virgül, sembol sonda → `1.249,90 ₺`.
- Yüzde: `%12` (işaret önde). Büyük sayılar: `23,5B`, `1,2Mn`.
- Büyük harfe çevirmede Türkçe yerel ayar: `text-transform: uppercase` + `lang="tr"` (i → İ).
- Gün kısaltmaları: Pzt, Sal, Çar, Per, Cum, Cmt, Paz.

---

## 5. Boşluk, Izgara, Köşe

- **4 px ızgara.** Tüm boşluklar `--pl-space-*` ölçeğinden: 2, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80.
- **İç boşluk ritmi:** kontrol içi 8–12, kart içi 16–20, panel içi 20–24, bölüm arası 32–48, pencere iç boşluğu 14.
- **Köşe:** kontrol `6`, kart `10–14`, büyük kart `20`, pencere `22`, ekran şablonu `28`, yüzen pencere `36`, pil/avatar `full`. İç içe köşelerde *dış = iç + boşluk*.
- **Kontrol yükseklikleri:** 28 (sm) · 34 (md, varsayılan) · 42 (lg). Eklentide `data-pl-density="compact"` ile 24/30/36.
- **Masaüstü yerleşim tokenları:** `--pl-rail-w` 72 · `--pl-sidebar-w` 248 · `--pl-inspector-w` 288 · `--pl-titlebar-h` 40 · `--pl-statusbar-h` 26.

---

## 6. Platform Yerleşimleri

| Yüzey | Boyut | İskelet | Yoğunluk |
|---|---|---|---|
| **Hub (masaüstü)** | min 1024×680 | Başlık çubuğu 40 + kenar çubuğu 248 + içerik (max 1200) | normal |
| **Masaüstü uygulama** | serbest | Pencere (PLA-001) + ray 72 ya da kenar çubuğu + ana alan + isteğe bağlı sağ panel 300 + durum çubuğu | normal |
| **Editör** (kurgu, tasarım, düğüm) | min 1280×720 | Ray / sol kitaplık 240 + tuval/önizleme + denetçi 288 + alt zaman çizelgesi + durum çubuğu | normal |
| **Komuta ekranı** (HUD) | 1920×1080 hedef | Başlık şeridi + 3 sütun (metrik · sahne · alarm) + alt olay şeridi | normal |
| **Kokpit / HMI** | 1920×720 veya 12.3" | Gösterge kümesi + alt konsol ızgarası; hedef ≥44px | geniş |
| **Eklenti popup** | 380×560 | Başlık (logo + durum) · içerik kaydırma · alt eylem çubuğu | compact |
| **Eklenti yan paneli** | 400×tam yükseklik | Sekmeler + içerik + kompozitör | compact |
| **Sayfa içi enjekte UI** (content script) | değişken | Shadow DOM içinde, `data-pl` kökü | compact |
| **Web** | responsive, 16 px yan boşluk | Üst gezinme + içerik | normal |

**Masaüstü iskelet kuralları**
- Ray (72) ile kenar çubuğu (248) aynı ekranda birlikte bulunmaz; ray + proje paneli (PLA-006) birleşimi serbesttir.
- Sağ panel her zaman bağlamsaldır (seçili öğenin ayrıntısı); boşken kapanır.
- 900 px altında ekran şablonları tek sütuna düşer: ray yatay çubuğa, sağ panel alta geçer (CSS'te hazır).

**Eklenti kuralı:** content script UI'ı her zaman **Shadow DOM** içine kurulur ve tokenlar shadow root'a enjekte edilir; ziyaret edilen sitenin CSS'i sızmaz, bizimki siteye sızmaz.

---

## 7. Advanced Desen Aileleri

| Aile | Kimlikler | Çekirdek desenler |
|---|---|---|
| Kabuk & Pencere | PLA-001…010 | Yüzen pencere, ikon rayı, hap ray, hap gezinme, cam kenar çubuğu, proje paneli, denetçi, görüntüleyici araçları, HUD çerçeve, durum çubuğu |
| Medya & Eğlence | PLA-011…020 | Sinematik kahraman, poster/raf, izlemeye devam, indirim kartı, 3B yığın karusel, trend, kampanya, mini oynatıcı, ada oynatıcı |
| Canlı Veri & Spor | PLA-021…024 | Skor kartı, maç satırı + oran çipleri, neon vurgu kartı, canlı bant |
| Akıllı Ev & IoT | PLA-025…034 | Cihaz anahtarı, sensör cam kartı, oda kartı, iklim çipleri, varlık şeridi, kat seçici, harita sıcak noktası, saat & hava, ekipman sayacı, izometrik plan |
| HUD & Endüstri | PLA-035…042 | Işıyan büyük metrik, dalga monitörü, halka göstergeler, HUD tablo, halka yüzde, SCADA proses akışı, segment çubuk, film şeridi |
| Üretkenlik & İK | PLA-043…055 | Gün şeridi, ekip takvimi, büyük sayı üçlüsü, bölümlü haplar, zaman kadranı, ters görev kartı, profil fotoğrafı, iğne çubuklar, ajanda, karşılama, renkli istatistik, alan grafiği, randevu çizelgesi |
| CRM & İş | PLA-056…062 | Süreç adımlayıcı, skor yayı, kişi kartı, iş kuyruğu, mülk paneli, değerleme hesaplayıcı, benzer kayıt |
| Yaratıcı Araçlar | PLA-063…070 | Çok izli zaman çizelgesi, oynatma kontrolleri, medya kutusu, düğüm grafiği, dalga çubuğu, katmanlar, sayfa şeridi, alt menülü bağlam menüsü |
| Mobilite & Cihaz | PLA-071…078 | Gösterge kümesi, vites, yön kartı, menzil, pusula, yön pedi, kamera HUD, telemetri |
| Sağlık, Yaşam & Ticaret | PLA-079…090 | Yaşamsal değer, aktivite karosu, genel bakış kartı, kişi listesi, küre, kategori çipleri, ürün vitrini, sipariş özeti, indirim kartı, istatistik halkası, sosyal profil, gantt |
| Ekran Şablonları | PLA-091…102 | 12 tam ekran kompozisyon (aşağıda) |

### 7.1 Ekran şablonları

| ID | Ekran | Yüzey | İlk kullanım |
|---|---|---|---|
| PLA-091 | Akıllı Ev Kontrol Merkezi | varsayılan | Flow Dock ev modülü |
| PLA-092 | Medya Kitaplığı & Mağaza | varsayılan | PluginLabs Hub mağaza |
| PLA-093 | Canlı Skor Merkezi | neon | Gerçek zamanlı panolar |
| PLA-094 | IoT Komuta HUD | hud | Tesis / sunucu izleme |
| PLA-095 | Video Kurgu Stüdyosu | varsayılan | Kurgu / ekran kaydı araçları |
| PLA-096 | Araç HMI Kokpit | cockpit | RENTAKAR filo telemetrisi |
| PLA-097 | İK Kontrol Paneli | soft + light | Ekip yönetimi |
| PLA-098 | CRM Kayıt Ekranı | soft + light | Müşteri kaydı |
| PLA-099 | Drone Yer İstasyonu | cockpit | Saha cihazı kontrolü |
| PLA-100 | Klinik Paneli | soft + light | Randevu yönetimi |
| PLA-101 | Takvim & Ekip Planlayıcı | varsayılan (gradyan zemin) | Mind Palace planlayıcı |
| PLA-102 | Kat Planı Navigatörü | glass | Ofis rota bulma |

Şablon = başlangıç noktası. Yeni bir ekran önce en yakın şablondan türetilir, sonra komponent bazında sadeleştirilir.

### 7.2 Pin ekranları (`assets/pl-pin-ekranlari.html`)

Desktop Application panosundaki ekranların yerleşim, hiyerarşi ve ölçülerine sadık, ayrıntılı HTML karşılıklarıdır. Her ekran kendi sahne zemini üzerinde, gerçek boyutunda gösterilir ve HTML'i kopyalanabilir.

| Aile | Pin ekranları |
|---|---|
| Akıllı ev, bina, şehir | 0 · 6 · 8 · 15 · 70 |
| Emlak ve finans | 1 · 61 · 167 |
| Medya, akış, müzik, yayın | 2 · 5 · 7 · 45 · 100 · 155 |
| Canlı veri, e-spor | 4 |
| Sağlık ve bilim | 9 · 10 · 26 · 50 |
| Üretkenlik, İK, CRM, eğitim | 11 · 31 · 39 · 189 |
| Yaratıcı araçlar ve yapay zekâ | 14 · 17 · 22 |
| Mobilite ve cihaz | 18 · 30 |
| Ticaret ve topluluk | 23 · 83 · 116 · 140 |
| Widget | 178 |

**Kurallar**
- Pin ekranı sınıfları `pl-s<no>-` önekiyle `assets/pl-screens.css` içindedir; yalnız o ekrana özgü yerleşimi taşır. Tekrar eden her parça PLC/PLA komponentlerinden gelir.
- Gerçek fotoğraf yerine katmanlı gradyan yer tutucular (`pl-sx-ph`), kişiler için soyut avatarlar (`pl-sx-face`) kullanılır; üretimde gerçek görsel bu kutuların içine konur.
- Bir pin ekranından ürün ekranı türetilirken sabit `rgb()` değerleri ürün aksanı ve yüzey tokenlarıyla değiştirilir.
- Arka planlarda noktalı/ızgara doku kullanılmaz; derinlik ton, gradyan ve gölgeyle verilir. Izgara yalnız HUD panellerinin kendi içinde, çok düşük opaklıkta kalır.

---

## 8. Hareket

| Token | Süre | Kullanım |
|---|---|---|
| `--pl-dur-fast` | 120 ms | Hover, basma, toggle |
| `--pl-dur` | 180 ms | Menü, tooltip, sekme göstergesi |
| `--pl-dur-slow` | 280 ms | Modal, drawer, toast girişi, karusel |
| `--pl-dur-xslow` | 420 ms | Sahne geçişi, kat değişimi |

- Eğri: `--pl-ease-out` giriş, `--pl-ease` genel, `--pl-ease-spring` yalnız sürükle-bırak bırakma anı.
- Hareket **bilgi taşır**: nereden geldiğini ve nereye gittiğini gösterir. Süs animasyonu yok.
- Sürekli animasyonlar (canlı nokta nabzı, ekolayzer, akış çizgisi, kayan bant, organik halka) yalnız **gerçekten canlı** veride kullanılır ve üzerine gelince durur.
- `prefers-reduced-motion` açıksa tüm süreler 0'a düşer (token seviyesinde yapılmıştır).
- İskelet (skeleton) yükleme 300 ms'den kısa işlemlerde gösterilmez.

---

## 9. Derinlik, Cam ve Işıma

| Etki | Token | Kural |
|---|---|---|
| Yüzen pencere | `--pl-shadow-xl` | Yalnız pencere kökü ve ekran şablonu |
| Sahne üstü kart | `--pl-shadow-float` | Sahne/plan/görsel üzerindeki kartlar, sıcak noktalar |
| Cam | `.pl-glass` + `--pl-glass-*` | Arkasında görsel ya da gradyan olmalı; metin kontrastı en açık arka plan noktasına göre ölçülür |
| Aksan ışıması | `--pl-glow-accent` | Açık cihaz ikonu, aktif vites, seçili kategori — ekranda en fazla 3 öğe |
| Güçlü ışıma | `--pl-glow-strong` | Seçili düğüm, odaklı canlı öğe — ekranda en fazla 1 |
| HUD ışıması | `text-shadow` (HUD rakamı) | Yalnız `hud` yüzeyinde |

---

## 10. İkonografi

- Kütüphane: **Lucide** (MIT), 1.75 px çizgi, 16 / 20 / 24 boyut. Kokpit ve yön kartında 2.5 px.
- İkon tek başına anlam taşımaz; ya yanında metin ya da `aria-label` + tooltip olur. İkon rayında ipucu (`pl-rail__tip`) zorunludur.
- Ürün logoları: 10 px köşeli kare karo, aksan zemininde koyu glif ya da aksan→marka gradyanı.
- Üçüncü taraf marka logoları, oyun/film karakterleri ve gerçek ürün görselleri sisteme girmez; yerlerine `--pl-media-*` yer tutucuları ve PluginLabs içerikleri kullanılır.

---

## 11. Erişilebilirlik (pazarlıksız)

1. Metin kontrastı ≥ 4.5:1, büyük metin ve ikon ≥ 3:1. Görsel üstü metin her zaman karartma + `--pl-on-media`.
2. Odak halkası her zaman görünür: `outline: 2px solid var(--pl-accent); outline-offset: 2px;` — `outline: none` yasak.
3. Tıklanabilir alan ≥ 28×28 (eklentide), ≥ 34×34 (masaüstü), ≥ 44×44 (kokpit/dokunmatik).
4. Yalnız renkle durum gösterilmez (ikon + metin). CANLI, REC, Uyarı her zaman yazılıdır.
5. Modal: odak tuzağı, `Esc` kapatır, kapanınca odak tetikleyiciye döner. Native `<dialog>` tercih edilir.
6. Tüm form alanlarında `<label>`; hata metni `aria-describedby` ile bağlanır.
7. Grafik, harita, 3B sahne ve dalga formları `role="img"` + özet `aria-label` taşır ve aynı veri metin/tablo olarak da sunulur.
8. Sürekli değişen değerler (hız, nabız) `aria-live` değildir; yalnız eşik geçişleri duyurulur.
9. Türkçe arayüz için kök öğede `lang="tr"`.

---

## 12. İçerik ve Ses

- **Dil:** Türkçe, **nötr emir kipi** ("Eklentiyi kur", "Arşivle", "Rota oluştur"). Buton metni fiil ile başlar.
- **Kısa:** Buton ≤ 3 kelime, toast ≤ 1 cümle, boş durum = 1 başlık + 1 cümle + 1 eylem.
- **Yıkıcı eylem adı:** "Sil" yerine **"Arşivle"**; gerçekten kalıcıysa "Kalıcı olarak kaldır" + yazılı onay.
- **Hata mesajı formülü:** ne oldu + neden (biliniyorsa) + ne yapılmalı. "Bağlantı kurulamadı. Cihaz çevrimdışı olabilir. Yeniden bağlan."
- **AI (MyMind) çıktıları** her zaman "MyMind" rozetiyle işaretlenir ve kaynak/güven bilgisi gösterir.
- **Örnek veri:** gerçekçi Türkçe içerik kullanılır; lorem ipsum yok. Kişisel veri gösteriminde maskeleme: `+90 5•• ••• •• ••`.

---

## 13. Komponent Yazım Kuralları (ajanlar için)

1. Önce `references/KOMPONENTLER.md` içinde karşılığı ara (PLC temel, PLA advanced); varsa **aynısını** kullan, yeni varyant türetme.
2. Tam ekran isteniyorsa önce **Ekran Şablonları**nı (PLA-091…102) incele ve en yakınından başla.
3. Renk, boşluk, köşe, süre **asla sabit değer** olmaz; yalnız `var(--pl-…)`. Kategori rengi `--c`, değer `--v`, konum `--x/--y/--w/--p` özel değişkenleriyle verilir.
4. Sınıf adlandırma: `pl-<komponent>` · varyant `pl-<komponent>--<varyant>` · parça `pl-<komponent>__<parça>` · durum `is-<durum>` (`is-active`, `is-on`, `is-selected`, `is-live`, `is-peak`).
5. Durumlar eksiksiz tasarlanır: varsayılan, hover, odak, aktif, devre dışı, yükleniyor, hata, boş — canlı bileşenlerde ayrıca *duraklatıldı* ve *sinyal yok*.
6. React/Vue/Svelte'de sınıf adları aynen korunur; framework bileşeni yalnız sarmalayıcıdır.
7. Yeni komponent eklenirse: temel için `build/components.py`, advanced için `build/advanced*.py` kaynağına eklenir → `python3 build/build.py` ile `KOMPONENTLER.md`, `pl-components.json`, `pl-tokens.json` ve galeri yeniden üretilir. Elle düzenlenmiş çıktı kabul edilmez.
8. Her komponentin kimliği kalıcıdır (`PLC-001…`, `PLA-001…`). Kaldırılan komponent silinmez, `durum: arsiv` olarak işaretlenir.

---

## 14. Kontrol Listesi (her PR / her ekran)

- [ ] `[data-pl]` kapsayıcısı var, global seçici yok
- [ ] Sabit renk yok (`grep -E "#[0-9a-f]{3,6}"` komponent CSS'inde yalnız token dosyasında çıkar)
- [ ] Doğru `data-pl-product` aksanı ve gerekiyorsa tek `data-pl-surface`
- [ ] Karanlık + açık tema kontrol edildi (koyu yüzeyler açık temada da okunur)
- [ ] Ekranda tek kahraman alanı, tek birincil buton, tek vurgu kartı
- [ ] Klavye ile baştan sona gezilebiliyor, odak halkası görünür
- [ ] Boş, yükleniyor, hata (ve canlı bileşenlerde duraklatıldı) durumları var
- [ ] Grafik/sahne için metin alternatifi var
- [ ] Türkçe biçimler (tarih, para, yüzde, gün adları) doğru
- [ ] 900 px altında tek sütun, yatay kaydırma yok
- [ ] Mevcut ekranla yan yana ekran görüntüsü karşılaştırıldı

---

## 15. Dosya Haritası

```
pluginlabs-advanced/
├── SKILL.md                         ← ajan giriş noktası (Claude Code + Codex)
├── agents/openai.yaml               ← Codex arayüz meta verisi
├── references/
│   ├── TASARIM-PRENSIPLERI.md       ← bu dosya
│   └── KOMPONENTLER.md              ← 181 komponent: amaç, desen kaynağı, durum, sınıf, erişilebilirlik, HTML
├── assets/
│   ├── pl-tokens.css                ← tokenlar + yüzey temaları (kapsüllü)
│   ├── pl-tokens.json               ← tokenlar (W3C DTCG biçimi, AstraOS/API uyumlu)
│   ├── pl-components.css            ← temel komponent stilleri (PLC)
│   ├── pl-advanced.css              ← advanced komponent stilleri (PLA)
│   ├── pl-components.json           ← birleşik komponent kataloğu (normalize, API uyumlu)
│   ├── pl-screens.css               ← pin ekranı kompozisyon stilleri
│   ├── pl-galeri.html               ← tüm komponentlerin canlı önizlemesi
│   └── pl-pin-ekranlari.html        ← panodaki ekranların ayrıntılı HTML karşılıkları
└── build/
    ├── components.py                ← PLC kaynağı
    ├── advanced.py … advanced_4.py  ← PLA kaynağı (kategori bazında)
    ├── advanced_screens.py          ← ekran şablonları
    ├── icons.py                     ← Lucide ikon yolları
    ├── pin_base.py · pin_screens_*.py ← pin ekranları kaynağı
    ├── pin_upgrades.py · pin_art.py · iso3d.py ← ayrıntı katmanı, SVG çizimleri, izometrik 3B plan motoru
    ├── build_pins.py                ← pin ekranları sayfası ve pl-screens.css
    ├── galeri.css · galeri.js       ← galeri kabuğu
    └── build.py                     ← tek komutla tüm çıktılar
```
