/* PluginLabs Web — ortak davranışlar: komut paleti, mobil menü, kopyalama,
   kod sekmeleri, bölüm takibi, istatistikler ve ürün kataloğu. */
(function () {
  "use strict";
  var VERI = window.PL_VERI || { istatistik: {}, urunler: [], kategoriler: [], platformAdi: {} };
  var SITE = window.PL_SITE || { komutlar: [] };
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };
  var sayi = new Intl.NumberFormat("tr-TR");

  function el(etiket, ozellik, cocuklar) {
    var d = document.createElement(etiket);
    if (ozellik) Object.keys(ozellik).forEach(function (k) {
      if (k === "text") d.textContent = ozellik[k];
      else if (k === "class") d.className = ozellik[k];
      else d.setAttribute(k, ozellik[k]);
    });
    (cocuklar || []).forEach(function (c) { if (c) d.appendChild(c); });
    return d;
  }
  function kucult(s) { return String(s || "").toLocaleLowerCase("tr-TR"); }

  /* ---------- Toast ---------- */
  var toastZaman;
  function toast(metin) {
    var t = $("#pl-toast");
    if (!t) {
      t = el("div", { id: "pl-toast", class: "pl-toast pl-site-toast", role: "status", "aria-live": "polite" });
      document.body.appendChild(t);
    }
    t.textContent = metin;
    t.hidden = false;
    clearTimeout(toastZaman);
    toastZaman = setTimeout(function () { t.hidden = true; }, 2200);
  }

  /* ---------- Mobil menü ---------- */
  $$("[data-pl-menu]").forEach(function (b) {
    var hedef = document.getElementById(b.getAttribute("aria-controls"));
    if (!hedef) return;
    b.addEventListener("click", function () {
      var acik = hedef.classList.toggle("is-open");
      b.setAttribute("aria-expanded", acik ? "true" : "false");
    });
    hedef.addEventListener("click", function (e) {
      if (e.target.closest("a")) { hedef.classList.remove("is-open"); b.setAttribute("aria-expanded", "false"); }
    });
  });

  /* ---------- Kopyalama ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pl-copy]");
    if (!b) return;
    var kaynak = b.getAttribute("data-pl-copy");
    var metin = kaynak ? kaynak : (b.closest(".pl-code") && b.closest(".pl-code").querySelector("pre:not([hidden])") || {}).textContent;
    if (!metin) return;
    (navigator.clipboard ? navigator.clipboard.writeText(metin) : Promise.reject())
      .then(function () { toast("Panoya kopyalandı"); })
      .catch(function () { toast("Kopyalanamadı. Metni seçip Ctrl+C ile kopyala."); });
  });

  /* ---------- Kod sekmeleri ---------- */
  $$(".pl-site-codetabs").forEach(function (kutu) {
    var sekmeler = $$('[role="tab"]', kutu);
    function sec(i, odak) {
      sekmeler.forEach(function (s, j) {
        var aktif = i === j;
        s.classList.toggle("is-active", aktif);
        s.setAttribute("aria-selected", aktif ? "true" : "false");
        s.tabIndex = aktif ? 0 : -1;
        var panel = document.getElementById(s.getAttribute("aria-controls"));
        if (panel) panel.hidden = !aktif;
        if (aktif && odak) s.focus();
      });
    }
    sekmeler.forEach(function (s, i) {
      s.addEventListener("click", function () { sec(i); });
      s.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); sec((i + 1) % sekmeler.length, true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); sec((i - 1 + sekmeler.length) % sekmeler.length, true); }
      });
    });
  });

  /* ---------- Bölüm takibi ---------- */
  var takipLinkleri = $$("[data-pl-spy] a[href^='#']");
  if (takipLinkleri.length && "IntersectionObserver" in window) {
    var harita = {};
    takipLinkleri.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      (harita[id] = harita[id] || []).push(a);
    });
    var gozlemci = new IntersectionObserver(function (girdiler) {
      girdiler.forEach(function (g) {
        if (!g.isIntersecting) return;
        takipLinkleri.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
        (harita[g.target.id] || []).forEach(function (a) { a.classList.add("is-active"); a.setAttribute("aria-current", "location"); });
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(harita).forEach(function (id) { var h = document.getElementById(id); if (h) gozlemci.observe(h); });
  }

  /* ---------- İstatistikler ---------- */
  $$("[data-pl-stat]").forEach(function (n) {
    var v = VERI.istatistik[n.getAttribute("data-pl-stat")];
    if (typeof v === "number") n.textContent = sayi.format(v);
  });

  /* ---------- Ürün kartı ---------- */
  function urunKarti(u) {
    var ico = el("span", { class: "pl-site-prod__ico", "aria-hidden": "true", text: u.harf });
    var kart = el("article", { class: "pl-site-prod", "aria-label": u.ad });
    if (u.urun) kart.setAttribute("data-pl-product", u.urun);
    else kart.setAttribute("style", "--pl-accent: var(--pl-viz-" + u.renk + ")");
    var govde = el("div", { style: "min-width:0" }, [
      el("h3", { class: "pl-site-prod__name", text: u.ad }),
      el("p", { class: "pl-site-prod__sub", text: u.ozet }),
    ]);
    var alt = el("div", { class: "pl-site-prod__foot" });
    if (u.hub === "uygulama") alt.appendChild(el("span", { class: "pl-badge pl-badge--success", text: "Hub'dan kur" }));
    else if (u.hub === "onizleme") alt.appendChild(el("span", { class: "pl-badge pl-badge--info", text: "Önizleme" }));
    u.platformlar.forEach(function (p) { alt.appendChild(el("span", { class: "pl-badge", text: VERI.platformAdi[p] || p })); });
    alt.appendChild(el("span", { class: "pl-site-prod__ver", text: u.surum ? "v" + u.surum : "Planlandı" }));
    [ico, govde, el("span", { class: "pl-site-prod__no", text: String(u.no).padStart(2, "0") }), alt].forEach(function (c) { kart.appendChild(c); });
    return kart;
  }

  var izgara = $("#pl-urunler");
  if (izgara) {
    var durum = { kategori: "hepsi", ara: "", tumu: false };
    var LIMIT = Number(izgara.getAttribute("data-limit") || 12);
    var filtre = $("#pl-urun-filtre");
    var sayac = $("#pl-urun-sayac");
    var dugme = $("#pl-urun-tumu");

    if (filtre) {
      var cipler = [{ id: "hepsi", ad: "Tümü" }].concat(VERI.kategoriler);
      cipler.forEach(function (k) {
        var c = el("button", { type: "button", class: "pl-chip", "aria-pressed": k.id === "hepsi" ? "true" : "false", "data-kategori": k.id, text: k.ad });
        filtre.insertBefore(c, filtre.querySelector(".pl-inputwrap"));
      });
      filtre.addEventListener("click", function (e) {
        var c = e.target.closest("[data-kategori]");
        if (!c) return;
        durum.kategori = c.getAttribute("data-kategori");
        $$("[data-kategori]", filtre).forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
        ciz();
      });
      var giris = $("input", filtre);
      if (giris) giris.addEventListener("input", function () { durum.ara = kucult(giris.value.trim()); ciz(); });
    }
    if (dugme) dugme.addEventListener("click", function () { durum.tumu = !durum.tumu; ciz(); });

    function ciz() {
      var liste = VERI.urunler.filter(function (u) {
        if (durum.kategori !== "hepsi" && u.kategori !== durum.kategori) return false;
        if (durum.ara && kucult(u.ad + " " + u.ozet + " " + u.id).indexOf(durum.ara) < 0) return false;
        return true;
      });
      var gosterilen = durum.tumu || durum.ara || durum.kategori !== "hepsi" ? liste : liste.slice(0, LIMIT);
      izgara.textContent = "";
      if (!liste.length) {
        izgara.appendChild(el("div", { class: "pl-empty pl-site-empty" }, [
          el("b", { text: "Eşleşen ürün yok" }),
          el("p", { class: "pl-muted", text: "Farklı bir ad dene ya da kategori filtresini kaldır." }),
        ]));
      }
      gosterilen.forEach(function (u) { izgara.appendChild(urunKarti(u)); });
      if (sayac) sayac.textContent = sayi.format(liste.length) + " ürün";
      if (dugme) {
        dugme.hidden = gosterilen.length === liste.length && !durum.tumu;
        dugme.firstChild.nodeValue = durum.tumu ? "Daha az göster " : "Tüm ürünleri göster ";
      }
    }
    ciz();
  }

  /* ---------- Komut paleti (Ctrl/⌘ + K) ---------- */
  var dlg = $("#pl-cmdk");
  if (dlg) {
    var giris2 = $("input", dlg);
    var liste2 = $(".pl-cmdk__list", dlg);
    var secili = 0;
    var ogeler = [];

    function kaynak() {
      var bolumler = $$("[data-pl-cmd]").map(function (n) {
        return { grup: "Bu sayfada", ad: n.getAttribute("data-pl-cmd"), url: "#" + n.id, ipucu: "Bölüm" };
      });
      var urunler = VERI.urunler.map(function (u) {
        return { grup: "Ürünler", ad: u.ad, url: SITE.urunUrl ? SITE.urunUrl(u) : "https://getpluginlabs.com/#urunler", ipucu: u.id };
      });
      return bolumler.concat(SITE.komutlar || [], urunler);
    }
    var tumu = kaynak();

    function ciz2() {
      var q = kucult(giris2.value.trim());
      ogeler = tumu.filter(function (o) { return !q || kucult(o.ad + " " + (o.ipucu || "") + " " + o.grup).indexOf(q) >= 0; }).slice(0, 40);
      liste2.textContent = "";
      if (!ogeler.length) {
        liste2.appendChild(el("div", { class: "pl-empty" }, [el("b", { text: "Sonuç yok" }), el("p", { class: "pl-muted", text: "Başka bir kelime dene." })]));
        giris2.removeAttribute("aria-activedescendant");
        return;
      }
      secili = Math.min(secili, ogeler.length - 1);
      var sonGrup = null;
      ogeler.forEach(function (o, i) {
        if (o.grup !== sonGrup) {
          liste2.appendChild(el("div", { class: "pl-cmdk__group pl-label", role: "presentation", text: o.grup }));
          sonGrup = o.grup;
        }
        var a = el("a", { class: "pl-menuitem", href: o.url, role: "option", id: "pl-cmd-" + i, "aria-selected": i === secili ? "true" : "false", tabindex: "-1" }, [
          document.createTextNode(o.ad),
          o.ipucu ? el("span", { class: "pl-menuitem__meta", text: o.ipucu }) : null,
        ]);
        if (/^https?:/.test(o.url) && o.url.indexOf(location.host) < 0) a.setAttribute("rel", "noopener");
        a.addEventListener("mousemove", function () { if (secili !== i) { secili = i; isaretle(); } });
        a.addEventListener("click", function () { dlg.close(); });
        liste2.appendChild(a);
      });
      isaretle();
    }
    function isaretle() {
      $$('[role="option"]', liste2).forEach(function (a, i) { a.setAttribute("aria-selected", i === secili ? "true" : "false"); });
      var aktif = document.getElementById("pl-cmd-" + secili);
      if (aktif) { giris2.setAttribute("aria-activedescendant", aktif.id); aktif.scrollIntoView({ block: "nearest" }); }
    }
    function ac() {
      if (dlg.open) return;
      giris2.value = "";
      secili = 0;
      ciz2();
      dlg.showModal();
      giris2.focus();
    }
    giris2.addEventListener("input", function () { secili = 0; ciz2(); });
    giris2.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); secili = (secili + 1) % Math.max(ogeler.length, 1); isaretle(); }
      if (e.key === "ArrowUp") { e.preventDefault(); secili = (secili - 1 + ogeler.length) % Math.max(ogeler.length, 1); isaretle(); }
      if (e.key === "Enter" && ogeler[secili]) { e.preventDefault(); var h = document.getElementById("pl-cmd-" + secili); dlg.close(); if (h) h.click(); }
    });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    $$("[data-pl-open-cmdk]").forEach(function (b) { b.addEventListener("click", ac); });
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); dlg.open ? dlg.close() : ac(); }
    });
  }
})();
