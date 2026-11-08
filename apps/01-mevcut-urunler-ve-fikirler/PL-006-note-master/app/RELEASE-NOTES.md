# Note Master 0.1.0 — önizleme (Windows)

PL-006 Note Master'ın ilk sürümü. Okurken fikir ve yapılacakları kaybetmeden **kaynaklı hızlı not** ve **hızlı görev** alırsınız; notlar etiketlenir, aranır ve **Markdown** olarak dışa aktarılır.

## Dosyalar
- `NoteMaster-0.1.0-Windows-x64.exe` — kurulum (NSIS)
- `NoteMaster-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png`

## Neler var
- **Kaynaklı not:** Seçtiğiniz metni kopyalayıp *Panodan alıntı al* ile alıntı olarak ekleyin; kaynak adresi (`utm_*`, `fbclid` gibi izleme parametreleri ve `#parça` atılır) ya da kaynak adı zorunludur.
- **Alıntı sınırı:** Kaynaktan alınan metin varsayılan 600 karakterle sınırlanır (120–2000 ayarlanabilir); kısaltılan alıntı işaretlenir.
- **Hızlı görev ve etiket:** `#etiket` yazınca otomatik eklenir; görevlerde son tarih ve tamamlandı durumu; etiket bulutu ve Türkçe karakter duyarlı arama.
- **Hızlı not widget'ı:** Küçük, her zaman üstte pencere; `Ctrl+Shift+Space` ile her yerden açılır.
- **Markdown ve JSON:** Tüm notlar ya da gizliler hariç Markdown (`.md`); `pluginlabs-note/1` şemasında JSON yedek ve içe aktarma (aynı kimlik atlanır).
- **Doğrulama ölçütleri:** İlk not süresi (hedef ≤ 60 sn) ve bu hafta geri çağrılan not sayısı (hedef ≥ 5) yerel olarak ölçülür.
- **MyMind / yerel model:** Onayınızla uzun notu görev/özet/anahtar kavram **taslağına** çevirir; özgün metin değişmez, metni yeniden yazma girişimleri ve notta geçmeyen kavramlar atılır, öneriler tek tıkla kaynaklı görevlere dönüşür. **Gizli notlar varsayılan olarak gönderilmez**; izin verilirse e-posta/telefon/IBAN/TCKN maskelenir, kaynağın yalnız alan adı gider.

## Bilinen sınırlar
- Chrome eklentisi ve Linux/macOS paketleri bu sürümde yok.
- Mind Palace ile ortak not şeması hedefi doğrulanmadı; JSON `pluginlabs-note/1` şeması Note Master'a özgüdür.
- Paketler imzasızdır (Windows SmartScreen uyarısı görülebilir).
