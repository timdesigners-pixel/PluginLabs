"""Pin ekranları 3 — Pin 17, 18, 22, 23, 26, 31, 39"""
from pin_base import screen, ph, face, rail, dots, sw, I, smooth, area, bars

# ------------------------------------------------------------------ PIN 17
screen(pin=17, ad="Video Kurgu Uygulaması — Zaman Çizelgesi",
  aciklama="Gri sahnede siyah tablet çerçeve: üstte proje adı ve dışa aktar, solda medya içe aktarma ve küçük resimler, ortada metin bindirmeli önizleme ve oynatma çubuğu, sağda metin ayarları; altta zaman cetveli, turuncu oynatma kafası, mor medya, camgöbeği ses dalgası ve mavi metin izleri.",
  sahne="rgb(96 96 96)",
  css='''
.pl-s17 { width: 1060px; background: rgb(14 14 16); border: 8px solid rgb(4 4 6); border-radius: 30px; color: var(--pl-fg-2); padding: 12px 16px 18px; }
.pl-s17-top { display: flex; align-items: center; gap: 12px; font-size: 10px; }
.pl-s17-logo { display: flex; gap: 8px; align-items: center; color: white; font-weight: 700; line-height: 1.1; }
.pl-s17-logo i { width: 22px; height: 22px; border-radius: 50%; background: conic-gradient(rgb(255 90 90), rgb(255 200 60), rgb(60 200 255), rgb(255 90 90)); }
.pl-s17-exp { background: white; color: black; font-weight: 700; padding: 6px 14px; border-radius: 16px; display: flex; gap: 6px; align-items: center; }
.pl-s17-up { display: grid; grid-template-columns: 34px 220px 1fr 200px; gap: 12px; margin-top: 14px; height: 260px; }
.pl-s17-tools { display: grid; align-content: start; gap: 14px; justify-items: center; color: var(--pl-fg-3); }
.pl-s17-tools span.is-active { color: white; }
.pl-s17-media { background: rgb(26 26 30); border-radius: 14px; padding: 10px; font-size: 9px; display: grid; gap: 8px; align-content: start; }
.pl-s17-media .pl-segment { font-size: 8px; } .pl-s17-media .pl-segment button { height: 22px; padding: 0 6px; font-size: 8.5px; }
.pl-s17-thumbs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pl-s17-thumbs div { display: grid; gap: 4px; color: var(--pl-fg-3); } .pl-s17-thumbs div > span:first-child { height: 52px; border-radius: 6px; overflow: hidden; }
.pl-s17-prev { position: relative; border-radius: 14px; overflow: hidden; }
.pl-s17-ovl { position: absolute; left: 6%; top: 14%; padding: 8px 12px; border: 1px solid rgb(255 255 255 / .8); background: rgb(0 0 0 / .25); color: rgb(110 255 140); font-weight: 800; font-size: 14px; line-height: 1.15; max-width: 160px; }
.pl-s17-ovl::before, .pl-s17-ovl::after { content: ""; position: absolute; width: 6px; height: 6px; background: white; } .pl-s17-ovl::before { left: -3px; top: -3px; } .pl-s17-ovl::after { right: -3px; bottom: -3px; }
.pl-s17-pbar { position: absolute; left: 10px; right: 60px; bottom: 10px; height: 30px; border-radius: 8px; background: rgb(0 0 0 / .6); display: flex; align-items: center; gap: 10px; padding: 0 10px; font-size: 9px; color: white; }
.pl-s17-pbar .pl-progress { flex: 1; height: 3px; }
.pl-s17-vol { position: absolute; right: 12px; bottom: 10px; width: 30px; height: 90px; border-radius: 15px; background: rgb(0 0 0 / .6); display: grid; justify-items: center; align-content: space-between; padding: 8px 0; color: white; }
.pl-s17-text { background: rgb(26 26 30); border-radius: 14px; padding: 12px; display: grid; gap: 10px; align-content: start; font-size: 9px; }
.pl-s17-text h6 { margin: 0; color: white; font-size: 11px; display: flex; justify-content: space-between; }
.pl-s17-f { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; } .pl-s17-f span { background: rgb(255 255 255 / .06); padding: 5px 6px; border-radius: 5px; color: var(--pl-fg-1); }
.pl-s17-align { display: flex; justify-content: space-between; color: var(--pl-fg-3); }
.pl-s17-color { display: grid; grid-template-columns: auto 1fr auto auto; gap: 8px; align-items: center; } .pl-s17-color i { width: 26px; height: 14px; border-radius: 7px; background: var(--c); }
.pl-s17-tl { margin-top: 14px; background: rgb(26 26 30); border-radius: 14px; padding: 10px 12px 14px; position: relative; }
.pl-s17-ruler { display: grid; grid-template-columns: 110px 1fr; align-items: center; font-family: var(--pl-font-mono); font-size: 8px; color: var(--pl-fg-4); height: 22px; }
.pl-s17-ruler div { display: flex; justify-content: space-between; background: repeating-linear-gradient(90deg, rgb(255 255 255 / .25) 0 1px, transparent 1px 6px) bottom / 100% 4px no-repeat; padding-bottom: 6px; }
.pl-s17-track { display: grid; grid-template-columns: 110px 1fr; align-items: center; height: 40px; margin-top: 8px; }
.pl-s17-th { display: flex; gap: 10px; align-items: center; font-family: var(--pl-font-mono); font-size: 8px; letter-spacing: .1em; color: var(--c); }
.pl-s17-th span:first-child { border-bottom: 1px solid var(--c); padding-bottom: 2px; } .pl-s17-th .pl-ico { color: var(--pl-fg-3); width: 12px; height: 12px; }
.pl-s17-lane { position: relative; height: 100%; }
.pl-s17-clip { position: absolute; top: 2px; bottom: 2px; border-radius: 10px; display: flex; align-items: center; gap: 8px; padding: 0 8px; font-size: 9px; color: white; }
.pl-s17-clip .t { width: 50px; height: 30px; border-radius: 6px; overflow: hidden; flex: none; }
.pl-s17-clip em { margin-left: auto; width: 20px; height: 20px; border-radius: 6px; display: grid; place-items: center; background: rgb(255 255 255 / .2); font-style: normal; }
.pl-s17-wave { display: flex; align-items: center; gap: 1.5px; height: 100%; position: absolute; top: 0; }
.pl-s17-wave i { width: 2px; border-radius: 1px; background: rgb(60 210 240); }
.pl-s17-head { position: absolute; top: 20px; bottom: 10px; left: calc(122px + 31%); width: 2px; background: rgb(255 120 40); }
.pl-s17-head::before { content: ""; position: absolute; top: -10px; left: -6px; width: 14px; height: 18px; border-radius: 4px 4px 7px 7px; background: rgb(255 120 40); }
''',
  html=f'''<div class="pl-s17"><div class="pl-s17-top"><span class="pl-s17-logo"><i></i>Torana<br><small class="pl-sx-muted" style="font-weight:400">Video editör</small></span>{"".join(f"<span style='color:var(--pl-fg-3)'>{I(ic)}</span>" for ic in ["sliders","sun","pointer","rec"])}<span style="flex:1;text-align:center" class="pl-sx-muted">Projeler / <b style="color:white">PluginLabs_tanitim04.tm</b> {I("chevron-down")}</span><span class="pl-sx-ibtn" style="width:28px;height:28px">{I("box")}</span>{face(51,28)}<span class="pl-s17-exp">{I("refresh")}Dışa aktar</span></div>
<div class="pl-s17-up"><div class="pl-s17-tools"><span class="is-active">{I("folder")}</span>{I("wand")}{I("sparkles")}{I("upload")}{I("layers")}{I("type")}{I("music")}</div>
<div class="pl-s17-media"><span style="color:white;display:flex;gap:6px;align-items:center">{I("download")}Medya içe aktar</span><div class="pl-segment"><button class="is-active">Tüm medya</button><button>Video</button><button>Görsel</button><button>Ses</button></div><div class="pl-s17-thumbs"><div><span>{ph("space")}</span>Dünya.png</div><div><span>{ph("ocean")}</span>Büyük-Patlama.mp4</div><div><span>{ph("warm")}</span>Tanıtım.mp4</div><div><span style="display:flex;align-items:center;justify-content:center;background:rgb(255 255 255 / .04)">{I("wave",24)}</span>Altyazı-Ses.mp3</div></div></div>
<div class="pl-s17-prev">{ph("space")}<div class="pl-s17-ovl">Enerjinin Korunumu Yasası</div><div class="pl-s17-pbar"><span class="pl-chip pl-chip--mono" style="height:20px">16:9</span>{I("play")}<span>00:23</span><div class="pl-progress"><span style="--pl-val:34%;background:white"></span></div>{I("maximize2")}</div><div class="pl-s17-vol">{I("volume")}<span style="width:3px;height:40px;background:white;border-radius:2px"></span>{I("minus")}</div></div>
<div class="pl-s17-text"><h6>Metin ayarları <span>⋯</span></h6><div class="pl-s17-f"><span>Nunito</span><span>28</span><span>Siyah</span><span>Otomatik</span><span>%1,8</span><span>0</span></div><div class="pl-s17-align">{I("list")}{I("minus")}{I("menu") if False else I("sliders")}{I("type")}{I("bold") if False else I("box")}</div><div class="pl-s17-color"><span>Renk</span><span class="pl-sx-row"><i style="--c:rgb(60 230 120)"></i>3BFF93</span><span>%100</span></div><div class="pl-s17-color"><span>Kenarlık</span><span class="pl-sx-row"><i style="--c:rgb(0 0 0);box-shadow:inset 0 0 0 1px rgb(255 255 255 / .2)"></i>000000</span><span>%0</span></div></div></div>
<div class="pl-s17-tl"><div class="pl-s17-ruler"><span class="pl-sx-row" style="font-family:var(--pl-font-sans);font-size:9px">Hız <span class="pl-chip pl-chip--mono" style="height:18px">1,5x</span>{I("scissors")}{I("copy")}</span><div>{"".join(f"<span>00:{i*10:02d}</span>" for i in range(10))}</div></div>
<div class="pl-s17-track"><div class="pl-s17-th" style="--c:rgb(160 90 255)"><span>MEDYA 1</span>{I("eye")}{I("lock")}</div><div class="pl-s17-lane"><span class="pl-s17-clip" style="left:0;width:31%;background:rgb(150 60 240)"><span class="t">{ph("space")}</span>Dünya.png<em>{I("image")}</em></span><span class="pl-s17-clip" style="left:32%;width:68%;background:rgb(150 60 240)"><span class="t">{ph("ocean")}</span>Büyük-Patlama.mp4<em>{I("film")}</em></span></div></div>
<div class="pl-s17-track"><div class="pl-s17-th" style="--c:rgb(60 210 240)"><span>SES 1</span>{I("eye")}{I("lock")}</div><div class="pl-s17-lane"><span class="pl-s17-wave" style="left:0;width:44%">{"".join(f'<i style="height:{v}%"></i>' for v in bars(31,80,15,95))}</span><span style="position:absolute;left:45%;top:12px;font-size:9px">Altyazı-Ses.mp3 {I("music")}</span><span class="pl-s17-wave" style="left:58%;width:30%">{"".join(f'<i style="height:{v}%"></i>' for v in bars(32,55,15,95))}</span><span style="position:absolute;left:90%;top:12px;font-size:9px">Giriş.mp3</span></div></div>
<div class="pl-s17-track"><div class="pl-s17-th" style="--c:rgb(60 160 240)"><span>METİN 1</span>{I("eye")}{I("lock")}</div><div class="pl-s17-lane"><span class="pl-s17-clip" style="left:0;width:38%;background:rgb(40 150 220)">Enerjinin Korunumu Yasası<em>T</em></span><span class="pl-s17-clip" style="left:74%;width:26%;background:rgb(40 150 220)">Dünyanın Sonu?<em>T</em></span></div></div><span class="pl-s17-head"></span></div></div>''')

# ------------------------------------------------------------------ PIN 18
screen(pin=18, ad="Drone Kumanda — Canlı Kamera", yuzey="cockpit",
  aciklama="Açık sis sahnesinde siyah tablet: logo ve dikey ikon ray, sisli uçurum kamera görüntüsü (HDR, 4K·24FPS, seviye, RGB filtreleri, histogram), sağda cihaz/batarya/irtifa ve parlaklık; altta video/foto sekmesi, uydu mini harita, uçuş verileri, AWB/DISP ve joystick, pusula kadranı.",
  sahne="radial-gradient(80% 80% at 50% 30%, rgb(230 234 236), rgb(170 180 186))",
  css='''
.pl-s18 { width: 1080px; background: rgb(6 6 8); border-radius: 30px; padding: 16px 16px 16px 0; display: grid; grid-template-columns: 64px 1fr 300px; grid-template-rows: auto auto; gap: 12px; color: var(--pl-fg-2); }
.pl-s18-rail { grid-row: span 2; display: flex; flex-direction: column; align-items: center; gap: 22px; padding-top: 4px; color: rgb(220 220 225); }
.pl-s18-rail b { font-style: italic; font-size: 16px; color: white; margin-bottom: 40px; }
.pl-s18-cam { position: relative; height: 330px; border-radius: 22px; overflow: hidden; }
.pl-s18-hud { position: absolute; left: 0; top: 0; bottom: 0; width: 120px; padding: 14px; display: grid; gap: 10px; align-content: start; background: linear-gradient(90deg, rgb(0 0 0 / .45), transparent); color: white; font-size: 9px; }
.pl-s18-hud .b { border: 1px solid rgb(255 255 255 / .7); border-radius: 4px; padding: 4px 8px; width: max-content; font-size: 10px; }
.pl-s18-rgb { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; } .pl-s18-rgb span { display: flex; gap: 6px; align-items: center; padding: 3px 6px; border-radius: 4px; background: rgb(0 0 0 / .45); } .pl-s18-rgb i { width: 6px; height: 6px; border-radius: 50%; background: var(--c); }
.pl-s18-hist { height: 50px; border-radius: 6px; background: rgb(0 0 0 / .35); position: relative; overflow: hidden; }
.pl-s18-hist svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.pl-s18-rec { position: absolute; right: 14px; top: 14px; display: flex; gap: 8px; }
.pl-s18-rec span { height: 26px; padding: 0 10px; border-radius: 4px; background: rgb(0 0 0); color: white; display: flex; align-items: center; gap: 6px; font-family: var(--pl-font-mono); font-size: 9px; }
.pl-s18-rec span:first-child { background: rgb(240 40 60); }
.pl-s18-aim { position: absolute; left: 48%; top: 52%; width: 70px; border-top: 2px solid white; transform: rotate(-10deg); }
.pl-s18-aim::before { content: ""; position: absolute; left: 20px; top: -9px; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; }
.pl-s18-dev { background: rgb(20 20 22); border-radius: 22px; padding: 16px; display: grid; gap: 12px; align-content: start; font-size: 10px; color: white; }
.pl-s18-dev h4 { margin: 0; font-size: 16px; display: flex; justify-content: space-between; align-items: center; }
.pl-s18-kv { display: grid; grid-template-columns: 1fr auto; } .pl-s18-kv b { font-size: 11px; }
.pl-s18-sl { height: 2px; background: rgb(255 255 255 / .2); position: relative; } .pl-s18-sl::after { content: ""; position: absolute; left: 0; width: var(--v); height: 2px; background: white; } .pl-s18-sl::before { content: ""; position: absolute; left: var(--v); top: -4px; width: 10px; height: 10px; border-radius: 50%; background: white; }
.pl-s18-cir { width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgb(255 255 255 / .2); display: grid; place-items: center; }
.pl-s18-bot { background: rgb(20 20 22); border-radius: 22px; padding: 14px; display: grid; grid-template-columns: 110px 1fr auto; gap: 16px; align-items: center; }
.pl-s18-map { height: 110px; border-radius: 10px; background: radial-gradient(circle, transparent 30%, rgb(255 200 60 / .6) 31% 32%, transparent 33%), repeating-linear-gradient(30deg, rgb(70 80 70) 0 6px, rgb(50 60 56) 6px 12px); }
.pl-s18-data { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 16px; font-size: 8px; color: var(--pl-fg-3); text-transform: uppercase; letter-spacing: .06em; }
.pl-s18-data b { display: block; color: white; font-size: 12px; letter-spacing: 0; text-transform: none; }
.pl-s18-joy { display: grid; justify-items: center; gap: 8px; } .pl-s18-joy .pl-sx-row span { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: rgb(40 40 44); color: white; font-size: 10px; }
.pl-s18-comp { background: rgb(20 20 22); border-radius: 22px; display: grid; place-items: center; gap: 4px; padding: 10px; color: white; font-size: 10px; }
''',
  html=f'''<div class="pl-s18"><nav class="pl-s18-rail"><b>DR</b>{I("home")}{I("box")}{I("image")}{I("sun")}<span style="height:20px"></span>{I("settings")}{I("bell")}{I("flag")}<span style="margin-top:30px">{face(55,30)}</span><span style="margin-top:20px">{I("arrow-left")}</span></nav>
<div class="pl-s18-cam">{ph("fog")}<div style="position:absolute;left:30%;top:40%;width:50%;height:70%;background:linear-gradient(160deg, rgb(110 120 110), rgb(60 66 60));clip-path:polygon(10% 0, 60% 4%, 100% 40%, 80% 100%, 0 100%)"></div><div class="pl-s18-hud"><span class="b">HDR</span><span>4K • 24FPS</span><span>SEVİYE</span><span class="b" style="font-size:8px">IST</span><div class="pl-s18-rgb">{"".join(f'<span><i style="--c:{c}"></i>{n}</span>' for c,n in [("rgb(255 70 70)","R"),("rgb(70 220 100)","G"),("rgb(70 120 255)","B"),("rgb(255 220 60)","Y")])}</div><span>H2.85</span><div class="pl-s18-hist"><svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true"><path d="M0 50 L0 40 L10 30 L20 34 L30 20 L40 26 L50 10 L60 22 L70 14 L80 30 L90 24 L100 36 L100 50Z" fill="rgb(255 255 255 / .8)"/></svg></div></div>
<div class="pl-s18-rec"><span>{I("pause")}</span><span style="background:black">● 02:00</span></div><span class="pl-s18-aim"></span></div>
<div class="pl-s18-dev"><h4>Hava Aracı Pro {I("drone",24)}</h4><span class="pl-sx-muted">FHD yüksek kare hızlı canlı yayın</span><div class="pl-s18-kv"><b>Batarya durumu</b><b>%75</b><span class="pl-sx-muted">12 dk önce</span></div><div class="pl-s18-kv"><b>İrtifa sınırı</b><b>270 m</b></div><div class="pl-s18-sl" style="--v:80%"></div><div class="pl-sx-row" style="justify-content:space-between;margin-top:10px"><span class="pl-s18-cir">{I("sun")}</span><div class="pl-s18-sl" style="--v:30%;flex:1;margin:0 10px"></div><span class="pl-s18-cir">8,3</span></div><div class="pl-sx-row" style="justify-content:center;gap:20px"><span class="pl-s18-cir">{I("minus")}</span><span class="pl-s18-cir">◐</span><span class="pl-s18-cir">{I("plus")}</span></div></div>
<div class="pl-s18-bot"><div style="grid-column:1/-1;display:flex;gap:6px"><span class="pl-chip" style="background:rgb(255 255 255 / .1);color:white">{I("video")}Video</span><span class="pl-chip" style="background:none;border:0">{I("camera")}Foto</span></div><div class="pl-s18-map"></div><div class="pl-s18-data"><div>Hız<b>20 km/s</b></div><div>Lens<b>25 mm</b></div><div>Kare boyutu<b style="color:var(--pl-fg-3)">1920:1080</b></div><div>İrtifa<b>80 m</b></div><div>ISO<b>800</b></div><div><b>1280:720</b></div><div>Uçuş süresi<b>55:43</b></div><div>Enstantane<b>180,0</b></div><div><b style="color:var(--pl-fg-3)">854:480</b></div></div><div class="pl-s18-joy"><div class="pl-sx-row"><span>AWB</span><span>DISP</span></div><div class="pl-dpad" style="width:110px"><button class="pl-dpad__u" aria-label="Yukarı">{I("chevron-up")}</button><button class="pl-dpad__d" aria-label="Aşağı">{I("chevron-down")}</button><button class="pl-dpad__l" aria-label="Sol">{I("chevron-left")}</button><button class="pl-dpad__r" aria-label="Sağ">{I("chevron-right")}</button><span class="pl-dpad__stick" style="width:40px;height:40px"></span></div></div></div>
<div class="pl-s18-comp"><div class="pl-compass" style="width:160px"><span class="pl-compass__needle"></span><div class="pl-compass__rose" style="--deg:260"><span style="rotate:0deg">K</span><span style="rotate:90deg">D</span><span style="rotate:180deg">G</span><span style="rotate:270deg">B</span></div><span class="pl-compass__val">260°<small>KD</small></span></div><span class="pl-sx-muted">38°25'3"K 27°08'5"D</span></div></div>''')

# ------------------------------------------------------------------ PIN 22
screen(pin=22, ad="Tasarım Aracı — Sosyal Gönderi Editörü", urun="replicator",
  aciklama="Renkli macOS duvar kâğıdı üzerinde koyu editör: üst çubuk ve kaydet, sol araç sütunu, ortada dikey poster tuvali ve açık sağ tık menüsü, sol altta katmanlar paneli, altta sayfa küçük resimleri; sağda Tasarım/Animasyon özellik denetçisi.",
  sahne="linear-gradient(135deg, rgb(30 120 255), rgb(150 60 220) 45%, rgb(255 60 120) 75%, rgb(255 140 60))",
  css='''
.pl-s22 { width: 1040px; height: 620px; background: rgb(28 28 32); border-radius: 14px; display: grid; grid-template-columns: 50px 1fr 250px; grid-template-rows: 40px 1fr; color: var(--pl-fg-2); position: relative; font-size: 10px; }
.pl-s22-top { grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; padding: 0 14px; border-bottom: 1px solid rgb(255 255 255 / .06); color: white; }
.pl-s22-save { background: rgb(255 90 50); color: white; font-weight: 700; padding: 5px 12px; border-radius: 5px; }
.pl-s22-tools { display: grid; align-content: start; justify-items: center; gap: 4px; padding: 10px 0; }
.pl-s22-tools span { width: 30px; height: 30px; border-radius: 6px; display: grid; place-items: center; color: var(--pl-fg-3); background: rgb(255 255 255 / .04); }
.pl-s22-tools span.is-active { background: rgb(255 255 255 / .12); color: white; }
.pl-s22-canvas { position: relative; display: grid; place-items: center; }
.pl-s22-poster { width: 210px; height: 280px; position: relative; overflow: hidden; background: linear-gradient(160deg, rgb(110 90 255), rgb(70 50 200)); box-shadow: 0 0 0 1px rgb(255 255 255 / .3); }
.pl-s22-poster b { position: absolute; left: 10px; top: 60px; font-size: 54px; font-weight: 900; color: white; line-height: .9; letter-spacing: -.04em; }
.pl-s22-poster i { position: absolute; left: 40px; top: 90px; width: 130px; height: 190px; border-radius: 60px 60px 0 0; background: linear-gradient(rgb(255 110 40), rgb(220 70 20)); }
.pl-s22-poster i::before { content: ""; position: absolute; left: 40px; top: -40px; width: 50px; height: 56px; border-radius: 50%; background: rgb(240 200 170); box-shadow: 0 -10px 0 rgb(30 20 20); }
.pl-s22-ctx { position: absolute; left: 52%; top: 26%; }
.pl-s22-ctx .pl-menu { min-width: 150px; font-size: 10px; padding: 4px; }
.pl-s22-ctx .pl-menuitem { height: 24px; font-size: 10px; }
.pl-s22-layers { position: absolute; left: 10px; bottom: 80px; width: 170px; background: rgb(20 20 24); border: 1px solid rgb(255 255 255 / .08); border-radius: 8px; padding: 6px; }
.pl-s22-layers .pl-layer { height: 24px; font-size: 9.5px; }
.pl-s22-pages { position: absolute; left: 50%; bottom: 46px; transform: translateX(-50%); }
.pl-s22-zoom { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); display: flex; gap: 6px; align-items: center; }
.pl-s22-zoom span { padding: 4px 8px; border-radius: 4px; background: rgb(255 255 255 / .06); }
.pl-s22 .pl-inspector { width: auto; font-size: 10px; background: rgb(24 24 28); }
.pl-s22 .pl-propfield { height: 24px; }
''',
  html=f'''<div class="pl-s22"><div class="pl-s22-top">{I("chevron-left")}<span class="pl-sx-ibtn" style="width:24px;height:24px;border-radius:6px">{I("layers")}</span>PluginLabsGonderi.dr {I("chevron-down")}<span style="flex:1"></span>{I("play")}{I("share")}<span class="pl-s22-save">Kaydet</span></div>
<div class="pl-s22-tools">{"".join(f'<span class="{"is-active" if i==1 else ""}">{I(ic)}</span>' for i,ic in enumerate(["pointer","square","type","image","layers","sparkles","clock"]))}</div>
<div class="pl-s22-canvas"><span class="pl-sx-muted" style="position:absolute;left:calc(50% - 105px);top:24px">Sayfa 1</span><div class="pl-s22-poster"><i></i><b>NEW<br>ERA</b></div>
<div class="pl-s22-ctx"><div class="pl-menu">{"".join(f'<button class="pl-menuitem{" is-open" if n=="Kırp" else ""}">{I(ic)}{n}</button>' for ic,n in [("copy","Kopyala"),("copy","Yapıştır"),("layers","Öne getir"),("layers","Arkaya gönder"),("scissors","Kırp"),("eye","Gizle"),("lock","Kilitle"),("archive","Arşivle")])}<div class="pl-divider"></div><button class="pl-menuitem">{I("download")}PNG olarak dışa aktar</button></div></div>
<div class="pl-s22-layers"><div class="pl-layers">{"".join(f'<div class="pl-layer{" is-selected" if s else ""}" style="--d:{d}">{I(ic)}{n}</div>' for ic,n,d,s in [("square","Arka plan",0,False),("image","Fotoğraf",0,True),("type","Başlık",0,False),("type","Kurumsal yazı",0,False)])}</div></div>
<div class="pl-s22-pages"><div class="pl-pagestrip">{"".join(f'<span class="pl-pagestrip__p{" is-active" if i==1 else ""}" style="background:{c}"><span>{i+1}</span></span>' for i,c in enumerate(["rgb(70 50 200)","linear-gradient(rgb(255 120 40),rgb(110 90 255))","rgb(220 70 40)","rgb(255 140 60)"]))}<span class="pl-pagestrip__add">{I("plus")}</span></div></div>
<div class="pl-s22-zoom"><span>{I("minus")}</span><span>%100</span><span>{I("plus")}</span></div></div>
<aside class="pl-inspector"><div class="pl-inspector__tabs"><button class="is-active">Tasarım</button><button>Animasyon</button></div>
<div class="pl-inspector__sec"><div class="pl-inspector__sechead">Yerleşim <span class="pl-switch"><input type="checkbox" checked></span></div><div class="pl-inspector__grid"><label class="pl-propfield"><b>Yön</b><input value="Dikey"></label><label class="pl-propfield"><b>Boşluk</b><input value="16"></label><label class="pl-propfield"><b>G</b><input value="1080"></label><label class="pl-propfield"><b>Y</b><input value="1350"></label></div></div>
<div class="pl-inspector__sec"><div class="pl-inspector__sechead">Metin</div><label class="pl-propfield"><b>Aa</b><input value="Space Grotesk"></label><div class="pl-inspector__grid"><label class="pl-propfield"><b>Ağırlık</b><input value="Black"></label><label class="pl-propfield"><b>Boyut</b><input value="96"></label><label class="pl-propfield"><b>Satır</b><input value="%90"></label><label class="pl-propfield"><b>Aralık</b><input value="-%4"></label></div><div class="pl-alignbar">{"".join(f'<button class="{"is-active" if i==0 else ""}">{I("minus")}</button>' for i in range(6))}</div></div>
<div class="pl-inspector__sec"><div class="pl-inspector__sechead">Dolgu {I("plus")}</div><label class="pl-propfield"><span class="pl-propfield__sw" style="--c:rgb(110 90 255)"></span><input value="6E5AFF"><b>%100</b></label></div>
<div class="pl-inspector__sec"><div class="pl-inspector__sechead">Efektler {I("plus")}</div><label class="pl-propfield"><b>Arka plan bulanıklığı</b><input value="12"></label><label class="pl-propfield"><b>Opaklık</b><input value="%100"></label></div></aside></div>''')

# ------------------------------------------------------------------ PIN 23
screen(pin=23, ad="Yemek Siparişi — Eatland Tarzı Pano", tema="light", yuzey="soft", urun="mutfak",
  aciklama="Lila sahnede beyaz yumuşak pano: solda profil fotoğrafı, pembe aktif menü ve 'Hızlı teslimat' kartı; ortada büyük karşılama, kategori hapları, ürün kartları ve seçili kart; sağda indirim afişi, sipariş adresi ve sepet özeti.",
  sahne="linear-gradient(160deg, rgb(220 222 250), rgb(200 205 245))",
  css='''
.pl-s23 { width: 1020px; padding: 18px; border-radius: 30px; background: rgb(236 238 252); display: grid; grid-template-columns: 150px 1fr 220px; gap: 16px; color: rgb(60 62 90); }
.pl-s23-side { display: grid; gap: 10px; align-content: start; justify-items: center; text-align: center; }
.pl-s23-photo { width: 92px; height: 92px; border-radius: 22px; overflow: hidden; box-shadow: 0 0 0 5px white; }
.pl-s23-nav { width: 100%; display: grid; gap: 10px; margin-top: 10px; }
.pl-s23-nav span { display: flex; gap: 12px; align-items: center; font-size: 11px; color: rgb(140 142 170); }
.pl-s23-nav span i { width: 38px; height: 38px; border-radius: 12px; background: white; display: grid; place-items: center; font-style: normal; }
.pl-s23-nav span.is-active { background: rgb(255 110 140); color: white; border-radius: 12px; } .pl-s23-nav span.is-active i { background: rgb(255 140 165); color: white; }
.pl-s23-fast { margin-top: 30px; width: 100%; background: white; border-radius: 18px; padding: 50px 10px 12px; position: relative; text-align: left; }
.pl-s23-fast::before { content: ""; position: absolute; left: 30px; top: -30px; width: 60px; height: 60px; border-radius: 50%; background: rgb(170 130 255); }
.pl-s23-fast b { display: block; font-size: 15px; color: rgb(30 32 60); line-height: 1.1; }
.pl-s23-main { background: white; border-radius: 24px; padding: 22px; display: grid; gap: 16px; align-content: start; }
.pl-s23-h { display: flex; align-items: flex-start; gap: 10px; }
.pl-s23-h h3 { margin: 0; font-size: 30px; line-height: 1.15; color: rgb(30 32 60); font-weight: 700; flex: 1; }
.pl-s23-h span { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: rgb(244 245 252); } .pl-s23-h span.d { background: rgb(40 42 70); color: white; position: relative; } .pl-s23-h span.d::after { content: ""; position: absolute; right: -2px; top: -2px; width: 8px; height: 8px; border-radius: 50%; background: rgb(255 90 120); }
.pl-s23-cats { display: flex; gap: 10px; } .pl-s23-cats div { width: 58px; height: 84px; border-radius: 30px; display: grid; justify-items: center; align-content: center; gap: 8px; font-size: 9.5px; color: rgb(150 152 180); background: rgb(250 250 254); box-shadow: 0 6px 16px rgb(60 70 140 / .06); }
.pl-s23-cats div i { width: 34px; height: 34px; border-radius: 50%; display: block; background: var(--c); }
.pl-s23-cats div.is-active { color: rgb(30 32 60); font-weight: 700; }
.pl-s23-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.pl-s23-card { border-radius: 22px; padding: 0 14px 14px; text-align: left; box-shadow: 0 10px 24px rgb(60 70 140 / .08); position: relative; margin-top: 30px; display: grid; gap: 4px; }
.pl-s23-card .img { width: 92px; height: 92px; border-radius: 50%; margin: -30px auto 6px; box-shadow: 0 10px 20px rgb(0 0 0 / .15); }
.pl-s23-card b { font-size: 11px; color: rgb(30 32 60); } .pl-s23-card small { font-size: 8.5px; color: rgb(160 162 185); line-height: 1.4; }
.pl-s23-card .f { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-weight: 700; color: rgb(30 32 60); }
.pl-s23-card .f span { width: 24px; height: 24px; border-radius: 50%; background: rgb(40 42 70); color: white; display: grid; place-items: center; }
.pl-s23-card.is-sel { background: rgb(240 241 248); } .pl-s23-card.is-sel .f span { background: none; border: 1.5px solid rgb(40 42 70); color: rgb(40 42 70); }
.pl-s23-right { display: grid; gap: 14px; align-content: start; font-size: 10px; }
.pl-s23-promo { height: 100px; border-radius: 20px; background: rgb(170 130 255); color: white; padding: 16px; display: grid; align-content: end; position: relative; }
.pl-s23-promo b { font-size: 18px; } .pl-s23-promo::after { content: ""; position: absolute; right: -14px; top: -20px; width: 80px; height: 70px; border-radius: 40px 40px 20px 20px; background: linear-gradient(rgb(220 140 60) 0 30%, rgb(110 60 30) 31% 45%, rgb(120 190 80) 46% 55%, rgb(240 170 80) 56%); transform: rotate(-12deg); }
.pl-s23-o { display: grid; gap: 10px; }
.pl-s23-o h5 { margin: 0; display: flex; justify-content: space-between; font-size: 13px; color: rgb(30 32 60); } .pl-s23-o h5 span { color: rgb(255 110 140); font-size: 10px; font-weight: 500; }
.pl-s23-ad { display: flex; gap: 10px; align-items: center; color: rgb(30 32 60); } .pl-s23-ad i { width: 18px; height: 18px; border-radius: 6px; background: rgb(255 220 230); display: grid; place-items: center; color: rgb(255 90 120); font-style: normal; }
.pl-s23-it { display: grid; grid-template-columns: 30px 1fr auto auto; gap: 8px; align-items: center; color: rgb(30 32 60); }
.pl-s23-it .img { width: 30px; height: 30px; border-radius: 8px; } .pl-s23-it em { font-style: normal; background: rgb(255 110 140); color: white; padding: 1px 6px; border-radius: 5px; font-size: 8.5px; }
.pl-s23-sum { border-top: 1.5px dashed rgb(200 202 225); padding-top: 10px; display: grid; gap: 4px; } .pl-s23-sum div { display: flex; justify-content: space-between; } .pl-s23-sum b { color: rgb(30 32 60); }
.pl-s23-sub { height: 38px; border-radius: 10px; background: rgb(40 42 70); color: white; display: grid; place-items: center; font-weight: 600; }
''',
  html=f'''<div class="pl-s23"><div class="pl-s23-side"><div class="pl-s23-photo">{face(61,92)}</div><b style="color:rgb(30 32 60);font-size:12px">Elif Gün</b><div class="pl-s23-nav">{"".join(f'<span class="{"is-active" if i==0 else ""}"><i>{I(ic)}</i>{n}</span>' for i,(ic,n) in enumerate([("home","Ana sayfa"),("book","Menü"),("folder","Yazılar"),("settings","Ayarlar")]))}</div><div class="pl-s23-fast"><b>Hızlı<br>teslimat!</b><span style="font-size:9px">Daha fazla →</span></div></div>
<div class="pl-s23-main"><div class="pl-s23-h"><h3>Mutfak Atölyesi'ne<br>hoş geldin</h3><span>{I("search")}</span><span class="d">{I("cart")}</span></div>
<div class="pl-s23-cats">{"".join(f'<div class="{"is-active" if i==0 else ""}"><i style="--c:{c}"></i>{n}</div>' for i,(c,n) in enumerate([("radial-gradient(circle, rgb(255 200 80), rgb(240 120 50))","Tümü"),("radial-gradient(circle, rgb(230 160 70) 0 40%, rgb(120 70 40) 41% 55%, rgb(240 180 80) 56%)","Burger"),("conic-gradient(rgb(250 210 120) 0 80%, transparent 0)","Pide"),("radial-gradient(circle, rgb(120 190 90), rgb(60 130 60))","Salata"),("radial-gradient(circle, rgb(255 200 220) 0 30%, rgb(200 120 70) 31%)","Tatlı"),("linear-gradient(rgb(240 70 70), rgb(200 40 40))","İçecek")]))}</div>
<div class="pl-sx-row" style="justify-content:space-between"><b style="font-size:16px;color:rgb(30 32 60)">Tüm ürünler {I("sliders")}</b><span style="font-size:10px">Tümünü gör →</span></div>
<div class="pl-s23-grid">{"".join(f'<div class="pl-s23-card{" is-sel" if s else ""}"><div class="img" style="background:{t}"></div><b>{n}</b><small>Dana eti, cheddar, karamelize soğan, ev yapımı sos</small><div class="f">{p}<span>{I("check") if s else I("plus")}</span></div></div>' for t,n,p,s in [("radial-gradient(circle, rgb(240 170 80) 0 30%, rgb(120 70 40) 31% 42%, rgb(120 190 80) 43% 50%, rgb(240 180 90) 51% 70%, transparent 71%)","İzmir Burger","285 ₺",False),("radial-gradient(circle, rgb(255 120 60) 0 15%, rgb(120 200 90) 16% 45%, rgb(250 245 240) 46% 68%, transparent 70%)","Tavuklu Salata","210 ₺",True),("radial-gradient(circle, rgb(250 240 230) 0 20%, rgb(120 190 90) 21% 46%, rgb(40 40 46) 47% 68%, transparent 70%)","Sezar Salata","195 ₺",False)])}</div></div>
<div class="pl-s23-right"><div class="pl-s23-promo"><b>-%50</b><span>Tüm burgerlerde yarı fiyat</span></div><div class="pl-s23-o"><h5>Siparişim <span>Düzenle</span></h5><span class="pl-s23-ad"><i>●</i>14:30</span><span class="pl-s23-ad"><i>●</i>Bostanlı Mah. 1810 Sk. Karşıyaka</span><span class="pl-s23-ad"><i>●</i>Kapıya gelince ara</span>
{"".join(f'<div class="pl-s23-it"><span class="img" style="background:{t}"></span><span>{n}<br><small style="color:rgb(160 162 185)">300 g</small></span><em>− 1 +</em><b>{p}</b></div>' for t,n,p in [("rgb(220 240 210)","Sebze karışık","95 ₺"),("rgb(250 240 225)","Sezar salata","195 ₺"),("rgb(230 225 250)","Sezar salata","195 ₺")])}
<div class="pl-s23-sum"><div>Ara toplam<b>485 ₺</b></div><div>KDV (%10)<span>48,50 ₺</span></div></div><div class="pl-s23-sub">Siparişi gönder</div></div></div></div>''')

# ------------------------------------------------------------------ PIN 31
screen(pin=31, ad="CRM Satış Merkezi — Kişi Kaydı", tema="light", yuzey="soft",
  aciklama="Gri sahnede açık uygulama: üst çubuk, sol menü (aktif limon hap), 'İşlerim' kayıt listesi (seçili limon kart), sağda pastel gradyanlı kayıt alanı: eylem çubuğu, kişi başlığı, süreç akışı, iletişim/sıradaki/aday skoru kartları.",
  sahne="rgb(110 112 120)",
  css='''
.pl-s31 { width: 1060px; height: 620px; background: rgb(246 246 248); display: grid; grid-template-rows: 40px 1fr; color: rgb(50 52 60); font-size: 10px; overflow: hidden; }
.pl-s31-top { display: flex; align-items: center; gap: 10px; padding: 0 14px; border-bottom: 1px solid rgb(0 0 0 / .06); }
.pl-s31-top b { font-size: 12px; } .pl-s31-top .r { margin-left: auto; display: flex; gap: 6px; } .pl-s31-top .r span { width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgb(0 0 0 / .1); display: grid; place-items: center; }
.pl-s31-body { display: grid; grid-template-columns: 150px 240px 1fr; min-height: 0; }
.pl-s31-menu { padding: 14px 10px; display: grid; gap: 2px; align-content: start; }
.pl-s31-menu h4 { margin: 0 0 10px 6px; font-size: 18px; font-weight: 500; display: flex; justify-content: space-between; color: rgb(20 20 26); }
.pl-s31-menu span { display: flex; gap: 8px; align-items: center; height: 26px; padding: 0 8px; border-radius: 13px; color: rgb(70 72 80); } .pl-s31-menu span.is-active { background: rgb(225 245 140); }
.pl-s31-menu em { font-style: normal; color: rgb(150 152 160); font-size: 9px; margin: 8px 8px 2px; }
.pl-s31-work { background: rgb(232 232 236); border-radius: 16px 16px 0 0; padding: 12px; display: grid; gap: 8px; align-content: start; overflow: hidden; }
.pl-s31-work h4 { margin: 0; font-size: 18px; font-weight: 500; display: flex; gap: 6px; align-items: center; color: rgb(20 20 26); }
.pl-s31-wi { background: white; border-radius: 14px; padding: 10px; display: grid; grid-template-columns: 34px 1fr 26px; gap: 4px 8px; align-items: center; }
.pl-s31-wi b { font-size: 12px; color: rgb(20 20 26); font-weight: 600; } .pl-s31-wi small { color: rgb(130 132 140); grid-column: 2; }
.pl-s31-wi .ic { width: 26px; height: 26px; border-radius: 50%; border: 1px solid rgb(0 0 0 / .1); display: grid; place-items: center; grid-row: 1; grid-column: 3; }
.pl-s31-wi .tg { grid-column: 1 / -1; display: flex; gap: 6px; align-items: center; font-size: 8.5px; color: rgb(130 132 140); }
.pl-s31-wi .tg span { background: rgb(240 240 244); padding: 2px 6px; border-radius: 4px; } .pl-s31-wi .tg i { margin-left: auto; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; font-style: normal; background: var(--c); color: rgb(20 20 26); font-size: 8.5px; }
.pl-s31-wi.is-active { background: rgb(232 250 160); }
.pl-s31-rec { background: linear-gradient(160deg, rgb(255 252 235), rgb(250 236 230) 50%, rgb(232 246 236)); border-radius: 16px 16px 0 0; margin-left: 8px; padding: 0 14px 14px; display: grid; gap: 12px; align-content: start; overflow: hidden; }
.pl-s31-act { display: flex; gap: 14px; padding: 10px 0; border-bottom: 1px solid rgb(0 0 0 / .06); color: rgb(60 62 70); } .pl-s31-act span { display: flex; gap: 4px; align-items: center; }
.pl-s31-ph { display: grid; grid-template-columns: 54px 1fr auto auto auto; gap: 4px 16px; align-items: center; }
.pl-s31-ph h3 { margin: 0; font-size: 20px; font-weight: 600; color: rgb(20 20 26); } .pl-s31-ph .t { display: flex; gap: 4px; grid-column: 2; } .pl-s31-ph .t span { border: 1px solid rgb(0 0 0 / .15); padding: 1px 6px; border-radius: 10px; font-size: 8.5px; }
.pl-s31-ph .m { grid-row: span 2; font-size: 8.5px; color: rgb(130 132 140); } .pl-s31-ph .m b { display: block; font-size: 10px; color: rgb(20 20 26); }
.pl-s31-bpf { display: flex; align-items: center; gap: 0; background: white; border-radius: 22px; padding: 4px; }
.pl-s31-bpf .on { background: rgb(40 160 140); color: white; border-radius: 18px; padding: 6px 14px; font-size: 9.5px; line-height: 1.2; } .pl-s31-bpf .st { flex: 1; display: flex; align-items: center; gap: 6px; padding: 0 10px; font-size: 9px; color: rgb(100 102 110); } .pl-s31-bpf .st i { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid rgb(0 0 0 / .15); } .pl-s31-bpf .st::after { content: ""; flex: 1; height: 1px; background: rgb(0 0 0 / .1); }
.pl-s31-tabs { display: flex; gap: 14px; font-size: 9.5px; color: rgb(120 122 130); align-items: center; } .pl-s31-tabs .is-active { background: rgb(20 20 26); color: white; padding: 5px 12px; border-radius: 12px; }
.pl-s31-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.pl-s31-c { background: rgb(255 255 255 / .75); border-radius: 14px; padding: 12px; display: grid; gap: 8px; align-content: start; }
.pl-s31-c h5 { margin: 0; font-size: 12px; color: rgb(20 20 26); display: flex; justify-content: space-between; }
.pl-s31-c .kv small { display: block; color: rgb(140 142 150); font-size: 8.5px; } .pl-s31-c .kv b { font-weight: 500; color: rgb(20 20 26); }
.pl-s31-step { border-radius: 10px; padding: 8px; background: white; display: grid; gap: 4px; } .pl-s31-step.is-hot { background: rgb(232 250 160); }
.pl-s31-step .pl-sx-row span { padding: 4px 10px; border-radius: 12px; font-size: 9px; } .pl-s31-step .pl-sx-row span:first-child { background: rgb(20 20 26); color: white; }
.pl-s31-score { display: flex; align-items: center; gap: 10px; } .pl-s31-score .ring { width: 110px; height: 66px; border-radius: 40px; border: 8px dashed rgb(40 160 140); display: grid; place-items: center; font-size: 30px; color: rgb(20 20 26); }
.pl-s31-score em { font-style: normal; display: grid; gap: 2px; font-size: 9px; } .pl-s31-score em span { background: rgb(232 250 160); padding: 2px 6px; border-radius: 8px; }
.pl-s31-c li { list-style: none; display: flex; gap: 6px; font-size: 9px; } .pl-s31-c li::before { content: "▲"; color: rgb(40 160 140); font-size: 8px; }
''',
  html=f'''<div class="pl-s31"><div class="pl-s31-top">{I("list")}<b>PluginLabs CRM</b><span style="opacity:.3">|</span>Satış Merkezi<span class="r">{"".join(f"<span>{I(ic)}</span>" for ic in ["search","refresh","plus","bulb","filter","settings","info"])}{face(71,24)}</span></div>
<div class="pl-s31-body"><nav class="pl-s31-menu"><h4>Menü <span class="pl-sx-ibtn" style="width:22px;height:22px;background:none">{I("arrow-left")}</span></h4>{"".join(f'<em>{x}</em>' if x.startswith("§") is False and x in ("İşim","Müşteriler","Satış","Performans","Tahsilat") else f'<span class="{"is-active" if x=="Satış hızlandırıcı" else ""}">{I(ic)}{x}</span>' for ic,x in [("home","Ana sayfa"),("clock","Son açılanlar"),("pin","Sabitlenenler"),("",'İşim'),("zap","Satış hızlandırıcı"),("bar-chart","Panolar"),("activity","Etkinlikler"),("",'Müşteriler'),("building","Hesaplar"),("users","Kişiler"),("",'Satış'),("user","Adaylar"),("briefcase","Fırsatlar"),("",'Performans'),("flag","Hedefler"),("trending-up","Tahminler")])}</nav>
<div class="pl-s31-work"><h4>İşlerim <span style="margin-left:auto" class="pl-sx-ibtn">{I("refresh")}</span><span class="pl-sx-ibtn">{I("calendar")}</span><span class="pl-sx-ibtn">{I("search")}</span></h4><span style="text-align:center;color:rgb(130 132 140)">Bugün</span>
{"".join(f'<div class="pl-s31-wi{" is-active" if a else ""}">{face(s,32)}<b>{n}</b><span class="ic">{I(ic)}</span><small>{t}</small><div class="tg"><span>Aday</span>18.11.2026 09:00<i style="--c:{c}">{v}</i></div></div>' for s,n,t,ic,c,v,a in [(72,"Gabriela Yılmaz","İlk müşteri araması","message","rgb(20 20 26);color:white",90,True),(73,"Hale Gür","Takip e-postası","phone","rgb(200 240 180)",80,False),(74,"Yusuf Lale","İlk müşteri araması","phone","rgb(250 230 140)",73,False)])}<span style="text-align:center;color:rgb(130 132 140)">3 hafta önce</span>{"".join(f'<div class="pl-s31-wi">{face(s,32)}<b>{n}</b><span class="ic">{I("mail")}</span><small>Takip e-postası</small></div>' for s,n in [(75,"Vedat Mert"),(76,"Ceylan Muş")])}</div>
<div class="pl-s31-rec"><div class="pl-s31-act">{"".join(f"<span>{I(ic)}{n}</span>" for ic,n in [("download","Kaydet"),("plus","Yeni"),("archive","Arşivle"),("refresh","Yenile"),("check","Erişimi denetle"),("upload","PDF'ye"),("phone","Kalite"),("sliders","Süreç")])}</div>
<div class="pl-s31-ph">{face(77,54)}<h3>Gabriela Yılmaz</h3><span class="m">Kaynak<b>Webinar</b></span><span class="m">Puan<b>Sıcak</b></span><span class="m" style="display:flex;gap:6px;align-items:center">{face(78,22)}<span>Sahip<b>Muhammed</b></span></span><div class="t"><span>Aday</span><span>Satış görüşü</span></div></div>
<div class="pl-s31-bpf"><span class="on">Fırsat satış süreci<br><small style="opacity:.8">Etkin (3 gün)</small></span>{"".join(f'<span class="st"><i></i>{n}</span>' for n in ["Nitelendir (3 G)","Geliştir","Teklif","Kapat"])}</div>
<div class="pl-s31-tabs"><span class="is-active">Özet</span><span>İlişki analizi</span><span>Ayrıntılar</span><span>İlgili</span></div>
<div class="pl-s31-cards"><div class="pl-s31-c"><h5>İletişim</h5>{"".join(f'<div class="kv"><small>{a}</small><b>{b}</b></div>' for a,b in [("Konu","3 kahve makinesi"),("Ad","Gabriela"),("Soyad","Yılmaz"),("Unvan","Satın alma müdürü"),("Cep telefonu","+90 5•• ••• 05 68"),("E-posta","gabriela@ornek.com")])}</div>
<div class="pl-s31-c"><h5>Sıradaki {I("refresh")}</h5><span class="pl-sx-muted" style="color:rgb(100 102 110)">Sekans: Yeni aday besleme</span><div class="pl-s31-step is-hot"><b>İlk müşteri araması</b><small>Adım 1 · Bugün 09:00</small><span>Kendini tanıt</span><div class="pl-sx-row"><span>{I("phone")}Ara</span><span>Tamamlandı işaretle</span></div></div><div class="pl-s31-step"><b>Takip</b><small>Adım 2 · Yarın</small>Aramadan sonra e-posta</div></div>
<div class="pl-s31-c"><h5>Aday skoru <span>⋯ ↗</span></h5><div class="pl-s31-score"><span class="ring">90</span><em>Sınıf A<span>↑ Artıyor</span></em></div><ul style="margin:0;padding:0;display:grid;gap:6px"><li>Satın alma zamanı: <b>gelecek çeyrek</b></li><li>Süreç: <b>bireysel</b></li><li>Aday <b>görece yeni</b></li><li>Tahmini bütçe <b>550.000 ₺</b></li></ul></div></div></div></div></div>''')
