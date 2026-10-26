# PluginLabs Hub 0.1.0

PluginLabs uygulama, eklenti ve kaynak merkezi. Electron masaüstü arayüzü; yönetilen kurulumlar; yerel My Mind sunucusu; uygulama bazlı izinli cihaz API’si.

## Başlatma

Node 20.18+ ve npm gerekir:

```sh
npm ci
npm start
```

`npm test` API, kurulum, doğrulama, iptal, geri alma, sağlayıcı onayları, kaynak paketleri ve arşiv sınırlarını test eder. `npm run build:win` Windows NSIS + taşınabilir EXE, `npm run build:linux` AppImage üretir. Windows derlemesi için Windows veya uygun Wine kurulumu gerekir. Üretilen önizleme paketleri kod imzalı değildir.

## İşlevler

- Katalog: Mind Palace ve Leo Helper’ın gerçek Windows sürümleri. Uygulamalar merkezin yönettiği sürüm klasörlerine indirilir; kullanıcı tarafından açılır. Diğer uygulamaların önceden yapılmış kurulumları otomatik taranmaz.
- HTTPS indirme, sabitlenmiş SHA-256 ve dosya boyutu, ilerleme ve iptal. Başarısız güncelleme mevcut sürümü korur; önceki paket saklanmışsa geri alınabilir.
- Güncelleme ekranı GitHub Releases’i denetler. Daha yeni sürüm ancak yayımlanmış dosya özeti varsa yüklenebilir. Hub’ın kendisi için otomatik güncelleme henüz yoktur.
- Graphite asset paketi, toplantı şablonu, yazı kütüphanesi ve metin araçları eklentisi dahildir. Her paketin ayrı ayarı, etkinlik durumu, kaldırma ve JSON dışa aktarma seçeneği vardır.
- `resources/example.plpack` örneğiyle kendi veri/görünüm paketinizi içe aktarın. Paket türleri asset/template/library/plugin; kimlik `custom-` ile başlamalıdır. En fazla 2 MB JSON, semantik sürüm, kısa metin/onay kutusu ayarları. İçerik veri olarak saklanır; script, HTML veya kabuk komutu olarak çalıştırılmaz.
- Gerçek işlev eklentileri sağlayıcı SDK’sıyla uygulama API’sine bağlanır. Bu sürüm, cihazdaki bütün eski ürünlerin bağlandığını iddia etmez: her ürün kendi adaptörünü eklemelidir.
- Veriler cihazda saklanır. Bu sürümde hesap, ücretli mağaza, bulut senkronizasyonu ve çok cihaz yönetimi yoktur.

## My Mind

My Mind Lite, Qwen3 0.6B Q8_0 ağırlıkları + llama.cpp CPU sunucusunu yöneten uygulama katmanıdır; sıfırdan eğitilmiş veya ince ayarlanmış model değildir. Model yaklaşık 640 MB, motor yaklaşık 18–20 MB. Kurulum internet; analiz yerel CPU/RAM gerektirir. Model ve motor ayrı ayrı yüklenir, ardından My Mind ekranından sunucu başlatılır. Kapanırken yalnızca merkezin oluşturduğu süreç durdurulur.

Motor `127.0.0.1:8765` üzerinde rastgele oturum anahtarıyla çalışır. Ortak API varsayılan `127.0.0.1:47632` üzerinden yetkili istemcileri modele yönlendirir. 4096 token bağlam, en fazla 512 token çıktı, tek eşzamanlı istek, 120 saniye sınırı. Bu sürümde streaming, görüntü girdisi, eğitim, fine-tuning ve otomatik araç çalıştırma yoktur. Küçük modelin Türkçe ve karmaşık analiz kalitesi sınırlıdır. LM Studio veya önceki Windows PluginLabs AI paketi bu sürümde yönetilmez.

Kaynaklar:
- Qwen3-0.6B-GGUF, Apache-2.0: https://huggingface.co/Qwen/Qwen3-0.6B-GGUF — sabit revision `23749fefcc72300e3a2ad315e1317431b06b590a`.
- llama.cpp b11669, MIT: https://github.com/ggml-org/llama.cpp/releases/tag/b11669 . Lisans dosyaları motor paketi içinde korunur.

Model son kullanıcı paketine gömülmez; merkezden talep edildiğinde indirilir. Linux x64 motoru ve gerçek metin üretimi geliştirme ortamında doğrulandı. Windows x64 motoru katalogda var; gerçek Windows cihazında model çalıştırma doğrulaması gerekir. macOS motor paketi yoktur.

## Yerel API

Masaüstünde **API ve izinler → İstemci oluştur**. Anahtar bir kez gösterilir; merkez yalnızca SHA-256 özetini saklar. İstemci anahtarını OS kasa/credential manager ile koruyun. Kaybolursa erişimi iptal edip yenisini üretin.

API yalnızca literal 127.0.0.1 üzerinde dinler. HTTP Host denetlenir, Origin içeren tarayıcı istekleri reddedilir. Anahtarı ön yüz JavaScript’ine veya sayfalara koymayın. HTTP API, yönetici anahtarı oluşturamaz veya kendi isteğini onaylayamaz. Tüm yerel kullanıcı programlarına karşı işletim sistemi izolasyonu sağladığı iddia edilmez.

| Yol | Yöntem | İzin / davranış |
| --- | --- | --- |
| `/health` | GET | Asgari servis bilgisi |
| `/v1/catalog`, `/v1/installed` | GET | `catalog.read` |
| `/v1/resources`, `/v1/resources/:id` | GET | `resources.read`, etkin paket verileri |
| `/v1/jobs` | GET | `jobs.read` |
| `/v1/downloads` | POST `{id}` | `downloads.request`, masaüstü onayı |
| `/v1/apps/launch` | POST `{id}` | `apps.launch`, masaüstü onayı |
| `/v1/requests/:id` | GET | İsteği oluşturan istemci |
| `/v1/providers` | GET | `actions.invoke` |
| `/v1/providers/register` | POST | `providers.register`, yerel callback doğrulaması |
| `/v1/actions/invoke` | POST `{provider,action,input}` | `actions.invoke`; yazma işlemi masaüstü onayı |
| `/v1/models`, `/v1/chat/completions` | GET / POST | `mymind.chat`, OpenAI uyumlu, non-stream |

SDK örneği:

```js
const {PluginLabsClient,ProviderAgent}=require('./sdk/client.cjs');
const client=new PluginLabsClient({token:process.env.PLUGINLABS_TOKEN});
const result=await client.chat([{role:'user',content:'Bu metni özetle: ...'}]);
const count=await client.invoke('hub','text-count',{text:'Merhaba dünya'});
```

Metin sayımı için `text-tools` eklentisi yüklü ve etkin olmalıdır. Örnek sağlayıcıyı `PLUGINLABS_TOKEN` ortam değişkeni ile `node sdk/example.cjs` çalıştırarak deneyin; örneğin kaydetme işlemi gerçek dosya yazmaz, ürün adaptörünün bağlanacağı yeri gösterir. SDK aynı makinede Node destekleyen ürünler içindir; diğer diller aynı HTTP sözleşmesini uygulayabilir.

Sağlayıcılar loopback callback + oturum sırrı ile challenge/HMAC doğrular; 90 saniyelik kira, 30 saniye yenileme. Bağlanmış olmak tek başına diğer uygulamanın verilerine erişim sağlamaz. İstemciye `actions.invoke` izni verilmesi tüm kayıtlı okuma işlemlerine erişim verir; yazma işlemleri tek tek onaya gider. İşlem sağlayıcısı uygulaması kendi input doğrulamasını ve yetkilerini de uygular. İstek kuyrukları bellektedir; yeniden başlatmada kaybolur. Onaylar beş dakikada sona erer. Prompt/yanıt içerikleri işlem günlüğüne yazılmaz.

## Proje yapısı

`src/hub.cjs`: paket, kaynak, API ve model yönetimi. `src/electron.cjs`: dar IPC köprüsü. `ui/`: uzak kod çalıştırmayan masaüstü arayüzü. `sdk/`: istemci ve işlev sağlayıcı sözleşmesi. `test/`: gerçek HTTP ve dosya sistemiyle entegrasyon testleri. Kullanıcı veri alanı Electron userData/hub klasörüdür. Geliştirmede `PLUGINLABS_DATA` değişkeniyle ayrı test alanı seçilebilir.
