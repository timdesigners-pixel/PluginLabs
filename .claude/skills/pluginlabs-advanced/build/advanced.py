"""PluginLabs Advanced komponent kataloğu (PLA-xxx) — TEK DOĞRULUK KAYNAĞI.
Kaynak: Pinterest 'Desktop Application' panosundaki masaüstü/uygulama arayüzlerinin bileşen analizi.
Buradan üretilir: KOMPONENTLER.md (Advanced bölümü), pl-components.json, pl-galeri.html.
ID'ler kalıcıdır; kaldırılan komponent durum="arsiv" olur.
"""
import math, random
from icons import I

A = []
def add(**k):
    k.setdefault("urun", None); k.setdefault("span", 1); k.setdefault("durum", "aktif")
    k.setdefault("durumlar", []); k.setdefault("a11y", ""); k.setdefault("yuzey", None); k.setdefault("tema", None)
    k.setdefault("kaynak", "")
    k["id"] = f"PLA-{len(A)+1:03d}"
    A.append(k)

# ---------------- yardımcı üreticiler (deterministik) ----------------
def _pts(vals, w=300, h=60, pad=4):
    n = len(vals); lo, hi = min(vals), max(vals); rng = (hi - lo) or 1
    return [(round(i * (w / (n - 1)), 1), round(h - pad - (v - lo) / rng * (h - 2 * pad), 1)) for i, v in enumerate(vals)]
def poly(vals, w=300, h=60):
    return " ".join(f"{x},{y}" for x, y in _pts(vals, w, h))
def smooth(vals, w=300, h=60):
    p = _pts(vals, w, h); d = f"M{p[0][0]},{p[0][1]}"
    for i in range(1, len(p)):
        x0, y0 = p[i-1]; x1, y1 = p[i]; cx = (x0 + x1) / 2
        d += f" C{cx},{y0} {cx},{y1} {x1},{y1}"
    return d
def area(vals, w=300, h=60):
    return smooth(vals, w, h) + f" L{w},{h} L0,{h} Z"
def ecg(seed, n=60, amp=1.0):
    r = random.Random(seed); out = []
    for i in range(n):
        base = 30 + r.uniform(-2, 2)
        if i % 15 == 7: base = 30 - 24 * amp
        elif i % 15 == 8: base = 30 + 14 * amp
        elif i % 15 == 6: base = 30 + 5 * amp
        out.append(round(base, 1))
    return " ".join(f"{round(i*300/(n-1),1)},{v}" for i, v in enumerate(out))
def bars(seed, n, lo=15, hi=95):
    r = random.Random(seed); return [r.randint(lo, hi) for _ in range(n)]

# =====================================================================
#  A. KABUK & PENCERE
# =====================================================================
K = "Kabuk & Pencere"
add(slug="app-window", ad="Uygulama Penceresi", kategori=K, span=2,
    kaynak="Pinler 5, 7, 11, 17, 18, 31, 39 — yuvarlak köşeli, yüzen masaüstü pencereleri",
    aciklama="Trafik ışıklı başlık çubuğu, 22px köşe ve derin gölgeli masaüstü penceresi; 'floating' varyantında iç panoların hepsi pencere içinde yüzer.",
    ne_zaman="Her masaüstü uygulamasının kök kabuğu; onboarding ve pazarlama görsellerinde cihaz çerçevesi.",
    durumlar=["odaklı", "odaksız (başlık soluk)", "floating"],
    siniflar="pl-window pl-window--floating pl-window__bar pl-window__lights pl-window__title pl-window__body",
    a11y="Pencere kontrolleri <button aria-label>; Windows'ta sağda pl-winctl kullanılır.",
    html=f'''<div class="pl-window" style="height:220px">
  <div class="pl-window__bar"><div class="pl-window__lights" aria-hidden="true"><i></i><i></i><i></i></div><div class="pl-window__title">Flow Dock — Çalışma Alanı</div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Paylaş">{I("share")}</button></div>
  <div class="pl-window__body"><div class="pl-rail" style="padding:12px 0"><button class="pl-rail__item is-active" aria-label="Ana sayfa">{I("home")}</button><button class="pl-rail__item" aria-label="Takvim">{I("calendar")}</button><button class="pl-rail__item" aria-label="Ayarlar">{I("settings")}</button></div>
  <div style="flex:1;padding:16px;display:grid;gap:10px;align-content:start"><div class="pl-skeleton" style="height:14px;width:40%"></div><div class="pl-skeleton" style="height:70px"></div><div class="pl-skeleton" style="height:14px;width:70%"></div></div></div>
</div>''')

add(slug="icon-rail", ad="İkon Rayı", kategori=K,
    kaynak="Pinler 5, 7, 14, 15, 18, 21, 26 — 72px dikey ikon gezinmesi",
    aciklama="72px genişlikte, logo karosu + ikon öğeleri + alt yardımcılar. Aktif öğe aksan zemini ve sol çizgiyle işaretlenir; hover'da etiket ipucu açılır.",
    ne_zaman="İçerik alanının maksimum olması gereken yoğun uygulamalar (kurgu, harita, komuta ekranı).",
    durumlar=["varsayılan", "hover (ipucu)", "aktif", "rozetli"],
    siniflar="pl-rail pl-rail__logo pl-rail__item is-active pl-rail__tip pl-rail__spacer",
    a11y="<nav aria-label>; her öğe aria-label + görünür ipucu; aktif öğe aria-current=\"page\".",
    html=f'''<nav class="pl-rail" aria-label="Ana gezinme" style="height:330px;border-radius:16px;border:1px solid var(--pl-line)">
  <span class="pl-rail__logo">PL</span>
  <button class="pl-rail__item is-active" aria-current="page" aria-label="Pano">{I("grid", 20)}<span class="pl-rail__tip">Pano</span></button>
  <button class="pl-rail__item" aria-label="Kitaplık">{I("film", 20)}<span class="pl-rail__tip">Kitaplık</span></button>
  <button class="pl-rail__item" aria-label="Bildirimler">{I("bell", 20)}<span class="pl-badge pl-badge--count">3</span><span class="pl-rail__tip">Bildirimler</span></button>
  <button class="pl-rail__item" aria-label="Harita">{I("map-pin", 20)}<span class="pl-rail__tip">Harita</span></button>
  <span class="pl-rail__spacer"></span>
  <button class="pl-rail__item" aria-label="Ayarlar">{I("settings", 20)}<span class="pl-rail__tip">Ayarlar</span></button>
</nav>''')

add(slug="pill-rail", ad="Yüzen Hap Ray", kategori=K,
    kaynak="Pin 33 — mor, tamamen yuvarlatılmış yüzen kenar çubuğu",
    aciklama="Aksan renginde dolu, köşeleri 28px hap ray. Aktif öğe yüzey renginde 'kesik' karo olarak öne çıkar.",
    ne_zaman="Açık temalı, samimi tüketici panelleri (fitness, sağlık, kişisel finans).",
    durumlar=["varsayılan", "hover", "aktif"],
    siniflar="pl-pillrail pl-pillrail__item is-active",
    a11y="Aksan zemininde ikon kontrastı ≥3:1 olmalı; --pl-fg-on-accent kullanılır.",
    html=f'''<nav class="pl-pillrail" aria-label="Gezinme" style="height:300px">
  <button class="pl-pillrail__item" aria-label="Ara">{I("sun", 20)}</button>
  <button class="pl-pillrail__item is-active" aria-current="page" aria-label="Ana sayfa">{I("home", 20)}</button>
  <button class="pl-pillrail__item" aria-label="Aktivite">{I("activity", 20)}</button>
  <button class="pl-pillrail__item" aria-label="Takvim">{I("calendar", 20)}</button>
  <button class="pl-pillrail__item" aria-label="Zaman">{I("timer", 20)}</button>
  <span style="flex:1"></span>
  <button class="pl-pillrail__item" aria-label="Çıkış">{I("power", 20)}</button>
</nav>''')

add(slug="pill-nav", ad="Hap Üst Gezinme", kategori=K,
    kaynak="Pin 39 — üst ortada siyah aktif haplı gezinme",
    aciklama="Kapsül içinde metin sekmeleri; aktif sekme ters renk (metin rengi zemin) ile vurgulanır.",
    ne_zaman="Üst düzey modüller arası geçiş (Pano · Kişiler · İşe Alım · Cihazlar…).",
    durumlar=["varsayılan", "hover", "aktif"],
    siniflar="pl-pillnav > a.is-active",
    a11y="<nav> içinde <a aria-current=\"page\">.",
    html='''<nav class="pl-pillnav" aria-label="Modüller"><a class="is-active" href="#" aria-current="page">Pano</a><a href="#">Kişiler</a><a href="#">İşe alım</a><a href="#">Cihazlar</a><a href="#">Uygulamalar</a><a href="#">Maaş</a></nav>''')

add(slug="glass-sidebar", ad="Cam Kenar Çubuğu", kategori=K, yuzey="glass",
    kaynak="Pin 27 — bulanık arka plan üzerinde buzlu cam gezinme",
    aciklama="Arkasındaki görseli bulanıklaştıran cam panel; marka, birincil gezinme ve 'Hesap' bölümü.",
    ne_zaman="Medya/eğlence uygulamaları, görsel ağırlıklı içerik üzerinde kalıcı gezinme.",
    durumlar=["varsayılan", "hover", "aktif"],
    siniflar="pl-glassnav pl-glass pl-glassnav__brand pl-glassnav__item is-active pl-glassnav__sec",
    a11y="Cam zeminde metin kontrastı arka plan en açık noktasına göre ölçülür; gerekirse --pl-glass-bg-strong.",
    html=f'''<div style="background:var(--pl-grad-aurora);padding:18px;border-radius:20px"><nav class="pl-glassnav pl-glass" aria-label="Kitaplık">
  <div class="pl-glassnav__brand">Cine<span style="color:var(--pl-accent)">.</span></div>
  <a class="pl-glassnav__item is-active" href="#" aria-current="page">{I("home")}Ana sayfa</a>
  <a class="pl-glassnav__item" href="#">{I("film")}Filmler</a>
  <a class="pl-glassnav__item" href="#">{I("tv")}Diziler</a>
  <a class="pl-glassnav__item" href="#">{I("heart")}Favoriler</a>
  <span class="pl-label pl-glassnav__sec">Hesap</span>
  <a class="pl-glassnav__item" href="#">{I("users")}Topluluk</a>
  <a class="pl-glassnav__item" href="#">{I("settings")}Ayarlar</a>
</nav></div>''')

add(slug="project-sidebar", ad="Proje Kenar Çubuğu", kategori=K,
    kaynak="Pin 11 — renkli proje ikonlu, sayaçlı, kullanıcı kartlı kenar çubuğu",
    aciklama="Genel gezinme + renk kodlu proje listesi + ekip bölümü + altta kullanıcı kartı.",
    ne_zaman="Görev, takvim, proje yönetimi uygulamaları.",
    durumlar=["varsayılan", "hover", "aktif"],
    siniflar="pl-projnav pl-projnav__item is-active pl-projnav__ic (--c) pl-projnav__count pl-projnav__sec pl-projnav__user",
    a11y="Proje rengi yalnız dekoratiftir; proje adı her zaman metin olarak görünür.",
    html=f'''<nav class="pl-projnav" aria-label="Projeler">
  <a class="pl-projnav__item" href="#">{I("grid")}Genel bakış</a>
  <a class="pl-projnav__item" href="#">{I("bar-chart")}Analiz</a>
  <a class="pl-projnav__item is-active" href="#" aria-current="page">{I("users")}Ekip<span class="pl-projnav__count">8</span></a>
  <div class="pl-projnav__sec"><span class="pl-label">Projeler</span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Proje ekle">{I("plus")}</button></div>
  <a class="pl-projnav__item" href="#"><span class="pl-projnav__ic" style="--c:var(--pl-viz-6)">{I("flame")}</span>Mutfak Atölyesi<span class="pl-projnav__count">12</span></a>
  <a class="pl-projnav__item" href="#"><span class="pl-projnav__ic" style="--c:var(--pl-viz-2)">{I("zap")}</span>Leo Helper<span class="pl-projnav__count">4</span></a>
  <a class="pl-projnav__item" href="#"><span class="pl-projnav__ic" style="--c:var(--pl-viz-8)">{I("cpu")}</span>Tweakster<span class="pl-projnav__count">7</span></a>
  <div class="pl-projnav__user"><span class="pl-avatar pl-avatar--accent is-online">MI</span><div style="flex:1;min-width:0"><b style="color:var(--pl-fg-1);font-size:13px">Muhammed</b><div class="pl-muted" style="font-size:11px">Yönetici</div></div>{I("chevron-down")}</div>
</nav>''')

add(slug="inspector", ad="Özellik Denetçisi", kategori=K,
    kaynak="Pin 22 — tasarım aracında sağ 'Design / Animation' özellik paneli",
    aciklama="Sekmeli denetçi: hizalama çubuğu, X/Y/G/Y alanları, metin, dolgu ve efekt bölümleri. Tüm alanlar mono değer gösterir.",
    ne_zaman="Editörler: tasarım, kurgu, düğüm, form oluşturucu.",
    durumlar=["varsayılan", "alan odakta", "karışık değer", "devre dışı"],
    siniflar="pl-inspector pl-inspector__tabs pl-inspector__sec pl-inspector__grid pl-propfield pl-propfield__sw pl-alignbar",
    a11y="Her pl-propfield bir <label> içerir (b etiketi görünür ad); sayısal alanlarda ok tuşu ile ±1, Shift ile ±10.",
    html=f'''<aside class="pl-inspector" aria-label="Özellikler" style="width:100%;border:1px solid var(--pl-line);border-radius:14px">
  <div class="pl-inspector__tabs"><button class="is-active">Tasarım</button><button>Animasyon</button></div>
  <div class="pl-inspector__sec"><div class="pl-alignbar">{"".join(f'<button aria-label="Hizala {n}"{" class=\"is-active\"" if n==2 else ""}>{I("minus")}</button>' for n in range(6))}</div>
  <div class="pl-inspector__grid"><label class="pl-propfield"><b>X</b><input value="240"></label><label class="pl-propfield"><b>Y</b><input value="96"></label><label class="pl-propfield"><b>G</b><input value="1080"></label><label class="pl-propfield"><b>Y</b><input value="1350"></label></div></div>
  <div class="pl-inspector__sec"><div class="pl-inspector__sechead">Metin {I("plus")}</div><label class="pl-propfield"><b>Aa</b><input value="Inter · Bold"></label><div class="pl-inspector__grid"><label class="pl-propfield"><b>pt</b><input value="48"></label><label class="pl-propfield"><b>↕</b><input value="%110"></label></div></div>
  <div class="pl-inspector__sec"><div class="pl-inspector__sechead">Dolgu {I("plus")}</div><label class="pl-propfield"><span class="pl-propfield__sw"></span><input value="7C6CFF"><b>%100</b></label></div>
</aside>''')

add(slug="view-tools", ad="Görüntüleyici Araç Kümesi", kategori=K,
    kaynak="Pinler 0, 1, 15 — 2D/3D geçişi, yakınlaştırma, döndürme düğmeleri",
    aciklama="Harita / 3B sahne / plan üzerinde yüzen dikey veya yatay araç kümesi. Cam zemin, aktif mod aksan dolgulu.",
    ne_zaman="Tuval, harita, kat planı, 3B model görüntüleyicileri.",
    durumlar=["varsayılan", "hover", "aktif mod", "yatay"],
    siniflar="pl-viewtools pl-viewtools--h button.is-active hr",
    a11y="role=\"toolbar\" + aria-orientation; mod düğmeleri aria-pressed.",
    html=f'''<div class="pl-row" style="gap:16px;align-items:flex-start"><div class="pl-viewtools" role="toolbar" aria-orientation="vertical" aria-label="Görünüm"><button aria-pressed="false">2D</button><button class="is-active" aria-pressed="true">3D</button><hr><button aria-label="Yakınlaştır">{I("zoom-in")}</button><button aria-label="Uzaklaştır">{I("zoom-out")}</button><button aria-label="Tam ekran">{I("maximize2")}</button></div>
<div class="pl-viewtools pl-viewtools--h" role="toolbar" aria-label="Sahne"><button aria-label="Seç" class="is-active">{I("pointer")}</button><button aria-label="Küp">{I("cube")}</button><hr><button aria-label="Geri al">{I("undo")}</button><button aria-label="Yinele">{I("redo")}</button></div></div>''')

add(slug="hud-frame", ad="HUD Çerçeve Paneli", kategori=K, yuzey="hud",
    kaynak="Pinler 10, 13, 16, 20, 43 — köşesi kesik, ızgaralı komuta paneli",
    aciklama="Kesik köşeli (clip-path) panel, ince ızgara dokusu, camgöbeği başlık şeridi ve köşe braketleri.",
    ne_zaman="Komuta merkezi, fabrika/IoT izleme, güvenlik ve sağlık görselleştirme ekranları.",
    durumlar=["normal", "uyarı (başlık amber)", "kritik (başlık kırmızı)"],
    siniflar="pl-hudframe pl-hudframe__title pl-hudframe__corner--tl|br",
    a11y="Dekoratif köşeler aria-hidden; başlık gerçek <h3> olarak da verilebilir.",
    html='''<section class="pl-hudframe" aria-label="Üretim durumu"><div class="pl-hudframe__title">Üretim Durumu <span>01.11.2026 · 21:40</span></div><i class="pl-hudframe__corner pl-hudframe__corner--tl" aria-hidden="true"></i><i class="pl-hudframe__corner pl-hudframe__corner--br" aria-hidden="true"></i>
<div class="pl-row" style="justify-content:space-between"><div><div class="pl-label">Aktif hat</div><div style="font-family:var(--pl-font-hud);font-size:34px;font-weight:700;color:var(--pl-fg-1)">12<span style="font-size:16px;color:var(--pl-fg-3)">/14</span></div></div><div><div class="pl-label">Verim</div><div style="font-family:var(--pl-font-hud);font-size:34px;font-weight:700;color:var(--pl-hud)">%96,4</div></div></div></section>''')

add(slug="status-bar", ad="Durum Çubuğu", kategori=K, span=2,
    kaynak="Pinler 17, 21 — editörlerin alt bilgi şeridi",
    aciklama="Pencerenin en altında 26px şerit: senkron, dal/proje, imleç konumu, kodlama, sürüm. Tamamen mono.",
    ne_zaman="Editörler ve uzun süre açık kalan masaüstü araçları.",
    durumlar=["normal", "senkronlanıyor", "hata (öğe kırmızı)"],
    siniflar="pl-statusbar pl-statusbar__item is-accent pl-statusbar__spacer",
    a11y="role=\"status\" + aria-live=\"polite\" yalnız değişen öğe için.",
    html=f'''<footer class="pl-statusbar" role="status" style="border:1px solid var(--pl-line);border-radius:8px"><span class="pl-statusbar__item is-accent">{I("refresh")}Senkron</span><span class="pl-statusbar__item">{I("git")}main</span><span class="pl-statusbar__item">{I("alert")}0 uyarı</span><span class="pl-statusbar__spacer"></span><span class="pl-statusbar__item">Sat 42, Süt 18</span><span class="pl-statusbar__item">UTF-8</span><span class="pl-statusbar__item">1080p · 30 FPS</span><span class="pl-statusbar__item">v2.0.0</span></footer>''')

# =====================================================================
#  B. MEDYA & EĞLENCE
# =====================================================================
K = "Medya & Eğlence"
add(slug="cine-hero", ad="Sinematik Kahraman", kategori=K, span=2,
    kaynak="Pin 2 — film detay kahramanı: kategori, büyük başlık, meta hapları, açıklama",
    aciklama="Tam genişlik sahne, soldan ve alttan karartma, büyük harfli başlık, yaş/kalite/yıl meta hapları ve CTA çifti.",
    ne_zaman="Medya kitaplığı vitrin alanı, ürün lansmanı, öne çıkan içerik.",
    durumlar=["varsayılan", "fragman oynatılıyor", "yükleniyor (iskelet)"],
    siniflar="pl-cinehero pl-cinehero__art pl-cinehero__body pl-cinehero__kicker pl-cinehero__title pl-cinehero__meta pl-chip--ghost pl-chip--mono",
    a11y="Görsel arka plan dekoratif (alt=\"\"); başlık <h2>; meta bilgisi düz metin.",
    html=f'''<section class="pl-cinehero"><div class="pl-cinehero__body">
  <span class="pl-cinehero__kicker"><span class="pl-dot"></span>PluginLabs Film</span>
  <h2 class="pl-cinehero__title">Gece Atölyesi</h2>
  <div class="pl-cinehero__meta"><span class="is-new">Yeni</span><span class="pl-chip pl-chip--ghost pl-chip--mono">2026</span><span class="pl-chip pl-chip--ghost pl-chip--mono">16+</span><span class="pl-chip pl-chip--ghost pl-chip--mono">1s 52dk</span><span class="pl-chip pl-chip--ghost pl-chip--mono">4K</span><span class="pl-chip pl-chip--ghost pl-chip--mono">5.1</span></div>
  <p class="pl-cinehero__desc">Bir grup geliştiricinin tek gecede kendi araç ailesini kurmasını anlatan belgesel.</p>
  <div class="pl-row"><button class="pl-btn pl-btn--primary pl-btn--lg">{I("play")}İzle</button><button class="pl-btn pl-btn--secondary pl-btn--lg">{I("plus")}Listeme ekle</button></div>
</div></section>''')

add(slug="poster-card", ad="Poster Kartı", kategori=K,
    kaynak="Pin 2 — 'Recently Added' şeritli dikey posterler",
    aciklama="2:3 poster, alt karartma, büyük harfli başlık; isteğe bağlı aksan şerit ('Yeni eklendi') ve köşe etiketi.",
    ne_zaman="Medya rafları, şablon galerileri, uygulama kataloğu kapakları.",
    durumlar=["varsayılan", "hover (yüksel + aksan halkası)", "şeritli", "etiketli"],
    siniflar="pl-poster pl-poster--wide pl-poster__title pl-poster__ribbon pl-poster__tag pl-media--2..6",
    a11y="<a> öğesi; şerit metni ekran okuyucuya başlıktan sonra okunur.",
    html='''<div class="pl-row" style="gap:12px"><a class="pl-poster" href="#"><span class="pl-poster__tag pl-chip pl-chip--accent pl-chip--mono">TOP 10</span><span class="pl-poster__title">Kod Gecesi</span><span class="pl-poster__ribbon">Yeni eklendi</span></a>
<a class="pl-poster pl-media--2" href="#" style="background:var(--pl-media-2)"><span class="pl-poster__title">Derin Mavi</span></a></div>''')

add(slug="poster-shelf", ad="Poster Rafı", kategori=K, span=2,
    kaynak="Pinler 2, 5, 27 — 'Only on…', 'Movies', 'Games with discounts' rafları",
    aciklama="Başlık + 'Tümünü gör' + ok düğmeleri ile yatay kaydırılan raf; scroll-snap ile poster hizalama.",
    ne_zaman="Kategori rafları, son görüntülenenler, öneriler.",
    durumlar=["varsayılan", "başta (sol ok pasif)", "sonda (sağ ok pasif)"],
    siniflar="pl-shelf pl-shelf__head pl-shelf__title pl-scroll-x pl-poster",
    a11y="Raf <section aria-labelledby>; oklar aria-controls ile rafı gösterir; klavyede Tab posterler arası gezer.",
    html=f'''<section class="pl-shelf" aria-labelledby="raf1"><div class="pl-shelf__head"><h3 class="pl-shelf__title" id="raf1">Yalnız PluginLabs'ta</h3><a class="pl-link" href="#">Tümünü gör</a><button class="pl-iconbtn pl-iconbtn--outline pl-iconbtn--sm" aria-label="Önceki" disabled>{I("chevron-left")}</button><button class="pl-iconbtn pl-iconbtn--outline pl-iconbtn--sm" aria-label="Sonraki">{I("chevron-right")}</button></div>
<div class="pl-scroll-x">{"".join(f'<a class="pl-poster" href="#" style="background:var(--pl-media-{(i%6)+1})"><span class="pl-poster__title">{t}</span>{"<span class=pl-poster__ribbon>Yeni eklendi</span>" if i in (0,3) else ""}</a>' for i,t in enumerate(["Kod Gecesi","Derin Mavi","Kırmızı Hat","Yeşil Işık","Altın Saat","Gece Yarısı","Kuzey"]))}</div></section>''')

add(slug="resume-card", ad="İzlemeye Devam Kartı", kategori=K,
    kaynak="Pin 2 — 'Continue watching' satırı",
    aciklama="16:9 küçük resim, ortada oynat düğmesi, altta ilerleme çizgisi ve başlık.",
    ne_zaman="Kaldığın yerden devam: video, kurs, belge, kurgu projesi.",
    durumlar=["varsayılan", "hover", "tamamlandı (çubuk dolu + onay)"],
    siniflar="pl-resume pl-resume__thumb pl-resume__play pl-resume__bar (--pl-val) pl-resume__title",
    a11y="İlerleme metin olarak da verilir: \"%62 izlendi\".",
    html=f'''<a class="pl-resume" href="#" style="text-decoration:none"><div class="pl-resume__thumb"><span class="pl-resume__play">{I("play")}</span><div class="pl-resume__bar" style="--pl-val:62%"><span></span></div></div><div class="pl-resume__title">Bölüm 3 · Komut paleti</div><div class="pl-muted" style="font-size:11px">%62 izlendi · 18 dk kaldı</div></a>''')

add(slug="deal-card", ad="Mağaza İndirim Kartı", kategori=K,
    kaynak="Pin 5 — 'Games with discounts' kartları",
    aciklama="Kapak, platform etiketi, ad, yüzde indirim rozeti, eski (üstü çizili) ve yeni fiyat.",
    ne_zaman="Mağaza, eklenti pazarı, abonelik kampanyaları.",
    durumlar=["varsayılan", "indirimde", "sahip olunan (Kuruldu rozeti)"],
    siniflar="pl-deal pl-deal__art pl-deal__plat pl-deal__name pl-deal__price pl-deal__off pl-deal__old pl-deal__now",
    a11y="Eski fiyat <s> ile; \"%40 indirim, 1.249,90 ₺ yerine 749,90 ₺\" ekran okuyucu metni.",
    html='''<div class="pl-row" style="gap:12px;align-items:flex-start"><article class="pl-deal"><div class="pl-deal__art"></div><span class="pl-deal__plat">Masaüstü</span><span class="pl-deal__name">Tweakster Pro</span><div class="pl-deal__price"><span class="pl-deal__off">-%40</span><s class="pl-deal__old">1.249,90 ₺</s><span class="pl-deal__now">749,90 ₺</span></div></article>
<article class="pl-deal"><div class="pl-deal__art" style="background:var(--pl-media-6)"></div><span class="pl-deal__plat">Eklenti</span><span class="pl-deal__name">Leo Helper</span><div class="pl-deal__price"><span class="pl-deal__off">-%25</span><s class="pl-deal__old">399,90 ₺</s><span class="pl-deal__now">299,90 ₺</span></div></article></div>''')

add(slug="stack-carousel", ad="Öne Çıkan Yığın Karusel", kategori=K, span=2,
    kaynak="Pin 5 — ortada büyük, yanlarda perspektifli küçülen kapaklar",
    aciklama="Merkez kart öne çıkar, yan kartlar 3B perspektifle küçülür ve kararır; merkezde ön sipariş CTA'sı.",
    ne_zaman="Mağaza vitrini, sürüm lansmanı, şablon seçici.",
    durumlar=["merkez", "geçiş animasyonu"],
    siniflar="pl-stack3d pl-stack3d__card is-center",
    a11y="role=\"region\" aria-roledescription=\"karusel\"; ok tuşları ile geçiş; otomatik oynatma yok.",
    html=f'''<div class="pl-stack3d" role="region" aria-roledescription="karusel" aria-label="Öne çıkanlar"><div class="pl-stack3d__card"></div><div class="pl-stack3d__card"></div><div class="pl-stack3d__card is-center"><span class="pl-chip pl-chip--ghost pl-chip--mono" style="width:max-content">YENİ SÜRÜM</span><b style="font-size:22px;color:var(--pl-on-media);line-height:1.05;text-transform:uppercase;font-weight:800">Mind Palace 2</b><div class="pl-row"><button class="pl-btn pl-btn--primary pl-btn--sm">Ön sipariş</button><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Fragman">{I("play")}</button></div></div><div class="pl-stack3d__card"></div><div class="pl-stack3d__card"></div></div>''')

add(slug="trend-card", ad="Trend Kartı", kategori=K,
    kaynak="Pin 7 — 'Trending games' kartları ve istatistik satırı",
    aciklama="Kenarlıklı kart içinde 3:4 kapak; altında beğeni / görüntülenme / yorum mono sayaçları.",
    ne_zaman="Topluluk içerikleri, popüler şablonlar, eklenti trendleri.",
    durumlar=["varsayılan", "hover", "beğenildi"],
    siniflar="pl-trend pl-trend__art pl-trend__row",
    a11y="Sayaçlar \"1,2 B beğeni\" şeklinde aria-label taşır.",
    html=f'''<div class="pl-row" style="gap:10px"><article class="pl-trend"><div class="pl-trend__art"></div><div class="pl-trend__row"><span>{I("heart")}4,2B</span><span>{I("eye")}18B</span><span>{I("message")}312</span></div></article><article class="pl-trend"><div class="pl-trend__art" style="background:var(--pl-media-3)"></div><div class="pl-trend__row"><span>{I("heart")}2,9B</span><span>{I("eye")}11B</span><span>{I("message")}96</span></div></article></div>''')

add(slug="promo-banner", ad="Kampanya Afişi", kategori=K, span=2,
    kaynak="Pin 7 — '50% OFF' kampanya bandı ve CTA çifti",
    aciklama="Büyük başlık + yüzde rozeti + açıklama + birincil/ikincil CTA; sağda kahraman görsel alanı, arkada aksan ışıması.",
    ne_zaman="Pro'ya geçiş, sezon kampanyası, yeni ürün duyurusu.",
    durumlar=["varsayılan", "kapatılabilir"],
    siniflar="pl-promo pl-promo__title pl-promo__off pl-promo__art",
    a11y="Kapat düğmesi aria-label=\"Kampanyayı gizle\"; kampanya bitiş tarihi metinle.",
    html=f'''<section class="pl-promo"><div class="pl-stack" style="gap:10px;max-width:420px"><h3 class="pl-promo__title">Flow Dock Pro <span class="pl-promo__off">%50 İNDİRİM</span></h3><p class="pl-muted" style="margin:0">Sınırsız dock, iş akışı otomasyonu ve senkron. Kampanya 30.11.2026'da biter.</p><div class="pl-row"><button class="pl-btn pl-btn--primary">Satın al</button><button class="pl-btn pl-btn--secondary">{I("cart")}Sepete ekle</button></div></div><div class="pl-promo__art" aria-hidden="true"></div></section>''')

add(slug="mini-player", ad="Mini Oynatıcı", kategori=K,
    kaynak="Pinler 6, 21 — 'Music system' kartı ve kurgu önizleme kontrolleri",
    aciklama="Kapak + başlık/sanatçı + önceki/oynat/sonraki + konum çubuğu ve zaman kodu.",
    ne_zaman="Akıllı ev ses sistemi, odak müziği, sesli not oynatma.",
    durumlar=["çalıyor", "duraklatıldı", "arabelleğe alıyor"],
    siniflar="pl-player pl-player__art pl-player__title pl-player__sub pl-player__ctl pl-player__btn--main pl-player__seek",
    a11y="Oynat düğmesi aria-pressed; konum çubuğu role=\"slider\" + aria-valuetext=\"1:24 / 3:40\".",
    html=f'''<div class="pl-player"><div class="pl-player__art" aria-hidden="true"></div><div style="min-width:0"><div class="pl-player__title">Gece Atölyesi — Odak</div><div class="pl-player__sub">Lo-fi · Salon hoparlörü</div></div><div class="pl-player__ctl"><button class="pl-player__btn" aria-label="Önceki">{I("skip-back")}</button><button class="pl-player__btn pl-player__btn--main" aria-label="Duraklat" aria-pressed="true">{I("pause")}</button><button class="pl-player__btn" aria-label="Sonraki">{I("skip-forward")}</button></div><div class="pl-player__seek"><span>1:24</span><div class="pl-progress" role="slider" aria-valuenow="38" aria-valuetext="1:24 / 3:40"><span style="--pl-val:38%"></span></div><span>3:40</span></div></div>''')

add(slug="island-player", ad="Dinamik Ada Oynatıcı", kategori=K,
    kaynak="Pin 37 — genişletilmiş müzik oynatıcı adası",
    aciklama="Siyah kapsül; kapak, başlık, ekolayzer animasyonu, konum çubuğu ve üç büyük kontrol.",
    ne_zaman="Masaüstü 'şimdi çalıyor' yüzen kontrolü, Flow Dock medya modülü.",
    durumlar=["kompakt", "genişletilmiş", "duraklatıldı (ekolayzer durur)"],
    siniflar="pl-island pl-island__top pl-island__art pl-island__eq pl-island__ctl",
    a11y="Ekolayzer aria-hidden; prefers-reduced-motion'da animasyon durur.",
    html=f'''<div class="pl-island"><div class="pl-island__top"><div class="pl-island__art"></div><div><b style="display:block">Kuzey Işıkları</b><span class="pl-muted">Atlas Ekibi</span></div><div class="pl-island__eq" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div><div class="pl-player__seek" style="display:grid"><span>2:35</span><div class="pl-progress"><span style="--pl-val:56%"></span></div><span>-2:02</span></div><div class="pl-island__ctl"><button aria-label="Önceki">{I("rewind", 24)}</button><button aria-label="Duraklat">{I("pause", 24)}</button><button aria-label="Sonraki">{I("skip-forward", 24)}</button></div></div>''')

# =====================================================================
#  C. CANLI VERİ & SPOR
# =====================================================================
K = "Canlı Veri & Spor"
add(slug="live-score", ad="Canlı Maç Skor Kartı", kategori=K, yuzey="neon",
    kaynak="Pin 4 — canlı turnuva skor kartı",
    aciklama="CANLI göstergesi, iki takım arması, büyük mono skor, dakika ve hakimiyet çubuğu.",
    ne_zaman="Canlı skor, turnuva, yarışma ve gerçek zamanlı karşılaştırma panelleri.",
    durumlar=["canlı", "devre arası", "bitti", "başlamadı (saat gösterir)"],
    siniflar="pl-score pl-score__head pl-score__live pl-dot--live pl-score__teams pl-score__crest pl-score__vs pl-score__bar",
    a11y="Skor değişimi aria-live=\"polite\" ile duyurulur; CANLI yalnız renk değil metindir.",
    html='''<article class="pl-score"><div class="pl-score__head"><span class="pl-score__live"><span class="pl-dot pl-dot--live"></span>CANLI</span><span>Kış Ligi · Final</span><span style="margin-left:auto" class="pl-num">2. harita</span></div>
<div class="pl-score__teams" aria-live="polite"><div class="pl-score__team"><span class="pl-score__crest">AX</span>Atlas X</div><div class="pl-score__vs">2 : 1<small>34:12</small></div><div class="pl-score__team"><span class="pl-score__crest">NV</span>Nova</div></div>
<div class="pl-score__bar" aria-label="Hakimiyet %64'e %36"><span style="flex:64"></span><span style="flex:36"></span></div></article>''')

add(slug="match-row", ad="Maç Satırı + Oran Çipleri", kategori=K, yuzey="neon", span=2,
    kaynak="Pin 4 — maç listesi ve 1/X/2 oran düğmeleri",
    aciklama="Lig ikonu, iki takım, skor ve seçilebilir oran düğmeleri; seçili oran aksan dolgulu.",
    ne_zaman="Fikstür listeleri, karşılaştırmalı seçim satırları, A/B seçenek listeleri.",
    durumlar=["varsayılan", "oran seçili", "kilitli (devre dışı)"],
    siniflar="pl-matchrow pl-matchrow__teams pl-matchrow__score pl-odds button.is-active",
    a11y="Oran grubu role=\"radiogroup\"; her düğme role=\"radio\" + aria-checked.",
    html=f'''<div><div class="pl-matchrow"><span class="pl-avatar pl-avatar--sm">{I("trophy")}</span><div class="pl-matchrow__teams"><span>Atlas X</span><span>Nova</span></div><div class="pl-matchrow__score"><span>17</span><span>6</span></div><div class="pl-odds" role="radiogroup" aria-label="Oranlar"><button role="radio" aria-checked="true" class="is-active"><small>1</small>1,40</button><button role="radio" aria-checked="false"><small>X</small>3,10</button><button role="radio" aria-checked="false"><small>2</small>2,85</button></div></div>
<div class="pl-matchrow"><span class="pl-avatar pl-avatar--sm">{I("trophy")}</span><div class="pl-matchrow__teams"><span>Kuzey Kurtları</span><span>Lima</span></div><div class="pl-matchrow__score"><span>4</span><span>23</span></div><div class="pl-odds" role="radiogroup" aria-label="Oranlar"><button role="radio" aria-checked="false"><small>1</small>4,20</button><button role="radio" aria-checked="false"><small>X</small>3,60</button><button role="radio" aria-checked="false"><small>2</small>1,25</button></div></div></div>''')

add(slug="neon-card", ad="Neon Vurgu Kartı", kategori=K, yuzey="neon",
    kaynak="Pin 4 — limon yeşili 'Global Highlights' kartı",
    aciklama="Tamamen aksan dolgulu, köşede yarı saydam daire; tek bir kritik değeri öne çıkarır.",
    ne_zaman="Ekrandaki en önemli tek metrik (günün öne çıkanı). Ekranda en fazla bir tane.",
    durumlar=["varsayılan"],
    siniflar="pl-neoncard pl-neoncard__val",
    a11y="Aksan zemin + --pl-fg-on-accent metin kontrastı ≥4.5:1.",
    html='''<div class="pl-neoncard" style="max-width:240px"><span class="pl-label">Günün öne çıkanı</span><b>Atlas X · Nova</b><span class="pl-neoncard__val">54,4B izleyici</span><span style="font-size:12px;opacity:.75">Son 10 dk'da %18 artış</span></div>''')

add(slug="live-ticker", ad="Canlı Akış Bandı", kategori=K, span=2,
    kaynak="Pinler 4, 13 — kayan skor / olay bandı",
    aciklama="Solda CANLI etiketi, sağda sürekli kayan olay akışı; üzerine gelince durur.",
    ne_zaman="Canlı olay akışı, sistem duyuruları, borsa/kur bandı.",
    durumlar=["akıyor", "duraklatıldı (hover)", "azaltılmış hareket (statik)"],
    siniflar="pl-ticker pl-ticker__label pl-ticker__track",
    a11y="Akış aria-hidden; aynı veri erişilebilir bir listede de sunulur. prefers-reduced-motion'da animasyon kapanır.",
    html='''<div class="pl-ticker"><span class="pl-ticker__label"><span class="pl-dot pl-dot--live"></span>CANLI</span><div class="pl-ticker__track" aria-hidden="true"><span>Atlas X <b>2–1</b> Nova</span><span>Kuzey <b>0–0</b> Lima</span><span>Leo Helper <b>v2.4</b> yayında</span><span>Kur <b>1 € = 37,82 ₺</b></span><span>Atlas X <b>2–1</b> Nova</span><span>Kuzey <b>0–0</b> Lima</span><span>Leo Helper <b>v2.4</b> yayında</span><span>Kur <b>1 € = 37,82 ₺</b></span></div></div>''')
