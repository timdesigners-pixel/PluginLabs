# PluginLabs Tasarım Prensipleri

> **Sürüm:** 1.0.0 · **Tarih:** 30.10.2026 · **Kapsam:** PluginLabs Hub ve altındaki tüm masaüstü uygulamaları, tarayıcı eklentileri ve web yüzeyleri (Leo Helper, Mind Palace, Design Replicator, Mutfak Atölyesi, Flow Dock, Tweakster, Extension Manager, MyMind, The Ultimate Scrapper, MyWishlist)
> **Ortak kaynak:** Bu dosya Claude Code ve Codex tarafından aynı şekilde okunur. İki ajan da aynı kuralları uygular; çelişki durumunda bu dosya kazanır.

---

## 0. Altın Kural — Mevcut Tasarıma Dokunma

PluginLabs tasarım sistemi bir **katmandır, yeniden boyama değildir.**

| Kural | Neden |
|---|---|
| Hiçbir global reset, `*`, `body`, `html`, `button` gibi element seçici yazılmaz | Mevcut uygulamaların görünümü bozulmaz |
| Tüm tokenlar `--pl-` önekli, tüm sınıflar `pl-` önekli | Çakışma imkânsız hale gelir |
| Sistem yalnız `[data-pl]` kapsayıcısı içinde devreye girer | Opt-in: hangi ekranın taşınacağına geliştirici karar verir |
| Tüm kurallar `@layer pl` içinde; tokenlar `:where()` ile sıfır özgüllükte | Katmansız uygulama CSS'i özgüllükten bağımsız her zaman kazanır |
| Mevcut bir ekran **taşınırken** önce ekran görüntüsü alınır, sonra yeni sürüm yan yana karşılaştırılır | Görsel gerileme yakalanır |
| Silme yok, arşivleme var: eski stil dosyaları `_arsiv/GG.AA.YYYY/` altına taşınır | Geri dönüş garantisi |

---

## 1. Tasarım Karakteri

**"Gece atölyesi."** PluginLabs; koyu, sakin, yoğun bilgi taşıyan ama ferah hissettiren bir araç ailesidir. Adobe Creative Cloud'un düzenini, Linear'ın netliğini, Raycast'in hızını hedefler.

1. **Önce içerik.** Krom (çerçeve, kenarlık, gölge) en aza iner; veri, kod ve görsel öne çıkar.
2. **Tek aksan.** Her ekranda yalnız bir vurgu rengi baskındır: ürünün aksanı. Marka gradyanı yalnız Hub kimliğinde, onboarding'de ve "Pro" anlarında kullanılır.
3. **Derinlik = ton, gölge değil.** Katmanlar `bg-0 → bg-4` arası ton farkıyla ayrılır. Gölge yalnız *yüzen* öğelerde (menü, modal, toast, tooltip).
4. **Mono = makine dili.** Etiketler, kısayollar, sürüm numaraları, sayılar, kod ve durum kodları mono ve harf aralıklı büyük harftir. İnsan dili sans.
5. **Klavye birinci sınıf vatandaştır.** Her eylemin bir kısayolu, her listenin ok tuşu gezinmesi, her ekranın ⌘K komut paleti vardır.
6. **Durum her zaman görünür.** Bağlantı, senkron, kurulum, AI işleme durumları renk + ikon + metin üçlüsüyle gösterilir; yalnız renge güvenilmez.
7. **Geri alınabilirlik.** Yıkıcı eylemler "Arşivle" diye adlandırılır, onay ister ve toast içinde "Geri al" sunar.

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

Her anlamsal rengin bir `-soft` (%14 opaklık) eşi vardır: rozet ve callout zemini için.

### 2.4 Ürün aksanları

Ürün kimliği **yalnız** `data-pl-product` niteliğiyle verilir; komponentler `--pl-accent` okur, sabit renk yazmaz.

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
- Aksan; birincil buton, aktif sekme, odak halkası, seçili satır işareti, ilerleme çubuğu ve logo karosunda kullanılır. Başka yerde kullanılmaz.
- Aksan rengi büyük metin zemini olarak kullanılmaz (okunabilirlik).
- Anlamsal renkler aksanla yarışmaz: Tweakster'ın limon aksanı "başarı" yeşiliyle karışmasın diye başarı durumları her zaman ikon + metin taşır.

---

## 3. Tipografi

| Rol | Font | Boyut / satır | Ağırlık | Not |
|---|---|---|---|---|
| Display | Inter | 36–48 / 1.1 | 700 | Onboarding, boş durum başlığı |
| H1 | Inter | 28 / 1.2 | 700 | Sayfa başlığı |
| H2 | Inter | 22 / 1.25 | 600 | Bölüm başlığı |
| H3 | Inter | 16–18 / 1.3 | 600 | Kart başlığı |
| Gövde | Inter | 14 / 1.5 | 400 | Varsayılan |
| Küçük | Inter | 13 / 1.45 | 400 | Yardımcı metin |
| Etiket | JetBrains Mono | 11 / 1.3, `letter-spacing: .08em`, BÜYÜK HARF | 500 | Bölüm üst etiketi, tablo başlığı |
| Sayı | JetBrains Mono | bağlama göre | 600 | `font-variant-numeric: tabular-nums` |
| Kod | JetBrains Mono | 13 / 1.6 | 400 | Kod blokları, log |

**Biçim kuralları (TR)**
- Tarih: `GG.AA.YYYY` (30.10.2026), saat `SS:DD` (24 saat).
- Para: binlik ayraç nokta, ondalık virgül, sembol sonda → `1.249,90 ₺`.
- Yüzde: `%12` (işaret önde).
- Büyük harfe çevirmede Türkçe yerel ayar: `text-transform: uppercase` + `lang="tr"` (i → İ).

---

## 4. Boşluk, Izgara, Köşe

- **4 px ızgara.** Tüm boşluklar `--pl-space-*` ölçeğinden: 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- **İç boşluk ritmi:** kontrol içi 8–12, kart içi 16–20, bölüm arası 32–48.
- **Köşe:** kontrol `6`, kart `10–14`, modal `20`, pil/avatar `full`. İç içe köşelerde *dış = iç + boşluk*.
- **Kontrol yükseklikleri:** 28 (sm) · 34 (md, varsayılan) · 42 (lg). Eklentide `data-pl-density="compact"` ile 24/30/36.

---

## 5. Platform Yerleşimleri

| Yüzey | Boyut | İskelet | Yoğunluk |
|---|---|---|---|
| **Hub (masaüstü)** | min 1024×680 | Başlık çubuğu 40 + kenar çubuğu 248 + içerik (max 1200) | normal |
| **Masaüstü uygulama** (Flow Dock, Tweakster) | serbest | Başlık çubuğu + tek panel ya da dock | normal |
| **Eklenti popup** | 380×560 | Başlık (logo + durum) · içerik kaydırma · alt eylem çubuğu | compact |
| **Eklenti yan paneli** | 400×tam yükseklik | Sekmeler + içerik + kompozitör | compact |
| **Sayfa içi enjekte UI** (content script) | değişken | Shadow DOM içinde, `data-pl` kökü | compact |
| **Web** | responsive, 16 px yan boşluk | Üst gezinme + içerik | normal |

**Eklenti kuralı:** content script UI'ı her zaman **Shadow DOM** içine kurulur ve tokenlar shadow root'a enjekte edilir; ziyaret edilen sitenin CSS'i sızmaz, bizimki siteye sızmaz.

---

## 6. Hareket

| Token | Süre | Kullanım |
|---|---|---|
| `--pl-dur-fast` | 120 ms | Hover, basma, toggle |
| `--pl-dur` | 180 ms | Menü, tooltip, sekme göstergesi |
| `--pl-dur-slow` | 280 ms | Modal, drawer, toast girişi |

- Eğri: `--pl-ease-out` giriş, `--pl-ease` genel.
- Hareket **bilgi taşır**: nereden geldiğini ve nereye gittiğini gösterir. Süs animasyonu yok.
- `prefers-reduced-motion` açıksa tüm süreler 0'a düşer (token seviyesinde yapılmıştır).
- İskelet (skeleton) yükleme 300 ms'den kısa işlemlerde gösterilmez.

---

## 7. İkonografi

- Kütüphane: **Lucide** (MIT), 1.75 px çizgi, 16 / 20 / 24 boyut.
- İkon tek başına anlam taşımaz; ya yanında metin ya da `aria-label` + tooltip olur.
- Ürün logoları: 10 px köşeli kare karo, aksan zemininde koyu glif ya da aksan→marka gradyanı.

---

## 8. Erişilebilirlik (pazarlıksız)

1. Metin kontrastı ≥ 4.5:1, büyük metin ve ikon ≥ 3:1.
2. Odak halkası her zaman görünür: `outline: 2px solid var(--pl-accent); outline-offset: 2px;` — `outline: none` yasak.
3. Tıklanabilir alan ≥ 28×28 (eklentide), ≥ 34×34 (masaüstü).
4. Yalnız renkle durum gösterilmez (ikon + metin).
5. Modal: odak tuzağı, `Esc` kapatır, kapanınca odak tetikleyiciye döner. Native `<dialog>` tercih edilir.
6. Tüm form alanlarında `<label>`; hata metni `aria-describedby` ile bağlanır.
7. Türkçe arayüz için kök öğede `lang="tr"`.

---

## 9. İçerik ve Ses

- **Dil:** Türkçe, "sen" değil "siz" yerine **nötr emir kipi** ("Eklentiyi kur", "Arşivle"). Buton metni fiil ile başlar.
- **Kısa:** Buton ≤ 3 kelime, toast ≤ 1 cümle, boş durum = 1 başlık + 1 cümle + 1 eylem.
- **Yıkıcı eylem adı:** "Sil" yerine **"Arşivle"**; gerçekten kalıcıysa "Kalıcı olarak kaldır" + yazılı onay.
- **Hata mesajı formülü:** ne oldu + neden (biliniyorsa) + ne yapılmalı. "Bağlantı kurulamadı. Telegram oturumu sona ermiş olabilir. Yeniden giriş yap."
- **AI (MyMind) çıktıları** her zaman "MyMind" rozetiyle işaretlenir ve kaynak/güven bilgisi gösterir.

---

## 10. Komponent Yazım Kuralları (ajanlar için)

1. Önce `references/KOMPONENTLER.md` içinde karşılığı ara; varsa **aynısını** kullan, yeni varyant türetme.
2. Renk, boşluk, köşe, süre **asla sabit değer** olmaz; yalnız `var(--pl-…)`.
3. Sınıf adlandırma: `pl-<komponent>` · varyant `pl-<komponent>--<varyant>` · parça `pl-<komponent>__<parça>` · durum `is-<durum>` (`is-active`, `is-loading`).
4. Durumlar eksiksiz tasarlanır: varsayılan, hover, odak, aktif, devre dışı, yükleniyor, hata, boş.
5. React/Vue/Svelte'de sınıf adları aynen korunur; framework bileşeni yalnız sarmalayıcıdır.
6. Yeni komponent eklenirse: `build/components.py` kaynağına eklenir → `KOMPONENTLER.md`, `pl-components.json` ve galeri yeniden üretilir. Elle düzenlenmiş çıktı kabul edilmez.
7. Her komponentin kimliği kalıcıdır (`PLC-001` …). Kaldırılan komponent silinmez, `durum: arsiv` olarak işaretlenir.

---

## 11. Kontrol Listesi (her PR / her ekran)

- [ ] `[data-pl]` kapsayıcısı var, global seçici yok
- [ ] Sabit renk/boşluk yok (`grep -E "#[0-9a-f]{3,6}|[0-9]+px"` komponent CSS'inde yalnız token dosyasında çıkar)
- [ ] Doğru `data-pl-product` aksanı
- [ ] Karanlık + açık tema kontrol edildi
- [ ] Klavye ile baştan sona gezilebiliyor, odak halkası görünür
- [ ] Boş, yükleniyor, hata durumları var
- [ ] Türkçe biçimler (tarih, para) doğru
- [ ] Mevcut ekranla yan yana ekran görüntüsü karşılaştırıldı

---

## 12. Dosya Haritası

```
pluginlabs-design/
├── SKILL.md                         ← ajan giriş noktası (Claude Code + Codex)
├── agents/openai.yaml               ← Codex arayüz meta verisi
├── references/
│   ├── TASARIM-PRENSIPLERI.md       ← bu dosya
│   └── KOMPONENTLER.md              ← 79 komponent: amaç, durum, sınıf, erişilebilirlik, HTML
└── assets/
    ├── pl-tokens.css                ← tokenlar (kapsüllü)
    ├── pl-tokens.json               ← tokenlar (W3C DTCG biçimi, AstraOS/API uyumlu)
    ├── pl-components.css            ← komponent stilleri (kapsüllü)
    ├── pl-components.json           ← komponent kataloğu (normalize, API uyumlu)
    └── pl-galeri.html               ← tüm komponentlerin canlı önizlemesi
```
