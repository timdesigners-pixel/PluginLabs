# PluginLabs · Her proje için şartname (MUST HAVE)

> Kaynak: "Her proje için Şartname" (Notion, 4098aa13d8f980a5af08edd634e7d8a5) · Eklenme: 30.10.2026
> Bu kurallar **her PluginLabs projesinin olmazsa olmaz şartlarıdır**. Bir iş bu maddelerden biri karşılanmadan "tamamlandı" sayılmaz. Kanonik kopya: [PluginLabs/docs/MUST-HAVE.md](https://github.com/timdesigners-pixel/PluginLabs/blob/main/docs/MUST-HAVE.md).

## Notion metni (özgün)
- Uygulama güncel ekran resimleri github readme dosyasında gösterilecek.
- Her düzenleme sonrası ön izleme ve kurulum yapabilmek için realease yayınlanacak
- Yayınlandığı sırada dallar birleştirilip teke düşürülecek
- Logo ve uygulama adı yandakine benzer olacak
- Claude tarafından hazırlanan PluginLabs Tasarım Sistemi referans alınarak mevcut PluginLabs Hub uygulaması eksenindeki tasarım çizgisi korunacak.
- Uygulamalar MyMind AI ile uyumlu ve entegre çalışacak şekilde hazırlanacak.
- Her uygulama ve eklenti PluginLabs Hub üzerinden kurulabilecek.
- Her release sonrası veya tamamlanan( yayınlanan) uygulama sonrası Hub uygulamasıda yeni versiyonuna yayınlanacak ( şimdilik )

## Uygulama kontrol listesi
| # | Şart | Nasıl karşılanır / kanıt |
|---|---|---|
| MH-1 | README'de **güncel** ekran görüntüleri | Gerçek uygulamadan, son sürümün commit'inde alınmış görüntüler README'de; eski görüntüler `docs/screenshots/onceki/` altına arşivlenir. |
| MH-2 | Her düzenlemeden sonra **release** | Main'e giren her değişiklik sürüm numarasını artırır ve Windows kurulum + taşınabilir exe (eklentiyse zip) ile GitHub release'i yayınlanır; SHA256SUMS ve BUILD-INFO eklenir. |
| MH-3 | Yayında **tek dal** | Release anında açık iş dalları main'e birleştirilir ve silinir; depoda yalnız `main` kalır (birleştirilmiş commit geçmişte korunur). |
| MH-4 | **Logo ve uygulama adı** örnekteki gibi | Kenar çubuğu üstünde PluginLabs logosu (`pl` işareti + "PluginLabs" + `APPS` etiketi); altında ürün kartı: aksan renkli kare ürün simgesi, ürün adı, kısa alt başlık, sıra numarası (ör. "Scrapper · Kişisel ürün arşivin · 01"). Görsel referans: [must-have-logo.png](must-have-logo.png). |
| MH-5 | **PluginLabs Tasarım Sistemi** + Hub tasarım çizgisi | `pl-tokens.css` kanonik kopya (elle düzenlenmez), koyu varsayılan tema, ürün aksanı `data-pl-product`; Hub'ın tipografi, menü aralıkları, düzen ve ölçülü gradyanları. |
| MH-6 | **MyMind** ile uyumlu ve entegre | Hub üzerinden (`127.0.0.1:47632`, `mymind-lite`, `mymind.chat` izinli istemci anahtarı, işletim sistemi kasasında). Her gönderimde görünür onay, veri azaltma; model çıktısı doğrulanır, uygulama verisini doğrudan değiştirmez. |
| MH-7 | **Hub'dan kurulabilir** | Windows taşınabilir exe herkese açık [pluginlabs-dagitim](https://github.com/timdesigners-pixel/pluginlabs-dagitim) deposunda `<katalog-id>-v<sürüm>` etiketiyle; PluginLabs `src/catalog.cjs` kaydı (boyut + SHA-256) güncel. |
| MH-8 | Her release sonrası **Hub de yeni sürüm** | Uygulama sürümü kataloğa girince PluginLabs Hub sürümü artırılır ve Hub release'i yayınlanır (şimdilik). |
