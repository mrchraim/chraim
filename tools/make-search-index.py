#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""يولّد assets/search-index.json لبحث Ctrl+K العام (المؤسسات + صفحات الموقع).
الاستعمال:  python3 tools/make-search-index.py"""
import json, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent

PAGES = [
    ("الرئيسية", "index.html", "الصفحة الرئيسية مسارات الإجازة جداول ماذا تريد اليوم"),
    ("بوابة الطالب", "portal.html", "جداول وثائق معدل بوابة حقوق قانون FSJP"),
    ("رفيق الطالب", "rafiq-altalib.html", "جدول معدل مواعيد حساب النقط"),
    ("دليل جامعة ابن زهر", "university-directory.html", "دليل مؤسسات الجامعة"),
    ("Portal Ibn Zohr", "portal-ibn-zohr.html", "Portal Ibn Zohr بوابة"),
    ("Portal v2", "portal-v2.html", "Portal v2 بوابة"),
    ("Portal Tajawal", "portal-tajawal.html", "Portal Tajawal بوابة"),
    ("CHRVVIM Campus 2.0", "campus2.html", "Campus 2.0 بوابة طالب"),
    ("المصادر", "sources.html", "مصادر official registry"),
    ("فضاء الطالب", "student.html", "فضاء طالب تفضيلات جدول"),
    ("بوابات الكليات", "faculties/index.html", "FSJP كليات جامعات"),
    ("المساعد الذكي", "ai-assistant.html", "مساعد ذكي AI"),
    ("أطلس المعرفة", "atlas.html", "أطلس موارد فهرس بحث تصدير"),
    ("المكتبة القانونية", "documents/legal/", "قانون مسطرة مدنية جنائي الأسرة"),
    ("دليل التكوينات", "academic-offer.html", "تكوينات ماستر إجازة مسالك"),
    ("المستجدات الجامعية", "academic-updates.html", "أخبار مستجدات إعلانات"),
    ("دليل المؤسسات التفصيلي", "etablissements/index.html", "مؤسسات كليات مدارس عميد اتصال"),
    ("منصة الامتحانات", "platform/index.html", "امتحانات فروض ملخصات"),
    ("مرشد التوجيه", "orientation.html", "توجيه اختيار تكوين مسلك اهتمامات اقتراح ماذا أدرس"),
    ("دليل الطالب", "students-guide.html", "دليل إرشاد تسجيل"),
    ("المستويات", "levels/index.html", "ابتدائي إعدادي ثانوي دروس دعم شروحات"),
    ("الدروس", "lessons/index.html", "دروس شروحات تمارين مراجعة"),
    ("الدعم", "support/index.html", "دعم تمارين امتحانات شروحات"),
    ("الموارد", "resources.html", "موارد روابط رسمية مصادر"),
    ("الدليل", "directory.html", "وزارات جامعات مذكرات قانون تعليم"),
    ("سياسة الخصوصية", "privacy.html", "خصوصية بيانات"),
    ("شروط الاستعمال", "terms.html", "شروط استخدام"),
]

# مرادفات شائعة يستعملها الطلبة بحسب بادئة الرمز (slug)
# إضافات: مستويات، دروس، دعم
SYNONYMS = {
    "fsjes": "حقوق قانون اقتصاد تسيير علوم قانونية", "flsh": "اداب انسانيات لغات تاريخ جغرافيا",
    "flash": "اداب انسانيات لغات", "fsa": "علوم فيزياء كيمياء رياضيات بيولوجيا",
    "fmp": "طب صيدلة", "ensa": "هندسة مهندس", "encg": "تجارة تسيير ماركتينغ",
    "est": "تقني تكنولوجيا دبلوم", "esta": "تقني تكنولوجيا", "esef": "تربية تكوين تعليم اساتذة",
    "ensiasd": "معلوميات هندسة", "fpt": "كلية متعددة التخصصات", "fpo": "كلية متعددة التخصصات",
    "fp": "كلية متعددة التخصصات", "feg": "اقتصاد تسيير", "chariaa": "شريعة اسلامية فقه",
  "levels": "مستويات ابتدائي إعدادي ثانوي", "lessons": "دروس شروحات تمارين", "support": "دعم تمارين امتحانات",
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
