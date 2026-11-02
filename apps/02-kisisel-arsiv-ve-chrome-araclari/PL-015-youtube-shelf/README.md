# PL-015 · YouTube Shelf

> YouTube videolarını izleme listelerine ayırır; notları ve ilgili kaynakları video bağlantısıyla saklar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-015` · `youtube-shelf` |
| Kategori | 02 · Kişisel arşiv ve Chrome araçları — PL-011–020 |
| Durum | Mevcut oynatma listesi düzenleme görevi · yeni ürün adı |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3), widget |
| Geliştirme deposu | [timdesigners-pixel/youtube-shelf](https://github.com/timdesigners-pixel/youtube-shelf) · Windows sürümü [v0.1.1](https://github.com/timdesigners-pixel/youtube-shelf/releases/tag/v0.1.1) |
| Codex projesi | `PL-015 · YouTube Shelf` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981caa69dd557ce408743) |

## Ne işe yarar

**Kullanıcı ve problem:** Oynatma listelerinde biriken videolarını amaca göre izlemek isteyen kullanıcılar.

**Kısa tanım (Hub kataloğu):** YouTube videolarını izleme listelerine ayırır; notları ve ilgili kaynakları video bağlantısıyla saklar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M izleme widget’ı

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kullanıcının yetkili listelerini/URL’lerini içe al; süre, konu ve izleme sırasıyla raf görünümü. İlk sürüm okuma ve yerel plan.

### Yapay zekânın rolü

Başlık ve erişilebilir transkriptten konu kümeleri, özet ve öğrenme sırası önerir.

## Teknik bağımlılık ve sınırlar

API yetkileri/kotaları ve transkript erişimi ayrıca doğrulanır; video dosyası indirme veya DRM aşma yok. Listeyi değiştirme ayrı onaylı.

## Gelir hipotezi

Ücretsiz raf; Pro öğrenme planı ve cihazlar arası ilerleme.

## Doğrulama ölçütü

İlk hafta listeden gerçekten izlenen video oranında artış; konu önerisi kabulü ≥%75.

## Öncelik ve efor

P1 · M; ilk pilot tek kullanıcı ve okuma odaklı.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-015-<konu>` veya `claude/PL-015-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut oynatma listesi düzenleme görevi · yeni ürün adı
- **Platform:** Chrome + W / L / M izleme widget’ı
- **Kullanıcı ve problem:** Oynatma listelerinde biriken videolarını amaca göre izlemek isteyen kullanıcılar.
- **MVP ve temel akış:** Kullanıcının yetkili listelerini/URL’lerini içe al; süre, konu ve izleme sırasıyla raf görünümü. İlk sürüm okuma ve yerel plan.
- **Yapay zekânın rolü:** Başlık ve erişilebilir transkriptten konu kümeleri, özet ve öğrenme sırası önerir.
- **Teknik bağımlılık ve sınır:** API yetkileri/kotaları ve transkript erişimi ayrıca doğrulanır; video dosyası indirme veya DRM aşma yok. Listeyi değiştirme ayrı onaylı.
- **Gelir hipotezi:** Ücretsiz raf; Pro öğrenme planı ve cihazlar arası ilerleme.
- **Doğrulama ölçütü:** İlk hafta listeden gerçekten izlenen video oranında artış; konu önerisi kabulü ≥%75.
- **Öncelik ve efor:** P1 · M; ilk pilot tek kullanıcı ve okuma odaklı.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
