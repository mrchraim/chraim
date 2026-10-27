import { describe, it, expect } from "vitest";

function compareNames(a, b) {
  const ca = String(a || "").trim();
  const cb = String(b || "").trim();
  const sa = ca.includes(" ");
  const sb = cb.includes(" ");
  if (sa !== sb) return sa ? -1 : 1;
  return ca.localeCompare(cb, "fr", { sensitivity: "base" });
}

function computeLanguageGroup(name, thresholds) {
  for (let i = 0; i < thresholds.length; i++) {
    const item = thresholds[i];
    if (item.maxName === null) return item.name;
    if (compareNames(name, item.maxName) <= 0) return item.name;
  }
  return thresholds[thresholds.length - 1].name;
}

describe("compareNames", () => {
  it("composite (with space) comes before non-composite", () => {
    expect(compareNames("EL MANSOURI", "ELMANSOURI")).toBeLessThan(0);
  });
  it("non-composite after composite", () => {
    expect(compareNames("ELMANSOURI", "EL MANSOURI")).toBeGreaterThan(0);
  });
  it("equal returns 0", () => {
    expect(compareNames("ABC", "ABC")).toBe(0);
  });
  it("handles null/undefined", () => {
    expect(compareNames(null, "ABC")).toBeLessThanOrEqual(0); // null -> "" composite? no space -> compares
  });
});

describe("computeLanguageGroup S3", () => {
  const thr = [
    { name: "Fr-A", maxName: "EL KARZABI" },
    { name: "Fr-B", maxName: null },
  ];
  it("name <= EL KARZABI -> Fr-A", () => {
    expect(computeLanguageGroup("AIT BACH", thr)).toBe("Fr-A");
  });
  it("name > EL KARZABI -> Fr-B", () => {
    expect(computeLanguageGroup("ZOUINE", thr)).toBe("Fr-B");
  });
  it("composite EL KARZABI boundary -> Fr-A", () => {
    expect(computeLanguageGroup("EL KARZABI", thr)).toBe("Fr-A");
  });
});

describe("computeLanguageGroup S5", () => {
  const thr = [
    { name: "Ang-A", maxName: "BOUASRY" },
    { name: "Ang-B", maxName: "ELHAMIL" },
    { name: "Ang-C", maxName: "LAMIN" },
    { name: "Ang-D", maxName: null },
  ];
  it("BOUASRY -> Ang-A", () => expect(computeLanguageGroup("BOUASRY", thr)).toBe("Ang-A"));
  it("ELHAMIL -> Ang-B", () => expect(computeLanguageGroup("ELHAMIL", thr)).toBe("Ang-B"));
  it("LAMIN -> Ang-C", () => expect(computeLanguageGroup("LAMIN", thr)).toBe("Ang-C"));
  it("Z -> Ang-D", () => expect(computeLanguageGroup("ZOUINE", thr)).toBe("Ang-D"));
});
