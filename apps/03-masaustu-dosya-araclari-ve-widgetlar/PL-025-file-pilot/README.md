# PL-025 · File Pilot

> Dosyaları önizlemeli kurallarla yeniden adlandırır, sınıflandırır ve klasörlere yerleştirir.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-025` · `file-pilot` |
| Kategori | 03 · Masaüstü, dosya araçları ve widget’lar — PL-021–030 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · L |
| Hedef platformlar | Windows, Linux, macOS |
| Dağıtım biçimi | masaüstü uygulaması |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-025 · File Pilot` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f98193b5c3ef18528e0c83) |

## Ne işe yarar

**Kullanıcı ve problem:** Klasör adını hatırlayıp dosya adını hatırlamayan bilgi çalışanları.

**Kısa tanım (Hub kataloğu):** Dosyaları önizlemeli kurallarla yeniden adlandırır, sınıflandırır ve klasörlere yerleştirir.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** W / L / M dosya penceresi

- Windows
- Linux
- macOS

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kullanıcının seçtiği dizinleri indeksle; ad/metin/etiket araması ve önizleme. İlk sürüm az sayıda metin biçimi.

### Yapay zekânın rolü

Anlamsal sorgu ve benzer belge; cevap varsa dosya yoluna ve metin bölümüne bağlar.

## Teknik bağımlılık ve sınırlar

Yerel indeks, dizin hariç tutma ve şifreli belge desteğinin sınırları. Dosya taşıma bu ürünün kapsamı değil.

## Gelir hipotezi

Pro lisans; ekip içi paylaşımlı indeks ayrı sürüm.

## Doğrulama ölçütü

1000 belgede bilinen dosyayı ilk 5 sonuçta bulma ≥%90; p95 sorgu ≤1 sn.

## Öncelik ve efor

P1 · L; Desk Tidy ile karıştırılmayan arama odaklı ürün.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-025-<konu>` veya `claude/PL-025-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** W / L / M dosya penceresi
- **Kullanıcı ve problem:** Klasör adını hatırlayıp dosya adını hatırlamayan bilgi çalışanları.
- **MVP ve temel akış:** Kullanıcının seçtiği dizinleri indeksle; ad/metin/etiket araması ve önizleme. İlk sürüm az sayıda metin biçimi.
- **Yapay zekânın rolü:** Anlamsal sorgu ve benzer belge; cevap varsa dosya yoluna ve metin bölümüne bağlar.
- **Teknik bağımlılık ve sınır:** Yerel indeks, dizin hariç tutma ve şifreli belge desteğinin sınırları. Dosya taşıma bu ürünün kapsamı değil.
- **Gelir hipotezi:** Pro lisans; ekip içi paylaşımlı indeks ayrı sürüm.
- **Doğrulama ölçütü:** 1000 belgede bilinen dosyayı ilk 5 sonuçta bulma ≥%90; p95 sorgu ≤1 sn.
- **Öncelik ve efor:** P1 · L; Desk Tidy ile karıştırılmayan arama odaklı ürün.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
