// Palet ve mod tercihi: <head> içinde yüklenir, ilk boyamadan önce uygulanır.
(() => {
  const KEY = "pluginlabs.theme",
    palettes = ["hub-yesil", "iris"],
    modes = ["dark", "light"],
    fallback = { palette: "hub-yesil", mode: "dark" };
  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "{}");
      return {
        palette: palettes.includes(v.palette) ? v.palette : fallback.palette,
        mode: modes.includes(v.mode) ? v.mode : fallback.mode,
      };
    } catch {
      return { ...fallback };
    }
  }
  function apply(t) {
    document.documentElement.dataset.palette = t.palette;
    document.documentElement.dataset.mode = t.mode;
  }
  window.plTheme = {
    palettes,
    modes,
    get: read,
    set(patch) {
      const t = { ...read(), ...patch };
      if (!palettes.includes(t.palette) || !modes.includes(t.mode)) return read();
      try {
        localStorage.setItem(KEY, JSON.stringify(t));
      } catch {}
      apply(t);
      return t;
    },
  };
  apply(read());
})();
