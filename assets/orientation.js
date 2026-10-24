/* CHRAIM — مرشد التوجيه: يقترح تكوينات جامعة ابن زهر بحسب المستوى والاهتمامات والمدينة.
   البيانات: university-formations.json (382 تكويناً من العرض الرسمي uiz.ac.ma). لا خادم ولا تتبّع:
   كل شيء يجري في المتصفح، والاختيارات تُحفظ في رابط الصفحة (#) لتشاركها مع أصدقائك. */
(function (root) {
  'use strict';

  // أنماط الاهتمامات تُطبَّق على النص المطبَّع (norm): عربي موحّد + لاتيني بلا تشكيل
  var TAGS = [
    { id: 'law',    ico: '⚖️', ar: 'قانون وسياسة',      re: 'droit|juridi|politi|justice|notari|relations internationales|securit|قانون|قضاي|قضائ|سياس|دستور|جنائي|دوليه|شريعه|ادارييه|امن|وساطه|منازع|جنا|عقود|اجتهاد|تنزيل' },
    { id: 'eco',    ico: '📈', ar: 'اقتصاد وتسيير',     re: 'gestion|econom|financ|commerc|comptab|marketing|audit|fiscal|management|banque|assurance|logistique|entreprise|statistique|actuariat|ماليه|مالي|اقتصاد|تدبير|تسيير|محاسب|تجاره|اداره|entrepreneur|business|جبا|اعمال' },
    { id: 'tech',   ico: '💻', ar: 'معلوميات وهندسة',   re: 'informati|genie|ingenier|data|donnee|intelligence|reseau|electr|mecani|telecom|numerique|cyber|logiciel|developpement web|industri|automat|batiment|civil|energ|معلوم|هندسه|رقمي|ذكاء' },
    { id: 'sci',    ico: '🔬', ar: 'علوم دقيقة وطبيعية', re: 'physi|chimi|math|biolog|geolog|geoscience|svt|sciences de la vie|sciences de la terre|biochim|ecolog|materiau|matiere|terre|biotechnolog|فيزياء|كيمياء|رياضيات|بيولوج|جيولوج|علوم الحياه|علوم الارض|مواد|analyti|analyse|instrument|controle qualite' },
    { id: 'sante',  ico: '🩺', ar: 'صحة وطب',           re: 'medecin|pharmac|sante|infirm|paramedic|dentaire|kinesi|nutrition|sage-femme|biomedic|radiolog|(^| )(ال)?طب(ي|يه)?( |$)|صيدل|صحه|تمريض|اسنان' },
    { id: 'lettres',ico: '📚', ar: 'لغات وآداب',        re: 'lettres?|langue|anglais|arabe|francais|litterat|traduct|linguist|etudes (anglaises|francaises|arabes|hispaniques|amazigh)|amazigh|espagnol|hispanic|filolog|communication|journalis|medias?|لغه|اللغه|ادب|لسان|ترجم|اعلام|تواصل|امازيغ|english|film|literature|comparative studies|صحفي|تحرير|عربيه|خطاب|نص\b' },
    { id: 'hum',    ico: '🏛️', ar: 'علوم إنسانية واجتماعية', re: 'histoire|geograph|sociolog|philosoph|psycholog|anthropolog|patrimoine|archeolog|islamique|sciences? humain|amenagement|territoire|demograph|social|تاريخ|جغراف|اجتماع|فلسف|نفس|حضاره|مجتمع|تهي|تنميه|فقه|قران|حديث|اسلام|شرعي|islamic|transcultural|memory|صحراو|افريقي' },
    { id: 'edu',    ico: '🎓', ar: 'تربية وتعليم',      re: 'education|enseignement|pedagog|didactique|formation des|professeur|تربي|ديداكتيك|تعليم|تدريس' },
    { id: 'tour',   ico: '🧭', ar: 'سياحة وثقافة وفنون', re: 'tourisme|hotel|hotellerie|restaurat|culture|musique|theatre|design|cinema|audiovisuel|arts?\\b|سياح|فندق|ثقاف|فنون|مسرح|سينما|ابداع' },
    { id: 'env',    ico: '🌊', ar: 'بيئة وفلاحة وبحر',  re: 'agri|environnement|\\beau\\b|peche|halieut|marine|\\bmer\\b|ocean|aquacol|aquatique|forest|agro|developpement durable|ressources|climat|animale|terroir|بيئه|فلاح|بحر|مياه|مائي|طبيعيه|تهي|بيئ' }
  ];
  TAGS.forEach(function (t) { t.rx = new RegExp(t.re, 'i'); });

  function norm(s) {
    return (s || '').toString().toLowerCase()
      .replace(/[\u0640\u064B-\u065F\u0670]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
  }

  var LEVELS = [
    { id: 'BAC+2', ar: 'بعد البكالوريا بسنتين (DUT)' },
    { id: 'BAC+3', ar: 'إجازة (3 سنوات)' },
    { id: 'BAC+5', ar: 'ماستر / مهندس (5 سنوات)' }
  ];

  /** يُنشئ فهرساً قابلاً للبحث من ملف البيانات. */
  function prepare(data) {
    var inst = data.institutions;
    return data.items.map(function (x, i) {
      var ins = inst[x.x] || {};
      var hay = norm(x.n + ' ' + x.d);
      var tags = TAGS.filter(function (t) { return t.rx.test(hay); }).map(function (t) { return t.id; });
      return { i: i, n: x.n, d: x.d, l: x.l, u: x.u, e: ins.e || '', a: ins.a || '', c: ins.c || '', tags: tags, _h: hay + ' ' + norm(ins.e + ' ' + ins.a) };
    });
  }

  /** state = { level:'' | 'BAC+3'.., tags:[], city:'', q:'' } */
  function query(items, state) {
    var q = norm(state.q), terms = q ? q.split(' ') : [];
    var out = [];
    items.forEach(function (it) {
      if (state.level && it.l !== state.level) return;
      if (state.city && it.c !== state.city) return;
      if (terms.length && !terms.every(function (t) { return it._h.indexOf(t) >= 0; })) return;
      var hit = 0;
      if (state.tags.length) {
        state.tags.forEach(function (t) { if (it.tags.indexOf(t) >= 0) hit++; });
        if (!hit) return;
      }
      out.push({ it: it, s: hit });
    });
    out.sort(function (a, b) { return b.s - a.s || a.it.i - b.it.i; });
    return out;
  }

  /** عدد التكوينات لكل اهتمام ضمن المستوى والمدينة الحاليين (يُظهر «أين الفرص» قبل الاختيار). */
  function counts(items, state) {
    var c = {};
    TAGS.forEach(function (t) { c[t.id] = 0; });
    items.forEach(function (it) {
      if (state.level && it.l !== state.level) return;
      if (state.city && it.c !== state.city) return;
      it.tags.forEach(function (t) { c[t]++; });
    });
    return c;
  }

  var api = { TAGS: TAGS, LEVELS: LEVELS, norm: norm, prepare: prepare, query: query, counts: counts };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ChraimOrientation = api;
})(typeof window !== 'undefined' ? window : this);
