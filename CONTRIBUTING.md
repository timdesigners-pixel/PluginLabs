# Geliştirme ve inceleme

Node 24 LTS ve npm kullanın. `npm ci`, `npm test`, ardından hedef sistemde `npm run test:ui` ve `npm run build:win` veya `npm run build:linux` çalıştırın. Linux UI testi Xvfb gerektirir. Kilit dosyasını commit edin. Bağımlılık değişimini güvenlik/lisans raporu ve değişiklik notlarıyla inceleyin; otomatik major yükseltme yapmayın.

`feat/`, `fix/`, `chore/` veya `docs/` branch kullanın. Bir GitHub issue içinde kapsam, Notion kaynak bağlantısı ve kabul ölçütleri olsun. PR aynı issue'yu ve Notion görevini bağlasın. Başlık sonucu anlatsın; açıklama davranış değişimi, test kanıtı, sınırlamalar, gerçek ekran görüntüleri ve geri alma adımını içersin. Katalogdaki fikirler tamamlanmış ürün veya port olarak sunulmaz.

Main'e doğrudan push, force-push ve branch silme yapılmaz. Merge için insan incelemesi ve açık kullanıcı onayı; release yayını için ayrıca açık onay gerekir. `CI / verify (ubuntu-latest)` ve `CI / verify (windows-latest)` kontrolleri zorunlu kabul edilir. Depo yöneticisi branch korumasını bu kontrol adlarıyla etkinleştirmelidir; politika dosyası korumanın etkin olduğu anlamına gelmez. Tek kişilik depoda bağımsız inceleyici yoksa bu durum bildirilir, inceleme olmuş gibi gösterilmez.

CI güvenilmeyen PR kodunu yazma tokenıyla çalıştırmaz; `pull_request_target` kullanılmaz. Paketleme `--publish never` kullanır; imzasız CI paketleri önizlemedir. PR testleri model/kurulum paketlerini internetten indirmez ve kullanıcı verisine erişmez. Başarılı AppImage derlemesi Linux gerçek cihaz kabulünü, başarılı EXE derlemesi kod imzasını kanıtlamaz.

Release öncesi bağımlılık yüksek/kritik açıkları giderilmeli veya kapsamlı risk kararı alınmalı; gerçek işletim sistemi kurulum/kaldırma/geri alma ve imza kontrolleri tamamlanmalı. Mevcut `publish-independent.yml` sadece önceden derlenmiş v0.2.1 varlıkları için eski yayın yoludur; bu çalışmanın CI'sı onu tetiklemez.

Geri alma: ilgili PR commit'ini ayrı branch'te revert edip aynı kontrolleri çalıştırın; kullanıcı verisini veya eski sürüm yedeğini silmeyin.
