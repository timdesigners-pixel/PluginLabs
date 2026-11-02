"""PLA — D. Akıllı Ev & IoT · E. HUD & Endüstri"""
from advanced import add, I, poly, smooth, area, ecg, bars

# =====================================================================
#  D. AKILLI EV & IoT
# =====================================================================
K = "Akıllı Ev & IoT"
add(slug="device-tile", ad="Cihaz Anahtar Karosu", kategori=K,
    kaynak="Pin 6 — Smart TV / Lighting / Vacuum cleaner satırları",
    aciklama="İkon karosu + cihaz adı + durum alt metni + anahtar. Açıkken aksan ışıması; isteğe bağlı seviye ölçeği.",
    ne_zaman="Akıllı ev, eklenti/servis açma-kapama, özellik bayrakları.",
    durumlar=["kapalı", "açık", "bağlantı yok (devre dışı)", "seviye ölçekli"],
    siniflar="pl-devtile is-on pl-devtile__ic pl-devtile__name pl-devtile__sub pl-devtile__meter pl-switch",
    a11y="Anahtar <input type=\"checkbox\" role=\"switch\">; etiket cihaz adıdır.",
    html=f'''<div class="pl-stack" style="gap:8px"><label class="pl-devtile is-on"><span class="pl-devtile__ic">{I("tv", 20)}</span><span><span class="pl-devtile__name">Akıllı TV</span><br><span class="pl-devtile__sub">Salon · Açık</span></span><span class="pl-switch"><input type="checkbox" role="switch" checked></span></label>
<label class="pl-devtile is-on"><span class="pl-devtile__ic">{I("bulb", 20)}</span><span><span class="pl-devtile__name">Aydınlatma</span><br><span class="pl-devtile__sub">%70 · Sıcak beyaz</span></span><span class="pl-switch"><input type="checkbox" role="switch" checked></span><span class="pl-devtile__meter" aria-hidden="true">{"".join(f'<i class="{"is-on" if i<7 else ""}"></i>' for i in range(10))}</span></label>
<label class="pl-devtile"><span class="pl-devtile__ic">{I("fan", 20)}</span><span><span class="pl-devtile__name">Robot süpürge</span><br><span class="pl-devtile__sub">Şarjda</span></span><span class="pl-switch"><input type="checkbox" role="switch"></span></label></div>''')

add(slug="sensor-overlay", ad="Sensör Kaplama Kartı", kategori=K, yuzey="glass",
    kaynak="Pin 6 — 3B ev üzerinde yüzen Temperature / Humidity kartları",
    aciklama="3B sahne ya da fotoğraf üzerinde yüzen cam kart: ikon, ölçüm adı, değer ve nokta ölçeği.",
    ne_zaman="Görsel bir sahne üzerine bağlamsal sensör verisi bindirmek.",
    durumlar=["normal", "eşik aşıldı (ikon uyarı rengi)"],
    siniflar="pl-sensor pl-glass pl-sensor__ic pl-sensor__top pl-sensor__dots",
    a11y="Nokta ölçeği aria-hidden; değer metin olarak okunur.",
    html=f'''<div style="background:var(--pl-media-5);padding:22px;border-radius:18px;display:grid;gap:10px;justify-items:start"><div class="pl-sensor pl-glass"><span class="pl-sensor__ic">{I("thermo")}</span><div class="pl-sensor__top">Sıcaklık <b>23°</b></div><div class="pl-sensor__dots" aria-hidden="true">{"".join(f'<i class="{"is-on" if i<11 else ""}"></i>' for i in range(16))}</div></div>
<div class="pl-sensor pl-glass"><span class="pl-sensor__ic">{I("droplet")}</span><div class="pl-sensor__top">Nem <b>%48</b></div><div class="pl-sensor__dots" aria-hidden="true">{"".join(f'<i class="{"is-on" if i<8 else ""}"></i>' for i in range(16))}</div></div></div>''')

add(slug="room-card", ad="Oda Başlık Kartı", kategori=K,
    kaynak="Pin 6 — 'Living Room' başlıklı oda paneli",
    aciklama="Oda ikonu + adı + cihaz sayısı, altında oda görüntüsü / kamera alanı.",
    ne_zaman="Oda bazlı kontrol panelleri, mekân seçimi.",
    durumlar=["varsayılan", "kamera canlı"],
    siniflar="pl-roomcard pl-roomcard__head pl-roomcard__ic pl-roomcard__name pl-roomcard__view",
    a11y="Kamera alanı <figure> + <figcaption>.",
    html=f'''<article class="pl-roomcard"><div class="pl-roomcard__head"><span class="pl-roomcard__ic">{I("home", 20)}</span><div style="flex:1"><div class="pl-roomcard__name">Salon</div><div class="pl-muted" style="font-size:11px">6 cihaz · 4 açık</div></div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Diğer">{I("more")}</button></div><figure class="pl-roomcard__view" style="margin:0 12px 12px"><span class="pl-camfeed__rec" style="position:absolute;left:10px;top:10px;font-family:var(--pl-font-mono);font-size:10px;color:var(--pl-fg-1)">CANLI</span></figure></article>''')

add(slug="climate-chips", ad="İklim Çipleri", kategori=K,
    kaynak="Pin 6 — üst çubukta sıcaklık · nem · saat",
    aciklama="Tek kapsül içinde ayraçlı mono değerler: dış sıcaklık, nem, saat.",
    ne_zaman="Üst çubukta ortam/durum özeti.",
    siniflar="pl-climate",
    a11y="Her bölüm aria-label taşır (\"Dış sıcaklık 11 derece\").",
    html=f'''<div class="pl-climate"><span aria-label="Dış sıcaklık 11 derece">{I("cloud")}11°C</span><span aria-label="Nem yüzde 67">{I("droplet")}%67</span><span aria-label="Saat 20:21">{I("clock")}20:21</span></div>''')

add(slug="presence-strip", ad="Üye Varlık Şeridi", kategori=K,
    kaynak="Pin 6 — alt kısımda ev üyeleri avatarları",
    aciklama="Avatar + ad + konum durumu hapları; evdeki üyeler aksan halkalı.",
    ne_zaman="Aile/ekip varlık durumu, paylaşımlı çalışma alanı katılımcıları.",
    durumlar=["evde", "dışarıda", "çevrimdışı"],
    siniflar="pl-presence pl-presence__item is-home",
    a11y="Durum metni görünür; yalnız halka rengine güvenilmez.",
    html='''<div class="pl-presence"><div class="pl-presence__item is-home"><span class="pl-avatar pl-avatar--accent">MI</span><span><b>Muhammed</b><small>Evde</small></span></div><div class="pl-presence__item is-home"><span class="pl-avatar">YA</span><span><b>Yalçın</b><small>Evde</small></span></div><div class="pl-presence__item"><span class="pl-avatar">ÜS</span><span><b>Ünal</b><small>Dışarıda</small></span></div></div>''')

add(slug="floor-panel", ad="Kat Seçici Paneli", kategori=K, yuzey="glass",
    kaynak="Pin 15 — 'Floor / On the first floor' oda listesi",
    aciklama="Kat açılır seçimi, oda arama, renkli ikonlu oda satırları ve sayaç rozetleri.",
    ne_zaman="Kat planı / bina navigasyonu, depo ve ofis haritaları.",
    durumlar=["varsayılan", "oda seçili", "arama sonucu yok"],
    siniflar="pl-floorpanel pl-glass pl-floorpanel__head pl-floorpanel__list pl-roomrow is-active pl-roomrow__ic (--c) pl-roomrow__n",
    a11y="Liste role=\"listbox\"; satırlar role=\"option\" + aria-selected; ok tuşlarıyla gezilir.",
    html=f'''<div style="background:var(--pl-grad-ocean);padding:16px;border-radius:24px"><div class="pl-floorpanel pl-glass"><div class="pl-floorpanel__head">{I("layers")}Kat <span class="pl-chip pl-chip--accent" style="margin-left:auto">Yeni rota</span></div><select class="pl-select"><option>1. kat</option><option>2. kat</option></select>
<div class="pl-floorpanel__head" style="font-size:13px">{I("map-pin")}Birinci kattaki alanlar</div><div class="pl-inputwrap">{I("search")}<input class="pl-input" placeholder="Alan adı girin"></div>
<div class="pl-floorpanel__list" role="listbox" aria-label="Alanlar">
<div class="pl-roomrow" role="option" aria-selected="false"><span class="pl-roomrow__ic" style="--c:var(--pl-viz-4)">{I("users")}</span>Eğitim odası<span class="pl-roomrow__n">3</span></div>
<div class="pl-roomrow is-active" role="option" aria-selected="true"><span class="pl-roomrow__ic" style="--c:var(--pl-viz-5)">{I("message")}</span>Toplantı salonu<span class="pl-roomrow__n">Rota</span></div>
<div class="pl-roomrow" role="option" aria-selected="false"><span class="pl-roomrow__ic" style="--c:var(--pl-viz-3)">{I("briefcase")}</span>Yönetim ofisi<span class="pl-roomrow__n">8</span></div>
<div class="pl-roomrow" role="option" aria-selected="false"><span class="pl-roomrow__ic" style="--c:var(--pl-viz-6)">{I("cpu")}</span>Ar-Ge laboratuvarı<span class="pl-roomrow__n">5</span></div></div></div></div>''')

add(slug="map-hotspot", ad="Harita Sıcak Noktası", kategori=K,
    kaynak="Pinler 0, 15 — plan üzerinde renkli konum iğneleri ve etiketleri",
    aciklama="Damla biçimli iğne, renk değişkeni (--c), cam etiket ve isteğe bağlı nabız animasyonu.",
    ne_zaman="Plan, harita, 3B sahne üzerinde nesne/olay işaretleme.",
    durumlar=["varsayılan", "seçili (nabız)", "uyarı (--c: danger)"],
    siniflar="pl-hotspot is-pulse pl-hotspot__pin (--c) pl-hotspot__label",
    a11y="Her iğne <button aria-label=\"Toplantı salonu, 3 kişi\">.",
    html=f'''<div style="position:relative;height:170px;border-radius:16px;background:var(--pl-media-6)">
<button class="pl-hotspot is-pulse" style="left:30%;top:60%;background:none;border:0" aria-label="Toplantı salonu"><span class="pl-hotspot__pin" style="--c:var(--pl-viz-3)">{I("users")}</span><span class="pl-hotspot__label">Toplantı salonu</span></button>
<button class="pl-hotspot" style="left:62%;top:42%;background:none;border:0" aria-label="Sunucu odası"><span class="pl-hotspot__pin" style="--c:var(--pl-viz-2)">{I("cpu")}</span><span class="pl-hotspot__label">Sunucu odası</span></button>
<button class="pl-hotspot" style="left:82%;top:80%;background:none;border:0" aria-label="Acil çıkış"><span class="pl-hotspot__pin" style="--c:var(--pl-danger)">{I("alert")}</span></button></div>''')

add(slug="weather-widget", ad="Saat & Hava Widget'ı", kategori=K, yuzey="glass",
    kaynak="Pin 15 — 'Tue 08:25 pm' + gradyan sıcaklık kartı",
    aciklama="Gün + büyük saat ve tarih; yanında gradyan zeminli sıcaklık karosu.",
    ne_zaman="Pano üst köşesi, kilit/boşta ekranı, ortam bilgisi.",
    siniflar="pl-weather pl-glass pl-weather__time pl-weather__day pl-weather__clock pl-weather__temp",
    a11y="<time datetime> kullanılır.",
    html=f'''<div style="background:var(--pl-grad-ocean);padding:16px;border-radius:24px;width:max-content"><div class="pl-weather pl-glass"><div class="pl-weather__time"><span class="pl-weather__day">Pazar</span><time class="pl-weather__clock" datetime="2026-11-01T20:25">20:25 <small>01.11.2026</small></time></div><div class="pl-weather__temp">{I("sun", 20)}<b>18°</b><small>Parçalı bulutlu</small></div></div></div>''')

add(slug="equip-tile", ad="Ekipman Sayaç Karosu", kategori=K, yuzey="hud",
    kaynak="Pin 8 — IoT 'Equipment overview' sayaç kutuları",
    aciklama="Renkli ikon + kategori + büyük HUD rakamı. Seçili karo tamamen aksan dolgulu.",
    ne_zaman="Cihaz/envanter kategorilerinin sayımı, filtre görevi gören özet kutular.",
    durumlar=["varsayılan", "seçili"],
    siniflar="pl-equip is-active pl-equip__top pl-equip__ic (--c) pl-equip__val",
    a11y="Seçilebilir karolar <button aria-pressed>.",
    html=f'''<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="pl-equip" aria-pressed="false" style="text-align:left;font:inherit;cursor:pointer"><span class="pl-equip__top"><span class="pl-equip__ic" style="--c:var(--pl-viz-6)">{I("cpu")}</span>Dijital cihaz</span><span class="pl-equip__val">18</span></button>
<button class="pl-equip" aria-pressed="false" style="text-align:left;font:inherit;cursor:pointer"><span class="pl-equip__top"><span class="pl-equip__ic" style="--c:var(--pl-viz-4)">{I("zap")}</span>Enerji</span><span class="pl-equip__val">235</span></button>
<button class="pl-equip is-active" aria-pressed="true" style="text-align:left;font:inherit;cursor:pointer"><span class="pl-equip__top"><span class="pl-equip__ic">{I("building")}</span>Ofis cihazı</span><span class="pl-equip__val">1.209</span></button>
<button class="pl-equip" aria-pressed="false" style="text-align:left;font:inherit;cursor:pointer"><span class="pl-equip__top"><span class="pl-equip__ic" style="--c:var(--pl-viz-3)">{I("shield")}</span>Güvenlik</span><span class="pl-equip__val">185</span></button></div>''')

add(slug="iso-plan", ad="İzometrik Plan Görüntüleyici", kategori=K, span=2,
    kaynak="Pinler 0, 1, 3, 6, 8, 15 — izometrik ev / ofis / kat planı sahneleri",
    aciklama="CSS 3B dönüşümüyle izometrik kat; renk kodlu odalar, seçili oda ışıması, köşede görünüm araçları ve lejant. Gerçek 3B model yerine geçen hafif yer tutucu.",
    ne_zaman="Akıllı ev, emlak, tesis yönetimi; 3B model yüklenene kadar ya da düşük güç modunda.",
    durumlar=["varsayılan", "oda seçili", "2D (dönüşüm kapalı)"],
    siniflar="pl-isoplan pl-isoplan__floor pl-isoplan__room (--c) pl-isoplan__room--wide is-active pl-isoplan__legend",
    a11y="Odalar <button aria-label>; aynı bilgi Kat Seçici Paneli listesiyle de sunulur.",
    html=f'''<div class="pl-isoplan"><div class="pl-isoplan__floor">
<button class="pl-isoplan__room pl-isoplan__room--wide is-active" style="--c:var(--pl-viz-1);border:0" aria-label="Salon"></button><button class="pl-isoplan__room" style="--c:var(--pl-viz-5);border:0" aria-label="Mutfak"></button><button class="pl-isoplan__room" style="--c:var(--pl-viz-4);border:0" aria-label="Yatak odası"></button><button class="pl-isoplan__room" style="--c:var(--pl-viz-3);border:0" aria-label="Banyo"></button><button class="pl-isoplan__room" style="--c:var(--pl-viz-2);border:0" aria-label="Çalışma odası"></button></div>
<div class="pl-viewtools" role="toolbar" aria-label="Görünüm"><button>2D</button><button class="is-active">3D</button><hr><button aria-label="Yakınlaştır">{I("zoom-in")}</button><button aria-label="Uzaklaştır">{I("zoom-out")}</button></div>
<div class="pl-isoplan__legend"><span class="pl-chip"><span class="pl-dot" style="background:var(--pl-viz-1)"></span>Salon</span><span class="pl-chip"><span class="pl-dot" style="background:var(--pl-viz-5)"></span>Mutfak</span><span class="pl-chip"><span class="pl-dot" style="background:var(--pl-viz-4)"></span>Yatak</span></div></div>''')

# =====================================================================
#  E. HUD & ENDÜSTRİ
# =====================================================================
K = "HUD & Endüstri"
add(slug="hud-metric", ad="HUD Büyük Metrik", kategori=K, yuzey="hud",
    kaynak="Pin 10 — '102.67 / 127.39' ışıyan büyük değerler",
    aciklama="Rajdhani rakamlı, metin gölgesiyle ışıyan büyük değer; yeşil / amber / camgöbeği varyantları.",
    ne_zaman="Komuta ekranında tek bakışta okunması gereken ana değerler.",
    durumlar=["normal (yeşil)", "uyarı (amber)", "bilgi (camgöbeği)"],
    siniflar="pl-hudmetric pl-hudmetric--amber|cyan pl-hudmetric__ic pl-hudmetric__val pl-hudmetric__lbl",
    a11y="Renk anlamı etiket metninde de verilir (\"Normal\", \"Uyarı\").",
    html=f'''<div class="pl-row" style="gap:28px"><div class="pl-hudmetric"><span class="pl-hudmetric__ic">{I("activity", 24)}</span><span class="pl-hudmetric__val">102<small>.67</small></span><span class="pl-hudmetric__lbl">Genel endeks · Normal</span></div><div class="pl-hudmetric pl-hudmetric--cyan"><span class="pl-hudmetric__ic">{I("gauge", 24)}</span><span class="pl-hudmetric__val">127<small>.39</small></span><span class="pl-hudmetric__lbl">Sistem değeri</span></div></div>''')

add(slug="wave-monitor", ad="Dalga Formu Monitörü", kategori=K, yuzey="hud",
    kaynak="Pin 10 — 85 / 76 / 25 değerli EKG çizgileri",
    aciklama="Sol değer + sağda ışıyan dalga çizgisi; her satır kendi renk kanalını (--c) kullanır.",
    ne_zaman="Gerçek zamanlı sinyal: sağlık, ağ trafiği, CPU/GPU yükü, sensör akışı.",
    durumlar=["akış", "donmuş (kayıt)", "sinyal yok"],
    siniflar="pl-wavemon pl-wavemon__row pl-wavemon__val",
    a11y="SVG role=\"img\" + aria-label=\"Nabız 85, sabit\".",
    html=f'''<div class="pl-wavemon">{"".join(f'<div class="pl-wavemon__row"><span class="pl-wavemon__val">{v}</span><svg viewBox="0 0 300 60" preserveAspectRatio="none" role="img" aria-label="{l} {v}"><polyline points="{ecg(i+3, 60, a)}"/></svg></div>' for i,(v,l,a) in enumerate([(85,"Nabız",1),(76,"Solunum",.6),(25,"Isı",.35)]))}</div>''')

add(slug="hud-rings", ad="HUD Halka Göstergeleri", kategori=K, yuzey="hud",
    kaynak="Pin 10 — alt kısımdaki üçlü dairesel göstergeler",
    aciklama="Konik dolgulu, kesik çizgili iç halkalı dairesel göstergeler; değer --v ile.",
    ne_zaman="Birden fazla yüzdeyi yan yana karşılaştırmak (doluluk, sağlık, kapasite).",
    siniflar="pl-hudrings pl-hudring pl-hudring__dial (--v, --c)",
    a11y="Her kadran role=\"meter\" + aria-valuenow.",
    html=''.join(['<div class="pl-hudrings">'] + [f'<div class="pl-hudring"><div class="pl-hudring__dial" role="meter" aria-valuenow="{v}" aria-valuemin="0" aria-valuemax="100" style="--v:{v};--c:var({c})"><b>{v}</b></div>{l}</div>' for v,c,l in [(72,"--pl-hud","CPU"),(46,"--pl-hud-green","Bellek"),(88,"--pl-hud-amber","Disk")]] + ['</div>']))

add(slug="hud-table", ad="HUD Veri Tablosu", kategori=K, yuzey="hud", span=2,
    kaynak="Pinler 13, 16 — sağ paneldeki durum tabloları",
    aciklama="Mono, büyük harfli başlıklı, zebra çizgili tablo; durumlar çerçeveli HUD etiketleriyle.",
    ne_zaman="Cihaz listesi, alarm günlüğü, sipariş/üretim kuyruğu.",
    durumlar=["normal", "uyarı", "hata"],
    siniflar="pl-hudtable pl-hudtag pl-hudtag--warn|err",
    a11y="Gerçek <table> + <th scope>; durum metinle.",
    html='''<table class="pl-hudtable"><thead><tr><th scope="col">Cihaz</th><th scope="col">Hat</th><th scope="col">Sıcaklık</th><th scope="col">Durum</th><th scope="col">Güncelleme</th></tr></thead><tbody>
<tr><td>PRS-0142</td><td>A-3</td><td>41,2 °C</td><td><span class="pl-hudtag">Çalışıyor</span></td><td>21:39:58</td></tr>
<tr><td>CNC-0087</td><td>B-1</td><td>68,9 °C</td><td><span class="pl-hudtag pl-hudtag--warn">Isınıyor</span></td><td>21:39:41</td></tr>
<tr><td>ROB-0233</td><td>C-2</td><td>—</td><td><span class="pl-hudtag pl-hudtag--err">Bağlantı yok</span></td><td>21:31:07</td></tr>
<tr><td>KMP-0019</td><td>A-1</td><td>36,4 °C</td><td><span class="pl-hudtag">Çalışıyor</span></td><td>21:39:55</td></tr></tbody></table>''')

add(slug="donut-metric", ad="Halka Yüzde Metriği", kategori=K,
    kaynak="Pin 29 — '45% / 75% / 52%' halka göstergeli üretim metrikleri",
    aciklama="Konik halka içinde yüzde + yanında başlık ve alt açıklama.",
    ne_zaman="KPI şeritleri, kapasite özetleri.",
    siniflar="pl-donut pl-donut__ring (--v, --c) pl-donut__txt",
    a11y="role=\"meter\" halka üzerinde.",
    html=''.join(['<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'] + [f'<div class="pl-donut"><div class="pl-donut__ring" role="meter" aria-valuenow="{v}" style="--v:{v};--c:var({c})"><b>%{v}</b></div><div class="pl-donut__txt"><b>{t}</b><small>{s}</small></div></div>' for v,c,t,s in [(45,"--pl-viz-2","Toplam GPM","Akış hızı"),(75,"--pl-viz-3","Toplam GPM","Hat 2"),(52,"--pl-viz-5","LBS","Basınç"),(68,"--pl-viz-4","Toplam LBS","Hat 3")]] + ['</div>']))

add(slug="process-flow", ad="Proses Akış Şeması", kategori=K, span=2,
    kaynak="Pin 29 — tank, boru ve vanalı SCADA proses ekranı",
    aciklama="SVG tabanlı tank–boru–vana şeması; akan hat kesik çizgi animasyonlu, tank doluluk seviyesi gösterilir.",
    ne_zaman="Endüstriyel izleme, veri hattı (pipeline) görselleştirme, otomasyon akışları.",
    durumlar=["akış", "vana kapalı (kırmızı)", "durdu (animasyon yok)"],
    siniflar="pl-process .p-pipe .p-flow .p-tank .p-level .p-valve.is-off",
    a11y="SVG role=\"img\" + ayrıntılı aria-label; aynı durum tabloyla da verilir.",
    html='''<svg class="pl-process" viewBox="0 0 560 170" role="img" aria-label="Proses: 3 tank, 2 açık 1 kapalı vana, reaktör yüzde 64 dolu">
<path class="p-pipe" d="M60 120 H180 M240 120 H330 M390 120 H500 M210 60 V30 H420 V60"/><path class="p-flow" d="M60 120 H180 M240 120 H330 M210 60 V30 H420 V60"/>
<rect class="p-tank" x="20" y="60" width="44" height="90" rx="12"/><rect class="p-level" x="22" y="100" width="40" height="48" rx="10"/>
<rect class="p-tank" x="180" y="60" width="60" height="90" rx="14"/><rect class="p-level" x="182" y="92" width="56" height="56" rx="12"/>
<rect class="p-tank" x="330" y="50" width="60" height="100" rx="30"/><rect class="p-level" x="332" y="86" width="56" height="62" rx="26"/>
<rect class="p-tank" x="500" y="80" width="40" height="70" rx="6"/>
<rect class="p-valve" x="112" y="112" width="16" height="16" transform="rotate(45 120 120)"/><rect class="p-valve" x="277" y="112" width="16" height="16" transform="rotate(45 285 120)"/><rect class="p-valve is-off" x="437" y="112" width="16" height="16" transform="rotate(45 445 120)"/>
<text x="20" y="166">HAM-01</text><text x="180" y="166">KARIŞIM</text><text x="330" y="166">REAKTÖR %64</text><text x="494" y="166">ÇIKIŞ</text></svg>''')

add(slug="seg-bars", ad="Segment Çubuk Grafik", kategori=K, yuzey="hud",
    kaynak="Pinler 10, 13 — dijital segmentli ekolayzer çubukları",
    aciklama="Yatay çizgilerle bölünmüş (LED) çubuklar; tepe değerler amber.",
    ne_zaman="Saatlik yük, frekans dağılımı, gerçek zamanlı yoğunluk.",
    siniflar="pl-segbars > span (--v) .is-peak",
    a11y="role=\"img\" + özet aria-label; ham veri tabloda.",
    html='<div class="pl-segbars" role="img" aria-label="Saatlik yük, tepe 21:00">' + "".join(f'<span style="--v:{v}"{" class=\"is-peak\"" if v>88 else ""}></span>' for v in bars(7, 28, 20, 96)) + '</div>')

add(slug="film-ticks", ad="Film Şeridi Zaman Ekseni", kategori=K, span=2,
    kaynak="Pin 16 — alt kısımdaki dairesel kare/olay şeridi",
    aciklama="Yatay kaydırılan dairesel olay hücreleri ve zaman etiketleri; aktif hücre ışır.",
    ne_zaman="Kayıt oynatma, olay geçmişi, kare seçimi.",
    siniflar="pl-filmtick pl-filmtick__cell is-active",
    a11y="role=\"listbox\" yatay; ← → ile gezinme.",
    html='<div class="pl-filmtick" role="listbox" aria-orientation="horizontal" aria-label="Olaylar">' + "".join(f'<div class="pl-filmtick__cell{" is-active" if i==6 else ""}" role="option" aria-selected="{str(i==6).lower()}"><i></i>{20+i//6:02d}:{(i*10)%60:02d}</div>' for i in range(16)) + '</div>')
