const gh = (repo, tag, file) =>
  `https://github.com/${repo}/releases/download/${tag}/${file}`;
// Uygulama depoları özeldir; Windows sürüm dosyaları herkese açık dağıtım deposundan `<id>-v<sürüm>` etiketiyle indirilir.
const DIST = "timdesigners-pixel/pluginlabs-dagitim";
const dist = (id, version, file) => gh(DIST, `${id}-v${version}`, file);
const catalog = [
  {
    id: "mind-palace",
    name: "Mind Palace",
    kind: "app",
    version: "1.11.1",
    description:
      "Notları, görevleri ve finans kayıtlarını tek bir kişisel çalışma alanında düzenler.",
    platform: "win32",
    format: "exe",
    file: "MindPalace.exe",
    size: 81538828,
    sha256: "c1a81d702e52d85666c13624d016a41fbbc7b8484eadf1c260d33b1328007573",
    url: dist("mind-palace", "1.11.1", "Mind-Palace-Tasinabilir-1.11.1-x64.exe"),
    distAsset: "Tasinabilir.*x64\\.exe$",
    repo: "timdesigners-pixel/mind-palace",
  },
  {
    id: "leo-helper",
    name: "Leo Helper",
    kind: "app",
    version: "0.9.2",
    description:
      "Telegram kod takibi ve gömülü kod tarayıcısı: hazır oturum, makro ile öğretme, kod sayfasını bulma, 5 hedefe aynı anda otomatik kod girişi, kod takibi (uygunluk, sınıf, şartlar), sonuç algılama, deneme listesi ve şartlarıyla alınan kodlar; MyMind.",
    platform: "win32",
    format: "exe",
    file: "LeoHelper.exe",
    size: 8282112,
    sha256: "ab500bfefe736dbc53be1f38ee14066b08e712009360a9abfddb1005f5f7cb18",
    url: dist("leo-helper", "0.9.2", "LeoHelper.exe"),
    distAsset: "^LeoHelper\\.exe$",
    repo: "timdesigners-pixel/leo-helper",
  },
  {
    id: "pluginlabs-scrapper",
    name: "PluginLabs Scrapper",
    kind: "app",
    version: "0.7.0",
    description:
      "Gömülü tarayıcıyla web veri kazıma: Alışveriş bölümü, Veri Kazıma Stüdyosu (dönüşüm kuralları; CSV/JSON/XLSX/SQLite), şifreli Site Rehberi, oturum, akıllı seçici, RSS/WordPress kaynakları, Ctrl+K komut paleti, sayfalama, zamanlanmış görevler; MyWishlist ve Bahis Dünyası aktarımı; ürün arşivi ve MyMind.",
    platform: "win32",
    format: "exe",
    file: "PluginLabsScrapper.exe",
    size: 81206868,
    sha256: "01e28d5da4608d9a7d60f2732d81dad1d4fb9b4cf09b71554e096b629725e93d",
    url: dist(
      "pluginlabs-scrapper",
      "0.7.0",
      "PluginLabs-Scrapper-0.7.0-Windows-Portable-x64.exe",
    ),
    distAsset: "Windows-Portable-x64\\.exe$",
    repo: "timdesigners-pixel/the-ultimate-scrapper",
  },
  {
    id: "mymind-ai",
    name: "MyMind AI",
    kind: "app",
    version: "0.1.0",
    description:
      "PluginLabs ortak yerel yapay zekâsı: Hub MyMind Lite, LM Studio veya Ollama ile sohbet; ürünlerin MyMind işleri için 13 doğrulanmış görev şablonu, taslaklar; Chrome eklentisi ve uygulamalar için onaylı yerel köprü. Yalnız bu cihazdaki modeller.",
    platform: "win32",
    format: "exe",
    file: "MyMindAI.exe",
    size: 4033024,
    sha256: "7bb058c56f5da974360bbd994a80eef8058906f8b85345b5328af92032d135d1",
    url: dist("mymind-ai", "0.1.0", "MyMindAI-0.1.0-portable.exe"),
    distAsset: "^MyMindAI-[0-9.]+-portable\.exe$",
    repo: "timdesigners-pixel/mymind-ai",
  },
  {
    id: "finansal-asistan",
    name: "Finansal Asistan",
    kind: "app",
    version: "0.1.0",
    description:
      "Gelir, gider ve taksitleri kaydeder; CSV mutabakatı, nakit takvimi ve vade hatırlatıcıları sunar.",
    platform: "win32",
    format: "exe",
    file: "FinansalAsistan.exe",
    size: 81001971,
    sha256: "a734fb2350b243a716d2851cff20cd41c3e24ff756e7bc4bc275aaf7998834ab",
    url: dist(
      "finansal-asistan",
      "0.1.0",
      "FinansalAsistan-0.1.0-Windows-Portable-x64.exe",
    ),
    distAsset: "Windows-Portable-x64\\.exe$",
    repo: "timdesigners-pixel/finansal-asistan",
  },
  {
    id: "flow-dock",
    name: "Flow Dock",
    kind: "app",
    version: "0.1.0",
    description:
      "Uygulamaları, klasörleri ve bağlantıları arama, favoriler ve hızlı erişim halkası üzerinden açar.",
    platform: "win32",
    format: "exe",
    file: "FlowDock.exe",
    size: 209920,
    sha256: "7471d78e8bb84a4b7c8124740e3d14d10831c446a8aa7da6eff0a7dc4d39b579",
    url: dist("flow-dock", "0.1.0", "FlowDock-0.1.0-x64.exe"),
    distAsset: "^FlowDock-[0-9.]+-x64\\.exe$",
    repo: "timdesigners-pixel/flow-dock",
  },
  {
    id: "file-pilot",
    name: "File Pilot",
    kind: "app",
    version: "0.1.0",
    description:
      "Seçtiğiniz klasörlerde yerel dosya arama: ad, içerik ve etiket; Türkçe ek/aksan duyarsız, satır numaralı eşleşen bölüm, benzer belge; MyMind ile onaylı anlamsal soru. Dosyaları yalnız okur.",
    platform: "win32",
    format: "exe",
    file: "FilePilot.exe",
    size: 81528392,
    sha256: "7eb6e2ce829356582f0a6c5b800d50536dcd59128f9595f091ff12b0c2398a68",
    url: dist("file-pilot", "0.1.0", "FilePilot-0.1.0-Windows-Portable-x64.exe"),
    distAsset: "Windows-Portable-x64\\.exe$",
    // Ürün deposu henüz yok; kaynak PluginLabs ön geliştirme alanında.
    source: "https://github.com/timdesigners-pixel/PluginLabs/tree/main/apps/03-masaustu-dosya-araclari-ve-widgetlar/PL-025-file-pilot/app",
  },
  {
    id: "workspace-scenes",
    name: "Workspace Scenes",
    kind: "app",
    version: "0.1.0",
    description:
      "Uygulama, klasör, dosya ve bağlantıları kayıtlı çalışma sahneleriyle önizleyip onayınızla sırayla açar; hiçbir şeyi kapatmaz. Masaüstü kısayolu, kurulum süresi ölçümü, eksik araç önerisi ve MyMind (onaylı).",
    platform: "win32",
    format: "exe",
    file: "WorkspaceScenes.exe",
    size: 81517551,
    sha256: "c120a5703c61ed60d002d8279afec1d5baf2220f9eaa4da39b489f3d35bcc5a7",
    url: dist("workspace-scenes", "0.1.0", "WorkspaceScenes-0.1.0-Windows-Portable-x64.exe"),
    distAsset: "Windows-Portable-x64\\.exe$",
    // Ürün deposu henüz yok; kaynak PluginLabs ön geliştirme alanında.
    source: "https://github.com/timdesigners-pixel/PluginLabs/tree/main/apps/03-masaustu-dosya-araclari-ve-widgetlar/PL-026-workspace-scenes/app",
  },
  {
    id: "focus-orbit",
    name: "Focus Orbit",
    kind: "app",
    version: "0.1.0",
    description:
      "Tek görevli odak zamanlayıcısı: her zaman üstte, sürüklenebilir odak balonu, mola bildirimleri, dikkat listesi hatırlatması ve kesinti kaydı; haftalık ölçüler, MyMind ile onaylı görev parçalama ve seans özeti. Ekranı izlemez, hiçbir şeyi kapatmaz.",
    platform: "win32",
    format: "exe",
    file: "FocusOrbit.exe",
    size: 81528269,
    sha256: "6bb9bac5222b51b7f851d0b0e250f90c149a190e6d2416bb007455fe7df2238b",
    url: dist("focus-orbit", "0.1.0", "FocusOrbit-0.1.0-Windows-Portable-x64.exe"),
    distAsset: "Windows-Portable-x64\\.exe$",
    // Ürün deposu henüz yok; kaynak PluginLabs ön geliştirme alanında.
    source: "https://github.com/timdesigners-pixel/PluginLabs/tree/main/apps/03-masaustu-dosya-araclari-ve-widgetlar/PL-027-focus-orbit/app",
  },
  {
    id: "quick-convert",
    name: "Quick Convert",
    kind: "app",
    version: "0.1.0",
    description:
      "Sürükle-bırak dosya dönüştürücü: PNG, JPEG, WebP, GIF, BMP görüntülerini PNG/JPEG/WebP'ye (kalite, hedef KB, boyut; büyütmez), metni UTF-8/UTF-16/Windows-1254'e dönüştürür. Kaynak değişmez, sonuç yeni dosyaya yazılır ve doğrulanır; boyut ve kalite gösterilir. Her zaman üstte bırakma kutusu; MyMind ile onaylı ayar önerisi.",
    platform: "win32",
    format: "exe",
    file: "QuickConvert.exe",
    size: 81528927,
    sha256: "241d868f968a69c6f35fe44c15daffcef8702827773723e08ec5c06ae69896ed",
    url: dist("quick-convert", "0.1.0", "QuickConvert-0.1.0-Windows-Portable-x64.exe"),
    distAsset: "Windows-Portable-x64\\.exe$",
    // Ürün deposu henüz yok; kaynak PluginLabs ön geliştirme alanında.
    source: "https://github.com/timdesigners-pixel/PluginLabs/tree/main/apps/03-masaustu-dosya-araclari-ve-widgetlar/PL-028-quick-convert/app",
  },
  {
    id: "screenshot-studio",
    name: "Screenshot Studio",
    kind: "app",
    version: "0.1.0",
    description:
      "Bölge, ekran ya da pencere yakalar; ok, numara, metin, vurgu, kırpma ve pencere çerçevesiyle panoya kopyalar ya da kaydeder. Hassas alanları (e-posta, IBAN, kart, telefon, anahtar…) cihazda okuyup aday olarak işaretler; kabul ettiğiniz maskeler çıktıda piksel piksel doğrulanır. MyMind ile onaylı ek aday.",
    platform: "win32",
    format: "exe",
    file: "ScreenshotStudio.exe",
    size: 100884428,
    sha256: "1e4be055de5945e155ba5d5b5afa1fbf26ebf77181bf6f13c6756951fa8f2dd1",
    url: dist("screenshot-studio", "0.1.0", "ScreenshotStudio-0.1.0-Windows-Portable-x64.exe"),
    distAsset: "Windows-Portable-x64\\.exe$",
    // Ürün deposu henüz yok; kaynak PluginLabs ön geliştirme alanında.
    source: "https://github.com/timdesigners-pixel/PluginLabs/tree/main/apps/03-masaustu-dosya-araclari-ve-widgetlar/PL-029-screenshot-studio/app",
  },
  {
    id: "mutfak-atolyesi",
    name: "Mutfak Atölyesi",
    kind: "app",
    version: "0.4.1",
    description:
      "30 günlük menü, stok ve alışveriş listesi, tarifler, yaklaşık kalori, su ve sağlık günlüğü; çevrimdışı çalışır (WebView2 gerekir).",
    platform: "win32",
    format: "zip",
    file: "MutfakAtolyesi-Windows-x64.zip",
    launch: "content/MutfakAtolyesi.exe",
    size: 84327609,
    sha256: "0a3306b925c79b6d5eaabf96fa6035da24493346b4918bb1459b7496be71d78d",
    url: dist(
      "mutfak-atolyesi",
      "0.4.1",
      "MutfakAtolyesi-0.4.1-Windows-x64.zip",
    ),
    distAsset: "Windows-x64\\.zip$",
    repo: "timdesigners-pixel/mutfak-atolyesi",
  },
  {
    id: "llama-engine",
    name: "My Mind · Çalıştırma motoru",
    kind: "engine",
    version: "11669",
    description:
      "My Mind modellerini cihazın işlemcisinde çalıştıran yerel llama.cpp sunucusunu kurar.",
    variants: {
      linux: {
        format: "tar",
        file: "engine.tar.gz",
        size: 17851611,
        sha256:
          "cf07c1c112d709bd67e522017471de57ed0ec8bea031d732c5422351c07f65ac",
        url: gh(
          "ggml-org/llama.cpp",
          "b11669",
          "llama-b11669-bin-ubuntu-x64.tar.gz",
        ),
      },
      win32: {
        format: "zip",
        file: "engine.zip",
        size: 19537886,
        sha256:
          "37b3efcf962847ca869745fd4ccf7f5e7e8dacfeff9fa3523b4ca8cdc66d632b",
        url: gh(
          "ggml-org/llama.cpp",
          "b11669",
          "llama-b11669-bin-win-cpu-x64.zip",
        ),
      },
    },
  },
  {
    id: "mymind-lite",
    name: "My Mind Lite",
    kind: "model",
    version: "1.0.0",
    description:
      "Metinleri cihazınızda özetler, yeniden yazar ve sınıflandırır. Qwen3 0.6B Q8 · 640 MB · Apache 2.0.",
    format: "gguf",
    file: "Qwen3-0.6B-Q8_0.gguf",
    size: 639446688,
    sha256: "9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031",
    url: "https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/resolve/23749fefcc72300e3a2ad315e1317431b06b590a/Qwen3-0.6B-Q8_0.gguf",
    license: "Apache-2.0",
    source: "https://huggingface.co/Qwen/Qwen3-0.6B-GGUF",
  },
  {
    id: "graphite-theme",
    name: "Graphite",
    kind: "asset",
    version: "1.0.0",
    description:
      "Arayüzlerde kullanılmak üzere koyu renk paleti ve tasarım değişkenleri sağlar.",
    bundled: true,
    payload: {
      type: "theme",
      colors: {
        background: "#101214",
        surface: "#191d20",
        accent: "#bcf57c",
        text: "#eef1ed",
      },
    },
    settings: { accent: "#bcf57c" },
  },
  {
    id: "meeting-template",
    name: "Toplantı çalışma alanı",
    kind: "template",
    version: "1.0.0",
    description:
      "Toplantı gündemini, kararları ve takip görevlerini düzenleyen bir çalışma şablonu sunar.",
    bundled: true,
    payload: {
      type: "template",
      sections: ["Gündem", "Notlar", "Kararlar", "Takip görevleri"],
    },
    settings: { language: "tr" },
  },
  {
    id: "writing-library",
    name: "Yazı araçları kütüphanesi",
    kind: "library",
    version: "1.0.0",
    description:
      "Özetleme, yeniden yazma ve sınıflandırma komutlarını yeniden kullanılabilir bir kütüphanede toplar.",
    bundled: true,
    payload: {
      type: "prompts",
      prompts: [
        { name: "Özetle", prompt: "Metni üç maddede özetle." },
        {
          name: "Sınıflandır",
          prompt: "Metne uygun kategorileri JSON dizisi olarak döndür.",
        },
      ],
    },
    settings: { language: "tr" },
  },
  {
    id: "text-tools",
    name: "Metin araçları",
    kind: "plugin",
    version: "1.0.0",
    description:
      "Metinlerdeki kelime ve karakterleri yapay zekâ gerektirmeden sayar.",
    bundled: true,
    payload: { type: "builtin", capability: "text.count" },
    settings: { countWhitespace: true },
  },
];
for (const product of require("../resources/notion-catalog.json").items) {
  catalog.push({
    id: product.id.toLowerCase(),
    name: product.name,
    kind: "preview",
    version: "0.2.0",
    description: product.description,
    bundled: true,
    source: product.source,
    settings: { language: "tr", showDevelopmentTasks: true },
    payload: {
      type: "product-preview",
      productId: product.id,
      name: product.name,
      description: product.description,
      fields: product.fields,
      spec: product.spec,
      source: product.source,
    },
  });
}
module.exports = {
  DIST,
  catalog: catalog.map((item) => {
    const v = item.variants?.[process.platform];
    return {
      ...item,
      ...v,
      supported: !item.variants || !!v,
      variants: undefined,
    };
  }),
};
