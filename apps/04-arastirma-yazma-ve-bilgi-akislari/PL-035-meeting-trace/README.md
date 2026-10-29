# PL-035 · Meeting Trace

> İzinli kayıt veya yüklenen transkriptten zaman damgalı toplantı notları, kararlar ve görev taslakları çıkarır.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-035` · `meeting-trace` |
| Kategori | 04 · Araştırma, yazma ve bilgi akışları — PL-031–040 |
| Durum | Yeni fikir |
| Öncelik / efor | P2 · L |
| Hedef platformlar | Windows, Linux, macOS |
| Dağıtım biçimi | masaüstü uygulaması |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-035 · Meeting Trace` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981c08edfda43643b31fc) |

## Ne işe yarar

**Kullanıcı ve problem:** Toplantı kararlarını ve görev sahiplerini sonradan bulamayan ekipler.

**Kısa tanım (Hub kataloğu):** İzinli kayıt veya yüklenen transkriptten zaman damgalı toplantı notları, kararlar ve görev taslakları çıkarır.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M; tarayıcı toplantı yakalama isteğe bağlı

- Windows
- Linux
- macOS

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

İzinli ses kaydı veya kullanıcı yüklediği transkript → zaman damgalı not → karar/görev taslağı → insan onayı.

### Yapay zekânın rolü

Konuşmacı ayrımı ve karar çıkarımı; konuşmacı kimliğinin belirsiz olduğu yerde tahmin etiketli.

## Teknik bağımlılık ve sınırlar

Kayıt için katılımcı bilgilendirme/izin akışı ve kaynak platform kuralları. İlk sürüm yüklenen dosyada; gizli sürekli kayıt yok.

## Gelir hipotezi

Dakika bazlı kredi + ekip lisansı.

## Doğrulama ölçütü

Elle etiketli örneklerde görev çıkarma kesinliği ≥%90; atanan kişi belirsizlikleri görünür.

## Öncelik ve efor

P2 · L; gerçek zamanlı çok platform ses yakalama sonraki faz.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-035-<konu>` veya `claude/PL-035-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** W / L / M; tarayıcı toplantı yakalama isteğe bağlı
- **Kullanıcı ve problem:** Toplantı kararlarını ve görev sahiplerini sonradan bulamayan ekipler.
- **MVP ve temel akış:** İzinli ses kaydı veya kullanıcı yüklediği transkript → zaman damgalı not → karar/görev taslağı → insan onayı.
- **Yapay zekânın rolü:** Konuşmacı ayrımı ve karar çıkarımı; konuşmacı kimliğinin belirsiz olduğu yerde tahmin etiketli.
- **Teknik bağımlılık ve sınır:** Kayıt için katılımcı bilgilendirme/izin akışı ve kaynak platform kuralları. İlk sürüm yüklenen dosyada; gizli sürekli kayıt yok.
- **Gelir hipotezi:** Dakika bazlı kredi + ekip lisansı.
- **Doğrulama ölçütü:** Elle etiketli örneklerde görev çıkarma kesinliği ≥%90; atanan kişi belirsizlikleri görünür.
- **Öncelik ve efor:** P2 · L; gerçek zamanlı çok platform ses yakalama sonraki faz.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
