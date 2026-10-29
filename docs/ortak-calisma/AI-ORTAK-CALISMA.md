# Codex + Claude Code ortak çalışma protokolü

Sürüm 1.0 · 29.10.2026

PluginLabs projelerinde iki dil modeli birlikte çalışır: **Codex** (ChatGPT uygulaması → Codex → `· PluginLabs ·` bölümü) ve **Claude Code**. Bu belge, ikisinin aynı depoda birbirinin işini bozmadan, aynı bağlamı paylaşarak ilerlemesini sağlar.

## 1. Hiyerarşi eşlemesi

| Codex’teki karşılığı | Claude Code’daki karşılığı | Depodaki yeri |
| --- | --- | --- |
| `· PluginLabs ·` bölümü | Bu depo (`timdesigners-pixel/PluginLabs`) | kök |
| “Ana Geliştirme ve Karar Merkezi” sohbeti | `docs/ortak-calisma/KARARLAR.md` | karar günlüğü |
| `PL-0XX · <Ürün>` projesi | Ürün klasörü (veya bağımsız ürün deposu) | `apps/<kategori>/<PL-ID-slug>/` |
| Projenin **birincil** klasörü | Claude Code’un açıldığı çalışma klasörü | ürün klasörü / ürün deposu |
| Projenin **ikinci** klasörü: PluginLabs | `.claude/settings.local.json` → `permissions.additionalDirectories` | PluginLabs kökü |
| Proje kartı (`PL-0XX Proje Kartı 29.10.2026.md`) | `apps/…/README.md` | ürün klasörü |
| Hub kayıtları | `registry/projects.json` | `registry/` |

Codex’te her `PL-0XX` projesine PluginLabs klasörü ikinci kök olarak eklenmiştir. Claude Code’da aynı etki, ürün klasöründeki `.claude/settings.local.json` dosyasına PluginLabs yolunun `additionalDirectories` olarak yazılmasıyla sağlanır. Bu dosya makineye özeldir ve git’e girmez; `scripts/claude-code-baglanti.ps1` betiği 53 proje için toplu olarak oluşturur.

## 2. Ortak kurallar tek yerde

- Kurallar yalnız `AGENTS.md` içinde yazılır. Codex onu doğrudan okur; Claude Code `CLAUDE.md` içindeki `@AGENTS.md` satırıyla aynı dosyayı yükler.
- Ürün depolarında da aynı düzen kullanılır: `AGENTS.md` (kurallar) + `CLAUDE.md` (yalnız `@AGENTS.md` ve Claude’a özgü küçük ekler).
- Bir model kural değişikliği önerdiğinde bunu PR ile `AGENTS.md` üzerinde yapar; diğer model bir sonraki işte otomatik olarak aynı kuralı görür.

## 3. İş sahipliği ve kilit

1. İşe başlamadan önce `docs/ortak-calisma/AKTIF-ISLER.md` tablosuna satır eklenir: PL kimliği, ajan, dal, başlangıç tarihi, kapsam.
2. Aynı `PL-0XX` için açık satır varsa diğer ajan o dala yazmaz; gerekiyorsa ayrı dal açar ve PR açıklamasında çakışmayı belirtir.
3. İş bitince satırın durumu `tamamlandı` / `devredildi` olarak güncellenir (satır silinmez; ay sonunda `docs/arsiv/` altına taşınır).

## 4. Dal ve commit düzeni

| Ajan | Dal öneki | Örnek |
| --- | --- | --- |
| Codex | `codex/` | `codex/PL-016-sekme-gruplama` |
| Claude Code | `claude/` | `claude/PL-016-oturum-geri-yukleme` |
| İnsan | `ozellik/`, `duzeltme/` | `ozellik/PL-001-halka-duzenleyici` |

- `main` dalına doğrudan push yapılmaz; her iş PR ile gelir ve insan onayı olmadan birleştirilmez (bkz. `AGENTS.md`).
- Commit mesajının ilk satırı `[PL-0XX] kısa açıklama` biçimindedir. Ürün dışı işler `[hub]` veya `[docs]` ile başlar.
- PR açıklamasında: yapılanlar, test kanıtı, test edilmeyenler, geri alma yolu ve **devir notu** (bkz. `DEVIR-SABLONU.md`).

## 5. Devir (handoff)

Bir model işi bırakırken diğerinin kaldığı yerden devam edebilmesi için devir notu yazar: ne yapıldı, ne kaldı, hangi kararlar alındı, hangi dosyalar değişti, hangi komutlar çalıştırıldı ve sonuçları. Şablon: `docs/ortak-calisma/DEVIR-SABLONU.md`. Not, PR açıklamasına ve ilgili ürünün `apps/…/` klasöründeki `DEVIR.md` dosyasına eklenir (eski notlar silinmez, üstüne tarihli yeni bölüm eklenir).

## 6. Hangi iş hangi modele

Bu bir varsayılan dağılımdır; kullanıcı her zaman değiştirebilir.

| İş türü | Varsayılan |
| --- | --- |
| Codex Cloud ortamında uzun süren derleme, toplu test | Codex |
| Mimari plan, inceleme, dokümantasyon, Notion ↔ depo eşitleme | Claude Code |
| Kod yazımı | İşi kim üstlendiyse (AKTIF-ISLER’e göre) |
| PR incelemesi | PR’ı açmayan model (çapraz inceleme) |

## 7. Kaynak doğruluğu

- Notion katalog içeriği (`resources/notion-catalog.json`) kısaltılmadan korunur. Notion’da değişiklik olursa yeni anlık görüntü alınır, eski dosya `docs/arsiv/` altına tarihli adla taşınır.
- Test edilmemiş platform veya özellik “var/destekleniyor” diye yazılmaz; durum alanı Notion’daki ayrımı (çalışan prototip / plan / fikir) korur.
