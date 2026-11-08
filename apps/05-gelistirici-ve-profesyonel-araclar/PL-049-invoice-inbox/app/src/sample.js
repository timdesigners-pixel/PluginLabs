/* PL-049 Invoice Inbox — elle etiketlenmiş örnek fatura ve fiş belgeleri (2 belge şablonu + tutarsız/eksik zorunlu inceleme örnekleri). */
"use strict";

const BASE = "2026-11-06T12:00:00.000Z";

const documents = [
  {
    key: "earsiv-bulut",
    sourceTitle: "GIB2026000001482-eArsiv.txt",
    sourceType: "dosya",
    text: `e-Arşiv Fatura
Satıcı Unvanı: Kuzey Bulut Bilişim A.Ş.
Fatura No: GIB2026000001482
Düzenleme Tarihi: 03.11.2026
Son Ödeme Tarihi: 17.11.2026
Alıcı TCKN: 34567890124
Banka IBAN: TR33 0006 1005 1978 6457 8413 26

Kalemler:
- Bulut Sunucu Kümesi (2 Adet x 3.500,00 TL) [KDV %20]: 7.000,00 TL
- Yedekleme ve Anlık Görüntü Alanı (1 Adet x 1.500,00 TL) [KDV %20]: 1.500,00 TL

Ara Toplam: 8.500,00 TL
Hesaplanan KDV (%20): 1.700,00 TL
Ödenecek Tutar: 10.200,00 TL`,
  },
  {
    key: "earsiv-tasarim-xml",
    sourceTitle: "EFT2026000000914-ubl.xml",
    sourceType: "dosya",
    text: `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:ID>EFT2026000000914</cbc:ID>
  <cbc:IssueDate>2026-11-01</cbc:IssueDate>
  <cbc:DueDate>2026-11-15</cbc:DueDate>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Atölye Çizgi Tasarım Ltd. Şti.</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:InvoiceLine>
    <cbc:InvoicedQuantity>1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">12000.00</cbc:LineExtensionAmount>
    <cac:Item><cbc:Name>Arayüz Tasarım Paketi</cbc:Name></cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="TRY">12000.00</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">2400.00</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">12000.00</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">14400.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="TRY">14400.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`,
  },
  {
    key: "makbuz-kirtasiye",
    sourceTitle: "fis-kirtasiye-0411.txt",
    sourceType: "metin",
    text: `PERAKENDE SATIŞ FİŞİ
İşletme: Boğaziçi Ofis ve Kırtasiye Paz. Tic.
Fiş No: FIS202600419
Fiş Tarihi: 04.11.2026
Son Ödeme Tarihi: 04.11.2026
Ödeme Kartı: 4543 6012 8901 2345

- Mekanik Klavye (1 x 2.000,00 TL) [KDV %20]: 2.000,00 TL
- Noktalı Defter Seti (2 x 250,00 TL) [KDV %20]: 500,00 TL

Ara Toplam: 2.500,00 TL
Toplam KDV: 500,00 TL
Genel Toplam: 3.000,00 TL`,
  },
  {
    key: "makbuz-danismanlik-uyumsuz",
    sourceTitle: "makbuz-hatali-toplam.txt",
    sourceType: "metin",
    text: `SERBEST MESLEK MAKBUZU
Satıcı: Mercan Mali Müşavirlik ve Danışmanlık
Makbuz No: MKZ202600108
Tarih: 05.11.2026
Vade Tarihi: 20.11.2026
TCKN: 19876543210

- Sözleşme İnceleme ve Vergi Danışmanlığı: 5.000,00 TL

Ara Toplam: 5.000,00 TL
Toplam KDV: 1.000,00 TL
Genel Toplam: 6.450,00 TL`,
  },
  {
    key: "earsiv-vadesiz",
    sourceTitle: "GIB2026000001905-vadesiz.txt",
    sourceType: "pano",
    text: `e-Arşiv Fatura
Satıcı: Nokta Fiber İnternet Hizmetleri A.Ş.
Fatura No: GIB2026000001905
Düzenleme Tarihi: 6 Kasım 2026

- Kurumsal Simetrik Fiber Hat (1 x 1.250,00 TL) [KDV %20]: 1.250,00 TL

Ara Toplam: 1.250,00 TL
Hesaplanan KDV: 250,00 TL
Ödenecek Tutar: 1.500,00 TL`,
  },
];

const gold = {
  "earsiv-bulut": { grandTotal: 10200, taxTotal: 1700, issueDate: "2026-11-03", dueDate: "2026-11-17", expectMismatch: false },
  "earsiv-tasarim-xml": { grandTotal: 14400, taxTotal: 2400, issueDate: "2026-11-01", dueDate: "2026-11-15", expectMismatch: false },
  "makbuz-kirtasiye": { grandTotal: 3000, taxTotal: 500, issueDate: "2026-11-04", dueDate: "2026-11-04", expectMismatch: false },
  "makbuz-danismanlik-uyumsuz": { grandTotal: 6450, taxTotal: 1000, issueDate: "2026-11-05", dueDate: "2026-11-20", expectMismatch: true },
  "earsiv-vadesiz": { grandTotal: 1500, taxTotal: 250, issueDate: "2026-11-06", dueDate: "", expectMismatch: false },
};

module.exports = { BASE, documents, gold };
