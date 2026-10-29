# PL-008 · Prompt Dünyası

> AI komutlarını şablonlar halinde saklar, değişkenlerle doldurur ve yeniden kullanır.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-008` · `prompt-dunyasi` |
| Kategori | 01 · Mevcut ürünler ve fikirler — PL-001–010 |
| Durum | Mevcut fikir · Proje ve Fikirler notu |
| Öncelik / efor | P0 · S |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-008 · Prompt Dünyası` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981edbfa2cdc55d867114) |

## Ne işe yarar

**Kullanıcı ve problem:** Yararlı komutlarını ve model ayarlarını kaybeden AI kullanıcıları.

**Kısa tanım (Hub kataloğu):** AI komutlarını şablonlar halinde saklar, değişkenlerle doldurur ve yeniden kullanır.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M komut penceresi

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Şablon, değişken alanları, sürüm geçmişi, örnek çıktı ve kopyala/çalıştır. İlk sürüm tek sağlayıcı adaptörü + dışa aktarma.

### Yapay zekânın rolü

Göreve uygun şablon önerir; iki şablonun çıktısını aynı test kümesinde karşılaştırır.

## Teknik bağımlılık ve sınırlar

Anahtarlar işletim sistemi kasasında; ham istemler telemetriye gitmez. Kullanıcı hesabı oturumları kazınmaz.

## Gelir hipotezi

Ücretsiz özel kütüphane; Pro değerlendirme, ekip şablonları ve kredi bazlı AI.

## Doğrulama ölçütü

Tekrar kullanılan şablon oranı ≥%40; görev başına token maliyeti görünür.

## Öncelik ve efor

P0 · S; tarayıcı öncelikli hızlı kullanıcı doğrulama ürünü.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-008-<konu>` veya `claude/PL-008-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut fikir · Proje ve Fikirler notu
- **Platform:** Chrome + W / L / M komut penceresi
- **Kullanıcı ve problem:** Yararlı komutlarını ve model ayarlarını kaybeden AI kullanıcıları.
- **MVP ve temel akış:** Şablon, değişken alanları, sürüm geçmişi, örnek çıktı ve kopyala/çalıştır. İlk sürüm tek sağlayıcı adaptörü + dışa aktarma.
- **Yapay zekânın rolü:** Göreve uygun şablon önerir; iki şablonun çıktısını aynı test kümesinde karşılaştırır.
- **Teknik bağımlılık ve sınır:** Anahtarlar işletim sistemi kasasında; ham istemler telemetriye gitmez. Kullanıcı hesabı oturumları kazınmaz.
- **Gelir hipotezi:** Ücretsiz özel kütüphane; Pro değerlendirme, ekip şablonları ve kredi bazlı AI.
- **Doğrulama ölçütü:** Tekrar kullanılan şablon oranı ≥%40; görev başına token maliyeti görünür.
- **Öncelik ve efor:** P0 · S; tarayıcı öncelikli hızlı kullanıcı doğrulama ürünü.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
