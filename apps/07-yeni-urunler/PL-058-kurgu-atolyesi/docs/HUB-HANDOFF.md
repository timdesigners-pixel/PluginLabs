# PL-058 · Hub / dağıtım sahibi için teslim

04.11.2026 · Bu dosya entegrasyon talebidir; Hub kataloğuna uygulanmış değişiklik değildir. PL-055 Gardrop, PL-058 Kurgu Atölyesi, PL-059 MyMind AI kimlikleri korunur.

- Ürün: `pluginlabs-kurgu-atolyesi`, sürüm `0.2.0`, Windows x64.
- Girdi: `dist/Kurgu-Atolyesi-0.2.0-x64-setup.exe`, `dist/Kurgu-Atolyesi-0.2.0-x64-portable.exe`, `SHA256SUMS.txt`, `BUILD-INFO.json` ve gerçek ekranlar.
- `pluginlabs-dagitim` için paket/hash doğrulama, `src/catalog.cjs` için kurulum ve çalıştırma girdisi mevcut Hub sözleşmesiyle eklenmeli. Dosya hash'leri build çıktısındaki SHA256SUMS'tan alınmalı; burada uydurulmaz.
- Kurulum ön koşulu: FFmpeg/FFprobe (bu cihazda 9.0.2 ile test edildi). Paket FFmpeg dağıtmaz. Son kullanıcı dağıtımı için codec lisansı ve doğrulanmış FFmpeg paketi ayrıca kararlaştırılmalı.
- Hub MyMind: token yalnız backend ortamında `KURGU_HUB_TOKEN`; endpoint `KURGU_HUB_URL` (yalnız `http://127.0.0.1:port` veya `http://[::1]:port`). Varsayılan `http://127.0.0.1:8765/v1/chat/completions`, model `mymind-lite`. İzin/scopes Hub sahibi tarafından atanmalı; medyalar gönderilmez, yalnız kullanıcı metni açık onayla gider.
- Yeni ürün release'i yayınlandığında MUST HAVE #8 gereği Hub sürümü de ayrı sahibi tarafından yükseltilmeli. Bu çalışma Hub ortak kodunu düzenlemez ve otomatik release/merge yapmaz.
- Notion: https://app.notion.com/p/40d8aa13d8f980569c47ddaf88ddaaa4
