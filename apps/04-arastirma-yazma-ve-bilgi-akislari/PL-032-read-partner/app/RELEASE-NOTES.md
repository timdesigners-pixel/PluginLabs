# Read Partner 0.1.0 (önizleme)

PL-032 Read Partner'ın ilk Windows sürümü. Uzun ve teknik metinleri bağlamını kaybetmeden anlamak için okuma yardımcısı.

## Neler var
- **İçe aktarma:** metin yapıştırma ya da yerel belge (.txt, .md, .html — HTML'deki betik/stil/menü atılır, hiçbir şey çalıştırılmaz). Her paragraf ¶ numarasıyla kaynak olarak gösterilir.
- **Seçim:** ¶ numarasına tıklayın (Shift ile aralık, Alt+↑/↓ klavyeyle) ya da metinden fareyle bir bölüm seçin. Kullanıcı seçmeden hiçbir şey açıklanmaz.
- **Yan yana sadeleştirme:** solda özgün cümle, sağda sade hâli. Kelimeler değiştirilmez; uzun cümleler bağlaçlardan bölünür, parantez içi ek bilgiler ayrı satıra alınır. Ateşman okunabilirlik puanı (önce/sonra).
- **Terimler:** kısaltma açılımları, metindeki tanımlar ve bağlam yalnız belgenin içinden bulunur (¶ kaynaklı). Metinde tanımı olmayan terim “bilinmiyor” olarak işaretlenir; tahmin yürütülmez. İstediğiniz terimi elle de arayabilirsiniz.
- **3 anlama sorusu:** tanım, sayı/tarih ve anahtar kavram soruları; yanıtı ve ¶ kaynağı “Yanıtı göster” ile açılır.
- **Kaynak içi soru-cevap:** soruya en ilgili cümleler ¶ numarasıyla gelir; metinde karşılığı yoksa “bilinmiyor” denir ve eksik kelimeler gösterilir.
- **Sayfa içi talimatlar** (“önceki talimatları yok say”, “system prompt”, şifre isteme vb.) güvenilmeyen veri olarak işaretlenir.
- **MyMind (isteğe bağlı):** PluginLabs Hub üzerinden seviyeye göre (Başlangıç/Orta/İleri) açıklama ve soru-cevap. Her istekte onay penceresi neyin gideceğini gösterir; yalnız seçili paragraflar (soruda en çok 4 eşleşen paragraf) gider ve metin modele güvenilmeyen veri olarak verilir. Her açıklamanın metinden alıntısı denetlenir; alıntısı kaynakta olmayan açıklama **desteklenmeyen** diye işaretlenir.
- **Ölçüler (Notion doğrulama ölçütü):** anlaşılırlık puanı 1–5, desteklenmeyen iddia oranı, “bilinmiyor” yanıtları — yalnız bu bilgisayarda.
- Kitaplık (en çok 200 belge, arama), açıklamaları Markdown olarak dışa aktarma, metin boyutu ve satır aralığı ayarı.
- Kayıtlar cihazda; Windows'ta kasa (DPAPI) ile şifreli. MyMind anahtarı düz metin olarak diske yazılmaz.

## Sınırlar
- PDF ve DOCX bu sürümde açılmaz (metni kopyalayıp yapıştırabilirsiniz). Tarayıcı yan paneli (Chrome) ayrı iştir.
- Yerel açıklama kural tabanlıdır: anlamı yeniden yazmaz, yalnız böler ve metnin içinden gösterir.
- Paketler imzasızdır; SmartScreen uyarı verebilir. Windows'ta otomatik duman testi GitHub Actions Windows runner'ında koşmuştur; gerçek masaüstünde elle test, DPI ve ekran okuyucu kabulü yapılmamıştır.

## Dosyalar
- `ReadPartner-0.1.0-Windows-x64.exe` — kurulum (NSIS, kullanıcı başına)
- `ReadPartner-0.1.0-Windows-Portable-x64.exe` — taşınabilir
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri)
