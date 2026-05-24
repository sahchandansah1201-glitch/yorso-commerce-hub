import { describe, expect, it } from "vitest";
import { resolveCatalogPriceRangeLabel } from "@/lib/catalog-display-labels";

describe("catalog display labels", () => {
  it("replaces legacy redacted price labels with the active locale label", () => {
    expect(resolveCatalogPriceRangeLabel("Цена по запросу", "Exact price locked")).toBe(
      "Exact price locked",
    );
    expect(resolveCatalogPriceRangeLabel("Price on request", "Точная цена скрыта")).toBe(
      "Точная цена скрыта",
    );
    expect(resolveCatalogPriceRangeLabel("Precio a consultar", "Precio exacto bloqueado")).toBe(
      "Precio exacto bloqueado",
    );
  });

  it("keeps real price labels unchanged", () => {
    expect(resolveCatalogPriceRangeLabel("$8.50 – $9.20", "Exact price locked")).toBe(
      "$8.50 – $9.20",
    );
  });
});
