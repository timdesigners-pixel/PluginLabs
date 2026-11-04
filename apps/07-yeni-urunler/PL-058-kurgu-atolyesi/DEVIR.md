# Devir notu — PL-058 · Kurgu Atölyesi

**Tarih:** 04.11.2026 · **Bırakan:** Codex · **Dal:** `codex/PL-058-media-engine` · **Kaynak:** Notion KA-01–KA-07

## Yapılanlar
- Node çekirdeğiyle loopback medya sunucusu ve sandbox/contextIsolation açık Electron kabuğu; ek runtime npm bağımlılığı yok.
- Gerçek medya içe aktarma, kalıcı proje/medya, kesme, katman, ses miksleme, kararma geçişi, altyazı, .cube LUT, 1080p dışa aktarma, 360p önizleme ve kaynak proxy'si.
- Sıralı render kuyruğu, ilerleme, iptal, tamamlanmış işlerin kurtarılması. Yarım kalan işler yeniden açılışta hatalı olarak işaretlenir; kullanıcı yeniden başlatır.
- MyMind Hub metin köprüsü açık onayla; token frontend'e geçmez. Canlı Hub modeli henüz test edilmedi.
- KA-07 düğüm/SDK PRD; Hub sahibine ayrı teslim belgesi. Önceki prototip README'si arşivlendi, kaynak kurgu.js saklandı.

## Kalanlar
- KA-04 gerçek segmentasyon/takip + elle maske düzeltmesi; model/lisans/VRAM kanıtı henüz yok.
- KA-02 gelişmiş ripple/drag zaman çizelgesi, klipler arası çapraz geçiş; mevcut sürüm sayısal konum/süre ve kararma kullanır.
- KA-05 GPU hızlandırma; mevcut kanıt CPU libx264.
- KA-06 canlı MyMind provider/Hub izin kabulü; metin köprüsü yalnız sözleşme ve hata davranışıyla test edilir.
- Hub dağıtımı, gerçek yayın, ürün logosu/ikon paketi ve bağımsız ürün deposu. Windows paketleri mevcut Electron simgesiyle imzasızdır.

## Alınan kararlar
- Kullanıcının foreground oturumu kullanılmaz; UI kanıtı headless Edge ve görünmeyen gerçek Electron penceresinden.
- FFmpeg/FFprobe dış ön koşuldur; bu cihazın 9.0.2 sürümü kullanıldı. Ağdan model veya codec paketi indirilmez.
- Hub katalog/kimlik/köprü ortak dosyaları düzenlenmez; yalnız ürün klasörü ve bu dalın sahiplik satırı.

## Değişen dosyalar
`src/engine.cjs`, `src/server.cjs`, `desktop/main.cjs`, `ui/studio.js`, `ui/studio.css`, `ui/index.html`, paket yapılandırması, testler ve ürün belgeleri.

## Çalıştırılan komutlar ve sonuçları
| Komut | Sonuç |
|---|---|
| `node --test test/engine.test.cjs` | 3/3; gerçek 1080p çıktı, ses/süre, LUT renk eşleşmesi, proxy, kayıt, API güvenliği |
| `node test/ui.cjs` | import → kes → altyazı → render → oynat → yeniden aç → Ctrl+K, konsol hatası yok |
| `node test/native.cjs` | Windows gizli Electron penceresi gerçek ekranı |
| Hub `npm test` (NODE_PATH ile mevcut locked modüller) | 33/33 |

## Test edilmeyenler / riskler
Windows kurulum sihirbazı kullanıcı masaüstünde işletilmedi; DPI, ekran okuyucu ve Linux/macOS kabulü yok. Canlı ortak çalışma ve AI görsel/avatar üretimi yok. Tarihsel demo bu özelliklerin kanıtı değildir. Çıktı klasörleri kullanıcı kararı olmadan temizlenmez.

## Sonraki ajan için ilk adım
`docs/HUB-HANDOFF.md` ile Hub sahibiyle entegrasyon sırasını belirle; KA-04 için lisansı/VRAM'i doğrulanmış segmentasyon sağlayıcısı seçilmeden işi tamamlandı işaretleme.
