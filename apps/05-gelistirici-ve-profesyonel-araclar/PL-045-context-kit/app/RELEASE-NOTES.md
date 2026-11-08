# Context Kit 0.1.0 — önizleme (Windows)

PL-045 Context Kit'in ilk sürümü. Yapay zekâya bütün depoyu ya da yanlış dosyaları vermek yerine, **göreve göre seçilmiş parçalar ve dosya ağacıyla, token bütçesine sığan** bir bağlam paketi hazırlar. **Sırlar ve kişisel veriler gizlenir**, kaynaktaki **talimat benzeri metinler veri olarak işaretlenir**, her hariç tutmanın nedeni görünür. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `ContextKit-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `ContextKit-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri; uydurma test verisiyle)

## Neler var
- **Kaynaklar:** proje klasörü (**salt okunur**; hiçbir dosya değiştirilmez, sembolik bağlantı izlenmez, hariç klasörlerin içine girilmez; en çok 2000 dosya, dosya başına 1 MB, toplam 8 MB; **Yeniden tara**), **sayfa yapıştırma** (biçimli HTML metne çevrilir), **Panodan** ve `.html` / `.md` / `.txt` belgeleri. İndirme yoktur.
- **Hariç tutma:** varsayılanlar (`.git/`, `node_modules/`, `dist/`, `build/`, `out/`, `.next/`, `coverage/`, `__pycache__/`, `.venv/`, `target/`, `bin/`, `obj/`, `vendor/`, kilit dosyaları, `*.min.js`, `*.map`), ikili ve 1 MB üstü dosyalar; **sır dosyaları her zaman hariç** (`.env*`, `*.pem`, `*.key`, `id_rsa`, `credentials`, `secrets.*`); kendi kurallarınız `.gitignore` biçiminde (`!` istisnası, `/` köke bağlı). Dosya listesinde her hariç tutmanın nedeni yazar.
- **Görev odaklı seçim:** dosyalar en çok 60 satırlık parçalara (mümkünse işlev/sınıf/başlık sınırında) bölünür; görevden çıkarılan terimlerle (durak sözcükler atılır, Türkçe ekler için kök öneki, camelCase/snake_case bölünür) içerik, yol ve parça başlığı eşleşmesine göre puanlanır; bütçeye sığan en ilgili parçalar seçilir, komşu parçalar birleşir. **Dosya ağacı** her pakette (★ = pakette parça var). Dosya ya da parça **sabitlenebilir** ya da **dışlanabilir**.
- **Token bütçesi:** 4.000–128.000 (tahmin: karakter/4). Paket bütçeyi aşmaz; sığmayan ilgili parça sayısı gösterilir.
- **Sır ve kişisel veri filtresi:** AWS/GitHub/OpenAI (sk-)/Slack/Google/Stripe anahtarları, JWT, Bearer belirteçleri, özel anahtar blokları, parola/sır atamaları (tırnaklı değer, `ANAHTAR=değer` satırı, `|| "gömülü"` yedek değeri), bağlantı dizesi parolası, e-posta, telefon, T.C. kimlik, IBAN, kart numarası pakette `⟦GİZLİ:tür⟧` olur. Değişken atamaları (`req.body.parola`), `process.env` ve örnek değerler gizlenmez.
- **İstem enjeksiyonu:** "önceki talimatları yok say", "ignore previous instructions", sistem istemi isteme, anahtar gönderme ve rol etiketleri gibi satırlar işaretlenir; paket başlığı içeriğin **veri** olduğunu ve talimat sayılmayacağını yazar; pakette ayrıca not düşülür.
- **Dışa aktarma:** Markdown, JSON (ağaç, parçalar, yol/satır/puan) ya da panoya kopyalama. **Yazılan paket yeniden okunup denetlenir:** bütçe, `⟦GİZLİ⟧` dışında kalan sır (hedef 0), uyarı başlığı.
- **Ölçüler:** örnek projedeki iki elle etiketli görevde **gerekli bağlam kapsaması** (hedef ≥ %90) ve **paket boyutu azalması** (hedef ≥ %40), dışa aktarılan paketlerde azalma, kalan sır, bütçeyi aşan paket, gizlenen sır.
- **MyMind** (PluginLabs Hub) ya da bu bilgisayardaki **yerel model** (yalnız 127.0.0.1/localhost): her istekte onay; **yalnız görev, dosya yolları, token tahmini ve en çok 3 parça başlığı** (sırlar gizli) gider — dosya içerikleri, klasör yolu ve tüm depo gönderilmez. Model dosya **sıralaması** ve kısa **özet** önerir; olmayan yollar ve fazladan alanlar atılır, özet sansürlenir ve pakette "tahmin" olarak işaretlenir.
- Paketler (kaynak metinleri dahil) ve anahtar Windows kasasında (DPAPI) şifreli saklanır. Paketler silinmez, arşive taşınır.

## Sınırlar
- Pro değerlendirme ve ekip reçeteleri, Chrome kaynak seçici eklentisi, Linux/macOS paketleri bu sürümde yok.
- Puanlama sözcük eşleşmesine dayanır (anlamsal arama yok); paketi göndermeden önce önizlemede kontrol edin. Token sayısı tahminidir.
- Doğrulama: çekirdek birim testleri ve gerçek Electron penceresinde otomatik duman testi (diskte geçici gerçek klasör; taklit MyMind/yerel model sunucusu; Windows runner + Linux/xvfb). Kapsama ve azalma ölçütü yalnız uygulamadaki uydurma örnek projenin elle etiketli iki görevinde ölçüldü (kapsama %100, azalma %85,2 ve %86,6); **gerçek projelerde ve gerçek bir modelle ölçülmedi.** Windows DPI ve ekran okuyucu elle denenmedi.
