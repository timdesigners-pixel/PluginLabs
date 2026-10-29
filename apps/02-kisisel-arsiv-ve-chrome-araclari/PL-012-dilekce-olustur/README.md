# PL-012 · Dilekçe Oluştur

> Belge bilgilerini ve seçilen şablonu kullanarak düzenlenebilir dilekçe taslakları oluşturur.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-012` · `dilekce-olustur` |
| Kategori | 02 · Kişisel arşiv ve Chrome araçları — PL-011–020 |
| Durum | Mevcut fikir · doğrulanmış çalışan ürün sayılmaz |
| Öncelik / efor | P2 · L |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | [timdesigners-pixel/dilekce-olustur](https://github.com/timdesigners-pixel/dilekce-olustur) |
| Codex projesi | `PL-012 · Dilekçe Oluştur` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981caa69dd557ce408743) |

## Ne işe yarar

**Kullanıcı ve problem:** Dilekçe taslağı hazırlarken olay, belge ve talepleri düzenlemekte zorlanan kullanıcılar ve uzmanlar.

**Kısa tanım (Hub kataloğu):** Belge bilgilerini ve seçilen şablonu kullanarak düzenlenebilir dilekçe taslakları oluşturur.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M belge asistanı + Chrome bağlayıcısı

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kullanıcıdan alınan olgu ve belge listesi → bölüm taslağı → eksik bilgi kontrolü → düzenlenebilir dışa aktarma. İlk sürüm genel başvuru şablonları.

### Yapay zekânın rolü

Özete ve taslağa destek verir; belgeye dayanmayan olgu veya karar numarası üretmemesi için kaynak sınırı uygulanır.

## Teknik bağımlılık ve sınırlar

Hukuki doğruluk uzman incelemesi gerektirir; emsal/mevzuat güncelliği ayrıca doğrulanır. UYAP’a otomatik gönderim ilk sürümde yok.

## Gelir hipotezi

Belge kredisi + uzman ekip paketi; tamamlanmış dosya başına deneme.

## Doğrulama ölçütü

Test setinde kaynaksız olgu/atıf sıfır hedefi; insan incelemesinde taslak düzeltme süresi.

## Öncelik ve efor

P2 · L; önce uzmanlı kapalı pilot ve veri saklama tasarımı.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-012-<konu>` veya `claude/PL-012-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut fikir · doğrulanmış çalışan ürün sayılmaz
- **Platform:** W / L / M belge asistanı + Chrome bağlayıcısı
- **Kullanıcı ve problem:** Dilekçe taslağı hazırlarken olay, belge ve talepleri düzenlemekte zorlanan kullanıcılar ve uzmanlar.
- **MVP ve temel akış:** Kullanıcıdan alınan olgu ve belge listesi → bölüm taslağı → eksik bilgi kontrolü → düzenlenebilir dışa aktarma. İlk sürüm genel başvuru şablonları.
- **Yapay zekânın rolü:** Özete ve taslağa destek verir; belgeye dayanmayan olgu veya karar numarası üretmemesi için kaynak sınırı uygulanır.
- **Teknik bağımlılık ve sınır:** Hukuki doğruluk uzman incelemesi gerektirir; emsal/mevzuat güncelliği ayrıca doğrulanır. UYAP’a otomatik gönderim ilk sürümde yok.
- **Gelir hipotezi:** Belge kredisi + uzman ekip paketi; tamamlanmış dosya başına deneme.
- **Doğrulama ölçütü:** Test setinde kaynaksız olgu/atıf sıfır hedefi; insan incelemesinde taslak düzeltme süresi.
- **Öncelik ve efor:** P2 · L; önce uzmanlı kapalı pilot ve veri saklama tasarımı.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
