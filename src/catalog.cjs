const gh = (repo, tag, file) =>
  `https://github.com/${repo}/releases/download/${tag}/${file}`;
const catalog = [
  {
    id: "mind-palace",
    name: "Mind Palace",
    kind: "app",
    version: "1.10.0",
    description: "Kişisel bilgi, finans ve çalışma alanı.",
    platform: "win32",
    format: "exe",
    file: "MindPalace.exe",
    size: 81534054,
    sha256: "dde1b5eba5d65ff13d117393682f11db45dbafa2a53760cc27577a445c575a12",
    url: gh(
      "timdesigners-pixel/mind-palace",
      "v1.10.0",
      "Mind-Palace-Tasinabilir-1.10.0-x64.exe",
    ),
    repo: "timdesigners-pixel/mind-palace",
  },
  {
    id: "leo-helper",
    name: "Leo Helper",
    kind: "app",
    version: "0.8.0",
    description: "Kod, site ve AFF çalışma yardımcısı.",
    platform: "win32",
    format: "exe",
    file: "LeoHelper.exe",
    size: 26814787,
    sha256: "1b9645a5ff286ffb684aa4c8c155e739a51fb43e993a7c0f73f79df2ce132469",
    url: gh("timdesigners-pixel/leo-helper", "v0.8.0", "LeoHelper.exe"),
    repo: "timdesigners-pixel/leo-helper",
  },
  {
    id: "llama-engine",
    name: "My Mind · Çalıştırma motoru",
    kind: "engine",
    version: "11669",
    description:
      "llama.cpp CPU motoru. Yalnızca bu merkezin başlattığı süreç yönetilir.",
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
      "Qwen3 0.6B Q8 · 640 MB · Apache 2.0. Yerel özetleme, sınıflandırma ve metin işlemleri; yeni eğitilmiş bir model değildir.",
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
    description: "PluginLabs için koyu renk paleti ve tasarım değişkenleri.",
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
    description: "Gündem, kararlar ve takip görevleri için taşınabilir şablon.",
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
      "Özetleme, yeniden yazma ve sınıflandırma için komut şablonları.",
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
    description: "API üzerinden kelime ve karakter sayımı. AI gerektirmez.",
    bundled: true,
    payload: { type: "builtin", capability: "text.count" },
    settings: { countWhitespace: true },
  },
];
module.exports = {
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
