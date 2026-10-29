# PL-002 · Leo Helper

> Kodları, bağlantıları ve AFF kayıtlarını toplar, sınıflandırır ve takip eder.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-002` · `leo-helper` |
| Kategori | 01 · Mevcut ürünler ve fikirler — PL-001–010 |
| Durum | Mevcut proje notu · çalışan sürüm bu taramada doğrulanmadı |
| Öncelik / efor | P1 · L |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | [timdesigners-pixel/leo-helper](https://github.com/timdesigners-pixel/leo-helper) |
| Codex projesi | `PL-002 · Leo Helper` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981edbfa2cdc55d867114) |

## Ne işe yarar

**Kullanıcı ve problem:** İzinli sohbet ve kanallardaki kod, bağlantı ve koşulları elle takip eden kullanıcılar.

**Kısa tanım (Hub kataloğu):** Kodları, bağlantıları ve AFF kayıtlarını toplar, sınıflandırır ve takip eder.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M yardımcı uygulama

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Takip edilen sohbetleri yan panelde yönet; kod/koşul/kaynak URL tablosu, incelendi işareti, JSON dışa aktarma ve bağlantı testi sun.

### Yapay zekânın rolü

Kod değil düzeltmesiyle sınıflandırıcıya kullanıcı geri bildirimi; kodun geçerlilik koşullarını kaynağa bağlı çıkar.

## Teknik bağımlılık ve sınırlar

Telegram bağlantı durumu ve oturum saklama; yalnız kullanıcının yetkili olduğu sohbetler. Hesap sırları kasada, otomatik giriş ayrı onaylı.

## Gelir hipotezi

Bireysel Pro ve kullanım kotası; ekip içi takip paketleri daha sonra.

## Doğrulama ölçütü

İşaretlenmiş test kümesinde kod ayıklama kesinliği ≥%95; yanlış olumlu oranı izlenir.

## Öncelik ve efor

P1 · L; kaynak bağlayıcıları ve mesaj izinleri kritik.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-002-<konu>` veya `claude/PL-002-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut proje notu · çalışan sürüm bu taramada doğrulanmadı
- **Platform:** Chrome + W / L / M yardımcı uygulama
- **Kullanıcı ve problem:** İzinli sohbet ve kanallardaki kod, bağlantı ve koşulları elle takip eden kullanıcılar.
- **MVP ve temel akış:** Takip edilen sohbetleri yan panelde yönet; kod/koşul/kaynak URL tablosu, incelendi işareti, JSON dışa aktarma ve bağlantı testi sun.
- **Yapay zekânın rolü:** Kod değil düzeltmesiyle sınıflandırıcıya kullanıcı geri bildirimi; kodun geçerlilik koşullarını kaynağa bağlı çıkar.
- **Teknik bağımlılık ve sınır:** Telegram bağlantı durumu ve oturum saklama; yalnız kullanıcının yetkili olduğu sohbetler. Hesap sırları kasada, otomatik giriş ayrı onaylı.
- **Gelir hipotezi:** Bireysel Pro ve kullanım kotası; ekip içi takip paketleri daha sonra.
- **Doğrulama ölçütü:** İşaretlenmiş test kümesinde kod ayıklama kesinliği ≥%95; yanlış olumlu oranı izlenir.
- **Öncelik ve efor:** P1 · L; kaynak bağlayıcıları ve mesaj izinleri kritik.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
