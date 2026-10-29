# My Mind — ortak AI ve cihaz katmanı

## Sınır

My Mind ortak model/araç yeteneğinin adı; Mind Palace ayrı üründür. Eski konuşmalarda MyMind adı Mind Palace içindeki asistan için de kullanılmıştır. Aynı adın geçmesi aynı kod veya eğitilmiş model anlamına gelmez. İlk iş kaynakları ve adlandırmayı doğrulamaktır; yeni bağımsız repo mevcut sanılmaz.

Hub: motor/model kurma, sürüm, başlat/durdur, kaynak kullanımı, yetenek ve izin durumu. Master: bağımsız uygulamaların tükettiği sürümlü inference/vision/tool sözleşmeleri ve uyumluluk matrisi. Ürünler: kendi görev talimatı ve izinli adaptörü. Kullanıcı verisi ve eğitim örnekleri uygulama sınırlarını korur.

## Önce ölçülecek yetenekler

| Yetenek | Geçmişte görülen kayıt | Yeni kabul |
|---|---|---|
| Yerel metin | Hub geçmişinde My Mind Lite ve yerel yanıt raporu | Güncel SHA/model hash/cihazda gerçek yanıt ve ağsız test |
| LM Studio / sağlayıcı | Leo Helper geçmişinde bağlantı ve Qwen2.5 1.5B önerisi | Güncel endpoint, model ve görev doğruluğu; eski öneri yeniden seçilmiş model değildir |
| Vision | Bu incelemede çalışan kanıt yok | Ekran görüntüsü girdisinden sentetik görevde konum/hedef doğrulama |
| Araç çağrısı | SDK/API amaç olarak mevcut | Şema doğrulama, izin kapsamı, zaman aşımı, iptal ve tekrar güvenliği |
| Bilgisayar kullanımı | Kullanıcının hedefi | Önce gözlem; sonra sınırlı cihaz adaptörü ve durdurma kontrolüyle görev kabulü |
| Eğitim / LoRA | Leo geçmişinde dışa aktarma ve eğitim kodu raporu; eğitilmiş model kanıtı yok | Veri bölme, gerçek eğitim çıktısı ve ayrık değerlendirme; runtime bağlanmasını eğitim sayma |

Modeli henüz sabitleme. Donanım, Türkçe, lisans, bellek, gecikme, vision/araç biçimi ve ağsız davranışla seç. Cloud'daki test yerel RTX/GPU kabulü yerine geçmez. Güçlü uzak bilgisayar cihaz servisini host edebilir; her tüketiciye açık sınırsız shell vermez.

İlk sözleşme taslağı: requestId, protocolVersion, consumerId, requiredCapabilities, modelId, input, allowedTools, timeoutMs, cancellationId; yanıtta modelVersion, capabilitiesUsed, output, toolRequests, timings, error. Kimlik doğrulama sırrı manifestte veya logda tutulmaz. Vision içeriği ve kişisel ekranlar varsayılan olarak ortak eğitim verisine taşınmaz.

İlk pilot: sentetik bir notu özetle → uygulamada taslak göster → kullanıcı işlemiyle kaydet. Sonraki pilot vision ile hedef bulma; gerçek tıklama/yazma ayrıca cihaz adaptörüyle ölçülür. Genel model servisi kuruldu diye tüm ürünlerin entegre olduğu söylenmez.
