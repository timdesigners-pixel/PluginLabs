# PL-056 · The Ultimate Upscaler

> Cihazda görsel büyütme: fotoğraf, çizim/logo ve piksel sanatı için profiller, önce/sonra karşılaştırma, toplu sıra; Chrome eklentisiyle web'deki görsele sağ tıklayıp büyütme. Görseller buluta gitmez.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-056` · `ultimate-upscaler` · aksan `#38bdf8` (`data-pl-product="upscaler"`) |
| Kategori | 07 · Yeni ürünler — PL-054+ |
| Durum | v0.1.0 · Windows masaüstü + Chrome eklentisi (01.11.2026) |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Chrome |
| Dağıtım biçimi | masaüstü uygulaması (kurulum + taşınabilir exe), Chrome eklentisi (Manifest V3, zip) |
| Geliştirme deposu | [timdesigners-pixel/ultimate-upscaler](https://github.com/timdesigners-pixel/ultimate-upscaler) (özel) |
| Hub dağıtımı | `pluginlabs-dagitim` → `ultimate-upscaler-v<sürüm>` · `src/catalog.cjs` kaydı `ultimate-upscaler` |
| Codex projesi | `PL-056 · The Ultimate Upscaler` — ikinci klasör: PluginLabs |
| Notion kaynağı | [PL-056 · The Ultimate Upscaler](https://app.notion.com/p/40b8aa13d8f98160b46ae02a20055404) |

## Ne işe yarar

**Kullanıcı ve problem:** Küçük, bulanık ya da eski görselleri (ürün fotoğrafı, logo, ekran görüntüsü, eski fotoğraf) baskı, sunum veya web için büyütmek isteyen; bunun için görsellerini buluta yüklemek istemeyen kullanıcılar.

**Kısa tanım (kullanıcı beyanı, 01.11.2026):** “The Ultimate Upscaler adında bir proje daha geliştir; gerekli yerlerde oluştur, ekle, planla.”

## Özellikler (v0.1.0)

- **Büyüt:** seç, sürükle-bırak, Ctrl+V; 2×/3×/4× ya da hedef genişlik (≤ 8×, kenar ≤ 16.384 px, ≤ 120 MP); sıralı arka plan işleme.
- **Profiller:** Otomatik (cihazda ölçüp seçer), Fotoğraf (gürültü azaltma + Lanczos3 + eşikli keskinleştirme), Çizim/logo (kademeli 2×), Piksel sanatı (en yakın komşu), Yumuşak (Catmull-Rom).
- **Karşılaştır:** 1:1 kesitte önce/sonra kaydırıcısı (bikübik ya da özgün piksel tabanı), gezgin.
- **Çıktı:** PNG/JPEG/WebP → `Resimler\Ultimate Upscaler`; üzerine yazmaz.
- **Geçmiş ve arşiv**, Ctrl+K komut paleti.
- **Chrome eklentisi:** görsele sağ tık → Varsayılan / 2× / 4×; sayfadan okuma, olmazsa adresle indirme; masaüstü onaylı eşleştirme; çevrimdışı sıra.
- **MyMind:** Hub üzerinden ayar önerisi; yalnız ölçümler gider (piksel, dosya adı, adres gitmez); onaylı ve doğrulanmış.

## Teknik bağımlılık ve sınırlar

Tauri 2 / Rust (`image` crate) çekirdeği, WebView2 arayüzü. Eklenti köprüsü yalnız `127.0.0.1:47656`, yalnız Upscaler eklentisinin kökeni. **Yapay zekâ modeli kullanılmaz** (klasik yeniden örnekleme + kenar duyarlı keskinleştirme); cihazda AI süper çözünürlük v0.2 hedefidir.

## Sonraki adımlar (öneri)

- v0.2: ONNX Runtime + DirectML ile cihazda AI süper çözünürlük; model Hub üzerinden indirilir ve SHA-256 doğrulanır.
- v0.3: yüz iyileştirme, klasör izleme; Gardrop (PL-055) ve MyWishlist (PL-054) görselleri için “büyüt” eylemi.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-056-<konu>` veya `claude/PL-056-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

---
Oluşturma: 01.11.2026 · Kaynak → hedef: kullanıcı isteği → `registry/projects.json` → bu dosya
