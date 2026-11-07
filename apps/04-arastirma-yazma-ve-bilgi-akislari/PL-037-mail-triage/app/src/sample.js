/* Mail Triage — örnek gelen kutusu (uydurma kişiler, şirketler ve adresler; gerçek veri değildir) ve elle etiketlenmiş beklenen sonuçlar.
 * Kullanıcı: Elif Yıldız <elif@ornekfirma.com.tr>; önemli alan: @musteri-a.com.tr. İletiler farklı MIME biçimlerini kapsar
 * (8 bit UTF-8, quoted-printable HTML, base64, RFC 2047 konu, .ics ve PDF eki, List-Unsubscribe, Auto-Submitted).
 * `gold`: Notion ölçütleri (etiket kabulü ≥ %85, önemli e-postayı yanlış düşük öncelikleme < %2) bu örnekle uygulama içinde ölçülür.
 * Bilerek: kampanya iletisi "Son gün!" der ama toplu gönderimdir (düşük kalmalı); banka ekstresi toplu gönderimdir ama son ödeme
 * tarihi 2 gün sonradır (yüksek olmalı); güvenlik kodu otomatiktir ama önemlidir. */
(function (root) {
  const DATE = "Fri, 06 Nov 2026 09:12:00 +0300";
  const mail = (h, body) => Object.entries(h).map(([k, v]) => k + ": " + v).join("\r\n") + "\r\n\r\n" + body.replace(/\r?\n/g, "\r\n");
  const ME = "Elif Yıldız <elif@ornekfirma.com.tr>";
  const mails = [
    { key: "k1", raw: mail({ From: "Murat Şen <murat.sen@musteri-a.com.tr>", To: ME, Subject: "Teklif revizyonu hakkında", Date: DATE, "Message-ID": "<k1@musteri-a.com.tr>", "MIME-Version": "1.0", "Content-Type": "text/plain; charset=utf-8", "Content-Transfer-Encoding": "8bit" },
      "Merhaba Elif Hanım,\n\nGeçen haftaki görüşmemizden sonra bütçe kalemlerini netleştirdik. Revize teklifi cuma gününe kadar gönderebilir misiniz? Yönetim onayı için gerekli.\n\nTeşekkürler,\nMurat Şen\nSatın Alma Müdürü\n0532 111 22 33") },
    { key: "k2", raw: mail({ From: "Enerji Örnek A.Ş. <e-fatura@enerji-ornek.com.tr>", To: ME, Subject: "Kasım 2026 elektrik faturanız", Date: DATE, "Message-ID": "<k2@enerji-ornek.com.tr>", "MIME-Version": "1.0", "Content-Type": "multipart/mixed; boundary=\"sinir-k2\"" },
      "--sinir-k2\nContent-Type: text/plain; charset=utf-8\nContent-Transfer-Encoding: 8bit\n\nSayın Elif Yıldız,\n\nKasım 2026 dönemine ait elektrik faturanız oluşturulmuştur.\nFatura tutarı: 1.245,60 TL\nSon ödeme tarihi: 09.11.2026\n\nFaturanızı ekte bulabilirsiniz.\n--sinir-k2\nContent-Type: application/pdf; name=\"fatura-2026-11.pdf\"\nContent-Disposition: attachment; filename=\"fatura-2026-11.pdf\"\nContent-Transfer-Encoding: base64\n\nJVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSPj4Kc3RyZWFtCg==\n--sinir-k2--\n") },
    { key: "k3", raw: mail({ From: "Mağaza Örnek <kampanya@magaza-ornek.com>", To: ME, Subject: "=?utf-8?Q?Son_g=C3=BCn!_T=C3=BCm_=C3=BCr=C3=BCnlerde_%50_indirim?=", Date: DATE, "Message-ID": "<k3@magaza-ornek.com>", "List-Unsubscribe": "<https://magaza-ornek.com/abonelik/iptal?u=123>", "Precedence": "bulk", "MIME-Version": "1.0", "Content-Type": "text/html; charset=utf-8", "Content-Transfer-Encoding": "quoted-printable" },
      "<html><body><h1>Son g=C3=BCn!</h1><p>Sepette ek %50 indirim f=C4=B1rsat=C4=B1n=C4=B1 ka=\n=C3=A7=C4=B1rmay=C4=B1n. Acele edin, kampanya bug=C3=BCn bitiyor.</p><p><a href=3D\"https://magaza-ornek.com/abonelik/iptal\">Abonelikten =C3=A7=C4=B1k</a></p></body></html>") },
    { key: "k4", raw: mail({ From: "Örnek Bank <no-reply@ornekbank.com.tr>", To: ME, Subject: "Doğrulama kodunuz", Date: DATE, "Message-ID": "<k4@ornekbank.com.tr>", "Auto-Submitted": "auto-generated", "MIME-Version": "1.0", "Content-Type": "text/plain; charset=utf-8", "Content-Transfer-Encoding": "8bit" },
      "Hesabınıza yeni bir cihazdan giriş denemesi yapıldı. Doğrulama kodunuz: 482913\nBu işlemi siz yapmadıysanız hemen müşteri hizmetlerini arayın.") },
    { key: "k5", raw: mail({ From: "Can Öztürk <can.ozturk@ornekfirma.com.tr>", To: ME + ", Deniz Ak <deniz@ornekfirma.com.tr>", Subject: "Sprint değerlendirme toplantısı daveti", Date: DATE, "Message-ID": "<k5@ornekfirma.com.tr>", "MIME-Version": "1.0", "Content-Type": "multipart/mixed; boundary=\"sinir-k5\"" },
      "--sinir-k5\nContent-Type: text/plain; charset=utf-8\n\nMerhaba,\n\nSprint değerlendirme toplantısı salı 14:00'te Teams üzerinden yapılacak. Katılımınızı teyit eder misiniz?\n\nCan\n--sinir-k5\nContent-Type: text/calendar; method=REQUEST; name=\"davet.ics\"\nContent-Disposition: attachment; filename=\"davet.ics\"\n\nBEGIN:VCALENDAR\nEND:VCALENDAR\n--sinir-k5--\n") },
    { key: "k6", raw: mail({ From: "Kargo Örnek <bildirim@kargo-ornek.com>", To: ME, Subject: "=?utf-8?B?U2lwYXJpxZ9pbml6IGthcmdveWEgdmVyaWxkaQ==?=", Date: DATE, "Message-ID": "<k6@kargo-ornek.com>", "MIME-Version": "1.0", "Content-Type": "text/plain; charset=utf-8" },
      "Siparişiniz kargoya verildi. Gönderi takip numarası: 7712345678. Tahmini teslimat: 2-3 iş günü.") },
    { key: "k7", raw: mail({ From: "=?utf-8?B?T8SfdXogVMO8cms=?= <oguz@ornekfirma.com.tr>", To: "Ekip <ekip@ornekfirma.com.tr>", Cc: ME, Subject: "=?utf-8?B?QmlsZ2k6IFE0IHJhcG9ydSBwYXlsYcWfxLFsZMSx?=", Date: DATE, "Message-ID": "<k7@ornekfirma.com.tr>", "MIME-Version": "1.0", "Content-Type": "text/plain; charset=utf-8", "Content-Transfer-Encoding": "base64" },
      "TWVyaGFiYSBla2lwLAoKUTQgcmFwb3J1bnVuIHNvbiBow6JsaSBwYXlsYcWfxLFtIGtsYXPDtnLD\nvG5lIHnDvGtsZW5kaS4gR3JhZmlrbGVyZGUga8O8w6fDvGsgZMO8emVsdG1lbGVyIHlhcMSxbGTE\nsS4KCsSweWkgw6dhbMSxxZ9tYWxhciwKT8SfdXo=") },
    { key: "k8", raw: mail({ From: "Legal Team <legal@partner-ornek.com>", To: ME, Subject: "Contract renewal - action required", Date: DATE, "Message-ID": "<k8@partner-ornek.com>", "MIME-Version": "1.0", "Content-Type": "multipart/mixed; boundary=\"sinir-k8\"" },
      "--sinir-k8\nContent-Type: text/plain; charset=us-ascii\n\nHi Elif,\n\nOur services agreement expires this month. Could you please sign the attached renewal by Monday? Let me know if you need any changes.\n\nBest,\nJordan\n--sinir-k8\nContent-Type: application/pdf; name=\"renewal.pdf\"\nContent-Disposition: attachment; filename=\"renewal.pdf\"\nContent-Transfer-Encoding: base64\n\nJVBERi0xLjQK\n--sinir-k8--\n") },
    { key: "k9", raw: mail({ From: "Kod Platformu <noreply@kodplatform-ornek.com>", To: ME, Subject: "Haftalık etkinlik özetiniz", Date: DATE, "Message-ID": "<k9@kodplatform-ornek.com>", "List-Id": "<ozet.kodplatform-ornek.com>", "List-Unsubscribe": "<mailto:cik@kodplatform-ornek.com>", "MIME-Version": "1.0", "Content-Type": "text/plain; charset=utf-8" },
      "Bu hafta depolarınızda 12 yeni yıldız ve 3 yeni takipçi var. Ayrıntılar için panonuzu ziyaret edin.") },
    { key: "k10", raw: mail({ From: "Selin Kara <selin.kara@ornekfirma.com.tr>", To: ME, Subject: "ACİL: sunum dosyası", Date: DATE, "Message-ID": "<k10@ornekfirma.com.tr>", "MIME-Version": "1.0", "Content-Type": "text/plain; charset=utf-8" },
      "Elif, yönetim kurulu sunumunun son hâlini bugün 15:00'e kadar gönderir misin? Rakamları da son tabloya göre güncelleyelim.\n\nSelin\n\n> 5 Kas 2026 tarihinde Elif Yıldız şunu yazdı:\n> Sunumun taslağı ekte.") },
    { key: "k11", raw: mail({ From: "Deniz Ak <deniz@ornekfirma.com.tr>", To: ME, Subject: "Ynt: Bütçe tablosu", Date: DATE, "Message-ID": "<k11@ornekfirma.com.tr>", "In-Reply-To": "<onceki@ornekfirma.com.tr>", "MIME-Version": "1.0", "Content-Type": "text/plain; charset=utf-8" },
      "Teşekkürler, tabloyu aldım. Elinize sağlık.\n\n-- \nDeniz Ak\nFinans") },
    { key: "k12", raw: mail({ From: "Örnek Bank Kart <ekstre@ornekbank.com.tr>", To: ME, Subject: "Kredi kartı hesap ekstreniz hazır", Date: DATE, "Message-ID": "<k12@ornekbank.com.tr>", "List-Unsubscribe": "<https://ornekbank.com.tr/eposta-tercihleri>", "MIME-Version": "1.0", "Content-Type": "text/plain; charset=utf-8" },
      "Kredi kartı hesap ekstreniz hazırlanmıştır. Dönem borcu: 3.480,25 TL. Son ödeme tarihi: 08.11.2026. Asgari ödeme tutarı: 1.392,10 TL.") },
  ];
  // Elle etiketlenmiş beklenen sonuç: etiketler, öncelik, önemli mi.
  const gold = [
    { key: "k1", labels: ["yanit"], priority: "yuksek", important: true },
    { key: "k2", labels: ["fatura"], priority: "normal", important: true },
    { key: "k3", labels: ["bulten"], priority: "dusuk", important: false },
    { key: "k4", labels: ["guvenlik", "bildirim"], priority: "yuksek", important: true },
    { key: "k5", labels: ["yanit", "toplanti"], priority: "normal", important: false },
    { key: "k6", labels: ["kargo", "bildirim"], priority: "dusuk", important: false },
    { key: "k7", labels: [], priority: "normal", important: false },
    { key: "k8", labels: ["yanit"], priority: "yuksek", important: true },
    { key: "k9", labels: ["bulten"], priority: "dusuk", important: false },
    { key: "k10", labels: ["yanit"], priority: "yuksek", important: true },
    { key: "k11", labels: [], priority: "normal", important: false },
    { key: "k12", labels: ["fatura", "bulten"], priority: "yuksek", important: true },
  ];
  const sample = { mails, gold, settings: { myAddresses: ["elif@ornekfirma.com.tr"], vip: ["@musteri-a.com.tr"], myName: "Elif Yıldız" } };
  if (typeof module === "object" && module.exports) module.exports = sample;
  else root.MLSample = sample;
})(typeof self !== "undefined" ? self : this);
