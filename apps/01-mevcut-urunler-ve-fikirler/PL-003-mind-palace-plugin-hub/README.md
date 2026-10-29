# PL-003 · Mind Palace Plugin Hub

> Notları, görevleri, finans kayıtlarını ve eklentileri tek bir kişisel çalışma alanında birleştirir.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-003` · `mind-palace-plugin-hub` |
| Kategori | 01 · Mevcut ürünler ve fikirler — PL-001–010 |
| Durum | Mevcut proje notu · kapsam genişletme önerisi |
| Öncelik / efor | P1 · XL |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | [timdesigners-pixel/mind-palace](https://github.com/timdesigners-pixel/mind-palace) |
| Codex projesi | `PL-003 · Mind Palace Plugin Hub` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981edbfa2cdc55d867114) |

## Ne işe yarar

**Kullanıcı ve problem:** Not, görev, finans ve görsel koleksiyonlarını ayrı araçlarda tutan bilgi çalışanları.

**Kısa tanım (Hub kataloğu):** Notları, görevleri, finans kayıtlarını ve eklentileri tek bir kişisel çalışma alanında birleştirir.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M; Chrome yakalama eklentisi

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Komuta merkezi, eklenti kataloğu, menü grupları, hızlı ekle ve veri görünümleri. İlk sürüm yalnız not + görev + bir koleksiyon eklentisi.

### Yapay zekânın rolü

Doğal dil komutunu yapılandırılmış taslak kayda çevirir; kullanıcı kaydetmeden önce sonucu görür.

## Teknik bağımlılık ve sınırlar

Eklenti başına veri/eylem yetkisi, sürüm uyumu ve dışa aktarma. Mevcut Pinterest işindeki açık bulut tercihi korunur; bütün ürünlere tek depolama kuralı dayatılmaz.

## Gelir hipotezi

Ücretsiz kişisel alan; Pro senkronizasyon ve ücretli eklenti paketleri.

## Doğrulama ölçütü

Haftalık 3 farklı modül kullanımı; eklenti kurulumunu tamamlama ≥%80.

## Öncelik ve efor

P1 · XL; ilk çeyrekte tüm yaşam platformunu yeniden yazma hedeflenmez.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-003-<konu>` veya `claude/PL-003-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut proje notu · kapsam genişletme önerisi
- **Platform:** W / L / M; Chrome yakalama eklentisi
- **Kullanıcı ve problem:** Not, görev, finans ve görsel koleksiyonlarını ayrı araçlarda tutan bilgi çalışanları.
- **MVP ve temel akış:** Komuta merkezi, eklenti kataloğu, menü grupları, hızlı ekle ve veri görünümleri. İlk sürüm yalnız not + görev + bir koleksiyon eklentisi.
- **Yapay zekânın rolü:** Doğal dil komutunu yapılandırılmış taslak kayda çevirir; kullanıcı kaydetmeden önce sonucu görür.
- **Teknik bağımlılık ve sınır:** Eklenti başına veri/eylem yetkisi, sürüm uyumu ve dışa aktarma. Mevcut Pinterest işindeki açık bulut tercihi korunur; bütün ürünlere tek depolama kuralı dayatılmaz.
- **Gelir hipotezi:** Ücretsiz kişisel alan; Pro senkronizasyon ve ücretli eklenti paketleri.
- **Doğrulama ölçütü:** Haftalık 3 farklı modül kullanımı; eklenti kurulumunu tamamlama ≥%80.
- **Öncelik ve efor:** P1 · XL; ilk çeyrekte tüm yaşam platformunu yeniden yazma hedeflenmez.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
