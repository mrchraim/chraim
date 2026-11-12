import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { normalize, tokenize, scoreEntry, retrieve } from "../functions/_lib/retrieval.js";

const index = JSON.parse(readFileSync(new URL("../assets/search-index.json", import.meta.url), "utf8"));

describe("normalize", () => {
  it("يوحّد الألف والياء والتاء المربوطة", () => {
    expect(normalize("أفواج")).toBe("افواج");
    expect(normalize("مؤسسات")).toBe("مؤسسات");
    expect(normalize("جامعة")).toBe("جامعه");
  });
  it("يحذف التشكيل والتطويل", () => {
    expect(normalize("الـجَامِعَة")).toBe("الجامعه");
  });
});

describe("tokenize", () => {
  it("يحذف أدوات التعريف والوقف", () => {
    expect(tokenize("الفوج ديالي في الجامعة")).toEqual(["فوج", "جامعه"]);
  });
  it("يحذف التكرار", () => {
    expect(tokenize("مؤسسات مؤسسات")).toEqual(["مؤسسات"]);
  });
  it("يحذف الرموز والكلمات القصيرة", () => {
    expect(tokenize("a ?! دليل -- 2026")).toEqual(["دليل", "2026"]);
  });
});

describe("scoreEntry", () => {
  it("العنوان أثقل من الكلمات المفتاحية", () => {
    const entry = { t: "دليل", u: "x.html", k: "مؤسسات", g: "صفحة" };
    expect(scoreEntry(entry, ["دليل"])).toBe(4);
    expect(scoreEntry(entry, ["مؤسسات"])).toBe(2);
  });
  it("التطابق الجزئي مُرجِّح فقط ولا يكفي وحده", () => {
    const entry = { t: "المستجدات الجامعية", u: "x.html", k: "", g: "" };
    expect(scoreEntry(entry, ["جامعي"])).toBe(1);
  });
});

describe("retrieve على الفهرس الحقيقي", () => {
  it("يربط سؤال المؤسسات بصفحة المؤسسات", () => {
    const hits = retrieve(index, "دليل المؤسسات");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].ref).toBe("etablissements/index.html");
    expect(hits.every((h) => h.score >= 2)).toBe(true);
  });

  it("يربط سؤال التوجيه بمرشد التوجيه", () => {
    const hits = retrieve(index, "التوجيه");
    expect(hits.map((h) => h.ref)).toContain("orientation.html");
  });

  it("يربط الامتحانات بمنصة الامتحانات", () => {
    const hits = retrieve(index, "الامتحانات والملخصات");
    expect(hits.map((h) => h.ref)).toContain("platform/index.html");
  });

  it("لا يخترع نتيجة حين لا يوجد مصدر", () => {
    expect(retrieve(index, "منحة الأكل الجامعي")).toEqual([]);
  });

  it("يحترم حدّ النتائج", () => {
    expect(retrieve(index, "دليل المؤسسات", { limit: 1 })).toHaveLength(1);
  });

  it("يتعامل مع مدخلات غير صالحة دون رمي", () => {
    expect(retrieve(null, "دليل")).toEqual([]);
    expect(retrieve(index, "")).toEqual([]);
    expect(retrieve(index, "!!!")).toEqual([]);
  });
});
