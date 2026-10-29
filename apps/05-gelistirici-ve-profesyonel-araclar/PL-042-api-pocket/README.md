# PL-042 · API Pocket

> API isteklerini şablonlarla gönderir, ortam değişkenlerini kullanır ve yanıtları biçimlendirir.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-042` · `api-pocket` |
| Kategori | 05 · Geliştirici ve profesyonel araçlar — PL-041–050 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-042 · API Pocket` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981059dfad209ce1240d1) |

## Ne işe yarar

**Kullanıcı ve problem:** Küçük API çağrılarını büyük araç açmadan test etmek isteyen geliştiriciler.

**Kısa tanım (Hub kataloğu):** API isteklerini şablonlarla gönderir, ortam değişkenlerini kullanır ve yanıtları biçimlendirir.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome paneli + W / L / M yerel istemci

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

İstek şablonu, ortam değişkenleri, yanıt biçimleme ve örnek veri; ilk sürüm GET ve kullanıcı başlatmalı istek.

### Yapay zekânın rolü

İstek taslağı ve yanıt alanlarını açıklar; doğru API belgesi varsa bağlar.

## Teknik bağımlılık ve sınırlar

Sırlar işletim sistemi kasasında; üretim ortamına yazan yöntemlerde ek önizleme. Tarayıcı CORS sınırları için masaüstü ajanı gerekebilir.

## Gelir hipotezi

Ücretsiz koleksiyon; Pro ekip şeması ve test reçeteleri.

## Doğrulama ölçütü

Örnek API’de ilk doğru istek ≤2 dk; sırların günlükte görünmesi sıfır.

## Öncelik ve efor

P1 · M; sınırsız üretim otomasyonundan uzak dar araç.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-042-<konu>` veya `claude/PL-042-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome paneli + W / L / M yerel istemci
- **Kullanıcı ve problem:** Küçük API çağrılarını büyük araç açmadan test etmek isteyen geliştiriciler.
- **MVP ve temel akış:** İstek şablonu, ortam değişkenleri, yanıt biçimleme ve örnek veri; ilk sürüm GET ve kullanıcı başlatmalı istek.
- **Yapay zekânın rolü:** İstek taslağı ve yanıt alanlarını açıklar; doğru API belgesi varsa bağlar.
- **Teknik bağımlılık ve sınır:** Sırlar işletim sistemi kasasında; üretim ortamına yazan yöntemlerde ek önizleme. Tarayıcı CORS sınırları için masaüstü ajanı gerekebilir.
- **Gelir hipotezi:** Ücretsiz koleksiyon; Pro ekip şeması ve test reçeteleri.
- **Doğrulama ölçütü:** Örnek API’de ilk doğru istek ≤2 dk; sırların günlükte görünmesi sıfır.
- **Öncelik ve efor:** P1 · M; sınırsız üretim otomasyonundan uzak dar araç.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
