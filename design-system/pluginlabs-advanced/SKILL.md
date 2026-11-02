---
name: pluginlabs-advanced
description: PluginLabs Advanced tasarım sistemi — temel PluginLabs katmanı + masaüstü uygulama katmanı. PluginLabs Hub, masaüstü uygulamaları (Flow Dock, Tweakster, Mind Palace) veya tarayıcı eklentileri (Leo Helper, Design Replicator, Mutfak Atölyesi, Extension Manager, Ultimate Scrapper, MyWishlist, MyMind) için herhangi bir UI, ekran, pano, editör, komuta ekranı, medya vitrini, kokpit/HMI, komponent, popup, yan panel, stil veya tema yazılırken/değiştirilirken kullan. Mevcut tasarıma dokunmadan --pl- tokenları, yüzey temaları ve pl- komponentleriyle çalışır.
metadata:
  short-description: PluginLabs Advanced — 181 komponent (79 PLC + 102 PLA), 6 yüzey teması, 12 ekran şablonu
  version: 2.0.0
  updated: 01.11.2026
---

# PluginLabs Advanced Tasarım Sistemi (Claude Code + Codex ortak skill)

Bu skill hem **Claude Code** (`.claude/skills/pluginlabs-advanced/`) hem **Codex** (`.agents/skills/pluginlabs-advanced/`) tarafından aynen okunur. İki ajan aynı dosyaları, aynı kuralları kullanır; birinin ürettiği ekranı diğeri sorunsuz sürdürebilir.

İki katman vardır:
- **Temel (PLC-001…079):** butonlar, formlar, gezinme, veri, geri bildirim, katmanlar, ürün kalıpları.
- **Advanced (PLA-001…102):** masaüstü kabuğu, medya, canlı veri, akıllı ev/IoT, HUD/endüstri, üretkenlik/İK, CRM, yaratıcı araçlar, mobilite/cihaz, sağlık/yaşam/ticaret ve 12 tam **ekran şablonu**.

## Ne zaman kullanılır
- PluginLabs ailesinden herhangi bir ürün için HTML/CSS/React/Vue/Svelte arayüzü yazarken
- Masaüstü uygulama ekranı, pano, editör (kurgu/tasarım/düğüm), komuta ekranı, medya mağazası, HMI tasarlarken
- Eklenti popup'ı, yan panel, content-script UI, Hub ekranı, ayar sayfası, onboarding tasarlarken
- Mevcut bir ekranı tasarım sistemine **taşırken** (taşıma = opt-in, yan yana karşılaştırmalı)

Kullanılmaz: backend, veri modeli, build/CI işleri; PluginLabs dışı projeler.

## Önce oku (sırayla)
1. `references/TASARIM-PRENSIPLERI.md` — altın kural, renk, yüzey temaları, tipografi, yerleşimler, desen aileleri, erişilebilirlik, ses. **Her görevde.**
2. `references/KOMPONENTLER.md` — 181 komponent. İhtiyacın olanı ID veya adla ara (`grep -n "Zaman Çizelgesi"`, `grep -n "PLA-094"`), tamamını okumana gerek yok.
3. Tam ekran isteniyorsa önce **Ekran Şablonları** (PLA-091…102) ve `assets/pl-pin-ekranlari.html` içindeki pin ekranlarına bak — en yakın ekrandan başla.
4. Gerekirse `assets/pl-components.json` — aynı katalog, makine okunur (slug, katman, yüzey, sınıflar, html).

## Altın kural — mevcut tasarıma dokunma
- Global reset, `body`/`html`/`button` gibi element seçicisi **yazma**.
- Yalnız `--pl-*` tokenları ve `pl-*` sınıfları; her şey `@layer pl` içinde.
- Sistem yalnız `<div data-pl data-pl-theme="dark" data-pl-product="<kod>" lang="tr">` kapsayıcısında devreye girer; isteğe bağlı `data-pl-surface="glass|hud|neon|soft|cockpit"`.
- Eski stil dosyasını silme; `_arsiv/GG.AA.YYYY/` altına taşı.
- Mevcut ekranı değiştirmeden önce kullanıcıya hangi ekranın taşınacağını teyit ettir.

## İş akışı
1. **Ürünü belirle** → `data-pl-product`: `hub, leo, mindpalace, replicator, mutfak, flowdock, tweakster, extman, mymind, scrapper, wishlist`.
2. **Yüzeyi belirle** → varsayılan koyu · `glass` (renkli zemin üstü) · `hud` (komuta) · `neon` (canlı/oyun) · `soft` + `data-pl-theme="light"` (açık SaaS) · `cockpit` (HMI/drone). Bir pencerede tek yüzey.
3. **Platformu belirle** → masaüstü (normal yoğunluk) · editör · komuta ekranı · eklenti popup 380×560 / yan panel 400px (`data-pl-density="compact"`) · content script (Shadow DOM içine kur, tokenları shadow root'a enjekte et).
4. **Dosyaları bağla** → `assets/pl-tokens.css` + `assets/pl-components.css` + `assets/pl-advanced.css` (bu sırayla) projeye kopyala (ör. `packages/ui/pl/`) ve yükle. Fontlar: Inter, JetBrains Mono, Rajdhani. Kopyalanan dosyaları değiştirme; değişiklik bu skill'de yapılır.
5. **Komponenti / şablonu katalogdan al** → KOMPONENTLER.md'deki HTML'i temel al, sınıf adlarını koru. Kategori rengi `--c`, değer `--v`, konum `--x/--y/--w/--p` özel değişkenleriyle verilir. Framework'te bileşen yalnız sarmalayıcıdır.
6. **Yeni komponent gerekiyorsa** → önce kullanıcıya sor; onaylanırsa temel için `build/components.py`, advanced için `build/advanced*.py`'ye ekle, `python3 build/build.py` çalıştır (MD, JSON, galeri yeniden üretilir). ID'ler kalıcıdır.
7. **Kontrol listesini uygula** (TASARIM-PRENSIPLERI.md §14) ve raporla.

## Sert kurallar
- Renk/boşluk/köşe/süre değerleri yalnız `var(--pl-…)`. Sabit hex yazma (token dosyası hariç).
- Ekranda tek kahraman alanı, tek birincil buton, tek vurgu kartı; aksan yalnız birincil eylem, aktif durum, odak, ilerleme, seçim ve logo karosunda.
- Altın (`--pl-gold`) yalnız Pro, para tutarı ve MyMind için; `--pl-live` yalnız CANLI/REC için.
- Görsel/karartma üstündeki metin her zaman `--pl-on-media`.
- Üçüncü taraf marka logosu, karakter ya da gerçek ürün görseli kullanma; `--pl-media-*` yer tutucuları ve PluginLabs içeriği kullan.
- Yıkıcı eylem adı **"Arşivle"**; onay diyaloğu + toast'ta "Geri al".
- Türkçe biçim: `01.11.2026`, `1.249,90 ₺`, `%12`, `00:03:12:08`; buton metni fiille başlar.
- Odak halkası asla kaldırılmaz; her durum (boş, yükleniyor, hata, devre dışı, duraklatıldı) tasarlanır.
- Grafik, harita, 3B sahne ve dalga formu için metin/tablo alternatifi zorunlu.
- Her uygulamada Ctrl/⌘+K komut paleti (PLC-033) bulunur.
- AI çıktısı her zaman "MyMind" rozetiyle ve kaynak bilgisiyle gösterilir.

## Rapor biçimi (görev sonunda)
```
📌 GÖREV: …
✅ DURUM: …
📁 ÇIKTI: değişen/eklenen dosyalar (kaynak → hedef → sonuç)
⚠️ NOTLAR: kullanılan PLC/PLA kimlikleri, yüzey, sapmalar, açık sorular
🔜 SONRAKİ ADIM: …
```

## Dosyalar
| Yol | İçerik |
|---|---|
| `references/TASARIM-PRENSIPLERI.md` | Prensipler, yüzey temaları, desen aileleri, kontrol listesi |
| `references/KOMPONENTLER.md` | 181 komponent: amaç, ne zaman, desen kaynağı, durumlar, sınıflar, a11y, HTML |
| `assets/pl-tokens.css` | Tokenlar (karanlık/açık tema, 6 yüzey, 11 ürün aksanı, yoğunluk, veri/HUD/medya paletleri) |
| `assets/pl-tokens.json` | Tokenlar, W3C DTCG biçimi (AstraOS/API uyumlu) |
| `assets/pl-components.css` | Temel komponent stilleri (PLC) |
| `assets/pl-advanced.css` | Advanced komponent stilleri (PLA) |
| `assets/pl-components.json` | Birleşik normalize komponent kataloğu |
| `assets/pl-galeri.html` | Tüm komponentlerin canlı önizlemesi (tarayıcıda aç; tema, katman, yüzey, aksan değiştirilebilir) |
| `assets/pl-screens.css` | Pin ekranı kompozisyonlarının stilleri (`pl-s<no>-` önekli) |
| `assets/pl-pin-ekranlari.html` | Desktop Application panosundaki ekranların ayrıntılı HTML karşılıkları (33 ekran, kopyalanabilir HTML) |
