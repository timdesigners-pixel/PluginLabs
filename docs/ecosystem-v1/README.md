# PluginLabs ekosistem sözleşmesi v1

Mevcut Hub görünümü korunarak tasarım referansı, portable token verisi ve uygulama yayın kabul şeması hazırlanır. Portable JSON artık `npm run tokens:generate` ile `ui/design-tokens.css` üretir; Hub bu adaptörü bileşen CSS'inden önce yükler. Katalog ve bağımlılıklar değişmez.

- [Tasarım sistemi](DESIGN-SYSTEM.md)
- [Kaynak tokenlar](design-system/tokens.json)
- [Uygulama kabul manifesti](contracts/app-manifest.schema.json)

İlk uygulama sırası: kaynak SHA ve screenshot referansını sabitle; Leo Helper ve Mind Palace için bağımsız manifest/adaptör çıkar; kurulum, açılış, güncelleme, kaldırma ve geri alma ile tasarım kontrollerini gerçek platformda doğrula. Katalog fikirlerini tamamlanmış ürün gibi sunma. Her ürünün kontrast, klavye, odak, Türkçe, reduced-motion, DPI ve durum kontrolleri passed olmadan uyumlu ilan etme. Şema henüz Hub tarafından çalıştırılan bir yayın kapısı değildir.

Mevcut kart radius 12px, genel radius 16px; son sidebar genişliği 268px/230px. Bu değerler ortak politika nedeniyle değiştirilmez. Flow Dock kendi platform/vurgu adaptörüyle devam eder.

İlk sözleşme PR #5 ile, #4 geliştirme standardının üzerine hazırlanmıştır; runtime entegrasyonu ayrı devam PR'ıdır. Main merge ve uygulama release ayrı insan onayı gerektirir.

![Mevcut Windows Hub referansı](../screenshots/verification-windows-home.png)

Ekran geçmiş Windows doğrulamasındandır; yeni runtime entegrasyonunun kanıtı için [uygulama kaydına](../DESIGN-SYSTEM-V1-IMPLEMENTATION.md) bakın.
