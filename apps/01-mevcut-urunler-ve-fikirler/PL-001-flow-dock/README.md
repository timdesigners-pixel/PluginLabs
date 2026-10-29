# PL-001 · Flow Dock

> Uygulamaları, klasörleri ve bağlantıları arama, favoriler ve hızlı erişim halkası üzerinden açar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-001` · `flow-dock` |
| Kategori | 01 · Mevcut ürünler ve fikirler — PL-001–010 |
| Durum | Çalışan Windows prototipi · bu görüşme |
| Öncelik / efor | P0 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3), yüzen balon |
| Geliştirme deposu | [timdesigners-pixel/flow-dock](https://github.com/timdesigners-pixel/flow-dock) |
| Codex projesi | `PL-001 · Flow Dock` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981edbfa2cdc55d867114) |

## Ne işe yarar

**Kullanıcı ve problem:** Uygulama, klasör ve komutlara erişirken masaüstü ve sekmeler arasında kaybolan yoğun bilgisayar kullanıcıları.

**Kısa tanım (Hub kataloğu):** Uygulamaları, klasörleri ve bağlantıları arama, favoriler ve hızlı erişim halkası üzerinden açar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M masaüstü + balon; Chrome köprüsü sonraki faz

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Tepsi, sürüklenen balon, arama, favoriler, kategori halkası ve tek klavye kısayolu. Mevcut 55 girişlik Windows prototipini paketle; Mac/Linux portunu ayrı doğrula.

### Yapay zekânın rolü

AI, komut niyetini önerilen uygulama/eyleme eşler; çekirdek başlatma çevrimdışı ve modelsiz kalır.

### Ayrıntılı özellik kapsamı

- **Tek tuş → başka tuş:** Caps Lock → Esc, sağ Alt → Ctrl gibi kullanıcı tanımlı eşlemeler; sol/sağ değiştirici tuşlar ayrı seçilebilir.
- **Tek tuş → kombinasyon:** Bir tuşla Ctrl+Shift+S gibi kombinasyon gönderme; desteklenen ortamlarda kaynak tuşun özgün işlevini engelleme.
- **Kombinasyon → eylem:** Kullanıcının seçtiği kombinasyonla uygulama, klasör, URL, arama, halka, çalışma alanı veya profil açma.
- **Kombinasyon → kombinasyon:** Kaynak kısayolu hedef kısayola çevirme. Hedef uygulama doğru odağa sahip değilse gönderim iptal edilir.
- **Uygulamaya özel profiller:** Genel, Kodlama, Hukuk, Tasarım ve kullanıcı profilleri. Ön plandaki uygulama için açıkça tanımlanmış profil genel eşlemeyi geçersiz kılar; kullanıcı profili elle sabitleyebilir. Halka açıkken profil ve eylem konumları değişmez.
- **Gelişmiş tetikler:** Basılı tutma, çift basma ve katman tuşu sonraki aşamada. Caps Lock kısa basışta Esc, basılı tutmada Ctrl gibi çift işlevler ayrı deneysel seçenek olur; gecikme ve eşik ayarlanabilir.
- **Metin ekleme:** Kullanıcının kaydettiği kısa metni veya şablonu ekleme. Pano kullanılırsa mevcut pano verisi korunur ve geri yükleme hatası görünür olur.
- **Halka düzenleyici:** Sekiz yuvaya sürükle-bırak ile uygulama/klasör/URL/eylem ekleme; konum değiştirme, simge ve etiket seçme, anlık önizleme ve son düzenlemeyi geri alma. Dolu yuvanın üzerine bırakmada değiştir/takas seçimi.
- **Bağlama göre halka:** Uygulamaya özel sekizli düzen; elle sabitleme ve görünür profil adı. Sık kullanılan öneriler ayrı alanda gösterilecek, kas hafızasını bozacak otomatik yer değişimi yapılmayacak.
- **Gelişmiş arama:** Türkçe karakterlere toleranslı ad ve takma ad araması; uygulama, klasör, bağlantı ve komut filtreleri. Sonuçlarda hedef ve çalışacak eylem açıkça görünecek.
- **Çalışma alanları:** “Kodlama”, “Hukuk” veya özel bir sahneyle seçili uygulama, klasör ve bağlantıları birlikte açma; zaten açık uygulamayı yeniden çoğaltmama tercihi, eksik hedef bildirimi ve adım bazlı sonuç.
- **Görsel akış oluşturucu:** Uygulama aç → hazır olmasını bekle → klasör/URL aç → kullanıcı tanımlı kısayolu gönder. Duraklat, iptal et, zaman aşımı ve başarısız adımda durma. Tek tıklama ile aynı akışın yanlışlıkla tekrar başlaması engellenecek.
- **Sistem kontrolleri:** Ses ve medya kontrolleri için halka üzerinden küçük ayar çubuğu; desteklenmeyen kontroller devre dışı ve açıklamalı.
- **Kişiselleştirme:** Halka boyutu, opaklık, vurgu rengi, animasyon hızı, hareket azaltma, ekran başına konum ve tam ekran uygulamada otomatik gizleme.
- **Yedekleme ve onarım:** Sürümlü JSON dışa/içe aktarma; içe aktarmada fark ve çakışma önizlemesi. Bozuk uygulama yollarını bulup yeniden seçme; son geçerli ayarlara dönme.
- **Kullanım özeti:** Halka açılışı, başlatılan eylem, başarılı/başarısız işlem, aktif gün ve tamamlanan çalışma akışı sayısı. Arka planda açık kalma aktif kullanım sayılmaz.
- **En çok kullanılanlar:** Uygulama, klasör, bağlantı, halka yuvası, profil ve kısayol bazında kullanım sırası; kullanılmayan eşlemeler için isteğe bağlı öneri. Öneriler düzeni otomatik değiştirmez.
- **Klavye istatistikleri:** Kısayol tetikleme ve tuş eşleme kullanım sayıları; fiziksel basış başına bir kullanım. İşletim sisteminin tuş tekrarları ayrı tutulur, ana sayacı şişirmez. Yazılan karakterler ve ham tuş dizileri saklanmaz.
- **Günlük ve haftalık görünüm:** Gün bazında sütun grafiği, haftalık karşılaştırma ve saat/gün yoğunluk haritası. Tarih sınırları kullanıcının yerel saat dilimine göre hesaplanır; önceki dönemin verisi yoksa artış yüzdesi yerine açıklama gösterilir.
- **Akış verimliliği:** Başarı oranı = başarılı akış / tamamlanmış başarılı veya başarısız akış; iptal edilen ve hâlen süren akışlar ayrıca gösterilir. Adım bazında hata ve yürütme süresi; uygulamayı başlatma başarısı, uygulama içindeki işin tamamlanması olarak sunulmaz.
- **Tahmini zaman tasarrufu:** Kullanıcının belirlediği manuel işlem süresi ile ölçülen Flow Dock işlem süresinin pozitif farklarının toplamı. Başarısız ve iptal edilen işlemler hariç; temel süre tanımlanmamışsa hesap yapılmaz. Her zaman “tahmin” etiketi ve hesap yöntemi gösterilir.
- **Performans:** Halka açılış gecikmesi ve eylem yanıt süresi için örnek sayısı, medyan ve p95; bekleme/akış süresi ile arayüz yanıtı ayrı gösterilir.
- **Görünüm ve animasyon:** Logitech Actions Ring’e yaklaşan sekiz yuvarlak eylem, 48 DIP buton, 104 DIP halka yarıçapı, antrasit yüzey, açılış/hover/basma/kapanış süreleri ve hareket azaltma önceki tasarım bölümünde kayıtlıdır.
- **Klavye ve fare:** Kısayol atama, doğrudan tuş işlevi değiştirme, kombinasyonlar, profiller, ileri tetikler, çakışmalar ve duraklatma kapsamı kayıtlıdır.
- **Günlük kullanım:** Halka düzenleme, bağlama göre eylemler, arama, çalışma alanları, akışlar, sistem kontrolleri, kişiselleştirme ve yedekleme kayıtlıdır.
- **İstatistik:** Günlük/haftalık raporlar, eylem ve eşleme sayaçları, başarı oranı, yoğunluk haritası, tahmini tasarruf, yerel saklama, silme ve dışa aktarma kayıtlıdır.
- **Geliştirme takibi:** FD-01–FD-16 işlerindeki onay kutuları tamamlanmamış olarak korunur. Kaynak kod değişikliği ve çalışan sürüm testi bu konuşmada yapılmadı.
- **Yeni yeteneklerin sınırı:** Pano geçmişi ayrı kullanıcı tercihiyle açılır; istatistik olaylarına pano içeriği girmez. Seçili metin ve doğal dil özelliklerinde dış sağlayıcıya gönderilecek içerik görünür olur. Pencere yerleşimi, fare tuşları ve uygulama komutları platform desteği doğrulanarak sunulur.

## Teknik bağımlılık ve sınırlar

Yerel uygulama başlatma izinleri; eklenti komutları izin listesinde. Chrome tek başına işletim sistemi uygulaması başlatmaz; yerel köprü gerekir.

## Gelir hipotezi

Ücretsiz çekirdek; Pro akış paketleri ve cihazlar arası düzen eşitleme.

## Doğrulama ölçütü

İlk hafta 3 favori ekleme; D7 geri dönüş ≥%30; soğuk açılış p95 ≤2 sn.

## Öncelik ve efor

P0 · M; mevcut WPF kodu Windows’a özgü, ortak ürün çekirdeğine portlanacak.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-001-<konu>` veya `claude/PL-001-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

<date start="2026-10-25" /> uygulama güncellemesi: İlk geliştirme paketi Windows sürümüne uygulandı; tamamlananlar, testler ve açık kabul maddeleri: <mention url="https://app.notion.com/p/4048aa13d8f98149b30cd9a01a0a2e6e" />. Ortak yerel AI altyapısı: <mention url="https://app.notion.com/p/4048aa13d8f981eea720d706b3f8209a" />. Tüm geliştirme listesi tamamlanmış değildir.

- **Durum:** Çalışan Windows prototipi · bu görüşme
- **Platform:** W / L / M masaüstü + balon; Chrome köprüsü sonraki faz
- **Kullanıcı ve problem:** Uygulama, klasör ve komutlara erişirken masaüstü ve sekmeler arasında kaybolan yoğun bilgisayar kullanıcıları.
- **MVP ve temel akış:** Tepsi, sürüklenen balon, arama, favoriler, kategori halkası ve tek klavye kısayolu. Mevcut 55 girişlik Windows prototipini paketle; Mac/Linux portunu ayrı doğrula.
- **Yapay zekânın rolü:** AI, komut niyetini önerilen uygulama/eyleme eşler; çekirdek başlatma çevrimdışı ve modelsiz kalır.
- **Teknik bağımlılık ve sınır:** Yerel uygulama başlatma izinleri; eklenti komutları izin listesinde. Chrome tek başına işletim sistemi uygulaması başlatmaz; yerel köprü gerekir.
- **Gelir hipotezi:** Ücretsiz çekirdek; Pro akış paketleri ve cihazlar arası düzen eşitleme.
- **Doğrulama ölçütü:** İlk hafta 3 favori ekleme; D7 geri dönüş ≥%30; soğuk açılış p95 ≤2 sn.
- **Öncelik ve efor:** P0 · M; mevcut WPF kodu Windows’a özgü, ortak ürün çekirdeğine portlanacak.

### Yüzen buton ve halka — Logitech Actions Ring referanslı tasarım

**Tasarım kararı:** Yüzen buton ve açılan kategori/eylem halkasının görünümü ve hareketleri Logitech Actions Ring deneyimine yaklaştırılacak. Merkezde küçük bir tetikleyici, çevresinde eşit aralıklı sekiz bağımsız yuvarlak eylem bulunacak. Flow Dock simgesi ve marka kimliği korunacak.

**Görünüm**

- Kapalı durumda 48 DIP çapında, mat antrasit yüzeyli yuvarlak buton; ince açık kenar, yumuşak gölge ve ortalanmış Flow Dock simgesi. Sürekli dönme, nabız veya dikkat çeken parıltı kullanılmayacak.
- Açık durumda merkez çevresinde 45° aralıklarla sekiz adet 48 DIP eylem balonu; merkezler arası halka yarıçapı başlangıçta 104 DIP. Ortası boş, ferah bir düzen; kalın pasta dilimleri yerine ayrı daireler.
- Yüzey #25272B, hover #363940, simge #F3F4F6; seçili öğede sakin mavi #8AB4F8 kenar/vurgu. 1 DIP ince kenar ve hafif gölge; okunaklı tek çizgi ikon ailesi.
- Hover veya klavye odağında eylem adı kısa bir etiketle gösterilecek. Kategori seçilince aynı sekiz konum yeni eylemlerle değişecek; merkez geri düğmesine dönüşecek.
- Küçük / orta / büyük boyut seçenekleri; varsayılan orta. Ekran kenarında halka bütünüyle görünür alana kaydırılacak; kapalı butonun kaydedilmiş konumu korunacak.

**Animasyon hedefleri**

- Açılış: balonlar merkezden dış konumlarına 180–220 ms içinde taşınırken opaklık 0’dan 1’e, ölçek 0,80’den 1’e gelir. Ease-out ve en fazla %3 kısa yaylanma; öğeler arası 8–12 ms gecikme. Dönerek açılma yok.
- Hover/odak: 100–120 ms içinde ölçek 1,08 ve yüzey/vurgu geçişi. Komşu balonların konumu değişmez.
- Basma: 70 ms içinde ölçek 0,94; bırakmada 100 ms içinde normale dönüş. Başarılı eylemden sonra 120–160 ms içinde merkeze toplanarak kapanma.
- Kategori değişimi: 100–140 ms çapraz solma; halkanın yeri ve odak sırası sabit kalır.
- Sürükleme: 6 DIP hareket eşiği geçildiğinde tıklama iptal olur, buton imleci doğrudan izler. Bırakınca ekran kenarına isteğe bağlı 160–200 ms yumuşak yerleşme.
- Hareket azaltma açıkken yaylanma, ölçek ve konum geçişleri kaldırılır; yalnız en fazla 80 ms solma veya anlık geçiş kullanılır.

**Etkileşim**

- Tek tıklama veya mevcut genel klavye kısayolu halkayı açar/kapatır. Yalnız hover ile eylem çalışmaz; seçim açık tıklama ya da Enter ile yapılır.
- Esc ve dışarı tıklama kapatır; odağı önceki uygulamaya geri verir. Tab/ok tuşlarıyla sekiz eyleme erişilir; görünür odak ve erişilebilir eylem adları sağlanır.
- Favoriler, uygulama arama, kategori halkası, tepsi ve mevcut başlatma davranışı korunur. Parametre ayarlama gereken eylemlerde, ileriki fazda hover + tekerlek ya da basılı tutup yatay sürükleme ile kompakt ayar çubuğu değerlendirilebilir.

**Uygulama ve kabul**

- Mevcut Windows WPF prototipinde animasyonlar RenderTransform (TranslateTransform / ScaleTransform) ve Opacity üzerinden kurulacak; her karede yerleşim hesabı yapılmayacak. Açılış/kapanış art arda tetiklendiğinde eski animasyon iptal edilip mevcut görsel durumdan devam edilecek.

- [ ] Kapalı, açık, hover, basılı ve kategori değiştirme durumları bu tasarımla uygulanacak.
- [ ] 60 Hz ekranda akıcı geçiş; 100%, 150% ve 200% DPI ile çoklu ekran/kenar senaryoları gerçek Windows cihazında doğrulanacak.
- [ ] Hızlı aç/kapat, sürükleme sonrası yanlış tıklama, Esc, dışarı tıklama, odak dönüşü ve hareket azaltma kontrol edilecek.

**Referans ve durum:** [Logitech Actions Ring](https://www.logitech.com/en-eu/software/actions-ring) ve [resmî kullanım açıklaması](https://support.logi.com/hc/en-gb/articles/17844647906967-Actions-Ring). Yukarıdaki renk, boyut, süre ve easing değerleri Logitech’in yayımladığı teknik değerler değil, Flow Dock için belirlenen tasarım hedefleridir. Bu güncelleme Notion tasarım şartnamesidir; kaynak kod değişikliği veya çalışan sürüm testi yapılmış değildir.

### Genişletilmiş ürün kapsamı ve geliştirme işleri

**Güncelleme:** <date start="2026-10-25" />. Aşağıdaki özellikler geliştirme kapsamına eklendi; tamamlanmış özellik değildir. Yerel çalışma alanında kaynak kod bulunamadı; bağlı GitHub hesabında Flow adına yapılan aramada Flow Dock deposu bulunamadı. Kod uygulaması için mevcut WPF projesinin konumu gerekli.

#### Klavye kısayolları ve doğrudan tuş eşleme

**İki ayrı işlem:** “Kısayol ata” bir kombinasyonla Flow Dock eylemini çalıştırır; “Tuşu yeniden eşle” fiziksel tuşun uygulamalara iletilen işlevini değiştirir. Aynı ayar ekranında ayrı sekmeler olarak sunulacak.

- **Tek tuş → başka tuş:** Caps Lock → Esc, sağ Alt → Ctrl gibi kullanıcı tanımlı eşlemeler; sol/sağ değiştirici tuşlar ayrı seçilebilir.
- **Tek tuş → kombinasyon:** Bir tuşla Ctrl+Shift+S gibi kombinasyon gönderme; desteklenen ortamlarda kaynak tuşun özgün işlevini engelleme.
- **Kombinasyon → eylem:** Kullanıcının seçtiği kombinasyonla uygulama, klasör, URL, arama, halka, çalışma alanı veya profil açma.
- **Kombinasyon → kombinasyon:** Kaynak kısayolu hedef kısayola çevirme. Hedef uygulama doğru odağa sahip değilse gönderim iptal edilir.
- **Uygulamaya özel profiller:** Genel, Kodlama, Hukuk, Tasarım ve kullanıcı profilleri. Ön plandaki uygulama için açıkça tanımlanmış profil genel eşlemeyi geçersiz kılar; kullanıcı profili elle sabitleyebilir. Halka açıkken profil ve eylem konumları değişmez.
- **Gelişmiş tetikler:** Basılı tutma, çift basma ve katman tuşu sonraki aşamada. Caps Lock kısa basışta Esc, basılı tutmada Ctrl gibi çift işlevler ayrı deneysel seçenek olur; gecikme ve eşik ayarlanabilir.
- **Metin ekleme:** Kullanıcının kaydettiği kısa metni veya şablonu ekleme. Pano kullanılırsa mevcut pano verisi korunur ve geri yükleme hatası görünür olur.

**Ayar akışı:** Yeni eşleme → kaynak tuşu/kombinasyonu yakala → hedef tuş/kombinasyon/eylem seç → genel veya uygulamaya özel kapsam → çakışmaları göster → deneme alanında test → etkinleştir. Kaynak ve hedef metin olarak da seçilebilir; eşleme başına aç/kapat, düzenle, çoğalt ve kaldır bulunur.

**Çalışma kuralları**

- Kaynak tuş yutulacak mı, özgün işlev de geçecek mi açıkça gösterilir. Aynı kapsamda aynı kaynağa iki etkin eşleme kaydedilemez.
- Üretilen tuşlar yeniden eşleme motoruna girmeyecek; A → B ve B → A döngüsü oluşmayacak. Basma/bırakma olayları ve Ctrl/Alt/Shift/Win durumları birlikte yönetilecek.
- Profil değişimi veya devre dışı bırakma sırasında sentetik basılı tuşlar serbest bırakılacak; kaynak tuş bırakılana kadar yeni profil onun olaylarını devralmayacak.
- Tepside ve ayarlarda “Tüm eşlemeleri duraklat” bulunacak. Kurtarma kısayolu ayrı tutulacak ve yeniden eşlenemeyecek; sorunlu profilden sonra uygulama eşlemeler kapalı başlatılabilecek.
- Windows ilk hedef. Sistemce ayrılmış, güvenli masaüstünde kullanılan veya yetki nedeniyle yakalanamayan kombinasyonlar destekleniyor gibi gösterilmeyecek. Yönetici yetkili uygulamalar, Türkçe Q/F düzenleri, AltGr, IME ve uzak masaüstü ayrı doğrulanacak.
- İlk sürüm eşlemeleri Flow Dock çalışırken uygulanacak; kalıcı sistem/scancode değişikliği ayrı kapsamda değerlendirilecek. Her fiziksel klavyeye ayrı eşleme ilk sürümde vaat edilmeyecek.
- Tuş metinleri veya yazılan içerik kaydedilmeyecek. Hata günlüğü eşleme kimliği, sonuç ve hata türüyle sınırlı olacak.

#### Günlük kullanımı hızlandıran özellikler

- **Halka düzenleyici:** Sekiz yuvaya sürükle-bırak ile uygulama/klasör/URL/eylem ekleme; konum değiştirme, simge ve etiket seçme, anlık önizleme ve son düzenlemeyi geri alma. Dolu yuvanın üzerine bırakmada değiştir/takas seçimi.
- **Bağlama göre halka:** Uygulamaya özel sekizli düzen; elle sabitleme ve görünür profil adı. Sık kullanılan öneriler ayrı alanda gösterilecek, kas hafızasını bozacak otomatik yer değişimi yapılmayacak.
- **Gelişmiş arama:** Türkçe karakterlere toleranslı ad ve takma ad araması; uygulama, klasör, bağlantı ve komut filtreleri. Sonuçlarda hedef ve çalışacak eylem açıkça görünecek.
- **Çalışma alanları:** “Kodlama”, “Hukuk” veya özel bir sahneyle seçili uygulama, klasör ve bağlantıları birlikte açma; zaten açık uygulamayı yeniden çoğaltmama tercihi, eksik hedef bildirimi ve adım bazlı sonuç.
- **Görsel akış oluşturucu:** Uygulama aç → hazır olmasını bekle → klasör/URL aç → kullanıcı tanımlı kısayolu gönder. Duraklat, iptal et, zaman aşımı ve başarısız adımda durma. Tek tıklama ile aynı akışın yanlışlıkla tekrar başlaması engellenecek.
- **Sistem kontrolleri:** Ses ve medya kontrolleri için halka üzerinden küçük ayar çubuğu; desteklenmeyen kontroller devre dışı ve açıklamalı.
- **Kişiselleştirme:** Halka boyutu, opaklık, vurgu rengi, animasyon hızı, hareket azaltma, ekran başına konum ve tam ekran uygulamada otomatik gizleme.
- **Yedekleme ve onarım:** Sürümlü JSON dışa/içe aktarma; içe aktarmada fark ve çakışma önizlemesi. Bozuk uygulama yollarını bulup yeniden seçme; son geçerli ayarlara dönme.

#### Kullanım istatistikleri

**İstatistik ekranı:** Bugün, son 7 gün, son 30 gün ve özel tarih aralığı; profil, eylem türü ve tetikleme yöntemi filtreleri. Boş dönemlerde örnek rakam yerine “Henüz kullanım yok” gösterilecek.

- **Kullanım özeti:** Halka açılışı, başlatılan eylem, başarılı/başarısız işlem, aktif gün ve tamamlanan çalışma akışı sayısı. Arka planda açık kalma aktif kullanım sayılmaz.
- **En çok kullanılanlar:** Uygulama, klasör, bağlantı, halka yuvası, profil ve kısayol bazında kullanım sırası; kullanılmayan eşlemeler için isteğe bağlı öneri. Öneriler düzeni otomatik değiştirmez.
- **Klavye istatistikleri:** Kısayol tetikleme ve tuş eşleme kullanım sayıları; fiziksel basış başına bir kullanım. İşletim sisteminin tuş tekrarları ayrı tutulur, ana sayacı şişirmez. Yazılan karakterler ve ham tuş dizileri saklanmaz.
- **Günlük ve haftalık görünüm:** Gün bazında sütun grafiği, haftalık karşılaştırma ve saat/gün yoğunluk haritası. Tarih sınırları kullanıcının yerel saat dilimine göre hesaplanır; önceki dönemin verisi yoksa artış yüzdesi yerine açıklama gösterilir.
- **Akış verimliliği:** Başarı oranı = başarılı akış / tamamlanmış başarılı veya başarısız akış; iptal edilen ve hâlen süren akışlar ayrıca gösterilir. Adım bazında hata ve yürütme süresi; uygulamayı başlatma başarısı, uygulama içindeki işin tamamlanması olarak sunulmaz.
- **Tahmini zaman tasarrufu:** Kullanıcının belirlediği manuel işlem süresi ile ölçülen Flow Dock işlem süresinin pozitif farklarının toplamı. Başarısız ve iptal edilen işlemler hariç; temel süre tanımlanmamışsa hesap yapılmaz. Her zaman “tahmin” etiketi ve hesap yöntemi gösterilir.
- **Performans:** Halka açılış gecikmesi ve eylem yanıt süresi için örnek sayısı, medyan ve p95; bekleme/akış süresi ile arayüz yanıtı ayrı gösterilir.

**Veri ve kullanıcı kontrolü:** İstatistik toplama ilk kullanımda açık tercihle etkinleştirilecek; varsayılan yerel depolama, buluta gönderim yok. Duraklat, tümünü sil, seçili dönemi temizle ve CSV/JSON dışa aktar seçenekleri bulunacak. Varsayılan saklama süresi 90 gün, kullanıcı tarafından değiştirilebilir. Dosya yolu, URL içeriği, pencere başlığı, belge metni ve pano içeriği olaylara eklenmez; kullanıcı arayüzündeki etiketler mevcut yerel eylem kimlikleriyle çözülür. Dışa aktarımda ad/etiketleri dahil etme ayrıca seçilir.

**Olay modeli:** Tekil olay kimliği, eylem/akış çalıştırma kimliği, zaman, yerel saat dilimi, profil kimliği, eylem kimliği, tetikleme türü, sonuç, süre ve sınırlı hata kodu. Aynı olay yeniden işlendiğinde sayaç artmaz. Halka açma ve eylem çalıştırma ayrı metriklerdir; akış içindeki alt adımlar bağımsız kullanıcı tetiklemesi olarak sayılmaz. Tuş eşleme başarısı yalnız hedef girdinin iletildiğini ifade eder; hedef uygulamanın komutu yerine getirdiği varsayılmaz.

- [ ] FD-12: FD-01 sonrasında yerel olay kaydı ve tekilleştirmeyi ekle; aynı kimlikli olay iki kez işlense de yalnız bir kez sayılsın, kayıt kapalıyken yeni olay yazılmasın.
- [ ] FD-13: Günlük/haftalık panoyu ve filtreleri uygula; 10 başarı + 2 hata + 1 iptal içeren örnekte toplam 13, başarı oranı 10/12 olarak gösterilsin.
- [ ] FD-14: Klavye sayaçlarını ekle; basılı tutma/tekrar ve üretilmiş tuşlar yeni fiziksel kullanım sayılmasın.
- [ ] FD-15: Saklama, silme ve dışa aktarmayı doğrula; temizlenen dönem raporda kalmasın, yeniden başlatmada geri gelmesin.
- [ ] FD-16: Zaman tasarrufu hesabını doğrula; temel süre yoksa tahmin üretilmesin, hata/iptal tasarrufa katılmasın. Saat dilimi değişimi ve gece yarısı raporları kontrol edilsin.

#### Uygulama sırası ve kabul koşulları

**Birinci paket — çekirdek ve klavye**

- [ ] FD-01: Eylem/profil/eşleme kayıtlarına kalıcı kimlik ve şema sürümü ekle; yeniden başlatmada ayarlar kaybolmasın, bozuk dosyada son geçerli ayarlar açılsın.
- [ ] FD-02: Kısayol atama ekranını ve çakışma denetimini uygula; kayıtlı bir kombinasyon tek basışta tek eylem çalıştırsın.
- [ ] FD-03: Tuş → tuş ve tuş → kombinasyon motorunu uygula; Caps Lock → Esc ve tek tuş → Ctrl+Shift+S denemeleri basma/bırakma dahil geçsin.
- [ ] FD-04: Uygulama profili, sabitleme ve duraklatmayı ekle; odak değişiminde doğru eşleme seçilsin ve devre dışı bırakmada basılı değiştirici kalmasın.
- [ ] FD-05: Türkçe Q/F, AltGr, tuş tekrarı, uyku/uyanma, hızlı profil geçişi ve yetki farkını doğrula; desteklenmeyen durum açıklamalı olsun.

**İkinci paket — halka ve erişim**

- [ ] FD-06: Önceki Actions Ring tasarımıyla halka düzenleyiciyi uygula; sekiz yuvanın sırası yeniden başlatmada korunsun ve sürükleme yanlış eylem çalıştırmasın.
- [ ] FD-07: Profil halkalarını ve aramayı ekle; halka açıkken sıralama sabit kalsın, takma adla aranan hedef bulunabilsin.
- [ ] FD-08: Çoklu ekran, DPI, klavye odağı ve hareket azaltma kabul kontrollerini tamamla.

**Üçüncü paket — çalışma akışları**

- [ ] FD-09: Çalışma alanı başlatmayı ekle; eksik hedef diğer adımların sonucunu gizlemesin, yeniden tetikleme mükerrer başlatma üretmesin.
- [ ] FD-10: Akış oluşturucuyu ekle; hedef pencere hazır olmadan tuş gönderilmesin, iptal sonrası bekleyen adımlar çalışmasın.
- [ ] FD-11: Yedekleme/geri alma ve bozuk kısayol onarımını ekle; geçersiz içe aktarma mevcut ayarları değiştirmesin.

**Bağımlılıklar:** FD-02–05 ve FD-06–07, FD-01’e; FD-09–10 eylem/profil altyapısına bağlıdır. Basılı tutma/çift basma, klavye cihazına özel eşleme, bulut eşitleme ve macOS/Linux portları çekirdek doğrulandıktan sonra ayrı iş olarak ele alınacak. Tahmini teslim tarihi veya tamamlanmış geliştirme yüzdesi belirlenmedi.

### Konuşmadan derlenen 50 geliştirme önerisi

**Kayıt tarihi:** <date start="2026-10-25" />. Bu katalog, konuşmadaki 50 önerinin tamamını korur. Önceki tasarım, klavye ve istatistik bölümlerinin ayrıntıları ile FD-01–FD-16 kabul görevleri geçerlidir. Bu listedeki FD-F01–FD-F50 kimlikleri özellik önerilerini, FD-01–FD-16 ise uygulama ve doğrulama işlerini ifade eder. Önerilerin kaydedilmesi, çalışan uygulamaya eklendikleri anlamına gelmez.

| No | Geliştirme | Kullanıcıya faydası | Öncelik önerisi |
| --- | --- | --- | --- |
| FD-F01 | Uygulamaya özel halkalar | VS Code, tarayıcı veya tasarım uygulamasına geçince ilgili araçlar gelir. | ★ İlk sürüm |
| FD-F02 | Sürükle-bırak halka düzenleyici | Uygulama, dosya ve bağlantılar doğrudan halkaya eklenir. | ★ İlk sürüm |
| FD-F03 | Birden fazla halka sayfası | Fare tekerleğiyle farklı sekizli eylem gruplarına geçilir. | Sonraki değerlendirme |
| FD-F04 | İç içe kategori halkaları | İş → Hukuk → Dosyalar gibi gruplar oluşturulur. | Sonraki değerlendirme |
| FD-F05 | Basılı tutarak yön seçme | Tetikleyiciye basılı tutup bir yöne hareket ederek eylem seçilir. | Sonraki değerlendirme |
| FD-F06 | İmlecin yanında açılma | Halka sabit butona gitmeden imlecin yanında açılır. | Sonraki değerlendirme |
| FD-F07 | Kenarda yarım halka | Ekran kenarlarında eylemler erişilebilir biçimde dizilir. | Sonraki değerlendirme |
| FD-F08 | Halka düzenini sabitleme | Otomatik profil değişse bile seçilen düzen korunur. | Sonraki değerlendirme |
| FD-F09 | Tema ve görünüm editörü | Renk, opaklık, boyut, ikon ve animasyon ayarlanır. | Sonraki değerlendirme |
| FD-F10 | Canlı düzenleme önizlemesi | Ayar değişiklikleri kaydetmeden denenir. | Sonraki değerlendirme |
| FD-F11 | Doğrudan tuş yeniden eşleme | Caps Lock → Esc gibi tuş işlevleri değiştirilir. | ★ İlk sürüm |
| FD-F12 | Tek tuştan kombinasyon çalıştırma | Bir tuş Ctrl+Shift+S gibi bir kısayol gönderir. | ★ İlk sürüm |
| FD-F13 | Uygulamaya özel tuş eşlemeleri | Aynı tuş farklı programlarda farklı işler yapar. | Sonraki değerlendirme |
| FD-F14 | Kısa basma / basılı tutma | Bir tuşa iki farklı işlev atanır. | Sonraki değerlendirme |
| FD-F15 | Çift basma eylemleri | Aynı tuşa çift basınca ikinci bir komut çalışır. | Sonraki değerlendirme |
| FD-F16 | Katman tuşları | Bir tuşa basılıyken klavye geçici bir komut paneline dönüşür. | Sonraki değerlendirme |
| FD-F17 | Fare düğmesi eşlemeleri | Desteklenen ek fare düğmelerine Flow Dock eylemleri atanır. | Sonraki değerlendirme |
| FD-F18 | Kısayol çakışma denetimi | Aynı kombinasyona yapılan atamalar kaydetmeden fark edilir. | ★ İlk sürüm |
| FD-F19 | Sanal klavye üzerinde düzenleme | Hangi tuşun neye atandığı görsel olarak görülür. | Sonraki değerlendirme |
| FD-F20 | Eşlemeleri anında duraklatma | Tek hareketle klavye ve fare varsayılan davranışına döner. | ★ İlk sürüm |
| FD-F21 | Birleşik hızlı arama | Uygulama, dosya, klasör, bağlantı ve eylem tek yerden bulunur. | ★ İlk sürüm |
| FD-F22 | Takma ad ve Türkçe toleranslı arama | Dava, kod veya kullanıcı tanımlı adlarla hedefe erişilir. | Sonraki değerlendirme |
| FD-F23 | Dosyayı eyleme sürükleme | Bir dosya halkadaki uygun uygulama veya işleme bırakılır. | Sonraki değerlendirme |
| FD-F24 | Seçili metne uygun eylemler | Metni çevirme, arama, not alma ve biçimlendirme sunulur. | Sonraki değerlendirme |
| FD-F25 | Pano geçmişi ve sabitleme | Sık kullanılan metinler tekrar bulunup yapıştırılır. | Sonraki değerlendirme |
| FD-F26 | Değişkenli metin şablonları | Tarih, isim ve dosya numarası içeren metinler hızlı hazırlanır. | Sonraki değerlendirme |
| FD-F27 | Hesap makinesi ve birim dönüşümü | Arama alanından hesap ve dönüşüm yapılır. | Sonraki değerlendirme |
| FD-F28 | Uygulama içi komut kataloğu | Desteklenen programların komutları aranıp halkaya atanır. | Sonraki değerlendirme |
| FD-F29 | Son kullanılanlar bölümü | Yakın zamanda açılan hedeflere hızlı dönülür. | Sonraki değerlendirme |
| FD-F30 | Bozuk kısayol onarımı | Taşınan veya kaldırılan uygulama hedefleri bulunup düzeltilir. | ★ İlk sürüm |
| FD-F31 | Çalışma alanları | Kodlama veya Hukuk seçilince ilgili uygulama ve klasörler açılır. | ★ İlk sürüm |
| FD-F32 | Pencere yerleşimlerini geri yükleme | Desteklenen uygulamalar kayıtlı ekran ve konumlarına yerleştirilir. | Sonraki değerlendirme |
| FD-F33 | Görsel akış oluşturucu | Birden fazla işlem sürükle-bırak adımlarla bağlanır. | Sonraki değerlendirme |
| FD-F34 | Koşullu akışlar | Uygulama açıksa odakla, kapalıysa başlat gibi kurallar oluşturulur. | Sonraki değerlendirme |
| FD-F35 | Akış değişkenleri | Seçili dosya, pano metni veya girilen değer sonraki adıma aktarılır. | Sonraki değerlendirme |
| FD-F36 | Akış deneme modu | Çalıştırmadan önce adımlar ve hedefler incelenir. | Sonraki değerlendirme |
| FD-F37 | Adım adım hata ayıklama | Akışın nerede durduğu görülür ve ilgili adım yeniden denenir. | Sonraki değerlendirme |
| FD-F38 | Hazır iş akışı şablonları | Toplantı, araştırma, yazılım geliştirme ve belge hazırlama düzenleri sunulur. | Sonraki değerlendirme |
| FD-F39 | Odak modu | Seçilen süre boyunca sade halka ve gerekli araçlar gösterilir. | Sonraki değerlendirme |
| FD-F40 | Ses ve medya kontrol halkası | Ses seviyesi, oynatma ve mikrofon durumu destek ölçüsünde yönetilir. | Sonraki değerlendirme |
| FD-F41 | Kullanım istatistikleri panosu | Günlük/haftalık kullanım ve en sık kullanılan eylemler görülür. | ★ İlk sürüm |
| FD-F42 | Halka yoğunluk haritası | Hangi yuvaların sık, hangilerinin az kullanıldığı anlaşılır. | Sonraki değerlendirme |
| FD-F43 | Kısayol kullanım analizi | Atanmış ama kullanılmayan veya zor erişilen kısayollar belirlenir. | Sonraki değerlendirme |
| FD-F44 | Tahmini zaman tasarrufu | Manuel süreyle karşılaştırılan kazanım hesap yöntemiyle gösterilir. | Sonraki değerlendirme |
| FD-F45 | Akış başarı ve performans raporu | Hatalı adımlar ve yavaş işlemler bulunur. | Sonraki değerlendirme |
| FD-F46 | Kişisel düzenleme önerileri | Kullanıma göre favori veya kısayol önerilir; değişiklik kullanıcıya bırakılır. | Sonraki değerlendirme |
| FD-F47 | Ayar geçmişi ve geri alma | Hatalı düzenleme sonrası önceki çalışan yapılandırmaya dönülür. | Sonraki değerlendirme |
| FD-F48 | Profil yedekleme ve paylaşma | Halka, eşleme ve akışlar tek paket olarak dışa aktarılır. | Sonraki değerlendirme |
| FD-F49 | Eklenti geliştirme altyapısı | Yeni uygulama bağlantıları ve özel eylemler eklenebilir. | Sonraki değerlendirme |
| FD-F50 | Doğal dille eylem oluşturma | Bu tuş hukuk klasörümü açsın isteği incelenebilir ayar taslağına çevrilir. | Sonraki değerlendirme |

#### İlk geliştirme paketi önerisi

Halka düzenleyici, tuş eşleme, çakışma denetimi, hızlı arama, çalışma alanları ve istatistik panosu ilk geliştirme paketinin odağıdır. ★ işaretleri ilk sürüm için öncelik önerisidir; teslim tarihi veya tamamlanma taahhüdü değildir. İleri hareketler, çoklu sayfalar ve katmanlar temel sekizli halkanın kullanımını karmaşıklaştırmadan isteğe bağlı sunulur.

#### Konuşma kapsamı ve uygulama durumu

- **Görünüm ve animasyon:** Logitech Actions Ring’e yaklaşan sekiz yuvarlak eylem, 48 DIP buton, 104 DIP halka yarıçapı, antrasit yüzey, açılış/hover/basma/kapanış süreleri ve hareket azaltma önceki tasarım bölümünde kayıtlıdır.
- **Klavye ve fare:** Kısayol atama, doğrudan tuş işlevi değiştirme, kombinasyonlar, profiller, ileri tetikler, çakışmalar ve duraklatma kapsamı kayıtlıdır.
- **Günlük kullanım:** Halka düzenleme, bağlama göre eylemler, arama, çalışma alanları, akışlar, sistem kontrolleri, kişiselleştirme ve yedekleme kayıtlıdır.
- **İstatistik:** Günlük/haftalık raporlar, eylem ve eşleme sayaçları, başarı oranı, yoğunluk haritası, tahmini tasarruf, yerel saklama, silme ve dışa aktarma kayıtlıdır.
- **Geliştirme takibi:** FD-01–FD-16 işlerindeki onay kutuları tamamlanmamış olarak korunur. Kaynak kod değişikliği ve çalışan sürüm testi bu konuşmada yapılmadı.
- **Yeni yeteneklerin sınırı:** Pano geçmişi ayrı kullanıcı tercihiyle açılır; istatistik olaylarına pano içeriği girmez. Seçili metin ve doğal dil özelliklerinde dış sağlayıcıya gönderilecek içerik görünür olur. Pencere yerleşimi, fare tuşları ve uygulama komutları platform desteği doğrulanarak sunulur.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
