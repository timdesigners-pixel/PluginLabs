# PluginLabs — Claude Code talimatları

Bu depo Codex (ChatGPT) ve Claude Code tarafından **ortak** geliştirilir. Tek kural kaynağı `AGENTS.md` dosyasıdır; Claude Code onu aşağıdaki satırla aynen yükler. Kuralları burada çoğaltmayın — değişiklik gerekiyorsa `AGENTS.md` güncellenir, böylece iki model aynı kurallarla çalışır.

@AGENTS.md

## Claude Code’a özgü ekler

- Ortak çalışma protokolü: `docs/ortak-calisma/AI-ORTAK-CALISMA.md`. İşe başlamadan önce `docs/ortak-calisma/AKTIF-ISLER.md` dosyasını oku; aynı `PL-0XX` için Codex’in açık işi varsa o dala dokunma.
- Dal öneki: `claude/PL-0XX-<konu>` (ürün dışı genel işler: `claude/hub-<konu>`). Codex dalları `codex/…` önekiyle açılır.
- Uygulama hiyerarşisi: `apps/<kategori>/<PL-ID-slug>/README.md`; makine okunur kayıt: `registry/projects.json`. Yeni ürün eklerken ikisini birlikte güncelle.
- Kısayollar: `/pl-proje PL-0XX` (proje bağlamını yükler), `/pl-devir PL-0XX` (devir notu yazar).
- Notion kaynaklı içerik (`resources/notion-catalog.json`, README’lerdeki “Notion kartının özgün metni” bölümleri) kısaltılmaz, özetlenmez, yeniden yazılmaz. Silme yerine arşivleme: kaldırılan içerik `docs/arsiv/` altına taşınır.
- Her işin sonunda rapor biçimi: 📌 GÖREV / ✅ DURUM / 📁 ÇIKTI / ⚠️ NOTLAR / 🔜 SONRAKİ ADIM.

<!-- PLUGINLABS-ADVANCED-VARSAYILAN -->
## Varsayılan tasarım sistemi: PluginLabs Advanced

- Bu projede her arayüz, ekran, komponent, popup, panel, HTML/CSS veya stil işinde `pluginlabs-advanced` skill'i kullanılır. Eski temel `pluginlabs-design` skill'inin yerine geçer; temel katman (PLC-001…079) Advanced'in içinde aynen durur.
- Skill konumu: repoda `.claude/skills/pluginlabs-advanced/` varsa o, yoksa kişisel `~/.claude/skills/pluginlabs-advanced/`. Kanonik kaynak: `PluginLabs/design-system/pluginlabs-advanced/`.
- İşe başlamadan önce `SKILL.md` ve `references/TASARIM-PRENSIPLERI.md` okunur; komponent seçimi `references/KOMPONENTLER.md` üzerinden yapılır.
- CSS sırası: `assets/pl-tokens.css` → `assets/pl-components.css` → `assets/pl-advanced.css`. Kapsayıcı: `<div data-pl data-pl-theme="dark" data-pl-product="…">`.
- Ürünün mevcut `data-pl-product` aksanı korunur; yüzey gerekiyorsa `data-pl-surface="glass|hud|neon|soft|cockpit"`.
- Tam ekranlarda önce Ekran Şablonları (PLA-091…102) ve `assets/pl-pin-ekranlari.html` içindeki en yakın ekran temel alınır.
- Yalnız `[data-pl]` kapsayıcısı, `--pl-` tokenları ve `pl-` sınıfları; global seçici ve sabit renk yazılmaz.
- Mevcut tasarıma dokunulmaz: bir ekranı Advanced'e taşımak opt-in'dir, önce kullanıcıya sorulur. Silme yok, eskiler `_arsiv/GG.AA.YYYY/` altına taşınır.
- Claude Design karşılığı: "PluginLabs Advanced" tasarım sistemi — https://claude.ai/artifact/J9knwk3VLaYFpVC4u22cxC
<!-- /PLUGINLABS-ADVANCED-VARSAYILAN -->
