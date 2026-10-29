# PL-027 · Focus Orbit

> Odak zamanlayıcısını, mola hatırlatmalarını ve isteğe bağlı dikkat filtrelerini birlikte yönetir.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-027` · `focus-orbit` |
| Kategori | 03 · Masaüstü, dosya araçları ve widget’lar — PL-021–030 |
| Durum | Yeni fikir |
| Öncelik / efor | P0 · S |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3), yüzen balon |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-027 · Focus Orbit` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f98193b5c3ef18528e0c83) |

## Ne işe yarar

**Kullanıcı ve problem:** Odak seansında görevi ve kalan süreyi görünür tutmak isteyen kişiler.

**Kısa tanım (Hub kataloğu):** Odak zamanlayıcısını, mola hatırlatmalarını ve isteğe bağlı dikkat filtrelerini birlikte yönetir.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M odak balonu + Chrome dikkat filtresi

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Sürüklenen sayaç, tek görev, mola ve kullanıcı seçtiği site engel listesi; ilk sürüm yalnız süre ve uyarı.

### Yapay zekânın rolü

İsteğe bağlı görev parçalama ve seans sonu özeti; ekran davranışı sürekli gözetlenmez.

## Teknik bağımlılık ve sınırlar

Engel listesi açık/geri alınabilir; işletim sistemi düzeyinde uygulama kapatma yok. Erişilebilirlik ve hareket azaltma seçenekleri.

## Gelir hipotezi

Ücretsiz timer; Pro proje istatistiği ve cihazlar arası plan.

## Doğrulama ölçütü

Haftada ≥3 tamamlanan seans; kullanıcı bildirimiyle dikkat kesintilerinde azalma.

## Öncelik ve efor

P0 · S; Flow Dock balon altyapısının yeniden kullanımı.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-027-<konu>` veya `claude/PL-027-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** W / L / M odak balonu + Chrome dikkat filtresi
- **Kullanıcı ve problem:** Odak seansında görevi ve kalan süreyi görünür tutmak isteyen kişiler.
- **MVP ve temel akış:** Sürüklenen sayaç, tek görev, mola ve kullanıcı seçtiği site engel listesi; ilk sürüm yalnız süre ve uyarı.
- **Yapay zekânın rolü:** İsteğe bağlı görev parçalama ve seans sonu özeti; ekran davranışı sürekli gözetlenmez.
- **Teknik bağımlılık ve sınır:** Engel listesi açık/geri alınabilir; işletim sistemi düzeyinde uygulama kapatma yok. Erişilebilirlik ve hareket azaltma seçenekleri.
- **Gelir hipotezi:** Ücretsiz timer; Pro proje istatistiği ve cihazlar arası plan.
- **Doğrulama ölçütü:** Haftada ≥3 tamamlanan seans; kullanıcı bildirimiyle dikkat kesintilerinde azalma.
- **Öncelik ve efor:** P0 · S; Flow Dock balon altyapısının yeniden kullanımı.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
