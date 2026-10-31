# PL-017 · Page Capsule

> Web sayfalarını kaynak bağlantısı ve yakalama tarihiyle birlikte okunabilir arşivlere kaydeder.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-017` · `page-capsule` |
| Kategori | 02 · Kişisel arşiv ve Chrome araçları — PL-011–020 |
| Durum | Yeni fikir |
| Öncelik / efor | P0 · S |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | [timdesigners-pixel/page-capsule](https://github.com/timdesigners-pixel/page-capsule) · Windows **v0.1.0** (31.10.2026) |
| Codex projesi | `PL-017 · Page Capsule` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981caa69dd557ce408743) |

## Ne işe yarar

**Kullanıcı ve problem:** Okuduğu sayfayı bağlantısı değişse de notlarıyla hatırlamak isteyen araştırmacılar.

**Kısa tanım (Hub kataloğu):** Web sayfalarını kaynak bağlantısı ve yakalama tarihiyle birlikte okunabilir arşivlere kaydeder.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M isteğe bağlı arşiv

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kullanıcı tıklamasıyla okunabilir metin, URL, tarih, not ve ekran görüntüsü kapsülü oluştur; Markdown/HTML dışa aktar.

### Yapay zekânın rolü

İçerik özeti ve ana argümanları üretir; alıntıları özgün metinle eşleştirir.

## Teknik bağımlılık ve sınırlar

Oturum gerektiren içeriği izinsiz paylaşmaz; ücret duvarını aşmaz. Sayfa kopyasının kapsamı ve telif bilgisi gösterilir.

## Gelir hipotezi

Ücretsiz yakalama; Pro arşiv arama ve sınırlı AI kredisi.

## Doğrulama ölçütü

Kaynak metne bağlı özet cümlesi ≥%95; 20 sayfada temel metin yakalama başarısı.

## Öncelik ve efor

P0 · S; Note Master’a kaynaklı okuma modülü olarak da sunulabilir.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-017-<konu>` veya `claude/PL-017-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome + W / L / M isteğe bağlı arşiv
- **Kullanıcı ve problem:** Okuduğu sayfayı bağlantısı değişse de notlarıyla hatırlamak isteyen araştırmacılar.
- **MVP ve temel akış:** Kullanıcı tıklamasıyla okunabilir metin, URL, tarih, not ve ekran görüntüsü kapsülü oluştur; Markdown/HTML dışa aktar.
- **Yapay zekânın rolü:** İçerik özeti ve ana argümanları üretir; alıntıları özgün metinle eşleştirir.
- **Teknik bağımlılık ve sınır:** Oturum gerektiren içeriği izinsiz paylaşmaz; ücret duvarını aşmaz. Sayfa kopyasının kapsamı ve telif bilgisi gösterilir.
- **Gelir hipotezi:** Ücretsiz yakalama; Pro arşiv arama ve sınırlı AI kredisi.
- **Doğrulama ölçütü:** Kaynak metne bağlı özet cümlesi ≥%95; 20 sayfada temel metin yakalama başarısı.
- **Öncelik ve efor:** P0 · S; Note Master’a kaynaklı okuma modülü olarak da sunulabilir.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
