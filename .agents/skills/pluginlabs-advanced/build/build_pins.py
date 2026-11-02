"""Pin ekranları vitrini: assets/pl-screens.css + assets/pl-pin-ekranlari.html
Kullanım: python3 build/build_pins.py   (build.py de bunu çağırır)
"""
import html, pathlib, sys, importlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import pin_base
from icons import I
MODS = ["pin_screens_1", "pin_screens_2", "pin_screens_3", "pin_screens_4", "pin_screens_5", "pin_screens_6"]
for m in MODS:
    try: importlib.import_module(m)
    except ModuleNotFoundError: pass
import pin_upgrades
SCREENS = sorted(pin_base.S, key=lambda s: s["pin"])
ROOT = pathlib.Path(__file__).resolve().parent.parent
A = ROOT / "assets"
VERSION, DATE = "2.0.0", "01.11.2026"

def screens_css():
    parts = [pin_base.BASE_CSS]
    for s in SCREENS:
        if s["css"]: parts.append(f"/* ---------- Pin {s['pin']} · {s['ad']} ---------- */\n@layer pl {{\n{s['css'].strip()}\n}}")
    return "/* PluginLabs Advanced — Pin ekranı kompozisyonları (pl-screens.css) v2.0.0 */\n" + "\n".join(parts)

def attrs(s):
    a = ["data-pl"]
    a.append(f'data-pl-theme="{s["tema"] or "dark"}"')
    if s["yuzey"]: a.append(f'data-pl-surface="{s["yuzey"]}"')
    if s["urun"]: a.append(f'data-pl-product="{s["urun"]}"')
    return " ".join(a)

def stage(s):
    return f'<div class="pl-stage" style="background:{s["sahne"]}"><div class="pl-device" {attrs(s)}>{s["html"]}</div></div>'

def build():
    css = screens_css()
    (A / "pl-screens.css").write_text(css, encoding="utf-8")
    tokens = (A / "pl-tokens.css").read_text(encoding="utf-8")
    comp = (A / "pl-components.css").read_text(encoding="utf-8")
    adv = (A / "pl-advanced.css").read_text(encoding="utf-8")
    toc = "".join(f'<a href="#pin-{s["pin"]}"><span>P{s["pin"]:02d}</span>{html.escape(s["ad"])}</a>' for s in SCREENS)
    secs = "".join(f'''<section class="v-sec" id="pin-{s["pin"]}"><header class="v-head"><span class="v-pin">PIN {s["pin"]:02d}</span><div><h2>{html.escape(s["ad"])}</h2><p>{html.escape(s["aciklama"])}</p></div><span class="v-tags">{"".join(f"<code>{t}</code>" for t in [s["yuzey"], s["tema"], s["urun"]] if t)}</span></header>{stage(s)}<details class="v-code"><summary>HTML</summary><pre>{html.escape(s["html"])}</pre></details></section>''' for s in SCREENS)
    page = f'''<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PluginLabs Pin Ekranları</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet">
<style>
{tokens}
{comp}
{adv}
{css}
html,body{{margin:0;background:#07090f}}
.v-app{{min-height:100vh;color:var(--pl-fg-2)}}
.v-top{{position:sticky;top:0;z-index:50;background:rgb(7 9 15 / .86);backdrop-filter:blur(14px);border-bottom:1px solid var(--pl-line)}}
.v-top__in{{max-width:1360px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}}
.v-brand{{font-weight:800;color:var(--pl-fg-1);display:flex;gap:10px;align-items:center;margin-right:auto}}
.v-brand em{{font-style:normal;background:var(--pl-grad-aurora);-webkit-background-clip:text;background-clip:text;color:transparent}}
.v-toc{{max-width:1360px;margin:0 auto;padding:0 16px 10px;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}}
.v-toc a{{flex:none;display:flex;gap:6px;align-items:center;font-size:12px;color:var(--pl-fg-3);text-decoration:none;padding:5px 9px;border-radius:6px;white-space:nowrap}}
.v-toc a span{{font-family:var(--pl-font-mono);font-size:10px;color:var(--pl-accent)}}
.v-toc a:hover{{background:var(--pl-bg-3);color:var(--pl-fg-1)}}
.v-main{{max-width:1360px;margin:0 auto;padding:28px 16px 80px}}
.v-hero h1{{margin:0;font-size:clamp(30px,5vw,48px);color:var(--pl-fg-1);letter-spacing:-.03em;line-height:1.05}}
.v-hero p{{max-width:720px;color:var(--pl-fg-2)}}
.v-sec{{margin-top:56px;scroll-margin-top:110px}}
.v-head{{display:flex;gap:14px;align-items:flex-start;margin-bottom:14px;flex-wrap:wrap}}
.v-head h2{{margin:0;color:var(--pl-fg-1);font-size:20px}}
.v-head p{{margin:4px 0 0;color:var(--pl-fg-3);font-size:13px;max-width:820px}}
.v-pin{{font-family:var(--pl-font-mono);font-size:11px;letter-spacing:.1em;color:var(--pl-accent);border:1px solid var(--pl-accent-line);background:var(--pl-accent-soft);padding:4px 8px;border-radius:6px;flex:none;margin-top:2px}}
.v-tags{{margin-left:auto;display:flex;gap:6px}} .v-tags code{{font-family:var(--pl-font-mono);font-size:10px;color:var(--pl-fg-3);border:1px dashed var(--pl-line-strong);padding:2px 6px;border-radius:4px}}
.v-code{{margin-top:10px}} .v-code summary{{cursor:pointer;font-size:12px;color:var(--pl-fg-3)}}
.v-code pre{{max-height:300px;overflow:auto;background:var(--pl-bg-1);border:1px solid var(--pl-line);border-radius:10px;padding:12px;font-family:var(--pl-font-mono);font-size:11px;color:var(--pl-fg-2);white-space:pre-wrap}}
.v-foot{{margin-top:64px;border-top:1px solid var(--pl-line);padding-top:14px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}}
</style></head><body>
<div class="v-app" data-pl data-pl-theme="dark" data-pl-product="hub">
<header class="v-top"><div class="v-top__in"><div class="v-brand"><span class="pl-applogo pl-applogo--sm" style="background:var(--pl-brand-gradient);color:#fff">PL</span>PluginLabs <em>Pin Ekranları</em></div><a class="pl-btn pl-btn--secondary pl-btn--sm" style="text-decoration:none" href="pl-galeri.html">Tasarım sistemi galerisi</a></div><nav class="v-toc">{toc}</nav></header>
<main class="v-main"><section class="v-hero"><span class="pl-badge pl-badge--accent">v{VERSION} · {DATE}</span><h1>Desktop Application panosundan<br>PluginLabs ekranlarına</h1><p>Pinterest panosundaki her masaüstü/uygulama ekranının PluginLabs Advanced tokenları ve komponentleriyle yeniden kurulmuş HTML karşılığı. Görsel alanlarında yer tutucular kullanılır; yerleşim, hiyerarşi, ölçüler ve etkileşim öğeleri pinlere sadıktır. {len(SCREENS)} ekran.</p></section>
{secs}
<footer class="v-foot"><span class="pl-label">PluginLabs Advanced · Pin ekranları</span><span class="pl-label">build/pin_screens_*.py kaynağından üretildi</span></footer></main></div></body></html>'''
    (A / "pl-pin-ekranlari.html").write_text(page, encoding="utf-8")
    return len(SCREENS)

if __name__ == "__main__":
    print("pin ekranı:", build())
