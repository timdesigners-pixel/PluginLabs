"use strict";
/* Genel bakış widget'ları — PluginLabs Advanced bileşenleriyle.
   Şimdilik örnek veri gösterilir; uygulamalar Hub'a veri akıtmaya başlayınca
   `live(state)` kancası gerçek veriyi döndürür ve örnek veri yerini ona bırakır.
   Uygulama yüklüyse widget genişler (rich = true). */
(() => {
  const KEY = "pluginlabs.widgets";
  const ico = (d) => `<svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const P = {
    feed: '<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>',
    shirt: '<path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
    menu: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 3c-2 2-2 6 0 8v10"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><circle cx="16" cy="14" r="1"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    scrape: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h6M11 8v6"/>',
    focus: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".5"/>',
    mind: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
  };
  const logo = (code, txt) =>
    `<span class="pl-applogo pl-applogo--sm" ${code ? `data-pl-product="${code}"` : ""} style="width:22px;height:22px;font-size:9px">${txt}</span>`;
  const row = (l, r, extra = "") =>
    `<div class="wdg-row"><span>${l}</span><b class="pl-num">${r}</b>${extra}</div>`;
  const chip = (c, t) => `<span class="wdg-chip" style="--c:var(--pl-viz-${c})"><i></i>${t}</span>`;

  const registry = [
    {
      id: "akis", title: "Veri akışı", app: "Tüm uygulamalar", appId: "", color: 1, icon: P.feed, wide: true, always: true,
      render: (rich) => {
        const f = [
          ["leo", "LH", 5, "Yeni indirim kodu yakalandı: HAFTA20", "2 dk"],
          ["wishlist", "MW", 4, "Kablosuz kulaklık %12 ucuzladı", "14 dk"],
          ["scrapper", "TS", 7, "Fiyat taraması bitti · 148 ürün", "31 dk"],
          ["mindpalace", "MP", 1, "Not eklendi: Kasım plan toplantısı", "1 sa"],
          ["", "FA", 3, "Kira ödemesi 3 gün sonra", "2 sa"],
          ["gardrop", "GR", 3, "Yarın için kombin hazır", "3 sa"],
          ["mutfak", "MA", 6, "Haftalık menü güncellendi", "4 sa"],
          ["", "FO", 2, "25 dk odak seansı tamamlandı", "5 sa"],
        ].slice(0, rich ? 8 : 5);
        return `<div class="wdg-feed">${f.map(([c, t, col, m, ti]) => `<div class="wdg-feedrow" style="--c:var(--pl-viz-${col})">${logo(c, t)}<span class="wdg-msg">${m}</span><span class="pl-muted pl-num">${ti}</span></div>`).join("")}</div>`;
      },
    },
    {
      id: "kombin", title: "Günün kombini", app: "Gardrop", appId: "gardrop", color: 3, icon: P.shirt,
      render: (rich) =>
        `<div class="wdg-outfit"><div class="wdg-swatches"><span style="--sw:#d9cdb4" title="Keten gömlek"></span><span style="--sw:#1f3350" title="Lacivert chino"></span><span style="--sw:#e8e8ea" title="Beyaz sneaker"></span></div><div class="wdg-lines">${row("Üst", "Keten gömlek")}${row("Alt", "Lacivert chino")}${row("Ayakkabı", "Beyaz sneaker")}${rich ? row("Aksesuar", "Deri kemer") : ""}</div></div><div class="wdg-meta">${chip(2, "18° · parçalı bulutlu")}${chip(7, "Yağmur %20")}${rich ? chip(5, "Ofis günü") : ""}</div>`,
    },
    {
      id: "menu", title: "Günün menüsü", app: "Mutfak Atölyesi", appId: "mutfak-atolyesi", color: 6, icon: P.menu,
      render: (rich) =>
        `<div class="wdg-lines">${row("Kahvaltı", "Menemen · tam buğday ekmek")}${row("Öğle", "Mercimek çorbası · zeytinyağlı fasulye")}${row("Akşam", "Fırında tavuk · bulgur pilavı")}${rich ? row("Atıştırmalık", "Yoğurt · ceviz") : ""}</div><div class="wdg-meta">${chip(6, "≈ 1.850 kcal")}${chip(5, "Alışveriş: 4 eksik")}</div>`,
    },
    {
      id: "bugun", title: "Bugün", app: "Daily Brief Widget", appId: "daily-brief-widget", color: 7, icon: P.cal,
      render: (rich) =>
        `<div class="wdg-lines">${row("09:30", "Ekip toplantısı")}${row("12:00", "Müşteri görüşmesi")}${row("15:00", "Odak seansı · 2 × 25 dk")}${rich ? row("18:30", "Spor") : ""}</div><div class="wdg-meta">${chip(7, "3 görev açık")}${rich ? chip(4, "1 çakışma önerisi") : ""}</div>`,
    },
    {
      id: "finans", title: "Yaklaşan ödemeler", app: "Finansal Asistan", appId: "finansal-asistan", color: 4, icon: P.wallet,
      render: (rich) =>
        `<div class="wdg-big pl-num" style="color:var(--pl-gold)">12.450,00 ₺</div><div class="pl-muted wdg-sub">Bu ay kalan ödeme</div><div class="wdg-lines">${row("Kira", "8.500,00 ₺", '<em>3 gün</em>')}${row("Fatura", "1.249,90 ₺", '<em>6 gün</em>')}${rich ? row("Taksit", "2.700,10 ₺", '<em>12 gün</em>') : ""}</div>`,
    },
    {
      id: "fiyat", title: "Fiyat düşüşleri", app: "MyWishlist", appId: "mywishlist", color: 5, icon: P.tag,
      render: (rich) =>
        `<div class="wdg-lines">${row("Kablosuz kulaklık", "1.249,90 ₺", '<em class="is-up">%12 ↓</em>')}${row("Mekanik klavye", "2.099,00 ₺", '<em class="is-up">%8 ↓</em>')}${rich ? row("Masa lambası", "649,00 ₺", '<em class="is-up">%5 ↓</em>') : ""}</div><div class="wdg-meta">${chip(5, "3 ürün hedef fiyata yakın")}</div>`,
    },
    {
      id: "kodlar", title: "Yakalanan kodlar", app: "Leo Helper", appId: "leo-helper", color: 5, icon: P.code,
      render: (rich) =>
        `<div class="wdg-big pl-num">1.284</div><div class="pl-muted wdg-sub">Bu hafta yakalanan kod</div><div class="wdg-meta"><span class="pl-badge pl-badge--success">HAFTA20</span><span class="pl-badge">YAZ-15</span>${rich ? '<span class="pl-badge">KARGO0</span><span class="pl-badge">ILKSIPARIS</span>' : ""}</div>`,
    },
    {
      id: "notlar", title: "Son notlar", app: "Mind Palace", appId: "mind-palace", color: 1, icon: P.note,
      render: (rich) =>
        `<div class="wdg-lines">${row("Kasım plan toplantısı", "bugün")}${row("Fikir: haftalık özet", "dün")}${rich ? row("Okuma listesi", "2 gün") : ""}</div><div class="wdg-meta"><span class="pl-badge pl-badge--accent">MyMind özeti</span>${chip(1, "7 görev")}</div>`,
    },
    {
      id: "tarama", title: "Kazıma görevleri", app: "PluginLabs Scrapper", appId: "pluginlabs-scrapper", color: 7, icon: P.scrape,
      render: (rich) =>
        `<div class="wdg-lines">${row("Fiyat taraması", "%64")}</div><div class="pl-progress" role="progressbar" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100"><span style="--pl-val:64%"></span></div>${rich ? `<div class="wdg-lines" style="margin-top:10px">${row("Site rehberi", "hazır")}${row("Zamanlanmış", "yarın 08:00")}</div>` : ""}`,
    },
    {
      id: "odak", title: "Odak", app: "Focus Orbit", appId: "focus-orbit", color: 2, icon: P.focus,
      render: (rich) =>
        `<div class="wdg-ringrow"><div class="pl-ring" style="--pl-val:72;--pl-accent:var(--pl-viz-2)" role="img" aria-label="Odak %72"><span>72</span></div><div class="wdg-lines" style="flex:1">${row("Bugün", "3 seans")}${row("Toplam", "1 sa 15 dk")}${rich ? row("Kesinti", "2") : ""}</div></div>`,
    },
    {
      id: "mymind", title: "My Mind", app: "Hub", appId: "", color: 1, icon: P.mind, live: true, always: true,
      render: (rich, st) => {
        const m = st.model;
        const s = m.error ? ["error", "Hata"] : m.running ? ["online", "Çalışıyor"] : m.starting ? ["syncing", "Başlatılıyor"] : ["", "Kapalı"];
        return `<div class="wdg-lines"><div class="wdg-row"><span>Sunucu</span><span class="pl-status ${s[0] ? "pl-status--" + s[0] : ""}">${s[1]}</span></div>${row("Yerel API", st.api.running ? "hazır" : "çevrimdışı")}${row("Sağlayıcı", String(st.providers.length))}${rich ? row("İstemci", String(st.clients.length)) : ""}</div>`;
      },
    },
  ];

  const ids = registry.map((w) => w.id);
  const layout = {
    get() {
      let v = {};
      try { v = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch {}
      const order = (Array.isArray(v.order) ? v.order : []).filter((i) => ids.includes(i));
      ids.forEach((i) => { if (!order.includes(i)) order.push(i); });
      const hidden = (Array.isArray(v.hidden) ? v.hidden : []).filter((i) => ids.includes(i));
      return { order, hidden };
    },
    set(l) {
      try { localStorage.setItem(KEY, JSON.stringify(l)); } catch {}
      return layout.get();
    },
    toggle(id) {
      const l = layout.get();
      l.hidden = l.hidden.includes(id) ? l.hidden.filter((i) => i !== id) : [...l.hidden, id];
      return layout.set(l);
    },
    move(id, dir) {
      const l = layout.get(), i = l.order.indexOf(id), j = i + (dir === "up" ? -1 : 1);
      if (i < 0 || j < 0 || j >= l.order.length) return l;
      [l.order[i], l.order[j]] = [l.order[j], l.order[i]];
      return layout.set(l);
    },
    reset() {
      try { localStorage.removeItem(KEY); } catch {}
      return layout.get();
    },
  };

  function render(id, st) {
    const w = registry.find((x) => x.id === id);
    if (!w) return "";
    const installed = !!(w.appId && st.installed[w.appId]);
    const rich = installed || w.live || w.always;
    const badges = w.live
      ? '<span class="pl-badge pl-badge--success">Canlı</span>'
      : `<span class="pl-badge">Örnek veri</span>${installed ? '<span class="pl-badge pl-badge--success">Yüklü</span>' : ""}`;
    return `<section class="card wdg${w.wide || installed ? " is-wide" : ""}" data-w="${w.id}" style="--c:var(--pl-viz-${w.color})"><header class="wdg-head"><span class="wdg-ic">${ico(w.icon)}</span><div class="wdg-title"><h3>${w.title}</h3><small class="pl-muted">${w.app}</small></div><div class="wdg-badges">${badges}</div></header><div class="wdg-body">${w.render(rich, st)}</div></section>`;
  }

  window.plWidgets = { registry, layout, render };
})();
