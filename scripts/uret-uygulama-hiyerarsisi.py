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
]
KAT_BY_TITLE = {t: (n, s, t) for n, s, t in KATEGORILER}

# Doğrulanmış ürün depoları (GitHub hesabında mevcut). verified=False: eşleşme Codex'ten teyit edilecek.
REPOLAR = {
    'PL-001': ('flow-dock', True, 'Codex kenar çubuğu: PL · Masaüstü · Flow Dock'),
    'PL-002': ('leo-helper', True, 'Codex kenar çubuğu: PL · Masaüstü · Leo Helper'),
    'PL-003': ('mind-palace', True, 'Codex kenar çubuğu: PL · Masaüstü · Mind Palace'),
    'PL-010': ('1001-designs', False, 'Codex’te “Design Replicator” projesinin kökü 1001-designs; PL-010 ile birebir aynı ürün olup olmadığı teyit edilecek'),
    'PL-051': ('tweakster', False, 'PL numarası Codex proje adından teyit edilecek'),
    'PL-052': ('extension-manager', False, 'PL numarası Codex proje adından teyit edilecek'),
    'PL-053': ('mutfak-atolyesi', True, 'Codex proje adı: “PL -053· Mutfak Atölyesi”'),
}

EK = [
    {
        'id': 'PL-051', 'name': 'Tweakster',
        'category': KATEGORILER[5][2], 'source': None,
        'description': 'PC hızlandırma uygulaması (masaüstü).',
        'fields': {
            'Durum': 'Bağımsız ürün deposu mevcut (private) · Notion kataloğunda kartı yok · özellik listesi depodan doğrulanacak',
            'Platform': 'Windows masaüstü (Codex: PL · Masaüstü · Tweakster)',
            'MVP ve temel akış': 'Kaynak: kullanıcı beyanı (28.10.2026) — “Tweakster (PC hızlandırma uygulaması)”. Ayrıntılı özellik listesi henüz bu klasöre aktarılmadı; tweakster deposunun README ve kaynak kodundan tamamlanacak.',
        },
    },
    {
        'id': 'PL-052', 'name': 'Extension Manager / Eklenti Yöneticisi',
        'category': KATEGORILER[5][2], 'source': None,
        'description': 'Eklenti yöneticisi (Chrome eklentisi).',
        'fields': {
            'Durum': 'Bağımsız ürün deposu mevcut (private) · Notion kataloğunda kartı yok · özellik listesi depodan doğrulanacak',
            'Platform': 'Chrome eklentisi (Codex: PL · Eklenti · Extension Manager)',
            'MVP ve temel akış': 'Kaynak: kullanıcı beyanı (28.10.2026) — “Extension Manager / Eklenti Yöneticisi (Chrome eklentisi)”. Ayrıntılı özellik listesi extension-manager deposundan tamamlanacak.',
            'Teknik bağımlılık ve sınır': 'PluginLabs Hub içindeki “Eklenti yöneticisi” ekranı ve Hub Tarayıcı Uzantısı (Browser Bridge) ile aynı ürün değildir; ayrı tutulur.',
        },
    },
    {
        'id': 'PL-053', 'name': 'Mutfak Atölyesi',
        'category': KATEGORILER[5][2], 'source': 'https://app.notion.com/p/4078aa13d8f981b193b9d30a0f596dd0',
        'description': None,
        'fields': {
            'Durum': 'Bağımsız ürün deposu mevcut (private) · Notion’da “01 · PluginLabs & Yazılım” sayfasında adı geçiyor, ürün kartı yok · özellik listesi depodan doğrulanacak',
            'Platform': 'Web (Codex: PL · Web · Mutfak Atölyesi)',
            'MVP ve temel akış': 'Ayrıntılı özellik listesi mutfak-atolyesi deposundan tamamlanacak.',
        },
    },
]

TR = str.maketrans({'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u',
                    'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c', '’': '', "'": ''})
SLUG_OZEL = {'PL-010': '1001-designs-pin-to-component', 'PL-052': 'extension-manager', 'PL-003': 'mind-palace-plugin-hub'}


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
