# PL-043 · Access Lens

> Web sayfalarındaki kontrast, etiket, odak sırası ve semantik erişilebilirlik sorunlarını raporlar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-043` · `access-lens` |
| Kategori | 05 · Geliştirici ve profesyonel araçlar — PL-041–050 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-043 · Access Lens` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981059dfad209ce1240d1) |

## Ne işe yarar

**Kullanıcı ve problem:** Arayüzündeki erişilebilirlik sorunlarını erken görmek isteyen tasarımcı/geliştiriciler.

**Kısa tanım (Hub kataloğu):** Web sayfalarındaki kontrast, etiket, odak sırası ve semantik erişilebilirlik sorunlarını raporlar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome denetim paneli; rapor W / L / M

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Seçili sayfada kontrast, etiket, odak sırası ve semantik uyarılar; sorun seçildiğinde ilgili öğeyi göster.

### Yapay zekânın rolü

Sorunu sade açıklar ve düzeltme taslağı önerir; otomatik puanı erişilebilirlik sertifikası gibi sunmaz.

## Teknik bağımlılık ve sınırlar

Standart sürümü ve kural motoru çıktısı görünür. Klavye/ekran okuyucu manuel kontrolleri ayrıca gerekir.

## Gelir hipotezi

Ücretsiz temel denetim; Pro rapor geçmişi ve ekip takibi.

## Doğrulama ölçütü

Bilinen fixture’larda kurala göre doğru bulgu; kritik yanlış olumlu \<%5 hedefi.

## Öncelik ve efor

P1 · M; gerçek engelli kullanıcı testi ürün doğrulamasına dahil.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-043-<konu>` veya `claude/PL-043-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome denetim paneli; rapor W / L / M
- **Kullanıcı ve problem:** Arayüzündeki erişilebilirlik sorunlarını erken görmek isteyen tasarımcı/geliştiriciler.
- **MVP ve temel akış:** Seçili sayfada kontrast, etiket, odak sırası ve semantik uyarılar; sorun seçildiğinde ilgili öğeyi göster.
- **Yapay zekânın rolü:** Sorunu sade açıklar ve düzeltme taslağı önerir; otomatik puanı erişilebilirlik sertifikası gibi sunmaz.
- **Teknik bağımlılık ve sınır:** Standart sürümü ve kural motoru çıktısı görünür. Klavye/ekran okuyucu manuel kontrolleri ayrıca gerekir.
- **Gelir hipotezi:** Ücretsiz temel denetim; Pro rapor geçmişi ve ekip takibi.
- **Doğrulama ölçütü:** Bilinen fixture’larda kurala göre doğru bulgu; kritik yanlış olumlu \<%5 hedefi.
- **Öncelik ve efor:** P1 · M; gerçek engelli kullanıcı testi ürün doğrulamasına dahil.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
