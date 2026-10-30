PluginLabs Hub 0.4.0 — uygulamalar Hub'dan kurulabilir, MUST HAVE şartnamesi.

- Uygulama dosyaları herkese açık dağıtım deposundan (timdesigners-pixel/pluginlabs-dagitim) indirilir; özel depolar yüzünden oluşan 404 hatası giderildi. Kurulumdan önce SHA-256 doğrulaması aynen sürüyor.
- Katalog: Mind Palace 1.11.1, Leo Helper 0.8.0, PluginLabs Scrapper 0.4.0 (yeni), Finansal Asistan 0.1.0 (yeni), Flow Dock 0.1.0.
- Güncelleme denetimi dağıtım deposunu okur; her uygulama yalnız kendi `<id>-v` önekli, ön sürüm olmayan etiketlerini görür.
- Her proje için MUST HAVE şartnamesi (docs/MUST-HAVE.md) AGENTS.md'ye eklendi.
- Windows paketi artık GitHub Windows runner'ında main'den derlenir (hub-windows.yml); SHA256SUMS.txt ve BUILD-INFO.json içerir.

İmzasız önizleme sürümüdür; SmartScreen uyarı verebilir. Electron ve paketleme zincirindeki güvenlik bulguları (issue #3) açıktır.
