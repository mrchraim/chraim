#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""يولّد assets/search-index.json لبحث Ctrl+K العام (المؤسسات + صفحات الموقع).
الاستعمال:  python3 tools/make-search-index.py"""
import json, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent

PAGES = [
    ("الرئيسية", "index.html", "الصفحة الرئيسية مسارات الإجازة جداول"),
    ("بوابة الطالب", "portal.html", "جداول وثائق معدل بوابة حقوق قانون FSJP"),
    ("رفيق الطالب", "rafiq-altalib.html", "جدول معدل مواعيد حساب النقط"),
    ("دليل جامعة ابن زهر", "university-directory.html", "دليل مؤسسات الجامعة"),
    ("دليل التكوينات", "academic-offer.html", "تكوينات ماستر إجازة مسالك"),
    ("المستجدات الجامعية", "academic-updates.html", "أخبار مستجدات إعلانات"),
    ("دليل المؤسسات التفصيلي", "etablissements/index.html", "مؤسسات كليات مدارس عميد اتصال"),
    ("منصة الامتحانات", "platform/index.html", "امتحانات فروض ملخصات"),
    ("مرشد التوجيه", "orientation.html", "توجيه اختيار تكوين مسلك اهتمامات اقتراح ماذا أدرس"),
    ("دليل الطالب", "students-guide.html", "دليل إرشاد تسجيل"),
]

# مرادفات شائعة يستعملها الطلبة بحسب بادئة الرمز (slug)
SYNONYMS = {
    "fsjes": "حقوق قانون اقتصاد تسيير علوم قانونية", "flsh": "اداب انسانيات لغات تاريخ جغرافيا",
    "flash": "اداب انسانيات لغات", "fsa": "علوم فيزياء كيمياء رياضيات بيولوجيا",
    "fmp": "طب صيدلة", "ensa": "هندسة مهندس", "encg": "تجارة تسيير ماركتينغ",
    "est": "تقني تكنولوجيا دبلوم", "esta": "تقني تكنولوجيا", "esef": "تربية تكوين تعليم اساتذة",
    "ensiasd": "معلوميات هندسة", "fpt": "كلية متعددة التخصصات", "fpo": "كلية متعددة التخصصات",
    "fp": "كلية متعددة التخصصات", "feg": "اقتصاد تسيير", "chariaa": "شريعة اسلامية فقه",
}

def main():
    html = (ROOT / "etablissements/index.html").read_text(encoding="utf-8")
    items = json.loads(re.search(r'id="data"[^>]*>(.*?)</script>', html, re.S).group(1))
    out = [{"t": n, "u": u, "k": k, "g": "صفحة"} for n, u, k in PAGES]
    for i in items:
        out.append({"t": i["name"], "u": f"etablissements/{i['slug']}.html",
                    "k": f"{i.get('fr','')} {i.get('city','')} {i.get('type','')} {i['slug']} {SYNONYMS.get(i['slug'].split('-')[0], '')}",
                    "g": f"{i.get('type') or 'مؤسسة'} · {i.get('city','')}".strip(" ·")})
    (ROOT / "assets/search-index.json").write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"search-index.json: {len(out)} عنصراً")

if __name__ == "__main__":
    main()
