# PluginLabs çalışma modeli

28 Ekim 2026 · v1 · Ana ürün: PluginLabs Hub; kapsam: yaklaşık 50 ürün/eklenti ve paylaşılan servisler.

## Kalıcı ortak kaynak

Kod ve onaylanmış çalışma kararları Git deposunda tutulur. Sohbetler iş yürütme bağlamıdır; birbirinin bütün mesajlarını otomatik almaz. Aynı kenar çubuğu bölümü veya proje üyeliği ortak dosya sistemi sağlamaz. Bir sohbetin talimatı başka sohbete kendiliğinden gönderilmez.

Öncelik: kullanıcının güncel kapsamı → ilgili AGENTS.md → sürümlü karar/sözleşme → iş kaydı → sohbet özeti. Çelişkiyi gizleme; hangi eski kararın değiştiğini kaydet. Gizli değerleri, ham özel mesajları veya kişisel verileri ortak kayda koyma.

## Sorumluluk dağılımı

| Alan | Sahip olduğu iş | Teslimi |
|---|---|---|
| PluginLabs ana koordinasyon | Sıra, kapsam, tasarım kararları, ürün kabulü | ROADMAP ve WORK-REGISTER |
| Hub geliştirme | Katalog, kurulum, güncelleme, izin, API ve platform kabukları | Tek issue/dal/PR ve platform kanıtı |
| Tasarım sistemi | Mevcut Hub'dan token ve bileşen standardı; ürün adaptörleri | Sürümlü token, görsel karşılaştırma, uyumluluk raporu |
| Ürün sohbeti | Tek ürünün MVP ve adaptörü | Ürün kimliği, depo, sözleşme sürümü ve teslim kaydı |
| GitHub Master | Bağımsız depoların ilişkileri ve uyumluluğu | Üretici/tüketici sözleşmesi ve bağlantılı PR'lar |
| My Mind | Ortak yerel AI, sağlayıcı ve araç yetenekleri | Yetenek matrisi ve cihazda doğrulanmış çalışma |

Master koordinasyon kökünde bulunan AGENTS.md başka Git köklerine otomatik uygulanıyor kabul edilmez. Ortak kural her hedef deponun kendi AGENTS.md dosyasında sürüm ve kaynakla yer almalı. Bu PR yalnız PluginLabs'ı kapsar; diğer 16 depoya otomatik kural yüklemez.

## Günlük geliştirme döngüsü

1. İş kimliği, hedef repo/platform ve kabul koşulunu seç. `WORK-REGISTER.json` içinde sahibi/branch/baseSha kaydet. Henüz bilinmeyen alan null kalır.
2. Güncel remote, branch, HEAD ve dirty durumunu kontrol et. Aynı dosyada başka aktif iş varsa ayrı çalışma alanı ve teslim sırası belirle. Tek iş için gereksiz yeni sohbet açma.
3. En küçük tamamlanabilir parçayı uygula. UI standardı mevcut görünümü belgelemekle başlar; token import veya tasarım değişikliği ayrı kapsamdır.
4. Değişikliğe uygun kontrolleri çalıştır. Windows/Android/Web sonuçlarını ayrı kaydet; birinin başarısı diğerinin kanıtı değildir.
5. `HANDOFF-TEMPLATE.md` ile teslim et. PR'da gerçek ekran, build tesliminde ekran+hash+BUILD-INFO bulunur. Tarihî ekran tarihî diye etiketlenir.
6. Ana kayıt kabul koşullarına göre kapanır. Sonraki bağımlı iş bundan sonra başlar. Kullanıcı kapsam içindeki olağan işleri yeniden onaylamak zorunda değildir; main merge ve release için ayrı onay korunur.

## Tasarımın kemik ilkeleri

Mevcut DESIGN-SYSTEM.md ve design-system/tokens.json kaynak alınır. Koyu tema, Inter Variable ve sistem fallback'leri, okunaklı tipografi, anlamsal renk rolleri, ortak boşluk/odak/form davranışı aileyi birleştirir. Ürün vurgusu farklı olabilir; Flow Dock mavi kimliğini korur. Windows, Android ve Web aynı piksel düzenine zorlanmaz; ortak roller platformun yerel etkileşimine uyarlanır.

Mevcut tokenlar referanstır; runtime'a henüz bağlandığı varsayılmaz. Hub görünümünü koruma işi için önce/sonra kaynak hash'i ve aynı veriyle gerçek ekran karşılaştırması gerekir. Light/System veya Android desteği plandır; uygulanmış özellik etiketi değildir.

## Ürün kartı ve raporlama

Her ürün: productId, ad, amaç, kaynak Notion/sohbet ID, repo, gerçek platformlar, planlanan platformlar, sahibi, MVP, tasarım sürümü, izinler, API/sözleşme sürümü, bağımlı iş, kaynak SHA, paket/hash, test ve ekran kanıtı, engel, sonraki iş. 50 fikir için önceki PL-001–PL-050 kartları korunur; her fikir için başlangıçta ayrı sohbet açılmaz. Aktif geliştirme başladığında kartına tek ürün sohbeti bağlanır.

Durumlar: backlog → ready → in-progress → review → done; blocked ayrı durumdur. `done` yayınlanmış demek değildir. Yayın hazırlığı ayrıca platform kanıtı ve release kabulü ister. Önizleme paketi bulunması tam ürün işlevlerinin uygulandığını kanıtlamaz.

## Yerel, Cloud ve uzak bilgisayar

| Özellik | Yerel Windows | Gerçek Cloud | Bağlı uzak bilgisayar |
|---|---|---|---|
| Dosyalar | Yerel checkout ve yetkili dosyalar | Ortamın depo kopyaları ve kayıtlı durumu | O bilgisayarın checkout/dosyaları |
| Bilgisayarın kapanması | Çalışmayı keser | Yerel PC uykudayken devam edebilir | İşin çalıştığı bilgisayar açık kalmalı |
| Gerçek cihaz | Yerel GPU, Windows, kurulu uygulamalar | Yerel cihaz otomatik erişilebilir değil | Uzak cihazın donanımı/araçları |
| Bilgi paylaşımı | Sohbet + okunan belgeler | Ayrı sohbet + oradaki belgeler | Ayrı sohbet + oradaki belgeler |

Cloud işlemi sonsuza kadar sürecek garantisi değildir: limit, hata, erişim veya ortam durumu işi durdurabilir. Push/commit/PR ve teslim kaydı taşınabilirlik sağlar; yalnız /workspace dosya bağlantısına dayanma. Kaydedilmemiş yerel kod Cloud'a otomatik gitmez.

İş aktarımı: güvenli commit/dal/PR oluştur → sır içermeyen teslimi yaz → diğer ortamda aynı SHA'yı getir → runtime/lockfile/izinleri doğrula → uygun testle sürdür. Çakışmada tek entegrasyon sahibi çözüm yapar; force push/reset ile başkasının değişikliği silinmez. Worktree dosya çakışmasını izole eder; semantik merge çakışmasını yok etmez.

## Teknik yaptırım sınırı

AGENTS.md model yönergesidir. Zorunlu CI kontrolleri ve GitHub branch protection ayrı teknik kapılardır; varlıkları canlıdan okunmadan etkin denmez. İleriki uygulama işi: ürün manifest şeması, tasarım sürümü, kanıt yolları ve sözleşme testlerini CI'a bağlamak. Bu PR bu kapıları çalıştıran yeni CI kodu eklemez.

## Resmî kaynaklar

- [Cloud: bağımsız workspace ve PC uyurken çalışma](https://learn.chatgpt.com/docs/cloud)
- [Worktree ve bağlı bilgisayarda çalışma](https://learn.chatgpt.com/docs/environments/git-worktrees)
- [AGENTS.md kapsamı ve yükleme kuralları](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
