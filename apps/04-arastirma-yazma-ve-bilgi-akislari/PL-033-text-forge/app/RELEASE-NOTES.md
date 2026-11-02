# Text Forge 0.1.0 (önizleme)

PL-033 Text Forge'un ilk Windows sürümü. Kısa metinleri (e-posta, mesaj, not) seçtiğiniz işleme ve tona göre yeniden yazan metin atölyesi.

## Neler var
- **Metin kaynakları:** yazma/yapıştırma, **Panodan al** düğmesi, `.txt`/`.md` dosyası ve **Ctrl+Shift+Y** hızlı pencere kısayolu (başka bir uygulamada metni kopyalayın, kısayola basın — Text Forge öne gelir ve panodaki metni alır). Pano yalnız sizin eyleminizle okunur.
- **İşlemler (cihazda, kural tabanlı):** **Düzelt** (noktalama boşlukları, tekrarlanan işaret/kelime, sık yazım hataları, cümle başı büyük harf), **Sadeleştir** (eski/bürokratik kelimeler, “-mektedir → -iyor”, uzun cümleyi bağlaçtan bölme), **Kısalt** (dolgu ifadeler, gereksiz tekrarlar, “yapmış olduğunuz → yaptığınız”), **Biçimlendir** (satır içi sayımı madde listesine çevirme, düzgün tırnak, tire, satır düzeni).
- **Ton:** Koru · Resmî · Nötr · Samimi · **Örneğe göre** — kendi yazdığınız bir örnek metinden üslup profili (resmî/samimi işaretler, ortalama cümle uzunluğu) çıkarılır ve ona göre uygulanır.
- **Sabit alanlar:** sayı, tarih, saat, tutar, yüzde, ad/özel isim, e-posta, bağlantı, @/# etiket ve **terim sözlüğünüzdeki** ifadeler işlemden önce yer tutucuya alınır, sonra geri konur ve her birinin sonuçta aynen bulunduğu denetlenir (Notion ölçütü: koruma ≥ %99). Girdi alanının altında canlı olarak gösterilir.
- **Gizli veri:** parola/PIN/anahtar, kart numarası (Luhn), IBAN ve T.C. kimlik numarası (sağlama) gizli sabit alan sayılır, ekranda maskelenir, hiçbir işlemde değişmez ve MyMind'a gitmez. Parola kutusundan kopyalanmış gibi görünen tek parça pano metni hiç alınmaz.
- **Fark görünümü:** kelime düzeyinde silinen/eklenen; ayrıca sonuç metni ve tek tek değişiklik listesi (neden değiştiğiyle).
- **Kopyala / Kopyala ve küçült / Girdiye al:** kaynak uygulamaya kendiliğinden yazılmaz, e-posta gönderilmez; siz yapıştırırsınız.
- **MyMind (isteğe bağlı):** PluginLabs Hub üzerinden en çok 2 alternatif yazım. Her istekte onay penceresi neyin gideceğini gösterir; sabit alanların değerleri **gönderilmez**, yalnız ⟦n⟧ yer tutucuları gider; ton örneğindeki sabit alanlar da silinir. Dönen her alternatifte sabit alanlar denetlenir; eksik olan alternatif uyarıyla işaretlenir.
- **Geçmiş** (son 100 öneri, arama, kopyala/atölyeye al/sil), **terim sözlüğü**, **ölçüler** (sabit alan koruma, öneri kullanma oranı, MyMind koruma, alınmayan parola benzeri pano).
- Kayıtlar cihazda; Windows'ta kasa (DPAPI) ile şifreli. MyMind anahtarı düz metin olarak diske yazılmaz.

## Sınırlar
- Kural tabanlı dönüştürme Türkçe içindir ve sözlüklerle sınırlıdır; anlamı yeniden kurmaz. Serbest yeniden yazım MyMind ile yapılır.
- Chrome “seçili metin” menüsü bu sürümde yok (Notion platformunun Chrome kısmı ayrı iş). DOCX/PDF açılmaz.
- Freemium karakter kotası ve ekip sözlüğü (Pro) uygulanmadı.
- Paketler imzasızdır; SmartScreen uyarı verebilir. Windows'ta otomatik duman testi GitHub Actions Windows runner'ında koşmuştur; gerçek masaüstünde elle test, genel kısayolun başka uygulamalarla çakışması, DPI ve ekran okuyucu kabulü yapılmamıştır.

## Dosyalar
- `TextForge-0.1.0-Windows-x64.exe` — kurulum (NSIS, kullanıcı başına)
- `TextForge-0.1.0-Windows-Portable-x64.exe` — taşınabilir
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri)
