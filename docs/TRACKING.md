# Notion – GitHub takip eşlemesi

Kaynak: [Notion PluginLabs](https://www.notion.so/4038aa13d8f9803dac8df65f5a9d11b3), “Dashboard’dan Düzenlenen Görevler → Eklenti yöneticisini geliştir”. Özgün görev metni ve tamamlanmamış durumu korunmuştur; görev bağlantıları aynı satıra eklenir.

| İş | Takip | Kabul / durum |
| --- | --- | --- |
| Eklenti yöneticisi | [#2](https://github.com/timdesigners-pixel/PluginLabs/issues/2) | Windows otomasyonu geçti; gerçek tarayıcı ve platform kabulü açık |
| Geliştirme ve tasarım standartları, test/derleme CI | [devam PR #4](https://github.com/timdesigners-pixel/PluginLabs/pull/4), [önceki PR #1](https://github.com/timdesigners-pixel/PluginLabs/pull/1) | #1 oturumdan önce birleştirilmiş; yeni değişiklikler aynı branch'te #4 ile incelemede; merge ayrı onay |
| Electron / paketleme güvenliği | [#3](https://github.com/timdesigners-pixel/PluginLabs/issues/3) | Release engeli; 13 yüksek ve 1 kritik etkilenen bağımlılık |
| Codex Cloud ortamı | [kurulum adımları](CODEX-CLOUD.md) | Bulut kurulumu ve kayıtlı talimatlar doğrulandı; yayın onayı/yeni görev restorasyonu ayrıca doğrulanmalı |

Notion kapsam/ürün kararı kaynağıdır; GitHub issue uygulanabilir kabul ölçütünü, PR değişikliği ve test kanıtını tutar. Yeni işte iki yönlü bağlantı kurulur. Issue kapanışı ancak kabul kanıtıyla Notion durumuna yansıtılır; PR açılması veya CI dosyası yazılması işi tamamlamaz. 50 ürün fikrinin her biri için gereksiz yeni issue açılmaz; bu çalışma aktif eklenti yöneticisi görevini bağlar.

## Bulut devam doğrulaması

Altı maddelik [kurulum kontrol listesi](SETUP-CHECKLIST.md) her maddeyi kanıt ve açık dış bağımlılıkla izler. Mevcut oturum artık Codex Cloud'dur; eski Windows oturumuna ait erişim ve koruma kayıtları tarihsel kanıttır. GitHub'ın PR #4 sayfasında Notion ↔ #2 ↔ #4 bağı gözlendi; Notion tarafı bu oturumda okunamadı. Çift yönlü bağı tamamlandı varsayarak yeni görev/issue üretilmez veya mevcut görev kapatılmaz.

Canlı kontrol için ağ erişiminden sonra `gh pr view 4 --repo timdesigners-pixel/PluginLabs`, `gh issue view 2 --repo timdesigners-pixel/PluginLabs` ve `gh pr checks 4 --repo timdesigners-pixel/PluginLabs` kullanılır. Notion PluginLabs sayfasında aynı #2/#4 bağlantıları ve özgün görev metni elle ya da yetkili Notion bağlantısıyla kontrol edilir. Notion bir planlama kaynağı, `resources/notion-catalog.json` ise tarihli katalog snapshot'ıdır; ikisi otomatik senkronizasyon olarak sunulmaz.

GitHub API okuması daha sonra başarılı oldu: PR #4 açık ve doğru dalda; önceki commit `8ca463a` için iki platform CI sonucu SUCCESS. Main koruma endpoint'i entegrasyon yetkisi nedeniyle 403: güncel ayarlar doğrulanmış sayılmaz.
