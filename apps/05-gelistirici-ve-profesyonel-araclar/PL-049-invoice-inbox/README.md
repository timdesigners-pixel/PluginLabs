# PL-049 · Invoice Inbox

> Yüklenen fatura ve fişlerden tarih, satıcı ve tutar alanlarını çıkarıp onay sonrası CSV'ye aktarır.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-049` · `invoice-inbox` |
| Kategori | 05 · Geliştirici ve profesyonel araçlar — PL-041–050 |
| Durum | Yeni fikir |
| Öncelik / efor | P2 · L |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-049 · Invoice Inbox` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981059dfad209ce1240d1) |

## Ne işe yarar

**Kullanıcı ve problem:** Fatura/fişlerden tutar ve son ödeme tarihini elle giren serbest çalışanlar.

**Kısa tanım (Hub kataloğu):** Yüklenen fatura ve fişlerden tarih, satıcı ve tutar alanlarını çıkarıp onay sonrası CSV'ye aktarır.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M belge kutusu

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kullanıcının yüklediği belgeyi aç; satıcı, tarih, vergi ve toplamı taslak çıkar; insan onayı sonrası CSV’ye aktar. İlk sürüm iki belge şablonu.

### Yapay zekânın rolü

OCR ve alan çıkarımı; toplam/kalem tutarlılığı deterministik hesapla kontrol edilir.

## Teknik bağımlılık ve sınırlar

Finansal belge şifreli; muhasebe kaydı veya vergi beyannamesi otomatik gönderilmez. Kimlik verisi kırpma seçeneği.

## Gelir hipotezi

Belge başına kredi + Pro aylık kota; küçük ekip lisansı.

## Doğrulama ölçütü

Örnek belgelerde toplam/tarih alanı ≥%98 doğruluk; belirsiz alanlar zorunlu incelemeli.

## Öncelik ve efor

P2 · L; Finansal Asistan’a veri besleyen modül, ayrı finans defteri oluşturmaz.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-049-<konu>` veya `claude/PL-049-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome + W / L / M belge kutusu
- **Kullanıcı ve problem:** Fatura/fişlerden tutar ve son ödeme tarihini elle giren serbest çalışanlar.
- **MVP ve temel akış:** Kullanıcının yüklediği belgeyi aç; satıcı, tarih, vergi ve toplamı taslak çıkar; insan onayı sonrası CSV’ye aktar. İlk sürüm iki belge şablonu.
- **Yapay zekânın rolü:** OCR ve alan çıkarımı; toplam/kalem tutarlılığı deterministik hesapla kontrol edilir.
- **Teknik bağımlılık ve sınır:** Finansal belge şifreli; muhasebe kaydı veya vergi beyannamesi otomatik gönderilmez. Kimlik verisi kırpma seçeneği.
- **Gelir hipotezi:** Belge başına kredi + Pro aylık kota; küçük ekip lisansı.
- **Doğrulama ölçütü:** Örnek belgelerde toplam/tarih alanı ≥%98 doğruluk; belirsiz alanlar zorunlu incelemeli.
- **Öncelik ve efor:** P2 · L; Finansal Asistan’a veri besleyen modül, ayrı finans defteri oluşturmaz.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
