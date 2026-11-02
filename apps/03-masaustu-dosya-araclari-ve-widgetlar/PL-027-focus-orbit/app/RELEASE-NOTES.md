# Focus Orbit 0.1.0 — önizleme (Windows)

İlk çalışan sürüm. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `FocusOrbit-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `FocusOrbit-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri, test verisi)

## Neler var
- **Tek görev + adımlar:** seansın tek görevi; elle ya da MyMind önerisiyle adımlar (işaretle, sırala, kaldır).
- **Odak zamanlayıcısı:** Klasik 25/5, Derin çalışma 50/10, Kısa adım 15/3 ya da özel süre; her N odakta bir uzun mola. Duraklat, sürdür, +5 dk, erken bitir. Zaman damgasından hesaplanır (uyku/bekleme sonrası kaymaz).
- **Odak balonu:** her zaman üstte, sürüklenebilir küçük pencere (konumu hatırlanır): kalan süre, ilerleme halkası, görev; duraklat/sürdür, "Dağıldım", ana pencere, gizle. Gizlemek sayacı durdurmaz.
- **Mola hatırlatmaları:** odak ve mola bitişinde Windows bildirimi; mola isteğe bağlı olarak kendiliğinden başlar.
- **Dikkat listesi:** uzak durulacak siteler (açık/kapalı, geri alınabilir); seans boyunca hatırlatılır. "Dağıldım" kaydı isteğe bağlı site ve notla tutulur; en çok dikkat dağıtanlar yalnız bu kayıtlardan.
- **Bu hafta:** tamamlanan seans / haftalık hedef (varsayılan 3), odak dakikası, kesinti / seans ve geçen haftaya göre eğilim, gün çubukları.
- **Seans kayıtları:** tamamlandı / erken bitti, odak süresi, adım ve kesinti sayısı; MyMind seans sonu özeti (siz kaydedince yazılır).
- **MyMind (PluginLabs Hub üzerinden, isteğe bağlı):** görev parçalamada yalnız görev başlığı; özette görev, süreler, kesinti sayısı ve adımlar gönderilir — kesinti siteleri ve notlar gönderilmez. Her istekte onay penceresi; yanıt doğrulanır (kapatma/silme öneren adımlar atılır).
- Ctrl+Enter başlat/duraklat/sürdür, Ctrl+1–4 bölümler; hareketi azalt seçeneği (sistem ayarı da izlenir); JSON yedek (içe aktarma yineleme yapmaz).

## Sınırlar
- Siteler **engellenmez**; dikkat listesi bir hatırlatmadır (Chrome eklentisi sonraki sürüm). İşletim sistemi düzeyinde uygulama kapatma yoktur ve eklenmeyecektir.
- Ekran, pencere ya da tarayıcı izlenmez; kesintiler yalnız kullanıcı bildirimidir.
- Linux/macOS paketi yok. Doğrulama: birim testleri ve gerçek Electron penceresinde otomatik duman testi (Windows runner + Linux xvfb). Notion ölçütleri (haftada ≥3 tamamlanan seans, kesintilerde azalma) gerçek kullanıcıyla ölçülmedi; uygulama ikisini de yerel gösterir. Windows DPI, ekran okuyucu ve gerçek masaüstünde elle test yapılmadı.
