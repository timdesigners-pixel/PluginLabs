/* Bırakma kutusu: her zaman üstte, sürüklenebilir küçük pencere. Bırakılan dosyaların yolunu ana sürece verir; dosya okumaz/yazmaz.
 * "Hemen dönüştür" açıksa ana pencere geçerli ayarlarla dönüştürür; kapalıysa dosyalar yalnız kuyruğa eklenir. */
(function () {
  const C = window.QCCore, D = window.qcDesktop;
  const $ = (id) => document.getElementById(id);
  let s = null;
  function render() {
    if (!s) return;
    const im = s.settings.image, tx = s.settings.text;
    $("preset").textContent = (im.format === "same" ? "Aynı biçim" : C.describeImage(im)) + " · metin → " + C.ENCODINGS[tx.to].label.split(" (")[0];
    const ready = s.items.filter((x) => x.status === "ready").length, done = s.items.filter((x) => x.status === "done").length, bad = s.items.filter((x) => x.status === "error" || x.status === "blocked").length;
    $("status").textContent = s.items.length ? done + " dönüştürüldü" + (ready ? " · " + ready + " bekliyor" : "") + (bad ? " · " + bad + " sorunlu" : "") : s.settings.dropAutorun ? "Bıraktığınız an dönüştürülür." : "Bırakılanlar kuyruğa eklenir.";
  }
  const zone = $("zone");
  for (const t of ["dragenter", "dragover"]) document.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add("is-dragover"); });
  document.addEventListener("dragleave", (e) => { if (!e.relatedTarget) zone.classList.remove("is-dragover"); });
  document.addEventListener("drop", async (e) => {
    e.preventDefault();
    zone.classList.remove("is-dragover");
    const paths = D.pathsFor(e.dataTransfer ? e.dataTransfer.files : []);
    if (!paths.length) return;
    try { const r = await D.dropAdd(paths); if (!r.autorun) $("status").textContent = r.added.length + " dosya kuyruğa eklendi."; } catch (err) { $("status").textContent = String(err && err.message || err).replace(/^Error invoking remote method '[^']+': (Error: )?/, ""); }
  });
  $("openMain").addEventListener("click", () => D.showMain());
  $("hide").addEventListener("click", () => D.showDrop(false));
  D.onState((x) => { s = x; render(); });
  D.state().then((x) => { s = x; render(); document.documentElement.dataset.ready = "1"; });
})();
