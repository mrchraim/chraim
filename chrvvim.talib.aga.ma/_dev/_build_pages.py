# -*- coding: utf-8 -*-
"""
Build the two merged pages for the site from the archived prototypes,
preserving all of their original markup/logic.

  * students-guide.html  <- incoming index.html     ("دليل طلبة جامعة ابن زهر")
  * rafiq-altalib.html   <- incoming index 3.html   ("رفيق الطالب", with EMBEDDED fallback)

Changes applied (additive only, this script is the single source of truth):
  1. a small top bar linking back to the site home
  2. the announcements source is repointed from the prototype's data/announcements.json
     to the site's merged announcements.json (EMBEDDED stays as an offline fallback)
  3. descriptive text mentioning the old path is corrected
  4. rafiq-altalib gets Arabic labels for the two curated notice kinds
"""
import io, os, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INC = os.path.join(ROOT, "_dev", "incoming-2026-10-17")

TOPBAR_CSS = (
    ".chrvvim-topbar{display:flex;align-items:center;gap:10px;background:#071b32;color:#e6f0fa;"
    "padding:10px 16px;font-size:.9rem;flex-wrap:wrap}"
    ".chrvvim-topbar a{color:#52cdf5;text-decoration:none;font-weight:700}"
    ".chrvvim-topbar a:hover{text-decoration:underline}"
    ".chrvvim-topbar .sep{opacity:.45}"
    ".chrvvim-topbar .brand{opacity:.85}"
)

TOPBAR_HTML = (
    '<div class="chrvvim-topbar" role="navigation" aria-label="تنقل سريع">'
    '<a href="./">← الرئيسية</a>'
    '<span class="sep">·</span>'
    '<span class="brand">CHRVVIM Campus — صفحة مدمجة</span>'
    "</div>"
)


def build(src_name, out_name, extra=None):
    src = os.path.join(INC, src_name)
    out = os.path.join(ROOT, out_name)
    t = open(src, encoding="utf-8").read()

    assert "</style>" in t and "<body>" in t, "unexpected prototype structure: " + src_name
    t = t.replace("</style>", TOPBAR_CSS + "</style>", 1)
    t = t.replace("<body>", "<body>" + TOPBAR_HTML, 1)

    before = t
    t = t.replace('fetch("data/announcements.json"', 'fetch("announcements.json"')
    assert t != before, "announcements fetch not repointed in " + src_name

    for old, new in (extra or []):
        assert old in t, "expected text not found in %s: %r" % (src_name, old[:60])
        t = t.replace(old, new)

    open(out, "w", encoding="utf-8", newline="").write(t)
    print("built", out_name, "from", src_name, "|", len(t), "chars")


build(
    "index.html",
    "students-guide.html",
    extra=[("<code>data/announcements.json</code>", "<code>announcements.json</code>")],
)

build(
    "index 3.html",
    "rafiq-altalib.html",
    extra=[
        ("الملف data/announcements.json كاين", "الملف announcements.json كاين"),
        (
            'const TYPE_LABEL = {emplois_du_temps:"استعمال الزمن",examens:"امتحانات",avis:"إعلان",concours:"مباريات وقبول",listes:"لوائح",espace_etudiant:"فضاء الطالب"};',
            'const TYPE_LABEL = {emplois_du_temps:"استعمال الزمن",examens:"امتحانات",avis:"إعلان",concours:"مباريات وقبول",listes:"لوائح",espace_etudiant:"فضاء الطالب",info:"إعلان عام",warning:"تنبيه"};',
        ),
    ],
)
