"""Tek kaynaktan tüm çıktıları üretir.
Kullanım:  python3 build/build.py
Kaynak:    build/components.py (komponentler) + skill/.../assets/pl-tokens.css
Çıktılar:  references/KOMPONENTLER.md · assets/pl-components.json · assets/pl-tokens.json · assets/pl-galeri.html
"""
import html, json, re, sys, pathlib, datetime
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from components import C

ROOT = pathlib.Path(__file__).resolve().parent.parent
A, R = ROOT / "assets", ROOT / "references"
VERSION, DATE = "1.0.0", "30.10.2026"
tokens_css = (A / "pl-tokens.css").read_text(encoding="utf-8")
comp_css = (A / "pl-components.css").read_text(encoding="utf-8")

CATS = ["Temel", "Form", "Gezinme", "Veri", "Geri Bildirim", "Katman", "Ürün Kalıpları"]
PRODUCTS = [("hub","PluginLabs Hub","#7c6cff","Masaüstü"),("leo","Leo Helper","#22d3ee","Eklenti"),
 ("mindpalace","Mind Palace","#a78bfa","Eklenti / Masaüstü"),("replicator","Design Replicator","#f472b6","Eklenti"),
 ("mutfak","Mutfak Atölyesi","#fb923c","Eklenti / Web"),("flowdock","Flow Dock","#2dd4bf","Masaüstü"),
 ("tweakster","Tweakster","#a3e635","Masaüstü"),("extman","Extension Manager","#60a5fa","Eklenti"),
 ("mymind","MyMind","#f0b429","AI servis"),("scrapper","The Ultimate Scrapper","#f87171","Eklenti"),
 ("wishlist","MyWishlist","#fb7185","Eklenti"),
 ("gardrop","Gardrop","#e879f9","Masaüstü / Eklenti"),
 ("upscaler","The Ultimate Upscaler","#38bdf8","Masaüstü / Eklenti")]
PNAME = {p[0]: p[1] for p in PRODUCTS}

def clean(h):  # galeri dışı kullanım için önizleme-özel satır içi stilleri koru, sadece boşlukları düzelt
    return "\n".join(l.rstrip() for l in h.strip().splitlines())

# ---------------- 1) Tokenlar → DTCG JSON ----------------
def parse_block(sel_regex):
    m = re.search(sel_regex + r"\s*\{(.*?)\n\}", tokens_css, re.S)
    out = {}
    if m:
        for k, v in re.findall(r"(--pl-[\w-]+):\s*([^;]+);", m.group(1)):
            out[k] = v.strip()
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
        "meta": {"sistem": "PluginLabs Design System", "surum": VERSION, "tarih": DATE, "onek": "--pl-", "kapsam": "[data-pl]"},
        "tema": {"dark": {}, "light": {}},
        "urun_aksani": {p[0]: {"$type": "color", "$value": p[2], "ad": p[1], "platform": p[3]} for p in PRODUCTS}}
for k, v in dark.items():
    dtcg["tema"]["dark"][k[5:]] = {"$type": ttype(k, v), "$value": v, "css": k}
for k, v in light.items():
    dtcg["tema"]["light"][k[5:]] = {"$type": ttype(k, v), "$value": v, "css": k}
(A / "pl-tokens.json").write_text(json.dumps(dtcg, ensure_ascii=False, indent=2), encoding="utf-8")

# ---------------- 2) Komponent kataloğu → JSON (normalize) ----------------
catalog = {"meta": {"sistem": "PluginLabs Design System", "surum": VERSION, "tarih": DATE, "adet": len(C),
                    "kaynak": "build/components.py"},
           "kategoriler": [{"id": i+1, "ad": c, "adet": sum(1 for x in C if x["kategori"] == c)} for i, c in enumerate(CATS)],
           "urunler": [{"kod": p[0], "ad": p[1], "aksan": p[2], "platform": p[3]} for p in PRODUCTS],
           "komponentler": [{"id": x["id"], "slug": x["slug"], "ad": x["ad"], "kategori": x["kategori"],
                             "urun": x["urun"], "durum": x["durum"], "aciklama": x["aciklama"], "ne_zaman": x["ne_zaman"],
                             "durumlar": x["durumlar"], "siniflar": x["siniflar"], "erisilebilirlik": x["a11y"],
                             "html": clean(x["html"])} for x in C]}
(A / "pl-components.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")

# ---------------- 3) KOMPONENTLER.md ----------------
md = [f"# PluginLabs Komponent Kataloğu\n",
      f"> **Sürüm:** {VERSION} · **Tarih:** {DATE} · **Adet:** {len(C)} komponent · **Kaynak:** `build/components.py` (bu dosya otomatik üretilir — elle düzenlemeyin)\n",
      "> Tüm örnekler `[data-pl]` kapsayıcısı içinde çalışır ve `assets/pl-tokens.css` + `assets/pl-components.css` gerektirir. "
      "Ürün aksanı için kapsayıcıya `data-pl-product=\"<kod>\"` ekleyin. Canlı önizleme: `assets/pl-galeri.html`.\n",
      "## Kurulum (her ekran için)\n",
      "```html\n<link rel=\"stylesheet\" href=\"pl-tokens.css\">\n<link rel=\"stylesheet\" href=\"pl-components.css\">\n\n"
      "<div data-pl data-pl-theme=\"dark\" data-pl-product=\"leo\" lang=\"tr\">\n  <!-- PluginLabs komponentleri burada -->\n</div>\n```\n",
      "## İçindekiler\n"]
md.append("| ID | Komponent | Kategori | Ürün |\n|---|---|---|---|")
for x in C:
    md.append(f"| {x['id']} | [{x['ad']}](#{x['id'].lower()}) | {x['kategori']} | {PNAME.get(x['urun'], '—')} |")
md.append("")
for cat in CATS:
    items = [x for x in C if x["kategori"] == cat]
    md.append(f"\n---\n\n## {cat} ({len(items)})\n")
    for x in items:
        md.append(f"### {x['id']}\n")
        md.append(f"**{x['ad']}** · `{x['slug']}`" + (f" · Ürün: {PNAME[x['urun']]} (`data-pl-product=\"{x['urun']}\"`)" if x['urun'] else "") + "\n")
        md.append(f"- **Amaç:** {x['aciklama']}")
        md.append(f"- **Ne zaman:** {x['ne_zaman']}")
        if x["durumlar"]: md.append(f"- **Durumlar:** {', '.join(x['durumlar'])}")
        md.append(f"- **Sınıflar:** `{x['siniflar']}`")
        if x["a11y"]: md.append(f"- **Erişilebilirlik:** {x['a11y']}")
        md.append("\n```html\n" + clean(x["html"]) + "\n```\n")
(R / "KOMPONENTLER.md").write_text("\n".join(md), encoding="utf-8")

# ---------------- 4) Galeri HTML ----------------
def card(x):
    prod = f' data-pl-product="{x["urun"]}"' if x["urun"] else ""
    ptag = f'<span class="g-prod" style="--c:{dict((p[0],p[2]) for p in PRODUCTS)[x["urun"]]}">{PNAME[x["urun"]]}</span>' if x["urun"] else ""
    search = html.escape(f'{x["id"]} {x["ad"]} {x["slug"]} {x["kategori"]} {PNAME.get(x["urun"],"")}'.lower())
    return f'''<article class="g-card{' g-span2' if x['span']==2 else ''}" data-search="{search}" id="{x['id'].lower()}">
  <header class="g-card__head"><span class="g-id">{x['id']}</span><h3>{html.escape(x['ad'])}</h3>{ptag}</header>
  <div class="g-preview"{prod}>{x['html']}</div>
  <p class="g-desc">{html.escape(x['aciklama'])}</p>
  <details class="g-code"><summary>Kod · <code>{html.escape(x['siniflar'].split()[0])}</code></summary><pre>{html.escape(clean(x['html']))}</pre>
  <button class="g-copy" type="button">Kopyala</button></details>
</article>'''

sections = []
for cat in CATS:
    items = [x for x in C if x["kategori"] == cat]
    sections.append(f'<section class="g-section" id="kat-{CATS.index(cat)+1}"><div class="g-sec-head"><span class="g-bar"></span><h2>{cat}</h2><span class="g-meta">{len(items)} KOMPONENT</span></div><div class="g-grid">' + "\n".join(card(x) for x in items) + "</div></section>")

swatches = "".join(f'<div class="g-sw"><span style="background:var({v})"></span><b>{v[5:]}</b><code>{dark.get(v,"")}</code></div>' for v in
    ["--pl-bg-0","--pl-bg-1","--pl-bg-2","--pl-bg-3","--pl-bg-4","--pl-line","--pl-fg-1","--pl-fg-2","--pl-fg-3","--pl-brand","--pl-brand-2","--pl-gold","--pl-success","--pl-warning","--pl-danger","--pl-info"])
accents = "".join(f'<button class="g-acc" data-p="{p[0]}" style="--c:{p[2]}"><span></span><b>{p[1]}</b><code>{p[0]}</code></button>' for p in PRODUCTS)
typescale = "".join(f'<div class="g-type"><code>{n}</code><span style="font-size:var(--pl-text-{n});{"font-weight:700;color:var(--pl-fg-1)" if n in ("3xl","4xl","2xl") else ""}">PluginLabs atölyesi</span><code>{dark.get("--pl-text-"+n,"")}</code></div>' for n in ["4xl","3xl","2xl","xl","lg","md","sm","xs","2xs"])
spaces = "".join(f'<div class="g-space"><span style="width:var(--pl-space-{n})"></span><code>{n} · {dark.get("--pl-space-"+n,"")}</code></div>' for n in ["1","2","3","4","5","6","8","10","12","16"])
radii = "".join(f'<div class="g-rad"><span style="border-radius:var(--pl-radius-{n})"></span><code>{n} · {dark.get("--pl-radius-"+n,"")}</code></div>' for n in ["xs","sm","md","lg","xl","full"])
nav = "".join(f'<a href="#kat-{i+1}">{c}</a>' for i, c in enumerate(CATS))

gallery = f'''<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PluginLabs Tasarım Sistemi</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
{tokens_css}
{comp_css}
/* ---------- Galeri kabuğu (yalnız bu sayfa) ---------- */
html,body{{margin:0;background:#090d18}}
html:has([data-pl-theme="light"]) body{{background:#f4f6fb}}
.g-app{{background:var(--pl-bg-0);min-height:100vh}}
.g-top{{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--pl-bg-0) 85%,transparent);backdrop-filter:blur(14px);border-bottom:1px solid var(--pl-line)}}
.g-top__in{{max-width:1320px;margin:0 auto;padding:12px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}}
.g-brand{{display:flex;align-items:center;gap:10px;font-weight:700;color:var(--pl-fg-1);margin-right:auto}}
.g-nav{{max-width:1320px;margin:0 auto;padding:0 16px 10px;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}}
.g-nav a{{color:var(--pl-fg-3);text-decoration:none;font-size:13px;padding:6px 10px;border-radius:6px;white-space:nowrap}}
.g-nav a:hover{{background:var(--pl-bg-3);color:var(--pl-fg-1)}}
.g-main{{max-width:1320px;margin:0 auto;padding:24px 16px 80px}}
.g-hero{{display:grid;gap:20px;margin-bottom:40px}}
.g-badges{{display:flex;gap:8px;flex-wrap:wrap}}
.g-title{{font-size:clamp(30px,5vw,48px);line-height:1.05;font-weight:800;color:var(--pl-fg-1);margin:0;letter-spacing:-.025em}}
.g-title em{{font-style:normal;background:var(--pl-brand-gradient);-webkit-background-clip:text;background-clip:text;color:transparent}}
.g-lead{{max-width:680px;margin:0;color:var(--pl-fg-2);font-size:15px}}
.g-kpis{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}}
.g-section{{margin-top:48px;scroll-margin-top:110px}}
.g-sec-head{{display:flex;align-items:center;gap:10px;margin-bottom:16px}}
.g-bar{{width:4px;height:22px;border-radius:2px;background:var(--pl-accent)}}
.g-sec-head h2{{margin:0;font-size:22px;color:var(--pl-fg-1)}}
.g-meta{{margin-left:auto;font-family:var(--pl-font-mono);font-size:11px;letter-spacing:.08em;color:var(--pl-fg-3)}}
.g-grid{{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(min(340px,100%),1fr));align-items:start}}
.g-span2{{grid-column:span 2}}
@media (max-width:760px){{.g-span2{{grid-column:auto}}}}
.g-card{{background:var(--pl-bg-1);border:1px solid var(--pl-line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;min-width:0}}
.g-card__head{{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--pl-line)}}
.g-card__head h3{{margin:0;font-size:14px;color:var(--pl-fg-1);font-weight:600;flex:1;min-width:0}}
.g-id{{font-family:var(--pl-font-mono);font-size:10.5px;letter-spacing:.06em;color:var(--pl-fg-3);border:1px solid var(--pl-line-strong);border-radius:4px;padding:2px 6px}}
.g-prod{{font-size:11px;font-weight:600;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);padding:2px 8px;border-radius:999px;white-space:nowrap}}
.g-preview{{padding:20px;background:var(--pl-bg-0);background-image:radial-gradient(var(--pl-line) 1px,transparent 1px);background-size:16px 16px;min-height:96px;overflow-x:auto}}
.g-desc{{margin:0;padding:12px 14px 0;font-size:13px;color:var(--pl-fg-3)}}
.g-code{{padding:10px 14px 14px;position:relative}}
.g-code summary{{cursor:pointer;font-size:12px;color:var(--pl-fg-3);list-style:none}}
.g-code summary::-webkit-details-marker{{display:none}}
.g-code summary code{{font-family:var(--pl-font-mono);color:var(--pl-accent)}}
.g-code pre{{margin:10px 0 0;padding:12px;background:var(--pl-bg-0);border:1px solid var(--pl-line);border-radius:10px;font-family:var(--pl-font-mono);font-size:11.5px;line-height:1.6;color:var(--pl-fg-2);overflow:auto;max-height:320px;white-space:pre}}
.g-copy{{position:absolute;right:22px;top:46px;font:inherit;font-size:11px;padding:4px 8px;border-radius:6px;border:1px solid var(--pl-line-strong);background:var(--pl-bg-2);color:var(--pl-fg-2);cursor:pointer;display:none}}
.g-code[open] .g-copy{{display:block}}
.g-tokens{{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))}}
.g-panel{{background:var(--pl-bg-1);border:1px solid var(--pl-line);border-radius:16px;padding:16px}}
.g-panel h3{{margin:0 0 12px;font-size:14px;color:var(--pl-fg-1)}}
.g-sws{{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}}
.g-sw{{display:flex;flex-direction:column;gap:4px;font-size:11px}}
.g-sw span{{height:40px;border-radius:8px;box-shadow:inset 0 0 0 1px rgb(255 255 255 / .08)}}
.g-sw b{{color:var(--pl-fg-1);font-weight:500}} .g-sw code,.g-type code,.g-space code,.g-rad code,.g-acc code{{font-family:var(--pl-font-mono);color:var(--pl-fg-3);font-size:10.5px}}
.g-accs{{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}}
.g-acc{{display:flex;align-items:center;gap:8px;padding:8px;border-radius:10px;border:1px solid var(--pl-line);background:var(--pl-bg-2);cursor:pointer;text-align:left;font:inherit;color:var(--pl-fg-2)}}
.g-acc span{{width:22px;height:22px;border-radius:6px;background:var(--c);flex:none}}
.g-acc b{{font-size:12px;font-weight:500;color:var(--pl-fg-1);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
.g-acc.is-on{{border-color:var(--c);box-shadow:0 0 0 2px color-mix(in srgb,var(--c) 30%,transparent)}}
.g-type{{display:grid;grid-template-columns:40px 1fr auto;align-items:baseline;gap:12px;padding:6px 0;border-bottom:1px solid var(--pl-line);overflow:hidden}}
.g-type span{{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--pl-fg-2)}}
.g-space,.g-rad{{display:flex;align-items:center;gap:10px;padding:4px 0}}
.g-space span{{height:10px;background:var(--pl-accent);border-radius:2px}}
.g-rads{{display:flex;flex-wrap:wrap;gap:12px}} .g-rad{{flex-direction:column;align-items:flex-start}}
.g-rad span{{width:56px;height:40px;background:var(--pl-accent-soft);border:1.5px solid var(--pl-accent)}}
.g-hidden{{display:none!important}}
.g-foot{{border-top:1px solid var(--pl-line);margin-top:64px;padding-top:16px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}}
</style></head>
<body>
<div class="g-app" data-pl data-pl-theme="dark" data-pl-product="hub" id="root">
<header class="g-top"><div class="g-top__in">
  <div class="g-brand"><span class="pl-applogo pl-applogo--sm" style="background:var(--pl-brand-gradient);color:#fff">PL</span>PluginLabs <span class="pl-muted" style="font-weight:500">Tasarım Sistemi</span></div>
  <div class="pl-inputwrap" style="width:min(280px,100%)"><svg class="pl-ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input class="pl-input" id="q" type="search" placeholder="Komponent ara (ör. buton, PLC-033)"><span class="pl-kbd">/</span></div>
  <div class="pl-segment" role="tablist" aria-label="Tema"><button class="is-active" data-theme="dark">Karanlık</button><button data-theme="light">Açık</button></div>
</div><nav class="g-nav"><a href="#tokenlar">Tokenlar</a>{nav}</nav></header>
<main class="g-main">
  <section class="g-hero">
    <div class="g-badges"><span class="pl-badge pl-badge--accent">v{VERSION}</span><span class="pl-badge">{DATE}</span><span class="pl-badge pl-badge--info">Claude Code + Codex ortak</span></div>
    <h1 class="g-title">PluginLabs <em>Tasarım Sistemi</em></h1>
    <p class="g-lead">Hub, masaüstü uygulamaları ve tarayıcı eklentileri için tek tasarım dili. Kapsüllü katman: mevcut uygulamalara dokunmaz, yalnız <code class="pl-num">[data-pl]</code> içinde çalışır. Ürün aksanını aşağıdan değiştirip tüm komponentleri canlı görün.</p>
    <div class="g-kpis">
      <div class="pl-kpi pl-kpi--highlight"><span class="pl-label">Komponent</span><span class="pl-kpi__value">{len(C)}</span><span class="pl-muted">{len(CATS)} kategori</span></div>
      <div class="pl-kpi"><span class="pl-label">Ürün aksanı</span><span class="pl-kpi__value">{len(PRODUCTS)}</span><span class="pl-muted">data-pl-product</span></div>
      <div class="pl-kpi"><span class="pl-label">Tema</span><span class="pl-kpi__value">2</span><span class="pl-muted">karanlık · açık</span></div>
      <div class="pl-kpi"><span class="pl-label">Token</span><span class="pl-kpi__value">{len(dark)}</span><span class="pl-muted">--pl- önekli</span></div>
    </div>
  </section>

  <section class="g-section" id="tokenlar"><div class="g-sec-head"><span class="g-bar"></span><h2>Tokenlar</h2><span class="g-meta">PL-TOKENS.CSS</span></div>
  <div class="g-tokens">
    <div class="g-panel" style="grid-column:1/-1"><h3>Ürün aksanları <span class="pl-muted" style="font-weight:400">— tıkla, tüm galeri o ürünün aksanına geçsin</span></h3><div class="g-accs">{accents}</div></div>
    <div class="g-panel"><h3>Renk</h3><div class="g-sws">{swatches}</div></div>
    <div class="g-panel"><h3>Tipografi · Inter + JetBrains Mono</h3>{typescale}</div>
    <div class="g-panel"><h3>Boşluk · 4px ızgara</h3>{spaces}</div>
    <div class="g-panel"><h3>Köşe yarıçapı</h3><div class="g-rads">{radii}</div></div>
  </div></section>

  {"".join(sections)}

  <footer class="g-foot"><span class="pl-label">PluginLabs Design System · v{VERSION}</span><span class="pl-label">{DATE} · build/components.py'den üretildi</span></footer>
</main></div>
<script>
(function(){{
  var root=document.getElementById('root');
  document.querySelectorAll('[data-theme]').forEach(function(b){{b.addEventListener('click',function(){{
    root.setAttribute('data-pl-theme',b.dataset.theme);
    document.querySelectorAll('[data-theme]').forEach(function(x){{x.classList.toggle('is-active',x===b)}});
  }})}});
  document.querySelectorAll('.g-acc').forEach(function(b){{b.addEventListener('click',function(){{
    root.setAttribute('data-pl-product',b.dataset.p);
    document.querySelectorAll('.g-acc').forEach(function(x){{x.classList.toggle('is-on',x===b)}});
  }})}});
  var first=document.querySelector('.g-acc[data-p="hub"]'); if(first) first.classList.add('is-on');
  var q=document.getElementById('q');
  q.addEventListener('input',function(){{
    var v=q.value.trim().toLocaleLowerCase('tr');
    document.querySelectorAll('.g-card').forEach(function(c){{c.classList.toggle('g-hidden',v&&c.dataset.search.indexOf(v)<0)}});
    document.querySelectorAll('.g-section').forEach(function(s){{if(s.id==='tokenlar')return;s.classList.toggle('g-hidden',!s.querySelector('.g-card:not(.g-hidden)'))}});
  }});
  document.addEventListener('keydown',function(e){{if(e.key==='/'&&document.activeElement!==q){{e.preventDefault();q.focus()}}}});
  document.querySelectorAll('.js-indet').forEach(function(i){{i.indeterminate=true}});
  document.querySelectorAll('.g-copy').forEach(function(b){{b.addEventListener('click',function(){{
    var t=b.parentNode.querySelector('pre').textContent;
    try{{navigator.clipboard.writeText(t).then(function(){{b.textContent='Kopyalandı';setTimeout(function(){{b.textContent='Kopyala'}},1400)}})}}catch(e){{}}
  }})}});
}})();
</script>
</body></html>'''
(A / "pl-galeri.html").write_text(gallery, encoding="utf-8")

print(f"komponent={len(C)} token_dark={len(dark)} token_light={len(light)}")
for c in CATS: print(f"  {c}: {sum(1 for x in C if x['kategori']==c)}")
