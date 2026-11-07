# Devir notu — PL-041 · Dev Patch Notes

**Tarih:** 07.11.2026 · **Bırakan:** Claude Code (zamanlanmış görev) · **Dal:** `claude/optimistic-goodall-h0l6k5` (PL-040 dalı #90 üzerine) · **PR:** taslak (bu dal)

## Yapılanlar
- Dev Patch Notes 0.1.0 Windows uygulaması (Electron, PL-025 modeli): kaynak `apps/05-gelistirici-ve-profesyonel-araclar/PL-041-dev-patch-notes/app`.
- Notion MVP akışı: git deposu (yalnız okuma) / yapıştırılan git log, --oneline, format-patch, diff / .patch dosyası → başlıklara ayrılmış, her maddesi kaynak commit (ve PR) bağlantılı, düzenlenebilir sürüm notu.
- Çekirdek (`src/core.js`): git çıktısı ayrıştırıcıları (makine biçimi, tam log, --oneline, format-patch/MIME konu, çıplak diff), Conventional Commits + TR/EN anahtar sözcük + dosya türüyle sınıflandırma (Unicode sözcük sınırı), birleştirme/geri alma/bakım ayıklama, aynı metinli maddeleri birleştirme, depo adresi → GitHub/GitLab/Bitbucket/Azure/Gitea commit ve PR bağlantıları, sır taraması ve maskeleme, kanıtsız iddia denetimi (test/performans/güvenlik/teslim; sayılıysa aynı sayı), dışa aktarma engelleri, Markdown (Türkçe başlıklar / Keep a Changelog), düz metin, JSON, düzeltme oranı (sözcük LCS), MyMind isteği ve yanıt denetimi.
- Git (`desktop/git.js`): `execFile` (kabuk yok), beyaz liste `rev-parse`, `remote get-url origin`, `tag --list`, `log`, `show`; `--end-of-options` + aralık biçim denetimi; `GIT_OPTIONAL_LOCKS=0`.
- Ana pencere: Sürüm notları (madde düzenleyici + Markdown önizleme, sır kutusu, engel kutusu), Dışa aktarımlar, Ölçüler ve ayarlar.
- `pluginlabs-dagitim` `claude/dev-patch-notes-v0.1.0` dalında Windows derleme/yayın iş akışı (kaynak PluginLabs@b01e54a); `dev-patch-notes-v0.1.0` release'i.
- Kayıtlar: registry, `apps/README.md`, `docs/UYGULAMALAR.md`, ürün README; Hub 0.4.27 kataloğu (`src/catalog.cjs`) ve sürüm notu.
- Eşzamanlı çalıştırma: aynı zamanlanmış görevin ikinci bir çalıştırması (bu oturum) PL-040'ı da yazmıştı; diğer oturum (`claude/optimistic-goodall-0ll2v2`, PR #90) önce yayımladığı için bu oturumun kopyası yayımlanmadı, `ec9a6aa` ile geri alındı (geçmişte `0b594b3`), ardından PR #90 dalı birleştirildi. Ağaç PR #90 ile aynıdır, üzerine yalnız PL-041 eklendi.

## Kalanlar
- [ ] PR'ların sırayla birleşmesi (#90 → bu dal) ve Hub 0.4.27 Windows yayını (MH-3/MH-8; kullanıcı onayı).
- [ ] Gerçek bir depoda elle kabul (büyük depo, birleştirme yoğun geçmiş, GitLab/Azure bağlantıları); gerçek MyMind modeliyle yeniden yazım kalitesi.
- [ ] "≥%50 düzeltme süresi azalması" için elle yazma tabanı ölçümü (uygulama yalnız düzeltme oranı ve etkin düzenleme süresini ölçer).
- [ ] Chrome yan paneli (GitHub/GitLab sayfasından commit seçme), Pro ekip şablonları — sonraki faz.
- [ ] Zamanlanmış görevin eşzamanlı çalışmasını önlemek (aynı anda iki çalıştırma PL-040'ı yineledi).

## Alınan kararlar
- Ürün deposu açılmadı; kaynak PluginLabs `apps/…/app`, derleme `pluginlabs-dagitim` (PL-025–040 ile aynı model).
- Uzak depoya bağlanılmaz (fetch yok); release sayfası oluşturulmaz. Çıktı yalnız dosya/pano.
- Bakım (bağımlılık/CI/test/stil), birleştirme, geri alınan ve sınıflandırılamayan commit'ler varsayılan olarak notta yok; ayardan bakım dahil edilebilir.
- İddia denetimi maddenin metnine uygulanır (elle ya da MyMind yazımı fark etmez); kaynak = maddenin commit'lerinin başlık + açıklaması.

## Değişen dosyalar
- `apps/05-gelistirici-ve-profesyonel-araclar/PL-041-dev-patch-notes/app/**` (yeni)
- `apps/05-gelistirici-ve-profesyonel-araclar/PL-041-dev-patch-notes/README.md`, `apps/README.md`, `docs/UYGULAMALAR.md`, `registry/projects.json`, `docs/ortak-calisma/AKTIF-ISLER.md`
- `src/catalog.cjs`, `package.json`, `package-lock.json`, `README.md`, `RELEASE-NOTES.md` (Hub 0.4.27)

## Çalıştırılan komutlar ve sonuçları
| Komut | Sonuç |
| --- | --- |
| `npm test` (app) | 10/10 geçti (Linux; Windows runner'da da) |
| `xvfb-run node tests/desktop-smoke.cjs docs/screenshots` | DUMAN TESTİ GEÇTİ (Linux, electron 33.2.1; gerçek git deposu + taklit Hub) |
| `pluginlabs-dagitim` iş akışı | çalıştırma 42404990282 |

## Test edilmeyenler / riskler
- Sınıflandırma ve iddia denetimi kalıp tabanlı; listede olmayan iddia biçimleri kaçabilir. Doğruluk yalnız uydurma 15 commit'lik örnekte ölçüldü.
- Paketler imzasız (SmartScreen uyarısı). Windows DPI ve ekran okuyucu elle denenmedi.

## Sonraki ajan için ilk adım
- Sıradaki Windows sürümü olmayan ürün: **PL-042 API Pocket**. Bu dalın üzerine çalışın (zincir: #90 → bu PR). Başlamadan önce `AKTIF-ISLER.md`'ye satır ekleyip hemen push edin ve `pluginlabs-dagitim`'de `claude/<ürün>-v0.1.0` dalını kontrol edin (eşzamanlı çalıştırma riski).
