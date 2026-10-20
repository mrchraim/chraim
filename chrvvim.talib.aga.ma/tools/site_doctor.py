#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Site Doctor - سكانر شامل للمواقع: يفحص، يكتشف الأخطاء، ويصلح ما يمكن إصلاحه.

التثبيت:
    pip install requests beautifulsoup4
    pip install playwright && playwright install chromium     # اختياري (فحص المتصفح الحقيقي)

الاستخدام:
    # 1) فحص موقع منشور (زحف + تقرير HTML/JSON)
    python site_doctor.py scan https://example.com
    python site_doctor.py scan https://example.com --browser --external --max-pages 300

    # 2) إصلاح تلقائي لملفات المشروع المحلية (معاينة فقط، بدون تعديل)
    python site_doctor.py fix ./my-site
    # تطبيق الإصلاحات فعليًا (مع نسخة احتياطية تلقائية)
    python site_doctor.py fix ./my-site --apply --safety-css

    # 3) الاثنان معًا: فحص ثم إصلاح
    python site_doctor.py all https://example.com ./my-site --apply
"""
import argparse
import concurrent.futures as cf
import datetime
import html as htmllib
import json
import os
import re
import shutil
import socket
import ssl
import sys
import time
from collections import defaultdict
from urllib.parse import urljoin, urlparse, urldefrag

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("ثبّت المكتبات أولًا:  pip install requests beautifulsoup4")
    sys.exit(1)

requests.packages.urllib3.disable_warnings()

UA = "Mozilla/5.0 (SiteDoctor/1.0; +audit) AppleWebKit/537.36 Chrome/120 Safari/537.36"
SEV_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}
SEV_AR = {"critical": "حرج", "high": "عالٍ", "medium": "متوسط", "low": "منخفض"}
SEV_COLOR = {"critical": "#b91c1c", "high": "#ea580c", "medium": "#ca8a04", "low": "#2563eb"}
IGNORE_EXT = (".pdf", ".zip", ".rar", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
              ".mp4", ".mp3", ".avi", ".mov", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico")


# ───────────────────────────── الفحص ─────────────────────────────
class Scanner:
    def __init__(self, start, max_pages=150, workers=8, timeout=15, browser=False, external=False):
        if not start.startswith("http"):
            start = "https://" + start
        self.start = start
        p = urlparse(start)
        self.origin = f"{p.scheme}://{p.netloc}"
        self.host = p.netloc.lower()
        self.max_pages, self.workers, self.timeout = max_pages, workers, timeout
        self.browser, self.external = browser, external
        self.s = requests.Session()
        self.s.headers["User-Agent"] = UA
        self.s.verify = True
        self.issues = []
        self.pages = {}                       # url -> {status, time, size}
        self.links = defaultdict(set)         # url -> {pages that reference it}
        self.kinds = {}                       # url -> "page" | "resource" | "external"
        self.fixable_hints = []

    def add(self, sev, code, url, msg, hint=""):
        self.issues.append(dict(sev=sev, code=code, url=url, msg=msg, hint=hint))

    def norm(self, u):
        u, _ = urldefrag(u)
        return u.rstrip("/") if urlparse(u).path in ("", "/") else u

    def is_internal(self, u):
        h = urlparse(u).netloc.lower()
        return h == self.host or h == "www." + self.host or "www." + h == self.host

    # ---- الزحف ----
    def crawl(self):
        queue = [self.norm(self.start)]
        seen = set(queue)
        while queue and len(self.pages) < self.max_pages:
            batch, queue = queue[: self.workers * 2], queue[self.workers * 2:]
            with cf.ThreadPoolExecutor(self.workers) as ex:
                for url, new_pages in ex.map(self.visit, batch):
                    for n in new_pages:
                        if n not in seen and len(seen) < self.max_pages * 3:
                            seen.add(n)
                            queue.append(n)
            print(f"\r  تم فحص {len(self.pages)} صفحة...", end="", flush=True)
        print()

    def visit(self, url):
        t0 = time.time()
        try:
            r = self.s.get(url, timeout=self.timeout, allow_redirects=True)
        except requests.exceptions.SSLError as e:
            self.add("critical", "SSL", url, f"خطأ شهادة SSL: {str(e)[:120]}", "جدّد/أصلح شهادة HTTPS")
            self.pages[url] = dict(status="SSL", time=0, size=0)
            return url, []
        except requests.RequestException as e:
            self.add("critical", "UNREACHABLE", url, f"تعذّر الوصول: {type(e).__name__}", "تحقق من الخادم/الـDNS")
            self.pages[url] = dict(status="ERR", time=0, size=0)
            return url, []
        dt = time.time() - t0
        self.pages[url] = dict(status=r.status_code, time=round(dt, 2), size=len(r.content))
        if r.status_code >= 400:
            sev = "critical" if r.status_code >= 500 else "high"
            self.add(sev, f"HTTP_{r.status_code}", url, f"الصفحة ترجع الحالة {r.status_code}",
                     "أصلح الصفحة أو أزل الروابط المؤدية إليها")
            return url, []
        if dt > 3:
            self.add("medium", "SLOW", url, f"الصفحة بطيئة ({dt:.1f}ث)", "فعّل الضغط/التخزين المؤقت وصغّر الصور")
        if len(r.content) > 2_500_000:
            self.add("medium", "HEAVY", url, f"حجم الصفحة كبير ({len(r.content)//1024} KB)", "قلّل حجم HTML/الصور")
        return url, self.analyze(url, r)

    def analyze(self, url, r):
        if "html" not in r.headers.get("content-type", "").lower():
            return []
        soup = BeautifulSoup(r.text, "html.parser")
        A = lambda sev, code, msg, hint="": self.add(sev, code, url, msg, hint)

        # ---- الميتا والبنية ----
        title = soup.title.string.strip() if soup.title and soup.title.string else ""
        if not title:
            A("medium", "NO_TITLE", "لا يوجد <title>", "أضف عنوانًا فريدًا للصفحة")
        elif len(title) > 70:
            A("low", "LONG_TITLE", f"العنوان طويل ({len(title)} حرف)", "اجعله أقل من 60 حرفًا")
        if not soup.find("meta", attrs={"name": re.compile("^description$", re.I)}):
            A("low", "NO_DESC", "لا يوجد meta description", "أضف وصفًا من 120-160 حرفًا")
        if not soup.find("meta", attrs={"name": re.compile("^viewport$", re.I)}):
            A("high", "NO_VIEWPORT", "لا يوجد meta viewport (الموقع سيظهر سيئًا على الهاتف)",
              '<meta name="viewport" content="width=device-width, initial-scale=1">')
        if not soup.find("meta", charset=True) and "charset" not in r.headers.get("content-type", "").lower():
            A("medium", "NO_CHARSET", "لا يوجد ترميز محدد", '<meta charset="utf-8">')
        html_tag = soup.find("html")
        text = soup.get_text(" ", strip=True)
        ar = len(re.findall(r"[\u0600-\u06FF]", text))
        lat = len(re.findall(r"[A-Za-z]", text))
        if html_tag is not None:
            if not html_tag.get("lang"):
                A("medium", "NO_LANG", "الوسم <html> بلا lang", '<html lang="ar" dir="rtl">')
            if ar > lat and (html_tag.get("dir") or "").lower() != "rtl":
                A("high", "NO_RTL", "المحتوى عربي لكن dir ليس rtl (تخطيط معكوس)", '<html dir="rtl">')
        h1 = soup.find_all("h1")
        if len(h1) == 0:
            A("low", "NO_H1", "لا يوجد <h1>")
        elif len(h1) > 1:
            A("low", "MULTI_H1", f"يوجد {len(h1)} وسوم h1")

        # ---- المعرّفات المكررة ----
        ids = defaultdict(int)
        for el in soup.find_all(id=True):
            ids[el["id"]] += 1
        for k, v in ids.items():
            if v > 1:
                A("medium", "DUP_ID", f'المعرّف id="{k}" مكرر {v} مرات', "يكسر JS وCSS؛ اجعله فريدًا")

        # ---- الصور ----
        for img in soup.find_all("img"):
            if img.get("alt") is None:
                A("low", "IMG_NO_ALT", f"صورة بلا alt: {(img.get('src') or '')[:80]}", 'أضف alt=""')
            if not img.get("src") and not img.get("data-src") and not img.get("srcset"):
                A("high", "IMG_NO_SRC", "وسم img بلا src")

        # ---- الروابط ----
        for a in soup.find_all("a"):
            href = (a.get("href") or "").strip()
            if a.has_attr("href") and (href in ("", "#") or href.lower().startswith("javascript:")):
                label = a.get_text(strip=True)[:40] or "(بلا نص)"
                A("low", "DEAD_LINK", f'رابط فارغ/وهمي: "{label}" -> {href or "فارغ"}', "اربطه بوجهة حقيقية أو حوّله إلى button")
            if a.get("target") == "_blank" and "noopener" not in (a.get("rel") or []):
                A("low", "NO_NOOPENER", f"target=_blank بلا rel=noopener: {href[:60]}", 'rel="noopener noreferrer"')
            if a.has_attr("href") and not a.get_text(strip=True) and not a.get("aria-label") and not a.find("img"):
                A("low", "A11Y_EMPTY_LINK", f"رابط بلا نص: {href[:60]}", "أضف نصًا أو aria-label")

        # ---- النماذج وإمكانية الوصول ----
        for inp in soup.find_all(["input", "select", "textarea"]):
            if inp.get("type") in ("hidden", "submit", "button", "image", "reset"):
                continue
            iid = inp.get("id")
            has_label = (iid and soup.find("label", attrs={"for": iid})) or inp.find_parent("label") \
                        or inp.get("aria-label") or inp.get("aria-labelledby") or inp.get("title")
            if not has_label:
                A("low", "A11Y_NO_LABEL", f"حقل إدخال بلا label ({inp.get('name') or inp.get('type') or inp.name})")
        for b in soup.find_all("button"):
            if not b.get_text(strip=True) and not b.get("aria-label") and not b.get("title") and not b.find("img"):
                A("low", "A11Y_EMPTY_BUTTON", "زر بلا نص أو aria-label")

        # ---- وسوم قديمة ----
        for tag in ("font", "center", "marquee", "blink", "frameset"):
            if soup.find(tag):
                A("low", "DEPRECATED", f"وسم قديم <{tag}>", "استبدله بـ CSS")

        # ---- المحتوى المختلط ----
        if url.startswith("https"):
            for el in soup.find_all(["img", "script", "iframe", "source", "video", "audio", "link"]):
                u = el.get("src") or el.get("href") or ""
                if u.startswith("http://"):
                    A("high", "MIXED_CONTENT", f"محتوى مختلط HTTP داخل صفحة HTTPS: {u[:80]}", "غيّره إلى https://")

        # ---- جمع الروابط والموارد ----
        new_pages = []
        refs = []
        for a in soup.find_all("a", href=True):
            refs.append(("a", a["href"]))
        for tag, attr in (("img", "src"), ("script", "src"), ("link", "href"), ("source", "src"),
                          ("iframe", "src"), ("video", "src"), ("audio", "src")):
            for el in soup.find_all(tag):
                if el.get(attr):
                    refs.append((tag, el[attr]))
        for tag, raw in refs:
            raw = raw.strip()
            if not raw or raw.startswith(("mailto:", "tel:", "javascript:", "data:", "#", "sms:", "whatsapp:")):
                continue
            full = self.norm(urljoin(url, raw))
            if not full.startswith("http"):
                continue
            internal = self.is_internal(full)
            self.links[full].add(url)
            if tag == "a" and internal and not full.lower().endswith(IGNORE_EXT):
                self.kinds.setdefault(full, "page")
                new_pages.append(full)
            elif internal or tag != "a":
                self.kinds.setdefault(full, "resource" if internal else "external")
            else:
                self.kinds.setdefault(full, "external")
        return new_pages

    # ---- فحص الروابط المكسورة ----
    def check_url(self, u):
        try:
            r = self.s.head(u, timeout=self.timeout, allow_redirects=True)
            if r.status_code >= 400 or r.status_code in (405, 501):
                r = self.s.get(u, timeout=self.timeout, stream=True, allow_redirects=True)
                r.close()
            return u, r.status_code
        except requests.exceptions.SSLError:
            return u, "SSL"
        except requests.RequestException as e:
            return u, type(e).__name__

    def check_links(self):
        todo = [u for u, k in self.kinds.items()
                if u not in self.pages and (k != "external" or self.external)]
        if not todo:
            return
        print(f"  فحص {len(todo)} رابط/مورد...")
        with cf.ThreadPoolExecutor(self.workers * 2) as ex:
            for u, st in ex.map(self.check_url, todo):
                ext = self.kinds.get(u) == "external"
                bad = isinstance(st, str) or st >= 400
                if ext and not isinstance(st, str) and st in (401, 403, 429, 999):
                    bad = False
                # جذر نطاق خارجي (مثل fonts.googleapis.com) قد يرجّع 404 بطبيعته — ليس رابطًا مكسورًا
                if ext and isinstance(st, int) and st == 404 and urlparse(u).path in ("", "/"):
                    bad = False
                if bad:
                    srcs = sorted(self.links[u])[:3]
                    kind = {"page": "رابط داخلي", "resource": "مورد (صورة/CSS/JS)", "external": "رابط خارجي"}[self.kinds[u]]
                    sev = "high" if self.kinds[u] != "external" else "medium"
                    self.add(sev, "BROKEN_LINK", srcs[0], f"{kind} مكسور [{st}]: {u[:110]}",
                             "المصدر: " + " ، ".join(srcs))

    # ---- فحوص على مستوى الموقع ----
    def site_checks(self):
        # HTTPS / ترويسات الأمان
        try:
            r = self.s.get(self.origin, timeout=self.timeout)
            need = {
                "strict-transport-security": "HSTS",
                "x-content-type-options": "X-Content-Type-Options: nosniff",
                "x-frame-options": "X-Frame-Options (أو CSP frame-ancestors)",
                "content-security-policy": "Content-Security-Policy",
                "referrer-policy": "Referrer-Policy",
            }
            for h, nm in need.items():
                if h not in {k.lower() for k in r.headers}:
                    if h == "x-frame-options" and "frame-ancestors" in r.headers.get("content-security-policy", ""):
                        continue
                    self.add("low", "SEC_HEADER", self.origin, f"ترويسة أمان مفقودة: {nm}", "أضفها من إعدادات الخادم/CDN")
            if "gzip" not in r.headers.get("content-encoding", "") and "br" not in r.headers.get("content-encoding", ""):
                self.add("low", "NO_COMPRESSION", self.origin, "الضغط (gzip/brotli) غير مفعّل", "فعّله على الخادم")
            srv = r.headers.get("server", "")
            if re.search(r"\d+\.\d+", srv) or r.headers.get("x-powered-by"):
                self.add("low", "INFO_LEAK", self.origin, "الخادم يكشف إصدار البرمجيات", "أخفِ Server/X-Powered-By")
        except requests.RequestException:
            pass
        if self.origin.startswith("https"):
            try:
                with socket.create_connection((self.host.split(":")[0], 443), timeout=8) as sock:
                    with ssl.create_default_context().wrap_socket(sock, server_hostname=self.host.split(":")[0]) as ss:
                        exp = datetime.datetime.strptime(ss.getpeercert()["notAfter"], "%b %d %H:%M:%S %Y %Z")
                days = (exp - datetime.datetime.utcnow()).days
                if days < 0:
                    self.add("critical", "SSL_EXPIRED", self.origin, "شهادة SSL منتهية!", "جدّدها فورًا")
                elif days < 21:
                    self.add("high", "SSL_SOON", self.origin, f"شهادة SSL تنتهي بعد {days} يومًا", "جدّدها")
            except Exception:
                pass
            try:
                h = self.s.get("http://" + self.host, timeout=self.timeout, allow_redirects=False)
                if h.status_code not in (301, 302, 307, 308) or not h.headers.get("location", "").startswith("https"):
                    self.add("medium", "NO_HTTPS_REDIRECT", "http://" + self.host, "HTTP لا يُحوَّل تلقائيًا إلى HTTPS")
            except requests.RequestException:
                pass
        for path, sev, nm in (("/robots.txt", "low", "robots.txt"), ("/sitemap.xml", "low", "sitemap.xml"),
                              ("/favicon.ico", "low", "favicon.ico")):
            try:
                rr = self.s.get(self.origin + path, timeout=self.timeout)
                if rr.status_code >= 400:
                    self.add(sev, "MISSING_FILE", self.origin + path, f"الملف {nm} غير موجود")
            except requests.RequestException:
                pass
        try:
            rr = self.s.get(self.origin + "/__site_doctor_404_test__", timeout=self.timeout)
            if rr.status_code == 200:
                self.add("low", "SOFT_404", self.origin, "الصفحات غير الموجودة ترجع 200 بدل 404 (Soft 404)")
        except requests.RequestException:
            pass

    # ---- فحص المتصفح الحقيقي (أخطاء JS، تراكب العناصر، تجاوز العرض) ----
    def browser_audit(self, limit=25):
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            print("  [تخطي] فحص المتصفح يحتاج:  pip install playwright && playwright install chromium")
            return
        JS = """() => {
          const vw = innerWidth, vh = innerHeight, out = [];
          const sel = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +
              (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).slice(0,2).join('.') : '');
          document.querySelectorAll('body *').forEach(el => {
            const cs = getComputedStyle(el);
            if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;
            if (cs.pointerEvents === 'none') return;                      // زخرفي: غير قابل للنقر
            const zi = parseInt(cs.zIndex, 10);
            if (!isNaN(zi) && zi < 0) return;                             // خلف المحتوى (خلفيات/توهج)
            if (el.getAttribute('aria-hidden') === 'true') return;
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) return;
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            const area = (r.width * r.height) / (vw * vh);
            const centered = cx > vw * .15 && cx < vw * .85 && cy > vh * .15 && cy < vh * .85;
            const tallStrip = r.height > vh * .5 && r.width < vw * .35 && centered;
            if ((centered && area > .03) || tallStrip)
              out.push({sel: sel(el), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height)});
          });
          /* WCAG 2.2 (2.5.8): الاستثناء الصريح هو الروابط المضمّنة داخل النص.
             لذلك نستثني <a> التي داخل فقرة/جملة (لها نصّ حولها في نفس السطر)
             ولا نعدّها "هدف لمس صغير". نعدّ فقط الأزرار وعناصر التحكم والروابط المستقلة. */
          const small = [...document.querySelectorAll('a,button,input,select')].filter(e => {
            const r = e.getBoundingClientRect();
            if (!(r.width > 0 && r.height > 0) || !(r.width < 24 || r.height < 24)) return false;
            const tag = e.tagName.toLowerCase();
            if (tag === 'button' || tag === 'input' || tag === 'select') return true;
            // روابط: استثنِ المضمّن داخل نص جارٍ (inline-in-text exception)
            const inlineText = e.closest('p,li,span,small,em,strong,label,figcaption,dd,dt,blockquote,td,th');
            if (inlineText && e.parentElement && e.parentElement.textContent.trim() !== e.textContent.trim()) return false;
            const cs = getComputedStyle(e);
            if (cs.display.startsWith('inline') && (e.textContent || '').trim().length > 0
                && e.parentElement && e.parentElement.textContent.trim() !== e.textContent.trim()) return false;
            return true;
          }).length;
          return {overflowX: document.documentElement.scrollWidth > vw + 2, floating: out, small};
        }"""
        pages = [u for u, p in self.pages.items() if p["status"] == 200 and self.kinds.get(u, "page") == "page"
                 and not u.lower().endswith((".csv", ".json", ".md", ".txt", ".xml", ".pdf"))][:limit]
        print(f"  فحص المتصفح لـ {len(pages)} صفحة...")
        with sync_playwright() as pw:
            br = pw.chromium.launch()
            for vp_name, vp, mobile in (
                ("هاتف", {"width": 390, "height": 844}, True),
                ("حاسوب", {"width": 1366, "height": 768}, False),
            ):
                # الهاتف يُحاكى كجهاز لمس حقيقي (is_mobile + has_touch) حتى تُطبَّق
                # قواعد `@media (pointer: coarse)` كما على الأجهزة الفعلية،
                # وليس كنافذة سطح مكتب ضيّقة فقط.
                ctx = br.new_context(viewport=vp, user_agent=UA,
                                     is_mobile=mobile, has_touch=mobile,
                                     device_scale_factor=3 if mobile else 1)
                for u in pages:
                    pg = ctx.new_page()
                    errs = []
                    pg.on("console", lambda m, errs=errs: errs.append(("console", m.text)) if m.type == "error" else None)
                    pg.on("pageerror", lambda e, errs=errs: errs.append(("js", str(e))))
                    pg.on("requestfailed", lambda rq, errs=errs: errs.append(("net", f"{rq.url[:90]} ({rq.failure})")))
                    try:
                        pg.goto(u, wait_until="networkidle", timeout=30000)
                        res = pg.evaluate(JS)
                    except Exception as e:
                        self.add("high", "BROWSER_LOAD", u, f"[{vp_name}] فشل التحميل في المتصفح: {str(e)[:100]}")
                        pg.close()
                        continue
                    for kind, msg in errs[:8]:
                        lab = {"console": "خطأ Console", "js": "استثناء JavaScript", "net": "طلب فاشل"}[kind]
                        self.add("high" if kind == "js" else "medium", "JS_" + kind.upper(), u, f"[{vp_name}] {lab}: {msg[:160]}")
                    if res["overflowX"]:
                        self.add("medium", "H_OVERFLOW", u, f"[{vp_name}] الصفحة تتجاوز عرض الشاشة أفقيًا (تمرير جانبي)",
                                 "ابحث عن عنصر عرضه ثابت/أكبر من الشاشة؛ جرّب img{max-width:100%}")
                    for f in res["floating"][:4]:
                        self.add("high", "FLOATING_OVERLAY", u,
                                 f"[{vp_name}] عنصر ثابت عائم يغطي المحتوى: {f['sel']} ({f['w']}×{f['h']} عند {f['x']},{f['y']})",
                                 "ثبّته بـ bottom:0; left:0; right:0 أو اجعله top:0 مع flex-direction:row، وأضف padding للـbody")
                    if vp_name == "هاتف" and res["small"] > 5:
                        self.add("low", "TAP_TARGET", u, f"[{vp_name}] {res['small']} عنصر تفاعلي صغير جدًا (<24px)")
                    pg.close()
                ctx.close()
            br.close()

    # ---- التشغيل ----
    def run(self):
        print(f"▶ الزحف على {self.start}")
        self.crawl()
        self.check_links()
        self.site_checks()
        if self.browser:
            self.browser_audit()
        seen, uniq = set(), []
        for i in self.issues:
            k = (i["code"], i["url"], i["msg"])
            if k not in seen:
                seen.add(k)
                uniq.append(i)
        self.issues = sorted(uniq, key=lambda i: (SEV_ORDER[i["sev"]], i["code"]))
        return self.issues

    def report(self, outdir="site_doctor_report"):
        os.makedirs(outdir, exist_ok=True)
        counts = defaultdict(int)
        for i in self.issues:
            counts[i["sev"]] += 1
        score = max(0, 100 - counts["critical"] * 15 - counts["high"] * 5 - counts["medium"] * 2 - counts["low"] * 0.5)
        with open(os.path.join(outdir, "report.json"), "w", encoding="utf-8") as f:
            json.dump(dict(site=self.start, score=round(score), counts=counts, pages=self.pages, issues=self.issues),
                      f, ensure_ascii=False, indent=2)
        rows = ""
        for i in self.issues:
            c = SEV_COLOR[i["sev"]]
            rows += (f'<tr><td><span class="b" style="background:{c}">{SEV_AR[i["sev"]]}</span></td>'
                     f'<td>{htmllib.escape(i["code"])}</td><td dir="auto">{htmllib.escape(i["msg"])}'
                     f'<div class="h">{htmllib.escape(i["hint"])}</div></td>'
                     f'<td dir="ltr"><a href="{htmllib.escape(i["url"])}">{htmllib.escape(i["url"][:70])}</a></td></tr>')
        cards = "".join(f'<div class="c" style="border-color:{SEV_COLOR[k]}"><b>{counts[k]}</b>{SEV_AR[k]}</div>' for k in SEV_ORDER)
        doc = f"""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>تقرير Site Doctor</title>
<style>body{{font-family:system-ui,Tahoma,sans-serif;margin:0;background:#f5f7f6;color:#1c1f1e}}
header{{background:#14532d;color:#fff;padding:20px}}main{{padding:16px;max-width:1200px;margin:auto}}
.cards{{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}}.c{{background:#fff;border-right:6px solid;padding:10px 18px;border-radius:8px;display:flex;flex-direction:column;align-items:center}}
.c b{{font-size:26px}}.score{{font-size:34px;font-weight:700}}table{{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden}}
td,th{{padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top;font-size:14px}}th{{background:#e8efe9}}
.b{{color:#fff;padding:2px 8px;border-radius:10px;font-size:12px;white-space:nowrap}}.h{{color:#6b7280;font-size:12px;margin-top:3px}}
.wrap{{overflow-x:auto}}</style></head><body><header><div class="score">{round(score)}/100</div>
<div>{htmllib.escape(self.start)} — {len(self.pages)} صفحة، {len(self.issues)} مشكلة</div></header><main>
<div class="cards">{cards}</div><div class="wrap"><table><tr><th>الخطورة</th><th>الرمز</th><th>المشكلة</th><th>الصفحة</th></tr>{rows}</table></div>
</main></body></html>"""
        with open(os.path.join(outdir, "report.html"), "w", encoding="utf-8") as f:
            f.write(doc)
        print("\n══════ الملخص ══════")
        print(f"التقييم: {round(score)}/100 | صفحات: {len(self.pages)} | مشاكل: {len(self.issues)}")
        for k in SEV_ORDER:
            print(f"  {SEV_AR[k]}: {counts[k]}")
        print(f"التقرير: {outdir}/report.html  و  report.json")


# ───────────────────────────── الإصلاح التلقائي ─────────────────────────────
SAFETY_CSS = ('<style id="site-doctor-safety">*,*::before,*::after{box-sizing:border-box}'
              'img,video,iframe{max-width:100%;height:auto}'
              'body{padding-bottom:env(safe-area-inset-bottom)}</style>')


def fix_html(text, safety_css=False):
    changes = []
    orig = text

    visible = re.sub(r"<(script|style)\b.*?</\1>", " ", text, flags=re.S | re.I)
    visible = re.sub(r"<[^>]+>", " ", visible)
    ar = len(re.findall(r"[\u0600-\u06FF]", visible))
    lat = len(re.findall(r"[A-Za-z]", visible))

    m = re.search(r"<html\b([^>]*)>", text, re.I)
    if m and ar > lat:
        attrs, new = m.group(1), m.group(1)
        if not re.search(r"\blang\s*=", attrs, re.I):
            new += ' lang="ar"'
            changes.append("إضافة lang=ar")
        if not re.search(r"\bdir\s*=", attrs, re.I):
            new += ' dir="rtl"'
            changes.append("إضافة dir=rtl")
        if new != attrs:
            text = text[:m.start(1)] + new + text[m.end(1):]

    head = re.search(r"<head\b[^>]*>", text, re.I)
    if head:
        ins = ""
        if not re.search(r"<meta[^>]+charset", text, re.I):
            ins += '\n<meta charset="utf-8">'
            changes.append("إضافة meta charset")
        if not re.search(r'<meta[^>]+name\s*=\s*["\']viewport', text, re.I):
            ins += '\n<meta name="viewport" content="width=device-width, initial-scale=1">'
            changes.append("إضافة meta viewport")
        if ins:
            text = text[:head.end()] + ins + text[head.end():]
        if safety_css and "site-doctor-safety" not in text:
            text = re.sub(r"</head>", SAFETY_CSS + "\n</head>", text, count=1, flags=re.I)
            changes.append("حقن CSS أمان (img max-width, box-sizing)")

    counter = {"n": 0, "alt": 0, "lazy": 0}

    def img_fix(mm):
        tag = mm.group(0)
        counter["n"] += 1
        selfclose = tag.rstrip().endswith("/>")
        base = tag[:-2].rstrip() if selfclose else tag[:-1].rstrip()
        add = ""
        if not re.search(r"\balt\s*=", tag, re.I):
            add += ' alt=""'
            counter["alt"] += 1
        if counter["n"] > 1 and not re.search(r"\bloading\s*=", tag, re.I):
            add += ' loading="lazy"'
            counter["lazy"] += 1
        if not add:
            return tag
        return base + add + (" />" if selfclose else ">")

    text = re.sub(r"<img\b[^>]*>", img_fix, text, flags=re.I)
    if counter["alt"]:
        changes.append(f"إضافة alt لـ {counter['alt']} صورة")
    if counter["lazy"]:
        changes.append(f"إضافة loading=lazy لـ {counter['lazy']} صورة")

    cnt = {"n": 0}

    def a_fix(mm):
        tag = mm.group(0)
        if not re.search(r'target\s*=\s*["\']?_blank', tag, re.I):
            return tag
        rel = re.search(r'\brel\s*=\s*(["\'])(.*?)\1', tag, re.I)
        if rel:
            if "noopener" in rel.group(2):
                return tag
            cnt["n"] += 1
            return tag[:rel.start(2)] + rel.group(2) + " noopener noreferrer" + tag[rel.end(2):]
        cnt["n"] += 1
        return tag[:-1].rstrip() + ' rel="noopener noreferrer">'

    text = re.sub(r"<a\b[^>]*>", a_fix, text, flags=re.I)
    if cnt["n"]:
        changes.append(f"إضافة rel=noopener لـ {cnt['n']} رابط")

    return (text if text != orig else None), changes


def scan_css(path, css):
    notes = []
    for m in re.finditer(r"([^{}@]+)\{([^{}]*)\}", css):
        sel, body = m.group(1).strip(), m.group(2)
        if re.search(r"position\s*:\s*fixed", body, re.I):
            problems = []
            if re.search(r"(top|left)\s*:\s*50%", body, re.I) or re.search(r"translate", body, re.I):
                problems.append("موضع في منتصف الشاشة")
            if re.search(r"flex-direction\s*:\s*column", body, re.I) and re.search(r"border-radius\s*:\s*[5-9]\d+|999", body):
                problems.append("شريط عمودي بيضاوي")
            if not re.search(r"\b(top|bottom|left|right)\s*:", body, re.I):
                problems.append("بلا إحداثيات (قد يظهر في مكان غير متوقع)")
            if problems:
                notes.append(f"{os.path.basename(path)} → {sel[:60]}: {', '.join(problems)}")
    if re.search(r"width\s*:\s*\d{4,}px", css):
        notes.append(f"{os.path.basename(path)} → عرض ثابت كبير بالبكسل (يسبب تمريرًا جانبيًا على الهاتف)")
    return notes


def fix_project(root, apply=False, safety_css=False):
    stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = os.path.join(root, ".site_doctor_backup", stamp)
    skip = {"node_modules", ".git", ".site_doctor_backup", "dist", "build", "__pycache__"}
    total, notes = 0, []
    for dp, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in skip]
        for fn in files:
            p = os.path.join(dp, fn)
            low = fn.lower()
            try:
                if low.endswith((".html", ".htm")):
                    with open(p, encoding="utf-8") as f:
                        src = f.read()
                    new, ch = fix_html(src, safety_css)
                    if new is not None:
                        total += 1
                        print(f"{'✔' if apply else '•'} {os.path.relpath(p, root)}: " + "، ".join(ch))
                        if apply:
                            dst = os.path.join(backup, os.path.relpath(p, root))
                            os.makedirs(os.path.dirname(dst), exist_ok=True)
                            shutil.copy2(p, dst)
                            with open(p, "w", encoding="utf-8") as f:
                                f.write(new)
                elif low.endswith(".css"):
                    with open(p, encoding="utf-8") as f:
                        notes += scan_css(p, f.read())
            except (UnicodeDecodeError, OSError) as e:
                print(f"! تعذّر قراءة {p}: {e}")
    print(f"\n{'تم تعديل' if apply else 'سيتم تعديل'} {total} ملف.")
    if apply and total:
        print(f"نسخة احتياطية: {backup}")
    if not apply and total:
        print("لتطبيق الإصلاحات أضف:  --apply")
    if notes:
        print("\nمشاكل CSS تحتاج مراجعة يدوية:")
        for n in notes:
            print("  ⚠", n)


# ───────────────────────────── CLI ─────────────────────────────
def main():
    ap = argparse.ArgumentParser(description="Site Doctor — فحص وإصلاح شامل للمواقع")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("scan", help="فحص موقع منشور")
    s.add_argument("url")
    f = sub.add_parser("fix", help="إصلاح ملفات المشروع المحلية")
    f.add_argument("path")
    a = sub.add_parser("all", help="فحص ثم إصلاح")
    a.add_argument("url")
    a.add_argument("path")
    for sp in (s, a):
        sp.add_argument("--max-pages", type=int, default=150)
        sp.add_argument("--workers", type=int, default=8)
        sp.add_argument("--timeout", type=int, default=15)
        sp.add_argument("--browser", action="store_true", help="فحص بمتصفح حقيقي (أخطاء JS/تراكب/تجاوز عرض)")
        sp.add_argument("--external", action="store_true", help="فحص الروابط الخارجية أيضًا")
        sp.add_argument("--out", default="site_doctor_report")
    for sp in (f, a):
        sp.add_argument("--apply", action="store_true", help="تطبيق التعديلات (الافتراضي: معاينة)")
        sp.add_argument("--safety-css", action="store_true", help="حقن CSS أمان للصور وbox-sizing")
    args = ap.parse_args()

    if args.cmd in ("scan", "all"):
        sc = Scanner(args.url, args.max_pages, args.workers, args.timeout, args.browser, args.external)
        sc.run()
        sc.report(args.out)
    if args.cmd in ("fix", "all"):
        print("\n▶ الإصلاح التلقائي")
        fix_project(args.path, args.apply, args.safety_css)


if __name__ == "__main__":
    main()
