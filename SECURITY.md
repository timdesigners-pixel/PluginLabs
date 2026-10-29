# Güvenlik politikası

Gizli bilgileri, özel kullanıcı dosyalarını ve erişim anahtarlarını issue/PR/ekran görüntülerine koymayın. Güvenlik açığını herkese açık örnekle bildirmek yerine GitHub Security → Advisories → Report a vulnerability özel bildirimini kullanın; bu seçenek görünmüyorsa özel iletişim kanalı kurulmadan istismar ayrıntılarını yayınlamayın. Yanıt SLA'sı veya henüz kurulmamış bir iletişim adresi vaat edilmez.

Electron renderer: contextIsolation açık, nodeIntegration kapalı, sandbox açık; dar preload API ve gönderici doğrulaması korunur. Yeni pencere ve harici gezinme varsayılan reddedilir. Üretim başlatıcısında `--no-sandbox` kullanılmaz; otomasyon istisnaları yalnız geçici test verisiyle belgelenir.

Yerel API literal 127.0.0.1'e bağlanır. Host/Origin, istemci izinleri ve kullanıcı onayı kontrolleri korunur. Anahtarlar log/renderer/telemetriye yazılmaz, depolamada hash kullanılır. Yeni IPC/API girdileri sınır, tür ve yetki kontrolünden geçer.

İndirme HTTPS, beklenen boyut ve SHA-256 ile doğrulanır. Arşiv path traversal/symlink ve boyut sınırları test edilir. Paket içerikleri kullanıcı izni dışında kod olarak yürütülmez. İptal, başarısız güncelleme ve geri alma kullanıcı verisini korur.

Her PR `npm audit` raporunu incelemeli; üretim bağımlılıkları için CI yüksek/kritik açıkta başarısız olmalıdır. Geliştirme araçları ve Electron dahil tam rapor da saklanır. Tam rapordaki bulguların varlığı release için engeldir; üretim filtresinin geçmesi tüm uygulamanın güvenli olduğunu göstermez. Sırlar CI'ya gerekmedikçe eklenmez. Actions izinleri salt okuma, checkout kimlik bilgileri kalıcı değil; fork PR'larına sır verilmez.
