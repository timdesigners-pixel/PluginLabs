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

  // Canlı kanal verisi: Hub'a uygulamaların yayınladığı kayıt. Metinler kaçışlanır ve sınırlanır.
  const esc = (v, n = 80) =>
    String(v ?? "").slice(0, n).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const chan = (st, name) => (st.channels || []).find((c) => c.channel === name && c.data && typeof c.data === "object") || null;
  const list = (v, n = 8) => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object").slice(0, n) : []);
  const numOf = (v) => (Number.isFinite(v) ? v : null);
  const ago = (t) => {
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    return m < 1 ? "şimdi" : m < 60 ? m + " dk" : m < 1440 ? Math.round(m / 60) + " sa" : Math.round(m / 1440) + " gün";
  };

  const PK = "pluginlabs.photo.";
  const photoOf = (k) => {
    try { return localStorage.getItem(PK + k) || ""; } catch { return ""; }
  };
  const camIco = ico('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/>');
  const pickBtn = (k, label, cls = "") =>
    `<button class="wdg-pick ${cls}" data-photo-pick="${k}" aria-label="${label}" title="${label}">${camIco}</button>`;
  // Örnek görseller (Gemini ile üretildi, ui/img/): gerçek kullanıcı fotoğrafı değildir; kullanıcı kendi fotoğrafını ekleyince yerini ona bırakır.
  const SAMPLE = (file, alt) => `<img src="img/${file}.webp" alt="${alt}" decoding="async" />`;
  // Eski çizimler (SVG) yedek olarak korunur.
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

  const TRD = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"], TRFULL = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const two = (n) => String(n).padStart(2, "0");
  const weekStrip = () => {
    const now = new Date(), mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return { n: TRD[d.getDay()], d: d.getDate(), today: d.toDateString() === now.toDateString() }; });
  };
  const check = ico('<path d="M20 6 9 17l-5-5"/>');
  const taskItem = (icd, title, sub, done) =>
    `<div class="pl-taskcard__item${done ? " is-done" : ""}"><span class="pl-taskcard__ic">${ico(icd)}</span><span>${title}<small>${sub}</small></span><span class="pl-taskcard__chk">${done ? check : ""}</span></div>`;
  const queueItem = (txt, name, sub, badge, active) =>
    `<div class="pl-queue__item${active ? " is-active" : ""}"><span class="pl-avatar">${txt}</span><span><b>${name}</b><small>${sub}</small></span>${badge}</div>`;
  const activityTile = (icd, name, sub, pct, badge) =>
    `<div class="pl-activity"><span class="pl-activity__ic">${ico(icd)}</span><b>${name}</b><small>${sub}</small><div class="pl-activity__foot"><span>İlerleme</span><span class="pl-num">%${pct}</span></div><div class="pl-progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="--pl-val:${pct}%"></span></div>${badge}</div>`;
  const climate = (items) => `<div class="pl-climate">${items.map(([d, t, l]) => `<span aria-label="${l}">${ico(d)}${t}</span>`).join("")}</div>`;
  const calcCompute = (price, pesin, vade, oran) => {
    const loan = price * (1 - pesin / 100), r = oran / 100;
    const m = r === 0 ? loan / vade : (loan * r) / (1 - Math.pow(1 + r, -vade));
    return { down: price * (pesin / 100), monthly: m };
  };
  const tl = (n) => Math.round(n).toLocaleString("tr-TR") + " ₺";
  document.addEventListener("input", (e) => {
    const sl = e.target.closest && e.target.closest("[data-calc]");
    if (!sl) return;
    const box = sl.closest(".pl-calc"), price = 4250000, vade = 120, oran = 2.79;
    const r = calcCompute(price, Number(sl.value), vade, oran);
    sl.setAttribute("aria-valuetext", "%" + sl.value);
    box.querySelector("[data-pesin-lbl]").textContent = "%" + sl.value;
    box.querySelector("[data-down]").textContent = tl(r.down);
    box.querySelector("[data-monthly]").textContent = tl(r.monthly);
  });

  const registry = [
    {
      id: "akis", title: "Veri akışı", app: "Tüm uygulamalar", appId: "", color: 1, icon: P.feed, wide: true, always: true,
      render: (rich, st) => {
        const live = (st.channels || [])
          .filter((c) => /\.feed$/.test(c.channel))
          .flatMap((c) => list(c.data.events, 6).map((e) => [c.namespace, e, c]))
          .sort((a, b) => (b[2].updatedAt || 0) - (a[2].updatedAt || 0))
          .slice(0, rich ? 8 : 5);
        if (live.length)
          return `<div class="wdg-feed">${live.map(([ns, e, c]) => `<div class="wdg-feedrow" style="--c:var(--pl-viz-1)">${logo("", esc(ns, 2).toUpperCase())}<span class="wdg-msg">${esc(e.message, 120)}</span><span class="pl-muted pl-num">${esc(e.time || ago(c.updatedAt), 12)}</span></div>`).join("")}</div>`;
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
      render: (rich) => {
        const now = new Date();
        const w = `<div class="wdg-weatherbox"><div class="pl-weather pl-glass"><div class="pl-weather__time"><span class="pl-weather__day">${TRFULL[now.getDay()]}</span><time class="pl-weather__clock" datetime="${now.toISOString().slice(0, 16)}">${two(now.getHours())}:${two(now.getMinutes())} <small>${two(now.getDate())}.${two(now.getMonth() + 1)}.${now.getFullYear()}</small></time></div><div class="pl-weather__temp">${ico('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>')}<b>18°</b><small>Parçalı bulutlu</small></div></div></div>`;
        const c = climate([['<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/>', "Yağmur %20", "Yağmur ihtimali yüzde 20"], ['<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>', "12 km/s", "Rüzgar saatte 12 kilometre"], ['<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', "Ofis günü", "Plan: ofis günü"]]);
        return `<div class="wdg-outfit">${photoSlot("kombin", SAMPLE("kombin", "Örnek kombin: keten gömlek, lacivert chino, beyaz sneaker, deri kemer"), "wdg-photo--portrait", "Örnek görsel (AI ile üretildi) · kendi fotoğrafınızı ekleyin")}<div class="wdg-outfit__side">${w}<div class="wdg-lines">${row("Üst", "Keten gömlek")}${row("Alt", "Lacivert chino")}${row("Ayakkabı", "Beyaz sneaker")}${rich ? row("Aksesuar", "Deri kemer") : ""}</div>${c}</div></div>`;
      },
    },
    {
      id: "menu", title: "Günün menüsü", app: "Mutfak Atölyesi", appId: "mutfak-atolyesi", color: 6, icon: P.menu, wide: true,
      render: (rich) => {
        const d = [["kahvalti", "Kahvaltı", "Menemen · tam buğday ekmek", "520"], ["ogle", "Öğle", "Mercimek çorbası · fasulye", "640"], ["aksam", "Akşam", "Fırında tavuk · bulgur pilavı", "690"]];
        const dish = ([k, l, n, kc]) => {
          const url = photoOf("dish-" + k);
          return `<article class="pl-dish wdg-dishcard"><span class="pl-dish__img">${url ? `<img src="${url}" alt="${l} fotoğrafı" />` : SAMPLE("dish-" + k, `${l} örnek görseli: ${n}`)}</span><b>${l}</b><small>${n}</small><div class="pl-dish__foot"><span class="pl-dish__price">${kc} kcal</span><button class="pl-dish__add" data-photo-pick="dish-${k}" aria-label="${l} için fotoğraf ${url ? "değiştir" : "ekle"}" title="${url ? "Fotoğrafı değiştir" : "Fotoğraf ekle"}">${camIco}</button></div>${url ? `<button class="text-button" data-photo-clear="dish-${k}">Fotoğrafı kaldır</button>` : ""}</article>`;
        };
        return `<div class="wdg-dishes">${d.map(dish).join("")}</div><div class="wdg-meta">${chip(6, "≈ 1.850 kcal")}${chip(5, "Alışveriş: 4 eksik")}${rich ? chip(4, "Atıştırmalık: yoğurt · ceviz") : ""}<small class="pl-muted">Örnek görseller (AI ile üretildi) · yemek fotoğrafı ekleyebilirsiniz</small></div>`;
      },
    },
    {
      id: "bugun", title: "Bugün", app: "Daily Brief Widget", appId: "daily-brief-widget", color: 7, icon: P.cal,
      render: (rich) => {
        const strip = `<div class="pl-daystrip" role="tablist" aria-label="Hafta">${weekStrip().map((g) => `<button role="tab" aria-selected="${g.today}" class="${g.today ? "is-active is-today" : ""}" tabindex="${g.today ? 0 : -1}">${g.n}<b>${g.d}</b></button>`).join("")}</div>`;
        const ev = [["09:00", '<div class="pl-agenda__evt" style="--x:4%;--w:46%">Ekip toplantısı</div>'], ["12:00", '<div class="pl-agenda__evt pl-agenda__evt--soft" style="--x:20%;--w:52%">Müşteri görüşmesi</div>'], ["15:00", '<div class="pl-agenda__evt" style="--x:4%;--w:60%">Odak seansı · 2 × 25 dk</div>']].concat(rich ? [["18:30", '<div class="pl-agenda__evt pl-agenda__evt--soft" style="--x:10%;--w:40%">Spor</div>']] : []);
        return `${strip}<div class="pl-agenda">${ev.map(([t, e]) => `<div class="pl-agenda__t">${t}</div><div class="pl-agenda__s">${e}</div>`).join("")}</div>`;
      },
    },
    {
      id: "gorevler", title: "Görevler", app: "Daily Brief Widget", appId: "daily-brief-widget", color: 2, icon: P.cal,
      render: (rich) =>
        `<div class="pl-taskcard"><div class="pl-taskcard__head"><b>Bugünün görevleri</b><span>2/${rich ? 5 : 4}</span></div>${taskItem('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', "Kasım planını oku", "bugün · 09:30", true)}${taskItem('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>', "Ekip toplantısı", "bugün · 11:30", true)}${taskItem('<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>', "Proje güncellemesi", "yarın · 15:00", false)}${taskItem('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/>', "Fatura kontrolü", "yarın · 17:00", false)}${rich ? taskItem('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', "Haftalık özet", "cuma · 16:00", false) : ""}</div>`,
    },
    {
      id: "finans", title: "Yaklaşan ödemeler", app: "Finansal Asistan", appId: "finansal-asistan", color: 4, icon: P.wallet,
      channel: "finansal-asistan.upcoming",
      render: (rich, st) => {
        const c = chan(st, "finansal-asistan.upcoming");
        if (c) {
          const rows = list(c.data.rows, rich ? 4 : 3).map((r) => row(esc(r.name, 40), esc(r.amount, 16), r.when ? `<em>${esc(r.when, 12)}</em>` : "")).join("");
          return `<div class="pl-kpi"><span class="pl-label">Yaklaşan ödeme</span><span class="pl-kpi__value" style="font-size:22px">${esc(c.data.total ?? "—", 20)}</span></div><div class="wdg-lines">${rows}</div>`;
        }
        return `<div class="pl-kpi"><div class="pl-row" style="justify-content:space-between"><span class="pl-label">Kasım bütçesi</span><span class="pl-badge pl-badge--warning">%82</span></div><span class="pl-kpi__value" style="font-size:22px">8.200 ₺ <span class="pl-muted" style="font-size:13px">/ 10.000 ₺</span></span><div class="pl-progress" role="progressbar" aria-valuenow="82" aria-valuemin="0" aria-valuemax="100"><span style="--pl-val:82%;background:var(--pl-warning)"></span></div><span class="pl-muted">Kalan <b class="pl-num" style="color:var(--pl-gold)">1.800 ₺</b> · 3 ödeme</span></div><div class="wdg-lines">${row("Kira", "8.500,00 ₺", '<em>3 gün</em>')}${row("Fatura", "1.249,90 ₺", '<em>6 gün</em>')}${rich ? row("Taksit", "2.700,10 ₺", '<em>12 gün</em>') : ""}</div>`;
      },
    },
    {
      id: "fiyat", title: "Fiyat düşüşleri", app: "MyWishlist", appId: "mywishlist", color: 5, icon: P.tag,
      channel: "mywishlist.drops",
      render: (rich, st) => {
        const c = chan(st, "mywishlist.drops");
        if (c) {
          const rows = list(c.data.rows, rich ? 4 : 3).map((r) => row(esc(r.name, 40), esc(r.price, 16), r.change ? `<em class="is-up">${esc(r.change, 10)}</em>` : "")).join("");
          return `<div class="wdg-lines">${rows}</div>`;
        }
        return `<div class="wdg-lines">${row("Kablosuz kulaklık", "1.249,90 ₺", '<em class="is-up">%12 ↓</em>')}${row("Mekanik klavye", "2.099,00 ₺", '<em class="is-up">%8 ↓</em>')}${rich ? row("Masa lambası", "649,00 ₺", '<em class="is-up">%5 ↓</em>') : ""}</div><div class="wdg-meta">${chip(5, "3 ürün hedef fiyata yakın")}</div>`;
      },
    },
    {
      id: "kodlar", title: "Yakalanan kodlar", app: "Leo Helper", appId: "leo-helper", color: 5, icon: P.code,
      channel: "leo-helper.codes",
      render: (rich, st) => {
        const c = chan(st, "leo-helper.codes");
        if (c) {
          const chips = list(c.data.chips, rich ? 4 : 2).map((x, i) => `<span class="pl-badge${i ? "" : " pl-badge--success"}">${esc(x.text ?? x.code, 24)}</span>`).join("");
          return `<div class="wdg-big pl-num">${esc(numOf(c.data.total) ?? "—", 12)}</div><div class="pl-muted wdg-sub">${esc(c.data.label || "Yakalanan kod", 60)}</div><div class="wdg-meta">${chips}</div>`;
        }
        return `<div class="wdg-big pl-num">1.284</div><div class="pl-muted wdg-sub">Bu hafta yakalanan kod</div><div class="wdg-meta"><span class="pl-badge pl-badge--success">HAFTA20</span><span class="pl-badge">YAZ-15</span>${rich ? '<span class="pl-badge">KARGO0</span><span class="pl-badge">ILKSIPARIS</span>' : ""}</div>`;
      },
    },
    {
      id: "notlar", title: "Son notlar", app: "Mind Palace", appId: "mind-palace", color: 1, icon: P.note,
      channel: "mind-palace.notes",
      render: (rich, st) => {
        const c = chan(st, "mind-palace.notes");
        if (c) {
          const rows = list(c.data.rows, rich ? 4 : 3).map((r) => row(esc(r.title, 50), esc(r.when, 12))).join("");
          return `<div class="wdg-lines">${rows}</div>`;
        }
        return `<div class="wdg-lines">${row("Kasım plan toplantısı", "bugün")}${row("Fikir: haftalık özet", "dün")}${rich ? row("Okuma listesi", "2 gün") : ""}</div><div class="wdg-meta"><span class="pl-badge pl-badge--accent">MyMind özeti</span>${chip(1, "7 görev")}</div>`;
      },
    },
    {
      id: "tarama", title: "Kazıma görevleri", app: "PluginLabs Scrapper", appId: "pluginlabs-scrapper", color: 7, icon: P.scrape,
      channel: "pluginlabs-scrapper.tasks",
      render: (rich, st) => {
        const c = chan(st, "pluginlabs-scrapper.tasks");
        if (c) {
          const items = list(c.data.tasks, rich ? 4 : 3);
          const q = items.map((t, i) => {
            const pct = Math.min(100, Math.max(0, numOf(t.pct) ?? 0));
            const badge = t.state === "done" ? '<span class="pl-badge pl-badge--success">Tamam</span>' : `<span class="pl-badge pl-badge--info">%${pct}</span>`;
            return queueItem(esc(t.name, 2).toUpperCase() || "GR", esc(t.name, 40), esc(t.sub, 40), badge, i === 0);
          }).join("");
          const lead = Math.min(100, Math.max(0, numOf(items[0]?.pct) ?? 0));
          return `<div class="pl-queue" role="list" aria-label="Kazıma görevleri">${q}</div><div class="pl-progress" role="progressbar" aria-label="${esc(items[0]?.name, 40)}" aria-valuenow="${lead}" aria-valuemin="0" aria-valuemax="100"><span style="--pl-val:${lead}%"></span></div>`;
        }
        return `<div class="pl-queue" role="list" aria-label="Kazıma görevleri">${queueItem("FT", "Fiyat taraması", "148 / 230 ürün", '<span class="pl-badge pl-badge--info">%64</span>', true)}${queueItem("SR", "Site rehberi", "hazır", '<span class="pl-badge pl-badge--success">Tamam</span>')}${rich ? queueItem("ZM", "Zamanlanmış", "yarın 08:00", '<span class="pl-badge">Yarın</span>') : ""}</div><div class="pl-progress" role="progressbar" aria-label="Fiyat taraması" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100"><span style="--pl-val:64%"></span></div>`;
      },
    },
    {
      id: "odak", title: "Odak", app: "Focus Orbit", appId: "focus-orbit", color: 2, icon: P.focus,
      render: (rich) =>
        `<div class="wdg-tiles">${activityTile('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>', "Derin çalışma", "25 dk × 4", 72, '<span class="pl-badge pl-badge--accent">Bugün</span>')}${rich ? activityTile('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>', "Mola", "5 dk × 4", 50, '<span class="pl-badge">Bugün</span>') : ""}</div>`,
    },
    {
      id: "ozet", title: "Haftalık özet", app: "Tüm uygulamalar", appId: "", color: 1, icon: P.feed, always: true,
      render: () =>
        `<div class="pl-bigstats"><div class="pl-bigstat"><span class="pl-bigstat__val">${ico(P.code)}1.284</span><span class="pl-bigstat__lbl">Kod</span></div><div class="pl-bigstat"><span class="pl-bigstat__val">${ico(P.tag)}7</span><span class="pl-bigstat__lbl">Fiyat düşüşü</span></div><div class="pl-bigstat"><span class="pl-bigstat__val">${ico(P.focus)}12</span><span class="pl-bigstat__lbl">Odak seansı</span></div></div>`,
    },
    {
      id: "kisi", title: "Takipteki kişi", app: "Mind Palace", appId: "mind-palace", color: 3, icon: P.note,
      render: (rich) =>
        `<div class="pl-contact"><div class="pl-contact__head"><span class="pl-contact__photo">EK</span><div style="flex:1;min-width:0"><h3 class="pl-contact__name">Elif Kaya</h3><div class="pl-row"><span class="pl-badge pl-badge--accent">Müşteri</span><span class="pl-badge">İzmir</span></div></div><div class="pl-contact__actions"><button class="pl-iconbtn pl-iconbtn--outline" aria-label="Ara">${ico('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>')}</button><button class="pl-iconbtn pl-iconbtn--outline" aria-label="E-posta">${ico('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>')}</button></div></div>${rich ? `<div class="wdg-lines" style="margin-top:12px">${row("Son görüşme", "28.10.2026")}${row("Sonraki adım", "Teklif")}</div>` : ""}</div>`,
    },
    {
      id: "hesap", title: "Değerleme hesaplayıcı", app: "Finansal Asistan", appId: "finansal-asistan", color: 4, icon: P.wallet,
      render: () => {
        const r = calcCompute(4250000, 40, 120, 2.79);
        return `<div class="pl-calc"><span class="pl-label">Konut kredisi · örnek</span><div class="pl-calc__grid"><div>Fiyat<b>${tl(4250000)}</b></div><div>Vade<b>120 ay</b></div><div>Aylık oran<b>%2,79</b></div></div><label class="pl-stack" style="gap:6px"><span class="pl-muted">Peşinat <b data-pesin-lbl>%40</b></span><input class="pl-slider" type="range" min="10" max="80" step="5" value="40" data-calc aria-valuetext="%40" aria-label="Peşinat oranı"></label><div class="pl-calc__result"><div><span class="pl-muted">Peşinat</span><b data-down>${tl(r.down)}</b></div><div><span class="pl-muted">Aylık tahmini</span><b style="color:var(--pl-accent)" data-monthly>${tl(r.monthly)}</b></div></div></div>`;
      },
    },
    {
      id: "ev", title: "Akıllı ev", app: "Flow Dock", appId: "flow-dock", color: 5, icon: P.feed,
      render: (rich) =>
        `<div class="pl-stack" style="gap:8px"><label class="pl-devtile is-on"><span class="pl-devtile__ic">${ico('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>')}</span><span><span class="pl-devtile__name">Aydınlatma</span><br><span class="pl-devtile__sub">Salon · %70</span></span><span class="pl-switch"><input type="checkbox" role="switch" checked aria-label="Aydınlatma"></span></label>${rich ? `<label class="pl-devtile"><span class="pl-devtile__ic">${ico('<rect x="2" y="7" width="20" height="13" rx="2"/><path d="m17 2-5 5-5-5"/>')}</span><span><span class="pl-devtile__name">Akıllı TV</span><br><span class="pl-devtile__sub">Salon · Kapalı</span></span><span class="pl-switch"><input type="checkbox" role="switch" aria-label="Akıllı TV"></span></label>` : ""}</div>${climate([['<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>', "21°C", "İç sıcaklık 21 derece"], ['<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/>', "%48", "Nem yüzde 48"]])}`,
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
    const rich = installed || w.live || w.always || !!(w.channel && chan(st, w.channel));
    const ch = w.channel ? chan(st, w.channel) : null;
    const isLive = w.live || !!ch || (w.id === "akis" && (st.channels || []).some((c) => /\.feed$/.test(c.channel)));
    const badges = ch
      ? `<span class="pl-badge pl-badge--success" title="${esc(w.channel, 80)}">Canlı · ${esc(ch.owner, 24)}</span>`
      : isLive
      ? '<span class="pl-badge pl-badge--success">Canlı</span>'
      : `<span class="pl-badge">Örnek veri</span>${installed ? '<span class="pl-badge pl-badge--success">Yüklü</span>' : ""}`;
    return `<section class="card wdg${w.wide || installed ? " is-wide" : ""}" data-w="${w.id}" style="--c:var(--pl-viz-${w.color})"><header class="wdg-head"><span class="wdg-ic">${ico(w.icon)}</span><div class="wdg-title"><h3>${w.title}</h3><small class="pl-muted">${w.app}</small></div><div class="wdg-badges">${badges}</div></header><div class="wdg-body">${w.render(rich, st)}</div></section>`;
  }

  window.plWidgets = { registry, layout, render };
})();
