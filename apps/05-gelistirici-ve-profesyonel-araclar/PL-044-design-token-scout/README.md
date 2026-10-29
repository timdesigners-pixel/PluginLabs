# PL-044 · Design Token Scout

> Seçilen arayüzden renk, yazı ve boşluk değerlerini çıkararak tasarım tokenları oluşturur.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-044` · `design-token-scout` |
| Kategori | 05 · Geliştirici ve profesyonel araçlar — PL-041–050 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-044 · Design Token Scout` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981059dfad209ce1240d1) |

## Ne işe yarar

**Kullanıcı ve problem:** Mevcut bir arayüzün tutarlı renk, yazı ve boşluk sistemini belgelemek isteyen tasarımcılar.

**Kısa tanım (Hub kataloğu):** Seçilen arayüzden renk, yazı ve boşluk değerlerini çıkararak tasarım tokenları oluşturur.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M + isteğe bağlı tasarım bağlayıcısı

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Seçili sayfadaki computed style örneklerinden renk/font/spacing adayları çıkar; kullanıcı onayıyla token JSON üret.

### Yapay zekânın rolü

Yakın değerleri kümeler ve olası token hiyerarşisi önerir.

## Teknik bağımlılık ve sınırlar

Yalnız erişilen sayfa ve hak sahibi olunan tasarımda kullanılır. Tasarım kopyalama yerine sistem çıkarma; dinamik durumlar ayrıca örneklenir.

## Gelir hipotezi

Bireysel Pro; ekip tasarım sistemi paketi.

## Doğrulama ölçütü

Örnek 5 sayfada kullanılan ana değerleri ≥%90 kapsama; token tekrarında düşüş.

## Öncelik ve efor

P1 · M; 1001 Designs çıktı üretir, bu araç var olan sistemi belgeler.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-044-<konu>` veya `claude/PL-044-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome + W / L / M + isteğe bağlı tasarım bağlayıcısı
- **Kullanıcı ve problem:** Mevcut bir arayüzün tutarlı renk, yazı ve boşluk sistemini belgelemek isteyen tasarımcılar.
- **MVP ve temel akış:** Seçili sayfadaki computed style örneklerinden renk/font/spacing adayları çıkar; kullanıcı onayıyla token JSON üret.
- **Yapay zekânın rolü:** Yakın değerleri kümeler ve olası token hiyerarşisi önerir.
- **Teknik bağımlılık ve sınır:** Yalnız erişilen sayfa ve hak sahibi olunan tasarımda kullanılır. Tasarım kopyalama yerine sistem çıkarma; dinamik durumlar ayrıca örneklenir.
- **Gelir hipotezi:** Bireysel Pro; ekip tasarım sistemi paketi.
- **Doğrulama ölçütü:** Örnek 5 sayfada kullanılan ana değerleri ≥%90 kapsama; token tekrarında düşüş.
- **Öncelik ve efor:** P1 · M; 1001 Designs çıktı üretir, bu araç var olan sistemi belgeler.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
