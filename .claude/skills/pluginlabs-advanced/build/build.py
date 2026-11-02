"""PluginLabs Advanced — tek kaynaktan tüm çıktıları üretir.
Kullanım:  python3 build/build.py
Kaynak:    build/components.py (PLC temel) + build/advanced*.py (PLA advanced) + assets/pl-tokens.css
Çıktılar:  references/KOMPONENTLER.md · assets/pl-components.json · assets/pl-tokens.json · assets/pl-galeri.html
"""
import html, json, re, sys, pathlib, datetime
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from components import C as BASE
import advanced, advanced_2, advanced_3, advanced_4, advanced_screens
from advanced import A as ADV
for _x in BASE:
    _x.setdefault('yuzey', None); _x.setdefault('tema', None); _x.setdefault('kaynak', ''); _x['katman'] = 'temel'
for _x in ADV:
    _x['katman'] = 'advanced'
C = BASE + ADV

ROOT = pathlib.Path(__file__).resolve().parent.parent
A, R = ROOT / "assets", ROOT / "references"
VERSION, DATE = "2.0.0", "01.11.2026"
tokens_css = (A / "pl-tokens.css").read_text(encoding="utf-8")
comp_css = (A / "pl-components.css").read_text(encoding="utf-8")
adv_css = (A / "pl-advanced.css").read_text(encoding="utf-8")

BASE_CATS = ["Temel", "Form", "Gezinme", "Veri", "Geri Bildirim", "Katman", "Ürün Kalıpları"]
ADV_CATS = ["Kabuk & Pencere", "Medya & Eğlence", "Canlı Veri & Spor", "Akıllı Ev & IoT", "HUD & Endüstri", "Üretkenlik & İK", "CRM & İş", "Yaratıcı Araçlar", "Mobilite & Cihaz", "Sağlık, Yaşam & Ticaret", "Ekran Şablonları"]
CATS = BASE_CATS + ADV_CATS
SURFACES = [("varsayilan","Varsayılan","Gece atölyesi koyu zemin"),("glass","Cam","Buzlu cam katmanlar, renkli zemin üstünde"),("hud","HUD","Komuta merkezi: siyah-mavi, camgöbeği çizgi"),("neon","Neon","Canlı skor / oyun: yüksek kontrast limon"),("soft","Soft","Açık pastel SaaS paneli, büyük köşeler"),("cockpit","Kokpit","Araç / drone HMI: saf siyah, mavi yaylar")]
PRODUCTS = [("hub","PluginLabs Hub","#7c6cff","Masaüstü"),("leo","Leo Helper","#22d3ee","Eklenti"),
 ("mindpalace","Mind Palace","#a78bfa","Eklenti / Masaüstü"),("replicator","Design Replicator","#f472b6","Eklenti"),
 ("mutfak","Mutfak Atölyesi","#fb923c","Eklenti / Web"),("flowdock","Flow Dock","#2dd4bf","Masaüstü"),
 ("tweakster","Tweakster","#a3e635","Masaüstü"),("extman","Extension Manager","#60a5fa","Eklenti"),
 ("mymind","MyMind","#f0b429","AI servis"),("scrapper","The Ultimate Scrapper","#f87171","Eklenti"),
 ("wishlist","MyWishlist","#fb7185","Eklenti")]
PNAME = {p[0]: p[1] for p in PRODUCTS}

def clean(h):  # galeri dışı kullanım için önizleme-özel satır içi stilleri koru, sadece boşlukları düzelt
    return "\n".join(l.rstrip() for l in h.strip().splitlines())

# ---------------- 1) Tokenlar → DTCG JSON ----------------
def parse_block(sel_regex):
    out = {}
    for m in re.finditer(r"(?m)^" + sel_regex + r"\s*\{(.*?)\n\}", tokens_css, re.S):
        for k, v in re.findall(r"(--pl-[\w-]+):\s*([^;]+);", m.group(1)):
            out.setdefault(k, v.strip())
    return out
dark = parse_block(r":where\(\[data-pl\]\)")
light = parse_block(r':where\(\[data-pl\]\[data-pl-theme="light"\]\), :where\(\[data-pl-theme="light"\] \[data-pl\]\)')
def ttype(name, val):
    if val.startswith("#") or val.startswith("rgb") or "gradient" in val or "color-mix" in val: return "color"
    if "font-" in name and "family" not in name and val.endswith("px"): return "dimension"
    if name.startswith("--pl-font-"): return "fontFamily"
    if "dur" in name: return "duration"
    if "ease" in name: return "cubicBezier"
    if "shadow" in name or "glow" in name: return "shadow"
    if val.endswith("px") or val == "0": return "dimension"
    return "string"
dtcg = {"$schema": "https://design-tokens.github.io/community-group/format/",
        "meta": {"sistem": "PluginLabs Advanced", "surum": VERSION, "tarih": DATE, "onek": "--pl-", "kapsam": "[data-pl]"},
        "yuzey": {k: {"ad": a, "aciklama": d, "nitelik": (f'data-pl-surface="{k}"' if k != "varsayilan" else "")} for k, a, d in SURFACES},
        "tema": {"dark": {}, "light": {}},
        "urun_aksani": {p[0]: {"$type": "color", "$value": p[2], "ad": p[1], "platform": p[3]} for p in PRODUCTS}}
for k, v in dark.items():
    dtcg["tema"]["dark"][k[5:]] = {"$type": ttype(k, v), "$value": v, "css": k}
for k, v in light.items():
    dtcg["tema"]["light"][k[5:]] = {"$type": ttype(k, v), "$value": v, "css": k}
(A / "pl-tokens.json").write_text(json.dumps(dtcg, ensure_ascii=False, indent=2), encoding="utf-8")

# ---------------- 2) Komponent kataloğu → JSON (normalize) ----------------
catalog = {"meta": {"sistem": "PluginLabs Advanced", "surum": VERSION, "tarih": DATE, "adet": len(C), "temel": len(BASE), "advanced": len(ADV),
                    "kaynak": "build/components.py + build/advanced*.py"},
           "yuzeyler": [{"kod": k, "ad": a, "aciklama": d} for k, a, d in SURFACES],
           "kategoriler": [{"id": i+1, "ad": c, "katman": "temel" if c in BASE_CATS else "advanced", "adet": sum(1 for x in C if x["kategori"] == c)} for i, c in enumerate(CATS)],
           "urunler": [{"kod": p[0], "ad": p[1], "aksan": p[2], "platform": p[3]} for p in PRODUCTS],
           "komponentler": [{"id": x["id"], "slug": x["slug"], "ad": x["ad"], "kategori": x["kategori"],
                             "urun": x["urun"], "katman": x["katman"], "yuzey": x["yuzey"], "tema": x["tema"], "pinterest_kaynak": x["kaynak"] or None, "durum": x["durum"], "aciklama": x["aciklama"], "ne_zaman": x["ne_zaman"],
                             "durumlar": x["durumlar"], "siniflar": x["siniflar"], "erisilebilirlik": x["a11y"],
                             "html": clean(x["html"])} for x in C]}
(A / "pl-components.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")

# ---------------- 3) KOMPONENTLER.md ----------------
def attrs_of(x):
    a = []
    if x["tema"] or x["yuzey"]: a.append("data-pl")
    if x["tema"]: a.append(f'data-pl-theme="{x["tema"]}"')
    if x["yuzey"]: a.append(f'data-pl-surface="{x["yuzey"]}"')
    if x["urun"]: a.append(f'data-pl-product="{x["urun"]}"')
    return (" " + " ".join(a)) if a else ""

md = [f"# PluginLabs Advanced — Komponent Kataloğu\n",
      f"> **Sürüm:** {VERSION} · **Tarih:** {DATE} · **Adet:** {len(C)} komponent ({len(BASE)} temel PLC + {len(ADV)} advanced PLA) · **Kaynak:** `build/components.py` + `build/advanced*.py` (bu dosya otomatik üretilir — elle düzenlemeyin)\n",
      "> Tüm örnekler `[data-pl]` kapsayıcısı içinde çalışır ve sırasıyla `assets/pl-tokens.css` + `assets/pl-components.css` + `assets/pl-advanced.css` gerektirir. "
      "Ürün aksanı `data-pl-product`, yüzey teması `data-pl-surface`, açık/koyu `data-pl-theme` ile verilir. Canlı önizleme: `assets/pl-galeri.html`.\n",
      "## Kurulum (her ekran için)\n",
      "```html\n<link rel=\"stylesheet\" href=\"pl-tokens.css\">\n<link rel=\"stylesheet\" href=\"pl-components.css\">\n<link rel=\"stylesheet\" href=\"pl-advanced.css\">\n"
      "<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&display=swap\">\n\n"
      "<div data-pl data-pl-theme=\"dark\" data-pl-surface=\"hud\" data-pl-product=\"flowdock\" lang=\"tr\">\n  <!-- PluginLabs komponentleri burada -->\n</div>\n```\n",
      "## Yüzey temaları (`data-pl-surface`)\n", "| Kod | Ad | Karakter |\n|---|---|---|"]
for k, a, d in SURFACES: md.append(f"| `{k}` | {a} | {d} |")
md.append("\n## İçindekiler\n")
md.append("| ID | Komponent | Kategori | Yüzey / Ürün |\n|---|---|---|---|")
for x in C:
    tag = " · ".join(t for t in [x["yuzey"] and f"`{x['yuzey']}`", x["tema"] and f"`{x['tema']}`", PNAME.get(x["urun"])] if t) or "—"
    md.append(f"| {x['id']} | [{x['ad']}](#{x['id'].lower()}) | {x['kategori']} | {tag} |")
md.append("")
for part, cats in (("TEMEL KATMAN (PLC)", BASE_CATS), ("ADVANCED KATMAN (PLA)", ADV_CATS)):
    md.append(f"\n---\n\n# {part}\n")
    for cat in cats:
        items = [x for x in C if x["kategori"] == cat]
        md.append(f"\n---\n\n## {cat} ({len(items)})\n")
        for x in items:
            md.append(f"### {x['id']}\n")
            md.append(f"**{x['ad']}** · `{x['slug']}`" + (f" · Ürün: {PNAME[x['urun']]} (`data-pl-product=\"{x['urun']}\"`)" if x['urun'] else "") + "\n")
            md.append(f"- **Amaç:** {x['aciklama']}")
            md.append(f"- **Ne zaman:** {x['ne_zaman']}")
            if x["kaynak"]: md.append(f"- **Desen kaynağı:** {x['kaynak']}")
            if x["yuzey"] or x["tema"]: md.append(f"- **Kapsayıcı:** `<div{attrs_of(x)}>`")
            if x["durumlar"]: md.append(f"- **Durumlar:** {', '.join(x['durumlar'])}")
            md.append(f"- **Sınıflar:** `{x['siniflar']}`")
            if x["a11y"]: md.append(f"- **Erişilebilirlik:** {x['a11y']}")
            md.append("\n```html\n" + clean(x["html"]) + "\n```\n")
(R / "KOMPONENTLER.md").write_text("\n".join(md), encoding="utf-8")

# ---------------- 4) Galeri HTML ----------------
PCOL = dict((p[0], p[2]) for p in PRODUCTS)
def card(x):
    ptag = f'<span class="g-prod" style="--c:{PCOL[x["urun"]]}">{PNAME[x["urun"]]}</span>' if x["urun"] else ""
    stag = f'<span class="g-surf">{x["yuzey"]}</span>' if x["yuzey"] else ""
    if x["tema"] == "light" and not x["yuzey"]: stag = '<span class="g-surf">açık</span>'
    search = html.escape(f'{x["id"]} {x["ad"]} {x["slug"]} {x["kategori"]} {PNAME.get(x["urun"],"")} {x["yuzey"] or ""} {x["kaynak"]}'.lower())
    cls = "g-card" + (" g-span2" if x["span"] == 2 else "") + (" g-screen" if x["kategori"] == "Ekran Şablonları" else "")
    src = f'<p class="g-src">{I("pin")}<span>{html.escape(x["kaynak"])}</span></p>' if x["kaynak"] else ""
    return f"""<article class="{cls}" data-search="{search}" data-layer="{x['katman']}" id="{x['id'].lower()}">
  <header class="g-card__head"><span class="g-id">{x['id']}</span><h3>{html.escape(x['ad'])}</h3>{stag}{ptag}</header>
  <div class="g-preview{' g-preview--themed' if (x['yuzey'] or x['tema']) else ''}"{attrs_of(x)}>{x['html']}</div>
  <p class="g-desc">{html.escape(x['aciklama'])}</p>{src}
  <details class="g-code"><summary>Kod · <code>{html.escape(x['siniflar'].split()[0])}</code></summary><pre>{html.escape(clean(x['html']))}</pre>
  <button class="g-copy" type="button">Kopyala</button></details>
</article>"""

from icons import I
sections = []
for idx, cat in enumerate(CATS):
    items = [x for x in C if x["kategori"] == cat]
    layer = "PLC" if cat in BASE_CATS else "PLA"
    sections.append(f'<section class="g-section" id="kat-{idx+1}"><div class="g-sec-head"><span class="g-bar"></span><h2>{cat}</h2><span class="g-layer g-layer--{layer.lower()}">{layer}</span><span class="g-meta">{len(items)} KOMPONENT</span></div><div class="g-grid">' + "\n".join(card(x) for x in items) + "</div></section>")

sw = lambda names: "".join(f'<div class="g-sw"><span style="background:var({v})"></span><b>{v[5:]}</b><code>{dark.get(v,"")[:28]}</code></div>' for v in names)
swatches = sw(["--pl-bg-0","--pl-bg-1","--pl-bg-2","--pl-bg-3","--pl-bg-4","--pl-line","--pl-fg-1","--pl-fg-2","--pl-fg-3","--pl-brand","--pl-brand-2","--pl-gold","--pl-success","--pl-warning","--pl-danger","--pl-info"])
vizsw = sw([f"--pl-viz-{i}" for i in range(1,9)] + ["--pl-hud","--pl-hud-amber","--pl-hud-red","--pl-hud-green","--pl-neon","--pl-live","--pl-track-video","--pl-playhead"])
grads = "".join(f'<div class="g-grad"><span style="background:var({v})"></span><code>{v[5:]}</code></div>' for v in ["--pl-brand-gradient","--pl-grad-iris","--pl-grad-aurora","--pl-grad-sunset","--pl-grad-ocean","--pl-grad-ember","--pl-grad-lime","--pl-grad-gold","--pl-media-1","--pl-media-2","--pl-media-3","--pl-media-4","--pl-media-5","--pl-media-6"])
accents = "".join(f'<button class="g-acc" data-p="{p[0]}" style="--c:{p[2]}"><span></span><b>{p[1]}</b><code>{p[0]}</code></button>' for p in PRODUCTS)
surfaces = "".join(f'<button class="g-surfbtn" data-s="{k}"><span class="g-surfbtn__sw g-surfbtn__sw--{k}"></span><b>{a}</b><small>{d}</small></button>' for k, a, d in SURFACES)
typescale = "".join(f'<div class="g-type"><code>{n}</code><span style="font-size:var(--pl-text-{n});{"font-weight:700;color:var(--pl-fg-1)" if n in ("3xl","4xl","2xl","5xl","6xl") else ""}">Gece atölyesi 2026</span><code>{dark.get("--pl-text-"+n,"")}</code></div>' for n in ["6xl","5xl","4xl","3xl","2xl","xl","lg","md","sm","xs","2xs"])
fonts = '<div class="g-fonts"><div><span style="font-family:var(--pl-font-sans);font-size:28px;font-weight:700;color:var(--pl-fg-1)">Inter</span><code>--pl-font-sans · arayüz</code></div><div><span style="font-family:var(--pl-font-mono);font-size:22px;color:var(--pl-fg-1)">JetBrains Mono</span><code>--pl-font-mono · makine dili</code></div><div><span style="font-family:var(--pl-font-hud);font-size:30px;font-weight:700;color:var(--pl-hud);letter-spacing:.04em">RAJDHANI 102.67</span><code>--pl-font-hud · HUD rakamları</code></div></div>'
spaces = "".join(f'<div class="g-space"><span style="width:var(--pl-space-{n})"></span><code>{n} · {dark.get("--pl-space-"+n,"")}</code></div>' for n in ["1","2","3","4","5","6","7","8","10","12","16","20"])
radii = "".join(f'<div class="g-rad"><span style="border-radius:var(--pl-radius-{n})"></span><code>{n} · {dark.get("--pl-radius-"+n,"")}</code></div>' for n in ["xs","sm","md","lg","xl","2xl","3xl","full"])
nav = '<a href="#tokenlar">Tokenlar</a><a href="#desen">Desen haritası</a><a href="pl-pin-ekranlari.html" class="g-nav--adv">Pin ekranları ↗</a>' + "".join(f'<a href="#kat-{i+1}" class="{"g-nav--adv" if c in ADV_CATS else ""}">{c}</a>' for i, c in enumerate(CATS))

import build_pins
PIN_COUNT = len(build_pins.SCREENS)
PATTERNS = [
 ("Kabuk", "Yuvarlak köşeli yüzen pencere, 72px ikon rayı, hap gezinme, cam kenar çubuğu", "PLA-001…010"),
 ("Medya", "Sinematik kahraman, şeritli poster rafı, indirim kartı, 3B yığın karusel, ada oynatıcı", "PLA-011…020"),
 ("Canlı veri", "Neon skor kartı, oran çipleri, canlı bant, tek vurgu kartı", "PLA-021…024"),
 ("Akıllı ev", "İzometrik plan, sensör cam kartları, cihaz anahtarları, kat seçici, sıcak noktalar", "PLA-025…034"),
 ("HUD", "Kesik köşeli panel, ışıyan rakamlar, dalga monitörü, halka göstergeler, SCADA akışı", "PLA-035…042"),
 ("Üretkenlik", "Gün şeridi, ekip takvimi, ince büyük rakamlar, bölümlü haplar, zaman kadranı", "PLA-043…055"),
 ("CRM", "Süreç adımlayıcı, çentikli skor yayı, kişi kartı, mülk ve değerleme panelleri", "PLA-056…062"),
 ("Yaratıcı", "Çok izli zaman çizelgesi, düğüm grafiği, denetçi, katmanlar, sayfa şeridi", "PLA-063…070"),
 ("Mobilite", "Gösterge kümesi, vites, yön kartı, menzil, pusula, yön pedi, kamera HUD", "PLA-071…078"),
 ("Yaşam & ticaret", "Büyük değer kartı, taşan ikonlu karolar, küre, kategori çipleri, sipariş özeti", "PLA-079…090"),
 ("Ekranlar", "12 tam ekran: akıllı ev, mağaza, canlı skor, HUD, kurgu, HMI, İK, CRM, drone, klinik, planlayıcı, kat planı", "PLA-091…102"),
 ("Pin ekranları", f"Panodaki ekranların {PIN_COUNT} ayrıntılı HTML karşılığı — ayrı sayfa: pl-pin-ekranlari.html", "pl-screens.css"),
]
pattern_rows = "".join(f'<div class="g-pat"><b>{a}</b><span>{b}</span><code>{c}</code></div>' for a, b, c in PATTERNS)

GALLERY_CSS = (A.parent / "build" / "galeri.css").read_text(encoding="utf-8")
GALLERY_JS = (A.parent / "build" / "galeri.js").read_text(encoding="utf-8")
gallery = f"""<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PluginLabs Advanced</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet">
<style>
{tokens_css}
{comp_css}
{adv_css}
{GALLERY_CSS}
</style></head>
<body>
<div class="g-app" data-pl data-pl-theme="dark" data-pl-product="hub" id="root">
<header class="g-top"><div class="g-top__in">
  <div class="g-brand"><span class="pl-applogo pl-applogo--sm" style="background:var(--pl-brand-gradient);color:#fff">PL</span>PluginLabs <span class="g-brand__adv">Advanced</span></div>
  <div class="pl-inputwrap" style="width:min(300px,100%)">{I("search")}<input class="pl-input" id="q" type="search" placeholder="Ara (ör. zaman çizelgesi, PLA-063, hud)"><span class="pl-kbd">/</span></div>
  <div class="pl-segment" role="tablist" aria-label="Katman"><button class="is-active" data-layer="all">Tümü</button><button data-layer="temel">Temel</button><button data-layer="advanced">Advanced</button></div>
  <a class="pl-btn pl-btn--secondary pl-btn--sm" style="text-decoration:none" href="pl-pin-ekranlari.html">{I("external")}Pin ekranları</a>
  <div class="pl-segment" role="tablist" aria-label="Tema"><button class="is-active" data-theme="dark">Karanlık</button><button data-theme="light">Açık</button></div>
</div><nav class="g-nav">{nav}</nav></header>
<main class="g-main">
  <section class="g-hero">
    <div class="g-badges"><span class="pl-badge pl-badge--accent">v{VERSION}</span><span class="pl-badge">{DATE}</span><span class="pl-badge pl-badge--info">Claude Code + Codex ortak</span><span class="pl-badge pl-badge--pro">Desktop Application</span></div>
    <h1 class="g-title">PluginLabs <em>Advanced</em></h1>
    <p class="g-lead">Masaüstü uygulama dili: cam yüzeyler, komuta HUD'ları, medya vitrinleri, kurgu zaman çizelgeleri, kokpit göstergeleri ve tam ekran şablonları. Temel PluginLabs katmanının üzerine kapsüllü olarak oturur; yalnız <code class="pl-num">[data-pl]</code> içinde çalışır.</p>
    <div class="g-kpis">
      <div class="pl-kpi pl-kpi--highlight"><span class="pl-label">Komponent</span><span class="pl-kpi__value">{len(C)}</span><span class="pl-muted">{len(BASE)} temel · {len(ADV)} advanced</span></div>
      <div class="pl-kpi"><span class="pl-label">Ekran şablonu</span><span class="pl-kpi__value">{sum(1 for x in ADV if x['kategori']=='Ekran Şablonları')}</span><span class="pl-muted">tam kompozisyon</span></div>
      <a class="pl-kpi" href="pl-pin-ekranlari.html" style="text-decoration:none"><span class="pl-label">Pin ekranı</span><span class="pl-kpi__value">{PIN_COUNT}</span><span class="pl-muted">ayrı sayfada ↗</span></a>
      <div class="pl-kpi"><span class="pl-label">Yüzey teması</span><span class="pl-kpi__value">{len(SURFACES)}</span><span class="pl-muted">data-pl-surface</span></div>
      <div class="pl-kpi"><span class="pl-label">Ürün aksanı</span><span class="pl-kpi__value">{len(PRODUCTS)}</span><span class="pl-muted">data-pl-product</span></div>
      <div class="pl-kpi"><span class="pl-label">Token</span><span class="pl-kpi__value">{len(dark)}</span><span class="pl-muted">--pl- önekli</span></div>
    </div>
  </section>

  <section class="g-section" id="tokenlar"><div class="g-sec-head"><span class="g-bar"></span><h2>Tokenlar</h2><span class="g-meta">PL-TOKENS.CSS</span></div>
  <div class="g-tokens">
    <div class="g-panel" style="grid-column:1/-1"><h3>Ürün aksanları <span class="pl-muted" style="font-weight:400">— tıkla, tüm galeri o ürünün aksanına geçsin</span></h3><div class="g-accs">{accents}</div></div>
    <div class="g-panel" style="grid-column:1/-1"><h3>Yüzey temaları <span class="pl-muted" style="font-weight:400">— <code class="pl-num">data-pl-surface</code>; tıkla, temalı olmayan önizlemeler bu yüzeye geçsin</span></h3><div class="g-surfs">{surfaces}</div></div>
    <div class="g-panel"><h3>Renk</h3><div class="g-sws">{swatches}</div></div>
    <div class="g-panel"><h3>Veri görselleştirme · HUD · Kurgu</h3><div class="g-sws">{vizsw}</div></div>
    <div class="g-panel" style="grid-column:1/-1"><h3>Gradyan ve medya yer tutucuları</h3><div class="g-grads">{grads}</div></div>
    <div class="g-panel"><h3>Yazı aileleri</h3>{fonts}</div>
    <div class="g-panel"><h3>Tipografi ölçeği</h3>{typescale}</div>
    <div class="g-panel"><h3>Boşluk · 4px ızgara</h3>{spaces}</div>
    <div class="g-panel"><h3>Köşe yarıçapı</h3><div class="g-rads">{radii}</div></div>
  </div></section>

  <section class="g-section" id="desen"><div class="g-sec-head"><span class="g-bar"></span><h2>Desen haritası</h2><span class="g-meta">PINTEREST · DESKTOP APPLICATION</span></div>
  <div class="g-panel"><p class="pl-muted" style="margin:0 0 12px">Panodaki masaüstü ve uygulama ekranlarından çıkarılan yapı taşları ve karşılık gelen PLA aileleri. Her kartın altında ilgili pin numaraları yer alır.</p><div class="g-pats">{pattern_rows}</div></div></section>

  {"".join(sections)}

  <footer class="g-foot"><span class="pl-label">PluginLabs Advanced · v{VERSION}</span><span class="pl-label">{DATE} · build/*.py kaynağından üretildi</span></footer>
</main></div>
<script>
{GALLERY_JS}
</script>
</body></html>"""
(A / "pl-galeri.html").write_text(gallery, encoding="utf-8")
N_PINS = build_pins.build()

print(f"pin_ekrani={N_PINS} komponent={len(C)} temel={len(BASE)} advanced={len(ADV)} token_dark={len(dark)} token_light={len(light)}")
for c in CATS: print(f"  {c}: {sum(1 for x in C if x['kategori']==c)}")
