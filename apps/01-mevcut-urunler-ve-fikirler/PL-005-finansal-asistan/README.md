# PL-005 · Finansal Asistan

> Gelirleri, giderleri, borçları ve ödeme tarihlerini kaydeder; finansal durumu raporlar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-005` · `finansal-asistan` |
| Kategori | 01 · Mevcut ürünler ve fikirler — PL-001–010 |
| Durum | Mevcut ayrıntılı proje planı |
| Öncelik / efor | P1 · L |
| Hedef platformlar | Windows, Linux, macOS |
| Dağıtım biçimi | masaüstü uygulaması, widget |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-005 · Finansal Asistan` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981edbfa2cdc55d867114) |

## Ne işe yarar

**Kullanıcı ve problem:** Borç, gelir, gider ve taksitlerini tek görünümde takip etmek isteyen kişiler.

**Kısa tanım (Hub kataloğu):** Gelirleri, giderleri, borçları ve ödeme tarihlerini kaydeder; finansal durumu raporlar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M; ödeme takvimi widget’ı

- Windows
- Linux
- macOS

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Manuel kayıt + CSV içe aktarma, vade/taksit motoru, nakit takvimi ve hatırlatıcı. Banka bağlantısı ilk sürüm dışında.

### Yapay zekânın rolü

Harcama kategorisi taslağı ve açıklanabilir aylık özet; bakiye/faiz hesabı test edilmiş hesaplama motorunda.

## Teknik bağımlılık ve sınırlar

Finansal veri şifrelenir; banka şifresi toplanmaz. Kararlar ve mevzuat uyumu ayrıca doğrulanır; otomatik yatırım/talimat ürünü değildir.

## Gelir hipotezi

Kişisel Pro; aile çalışma alanı ve gelişmiş rapor paketi.

## Doğrulama ölçütü

CSV mutabakatında tutar tutarlılığı %100; manuel işlem süresinde ≥%50 azalma.

## Öncelik ve efor

P1 · L; hassas veri nedeniyle önce kapalı pilot.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-005-<konu>` veya `claude/PL-005-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut ayrıntılı proje planı
- **Platform:** W / L / M; ödeme takvimi widget’ı
- **Kullanıcı ve problem:** Borç, gelir, gider ve taksitlerini tek görünümde takip etmek isteyen kişiler.
- **MVP ve temel akış:** Manuel kayıt + CSV içe aktarma, vade/taksit motoru, nakit takvimi ve hatırlatıcı. Banka bağlantısı ilk sürüm dışında.
- **Yapay zekânın rolü:** Harcama kategorisi taslağı ve açıklanabilir aylık özet; bakiye/faiz hesabı test edilmiş hesaplama motorunda.
- **Teknik bağımlılık ve sınır:** Finansal veri şifrelenir; banka şifresi toplanmaz. Kararlar ve mevzuat uyumu ayrıca doğrulanır; otomatik yatırım/talimat ürünü değildir.
- **Gelir hipotezi:** Kişisel Pro; aile çalışma alanı ve gelişmiş rapor paketi.
- **Doğrulama ölçütü:** CSV mutabakatında tutar tutarlılığı %100; manuel işlem süresinde ≥%50 azalma.
- **Öncelik ve efor:** P1 · L; hassas veri nedeniyle önce kapalı pilot.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
