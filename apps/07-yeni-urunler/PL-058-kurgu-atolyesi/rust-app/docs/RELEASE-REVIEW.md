# Rust Kurgu Atölyesi — bağımsız yayın incelemesi

> Güncel kapsam: kullanıcı 04.11.2026'da önce HTML referanslarına dayanan arayüzü görmek istedi; ileri işlevler sonra bağlanacak. Aşağıdaki motor entegrasyonu listesi önceki adayın inceleme planıdır ve yeni Omni arayüzünün tamamlanmış kabulü değildir. Güncel gerçek native görsel kanıt `PREVIEW-EVIDENCE.json` dosyasında: altı çalışma alanı ve beş etkileşim kontrolü geçti. İlk incelemedeki keyframe zamanı, chroma renk biçimi, opaklık keyframe reddi ve session path sınırı motor sahibi tarafından düzeltildi. Yeni UI motor entegrasyonu, tam kurulum ve yayın açık kalır.

04.11.2026 · Bu belge test planı ve kaynak incelemesidir; listelenen kontroller çalıştırılmadan geçti sayılmaz.

## Kabul kapsamı

- Paketlenmiş Rust/Tauri uygulaması üzerinden gerçek medya import/demo → timeline kesme/geri al → renk → düğüm etkinliği → X/Y anahtar kareleri → FFmpeg render → çözülmüş video karesi.
- `scripts/ui-check.cjs`, yalnız mevcut native WebView CDP oturumuna bağlanır. Mock sunucu, sahte `invoke`, ayrı HTML önizlemesi veya başka uygulamanın ekranı kanıt olarak kullanılmaz.
- Ekranlar kişisel sidebar/hesap bilgisi içermez. Commit/platform/viewport/sürüm BUILD-INFO içinde kaydedilir.

## Yayın kapıları

| Kapı | Gereken kanıt |
|---|---|
| Rust | `cargo test --locked`, gerçek FFmpeg ses/video/süre/efekt doğrulaması |
| Native UI | `node scripts/ui-check.cjs`, gerçek screenshotlar ve native JSON raporu |
| Dağıtım | Windows kurulum + portable exe; SHA256SUMS; BUILD-INFO; codec/runtime ön koşulları |
| Güvenlik | Yalnız loopback Hub; açık gönderim onayı; token kasa; normal modda test import komutunun reddi |
| Depo | PR'da güncel ekranlar, kaynak görev/issue bağı, test sonucu ve rollback; zorunlu CI/inceleme |
| Hub | Yayın sahibi/root katalog URL/size/hash kaydını ve yeni Hub yayınını koordine eder |
| Dürüst kapsam | Yaklaşık canlı canvas ile kesin FFmpeg render ayrımı; GPU/AI görsel/3B/maske/takip ve çok girişli graph hazır diye sunulmaz |

## İlk kaynak incelemesinde bildirilen riskler

Bu liste 04.11.2026 ilk okuma bulgularıdır; kaynak değiştiğinde yayın sahibi yeniden doğrular.

1. Anahtar kare eğrisi overlay `t` değerini klip başlangıcından bağımsız yorumluyordu; başlangıcı sıfır olmayan klipte yerel kare zamanı doğrulanmalı.
2. Chroma düğümünün UI varsayılanı `0x00ff00`, derleyicinin beklediği biçim ise altı hex karakterdi. Düğüm ekle → render akışı gerçek çalıştırılmalı.
3. Transform düğümü seçilebilir fakat derleyicide clip alanları dışında işlem taşımıyordu; düğüm parametrelerinin gerçek düzenlenebilirliği ve çıktı etkisi açık olmalı.
4. Opacity anahtar kareleri modele kabul edilip render'a uygulanmıyorsa reddedilmeli; bu sürümün UI'si yalnız X/Y ekler.
5. Oturum kurtarırken project/media dosya sınırları yeniden doğrulanmalı; frontend veya dış JSON keyfi dosya yolunu asset scope'a sokmamalı.
6. Sonradan eklenen metin mevcut görüntü süresini aşıyorsa UI süre sayacı ve render süresi uyuşmalı.

## Ayrı elle kabul

Windows kurulum sihirbazı, native dosya seçici, 150/200% DPI, yalnız klavye ve ekran okuyucu, imza/SmartScreen, canlı izinli Hub modeli ve büyük proje performansı ayrı raporlanır. Otomasyon bu sonuçların yerine geçmez.
