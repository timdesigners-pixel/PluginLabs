# Meeting Trace 0.1.0 — önizleme (Windows)

PL-035 Meeting Trace'in ilk sürümü. Yüklediğiniz ya da yapıştırdığınız **toplantı transkriptinden** zaman damgalı konuşma satırları, zaman damgalı notlar ve **kanıt satırlı karar / görev taslakları** çıkarır; her madde **sizin onayınızdan** geçer. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `MeetingTrace-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `MeetingTrace-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri)

## Neler var
- **Transkript yükleme:** yapıştırma ya da `.txt` / `.vtt` / `.srt` / `.md` dosyası. Tanınan biçimler: `[00:01:23] Ad: metin`, `Ad (01:23): metin`, `Ad: metin`, Zoom / Teams metin dökümü (ad + zaman satırı, ardından konuşma), WebVTT (`<v Ad>` etiketi) ve SRT. UTF-8, UTF-16 ve Windows-1254 kodlamaları okunur. Yüklemeden önce önizleme (biçim, satır, konuşmacı, zamanlı satır) ve hassas değer uyarısı.
- **Bilgilendirme ve izin (zorunlu):** her yüklemede "katılımcılar bilgilendirildi ve izin verdi" ya da "kendi notum" seçilir ve toplantıyla birlikte kaydedilir. Uygulama **mikrofon, kamera ya da ekran kaydı yapmaz** ve bu izinleri reddeder; gizli ya da sürekli kayıt yoktur.
- **Konuşmacı ayrımı:** transkriptteki etiketlerden. Etiketi olmayan satırın konuşmacısı önceki konuşmacıdan **tahmin** edilir ve işaretlenir; Konuşmacılar sekmesinden onaylanır ya da değiştirilir. Ad düzeltme ve aynı kişinin iki etiketini birleştirme.
- **Karar ve görev taslakları** (çevrimdışı kurallar, Türkçe + İngilizce): "karar verdik / anlaştık / … olarak kalsın", "paylaşacağım / gönderirim / ben hazırlarım", istek + kabul ("Mehmet, … gönderebilir misin?" → "Tamam"), "Bunu kim yapacak?" → "Ben", "… etmemiz gerekiyor / … lazım / -malıyız", edilgen ("güncellenecek"), "Görev: …" etiketleri. Olumsuz cümleler ("silmeyeceğiz") ve "bakalım / gelecek hafta netleşir" gibi görev olmayan gelecek zamanlar elenir. Her maddenin **kanıt satırı** (zaman + konuşmacı + metin) tıklanınca transkriptte gösterilir.
- **Görev sahibi:** açıkça söylendiyse **Kesin**; katılımcı listesinde olmayan biri ("Zeynep Hanım"), birden çok kişi ya da konuşmacısı tahmin olan satır ise **Tahmin**; söylenmediyse **Belirsiz** — uygulama sahip uydurmaz. **Son tarih** ifadeleri ("cumaya kadar", "yarın", "15 Kasım", "gelecek hafta", "by Friday") toplantı tarihine göre çözülür.
- **İnsan onayı:** her madde Onayla / Reddet / Geri al; metin, sorumlu ve son tarih düzeltilir; "Kesinleri onayla" yalnız sahibi kesin olan adayları onaylar. Elle madde (seçili satıra bağlanır). Yeniden çıkarım onayladığınız ve reddettiğiniz maddeleri korur.
- **Zaman damgalı notlar:** "Gündem: …" / "Sıradaki konu: …" işaretinde ya da her 3/5/10/15 dakikada yeni bölüm; başlık, anahtar kelimeler, konuşanlar ve o bölümdeki kararlar/görevler.
- **Görevler:** tüm toplantılardan onaylı görevler tek listede; sorumlu süzgeci, arama, tamamlandı işareti, geciken son tarih vurgusu, toplantıya dönüş.
- **MyMind** (PluginLabs Hub) ya da bu bilgisayardaki **yerel model** (LM Studio, Ollama; yalnız 127.0.0.1/localhost) ile **ek** karar/görev adayları. Her istekte onay; konuşmacı adları **K1, K2…** takma adıyla (metin içindeki adlar da), e-posta / telefon / bağlantı / IBAN / kart / T.C. kimlik / parola değerleri yer tutucuyla gider; toplantı başlığı ve dosya adı gitmez. Dönen her madde var olan bir satır kimliğine dayanmak zorundadır (dayanmayan atılır), takma adlar geri çevrilir, maddeler **onay bekler**.
- **Dışa aktarma:** Markdown (kararlar, görev tablosu, zaman damgalı notlar, bilgilendirme kaydı), CSV (Excel, UTF-8 BOM, `;`), metin, JSON; özeti panoya kopyalama; JSON yedek. Varsayılan olarak yalnız onaylı maddeler.
- **Ölçüler:** uygulamayla gelen elle etiketli örnek toplantıda görev kesinliği / duyarlılığı / sahip doğruluğu ve belirsiz sahiplerin görünürlüğü (Notion ölçütü: kesinlik ≥ %90); kendi toplantılarınızda kural ve MyMind adaylarının onay oranı.
- Toplantılar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli. Silme yok, arşivleme var.

## Sınırlar
- **Ses dosyası yazıya dökülmez:** bu sürüm hazır transkript ister (Zoom, Teams, Meet ya da başka bir araçtan dışa aktarılmış). Gerçek zamanlı / çok platformlu ses yakalama Notion planında sonraki fazdır.
- Konuşmacı ayrımı transkriptteki etiketlere dayanır; ses tabanlı konuşmacı tanıma yoktur.
- Kural tabanlı çıkarım Türkçe ve İngilizce içindir; dolaylı ya da bağlama bağlı görevleri kaçırabilir, öneri cümlelerini görev sanabilir. Bu yüzden her madde onay ister.
- Doğrulama: çekirdek birim testleri ve gerçek Electron penceresinde otomatik duman testi (taklit MyMind / yerel model sunucusuyla; Windows runner + Linux/xvfb). Uygulamayla gelen örnekte görev kesinliği %92,9 (13/14), duyarlılık %100; ayrı İngilizce örnekte kesinlik %100, duyarlılık %100 (4/4), karar duyarlılığı %50. İki örnek de kısa ve uydurmadır; gerçek toplantılarda ölçülmedi. Gerçek bir modelle MyMind çıkarımı, Windows DPI ve ekran okuyucu elle denenmedi.
- Chrome eklentisi, Linux ve macOS paketleri bu sürümde yok.
