# PluginLabs uygulamaları — tek bakışta durum

Ayrıntılı ürün metinleri `apps/` altındaki README'lerde (Notion kaynaklı, kısaltılmaz). Bu sayfa yalnızca **hangi uygulamayı bugün açıp deneyebileceğinizi** gösterir. Durumlar 30.10.2026 tarihinde GitHub depolarından okunmuştur (PL-001–009 release durumu 30.10.2026 ~10:00 UTC, PL-010 ~11:10 UTC, PL-001/004/005/011 ~11:50 UTC, PL-012–014 31.10.2026 ~08:00 UTC itibarıyla doğrulandı) (depolar klonlanıp dosyalar sayıldı); "taranmadı" yazanlara bakılmamıştır.

## Bugün indirip denenebilenler

Windows sürümü GitHub release olarak yayımlanmış uygulamalar (paketler imzasızdır; SmartScreen uyarı verebilir).

| Uygulama | Sürüm | Nereden |
| --- | --- | --- |
| Flow Dock (PL-001) | v0.1.0 (tek exe) | https://github.com/timdesigners-pixel/flow-dock/releases/tag/v0.1.0 |
| Leo Helper (PL-002) | v0.9.0 (Tauri; kurulum + taşınabilir exe) | https://github.com/timdesigners-pixel/leo-helper/releases/tag/v0.9.0 |
| Mind Palace (PL-003) | **v1.11.0** (kurulum + taşınabilir .exe) | https://github.com/timdesigners-pixel/mind-palace/releases/tag/v1.11.0 |
| The Ultimate Scrapper (PL-004) | v0.6.0 (PluginLabs Scrapper) | https://github.com/timdesigners-pixel/the-ultimate-scrapper/releases/tag/v0.6.0 |
| Finansal Asistan (PL-005) | v0.1.0 (Windows, kapalı pilot) | https://github.com/timdesigners-pixel/finansal-asistan/releases/tag/v0.1.0 |
| Note Master (PL-006) | v0.1.0 (Windows kurulum/taşınabilir + Chrome zip) | https://github.com/timdesigners-pixel/note-master/releases/tag/v0.1.0 |
| Musebook (PL-007) | v0.1.0 (Windows kurulum/taşınabilir + Chrome zip) | https://github.com/timdesigners-pixel/musebook/releases/tag/v0.1.0 |
| Prompt Dünyası (PL-008) | v0.1.0 (Windows kurulum/taşınabilir + Chrome zip) | https://github.com/timdesigners-pixel/prompt-dunyasi/releases/tag/v0.1.0 |
| What the App! (PL-009) | v0.1.0 (Windows kurulum/taşınabilir + Chrome zip, BUILD-INFO) | https://github.com/timdesigners-pixel/what-the-app/releases/tag/v0.1.0 |
| Binbir Dizayn Stüdyo (PL-010) | studyo-v0.1.0 (Windows kurulum/taşınabilir, BUILD-INFO, Windows ekran görüntüleri) | https://github.com/timdesigners-pixel/1001-designs/releases/tag/studyo-v0.1.0 |
| WhatsApp Chat Viewer (PL-011) | v0.1.0 (Windows kurulum/taşınabilir, BUILD-INFO, Windows ekran görüntüleri) | https://github.com/timdesigners-pixel/whatsapp-chat-viewer/releases/tag/v0.1.0 |
| Dilekçe Oluştur (PL-012) | v0.1.0 (Windows kurulum/taşınabilir, BUILD-INFO, Windows ekran görüntüleri) | https://github.com/timdesigners-pixel/dilekce-olustur/releases/tag/v0.1.0 |
| Gadget Dünyası Companion (PL-013) | v0.1.0 (Windows kurulum/taşınabilir, BUILD-INFO, Windows ekran görüntüleri) | https://github.com/timdesigners-pixel/gadget-dunyasi-companion/releases/tag/v0.1.0 |
| Social Saves Organizer (PL-014) | v0.1.0 (Windows kurulum/taşınabilir, BUILD-INFO, Windows ekran görüntüleri) | https://github.com/timdesigners-pixel/social-saves-organizer/releases/tag/v0.1.0 |
| Mutfak Atölyesi (PL-053) | **v0.3.0** (Android test APK + Windows x64 zip + SHA256SUMS; imzasız/test) | https://github.com/timdesigners-pixel/mutfak-atolyesi/releases/tag/v0.3.0 |
| PluginLabs Hub | v0.3.0 (imzasız önizleme) | https://github.com/timdesigners-pixel/PluginLabs/releases/tag/v0.3.0 |
| Extension Manager (PL-051) | kaynaktan; Chrome'da "paketlenmemiş eklenti yükle" (Windows uygulaması değil) | https://github.com/timdesigners-pixel/extension-manager |

Mind Palace'ın ajan kipi (araç çağırma, görsel girdi, bilgisayar kullanımı) `main` dalındadır: `npm ci && npm run test:agent`. Eski `wip-agent-inapp` dalı bunun taslağıydı; `main` onu aşmıştır.

## Özet

- Windows sürümü yayımlanmış (GitHub release): PL-001–014, PL-053 ve Hub. PL-004–014 Windows paketleri GitHub Actions'ta Windows runner'ında derlenip otomatik duman testinden geçmiştir; gerçek Windows masaüstünde elle test, DPI ve ekran okuyucu testleri yapılmamıştır.
- Hub kataloğunda (Hub'dan kurulabilir): Mind Palace, Leo Helper, PluginLabs Scrapper, Finansal Asistan, Flow Dock. PL-006–014'ün Windows sürümleri henüz `pluginlabs-dagitim` deposuna yansıtılmadı.
- Sıradaki (Windows sürümü yok): PL-015–024 (yalnız plan), PL-025–050 ve PL-054 (fikir; depo yok), PL-052 Tweakster (yalnız plan).

## Tüm liste (PL-001 … PL-054)

| ID | Ad | Durum | Bağlantı |
| --- | --- | --- | --- |
| PL-001 | Flow Dock | Çalışan Windows uygulaması · **v0.1.0** (tek exe, imzasız) | https://github.com/timdesigners-pixel/flow-dock/releases/tag/v0.1.0 |
| PL-002 | Leo Helper | Çalışan Windows uygulaması · **v0.9.0** (Tauri/Rust; imzasız önizleme) | https://github.com/timdesigners-pixel/leo-helper/releases/tag/v0.9.0 |
| PL-003 | Mind Palace Plugin Hub | Çalışan Windows uygulaması · **v1.11.0** | https://github.com/timdesigners-pixel/mind-palace/releases/tag/v1.11.0 |
| PL-004 | The Ultimate Scrapper | Chrome eklentisi + Windows uygulaması · **v0.6.0** (PluginLabs Scrapper; imzasız önizleme) | https://github.com/timdesigners-pixel/the-ultimate-scrapper/releases/tag/v0.6.0 |
| PL-005 | Finansal Asistan | Windows uygulaması · **v0.1.0** (kapalı pilot, imzasız) | https://github.com/timdesigners-pixel/finansal-asistan/releases/tag/v0.1.0 |
| PL-006 | Note Master | Chrome eklentisi + Windows uygulaması · **v0.1.0** (imzasız önizleme) | https://github.com/timdesigners-pixel/note-master/releases/tag/v0.1.0 |
| PL-007 | Musebook | Chrome eklentisi + Windows uygulaması · **v0.1.0** (imzasız önizleme) | https://github.com/timdesigners-pixel/musebook/releases/tag/v0.1.0 |
| PL-008 | Prompt Dünyası | Chrome eklentisi + Windows uygulaması · **v0.1.0** (imzasız önizleme) | https://github.com/timdesigners-pixel/prompt-dunyasi/releases/tag/v0.1.0 |
| PL-009 | What the App! | Chrome eklentisi + Windows uygulaması · **v0.1.0** (imzasız önizleme) | https://github.com/timdesigners-pixel/what-the-app/releases/tag/v0.1.0 |
| PL-010 | 1001 Designs / Pin to Component | Design Replicator Chrome eklentisi v1.4.0 + **Binbir Dizayn Stüdyo** Windows uygulaması **studyo-v0.1.0** (1001 bileşen kütüphanesi, çevrimdışı; imzasız önizleme) | https://github.com/timdesigners-pixel/1001-designs/releases/tag/studyo-v0.1.0 |
| PL-011 | WhatsApp Chat Viewer | Windows uygulaması · **v0.1.0** (ZIP/TXT içe aktarma, arama, DPAPI şifreli yerel arşiv; imzasız önizleme) | https://github.com/timdesigners-pixel/whatsapp-chat-viewer/releases/tag/v0.1.0 |
| PL-012 | Dilekçe Oluştur | Windows uygulaması · **v0.1.0** (şablonlu dilekçe taslağı, eksik bilgi ve kaynaksız atıf denetimi, RTF/TXT; imzasız önizleme) | https://github.com/timdesigners-pixel/dilekce-olustur/releases/tag/v0.1.0 |
| PL-013 | Gadget Dünyası Companion | Windows uygulaması · **v0.1.0** (şarj cihazı/kulaklık × cihaz uyumluluğu, karşılaştırma; imzasız önizleme) | https://github.com/timdesigners-pixel/gadget-dunyasi-companion/releases/tag/v0.1.0 |
| PL-014 | Social Saves Organizer | Windows uygulaması · **v0.1.0** (Instagram dışa aktarımı/bağlantı listesi, etiket/not/koleksiyon, bozuk bağlantı denetimi, MyMind etiket önerisi; imzasız önizleme) | https://github.com/timdesigners-pixel/social-saves-organizer/releases/tag/v0.1.0 |
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
| PL-053 | Mutfak Atölyesi | Çalışan: web, Android test APK, Windows x64 zip · **v0.3.0** (GitHub release) | https://github.com/timdesigners-pixel/mutfak-atolyesi |
| PL-054 | MyWishlist | Fikir / Hub içi önizleme (ayrı depo yok) | — |
