# Devir · Hub 0.4.27 — PL-040–050 katalog kaydı

- **Ajan / dal:** Claude Code (zamanlanmış görev) · `claude/optimistic-goodall-ospg9v` (taban `main` 4bf9be5)
- **Tarih:** 08.11.2026

## Gözlenen durum
- PL-001–059'un tamamında yayımlanmış Windows sürümü var. PL-040–050 için `pluginlabs-dagitim` `insight-table-v0.1.0` … `decision-board-v0.1.0` sürümleri 07–08.11.2026'da Windows runner'da yayımlanmış (kurulum + taşınabilir exe + SHA256SUMS + BUILD-INFO + `windows-masaustu-*.png`).
- Bu 11 uygulama Hub kataloğunda yoktu (MH-7) ve `docs/UYGULAMALAR.md` onları hâlâ “Fikir” olarak gösteriyordu.

## Yapılan
- `src/catalog.cjs`: 11 kayıt (taşınabilir exe; boyut ve SHA-256 GitHub sürüm dosyası digest'inden, mevcut SHA256SUMS dosyalarıyla çapraz denetlendi).
- `registry/projects.json`: PL-040–050 `status` + `release`.
- `docs/UYGULAMALAR.md`, `README.md`, `RELEASE-NOTES.md`; Hub sürümü 0.4.27.

## Kanıt
| Denetim | Sonuç |
| --- | --- |
| `npm test` (Linux, Node 22) | 33/33 geçti |
| `npm run test:ui` | Çalıştırılmadı — Electron ikilisi vekil üzerinden indirilemedi (HTTP 504) |
| exe indirme + SHA-256 | Çalıştırılmadı — büyük dosya indirmeleri 504 verdi; GitHub digest + SHA256SUMS kullanıldı |
| Windows Hub derlemesi / ekran | Birleştirme sonrası `hub-windows.yml` |

## Sonraki adım
1. İnsan incelemesi ve birleştirme.
2. `hub-windows.yml` `publish=true` → Hub v0.4.27 (MH-8); iş akışı test:ui ve gerçek Hub ekranlarını Windows'ta üretir.
3. Hub'dan en az bir PL-040–050 uygulamasının kurulumunu Windows'ta denemek.
