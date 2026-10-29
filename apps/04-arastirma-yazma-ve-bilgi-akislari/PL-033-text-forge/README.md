# PL-033 · Text Forge

> Metinleri seçilen tona göre yeniden yazar; kısaltma, düzeltme ve biçimlendirme önerileri sunar.

| Alan | Değer |
| --- | --- |
| Kimlik | `PL-033` · `text-forge` |
| Kategori | 04 · Araştırma, yazma ve bilgi akışları — PL-031–040 |
| Durum | Yeni fikir |
| Öncelik / efor | P0 · S |
| Hedef platformlar | Windows, Linux, macOS, Chrome |
| Dağıtım biçimi | masaüstü uygulaması, Chrome eklentisi (Manifest V3) |
| Geliştirme deposu | Henüz yok — bu klasör ürünün ön geliştirme alanıdır (bkz. [repo hiyerarşisi](../../../docs/REPO-HIYERARSISI.md)) |
| Codex projesi | `PL-033 · Text Forge` — ikinci klasör: PluginLabs |
| Notion kaynağı | [Notion](https://app.notion.com/p/4038aa13d8f981c08edfda43643b31fc) |

## Ne işe yarar

**Kullanıcı ve problem:** Farklı uygulamalarda kısa metinlerini yeniden yazmak isteyen kişiler.

**Kısa tanım (Hub kataloğu):** Metinleri seçilen tona göre yeniden yazar; kısaltma, düzeltme ve biçimlendirme önerileri sunar.

## Hangi platformlar için yayınlanır

**Notion’daki platform tanımı:** Chrome seçili metin menüsü + W / L / M hızlı pencere

- Windows
- Linux
- macOS
- Chrome

> Platformlar hedef kapsamdır. PluginLabs ürün ilkesi gereği test edilmemiş platform “destekleniyor” diye etiketlenmez; her platform gerçek cihaz/tarayıcı kabulünden sonra yayın listesine girer.

## Özellikler

### MVP ve temel akış

Seçili metni sadeleştir, kısalt, dil bilgisi düzelt; fark görünümü ve kopyala. Kaynak uygulamaya yazma kullanıcı eylemiyle.

### Yapay zekânın rolü

Kullanıcının verdiği ton örneğine göre alternatif üretir; sayılar/isimler gibi sabit alanları işaretler.

## Teknik bağımlılık ve sınırlar

Özel alan/şifre kutularında devre dışı; yerel işleme veya açık bulut seçimi. Otomatik e-posta gönderimi yok.

## Gelir hipotezi

Freemium karakter kotası; Pro kişisel stil ve ekip terim sözlüğü.

## Doğrulama ölçütü

Sabit sayı/isim koruma ≥%99; öneriyi kullanma oranı ≥%50.

## Öncelik ve efor

P0 · S; Prompt Dünyası şablon altyapısı ortak.

## Geliştirme ve ortak çalışma (Codex + Claude Code)

- Dal adı: `codex/PL-033-<konu>` veya `claude/PL-033-<konu>`; iki ajan aynı dalda aynı anda çalışmaz.
- İşe başlamadan önce [AKTIF-ISLER.md](../../../docs/ortak-calisma/AKTIF-ISLER.md) tablosuna satır eklenir; iş bitince devir notu yazılır.
- Kurallar: [AGENTS.md](../../../AGENTS.md) (her iki ajan için ortak), protokol: [AI-ORTAK-CALISMA.md](../../../docs/ortak-calisma/AI-ORTAK-CALISMA.md).

## Notion kartının özgün metni

Aşağıdaki metin `resources/notion-catalog.json` (Notion anlık görüntüsü, 2026-10-26) içindeki kartın kısaltılmadan aktarılmış hâlidir.

<details>
<summary>Tam kartı göster</summary>

- **Durum:** Yeni fikir
- **Platform:** Chrome seçili metin menüsü + W / L / M hızlı pencere
- **Kullanıcı ve problem:** Farklı uygulamalarda kısa metinlerini yeniden yazmak isteyen kişiler.
- **MVP ve temel akış:** Seçili metni sadeleştir, kısalt, dil bilgisi düzelt; fark görünümü ve kopyala. Kaynak uygulamaya yazma kullanıcı eylemiyle.
- **Yapay zekânın rolü:** Kullanıcının verdiği ton örneğine göre alternatif üretir; sayılar/isimler gibi sabit alanları işaretler.
- **Teknik bağımlılık ve sınır:** Özel alan/şifre kutularında devre dışı; yerel işleme veya açık bulut seçimi. Otomatik e-posta gönderimi yok.
- **Gelir hipotezi:** Freemium karakter kotası; Pro kişisel stil ve ekip terim sözlüğü.
- **Doğrulama ölçütü:** Sabit sayı/isim koruma ≥%99; öneriyi kullanma oranı ≥%50.
- **Öncelik ve efor:** P0 · S; Prompt Dünyası şablon altyapısı ortak.

</details>

---
Oluşturma: 29.10.2026 · Kaynak → hedef: Notion kataloğu → `registry/projects.json` → bu dosya
