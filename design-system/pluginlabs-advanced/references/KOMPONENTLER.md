# PluginLabs Advanced — Komponent Kataloğu

> **Sürüm:** 2.0.0 · **Tarih:** 01.11.2026 · **Adet:** 181 komponent (79 temel PLC + 102 advanced PLA) · **Kaynak:** `build/components.py` + `build/advanced*.py` (bu dosya otomatik üretilir — elle düzenlemeyin)

> Tüm örnekler `[data-pl]` kapsayıcısı içinde çalışır ve sırasıyla `assets/pl-tokens.css` + `assets/pl-components.css` + `assets/pl-advanced.css` gerektirir. Ürün aksanı `data-pl-product`, yüzey teması `data-pl-surface`, açık/koyu `data-pl-theme` ile verilir. Canlı önizleme: `assets/pl-galeri.html`.

## Kurulum (her ekran için)

```html
<link rel="stylesheet" href="pl-tokens.css">
<link rel="stylesheet" href="pl-components.css">
<link rel="stylesheet" href="pl-advanced.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&display=swap">

<div data-pl data-pl-theme="dark" data-pl-surface="hud" data-pl-product="flowdock" lang="tr">
  <!-- PluginLabs komponentleri burada -->
</div>
```

## Yüzey temaları (`data-pl-surface`)

| Kod | Ad | Karakter |
|---|---|---|
| `varsayilan` | Varsayılan | Gece atölyesi koyu zemin |
| `glass` | Cam | Buzlu cam katmanlar, renkli zemin üstünde |
| `hud` | HUD | Komuta merkezi: siyah-mavi, camgöbeği çizgi |
| `neon` | Neon | Canlı skor / oyun: yüksek kontrast limon |
| `soft` | Soft | Açık pastel SaaS paneli, büyük köşeler |
| `cockpit` | Kokpit | Araç / drone HMI: saf siyah, mavi yaylar |

## İçindekiler

| ID | Komponent | Kategori | Yüzey / Ürün |
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
| PLA-001 | [Uygulama Penceresi](#pla-001) | Kabuk & Pencere | — |
| PLA-002 | [İkon Rayı](#pla-002) | Kabuk & Pencere | — |
| PLA-003 | [Yüzen Hap Ray](#pla-003) | Kabuk & Pencere | — |
| PLA-004 | [Hap Üst Gezinme](#pla-004) | Kabuk & Pencere | — |
| PLA-005 | [Cam Kenar Çubuğu](#pla-005) | Kabuk & Pencere | `glass` |
| PLA-006 | [Proje Kenar Çubuğu](#pla-006) | Kabuk & Pencere | — |
| PLA-007 | [Özellik Denetçisi](#pla-007) | Kabuk & Pencere | — |
| PLA-008 | [Görüntüleyici Araç Kümesi](#pla-008) | Kabuk & Pencere | — |
| PLA-009 | [HUD Çerçeve Paneli](#pla-009) | Kabuk & Pencere | `hud` |
| PLA-010 | [Durum Çubuğu](#pla-010) | Kabuk & Pencere | — |
| PLA-011 | [Sinematik Kahraman](#pla-011) | Medya & Eğlence | — |
| PLA-012 | [Poster Kartı](#pla-012) | Medya & Eğlence | — |
| PLA-013 | [Poster Rafı](#pla-013) | Medya & Eğlence | — |
| PLA-014 | [İzlemeye Devam Kartı](#pla-014) | Medya & Eğlence | — |
| PLA-015 | [Mağaza İndirim Kartı](#pla-015) | Medya & Eğlence | — |
| PLA-016 | [Öne Çıkan Yığın Karusel](#pla-016) | Medya & Eğlence | — |
| PLA-017 | [Trend Kartı](#pla-017) | Medya & Eğlence | — |
| PLA-018 | [Kampanya Afişi](#pla-018) | Medya & Eğlence | — |
| PLA-019 | [Mini Oynatıcı](#pla-019) | Medya & Eğlence | — |
| PLA-020 | [Dinamik Ada Oynatıcı](#pla-020) | Medya & Eğlence | — |
| PLA-021 | [Canlı Maç Skor Kartı](#pla-021) | Canlı Veri & Spor | `neon` |
| PLA-022 | [Maç Satırı + Oran Çipleri](#pla-022) | Canlı Veri & Spor | `neon` |
| PLA-023 | [Neon Vurgu Kartı](#pla-023) | Canlı Veri & Spor | `neon` |
| PLA-024 | [Canlı Akış Bandı](#pla-024) | Canlı Veri & Spor | — |
| PLA-025 | [Cihaz Anahtar Karosu](#pla-025) | Akıllı Ev & IoT | — |
| PLA-026 | [Sensör Kaplama Kartı](#pla-026) | Akıllı Ev & IoT | `glass` |
| PLA-027 | [Oda Başlık Kartı](#pla-027) | Akıllı Ev & IoT | — |
| PLA-028 | [İklim Çipleri](#pla-028) | Akıllı Ev & IoT | — |
| PLA-029 | [Üye Varlık Şeridi](#pla-029) | Akıllı Ev & IoT | — |
| PLA-030 | [Kat Seçici Paneli](#pla-030) | Akıllı Ev & IoT | `glass` |
| PLA-031 | [Harita Sıcak Noktası](#pla-031) | Akıllı Ev & IoT | — |
| PLA-032 | [Saat & Hava Widget'ı](#pla-032) | Akıllı Ev & IoT | `glass` |
| PLA-033 | [Ekipman Sayaç Karosu](#pla-033) | Akıllı Ev & IoT | `hud` |
| PLA-034 | [İzometrik Plan Görüntüleyici](#pla-034) | Akıllı Ev & IoT | — |
| PLA-035 | [HUD Büyük Metrik](#pla-035) | HUD & Endüstri | `hud` |
| PLA-036 | [Dalga Formu Monitörü](#pla-036) | HUD & Endüstri | `hud` |
| PLA-037 | [HUD Halka Göstergeleri](#pla-037) | HUD & Endüstri | `hud` |
| PLA-038 | [HUD Veri Tablosu](#pla-038) | HUD & Endüstri | `hud` |
| PLA-039 | [Halka Yüzde Metriği](#pla-039) | HUD & Endüstri | — |
| PLA-040 | [Proses Akış Şeması](#pla-040) | HUD & Endüstri | — |
| PLA-041 | [Segment Çubuk Grafik](#pla-041) | HUD & Endüstri | `hud` |
| PLA-042 | [Film Şeridi Zaman Ekseni](#pla-042) | HUD & Endüstri | — |
| PLA-043 | [Hafta Gün Şeridi](#pla-043) | Üretkenlik & İK | — |
| PLA-044 | [Takvim Panosu](#pla-044) | Üretkenlik & İK | — |
| PLA-045 | [Büyük Sayı Üçlüsü](#pla-045) | Üretkenlik & İK | — |
| PLA-046 | [Bölümlü İlerleme Hapları](#pla-046) | Üretkenlik & İK | — |
| PLA-047 | [Zaman Takip Kadranı](#pla-047) | Üretkenlik & İK | — |
| PLA-048 | [Karanlık Görev Kartı](#pla-048) | Üretkenlik & İK | — |
| PLA-049 | [Profil Fotoğraf Kartı](#pla-049) | Üretkenlik & İK | — |
| PLA-050 | [İnce Çubuk İlerleme Grafiği](#pla-050) | Üretkenlik & İK | — |
| PLA-051 | [Günlük Ajanda](#pla-051) | Üretkenlik & İK | — |
| PLA-052 | [Karşılama Başlığı](#pla-052) | Üretkenlik & İK | — |
| PLA-053 | [Renkli İkonlu İstatistik Kartı](#pla-053) | Üretkenlik & İK | — |
| PLA-054 | [Alan Grafiği + İpucu](#pla-054) | Üretkenlik & İK | — |
| PLA-055 | [Randevu Zaman Çizelgesi](#pla-055) | Üretkenlik & İK | — |
| PLA-056 | [İş Süreci Adımlayıcı](#pla-056) | CRM & İş | — |
| PLA-057 | [Skor Göstergesi](#pla-057) | CRM & İş | — |
| PLA-058 | [Kişi Ayrıntı Kartı](#pla-058) | CRM & İş | — |
| PLA-059 | [İş Kuyruğu Listesi](#pla-059) | CRM & İş | — |
| PLA-060 | [Mülk Özellik Paneli](#pla-060) | CRM & İş | — |
| PLA-061 | [Değerleme Hesaplayıcı](#pla-061) | CRM & İş | — |
| PLA-062 | [Benzer Kayıt Satırı](#pla-062) | CRM & İş | — |
| PLA-063 | [Çok İzli Zaman Çizelgesi](#pla-063) | Yaratıcı Araçlar | — |
| PLA-064 | [Oynatma Kontrolleri](#pla-064) | Yaratıcı Araçlar | — |
| PLA-065 | [Medya Kutusu Izgarası](#pla-065) | Yaratıcı Araçlar | — |
| PLA-066 | [Düğüm Grafiği](#pla-066) | Yaratıcı Araçlar | — |
| PLA-067 | [Ses Dalga Çubuğu](#pla-067) | Yaratıcı Araçlar | — |
| PLA-068 | [Katman Listesi](#pla-068) | Yaratıcı Araçlar | — |
| PLA-069 | [Sayfa Film Şeridi](#pla-069) | Yaratıcı Araçlar | — |
| PLA-070 | [Alt Menülü Bağlam Menüsü](#pla-070) | Yaratıcı Araçlar | — |
| PLA-071 | [Gösterge Kümesi](#pla-071) | Mobilite & Cihaz | `cockpit` |
| PLA-072 | [Vites Seçici](#pla-072) | Mobilite & Cihaz | `cockpit` |
| PLA-073 | [Yön Tarifi Kartı](#pla-073) | Mobilite & Cihaz | `glass` |
| PLA-074 | [Menzil / Batarya Çubuğu](#pla-074) | Mobilite & Cihaz | `cockpit` |
| PLA-075 | [Pusula Kadranı](#pla-075) | Mobilite & Cihaz | `cockpit` |
| PLA-076 | [Kumanda Yön Pedi](#pla-076) | Mobilite & Cihaz | `cockpit` |
| PLA-077 | [Kamera Akışı HUD](#pla-077) | Mobilite & Cihaz | — |
| PLA-078 | [Telemetri Izgarası](#pla-078) | Mobilite & Cihaz | `cockpit` |
| PLA-079 | [Büyük Yaşamsal Değer Kartı](#pla-079) | Sağlık, Yaşam & Ticaret | — |
| PLA-080 | [Aktivite Karosu](#pla-080) | Sağlık, Yaşam & Ticaret | — |
| PLA-081 | [Aksan Dolgulu Genel Bakış Kartı](#pla-081) | Sağlık, Yaşam & Ticaret | — |
| PLA-082 | [Arkadaş / Kişi Listesi](#pla-082) | Sağlık, Yaşam & Ticaret | — |
| PLA-083 | [Küre İstatistik Paneli](#pla-083) | Sağlık, Yaşam & Ticaret | — |
| PLA-084 | [Kategori İkon Çipleri](#pla-084) | Sağlık, Yaşam & Ticaret | — |
| PLA-085 | [Ürün Vitrin Kartı](#pla-085) | Sağlık, Yaşam & Ticaret | Mutfak Atölyesi |
| PLA-086 | [Sipariş Özeti](#pla-086) | Sağlık, Yaşam & Ticaret | Mutfak Atölyesi |
| PLA-087 | [İndirim Kartı](#pla-087) | Sağlık, Yaşam & Ticaret | — |
| PLA-088 | [Oyun İstatistik Halkası](#pla-088) | Sağlık, Yaşam & Ticaret | — |
| PLA-089 | [Sosyal Profil Kartı](#pla-089) | Sağlık, Yaşam & Ticaret | — |
| PLA-090 | [Araştırma Gantt Şeridi](#pla-090) | Sağlık, Yaşam & Ticaret | — |
| PLA-091 | [Akıllı Ev Kontrol Merkezi](#pla-091) | Ekran Şablonları | Flow Dock |
| PLA-092 | [Medya Kitaplığı & Mağaza](#pla-092) | Ekran Şablonları | PluginLabs Hub |
| PLA-093 | [Canlı Skor Merkezi](#pla-093) | Ekran Şablonları | `neon` |
| PLA-094 | [IoT Komuta HUD](#pla-094) | Ekran Şablonları | `hud` |
| PLA-095 | [Video Kurgu Stüdyosu](#pla-095) | Ekran Şablonları | — |
| PLA-096 | [Araç HMI Kokpit](#pla-096) | Ekran Şablonları | `cockpit` |
| PLA-097 | [İK Kontrol Paneli](#pla-097) | Ekran Şablonları | `soft` · `light` |
| PLA-098 | [CRM Kayıt Ekranı](#pla-098) | Ekran Şablonları | `soft` · `light` |
| PLA-099 | [Drone Yer İstasyonu](#pla-099) | Ekran Şablonları | `cockpit` |
| PLA-100 | [Klinik Paneli](#pla-100) | Ekran Şablonları | `soft` · `light` |
| PLA-101 | [Takvim & Ekip Planlayıcı](#pla-101) | Ekran Şablonları | Mind Palace |
| PLA-102 | [Kat Planı Navigatörü](#pla-102) | Ekran Şablonları | `glass` |


---

# TEMEL KATMAN (PLC)


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


---

# ADVANCED KATMAN (PLA)


---

## Kabuk & Pencere (10)

### PLA-001

**Uygulama Penceresi** · `app-window`

- **Amaç:** Trafik ışıklı başlık çubuğu, 22px köşe ve derin gölgeli masaüstü penceresi; 'floating' varyantında iç panoların hepsi pencere içinde yüzer.
- **Ne zaman:** Her masaüstü uygulamasının kök kabuğu; onboarding ve pazarlama görsellerinde cihaz çerçevesi.
- **Desen kaynağı:** Pinler 5, 7, 11, 17, 18, 31, 39 — yuvarlak köşeli, yüzen masaüstü pencereleri
- **Durumlar:** odaklı, odaksız (başlık soluk), floating
- **Sınıflar:** `pl-window pl-window--floating pl-window__bar pl-window__lights pl-window__title pl-window__body`
- **Erişilebilirlik:** Pencere kontrolleri <button aria-label>; Windows'ta sağda pl-winctl kullanılır.

```html
<div class="pl-window" style="height:220px">
  <div class="pl-window__bar"><div class="pl-window__lights" aria-hidden="true"><i></i><i></i><i></i></div><div class="pl-window__title">Flow Dock — Çalışma Alanı</div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Paylaş"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg></button></div>
  <div class="pl-window__body"><div class="pl-rail" style="padding:12px 0"><button class="pl-rail__item is-active" aria-label="Ana sayfa"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg></button><button class="pl-rail__item" aria-label="Takvim"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></button><button class="pl-rail__item" aria-label="Ayarlar"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button></div>
  <div style="flex:1;padding:16px;display:grid;gap:10px;align-content:start"><div class="pl-skeleton" style="height:14px;width:40%"></div><div class="pl-skeleton" style="height:70px"></div><div class="pl-skeleton" style="height:14px;width:70%"></div></div></div>
</div>
```

### PLA-002

**İkon Rayı** · `icon-rail`

- **Amaç:** 72px genişlikte, logo karosu + ikon öğeleri + alt yardımcılar. Aktif öğe aksan zemini ve sol çizgiyle işaretlenir; hover'da etiket ipucu açılır.
- **Ne zaman:** İçerik alanının maksimum olması gereken yoğun uygulamalar (kurgu, harita, komuta ekranı).
- **Desen kaynağı:** Pinler 5, 7, 14, 15, 18, 21, 26 — 72px dikey ikon gezinmesi
- **Durumlar:** varsayılan, hover (ipucu), aktif, rozetli
- **Sınıflar:** `pl-rail pl-rail__logo pl-rail__item is-active pl-rail__tip pl-rail__spacer`
- **Erişilebilirlik:** <nav aria-label>; her öğe aria-label + görünür ipucu; aktif öğe aria-current="page".

```html
<nav class="pl-rail" aria-label="Ana gezinme" style="height:330px;border-radius:16px;border:1px solid var(--pl-line)">
  <span class="pl-rail__logo">PL</span>
  <button class="pl-rail__item is-active" aria-current="page" aria-label="Pano"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg><span class="pl-rail__tip">Pano</span></button>
  <button class="pl-rail__item" aria-label="Kitaplık"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/></svg><span class="pl-rail__tip">Kitaplık</span></button>
  <button class="pl-rail__item" aria-label="Bildirimler"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><span class="pl-badge pl-badge--count">3</span><span class="pl-rail__tip">Bildirimler</span></button>
  <button class="pl-rail__item" aria-label="Harita"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg><span class="pl-rail__tip">Harita</span></button>
  <span class="pl-rail__spacer"></span>
  <button class="pl-rail__item" aria-label="Ayarlar"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span class="pl-rail__tip">Ayarlar</span></button>
</nav>
```

### PLA-003

**Yüzen Hap Ray** · `pill-rail`

- **Amaç:** Aksan renginde dolu, köşeleri 28px hap ray. Aktif öğe yüzey renginde 'kesik' karo olarak öne çıkar.
- **Ne zaman:** Açık temalı, samimi tüketici panelleri (fitness, sağlık, kişisel finans).
- **Desen kaynağı:** Pin 33 — mor, tamamen yuvarlatılmış yüzen kenar çubuğu
- **Durumlar:** varsayılan, hover, aktif
- **Sınıflar:** `pl-pillrail pl-pillrail__item is-active`
- **Erişilebilirlik:** Aksan zemininde ikon kontrastı ≥3:1 olmalı; --pl-fg-on-accent kullanılır.

```html
<nav class="pl-pillrail" aria-label="Gezinme" style="height:300px">
  <button class="pl-pillrail__item" aria-label="Ara"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg></button>
  <button class="pl-pillrail__item is-active" aria-current="page" aria-label="Ana sayfa"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg></button>
  <button class="pl-pillrail__item" aria-label="Aktivite"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></button>
  <button class="pl-pillrail__item" aria-label="Takvim"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></button>
  <button class="pl-pillrail__item" aria-label="Zaman"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/></svg></button>
  <span style="flex:1"></span>
  <button class="pl-pillrail__item" aria-label="Çıkış"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/></svg></button>
</nav>
```

### PLA-004

**Hap Üst Gezinme** · `pill-nav`

- **Amaç:** Kapsül içinde metin sekmeleri; aktif sekme ters renk (metin rengi zemin) ile vurgulanır.
- **Ne zaman:** Üst düzey modüller arası geçiş (Pano · Kişiler · İşe Alım · Cihazlar…).
- **Desen kaynağı:** Pin 39 — üst ortada siyah aktif haplı gezinme
- **Durumlar:** varsayılan, hover, aktif
- **Sınıflar:** `pl-pillnav > a.is-active`
- **Erişilebilirlik:** <nav> içinde <a aria-current="page">.

```html
<nav class="pl-pillnav" aria-label="Modüller"><a class="is-active" href="#" aria-current="page">Pano</a><a href="#">Kişiler</a><a href="#">İşe alım</a><a href="#">Cihazlar</a><a href="#">Uygulamalar</a><a href="#">Maaş</a></nav>
```

### PLA-005

**Cam Kenar Çubuğu** · `glass-sidebar`

- **Amaç:** Arkasındaki görseli bulanıklaştıran cam panel; marka, birincil gezinme ve 'Hesap' bölümü.
- **Ne zaman:** Medya/eğlence uygulamaları, görsel ağırlıklı içerik üzerinde kalıcı gezinme.
- **Desen kaynağı:** Pin 27 — bulanık arka plan üzerinde buzlu cam gezinme
- **Kapsayıcı:** `<div data-pl data-pl-surface="glass">`
- **Durumlar:** varsayılan, hover, aktif
- **Sınıflar:** `pl-glassnav pl-glass pl-glassnav__brand pl-glassnav__item is-active pl-glassnav__sec`
- **Erişilebilirlik:** Cam zeminde metin kontrastı arka plan en açık noktasına göre ölçülür; gerekirse --pl-glass-bg-strong.

```html
<div style="background:var(--pl-grad-aurora);padding:18px;border-radius:20px"><nav class="pl-glassnav pl-glass" aria-label="Kitaplık">
  <div class="pl-glassnav__brand">Cine<span style="color:var(--pl-accent)">.</span></div>
  <a class="pl-glassnav__item is-active" href="#" aria-current="page"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>Ana sayfa</a>
  <a class="pl-glassnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/></svg>Filmler</a>
  <a class="pl-glassnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="m17 2-5 5-5-5"/></svg>Diziler</a>
  <a class="pl-glassnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>Favoriler</a>
  <span class="pl-label pl-glassnav__sec">Hesap</span>
  <a class="pl-glassnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>Topluluk</a>
  <a class="pl-glassnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Ayarlar</a>
</nav></div>
```

### PLA-006

**Proje Kenar Çubuğu** · `project-sidebar`

- **Amaç:** Genel gezinme + renk kodlu proje listesi + ekip bölümü + altta kullanıcı kartı.
- **Ne zaman:** Görev, takvim, proje yönetimi uygulamaları.
- **Desen kaynağı:** Pin 11 — renkli proje ikonlu, sayaçlı, kullanıcı kartlı kenar çubuğu
- **Durumlar:** varsayılan, hover, aktif
- **Sınıflar:** `pl-projnav pl-projnav__item is-active pl-projnav__ic (--c) pl-projnav__count pl-projnav__sec pl-projnav__user`
- **Erişilebilirlik:** Proje rengi yalnız dekoratiftir; proje adı her zaman metin olarak görünür.

```html
<nav class="pl-projnav" aria-label="Projeler">
  <a class="pl-projnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>Genel bakış</a>
  <a class="pl-projnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>Analiz</a>
  <a class="pl-projnav__item is-active" href="#" aria-current="page"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>Ekip<span class="pl-projnav__count">8</span></a>
  <div class="pl-projnav__sec"><span class="pl-label">Projeler</span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Proje ekle"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg></button></div>
  <a class="pl-projnav__item" href="#"><span class="pl-projnav__ic" style="--c:var(--pl-viz-6)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></span>Mutfak Atölyesi<span class="pl-projnav__count">12</span></a>
  <a class="pl-projnav__item" href="#"><span class="pl-projnav__ic" style="--c:var(--pl-viz-2)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg></span>Leo Helper<span class="pl-projnav__count">4</span></a>
  <a class="pl-projnav__item" href="#"><span class="pl-projnav__ic" style="--c:var(--pl-viz-8)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/></svg></span>Tweakster<span class="pl-projnav__count">7</span></a>
  <div class="pl-projnav__user"><span class="pl-avatar pl-avatar--accent is-online">MI</span><div style="flex:1;min-width:0"><b style="color:var(--pl-fg-1);font-size:13px">Muhammed</b><div class="pl-muted" style="font-size:11px">Yönetici</div></div><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></div>
</nav>
```

### PLA-007

**Özellik Denetçisi** · `inspector`

- **Amaç:** Sekmeli denetçi: hizalama çubuğu, X/Y/G/Y alanları, metin, dolgu ve efekt bölümleri. Tüm alanlar mono değer gösterir.
- **Ne zaman:** Editörler: tasarım, kurgu, düğüm, form oluşturucu.
- **Desen kaynağı:** Pin 22 — tasarım aracında sağ 'Design / Animation' özellik paneli
- **Durumlar:** varsayılan, alan odakta, karışık değer, devre dışı
- **Sınıflar:** `pl-inspector pl-inspector__tabs pl-inspector__sec pl-inspector__grid pl-propfield pl-propfield__sw pl-alignbar`
- **Erişilebilirlik:** Her pl-propfield bir <label> içerir (b etiketi görünür ad); sayısal alanlarda ok tuşu ile ±1, Shift ile ±10.

```html
<aside class="pl-inspector" aria-label="Özellikler" style="width:100%;border:1px solid var(--pl-line);border-radius:14px">
  <div class="pl-inspector__tabs"><button class="is-active">Tasarım</button><button>Animasyon</button></div>
  <div class="pl-inspector__sec"><div class="pl-alignbar"><button aria-label="Hizala 0"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button><button aria-label="Hizala 1"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button><button aria-label="Hizala 2" class="is-active"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button><button aria-label="Hizala 3"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button><button aria-label="Hizala 4"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button><button aria-label="Hizala 5"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button></div>
  <div class="pl-inspector__grid"><label class="pl-propfield"><b>X</b><input value="240"></label><label class="pl-propfield"><b>Y</b><input value="96"></label><label class="pl-propfield"><b>G</b><input value="1080"></label><label class="pl-propfield"><b>Y</b><input value="1350"></label></div></div>
  <div class="pl-inspector__sec"><div class="pl-inspector__sechead">Metin <svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg></div><label class="pl-propfield"><b>Aa</b><input value="Inter · Bold"></label><div class="pl-inspector__grid"><label class="pl-propfield"><b>pt</b><input value="48"></label><label class="pl-propfield"><b>↕</b><input value="%110"></label></div></div>
  <div class="pl-inspector__sec"><div class="pl-inspector__sechead">Dolgu <svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg></div><label class="pl-propfield"><span class="pl-propfield__sw"></span><input value="7C6CFF"><b>%100</b></label></div>
</aside>
```

### PLA-008

**Görüntüleyici Araç Kümesi** · `view-tools`

- **Amaç:** Harita / 3B sahne / plan üzerinde yüzen dikey veya yatay araç kümesi. Cam zemin, aktif mod aksan dolgulu.
- **Ne zaman:** Tuval, harita, kat planı, 3B model görüntüleyicileri.
- **Desen kaynağı:** Pinler 0, 1, 15 — 2D/3D geçişi, yakınlaştırma, döndürme düğmeleri
- **Durumlar:** varsayılan, hover, aktif mod, yatay
- **Sınıflar:** `pl-viewtools pl-viewtools--h button.is-active hr`
- **Erişilebilirlik:** role="toolbar" + aria-orientation; mod düğmeleri aria-pressed.

```html
<div class="pl-row" style="gap:16px;align-items:flex-start"><div class="pl-viewtools" role="toolbar" aria-orientation="vertical" aria-label="Görünüm"><button aria-pressed="false">2D</button><button class="is-active" aria-pressed="true">3D</button><hr><button aria-label="Yakınlaştır"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg></button><button aria-label="Uzaklaştır"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h6"/></svg></button><button aria-label="Tam ekran"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></button></div>
<div class="pl-viewtools pl-viewtools--h" role="toolbar" aria-label="Sahne"><button aria-label="Seç" class="is-active"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51z"/><path d="m13 13 6 6"/></svg></button><button aria-label="Küp"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05M12 22.08V12"/></svg></button><hr><button aria-label="Geri al"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg></button><button aria-label="Yinele"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg></button></div></div>
```

### PLA-009

**HUD Çerçeve Paneli** · `hud-frame`

- **Amaç:** Kesik köşeli (clip-path) panel, ince ızgara dokusu, camgöbeği başlık şeridi ve köşe braketleri.
- **Ne zaman:** Komuta merkezi, fabrika/IoT izleme, güvenlik ve sağlık görselleştirme ekranları.
- **Desen kaynağı:** Pinler 10, 13, 16, 20, 43 — köşesi kesik, ızgaralı komuta paneli
- **Kapsayıcı:** `<div data-pl data-pl-surface="hud">`
- **Durumlar:** normal, uyarı (başlık amber), kritik (başlık kırmızı)
- **Sınıflar:** `pl-hudframe pl-hudframe__title pl-hudframe__corner--tl|br`
- **Erişilebilirlik:** Dekoratif köşeler aria-hidden; başlık gerçek <h3> olarak da verilebilir.

```html
<section class="pl-hudframe" aria-label="Üretim durumu"><div class="pl-hudframe__title">Üretim Durumu <span>01.11.2026 · 21:40</span></div><i class="pl-hudframe__corner pl-hudframe__corner--tl" aria-hidden="true"></i><i class="pl-hudframe__corner pl-hudframe__corner--br" aria-hidden="true"></i>
<div class="pl-row" style="justify-content:space-between"><div><div class="pl-label">Aktif hat</div><div style="font-family:var(--pl-font-hud);font-size:34px;font-weight:700;color:var(--pl-fg-1)">12<span style="font-size:16px;color:var(--pl-fg-3)">/14</span></div></div><div><div class="pl-label">Verim</div><div style="font-family:var(--pl-font-hud);font-size:34px;font-weight:700;color:var(--pl-hud)">%96,4</div></div></div></section>
```

### PLA-010

**Durum Çubuğu** · `status-bar`

- **Amaç:** Pencerenin en altında 26px şerit: senkron, dal/proje, imleç konumu, kodlama, sürüm. Tamamen mono.
- **Ne zaman:** Editörler ve uzun süre açık kalan masaüstü araçları.
- **Desen kaynağı:** Pinler 17, 21 — editörlerin alt bilgi şeridi
- **Durumlar:** normal, senkronlanıyor, hata (öğe kırmızı)
- **Sınıflar:** `pl-statusbar pl-statusbar__item is-accent pl-statusbar__spacer`
- **Erişilebilirlik:** role="status" + aria-live="polite" yalnız değişen öğe için.

```html
<footer class="pl-statusbar" role="status" style="border:1px solid var(--pl-line);border-radius:8px"><span class="pl-statusbar__item is-accent"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>Senkron</span><span class="pl-statusbar__item"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="12" r="3"/><path d="M6 9v6M9 6h3a3 3 0 0 1 3 3v0"/></svg>main</span><span class="pl-statusbar__item"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/></svg>0 uyarı</span><span class="pl-statusbar__spacer"></span><span class="pl-statusbar__item">Sat 42, Süt 18</span><span class="pl-statusbar__item">UTF-8</span><span class="pl-statusbar__item">1080p · 30 FPS</span><span class="pl-statusbar__item">v2.0.0</span></footer>
```


---

## Medya & Eğlence (10)

### PLA-011

**Sinematik Kahraman** · `cine-hero`

- **Amaç:** Tam genişlik sahne, soldan ve alttan karartma, büyük harfli başlık, yaş/kalite/yıl meta hapları ve CTA çifti.
- **Ne zaman:** Medya kitaplığı vitrin alanı, ürün lansmanı, öne çıkan içerik.
- **Desen kaynağı:** Pin 2 — film detay kahramanı: kategori, büyük başlık, meta hapları, açıklama
- **Durumlar:** varsayılan, fragman oynatılıyor, yükleniyor (iskelet)
- **Sınıflar:** `pl-cinehero pl-cinehero__art pl-cinehero__body pl-cinehero__kicker pl-cinehero__title pl-cinehero__meta pl-chip--ghost pl-chip--mono`
- **Erişilebilirlik:** Görsel arka plan dekoratif (alt=""); başlık <h2>; meta bilgisi düz metin.

```html
<section class="pl-cinehero"><div class="pl-cinehero__body">
  <span class="pl-cinehero__kicker"><span class="pl-dot"></span>PluginLabs Film</span>
  <h2 class="pl-cinehero__title">Gece Atölyesi</h2>
  <div class="pl-cinehero__meta"><span class="is-new">Yeni</span><span class="pl-chip pl-chip--ghost pl-chip--mono">2026</span><span class="pl-chip pl-chip--ghost pl-chip--mono">16+</span><span class="pl-chip pl-chip--ghost pl-chip--mono">1s 52dk</span><span class="pl-chip pl-chip--ghost pl-chip--mono">4K</span><span class="pl-chip pl-chip--ghost pl-chip--mono">5.1</span></div>
  <p class="pl-cinehero__desc">Bir grup geliştiricinin tek gecede kendi araç ailesini kurmasını anlatan belgesel.</p>
  <div class="pl-row"><button class="pl-btn pl-btn--primary pl-btn--lg"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>İzle</button><button class="pl-btn pl-btn--secondary pl-btn--lg"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg>Listeme ekle</button></div>
</div></section>
```

### PLA-012

**Poster Kartı** · `poster-card`

- **Amaç:** 2:3 poster, alt karartma, büyük harfli başlık; isteğe bağlı aksan şerit ('Yeni eklendi') ve köşe etiketi.
- **Ne zaman:** Medya rafları, şablon galerileri, uygulama kataloğu kapakları.
- **Desen kaynağı:** Pin 2 — 'Recently Added' şeritli dikey posterler
- **Durumlar:** varsayılan, hover (yüksel + aksan halkası), şeritli, etiketli
- **Sınıflar:** `pl-poster pl-poster--wide pl-poster__title pl-poster__ribbon pl-poster__tag pl-media--2..6`
- **Erişilebilirlik:** <a> öğesi; şerit metni ekran okuyucuya başlıktan sonra okunur.

```html
<div class="pl-row" style="gap:12px"><a class="pl-poster" href="#"><span class="pl-poster__tag pl-chip pl-chip--accent pl-chip--mono">TOP 10</span><span class="pl-poster__title">Kod Gecesi</span><span class="pl-poster__ribbon">Yeni eklendi</span></a>
<a class="pl-poster pl-media--2" href="#" style="background:var(--pl-media-2)"><span class="pl-poster__title">Derin Mavi</span></a></div>
```

### PLA-013

**Poster Rafı** · `poster-shelf`

- **Amaç:** Başlık + 'Tümünü gör' + ok düğmeleri ile yatay kaydırılan raf; scroll-snap ile poster hizalama.
- **Ne zaman:** Kategori rafları, son görüntülenenler, öneriler.
- **Desen kaynağı:** Pinler 2, 5, 27 — 'Only on…', 'Movies', 'Games with discounts' rafları
- **Durumlar:** varsayılan, başta (sol ok pasif), sonda (sağ ok pasif)
- **Sınıflar:** `pl-shelf pl-shelf__head pl-shelf__title pl-scroll-x pl-poster`
- **Erişilebilirlik:** Raf <section aria-labelledby>; oklar aria-controls ile rafı gösterir; klavyede Tab posterler arası gezer.

```html
<section class="pl-shelf" aria-labelledby="raf1"><div class="pl-shelf__head"><h3 class="pl-shelf__title" id="raf1">Yalnız PluginLabs'ta</h3><a class="pl-link" href="#">Tümünü gör</a><button class="pl-iconbtn pl-iconbtn--outline pl-iconbtn--sm" aria-label="Önceki" disabled><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><button class="pl-iconbtn pl-iconbtn--outline pl-iconbtn--sm" aria-label="Sonraki"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button></div>
<div class="pl-scroll-x"><a class="pl-poster" href="#" style="background:var(--pl-media-1)"><span class="pl-poster__title">Kod Gecesi</span><span class=pl-poster__ribbon>Yeni eklendi</span></a><a class="pl-poster" href="#" style="background:var(--pl-media-2)"><span class="pl-poster__title">Derin Mavi</span></a><a class="pl-poster" href="#" style="background:var(--pl-media-3)"><span class="pl-poster__title">Kırmızı Hat</span></a><a class="pl-poster" href="#" style="background:var(--pl-media-4)"><span class="pl-poster__title">Yeşil Işık</span><span class=pl-poster__ribbon>Yeni eklendi</span></a><a class="pl-poster" href="#" style="background:var(--pl-media-5)"><span class="pl-poster__title">Altın Saat</span></a><a class="pl-poster" href="#" style="background:var(--pl-media-6)"><span class="pl-poster__title">Gece Yarısı</span></a><a class="pl-poster" href="#" style="background:var(--pl-media-1)"><span class="pl-poster__title">Kuzey</span></a></div></section>
```

### PLA-014

**İzlemeye Devam Kartı** · `resume-card`

- **Amaç:** 16:9 küçük resim, ortada oynat düğmesi, altta ilerleme çizgisi ve başlık.
- **Ne zaman:** Kaldığın yerden devam: video, kurs, belge, kurgu projesi.
- **Desen kaynağı:** Pin 2 — 'Continue watching' satırı
- **Durumlar:** varsayılan, hover, tamamlandı (çubuk dolu + onay)
- **Sınıflar:** `pl-resume pl-resume__thumb pl-resume__play pl-resume__bar (--pl-val) pl-resume__title`
- **Erişilebilirlik:** İlerleme metin olarak da verilir: "%62 izlendi".

```html
<a class="pl-resume" href="#" style="text-decoration:none"><div class="pl-resume__thumb"><span class="pl-resume__play"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg></span><div class="pl-resume__bar" style="--pl-val:62%"><span></span></div></div><div class="pl-resume__title">Bölüm 3 · Komut paleti</div><div class="pl-muted" style="font-size:11px">%62 izlendi · 18 dk kaldı</div></a>
```

### PLA-015

**Mağaza İndirim Kartı** · `deal-card`

- **Amaç:** Kapak, platform etiketi, ad, yüzde indirim rozeti, eski (üstü çizili) ve yeni fiyat.
- **Ne zaman:** Mağaza, eklenti pazarı, abonelik kampanyaları.
- **Desen kaynağı:** Pin 5 — 'Games with discounts' kartları
- **Durumlar:** varsayılan, indirimde, sahip olunan (Kuruldu rozeti)
- **Sınıflar:** `pl-deal pl-deal__art pl-deal__plat pl-deal__name pl-deal__price pl-deal__off pl-deal__old pl-deal__now`
- **Erişilebilirlik:** Eski fiyat <s> ile; "%40 indirim, 1.249,90 ₺ yerine 749,90 ₺" ekran okuyucu metni.

```html
<div class="pl-row" style="gap:12px;align-items:flex-start"><article class="pl-deal"><div class="pl-deal__art"></div><span class="pl-deal__plat">Masaüstü</span><span class="pl-deal__name">Tweakster Pro</span><div class="pl-deal__price"><span class="pl-deal__off">-%40</span><s class="pl-deal__old">1.249,90 ₺</s><span class="pl-deal__now">749,90 ₺</span></div></article>
<article class="pl-deal"><div class="pl-deal__art" style="background:var(--pl-media-6)"></div><span class="pl-deal__plat">Eklenti</span><span class="pl-deal__name">Leo Helper</span><div class="pl-deal__price"><span class="pl-deal__off">-%25</span><s class="pl-deal__old">399,90 ₺</s><span class="pl-deal__now">299,90 ₺</span></div></article></div>
```

### PLA-016

**Öne Çıkan Yığın Karusel** · `stack-carousel`

- **Amaç:** Merkez kart öne çıkar, yan kartlar 3B perspektifle küçülür ve kararır; merkezde ön sipariş CTA'sı.
- **Ne zaman:** Mağaza vitrini, sürüm lansmanı, şablon seçici.
- **Desen kaynağı:** Pin 5 — ortada büyük, yanlarda perspektifli küçülen kapaklar
- **Durumlar:** merkez, geçiş animasyonu
- **Sınıflar:** `pl-stack3d pl-stack3d__card is-center`
- **Erişilebilirlik:** role="region" aria-roledescription="karusel"; ok tuşları ile geçiş; otomatik oynatma yok.

```html
<div class="pl-stack3d" role="region" aria-roledescription="karusel" aria-label="Öne çıkanlar"><div class="pl-stack3d__card"></div><div class="pl-stack3d__card"></div><div class="pl-stack3d__card is-center"><span class="pl-chip pl-chip--ghost pl-chip--mono" style="width:max-content">YENİ SÜRÜM</span><b style="font-size:22px;color:var(--pl-on-media);line-height:1.05;text-transform:uppercase;font-weight:800">Mind Palace 2</b><div class="pl-row"><button class="pl-btn pl-btn--primary pl-btn--sm">Ön sipariş</button><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Fragman"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg></button></div></div><div class="pl-stack3d__card"></div><div class="pl-stack3d__card"></div></div>
```

### PLA-017

**Trend Kartı** · `trend-card`

- **Amaç:** Kenarlıklı kart içinde 3:4 kapak; altında beğeni / görüntülenme / yorum mono sayaçları.
- **Ne zaman:** Topluluk içerikleri, popüler şablonlar, eklenti trendleri.
- **Desen kaynağı:** Pin 7 — 'Trending games' kartları ve istatistik satırı
- **Durumlar:** varsayılan, hover, beğenildi
- **Sınıflar:** `pl-trend pl-trend__art pl-trend__row`
- **Erişilebilirlik:** Sayaçlar "1,2 B beğeni" şeklinde aria-label taşır.

```html
<div class="pl-row" style="gap:10px"><article class="pl-trend"><div class="pl-trend__art"></div><div class="pl-trend__row"><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>4,2B</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg>18B</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>312</span></div></article><article class="pl-trend"><div class="pl-trend__art" style="background:var(--pl-media-3)"></div><div class="pl-trend__row"><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>2,9B</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg>11B</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>96</span></div></article></div>
```

### PLA-018

**Kampanya Afişi** · `promo-banner`

- **Amaç:** Büyük başlık + yüzde rozeti + açıklama + birincil/ikincil CTA; sağda kahraman görsel alanı, arkada aksan ışıması.
- **Ne zaman:** Pro'ya geçiş, sezon kampanyası, yeni ürün duyurusu.
- **Desen kaynağı:** Pin 7 — '50% OFF' kampanya bandı ve CTA çifti
- **Durumlar:** varsayılan, kapatılabilir
- **Sınıflar:** `pl-promo pl-promo__title pl-promo__off pl-promo__art`
- **Erişilebilirlik:** Kapat düğmesi aria-label="Kampanyayı gizle"; kampanya bitiş tarihi metinle.

```html
<section class="pl-promo"><div class="pl-stack" style="gap:10px;max-width:420px"><h3 class="pl-promo__title">Flow Dock Pro <span class="pl-promo__off">%50 İNDİRİM</span></h3><p class="pl-muted" style="margin:0">Sınırsız dock, iş akışı otomasyonu ve senkron. Kampanya 30.11.2026'da biter.</p><div class="pl-row"><button class="pl-btn pl-btn--primary">Satın al</button><button class="pl-btn pl-btn--secondary"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>Sepete ekle</button></div></div><div class="pl-promo__art" aria-hidden="true"></div></section>
```

### PLA-019

**Mini Oynatıcı** · `mini-player`

- **Amaç:** Kapak + başlık/sanatçı + önceki/oynat/sonraki + konum çubuğu ve zaman kodu.
- **Ne zaman:** Akıllı ev ses sistemi, odak müziği, sesli not oynatma.
- **Desen kaynağı:** Pinler 6, 21 — 'Music system' kartı ve kurgu önizleme kontrolleri
- **Durumlar:** çalıyor, duraklatıldı, arabelleğe alıyor
- **Sınıflar:** `pl-player pl-player__art pl-player__title pl-player__sub pl-player__ctl pl-player__btn--main pl-player__seek`
- **Erişilebilirlik:** Oynat düğmesi aria-pressed; konum çubuğu role="slider" + aria-valuetext="1:24 / 3:40".

```html
<div class="pl-player"><div class="pl-player__art" aria-hidden="true"></div><div style="min-width:0"><div class="pl-player__title">Gece Atölyesi — Odak</div><div class="pl-player__sub">Lo-fi · Salon hoparlörü</div></div><div class="pl-player__ctl"><button class="pl-player__btn" aria-label="Önceki"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 20 9 12l10-8z"/><path d="M5 19V5"/></svg></button><button class="pl-player__btn pl-player__btn--main" aria-label="Duraklat" aria-pressed="true"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg></button><button class="pl-player__btn" aria-label="Sonraki"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 4 10 8-10 8z"/><path d="M19 5v14"/></svg></button></div><div class="pl-player__seek"><span>1:24</span><div class="pl-progress" role="slider" aria-valuenow="38" aria-valuetext="1:24 / 3:40"><span style="--pl-val:38%"></span></div><span>3:40</span></div></div>
```

### PLA-020

**Dinamik Ada Oynatıcı** · `island-player`

- **Amaç:** Siyah kapsül; kapak, başlık, ekolayzer animasyonu, konum çubuğu ve üç büyük kontrol.
- **Ne zaman:** Masaüstü 'şimdi çalıyor' yüzen kontrolü, Flow Dock medya modülü.
- **Desen kaynağı:** Pin 37 — genişletilmiş müzik oynatıcı adası
- **Durumlar:** kompakt, genişletilmiş, duraklatıldı (ekolayzer durur)
- **Sınıflar:** `pl-island pl-island__top pl-island__art pl-island__eq pl-island__ctl`
- **Erişilebilirlik:** Ekolayzer aria-hidden; prefers-reduced-motion'da animasyon durur.

```html
<div class="pl-island"><div class="pl-island__top"><div class="pl-island__art"></div><div><b style="display:block">Kuzey Işıkları</b><span class="pl-muted">Atlas Ekibi</span></div><div class="pl-island__eq" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div><div class="pl-player__seek" style="display:grid"><span>2:35</span><div class="pl-progress"><span style="--pl-val:56%"></span></div><span>-2:02</span></div><div class="pl-island__ctl"><button aria-label="Önceki"><svg class="pl-ico pl-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="m11 19-9-7 9-7z"/><path d="m22 19-9-7 9-7z"/></svg></button><button aria-label="Duraklat"><svg class="pl-ico pl-ico--24" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg></button><button aria-label="Sonraki"><svg class="pl-ico pl-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 4 10 8-10 8z"/><path d="M19 5v14"/></svg></button></div></div>
```


---

## Canlı Veri & Spor (4)

### PLA-021

**Canlı Maç Skor Kartı** · `live-score`

- **Amaç:** CANLI göstergesi, iki takım arması, büyük mono skor, dakika ve hakimiyet çubuğu.
- **Ne zaman:** Canlı skor, turnuva, yarışma ve gerçek zamanlı karşılaştırma panelleri.
- **Desen kaynağı:** Pin 4 — canlı turnuva skor kartı
- **Kapsayıcı:** `<div data-pl data-pl-surface="neon">`
- **Durumlar:** canlı, devre arası, bitti, başlamadı (saat gösterir)
- **Sınıflar:** `pl-score pl-score__head pl-score__live pl-dot--live pl-score__teams pl-score__crest pl-score__vs pl-score__bar`
- **Erişilebilirlik:** Skor değişimi aria-live="polite" ile duyurulur; CANLI yalnız renk değil metindir.

```html
<article class="pl-score"><div class="pl-score__head"><span class="pl-score__live"><span class="pl-dot pl-dot--live"></span>CANLI</span><span>Kış Ligi · Final</span><span style="margin-left:auto" class="pl-num">2. harita</span></div>
<div class="pl-score__teams" aria-live="polite"><div class="pl-score__team"><span class="pl-score__crest">AX</span>Atlas X</div><div class="pl-score__vs">2 : 1<small>34:12</small></div><div class="pl-score__team"><span class="pl-score__crest">NV</span>Nova</div></div>
<div class="pl-score__bar" aria-label="Hakimiyet %64'e %36"><span style="flex:64"></span><span style="flex:36"></span></div></article>
```

### PLA-022

**Maç Satırı + Oran Çipleri** · `match-row`

- **Amaç:** Lig ikonu, iki takım, skor ve seçilebilir oran düğmeleri; seçili oran aksan dolgulu.
- **Ne zaman:** Fikstür listeleri, karşılaştırmalı seçim satırları, A/B seçenek listeleri.
- **Desen kaynağı:** Pin 4 — maç listesi ve 1/X/2 oran düğmeleri
- **Kapsayıcı:** `<div data-pl data-pl-surface="neon">`
- **Durumlar:** varsayılan, oran seçili, kilitli (devre dışı)
- **Sınıflar:** `pl-matchrow pl-matchrow__teams pl-matchrow__score pl-odds button.is-active`
- **Erişilebilirlik:** Oran grubu role="radiogroup"; her düğme role="radio" + aria-checked.

```html
<div><div class="pl-matchrow"><span class="pl-avatar pl-avatar--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg></span><div class="pl-matchrow__teams"><span>Atlas X</span><span>Nova</span></div><div class="pl-matchrow__score"><span>17</span><span>6</span></div><div class="pl-odds" role="radiogroup" aria-label="Oranlar"><button role="radio" aria-checked="true" class="is-active"><small>1</small>1,40</button><button role="radio" aria-checked="false"><small>X</small>3,10</button><button role="radio" aria-checked="false"><small>2</small>2,85</button></div></div>
<div class="pl-matchrow"><span class="pl-avatar pl-avatar--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg></span><div class="pl-matchrow__teams"><span>Kuzey Kurtları</span><span>Lima</span></div><div class="pl-matchrow__score"><span>4</span><span>23</span></div><div class="pl-odds" role="radiogroup" aria-label="Oranlar"><button role="radio" aria-checked="false"><small>1</small>4,20</button><button role="radio" aria-checked="false"><small>X</small>3,60</button><button role="radio" aria-checked="false"><small>2</small>1,25</button></div></div></div>
```

### PLA-023

**Neon Vurgu Kartı** · `neon-card`

- **Amaç:** Tamamen aksan dolgulu, köşede yarı saydam daire; tek bir kritik değeri öne çıkarır.
- **Ne zaman:** Ekrandaki en önemli tek metrik (günün öne çıkanı). Ekranda en fazla bir tane.
- **Desen kaynağı:** Pin 4 — limon yeşili 'Global Highlights' kartı
- **Kapsayıcı:** `<div data-pl data-pl-surface="neon">`
- **Durumlar:** varsayılan
- **Sınıflar:** `pl-neoncard pl-neoncard__val`
- **Erişilebilirlik:** Aksan zemin + --pl-fg-on-accent metin kontrastı ≥4.5:1.

```html
<div class="pl-neoncard" style="max-width:240px"><span class="pl-label">Günün öne çıkanı</span><b>Atlas X · Nova</b><span class="pl-neoncard__val">54,4B izleyici</span><span style="font-size:12px;opacity:.75">Son 10 dk'da %18 artış</span></div>
```

### PLA-024

**Canlı Akış Bandı** · `live-ticker`

- **Amaç:** Solda CANLI etiketi, sağda sürekli kayan olay akışı; üzerine gelince durur.
- **Ne zaman:** Canlı olay akışı, sistem duyuruları, borsa/kur bandı.
- **Desen kaynağı:** Pinler 4, 13 — kayan skor / olay bandı
- **Durumlar:** akıyor, duraklatıldı (hover), azaltılmış hareket (statik)
- **Sınıflar:** `pl-ticker pl-ticker__label pl-ticker__track`
- **Erişilebilirlik:** Akış aria-hidden; aynı veri erişilebilir bir listede de sunulur. prefers-reduced-motion'da animasyon kapanır.

```html
<div class="pl-ticker"><span class="pl-ticker__label"><span class="pl-dot pl-dot--live"></span>CANLI</span><div class="pl-ticker__track" aria-hidden="true"><span>Atlas X <b>2–1</b> Nova</span><span>Kuzey <b>0–0</b> Lima</span><span>Leo Helper <b>v2.4</b> yayında</span><span>Kur <b>1 € = 37,82 ₺</b></span><span>Atlas X <b>2–1</b> Nova</span><span>Kuzey <b>0–0</b> Lima</span><span>Leo Helper <b>v2.4</b> yayında</span><span>Kur <b>1 € = 37,82 ₺</b></span></div></div>
```


---

## Akıllı Ev & IoT (10)

### PLA-025

**Cihaz Anahtar Karosu** · `device-tile`

- **Amaç:** İkon karosu + cihaz adı + durum alt metni + anahtar. Açıkken aksan ışıması; isteğe bağlı seviye ölçeği.
- **Ne zaman:** Akıllı ev, eklenti/servis açma-kapama, özellik bayrakları.
- **Desen kaynağı:** Pin 6 — Smart TV / Lighting / Vacuum cleaner satırları
- **Durumlar:** kapalı, açık, bağlantı yok (devre dışı), seviye ölçekli
- **Sınıflar:** `pl-devtile is-on pl-devtile__ic pl-devtile__name pl-devtile__sub pl-devtile__meter pl-switch`
- **Erişilebilirlik:** Anahtar <input type="checkbox" role="switch">; etiket cihaz adıdır.

```html
<div class="pl-stack" style="gap:8px"><label class="pl-devtile is-on"><span class="pl-devtile__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="m17 2-5 5-5-5"/></svg></span><span><span class="pl-devtile__name">Akıllı TV</span><br><span class="pl-devtile__sub">Salon · Açık</span></span><span class="pl-switch"><input type="checkbox" role="switch" checked></span></label>
<label class="pl-devtile is-on"><span class="pl-devtile__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/></svg></span><span><span class="pl-devtile__name">Aydınlatma</span><br><span class="pl-devtile__sub">%70 · Sıcak beyaz</span></span><span class="pl-switch"><input type="checkbox" role="switch" checked></span><span class="pl-devtile__meter" aria-hidden="true"><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class=""></i><i class=""></i><i class=""></i></span></label>
<label class="pl-devtile"><span class="pl-devtile__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.8 9.2C8.6 7.4 8.4 3 12 3c4 0 3 4.7 1.2 6.2M14.8 10.8c2.2-1.8 6.6-2 6.6 1.6 0 4-4.7 3-6.2 1.2M13.2 14.8c2.2 1.8 2.4 6.2-1.2 6.2-4 0-3-4.7-1.2-6.2M9.2 13.2c-2.2 1.8-6.6 2-6.6-1.6 0-4 4.7-3 6.2-1.2"/><circle cx="12" cy="12" r="2"/></svg></span><span><span class="pl-devtile__name">Robot süpürge</span><br><span class="pl-devtile__sub">Şarjda</span></span><span class="pl-switch"><input type="checkbox" role="switch"></span></label></div>
```

### PLA-026

**Sensör Kaplama Kartı** · `sensor-overlay`

- **Amaç:** 3B sahne ya da fotoğraf üzerinde yüzen cam kart: ikon, ölçüm adı, değer ve nokta ölçeği.
- **Ne zaman:** Görsel bir sahne üzerine bağlamsal sensör verisi bindirmek.
- **Desen kaynağı:** Pin 6 — 3B ev üzerinde yüzen Temperature / Humidity kartları
- **Kapsayıcı:** `<div data-pl data-pl-surface="glass">`
- **Durumlar:** normal, eşik aşıldı (ikon uyarı rengi)
- **Sınıflar:** `pl-sensor pl-glass pl-sensor__ic pl-sensor__top pl-sensor__dots`
- **Erişilebilirlik:** Nokta ölçeği aria-hidden; değer metin olarak okunur.

```html
<div style="background:var(--pl-media-5);padding:22px;border-radius:18px;display:grid;gap:10px;justify-items:start"><div class="pl-sensor pl-glass"><span class="pl-sensor__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"/></svg></span><div class="pl-sensor__top">Sıcaklık <b>23°</b></div><div class="pl-sensor__dots" aria-hidden="true"><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i></div></div>
<div class="pl-sensor pl-glass"><span class="pl-sensor__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/></svg></span><div class="pl-sensor__top">Nem <b>%48</b></div><div class="pl-sensor__dots" aria-hidden="true"><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i></div></div></div>
```

### PLA-027

**Oda Başlık Kartı** · `room-card`

- **Amaç:** Oda ikonu + adı + cihaz sayısı, altında oda görüntüsü / kamera alanı.
- **Ne zaman:** Oda bazlı kontrol panelleri, mekân seçimi.
- **Desen kaynağı:** Pin 6 — 'Living Room' başlıklı oda paneli
- **Durumlar:** varsayılan, kamera canlı
- **Sınıflar:** `pl-roomcard pl-roomcard__head pl-roomcard__ic pl-roomcard__name pl-roomcard__view`
- **Erişilebilirlik:** Kamera alanı <figure> + <figcaption>.

```html
<article class="pl-roomcard"><div class="pl-roomcard__head"><span class="pl-roomcard__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg></span><div style="flex:1"><div class="pl-roomcard__name">Salon</div><div class="pl-muted" style="font-size:11px">6 cihaz · 4 açık</div></div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Diğer"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button></div><figure class="pl-roomcard__view" style="margin:0 12px 12px"><span class="pl-camfeed__rec" style="position:absolute;left:10px;top:10px;font-family:var(--pl-font-mono);font-size:10px;color:var(--pl-fg-1)">CANLI</span></figure></article>
```

### PLA-028

**İklim Çipleri** · `climate-chips`

- **Amaç:** Tek kapsül içinde ayraçlı mono değerler: dış sıcaklık, nem, saat.
- **Ne zaman:** Üst çubukta ortam/durum özeti.
- **Desen kaynağı:** Pin 6 — üst çubukta sıcaklık · nem · saat
- **Sınıflar:** `pl-climate`
- **Erişilebilirlik:** Her bölüm aria-label taşır ("Dış sıcaklık 11 derece").

```html
<div class="pl-climate"><span aria-label="Dış sıcaklık 11 derece"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/></svg>11°C</span><span aria-label="Nem yüzde 67"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/></svg>%67</span><span aria-label="Saat 20:21"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>20:21</span></div>
```

### PLA-029

**Üye Varlık Şeridi** · `presence-strip`

- **Amaç:** Avatar + ad + konum durumu hapları; evdeki üyeler aksan halkalı.
- **Ne zaman:** Aile/ekip varlık durumu, paylaşımlı çalışma alanı katılımcıları.
- **Desen kaynağı:** Pin 6 — alt kısımda ev üyeleri avatarları
- **Durumlar:** evde, dışarıda, çevrimdışı
- **Sınıflar:** `pl-presence pl-presence__item is-home`
- **Erişilebilirlik:** Durum metni görünür; yalnız halka rengine güvenilmez.

```html
<div class="pl-presence"><div class="pl-presence__item is-home"><span class="pl-avatar pl-avatar--accent">MI</span><span><b>Muhammed</b><small>Evde</small></span></div><div class="pl-presence__item is-home"><span class="pl-avatar">YA</span><span><b>Yalçın</b><small>Evde</small></span></div><div class="pl-presence__item"><span class="pl-avatar">ÜS</span><span><b>Ünal</b><small>Dışarıda</small></span></div></div>
```

### PLA-030

**Kat Seçici Paneli** · `floor-panel`

- **Amaç:** Kat açılır seçimi, oda arama, renkli ikonlu oda satırları ve sayaç rozetleri.
- **Ne zaman:** Kat planı / bina navigasyonu, depo ve ofis haritaları.
- **Desen kaynağı:** Pin 15 — 'Floor / On the first floor' oda listesi
- **Kapsayıcı:** `<div data-pl data-pl-surface="glass">`
- **Durumlar:** varsayılan, oda seçili, arama sonucu yok
- **Sınıflar:** `pl-floorpanel pl-glass pl-floorpanel__head pl-floorpanel__list pl-roomrow is-active pl-roomrow__ic (--c) pl-roomrow__n`
- **Erişilebilirlik:** Liste role="listbox"; satırlar role="option" + aria-selected; ok tuşlarıyla gezilir.

```html
<div style="background:var(--pl-grad-ocean);padding:16px;border-radius:24px"><div class="pl-floorpanel pl-glass"><div class="pl-floorpanel__head"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>Kat <span class="pl-chip pl-chip--accent" style="margin-left:auto">Yeni rota</span></div><select class="pl-select"><option>1. kat</option><option>2. kat</option></select>
<div class="pl-floorpanel__head" style="font-size:13px"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>Birinci kattaki alanlar</div><div class="pl-inputwrap"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input class="pl-input" placeholder="Alan adı girin"></div>
<div class="pl-floorpanel__list" role="listbox" aria-label="Alanlar">
<div class="pl-roomrow" role="option" aria-selected="false"><span class="pl-roomrow__ic" style="--c:var(--pl-viz-4)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>Eğitim odası<span class="pl-roomrow__n">3</span></div>
<div class="pl-roomrow is-active" role="option" aria-selected="true"><span class="pl-roomrow__ic" style="--c:var(--pl-viz-5)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>Toplantı salonu<span class="pl-roomrow__n">Rota</span></div>
<div class="pl-roomrow" role="option" aria-selected="false"><span class="pl-roomrow__ic" style="--c:var(--pl-viz-3)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span>Yönetim ofisi<span class="pl-roomrow__n">8</span></div>
<div class="pl-roomrow" role="option" aria-selected="false"><span class="pl-roomrow__ic" style="--c:var(--pl-viz-6)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/></svg></span>Ar-Ge laboratuvarı<span class="pl-roomrow__n">5</span></div></div></div></div>
```

### PLA-031

**Harita Sıcak Noktası** · `map-hotspot`

- **Amaç:** Damla biçimli iğne, renk değişkeni (--c), cam etiket ve isteğe bağlı nabız animasyonu.
- **Ne zaman:** Plan, harita, 3B sahne üzerinde nesne/olay işaretleme.
- **Desen kaynağı:** Pinler 0, 15 — plan üzerinde renkli konum iğneleri ve etiketleri
- **Durumlar:** varsayılan, seçili (nabız), uyarı (--c: danger)
- **Sınıflar:** `pl-hotspot is-pulse pl-hotspot__pin (--c) pl-hotspot__label`
- **Erişilebilirlik:** Her iğne <button aria-label="Toplantı salonu, 3 kişi">.

```html
<div style="position:relative;height:170px;border-radius:16px;background:var(--pl-media-6)">
<button class="pl-hotspot is-pulse" style="left:30%;top:60%;background:none;border:0" aria-label="Toplantı salonu"><span class="pl-hotspot__pin" style="--c:var(--pl-viz-3)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span><span class="pl-hotspot__label">Toplantı salonu</span></button>
<button class="pl-hotspot" style="left:62%;top:42%;background:none;border:0" aria-label="Sunucu odası"><span class="pl-hotspot__pin" style="--c:var(--pl-viz-2)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/></svg></span><span class="pl-hotspot__label">Sunucu odası</span></button>
<button class="pl-hotspot" style="left:82%;top:80%;background:none;border:0" aria-label="Acil çıkış"><span class="pl-hotspot__pin" style="--c:var(--pl-danger)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/></svg></span></button></div>
```

### PLA-032

**Saat & Hava Widget'ı** · `weather-widget`

- **Amaç:** Gün + büyük saat ve tarih; yanında gradyan zeminli sıcaklık karosu.
- **Ne zaman:** Pano üst köşesi, kilit/boşta ekranı, ortam bilgisi.
- **Desen kaynağı:** Pin 15 — 'Tue 08:25 pm' + gradyan sıcaklık kartı
- **Kapsayıcı:** `<div data-pl data-pl-surface="glass">`
- **Sınıflar:** `pl-weather pl-glass pl-weather__time pl-weather__day pl-weather__clock pl-weather__temp`
- **Erişilebilirlik:** <time datetime> kullanılır.

```html
<div style="background:var(--pl-grad-ocean);padding:16px;border-radius:24px;width:max-content"><div class="pl-weather pl-glass"><div class="pl-weather__time"><span class="pl-weather__day">Pazar</span><time class="pl-weather__clock" datetime="2026-11-01T20:25">20:25 <small>01.11.2026</small></time></div><div class="pl-weather__temp"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg><b>18°</b><small>Parçalı bulutlu</small></div></div></div>
```

### PLA-033

**Ekipman Sayaç Karosu** · `equip-tile`

- **Amaç:** Renkli ikon + kategori + büyük HUD rakamı. Seçili karo tamamen aksan dolgulu.
- **Ne zaman:** Cihaz/envanter kategorilerinin sayımı, filtre görevi gören özet kutular.
- **Desen kaynağı:** Pin 8 — IoT 'Equipment overview' sayaç kutuları
- **Kapsayıcı:** `<div data-pl data-pl-surface="hud">`
- **Durumlar:** varsayılan, seçili
- **Sınıflar:** `pl-equip is-active pl-equip__top pl-equip__ic (--c) pl-equip__val`
- **Erişilebilirlik:** Seçilebilir karolar <button aria-pressed>.

```html
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="pl-equip" aria-pressed="false" style="text-align:left;font:inherit;cursor:pointer"><span class="pl-equip__top"><span class="pl-equip__ic" style="--c:var(--pl-viz-6)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/></svg></span>Dijital cihaz</span><span class="pl-equip__val">18</span></button>
<button class="pl-equip" aria-pressed="false" style="text-align:left;font:inherit;cursor:pointer"><span class="pl-equip__top"><span class="pl-equip__ic" style="--c:var(--pl-viz-4)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg></span>Enerji</span><span class="pl-equip__val">235</span></button>
<button class="pl-equip is-active" aria-pressed="true" style="text-align:left;font:inherit;cursor:pointer"><span class="pl-equip__top"><span class="pl-equip__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg></span>Ofis cihazı</span><span class="pl-equip__val">1.209</span></button>
<button class="pl-equip" aria-pressed="false" style="text-align:left;font:inherit;cursor:pointer"><span class="pl-equip__top"><span class="pl-equip__ic" style="--c:var(--pl-viz-3)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>Güvenlik</span><span class="pl-equip__val">185</span></button></div>
```

### PLA-034

**İzometrik Plan Görüntüleyici** · `iso-plan`

- **Amaç:** CSS 3B dönüşümüyle izometrik kat; renk kodlu odalar, seçili oda ışıması, köşede görünüm araçları ve lejant. Gerçek 3B model yerine geçen hafif yer tutucu.
- **Ne zaman:** Akıllı ev, emlak, tesis yönetimi; 3B model yüklenene kadar ya da düşük güç modunda.
- **Desen kaynağı:** Pinler 0, 1, 3, 6, 8, 15 — izometrik ev / ofis / kat planı sahneleri
- **Durumlar:** varsayılan, oda seçili, 2D (dönüşüm kapalı)
- **Sınıflar:** `pl-isoplan pl-isoplan__floor pl-isoplan__room (--c) pl-isoplan__room--wide is-active pl-isoplan__legend`
- **Erişilebilirlik:** Odalar <button aria-label>; aynı bilgi Kat Seçici Paneli listesiyle de sunulur.

```html
<div class="pl-isoplan"><div class="pl-isoplan__floor">
<button class="pl-isoplan__room pl-isoplan__room--wide is-active" style="--c:var(--pl-viz-1);border:0" aria-label="Salon"></button><button class="pl-isoplan__room" style="--c:var(--pl-viz-5);border:0" aria-label="Mutfak"></button><button class="pl-isoplan__room" style="--c:var(--pl-viz-4);border:0" aria-label="Yatak odası"></button><button class="pl-isoplan__room" style="--c:var(--pl-viz-3);border:0" aria-label="Banyo"></button><button class="pl-isoplan__room" style="--c:var(--pl-viz-2);border:0" aria-label="Çalışma odası"></button></div>
<div class="pl-viewtools" role="toolbar" aria-label="Görünüm"><button>2D</button><button class="is-active">3D</button><hr><button aria-label="Yakınlaştır"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg></button><button aria-label="Uzaklaştır"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h6"/></svg></button></div>
<div class="pl-isoplan__legend"><span class="pl-chip"><span class="pl-dot" style="background:var(--pl-viz-1)"></span>Salon</span><span class="pl-chip"><span class="pl-dot" style="background:var(--pl-viz-5)"></span>Mutfak</span><span class="pl-chip"><span class="pl-dot" style="background:var(--pl-viz-4)"></span>Yatak</span></div></div>
```


---

## HUD & Endüstri (8)

### PLA-035

**HUD Büyük Metrik** · `hud-metric`

- **Amaç:** Rajdhani rakamlı, metin gölgesiyle ışıyan büyük değer; yeşil / amber / camgöbeği varyantları.
- **Ne zaman:** Komuta ekranında tek bakışta okunması gereken ana değerler.
- **Desen kaynağı:** Pin 10 — '102.67 / 127.39' ışıyan büyük değerler
- **Kapsayıcı:** `<div data-pl data-pl-surface="hud">`
- **Durumlar:** normal (yeşil), uyarı (amber), bilgi (camgöbeği)
- **Sınıflar:** `pl-hudmetric pl-hudmetric--amber|cyan pl-hudmetric__ic pl-hudmetric__val pl-hudmetric__lbl`
- **Erişilebilirlik:** Renk anlamı etiket metninde de verilir ("Normal", "Uyarı").

```html
<div class="pl-row" style="gap:28px"><div class="pl-hudmetric"><span class="pl-hudmetric__ic"><svg class="pl-ico pl-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></span><span class="pl-hudmetric__val">102<small>.67</small></span><span class="pl-hudmetric__lbl">Genel endeks · Normal</span></div><div class="pl-hudmetric pl-hudmetric--cyan"><span class="pl-hudmetric__ic"><svg class="pl-ico pl-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg></span><span class="pl-hudmetric__val">127<small>.39</small></span><span class="pl-hudmetric__lbl">Sistem değeri</span></div></div>
```

### PLA-036

**Dalga Formu Monitörü** · `wave-monitor`

- **Amaç:** Sol değer + sağda ışıyan dalga çizgisi; her satır kendi renk kanalını (--c) kullanır.
- **Ne zaman:** Gerçek zamanlı sinyal: sağlık, ağ trafiği, CPU/GPU yükü, sensör akışı.
- **Desen kaynağı:** Pin 10 — 85 / 76 / 25 değerli EKG çizgileri
- **Kapsayıcı:** `<div data-pl data-pl-surface="hud">`
- **Durumlar:** akış, donmuş (kayıt), sinyal yok
- **Sınıflar:** `pl-wavemon pl-wavemon__row pl-wavemon__val`
- **Erişilebilirlik:** SVG role="img" + aria-label="Nabız 85, sabit".

```html
<div class="pl-wavemon"><div class="pl-wavemon__row"><span class="pl-wavemon__val">85</span><svg viewBox="0 0 300 60" preserveAspectRatio="none" role="img" aria-label="Nabız 85"><polyline points="0.0,29.0 5.1,30.2 10.2,29.5 15.3,30.4 20.3,30.5 25.4,28.3 30.5,35 35.6,6 40.7,44 45.8,28.9 50.8,32.0 55.9,29.9 61.0,31.3 66.1,29.9 71.2,30.6 76.3,28.6 81.4,30.5 86.4,31.5 91.5,30.1 96.6,31.0 101.7,30.7 106.8,35 111.9,6 116.9,44 122.0,29.2 127.1,28.1 132.2,31.5 137.3,29.9 142.4,30.9 147.5,31.5 152.5,30.9 157.6,31.7 162.7,29.6 167.8,31.2 172.9,29.8 178.0,31.7 183.1,35 188.1,6 193.2,44 198.3,28.9 203.4,31.9 208.5,29.7 213.6,30.5 218.6,29.2 223.7,30.0 228.8,29.5 233.9,29.4 239.0,30.3 244.1,30.3 249.2,31.6 254.2,30.7 259.3,35 264.4,6 269.5,44 274.6,30.7 279.7,28.7 284.7,31.4 289.8,31.9 294.9,31.6 300.0,30.3"/></svg></div><div class="pl-wavemon__row"><span class="pl-wavemon__val">76</span><svg viewBox="0 0 300 60" preserveAspectRatio="none" role="img" aria-label="Solunum 76"><polyline points="0.0,28.9 5.1,28.4 10.2,29.6 15.3,28.6 20.3,28.3 25.4,29.6 30.5,33.0 35.6,15.6 40.7,38.4 45.8,28.9 50.8,30.1 55.9,29.1 61.0,28.7 66.1,28.4 71.2,28.9 76.3,31.7 81.4,31.3 86.4,31.2 91.5,31.2 96.6,28.8 101.7,29.2 106.8,33.0 111.9,15.6 116.9,38.4 122.0,31.5 127.1,28.3 132.2,30.4 137.3,30.7 142.4,30.0 147.5,28.7 152.5,29.9 157.6,28.4 162.7,31.7 167.8,31.5 172.9,30.2 178.0,29.2 183.1,33.0 188.1,15.6 193.2,38.4 198.3,31.4 203.4,30.0 208.5,29.7 213.6,30.4 218.6,29.7 223.7,28.6 228.8,29.2 233.9,31.3 239.0,28.2 244.1,28.2 249.2,30.5 254.2,29.1 259.3,33.0 264.4,15.6 269.5,38.4 274.6,32.0 279.7,28.8 284.7,29.7 289.8,28.8 294.9,30.5 300.0,29.1"/></svg></div><div class="pl-wavemon__row"><span class="pl-wavemon__val">25</span><svg viewBox="0 0 300 60" preserveAspectRatio="none" role="img" aria-label="Isı 25"><polyline points="0.0,30.5 5.1,31.0 10.2,31.2 15.3,31.8 20.3,31.0 25.4,31.7 30.5,31.8 35.6,21.6 40.7,34.9 45.8,30.6 50.8,31.6 55.9,28.5 61.0,29.9 66.1,29.0 71.2,30.2 76.3,30.3 81.4,28.1 86.4,28.9 91.5,29.1 96.6,31.7 101.7,31.1 106.8,31.8 111.9,21.6 116.9,34.9 122.0,30.5 127.1,28.5 132.2,28.0 137.3,31.5 142.4,28.8 147.5,28.9 152.5,31.9 157.6,31.5 162.7,29.2 167.8,31.8 172.9,30.2 178.0,30.7 183.1,31.8 188.1,21.6 193.2,34.9 198.3,31.9 203.4,31.6 208.5,29.2 213.6,29.4 218.6,28.7 223.7,28.6 228.8,28.3 233.9,29.2 239.0,30.4 244.1,28.0 249.2,30.7 254.2,29.4 259.3,31.8 264.4,21.6 269.5,34.9 274.6,29.3 279.7,29.9 284.7,30.8 289.8,28.2 294.9,31.9 300.0,28.1"/></svg></div></div>
```

### PLA-037

**HUD Halka Göstergeleri** · `hud-rings`

- **Amaç:** Konik dolgulu, kesik çizgili iç halkalı dairesel göstergeler; değer --v ile.
- **Ne zaman:** Birden fazla yüzdeyi yan yana karşılaştırmak (doluluk, sağlık, kapasite).
- **Desen kaynağı:** Pin 10 — alt kısımdaki üçlü dairesel göstergeler
- **Kapsayıcı:** `<div data-pl data-pl-surface="hud">`
- **Sınıflar:** `pl-hudrings pl-hudring pl-hudring__dial (--v, --c)`
- **Erişilebilirlik:** Her kadran role="meter" + aria-valuenow.

```html
<div class="pl-hudrings"><div class="pl-hudring"><div class="pl-hudring__dial" role="meter" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100" style="--v:72;--c:var(--pl-hud)"><b>72</b></div>CPU</div><div class="pl-hudring"><div class="pl-hudring__dial" role="meter" aria-valuenow="46" aria-valuemin="0" aria-valuemax="100" style="--v:46;--c:var(--pl-hud-green)"><b>46</b></div>Bellek</div><div class="pl-hudring"><div class="pl-hudring__dial" role="meter" aria-valuenow="88" aria-valuemin="0" aria-valuemax="100" style="--v:88;--c:var(--pl-hud-amber)"><b>88</b></div>Disk</div></div>
```

### PLA-038

**HUD Veri Tablosu** · `hud-table`

- **Amaç:** Mono, büyük harfli başlıklı, zebra çizgili tablo; durumlar çerçeveli HUD etiketleriyle.
- **Ne zaman:** Cihaz listesi, alarm günlüğü, sipariş/üretim kuyruğu.
- **Desen kaynağı:** Pinler 13, 16 — sağ paneldeki durum tabloları
- **Kapsayıcı:** `<div data-pl data-pl-surface="hud">`
- **Durumlar:** normal, uyarı, hata
- **Sınıflar:** `pl-hudtable pl-hudtag pl-hudtag--warn|err`
- **Erişilebilirlik:** Gerçek <table> + <th scope>; durum metinle.

```html
<table class="pl-hudtable"><thead><tr><th scope="col">Cihaz</th><th scope="col">Hat</th><th scope="col">Sıcaklık</th><th scope="col">Durum</th><th scope="col">Güncelleme</th></tr></thead><tbody>
<tr><td>PRS-0142</td><td>A-3</td><td>41,2 °C</td><td><span class="pl-hudtag">Çalışıyor</span></td><td>21:39:58</td></tr>
<tr><td>CNC-0087</td><td>B-1</td><td>68,9 °C</td><td><span class="pl-hudtag pl-hudtag--warn">Isınıyor</span></td><td>21:39:41</td></tr>
<tr><td>ROB-0233</td><td>C-2</td><td>—</td><td><span class="pl-hudtag pl-hudtag--err">Bağlantı yok</span></td><td>21:31:07</td></tr>
<tr><td>KMP-0019</td><td>A-1</td><td>36,4 °C</td><td><span class="pl-hudtag">Çalışıyor</span></td><td>21:39:55</td></tr></tbody></table>
```

### PLA-039

**Halka Yüzde Metriği** · `donut-metric`

- **Amaç:** Konik halka içinde yüzde + yanında başlık ve alt açıklama.
- **Ne zaman:** KPI şeritleri, kapasite özetleri.
- **Desen kaynağı:** Pin 29 — '45% / 75% / 52%' halka göstergeli üretim metrikleri
- **Sınıflar:** `pl-donut pl-donut__ring (--v, --c) pl-donut__txt`
- **Erişilebilirlik:** role="meter" halka üzerinde.

```html
<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><div class="pl-donut"><div class="pl-donut__ring" role="meter" aria-valuenow="45" style="--v:45;--c:var(--pl-viz-2)"><b>%45</b></div><div class="pl-donut__txt"><b>Toplam GPM</b><small>Akış hızı</small></div></div><div class="pl-donut"><div class="pl-donut__ring" role="meter" aria-valuenow="75" style="--v:75;--c:var(--pl-viz-3)"><b>%75</b></div><div class="pl-donut__txt"><b>Toplam GPM</b><small>Hat 2</small></div></div><div class="pl-donut"><div class="pl-donut__ring" role="meter" aria-valuenow="52" style="--v:52;--c:var(--pl-viz-5)"><b>%52</b></div><div class="pl-donut__txt"><b>LBS</b><small>Basınç</small></div></div><div class="pl-donut"><div class="pl-donut__ring" role="meter" aria-valuenow="68" style="--v:68;--c:var(--pl-viz-4)"><b>%68</b></div><div class="pl-donut__txt"><b>Toplam LBS</b><small>Hat 3</small></div></div></div>
```

### PLA-040

**Proses Akış Şeması** · `process-flow`

- **Amaç:** SVG tabanlı tank–boru–vana şeması; akan hat kesik çizgi animasyonlu, tank doluluk seviyesi gösterilir.
- **Ne zaman:** Endüstriyel izleme, veri hattı (pipeline) görselleştirme, otomasyon akışları.
- **Desen kaynağı:** Pin 29 — tank, boru ve vanalı SCADA proses ekranı
- **Durumlar:** akış, vana kapalı (kırmızı), durdu (animasyon yok)
- **Sınıflar:** `pl-process .p-pipe .p-flow .p-tank .p-level .p-valve.is-off`
- **Erişilebilirlik:** SVG role="img" + ayrıntılı aria-label; aynı durum tabloyla da verilir.

```html
<svg class="pl-process" viewBox="0 0 560 170" role="img" aria-label="Proses: 3 tank, 2 açık 1 kapalı vana, reaktör yüzde 64 dolu">
<path class="p-pipe" d="M60 120 H180 M240 120 H330 M390 120 H500 M210 60 V30 H420 V60"/><path class="p-flow" d="M60 120 H180 M240 120 H330 M210 60 V30 H420 V60"/>
<rect class="p-tank" x="20" y="60" width="44" height="90" rx="12"/><rect class="p-level" x="22" y="100" width="40" height="48" rx="10"/>
<rect class="p-tank" x="180" y="60" width="60" height="90" rx="14"/><rect class="p-level" x="182" y="92" width="56" height="56" rx="12"/>
<rect class="p-tank" x="330" y="50" width="60" height="100" rx="30"/><rect class="p-level" x="332" y="86" width="56" height="62" rx="26"/>
<rect class="p-tank" x="500" y="80" width="40" height="70" rx="6"/>
<rect class="p-valve" x="112" y="112" width="16" height="16" transform="rotate(45 120 120)"/><rect class="p-valve" x="277" y="112" width="16" height="16" transform="rotate(45 285 120)"/><rect class="p-valve is-off" x="437" y="112" width="16" height="16" transform="rotate(45 445 120)"/>
<text x="20" y="166">HAM-01</text><text x="180" y="166">KARIŞIM</text><text x="330" y="166">REAKTÖR %64</text><text x="494" y="166">ÇIKIŞ</text></svg>
```

### PLA-041

**Segment Çubuk Grafik** · `seg-bars`

- **Amaç:** Yatay çizgilerle bölünmüş (LED) çubuklar; tepe değerler amber.
- **Ne zaman:** Saatlik yük, frekans dağılımı, gerçek zamanlı yoğunluk.
- **Desen kaynağı:** Pinler 10, 13 — dijital segmentli ekolayzer çubukları
- **Kapsayıcı:** `<div data-pl data-pl-surface="hud">`
- **Sınıflar:** `pl-segbars > span (--v) .is-peak`
- **Erişilebilirlik:** role="img" + özet aria-label; ham veri tabloda.

```html
<div class="pl-segbars" role="img" aria-label="Saatlik yük, tepe 21:00"><span style="--v:61"></span><span style="--v:39"></span><span style="--v:70"></span><span style="--v:26"></span><span style="--v:29"></span><span style="--v:88"></span><span style="--v:32"></span><span style="--v:66"></span><span style="--v:94" class="is-peak"></span><span style="--v:27"></span><span style="--v:84"></span><span style="--v:47"></span><span style="--v:24"></span><span style="--v:31"></span><span style="--v:75"></span><span style="--v:73"></span><span style="--v:28"></span><span style="--v:50"></span><span style="--v:31"></span><span style="--v:90" class="is-peak"></span><span style="--v:74"></span><span style="--v:27"></span><span style="--v:92" class="is-peak"></span><span style="--v:35"></span><span style="--v:48"></span><span style="--v:94" class="is-peak"></span><span style="--v:27"></span><span style="--v:93" class="is-peak"></span></div>
```

### PLA-042

**Film Şeridi Zaman Ekseni** · `film-ticks`

- **Amaç:** Yatay kaydırılan dairesel olay hücreleri ve zaman etiketleri; aktif hücre ışır.
- **Ne zaman:** Kayıt oynatma, olay geçmişi, kare seçimi.
- **Desen kaynağı:** Pin 16 — alt kısımdaki dairesel kare/olay şeridi
- **Sınıflar:** `pl-filmtick pl-filmtick__cell is-active`
- **Erişilebilirlik:** role="listbox" yatay; ← → ile gezinme.

```html
<div class="pl-filmtick" role="listbox" aria-orientation="horizontal" aria-label="Olaylar"><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>20:00</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>20:10</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>20:20</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>20:30</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>20:40</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>20:50</div><div class="pl-filmtick__cell is-active" role="option" aria-selected="true"><i></i>21:00</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>21:10</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>21:20</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>21:30</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>21:40</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>21:50</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>22:00</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>22:10</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>22:20</div><div class="pl-filmtick__cell" role="option" aria-selected="false"><i></i>22:30</div></div>
```


---

## Üretkenlik & İK (13)

### PLA-043

**Hafta Gün Şeridi** · `day-strip`

- **Amaç:** Gün adı + mono gün numarası; seçili gün ters renk, bugün nokta işaretli.
- **Ne zaman:** Takvim, ajanda, rezervasyon ekranlarının üstü.
- **Desen kaynağı:** Pin 11 — üstte 'Mon 15 · Tue 16…' gün seçici
- **Durumlar:** varsayılan, bugün, seçili, devre dışı (geçmiş)
- **Sınıflar:** `pl-daystrip > button.is-active.is-today`
- **Erişilebilirlik:** role="tablist"; her gün aria-label="Salı 16 Kasım".

```html
<div class="pl-daystrip" role="tablist" aria-label="Hafta"><button role="tab" aria-selected="false" class="">Pzt<b>15</b></button><button role="tab" aria-selected="false" class="">Sal<b>16</b></button><button role="tab" aria-selected="false" class=" is-today">Çar<b>17</b></button><button role="tab" aria-selected="false" class="">Per<b>18</b></button><button role="tab" aria-selected="true" class="is-active">Cum<b>19</b></button><button role="tab" aria-selected="false" class="">Cmt<b>20</b></button><button role="tab" aria-selected="false" class="">Paz<b>21</b></button></div>
```

### PLA-044

**Takvim Panosu** · `schedule-board`

- **Amaç:** Saat sütunu + kişi/ekip sütunları; renk kodlu, süreye göre yüksekliği değişen etkinlik blokları (--h).
- **Ne zaman:** Ekip planlama, kaynak takvimi, oda rezervasyonu.
- **Desen kaynağı:** Pin 11 — sütunlu ekip takvimi ve renkli etkinlik blokları
- **Durumlar:** varsayılan, etkinlik seçili, sürükleniyor, çakışma (uyarı kenarlığı)
- **Sınıflar:** `pl-board (--cols) pl-board__colhead pl-board__time pl-board__cell pl-evt (--c, --h) pl-evt__foot`
- **Erişilebilirlik:** role="grid"; etkinlikler <button> ve aria-label="Ekip toplantısı, 09:00–10:00".

```html
<div class="pl-board" style="--cols:3" role="grid"><div></div><div class="pl-board__colhead">Tasarımcılar <small>4</small></div><div class="pl-board__colhead">Geliştirme <small>6</small></div><div class="pl-board__colhead">Yayın <small>2</small></div>
<div class="pl-board__time">09:00</div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-6);--h:1"><b>Ekip toplantısı</b>09:00–10:00</div></div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-1);--h:2"><b>Komut paleti sprinti</b>09:00–11:00<div class="pl-evt__foot"><span class="pl-avatars"><span class="pl-avatar pl-avatar--sm">MI</span><span class="pl-avatar pl-avatar--sm">YA</span></span></div></div></div><div class="pl-board__cell"></div>
<div class="pl-board__time">10:00</div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-3);--h:1"><b>Logo revizyonu</b>10:00–11:00</div></div><div class="pl-board__cell"></div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-5);--h:1"><b>v2.0 yayını</b>10:30</div></div>
<div class="pl-board__time">11:00</div><div class="pl-board__cell"></div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-2);--h:1"><b>Kod incelemesi</b>11:00–11:45</div></div><div class="pl-board__cell"></div></div>
```

### PLA-045

**Büyük Sayı Üçlüsü** · `big-stats`

- **Amaç:** İnce (300) ağırlıkta çok büyük rakamlar + küçük ikon + alt etiket.
- **Ne zaman:** Karşılama başlığının sağında üst düzey sayaçlar.
- **Desen kaynağı:** Pin 39 — '78 Employee · 56 Hirings · 203 Projects' ince büyük rakamlar
- **Sınıflar:** `pl-bigstats pl-bigstat pl-bigstat__val pl-bigstat__lbl`
- **Erişilebilirlik:** Rakam ve etiket aynı öğe içinde; okuma sırası "78 çalışan".

```html
<div class="pl-bigstats"><div class="pl-bigstat"><span class="pl-bigstat__val"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>78</span><span class="pl-bigstat__lbl">Çalışan</span></div><div class="pl-bigstat"><span class="pl-bigstat__val"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>56</span><span class="pl-bigstat__lbl">İşe alım</span></div><div class="pl-bigstat"><span class="pl-bigstat__val"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>203</span><span class="pl-bigstat__lbl">Proje</span></div></div>
```

### PLA-046

**Bölümlü İlerleme Hapları** · `seg-pills`

- **Amaç:** Oransal genişlikte kapsüller: koyu, aksan, gri ve taralı (kalan) dolgular; üstte etiket.
- **Ne zaman:** Zaman/bütçe dağılımı, süreç aşamalarının oranları.
- **Desen kaynağı:** Pin 39 — 'Interviews 15% · Hired 15% · Project time 60% · Output 10%'
- **Sınıflar:** `pl-segpills (--cols) pl-segpill pl-segpill--dark|accent|hatch`
- **Erişilebilirlik:** role="img" + aria-label tüm oranları sıralar.

```html
<div class="pl-segpills" style="--cols:1fr 1fr 3.4fr 1fr" role="img" aria-label="Mülakat yüzde 15, işe alım yüzde 15, proje süresi yüzde 60, çıktı yüzde 10"><div class="pl-segpill pl-segpill--dark">Mülakat<span>%15</span></div><div class="pl-segpill pl-segpill--accent">İşe alım<span>%15</span></div><div class="pl-segpill">Proje süresi<span>%60</span></div><div class="pl-segpill pl-segpill--hatch">Çıktı<span>%10</span></div></div>
```

### PLA-047

**Zaman Takip Kadranı** · `time-tracker`

- **Amaç:** Çentikli (tick) dairesel kadran, ortada büyük süre; altında oynat/duraklat ve zamanlayıcı düğmeleri.
- **Ne zaman:** Odak zamanlayıcı, çalışma süresi takibi, pomodoro.
- **Desen kaynağı:** Pin 39 — '02:35 Work Time' çentikli dairesel sayaç
- **Durumlar:** çalışıyor, duraklatıldı, hedefe ulaşıldı
- **Sınıflar:** `pl-timer pl-timer__wrap pl-timer__dial is-partial (--v) pl-timer__val pl-timer__ctl`
- **Erişilebilirlik:** Süre <time> içinde; her dakika değil yalnız durum değişince aria-live.

```html
<div class="pl-timer"><div class="pl-timer__wrap"><div class="pl-timer__dial is-partial" style="--v:64" aria-hidden="true"></div><div class="pl-timer__val"><b>02:35</b><small>Çalışma süresi</small></div></div><div class="pl-timer__ctl"><button class="pl-iconbtn pl-iconbtn--outline" aria-label="Başlat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg></button><button class="pl-iconbtn pl-iconbtn--outline" aria-label="Duraklat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg></button><button class="pl-iconbtn" style="background:var(--pl-fg-1);color:var(--pl-bg-1)" aria-label="Zamanlayıcı"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/></svg></button></div></div>
```

### PLA-048

**Karanlık Görev Kartı** · `task-card-dark`

- **Amaç:** Metin rengi zeminli (ters) kart; ilerleme oranı, ikonlu görev satırları ve onay daireleri.
- **Ne zaman:** Açık temalı ekranda vurgulanması gereken kontrol listesi.
- **Desen kaynağı:** Pin 39 — 'Onboarding Task 2/8' ters renkli kart
- **Durumlar:** bekliyor, tamamlandı
- **Sınıflar:** `pl-taskcard pl-taskcard__head pl-taskcard__item is-done pl-taskcard__ic pl-taskcard__chk`
- **Erişilebilirlik:** Satırlar <label> + checkbox; ilerleme "8 görevden 2'si".

```html
<div class="pl-taskcard"><div class="pl-taskcard__head"><b>Kurulum görevleri</b><span>2/8</span></div><div class="pl-taskcard__item is-done"><span class="pl-taskcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span><span>Görüşme<small>02.11.2026 · 09:30</small></span><span class="pl-taskcard__chk"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></div><div class="pl-taskcard__item is-done"><span class="pl-taskcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span><span>Ekip toplantısı<small>02.11.2026 · 11:30</small></span><span class="pl-taskcard__chk"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></div><div class="pl-taskcard__item"><span class="pl-taskcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/></svg></span><span>Proje güncellemesi<small>03.11.2026 · 15:00</small></span><span class="pl-taskcard__chk"></span></div><div class="pl-taskcard__item"><span class="pl-taskcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg></span><span>İK politikası<small>04.11.2026 · 14:45</small></span><span class="pl-taskcard__chk"></span></div></div>
```

### PLA-049

**Profil Fotoğraf Kartı** · `photo-card`

- **Amaç:** Büyük fotoğraf/görsel alanı, alt karartma, ad + rol ve sağ altta değer hapı.
- **Ne zaman:** Kişi profili, öne çıkan üye, müşteri kartı.
- **Desen kaynağı:** Pin 39 — fotoğraflı çalışan kartı ve maaş hapı
- **Sınıflar:** `pl-photocard pl-photocard__name pl-photocard__role pl-photocard__pill`
- **Erişilebilirlik:** Fotoğraf alt metni kişinin adıdır.

```html
<div class="pl-photocard" style="max-width:220px"><div><span class="pl-photocard__name">Yalçın Demir</span><span class="pl-photocard__role">Ürün tasarımcısı</span></div><span class="pl-chip pl-chip--ghost pl-chip--mono pl-photocard__pill">48.500 ₺</span></div>
```

### PLA-050

**İnce Çubuk İlerleme Grafiği** · `pin-bars`

- **Amaç:** Gün başına iğne başlı ince çubuklar; tepe gün aksan renginde ve değer etiketli.
- **Ne zaman:** Haftalık çalışma saati, alışkanlık takibi, günlük hedef.
- **Desen kaynağı:** Pin 39 — 'Progress 6.1h' iğne başlı ince çubuklar
- **Sınıflar:** `pl-pinbars pl-pinbars__col is-peak (--v) pl-pinbars__tip`
- **Erişilebilirlik:** role="img" + aria-label; altta ham değer tablosu önerilir.

```html
<div class="pl-pinbars" role="img" aria-label="Haftalık çalışma saati, en yüksek cuma 5 saat 23 dakika"><div class="pl-pinbars__col" style="--v:40"><i></i>P</div><div class="pl-pinbars__col" style="--v:62"><i></i>S</div><div class="pl-pinbars__col" style="--v:48"><i></i>Ç</div><div class="pl-pinbars__col" style="--v:70"><i></i>P</div><div class="pl-pinbars__col is-peak" style="--v:88"><span class=pl-pinbars__tip>5s 23dk</span><i></i>C</div><div class="pl-pinbars__col" style="--v:30"><i></i>C</div><div class="pl-pinbars__col" style="--v:52"><i></i>P</div></div>
```

### PLA-051

**Günlük Ajanda** · `day-agenda`

- **Amaç:** Saat satırları, yatay konumlu (--x/--w) etkinlik kartları; ana kart ters renk, diğerleri yumuşak.
- **Ne zaman:** Günün ajandası, toplantı yoğunluğu.
- **Desen kaynağı:** Pin 39 — Eylül takviminde saat bazlı etkinlik kartları
- **Sınıflar:** `pl-agenda pl-agenda__t pl-agenda__s pl-agenda__evt pl-agenda__evt--soft (--x, --w)`
- **Erişilebilirlik:** Etkinlikler kronolojik DOM sırasında; görsel konum yalnız sunumdur.

```html
<div class="pl-agenda"><div class="pl-agenda__t">08:00</div><div class="pl-agenda__s"></div><div class="pl-agenda__t">09:00</div><div class="pl-agenda__s"><div class="pl-agenda__evt" style="--x:18%;--w:52%">Haftalık ekip senkronu<span class="pl-avatars"><span class="pl-avatar pl-avatar--sm">MI</span><span class="pl-avatar pl-avatar--sm">YA</span><span class="pl-avatar pl-avatar--sm">ÜS</span></span></div></div><div class="pl-agenda__t">10:00</div><div class="pl-agenda__s"><div class="pl-agenda__evt pl-agenda__evt--soft" style="--x:40%;--w:46%">Kurulum oturumu</div></div><div class="pl-agenda__t">11:00</div><div class="pl-agenda__s"></div></div>
```

### PLA-052

**Karşılama Başlığı** · `greeting-header`

- **Amaç:** Ters renkli bant: selamlama, alt bilgi ve sağda tarih/saat çipleri + bildirim.
- **Ne zaman:** Pano açılış ekranı.
- **Desen kaynağı:** Pin 26 — 'Good morning, Natalie' koyu başlık bandı
- **Sınıflar:** `pl-greet pl-greet__title pl-greet__sub pl-greet__chips`
- **Erişilebilirlik:** Selamlama <h1>; saat çipi <time>.

```html
<header class="pl-greet"><div><h2 class="pl-greet__title">Günaydın, Muhammed</h2><div class="pl-greet__sub">Bugün 4 toplantın ve 2 yayının var.</div></div><div class="pl-greet__chips"><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>01.11.2026</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>09:00–18:00</span></div><button class="pl-iconbtn" style="color:inherit" aria-label="Bildirimler"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></button></header>
```

### PLA-053

**Renkli İkonlu İstatistik Kartı** · `stat-card-color`

- **Amaç:** Renk değişkenli (--c) ikon karosu, etiket, büyük mono değer ve değişim; 'is-hot' ile renkli zemin.
- **Ne zaman:** Pano üst KPI satırı (4–5 kart).
- **Desen kaynağı:** Pin 26 — 'Today appointments / Cancelled' renkli ikonlu kartlar
- **Durumlar:** varsayılan, vurgulu (is-hot)
- **Sınıflar:** `pl-statcard is-hot pl-statcard__ic (--c) pl-statcard__lbl pl-statcard__val`
- **Erişilebilirlik:** Değişim yönü metinle ("+%12 artış").

```html
<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px"><div class="pl-statcard" style="--c:var(--pl-viz-7)"><span class="pl-statcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span><span class="pl-statcard__lbl">Bugünkü randevu</span><span class="pl-statcard__val">12<small style="color:var(--pl-success)">+%8</small></span></div><div class="pl-statcard" style="--c:var(--pl-viz-1)"><span class="pl-statcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span><span class="pl-statcard__lbl">Toplam hasta</span><span class="pl-statcard__val">120<small style="color:var(--pl-success)">+%3</small></span></div><div class="pl-statcard is-hot" style="--c:var(--pl-viz-3)"><span class="pl-statcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg></span><span class="pl-statcard__lbl">İptal</span><span class="pl-statcard__val">12<small style="color:var(--pl-danger)">-%2</small></span></div><div class="pl-statcard" style="--c:var(--pl-viz-5)"><span class="pl-statcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span><span class="pl-statcard__lbl">Tamamlanan</span><span class="pl-statcard__val">4<small style="color:var(--pl-success)">+1</small></span></div></div>
```

### PLA-054

**Alan Grafiği + İpucu** · `area-chart`

- **Amaç:** Yumuşatılmış eğri, aksan rengi gradyan dolgu, imleç çizgisi, nokta ve koyu ipucu; X ekseninde aktif ay hapı.
- **Ne zaman:** Zaman serisi: gelir, ziyaret, adım, hasta sayısı.
- **Desen kaynağı:** Pinler 26, 33 — yumuşak eğrili alan grafiği ve koyu ipucu
- **Durumlar:** varsayılan, hover (imleç + ipucu), boş veri
- **Sınıflar:** `pl-areachart .a-grid .a-area .a-line .a-dot .a-cursor pl-areachart__x pl-charttip`
- **Erişilebilirlik:** SVG role="img" + özet; ayrıntı için gizli <table>.

```html
<div class="pl-areachart" style="color:var(--pl-accent)"><svg viewBox="0 0 300 120" preserveAspectRatio="none" role="img" aria-label="Aylık gelir, en yüksek Haziran 1.250 ₺"><defs><linearGradient id="pl-area-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".28"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><line class="a-grid" x1="0" x2="300" y1="20" y2="20"/><line class="a-grid" x1="0" x2="300" y1="50" y2="50"/><line class="a-grid" x1="0" x2="300" y1="80" y2="80"/><line class="a-grid" x1="0" x2="300" y1="110" y2="110"/><path class="a-area" d="M0.0,116.0 C13.65,116.0 13.65,89.1 27.3,89.1 C40.9,89.1 40.9,98.1 54.5,98.1 C68.15,98.1 68.15,60.0 81.8,60.0 C95.44999999999999,60.0 95.44999999999999,75.7 109.1,75.7 C122.75,75.7 122.75,44.3 136.4,44.3 C150.0,44.3 150.0,4.0 163.6,4.0 C177.25,4.0 177.25,53.3 190.9,53.3 C204.55,53.3 204.55,35.4 218.2,35.4 C231.85,35.4 231.85,66.7 245.5,66.7 C259.1,66.7 259.1,26.4 272.7,26.4 C286.35,26.4 286.35,39.8 300.0,39.8 L300,120 L0,120 Z"/><path class="a-line" d="M0.0,116.0 C13.65,116.0 13.65,89.1 27.3,89.1 C40.9,89.1 40.9,98.1 54.5,98.1 C68.15,98.1 68.15,60.0 81.8,60.0 C95.44999999999999,60.0 95.44999999999999,75.7 109.1,75.7 C122.75,75.7 122.75,44.3 136.4,44.3 C150.0,44.3 150.0,4.0 163.6,4.0 C177.25,4.0 177.25,53.3 190.9,53.3 C204.55,53.3 204.55,35.4 218.2,35.4 C231.85,35.4 231.85,66.7 245.5,66.7 C259.1,66.7 259.1,26.4 272.7,26.4 C286.35,26.4 286.35,39.8 300.0,39.8"/><line class="a-cursor" x1="163.6" x2="163.6" y1="0" y2="120"/><circle class="a-dot" cx="163.6" cy="4.0" r="5"/></svg><div class="pl-charttip" style="left:54.5%;top:18%"><b>1.250 ₺</b>Haziran · +%22</div><div class="pl-areachart__x"><span class="">Oca</span><span class="">Şub</span><span class="">Mar</span><span class="">Nis</span><span class="">May</span><span class="is-active">Haz</span><span class="">Tem</span><span class="">Ağu</span><span class="">Eyl</span><span class="">Eki</span><span class="">Kas</span><span class="">Ara</span></div></div>
```

### PLA-055

**Randevu Zaman Çizelgesi** · `appt-timeline`

- **Amaç:** Saat + düğüm + içerik; şu anki randevu aksan düğümlü ve altında ayrıntı kartı açılır.
- **Ne zaman:** Günlük randevu, sıra, teslimat listesi.
- **Desen kaynağı:** Pin 26 — 'Upcoming appointments' dikey çizelge ve açılır ayrıntı kartı
- **Sınıflar:** `pl-apptl pl-apptl__row is-now pl-apptl__time pl-apptl__rail pl-apptl__body pl-apptl__card`
- **Erişilebilirlik:** <ol> listesi; şu anki öğe aria-current="time".

```html
<ol class="pl-apptl" style="margin:0;padding:0;list-style:none"><li class="pl-apptl__row"><span class="pl-apptl__time">09:00</span><span class="pl-apptl__rail"><i></i></span><span class="pl-apptl__body"><b>Kontrol muayenesi</b><small>Ayşe K.</small></span></li>
<li class="pl-apptl__row is-now" aria-current="time"><span class="pl-apptl__time">10:00</span><span class="pl-apptl__rail"><i></i></span><span class="pl-apptl__body"><b>Diş temizliği</b><small>Mert A.</small><span class="pl-apptl__card"><span class="pl-row" style="justify-content:space-between"><b style="font-size:12px">Mert A.</b><span class="pl-badge pl-badge--success">Onaylı</span></span><small>10:00–10:45 · Oda 2</small><button class="pl-btn pl-btn--secondary pl-btn--sm">Randevuyu aç</button></span></span></li>
<li class="pl-apptl__row"><span class="pl-apptl__time">11:00</span><span class="pl-apptl__rail"><i></i></span><span class="pl-apptl__body"><b>Kanal tedavisi</b><small>Selin T.</small></span></li></ol>
```


---

## CRM & İş (7)

### PLA-056

**İş Süreci Adımlayıcı** · `bpf-stepper`

- **Amaç:** Kapsül içinde aşamalar: tamamlanan (yeşil onay), etkin (aksan dolgulu, süre bilgili), bekleyen.
- **Ne zaman:** Satış hunisi, onboarding akışı, başvuru durumu.
- **Desen kaynağı:** Pin 31 — 'Qualify · Develop · Propose · Close' süreç akışı
- **Durumlar:** tamamlandı, etkin, bekliyor
- **Sınıflar:** `pl-bpf pl-bpf__stage is-done|is-active pl-bpf__sep pl-bpf__time`
- **Erişilebilirlik:** <ol> + aria-current="step".

```html
<ol class="pl-bpf" style="margin:0;list-style:none"><li class="pl-bpf__stage is-done"><i><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></i>Nitelendir</li><li class="pl-bpf__sep" aria-hidden="true"></li><li class="pl-bpf__stage is-active" aria-current="step"><i>2</i>Geliştir <span class="pl-bpf__time">3 gün</span></li><li class="pl-bpf__sep" aria-hidden="true"></li><li class="pl-bpf__stage"><i>3</i>Teklif</li><li class="pl-bpf__sep" aria-hidden="true"></li><li class="pl-bpf__stage"><i>4</i>Kapat</li></ol>
```

### PLA-057

**Skor Göstergesi** · `score-gauge`

- **Amaç:** Çentikli yarım daire yay; ortada büyük skor, altında değerlendirme etiketi.
- **Ne zaman:** Müşteri adayı skoru, sağlık puanı, uyum skoru.
- **Desen kaynağı:** Pin 31 — 'Lead Score 90' çentikli yarım daire
- **Sınıflar:** `pl-scoregauge pl-scoregauge__arc (--v) pl-scoregauge__val pl-scoregauge__lbl`
- **Erişilebilirlik:** role="meter" aria-valuenow="90" aria-valuemax="100".

```html
<div style="display:grid;justify-items:center;gap:4px"><div class="pl-scoregauge" role="meter" aria-valuenow="90" aria-valuemin="0" aria-valuemax="100" aria-label="Aday skoru"><div class="pl-scoregauge__arc" style="--v:90"></div><span class="pl-scoregauge__val">90</span></div><span class="pl-badge pl-badge--success">A sınıfı · Sıcak aday</span></div>
```

### PLA-058

**Kişi Ayrıntı Kartı** · `contact-card`

- **Amaç:** Fotoğraf/inisyal, ad, durum rozetleri, eylem düğmeleri ve meta alanları ızgarası.
- **Ne zaman:** CRM kaydı, müşteri profili, kişi ayrıntısı.
- **Desen kaynağı:** Pin 31 — 'Gabriela Christiansen' kişi başlığı ve alanları
- **Sınıflar:** `pl-contact pl-contact__head pl-contact__photo pl-contact__name pl-contact__meta pl-contact__actions`
- **Erişilebilirlik:** Meta alanları <dl> olarak da kurulabilir.

```html
<div class="pl-contact"><div class="pl-contact__head"><span class="pl-contact__photo">ÜS</span><div style="flex:1"><h3 class="pl-contact__name">Ünal Soğukkuyu</h3><div class="pl-row"><span class="pl-badge pl-badge--accent">Karar verici</span><span class="pl-badge">İzmir</span></div></div><div class="pl-contact__actions"><button class="pl-iconbtn pl-iconbtn--outline" aria-label="Ara"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button><button class="pl-iconbtn pl-iconbtn--outline" aria-label="E-posta"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg></button><button class="pl-btn pl-btn--primary pl-btn--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg>Görev</button></div></div>
<div class="pl-contact__meta"><div><small>Hesap</small>RENTAKAR Otomotiv</div><div><small>Sahip</small>Muhammed</div><div><small>Son temas</small>30.10.2026</div><div><small>Değer</small><span class="pl-num">184.000 ₺</span></div></div></div>
```

### PLA-059

**İş Kuyruğu Listesi** · `work-queue`

- **Amaç:** Avatar + ad + kısa not satırları; seçili kayıt aksan zeminli ve ok düğmeli.
- **Ne zaman:** Atanmış işler, takip listesi, gelen kutusu.
- **Desen kaynağı:** Pin 31 — 'My Work' etiketli kayıt listesi
- **Durumlar:** varsayılan, seçili, okunmamış (kalın)
- **Sınıflar:** `pl-queue pl-queue__item is-active pl-queue__go`
- **Erişilebilirlik:** role="listbox"; Enter ile kaydı açar.

```html
<div class="pl-queue" role="listbox" aria-label="İşlerim"><div class="pl-queue__item is-active" role="option" aria-selected="true"><span class="pl-avatar">ÜS</span><span><b>Ünal Soğukkuyu</b><small>Teklif bekliyor</small></span><span class=pl-queue__go><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span></div><div class="pl-queue__item" role="option" aria-selected="false"><span class="pl-avatar">İK</span><span><b>İlhan K.</b><small>Takip araması</small></span><span class=pl-badge>Bugün</span></div><div class="pl-queue__item" role="option" aria-selected="false"><span class="pl-avatar">SV</span><span><b>Savaş V.</b><small>Sözleşme</small></span><span class=pl-badge>Yarın</span></div></div>
```

### PLA-060

**Mülk Özellik Paneli** · `property-panel`

- **Amaç:** Büyük fiyat, adres, 4'lü özellik şeridi ve ikonlu özellik çipi ızgarası.
- **Ne zaman:** Emlak, araç kiralama (RENTAKAR), ürün teknik özet paneli.
- **Desen kaynağı:** Pin 1 — fiyat, adres, '3 beds · 2 baths · 1,421 sqft' ve özellik çipleri
- **Sınıflar:** `pl-property pl-property__price pl-property__addr pl-property__specs pl-property__feats`
- **Erişilebilirlik:** Özellik şeridi <dl>; birimler kısaltma değil tam okunur (aria-label).

```html
<div class="pl-property"><div><div class="pl-property__price">4.250.000 ₺</div><div class="pl-property__addr">Seyrek Mah. · Menemen / İzmir</div></div><div class="pl-property__specs"><div><b>2</b><small>Oda</small></div><div><b>1</b><small>Banyo</small></div><div><b>95</b><small>m²</small></div><div><b>4</b><small>Kat</small></div></div><div class="pl-property__feats"><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>Site içi</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/></svg>Otopark</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>2019 yapım</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>Doğalgaz</span></div></div>
```

### PLA-061

**Değerleme Hesaplayıcı** · `valuation-calc`

- **Amaç:** Parametre ızgarası, peşinat kaydırıcısı ve iki sonuç kutusu.
- **Ne zaman:** Kredi/kira hesabı, fiyat simülasyonu, bütçe senaryosu.
- **Desen kaynağı:** Pin 1 — 'Valuation calculator' kaydırıcılı hesap kartı
- **Sınıflar:** `pl-calc pl-calc__grid pl-slider pl-calc__result`
- **Erişilebilirlik:** Kaydırıcı <input type=range> + <output>.

```html
<div class="pl-calc"><span class="pl-label">Değerleme hesaplayıcı</span><div class="pl-calc__grid"><div>Vade<b>120 ay</b></div><div>Faiz tipi<b>Sabit</b></div><div>Oran<b>%2,79</b></div></div><label class="pl-stack" style="gap:6px"><span class="pl-muted">Peşinat</span><input class="pl-slider" type="range" value="40" aria-valuetext="%40"></label><div class="pl-calc__result"><div><span class="pl-muted">Peşinat</span><b>1.700.000 ₺</b></div><div><span class="pl-muted">Aylık tahmini</span><b style="color:var(--pl-accent)">31.640 ₺</b></div></div></div>
```

### PLA-062

**Benzer Kayıt Satırı** · `similar-row`

- **Amaç:** Küçük görsel + fiyat + kısa açıklama; tüm satır bağlantı.
- **Ne zaman:** Benzer ürünler, ilgili kayıtlar, öneri listesi.
- **Desen kaynağı:** Pin 1 — 'Similar properties' satırları
- **Sınıflar:** `pl-simrow pl-simrow__img`
- **Erişilebilirlik:** <a> öğesi; görsel dekoratif.

```html
<div class="pl-stack" style="gap:6px"><a class="pl-simrow" href="#"><span class="pl-simrow__img"></span><span><b>3.890.000 ₺</b><small>1+1 · 80 m² · Seyrek</small><small>Bahçeli, otoparklı</small></span></a><a class="pl-simrow" href="#"><span class="pl-simrow__img" style="background:var(--pl-media-6)"></span><span><b>4.600.000 ₺</b><small>2+1 · 105 m² · Menemen</small><small>Site içi, havuzlu</small></span></a></div>
```


---

## Yaratıcı Araçlar (8)

### PLA-063

**Çok İzli Zaman Çizelgesi** · `multitrack-timeline`

- **Amaç:** Cetvel, iz başlıkları (göz/kilit), renk kodlu klipler (video, ses dalgalı, metin, efekt), seçili klip sarı çerçeve ve turuncu oynatma kafası (--p).
- **Ne zaman:** Video/ses kurgusu, animasyon, sunum zamanlaması, otomasyon akışı.
- **Desen kaynağı:** Pinler 17, 21 — video/ses/metin izli kurgu zaman çizelgesi
- **Durumlar:** varsayılan, klip seçili, iz kilitli, iz gizli
- **Sınıflar:** `pl-tl pl-tl__ruler pl-tl__ticks pl-tl__track pl-tl__head pl-tl__lane pl-clip pl-clip--video|audio|text|fx is-selected pl-playhead (--p)`
- **Erişilebilirlik:** role="grid"; klipler <button> + aria-label (ad, başlangıç, süre); ← → 1 kare, Shift ile 1 sn.

```html
<div class="pl-tl" role="grid" aria-label="Zaman çizelgesi"><div class="pl-tl__ruler"><span></span><div class="pl-tl__ticks"><span style="left:0.0%">00:00</span><span style="left:12.5%">00:04</span><span style="left:25.0%">00:08</span><span style="left:37.5%">00:12</span><span style="left:50.0%">00:16</span><span style="left:62.5%">00:20</span><span style="left:75.0%">00:24</span><span style="left:87.5%">00:28</span></div></div><div class="pl-tl__body">
<div class="pl-tl__track"><div class="pl-tl__head"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>V2</div><div class="pl-tl__lane"><button class="pl-clip pl-clip--text" style="--x:30%;--w:28%;border:0"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>Başlık · Gece Atölyesi</button></div></div>
<div class="pl-tl__track"><div class="pl-tl__head"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>V1</div><div class="pl-tl__lane"><button class="pl-clip pl-clip--video" style="--x:2%;--w:30%;border:0"><span class="pl-clip__thumb"></span>Giriş.mp4</button><button class="pl-clip pl-clip--video is-selected" style="--x:33%;--w:38%;border:0"><span class="pl-clip__thumb"></span>Atölye_Sahne_02.mp4</button><button class="pl-clip pl-clip--fx" style="--x:72%;--w:20%;border:0">Geçiş</button></div></div>
<div class="pl-tl__track"><div class="pl-tl__head"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>A1</div><div class="pl-tl__lane"><button class="pl-clip pl-clip--audio" style="--x:2%;--w:90%;border:0">Odak_LoFi.wav</button></div></div>
<span class="pl-playhead" style="--p:.47" aria-hidden="true"></span></div></div>
```

### PLA-064

**Oynatma Kontrolleri** · `transport`

- **Amaç:** Zaman kodu (geçen / toplam), başa sar, kare geri, oynat, kare ileri, sona.
- **Ne zaman:** Kurgu, kayıt oynatma, sunum provası.
- **Desen kaynağı:** Pinler 17, 21 — zaman kodu ve oynatma düğmeleri
- **Sınıflar:** `pl-transport pl-transport__tc .is-main`
- **Erişilebilirlik:** Boşluk tuşu oynat/duraklat; J-K-L kısayolları önerilir.

```html
<div class="pl-transport" role="toolbar" aria-label="Oynatma"><span class="pl-transport__tc">00:03:12:08 <small>/ 00:07:46</small></span><button aria-label="Başa"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 20 9 12l10-8z"/><path d="M5 19V5"/></svg></button><button aria-label="Geri sar"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m11 19-9-7 9-7z"/><path d="m22 19-9-7 9-7z"/></svg></button><button class="is-main" aria-label="Oynat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg></button><button aria-label="İleri"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 4 10 8-10 8z"/><path d="M19 5v14"/></svg></button><button aria-label="Ses"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg></button></div>
```

### PLA-065

**Medya Kutusu Izgarası** · `media-bin`

- **Amaç:** Süre etiketli küçük resim ızgarası; seçili öğe aksan çerçeveli.
- **Ne zaman:** Kurgu proje medyası, varlık kitaplığı, ekran görüntüsü arşivi.
- **Desen kaynağı:** Pin 21 — 'Master Sequence' medya kutusu küçük resimleri
- **Sınıflar:** `pl-bin pl-bin__item is-selected pl-bin__thumb`
- **Erişilebilirlik:** role="listbox" + aria-multiselectable.

```html
<div class="pl-bin" role="listbox" aria-multiselectable="true" aria-label="Medya"><div class="pl-bin__item" role="option" aria-selected="false"><div class="pl-bin__thumb" style="background:var(--pl-media-1)"><span>0:12</span></div><b>Giriş</b></div><div class="pl-bin__item is-selected" role="option" aria-selected="true"><div class="pl-bin__thumb" style="background:var(--pl-media-2)"><span>0:48</span></div><b>Atölye 02</b></div><div class="pl-bin__item" role="option" aria-selected="false"><div class="pl-bin__thumb" style="background:var(--pl-media-3)"><span>3:21</span></div><b>Röportaj</b></div><div class="pl-bin__item" role="option" aria-selected="false"><div class="pl-bin__thumb" style="background:var(--pl-media-4)"><span>1:05</span></div><b>B-roll</b></div><div class="pl-bin__item" role="option" aria-selected="false"><div class="pl-bin__thumb" style="background:var(--pl-media-5)"><span>0:20</span></div><b>Kapanış</b></div><div class="pl-bin__item" role="option" aria-selected="false"><div class="pl-bin__thumb" style="background:var(--pl-media-6)"><span>0:04</span></div><b>Logo</b></div></div>
```

### PLA-066

**Düğüm Grafiği** · `node-graph`

- **Amaç:** Noktalı tuval, giriş/çıkış portlu düğüm kartları ve bezier bağlantılar; canlı bağlantı aksan renkli ışıyan.
- **Ne zaman:** AI iş akışı (MyMind), otomasyon, veri dönüştürme hattı.
- **Desen kaynağı:** Pin 14 — AI karakter üretim akışındaki girdi/çıktı düğümleri
- **Durumlar:** varsayılan, düğüm seçili, çalışıyor (canlı bağlantı), hata (kırmızı başlık noktası)
- **Sınıflar:** `pl-nodes pl-node (--x, --y) is-selected pl-node__head pl-node__body pl-node__port pl-node__port--out`
- **Erişilebilirlik:** Tuval role="application" + düğüm listesi alternatifi; Tab ile düğümler, Enter ile port bağlama.

```html
<div class="pl-nodes" role="application" aria-label="İş akışı"><svg aria-hidden="true"><path d="M170 70 C230 70 230 60 290 60"/><path class="is-live" d="M170 150 C230 150 230 95 290 95"/><path class="is-live" d="M440 80 C490 80 490 130 540 130"/></svg>
<div class="pl-node" style="--x:20px;--y:40px"><div class="pl-node__head"><i></i>Metin</div><div class="pl-node__body">Gözlüklü, sırt çantalı karakter<div class="pl-node__port pl-node__port--out" style="--c:var(--pl-viz-2)">metin</div></div></div>
<div class="pl-node" style="--x:20px;--y:128px"><div class="pl-node__head"><i></i>Referans</div><div class="pl-node__body"><div class="pl-node__port pl-node__port--out" style="--c:var(--pl-viz-3)">görsel</div></div></div>
<div class="pl-node is-selected" style="--x:290px;--y:36px"><div class="pl-node__head"><i></i>MyMind · Üret</div><div class="pl-node__body"><div class="pl-node__port" style="--c:var(--pl-viz-2)">istem</div><div class="pl-node__port" style="--c:var(--pl-viz-3)">stil</div><div class="pl-node__port pl-node__port--out" style="--c:var(--pl-viz-1)">model</div></div></div>
<div class="pl-node" style="--x:540px;--y:110px;width:120px"><div class="pl-node__head"><i></i>Çıktı</div><div class="pl-node__body"><div class="pl-node__port" style="--c:var(--pl-viz-1)">3B</div></div></div></div>
```

### PLA-067

**Ses Dalga Çubuğu** · `waveform`

- **Amaç:** Dikey çubuklardan oluşan dalga; çalınan bölüm aksan renginde.
- **Ne zaman:** Sesli not, podcast, kurgu ses izi, ses kaydı önizlemesi.
- **Desen kaynağı:** Pinler 14, 17 — ses izi dalga çubukları
- **Sınıflar:** `pl-waveform > i (--v) .is-played`
- **Erişilebilirlik:** role="slider" ile konum; dalga aria-hidden.

```html
<div class="pl-waveform" role="slider" aria-valuenow="40" aria-valuetext="0:48 / 2:00"><i style="--v:69" class="is-played"></i><i style="--v:83" class="is-played"></i><i style="--v:71" class="is-played"></i><i style="--v:69" class="is-played"></i><i style="--v:77" class="is-played"></i><i style="--v:87" class="is-played"></i><i style="--v:36" class="is-played"></i><i style="--v:35" class="is-played"></i><i style="--v:77" class="is-played"></i><i style="--v:72" class="is-played"></i><i style="--v:92" class="is-played"></i><i style="--v:90" class="is-played"></i><i style="--v:35" class="is-played"></i><i style="--v:24" class="is-played"></i><i style="--v:69" class="is-played"></i><i style="--v:50" class="is-played"></i><i style="--v:30" class="is-played"></i><i style="--v:23" class="is-played"></i><i style="--v:80" class="is-played"></i><i style="--v:100" class="is-played"></i><i style="--v:93" class="is-played"></i><i style="--v:17" class="is-played"></i><i style="--v:88" class="is-played"></i><i style="--v:62" class="is-played"></i><i style="--v:69" class=""></i><i style="--v:95" class=""></i><i style="--v:90" class=""></i><i style="--v:95" class=""></i><i style="--v:32" class=""></i><i style="--v:91" class=""></i><i style="--v:13" class=""></i><i style="--v:79" class=""></i><i style="--v:20" class=""></i><i style="--v:19" class=""></i><i style="--v:16" class=""></i><i style="--v:36" class=""></i><i style="--v:42" class=""></i><i style="--v:88" class=""></i><i style="--v:15" class=""></i><i style="--v:71" class=""></i><i style="--v:53" class=""></i><i style="--v:68" class=""></i><i style="--v:87" class=""></i><i style="--v:37" class=""></i><i style="--v:78" class=""></i><i style="--v:41" class=""></i><i style="--v:93" class=""></i><i style="--v:49" class=""></i><i style="--v:75" class=""></i><i style="--v:12" class=""></i><i style="--v:96" class=""></i><i style="--v:22" class=""></i><i style="--v:70" class=""></i><i style="--v:95" class=""></i><i style="--v:47" class=""></i><i style="--v:64" class=""></i><i style="--v:82" class=""></i><i style="--v:22" class=""></i><i style="--v:44" class=""></i><i style="--v:52" class=""></i></div>
```

### PLA-068

**Katman Listesi** · `layer-list`

- **Amaç:** Girintili (--d) katman satırları; tür ikonu, seçili satır aksan çerçeveli, hover'da göz/kilit eylemleri.
- **Ne zaman:** Tasarım/kurgu editörleri, belge ana hattı, ağaç yapısı.
- **Desen kaynağı:** Pin 22 — sol katman paneli
- **Sınıflar:** `pl-layers pl-layer (--d) is-selected pl-layer__act`
- **Erişilebilirlik:** role="tree" + role="treeitem" + aria-level.

```html
<div class="pl-layers" role="tree" aria-label="Katmanlar"><div class="pl-layer" role="treeitem" aria-level="1" style="--d:0"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>Kapak<span class="pl-layer__act"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span></div><div class="pl-layer" role="treeitem" aria-level="2" style="--d:1"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="1"/></svg>Arka plan<span class="pl-layer__act"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span></div><div class="pl-layer is-selected" role="treeitem" aria-level="2" style="--d:1"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>Fotoğraf<span class="pl-layer__act"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span></div><div class="pl-layer" role="treeitem" aria-level="2" style="--d:1"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>Başlık<span class="pl-layer__act"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span></div><div class="pl-layer" role="treeitem" aria-level="2" style="--d:1"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>Alt başlık<span class="pl-layer__act"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span></div><div class="pl-layer" role="treeitem" aria-level="1" style="--d:0"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>Sayfa 2<span class="pl-layer__act"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span></div></div>
```

### PLA-069

**Sayfa Film Şeridi** · `page-strip`

- **Amaç:** Numaralı sayfa küçük resimleri ve ekleme düğmesi; etkin sayfa aksan çerçeveli.
- **Ne zaman:** Çok sayfalı tasarım, sunum, karusel gönderi düzenleme.
- **Desen kaynağı:** Pin 22 — alttaki sayfa küçük resimleri
- **Sınıflar:** `pl-pagestrip pl-pagestrip__p is-active pl-pagestrip__add`
- **Erişilebilirlik:** role="tablist"; sürükle-bırak için klavye alternatifi (Alt+←/→).

```html
<div class="pl-pagestrip" role="tablist" aria-label="Sayfalar"><button class="pl-pagestrip__p" role="tab" aria-selected="false" style="background:var(--pl-media-2)"><span>1</span></button><button class="pl-pagestrip__p is-active" role="tab" aria-selected="true" style="background:var(--pl-media-3)"><span>2</span></button><button class="pl-pagestrip__p" role="tab" aria-selected="false" style="background:var(--pl-media-4)"><span>3</span></button><button class="pl-pagestrip__p" role="tab" aria-selected="false" style="background:var(--pl-media-5)"><span>4</span></button><button class="pl-pagestrip__add" aria-label="Sayfa ekle"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg></button></div>
```

### PLA-070

**Alt Menülü Bağlam Menüsü** · `context-submenu`

- **Amaç:** PLC-034 menüsünün genişletmesi: açık alt menü öğesi aksan dolgulu, yanında ikinci seviye menü.
- **Ne zaman:** Editörlerde nesne sağ tık menüsü.
- **Desen kaynağı:** Pin 22 — sağ tık menüsü ve açılan alt menü
- **Sınıflar:** `pl-ctxmenu pl-menu pl-menuitem is-open pl-ctxmenu__sub`
- **Erişilebilirlik:** role="menu"/"menuitem"; aria-haspopup + aria-expanded; → alt menüyü açar, ← kapatır.

```html
<div class="pl-ctxmenu"><div class="pl-menu" role="menu"><button class="pl-menuitem" role="menuitem"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Çoğalt<span class="pl-menuitem__meta">Ctrl D</span></button><button class="pl-menuitem" role="menuitem"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>Gruplandır<span class="pl-menuitem__meta">Ctrl G</span></button><button class="pl-menuitem is-open" role="menuitem" aria-haspopup="true" aria-expanded="true"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M21 5h-4"/></svg>Efekt uygula<span class="pl-menuitem__meta"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></span></button><button class="pl-menuitem" role="menuitem"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Kilitle</button><div class="pl-divider"></div><button class="pl-menuitem pl-menuitem--danger" role="menuitem"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>Arşivle</button></div>
<div class="pl-menu pl-ctxmenu__sub" role="menu"><button class="pl-menuitem" role="menuitem">Gölge</button><button class="pl-menuitem" role="menuitem">Bulanıklaştır</button><button class="pl-menuitem" role="menuitem">Işıma</button><button class="pl-menuitem" role="menuitem">Gürültü</button></div></div>
```


---

## Mobilite & Cihaz (8)

### PLA-071

**Gösterge Kümesi** · `instrument-cluster`

- **Amaç:** İki çentikli kadran (hız ve şarj), ortada perspektifli yol şeridi, yön tarifi ve sürüş istatistikleri.
- **Ne zaman:** Araç/filo (RENTAKAR) telemetri ekranı, sürüş simülasyonu, cihaz performans paneli.
- **Desen kaynağı:** Pinler 30, 35, 41 — HMI dijital gösterge paneli (hız / batarya kadranları)
- **Kapsayıcı:** `<div data-pl data-pl-surface="cockpit">`
- **Durumlar:** sürüş, park (P), düşük şarj (sağ kadran amber)
- **Sınıflar:** `pl-cluster pl-dial pl-dial--right (--v) pl-dial__val pl-cluster__center pl-cluster__road pl-cluster__stats`
- **Erişilebilirlik:** Kadranlar role="meter"; hız değeri aria-live değildir (sürekli değişir), istenince okunur.

```html
<div class="pl-cluster"><div class="pl-dial" role="meter" aria-valuenow="79" aria-label="Hız km/s" style="--v:44"><div class="pl-dial__val"><b>79</b><small>KM/S</small></div></div>
<div class="pl-cluster__center"><span class="pl-num pl-muted">13:29 · 21°</span><div class="pl-turn" style="padding:0"><svg class="pl-ico pl-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10M7 17 17 7"/></svg><div><div class="pl-turn__dist" style="font-size:24px">750 <small>m</small></div><div class="pl-turn__road">Anadolu Cd. sağa</div></div></div><div class="pl-cluster__road" aria-hidden="true"></div><div class="pl-cluster__stats"><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 19-9-9 19-2-8z"/></svg>4,1 km</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>22 dk</span></div><span class="pl-gear"><span>P</span><span>R</span><span>N</span><span class="is-active">D</span></span></div>
<div class="pl-dial pl-dial--right" role="meter" aria-valuenow="68" aria-label="Şarj yüzde" style="--v:68"><div class="pl-dial__val"><b>%68</b><small>412 KM</small></div></div></div>
```

### PLA-072

**Vites Seçici** · `gear-selector`

- **Amaç:** P/R/N/D kapsülü; etkin vites aksan dolgulu ve ışıyan.
- **Ne zaman:** Araç HMI, mod seçimi (taslak/inceleme/yayın) gibi sıralı durumlar.
- **Desen kaynağı:** Pinler 32, 35 — 'READY P R N D' göstergesi
- **Kapsayıcı:** `<div data-pl data-pl-surface="cockpit">`
- **Sınıflar:** `pl-gear > span.is-active`
- **Erişilebilirlik:** role="radiogroup" ya da salt gösterge ise aria-label="Vites: D".

```html
<div class="pl-row" style="gap:12px"><span class="pl-gear" aria-label="Vites: D"><span>P</span><span>R</span><span>N</span><span class="is-active">D</span></span><span class="pl-chip pl-chip--accent pl-chip--mono">HAZIR</span></div>
```

### PLA-073

**Yön Tarifi Kartı** · `turn-card`

- **Amaç:** Dönüş oku, büyük mesafe ve yol adı; cam zemin.
- **Ne zaman:** Navigasyon, yönlendirmeli süreç adımı ("Sonraki: …").
- **Desen kaynağı:** Pinler 30, 35, 41 — '20 m Enter Road' dönüş bilgisi
- **Kapsayıcı:** `<div data-pl data-pl-surface="glass">`
- **Sınıflar:** `pl-turn pl-glass pl-turn__ic pl-turn__dist pl-turn__road`
- **Erişilebilirlik:** Mesafe değişince yalnız eşiklerde duyurulur (200 m, 50 m).

```html
<div style="background:var(--pl-media-6);padding:16px;border-radius:18px;width:max-content"><div class="pl-turn pl-glass"><span class="pl-turn__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10M7 17 17 7"/></svg></span><div><div class="pl-turn__dist">20 <small>m</small></div><div class="pl-turn__road">Çevre yoluna gir</div></div></div></div>
```

### PLA-074

**Menzil / Batarya Çubuğu** · `range-bar`

- **Amaç:** İkon + segmentli dolum + mono menzil; düşük seviyede amber.
- **Ne zaman:** Batarya, depolama, kota, kalan süre.
- **Desen kaynağı:** Pin 35 — alt köşede '600 km' segmentli batarya
- **Kapsayıcı:** `<div data-pl data-pl-surface="cockpit">`
- **Durumlar:** normal, düşük (is-low)
- **Sınıflar:** `pl-range is-low pl-range__bar > i.is-on`
- **Erişilebilirlik:** role="meter" + aria-valuetext="600 km, yüzde 80".

```html
<div class="pl-stack" style="gap:10px"><div class="pl-range" role="meter" aria-valuenow="80" aria-valuetext="600 km, yüzde 80"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M6 11v2M10 11v2"/></svg><span class="pl-range__bar"><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class=""></i><i class=""></i></span><span>600 km</span></div><div class="pl-range is-low" role="meter" aria-valuenow="20" aria-valuetext="86 km, yüzde 20"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M6 11v2M10 11v2"/></svg><span class="pl-range__bar"><i class="is-on"></i><i class="is-on"></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i></span><span>86 km</span></div></div>
```

### PLA-075

**Pusula Kadranı** · `compass-dial`

- **Amaç:** Derece çentikli halka, dönen yön harfleri (--deg), üst işaretçi ve ortada derece.
- **Ne zaman:** Drone/araç yönü, harita yönelimi, rüzgâr yönü.
- **Desen kaynağı:** Pin 18 — drone kumandasında '280°' pusula
- **Kapsayıcı:** `<div data-pl data-pl-surface="cockpit">`
- **Sınıflar:** `pl-compass pl-compass__rose (--deg) pl-compass__needle pl-compass__val`
- **Erişilebilirlik:** role="img" aria-label="Yön 280 derece, batı-kuzeybatı".

```html
<div class="pl-compass" role="img" aria-label="Yön 280 derece"><span class="pl-compass__needle" aria-hidden="true"></span><div class="pl-compass__rose" style="--deg:280" aria-hidden="true"><span style="rotate:0deg">K</span><span style="rotate:90deg">D</span><span style="rotate:180deg">G</span><span style="rotate:270deg">B</span></div><span class="pl-compass__val">280°<small>BKB</small></span></div>
```

### PLA-076

**Kumanda Yön Pedi** · `dpad`

- **Amaç:** Dairesel taban, dört yön düğmesi ve ortada kabartmalı çubuk.
- **Ne zaman:** Uzaktan kumanda, kamera PTZ, oyun/simülasyon kontrolü.
- **Desen kaynağı:** Pin 18 — drone kontrol joystick'i
- **Kapsayıcı:** `<div data-pl data-pl-surface="cockpit">`
- **Sınıflar:** `pl-dpad pl-dpad__u|d|l|r pl-dpad__stick`
- **Erişilebilirlik:** Yön düğmeleri aria-label; ok tuşları eşdeğerdir.

```html
<div class="pl-dpad"><button class="pl-dpad__u" aria-label="Yukarı"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg></button><button class="pl-dpad__d" aria-label="Aşağı"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><button class="pl-dpad__l" aria-label="Sol"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><button class="pl-dpad__r" aria-label="Sağ"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button><span class="pl-dpad__stick" aria-hidden="true"></span></div>
```

### PLA-077

**Kamera Akışı HUD** · `camera-feed`

- **Amaç:** 16:9 akış; köşelerde REC, çözünürlük, histogram, pozlama değerleri ve merkezde nişangâh.
- **Ne zaman:** Canlı kamera, güvenlik kamerası, ekran kaydı önizlemesi.
- **Desen kaynağı:** Pin 18 — drone kamera görüntüsü üzerinde REC, histogram, mod bilgisi
- **Durumlar:** canlı, kayıt, sinyal zayıf
- **Sınıflar:** `pl-camfeed pl-camfeed__tl|tr|bl|br pl-camfeed__rec pl-camfeed__hist`
- **Erişilebilirlik:** <video> için altyazı/açıklama; HUD değerleri ayrıca metin listesinde.

```html
<div class="pl-camfeed"><div class="pl-camfeed__tl"><span class="pl-camfeed__rec">REC 00:12:48</span><span class="pl-chip pl-chip--ghost pl-chip--mono">4K · 30</span></div><div class="pl-camfeed__tr"><span class="pl-chip pl-chip--ghost pl-chip--mono"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M6 11v2M10 11v2"/></svg>%76</span><span class="pl-chip pl-chip--ghost pl-chip--mono"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg>GPS 18</span></div><div class="pl-camfeed__bl"><div class="pl-camfeed__hist" aria-hidden="true"><i style="--v:89"></i><i style="--v:42"></i><i style="--v:55"></i><i style="--v:98"></i><i style="--v:93"></i><i style="--v:77"></i><i style="--v:13"></i><i style="--v:69"></i><i style="--v:41"></i><i style="--v:93"></i><i style="--v:16"></i><i style="--v:30"></i><i style="--v:24"></i><i style="--v:57"></i><i style="--v:70"></i><i style="--v:41"></i><i style="--v:58"></i><i style="--v:79"></i><i style="--v:23"></i><i style="--v:83"></i><i style="--v:41"></i><i style="--v:11"></i><i style="--v:37"></i><i style="--v:62"></i><i style="--v:45"></i><i style="--v:33"></i><i style="--v:59"></i><i style="--v:30"></i><i style="--v:19"></i><i style="--v:27"></i></div></div><div class="pl-camfeed__br"><span class="pl-chip pl-chip--ghost pl-chip--mono">ISO 100</span><span class="pl-chip pl-chip--ghost pl-chip--mono">1/240</span><span class="pl-chip pl-chip--ghost pl-chip--mono">EV 0</span></div></div>
```

### PLA-078

**Telemetri Izgarası** · `telemetry-grid`

- **Amaç:** 1px ayraçlı 3 sütunlu değer ızgarası; mono büyük harf etiketler.
- **Ne zaman:** Cihaz telemetrisi, teknik özet, sistem bilgisi.
- **Desen kaynağı:** Pin 18 — mesafe / irtifa / hız / çözünürlük değer ızgarası
- **Kapsayıcı:** `<div data-pl data-pl-surface="cockpit">`
- **Sınıflar:** `pl-telemetry`
- **Erişilebilirlik:** <dl> yapısına dönüştürülebilir.

```html
<div class="pl-telemetry"><div><small>Mesafe</small><b>20 m</b></div><div><small>İrtifa</small><b>121 m</b></div><div><small>Hız</small><b>10,4 m/s</b></div><div><small>Dikey</small><b>0,6 m/s</b></div><div><small>Çözünürlük</small><b>3840×2160</b></div><div><small>Süre</small><b>05:41</b></div></div>
```


---

## Sağlık, Yaşam & Ticaret (12)

### PLA-079

**Büyük Yaşamsal Değer Kartı** · `vital-card`

- **Amaç:** Çok büyük değer + birim, başlık ve küçük çizgi grafik.
- **Ne zaman:** Tek ana sağlık/performans değeri (nabız, puan, gecikme).
- **Desen kaynağı:** Pin 9 — 'Average rate 92 bpm' kartı
- **Sınıflar:** `pl-vital pl-vital__val pl-spark`
- **Erişilebilirlik:** Değer ve birim tek okuma ("92 vuru/dk").

```html
<div class="pl-vital"><div class="pl-row" style="justify-content:space-between"><span class="pl-label">Ortalama nabız</span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Diğer"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button></div><svg class="pl-spark" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><path class="is-area" d="M0.0,43.0 C13.65,43.0 13.65,40.4 27.3,40.4 C40.9,40.4 40.9,41.7 54.5,41.7 C68.15,41.7 68.15,37.8 81.8,37.8 C95.44999999999999,37.8 95.44999999999999,39.1 109.1,39.1 C122.75,39.1 122.75,4.0 136.4,4.0 C150.0,4.0 150.0,56.0 163.6,56.0 C177.25,56.0 177.25,36.5 190.9,36.5 C204.55,36.5 204.55,37.8 218.2,37.8 C231.85,37.8 231.85,35.2 245.5,35.2 C259.1,35.2 259.1,36.5 272.7,36.5 C286.35,36.5 286.35,33.9 300.0,33.9 L300,60 L0,60 Z"/><path d="M0.0,43.0 C13.65,43.0 13.65,40.4 27.3,40.4 C40.9,40.4 40.9,41.7 54.5,41.7 C68.15,41.7 68.15,37.8 81.8,37.8 C95.44999999999999,37.8 95.44999999999999,39.1 109.1,39.1 C122.75,39.1 122.75,4.0 136.4,4.0 C150.0,4.0 150.0,56.0 163.6,56.0 C177.25,56.0 177.25,36.5 190.9,36.5 C204.55,36.5 204.55,37.8 218.2,37.8 C231.85,37.8 231.85,35.2 245.5,35.2 C259.1,35.2 259.1,36.5 272.7,36.5 C286.35,36.5 286.35,33.9 300.0,33.9"/></svg><div class="pl-vital__val">92 <small>vuru/dk</small></div></div>
```

### PLA-080

**Aktivite Karosu** · `activity-tile`

- **Amaç:** Üst kenardan taşan aksan ikon karosu, ad, hedef, ilerleme çubuğu ve tarih etiketi.
- **Ne zaman:** Hedef/alışkanlık, kurs modülü, görev kartları ızgarası.
- **Desen kaynağı:** Pin 33 — 'Bicycle Drill · Jogging Hero' taşan ikonlu kartlar
- **Sınıflar:** `pl-activity pl-activity__ic pl-activity__foot pl-progress`
- **Erişilebilirlik:** İlerleme "%45, 4 haftalık hedefin 2 haftası".

```html
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="pl-activity"><span class="pl-activity__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg></span><b>Bisiklet</b><small>36 km / hafta</small><div class="pl-activity__foot"><span>İlerleme</span><span class="pl-num">%45</span></div><div class="pl-progress"><span style="--pl-val:45%"></span></div><span class="pl-badge pl-badge--danger">17.11.2026</span></div><div class="pl-activity"><span class="pl-activity__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></span><b>Koşu</b><small>12 km / hafta</small><div class="pl-activity__foot"><span>İlerleme</span><span class="pl-num">%72</span></div><div class="pl-progress"><span style="--pl-val:72%"></span></div><span class="pl-badge pl-badge--danger">20.11.2026</span></div></div>
```

### PLA-081

**Aksan Dolgulu Genel Bakış Kartı** · `overview-chart`

- **Amaç:** Tamamen aksan zeminli kart: başlık, dönem seçici, alan grafiği, vurgulu nokta ve 3'lü istatistik kutuları.
- **Ne zaman:** Panonun ana grafiği; ekranda tek.
- **Desen kaynağı:** Pin 33 — mor 'Overview' grafik kartı ve alt istatistik üçlüsü
- **Sınıflar:** `pl-overview .o-line .o-area .o-grid pl-overview__stats div.is-hi`
- **Erişilebilirlik:** Aksan zeminde metin --pl-fg-on-accent; grafik özeti aria-label.

```html
<div class="pl-overview"><div class="pl-row" style="justify-content:space-between"><b style="font-size:16px">Genel bakış</b><select class="pl-select" style="width:120px;height:28px"><option>Aylık</option><option>Haftalık</option></select></div><svg viewBox="0 0 300 90" preserveAspectRatio="none" role="img" aria-label="Aylık adım, en yüksek Haziran 9.178"><line class="o-grid" x1="0" x2="300" y1="15" y2="15"/><line class="o-grid" x1="0" x2="300" y1="45" y2="45"/><line class="o-grid" x1="0" x2="300" y1="75" y2="75"/><path class="o-area" d="M0.0,86.0 C16.65,86.0 16.65,63.6 33.3,63.6 C50.0,63.6 50.0,71.1 66.7,71.1 C83.35,71.1 83.35,41.3 100.0,41.3 C116.65,41.3 116.65,53.2 133.3,53.2 C150.0,53.2 150.0,4.0 166.7,4.0 C183.35,4.0 183.35,59.2 200.0,59.2 C216.65,59.2 216.65,38.3 233.3,38.3 C250.0,38.3 250.0,44.3 266.7,44.3 C283.35,44.3 283.35,26.4 300.0,26.4 L300,90 L0,90 Z"/><path class="o-line" d="M0.0,86.0 C16.65,86.0 16.65,63.6 33.3,63.6 C50.0,63.6 50.0,71.1 66.7,71.1 C83.35,71.1 83.35,41.3 100.0,41.3 C116.65,41.3 116.65,53.2 133.3,53.2 C150.0,53.2 150.0,4.0 166.7,4.0 C183.35,4.0 183.35,59.2 200.0,59.2 C216.65,59.2 216.65,38.3 233.3,38.3 C250.0,38.3 250.0,44.3 266.7,44.3 C283.35,44.3 283.35,26.4 300.0,26.4"/></svg><div class="pl-overview__stats"><div><b>748 s</b><small>Nisan</small></div><div class="is-hi"><b>9.178</b><small>Adım · Haz</small></div><div><b>9.200</b><small>Adım · Tem</small></div></div></div>
```

### PLA-082

**Arkadaş / Kişi Listesi** · `people-list`

- **Amaç:** Avatar + ad + son etkinlik + sağda eylem ikonu.
- **Ne zaman:** Arkadaşlar, ekip üyeleri, paylaşım listesi.
- **Desen kaynağı:** Pin 33 — 'Friends' listesi ve eylem ikonları
- **Sınıflar:** `pl-people pl-people__row`
- **Erişilebilirlik:** <ul>; eylem düğmesi kişinin adını içerir ("Yalçın'a mesaj").

```html
<ul class="pl-people" style="margin:0;padding:0;list-style:none"><li class="pl-people__row"><span class="pl-avatar is-online">YA</span><span><b>Yalçın</b><small>Bisiklet · 2 sa önce</small></span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Yalçın kişisine mesaj"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button></li><li class="pl-people__row"><span class="pl-avatar">İL</span><span><b>İlhan</b><small>Koşu · dün</small></span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="İlhan kişisine mesaj"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button></li><li class="pl-people__row"><span class="pl-avatar is-online">SA</span><span><b>Savaş</b><small>Yürüyüş · 3 gün önce</small></span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Savaş kişisine mesaj"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button></li></ul>
```

### PLA-083

**Küre İstatistik Paneli** · `globe-stats`

- **Amaç:** Büyük toplam, ülke/bölge dağılım listesi ve noktalı kıtalı ışıyan küre.
- **Ne zaman:** Coğrafi kullanıcı dağılımı, global erişim panosu.
- **Desen kaynağı:** Pin 34 — 'General statistics 7,541,390' altıgen noktalı küre
- **Sınıflar:** `pl-globe pl-countries (--c)`
- **Erişilebilirlik:** Küre dekoratif; veri pl-countries listesinde.

```html
<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:center"><div class="pl-stack"><span class="pl-label">Tüm kullanıcılar</span><span class="pl-display pl-display--lg">7.541.390</span><div class="pl-progress pl-progress--sm"><span style="--pl-val:64%;background:var(--pl-grad-sunset)"></span></div><div class="pl-countries"><div><i style="--c:var(--pl-viz-1)"></i>Türkiye<b>4.502.110</b><small>%59</small></div><div><i style="--c:var(--pl-viz-2)"></i>Almanya<b>1.302.400</b><small>%17</small></div><div><i style="--c:var(--pl-viz-3)"></i>Hollanda<b>904.950</b><small>%12</small></div><div><i style="--c:var(--pl-viz-4)"></i>Diğer<b>831.930</b><small>%11</small></div></div></div><div class="pl-globe" aria-hidden="true"></div></div>
```

### PLA-084

**Kategori İkon Çipleri** · `category-chips`

- **Amaç:** Dikey hap biçimli çip: daire ikon + etiket; seçili çip aksan dolgulu ve ışıyan.
- **Ne zaman:** Kategori filtreleri (tarif, ürün, şablon).
- **Desen kaynağı:** Pin 23 — 'All · Burgers · Pizza · Salads…' yuvarlak kategori çipleri
- **Sınıflar:** `pl-catchips pl-catchip is-active pl-catchip__ic`
- **Erişilebilirlik:** role="radiogroup" + aria-checked.

```html
<div class="pl-catchips" role="radiogroup" aria-label="Kategoriler"><button class="pl-catchip is-active" role="radio" aria-checked="true"><span class="pl-catchip__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg></span>Tümü</button><button class="pl-catchip" role="radio" aria-checked="false"><span class="pl-catchip__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg></span>Ana yemek</button><button class="pl-catchip" role="radio" aria-checked="false"><span class="pl-catchip__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></span>Izgara</button><button class="pl-catchip" role="radio" aria-checked="false"><span class="pl-catchip__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/></svg></span>Çorba</button><button class="pl-catchip" role="radio" aria-checked="false"><span class="pl-catchip__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg></span>Tatlı</button></div>
```

### PLA-085

**Ürün Vitrin Kartı** · `dish-card` · Ürün: Mutfak Atölyesi (`data-pl-product="mutfak"`)

- **Amaç:** Üstten taşan yuvarlak görsel, ad, açıklama, fiyat ve yuvarlak ekle düğmesi; seçili kart aksan çerçeveli.
- **Ne zaman:** Menü, tarif, ürün vitrini (Mutfak Atölyesi).
- **Desen kaynağı:** Pin 23 — taşan yuvarlak ürün görselli yemek kartları
- **Durumlar:** varsayılan, seçili / sepette, tükendi (devre dışı)
- **Sınıflar:** `pl-dish is-selected pl-dish__img pl-dish__foot pl-dish__price pl-dish__add`
- **Erişilebilirlik:** Ekle düğmesi aria-label="Mercimek çorbasını sepete ekle".

```html
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><article class="pl-dish"><span class="pl-dish__img"></span><b>İzmir köfte</b><small>Fırında patates, domates</small><div class="pl-dish__foot"><span class="pl-dish__price">285 ₺</span><button class="pl-dish__add" aria-label="İzmir köfteyi ekle"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg></button></div></article><article class="pl-dish is-selected"><span class="pl-dish__img" style="background:var(--pl-media-4)"></span><b>Mevsim salata</b><small>Nar ekşili</small><div class="pl-dish__foot"><span class="pl-dish__price">160 ₺</span><button class="pl-dish__add" aria-label="Sepette"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></button></div></article></div>
```

### PLA-086

**Sipariş Özeti** · `order-summary` · Ürün: Mutfak Atölyesi (`data-pl-product="mutfak"`)

- **Amaç:** Ürün satırları (görsel, ad, adet), ara toplam/teslimat/toplam ve birincil CTA.
- **Ne zaman:** Sepet, sipariş onayı, fatura özeti.
- **Desen kaynağı:** Pin 23 — 'My Order' sepet ve ara toplam
- **Sınıflar:** `pl-order pl-order__row pl-order__img pl-order__sum is-total`
- **Erişilebilirlik:** Toplam aria-live; adet değişimi duyurulur.

```html
<div class="pl-order"><div class="pl-order__row"><span class="pl-order__img"></span><span><b>İzmir köfte</b><small>×1</small></span><b class="pl-num">285 ₺</b></div><div class="pl-order__row"><span class="pl-order__img" style="background:var(--pl-media-4)"></span><span><b>Mevsim salata</b><small>×2</small></span><b class="pl-num">320 ₺</b></div><div class="pl-order__sum"><div>Ara toplam<b>605 ₺</b></div><div>Teslimat<b>0 ₺</b></div><div class="is-total">Toplam<b aria-live="polite">605 ₺</b></div></div><button class="pl-btn pl-btn--primary pl-btn--block pl-btn--lg">Siparişi ver</button></div>
```

### PLA-087

**İndirim Kartı** · `offer-card`

- **Amaç:** Gradyan zeminli küçük kampanya kartı; büyük yüzde ve kısa açıklama.
- **Ne zaman:** Kenar çubuğu promosyonu, kupon.
- **Desen kaynağı:** Pin 23 — '-50% off' köşe promosyon kartı
- **Sınıflar:** `pl-offer`
- **Erişilebilirlik:** Kampanya koşulları bağlantıyla.

```html
<div class="pl-offer" style="max-width:220px"><b>-%50</b><small>İlk siparişte tüm tatlılarda</small></div>
```

### PLA-088

**Oyun İstatistik Halkası** · `blob-ring`

- **Amaç:** Yavaşça biçim değiştiren konik gradyan halka; ortada toplam değer.
- **Ne zaman:** Toplam kullanım süresi, kişisel rekor, yıl özeti.
- **Desen kaynağı:** Pin 44 — '12,340h' organik gradyan halka
- **Sınıflar:** `pl-blobring pl-blobring__val`
- **Erişilebilirlik:** Animasyon azaltılmış harekette durur; değer metin.

```html
<div class="pl-blobring"><div class="pl-blobring__val"><small>Toplam süre</small><b>12.340 s</b></div></div>
```

### PLA-089

**Sosyal Profil Kartı** · `social-profile`

- **Amaç:** Kapak, taşan avatar, ad, 3'lü istatistik ve takip/mesaj düğmeleri.
- **Ne zaman:** Topluluk profili, ekip üyesi kartı, yazar kutusu.
- **Desen kaynağı:** Pin 38 — kapak görselli, istatistikli profil kartı
- **Sınıflar:** `pl-profile pl-profile__cover pl-profile__avatar pl-profile__body pl-profile__name pl-profile__stats`
- **Erişilebilirlik:** Avatar alt metni ad; istatistikler <dl>.

```html
<article class="pl-profile" style="max-width:260px"><div class="pl-profile__cover"></div><div class="pl-profile__avatar">MI</div><div class="pl-profile__body"><div><div class="pl-profile__name">Muhammed</div><span class="pl-muted">TİMDESİGNERS · İzmir</span></div><div class="pl-profile__stats"><div><b>23,5B</b><small>Takipçi</small></div><div><b>1.060</b><small>Takip</small></div><div><b>148</b><small>Proje</small></div></div><div class="pl-row" style="justify-content:center"><button class="pl-btn pl-btn--primary pl-btn--sm">Takip et</button><button class="pl-btn pl-btn--secondary pl-btn--sm">Mesaj</button></div></div></article>
```

### PLA-090

**Araştırma Gantt Şeridi** · `research-gantt`

- **Amaç:** Sütun çizgili zaman ızgarası üzerinde hap biçimli süre çubukları; ikincil çubuklar yumuşak.
- **Ne zaman:** Araştırma/proje zaman planı, yol haritası özeti.
- **Desen kaynağı:** Pin 9 — 'Researches' zaman çizelgesi hapları
- **Sınıflar:** `pl-gantt (--n) pl-gantt__head pl-gantt__row pl-gantt__bar pl-gantt__bar--soft (--x, --w, --c)`
- **Erişilebilirlik:** Her çubuk aria-label ile başlangıç–bitiş tarihini okur.

```html
<div class="pl-gantt" style="--n:6"><div class="pl-gantt__head"><span>Haz</span><span>Tem</span><span>Ağu</span><span>Eyl</span><span>Eki</span><span>Kas</span></div><div class="pl-gantt__row"><span class="pl-gantt__bar" style="--x:8%;--w:46%" aria-label="Kapsam analizi, Haziran–Ağustos">Kapsam analizi</span></div><div class="pl-gantt__row"><span class="pl-gantt__bar pl-gantt__bar--soft" style="--x:38%;--w:40%">Kullanıcı testleri</span></div><div class="pl-gantt__row"><span class="pl-gantt__bar" style="--x:62%;--w:34%;--c:var(--pl-viz-5)">Yayın</span></div></div>
```


---

## Ekran Şablonları (12)

### PLA-091

**Akıllı Ev Kontrol Merkezi** · `screen-smart-home` · Ürün: Flow Dock (`data-pl-product="flowdock"`)

- **Amaç:** Sol ray + üst iklim çipleri; ortada 3B/izometrik sahne üzerinde sensör kartları ve üye şeridi; sağda oda kartı, cihaz anahtarları ve ses sistemi.
- **Ne zaman:** IoT / akıllı ev / tesis kontrol uygulamasının ana ekranı.
- **Desen kaynağı:** Pinler 0, 6 — 3B ev sahnesi, sensör kartları, oda paneli, cihaz anahtarları, üye şeridi
- **Sınıflar:** `pl-screen + pl-rail + pl-isoplan + pl-sensor + pl-presence + pl-roomcard + pl-devtile + pl-player`
- **Erişilebilirlik:** Landmark'lar: nav, main, aside. Sahne alternatifi olarak oda listesi.

```html
<div class="pl-screen"><nav class="pl-rail" aria-label="Gezinme"><span class="pl-rail__logo">PL</span><button class="pl-rail__item is-active" aria-label="home"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg></button><button class="pl-rail__item" aria-label="grid"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg></button><button class="pl-rail__item" aria-label="map-pin"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg></button><button class="pl-rail__item" aria-label="camera"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/></svg></button><button class="pl-rail__item" aria-label="users"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></button><span class="pl-rail__spacer"></span><button class="pl-rail__item" aria-label="settings"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button></nav>
<main class="pl-screen__main"><div class="pl-screen__top"><span class="pl-avatar pl-avatar--lg pl-avatar--accent"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg></span><div><h3 class="pl-screen__title" style="font-size:18px">Akıllı Ev</h3><span class="pl-muted">Seyrek · 01.11.2026</span></div><span style="flex:1"></span><div class="pl-climate"><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/></svg>11°C</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/></svg>%67</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>20:21</span></div></div>
<div class="pl-isoplan" style="height:340px;flex:1"><div class="pl-isoplan__floor"><span class="pl-isoplan__room pl-isoplan__room--wide is-active" style="--c:var(--pl-viz-6)"></span><span class="pl-isoplan__room" style="--c:var(--pl-viz-5)"></span><span class="pl-isoplan__room" style="--c:var(--pl-viz-4)"></span><span class="pl-isoplan__room" style="--c:var(--pl-viz-3)"></span><span class="pl-isoplan__room" style="--c:var(--pl-viz-2)"></span></div>
<div style="position:absolute;left:16px;top:16px;display:grid;gap:8px"><div class="pl-sensor pl-glass"><span class="pl-sensor__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"/></svg></span><div class="pl-sensor__top">Sıcaklık <b>23°</b></div><div class="pl-sensor__dots"><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i></div></div><div class="pl-sensor pl-glass"><span class="pl-sensor__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/></svg></span><div class="pl-sensor__top">Nem <b>%48</b></div><div class="pl-sensor__dots"><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i><i class=""></i></div></div></div>
<div class="pl-viewtools" style="right:12px;top:12px"><button>2D</button><button class="is-active">3D</button><hr><button aria-label="Yakınlaştır"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg></button></div>
<div class="pl-presence" style="position:absolute;left:16px;bottom:16px"><div class="pl-presence__item is-home"><span class="pl-avatar pl-avatar--accent">MI</span><span><b>Muhammed</b><small>Evde</small></span></div><div class="pl-presence__item is-home"><span class="pl-avatar">YA</span><span><b>Yalçın</b><small>Evde</small></span></div><div class="pl-presence__item"><span class="pl-avatar">ÜS</span><span><b>Ünal</b><small>Dışarıda</small></span></div></div></div></main>
<aside class="pl-screen__aside"><article class="pl-roomcard"><div class="pl-roomcard__head"><span class="pl-roomcard__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="m17 2-5 5-5-5"/></svg></span><div style="flex:1"><div class="pl-roomcard__name">Salon</div><div class="pl-muted" style="font-size:11px">6 cihaz · 4 açık</div></div></div><div class="pl-roomcard__view"></div></article>
<label class="pl-devtile is-on"><span class="pl-devtile__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/></svg></span><span><span class="pl-devtile__name">Kamera</span><br><span class="pl-devtile__sub">Kayıtta</span></span><span class="pl-switch"><input type="checkbox" role="switch" checked></span></label>
<label class="pl-devtile is-on"><span class="pl-devtile__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/></svg></span><span><span class="pl-devtile__name">Aydınlatma</span><br><span class="pl-devtile__sub">%70</span></span><span class="pl-switch"><input type="checkbox" role="switch" checked></span><span class="pl-devtile__meter"><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class=""></i><i class=""></i><i class=""></i></span></label>
<label class="pl-devtile"><span class="pl-devtile__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.8 9.2C8.6 7.4 8.4 3 12 3c4 0 3 4.7 1.2 6.2M14.8 10.8c2.2-1.8 6.6-2 6.6 1.6 0 4-4.7 3-6.2 1.2M13.2 14.8c2.2 1.8 2.4 6.2-1.2 6.2-4 0-3-4.7-1.2-6.2M9.2 13.2c-2.2 1.8-6.6 2-6.6-1.6 0-4 4.7-3 6.2-1.2"/><circle cx="12" cy="12" r="2"/></svg></span><span><span class="pl-devtile__name">Robot süpürge</span><br><span class="pl-devtile__sub">Şarjda</span></span><span class="pl-switch"><input type="checkbox" role="switch"></span></label>
<div class="pl-player"><div class="pl-player__art"></div><div style="min-width:0"><div class="pl-player__title">Ses sistemi</div><div class="pl-player__sub">Gece Atölyesi · Odak</div></div><div class="pl-player__ctl"><button class="pl-player__btn pl-player__btn--main" aria-label="Duraklat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg></button></div></div></aside></div>
```

### PLA-092

**Medya Kitaplığı & Mağaza** · `screen-media-store` · Ürün: PluginLabs Hub (`data-pl-product="hub"`)

- **Amaç:** Hub mağaza ekranı: kenar çubuğu + arama/profil üst çubuğu, sinematik kahraman, indirimli ürün rafı ve sağda trend/öne çıkan paneli.
- **Ne zaman:** PluginLabs Hub uygulama mağazası, şablon kitaplığı, medya uygulamaları.
- **Desen kaynağı:** Pinler 2, 5, 7, 27 — kahraman vitrin, raf, indirim kartları, trend listesi
- **Sınıflar:** `pl-screen + pl-glassnav + pl-cinehero + pl-shelf + pl-deal + pl-trend + pl-promo`
- **Erişilebilirlik:** Raf başlıkları h3; kahraman h2; arama role="search".

```html
<div class="pl-screen"><nav class="pl-glassnav" style="background:var(--pl-bg-1);border-radius:0;border-right:1px solid var(--pl-line)" aria-label="Mağaza"><div class="pl-glassnav__brand">Plugin<span style="color:var(--pl-accent)">Labs</span></div><a class="pl-glassnav__item is-active" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>Keşfet</a><a class="pl-glassnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>Kategoriler</a><a class="pl-glassnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>Kitaplığım</a><span class="pl-label pl-glassnav__sec">Son açılanlar</span><a class="pl-glassnav__item" href="#"><span class="pl-applogo pl-applogo--sm" data-pl-product="leo">LH</span>Leo Helper</a><a class="pl-glassnav__item" href="#"><span class="pl-applogo pl-applogo--sm" data-pl-product="tweakster">TW</span>Tweakster</a><a class="pl-glassnav__item" href="#"><span class="pl-applogo pl-applogo--sm" data-pl-product="mindpalace">MP</span>Mind Palace</a></nav>
<main class="pl-screen__main"><div class="pl-screen__top"><div class="pl-inputwrap" role="search" style="flex:1;max-width:360px"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input class="pl-input" placeholder="Uygulama ara"><span class="pl-kbd">Ctrl K</span></div><span style="flex:1"></span><button class="pl-iconbtn" aria-label="Favoriler"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg></button><button class="pl-iconbtn" aria-label="Bildirimler"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></button><span class="pl-avatar pl-avatar--accent">MI</span></div>
<section class="pl-cinehero" style="min-height:240px;padding:28px"><div class="pl-cinehero__body"><span class="pl-cinehero__kicker"><span class="pl-dot"></span>Yeni sürüm</span><h2 class="pl-cinehero__title">Mind Palace 2</h2><div class="pl-cinehero__meta"><span class="pl-chip pl-chip--ghost pl-chip--mono">v2.0.0</span><span class="pl-chip pl-chip--ghost pl-chip--mono">Masaüstü</span><span class="pl-chip pl-chip--ghost pl-chip--mono">MyMind</span></div><div class="pl-row"><button class="pl-btn pl-btn--primary"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>Kur</button><button class="pl-btn pl-btn--secondary">Ayrıntılar</button></div></div></section>
<section class="pl-shelf"><div class="pl-shelf__head"><h3 class="pl-shelf__title">İndirimdekiler</h3><a class="pl-link" href="#">Tümünü gör</a></div><div class="pl-scroll-x"><article class="pl-deal"><div class="pl-deal__art" style="background:var(--pl-media-5)"></div><span class="pl-deal__plat">Masaüstü</span><span class="pl-deal__name">Tweakster Pro</span><div class="pl-deal__price"><span class="pl-deal__off">-%40</span><s class="pl-deal__old">1.249,90 ₺</s><span class="pl-deal__now">749,90 ₺</span></div></article><article class="pl-deal"><div class="pl-deal__art" style="background:var(--pl-media-6)"></div><span class="pl-deal__plat">Eklenti</span><span class="pl-deal__name">Leo Helper</span><div class="pl-deal__price"><span class="pl-deal__off">-%25</span><s class="pl-deal__old">399,90 ₺</s><span class="pl-deal__now">299,90 ₺</span></div></article><article class="pl-deal"><div class="pl-deal__art" style="background:var(--pl-media-3)"></div><span class="pl-deal__plat">Eklenti</span><span class="pl-deal__name">Design Replicator</span><div class="pl-deal__price"><span class="pl-deal__off">-%30</span><s class="pl-deal__old">599,90 ₺</s><span class="pl-deal__now">419,90 ₺</span></div></article><article class="pl-deal"><div class="pl-deal__art" style="background:var(--pl-media-2)"></div><span class="pl-deal__plat">Masaüstü</span><span class="pl-deal__name">Flow Dock</span><div class="pl-deal__price"><span class="pl-deal__off">-%50</span><s class="pl-deal__old">899,90 ₺</s><span class="pl-deal__now">449,90 ₺</span></div></article></div></section></main>
<aside class="pl-screen__aside"><div class="pl-panel"><div class="pl-panel__head"><h3 class="pl-panel__title">Trend</h3><a class="pl-link" href="#">Tümü</a></div><div class="pl-row" style="flex-wrap:nowrap;gap:8px"><article class="pl-trend" style="width:50%"><div class="pl-trend__art"></div><div class="pl-trend__row"><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>4,2B</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg>18B</span></div></article><article class="pl-trend" style="width:50%"><div class="pl-trend__art" style="background:var(--pl-media-3)"></div><div class="pl-trend__row"><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>2,9B</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg>11B</span></div></article></div></div>
<div class="pl-offer"><b>-%50</b><small>Flow Dock Pro · 30.11.2026'ya kadar</small></div>
<div class="pl-resume" style="width:auto"><div class="pl-resume__thumb"><span class="pl-resume__play"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg></span><div class="pl-resume__bar" style="--pl-val:62%"><span></span></div></div><div class="pl-resume__title">Eğitim · Komut paleti</div></div></aside></div>
```

### PLA-093

**Canlı Skor Merkezi** · `screen-live-score`

- **Amaç:** Neon yüzey: sol ray, kahraman yayın kartı, öne çıkan neon kart ve maç satırları; sağda canlı skor ve oran paneli.
- **Ne zaman:** Canlı veri, turnuva, yarışma veya gerçek zamanlı karşılaştırma panoları.
- **Desen kaynağı:** Pin 4 — neon yeşil turnuva canlı yayın panosu
- **Kapsayıcı:** `<div data-pl data-pl-surface="neon">`
- **Sınıflar:** `pl-screen + pl-rail + pl-cinehero + pl-neoncard + pl-matchrow + pl-score + pl-ticker`
- **Erişilebilirlik:** Skor değişimi aria-live="polite".

```html
<div class="pl-screen"><nav class="pl-rail" aria-label="Gezinme"><span class="pl-rail__logo">PL</span><button class="pl-rail__item" aria-label="home"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg></button><button class="pl-rail__item is-active" aria-label="trophy"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg></button><button class="pl-rail__item" aria-label="activity"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></button><button class="pl-rail__item" aria-label="calendar"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></button><span class="pl-rail__spacer"></span><button class="pl-rail__item" aria-label="settings"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button></nav>
<main class="pl-screen__main"><div class="pl-ticker"><span class="pl-ticker__label"><span class="pl-dot pl-dot--live"></span>CANLI</span><div class="pl-ticker__track"><span>Atlas X <b>2–1</b> Nova</span><span>Kuzey <b>0–0</b> Lima</span><span>Delta <b>3–2</b> Orion</span><span>Atlas X <b>2–1</b> Nova</span><span>Kuzey <b>0–0</b> Lima</span><span>Delta <b>3–2</b> Orion</span></div></div>
<section class="pl-cinehero" style="min-height:210px;padding:24px;background:var(--pl-media-4)"><div class="pl-cinehero__body"><span class="pl-cinehero__kicker">Kış Ligi</span><h2 class="pl-cinehero__title" style="font-size:34px">Dünya Şampiyonası<br>Canlı Yayın</h2><div class="pl-row"><button class="pl-btn pl-btn--secondary pl-btn--sm">Daha fazla</button><button class="pl-btn pl-btn--primary pl-btn--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>İzle</button></div></div></section>
<div class="pl-screen__grid" style="grid-template-columns:1fr 2fr"><div class="pl-neoncard"><span class="pl-label">Öne çıkan</span><b>Atlas X · Nova</b><span class="pl-neoncard__val">54,4B</span><span style="font-size:12px;opacity:.75">izleyici</span></div>
<div><div class="pl-matchrow"><span class="pl-avatar pl-avatar--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg></span><div class="pl-matchrow__teams"><span>Atlas X</span><span>Nova</span></div><div class="pl-matchrow__score"><span>17</span><span>6</span></div><div class="pl-odds"><button class="is-active"><small>1</small>1,40</button><button><small>X</small>3,10</button><button><small>2</small>2,85</button></div></div><div class="pl-matchrow"><span class="pl-avatar pl-avatar--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg></span><div class="pl-matchrow__teams"><span>Kuzey Kurtları</span><span>Lima</span></div><div class="pl-matchrow__score"><span>4</span><span>23</span></div><div class="pl-odds"><button><small>1</small>4,20</button><button><small>X</small>3,60</button><button><small>2</small>1,25</button></div></div></div></div></main>
<aside class="pl-screen__aside"><article class="pl-score"><div class="pl-score__head"><span class="pl-score__live"><span class="pl-dot pl-dot--live"></span>CANLI</span><span>Final</span></div><div class="pl-score__teams"><div class="pl-score__team"><span class="pl-score__crest">AX</span>Atlas X</div><div class="pl-score__vs">2 : 1<small>34:12</small></div><div class="pl-score__team"><span class="pl-score__crest">NV</span>Nova</div></div><div class="pl-score__bar"><span style="flex:64"></span><span style="flex:36"></span></div></article>
<div class="pl-panel"><div class="pl-panel__head"><h3 class="pl-panel__title">Altın farkı</h3><span class="pl-num" style="color:var(--pl-accent)">+4,2B</span></div><svg class="pl-spark" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0.0,56.0 C16.65,56.0 16.65,45.1 33.3,45.1 C50.0,45.1 50.0,50.5 66.7,50.5 C83.35,50.5 83.35,35.5 100.0,35.5 C116.65,35.5 116.65,42.3 133.3,42.3 C150.0,42.3 150.0,25.9 166.7,25.9 C183.35,25.9 183.35,31.4 200.0,31.4 C216.65,31.4 216.65,14.9 233.3,14.9 C250.0,14.9 250.0,20.4 266.7,20.4 C283.35,20.4 283.35,4.0 300.0,4.0"/></svg></div>
<div class="pl-row" style="justify-content:space-between"><button class="pl-btn pl-btn--secondary">1,40</button><button class="pl-btn pl-btn--secondary">3,10</button><button class="pl-btn pl-btn--primary"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2M13 17v2M13 11v2"/></svg>Kupon</button></div></aside></div>
```

### PLA-094

**IoT Komuta HUD** · `screen-iot-hud`

- **Amaç:** HUD yüzey: üst başlık şeridi, sol metrik ve dalga panelleri, ortada izometrik tesis ve sıcak noktalar, sağda halka göstergeler ve alarm tablosu, altta olay şeridi.
- **Ne zaman:** Fabrika/IoT izleme, güvenlik operasyon merkezi, sunucu çiftliği panosu.
- **Desen kaynağı:** Pinler 8, 10, 13, 16, 20, 43 — fabrika / şehir komuta merkezi ekranları
- **Kapsayıcı:** `<div data-pl data-pl-surface="hud">`
- **Sınıflar:** `pl-screen + pl-hudframe + pl-hudmetric + pl-wavemon + pl-isoplan + pl-hotspot + pl-hudrings + pl-hudtable + pl-filmtick`
- **Erişilebilirlik:** Kritik alarmlar role="alert"; diğer güncellemeler polite.

```html
<div class="pl-screen" style="flex-direction:column"><div class="pl-hudframe" style="padding:0;height:34px;clip-path:none;border-width:0 0 1px"><div class="pl-hudframe__title" style="justify-content:center;background:linear-gradient(90deg,transparent,var(--pl-hud-soft),transparent);font-size:13px">PluginLabs Tesis Komuta Merkezi <span>21:40:12</span></div></div>
<div class="pl-screen__main"><div class="pl-screen__grid" style="grid-template-columns:1fr 1.6fr 1fr;align-items:start">
<div class="pl-stack"><section class="pl-hudframe"><div class="pl-hudframe__title">Genel endeks</div><div class="pl-hudmetric"><span class="pl-hudmetric__ic"><svg class="pl-ico pl-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></span><span class="pl-hudmetric__val">102<small>.67</small></span><span class="pl-hudmetric__lbl">Normal</span></div></section>
<section class="pl-hudframe"><div class="pl-hudframe__title">Sinyal</div><div class="pl-wavemon"><div class="pl-wavemon__row"><span class="pl-wavemon__val">85</span><svg viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><polyline points="0.0,29.0 5.1,30.2 10.2,29.5 15.3,30.4 20.3,30.5 25.4,28.3 30.5,35 35.6,6 40.7,44 45.8,28.9 50.8,32.0 55.9,29.9 61.0,31.3 66.1,29.9 71.2,30.6 76.3,28.6 81.4,30.5 86.4,31.5 91.5,30.1 96.6,31.0 101.7,30.7 106.8,35 111.9,6 116.9,44 122.0,29.2 127.1,28.1 132.2,31.5 137.3,29.9 142.4,30.9 147.5,31.5 152.5,30.9 157.6,31.7 162.7,29.6 167.8,31.2 172.9,29.8 178.0,31.7 183.1,35 188.1,6 193.2,44 198.3,28.9 203.4,31.9 208.5,29.7 213.6,30.5 218.6,29.2 223.7,30.0 228.8,29.5 233.9,29.4 239.0,30.3 244.1,30.3 249.2,31.6 254.2,30.7 259.3,35 264.4,6 269.5,44 274.6,30.7 279.7,28.7 284.7,31.4 289.8,31.9 294.9,31.6 300.0,30.3"/></svg></div><div class="pl-wavemon__row"><span class="pl-wavemon__val">76</span><svg viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><polyline points="0.0,28.9 5.1,28.4 10.2,29.6 15.3,28.6 20.3,28.3 25.4,29.6 30.5,33.0 35.6,15.6 40.7,38.4 45.8,28.9 50.8,30.1 55.9,29.1 61.0,28.7 66.1,28.4 71.2,28.9 76.3,31.7 81.4,31.3 86.4,31.2 91.5,31.2 96.6,28.8 101.7,29.2 106.8,33.0 111.9,15.6 116.9,38.4 122.0,31.5 127.1,28.3 132.2,30.4 137.3,30.7 142.4,30.0 147.5,28.7 152.5,29.9 157.6,28.4 162.7,31.7 167.8,31.5 172.9,30.2 178.0,29.2 183.1,33.0 188.1,15.6 193.2,38.4 198.3,31.4 203.4,30.0 208.5,29.7 213.6,30.4 218.6,29.7 223.7,28.6 228.8,29.2 233.9,31.3 239.0,28.2 244.1,28.2 249.2,30.5 254.2,29.1 259.3,33.0 264.4,15.6 269.5,38.4 274.6,32.0 279.7,28.8 284.7,29.7 289.8,28.8 294.9,30.5 300.0,29.1"/></svg></div><div class="pl-wavemon__row"><span class="pl-wavemon__val">25</span><svg viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><polyline points="0.0,30.5 5.1,31.0 10.2,31.2 15.3,31.8 20.3,31.0 25.4,31.7 30.5,31.8 35.6,21.6 40.7,34.9 45.8,30.6 50.8,31.6 55.9,28.5 61.0,29.9 66.1,29.0 71.2,30.2 76.3,30.3 81.4,28.1 86.4,28.9 91.5,29.1 96.6,31.7 101.7,31.1 106.8,31.8 111.9,21.6 116.9,34.9 122.0,30.5 127.1,28.5 132.2,28.0 137.3,31.5 142.4,28.8 147.5,28.9 152.5,31.9 157.6,31.5 162.7,29.2 167.8,31.8 172.9,30.2 178.0,30.7 183.1,31.8 188.1,21.6 193.2,34.9 198.3,31.9 203.4,31.6 208.5,29.2 213.6,29.4 218.6,28.7 223.7,28.6 228.8,28.3 233.9,29.2 239.0,30.4 244.1,28.0 249.2,30.7 254.2,29.4 259.3,31.8 264.4,21.6 269.5,34.9 274.6,29.3 279.7,29.9 284.7,30.8 289.8,28.2 294.9,31.9 300.0,28.1"/></svg></div></div></section></div>
<div class="pl-isoplan" style="height:360px;background:radial-gradient(70% 60% at 50% 50%,var(--pl-hud-soft),transparent)"><div class="pl-isoplan__floor" style="background:var(--pl-bg-3)"><span class="pl-isoplan__room pl-isoplan__room--wide" style="--c:var(--pl-hud)"></span><span class="pl-isoplan__room is-active" style="--c:var(--pl-hud-amber)"></span><span class="pl-isoplan__room" style="--c:var(--pl-hud)"></span><span class="pl-isoplan__room" style="--c:var(--pl-hud)"></span><span class="pl-isoplan__room" style="--c:var(--pl-hud-green)"></span></div>
<span class="pl-hotspot is-pulse" style="left:58%;top:40%"><span class="pl-hotspot__pin" style="--c:var(--pl-hud-amber)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/></svg></span><span class="pl-hotspot__label">CNC-0087 · 68,9°C</span></span><span class="pl-hotspot" style="left:34%;top:58%"><span class="pl-hotspot__pin" style="--c:var(--pl-hud)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/></svg></span></span></div>
<div class="pl-stack"><section class="pl-hudframe"><div class="pl-hudframe__title">Kaynak</div><div class="pl-hudrings"><div class="pl-hudring"><div class="pl-hudring__dial" style="--v:72;--c:var(--pl-hud)"><b>72</b></div>CPU</div><div class="pl-hudring"><div class="pl-hudring__dial" style="--v:46;--c:var(--pl-hud-green)"><b>46</b></div>RAM</div><div class="pl-hudring"><div class="pl-hudring__dial" style="--v:88;--c:var(--pl-hud-amber)"><b>88</b></div>Disk</div></div></section>
<section class="pl-hudframe"><div class="pl-hudframe__title">Alarmlar <span>3</span></div><table class="pl-hudtable"><tbody><tr><td>PRS-0142</td><td><span class="pl-hudtag">OK</span></td></tr><tr><td>CNC-0087</td><td><span class="pl-hudtag pl-hudtag--warn">Isı</span></td></tr><tr><td>ROB-0233</td><td><span class="pl-hudtag pl-hudtag--err">Kopuk</span></td></tr></tbody></table></section></div></div>
<div class="pl-filmtick"><div class="pl-filmtick__cell"><i></i>20:00</div><div class="pl-filmtick__cell"><i></i>20:10</div><div class="pl-filmtick__cell"><i></i>20:20</div><div class="pl-filmtick__cell"><i></i>20:30</div><div class="pl-filmtick__cell"><i></i>20:40</div><div class="pl-filmtick__cell"><i></i>20:50</div><div class="pl-filmtick__cell"><i></i>21:00</div><div class="pl-filmtick__cell"><i></i>21:10</div><div class="pl-filmtick__cell"><i></i>21:20</div><div class="pl-filmtick__cell is-active"><i></i>21:30</div><div class="pl-filmtick__cell"><i></i>21:40</div><div class="pl-filmtick__cell"><i></i>21:50</div><div class="pl-filmtick__cell"><i></i>22:00</div><div class="pl-filmtick__cell"><i></i>22:10</div><div class="pl-filmtick__cell"><i></i>22:20</div><div class="pl-filmtick__cell"><i></i>22:30</div><div class="pl-filmtick__cell"><i></i>22:40</div><div class="pl-filmtick__cell"><i></i>22:50</div></div></div></div>
```

### PLA-095

**Video Kurgu Stüdyosu** · `screen-video-studio`

- **Amaç:** Üstte medya kutusu ve önizleme monitörü + sağda araç ayarları; altta oynatma kontrolleri ve çok izli zaman çizelgesi; en altta durum çubuğu.
- **Ne zaman:** Video/ses kurgu, ekran kaydı düzenleme, sunum zamanlama araçları.
- **Desen kaynağı:** Pinler 17, 21 — medya kutusu, önizleme, kurgu zaman çizelgesi, araç ayarları
- **Sınıflar:** `pl-window + pl-bin + pl-camfeed + pl-inspector + pl-transport + pl-tl + pl-statusbar`
- **Erişilebilirlik:** J-K-L, Boşluk, ← → kısayolları; panel başlıkları h2/h3.

```html
<div class="pl-window" style="border-radius:var(--pl-radius-2xl)"><div class="pl-window__bar"><div class="pl-window__lights"><i></i><i></i><i></i></div><div class="pl-window__title">Gece Atölyesi_Fragman — 1080p · 30 FPS</div><button class="pl-btn pl-btn--primary pl-btn--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg>Dışa aktar</button></div>
<div class="pl-window__body" style="flex-direction:column"><div style="display:grid;grid-template-columns:240px 1fr 260px;min-height:0">
<div style="padding:12px;border-right:1px solid var(--pl-line)"><div class="pl-tabs" style="margin-bottom:10px"><button class="pl-tab is-active">Medya</button><button class="pl-tab">Ses</button><button class="pl-tab">Metin</button></div><div class="pl-bin"><div class="pl-bin__item"><div class="pl-bin__thumb" style="background:var(--pl-media-1)"><span>0:12</span></div><b>Giriş</b></div><div class="pl-bin__item is-selected"><div class="pl-bin__thumb" style="background:var(--pl-media-2)"><span>0:48</span></div><b>Atölye 02</b></div><div class="pl-bin__item"><div class="pl-bin__thumb" style="background:var(--pl-media-3)"><span>3:21</span></div><b>Röportaj</b></div><div class="pl-bin__item"><div class="pl-bin__thumb" style="background:var(--pl-media-4)"><span>1:05</span></div><b>B-roll</b></div></div></div>
<div style="padding:12px;display:grid;gap:10px;align-content:start"><div class="pl-camfeed" style="border-radius:12px"><div class="pl-camfeed__tl"><span class="pl-chip pl-chip--ghost pl-chip--mono">Atölye_Sahne_02</span></div><div class="pl-camfeed__br"><span class="pl-chip pl-chip--ghost pl-chip--mono">%100</span></div></div><div style="display:flex;justify-content:center"><div class="pl-transport"><span class="pl-transport__tc">00:03:12:08 <small>/ 00:07:46</small></span><button aria-label="Başa"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 20 9 12l10-8z"/><path d="M5 19V5"/></svg></button><button class="is-main" aria-label="Oynat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg></button><button aria-label="İleri"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 4 10 8-10 8z"/><path d="M19 5v14"/></svg></button></div></div></div>
<aside class="pl-inspector" style="width:auto"><div class="pl-inspector__tabs"><button class="is-active">Klip</button><button>Renk</button></div><div class="pl-inspector__sec"><div class="pl-inspector__grid"><label class="pl-propfield"><b>Ölç</b><input value="%100"></label><label class="pl-propfield"><b>Dön</b><input value="0°"></label></div><span class="pl-muted">Opaklık</span><input class="pl-slider" type="range" value="80"><span class="pl-muted">Hız</span><input class="pl-slider" type="range" value="50"></div></aside></div>
<div style="padding:12px;border-top:1px solid var(--pl-line)"><div class="pl-tl"><div class="pl-tl__ruler"><span></span><div class="pl-tl__ticks"><span style="left:0.0%">00:00</span><span style="left:12.5%">00:04</span><span style="left:25.0%">00:08</span><span style="left:37.5%">00:12</span><span style="left:50.0%">00:16</span><span style="left:62.5%">00:20</span><span style="left:75.0%">00:24</span><span style="left:87.5%">00:28</span></div></div><div class="pl-tl__body"><div class="pl-tl__track"><div class="pl-tl__head"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg>V2</div><div class="pl-tl__lane"><span class="pl-clip pl-clip--text" style="--x:30%;--w:28%"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>Başlık</span></div></div><div class="pl-tl__track"><div class="pl-tl__head"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></svg>V1</div><div class="pl-tl__lane"><span class="pl-clip pl-clip--video" style="--x:2%;--w:30%"><span class="pl-clip__thumb"></span>Giriş.mp4</span><span class="pl-clip pl-clip--video is-selected" style="--x:33%;--w:38%"><span class="pl-clip__thumb"></span>Atölye_Sahne_02.mp4</span><span class="pl-clip pl-clip--fx" style="--x:72%;--w:20%">Geçiş</span></div></div><div class="pl-tl__track"><div class="pl-tl__head"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>A1</div><div class="pl-tl__lane"><span class="pl-clip pl-clip--audio" style="--x:2%;--w:90%">Odak_LoFi.wav</span></div></div><span class="pl-playhead" style="--p:.47"></span></div></div></div>
<footer class="pl-statusbar"><span class="pl-statusbar__item is-accent"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>Otomatik kayıt</span><span class="pl-statusbar__spacer"></span><span class="pl-statusbar__item">1920×1080</span><span class="pl-statusbar__item">30 FPS</span><span class="pl-statusbar__item">GPU %42</span></footer></div></div>
```

### PLA-096

**Araç HMI Kokpit** · `screen-hmi-cockpit`

- **Amaç:** Kokpit yüzey: üstte gösterge kümesi; altta navigasyon kartı, medya, iklim anahtarları ve menzil çubuğu.
- **Ne zaman:** RENTAKAR filo telemetrisi, araç simülasyonu, otomotiv HMI prototipleri.
- **Desen kaynağı:** Pinler 19, 30, 32, 35, 41 — araç içi dijital gösterge ve orta konsol
- **Kapsayıcı:** `<div data-pl data-pl-surface="cockpit">`
- **Sınıflar:** `pl-screen + pl-cluster + pl-turn + pl-player + pl-devtile + pl-range + pl-gear`
- **Erişilebilirlik:** Sürüş sırasında etkileşim sınırlı; tüm hedefler ≥44px.

```html
<div class="pl-screen" style="flex-direction:column;padding:20px;gap:16px"><div class="pl-cluster"><div class="pl-dial" style="--v:44"><div class="pl-dial__val"><b>79</b><small>KM/S</small></div></div><div class="pl-cluster__center"><span class="pl-num pl-muted">13:29 · 21°</span><div class="pl-turn" style="padding:0"><svg class="pl-ico pl-ico--24" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10M7 17 17 7"/></svg><div><div class="pl-turn__dist" style="font-size:24px">750 <small>m</small></div><div class="pl-turn__road">Anadolu Cd. sağa</div></div></div><div class="pl-cluster__road"></div><span class="pl-gear"><span>P</span><span>R</span><span>N</span><span class="is-active">D</span></span></div><div class="pl-dial pl-dial--right" style="--v:68"><div class="pl-dial__val"><b>%68</b><small>412 KM</small></div></div></div>
<div class="pl-screen__grid" style="grid-template-columns:1.4fr 1fr 1fr"><div class="pl-panel pl-panel--xl" style="background:var(--pl-media-6);display:grid;align-content:space-between;min-height:180px"><div class="pl-turn pl-glass"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10M7 17 17 7"/></svg><div><div class="pl-turn__dist">20 <small>m</small></div><div class="pl-turn__road">Çevre yoluna gir</div></div></div><div class="pl-range"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M6 11v2M10 11v2"/></svg><span class="pl-range__bar"><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class=""></i><i class=""></i></span><span>600 km</span></div></div>
<div class="pl-stack"><div class="pl-player"><div class="pl-player__art"></div><div style="min-width:0"><div class="pl-player__title">Kuzey Işıkları</div><div class="pl-player__sub">Atlas Ekibi</div></div><div class="pl-player__ctl"><button class="pl-player__btn pl-player__btn--main" aria-label="Duraklat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg></button></div><div class="pl-player__seek"><span>1:12</span><div class="pl-progress"><span style="--pl-val:30%"></span></div><span>4:02</span></div></div><div class="pl-telemetry"><div><small>Ort.</small><b>6,1 kWh</b></div><div><small>Yol</small><b>2.982 km</b></div><div><small>Lastik</small><b>2,4 bar</b></div></div></div>
<div class="pl-stack" style="gap:8px"><label class="pl-devtile is-on"><span class="pl-devtile__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.8 9.2C8.6 7.4 8.4 3 12 3c4 0 3 4.7 1.2 6.2M14.8 10.8c2.2-1.8 6.6-2 6.6 1.6 0 4-4.7 3-6.2 1.2M13.2 14.8c2.2 1.8 2.4 6.2-1.2 6.2-4 0-3-4.7-1.2-6.2M9.2 13.2c-2.2 1.8-6.6 2-6.6-1.6 0-4 4.7-3 6.2-1.2"/><circle cx="12" cy="12" r="2"/></svg></span><span><span class="pl-devtile__name">Klima</span><br><span class="pl-devtile__sub">21° · Otomatik</span></span><span class="pl-switch"><input type="checkbox" role="switch" checked></span></label><label class="pl-devtile"><span class="pl-devtile__ic"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg></span><span><span class="pl-devtile__name">Koltuk ısıtma</span><br><span class="pl-devtile__sub">Kapalı</span></span><span class="pl-switch"><input type="checkbox" role="switch"></span></label></div></div></div>
```

### PLA-097

**İK Kontrol Paneli** · `screen-hr-dashboard`

- **Amaç:** Soft yüzey (açık tema): hap üst gezinme, karşılama + büyük sayı üçlüsü, bölümlü ilerleme hapları; altta profil kartı, ince çubuk grafik, zaman takip kadranı, görev kartı ve günlük ajanda.
- **Ne zaman:** İK, ekip yönetimi, SaaS yönetim paneli; açık temalı tüketici panelleri.
- **Desen kaynağı:** Pin 39 — açık, krem tonlu, büyük rakamlı İK panosu
- **Kapsayıcı:** `<div data-pl data-pl-theme="light" data-pl-surface="soft">`
- **Sınıflar:** `pl-screen + pl-pillnav + pl-bigstats + pl-segpills + pl-photocard + pl-pinbars + pl-timer + pl-taskcard + pl-agenda`
- **Erişilebilirlik:** Açık temada --pl-fg-3 bile ≥4.5:1; büyük ince rakamlar ≥24px olduğundan 3:1 yeterli.

```html
<div class="pl-screen" style="flex-direction:column;padding:20px;gap:18px;background:linear-gradient(160deg,var(--pl-bg-0),color-mix(in srgb,var(--pl-warning) 14%,var(--pl-bg-0)))"><div class="pl-screen__top"><span class="pl-chip" style="height:34px;font-weight:700;font-size:14px">PluginLabs</span><span style="flex:1"></span><nav class="pl-pillnav"><a class="is-active" href="#">Pano</a><a href="#">Kişiler</a><a href="#">İşe alım</a><a href="#">Cihazlar</a><a href="#">Takvim</a></nav><span style="flex:1"></span><button class="pl-iconbtn" aria-label="Ayarlar"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button><span class="pl-avatar pl-avatar--accent">MI</span></div>
<div class="pl-row" style="justify-content:space-between;align-items:flex-end;gap:24px"><div class="pl-stack" style="flex:1;min-width:280px"><h3 class="pl-screen__title" style="font-size:36px;font-weight:400">Hoş geldin, Muhammed</h3><div class="pl-segpills" style="--cols:1fr 1fr 3.4fr 1fr"><div class="pl-segpill pl-segpill--dark">Mülakat<span>%15</span></div><div class="pl-segpill pl-segpill--accent">İşe alım<span>%15</span></div><div class="pl-segpill">Proje süresi<span>%60</span></div><div class="pl-segpill pl-segpill--hatch">Çıktı<span>%10</span></div></div></div><div class="pl-bigstats"><div class="pl-bigstat"><span class="pl-bigstat__val"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>78</span><span class="pl-bigstat__lbl">Çalışan</span></div><div class="pl-bigstat"><span class="pl-bigstat__val"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>56</span><span class="pl-bigstat__lbl">İşe alım</span></div><div class="pl-bigstat"><span class="pl-bigstat__val"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>203</span><span class="pl-bigstat__lbl">Proje</span></div></div></div>
<div class="pl-screen__grid" style="grid-template-columns:1fr 1.2fr 1fr 1.1fr"><div class="pl-photocard"><div><span class="pl-photocard__name">Yalçın Demir</span><span class="pl-photocard__role">Ürün tasarımcısı</span></div><span class="pl-chip pl-chip--ghost pl-chip--mono pl-photocard__pill">48.500 ₺</span></div>
<div class="pl-panel pl-panel--xl"><div class="pl-panel__head"><h3 class="pl-panel__title">İlerleme</h3><button class="pl-iconbtn pl-iconbtn--sm pl-iconbtn--outline" aria-label="Aç"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10M7 17 17 7"/></svg></button></div><div class="pl-display pl-display--md" style="font-weight:400">6,1 <span class="pl-unit">saat</span></div><div class="pl-pinbars"><div class="pl-pinbars__col" style="--v:40"><i></i>P</div><div class="pl-pinbars__col" style="--v:62"><i></i>S</div><div class="pl-pinbars__col" style="--v:48"><i></i>Ç</div><div class="pl-pinbars__col" style="--v:70"><i></i>P</div><div class="pl-pinbars__col is-peak" style="--v:88"><span class=pl-pinbars__tip>5s 23dk</span><i></i>C</div><div class="pl-pinbars__col" style="--v:30"><i></i>C</div><div class="pl-pinbars__col" style="--v:52"><i></i>P</div></div></div>
<div class="pl-panel pl-panel--xl"><div class="pl-panel__head"><h3 class="pl-panel__title">Zaman takibi</h3></div><div class="pl-timer"><div class="pl-timer__wrap"><div class="pl-timer__dial is-partial" style="--v:64"></div><div class="pl-timer__val"><b>02:35</b><small>Çalışma</small></div></div><div class="pl-timer__ctl"><button class="pl-iconbtn pl-iconbtn--outline" aria-label="Başlat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg></button><button class="pl-iconbtn pl-iconbtn--outline" aria-label="Duraklat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg></button></div></div></div>
<div class="pl-taskcard"><div class="pl-taskcard__head"><b>Kurulum</b><span>2/8</span></div><div class="pl-taskcard__item is-done"><span class="pl-taskcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span><span>Görüşme<small>09:30</small></span><span class="pl-taskcard__chk"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></div><div class="pl-taskcard__item is-done"><span class="pl-taskcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span><span>Ekip toplantısı<small>11:30</small></span><span class="pl-taskcard__chk"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span></div><div class="pl-taskcard__item"><span class="pl-taskcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/></svg></span><span>Proje güncellemesi<small>15:00</small></span><span class="pl-taskcard__chk"></span></div></div>
<div class="pl-panel pl-panel--xl" style="grid-column:1 / -1"><div class="pl-agenda"><div class="pl-agenda__t">09:00</div><div class="pl-agenda__s"><div class="pl-agenda__evt" style="--x:10%;--w:40%">Haftalık ekip senkronu<span class="pl-avatars"><span class="pl-avatar pl-avatar--sm">MI</span><span class="pl-avatar pl-avatar--sm">YA</span></span></div></div><div class="pl-agenda__t">10:00</div><div class="pl-agenda__s"><div class="pl-agenda__evt pl-agenda__evt--soft" style="--x:46%;--w:36%">Kurulum oturumu</div></div></div></div></div></div>
```

### PLA-098

**CRM Kayıt Ekranı** · `screen-crm-record`

- **Amaç:** Soft yüzey: sol menü, 'İşlerim' kuyruğu; sağda kayıt başlığı, iş süreci adımlayıcı, kişi ayrıntısı, sıradaki adımlar, skor göstergesi ve zaman çizelgesi.
- **Ne zaman:** CRM, destek bileti, başvuru takip, müşteri kaydı ekranları.
- **Desen kaynağı:** Pin 31 — açık temalı CRM: iş listesi, süreç akışı, kişi kartı, skor, zaman çizelgesi
- **Kapsayıcı:** `<div data-pl data-pl-theme="light" data-pl-surface="soft">`
- **Sınıflar:** `pl-screen + pl-projnav + pl-queue + pl-bpf + pl-contact + pl-scoregauge + pl-apptl`
- **Erişilebilirlik:** Kayıt başlığı h1; kuyrukta seçili kayıt aria-selected.

```html
<div class="pl-screen"><nav class="pl-projnav" style="border-radius:0;border-width:0 1px 0 0" aria-label="Menü"><span class="pl-label" style="padding:4px 8px">Menü</span><a class="pl-projnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>Ana sayfa</a><a class="pl-projnav__item is-active" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>Satış hızlandırıcı</a><a class="pl-projnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>Panolar</a><a class="pl-projnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>Fırsatlar</a><a class="pl-projnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>Teklifler</a></nav>
<div style="width:250px;flex:none;padding:16px;border-right:1px solid var(--pl-line);display:grid;gap:10px;align-content:start"><div class="pl-row" style="justify-content:space-between"><b style="color:var(--pl-fg-1)">İşlerim</b><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Filtre"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg></button></div><div class="pl-queue"><div class="pl-queue__item is-active"><span class="pl-avatar">ÜS</span><span><b>Ünal Soğukkuyu</b><small>Teklif bekliyor</small></span><span class=pl-queue__go><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span></div><div class="pl-queue__item"><span class="pl-avatar">İK</span><span><b>İlhan K.</b><small>Takip araması</small></span></div><div class="pl-queue__item"><span class="pl-avatar">SV</span><span><b>Savaş V.</b><small>Sözleşme</small></span></div><div class="pl-queue__item"><span class="pl-avatar">YA</span><span><b>Yalçın D.</b><small>Demo</small></span></div></div></div>
<main class="pl-screen__main"><div class="pl-contact__head"><span class="pl-contact__photo">ÜS</span><div style="flex:1"><h3 class="pl-contact__name">Ünal Soğukkuyu</h3><span class="pl-muted">RENTAKAR Otomotiv · Karar verici</span></div><div class="pl-contact__actions"><button class="pl-iconbtn pl-iconbtn--outline" aria-label="Ara"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button><button class="pl-iconbtn pl-iconbtn--outline" aria-label="E-posta"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg></button><button class="pl-btn pl-btn--primary pl-btn--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg>Görev</button></div></div>
<ol class="pl-bpf" style="margin:0;list-style:none"><li class="pl-bpf__stage is-done"><i><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></i>Nitelendir</li><li class="pl-bpf__sep"></li><li class="pl-bpf__stage is-active"><i>2</i>Geliştir <span class="pl-bpf__time">3 gün</span></li><li class="pl-bpf__sep"></li><li class="pl-bpf__stage"><i>3</i>Teklif</li><li class="pl-bpf__sep"></li><li class="pl-bpf__stage"><i>4</i>Kapat</li></ol>
<div class="pl-screen__grid" style="grid-template-columns:1fr 1fr 1fr"><div class="pl-panel pl-panel--xl"><div class="pl-panel__head"><h3 class="pl-panel__title">İletişim</h3></div><div class="pl-contact__meta" style="grid-template-columns:1fr"><div><small>E-posta</small>unal@rentakar.example</div><div><small>Telefon</small>+90 5•• ••• •• ••</div><div><small>Son temas</small>30.10.2026</div></div></div>
<div class="pl-panel pl-panel--xl"><div class="pl-panel__head"><h3 class="pl-panel__title">Sıradaki</h3></div><ol class="pl-apptl" style="margin:0;padding:0;list-style:none"><li class="pl-apptl__row is-now"><span class="pl-apptl__time">Bugün</span><span class="pl-apptl__rail"><i></i></span><span class="pl-apptl__body"><b>Takip araması</b><small>14:00</small></span></li><li class="pl-apptl__row"><span class="pl-apptl__time">Çar</span><span class="pl-apptl__rail"><i></i></span><span class="pl-apptl__body"><b>Teklif sunumu</b><small>10:30</small></span></li></ol></div>
<div class="pl-panel pl-panel--xl" style="display:grid;justify-items:center;gap:6px"><div class="pl-panel__head" style="width:100%"><h3 class="pl-panel__title">Aday skoru</h3></div><div class="pl-scoregauge"><div class="pl-scoregauge__arc" style="--v:90"></div><span class="pl-scoregauge__val">90</span></div><span class="pl-badge pl-badge--success">A sınıfı</span></div></div></main></div>
```

### PLA-099

**Drone Yer İstasyonu** · `screen-drone-station`

- **Amaç:** Kokpit yüzey: sol ray, büyük kamera akışı ve sağda cihaz durumu; altta mini harita, telemetri, joystick ve pusula.
- **Ne zaman:** Drone/robot kontrolü, uzaktan kamera, saha cihazı yönetimi.
- **Desen kaynağı:** Pin 18 — drone kumanda uygulaması: kamera, durum, harita, joystick, pusula
- **Kapsayıcı:** `<div data-pl data-pl-surface="cockpit">`
- **Sınıflar:** `pl-screen + pl-rail + pl-camfeed + pl-range + pl-telemetry + pl-dpad + pl-compass`
- **Erişilebilirlik:** Kumanda düğmeleri klavye eşdeğerli; kritik pil uyarısı role="alert".

```html
<div class="pl-screen"><nav class="pl-rail" aria-label="Gezinme"><span class="pl-rail__logo">DR</span><button class="pl-rail__item is-active" aria-label="camera"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/></svg></button><button class="pl-rail__item" aria-label="image"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg></button><button class="pl-rail__item" aria-label="map-pin"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg></button><button class="pl-rail__item" aria-label="bell"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></button><span class="pl-rail__spacer"></span><button class="pl-rail__item" aria-label="settings"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button></nav>
<main class="pl-screen__main"><div class="pl-screen__grid" style="grid-template-columns:1.7fr 1fr"><div class="pl-camfeed"><div class="pl-camfeed__tl"><span class="pl-camfeed__rec">REC 00:12:48</span><span class="pl-chip pl-chip--ghost pl-chip--mono">4K · 30</span></div><div class="pl-camfeed__tr"><span class="pl-chip pl-chip--ghost pl-chip--mono"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg>GPS 18</span></div><div class="pl-camfeed__bl"><div class="pl-camfeed__hist"><i style="--v:89"></i><i style="--v:42"></i><i style="--v:55"></i><i style="--v:98"></i><i style="--v:93"></i><i style="--v:77"></i><i style="--v:13"></i><i style="--v:69"></i><i style="--v:41"></i><i style="--v:93"></i><i style="--v:16"></i><i style="--v:30"></i><i style="--v:24"></i><i style="--v:57"></i><i style="--v:70"></i><i style="--v:41"></i><i style="--v:58"></i><i style="--v:79"></i><i style="--v:23"></i><i style="--v:83"></i><i style="--v:41"></i><i style="--v:11"></i><i style="--v:37"></i><i style="--v:62"></i><i style="--v:45"></i><i style="--v:33"></i><i style="--v:59"></i><i style="--v:30"></i><i style="--v:19"></i><i style="--v:27"></i></div></div><div class="pl-camfeed__br"><span class="pl-chip pl-chip--ghost pl-chip--mono">ISO 100</span><span class="pl-chip pl-chip--ghost pl-chip--mono">1/240</span></div></div>
<div class="pl-panel pl-panel--xl pl-stack"><div class="pl-panel__head" style="margin:0"><h3 class="pl-panel__title">Hava Aracı Pro</h3><svg class="pl-ico pl-ico--24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="5" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><rect x="9" y="9" width="6" height="6" rx="1.5"/><path d="m7 7 2 2M17 7l-2 2M7 17l2-2M17 17l-2-2"/></svg></div><span class="pl-muted">Uçuşta · Manuel mod</span><div class="pl-range"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M6 11v2M10 11v2"/></svg><span class="pl-range__bar"><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class="is-on"></i><i class=""></i><i class=""></i></span><span>%76</span></div><div class="pl-kv"><dt>İrtifa limiti</dt><dd class="pl-num">210 m</dd><dt>Sinyal</dt><dd class="pl-num">-62 dBm</dd></div><div class="pl-row"><button class="pl-btn pl-btn--secondary pl-btn--sm"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>Eve dön</button><button class="pl-btn pl-btn--danger pl-btn--sm">İniş</button></div></div></div>
<div class="pl-screen__grid" style="grid-template-columns:1fr 1.2fr auto auto;align-items:center"><div class="pl-media pl-media--4" style="height:150px;border-radius:16px;position:relative"><span class="pl-hotspot" style="left:50%;top:60%"><span class="pl-hotspot__pin"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 19-9-9 19-2-8z"/></svg></span></span></div><div class="pl-telemetry"><div><small>Mesafe</small><b>20 m</b></div><div><small>İrtifa</small><b>121 m</b></div><div><small>Hız</small><b>10,4 m/s</b></div><div><small>Dikey</small><b>0,6 m/s</b></div><div><small>Çöz.</small><b>3840×2160</b></div><div><small>Süre</small><b>05:41</b></div></div>
<div class="pl-dpad"><button class="pl-dpad__u" aria-label="Yukarı"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg></button><button class="pl-dpad__d" aria-label="Aşağı"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><button class="pl-dpad__l" aria-label="Sol"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><button class="pl-dpad__r" aria-label="Sağ"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button><span class="pl-dpad__stick"></span></div>
<div class="pl-compass"><span class="pl-compass__needle"></span><div class="pl-compass__rose" style="--deg:280"><span style="rotate:0deg">K</span><span style="rotate:90deg">D</span><span style="rotate:180deg">G</span><span style="rotate:270deg">B</span></div><span class="pl-compass__val">280°<small>BKB</small></span></div></div></main></div>
```

### PLA-100

**Klinik Paneli** · `screen-clinic`

- **Amaç:** Soft yüzey: ikon rayı, koyu karşılama bandı, renkli istatistik kartları, alan grafiği ve sağda randevu zaman çizelgesi.
- **Ne zaman:** Klinik, salon, danışmanlık randevu yönetimi; hizmet işletmesi panoları.
- **Desen kaynağı:** Pin 26 — açık temalı klinik / randevu panosu
- **Kapsayıcı:** `<div data-pl data-pl-theme="light" data-pl-surface="soft">`
- **Sınıflar:** `pl-screen + pl-rail + pl-greet + pl-statcard + pl-areachart + pl-apptl`
- **Erişilebilirlik:** Grafik için tablo alternatifi; randevular <ol>.

```html
<div class="pl-screen"><nav class="pl-rail" aria-label="Gezinme"><span class="pl-rail__logo">PL</span><button class="pl-rail__item is-active" aria-label="grid"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg></button><button class="pl-rail__item" aria-label="users"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></button><button class="pl-rail__item" aria-label="calendar"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></button><button class="pl-rail__item" aria-label="message"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button><span class="pl-rail__spacer"></span><button class="pl-rail__item" aria-label="settings"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button></nav>
<main class="pl-screen__main"><header class="pl-greet"><div><h3 class="pl-greet__title">Günaydın, Muhammed</h3><div class="pl-greet__sub">Bugün 12 randevu var, ilki 09:00'da.</div></div><div class="pl-greet__chips"><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>01.11.2026</span><span><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>09:00–18:00</span></div></header>
<div class="pl-screen__grid" style="grid-template-columns:repeat(4,1fr)"><div class="pl-statcard" style="--c:var(--pl-viz-7)"><span class="pl-statcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span><span class="pl-statcard__lbl">Bugün</span><span class="pl-statcard__val">12<small style="color:var(--pl-success)">+%8</small></span></div><div class="pl-statcard" style="--c:var(--pl-viz-1)"><span class="pl-statcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span><span class="pl-statcard__lbl">Toplam</span><span class="pl-statcard__val">120<small style="color:var(--pl-success)">+%3</small></span></div><div class="pl-statcard is-hot" style="--c:var(--pl-viz-3)"><span class="pl-statcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg></span><span class="pl-statcard__lbl">İptal</span><span class="pl-statcard__val">2<small style="color:var(--pl-danger)">-%2</small></span></div><div class="pl-statcard" style="--c:var(--pl-viz-5)"><span class="pl-statcard__ic"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span><span class="pl-statcard__lbl">Tamamlanan</span><span class="pl-statcard__val">4<small style="color:var(--pl-success)">+1</small></span></div></div>
<div class="pl-panel pl-panel--xl"><div class="pl-panel__head"><h3 class="pl-panel__title">Gelir</h3><span class="pl-chip pl-chip--mono">1.250 ₺ · Haz</span></div><div class="pl-areachart" style="color:var(--pl-accent)"><svg viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="pl-area-grad-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".28"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path d="M0.0,116.0 C13.65,116.0 13.65,89.1 27.3,89.1 C40.9,89.1 40.9,98.1 54.5,98.1 C68.15,98.1 68.15,60.0 81.8,60.0 C95.44999999999999,60.0 95.44999999999999,75.7 109.1,75.7 C122.75,75.7 122.75,44.3 136.4,44.3 C150.0,44.3 150.0,4.0 163.6,4.0 C177.25,4.0 177.25,53.3 190.9,53.3 C204.55,53.3 204.55,35.4 218.2,35.4 C231.85,35.4 231.85,66.7 245.5,66.7 C259.1,66.7 259.1,26.4 272.7,26.4 C286.35,26.4 286.35,39.8 300.0,39.8 L300,120 L0,120 Z" fill="url(#pl-area-grad-c)"/><path class="a-line" d="M0.0,116.0 C13.65,116.0 13.65,89.1 27.3,89.1 C40.9,89.1 40.9,98.1 54.5,98.1 C68.15,98.1 68.15,60.0 81.8,60.0 C95.44999999999999,60.0 95.44999999999999,75.7 109.1,75.7 C122.75,75.7 122.75,44.3 136.4,44.3 C150.0,44.3 150.0,4.0 163.6,4.0 C177.25,4.0 177.25,53.3 190.9,53.3 C204.55,53.3 204.55,35.4 218.2,35.4 C231.85,35.4 231.85,66.7 245.5,66.7 C259.1,66.7 259.1,26.4 272.7,26.4 C286.35,26.4 286.35,39.8 300.0,39.8"/></svg><div class="pl-areachart__x"><span>Oca</span><span>Şub</span><span>Mar</span><span>Nis</span><span>May</span><span>Haz</span><span>Tem</span><span>Ağu</span><span>Eyl</span><span>Eki</span><span>Kas</span><span>Ara</span></div></div></div></main>
<aside class="pl-screen__aside"><div class="pl-panel pl-panel--xl"><div class="pl-panel__head"><h3 class="pl-panel__title">Yaklaşan randevular</h3><a class="pl-link" href="#">Yeni</a></div><ol class="pl-apptl" style="margin:0;padding:0;list-style:none"><li class="pl-apptl__row"><span class="pl-apptl__time">09:00</span><span class="pl-apptl__rail"><i></i></span><span class="pl-apptl__body"><b>Kontrol</b><small>Ayşe K.</small></span></li><li class="pl-apptl__row is-now"><span class="pl-apptl__time">10:00</span><span class="pl-apptl__rail"><i></i></span><span class="pl-apptl__body"><b>Diş temizliği</b><small>Mert A.</small><span class="pl-apptl__card"><span class="pl-row" style="justify-content:space-between"><b style="font-size:12px">Mert A.</b><span class="pl-badge pl-badge--success">Onaylı</span></span><small>10:00–10:45 · Oda 2</small></span></span></li><li class="pl-apptl__row"><span class="pl-apptl__time">11:00</span><span class="pl-apptl__rail"><i></i></span><span class="pl-apptl__body"><b>Kanal tedavisi</b><small>Selin T.</small></span></li><li class="pl-apptl__row"><span class="pl-apptl__time">13:30</span><span class="pl-apptl__rail"><i></i></span><span class="pl-apptl__body"><b>Dolgu</b><small>Can Y.</small></span></li></ol></div></aside></div>
```

### PLA-101

**Takvim & Ekip Planlayıcı** · `screen-team-planner` · Ürün: Mind Palace (`data-pl-product="mindpalace"`)

- **Amaç:** Proje kenar çubuğu + ay başlığı ve gün şeridi + sütunlu ekip takvimi + sağda seçili etkinlik çekmecesi.
- **Ne zaman:** Görev/proje/ekip planlama uygulamaları (Mind Palace, Flow Dock).
- **Desen kaynağı:** Pin 11 — koyu takvim planlayıcı: proje kenar çubuğu, gün şeridi, ekip sütunları, sağ ayrıntı paneli
- **Sınıflar:** `pl-screen + pl-projnav + pl-daystrip + pl-board + pl-evt + pl-drawer`
- **Erişilebilirlik:** Takvim role="grid"; çekmece role="dialog" aria-modal="false".

```html
<div class="pl-screen" style="background:var(--pl-grad-sunset);padding:16px;gap:14px;border:0"><nav class="pl-projnav" aria-label="Projeler"><div class="pl-row" style="padding:4px 8px 10px"><span class="pl-applogo pl-applogo--sm">MP</span><b style="color:var(--pl-fg-1)">Mind Palace</b></div><a class="pl-projnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>Genel bakış</a><a class="pl-projnav__item" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>Analiz</a><a class="pl-projnav__item is-active" href="#"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>Ekip<span class="pl-projnav__count">8</span></a><div class="pl-projnav__sec"><span class="pl-label">Projeler</span></div><a class="pl-projnav__item" href="#"><span class="pl-projnav__ic" style="--c:var(--pl-viz-6)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></span>Mutfak<span class="pl-projnav__count">12</span></a><a class="pl-projnav__item" href="#"><span class="pl-projnav__ic" style="--c:var(--pl-viz-2)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg></span>Leo Helper<span class="pl-projnav__count">4</span></a><div class="pl-projnav__user"><span class="pl-avatar pl-avatar--accent">MI</span><b style="color:var(--pl-fg-1);font-size:13px">Muhammed</b></div></nav>
<main class="pl-screen__main" style="background:var(--pl-bg-1);border-radius:var(--pl-radius-xl);border:1px solid var(--pl-line)"><div class="pl-screen__top"><h3 class="pl-screen__title">Kasım 2026</h3><span class="pl-chip">Bugün</span><span style="flex:1"></span><div class="pl-segment"><button>Gün</button><button class="is-active">Hafta</button><button>Ay</button></div></div>
<div class="pl-daystrip"><button class="">Pzt<b>15</b></button><button class="">Sal<b>16</b></button><button class=" is-today">Çar<b>17</b></button><button class="">Per<b>18</b></button><button class="is-active">Cum<b>19</b></button><button class="">Cmt<b>20</b></button><button class="">Paz<b>21</b></button></div>
<div class="pl-board" style="--cols:3"><div></div><div class="pl-board__colhead">Tasarım <small>4</small></div><div class="pl-board__colhead">Geliştirme <small>6</small></div><div class="pl-board__colhead">Yayın <small>2</small></div><div class="pl-board__time">09:00</div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-6)"><b>Ekip toplantısı</b>09:00–10:00</div></div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-1);--h:2"><b>Komut paleti sprinti</b>09:00–11:00</div></div><div class="pl-board__cell"></div><div class="pl-board__time">10:00</div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-3)"><b>Logo revizyonu</b>10:00</div></div><div class="pl-board__cell"></div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-5)"><b>v2.0 yayını</b>10:30</div></div></div></main>
<aside class="pl-drawer" style="position:static;width:260px;border-radius:var(--pl-radius-xl);height:auto" aria-label="Etkinlik"><div class="pl-drawer__head"><b style="color:var(--pl-fg-1)">Komut paleti sprinti</b><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kapat"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div><div class="pl-drawer__body pl-stack"><span class="pl-muted">19.11.2026 · 09:00–11:00</span><div class="pl-avatars"><span class="pl-avatar">MI</span><span class="pl-avatar">YA</span><span class="pl-avatar">ÜS</span></div><label class="pl-check"><input type="checkbox" checked>Klavye gezinmesi</label><label class="pl-check"><input type="checkbox">Arama sıralaması</label></div><div class="pl-drawer__foot"><button class="pl-btn pl-btn--primary pl-btn--sm">Katıl</button></div></aside></div>
```

### PLA-102

**Kat Planı Navigatörü** · `screen-floor-navigator`

- **Amaç:** Gradyan zemin üzerinde cam yüzeyli pencere: ikon rayı, izometrik kat ve sıcak noktalar, saat/hava widget'ı, rota düğmesi ve sağda kat seçici paneli.
- **Ne zaman:** Ofis/tesis rota bulma, oda rezervasyonu, ziyaretçi kiosku.
- **Desen kaynağı:** Pin 15 — cam panelli ofis kat planı ve rota bulma
- **Kapsayıcı:** `<div data-pl data-pl-surface="glass">`
- **Sınıflar:** `pl-screen--backdrop + pl-window + pl-rail + pl-isoplan + pl-hotspot + pl-weather + pl-floorpanel`
- **Erişilebilirlik:** Harita alternatifi: oda listesi + 'Rota oluştur' düğmesi.

```html
<div class="pl-screen pl-screen--backdrop" style="background:var(--pl-grad-ocean)"><div class="pl-window pl-glass" style="flex-direction:row;border-radius:var(--pl-radius-3xl)"><nav class="pl-rail" style="background:transparent" aria-label="Gezinme"><span class="pl-rail__logo">PL</span><button class="pl-rail__item" aria-label="Pano"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg></button><button class="pl-rail__item is-active" aria-label="Harita"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg></button><button class="pl-rail__item" aria-label="Ayarlar"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button><span class="pl-rail__spacer"></span><button class="pl-rail__item" aria-label="Tema"><svg class="pl-ico pl-ico--20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg></button></nav>
<div class="pl-screen__main" style="position:relative"><div class="pl-screen__top"><div class="pl-weather pl-glass" style="padding:8px"><div class="pl-weather__time"><span class="pl-weather__day" style="font-size:14px">Pazar</span><span class="pl-weather__clock" style="font-size:24px">20:25</span></div><div class="pl-weather__temp" style="width:72px"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg><b style="font-size:18px">18°</b></div></div><span style="flex:1"></span><button class="pl-btn pl-btn--primary"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 19-9-9 19-2-8z"/></svg>Rota oluştur</button></div>
<div class="pl-isoplan" style="height:320px;background:transparent"><div class="pl-isoplan__floor"><span class="pl-isoplan__room pl-isoplan__room--wide" style="--c:var(--pl-viz-4)"></span><span class="pl-isoplan__room is-active" style="--c:var(--pl-viz-5)"></span><span class="pl-isoplan__room" style="--c:var(--pl-viz-3)"></span><span class="pl-isoplan__room" style="--c:var(--pl-viz-6)"></span><span class="pl-isoplan__room" style="--c:var(--pl-viz-2)"></span></div><span class="pl-hotspot is-pulse" style="left:56%;top:42%"><span class="pl-hotspot__pin" style="--c:var(--pl-viz-5)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span><span class="pl-hotspot__label">Toplantı salonu</span></span><span class="pl-hotspot" style="left:36%;top:60%"><span class="pl-hotspot__pin" style="--c:var(--pl-viz-3)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span></span></div></div>
<div class="pl-screen__aside"><div class="pl-floorpanel pl-glass"><div class="pl-floorpanel__head"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>Kat</div><select class="pl-select"><option>1. kat</option></select><div class="pl-floorpanel__list"><div class="pl-roomrow"><span class="pl-roomrow__ic" style="--c:var(--pl-viz-4)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>Eğitim odası<span class="pl-roomrow__n">3</span></div><div class="pl-roomrow is-active"><span class="pl-roomrow__ic" style="--c:var(--pl-viz-5)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>Toplantı salonu<span class="pl-roomrow__n">Rota</span></div><div class="pl-roomrow"><span class="pl-roomrow__ic" style="--c:var(--pl-viz-3)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span>Yönetim<span class="pl-roomrow__n">8</span></div><div class="pl-roomrow"><span class="pl-roomrow__ic" style="--c:var(--pl-viz-6)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/></svg></span>Ar-Ge<span class="pl-roomrow__n">5</span></div><div class="pl-roomrow"><span class="pl-roomrow__ic" style="--c:var(--pl-viz-2)"><svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg></span>Mutfak<span class="pl-roomrow__n">2</span></div></div></div></div></div></div>
```
