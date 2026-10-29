# GitHub repo hiyerarşisi planı

Sürüm 1.1 · 30.10.2026 · Hesap: `timdesigners-pixel`
Önceki sürüm (1.0, “mezuniyet” modeli): [`docs/arsiv/REPO-HIYERARSISI v1.0 29.10.2026.md`](arsiv/REPO-HIYERARSISI%20v1.0%2029.10.2026.md)

## 0. Sürüm 1.1’deki karar değişikliği

- **1.0:** Ürün, çalışan kod oluşunca kendi deposuna “mezun” olacaktı; o güne kadar yalnız PluginLabs içindeki `apps/…` klasöründe yaşayacaktı.
- **1.1 (kullanıcı kararı, 29.10.2026, Codex oturumu):** Deposu olmayan her ürün için **şimdiden private depo** açılır. Codex bu işi başlattı; 30.10.2026 itibarıyla 10 yeni depo GitHub’da doğrulandı (aşağıda §2). Kalan ürünler için iş Codex’te sürüyor (`docs/ortak-calisma/AKTIF-ISLER.md`).
- `apps/…/README.md` ve `registry/projects.json` yine tek doğruluk kaynağıdır; ürün deposu açılınca yalnız `repo` alanı doldurulur.

## 1. Yapı

```
timdesigners-pixel/
├── PluginLabs                      ← şemsiye depo (public): Hub + ortak çekirdek + tüm uygulamaların kayıt/ön geliştirme alanı
│   ├── AGENTS.md / CLAUDE.md       ← Codex + Claude Code ortak kuralları
│   ├── registry/projects.json      ← PL-001–PL-054 makine okunur kayıt (tek doğruluk kaynağı)
│   ├── apps/<NN-kategori>/<PL-ID>-<slug>/README.md
│   ├── src/ ui/ sdk/ browser-extension/   ← Hub uygulaması
│   └── docs/ortak-calisma/         ← protokol, aktif işler, devir, kararlar
│
└── <ürün deposu> (private, ürün başına bir tane)
```

## 2. Doğrulanmış ürün depoları (30.10.2026)

Kaynak: `gh repo list timdesigners-pixel` (kullanıcının bilgisayarından, 30.10.2026 02:40).

| PL | Depo | Görünürlük | Oluşturulma | Kod durumu |
| --- | --- | --- | --- | --- |
| PL-001 | flow-dock | private | 28.10.2026 | mevcut |
| PL-002 | leo-helper | private | 22.10.2026 | mevcut |
| PL-003 | mind-palace | private | 15.09.2026 | mevcut |
| PL-004 | the-ultimate-scrapper | private | 29.10.2026 (Codex) | henüz yok |
| PL-005 | finansal-asistan | private | 29.10.2026 (Codex) | henüz yok |
| PL-006 | note-master | private | 29.10.2026 (Codex) | henüz yok |
| PL-007 | musebook | private | 29.10.2026 (Codex) | henüz yok |
| PL-008 | prompt-dunyasi | private | 29.10.2026 (Codex) | henüz yok |
| PL-009 | what-the-app | private | 29.10.2026 (Codex) | henüz yok |
| PL-010 | 1001-designs | public | 18.09.2026 | mevcut |
| PL-011 | whatsapp-chat-viewer | private | 29.10.2026 (Codex) | henüz yok |
| PL-012 | dilekce-olustur | private | 29.10.2026 (Codex) | henüz yok |
| PL-013 | gadget-dunyasi-companion | private | 29.10.2026 (Codex) | henüz yok |
| PL-014 | social-saves-organizer | private | 29.10.2026 (Codex) | henüz yok |
| PL-051 | extension-manager | private | 28.10.2026 | mevcut |
| PL-052 | tweakster | private | 28.10.2026 | mevcut |
| PL-053 | mutfak-atolyesi | private | 25.10.2026 | mevcut |

PL-015–050 ve PL-054 için GitHub’da henüz depo yok; ön geliştirme `apps/…` klasöründe sürer.

## 3. Yeni ürün deposu açılınca

- Ad: `<slug>` (Codex’in kullandığı biçim; `pl-` öneki kullanılmıyor). Varsayılan **private**. Açıklama: `PL-0XX · <Ürün> — PluginLabs ürün planı; …`.
- Depoya `AGENTS.md` + `CLAUDE.md` (`@AGENTS.md`) + `README.md` (apps klasöründeki dosyanın tam kopyası) eklenir.
- `apps/…/README.md` silinmez; “Geliştirme deposu” satırı yeni depoyu gösterir.
- `scripts/uret-uygulama-hiyerarsisi.py` içindeki `REPOLAR` sözlüğüne satır eklenir ve betik `--force` ile çalıştırılır; `registry/projects.json` ve README’ler birlikte güncellenir. `verified: true` yalnız depo GitHub’da görüldükten sonra yazılır.
- Codex’teki `PL-0XX` projesinin birincil klasörü deponun yerel klonu olur, ikinci klasör PluginLabs kalır; Claude Code tarafı `scripts/claude-code-baglanti.ps1` ile yenilenir.

## 4. Adlandırma

| Öğe | Biçim | Örnek |
| --- | --- | --- |
| Uygulama klasörü | `apps/<NN-kategori>/<PL-ID>-<slug>/` | `apps/02-kisisel-arsiv-ve-chrome-araclari/PL-016-tab-atlas/` |
| Yeni depo | `<slug>` | `note-master` |
| Mevcut depolar | Adı korunur (yeniden adlandırma bağlantıları bozar) | `flow-dock` |
| Codex projesi | `PL-0XX · <Ürün>` | `PL-016 · Tab Atlas` |
| Dal | `codex/PL-0XX-…`, `claude/PL-0XX-…` | `claude/PL-016-oturum-kaydi` |
| Sürüm etiketi | `v<semver>` (ürün deposunda) | `v0.1.0` |

## 5. Yayın aşamaları

| Aşama | Kapsam | Durum (30.10.2026) |
| --- | --- | --- |
| 1 | Şemsiye depoda hiyerarşi, registry ve README’ler; ortak çalışma protokolü | Tamamlandı (PR #8) |
| 2 | Deposu olmayan ürünler için private depo | Kısmen: 10 depo açıldı (PL-004–009, PL-011–014); kalanı Codex’te |
| 3 | Ürün depolarına `AGENTS.md` + `CLAUDE.md` + PluginLabs bağlantılı README | Bekliyor — depolara erişim onayı gerekiyor |
| 4 | Codex’teki PL-001–054 projelerinde ikinci klasör ve Claude Code `additionalDirectories` | 53/53 + PL-054 doğrulandı (30.10.2026) |
