# Voice Note Orbit 0.1.0 — önizleme (Windows)

PL-036 Voice Note Orbit'in ilk sürümü. Aklınıza geleni yazmadan yakalamak için: **yüzen kayıt balonunu** ya da ana penceredeki düğmeyi **basılı tutun, konuşun, bırakın**. Ses, bu bilgisayardaki konuşma→metin sunucusuyla (onayınızla) metne çevrilir; görev mi not mu, tarih ve saat **taslak** olarak çıkarılır; **belirsiz tarihte seçmeniz istenir**. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `VoiceNoteOrbit-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `VoiceNoteOrbit-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri)

## Neler var
- **Basılı tutarak kayıt:** yüzen balon (her zaman üstte, sürüklenebilir, `Ctrl+Alt+N` ile aç/kapat) ya da ana penceredeki kayıt düğmesi; fare ya da Boşluk/Enter tuşu basılı tutulur. Bırakınca, pencere odağı kaybolunca ya da süre (30/60/90/120 sn) dolunca mikrofon hemen kapanır. **Sürekli dinleme yok.** Kayıt sırasında balon/düğme kırmızı, seviye göstergesi ve sayaç görünür.
- **Mikrofon izni dar:** yalnız uygulamanın kendi pencerelerine ve yalnız ses için verilir; kamera, ekran paylaşımı ve diğer izinler reddedilir.
- **Yerel metne çevirme:** 16 kHz mono WAV, bu bilgisayardaki OpenAI uyumlu konuşma→metin sunucusuna (whisper.cpp `server`, faster-whisper-server, Speaches, LocalAI…; `/v1/audio/transcriptions`) gider — adres yalnız `127.0.0.1` / `localhost`. Varsayılan olarak her kayıtta onay ister. Sunucu yoksa ya da reddederseniz ses saklanır, metni yazarsınız ya da sonra çevirirsiniz.
- **Ses dosyası içe aktarma:** WAV, MP3, OGG/Opus, WebM, FLAC, M4A (en çok 5 dk, 25 MB) → aynı biçime dönüştürülür.
- **Yazılı not:** "Yarın 10'da Elif'i ara" yazıp ekleyin (Ctrl+Enter).
- **Görev / not ve tarih taslağı (Türkçe + İngilizce):** "hatırlat", "unutma", "… al / ara / gönder / öde", "remind me", "call", "pay"… → görev; "fikir", "not:" → not. Tarih: bugün, yarın, öbür gün, cuma, bu cuma, haftaya salı, gelecek hafta perşembe, 3 gün sonra, ayın 20'si, ay sonu, 15 Kasım, 12.11.2026, tomorrow, next Monday, November 28, in 2 weeks; saat: 14:30, saat 3, sabah 9, akşam 8, öğleden sonra 2, 3pm, buçuk.
- **Belirsiz ifadede uydurma yok:** "saat 3" (03:00 mü 15:00 mi?), "haftaya" (hangi gün?), "hafta sonu", bugünün gün adı, geçmiş bir saat (bugün mü yarın mı?) belirsiz işaretlenir; seçenekler sunulur. Balonda seçenek tek tıkla **seçilip kaydedilir**. Belirsiz tarihli görev seçim yapılmadan kaydedilmez.
- **Ayrı silme:** ses dosyası, transkript ve not ayrı ayrı (onayla) silinir. İsteğe bağlı: metne çevrildikten sonra sesi saklamama.
- **Görevler:** tarihe göre liste, tamamlandı işareti, gecikmiş/bugün vurgusu. **Notlar:** arama, arşiv.
- **Dışa aktarma:** görevler `.ics` (takvim VTODO, son tarih + saat), notlar ve görevler `.csv` (Excel, formül enjeksiyonuna karşı korumalı), `.md`, `.txt`; panoya kopyala; JSON yedek (sesler hariç).
- **MyMind** (PluginLabs Hub) ya da bu bilgisayardaki **yerel model** ile isteğe bağlı düzeltme: yazım düzeltmesi, tür ve başlık önerisi. Her istekte onay; ses gitmez, yalnız bu notun transkripti gider; e-posta / telefon / IBAN / kart / T.C. kimlik / bağlantı değerleri ⟦n⟧ yer tutucusuyla gider ve yerelde geri konur. Transkriptte geçmeyen tarih önerisi ve aşırı farklı "düzeltme" atılır; tarih yine uygulamada hesaplanır.
- **Ölçüler (Notion ölçütü):** 30 sn'lik notu kaydetme ≤ 3 tık (bas → onay → kaydet; balondan belirsiz saatte de 3 tık), görev tarihini doğru çıkarma ≥ %90 (kaydettiğiniz görevlerden; belirsiz işaretleyip doğru adayı sunmak doğru sayılır). Etiketli örnek kümesi: 41/41; bağımsız ikinci küme: 20/20.
- Notlar, ses dosyaları ve MyMind anahtarı Windows kasasında (DPAPI) şifreli.

## Sınırlar
- Uygulama kendi içinde konuşma tanıma modeli taşımaz: metne çevirme için bu bilgisayarda OpenAI uyumlu bir whisper sunucusu çalışmalıdır (örn. whisper.cpp `server --inference-path /v1/audio/transcriptions`). PluginLabs Hub'da şu an ses→metin uç noktası yok; Hub bunu sunduğunda bağlanacak.
- Kurallar Türkçe ve İngilizce için yazıldı; serbest konuşmada yanlış tür ya da tarih olabilir — her not kaydetmeden önce sizin kontrolünüzden geçer.
- Chrome eklentisi, Linux ve macOS paketleri bu sürümde yok.
- Doğrulama: çekirdek birim testleri ve gerçek Electron penceresinde otomatik duman testi (Chromium taklit mikrofonuyla gerçek kayıt yolu, taklit whisper ve MyMind sunucularıyla; Windows runner + Linux/xvfb). Gerçek mikrofon ve gerçek whisper modeliyle, gerçek kullanıcıyla ölçülmedi; Windows DPI, ekran okuyucu ve çoklu monitörde balon konumu elle denenmedi.
