# API Pocket 0.1.0 — önizleme (Windows)

PL-042 API Pocket'in ilk sürümü. Küçük API çağrılarını büyük bir araç açmadan denemek için: **istek şablonu → ortam değişkenleri → yalnız sizin başlattığınız GET isteği → biçimlenmiş yanıt.** Anahtarlar **gizli değişken** olarak Windows kasasında saklanır ve **hiçbir günlükte, geçmişte ya da dışa aktarmada görünmez.** **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `APIPocket-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `APIPocket-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri; uygulama içi örnek API, taklit yankı sunucusu ve taklit MyMind ile)

## Neler var
- **İstek şablonları:** ad, klasör, adres, parametreler, başlıklar (her satır açılıp kapatılabilir), not ve API belgesi bağlantısı; çoğaltma, arama, arşiv (silme yok). Yalnız **GET**.
- **Ortam değişkenleri:** `{{ad}}` sözdizimi adres, parametre ve başlıklarda. Birden çok ortam (ör. geliştirme / üretim), araç çubuğundan etkin ortam seçimi. **Gizli değişken:** değer bir kez yazılır, sonra düzenleyicide boş (“kayıtlı”) görünür; boş bırakılırsa korunur; düz değişkene çevrilemez.
- **Üretim ortamı:** işaretli ortamda her gönderimden önce maskeli önizleme (adres, başlıklar, kullanılan gizli değişkenlerin adları) ve onay; vazgeçerseniz istek gitmez.
- **Gönderim denetimi:** tanımsız/boş değişken, geçersiz adres (yalnız http/https), adreste kullanıcı adı/parola, başlıkta satır sonu, `Host`/`Content-Length` gibi yönetilen başlıklar → istek gönderilmez ve neden yazılır.
- **Yanıt:** durum (Türkçe açıklamalı), süre, boyut, içerik türü; girintili ve renklendirilmiş JSON, alan listesi (yol, türler, görülme sayısı, boş sayısı, örnek), başlıklar; XML/HTML/metin olduğu gibi (çalıştırılmadan); ikili içerik metne çevrilmez. Kopyala / dosyaya kaydet. 3xx yönlendirme otomatik izlenmez, hedef gösterilir. Zaman aşımı (varsayılan 30 sn) ve yanıt boyutu (varsayılan 5 MB) ayarlanabilir.
- **Sır koruması (ölçüt: sırların günlükte görünmesi sıfır):** gönderim geçmişi, onay pencereleri, curl kopyası ve koleksiyon dışa aktarması sırrı `{{ad}}` olarak tutar; yanıtta sır değeri (düz, URL kodlu, base64) geçerse ⟦sır:ad⟧ ile değiştirilir ve sayılır. Kayıtlı geçmiş ve şablonlar her açılışta tüm gizli değerlere karşı taranır; sonuç “Günlükte görünen sır” ölçüsünde. Kasa yoksa gizli değerler diske yazılmaz.
- **curl içe aktarma:** `-H`, `-G`/`--data-urlencode`, `-u`, `-A`, `-e`, `-b`, `--url`; Windows `^` ve PowerShell `` ` `` satır devamı. Authorization, X-Api-Key, Cookie… başlıkları ve `api_key`, `token`… parametreleri otomatik olarak gizli değişkene taşınır. GET dışı yöntem ya da gövde (`-d`, `-F`) reddedilir.
- **Örnek veri (ölçüt: örnek API'de ilk doğru istek ≤ 2 dk):** “Örnek verilerle başla” bu bilgisayarda (yalnız 127.0.0.1, rastgele port) uydurma bir kitap API'si açar; hazır ortam (gizli `api_key` her başlatmada yeniden üretilir) ve dört şablon. Süre, düğmeye basıldığı andan ilk 2xx yanıta kadar ölçülür.
- **Koleksiyon:** JSON olarak dışa aktarma (gizli değerler yazılmaz) ve içe aktarma (dosyada gizli değer olsa bile alınmaz).
- **Geçmiş:** son 500 gönderimin maskeli kaydı (zaman, şablon, ortam, durum, süre, boyut, adres); tıklayınca şablon açılır.
- **MyMind** (PluginLabs Hub) ya da **yerel model** (LM Studio, Ollama; yalnız 127.0.0.1/localhost), her istekte onay:
  - *Yanıt alanlarını açıkla:* yalnız alan yolları, türler ve maskeli kısa örnekler (e-posta, telefon, kart, kimlik, anahtar, bağlantı ⟦…⟧), sorgusuz adres ve varsa belge bağlantınız gider. Olmayan alan ve sizin vermediğiniz bağlantı içeren açıklama atılır.
  - *İstek taslağı:* açıklamanız ve değişkenlerin yalnız adları gider; taslak yalnız GET olabilir, düz yazılmış anahtar/belirteç atılır, ortamda olmayan değişken işaretlenir. Taslak gönderilmez, şablon olarak eklenir.

## Sınırlar
- İlk sürüm **yalnız GET** gönderir; POST/PUT/PATCH/DELETE, gövde, dosya yükleme, OAuth akışları, WebSocket/GraphQL yok.
- **Chrome paneli** (tarayıcıdan istek yakalama) ile Linux ve macOS paketleri bu sürümde yok. Ekip şeması ve test reçeteleri (Pro) yok.
- Yönlendirmeler otomatik izlenmez; istemci sertifikası ve vekil sunucu ayarı yok (sistem vekili kullanılmaz).
- Doğrulama: çekirdek birim testleri ve gerçek Electron penceresinde otomatik duman testi (uygulama içi örnek API, taklit yankı sunucusu, taklit MyMind/yerel model; Windows runner + Linux/xvfb). İlk doğru istek süresi otomasyonla ölçüldü (insan kullanıcıyla ölçülmedi). **Gerçek bir genel API'ye ve gerçek bir modele karşı denenmedi.** Windows DPI, klavye ve ekran okuyucu elle denenmedi.
