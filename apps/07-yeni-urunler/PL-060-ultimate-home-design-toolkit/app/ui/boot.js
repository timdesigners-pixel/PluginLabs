/* Önce dil dosyası yüklenir, sonra arayüz başlar (modül düzeyindeki metinler de çevrilmiş olur). */
import { init, apply } from "./i18n.js";

await init();
apply(document);
await import("./app.js");
