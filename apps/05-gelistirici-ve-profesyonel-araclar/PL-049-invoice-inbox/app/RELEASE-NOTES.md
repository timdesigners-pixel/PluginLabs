# Invoice Inbox 0.1.0 — önizleme (Windows)

PL-049 Invoice Inbox'ın ilk sürümü. Serbest çalışanlar için yüklenen veya yapıştırılan fatura ve fişlerden (**e-Arşiv/e-Fatura** ve **Perakende Fiş/Makbuz** şablonları) satıcı, fatura no, düzenleme tarihi, son ödeme tarihi, kalemler, KDV ve genel toplamı çıkarır; `Ara Toplam + KDV = Genel Toplam` tutarlılığını deterministik hesapla kontrol eder ve **insan onayı sonrası Finansal Asistan uyumlu CSV'ye** aktarır. **Muhasebe kaydı veya vergi beyannamesi otomatik gönderilmez.**

## Dosyalar
- `InvoiceInbox-0.1.0-Windows-x64.exe` — kurulum (NSIS, kullanıcı klasörüne)
- `InvoiceInbox-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png`

## Neler var
- **İki belge şablonu:** Şablon 1 (GİB e-Arşiv / e-Fatura metin, HTML ve UBL-TR XML) ve Şablon 2 (Perakende satış fişi / serbest meslek makbuzu).
- **Deterministik toplam kontrolü:** Kalemler toplamı = Ara Toplam ve `Ara Toplam + KDV = Genel Toplam` eşitliği deterministik olarak hesaplanır; tutarsız belgeler zorunlu incelemeye alınır.
- **Zorunlu insan onayı:** Hiçbir belge kendiliğinden onaylanmaz ve CSV'ye girmez; tutarsız belgeler düzeltilmeden veya yazılı inceleme notu + istisna onayı verilmeden onaylanamaz.
- **Kimlik verisi kırpma ve şifreli kasa:** TCKN, IBAN ve kredi kartı numaraları kırpılır; veriler Windows DPAPI (`safeStorage`) ile şifreli saklanır.
- **Dışa aktarma:** Finansal Asistan uyumlu `.csv` (formül enjeksiyonu korumalı), `.md` özet tablosu ve `.json` yedek.
- **MyMind / yerel model (isteğe bağlı, yalnız loopback):** Her istek onaylıdır; TCKN/IBAN/kart/e-posta/telefon gönderilmez; dönen yanıt yine deterministik matematik kontrolünden geçirilir.

## Sınırlar
- Yalnız metin, HTML ve UBL-TR XML tabanlı belgeler doğrudan ayrıştırılır; taranmış görüntü/PDF OCR için metnin yapıştırılması veya yerel MyMind bağlantısı gerekir.
- Otomatik e-Beyanname, GİB veya muhasebe yazılımı gönderimi yoktur.
- Altın örnek doğrulaması uygulamadaki 5 belgelik (2 şablon + UBL XML + tutarsız makbuz + vadesiz fatura) sette %100 toplam ve tarih doğruluğu ile ölçülmüştür.
