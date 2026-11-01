---
name: pluginlabs-design
description: PluginLabs ortak tasarım sistemi. PluginLabs Hub, masaüstü uygulamaları (Flow Dock, Tweakster) veya tarayıcı eklentileri (Leo Helper, Mind Palace, Design Replicator, Mutfak Atölyesi, Extension Manager, Ultimate Scrapper, MyWishlist, MyMind) için herhangi bir UI, ekran, komponent, popup, yan panel, stil veya tema yazılırken/değiştirilirken kullan. Mevcut tasarıma dokunmadan --pl- tokenları ve pl- komponentleriyle çalışır.
metadata:
  short-description: PluginLabs tasarım sistemi — tokenlar, 79 komponent, prensipler
  version: 1.0.0
  updated: 30.10.2026
---

# PluginLabs Tasarım Sistemi (Claude Code + Codex ortak skill)

Bu skill hem **Claude Code** (`.claude/skills/pluginlabs-design/`) hem **Codex** (`.agents/skills/pluginlabs-design/`) tarafından aynen okunur. İki ajan aynı dosyaları, aynı kuralları kullanır; birinin ürettiği ekranı diğeri sorunsuz sürdürebilir.

## Ne zaman kullanılır
- PluginLabs ailesinden herhangi bir ürün için HTML/CSS/React/Vue/Svelte arayüzü yazarken
- Eklenti popup'ı, yan panel, content-script UI, Hub ekranı, ayar sayfası, onboarding tasarlarken
- Mevcut bir ekranı tasarım sistemine **taşırken** (taşıma = opt-in, yan yana karşılaştırmalı)

Kullanılmaz: backend, veri modeli, build/CI işleri; PluginLabs dışı projeler.

## Önce oku (sırayla)
1. `references/TASARIM-PRENSIPLERI.md` — altın kural, renk, tipografi, platform yerleşimleri, erişilebilirlik, ses. **Her görevde.**
2. `references/KOMPONENTLER.md` — 79 komponent (PLC-001…PLC-079). İhtiyacın olanı ID veya adla ara (`grep -n "Komut Paleti"`), tamamını okumana gerek yok.
3. Gerekirse `assets/pl-components.json` — aynı katalog, makine okunur (slug, sınıflar, html).

## Altın kural — mevcut tasarıma dokunma
- Global reset, `body`/`html`/`button` gibi element seçicisi **yazma**.
- Yalnız `--pl-*` tokenları ve `pl-*` sınıfları; her şey `@layer pl` içinde.
- Sistem yalnız `<div data-pl data-pl-theme="dark" data-pl-product="<kod>" lang="tr">` kapsayıcısında devreye girer.
- Eski stil dosyasını silme; `_arsiv/GG.AA.YYYY/` altına taşı.
- Mevcut ekranı değiştirmeden önce kullanıcıya hangi ekranın taşınacağını teyit ettir.

## İş akışı
1. **Ürünü belirle** → `data-pl-product` kodu: `hub, leo, mindpalace, replicator, mutfak, flowdock, tweakster, extman, mymind, scrapper, wishlist, tork`.
2. **Yüzeyi belirle** → Hub/masaüstü (normal yoğunluk) · eklenti popup 380×560 / yan panel 400px (`data-pl-density="compact"`) · content script (Shadow DOM içine kur, tokenları shadow root'a enjekte et).
3. **Tokenları bağla** → `assets/pl-tokens.css` + `assets/pl-components.css` dosyalarını projeye kopyala (ör. `packages/ui/pl/`) ve yükle. Kopyalanan dosyaları değiştirme; değişiklik bu skill'de yapılır.
4. **Komponenti katalogdan al** → KOMPONENTLER.md'deki HTML'i temel al, sınıf adlarını koru. Framework'te bileşen yalnız sarmalayıcıdır.
5. **Yeni komponent gerekiyorsa** → önce kullanıcıya sor; onaylanırsa `build/components.py`'ye ekle, `python3 build/build.py` çalıştır (MD, JSON, galeri yeniden üretilir). ID'ler kalıcıdır.
6. **Kontrol listesini uygula** (TASARIM-PRENSIPLERI.md §11) ve raporla.

## Sert kurallar
- Renk/boşluk/köşe/süre değerleri yalnız `var(--pl-…)`. Sabit hex/px yazma (token dosyası hariç).
- Ekranda tek birincil buton; aksan yalnız birincil eylem, aktif durum, odak, ilerleme ve logo karosunda.
- Altın (`--pl-gold`) yalnız Pro, para tutarı ve MyMind için.
- Yıkıcı eylem adı **"Arşivle"**; onay diyaloğu + toast'ta "Geri al".
- Türkçe biçim: `30.10.2026`, `1.249,90 ₺`, `%12`; buton metni fiille başlar.
- Odak halkası asla kaldırılmaz; her durum (boş, yükleniyor, hata, devre dışı) tasarlanır.
- Her eklenti/uygulamada Ctrl/⌘+K komut paleti (PLC-033) bulunur.
- AI çıktısı her zaman "MyMind" rozetiyle ve kaynak bilgisiyle gösterilir.

## Rapor biçimi (görev sonunda)
```
📌 GÖREV: …
✅ DURUM: …
📁 ÇIKTI: değişen/eklenen dosyalar (kaynak → hedef → sonuç)
⚠️ NOTLAR: kullanılan PLC kimlikleri, sapmalar, açık sorular
🔜 SONRAKİ ADIM: …
```

## Dosyalar
| Yol | İçerik |
|---|---|
| `references/TASARIM-PRENSIPLERI.md` | Prensipler, kurallar, kontrol listesi |
| `references/KOMPONENTLER.md` | 79 komponent: amaç, ne zaman, durumlar, sınıflar, a11y, HTML |
| `assets/pl-tokens.css` | Tokenlar (karanlık/açık tema, 11 ürün aksanı, yoğunluk) |
| `assets/pl-tokens.json` | Tokenlar, W3C DTCG biçimi (AstraOS/API uyumlu) |
| `assets/pl-components.css` | Komponent stilleri |
| `assets/pl-components.json` | Normalize komponent kataloğu |
| `assets/pl-galeri.html` | Tüm komponentlerin canlı önizlemesi (tarayıcıda aç) |
