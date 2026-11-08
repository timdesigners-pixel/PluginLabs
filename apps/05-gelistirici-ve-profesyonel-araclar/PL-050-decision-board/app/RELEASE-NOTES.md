# Decision Board 0.1.0 — önizleme (Windows)

PL-050 Decision Board'un ilk sürümü. Seçenekleri, kriterleri ve ağırlıkları kaynaklı bir karar matrisinde karşılaştırır, her puanın hangi veri ve ağırlıktan türediğini (%100 izlenebilirlik) gösterir ve tarihçeli karar günlüğü (ADR) üretir. **Kullanıcı tercihleri yerine modelin değerlerini dayatmaz; finansal/hukuki kararlar için uzman süreci yerine geçmez.** **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `DecisionBoard-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `DecisionBoard-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png`

## Neler var
- **Kaynaklı karar matrisi ve puan türetimi:** Seçenek × kriter tablosunda her hücrenin puanı (`1–10`), normalize ağırlığı (`%`), ağırlıklı katkısı, veri kaynağı ve kanıt notu açıkça görünür.
- **%100 izlenebilirlik kapısı:** Kaynağı veya gerekçesi eksik hücre varsa açıkça işaretlenir ve tüm hücreler kaynaklandırılana kadar karar günlüğüne kayıt yapılması engellenir.
- **Artı/eksi listesi ve ağırlık duyarlılık analizi:** Seçeneklerin kriter bazlı güçlü/zayıf yönleri ve kriter ağırlıkları ±%20 değiştiğinde sıralamanın değişip değişmediği hesaplanır.
- **Tercih dayatmayan yapay zekâ denetimi:** Yerel kural denetimi ve isteğe bağlı onaylı MyMind (Hub) veya yerel model (loopback) yalnız eksik kriter ve çelişki önerir; modelin kazanan seçme veya ağırlık dayatma girişimleri otomatik filtrelenir.
- **Uzman süreci sınırı:** Finansal, vergisel veya hukuki kriterler algılandığında uzman incelemesi uyarısı gösterilir ve ADR çıktısına eklenir.
- **Karar günlüğü (ADR) ve dışa aktarma:** Tarihçeli karar kayıtları, ADR Markdown (`.md`), CSV (formül enjeksiyonu korumalı `.csv`) ve JSON yedek.

## Sınırlar
- İlk sürüm manuel kaynaklı tek yerel panodur; finansal ve hukuki kararlar için uzman süreci yerine geçmez. Çok kullanıcılı bulut ortak alanı (Pro), Chrome eklentisi ve Linux/macOS paketleri bu sürümde yoktur.
