# Notion – GitHub takip eşlemesi

Kaynak: [Notion PluginLabs](https://www.notion.so/4038aa13d8f9803dac8df65f5a9d11b3), “Dashboard’dan Düzenlenen Görevler → Eklenti yöneticisini geliştir”. Özgün görev metni ve tamamlanmamış durumu korunmuştur; görev bağlantıları aynı satıra eklenir.

| İş | Takip | Kabul / durum |
| --- | --- | --- |
| Eklenti yöneticisi | [#2](https://github.com/timdesigners-pixel/PluginLabs/issues/2) | Windows otomasyonu geçti; gerçek tarayıcı ve platform kabulü açık |
| Geliştirme ve tasarım standartları, test/derleme CI | [devam PR #4](https://github.com/timdesigners-pixel/PluginLabs/pull/4), [önceki PR #1](https://github.com/timdesigners-pixel/PluginLabs/pull/1) | #1 oturumdan önce birleştirilmiş; yeni değişiklikler aynı branch'te #4 ile incelemede; merge ayrı onay |
| Electron / paketleme güvenliği | [#3](https://github.com/timdesigners-pixel/PluginLabs/issues/3) | Release engeli; 13 yüksek ve 1 kritik etkilenen bağımlılık |
| Codex Cloud ortamı | [kurulum adımları](CODEX-CLOUD.md) | GitHub erişimi var; ortam publish durumu doğrulanmadı |

Notion kapsam/ürün kararı kaynağıdır; GitHub issue uygulanabilir kabul ölçütünü, PR değişikliği ve test kanıtını tutar. Yeni işte iki yönlü bağlantı kurulur. Issue kapanışı ancak kabul kanıtıyla Notion durumuna yansıtılır; PR açılması veya CI dosyası yazılması işi tamamlamaz. 50 ürün fikrinin her biri için gereksiz yeni issue açılmaz; bu çalışma aktif eklenti yöneticisi görevini bağlar.
