"""Pin ekranları 2 — Pin 9, 10, 11, 14, 15, 17, 18"""
import math
from pin_base import screen, ph, face, rail, dots, sw, iso_floor, I, smooth, area, ecg, bars

def helix():
    pts = []
    for i in range(70):
        t = i / 69
        y = 20 + t * 400; x = 150 + math.sin(t * 9) * 60 + (t - .5) * 120
        x2 = 150 - math.sin(t * 9) * 60 + (t - .5) * 120
        hue = 200 + t * 140
        r = 3 + (math.cos(t * 9) + 1) * 2.4
        pts.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x2:.0f}" y2="{y:.0f}" stroke="hsl({hue:.0f} 70% 60% / .35)" stroke-width="1.4"/>')
        pts.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="hsl({hue:.0f} 75% 58%)"/><circle cx="{x2:.0f}" cy="{y:.0f}" r="{6-r/1.8:.1f}" fill="hsl({hue+30:.0f} 70% 62%)"/>')
    return f'<svg viewBox="0 0 300 440" style="width:100%;height:100%" aria-hidden="true">{"".join(pts)}</svg>'

# ------------------------------------------------------------------ PIN 9
screen(pin=9, ad="Genetik Analiz Paneli (Açık)", tema="light", yuzey="soft", urun="mindpalace",
  aciklama="Beyaz kart düzeni: solda marka, gezinme (aktif lavanta hap), bağlı profiller ve AI destekli analiz listesi; ortada DNA sarmalı görselleştirmesi ve gün/hafta/ay seçici; sağda profil, sayaçlar, nabız grafiği ve araştırma zaman çizelgesi.",
  sahne="rgb(226 226 230)",
  css='''
.pl-s09 { width: 1060px; padding: 14px; border-radius: 34px; background: rgb(240 240 244); display: grid; grid-template-columns: 250px 1fr 300px; gap: 12px; color: rgb(60 60 70); }
.pl-s09-card { background: rgb(255 255 255); border-radius: 22px; padding: 16px; }
.pl-s09-col { display: grid; gap: 12px; align-content: start; }
.pl-s09-logo { display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 18px; color: rgb(20 20 26); letter-spacing: .02em; }
.pl-s09-logo span { width: 30px; height: 30px; border-radius: 50%; background: rgb(20 20 26); color: white; display: grid; place-items: center; }
.pl-s09-nav { display: grid; gap: 4px; margin: 16px 0; }
.pl-s09-nav span { display: flex; gap: 10px; align-items: center; height: 32px; padding: 0 10px; border-radius: 10px; font-size: 12px; color: rgb(40 40 50); }
.pl-s09-nav span.is-active { background: rgb(160 140 240); color: white; }
.pl-s09-nav em { margin-left: auto; font-style: normal; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center; background: rgb(160 140 240); color: white; font-size: 9px; }
.pl-s09-an { display: grid; gap: 8px; }
.pl-s09-an div { display: grid; grid-template-columns: 30px 1fr 14px; gap: 2px 10px; align-items: center; padding: 6px; border-radius: 22px; background: rgb(244 244 248); font-size: 11px; color: rgb(30 30 40); }
.pl-s09-an div.is-active { background: rgb(160 140 240); color: white; }
.pl-s09-an i { width: 30px; height: 30px; border-radius: 50%; background: white; display: grid; place-items: center; grid-row: span 2; color: rgb(30 30 40); }
.pl-s09-an small { font-size: 8.5px; opacity: .6; }
.pl-s09-dna { position: relative; height: 100%; min-height: 520px; padding: 16px; }
.pl-s09-seg { position: absolute; right: 16px; top: 14px; display: flex; gap: 4px; font-size: 11px; }
.pl-s09-seg span { padding: 5px 12px; border-radius: 14px; } .pl-s09-seg .is-active { background: rgb(160 140 240); color: white; }
.pl-s09-good { position: absolute; left: 40px; bottom: 70px; background: white; padding: 12px; border-radius: 12px; width: 150px; box-shadow: 0 10px 30px rgb(0 0 0 / .08); }
.pl-s09-good b { font-size: 15px; line-height: 1.15; color: rgb(20 20 26); display: block; font-weight: 600; }
.pl-s09-good span { display: inline-block; margin-top: 10px; background: rgb(160 140 240); color: white; font-size: 8px; padding: 4px 10px; border-radius: 10px; }
.pl-s09-tools { position: absolute; right: 18px; bottom: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pl-s09-tools span { width: 32px; height: 32px; border-radius: 50%; background: white; display: grid; place-items: center; box-shadow: 0 4px 14px rgb(0 0 0 / .08); }
.pl-s09-prof { display: flex; gap: 10px; align-items: center; } .pl-s09-prof b { color: rgb(20 20 26); font-size: 13px; display: block; }
.pl-s09-prof .pl-sx-ibtn { background: rgb(20 20 26); color: white; border: 0; }
.pl-s09-cnt { display: flex; gap: 22px; margin-top: 14px; }
.pl-s09-cnt div { display: grid; grid-template-columns: 26px auto; gap: 0 8px; font-size: 9px; color: rgb(110 110 120); }
.pl-s09-cnt i { grid-row: span 2; width: 26px; height: 26px; border-radius: 50%; background: rgb(244 244 248); display: grid; place-items: center; color: rgb(30 30 40); }
.pl-s09-cnt b { font-size: 20px; color: rgb(20 20 26); font-weight: 600; }
.pl-s09-hr { position: relative; height: 170px; }
.pl-s09-hr h4 { margin: 4px 0 2px; font-size: 18px; color: rgb(20 20 26); font-weight: 500; }
.pl-s09-hr svg { position: absolute; right: 0; bottom: 30px; width: 60%; height: 90px; }
.pl-s09-hr .pl-sx-num { position: absolute; left: 0; bottom: 0; font-size: 46px; font-weight: 400; color: rgb(20 20 26); }
.pl-s09-res h4 { margin: 0; font-size: 16px; color: rgb(20 20 26); font-weight: 500; display: flex; justify-content: space-between; align-items: center; }
.pl-s09-gr { position: relative; height: 150px; margin-top: 10px; background-image: repeating-linear-gradient(90deg, rgb(0 0 0 / .06) 0 1px, transparent 1px 20%); font-size: 9px; }
.pl-s09-gr span { position: absolute; height: 26px; border-radius: 14px; display: flex; align-items: center; padding: 0 10px; font-size: 8.5px; gap: 8px; }
''',
  html=f'''<div class="pl-s09"><div class="pl-s09-col"><div class="pl-s09-card"><div class="pl-s09-logo">GENLAB<span>{I("search")}</span></div>
<div class="pl-s09-nav">{"".join(f'<span class="{"is-active" if i==2 else ""}">{I(ic)}{n}{"<em>2</em>" if i==4 else ""}</span>' for i,(ic,n) in enumerate([("home","Ana sayfa"),("bar-chart","İstatistik"),("activity","Analiz"),("calendar","Randevular"),("mail","Mesajlar")]))}</div>
<span style="font-size:11px;color:rgb(30 30 40);font-weight:600">Bağlı profiller</span><div class="pl-sx-row" style="margin-top:8px"><span class="pl-avatars">{face(31,24)}{face(32,24)}{face(33,24)}</span><span style="flex:1"></span><span style="background:rgb(20 20 26);color:white;font-size:9px;padding:5px 10px;border-radius:12px">Başka ekle</span></div></div>
<div class="pl-s09-card"><div class="pl-sx-row" style="justify-content:space-between"><span class="pl-sx-muted">AI destekli</span>{I("arrow-up-right")}</div><div style="font-size:18px;color:rgb(20 20 26);margin:2px 0 12px">Analiz</div>
<div class="pl-s09-an">{"".join(f'<div class="{"is-active" if i==0 else ""}"><i>{I(ic)}</i>{n}<span>{I("chevron-right")}</span><small>Genom · Proteom</small></div>' for i,(ic,n) in enumerate([("wand","Spektroskopi"),("box","DNA profili"),("cpu","Genetik tarayıcı"),("globe","Genel analiz")]))}</div></div></div>
<div class="pl-s09-card pl-s09-dna"><span style="font-size:15px;color:rgb(20 20 26)">DNA genel görünümü</span><div class="pl-s09-seg"><span class="is-active">Gün</span><span>Hafta</span><span>Ay</span></div><div style="position:absolute;inset:40px 30px 30px">{helix()}</div>
<div class="pl-s09-good"><b>Diğer moleküllerle iyi etkileşim</b><span>Daha fazla</span></div><div class="pl-s09-tools"><span>{I("terminal")}</span><span>{I("cube")}</span><span>{I("info")}</span><span>{I("play")}</span></div></div>
<div class="pl-s09-col"><div class="pl-s09-card"><div class="pl-s09-prof">{face(34,36)}<div style="flex:1"><b>Ayşe Kaya</b><span class="pl-sx-muted" style="color:rgb(120 120 130)">İzmir, TR</span></div><span class="pl-sx-ibtn">{I("settings")}</span><span class="pl-sx-ibtn">{I("bell")}</span></div>
<div class="pl-s09-cnt"><div><i>{I("activity")}</i><b>27</b>Süren analiz</div><div><i>{I("trending-up")}</i><b>31</b>Aktif tedavi</div></div></div>
<div class="pl-s09-card pl-s09-hr"><div class="pl-sx-row" style="justify-content:space-between"><span class="pl-sx-muted">Kalp atışı</span><span style="width:24px;height:24px;border-radius:50%;background:rgb(244 244 248);display:grid;place-items:center">⋯</span></div><h4>Ortalama değer</h4><span style="font-size:9px;color:rgb(120 120 130);display:block;max-width:150px">Çarpıntının nedeni kalıtsal taşikardi.</span>
<svg viewBox="0 0 200 90" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="pl-s09g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="rgb(160 140 240)" stop-opacity=".35"/><stop offset="1" stop-color="rgb(160 140 240)" stop-opacity="0"/></linearGradient></defs><path d="M0 70 L70 70 L85 66 L95 10 L105 88 L115 60 L130 70 L200 70 L200 90 L0 90Z" fill="url(#pl-s09g)"/><path d="M0 70 L70 70 L85 66 L95 10 L105 88 L115 60 L130 70 L200 70" fill="none" stroke="rgb(160 140 240)" stroke-width="2"/><circle cx="95" cy="10" r="4" fill="rgb(160 140 240)"/></svg><span class="pl-sx-num">92 <small style="font-size:12px;color:rgb(140 140 150)">vuru/dk</small></span></div>
<div class="pl-s09-card pl-s09-res"><h4>Araştırmalar <span class="pl-sx-muted" style="font-size:9px">‹ 11–17 Kasım 2026 › <span style="border:1px solid rgb(0 0 0 / .1);padding:2px 8px;border-radius:8px">Hafta</span></span></h4>
<div class="pl-s09-gr"><div style="display:flex;justify-content:space-around;color:rgb(140 140 150)"><span style="position:static">Pzt</span><span style="position:static;background:rgb(160 140 240);color:white;height:auto;padding:2px 6px">Sal</span><span style="position:static">Çar</span><span style="position:static">Per</span><span style="position:static">Cum</span></div>
<span style="left:40%;top:30px;background:rgb(244 244 248)">Hastalık riski hesabı</span><span style="left:2%;top:72px;width:56%;background:rgb(160 140 240);color:white">Genetik hastalık tanısı <i style="margin-left:auto;width:16px;height:16px;border-radius:50%;background:white;color:rgb(20 20 26);display:grid;place-items:center;font-style:normal">↗</i></span><span style="left:22%;top:110px;background:rgb(244 244 248)">Kalıtım örüntüleri ↗</span><i style="position:absolute;left:28%;top:20px;bottom:0;border-left:1.5px dashed rgb(20 20 26)"></i></div></div></div></div>''')

# ------------------------------------------------------------------ PIN 10
def body_svg():
    return '''<svg viewBox="0 0 200 440" style="height:100%;display:block;margin:auto" aria-hidden="true"><defs><linearGradient id="pl-bd" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="rgb(80 200 255)" stop-opacity=".9"/><stop offset="1" stop-color="rgb(40 120 220)" stop-opacity=".5"/></linearGradient><filter id="pl-bdg"><feGaussianBlur stdDeviation="3"/></filter></defs>
<g fill="url(#pl-bd)" stroke="rgb(140 230 255)" stroke-width="1" opacity=".85"><ellipse cx="100" cy="40" rx="22" ry="27"/><path d="M88 66h24l4 14 34 10c8 3 10 8 11 16l8 90c1 8-6 9-8 2l-12-80-6 2 4 120-8 140c0 10-18 10-18 0l-4-130h-4l-4 130c0 10-18 10-18 0l-8-140 4-120-6-2-12 80c-2 7-9 6-8-2l8-90c1-8 3-13 11-16l34-10z"/></g>
<g stroke="rgb(180 240 255)" stroke-width=".6" fill="none" opacity=".6"><path d="M100 80v300M80 120h40M78 150h44M80 180h40M82 210h36"/><ellipse cx="100" cy="200" rx="30" ry="18"/></g>
<ellipse cx="100" cy="96" rx="16" ry="10" fill="rgb(255 120 80)" filter="url(#pl-bdg)" opacity=".9"/>
<ellipse cx="100" cy="425" rx="70" ry="12" fill="none" stroke="rgb(80 200 255)" stroke-width="2"/><ellipse cx="100" cy="425" rx="90" ry="16" fill="none" stroke="rgb(80 200 255 / .4)" stroke-width="1"/></svg>'''

screen(pin=10, ad="Tıbbi Veri Görselleştirme HUD", yuzey="hud",
  aciklama="Siyah HUD ekran: sol üstte genel sağlık endeksi, yaşamsal değer dalgaları ve sayaçlar; ortada ışıyan anatomik model ve etiketler; sağda büyük sistem değeri, durum ikonları, çubuk grafik ve üç dairesel gösterge.",
  sahne="rgb(2 6 10)",
  css='''
.pl-s10 { width: 1100px; height: 600px; background: radial-gradient(60% 70% at 50% 60%, rgb(8 40 60), rgb(2 8 14) 70%); color: var(--pl-fg-2); display: grid; grid-template-columns: 320px 1fr 340px; padding: 16px 24px; position: relative; }
.pl-s10-title { position: absolute; left: 24px; top: 14px; font-size: 18px; color: rgb(255 255 255); font-weight: 700; letter-spacing: .06em; }
.pl-s10-time { position: absolute; right: 24px; top: 12px; display: flex; gap: 18px; font-family: var(--pl-font-hud); font-size: 20px; color: rgb(255 255 255); }
.pl-s10-l { padding-top: 54px; display: grid; gap: 10px; align-content: start; }
.pl-s10-tags { display: grid; gap: 4px; } .pl-s10-tags span { border: 1px solid var(--pl-hud-green); color: var(--pl-hud-green); font-size: 9px; padding: 1px 6px; width: max-content; }
.pl-s10-k { display: grid; grid-template-columns: 1fr auto; font-family: var(--pl-font-hud); align-items: center; border-bottom: 1px solid var(--pl-hud-line); padding: 4px 0; font-size: 12px; }
.pl-s10-k b { font-size: 24px; color: rgb(255 255 255); font-weight: 600; }
.pl-s10-c { position: relative; display: grid; place-items: center; }
.pl-s10-lab { position: absolute; display: grid; gap: 2px; font-size: 9px; }
.pl-s10-lab span { border: 1px solid var(--pl-hud); color: var(--pl-hud); padding: 1px 6px; background: rgb(0 30 40 / .6); }
.pl-s10-r { padding-top: 54px; display: grid; gap: 12px; align-content: start; }
.pl-s10-icons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.pl-s10-icons div { display: grid; justify-items: center; gap: 4px; font-size: 8.5px; color: var(--pl-fg-3); }
.pl-s10-icons i { width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid var(--pl-hud-green); display: grid; place-items: center; color: var(--pl-hud-green); font-style: normal; }
.pl-s10-icons span.v { background: rgb(20 60 60); color: var(--pl-hud-green); padding: 1px 6px; font-family: var(--pl-font-mono); }
.pl-s10-rings { display: flex; justify-content: space-between; }
.pl-s10-ring { width: 76px; height: 76px; border-radius: 50%; border: 2px solid var(--pl-hud-green); display: grid; place-items: center; position: relative; box-shadow: 0 0 20px rgb(60 255 168 / .25), inset 0 0 20px rgb(60 255 168 / .2); }
.pl-s10-ring::before { content: ""; position: absolute; inset: 8px; border-radius: 50%; border: 1px dashed var(--pl-hud); }
''',
  html=f'''<div class="pl-s10"><span class="pl-s10-title">Tıbbi Veri Görselleştirme Analizi</span><span class="pl-s10-time">{I("clock")} 12:36 <span>{I("cloud")} 20/30°C</span></span>
<div class="pl-s10-l"><div class="pl-sx-row" style="align-items:flex-end;gap:14px"><div class="pl-hudmetric"><span class="pl-hudmetric__ic">{I("user",24)}</span><span class="pl-hudmetric__val">102<small>.67</small></span><span class="pl-hudmetric__lbl">Vücut endeksi</span></div><div class="pl-s10-tags"><span>Normal</span><span>Takip</span><span>Stabil</span></div></div>
<div class="pl-wavemon">{"".join(f'<div class="pl-wavemon__row"><span class="pl-wavemon__val">{v}</span><svg viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><polyline points="{ecg(i+11,70,a)}"/></svg></div>' for i,(v,a) in enumerate([(85,1),(76,.7),(25,.4)]))}</div>
{"".join(f'<div class="pl-s10-k"><span>{n}</span><span><b>{v}</b> <small class="pl-sx-muted">{u}</small></span></div>' for n,v,u in [("Kan şekeri","8","mmol/L"),("Kolesterol","135","mg/dL"),("Trigliserit","574","mg/dL")])}
<div class="pl-sx-row" style="gap:16px;font-family:var(--pl-font-hud);color:white;font-size:18px"><span style="color:var(--pl-hud-green)">● 102</span><span>352<small class="pl-sx-muted">ms</small></span><span style="color:var(--pl-hud-amber)">● 263</span><span>124</span></div></div>
<div class="pl-s10-c">{body_svg()}<span class="pl-s10-lab" style="left:58%;top:12%"><span>Tiroit · normal</span><span>Bademcik</span></span><span class="pl-s10-lab" style="left:12%;top:40%"><span>Kalp · 85 vuru</span></span><span class="pl-s10-lab" style="left:62%;top:52%"><span>Mide · %72</span></span></div>
<div class="pl-s10-r"><div class="pl-hudmetric pl-hudmetric--cyan" style="justify-self:end"><span class="pl-hudmetric__val" style="color:white;text-shadow:none">127<small>.39</small></span><span class="pl-hudmetric__lbl">Bağışıklık sistemi · (63,2–156,4)</span></div>
<div class="pl-s10-icons">{"".join(f'<div><i>{I(ic)}</i>{n}<span class="v">{v}</span></div>' for ic,n,v in [("droplet","Kan","%84"),("heart","Kalp","%92"),("activity","Akciğer","%78"),("zap","Sinir","%88")])}</div>
<div class="pl-sx-row" style="justify-content:space-between;font-family:var(--pl-font-mono);font-size:10px"><span>BP · 69/37</span><span style="color:var(--pl-hud-red)">BP · 90/58</span><span style="color:var(--pl-hud-amber)">BP · 72/48</span></div>
<div class="pl-segbars" style="height:70px">{"".join(f'<span style="--v:{v};--c:var(--pl-hud)"></span>' for v in bars(17,34,20,95))}</div>
<div class="pl-s10-rings">{"".join(f'<div style="display:grid;justify-items:center;gap:6px;font-size:9px"><div class="pl-s10-ring" style="border-color:{c}">{I(ic,24)}</div>{n}</div>' for c,ic,n in [("var(--pl-hud-green)","activity","Solunum"),("var(--pl-hud)","droplet","Kan oksijeni"),("var(--pl-hud-green)","heart","Ritim")])}</div></div></div>''')

# ------------------------------------------------------------------ PIN 11
screen(pin=11, ad="Görev Takvimi — Ekip Planlayıcı", urun="replicator",
  aciklama="Pembe-lila gradyan zemin üzerinde iki siyah pencere: kenar çubuğu (genel bakış, projeler, takımlar aktif pembe, projeler ve görevler listesi, kullanıcı) ve hafta görünümlü ekip takvimi; renkli etkinlik kartları, harita önizlemeli kartlar, şimdi çizgisi ve sağ ayrıntı çekmecesi.",
  sahne="linear-gradient(110deg, rgb(250 190 170), rgb(240 180 210) 50%, rgb(200 190 250))",
  css='''
.pl-s11 { display: flex; gap: 14px; color: var(--pl-fg-2); }
.pl-s11-side { width: 220px; background: rgb(10 10 12); border-radius: 18px; padding: 16px 12px; display: flex; flex-direction: column; gap: 3px; font-size: 11.5px; }
.pl-s11-brand { display: flex; gap: 8px; align-items: center; color: white; font-weight: 700; margin-bottom: 14px; }
.pl-s11-it { display: flex; gap: 10px; align-items: center; height: 32px; padding: 0 10px; border-radius: 8px; color: rgb(200 200 205); }
.pl-s11-it.is-active { background: rgb(240 140 210); color: rgb(20 10 20); font-weight: 600; }
.pl-s11-it em { margin-left: auto; font-style: normal; font-size: 10px; color: var(--pl-fg-3); }
.pl-s11-ic { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: var(--c); color: white; }
.pl-s11-sec { display: flex; justify-content: space-between; color: var(--pl-fg-4); font-size: 9.5px; letter-spacing: .08em; margin: 14px 10px 4px; }
.pl-s11-user { margin-top: auto; display: flex; gap: 8px; align-items: center; padding: 8px; border-radius: 10px; background: rgb(255 255 255 / .06); color: white; font-size: 11px; }
.pl-s11-cal { width: 860px; background: rgb(14 14 16); border-radius: 18px; overflow: hidden; display: grid; grid-template-columns: 50px 1fr 200px; }
.pl-s11-mini { border-right: 1px solid rgb(255 255 255 / .06); display: grid; align-content: start; justify-items: center; gap: 14px; padding: 16px 0; color: var(--pl-fg-3); }
.pl-s11-body { min-width: 0; }
.pl-s11-top { display: flex; align-items: center; gap: 10px; padding: 14px 16px; color: white; font-size: 20px; }
.pl-s11-top .pl-chip { margin-left: auto; }
.pl-s11-days { display: grid; grid-template-columns: repeat(9, 1fr); text-align: center; font-size: 10px; color: var(--pl-fg-3); padding: 0 8px 10px; border-bottom: 1px solid rgb(255 255 255 / .06); }
.pl-s11-days b { display: block; font-size: 15px; color: white; font-weight: 500; }
.pl-s11-days .is-active { background: rgb(255 255 255 / .1); border-radius: 8px; padding: 4px 0; }
.pl-s11-grid { display: grid; grid-template-columns: 50px repeat(3, 1fr); gap: 0 10px; padding: 10px 10px 0; position: relative; height: 380px; overflow: hidden; }
.pl-s11-col { display: grid; gap: 8px; align-content: start; }
.pl-s11-ch { display: flex; gap: 6px; justify-content: center; color: white; font-size: 11px; margin-bottom: 4px; } .pl-s11-ch span { color: var(--pl-fg-4); }
.pl-s11-ev { border-radius: 10px; padding: 8px; background: color-mix(in srgb, var(--c) 30%, rgb(20 20 24)); font-size: 9px; color: rgb(220 220 225); display: grid; gap: 4px; }
.pl-s11-ev b { display: flex; gap: 6px; align-items: center; color: white; font-size: 10.5px; font-weight: 600; }
.pl-s11-ev b i { width: 16px; height: 16px; border-radius: 4px; background: var(--c); display: grid; place-items: center; font-style: normal; }
.pl-s11-ev .pl-sx-row span { background: rgb(255 255 255 / .1); padding: 2px 6px; border-radius: 4px; }
.pl-s11-map { height: 60px; border-radius: 6px; background: linear-gradient(115deg, transparent 45%, rgb(255 255 255 / .12) 46% 48%, transparent 49%), linear-gradient(30deg, transparent 60%, rgb(255 255 255 / .1) 61% 62%, transparent 63%), rgb(40 40 46); position: relative; }
.pl-s11-map::after { content: ""; position: absolute; left: 50%; top: 50%; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; transform: translate(-50%, -50%); }
.pl-s11-times { display: grid; gap: 34px; font-size: 9px; color: var(--pl-fg-4); padding-top: 30px; }
.pl-s11-now { position: absolute; left: 10px; right: 0; top: 150px; border-top: 1px solid rgb(255 255 255 / .5); font-size: 8.5px; color: white; }
.pl-s11-drawer { background: rgb(24 24 28); border-left: 1px solid rgb(255 255 255 / .06); padding: 16px 12px; display: grid; gap: 12px; align-content: start; font-size: 10.5px; }
.pl-s11-drawer h5 { margin: 0; color: white; font-size: 13px; display: flex; gap: 8px; align-items: center; }
.pl-s11-drawer .k { color: var(--pl-fg-3); font-size: 9.5px; display: flex; gap: 6px; align-items: center; }
.pl-s11-chk { display: flex; gap: 8px; align-items: center; color: white; } .pl-s11-chk i { width: 14px; height: 14px; border-radius: 4px; background: rgb(240 140 210); display: grid; place-items: center; font-style: normal; font-size: 9px; color: black; }
''',
  html=f'''<div class="pl-s11"><nav class="pl-s11-side"><div class="pl-s11-brand"><span class="pl-applogo pl-applogo--sm" style="background:white;color:black">DR</span>Design Replicator<span style="margin-left:auto">⊖</span></div>
{"".join(f'<span class="pl-s11-it{" is-active" if i==3 else ""}">{I(ic)}{n}{e}</span>' for i,(ic,n,e) in enumerate([("grid","Genel bakış",""),("folder","Projeler","<em>✎ ●</em>"),("bar-chart","Analiz",""),("users","Takımlar",""),("file" if False else "book","Raporlar","<em>⚠</em>")]))}
<div class="pl-s11-sec"><span>PROJELER</span><span>+</span></div>{"".join(f'<span class="pl-s11-it"><span class="pl-s11-ic" style="--c:{c}">{I(ic)}</span>{n}<em>{v}</em></span>' for c,ic,n,v in [("rgb(240 90 60)","flame","Mutfak","243"),("rgb(60 110 240)","zap","Leo Helper","85"),("rgb(80 80 90)","cpu","Tweakster","145")])}
<div class="pl-s11-sec"><span>GÖREVLER</span><span>+</span></div>{"".join(f'<span class="pl-s11-it"><span class="pl-s11-ic" style="--c:{c};border-radius:5px">{I("list")}</span>{n}<em>{v}</em></span>' for c,n,v in [("rgb(40 160 100)","Görüşmeler","9"),("rgb(220 90 60)","Kişisel","17"),("rgb(60 110 240)","Projeler","39")])}
<div class="pl-s11-user">{face(41,28)}<span>Muhammed<br><small class="pl-sx-muted">Yönetici</small></span><span style="margin-left:auto">{I("settings")}</span></div></nav>
<div class="pl-s11-cal"><div class="pl-s11-mini"><span class="pl-applogo pl-applogo--sm" style="background:white;color:black">DR</span>{I("grid")}{I("folder")}{I("bar-chart")}<span style="color:white">{I("users")}</span>{I("book")}</div>
<div class="pl-s11-body"><div class="pl-s11-top">Kasım 2026 {I("chevron-down")}<span class="pl-chip">Bugün</span><span class="pl-chip pl-chip--mono">‹ H46 – H47 ›</span></div>
<div class="pl-s11-days">{"".join(f'<div class="{"is-active" if d==14 else ""}">{n}<b>{d}</b></div>' for n,d in zip(["Pzt","Sal","Çar","Per","Cum","Cmt","Paz","Pzt","Sal"],[9,10,11,12,14,15,16,17,18]))}</div>
<div class="pl-s11-grid"><div class="pl-s11-times"><span>10:00</span><span>11:00</span><span>12:00</span><span>13:00</span><span>14:00</span><span>15:00</span><span>16:00</span></div>
<div class="pl-s11-col"><div class="pl-s11-ch">Gece Kuşları <span>24</span></div><div class="pl-s11-ev" style="--c:rgb(240 100 60)"><b><i>{I("users")}</i>Ekip toplantısı</b>10:00 › 11:00</div><div class="pl-s11-ev" style="--c:rgb(60 110 240)"><b><i>{I("book")}</i>Pazarlama kursu</b>10:30 › 11:30<div class="pl-sx-row"><span>Pelikan 21</span><span>Katılıyor</span></div><div class="pl-s11-map"></div></div><div class="pl-s11-ev" style="--c:rgb(160 90 240)"><b><i>{I("star")}</i>Ayşe'nin doğum günü</b>12:30 › 13:30</div><div class="pl-s11-ev" style="--c:rgb(200 60 200)"><b><i>{I("zap")}</i>Slack'i güncelle</b>13:30 › 15:30<span>app.slack.example</span></div></div>
<div class="pl-s11-col"><div class="pl-s11-ch">Revonik <span>28</span></div><div class="pl-s11-map" style="height:90px"></div><div class="pl-s11-ev" style="--c:rgb(60 170 90)"><b><i>{I("utensils")}</i>Öğle yemeği</b>11:00 › 12:30<div class="pl-s11-map"></div></div><div class="pl-s11-ev" style="--c:rgb(40 170 200)"><b><i>{I("video")}</i>Yayın toplantısı</b>14:00 › 15:30</div><div class="pl-s11-ev" style="--c:rgb(60 110 240)"><b><i>{I("mail")}</i>Kampanya</b>15:00 › 16:00</div></div>
<div class="pl-s11-col"><div class="pl-s11-ch">Robotik <span>17</span></div><div class="pl-s11-ev" style="--c:rgb(160 90 240)"><b><i>{I("book")}</i>İngilizce kursu</b>09:30 › 10:30</div><div class="pl-s11-ev" style="--c:rgb(240 100 60)"><b><i>{I("cart")}</i>Yeni dizüstü al</b>10:30 › 12:00<div class="pl-s11-map"></div></div><div class="pl-s11-ev" style="--c:rgb(80 80 90)"><b><i>{I("folder")}</i>Yeni proje</b>12:30 › 13:00</div><div class="pl-s11-ev" style="--c:rgb(160 90 240)"><b><i>{I("users")}</i>Stajyerlerle tanışma</b>14:00 › 15:00</div></div>
<div class="pl-s11-now">13:52</div></div></div>
<aside class="pl-s11-drawer"><h5><span class="pl-s11-ic" style="--c:rgb(160 90 240);border-radius:5px">{I("star")}</span>Ayşe'nin doğum günü</h5><span class="k">{I("users")}ATANANLAR</span>{"".join(f'<div class="pl-sx-row">{face(s,22)}<span style="color:white">{n}</span></div>' for s,n in [(42,"Ayşe K."),(43,"Elif T."),(44,"Yalçın D.")])}
<span class="k">{I("book")}AÇIKLAMA</span><span>Şşş… sürpriz! Öğle arasında pasta keselim.</span><span class="k">{I("check-sq")}KONTROL LİSTESİ</span><span class="pl-s11-chk"><i>✓</i>Pastayı sipariş et</span><span class="pl-s11-chk"><i>✓</i>Hediye al</span><span class="pl-sx-muted">+ Ekle</span><span class="k" style="margin-top:20px">{I("check")}Tamamlandı işaretle</span><span class="k">{I("copy")}Çoğalt</span><span class="k">{I("list")}Kontrol listesi</span></aside></div></div>''')

# ------------------------------------------------------------------ PIN 14 (+N39, N52)
screen(pin=14, ad="Yapay Zekâ Karakter Stüdyosu — Düğüm Editörü", urun="mymind",
  aciklama="Gri sahnede koyu pencere: üst sekme çubuğu ve dışa aktar; solda metin ve referans görsel düğümleri, ortada yapılandırma düğümü ve bezier bağlantılar, sağda üretilen 3B karakter önizlemesi; altta Python betik editörü ve mor ses dalgası zaman çizelgesi.",
  sahne="rgb(120 124 120)",
  css='''
.pl-s14 { width: 1080px; background: rgb(22 22 24); border-radius: 18px; overflow: hidden; color: var(--pl-fg-2); display: grid; grid-template-columns: 44px 1fr; }
.pl-s14-rail { display: grid; align-content: start; justify-items: center; gap: 16px; padding: 14px 0; border-right: 1px solid rgb(255 255 255 / .06); color: var(--pl-fg-3); }
.pl-s14-top { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid rgb(255 255 255 / .06); font-size: 11px; }
.pl-s14-tab { display: flex; gap: 6px; align-items: center; padding: 5px 10px; border-radius: 6px; background: rgb(255 255 255 / .05); color: var(--pl-fg-1); }
.pl-s14-tab.is-active { background: rgb(255 255 255 / .12); }
.pl-s14-body { display: grid; grid-template-columns: 1fr 1fr 44px; height: 340px; }
.pl-s14-canvas { position: relative; border-right: 1px solid rgb(255 255 255 / .06); }
.pl-s14-canvas svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.pl-s14-canvas path { fill: none; stroke: rgb(200 200 210 / .55); stroke-width: 1.5; }
.pl-s14-node { position: absolute; background: rgb(32 32 36); border: 1px solid rgb(255 255 255 / .1); border-radius: 10px; padding: 8px; font-size: 9.5px; color: var(--pl-fg-1); }
.pl-s14-node h6 { margin: 0 0 6px; font-size: 8px; letter-spacing: .1em; color: var(--pl-fg-3); font-weight: 600; }
.pl-s14-node .pl-s14-row { display: flex; gap: 6px; align-items: center; padding: 4px 6px; border-radius: 5px; background: rgb(255 255 255 / .04); margin-top: 4px; }
.pl-s14-node .pl-s14-row i { width: 8px; height: 8px; border-radius: 2px; background: var(--c); }
.pl-s14-node.is-sel { box-shadow: 0 0 0 1.5px rgb(120 220 255), 0 0 20px rgb(120 220 255 / .25); }
.pl-s14-prev { display: grid; place-items: center; background: radial-gradient(60% 60% at 50% 55%, rgb(60 60 66), rgb(22 22 24)); position: relative; }
.pl-s14-char { width: 150px; height: 270px; position: relative; }
.pl-s14-char i { position: absolute; display: block; }
.pl-s14-tools { display: grid; align-content: start; justify-items: center; gap: 14px; padding-top: 14px; color: var(--pl-fg-3); }
.pl-s14-bottom { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid rgb(255 255 255 / .06); height: 150px; }
.pl-s14-code { font-family: var(--pl-font-mono); font-size: 10px; line-height: 1.7; padding: 10px 14px; border-right: 1px solid rgb(255 255 255 / .06); color: rgb(200 200 210); }
.pl-s14-code .k { color: rgb(200 140 255); } .pl-s14-code .s { color: rgb(150 220 140); } .pl-s14-code .c { color: var(--pl-fg-4); }
.pl-s14-tl { padding: 10px 14px; display: grid; gap: 8px; align-content: start; }
.pl-s14-ruler { display: flex; justify-content: space-between; font-family: var(--pl-font-mono); font-size: 8px; color: var(--pl-fg-4); }
.pl-s14-wave { height: 40px; border-radius: 6px; background: rgb(150 100 240); display: flex; align-items: center; gap: 1px; padding: 0 4px; }
.pl-s14-wave i { flex: 1; background: rgb(255 255 255 / .7); border-radius: 1px; }
''',
  html=f'''<div class="pl-s14"><nav class="pl-s14-rail"><span class="pl-applogo pl-applogo--sm">MM</span>{I("grid")}{I("pointer")}{I("wand")}{I("layers")}{I("image")}{I("settings")}</nav>
<div><div class="pl-s14-top"><span class="pl-s14-tab is-active">{I("cube")}Yeni karakter</span><span class="pl-s14-tab">{I("image")}Karakter çizimleri</span><span class="pl-s14-tab">{I("film")}Sahneler</span><span class="pl-sx-muted">+</span><span style="flex:1"></span><span class="pl-chip pl-chip--mono">{I("eye")}%100</span><span class="pl-sx-ibtn" style="width:26px;height:26px;border-radius:6px">{I("undo")}</span><span class="pl-sx-ibtn" style="width:26px;height:26px;border-radius:6px">{I("redo")}</span><button class="pl-btn pl-btn--sm" style="background:rgb(80 110 255);color:white">Dışa aktar</button></div>
<div class="pl-s14-body"><div class="pl-s14-canvas"><svg aria-hidden="true"><path d="M150 70 C 200 70, 200 60, 240 70"/><path d="M150 210 C 200 210, 200 110, 240 100"/><path d="M370 200 C 420 200, 420 260, 480 260"/></svg>
<div class="pl-s14-node" style="left:16px;top:26px;width:130px"><h6>METİN</h6><span style="color:var(--pl-fg-2);line-height:1.5;display:block">Gözlüklü, sırt çantalı, keten gömlekli karakter; Pixar tarzı, yumuşak ışık.</span></div>
<div class="pl-s14-node is-sel" style="left:16px;top:150px;width:110px"><h6>REFERANS</h6><div style="height:70px;border-radius:6px;overflow:hidden">{ph("warm")}</div></div>
<div class="pl-s14-node" style="left:240px;top:40px;width:140px"><h6>SEÇENEKLER</h6>{"".join(f'<div class="pl-s14-row"><i style="--c:{c}"></i>{a}<span style="margin-left:auto;color:var(--pl-fg-3)">{b}</span></div>' for c,a,b in [("rgb(255 120 160)","Stil","Pixar"),("rgb(255 200 80)","Poz","Ayakta"),("rgb(120 220 140)","Renk","Sıcak"),("rgb(120 160 255)","Boyut","Tam boy"),("rgb(200 140 255)","Kalite","Yüksek")])}</div>
<div class="pl-s14-node" style="left:240px;top:200px;width:130px"><h6>MODEL</h6><div class="pl-s14-row"><i style="--c:rgb(80 110 255)"></i>MyMind 3B v2</div></div></div>
<div class="pl-s14-prev"><div class="pl-s14-char"><i style="left:45px;top:0;width:60px;height:66px;border-radius:50%;background:radial-gradient(circle at 50% 70%, rgb(240 200 170) 0 55%, transparent 56%), radial-gradient(circle at 50% 30%, rgb(60 40 30) 0 60%, transparent 61%)"></i><i style="left:52px;top:30px;width:46px;height:12px;border:3px solid rgb(30 30 30);border-radius:8px"></i><i style="left:35px;top:66px;width:80px;height:100px;border-radius:24px 24px 10px 10px;background:linear-gradient(rgb(220 215 190), rgb(190 185 160))"></i><i style="left:60px;top:70px;width:6px;height:96px;background:rgb(200 120 60);transform:rotate(-24deg)"></i><i style="left:40px;top:160px;width:70px;height:60px;border-radius:8px;background:rgb(230 225 210)"></i><i style="left:44px;top:220px;width:24px;height:40px;background:rgb(240 200 170)"></i><i style="left:82px;top:220px;width:24px;height:40px;background:rgb(240 200 170)"></i><i style="left:38px;top:256px;width:34px;height:14px;border-radius:7px;background:rgb(250 250 250)"></i><i style="left:80px;top:256px;width:34px;height:14px;border-radius:7px;background:rgb(250 250 250)"></i></div></div>
<div class="pl-s14-tools">{I("pointer")}{I("star")}{I("cube")}{I("heart")}{I("settings")}</div></div>
<div class="pl-s14-bottom"><div class="pl-s14-code"><span class="pl-sx-muted">Betik.py</span><br><span class="k">import</span> mymind <span class="k">as</span> mm<br><span class="k">from</span> mm.karakter <span class="k">import</span> Uret<br><br>kar = Uret(istem=<span class="s">"gözlüklü gezgin"</span>, stil=<span class="s">"pixar"</span>)<br>kar.disa_aktar(<span class="s">"gezgin.glb"</span>) <span class="c"># 3B çıktı</span></div>
<div class="pl-s14-tl"><div class="pl-s14-ruler">{"".join(f"<span>00:{i*5:02d}</span>" for i in range(8))}</div><div class="pl-s14-wave">{"".join(f'<i style="height:{v}%"></i>' for v in bars(23,90,15,95))}</div><div style="display:flex;justify-content:center;gap:10px;color:var(--pl-fg-3)">{I("skip-back")}{I("play")}{I("skip-forward")}</div></div></div></div></div>''')

# ------------------------------------------------------------------ PIN 15 (+N134)
screen(pin=15, ad="Kat Planı Navigatörü — Rota Bulma", yuzey="glass",
  aciklama="Yeşil-mavi gradyan sahne: sol cam ray, solda yüzen saat/hava kartı, ortada izometrik ofis katı ve yeşil ışıklı rota, renkli konum iğneleri, alt yarım daire 'Rota oluştur' kadranı; sağda kat seçici ve oda listesi.",
  sahne="linear-gradient(120deg, rgb(150 170 210), rgb(110 200 170))",
  css='''
.pl-s15 { width: 1040px; height: 640px; position: relative; color: var(--pl-fg-2); }
.pl-device:has(> .pl-s15) { box-shadow: none; background: transparent; }
.pl-s15-win { position: absolute; left: 50px; top: 50px; right: 120px; bottom: 50px; border-radius: 22px; background: rgb(30 36 44 / .85); overflow: hidden; }
.pl-s15-floor { position: absolute; left: 50%; top: 52%; width: 560px; height: 380px; transform: translate(-50%, -50%) rotateX(56deg) rotateZ(-40deg); display: grid; grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(4, 1fr); gap: 10px; padding: 10px; background: rgb(120 130 140); box-shadow: 24px 24px 0 rgb(40 46 56); }
.pl-s15-floor i { background: rgb(70 76 86); box-shadow: inset 0 0 0 4px rgb(40 44 50), 6px 6px 0 rgb(40 44 50); }
.pl-s15-floor i.is-pink { background: rgb(150 70 110); box-shadow: inset 0 0 0 4px rgb(255 120 180), 0 0 30px rgb(255 80 160 / .5); }
.pl-s15-floor i.is-blue { background: rgb(90 110 140); }
.pl-s15-route { position: absolute; inset: 0; pointer-events: none; }
.pl-s15-route path { fill: none; stroke: rgb(80 255 120); stroke-width: 3; filter: drop-shadow(0 0 6px rgb(80 255 120)); }
.pl-s15-rail { position: absolute; left: 34px; top: 120px; width: 46px; padding: 10px 0; border-radius: 16px; background: rgb(40 48 56 / .9); display: grid; justify-items: center; gap: 10px; color: rgb(200 210 220); z-index: 3; box-shadow: 0 20px 40px rgb(0 0 0 / .4); }
.pl-s15-rail span { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; }
.pl-s15-rail span.is-active { background: rgb(60 200 90); color: white; box-shadow: 0 0 16px rgb(60 200 90 / .6); }
.pl-s15-weather { position: absolute; left: 160px; top: 20px; z-index: 3; display: flex; gap: 10px; padding: 10px; border-radius: 18px; background: rgb(40 48 56 / .92); box-shadow: 0 20px 40px rgb(0 0 0 / .4); }
.pl-s15-weather .pl-weather__temp { width: 66px; background: linear-gradient(160deg, rgb(255 150 200), rgb(255 190 120)); }
.pl-s15-dial { position: absolute; left: 50%; bottom: -70px; transform: translateX(-50%); width: 260px; height: 160px; border-radius: 160px 160px 0 0; background: rgb(30 36 44 / .92); border: 1px solid rgb(255 255 255 / .1); display: grid; justify-items: center; padding-top: 20px; color: white; font-size: 10px; z-index: 3; }
.pl-s15-dial::before { content: ""; position: absolute; left: 30%; right: 30%; top: 0; height: 64px; border-radius: 80px 80px 0 0; background: rgb(60 200 90 / .35); clip-path: polygon(0 0, 100% 0, 70% 100%, 30% 100%); }
.pl-s15-panel { position: absolute; right: 20px; top: 110px; width: 260px; z-index: 3; border-radius: 18px; background: rgb(40 48 56 / .95); padding: 12px; display: grid; gap: 10px; box-shadow: 0 20px 40px rgb(0 0 0 / .4); font-size: 11px; color: white; }
.pl-s15-loc { background: rgb(60 200 90); color: white; font-size: 9px; padding: 4px 10px; border-radius: 12px; margin-left: auto; }
.pl-s15-rr { display: grid; grid-template-columns: 22px 1fr auto; gap: 8px; align-items: center; padding: 5px 6px; font-size: 10px; border-radius: 8px; }
.pl-s15-rr i { width: 22px; height: 22px; border-radius: 50%; background: var(--c); display: grid; place-items: center; color: white; font-style: normal; font-size: 10px; }
.pl-s15-rr em { font-style: normal; font-size: 9px; padding: 2px 8px; border-radius: 10px; background: rgb(255 255 255 / .1); }
.pl-s15-rr.is-active { background: rgb(60 200 90 / .25); box-shadow: inset 0 0 0 1px rgb(60 200 90); } .pl-s15-rr.is-active em { background: rgb(60 200 90); }
''',
  html=f'''<div class="pl-s15"><div class="pl-s15-win"><div class="pl-sx-row" style="position:absolute;left:30px;top:16px;z-index:2;color:var(--pl-fg-3);font-size:10px">Ayrıntılı<br>kat planı<span class="pl-chip" style="margin-left:60px">{I("search")}Toplantı odası ara</span><span class="pl-chip" style="background:rgb(60 200 90 / .25);color:rgb(120 255 140)">İptal</span></div>
<div class="pl-s15-floor">{"".join(f'<i class="{c}"></i>' for c in ["","","is-pink","","","is-blue","is-blue","","","","","","","","is-blue","","","","","","","","",""])}</div>
<svg class="pl-s15-route" viewBox="0 0 870 500" aria-hidden="true"><path d="M140 380 L300 380 L360 300 L520 300 L560 260"/></svg>
<span class="pl-hotspot" style="left:47%;top:30%"><span class="pl-hotspot__pin" style="--c:rgb(255 80 160)">{I("utensils")}</span></span><span class="pl-hotspot" style="left:62%;top:52%"><span class="pl-hotspot__pin" style="--c:rgb(80 160 255)">{I("star")}</span></span><span class="pl-hotspot" style="left:26%;top:62%"><span class="pl-hotspot__pin" style="--c:rgb(60 200 90)">{I("briefcase")}</span></span>
<div class="pl-s15-dial">{I("nav")}Rota oluştur<div style="display:flex;gap:40px;margin-top:20px;align-items:center"><span>{I("compass")}</span><span style="width:34px;height:34px;border-radius:50%;background:rgb(255 80 160);display:grid;place-items:center">{I("utensils")}</span><span>{I("building")}</span></div></div></div>
<nav class="pl-s15-rail"><b style="font-size:16px">R</b><span>{I("grid")}</span><span class="is-active">{I("cube")}</span><span>{I("folder")}</span><span>{I("activity")}</span><span>{I("building")}</span><span style="margin-top:60px">{I("sun")}</span><span style="background:rgb(255 255 255 / .12)">{I("power")}</span></nav>
<div class="pl-s15-weather"><div class="pl-weather__time"><span class="pl-weather__day">Salı</span><span class="pl-sx-muted">18.11.2026</span><span class="pl-weather__clock">08:25 <small>öö</small></span></div><div class="pl-weather__temp">{I("cloud",20)}<b>18°</b><small>Bulutlu</small></div></div>
<div class="pl-s15-panel"><div class="pl-sx-row">{I("layers")}<b style="font-size:13px">Kat</b><span class="pl-s15-loc">⊕ Konumunuz</span></div><div class="pl-sx-row" style="background:rgb(255 255 255 / .06);padding:8px 10px;border-radius:8px;justify-content:space-between">Birinci kat {I("chevron-down")}</div>
<div class="pl-sx-row">{I("eye")}<b style="font-size:13px">Birinci katta</b></div><div class="pl-sx-row" style="background:rgb(255 255 255 / .06);padding:7px 10px;border-radius:8px;color:var(--pl-fg-3)">{I("search")}Oda adını girin</div>
{"".join(f'<div class="pl-s15-rr{" is-active" if a else ""}"><i style="--c:{c}">{I(ic)}</i>{n}<em>{t}</em></div>' for c,ic,n,t,a in [("rgb(255 80 160)","utensils","Test odası","3dk",False),("rgb(240 200 40)","message","Konuşma ve konferans odası","10dk",False),("rgb(150 90 255)","box","Depo ve çalışma alanı","2dk",False),("rgb(60 200 90)","utensils","Yemek ve dinlenme","Rota 4dk",True),("rgb(140 220 60)","lock","Özel oda","8dk",False),("rgb(255 130 50)","users","Ana toplantı salonu","12dk",False),("rgb(60 160 255)","sun","Ortak alanlar","20dk",False)])}</div></div>''')
