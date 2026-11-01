# PL-031 · Source Trail

> Araştırma kaynaklarını, alıntıları ve notları bağlantılarıyla ilişkilendirerek izlenebilir bir arşiv oluşturur.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-031` · `source-trail` |
| Kategori | 04 · Araştırma, yazma ve bilgi akışları — PL-031–040 |
| Durum | 01.11.2026: **0.1.0 Windows uygulaması yayımlandı** — [source-trail-v0.1.0](https://github.com/timdesigners-pixel/pluginlabs-dagitim/releases/tag/source-trail-v0.1.0) (`pluginlabs-dagitim`, Windows runner: test + duman testi + SHA256 + BUILD-INFO + Windows ekran görüntüleri); kaynak [app/](app/README.md); Hub 0.4.11 kataloğunda · Notion durumu: Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — kaynak bu klasörün [`app/`](app/README.md) alt klasöründe (ön geliştirme alanı; bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)); Windows derlemesi ve sürüm dosyaları `pluginlabs-dagitim` deposunda (iş akışı: [`app/ci/`](app/ci/pluginlabs-dagitim-source-trail-windows.yml)) |
| Codex projesi | `PL-031 · Source Trail` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981c08edfda43643b31fc) |

## Ne işe yarar

**Kullanıcı ve problem:** Bir araştırma sonucunun hangi sayfaya ve alıntıya dayandığını kaybeden öğrenciler/analistler.

**Kısa tanım (Hub kataloğu):** Araştırma kaynaklarını, alıntıları ve notları bağlantılarıyla ilişkilendirerek izlenebilir bir arşiv oluşturur.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M kaynak arşivi

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Seçili metin, URL, erişim tarihi ve kişisel notu kaynak kartına al; iddia-kaynak ilişkisi ve kaynakça dışa aktar.

### Yapay zekânın rolü

Birden çok kaynağın aynı iddiayı destekleyip desteklemediğini taslak olarak karşılaştırır; alıntıyı uydurmaz.

## Teknik bağımlılık ve sınırlar

Kaynak metnin erişilebilirliği, özel sayfalar ve alıntı hakları. Aynı kaynağın kopyalarını bağımsız doğrulama saymaz.

## Gelir hipotezi

Ücretsiz kişisel araştırma; Pro proje/ekip kaynak alanı.

## Doğrulama ölçütü

İddia kartlarının %100’ünde erişilebilir kayıtlı kaynak veya açık eksik etiketi.

## Öncelik ve efor

P1 · M; Page Capsule yakalar, bu ürün iddia ve kanıt izini yönetir.

## 0.1.0 sürümü (Windows)

Tarayıcıda seçilen metin ve adres kopyalanıp **Panodan yakala** ile (pano yalnız kullanıcı eylemiyle okunur) ya da elle **kaynak kartına** alınır: seçili metin/alıntı, adres (izleme parametreleri ve # atılır), erişim tarihi, tür, yazar, yayıncı, yayın tarihi, kişisel not, proje. **İddia kartına** kaynak bağlanır (destekler / çürütür / bağlam); dayanak alıntı kaynak kartındaki metinde **aynen** yoksa bağ kaydedilmez. Kaynağı olmayan iddia açıkça **eksik kanıt** olarak etiketlenir; Notion doğrulama ölçütü (iddia kartlarının %100'ünde erişilebilir kayıtlı kaynak veya açık eksik etiketi) kenar çubuğunda ve Ölçüler'de canlı gösterilir. **Aynı kaynağın kopyaları** (aynı kanonik adres, aynı alıntı metni, aynı başlık + yazar ya da kullanıcı işareti) tek bağımsız kaynak sayılır; iddia durumu bağımsız destek sayısıyla hesaplanır (Kanıtlı ≥2 / Tek kaynak / Çelişkili / Eksik / Kaynaksız). Ulaşılamıyor işaretli ya da künyesi eksik kaynak kanıt sayılmaz. **Kaynakça:** APA 7, MLA 9, BibTeX, CSL-JSON, Markdown kanıt izi (panoya ya da dosyaya; kapsam ve proje süzgeci); JSON yedek. **MyMind** (Hub üzerinden, her istekte onaylı) iddia–kaynak karşılaştırma taslağı üretir: yalnız iddia metni ile bağlı kaynakların başlığı ve kayıtlı alıntısı gider; önerilen alıntı kaynakta aynen yoksa atılır (alıntı uydurmaz) ve ilişki “belirsiz” olur; kullanıcı “Uygula” demeden bağ değişmez. Silme yok, arşivleme var; kayıt Windows kasasıyla (DPAPI) şifreli.

![Source Trail — iddia ve kanıtlar](app/docs/screenshots/masaustu-01-iddia-ve-kanitlar.png)

Kapsam dışı (bu sürüm): Chrome eklentisi (sayfada seçimi doğrudan yakalama), Linux/macOS paketleri, BibTeX/RIS içe aktarma, ekip/proje alanı (Pro). Ayrıntı: [app/README.md](app/README.md).

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-031-<konu>` veya `claude/PL-031-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome + W / L / M kaynak arşivi
- **Kullanıcı ve problem:** Bir araştırma sonucunun hangi sayfaya ve alıntıya dayandığını kaybeden öğrenciler/analistler.
- **MVP ve temel akış:** Seçili metin, URL, erişim tarihi ve kişisel notu kaynak kartına al; iddia-kaynak ilişkisi ve kaynakça dışa aktar.
- **Yapay zekânın rolü:** Birden çok kaynağın aynı iddiayı destekleyip desteklemediğini taslak olarak karşılaştırır; alıntıyı uydurmaz.
- **Teknik bağımlılık ve sınır:** Kaynak metnin erişilebilirliği, özel sayfalar ve alıntı hakları. Aynı kaynağın kopyalarını bağımsız doğrulama saymaz.
- **Gelir hipotezi:** Ücretsiz kişisel araştırma; Pro proje/ekip kaynak alanı.
- **Doğrulama ölçütü:** İddia kartlarının %100’ünde erişilebilir kayıtlı kaynak veya açık eksik etiketi.
- **Öncelik ve efor:** P1 · M; Page Capsule yakalar, bu ürün iddia ve kanıt izini yönetir.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
