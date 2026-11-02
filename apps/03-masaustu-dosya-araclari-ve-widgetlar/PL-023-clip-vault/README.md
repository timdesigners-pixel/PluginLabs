# PL-023 · Clip Vault

> Pano geçmişini cihazda saklar; kopyalanan metinleri aramayı ve yeniden kullanmayı sağlar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-023` · `clip-vault` |
| Kategori | 03 · Masaüstü, dosya araçları ve widget’lar — PL-021–030 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS |
| Dağıtım biçimi | masaüstü uygulaması, sistem tepsisi |
| Geliştirme deposu | [timdesigners-pixel/clip-vault](https://github.com/timdesigners-pixel/clip-vault) · Windows **v0.1.0** ([release](https://github.com/timdesigners-pixel/clip-vault/releases/tag/v0.1.0)) |
| Codex projesi | `PL-023 · Clip Vault` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f98193b5c3ef18528e0c83) |

## Ne işe yarar

**Kullanıcı ve problem:** Tekrarlanan metin, kod ve bağlantılarını güvenle tekrar kullanmak isteyen kişiler.

**Kısa tanım (Hub kataloğu):** Pano geçmişini cihazda saklar; kopyalanan metinleri aramayı ve yeniden kullanmayı sağlar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M tepsi + pano penceresi

- Windows
- Linux
- macOS

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kısayolla pano geçmişi, sabitlenmiş parçalar, düz metin yapıştır ve uygulama hariç tutma. İlk sürüm yerel metin.

### Yapay zekânın rolü

Seçilen parçayı yeniden biçimlendirir, başlıklandırır veya yapılandırılmış veriye çevirir.

## Teknik bağımlılık ve sınırlar

Şifre yöneticileri hariç; pano yakalama durdurulabilir, saklama süresi sınırlı. Linux Wayland pano erişimi ayrıca test edilir.

## Gelir hipotezi

Tek seferlik lisans; Pro arama ve isteğe bağlı uçtan uca şifreli senkron.

## Doğrulama ölçütü

Kayıtlı parçaya 3 saniye altında erişim; hariç uygulama verisi toplama sıfır.

## Öncelik ve efor

P1 · M; otomatik bulut pano eşitleme ilk sürümde yok.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-023-<konu>` veya `claude/PL-023-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** W / L / M tepsi + pano penceresi
- **Kullanıcı ve problem:** Tekrarlanan metin, kod ve bağlantılarını güvenle tekrar kullanmak isteyen kişiler.
- **MVP ve temel akış:** Kısayolla pano geçmişi, sabitlenmiş parçalar, düz metin yapıştır ve uygulama hariç tutma. İlk sürüm yerel metin.
- **Yapay zekânın rolü:** Seçilen parçayı yeniden biçimlendirir, başlıklandırır veya yapılandırılmış veriye çevirir.
- **Teknik bağımlılık ve sınır:** Şifre yöneticileri hariç; pano yakalama durdurulabilir, saklama süresi sınırlı. Linux Wayland pano erişimi ayrıca test edilir.
- **Gelir hipotezi:** Tek seferlik lisans; Pro arama ve isteğe bağlı uçtan uca şifreli senkron.
- **Doğrulama ölçütü:** Kayıtlı parçaya 3 saniye altında erişim; hariç uygulama verisi toplama sıfır.
- **Öncelik ve efor:** P1 · M; otomatik bulut pano eşitleme ilk sürümde yok.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
