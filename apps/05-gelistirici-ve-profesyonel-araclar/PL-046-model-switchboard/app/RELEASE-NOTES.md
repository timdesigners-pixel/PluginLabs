# Model Switchboard 0.1.0 — önizleme (Windows)

PL-046 Model Switchboard'un ilk sürümü. **Resmi API anahtarınızla** birden çok model sağlayıcısını tek panelde toplar: **tarihli model kataloğu**, **istek maliyeti tahmini**, **bütçe tavanı** ve **aynı görevde yan yana değerlendirme**. Her yanıtın **gerçek maliyeti** sağlayıcının bildirdiği token kullanımından hesaplanır; **tavanı aşacak istek gönderilmez**. **İmzasız önizleme:** Windows SmartScreen "Bilinmeyen yayımcı" uyarısı verebilir ("Ek bilgi" → "Yine de çalıştır").

## Dosyalar
- `ModelSwitchboard-0.1.0-Windows-x64.exe` — kurulum (kullanıcı klasörüne, yönetici izni istemez)
- `ModelSwitchboard-0.1.0-Windows-Portable-x64.exe` — taşınabilir, kurulumsuz
- `SHA256SUMS-windows.txt`, `BUILD-INFO-windows.txt`, `windows-masaustu-*.png` (Windows runner'ında duman testinin aldığı gerçek pencere görüntüleri; taklit OpenAI/Anthropic/MyMind sunucuları ve uydurma test verisiyle)

## Neler var
- **Sağlayıcılar (ilk sürüm iki ücretli):** OpenAI (`/v1/chat/completions`) ve Anthropic (`/v1/messages`) — yalnız **resmi API anahtarı** (`sk-…`, `sk-ant-…`); ChatGPT/Claude.ai web oturumu ya da çerez **kullanılmaz**. Ayrıca ücretsiz, bu bilgisayardaki **MyMind** (PluginLabs Hub) ve OpenAI uyumlu **yerel model** (LM Studio, Ollama; yalnız 127.0.0.1/localhost). Anahtarlar Windows kasasında (DPAPI) şifreli; arayüze ve günlüklere yazılmaz; her anahtar yalnız kendi sağlayıcısına gider.
- **Model kataloğu:** sağlayıcı, ad, API model kimliği, girdi/çıktı fiyatı (USD / 1M token), **fiyat tarihi**, fiyat kaynağı ve **doğrulandı** işareti. Başlangıç fiyatları **örnektir ve doğrulanmamıştır**; tarih girilmeden doğrulandı işaretlenemez, fiyat değişince doğrulama kalkar. Fiyatı olmayan ücretli model **çalıştırılmaz** (maliyeti görünmezdi). Model eklenebilir, kapatılabilir.
- **Maliyet tahmini ve bütçe tavanı:** gönderimden önce her model için **en kötü durum** maliyeti = temkinli girdi tahmini (karakter/2) + max çıktı token × fiyat. **Çalıştırma başına** ve **aylık** tavan (USD); tavanı aşacak çalıştırma **gönderilmez** ve nedeni yazılır. Çıktı max token ile sınırlanır; **yeniden deneme yoktur** (maliyeti katlamaz). Aynı anda tek karşılaştırma.
- **Yan yana değerlendirme:** aynı görev (isteğe bağlı sistem talimatı) 1–4 modele aynı anda; onay penceresi hedefleri, gönderilecekleri ve en kötü durum maliyetini gösterir. Her sütunda yanıt, süre, girdi/çıktı token, **gerçek maliyet** (bildirilen kullanım × katalog fiyatı; kullanım bildirilmezse "görünmüyor" — uydurulmaz), fiyat tarihi/doğrulama, "max token'da kesildi" uyarısı; sağlayıcı hataları (401/403/404/429) anlaşılır biçimde. 1–5 puan, kazanan, yanıtı kopyalama.
- **Öneri:** görev türüne (kod, özet, çeviri, yazım, analiz, sınıflandırma, genel) göre **yalnız puanladığınız kayıtlı test sonuçlarından**: puan (kalite) önce, sonra kazanma, maliyet ve süre; kanıt sayısıyla ("kanıt az" uyarısı). Kayıt yoksa öneri yok. Görev türü kurallarla otomatik seçilir, değiştirilebilir.
- **Geçmiş:** çalıştırmalar (silinmez, arşivlenir), görevi yeniden kullanma, **CSV** (formül enjeksiyonu engellenir; fiyat ve tarihi her satırda) ve **JSON** dışa aktarma.
- **Ölçüler:** gerçek maliyeti görünen yanıt oranı (hedef %100), bütçe tavanı aşımı (hedef 0), gönderilmeyen çalıştırma, en kötü durum tahminini aşan çalıştırma, bu ay/toplam harcama, doğrulanmamış fiyatla hesaplanan yanıt, puanlanan yanıt.
- **MyMind önerisi** (Hub ya da yerel model; her istekte onay): görev türünü sınıflar ve katalogdan en çok 3 model önerir. Görev metni e-posta/telefon/IBAN/kart/T.C. kimlik/API anahtarı/bağlantılar ⟦…⟧ ile gizlenerek ve en çok 1500 karakter gider; sistem talimatı, anahtarlar ve geçmiş yanıtlar gitmez. Listede olmayan tür, katalogda olmayan model ve gerekçedeki fiyat iddiaları **atılır**; öneri sizin onayınızla uygulanır.
- **Örnek kayıtlar:** anahtar olmadan ekranı ve öneriyi göstermek için iki uydurma karşılaştırma (açıkça "örnek" işaretli; harcamaya ve ölçülere girmez).

## Sınırlar
- İlk sürümde ücretli sağlayıcı olarak yalnız **OpenAI ve Anthropic**; akış (streaming), görsel/dosya girdisi, araç çağırma ve toplu (batch) API yok. Önbellek/indirimli fiyatlandırma ayrıca hesaplanmaz (Anthropic önbellek tokenları girdi fiyatıyla sayılır).
- **Fiyatlar sağlayıcıdan otomatik çekilmez**; katalogdaki fiyatı siz doğrulayıp tarihlersiniz. Gerçek fatura sağlayıcı panelindedir; uygulamadaki tutar bildirilen kullanım × girdiğiniz fiyattır.
- **Chrome eklentisi**, Linux ve macOS paketleri, Pro ekip bütçe/anahtar politikası bu sürümde yok.
- Doğrulama: çekirdek birim testleri ve gerçek Electron penceresinde otomatik duman testi (taklit OpenAI, Anthropic ve MyMind sunucularıyla; Windows runner + Linux/xvfb). **Gerçek OpenAI/Anthropic API'lerine karşı denenmedi**; istek/yanıt biçimleri sağlayıcı belgelerine göre taklit edildi. Windows DPI ve ekran okuyucu elle denenmedi.
