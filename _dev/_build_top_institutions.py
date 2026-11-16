import io
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

SLUGS = {
    "UIZ-001": "faculte-des-lettres-et-des-sciences-humaines-agadir",
    "UIZ-002": "faculte-des-sciences-agadir",
    "UIZ-003": "faculte-des-sciences-juridiques-economiques-et-sociales-agadir",
    "UIZ-004": "faculte-chariaa-ait-melloul",
    "UIZ-005": "faculte-des-sciences-juridiques-economiques-et-sociales-ait-melloul",
    "UIZ-006": "faculte-deconomie-et-de-gestion-guelmim",
    "UIZ-007": "faculte-de-medecine-et-de-pharmacie-agadir",
    "UIZ-008": "faculte-de-medecine-et-de-pharmacie-guelmim",
    "UIZ-009": "faculte-de-medecine-et-de-pharmacie-laayoune",
    "UIZ-010": "faculte-polydisciplinaire-ouarzazate",
    "UIZ-011": "faculte-polydisciplinaire-taroudant",
    "UIZ-012": "faculte-polydisciplinaire-smara",
    "UIZ-013": "faculte-des-sciences-appliquees-ait-melloul",
    "UIZ-014": "faculte-des-langues-arts-et-sciences-humaines-ait-melloul",
    "UIZ-015": "ecole-nationale-de-commerce-et-de-gestion-agadir",
    "UIZ-016": "ecole-nationale-des-sciences-appliquees-agadir",
    "UIZ-017": "ecole-superieure-de-technologie-agadir",
    "UIZ-018": "ecole-superieure-de-technologie-ouarzazate",
    "UIZ-019": "ecole-superieure-de-technologie-guelmim",
    "UIZ-020": "ecole-superieure-de-technologie-laayoune",
    "UIZ-021": "ecole-nationale-de-commerce-et-de-gestion-dakhla",
    "UIZ-022": "ecole-superieure-de-leducation-et-de-la-formation-agadir",
    "UIZ-023": "ecole-nationale-superieure-de-lintelligence-artificielle-et-sciences-des-donnees-de-taroudant-0",
    "UIZ-029": "ecole-superieure-de-technologie-dakhla",
}

j = json.load(open(ROOT / "institutions-database.json", encoding="utf-8"))
records = [r for r in j["records"] if r["status"] == "listed_official"]
records.sort(key=lambda r: r["id"])

out = [
    "# CHRVVIM — المؤسسات الـ 24 على الصفحة الرسمية «Nos établissements» (جامعة ابن زهر)",
    "",
    "**آخر تحقق شامل:** 2026-11-16 · **المصدر:** <https://www.uiz.ac.ma/nos-etablissements> (فُحصت — كل كيان بالترتيب نفسه + كل روابط `200`)",
    "**سجل البيانات:** `institutions-database.json` (status = `listed_official`)",
    "",
    "> هذه قائمة **رسمية** بمؤسسات جامعة ابن زهر منشورة على الموقع الرسمي. لا تُضف إليها أي مؤسسة إلا بمصدر رسمي.",
    "> `website_url` هنا هو الموقع المُسجَّل في سجلنا — لا يُعتبر اعتمادًا نهائيًا للدولة/الاعتماد البيداغوجي؛ الإعلان البيداغوجي الرسمي هو المرجع.",
    "",
    "| # | الاسم (FR) | النوع | المدينة | الموقع الرسمي للجامعة (slug) | `website_url` المُسجل | آخر تحقق |",
    "|---|---|---|---|---|---|---|",
]

for r in records:
    slug = SLUGS[r["id"]]
    uiz = f"https://www.uiz.ac.ma/{slug}"
    website = r.get("website_url") or "(بدون موقع — يعتمد على بلاغ الانطلاق الرسمي)"
    out.append(
        f"| {r['id']} | {r['name_fr']} | {r['type']} | {r['city_fr']} | [{slug}]({uiz}) | `{website}` | {r['last_verified']} |"
    )

out += [
    "",
    "## ملاحظات تحقق (2026-11-16)",
    "",
    "- عناوين `website_url` التالية لم تعد ترد في الاختبار الآلي لهذا التاريخ — تبقى مُسجلة لكن **غير موثوقة**:",
    "  - `https://www.fsa.ac.ma/` (UIZ-002) — DNS فشل (`getaddrinfo`)",
    "  - `https://www.fsjes-agadir.org/` (UIZ-003) — DNS فشل",
    "  - `http://www.fpo.ma/` و `https://www.fpo.ma/` (UIZ-032، التدوينة «portal_name_needs_reconciliation») — يرد بـ 401 على HTTP / SSL خطأ على HTTPS",
    "  - `https://www.chariaasmara.com/` (UIZ-012) — SSL EOF",
    "  - `http://cuam.uiz.ac.ma/` (UIZ-013) — 502 Bad Gateway",
    "  - `https://ensiasdt.uiz.ac.ma/` (UIZ-023) — DNS فشل",
    "  - `http://www.ims.uiz.ma/` (UIZ-028، official_announcement) — DNS فشل",
    "- المرجع الموثوق لكل مؤسسة أعلاه هو **رابط جامعة ابن زهر** في عمود `Nos établissements` (كلها `200` بتاريخ 2026-11-16).",
    "- المؤسسات التي لم تظهر على صفحة nos-etablissements (ENTA ببيوكرى/العيون/الداخلة، ENSIAB، كلية الاقتصاد والتدبير وكلية الحقوق بتيزنيت…) مسجلة بحالة `official_announcement` في نفس السجل — راجع `institutions-database.json`.",
    "- المؤسسات الأربعة عشر «fac» و**المدرسة الوطنية** تندرج على الصفحة الرسمية معًا؛ لا تميز بين كلية/مدرسة في اللائحة.",
    "",
    "## لماذا هذا الملف مهم",
    "",
    "- يمنع اختراع مؤسسات أو أرقام.",
    "- يعطي المستخدم رابطًا واحدًا للتحقق لكل مؤسسة.",
    "- يغذي `assets/search-index.json` و`/etablissements/` والصفحات الرسمية لـ FEGA/FSJPA.",
]

(ROOT / "docs" / "TOP_INSTITUTIONS_OFFICIAL.md").write_text("\n".join(out) + "\n", encoding="utf-8")
print("written docs/TOP_INSTITUTIONS_OFFICIAL.md", len(records), "records")
