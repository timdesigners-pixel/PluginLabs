# PL-037 · Mail Triage

> Seçilen e-postalar için etiket, öncelik ve yanıt taslakları önerir.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-037` · `mail-triage` |
| Kategori | 04 · Araştırma, yazma ve bilgi akışları — PL-031–040 |
| Durum | Mevcut e-posta kategorizasyon görevinden yeni ürün önerisi |
| Öncelik / efor | P1 · L |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-037 · Mail Triage` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981c08edfda43643b31fc) |

## Ne işe yarar

**Kullanıcı ve problem:** Gelen kutusunda öncelik, fatura ve yanıt bekleyen işleri ayırmak isteyen kişiler.

**Kısa tanım (Hub kataloğu):** Seçilen e-postalar için etiket, öncelik ve yanıt taslakları önerir.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome; izinli e-posta API’siyle W / L / M panel

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Seçili e-postaları incele, etiket ve öncelik öner; toplu değişiklik önizlemesi göster. İlk pilot salt okunur.

### Yapay zekânın rolü

Eylem/tarih/konu çıkarır ve kısa yanıt taslağı sunar; mesaj gönderimi otomatik değil.

## Teknik bağımlılık ve sınırlar

OAuth kapsamları, sağlayıcı doğrulaması ve hassas içerik kısıtları. İlk sürüm tüm kutuyu dış servise taşımaz.

## Gelir hipotezi

Bireysel Pro; ekip ortak gelen kutusu paketi daha sonra.

## Doğrulama ölçütü

Önerilen etiket kabulü ≥%85; önemli e-postayı yanlış düşük öncelikleme \<%2.

## Öncelik ve efor

P1 · L; sağlayıcı izin/onay süresi takvime dahil.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-037-<konu>` veya `claude/PL-037-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Mevcut e-posta kategorizasyon görevinden yeni ürün önerisi
- **Platform:** Chrome; izinli e-posta API’siyle W / L / M panel
- **Kullanıcı ve problem:** Gelen kutusunda öncelik, fatura ve yanıt bekleyen işleri ayırmak isteyen kişiler.
- **MVP ve temel akış:** Seçili e-postaları incele, etiket ve öncelik öner; toplu değişiklik önizlemesi göster. İlk pilot salt okunur.
- **Yapay zekânın rolü:** Eylem/tarih/konu çıkarır ve kısa yanıt taslağı sunar; mesaj gönderimi otomatik değil.
- **Teknik bağımlılık ve sınır:** OAuth kapsamları, sağlayıcı doğrulaması ve hassas içerik kısıtları. İlk sürüm tüm kutuyu dış servise taşımaz.
- **Gelir hipotezi:** Bireysel Pro; ekip ortak gelen kutusu paketi daha sonra.
- **Doğrulama ölçütü:** Önerilen etiket kabulü ≥%85; önemli e-postayı yanlış düşük öncelikleme \<%2.
- **Öncelik ve efor:** P1 · L; sağlayıcı izin/onay süresi takvime dahil.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
