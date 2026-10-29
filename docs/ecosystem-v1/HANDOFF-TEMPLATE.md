# İş teslimi

- workId / productId:
- ownerChat / sourceChatIds:
- repo / branch / baseSha / resultSha / dirty:
- environment / OS / runtime / gerçek cihaz:
- amaç / kapsam / kabul koşulları:
- değişen dosyalar ve davranış:
- designSystemVersion / contractVersion / consumer etkisi:
- kontroller: komut, passed|failed|not-run, kanıt ve commit:
- screenshot: gerçek uygulama, platform, commit, tarih; tarihî ise belirt:
- artifact / SHA256 / BUILD-INFO / imza durumu:
- blocker / risk / rollback:
- sonraki tek somut iş ve sahibi:
- issue / PR / karar kaydı bağlantıları:

Producer→consumer tesliminde iki repo SHA'sı, şema sürümü, izinler, breakingChange, sentetik fixture ve her iki tarafın sözleşme test sonucu eklenir. `done` ve `releaseReady` ayrı tutulur. Bilinmeyeni boş bırakıp gerekçe yaz; tahmini SHA/test sonucu üretme.
