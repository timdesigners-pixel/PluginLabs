# Hub 0.4.26 — Leo Helper 0.9.5

İş: https://github.com/timdesigners-pixel/PluginLabs/issues/95
Leo değişikliği: https://github.com/timdesigners-pixel/leo-helper/pull/15
Ürün: https://github.com/timdesigners-pixel/leo-helper/releases/tag/v0.9.5
Notion koordinasyon: https://www.notion.so/4118aa13d8f9819c81efd9502142e9d0

Build kaynağı: `7f8fc6abda6607e3019f335bf2f62cb8d141f480`. Sonraki commitler yalnız kanıt, ekran ve dokümantasyondur. ASAR kataloğu kaynağa birebir eşleşti; üretim bağımlılıkları eşleşti. 33/33 test, iki gerçek Electron UI testi ve üretim audit geçti. İki public ürün kurulumunun boyut/SHA kanıtı yan JSON dosyadadır.

Ekranlar gerçek paketli Windows EXE'den, `--user-data-dir` ile ayrı profilde alındı. Gerçek `app.getPath('userData')` beklenen yola eşit, `app.isPackaged=true`, sürüm 0.4.26. İlk yanlış profil ekranları çıktılarda ve bu committe kullanılmaz. Üretim env koruması değiştirilmedi.

MyMind eğitimi 125/1610; Kaggle telefon doğrulaması/GPU ve özel yükleme bekliyor. Tam eğitim, karşılaştırmalı değerlendirme, GGUF ve eğitimli model kabulü açık. Leo eski OCR/oyun/etkinlik/panel kapsamı ve canlı üçüncü taraf hesap kabulü açık. Özgün Notion metinleri ve diğer ürünlerin kirli çalışma alanları korundu.
