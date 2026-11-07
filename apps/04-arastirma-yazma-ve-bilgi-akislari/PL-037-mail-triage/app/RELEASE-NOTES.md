# Mail Triage 0.1.0 — önizleme (Windows)

PL-037 Mail Triage'in ilk sürümü — **salt okunur pilot**. Posta uygulamanızdan dışa aktardığınız e-postalar için gerekçeli **etiket** ve **öncelik** önerir, eylemleri ve son tarihleri çıkarır, kısa **yanıt taslağı** hazırlar. Posta kutunuza bağlanmaz; ileti göndermez, taşımaz, silmez. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `MailTriage-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `MailTriage-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri)

## Neler var
- **İçe aktarma:** `.eml` (birden çok dosya) ve `.mbox`; ya da iletinin kaynağını yapıştırma. MIME: multipart, quoted-printable, base64, RFC 2047 başlıklar, RFC 2231 dosya adları; UTF-8, ISO-8859-9, Windows-1254. HTML düz metne çevrilir (uzak içerik yüklenmez). Aynı Message-ID ikinci kez eklenmez. Kaynak dosyalar değiştirilmez.
- **Etiket önerisi (gerekçeli):** Yanıt bekliyor, Fatura/Ödeme, Toplantı, Kargo/Sipariş, Güvenlik, Bülten/Kampanya, Bildirim — anahtar sözcükler, List-Unsubscribe / Auto-Submitted başlıkları, .ics/fatura ekleri, size doğrudan yazılmış soru/rica.
- **Öncelik önerisi (gerekçeli) ve korumalar:** Yüksek / Normal / Düşük. Düşük yalnız toplu/otomatik iletiye ve hiçbir önem işareti yokken verilir. Önemli kişi/alan (VIP), doğrudan soru/rica, yakın son tarih, güvenlik uyarısı, "yüksek önem" başlığı ve son ödeme tarihli fatura **Düşük önerilmez**; toplu kampanyadaki "Son gün!" gibi ifadeler önem sayılmaz.
- **Çıkarım:** eylem cümleleri (rica, istek, "could you"), son tarih (son ödeme tarihi, cuma gününe kadar, 15 Aralık, yarın), tutarlar (TL, USD, EUR); alıntılar ve imza ayrı tutulur.
- **İnceleme:** öneriyi kabul et ya da etiket/öncelik/"Önemli" ile düzelt; seçilenlerin önerisini toplu kabul; arşivle (silme yok). Süzgeçler (öncelik, etiket, gözden geçirilmemiş) ve arama.
- **Toplu değişiklik önizlemesi:** seçili iletilere etiket ekle/kaldır, öncelik ver — önce/sonra tablosu; önem işaretli ileti Düşük'e alınırken uyarı; onayla uygulanır (yalnız bu uygulamanın kaydında).
- **Yanıt taslağı:** e-postanın diline göre (Türkçe/İngilizce) kısa şablon; düzenle, panoya kopyala. **Gönderilmez.**
- **MyMind** (PluginLabs Hub) ya da bu bilgisayardaki **yerel model** (LM Studio, Ollama; yalnız 127.0.0.1/localhost): tek ileti, her istekte onay; alıntılar/imza atılır, kişi adları [Gönderen]/[Alıcı], e-posta adresleri ve alan adı gönderilmez; telefon, bağlantı, IBAN, kart, T.C. kimlik, doğrulama kodu/parola ⟦n⟧ ile gider. Yanıt denetlenir: bilinmeyen etiket atılır, önem işaretli ileti Düşük yapılamaz; öneri sizin onayınızla uygulanır, elle düzenlediğiniz taslak ezilmez.
- **Ölçüler:** etiket kabulü (hedef ≥ %85), önemli e-postayı yanlış düşük öncelikleme (hedef < %2), öncelik önerisinin korunma oranı; elle etiketli örnek gelen kutusunda kesinlik/duyarlılık.
- **Dışa aktarma:** öneriler ve kararlar `.csv` (Excel; formül enjeksiyonu engellenir), öncelik gruplu gelen kutusu özeti `.md` (yapılacaklar), JSON yedek. İletiler, kararlar ve MyMind anahtarı Windows kasasında (DPAPI) şifreli.

## Sınırlar
- **Posta sağlayıcı bağlantısı yok:** Gmail/Outlook API, OAuth ve canlı gelen kutusu bu sürümde yok (Notion: "ilk pilot salt okunur"; sağlayıcı doğrulaması sonraki faz). Etiket ve öncelik posta kutusuna yazılmaz.
- Chrome eklentisi, Linux ve macOS paketleri, ekip ortak gelen kutusu ve Pro bu sürümde yok. Ekler açılmaz ve kaydedilmez.
- Kural tabanlı öneriler Türkçe ve İngilizce kalıplar içindir; her öneri gerekçesiyle gösterilir ve onayınızla kesinleşir.
- Doğrulama: çekirdek birim testleri ve gerçek Electron penceresinde otomatik duman testi (taklit MyMind/yerel model sunucusuyla; Windows runner + Linux/xvfb). Notion ölçütleri yalnız uygulamadaki uydurma, elle etiketli 12 iletilik örnekte ölçüldü (etiket kesinliği/duyarlılığı %100, önemli iletinin Düşük önerilmesi 0/6); gerçek gelen kutularında ve gerçek bir modelle ölçülmedi. Windows DPI ve ekran okuyucu elle denenmedi.
