# -*- coding: utf-8 -*-
"""Scan official UIZ/Agadir sites for downloadable academic documents, then download them."""
import io, os, re, sys, json, time, hashlib, urllib.parse
sys.path.insert(0, ".")
from _crawler import fetch, decode, links, drive_direct, ext_of, DOC_EXT, IMG_EXT

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.abspath(__file__))
STAGE = os.path.join(ROOT, "_crawl")
os.makedirs(STAGE, exist_ok=True)

INSTITUTIONS = [
    {"key": "uiz", "ar": "جامعة ابن زهر", "hosts": ["www.uiz.ac.ma", "uiz.ac.ma"],
     "seeds": ["https://www.uiz.ac.ma/"]},
    {"key": "fsjes-agadir", "ar": "كلية العلوم القانونية والاقتصادية والاجتماعية بأكادير",
     "hosts": ["fsjes-agadir.uiz.ac.ma"], "seeds": ["https://fsjes-agadir.uiz.ac.ma/"]},
    {"key": "fega", "ar": "كلية الاقتصاد والتدبير بأكادير",
     "hosts": ["fega.uiz.ac.ma"], "seeds": ["https://fega.uiz.ac.ma/", "https://fega.uiz.ac.ma/announcements/11"]},
    {"key": "fsa", "ar": "كلية العلوم بأكادير",
     "hosts": ["fsa.uiz.ac.ma"], "seeds": ["https://fsa.uiz.ac.ma/"]},
    {"key": "fmpa", "ar": "كلية الطب والصيدلة بأكادير",
     "hosts": ["fmpa.uiz.ac.ma"], "seeds": ["https://fmpa.uiz.ac.ma/"]},
    {"key": "encg", "ar": "المدرسة الوطنية للتجارة والتسيير بأكادير",
     "hosts": ["encga.uiz.ac.ma"],
     "seeds": ["https://encga.uiz.ac.ma/?p=5643", "https://encga.uiz.ac.ma/?p=5663", "https://encga.uiz.ac.ma/?p=5703", "https://encga.uiz.ac.ma/"]},
    {"key": "esef", "ar": "المدرسة العليا للتربية والتكوين بأكادير",
     "hosts": ["esef.uiz.ac.ma"],
     "seeds": ["https://esef.uiz.ac.ma/ar/",
               "https://esef.uiz.ac.ma/ar/licence-deducation-liste-des-etudiants-par-groupe-au-titre-de-lannee-universitaire-2026-2027/"]},
    {"key": "ims", "ar": "معهد مهن الرياضة بأكادير",
     "hosts": ["ims.uiz.ac.ma"], "seeds": ["https://ims.uiz.ac.ma/announcements/1", "https://ims.uiz.ac.ma/"]},
    {"key": "est", "ar": "المدرسة العليا للتكنولوجيا أكادير",
     "hosts": ["www.esta.ac.ma", "esta.ac.ma", "ecours.esta.ac.ma"],
     "seeds": ["https://www.esta.ac.ma/?page_id=469", "https://www.esta.ac.ma/"]},
    {"key": "fsa-am", "ar": "كلية العلوم التطبيقية آيت ملول",
     "hosts": ["fsa-am.uiz.ac.ma"], "seeds": ["https://fsa-am.uiz.ac.ma/ar/emplois-du-temps", "https://fsa-am.uiz.ac.ma/ar"]},
]

KW = [
    ("emplois-du-temps", ["emploi du temps", "emplois du temps", "emploi-du-temps", "emplois-du-temps",
                          "edt", "planning", "horaire", "timetable", "st3", "استعمال الزمن", "استعمالات الزمن",
                          "جدول الحصص", "التوقيت", "تواقيت"]),
    ("groupes-et-sections", ["groupe", "groupes", "groupement", "section", "sections", "affectation",
                             "repartition", "répartition", "liste des etudiants", "liste des étudiants",
                             "filiere et groupe", "أفواج", "فوج", "الأفواج", "شعبة", "الشعب", "أقسام", "الأقسام",
                             "توزيع الطلبة", "توزيع"]),
    ("candidats-admis", ["admis", "admissible", "candidat", "candidature", "preselection", "présélection",
                         "resultat", "résultat", "resultats", "résultats", "convoqu", "convocation",
                         "المقبول", "المقبولين", "المرشح", "المرشحين", "النتائج", "اللائحة النهائية", "انتقاء"]),
    ("enseignants", ["enseignant", "enseignants", "professeur", "professeurs", "encadrement", "pedagogique",
                     "pédagogique", "liste des professeurs", "أساتذة", "الأستاذ", "الطاقم البيداغوجي"]),
    ("td-tp", ["travaux diriges", "travaux dirigés", "td", "tp", "travaux pratiques", "أعمال موجهة",
               "أعمال تطبيقية", "التمارين"]),
    ("programmes-et-descriptifs", ["programme", "programmes", "descriptif", "descriptifs", "syllabus",
                                   "brochure", "guide", "maquette", "برنامج", "البرنامج", "وصف", "دليل", "مقرر"]),
    ("filieres-et-modules", ["filiere", "filière", "filieres", "filières", "module", "modules", "semestre",
                             "semestres", "unite", "unité", "مسلك", "مسالك", "وحدة", "وحدات", "مادة", "مواد",
                             "الفصل", "السداسي", "s1", "s2", "s3", "s4", "s5", "s6"]),
]


def classify(name, text, page):
    hay = (" " + name + " " + text + " " + page + " ").lower()
    for cat, keys in KW:
        for k in keys:
            if k in hay:
                return cat
    return "autres-documents"


def year_of(*parts):
    s = " ".join(parts)
    if re.search(r"2026\s*[-/_]\s*2027", s):
        return "2026-2027"
    if re.search(r"2025\s*[-/_]\s*2026", s):
        return "2025-2026"
    if re.search(r"2024\s*[-/_]\s*2025", s):
        return "2024-2025"
    return ""


def same_site(url, hosts):
    h = urllib.parse.urlparse(url).netloc.lower()
    return any(h == x or h.endswith("." + x) for x in hosts)


def scan(per_site_pages=70, maxdepth=3):
    out = []
    for inst in INSTITUTIONS:
        print("=== %s (%s) ===" % (inst["key"], inst["ar"]))
        seen = set()
        q = [(u, 0) for u in inst["seeds"]]
        pages = 0
        found = 0
        while q and pages < per_site_pages:
            url, depth = q.pop(0)
            url = url.split("#")[0]
            if url in seen:
                continue
            seen.add(url)
            try:
                d, final, hdr = fetch(url, timeout=25)
            except Exception as e:
                print("   ! %s -> %s" % (url[:70], str(e)[:50]))
                continue
            ct = (hdr.get("Content-Type") or "").lower()
            if "html" not in ct:
                continue
            pages += 1
            html = decode(d, hdr)
            for href, text in links(html, final):
                ext = ext_of(href)
                direct = drive_direct(href)
                if ext in DOC_EXT or direct:
                    tgt = direct or href
                    out.append({"institution": inst["key"], "page": final, "url": tgt, "orig": href,
                                "text": text[:160], "ext": ext_of(tgt) or ".pdf",
                                "category": classify(href, text, final), "year": year_of(href, text, final),
                                "kind": "doc"})
                    found += 1
                elif same_site(href, inst["hosts"]) and depth < maxdepth:
                    low = href.lower()
                    if re.search(r"\.(jpg|jpeg|png|gif|css|js|zip|rar|7z|mp4|svg|ico)$", low):
                        continue
                    if re.search(r"(annonce|annonces|actualite|actualité|news|emploi|groupe|liste|examen|resultat|résultat|document|scolarite|scolarité|etudiant|étudiant|licence|master|semestre|s[1-6]\b|td|tp|planning|note|communique|communiqué)", low):
                        q.insert(0, (href, depth + 1))
                    else:
                        q.append((href, depth + 1))
        print("   pages=%d doclinks=%d" % (pages, found))
    return out


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "scan"
    if mode == "scan":
        items = scan()
        # de-dup by URL
        uniq = {}
        for it in items:
            uniq.setdefault(it["url"], it)
        items = list(uniq.values())
        with open(os.path.join(STAGE, "links.json"), "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=1)
        print("\nTOTAL unique doc links: %d" % len(items))
        from collections import Counter
        print("by institution:", dict(Counter(i["institution"] for i in items)))
        print("by category:", dict(Counter(i["category"] for i in items)))
        print("by ext:", dict(Counter(i["ext"] for i in items)))
