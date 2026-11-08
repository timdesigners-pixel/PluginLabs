# Permission Radar 0.1.0 — önizleme (Windows)

PL-047 Permission Radar'ın ilk sürümü. Tarayıcı eklentilerinin izinlerini okunabilir Türkçe kartlara dönüştürür, bilinmeyen kapsamları açıkça etiketler ve sürüm güncellemelerindeki izin değişikliklerini gösterir. **Zararlı yazılım tespiti yaptığı iddiası taşımaz.** **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `PermissionRadar-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `PermissionRadar-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png`

## Neler var
- **Okunabilir Türkçe izin kartları:** `permissions`, `optional_permissions`, `host_permissions` ve `content_scripts` alanlarını kategori, etki düzeyi ve sade Türkçe açıklamayla kartlara dönüştürür.
- **Bilinmeyen kapsamların açık etiketlenmesi (%100):** Sözlükte yer almayan izinler ve standart dışı alan adı kalıpları `Bilinmeyen kapsam` olarak açıkça işaretlenir.
- **Sürümler arası izin değişim geçmişi:** Bir eklentinin yeni sürümü eklendiğinde yeni eklenen ve kaldırılan izinleri otomatik karşılaştırır.
- **Chrome yönetim ekranına yönlendirme:** Her eklenti için `chrome://extensions/?id=…` bağlantı yönlendirmesi sunar.
- **MyMind / yerel model izin açıklaması:** İzin kombinasyonlarının ne anlama geldiğini açıklar; yanıtta zararlı yazılım/virüs tespiti iddiası varsa denetimde filtrelenir.
- **Ekip politika raporu:** CSV (formül enjeksiyonu korumalı), Markdown politika raporu ve JSON yedek.

## Sınırlar
- Diğer eklentilerin iç verisine erişmez ve zararlı yazılım tespiti iddiası taşımaz. Chrome uzantısı (canlı `chrome.management` köprüsü) ve Linux/macOS paketleri bu sürümde yoktur.
