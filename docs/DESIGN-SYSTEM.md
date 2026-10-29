# PluginLabs ortak tasarım standardı

## Kaynak ve kapsam

Referans mevcut Windows Electron Hub ve `ui/styles.css` dosyasıdır. ChatGPT desktop, okunabilirlik ve form ergonomisi için bir davranış referansıdır; marka, ikon veya özel varlıkları kopyalanmaz. Bu belge başka ürünlerin uygulanmış olduğunu göstermez. Android uygulaması ve ayrı bir web ürünü bu depoda yoktur. Tarayıcı köprüsü ayrı bir eklentidir.

## Renk ve tipografi

- İlk açılış koyu temadır: arka plan `#101214`, yüzey `#191c1f`, yükseltilmiş yüzey `#202427`, çizgi `#2a2e31`, metin `#edf0eb`, ikincil metin `#929a9e`, vurgu `#c1f78a`.
- Ortak roller korunur; ürün başına rastgele palet veya farklı durum renkleri oluşturulmaz. Renk tek başına başarı/hata/izin anlamı taşımaz.
- Yerel Inter Variable (Türkçe karakterleri içeren latin-ext), Segoe UI, Arial, sans-serif sırası kullanılır. Temel metin 16px/1.6; yardımcı metin en az 13px. Uzun metinler 60–75 karakter genişliğinde tutulur. Başlık hiyerarşisi 20/28/36px; kalınlık 500–650.
- Normal metin kontrastı en az 4.5:1, büyük metin ve arayüz sınırları en az 3:1 ölçülür. Ekran görüntüsü kontrast ölçümü yerine geçmez.

## Yerleşim ve formlar

- Boşluk ölçeği 4/8/12/16/24/32/48px; kart köşesi 16px, form köşesi 8–12px. Mevcut sol gezinme ve içerik hiyerarşisi korunur.
- Metin alanları görünür etiket, yardımcı açıklama ve alana bağlı hata içerir. Placeholder etiket yerine geçmez. Hata girilmiş veriyi silmez; düzeltme yolu sunar.
- Kontroller en az 40px yüksekliğinde; dokunma hedefi olan yüzeylerde 44px. Çok satırlı metin alanları en az 3 satır. Birincil eylem alan grubuyla ilişkili ve kolay görülebilir olur.
- Tab sırası görsel sırayı izler; odak göstergesi en az 2px, belirgin ve kırpılmadan görünür. Modal odak alır, odağı içinde tutar, Escape ile kapanır ve açan öğeye geri verir.
- Devam eden işlem, hata, boş durum ve başarı görünürdür. Düğme yalnız işlem sürerken kilitlenir; çift gönderim önlenir. İzin ve geri alınamaz işlem önizlemesi açık dil kullanır.
- Mevcut Hub minimum penceresi 1000×700; 100%, 150%, 200% Windows ölçeklerinde içerik ve form taşması denetlenir. Bu ölçü telefon/web desteği iddiası değildir.

## Gradyan ve hareket

- Gradyan yalnız hero/vurgu yüzeyinde, düşük doygunlukla ve en fazla iki yakın renk arasında kullanılır; metin alanının okunurluğu düz zeminle aynı kalmalıdır. Her kartta gradyan, sürekli parıltı veya hareketli arka plan kullanılmaz.
- Hover/odak geçişi 120–180ms, panel/modal 180–240ms; opacity ve en fazla 4px transform tercih edilir. Sürekli animasyon ve içerik yerini değiştiren süs hareketleri eklenmez.
- `prefers-reduced-motion: reduce` durumunda zorunlu olmayan animasyon, transform ve smooth scrolling kapatılır. İşlem durumunu bildiren metin görünür kalır.

## Ürünler arası uygulama ve kabul

Yeni bir ürün bu rollerin aynı adlarını, form durumlarını, gezinme davranışını ve izin dilini kullanır; platforma özgü davranış ayrıca belgelenir. Şu anda paylaşılan bir runtime bileşen paketi yoktur; bu standart onun varlığı olarak sunulmaz.

UI PR kabulü: koyu ilk açılış; Türkçe karakter/font kontrolü; yalnız klavyeyle temel akış; etiket/hata/odak; azaltılmış hareket; kontrast ölçümü; küçük pencere ve DPI; boş/yükleniyor/hata durumları. Gerçek uygulama ekran görüntüleri PR açıklamasına eklenir, üretilen derlemelerle birlikte gönderilir. Henüz yapılmayan elle kontroller açıkça işaretlenir.

![Mevcut Hub referansı](screenshots/overview.png)

## v1.0 kaynak ve runtime entegrasyonu

Tek kaynak [portable JSON](ecosystem-v1/design-system/tokens.json); Electron için üretilen adaptör `ui/design-tokens.css` dosyasıdır. `ui/index.html` bu dosyayı bileşen CSS'inden önce yükler. Değişiklikten sonra `npm run tokens:generate`, doğrulama için `npm run tokens:check` ve `npm test` çalıştırılır. Üretilen CSS depoda tutulur ve mevcut `ui/**` paketleme kuralıyla uygulamaya dahil edilir; başlangıçta dosya üretimi veya ağ isteği gerekmez. Eski `--bg`, `--surface`, `--accent` gibi kısa adlar uyumluluk alias'ları olarak kalır.

Etkin Hub ölçüleri: sidebar **268px**, <=1150px pencerede **230px**, kart köşesi **12px**, hero köşesi **16px**, menü **8px**, buton/form **7px**, dialog köşesi **15px** ve genişliği **650px**. İlk CSS kurallarındaki 248/210px ve 560px sonradan ezilir. 4px boşluk ölçeği yeni işler için rehberdir; mevcut 7/13/15/22/38px gibi ölçüler bu entegrasyonda yuvarlanmaz. Başlıklar için yukarıdaki ölçek hedef rehberdir; mevcut h1 28px, h2 17px, h3 16px, hero başlığı 30px (dar pencerede 26px) korunur.

Mevcut hero üç duraklı radyal gradyanı ve API kartı iki duraklı gradyanı aynen korunur; yukarıdaki “en fazla iki yakın renk” yeni iş rehberi mevcut hero'yu yeniden tasarlama gerekçesi değildir. CSS'in `no-preference` dalındaki 5 saniyelik `breathe` animasyonu mevcut davranış istisnasıdır. Yeni sürekli dekoratif hareket eklenmez. Mevcut azaltılmış hareket dalında animasyon ve buton geçişi yoktur. Light/System seçenekleri henüz uygulanmamıştır.

Flow Dock'un mavi `#8ab4f8` vurgusu, `#25272b` yüzeyi, `#363940` hover ve `#f3f4f6` metni önceki ürün şartnamesinden gelir; Hub paletinin yerine konmaz. JSON içindeki `productOverrides` runtime Hub CSS'ine aktarılmaz. WPF ResourceDictionary adaptörü ve Flow Dock cihaz doğrulaması ayrı iştir.

Bileşen sözleşmeleri, platform farkları ve kabul kayıtları için [ekosistem standardı](ecosystem-v1/DESIGN-SYSTEM.md); kaynak/cascade denetimi ve bu değişikliğin kanıtı için [v1 uygulama kaydı](DESIGN-SYSTEM-V1-IMPLEMENTATION.md).
