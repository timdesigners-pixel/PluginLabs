"""Pinlere daha da yaklaştırma katmanı — mevcut ekranların seçili bölümlerini ayrıntılı sürümleriyle değiştirir."""
import re, math, random
import pin_base
from pin_base import ph, face, I, smooth, area, bars
import iso3d as Z

def scr(pin):
    return next(s for s in pin_base.S if s["pin"] == pin)

def sub(pin, pattern, repl, field="html", flags=re.S):
    s = scr(pin)
    new, n = re.subn(pattern, lambda m: repl, s[field], count=1, flags=flags)
    if n == 0:
        raise ValueError(f"pin {pin}: desen bulunamadı: {pattern[:60]}")
    s[field] = new

def add_css(pin, css):
    scr(pin)["css"] += "\n" + css

def dev_pin(x, y, ic, cls="pl-up-dev"):
    return f'<span class="{cls}" style="left:{x}%;top:{y}%">{I(ic)}</span>'

COMMON = '''
.pl-up-dev { position: absolute; transform: translate(-50%, -100%); width: 22px; height: 22px; border-radius: 50%; background: rgb(255 255 255); color: rgb(40 70 130); display: grid; place-items: center; box-shadow: 0 4px 10px rgb(0 0 0 / .35); z-index: 2; }
.pl-up-dev::after { content: ""; position: absolute; left: 50%; bottom: -5px; width: 2px; height: 6px; background: rgb(255 255 255); transform: translateX(-50%); }
.pl-up-dev .pl-ico { width: 12px; height: 12px; }
.pl-up-dev--y { background: rgb(255 210 60); color: rgb(60 40 0); } .pl-up-dev--y::after { background: rgb(255 210 60); }
'''

# =====================================================================
# PIN 0 — SmartThings tarzı pastel kat planı (duvarlar, mobilya, cihaz iğneleri)
# =====================================================================
def plan00():
    s, ox, oy = 15, 300, 40
    W = (240, 242, 246)
    rooms = [(0,0,7,6,"rgb(150 180 245)"),(7,0,8,6,"rgb(170 225 160)"),(15,0,6,5,"rgb(250 220 130)"),(21,0,5,9,"rgb(140 215 200)"),
             (15,5,6,4,"rgb(250 235 190)"),(0,6,6,6,"rgb(245 170 210)"),(6,6,9,6,"rgb(190 230 175)"),(15,9,11,3,"rgb(160 220 245)")]
    walls = [(0,0,26,0),(0,0,0,12),(26,0,26,12),(0,12,26,12),(7,0,7,4),(15,0,15,3),(21,0,21,7),(0,6,4,6),(6,6,6,12),(15,5,21,5),(15,7,15,12),(17,9,26,9)]
    furn = [(1,1,3,2.5,.8,(250,250,252)),(1,4,1,1,.6,(120,90,70)),(9,1,4,1.6,.9,(90,110,150)),(10,3.4,2,1.2,.5,(160,120,90)),
            (16,.6,4,1,1,(250,250,252)),(16,2.5,2,1.6,.8,(200,170,130)),(22,1,2.8,3,.7,(250,250,252)),(1,7,3,3,.7,(250,250,252)),
            (8,8,4,2,.6,(130,170,220)),(18,10,3,1.2,.6,(250,250,252)),(23.5,6,1.5,2,1.4,(110,180,230))]
    it = Z.plan(rooms, walls, furn, s=s, ox=ox, oy=oy, wall_rgb=W, wall_h=1.6, t=.3, slab=(0,0,26,12,.8,(225,228,236)))
    vb = "-10 -10 640 420"
    pins = [(3,3,"bulb",""),(11,1.5,"tv",""),(18,1.5,"thermo","--y"),(23,3,"wifi",""),(3,9,"camera",""),(10,9,"bulb","--y"),(18,10.5,"fan",""),(24,10.5,"bulb",""),(17,6.5,"lock",""),(12,4,"music","")]
    html = "".join(dev_pin(*Z.to_screen(x, y, 2.2, s, ox, oy, vb), ic, "pl-up-dev pl-up-dev" + v if v else "pl-up-dev") for x, y, ic, v in pins)
    return f'<div style="position:relative;width:640px;height:420px">{Z.svg(it, vb)}{html}</div>'

sub(0, r'<div class="pl-sx-isofloor .*?</div>\n(?=.*?<span class="pl-s00-dev")', plan00() + "\n")
scr(0)["html"] = re.sub(r'<span class="pl-s00-dev".*?</span>(?=<span class="pl-s00-dev"|</div>)', "", scr(0)["html"], flags=re.S)
add_css(0, COMMON + '''
.pl-s00 { border: 14px solid rgb(250 250 252); border-radius: 6px; box-shadow: inset 0 0 0 2px rgb(30 30 34); }
.pl-s00-plan { height: 440px; }
.pl-s00-plan > div:last-child { margin-top: 30px; }
.pl-s00-stand { width: 190px; height: 38px; background: linear-gradient(rgb(150 154 160), rgb(90 92 96)); }
''')

# =====================================================================
# PIN 1 — Kesit 3B daire: duvarlar, mobilya, sıcak ışıklar
# =====================================================================
def plan01():
    s, ox, oy = 25, 400, 60
    W = (238, 240, 246)
    wood, tile, rug = "rgb(150 112 84)", "rgb(206 208 214)", "rgb(120 126 150)"
    rooms = [(0,0,10,8,wood),(10,0,7,6,wood),(17,0,7,6,tile),(0,8,8,8,wood),(8,6,9,10,wood),(17,6,7,10,wood)]
    walls = [(0,0,24,0),(0,0,0,16),(24,0,24,16,.5),(0,16,24,16,.5),(10,0,10,5),(17,0,17,6),(0,8,6,8,1.2),(8,8,8,16,1.2),(10,6,24,6,1.2),(17,9,17,16,1.2)]
    furn = [(1,1,4,3,.7,(232,232,236)),(1,1,4,.5,1.3,(90,94,110)),(6,1,2,1.2,.5,(170,130,95)),(1,5.5,6,1.4,.6,(90,96,130)),
            (11,1,4.5,1.2,.9,(70,74,90)),(11,3,3,1.5,.45,(170,140,110)),(18,.6,5,1.2,1.1,(230,230,234)),(19,2.6,3,1.6,.9,(250,250,252)),
            (1,9,5,3.5,.6,(236,236,240)),(1,9,5,.6,1.2,(80,84,100)),(9,8,5,2,.7,(130,90,70)),(9,11,3,3,.05,(110,120,150)),(13,12,3,1.5,.8,(90,94,110)),
            (18,7,4,3,.7,(236,236,240)),(18,7,4,.6,1.2,(80,84,100)),(18,12,4,2,.9,(200,200,206)),(22,13,1.5,2,.6,(240,240,244))]
    lights = [(4,4,5,"rgb(255 190 110)"),(12,3,3,"rgb(255 200 130)"),(4,12,4,"rgb(255 180 100)"),(12,10,4,"rgb(255 196 120)"),(20,10,3.5,"rgb(255 190 110)")]
    it = Z.plan(rooms, walls, furn, lights, s=s, ox=ox, oy=oy, wall_rgb=W, wall_h=2.6, t=.38, slab=(-.6,-.6,25.2,17.2,1.2,(52,58,80)))
    return Z.svg(it, "-10 0 1020 760")

sub(1, r'<div class="pl-s01-apt">.*?</div>(?=\n<span class="pl-s01-tag">)', f'<div class="pl-s01-apt3d">{plan01()}</div>')
add_css(1, '''
.pl-s01-apt3d { position: absolute; left: -10px; right: 10px; top: 20px; bottom: 30px; }
.pl-s01-view { background: radial-gradient(70% 70% at 45% 50%, rgb(70 84 130), rgb(26 32 54) 70%); }
.pl-s01-tag { left: 16%; top: 12%; }
''')

# =====================================================================
# PIN 8 — IoT bina: koridorlu çok odalı 3B kat, ışıyan altıgenler
# =====================================================================
def plan08():
    s, ox, oy = 15, 380, 30
    B = (44, 58, 96)
    rooms = [(0,0,30,22,"rgb(26 36 64)")]
    walls = []
    random.seed(8)
    for x in range(0, 31, 5): walls.append((x, 0, x, 22 if x in (0, 30) else 9))
    for x in range(0, 31, 5): walls.append((x, 13, x, 22)) if 0 < x < 30 else None
    walls += [(0,0,30,0),(0,22,30,22),(0,9,30,9),(0,13,30,13),(10,4.5,20,4.5),(0,17.5,10,17.5),(20,17.5,30,17.5)]
    furn = [(x+1, y+1, 1.6, 1, .5, (60, 80, 130)) for x in range(0, 30, 5) for y in (0, 14) ]
    it = Z.plan(rooms, walls, furn, s=s, ox=ox, oy=oy, wall_rgb=B, wall_h=1.8, t=.3, slab=(0,0,30,22,1,(18,26,50)), wall_stroke="rgb(90 120 190 / .5)")
    vb = "-20 -10 900 620"
    hexes = [(7,4,"rgb(255 80 100)"),(16,11,"rgb(50 120 255)"),(23,6,"rgb(50 120 255)"),(12,16,"rgb(60 220 160)"),(26,18,"rgb(255 80 100)"),(4,19,"rgb(60 220 160)")]
    hx = "".join(f'<span class="pl-s08-hex" style="left:{a}%;top:{b}%;--c:{c}"></span>' for (x, y, c) in hexes for a, b in [Z.to_screen(x, y, 3, s, ox, oy, vb)])
    return f'<div class="pl-s08-3d">{Z.svg(it, vb)}{hx}</div>'

sub(8, r'<div class="pl-s08-bld">.*?</div>\n\{?', plan08(), flags=re.S) if False else None
scr(8)["html"] = re.sub(r'<div class="pl-s08-bld">.*?</div>\n(<span class="pl-s08-hex"[^>]*></span>)+', plan08(), scr(8)["html"], flags=re.S)
assert "pl-s08-3d" in scr(8)["html"]
add_css(8, '''
.pl-s08-3d { position: absolute; left: -30px; right: -20px; top: 50px; bottom: -40px; }
.pl-s08-3d .pl-s08-hex { transform: translate(-50%, -50%); }
.pl-s08 { border: 12px solid rgb(30 32 38); border-radius: 14px; }
''')

# =====================================================================
# PIN 15 — Ofis katı: duvarlı odalar, pembe ışıyan oda, yeşil rota
# =====================================================================
def plan15():
    s, ox, oy = 17, 400, 30
    G = (96, 104, 116)
    rooms = [(0,0,28,18,"rgb(70 76 88)"),(10,0,6,5,"rgb(170 70 120)","rgb(255 120 190)"),(0,12,6,6,"rgb(90 110 140)"),(22,0,6,6,"rgb(90 110 140)")]
    walls = [(0,0,28,0),(0,0,0,18),(28,0,28,18),(0,18,28,18),(6,0,6,6),(10,0,10,5),(16,0,16,5),(10,5,16,5),(22,0,22,6),(22,6,28,6),(0,6,6,6),
             (0,12,6,12),(6,12,6,18),(12,12,12,18),(18,12,18,18),(12,12,22,12),(22,12,22,18),(9,8,19,8)]
    furn = [(1,1,4,2,.5,(130,136,150)),(23,1,4,2,.5,(130,136,150)),(11,1,4,1.6,.5,(220,140,180)),(13,13,4,2,.5,(130,136,150)),(19,13,2,3,.5,(130,136,150)),
            (1,13,4,2,.5,(140,160,200)),(10,9,8,1.2,.4,(120,126,140))]
    route = [(2,15),(8,15),(8,10),(20,10),(20,7),(24,7)]
    pts = " ".join(f"{a},{b}" for a, b in [Z.P(x, y, .2, s, ox, oy) for x, y in route])
    extra = [(1e5, f'<polyline points="{pts}" fill="none" stroke="rgb(80 255 120)" stroke-width="4" stroke-linejoin="round" filter="url(#isoglow)"/><polyline points="{pts}" fill="none" stroke="rgb(170 255 190)" stroke-width="2" stroke-linejoin="round"/>')]
    it = Z.plan(rooms, walls, furn, [(13,2.5,3,"rgb(255 90 170)")], s=s, ox=ox, oy=oy, wall_rgb=G, wall_h=1.4, t=.35, slab=(0,0,28,18,.9,(40,46,56)), extra=extra)
    vb = "0 0 860 560"
    hs = [(13,2.5,"utensils","rgb(255 80 160)"),(20,7,"star","rgb(80 160 255)"),(3,14,"briefcase","rgb(60 200 90)"),(24,3,"lock","rgb(140 220 60)")]
    pins = "".join(f'<span class="pl-hotspot" style="left:{a}%;top:{b}%"><span class="pl-hotspot__pin" style="--c:{c}">{I(ic)}</span></span>' for x, y, ic, c in hs for a, b in [Z.to_screen(x, y, 1.6, s, ox, oy, vb)])
    return Z.svg(it, vb) + pins

scr(15)["html"] = re.sub(r'<div class="pl-s15-floor">.*?</div>\n<svg class="pl-s15-route".*?</svg>', f'<div class="pl-s15-3d">{plan15()}</div>', scr(15)["html"], flags=re.S)
scr(15)["html"] = re.sub(r'<span class="pl-hotspot" style="left:(47|62|26)%[^"]*"><span class="pl-hotspot__pin"[^>]*>.*?</span></span>', "", scr(15)["html"], flags=re.S)
add_css(15, '.pl-s15-3d { position: absolute; left: 10px; right: 120px; top: 20px; bottom: 40px; }')

# =====================================================================
# PIN 70 — Güvenlik: kesit bina, pembe-kırmızı ışıyan koridor
# =====================================================================
def plan70():
    s, ox, oy = 14, 330, 20
    B = (40, 46, 70)
    rooms = [(0,0,32,22,"rgb(22 26 40)"),(12,9,12,4,"rgb(255 140 160)")]
    walls = [(0,0,32,0),(0,0,0,22),(32,0,32,22),(0,22,32,22),(0,9,12,9),(24,9,32,9),(0,13,12,13),(24,13,32,13),(12,9,24,9),(12,13,24,13),
             (6,0,6,9),(12,0,12,9),(18,0,18,9),(24,0,24,9),(6,13,6,22),(16,13,16,22),(24,13,24,22)]
    furn = [(x+1,1,3,2,.6,(60,70,100)) for x in (0,6,12,18,24)] + [(1,15,3,4,.6,(60,70,100)),(18,15,4,2,.6,(60,70,100)),(26,15,4,3,.6,(60,70,100))]
    it = Z.plan(rooms, walls, furn, [(18,11,6,"rgb(255 90 120)")], s=s, ox=ox, oy=oy, wall_rgb=B, wall_h=2, t=.4, slab=(0,0,32,22,1.2,(14,16,26)), wall_stroke="rgb(90 100 140 / .6)")
    return Z.svg(it, "0 0 800 560")

scr(70)["html"] = re.sub(r'<div class="pl-s70-b">.*?</div>', f'<div class="pl-s70-3d">{plan70()}</div>', scr(70)["html"], flags=re.S)
sub(70, r'left:58%;top:44%', 'left:56%;top:40%')
sub(70, r'left:38%;top:60%', 'left:30%;top:56%')
add_css(70, '.pl-s70-3d { position: absolute; left: -10px; right: -10px; top: 50px; bottom: 0; }\n.pl-s70 { border: 12px solid rgb(30 32 38); border-radius: 14px; }')


# =====================================================================
# Çizim yükseltmeleri
# =====================================================================
import pin_art as A

# PIN 2 — tırmanan siluet sahnesi
sub(2, r'<div class="pl-s02-bg"></div>', f'<div class="pl-s02-bg">{A.climber_scene()}</div>')
add_css(2, ".pl-s02-bg::before, .pl-s02-bg::after { display: none; }\n.pl-s02-scrim { background: linear-gradient(90deg, rgb(0 0 0 / .8), transparent 50%), linear-gradient(0deg, rgb(0 0 0) 8%, transparent 52%); }\n.pl-s02-p b { font-size: 13px; }")

# PIN 4 — fantastik kahraman görseli
sub(4, r'(<div class="pl-s04-hero">)<div class="pl-sx-ph[^>]*></div>', f'<div class="pl-s04-hero"><div class="pl-sx-ph">{A.fantasy_hero()}</div>')
add_css(4, ".pl-s04-hero .pl-sx-ph { position: absolute; inset: 0; }")

# PIN 5 — öne çıkan kapak görseli
sub(5, r'(<div class="pl-s05-c is-main">)<div class="pl-sx-ph[^>]*></div>', f'<div class="pl-s05-c is-main"><div class="pl-sx-ph">{A.fantasy_hero()}</div>')

# PIN 9 — DNA parçacık bulutu
sub(9, r'<div style="position:absolute;inset:40px 30px 30px"><svg.*?</svg></div>', f'<div style="position:absolute;inset:36px 20px 20px">{A.dna_cloud()}</div>')

# PIN 10 — iskeletli anatomi
add_css(10, '.pl-s10-c svg { height: 540px !important; width: auto; } .pl-s10-c { overflow: hidden; }')
sub(10, r'(<div class="pl-s10-c">)<svg.*?</svg>', f'<div class="pl-s10-c">{A.anatomy()}')

# PIN 14 — ayrıntılı 3B karakter
sub(14, r'<div class="pl-s14-char">.*?</div>', f'<div class="pl-s14-char" style="width:210px;height:320px">{A.character()}</div>')

# PIN 17 — dünya önizlemesi
sub(17, r'(<div class="pl-s17-prev">)<div class="pl-sx-ph[^>]*></div>', f'<div class="pl-s17-prev">{A.earth()}')

# PIN 22 — fotoğraflı poster, macOS duvar kâğıdı, turuncu menü vurgusu
sub(22, r'<div class="pl-s22-poster"><i></i><b>NEW<br>ERA</b></div>', f'<div class="pl-s22-poster">{A.poster_person()}</div>')
scr(22)["sahne"] = A.macos_wall()
add_css(22, ".pl-s22 .pl-menuitem.is-open { background: rgb(255 110 50); color: white; }\n.pl-s22-poster { width: 230px; height: 306px; }")

# PIN 45 — 3B oyun ikonları ve oynat düğmeleri
_kinds = iter(["sword", "rocket", "knight", "other"])
scr(45)["html"] = re.sub(r'(<div class="pl-s45-g"[^>]*>)<i></i>', lambda m: m.group(1) + f'<i>{A.icon3d(next(_kinds))}</i><span class="pl-s45-play">{I("play")}</span>', scr(45)["html"])
add_css(45, ".pl-s45-g i { background: none !important; box-shadow: none; transform: none; width: 96px; height: 96px; top: -40px; right: 0; border-radius: 0; }\n.pl-s45-g i svg { width: 100%; height: 100%; filter: drop-shadow(0 12px 16px rgb(0 0 0 / .4)); }\n.pl-s45-play { width: 26px; height: 26px; border-radius: 50%; background: rgb(255 255 255); color: rgb(30 30 50); display: grid; place-items: center; margin-bottom: 6px; } .pl-s45-play .pl-ico { width: 12px; height: 12px; }")

# PIN 50 — bronş ağaçlı 3B akciğer
sub(50, r'(<div class="pl-s50-viz">)<svg.*?</svg>', f'<div class="pl-s50-viz">{A.lungs3d()}')
add_css(50, ".pl-s50-viz { background: radial-gradient(60% 50% at 50% 60%, rgb(225 232 245), transparent 70%); }")

# PIN 61 — modern ev görseli ve dalga formu portföy grafiği
sub(61, r'<div class="pl-s61-house">.*?</div>(?=</div>\s*<div class="pl-s61-kpis">)', f'<div class="pl-s61-house">{A.modern_house()}</div>')
_r = random.Random(61)
_bars = "".join(f'<rect x="{i*2.5:.1f}" y="{40-h/2:.1f}" width="1.6" height="{h:.1f}" fill="rgb(255 170 60)" opacity="{.5+_r.random()*.5:.2f}"/>' for i in range(120) for h in [abs(math.sin(i/7))*30*_r.uniform(.4,1)+4])
sub(61, r'<svg viewBox="0 0 300 80" style="width:100%;height:80px" aria-hidden="true">.*?</svg>', f'<svg viewBox="0 0 300 80" style="width:100%;height:80px" preserveAspectRatio="none" aria-hidden="true">{_bars}</svg><div class="pl-sx-row" style="justify-content:space-between;font-size:8.5px"><span>Oca</span><span>Nis</span><span>Tem</span><span>Eki</span></div>')
add_css(61, ".pl-s61-house { left: 4%; right: 0; bottom: 0; height: 78%; }\n.pl-s61-hero { background: rgb(18 16 14); }")

# PIN 167 — renkli üst kenarlı özet kartları
add_css(167, ".pl-s167-k div { border-top: 3px solid var(--k); } .pl-s167-k div:nth-child(1) { --k: rgb(255 80 120); } .pl-s167-k div:nth-child(2) { --k: rgb(60 120 255); } .pl-s167-k div:nth-child(3) { --k: rgb(255 150 60); }\n.pl-s167-acc:nth-of-type(1) i { background: rgb(255 80 120); }")

# PIN 26 — iptal kartı vurgusu
add_css(26, ".pl-s26-st:nth-child(3) { background: rgb(255 238 240); box-shadow: 0 10px 30px rgb(255 80 100 / .18); }\n.pl-s26-head { background: rgb(36 40 80); }")

# PIN 23 — gerçekçi yemek çizimleri
_f = iter([("burger",1),("salad",2),("caesar",3)])
scr(23)["html"] = re.sub(r'<div class="img" style="background:[^"]*"></div>', lambda m: (lambda k: f'<div class="img">{A.food(*k)}</div>')(next(_f)), scr(23)["html"], count=3)
_c = iter([None,("burger",4),None,("salad",5),None,None])
def _cat(m):
    k = next(_c)
    return m.group(0) if not k else f'<i style="--c:transparent;background:none">{A.food(*k)}</i>'
scr(23)["html"] = re.sub(r'<i style="--c:[^"]*"></i>', _cat, scr(23)["html"], count=6)
add_css(23, ".pl-s23-card .img { background: none; box-shadow: none; } .pl-s23-card .img svg, .pl-s23-cats i svg { width: 100%; height: 100%; filter: drop-shadow(0 8px 10px rgb(0 0 0 / .18)); }\n.pl-s23-promo::after { display: none; }")
sub(23, r'<div class="pl-s23-promo">', f'<div class="pl-s23-promo"><span style="position:absolute;right:-18px;top:-26px;width:96px;height:96px;transform:rotate(-14deg)">{A.food("burger",9)}</span>')

# PIN 31 — çentikli skor yayı + ikinci kart sırası
add_css(31, ".pl-s31-score .ring { border: 0; width: 120px; height: 72px; border-radius: 0; background: radial-gradient(60px 60px at 50% 100%, transparent 70%, rgb(40 160 140) 71% 100%, transparent 101%); -webkit-mask: repeating-conic-gradient(from -90deg at 50% 100%, black 0 4deg, transparent 4deg 7deg); mask: repeating-conic-gradient(from -90deg at 50% 100%, black 0 4deg, transparent 4deg 7deg); position: relative; }\n.pl-s31-score { position: relative; } .pl-s31-score b.v { position: absolute; left: 38px; top: 30px; font-size: 30px; font-weight: 400; color: rgb(20 20 26); }")
sub(31, r'<span class="ring">90</span>', '<span class="ring"></span><b class="v">90</b>')
