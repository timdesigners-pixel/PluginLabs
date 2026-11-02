# PL-026 · Workspace Scenes

> Uygulamaları, klasörleri ve tarayıcı oturumlarını kayıtlı çalışma sahneleriyle birlikte açar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-026` · `workspace-scenes` |
| Kategori | 03 · Masaüstü, dosya araçları ve widget’lar — PL-021–030 |
| Durum | 01.11.2026: **0.1.0 Windows uygulaması yayımlandı** — [workspace-scenes-v0.1.0](https://github.com/timdesigners-pixel/pluginlabs-dagitim/releases/tag/workspace-scenes-v0.1.0) (`pluginlabs-dagitim`, Windows runner: test + duman testi + SHA256 + BUILD-INFO + Windows ekran görüntüleri); kaynak [app/](app/README.md); Hub 0.4.9 kataloğunda · Notion durumu: Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) — 0.1.0 yalnız Windows masaüstü; Chrome eklentisi yok |
| Geliştirme deposu | Henüz yok — kaynak bu klasörün [`app/`](app/README.md) alt klasöründe (ön geliştirme alanı; bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)); Windows derlemesi ve sürüm dosyaları `pluginlabs-dagitim` deposunda (iş akışı: [`app/ci/`](app/ci/pluginlabs-dagitim-workspace-scenes-windows.yml)) |
| Codex projesi | `PL-026 · Workspace Scenes` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f98193b5c3ef18528e0c83) |

## Ne işe yarar

**Kullanıcı ve problem:** İş, araştırma ve kişisel çalışma arasında aynı araçları tekrar açan kullanıcılar.

**Kısa tanım (Hub kataloğu):** Uygulamaları, klasörleri ve tarayıcı oturumlarını kayıtlı çalışma sahneleriyle birlikte açar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M; Chrome oturum eklentisi

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Bir sahnede uygulama, klasör ve URL listesi kaydet; önizlemeyle birlikte aç. İlk sürüm pencere konumu değil yalnız açılış dizisi.

### Yapay zekânın rolü

Görev adına göre sahne ve eksik araç önerir; çalışma ortamını kendiliğinden kapatmaz.

### 0.1.0 (01.11.2026, Claude Code — zamanlanmış görev)

MVP'ye uyar: sahnede uygulama, klasör ve URL (ve dosya) listesi kaydedilir; önizlemeyle birlikte açılır; **yalnız açılış dizisi**, pencere konumu yok. Yapay zekâ "görev adına göre sahne ve eksik araç önerir; çalışma ortamını kendiliğinden kapatmaz" — kodda kapatma yolu hiç yoktur.

- Sahneler: bağlantı (http/https), klasör, uygulama (.exe/.lnk/.appref-ms/.url + isteğe bağlı argüman), dosya; sıralama, açılışa dahil et/çıkar, adımlar arası bekleme, çoklu bağlantı yapıştırma, kopyala, arşivle (silinmez).
- Önizleme + "Denetle" (eksik yollar); onay penceresinde dizinin tamamı; adım adım sonuç; Windows masaüstü kısayolu (`--sahne=<kimlik>`, yine onaylı).
- Doğrulama ölçütü için ölçüm: açılış süreleri ve elle kuruluma göre azalma yüzdesi (hedef ≥ %60); "beklenmeyen kapatma sıfır" tasarım gereği.
- 7 şablon ve kurala dayalı eksik araç önerisi; MyMind (Hub, her istekte onay; yalnız görev adı/amacı + öğe türü/adı, bağlantılarda alan adı) ile öneri, yanıt doğrulanır.
- Sahneler ve MyMind anahtarı Windows kasasıyla (DPAPI) şifreli; JSON yedek.
- Kapsam dışı (0.1.0): pencere yerleşimi/çoklu ekran (ikinci faz), Chrome oturum eklentisi, Linux/macOS paketi.

## Teknik bağımlılık ve sınırlar

Çoklu ekran pencere yerleşimi platforma özgü; Wayland sınırlamalarına göre ikinci faz. Giriş gerektiren hesaplara otomatik erişim yok.

## Gelir hipotezi

Pro sahne paketi; ekip onboarding şablonları.

## Doğrulama ölçütü

Sahne kurulum süresinde ≥%60 azalma; beklenmeyen uygulama kapatma sıfır.

## Öncelik ve efor

P1 · M; Flow Dock içinde gelişmiş akış paketi.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-026-<konu>` veya `claude/PL-026-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** W / L / M; Chrome oturum eklentisi
- **Kullanıcı ve problem:** İş, araştırma ve kişisel çalışma arasında aynı araçları tekrar açan kullanıcılar.
- **MVP ve temel akış:** Bir sahnede uygulama, klasör ve URL listesi kaydet; önizlemeyle birlikte aç. İlk sürüm pencere konumu değil yalnız açılış dizisi.
- **Yapay zekânın rolü:** Görev adına göre sahne ve eksik araç önerir; çalışma ortamını kendiliğinden kapatmaz.
- **Teknik bağımlılık ve sınır:** Çoklu ekran pencere yerleşimi platforma özgü; Wayland sınırlamalarına göre ikinci faz. Giriş gerektiren hesaplara otomatik erişim yok.
- **Gelir hipotezi:** Pro sahne paketi; ekip onboarding şablonları.
- **Doğrulama ölçütü:** Sahne kurulum süresinde ≥%60 azalma; beklenmeyen uygulama kapatma sıfır.
- **Öncelik ve efor:** P1 · M; Flow Dock içinde gelişmiş akış paketi.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
