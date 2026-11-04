# KA-07 · Düğüm editörü ve eklenti SDK'sı — ürün şartnamesi

04.11.2026 · PL-058 · Tasarım: PluginLabs Advanced PLA-095/yaratıcı araçlar. Bu belge sonraki fazın sözleşmesidir; çalışan düğüm/eklenti motoru değildir.

## Kullanıcı akışı

Kullanıcı bir klibi seçer, Düğümler görünümünde Kaynak → LUT → Renk → Çıkış akışını oluşturur. Geçerli akışın önizlemesi ve dışa aktarımı aynı derleyiciyi kullanır. Zaman çizelgesi klip sürelerinin tek kaynağıdır; düğümler bu süreleri gizlice değiştiremez. Eski projelerde düğüm grafiği zorunlu değildir.

## Model ve doğrulama

`graphVersion:1`, sabit UUID düğümler, tipli `video/audio/mask` portları, açık kenarlar ve tek çıkış. Döngüler, kopuk çıkış, uyumsuz port, bilinmeyen düğüm ve büyüklük sınırı (100 düğüm / 200 kenar) kayıttan önce reddedilir. Parametreler şema ile doğrulanır. Undo/redo grafik ve zaman çizelgesi için tek işlem sınırında çalışır. FFmpeg komutları yalnız yerleşik güvenilir derleyiciden üretilir.

## Eklenti sınırı

Manifest: `id`, `version`, `apiVersion`, `publisher`, `sha256`, yetenekler ve parametre şeması. İlk faz yalnız bildirimsel efekt presetleri; keyfi JavaScript, native DLL, shell, ağ veya dosya sistemi erişimi yok. Çıktı dosyaları yalnız uygulamanın oluşturduğu iş klasöründe üretilir. Yeni yetenek açık izin ekranı gerektirir; kullanıcı dosyası eklentiye varsayılan verilmez. İmza ve hash doğrulanmadan paket yüklenmez. Hub kataloğu ayrı sahibin incelemesiyle entegre edilir.

## Kabul ölçütleri

1. Kaynak → LUT → Çıkış grafiği ile doğrusal LUT işleminin aynı kareleri üretmesi.
2. Döngü ve port uyumsuzluğunun kullanıcı verisi değişmeden anlaşılır hata vermesi.
3. Projeyi kapat/aç ve undo/redo ile grafik kayıpsız korunması.
4. Eklenti yol kaçışı, bilinmeyen izin ve değişmiş hash testlerinin reddedilmesi.
5. Örnek 1080p projede sürüm sabitlenmiş eklentiyle tekrarlanabilir çıktı; CPU/GPU kanıtları ayrı.

## AI maske (KA-04) bağımlılığı

Gerçek segmentasyon + zamansal takip için lisansı, model boyutu ve RTX 2060 6GB bellek ölçümü doğrulanmış bir sağlayıcı gerekir. Bu sürüm model indirmez ve AI maske sonucu uydurmaz. Sonraki sözleşme: kare/ROI → alfa maskesi + zaman damgası + güven bilgisi; fırçayla elle düzeltme geri alınabilir ayrı maske katmanıdır. Yerel model varsayılan, dış sağlayıcı ayrı onay gerektirir. Kabul: en az 30 ardışık karede takip ve kullanıcının düzelttiği maskenin render'a aynen uygulanması.
