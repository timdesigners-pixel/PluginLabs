# Dev Patch Notes 0.1.0 — önizleme (Windows)

PL-041 Dev Patch Notes'un ilk sürümü. Seçtiğiniz **git commit'lerini** özellik, düzeltme, iyileştirme ve diğer başlıklara ayırır; **her maddesi kaynak commit (ve PR) bağlantılı, düzenlenebilir** bir sürüm notu üretir. Commit'te yazmayan **test, performans, güvenlik ya da tamamlanma iddiası nota giremez**; **sırlar girişte maskelenir**. **Otomatik commit, push ve yayın yoktur.** **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `DevPatchNotes-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `DevPatchNotes-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri; uydurma test verisiyle)

## Neler var
- **Kaynak:** yerel **git deposu** (yalnız okuma — `rev-parse`, `remote get-url origin`, `tag --list`, `log`, `show`; kabuk yok; aralık önerisi "son etiket..HEAD"; Git for Windows gerekir), yapıştırılan **git log** (tam, `--stat`, `--numstat`, `-p`, `--oneline` süslemeli), **git format-patch** / `.patch` (MIME kodlu konu dahil), çıplak **git diff**, `.patch/.diff/.log/.txt` dosyası (8 MB).
- **Sınıflandırma:** Conventional Commits (`feat`, `fix`, `perf`, `refactor`, `docs`, `chore`, `ci`, `test`, `security`…; `!` ve `BREAKING CHANGE:` → kırıcı) **kesin**; Türkçe/İngilizce anahtar sözcükler ("düzeltildi", "giderildi", "eklendi", "fix", "add"…) ve yalnız belge/test/CI dosyalarına dokunan commit'ler **tahmin** olarak işaretlenir; hiçbiri uymazsa "sınıflandırılamadı" ve varsayılan olarak notta yok.
- **Ayıklama:** birleştirme commit'leri (PR numarası korunur), geri alınan çiftler ("Revert …" + hedefi), bakım işleri (bağımlılık, CI, test, stil) varsayılan olarak notta yer almaz; tek tıkla eklenebilir. Aynı metinli maddeler tek maddede birleşir.
- **Madde metni:** tür öneki atılır, kapsam "Kapsam: …" olarak kalır, `(#12)` bağlantıya taşınır. Her madde düzenlenebilir; başlığı değiştirilebilir; kaynak commit iletisi maddenin altında görünür.
- **Bağlantılar:** depo adresi (origin'den otomatik ya da elle; `git@…`/`ssh://` → https) ile GitHub, GitLab, Bitbucket, Azure DevOps, Gitea commit ve PR bağlantıları.
- **Uydurma teslim iddiası sıfır:** maddede "tüm testler geçti", "2x faster", "%30 daha hızlı", "tamamen güvenli", "üretime hazır" gibi bir iddia kaynak commit iletisinde aynı türde (sayılıysa aynı sayıyla) geçmiyorsa madde kırmızı işaretlenir ve **dışa aktarma engellenir**.
- **Sır taraması:** AWS, GitHub, OpenAI, Anthropic, Slack, Google, Stripe, Notion anahtarları; JWT; özel anahtar blokları; bağlantı dizesindeki parola; `password=`/`api_key:` atamaları. Bulunanlar girişte maskelenir (türü, kısaltılmış izi, commit'i ve satırı gösterilir); ham hâli saklanmaz, nota, dosyaya ve yapay zekâya gitmez.
- **Çıktı:** Markdown (**Türkçe başlıklar** ya da **Keep a Changelog**: Added/Changed/Fixed/Security), düz metin, JSON (madde, başlık, commit/PR adresleri, düzenlendi bilgisi), pano. Yazılan dosya geri okunup birebir karşılaştırılır.
- **Ölçüler (Notion ölçütü: 10 sürümde düzeltme süresinde ≥%50 azalma, uydurma teslim iddiası sıfır):** dışa aktarılan kanıtsız iddia (engellendiği için 0), engellenen dışa aktarma, son 10 sürümde ortalama **düzeltme oranı** (üretilen taslak ile dışa aktarılan metin arasında değişen sözcük payı) ve **etkin düzenleme süresi**, maskelenen sır, örnek depoda kategori doğruluğu.
- **MyMind** (PluginLabs Hub) ya da bu bilgisayardaki **yerel model** (LM Studio, Ollama; yalnız 127.0.0.1/localhost): her istekte onay; madde metinleri, commit başlıkları/açıklamaları, dosya adları ve commit başına en çok 1200 karakter kod farkı **sırlar maskeli** gider; yazar adları, e-postalar ve depo adresi gitmez. Yanıtta yeni madde, olmayan başlık, kanıtsız iddia ve sır içeren öneri atılır; öneri onayınızla uygulanır.
- Sürüm notları ve anahtar Windows kasasında (DPAPI) şifreli saklanır; kayıtlar silinmez, arşivlenir.

## Sınırlar
- **Chrome yan paneli** (GitHub/GitLab sayfasından commit seçme) ile Linux ve macOS paketleri bu sürümde yok. Ekip başına Pro ve özel şablonlar yok.
- Uzak depoya bağlanılmaz (fetch yok); yalnız yerelde var olan commit'ler okunur. GitHub/GitLab sürüm (release) sayfası oluşturulmaz.
- Sınıflandırma kural tabanlıdır; "tahmin" ve "sınıflandırılamadı" işaretli maddeleri kontrol edin. İddia denetimi kalıp tabanlıdır; listede olmayan bir iddia biçimini kaçırabilir.
- "≥%50 azalma" ölçütü için elle yazma süresi (karşılaştırma tabanı) uygulamada ölçülmez; yalnız düzeltme oranı ve etkin düzenleme süresi raporlanır.
- Doğrulama: çekirdek birim testleri ve gerçek Electron penceresinde otomatik duman testi (git CLI ile kurulan gerçek bir yerel depo, taklit MyMind/yerel model sunucusu; Windows runner + Linux/xvfb). Kategori doğruluğu yalnız uydurma, elle etiketli 15 commit'lik örnek depoda ölçüldü (%100); gerçek depolarda ve gerçek bir modelle ölçülmedi. Windows DPI ve ekran okuyucu elle denenmedi.
