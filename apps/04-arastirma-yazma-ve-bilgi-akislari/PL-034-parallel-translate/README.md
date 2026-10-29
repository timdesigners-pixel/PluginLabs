# PL-034 · Parallel Translate

> Seçilen metni özgün içerikle yan yana çevirir ve kişisel terim sözlüğünü uygular.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-034` · `parallel-translate` |
| Kategori | 04 · Araştırma, yazma ve bilgi akışları — PL-031–040 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-034 · Parallel Translate` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981c08edfda43643b31fc) |

## Ne işe yarar

**Kullanıcı ve problem:** İki dil arasında çalışırken çeviri ve özgün metni birlikte izlemek isteyen kişiler.

**Kısa tanım (Hub kataloğu):** Seçilen metni özgün içerikle yan yana çevirir ve kişisel terim sözlüğünü uygular.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M seçim paneli

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Seçilen metni yan yana çevir; kişisel terim sözlüğü ve bölüm eşleştirme. İlk sürüm Türkçe-İngilizce.

### Yapay zekânın rolü

Bağlama uygun çeviri, alternatif terim ve kısa açıklama üretir.

## Teknik bağımlılık ve sınırlar

Gizli sözleşme/mesajlar için yerel model seçeneği; teknik/hukuki anlam doğrulaması kullanıcıda. Sınırsız düşük maliyet iddiası yok.

## Gelir hipotezi

Ücretsiz günlük kota; Pro belge boyutu ve kurumsal sözlük.

## Doğrulama ölçütü

Temsilî terim kümesinde sözlük uyumu ≥%95; insan kalite değerlendirmesi.

## Öncelik ve efor

P1 · M; birden çok dil desteği aşamalı.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-034-<konu>` veya `claude/PL-034-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome + W / L / M seçim paneli
- **Kullanıcı ve problem:** İki dil arasında çalışırken çeviri ve özgün metni birlikte izlemek isteyen kişiler.
- **MVP ve temel akış:** Seçilen metni yan yana çevir; kişisel terim sözlüğü ve bölüm eşleştirme. İlk sürüm Türkçe-İngilizce.
- **Yapay zekânın rolü:** Bağlama uygun çeviri, alternatif terim ve kısa açıklama üretir.
- **Teknik bağımlılık ve sınır:** Gizli sözleşme/mesajlar için yerel model seçeneği; teknik/hukuki anlam doğrulaması kullanıcıda. Sınırsız düşük maliyet iddiası yok.
- **Gelir hipotezi:** Ücretsiz günlük kota; Pro belge boyutu ve kurumsal sözlük.
- **Doğrulama ölçütü:** Temsilî terim kümesinde sözlük uyumu ≥%95; insan kalite değerlendirmesi.
- **Öncelik ve efor:** P1 · M; birden çok dil desteği aşamalı.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
