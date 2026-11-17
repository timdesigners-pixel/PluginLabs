# Yol haritası — Ultimate Home Design Toolkit (PL-060)

Durum tarihi: 17.11.2026 · Motor sürümü 0.1.0 · 75 motor testi, Chromium arayüz denetimi (tr + en) ve çeviri denetimi geçiyor.

Bu belge, istenen özellik listesini gerçek duruma eşler. “Var” yalnız kodu yazılmış, testi olan ve arayüzden erişilen özellikler için kullanılır.

## İstenen özellikler ve durum

| Özellik | Durum | Nerede | Not |
|---|---|---|---|
| İzometrik genişletilmiş render | Var | `render.rs` (`projection: isometric`), 3B → İzometrik / İzometrik kesit | Paralel izdüşüm; kesitte çatı gizlenir |
| 4K ve üzeri çıktı | Var (8K'ya kadar) | `render.rs` sınırı 7680 × 4320 | 4K, 16 örnek: 4 çekirdekte 81 sn ölçüldü. 8K ölçülmedi; ~1,3 GB bellek ister. 16K yok |
| Gelişmiş render motoru | Var (iki motor) | `render.rs`, `cycles.rs`, `cycles/uhd_cycles.py` | Dahili: yol izleme, GGX mikro yüzey, doku ve kabartı, ince mercek alan derinliği, parlama/köşe kararması/gren, 5 stil. Cycles (Blender): PBR, gerçek gök modeli, pencere portalları, AgX, OIDN, GPU. Cycles için kullanıcının Blender kurması gerekir; Windows'ta Blender ile uçtan uca deneme yapılmadı |
| Render stilleri | Var | `render.rs` `STYLES` | Varsayılan, Dergi çekimi, Mimari görselleştirme, Maket, Beyaz maket; stil seçilmezse Varsayılan |
| Fotoğraftan oda / daire | Var (dikdörtgen oda) | `photo.rs`, `spaces.rs`, Fotoğraftan mekân ekranı | Tek görüntü metrolojisi (kaçış noktaları), bilinen tek ölçüyle mm'ye çevirme, ± tolerans, kapı/pencere, kamera konumu; düzenlenebilir ölçüler, oranı koru, yan yana odalar. L biçimli ve eğik duvarlı odalar, otomatik köşe bulma yok |
| Dil desteği (tr/en) | Var | `ui/locales/*.json`, `ui/i18n.js`, `scripts/i18n-check.cjs` | Arayüz, motor iletileri, katalog/kaplama/maliyet adları. Kullanıcının verdiği adlar ve eski projelerdeki üretici adları olduğu gibi kalır |
| Gökyüzü ve atmosfer motoru | Var | `render.rs` `SkySettings` | Saat (0–24), mevsim, bulut, pus, enlem; güneş konumu hesaplanır, gece ay ışığı. Yok: hacimsel bulut, HDRI |
| Perde motoru | Var | `motors.rs` `curtain` | Cins: tül, fon, tül + fon, stor. Pile sıklığı ve derinliği, saydamlık, desen (düz, çizgili, bordür), üst bitiş: korniş, rustik, düz kemer, kavisli kemer. Sarkma sinüs tabanlıdır; fizik benzetimi yok |
| Halı motoru | Var | `motors.rs` `rug` | 4 şekil, 5 desen, iki renk, hav yüksekliği, saçak. Desen geometriyle yapılır; doku yok |
| Yatak · baza · başlık kombinasyonu | Var | `motors.rs` `bed` | 3 baza × 5 başlık (düz, kapitone, kemerli, kulaklı, başlıksız), 7 genişlik, şilte yüksekliği |
| Nevresim motoru | Var | `motors.rs` `bedding_set` | Yatak ölçüsüne otomatik uyum, kabarık yorgan, katlama, 1–6 yastık, örtü, 3 desen. Kumaş benzetimi yok |
| Havuz oluşturucu | Var | `motors.rs` `pool` | Dikdörtgen, oval, yuvarlak, L; derinliğe göre koyulaşan fayans, saydam su, kenar taşı, basamak, aydınlatma. Kaustik yok; havuz zemini oymaz |
| 3B obje desteği | Var | `obj.rs` | OBJ + MTL içe/dışa aktarma. Yok: glTF, FBX, doku |
| Hazır kütüphaneler | Kısmen | `catalog.rs`, `plan.rs` | 59 parametrik ürün: 5 kapı, 11 pencere, 6 aydınlatma (avize, sarkıt, lambader, ankastre spot, aplik, masa lambası), 6 elektronik (2 TV dahil), 3 tablo, 9 dış mekân, mobilya/mutfak/banyo. Perde, halı ve yatak çeşitleri motorlarla üretilir. Hedef adetlerin (kategori başına 20–40) çok altında |
| Kaplama kütüphanesi | Kısmen | `templates.rs`, Kaplama kütüphanesi ekranı | 60 civarı düz renk PBR kaplama + kullanıcı ekleme; m² fiyatı maliyete bağlı. Doku yok |
| Dış mekân propları, bitki, ışık, dekoratif çim ve taş | Var (temel) | `catalog.rs` “Dış mekân” | Ağaç, çam, çalı, çim alanı, çakıl alanı, basamak taşları, bahçe lambası, şezlong, büyük saksı. Kutu tabanlı modeller |
| Görselden en yakın ürün eşleştirici | Ön sürüm | `reference.rs` | Renk + en-boy oranı. Öğrenilmiş model (CLIP) yok; düz zemin önündeki tek ürün görselinde anlamlı |
| Görselden renk, ışık, arka plan, perspektif referansı | Ön sürüm | `reference.rs`, Görselden referans ekranı | Palet (k-ortalama), parlaklık/sıcaklık, ışık düzeni sınıfı, saat/bulut/pozlama önerisi, en yakın iç boya/zemin/cephe, ufuk tahmini ve kamera ön ayarı. Gerçek perspektif (kaçış noktası) çözümü ve görselden geometri üretimi yok |

## Sıradaki işler (öneri sırası)

1. Windows'ta gerçek pencerede kabul; Cycles'ın Windows + Blender 4.2/5.x ile uçtan uca denenmesi; 8K render ölçümü.
2. Gerçek ürün fotoğrafı düzeyinde ayrıntı için yüksek ayrıntılı, lisansı açık 3B modeller (glTF) ve PBR doku setleri; kutu tabanlı katalog modelleri en büyük gerçekçilik sınırıdır.
2. Doku desteği (UV + görüntü dokuları) — halı/perde deseni, ahşap, taş için ön koşul.
3. Kütüphane adetlerini hedefe yaklaştırma: parametrik çeşitler (kapı/pencere kanat düzenleri, avize aileleri) ve lisansı açık modeller.
4. Görsel eşleştirici için öğrenilmiş gömme modeli (yerel ONNX); lisans ve boyut kararı gerekir.
5. Kaçış noktası tabanlı kamera eşleme.
6. EXR/alfa çıktı, karo (tile) tabanlı render ile 16K.
7. Kumaş benzetimi (perde/nevresim) ve su kaustiği.
8. Hub kataloğu ve release (kullanıcı onayıyla).
