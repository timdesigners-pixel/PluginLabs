# Insight Table 0.1.0 — önizleme (Windows)

PL-040 Insight Table'ın ilk sürümü. Seçilen tablo ve liste verisini **sütun önizlemesi** ve **veri tipi kontrolüyle** temiz CSV veya JSON verisine dönüştürür; eksik/şüpheli hücreleri işaretler (**kaynaksız tamamlamaz**), kişisel verileri maskeler ve **CSV enjeksiyonuna karşı güvenli** dışa aktarır.

## Dosyalar
- `InsightTable-0.1.0-Windows-x64.exe` — kurulum (NSIS)
- `InsightTable-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png`

## Neler var
- **Tablo ve liste çıkarımı:** HTML `<table>`, HTML `<ul>/<li>`, Markdown tablosu, TSV ve CSV metinlerini sütunlara ayırır.
- **Sütun önizlemesi ve yerelleştirme:** Sayı, para birimi (`1.450,75 TL`, `$49.90`), tarih (`15.11.2026`, `22 Kasım 2026` → ISO `YYYY-MM-DD`) ve mantıksal (`Evet`/`Hayır`) tiplerini algılar ve normalleştirir.
- **Kaynaksız tamamlama yok:** Boş ve hatalı hücreler işaretlenir, uydurma değer yazılmaz.
- **Hücre kaynak izi ve PII filtreleri:** Her hücrenin kaynak satırı ve ham metni izlenir; e-posta, telefon, IBAN ve TCKN değerleri maskelenir.
- **CSV enjeksiyon koruması:** `=`, `+`, `-`, `@` ile başlayan formül hücreleri güvenli biçimde dışa aktarılır.
- **MyMind / yerel model:** Onaylı sütun adı ve veri tipi normalleştirme; PII maskeli gönderilir ve kaynaksız hücre tamamlama önerileri reddedilir.
