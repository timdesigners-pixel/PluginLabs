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

  const PK = "pluginlabs.photo.";
  const photoOf = (k) => {
    try { return localStorage.getItem(PK + k) || ""; } catch { return ""; }
  };
  const camIco = ico('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/>');
  const pickBtn = (k, label, cls = "") =>
    `<button class="wdg-pick ${cls}" data-photo-pick="${k}" aria-label="${label}" title="${label}">${camIco}</button>`;
  // Örnek çizimler: gerçek fotoğraf değildir; kullanıcı kendi fotoğrafını ekleyince yerini ona bırakır.
  const DISH = {
    kahvalti:
      '<svg viewBox="0 0 100 100" role="img" aria-label="Menemen çizimi"><defs><radialGradient id="dg1" cx=".4" cy=".35"><stop offset="0" stop-color="#f08a4b"/><stop offset="1" stop-color="#c9432a"/></radialGradient></defs><circle cx="50" cy="50" r="49" fill="#2b2f3a"/><circle cx="50" cy="50" r="44" fill="#f2ece0"/><circle cx="50" cy="50" r="37" fill="#e6dccb"/><path d="M24 52c0-14 12-24 26-24s26 10 26 24-12 20-26 20-26-6-26-20z" fill="url(#dg1)"/><path d="M34 46c4-6 12-8 18-4 5 3 4 9-2 11-7 2-18 1-16-7z" fill="#f6c945"/><path d="M52 56c5-4 13-2 14 3 1 5-6 7-12 6-5-1-6-6-2-9z" fill="#f9d96a"/><g fill="#5a8a3c"><circle cx="30" cy="58" r="2.2"/><circle cx="64" cy="40" r="2"/><circle cx="46" cy="36" r="1.8"/><circle cx="70" cy="56" r="2"/></g><path d="M20 78c8 6 20 9 30 9 14 0 24-5 30-12" stroke="#d6c7ac" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/></svg>',
    ogle:
      '<svg viewBox="0 0 100 100" role="img" aria-label="Mercimek çorbası çizimi"><defs><radialGradient id="dg2" cx=".45" cy=".4"><stop offset="0" stop-color="#f3a93c"/><stop offset="1" stop-color="#c76a17"/></radialGradient></defs><circle cx="50" cy="50" r="49" fill="#2b2f3a"/><circle cx="50" cy="50" r="44" fill="#ece4d6"/><circle cx="50" cy="50" r="35" fill="#d9cdb8"/><circle cx="50" cy="50" r="30" fill="url(#dg2)"/><path d="M34 42c8-8 22-8 30 0" stroke="#f9cf7c" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/><path d="M38 58c8 6 18 6 26-1" stroke="#a9540f" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".6"/><g fill="#6a9a45"><circle cx="46" cy="50" r="1.8"/><circle cx="56" cy="46" r="1.6"/><circle cx="52" cy="58" r="1.6"/></g><path d="M70 22a14 14 0 0 1 8 18l-12-4z" fill="#f2d54b"/><path d="M70 22a14 14 0 0 1 8 18" stroke="#e0b92d" stroke-width="1.5" fill="none"/></svg>',
    aksam:
      '<svg viewBox="0 0 100 100" role="img" aria-label="Tavuk ve pilav çizimi"><defs><radialGradient id="dg3" cx=".4" cy=".35"><stop offset="0" stop-color="#e0a35e"/><stop offset="1" stop-color="#a8672f"/></radialGradient></defs><circle cx="50" cy="50" r="49" fill="#2b2f3a"/><circle cx="50" cy="50" r="44" fill="#f2ece0"/><circle cx="50" cy="50" r="36" fill="#e6dccb"/><ellipse cx="38" cy="54" rx="19" ry="15" fill="#f6f1e2"/><g fill="#e3d9c0"><circle cx="30" cy="50" r="2"/><circle cx="38" cy="46" r="2"/><circle cx="44" cy="54" r="2"/><circle cx="32" cy="60" r="2"/><circle cx="42" cy="62" r="2"/></g><path d="M52 40c8-8 20-4 22 6 2 9-8 16-17 14-9-2-12-12-5-20z" fill="url(#dg3)"/><path d="M58 44l10 8M56 52l8 6" stroke="#7a4518" stroke-width="2" stroke-linecap="round" opacity=".6"/><g fill="#5a8a3c"><path d="M26 34c4-2 8 0 8 4-4 2-8 0-8-4z"/><path d="M70 66c4-2 8 0 8 4-4 2-8 0-8-4z"/></g></svg>',
  };
  const MANNEQUIN =
    '<svg viewBox="0 0 120 160" role="img" aria-label="Kombin çizimi" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="mqbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232b45"/><stop offset="1" stop-color="#141a2c"/></linearGradient></defs><rect width="120" height="160" fill="url(#mqbg)"/><ellipse cx="60" cy="150" rx="34" ry="5" fill="#000" opacity=".35"/><circle cx="60" cy="22" r="11" fill="#3a4256"/><rect x="55" y="30" width="10" height="9" rx="3" fill="#3a4256"/><path d="M38 40l22-5 22 5 14 14-8 18-8-6v34H40V66l-8 6-8-18z" fill="#d9cdb8"/><path d="M52 36l8 12 8-12" fill="none" stroke="#bfb298" stroke-width="2"/><rect x="40" y="96" width="40" height="5" fill="#6b4a2b"/><path d="M40 101h40l4 44H64l-4-30-4 30H36z" fill="#1f3350"/><path d="M56 145h-20l-3 8h24zM64 145h20l3 8H67z" fill="#e8e8ea"/></svg>';
  const photoSlot = (key, svg, cls, note) => {
    const url = photoOf(key);
    const img = url
      ? `<img src="${url}" alt="Eklediğiniz fotoğraf" />`
      : svg;
    return `<div class="wdg-photo ${cls}" data-slot="${key}"><div class="wdg-photo__img">${img}${pickBtn(key, url ? "Fotoğrafı değiştir" : "Fotoğraf ekle")}</div>${note ? `<small class="pl-muted wdg-photo__note">${url ? '<button class="text-button" data-photo-clear="' + key + '">Fotoğrafı kaldır</button>' : note}</small>` : ""}</div>`;
  };
  function pickPhoto(key) {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f || !f.type.startsWith("image/")) return;
      const r = new FileReader();
      r.onload = () => {
        const im = new Image();
        im.onload = () => {
          const sc = Math.min(1, 720 / Math.max(im.width, im.height)),
            c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(im.width * sc));
          c.height = Math.max(1, Math.round(im.height * sc));
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          try {
            localStorage.setItem(PK + key, c.toDataURL("image/jpeg", 0.82));
          } catch {
            window.plWidgets.onError && window.plWidgets.onError("Fotoğraf kaydedilemedi: yer yetersiz");
          }
          window.plWidgets.onChange && window.plWidgets.onChange();
        };
        im.onerror = () => window.plWidgets.onError && window.plWidgets.onError("Bu dosya görsel olarak açılamadı");
        im.src = r.result;
      };
      r.readAsDataURL(f);
    };
    inp.click();
  }
  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-photo-pick]");
    if (p) return pickPhoto(p.dataset.photoPick);
    const c = e.target.closest("[data-photo-clear]");
    if (c) {
      try { localStorage.removeItem(PK + c.dataset.photoClear); } catch {}
      window.plWidgets.onChange && window.plWidgets.onChange();
    }
  });

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
      id: "kombin", title: "Günün kombini", app: "Gardrop", appId: "gardrop", color: 3, icon: P.shirt, wide: true,
      render: (rich) =>
        `<div class="wdg-outfit">${photoSlot("kombin", MANNEQUIN, "wdg-photo--portrait", "Çizim önizlemedir · kendi fotoğrafınızı ekleyin")}<div class="wdg-outfit__side"><div class="wdg-lines">${row("Üst", "Keten gömlek")}${row("Alt", "Lacivert chino")}${row("Ayakkabı", "Beyaz sneaker")}${rich ? row("Aksesuar", "Deri kemer") : ""}</div><div class="wdg-meta">${chip(2, "18° · parçalı bulutlu")}${chip(7, "Yağmur %20")}${rich ? chip(5, "Ofis günü") : ""}</div></div></div>`,
    },
    {
      id: "menu", title: "Günün menüsü", app: "Mutfak Atölyesi", appId: "mutfak-atolyesi", color: 6, icon: P.menu, wide: true,
      render: (rich) => {
        const d = [["kahvalti", "Kahvaltı", "Menemen · tam buğday ekmek"], ["ogle", "Öğle", "Mercimek çorbası · fasulye"], ["aksam", "Akşam", "Fırında tavuk · bulgur pilavı"]];
        const dish = ([k, l, n]) => {
          const url = photoOf("dish-" + k);
          return `<div class="wdg-dish"><div class="wdg-dish__img">${url ? `<img src="${url}" alt="${l} fotoğrafı" />` : DISH[k]}${pickBtn("dish-" + k, url ? l + " fotoğrafını değiştir" : l + " için fotoğraf ekle", "wdg-pick--sm")}</div><b>${l}</b><span class="pl-muted">${n}</span>${url ? `<button class="text-button" data-photo-clear="dish-${k}">Kaldır</button>` : ""}</div>`;
        };
        return `<div class="wdg-dishes">${d.map(dish).join("")}</div><div class="wdg-meta">${chip(6, "≈ 1.850 kcal")}${chip(5, "Alışveriş: 4 eksik")}${rich ? chip(4, "Atıştırmalık: yoğurt · ceviz") : ""}<small class="pl-muted">Çizimler önizlemedir · yemek fotoğrafı ekleyebilirsiniz</small></div>`;
      },
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
