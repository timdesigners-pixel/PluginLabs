# PL-016 · Tab Atlas

> Tarayıcı sekmelerini gruplar; çalışma oturumlarını kaydeder ve yeniden açar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-016` · `tab-atlas` |
| Kategori | 02 · Kişisel arşiv ve Chrome araçları — PL-011–020 |
| Durum | Yeni fikir |
| Öncelik / efor | P0 · S |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | [timdesigners-pixel/tab-atlas](https://github.com/timdesigners-pixel/tab-atlas) · Windows release [v0.1.0](https://github.com/timdesigners-pixel/tab-atlas/releases/tag/v0.1.0) |
| Codex projesi | `PL-016 · Tab Atlas` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981caa69dd557ce408743) |

## Ne işe yarar

**Kullanıcı ve problem:** Yüzlerce sekmesini proje ve niyete göre yönetmek isteyen bilgi çalışanları.

**Kısa tanım (Hub kataloğu):** Tarayıcı sekmelerini gruplar; çalışma oturumlarını kaydeder ve yeniden açar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome; aynı tarayıcıyla W / L / M

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Açık sekmeleri projeye göre grupla; oturum kaydet, geri yükle, benzer URL’leri birleştirme öner. İlk sürüm tarayıcı içi.

### Yapay zekânın rolü

Sekme başlığı ve izinli seçili içerikten bağlamsal grup önerir; URL kuralları modelsiz çalışır.

## Teknik bağımlılık ve sınırlar

Sekme geçmişi hassas; yerel kayıt varsayılan, gizli pencere hariç. Sekme kapatma/geri yükleme geri alınabilir.

## Gelir hipotezi

Ücretsiz sınırlı çalışma alanı; Pro oturum ve ekip şablonları.

## Doğrulama ölçütü

Kullanıcıların ≥%70’i ilk gruplamayı kabul eder; kaydedilmiş oturum geri yüklemesi ≥%99.

## Öncelik ve efor

P0 · S; masaüstü ajanı gerektirmeyen giriş ürünü.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-016-<konu>` veya `claude/PL-016-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome; aynı tarayıcıyla W / L / M
- **Kullanıcı ve problem:** Yüzlerce sekmesini proje ve niyete göre yönetmek isteyen bilgi çalışanları.
- **MVP ve temel akış:** Açık sekmeleri projeye göre grupla; oturum kaydet, geri yükle, benzer URL’leri birleştirme öner. İlk sürüm tarayıcı içi.
- **Yapay zekânın rolü:** Sekme başlığı ve izinli seçili içerikten bağlamsal grup önerir; URL kuralları modelsiz çalışır.
- **Teknik bağımlılık ve sınır:** Sekme geçmişi hassas; yerel kayıt varsayılan, gizli pencere hariç. Sekme kapatma/geri yükleme geri alınabilir.
- **Gelir hipotezi:** Ücretsiz sınırlı çalışma alanı; Pro oturum ve ekip şablonları.
- **Doğrulama ölçütü:** Kullanıcıların ≥%70’i ilk gruplamayı kabul eder; kaydedilmiş oturum geri yüklemesi ≥%99.
- **Öncelik ve efor:** P0 · S; masaüstü ajanı gerektirmeyen giriş ürünü.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
