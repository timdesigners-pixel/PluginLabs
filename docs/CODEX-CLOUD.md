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
## Doğrulanmış erişim ve sınırlar

Bu çalışma yerel Windows Codex oturumunda yapılır. GitHub CLI ile depo okuma/yazma erişimi ve mevcut PR branch'i doğrulanmıştır. GitHub Connector üzerinden `timdesigners-pixel` kurulumu (ID 174116132) ve bu kurulumun PluginLabs depo erişimi ayrıca doğrulanmıştır. Kurulumun mevcut seçimi tüm depolardır; erişim kapsamı bu çalışmada genişletilmemiştir. Bu durum Codex Cloud ortamının yayımlandığını kanıtlamaz. GitHub OAuth token'ıyla `/user/installations` çağrısı 403 döndürmüş; erişim daha sonra Connector API'siyle doğrulanmıştır.

## Hesap sahibinin tamamlayacağı adım

1. ChatGPT/Codex'te doğru hesap ve workspace ile **Work in → Cloud → Select environment → Create environment** açın (veya **Settings → Codex Cloud → Environments**).
2. GitHub bağlantısı istenirse bağlayın ve yalnız `timdesigners-pixel/PluginLabs` erişimini seçin; gerekiyorsa GitHub kurulumunda depo iznini verin.
3. Node 24 LTS ve `npm ci` hazırlığını isteyin. Linux ortamında Electron UI testi için Xvfb ve gerekli GTK/NSS kütüphaneleri gerekir; `.github/workflows/ci.yml` referanstır. Doğrulama: `npm test`, `xvfb-run -a npm run test:ui`, `npm run build:linux`. Windows paketleme Windows CI'da yapılır.
4. Hazırlık raporunu ve test sonuçlarını inceleyin, kaydedin, **Publish** seçin; **Environment published** görülmeden hazır saymayın. Bu ortam yayını uygulama release'i değildir.
5. Ortamı seçip bu depoda bir salt okunur doğrulama işi başlatın; branch, test sonucu ve PR erişimini doğrulayın. İşe merge veya release yetkisi vermeyin.

Kullanıcı OAuth/hesap seçim ekranı ve Cloud ortamının yayımlanması bu yerel oturumdan API ile yapılandırılamadı; bekleyen adım budur. GitHub bağlantısı, ortam seçimi ve yayımlama birbirinden ayrı doğrulanmalıdır. Ortama kişisel dosyalar, hukuk belgeleri veya API anahtarları kopyalanmaz. Bir bağımlılık indirme sorunu varsa yalnız gereken paket kayıt alanlarına ağ erişimi verilir.

Resmî kaynak: [OpenAI — Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments) (27.10.2026 tarihinde incelendi).
