/* CHRVVIM Campus — verified per-institution resources overlay.
   Source of truth for the base directory is institutions-database.js (CHRVVIM_INSTITUTIONS).
   This file adds, for each institution id, the official links that were found on the
   institutions' own published pages during the 2026-10-17 verification pass.
   Every link keeps the page it came from; content inside PDF/Drive files was NOT
   opened page by page, so nothing here is presented as a verified timetable.
   If an institution id is absent here, the gateway shows "المعلومات غير متوفرة حالياً"
   instead of inventing data. */
window.CHRVVIM_INSTITUTION_RESOURCES = {
  "UIZ-001": {
    last_verified: "2026-10-17",
    confidence: "official_site",
    site: "https://www.flsh-agadir.ac.ma/",
    schedules: [
      "http://www.flsh-agadir.ac.ma/?p=36917",
      "http://www.flsh-agadir.ac.ma/?p=36665",
      "http://www.flsh-agadir.ac.ma/?p=36664",
      "http://www.flsh-agadir.ac.ma/?p=36663"
    ],
    news: ["http://www.flsh-agadir.ac.ma/"],
    student: "http://ent.flsh-agadir.ac.ma/login",
    note: "إعلانات واستعمالات زمن منشورة على موقع الكلية (فُحصت 2026-10-17)."
  },
  "UIZ-002": {
    last_verified: "2026-10-17",
    confidence: "official_site",
    site: "https://www.fsa.ac.ma/",
    schedules: ["https://scol.fsa.ac.ma/edt/"],
    exams: ["https://fsa.uiz.ac.ma/uploads/1791299396800-iw6jbrzvflo.pdf"],
    note: "بوابة استعمالات الزمن التفاعلية؛ لم تُستخرج جميع الملفات منها."
  },
  "UIZ-003": {
    last_verified: "2026-10-17",
    confidence: "official_site",
    site: "https://www.fsjes-agadir.org/",
    schedules: [
      "https://drive.google.com/file/d/1taHnfrWbpMH3ULtGh2ayNS5txYERxrxX/view",
      "https://drive.google.com/file/d/1tEU2dRsBwYTRR8EK_uP-np2F2e0LaNOA/view",
      "https://drive.google.com/file/d/19LwyT1xAHAnGI03ASlL5oglsEpiIbEZT/view",
      "https://drive.google.com/file/d/17LOhrASYRTROL-O5pP6W-qESPEKII6dn/view",
      "https://drive.google.com/file/d/1Oo4H1xl9Dhvjc2fyRrQWEWCjlro2Jswe/view",
      "https://drive.google.com/file/d/1_IzW8aQcBDR2EQor9EXKnacWjzK9QZjX/view",
      "https://drive.google.com/file/d/175GNRX0KXmPtNS_vrrbiprjIj2t15Ofj/view"
    ],
    note: "روابط من إعلان الكلية؛ محتوى الملفات لم يُفحص صفحة بصفحة."
  },
  "UIZ-007": {
    last_verified: "2026-10-17",
    confidence: "official_site",
    site: "https://fmpa.uiz.ac.ma/",
    schedules: ["https://fmpa.uiz.ac.ma/emplois-temps/"],
    groups: ["https://fmpa.uiz.ac.ma/liste-des-etudiants-de-la-2eme-annee-de-pharmacie-td/"],
    student: "https://myfmpa.uiz.ac.ma",
    news: ["https://fmpa.uiz.ac.ma/avis-au-etudiants-bourse-dexternat/"],
    note: "إعلانات رسمية (فُحصت 2026-10-17)."
  },
  "UIZ-010": {
    last_verified: "2026-10-17",
    confidence: "official_site",
    site: "https://www.fpo.ma/",
    student: "https://fpo.uiz.ac.ma/espace-etudiant",
    note: "بوابة خدمات تتطلب التحقق من الروابط الداخلية."
  },
  "UIZ-014": {
    last_verified: "2026-10-17",
    confidence: "official_site",
    site: "http://flash.uiz.ac.ma/",
    schedules: [
      "https://flash.uiz.ac.ma/wp-content/uploads/2026/10/ALAN3503.pdf",
      "https://flash.uiz.ac.ma/wp-content/uploads/2026/10/ALAN5303.pdf"
    ],
    groups: ["https://flash.uiz.ac.ma/%D8%A5%D8%B9%D9%84%D8%A7%D9%86-%D8%B9%D9%86-%D9%85%D8%AC%D9%85%D9%88%D8%B9%D8%A7%D8%AA-%D9%88%D8%AD%D8%AF%D8%A9-%D8%A7%D9%84%D8%AA%D8%B7%D8%A8%D9%8A%D9%82%D8%A7%D8%AA-%D8%A7%D9%84%D9%81/"],
    note: "ملفات مباشرة؛ يلزم التحقق من المحتوى."
  },
  "UIZ-015": {
    last_verified: "2026-10-17",
    confidence: "official_site",
    site: "https://www.encg-agadir.ac.ma/",
    schedules: ["https://encga.uiz.ac.ma/?p=5643", "https://encga.uiz.ac.ma/?p=5703"],
    groups: ["https://encga.uiz.ac.ma/?p=5663"],
    note: "إعلانات رسمية."
  },
  "UIZ-016": {
    last_verified: "2026-10-17",
    confidence: "official_site",
    site: "https://www.ensa-agadir.ac.ma/",
    exams: [
      "http://www.ensa-agadir.ac.ma/pages/concourslatresultats",
      "http://www.ensa-agadir.ac.ma/pages/transfertresultats",
      "http://www.ensa-agadir.ac.ma/pages/admisensa"
    ],
    student: "https://ensaup.uiz.ac.ma",
    note: "إعلانات رسمية (فُحصت 2026-10-17)."
  },
  "UIZ-017": {
    last_verified: "2026-10-17",
    confidence: "official_site",
    site: "https://www.esta.ac.ma/",
    schedules: ["http://www.esta.ac.ma/?page_id=469"],
    exams: ["http://www.esta.ac.ma/?page_id=4583"],
    note: "إعلانات رسمية."
  },
  "UIZ-022": {
    last_verified: "2026-10-17",
    confidence: "official_site",
    site: "https://esef.uiz.ac.ma/",
    schedules: ["https://esef.uiz.ac.ma/ar/%D8%A7%D8%B3%D8%AA%D8%B9%D9%85%D8%A7%D9%84%D8%A7%D8%AA-%D8%A7%D9%84%D8%B2%D9%85%D9%86/"],
    groups: ["https://esef.uiz.ac.ma/en/licence-deducation-liste-des-etudiants-par-groupe-au-titre-de-lannee-universitaire-2026-2027/"],
    student: "https://drive.google.com/drive/folders/1xJhQczSopufT_mTbJ5-W3o__39mppAyU?usp=sharing",
    note: "بعض العناصر صور؛ مجلد المصدر لم يُحصَ."
  },
  "UIZ-023": {
    last_verified: "2026-10-17",
    confidence: "official_site",
    site: "https://www.ensiasdt.uiz.ac.ma/",
    schedules: ["https://ensiasd.uiz.ac.ma/2026/09/11/emplois-du-temps-1%CA%B3%E1%B5%89-annee-cycle-ingenieur-cycle-preparatoire-session-dautomne-annee-universitaire-2026-2027/"],
    note: "صفحة إعلان؛ يلزم استخراج كل رابط."
  },
  "UIZ-028": {
    last_verified: "2026-10-17",
    confidence: "official_site",
    site: "http://www.ims.uiz.ma/",
    schedules: ["https://ims.uiz.ac.ma/announcements/1"],
    note: "إعلان رسمي يتضمن أربعة جداول."
  }
};
