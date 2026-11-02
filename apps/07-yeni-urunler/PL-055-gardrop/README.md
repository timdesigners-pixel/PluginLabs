# PL-055 · Gardrop

> Dijital gardırop: kıyafetleri fotoğrafla kaydeder, kombin kurar, “Bugün ne giysem?” önerisi verir, giyim günlüğü ve kullanım analizi tutar; mağazadaki kıyafeti Chrome eklentisiyle istek listesine ekler.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-055` · `gardrop` · aksan `#e879f9` (`data-pl-product="gardrop"`) |
| Kategori | 07 · Yeni ürünler — PL-054+ |
| Durum | v0.1.0 · Windows masaüstü + Chrome eklentisi (01.11.2026) |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Chrome |
| Dağıtım biçimi | masaüstü uygulaması (kurulum + taşınabilir exe), Chrome eklentisi (Manifest V3, zip) |
| Geliştirme deposu | [timdesigners-pixel/gardrop](https://github.com/timdesigners-pixel/gardrop) (özel) |
| Hub dağıtımı | `pluginlabs-dagitim` → `gardrop-v<sürüm>` · `src/catalog.cjs` kaydı `gardrop` |
| Codex projesi | `PL-055 · Gardrop` — ikinci klasör: PluginLabs |
| Notion kaynağı | [PL-055 · Gardrop](https://app.notion.com/p/40b8aa13d8f98120819bc0bf6c966773) |

## Ne işe yarar

**Kullanıcı ve problem:** Gardırobunda ne olduğunu unutan, hep aynı birkaç parçayı giyen, her sabah ne giyeceğine karar vermekte zorlanan ve alışverişte zaten sahip olduğu şeylerin benzerini alan kişiler.

**Kısa tanım (kullanıcı beyanı, 01.11.2026):** “PluginLabs'a Gardrop adında bir uygulama ekle” — Chrome eklentisi ve Rust ile Windows uygulaması.

## Özellikler (v0.1.0)

- **Gardırobum:** fotoğraf (cihazda küçültülür, baskın renk önerilir), kategori, renk, mevsim, marka, beden, kumaş, fiyat, etiket; filtre, arama, sıralama.
- **Kombinler:** parçalardan kombin, favori, arşiv.
- **Bugün ne giysem?:** cihazda hesaplanan deterministik öneri (mevsim, üst+alt/elbise+ayakkabı, soğukta dış giyim, renk uyumu, yakında giyilenler geri planda).
- **Giyim günlüğü:** aylık takvim, “Bugün giydim”.
- **Analiz:** gardırop değeri, son 30 günde kullanım oranı, kategori/renk dağılımı, en çok giyilenler, giyim başına maliyet, uzun süredir giyilmeyenler.
- **İstek listesi:** Chrome eklentisiyle mağazadan tek tıkla; “Aldım, gardıroba taşı”.
- **MyMind:** Hub üzerinden kombin önerisi; gönderilecek veri önce gösterilir, fotoğraf/fiyat/marka/bağlantı/not gitmez, yanıt doğrulanır.
- **Yedek:** JSON dışa/içe aktarma (kayıpsız, kopyasız).

## Teknik bağımlılık ve sınırlar

Tauri 2 / Rust çekirdeği, WebView2 arayüzü; veri tek JSON dosyasında yalnız bu bilgisayarda. Eklenti köprüsü yalnız `127.0.0.1:47655`, yalnız Gardrop eklentisinin kökeni, masaüstü onaylı eşleştirme. Ortak ürün okuyucusu PL-054 MyWishlist ile aynıdır (JSON-LD → microdata → OpenGraph → sezgi). Eklenti form alanlarını, çerezleri ve parolaları okumaz; sayfa yalnız kullanıcı eylemiyle okunur. Hava durumu otomatik alınmaz (ağ isteği yok); kullanıcı isterse MyMind için elle yazar.

## Sonraki adımlar (öneri)

- Arka plan kaldırma (cihazda) ve kamera ile hızlı çekim.
- PL-054 MyWishlist ile istek listesi eşitlemesi (ortak WishItem şeması).
- Bavul/seyahat listesi; mevsim değişiminde kaldırılacak parçalar.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-055-<konu>` veya `claude/PL-055-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

---
Oluşturma: 01.11.2026 · Kaynak → hedef: kullanıcı isteği → `registry/projects.json` → bu dosya
