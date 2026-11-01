# PL-025 · File Pilot

> Dosyaları önizlemeli kurallarla yeniden adlandırır, sınıflandırır ve klasörlere yerleştirir.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-025` · `file-pilot` |
| Kategori | 03 · Masaüstü, dosya araçları ve widget’lar — PL-021–030 |
| Durum | 01.11.2026: **0.1.0 Windows uygulaması** yayımlandı — [file-pilot-v0.1.0](https://github.com/timdesigners-pixel/pluginlabs-dagitim/releases/tag/file-pilot-v0.1.0) (imzasız önizleme; kaynak: [app/](app/README.md)) · Notion durumu: Yeni fikir |
| Öncelik / efor | P1 · L |
| Hedef platformlar | Windows, Linux, macOS |
| Dağıtım biçimi | masaüstü uygulaması (Windows yayımlandı; Linux/macOS paketi yok) |
| Geliştirme deposu | Henüz yok — kaynak bu klasörün [`app/`](app/README.md) alt klasöründe (ön geliştirme alanı; bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)); Windows derlemesi ve sürüm dosyaları `pluginlabs-dagitim` deposunda |
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

### 0.1.0 (01.11.2026, Claude Code — zamanlanmış görev)

Notion kartındaki çelişki: kısa tanım "yeniden adlandırır, sınıflandırır, klasörlere yerleştirir" derken MVP "dizinleri indeksle; ad/metin/etiket araması ve önizleme" ve sınır "Dosya taşıma bu ürünün kapsamı değil" der; öncelik notu "Desk Tidy ile karıştırılmayan arama odaklı ürün". 0.1.0 MVP ve sınıra uyar: **arama odaklı, dosyaları yalnız okur** (düzenleme/taşıma PL-021 Desk Tidy'de).

- Seçilen klasörleri indeksler (ad, klasör yolu, metin dosyası içeriği; artımlı; hariç tutma, gizli dosya, boyut sınırı; sembolik bağlantı izlenmez; ikili/şifreli içerik "okunamadı").
- Türkçe duyarsız ve ekli biçimlere dayanıklı arama (BM25 + ad/klasör eşleşmesi), `#etiket`, `tür:`, `uzantı:`, `"tam ifade"`, `-hariç`.
- Satır numaralı eşleşen bölüm önizlemesi; aç / klasörde göster / yolu kopyala; etiketler (yalnız indekste); benzer belge.
- MyMind ile anlamsal soru (Hub üzerinden, her seferinde onaylı; yalnız soru + ≤8 dosya adı + ≤360 karakterlik bölümler); yanıt dosya ve satıra bağlanır, alıntı doğrulanır.
- İndeks ve MyMind anahtarı Windows kasasıyla (DPAPI) şifreli.
- Doğrulama ölçütü sentetik 1000 belgelik derlemle ölçülür (Linux: ilk 5 ≈ %99, p95 ≈ 7 ms; Windows paketlenmiş uygulamada ölçülen değer release'teki `BUILD-INFO-windows.txt` / `BENCH-windows.json`). Gerçek klasörlerde kullanıcı kabulü yapılmadı.
- Okunmayanlar: PDF, Office belgeleri (adıyla bulunur). Dosya izleme yok (açılışta / "Yeniden tara").

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
