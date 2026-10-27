# Geliştirme ve inceleme

Node 24 LTS ve npm kullanın. `npm ci`, `npm test`, ardından hedef sistemde `npm run test:ui` ve `npm run build:win` veya `npm run build:linux` çalıştırın. Linux UI testi Xvfb gerektirir. Kilit dosyasını commit edin. Bağımlılık değişimini güvenlik/lisans raporu ve değişiklik notlarıyla inceleyin; otomatik major yükseltme yapmayın.

`feat/`, `fix/`, `chore/` veya `docs/` branch kullanın. Bir GitHub issue içinde kapsam, Notion kaynak bağlantısı ve kabul ölçütleri olsun. PR aynı issue'yu ve Notion görevini bağlasın. Başlık sonucu anlatsın; açıklama davranış değişimi, test kanıtı, sınırlamalar, gerçek ekran görüntüleri ve geri alma adımını içersin. Katalogdaki fikirler tamamlanmış ürün veya port olarak sunulmaz.

Main'e doğrudan push, force-push ve branch silme yapılmaz. Merge için insan incelemesi ve açık kullanıcı onayı; release yayını için ayrıca açık onay gerekir. GitHub'ın kontrol adları `verify (ubuntu-latest)` ve `verify (windows-latest)` olarak ayarlanmıştır. 27.10.2026 tarihinde main koruması API ile etkinleştirildi ve geri okundu: güncel branch üzerinde iki başarılı kontrol, bir onay, eski onayların iptali, konuşmaların çözülmesi, yöneticilere de uygulama; force-push ve silme kapalı. Bu tarihli kayıt sonraki ayar değişikliklerinin kanıtı değildir. Tek kişilik depoda PR yazarı kendi PR'ını onaylayamaz; bağımsız bir inceleyici gerekir, inceleme olmuş gibi gösterilmez.

CI güvenilmeyen PR kodunu yazma tokenıyla çalıştırmaz; `pull_request_target` kullanılmaz. Paketleme `--publish never` kullanır; imzasız CI paketleri önizlemedir. PR testleri model/kurulum paketlerini internetten indirmez ve kullanıcı verisine erişmez. Başarılı AppImage derlemesi Linux gerçek cihaz kabulünü, başarılı EXE derlemesi kod imzasını kanıtlamaz.

Release öncesi bağımlılık yüksek/kritik açıkları giderilmeli veya kapsamlı risk kararı alınmalı; gerçek işletim sistemi kurulum/kaldırma/geri alma ve imza kontrolleri tamamlanmalı. Mevcut `publish-independent.yml` sadece önceden derlenmiş v0.2.1 varlıkları için eski yayın yoludur; bu çalışmanın CI'sı onu tetiklemez.

Geri alma: ilgili PR commit'ini ayrı branch'te revert edip aynı kontrolleri çalıştırın; kullanıcı verisini veya eski sürüm yedeğini silmeyin.
