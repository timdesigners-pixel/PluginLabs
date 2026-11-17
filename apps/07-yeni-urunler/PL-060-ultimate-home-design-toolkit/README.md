# PL-060 · Ultimate Home Design Toolkit

> Modüler hazır konutlar için masaüstü tasarım araç seti: modül seçimi ve kat yerleşimi, 10 cm hassas iç plan, ölçü/metraj, maliyet ölçeklemesi, kullanıcı fonksiyonları, gerçekçi ışın izleme render'ı, OBJ içe/dışa aktarma ve yerel `.uhds` sahne dosyası. Rust motoru + Tauri 2.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-060` · `ultimate-home-design-toolkit` (ad geçicidir) |
| Kategori | 07 · Yeni ürünler — PL-054+ |
| Durum | v0.1.0 geliştirme · kendi deposunda; motor ve arayüz testleri geçti, release yayımlanmadı |
| Hedef platformlar | Windows (masaüstü) |
| Dağıtım biçimi | masaüstü uygulaması (Tauri 2 / Rust) |
| Geliştirme deposu | [timdesigners-pixel/ultimate-home-design-toolkit](https://github.com/timdesigners-pixel/ultimate-home-design-toolkit) (private) |
| Referans | Kullanıcının paylaştığı modüler konut konfigüratörü akışı (Model → Katlar → İç plan → 3D → Gönder) ve ekran görüntüleri; marka, metin ve görseller kopyalanmadı |

## Ne işe yarar

Kullanıcı 4 m genişlikli modülleri seçer, katlara yerleştirir, iç planı çizer, mahalleri tek tıkla adlandırır, kapı/pencere/mobilya yerleştirir; uygulama net alanları, metrajı ve tahmini maliyeti hesaplar, 3B sahneyi gösterir ve gerçekçi render üretir. Proje `.uhds` dosyası, OBJ+MTL, PNG plan/render ve yazdırılabilir özet olarak dışa aktarılır.

Ayrıntılar, ekran görüntüleri ve geliştirme komutları: [ürün deposunun README dosyası](https://github.com/timdesigners-pixel/ultimate-home-design-toolkit#readme).

## MyMind

PluginLabs Hub üzerinden (`127.0.0.1:47632`, `mymind-lite`), önizleme → açık onay → yalnız önizlenen metin. Gönderilen: mahal türleri, net alanlar, kapı/pencere sayıları, donatı adları, kalite düzeyi. Gönderilmeyen: proje numarası, fiyatlar, dosya yolları, revizyon notları. Yanıt yalnız öneridir.

## Açık işler

- Windows'ta gerçek Tauri penceresiyle kabul ve ekran görüntüleri (DPI, klavye, kontrast).
- Release (kurulum + taşınabilir exe, SHA256SUMS, BUILD-INFO) → pluginlabs-dagitim → `src/catalog.cjs` → Hub sürümü (kullanıcı onayıyla).
- Ürüne özel `data-pl-product` aksanı (kanonik tasarım sistemine ekleme; onay gerektirir).
