# Meeting Trace 0.1.0 — önizleme (Windows)

PL-035 Meeting Trace'in ilk sürümü. Toplantı transkriptinizi (Teams, Zoom, Google Meet dökümü, WebVTT, SRT ya da düz metin) **zaman damgalı notlara**, **kararlara** ve **görev taslaklarına** dönüştürür; hiçbir taslak sizin onayınız olmadan nota girmez. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `MeetingTrace-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `MeetingTrace-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri)

## Neler var
- **Transkript girişi:** dosya (.vtt, .srt, .txt, .md), yapıştırma ya da **Panodan al** (yalnız düğmeyle). Biçim kendiliğinden tanınır: WebVTT (`<v Ad>` etiketleri), SRT, Teams/Zoom blok dökümü ("Ad  0:01:05"), `[00:12:05] Ad: metin`, "Ad: metin" ve düz metin. Kodlama: UTF-8/UTF-16/Windows-1254.
- **Katılımcı bilgilendirme/izin kaydı:** her toplantı "katılımcılar bilgilendirildi" onayı ve bilgilendirme yoluyla oluşturulur; hazır **bilgilendirme metni** panoya kopyalanır. Kayıt nota yazılır.
- **Zaman çizelgesi ve konuşmacılar:** satırlar zaman damgasıyla; konuşma payı. Etiketsiz devam satırları önceki konuşmacıya **tahmin** olarak bağlanır, "Konuşmacı 3" gibi genel etiketler **kimlik belirsiz** işaretlenir; konuşmacıya gerçek ad verilebilir ya da iki konuşmacı birleştirilebilir. Konuşmayan katılımcılar eklenebilir.
- **Karar ve görev taslakları (kural tabanlı, çevrimdışı):** Türkçe ve İngilizce kalıplar — "kesinleşti", "karar verdik", "… ile devam ediyoruz", "we agreed"; "göndereceğim", "… paylaşabilir misin?", "Can'ın … bitirmesi gerekiyor", "Aksiyon: Zeynep — …", "I will", "can you". **Son tarih** (cuma, yarın, haftaya salı, 10.11, 15 Aralık, ay sonu) toplantı tarihine göre hesaplanır.
- **Sorumlu belirsizliği görünür:** her görevde sorumlu durumu **Açık / Tahmin / Belirsiz** ve nedeni ("‘Biz’ dendi", "Birden çok kişi geçiyor: …", "konuşmacı kimliği belirsiz"). "Kim üstlenecek?" gibi açık sorular görev sayılmaz.
- **İnsan onayı:** her taslak Onayla / Reddet / düzenle (metin, sorumlu, son tarih); sorumlusu açık olanları ve kararları toplu onaylama; transkript satırından elle görev/karar ekleme.
- **MyMind** (PluginLabs Hub) ya da bu bilgisayardaki **yerel model** (LM Studio, Ollama; yalnız 127.0.0.1/localhost) ile isteğe bağlı inceleme: her istekte onay; kişi adları K1, K2… kodlarıyla, e-posta / telefon / bağlantı / IBAN / kart / T.C. kimlik / parola değerleri ⟦n⟧ yer tutucusuyla gider. Yanıttaki öğeler yalnız var olan satırlara ve kişilere bağlanabilir; bilinmeyen satır/kişi reddedilir, yeni öğeler taslak olarak eklenir.
- **Bul:** tüm toplantılarda karar, görev ve transkript satırı araması (Türkçe harf duyarsız); sonuçtan ilgili satıra gitme. **Görevler** görünümü: tüm onaylı görevler, sorumluya göre süzgeç, tamamlandı işareti, geciken görevler.
- **Dışa aktarma (yalnız onaylı öğeler):** toplantı notu Markdown/TXT, görevler CSV (Excel; formül enjeksiyonu engellenir), takvim görevleri ICS (VTODO, son tarihli); notu panoya kopyala; JSON yedek.
- **Ölçüler:** görev çıkarma kesinliği — sizin onay/red kararlarınız (insan etiketi) ve elle etiketli örnek toplantı (Notion ölçütü ≥ %90); duyarlılık; sorumlusu belirsiz onaylı görev sayısı.
- Toplantılar silinmez, arşivlenir. Toplantılar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli.

## Sınırlar
- **Ses kaydı yok:** bu sürüm mikrofon izni istemez (izin istekleri her zaman reddedilir), gizli ya da sürekli kayıt yapmaz ve sesten yazıya dönüştürme içermez. Transkripti toplantı platformunuzdan indirip yükleyin. Gerçek zamanlı çok platformlu ses yakalama sonraki faz.
- Kural tabanlı çıkarım Türkçe ve İngilizce içindir; yazım biçimi alışılmadık transkriptlerde taslak kaçabilir ya da fazladan çıkabilir — bu yüzden her taslak onaydan geçer. Konuşmacı ayrımı transkriptteki etiketlere dayanır (sesten konuşmacı ayrımı yok).
- Kayıt ve transkript kuralları için toplantı platformunun koşulları ve yerel mevzuat geçerlidir; uygulama hukuki değerlendirme yapmaz.
- Doğrulama: çekirdek birim testleri ve gerçek Electron penceresinde otomatik duman testi (taklit MyMind/yerel model sunucusuyla; Windows runner + Linux/xvfb). Notion ölçütü (görev çıkarma kesinliği ≥ %90) yalnız uygulamadaki uydurma, elle etiketli örnek toplantıda ölçüldü (kural tabanlı: kesinlik %100, duyarlılık %100); gerçek ekip toplantılarında ve gerçek bir modelle ölçülmedi. Windows DPI ve ekran okuyucu elle denenmedi. Linux ve macOS paketleri, tarayıcı toplantı yakalama, dakika kredisi / ekip lisansı bu sürümde yok.
