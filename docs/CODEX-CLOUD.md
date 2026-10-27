# Codex Cloud ve GitHub kurulumu

## Bu bulut oturumunda doğrulananlar

27.10.2026: `/workspace/PluginLabs` mevcut checkout'u kullanıldı; Node 24.19.0 üzerinde kilitli `npm ci`, 13 unit/API testi ve iki native Electron UI akışı geçti. Önceki kurulumda Linux AppImage üretildi ve API yeniden başlatılarak `/health` yanıtı ile yetkisiz `/v1/catalog` isteğinin 401 dönmesi doğrulandı. Bunlar çalışan makine kanıtıdır; Windows gerçek cihaz veya yeni görevden geri yükleme kanıtı değildir.

Ortam yapılandırmasının yeni sürümünde `install_script` ve `start_skill` okundu; önceki taslak artık beklemiyordu. Bu, ayarların kaydedildiğini gösterir; kullanıcı arayüzündeki yayın onayını veya yeni bir görevin snapshot'tan başarıyla açılmasını tek başına kanıtlamaz. Yeniden ortam oluşturmayın. Ortam yayınlama onayı ürün arayüzünden tamamlanır; bu işlem uygulama release'i değildir.

## Tekrar çalıştırma

Her görev zaten izoledir. Mevcut checkout'u kullanın; kullanıcı istemedikçe worktree oluşturmayın. Kurulum sırasında kaynak, test ve kilit dosyalarını değiştirmeyin.

```bash
cd /workspace/PluginLabs
source scripts/cloud-env.sh
npm ci --no-audit --no-fund
npm test
npm run audit:production
npm run audit:report
```

`cloud-env.sh`, salt okunur ev dizini yerine yazılabilir önbellek/ayar dizinlerini seçer ve Electron indiricisine ortamın mevcut proxy'sini iletir. TLS ve paket bütünlüğü doğrulaması korunur. Gizli değerler bu dosyaya eklenmez.

Linux UI için önce `DISPLAY=:99 xdpyinfo` çalıştırın. Ekran yoksa mevcut snapshot'taki `/workspace/.cloud-setup/xvfb/usr/bin/Xvfb :99 -screen 0 1440x1000x24 -nolisten tcp` komutunu kalıcı oturumda başlatın. Ardından:

```bash
DISPLAY=:99 npm run test:ui
npm run build:linux
node scripts/hash-artifacts.cjs
```

CI Ubuntu'da Xvfb'yi imzalı sistem paketlerinden kurar; bu bulut snapshot'ında çalışma alanına çıkarılmış Debian paketleri kullanılır. GUI testleri geçici uygulama verisi kullanır. Üretim `npm start` sandbox'ı kapatmaz; sandbox desteklemeyen bir cloud host'ta yalnız mevcut test harness'ını kullanın. Masaüstü ve `npm run serve` aynı anda çalıştırılmaz: ikisi de 47632 portunu kullanır. API-only akış: `PLUGINLABS_DATA=/workspace/PluginLabs/.local-data/api npm run serve`; `/health` sürüm 0.2.1, yetkisiz `/v1/catalog` 401 olmalıdır. Loopback binding korunur.

## Ağ, entegrasyon ve kalan dış adımlar

Git HTTPS proxy üzerinden fetch doğrulandı. İlk API çağrıları engellense de sonraki `gh pr view 4` ve `gh issue view 2` okumaları başarılı oldu; eski dalın Windows/Linux CI sonuçları SUCCESS olarak okundu. Main branch koruma API'si `Resource not accessible by integration` (403) döndürdü: mevcut kimlik bu yönetim ayarını okumaya yetmiyor; ağ/token değiştirerek aşılmaya çalışılmaz. `api.github.com` ve `api.notion.com` gerekli hedefler olarak taslağa eklendi; kayıt tek başına politika uygulanma kanıtı değildir.

Notion API bağlaması bu oturumda mevcut değil. Gerekirse ortam ayarlarında `NOTION_TOKEN` güvenli olarak tanımlanır ve entegrasyon yalnız kaynak PluginLabs sayfasına bağlanır; değer sohbet veya GitHub'a konmaz. Önceki bağlantı kayıtları [TRACKING.md](TRACKING.md) içinde; canlı Notion doğrulaması yapılmadan görev tamamlandı olarak işaretlenmez.

Son kontrol: ortam ekranından yayın durumunu doğrulayın ve bu ortamla yeni bir salt okunur görev açarak Node, branch, test, PR erişimi ve servis başlatmayı doğrulayın. Merge veya release yetkisi vermeyin.
