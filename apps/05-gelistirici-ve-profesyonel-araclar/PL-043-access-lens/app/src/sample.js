/* Access Lens (PL-043) — bilinen doğrulama kesitleri (fixtures).
 * Notion doğrulama ölçütü: "Bilinen fixture’larda kurala göre doğru bulgu; kritik yanlış olumlu <%5 hedefi." */
(function (root) {
  "use strict";
  const BASE = "2026-11-06T09:00:00.000Z";
  const fixtures = [
    {
      key: "f1",
      title: "Ödeme ve Giriş Formu (Kontrast + Etiket + Görsel)",
      url: "https://magaza-ornek.com/odeme",
      source: `<html lang="tr">
<body>
  <main>
    <h1>Ödeme Adımı</h1>
    <img src="/assets/kampanya-banner.png">
    <p style="color: #9ca3af; background-color: #ffffff; font-size: 14px;">İndirim kodunuz sepette uygulanır.</p>
    <form>
      <input type="email" name="eposta" placeholder="E-posta adresiniz">
      <button type="submit"><svg width="16" height="16"></svg></button>
    </form>
  </main>
</body>
</html>`,
      expectedRules: [
        "WCAG-1.1.1-IMG-ALT",
        "WCAG-1.4.3-CONTRAST-AA",
        "WCAG-1.3.1-FORM-LABEL",
        "WCAG-4.1.2-BTN-NAME",
      ],
    },
    {
      key: "f2",
      title: "Gezinme Çubuğu ve Odak Sırası (Tabindex + Outline + Etkileşim)",
      url: "https://panel-ornek.com/ayarlar",
      source: `<html lang="tr">
<body>
  <main>
    <h1>Hesap Ayarları</h1>
    <nav aria-label="Ana menü">
      <a href="/profil" tabindex="3">Profil</a>
      <a href="/bildirimler">tıklayın</a>
    </nav>
    <div class="card-action" onclick="kaydet()">Değişiklikleri Uygula</div>
    <style>
      .menu-link { outline: none; }
    </style>
  </main>
</body>
</html>`,
      expectedRules: [
        "WCAG-2.4.3-TABINDEX-POS",
        "WCAG-2.4.4-LINK-NAME",
        "WCAG-2.1.1-INTERACTIVE-FOCUS",
        "WCAG-2.4.7-OUTLINE-NONE",
      ],
    },
    {
      key: "f3",
      title: "Makale Sayfası (Dil + Ana Bölge + Başlık Atlama)",
      url: "https://blog-ornek.com/erisilebilirlik-rehberi",
      source: `<html>
<body>
  <header>
    <h1>Erişilebilirlik Rehberi</h1>
  </header>
  <section>
    <h3>Kontrast Neden Önemlidir?</h3>
    <p style="color: #111827; background-color: #ffffff;">Yeterli kontrast düşük görme keskinliğinde okunabilirliği korur.</p>
  </section>
</body>
</html>`,
      expectedRules: [
        "WCAG-3.1.1-HTML-LANG",
        "WCAG-1.3.1-MAIN-LANDMARK",
        "WCAG-1.3.1-HEADING-SKIP",
      ],
    },
    {
      key: "f4",
      title: "Erişilebilir Referans Kartı (Sıfır Bulgu — Yanlış Olumlu Testi)",
      url: "https://tasarim-ornek.com/bilesen/kart",
      source: `<html lang="tr">
<body>
  <main>
    <h1>Müşteri Bildirimi</h1>
    <h2>Özet Bilgiler</h2>
    <img src="/avatar.png" alt="Elif Kaya profil fotoğrafı">
    <p style="color: #111827; background-color: #ffffff; font-size: 16px;">Aboneliğiniz başarıyla yenilendi.</p>
    <form>
      <label for="not-alani">Ek notunuz</label>
      <input id="not-alani" type="text" name="not">
      <button type="submit">Kaydet ve Gönder</button>
    </form>
  </main>
</body>
</html>`,
      expectedRules: [],
    },
  ];

  const api = { BASE, fixtures };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ALSample = api;
})(typeof self !== "undefined" ? self : this);
