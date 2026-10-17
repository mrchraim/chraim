/* =============================================================================
   روابط جامعة ابن زهر (UIZ) — مجموعة منقولة عن الموقع الرسمي للجامعة.
   المصدر: https://www.uiz.ac.ma  (وصفحة المؤسسات: /nos-etablissements)
   ملاحظة: هذه قائمة غير رسمية جمعها الموقع لأغراض التيسير؛ تبقى الصفحة الرسمية
   للجامعة هي المرجع، وقد تتغيّر الروابط أو تُضاف مؤسسات جديدة.
   البنية: window.CHRVVIM_UNIVERSITY = { source, updated, groups:[{key,items:[...]}] }
   وكل عنصر: { s: شارة قصيرة لاتينية، ar: الاسم بالعربية، fr: الاسم بالفرنسية، u: الرابط }
   ============================================================================= */
window.CHRVVIM_UNIVERSITY = {
  source: 'https://www.uiz.ac.ma',
  institutions: 'https://www.uiz.ac.ma/nos-etablissements',
  updated: '2026-10-15',
  groups: [
    {
      key: 'fac',
      items: [
        { s: 'FSJES',    ar: 'كلية العلوم القانونية والاقتصادية والاجتماعية — أكادير', fr: 'Faculté des Sciences Juridiques, Économiques et Sociales — Agadir', u: 'https://www.uiz.ac.ma/faculte-des-sciences-juridiques-economiques-et-sociales-agadir' },
        { s: 'FSJES-AM', ar: 'كلية العلوم القانونية والاقتصادية والاجتماعية — آيت ملول', fr: 'Faculté des Sciences Juridiques, Économiques et Sociales — Aït Melloul', u: 'https://www.uiz.ac.ma/faculte-des-sciences-juridiques-economiques-et-sociales-ait-melloul' },
        { s: 'FLSH',     ar: 'كلية الآداب والعلوم الإنسانية — أكادير', fr: 'Faculté des Lettres et des Sciences Humaines — Agadir', u: 'https://www.uiz.ac.ma/faculte-des-lettres-et-des-sciences-humaines-agadir' },
        { s: 'FS',       ar: 'كلية العلوم — أكادير', fr: 'Faculté des Sciences — Agadir', u: 'https://www.uiz.ac.ma/faculte-des-sciences-agadir' },
        { s: 'FMP',      ar: 'كلية الطب والصيدلة — أكادير', fr: 'Faculté de Médecine et de Pharmacie — Agadir', u: 'https://www.uiz.ac.ma/faculte-de-medecine-et-de-pharmacie-agadir' },
        { s: 'CHARIÂ',   ar: 'كلية الشريعة — آيت ملول', fr: 'Faculté Chariâ — Aït Melloul', u: 'https://www.uiz.ac.ma/faculte-chariaa-ait-melloul' },
        { s: 'FSA-AM',   ar: 'كلية العلوم التطبيقية — آيت ملول', fr: 'Faculté des Sciences Appliquées — Aït Melloul', u: 'https://www.uiz.ac.ma/faculte-des-sciences-appliquees-ait-melloul' },
        { s: 'FLSH-AM',  ar: 'كلية اللغات والفنون والعلوم الإنسانية — آيت ملول', fr: 'Faculté des Langues, Arts et Sciences Humaines — Aït Melloul', u: 'https://www.uiz.ac.ma/faculte-des-langues-arts-et-sciences-humaines-ait-melloul' }
      ]
    },
    {
      key: 'schools',
      items: [
        { s: 'ESTA',  ar: 'المدرسة العليا للتكنولوجيا — أكادير', fr: 'École Supérieure de Technologie — Agadir', u: 'https://www.uiz.ac.ma/ecole-superieure-de-technologie-agadir' },
        { s: 'ENCG',  ar: 'المدرسة الوطنية للتجارة والتسيير — أكادير', fr: 'École Nationale de Commerce et de Gestion — Agadir', u: 'https://www.uiz.ac.ma/ecole-nationale-de-commerce-et-de-gestion-agadir' },
        { s: 'ENSA',  ar: 'المدرسة الوطنية للعلوم التطبيقية — أكادير', fr: 'École Nationale des Sciences Appliquées — Agadir', u: 'https://www.uiz.ac.ma/ecole-nationale-des-sciences-appliquees-agadir' },
        { s: 'ESEF',  ar: 'المدرسة العليا للتربية والتكوين — أكادير', fr: 'École Supérieure de l’Éducation et de la Formation — Agadir', u: 'https://www.uiz.ac.ma/ecole-superieure-de-leducation-et-de-la-formation-agadir' }
      ]
    },
    {
      key: 'cities',
      items: [
        { s: 'FP-OZ',    ar: 'كلية متعددة التخصصات — ورزازات', fr: 'Faculté Polydisciplinaire — Ouarzazate', u: 'https://www.uiz.ac.ma/faculte-polydisciplinaire-ouarzazate' },
        { s: 'FP-TD',    ar: 'كلية متعددة التخصصات — تارودانت', fr: 'Faculté Polydisciplinaire — Taroudant', u: 'https://www.uiz.ac.ma/faculte-polydisciplinaire-taroudant' },
        { s: 'FP-SM',    ar: 'كلية متعددة التخصصات — السمارة', fr: 'Faculté Polydisciplinaire — Smara', u: 'https://www.uiz.ac.ma/faculte-polydisciplinaire-smara' },
        { s: 'FEG',      ar: 'كلية الاقتصاد والتسيير — كلميم', fr: 'Faculté d’Économie et de Gestion — Guelmim', u: 'https://www.uiz.ac.ma/faculte-deconomie-et-de-gestion-guelmim' },
        { s: 'FMP-G',    ar: 'كلية الطب والصيدلة — كلميم', fr: 'Faculté de Médecine et de Pharmacie — Guelmim', u: 'https://www.uiz.ac.ma/faculte-de-medecine-et-de-pharmacie-guelmim' },
        { s: 'FMP-L',    ar: 'كلية الطب والصيدلة — العيون', fr: 'Faculté de Médecine et de Pharmacie — Laâyoune', u: 'https://www.uiz.ac.ma/faculte-de-medecine-et-de-pharmacie-laayoune' },
        { s: 'EST-OZ',   ar: 'المدرسة العليا للتكنولوجيا — ورزازات', fr: 'École Supérieure de Technologie — Ouarzazate', u: 'https://www.uiz.ac.ma/ecole-superieure-de-technologie-ouarzazate' },
        { s: 'EST-G',    ar: 'المدرسة العليا للتكنولوجيا — كلميم', fr: 'École Supérieure de Technologie — Guelmim', u: 'https://www.uiz.ac.ma/ecole-superieure-de-technologie-guelmim' },
        { s: 'EST-L',    ar: 'المدرسة العليا للتكنولوجيا — العيون', fr: 'École Supérieure de Technologie — Laâyoune', u: 'https://www.uiz.ac.ma/ecole-superieure-de-technologie-laayoune' },
        { s: 'EST-D',    ar: 'المدرسة العليا للتكنولوجيا — الداخلة', fr: 'École Supérieure de Technologie — Dakhla', u: 'https://www.uiz.ac.ma/ecole-superieure-de-technologie-dakhla' },
        { s: 'ENCG-D',   ar: 'المدرسة الوطنية للتجارة والتسيير — الداخلة', fr: 'École Nationale de Commerce et de Gestion — Dakhla', u: 'https://www.uiz.ac.ma/ecole-nationale-de-commerce-et-de-gestion-dakhla' },
        { s: 'ENSIASD',  ar: 'المدرسة الوطنية العليا للذكاء الاصطناعي وعلوم المعطيات — تارودانت', fr: 'École Nationale Supérieure de l’Intelligence Artificielle et des Sciences des Données — Taroudant', u: 'https://www.uiz.ac.ma/ecole-nationale-superieure-de-lintelligence-artificielle-et-sciences-des-donnees-de-taroudant-0' }
      ]
    },
    {
      key: 'poles',
      items: [
        { s: 'P2AE',      ar: 'قطب الشؤون الأكاديمية والطلابية', fr: 'Pôle des Affaires Académiques et Étudiantes', u: 'https://www.uiz.ac.ma/p2ae' },
        { s: 'PRS',       ar: 'قطب البحث العلمي والتعاون والشراكة', fr: 'Pôle Recherche Scientifique et Coopération', u: 'https://www.uiz.ac.ma/prs' },
        { s: 'PEDOC',     ar: 'قطب الدراسات الدكتورالية', fr: 'Pôle des Études Doctorales', u: 'https://www.uiz.ac.ma/pedoc' },
        { s: 'P2AI',      ar: 'قطب الشؤون الإدارية والمؤسساتية', fr: 'Pôle des Affaires Administratives et Institutionnelles', u: 'https://www.uiz.ac.ma/p2ai' },
        { s: 'PDIGITAL',  ar: 'قطب الرقمنة', fr: 'Pôle Digitalisation', u: 'https://www.uiz.ac.ma/pdigital' }
      ]
    },
    {
      key: 'services',
      items: [
        { s: 'PRE',    ar: 'التسجيل القبلي', fr: 'Pré-inscription', u: 'http://preinscription.uiz.ac.ma/' },
        { s: 'PREDOC', ar: 'التسجيل في الدكتوراه', fr: 'Pré-inscription en Doctorat', u: 'http://preinsdoc.uiz.ac.ma/' },
        { s: 'BO',     ar: 'المكتب الرقمي للضبط', fr: 'Bureau d’Ordre numérique', u: 'http://bo.uiz.ac.ma/Login' },
        { s: 'ESCOL',  ar: 'التمدرس عبر الأنترنت', fr: 'Scolarité en ligne', u: 'https://www.uiz.ac.ma/escol' },
        { s: 'ELEARN', ar: 'الدروس عن بعد', fr: 'Enseignement à distance', u: 'https://www.uiz.ac.ma/elearn' },
        { s: 'ERES',   ar: 'الموارد الإلكترونية', fr: 'Ressources électroniques', u: 'https://www.uiz.ac.ma/e-ressources' },
        { s: 'CL',     ar: 'مركز اللغات', fr: 'Centre de Langues', u: 'http://ecours-cl.uiz.ac.ma/' },
        { s: 'SOFT',   ar: 'المهارات الحياتية (Soft Skills)', fr: 'Compétences transversales (Soft Skills)', u: 'http://e-soft-skills.uiz.ac.ma/' },
        { s: 'FC',     ar: 'التكوين المستمر', fr: 'Formation continue', u: 'http://formation-continue.uiz.ac.ma/' },
        { s: 'BOURSE', ar: 'المنح', fr: 'Bourses', u: 'https://www.uiz.ac.ma/bourse' },
        { s: 'LOG',    ar: 'السكن والإطعام', fr: 'Logement et Restauration', u: 'https://www.uiz.ac.ma/logement-et-restauration' },
        { s: 'AMO',    ar: 'التأمين الصحي', fr: 'Assurance Maladie', u: 'https://www.uiz.ac.ma/assurance-maladie' }
      ]
    }
  ]
};
