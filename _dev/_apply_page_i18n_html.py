#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""_apply_page_i18n_html.py — annotate index.html with data-i18n hooks.

One-off, idempotent-ish migration for the first-page i18n work. Every edit is an
exact string replacement with an expected occurrence count; the script aborts if
any pattern does not match exactly, so it can never silently half-apply.
"""
import io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
P = os.path.join(ROOT, "index.html")

with open(P, "rb") as f:
    raw = f.read()
bom = raw.startswith(b"\xef\xbb\xbf")
html = raw.decode("utf-8-sig")

R = []  # (label, old, new, count)

def add(label, old, new, count=1):
    R.append((label, old, new, count))

# ---- header aria ----------------------------------------------------------
add("nav-aria",
    '<nav class="ab-nav" id="abnav" aria-label="تنقّل سريع"></nav>',
    '<nav class="ab-nav" id="abnav" aria-label="تنقّل سريع" data-i18n-aria="aria.nav"></nav>')
add("uilang-aria",
    '<div class="seg" id="uilang" role="group" aria-label="لغة الواجهة">',
    '<div class="seg" id="uilang" role="group" aria-label="لغة الواجهة" data-i18n-aria="aria.uilang">')
add("comfort-aria",
    '<button type="button" class="iconbtn" id="comfort" aria-label="وضع راحة العين" title="راحة العين">',
    '<button type="button" class="iconbtn" id="comfort" aria-label="وضع راحة العين" title="راحة العين" data-i18n-aria="aria.comfort" data-i18n-title="aria.comfortTitle">')
add("theme-aria",
    '<button type="button" class="iconbtn" id="theme" aria-label="تبديل الوضع الليلي" title="الوضع الليلي">',
    '<button type="button" class="iconbtn" id="theme" aria-label="تبديل الوضع الليلي" title="الوضع الليلي" data-i18n-aria="aria.theme" data-i18n-title="aria.themeTitle">')

# ---- hero -----------------------------------------------------------------
add("hero-actions-aria",
    '<div class="hero-actions" aria-label="روابط رئيسية">',
    '<div class="hero-actions" aria-label="روابط رئيسية" data-i18n-aria="aria.heroActions">')
add("hero-cta",
    '<a class="hero-action primary" href="#homeQuick">ابدأ من هنا — كل خدمات المنصة <span aria-hidden="true">↓</span></a>',
    '<a class="hero-action primary" href="#homeQuick"><span data-i18n="hero.cta">ابدأ من هنا — كل خدمات المنصة</span> <span aria-hidden="true">↓</span></a>')

# ---- hub heading ----------------------------------------------------------
add("hub-heading",
    '<div class="quick-heading"><div><span class="eyebrow">CHRVVIM CAMPUS · STUDENT TOOLS</span><h2 id="quickTitle">الاختيارات الكبرى</h2><p>كل خدمات المنصة منظّمة في مكان واحد — اختار من وين تبدا، وكل شي على بعد ضغطة.</p></div><span class="quick-badge">واجهة الطلبة</span></div>',
    '<div class="quick-heading"><div><span class="eyebrow">CHRVVIM CAMPUS · STUDENT TOOLS</span><h2 id="quickTitle" data-i18n="hub.title">الاختيارات الكبرى</h2><p data-i18n="hub.sub">كل خدمات المنصة منظّمة في مكان واحد — اختار من وين تبدا، وكل شي على بعد ضغطة.</p></div><span class="quick-badge" data-i18n="hub.badge">واجهة الطلبة</span></div>')

# ---- hub group titles -----------------------------------------------------
add("hub-g1", '<h3 class="hub-title">دراستي</h3>', '<h3 class="hub-title" data-i18n="hub.g1">دراستي</h3>')
add("hub-g2", '<h3 class="hub-title">مواردي</h3>', '<h3 class="hub-title" data-i18n="hub.g2">مواردي</h3>')
add("hub-g3", '<h3 class="hub-title">أدواتي</h3>', '<h3 class="hub-title" data-i18n="hub.g3">أدواتي</h3>')
add("hub-g4", '<h3 class="hub-title">الجامعة</h3>', '<h3 class="hub-title" data-i18n="hub.g4">الجامعة</h3>')
add("hub-g5", '<h3 class="hub-title">المجتمع والمنصة</h3>', '<h3 class="hub-title" data-i18n="hub.g5">المجتمع والمنصة</h3>')

# ---- hub footer -----------------------------------------------------------
add("hub-foot",
    '<div class="quick-foot"><span class="live-dot" aria-hidden="true"></span><span>منصة طلابية مستقلة — راجع المصدر الرسمي قبل اعتماد أي موعد أو وثيقة.</span><a href="https://fsjpa.uiz.ac.ma/" target="_blank" rel="noopener noreferrer">الموقع الرسمي للكلية ↗</a></div>',
    '<div class="quick-foot"><span class="live-dot" aria-hidden="true"></span><span data-i18n="hub.foot">منصة طلابية مستقلة — راجع المصدر الرسمي قبل اعتماد أي موعد أو وثيقة.</span><a href="https://fsjpa.uiz.ac.ma/" target="_blank" rel="noopener noreferrer" data-i18n="hub.footLink">الموقع الرسمي للكلية ↗</a></div>')

# ---- announcements --------------------------------------------------------
add("ann-title",
    '<path d="M7.5 14.5V19"/></svg>إعلانات المنصة</h2>',
    '<path d="M7.5 14.5V19"/></svg><span data-i18n="ann.title">إعلانات المنصة</span></h2>')
add("ann-sub",
    '<p class="muted">آخر المستجدات والإعلانات المنشورة للطلبة.</p>',
    '<p class="muted" data-i18n="ann.sub">آخر المستجدات والإعلانات المنشورة للطلبة.</p>')
add("ann-loading",
    '<div id="campus-announcements-status" class="note" role="status" aria-live="polite">كنحمّلو الإعلانات...</div>',
    '<div id="campus-announcements-status" class="note" role="status" aria-live="polite" data-i18n="ann.loading">كنحمّلو الإعلانات...</div>')

# ---- tabs aside -----------------------------------------------------------
add("aside-aria",
    '<aside class="tabs" role="tablist" aria-label="أقسام المنصة">',
    '<aside class="tabs" role="tablist" aria-label="أقسام المنصة" data-i18n-aria="aria.sections">')

# ---- mytt panel -----------------------------------------------------------
add("mytt-h2", '<h2>جدولي الشخصي</h2>\n        <p class="tool-lead">نظّم حصصك الأسبوعية بنفسك. كل شي كيتسجّل غير فهاد الجهاز (محليًا)، وما كيتصيفطش لأي جهة.</p>',
    '<h2 data-i18n="mytt.h2">جدولي الشخصي</h2>\n        <p class="tool-lead" data-i18n="mytt.lead">نظّم حصصك الأسبوعية بنفسك. كل شي كيتسجّل غير فهاد الجهاز (محليًا)، وما كيتصيفطش لأي جهة.</p>')
add("mytt-day",
    '<label for="myttDay">اليوم</label><select id="myttDay"><option>الاثنين</option><option>الثلاثاء</option><option>الأربعاء</option><option>الخميس</option><option>الجمعة</option><option>السبت</option></select>',
    '<label for="myttDay" data-i18n="mytt.day">اليوم</label><select id="myttDay"><option value="mon" data-i18n="day.mon">الاثنين</option><option value="tue" data-i18n="day.tue">الثلاثاء</option><option value="wed" data-i18n="day.wed">الأربعاء</option><option value="thu" data-i18n="day.thu">الخميس</option><option value="fri" data-i18n="day.fri">الجمعة</option><option value="sat" data-i18n="day.sat">السبت</option></select>')
add("mytt-from", '<label for="myttFrom">من</label>', '<label for="myttFrom" data-i18n="mytt.from">من</label>')
add("mytt-to", '<label for="myttTo">إلى</label>', '<label for="myttTo" data-i18n="mytt.to">إلى</label>')
add("mytt-subj", '<label for="myttSubj">المادة</label><input id="myttSubj" type="text" maxlength="80" placeholder="مثال: القانون المدني" autocomplete="off">',
    '<label for="myttSubj" data-i18n="mytt.subj">المادة</label><input id="myttSubj" type="text" maxlength="80" placeholder="مثال: القانون المدني" data-i18n-ph="mytt.subjPh" autocomplete="off">')
add("mytt-kind",
    '<label for="myttKind">النوع</label><select id="myttKind"><option>محاضرة</option><option>حصة تطبيقية</option><option>أعمال موجهة</option><option>امتحان</option></select>',
    '<label for="myttKind" data-i18n="mytt.kind">النوع</label><select id="myttKind"><option value="lecture" data-i18n="mytt.kind.lecture">محاضرة</option><option value="td" data-i18n="mytt.kind.td">حصة تطبيقية</option><option value="tp" data-i18n="mytt.kind.tp">أعمال موجهة</option><option value="exam" data-i18n="mytt.kind.exam">امتحان</option></select>')
add("mytt-room", '<label for="myttRoom">القاعة</label><input id="myttRoom" type="text" maxlength="40" placeholder="مثال: القاعة 5" autocomplete="off">',
    '<label for="myttRoom" data-i18n="mytt.room">القاعة</label><input id="myttRoom" type="text" maxlength="40" placeholder="مثال: القاعة 5" data-i18n-ph="mytt.roomPh" autocomplete="off">')
add("mytt-add", '<button class="tool-add" type="submit">+ زيد للحصص</button>', '<button class="tool-add" type="submit" data-i18n="mytt.add">+ زيد للحصص</button>')
add("mytt-export", '<button type="button" id="myttExport">تنزيل نسخة (JSON)</button>', '<button type="button" id="myttExport" data-i18n="mytt.export">تنزيل نسخة (JSON)</button>')
add("mytt-print", '<button type="button" id="myttPrint">طباعة الجدول</button>', '<button type="button" id="myttPrint" data-i18n="mytt.print">طباعة الجدول</button>')
add("mytt-clear", '<button type="button" id="myttClear">حذف الكل</button>', '<button type="button" id="myttClear" data-i18n="mytt.clear">حذف الكل</button>')

# ---- deadlines panel ------------------------------------------------------
add("dl-h2", '<h2>المواعيد والامتحانات</h2>\n        <p class="tool-lead">سجّل مواعيد الامتحانات والتسليمات، وتابع الأقرب أولًا. كل شي محفوظ محليًا على هاد الجهاز.</p>',
    '<h2 data-i18n="dl.h2">المواعيد والامتحانات</h2>\n        <p class="tool-lead" data-i18n="dl.lead">سجّل مواعيد الامتحانات والتسليمات، وتابع الأقرب أولًا. كل شي محفوظ محليًا على هاد الجهاز.</p>')
add("dl-title", '<label for="dlTitle">العنوان</label><input id="dlTitle" type="text" maxlength="100" placeholder="مثال: امتحان القانون الدولي الخاص" autocomplete="off">',
    '<label for="dlTitle" data-i18n="dl.title">العنوان</label><input id="dlTitle" type="text" maxlength="100" placeholder="مثال: امتحان القانون الدولي الخاص" data-i18n-ph="dl.titlePh" autocomplete="off">')
add("dl-kind",
    '<label for="dlKind">النوع</label><select id="dlKind"><option>امتحان</option><option>تسليم واجب</option><option>مناقشة</option><option>أخرى</option></select>',
    '<label for="dlKind" data-i18n="dl.kind">النوع</label><select id="dlKind"><option value="exam" data-i18n="dl.kind.exam">امتحان</option><option value="assign" data-i18n="dl.kind.assign">تسليم واجب</option><option value="discuss" data-i18n="dl.kind.discuss">مناقشة</option><option value="other" data-i18n="dl.kind.other">أخرى</option></select>')
add("dl-date", '<label for="dlDate">التاريخ</label>', '<label for="dlDate" data-i18n="dl.date">التاريخ</label>')
add("dl-add", '<button class="tool-add" type="submit">+ زيد موعد</button>', '<button class="tool-add" type="submit" data-i18n="dl.add">+ زيد موعد</button>')
add("dl-clear", '<div class="tool-actions"><button type="button" id="dlClear">حذف الكل</button></div>', '<div class="tool-actions"><button type="button" id="dlClear" data-i18n="dl.clear">حذف الكل</button></div>')

# ---- focus studio ---------------------------------------------------------
add("focus-h2", '<h2 id="focusTitle">مساحة التركيز ديالك</h2>\n        <p>خطوات صغيرة اليوم، كتسهّل عليك الطريق غداً.</p>',
    '<h2 id="focusTitle" data-i18n="focus.h2">مساحة التركيز ديالك</h2>\n        <p data-i18n="focus.p">خطوات صغيرة اليوم، كتسهّل عليك الطريق غداً.</p>')
add("focus-date", '<time id="focusDate">اليوم</time>', '<time id="focusDate" data-i18n="focus.today">اليوم</time>')
add("focus-progress-aria", '<div class="focus-progress" aria-label="تقدم مهام اليوم">',
    '<div class="focus-progress" aria-label="تقدم مهام اليوم" data-i18n-aria="focus.progressAria">')
add("focus-progress-label", '<div class="focus-progress-top"><span>تقدمك اليوم</span>',
    '<div class="focus-progress-top"><span data-i18n="focus.progress">تقدمك اليوم</span>')
add("focus-track-aria", 'aria-label="نسبة إنجاز مهام اليوم" aria-valuemin="0"',
    'aria-label="نسبة إنجاز مهام اليوم" data-i18n-aria="focus.progressAria" aria-valuemin="0"')
add("focus-encourage", '<p id="focusEncouragement" aria-live="polite">اختار مهمة وابدأ على مهلك.</p>',
    '<p id="focusEncouragement" aria-live="polite" data-i18n="focus.encourage">اختار مهمة وابدأ على مهلك.</p>')
add("focus-t1", '<span><b>راجع درساً واحداً</b><small>حتى 20 دقيقة كافية للبداية</small></span>',
    '<span><b data-i18n="focus.t1">راجع درساً واحداً</b><small data-i18n="focus.t1d">حتى 20 دقيقة كافية للبداية</small></span>')
add("focus-t2", '<span><b>تأكد من استعمال الزمن</b><small>راجع الحصص وأي تغيير معلن</small></span>',
    '<span><b data-i18n="focus.t2">تأكد من استعمال الزمن</b><small data-i18n="focus.t2d">راجع الحصص وأي تغيير معلن</small></span>')
add("focus-t3", '<span><b>حضّر وثائق الغد</b><small>ملخص، دفتر أو ملف PDF</small></span>',
    '<span><b data-i18n="focus.t3">حضّر وثائق الغد</b><small data-i18n="focus.t3d">ملخص، دفتر أو ملف PDF</small></span>')
add("focus-customLabel", '<label class="sr-only" for="focusCustomTask">مهمة شخصية جديدة</label>',
    '<label class="sr-only" for="focusCustomTask" data-i18n="focus.customLabel">مهمة شخصية جديدة</label>')
add("focus-customPh", 'placeholder="زيد مهمة خاصة بيك…" />', 'placeholder="زيد مهمة خاصة بيك…" data-i18n-ph="focus.customPh" />')
add("focus-add", '<button type="submit">+ زيد مهمة</button>', '<button type="submit" data-i18n="focus.add">+ زيد مهمة</button>')
add("focus-foot", '</svg> المهام كتبقى فهاد الجهاز فقط.</span><button type="button" id="focusReset">بدا من جديد</button>',
    '</svg> <span data-i18n="focus.foot">المهام كتبقى فهاد الجهاز فقط.</span></span><button type="button" id="focusReset" data-i18n="focus.reset">بدا من جديد</button>')

# ---- WhatsApp section -----------------------------------------------------
add("wa-title", '<h2 id="wa-groups-title">مجموعات واتساب للطلبة — القانون بالعربية</h2>',
    '<h2 id="wa-groups-title" data-i18n="wa.title">مجموعات واتساب للطلبة — القانون بالعربية</h2>')
add("wa-intro",
    '<p class="wa-intro">روابط المجموعات الطلابية التي زوّدنا بها المستخدم، منظّمة حسب السداسي والشعبة. هذه الصفحة مخصّصة لطلبة كلية العلوم القانونية والسياسية بأكادير، ولا تمثل إعلاناً رسمياً صادراً عن الكلية.</p>',
    '<p class="wa-intro" data-i18n="wa.intro">روابط المجموعات الطلابية التي زوّدنا بها المستخدم، منظّمة حسب السداسي والشعبة. هذه الصفحة مخصّصة لطلبة كلية العلوم القانونية والسياسية بأكادير، ولا تمثل إعلاناً رسمياً صادراً عن الكلية.</p>')
add("wa-warn",
    '<div class="wa-warning" role="note"><strong><svg class="icn" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.6 21.4 20H2.6z"/><path d="M12 9.6v4.6"/><path d="M12 17.2h.01"/></svg> تنبيه مهم:</strong> وفق الإعلان المرفق مع الروابط، يُرجى عدم الانضمام إلى أكثر من مجموعتين في كل سداسي، لأن الطلبة الذين يتجاوزون هذا العدد قد تتم إزالتهم من جميع المجموعات. لم يتم التحقق بشكل مستقل من هذا الشرط؛ يرجى التأكد من المشرفين.</div>',
    '<div class="wa-warning" role="note"><strong><svg class="icn" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.6 21.4 20H2.6z"/><path d="M12 9.6v4.6"/><path d="M12 17.2h.01"/></svg> <span data-i18n="wa.warnHead">تنبيه مهم:</span></strong> <span data-i18n="wa.warnBody">وفق الإعلان المرفق مع الروابط، يُرجى عدم الانضمام إلى أكثر من مجموعتين في كل سداسي، لأن الطلبة الذين يتجاوزون هذا العدد قد تتم إزالتهم من جميع المجموعات. لم يتم التحقق بشكل مستقل من هذا الشرط؛ يرجى التأكد من المشرفين.</span></div>')
add("wa-search", '<input id="waGroupSearch" type="search" placeholder="ابحث عن السداسي أو الشعبة أو المسلك…" aria-label="البحث في مجموعات واتساب">',
    '<input id="waGroupSearch" type="search" placeholder="ابحث عن السداسي أو الشعبة أو المسلك…" data-i18n-ph="wa.searchPh" aria-label="البحث في مجموعات واتساب" data-i18n-aria="wa.searchAria">')
add("wa-filter",
    '<select id="waSemesterFilter" aria-label="تصفية حسب السداسي"><option value="all">كل السداسيات</option><option value="S1">السداسي الأول S1</option><option value="S3">السداسي الثالث S3</option><option value="S5">السداسي الخامس S5</option></select>',
    '<select id="waSemesterFilter" aria-label="تصفية حسب السداسي" data-i18n-aria="wa.filterAria"><option value="all" data-i18n="wa.filterAll">كل السداسيات</option><option value="S1" data-i18n="wa.filterS1">السداسي الأول S1</option><option value="S3" data-i18n="wa.filterS3">السداسي الثالث S3</option><option value="S5" data-i18n="wa.filterS5">السداسي الخامس S5</option></select>')
add("wa-empty", '<p class="wa-empty" id="waNoResults">ما لقينا حتى مجموعة مطابقة للبحث.</p>',
    '<p class="wa-empty" id="waNoResults" data-i18n="wa.empty">ما لقينا حتى مجموعة مطابقة للبحث.</p>')
add("wa-note", '<p class="wa-intro">ملاحظة: الانضمام يتم على مسؤوليتك، وتخضع كل مجموعة لقواعد المشرفين. لا تشارك معلومات شخصية حساسة داخل المجموعات.</p>',
    '<p class="wa-intro" data-i18n="wa.note">ملاحظة: الانضمام يتم على مسؤوليتك، وتخضع كل مجموعة لقواعد المشرفين. لا تشارك معلومات شخصية حساسة داخل المجموعات.</p>')
add("wa-sem1", '<div class="wa-sem-heading"><h3>السداسي الأول — S1 · القانون الخاص</h3></div>',
    '<div class="wa-sem-heading"><h3 data-i18n="wa.sem1">السداسي الأول — S1 · القانون الخاص</h3></div>')
add("wa-sem3", '<div class="wa-sem-heading"><h3>السداسي الثالث — S3 · القانون الخاص</h3></div>',
    '<div class="wa-sem-heading"><h3 data-i18n="wa.sem3">السداسي الثالث — S3 · القانون الخاص</h3></div>')
add("wa-sem5", '<div class="wa-sem-heading"><h3>السداسي الخامس — S5 · التخصصات</h3></div>',
    '<div class="wa-sem-heading"><h3 data-i18n="wa.sem5">السداسي الخامس — S5 · التخصصات</h3></div>')

# specialty headings (name + " — الشعبة X")
for lab, spec_key, spec_txt, letter in [
    ("spec-AB", "wa.spec.legal", "المهن القانونية والقضائية", "AB"),
    ("spec-CD", "wa.spec.legal", "المهن القانونية والقضائية", "CD"),
    ("spec-EFGH", "wa.spec.legal", "المهن القانونية والقضائية", "EFGH"),
    ("spec-biz", "wa.spec.business", "قانون المال والأعمال", "ABC"),
    ("spec-civ", "wa.spec.civil", "القانون المدني والعقاري", "ABC"),
    ("spec-crim", "wa.spec.criminal", "القانون الجنائي والعلوم الأمنية", "A"),
]:
    add("wa-"+lab,
        '<h3>%s — الشعبة %s</h3>' % (spec_txt, letter),
        '<h3><span data-i18n="%s">%s</span> — <span data-i18n="wa.sec">الشعبة</span> %s</h3>' % (spec_key, spec_txt, letter))

# module lists (the <p class="wa-modules"> text repeats 3x for the legal specialty)
LEG = "القانون الدولي الخاص، الحقوق العينية، العقود الخاصة، قانون التأمين، قانون صعوبات المقاولة، الإنجليزية، القانون الرقمي والذكاء الاصطناعي"
BIZ = "العقود التجارية، قانون صعوبات المقاولة، وسائل الأداء والائتمان، قانون التأمين، القانون الجنائي للأعمال، الإنجليزية، القانون الرقمي والذكاء الاصطناعي"
CIV = "القانون الدولي الخاص، قانون التأمين، العقود المدنية الخاصة، الحقوق العينية، تحرير العقود والرسوم التوثيقية، الإنجليزية، القانون الرقمي والذكاء الاصطناعي"
CRM = "السياسة الجنائية، القانون الجنائي للأعمال، الجرائم ذات الطبيعة الخاصة، جنائي الأسرة، مسرح الجريمة، الإنجليزية، القانون الجنائي الرقمي والذكاء الاصطناعي"
add("wa-mod-legal", '<p class="wa-modules"><strong>المواد:</strong> '+LEG+'</p>',
    '<p class="wa-modules" data-i18n-html="wa.mod.metiers"><strong>المواد:</strong> '+LEG+'</p>', 3)
add("wa-mod-biz", '<p class="wa-modules"><strong>المواد:</strong> '+BIZ+'</p>',
    '<p class="wa-modules" data-i18n-html="wa.mod.affaires"><strong>المواد:</strong> '+BIZ+'</p>')
add("wa-mod-civ", '<p class="wa-modules"><strong>المواد:</strong> '+CIV+'</p>',
    '<p class="wa-modules" data-i18n-html="wa.mod.civil"><strong>المواد:</strong> '+CIV+'</p>')
add("wa-mod-crm", '<p class="wa-modules"><strong>المواد:</strong> '+CRM+'</p>',
    '<p class="wa-modules" data-i18n-html="wa.mod.criminel"><strong>المواد:</strong> '+CRM+'</p>')

# ---- footer ---------------------------------------------------------------
add("foot-p1",
    '  موقع مستقل <b>غير رسمي</b> ولا يمثل كلية العلوم القانونية والسياسية بجامعة ابن زهر. البيانات منقولة عن الوثائق الرسمية المعلنة بالكلية، والمصدر الرسمي المعتمد هو <a href="https://fsjpa.uiz.ac.ma/" target="_blank" rel="noopener">موقع الكلية</a>. عند أي اختلاف تكون النسخة الرسمية هي المرجع. البيانات مأخوذة من وثائق كلية العلوم القانونية والسياسية بأكادير (الجداول العربية: الصيغة المحينة بتاريخ 10-10-2026). عند أي اختلاف، اللوائح والإعلانات الرسمية المعلقة بالكلية هي المعتمدة. لا تدخل بيانات حساسة (رقم البطاقة الوطنية، كلمات المرور).\n<br>تصميم وتطوير: <b>محمد شرايم (CHRVVIM)</b> — طالب بكلية العلوم القانونية والسياسية، جامعة ابن زهر، أكادير.',
    '  <span data-i18n-html="foot.p1">موقع مستقل <b>غير رسمي</b> ولا يمثل كلية العلوم القانونية والسياسية بجامعة ابن زهر. البيانات منقولة عن الوثائق الرسمية المعلنة بالكلية، والمصدر الرسمي المعتمد هو <a href="https://fsjpa.uiz.ac.ma/" target="_blank" rel="noopener">موقع الكلية</a>. عند أي اختلاف تكون النسخة الرسمية هي المرجع. البيانات مأخوذة من وثائق كلية العلوم القانونية والسياسية بأكادير (الجداول العربية: الصيغة المحينة بتاريخ 10-10-2026). عند أي اختلاف، اللوائح والإعلانات الرسمية المعلقة بالكلية هي المعتمدة. لا تدخل بيانات حساسة (رقم البطاقة الوطنية، كلمات المرور).</span>\n<br><span data-i18n-html="foot.p2">تصميم وتطوير: <b>محمد شرايم (CHRVVIM)</b> — طالب بكلية العلوم القانونية والسياسية، جامعة ابن زهر، أكادير.</span>')
add("foot-l1", '<a href="university-directory.html">دليل مؤسسات جامعة ابن زهر</a>',
    '<a href="university-directory.html" data-i18n="foot.l1">دليل مؤسسات جامعة ابن زهر</a>')
add("foot-l2", '<a href="academic-offer.html">دليل التكوينات</a>',
    '<a href="academic-offer.html" data-i18n="foot.l2">دليل التكوينات</a>')
add("foot-l3", '<a href="academic-updates.html">المستجدات الجامعية</a>',
    '<a href="academic-updates.html" data-i18n="foot.l3">المستجدات الجامعية</a>')
add("foot-l4", '<a href="students-guide.html">دليل الطلبة</a>',
    '<a href="students-guide.html" data-i18n="foot.l4">دليل الطلبة</a>')
add("foot-l5", '<a href="rafiq-altalib.html">رفيق الطالب</a>',
    '<a href="rafiq-altalib.html" data-i18n="foot.l5">رفيق الطالب</a>')

# ---- gate + totop ---------------------------------------------------------
add("gate-title", '<h2 id="gateTitle">باش تكمل البحث</h2>', '<h2 id="gateTitle" data-i18n="gate.title">باش تكمل البحث</h2>')
add("gate-p", '<p class="muted">تابع الحسابات التالية على إنستغرام (كتفتح فتبويب جديد)، وبعدها غادي يتحل ليك البحث بلا حدود.</p>',
    '<p class="muted" data-i18n="gate.p">تابع الحسابات التالية على إنستغرام (كتفتح فتبويب جديد)، وبعدها غادي يتحل ليك البحث بلا حدود.</p>')
add("gate-ok", '<button class="btn" id="gateOk" disabled>أكمل البحث</button>',
    '<button class="btn" id="gateOk" disabled data-i18n="gate.ok">أكمل البحث</button>')
add("gate-close", '<button class="btn sec" id="gateClose">لاحقاً</button>',
    '<button class="btn sec" id="gateClose" data-i18n="gate.close">لاحقاً</button>')
add("totop", '<button id="totop" aria-label="الرجوع إلى الأعلى" title="الرجوع إلى الأعلى">↑</button>',
    '<button id="totop" aria-label="الرجوع إلى الأعلى" title="الرجوع إلى الأعلى" data-i18n-aria="aria.totop" data-i18n-title="aria.totop">↑</button>')

# ---- script include: page-i18n.js before app.js ---------------------------
add("script-include", '<script src="app.js" defer></script>',
    '<script src="page-i18n.js" defer></script>\n<script src="app.js" defer></script>')

# ==========================================================================
fail = []
for label, old, new, cnt in R:
    n = html.count(old)
    if n != cnt:
        fail.append("%-18s expected %d, found %d" % (label, cnt, n))
        continue
    html = html.replace(old, new)

# hub quick-cards: add data-i18n to <b> and <small> inside .quick-copy
TITLE_KEY = {
    "لقا الفوج ديالك":"hub.c1b","استعمال الزمن":"hub.c2b","الأساتذة والمواد":"hub.c3b","القاعات":"hub.c4b",
    "توزيع الأفواج":"hub.c5b","المواد والمقابلات":"hub.c6b","الوثائق الجامعية":"hub.c7b","المكتبة القانونية":"hub.c8b",
    "ورشة التعلّم":"hub.c9b","دليل الطلبة":"hub.c10b","حاسبة المعدل":"hub.c11b","جدولي الشخصي":"hub.c12b",
    "المواعيد والامتحانات":"hub.c13b","المساعد الذكي":"hub.c14b","روابط الجامعة":"hub.c15b","مؤسسات جامعة ابن زهر":"hub.c16b",
    "دليل التكوينات":"hub.c17b","آخر المستجدات":"hub.c18b","رفيق الطالب":"hub.c19b","مجموعات واتساب":"hub.c20b",
    "التعاليق":"hub.c21b","إحصائيات":"hub.c22b","عن المؤسس":"hub.c23b",
}
DESC_KEY = {
    "بحث سريع بالاسم والمسلك":"hub.c1s","شوف الحصص حسب السداسي":"hub.c2s","مين كيدرّس شنو":"hub.c3s","فين غادي تكون الحصة":"hub.c4s",
    "شوف فوجك داخل المسلك":"hub.c5s","المواد والامتحانات السابقة":"hub.c6s","جداول وملفات PDF":"hub.c7s","مراجع وموارد للقانون":"hub.c8s",
    "ملخصات وكويزات وبطاقات":"hub.c9s","مواقع المؤسسات وروابطها الرسمية":"hub.c10s","حسب النقط والمعاملات":"hub.c11s","نظّم حصصك الأسبوعية":"hub.c12s",
    "تتبّع التسليمات والامتحانات":"hub.c13s","اسأل وشوف الجواب بسرعة":"hub.c14s","البوابات والخدمات الرسمية":"hub.c15s","كل الكليات والمدارس":"hub.c16s",
    "البحث عن التكوينات والمؤسسات":"hub.c17s","إعلانات وروابط المصادر الرسمية":"hub.c18s","النسخة المستقلة: جدولي والمعدل والمواعيد":"hub.c19s","مجموعات الطلبة حسب السداسي":"hub.c20s",
    "شارك رأيك أو سؤال":"hub.c21s","أرقام المنصة":"hub.c22s","من هو محمد شرايم":"hub.c23s",
}
card_re = re.compile(r'(<span class="quick-copy"><b>)([^<]*)(</b><small>)([^<]*)(</small></span>)')
def card_sub(m):
    t, d = m.group(2), m.group(4)
    if t not in TITLE_KEY or d not in DESC_KEY:
        fail.append("hub-card unmapped: %r / %r" % (t, d))
        return m.group(0)
    return '<span class="quick-copy"><b data-i18n="%s">%s</b><small data-i18n="%s">%s</small></span>' % (
        TITLE_KEY[t], t, DESC_KEY[d], d)
html, ncards = card_re.subn(card_sub, html)

if fail:
    print("ABORTED — no file written:")
    for f in fail:
        print("  " + f)
    sys.exit(1)

out = (b"\xef\xbb\xbf" if bom else b"") + html.encode("utf-8")
with open(P, "wb") as f:
    f.write(out)
print("index.html annotated OK — %d replacements + %d hub cards; %d bytes" % (len(R), ncards, len(out)))
