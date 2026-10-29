# GitHub repo hiyerarşisi planı

Sürüm 1.0 · 29.10.2026 · Hesap: `timdesigners-pixel`

## 1. Yapı

```
timdesigners-pixel/
├── PluginLabs                      ← şemsiye depo (public): Hub + ortak çekirdek + 53 uygulamanın kayıt/ön geliştirme alanı
│   ├── AGENTS.md / CLAUDE.md       ← Codex + Claude Code ortak kuralları
│   ├── registry/projects.json      ← PL-001–PL-053 makine okunur kayıt (tek doğruluk kaynağı)
│   ├── apps/
│   │   ├── 01-mevcut-urunler-ve-fikirler/PL-001-flow-dock/README.md   → bağımsız depo: flow-dock
│   │   ├── 02-kisisel-arsiv-ve-chrome-araclari/PL-016-tab-atlas/…     → henüz depo yok (ön geliştirme burada)
│   │   ├── 03-… 04-… 05-…
│   │   └── 06-hub-disi-urun-depolari/PL-053-mutfak-atolyesi/README.md → bağımsız depo: mutfak-atolyesi
│   ├── src/ ui/ sdk/ browser-extension/   ← Hub uygulaması (mevcut, değişmedi)
│   └── docs/ortak-calisma/         ← protokol, aktif işler, devir, kararlar
│
├── flow-dock          (private)   PL-001
├── leo-helper         (private)   PL-002
├── mind-palace        (private)   PL-003
├── 1001-designs       (public)    PL-010 ile ilişkili (Design Replicator) — eşleşme teyit edilecek
├── tweakster          (private)   PL-051 — numara teyit edilecek
├── extension-manager  (private)   PL-052 — numara teyit edilecek
├── mutfak-atolyesi    (private)   PL-053
└── pl-<slug>          (yeni)      olgunlaşan her uygulama için ayrı depo
```

## 2. Neden şemsiye + bağımsız depo

- 53 uygulamanın 46’sı henüz fikir/plan aşamasında. Her biri için şimdiden boş depo açmak bakım yükü yaratır ve “yayımlanmış ürün” izlenimi verir (Notion ilkesi: platform dürüstlüğü).
- Fikir/plan aşamasındaki ürün `apps/…` klasöründe README, tasarım notu ve küçük prototiple başlar. Codex ve Claude Code aynı depoda aynı kayıtla çalışır.
- Çalışan kodu olan ürün kendi deposuna geçer: bağımsız sürüm, ayrı CI, ayrı izinler, ayrı yayın.

## 3. Bağımsız depoya geçiş (mezuniyet) koşulları

Aşağıdakilerin tamamı sağlandığında ürün `pl-<slug>` adlı yeni depoya taşınır:

1. Çalışan bir prototip veya `src/` klasörü oluşmuştur (yalnız doküman değil).
2. Notion’daki “MVP ve temel akış” için kabul ölçütleri yazılmıştır.
3. Ürünün kendi derleme/test komutu vardır.
4. Kullanıcı onayı alınmıştır (depo açma geri alınması zor bir işlemdir).

Geçişte:

- Yeni depo: `timdesigners-pixel/pl-<slug>`, varsayılan **private**, açıklama = registry `summary`, konular: `pluginlabs`, `pl-0xx`, platform etiketleri (`windows`, `linux`, `macos`, `chrome-extension`, `web`).
- Yeni depoya `AGENTS.md` + `CLAUDE.md` (`@AGENTS.md`) + `README.md` (apps klasöründeki dosyanın tam kopyası) eklenir.
- `apps/…/README.md` silinmez; “Geliştirme deposu” satırı yeni depoyu gösterecek şekilde güncellenir, prototip kodu `docs/arsiv/` altına değil, git geçmişiyle birlikte yeni depoya taşınır.
- `registry/projects.json` içinde `repo` alanı doldurulur, `verified: true` yapılır.
- Codex’teki `PL-0XX` projesinin birincil klasörü yeni deponun yerel klonu olur, ikinci klasör PluginLabs olarak kalır; Claude Code tarafı `scripts/claude-code-baglanti.ps1` ile yenilenir.

## 4. Adlandırma

| Öğe | Biçim | Örnek |
| --- | --- | --- |
| Uygulama klasörü | `apps/<NN-kategori>/<PL-ID>-<slug>/` | `apps/02-kisisel-arsiv-ve-chrome-araclari/PL-016-tab-atlas/` |
| Yeni depo | `pl-<slug>` | `pl-tab-atlas` |
| Mevcut depolar | Adı korunur (yeniden adlandırma bağlantıları bozar) | `flow-dock` |
| Codex projesi | `PL-0XX · <Ürün>` | `PL-016 · Tab Atlas` |
| Dal | `codex/PL-0XX-…`, `claude/PL-0XX-…` | `claude/PL-016-oturum-kaydi` |
| Sürüm etiketi | `v<semver>` (ürün deposunda) | `v0.1.0` |

## 5. Yayın aşamaları

| Aşama | Kapsam | Durum (29.10.2026) |
| --- | --- | --- |
| 1 | Şemsiye depoda hiyerarşi, registry ve 53 README; ortak çalışma protokolü | Bu PR |
| 2 | Mevcut 7 ürün deposuna `AGENTS.md` + `CLAUDE.md` + PluginLabs bağlantılı README | Bekliyor — depolara erişim onayı gerekiyor |
| 3 | Codex’teki PL-001–053 projelerinde ikinci klasör doğrulaması ve Claude Code `additionalDirectories` kurulumu | Bekliyor — bilgisayar bağlantısı gerekiyor |
| 4 | P0 adaylarının (PL-001, PL-016, PL-008, PL-045 …) mezuniyet değerlendirmesi | Bekliyor — kullanıcı kararı |
