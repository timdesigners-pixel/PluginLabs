# Devir notu — PL-042 · API Pocket

**Tarih:** 08.11.2026 · **Bırakan:** Claude Code (zamanlanmış görev) · **Dal:** `claude/optimistic-goodall-17gds7` (PL-044 dalı `claude/optimistic-goodall-ma7hov` c07b2fa üzerine) · **PR:** taslak (bu dal)

## Yapılanlar
- 07.11.2026'daki PL-042 çalıştırması (`claude/optimistic-goodall-i341gx`) yalnız AKTIF-ISLER satırı bıraktı (kod, dağıtım dalı, release yok). Bu çalıştırma işi devraldı; o dal değiştirilmedi.
- API Pocket 0.1.0 Windows uygulaması (Electron, PL-025 modeli): kaynak `apps/05-gelistirici-ve-profesyonel-araclar/PL-042-api-pocket/app`. Kabuk PL-041 Dev Patch Notes'tan uyarlandı (DPAPI kasası, onaylar, MyMind loopback istemcisi, aile kenar çubuğu).
- Çekirdek (`src/core.js`): şablon/ortam normalleştirme, `{{değişken}}` çözme (gerçek istek + maskeli kopya), gönderim denetimi (tanımsız değişken, yalnız http/https, adreste kimlik, başlıkta CR/LF, yönetilen başlıklar), sır maskeleme (düz/URL kodlu/base64) ve sızıntı sayacı, curl ayrıştırma (yalnız GET), düz sırları gizli değişkene taşıma, JSON belirteçleme ve alan listesi, kişisel veri maskeleme, MyMind açıklama/taslak isteği ve yanıt doğrulaması, sırsız koleksiyon dışa/içe aktarma, ölçüler.
- Ağ (`desktop/net.js`): yalnız GET, `redirect: "manual"`, çerez/önbellek yok, zaman aşımı ve boyut sınırı, anlaşılır hata iletileri. Örnek API (`desktop/sample-server.js`): yalnız 127.0.0.1, rastgele port, her başlatmada yeni rastgele `api_key`.
- `pluginlabs-dagitim` `claude/api-pocket-v0.1.0` dalında Windows derleme/yayın iş akışı (kaynak PluginLabs@0285f75); `api-pocket-v0.1.0` release'i.
- Kayıtlar: registry, `apps/README.md`, `docs/UYGULAMALAR.md`, ürün README; Hub 0.4.30 kataloğu ve sürüm notu.

## Kalanlar
- [ ] PR zinciri: #90 (PL-040) → #91 (PL-041) → #92 (PL-043) → #93 (PL-044) → bu PR. PL-042 numara sırasına göre PL-043'ten önce gelir, ama dal PL-044'ün üzerine kuruldu; Hub sürümü 0.4.30.
- [ ] Hub'ın kendisi (0.4.30) henüz yayımlanmadı: MUST HAVE 8 için PR'lar birleştikten sonra insan onayıyla Hub release'i gerekir.
- [ ] Gerçek genel API'lerde elle kabul (OAuth'lu API, büyük yanıt, yavaş ağ, kurumsal vekil), Windows DPI/klavye/ekran okuyucu.
- [ ] Chrome paneli (tarayıcıdan istek yakalama), POST ve diğer yöntemler (yazma yöntemlerinde ek önizleme zorunlu), ekip şeması — sonraki faz.

## Alınan kararlar
- Gizli değişken değeri arayüze hiç gönderilmez; düzenleyicide boş bırakılan gizli satır mevcut değeri korur, kayıtlı gizli değer düz değişkene çevrilemez (çevrilseydi ekranda görünürdü).
- Kasa (DPAPI) yoksa gizli değerler diske yazılmaz; yalnız bellekte tutulur (Linux CI'da böyle).
- Yönlendirmeler otomatik izlenmez: Authorization başlığının başka bir sunucuya taşınma riski yerine 3xx ve hedef gösterilir.
- Yanıt gövdesi geçmişe yazılmaz (yalnız son yanıt bellekte); geçmiş yalnız maskeli adres/başlık ve ölçüleri tutar.
- “Üretim” işareti yalnız GET olsa da onay ister (bazı API'ler GET ile işlem yapar); Notion'daki “yazan yöntemlerde ek önizleme” ilkesi POST eklendiğinde de geçerli kalmalı.
- İlk doğru istek süresi “Örnek verilerle başla”dan ilk 2xx yanıta kadar ölçülür; otomasyonla ölçüldü, insan kullanıcıyla ölçülmedi.

## Değişen dosyalar
- `apps/05-gelistirici-ve-profesyonel-araclar/PL-042-api-pocket/app/**` (yeni)
- `apps/05-gelistirici-ve-profesyonel-araclar/PL-042-api-pocket/README.md`, `apps/README.md`, `docs/UYGULAMALAR.md`, `registry/projects.json`, `docs/ortak-calisma/AKTIF-ISLER.md`
- `src/catalog.cjs`, `package.json`, `package-lock.json`, `README.md`, `RELEASE-NOTES.md` (Hub 0.4.30)

## Çalıştırılan komutlar ve sonuçları
| Komut | Sonuç |
| --- | --- |
| `npm test` (app) | 10/10 geçti (Linux) |
| `xvfb-run node tests/desktop-smoke.cjs docs/screenshots` | DUMAN TESTİ GEÇTİ (Linux, electron 33.2.1; ilk doğru istek 93 ms, sızıntı 0, diskte düz sır yok; kasa yok) |
| `pluginlabs-dagitim` iş akışı | çalıştırma 42444671045 geçti (Windows runner win25: npm test + duman testi, DPAPI etkin, ilk doğru istek 83 ms, sızıntı 0, diskte düz sır yok) |
| Taşınabilir exe indirme doğrulaması | 81 539 363 bayt, SHA-256 e0db60ad…2004, MZ başlığı |
| `npm test` (Hub) | 33/33 geçti |

## Test edilmeyenler / riskler
- Gerçek bir genel API'ye ve gerçek bir modele karşı denenmedi (örnek API, taklit yankı sunucusu, taklit MyMind).
- Paketler imzasız (SmartScreen uyarısı).

## Sonraki ajan için ilk adım
- Sonraki Windows sürümü olmayan ürün: **PL-045 Context Kit** (bu dalın üzerine).
