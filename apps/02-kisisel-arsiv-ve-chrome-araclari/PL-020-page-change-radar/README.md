# PL-020 · Page Change Radar

> Seçilen web sayfalarındaki değişiklikleri izler, farkları gösterir ve bildirim oluşturur.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-020` · `page-change-radar` |
| Kategori | 02 · Kişisel arşiv ve Chrome araçları — PL-011–020 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-020 · Page Change Radar` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981caa69dd557ce408743) |

## Ne işe yarar

**Kullanıcı ve problem:** Bir sayfanın yalnız belirli bölümündeki anlamlı değişikliği bekleyen kullanıcılar.

**Kısa tanım (Hub kataloğu):** Seçilen web sayfalarındaki değişiklikleri izler, farkları gösterir ve bildirim oluşturur.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M bildirim ajanı

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kullanıcı bölüm seçer; erişimi izinli sayfada periyodik fark kontrolü, değişiklik geçmişi ve sessiz saatler sunulur.

### Yapay zekânın rolü

Anlamsal farkı küçük kozmetik değişiklikten ayırıp bildirimin önemini önerir.

## Teknik bağımlılık ve sınırlar

Oturum/bot kısıtlarına uyum; ilk sürüm kişisel düşük sıklıkta. Tarayıcı kapalıyken izleme masaüstü ajanı gerektirir.

## Gelir hipotezi

Ücretsiz 3 izleyici; Pro izleyici ve tarihçe paketi.

## Doğrulama ölçütü

Gerçek değişiklik bildirim kesinliği ≥%90; tekrar bildirim oranı \<%5.

## Öncelik ve efor

P1 · M; kesintiler ve kaynak engelleri kullanıcıya görünür olmalı.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-020-<konu>` veya `claude/PL-020-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome + W / L / M bildirim ajanı
- **Kullanıcı ve problem:** Bir sayfanın yalnız belirli bölümündeki anlamlı değişikliği bekleyen kullanıcılar.
- **MVP ve temel akış:** Kullanıcı bölüm seçer; erişimi izinli sayfada periyodik fark kontrolü, değişiklik geçmişi ve sessiz saatler sunulur.
- **Yapay zekânın rolü:** Anlamsal farkı küçük kozmetik değişiklikten ayırıp bildirimin önemini önerir.
- **Teknik bağımlılık ve sınır:** Oturum/bot kısıtlarına uyum; ilk sürüm kişisel düşük sıklıkta. Tarayıcı kapalıyken izleme masaüstü ajanı gerektirir.
- **Gelir hipotezi:** Ücretsiz 3 izleyici; Pro izleyici ve tarihçe paketi.
- **Doğrulama ölçütü:** Gerçek değişiklik bildirim kesinliği ≥%90; tekrar bildirim oranı \<%5.
- **Öncelik ve efor:** P1 · M; kesintiler ve kaynak engelleri kullanıcıya görünür olmalı.

## Mevcut fikir kaynağı

<mention url="https://app.notion.com/p/3278aa13d8f98017a79dc7cd38cfc52e">Proje ve Fikirler</mention>

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
