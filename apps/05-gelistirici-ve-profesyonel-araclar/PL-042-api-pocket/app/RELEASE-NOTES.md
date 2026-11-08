# API Pocket 0.1.0 — önizleme (Windows)

PL-042 API Pocket'ın ilk sürümü. API isteklerini **şablonlarla** gönderir, **ortam değişkenlerini** kullanır, **sırları işletim sistemi kasasında** saklar (**günlükte sır sızıntısı sıfır**), yazma yöntemlerinde **ek önizleme** sunar ve **yanıt alanlarını açıklar**.

## Dosyalar
- `ApiPocket-0.1.0-Windows-x64.exe` — kurulum (NSIS)
- `ApiPocket-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png`

## Neler var
- **İstek şablonları ve ortam değişkenleri:** `{{BASE_URL}}`, `{{PROJECT_ID}}`, `{{API_KEY}}` yer tutucularıyla hızlı GET ve kullanıcı başlatmalı istekler.
- **İşletim sistemi kasası (DPAPI):** Gizli anahtarlar şifreli saklanır; arayüzde, günlüklerde, cURL ve koleksiyon dışa aktarmalarında `⟦GİZLİ:...⟧` olarak maskelenir.
- **Yazma yöntemlerinde ek önizleme:** `POST`/`PUT`/`PATCH`/`DELETE` çağrılarında gönderim öncesi onay penceresi.
- **Yanıt biçimleme ve alan açıklamaları:** JSON yanıt ağacı, veri tipleri, örnek değerler ve bağlı API belgesi bağlantısı.
- **MyMind / yerel model:** Onaylı yanıt alanı açıklaması; yanıtta olmayan uydurma alanlar denetimde reddedilir ve kasa sırları modele gönderilmez.
