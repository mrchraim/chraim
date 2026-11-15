import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const json = JSON.parse(readFileSync(new URL("../institutions-database.json", import.meta.url), "utf8"));
const records = json.records;

const ALLOWED_STATUS = new Set(["listed_official", "official_announcement", "portal_name_needs_reconciliation"]);
const ALLOWED_CONFIDENCE = new Set(["official_page", "official_announcement", "official_portal_unreconciled"]);

describe("institutions-database.json", () => {
  it("declares count equal to the number of records", () => {
    expect(json.count).toBe(records.length);
    expect(records.length).toBeGreaterThan(0);
  });

  it("has all required fields and a trusted source per record", () => {
    for (const r of records) {
      expect(r.id, "missing id").toMatch(/^UIZ-\d{3}$/);
      expect(r.name_ar).toBeTruthy();
      expect(r.city_fr).toBeTruthy();
      expect(r.official_source_url).toMatch(/^https:\/\//);
      expect(ALLOWED_STATUS).toContain(r.status);
      expect(ALLOWED_CONFIDENCE).toContain(r.source_confidence);
      expect(r.last_verified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("has unique ids", () => {
    const ids = records.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not duplicate (name_ar, city_fr) pairs", () => {
    const seen = new Set();
    for (const r of records) {
      const key = `${r.name_ar}|${r.city_fr}`;
      expect(seen.has(key), `duplicate ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("every record carries a source list with checked URLs", () => {
    expect(Array.isArray(json.sources)).toBe(true);
    expect(json.sources.length).toBeGreaterThan(0);
    for (const s of json.sources) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.checked_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.id).toMatch(/^SRC-\d+$/);
    }
  });
});

describe("institutions-database.csv", () => {
  it("contains the same ids in the same order as the JSON", () => {
    const csv = readFileSync(new URL("../institutions-database.csv", import.meta.url), "utf8");
    const lines = csv.trim().split(/\r?\n/);
    expect(lines[0].toLowerCase()).toContain("id");
    const csvIds = lines.slice(1).map((l) => l.split(",")[0]);
    expect(csvIds).toEqual(records.map((r) => r.id));
  });
});

describe("institutions-database.js", () => {
  it("is a generated window.CHRVVIM_INSTITUTIONS bundle", () => {
    const src = readFileSync(new URL("../institutions-database.js", import.meta.url), "utf8");
    expect(src).toContain("window.CHRVVIM_INSTITUTIONS");
    expect(src.startsWith("/*")).toBe(true);
  });
});

describe("assets/search-index.json", () => {
  it("is a non-empty array with resolvable local routes", () => {
    const index = JSON.parse(readFileSync(new URL("../assets/search-index.json", import.meta.url), "utf8"));
    expect(Array.isArray(index)).toBe(true);
    expect(index.length).toBeGreaterThan(40);
    for (const e of index) {
      expect(typeof e.t).toBe("string");
      expect(typeof e.u).toBe("string");
      expect(e.u.length).toBeGreaterThan(0);
    }
    expect(index.some((e) => e.u === "etablissements/official-content.html")).toBe(true);
  });
});

describe("announcements.json", () => {
  it("has a valid schema (items with ids and types)", () => {
    const doc = JSON.parse(readFileSync(new URL("../announcements.json", import.meta.url), "utf8"));
    expect(Array.isArray(doc.items)).toBe(true);
    for (const item of doc.items) {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.type || item.kind).toBeTruthy();
    }
  });
});
