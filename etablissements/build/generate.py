# -*- coding: utf-8 -*-
"""Unified 'etablissements' section generator for CHRAIM.

Reads the rich institution dataset (originally from portal-preview/build/data.json)
and renders a set of static Arabic RTL pages that follow the main CHRAIM site
design system (ivory + antique gold, IBM Plex Sans Arabic, light/dark).

Idempotent: regenerates style.css, app.js, index.html and one page per institution.
"""
import json
import os
import io

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                 # .../etablissements
REPO = os.path.dirname(ROOT)                 # repo root
DATA = os.path.join(REPO, "archive", "portal-preview", "build", "data.json")

TYPE_AR = {"fac": "كلية", "school": "مدرسة وطنية", "inst": "معهد"}
CHECKED = "2026-10-16"

with io.open(DATA, encoding="utf-8") as f:
    D = json.load(f)

UNI = D.get("university", {})
EST = D.get("establishments", [])
OUTSIDE = D.get("outside_directory", [])


def esc(s):
    if s is None:
        return ""
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def tag_ar(tag):
    parts = [t.strip() for t in str(tag).split(",") if t.strip()]
    lbl = []
    for t in parts:
        lbl.append({"un": "غير مؤكد", "off": "رسمي", "exp": "خارجي",
                    "old": "قديم"}.get(t, t))
    return parts, " · ".join(lbl)


HEAD = """<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b1220">
<title>{title} | CHRAIM</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canonical}">
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<link rel="stylesheet" href="/etablissements/style.css">
</head>
<body>
<header class="top">
  <a class="brand" href="/">CHRAIM<span>دليل مؤسسات ابن زهر</span></a>
  <nav class="nav">
    <a href="/portal.html">بوابة الطالب</a>
    <a href="/platform/">منصة الامتحانات</a>
    <a href="/university-directory.html">الدليل</a>
    <a href="/academic-offer.html">التكوينات</a>
    <a href="/academic-updates.html">المستجدات</a>
  </nav>
  <button id="themeBtn" class="theme" aria-label="تبديل الوضع الليلي">◐</button>
</header>
"""

FOOT = """
<footer class="foot">
  <p>منصة مستقلة غير رسمية — المعطيات مجمّعة من المصادر الرسمية جامعة ابن زهر (uiz.ac.ma) وتم التحقق منها بتاريخ {checked}. يُرجى دائماً مراجعة المصدر الرسمي.</p>
  <p class="muted">صُنع بـ CHRAIM · <a href="/">الصفحة الرئيسية</a></p>
</footer>
<script src="/etablissements/app.js" defer></script>
</body>
</html>
"""


def detail(e):
    slug = e["slug"]
    name = e["name_ar"]
    typ = TYPE_AR.get(e.get("type"), "مؤسسة")
    city = e.get("city_ar", "")
    parts = [HEAD.format(title=esc(name), desc=esc(
        (e.get("presentation_ar") or name)[:150]), slug=slug,
        canonical="/etablissements/" + slug)]

    parts.append('<section class="hero"><div class="wrap">')
    parts.append('<p class="crumb"><a href="/etablissements/">المؤسسات</a> / %s</p>' % esc(name))
    parts.append('<h1>%s</h1>' % esc(name))
    if e.get("name_fr"):
        parts.append('<p class="fr">%s</p>' % esc(e["name_fr"]))
    parts.append('<div class="pills">')
    parts.append('<span class="pill">%s</span>' % esc(typ))
    if city:
        parts.append('<span class="pill">📍 %s</span>' % esc(city))
    parts.append('<span class="pill ok">تم التحقق · %s</span>' % CHECKED)
    parts.append('</div></div></section>')

    parts.append('<main class="wrap">')

    if e.get("presentation_ar"):
        parts.append('<section class="box"><h2>عن المؤسسة</h2><p class="lead">%s</p></section>'
                     % esc(e["presentation_ar"]))
    else:
        parts.append('<section class="box"><h2>عن المؤسسة</h2>'
                     '<p class="empty">لا يتوفر نص تعريفي رسمي لهذه المؤسسة حالياً.</p></section>')

    progs = e.get("programs_ar") or []
    if progs:
        parts.append('<section class="box"><h2>التكوينات</h2><ul class="progs">')
        for p in progs:
            parts.append('<li>%s</li>' % esc(p))
        parts.append('</ul></section>')

    lead = e.get("leadership") or []
    if lead:
        parts.append('<section class="box"><h2>المسؤولون</h2><ul class="lead-list">')
        for r in lead:
            parts.append('<li><span class="role">%s <small>/ %s</small></span>'
                         '<b>%s</b></li>' % (esc(r.get("role_ar")),
                                             esc(r.get("role_fr")), esc(r.get("name"))))
        parts.append('</ul></section>')

    parts.append('<section class="box"><h2>الاتصال والروابط</h2><ul class="contact">')
    if e.get("address"):
        parts.append('<li><span>العنوان</span><b>%s</b></li>' % esc(e["address"]))
    if e.get("phone"):
        parts.append('<li><span>الهاتف</span><b dir="ltr">%s</b></li>' % esc(e["phone"]))
    if e.get("fax"):
        parts.append('<li><span>الفاكس</span><b dir="ltr">%s</b></li>' % esc(e["fax"]))
    if e.get("website"):
        parts.append('<li><span>الموقع الرسمي</span><a href="%s" target="_blank" rel="noopener">%s</a></li>'
                     % (esc(e["website"]), esc(e["website"])))
    if e.get("uiz_url"):
        parts.append('<li><span>الصفحة بجامعة ابن زهر</span><a href="%s" target="_blank" rel="noopener">uiz.ac.ma ↗</a></li>'
                     % esc(e["uiz_url"]))
    parts.append('</ul>')

    res = e.get("resources") or []
    if res:
        parts.append('<h3>مصادر موثّقة</h3><ul class="res">')
        for r in res:
            tags, lbl = tag_ar(r.get("tag", ""))
            cls = "off" if "off" in tags else ("exp" if "exp" in tags else "un")
            parts.append('<li><a href="%s" target="_blank" rel="noopener">%s <i>↗</i></a>'
                         '<span class="rt %s">%s</span></li>'
                         % (esc(r["url"]), esc(r["label"]), cls, esc(lbl)))
        parts.append('</ul>')
    parts.append('</section>')

    parts.append('</main>')
    parts.append(FOOT.format(checked=CHECKED))
    io.open(os.path.join(ROOT, slug + ".html"), "w", encoding="utf-8").write(
        "".join(parts))


def hero_block():
    parts = ['<section class="hero"><div class="wrap">']
    parts.append('<h1>دليل مؤسسات جامعة ابن زهر</h1>')
    parts.append('<p class="fr">%s</p>' % esc(UNI.get("name_fr", "Université Ibn Zohr")))
    parts.append('<div class="pills">')
    for st in (UNI.get("stats") or []):
        if isinstance(st, dict):
            parts.append('<span class="pill">%s: <b>%s</b></span>'
                         % (esc(st.get("label", "")), esc(st.get("value", ""))))
    parts.append('</div></div></section>')
    return "".join(parts)


def directory_block():
    parts = ['<section class="box"><div class="filters">']
    parts.append('<input id="q" type="search" placeholder="ابحث عن مؤسسة أو مدينة…" aria-label="بحث">')
    parts.append('<div id="chips" class="chips"></div>')
    parts.append('</div><div id="grid" class="grid"></div>')
    parts.append('<p id="none" class="empty" hidden>لا توجد نتائج مطابقة.</p></section>')
    if OUTSIDE:
        parts.append('<section class="box"><h2>مؤسسات خارج القائمة الرسمية</h2><ul class="res">')
        for o in OUTSIDE:
            url = o.get("website") or o.get("url") or "#"
            parts.append('<li><a href="%s" target="_blank" rel="noopener">%s <i>↗</i></a></li>'
                         % (esc(url), esc(o.get("name_ar", ""))))
            if o.get("note_ar"):
                parts.append('<li class="note"><span class="muted">%s</span></li>' % esc(o["note_ar"]))
        parts.append('</ul></section>')
    return "".join(parts)


def data_block():
    return '<script type="application/json" id="data">%s</script>' % json.dumps(
        [{"slug": e["slug"], "name": e["name_ar"], "fr": e.get("name_fr", ""),
          "type": TYPE_AR.get(e.get("type"), "مؤسسة"),
          "city": e.get("city_ar", "")} for e in EST],
        ensure_ascii=False)


# أقسام المنصة الموحّدة — تظهر في الصفحة الرئيسية
SECTIONS = [
    ("/portal.html", "بوابة الطالب",
     "الجداول، الوثائق، أرشيف الامتحانات، حاسبة المعدل وأدوات الدراسة"),
    ("/platform/", "منصة الامتحانات",
     "فروض وامتحانات وملخصات مجانية لكل جامعات المغرب — تصفح، حمّل، وساهم"),
    ("/academic-offer.html", "دليل التكوينات",
     "فهرس قابل للبحث في 382 تكويناً رسمياً بجامعة ابن زهر"),
    ("/academic-updates.html", "المستجدات الجامعية",
     "إعلانات ومواعيد وروابط التسجيل — 2026-2027"),
    ("/rafiq-altalib.html", "رفيق الطالب",
     "جدولك الأسبوعي، حاسبة المعدل، وتتبّع المواعيد"),
    ("/university-directory.html", "دليل جامعة ابن زهر",
     "بوابة كل المؤسسات الرسمية في مكان واحد"),
]


def sections_block():
    parts = ['<section class="box"><h2>أقسام المنصة</h2><div class="grid">']
    for href, title, desc in SECTIONS:
        parts.append('<a class="card" href="%s"><b>%s</b>'
                     '<span class="cfr">%s</span>'
                     '<span class="meta"><span>↗ افتح</span></span></a>'
                     % (esc(href), esc(title), esc(desc)))
    parts.append('</div></section>')
    return "".join(parts)


def index():
    """دليل المؤسسات داخل /etablissements/."""
    parts = [HEAD.format(title="دليل مؤسسات جامعة ابن زهر",
                         desc="دليل مؤسسات جامعة ابن زهر: الكليات والمدارس والمعاهد، المسؤولون، الاتصالات والروابط الرسمية.",
                         slug="index", canonical="/etablissements/")]
    parts.append(hero_block())
    parts.append('<main class="wrap">')
    parts.append(directory_block())
    parts.append('</main>')
    parts.append(data_block())
    parts.append(FOOT.format(checked=CHECKED))
    io.open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write("".join(parts))


def home():
    """الصفحة الرئيسية للموقع (الجذر) — تفتح على دليل المؤسسات + أقسام المنصة."""
    parts = [HEAD.format(title="دليل مؤسسات جامعة ابن زهر",
                         desc="CHRAIM — دليل مؤسسات جامعة ابن زهر: الكليات والمدارس، المسؤولون، الاتصالات، مع بوابة الطالب ومنصة الامتحانات.",
                         slug="", canonical="/")]
    parts.append(hero_block())
    parts.append('<main class="wrap">')
    parts.append(sections_block())
    parts.append(directory_block())
    parts.append('</main>')
    parts.append(data_block())
    parts.append(FOOT.format(checked=CHECKED))
    io.open(os.path.join(REPO, "index.html"), "w", encoding="utf-8").write("".join(parts))


CSS = """/* CHRAIM — unified 'etablissements' section. Matches the main site design system. */
:root{
  --blue:#1F2937;--blue2:#374151;--gold:#B89B5E;--gold2:#E8D9B8;
  --bg:#F8F6F2;--ink:#1F2937;--card:#FFFFFF;--line:#E5E1D8;--muted:#6B7280;
  --soft:#F2EFE8;--ok:#2D7A5F;--warn:#A4620A;--warnbg:#FBF3E3;
  --font-ui:'IBM Plex Sans Arabic','Inter',system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;
  --radius:1.15rem;
}
:root:not([data-theme=light]){--blue:#14243A;--blue2:#2b4a7d;--gold:#C6A568;--gold2:#EAD9A8;
  --bg:#080d18;--ink:#F7F5F0;--card:#0F1626;--line:#26304e;--muted:#9aa3b5;--soft:#12192b;
  --warn:#fbbf6a;--warnbg:#2b2110;color-scheme:dark}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--blue:#14243A;--blue2:#2b4a7d;
  --gold:#C6A568;--gold2:#EAD9A8;--bg:#080d18;--ink:#F7F5F0;--card:#0F1626;--line:#26304e;
  --muted:#9aa3b5;--soft:#12192b;--warn:#fbbf6a;--warnbg:#2b2110;color-scheme:dark}}

*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font-ui);
  line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:var(--blue2)}
.wrap{max-width:1000px;margin:0 auto;padding:0 18px}

/* header */
.top{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:14px;flex-wrap:wrap;
  padding:12px 18px;background:color-mix(in srgb,var(--bg) 88%,transparent);
  backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.brand{font-weight:800;text-decoration:none;color:var(--ink);font-size:1.05rem;
  display:flex;flex-direction:column;line-height:1.2}
.brand span{font-size:.66rem;color:var(--gold);font-weight:600;letter-spacing:.02em}
.nav{display:flex;gap:14px;flex-wrap:wrap;margin-inline-start:auto;font-size:.9rem}
.nav a{color:var(--muted);text-decoration:none}
.nav a:hover{color:var(--ink)}
.theme{border:1px solid var(--line);background:var(--card);color:var(--ink);
  border-radius:999px;width:38px;height:38px;cursor:pointer;font-size:1rem}

/* hero */
.hero{background:linear-gradient(160deg,var(--blue) 0%,var(--blue2) 100%);
  color:#F7F5F0;padding:34px 0 28px}
.hero h1{margin:.1em 0;font-size:clamp(1.4rem,4vw,2.1rem)}
.hero .fr{margin:0;color:var(--gold2);font-size:.92rem}
.crumb{margin:0 0 .4em;font-size:.8rem;color:#cdd5e4}
.crumb a{color:var(--gold2)}
.pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.pill{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);
  padding:5px 12px;border-radius:999px;font-size:.8rem}
.pill.ok{background:rgba(45,122,95,.3);border-color:rgba(120,220,180,.4)}

/* boxes */
main.wrap{padding:26px 18px 40px}
.box{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);
  padding:22px;margin-bottom:20px}
.box h2{margin:0 0 14px;font-size:1.15rem;color:var(--blue);
  border-inline-start:4px solid var(--gold);padding-inline-start:10px}
.box h3{margin:20px 0 10px;font-size:1rem;color:var(--muted)}
.lead{margin:0;font-size:1rem}
.empty{color:var(--muted);font-style:italic}

.progs,.lead-list,.contact,.res{list-style:none;padding:0;margin:0}
.progs{display:flex;flex-wrap:wrap;gap:8px}
.progs li{background:var(--soft);border:1px solid var(--line);padding:6px 12px;
  border-radius:999px;font-size:.85rem}
.lead-list li,.contact li{display:flex;justify-content:space-between;gap:12px;
  padding:9px 0;border-bottom:1px dashed var(--line);flex-wrap:wrap}
.lead-list li:last-child,.contact li:last-child{border-bottom:0}
.role{color:var(--muted);font-size:.88rem}
.role small{color:var(--gold)}
.contact li span{color:var(--muted);font-size:.88rem}
.contact a{word-break:break-all}
.res li{display:flex;justify-content:space-between;gap:10px;align-items:center;
  padding:9px 0;border-bottom:1px dashed var(--line);flex-wrap:wrap}
.res li:last-child{border-bottom:0}
.res a{text-decoration:none;font-weight:600}
.res a i{color:var(--gold);font-style:normal}
.rt{font-size:.72rem;padding:3px 9px;border-radius:999px;white-space:nowrap}
.rt.off{background:var(--soft);color:var(--ok);border:1px solid var(--line)}
.rt.un{background:var(--warnbg);color:var(--warn)}
.rt.exp{background:var(--soft);color:var(--muted)}

/* index grid */
.filters{display:flex;flex-direction:column;gap:12px;margin-bottom:18px}
#q{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:12px;
  background:var(--soft);color:var(--ink);font-family:inherit;font-size:.95rem}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{border:1px solid var(--line);background:var(--card);color:var(--ink);
  padding:6px 14px;border-radius:999px;cursor:pointer;font-size:.85rem;font-family:inherit}
.chip[aria-pressed=true]{background:var(--gold);border-color:var(--gold);color:#1a1400;font-weight:700}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.card{display:block;background:var(--soft);border:1px solid var(--line);
  border-radius:14px;padding:16px;text-decoration:none;color:var(--ink);
  transition:transform .15s,border-color .15s}
.card:hover{transform:translateY(-3px);border-color:var(--gold)}
.card b{display:block;font-size:1rem}
.card .cfr{color:var(--muted);font-size:.75rem;display:block;margin-top:2px}
.card .meta{margin-top:10px;display:flex;gap:6px;flex-wrap:wrap}
.card .meta span{font-size:.7rem;background:var(--card);border:1px solid var(--line);
  padding:2px 9px;border-radius:999px;color:var(--muted)}

/* footer */
.foot{border-top:1px solid var(--line);padding:22px 18px 34px;text-align:center;
  color:var(--muted);font-size:.85rem}
.foot a{color:var(--blue2)}
:focus-visible{outline:3px solid #1676a8;outline-offset:3px}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
"""

JS = """/* CHRAIM — unified 'etablissements' section behaviour: theme toggle + Arabic search/filter. */
(function () {
  var KEY = 'chrvvim-theme';
  var btn = document.getElementById('themeBtn');
  function apply(t) {
    if (t) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  apply(localStorage.getItem(KEY));
  if (btn) btn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : (cur === 'light' ? null : 'dark');
    if (next) localStorage.setItem(KEY, next); else localStorage.removeItem(KEY);
    apply(next);
  });

  var grid = document.getElementById('grid');
  if (!grid) return;
  var items = [];
  try { items = JSON.parse(document.getElementById('data').textContent); } catch (e) {}
  var q = document.getElementById('q');
  var chips = document.getElementById('chips');
  var none = document.getElementById('none');
  var types = ['الكل'].concat(items.map(function (i) { return i.type; })
    .filter(function (v, i, a) { return v && a.indexOf(v) === i; }));
  var active = 'الكل';

  function norm(s) {
    return (s || '').toString().toLowerCase()
      .replace(/[\\u0640\\u064B-\\u0652]/g, '')
      .replace(/[\\u0621\\u0622\\u0623\\u0625\\u0629]/g, function (m) {
        return { '\\u0621': '\\u0647', '\\u0622': '\\u0627', '\\u0623': '\\u0627',
                 '\\u0625': '\\u0647', '\\u0629': '\\u0647' }[m];
      })
      .replace(/[\\u0649]/g, '\\u064A').replace(/[\\u0624]/g, '\\u0648').replace(/[\\u0626]/g, '\\u064A');
  }
  function render() {
    var t = norm(q.value.trim());
    var out = items.filter(function (i) {
      var okT = active === 'الكل' || i.type === active;
      var okQ = !t || norm(i.name + ' ' + i.fr + ' ' + i.city).indexOf(t) > -1;
      return okT && okQ;
    });
    grid.innerHTML = out.map(function (i) {
      return '<a class="card" href="/etablissements/' + i.slug + '.html">' +
        '<b>' + i.name + '</b><span class="cfr">' + i.fr + '</span>' +
        '<span class="meta"><span>' + i.type + '</span>' +
        (i.city ? '<span>\\uD83D\\uDCCD ' + i.city + '</span>' : '') + '</span></a>';
    }).join('');
    if (none) none.hidden = out.length > 0;
  }
  chips.innerHTML = types.map(function (ty, i) {
    return '<button class="chip" aria-pressed="' + (i === 0) + '">' + ty + '</button>';
  }).join('');
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    active = b.textContent;
    [].forEach.call(chips.children, function (c) {
      c.setAttribute('aria-pressed', c === b);
    });
    render();
  });
  q.addEventListener('input', render);
  render();
})();
"""


def main():
    os.makedirs(ROOT, exist_ok=True)
    io.open(os.path.join(ROOT, "style.css"), "w", encoding="utf-8").write(CSS)
    io.open(os.path.join(ROOT, "app.js"), "w", encoding="utf-8").write(JS)
    index()
    home()
    for e in EST:
        detail(e)
    print("generated: home + index + %d institution pages" % len(EST))


if __name__ == "__main__":
    main()
