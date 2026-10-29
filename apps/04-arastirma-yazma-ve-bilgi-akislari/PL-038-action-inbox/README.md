# PL-038 · Action Inbox

> Sayfa, mesaj ve e-postalardan seçilen yapılacakları kaynaklı bir görev kuyruğunda toplar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-038` · `action-inbox` |
| Kategori | 04 · Araştırma, yazma ve bilgi akışları — PL-031–040 |
| Durum | Yeni fikir |
| Öncelik / efor | P1 · M |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3), widget |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-038 · Action Inbox` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981c08edfda43643b31fc) |

## Ne işe yarar

**Kullanıcı ve problem:** E-posta, sayfa ve mesajlarda kalan yapılacakları tek yerde toplamak isteyen kişiler.

**Kısa tanım (Hub kataloğu):** Sayfa, mesaj ve e-postalardan seçilen yapılacakları kaynaklı bir görev kuyruğunda toplar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome + W / L / M görev kutusu/widget

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Kullanıcı seçtiği metni görev adayı olarak kaydeder; kaynak URL, tarih önerisi ve inceleme kuyruğu. İlk sürüm otomatik kaynak izleme yok.

### Yapay zekânın rolü

Fiil, son tarih ve gerekli materyali çıkarır; kişi ataması taslaktır.

## Teknik bağımlılık ve sınırlar

Mail Triage sınıflandırır; Action Inbox kaynaklar arası tek görev kuyruğunu yönetir. Aynı iş için tekrar görev tespiti gerekir.

## Gelir hipotezi

Ücretsiz kişisel kuyruk; Pro bağlayıcı ve ekip akışı.

## Doğrulama ölçütü

Kaynaklı görev tamamlama haftalık ölçülür; yinelenen görev \<%3.

## Öncelik ve efor

P1 · M; Note Master görev şeması ve Flow Dock hızlı yakalaması ortak.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-038-<konu>` veya `claude/PL-038-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome + W / L / M görev kutusu/widget
- **Kullanıcı ve problem:** E-posta, sayfa ve mesajlarda kalan yapılacakları tek yerde toplamak isteyen kişiler.
- **MVP ve temel akış:** Kullanıcı seçtiği metni görev adayı olarak kaydeder; kaynak URL, tarih önerisi ve inceleme kuyruğu. İlk sürüm otomatik kaynak izleme yok.
- **Yapay zekânın rolü:** Fiil, son tarih ve gerekli materyali çıkarır; kişi ataması taslaktır.
- **Teknik bağımlılık ve sınır:** Mail Triage sınıflandırır; Action Inbox kaynaklar arası tek görev kuyruğunu yönetir. Aynı iş için tekrar görev tespiti gerekir.
- **Gelir hipotezi:** Ücretsiz kişisel kuyruk; Pro bağlayıcı ve ekip akışı.
- **Doğrulama ölçütü:** Kaynaklı görev tamamlama haftalık ölçülür; yinelenen görev \<%3.
- **Öncelik ve efor:** P1 · M; Note Master görev şeması ve Flow Dock hızlı yakalaması ortak.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
