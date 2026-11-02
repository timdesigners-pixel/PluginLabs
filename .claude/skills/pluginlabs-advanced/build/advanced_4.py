"""PLA — I. Mobilite & Cihaz · J. Sağlık, Yaşam & Ticaret"""
from advanced import add, I, poly, smooth, area, bars

# =====================================================================
#  I. MOBİLİTE & CİHAZ
# =====================================================================
K = "Mobilite & Cihaz"
add(slug="instrument-cluster", ad="Gösterge Kümesi", kategori=K, yuzey="cockpit", span=2,
    kaynak="Pinler 30, 35, 41 — HMI dijital gösterge paneli (hız / batarya kadranları)",
    aciklama="İki çentikli kadran (hız ve şarj), ortada perspektifli yol şeridi, yön tarifi ve sürüş istatistikleri.",
    ne_zaman="Araç/filo (RENTAKAR) telemetri ekranı, sürüş simülasyonu, cihaz performans paneli.",
    durumlar=["sürüş", "park (P)", "düşük şarj (sağ kadran amber)"],
    siniflar="pl-cluster pl-dial pl-dial--right (--v) pl-dial__val pl-cluster__center pl-cluster__road pl-cluster__stats",
    a11y="Kadranlar role=\"meter\"; hız değeri aria-live değildir (sürekli değişir), istenince okunur.",
    html=f'''<div class="pl-cluster"><div class="pl-dial" role="meter" aria-valuenow="79" aria-label="Hız km/s" style="--v:44"><div class="pl-dial__val"><b>79</b><small>KM/S</small></div></div>
<div class="pl-cluster__center"><span class="pl-num pl-muted">13:29 · 21°</span><div class="pl-turn" style="padding:0">{I("arrow-up-right", 24)}<div><div class="pl-turn__dist" style="font-size:24px">750 <small>m</small></div><div class="pl-turn__road">Anadolu Cd. sağa</div></div></div><div class="pl-cluster__road" aria-hidden="true"></div><div class="pl-cluster__stats"><span>{I("nav")}4,1 km</span><span>{I("clock")}22 dk</span></div><span class="pl-gear"><span>P</span><span>R</span><span>N</span><span class="is-active">D</span></span></div>
<div class="pl-dial pl-dial--right" role="meter" aria-valuenow="68" aria-label="Şarj yüzde" style="--v:68"><div class="pl-dial__val"><b>%68</b><small>412 KM</small></div></div></div>''')

add(slug="gear-selector", ad="Vites Seçici", kategori=K, yuzey="cockpit",
    kaynak="Pinler 32, 35 — 'READY P R N D' göstergesi",
    aciklama="P/R/N/D kapsülü; etkin vites aksan dolgulu ve ışıyan.",
    ne_zaman="Araç HMI, mod seçimi (taslak/inceleme/yayın) gibi sıralı durumlar.",
    siniflar="pl-gear > span.is-active",
    a11y="role=\"radiogroup\" ya da salt gösterge ise aria-label=\"Vites: D\".",
    html='''<div class="pl-row" style="gap:12px"><span class="pl-gear" aria-label="Vites: D"><span>P</span><span>R</span><span>N</span><span class="is-active">D</span></span><span class="pl-chip pl-chip--accent pl-chip--mono">HAZIR</span></div>''')

add(slug="turn-card", ad="Yön Tarifi Kartı", kategori=K, yuzey="glass",
    kaynak="Pinler 30, 35, 41 — '20 m Enter Road' dönüş bilgisi",
    aciklama="Dönüş oku, büyük mesafe ve yol adı; cam zemin.",
    ne_zaman="Navigasyon, yönlendirmeli süreç adımı (\"Sonraki: …\").",
    siniflar="pl-turn pl-glass pl-turn__ic pl-turn__dist pl-turn__road",
    a11y="Mesafe değişince yalnız eşiklerde duyurulur (200 m, 50 m).",
    html=f'''<div style="background:var(--pl-media-6);padding:16px;border-radius:18px;width:max-content"><div class="pl-turn pl-glass"><span class="pl-turn__ic">{I("arrow-up-right")}</span><div><div class="pl-turn__dist">20 <small>m</small></div><div class="pl-turn__road">Çevre yoluna gir</div></div></div></div>''')

add(slug="range-bar", ad="Menzil / Batarya Çubuğu", kategori=K, yuzey="cockpit",
    kaynak="Pin 35 — alt köşede '600 km' segmentli batarya",
    aciklama="İkon + segmentli dolum + mono menzil; düşük seviyede amber.",
    ne_zaman="Batarya, depolama, kota, kalan süre.",
    durumlar=["normal", "düşük (is-low)"],
    siniflar="pl-range is-low pl-range__bar > i.is-on",
    a11y="role=\"meter\" + aria-valuetext=\"600 km, yüzde 80\".",
    html=f'''<div class="pl-stack" style="gap:10px"><div class="pl-range" role="meter" aria-valuenow="80" aria-valuetext="600 km, yüzde 80">{I("battery")}<span class="pl-range__bar">{"".join(f'<i class="{"is-on" if i<8 else ""}"></i>' for i in range(10))}</span><span>600 km</span></div><div class="pl-range is-low" role="meter" aria-valuenow="20" aria-valuetext="86 km, yüzde 20">{I("battery")}<span class="pl-range__bar">{"".join(f'<i class="{"is-on" if i<2 else ""}"></i>' for i in range(10))}</span><span>86 km</span></div></div>''')

add(slug="compass-dial", ad="Pusula Kadranı", kategori=K, yuzey="cockpit",
    kaynak="Pin 18 — drone kumandasında '280°' pusula",
    aciklama="Derece çentikli halka, dönen yön harfleri (--deg), üst işaretçi ve ortada derece.",
    ne_zaman="Drone/araç yönü, harita yönelimi, rüzgâr yönü.",
    siniflar="pl-compass pl-compass__rose (--deg) pl-compass__needle pl-compass__val",
    a11y="role=\"img\" aria-label=\"Yön 280 derece, batı-kuzeybatı\".",
    html='''<div class="pl-compass" role="img" aria-label="Yön 280 derece"><span class="pl-compass__needle" aria-hidden="true"></span><div class="pl-compass__rose" style="--deg:280" aria-hidden="true"><span style="rotate:0deg">K</span><span style="rotate:90deg">D</span><span style="rotate:180deg">G</span><span style="rotate:270deg">B</span></div><span class="pl-compass__val">280°<small>BKB</small></span></div>''')

add(slug="dpad", ad="Kumanda Yön Pedi", kategori=K, yuzey="cockpit",
    kaynak="Pin 18 — drone kontrol joystick'i",
    aciklama="Dairesel taban, dört yön düğmesi ve ortada kabartmalı çubuk.",
    ne_zaman="Uzaktan kumanda, kamera PTZ, oyun/simülasyon kontrolü.",
    siniflar="pl-dpad pl-dpad__u|d|l|r pl-dpad__stick",
    a11y="Yön düğmeleri aria-label; ok tuşları eşdeğerdir.",
    html=f'''<div class="pl-dpad"><button class="pl-dpad__u" aria-label="Yukarı">{I("chevron-up")}</button><button class="pl-dpad__d" aria-label="Aşağı">{I("chevron-down")}</button><button class="pl-dpad__l" aria-label="Sol">{I("chevron-left")}</button><button class="pl-dpad__r" aria-label="Sağ">{I("chevron-right")}</button><span class="pl-dpad__stick" aria-hidden="true"></span></div>''')

add(slug="camera-feed", ad="Kamera Akışı HUD", kategori=K, span=2,
    kaynak="Pin 18 — drone kamera görüntüsü üzerinde REC, histogram, mod bilgisi",
    aciklama="16:9 akış; köşelerde REC, çözünürlük, histogram, pozlama değerleri ve merkezde nişangâh.",
    ne_zaman="Canlı kamera, güvenlik kamerası, ekran kaydı önizlemesi.",
    durumlar=["canlı", "kayıt", "sinyal zayıf"],
    siniflar="pl-camfeed pl-camfeed__tl|tr|bl|br pl-camfeed__rec pl-camfeed__hist",
    a11y="<video> için altyazı/açıklama; HUD değerleri ayrıca metin listesinde.",
    html=f'''<div class="pl-camfeed"><div class="pl-camfeed__tl"><span class="pl-camfeed__rec">REC 00:12:48</span><span class="pl-chip pl-chip--ghost pl-chip--mono">4K · 30</span></div><div class="pl-camfeed__tr"><span class="pl-chip pl-chip--ghost pl-chip--mono">{I("battery")}%76</span><span class="pl-chip pl-chip--ghost pl-chip--mono">{I("signal")}GPS 18</span></div><div class="pl-camfeed__bl"><div class="pl-camfeed__hist" aria-hidden="true">{"".join(f'<i style="--v:{v}"></i>' for v in bars(5, 30, 10, 100))}</div></div><div class="pl-camfeed__br"><span class="pl-chip pl-chip--ghost pl-chip--mono">ISO 100</span><span class="pl-chip pl-chip--ghost pl-chip--mono">1/240</span><span class="pl-chip pl-chip--ghost pl-chip--mono">EV 0</span></div></div>''')

add(slug="telemetry-grid", ad="Telemetri Izgarası", kategori=K, yuzey="cockpit",
    kaynak="Pin 18 — mesafe / irtifa / hız / çözünürlük değer ızgarası",
    aciklama="1px ayraçlı 3 sütunlu değer ızgarası; mono büyük harf etiketler.",
    ne_zaman="Cihaz telemetrisi, teknik özet, sistem bilgisi.",
    siniflar="pl-telemetry",
    a11y="<dl> yapısına dönüştürülebilir.",
    html='''<div class="pl-telemetry"><div><small>Mesafe</small><b>20 m</b></div><div><small>İrtifa</small><b>121 m</b></div><div><small>Hız</small><b>10,4 m/s</b></div><div><small>Dikey</small><b>0,6 m/s</b></div><div><small>Çözünürlük</small><b>3840×2160</b></div><div><small>Süre</small><b>05:41</b></div></div>''')

# =====================================================================
#  J. SAĞLIK, YAŞAM & TİCARET
# =====================================================================
K = "Sağlık, Yaşam & Ticaret"
add(slug="vital-card", ad="Büyük Yaşamsal Değer Kartı", kategori=K,
    kaynak="Pin 9 — 'Average rate 92 bpm' kartı",
    aciklama="Çok büyük değer + birim, başlık ve küçük çizgi grafik.",
    ne_zaman="Tek ana sağlık/performans değeri (nabız, puan, gecikme).",
    siniflar="pl-vital pl-vital__val pl-spark",
    a11y="Değer ve birim tek okuma (\"92 vuru/dk\").",
    html=f'''<div class="pl-vital"><div class="pl-row" style="justify-content:space-between"><span class="pl-label">Ortalama nabız</span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Diğer">{I("more")}</button></div><svg class="pl-spark" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><path class="is-area" d="{area([40,42,41,44,43,70,30,45,44,46,45,47],300,60)}"/><path d="{smooth([40,42,41,44,43,70,30,45,44,46,45,47],300,60)}"/></svg><div class="pl-vital__val">92 <small>vuru/dk</small></div></div>''')

add(slug="activity-tile", ad="Aktivite Karosu", kategori=K,
    kaynak="Pin 33 — 'Bicycle Drill · Jogging Hero' taşan ikonlu kartlar",
    aciklama="Üst kenardan taşan aksan ikon karosu, ad, hedef, ilerleme çubuğu ve tarih etiketi.",
    ne_zaman="Hedef/alışkanlık, kurs modülü, görev kartları ızgarası.",
    siniflar="pl-activity pl-activity__ic pl-activity__foot pl-progress",
    a11y="İlerleme \"%45, 4 haftalık hedefin 2 haftası\".",
    html=f'''<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">{"".join(f'<div class="pl-activity"><span class="pl-activity__ic">{I(ic)}</span><b>{t}</b><small>{s}</small><div class="pl-activity__foot"><span>İlerleme</span><span class="pl-num">%{v}</span></div><div class="pl-progress"><span style="--pl-val:{v}%"></span></div><span class="pl-badge pl-badge--danger">{d}</span></div>' for ic,t,s,v,d in [("bike","Bisiklet","36 km / hafta",45,"17.11.2026"),("activity","Koşu","12 km / hafta",72,"20.11.2026")])}</div>''')

add(slug="overview-chart", ad="Aksan Dolgulu Genel Bakış Kartı", kategori=K, span=2,
    kaynak="Pin 33 — mor 'Overview' grafik kartı ve alt istatistik üçlüsü",
    aciklama="Tamamen aksan zeminli kart: başlık, dönem seçici, alan grafiği, vurgulu nokta ve 3'lü istatistik kutuları.",
    ne_zaman="Panonun ana grafiği; ekranda tek.",
    siniflar="pl-overview .o-line .o-area .o-grid pl-overview__stats div.is-hi",
    a11y="Aksan zeminde metin --pl-fg-on-accent; grafik özeti aria-label.",
    html=(lambda v: f'''<div class="pl-overview"><div class="pl-row" style="justify-content:space-between"><b style="font-size:16px">Genel bakış</b><select class="pl-select" style="width:120px;height:28px"><option>Aylık</option><option>Haftalık</option></select></div><svg viewBox="0 0 300 90" preserveAspectRatio="none" role="img" aria-label="Aylık adım, en yüksek Haziran 9.178">{"".join(f'<line class="o-grid" x1="0" x2="300" y1="{y}" y2="{y}"/>' for y in (15,45,75))}<path class="o-area" d="{area(v,300,90)}"/><path class="o-line" d="{smooth(v,300,90)}"/></svg><div class="pl-overview__stats"><div><b>748 s</b><small>Nisan</small></div><div class="is-hi"><b>9.178</b><small>Adım · Haz</small></div><div><b>9.200</b><small>Adım · Tem</small></div></div></div>''')([30,45,40,60,52,85,48,62,58,70]))

add(slug="people-list", ad="Arkadaş / Kişi Listesi", kategori=K,
    kaynak="Pin 33 — 'Friends' listesi ve eylem ikonları",
    aciklama="Avatar + ad + son etkinlik + sağda eylem ikonu.",
    ne_zaman="Arkadaşlar, ekip üyeleri, paylaşım listesi.",
    siniflar="pl-people pl-people__row",
    a11y="<ul>; eylem düğmesi kişinin adını içerir (\"Yalçın'a mesaj\").",
    html=f'''<ul class="pl-people" style="margin:0;padding:0;list-style:none">{"".join(f'<li class="pl-people__row"><span class="pl-avatar{" is-online" if o else ""}">{i}</span><span><b>{n}</b><small>{s}</small></span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="{n} kişisine mesaj">{I("message")}</button></li>' for i,n,s,o in [("YA","Yalçın","Bisiklet · 2 sa önce",True),("İL","İlhan","Koşu · dün",False),("SA","Savaş","Yürüyüş · 3 gün önce",True)])}</ul>''')

add(slug="globe-stats", ad="Küre İstatistik Paneli", kategori=K, span=2,
    kaynak="Pin 34 — 'General statistics 7,541,390' altıgen noktalı küre",
    aciklama="Büyük toplam, ülke/bölge dağılım listesi ve noktalı kıtalı ışıyan küre.",
    ne_zaman="Coğrafi kullanıcı dağılımı, global erişim panosu.",
    siniflar="pl-globe pl-countries (--c)",
    a11y="Küre dekoratif; veri pl-countries listesinde.",
    html='''<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:center"><div class="pl-stack"><span class="pl-label">Tüm kullanıcılar</span><span class="pl-display pl-display--lg">7.541.390</span><div class="pl-progress pl-progress--sm"><span style="--pl-val:64%;background:var(--pl-grad-sunset)"></span></div><div class="pl-countries"><div><i style="--c:var(--pl-viz-1)"></i>Türkiye<b>4.502.110</b><small>%59</small></div><div><i style="--c:var(--pl-viz-2)"></i>Almanya<b>1.302.400</b><small>%17</small></div><div><i style="--c:var(--pl-viz-3)"></i>Hollanda<b>904.950</b><small>%12</small></div><div><i style="--c:var(--pl-viz-4)"></i>Diğer<b>831.930</b><small>%11</small></div></div></div><div class="pl-globe" aria-hidden="true"></div></div>''')

add(slug="category-chips", ad="Kategori İkon Çipleri", kategori=K,
    kaynak="Pin 23 — 'All · Burgers · Pizza · Salads…' yuvarlak kategori çipleri",
    aciklama="Dikey hap biçimli çip: daire ikon + etiket; seçili çip aksan dolgulu ve ışıyan.",
    ne_zaman="Kategori filtreleri (tarif, ürün, şablon).",
    siniflar="pl-catchips pl-catchip is-active pl-catchip__ic",
    a11y="role=\"radiogroup\" + aria-checked.",
    html=f'''<div class="pl-catchips" role="radiogroup" aria-label="Kategoriler">{"".join(f'<button class="pl-catchip{" is-active" if a else ""}" role="radio" aria-checked="{str(a).lower()}"><span class="pl-catchip__ic">{I(ic,20)}</span>{n}</button>' for ic,n,a in [("grid","Tümü",True),("utensils","Ana yemek",False),("flame","Izgara",False),("droplet","Çorba",False),("heart","Tatlı",False)])}</div>''')

add(slug="dish-card", ad="Ürün Vitrin Kartı", kategori=K, urun="mutfak",
    kaynak="Pin 23 — taşan yuvarlak ürün görselli yemek kartları",
    aciklama="Üstten taşan yuvarlak görsel, ad, açıklama, fiyat ve yuvarlak ekle düğmesi; seçili kart aksan çerçeveli.",
    ne_zaman="Menü, tarif, ürün vitrini (Mutfak Atölyesi).",
    durumlar=["varsayılan", "seçili / sepette", "tükendi (devre dışı)"],
    siniflar="pl-dish is-selected pl-dish__img pl-dish__foot pl-dish__price pl-dish__add",
    a11y="Ekle düğmesi aria-label=\"Mercimek çorbasını sepete ekle\".",
    html=f'''<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><article class="pl-dish"><span class="pl-dish__img"></span><b>İzmir köfte</b><small>Fırında patates, domates</small><div class="pl-dish__foot"><span class="pl-dish__price">285 ₺</span><button class="pl-dish__add" aria-label="İzmir köfteyi ekle">{I("plus")}</button></div></article><article class="pl-dish is-selected"><span class="pl-dish__img" style="background:var(--pl-media-4)"></span><b>Mevsim salata</b><small>Nar ekşili</small><div class="pl-dish__foot"><span class="pl-dish__price">160 ₺</span><button class="pl-dish__add" aria-label="Sepette">{I("check")}</button></div></article></div>''')

add(slug="order-summary", ad="Sipariş Özeti", kategori=K, urun="mutfak",
    kaynak="Pin 23 — 'My Order' sepet ve ara toplam",
    aciklama="Ürün satırları (görsel, ad, adet), ara toplam/teslimat/toplam ve birincil CTA.",
    ne_zaman="Sepet, sipariş onayı, fatura özeti.",
    siniflar="pl-order pl-order__row pl-order__img pl-order__sum is-total",
    a11y="Toplam aria-live; adet değişimi duyurulur.",
    html='''<div class="pl-order"><div class="pl-order__row"><span class="pl-order__img"></span><span><b>İzmir köfte</b><small>×1</small></span><b class="pl-num">285 ₺</b></div><div class="pl-order__row"><span class="pl-order__img" style="background:var(--pl-media-4)"></span><span><b>Mevsim salata</b><small>×2</small></span><b class="pl-num">320 ₺</b></div><div class="pl-order__sum"><div>Ara toplam<b>605 ₺</b></div><div>Teslimat<b>0 ₺</b></div><div class="is-total">Toplam<b aria-live="polite">605 ₺</b></div></div><button class="pl-btn pl-btn--primary pl-btn--block pl-btn--lg">Siparişi ver</button></div>''')

add(slug="offer-card", ad="İndirim Kartı", kategori=K,
    kaynak="Pin 23 — '-50% off' köşe promosyon kartı",
    aciklama="Gradyan zeminli küçük kampanya kartı; büyük yüzde ve kısa açıklama.",
    ne_zaman="Kenar çubuğu promosyonu, kupon.",
    siniflar="pl-offer",
    a11y="Kampanya koşulları bağlantıyla.",
    html='''<div class="pl-offer" style="max-width:220px"><b>-%50</b><small>İlk siparişte tüm tatlılarda</small></div>''')

add(slug="blob-ring", ad="Oyun İstatistik Halkası", kategori=K,
    kaynak="Pin 44 — '12,340h' organik gradyan halka",
    aciklama="Yavaşça biçim değiştiren konik gradyan halka; ortada toplam değer.",
    ne_zaman="Toplam kullanım süresi, kişisel rekor, yıl özeti.",
    siniflar="pl-blobring pl-blobring__val",
    a11y="Animasyon azaltılmış harekette durur; değer metin.",
    html='''<div class="pl-blobring"><div class="pl-blobring__val"><small>Toplam süre</small><b>12.340 s</b></div></div>''')

add(slug="social-profile", ad="Sosyal Profil Kartı", kategori=K,
    kaynak="Pin 38 — kapak görselli, istatistikli profil kartı",
    aciklama="Kapak, taşan avatar, ad, 3'lü istatistik ve takip/mesaj düğmeleri.",
    ne_zaman="Topluluk profili, ekip üyesi kartı, yazar kutusu.",
    siniflar="pl-profile pl-profile__cover pl-profile__avatar pl-profile__body pl-profile__name pl-profile__stats",
    a11y="Avatar alt metni ad; istatistikler <dl>.",
    html='''<article class="pl-profile" style="max-width:260px"><div class="pl-profile__cover"></div><div class="pl-profile__avatar">MI</div><div class="pl-profile__body"><div><div class="pl-profile__name">Muhammed</div><span class="pl-muted">TİMDESİGNERS · İzmir</span></div><div class="pl-profile__stats"><div><b>23,5B</b><small>Takipçi</small></div><div><b>1.060</b><small>Takip</small></div><div><b>148</b><small>Proje</small></div></div><div class="pl-row" style="justify-content:center"><button class="pl-btn pl-btn--primary pl-btn--sm">Takip et</button><button class="pl-btn pl-btn--secondary pl-btn--sm">Mesaj</button></div></div></article>''')

add(slug="research-gantt", ad="Araştırma Gantt Şeridi", kategori=K, span=2,
    kaynak="Pin 9 — 'Researches' zaman çizelgesi hapları",
    aciklama="Sütun çizgili zaman ızgarası üzerinde hap biçimli süre çubukları; ikincil çubuklar yumuşak.",
    ne_zaman="Araştırma/proje zaman planı, yol haritası özeti.",
    siniflar="pl-gantt (--n) pl-gantt__head pl-gantt__row pl-gantt__bar pl-gantt__bar--soft (--x, --w, --c)",
    a11y="Her çubuk aria-label ile başlangıç–bitiş tarihini okur.",
    html='''<div class="pl-gantt" style="--n:6"><div class="pl-gantt__head"><span>Haz</span><span>Tem</span><span>Ağu</span><span>Eyl</span><span>Eki</span><span>Kas</span></div><div class="pl-gantt__row"><span class="pl-gantt__bar" style="--x:8%;--w:46%" aria-label="Kapsam analizi, Haziran–Ağustos">Kapsam analizi</span></div><div class="pl-gantt__row"><span class="pl-gantt__bar pl-gantt__bar--soft" style="--x:38%;--w:40%">Kullanıcı testleri</span></div><div class="pl-gantt__row"><span class="pl-gantt__bar" style="--x:62%;--w:34%;--c:var(--pl-viz-5)">Yayın</span></div></div>''')
