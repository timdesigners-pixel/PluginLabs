# Source Trail 0.1.0 (önizleme)

PL-031 Source Trail'in ilk Windows sürümü. Araştırma kaynaklarını, alıntıları ve notları iddialarla ilişkilendirerek izlenebilir bir kanıt arşivi oluşturur.

## Neler var
- **Kaynak kartı:** seçili metin/alıntı, adres (URL), erişim tarihi (varsayılan bugün), tür (web, makale, kitap, rapor, video, diğer), yazar(lar), yayıncı/site/dergi, yayın tarihi, kişisel not, proje. **Panodan yakala** (yalnız düğmeye basınca) kopyalanan seçimden adresi, `Başlık:`/`Yazar:` satırlarını ve alıntıyı ayırır. Adreslerden izleme parametreleri ve # atılır.
- **İddia kartı:** iddia metni, proje, kaynak bağları (**Destekler / Çürütür / Bağlam**) ve isteğe bağlı dayanak alıntı. Alıntı kaynak kartındaki metinde **aynen** yoksa bağ kaydedilmez.
- **Eksik kanıt etiketi:** kaynağı olmayan iddia açıkça etiketlenir (neyin arandığı notuyla). Doğrulama ölçütü (Notion): iddia kartlarının %100'ünde erişilebilir kayıtlı kaynak ya da açık eksik etiketi — kenar çubuğunda ve Ölçüler'de canlı.
- **Kopyalar bağımsız sayılmaz:** aynı adres (www, m., izleme parametreleri, # yok sayılır), aynı alıntı metni, aynı başlık + yazar ya da sizin “kopyası” işaretiniz tek kaynak grubu; iddia durumu bağımsız grup sayısıyla hesaplanır (Kanıtlı ≥2, Tek kaynak, Çelişkili, Eksik, Kaynaksız). Yeni kart var olanın kopyasıysa kayıtta uyarılır.
- **Erişilebilirlik:** “ulaşılamıyor” işaretli ya da künyesi eksik kaynak kanıt sayılmaz. Adres yalnız herkese açık http(s) ise sistem tarayıcısında açılır.
- **Kaynakça ve kanıt izi:** APA 7, MLA 9, BibTeX (özel karakter kaçışlı), CSL-JSON (Zotero vb.), Markdown kanıt izi (iddia → durum → kaynak + alıntı + erişim tarihi + uyarılar). Kapsam: yalnız iddialarda kullanılan ya da tüm kaynaklar; proje süzgeci. Panoya ya da dosyaya. JSON yedek dışa/içe aktarma (var olan kartlar ezilmez).
- **MyMind (isteğe bağlı):** PluginLabs Hub üzerinden iddia–kaynak karşılaştırma **taslağı**. Her istekte onay penceresi; yalnız iddia metni ile bağlı kaynakların başlığı ve kayıtlı alıntısı gider (adres, yazar, not, proje gitmez). Alıntı uydurmaz: önerilen alıntı kaynakta aynen yoksa atılır ve ilişki “belirsiz” olur. Siz **Uygula** demeden hiçbir bağ değişmez.
- Örnek proje (uydurma örnek kaynaklar), arşivleme/geri alma (silme yok), Windows kasasıyla (DPAPI) şifreli kayıt + son sağlam yedek.

## Sınırlar
- Chrome eklentisi (sayfada seçimi doğrudan yakalama) bu sürümde yok; tarayıcıdan kopyala → Panodan yakala akışı kullanılır. Linux/macOS paketi yok.
- Kaynak sayfa indirilmez; alıntının sayfada hâlâ bulunduğu çevrim içi denetlenmez (yalnız kartta kayıtlı metinle karşılaştırılır).
- BibTeX/RIS içe aktarma, PDF sayfa numarası ve ekip alanı (Pro) uygulanmadı. Yazar adı ayrıştırması basit kurallıdır (“Soyad, Ad; Kurum”).
- Paketler imzasızdır; SmartScreen uyarı verebilir. Windows'ta otomatik duman testi GitHub Actions Windows runner'ında koşmuştur; gerçek masaüstünde elle test, DPI ve ekran okuyucu kabulü yapılmamıştır.

## Dosyalar
- `SourceTrail-0.1.0-Windows-x64.exe` — kurulum (NSIS, kullanıcı başına)
- `SourceTrail-0.1.0-Windows-Portable-x64.exe` — taşınabilir
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri)
