# Context Kit 0.1.0 — önizleme (Windows)

PL-045 Context Kit'in ilk Windows masaüstü sürümü. Seçilen dosya ve sayfalardan **boyut ve token sınırı olan, önizlenebilir AI bağlam paketleri** hazırlar; göreve göre dosya ve parçaları sıralar (tüm depoyu otomatik göndermez); **sır/API anahtarı/kişisel veri maskeleme** ve **kaynak içi istem enjeksiyonu işaretlemesi** uygular.

## Dosyalar
- `ContextKit-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne)
- `ContextKit-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png`

## Neler var
- **Göreve göre sıralama ve bütçeleme:** Görev terimlerine göre dosya ve sayfa parçalarını puanlar; token ve bayt bütçesi içinde kalarak alakasız büyük dosyaları eler (tüm depoyu otomatik göndermez).
- **Hariç tutma kuralları ve sır filtresi:** `node_modules/**`, `.git/**`, `.env*`, `dist/**`, `*.lock` yollarını otomatik dışlar; OpenAI/AWS/GitHub/JWT anahtarlarını, parolaları ve e-posta/telefon kişisel verilerini maskeler.
- **İstem enjeksiyonu koruması:** Kaynak kod ve sayfa içindeki prompt injection kalıplarını işaretler ve tüm kaynakları güvenilmeyen veri (`UNTRUSTED_DATA`) sınırlarıyla sarar (kaynak içi talimatlar asla talimat sayılmaz).
- **Doğrulama ölçütü:** Örnek test görevinde gerekli 4 bağlam kaynağını %100 kapsar (hedef ≥ %90) ve paket boyutunda %75,4 azalma sağlar (hedef ≥ %40).
- **Çoklu dışa aktarım ve MyMind:** Kullanıcı onayıyla Markdown (`.md`), XML (`.xml`) ve JSON (`.json`) bağlam paketi üretir; yalnız loopback (`127.0.0.1`/`localhost`) üzerinden MyMind veya yerel model ile kısa bağlam özeti sunar.
