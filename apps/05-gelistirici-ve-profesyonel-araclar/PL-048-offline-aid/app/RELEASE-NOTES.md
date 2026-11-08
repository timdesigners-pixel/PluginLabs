# Offline Aid 0.1.0 — önizleme (Windows)

PL-048 Offline Aid'in ilk sürümü. Uyumlu yerel modellerle ve düşük donanım için modelsiz yedek motorla metin özetleme ve düzenleme işlemlerini cihazda çalıştırır (**dışa giden model isteği: 0**). **Çevrimdışı diye tüm risklerin yok olduğu iddia edilmez.** **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `OfflineAid-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `OfflineAid-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png`

## Neler var
- **Onaylı yerel model ailesi ve modelsiz yedek motor:** İlk sürüm tek onaylı model ailesini (Qwen 2.5 Instruct 1.5B / 3B / 7B GGUF) ve ağsız/düşük donanım ortamı için yerleşik modelsiz kural tabanlı motoru içerir.
- **Cihaz kaynak kontrolü:** Sistem RAM ve CPU çekirdek sayısını tarar; seçilen modelin en az RAM gereksinimi karşılanmıyorsa düşük donanım uyarısı verir ve uygun alternatifi önerir.
- **Görünür model lisansı ve güncelleme kaynağı:** Her modelin lisansı (`Apache-2.0`, `Qwen Research License`), RAM/VRAM gereksinimi ve SHA-256 doğrulamalı güncelleme kaynağı açıkça listelenir.
- **Dışa giden model isteği sıfır:** Yalnız bu bilgisayardaki (`127.0.0.1` / `localhost`) yerel çıkarım sunucularına izin verilir; dış ağ adresleri engellenir.
- **Hassas veri maskeleme ve sınır bilinci:** Yerel LLM çıkarımından önce e-posta, telefon ve IBAN verileri maskelenir; çevrimdışı çalışmanın tüm riskleri yok etmediği açıkça belirtilir.
- **Donanım bazlı gecikme raporu ve dışa aktarma:** Her görevin cihaz donanım profili ve gecikme süresi (`ms`) kaydedilir; `.txt`, `.md` ve JSON yedek olarak dışa aktarılır.

## Sınırlar
- İlk sürüm tek onaylı yerel model ailesi ve yerel kural motoruyla sınırlıdır; kurumsal filo dağıtımı, Chrome seçili içerik eklentisi ve Linux/macOS paketleri bu sürümde yoktur.
