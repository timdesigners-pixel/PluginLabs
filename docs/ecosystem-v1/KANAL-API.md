# Kanal API'si — veri akışı ve uygulamalar arası köprü

Uygulamalar Hub'a **kanal** adı verilen küçük JSON kayıtları yayınlar. Genel bakış widget'ları bu kayıtları canlı gösterir; başka bir uygulama, yayıncı izin verdiyse aynı kanalı okuyabilir veya canlı dinleyebilir. Her şey `127.0.0.1` üzerindedir (dış ağa açılmaz, tarayıcı kaynakları engellenir).

## Kavramlar

| Terim | Anlamı |
| --- | --- |
| Ad alanı | İstemcinin kimliği (`leo-helper`). Anahtar oluştururken belirlenir, boşsa addan üretilir; her istemcide benzersizdir. |
| Kanal | `<ad-alanı>.<konu>` (ör. `leo-helper.codes`). Regex: `^[a-z0-9][a-z0-9-]{1,39}\.[a-z0-9][a-z0-9._-]{0,63}$` |
| Sahiplik | Bir istemci yalnızca **kendi ad alanındaki** kanallara yayın yapar. Başkasının kanalına yazamaz. |
| Paylaşım | Varsayılan: yalnızca Hub arayüzü okur. Yayıncı `share` ile belirli ad alanlarını (`["mind-palace"]`) veya herkesi (`["*"]`) ekleyebilir. |
| Süre | `ttlSeconds` 5–86400 (varsayılan 3600). Süre dolunca kanal silinir ve widget örnek veriye döner. |

## Uç noktalar

| İstek | İzin | Açıklama |
| --- | --- | --- |
| `POST /v1/channels/<kanal>` | `channels.publish` | Gövde: `{ "data": {…}, "ttlSeconds": 3600, "share": [] }`. Yanıt: kayıt (`seq` her yayında artar). |
| `GET /v1/channels` | `channels.read` | Okuyabildiğiniz kanallar. |
| `GET /v1/channels/<kanal>` | `channels.read` | Tek kanal; yoksa veya paylaşılmadıysa 404. |
| `GET /v1/stream?channels=a.x,b.y` | `channels.read` | Server-Sent Events. Başlangıçta mevcut kayıtlar, sonra her güncellemede `event: channel`; kapanınca `event: closed`. 20 sn'de bir `: ping`. En fazla 8 açık akış. |

## Sınırlar

- `data`: en çok 8000 karakter JSON, derinlik 6, nesnede 40 alan, listede 50 öğe, metinde 500 karakter; `__proto__`, `constructor`, `prototype` alan adı yasak.
- Hız: istemci başına dakikada 30 yayın (429). İstemci başına 16, toplam 64 kanal.
- Yalnızca bellekte tutulur; Hub kapanınca silinir. İstemci iptal edilince kanalları da kapanır.
- Arayüzde **API ve izinler → Kanallar ve köprüler** tablosu kanalları, yayıncıyı, paylaşımı gösterir; “Kapat” kanalı siler.

## Widget sözleşmesi

Aşağıdaki kanal adları Genel bakış widget'larına bağlıdır. Yayın varsa widget “Canlı · <yayıncı>” rozeti alır, yoksa “Örnek veri” gösterir. Tüm metinler arayüzde kaçışlanır ve kısaltılır.

| Kanal | `data` | Widget |
| --- | --- | --- |
| `leo-helper.codes` | `{ total, label, chips:[{text}] }` | Yakalanan kodlar |
| `mywishlist.drops` | `{ rows:[{name, price, change}] }` | Fiyat düşüşleri |
| `mind-palace.notes` | `{ rows:[{title, when}] }` | Son notlar |
| `pluginlabs-scrapper.tasks` | `{ tasks:[{name, sub, pct, state}] }` (`state: "done"` tamam) | Kazıma görevleri |
| `finansal-asistan.upcoming` | `{ total, rows:[{name, amount, when}] }` | Yaklaşan ödemeler |
| `<ad-alanı>.feed` | `{ events:[{message, time}] }` | Veri akışı (tüm `.feed` kanalları birleşir) |

## SDK örneği

```js
const { PluginLabsClient } = require("./sdk/client.cjs");
const hub = new PluginLabsClient({ token: process.env.PLH_TOKEN });

// Yayın (izin: channels.publish)
await hub.publish("leo-helper.codes", { total: 1284, label: "Bu hafta", chips: [{ text: "HAFTA20" }] },
  { ttlSeconds: 900, share: ["mind-palace"] });

// Köprü: başka uygulamanın paylaştığı kanalı dinle (izin: channels.read)
const stop = hub.subscribe(["leo-helper.codes"], (rec) => console.log(rec.data.total));
```

## Güvenlik notları

- Anahtar yalnızca `Authorization: Bearer` ile gönderilir; arayüze ve günlüğe yazılmaz.
- Kanal verisi **güvenilmez girdidir**; alan uygulama onu komut gibi değil veri gibi işlemelidir.
- Kanallar onay gerektiren işlemlerin (kurulum, uygulama açma) yerine geçmez; onaylı işlemler mevcut onay akışından geçer.
