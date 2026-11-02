"""Pin ekranları için ortak yardımcılar.
Her ekran: {pin, ad, aciklama, yuzey, tema, sahne (arka plan), css, html}
Sınıflar pl-s<pin>- önekli; renkler yalnız token / rgb.
"""
import math, random
from icons import I
from advanced import smooth, area, poly, ecg, bars

S = []
def screen(**k):
    k.setdefault("yuzey", None); k.setdefault("tema", None); k.setdefault("css", ""); k.setdefault("w", 1180)
    k.setdefault("sahne", "var(--pl-bg-0)"); k.setdefault("urun", None)
    S.append(k)

# ---- yer tutucu fotoğraf / sahne (görsel yerine katmanlı gradyan) ----
TONES = {
 "dusk":  "radial-gradient(120% 90% at 70% 10%, rgb(255 170 110 / .55), transparent 55%), linear-gradient(180deg, rgb(60 70 110) 0%, rgb(30 26 44) 100%)",
 "night": "radial-gradient(90% 70% at 30% 20%, rgb(70 90 160 / .7), transparent 60%), linear-gradient(180deg, rgb(18 24 46), rgb(8 10 20))",
 "fire":  "radial-gradient(60% 60% at 60% 60%, rgb(255 140 60 / .8), transparent 60%), linear-gradient(180deg, rgb(40 20 16), rgb(16 10 8))",
 "forest":"radial-gradient(80% 70% at 40% 30%, rgb(150 190 120 / .6), transparent 60%), linear-gradient(180deg, rgb(60 80 60), rgb(20 30 22))",
 "fog":   "radial-gradient(100% 80% at 60% 20%, rgb(230 236 240), rgb(150 165 175) 70%)",
 "ocean": "radial-gradient(90% 80% at 50% 0%, rgb(80 190 230 / .8), transparent 60%), linear-gradient(180deg, rgb(10 60 100), rgb(4 20 40))",
 "neon":  "radial-gradient(70% 70% at 30% 40%, rgb(198 255 61 / .35), transparent 60%), radial-gradient(60% 60% at 70% 60%, rgb(255 80 180 / .45), transparent 60%), linear-gradient(180deg, rgb(28 20 50), rgb(10 8 20))",
 "warm":  "radial-gradient(80% 80% at 50% 30%, rgb(255 210 160 / .7), transparent 60%), linear-gradient(180deg, rgb(120 70 50), rgb(50 28 22))",
 "space": "radial-gradient(60% 60% at 70% 70%, rgb(255 190 120 / .8), rgb(60 80 140 / .5) 40%, transparent 70%), radial-gradient(circle at 18% 22%, rgb(255 255 255 / .8) 0 1px, transparent 2px), radial-gradient(circle at 42% 12%, rgb(255 255 255 / .6) 0 1px, transparent 2px), radial-gradient(circle at 80% 18%, rgb(255 255 255 / .7) 0 1px, transparent 2px), radial-gradient(circle at 30% 60%, rgb(255 255 255 / .5) 0 1px, transparent 2px), linear-gradient(180deg, rgb(4 6 14), rgb(10 14 30))",
 "violet":"radial-gradient(80% 80% at 40% 30%, rgb(170 120 255 / .7), transparent 60%), linear-gradient(180deg, rgb(50 30 90), rgb(20 12 40))",
 "red":   "radial-gradient(70% 70% at 50% 40%, rgb(255 90 90 / .7), transparent 60%), linear-gradient(180deg, rgb(80 20 30), rgb(30 8 12))",
 "gold":  "radial-gradient(80% 80% at 50% 30%, rgb(255 220 120 / .7), transparent 60%), linear-gradient(180deg, rgb(120 90 30), rgb(40 30 10))",
 "ice":   "radial-gradient(80% 80% at 50% 30%, rgb(200 230 255 / .9), transparent 60%), linear-gradient(180deg, rgb(120 150 190), rgb(50 70 100))",
 "food":  "radial-gradient(50% 50% at 50% 50%, rgb(255 190 90) 0 30%, rgb(210 90 50) 31% 45%, rgb(120 170 80) 46% 60%, transparent 62%)",
 "salad": "radial-gradient(50% 50% at 50% 50%, rgb(120 190 90) 0 25%, rgb(230 80 70) 26% 33%, rgb(250 240 220) 34% 58%, transparent 60%)",
 "cake":  "radial-gradient(50% 50% at 50% 55%, rgb(120 50 40) 0 40%, rgb(240 200 190) 41% 52%, transparent 54%)",
}
def ph(tone="night", extra="", cls="", label=""):
    lab = f'<span class="pl-sx-phlabel">{label}</span>' if label else ""
    return f'<div class="pl-sx-ph {cls}" style="background:{TONES.get(tone, tone)};{extra}" aria-hidden="true">{lab}</div>'

def face(seed, size=32, ring=None):
    r = random.Random(seed)
    hue = r.choice([20, 28, 35, 200, 260, 330])
    skin = r.choice(["rgb(240 200 170)", "rgb(220 170 130)", "rgb(180 130 95)", "rgb(130 90 60)"])
    hair = r.choice(["rgb(40 30 25)", "rgb(120 80 40)", "rgb(220 180 110)", "rgb(20 20 25)", "rgb(160 60 40)"])
    rg = f"box-shadow:0 0 0 2px {ring};" if ring else ""
    return (f'<span class="pl-sx-face" style="width:{size}px;height:{size}px;{rg}background:'
            f'radial-gradient(circle at 50% 40%, {skin} 0 26%, transparent 27%),'
            f'radial-gradient(circle at 50% 30%, {hair} 0 34%, transparent 35%),'
            f'radial-gradient(ellipse 60% 40% at 50% 100%, hsl({hue} 60% 55%) 0 99%, transparent 100%),'
            f'linear-gradient(160deg, hsl({hue} 40% 85%), hsl({hue} 40% 65%))" aria-hidden="true"></span>')

def rail(items, active=0, cls="pl-rail", logo=None, bottom=("settings",)):
    out = [f'<nav class="{cls}" aria-label="Gezinme">']
    if logo: out.append(logo)
    for i, ic in enumerate(items):
        out.append(f'<button class="pl-rail__item{" is-active" if i == active else ""}" aria-label="{ic}">{I(ic, 20)}</button>')
    out.append('<span class="pl-rail__spacer"></span>')
    for ic in bottom: out.append(f'<button class="pl-rail__item" aria-label="{ic}">{I(ic, 20)}</button>')
    out.append('</nav>')
    return "".join(out)

def dots(n, on, cls="pl-sensor__dots"):
    return f'<div class="{cls}" aria-hidden="true">' + "".join(f'<i class="{"is-on" if i < on else ""}"></i>' for i in range(n)) + '</div>'

def sw(on=True):
    return f'<span class="pl-switch"><input type="checkbox" role="switch"{" checked" if on else ""}></span>'

def iso_house():
    """İzometrik iki katlı ev — SVG poligonlar."""
    def box(x, y, w, d, h, top, left, right):
        # izometrik kutu: x,y taban ön köşe
        cx, cy = 0.866, 0.5
        p = lambda a, b, c: (round(x + (a - b) * cx, 1), round(y + (a + b) * cy - c, 1))
        A = p(0, 0, h); B = p(w, 0, h); C = p(w, d, h); D = p(0, d, h)
        A0 = p(0, 0, 0); B0 = p(w, 0, 0); D0 = p(0, d, 0); C0 = p(w, d, 0)
        f = lambda pts: " ".join(f"{a},{b}" for a, b in pts)
        return (f'<polygon points="{f([A,B,C,D])}" fill="{top}"/>'
                f'<polygon points="{f([D,C,C0,D0])}" fill="{left}"/>'
                f'<polygon points="{f([B,C,C0,B0])}" fill="{right}"/>')
    g = []
    g.append(box(260, 210, 230, 230, 8, "rgb(60 64 70)", "rgb(40 42 46)", "rgb(30 32 36)"))   # zemin
    g.append(box(250, 196, 150, 120, 70, "rgb(70 74 80)", "rgb(48 50 56)", "rgb(36 38 42)"))  # alt kat
    g.append(box(300, 130, 120, 110, 60, "rgb(84 88 96)", "rgb(56 58 64)", "rgb(40 42 48)"))  # üst kat
    g.append(box(380, 260, 70, 90, 16, "rgb(46 120 140)", "rgb(30 80 100)", "rgb(24 64 80)")) # havuz
    # sıcak pencereler
    win = ''.join(f'<rect x="{x}" y="{y}" width="16" height="22" fill="rgb(255 190 110)" opacity=".85" transform="skewY(30)"/>' for x, y in [(330, -30), (352, -18), (300, 30), (322, 42)])
    win = ''.join(f'<polygon points="{x},{y} {x+18},{y+10} {x+18},{y+34} {x},{y+24}" fill="rgb(255 196 120)" opacity=".9"/>' for x, y in [(312, 150), (340, 166), (262, 226), (290, 242), (318, 258)])
    trees = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="rgb(40 60 40)"/>' for x, y, r in [(170, 300, 18), (190, 320, 12), (520, 330, 16), (480, 360, 11), (210, 350, 14)])
    lights = ''.join(f'<circle cx="{x}" cy="{y}" r="2" fill="rgb(255 220 150)"/>' for x, y in [(240, 330), (300, 370), (360, 400), (430, 395), (500, 360)])
    return f'<svg viewBox="80 40 520 420" class="pl-sx-iso" aria-hidden="true"><defs><filter id="pl-glow"><feGaussianBlur stdDeviation="6"/></filter></defs><ellipse cx="330" cy="380" rx="230" ry="70" fill="rgb(0 0 0 / .35)" filter="url(#pl-glow)"/>{"".join(g)}{win}{trees}{lights}</svg>'

def iso_floor(rooms, w=360, h=250, cls=""):
    """rooms: [(col, row, cs, rs, renk, etiket)] — CSS izometrik oda planı."""
    cells = "".join(f'<div class="pl-sx-room" style="grid-column:{c} / span {cs};grid-row:{r} / span {rs};--c:{col}"><span>{lab}</span></div>' for c, r, cs, rs, col, lab in rooms)
    return f'<div class="pl-sx-isofloor {cls}" style="width:{w}px;height:{h}px">{cells}</div>'

BASE_CSS = r'''
@layer pl {
/* ---------- Pin ekranları ortak (pl-sx-) ---------- */
.pl-stage { padding: clamp(16px, 4vw, 56px); border-radius: var(--pl-radius-2xl); overflow-x: auto; display: flex; justify-content: center; }
.pl-device { flex: none; border-radius: var(--pl-radius-2xl); overflow: hidden; position: relative; box-shadow: 0 40px 80px rgb(0 0 0 / .45), 0 0 0 1px rgb(255 255 255 / .06); font-size: 13px; }
.pl-sx-ph { position: relative; overflow: hidden; border-radius: inherit; width: 100%; height: 100%; }
.pl-sx-phlabel { position: absolute; left: 10px; bottom: 8px; font-family: var(--pl-font-mono); font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: rgb(255 255 255 / .55); }
.pl-sx-face { display: inline-block; border-radius: 50%; flex: none; overflow: hidden; }
.pl-sx-iso { width: 100%; height: 100%; display: block; }
.pl-sx-isofloor { position: relative; transform: rotateX(58deg) rotateZ(-42deg); transform-style: preserve-3d; display: grid; grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(4, 1fr); gap: 4px; padding: 6px; background: rgb(255 255 255 / .08); border-radius: 6px; box-shadow: 16px 16px 0 rgb(0 0 0 / .35); }
.pl-sx-room { position: relative; border-radius: 3px; background: color-mix(in srgb, var(--c) 32%, rgb(20 26 40)); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c) 75%, transparent), 0 0 18px color-mix(in srgb, var(--c) 25%, transparent); }
.pl-sx-room span { position: absolute; left: 6px; top: 4px; font-size: 8px; font-weight: 700; color: rgb(255 255 255 / .8); letter-spacing: .04em; }
.pl-sx-muted { color: var(--pl-fg-3); font-size: 11px; }
.pl-sx-kicker { font-family: var(--pl-font-mono); font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--pl-fg-3); }
.pl-sx-row { display: flex; align-items: center; gap: 8px; }
.pl-sx-col { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.pl-sx-card { background: var(--pl-bg-2); border: 1px solid var(--pl-line); border-radius: 18px; padding: 14px; min-width: 0; }
.pl-sx-ibtn { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: var(--pl-bg-3); color: var(--pl-fg-1); border: 1px solid var(--pl-line); flex: none; }
.pl-sx-ibtn .pl-ico { width: 15px; height: 15px; }
.pl-sx-title { margin: 0; color: var(--pl-fg-1); font-weight: 700; letter-spacing: -.02em; }
.pl-sx-num { font-family: var(--pl-font-display); font-variant-numeric: tabular-nums; color: var(--pl-fg-1); font-weight: 700; letter-spacing: -.03em; }
}
'''
