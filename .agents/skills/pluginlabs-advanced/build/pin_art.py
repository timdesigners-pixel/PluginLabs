"""Pin ekranları için ayrıntılı SVG çizimleri (DNA bulutu, anatomi, akciğer, karakter, 3B ikonlar, ev, sahneler)."""
import math, random

def dna_cloud(w=420, h=560, n=3200, seed=9):
    r = random.Random(seed)
    out = []
    for i in range(n):
        t = r.random()
        y = 30 + t * (h - 60)
        ang = t * 7.5 * math.pi + r.random() * .6
        strand = r.choice((0, math.pi))
        rad = 70 + 40 * math.sin(t * 3)
        x = w / 2 + math.cos(ang + strand) * rad + (t - .5) * 140 + r.gauss(0, 5 + 16 * abs(math.sin(t * 9)) ** 2)
        y += r.gauss(0, 10)
        depth = (math.sin(ang + strand) + 1) / 2
        hue = 200 + t * 120 + r.uniform(-25, 25)
        light = 45 + depth * 25
        sz = .7 + depth * 2.8 * r.random() ** 1.5
        op = .35 + depth * .6
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{sz:.2f}" fill="hsl({hue:.0f} 75% {light:.0f}%)" opacity="{op:.2f}"/>')
    for i in range(120):
        t = r.random(); y = 30 + t * (h - 60)
        x = w / 2 + (t - .5) * 140 + r.gauss(0, 80)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r.uniform(2,4.5):.1f}" fill="none" stroke="hsl({200+t*120:.0f} 70% 60%)" stroke-width=".8" opacity=".6"/>')
    return f'<svg viewBox="0 0 {w} {h}" style="width:100%;height:100%" aria-hidden="true">{"".join(out)}</svg>'

def anatomy():
    bone = 'stroke="rgb(190 240 255)" stroke-width="1.6" fill="none" stroke-linecap="round"'
    ribs = "".join(f'<path d="M100 {104+i*11} C {78-i} {108+i*11}, {72-i*1.5} {120+i*11}, {80} {128+i*12}" {bone}/><path d="M100 {104+i*11} C {122+i} {108+i*11}, {128+i*1.5} {120+i*11}, 120 {128+i*12}" {bone}/>' for i in range(7))
    spine = "".join(f'<rect x="97" y="{96+i*9}" width="6" height="6" rx="1.5" fill="rgb(200 245 255)" opacity=".9"/>' for i in range(22))
    return f'''<svg viewBox="0 0 200 470" style="height:100%;display:block;margin:auto" aria-hidden="true"><defs>
<radialGradient id="pl-an-g" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="rgb(120 220 255)" stop-opacity=".55"/><stop offset="1" stop-color="rgb(30 120 220)" stop-opacity=".18"/></radialGradient>
<filter id="pl-an-b"><feGaussianBlur stdDeviation="3"/></filter></defs>
<ellipse cx="100" cy="448" rx="92" ry="16" fill="none" stroke="rgb(60 200 255)" stroke-width="3" filter="url(#pl-an-b)"/><ellipse cx="100" cy="448" rx="70" ry="11" fill="rgb(40 160 255 / .25)" stroke="rgb(120 230 255)" stroke-width="1.5"/><ellipse cx="100" cy="448" rx="46" ry="7" fill="none" stroke="rgb(160 240 255)" stroke-width="1"/>
<g fill="url(#pl-an-g)" stroke="rgb(130 225 255 / .8)" stroke-width="1"><ellipse cx="100" cy="42" rx="21" ry="26"/><path d="M90 66h20l3 12 32 10c8 3 11 9 12 17l9 92c1 8-6 9-8 2l-13-82-5 2 5 118-9 150c0 10-17 10-17 0l-5-138h-4l-5 138c0 10-17 10-17 0l-9-150 5-118-5-2-13 82c-2 7-9 6-8-2l9-92c1-8 4-14 12-17l32-10z"/></g>
<g {bone}><ellipse cx="100" cy="40" rx="15" ry="18"/><path d="M90 52q10 8 20 0"/><path d="M70 92 L130 92"/><path d="M68 96 L52 198 M132 96 L148 198"/><path d="M52 198 L44 270 M148 198 L156 270"/>
<path d="M80 236 Q100 226 120 236 L124 256 Q100 266 76 256Z"/><path d="M84 258 L80 360 M116 258 L120 360 M80 362 L84 438 M120 362 L116 438"/></g>{ribs}{spine}
<circle cx="100" cy="86" r="8" fill="rgb(255 120 60)" filter="url(#pl-an-b)" opacity=".95"/><circle cx="100" cy="86" r="3.5" fill="rgb(255 200 120)"/>
<circle cx="112" cy="140" r="6" fill="rgb(255 80 90)" opacity=".5" filter="url(#pl-an-b)"/></svg>'''

def lungs3d():
    r = random.Random(50)
    def branch(x, y, ang, ln, depth, out):
        if depth == 0 or ln < 4: return
        x2 = x + math.cos(ang) * ln; y2 = y + math.sin(ang) * ln
        out.append(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="rgb({90+depth*12} {150+depth*10} 230)" stroke-width="{depth*1.1:.1f}" stroke-linecap="round"/>')
        for d in (-1, 1):
            branch(x2, y2, ang + d * r.uniform(.3, .6), ln * r.uniform(.66, .78), depth - 1, out)
    tree = []
    branch(140, 70, math.pi / 2, 50, 1, tree)
    branch(140, 120, math.pi * .78, 34, 7, tree)
    branch(140, 120, math.pi * .22, 34, 7, tree)
    veins = []
    for i in range(70):
        sx = 140 + r.choice((-1, 1)) * r.uniform(30, 110); sy = r.uniform(110, 300)
        veins.append(f'<path d="M{sx:.0f} {sy:.0f} q{r.uniform(-14,14):.0f} {r.uniform(-14,14):.0f} {r.uniform(-20,20):.0f} {r.uniform(-20,20):.0f}" stroke="rgb(230 70 90)" stroke-width=".9" fill="none" opacity=".75"/>')
    return f'''<svg viewBox="0 0 280 340" style="width:100%;height:100%" aria-hidden="true"><defs><radialGradient id="pl-lu" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="rgb(200 230 255)" stop-opacity=".95"/><stop offset=".6" stop-color="rgb(120 175 240)" stop-opacity=".75"/><stop offset="1" stop-color="rgb(70 120 220)" stop-opacity=".6"/></radialGradient></defs>
<ellipse cx="140" cy="322" rx="120" ry="14" fill="rgb(120 150 200 / .25)"/>
<path d="M128 80c-40 2-92 74-96 160-2 44 24 64 58 56 30-7 36-36 36-70z" fill="url(#pl-lu)" stroke="rgb(255 255 255 / .7)"/><path d="M152 80c40 2 92 74 96 160 2 44-24 64-58 56-30-7-36-36-36-70z" fill="url(#pl-lu)" stroke="rgb(255 255 255 / .7)"/>
<path d="M132 22h16v60h-16z" fill="rgb(150 200 245)" stroke="rgb(255 255 255 / .8)"/>{"".join(f'<rect x="131" y="{26+i*7}" width="18" height="3" rx="1.5" fill="rgb(220 240 255)"/>' for i in range(8))}
{"".join(veins)}{"".join(tree)}</svg>'''

def character(scale=1):
    return '''<svg viewBox="0 0 200 330" style="height:100%;display:block;margin:auto" aria-hidden="true"><defs>
<radialGradient id="ch-sk" cx="45%" cy="40%"><stop offset="0" stop-color="rgb(255 222 196)"/><stop offset="1" stop-color="rgb(226 170 135)"/></radialGradient>
<linearGradient id="ch-jk" x1="0" x2="1"><stop offset="0" stop-color="rgb(150 170 100)"/><stop offset="1" stop-color="rgb(110 130 70)"/></linearGradient></defs>
<ellipse cx="100" cy="320" rx="62" ry="8" fill="rgb(0 0 0 / .35)"/>
<path d="M78 236h18l-2 66h-16z" fill="url(#ch-sk)"/><path d="M104 236h18l0 66h-16z" fill="url(#ch-sk)"/>
<path d="M66 296c0-8 10-12 24-12h8v16H70c-3 0-4-2-4-4z" fill="rgb(248 248 250)"/><path d="M102 284h8c14 0 24 4 24 12 0 2-1 4-4 4h-28z" fill="rgb(248 248 250)"/>
<path d="M66 176h68l6 66H60z" fill="rgb(222 210 180)"/>
<path d="M70 108h60c12 0 18 10 18 24v50H52v-50c0-14 6-24 18-24z" fill="rgb(250 250 250)"/>
<path d="M70 106h22l-4 84H54l-2-56c0-16 6-28 18-28zM108 106h22c12 0 18 12 18 28l-2 56h-34z" fill="url(#ch-jk)"/>
<path d="M52 128l-10 60c-1 6 8 8 10 2l10-54z" fill="url(#ch-jk)"/><path d="M148 128l10 60c1 6-8 8-10 2l-10-54z" fill="url(#ch-jk)"/>
<circle cx="47" cy="194" r="7" fill="url(#ch-sk)"/><circle cx="153" cy="194" r="7" fill="url(#ch-sk)"/>
<path d="M72 112 L138 200" stroke="rgb(170 110 60)" stroke-width="6"/><rect x="124" y="190" width="30" height="24" rx="6" fill="rgb(190 125 70)"/>
<rect x="92" y="94" width="16" height="16" fill="url(#ch-sk)"/>
<ellipse cx="100" cy="64" rx="38" ry="40" fill="url(#ch-sk)"/>
<g fill="rgb(70 46 32)">''' + "".join(f'<circle cx="{100+math.cos(a)*36:.0f}" cy="{44+math.sin(a)*18:.0f}" r="{12+3*math.sin(a*3):.0f}"/>' for a in [math.pi*(1+i/10) for i in range(11)]) + '''<circle cx="100" cy="30" r="20"/></g>
<ellipse cx="62" cy="70" rx="6" ry="9" fill="url(#ch-sk)"/><ellipse cx="138" cy="70" rx="6" ry="9" fill="url(#ch-sk)"/>
<g fill="none" stroke="rgb(30 30 34)" stroke-width="3.5"><circle cx="84" cy="70" r="12"/><circle cx="116" cy="70" r="12"/><path d="M96 70h8"/></g>
<circle cx="84" cy="71" r="3.5" fill="rgb(40 30 26)"/><circle cx="116" cy="71" r="3.5" fill="rgb(40 30 26)"/>
<path d="M90 90q10 8 20 0" stroke="rgb(150 80 60)" stroke-width="2.5" fill="none" stroke-linecap="round"/><ellipse cx="74" cy="86" rx="6" ry="3" fill="rgb(255 150 140 / .5)"/><ellipse cx="126" cy="86" rx="6" ry="3" fill="rgb(255 150 140 / .5)"/></svg>'''

def icon3d(kind):
    if kind == "sword":
        return '''<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="i3s" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="rgb(255 255 255)"/><stop offset=".5" stop-color="rgb(200 214 235)"/><stop offset="1" stop-color="rgb(130 150 185)"/></linearGradient></defs>
<path d="M78 6 L92 8 L90 22 L44 68 L32 56Z" fill="url(#i3s)"/><path d="M78 6 L92 8 L44 62 Z" fill="rgb(255 255 255 / .6)"/><rect x="22" y="56" width="34" height="9" rx="4" transform="rotate(45 39 60)" fill="rgb(250 180 40)"/><rect x="16" y="66" width="10" height="22" rx="4" transform="rotate(45 21 77)" fill="rgb(170 90 50)"/><circle cx="12" cy="88" r="6" fill="rgb(250 180 40)"/></svg>'''
    if kind == "rocket":
        return '''<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="i3r" x1="0" x2="1"><stop offset="0" stop-color="rgb(255 255 255)"/><stop offset="1" stop-color="rgb(190 196 225)"/></linearGradient></defs>
<path d="M30 70 C 20 40, 50 10, 88 10 C 88 48, 58 78, 30 70Z" fill="url(#i3r)"/><circle cx="64" cy="36" r="9" fill="rgb(90 110 250)" stroke="rgb(255 255 255)" stroke-width="3"/><path d="M30 70 L14 64 L30 46Z M30 70 L36 86 L54 70Z" fill="rgb(255 90 90)"/><path d="M28 72 L10 90 L24 76Z" fill="rgb(255 190 60)"/></svg>'''
    if kind == "knight":
        return '''<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="i3k" x1="0" x2="1"><stop offset="0" stop-color="rgb(255 255 255)"/><stop offset="1" stop-color="rgb(185 205 240)"/></linearGradient></defs>
<path d="M28 88 L72 88 L70 76 L62 70 C 70 56, 74 44, 66 30 C 58 14, 40 10, 30 18 L32 26 L22 40 L28 48 L40 42 C 42 54, 34 62, 30 76Z" fill="url(#i3k)"/><circle cx="44" cy="28" r="3" fill="rgb(40 50 90)"/><rect x="24" y="86" width="52" height="8" rx="3" fill="rgb(140 165 220)"/></svg>'''
    return '''<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M20 80 L50 14 L80 80Z" fill="rgb(255 220 120)"/><path d="M50 14 L80 80 L50 66Z" fill="rgb(240 170 70)"/></svg>'''

def modern_house():
    win = lambda x, y, w, h: f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#mh-w)"/><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="rgb(40 36 32)" stroke-width="2"/>'
    return f'''<svg viewBox="0 0 520 320" style="width:100%;height:100%" aria-hidden="true"><defs>
<linearGradient id="mh-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(255 214 150)"/><stop offset="1" stop-color="rgb(255 160 70)"/></linearGradient>
<linearGradient id="mh-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(30 34 44)"/><stop offset="1" stop-color="rgb(70 60 56)"/></linearGradient>
<radialGradient id="mh-g" cx="50%" cy="60%" r="60%"><stop offset="0" stop-color="rgb(255 170 80 / .45)"/><stop offset="1" stop-color="transparent"/></radialGradient></defs>
<rect width="520" height="320" fill="url(#mh-s)"/><ellipse cx="300" cy="200" rx="260" ry="140" fill="url(#mh-g)"/>
<polygon points="60,250 470,250 520,320 0,320" fill="rgb(40 44 40)"/><polygon points="120,262 440,262 470,300 110,300" fill="rgb(60 110 120)"/>
<polygon points="110,120 300,98 300,250 110,250" fill="rgb(56 52 50)"/><polygon points="300,98 430,118 430,250 300,250" fill="rgb(44 40 38)"/>
<polygon points="90,118 312,92 452,116 236,140" fill="rgb(30 28 28)"/>
<polygon points="200,60 360,44 470,62 316,80" fill="rgb(28 26 26)"/><polygon points="230,70 340,58 340,100 230,106" fill="rgb(70 64 60)"/><polygon points="340,58 450,72 450,112 340,100" fill="rgb(54 50 48)"/>
{win(130,138,60,100)}{win(200,132,86,106)}{win(310,124,46,110)}{win(366,132,50,96)}{win(244,76,80,26)}{win(352,72,84,30)}
<rect x="120" y="248" width="320" height="4" fill="rgb(255 200 140)" opacity=".6"/>
{"".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="rgb(30 44 30)"/>' for x,y,r in [(40,230,30),(70,210,22),(480,220,28),(500,240,20)])}
{"".join(f'<circle cx="{x}" cy="290" r="2" fill="rgb(255 220 160)"/>' for x in range(130,440,40))}</svg>'''

def climber_scene():
    return '''<svg viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true"><defs>
<linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(70 84 120)"/><stop offset=".55" stop-color="rgb(210 140 100)"/><stop offset="1" stop-color="rgb(60 40 40)"/></linearGradient>
<radialGradient id="cs-sun" cx="78%" cy="58%" r="40%"><stop offset="0" stop-color="rgb(255 210 150 / .9)"/><stop offset="1" stop-color="transparent"/></radialGradient></defs>
<rect width="1000" height="560" fill="url(#cs-sky)"/><rect width="1000" height="560" fill="url(#cs-sun)"/>
<path d="M760 40 L770 40 L778 180 L800 330 L730 330 L752 180Z" fill="rgb(40 36 46)"/><path d="M745 210h40M738 260h54" stroke="rgb(40 36 46)" stroke-width="6"/>
<path d="M300 300 L1000 220 L1000 560 L300 560Z" fill="rgb(90 70 60)"/><path d="M300 300 L1000 220 L1000 250 L300 336Z" fill="rgb(150 120 96)"/>
<g fill="rgb(70 54 48)">''' + "".join(f'<rect x="{340+i*60}" y="{340-i*6}" width="34" height="80" rx="16"/>' for i in range(11)) + '''</g>
<g fill="rgb(22 18 20)" transform="translate(520 196) scale(1.15)"><path d="M40 20 C 30 12, 22 14, 18 24 C 14 34, 22 42, 32 40 Z"/>
<path d="M30 40 C 52 34, 76 46, 88 70 C 94 84, 88 96, 76 98 L 46 96 C 36 92, 26 76, 24 60 C 22 50, 24 44, 30 40Z"/>
<path d="M44 52 C 30 58, 14 72, 2 92 L 10 98 C 22 82, 36 70, 52 64Z"/><path d="M70 56 C 86 50, 104 54, 118 66 L 114 74 C 100 66, 86 64, 74 68Z"/>
<path d="M80 96 C 96 98, 110 104, 120 112 L 116 120 C 104 114, 90 110, 76 108Z"/><path d="M52 96 C 50 106, 52 116, 58 124 L 50 128 C 42 118, 40 106, 42 96Z"/>
<path d="M118 112 L132 118 L130 124 L114 120Z"/><path d="M50 126 L62 132 L58 136 L46 130Z"/></g></g></svg>'''

def earth():
    return '''<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true"><defs>
<radialGradient id="ea-g" cx="62%" cy="40%" r="60%"><stop offset="0" stop-color="rgb(120 180 255)"/><stop offset=".55" stop-color="rgb(30 80 180)"/><stop offset="1" stop-color="rgb(6 14 40)"/></radialGradient>
<radialGradient id="ea-a" cx="50%" cy="50%" r="50%"><stop offset=".86" stop-color="transparent"/><stop offset=".93" stop-color="rgb(120 200 255 / .7)"/><stop offset="1" stop-color="transparent"/></radialGradient></defs>
<rect width="400" height="260" fill="rgb(2 4 12)"/>''' + "".join(f'<circle cx="{(i*73)%400}" cy="{(i*41)%260}" r="{.6+(i%3)*.4}" fill="white" opacity=".7"/>' for i in range(60)) + '''
<circle cx="300" cy="230" r="190" fill="url(#ea-g)"/><g fill="rgb(70 140 80)" opacity=".85"><path d="M190 120 q40 -30 80 -10 q20 20 -10 40 q-30 10 -40 40 q-30 -10 -30 -70z"/><path d="M300 90 q40 0 60 30 q-10 30 -50 20 q-20 -20 -10 -50z"/><path d="M240 200 q30 -10 60 10 q-10 30 -40 30 q-30 -10 -20 -40z"/></g>
<g fill="white" opacity=".55"><ellipse cx="230" cy="100" rx="40" ry="6" transform="rotate(-12 230 100)"/><ellipse cx="330" cy="150" rx="50" ry="7" transform="rotate(-8 330 150)"/></g>
<circle cx="300" cy="230" r="200" fill="url(#ea-a)"/></svg>'''

def fantasy_hero():
    return '''<svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true"><defs>
<radialGradient id="fh-a" cx="65%" cy="40%" r="60%"><stop offset="0" stop-color="rgb(240 200 140)"/><stop offset=".5" stop-color="rgb(120 80 160)"/><stop offset="1" stop-color="rgb(20 18 40)"/></radialGradient>
<radialGradient id="fh-b" cx="85%" cy="70%" r="35%"><stop offset="0" stop-color="rgb(255 110 60 / .8)"/><stop offset="1" stop-color="transparent"/></radialGradient></defs>
<rect width="800" height="300" fill="url(#fh-a)"/><rect width="800" height="300" fill="url(#fh-b)"/>
<g fill="rgb(255 230 180)" opacity=".9"><path d="M520 300 L540 160 Q560 90 600 70 Q640 60 650 110 L660 300Z"/><circle cx="610" cy="56" r="26"/><path d="M590 40 Q610 -10 660 30 Q700 70 680 140 Q650 80 600 60Z" fill="rgb(255 220 120)"/></g>
<path d="M640 120 L760 20 L770 30 L660 140Z" fill="rgb(230 240 255)"/>
<g fill="rgb(60 40 70)" opacity=".85"><path d="M680 300 L700 190 Q720 150 760 160 L790 300Z"/><circle cx="740" cy="150" r="22"/></g>
<g fill="rgb(90 160 120)" opacity=".8"><path d="M420 300 L440 210 Q460 180 490 190 L500 300Z"/><circle cx="470" cy="180" r="18"/></g></svg>'''

def poster_person():
    return '''<svg viewBox="0 0 210 280" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">
<rect width="210" height="280" fill="rgb(120 96 240)"/><text x="12" y="40" font-family="Inter,sans-serif" font-weight="800" font-size="13" fill="white" letter-spacing="2">INTERACTIVE</text>
<path d="M60 280 L70 170 Q90 130 130 130 Q170 134 180 180 L190 280Z" fill="rgb(240 110 50)"/><path d="M96 200 L120 280 M140 160 L150 280" stroke="rgb(255 255 255 / .7)" stroke-width="3"/>
<path d="M150 160 L190 120 L198 128 L162 172Z" fill="rgb(240 110 50)"/><circle cx="192" cy="120" r="9" fill="rgb(230 180 150)"/>
<path d="M100 132 Q92 70 130 62 Q170 60 166 110 Q160 140 130 140Z" fill="rgb(40 26 22)"/><ellipse cx="132" cy="108" rx="18" ry="22" fill="rgb(232 186 150)"/>
<text x="12" y="150" font-family="Inter,sans-serif" font-weight="900" font-size="64" fill="white" letter-spacing="-3">NEW</text><text x="12" y="210" font-family="Inter,sans-serif" font-weight="900" font-size="64" fill="white" letter-spacing="-3">ERA</text>
<text x="12" y="262" font-family="Inter,sans-serif" font-size="9" fill="white" opacity=".8">12.11 · İzmir · Sergi</text></svg>'''

def macos_wall():
    return "radial-gradient(120% 90% at 0% 100%, rgb(255 120 60) 0 22%, transparent 23%), radial-gradient(130% 100% at 10% 110%, rgb(240 60 90) 0 34%, transparent 35%), radial-gradient(150% 120% at 20% 120%, rgb(170 60 200) 0 48%, transparent 49%), radial-gradient(170% 140% at 30% 130%, rgb(90 70 220) 0 60%, transparent 61%), linear-gradient(160deg, rgb(40 120 240), rgb(30 80 200))"

def food(kind, seed=1):
    r = random.Random(seed)
    if kind == "burger":
        ses = "".join(f'<ellipse cx="{r.uniform(26,74):.0f}" cy="{r.uniform(18,34):.0f}" rx="2" ry="1.2" fill="rgb(255 245 220)"/>' for _ in range(12))
        return f'''<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="92" rx="38" ry="5" fill="rgb(0 0 0 / .18)"/>
<path d="M14 72h72c0 10-8 16-20 16H34c-12 0-20-6-20-16z" fill="rgb(222 150 70)"/><path d="M12 62c10 6 66 6 76 0l2 6c-10 6-70 6-80 0z" fill="rgb(240 190 40)"/>
<rect x="14" y="54" width="72" height="12" rx="6" fill="rgb(110 60 40)"/><path d="M10 52c8-6 14 2 22-2s14 4 22 0 14 4 22 0 10 2 14 2l-2 6H12z" fill="rgb(110 190 70)"/>
<rect x="16" y="46" width="68" height="6" rx="3" fill="rgb(230 70 60)"/><path d="M14 46c0-22 16-34 36-34s36 12 36 34z" fill="rgb(232 160 70)"/><path d="M22 36c4-12 14-18 28-20" stroke="rgb(255 210 140)" stroke-width="3" fill="none" stroke-linecap="round"/>{ses}</svg>'''
    if kind == "salad":
        leaves = "".join(f'<ellipse cx="{50+r.uniform(-22,22):.0f}" cy="{50+r.uniform(-22,22):.0f}" rx="{r.uniform(7,12):.0f}" ry="{r.uniform(4,7):.0f}" transform="rotate({r.uniform(0,180):.0f} 50 50)" fill="rgb({r.randint(80,140)} {r.randint(160,210)} {r.randint(60,100)})"/>' for _ in range(22))
        tom = "".join(f'<circle cx="{50+r.uniform(-20,20):.0f}" cy="{50+r.uniform(-20,20):.0f}" r="5" fill="rgb(230 60 60)"/>' for _ in range(5))
        return f'''<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="52" r="46" fill="rgb(0 0 0 / .12)"/><circle cx="50" cy="50" r="46" fill="rgb(250 250 252)"/><circle cx="50" cy="50" r="36" fill="rgb(240 236 226)"/>{leaves}{tom}<circle cx="58" cy="44" r="7" fill="rgb(255 255 250)"/><circle cx="58" cy="44" r="3.5" fill="rgb(255 200 60)"/></svg>'''
    if kind == "caesar":
        leaves = "".join(f'<ellipse cx="{50+r.uniform(-22,22):.0f}" cy="{50+r.uniform(-22,22):.0f}" rx="{r.uniform(8,13):.0f}" ry="{r.uniform(4,7):.0f}" transform="rotate({r.uniform(0,180):.0f} 50 50)" fill="rgb({r.randint(140,190)} {r.randint(200,230)} {r.randint(90,130)})"/>' for _ in range(20))
        cr = "".join(f'<rect x="{50+r.uniform(-18,18):.0f}" y="{50+r.uniform(-18,18):.0f}" width="7" height="7" rx="1.5" fill="rgb(220 170 90)" transform="rotate({r.uniform(0,90):.0f})"/>' for _ in range(6))
        return f'''<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="52" r="46" fill="rgb(0 0 0 / .14)"/><circle cx="50" cy="50" r="46" fill="rgb(36 36 40)"/><circle cx="50" cy="50" r="36" fill="rgb(60 60 66)"/>{leaves}{cr}<path d="M34 40q16 10 34-4" stroke="rgb(255 250 230)" stroke-width="3" fill="none"/></svg>'''
    return ""
