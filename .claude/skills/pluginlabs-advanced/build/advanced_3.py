"""PLA — F. Üretkenlik & İK · G. CRM & İş · H. Yaratıcı Araçlar"""
from advanced import add, I, poly, smooth, area, bars

AREA_DEFS = '<defs><linearGradient id="pl-area-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".28"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>'

# =====================================================================
#  F. ÜRETKENLİK & İK
# =====================================================================
K = "Üretkenlik & İK"
add(slug="day-strip", ad="Hafta Gün Şeridi", kategori=K,
    kaynak="Pin 11 — üstte 'Mon 15 · Tue 16…' gün seçici",
    aciklama="Gün adı + mono gün numarası; seçili gün ters renk, bugün nokta işaretli.",
    ne_zaman="Takvim, ajanda, rezervasyon ekranlarının üstü.",
    durumlar=["varsayılan", "bugün", "seçili", "devre dışı (geçmiş)"],
    siniflar="pl-daystrip > button.is-active.is-today",
    a11y="role=\"tablist\"; her gün aria-label=\"Salı 16 Kasım\".",
    html='<div class="pl-daystrip" role="tablist" aria-label="Hafta">' + "".join(f'<button role="tab" aria-selected="{str(d==19).lower()}" class="{"is-active" if d==19 else ""}{" is-today" if d==17 else ""}">{n}<b>{d}</b></button>' for n,d in zip(["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"],range(15,22))) + '</div>')

add(slug="schedule-board", ad="Takvim Panosu", kategori=K, span=2,
    kaynak="Pin 11 — sütunlu ekip takvimi ve renkli etkinlik blokları",
    aciklama="Saat sütunu + kişi/ekip sütunları; renk kodlu, süreye göre yüksekliği değişen etkinlik blokları (--h).",
    ne_zaman="Ekip planlama, kaynak takvimi, oda rezervasyonu.",
    durumlar=["varsayılan", "etkinlik seçili", "sürükleniyor", "çakışma (uyarı kenarlığı)"],
    siniflar="pl-board (--cols) pl-board__colhead pl-board__time pl-board__cell pl-evt (--c, --h) pl-evt__foot",
    a11y="role=\"grid\"; etkinlikler <button> ve aria-label=\"Ekip toplantısı, 09:00–10:00\".",
    html=f'''<div class="pl-board" style="--cols:3" role="grid"><div></div><div class="pl-board__colhead">Tasarımcılar <small>4</small></div><div class="pl-board__colhead">Geliştirme <small>6</small></div><div class="pl-board__colhead">Yayın <small>2</small></div>
<div class="pl-board__time">09:00</div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-6);--h:1"><b>Ekip toplantısı</b>09:00–10:00</div></div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-1);--h:2"><b>Komut paleti sprinti</b>09:00–11:00<div class="pl-evt__foot"><span class="pl-avatars"><span class="pl-avatar pl-avatar--sm">MI</span><span class="pl-avatar pl-avatar--sm">YA</span></span></div></div></div><div class="pl-board__cell"></div>
<div class="pl-board__time">10:00</div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-3);--h:1"><b>Logo revizyonu</b>10:00–11:00</div></div><div class="pl-board__cell"></div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-5);--h:1"><b>v2.0 yayını</b>10:30</div></div>
<div class="pl-board__time">11:00</div><div class="pl-board__cell"></div><div class="pl-board__cell"><div class="pl-evt" style="--c:var(--pl-viz-2);--h:1"><b>Kod incelemesi</b>11:00–11:45</div></div><div class="pl-board__cell"></div></div>''')

add(slug="big-stats", ad="Büyük Sayı Üçlüsü", kategori=K,
    kaynak="Pin 39 — '78 Employee · 56 Hirings · 203 Projects' ince büyük rakamlar",
    aciklama="İnce (300) ağırlıkta çok büyük rakamlar + küçük ikon + alt etiket.",
    ne_zaman="Karşılama başlığının sağında üst düzey sayaçlar.",
    siniflar="pl-bigstats pl-bigstat pl-bigstat__val pl-bigstat__lbl",
    a11y="Rakam ve etiket aynı öğe içinde; okuma sırası \"78 çalışan\".",
    html=f'''<div class="pl-bigstats">{"".join(f'<div class="pl-bigstat"><span class="pl-bigstat__val">{I(ic)}{v}</span><span class="pl-bigstat__lbl">{l}</span></div>' for ic,v,l in [("users","78","Çalışan"),("briefcase","56","İşe alım"),("layers","203","Proje")])}</div>''')

add(slug="seg-pills", ad="Bölümlü İlerleme Hapları", kategori=K, span=2,
    kaynak="Pin 39 — 'Interviews 15% · Hired 15% · Project time 60% · Output 10%'",
    aciklama="Oransal genişlikte kapsüller: koyu, aksan, gri ve taralı (kalan) dolgular; üstte etiket.",
    ne_zaman="Zaman/bütçe dağılımı, süreç aşamalarının oranları.",
    siniflar="pl-segpills (--cols) pl-segpill pl-segpill--dark|accent|hatch",
    a11y="role=\"img\" + aria-label tüm oranları sıralar.",
    html='''<div class="pl-segpills" style="--cols:1fr 1fr 3.4fr 1fr" role="img" aria-label="Mülakat yüzde 15, işe alım yüzde 15, proje süresi yüzde 60, çıktı yüzde 10"><div class="pl-segpill pl-segpill--dark">Mülakat<span>%15</span></div><div class="pl-segpill pl-segpill--accent">İşe alım<span>%15</span></div><div class="pl-segpill">Proje süresi<span>%60</span></div><div class="pl-segpill pl-segpill--hatch">Çıktı<span>%10</span></div></div>''')

add(slug="time-tracker", ad="Zaman Takip Kadranı", kategori=K,
    kaynak="Pin 39 — '02:35 Work Time' çentikli dairesel sayaç",
    aciklama="Çentikli (tick) dairesel kadran, ortada büyük süre; altında oynat/duraklat ve zamanlayıcı düğmeleri.",
    ne_zaman="Odak zamanlayıcı, çalışma süresi takibi, pomodoro.",
    durumlar=["çalışıyor", "duraklatıldı", "hedefe ulaşıldı"],
    siniflar="pl-timer pl-timer__wrap pl-timer__dial is-partial (--v) pl-timer__val pl-timer__ctl",
    a11y="Süre <time> içinde; her dakika değil yalnız durum değişince aria-live.",
    html=f'''<div class="pl-timer"><div class="pl-timer__wrap"><div class="pl-timer__dial is-partial" style="--v:64" aria-hidden="true"></div><div class="pl-timer__val"><b>02:35</b><small>Çalışma süresi</small></div></div><div class="pl-timer__ctl"><button class="pl-iconbtn pl-iconbtn--outline" aria-label="Başlat">{I("play")}</button><button class="pl-iconbtn pl-iconbtn--outline" aria-label="Duraklat">{I("pause")}</button><button class="pl-iconbtn" style="background:var(--pl-fg-1);color:var(--pl-bg-1)" aria-label="Zamanlayıcı">{I("timer")}</button></div></div>''')

add(slug="task-card-dark", ad="Karanlık Görev Kartı", kategori=K,
    kaynak="Pin 39 — 'Onboarding Task 2/8' ters renkli kart",
    aciklama="Metin rengi zeminli (ters) kart; ilerleme oranı, ikonlu görev satırları ve onay daireleri.",
    ne_zaman="Açık temalı ekranda vurgulanması gereken kontrol listesi.",
    durumlar=["bekliyor", "tamamlandı"],
    siniflar="pl-taskcard pl-taskcard__head pl-taskcard__item is-done pl-taskcard__ic pl-taskcard__chk",
    a11y="Satırlar <label> + checkbox; ilerleme \"8 görevden 2'si\".",
    html=f'''<div class="pl-taskcard"><div class="pl-taskcard__head"><b>Kurulum görevleri</b><span>2/8</span></div>{"".join(f'<div class="pl-taskcard__item{" is-done" if d else ""}"><span class="pl-taskcard__ic">{I(ic)}</span><span>{t}<small>{s}</small></span><span class="pl-taskcard__chk">{I("check") if d else ""}</span></div>' for ic,t,s,d in [("message","Görüşme","02.11.2026 · 09:30",True),("users","Ekip toplantısı","02.11.2026 · 11:30",True),("folder","Proje güncellemesi","03.11.2026 · 15:00",False),("check-sq","İK politikası","04.11.2026 · 14:45",False)])}</div>''')

add(slug="photo-card", ad="Profil Fotoğraf Kartı", kategori=K,
    kaynak="Pin 39 — fotoğraflı çalışan kartı ve maaş hapı",
    aciklama="Büyük fotoğraf/görsel alanı, alt karartma, ad + rol ve sağ altta değer hapı.",
    ne_zaman="Kişi profili, öne çıkan üye, müşteri kartı.",
    siniflar="pl-photocard pl-photocard__name pl-photocard__role pl-photocard__pill",
    a11y="Fotoğraf alt metni kişinin adıdır.",
    html='''<div class="pl-photocard" style="max-width:220px"><div><span class="pl-photocard__name">Yalçın Demir</span><span class="pl-photocard__role">Ürün tasarımcısı</span></div><span class="pl-chip pl-chip--ghost pl-chip--mono pl-photocard__pill">48.500 ₺</span></div>''')

add(slug="pin-bars", ad="İnce Çubuk İlerleme Grafiği", kategori=K,
    kaynak="Pin 39 — 'Progress 6.1h' iğne başlı ince çubuklar",
    aciklama="Gün başına iğne başlı ince çubuklar; tepe gün aksan renginde ve değer etiketli.",
    ne_zaman="Haftalık çalışma saati, alışkanlık takibi, günlük hedef.",
    siniflar="pl-pinbars pl-pinbars__col is-peak (--v) pl-pinbars__tip",
    a11y="role=\"img\" + aria-label; altta ham değer tablosu önerilir.",
    html='<div class="pl-pinbars" role="img" aria-label="Haftalık çalışma saati, en yüksek cuma 5 saat 23 dakika">' + "".join(f'<div class="pl-pinbars__col{" is-peak" if j==4 else ""}" style="--v:{v}">{"<span class=pl-pinbars__tip>5s 23dk</span>" if j==4 else ""}<i></i>{l}</div>' for j,(l,v) in enumerate(zip("PSÇPCCP",[40,62,48,70,88,30,52]))) + '</div>')

add(slug="day-agenda", ad="Günlük Ajanda", kategori=K, span=2,
    kaynak="Pin 39 — Eylül takviminde saat bazlı etkinlik kartları",
    aciklama="Saat satırları, yatay konumlu (--x/--w) etkinlik kartları; ana kart ters renk, diğerleri yumuşak.",
    ne_zaman="Günün ajandası, toplantı yoğunluğu.",
    siniflar="pl-agenda pl-agenda__t pl-agenda__s pl-agenda__evt pl-agenda__evt--soft (--x, --w)",
    a11y="Etkinlikler kronolojik DOM sırasında; görsel konum yalnız sunumdur.",
    html='''<div class="pl-agenda"><div class="pl-agenda__t">08:00</div><div class="pl-agenda__s"></div><div class="pl-agenda__t">09:00</div><div class="pl-agenda__s"><div class="pl-agenda__evt" style="--x:18%;--w:52%">Haftalık ekip senkronu<span class="pl-avatars"><span class="pl-avatar pl-avatar--sm">MI</span><span class="pl-avatar pl-avatar--sm">YA</span><span class="pl-avatar pl-avatar--sm">ÜS</span></span></div></div><div class="pl-agenda__t">10:00</div><div class="pl-agenda__s"><div class="pl-agenda__evt pl-agenda__evt--soft" style="--x:40%;--w:46%">Kurulum oturumu</div></div><div class="pl-agenda__t">11:00</div><div class="pl-agenda__s"></div></div>''')

add(slug="greeting-header", ad="Karşılama Başlığı", kategori=K, span=2,
    kaynak="Pin 26 — 'Good morning, Natalie' koyu başlık bandı",
    aciklama="Ters renkli bant: selamlama, alt bilgi ve sağda tarih/saat çipleri + bildirim.",
    ne_zaman="Pano açılış ekranı.",
    siniflar="pl-greet pl-greet__title pl-greet__sub pl-greet__chips",
    a11y="Selamlama <h1>; saat çipi <time>.",
    html=f'''<header class="pl-greet"><div><h2 class="pl-greet__title">Günaydın, Muhammed</h2><div class="pl-greet__sub">Bugün 4 toplantın ve 2 yayının var.</div></div><div class="pl-greet__chips"><span>{I("calendar")}01.11.2026</span><span>{I("clock")}09:00–18:00</span></div><button class="pl-iconbtn" style="color:inherit" aria-label="Bildirimler">{I("bell")}</button></header>''')

add(slug="stat-card-color", ad="Renkli İkonlu İstatistik Kartı", kategori=K,
    kaynak="Pin 26 — 'Today appointments / Cancelled' renkli ikonlu kartlar",
    aciklama="Renk değişkenli (--c) ikon karosu, etiket, büyük mono değer ve değişim; 'is-hot' ile renkli zemin.",
    ne_zaman="Pano üst KPI satırı (4–5 kart).",
    durumlar=["varsayılan", "vurgulu (is-hot)"],
    siniflar="pl-statcard is-hot pl-statcard__ic (--c) pl-statcard__lbl pl-statcard__val",
    a11y="Değişim yönü metinle (\"+%12 artış\").",
    html=f'''<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">{"".join(f'<div class="pl-statcard{h}" style="--c:var({c})"><span class="pl-statcard__ic">{I(ic)}</span><span class="pl-statcard__lbl">{l}</span><span class="pl-statcard__val">{v}<small style="color:var({dc})">{d}</small></span></div>' for ic,l,v,d,c,dc,h in [("calendar","Bugünkü randevu","12","+%8","--pl-viz-7","--pl-success",""),("users","Toplam hasta","120","+%3","--pl-viz-1","--pl-success",""),("x-circle","İptal","12","-%2","--pl-viz-3","--pl-danger"," is-hot"),("check-circle","Tamamlanan","4","+1","--pl-viz-5","--pl-success","")])}</div>''')

add(slug="area-chart", ad="Alan Grafiği + İpucu", kategori=K, span=2,
    kaynak="Pinler 26, 33 — yumuşak eğrili alan grafiği ve koyu ipucu",
    aciklama="Yumuşatılmış eğri, aksan rengi gradyan dolgu, imleç çizgisi, nokta ve koyu ipucu; X ekseninde aktif ay hapı.",
    ne_zaman="Zaman serisi: gelir, ziyaret, adım, hasta sayısı.",
    durumlar=["varsayılan", "hover (imleç + ipucu)", "boş veri"],
    siniflar="pl-areachart .a-grid .a-area .a-line .a-dot .a-cursor pl-areachart__x pl-charttip",
    a11y="SVG role=\"img\" + özet; ayrıntı için gizli <table>.",
    html=(lambda v: f'''<div class="pl-areachart" style="color:var(--pl-accent)"><svg viewBox="0 0 300 120" preserveAspectRatio="none" role="img" aria-label="Aylık gelir, en yüksek Haziran 1.250 ₺">{AREA_DEFS}{"".join(f'<line class="a-grid" x1="0" x2="300" y1="{y}" y2="{y}"/>' for y in (20,50,80,110))}<path class="a-area" d="{area(v,300,120)}"/><path class="a-line" d="{smooth(v,300,120)}"/><line class="a-cursor" x1="163.6" x2="163.6" y1="0" y2="120"/><circle class="a-dot" cx="163.6" cy="{round(120-4-(v[6]-min(v))/(max(v)-min(v))*112,1)}" r="5"/></svg><div class="pl-charttip" style="left:54.5%;top:18%"><b>1.250 ₺</b>Haziran · +%22</div><div class="pl-areachart__x">{"".join(f'<span class="{"is-active" if m=="Haz" else ""}">{m}</span>' for m in ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"])}</div></div>''')([30,42,38,55,48,62,80,58,66,52,70,64]))

add(slug="appt-timeline", ad="Randevu Zaman Çizelgesi", kategori=K,
    kaynak="Pin 26 — 'Upcoming appointments' dikey çizelge ve açılır ayrıntı kartı",
    aciklama="Saat + düğüm + içerik; şu anki randevu aksan düğümlü ve altında ayrıntı kartı açılır.",
    ne_zaman="Günlük randevu, sıra, teslimat listesi.",
    siniflar="pl-apptl pl-apptl__row is-now pl-apptl__time pl-apptl__rail pl-apptl__body pl-apptl__card",
    a11y="<ol> listesi; şu anki öğe aria-current=\"time\".",
    html=f'''<ol class="pl-apptl" style="margin:0;padding:0;list-style:none"><li class="pl-apptl__row"><span class="pl-apptl__time">09:00</span><span class="pl-apptl__rail"><i></i></span><span class="pl-apptl__body"><b>Kontrol muayenesi</b><small>Ayşe K.</small></span></li>
<li class="pl-apptl__row is-now" aria-current="time"><span class="pl-apptl__time">10:00</span><span class="pl-apptl__rail"><i></i></span><span class="pl-apptl__body"><b>Diş temizliği</b><small>Mert A.</small><span class="pl-apptl__card"><span class="pl-row" style="justify-content:space-between"><b style="font-size:12px">Mert A.</b><span class="pl-badge pl-badge--success">Onaylı</span></span><small>10:00–10:45 · Oda 2</small><button class="pl-btn pl-btn--secondary pl-btn--sm">Randevuyu aç</button></span></span></li>
<li class="pl-apptl__row"><span class="pl-apptl__time">11:00</span><span class="pl-apptl__rail"><i></i></span><span class="pl-apptl__body"><b>Kanal tedavisi</b><small>Selin T.</small></span></li></ol>''')

# =====================================================================
#  G. CRM & İŞ
# =====================================================================
K = "CRM & İş"
add(slug="bpf-stepper", ad="İş Süreci Adımlayıcı", kategori=K, span=2,
    kaynak="Pin 31 — 'Qualify · Develop · Propose · Close' süreç akışı",
    aciklama="Kapsül içinde aşamalar: tamamlanan (yeşil onay), etkin (aksan dolgulu, süre bilgili), bekleyen.",
    ne_zaman="Satış hunisi, onboarding akışı, başvuru durumu.",
    durumlar=["tamamlandı", "etkin", "bekliyor"],
    siniflar="pl-bpf pl-bpf__stage is-done|is-active pl-bpf__sep pl-bpf__time",
    a11y="<ol> + aria-current=\"step\".",
    html=f'''<ol class="pl-bpf" style="margin:0;list-style:none"><li class="pl-bpf__stage is-done"><i>{I("check")}</i>Nitelendir</li><li class="pl-bpf__sep" aria-hidden="true"></li><li class="pl-bpf__stage is-active" aria-current="step"><i>2</i>Geliştir <span class="pl-bpf__time">3 gün</span></li><li class="pl-bpf__sep" aria-hidden="true"></li><li class="pl-bpf__stage"><i>3</i>Teklif</li><li class="pl-bpf__sep" aria-hidden="true"></li><li class="pl-bpf__stage"><i>4</i>Kapat</li></ol>''')

add(slug="score-gauge", ad="Skor Göstergesi", kategori=K,
    kaynak="Pin 31 — 'Lead Score 90' çentikli yarım daire",
    aciklama="Çentikli yarım daire yay; ortada büyük skor, altında değerlendirme etiketi.",
    ne_zaman="Müşteri adayı skoru, sağlık puanı, uyum skoru.",
    siniflar="pl-scoregauge pl-scoregauge__arc (--v) pl-scoregauge__val pl-scoregauge__lbl",
    a11y="role=\"meter\" aria-valuenow=\"90\" aria-valuemax=\"100\".",
    html='''<div style="display:grid;justify-items:center;gap:4px"><div class="pl-scoregauge" role="meter" aria-valuenow="90" aria-valuemin="0" aria-valuemax="100" aria-label="Aday skoru"><div class="pl-scoregauge__arc" style="--v:90"></div><span class="pl-scoregauge__val">90</span></div><span class="pl-badge pl-badge--success">A sınıfı · Sıcak aday</span></div>''')

add(slug="contact-card", ad="Kişi Ayrıntı Kartı", kategori=K, span=2,
    kaynak="Pin 31 — 'Gabriela Christiansen' kişi başlığı ve alanları",
    aciklama="Fotoğraf/inisyal, ad, durum rozetleri, eylem düğmeleri ve meta alanları ızgarası.",
    ne_zaman="CRM kaydı, müşteri profili, kişi ayrıntısı.",
    siniflar="pl-contact pl-contact__head pl-contact__photo pl-contact__name pl-contact__meta pl-contact__actions",
    a11y="Meta alanları <dl> olarak da kurulabilir.",
    html=f'''<div class="pl-contact"><div class="pl-contact__head"><span class="pl-contact__photo">ÜS</span><div style="flex:1"><h3 class="pl-contact__name">Ünal Soğukkuyu</h3><div class="pl-row"><span class="pl-badge pl-badge--accent">Karar verici</span><span class="pl-badge">İzmir</span></div></div><div class="pl-contact__actions"><button class="pl-iconbtn pl-iconbtn--outline" aria-label="Ara">{I("phone")}</button><button class="pl-iconbtn pl-iconbtn--outline" aria-label="E-posta">{I("mail")}</button><button class="pl-btn pl-btn--primary pl-btn--sm">{I("plus")}Görev</button></div></div>
<div class="pl-contact__meta"><div><small>Hesap</small>RENTAKAR Otomotiv</div><div><small>Sahip</small>Muhammed</div><div><small>Son temas</small>30.10.2026</div><div><small>Değer</small><span class="pl-num">184.000 ₺</span></div></div></div>''')

add(slug="work-queue", ad="İş Kuyruğu Listesi", kategori=K,
    kaynak="Pin 31 — 'My Work' etiketli kayıt listesi",
    aciklama="Avatar + ad + kısa not satırları; seçili kayıt aksan zeminli ve ok düğmeli.",
    ne_zaman="Atanmış işler, takip listesi, gelen kutusu.",
    durumlar=["varsayılan", "seçili", "okunmamış (kalın)"],
    siniflar="pl-queue pl-queue__item is-active pl-queue__go",
    a11y="role=\"listbox\"; Enter ile kaydı açar.",
    html=f'''<div class="pl-queue" role="listbox" aria-label="İşlerim">{"".join(f'<div class="pl-queue__item{" is-active" if a else ""}" role="option" aria-selected="{str(a).lower()}"><span class="pl-avatar">{i}</span><span><b>{n}</b><small>{s}</small></span>{f"<span class=pl-queue__go>{I("arrow-right")}</span>" if a else f"<span class=pl-badge>{t}</span>"}</div>' for i,n,s,a,t in [("ÜS","Ünal Soğukkuyu","Teklif bekliyor",True,""),("İK","İlhan K.","Takip araması",False,"Bugün"),("SV","Savaş V.","Sözleşme",False,"Yarın")])}</div>''')

add(slug="property-panel", ad="Mülk Özellik Paneli", kategori=K,
    kaynak="Pin 1 — fiyat, adres, '3 beds · 2 baths · 1,421 sqft' ve özellik çipleri",
    aciklama="Büyük fiyat, adres, 4'lü özellik şeridi ve ikonlu özellik çipi ızgarası.",
    ne_zaman="Emlak, araç kiralama (RENTAKAR), ürün teknik özet paneli.",
    siniflar="pl-property pl-property__price pl-property__addr pl-property__specs pl-property__feats",
    a11y="Özellik şeridi <dl>; birimler kısaltma değil tam okunur (aria-label).",
    html=f'''<div class="pl-property"><div><div class="pl-property__price">4.250.000 ₺</div><div class="pl-property__addr">Seyrek Mah. · Menemen / İzmir</div></div><div class="pl-property__specs"><div><b>2</b><small>Oda</small></div><div><b>1</b><small>Banyo</small></div><div><b>95</b><small>m²</small></div><div><b>4</b><small>Kat</small></div></div><div class="pl-property__feats"><span>{I("building")}Site içi</span><span>{I("car")}Otopark</span><span>{I("calendar")}2019 yapım</span><span>{I("zap")}Doğalgaz</span></div></div>''')

add(slug="valuation-calc", ad="Değerleme Hesaplayıcı", kategori=K,
    kaynak="Pin 1 — 'Valuation calculator' kaydırıcılı hesap kartı",
    aciklama="Parametre ızgarası, peşinat kaydırıcısı ve iki sonuç kutusu.",
    ne_zaman="Kredi/kira hesabı, fiyat simülasyonu, bütçe senaryosu.",
    siniflar="pl-calc pl-calc__grid pl-slider pl-calc__result",
    a11y="Kaydırıcı <input type=range> + <output>.",
    html='''<div class="pl-calc"><span class="pl-label">Değerleme hesaplayıcı</span><div class="pl-calc__grid"><div>Vade<b>120 ay</b></div><div>Faiz tipi<b>Sabit</b></div><div>Oran<b>%2,79</b></div></div><label class="pl-stack" style="gap:6px"><span class="pl-muted">Peşinat</span><input class="pl-slider" type="range" value="40" aria-valuetext="%40"></label><div class="pl-calc__result"><div><span class="pl-muted">Peşinat</span><b>1.700.000 ₺</b></div><div><span class="pl-muted">Aylık tahmini</span><b style="color:var(--pl-accent)">31.640 ₺</b></div></div></div>''')

add(slug="similar-row", ad="Benzer Kayıt Satırı", kategori=K,
    kaynak="Pin 1 — 'Similar properties' satırları",
    aciklama="Küçük görsel + fiyat + kısa açıklama; tüm satır bağlantı.",
    ne_zaman="Benzer ürünler, ilgili kayıtlar, öneri listesi.",
    siniflar="pl-simrow pl-simrow__img",
    a11y="<a> öğesi; görsel dekoratif.",
    html='''<div class="pl-stack" style="gap:6px"><a class="pl-simrow" href="#"><span class="pl-simrow__img"></span><span><b>3.890.000 ₺</b><small>1+1 · 80 m² · Seyrek</small><small>Bahçeli, otoparklı</small></span></a><a class="pl-simrow" href="#"><span class="pl-simrow__img" style="background:var(--pl-media-6)"></span><span><b>4.600.000 ₺</b><small>2+1 · 105 m² · Menemen</small><small>Site içi, havuzlu</small></span></a></div>''')

# =====================================================================
#  H. YARATICI ARAÇLAR
# =====================================================================
K = "Yaratıcı Araçlar"
add(slug="multitrack-timeline", ad="Çok İzli Zaman Çizelgesi", kategori=K, span=2,
    kaynak="Pinler 17, 21 — video/ses/metin izli kurgu zaman çizelgesi",
    aciklama="Cetvel, iz başlıkları (göz/kilit), renk kodlu klipler (video, ses dalgalı, metin, efekt), seçili klip sarı çerçeve ve turuncu oynatma kafası (--p).",
    ne_zaman="Video/ses kurgusu, animasyon, sunum zamanlaması, otomasyon akışı.",
    durumlar=["varsayılan", "klip seçili", "iz kilitli", "iz gizli"],
    siniflar="pl-tl pl-tl__ruler pl-tl__ticks pl-tl__track pl-tl__head pl-tl__lane pl-clip pl-clip--video|audio|text|fx is-selected pl-playhead (--p)",
    a11y="role=\"grid\"; klipler <button> + aria-label (ad, başlangıç, süre); ← → 1 kare, Shift ile 1 sn.",
    html=f'''<div class="pl-tl" role="grid" aria-label="Zaman çizelgesi"><div class="pl-tl__ruler"><span></span><div class="pl-tl__ticks">{"".join(f'<span style="left:{i*12.5}%">00:{i*4:02d}</span>' for i in range(8))}</div></div><div class="pl-tl__body">
<div class="pl-tl__track"><div class="pl-tl__head">{I("eye")}{I("lock")}V2</div><div class="pl-tl__lane"><button class="pl-clip pl-clip--text" style="--x:30%;--w:28%;border:0">{I("type")}Başlık · Gece Atölyesi</button></div></div>
<div class="pl-tl__track"><div class="pl-tl__head">{I("eye")}{I("lock")}V1</div><div class="pl-tl__lane"><button class="pl-clip pl-clip--video" style="--x:2%;--w:30%;border:0"><span class="pl-clip__thumb"></span>Giriş.mp4</button><button class="pl-clip pl-clip--video is-selected" style="--x:33%;--w:38%;border:0"><span class="pl-clip__thumb"></span>Atölye_Sahne_02.mp4</button><button class="pl-clip pl-clip--fx" style="--x:72%;--w:20%;border:0">Geçiş</button></div></div>
<div class="pl-tl__track"><div class="pl-tl__head">{I("volume")}{I("lock")}A1</div><div class="pl-tl__lane"><button class="pl-clip pl-clip--audio" style="--x:2%;--w:90%;border:0">Odak_LoFi.wav</button></div></div>
<span class="pl-playhead" style="--p:.47" aria-hidden="true"></span></div></div>''')

add(slug="transport", ad="Oynatma Kontrolleri", kategori=K,
    kaynak="Pinler 17, 21 — zaman kodu ve oynatma düğmeleri",
    aciklama="Zaman kodu (geçen / toplam), başa sar, kare geri, oynat, kare ileri, sona.",
    ne_zaman="Kurgu, kayıt oynatma, sunum provası.",
    siniflar="pl-transport pl-transport__tc .is-main",
    a11y="Boşluk tuşu oynat/duraklat; J-K-L kısayolları önerilir.",
    html=f'''<div class="pl-transport" role="toolbar" aria-label="Oynatma"><span class="pl-transport__tc">00:03:12:08 <small>/ 00:07:46</small></span><button aria-label="Başa">{I("skip-back")}</button><button aria-label="Geri sar">{I("rewind")}</button><button class="is-main" aria-label="Oynat">{I("play")}</button><button aria-label="İleri">{I("skip-forward")}</button><button aria-label="Ses">{I("volume")}</button></div>''')

add(slug="media-bin", ad="Medya Kutusu Izgarası", kategori=K,
    kaynak="Pin 21 — 'Master Sequence' medya kutusu küçük resimleri",
    aciklama="Süre etiketli küçük resim ızgarası; seçili öğe aksan çerçeveli.",
    ne_zaman="Kurgu proje medyası, varlık kitaplığı, ekran görüntüsü arşivi.",
    siniflar="pl-bin pl-bin__item is-selected pl-bin__thumb",
    a11y="role=\"listbox\" + aria-multiselectable.",
    html='<div class="pl-bin" role="listbox" aria-multiselectable="true" aria-label="Medya">' + "".join(f'<div class="pl-bin__item{" is-selected" if i==1 else ""}" role="option" aria-selected="{str(i==1).lower()}"><div class="pl-bin__thumb" style="background:var(--pl-media-{(i%6)+1})"><span>{d}</span></div><b>{n}</b></div>' for i,(n,d) in enumerate([("Giriş","0:12"),("Atölye 02","0:48"),("Röportaj","3:21"),("B-roll","1:05"),("Kapanış","0:20"),("Logo","0:04")])) + '</div>')

add(slug="node-graph", ad="Düğüm Grafiği", kategori=K, span=2,
    kaynak="Pin 14 — AI karakter üretim akışındaki girdi/çıktı düğümleri",
    aciklama="Noktalı tuval, giriş/çıkış portlu düğüm kartları ve bezier bağlantılar; canlı bağlantı aksan renkli ışıyan.",
    ne_zaman="AI iş akışı (MyMind), otomasyon, veri dönüştürme hattı.",
    durumlar=["varsayılan", "düğüm seçili", "çalışıyor (canlı bağlantı)", "hata (kırmızı başlık noktası)"],
    siniflar="pl-nodes pl-node (--x, --y) is-selected pl-node__head pl-node__body pl-node__port pl-node__port--out",
    a11y="Tuval role=\"application\" + düğüm listesi alternatifi; Tab ile düğümler, Enter ile port bağlama.",
    html='''<div class="pl-nodes" role="application" aria-label="İş akışı"><svg aria-hidden="true"><path d="M170 70 C230 70 230 60 290 60"/><path class="is-live" d="M170 150 C230 150 230 95 290 95"/><path class="is-live" d="M440 80 C490 80 490 130 540 130"/></svg>
<div class="pl-node" style="--x:20px;--y:40px"><div class="pl-node__head"><i></i>Metin</div><div class="pl-node__body">Gözlüklü, sırt çantalı karakter<div class="pl-node__port pl-node__port--out" style="--c:var(--pl-viz-2)">metin</div></div></div>
<div class="pl-node" style="--x:20px;--y:128px"><div class="pl-node__head"><i></i>Referans</div><div class="pl-node__body"><div class="pl-node__port pl-node__port--out" style="--c:var(--pl-viz-3)">görsel</div></div></div>
<div class="pl-node is-selected" style="--x:290px;--y:36px"><div class="pl-node__head"><i></i>MyMind · Üret</div><div class="pl-node__body"><div class="pl-node__port" style="--c:var(--pl-viz-2)">istem</div><div class="pl-node__port" style="--c:var(--pl-viz-3)">stil</div><div class="pl-node__port pl-node__port--out" style="--c:var(--pl-viz-1)">model</div></div></div>
<div class="pl-node" style="--x:540px;--y:110px;width:120px"><div class="pl-node__head"><i></i>Çıktı</div><div class="pl-node__body"><div class="pl-node__port" style="--c:var(--pl-viz-1)">3B</div></div></div></div>''')

add(slug="waveform", ad="Ses Dalga Çubuğu", kategori=K,
    kaynak="Pinler 14, 17 — ses izi dalga çubukları",
    aciklama="Dikey çubuklardan oluşan dalga; çalınan bölüm aksan renginde.",
    ne_zaman="Sesli not, podcast, kurgu ses izi, ses kaydı önizlemesi.",
    siniflar="pl-waveform > i (--v) .is-played",
    a11y="role=\"slider\" ile konum; dalga aria-hidden.",
    html='<div class="pl-waveform" role="slider" aria-valuenow="40" aria-valuetext="0:48 / 2:00">' + "".join(f'<i style="--v:{v}" class="{"is-played" if i<24 else ""}"></i>' for i,v in enumerate(bars(11, 60, 12, 100))) + '</div>')

add(slug="layer-list", ad="Katman Listesi", kategori=K,
    kaynak="Pin 22 — sol katman paneli",
    aciklama="Girintili (--d) katman satırları; tür ikonu, seçili satır aksan çerçeveli, hover'da göz/kilit eylemleri.",
    ne_zaman="Tasarım/kurgu editörleri, belge ana hattı, ağaç yapısı.",
    siniflar="pl-layers pl-layer (--d) is-selected pl-layer__act",
    a11y="role=\"tree\" + role=\"treeitem\" + aria-level.",
    html=f'''<div class="pl-layers" role="tree" aria-label="Katmanlar">{"".join(f'<div class="pl-layer{" is-selected" if s else ""}" role="treeitem" aria-level="{d+1}" style="--d:{d}">{I(ic)}{n}<span class="pl-layer__act">{I("eye")}{I("lock")}</span></div>' for ic,n,d,s in [("layers","Kapak",0,False),("square","Arka plan",1,False),("image","Fotoğraf",1,True),("type","Başlık",1,False),("type","Alt başlık",1,False),("layers","Sayfa 2",0,False)])}</div>''')

add(slug="page-strip", ad="Sayfa Film Şeridi", kategori=K,
    kaynak="Pin 22 — alttaki sayfa küçük resimleri",
    aciklama="Numaralı sayfa küçük resimleri ve ekleme düğmesi; etkin sayfa aksan çerçeveli.",
    ne_zaman="Çok sayfalı tasarım, sunum, karusel gönderi düzenleme.",
    siniflar="pl-pagestrip pl-pagestrip__p is-active pl-pagestrip__add",
    a11y="role=\"tablist\"; sürükle-bırak için klavye alternatifi (Alt+←/→).",
    html=f'''<div class="pl-pagestrip" role="tablist" aria-label="Sayfalar">{"".join(f'<button class="pl-pagestrip__p{" is-active" if i==1 else ""}" role="tab" aria-selected="{str(i==1).lower()}" style="background:var(--pl-media-{i+2})"><span>{i+1}</span></button>' for i in range(4))}<button class="pl-pagestrip__add" aria-label="Sayfa ekle">{I("plus")}</button></div>''')

add(slug="context-submenu", ad="Alt Menülü Bağlam Menüsü", kategori=K, span=2,
    kaynak="Pin 22 — sağ tık menüsü ve açılan alt menü",
    aciklama="PLC-034 menüsünün genişletmesi: açık alt menü öğesi aksan dolgulu, yanında ikinci seviye menü.",
    ne_zaman="Editörlerde nesne sağ tık menüsü.",
    siniflar="pl-ctxmenu pl-menu pl-menuitem is-open pl-ctxmenu__sub",
    a11y="role=\"menu\"/\"menuitem\"; aria-haspopup + aria-expanded; → alt menüyü açar, ← kapatır.",
    html=f'''<div class="pl-ctxmenu"><div class="pl-menu" role="menu"><button class="pl-menuitem" role="menuitem">{I("copy")}Çoğalt<span class="pl-menuitem__meta">Ctrl D</span></button><button class="pl-menuitem" role="menuitem">{I("layers")}Gruplandır<span class="pl-menuitem__meta">Ctrl G</span></button><button class="pl-menuitem is-open" role="menuitem" aria-haspopup="true" aria-expanded="true">{I("sparkles")}Efekt uygula<span class="pl-menuitem__meta">{I("chevron-right")}</span></button><button class="pl-menuitem" role="menuitem">{I("lock")}Kilitle</button><div class="pl-divider"></div><button class="pl-menuitem pl-menuitem--danger" role="menuitem">{I("archive")}Arşivle</button></div>
<div class="pl-menu pl-ctxmenu__sub" role="menu"><button class="pl-menuitem" role="menuitem">Gölge</button><button class="pl-menuitem" role="menuitem">Bulanıklaştır</button><button class="pl-menuitem" role="menuitem">Işıma</button><button class="pl-menuitem" role="menuitem">Gürültü</button></div></div>''')
