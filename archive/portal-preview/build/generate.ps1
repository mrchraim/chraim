# CHRVVIM Campus — مولّد الصفحات الثابتة
# يقرأ data.json + style.css + app.js ويولّد index.html و etablissements/<slug>.html
$ErrorActionPreference = "Stop"

$Build  = $PSScriptRoot
$Out    = Split-Path $Build -Parent
$Etabs  = Join-Path $Out "etablissements"
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path $Etabs)) { New-Item -ItemType Directory -Path $Etabs | Out-Null }

$json = [System.IO.File]::ReadAllText((Join-Path $Build "data.json"), [System.Text.Encoding]::UTF8)
$css  = [System.IO.File]::ReadAllText((Join-Path $Build "style.css"), [System.Text.Encoding]::UTF8)
$js   = [System.IO.File]::ReadAllText((Join-Path $Build "app.js"),  [System.Text.Encoding]::UTF8)
$D    = $json | ConvertFrom-Json

$Checked = $D.checked
$TYPE_AR = @{ fac = "كلية"; school = "مدرسة وطنية / عليا"; inst = "معهد" }

function Esc([object]$s) {
    if ($null -eq $s) { return "" }
    return [System.Net.WebUtility]::HtmlEncode([string]$s)
}
function Href([object]$u) {
    if ($null -eq $u -or [string]$u -eq "") { return $null }
    $s = ([string]$u).Trim()
    if ($s -match "^(https?:)?//") { return $s }
    return "https://" + $s
}
function TagLabel([string]$t) {
    $out = @()
    foreach ($k in ($t -split ",")) {
        switch ($k.Trim()) {
            "off"  { $out += '<span class="badge ok">مصدر رسمي</span>' }
            "un"   { $out += '<span class="badge pend">مصدر غير رسمي</span>' }
            "old"  { $out += '<span class="badge archive">وثيقة قديمة</span>' }
            "exp"  { $out += '<span class="badge archive">منتهية الصلاحية</span>' }
        }
    }
    return ($out -join " ")
}

function Shell([string]$title, [string]$desc, [string]$body) {
    return "<!doctype html>`n" +
"<html lang=`"ar`" dir=`"rtl`">`n<head>`n" +
"<meta charset=`"utf-8`">`n" +
"<meta name=`"viewport`" content=`"width=device-width, initial-scale=1, viewport-fit=cover`">`n" +
"<meta name=`"description`" content=`"$desc`">`n" +
"<meta name=`"color-scheme`" content=`"light dark`">`n" +
"<meta name=`"theme-color`" content=`"#071b32`">`n" +
"<title>$title</title>`n" +
"<link rel=`"icon`" href=`"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23071b32'/%3E%3Cpath d='M32 12l16 8-16 8-16-8z' fill='%2339c6f0'/%3E%3Cpath d='M20 26v8c0 5 5.4 9 12 9s12-4 12-9v-8l-12 6z' fill='%23e0ad4a'/%3E%3C/svg%3E`">`n" +
"<link rel=`"preconnect`" href=`"https://fonts.googleapis.com`">`n" +
"<link href=`"https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap`" rel=`"stylesheet`">`n" +
"<style>`n" + $css + "`n</style>`n</head>`n<body>`n" +
"`n" + $body + "`n" +
"<script>`n" + $js + "`n</script>`n</body>`n</html>`n"
}

# ============================================================
# 1) الصفحة الرئيسية — الدليل
# ============================================================
$statsHtml = ""
foreach ($s in $D.university.stats) {
    $statsHtml += "<div class=`"lcell`"><b>" + (Esc $s.value) + "</b><span>" + (Esc $s.label) + "</span></div>`n"
}

# المدن (مرتبة حسب أول ظهور)
$cities = New-Object System.Collections.Generic.List[string]
foreach ($e in $D.establishments) {
    if (-not $cities.Contains($e.city_ar)) { $cities.Add($e.city_ar) }
}
$cityOpts = ""
foreach ($c in $cities) { $cityOpts += "<option value=`"$(Esc $c)`">$(Esc $c)</option>`n" }

$cards = ""
foreach ($e in $D.establishments) {
    $lead = @()
    foreach ($l in $e.leadership) { $lead += $l.name }
    $search = "$($e.name_ar) $($e.name_fr) $($e.city_ar) $($TYPE_AR[$e.type]) $($lead -join ' ')"
    $first = $e.leadership[0]
    $cards += "<a class=`"card $($e.type)`" href=`"etablissements/$($e.slug).html`" " +
              "data-type=`"$($e.type)`" data-city=`"$(Esc $e.city_ar)`" data-search=`"$(Esc $search)`">`n" +
              "<span class=`"kicker`">$(Esc $TYPE_AR[$e.type]) · $(Esc $e.city_ar)</span>`n" +
              "<strong>$(Esc $e.name_ar)</strong>`n" +
              "<span class=`"who`">$(Esc $first.role_ar): $(Esc $first.name)</span>`n" +
              "<span class=`"badges`"><span class=`"badge ok`">الاسم مؤكد في دليل الجامعة</span>" +
              ($(if ($e.website) { '<span class="badge link">موقع رسمي</span>' } else { "" })) +
              "</span>`n</a>`n"
}

# مؤسسات خارج القائمة الرسمية
$outside = ""
foreach ($o in $D.outside_directory) {
    $w = Href $o.website
    $outside += "<div class=`"box`" style=`"margin-top:15px`"><h2>$(Esc $o.name_ar) — $(Esc $o.city_ar)</h2>" +
                "<p class=`"note`">$(Esc $o.note_ar)</p>" +
                "<div class=`"acts`">"
    if ($w) { $outside += "<a class=`"btn alt`" href=`"$w`" target=`"_blank`" rel=`"noopener`">$(Esc $o.website)</a>" }
    $outside += "</div></div>`n"
}

$indexBody =
"<header class=`"top`">`n" +
"  <a class=`"brand`" href=`"index.html`">CHRVVIM <b>Campus</b><small>بوابة جامعة ابن زهر</small></a>`n" +
"  <label class=`"gsearch`"><span aria-hidden=`"true`">&#8981;</span><input id=`"q`" type=`"search`" placeholder=`"ابحث عن كلية أو مدرسة أو مدينة أو عميد`" aria-label=`"ابحث في دليل المؤسسات`"></label>`n" +
"  <button class=`"tbtn`" id=`"theme`" type=`"button`" aria-live=`"polite`">الوضع الداكن</button>`n" +
"</header>`n" +
"`n<section class=`"hero`"><div class=`"hero-in`">`n" +
"  <span class=`"pill`">&#10022; دليل رسمي موثّق · كل مؤسسة بابها الخاص</span>`n" +
"  <h1>بِاب لكل مؤسسة،<br><em>ومعلومة لكل باب.</em></h1>`n" +
"  <p>استُخرجت هذه المعطيات من صفحات جامعة ابن زهر الرسمية نفسها: الأسماء، والمسؤولون، والعناوين، وأرقام الهاتف، والتكوينات. كل مؤسسة لها صفحة مستقلة، وكل معلومة تحمل مصدرها وتاريخ الفحص.</p>`n" +
"  <div class=`"ledger`">`n" + $statsHtml + "  </div>`n" +
"</div>" +
"<svg class=`"mount`" viewBox=`"0 0 1200 120`" preserveAspectRatio=`"none`" aria-hidden=`"true`">" +
"<path d=`"M0 120V70l120-34 110 30 130-46 150 52 120-38 140 44 130-50 160 46 140-30V120z`" fill=`"#0b2c4d`"/>" +
"<path d=`"M0 120V92l170-26 140 24 160-34 160 30 150-22 180 28 240-20V120z`" fill=`"var(--bg)`"/></svg>`n" +
"</section>`n" +
"`n<main class=`"sec`">`n" +
"<div class=`"card-sec`">`n" +
"  <h2>دليل المؤسسات</h2>`n" +
"  <p class=`"lead`">القائمة الرسمية المنشورة على <a href=`"$(Esc $D.university.directory)`" target=`"_blank`" rel=`"noopener`">صفحة «المؤسسات»</a> بتاريخ <b>$Checked</b> تضم <b>$($D.establishments.Count) مؤسسة</b> موزّعة على <b>$($cities.Count) مدن</b>. اضغط أي بطاقة لتدخل باب المؤسسة.</p>`n" +
"  <div class=`"filters`" role=`"group`" aria-label=`"مرشحات الدليل`">`n" +
"    <select id=`"city`" aria-label=`"تصفية حسب المدينة`"><option value=`"`">كل المدن</option>$cityOpts</select>`n" +
"    <button class=`"chip`" data-t=`"`" aria-pressed=`"true`" type=`"button`">الكل</button>`n" +
"    <button class=`"chip`" data-t=`"fac`" aria-pressed=`"false`" type=`"button`">كليات</button>`n" +
"    <button class=`"chip`" data-t=`"school`" aria-pressed=`"false`" type=`"button`">مدارس وطنية وعليا</button>`n" +
"    <span class=`"count`" id=`"count`" role=`"status`" aria-live=`"polite`"></span>`n" +
"  </div>`n" +
"  <div class=`"grid`" id=`"cards`">`n" + $cards + "  </div>`n" +
"  <div class=`"empty`" id=`"none`" hidden>لا توجد مؤسسة بهذا الاسم. جرّب كلمة أقصر أو غيّر المدينة.</div>`n" +
"</div>`n" +
"`n<div class=`"method`">`n" +
"  <b>المنهجية:</b> الأسماء والمسؤولون والعناوين وأرقام الهاتف والتكوينات مستخرجة حرفياً من صفحات المؤسسات على موقع جامعة ابن زهر. " +
"حيث يتوفر نص عربي رسمي (مثل كلية الشريعة) عُرض كما هو، وحيث لا يتوفر نص عربي عُرض عرضٌ عربي أمين للنص الفرنسي الرسمي مع إبقاء النص الأصلي قابلاً للفتح. " +
"أي معطاة غير واردة في المصدر أُشير إليها بوضوح بدل تخمينها.<br>`n" +
"  المصدر: <a href=`"$(Esc $D.university.home)`" target=`"_blank`" rel=`"noopener`">الصفحة الرئيسية للجامعة</a> · " +
"<a href=`"$(Esc $D.university.directory)`" target=`"_blank`" rel=`"noopener`">صفحة المؤسسات</a> · فُحصت $Checked.</div>`n" +
"</main>`n" +
"`n<section class=`"sec`">`n<h2>مؤسسات خارج القائمة الرسمية المنشورة</h2>`n" +
"<p class=`"lead`">تُعرض هنا مؤسسات مذكورة سابقاً في هذه البوابة لكنها لم ترد في صفحة «المؤسسات» المنشورة بتاريخ $Checked. يُحفظ رابطها دون إضافة أي معطيات غير مؤكدة.</p>`n" +
$outside +
"</section>`n" +
"`n<footer><div class=`"in`">`n" +
"<strong>CHRVVIM Campus</strong> خدمة رقمية مستقلة، وليست موقعاً رسمياً لجامعة ابن زهر أو لأي مؤسسة تابعة لها. القرارات والمواعيد والنتائج النهائية من اختصاص الجهات الجامعية. هذا نموذج معاينة يعمل محلياً، ولم يُنشر على أي نطاق.<br>`n" +
"المصدر الرئيسي: <a href=`"$(Esc $D.university.directory)`" target=`"_blank`" rel=`"noopener`">uiz.ac.ma/nos-etablissements</a> · فُحصت المعطيات بتاريخ <b>$Checked</b>.`n" +
"</div></footer>`n"

[System.IO.File]::WriteAllText((Join-Path $Out "index.html"), (Shell "CHRVVIM Campus — دليل مؤسسات جامعة ابن زهر" "دليل مؤسسات جامعة ابن زهر: كل مؤسسة بابها الخاص، مع المسؤولين والعناوين والتكوينات مصدراً من الموقع الرسمي." $indexBody), $Utf8NoBom)
Write-Host "OK index.html"

# ============================================================
# 2) صفحة لكل مؤسسة
# ============================================================
foreach ($e in $D.establishments) {
    $w  = Href $e.website
    $w2 = Href $e.website_alt

    # الهيرو
    $hero = "<section class=`"cover`"><div class=`"cover-in`">`n" +
            "<a class=`"back`" href=`"../index.html`">&#8594; العودة إلى الدليل</a>`n" +
            "<h1>$(Esc $e.name_ar)</h1>`n" +
            "<p class=`"fr`">$(Esc $e.name_fr)</p>`n" +
            "<div class=`"row`">`n" +
            "<span class=`"tagpill`">$(Esc $TYPE_AR[$e.type])</span>`n" +
            "<span class=`"tagpill`">$(Esc $e.city_ar)</span>`n" +
            "<span class=`"tagpill`">&#10003; الاسم مؤكد في دليل الجامعة</span>`n" +
            "</div></div></section>`n"

    # قائمة المسؤولين
    $leadHtml = ""
    foreach ($l in $e.leadership) {
        $leadHtml += "<li><span class=`"role`">$(Esc $l.role_ar) <span class=`"frrole`">($(Esc $l.role_fr))</span></span>" +
                     "<span class=`"name`">$(Esc $l.name)</span></li>`n"
    }

    # بطاقة الاتصال
    $facts = ""
    if ($e.address)  { $facts += "<div class=`"f`"><dt>العنوان</dt><dd>$(Esc $e.address)</dd></div>`n" }
    if ($e.phone)    { $facts += "<div class=`"f`"><dt>الهاتف</dt><dd>$(Esc $e.phone)</dd></div>`n" }
    if ($e.fax)      { $facts += "<div class=`"f`"><dt>الفاكس</dt><dd>$(Esc $e.fax)</dd></div>`n" }
    if ($w)          { $facts += "<div class=`"f`"><dt>الموقع</dt><dd><a href=`"$w`" target=`"_blank`" rel=`"noopener`">$(Esc $e.website)</a></dd></div>`n" }
    if ($w2)         { $facts += "<div class=`"f`"><dt>رابط إضافي</dt><dd><a href=`"$w2`" target=`"_blank`" rel=`"noopener`">$(Esc $e.website_alt)</a></dd></div>`n" }
    if ($e.extra_links) {
        foreach ($x in $e.extra_links) {
            $xl = Href $x
            $facts += "<div class=`"f`"><dt>رابط إضافي</dt><dd><a href=`"$xl`" target=`"_blank`" rel=`"noopener`">$(Esc $x)</a></dd></div>`n"
        }
    }
    $facts += "<div class=`"f`"><dt>صفحة الجامعة</dt><dd><a href=`"$(Esc $e.uiz_url)`" target=`"_blank`" rel=`"noopener`">$(Esc $e.uiz_url)</a></dd></div>`n"
    $factsBox = "<dl class=`"facts`">`n" + $facts + "</dl>`n"

    # التكوينات
    $progs = ""
    if ($e.programs_ar -and $e.programs_ar.Count -gt 0) {
        foreach ($p in $e.programs_ar) { $progs += "<li>$(Esc $p)</li>`n" }
        $progs = "<h3>التكوينات الواردة في المصدر</h3><ul class=`"progs`">`n" + $progs + "</ul>`n"
    }

    # العرض العربي + النص الرسمي
    $pres = ""
    if ($e.presentation_ar) {
        $pres = "<div class=`"prose`"><p>$(Esc $e.presentation_ar)</p></div>`n"
    } else {
        $pres = "<p class=`"note`">لا يتوفر على هذه الصفحة الرسمية نص تعريفي لهذه المؤسسة. المعطيات المُثبتة هنا هي المسؤولون والاتصالات فقط — ولم نُضِف أي وصف غير موثّق.</p>`n"
    }

    # الموارد
    $resHtml = ""
    if ($e.resources -and $e.resources.Count -gt 0) {
        foreach ($r in $e.resources) {
            $resHtml += "<li><a href=`"$(Esc $r.url)`" target=`"_blank`" rel=`"noopener`">$(Esc $r.label)</a> " +
                        (TagLabel $r.tag) + "</li>`n"
        }
        $resHtml = "<h3>روابط ووثائق موثّقة</h3><ul class=`"res`">`n" + $resHtml + "</ul>`n"
    }

    # مراجع نصية (كما وردت حرفياً في النسخة الأصلية)
    $refsHtml = ""
    if ($e.refs -and $e.refs.Count -gt 0) {
        foreach ($r in $e.refs) {
            $refsHtml += "<li><span style=`"direction:ltr`">$(Esc $r)</span> <span class=`"badge pend`">مرجع نصي</span></li>`n"
        }
        $refsHtml = "<h3>مراجع نصية كما وردت</h3><ul class=`"res`">`n" + $refsHtml + "</ul>`n"
    }

    $box1 = "<div class=`"box`"><h2>المسؤولون</h2><ul class=`"lead-list`">`n" + $leadHtml + "</ul>" +
            "<p class=`"src`">كما وردت في صفحة المؤسسة على موقع الجامعة · فُحصت $Checked</p></div>`n"

    $box2 = "<div class=`"box`"><h2>الاتصال و الروابط</h2>" + $factsBox +
            "<div class=`"acts`">"
    if ($w)  { $box2 += "<a class=`"btn out`" href=`"$w`" target=`"_blank`" rel=`"noopener`">افتح الموقع الرسمي</a>" }
    $box2 += "<a class=`"btn`" href=`"$(Esc $e.uiz_url)`" target=`"_blank`" rel=`"noopener`">صفحة الجامعة</a>" +
             "<a class=`"btn alt`" href=`"../index.html`">الدليل الكامل</a></div></div>`n"

    $box3 = "<div class=`"box`"><h2>عن المؤسسة</h2>" + $pres + $progs + $resHtml + $refsHtml +
            "<p class=`"src`">المصدر: <a href=`"$(Esc $e.uiz_url)`" target=`"_blank`" rel=`"noopener`">صفحة المؤسسة الرسمية</a> · فُحصت $Checked</p></div>`n"

    $body =
    "<header class=`"top`">`n" +
    "  <a class=`"brand`" href=`"../index.html`">CHRVVIM <b>Campus</b><small>بوابة جامعة ابن زهر</small></a>`n" +
    "  <a class=`"tbtn`" href=`"../index.html`" style=`"text-decoration:none`">&#8981; ابحث في كل المؤسسات</a>`n" +
    "  <button class=`"tbtn`" id=`"theme`" type=`"button`" aria-live=`"polite`">الوضع الداكن</button>`n" +
    "</header>`n" +
    $hero +
    "<main class=`"sec`"><div class=`"cols`">`n" +
    "  <div class=`"stack`">`n" + $box3 + "  </div>`n" +
    "  <div class=`"stack`">`n" + $box1 + $box2 + "  </div>`n" +
    "</div>`n" +
    "<div class=`"method`"><b>إخلاء مسؤولية:</b> هذه البوابة خدمة مستقلة وليست جهة رسمية. تحقّق دائماً من المصدر الأصلي قبل أي إجراء إداري. " +
    "الروابط المعروضة هي الروابط الواردة في صفحة المؤسسة الرسمية نفسها.</div>`n" +
    "</main>`n" +
    "`n<footer><div class=`"in`"><strong>CHRVVIM Campus</strong> · جميع المعطيات من مصدر رسمي · فُحصت بتاريخ <b>$Checked</b> · " +
    "<a href=`"../index.html`">الدليل الكامل</a></div></footer>`n"

    $title = "$($e.name_ar) — $($e.city_ar) | CHRVVIM Campus"
    $desc  = "$($e.name_ar) — $($e.name_fr). المسؤولون، الاتصال، والتكوينات. مصدر رسمي: جامعة ابن زهر."
    [System.IO.File]::WriteAllText((Join-Path $Etabs "$($e.slug).html"), (Shell $title $desc $body), $Utf8NoBom)
    Write-Host "OK etablissements/$($e.slug).html"
}

Write-Host "DONE: $($D.establishments.Count) establishments + index"
