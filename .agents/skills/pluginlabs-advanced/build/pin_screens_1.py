"""Pin ekranları 1 — Pin 0, 1, 2, 4, 5, 6, 7, 8"""
from pin_base import screen, ph, face, rail, dots, sw, iso_house, iso_floor, I, smooth, area, bars

# ------------------------------------------------------------------ PIN 6
screen(pin=6, ad="Akıllı Ev — 3B Kontrol Merkezi", urun="flowdock",
  aciklama="Sıcak kahverengi sahnede izometrik ev, ev üzerinde sıcaklık/nem cam kartı, sağda oda görüntüsü ve cihaz anahtarları, altta ev üyeleri.",
  sahne="rgb(38 170 150)",
  css='''
.pl-s06 { width: 1120px; background: radial-gradient(70% 80% at 45% 40%, rgb(92 52 34), rgb(26 18 14) 70%); color: var(--pl-fg-2); display: grid; grid-template-columns: 1fr 300px; gap: 14px; padding: 18px; }
.pl-s06-main { position: relative; min-height: 640px; display: flex; flex-direction: column; }
.pl-s06-top { display: flex; align-items: center; gap: 10px; }
.pl-s06-home { display: flex; gap: 10px; align-items: center; }
.pl-s06-home b { color: var(--pl-fg-1); font-size: 13px; display: block; }
.pl-s06-chip { display: inline-flex; align-items: center; gap: 12px; height: 36px; padding: 0 12px; border-radius: 12px; background: rgb(255 255 255 / .06); border: 1px solid rgb(255 255 255 / .08); font-family: var(--pl-font-mono); font-size: 11px; color: var(--pl-fg-1); }
.pl-s06-side { position: absolute; left: 0; top: 96px; display: grid; gap: 8px; }
.pl-s06-side button { width: 36px; height: 36px; border-radius: 10px; background: rgb(255 255 255 / .05); border: 1px solid rgb(255 255 255 / .1); color: var(--pl-fg-3); display: grid; place-items: center; }
.pl-s06-side button.is-active { background: var(--pl-accent); color: var(--pl-fg-on-accent); border-color: transparent; box-shadow: var(--pl-glow-accent); }
.pl-s06-scene { flex: 1; position: relative; margin: 10px 30px 0 60px; }
.pl-s06-sensor { position: absolute; left: 34%; top: 26%; width: 210px; padding: 10px; border-radius: 14px; background: rgb(20 16 14 / .72); border: 1px solid rgb(255 255 255 / .1); backdrop-filter: blur(10px); display: grid; gap: 10px; }
.pl-s06-srow { display: grid; grid-template-columns: 22px 1fr auto; gap: 4px 8px; align-items: center; font-size: 11px; color: var(--pl-fg-1); }
.pl-s06-srow small { grid-column: 2; color: var(--pl-fg-3); font-size: 9px; }
.pl-s06-srow b { font-family: var(--pl-font-mono); font-size: 11px; color: var(--pl-warning); grid-row: span 2; align-self: end; }
.pl-s06-srow .pl-sensor__dots { grid-column: 2; }
.pl-s06-srow .pl-sensor__dots i.is-on { background: var(--pl-warning); }
.pl-s06-srow.is-cyan b, .pl-s06-srow.is-cyan .pl-sensor__dots i.is-on { color: var(--pl-accent); background: var(--pl-accent); }
.pl-s06-srow.is-cyan b { background: none; }
.pl-s06-people { display: flex; gap: 8px; align-items: center; }
.pl-s06-person { display: flex; align-items: center; gap: 8px; padding: 7px 14px 7px 7px; border-radius: 14px; background: rgb(255 255 255 / .06); border: 1px solid rgb(255 255 255 / .08); }
.pl-s06-person b { display: block; color: var(--pl-fg-1); font-size: 11px; }
.pl-s06-person small { color: var(--pl-accent); font-size: 9px; }
.pl-s06-person.is-away small { color: var(--pl-fg-4); }
.pl-s06-lock { margin-left: auto; display: grid; justify-items: center; gap: 4px; font-size: 9px; color: var(--pl-fg-3); }
.pl-s06-aside { display: grid; gap: 8px; align-content: start; }
.pl-s06-panel { border-radius: 18px; background: rgb(14 12 12 / .85); border: 1px solid rgb(255 255 255 / .06); padding: 12px; }
.pl-s06-room { display: grid; gap: 10px; }
.pl-s06-room header { display: flex; align-items: center; gap: 10px; }
.pl-s06-room header b { color: var(--pl-fg-1); font-size: 15px; display: block; }
.pl-s06-ric { width: 34px; height: 34px; border-radius: 10px; background: var(--pl-accent); color: var(--pl-fg-on-accent); display: grid; place-items: center; }
.pl-s06-dev { display: grid; grid-template-columns: 26px 1fr auto; gap: 2px 10px; align-items: center; }
.pl-s06-dev b { color: var(--pl-fg-1); font-size: 12px; font-weight: 600; }
.pl-s06-dev small { grid-column: 2; font-size: 9px; color: var(--pl-fg-3); display: flex; gap: 6px; align-items: center; }
.pl-s06-dev .pl-switch { grid-row: span 2; }
.pl-s06-dev .pl-devtile__meter { grid-column: 2 / -1; }
.pl-s06-music { position: relative; overflow: hidden; padding: 12px 12px 0; }
.pl-s06-disc { width: 120px; height: 120px; border-radius: 50%; margin: 6px auto -40px; background: radial-gradient(circle at 50% 38%, rgb(240 200 170) 0 18%, transparent 19%), radial-gradient(circle at 50% 30%, rgb(220 60 60) 0 30%, transparent 31%), radial-gradient(circle, rgb(230 40 60), rgb(150 10 30)); }
.pl-s06-np { position: relative; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 10px; padding: 10px 0 12px; background: linear-gradient(transparent, rgb(14 12 12) 30%); }
.pl-s06-np b { color: var(--pl-accent); font-size: 11px; }
.pl-s06-np small { font-size: 9px; color: var(--pl-fg-3); }
''',
  html=f'''<div class="pl-s06" data-pl-product="flowdock">
<div class="pl-s06-main">
  <div class="pl-s06-top"><div class="pl-s06-home">{face(6, 34)}<div><b>Akıllı Ev</b><span class="pl-sx-muted">01.11.2026</span></div><span class="pl-sx-muted">⋮</span></div><span style="flex:1"></span>
  <span class="pl-s06-chip">{I("wind") if False else I("cloud")}11°C <span style="opacity:.3">|</span>{I("droplet")}%67 {I("chevron-right")}</span><span class="pl-s06-chip">{I("clock")}20:31</span></div>
  <div class="pl-s06-side">{"".join(f'<button class="{"is-active" if i==2 else ""}" aria-label="{ic}">{I(ic)}</button>' for i,ic in enumerate(["home","bed","tv","bath","building","grid","car"]))}</div>
  <div class="pl-s06-scene">{iso_house()}
    <div class="pl-s06-sensor"><div class="pl-s06-srow"><span>{I("thermo")}</span>Sıcaklık<b>22°C</b><small>Optimum 20–24 °C</small>{dots(14,10)}</div><div class="pl-s06-srow is-cyan"><span>{I("droplet")}</span>Nem<b>%55</b><small>Optimum %40–60</small>{dots(14,8)}</div></div>
  </div>
  <div class="pl-s06-people">{"".join(f'<div class="pl-s06-person{" is-away" if not h else ""}">{face(s,30)}<span><b>{n}</b><small>{"Evde" if h else "Dışarıda"}</small></span></div>' for s,n,h in [(11,"Muhammed Y.",True),(12,"Yalçın D.",True),(13,"Ünal S.",False),(14,"İlhan K.",True)])}
  <div class="pl-s06-lock"><span class="pl-sx-ibtn">{I("lock")}</span>Kilitli</div></div>
</div>
<aside class="pl-s06-aside">
  <div class="pl-s06-panel pl-s06-room"><header><span class="pl-s06-ric">{I("tv")}</span><div style="flex:1"><b>Salon</b><span class="pl-sx-muted">42 m²</span></div>{I("chevron-right")}</header><div style="height:130px;border-radius:12px;overflow:hidden">{ph("fire")}</div>
  <div class="pl-s06-dev"><span>{I("camera")}</span><b>Kamera</b>{sw()}<small><span class="pl-badge pl-badge--success" style="height:14px;font-size:8px;padding:0 4px">●</span>%82</small></div></div>
  <div class="pl-s06-panel pl-s06-dev"><span>{I("bulb")}</span><b>Aydınlatma</b>{sw()}<small>Avize, Dimmer</small><span class="pl-devtile__meter">{"".join(f'<i class="{"is-on" if i<16 else ""}" style="height:3px"></i>' for i in range(24))}</span></div>
  <div class="pl-s06-panel pl-s06-dev"><span>{I("fan")}</span><b>Robot süpürge</b>{sw(False)}<small>%58 şarj</small></div>
  <div class="pl-s06-panel pl-s06-music"><div class="pl-s06-dev"><span>{I("music")}</span><b>Ses sistemi</b>{sw()}<small>Salon · 22:39</small></div><div class="pl-s06-disc"></div><div class="pl-s06-np"><b>Gece Yolculuğu</b><button class="pl-player__btn pl-player__btn--main" style="grid-row:span 2" aria-label="Duraklat">{I("pause")}</button><small>Atlas Ekibi · Kuzey</small></div></div>
</aside></div>''')

# ------------------------------------------------------------------ PIN 0
screen(pin=0, ad="Akıllı Ev — Renkli Kat Planı (TV)", urun="hub",
  aciklama="Televizyon arayüzünde üst sekmeler, sol cihaz durumu listesi, ortada renk kodlu oda planı ve oda üstü cihaz ikonları.",
  sahne="rgb(250 250 252)",
  css='''
.pl-s00 { width: 1100px; background: linear-gradient(180deg, rgb(22 34 58), rgb(14 22 40)); padding: 14px 20px 20px; color: var(--pl-fg-2); border: 10px solid rgb(18 18 22); border-radius: 18px; }
.pl-s00-top { display: flex; align-items: center; gap: 12px; }
.pl-s00-logo { display: flex; align-items: center; gap: 8px; color: var(--pl-fg-1); font-weight: 700; font-size: 18px; }
.pl-s00-logo i { width: 26px; height: 26px; border-radius: 50%; background: radial-gradient(circle, rgb(120 200 255), rgb(40 120 220)); display: block; }
.pl-s00-tabs { display: flex; justify-content: space-around; margin: 14px -20px 0; border-bottom: 1px solid rgb(255 255 255 / .08); }
.pl-s00-tabs button { background: none; border: 0; color: var(--pl-fg-2); font: inherit; font-size: 12px; padding: 10px 24px; display: flex; gap: 8px; align-items: center; border-bottom: 2px solid transparent; }
.pl-s00-tabs .is-active { color: rgb(120 200 255); border-color: rgb(120 200 255); }
.pl-s00-body { display: grid; grid-template-columns: 200px 1fr; gap: 20px; padding-top: 14px; }
.pl-s00-list { display: grid; gap: 8px; align-content: start; }
.pl-s00-st { display: grid; grid-template-columns: 20px 1fr; gap: 0 8px; padding: 8px; border-radius: 8px; background: rgb(255 255 255 / .04); font-size: 11px; color: var(--pl-fg-1); }
.pl-s00-st small { grid-column: 2; color: var(--pl-fg-3); font-size: 10px; }
.pl-s00-plan { position: relative; height: 420px; display: grid; place-items: center; }
.pl-s00-bar { position: absolute; top: 0; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
.pl-s00-bar span { display: inline-flex; gap: 6px; align-items: center; height: 28px; padding: 0 12px; border-radius: 14px; background: rgb(255 255 255 / .06); font-size: 11px; color: var(--pl-fg-1); }
.pl-s00-dev { position: absolute; width: 22px; height: 22px; border-radius: 50%; background: rgb(255 255 255); color: rgb(30 60 120); display: grid; place-items: center; box-shadow: 0 4px 10px rgb(0 0 0 / .4); }
.pl-s00-dev .pl-ico { width: 12px; height: 12px; }
.pl-s00-stand { width: 160px; height: 26px; margin: 0 auto; background: linear-gradient(rgb(120 124 130), rgb(70 72 76)); clip-path: polygon(20% 0, 80% 0, 100% 100%, 0 100%); }
''',
  html=f'''<div><div class="pl-s00">
<div class="pl-s00-top"><span class="pl-s00-logo"><i></i>PluginLabs Home</span><span style="flex:1"></span><select class="pl-select" style="width:140px;height:28px"><option>Evim</option></select><span class="pl-sx-ibtn">{I("plus")}</span><span class="pl-sx-ibtn">{I("user")}</span><span class="pl-sx-ibtn">{I("settings")}</span></div>
<div class="pl-s00-tabs"><button>{I("star")}Favoriler</button><button class="is-active">{I("grid")}Cihazlar</button><button>{I("home")}Yaşam</button><button>{I("play")}Rutinler</button></div>
<div class="pl-s00-body"><div class="pl-s00-list"><div class="pl-segment" style="width:max-content"><button>{I("grid")}</button><button>2D</button><button class="is-active">3D</button></div><select class="pl-select" style="height:28px"><option>Tüm odalar</option></select><span class="pl-sx-kicker">Ev durumu</span>
{"".join(f'<div class="pl-s00-st"><span>{I(ic)}</span>{t}<small>{s}</small></div>' for ic,t,s in [("bulb","Işık","6 açık"),("thermo","Sıcaklık","24–26 °C"),("zap","Enerji","20,5 kWh"),("camera","Kamera","4 açık")])}<button class="pl-btn pl-btn--secondary pl-btn--sm">Haritayı düzenle</button></div>
<div class="pl-s00-plan"><div class="pl-s00-bar"><span>{I("clock")}Film zamanı</span><span>{I("briefcase")}Çalışma</span><span>{I("star")}Parti zamanı</span></div>
{iso_floor([(1,1,2,2,"rgb(255 160 200)","YATAK"),(3,1,2,1,"rgb(120 220 160)","BANYO"),(5,1,2,2,"rgb(110 220 230)","MUTFAK"),(3,2,2,2,"rgb(255 220 110)","SALON"),(1,3,2,2,"rgb(170 150 255)","ÇOCUK"),(5,3,2,2,"rgb(150 230 120)","ÇALIŞMA")], 460, 300)}
{"".join(f'<span class="pl-s00-dev" style="left:{x}%;top:{y}%">{I(ic)}</span>' for x,y,ic in [(30,40,"bulb"),(46,30,"tv"),(60,46,"fan"),(52,62,"bulb"),(70,36,"thermo"),(38,60,"camera"),(64,70,"wifi")])}</div></div>
</div><div class="pl-s00-stand"></div></div>''')

# ------------------------------------------------------------------ PIN 1
screen(pin=1, ad="Emlak — 3B Daire Görüntüleyici",
  aciklama="Koyu lacivert ekran: solda ince ray, ortada kesit 3B daire ve küçük kat planı, oda etiketi; sağda fiyat, özellikler, değerleme hesaplayıcı ve benzer ilanlar.",
  sahne="rgb(10 12 20)",
  css='''
.pl-s01 { width: 1120px; height: 700px; display: grid; grid-template-columns: 44px 1fr 340px; background: rgb(20 26 44); color: var(--pl-fg-2); }
.pl-s01 .pl-rail { width: 44px; background: rgb(12 16 28); padding: 12px 0; gap: 6px; border: 0; }
.pl-s01 .pl-rail__item { width: 32px; height: 32px; } .pl-s01 .pl-rail__item.is-active::before { left: -6px; }
.pl-s01-view { position: relative; background: radial-gradient(70% 70% at 45% 55%, rgb(60 74 120), rgb(24 30 52) 70%); overflow: hidden; }
.pl-s01-apt { position: absolute; left: 50%; top: 54%; width: 560px; height: 400px; transform: translate(-50%, -50%) rotateX(56deg) rotateZ(-38deg); display: grid; grid-template-columns: 1.3fr 1fr 1fr; grid-template-rows: 1fr 1fr 1.1fr; gap: 6px; padding: 6px; background: rgb(200 205 215); box-shadow: 30px 30px 0 rgb(10 14 26 / .6), 0 0 0 10px rgb(40 46 64); }
.pl-s01-rm { background: linear-gradient(135deg, rgb(160 120 90), rgb(110 80 60)); position: relative; box-shadow: inset 0 0 0 3px rgb(230 232 238); }
.pl-s01-rm::after { content: ""; position: absolute; inset: 20% 18%; border-radius: 4px; background: var(--f, rgb(220 220 225)); box-shadow: 0 8px 0 rgb(0 0 0 / .25); }
.pl-s01-rm.is-lit { box-shadow: inset 0 0 0 3px rgb(230 232 238), inset 0 0 60px rgb(255 200 120 / .55); }
.pl-s01-tag { position: absolute; left: 22%; top: 18%; font-size: 9px; color: var(--pl-fg-1); }
.pl-s01-tag::after { content: ""; position: absolute; left: -24px; top: 18px; width: 24px; height: 60px; border-left: 1px dashed rgb(255 255 255 / .5); border-top: 1px dashed rgb(255 255 255 / .5); }
.pl-s01-mini { position: absolute; right: 24px; top: 20px; display: flex; gap: 10px; align-items: flex-start; font-size: 10px; color: var(--pl-fg-2); }
.pl-s01-mini svg { width: 90px; height: 90px; }
.pl-s01-mini svg path { fill: none; stroke: rgb(220 226 240 / .8); stroke-width: 1.2; }
.pl-s01-counts { position: absolute; left: 12px; bottom: 16px; display: grid; gap: 6px; }
.pl-s01-counts span { display: flex; gap: 8px; align-items: center; font-size: 10px; color: var(--pl-fg-1); }
.pl-s01-counts b { width: 22px; height: 22px; border-radius: 6px; display: grid; place-items: center; background: rgb(255 255 255 / .08); font-family: var(--pl-font-mono); font-weight: 500; }
.pl-s01-modes { position: absolute; right: 14px; bottom: 16px; display: flex; gap: 6px; }
.pl-s01-modes button { width: 58px; height: 52px; border-radius: 8px; border: 1px solid rgb(255 255 255 / .12); background: rgb(255 255 255 / .06); color: var(--pl-fg-1); font: inherit; font-size: 9px; display: grid; place-items: center; gap: 2px; }
.pl-s01-modes .is-active { background: rgb(240 242 248); color: rgb(20 26 44); }
.pl-s01-side { background: rgb(26 32 52); padding: 18px; display: grid; gap: 12px; align-content: start; overflow: hidden; border-left: 1px solid rgb(255 255 255 / .06); }
.pl-s01-price { font-size: 26px; font-weight: 600; color: var(--pl-fg-1); }
.pl-s01-specs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.pl-s01-specs div { border: 1px solid rgb(255 255 255 / .12); border-radius: 6px; padding: 6px 8px; }
.pl-s01-specs b { display: block; font-size: 18px; color: var(--pl-fg-1); font-weight: 500; }
.pl-s01-specs small { font-size: 10px; color: var(--pl-fg-2); }
.pl-s01-feats { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.pl-s01-feats span { display: flex; gap: 6px; align-items: center; font-size: 10px; color: var(--pl-fg-1); padding: 6px 8px; border-radius: 6px; background: rgb(255 255 255 / .06); }
.pl-s01-feats .pl-ico { color: rgb(120 160 255); width: 13px; height: 13px; }
.pl-s01-h { font-family: var(--pl-font-mono); font-size: 10px; letter-spacing: .08em; color: var(--pl-fg-1); text-transform: uppercase; border-top: 1px solid rgb(255 255 255 / .08); padding-top: 12px; }
.pl-s01-calc { background: rgb(255 255 255 / .05); border-radius: 8px; padding: 10px; display: grid; gap: 10px; font-size: 10px; }
.pl-s01-calc .pl-calc__grid b { font-size: 11px; font-family: var(--pl-font-sans); font-weight: 500; }
.pl-s01-cta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pl-s01-cta .pl-btn { height: 30px; font-size: 11px; border-radius: 4px; }
.pl-s01-sim { display: grid; grid-template-columns: 90px 1fr; gap: 10px; }
.pl-s01-sim b { color: var(--pl-fg-1); font-size: 18px; font-weight: 500; display: block; }
''',
  html=f'''<div class="pl-s01" data-pl-product="extman">{rail(["home","compass","layers","grid"], 0, bottom=("user",))}
<div class="pl-s01-view"><button class="pl-sx-ibtn" style="position:absolute;left:14px;top:14px;border-radius:8px;width:28px;height:28px" aria-label="Geri">{I("chevron-left")}</button>
<div class="pl-s01-apt">{"".join(f'<div class="pl-s01-rm{" is-lit" if l else ""}" style="--f:{f}{";grid-row:span 2" if i==0 else ""}"></div>' for i,(l,f) in enumerate([(True,"rgb(200 200 205)"),(False,"rgb(230 230 236)"),(True,"rgb(240 236 230)"),(False,"rgb(180 170 160)"),(True,"rgb(210 214 222)"),(False,"rgb(236 236 240)"),(True,"rgb(150 140 130)"),(False,"rgb(220 220 226)")]))}</div>
<span class="pl-s01-tag">ANA SALON<br><span style="opacity:.6">28 m²</span></span>
<div class="pl-s01-mini"><span>Görünüm<br><b style="color:var(--pl-fg-1);font-weight:500">Kat planı ↗</b></span><svg viewBox="0 0 90 90" aria-hidden="true"><path d="M5 5H85V85H5Z M5 40H40V5 M40 40V85 M40 55H85 M60 5V55 M20 40V60H40"/></svg></div>
<div class="pl-s01-counts"><span><b>2</b>{I("bed")}</span><span><b>2</b>{I("bath")}</span><span><b>1</b>{I("car")}</span></div>
<div class="pl-s01-modes"><button>{I("image")}Galeri 18</button><button>{I("user")}Sokak</button><button class="is-active">{I("map-pin")}Harita</button></div></div>
<aside class="pl-s01-side"><div><div class="pl-s01-price">4.250.000 ₺</div><span class="pl-sx-muted">Bostanlı Mah. 1810 Sk. No 4 · Karşıyaka / İzmir</span></div>
<div class="pl-s01-specs"><div><b>3</b><small>oda</small></div><div><b>2</b><small>banyo</small></div><div><b>132</b><small>m²</small></div><div><b>B</b><small>sınıf</small></div></div>
<div class="pl-s01-feats"><span>{I("building")}Apartman dairesi</span><span>{I("tag")}32.200 ₺/m²</span><span>{I("dollar")}1.850 ₺ aidat</span><span>{I("calendar")}2009 yapım</span></div>
<div class="pl-s01-h">[ Değerleme hesaplayıcı ]</div>
<div class="pl-s01-calc"><div class="pl-calc__grid"><div>Vade<b>15 yıl</b></div><div>Faiz tipi<b>Sabit</b></div><div>Oran<b>%2,79</b></div></div><span>Peşinat</span><input class="pl-slider" type="range" value="42"><div class="pl-calc__result"><div><span class="pl-sx-muted">Peşinat</span><b style="font-size:18px">1.785.000 ₺</b></div><div><span class="pl-sx-muted">Aylık tahmini</span><b style="font-size:18px">16.640 ₺</b></div></div></div>
<div class="pl-s01-cta"><button class="pl-btn pl-btn--primary" style="background:rgb(60 100 220);color:white">Gezi talep et</button><button class="pl-btn pl-btn--secondary">Danışmanla görüş</button></div><span class="pl-sx-muted">{I("clock")} en erken bugün 11:00</span>
<div class="pl-s01-h">[ Benzer ilanlar ]</div><div class="pl-s01-sim"><div style="height:64px;border-radius:6px;overflow:hidden">{ph("ice")}</div><div><b>3.890.000 ₺</b><span class="pl-sx-muted">1033 Sk. No 2, Mavişehir · 2+1 · 110 m²</span></div></div></aside></div>''')

# ------------------------------------------------------------------ PIN 2
screen(pin=2, ad="Akış Uygulaması — TV Ana Ekranı",
  aciklama="Siyah ince ray, tam genişlik sinematik kahraman, kategori etiketi, büyük harfli başlık, Yeni/yıl/yaş/kalite meta, yatay poster rafı ve 'Yeni eklendi' şeritleri.",
  sahne="rgb(0 0 0)",
  css='''
.pl-s02 { width: 1120px; height: 630px; position: relative; background: rgb(0 0 0); overflow: hidden; display: flex; }
.pl-s02-rail { width: 48px; display: grid; align-content: center; gap: 22px; justify-items: center; color: rgb(220 220 225); position: relative; z-index: 2; background: linear-gradient(90deg, rgb(0 0 0), transparent); }
.pl-s02-rail .is-active { color: rgb(255 255 255); position: relative; } .pl-s02-rail .is-active::before { content: ""; position: absolute; left: -16px; top: -4px; bottom: -4px; width: 3px; background: var(--pl-live); }
.pl-s02-bg { position: absolute; inset: 0; background: radial-gradient(60% 70% at 72% 30%, rgb(255 170 110 / .55), transparent 60%), linear-gradient(180deg, rgb(70 76 100) 0%, rgb(40 34 40) 60%, rgb(0 0 0) 100%); }
.pl-s02-bg::before { content: ""; position: absolute; right: 18%; top: 4%; width: 60px; height: 360px; background: linear-gradient(rgb(40 40 50), rgb(20 20 26)); clip-path: polygon(46% 0, 54% 0, 70% 60%, 100% 100%, 0 100%, 30% 60%); opacity: .8; }
.pl-s02-bg::after { content: ""; position: absolute; left: 20%; right: 0; top: 46%; height: 30%; background: linear-gradient(rgb(110 90 80), rgb(50 40 36)); clip-path: polygon(0 30%, 100% 0, 100% 100%, 0 100%); }
.pl-s02-scrim { position: absolute; inset: 0; background: linear-gradient(90deg, rgb(0 0 0 / .85), transparent 55%), linear-gradient(0deg, rgb(0 0 0), transparent 50%); }
.pl-s02-main { position: relative; z-index: 1; padding: 40px 24px 0; flex: 1; min-width: 0; display: flex; flex-direction: column; }
.pl-s02-kick { display: flex; gap: 6px; align-items: center; font-size: 10px; letter-spacing: .3em; color: rgb(220 220 225); font-weight: 700; }
.pl-s02-kick b { color: var(--pl-live); font-size: 18px; letter-spacing: 0; }
.pl-s02-t1 { font-size: 20px; font-weight: 800; color: rgb(255 255 255); text-transform: uppercase; letter-spacing: .02em; margin-top: 4px; }
.pl-s02-t2 { font-size: 40px; line-height: 1; font-weight: 800; color: rgb(255 255 255); text-transform: uppercase; letter-spacing: -.01em; margin: 0; }
.pl-s02-meta { display: flex; gap: 8px; align-items: center; margin: 10px 0; font-size: 12px; color: rgb(220 220 225); }
.pl-s02-meta b { color: rgb(70 210 110); }
.pl-s02-meta span { border: 1px solid rgb(255 255 255 / .5); padding: 0 6px; border-radius: 3px; font-size: 11px; }
.pl-s02-meta span.is-fill { background: rgb(255 255 255 / .25); border-color: transparent; }
.pl-s02-desc { max-width: 400px; color: rgb(230 230 235); font-size: 12.5px; line-height: 1.5; margin: 0; }
.pl-s02-shelf { margin-top: auto; padding-bottom: 8px; }
.pl-s02-shelf h4 { margin: 0 0 26px; color: rgb(255 255 255); font-size: 14px; font-weight: 600; }
.pl-s02-row { display: flex; gap: 10px; }
.pl-s02-p { width: 112px; height: 150px; border-radius: 4px; position: relative; overflow: hidden; flex: none; }
.pl-s02-p.is-focus { width: 128px; height: 168px; margin-top: -18px; box-shadow: 0 0 0 3px rgb(255 255 255); }
.pl-s02-p::before { content: "PL"; position: absolute; left: 6px; top: 4px; font-weight: 900; font-size: 11px; color: var(--pl-live); }
.pl-s02-p b { position: absolute; left: 6px; right: 6px; bottom: 26px; color: rgb(255 255 255); font-size: 12px; font-weight: 800; text-transform: uppercase; line-height: 1; text-shadow: 0 2px 6px rgb(0 0 0 / .6); }
.pl-s02-p em { position: absolute; left: 10px; right: 10px; bottom: 6px; font-style: normal; background: var(--pl-live); color: rgb(255 255 255); font-size: 9.5px; font-weight: 700; text-align: center; border-radius: 3px; padding: 2px 0; }
.pl-s02-brand { position: absolute; right: 30px; bottom: 34px; z-index: 2; font-size: 30px; font-weight: 900; color: var(--pl-live); letter-spacing: -.02em; }
.pl-s02-cont { color: rgb(220 220 225); font-size: 12px; margin-top: 14px; }
''',
  html=f'''<div class="pl-s02"><div class="pl-s02-bg"></div><div class="pl-s02-scrim"></div>
<nav class="pl-s02-rail" aria-label="Gezinme">{I("search")}<span class="is-active">{I("home")}</span>{I("tv")}{I("film")}{I("plus")}{I("copy")}</nav>
<div class="pl-s02-main"><div class="pl-s02-kick"><b>PL</b>FİLM</div><div class="pl-s02-t1">Deniz Aksoy</div><h3 class="pl-s02-t2">İzmir'in Saat <span style="font-size:.5em;vertical-align:middle">KULESİ</span> Hırsızı</h3>
<div class="pl-s02-meta"><b>Yeni</b>2026<span class="is-fill">16+</span>1s 26dk<span>▣ VISION</span><span>5.1</span></div>
<p class="pl-s02-desc">Kendi sözleriyle: 2010'daki büyük müze soygununun arkasındaki ismin, tarihin en cesur sanat hırsızlığını nasıl gerçekleştirdiği.</p>
<div class="pl-s02-shelf"><h4>Yalnız PluginLabs TV'de</h4><div class="pl-s02-row">{"".join(f'<div class="pl-s02-p{" is-focus" if i==0 else ""}">{ph(t)}<b>{n}</b>{"<em>Yeni eklendi</em>" if r else ""}</div>' for i,(t,n,r) in enumerate([("dusk","Saat Kulesi Hırsızı",True),("forest","Çözülmemiş Gizemler",False),("ocean","Kim Öldürdü?",True),("warm","Kordon",True),("violet","Sıradaki Moda",False),("gold","Yaşlı Babalar",True),("ice","Kuzey",False),("red","Kırmızı Hat",False)]))}</div>
<div class="pl-s02-cont">Muhammed için izlemeye devam</div></div></div><span class="pl-s02-brand">PLTV</span></div>''')

# ------------------------------------------------------------------ PIN 4
screen(pin=4, ad="E-spor Canlı Yayın Merkezi", yuzey="neon",
  aciklama="Neon yeşil vurgu: kahraman canlı yayın, küresel öne çıkanlar kartları, iki sütun maç listesi; sağda canlı maç paneli, ejderha/altın göstergesi, altın farkı grafiği, oyuncu kartları ve oran düğmeleri.",
  sahne="linear-gradient(135deg, rgb(70 160 20) 0 30%, rgb(30 34 40) 30% 70%, rgb(70 160 20) 70%)",
  css='''
.pl-s04 { width: 1080px; display: grid; grid-template-columns: 34px 1fr 300px; background: rgb(14 15 18); border-radius: 26px; overflow: visible; position: relative; color: var(--pl-fg-2); }
.pl-s04-rail { display: grid; align-content: center; gap: 14px; justify-items: center; background: rgb(8 8 10); border-radius: 26px 0 0 26px; }
.pl-s04-rail span { width: 26px; height: 26px; border-radius: 6px; display: grid; place-items: center; color: rgb(200 200 205); }
.pl-s04-rail span.is-active { background: var(--pl-neon); color: var(--pl-neon-ink); }
.pl-s04-main { padding: 0 16px 16px; min-width: 0; }
.pl-s04-hero { position: relative; height: 300px; margin: 0 -16px; overflow: hidden; padding: 18px 24px; }
.pl-s04-hero .pl-sx-ph { position: absolute; inset: 0; border-radius: 0; }
.pl-s04-hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgb(14 15 18 / .9), transparent 70%), linear-gradient(0deg, rgb(14 15 18), transparent 40%); }
.pl-s04-hero > * { position: relative; z-index: 1; }
.pl-s04-tabs { display: flex; gap: 26px; font-size: 11px; color: rgb(255 255 255); font-weight: 600; }
.pl-s04-tabs span:first-child::after { content: ""; display: block; width: 4px; height: 4px; border-radius: 50%; background: var(--pl-neon); margin: 4px auto 0; }
.pl-s04-h { font-size: 32px; line-height: 1.05; color: rgb(255 255 255); font-weight: 800; margin: 38px 0 18px; letter-spacing: -.02em; max-width: 360px; }
.pl-s04-ctas { display: flex; gap: 14px; align-items: center; font-size: 10px; color: rgb(255 255 255); font-weight: 600; }
.pl-s04-ctas .pl-s04-out { border: 1.5px solid var(--pl-neon); padding: 9px 12px; border-radius: 2px; }
.pl-s04-ctas .pl-s04-live { display: inline-flex; gap: 6px; align-items: center; }
.pl-s04-ctas .pl-s04-live i { width: 18px; height: 18px; border-radius: 50%; background: var(--pl-warning); display: grid; place-items: center; color: rgb(0 0 0); font-style: normal; font-size: 8px; }
.pl-s04-sec { font-size: 12px; color: rgb(255 255 255); font-weight: 600; margin: 12px 0 10px; }
.pl-s04-hl { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.pl-s04-hcard { height: 98px; border-radius: 8px; background: rgb(32 34 40); padding: 10px; display: flex; flex-direction: column; justify-content: space-between; font-size: 10px; color: rgb(255 255 255); }
.pl-s04-hcard.is-hot { background: var(--pl-neon); color: var(--pl-neon-ink); }
.pl-s04-hcard div { display: grid; grid-template-columns: 1fr auto; font-weight: 600; }
.pl-s04-hcard small { display: flex; justify-content: space-between; opacity: .7; font-size: 8.5px; }
.pl-s04-live2 { background: rgb(60 180 60); color: rgb(0 0 0); border-radius: 3px; padding: 0 4px; font-weight: 700; opacity: 1 !important; }
.pl-s04-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.pl-s04-mr { display: grid; grid-template-columns: 20px 1fr auto 1fr 20px; gap: 6px; align-items: center; height: 30px; padding: 0 8px; border-radius: 4px; background: rgb(28 30 36); font-size: 9.5px; color: rgb(220 220 225); margin-bottom: 6px; }
.pl-s04-mr b { font-family: var(--pl-font-mono); color: rgb(255 255 255); }
.pl-s04-mr i { width: 14px; height: 14px; border-radius: 3px; background: var(--c, rgb(255 140 40)); display: block; }
.pl-s04-side { background: rgb(8 9 10); border-radius: 0 26px 26px 0; padding: 14px; display: grid; gap: 10px; align-content: start; font-size: 10px; position: relative; }
.pl-s04-vs { display: grid; grid-template-columns: 1fr auto auto auto 1fr; gap: 6px; align-items: center; padding: 10px 0; border-bottom: 1px solid rgb(255 255 255 / .06); color: rgb(255 255 255); font-weight: 600; }
.pl-s04-crest { width: 22px; height: 22px; border-radius: 6px; background: var(--pl-warning); display: block; clip-path: polygon(50% 0, 100% 20%, 90% 80%, 50% 100%, 10% 80%, 0 20%); }
.pl-s04-gold { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; color: rgb(255 255 255); font-family: var(--pl-font-mono); font-weight: 700; }
.pl-s04-gold i { height: 3px; background: linear-gradient(90deg, var(--pl-neon) 54%, rgb(240 220 40) 54%); display: block; border-radius: 2px; }
.pl-s04-ic { display: grid; grid-template-columns: repeat(8, 1fr); text-align: center; gap: 4px; color: rgb(255 255 255); font-family: var(--pl-font-mono); }
.pl-s04-ic span { color: var(--pl-neon); }
.pl-s04-graph { height: 70px; border-radius: 6px; background: rgb(18 30 14); position: relative; overflow: hidden; }
.pl-s04-graph svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.pl-s04-pc { position: absolute; width: 180px; padding: 10px; border-radius: 10px; background: rgb(28 30 36); box-shadow: 0 20px 40px rgb(0 0 0 / .5); color: rgb(255 255 255); font-size: 10px; display: grid; grid-template-columns: 44px 1fr; gap: 4px 8px; }
.pl-s04-pc b { grid-column: 1 / -1; }
.pl-s04-pc .pl-sx-face { grid-row: span 3; }
.pl-s04-bet { display: inline-flex; gap: 6px; align-items: center; justify-content: center; width: 120px; height: 34px; border-radius: 20px; border: 2px solid rgb(240 220 40); color: rgb(255 255 255); font-family: var(--pl-font-mono); font-weight: 700; font-size: 13px; }
.pl-s04-odds { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
.pl-s04-odds span { height: 30px; border-radius: 4px; display: grid; place-items: center; font-family: var(--pl-font-mono); color: rgb(255 255 255); background: rgb(28 30 36); font-weight: 600; }
.pl-s04-odds span:first-child { background: var(--pl-neon); color: var(--pl-neon-ink); } .pl-s04-odds span:last-child { background: rgb(240 220 40); color: rgb(0 0 0); }
''',
  html=f'''<div class="pl-s04"><nav class="pl-s04-rail"><span>{I("gamepad")}</span><span class="is-active">{I("trophy")}</span><span>{I("flag")}</span></nav>
<div class="pl-s04-main"><div class="pl-s04-hero">{ph("violet")}<div class="pl-s04-tabs"><span>Canlı skorlar</span><span style="opacity:.6">Yaklaşan</span><span style="opacity:.6">Yayınlar</span></div><span class="pl-chip pl-chip--ghost pl-chip--mono" style="margin-top:20px">ARENA LİGİ</span><h3 class="pl-s04-h">Arena Ligi Dünya Şampiyonası Canlı Yayın</h3><div class="pl-s04-ctas"><span class="pl-s04-out">Daha fazla</span><span class="pl-s04-live"><i>▶</i>Canlı izle</span></div></div>
<div class="pl-s04-sec">Küresel öne çıkanlar</div><div class="pl-s04-hl">{"".join(f'<div class="pl-s04-hcard{" is-hot" if i==0 else ""}">{I(ic)}<div><span>{a}</span><span>{x}</span><span>{b}</span><span>{y}</span></div><small><span>40\'</span>{"<span class=pl-s04-live2>CANLI ●</span>" if i<2 else "<span>18.11.2026 · 15:30</span>"}</small></div>' for i,(ic,a,x,b,y) in enumerate([("trophy","Atlas X",2,"Nova",0),("gamepad","Orion","1","Lima","0"),("flag","Delta Aslanları","","Kuzey Oyun",""),("gamepad","Delta Aslanları","","Kuzey Oyun","")]))}</div>
<div class="pl-s04-cols">{"".join(f'<div><div class="pl-s04-sec">{h}</div>{"".join(f'<div class="pl-s04-mr"><i style="--c:{c1}"></i><span>{a}</span><b>{s}</b><span style="text-align:right">{b}</span><i style="--c:{c2}"></i></div>' for a,s,b,c1,c2 in rows)}</div>' for h,rows in [("Taktik Atış: GO",[("Virtus",'17 : 6',"Fenix","rgb(240 120 40)","rgb(255 150 30)"),("Fenix",'4 : 23',"G2 Spor","rgb(255 150 30)","rgb(220 220 220)"),("GG",'9 : 6',"Fenix","rgb(200 160 60)","rgb(255 150 30)")]),("Arena Ligi",[("GG",'17 : 6',"G2 Spor","rgb(200 160 60)","rgb(220 220 220)"),("Atlas X",'4 : 23',"G2 Spor","rgb(240 200 40)","rgb(220 220 220)")])])}</div></div>
<aside class="pl-s04-side"><div class="pl-sx-row" style="color:white;font-weight:600;font-size:11px">Arena Ligi DŞ<span style="flex:1"></span>{I("star")}</div><span class="pl-sx-muted" style="margin-top:-8px">Son 16</span>
<div class="pl-s04-vs"><span>Atlas X<br><small class="pl-sx-muted">3-6</small></span><i class="pl-s04-crest"></i><span class="pl-sx-muted">vs</span><i class="pl-s04-crest" style="background:rgb(180 140 60)"></i><span style="text-align:right">Altın G<br><small class="pl-sx-muted">3-0</small></span></div>
<div style="text-align:center" class="pl-sx-muted">Ejderhalar</div><div class="pl-s04-gold"><span>55,4B</span><i></i><span>46,4B</span></div><div style="text-align:center;margin-top:-6px" class="pl-sx-muted">Altın</div>
<div class="pl-s04-ic">{"".join(f"<div><span>{I(ic)}</span><br>{n}</div>" for ic,n in [("rec","2"),("users","1"),("box","8"),("zap","8"),("zap","2"),("flag","1"),("box","8"),("rec","8")])}</div>
<div class="pl-s04-graph"><svg viewBox="0 0 300 70" preserveAspectRatio="none" aria-hidden="true"><path d="{area([10,18,14,30,22,40,26,34,44,30,38,50,36,46],300,40)}" transform="translate(0,4)" fill="rgb(120 220 60 / .6)"/><path d="{area([30,36,20,28,40,24,32],300,20)}" transform="translate(0,46) scale(1,-1) translate(0,-20)" fill="rgb(200 200 200 / .4)"/></svg></div>
<div style="height:150px"></div><div class="pl-s04-odds"><span>1,50</span><span>2,30</span><span>4,50</span></div>
<div class="pl-s04-pc" style="left:-30px;top:310px"><b>ATX Yalçın</b>{face(21,40)}<span>{I("x")} 0 / 2 / 6</span><span>{I("star")} 47</span><span>{I("tag")} 7,7B</span></div>
<div class="pl-s04-pc" style="right:-40px;top:350px"><b style="text-align:right">ATX Yalçın</b><span>0 / 2 / 6</span>{face(22,40)}<span>47</span><span>7,7B</span></div>
<div style="position:absolute;left:20px;top:440px"><span class="pl-s04-bet">◀ 1,4B</span></div></aside></div>''')

# ------------------------------------------------------------------ PIN 5
screen(pin=5, ad="Oyun Mağazası — Öne Çıkan Karusel", yuzey="glass",
  aciklama="Mor-mavi bulanık zemin üstünde Windows pencereli mağaza: logo, Ana sayfa/Kategoriler/Kitaplığım, Hızlı başlat listesi, indirme durumu; ortada perspektifli kapak karuseli ve indirimli oyun kartları.",
  sahne="radial-gradient(60% 80% at 20% 30%, rgb(140 90 255), transparent 60%), radial-gradient(60% 80% at 90% 80%, rgb(40 200 220), transparent 60%), rgb(60 40 160)",
  css='''
.pl-s05 { width: 1060px; background: rgb(16 22 34); border-radius: 18px; display: grid; grid-template-columns: 200px 1fr; gap: 16px; padding: 14px 16px 18px; color: var(--pl-fg-2); position: relative; }
.pl-s05-win { position: absolute; right: 12px; top: 6px; display: flex; gap: 14px; color: var(--pl-fg-3); font-size: 11px; }
.pl-s05-nav { background: rgb(24 32 46); border-radius: 14px; padding: 14px 10px; display: flex; flex-direction: column; gap: 4px; }
.pl-s05-logo { display: flex; gap: 8px; align-items: center; color: rgb(255 255 255); font-weight: 800; font-size: 15px; padding: 2px 6px 16px; line-height: 1; }
.pl-s05-logo small { display: block; font-size: 7px; letter-spacing: .14em; font-weight: 600; }
.pl-s05-item { display: flex; gap: 10px; align-items: center; height: 32px; padding: 0 10px; border-radius: 8px; font-size: 11.5px; color: var(--pl-fg-2); }
.pl-s05-item.is-active { background: rgb(255 255 255 / .08); color: rgb(255 255 255); }
.pl-s05-fl { display: flex; gap: 10px; align-items: center; font-size: 10px; color: var(--pl-fg-1); padding: 5px 4px; }
.pl-s05-fl span:first-child { width: 22px; height: 26px; border-radius: 3px; overflow: hidden; flex: none; }
.pl-s05-dl { margin-top: auto; background: rgb(255 255 255 / .06); border-radius: 8px; padding: 8px; display: grid; grid-template-columns: 22px 1fr auto; gap: 2px 8px; align-items: center; font-size: 9.5px; color: var(--pl-fg-1); }
.pl-s05-dl .pl-progress { grid-column: 1 / -1; height: 3px; }
.pl-s05-top { display: flex; gap: 10px; align-items: center; margin-bottom: 14px; }
.pl-s05-search { display: flex; align-items: center; gap: 8px; width: 240px; height: 34px; padding: 0 6px 0 12px; border-radius: 10px; background: rgb(255 255 255 / .06); font-size: 11px; color: var(--pl-fg-3); }
.pl-s05-search span:last-child { margin-left: auto; width: 26px; height: 24px; border-radius: 6px; background: rgb(255 255 255 / .08); display: grid; place-items: center; }
.pl-s05-user { display: flex; gap: 8px; align-items: center; padding: 4px 14px 4px 4px; border-radius: 10px; background: rgb(255 255 255 / .06); font-size: 11px; color: rgb(255 255 255); }
.pl-s05-user small { display: block; color: rgb(80 160 255); font-size: 9px; }
.pl-s05-car { position: relative; height: 250px; display: flex; justify-content: center; align-items: center; perspective: 900px; }
.pl-s05-c { position: absolute; height: 80%; width: 22%; border-radius: 12px; overflow: hidden; }
.pl-s05-c.is-main { position: relative; width: 44%; height: 100%; z-index: 3; box-shadow: 0 20px 40px rgb(0 0 0 / .5); }
.pl-s05-c.is-main .pl-sx-ph::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgb(0 0 0 / .55), transparent 70%); }
.pl-s05-body { position: absolute; left: 14px; bottom: 16px; z-index: 2; display: grid; gap: 8px; max-width: 60%; }
.pl-s05-body b { font-family: Georgia, serif; font-size: 22px; line-height: .95; color: rgb(255 255 255); text-transform: uppercase; letter-spacing: .02em; }
.pl-s05-body small { color: rgb(255 255 255 / .75); font-size: 8.5px; }
.pl-s05-pre { display: flex; gap: 6px; } .pl-s05-pre span:first-child { background: rgb(255 255 255); color: rgb(10 10 10); font-size: 9px; font-weight: 700; padding: 6px 14px; border-radius: 6px; }
.pl-s05-pre span:last-child { width: 24px; height: 24px; border-radius: 50%; background: rgb(255 255 255 / .2); display: grid; place-items: center; color: white; }
.pl-s05-heart { position: absolute; right: 10px; top: 10px; z-index: 2; width: 24px; height: 24px; border-radius: 6px; background: rgb(0 0 0 / .4); display: grid; place-items: center; color: rgb(255 80 120); }
.pl-s05-sh { display: flex; align-items: center; gap: 8px; margin: 18px 0 10px; color: rgb(255 255 255); font-weight: 600; font-size: 13px; }
.pl-s05-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.pl-s05-g { display: grid; gap: 6px; font-size: 11px; color: rgb(255 255 255); }
.pl-s05-g > div:first-child { height: 104px; border-radius: 10px; overflow: hidden; }
.pl-s05-g em { font-style: normal; width: max-content; font-size: 7.5px; padding: 2px 6px; border-radius: 3px; background: rgb(255 255 255 / .1); color: var(--pl-fg-2); letter-spacing: .06em; }
.pl-s05-pr { display: flex; gap: 8px; align-items: center; font-weight: 700; }
.pl-s05-pr span:first-child { background: rgb(40 120 255); font-size: 8.5px; padding: 2px 5px; border-radius: 3px; }
.pl-s05-pr s { color: var(--pl-fg-4); font-weight: 400; font-size: 9.5px; }
''',
  html=f'''<div class="pl-s05"><span class="pl-s05-win">— ▢ ✕</span>
<nav class="pl-s05-nav"><div class="pl-s05-logo">{I("gamepad", 24)}<span>PLAY<small>OYUN MAĞAZASI</small></span></div><span class="pl-s05-item is-active">{I("home")}Ana sayfa</span><span class="pl-s05-item">{I("grid")}Kategoriler</span><span class="pl-s05-item">{I("gamepad")}Kitaplığım</span><span class="pl-sx-kicker" style="margin:16px 6px 6px">Hızlı başlat</span>
{"".join(f'<div class="pl-s05-fl"><span>{ph(t)}</span>{n}</div>' for t,n in [("forest","Blok Dünyası"),("red","Kızıl Vadi 2"),("fire","Uzak Ada 6"),("gold","Gölge Şehir")])}
<div class="pl-s05-dl"><span style="width:22px;height:22px;border-radius:4px;overflow:hidden">{ph("neon")}</span><span>Neon Şehir 2077<br><small class="pl-sx-muted">İndiriliyor</small></span><b>%68</b><div class="pl-progress"><span style="--pl-val:68%;background:rgb(40 200 220)"></span></div></div></nav>
<div><div class="pl-s05-top"><div class="pl-s05-search">{I("search")}Oyun ara<span>{I("sliders")}</span></div><span style="flex:1"></span><span class="pl-sx-ibtn">{I("heart")}</span><span class="pl-sx-ibtn">{I("bell")}</span><span class="pl-s05-user">{face(5,30)}<span>Muhammed<small>Profili gör</small></span></span></div>
<div class="pl-s05-car"><div class="pl-s05-c" style="transform:translateX(-148%) scale(.86) rotateY(14deg)">{ph("fog")}</div><div class="pl-s05-c" style="transform:translateX(-96%) scale(.94) rotateY(8deg);z-index:2">{ph("gold")}</div>
<div class="pl-s05-c is-main">{ph("neon")}<span class="pl-s05-heart">{I("heart")}</span><div class="pl-s05-body"><b>Arena of<br>Efsaneler</b><small>Efsaneni oluştur. Bir şampiyon seç, takımını kur ve rakiplerini alt et.</small><div class="pl-s05-pre"><span>ÖN SİPARİŞ</span><span>{I("play")}</span></div></div></div>
<div class="pl-s05-c" style="transform:translateX(96%) scale(.94) rotateY(-8deg);z-index:2">{ph("violet")}</div><div class="pl-s05-c" style="transform:translateX(148%) scale(.86) rotateY(-14deg)">{ph("red")}</div></div>
<div class="pl-s05-sh">İndirimdeki oyunlar<span style="flex:1"></span><span style="color:rgb(80 160 255);font-size:11px">Tümünü gör</span><span class="pl-sx-ibtn" style="width:22px;height:22px">{I("arrow-left")}</span><span class="pl-sx-ibtn" style="width:22px;height:22px;background:rgb(255 255 255 / .2)">{I("arrow-right")}</span></div>
<div class="pl-s05-grid">{"".join(f'<div class="pl-s05-g"><div>{ph(t)}</div><em>TEMEL OYUN</em><span>{n}</span><div class="pl-s05-pr"><span>-%{o}</span><s>{a}</s>{b}</div></div>' for t,n,o,a,b in [("ice","Savaşın Tanrısı",75,"1.999 ₺","499 ₺"),("gold","Neon Şehir 2077",50,"1.199 ₺","599 ₺"),("red","Kontrol",75,"999 ₺","249 ₺"),("dusk","Büyücü Okulu",25,"1.599 ₺","1.199 ₺")])}</div></div></div>''')

# ------------------------------------------------------------------ PIN 7
screen(pin=7, ad="Oyun Keşif — Kampanya ve Trendler",
  aciklama="Koyu yüzen pencere: ikon rayı (aktif mavi kare), arama, kampanya afişi (%50 indirim + karakter), trend oyun kartları ve sağda seçili oyunun ayrıntı paneli, platform çipleri ve fiyat.",
  sahne="linear-gradient(160deg, rgb(150 156 180), rgb(60 64 80))",
  css='''
.pl-s07 { width: 1040px; background: rgb(20 20 24); border-radius: 22px; display: grid; grid-template-columns: 56px 1fr 260px; color: var(--pl-fg-2); overflow: hidden; }
.pl-s07-rail { display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 18px 0; border-right: 1px solid rgb(255 255 255 / .06); color: var(--pl-fg-3); }
.pl-s07-rail b { color: rgb(255 255 255); font-size: 13px; margin-bottom: 70px; }
.pl-s07-rail span.is-active { width: 34px; height: 34px; border-radius: 9px; background: rgb(40 90 255); color: white; display: grid; place-items: center; box-shadow: 0 6px 18px rgb(40 90 255 / .5); }
.pl-s07-main { padding: 16px 18px; min-width: 0; }
.pl-s07-search { width: 240px; height: 32px; border-radius: 8px; background: rgb(255 255 255 / .06); display: flex; gap: 8px; align-items: center; padding: 0 10px; font-size: 11px; color: var(--pl-fg-3); }
.pl-s07-promo { position: relative; margin-top: 18px; height: 160px; border-radius: 16px; background: linear-gradient(100deg, rgb(40 42 50), rgb(30 32 38)); padding: 22px; overflow: hidden; }
.pl-s07-promo h3 { margin: 0; color: rgb(255 255 255); font-size: 30px; font-weight: 800; display: flex; align-items: center; gap: 10px; letter-spacing: -.01em; }
.pl-s07-promo h3 span { font-size: 9px; background: rgb(255 255 255); color: rgb(10 10 10); padding: 3px 8px; border-radius: 10px; }
.pl-s07-promo p { margin: 6px 0 14px; font-size: 9.5px; max-width: 280px; color: var(--pl-fg-3); }
.pl-s07-promo .pl-sx-row .pl-btn { height: 28px; font-size: 10px; }
.pl-s07-char { position: absolute; right: 50px; top: -10px; width: 200px; height: 190px; }
.pl-s07-char::before { content: ""; position: absolute; inset: 10% 20% 0; border-radius: 50% 50% 0 0; background: radial-gradient(circle at 50% 22%, rgb(230 210 200) 0 10%, transparent 11%), radial-gradient(circle at 50% 18%, rgb(220 230 250) 0 18%, transparent 19%), linear-gradient(180deg, rgb(90 110 160), rgb(40 50 80)); }
.pl-s07-char::after { content: ""; position: absolute; right: 0; top: 20%; width: 60px; height: 8px; background: rgb(220 220 230); transform: rotate(-30deg); border-radius: 4px; }
.pl-s07-trend { margin: 16px -18px -16px; background: rgb(28 28 32); border-radius: 18px 18px 0 0; padding: 16px 18px; }
.pl-s07-th { display: flex; align-items: center; gap: 8px; color: rgb(255 255 255); font-weight: 600; font-size: 15px; margin-bottom: 12px; }
.pl-s07-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.pl-s07-card { display: grid; gap: 8px; font-size: 9.5px; }
.pl-s07-card > div:first-child { position: relative; height: 130px; border-radius: 10px; overflow: hidden; }
.pl-s07-card > div:first-child::after { content: "▶"; position: absolute; left: 50%; top: 44%; transform: translate(-50%, -50%); width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: rgb(0 0 0 / .45); color: white; font-size: 9px; border: 1px solid rgb(255 255 255 / .4); }
.pl-s07-card > div:first-child span { position: absolute; left: 6px; bottom: 6px; color: white; font-size: 9px; }
.pl-s07-vd { display: flex; justify-content: center; align-items: center; gap: 6px; height: 26px; border-radius: 6px; background: rgb(255 255 255 / .06); color: rgb(255 255 255); }
.pl-s07-st { display: flex; justify-content: space-between; font-family: var(--pl-font-mono); }
.pl-s07-st span { display: inline-flex; gap: 3px; align-items: center; } .pl-s07-st .pl-ico { width: 11px; height: 11px; color: rgb(60 120 255); }
.pl-s07-side { padding: 16px; border-left: 1px solid rgb(255 255 255 / .06); display: grid; gap: 10px; align-content: start; position: relative; }
.pl-s07-side h3 { margin: 0; color: rgb(255 255 255); font-size: 26px; line-height: 1; font-weight: 700; letter-spacing: -.01em; }
.pl-s07-plat { display: flex; gap: 4px; flex-wrap: wrap; } .pl-s07-plat span { font-size: 8px; padding: 3px 7px; border-radius: 10px; background: rgb(255 255 255 / .9); color: rgb(10 10 10); font-weight: 700; } .pl-s07-plat span:first-child { background: rgb(40 90 255); color: white; }
.pl-s07-price { font-size: 22px; color: rgb(255 255 255); font-weight: 700; } .pl-s07-price s { color: var(--pl-fg-4); font-size: 16px; font-weight: 400; margin-right: 6px; }
.pl-s07-side p { margin: 0; font-size: 9.5px; color: var(--pl-fg-3); line-height: 1.5; }
''',
  html=f'''<div class="pl-s07"><nav class="pl-s07-rail"><b>PL</b>{I("home")}<span class="is-active">{I("cart")}</span>{I("upload")}{I("compass")}{I("shield")}{I("users")}{I("folder")}</nav>
<div class="pl-s07-main"><div class="pl-sx-row"><div class="pl-s07-search">{I("search")}Ara…</div><span style="flex:1"></span><span class="pl-sx-ibtn" style="background:none;border:0">{I("bell")}</span><span class="pl-sx-ibtn" style="background:none;border:0">{I("cart")}</span>{face(7,32)}</div>
<div class="pl-s07-promo"><h3>Valoris <span>%50 İNDİRİM</span></h3><p>Valoris, takım tabanlı taktiksel nişancı oyunudur. Ajanını seç, yeteneklerini birleştir ve raundu kazan.</p><div class="pl-sx-row"><button class="pl-btn pl-btn--primary" style="background:rgb(40 90 255);color:white">Satın al</button><button class="pl-btn pl-btn--secondary">Sepete ekle</button></div><div class="pl-s07-char"></div></div>
<div class="pl-s07-trend"><div class="pl-s07-th">Trend oyunlar {I("arrow-right")}<span style="flex:1"></span><span class="pl-sx-muted" style="display:flex;gap:6px;align-items:center">{I("grid")}Kategoriler</span></div>
<div class="pl-s07-cards">{"".join(f'<div class="pl-s07-card"><div>{ph(t)}<span>{n}</span></div><div class="pl-s07-vd">Ayrıntılar {I("arrow-right")}</div><div class="pl-s07-st"><span>{I("star")}{a}</span><span>{I("x")}{b}</span></div></div>' for t,n,a,b in [("ice","Gölge Halka","3,4B","23"),("forest","Yeşil Zırh","5B","123"),("neon","Tuhaf Doktor","1,2B","223"),("night","Uzak Ada","10B","323")])}</div></div></div>
<aside class="pl-s07-side"><span style="position:absolute;left:-8px;top:16px;color:white">✕</span><div style="height:120px;border-radius:12px;overflow:hidden;position:relative">{ph("forest")}</div><h3>Uzak Ada<br>Yeni Şafak</h3><div class="pl-s07-plat"><span>PS4</span><span>Xbox One</span><span>PC</span><span>Bulut</span></div><div class="pl-s07-price"><s>1.299 ₺</s>799 ₺</div><p>Uzak Ada: Yeni Şafak, açık dünya nişancı serisinin kıyamet sonrası devamıdır. Umut İlçesi'nde yeniden kurulan topluluğu korumak için güçlerini birleştir.</p><div class="pl-sx-row" style="margin-top:6px"><button class="pl-btn pl-btn--primary pl-btn--sm" style="background:rgb(40 90 255);color:white">Satın al</button><button class="pl-btn pl-btn--secondary pl-btn--sm">Sepete ekle</button></div></aside></div>''')

# ------------------------------------------------------------------ PIN 8
screen(pin=8, ad="IoT Cihaz Paneli — Bina İzleme", yuzey="hud",
  aciklama="Monitör çerçevesinde koyu lacivert IoT ekranı: sol ray, üst sekmeler, büyük ekipman sayısı ve dağılım, kategori sayaç kutuları; arka planda izometrik bina hatları ve ışıyan altıgen cihaz işaretleri.",
  sahne="rgb(4 6 12)",
  css='''
.pl-s08 { width: 1100px; height: 600px; position: relative; overflow: hidden; display: grid; grid-template-columns: 56px 330px 1fr; background: radial-gradient(80% 90% at 70% 50%, rgb(20 32 60), rgb(6 10 20) 70%); color: var(--pl-fg-2); }
.pl-s08-rail { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 18px 0; background: rgb(10 16 30); color: var(--pl-fg-3); }
.pl-s08-rail .is-active { width: 34px; height: 34px; border-radius: 8px; display: grid; place-items: center; background: rgb(40 110 255); color: white; }
.pl-s08-logo { width: 26px; height: 26px; border-radius: 50%; border: 3px solid rgb(120 180 255); margin-bottom: 20px; }
.pl-s08-left { padding: 18px; display: flex; flex-direction: column; gap: 14px; position: relative; z-index: 2; }
.pl-s08-left h3 { margin: 0; color: rgb(255 255 255); font-size: 18px; }
.pl-s08-tags { display: flex; gap: 8px; } .pl-s08-tags span { width: 70px; height: 54px; border-radius: 8px; background: rgb(255 255 255 / .04); border: 1px solid rgb(255 255 255 / .06); font-size: 8.5px; padding: 6px; color: var(--pl-fg-3); }
.pl-s08-tags i { display: block; width: 14px; height: 14px; border-radius: 4px; background: var(--c); margin-top: 8px; }
.pl-s08-big { font-family: var(--pl-font-hud); font-size: 46px; font-weight: 700; color: rgb(255 255 255); line-height: 1; }
.pl-s08-big small { font-size: 12px; color: var(--pl-fg-3); font-family: var(--pl-font-sans); font-weight: 400; margin-left: 6px; }
.pl-s08-leg { display: grid; grid-template-columns: 10px 1fr auto auto; gap: 6px 10px; font-size: 9.5px; align-items: center; }
.pl-s08-leg i { width: 6px; height: 6px; border-radius: 50%; background: var(--c); }
.pl-s08-leg b { font-family: var(--pl-font-mono); color: rgb(255 255 255); font-weight: 500; }
.pl-s08-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pl-s08-t { border-radius: 10px; padding: 10px; background: rgb(255 255 255 / .04); border: 1px solid rgb(255 255 255 / .07); display: grid; gap: 6px; font-size: 9px; }
.pl-s08-t div { display: flex; gap: 8px; align-items: center; } .pl-s08-t span.ic { width: 26px; height: 26px; border-radius: 6px; display: grid; place-items: center; background: var(--c); color: white; }
.pl-s08-t b { font-family: var(--pl-font-hud); font-size: 26px; color: white; } .pl-s08-t.is-active { background: rgb(40 110 255); border-color: transparent; color: white; }
.pl-s08-t .pl-progress { height: 3px; }
.pl-s08-scene { position: relative; }
.pl-s08-head { position: absolute; top: 16px; left: 0; right: 16px; display: flex; gap: 8px; align-items: center; z-index: 2; }
.pl-s08-head span { font-size: 9.5px; padding: 6px 12px; border-radius: 14px; background: rgb(255 255 255 / .05); color: var(--pl-fg-2); }
.pl-s08-head span.is-active { background: rgb(40 110 255); color: white; }
.pl-s08-bld { position: absolute; left: 0; top: 70px; width: 700px; height: 520px; transform: rotateX(56deg) rotateZ(-40deg); transform-origin: 40% 50%; }
.pl-s08-bld i { position: absolute; border: 1.5px solid rgb(90 120 180 / .45); background: rgb(30 44 80 / .35); box-shadow: inset 0 0 30px rgb(40 80 160 / .25), 6px 6px 0 rgb(30 44 80 / .5), 12px 12px 0 rgb(20 30 60 / .4), 18px 18px 0 rgb(14 22 44 / .35); }
.pl-s08-hex { position: absolute; width: 22px; height: 24px; background: var(--c); clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); filter: drop-shadow(0 0 10px var(--c)); z-index: 2; }
''',
  html=f'''<div class="pl-s08"><nav class="pl-s08-rail"><span class="pl-s08-logo"></span>{I("home")}{I("user")}{I("calendar")}{I("bar-chart")}<span class="is-active">{I("grid")}</span>{I("folder")}{I("settings")}</nav>
<div class="pl-s08-left"><h3>IoT cihazları</h3><div class="pl-s08-tags"><span>Ekipman durumu<i style="--c:rgb(255 70 100)"></i></span><span>Sensör uyarısı<i style="--c:rgb(255 70 100)"></i></span></div>
<span class="pl-sx-muted">Tüm IoT ekipmanı</span><div class="pl-s08-big">10.347<small>adet</small></div>
<div class="pl-s08-leg">{"".join(f'<i style="--c:{c}"></i><span>{n}</span><b>{v}</b><span class="pl-sx-muted">%{p}</span>' for c,n,v,p in [("rgb(40 110 255)","Normal","7.283","70"),("rgb(255 180 60)","Uyarı","1.903","18"),("rgb(150 160 180)","Çevrimdışı","1.161","11")])}</div>
<span class="pl-sx-muted" style="color:white;font-size:12px">Ekipman özeti</span>
<div class="pl-s08-tiles">{"".join(f'<div class="pl-s08-t{" is-active" if a else ""}"><div><span class="ic" style="--c:{c}">{I(ic)}</span>{n}</div><b>{v}</b><div class="pl-progress"><span style="--pl-val:{p}%;background:{c if not a else "white"}"></span></div></div>' for ic,n,v,p,c,a in [("cpu","Dijital cihaz","18",40,"rgb(255 70 120)",False),("wifi","Ağ cihazı","235",70,"rgb(40 110 255)",False),("building","Ofis cihazı","1.209",80,"rgb(40 110 255)",True),("shield","Güvenlik","185",50,"rgb(120 90 255)",False)])}</div></div>
<div class="pl-s08-scene"><div class="pl-s08-head">{"".join(f'<span class="{"is-active" if i==0 else ""}">{t}</span>' for i,t in enumerate(["Genel bakış","Dijital oda","Ortak alan","Ofis cihazı","Güvenlik"]))}<span style="flex:1;background:none"></span><span style="background:none">11:25</span><span style="background:none">{I("cloud")} 28°</span></div>
<div class="pl-s08-bld">{"".join(f'<i style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></i>' for x,y,w,h in [(40,40,260,180),(320,40,200,120),(320,180,120,140),(460,180,180,220),(40,240,180,200),(240,340,200,120),(560,40,100,120)])}</div>
{"".join(f'<span class="pl-s08-hex" style="left:{x}%;top:{y}%;--c:{c}"></span>' for x,y,c in [(30,30,"rgb(255 70 90)"),(52,48,"rgb(40 110 255)"),(44,62,"rgb(60 220 160)"),(70,40,"rgb(40 110 255)"),(62,72,"rgb(255 70 90)"),(84,58,"rgb(60 220 160)")])}</div></div>''')
