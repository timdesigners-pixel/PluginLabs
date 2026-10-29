# PL-031 · Source Trail

> Araştırma kaynaklarını, alıntıları ve notları bağlantılarıyla ilişkilendirerek izlenebilir bir arşiv oluşturur.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-031` · `source-trail` |
| Kategori | 04 · Araştırma, yazma ve bilgi akışları — PL-031–040 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
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
