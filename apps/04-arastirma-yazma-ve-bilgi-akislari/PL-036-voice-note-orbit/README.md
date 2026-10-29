# PL-036 · Voice Note Orbit

> Kısa ses notlarını kaydeder, metne dönüştürür ve not veya görev olarak düzenler.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-036` · `voice-note-orbit` |
| Kategori | 04 · Araştırma, yazma ve bilgi akışları — PL-031–040 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS |
| Dağıtım biçimi | masaüstü uygulaması, yüzen balon |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-036 · Voice Note Orbit` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981c08edfda43643b31fc) |

## Ne işe yarar

**Kullanıcı ve problem:** Aklına gelen işi yazmadan yakalamak isteyen hareketli bilgi çalışanları.

**Kısa tanım (Hub kataloğu):** Kısa ses notlarını kaydeder, metne dönüştürür ve not veya görev olarak düzenler.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M kayıt balonu

- Windows
- Linux
- macOS

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Basılı tutarak not kaydet → transkripti düzelt → görev/not olarak kaydet. İlk sürüm kısa ses notları ve yerel dosya.

### Yapay zekânın rolü

Konuşmayı metne çevirir, görev/tarih taslağı çıkarır; belirsiz tarih için kullanıcı seçimi ister.

## Teknik bağımlılık ve sınırlar

Mikrofon izni ve görünür kayıt göstergesi; sürekli dinleme yok. Dosya ve transkript silme ayrı kontrol.

## Gelir hipotezi

Ücretsiz kısa kayıt; Pro transkripsiyon kotası ve iş akışı şablonları.

## Doğrulama ölçütü

30 sn notu kaydetme akışı ≤3 tık; görev tarihi doğru çıkarma ≥%90.

## Öncelik ve efor

P1 · M; Meeting Trace’den farklı olarak kişisel tek konuşmacı yakalama.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-036-<konu>` veya `claude/PL-036-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** W / L / M kayıt balonu
- **Kullanıcı ve problem:** Aklına gelen işi yazmadan yakalamak isteyen hareketli bilgi çalışanları.
- **MVP ve temel akış:** Basılı tutarak not kaydet → transkripti düzelt → görev/not olarak kaydet. İlk sürüm kısa ses notları ve yerel dosya.
- **Yapay zekânın rolü:** Konuşmayı metne çevirir, görev/tarih taslağı çıkarır; belirsiz tarih için kullanıcı seçimi ister.
- **Teknik bağımlılık ve sınır:** Mikrofon izni ve görünür kayıt göstergesi; sürekli dinleme yok. Dosya ve transkript silme ayrı kontrol.
- **Gelir hipotezi:** Ücretsiz kısa kayıt; Pro transkripsiyon kotası ve iş akışı şablonları.
- **Doğrulama ölçütü:** 30 sn notu kaydetme akışı ≤3 tık; görev tarihi doğru çıkarma ≥%90.
- **Öncelik ve efor:** P1 · M; Meeting Trace’den farklı olarak kişisel tek konuşmacı yakalama.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
