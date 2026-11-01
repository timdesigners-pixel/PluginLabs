#!/usr/bin/env python3
"""PluginLabs uygulama hiyerarşisi üretici.
Kaynak: resources/notion-catalog.json (Notion anlık görüntüsü, 26.10.2026) + PL-051–053 ek kayıtları.
Hedef: registry/projects.json + apps/<kategori>/<PL-ID-slug>/README.md
Mevcut README dosyalarının üzerine yazmaz (--force verilmedikçe)."""
import json, re, sys, unicodedata
from pathlib import Path

ROOT = Path(sys.argv[1])
FORCE = '--force' in sys.argv
TARIH = '29.10.2026'
ISO = '2026-10-29'
OWNER = 'timdesigners-pixel'

cat = json.loads((ROOT / 'resources/notion-catalog.json').read_text(encoding='utf-8'))

KATEGORILER = [
    ('01', 'mevcut-urunler-ve-fikirler', '01 · Mevcut ürünler ve fikirler — PL-001–010'),
    ('02', 'kisisel-arsiv-ve-chrome-araclari', '02 · Kişisel arşiv ve Chrome araçları — PL-011–020'),
    ('03', 'masaustu-dosya-araclari-ve-widgetlar', '03 · Masaüstü, dosya araçları ve widget’lar — PL-021–030'),
    ('04', 'arastirma-yazma-ve-bilgi-akislari', '04 · Araştırma, yazma ve bilgi akışları — PL-031–040'),
    ('05', 'gelistirici-ve-profesyonel-araclar', '05 · Geliştirici ve profesyonel araçlar — PL-041–050'),
    ('06', 'hub-disi-urun-depolari', '06 · Bağımsız ürün depoları — PL-051–053'),
    ('07', 'yeni-urunler', '07 · Yeni ürünler — PL-054+'),
]
KAT_BY_TITLE = {t: (n, s, t) for n, s, t in KATEGORILER}

# Doğrulanmış ürün depoları (GitHub hesabında mevcut). verified=False: eşleşme Codex'ten teyit edilecek.
REPOLAR = {
    'PL-001': ('flow-dock', True, 'Codex kenar çubuğu: PL · Masaüstü · Flow Dock'),
    'PL-002': ('leo-helper', True, 'Codex kenar çubuğu: PL · Masaüstü · Leo Helper'),
    'PL-003': ('mind-palace', True, 'Codex kenar çubuğu: PL · Masaüstü · Mind Palace'),
    'PL-010': ('1001-designs', True, 'Codex projesi PL-010 · 1001 Designs / Pin to Component, birincil klasör projeler\\1001-designs (29.10.2026 doğrulandı)'),
    'PL-004': ('the-ultimate-scrapper', True, 'Codex tarafından private oluşturuldu 29.10.2026; GitHub’da doğrulandı 30.10.2026 (henüz kod yok)'),
    'PL-005': ('finansal-asistan', True, 'Codex tarafından private oluşturuldu 29.10.2026; GitHub’da doğrulandı 30.10.2026 (henüz kod yok)'),
    'PL-006': ('note-master', True, 'Codex tarafından private oluşturuldu 29.10.2026; GitHub’da doğrulandı 30.10.2026 (henüz kod yok)'),
    'PL-007': ('musebook', True, 'Codex tarafından private oluşturuldu 29.10.2026; GitHub’da doğrulandı 30.10.2026 (henüz kod yok)'),
    'PL-008': ('prompt-dunyasi', True, 'Codex tarafından private oluşturuldu 29.10.2026; GitHub’da doğrulandı 30.10.2026 (henüz kod yok)'),
    'PL-009': ('what-the-app', True, 'Codex tarafından private oluşturuldu 29.10.2026; GitHub’da doğrulandı 30.10.2026 (henüz kod yok)'),
    'PL-011': ('whatsapp-chat-viewer', True, 'Codex tarafından private oluşturuldu 29.10.2026; GitHub’da doğrulandı 30.10.2026 (henüz kod yok)'),
    'PL-012': ('dilekce-olustur', True, 'Codex tarafından private oluşturuldu 29.10.2026; GitHub’da doğrulandı 30.10.2026 (henüz kod yok)'),
    'PL-013': ('gadget-dunyasi-companion', True, 'Codex tarafından private oluşturuldu 29.10.2026; GitHub’da doğrulandı 30.10.2026 (henüz kod yok)'),
    'PL-014': ('social-saves-organizer', True, 'Codex tarafından private oluşturuldu 29.10.2026; GitHub’da doğrulandı 30.10.2026 (henüz kod yok)'),
    'PL-015': ('youtube-shelf', True, 'GitHub’da doğrulandı 01.11.2026 · release v0.1.1 (31.10.2026, önizleme)'),
    'PL-016': ('tab-atlas', True, 'GitHub’da doğrulandı 01.11.2026 · release v0.1.0 (31.10.2026, önizleme)'),
    'PL-017': ('page-capsule', True, 'GitHub’da doğrulandı 01.11.2026 · release v0.1.0 (31.10.2026, önizleme)'),
    'PL-018': ('form-flow', True, 'GitHub’da doğrulandı 01.11.2026 · release v0.1.0 (31.10.2026, önizleme)'),
    'PL-019': ('compare-lens', True, 'GitHub’da doğrulandı 01.11.2026 · release v0.1.0 (31.10.2026, önizleme)'),
    'PL-020': ('page-change-radar', True, 'GitHub’da doğrulandı 01.11.2026 · release v0.1.0 (31.10.2026, önizleme)'),
    'PL-021': ('desk-tidy', True, 'GitHub’da doğrulandı 01.11.2026 · release v0.1.0 (31.10.2026, önizleme)'),
    'PL-022': ('twin-finder', True, 'GitHub’da doğrulandı 01.11.2026 · release v0.1.0 (31.10.2026, önizleme)'),
    'PL-023': ('clip-vault', True, 'GitHub’da doğrulandı 01.11.2026 · release v0.1.0 (31.10.2026, önizleme)'),
    'PL-024': ('snap-ocr', True, 'GitHub’da doğrulandı 01.11.2026 · release v0.1.0 (01.11.2026, önizleme)'),
    'PL-051': ('extension-manager', True, 'Codex projesi PL-051 · Extension Manager (29.10.2026 doğrulandı); yerel klasör Chrome-Eklentileri\\Yonetici'),
    'PL-052': ('tweakster', True, 'Codex projesi PL-052 · Tweakster (29.10.2026 doğrulandı)'),
    'PL-053': ('mutfak-atolyesi', True, 'Codex proje adı: “PL -053· Mutfak Atölyesi”'),
}

EK = [
    {
        'id': 'PL-051', 'name': 'Extension Manager / Eklenti Yöneticisi',
        'category': KATEGORILER[5][2], 'source': 'https://app.notion.com/p/4088aa13d8f981c4989de0a071b81ef3',
        'description': 'Eklenti yöneticisi (Chrome eklentisi).',
        'fields': {
            'Durum': 'Bağımsız ürün deposu mevcut (private) · özellik listesi depodan doğrulanacak',
            'Platform': 'Chrome eklentisi (Codex: PL · Eklenti · Extension Manager)',
            'MVP ve temel akış': 'Kaynak: kullanıcı beyanı (28.10.2026) — “Extension Manager / Eklenti Yöneticisi (Chrome eklentisi)”. Ayrıntılı özellik listesi extension-manager deposundan tamamlanacak.',
            'Teknik bağımlılık ve sınır': 'PluginLabs Hub içindeki “Eklenti yöneticisi” ekranı ve Hub Tarayıcı Uzantısı (Browser Bridge) ile aynı ürün değildir; ayrı tutulur.',
        },
    },
    {
        'id': 'PL-052', 'name': 'Tweakster',
        'category': KATEGORILER[5][2], 'source': 'https://app.notion.com/p/4088aa13d8f981c4989de0a071b81ef3',
        'description': 'PluginLabs ailesinin Windows PC hızlandırma uygulaması.',
        'fields': {
            'Durum': 'Depo 28.10.2026’da açıldı; kod henüz yok (tweakster README)',
            'Platform': 'Windows masaüstü (Codex: PL · Masaüstü · Tweakster)',
            'MVP ve temel akış': 'Kaynak: kullanıcı beyanı (28.10.2026) — “Tweakster (PC hızlandırma uygulaması)”. Ayrıntılı özellik listesi henüz tanımlanmadı; kod yazıldıkça tweakster deposundan tamamlanacak.',
            'Teknik bağımlılık ve sınır': 'Depo kuralları (tweakster README): Her ayar değişikliği geri alınabilir olmalı; uygulamadan önce geri yükleme noktası alınır. Yönetici izni yalnız gerektiği adımda istenir. Kabul manifesti: PluginLabs docs/ecosystem-v1/contracts/app-manifest.schema.json (rollback kapısı zorunlu).',
        },
    },
    {
        'id': 'PL-053', 'name': 'Mutfak Atölyesi',
        'category': KATEGORILER[5][2], 'source': 'https://app.notion.com/p/4088aa13d8f981c4989de0a071b81ef3',
        'description': None,
        'fields': {
            'Durum': 'Bağımsız ürün deposu mevcut (private) · “01 · PluginLabs & Yazılım” sayfasında adı geçiyor · özellik listesi depodan doğrulanacak',
            'Platform': 'Web (Codex: PL · Web · Mutfak Atölyesi)',
            'MVP ve temel akış': 'Ayrıntılı özellik listesi mutfak-atolyesi deposundan tamamlanacak.',
        },
    },
    {
        'id': 'PL-054', 'name': 'MyWishlist',
        'category': KATEGORILER[6][2], 'source': 'https://app.notion.com/p/4088aa13d8f9819d9319c134d29ccae1',
        'description': 'Webde gezinirken ürünleri işaretleyerek kaydeden; katalogda kaynak site, rakip fiyatlar, açıklama, özellik ve görselleri gösteren tarayıcı eklentisi (çalışma adı; kaynak fikir: MyWishlist).',
        'fields': {
            'Durum': 'Yeni fikir · kullanıcı notundan ürünleştirme',
            'Platform': 'Chrome (ve Chromium tarayıcılar) eklentisi; aynı tarayıcıyla W / L / M',
            'Kullanıcı ve problem': 'Webde gezinirken beğendiği ürünleri farklı sitelerde sepet, favori ve sekme olarak dağınık bırakan; sonra fiyatı, satıcısı ve özelliklerini yeniden aramak zorunda kalan alışveriş kullanıcıları.',
            'MVP ve temel akış': 'Ürün sayfasında tek tıkla işaretle → ürün adı, fiyat, görseller, açıklama, özellikler ve kaynak site otomatik kaydedilir → katalog ekranında listele, filtrele, etiketle → “alındı” işaretle → JSON/CSV içe/dışa aktar. İlk sürüm yerel depolama ve yapısal veri (JSON-LD/microdata) okuyan ürün sayfaları.',
            'Yapay zekânın rolü': 'Aynı ürünü farklı sitelerde eşleştirir, benzer ürün önerir, özellikleri karşılaştırma tablosuna dönüştürür; fiyat ve stok değerleri her zaman kaynaktan okunur.',
            'Teknik bağımlılık ve sınır': 'Kullanıcı işaretlemeden sayfa okunmaz; rakip fiyatlar yalnız izinli/erişilebilir kaynaklardan ve tarihli gösterilir. Captcha ve bot koruması aşılmaz. Hesap parolası ve ödeme bilgisi toplanmaz; satın alma otomatik yapılmaz. MV3 servis çalışanı nedeniyle sürekli arka plan fiyat taraması garanti edilmez.',
            'Gelir hipotezi': 'Ücretsiz sınırlı katalog; Pro fiyat alarmı, rakip fiyat karşılaştırma, bütçe planı ve cihazlar arası eşitleme. Ortaklık (affiliate) bağlantısı kullanılırsa açık etiketlenir.',
            'Doğrulama ölçütü': 'İşaretlenen üründe ad/fiyat/görsel/kaynak alanı ≥%95 eksiksiz; ilk haftada kullanıcı başına ≥5 kayıt; içe/dışa aktarmada veri kaybı sıfır.',
            'Öncelik ve efor': 'P1 · M (öneri); PL-004 The Ultimate Scrapper’ın takip/sepet motorunu kullanan hafif tüketici ön yüzü.',
            'Ad önerisi': 'Nihai ad: MyWishlist (kullanıcı kararı, 30.10.2026). Önceki çalışma adı: PinCart; diğer adaylar: Wishkeeper, Göz Hapsi.',
            'İşaretleyerek kaydet': 'Sayfadaki ürün kartını veya ürün sayfasını tek tıkla (simge, sağ tık menüsü veya kısayol) kaydetme; yanlış algılanan alanı elle düzeltme.',
            'Katalog': 'Tüm kayıtların kart/liste görünümü; site, kategori, etiket, fiyat aralığı, alındı/bekliyor filtreleri; arama.',
            'Kaynak site ve rakip fiyatlar': 'Bulunduğu site, son görülen fiyat ve tarih; aynı ürünün diğer sitelerdeki teklifleri ve fiyat farkı.',
            'Ürün ayrıntısı': 'Açıklama, teknik özellikler, varyantlar ve görsel galeri; en iyi görselin kapak olarak seçilmesi.',
            'İçe / dışa aktarma': 'JSON ve CSV; başka cihaza taşıma ve yedek.',
            'Alındı olarak işaretleme': 'Satın alınan ürün, alınan fiyat ve tarihle arşive taşınır; silinmez.',
            'Bütçe planı': 'Liste/koleksiyon başına bütçe, öncelik sırası, planlanan ay; toplam ve kalan bütçe.',
            'Benzer ürünler': 'Kaydedilen ürüne benzer alternatiflerin kaynaklı listesi.',
            'Fiyat düşüşü uyarısı (Pro)': 'Hedef fiyat veya yüzde düşüşte bildirim.',
            'Koleksiyonlar ve paylaşım': 'Doğum günü, ev, teknoloji gibi listeler; salt okunur paylaşım bağlantısı (sonraki faz).',
            'Sepete dönüştür': 'Seçili ürünlerden PL-004 sepet planı oluşturma; ödeme otomatik değil.',
            'Veri modeli (öneri)': 'WishItem (id, title, url, sourceSite, price, currency, seenAt, images, primaryImage, description, attributes, variant, tags, collectionId, status: bekliyor|alındı|arşiv, purchasedPrice, purchasedAt) · Collection (id, ad, bütçe, para birimi, planlanan dönem) · Offer ve WatchRule PL-004 ile ortak şema. Kimlikler UUID, tarihler ISO 8601.',
            'Geliştirme işleri': 'PC-01 işaretleyerek kaydet + yapısal veri okuyucu (3 sitede ≥%95) · PC-02 katalog/filtre/arama (500 kayıtta ≤1 sn) · PC-03 alındı işaretleme ve arşiv · PC-04 JSON/CSV içe/dışa aktarma (kayıp sıfır) · PC-05 bütçe planı (deterministik toplam) · PC-06 rakip fiyat ve benzer ürün (PL-004 motoru; her teklif kaynak ve tarihli).',
        },
    },
]

TR = str.maketrans({'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u',
                    'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c', '’': '', "'": ''})
SLUG_OZEL = {'PL-054': 'mywishlist', 'PL-010': '1001-designs-pin-to-component', 'PL-051': 'extension-manager', 'PL-003': 'mind-palace-plugin-hub'}


def slugify(id_, name):
    if id_ in SLUG_OZEL:
        return SLUG_OZEL[id_]
    s = name.translate(TR)
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def platformlar(text):
    t = text or ''
    wlm = 'W / L / M' in t
    p = {
        'windows': wlm or 'Windows' in t,
        'linux': wlm or 'Linux' in t,
        'macos': wlm or 'macOS' in t,
        'chrome': 'Chrome' in t,
        'web': t.startswith('Web'),
    }
    bicim = []
    low = t.lower()
    if p['windows'] or p['linux'] or p['macos']:
        bicim.append('masaüstü uygulaması')
    if p['chrome']:
        bicim.append('Chrome eklentisi (Manifest V3)')
    if 'widget' in low:
        bicim.append('widget')
    if 'balon' in low:
        bicim.append('yüzen balon')
    if 'tepsi' in low:
        bicim.append('sistem tepsisi')
    if 'yan panel' in low:
        bicim.append('tarayıcı yan paneli')
    if 'figma' in low:
        bicim.append('Figma bağlayıcısı')
    if p['web']:
        bicim.append('web uygulaması')
    return p, bicim


def oncelik(text):
    m = re.match(r'\s*(P\d)\s*·\s*(XL|S|M|L)\b', text or '')
    return (m.group(1), m.group(2)) if m else (None, None)


V2_004 = {
    'v2 · Konumlandırma (29.10.2026)': 'Kullanıcı kararıyla ürün yalnız ürün ve fiyat kazıyan bir arşivci olmaktan çıkarılıp veri madencisi ve alışveriş asistanı (The Ultimate Scrapper — Data Miner & Shopping Assistant) olarak genişletildi. İlk kart korunur; bu alanlar geliştirme şartnamesidir. Yeni efor önerisi: P1 · XL.',
    'v2 · Kazıma motoru': 'Sayfa ve liste kazıma; önce JSON-LD, microdata ve OpenGraph gibi yapısal veriyi, yoksa DOM seçicilerini okur. Görsel seçici kaydedici ile alan tıklanıp etiketlenir, tarif (recipe) olarak kaydedilir ve aynı sitedeki diğer sayfalara uygulanır. Sayfalama, “daha fazla yükle” ve sonsuz kaydırma.',
    'v2 · Veri toplama (Data Miner)': 'Çok kaynaklı veri setleri; normalizasyon, tekilleştirme ve aynı ürün eşleştirme. Masaüstü botuyla zamanlanmış toplama ve değişiklik geçmişi. Dışa aktarma: CSV, JSON, XLSX, SQLite ve arşiv paketi (veri + görseller).',
    'v2 · Fiyat ve stok takibi': 'İzleme listesi; hedef fiyat, yüzde düşüş, stok geldi/bitti ve varyant/satıcı değişikliği kuralları. Fiyat geçmişi grafiği, en düşük/ortalama fiyat ve geçmişe göre gerçek indirim göstergesi. Masaüstü/mobil bildirim, sessiz saatler, kaynak başına kontrol sıklığı sınırı.',
    'v2 · Çok sayfalı tablo okuma': 'HTML tabloları ve sanal kaydırmalı veri tablolarını algılar; sonraki düğmesi, sayfa numaraları veya URL deseniyle tüm sayfaları dolaşıp tek veri setinde birleştirir. Başlık eşleştirme, birleşik hücreler, sütun tipi çıkarımı, tekrar satır ayıklama, kaldığı sayfadan devam; atlanan sayfa ve okunamayan satır raporu.',
    'v2 · Otomatik sepet oluşturma': 'Alışveriş veya izleme listesinden her kalem için uygun teklifi (fiyat + kargo + teslim süresi + satıcı puanı) seçen sepet planı; tek veya çok siteli bölünmüş sepet, bütçe tavanı, toplam maliyet özeti. Kullanıcı onayıyla desteklenen sitelerde sepete ekleme. Ödeme ve sipariş onayı hiçbir zaman otomatik yapılmaz.',
    'v2 · Alışveriş asistanı': 'Doğal dil isteğini arama ölçütlerine çevirir; adayları kaynaklı karşılaştırma tablosunda sunar, eksik bilgiyi bilinmiyor olarak gösterir. Model fiyat üretmez; fiyat, stok, toplam ve kargo kaynaktan okunur ve deterministik hesaplanır.',
    'v2 · Sınırlar': 'Kullanıcı başlatmalı ve kullanıcının kendi oturumuyla; captcha, bot koruması veya ücret duvarı aşılmaz. ToS/robots farkındalığı ve oran sınırı. Parola ve ödeme bilgisi toplanmaz; çerezler OS kasasında şifreli. Sepete ekleme yalnız test edilmiş bağlayıcılarda, önizleme ve geri alma ile. Zamanlanmış takip masaüstü botu gerektirir (MV3 sınırı). Ortak çekirdek: PL-040, PL-019, PL-020, PL-054.',
    'v2 · Platformlar': 'Chrome eklentisi (seçici kaydedici, sayfa/tablo okuma, sepete ekleme) · W / L / M masaüstü botu (zamanlayıcı, toplu toplama, yerel veritabanı, görsel arşivi) · mobil uygulama (bildirim ve çevrimdışı görüntüleme).',
    'v2 · Veri modeli eklemeleri': 'Dataset, ScrapeRecipe, TableExtract, Offer, WatchRule, Alert, CartPlan, CartItem; UUID kimlik, ISO 8601 tarih, SQL uyumlu ve API-dostu şema.',
    'v2 · Geliştirme işleri': 'TUS-01 yapısal veri + DOM okuyucu (iki kaynakta ≥%95) · TUS-02 görsel seçici kaydedici ve tarif (10 sayfada doğru alan) · TUS-03 çok sayfalı tablo (20 sayfada satır sayısı birebir, tekrar sıfır, devam) · TUS-04 izleme kuralları ve bildirim (çift bildirim sıfır) · TUS-05 sepet planı (bütçe tavanı, deterministik toplam) · TUS-06 onaylı sepete ekleme (onaysız ekleme ve ödeme adımı sıfır) · TUS-07 doğal dil alışveriş isteği (kaynaksız iddia sıfır) · TUS-08 dışa aktarma ve arşiv (kayıp sıfır).',
}
for _it in cat['items']:
    if _it['id'] == 'PL-004':
        _it['fields'].update(V2_004)
        _it['description'] = 'Web sayfalarından ürün, ilan ve tablo verisini toplayan; fiyat/stok takibi yapan ve alışveriş listesinden sepet planı hazırlayan veri madencisi ve alışveriş asistanı.'
items = list(cat['items']) + EK
kayitlar = []
for it in items:
    id_ = it['id']
    num = int(id_.split('-')[1])
    katno, katslug, kattitle = KAT_BY_TITLE[it['category']]
    slug = slugify(id_, it['name'])
    f = it['fields']
    plat, bicim = platformlar(f.get('Platform'))
    pr, ef = oncelik(f.get('Öncelik ve efor'))
    repo = REPOLAR.get(id_)
    path = f'apps/{katno}-{katslug}/{id_}-{slug}'
    kayitlar.append({
        'id': id_, 'number': num, 'slug': slug, 'name': it['name'],
        'category': {'id': katno, 'slug': katslug, 'title': kattitle},
        'status': f.get('Durum'), 'priority': pr, 'effort': ef,
        'platforms': plat, 'platformText': f.get('Platform'), 'formFactors': bicim,
        'summary': it.get('description'),
        'repo': ({'owner': OWNER, 'name': repo[0], 'url': f'https://github.com/{OWNER}/{repo[0]}',
                  'verified': repo[1], 'note': repo[2]} if repo else None),
        'appPath': path,
        'codexProject': {'name': f'{id_} · {it["name"]}', 'primaryFolder': 'ürün klasörü (yerel)', 'secondaryFolder': 'PluginLabs'},
        'notionUrl': it.get('source'),
        '_it': it,
    })

# ---------- README üretimi ----------
def tablo_satir(k, v):
    return f'| {k} | {v} |'


def readme(k):
    it = k['_it']; f = it['fields']
    L = []
    L.append(f'# {k["id"]} · {k["name"]}')
    L.append('')
    if k['summary']:
        L.append(f'> {k["summary"]}')
        L.append('')
    pl = k['platforms']
    hedef = [n for n, a in [('Windows', pl['windows']), ('Linux', pl['linux']), ('macOS', pl['macos']), ('Chrome', pl['chrome']), ('Web', pl['web'])] if a]
    L += ['| Alan | Değer |', '| --- | --- |']
    L.append(tablo_satir('Kimlik', f'`{k["id"]}` · `{k["slug"]}`'))
    L.append(tablo_satir('Kategori', k['category']['title']))
    L.append(tablo_satir('Durum', f.get('Durum', '—')))
    if k['priority']:
        L.append(tablo_satir('Öncelik / efor', f'{k["priority"]} · {k["effort"]}'))
    L.append(tablo_satir('Hedef platformlar', ', '.join(hedef) or '—'))
    L.append(tablo_satir('Dağıtım biçimi', ', '.join(k['formFactors']) or '—'))
    if k['repo']:
        r = k['repo']
        L.append(tablo_satir('Geliştirme deposu', f'[{r["owner"]}/{r["name"]}]({r["url"]})' + ('' if r['verified'] else ' — *eşleşme teyit edilecek*')))
    else:
        L.append(tablo_satir('Geliştirme deposu', 'Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md))'))
    L.append(tablo_satir('Codex projesi', f'`{k["codexProject"]["name"]}` — ikinci klasör: PluginLabs'))
    if k['notionUrl']:
        L.append(tablo_satir('Notion kaynağı', f'[Notion]({k["notionUrl"]})'))
    L.append('')

    L.append('## Ne işe yarar')
    L.append('')
    if not f.get('Kullanıcı ve problem') and not k['summary']:
        L.append('Ürün tanımı henüz bu klasöre aktarılmadı; ürün deposundaki README ve Codex proje kartından tamamlanacak.')
        L.append('')
    if f.get('Kullanıcı ve problem'):
        L.append(f'**Kullanıcı ve problem:** {f["Kullanıcı ve problem"]}')
        L.append('')
    if k['summary']:
        L.append(('**Kısa tanım (Hub kataloğu):** ' if it.get('spec') else '**Kısa tanım (kullanıcı beyanı, 28.10.2026):** ') + k['summary'])
        L.append('')

    L.append('## Hangi platformlar için yayınlanır')
    L.append('')
    L.append(('**Notion’daki platform tanımı:** ' if it.get('spec') else '**Platform tanımı (Codex proje adından):** ') + f.get('Platform', '—'))
    L.append('')
    for n in hedef:
        L.append(f'- {n}')
    L.append('')
    L.append('> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.')
    L.append('')

    L.append('## Özellikler')
    L.append('')
    ana = ['MVP ve temel akış', 'Yapay zekânın rolü']
    for key in ana:
        if f.get(key):
            L.append(f'### {key}')
            L.append('')
            L.append(f[key])
            L.append('')
    ekstra = [x for x in f if x not in ('Durum', 'Platform', 'Kullanıcı ve problem', 'MVP ve temel akış', 'Yapay zekânın rolü',
                                       'Teknik bağımlılık ve sınır', 'Gelir hipotezi', 'Doğrulama ölçütü', 'Öncelik ve efor')]
    if ekstra:
        L.append('### Ayrıntılı özellik kapsamı')
        L.append('')
        for x in ekstra:
            L.append(f'- **{x}:** {f[x]}')
        L.append('')

    rest = [('Teknik bağımlılık ve sınırlar', 'Teknik bağımlılık ve sınır'), ('Gelir hipotezi', 'Gelir hipotezi'),
            ('Doğrulama ölçütü', 'Doğrulama ölçütü'), ('Öncelik ve efor', 'Öncelik ve efor')]
    for h, key in rest:
        if f.get(key):
            L.append(f'## {h}')
            L.append('')
            L.append(f[key])
            L.append('')

    L.append('## Geliştirme ve ortak çalışma (Codex + Claude Code)')
    L.append('')
    L.append(f'- Dal adı: `codex/{k["id"]}-<konu>` veya `claude/{k["id"]}-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.')
    L.append('- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.')
    L.append('- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).')
    L.append('')

    if it.get('spec'):
        L.append('## Notion kartının özgün metni')
        L.append('')
        L.append(f'Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, {cat["importedAt"]}) içindeki kartın kısaltılmadan aktarılmış hâlidir.')
        L.append('')
        L.append('<details>')
        L.append('<summary>Tam kartı göster</summary>')
        L.append('')
        spec = it['spec'].replace('<b>', '**').replace('</b>', '**')
        L.append(spec)
        L.append('')
        L.append('</details>')
        L.append('')
    L.append('---')
    L.append(f'Oluşturma: {TARIH} · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya')
    L.append('')
    return '\n'.join(L)


yazilan, atlanan = [], []
for k in kayitlar:
    d = ROOT / k['appPath']
    d.mkdir(parents=True, exist_ok=True)
    p = d / 'README.md'
    if p.exists() and not FORCE:
        atlanan.append(str(p)); continue
    p.write_text(readme(k), encoding='utf-8')
    yazilan.append(k['appPath'])

# ---------- registry ----------
reg = {
    'schemaVersion': '1.0.0',
    'generatedAt': ISO,
    'source': {'notionCatalog': cat['source'], 'notionSnapshot': cat['importedAt'], 'file': 'resources/notion-catalog.json'},
    'categories': [{'id': n, 'slug': s, 'title': t, 'path': f'apps/{n}-{s}'} for n, s, t in KATEGORILER],
    'projects': [{x: v for x, v in k.items() if x != '_it'} for k in kayitlar],
}
(ROOT / 'registry').mkdir(exist_ok=True)
(ROOT / 'registry/projects.json').write_text(json.dumps(reg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# ---------- apps/README.md index ----------
I = ['# PluginLabs uygulamaları', '',
     f'PL-001–PL-053 arası {len(kayitlar)} uygulamanın hiyerarşik dizini. Her klasörde ürünün ne işe yaradığını, hangi platformlar için yayınlanacağını ve özelliklerini anlatan bir `README.md` bulunur.', '',
     'Makine tarafından okunabilir kayıt: [`registry/projects.json`](../registry/projects.json).', '']
for n, s, t in KATEGORILER:
    I += [f'## {t}', '', '| Kimlik | Uygulama | Platform | Durum | Öncelik | Depo |', '| --- | --- | --- | --- | --- | --- |']
    for k in kayitlar:
        if k['category']['id'] != n:
            continue
        rel = k['appPath'][len('apps/'):]
        pl = k['platforms']
        ps = ' · '.join(x for x, a in [('W', pl['windows']), ('L', pl['linux']), ('M', pl['macos']), ('Chrome', pl['chrome']), ('Web', pl['web'])] if a)
        repo = f'[{k["repo"]["name"]}]({k["repo"]["url"]})' if k['repo'] else '—'
        durum = (k['status'] or '').split('·')[0].strip()
        pr = f'{k["priority"]} · {k["effort"]}' if k['priority'] else '—'
        I.append(f'| {k["id"]} | [{k["name"]}]({rel}/README.md) | {ps} | {durum} | {pr} | {repo} |')
    I.append('')
I.append(f'---\nOluşturma: {TARIH}')
(ROOT / 'apps/README.md').write_text('\n'.join(I) + '\n', encoding='utf-8')

print('yazılan', len(yazilan), 'atlanan', len(atlanan))
for a in atlanan:
    print('ATLANDI', a)
