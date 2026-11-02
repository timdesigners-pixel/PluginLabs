/* File Pilot — doğrulama ölçütü kıyaslaması (Notion: "1000 belgede bilinen dosyayı ilk 5 sonuçta bulma ≥%90; p95 sorgu ≤1 sn").
 * Belirleyici (tohumlu) sentetik derlem: 1000 Türkçe iş belgesi (konu sözcükleri + ekli biçimler + kişi/şehir/sayı), dosya adları ve klasörler.
 * Sorgular kullanıcının hatırladığı 2 sözcüğü taklit eder; üç tür: (1) aynı biçim, (2) eksiz kök ("faturalar" yerine "fatura"),
 * (3) aksansız yazım ("ödeme" yerine "odeme") ya da dosya adındaki bir sözcük + içerikten bir sözcük.
 * Sentetik veridir; gerçek kullanıcı klasörlerindeki başarıyı garanti etmez (README'de ayrıca belirtilir). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./core.js"));
  else root.FPBench = factory(root.FPCore);
})(typeof self !== "undefined" ? self : this, function (C) {
  "use strict";
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  const TOPICS = {
    fatura: ["fatura", "ödeme", "tutar", "vergi", "kdv", "tahsilat", "borç", "hesap", "banka", "havale", "makbuz", "indirim", "taksit", "bakiye", "fiyat"],
    toplanti: ["toplantı", "gündem", "karar", "katılımcı", "sunum", "hedef", "takvim", "görev", "rapor", "proje", "sorumlu", "erteleme", "özet", "öneri", "sonuç"],
    saglik: ["randevu", "doktor", "tahlil", "reçete", "ilaç", "hastane", "muayene", "sigorta", "rapor", "tansiyon", "aşı", "kontrol", "eczane", "tedavi", "sonuç"],
    seyahat: ["bilet", "otel", "rezervasyon", "uçuş", "pasaport", "vize", "bavul", "rota", "transfer", "konaklama", "müze", "harita", "liman", "tren", "kiralama"],
    ev: ["kira", "aidat", "tadilat", "boya", "mobilya", "elektrik", "doğalgaz", "su", "sözleşme", "depozito", "taşınma", "anahtar", "komşu", "tesisat", "perde"],
    egitim: ["ders", "sınav", "ödev", "kurs", "sertifika", "not", "dönem", "kayıt", "öğretmen", "kitap", "konu", "çalışma", "proje", "burs", "mezuniyet"],
    yazilim: ["sunucu", "hata", "sürüm", "yedek", "veritabanı", "kullanıcı", "parola", "dağıtım", "test", "günlük", "bağlantı", "önbellek", "sorgu", "yapılandırma", "güncelleme"],
    araba: ["muayene", "lastik", "sigorta", "kasko", "servis", "yağ", "fren", "plaka", "ruhsat", "yakıt", "otopark", "ceza", "bakım", "akü", "kaza"],
  };
  // Belgeye özgü ayrıntılar (gerçek belgelerde kullanıcının hatırladığı somut şeyler): ~180 ad.
  const NOUNS = ("kombi klima buzdolabı çamaşır bulaşık fırın televizyon bilgisayar yazıcı modem telefon tablet kulaklık kamera saat bisiklet motosiklet " +
    "kamyonet minibüs tekne karavan çadır uyku matara termos çanta valiz cüzdan anahtarlık gözlük ayakkabı mont kaban gömlek kravat elbise " +
    "düğün nişan doğum mezuniyet emeklilik taşınma bayram tatil kamp festival konser tiyatro sergi fuar maraton turnuva kongre seminer çalıştay " +
    "zeytin fındık kayısı incir üzüm portakal limon mandalina çilek kiraz elma armut ceviz badem fıstık bal peynir zeytinyağı " +
    "inşaat çatı balkon bahçe havuz garaj bodrum asansör merdiven pencere kapı parke seramik mutfak banyo duvar kiler " +
    "laboratuvar kütüphane atölye stüdyo depo fabrika şantiye ofis mağaza şube kafe restoran pastane fırıncı kuaför terzi " +
    "dişçi veteriner fizyoterapi diyetisyen psikolog eczacı avukat noter muhasebeci mimar mühendis tesisatçı elektrikçi marangoz boyacı nakliyeci " +
    "jeneratör kompresör matkap testere vinç forklift traktör pompa vana kazan radyatör şofben termostat sigorta pano kablo priz " +
    "kedi köpek kuş akvaryum papağan tavşan hamster at " +
    "lisans abonelik üyelik garanti iade değişim kargo teslimat sipariş tedarikçi bayi distribütör ihracat ithalat gümrük konşimento").split(" ");
  const SUFFIX = ["", "", "", "lar", "ler", "ları", "leri", "ı", "i", "da", "de", "ın", "in", "a", "e"];
  const FIRST = ["Ayşe", "Mehmet", "Zeynep", "Mustafa", "Elif", "Ahmet", "Selin", "Emre", "Deniz", "Burak", "Gizem", "Murat", "Ece", "Can", "Derya", "Okan", "Şule", "İlker", "Gül", "Çağrı"];
  const LAST = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Aydın", "Öztürk", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Koç", "Kurt", "Özdemir"];
  const CITY = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Eskişehir", "Trabzon", "Konya", "Gaziantep", "Muğla", "Sakarya", "Kayseri"];
  const FILLER = ["ile ilgili", "için", "hakkında", "konusunda", "nedeniyle", "sonrasında", "öncesinde", "kapsamında", "olarak", "ve", "ancak", "bu yüzden", "ayrıca"];
  const STRIP = (s) => C.fold(s); // aksansız yazım (kullanıcı "odeme" yazar)

  function corpus(n, seed) {
    const r = rng(seed || 2025);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const topics = Object.keys(TOPICS);
    const docs = [];
    for (let i = 0; i < (n || 1000); i++) {
      const topic = topics[i % topics.length];
      const words = TOPICS[topic];
      // Bu belgeye özgü: 3 "imza" sözcüğü (konudan) + kişi + şehir + sayı; çevresinde başka konulardan gürültü.
      const sig = [];
      while (sig.length < 3) { const w = sig.length === 0 ? pick(words) : pick(NOUNS); if (!sig.includes(w)) sig.push(w); }
      const person = pick(FIRST) + " " + pick(LAST);
      const city = pick(CITY);
      const num = String(1000 + Math.floor(r() * 899000));
      const lines = [];
      const lc = 4 + Math.floor(r() * 10);
      for (let l = 0; l < lc; l++) {
        const parts = [];
        const len = 6 + Math.floor(r() * 10);
        for (let k = 0; k < len; k++) {
          const roll = r();
          if (roll < 0.18) parts.push(pick(sig) + pick(SUFFIX));
          else if (roll < 0.45) parts.push(pick(words) + pick(SUFFIX));
          else if (roll < 0.62) parts.push(pick(TOPICS[pick(topics)]) + pick(SUFFIX));
          else parts.push(pick(FILLER));
        }
        if (l === 1) parts.splice(2, 0, person);
        if (l === 2) parts.splice(1, 0, city, num);
        lines.push(parts.join(" ") + ".");
      }
      const ext = pick(["txt", "md", "txt", "csv", "log"]);
      const name = topic + "-" + sig[0] + "-" + (i + 1) + "." + ext;
      const rel = topic + "/" + (2024 + (i % 3)) + "/" + name;
      docs.push({ id: "b" + i, path: "/derlem/" + rel, rel, root: "/derlem", name, ext, size: 0, mtime: 1700000000000 + i * 1000, text: lines.join("\n"), tags: [], _sig: sig, _person: person, _city: city, _topic: topic });
    }
    return docs;
  }

  /** Sorgu üretimi: kullanıcının hatırladığı "belgenin konusu" — hedef belgede en ağırlıklı (belgede sık × derlemde seyrek) iki KÖK sözcük.
   * Kök düzeyinde sayılır (ekli biçimler köke bağlanır); sorgu biçimi türe göre değişir. */
  function queries(docs, count, seed) {
    const r = rng((seed || 7) + 1);
    const roots = [...new Set(Object.values(TOPICS).flat().concat(NOUNS))].map((w) => C.fold(w)).sort((a, b) => b.length - a.length);
    const rootOf = (t) => roots.find((x) => t.startsWith(x)) || null;
    const per = docs.map((d) => {
      const m = new Map(); // kök → { n, forms: Map(özgün biçim → sayı) }
      for (const w of d.text.split(/[^\p{L}\p{N}]+/u)) {
        const f = C.fold(w);
        const k = f.length >= 2 ? rootOf(f) : null;
        if (!k) continue;
        let e = m.get(k);
        if (!e) m.set(k, (e = { n: 0, forms: new Map() }));
        e.n++;
        e.forms.set(w, (e.forms.get(w) || 0) + 1);
      }
      return m;
    });
    const df = new Map();
    for (const m of per) for (const k of m.keys()) df.set(k, (df.get(k) || 0) + 1);
    const out = [];
    for (let k = 0; k < (count || 200); k++) {
      const i = Math.floor(r() * docs.length);
      const d = docs[i], m = per[i];
      const ranked = [...m].map(([root, e]) => [root, e, e.n * Math.log(docs.length / df.get(root))]).sort((a, b) => b[2] - a[2]);
      const [ra, ea] = ranked[0], [rb, eb] = ranked[1];
      const form = (e) => [...e.forms].sort((x, y) => y[1] - x[1])[0][0];
      const orig = (root) => TOPICS[d._topic].concat(...Object.values(TOPICS), NOUNS).find((w) => C.fold(w) === root) || root;
      const kind = k % 3;
      let q;
      if (kind === 0) q = form(ea) + " " + form(eb); // belgede geçtiği biçimiyle
      else if (kind === 1) q = orig(ra) + " " + orig(rb); // eksiz kök (aksanlı)
      else q = r() < 0.5 ? STRIP(d._person) + " " + STRIP(ra) : STRIP(rb) + " " + STRIP(d._city); // aksansız + kişi/şehir
      out.push({ q, target: d.id, kind });
    }
    return out;
  }

  /** Kıyaslamayı çalıştırır; now: ms döndüren saat (performance.now). */
  function run(opts) {
    const o = opts || {};
    const now = o.now || (() => Date.now());
    const t0 = now();
    const docs = corpus(o.docs || 1000, o.seed);
    const index = C.buildIndex(docs);
    const buildMs = now() - t0;
    const qs = queries(docs, o.queries || 300, o.seed);
    const times = [];
    let hit = 0;
    const byKind = [0, 0, 0], kindN = [0, 0, 0];
    const misses = [];
    for (const x of qs) {
      const s = now();
      const res = C.search(index, x.q, { limit: 5 });
      times.push(now() - s);
      const ok = res.results.slice(0, 5).some((y) => y.id === x.target);
      kindN[x.kind]++;
      if (ok) { hit++; byKind[x.kind]++; } else if (misses.length < 10) misses.push(x.q);
    }
    times.sort((a, b) => a - b);
    const p95 = times[Math.min(times.length - 1, Math.floor(times.length * 0.95))];
    const top5 = Math.round((hit / qs.length) * 10000) / 100;
    return {
      docs: docs.length, queries: qs.length, top5, p95Ms: Math.round(p95 * 100) / 100, maxMs: Math.round(times[times.length - 1] * 100) / 100, buildMs: Math.round(buildMs),
      byKind: { aynıBiçim: pct(byKind[0], kindN[0]), eksizKök: pct(byKind[1], kindN[1]), aksansızVeAd: pct(byKind[2], kindN[2]) },
      threshold: { top5: 90, p95Ms: 1000 }, ok: top5 >= 90 && p95 <= 1000, misses,
    };
  }
  const pct = (a, b) => (b ? Math.round((a / b) * 10000) / 100 : 0);
  return { corpus, queries, run };
});
