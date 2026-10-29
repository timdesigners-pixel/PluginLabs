# PluginLabs kurulum kontrol listesi

Bu liste kullanıcının altı maddesini, kanıt ve dış bağımlılıklarla takip eder. Bir politika belgesi veya başarılı taslak kaydı dış hizmetin hazır olduğu anlamına gelmez.

| Madde | Yapılan / kanıt | Kalan |
| --- | --- | --- |
| 1. GitHub depoları ve izinler | Seçili `timdesigners-pixel/PluginLabs` checkout'u, origin ve uzak branch'ler Git HTTPS ile doğrulandı. PR #1 zaten birleştirilmiş; devam PR #4 ve `chore/codex-development-standards` dalı bulundu. | PR #4 ve önceki Windows/Linux CI SUCCESS durumu API ile okundu. Branch koruma ayarları mevcut entegrasyona 403 döndürüyor; yönetici doğrulaması gerekir. |
| 2. Codex Cloud | Node 24, kilitli bağımlılıklar, API, 13 API/entegrasyon + 3 audit araç testi, iki Electron UI akışı; kurulum ve başlangıç alanları kayıtlı. Yazılabilir önbellek/proxy adımları `scripts/cloud-env.sh` içinde. | Yayın onayı ve yeni görevden snapshot geri yüklemesi ürün arayüzünde doğrulanmalı. |
| 3. Tasarım standartları | Koyu tema, renkler, Türkçe Inter, tipografi, form/odak/modal, hareket ve ürünler arası kurallar `DESIGN-SYSTEM.md` içinde. Gerçek Windows ve Linux UI ekranları mevcut. | Windows DPI ve gerçek cihaz/erişilebilirlik kabulü #2'de açık; belge tek başına tüm arayüzün uygunluğu değildir. |
| 4. Geliştirme kuralları | AGENTS, CONTRIBUTING, SECURITY, issue/PR şablonları; inceleme, branch, test, sır ve güvenlik politikaları mevcut. | Güncel koruma ayarları ve bağımsız insan onayı API/inceleyici gerektirir. |
| 5. CI/CD | Windows NSIS/portable ve Linux AppImage; unit/API, iki UI testi, üretim güvenlik kapısı, tam audit raporu, SHA-256, commit/platform provenance ve ekran görüntüleri. Her paketleme `--publish never`. | Yeni commit için uzaktaki CI sonucu beklenir. Web/Android uygulaması yok; aşağıdaki platform koşulları geçerli. Güvenlik bulguları release engeli. |
| 6. Notion → Issue → Codex → PR → Test → Sürüm | Kaynak Notion → issue #2 → devam PR #4 bağlantıları ve görev kabul akışı TRACKING.md içinde. GitHub PR sayfası bu bağlantıları içeriyor. | Canlı Notion tarafını mevcut oturumda okuyacak bağlantı yok; iki yönlü bağ ve görev durumu yeniden doğrulanmalı. Merge/release yapılmaz. |

## Platform matrisi

| Hedef | Uygulanabilir hat | Kabul |
| --- | --- | --- |
| Windows x64 Electron | Windows CI: test, UI, NSIS + portable, hash/provenance | İmza, gerçek kurulum/kaldırma/geri alma ayrıca gerekir. |
| Linux x64 Electron | Ubuntu CI: test, Xvfb UI, AppImage, hash/provenance | AppImage üretmek gerçek masaüstü kurulum kabulü değildir. |
| Web | Ayrı web uygulaması, manifest veya dağıtım hedefi yok | Önce ürün kapsamı, kimlik/izin modeli ve web build komutu tanımlanmalı. Electron renderer'ı web ürünü olarak yayımlanmaz. |
| Android | Android projesi/Gradle manifest'i yok | AGENTS gereği ayrı mimari, izin ve SDK kararları gerekir; sahte başarılı Android job eklenmez. |

## Görev akışı ve tamamlanma ölçütü

1. Notion gereksiniminde özgün kapsam ve durum korunur; uygulanabilir kabul ölçütü GitHub issue'ya taşınır, iki tarafa bağlantı konur.
2. Codex mevcut görev ortamında feature branch'te çalışır; issue, Notion ve PR aynı işi işaret eder. PR #1 yeniden açılmaz: birleştirilmiş geçmiş korunur, devam #4 kullanılır.
3. PR testleri ve hedef platform derlemesi çalışır. UI için gerçek ekran; paketler için hash ve BUILD-INFO birlikte saklanır. GitHub artifact bir release değildir.
4. Başarısız/çalışmayan kontroller açık kalır. Güvenlik release engelleri #3'te takip edilir. Kabul kanıtı olmadan Notion görevi veya issue kapanmaz.
5. İnsan incelemesi ve açık merge onayı ayrı aşamadır. Release, imza ve gerçek cihaz kabulünden sonra ayrıca onaylanır. Bu çalışmada main'e merge ve release yayını yasaktır.
