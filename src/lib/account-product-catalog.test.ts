import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { searchCatalog } from "./account-product-catalog";

const catalog: Array<{
  id: string;
  latin: string;
  en?: string;
  es?: string;
  ru?: string;
}> = JSON.parse(
  readFileSync(
    resolve(__dirname, "../../public/data/account-product-catalog.json"),
    "utf8",
  ),
);

describe("account product catalog (workbook-backed)", () => {
  it("contains exactly 12091 items", () => {
    expect(catalog.length).toBe(12091);
  });

  it("has no missing / empty / 'null' latin values", () => {
    for (const item of catalog) {
      expect(item.latin).toBeTruthy();
      expect(item.latin.trim()).not.toBe("");
      expect(item.latin.trim().toLowerCase()).not.toBe("null");
    }
  });

  it("latin values are unique", () => {
    const set = new Set(catalog.map((x) => x.latin));
    expect(set.size).toBe(catalog.length);
  });

  it("ids are stable and unique", () => {
    const set = new Set(catalog.map((x) => x.id));
    expect(set.size).toBe(catalog.length);
  });

  it("contains expected sample rows verbatim", () => {
    const by = new Map(catalog.map((x) => [x.latin, x]));

    const mackerel = by.get("Scomber scombrus");
    expect(mackerel?.en).toBe("Atlantic mackerel");
    expect(mackerel?.ru).toBe("Скумбрия обыкновенная");
    expect(mackerel?.es).toBe("Caballa del Atlántico");

    const saury = by.get("Cololabis saira");
    expect(saury?.en).toBe("Pacific saury");
    expect(saury?.ru).toBe("Сайра");
    expect(saury?.es).toBe("Paparda del Pacífico");

    const indian = by.get("Rastrelliger kanagurta");
    expect(indian?.en).toBe("Indian mackerel");
    expect(indian?.ru).toBe("Скумбрия индийская");
  });

  it("finds catalog items by commercial name and returns the Latin name", () => {
    expect(searchCatalog(catalog, "Atlantic mackerel", 1)[0]?.latin).toBe("Scomber scombrus");
    expect(searchCatalog(catalog, "Скумбрия обыкновенная", 1)[0]?.latin).toBe("Scomber scombrus");
  });
});
