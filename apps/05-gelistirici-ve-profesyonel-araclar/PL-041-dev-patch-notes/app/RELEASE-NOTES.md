# Dev Patch Notes 0.1.0 — önizleme (Windows)

PL-041 Dev Patch Notes'un ilk sürümü. Seçilen git diff ve commit listelerinden **kaynak commit bağlantıları içeren düzenlenebilir sürüm notları** hazırlar; **API anahtarı ve sır taraması** yapar ve **kanıtsız test geçişi / performans artışı iddialarını engeller** (uydurma teslim iddiası sıfır).

## Dosyalar
- `DevPatchNotes-0.1.0-Windows-x64.exe` — kurulum (NSIS)
- `DevPatchNotes-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png`

## Neler var
- **İçe alma:** `git log`, `git log --oneline` ve `git diff` metinlerini yapıştırma, pano ya da `.log`/`.diff`/`.txt` dosyasından okuma.
- **Kategorilendirme ve kaynak bağlantısı:** Kırıcı Değişiklikler, Özellikler, Hata Düzeltmeleri, Güvenlik, Dokümantasyon ve Bakım başlıklarına ayırma; her maddeye kaynak commit SHA ve bağlantısı ekleme.
- **API anahtarı ve sır taraması:** Commit mesajlarında veya diff içinde unutulan sırları (`sk-...`, `ghp_...`, `AKIA...`, PEM) yakalayıp maskeleme.
- **Kanıtsız iddia engeli:** Kaynakta kanıtı olmayan test geçişi veya performans artışı iddialarını otomatik ayıklama ve engelleme.
- **Dışa aktarma:** Türkçe Markdown, Keep a Changelog ve JSON dışa aktarma; otomatik commit, push veya yayın yok.
- **MyMind / yerel model:** Onaylı davranış değişikliği özeti; uydurma commit SHA ve kanıtsız iddialar denetimde reddedilir.
