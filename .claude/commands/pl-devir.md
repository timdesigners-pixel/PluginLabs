---
description: PluginLabs projesi için Codex'e devredilecek devir notu yazar
argument-hint: PL-0XX
---

`$ARGUMENTS` projesi için devir notu hazırla:

1. `docs/ortak-calisma/DEVIR-SABLONU.md` şablonunu kullan.
2. Bu oturumda değişen dosyaları `git status` ve `git diff --stat` ile belirle; çalıştırılan komutları ve sonuçlarını yaz. Çalıştırılmayan testleri açıkça belirt.
3. Notu `registry/projects.json` içindeki `appPath` klasöründe `DEVIR.md` dosyasının **en üstüne** tarihli yeni bölüm olarak ekle; eski bölümleri silme.
4. `docs/ortak-calisma/AKTIF-ISLER.md` içindeki ilgili satırın durumunu `devredildi` yap.
5. Aynı notu PR açıklamasına eklenecek biçimde çıktı olarak da ver.
