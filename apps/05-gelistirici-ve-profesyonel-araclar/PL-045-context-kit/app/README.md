# Context Kit (PL-045) — Windows uygulaması

Yapay zekâya **yalnız gereken bağlamı** verin: Context Kit bir proje klasöründen ya da sayfalardan, **göreve göre seçilmiş parçalar ve dosya ağacıyla**, **token bütçesine sığan** bir bağlam paketi hazırlar. **Sırlar ve kişisel veriler** `⟦GİZLİ:tür⟧` ile gizlenir, kaynaktaki **talimat benzeri metinler** veri olarak işaretlenir, her hariç tutmanın **nedeni** görünür ve dışa aktarılan paket **yeniden denetlenir**. İsteğe bağlı **MyMind** (PluginLabs Hub) ya da **yerel model** yalnız yollar ve parça başlıklarıyla sıralama ve kısa özet önerir — tüm depo gönderilmez.

> Ürün deposu henüz yok; kaynak bu klasördedir (PluginLabs ürün ön geliştirme alanı, PL-025 modeli). Windows paketleri `pluginlabs-dagitim` deposunda `context-kit-v<sürüm>` etiketiyle yayımlanır.

![Paket önizleme: puana göre dosyalar, hariç tutma nedenleri, bütçe ve paket metni](docs/screenshots/masaustu-01-paket-onizleme.png)

| Diskteki klasör: hariç tutma ve istisna kuralı | MyMind önerisi (yalnız yollar/başlıklar; olmayan yol atıldı) |
| --- | --- |
| ![Klasör](docs/screenshots/masaustu-02-klasor-ve-haric-tutma.png) | ![MyMind](docs/screenshots/masaustu-03-mymind-onerisi.png) |
| **Dışa aktarmalar (yeniden denetim)** | **Ölçüler ve ayarlar** |
| ![Dışa aktarmalar](docs/screenshots/masaustu-04-disa-aktarmalar.png) | ![Ölçüler](docs/screenshots/masaustu-05-olculer-ayarlar.png) |

Ekran görüntüleri gerçek uygulamadan, duman testinin test verisiyle (uydurma örnek proje ve geçici klasör; taklit MyMind yanıtı; tarih 8 Kasım 2026'ya sabitlenmiş) Linux/xvfb'de alınmıştır. Windows runner'ında alınan gerçek pencere görüntüleri (`windows-masaustu-*`, [çalıştırma 42450828104](https://github.com/timdesigners-pixel/pluginlabs-dagitim/actions/runs/42450828104), kaynak 74d097d) release ekinde ve aşağıdadır.

**Windows'ta (Windows runner, gerçek pencere):**

![Windows — paket önizleme](docs/screenshots/windows-masaustu-01-paket-onizleme.png)

| Windows — klasör ve hariç tutma | Windows — MyMind önerisi | Windows — dışa aktarmalar |
| --- | --- | --- |
| ![Windows klasör](docs/screenshots/windows-masaustu-02-klasor-ve-haric-tutma.png) | ![Windows MyMind](docs/screenshots/windows-masaustu-03-mymind-onerisi.png) | ![Windows dışa aktarmalar](docs/screenshots/windows-masaustu-04-disa-aktarmalar.png) |

## İndir
[context-kit-v0.1.0](https://github.com/timdesigners-pixel/pluginlabs-dagitim/releases/tag/context-kit-v0.1.0) — `ContextKit-0.1.0-Windows-x64.exe` (kurulum, SHA-256 `1b71ff41…3b5d`), `ContextKit-0.1.0-Windows-Portable-x64.exe` (taşınabilir, SHA-256 `4c27c9ac…355b`, 81 527 197 bayt), SHA256SUMS + BUILD-INFO. İmzasız önizleme. PluginLabs Hub kataloğundan da kurulabilir (Hub kataloğu birleşip yayımlanınca).

## Kullanım
1. **Yeni paket** → **görevi** yazın (ör. "Kargo bulunamadığında 500 yerine 404 dönsün").
2. **Klasör ekle** (salt okunur) ve/veya **Sayfa yapıştır…**, **Panodan**, **Belge**. İlk deneme için **Örnek proje** (iki elle etiketli görev).
3. **Önizleme:** dosyalar puana göre sıralı; ★ pakette parça olanlar; hariç dosyaların nedeni; sır ve talimat rozetleri. Bir dosyaya tıklayınca parçaları, puanları ve **Sabitle / Dışla** düğmeleri. Bütçeyi seçin.
4. **Markdown kaydet / JSON kaydet / Panoya kopyala.** Sonuç kutusunda yeniden denetim: token / bütçe, kalan sır (hedef 0).

## Kurallar
- Hariç tutma: varsayılanlar + **Ölçüler ve ayarlar** → ek kurallar (`.gitignore` biçimi; `!` istisna; `/` köke bağlı). Sır dosyaları istisnayla bile girmez.
- Parçalama: en çok 60 satır; işlev/sınıf/test/başlık sınırında ya da boş satırda.
- Puan: görev terimlerinin içerikte geçme sıklığı × seyreklik, yol eşleşmesi ×3, parça başlığı ×1,5; MyMind sıralaması (açıksa) ek ağırlık.
- Seçim: sabitlenenler önce, sonra puanlı parçalar; dosya ağacı ve başlık için yer ayrılır; paket bütçeyi aşmaz.

## Güvenlik ve gizlilik
- Ağ erişimi yalnız `desktop/net.js` içinde ve yalnız Hub (127.0.0.1:47632) ya da loopback yerel model. Dış ağ isteği yoktur.
- Arayüz CSP ile ağa kapalı (`connect-src 'none'`); metin yalnız `textContent`/`value` ile yazılır; `contextIsolation` + `sandbox`; IPC yalnız uygulamanın penceresinden; izin istekleri reddedilir.
- Klasörler yalnız okunur; hiçbir dosya yazılmaz/silinmez (duman testinde SHA-256 ile denetlenir).
- Modele görev, yollar ve parça başlıkları (sırlar gizli) gider; içerik ve klasör yolu gitmez; yanıt denetlenir.

## Geliştirme
```bash
npm ci
npm test                                   # çekirdek birim testleri (node:test)
PLAYWRIGHT_MODULE=playwright xvfb-run -a -s "-screen 0 1440x900x24" node tests/desktop-smoke.cjs docs/screenshots
npm run build:win                          # Windows: kurulum + taşınabilir
node scripts/make-icons.cjs                # simgeleri yeniden üret
```
Windows derlemesi `ci/pluginlabs-dagitim-context-kit-windows.yml` iş akışıyla `pluginlabs-dagitim` deposunda, sabit bir PluginLabs commit'inden yapılır.
