# PluginLabs uygulamaları — tek bakışta durum

Ayrıntılı ürün metinleri `apps/` altındaki README'lerde (Notion kaynaklı, kısaltılmaz). Bu sayfa yalnızca **hangi uygulamayı bugün açıp deneyebileceğinizi** gösterir. Durumlar 30.10.2026 tarihinde GitHub depolarından okunmuştur (depolar klonlanıp dosyalar sayıldı); "taranmadı" yazanlara bakılmamıştır.

## Bugün indirip denenebilenler

| Uygulama | Sürüm | Nereden |
| --- | --- | --- |
| Mind Palace (PL-003) | v1.10.0 (kurulum + taşınabilir .exe) | https://github.com/timdesigners-pixel/mind-palace/releases/tag/v1.10.0 |
| Leo Helper (PL-002) | v0.8.0 (ZIP; `start.cmd` ya da `LeoHelper.exe`) | https://github.com/timdesigners-pixel/leo-helper/releases/tag/v0.8.0 |
| PluginLabs Hub | v0.3.0 (imzasız önizleme) | https://github.com/timdesigners-pixel/PluginLabs/releases/tag/v0.3.0 |
| Mutfak Atölyesi (PL-053) | 0.3.0 — release yok; Windows EXE/Android APK depodaki derleme betiklerinden üretilir | https://github.com/timdesigners-pixel/mutfak-atolyesi |
| Flow Dock (PL-001) | kaynaktan; `Build.ps1` ile derlenir | https://github.com/timdesigners-pixel/flow-dock |
| Extension Manager (PL-051) | kaynaktan; Chrome'da "paketlenmemiş eklenti yükle" | https://github.com/timdesigners-pixel/extension-manager |

Mind Palace'ın ajan kipi (araç çağırma, görsel girdi, bilgisayar kullanımı) `main` dalındadır: `npm ci && npm run test:agent`. Eski `wip-agent-inapp` dalı bunun taslağıydı; `main` onu aşmıştır.

## Özet

- Çalışan/indirilebilir: Mind Palace, Leo Helper, Mutfak Atölyesi, Hub.
- Kaynak kodu var, release yok: Flow Dock, Extension Manager.
- Yalnız plan (depoda 2 dosya: README + PRODUCT-PLAN): 21 ürün (Finansal Asistan, Scrapper, Note Master, Tweakster dahil).

## Tüm liste (PL-001 … PL-054)

| ID | Ad | Durum | Bağlantı |
| --- | --- | --- | --- |
| PL-001 | Flow Dock | Windows kaynak kodu (C#, WinForms), release yok · `Build.ps1` ile derlenir | https://github.com/timdesigners-pixel/flow-dock |
| PL-002 | Leo Helper | Çalışan Windows uygulaması · **v0.8.0** | https://github.com/timdesigners-pixel/leo-helper/releases/tag/v0.8.0 |
| PL-003 | Mind Palace Plugin Hub | Çalışan Windows uygulaması · **v1.10.0** (main 1.11.0) | https://github.com/timdesigners-pixel/mind-palace/releases/tag/v1.10.0 |
| PL-004 | The Ultimate Scrapper | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/the-ultimate-scrapper |
| PL-005 | Finansal Asistan | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/finansal-asistan |
| PL-006 | Note Master | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/note-master |
| PL-007 | Musebook | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/musebook |
| PL-008 | Prompt Dünyası | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/prompt-dunyasi |
| PL-009 | What the App! | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/what-the-app |
| PL-010 | 1001 Designs / Pin to Component | Genel depo: 109 HTML tasarım dosyası (kod uygulaması değil) | https://github.com/timdesigners-pixel/1001-designs |
| PL-011 | WhatsApp Chat Viewer | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/whatsapp-chat-viewer |
| PL-012 | Dilekçe Oluştur | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/dilekce-olustur |
| PL-013 | Gadget Dünyası Companion | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/gadget-dunyasi-companion |
| PL-014 | Social Saves Organizer | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/social-saves-organizer |
| PL-015 | YouTube Shelf | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/youtube-shelf |
| PL-016 | Tab Atlas | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/tab-atlas |
| PL-017 | Page Capsule | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/page-capsule |
| PL-018 | Form Flow | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/form-flow |
| PL-019 | Compare Lens | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/compare-lens |
| PL-020 | Page Change Radar | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/page-change-radar |
| PL-021 | Desk Tidy | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/desk-tidy |
| PL-022 | Twin Finder | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/twin-finder |
| PL-023 | Clip Vault | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/clip-vault |
| PL-024 | Snap OCR | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/snap-ocr |
| PL-025 | File Pilot | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-026 | Workspace Scenes | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-027 | Focus Orbit | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-028 | Quick Convert | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-029 | Screenshot Studio | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-030 | Daily Brief Widget | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-031 | Source Trail | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-032 | Read Partner | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-033 | Text Forge | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-034 | Parallel Translate | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-035 | Meeting Trace | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-036 | Voice Note Orbit | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-037 | Mail Triage | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-038 | Action Inbox | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-039 | Notion Bridge | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-040 | Insight Table | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-041 | Dev Patch Notes | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-042 | API Pocket | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-043 | Access Lens | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-044 | Design Token Scout | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-045 | Context Kit | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-046 | Model Switchboard | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-047 | Permission Radar | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-048 | Offline Aid | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-049 | Invoice Inbox | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-050 | Decision Board | Fikir / Hub içi önizleme (ayrı depo yok) | — |
| PL-051 | Extension Manager / Eklenti Yöneticisi | Chrome eklentisi kaynak kodu (11 dosya, v1.0.0), release yok | https://github.com/timdesigners-pixel/extension-manager |
| PL-052 | Tweakster | Yalnız plan (depoda kod yok) | https://github.com/timdesigners-pixel/tweakster |
| PL-053 | Mutfak Atölyesi | Çalışan: web, Android test APK, Windows WPF EXE, **v0.3.0** · GitHub release yok (derleme depodan) | https://github.com/timdesigners-pixel/mutfak-atolyesi |
| PL-054 | MyWishlist | Fikir / Hub içi önizleme (ayrı depo yok) | — |
