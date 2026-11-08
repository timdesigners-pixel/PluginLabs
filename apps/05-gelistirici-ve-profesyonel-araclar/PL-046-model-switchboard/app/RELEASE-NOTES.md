# Model Switchboard 0.1.0 — önizleme (Windows)

PL-046 Model Switchboard'un ilk sürümü. Resmi API anahtarıyla tek panelde model kataloğu, görev başı istek maliyeti tahmini ve aynı görevde iki sağlayıcının yan yana değerlendirmesini sunar. **Tüketici web hesabı çerezi kullanılmaz.** **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `ModelSwitchboard-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `ModelSwitchboard-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png`

## Neler var
- **Tarihli model fiyat kataloğu:** İlk sürümde iki resmi sağlayıcı (OpenAI ve Anthropic); her modelin 1M girdi/çıktı token fiyatı ve fiyat doğrulama tarihi görünür.
- **Görev başı gerçek maliyet görünürlüğü (%100):** Her karşılaştırmadan önce tahmini maliyet, tamamlandığında girdi/çıktı token sayısı ve gerçek USD maliyeti gösterilir.
- **Kullanıcı bütçe tavanı (aşım hedefi 0):** Kullanıcı USD bütçe tavanı belirler; tavanı aşacak görevler çalıştırılmadan engellenir ve sayacı tutulur.
- **Yan yana değerlendirme:** Aynı görev isteminde iki modelin yanıtı, gecikmesi (`ms`), maliyeti (`$`) ve ölçüt bazlı rubrik kalite puanı (`0–100`) karşılaştırılır.
- **Resmi API anahtarı kasası:** Anahtarlar Windows kasasında (DPAPI) şifreli saklanır; tüketici web oturumu çerezleri reddedilir. API faturası sağlayıcı tarafından ayrıca ücretlendirilir.
- **Kayıtlı testlere bağlı model önerisi:** Görev türüne göre en uygun model kayıtlı benchmark sonuçlarına bağlanır; isteğe bağlı onaylı MyMind (Hub) veya yerel model (loopback) önerisinde katalogda olmayan model ve kayıtlı olmayan test kimlikleri denetimde atılır.
- **Dışa aktarma:** CSV (formül enjeksiyonu korumalı), Markdown ve JSON yedek.

## Sınırlar
- İlk sürüm iki sağlayıcı (OpenAI ve Anthropic) katalog şemasıyla sınırlıdır; ekip bütçe/anahtar politikası (Pro), Chrome eklentisi ve Linux/macOS paketleri bu sürümde yoktur.
