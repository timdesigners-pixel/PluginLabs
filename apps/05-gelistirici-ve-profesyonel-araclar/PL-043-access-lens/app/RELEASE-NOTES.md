# Access Lens 0.1.0 — önizleme (Windows)

PL-043 Access Lens'in ilk sürümü. Seçtiğiniz **tek web sayfasını** yalıtılmış, oturumsuz bir pencerede açar ve **axe-core** kural motoruyla **WCAG 2.2 A/AA** ölçütlerine göre **kontrast, form etiketi, erişilebilir ad, başlık yapısı ve ARIA** sorunlarını raporlar; bir bulguyu seçtiğinizde **ilgili öğe sayfanın görüntüsünde işaretlenir**. **Odak sırası** (klavye Tab sırası) ve **başlık/bölge yapısı** ayrı sekmelerde. Rapor **standart ve motor sürümünü** gösterir; **puan ya da sertifika üretilmez**. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `AccessLens-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `AccessLens-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri; uygulamayla gelen örnek sayfalar, yerel test sunucusu ve taklit Hub ile)

## Neler var
- **Sayfa seçimi (tek sayfa):** adres (her açılış ayrı onaylı; yalnız http/https), kaydedilmiş `.html` dosyası (5 MB'a kadar) ya da yapıştırılan HTML. Bağlantılar izlenmez, site taranmaz, form gönderilmez.
- **Yalıtılmış denetim penceresi:** görünmez (ekran dışı), her denetimde **yeni bellek içi oturum** (çerezleriniz/oturumunuz kullanılmaz, diske yazılmaz), sandbox, Node yok, izinler reddedilir, indirmeler iptal, yeni pencere yok, ilk yüklemeden sonra başka adrese gidilmez. Yerel dosya/yapıştırılan HTML'de uzak kaynaklar ayar açılmadıkça **yüklenmez**. **Sayfa betikleri** isteğe bağlı kapatılabilir (CSP `script-src 'none'`); denetim motoru yalıtılmış dünyada çalıştığı için etkilenmez. Görünüm genişliği (1280/1024/768/390) ve yükleme sonrası bekleme ayarlanabilir.
- **Kural motoru:** axe-core 4.14.0 (Deque Systems, MPL-2.0) — `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` + isteğe bağlı `best-practice`. Motor sürümü ve etiketler her denetimde ve raporda görünür.
- **Bulgular:** önem (Kritik/Ciddi/Orta/Düşük), sık kurallar için Türkçe başlık, WCAG başarı ölçütü ve düzeyi (ör. 1.4.3 · AA · WCAG 2.0'den beri), motorun açıklaması ve "neden" özeti (ör. kontrast oranı, ön/arka plan rengi), öğenin HTML'i (e-posta/telefon/uzun sayılar maskeli) ve seçicisi. Önem süzgeci. **Öğeyi göster:** öğe görünür alana kaydırılır ve ekran görüntüsünde sarı çerçeveyle işaretlenir (sayfaya hiçbir şey eklenmez).
- **Manuel kontrol:** motorun emin olamadığı sonuçlar (ör. görsel arka plan üzerindeki metnin kontrastı) ayrı listede.
- **Odak sırası:** klavyeyle odaklanabilen görünür öğeler Tab sırasıyla (önce tabindex > 0, sonra belge sırası), erişilebilir ad, rol; pozitif tabindex, adsız öğe ve görsel akışta geri sıçrama uyarıları (manuel doğrulama için). **Yapı:** başlık ağacı (düzey atlama işaretli) ve sayfa bölgeleri (landmark).
- **Yeniden denetle:** aynı sayfanın önceki denetimine göre **yeni / giderilen / süren** bulgular.
- **Yanlış olumlu işareti:** kullanıcı bir bulguyu yanlış olumlu işaretleyebilir; özetten düşülür, raporda ayrıca belirtilir.
- **Doğrulama ölçütü (Notion kartı):** uygulamayla gelen 3 örnek sayfa (fixture) bilinen 17 sorunu `data-beklenen` ile işaretli taşır; "Örnek sayfalar" denetiminde **doğru bulgu oranı, yakalama ve kritik/ciddi yanlış olumlu oranı** ölçülür (hedef <%5). Bu sürümün testinde: 17/17 doğru bulgu, 0 beklenmeyen bulgu, kritik yanlış olumlu %0.
- **Rapor:** Markdown (standart, motor sürümü, uyarı, kurala göre gruplu bulgular, MyMind düzeltme taslakları, manuel kontrol listesi, odak sırası, elle yapılacak kontroller), JSON (tam kayıt + özet), CSV (formül enjeksiyonu engellenir).
- **MyMind** (PluginLabs Hub) ya da bu bilgisayardaki **yerel model** (yalnız 127.0.0.1/localhost): tek bulgu, her istekte onay. Giden: kural, WCAG başvurusu, motor özeti ve öğenin HTML parçası (maskeli); sayfa adresi gönderilmez. Yanıt sade açıklama + düzeltme önerisi + örnek kod olarak **taslak** gösterilir; "uyumlu/sertifikalı/tamamen erişilebilir" ya da puan iddiası içeren cümleler **atılır** ve sayılır.
- **Geçmiş** (arşiv; silme yok), **Ölçüler**. Denetimler ve MyMind anahtarı Windows kasasında (DPAPI) şifreli saklanır.

## Sınırlar
- **Otomatik denetim sertifika değildir;** kurallar sorunların yalnız bir bölümünü bulur. Klavye, ekran okuyucu (NVDA, Ekran Okuyucu), %200 yakınlaştırma ve gerçek engelli kullanıcı testleri ayrıca gerekir (raporda kontrol listesi var).
- Giriş gerektiren sayfaların yalnız herkese açık hâli denetlenir (oturumunuz kullanılmaz). iframe içerikleri denetlenmez. Tek sayfa; site taraması yok.
- Odak sırası DOM ve tabindex'ten çıkarılır; gerçek Tab gezintisi, odak göstergesi görünürlüğü ve odak tuzakları elle denenmelidir.
- **Chrome eklentisi** (tarayıcıdaki sayfayı yerinde denetleme), Pro rapor geçmişi ve ekip takibi, Linux ve macOS paketleri bu sürümde yok.
- Doğrulama: çekirdek birim testleri (9) ve gerçek Electron penceresinde otomatik duman testi (gerçek axe-core denetimi; yerel test sunucusu, taklit MyMind/yerel model; Windows runner + Linux/xvfb). **Ölçütler yalnız uygulamayla gelen 3 uydurma fixture'da ölçüldü; gerçek web sitelerinde ve gerçek kullanıcılarla ölçülmedi.** Gerçek internet sayfalarına karşı, Windows DPI ve ekran okuyucuyla elle denenmedi.
