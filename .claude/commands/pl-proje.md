---
description: Bir PluginLabs projesinin (PL-0XX) bağlamını yükler ve durumunu raporlar
argument-hint: PL-0XX
---

`$ARGUMENTS` kimlikli PluginLabs projesi üzerinde çalışmaya hazırlan:

1. `registry/projects.json` içinden `$ARGUMENTS` kaydını bul (`appPath`, `repo`, `platforms`, `status`).
2. `<appPath>/README.md` dosyasını ve varsa `<appPath>/DEVIR.md` dosyasını tamamen oku.
3. `docs/ortak-calisma/AKTIF-ISLER.md` tablosunda bu proje için açık iş var mı kontrol et. Codex’in açık işi varsa o dala yazmayacağını belirt.
4. Kayıtta `repo` varsa ürün kodunun o depoda olduğunu hatırlat; yoksa ön geliştirmenin `<appPath>` altında yapılacağını belirt.
5. Şu biçimde rapor ver: 📌 GÖREV / ✅ DURUM / 📁 ÇIKTI / ⚠️ NOTLAR / 🔜 SONRAKİ ADIM.
