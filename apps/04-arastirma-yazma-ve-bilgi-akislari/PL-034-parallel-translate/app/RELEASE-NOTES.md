# Parallel Translate 0.1.0 — önizleme (Windows)

PL-034 Parallel Translate'in ilk sürümü. Seçtiğiniz ya da yapıştırdığınız metni bölümlere ayırır ve özgün metinle **yan yana** çevirmenizi sağlar; **kişisel terim sözlüğünüz** her bölümde denetlenir. İlk sürüm Türkçe ⇄ İngilizce. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `ParallelTranslate-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `ParallelTranslate-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri)

## Neler var
- Metin girişi: yapıştırma, **Panodan al** (yalnız düğmeyle), `.txt`/`.md` dosyası, **Ctrl+Shift+Space** seçim paneli (başka uygulamada kopyalayın, kısayola basın). Kaynak dil otomatik tespit edilir; yön tek tıkla değişir.
- **Bölüm eşleştirme:** paragraf, madde satırı ve cümle (kısaltma ve ondalık sayılar bölünmez); her bölümün karşısında çeviri kutusu. Bölümler birleştirilebilir.
- **Terim sözlüğü:** TR ⇄ EN karşılıklar, not, birden çok kabul edilen karşılık (`|`); Türkçe ek ve ünsüz yumuşaması (sözleşmenin, kitabı), İngilizce çoğul/fiil/iyelik (parties, invoiced, party's) tanınır. Kaynakta terimler işaretlenir; çeviride karşılığı yoksa bölüm uyarılır. CSV içe/dışa aktarma. **Örnek** ile temsilî terim kümesi (12 terim) eklenir.
- **Korunan alanlar:** sayı, tutar, yüzde, saat, sayısal tarih, bağlantı, e-posta, @etiket ve gizli değerler (IBAN, kart, T.C. kimlik, parola) çeviride aranır; eksik olan işaretlenir (sayı biçimi farkı — 12.500 / 12,500 — tolere edilir).
- **Var olan çeviriyi hizalama:** elinizdeki çeviriyi yapıştırın; cümleler uzunluk oranıyla eşleştirilir (1-1, 1-2, 2-1).
- **Sözlük taslağı** (çevrimdışı): boş bölümlere yalnız sözlük terimleri yerleştirilir — çeviri değildir, tutarlı terim için başlangıçtır.
- **MyMind** (PluginLabs Hub) ya da bu bilgisayardaki **yerel model** (LM Studio, Ollama; yalnız 127.0.0.1/localhost) ile bağlama uygun çeviri, alternatif terim ve kısa açıklama. Her istekte onay; korunan alan değerleri gönderilmez (⟦n⟧ yer tutucusu), sözlükten yalnız ilgili terimler gider; elle düzenlenmiş çevirilerin üzerine yazılmaz.
- **Kalite:** bölüm başına İyi / Düzeltme gerekti / Kötü notu ve onay; **Ölçüler**: sözlük uyumu (hedef ≥ %95), model ilk çevirisindeki sözlük uyumu, korunan alan, insan kalite, alternatif kullanma.
- Dışa aktarma: çeviri `.txt`, iki sütunlu `.csv` (Excel), Markdown tablo, **TMX 1.4** (çeviri belleği); çeviriyi panoya kopyala; JSON yedek. Belgeler arşivlenir, silinmez.
- Belgeler, sözlük ve MyMind anahtarı Windows kasasında (DPAPI) şifreli.

## Sınırlar
- Uygulama kendi başına makine çevirisi yapmaz: çeviri elle yazılır, hizalanır ya da MyMind / yerel model ile üretilir. Çeviri kalitesi seçtiğiniz modele bağlıdır; teknik, tıbbi ve hukuki anlamın doğrulanması kullanıcıdadır.
- Yalnız Türkçe ⇄ İngilizce. Chrome eklentisi, Linux ve macOS paketleri bu sürümde yok.
- Doğrulama: çekirdek birim testleri ve gerçek Electron penceresinde otomatik duman testi (taklit MyMind/yerel model sunucusuyla; Windows runner + Linux/xvfb). Notion ölçütleri (temsilî terim kümesinde ≥ %95 sözlük uyumu, insan kalite değerlendirmesi) gerçek bir modelle ve gerçek kullanıcıyla ölçülmedi; Windows DPI ve ekran okuyucu elle denenmedi.
