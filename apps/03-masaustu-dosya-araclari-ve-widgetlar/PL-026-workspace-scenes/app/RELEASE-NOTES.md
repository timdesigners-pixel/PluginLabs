# Workspace Scenes 0.1.0 — önizleme (Windows)

İlk sürüm. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `WorkspaceScenes-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `WorkspaceScenes-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-*.png` (Windows runner'ında alınan gerçek pencere görüntüleri, test verisiyle)

## Neler var
- Sahneler: bağlantı, klasör, uygulama (.exe/.lnk/.appref-ms/.url, isteğe bağlı argüman) ve dosyalardan oluşan sıralı açılış listeleri.
- Açmadan önce önizleme ve "Denetle" (eksik yollar işaretlenir); açılışta onay penceresi dizinin tamamını gösterir; sonuç adım adım işaretlenir.
- Çoklu bağlantı yapıştırma, sıralama, açılışa dahil et/çıkar, adımlar arası bekleme, kopyala, arşivle (silinmez), Geri al.
- Windows masaüstü kısayolu: sahneyi tek tıkla açar (yine onaylı).
- Kurulum süresi ölçümü: açılış süreleri ve elle kuruluma göre azalma yüzdesi.
- 7 şablon ve sahne adına göre gerekçeli eksik araç önerisi; MyMind (PluginLabs Hub, yerel) ile görev adına göre öneri — her istekte onay, yollar ve tam adresler gönderilmez, yanıt doğrulanır.
- JSON yedek (dışa/içe aktarma). Sahneler ve MyMind anahtarı Windows kasasıyla (DPAPI) şifreli.
- **Hiçbir şeyi kapatmaz**; hesaplara otomatik giriş yapmaz.

## Doğrulama
- Birim testleri (doğrulama, plan, ölçüm, şablon/öneri, içe/dışa aktarma, MyMind veri azaltma ve yanıt doğrulaması) ve gerçek Electron penceresinde otomatik duman testi (Windows runner + Linux xvfb): şablon, seçimler, yapıştırma, sıralama, denetim, ret/onay, sıralı açılış, kısayol, arşiv, yedek, `--sahne=` ile açılış, kalıcılık. Duman testinde "açma" günlüğe yazılır; gerçek uygulama/tarayıcı başlatılmaz.

## Sınırlar
- Pencere konumu/çoklu ekran yerleşimi yok (ikinci faz). Chrome oturum eklentisi yok.
- Linux/macOS paketi yok. Windows DPI, ekran okuyucu ve gerçek masaüstünde elle test yapılmadı; "kurulum süresinde ≥ %60 azalma" gerçek kullanıcıyla ölçülmedi.
