/* PL-050 Decision Board — örnek karar panosu (3 seçenek × 4 ağırlıklı kriter, her hücre veri ve kaynakla %100 izlenebilir). */
"use strict";

const BASE_DATE = "2026-11-06T14:00:00.000Z";

const sampleBoard = {
  id: "board-db-secimi",
  title: "Yeni Ürün İçin Yönetilen Veritabanı ve Arama Altyapısı Seçimi",
  context:
    "12 kişilik ürün ekibinin 2027 ilk çeyrekte devreye alacağı çok kiracılı SaaS uygulaması için birincil ilişkisel + tam metin arama veritabanı kararı. Compare Lens ile toplanan fiyat ve SLA tabloları kaynak olarak eklendi.",
  domain: "finans-hukuk",
  options: [
    {
      id: "opt-pg-managed",
      name: "Yönetilen PostgreSQL + pgvector",
      summary: "AB bölgesinde tam yönetilen PostgreSQL 16 kümesi, otomatik yedekleme ve standart SQL taşınabilirliği.",
    },
    {
      id: "opt-self-cluster",
      name: "Kendi Sunucumuzda Patroni Kümesi",
      summary: "Kiralık sanal sunucularda açık kaynak kurulum; düşük fatura ancak 7/24 ekip nöbeti gerektirir.",
    },
    {
      id: "opt-serverless-proprietary",
      name: "Tescilli Sunucusuz Bulut DB",
      summary: "Sıfır kurulum ve hızlı ölçeklenme; ancak özel sorgu dili nedeniyle yüksek çıkış maliyeti.",
    },
  ],
  criteria: [
    { id: "crit-cost", name: "Aylık Toplam Maliyet (TCO)", weight: 8, unit: "EUR/ay" },
    { id: "crit-ops", name: "Operasyon Kolaylığı ve SLA", weight: 9, unit: "% SLA" },
    { id: "crit-port", name: "Veri Taşınabilirliği (Çıkış Kolaylığı)", weight: 7, unit: "Standart SQL" },
    { id: "crit-kvkk", name: "KVKK / AB Veri Yerleşimi ve Şifreleme", weight: 10, unit: "Uyum" },
  ],
  cells: {
    "opt-pg-managed:crit-cost": {
      score: 8,
      evidence: "Aylık 240 EUR sabit küme + 40 EUR yedekleme; sürpriz sorgu başı ücret yok.",
      sourceTitle: "Tedarikçi 2026 Kasım Fiyat Tablosu s.4",
      sourceUrl: "https://ornek-bulut.com/fiyatlandirma",
    },
    "opt-pg-managed:crit-ops": {
      score: 9,
      evidence: "%99,95 SLA sözleşmesi, otomatik sürüm geçişi ve 15 dk PITR geri dönüş.",
      sourceTitle: "Hizmet Seviyesi Sözleşmesi (SLA) Madde 3.2",
      sourceUrl: "https://ornek-bulut.com/sla",
    },
    "opt-pg-managed:crit-port": {
      score: 10,
      evidence: "Standart pg_dump / mantıksal replikasyon ile 1 saat içinde başka sağlayıcıya taşınabilir.",
      sourceTitle: "Mimari Göç Tatbikatı Notu #12",
      sourceUrl: "",
    },
    "opt-pg-managed:crit-kvkk": {
      score: 9,
      evidence: "Frankfurt veri merkezi, müşteri anahtarıyla (CMEK) disk şifreleme ve imzalı DPA eki.",
      sourceTitle: "KVKK/GDPR Veri İşleme Eki (DPA) v2.1",
      sourceUrl: "",
    },

    "opt-self-cluster:crit-cost": {
      score: 9,
      evidence: "3 sunucu toplam 110 EUR/ay donanım maliyeti; ancak mühendis nöbet saati hariç.",
      sourceTitle: "Altyapı Sunucu Teklifi #2026-88",
      sourceUrl: "",
    },
    "opt-self-cluster:crit-ops": {
      score: 4,
      evidence: "Otomatik yük devretme ve disk doluluk takibi tamamen 2 kişilik iç ekibin üzerinde.",
      sourceTitle: "Ekip Kapasite Değerlendirmesi 02.11.2026",
      sourceUrl: "",
    },
    "opt-self-cluster:crit-port": {
      score: 10,
      evidence: "Tamamen açık kaynak PostgreSQL; hiçbir sağlayıcı kısıtı yok.",
      sourceTitle: "Teknik Şartname Bölüm 2",
      sourceUrl: "",
    },
    "opt-self-cluster:crit-kvkk": {
      score: 7,
      evidence: "Veri kendi sunucumuzda; ancak anahtar rotasyonu ve denetim izi kurulumu ekibe ait.",
      sourceTitle: "İç Güvenlik Denetim Listesi Madde 8",
      sourceUrl: "",
    },

    "opt-serverless-proprietary:crit-cost": {
      score: 5,
      evidence: "Başlangıçta ucuz görünse de 50M okuma sonrası aylık 680 EUR'ya çıkıyor.",
      sourceTitle: "Yük Testi Maliyet Simülasyonu Raporu",
      sourceUrl: "",
    },
    "opt-serverless-proprietary:crit-ops": {
      score: 9,
      evidence: "%99,99 SLA ve sunucu yönetimi gerektirmez.",
      sourceTitle: "Sağlayıcı Kurumsal SLA Dokümanı",
      sourceUrl: "",
    },
    "opt-serverless-proprietary:crit-port": {
      score: 3,
      evidence: "Tescilli API ve sorgu yapısı; başka veritabanına geçişte uygulama katmanı yeniden yazılmalı.",
      sourceTitle: "Kod Bağımlılık Analizi Notu",
      sourceUrl: "",
    },
    "opt-serverless-proprietary:crit-kvkk": {
      score: 8,
      evidence: "AB bölgesi mevcut ancak alt işlemci listesi yılda 4 kez değişiyor.",
      sourceTitle: "Sağlayıcı Alt İşlemci Listesi (Kasım 2026)",
      sourceUrl: "",
    },
  },
  selectedOptionId: "opt-pg-managed",
  draftRationale:
    "KVKK uyumu (ağırlık 10) ve operasyon kolaylığı (ağırlık 9) en yüksek önceliklerimizdir. Yönetilen PostgreSQL + pgvector hem %99,95 SLA sunuyor hem de standart SQL sayesinde tedarikçi bağımlılığı yaratmıyor.",
};

module.exports = { BASE_DATE, sampleBoard };
