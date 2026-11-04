"""Import the user supplied desktop reference as an offline, scoped UI preview.
Usage: python scripts/adapt-reference.py path/to/reference.html
Requires tinycss2. Never runs scripts from the reference during conversion.
"""
import re, sys, pathlib, shutil, math
import tinycss2
root = pathlib.Path(__file__).resolve().parents[1]
ui = root / 'ui'
source = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
original_css = re.search(r'<style>(.*?)</style>',source,re.S).group(1)
original_js = re.search(r'<script>(.*?)</script>',source,re.S).group(1)
tokens = (ui/'pl/pl-tokens.css').read_text(encoding='utf-8')
palette=[]
for name,h in re.findall(r'(--pl-[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;',tokens):
    if any(x in name for x in ['bg-','fg-','viz-','on-media','line','success','warning','danger','brand','gold']):
        palette.append((name,tuple(int(h[i:i+2],16) for i in (1,3,5))))
def nearest(rgb):
    return min(palette,key=lambda n:sum((a-b)**2 for a,b in zip(rgb,n[1])))[0]
def colors(text):
    def hx(m):
        h=m.group(0)[1:]
        if len(h)==3:h=''.join(c*2 for c in h)
        return 'var('+nearest(tuple(int(h[i:i+2],16) for i in (0,2,4)))+')'
    text=re.sub(r'#[\da-fA-F]{6}\b|#[\da-fA-F]{3}\b',hx,text)
    def rgba(m):
        nums=re.findall(r'[\d.]+',m.group(1))
        if len(nums)<3:return m.group(0)
        token=nearest(tuple(float(n) for n in nums[:3]))
        if len(nums)>3:return 'color-mix(in srgb, var('+token+') '+str(round(float(nums[3])*100,2))+'%, transparent)'
        return 'var('+token+')'
    text=re.sub(r'rgba?\(([^)]+)\)',rgba,text)
    return re.sub(r'(?<![\w-])--(?!pl-)([a-zA-Z][\w-]*)',r'--pl-\1',text)
def scoped(css):
    out=[]
    for rule in tinycss2.parse_stylesheet(css,skip_comments=True,skip_whitespace=True):
        if rule.type=='qualified-rule':
            selector=tinycss2.serialize(rule.prelude).strip()
            if ':root' in selector or selector.startswith('body') or selector.startswith('html'):continue
            selectors=[]
            for s in selector.split(','):
                s=s.strip()
                if s=='*':s='[data-pl] *'
                elif not s.startswith('[data-pl]'):s='[data-pl] '+s
                selectors.append(s)
            content=colors(tinycss2.serialize(rule.content)).replace('outline: none','outline: 2px solid transparent')
            out.append(','.join(selectors)+'{'+content+'}')
        elif rule.type=='at-rule' and rule.content:
            name=rule.lower_at_keyword
            if name=='media':out.append('@media '+tinycss2.serialize(rule.prelude)+'{'+scoped(tinycss2.serialize(rule.content))+'}')
    return '\n'.join(out)
css='@font-face{font-family:Inter;src:url(fonts/inter-latin-ext-wght-normal.woff2);font-weight:100 900;font-display:swap}\n@layer pl {\n'+scoped(original_css)+'\n}\n'
(ui/'omni-reference.css').write_text(css,encoding='utf-8')
# Retain local UI demonstration interactions, remove fabricated provider/render results.
js=original_js
js=re.sub(r'/\* --- MyMind Asistanı --- \*/.*?/\* ---', '''/* MyMind preview: no provider request, no fabricated output. */
  $$('[data-ai]').forEach(b=>b.addEventListener('click',()=>toast('MyMind · Tasarım önizlemesi','Bu özellik henüz bağlı değil; veri gönderilmedi.')));
  /* ---''',js,flags=re.S)
js=re.sub(r'/\* --- SEKME 6: Rust WGPU Render Simülasyonu --- \*/.*?/\* --- Ses Kaydırıcısı', '''/* Deliver preview does not create a fake render job. */
  $('#start-rust-render-btn')?.addEventListener('click',()=>toast('Teslim arayüzü · Önizleme','Bu ekranda render çalıştırılmaz.'));
  /* --- Ses Kaydırıcısı''',js,flags=re.S)
js=js.replace('onclick="switchWorkspace(\'fusion\')"','data-preview-workspace="fusion"')
js=js.replace("'Metin üretimine giriş'","'ARCHIVE_01 · Establishing'").replace("'Ses üretimine giriş'","'VO_03 · Anlatım kaydı'").replace("'Video üretimine giriş'","'CAM_A · Ana plan'").replace("'Avatar üretimine giriş'","'CHAR_01 · Karakter rig'").replace("'Görsel üretimi atölyesi'","'COMP_04 · Katman birleşimi'")
js=js.replace('Metin: Eğitim oturumumuza hoş geldiniz! Başlayalım…','Başlık · DERİNLİK / Ana kompozisyon').replace('Metin: Bölüm 2 — Ses üretimi','Alt başlık · BÖLÜM 02').replace('Efekt: Gölge_koleksiyonu_01 (DeepGlow)','Efekt · Volumetrik ışık / Glow')
js=js.replace('Görsel üretildi','Örnek kart eklendi')
js=re.sub(r'(?<![\w-])--(?!pl-)([a-zA-Z][\w-]*)',r'--pl-\1',js)
(ui/'omni-reference.js').write_text(js,encoding='utf-8')
html=re.sub(r'<link[^>]+(?:googleapis|gstatic)[^>]*>','',source)
html=re.sub(r'<style>.*?</style>','<link rel="stylesheet" href="pl/pl-tokens.css"><link rel="stylesheet" href="pl/pl-components.css"><link rel="stylesheet" href="pl/pl-advanced.css"><link rel="stylesheet" href="omni-reference.css"><link rel="stylesheet" href="omni.css">',html,flags=re.S)
html=re.sub(r'<script>.*?</script>','<script src="omni-reference.js"></script><script src="omni.js"></script>',html,flags=re.S)
html=re.sub(r'onclick="switchWorkspace\(\'([^\']+)\'\)"',r'data-preview-workspace="\1"',html)
html=re.sub(r'\son\w+="[^"]*"','',html)
html=html.replace('data-pl data-pl-theme="dark"','data-pl data-pl-theme="dark" data-pl-product="hub"')
html=html.replace('<title>OMNI STUDIO PRO · PLA-095 — PluginLabs (Premiere × Fusion AI × AE × Resolve × Fairlight)</title>','<title>Kurgu Atölyesi · OMNI Studio / PluginLabs Advanced</title>')
html=html.replace('<div class="pl-kurgu-app" id="app">','''<div class="pl-kurgu-app"><header class="pl-omni-brandbar"><div class="pl-omni-brand"><span class="pl-omni-mark">pl</span><strong>PluginLabs</strong><span class="pl-chip">APPS</span></div><div class="pl-omni-product"><span class="pl-omni-productmark">KA</span><div><strong>Kurgu Atölyesi</strong><small>OMNI Studio · Yaratıcı üretim ortamı</small></div><span class="pl-omni-index">058</span></div><div class="pl-omni-project"><strong>DERİNLİK — Ana kompozisyon</strong><span>3840 × 2160 · 24 FPS · Tasarım örneği</span></div><button class="pl-btn pl-btn--secondary pl-btn--sm" id="preview-command">Komut çalıştır <kbd>Ctrl K</kbd></button><span class="pl-omni-previewlabel">ARAYÜZ ÖNİZLEMESİ</span></header>''')
html=html.replace('Cihazda yerel işleme aktif','Örnek proje · İşleme kapalı').replace('Merhaba Mert!','Yaratıcı asistan').replace('Nasıl yardımcı olabilirim?','MyMind · Bağlantı bekliyor')
html=html.replace('ACEScct 32-Bit · 3840×2160','3840×2160 · Örnek kompozisyon').replace('Eğitim oturumumuza hoş geldiniz!','DERİNLİK — Işığın izinde')
html=html.replace('Rust WGPU Render Başlat','Render ayarlarını incele').replace('Hazır · %100','TASARIM ÖRNEĞİ').replace('Tamamlandı · 00:01:40','Henüz iş oluşturulmadı')
html=html.replace('142 FPS','— FPS').replace('2.18 ms / Kare','Ölçüm bağlı değil').replace('6.8 / 24 GB','— / — GB').replace('Zero-Copy DMA','Telemetri planlandı').replace('FP16 Aktif','Bağlı değil').replace('16 Çekirdek','— iş parçacığı')
html=re.sub(r'\[RUST-CORE\].*?</pre>','[ÖNİZLEME] Bu alanlar arayüz taslağıdır; donanım ölçümü veya render işi çalışmıyor.\n[RUST] Tauri masaüstü kabuğu.\n[PLAN] GPU/ONNX, ACES, profesyonel kodekler ve ses ölçümleri sonraki uygulama aşamasında.</pre>',html,flags=re.S)
for a,b in [('60 FPS','Örnek rig'),('Joints: 18/18 Locked','İskelet: örnek veri'),('ONNX CUDA','ONNX · PLAN'),('(99.4%)','(örnek)'),('Rust CPAL Zero-Latency Mixer','Ses Konsolu · DSP bağlantısı planlandı'),('Fairlight','Ses Konsolu'),('FP16','FP16 · Plan'),('Broadcast Safe','Örnek ölçüm')]:html=html.replace(a,b)
html=html.replace('width:100%;background:var(--pl-grad-sunset);transition:width','width:0%;background:var(--pl-grad-sunset);transition:width')
for a,b in [('1. Kurgu Atölyesi (Edit)','Kurgu'),('2. AI Karakter & Düğüm (Fusion)','Düğüm & Karakter'),('3. Hareketli Grafik (AE)','Hareket'),('4. Renk (DaVinci ACES)','Renk'),('5. Ses (Fairlight)','Ses'),('6. Dışa Aktar (Rust)','Teslim')]:html=html.replace(a,b)
html=html.replace('class="pl-kurgu-jf__dome"','class="pl-kurgu-jf__dome" style="fill:color-mix(in srgb,var(--pl-viz-7) 48%,var(--pl-on-media));opacity:.9"').replace('class="pl-kurgu-jf__tent"','class="pl-kurgu-jf__tent" style="fill:none;stroke:color-mix(in srgb,var(--pl-viz-7) 40%,var(--pl-on-media));stroke-width:1.6;opacity:.55"').replace('class="pl-kurgu-jf__rib"','class="pl-kurgu-jf__rib" style="fill:none;stroke:var(--pl-on-media);stroke-width:1.4;opacity:.6"')
# All source inline colors are brought onto canonical palette roles too.
html=re.sub(r'style="([^"]*)"',lambda m:'style="'+colors(m.group(1))+'"',html)
if (ui/'index.html').exists() and not (ui/'studio-engine.html').exists():shutil.copy2(ui/'index.html',ui/'studio-engine.html')
(ui/'index.html').write_text(html,encoding='utf-8')
print('Imported desktop reference; offline CSS/JS, canonical tokens and explicit preview state.')
