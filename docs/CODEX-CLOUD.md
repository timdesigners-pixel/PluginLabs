# Codex Cloud ve GitHub kurulumu

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
