# Meeting Trace 0.1.0 — önizleme (Windows)

PL-035 Meeting Trace'in ilk sürümü. Yüklediğiniz ya da yapıştırdığınız **toplantı transkriptinden** zaman damgalı satırlar, **kararlar**, **görevler** (sorumlu + son tarih) ve **açık sorular** çıkarır; her taslak sizin **onayınızdan** geçer. **Ses kaydı yapmaz.** **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `MeetingTrace-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `MeetingTrace-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri)

## Neler var
- **Transkript biçimleri:** WebVTT (Teams, Zoom, Meet; `<v Ad>` etiketi), SRT, `[00:01:02] Ad: metin`, `Ad (00:01:02): metin`, Teams kopyası (`Ad  0:05` + metin satırları), `Ad: metin`, düz metin. UTF-8/UTF-16/Windows-1254. Teams'in kısa altyazı parçaları aynı konuşmacıda birleştirilir. Yapıştırırken biçim, satır ve konuşmacı sayısı önizlenir.
- **Katılımcı bilgilendirme beyanı:** işaretlenmeden toplantı çözümlenmez; beyan toplantıyla saklanır. Mikrofon, kamera ve ekran izni istenmez.
- **Konuşmacılar:** konuşmacısı yazmayan satır önceki konuşmacıya **tahmin** etiketiyle bağlanır; "Konuşmacı 3" gibi adsız etiketler işaretlenir. Konuşmacıya gerçek adını verme, iki etiketi birleştirme, satır satır konuşmacı doğrulama; konuşma payı.
- **Kural taslakları (Türkçe + İngilizce):** karar ("karar verdik", "onaylandı", "we decided"), görev (üstlenme "hazırlarım", rica "gönderebilir misin?", "X takip edecek", "I'll send", "can you…"), açık soru ("henüz bilmiyoruz", "still open"). Gündem cümleleri, soru biçimindeki kararlar ve "Tamam, gönderirim" gibi onay tekrarları ayıklanır.
- **Sorumlu ve son tarih:** cümlede adı geçen kişi, konuşan kişi (birinci kişi), sonraki satırda "tamam/hallederim" diyen kişi (tahmin), "biz" (ekip, kişi atanmadı); çıkarılamazsa **belirsiz** — görünür uyarıyla. Son tarih toplantı tarihine göre çözülür: bugün, yarın, cuma, haftaya pazartesi, ay sonu, 3 gün içinde, 15 Kasım, 15.11.2026, by Friday, Nov 20…
- **İnsan onayı:** her öğe kaynak satırına bağlı; Onayla / Reddet / Düzenle (metin, tür, sorumlu — konuşmacılar, konuşmayan katılımcılar, ekip ya da yazılan ad —, son tarih). Satırdan elle karar/görev/soru ekleme. Onaylanmayan öğe toplantı notuna girmez.
- **Zaman damgalı notlar:** herhangi bir satıra not; notta zaman damgası.
- **Karar ve görevler:** tüm toplantılardan onaylı görevler tek listede — kişi/metin arama, yalnız sorumlusu belirsiz süzgeci, gecikmiş son tarih vurgusu, tıklayınca kaynak satıra gitme.
- **MyMind** (PluginLabs Hub) ya da bu bilgisayardaki **yerel model** (LM Studio, Ollama; yalnız 127.0.0.1/localhost) ile çözümleme: karar/görev/soru önerileri ve konuşmacısız satırlar için konuşmacı tahmini. Her istekte onay; konuşmacı adları S1, S2… takma adlarıyla, e-posta / telefon / IBAN / kart / T.C. kimlik / bağlantı değerleri ⟦n⟧ yer tutucusuyla gider; başlık, notlar ve diğer toplantılar gitmez. Var olmayan satıra dayanan öneri atılır, var olan öğenin tekrarı atlanır; öneriler taslaktır.
- **Dışa aktarma:** toplantı notu (Markdown / TXT; kararlar, görevler — sorumlu ve tahmin/belirsiz etiketi, son tarih —, açık sorular, zaman damgalı notlar), karar ve görevler `.csv` (Excel, formül enjeksiyonuna karşı korumalı), görevler `.ics` (takvim VTODO); notu panoya kopyala; JSON yedek. Toplantılar arşivlenir, silinmez.
- **Ölçüler:** Notion ölçütü — elle etiketli örnekte görev çıkarma kesinliği (hedef ≥ %90; bu sürümde 12/12), kullanımdaki kesinlik (onay/red kararlarınızdan), sorumlusu belirsiz görev sayısı, MyMind önerisi kabulü.
- Toplantılar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli.

## Sınırlar
- Ses kaydı ve ses → metin dönüştürme yok: transkripti Teams/Zoom/Meet'ten ya da başka bir araçtan alıp yüklersiniz. Gerçek zamanlı yakalama sonraki faz.
- Konuşmacı ayrımı (diarization) sesten yapılmaz; transkriptteki etiketlere ve tahmine dayanır.
- Kurallar Türkçe ve İngilizce için yazıldı; serbest konuşmada kaçırılan ya da yanlış yakalanan öğe olabilir — her öğe onayınızdan geçer.
- Chrome eklentisi, Linux ve macOS paketleri bu sürümde yok.
- Doğrulama: çekirdek birim testleri (etiketli örnek + iki bağımsız etiketli örnek) ve gerçek Electron penceresinde otomatik duman testi (taklit MyMind/yerel model sunucusuyla; Windows runner + Linux/xvfb). Gerçek toplantı kayıtlarıyla, gerçek bir modelle ve gerçek kullanıcıyla ölçülmedi; Windows DPI ve ekran okuyucu elle denenmedi.
