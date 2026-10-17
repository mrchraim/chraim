/* ==========================================================================
   «المواد والمقابلات ديالي» — بوابة CHRVVIM (kolchi)
   ملف مستقل (classic script) بلا اعتماد على مكتبات: محرّك حساب صافٍ + واجهة.
   البيانات من subjects-data.js  →  window.CHRVVIM_SUBJECTS
   لا يُصدر المحرّك أي قرار إعفاء ما لم تكن القاعدة الأكاديمية مؤكّدة (rule).
   ========================================================================== */
(function () {
  'use strict';

  /* ===================== المحرّك (منطق صافٍ) ===================== */
  var SEMESTERS_ALL = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
  var STATUS = Object.freeze({ passed: 'passed', failed: 'failed', pending: 'pending', na: 'na', unset: 'unset' });
  var STATUS_LIST = [STATUS.passed, STATUS.failed, STATUS.pending, STATUS.na];
  var EXEMPTING_RULES = { equivalence: 1, compensation: 1, exemption: 1 };

  function cfgOf(cfg) { return cfg && typeof cfg === 'object' ? cfg : { subjects: [], tracks: [], pairings: [] }; }
  function listTracks(cfg, system) { var c = cfgOf(cfg); return (c.tracks || []).filter(function (t) { return !system || t.system === system; }); }
  function listSystems(cfg) { var c = cfgOf(cfg); if (Array.isArray(c.systems) && c.systems.length) return c.systems.slice(); return Object.keys((c.tracks || []).reduce(function (a, t) { if (t.system) a[t.system] = 1; return a; }, {})); }
  function subjectsOf(cfg, o) {
    o = o || {};
    return (cfgOf(cfg).subjects || []).filter(function (s) {
      return s.semester === o.semester && (!o.track || s.track === o.track) && (!o.system || !s.system || s.system === o.system);
    });
  }
  function tracksWithSemester(cfg, semester, system) {
    var c = cfgOf(cfg); var ids = {};
    subjectsOf(c, { semester: semester, system: system }).forEach(function (s) { ids[s.track] = 1; });
    return listTracks(c, system).filter(function (t) { return ids[t.id]; });
  }
  function pairedSemester(cfg, semester, track) {
    var list = (cfgOf(cfg).pairings || []).filter(function (x) { return (x.track || '') === (track || ''); });
    var p = null; for (var i = 0; i < list.length; i++) { if (list[i].from === semester) { p = list[i]; break; } }
    return p ? p.to : null;
  }
  function subjectById(cfg, id) { var a = cfgOf(cfg).subjects || []; for (var i = 0; i < a.length; i++) { if (a[i].id === id) return a[i]; } return null; }
  function sortSemesters(list) {
    var u = []; list.forEach(function (x) { if (u.indexOf(x) < 0) u.push(x); });
    return u.sort(function (a, b) { return SEMESTERS_ALL.indexOf(a) - SEMESTERS_ALL.indexOf(b); });
  }

  function computeResult(cfg, o) {
    o = o || {};
    var c = cfgOf(cfg);
    var statuses = o.statuses || {};
    var from = subjectsOf(c, { semester: o.semester, track: o.track });
    var targetSemester = pairedSemester(c, o.semester, o.track);
    var to = targetSemester ? subjectsOf(c, { semester: targetSemester, track: o.track }) : [];
    var system = (from[0] && from[0].system) || (to[0] && to[0].system) || '';

    var passed = [], failed = [], pending = [], na = [], unset = [];
    from.forEach(function (s) {
      var st = statuses[s.id] || STATUS.unset;
      if (st === STATUS.passed) passed.push(s);
      else if (st === STATUS.failed) failed.push(s);
      else if (st === STATUS.pending) pending.push(s);
      else if (st === STATUS.na) na.push(s);
      else unset.push(s);
    });

    var nextSubjects = to.map(function (subject) {
      var sources = from.filter(function (f) { return Array.isArray(f.correspondsTo) && f.correspondsTo.indexOf(subject.id) >= 0; });
      var reason = 'new', state = 'required', needsReview = subject.confidence === 'needs_review';
      if (sources.length) reason = 'corresponds';
      sources.forEach(function (src) {
        var st = statuses[src.id] || STATUS.unset;
        var rule = subject.rule || (c.rules && c.rules.default) || 'unknown';
        if (st === STATUS.passed && EXEMPTING_RULES[rule]) state = 'eligible';
        else if (st === STATUS.passed && rule === 'none') state = 'required';
        else if (st === STATUS.passed) { state = 'review'; needsReview = true; }
      });
      if (reason === 'new' && Array.isArray(subject.correspondsTo) && subject.correspondsTo.length) reason = 'corresponds';
      return { subject: subject, reason: reason, state: state, needsReview: needsReview, sources: sources.map(function (x) { return x.id; }) };
    });

    var noCounterpart = from.filter(function (s) { return !Array.isArray(s.correspondsTo) || !s.correspondsTo.length; });
    var review = (c.review || []).filter(function (r) {
      return (!r.track || r.track === o.track) && (!r.semester || r.semester === o.semester || r.semester === targetSemester);
    });

    var warnings = [];
    if (!targetSemester) warnings.push('no-target');
    if (!to.length && targetSemester) warnings.push('target-empty');
    if (unset.length) warnings.push('unset');
    var uncertain = nextSubjects.some(function (n) { return n.state === 'review'; }) || review.length > 0;

    return {
      semester: o.semester, targetSemester: targetSemester, track: o.track, system: system,
      from: from, passed: passed, failed: failed, pending: pending, na: na, unset: unset,
      nextSubjects: nextSubjects, noCounterpart: noCounterpart, review: review,
      warnings: warnings, uncertain: uncertain, hasTarget: Boolean(targetSemester && to.length)
    };
  }

  function progressOf(result) {
    var total = result.from.length, done = 0;
    STATUS_LIST.forEach(function (k) { if (result[k] && result[k].length) done += result[k].length; });
    return { done: done, total: total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function buildSms(result, nameOf, L) {
    L = L || {};
    var nm = typeof nameOf === 'function' ? nameOf : function (s) { return (s && s.name) || ''; };
    var list = function (arr) { return arr.length ? arr.map(function (s) { return '• ' + nm(s); }).join('\n') : (L.none || '—'); };
    var nextList = (result.nextSubjects || []).length ? result.nextSubjects.map(function (n) { return '• ' + nm(n.subject) + (n.needsReview ? ' (؟)' : ''); }).join('\n') : (L.none || '—');
    var reviewList = (result.review || []).length ? result.review.map(function (r) { return '• ' + (r.note || r.ocr || ''); }).join('\n') : (L.none || '—');
    return [
      L.title || 'نتيجة وضعيتي الجامعية',
      (L.current || 'السداسي الحالي') + ': ' + result.semester,
      (L.next || 'السداسي المقبل') + ': ' + (result.targetSemester || '—'),
      '',
      (L.passed || 'المواد المستوفاة') + ':',
      list(result.passed),
      '',
      (L.remaining || 'المواد المتبقية') + ':',
      list([].concat(result.failed, result.pending)),
      '',
      (L.nextSubjects || 'مواد السداسي المقبل') + ':',
      nextList,
      '',
      (L.review || 'تحتاج مراجعة') + ':',
      reviewList,
      '',
      L.note || 'ملاحظة: يجب التأكد من قواعد التعويض والمعادلات المعتمدة قبل اعتبار أي مادة معفاة.'
    ].join('\n');
  }

  /* ===================== نص الواجهة (ar / fr / en) ===================== */
  var TXT = {
    ar: {
      title: 'المواد والمقابلات ديالي',
      lead: 'اختر سداسيك والمسلك، وحدّد حالة كل مادة، ثم استخرج المواد التي ستدرسها في السداسي المقبل. النتائج تقديرية وتحتاج تأكيداً.',
      semester: 'السداسي الحالي', next: 'السداسي المقبل', track: 'المسلك', noTrack: 'لا يوجد مسلك',
      progress: 'تقدّم الإدخال',
      passed: 'اجتزتها', failed: 'لم أنجح', pending: 'لم أجتز بعد', na: 'غير معنية', unset: 'لم يُحدَّد',
      secPassed: 'المواد التي استوفيتها', secRemaining: 'المواد التي ما زالت مطلوبة', secRemainingShort: 'المواد المتبقية', secNext: 'مواد السداسي المقبل',
      stateEligible: 'مستوفاة بمقابلة', stateRequired: 'مطلوبة', stateReview: 'تحتاج مراجعة',
      reasonNew: 'جديدة', reasonCorresponds: 'لها مقابل',
      needsReview: 'تحتاج مراجعة', none: 'لا شيء',
      noTarget: 'لا يوجد سداسٍ مقابل معرّف.', noData: 'بيانات المواد غير متوفّرة حالياً.', emptySemester: 'لا توجد مواد مسجّلة لهذا السداسي أو المسلك.',
      reviewTitle: 'عناصر تحتاج مراجعة',
      disclaimer: '⚠️ تنبيه: وجود مقابل لا يعني إعفاءً تلقائياً. يجب اعتماد قاعدة التعويض أو المعادلة الرسمية. النتائج هنا مؤقتة وتحتاج تحقّقاً.',
      copy: 'نسخ الرسالة', share: 'مشاركة النتيجة', edit: 'تعديل الاختيارات', reset: 'إعادة الحساب', compute: 'استخراج النتيجة',
      copied: 'تم نسخ الرسالة ✅', copyFail: 'تعذّر النسخ — انسخ يدوياً.',
      saveConsent: 'أوافق على حفظ اختياراتي على هذا الجهاز فقط', delete: 'حذف بياناتي',
      smsTitle: 'نتيجة وضعيتي الجامعية:', smsCurrent: 'السداسي الحالي', smsNext: 'السداسي المقبل',
      smsNote: 'ملاحظة: يجب التأكد من قواعد التعويض والمعادلات المعتمدة قبل اعتبار أي مادة معفاة.',
      S1: 'السداسي 1', S2: 'السداسي 2', S3: 'السداسي 3', S4: 'السداسي 4', S5: 'السداسي 5', S6: 'السداسي 6'
    },
    fr: {
      title: 'Mes matières et correspondances',
      lead: 'Choisissez votre semestre et votre filière, définissez le statut de chaque matière, puis obtenez les matières du semestre suivant. Résultats indicatifs, à confirmer.',
      semester: 'Semestre actuel', next: 'Semestre suivant', track: 'Filière', noTrack: 'Aucune filière',
      progress: 'Progression',
      passed: 'Validée', failed: 'Non validée', pending: 'Pas encore', na: 'Non concernée', unset: 'Non définie',
      secPassed: 'Matières validées', secRemaining: 'Matières encore requises', secRemainingShort: 'Matières restantes', secNext: 'Matières du semestre suivant',
      stateEligible: 'Validée par correspondance', stateRequired: 'Requise', stateReview: 'À vérifier',
      reasonNew: 'nouvelle', reasonCorresponds: 'avec correspondance',
      needsReview: 'à vérifier', none: 'Aucune',
      noTarget: 'Aucun semestre correspondant défini.', noData: 'Données des matières indisponibles.', emptySemester: 'Aucune matière pour ce semestre ou cette filière.',
      reviewTitle: 'Éléments à vérifier',
      disclaimer: '⚠️ Une correspondance n’implique pas une dispense automatique. La règle officielle (compensation/équivalence) doit être confirmée. Résultats provisoires.',
      copy: 'Copier le message', share: 'Partager le résultat', edit: 'Modifier les choix', reset: 'Recalculer', compute: 'Obtenir le résultat',
      copied: 'Message copié ✅', copyFail: 'Copie impossible — copiez manuellement.',
      saveConsent: 'J’accepte l’enregistrement de mes choix sur cet appareil uniquement', delete: 'Supprimer mes données',
      smsTitle: 'Résultat de ma situation universitaire :', smsCurrent: 'Semestre actuel', smsNext: 'Semestre suivant',
      smsNote: 'Remarque : vérifiez les règles de compensation/équivalence avant de considérer une matière dispensée.',
      S1: 'Semestre 1', S2: 'Semestre 2', S3: 'Semestre 3', S4: 'Semestre 4', S5: 'Semestre 5', S6: 'Semestre 6'
    },
    en: {
      title: 'My subjects and correspondences',
      lead: 'Pick your semester and track, set each subject’s status, then get the subjects of the next semester. Indicative results, to be confirmed.',
      semester: 'Current semester', next: 'Next semester', track: 'Track', noTrack: 'No track',
      progress: 'Progress',
      passed: 'Passed', failed: 'Not passed', pending: 'Not yet', na: 'Not applicable', unset: 'Not set',
      secPassed: 'Subjects you completed', secRemaining: 'Subjects still required', secRemainingShort: 'Remaining subjects', secNext: 'Next semester subjects',
      stateEligible: 'Completed by correspondence', stateRequired: 'Required', stateReview: 'Needs review',
      reasonNew: 'new', reasonCorresponds: 'has correspondence',
      needsReview: 'needs review', none: 'None',
      noTarget: 'No corresponding semester defined.', noData: 'Subject data is unavailable.', emptySemester: 'No subjects for this semester or track.',
      reviewTitle: 'Items needing review',
      disclaimer: '⚠️ A correspondence does not imply automatic exemption. The official compensation/equivalence rule must be confirmed. Results are provisional.',
      copy: 'Copy message', share: 'Share result', edit: 'Edit choices', reset: 'Recalculate', compute: 'Get result',
      copied: 'Message copied ✅', copyFail: 'Copy failed — copy manually.',
      saveConsent: 'I agree to save my choices on this device only', delete: 'Delete my data',
      smsTitle: 'My university status result:', smsCurrent: 'Current semester', smsNext: 'Next semester',
      smsNote: 'Note: verify the official compensation/equivalence rules before considering any subject exempt.',
      S1: 'Semester 1', S2: 'Semester 2', S3: 'Semester 3', S4: 'Semester 4', S5: 'Semester 5', S6: 'Semester 6'
    }
  
  
  
  ,
    zgh: {
      title: 'ⵜⵓⵙⵏⵉⵡⵉⵏ-ⵉⵏⵓ ⴷ ⵢⵉⵎⴰⵙⴰⵏⴻⵏ',
      lead: 'ⴼⵔⴻⵏ ⴰⵙⴻⵎⵙⵜⴻⵔ-ⵉⵏⴻⴽ ⴷ ⵓⴱⵔⵉⴷ-ⵉⵏⴻⴽ, ⵙⴳⵔ ⴰⴷⴰⴷ ⵏ ⵢⴰⵍ ⵜⵓⵙⵏⴰ, ⵙⵉⵏⴰ ⴽⴻⵙ ⵜⵓⵙⵏⵉⵡⵉⵏ ⵏ ⵓⵙⴻⵎⵙⵜⴻⵔ ⵢⵓⵙⴰ-ⴷ. ⵉⴳⵎⴰⴷⴻⵏ ⴷ ⵉⵇⵔⵉⴱⴻⵏ, ⵃⵡⴰⵊⴻⵏ ⴰⵙⴻⵏⵜⴻⵎ.',
      semester: 'ⴰⵙⴻⵎⵙⵜⴻⵔ ⵏ ⵜⵓⵔⴰ',
      next: 'ⴰⵙⴻⵎⵙⵜⴻⵔ ⵡⵉⵏⴻⴹⵏⵉ',
      track: 'ⴰⴱⵔⵉⴷ',
      noTrack: 'ⵓⵍⴰⴽ ⴰⴱⵔⵉⴷ',
      progress: 'ⴰⵙⴼⴰⵔⵉ',
      passed: 'ⵢⴻⵜⵡⴰⵇⴱⴻⵍ',
      failed: 'ⵓⵔ ⵉⵄⴻⴷ ⴰⵔⴰ',
      pending: 'ⵎⴰⵣⴰⵍ',
      na: 'ⵎⴰⵞⵉ ⵖⵓⵔ-ⵉ',
      unset: 'ⵓⵔ ⵢⴻⵜⵡⴰⵙⴳⵔⴰⵏ',
      secPassed: 'ⵜⵓⵙⵏⵉⵡⵉⵏ ⵉ ⵜⴻⴼⵓⴽⴻⴹ',
      secRemaining: 'ⵜⵓⵙⵏⵉⵡⵉⵏ ⵎⴰⵣⴰⵍ ⵜⵡⴰⵃⵡⴰⵊⴻⵏ',
      secRemainingShort: 'ⵜⵓⵙⵏⵉⵡⵉⵏ ⵢⴻⴳⵔⴰⵏ',
      secNext: 'ⵜⵓⵙⵏⵉⵡⵉⵏ ⵏ ⵓⵙⴻⵎⵙⵜⴻⵔ ⵡⵉⵏⴻⴹⵏⵉ',
      stateEligible: 'ⵢⴻⵜⵡⴰⵅⴷⴻⵎ ⵙ ⵓⵎⴻⵙⴰⵍⵉ',
      stateRequired: 'ⵢⴻⵜⵡⴰⵃⵡⴰⵊ',
      stateReview: 'ⵢⴻⵃⵡⴰⵊ ⴰⵙⴻⵏⵇⴻⴷ',
      reasonNew: 'ⵜⴰⵎⴰⵢⵏⵓⵜ',
      reasonCorresponds: 'ⵢⴻⵙⵄⴰ ⴰⵎⴻⵙⴰⵍⵉ',
      needsReview: 'ⵢⴻⵃⵡⴰⵊ ⴰⵙⴻⵏⵇⴻⴷ',
      none: 'ⵓⵍⴰⴽ',
      noTarget: 'ⵓⵍⴰⴽ ⴰⵙⴻⵎⵙⵜⴻⵔ ⵉⵎⴻⵙⴰⵍⴻⵏ ⵢⴻⵜⵡⴰⴳⴻⵏⴻⵏ.',
      noData: 'ⵉⵙⴻⴼⴽⴰ ⵏ ⵜⵓⵙⵏⵉⵡⵉⵏ ⵓⵔ ⵍⵉⵏ ⴰⵔⴰ ⵜⵓⵔⴰ.',
      emptySemester: 'ⵓⵍⴰⴽ ⵜⵓⵙⵏⵉⵡⵉⵏ ⵢⴻⵜⵡⴰⵔⵓⵏ ⵉ ⵓⵙⴻⵎⵙⵜⴻⵔ-ⴰ ⵏⴻⵖ ⵉ ⵓⴱⵔⵉⴷ-ⴰ.',
      reviewTitle: 'ⵉⴼⵓⵔⴽⴰⵏ ⵉ ⵉⵃⵡⴰⵊⴻⵏ ⴰⵙⴻⵏⵇⴻⴷ',
      disclaimer: '⚠️ ⴰⵎⴻⵙⴰⵍⵉ ⵎⴰⵞⵉ ⴷ ⴰⵙⴻⵔⵉⵃ ⴰⵡⵓⵔⵎⴰⵏ. ⵉⵍⴰⵇ ⴰⴷ ⵢⴻⵜⵡⴰⵙⴻⵏⵜⴻⵎ ⵓⵙⴰⴹⵓⴼ ⴰⵎⴰⴷⵓⴷ (ⴰⵎⵙⴰⵙⴰ ⵏⴻⵖ ⵜⴰⵎⵚⴰⵍⵉ). ⵉⴳⵎⴰⴷⴻⵏ-ⴰ ⴷ ⵉⴳⵣⵓⵍⴻⵏ, ⵃⵡⴰⵊⴻⵏ ⴰⵙⴻⵏⵜⴻⵎ.',
      copy: 'ⵏⵖⴻⵍ ⴰⴹⵔⵉⵙ',
      share: 'ⴱⴹⵓ ⴰⴳⵎⵓⴹ',
      edit: 'ⴱⴻⴷⴻⵍ ⴰⴼⵔⴰⵏⴻⵏ',
      reset: 'ⵄⴰⵡⴻⴷ ⴰⵙⵉⴹⴻⵏ',
      compute: 'ⴽⴻⵙ ⴰⴳⵎⵓⴹ',
      copied: 'ⵢⴻⵜⵡⴰⵏⵖⴻⵍ ✅',
      copyFail: 'ⵓⵔ ⵢⴻⵣⵎⵉⵔ ⴰⵔⴰ ⴰⴷ ⵢⵏⵖⴻⵍ — ⵏⵖⴻⵍ ⵙ ⵓⴼⵓⵙ.',
      saveConsent: 'ⵇⴻⴱⵍⴻⵖ ⴰⵙⴻⴽⵍⴻⵙ ⵏ ⵓⴼⵔⴰⵏⴻⵏ-ⵉⵏⵓ ⴷⴻⴳ ⵉⵎⵉⵏⵉⴳ-ⴰ ⴽⴰⵏ',
      delete: 'ⴽⴻⵙ ⵉⵙⴻⴼⴽⴰ-ⵉⵏⵓ',
      smsTitle: 'ⴰⴳⵎⵓⴹ ⵏ ⵡⴰⴷⴰⴷ-ⵉⵏⵓ ⴰⵙⴷⴰⵡⴰⵏ:',
      smsCurrent: 'ⴰⵙⴻⵎⵙⵜⴻⵔ ⵏ ⵜⵓⵔⴰ',
      smsNext: 'ⴰⵙⴻⵎⵙⵜⴻⵔ ⵡⵉⵏⴻⴹⵏⵉ',
      smsNote: 'ⵜⴰⵎⴰⵜⴰⵔⵜ: ⵙⴻⵏⵇⴻⴷ ⵉⵙⴰⴹⵓⴼⴻⵏ ⵏ ⵓⵎⵙⴰⵙⴰ ⴷ ⵢⵉⵎⴻⵙⴰⵍⵉⵢⴻⵏ ⵢⴻⵜⵡⴰⵇⴱⴰⵍⴻⵏ ⵙⴻⵏⴷ ⴰⴷ ⵜⴻⵜⵡⴰⵍⵢⴻⴹ ⵜⵓⵙⵏⴰ ⵙ ⴰⵙⴻⵔⵉⵃ.',
      S1: 'ⴰⵙⴻⵎⵙⵜⴻⵔ 1',
      S2: 'ⴰⵙⴻⵎⵙⵜⴻⵔ 2',
      S3: 'ⴰⵙⴻⵎⵙⵜⴻⵔ 3',
      S4: 'ⴰⵙⴻⵎⵙⵜⴻⵔ 4',
      S5: 'ⴰⵙⴻⵎⵙⵜⴻⵔ 5',
      S6: 'ⴰⵙⴻⵎⵙⵜⴻⵔ 6',
    },
    'zgh-latn': {
      title: 'Tusniwin-inu d yimassanen',
      lead: 'Fren asemster-inek d ubrid-inek, sgr addad n yal tusna, sinna kkes tusniwin n usemster yusa-d. Igmaden d iqriben, ḥwajen asentem.',
      semester: 'Asemster n tura',
      next: 'Asemster wineḍni',
      track: 'Abrid',
      noTrack: 'Ulac abrid',
      progress: 'Asfari',
      passed: 'Yettwaqbel',
      failed: 'Ur iɛedd ara',
      pending: 'Mazal',
      na: 'Mačči ɣur-i',
      unset: 'Ur yettwasgran',
      secPassed: 'Tusniwin i tefukeḍ',
      secRemaining: 'Tusniwin mazal ttwaḥwajen',
      secRemainingShort: 'Tusniwin yeggran',
      secNext: 'Tusniwin n usemster wineḍni',
      stateEligible: 'Yettwaxdem s umessali',
      stateRequired: 'Yettwaḥwaj',
      stateReview: 'Yeḥwaj asenqed',
      reasonNew: 'tamaynut',
      reasonCorresponds: 'yesɛa amessali',
      needsReview: 'yeḥwaj asenqed',
      none: 'Ulac',
      noTarget: 'Ulac asemster imessalen yettwagennen.',
      noData: 'Isefka n tusniwin ur llin ara tura.',
      emptySemester: 'Ulac tusniwin yettwarun i usemster-a neɣ i ubrid-a.',
      reviewTitle: 'Ifurkan i iḥwajen asenqed',
      disclaimer: '⚠️ Amessali mačči d aserriḥ awurman. Ilaq ad yettwasentem usaḍuf amaddud (amsasa neɣ tamṣali). Igmaden-a d igzulen, ḥwajen asentem.',
      copy: 'Nɣel aḍris',
      share: 'Bḍu agmuḍ',
      edit: 'Beddel afranen',
      reset: 'Ɛawed asiḍen',
      compute: 'Kkes agmuḍ',
      copied: 'Yettwanɣel ✅',
      copyFail: 'Ur yezmir ara ad ynɣel — nɣel s ufus.',
      saveConsent: 'Qebleɣ asekles n ufranen-inu deg iminig-a kan',
      delete: 'Kkes isefka-inu',
      smsTitle: 'Agmuḍ n waddad-inu asdawan:',
      smsCurrent: 'Asemster n tura',
      smsNext: 'Asemster wineḍni',
      smsNote: 'Tamatart: senqed isaḍufen n umsasa d yimessaliyen yettwaqbalen send ad tettwalyeḍ tusna s aserriḥ.',
      S1: 'Asemster 1',
      S2: 'Asemster 2',
      S3: 'Asemster 3',
      S4: 'Asemster 4',
      S5: 'Asemster 5',
      S6: 'Asemster 6',
    }
  };

  /* ===================== أدوات الواجهة ===================== */
  function curLang() { try { if (typeof UILANG !== 'undefined' && UILANG && TXT[UILANG]) return UILANG; } catch (e) {} return 'ar'; }
  function tt(k) { var l = curLang(); return (TXT[l] && TXT[l][k]) || TXT.ar[k] || k; }
  function nm(o) { if (o == null) return ''; if (typeof o === 'string') return o; var l = curLang(); return o[l] || o.ar || o.fr || o.en || ''; }
  function E(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]); }); }
  var mem = {};
  var ST = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
    remove: function (k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }
  };

  var SAVE_KEY = 'chrvvim.kolchi.subjects';
  var CONSENT_KEY = 'chrvvim.kolchi.subjects.consent';
  var cfg = window.CHRVVIM_SUBJECTS || null;
  var ui = { track: '', semester: '', statuses: {}, open: false, result: null };

  function statusMeta(st) {
    var map = {};
    map[STATUS.passed] = { icon: '✅', key: 'passed', cls: 'st-passed' };
    map[STATUS.failed] = { icon: '❌', key: 'failed', cls: 'st-failed' };
    map[STATUS.pending] = { icon: '⏳', key: 'pending', cls: 'st-pending' };
    map[STATUS.na] = { icon: '➖', key: 'na', cls: 'st-na' };
    map[STATUS.unset] = { icon: '•', key: 'unset', cls: 'st-unset' };
    return map[st] || map[STATUS.unset];
  }

  function ensureDefaults() {
    if (!cfg) return;
    var semiList = sortSemesters((cfg.subjects || []).map(function (s) { return s.semester; }));
    if (!ui.semester || semiList.indexOf(ui.semester) < 0) ui.semester = semiList[0] || 'S1';
    var tracks = tracksWithSemester(cfg, ui.semester);
    if (!ui.track || !tracks.some(function (x) { return x.id === ui.track; })) ui.track = tracks[0] ? tracks[0].id : '';
  }
  function restore() {
    if (!cfg) return;
    var saved = ST.get(SAVE_KEY);
    if (saved) {
      try {
        var o = JSON.parse(saved);
        if (o && o.consent) { ui.semester = o.semester || ''; ui.track = o.track || ''; ui.statuses = (o.statuses && typeof o.statuses === 'object') ? o.statuses : {}; }
      } catch (e) {}
    }
    ensureDefaults();
  }
  function persist() {
    if (ST.get(CONSENT_KEY) !== 'yes') return;
    ST.set(SAVE_KEY, JSON.stringify({ consent: true, semester: ui.semester, track: ui.track, statuses: ui.statuses }));
  }

  /* ===================== HTML ===================== */
  function controlsHtml() {
    var semiList = sortSemesters((cfg.subjects || []).map(function (s) { return s.semester; }));
    var tracks = tracksWithSemester(cfg, ui.semester);
    var next = pairedSemester(cfg, ui.semester, ui.track);
    var opt = function (v, label, cur) { return '<option value="' + E(v) + '"' + (v === cur ? ' selected' : '') + '>' + E(label) + '</option>'; };
    var semLabel = function (s) { return tt(s) === s ? s : tt(s); };
    var nextLabel = next ? (tt(next) === next ? next : tt(next)) : '—';
    return '' +
      '<div class="grid subjects-controls">' +
      '<div class="field"><label for="subjSemester">' + E(tt('semester')) + '</label><select id="subjSemester">' + semiList.map(function (s) { return opt(s, semLabel(s), ui.semester); }).join('') + '</select></div>' +
      '<div class="field"><label for="subjTrack">' + E(tt('track')) + '</label><select id="subjTrack">' + (tracks.length ? tracks.map(function (tr) { return opt(tr.id, nm(tr.name) || tr.id, ui.track); }).join('') : '<option value="">' + E(tt('noTrack')) + '</option>') + '</select></div>' +
      '<div class="field"><label>' + E(tt('next')) + '</label><div class="chip g" id="subjNext">' + E(nextLabel) + '</div></div>' +
      '</div>';
  }

  function cardsHtml() {
    var list = subjectsOf(cfg, { semester: ui.semester, track: ui.track });
    if (!list.length) return '<p class="empty">' + E(tt('emptySemester')) + '</p>';
    return list.map(function (s) {
      var cur = ui.statuses[s.id] || STATUS.unset;
      var btns = STATUS_LIST.map(function (st) {
        var m = statusMeta(st);
        return '<button class="stbtn ' + m.cls + (cur === st ? ' on' : '') + '" type="button" data-id="' + E(s.id) + '" data-status="' + st + '" title="' + E(tt(m.key)) + '"><span aria-hidden="true">' + m.icon + '</span><span class="stbtn__t">' + E(tt(m.key)) + '</span></button>';
      }).join('');
      var flag = s.confidence === 'needs_review' ? '<span class="chip warn">' + E(tt('needsReview')) + '</span>' : '';
      return '<article class="card mini subject-card" data-id="' + E(s.id) + '">' +
        '<div class="subject-head"><h4>' + E(nm(s.name)) + '</h4>' + flag + '<span class="chip g">' + E(s.semester) + (s.system ? ' · ' + E(s.system) : '') + '</span></div>' +
        (s.name && s.name.fr && curLang() !== 'fr' ? '<p class="muted subj-fr">' + E(s.name.fr) + '</p>' : '') +
        '<div class="stbtns">' + btns + '</div>' +
        '</article>';
    }).join('');
  }

  function listNames(arr) {
    if (!arr || !arr.length) return '<p class="empty">' + E(tt('none')) + '</p>';
    return '<ul class="subj-list">' + arr.map(function (s) { return '<li>' + E(nm(s.name)) + '</li>'; }).join('') + '</ul>';
  }

  function resultHtml(r) {
    var nextRows = (r.nextSubjects || []).map(function (n) {
      var reason = n.reason === 'corresponds' ? tt('reasonCorresponds') : tt('reasonNew');
      var stateLabel = n.state === 'eligible' ? tt('stateEligible') : (n.state === 'review' ? tt('stateReview') : tt('stateRequired'));
      var stateCls = n.state === 'eligible' ? 'ok' : (n.state === 'review' ? 'warn' : 'g');
      return '<li class="nextrow"><div><b>' + E(nm(n.subject.name)) + '</b><span class="muted"> · ' + E(n.subject.semester) + (n.subject.system ? ' · ' + E(n.subject.system) : '') + ' · ' + E(reason) + '</span></div><span class="chip ' + stateCls + '">' + E(stateLabel) + (n.needsReview ? ' · ' + E(tt('needsReview')) : '') + '</span></li>';
    }).join('') || '<li class="empty">' + E(tt('noTarget')) + '</li>';

    var reviewHtml = (r.review || []).length
      ? '<div class="subj-review"><h4>' + E(tt('reviewTitle')) + '</h4><ul class="subj-list">' + r.review.map(function (x) { return '<li>' + E(x.note || x.ocr || '') + ' <span class="muted">(' + E(x.semester || '') + ')</span></li>'; }).join('') + '</ul></div>'
      : '';

    return '' +
      '<div class="grid subj-sections">' +
      '<article class="card mini"><h4>✅ ' + E(tt('secPassed')) + '</h4>' + listNames(r.passed) + '</article>' +
      '<article class="card mini"><h4>❌ ' + E(tt('secRemaining')) + '</h4>' + listNames([].concat(r.failed, r.pending)) + '</article>' +
      '<article class="card mini wide"><h4>📚 ' + E(tt('secNext')) + '</h4><ul class="subj-list nextlist">' + nextRows + '</ul></article>' +
      '</div>' + reviewHtml +
      '<p class="note">' + E(tt('disclaimer')) + '</p>' +
      '<div class="row">' +
      '<button class="btn" id="subjCopy" type="button">📋 ' + E(tt('copy')) + '</button>' +
      '<button class="btn sec" id="subjShare" type="button">🔗 ' + E(tt('share')) + '</button>' +
      '<button class="btn ghost" id="subjEdit" type="button">✏️ ' + E(tt('edit')) + '</button>' +
      '<button class="btn ghost" id="subjReset" type="button">↻ ' + E(tt('reset')) + '</button>' +
      '</div>';
  }

  function render() {
    var host = document.getElementById('subjBody');
    if (!host) return;
    if (!cfg) { host.innerHTML = '<p class="empty">' + E(tt('noData')) + '</p>'; return; }
    ensureDefaults();
    var r = computeResult(cfg, { semester: ui.semester, track: ui.track, statuses: ui.statuses });
    ui.result = r;
    var prog = progressOf(r);
    var consent = ST.get(CONSENT_KEY) === 'yes';

    host.innerHTML = '' +
      controlsHtml() +
      '<div class="subj-progress" role="group" aria-label="' + E(tt('progress')) + '">' +
      '<div class="bar"><span style="width:' + prog.pct + '%"></span></div>' +
      '<span class="muted">' + E(tt('progress')) + ': ' + prog.done + '/' + prog.total + ' (' + prog.pct + '%)</span>' +
      '</div>' +
      '<div class="grid subj-cards" id="subjCards">' + cardsHtml() + '</div>' +
      '<div class="subj-actions">' +
      '<label class="subj-consent"><input type="checkbox" id="subjConsent"' + (consent ? ' checked' : '') + '> ' + E(tt('saveConsent')) + '</label>' +
      '<button class="btn ghost small" id="subjDelete" type="button">🗑️ ' + E(tt('delete')) + '</button>' +
      '</div>' +
      '<div id="subjResult" class="subj-result"' + (ui.open ? '' : ' hidden') + '>' + resultHtml(r) + '</div>' +
      '<div class="row" style="margin-top:10px"><button class="btn" id="subjCompute" type="button">📊 ' + E(tt('compute')) + '</button></div>';

    wire(host);
  }

  function wire(host) {
    var on = function (sel, ev, fn) { var el = host.querySelector(sel); if (el) el.addEventListener(ev, fn); };
    on('#subjSemester', 'change', function (e) { ui.semester = e.target.value; ui.track = ''; ensureDefaults(); persist(); render(); });
    on('#subjTrack', 'change', function (e) { ui.track = e.target.value; persist(); render(); });
    on('#subjCards', 'click', function (e) {
      var btn = e.target.closest ? e.target.closest('.stbtn') : null;
      if (!btn) return;
      var id = btn.dataset.id, status = btn.dataset.status;
      if (ui.statuses[id] === status) delete ui.statuses[id]; else ui.statuses[id] = status;
      persist(); render();
    });
    on('#subjCompute', 'click', function () { ui.open = true; render(); });
    on('#subjEdit', 'click', function () { ui.open = false; render(); });
    on('#subjReset', 'click', function () { ui.statuses = {}; ui.open = false; persist(); render(); });
    on('#subjDelete', 'click', function () { ui.statuses = {}; ui.open = false; ST.remove(SAVE_KEY); ST.set(CONSENT_KEY, 'no'); render(); });
    on('#subjConsent', 'change', function (e) { ST.set(CONSENT_KEY, e.target.checked ? 'yes' : 'no'); if (e.target.checked) persist(); else ST.remove(SAVE_KEY); });
    on('#subjCopy', 'click', copyResult);
    on('#subjShare', 'click', shareResult);
  }

  function smsText() {
    return buildSms(ui.result, function (s) { return nm(s && s.name); }, {
      title: tt('smsTitle'), current: tt('smsCurrent'), next: tt('smsNext'),
      passed: tt('secPassed'), remaining: tt('secRemainingShort'), nextSubjects: tt('secNext'),
      review: tt('reviewTitle'), note: tt('smsNote'), none: tt('none')
    });
  }
  function flash(msg, cls) {
    var host = document.getElementById('subjBody'); if (!host) return;
    var el = document.createElement('div'); el.className = 'note ' + (cls || ''); el.style.marginTop = '8px'; el.textContent = msg;
    host.appendChild(el); setTimeout(function () { el.remove(); }, 2200);
  }
  function copyResult() {
    if (!ui.result) return;
    var text = smsText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash(tt('copied')); }, function () { legacyCopy(text); });
    } else { legacyCopy(text); }
  }
  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '-1000px';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); flash(tt('copied'));
    } catch (e) { flash(tt('copyFail'), 'warn'); }
  }
  function shareResult() {
    if (!ui.result) return;
    var text = smsText();
    if (navigator.share) { navigator.share({ title: tt('title'), text: text }).catch(function () {}); } else { copyResult(); }
  }

  /* ===================== حقن الأنماط (مرة واحدة) ===================== */
  function injectCss() {
    if (document.getElementById('subj-css')) return;
    var css = '' +
      '.subjects-controls{align-items:end}' +
      '.subjects-controls .field{margin:0}' +
      '.subject-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:space-between}' +
      '.subject-head h4{margin:0;font-size:1rem}' +
      '.subj-fr{margin:4px 0 0}' +
      '.stbtns{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}' +
      '.stbtn{border:1px solid var(--line);background:var(--card);border-radius:10px;padding:7px 10px;cursor:pointer;font-size:.8rem;font-weight:700;color:var(--ink);display:inline-flex;gap:6px;align-items:center;transition:.15s}' +
      '.stbtn:hover{border-color:var(--gold);transform:translateY(-1px)}' +
      '.stbtn.on{background:var(--blue);color:#fff;border-color:var(--blue)}' +
      '.stbtn.on.st-passed{background:var(--ok);border-color:var(--ok)}' +
      '.stbtn.on.st-failed{background:#b3261e;border-color:#b3261e}' +
      '.stbtn.on.st-pending{background:var(--gold);color:#0b2a6f;border-color:var(--gold)}' +
      '.stbtn.on.st-na{background:var(--muted);border-color:var(--muted)}' +
      '.chip.warn{background:var(--warnbg);color:var(--warn);border:1px solid var(--warn)}' +
      '.chip.ok{background:var(--ok);color:#fff}' +
      '.subj-progress{display:flex;align-items:center;gap:10px;margin:12px 0}' +
      '.subj-progress .bar{flex:1;height:12px;background:var(--soft);border-radius:99px;overflow:hidden;border:1px solid var(--line)}' +
      '.subj-progress .bar span{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--blue2));transition:width .3s}' +
      '.subj-list{margin:0;padding-inline-start:18px}' +
      '.subj-list li{margin:4px 0}' +
      '.subj-list.nextlist{padding:0;list-style:none}' +
      '.nextrow{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:8px 10px;margin:6px 0;background:var(--card)}' +
      '.subj-review{border:1px dashed var(--warn);background:var(--warnbg);color:var(--warn);border-radius:12px;padding:10px 14px;margin:10px 0}' +
      '.subj-review h4{margin:0 0 6px}' +
      '.subj-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:6px 0 10px}' +
      '.subj-consent{display:flex;align-items:center;gap:8px;font-size:.85rem;color:var(--muted);font-weight:400}' +
      '.btn.ghost{background:transparent;border:1px solid var(--line);color:var(--ink)}' +
      '.btn.ghost:hover{background:var(--soft)}' +
      '.btn.small{padding:8px 12px;font-size:.82rem}' +
      '.subj-result{margin-top:12px}' +
      '.subj-result[hidden]{display:none}' +
      '.subj-sections .card.mini.wide{grid-column:1/-1}' +
      '.cat-title{display:flex;align-items:center;gap:8px;margin:2px 0 6px}' +
      '.cat-title h2{margin:0;font-size:1.25rem;color:var(--blue2)}' +
      ':root[data-theme=dark] .cat-title h2{color:var(--gold2)}';
    var st = document.createElement('style'); st.id = 'subj-css'; st.textContent = css; document.head.appendChild(st);
  }

  /* ===================== نقطة الدخول ===================== */
  var liveTried = false;
  // Prefer the live config served by the portal's API (reflects admin edits). On static hosting
  // (e.g. Netlify) the endpoint is absent, so we keep the bundled static data — no breakage.
  function tryLive() {
    if (liveTried) return;
    liveTried = true;
    try {
      fetch('/api/public/subjects', { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('offline'); return r.json(); })
        .then(function (j) {
          if (j && Array.isArray(j.subjects) && j.subjects.length) {
            cfg = j;
            if (document.getElementById('subjBody')) render();
          }
        })
        .catch(function () { /* keep bundled static data */ });
    } catch (e) { /* keep bundled static data */ }
  }

  function renderSubjects() {
    var host = document.getElementById('p-subjects');
    if (!host) return;
    injectCss();
    if (!host.querySelector('#subjBody')) {
      host.innerHTML = '' +
        '<div class="cat-title"><h2>📚 ' + E(tt('title')) + '</h2></div>' +
        '<p class="muted">' + E(tt('lead')) + '</p>' +
        '<div id="subjBody"></div>';
    } else {
      // تحديث العناوين عند تغيير اللغة دون فقدان الحالة
      var h = host.querySelector('.cat-title h2'); if (h) h.textContent = '📚 ' + tt('title');
      var p = host.querySelector('.muted'); if (p && p.parentNode === host) p.textContent = tt('lead');
    }
    restore();
    render();
    tryLive();
  }

  window.Subjects = { render: renderSubjects };
  // واجهة للاختبارات (بلا DOM)
  window.CHRVVIM_SUBJECTS_ENGINE = {
    STATUS: STATUS, computeResult: computeResult, progressOf: progressOf, buildSms: buildSms,
    subjectsOf: subjectsOf, pairedSemester: pairedSemester, tracksWithSemester: tracksWithSemester,
    listTracks: listTracks, listSystems: listSystems, sortSemesters: sortSemesters, subjectById: subjectById
  };
})();
