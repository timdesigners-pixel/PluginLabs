# Ultimate Home Design Toolkit · PL-060

Modüler (4 m genişlikli, 3–10 m boylu) hazır konut tasarımı için PluginLabs masaüstü uygulaması. Model seçiminden kat yerleşimine, 10 cm hassas iç plandan gerçekçi render'a, ölçü ve maliyet ölçeklemesinden OBJ ve yerel sahne dosyasına kadar tüm akış tek pencerededir. Hesapların tamamı Rust motorunda (`engine/`) yapılır; masaüstü kabuğu Tauri 2'dir.

> Bu uygulamayla hazırlanan plan, 3B görünüm, render ve maliyet bir **ön çalışmadır**; statik, ruhsat veya uygulama projesi yerine geçmez. Birim fiyatlar düzenlenebilir örnek değerlerdir.

## Ekranlar

Görüntüler `scripts/ui-check.cjs` ile alınmıştır: Linux, Chromium 1600×960, tarayıcı önizleme kabuğu; motor aynı Rust kodunun WebAssembly derlemesidir (Tauri penceresi bu ortamda açılamadığı için Windows ekranları ayrıca alınacaktır).

| | |
|---|---|
| ![1 · Model](docs/screenshots/01-model.png) **1 · Model** — kat sayısı, 4×3…4×10 modül adetleri, perde/açıklık şeridi | ![2 · Katlar](docs/screenshots/02-katlar.png) **2 · Katlar** — sürükle, yapıştır, döndür; üst kata çıkarılacak modüller |
| ![3 · İç plan](docs/screenshots/03-ic-plan.png) **3 · İç plan** — 10 cm bölme, tek tıkla mahal ve net m², standart kapı/pencere, mobilya | ![4 · 3B](docs/screenshots/04-3b-dis.png) **4 · 3B** — WebGL önizleme, hazır kamera açıları, atmosfer |
| ![Render](docs/screenshots/05-render.png) **Render** — iç mekân, ışın izleme (önizlemede taslak kalite) | ![Ölçü](docs/screenshots/06-olcu.png) **Ölçü ve metraj** |
| ![Maliyet](docs/screenshots/07-maliyet.png) **Maliyet ve ölçekleme** — kalite düzeyi, bölge/işçilik endeksi, düzenlenebilir birim fiyatlar | ![Fonksiyonlar](docs/screenshots/08-fonksiyonlar.png) **Fonksiyonlar** — kullanıcı tanımlı ölçü/maliyet formülleri |
| ![Özet](docs/screenshots/09-ozet.png) **5 · Özet** — proje kontrolü, dışa aktarma | ![MyMind](docs/screenshots/10-mymind.png) **MyMind** — onaylı, veri azaltılmış öneri |

| ![Ürün kütüphanesi](docs/screenshots/12-urun-kutuphanesi.png) **Ürün kütüphanesi** — 59 hazır model, izometrik küçük resim | ![Kaplama kütüphanesi](docs/screenshots/13-kaplama-kutuphanesi.png) **Kaplama kütüphanesi** — yeni kaplama, m² fiyatı |
| ![Boyutlandırma](docs/screenshots/14-boyutlandirma.png) **Boyutlandırma** — özellikler paneli ve köşe tutamakları | ![Perde motoru](docs/screenshots/15-motor-perde.png) **Perde motoru** |
| ![Halı motoru](docs/screenshots/16-motor-hali.png) **Halı motoru** | ![Havuz](docs/screenshots/17-motor-havuz.png) **Havuz oluşturucu** |
| ![Yatak](docs/screenshots/18-motor-yatak.png) **Yatak · baza · başlık · nevresim** | ![İzometrik kesit](docs/screenshots/19-izometrik-kesit.png) **İzometrik kesit** ve gökyüzü ayarları |
| ![Görselden referans](docs/screenshots/20-gorselden-referans.png) **Görselden referans** — palet, ışık, en yakın ürünler | |

| ![Karşılama](docs/screenshots/00-karsilama.png) **Karşılama** — önden tel kafes önizleme, kaldığınız yerden devam | ![3B düzenleme](docs/screenshots/21-3b-duzenleme.png) **3B düzenleme** — sürükle bırak, döndür, çoğalt, yükselt |
| ![Fotoğraftan mekân](docs/screenshots/23-fotograftan-mekan.png) **Fotoğraftan mekân** — köşe işaretleri, ölçü ve tolerans, 3B oda | ![Render motoru](docs/screenshots/24-render-motoru.png) **Render stili ve motoru** — Varsayılan, Dergi, Mimari, Maket, Beyaz maket; Dahili / Cycles |
| ![Renk kartelası](docs/screenshots/27-renk-kartelasi.png) **Renk kartelaları** — RAL Classic (215 renk), iç duvar / dış cephe, firma kartelası içe aktarma | ![Kombine duvar boyası](docs/screenshots/28-kombine-duvar-boyasi.png) **Kombine duvar boyası** — üst renk, alt bölge, ayırma şeridi |
| ![Genişleme paketleri](docs/screenshots/29-genisleme-paketleri.png) **Genişleme paketleri** — lisans yokken kilitli | ![Hub · paketler](docs/screenshots/34-hub-genisleme-paketleri.png) **PluginLabs Hub · Keşfet** — satın alma ve lisans girişi |
| ![Tiny House denetimi](docs/screenshots/30-tiny-house-denetim.png) **Tiny House 7,2 m** — yol ölçüsü ve römork ağırlığı | ![Tiny House 3B](docs/screenshots/31-tiny-house-3b.png) **Tiny House 3B** — ahşap kaplamalı gövde |
| ![Van Builder denetimi](docs/screenshots/32-van-builder-denetim.png) **Van Builder L3H2** — faydalı yük ve enerji bütçesi | ![Van planı](docs/screenshots/33-van-plan.png) **Van planı** — sürgü/arka kapı, teker kemerleri, garajlı yatak |
| ![İngilizce arayüz](docs/screenshots/en-00-welcome.png) **English** — aynı arayüz, `locales/en.json` | ![İngilizce maliyet](docs/screenshots/en-07-cost.png) **English · cost** |

### Cycles (Blender) ile fotoğraf gerçekliğinde render

Masaüstü uygulaması, bilgisayarda kurulu Blender'ın **Cycles** motorunu arka planda çalıştırır: fiziksel tabanlı ışık, gerçek gökyüzü modeli ve güneş, pencere ışık portalları, AgX renk yönetimi, yapay zekâ gürültü gidericisi (OIDN), alan derinliği; ekran kartı varsa otomatik kullanılır. Blender ücretsizdir (blender.org); uygulama yolunu kendisi bulur ya da 3B ekranındaki “Blender yolunu seç…” ile gösterilir. Sahne bilgisayardan çıkmaz.

![Cycles · salon](docs/screenshots/render-cycles-salon.png)
Cycles · 960×600 · 128 örnek · yalnız işlemci (4 çekirdek) 2 dk 16 sn · `cycles/uhd_cycles.py`, Blender 5.3 (bpy) ile Linux'ta alınmıştır.

### Render stilleri (dahili motor)

Stil seçilmezse **Varsayılan** kullanılır.

| | |
|---|---|
| ![Varsayılan](docs/screenshots/render-stil-varsayilan.png) Varsayılan | ![Dergi çekimi](docs/screenshots/render-stil-dergi.png) Dergi çekimi |
| ![Mimari görselleştirme](docs/screenshots/render-stil-mimari.png) Mimari görselleştirme | ![Maket](docs/screenshots/render-stil-maket.png) Maket |
| ![Beyaz maket](docs/screenshots/render-stil-beyaz-maket.png) Beyaz maket | |

### Render motoru çıktıları (örnek proje, 1280×720)

Aynı motorun yerel derlemesiyle (`cargo run --release --example render_cli`, Linux, 4 iş parçacığı) alınmıştır.

| | |
|---|---|
| ![Gündüz](docs/screenshots/render-perspektif-gunduz.png) Perspektif · gündüz · 64 örnek | ![Gün batımı](docs/screenshots/render-perspektif-gun-batimi.png) Perspektif · gün batımı · 64 örnek |
| ![İzometrik 4K](docs/screenshots/render-izometrik-kesit-4k.png) İzometrik kesit · 3840×2160 · 16 örnek · 81 sn | |
| ![Kuşbakışı](docs/screenshots/render-kusbakisi.png) Kuşbakışı kesit · 48 örnek | ![İç mekân](docs/screenshots/render-ic-mekan.png) İç mekân · 96 örnek |

## Akış

1. **Model** — tek/iki katlı seçimi ve modül adetleri. Her modülün uzun kenarı: perde + açılabilir orta bölüm + perde (ör. 4×10: 2,0 + 6,0 + 2,0 m).
2. **Katlar** — zemin modüllerini sürükleyin (yaklaşınca kenara yapışır, 10 cm ızgara), ↻ ile döndürün. Birleşen kenarların açılabilir bölümü açılır, perdeler kapalı kalır. Üst kat modülü seçilen alt modülün tam üzerine oturur ve kaydırılamaz.
3. **İç plan** — 10 cm bölme (90° hizalı), tek tıkla mahal algılama (net m² ve net ölçü), standart kapılar (90×235, 100×235) ve pencereler (100/200/250/400/600×235, 140×140, 70×70), kapı açılımı, parapet, mutfak/banyo/mobilya kataloğu, merdiven (üst döşemede boşluk otomatik), dış cephe kaplaması (taş, ahşap, alüminyum kompozit) ve boyası, revizyon notları, canlı alan hesabı ve yerleşim kontrolü. Taşıyıcı perdeye açıklık konamaz.
4. **3B ve render** — dış/iç görünüm, katlar, kesit, ön/arka/sağ/sol cephe, kuşbakışı, perspektif; gündüz, gün batımı ve akşam atmosferi; iç cephe boyası; HD render (PNG).
5. **Özet** — proje kontrolü, mahal tablosu, tahmini toplam, dışa aktarma (.uhds, PNG plan, OBJ+MTL, render, yazdır/PDF).

## Kütüphaneler, motorlar ve araçlar

- **Ürün kütüphanesi** — 59 parametrik hazır model (oturma, yatak, depolama, mutfak, banyo, aydınlatma, elektronik, tablo, dış mekân) ve içe aktarılan OBJ modelleri; arama, grup süzgeci, “Plana yerleştir”.
- **Kaplama kütüphanesi** — zemin, iç duvar, cephe boyası, cephe kaplaması, mobilya/tekstil; yeni kaplama (renk, pürüzlülük, metalik, m² fiyatı). “Uygula” ile mahale (zemin), duvara ya da nesneye tıklanır. m² fiyatlı zemin ve cephe kaplamaları maliyete kalem olarak girer.
- **Boyutlandırma ve ölçekleme** — Özellikler panelinde genişlik/derinlik/yükseklik (cm), oranı koru, açı, zeminden yükseklik, adet, kaplama, çoğalt; planda köşe tutamakları (Shift: oranı koru).
- **Yapı araçları** — 10 / 12,5 / 20 cm duvar çizimi, bölmeyi sürükleyerek taşıma, kalınlık düzenleme, ölçü aracı (kalıcı ölçü çizgisi), kolon, merdiven, 5 kapı ve 11 pencere ölçüsü.
- **Tasarım motorları** — perde (cins, pile sıklığı/derinliği, saydamlık, desen, korniş/rustik/düz kemer/kavisli kemer), halı (4 şekil, 5 desen), yatak (3 baza × 5 başlık + nevresim), nevresim (yatak ölçüsüne uyum), havuz (4 şekil). Canlı önizleme, ölçü ve fiyat; “Oluştur ve plana ekle”.
- **Gökyüzü ve atmosfer** — saat, mevsim, bulut, pus; güneş konumu hesaplanır.
- **Render** — perspektif ve izometrik (kesit dahil), Taslak/İyi/Final/Ultra, 8K'ya kadar çıktı (4K ve üzeri masaüstünde).
- **Görselden referans** — renk paleti, ışık düzeni, en yakın kaplamalar, kamera önerisi ve en yakın ürünler; yerelde çalışır, uygulama geri alınabilir. Ürün eşleştirme renk ve oran tabanlı bir ön sürümdür.

Durum ve eksikler: [docs/roadmap.md](docs/roadmap.md) · Varsayımlar ve açık kararlar: [docs/assumptions.md](docs/assumptions.md)

- **Fotoğraftan mekân** — odanın fotoğrafında arka duvarın dört köşesi ve yan duvarların zemin çizgisi işaretlenir, bilinen tek ölçü girilir (tavan yüksekliği, genişlik, kamera yüksekliği ya da görünen duvar boyu). Kaçış noktalarından odak uzaklığı ve kamera yönü bulunur; genişlik, derinlik, yükseklik ve kapı/pencereler ± tolerans ile hesaplanır, oda 3B kurulur. Ölçüler tablodan değiştirilebilir (oranı koru seçeneğiyle), odalar yan yana eklenerek daire oluşur.
- **Duvar boyası ve renk kartelaları** — RAL Classic kartelası (215 renk, gruplar, kod/ad araması) iç duvar ya da dış cephe boyası olarak eklenir ve boya aracıyla duvar duvar uygulanır. Boya firmalarının kendi kartelaları (ASE, GPL ya da CSV) “Firma kartelası içe aktar” ile eklenir ve proje dosyasında saklanır. Tek duvarda kombine boya: üst renk, döşemeden ayırma yüksekliğine kadar alt bölge ve ayırma şeridi; iç bölmelerde B yüzü ayrı boyanır. Ekrandaki renkler yaklaşıktır; uygulama öncesi fiziksel kartela esas alınır.
- **Genişleme paketleri (ücretli, PluginLabs Hub)** — *Tiny House*: 6 / 7,2 / 8,5 m römork üstü gövdeler (2,55 m dış genişlik), 10 ürün, yol genişliği/yüksekliği ve 3,5 t römork ağırlık denetimi. *Van Builder*: L2H2, L3H2, L3H3, L4H3 panelvan kasaları (sürgü + arka kapı, teker kemerleri), 13 ürün, faydalı yük, günlük enerji bütçesi, güneş üretimi ve güneşsiz akü özerkliği. Paketler Hub → Keşfet → Genişleme paketleri'nden satın alınır; Hub yayıncının Ed25519 imzalı lisansını saklar, uygulama lisansı Hub'dan okur ve imzayı motorda yeniden doğrular. Lisans yoksa gövdeler, paket ürünleri ve hesaplar kilitlidir.
- **Dil** — Türkçe ve İngilizce; metinler yalnız `ui/locales/tr.json` ve `ui/locales/en.json` dosyalarındadır. Motor iletileri `@anahtar` biçimindedir ve arayüzde çevrilir. `node scripts/i18n-check.cjs` iki dosyanın eksiksiz ve tutarlı olduğunu denetler.

Ayrıca: **Ölçü ve metraj** (mm/cm/m/ft/in), **Maliyet ve ölçekleme**, **Fonksiyonlar**, **3B kütüphane (OBJ)**, **MyMind**, Ctrl+K komut paleti, Ctrl+Z geri alma, otomatik kayıt ve “Projeye devam et”.

## Motor (`engine/`, Rust)

| Modül | İçerik |
|---|---|
| `modules.rs` | Modül ölçüleri, taşıyıcı perde kuralı, birleşim açılması, üst kat dayanağı, yapışma ve çakışma |
| `plan.rs` | 90°/10 cm çizim, standart açıklıklar ve doğrulama, ızgara tabanlı kapalı alan algılama |
| `measure.rs` | Net alan, çevre, hacim, net duvar, süpürgelik, gün ışığı oranı, boya litresi, formül değişkenleri |
| `cost.rs` | Kalem bazlı maliyet (fire, miktar indirimi, kalite düzeyi, bölge/işçilik endeksi, KDV, beklenmeyen gider), alan eğrisi, seri üretim ölçeklemesi, esneklik |
| `formula.rs` | Güvenli formül dili (kullanıcı fonksiyonları): uzunluk/derinlik sınırlı, kod çalıştırma yok |
| `mesh.rs` | Kabuk duvarları (iç/dış malzeme), döşemeler, merdiven boşluğu, doğrama ve kapı kanatları, katalog nesneleri |
| `render.rs` | SAH BVH, yol izleme, perspektif ve izometrik izdüşüm, gökyüzü motoru (saat, mevsim, bulut, pus), 8K'ya kadar çıktı, güneş/gökyüzü/lamba doğrudan ışığı, cam, metal/parlak yüzey, ACES, kılavuzlu gürültü azaltma, çok iş parçacığı |
| `obj.rs` | OBJ/MTL içe aktarma (negatif indeks, çokgen, birim ve Z-yukarı dönüşümü, sınırlar) ve dışa aktarma |
| `motors.rs` | Perde, halı, yatak (baza + başlık), nevresim ve havuz motorları: parametreden üçgen ağı, malzeme, ölçü, fiyat |
| `reference.rs` | Görselden referans: palet, ışık sınıfı, gökyüzü/pozlama önerisi, en yakın kaplama ve ürünler |
| `paints.rs` | RAL Classic kartelası, ASE/GPL/CSV firma kartelası okuyucu (Lab/CMYK/RGB → sRGB), boya kaplaması |
| `packs.rs` | Genişleme paketleri: Ed25519 lisans doğrulama, Tiny House ve Van gövdeleri, yol/ağırlık ve faydalı yük/enerji hesapları |
| `scene_file.rs` | `.uhds` yerel sahne dosyası: `UHDS/1 sha256=… bytes=…` başlığı + JSON; bütünlük ve sürüm denetimi |
| `api.rs` | Arayüzün tek giriş noktası `call(komut, json)` |

## Güvenlik ve veri

- Ağ erişimi yalnız Tauri kabuğunda ve yalnız `127.0.0.1:47632` (PluginLabs Hub); yönlendirme kapalı.
- MyMind: gönderilecek metin önce gösterilir, açık onayla gönderilir; proje numarası, fiyatlar, dosya yolları ve notlar gönderilmez; 6000 karakter sınırı; yanıt projeyi değiştirmez. Hub anahtarı Windows Kimlik Bilgisi Yöneticisi'nde (`UltimateHome:pluginlabs-hub`).
- Dosya diyalogları uzantı süzgeçli; OBJ ≤ 64 MB, sahne ≤ 256 MB; otomatik kayıt uygulama veri klasöründe.
- Silme yok: bölmeler, açıklıklar, mahaller, nesneler ve fonksiyonlar `archive` listesine taşınır; “Geri al” ile döner.

## Geliştirme

```bash
cargo test -p uhd-engine --release        # motor testleri (75)
node scripts/i18n-check.cjs               # dil dosyası denetimi (tr/en)
bash scripts/build-wasm.sh                # tarayıcı önizleme motoru → ui/engine/
node scripts/ui-check.cjs [klasör]        # Chromium arayüz denetimi + ekran görüntüleri (DSF=2 ile 2x)
npm ci && npx tauri build                 # Windows: NSIS kurulum + taşınabilir exe
# Linux'tan Windows'a: mingw-w64 + nsis kurulu iken
CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER=x86_64-w64-mingw32-gcc npx tauri build --target x86_64-pc-windows-gnu
cargo run --release -p uhd-engine --example render_cli -- cikti.png perspektif gunduz 1280 720 64
```

CI: `.github/workflows/ultimate-home.yml` (motor testleri, arayüz denetimi, Windows paketleri + SHA256SUMS + BUILD-INFO yapı çıktısı olarak; release yayımlamaz).

Tasarım: PluginLabs Advanced (`ui/pl/` kanonik kopyalar, elle düzenlenmez), koyu tema, `data-pl-product="hub"` aksanı. 3B kütüphane: three.js 0.169.0 (MIT, `ui/vendor/`).
