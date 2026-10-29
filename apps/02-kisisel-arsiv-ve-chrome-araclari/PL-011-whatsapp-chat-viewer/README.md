# PL-011 · WhatsApp Chat Viewer

> Dışa aktarılan WhatsApp sohbetlerini cihazda açar; mesajlarda arama, filtreleme ve arşivleme sunar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-011` · `whatsapp-chat-viewer` |
| Kategori | 02 · Kişisel arşiv ve Chrome araçları — PL-011–020 |
| Durum | Mevcut kişisel kullanım fikri · ürünleşme önerisi |
| Öncelik / efor | P2 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-011 · WhatsApp Chat Viewer` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981caa69dd557ce408743) |

## Ne işe yarar

**Kullanıcı ve problem:** Kendi dışa aktardığı sohbetleri okunabilir ve aranabilir bir arşivde görmek isteyen kişiler.

**Kısa tanım (Hub kataloğu):** Dışa aktarılan WhatsApp sohbetlerini cihazda açar; mesajlarda arama, filtreleme ve arşivleme sunar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M yerel görüntüleyici; Chrome isteğe bağlı

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

WhatsApp dışa aktarım ZIP/TXT dosyasını içe al; zaman çizgisi, kişi/tarih filtresi, medya eşleştirme ve seçili aralığı dışa aktar.

### Yapay zekânın rolü

Yerel ya da açık onaylı modelle konu ve karar özeti; her sonuç mesaj ve tarih referansına bağlı.

## Teknik bağımlılık ve sınırlar

Canlı hesap oturumu ele geçirilmez; üçüncü kişilerin mesajlarına erişim sağlanmaz. Büyük arşivlerde yerel indeks ve şifreli saklama gerekir.

## Gelir hipotezi

Tek seferlik masaüstü lisansı; ücretli büyük arşiv ve gelişmiş arama.

## Doğrulama ölçütü

100 bin mesajlı örnek arşivde arama p95 ≤1 sn; tarih/saat dönüşümü testleri.

## Öncelik ve efor

P2 · M; önce kendi dışa aktarımlarında biçim uyumluluğu.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-011-<konu>` veya `claude/PL-011-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut kişisel kullanım fikri · ürünleşme önerisi
- **Platform:** W / L / M yerel görüntüleyici; Chrome isteğe bağlı
- **Kullanıcı ve problem:** Kendi dışa aktardığı sohbetleri okunabilir ve aranabilir bir arşivde görmek isteyen kişiler.
- **MVP ve temel akış:** WhatsApp dışa aktarım ZIP/TXT dosyasını içe al; zaman çizgisi, kişi/tarih filtresi, medya eşleştirme ve seçili aralığı dışa aktar.
- **Yapay zekânın rolü:** Yerel ya da açık onaylı modelle konu ve karar özeti; her sonuç mesaj ve tarih referansına bağlı.
- **Teknik bağımlılık ve sınır:** Canlı hesap oturumu ele geçirilmez; üçüncü kişilerin mesajlarına erişim sağlanmaz. Büyük arşivlerde yerel indeks ve şifreli saklama gerekir.
- **Gelir hipotezi:** Tek seferlik masaüstü lisansı; ücretli büyük arşiv ve gelişmiş arama.
- **Doğrulama ölçütü:** 100 bin mesajlı örnek arşivde arama p95 ≤1 sn; tarih/saat dönüşümü testleri.
- **Öncelik ve efor:** P2 · M; önce kendi dışa aktarımlarında biçim uyumluluğu.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
