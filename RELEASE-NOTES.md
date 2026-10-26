PluginLabs Hub 0.2.0 — mevcut tasarım korunarak eklenti yönetimi ve Notion ürün kataloğu eklendi.

- Chrome, Opera ve Chromium profilleri için Browser Bridge: izin envanteri, etkinleştirme/devre dışı bırakma, kaldırma ve ayar açma istekleri; tarayıcı panelinde kullanıcı onayı.
- VS Code / VSCodium eklentilerini uygulamanın kendi CLI’siyle listeleme, kurma, güncelleme ve kaldırma.
- PluginLabs kaynak ve eklenti paketleri aynı yönetim ekranında.
- Notion’daki PL-001–PL-050 ürünlerinin özgün adları, alanları, tam kapsamları ve kaynak bağlantılarıyla 50 kartlık katalog; her ürün Yükle ile yerel önizleme paketi olarak kurulur, not defteri, takip listesi ve ayrı ayarlarla açılır.
- Chrome/Opera bağlantı eklentisi masaüstü paketine gömülü ve ayrıca ZIP olarak sunulur.

Windows EXE’leri GitHub dışında Docker/Wine64 ile derlenir. GitHub Actions yalnızca hazır paketleri doğrulayıp release’e yükler. İmzasız önizleme sürümüdür; Windows Chrome/Opera cihaz testleri henüz yapılmadı. Tarayıcıya bağlantı eklentisini yükleyip Hub ile eşleştirmek gerekir. 50 ürünün kurulabilir önizlemesi vardır; Notion’daki planlanan tam işlevlerin geliştirme durumu ürün içinde belirtilir. Firefox/Safari desteği yoktur; diğer uygulamalar için yeni adaptör gerekir. My Mind modeli ayrıca indirilir.
