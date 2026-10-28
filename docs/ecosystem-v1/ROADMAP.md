# Doğrusal geliştirme sırası

28 Ekim 2026. Yeni iş önce açık ön koşulu kapatır. Bağımsız işler ayrı dosya/sahip ile ilerleyebilir; bütün ürünleri aynı anda başlatma.

| Sıra / kimlik | Somut sonuç | Kabul koşulu | Durum |
|---|---|---|---|
| 0 / PL-GOV-001 | Ana koordinasyon, ortak talimat, kaynak haritası ve teslim modeli | Yerel belgeler ve incelemeye açık PR; sohbet rolleri bağlı | Bu PR'da review |
| 1 / PL-BASE-001 | Referans Hub SHA, PR #4/#5 ilişkisi ve güncel riskler | Güncel repo/test/CI durumu; tarihî kanıt ayrılmış | ready |
| 2 / PL-DS-001 | Mevcut UI'dan tasarım tokenlarının doğrulanması | Son CSS override, tipografi, gradyan ve ekran eşleşmesi; görünüm değişmemiş | backlog; 1'e bağlı |
| 3 / PL-CONTRACT-001 | Kurulum manifesti ve teknik kabul kapısı | Eksik hash/izin/platform/tasarım kanıtını reddeden gerçek test/CI | backlog; 2'ye bağlı |
| 4 / PL-PILOT-001 | Leo Helper, ardından Mind Palace adaptörü | Kurulum/açılış/güncelleme/kaldırma/rollback + tasarım kanıtı | backlog; 3'e bağlı |
| 5 / MM-CAP-001 | My Mind yetenek ve kaynak envanteri | Gerçek runtime/model/cihaz; metin/vision/araç yetenekleri ayrı ölçülmüş | ready; kod entegrasyonu 3'e bağlı |
| 6 / MM-PILOT-001 | Bir uygulamadan ortak My Mind servisine çağrı | İzin, kesinti, iptal, sınır, model yokken davranış ve cihaz testi | backlog; 4 ve 5'e bağlı |
| 7 / PL-PLATFORM-001 | Web/Android mimarisi ve tek platform pilotu | Paylaşılacak çekirdek/adaptör kararı ve platformda çalışan uçtan uca akış | backlog; 4'e bağlı |
| 8 / PL-CATALOG-001 | Kalan ürünleri sıra ile aileye katma | Ürün başına MVP, manifest, tasarım ve platform kabulü | backlog; 4'e bağlı |
| 9 / PL-RELEASE-001 | Yayın adayı | Güncel güvenlik, cihaz kabulü, paket+ekran+hash ve ayrı yayın onayı | backlog |

Windows mevcut Electron uygulaması bir başlangıçtır. Browser Bridge bağımsız Web ürünü, Linux AppImage Android ürünü sayılmaz. My Mind Lite metin yanıtı vision veya bilgisayar kullanımının kanıtı değildir.

Başlangıç görevi: PL-BASE-001. Önce açık PR'ların HEAD/base ilişkisini ve geçerli CI/güvenlik durumunu raporla; yerel 8ca463a checkout'ı güncel uzak kaynak gibi kullanma. Ana uygulama görünümünü değiştirme. Sonraki teknik işin kapsamını iş kaydına yaz ve o kapsamda devam et.
