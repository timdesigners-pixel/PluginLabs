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
