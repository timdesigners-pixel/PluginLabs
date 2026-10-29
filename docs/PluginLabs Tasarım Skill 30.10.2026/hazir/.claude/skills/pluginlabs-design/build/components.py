"""PluginLabs komponent kataloğu — TEK DOĞRULUK KAYNAĞI.
Buradan üretilir: references/KOMPONENTLER.md, assets/pl-components.json, assets/pl-galeri.html
Yeni komponent = bu listeye yeni sözlük. ID'ler kalıcıdır, kaldırılan komponent durum="arsiv" olur.
"""
from icons import I

C = []
def add(**k):
    k.setdefault("urun", None); k.setdefault("span", 1); k.setdefault("durum", "aktif")
    k.setdefault("durumlar", []); k.setdefault("a11y", "")
    k["id"] = f"PLC-{len(C)+1:03d}"
    C.append(k)

# ======================= TEMEL =======================
add(slug="button", ad="Buton", kategori="Temel",
    aciklama="Birincil eylem tetikleyicisi. Beş varyant, üç boyut.",
    ne_zaman="Ekranda tek bir birincil buton olur; diğerleri secondary/ghost.",
    durumlar=["varsayılan", "hover", "odak", "basılı", "devre dışı", "yükleniyor"],
    siniflar="pl-btn pl-btn--primary|secondary|ghost|danger|gradient pl-btn--sm|lg pl-btn--block is-loading",
    a11y="<button> kullan; yalnız ikonlu ise aria-label zorunlu. Yükleniyorken aria-busy=\"true\".",
    span=2,
    html=f'''<div class="pl-row">
  <button class="pl-btn pl-btn--primary">{I("download")}Kur</button>
  <button class="pl-btn pl-btn--secondary">Ayrıntılar</button>
  <button class="pl-btn pl-btn--ghost">Vazgeç</button>
  <button class="pl-btn pl-btn--danger">{I("archive")}Arşivle</button>
  <button class="pl-btn pl-btn--gradient">{I("crown")}Pro'ya geç</button>
</div>
<div class="pl-row" style="margin-top:12px">
  <button class="pl-btn pl-btn--primary pl-btn--sm">Küçük</button>
  <button class="pl-btn pl-btn--primary pl-btn--lg">Büyük</button>
  <button class="pl-btn pl-btn--primary is-loading" aria-busy="true">Kuruluyor</button>
  <button class="pl-btn pl-btn--secondary" disabled>Devre dışı</button>
</div>''')

add(slug="icon-button", ad="İkon Buton", kategori="Temel",
    aciklama="Araç çubukları ve satır eylemleri için kare buton.",
    ne_zaman="Eylemin anlamı ikonla evrensel olarak anlaşılıyorsa (ayarlar, kapat, daha fazla).",
    durumlar=["varsayılan", "hover", "aktif (is-active)", "outline"],
    siniflar="pl-iconbtn pl-iconbtn--outline pl-iconbtn--sm is-active",
    a11y="aria-label ve title zorunlu; toggle ise aria-pressed.",
    html=f'''<div class="pl-row">
  <button class="pl-iconbtn" aria-label="Ara">{I("search")}</button>
  <button class="pl-iconbtn is-active" aria-label="Sabitle" aria-pressed="true">{I("pin")}</button>
  <button class="pl-iconbtn pl-iconbtn--outline" aria-label="Ayarlar">{I("settings")}</button>
  <button class="pl-iconbtn pl-iconbtn--outline" aria-label="Daha fazla">{I("more")}</button>
  <button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kapat">{I("x")}</button>
</div>''')

add(slug="segmented", ad="Segment Kontrol", kategori="Temel",
    aciklama="2–5 karşılıklı dışlayan görünüm/filtre arasında geçiş.",
    ne_zaman="Görünüm modu (ızgara/liste), zaman aralığı, kapsam seçimi.",
    durumlar=["seçili", "hover"],
    siniflar="pl-segment > button.is-active",
    a11y="role=\"tablist\" + role=\"tab\" + aria-selected; ok tuşlarıyla gezinme.",
    html=f'''<div class="pl-segment" role="tablist">
  <button class="is-active" role="tab" aria-selected="true">{I("grid")}Izgara</button>
  <button role="tab">{I("layers")}Liste</button>
  <button role="tab">Tablo</button>
</div>''')

add(slug="split-button", ad="Bölünmüş Buton", kategori="Temel",
    aciklama="Varsayılan eylem + açılır alternatifler.",
    ne_zaman="'Kur' varsayılan, 'Belirli sürümü kur' gibi alternatifler varsa.",
    durumlar=["varsayılan", "menü açık"],
    siniflar="pl-split > .pl-btn + .pl-btn",
    a11y="Ok butonu aria-haspopup=\"menu\" ve aria-expanded taşır.",
    html=f'''<div class="pl-split">
  <button class="pl-btn pl-btn--primary">{I("download")}Tümünü güncelle</button>
  <button class="pl-btn pl-btn--primary" aria-label="Diğer seçenekler" aria-haspopup="menu">{I("chevron-down")}</button>
</div>''')

add(slug="link", ad="Bağlantı", kategori="Temel",
    aciklama="Metin içi gezinme ve ikincil eylem.",
    ne_zaman="Sayfa değiştiren eylemler; buton yerine metin akışında.",
    durumlar=["varsayılan", "hover (alt çizgi)"],
    siniflar="pl-link",
    a11y="Dış bağlantılarda ikon + rel=\"noopener\"; yalnız 'buraya tıkla' metni yasak.",
    html=f'''<p style="margin:0">Sürüm notlarını <a class="pl-link" href="#">değişiklik günlüğünde</a> bulabilirsiniz. <a class="pl-link" href="#">GitHub {I("external")}</a></p>''')

add(slug="badge", ad="Rozet", kategori="Temel",
    aciklama="Kısa meta bilgi: sürüm, durum, sayı, Pro.",
    ne_zaman="Bir öğenin niteliğini 1–2 kelimeyle işaretlemek için.",
    durumlar=["nötr", "accent", "success", "warning", "danger", "info", "pro", "count"],
    siniflar="pl-badge pl-badge--accent|success|warning|danger|info|pro|count",
    a11y="Sayaç rozetlerinde görünmez metin: <span class=\"sr-only\">3 bildirim</span>.",
    span=2,
    html='''<div class="pl-row">
  <span class="pl-badge">v2.4.1</span><span class="pl-badge pl-badge--accent">Yeni</span>
  <span class="pl-badge pl-badge--success">Kurulu</span><span class="pl-badge pl-badge--warning">Güncelleme</span>
  <span class="pl-badge pl-badge--danger">Hata</span><span class="pl-badge pl-badge--info">Beta</span>
  <span class="pl-badge pl-badge--pro">Pro</span><span class="pl-badge pl-badge--count">12</span>
</div>''')

add(slug="status-pill", ad="Durum Pili", kategori="Temel",
    aciklama="Canlı bağlantı/senkron durumu; nokta + metin.",
    ne_zaman="Telegram bağlantısı, MyMind sunucu durumu, senkron gibi sürekli durumlar.",
    durumlar=["online", "syncing (nabız)", "warning", "error", "offline"],
    siniflar="pl-status pl-status--online|syncing|warning|error",
    a11y="Renk tek başına değil, metin her zaman yazılır; değişince aria-live=\"polite\".",
    html='''<div class="pl-row">
  <span class="pl-status pl-status--online">Bağlı</span>
  <span class="pl-status pl-status--syncing">Eşitleniyor</span>
  <span class="pl-status pl-status--warning">Kota %90</span>
  <span class="pl-status pl-status--error">Bağlantı koptu</span>
  <span class="pl-status">Çevrimdışı</span>
</div>''')

add(slug="tag", ad="Etiket / Chip", kategori="Temel",
    aciklama="Filtre, kategori ve kullanıcı etiketleri; kaldırılabilir.",
    ne_zaman="Çoklu seçim filtreleri, not etiketleri, arama kapsamları.",
    durumlar=["varsayılan", "seçili", "kaldırılabilir"],
    siniflar="pl-tag pl-tag.is-selected > button",
    a11y="Kaldır butonu aria-label=\"<etiket> etiketini kaldır\".",
    html=f'''<div class="pl-row">
  <span class="pl-tag is-selected">Tarayıcı eklentisi<button aria-label="Kaldır">{I("x")}</button></span>
  <span class="pl-tag">Masaüstü<button aria-label="Kaldır">{I("x")}</button></span>
  <span class="pl-tag">AI<button aria-label="Kaldır">{I("x")}</button></span>
</div>''')

add(slug="avatar", ad="Avatar", kategori="Temel",
    aciklama="Kullanıcı ya da kanal kimliği; baş harf veya görsel.",
    ne_zaman="Hesap menüsü, Telegram kanal listesi, yorumlar.",
    durumlar=["sm", "md", "lg", "accent", "çevrimiçi"],
    siniflar="pl-avatar pl-avatar--sm|lg pl-avatar--accent is-online",
    a11y="Görselde alt, baş harfte aria-label ile tam ad.",
    html='''<div class="pl-row">
  <span class="pl-avatar pl-avatar--sm">MI</span>
  <span class="pl-avatar is-online" aria-label="Muhammed Ilgaz">MI</span>
  <span class="pl-avatar pl-avatar--accent">PL</span>
  <span class="pl-avatar pl-avatar--lg pl-avatar--accent is-online">LH</span>
</div>''')

add(slug="avatar-group", ad="Avatar Grubu", kategori="Temel",
    aciklama="Üst üste binen avatarlar + fazlalık sayacı.",
    ne_zaman="Paylaşılan pano, takip edilen kanallar, ortak çalışanlar.",
    siniflar="pl-avatars > .pl-avatar",
    a11y="Grup için aria-label=\"5 kişi\".",
    html='''<div class="pl-avatars" aria-label="5 kanal">
  <span class="pl-avatar pl-avatar--accent">TG</span><span class="pl-avatar">KD</span>
  <span class="pl-avatar">FX</span><span class="pl-avatar">+2</span>
</div>''')

add(slug="kbd", ad="Klavye Kısayolu", kategori="Temel",
    aciklama="Kısayol tuşlarının gösterimi.",
    ne_zaman="Menülerde, tooltiplerde, komut paletinde, arama kutusunda.",
    siniflar="pl-kbd",
    a11y="<kbd> elementi kullanılabilir; Windows'ta Ctrl, macOS'ta ⌘ gösterilir.",
    html='''<div class="pl-row"><span class="pl-kbd">Ctrl</span><span class="pl-kbd">K</span>
<span class="pl-muted">·</span><span class="pl-kbd">⇧</span><span class="pl-kbd">⌘</span><span class="pl-kbd">P</span>
<span class="pl-muted">·</span><span class="pl-kbd">Esc</span></div>''')

add(slug="divider", ad="Ayraç", kategori="Temel",
    aciklama="Bölümleri ayıran ince çizgi, etiketli varyant.",
    ne_zaman="Liste grupları, 'veya' ayrımı, form bölümleri.",
    siniflar="pl-divider pl-divider--label",
    a11y="Dekoratifse role=\"none\"; anlamlıysa <hr>.",
    html='''<div><span class="pl-muted">Üst içerik</span><hr class="pl-divider">
<div class="pl-divider pl-divider--label"><span class="pl-label">veya</span></div></div>''')

add(slug="spinner", ad="Yükleniyor Göstergesi", kategori="Temel",
    aciklama="Belirsiz süreli bekleme.",
    ne_zaman="<1 sn'den uzun, süresi bilinmeyen işlemler; buton içinde is-loading tercih edilir.",
    siniflar="pl-spinner pl-spinner--lg",
    a11y="role=\"status\" + aria-label=\"Yükleniyor\".",
    html='''<div class="pl-row"><span class="pl-spinner" role="status" aria-label="Yükleniyor"></span>
<span class="pl-spinner pl-spinner--lg"></span><span class="pl-muted">MyMind düşünüyor…</span></div>''')

add(slug="skeleton", ad="İskelet", kategori="Temel",
    aciklama="İçerik yerleşimini önceden gösteren yükleme yer tutucusu.",
    ne_zaman="Liste/kart yüklemelerinde, 300 ms'den uzun beklemelerde.",
    siniflar="pl-skeleton",
    a11y="Kapsayıcıya aria-busy=\"true\"; iskelet öğeleri aria-hidden.",
    html='''<div class="pl-row" style="flex-wrap:nowrap;align-items:flex-start" aria-busy="true">
  <div class="pl-skeleton" style="width:40px;height:40px;border-radius:10px;flex:none"></div>
  <div class="pl-stack" style="flex:1;gap:8px"><div class="pl-skeleton" style="height:12px;width:60%"></div>
  <div class="pl-skeleton" style="height:10px;width:90%"></div><div class="pl-skeleton" style="height:10px;width:75%"></div></div>
</div>''')

add(slug="tooltip", ad="İpucu (Tooltip)", kategori="Temel",
    aciklama="Kısa açıklama veya kısayol bilgisi.",
    ne_zaman="İkon butonlarda, kısaltılmış metinlerde. Asla kritik bilgi taşımaz.",
    siniflar="pl-tooltip",
    a11y="role=\"tooltip\" + tetikleyicide aria-describedby; odakla da açılır, Esc kapatır.",
    html='''<div style="padding-top:4px"><span class="pl-tooltip" role="tooltip">Sabitle <span class="pl-kbd" style="height:16px;margin-left:4px">P</span></span></div>''')

# ======================= FORM =======================
add(slug="text-input", ad="Metin Girişi", kategori="Form",
    aciklama="Tek satır metin girişi; ikonlu varyant.",
    ne_zaman="Ad, URL, API anahtarı, arama dışı serbest metin.",
    durumlar=["varsayılan", "hover", "odak", "hata", "devre dışı"],
    siniflar="pl-input pl-inputwrap",
    a11y="Her zaman <label>; placeholder etiketin yerine geçmez.",
    html=f'''<div class="pl-stack">
  <input class="pl-input" placeholder="Telegram kanal bağlantısı">
  <div class="pl-inputwrap">{I("link")}<input class="pl-input" value="https://t.me/indirimler"></div>
</div>''')

add(slug="search-input", ad="Arama Kutusu", kategori="Form",
    aciklama="İkon + kısayol ipuçlu arama alanı.",
    ne_zaman="Liste filtreleme, katalog araması; global arama için Komut Paleti.",
    siniflar="pl-inputwrap > .pl-ico + .pl-input + .pl-kbd",
    a11y="type=\"search\" ve role=\"searchbox\"; sonuç sayısı aria-live ile duyurulur.",
    html=f'''<div class="pl-inputwrap">{I("search")}<input class="pl-input" type="search" placeholder="Uygulama veya eklenti ara"><span class="pl-kbd">/</span></div>''')

add(slug="textarea", ad="Çok Satırlı Metin", kategori="Form",
    aciklama="Uzun metin girişi, dikey boyutlanabilir.",
    ne_zaman="Not, açıklama, prompt şablonu.",
    siniflar="pl-textarea",
    a11y="Karakter sınırı varsa sayaç aria-live ile.",
    html='''<textarea class="pl-textarea" placeholder="Bu eklentinin ne yapmasını istiyorsunuz?"></textarea>''')

add(slug="select", ad="Seçim Kutusu", kategori="Form",
    aciklama="Native <select> üzerine token tabanlı stil.",
    ne_zaman="5+ seçenekli tekli seçim; 2–4 seçenek için Segment veya Radyo.",
    siniflar="pl-select",
    a11y="Native select klavye ve ekran okuyucu uyumludur; özel dropdown yazma.",
    html='''<select class="pl-select"><option>Varsayılan model: MyMind Pro</option><option>Gemini Pro</option><option>Yerel — Ollama</option><option>Yerel — LM Studio</option></select>''')

add(slug="checkbox", ad="Onay Kutusu", kategori="Form",
    aciklama="Bağımsız çoklu seçim; belirsiz (indeterminate) durumu destekler.",
    ne_zaman="Listelerde toplu seçim, izin onayı, birden fazla seçenek.",
    durumlar=["boş", "seçili", "belirsiz", "devre dışı"],
    siniflar="pl-check > input[type=checkbox]",
    a11y="Etiket input'u saran <label> içinde; belirsizlik JS ile el.indeterminate=true.",
    html='''<div class="pl-stack" style="gap:10px">
  <label class="pl-check"><input type="checkbox" checked> Başlangıçta çalıştır</label>
  <label class="pl-check"><input type="checkbox" class="js-indet"> Tümünü seç (3/7)</label>
  <label class="pl-check"><input type="checkbox"> Anonim kullanım verisi gönder</label>
</div>''')

add(slug="radio", ad="Radyo Grubu", kategori="Form",
    aciklama="Tek seçim, tüm seçenekler görünür.",
    ne_zaman="2–5 seçenek ve kullanıcının hepsini görmesi önemliyse.",
    siniflar="pl-radio > input[type=radio]",
    a11y="<fieldset> + <legend>; aynı name.",
    html='''<fieldset style="border:0;padding:0;margin:0" class="pl-stack"><legend class="pl-label" style="margin-bottom:8px">Güncelleme kanalı</legend>
  <label class="pl-radio"><input type="radio" name="ch" checked> Kararlı</label>
  <label class="pl-radio"><input type="radio" name="ch"> Beta</label>
  <label class="pl-radio"><input type="radio" name="ch"> Gece derlemesi</label>
</fieldset>''')

add(slug="switch", ad="Anahtar (Toggle)", kategori="Form",
    aciklama="Anında etki eden açık/kapalı ayarı.",
    ne_zaman="Değişiklik 'Kaydet' gerektirmiyorsa. Gerektiriyorsa onay kutusu kullan.",
    siniflar="pl-switch > input[type=checkbox][role=switch]",
    a11y="role=\"switch\" + aria-checked.",
    html='''<div class="pl-stack" style="gap:10px">
  <label class="pl-switch"><input type="checkbox" role="switch" checked> Otomatik güncelle</label>
  <label class="pl-switch"><input type="checkbox" role="switch"> Sessiz mod</label>
</div>''')

add(slug="slider", ad="Kaydırıcı", kategori="Form",
    aciklama="Sürekli değer seçimi; dolgu --pl-val ile.",
    ne_zaman="Ses, opaklık, AI yaratıcılık (temperature), önbellek boyutu.",
    siniflar="pl-slider (style=\"--pl-val:62%\")",
    a11y="Native range; aria-valuetext ile birimli değer (\"%62\").",
    html='''<div class="pl-field"><div class="pl-field__label">Yaratıcılık <span class="pl-num">0,62</span></div>
<input class="pl-slider" type="range" value="62" style="--pl-val:62%" aria-valuetext="0,62"></div>''')

add(slug="number-stepper", ad="Sayı Adımlayıcı", kategori="Form",
    aciklama="Küçük tam sayı ayarları için +/− kontrol.",
    ne_zaman="Porsiyon sayısı, eşzamanlı indirme, yeniden deneme sayısı.",
    siniflar="pl-numstep > button + input + button",
    a11y="input type=\"number\" + min/max; butonlarda aria-label.",
    html='''<div class="pl-numstep"><button aria-label="Azalt">−</button><input type="number" value="4" min="1" max="12"><button aria-label="Artır">+</button></div>''')

add(slug="dropzone", ad="Dosya Bırakma Alanı", kategori="Form",
    aciklama="Sürükle-bırak veya tıklayarak dosya yükleme.",
    ne_zaman="Eklenti paketi (.crx/.zip), tasarım görseli, içe aktarma dosyası.",
    durumlar=["varsayılan", "sürükleniyor (is-dragover)", "yükleniyor", "hata"],
    siniflar="pl-dropzone pl-dropzone__icon is-dragover",
    a11y="Gizli <input type=file> + görünür buton; klavye ile erişilebilir.",
    html=f'''<div class="pl-dropzone"><div class="pl-dropzone__icon">{I("upload", 20)}</div>
<b style="color:var(--pl-fg-1)">Dosyayı buraya bırakın</b><span>.json, .csv veya .zip · en fazla 50 MB</span>
<button class="pl-btn pl-btn--secondary pl-btn--sm">Dosya seç</button></div>''')

add(slug="color-swatches", ad="Renk Seçici", kategori="Form",
    aciklama="Önceden tanımlı renk paleti seçimi.",
    ne_zaman="Not/etiket rengi, tema aksanı, Design Replicator palet çıkarımı.",
    siniflar="pl-swatches > .pl-swatch.is-selected",
    a11y="role=\"radiogroup\"; her renk aria-label ile adlandırılır.",
    html='''<div class="pl-swatches" role="radiogroup">
  <button class="pl-swatch is-selected" style="background:#7c6cff" aria-label="Iris"></button>
  <button class="pl-swatch" style="background:#22d3ee" aria-label="Cyan"></button>
  <button class="pl-swatch" style="background:#f472b6" aria-label="Pembe"></button>
  <button class="pl-swatch" style="background:#fb923c" aria-label="Turuncu"></button>
  <button class="pl-swatch" style="background:#a3e635" aria-label="Limon"></button>
  <button class="pl-swatch" style="background:#f0b429" aria-label="Altın"></button>
</div>''')

add(slug="form-field", ad="Form Alanı (Etiket + Yardım + Hata)", kategori="Form",
    aciklama="Etiket, giriş, yardım ve hata metnini birleştiren sarmalayıcı.",
    ne_zaman="Her form girişi bu sarmalayıcıyla kullanılır.",
    durumlar=["normal", "hata (is-error)"],
    siniflar="pl-field pl-field__label pl-field__help is-error",
    a11y="Yardım/hata metni aria-describedby; hata durumunda aria-invalid=\"true\".",
    span=2,
    html='''<div class="pl-row" style="align-items:flex-start;flex-wrap:nowrap;gap:16px">
<div class="pl-field" style="flex:1"><label class="pl-field__label">API anahtarı <span class="pl-muted">Zorunlu</span></label>
<input class="pl-input" placeholder="sk-…"><span class="pl-field__help">Anahtar yalnız bu cihazda şifreli saklanır.</span></div>
<div class="pl-field is-error" style="flex:1"><label class="pl-field__label">Sunucu adresi</label>
<input class="pl-input" value="localhost:11434x" aria-invalid="true"><span class="pl-field__help">Geçerli bir port girin (örn. 11434).</span></div></div>''')

# ======================= GEZİNME =======================
add(slug="hub-sidebar", ad="Hub Kenar Çubuğu", kategori="Gezinme", urun="hub",
    aciklama="PluginLabs Hub'ın ana gezinmesi: marka, bölümler, uygulamalar.",
    ne_zaman="Masaüstü Hub ve tam ekran web panellerinde birincil gezinme.",
    siniflar="pl-sidebar pl-sidebar__brand pl-sidebar__section pl-navitem.is-active",
    a11y="<nav aria-label=\"Ana menü\">; aktif öğede aria-current=\"page\".",
    html=f'''<nav class="pl-sidebar" aria-label="Ana menü" style="height:auto">
  <div class="pl-sidebar__brand"><span class="pl-applogo pl-applogo--sm" style="background:var(--pl-brand-gradient)">PL</span>PluginLabs</div>
  <a class="pl-navitem is-active" aria-current="page">{I("home")}Ana sayfa</a>
  <a class="pl-navitem">{I("grid")}Uygulamalar<span class="pl-badge pl-badge--count">3</span></a>
  <a class="pl-navitem">{I("puzzle")}Eklentiler</a>
  <a class="pl-navitem">{I("sparkles")}MyMind</a>
  <div class="pl-sidebar__section pl-label">Kurulu</div>
  <a class="pl-navitem"><span class="pl-navitem__dot" style="background:#22d3ee"></span>Leo Helper</a>
  <a class="pl-navitem"><span class="pl-navitem__dot" style="background:#2dd4bf"></span>Flow Dock</a>
  <a class="pl-navitem"><span class="pl-navitem__dot" style="background:#a3e635"></span>Tweakster<span class="pl-badge pl-badge--warning">↑</span></a>
</nav>''')

add(slug="titlebar", ad="Pencere Başlık Çubuğu", kategori="Gezinme", urun="hub", span=2,
    aciklama="Çerçevesiz masaüstü penceresi için başlık, global arama ve pencere kontrolleri.",
    ne_zaman="Electron/Tauri çerçevesiz pencerelerde (Hub, Flow Dock ayarları, Tweakster).",
    siniflar="pl-titlebar pl-titlebar__center pl-titlebar__search pl-winctl",
    a11y="Sürüklenebilir alan -webkit-app-region: drag; butonlar no-drag ve aria-label'lı.",
    html=f'''<div class="pl-titlebar" style="border:1px solid var(--pl-line);border-radius:10px;overflow:hidden">
  <span class="pl-applogo pl-applogo--sm" style="width:20px;height:20px;border-radius:6px;font-size:9px;background:var(--pl-brand-gradient)">PL</span>
  <span class="pl-titlebar__title">PluginLabs Hub</span>
  <div class="pl-titlebar__center"><div class="pl-titlebar__search">{I("search")}Her şeyi ara<span class="pl-kbd">Ctrl K</span></div></div>
  <div class="pl-winctl"><button aria-label="Küçült">{I("minus")}</button><button aria-label="Büyüt">{I("maximize")}</button><button aria-label="Kapat">{I("x")}</button></div>
</div>''')

add(slug="tabs", ad="Sekmeler", kategori="Gezinme",
    aciklama="Aynı bağlam içindeki görünümler arası geçiş.",
    ne_zaman="Uygulama detay sayfası (Genel/Sürümler/İzinler/Ayarlar), yan panel bölümleri.",
    siniflar="pl-tabs > .pl-tab.is-active",
    a11y="role=tablist/tab/tabpanel; ← → ile gezinme, Home/End.",
    html='''<div class="pl-tabs" role="tablist">
  <button class="pl-tab is-active" role="tab" aria-selected="true">Genel</button>
  <button class="pl-tab" role="tab">Sürümler <span class="pl-badge">14</span></button>
  <button class="pl-tab" role="tab">İzinler</button><button class="pl-tab" role="tab">Ayarlar</button>
</div>''')

add(slug="breadcrumb", ad="Yol İzi", kategori="Gezinme",
    aciklama="Hiyerarşik konum gösterimi.",
    ne_zaman="2+ seviye derinlikli sayfalarda (Hub › Eklentiler › Leo Helper › İzinler).",
    siniflar="pl-breadcrumb",
    a11y="<nav aria-label=\"Yol izi\">; son öğe aria-current=\"page\".",
    html=f'''<nav class="pl-breadcrumb" aria-label="Yol izi"><a href="#">Hub</a>{I("chevron-right")}<a href="#">Eklentiler</a>{I("chevron-right")}<a href="#">Leo Helper</a>{I("chevron-right")}<span aria-current="page">İzinler</span></nav>''')

add(slug="pagination", ad="Sayfalama", kategori="Gezinme",
    aciklama="Uzun listelerde sayfa geçişi.",
    ne_zaman="Tablo ve kataloglarda; sonsuz kaydırma yerine konum hissi gerekiyorsa.",
    siniflar="pl-pagination > button.is-active",
    a11y="<nav aria-label=\"Sayfalama\">; aktif sayfa aria-current=\"page\".",
    html=f'''<nav class="pl-pagination" aria-label="Sayfalama"><button aria-label="Önceki">{I("chevron-left")}</button>
<button>1</button><button class="is-active" aria-current="page">2</button><button>3</button><button>…</button><button>12</button>
<button aria-label="Sonraki">{I("chevron-right")}</button></nav>''')

add(slug="command-palette", ad="Komut Paleti", kategori="Gezinme", urun="hub", span=2,
    aciklama="Ctrl/⌘+K ile açılan global arama ve eylem merkezi.",
    ne_zaman="Her PluginLabs uygulamasında zorunlu. Uygulama, eylem, ayar, belge araması.",
    siniflar="pl-cmdk pl-cmdk__input pl-cmdk__list pl-cmdk__group pl-menuitem pl-cmdk__foot",
    a11y="role=\"combobox\" + listbox; aria-activedescendant; ↑↓ Enter Esc.",
    html=f'''<div class="pl-cmdk" role="dialog" aria-label="Komut paleti">
  <div class="pl-cmdk__input">{I("search", 20)}<input value="leo" aria-label="Komut ara"><span class="pl-kbd">Esc</span></div>
  <div class="pl-cmdk__list">
    <div class="pl-cmdk__group pl-label">Uygulamalar</div>
    <div class="pl-menuitem is-active"><span class="pl-applogo pl-applogo--sm" data-pl-product="leo" style="width:22px;height:22px;font-size:9px">LH</span>Leo Helper'ı aç<span class="pl-kbd">↵</span></div>
    <div class="pl-menuitem">{I("refresh")}Leo Helper — kanalları yenile</div>
    <div class="pl-cmdk__group pl-label">Eylemler</div>
    <div class="pl-menuitem">{I("download")}Güncellemeleri denetle<span class="pl-menuitem__meta">Ctrl U</span></div>
  </div>
  <div class="pl-cmdk__foot"><span><span class="pl-kbd">↑</span><span class="pl-kbd">↓</span> gezin</span><span><span class="pl-kbd">↵</span> aç</span><span><span class="pl-kbd">Tab</span> eylemler</span></div>
</div>''')

add(slug="menu", ad="Açılır / Bağlam Menüsü", kategori="Gezinme",
    aciklama="Satır ve öğe eylemleri listesi.",
    ne_zaman="'Daha fazla' butonu, sağ tık, bölünmüş buton açılımı.",
    siniflar="pl-menu pl-menuitem pl-menuitem--danger pl-menuitem__meta",
    a11y="role=\"menu\"/\"menuitem\"; ↑↓ gezinme, ilk harfle atlama, Esc kapatır.",
    html=f'''<div class="pl-menu" role="menu">
  <div class="pl-menuitem" role="menuitem">{I("external")}Aç<span class="pl-kbd">↵</span></div>
  <div class="pl-menuitem" role="menuitem">{I("pin")}Dock'a sabitle</div>
  <div class="pl-menuitem" role="menuitem">{I("copy")}Kimliği kopyala<span class="pl-menuitem__meta">PL-001</span></div>
  <hr><div class="pl-menuitem pl-menuitem--danger" role="menuitem">{I("archive")}Arşivle</div>
</div>''')

add(slug="wizard-steps", ad="Sihirbaz Adımları", kategori="Gezinme", span=2,
    aciklama="Çok adımlı akışlarda ilerleme konumu.",
    ne_zaman="Kurulum, onboarding, içe aktarma, Scrapper görev oluşturma.",
    durumlar=["tamamlandı", "geçerli", "bekliyor"],
    siniflar="pl-steps pl-step.is-done|is-current pl-steps__line.is-done",
    a11y="<ol>; geçerli adım aria-current=\"step\".",
    html=f'''<div class="pl-steps">
  <div class="pl-step is-done"><span class="pl-step__num">{I("check")}</span>Hesap</div><div class="pl-steps__line is-done"></div>
  <div class="pl-step is-done"><span class="pl-step__num">2</span>Uygulamalar</div><div class="pl-steps__line is-done"></div>
  <div class="pl-step is-current" aria-current="step"><span class="pl-step__num">3</span>MyMind</div><div class="pl-steps__line"></div>
  <div class="pl-step"><span class="pl-step__num">4</span>Bitti</div>
</div>''')

# ======================= VERİ =======================
add(slug="kpi-card", ad="KPI Kartı", kategori="Veri", span=2,
    aciklama="Tek önemli sayı + değişim + bağlam.",
    ne_zaman="Panoların üst satırı; 3–5 kart yan yana. Biri vurgulanabilir.",
    siniflar="pl-kpi pl-kpi--highlight pl-kpi__value pl-kpi__delta.is-up|is-down",
    a11y="Değişimin yönü metinle de verilir (\"%12 artış\").",
    html=f'''<div class="pl-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
  <div class="pl-kpi pl-kpi--highlight"><span class="pl-label">Kurulu uygulama</span><span class="pl-kpi__value">8</span><span class="pl-kpi__delta is-up">{I("trending-up")}+2 bu ay</span></div>
  <div class="pl-kpi"><span class="pl-label">Yakalanan kod</span><span class="pl-kpi__value">1.284</span><span class="pl-kpi__delta is-up">{I("trending-up")}%18</span></div>
  <div class="pl-kpi"><span class="pl-label">Tasarruf</span><span class="pl-kpi__value" style="color:var(--pl-gold)">3.420 ₺</span><span class="pl-kpi__delta is-down">{I("trending-down")}%4</span></div>
</div>''')

add(slug="data-table", ad="Veri Tablosu", kategori="Veri", span=2,
    aciklama="Sıralanabilir, seçilebilir yoğun veri tablosu.",
    ne_zaman="Fiyat takibi, kurulum geçmişi, log kayıtları, eklenti envanteri.",
    siniflar="pl-table th td.is-num td.is-strong tr.is-selected",
    a11y="<th scope=\"col\">; sıralanabilir başlıkta aria-sort.",
    html='''<table class="pl-table"><thead><tr><th>Ürün</th><th>Mağaza</th><th class="is-num">Fiyat</th><th class="is-num">Değişim</th><th>Durum</th></tr></thead><tbody>
<tr><td class="is-strong">Kablosuz kulaklık</td><td>Trendyol</td><td class="is-num">1.249,90 ₺</td><td class="is-num" style="color:var(--pl-success)">−%14</td><td><span class="pl-badge pl-badge--success">Düştü</span></td></tr>
<tr class="is-selected"><td class="is-strong">Mekanik klavye</td><td>Hepsiburada</td><td class="is-num">2.899,00 ₺</td><td class="is-num">%0</td><td><span class="pl-badge">Sabit</span></td></tr>
<tr><td class="is-strong">27" monitör</td><td>Amazon TR</td><td class="is-num">7.640,00 ₺</td><td class="is-num" style="color:var(--pl-danger)">+%6</td><td><span class="pl-badge pl-badge--danger">Arttı</span></td></tr>
</tbody></table>''')

add(slug="progress-bar", ad="İlerleme Çubuğu", kategori="Veri",
    aciklama="Belirli ve belirsiz ilerleme.",
    ne_zaman="İndirme, kurulum, kazıma görevi, kota kullanımı.",
    siniflar="pl-progress > span (style=\"--pl-val:64%\") pl-progress--indeterminate pl-progress--sm",
    a11y="role=\"progressbar\" + aria-valuenow/min/max; belirsizde valuenow yok.",
    html='''<div class="pl-stack">
  <div class="pl-progress" role="progressbar" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100"><span style="--pl-val:64%"></span></div>
  <div class="pl-progress pl-progress--indeterminate" role="progressbar"><span></span></div>
  <div class="pl-progress pl-progress--sm"><span style="--pl-val:92%;background:var(--pl-warning)"></span></div>
</div>''')

add(slug="progress-ring", ad="İlerleme Halkası", kategori="Veri",
    aciklama="Dairesel yüzde göstergesi.",
    ne_zaman="Sistem skoru (Tweakster), profil tamamlama, kota.",
    siniflar="pl-ring pl-ring--lg (style=\"--pl-val:72\")",
    a11y="role=\"img\" + aria-label=\"%72\".",
    html='''<div class="pl-row" style="gap:16px"><div class="pl-ring" style="--pl-val:72" role="img" aria-label="%72"><span>72</span></div>
<div class="pl-ring pl-ring--lg" style="--pl-val:38" role="img" aria-label="%38"><span>38%</span></div></div>''')

add(slug="sparkline-card", ad="Mini Grafik Kartı", kategori="Veri",
    aciklama="Değer + son dönem eğilimini gösteren küçük çizgi grafik.",
    ne_zaman="Fiyat geçmişi, CPU kullanımı, günlük yakalanan kod sayısı.",
    siniflar="pl-kpi + inline <svg> (stroke: var(--pl-accent))",
    a11y="SVG role=\"img\" + aria-label ile özet (\"30 günde %14 düşüş\").",
    html='''<div class="pl-kpi"><div class="pl-row" style="justify-content:space-between"><span class="pl-label">30 günlük fiyat</span><span class="pl-badge pl-badge--success">−%14</span></div>
<span class="pl-kpi__value" style="font-size:22px">1.249,90 ₺</span>
<svg viewBox="0 0 200 48" style="width:100%;height:48px" role="img" aria-label="30 günde yüzde 14 düşüş"><defs><linearGradient id="spk" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--pl-accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--pl-accent)" stop-opacity="0"/></linearGradient></defs>
<path d="M0 12 L20 14 L40 10 L60 16 L80 15 L100 22 L120 20 L140 28 L160 26 L180 34 L200 36 L200 48 L0 48Z" fill="url(#spk)"/><path d="M0 12 L20 14 L40 10 L60 16 L80 15 L100 22 L120 20 L140 28 L160 26 L180 34 L200 36" fill="none" stroke="var(--pl-accent)" stroke-width="2"/></svg></div>''')

add(slug="distribution-bar", ad="Dağılım Çubuğu", kategori="Veri",
    aciklama="Bir bütünün kategori paylarını gösteren segmentli çubuk + lejant.",
    ne_zaman="Disk kullanımı, bütçe dağılımı, eklenti başına bellek.",
    siniflar="pl-distbar > span (style=\"flex:<pay>\") pl-legend",
    a11y="Lejant metni değerleri içerir; renk tek taşıyıcı değildir.",
    html='''<div class="pl-stack"><div class="pl-distbar"><span style="flex:42;background:#7c6cff"></span><span style="flex:23;background:#22d3ee"></span><span style="flex:18;background:#a3e635"></span><span style="flex:17;background:var(--pl-bg-4)"></span></div>
<div class="pl-legend"><span><i style="background:#7c6cff"></i>Uygulamalar %42</span><span><i style="background:#22d3ee"></i>Önbellek %23</span><span><i style="background:#a3e635"></i>Loglar %18</span><span><i style="background:var(--pl-bg-4)"></i>Boş %17</span></div></div>''')

add(slug="timeline", ad="Zaman Çizelgesi / Etkinlik Günlüğü", kategori="Veri",
    aciklama="Kronolojik olaylar; her işlem kaynak → hedef → sonuç ile loglanır.",
    ne_zaman="Kurulum geçmişi, senkron logu, Leo Helper yakalama akışı.",
    siniflar="pl-timeline pl-timeline__dot.is-accent|is-success|is-danger pl-timeline__title pl-timeline__meta",
    a11y="<ol>; tarih <time datetime>.",
    html='''<ol class="pl-timeline">
  <li><span class="pl-timeline__dot is-success"></span><div class="pl-timeline__title">Tweakster 1.3.0 kuruldu</div><div class="pl-timeline__meta">30.10.2026 · 00:42 · GitHub → Hub → Başarılı</div></li>
  <li><span class="pl-timeline__dot is-accent"></span><div class="pl-timeline__title">Leo Helper 3 kod yakaladı</div><div class="pl-timeline__meta">29.10.2026 · 23:10 · @indirimler</div></li>
  <li><span class="pl-timeline__dot is-danger"></span><div class="pl-timeline__title">Senkron başarısız</div><div class="pl-timeline__meta">29.10.2026 · 21:05 · zaman aşımı</div></li>
</ol>''')

add(slug="key-value", ad="Anahtar–Değer Listesi", kategori="Veri",
    aciklama="Meta veri gösterimi.",
    ne_zaman="Uygulama detayları, sürüm bilgisi, sistem bilgisi.",
    siniflar="pl-kv > dt + dd",
    a11y="<dl> anlamsal yapısı korunur.",
    html='''<dl class="pl-kv"><dt>Sürüm</dt><dd class="pl-num">2.4.1</dd><dt>Platform</dt><dd>Chrome · Edge</dd>
<dt>Boyut</dt><dd class="pl-num">1,8 MB</dd><dt>Güncellendi</dt><dd class="pl-num">28.10.2026</dd><dt>Kimlik</dt><dd class="pl-num">PL-002</dd></dl>''')

add(slug="empty-state", ad="Boş Durum", kategori="Veri",
    aciklama="Gösterilecek veri yokken yön veren ekran.",
    ne_zaman="İlk kullanım, boş arama sonucu, boş liste. Her zaman bir eylem önerir.",
    siniflar="pl-empty pl-empty__art",
    a11y="Başlık h2/h3; eylem butonu odaklanabilir.",
    html=f'''<div class="pl-empty"><div class="pl-empty__art">{I("heart", 24)}</div><h3 class="pl-h3">Henüz kayıtlı ürün yok</h3>
<p class="pl-muted" style="margin:0 0 8px;max-width:260px">Herhangi bir ürün sayfasında kalp ikonuna tıklayın, fiyatını sizin için takip edelim.</p>
<button class="pl-btn pl-btn--primary pl-btn--sm">{I("plus")}İlk ürünü ekle</button></div>''')

add(slug="code-block", ad="Kod Bloğu", kategori="Veri",
    aciklama="Sözdizimi vurgulu, kopyalanabilir kod / log.",
    ne_zaman="Kurulum komutu, API yanıtı, Design Replicator CSS çıktısı.",
    siniflar="pl-code pl-code__head pre .t-k .t-s .t-c .t-n",
    a11y="Kopyala butonu aria-label; kopyalandıktan sonra toast.",
    html=f'''<div class="pl-code"><div class="pl-code__head"><span class="pl-label">tokens.css</span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kopyala">{I("copy")}</button></div>
<pre><span class="t-c">/* Design Replicator çıktısı */</span>
<span class="t-k">.hero</span> {{
  background: <span class="t-s">var(--pl-bg-1)</span>;
  border-radius: <span class="t-n">14px</span>;
}}</pre></div>''')

add(slug="accordion", ad="Akordeon", kategori="Veri",
    aciklama="Katlanabilir içerik bölümleri.",
    ne_zaman="SSS, gelişmiş ayarlar, izin ayrıntıları.",
    siniflar="pl-accordion > details > summary",
    a11y="Native <details>/<summary> klavye uyumludur.",
    html=f'''<div class="pl-accordion">
<details open><summary>Leo Helper hangi verileri okur?{I("chevron-down")}</summary><div>Yalnız takip ettiğiniz kanalların mesajları cihazınızda işlenir.</div></details>
<details><summary>Verilerim nerede saklanır?{I("chevron-down")}</summary><div>Yerel olarak; senkron açıksa şifreli olarak.</div></details></div>''')

# ======================= GERİ BİLDİRİM =======================
add(slug="callout", ad="Uyarı Kutusu (Callout)", kategori="Geri Bildirim", span=2,
    aciklama="Sayfa içi kalıcı bilgi/uyarı; sol renkli kenarlık.",
    ne_zaman="Önemli bağlam, risk, ipucu. Geçici bildirim için Toast.",
    durumlar=["info", "success", "warning", "danger", "accent"],
    siniflar="pl-callout pl-callout--success|warning|danger|accent pl-callout__title",
    a11y="Kritikse role=\"alert\", değilse role=\"note\".",
    html=f'''<div class="pl-stack">
<div class="pl-callout pl-callout--warning" role="note">{I("alert")}<div><div class="pl-callout__title">Telegram oturumu 3 gün içinde sona erecek</div>Kesinti yaşamamak için yeniden doğrulayın.</div></div>
<div class="pl-callout pl-callout--accent">{I("sparkles")}<div><div class="pl-callout__title">MyMind önerisi</div>Bu kanaldaki kodların %80'i 18:00–20:00 arası paylaşılıyor.</div></div></div>''')

add(slug="toast", ad="Toast Bildirimi", kategori="Geri Bildirim",
    aciklama="Geçici, köşede beliren işlem sonucu; geri alma sunar.",
    ne_zaman="Eylem sonuçları: kaydedildi, kopyalandı, arşivlendi (Geri al).",
    siniflar="pl-toast pl-toast__body pl-toast__action",
    a11y="Kapsayıcı role=\"status\" aria-live=\"polite\"; hata ise role=\"alert\". En az 5 sn.",
    html=f'''<div class="pl-stack"><div class="pl-toast" role="status">{I("check-circle", 20)}<div class="pl-toast__body">3 eklenti arşivlendi<small>Arşiv › 30.10.2026</small></div><button class="pl-toast__action">Geri al</button></div>
<div class="pl-toast" style="--pl-c:var(--pl-danger)" role="alert">{I("x-circle", 20)}<div class="pl-toast__body">Kurulum başarısız<small>İmza doğrulanamadı</small></div><button class="pl-toast__action">Tekrar</button></div></div>''')

add(slug="banner", ad="Duyuru Bandı", kategori="Geri Bildirim", span=2,
    aciklama="Sayfa üstünde global, kapatılabilir duyuru.",
    ne_zaman="Güncelleme mevcut, bakım, yeni özellik tanıtımı.",
    siniflar="pl-banner pl-banner__text",
    a11y="Kapat butonu aria-label; tekrar gösterilmeme tercihi saklanır.",
    html=f'''<div class="pl-banner">{I("sparkles", 20)}<div class="pl-banner__text"><b>PluginLabs Hub 2.0 hazır.</b> <span class="pl-muted">Yeni komut paleti ve MyMind entegrasyonu.</span></div>
<button class="pl-btn pl-btn--primary pl-btn--sm">Yeniden başlat</button><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kapat">{I("x")}</button></div>''')

# ======================= KATMAN =======================
add(slug="modal", ad="Modal Diyalog", kategori="Katman",
    aciklama="Odaklı karar veya form için üst katman.",
    ne_zaman="Kullanıcıyı durdurması gereken kısa görevler; uzun içerik için Çekmece.",
    siniflar="dialog.pl-modal pl-modal__head pl-modal__icon pl-modal__body pl-modal__foot",
    a11y="Native <dialog>.showModal(); odak tuzağı, Esc kapatır, odak tetikleyiciye döner.",
    html=f'''<div class="pl-modal" role="dialog" aria-labelledby="m1"><div class="pl-modal__head"><div class="pl-modal__icon">{I("puzzle", 20)}</div>
<div><h3 class="pl-h3" id="m1">Leo Helper'ı kur</h3><p class="pl-muted" style="margin:4px 0 0">Chrome ve Edge'e eklenecek.</p></div></div>
<div class="pl-modal__body"><label class="pl-check"><input type="checkbox" checked> Tüm profillere kur</label></div>
<div class="pl-modal__foot"><button class="pl-btn pl-btn--ghost">Vazgeç</button><button class="pl-btn pl-btn--primary">Kur</button></div></div>''')

add(slug="archive-confirm", ad="Arşivle Onayı", kategori="Katman",
    aciklama="Silme yerine arşivleme onayı; geri dönüş yolunu açıkça söyler.",
    ne_zaman="Her yıkıcı eylemde. 'Sil' kelimesi kullanılmaz.",
    siniflar="pl-modal + pl-modal__icon.is-warning + pl-btn--danger",
    a11y="role=\"alertdialog\"; varsayılan odak 'Vazgeç' butonunda.",
    html=f'''<div class="pl-modal" role="alertdialog" aria-labelledby="m2"><div class="pl-modal__head"><div class="pl-modal__icon is-warning">{I("archive", 20)}</div>
<div><h3 class="pl-h3" id="m2">3 kanal arşivlensin mi?</h3><p class="pl-muted" style="margin:4px 0 0">Kanallar <span class="pl-num">Arşiv/30.10.2026</span> altına taşınır, istediğiniz zaman geri yükleyebilirsiniz.</p></div></div>
<div class="pl-modal__foot"><button class="pl-btn pl-btn--ghost" autofocus>Vazgeç</button><button class="pl-btn pl-btn--danger">{I("archive")}Arşivle</button></div></div>''')

add(slug="drawer", ad="Çekmece (Yan Sayfa)", kategori="Katman",
    aciklama="Sağdan açılan detay/düzenleme paneli.",
    ne_zaman="Liste bağlamını kaybetmeden detay gösterme, uzun formlar.",
    siniflar="pl-drawer pl-drawer__head pl-drawer__body pl-drawer__foot",
    a11y="role=\"dialog\" aria-modal; Esc kapatır.",
    html=f'''<div class="pl-drawer" style="height:auto;max-width:none"><div class="pl-drawer__head"><b style="color:var(--pl-fg-1)">Ürün ayrıntısı</b><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kapat">{I("x")}</button></div>
<div class="pl-drawer__body"><dl class="pl-kv"><dt>Hedef fiyat</dt><dd class="pl-num">1.100,00 ₺</dd><dt>Bildirim</dt><dd>Açık</dd></dl></div>
<div class="pl-drawer__foot"><button class="pl-btn pl-btn--secondary pl-btn--sm">İptal</button><button class="pl-btn pl-btn--primary pl-btn--sm">Kaydet</button></div></div>''')

# ======================= ÜRÜN KALIPLARI =======================
add(slug="app-logo", ad="Uygulama Logo Karosu", kategori="Ürün Kalıpları",
    aciklama="Ürün aksanından türeyen gradyan logo karosu.",
    ne_zaman="Katalog, kenar çubuğu, dock, bildirim, popup başlığı.",
    siniflar="pl-applogo pl-applogo--sm|lg [data-pl-product]",
    a11y="Dekoratifse aria-hidden; tek başına kullanılıyorsa aria-label=ürün adı.",
    span=2,
    html='''<div class="pl-row" style="gap:10px">
<span class="pl-applogo" data-pl-product="hub" style="background:var(--pl-brand-gradient)">PL</span>
<span class="pl-applogo" data-pl-product="leo">LH</span><span class="pl-applogo" data-pl-product="mindpalace">MP</span>
<span class="pl-applogo" data-pl-product="replicator">DR</span><span class="pl-applogo" data-pl-product="mutfak">MA</span>
<span class="pl-applogo" data-pl-product="flowdock">FD</span><span class="pl-applogo" data-pl-product="tweakster">TW</span>
<span class="pl-applogo" data-pl-product="extman">EM</span><span class="pl-applogo" data-pl-product="mymind">MM</span>
<span class="pl-applogo" data-pl-product="scrapper">US</span><span class="pl-applogo" data-pl-product="wishlist">MW</span></div>''')

add(slug="app-card", ad="Uygulama Kartı (Katalog)", kategori="Ürün Kalıpları", urun="leo",
    aciklama="Hub kataloğunda uygulama/eklenti kartı: logo, ad, platform, eylem.",
    ne_zaman="Hub ana sayfası, 'Uygulamalar' ve 'Eklentiler' ızgaraları.",
    durumlar=["kurulu değil (Kur)", "kurulu (Aç)", "güncelleme var", "kuruluyor"],
    siniflar="pl-appcard pl-appcard__head pl-appcard__name pl-appcard__desc pl-appcard__foot",
    a11y="Kart bir <article>; birincil eylem butonu tek odak noktası.",
    html=f'''<article class="pl-appcard"><div class="pl-appcard__head"><span class="pl-applogo">LH</span><div style="min-width:0"><div class="pl-appcard__name">Leo Helper</div><span class="pl-label">Eklenti · v2.4.1</span></div><span class="pl-badge pl-badge--success" style="margin-left:auto">Kurulu</span></div>
<p class="pl-appcard__desc">Telegram kanallarındaki indirim kodlarını, bağlantıları ve koşulları otomatik yakalar.</p>
<div class="pl-appcard__foot"><div class="pl-row" style="gap:6px"><span class="pl-badge">Chrome</span><span class="pl-badge">Edge</span></div><button class="pl-btn pl-btn--primary pl-btn--sm">Aç</button></div></article>''')

add(slug="install-row", ad="Kurulum / İndirme Satırı", kategori="Ürün Kalıpları", urun="hub",
    aciklama="Kuyruktaki kurulum veya güncellemenin canlı ilerlemesi.",
    ne_zaman="Hub 'İndirmeler' paneli, toplu güncelleme.",
    siniflar="pl-installrow pl-installrow__main pl-installrow__top + pl-progress",
    a11y="İlerleme aria-valuenow; bitişte aria-live duyurusu.",
    html=f'''<div class="pl-stack" style="gap:8px">
<div class="pl-installrow"><span class="pl-applogo pl-applogo--sm" data-pl-product="tweakster">TW</span><div class="pl-installrow__main"><div class="pl-installrow__top">Tweakster 1.3.0<span class="pl-num pl-muted">48 / 74 MB</span></div><div class="pl-progress"><span style="--pl-val:65%"></span></div></div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Duraklat">{I("square")}</button></div>
<div class="pl-installrow"><span class="pl-applogo pl-applogo--sm" data-pl-product="flowdock">FD</span><div class="pl-installrow__main"><div class="pl-installrow__top">Flow Dock 0.9.2<span class="pl-badge pl-badge--success">Tamam</span></div></div><button class="pl-btn pl-btn--secondary pl-btn--sm">Aç</button></div></div>''')

add(slug="extension-popup", ad="Eklenti Popup İskeleti", kategori="Ürün Kalıpları", urun="leo", span=2,
    aciklama="380×560 tarayıcı eklentisi popup'ı: başlık, durum, içerik, alt eylem çubuğu.",
    ne_zaman="Tüm PluginLabs tarayıcı eklentilerinin popup'ı bu iskeletle başlar.",
    siniflar="pl-popup pl-popup__head pl-popup__title pl-popup__body pl-popup__foot [data-pl-density=compact]",
    a11y="Popup açıldığında ilk odak birincil eylemde; Tab sırası yukarıdan aşağı.",
    html=f'''<div class="pl-popup" data-pl-density="compact" style="height:auto"><div class="pl-popup__head"><span class="pl-applogo pl-applogo--sm">LH</span><div class="pl-popup__title"><b>Leo Helper</b><span class="pl-status pl-status--online" style="height:20px;border:0;padding:0;background:none">3 kanal bağlı</span></div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Ayarlar">{I("settings")}</button></div>
<div class="pl-popup__body"><div class="pl-inputwrap">{I("search")}<input class="pl-input" placeholder="Kod veya mağaza ara"></div>
<div class="pl-listrow"><span class="pl-avatar pl-avatar--sm pl-avatar--accent">TY</span><div class="pl-listrow__main"><div class="pl-listrow__title">TRENDYOL150</div><div class="pl-listrow__sub">150 ₺ indirim · min. 750 ₺ · 2 dk önce</div></div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kopyala">{I("copy")}</button></div>
<div class="pl-listrow"><span class="pl-avatar pl-avatar--sm">HB</span><div class="pl-listrow__main"><div class="pl-listrow__title">HEPSI20</div><div class="pl-listrow__sub">%20 · elektronik · 14 dk önce</div></div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kopyala">{I("copy")}</button></div></div>
<div class="pl-popup__foot"><button class="pl-btn pl-btn--secondary pl-btn--sm" style="flex:1">Hub'da aç</button><button class="pl-btn pl-btn--primary pl-btn--sm" style="flex:1">{I("refresh")}Yenile</button></div></div>''')

add(slug="permission-card", ad="İzin İsteği Kartı", kategori="Ürün Kalıpları", urun="extman",
    aciklama="Eklentinin istediği izinleri sade dille açıklayan onay kartı.",
    ne_zaman="Kurulum öncesi, yeni izin talebinde, Extension Manager denetiminde.",
    siniflar="pl-perm > ul > li",
    a11y="Her izin cümle olarak okunur; 'İzin ver' butonu açık metinli.",
    html=f'''<div class="pl-perm"><div class="pl-row"><span class="pl-applogo pl-applogo--sm" data-pl-product="scrapper">US</span><b style="color:var(--pl-fg-1)">The Ultimate Scrapper şunlara erişmek istiyor:</b></div>
<ul><li>{I("globe")}Ziyaret ettiğiniz alışveriş sitelerindeki ürün sayfalarını okuma</li><li>{I("bell")}Fiyat düştüğünde bildirim gösterme</li><li>{I("lock")}Verileri yalnız bu cihazda saklama</li></ul>
<div class="pl-row" style="justify-content:flex-end"><button class="pl-btn pl-btn--ghost pl-btn--sm">Reddet</button><button class="pl-btn pl-btn--primary pl-btn--sm">İzin ver</button></div></div>''')

add(slug="extension-row", ad="Eklenti Satırı (Anahtarlı)", kategori="Ürün Kalıpları", urun="extman",
    aciklama="Eklentiyi etkinleştir/devre dışı bırak; meta ve eylemler.",
    ne_zaman="Extension Manager listesi, Hub 'Kurulu' sayfası.",
    siniflar="pl-listrow pl-listrow__main pl-listrow__title pl-listrow__sub is-disabled + pl-switch",
    a11y="Anahtarın aria-label'ı eklenti adını içerir.",
    html=f'''<div><div class="pl-listrow"><span class="pl-applogo pl-applogo--sm" data-pl-product="leo">LH</span><div class="pl-listrow__main"><div class="pl-listrow__title">Leo Helper</div><div class="pl-listrow__sub">12 MB bellek · 3 izin</div></div><label class="pl-switch"><input type="checkbox" role="switch" checked aria-label="Leo Helper"></label><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Daha fazla">{I("more")}</button></div>
<div class="pl-listrow is-disabled"><span class="pl-applogo pl-applogo--sm" data-pl-product="replicator">DR</span><div class="pl-listrow__main"><div class="pl-listrow__title">Design Replicator</div><div class="pl-listrow__sub">Devre dışı · 28.10.2026'dan beri</div></div><label class="pl-switch"><input type="checkbox" role="switch" aria-label="Design Replicator"></label><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Daha fazla">{I("more")}</button></div></div>''')

add(slug="product-card", ad="Ürün / Fiyat Kartı", kategori="Ürün Kalıpları", urun="wishlist",
    aciklama="Kaydedilen ürünün görseli, fiyatı, değişimi ve mağazası.",
    ne_zaman="MyWishlist kataloğu, Ultimate Scrapper sonuçları. Izgarada eşit boyutlu.",
    siniflar="pl-product pl-product__img pl-product__body pl-price pl-price__now pl-price__old",
    a11y="Görselde alt; fiyat değişimi metinle (\"%14 düştü\").",
    html=f'''<div class="pl-product" style="max-width:240px"><div class="pl-product__img">{I("image", 24)}<button class="pl-iconbtn pl-iconbtn--sm is-active" aria-label="Favoriden çıkar">{I("heart")}</button></div>
<div class="pl-product__body"><span class="pl-label">Trendyol</span><div class="pl-product__title">Kablosuz Kulaklık ANC Pro</div>
<div class="pl-price"><span class="pl-price__now">1.249,90 ₺</span><span class="pl-price__old">1.449,90 ₺</span><span class="pl-badge pl-badge--success">−%14</span></div></div></div>''')

add(slug="ai-message", ad="AI Mesaj Balonu (MyMind)", kategori="Ürün Kalıpları", urun="mymind", span=2,
    aciklama="Kullanıcı ve MyMind mesajları; kaynak, güven ve eylemlerle.",
    ne_zaman="MyMind sohbeti, ürün içi AI yardımcıları, Mind Palace sorguları.",
    durumlar=["kullanıcı", "AI", "yazıyor", "hata"],
    siniflar="pl-msg pl-msg--user|ai pl-msg__bubble pl-msg__meta pl-typing",
    a11y="Mesaj listesi role=\"log\" aria-live=\"polite\"; AI mesajı 'MyMind' rozetli.",
    html=f'''<div class="pl-stack" role="log">
<div class="pl-msg pl-msg--user"><span class="pl-avatar pl-avatar--sm">MI</span><div class="pl-msg__bubble">Bu hafta en çok indirim veren mağaza hangisi?</div></div>
<div class="pl-msg pl-msg--ai"><span class="pl-avatar pl-avatar--sm pl-avatar--accent">{I("sparkles")}</span><div><div class="pl-msg__bubble">Leo Helper verilerine göre <b style="color:var(--pl-fg-1)">Trendyol</b> 42 kodla önde; ortalama indirim <span class="pl-num" style="color:var(--pl-gold)">%18</span>.</div>
<div class="pl-msg__meta"><span class="pl-badge pl-badge--accent">MyMind</span><span class="pl-badge">Kaynak: 3 kanal</span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kopyala">{I("copy")}</button><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Yeniden üret">{I("refresh")}</button></div></div></div>
<div class="pl-msg pl-msg--ai"><span class="pl-avatar pl-avatar--sm pl-avatar--accent">{I("sparkles")}</span><div class="pl-msg__bubble"><span class="pl-typing" aria-label="Yazıyor"><i></i><i></i><i></i></span></div></div></div>''')

add(slug="ai-composer", ad="AI Prompt Kompozitörü", kategori="Ürün Kalıpları", urun="mymind", span=2,
    aciklama="Çok satırlı prompt girişi; ek, ses, model seçimi ve gönder.",
    ne_zaman="MyMind sohbeti, yan panel asistanları.",
    siniflar="pl-composer pl-composer__bar pl-composer__send",
    a11y="Enter gönderir, Shift+Enter yeni satır (ipucu görünür); gönder butonu aria-label.",
    html=f'''<div class="pl-composer"><textarea placeholder="MyMind'a sor… (Shift+Enter yeni satır)" aria-label="Mesaj"></textarea>
<div class="pl-composer__bar"><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Dosya ekle">{I("paperclip")}</button><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Sesle yaz">{I("mic")}</button>
<span class="pl-tag" style="height:24px">{I("sparkles")}MyMind Pro</span><button class="pl-composer__send" aria-label="Gönder">{I("arrow-up")}</button></div></div>''')

add(slug="dock", ad="Dock / Başlatıcı (Flow Dock)", kategori="Ürün Kalıpları", urun="flowdock", span=2,
    aciklama="Yüzen uygulama/kısayol rafı; çalışan uygulama göstergeli.",
    ne_zaman="Flow Dock ana yüzeyi, hızlı başlatıcılar.",
    siniflar="pl-dock pl-dock__item.is-running pl-dock__sep",
    a11y="role=\"toolbar\"; ← → gezinme; her öğede aria-label + tooltip.",
    html=f'''<div style="display:flex;justify-content:center;padding:12px 0"><div class="pl-dock" role="toolbar" aria-label="Flow Dock">
<span class="pl-dock__item is-running" aria-label="Hub" style="background:var(--pl-brand-gradient);color:#fff">{I("grid", 20)}</span>
<span class="pl-dock__item is-running" aria-label="Terminal">{I("terminal", 20)}</span><span class="pl-dock__item" aria-label="Klasörler">{I("folder", 20)}</span>
<span class="pl-dock__item" aria-label="Notlar">{I("book", 20)}</span><span class="pl-dock__sep"></span>
<span class="pl-dock__item" aria-label="Tweakster" style="color:#a3e635">{I("gauge", 20)}</span><span class="pl-dock__item" aria-label="Ayarlar">{I("settings", 20)}</span></div></div>''')

add(slug="system-metric", ad="Sistem Metrik Karosu (Tweakster)", kategori="Ürün Kalıpları", urun="tweakster",
    aciklama="Halka + değer + tek eylem: CPU, RAM, disk, başlangıç öğeleri.",
    ne_zaman="Tweakster panosu; optimizasyon önerileri.",
    siniflar="pl-metric pl-metric__info + pl-ring",
    a11y="Halka aria-label ile yüzde; eylem butonu ne yapacağını söyler.",
    html=f'''<div class="pl-stack"><div class="pl-metric"><div class="pl-ring" style="--pl-val:68" role="img" aria-label="Bellek %68"><span>68</span></div><div class="pl-metric__info"><span class="pl-label">Bellek</span><b style="color:var(--pl-fg-1)">10,9 / 16 GB</b><span class="pl-muted">4 uygulama 2,1 GB kullanıyor</span></div><button class="pl-btn pl-btn--primary pl-btn--sm">{I("zap")}Boşalt</button></div>
<div class="pl-metric"><div class="pl-ring" style="--pl-val:23;--pl-accent:var(--pl-success)" role="img" aria-label="CPU %23"><span>23</span></div><div class="pl-metric__info"><span class="pl-label">İşlemci</span><b style="color:var(--pl-fg-1)">Normal</b><span class="pl-muted">58 °C</span></div></div></div>''')

add(slug="recipe-card", ad="Tarif Kartı (Mutfak Atölyesi)", kategori="Ürün Kalıpları", urun="mutfak",
    aciklama="Görsel + başlık + süre/porsiyon/zorluk meta satırı.",
    ne_zaman="Mutfak Atölyesi kayıtlı tarifler, web'den yakalanan tarifler.",
    siniflar="pl-recipe pl-recipe__img pl-recipe__meta",
    a11y="Görsel alt metni yemeğin adı; meta ikonları aria-hidden, metin okunur.",
    html=f'''<div class="pl-recipe"><div class="pl-recipe__img" role="img" aria-label="Fırında sebzeli bulgur"></div><div class="pl-stack" style="gap:6px"><span class="pl-label">Ana yemek</span><b style="color:var(--pl-fg-1)">Fırında Sebzeli Bulgur</b>
<div class="pl-recipe__meta"><span>{I("clock")}45 dk</span><span>{I("utensils")}4 kişilik</span><span>{I("flame")}Kolay</span></div><div class="pl-row" style="gap:6px"><span class="pl-tag" style="height:22px">Vegan</span><span class="pl-tag" style="height:22px">Tek tava</span></div></div></div>''')

add(slug="extract-card", ad="Kod Çıkarım Kartı (Leo Helper)", kategori="Ürün Kalıpları", urun="leo",
    aciklama="Telegram mesajından çıkarılan kod, koşullar ve kaynak.",
    ne_zaman="Leo Helper akışı, popup detay, bildirim genişletme.",
    durumlar=["geçerli", "süresi doldu", "düzeltildi (geri bildirim)"],
    siniflar="pl-extract pl-extract__code + pl-kv",
    a11y="Kod metni seçilebilir; kopyala butonu sonrası 'Kopyalandı' duyurusu.",
    html=f'''<div class="pl-extract"><div class="pl-row" style="justify-content:space-between"><span class="pl-row" style="gap:8px"><span class="pl-avatar pl-avatar--sm pl-avatar--accent">TG</span><span class="pl-muted">@indirimler · 2 dk</span></span><span class="pl-badge pl-badge--success">Geçerli</span></div>
<div class="pl-extract__code">TRENDYOL150<button class="pl-btn pl-btn--primary pl-btn--sm">{I("copy")}Kopyala</button></div>
<dl class="pl-kv"><dt>İndirim</dt><dd class="pl-num">150 ₺</dd><dt>Alt limit</dt><dd class="pl-num">750 ₺</dd><dt>Bitiş</dt><dd class="pl-num">31.10.2026</dd></dl>
<div class="pl-row" style="justify-content:flex-end"><button class="pl-btn pl-btn--ghost pl-btn--sm">Yanlış mı? Düzelt</button></div></div>''')

add(slug="note-card", ad="Not Kartı (Mind Palace)", kategori="Ürün Kalıpları", urun="mindpalace",
    aciklama="Başlık, önizleme, etiketler ve bağlantı sayısı olan not.",
    ne_zaman="Mind Palace panoları, komuta merkezi, arama sonuçları.",
    siniflar="pl-note",
    a11y="Kart bir <article>; başlık bağlantıdır.",
    html=f'''<article class="pl-note"><div class="pl-row" style="justify-content:space-between"><span class="pl-label">Fikir · 29.10.2026</span><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Sabitle">{I("pin")}</button></div>
<b style="color:var(--pl-fg-1)">Modüler menü mimarisi</b><p>Her eklenti Mind Palace'a bir modül olarak takılır; komuta merkezi tek arama ve ortak bildirim kuyruğu sunar.</p>
<div class="pl-row" style="justify-content:space-between"><div class="pl-row" style="gap:6px"><span class="pl-tag" style="height:22px">mimari</span><span class="pl-tag" style="height:22px">hub</span></div><span class="pl-muted pl-row" style="gap:4px">{I("link")}4</span></div></article>''')

add(slug="settings-row", ad="Ayar Satırı", kategori="Ürün Kalıpları",
    aciklama="Başlık + açıklama + kontrol düzeni.",
    ne_zaman="Tüm uygulamaların Ayarlar sayfası; popup ayarları.",
    siniflar="pl-setting pl-setting__text",
    a11y="Kontrol, satır başlığıyla aria-labelledby ile ilişkilendirilir.",
    html='''<div><div class="pl-setting"><div class="pl-setting__text"><b>Windows ile başlat</b><span class="pl-muted">Hub oturum açıldığında tepside açılır.</span></div><label class="pl-switch"><input type="checkbox" role="switch" checked aria-label="Windows ile başlat"></label></div>
<div class="pl-setting"><div class="pl-setting__text"><b>Varsayılan AI</b><span class="pl-muted">Tüm ürünlerde kullanılacak model.</span></div><select class="pl-select" style="width:150px"><option>MyMind Pro</option><option>Gemini Pro</option><option>Ollama</option></select></div></div>''')

add(slug="onboarding-hero", ad="Karşılama Kahramanı", kategori="Ürün Kalıpları", urun="hub", span=2,
    aciklama="Marka gradyanlı karşılama alanı; iki tonlu başlık.",
    ne_zaman="İlk açılış, Hub ana sayfası üstü, büyük sürüm tanıtımı.",
    siniflar="pl-hero pl-hero__title > em",
    a11y="Tek h1; dekoratif arka plan aria-hidden.",
    html=f'''<section class="pl-hero"><span class="pl-badge pl-badge--accent">PluginLabs Hub · 2.0</span><h1 class="pl-hero__title">Tüm araçların,<br><em>tek atölyede.</em></h1>
<p class="pl-muted" style="max-width:420px;margin:0 0 16px">Uygulamaları ve eklentileri kur, güncelle, MyMind ile birbirine bağla.</p>
<div class="pl-row"><button class="pl-btn pl-btn--gradient pl-btn--lg">Başla{I("arrow-right")}</button><button class="pl-btn pl-btn--secondary pl-btn--lg">Kataloğa göz at</button></div></section>''')

add(slug="plan-card", ad="Plan / Abonelik Kartı", kategori="Ürün Kalıpları", span=2,
    aciklama="Ücretsiz ve Pro planların karşılaştırması; Pro altın vurgulu.",
    ne_zaman="Yükseltme ekranı, hesap sayfası.",
    siniflar="pl-plan pl-plan.is-featured pl-plan__price",
    a11y="Fiyat ve dönem tek metin olarak okunur (\"Ayda 149 ₺\").",
    html=f'''<div class="pl-grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
<div class="pl-plan"><span class="pl-label">Ücretsiz</span><div class="pl-plan__price">0 ₺</div><ul><li>{I("check")}3 uygulama</li><li>{I("check")}Yerel AI</li></ul><button class="pl-btn pl-btn--secondary pl-btn--block">Mevcut plan</button></div>
<div class="pl-plan is-featured"><div class="pl-row" style="justify-content:space-between"><span class="pl-label">Pro</span><span class="pl-badge pl-badge--pro">{I("crown")}Önerilen</span></div><div class="pl-plan__price">149 ₺<span class="pl-muted" style="font-size:13px">/ay</span></div><ul><li>{I("check")}Sınırsız uygulama</li><li>{I("check")}MyMind Pro</li><li>{I("check")}Bulut senkron</li></ul><button class="pl-btn pl-btn--gradient pl-btn--block">Pro'ya geç</button></div></div>''')

add(slug="notification-center", ad="Bildirim Merkezi", kategori="Ürün Kalıpları", urun="hub",
    aciklama="Tüm ürünlerden gelen bildirimlerin tek listesi.",
    ne_zaman="Hub başlık çubuğundaki zil; tepsi menüsü.",
    siniflar="pl-menu + pl-listrow + pl-badge--count",
    a11y="role=\"region\" aria-label=\"Bildirimler\"; okunmamış sayısı duyurulur.",
    html=f'''<div class="pl-menu" style="padding:0;min-width:0"><div class="pl-row" style="justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--pl-line)"><b style="color:var(--pl-fg-1)">Bildirimler <span class="pl-badge pl-badge--count">2</span></b><a class="pl-link" style="font-size:12px">Tümünü okundu say</a></div>
<div class="pl-listrow"><span class="pl-applogo pl-applogo--sm" data-pl-product="wishlist">MW</span><div class="pl-listrow__main"><div class="pl-listrow__title">Fiyat %14 düştü</div><div class="pl-listrow__sub">Kablosuz kulaklık · 5 dk</div></div></div>
<div class="pl-listrow"><span class="pl-applogo pl-applogo--sm" data-pl-product="tweakster">TW</span><div class="pl-listrow__main"><div class="pl-listrow__title">Güncelleme hazır</div><div class="pl-listrow__sub">Tweakster 1.3.0 · 1 sa</div></div></div></div>''')

add(slug="scrape-task", ad="Kazıma Görevi Kartı (Scrapper)", kategori="Ürün Kalıpları", urun="scrapper",
    aciklama="Çok sayfalı kazıma/veri toplama görevinin durumu ve çıktısı.",
    ne_zaman="The Ultimate Scrapper görev listesi.",
    durumlar=["kuyrukta", "çalışıyor", "tamamlandı", "hata"],
    siniflar="pl-card + pl-progress + pl-kv",
    a11y="Görev durumu metinle; ilerleme aria-valuenow.",
    html=f'''<div class="pl-card pl-stack"><div class="pl-row" style="justify-content:space-between"><b style="color:var(--pl-fg-1)">Laptop fiyatları · 5 site</b><span class="pl-status pl-status--syncing">Çalışıyor</span></div>
<div class="pl-progress"><span style="--pl-val:58%"></span></div><div class="pl-row" style="justify-content:space-between"><span class="pl-muted pl-num">14 / 24 sayfa · 312 ürün</span><span class="pl-muted pl-num">~2 dk</span></div>
<div class="pl-row"><button class="pl-btn pl-btn--secondary pl-btn--sm">{I("eye")}Önizle</button><button class="pl-btn pl-btn--ghost pl-btn--sm">{I("download")}CSV</button><button class="pl-btn pl-btn--ghost pl-btn--sm">{I("cart")}Sepet oluştur</button></div></div>''')

add(slug="palette-extract", ad="Palet Çıkarım Paneli (Design Replicator)", kategori="Ürün Kalıpları", urun="replicator",
    aciklama="Sayfadan çıkarılan renk, font ve token önerileri.",
    ne_zaman="Design Replicator yan paneli.",
    siniflar="pl-card + pl-swatches + pl-kv",
    a11y="Her renk adıyla ve HEX değeriyle okunur.",
    html=f'''<div class="pl-card pl-stack"><div class="pl-row" style="justify-content:space-between"><span class="pl-label">Çıkarılan palet</span><button class="pl-btn pl-btn--primary pl-btn--sm">{I("wand")}Token üret</button></div>
<div class="pl-row" style="gap:6px;flex-wrap:nowrap">{''.join(f'<div style="flex:1;height:44px;border-radius:8px;background:{c}"></div>' for c in ["#0f172a","#1e293b","#f472b6","#fde68a","#f8fafc"])}</div>
<dl class="pl-kv"><dt>Başlık fontu</dt><dd>Clash Display</dd><dt>Gövde</dt><dd>Inter 15/1.6</dd><dt>Köşe</dt><dd class="pl-num">12px</dd></dl></div>''')

add(slug="budget-meter", ad="Bütçe Göstergesi (MyWishlist)", kategori="Ürün Kalıpları", urun="wishlist",
    aciklama="Liste toplamının bütçeye oranı ve kalan tutar.",
    ne_zaman="MyWishlist bütçe planı, alışveriş listeleri.",
    siniflar="pl-kpi + pl-progress",
    a11y="Tutarlar ₺ ile metin olarak; aşımda uyarı rengi + metin.",
    html='''<div class="pl-kpi"><div class="pl-row" style="justify-content:space-between"><span class="pl-label">Kasım bütçesi</span><span class="pl-badge pl-badge--warning">%82</span></div>
<span class="pl-kpi__value" style="font-size:24px">8.200 ₺ <span class="pl-muted" style="font-size:14px">/ 10.000 ₺</span></span>
<div class="pl-progress"><span style="--pl-val:82%;background:var(--pl-warning)"></span></div><span class="pl-muted">Kalan <b class="pl-num" style="color:var(--pl-gold)">1.800 ₺</b> · 3 ürün alındı</span></div>''')

add(slug="channel-connect", ad="Bağlantı Kurulum Kartı", kategori="Ürün Kalıpları", urun="leo",
    aciklama="Harici hesap/servis bağlama adımı ve durumu.",
    ne_zaman="Telegram, Gemini, Ollama, GitHub bağlantıları.",
    durumlar=["bağlı değil", "bağlanıyor", "bağlı", "hata"],
    siniflar="pl-card + pl-status + pl-btn",
    a11y="Durum değişimi aria-live; hata nedeni metinle.",
    html=f'''<div class="pl-stack" style="gap:8px">
<div class="pl-card pl-row" style="flex-wrap:nowrap"><span class="pl-avatar pl-avatar--accent">{I("send")}</span><div style="flex:1;min-width:0"><b style="color:var(--pl-fg-1)">Telegram</b><div class="pl-muted">3 kanal takip ediliyor</div></div><span class="pl-status pl-status--online">Bağlı</span></div>
<div class="pl-card pl-row" style="flex-wrap:nowrap"><span class="pl-avatar">{I("cpu")}</span><div style="flex:1;min-width:0"><b style="color:var(--pl-fg-1)">Ollama</b><div class="pl-muted pl-num">localhost:11434</div></div><button class="pl-btn pl-btn--secondary pl-btn--sm">Bağla</button></div></div>''')

add(slug="shortcut-list", ad="Kısayol Listesi", kategori="Ürün Kalıpları",
    aciklama="Uygulamanın klavye kısayolları referansı.",
    ne_zaman="Yardım menüsü, '?' tuşu ile açılan katman.",
    siniflar="pl-kv + pl-kbd",
    a11y="Platforma göre tuş adı (Ctrl/⌘).",
    html='''<dl class="pl-kv"><dt>Komut paleti</dt><dd><span class="pl-kbd">Ctrl</span> <span class="pl-kbd">K</span></dd><dt>Ara</dt><dd><span class="pl-kbd">/</span></dd>
<dt>Yeni not</dt><dd><span class="pl-kbd">Ctrl</span> <span class="pl-kbd">N</span></dd><dt>Dock'u göster</dt><dd><span class="pl-kbd">Alt</span> <span class="pl-kbd">Space</span></dd></dl>''')

add(slug="update-card", ad="Güncelleme Kartı", kategori="Ürün Kalıpları", urun="hub",
    aciklama="Sürüm farkı ve değişiklik özetiyle güncelleme önerisi.",
    ne_zaman="Hub 'Güncellemeler' sekmesi, uygulama detay sayfası.",
    siniflar="pl-card + pl-badge + pl-btn",
    a11y="Sürüm farkı metin olarak (\"1.2.4'ten 1.3.0'a\").",
    html=f'''<div class="pl-card pl-stack"><div class="pl-row" style="flex-wrap:nowrap"><span class="pl-applogo pl-applogo--sm" data-pl-product="tweakster">TW</span><div style="flex:1"><b style="color:var(--pl-fg-1)">Tweakster</b><div class="pl-num pl-muted">1.2.4 → <span style="color:var(--pl-fg-1)">1.3.0</span></div></div><span class="pl-badge pl-badge--warning">Güncelleme</span></div>
<ul class="pl-muted" style="margin:0;padding-left:18px"><li>Başlangıç öğeleri yöneticisi</li><li>Disk temizliğinde %30 hız</li></ul>
<div class="pl-row" style="justify-content:flex-end"><button class="pl-btn pl-btn--ghost pl-btn--sm">Sürüm notları</button><button class="pl-btn pl-btn--primary pl-btn--sm">{I("download")}Güncelle</button></div></div>''')

add(slug="filter-bar", ad="Filtre Çubuğu", kategori="Ürün Kalıpları", span=2,
    aciklama="Arama + etiket filtreleri + görünüm seçimi + sıralama.",
    ne_zaman="Katalog, ürün listesi, not panosu üstü.",
    siniflar="pl-row + pl-inputwrap + pl-tag + pl-segment + pl-select",
    a11y="role=\"search\"; uygulanan filtre sayısı duyurulur.",
    html=f'''<div class="pl-row" role="search" style="flex-wrap:wrap;gap:10px"><div class="pl-inputwrap" style="flex:1;min-width:180px">{I("search")}<input class="pl-input" placeholder="Filtrele"></div>
<span class="pl-tag is-selected">{I("filter")}Eklenti</span><span class="pl-tag">Masaüstü</span>
<div class="pl-segment"><button class="is-active" aria-label="Izgara">{I("grid")}</button><button aria-label="Liste">{I("layers")}</button></div>
<select class="pl-select" style="width:150px"><option>En yeni</option><option>En popüler</option></select></div>''')

add(slug="sidepanel-shell", ad="Yan Panel İskeleti", kategori="Ürün Kalıpları", urun="mindpalace",
    aciklama="Tarayıcı yan paneli (400px): başlık, sekmeler, içerik, alt kompozitör.",
    ne_zaman="Mind Palace, Design Replicator, MyMind asistanı yan panelleri.",
    siniflar="pl-popup (width:var(--pl-sidepanel-w)) + pl-tabs + pl-composer",
    a11y="Panel landmark: <aside aria-label>.",
    html=f'''<aside class="pl-popup" data-pl-density="compact" style="width:100%;height:auto" aria-label="Mind Palace"><div class="pl-popup__head"><span class="pl-applogo pl-applogo--sm">MP</span><div class="pl-popup__title"><b>Mind Palace</b></div><button class="pl-iconbtn pl-iconbtn--sm" aria-label="Kapat">{I("x")}</button></div>
<div style="padding:0 12px"><div class="pl-tabs"><button class="pl-tab is-active">Notlar</button><button class="pl-tab">Modüller</button><button class="pl-tab">Komuta</button></div></div>
<div class="pl-popup__body"><div class="pl-listrow"><div class="pl-listrow__main"><div class="pl-listrow__title">Modüler menü mimarisi</div><div class="pl-listrow__sub">4 bağlantı · dün</div></div></div>
<div class="pl-composer" style="padding:8px"><textarea style="min-height:28px" placeholder="Hızlı not…"></textarea></div></div></aside>''')

add(slug="stat-grid-legend", ad="Kategori Etiketli Liste", kategori="Ürün Kalıpları",
    aciklama="Renkli kategori pilli, sağa hizalı tutarlı liste (Astra serisiyle uyumlu).",
    ne_zaman="Harcama/alışveriş listeleri, eklenti kaynak tüketimi.",
    siniflar="pl-listrow + pl-badge--* + pl-num",
    a11y="Tutarlar sağa hizalı ve tabular.",
    html='''<div><div class="pl-listrow"><label class="pl-check"><input type="checkbox" checked></label><div class="pl-listrow__main"><div class="pl-listrow__title">Mekanik klavye</div></div><span class="pl-badge pl-badge--info">Elektronik</span><span class="pl-num" style="color:var(--pl-fg-1);min-width:90px;text-align:right">2.899 ₺</span></div>
<div class="pl-listrow"><label class="pl-check"><input type="checkbox"></label><div class="pl-listrow__main"><div class="pl-listrow__title">Döküm tava</div></div><span class="pl-badge pl-badge--warning">Mutfak</span><span class="pl-num" style="color:var(--pl-fg-1);min-width:90px;text-align:right">1.150 ₺</span></div></div>''')

if __name__ == "__main__":
    print(len(C), "komponent")
