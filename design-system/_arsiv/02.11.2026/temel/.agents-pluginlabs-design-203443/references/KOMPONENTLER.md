# PluginLabs Komponent Kataloğu

> **Sürüm:** 1.0.0 · **Tarih:** 30.10.2026 · **Adet:** 79 komponent · **Kaynak:** `build/components.py` (bu dosya otomatik üretilir — elle düzenlemeyin)

> Tüm örnekler `[data-pl]` kapsayıcısı içinde çalışır ve `assets/pl-tokens.css` + `assets/pl-components.css` gerektirir. Ürün aksanı için kapsayıcıya `data-pl-product="<kod>"` ekleyin. Canlı önizleme: `assets/pl-galeri.html`.

## Kurulum (her ekran için)

```html
<link rel="stylesheet" href="pl-tokens.css">
<link rel="stylesheet" href="pl-components.css">

<div data-pl data-pl-theme="dark" data-pl-product="leo" lang="tr">
  <!-- PluginLabs komponentleri burada -->
</div>
```

## İçindekiler

| ID | Komponent | Kategori | Ürün |
|---|---|---|---|
| PLC-001 | [Buton](#plc-001) | Temel | — |
| PLC-002 | [İkon Buton](#plc-002) | Temel | — |
| PLC-003 | [Segment Kontrol](#plc-003) | Temel | — |
| PLC-004 | [Bölünmüş Buton](#plc-004) | Temel | — |
| PLC-005 | [Bağlantı](#plc-005) | Temel | — |
| PLC-006 | [Rozet](#plc-006) | Temel | — |
| PLC-007 | [Durum Pili](#plc-007) | Temel | — |
| PLC-008 | [Etiket / Chip](#plc-008) | Temel | — |
| PLC-009 | [Avatar](#plc-009) | Temel | — |
| PLC-010 | [Avatar Grubu](#plc-010) | Temel | — |
| PLC-011 | [Klavye Kısayolu](#plc-011) | Temel | — |
| PLC-012 | [Ayraç](#plc-012) | Temel | — |
| PLC-013 | [Yükleniyor Göstergesi](#plc-013) | Temel | — |
| PLC-014 | [İskelet](#plc-014) | Temel | — |
| PLC-015 | [İpucu (Tooltip)](#plc-015) | Temel | — |
| PLC-016 | [Metin Girişi](#plc-016) | Form | — |
| PLC-017 | [Arama Kutusu](#plc-017) | Form | — |
| PLC-018 | [Çok Satırlı Metin](#plc-018) | Form | — |
| PLC-019 | [Seçim Kutusu](#plc-019) | Form | — |
| PLC-020 | [Onay Kutusu](#plc-020) | Form | — |
| PLC-021 | [Radyo Grubu](#plc-021) | Form | — |
| PLC-022 | [Anahtar (Toggle)](#plc-022) | Form | — |
| PLC-023 | [Kaydırıcı](#plc-023) | Form | — |
| PLC-024 | [Sayı Adımlayıcı](#plc-024) | Form | — |
| PLC-025 | [Dosya Bırakma Alanı](#plc-025) | Form | — |
| PLC-026 | [Renk Seçici](#plc-026) | Form | — |
| PLC-027 | [Form Alanı (Etiket + Yardım + Hata)](#plc-027) | Form | — |
| PLC-028 | [Hub Kenar Çubuğu](#plc-028) | Gezinme | PluginLabs Hub |
| PLC-029 | [Pencere Başlık Çubuğu](#plc-029) | Gezinme | PluginLabs Hub |
| PLC-030 | [Sekmeler](#plc-030) | Gezinme | — |
| PLC-031 | [Yol İzi](#plc-031) | Gezinme | — |
| PLC-032 | [Sayfalama](#plc-032) | Gezinme | — |
| PLC-033 | [Komut Paleti](#plc-033) | Gezinme | PluginLabs Hub |
| PLC-034 | [Açılır / Bağlam Menüsü](#plc-034) | Gezinme | — |
| PLC-035 | [Sihirbaz Adımları](#plc-035) | Gezinme | — |
| PLC-036 | [KPI Kartı](#plc-036) | Veri | — |
| PLC-037 | [Veri Tablosu](#plc-037) | Veri | — |
| PLC-038 | [İlerleme Çubuğu](#plc-038) | Veri | — |
| PLC-039 | [İlerleme Halkası](#plc-039) | Veri | — |
| PLC-040 | [Mini Grafik Kartı](#plc-040) | Veri | — |
| PLC-041 | [Dağılım Çubuğu](#plc-041) | Veri | — |
| PLC-042 | [Zaman Çizelgesi / Etkinlik Günlüğü](#plc-042) | Veri | — |
| PLC-043 | [Anahtar–Değer Listesi](#plc-043) | Veri | — |
| PLC-044 | [Boş Durum](#plc-044) | Veri | — |
| PLC-045 | [Kod Bloğu](#plc-045) | Veri | — |
| PLC-046 | [Akordeon](#plc-046) | Veri | — |
| PLC-047 | [Uyarı Kutusu (Callout)](#plc-047) | Geri Bildirim | — |
| PLC-048 | [Toast Bildirimi](#plc-048) | Geri Bildirim | — |
| PLC-049 | [Duyuru Bandı](#plc-049) | Geri Bildirim | — |
| PLC-050 | [Modal Diyalog](#plc-050) | Katman | — |
| PLC-051 | [Arşivle Onayı](#plc-051) | Katman | — |
| PLC-052 | [Çekmece (Yan Sayfa)](#plc-052) | Katman | — |
| PLC-053 | [Uygulama Logo Karosu](#plc-053) | Ürün Kalıpları | — |
| PLC-054 | [Uygulama Kartı (Katalog)](#plc-054) | Ürün Kalıpları | Leo Helper |
| PLC-055 | [Kurulum / İndirme Satırı](#plc-055) | Ürün Kalıpları | PluginLabs Hub |
| PLC-056 | [Eklenti Popup İskeleti](#plc-056) | Ürün Kalıpları | Leo Helper |
| PLC-057 | [İzin İsteği Kartı](#plc-057) | Ürün Kalıpları | Extension Manager |
| PLC-058 | [Eklenti Satırı (Anahtarlı)](#plc-058) | Ürün Kalıpları | Extension Manager |
| PLC-059 | [Ürün / Fiyat Kartı](#plc-059) | Ürün Kalıpları | MyWishlist |
| PLC-060 | [AI Mesaj Balonu (MyMind)](#plc-060) | Ürün Kalıpları | MyMind |
| PLC-061 | [AI Prompt Kompozitörü](#plc-061) | Ürün Kalıpları | MyMind |
| PLC-062 | [Dock / Başlatıcı (Flow Dock)](#plc-062) | Ürün Kalıpları | Flow Dock |
| PLC-063 | [Sistem Metrik Karosu (Tweakster)](#plc-063) | Ürün Kalıpları | Tweakster |
| PLC-064 | [Tarif Kartı (Mutfak Atölyesi)](#plc-064) | Ürün Kalıpları | Mutfak Atölyesi |
| PLC-065 | [Kod Çıkarım Kartı (Leo Helper)](#plc-065) | Ürün Kalıpları | Leo Helper |
| PLC-066 | [Not Kartı (Mind Palace)](#plc-066) | Ürün Kalıpları | Mind Palace |
| PLC-067 | [Ayar Satırı](#plc-067) | Ürün Kalıpları | — |
| PLC-068 | [Karşılama Kahramanı](#plc-068) | Ürün Kalıpları | PluginLabs Hub |
| PLC-069 | [Plan / Abonelik Kartı](#plc-069) | Ürün Kalıpları | — |
| PLC-070 | [Bildirim Merkezi](#plc-070) | Ürün Kalıpları | PluginLabs Hub |
| PLC-071 | [Kazıma Görevi Kartı (Scrapper)](#plc-071) | Ürün Kalıpları | The Ultimate Scrapper |
| PLC-072 | [Palet Çıkarım Paneli (Design Replicator)](#plc-072) | Ürün Kalıpları | Design Replicator |
| PLC-073 | [Bütçe Göstergesi (MyWishlist)](#plc-073) | Ürün Kalıpları | MyWishlist |
| PLC-074 | [Bağlantı Kurulum Kartı](#plc-074) | Ürün Kalıpları | Leo Helper |
| PLC-075 | [Kısayol Listesi](#plc-075) | Ürün Kalıpları | — |
| PLC-076 | [Güncelleme Kartı](#plc-076) | Ürün Kalıpları | PluginLabs Hub |
| PLC-077 | [Filtre Çubuğu](#plc-077) | Ürün Kalıpları | — |
| PLC-078 | [Yan Panel İskeleti](#plc-078) | Ürün Kalıpları | Mind Palace |
| PLC-079 | [Kategori Etiketli Liste](#plc-079) | Ürün Kalıpları | — |


---

## Temel (15)

### PLC-001

**Buton** · `button`

- **Amaç:** Birincil eylem tetikleyicisi. Beş varyant, üç boyut.
- **Ne zaman:** Ekranda tek bir birincil buton olur; diğerleri secondary/ghost.
- **Durumlar:** varsayılan, hover, odak, basılı, devre dışı, yükleniyor
- **Sınıflar:** `pl-btn pl-btn--primary|secondary|ghost|danger|gradient pl-btn--sm|lg pl-btn--block is-loading`
- **Erişilebilirlik:** <button> kullan; yalnız ikonlu ise aria-label zorunlu. Yükleniyorken aria-busy="true".

```html
<div class="pl-row">
  <button class="pl-btn pl-btn--primary"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>Kur</button>
  <button class="pl-btn pl-btn--secondary">Ayrıntılar</button>
  <button class="pl-btn pl-btn--ghost">Vazgeç</button>
  <button class="pl-btn pl-btn--danger"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>Arşivle</button>
  <button class="pl-btn pl-btn--gradient"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7z"/><path d="M5 20h14"/></svg>Pro'ya geç</button>
</div>
<div class="pl-row" style="margin-top:12px">
  <button class="pl-btn pl-btn--primary pl-btn--sm">Küçük</button>
  <button class="pl-btn pl-btn--primary pl-btn--lg">Büyük</button>
  <button class="pl-btn pl-btn--primary is-loading" aria-busy="true">Kuruluyor</button>
  <button class="pl-btn pl-btn--secondary" disabled>Devre dışı</button>
</div>
```

### PLC-002

**İkon Buton** · `icon-button`

- **Amaç:** Araç çubukları ve satır eylemleri için kare buton.
- **Ne zaman:** Eylemin anlamı ikonla evrensel olarak anlaşılıyorsa (ayarlar, kapat, daha fazla).
- **Durumlar:** varsayılan, hover, aktif (is-active), outline
- **Sınıflar:** `pl-iconbtn pl-iconbtn--outline pl-iconbtn--sm is-active`
- **Erişilebilirlik:** aria-label ve title zorunlu; toggle ise aria-pressed.

```html
<div class="pl-row">
  <button class="pl-iconbtn" aria-label="Ara"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button>
  <button class="pl-iconbtn is-active" aria-label="Sabitle" aria-pressed="true"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg></button>
  <button class="pl-iconbtn pl-iconbtn--outline" aria-label="Ayarlar"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
  <button class="pl-iconbtn pl-iconbtn--outline" aria-label="Daha fazla"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
  <button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kapat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
</div>
```

### PLC-003

**Segment Kontrol** · `segmented`

- **Amaç:** 2–5 karşılıklı dışlayan görünüm/filtre arasında geçiş.
- **Ne zaman:** Görünüm modu (ızgara/liste), zaman aralığı, kapsam seçimi.
- **Durumlar:** seçili, hover
- **Sınıflar:** `pl-segment > button.is-active`
- **Erişilebilirlik:** role="tablist" + role="tab" + aria-selected; ok tuşlarıyla gezinme.

```html
<div class="pl-segment" role="tablist">
  <button class="is-active" role="tab" aria-selected="true"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>Izgara</button>
  <button role="tab"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>Liste</button>
  <button role="tab">Tablo</button>
</div>
```

### PLC-004

**Bölünmüş Buton** · `split-button`

- **Amaç:** Varsayılan eylem + açılır alternatifler.
- **Ne zaman:** 'Kur' varsayılan, 'Belirli sürümü kur' gibi alternatifler varsa.
- **Durumlar:** varsayılan, menü açık
- **Sınıflar:** `pl-split > .pl-btn + .pl-btn`
- **Erişilebilirlik:** Ok butonu aria-haspopup="menu" ve aria-expanded taşır.

```html
<div class="pl-split">
  <button class="pl-btn pl-btn--primary"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>Tümünü güncelle</button>
  <button class="pl-btn pl-btn--primary" aria-label="Diğer seçenekler" aria-haspopup="menu"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
</div>
```

### PLC-005

**Bağlantı** · `link`

- **Amaç:** Metin içi gezinme ve ikincil eylem.
- **Ne zaman:** Sayfa değiştiren eylemler; buton yerine metin akışında.
- **Durumlar:** varsayılan, hover (alt çizgi)
- **Sınıflar:** `pl-link`
- **Erişilebilirlik:** Dış bağlantılarda ikon + rel="noopener"; yalnız 'buraya tıkla' metni yasak.

```html
<p style="margin:0">Sürüm notlarını <a class="pl-link" href="#">değişiklik günlüğünde</a> bulabilirsiniz. <a class="pl-link" href="#">GitHub <svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></a></p>
```

### PLC-006

**Rozet** · `badge`

- **Amaç:** Kısa meta bilgi: sürüm, durum, sayı, Pro.
- **Ne zaman:** Bir öğenin niteliğini 1–2 kelimeyle işaretlemek için.
- **Durumlar:** nötr, accent, success, warning, danger, info, pro, count
- **Sınıflar:** `pl-badge pl-badge--accent|success|warning|danger|info|pro|count`
- **Erişilebilirlik:** Sayaç rozetlerinde görünmez metin: <span class="sr-only">3 bildirim</span>.

```html
<div class="pl-row">
  <span class="pl-badge">v2.4.1</span><span class="pl-badge pl-badge--accent">Yeni</span>
  <span class="pl-badge pl-badge--success">Kurulu</span><span class="pl-badge pl-badge--warning">Güncelleme</span>
  <span class="pl-badge pl-badge--danger">Hata</span><span class="pl-badge pl-badge--info">Beta</span>
  <span class="pl-badge pl-badge--pro">Pro</span><span class="pl-badge pl-badge--count">12</span>
</div>
```

### PLC-007

**Durum Pili** · `status-pill`

- **Amaç:** Canlı bağlantı/senkron durumu; nokta + metin.
- **Ne zaman:** Telegram bağlantısı, MyMind sunucu durumu, senkron gibi sürekli durumlar.
- **Durumlar:** online, syncing (nabız), warning, error, offline
- **Sınıflar:** `pl-status pl-status--online|syncing|warning|error`
- **Erişilebilirlik:** Renk tek başına değil, metin her zaman yazılır; değişince aria-live="polite".

```html
<div class="pl-row">
  <span class="pl-status pl-status--online">Bağlı</span>
  <span class="pl-status pl-status--syncing">Eşitleniyor</span>
  <span class="pl-status pl-status--warning">Kota %90</span>
  <span class="pl-status pl-status--error">Bağlantı koptu</span>
  <span class="pl-status">Çevrimdışı</span>
</div>
```

### PLC-008

**Etiket / Chip** · `tag`

- **Amaç:** Filtre, kategori ve kullanıcı etiketleri; kaldırılabilir.
- **Ne zaman:** Çoklu seçim filtreleri, not etiketleri, arama kapsamları.
- **Durumlar:** varsayılan, seçili, kaldırılabilir
- **Sınıflar:** `pl-tag pl-tag.is-selected > button`
- **Erişilebilirlik:** Kaldır butonu aria-label="<etiket> etiketini kaldır".

```html
<div class="pl-row">
  <span class="pl-tag is-selected">Tarayıcı eklentisi<button aria-label="Kaldır"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></span>
  <span class="pl-tag">Masaüstü<button aria-label="Kaldır"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></span>
  <span class="pl-tag">AI<button aria-label="Kaldır"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></span>
</div>
```

### PLC-009

**Avatar** · `avatar`

- **Amaç:** Kullanıcı ya da kanal kimliği; baş harf veya görsel.
- **Ne zaman:** Hesap menüsü, Telegram kanal listesi, yorumlar.
- **Durumlar:** sm, md, lg, accent, çevrimiçi
- **Sınıflar:** `pl-avatar pl-avatar--sm|lg pl-avatar--accent is-online`
- **Erişilebilirlik:** Görselde alt, baş harfte aria-label ile tam ad.

```html
<div class="pl-row">
  <span class="pl-avatar pl-avatar--sm">MI</span>
  <span class="pl-avatar is-online" aria-label="Muhammed Ilgaz">MI</span>
  <span class="pl-avatar pl-avatar--accent">PL</span>
  <span class="pl-avatar pl-avatar--lg pl-avatar--accent is-online">LH</span>
</div>
```

### PLC-010

**Avatar Grubu** · `avatar-group`

- **Amaç:** Üst üste binen avatarlar + fazlalık sayacı.
- **Ne zaman:** Paylaşılan pano, takip edilen kanallar, ortak çalışanlar.
- **Sınıflar:** `pl-avatars > .pl-avatar`
- **Erişilebilirlik:** Grup için aria-label="5 kişi".

```html
<div class="pl-avatars" aria-label="5 kanal">
  <span class="pl-avatar pl-avatar--accent">TG</span><span class="pl-avatar">KD</span>
  <span class="pl-avatar">FX</span><span class="pl-avatar">+2</span>
</div>
```

### PLC-011

**Klavye Kısayolu** · `kbd`

- **Amaç:** Kısayol tuşlarının gösterimi.
- **Ne zaman:** Menülerde, tooltiplerde, komut paletinde, arama kutusunda.
- **Sınıflar:** `pl-kbd`
- **Erişilebilirlik:** <kbd> elementi kullanılabilir; Windows'ta Ctrl, macOS'ta ⌘ gösterilir.

```html
<div class="pl-row"><span class="pl-kbd">Ctrl</span><span class="pl-kbd">K</span>
<span class="pl-muted">·</span><span class="pl-kbd">⇧</span><span class="pl-kbd">⌘</span><span class="pl-kbd">P</span>
<span class="pl-muted">·</span><span class="pl-kbd">Esc</span></div>
```

### PLC-012

**Ayraç** · `divider`

- **Amaç:** Bölümleri ayıran ince çizgi, etiketli varyant.
- **Ne zaman:** Liste grupları, 'veya' ayrımı, form bölümleri.
- **Sınıflar:** `pl-divider pl-divider--label`
- **Erişilebilirlik:** Dekoratifse role="none"; anlamlıysa <hr>.

```html
<div><span class="pl-muted">Üst içerik</span><hr class="pl-divider">
<div class="pl-divider pl-divider--label"><span class="pl-label">veya</span></div></div>
```

### PLC-013

**Yükleniyor Göstergesi** · `spinner`

- **Amaç:** Belirsiz süreli bekleme.
- **Ne zaman:** <1 sn'den uzun, süresi bilinmeyen işlemler; buton içinde is-loading tercih edilir.
- **Sınıflar:** `pl-spinner pl-spinner--lg`
- **Erişilebilirlik:** role="status" + aria-label="Yükleniyor".

```html
<div class="pl-row"><span class="pl-spinner" role="status" aria-label="Yükleniyor"></span>
<span class="pl-spinner pl-spinner--lg"></span><span class="pl-muted">MyMind düşünüyor…</span></div>
```

### PLC-014

**İskelet** · `skeleton`

- **Amaç:** İçerik yerleşimini önceden gösteren yükleme yer tutucusu.
- **Ne zaman:** Liste/kart yüklemelerinde, 300 ms'den uzun beklemelerde.
- **Sınıflar:** `pl-skeleton`
- **Erişilebilirlik:** Kapsayıcıya aria-busy="true"; iskelet öğeleri aria-hidden.

```html
<div class="pl-row" style="flex-wrap:nowrap;align-items:flex-start" aria-busy="true">
  <div class="pl-skeleton" style="width:40px;height:40px;border-radius:10px;flex:none"></div>
  <div class="pl-stack" style="flex:1;gap:8px"><div class="pl-skeleton" style="height:12px;width:60%"></div>
  <div class="pl-skeleton" style="height:10px;width:90%"></div><div class="pl-skeleton" style="height:10px;width:75%"></div></div>
</div>
```

### PLC-015

**İpucu (Tooltip)** · `tooltip`

- **Amaç:** Kısa açıklama veya kısayol bilgisi.
- **Ne zaman:** İkon butonlarda, kısaltılmış metinlerde. Asla kritik bilgi taşımaz.
- **Sınıflar:** `pl-tooltip`
- **Erişilebilirlik:** role="tooltip" + tetikleyicide aria-describedby; odakla da açılır, Esc kapatır.

```html
<div style="padding-top:4px"><span class="pl-tooltip" role="tooltip">Sabitle <span class="pl-kbd" style="height:16px;margin-left:4px">P</span></span></div>
```


---

## Form (12)

### PLC-016

**Metin Girişi** · `text-input`

- **Amaç:** Tek satır metin girişi; ikonlu varyant.
- **Ne zaman:** Ad, URL, API anahtarı, arama dışı serbest metin.
- **Durumlar:** varsayılan, hover, odak, hata, devre dışı
- **Sınıflar:** `pl-input pl-inputwrap`
- **Erişilebilirlik:** Her zaman <label>; placeholder etiketin yerine geçmez.

```html
<div class="pl-stack">
  <input class="pl-input" placeholder="Telegram kanal bağlantısı">
  <div class="pl-inputwrap"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><input class="pl-input" value="https://t.me/indirimler"></div>
</div>
```

### PLC-017

**Arama Kutusu** · `search-input`

- **Amaç:** İkon + kısayol ipuçlu arama alanı.
- **Ne zaman:** Liste filtreleme, katalog araması; global arama için Komut Paleti.
- **Sınıflar:** `pl-inputwrap > .pl-ico + .pl-input + .pl-kbd`
- **Erişilebilirlik:** type="search" ve role="searchbox"; sonuç sayısı aria-live ile duyurulur.

```html
<div class="pl-inputwrap"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input class="pl-input" type="search" placeholder="Uygulama veya eklenti ara"><span class="pl-kbd">/</span></div>
```

### PLC-018

**Çok Satırlı Metin** · `textarea`

- **Amaç:** Uzun metin girişi, dikey boyutlanabilir.
- **Ne zaman:** Not, açıklama, prompt şablonu.
- **Sınıflar:** `pl-textarea`
- **Erişilebilirlik:** Karakter sınırı varsa sayaç aria-live ile.

```html
<textarea class="pl-textarea" placeholder="Bu eklentinin ne yapmasını istiyorsunuz?"></textarea>
```

### PLC-019

**Seçim Kutusu** · `select`

- **Amaç:** Native <select> üzerine token tabanlı stil.
- **Ne zaman:** 5+ seçenekli tekli seçim; 2–4 seçenek için Segment veya Radyo.
- **Sınıflar:** `pl-select`
- **Erişilebilirlik:** Native select klavye ve ekran okuyucu uyumludur; özel dropdown yazma.

```html
<select class="pl-select"><option>Varsayılan model: MyMind Pro</option><option>Gemini Pro</option><option>Yerel — Ollama</option><option>Yerel — LM Studio</option></select>
```

### PLC-020

**Onay Kutusu** · `checkbox`

- **Amaç:** Bağımsız çoklu seçim; belirsiz (indeterminate) durumu destekler.
- **Ne zaman:** Listelerde toplu seçim, izin onayı, birden fazla seçenek.
- **Durumlar:** boş, seçili, belirsiz, devre dışı
- **Sınıflar:** `pl-check > input[type=checkbox]`
- **Erişilebilirlik:** Etiket input'u saran <label> içinde; belirsizlik JS ile el.indeterminate=true.

```html
<div class="pl-stack" style="gap:10px">
  <label class="pl-check"><input type="checkbox" checked> Başlangıçta çalıştır</label>
  <label class="pl-check"><input type="checkbox" class="js-indet"> Tümünü seç (3/7)</label>
  <label class="pl-check"><input type="checkbox"> Anonim kullanım verisi gönder</label>
</div>
```

### PLC-021

**Radyo Grubu** · `radio`

- **Amaç:** Tek seçim, tüm seçenekler görünür.
- **Ne zaman:** 2–5 seçenek ve kullanıcının hepsini görmesi önemliyse.
- **Sınıflar:** `pl-radio > input[type=radio]`
- **Erişilebilirlik:** <fieldset> + <legend>; aynı name.

```html
<fieldset style="border:0;padding:0;margin:0" class="pl-stack"><legend class="pl-label" style="margin-bottom:8px">Güncelleme kanalı</legend>
  <label class="pl-radio"><input type="radio" name="ch" checked> Kararlı</label>
  <label class="pl-radio"><input type="radio" name="ch"> Beta</label>
  <label class="pl-radio"><input type="radio" name="ch"> Gece derlemesi</label>
</fieldset>
```

### PLC-022

**Anahtar (Toggle)** · `switch`

- **Amaç:** Anında etki eden açık/kapalı ayarı.
- **Ne zaman:** Değişiklik 'Kaydet' gerektirmiyorsa. Gerektiriyorsa onay kutusu kullan.
- **Sınıflar:** `pl-switch > input[type=checkbox][role=switch]`
- **Erişilebilirlik:** role="switch" + aria-checked.

```html
<div class="pl-stack" style="gap:10px">
  <label class="pl-switch"><input type="checkbox" role="switch" checked> Otomatik güncelle</label>
  <label class="pl-switch"><input type="checkbox" role="switch"> Sessiz mod</label>
</div>
```

### PLC-023

**Kaydırıcı** · `slider`

- **Amaç:** Sürekli değer seçimi; dolgu --pl-val ile.
- **Ne zaman:** Ses, opaklık, AI yaratıcılık (temperature), önbellek boyutu.
- **Sınıflar:** `pl-slider (style="--pl-val:62%")`
- **Erişilebilirlik:** Native range; aria-valuetext ile birimli değer ("%62").

```html
<div class="pl-field"><div class="pl-field__label">Yaratıcılık <span class="pl-num">0,62</span></div>
<input class="pl-slider" type="range" value="62" style="--pl-val:62%" aria-valuetext="0,62"></div>
```

### PLC-024

**Sayı Adımlayıcı** · `number-stepper`

- **Amaç:** Küçük tam sayı ayarları için +/− kontrol.
- **Ne zaman:** Porsiyon sayısı, eşzamanlı indirme, yeniden deneme sayısı.
- **Sınıflar:** `pl-numstep > button + input + button`
- **Erişilebilirlik:** input type="number" + min/max; butonlarda aria-label.

```html
<div class="pl-numstep"><button aria-label="Azalt">−</button><input type="number" value="4" min="1" max="12"><button aria-label="Artır">+</button></div>
```

### PLC-025

**Dosya Bırakma Alanı** · `dropzone`

- **Amaç:** Sürükle-bırak veya tıklayarak dosya yükleme.
- **Ne zaman:** Eklenti paketi (.crx/.zip), tasarım görseli, içe aktarma dosyası.
- **Durumlar:** varsayılan, sürükleniyor (is-dragover), yükleniyor, hata
- **Sınıflar:** `pl-dropzone pl-dropzone__icon is-dragover`
- **Erişilebilirlik:** Gizli <input type=file> + görünür buton; klavye ile erişilebilir.

```html
<div class="pl-dropzone"><div class="pl-dropzone__icon"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg></div>
<b style="color:var(--pl-fg-1)">Dosyayı buraya bırakın</b><span>.json, .csv veya .zip · en fazla 50 MB</span>
<button class="pl-btn pl-btn--secondary pl-btn--sm">Dosya seç</button></div>
```

### PLC-026

**Renk Seçici** · `color-swatches`

- **Amaç:** Önceden tanımlı renk paleti seçimi.
- **Ne zaman:** Not/etiket rengi, tema aksanı, Design Replicator palet çıkarımı.
- **Sınıflar:** `pl-swatches > .pl-swatch.is-selected`
- **Erişilebilirlik:** role="radiogroup"; her renk aria-label ile adlandırılır.

```html
<div class="pl-swatches" role="radiogroup">
  <button class="pl-swatch is-selected" style="background:#7c6cff" aria-label="Iris"></button>
  <button class="pl-swatch" style="background:#22d3ee" aria-label="Cyan"></button>
  <button class="pl-swatch" style="background:#f472b6" aria-label="Pembe"></button>
  <button class="pl-swatch" style="background:#fb923c" aria-label="Turuncu"></button>
  <button class="pl-swatch" style="background:#a3e635" aria-label="Limon"></button>
  <button class="pl-swatch" style="background:#f0b429" aria-label="Altın"></button>
</div>
```

### PLC-027

**Form Alanı (Etiket + Yardım + Hata)** · `form-field`

- **Amaç:** Etiket, giriş, yardım ve hata metnini birleştiren sarmalayıcı.
- **Ne zaman:** Her form girişi bu sarmalayıcıyla kullanılır.
- **Durumlar:** normal, hata (is-error)
- **Sınıflar:** `pl-field pl-field__label pl-field__help is-error`
- **Erişilebilirlik:** Yardım/hata metni aria-describedby; hata durumunda aria-invalid="true".

```html
<div class="pl-row" style="align-items:flex-start;flex-wrap:nowrap;gap:16px">
<div class="pl-field" style="flex:1"><label class="pl-field__label">API anahtarı <span class="pl-muted">Zorunlu</span></label>
<input class="pl-input" placeholder="sk-…"><span class="pl-field__help">Anahtar yalnız bu cihazda şifreli saklanır.</span></div>
<div class="pl-field is-error" style="flex:1"><label class="pl-field__label">Sunucu adresi</label>
<input class="pl-input" value="localhost:11434x" aria-invalid="true"><span class="pl-field__help">Geçerli bir port girin (örn. 11434).</span></div></div>
```


---

## Gezinme (8)

### PLC-028

**Hub Kenar Çubuğu** · `hub-sidebar` · Ürün: PluginLabs Hub (`data-pl-product="hub"`)

- **Amaç:** PluginLabs Hub'ın ana gezinmesi: marka, bölümler, uygulamalar.
- **Ne zaman:** Masaüstü Hub ve tam ekran web panellerinde birincil gezinme.
- **Sınıflar:** `pl-sidebar pl-sidebar__brand pl-sidebar__section pl-navitem.is-active`
- **Erişilebilirlik:** <nav aria-label="Ana menü">; aktif öğede aria-current="page".

```html
<nav class="pl-sidebar" aria-label="Ana menü" style="height:auto">
  <div class="pl-sidebar__brand"><span class="pl-applogo pl-applogo--sm" style="background:var(--pl-brand-gradient)">PL</span>PluginLabs</div>
  <a class="pl-navitem is-active" aria-current="page"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>Ana sayfa</a>
  <a class="pl-navitem"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>Uygulamalar<span class="pl-badge pl-badge--count">3</span></a>
  <a class="pl-navitem"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.4 14.6a2.5 2.5 0 1 0 0-5H18V6a2 2 0 0 0-2-2h-3.6V2.6a2.5 2.5 0 1 0-5 0V4H4a2 2 0 0 0-2 2v3.6h1.4a2.5 2.5 0 1 1 0 5H2V18a2 2 0 0 0 2 2h3.6v-1.4a2.5 2.5 0 1 1 5 0V20H16a2 2 0 0 0 2-2v-3.4z"/></svg>Eklentiler</a>
  <a class="pl-navitem"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M21 5h-4"/></svg>MyMind</a>
  <div class="pl-sidebar__section pl-label">Kurulu</div>
  <a class="pl-navitem"><span class="pl-navitem__dot" style="background:#22d3ee"></span>Leo Helper</a>
  <a class="pl-navitem"><span class="pl-navitem__dot" style="background:#2dd4bf"></span>Flow Dock</a>
  <a class="pl-navitem"><span class="pl-navitem__dot" style="background:#a3e635"></span>Tweakster<span class="pl-badge pl-badge--warning">↑</span></a>
</nav>
```

### PLC-029

**Pencere Başlık Çubuğu** · `titlebar` · Ürün: PluginLabs Hub (`data-pl-product="hub"`)

- **Amaç:** Çerçevesiz masaüstü penceresi için başlık, global arama ve pencere kontrolleri.
- **Ne zaman:** Electron/Tauri çerçevesiz pencerelerde (Hub, Flow Dock ayarları, Tweakster).
- **Sınıflar:** `pl-titlebar pl-titlebar__center pl-titlebar__search pl-winctl`
- **Erişilebilirlik:** Sürüklenebilir alan -webkit-app-region: drag; butonlar no-drag ve aria-label'lı.

```html
<div class="pl-titlebar" style="border:1px solid var(--pl-line);border-radius:10px;overflow:hidden">
  <span class="pl-applogo pl-applogo--sm" style="width:20px;height:20px;border-radius:6px;font-size:9px;background:var(--pl-brand-gradient)">PL</span>
  <span class="pl-titlebar__title">PluginLabs Hub</span>
  <div class="pl-titlebar__center"><div class="pl-titlebar__search"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>Her şeyi ara<span class="pl-kbd">Ctrl K</span></div></div>
  <div class="pl-winctl"><button aria-label="Küçült"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button><button aria-label="Büyüt"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="1"/></svg></button><button aria-label="Kapat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
</div>
```

### PLC-030

**Sekmeler** · `tabs`

- **Amaç:** Aynı bağlam içindeki görünümler arası geçiş.
- **Ne zaman:** Uygulama detay sayfası (Genel/Sürümler/İzinler/Ayarlar), yan panel bölümleri.
- **Sınıflar:** `pl-tabs > .pl-tab.is-active`
- **Erişilebilirlik:** role=tablist/tab/tabpanel; ← → ile gezinme, Home/End.

```html
<div class="pl-tabs" role="tablist">
  <button class="pl-tab is-active" role="tab" aria-selected="true">Genel</button>
  <button class="pl-tab" role="tab">Sürümler <span class="pl-badge">14</span></button>
  <button class="pl-tab" role="tab">İzinler</button><button class="pl-tab" role="tab">Ayarlar</button>
</div>
```

### PLC-031

**Yol İzi** · `breadcrumb`

- **Amaç:** Hiyerarşik konum gösterimi.
- **Ne zaman:** 2+ seviye derinlikli sayfalarda (Hub › Eklentiler › Leo Helper › İzinler).
- **Sınıflar:** `pl-breadcrumb`
- **Erişilebilirlik:** <nav aria-label="Yol izi">; son öğe aria-current="page".

```html
<nav class="pl-breadcrumb" aria-label="Yol izi"><a href="#">Hub</a><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg><a href="#">Eklentiler</a><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg><a href="#">Leo Helper</a><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg><span aria-current="page">İzinler</span></nav>
```

### PLC-032

**Sayfalama** · `pagination`

- **Amaç:** Uzun listelerde sayfa geçişi.
- **Ne zaman:** Tablo ve kataloglarda; sonsuz kaydırma yerine konum hissi gerekiyorsa.
- **Sınıflar:** `pl-pagination > button.is-active`
- **Erişilebilirlik:** <nav aria-label="Sayfalama">; aktif sayfa aria-current="page".

```html
<nav class="pl-pagination" aria-label="Sayfalama"><button aria-label="Önceki"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>
<button>1</button><button class="is-active" aria-current="page">2</button><button>3</button><button>…</button><button>12</button>
<button aria-label="Sonraki"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button></nav>
```

### PLC-033

**Komut Paleti** · `command-palette` · Ürün: PluginLabs Hub (`data-pl-product="hub"`)

- **Amaç:** Ctrl/⌘+K ile açılan global arama ve eylem merkezi.
- **Ne zaman:** Her PluginLabs uygulamasında zorunlu. Uygulama, eylem, ayar, belge araması.
- **Sınıflar:** `pl-cmdk pl-cmdk__input pl-cmdk__list pl-cmdk__group pl-menuitem pl-cmdk__foot`
- **Erişilebilirlik:** role="combobox" + listbox; aria-activedescendant; ↑↓ Enter Esc.

```html
<div class="pl-cmdk" role="dialog" aria-label="Komut paleti">
  <div class="pl-cmdk__input"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input value="leo" aria-label="Komut ara"><span class="pl-kbd">Esc</span></div>
  <div class="pl-cmdk__list">
    <div class="pl-cmdk__group pl-label">Uygulamalar</div>
    <div class="pl-menuitem is-active"><span class="pl-applogo pl-applogo--sm" data-pl-product="leo" style="width:22px;height:22px;font-size:9px">LH</span>Leo Helper'ı aç<span class="pl-kbd">↵</span></div>
    <div class="pl-menuitem"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>Leo Helper — kanalları yenile</div>
    <div class="pl-cmdk__group pl-label">Eylemler</div>
    <div class="pl-menuitem"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>Güncellemeleri denetle<span class="pl-menuitem__meta">Ctrl U</span></div>
  </div>
  <div class="pl-cmdk__foot"><span><span class="pl-kbd">↑</span><span class="pl-kbd">↓</span> gezin</span><span><span class="pl-kbd">↵</span> aç</span><span><span class="pl-kbd">Tab</span> eylemler</span></div>
</div>
```

### PLC-034

**Açılır / Bağlam Menüsü** · `menu`

- **Amaç:** Satır ve öğe eylemleri listesi.
- **Ne zaman:** 'Daha fazla' butonu, sağ tık, bölünmüş buton açılımı.
- **Sınıflar:** `pl-menu pl-menuitem pl-menuitem--danger pl-menuitem__meta`
- **Erişilebilirlik:** role="menu"/"menuitem"; ↑↓ gezinme, ilk harfle atlama, Esc kapatır.

```html
<div class="pl-menu" role="menu">
  <div class="pl-menuitem" role="menuitem"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>Aç<span class="pl-kbd">↵</span></div>
  <div class="pl-menuitem" role="menuitem"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>Dock'a sabitle</div>
  <div class="pl-menuitem" role="menuitem"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Kimliği kopyala<span class="pl-menuitem__meta">PL-001</span></div>
  <hr><div class="pl-menuitem pl-menuitem--danger" role="menuitem"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>Arşivle</div>
</div>
```

### PLC-035

**Sihirbaz Adımları** · `wizard-steps`

- **Amaç:** Çok adımlı akışlarda ilerleme konumu.
- **Ne zaman:** Kurulum, onboarding, içe aktarma, Scrapper görev oluşturma.
- **Durumlar:** tamamlandı, geçerli, bekliyor
- **Sınıflar:** `pl-steps pl-step.is-done|is-current pl-steps__line.is-done`
- **Erişilebilirlik:** <ol>; geçerli adım aria-current="step".

```html
<div class="pl-steps">
  <div class="pl-step is-done"><span class="pl-step__num"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>Hesap</div><div class="pl-steps__line is-done"></div>
  <div class="pl-step is-done"><span class="pl-step__num">2</span>Uygulamalar</div><div class="pl-steps__line is-done"></div>
  <div class="pl-step is-current" aria-current="step"><span class="pl-step__num">3</span>MyMind</div><div class="pl-steps__line"></div>
  <div class="pl-step"><span class="pl-step__num">4</span>Bitti</div>
</div>
```


---

## Veri (11)

### PLC-036

**KPI Kartı** · `kpi-card`

- **Amaç:** Tek önemli sayı + değişim + bağlam.
- **Ne zaman:** Panoların üst satırı; 3–5 kart yan yana. Biri vurgulanabilir.
- **Sınıflar:** `pl-kpi pl-kpi--highlight pl-kpi__value pl-kpi__delta.is-up|is-down`
- **Erişilebilirlik:** Değişimin yönü metinle de verilir ("%12 artış").

```html
<div class="pl-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
  <div class="pl-kpi pl-kpi--highlight"><span class="pl-label">Kurulu uygulama</span><span class="pl-kpi__value">8</span><span class="pl-kpi__delta is-up"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>+2 bu ay</span></div>
  <div class="pl-kpi"><span class="pl-label">Yakalanan kod</span><span class="pl-kpi__value">1.284</span><span class="pl-kpi__delta is-up"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>%18</span></div>
  <div class="pl-kpi"><span class="pl-label">Tasarruf</span><span class="pl-kpi__value" style="color:var(--pl-gold)">3.420 ₺</span><span class="pl-kpi__delta is-down"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/></svg>%4</span></div>
</div>
```

### PLC-037

**Veri Tablosu** · `data-table`

- **Amaç:** Sıralanabilir, seçilebilir yoğun veri tablosu.
- **Ne zaman:** Fiyat takibi, kurulum geçmişi, log kayıtları, eklenti envanteri.
- **Sınıflar:** `pl-table th td.is-num td.is-strong tr.is-selected`
- **Erişilebilirlik:** <th scope="col">; sıralanabilir başlıkta aria-sort.

```html
<table class="pl-table"><thead><tr><th>Ürün</th><th>Mağaza</th><th class="is-num">Fiyat</th><th class="is-num">Değişim</th><th>Durum</th></tr></thead><tbody>
<tr><td class="is-strong">Kablosuz kulaklık</td><td>Trendyol</td><td class="is-num">1.249,90 ₺</td><td class="is-num" style="color:var(--pl-success)">−%14</td><td><span class="pl-badge pl-badge--success">Düştü</span></td></tr>
<tr class="is-selected"><td class="is-strong">Mekanik klavye</td><td>Hepsiburada</td><td class="is-num">2.899,00 ₺</td><td class="is-num">%0</td><td><span class="pl-badge">Sabit</span></td></tr>
<tr><td class="is-strong">27" monitör</td><td>Amazon TR</td><td class="is-num">7.640,00 ₺</td><td class="is-num" style="color:var(--pl-danger)">+%6</td><td><span class="pl-badge pl-badge--danger">Arttı</span></td></tr>
</tbody></table>
```

### PLC-038

**İlerleme Çubuğu** · `progress-bar`

- **Amaç:** Belirli ve belirsiz ilerleme.
- **Ne zaman:** İndirme, kurulum, kazıma görevi, kota kullanımı.
- **Sınıflar:** `pl-progress > span (style="--pl-val:64%") pl-progress--indeterminate pl-progress--sm`
- **Erişilebilirlik:** role="progressbar" + aria-valuenow/min/max; belirsizde valuenow yok.

```html
<div class="pl-stack">
  <div class="pl-progress" role="progressbar" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100"><span style="--pl-val:64%"></span></div>
  <div class="pl-progress pl-progress--indeterminate" role="progressbar"><span></span></div>
  <div class="pl-progress pl-progress--sm"><span style="--pl-val:92%;background:var(--pl-warning)"></span></div>
</div>
```

### PLC-039

**İlerleme Halkası** · `progress-ring`

- **Amaç:** Dairesel yüzde göstergesi.
- **Ne zaman:** Sistem skoru (Tweakster), profil tamamlama, kota.
- **Sınıflar:** `pl-ring pl-ring--lg (style="--pl-val:72")`
- **Erişilebilirlik:** role="img" + aria-label="%72".

```html
<div class="pl-row" style="gap:16px"><div class="pl-ring" style="--pl-val:72" role="img" aria-label="%72"><span>72</span></div>
<div class="pl-ring pl-ring--lg" style="--pl-val:38" role="img" aria-label="%38"><span>38%</span></div></div>
```

### PLC-040

**Mini Grafik Kartı** · `sparkline-card`

- **Amaç:** Değer + son dönem eğilimini gösteren küçük çizgi grafik.
- **Ne zaman:** Fiyat geçmişi, CPU kullanımı, günlük yakalanan kod sayısı.
- **Sınıflar:** `pl-kpi + inline <svg> (stroke: var(--pl-accent))`
- **Erişilebilirlik:** SVG role="img" + aria-label ile özet ("30 günde %14 düşüş").

```html
<div class="pl-kpi"><div class="pl-row" style="justify-content:space-between"><span class="pl-label">30 günlük fiyat</span><span class="pl-badge pl-badge--success">−%14</span></div>
<span class="pl-kpi__value" style="font-size:22px">1.249,90 ₺</span>
<svg viewBox="0 0 200 48" style="width:100%;height:48px" role="img" aria-label="30 günde yüzde 14 düşüş"><defs><linearGradient id="spk" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--pl-accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--pl-accent)" stop-opacity="0"/></linearGradient></defs>
<path d="M0 12 L20 14 L40 10 L60 16 L80 15 L100 22 L120 20 L140 28 L160 26 L180 34 L200 36 L200 48 L0 48Z" fill="url(#spk)"/><path d="M0 12 L20 14 L40 10 L60 16 L80 15 L100 22 L120 20 L140 28 L160 26 L180 34 L200 36" fill="none" stroke="var(--pl-accent)" stroke-width="2"/></svg></div>
```

### PLC-041

**Dağılım Çubuğu** · `distribution-bar`

- **Amaç:** Bir bütünün kategori paylarını gösteren segmentli çubuk + lejant.
- **Ne zaman:** Disk kullanımı, bütçe dağılımı, eklenti başına bellek.
- **Sınıflar:** `pl-distbar > span (style="flex:<pay>") pl-legend`
- **Erişilebilirlik:** Lejant metni değerleri içerir; renk tek taşıyıcı değildir.

```html
<div class="pl-stack"><div class="pl-distbar"><span style="flex:42;background:#7c6cff"></span><span style="flex:23;background:#22d3ee"></span><span style="flex:18;background:#a3e635"></span><span style="flex:17;background:var(--pl-bg-4)"></span></div>
<div class="pl-legend"><span><i style="background:#7c6cff"></i>Uygulamalar %42</span><span><i style="background:#22d3ee"></i>Önbellek %23</span><span><i style="background:#a3e635"></i>Loglar %18</span><span><i style="background:var(--pl-bg-4)"></i>Boş %17</span></div></div>
```

### PLC-042

**Zaman Çizelgesi / Etkinlik Günlüğü** · `timeline`

- **Amaç:** Kronolojik olaylar; her işlem kaynak → hedef → sonuç ile loglanır.
- **Ne zaman:** Kurulum geçmişi, senkron logu, Leo Helper yakalama akışı.
- **Sınıflar:** `pl-timeline pl-timeline__dot.is-accent|is-success|is-danger pl-timeline__title pl-timeline__meta`
- **Erişilebilirlik:** <ol>; tarih <time datetime>.

```html
<ol class="pl-timeline">
  <li><span class="pl-timeline__dot is-success"></span><div class="pl-timeline__title">Tweakster 1.3.0 kuruldu</div><div class="pl-timeline__meta">30.10.2026 · 00:42 · GitHub → Hub → Başarılı</div></li>
  <li><span class="pl-timeline__dot is-accent"></span><div class="pl-timeline__title">Leo Helper 3 kod yakaladı</div><div class="pl-timeline__meta">29.10.2026 · 23:10 · @indirimler</div></li>
  <li><span class="pl-timeline__dot is-danger"></span><div class="pl-timeline__title">Senkron başarısız</div><div class="pl-timeline__meta">29.10.2026 · 21:05 · zaman aşımı</div></li>
</ol>
```

### PLC-043

**Anahtar–Değer Listesi** · `key-value`

- **Amaç:** Meta veri gösterimi.
- **Ne zaman:** Uygulama detayları, sürüm bilgisi, sistem bilgisi.
- **Sınıflar:** `pl-kv > dt + dd`
- **Erişilebilirlik:** <dl> anlamsal yapısı korunur.

```html
<dl class="pl-kv"><dt>Sürüm</dt><dd class="pl-num">2.4.1</dd><dt>Platform</dt><dd>Chrome · Edge</dd>
<dt>Boyut</dt><dd class="pl-num">1,8 MB</dd><dt>Güncellendi</dt><dd class="pl-num">28.10.2026</dd><dt>Kimlik</dt><dd class="pl-num">PL-002</dd></dl>
```

### PLC-044

**Boş Durum** · `empty-state`

- **Amaç:** Gösterilecek veri yokken yön veren ekran.
- **Ne zaman:** İlk kullanım, boş arama sonucu, boş liste. Her zaman bir eylem önerir.
- **Sınıflar:** `pl-empty pl-empty__art`
- **Erişilebilirlik:** Başlık h2/h3; eylem butonu odaklanabilir.

```html
<div class="pl-empty"><div class="pl-empty__art"><svg class="pl-ico pl-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg></div><h3 class="pl-h3">Henüz kayıtlı ürün yok</h3>
<p class="pl-muted" style="margin:0 0 8px;max-width:260px">Herhangi bir ürün sayfasında kalp ikonuna tıklayın, fiyatını sizin için takip edelim.</p>
<button class="pl-btn pl-btn--primary pl-btn--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg>İlk ürünü ekle</button></div>
```

### PLC-045

**Kod Bloğu** · `code-block`

- **Amaç:** Sözdizimi vurgulu, kopyalanabilir kod / log.
- **Ne zaman:** Kurulum komutu, API yanıtı, Design Replicator CSS çıktısı.
- **Sınıflar:** `pl-code pl-code__head pre .t-k .t-s .t-c .t-n`
- **Erişilebilirlik:** Kopyala butonu aria-label; kopyalandıktan sonra toast.

```html
<div class="pl-code"><div class="pl-code__head"><span class="pl-label">tokens.css</span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kopyala"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div>
<pre><span class="t-c">/* Design Replicator çıktısı */</span>
<span class="t-k">.hero</span> {
  background: <span class="t-s">var(--pl-bg-1)</span>;
  border-radius: <span class="t-n">14px</span>;
}</pre></div>
```

### PLC-046

**Akordeon** · `accordion`

- **Amaç:** Katlanabilir içerik bölümleri.
- **Ne zaman:** SSS, gelişmiş ayarlar, izin ayrıntıları.
- **Sınıflar:** `pl-accordion > details > summary`
- **Erişilebilirlik:** Native <details>/<summary> klavye uyumludur.

```html
<div class="pl-accordion">
<details open><summary>Leo Helper hangi verileri okur?<svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div>Yalnız takip ettiğiniz kanalların mesajları cihazınızda işlenir.</div></details>
<details><summary>Verilerim nerede saklanır?<svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div>Yerel olarak; senkron açıksa şifreli olarak.</div></details></div>
```


---

## Geri Bildirim (3)

### PLC-047

**Uyarı Kutusu (Callout)** · `callout`

- **Amaç:** Sayfa içi kalıcı bilgi/uyarı; sol renkli kenarlık.
- **Ne zaman:** Önemli bağlam, risk, ipucu. Geçici bildirim için Toast.
- **Durumlar:** info, success, warning, danger, accent
- **Sınıflar:** `pl-callout pl-callout--success|warning|danger|accent pl-callout__title`
- **Erişilebilirlik:** Kritikse role="alert", değilse role="note".

```html
<div class="pl-stack">
<div class="pl-callout pl-callout--warning" role="note"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/></svg><div><div class="pl-callout__title">Telegram oturumu 3 gün içinde sona erecek</div>Kesinti yaşamamak için yeniden doğrulayın.</div></div>
<div class="pl-callout pl-callout--accent"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M21 5h-4"/></svg><div><div class="pl-callout__title">MyMind önerisi</div>Bu kanaldaki kodların %80'i 18:00–20:00 arası paylaşılıyor.</div></div></div>
```

### PLC-048

**Toast Bildirimi** · `toast`

- **Amaç:** Geçici, köşede beliren işlem sonucu; geri alma sunar.
- **Ne zaman:** Eylem sonuçları: kaydedildi, kopyalandı, arşivlendi (Geri al).
- **Sınıflar:** `pl-toast pl-toast__body pl-toast__action`
- **Erişilebilirlik:** Kapsayıcı role="status" aria-live="polite"; hata ise role="alert". En az 5 sn.

```html
<div class="pl-stack"><div class="pl-toast" role="status"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg><div class="pl-toast__body">3 eklenti arşivlendi<small>Arşiv › 30.10.2026</small></div><button class="pl-toast__action">Geri al</button></div>
<div class="pl-toast" style="--pl-c:var(--pl-danger)" role="alert"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg><div class="pl-toast__body">Kurulum başarısız<small>İmza doğrulanamadı</small></div><button class="pl-toast__action">Tekrar</button></div></div>
```

### PLC-049

**Duyuru Bandı** · `banner`

- **Amaç:** Sayfa üstünde global, kapatılabilir duyuru.
- **Ne zaman:** Güncelleme mevcut, bakım, yeni özellik tanıtımı.
- **Sınıflar:** `pl-banner pl-banner__text`
- **Erişilebilirlik:** Kapat butonu aria-label; tekrar gösterilmeme tercihi saklanır.

```html
<div class="pl-banner"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M21 5h-4"/></svg><div class="pl-banner__text"><b>PluginLabs Hub 2.0 hazır.</b> <span class="pl-muted">Yeni komut paleti ve MyMind entegrasyonu.</span></div>
<button class="pl-btn pl-btn--primary pl-btn--sm">Yeniden başlat</button><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kapat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
```


---

## Katman (3)

### PLC-050

**Modal Diyalog** · `modal`

- **Amaç:** Odaklı karar veya form için üst katman.
- **Ne zaman:** Kullanıcıyı durdurması gereken kısa görevler; uzun içerik için Çekmece.
- **Sınıflar:** `dialog.pl-modal pl-modal__head pl-modal__icon pl-modal__body pl-modal__foot`
- **Erişilebilirlik:** Native <dialog>.showModal(); odak tuzağı, Esc kapatır, odak tetikleyiciye döner.

```html
<div class="pl-modal" role="dialog" aria-labelledby="m1"><div class="pl-modal__head"><div class="pl-modal__icon"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.4 14.6a2.5 2.5 0 1 0 0-5H18V6a2 2 0 0 0-2-2h-3.6V2.6a2.5 2.5 0 1 0-5 0V4H4a2 2 0 0 0-2 2v3.6h1.4a2.5 2.5 0 1 1 0 5H2V18a2 2 0 0 0 2 2h3.6v-1.4a2.5 2.5 0 1 1 5 0V20H16a2 2 0 0 0 2-2v-3.4z"/></svg></div>
<div><h3 class="pl-h3" id="m1">Leo Helper'ı kur</h3><p class="pl-muted" style="margin:4px 0 0">Chrome ve Edge'e eklenecek.</p></div></div>
<div class="pl-modal__body"><label class="pl-check"><input type="checkbox" checked> Tüm profillere kur</label></div>
<div class="pl-modal__foot"><button class="pl-btn pl-btn--ghost">Vazgeç</button><button class="pl-btn pl-btn--primary">Kur</button></div></div>
```

### PLC-051

**Arşivle Onayı** · `archive-confirm`

- **Amaç:** Silme yerine arşivleme onayı; geri dönüş yolunu açıkça söyler.
- **Ne zaman:** Her yıkıcı eylemde. 'Sil' kelimesi kullanılmaz.
- **Sınıflar:** `pl-modal + pl-modal__icon.is-warning + pl-btn--danger`
- **Erişilebilirlik:** role="alertdialog"; varsayılan odak 'Vazgeç' butonunda.

```html
<div class="pl-modal" role="alertdialog" aria-labelledby="m2"><div class="pl-modal__head"><div class="pl-modal__icon is-warning"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg></div>
<div><h3 class="pl-h3" id="m2">3 kanal arşivlensin mi?</h3><p class="pl-muted" style="margin:4px 0 0">Kanallar <span class="pl-num">Arşiv/30.10.2026</span> altına taşınır, istediğiniz zaman geri yükleyebilirsiniz.</p></div></div>
<div class="pl-modal__foot"><button class="pl-btn pl-btn--ghost" autofocus>Vazgeç</button><button class="pl-btn pl-btn--danger"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>Arşivle</button></div></div>
```

### PLC-052

**Çekmece (Yan Sayfa)** · `drawer`

- **Amaç:** Sağdan açılan detay/düzenleme paneli.
- **Ne zaman:** Liste bağlamını kaybetmeden detay gösterme, uzun formlar.
- **Sınıflar:** `pl-drawer pl-drawer__head pl-drawer__body pl-drawer__foot`
- **Erişilebilirlik:** role="dialog" aria-modal; Esc kapatır.

```html
<div class="pl-drawer" style="height:auto;max-width:none"><div class="pl-drawer__head"><b style="color:var(--pl-fg-1)">Ürün ayrıntısı</b><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kapat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
<div class="pl-drawer__body"><dl class="pl-kv"><dt>Hedef fiyat</dt><dd class="pl-num">1.100,00 ₺</dd><dt>Bildirim</dt><dd>Açık</dd></dl></div>
<div class="pl-drawer__foot"><button class="pl-btn pl-btn--secondary pl-btn--sm">İptal</button><button class="pl-btn pl-btn--primary pl-btn--sm">Kaydet</button></div></div>
```


---

## Ürün Kalıpları (27)

### PLC-053

**Uygulama Logo Karosu** · `app-logo`

- **Amaç:** Ürün aksanından türeyen gradyan logo karosu.
- **Ne zaman:** Katalog, kenar çubuğu, dock, bildirim, popup başlığı.
- **Sınıflar:** `pl-applogo pl-applogo--sm|lg [data-pl-product]`
- **Erişilebilirlik:** Dekoratifse aria-hidden; tek başına kullanılıyorsa aria-label=ürün adı.

```html
<div class="pl-row" style="gap:10px">
<span class="pl-applogo" data-pl-product="hub" style="background:var(--pl-brand-gradient)">PL</span>
<span class="pl-applogo" data-pl-product="leo">LH</span><span class="pl-applogo" data-pl-product="mindpalace">MP</span>
<span class="pl-applogo" data-pl-product="replicator">DR</span><span class="pl-applogo" data-pl-product="mutfak">MA</span>
<span class="pl-applogo" data-pl-product="flowdock">FD</span><span class="pl-applogo" data-pl-product="tweakster">TW</span>
<span class="pl-applogo" data-pl-product="extman">EM</span><span class="pl-applogo" data-pl-product="mymind">MM</span>
<span class="pl-applogo" data-pl-product="scrapper">US</span><span class="pl-applogo" data-pl-product="wishlist">MW</span></div>
```

### PLC-054

**Uygulama Kartı (Katalog)** · `app-card` · Ürün: Leo Helper (`data-pl-product="leo"`)

- **Amaç:** Hub kataloğunda uygulama/eklenti kartı: logo, ad, platform, eylem.
- **Ne zaman:** Hub ana sayfası, 'Uygulamalar' ve 'Eklentiler' ızgaraları.
- **Durumlar:** kurulu değil (Kur), kurulu (Aç), güncelleme var, kuruluyor
- **Sınıflar:** `pl-appcard pl-appcard__head pl-appcard__name pl-appcard__desc pl-appcard__foot`
- **Erişilebilirlik:** Kart bir <article>; birincil eylem butonu tek odak noktası.

```html
<article class="pl-appcard"><div class="pl-appcard__head"><span class="pl-applogo">LH</span><div style="min-width:0"><div class="pl-appcard__name">Leo Helper</div><span class="pl-label">Eklenti · v2.4.1</span></div><span class="pl-badge pl-badge--success" style="margin-left:auto">Kurulu</span></div>
<p class="pl-appcard__desc">Telegram kanallarındaki indirim kodlarını, bağlantıları ve koşulları otomatik yakalar.</p>
<div class="pl-appcard__foot"><div class="pl-row" style="gap:6px"><span class="pl-badge">Chrome</span><span class="pl-badge">Edge</span></div><button class="pl-btn pl-btn--primary pl-btn--sm">Aç</button></div></article>
```

### PLC-055

**Kurulum / İndirme Satırı** · `install-row` · Ürün: PluginLabs Hub (`data-pl-product="hub"`)

- **Amaç:** Kuyruktaki kurulum veya güncellemenin canlı ilerlemesi.
- **Ne zaman:** Hub 'İndirmeler' paneli, toplu güncelleme.
- **Sınıflar:** `pl-installrow pl-installrow__main pl-installrow__top + pl-progress`
- **Erişilebilirlik:** İlerleme aria-valuenow; bitişte aria-live duyurusu.

```html
<div class="pl-stack" style="gap:8px">
<div class="pl-installrow"><span class="pl-applogo pl-applogo--sm" data-pl-product="tweakster">TW</span><div class="pl-installrow__main"><div class="pl-installrow__top">Tweakster 1.3.0<span class="pl-num pl-muted">48 / 74 MB</span></div><div class="pl-progress"><span style="--pl-val:65%"></span></div></div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Duraklat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="1"/></svg></button></div>
<div class="pl-installrow"><span class="pl-applogo pl-applogo--sm" data-pl-product="flowdock">FD</span><div class="pl-installrow__main"><div class="pl-installrow__top">Flow Dock 0.9.2<span class="pl-badge pl-badge--success">Tamam</span></div></div><button class="pl-btn pl-btn--secondary pl-btn--sm">Aç</button></div></div>
```

### PLC-056

**Eklenti Popup İskeleti** · `extension-popup` · Ürün: Leo Helper (`data-pl-product="leo"`)

- **Amaç:** 380×560 tarayıcı eklentisi popup'ı: başlık, durum, içerik, alt eylem çubuğu.
- **Ne zaman:** Tüm PluginLabs tarayıcı eklentilerinin popup'ı bu iskeletle başlar.
- **Sınıflar:** `pl-popup pl-popup__head pl-popup__title pl-popup__body pl-popup__foot [data-pl-density=compact]`
- **Erişilebilirlik:** Popup açıldığında ilk odak birincil eylemde; Tab sırası yukarıdan aşağı.

```html
<div class="pl-popup" data-pl-density="compact" style="height:auto"><div class="pl-popup__head"><span class="pl-applogo pl-applogo--sm">LH</span><div class="pl-popup__title"><b>Leo Helper</b><span class="pl-status pl-status--online" style="height:20px;border:0;padding:0;background:none">3 kanal bağlı</span></div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Ayarlar"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button></div>
<div class="pl-popup__body"><div class="pl-inputwrap"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input class="pl-input" placeholder="Kod veya mağaza ara"></div>
<div class="pl-listrow"><span class="pl-avatar pl-avatar--sm pl-avatar--accent">TY</span><div class="pl-listrow__main"><div class="pl-listrow__title">TRENDYOL150</div><div class="pl-listrow__sub">150 ₺ indirim · min. 750 ₺ · 2 dk önce</div></div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kopyala"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div>
<div class="pl-listrow"><span class="pl-avatar pl-avatar--sm">HB</span><div class="pl-listrow__main"><div class="pl-listrow__title">HEPSI20</div><div class="pl-listrow__sub">%20 · elektronik · 14 dk önce</div></div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kopyala"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div></div>
<div class="pl-popup__foot"><button class="pl-btn pl-btn--secondary pl-btn--sm" style="flex:1">Hub'da aç</button><button class="pl-btn pl-btn--primary pl-btn--sm" style="flex:1"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>Yenile</button></div></div>
```

### PLC-057

**İzin İsteği Kartı** · `permission-card` · Ürün: Extension Manager (`data-pl-product="extman"`)

- **Amaç:** Eklentinin istediği izinleri sade dille açıklayan onay kartı.
- **Ne zaman:** Kurulum öncesi, yeni izin talebinde, Extension Manager denetiminde.
- **Sınıflar:** `pl-perm > ul > li`
- **Erişilebilirlik:** Her izin cümle olarak okunur; 'İzin ver' butonu açık metinli.

```html
<div class="pl-perm"><div class="pl-row"><span class="pl-applogo pl-applogo--sm" data-pl-product="scrapper">US</span><b style="color:var(--pl-fg-1)">The Ultimate Scrapper şunlara erişmek istiyor:</b></div>
<ul><li><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/></svg>Ziyaret ettiğiniz alışveriş sitelerindeki ürün sayfalarını okuma</li><li><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Fiyat düştüğünde bildirim gösterme</li><li><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Verileri yalnız bu cihazda saklama</li></ul>
<div class="pl-row" style="justify-content:flex-end"><button class="pl-btn pl-btn--ghost pl-btn--sm">Reddet</button><button class="pl-btn pl-btn--primary pl-btn--sm">İzin ver</button></div></div>
```

### PLC-058

**Eklenti Satırı (Anahtarlı)** · `extension-row` · Ürün: Extension Manager (`data-pl-product="extman"`)

- **Amaç:** Eklentiyi etkinleştir/devre dışı bırak; meta ve eylemler.
- **Ne zaman:** Extension Manager listesi, Hub 'Kurulu' sayfası.
- **Sınıflar:** `pl-listrow pl-listrow__main pl-listrow__title pl-listrow__sub is-disabled + pl-switch`
- **Erişilebilirlik:** Anahtarın aria-label'ı eklenti adını içerir.

```html
<div><div class="pl-listrow"><span class="pl-applogo pl-applogo--sm" data-pl-product="leo">LH</span><div class="pl-listrow__main"><div class="pl-listrow__title">Leo Helper</div><div class="pl-listrow__sub">12 MB bellek · 3 izin</div></div><label class="pl-switch"><input type="checkbox" role="switch" checked aria-label="Leo Helper"></label><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Daha fazla"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button></div>
<div class="pl-listrow is-disabled"><span class="pl-applogo pl-applogo--sm" data-pl-product="replicator">DR</span><div class="pl-listrow__main"><div class="pl-listrow__title">Design Replicator</div><div class="pl-listrow__sub">Devre dışı · 28.10.2026'dan beri</div></div><label class="pl-switch"><input type="checkbox" role="switch" aria-label="Design Replicator"></label><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Daha fazla"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button></div></div>
```

### PLC-059

**Ürün / Fiyat Kartı** · `product-card` · Ürün: MyWishlist (`data-pl-product="wishlist"`)

- **Amaç:** Kaydedilen ürünün görseli, fiyatı, değişimi ve mağazası.
- **Ne zaman:** MyWishlist kataloğu, Ultimate Scrapper sonuçları. Izgarada eşit boyutlu.
- **Sınıflar:** `pl-product pl-product__img pl-product__body pl-price pl-price__now pl-price__old`
- **Erişilebilirlik:** Görselde alt; fiyat değişimi metinle ("%14 düştü").

```html
<div class="pl-product" style="max-width:240px"><div class="pl-product__img"><svg class="pl-ico pl-ico--24" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg><button class="pl-iconbtn pl-iconbtn--sm is-active" aria-label="Favoriden çıkar"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg></button></div>
<div class="pl-product__body"><span class="pl-label">Trendyol</span><div class="pl-product__title">Kablosuz Kulaklık ANC Pro</div>
<div class="pl-price"><span class="pl-price__now">1.249,90 ₺</span><span class="pl-price__old">1.449,90 ₺</span><span class="pl-badge pl-badge--success">−%14</span></div></div></div>
```

### PLC-060

**AI Mesaj Balonu (MyMind)** · `ai-message` · Ürün: MyMind (`data-pl-product="mymind"`)

- **Amaç:** Kullanıcı ve MyMind mesajları; kaynak, güven ve eylemlerle.
- **Ne zaman:** MyMind sohbeti, ürün içi AI yardımcıları, Mind Palace sorguları.
- **Durumlar:** kullanıcı, AI, yazıyor, hata
- **Sınıflar:** `pl-msg pl-msg--user|ai pl-msg__bubble pl-msg__meta pl-typing`
- **Erişilebilirlik:** Mesaj listesi role="log" aria-live="polite"; AI mesajı 'MyMind' rozetli.

```html
<div class="pl-stack" role="log">
<div class="pl-msg pl-msg--user"><span class="pl-avatar pl-avatar--sm">MI</span><div class="pl-msg__bubble">Bu hafta en çok indirim veren mağaza hangisi?</div></div>
<div class="pl-msg pl-msg--ai"><span class="pl-avatar pl-avatar--sm pl-avatar--accent"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M21 5h-4"/></svg></span><div><div class="pl-msg__bubble">Leo Helper verilerine göre <b style="color:var(--pl-fg-1)">Trendyol</b> 42 kodla önde; ortalama indirim <span class="pl-num" style="color:var(--pl-gold)">%18</span>.</div>
<div class="pl-msg__meta"><span class="pl-badge pl-badge--accent">MyMind</span><span class="pl-badge">Kaynak: 3 kanal</span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kopyala"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Yeniden üret"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></button></div></div></div>
<div class="pl-msg pl-msg--ai"><span class="pl-avatar pl-avatar--sm pl-avatar--accent"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M21 5h-4"/></svg></span><div class="pl-msg__bubble"><span class="pl-typing" aria-label="Yazıyor"><i></i><i></i><i></i></span></div></div></div>
```

### PLC-061

**AI Prompt Kompozitörü** · `ai-composer` · Ürün: MyMind (`data-pl-product="mymind"`)

- **Amaç:** Çok satırlı prompt girişi; ek, ses, model seçimi ve gönder.
- **Ne zaman:** MyMind sohbeti, yan panel asistanları.
- **Sınıflar:** `pl-composer pl-composer__bar pl-composer__send`
- **Erişilebilirlik:** Enter gönderir, Shift+Enter yeni satır (ipucu görünür); gönder butonu aria-label.

```html
<div class="pl-composer"><textarea placeholder="MyMind'a sor… (Shift+Enter yeni satır)" aria-label="Mesaj"></textarea>
<div class="pl-composer__bar"><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Dosya ekle"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></button><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Sesle yaz"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/></svg></button>
<span class="pl-tag" style="height:24px"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M21 5h-4"/></svg>MyMind Pro</span><button class="pl-composer__send" aria-label="Gönder"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 7-7 7 7M12 19V5"/></svg></button></div></div>
```

### PLC-062

**Dock / Başlatıcı (Flow Dock)** · `dock` · Ürün: Flow Dock (`data-pl-product="flowdock"`)

- **Amaç:** Yüzen uygulama/kısayol rafı; çalışan uygulama göstergeli.
- **Ne zaman:** Flow Dock ana yüzeyi, hızlı başlatıcılar.
- **Sınıflar:** `pl-dock pl-dock__item.is-running pl-dock__sep`
- **Erişilebilirlik:** role="toolbar"; ← → gezinme; her öğede aria-label + tooltip.

```html
<div style="display:flex;justify-content:center;padding:12px 0"><div class="pl-dock" role="toolbar" aria-label="Flow Dock">
<span class="pl-dock__item is-running" aria-label="Hub" style="background:var(--pl-brand-gradient);color:#fff"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg></span>
<span class="pl-dock__item is-running" aria-label="Terminal"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 17 6-6-6-6M12 19h8"/></svg></span><span class="pl-dock__item" aria-label="Klasörler"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/></svg></span>
<span class="pl-dock__item" aria-label="Notlar"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg></span><span class="pl-dock__sep"></span>
<span class="pl-dock__item" aria-label="Tweakster" style="color:#a3e635"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg></span><span class="pl-dock__item" aria-label="Ayarlar"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span></div></div>
```

### PLC-063

**Sistem Metrik Karosu (Tweakster)** · `system-metric` · Ürün: Tweakster (`data-pl-product="tweakster"`)

- **Amaç:** Halka + değer + tek eylem: CPU, RAM, disk, başlangıç öğeleri.
- **Ne zaman:** Tweakster panosu; optimizasyon önerileri.
- **Sınıflar:** `pl-metric pl-metric__info + pl-ring`
- **Erişilebilirlik:** Halka aria-label ile yüzde; eylem butonu ne yapacağını söyler.

```html
<div class="pl-stack"><div class="pl-metric"><div class="pl-ring" style="--pl-val:68" role="img" aria-label="Bellek %68"><span>68</span></div><div class="pl-metric__info"><span class="pl-label">Bellek</span><b style="color:var(--pl-fg-1)">10,9 / 16 GB</b><span class="pl-muted">4 uygulama 2,1 GB kullanıyor</span></div><button class="pl-btn pl-btn--primary pl-btn--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>Boşalt</button></div>
<div class="pl-metric"><div class="pl-ring" style="--pl-val:23;--pl-accent:var(--pl-success)" role="img" aria-label="CPU %23"><span>23</span></div><div class="pl-metric__info"><span class="pl-label">İşlemci</span><b style="color:var(--pl-fg-1)">Normal</b><span class="pl-muted">58 °C</span></div></div></div>
```

### PLC-064

**Tarif Kartı (Mutfak Atölyesi)** · `recipe-card` · Ürün: Mutfak Atölyesi (`data-pl-product="mutfak"`)

- **Amaç:** Görsel + başlık + süre/porsiyon/zorluk meta satırı.
- **Ne zaman:** Mutfak Atölyesi kayıtlı tarifler, web'den yakalanan tarifler.
- **Sınıflar:** `pl-recipe pl-recipe__img pl-recipe__meta`
- **Erişilebilirlik:** Görsel alt metni yemeğin adı; meta ikonları aria-hidden, metin okunur.

```html
<div class="pl-recipe"><div class="pl-recipe__img" role="img" aria-label="Fırında sebzeli bulgur"></div><div class="pl-stack" style="gap:6px"><span class="pl-label">Ana yemek</span><b style="color:var(--pl-fg-1)">Fırında Sebzeli Bulgur</b>
<div class="pl-recipe__meta"><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>45 dk</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>4 kişilik</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>Kolay</span></div><div class="pl-row" style="gap:6px"><span class="pl-tag" style="height:22px">Vegan</span><span class="pl-tag" style="height:22px">Tek tava</span></div></div></div>
```

### PLC-065

**Kod Çıkarım Kartı (Leo Helper)** · `extract-card` · Ürün: Leo Helper (`data-pl-product="leo"`)

- **Amaç:** Telegram mesajından çıkarılan kod, koşullar ve kaynak.
- **Ne zaman:** Leo Helper akışı, popup detay, bildirim genişletme.
- **Durumlar:** geçerli, süresi doldu, düzeltildi (geri bildirim)
- **Sınıflar:** `pl-extract pl-extract__code + pl-kv`
- **Erişilebilirlik:** Kod metni seçilebilir; kopyala butonu sonrası 'Kopyalandı' duyurusu.

```html
<div class="pl-extract"><div class="pl-row" style="justify-content:space-between"><span class="pl-row" style="gap:8px"><span class="pl-avatar pl-avatar--sm pl-avatar--accent">TG</span><span class="pl-muted">@indirimler · 2 dk</span></span><span class="pl-badge pl-badge--success">Geçerli</span></div>
<div class="pl-extract__code">TRENDYOL150<button class="pl-btn pl-btn--primary pl-btn--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Kopyala</button></div>
<dl class="pl-kv"><dt>İndirim</dt><dd class="pl-num">150 ₺</dd><dt>Alt limit</dt><dd class="pl-num">750 ₺</dd><dt>Bitiş</dt><dd class="pl-num">31.10.2026</dd></dl>
<div class="pl-row" style="justify-content:flex-end"><button class="pl-btn pl-btn--ghost pl-btn--sm">Yanlış mı? Düzelt</button></div></div>
```

### PLC-066

**Not Kartı (Mind Palace)** · `note-card` · Ürün: Mind Palace (`data-pl-product="mindpalace"`)

- **Amaç:** Başlık, önizleme, etiketler ve bağlantı sayısı olan not.
- **Ne zaman:** Mind Palace panoları, komuta merkezi, arama sonuçları.
- **Sınıflar:** `pl-note`
- **Erişilebilirlik:** Kart bir <article>; başlık bağlantıdır.

```html
<article class="pl-note"><div class="pl-row" style="justify-content:space-between"><span class="pl-label">Fikir · 29.10.2026</span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Sabitle"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg></button></div>
<b style="color:var(--pl-fg-1)">Modüler menü mimarisi</b><p>Her eklenti Mind Palace'a bir modül olarak takılır; komuta merkezi tek arama ve ortak bildirim kuyruğu sunar.</p>
<div class="pl-row" style="justify-content:space-between"><div class="pl-row" style="gap:6px"><span class="pl-tag" style="height:22px">mimari</span><span class="pl-tag" style="height:22px">hub</span></div><span class="pl-muted pl-row" style="gap:4px"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>4</span></div></article>
```

### PLC-067

**Ayar Satırı** · `settings-row`

- **Amaç:** Başlık + açıklama + kontrol düzeni.
- **Ne zaman:** Tüm uygulamaların Ayarlar sayfası; popup ayarları.
- **Sınıflar:** `pl-setting pl-setting__text`
- **Erişilebilirlik:** Kontrol, satır başlığıyla aria-labelledby ile ilişkilendirilir.

```html
<div><div class="pl-setting"><div class="pl-setting__text"><b>Windows ile başlat</b><span class="pl-muted">Hub oturum açıldığında tepside açılır.</span></div><label class="pl-switch"><input type="checkbox" role="switch" checked aria-label="Windows ile başlat"></label></div>
<div class="pl-setting"><div class="pl-setting__text"><b>Varsayılan AI</b><span class="pl-muted">Tüm ürünlerde kullanılacak model.</span></div><select class="pl-select" style="width:150px"><option>MyMind Pro</option><option>Gemini Pro</option><option>Ollama</option></select></div></div>
```

### PLC-068

**Karşılama Kahramanı** · `onboarding-hero` · Ürün: PluginLabs Hub (`data-pl-product="hub"`)

- **Amaç:** Marka gradyanlı karşılama alanı; iki tonlu başlık.
- **Ne zaman:** İlk açılış, Hub ana sayfası üstü, büyük sürüm tanıtımı.
- **Sınıflar:** `pl-hero pl-hero__title > em`
- **Erişilebilirlik:** Tek h1; dekoratif arka plan aria-hidden.

```html
<section class="pl-hero"><span class="pl-badge pl-badge--accent">PluginLabs Hub · 2.0</span><h1 class="pl-hero__title">Tüm araçların,<br><em>tek atölyede.</em></h1>
<p class="pl-muted" style="max-width:420px;margin:0 0 16px">Uygulamaları ve eklentileri kur, güncelle, MyMind ile birbirine bağla.</p>
<div class="pl-row"><button class="pl-btn pl-btn--gradient pl-btn--lg">Başla<svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button><button class="pl-btn pl-btn--secondary pl-btn--lg">Kataloğa göz at</button></div></section>
```

### PLC-069

**Plan / Abonelik Kartı** · `plan-card`

- **Amaç:** Ücretsiz ve Pro planların karşılaştırması; Pro altın vurgulu.
- **Ne zaman:** Yükseltme ekranı, hesap sayfası.
- **Sınıflar:** `pl-plan pl-plan.is-featured pl-plan__price`
- **Erişilebilirlik:** Fiyat ve dönem tek metin olarak okunur ("Ayda 149 ₺").

```html
<div class="pl-grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
<div class="pl-plan"><span class="pl-label">Ücretsiz</span><div class="pl-plan__price">0 ₺</div><ul><li><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>3 uygulama</li><li><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Yerel AI</li></ul><button class="pl-btn pl-btn--secondary pl-btn--block">Mevcut plan</button></div>
<div class="pl-plan is-featured"><div class="pl-row" style="justify-content:space-between"><span class="pl-label">Pro</span><span class="pl-badge pl-badge--pro"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7z"/><path d="M5 20h14"/></svg>Önerilen</span></div><div class="pl-plan__price">149 ₺<span class="pl-muted" style="font-size:13px">/ay</span></div><ul><li><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Sınırsız uygulama</li><li><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>MyMind Pro</li><li><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Bulut senkron</li></ul><button class="pl-btn pl-btn--gradient pl-btn--block">Pro'ya geç</button></div></div>
```

### PLC-070

**Bildirim Merkezi** · `notification-center` · Ürün: PluginLabs Hub (`data-pl-product="hub"`)

- **Amaç:** Tüm ürünlerden gelen bildirimlerin tek listesi.
- **Ne zaman:** Hub başlık çubuğundaki zil; tepsi menüsü.
- **Sınıflar:** `pl-menu + pl-listrow + pl-badge--count`
- **Erişilebilirlik:** role="region" aria-label="Bildirimler"; okunmamış sayısı duyurulur.

```html
<div class="pl-menu" style="padding:0;min-width:0"><div class="pl-row" style="justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--pl-line)"><b style="color:var(--pl-fg-1)">Bildirimler <span class="pl-badge pl-badge--count">2</span></b><a class="pl-link" style="font-size:12px">Tümünü okundu say</a></div>
<div class="pl-listrow"><span class="pl-applogo pl-applogo--sm" data-pl-product="wishlist">MW</span><div class="pl-listrow__main"><div class="pl-listrow__title">Fiyat %14 düştü</div><div class="pl-listrow__sub">Kablosuz kulaklık · 5 dk</div></div></div>
<div class="pl-listrow"><span class="pl-applogo pl-applogo--sm" data-pl-product="tweakster">TW</span><div class="pl-listrow__main"><div class="pl-listrow__title">Güncelleme hazır</div><div class="pl-listrow__sub">Tweakster 1.3.0 · 1 sa</div></div></div></div>
```

### PLC-071

**Kazıma Görevi Kartı (Scrapper)** · `scrape-task` · Ürün: The Ultimate Scrapper (`data-pl-product="scrapper"`)

- **Amaç:** Çok sayfalı kazıma/veri toplama görevinin durumu ve çıktısı.
- **Ne zaman:** The Ultimate Scrapper görev listesi.
- **Durumlar:** kuyrukta, çalışıyor, tamamlandı, hata
- **Sınıflar:** `pl-card + pl-progress + pl-kv`
- **Erişilebilirlik:** Görev durumu metinle; ilerleme aria-valuenow.

```html
<div class="pl-card pl-stack"><div class="pl-row" style="justify-content:space-between"><b style="color:var(--pl-fg-1)">Laptop fiyatları · 5 site</b><span class="pl-status pl-status--syncing">Çalışıyor</span></div>
<div class="pl-progress"><span style="--pl-val:58%"></span></div><div class="pl-row" style="justify-content:space-between"><span class="pl-muted pl-num">14 / 24 sayfa · 312 ürün</span><span class="pl-muted pl-num">~2 dk</span></div>
<div class="pl-row"><button class="pl-btn pl-btn--secondary pl-btn--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg>Önizle</button><button class="pl-btn pl-btn--ghost pl-btn--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>CSV</button><button class="pl-btn pl-btn--ghost pl-btn--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>Sepet oluştur</button></div></div>
```

### PLC-072

**Palet Çıkarım Paneli (Design Replicator)** · `palette-extract` · Ürün: Design Replicator (`data-pl-product="replicator"`)

- **Amaç:** Sayfadan çıkarılan renk, font ve token önerileri.
- **Ne zaman:** Design Replicator yan paneli.
- **Sınıflar:** `pl-card + pl-swatches + pl-kv`
- **Erişilebilirlik:** Her renk adıyla ve HEX değeriyle okunur.

```html
<div class="pl-card pl-stack"><div class="pl-row" style="justify-content:space-between"><span class="pl-label">Çıkarılan palet</span><button class="pl-btn pl-btn--primary pl-btn--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4-11 11 3 3 11-11z"/><path d="M14 7l3 3M5 6v4M19 14v4M10 2v2M7 8H3M21 16h-4M11 3H9"/></svg>Token üret</button></div>
<div class="pl-row" style="gap:6px;flex-wrap:nowrap"><div style="flex:1;height:44px;border-radius:8px;background:#0f172a"></div><div style="flex:1;height:44px;border-radius:8px;background:#1e293b"></div><div style="flex:1;height:44px;border-radius:8px;background:#f472b6"></div><div style="flex:1;height:44px;border-radius:8px;background:#fde68a"></div><div style="flex:1;height:44px;border-radius:8px;background:#f8fafc"></div></div>
<dl class="pl-kv"><dt>Başlık fontu</dt><dd>Clash Display</dd><dt>Gövde</dt><dd>Inter 15/1.6</dd><dt>Köşe</dt><dd class="pl-num">12px</dd></dl></div>
```

### PLC-073

**Bütçe Göstergesi (MyWishlist)** · `budget-meter` · Ürün: MyWishlist (`data-pl-product="wishlist"`)

- **Amaç:** Liste toplamının bütçeye oranı ve kalan tutar.
- **Ne zaman:** MyWishlist bütçe planı, alışveriş listeleri.
- **Sınıflar:** `pl-kpi + pl-progress`
- **Erişilebilirlik:** Tutarlar ₺ ile metin olarak; aşımda uyarı rengi + metin.

```html
<div class="pl-kpi"><div class="pl-row" style="justify-content:space-between"><span class="pl-label">Kasım bütçesi</span><span class="pl-badge pl-badge--warning">%82</span></div>
<span class="pl-kpi__value" style="font-size:24px">8.200 ₺ <span class="pl-muted" style="font-size:14px">/ 10.000 ₺</span></span>
<div class="pl-progress"><span style="--pl-val:82%;background:var(--pl-warning)"></span></div><span class="pl-muted">Kalan <b class="pl-num" style="color:var(--pl-gold)">1.800 ₺</b> · 3 ürün alındı</span></div>
```

### PLC-074

**Bağlantı Kurulum Kartı** · `channel-connect` · Ürün: Leo Helper (`data-pl-product="leo"`)

- **Amaç:** Harici hesap/servis bağlama adımı ve durumu.
- **Ne zaman:** Telegram, Gemini, Ollama, GitHub bağlantıları.
- **Durumlar:** bağlı değil, bağlanıyor, bağlı, hata
- **Sınıflar:** `pl-card + pl-status + pl-btn`
- **Erişilebilirlik:** Durum değişimi aria-live; hata nedeni metinle.

```html
<div class="pl-stack" style="gap:8px">
<div class="pl-card pl-row" style="flex-wrap:nowrap"><span class="pl-avatar pl-avatar--accent"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg></span><div style="flex:1;min-width:0"><b style="color:var(--pl-fg-1)">Telegram</b><div class="pl-muted">3 kanal takip ediliyor</div></div><span class="pl-status pl-status--online">Bağlı</span></div>
<div class="pl-card pl-row" style="flex-wrap:nowrap"><span class="pl-avatar"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/></svg></span><div style="flex:1;min-width:0"><b style="color:var(--pl-fg-1)">Ollama</b><div class="pl-muted pl-num">localhost:11434</div></div><button class="pl-btn pl-btn--secondary pl-btn--sm">Bağla</button></div></div>
```

### PLC-075

**Kısayol Listesi** · `shortcut-list`

- **Amaç:** Uygulamanın klavye kısayolları referansı.
- **Ne zaman:** Yardım menüsü, '?' tuşu ile açılan katman.
- **Sınıflar:** `pl-kv + pl-kbd`
- **Erişilebilirlik:** Platforma göre tuş adı (Ctrl/⌘).

```html
<dl class="pl-kv"><dt>Komut paleti</dt><dd><span class="pl-kbd">Ctrl</span> <span class="pl-kbd">K</span></dd><dt>Ara</dt><dd><span class="pl-kbd">/</span></dd>
<dt>Yeni not</dt><dd><span class="pl-kbd">Ctrl</span> <span class="pl-kbd">N</span></dd><dt>Dock'u göster</dt><dd><span class="pl-kbd">Alt</span> <span class="pl-kbd">Space</span></dd></dl>
```

### PLC-076

**Güncelleme Kartı** · `update-card` · Ürün: PluginLabs Hub (`data-pl-product="hub"`)

- **Amaç:** Sürüm farkı ve değişiklik özetiyle güncelleme önerisi.
- **Ne zaman:** Hub 'Güncellemeler' sekmesi, uygulama detay sayfası.
- **Sınıflar:** `pl-card + pl-badge + pl-btn`
- **Erişilebilirlik:** Sürüm farkı metin olarak ("1.2.4'ten 1.3.0'a").

```html
<div class="pl-card pl-stack"><div class="pl-row" style="flex-wrap:nowrap"><span class="pl-applogo pl-applogo--sm" data-pl-product="tweakster">TW</span><div style="flex:1"><b style="color:var(--pl-fg-1)">Tweakster</b><div class="pl-num pl-muted">1.2.4 → <span style="color:var(--pl-fg-1)">1.3.0</span></div></div><span class="pl-badge pl-badge--warning">Güncelleme</span></div>
<ul class="pl-muted" style="margin:0;padding-left:18px"><li>Başlangıç öğeleri yöneticisi</li><li>Disk temizliğinde %30 hız</li></ul>
<div class="pl-row" style="justify-content:flex-end"><button class="pl-btn pl-btn--ghost pl-btn--sm">Sürüm notları</button><button class="pl-btn pl-btn--primary pl-btn--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>Güncelle</button></div></div>
```

### PLC-077

**Filtre Çubuğu** · `filter-bar`

- **Amaç:** Arama + etiket filtreleri + görünüm seçimi + sıralama.
- **Ne zaman:** Katalog, ürün listesi, not panosu üstü.
- **Sınıflar:** `pl-row + pl-inputwrap + pl-tag + pl-segment + pl-select`
- **Erişilebilirlik:** role="search"; uygulanan filtre sayısı duyurulur.

```html
<div class="pl-row" role="search" style="flex-wrap:wrap;gap:10px"><div class="pl-inputwrap" style="flex:1;min-width:180px"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input class="pl-input" placeholder="Filtrele"></div>
<span class="pl-tag is-selected"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>Eklenti</span><span class="pl-tag">Masaüstü</span>
<div class="pl-segment"><button class="is-active" aria-label="Izgara"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg></button><button aria-label="Liste"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg></button></div>
<select class="pl-select" style="width:150px"><option>En yeni</option><option>En popüler</option></select></div>
```

### PLC-078

**Yan Panel İskeleti** · `sidepanel-shell` · Ürün: Mind Palace (`data-pl-product="mindpalace"`)

- **Amaç:** Tarayıcı yan paneli (400px): başlık, sekmeler, içerik, alt kompozitör.
- **Ne zaman:** Mind Palace, Design Replicator, MyMind asistanı yan panelleri.
- **Sınıflar:** `pl-popup (width:var(--pl-sidepanel-w)) + pl-tabs + pl-composer`
- **Erişilebilirlik:** Panel landmark: <aside aria-label>.

```html
<aside class="pl-popup" data-pl-density="compact" style="width:100%;height:auto" aria-label="Mind Palace"><div class="pl-popup__head"><span class="pl-applogo pl-applogo--sm">MP</span><div class="pl-popup__title"><b>Mind Palace</b></div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kapat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
<div style="padding:0 12px"><div class="pl-tabs"><button class="pl-tab is-active">Notlar</button><button class="pl-tab">Modüller</button><button class="pl-tab">Komuta</button></div></div>
<div class="pl-popup__body"><div class="pl-listrow"><div class="pl-listrow__main"><div class="pl-listrow__title">Modüler menü mimarisi</div><div class="pl-listrow__sub">4 bağlantı · dün</div></div></div>
<div class="pl-composer" style="padding:8px"><textarea style="min-height:28px" placeholder="Hızlı not…"></textarea></div></div></aside>
```

### PLC-079

**Kategori Etiketli Liste** · `stat-grid-legend`

- **Amaç:** Renkli kategori pilli, sağa hizalı tutarlı liste (Astra serisiyle uyumlu).
- **Ne zaman:** Harcama/alışveriş listeleri, eklenti kaynak tüketimi.
- **Sınıflar:** `pl-listrow + pl-badge--* + pl-num`
- **Erişilebilirlik:** Tutarlar sağa hizalı ve tabular.

```html
<div><div class="pl-listrow"><label class="pl-check"><input type="checkbox" checked></label><div class="pl-listrow__main"><div class="pl-listrow__title">Mekanik klavye</div></div><span class="pl-badge pl-badge--info">Elektronik</span><span class="pl-num" style="color:var(--pl-fg-1);min-width:90px;text-align:right">2.899 ₺</span></div>
<div class="pl-listrow"><label class="pl-check"><input type="checkbox"></label><div class="pl-listrow__main"><div class="pl-listrow__title">Döküm tava</div></div><span class="pl-badge pl-badge--warning">Mutfak</span><span class="pl-num" style="color:var(--pl-fg-1);min-width:90px;text-align:right">1.150 ₺</span></div></div>
```
