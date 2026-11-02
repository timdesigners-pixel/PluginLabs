# PL-021 · Desk Tidy

> Seçilen klasörlerdeki dosyaları kurallara göre gruplar; taşıma planını uygulamadan önce gösterir.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-021` · `desk-tidy` |
| Kategori | 03 · Masaüstü, dosya araçları ve widget’lar — PL-021–030 |
| Durum | Yeni fikir · bu görüşmedeki düzenleme deneyiminden |
| Öncelik / efor | P0 · M |
| Hedef platformlar | Windows, Linux, macOS |
| Dağıtım biçimi | masaüstü uygulaması |
| Geliştirme deposu | [timdesigners-pixel/desk-tidy](https://github.com/timdesigners-pixel/desk-tidy) · Windows sürümü [v0.1.0](https://github.com/timdesigners-pixel/desk-tidy/releases/tag/v0.1.0) |
| Codex projesi | `PL-021 · Desk Tidy` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f98193b5c3ef18528e0c83) |

## Ne işe yarar

**Kullanıcı ve problem:** Masaüstü ve indirme klasörleri biriken, dosya kaybetmekten çekinen kullanıcılar.

**Kısa tanım (Hub kataloğu):** Seçilen klasörlerdeki dosyaları kurallara göre gruplar; taşıma planını uygulamadan önce gösterir.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M masaüstü

- Windows
- Linux
- macOS

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Klasör analizi → önerilen tür/proje grupları → taşıma önizlemesi → günlük ve geri al. İlk sürüm tek klasör, mevcut proje bütünlüğünü korur.

### Yapay zekânın rolü

Dosya adından açıklanabilir kategori önerisi; taşıma kararı kullanıcıda. İçerik okuma isteğe bağlı.

## Teknik bağımlılık ve sınırlar

Dosya sistemi izinleri, yeniden adlandırma çakışmaları, bağlantılı HTML varlıkları ve kilitli dosyalar hesaba katılır.

## Gelir hipotezi

Tek seferlik temel lisans; Pro kurallar ve zamanlanmış öneriler.

## Doğrulama ölçütü

Taşımaların %100’ü günlükte; geri al testinde veri kaybı sıfır; yanlış sınıflandırma \<%5.

## Öncelik ve efor

P0 · M; Flow Dock’a araç modülü, bağımsız satılabilir.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-021-<konu>` veya `claude/PL-021-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir · bu görüşmedeki düzenleme deneyiminden
- **Platform:** W / L / M masaüstü
- **Kullanıcı ve problem:** Masaüstü ve indirme klasörleri biriken, dosya kaybetmekten çekinen kullanıcılar.
- **MVP ve temel akış:** Klasör analizi → önerilen tür/proje grupları → taşıma önizlemesi → günlük ve geri al. İlk sürüm tek klasör, mevcut proje bütünlüğünü korur.
- **Yapay zekânın rolü:** Dosya adından açıklanabilir kategori önerisi; taşıma kararı kullanıcıda. İçerik okuma isteğe bağlı.
- **Teknik bağımlılık ve sınır:** Dosya sistemi izinleri, yeniden adlandırma çakışmaları, bağlantılı HTML varlıkları ve kilitli dosyalar hesaba katılır.
- **Gelir hipotezi:** Tek seferlik temel lisans; Pro kurallar ve zamanlanmış öneriler.
- **Doğrulama ölçütü:** Taşımaların %100’ü günlükte; geri al testinde veri kaybı sıfır; yanlış sınıflandırma \<%5.
- **Öncelik ve efor:** P0 · M; Flow Dock’a araç modülü, bağımsız satılabilir.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
