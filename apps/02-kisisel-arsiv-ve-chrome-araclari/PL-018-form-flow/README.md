# PL-018 · Form Flow

> Tekrarlanan form bilgilerini şablonlarda saklar ve seçilen alanlara kontrollü biçimde yerleştirir.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-018` · `form-flow` |
| Kategori | 02 · Kişisel arşiv ve Chrome araçları — PL-011–020 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | [timdesigners-pixel/form-flow](https://github.com/timdesigners-pixel/form-flow) · Windows sürümü [v0.1.0](https://github.com/timdesigners-pixel/form-flow/releases/tag/v0.1.0) |
| Codex projesi | `PL-018 · Form Flow` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981caa69dd557ce408743) |

## Ne işe yarar

**Kullanıcı ve problem:** Aynı iletişim ve başvuru bilgilerini farklı sitelerde tekrar yazan kullanıcılar.

**Kısa tanım (Hub kataloğu):** Tekrarlanan form bilgilerini şablonlarda saklar ve seçilen alanlara kontrollü biçimde yerleştirir.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome; W / L / M tarayıcı

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kullanıcı tanımlı profilden alan öner, doldurulacak alanların önizlemesini göster, seçilenleri doldur. Formu otomatik gönderme yok.

### Yapay zekânın rolü

Etiketleri anlamsal eşler; belirsiz alanlarda soru işareti gösterir.

## Teknik bağımlılık ve sınırlar

Şifre/ödeme alanları kapsam dışı; profil şifreli, alan izni site bazlı. Kullanıcı eylemi olmadan sayfayı okuma yok.

## Gelir hipotezi

Bireysel Pro ve ekip şablonları; iş başvurusu paketi.

## Doğrulama ölçütü

20 formda doğru alan eşleme ≥%95; yanlış hassas alan doldurma sıfır.

## Öncelik ve efor

P1 · M; dinamik form test kümesi gerekli.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-018-<konu>` veya `claude/PL-018-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome; W / L / M tarayıcı
- **Kullanıcı ve problem:** Aynı iletişim ve başvuru bilgilerini farklı sitelerde tekrar yazan kullanıcılar.
- **MVP ve temel akış:** Kullanıcı tanımlı profilden alan öner, doldurulacak alanların önizlemesini göster, seçilenleri doldur. Formu otomatik gönderme yok.
- **Yapay zekânın rolü:** Etiketleri anlamsal eşler; belirsiz alanlarda soru işareti gösterir.
- **Teknik bağımlılık ve sınır:** Şifre/ödeme alanları kapsam dışı; profil şifreli, alan izni site bazlı. Kullanıcı eylemi olmadan sayfayı okuma yok.
- **Gelir hipotezi:** Bireysel Pro ve ekip şablonları; iş başvurusu paketi.
- **Doğrulama ölçütü:** 20 formda doğru alan eşleme ≥%95; yanlış hassas alan doldurma sıfır.
- **Öncelik ve efor:** P1 · M; dinamik form test kümesi gerekli.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
