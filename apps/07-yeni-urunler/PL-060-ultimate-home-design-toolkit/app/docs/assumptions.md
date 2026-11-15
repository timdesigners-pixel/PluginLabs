# Varsayımlar ve açık kararlar — Ultimate Home Design Toolkit (PL-060)

Yeni varsayım eklendiğinde tarih ve kısa gerekçe ile buraya yazılır.

## Kullanıcı kararı bekleyenler

### K-1 · Mimari: mevcut yapı mı, önerilen wgpu/Bevy/egui yığını mı? (15.11.2026)

Kullanıcı, ayrı bir depo kökü `CLAUDE.md` taslağı paylaştı: wgpu 0.20, Bevy 0.14, egui 0.28, `crates/{core,render,ui,assets,plugins,ai,app}`, İngilizce kod/commit, `.uhdt` dosya biçimi, CLIP + lancedb.

Bu taslak uygulanmadı; gerekçeler:

- Ürün şu an PluginLabs deposunun içinde (`apps/07-yeni-urunler/PL-060-…`). Depo kökündeki `CLAUDE.md` ve `AGENTS.md` tüm PluginLabs ürünlerinin ortak kurallarıdır; üzerine yazmak diğer ürünleri ve Codex ile ortak çalışmayı bozar.
- Taslak “çelişkide bu dosya önceliklidir” diyor; PluginLabs şartnamesi (Tasarım Sistemi, Hub'dan kurulum, MyMind, Türkçe rapor) ile çelişiyor.
- Çalışan uygulama Tauri 2 + HTML arayüz + Rust motorudur ve PR #116 ile `main`'e girdi. egui/Bevy'ye geçiş arayüzün tamamen yeniden yazılması ve PluginLabs Advanced tasarım sisteminin bırakılması demektir.

Geçiş istenirse kayıp olmayacak kısım: `engine/` saf Rust'tır (pencere/GPU bağımlılığı yok) ve `core` + `plugins` + `ai` crate'lerine bölünebilir. Motorlar bu yüzden motor katmanında yazıldı.

Seçenekler:

- **A (varsayılan, uygulanan):** Mevcut yapıda devam; taslağın uygulanabilir kuralları (varsayım kaydı, yol haritası, test zorunluluğu, yerel görsel işleme, geri alınabilir uygulama) benimsenir.
- **B:** Ürün ayrı bir depoya taşınır, taslak o deponun `CLAUDE.md`'si olur, arayüz egui/wgpu ile yeniden yazılır. PluginLabs MUST-HAVE maddeleri için ayrı karar gerekir.

### K-2 · Proje dosyası uzantısı

Taslak `.uhdt` diyor; uygulama `.uhds` (başlık + SHA-256 + JSON) kullanıyor ve bu biçim `main`'de. Değişiklik istenirse eski dosyalar için okuma desteği korunmalı.

### K-3 · Öğrenilmiş görsel eşleştirme modeli

CLIP benzeri bir modelin depoya ya da kuruluma eklenmesi boyut (yüzlerce MB) ve lisans kararıdır. Şimdilik model yok; eşleştirme renk ve oran tabanlıdır.

## Yapılan varsayımlar

| Tarih | Varsayım | Gerekçe |
|---|---|---|
| 15.11.2026 | Referans konfigüratörün akışı örnek alınır; marka, metin ve görseller kopyalanmaz | Telif ve marka |
| 15.11.2026 | Modül 4 m × 3–10 m; dış duvar 12,5 cm, iç bölme 10 cm, net iç 285 cm, kat 320 cm | Kullanıcının paylaştığı sayfa kaydı |
| 15.11.2026 | Net alan dış duvar kalınlığı 12,5 cm düşülerek hesaplanır (4 × 10 → 36,56 m²) | Referanstaki 37,24 m² farklı bir düşüm kullanıyor; geometrik olarak tutarlı olan seçildi |
| 15.11.2026 | Birim fiyatlar örnek değerlerdir, kullanıcı düzenler | Gerçek fiyat kaynağı yok |
| 15.11.2026 | Gökyüzü motoru için varsayılan enlem 39°; sahnenin `sun.azimuth` değeri öğle güneşi yönüdür | Türkiye ortalaması; pusula yönü henüz kullanıcıdan alınmıyor |
| 15.11.2026 | 8K üst sınır; 16K sunulmaz | Tek parça bellek gereksinimi; karo tabanlı render gerekir |
| 15.11.2026 | Perde ve nevresim biçimi matematiksel yüzeylerle üretilir | Kumaş benzetimi kapsam dışı bırakıldı; “fizik tabanlı” denmez |
| 15.11.2026 | Hazır ürünler kutu tabanlı parametrik modellerdir | Lisanssız asset eklenmez; dış model indirilmedi |
| 15.11.2026 | Görsel analizi 96 piksele küçültülmüş kopya üzerinde, yalnız yerelde yapılır | Gizlilik; görsel proje dosyasına yazılmaz |
| 15.11.2026 | Ürüne özel aksan yok; `data-pl-product="hub"` kullanılır | Kanonik tasarım sistemine ekleme onay ister |
