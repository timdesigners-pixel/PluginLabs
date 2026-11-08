# Context Kit (PL-045) — Windows uygulaması

AI’a yanlış veya gereksiz dosyaları bağlam olarak verip zaman ve kota kaybetmeyin: **Context Kit**, seçtiğiniz **dosya ve sayfalardan** **boyut ve token sınırı olan, önizlenebilir AI bağlam paketleri** hazırlar; **göreve göre dosya ve parçaları sıralar** (tüm depoyu otomatik göndermez); `node_modules`, `.git`, `.env`, `dist` gibi **hariç tutma kurallarını** uygular; **sır, API anahtarı ve kişisel verileri (e-posta, telefon)** otomatik maskeler ve **kaynak içi istem enjeksiyonu (prompt injection)** kalıplarını işaretleyerek **güvenilmeyen veri (`UNTRUSTED_DATA`)** sınırlarıyla **Markdown (`.md`)**, **XML (`.xml`)** ve **JSON (`.json`)** bağlam paketi olarak dışa aktarır. İsteğe bağlı **MyMind** (PluginLabs Hub) ya da **yerel model** ile kısa bağlam özeti ve öncelikli dosya önerisi alınabilir.

> **İlke (Notion teknik sınırı):** Hariç tutma kuralları, sır/kişisel veri işaretleme ve token tahmini uygulanır. Kaynak içi istem enjeksiyonları talimat sayılmaz; tüm depoyu otomatik göndermez.

![Göreve göre sıralanan bağlam kaynakları ve bütçe](docs/screenshots/masaustu-01-baglam-kaynaklari.png)

| Sır maskeleme ve istem enjeksiyonu filtresi | MyMind kısa bağlam özeti ve öncelikli dosyalar |
| --- | --- |
| ![Sır ve enjeksiyon filtresi](docs/screenshots/masaustu-02-sir-ve-enjeksiyon-filtresi.png) | ![MyMind bağlam özeti](docs/screenshots/masaustu-03-mymind-baglam-ozeti.png) |
| **Boyut sınırlı bağlam paketi önizleme (Ağaç / MD / XML)** | **Ölçüler ve ayarlar (≥%90 kapsama, ≥%40 küçülme)** |
| ![Bağlam paketi önizleme](docs/screenshots/masaustu-04-baglam-paketi-onizleme.png) | ![Ölçüler](docs/screenshots/masaustu-05-olculer-ayarlar.png) |

## Kullanım
1. **Dosya / sayfa ekle**, **Panodan ekle** ya da **Dosya seç** ile kaynaklarınızı yükleyin. İlk deneme için **Örnek görev ve 8 kaynak** düğmesini kullanabilirsiniz.
2. Üstteki **AI görevi** kutusuna görevinizi yazıp **Sırala ve bütçele** düğmesine basın; görevle alakasız büyük dosyalar ve hariç tutulan yollar (`node_modules`, `.env`, `dist`) otomatik elenir.
3. **Sır / Enjeksiyon** filtresinde maskelenen API anahtarlarını, kişisel verileri ve kaynak içi istem enjeksiyonu uyarılarını denetleyin.
4. **MyMind bağlam özeti** ile kısa bağlam özeti ve öncelikli dosya önerisi alın, onayınızla pakete sabitleyin.
5. **Bağlam paketi önizleme** sekmesinde dosya ağacını inceleyip **Paketi dışa aktar (`.md`)**, **XML paket (`.xml`)** veya **JSON paket (`.json`)** olarak kaydedin.

## Geliştirme
```bash
npm test                                   # çekirdek birim testleri (10 test)
node tests/desktop-smoke.cjs docs/screenshots
npm run build:win                          # Windows kurulum + taşınabilir exe
node scripts/make-icons.cjs                # simgeleri yeniden üret
```
