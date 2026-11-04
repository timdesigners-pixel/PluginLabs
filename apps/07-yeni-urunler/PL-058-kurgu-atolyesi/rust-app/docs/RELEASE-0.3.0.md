# Kurgu Atölyesi 0.3.0 — yayın doğrulaması

Kullanıcı, OMNI / PluginLabs Advanced arayüz adayını inceledikten sonra yayını onayladı. Kapsam bir **Rust/Tauri arayüz önizlemesidir**; yeni ileri AI/GPU/kodek/ölçüm kontrolleri örnek/plan olarak kalır.

Kaynak [PR #79](https://github.com/timdesigners-pixel/PluginLabs/pull/79), takip [issue #78](https://github.com/timdesigners-pixel/PluginLabs/issues/78), [Notion ürün görevi](https://app.notion.com/p/40d8aa13d8f980569c47ddaf88ddaaa4).

## Yayın öncesi düzeltmeler

[Bağımsız inceleme](https://github.com/timdesigners-pixel/PluginLabs/pull/79#pullrequestreview-5777504666), `44b9ff0` adayında iki oturum kurtarma hatası saptadı. Tamamlanan iş metadata'sının kalıcılığı ve eksik medyanın açılışı engellemesi için hedefli düzeltme hazırlandı. Eksik kaynaklar, proje verisini silmeden görünür kurtarma durumu olarak sunulur. Yarım kalan işler yeniden açılışta otomatik çalıştırılmaz; eksik çıktı tamamlanmış gibi gösterilmez. Yeni snapshot kurtarma mesajı iki arayüzde de görünürdür.

İlk paket adayı public yapılmadı; düzeltmeden sonra release exe ve NSIS kurulumunun yeniden derlenmesi ve hash/evidence yenilenmesi gerekir. Son durum `PREVIEW-EVIDENCE.json` ve dağıtımın `BUILD-INFO.json` dosyalarında kaydedilir.

## Devir

Rust motor/paketleme ve UI/yayın sohbetleri aynı worktree ve sözleşmeyle çalışır. Son kaynak diff'i bağımsız incelemeye teslim edilir. Hub sahibi yalnız yayımlanan portable URL/size/SHA kaydını kullanır; debug veya önceki taslak hash'i kullanılamaz. Geri alma, katalog girdisini önceki duruma döndürmek ve ilgili kaynak commit'lerini revert etmekle yapılır; kullanıcı verisi/arşivleri silinmez.
