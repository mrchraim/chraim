import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// نفس القاعدة المستعملة في app.js / rafiq-altalib.html / students-guide.html
const liveAnn = (i) => {
  const e = i && i.ends_at;
  if (!e) return true;
  const p = Date.parse(String(e));
  return isNaN(p) || p >= Date.now();
};

describe("announcements live/expired rule", () => {
  it("items without ends_at stay visible", () => {
    expect(liveAnn({ ends_at: undefined })).toBe(true);
    expect(liveAnn({ ends_at: "" })).toBe(true);
  });

  it("items with ends_at in the past are hidden", () => {
    expect(liveAnn({ ends_at: "2026-11-15T18:00:00+00:00" })).toBe(false);
    expect(liveAnn({ ends_at: "2020-01-01" })).toBe(false);
  });

  it("items with ends_at in the future are visible", () => {
    expect(liveAnn({ ends_at: "2099-01-01T00:00:00+00:00" })).toBe(true);
  });

  it("unparsable ends_at falls back to visible (never hides good info)", () => {
    expect(liveAnn({ ends_at: "not-a-date" })).toBe(true);
  });

  it("data integrity: every item with ends_at parses, and ends_at >= starts_at", () => {
    const doc = JSON.parse(readFileSync(new URL("../announcements.json", import.meta.url), "utf8"));
    for (const it of doc.items) {
      if (!it.ends_at) continue;
      const end = Date.parse(String(it.ends_at));
      expect(Number.isNaN(end), `ends_at غير صالح في ${it.id}`).toBe(false);
      if (it.starts_at) {
        const start = Date.parse(String(it.starts_at));
        if (!Number.isNaN(start)) {
          expect(end, `ends_at أقدم من starts_at في ${it.id}`).toBeGreaterThanOrEqual(start);
        }
      }
    }
  });

  it("reinscription-2026 announcements are past their ends_at (must be replaced for 2027)", () => {
    const doc = JSON.parse(readFileSync(new URL("../announcements.json", import.meta.url), "utf8"));
    const ids = doc.items.filter((i) => String(i.id || "").startsWith("reinscription-2026")).map((i) => i.id);
    expect(ids.length).toBeGreaterThan(0);
    for (const i of doc.items.filter((x) => ids.includes(x.id))) {
      expect(liveAnn(i), `${i.id} أصبح منتهيًا ولا ينبغي عرضه كـ «ساري»`).toBe(false);
    }
  });
});
