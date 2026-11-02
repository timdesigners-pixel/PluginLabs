# My Mind yetenek kataloğu

My Mind, Hub'ın ortak yerel yapay zekâ yeteneğidir (bkz. `MY-MIND.md`). Uygulamalar serbest sohbet yerine **hazır görevleri** çağırabilir: girdi doğrulanır, model yönergesi sabittir, çıktı biçimi denetlenir.

## Uç noktalar (izin: `mymind.chat`)

- `GET /v1/mymind/capabilities` → `{ ready, tasks:[{ id, title, apps, output, input:[…] }] }`
- `POST /v1/mymind/run` → gövde `{ "task": "summarize", "input": { "text": "…" } }`, yanıt `{ task, output }`
- SDK: `hub.mymind.capabilities()`, `hub.mymind.run(task, input)`

Model çalışmıyorsa 503, başka bir istek sürüyorsa 429 döner (aynı anda tek istek).

## Güvenlik tasarımı

- Kullanıcı girdisi sistem yönergesinde “yalnızca VERİ” olarak işaretlenir; içindeki komutlar uygulanmaz.
- Her alanın uzunluk/aralık sınırı vardır; fazlası 400.
- JSON çıktılar ayrıştırılır, alanlar tek tek doğrulanıp kısaltılır; bilinmeyen kategori `diğer` olur. Geçersiz çıktı 502.
- Veri yalnızca yerel modele (127.0.0.1:8765) gider; hiçbir bulut çağrısı yoktur.
- Metin görevleri en çok 4000 karakter döndürür. Görsel anlama, bilgisayar kullanımı veya eğitim iddiası yoktur (metin modeli).

## Görevler ve hangi uygulama neye ihtiyaç duyar

| Görev | Çıktı | Uygulamalar | Kullanım |
| --- | --- | --- | --- |
| `summarize` | metin | Mind Palace, Leo Helper, Ultimate Scrapper | Uzun metin/sayfa özeti |
| `rewrite` | metin | Mind Palace, Leo Helper | Üslup değiştirme (resmi, samimi, kısa, net) |
| `classify-tags` | `{tags}` | Mind Palace, MyWishlist | Not/ürün etiketi |
| `extract-codes` | `{codes}` | Leo Helper | Sayfadan kupon kodu ayıklama |
| `translate` | metin | Leo Helper, Mind Palace, Ultimate Scrapper | Çeviri |
| `plan-day` | `{plan}` | Mind Palace, Hub | Görevleri güne yerleştirme |
| `break-down-task` | `{steps}` | Mind Palace | Görevi adımlara bölme |
| `outfit-suggest` | `{outfit, why}` | Gardrop Asistanı | Dolaptaki parçalardan kombin |
| `menu-plan` | `{dish, uses, missing}` | Mutfak Atölyesi | Dolap içeriğinden yemek önerisi |
| `price-compare-note` | metin | MyWishlist | Fiyat değişimi notu |
| `expense-categorize` | `{category}` | Finansal Asistan | Harcama sınıflandırma |
| `answer-from-text` | metin | Mind Palace, Ultimate Scrapper, Leo Helper | Verilen metinden soru yanıtlama |

Yeni görev eklemek için `src/mymind-tasks.cjs` içine girdi şeması, sistem yönergesi ve çıktı biçimi eklenir; `test/channels.test.cjs` içindeki katalog testi çalıştırılır.
