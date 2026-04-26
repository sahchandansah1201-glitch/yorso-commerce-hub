/**
 * Typography contract tests.
 *
 * The site uses a single typography scale derived from the catalog
 * workspace (CatalogOfferRow). Two layers ensure consistency:
 *
 *   1. Global base styles in src/index.css (h1..h6, body, p, small)
 *      give every page a sensible default WITHOUT requiring per-page
 *      class edits.
 *   2. Semantic component classes (.text-page-title, .text-card-title,
 *      .text-meta, etc.) provide a stable API for new code and gradual
 *      migration away from hard-coded text-[17px] sprinkles.
 *
 * This test reads index.css and pins both layers so a careless tweak to
 * heading sizes — or to the body baseline — fails loudly.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "src/index.css"), "utf-8");

describe("typography contract — global base", () => {
  it("body baseline is text-sm (matches catalog workspace flow text)", () => {
    expect(css).toMatch(/body\s*\{[^}]*@apply[^;]*\btext-sm\b[^}]*\}/s);
  });

  it("h1 uses the catalog page-title scale (text-3xl → md:text-4xl)", () => {
    expect(css).toMatch(/h1\s*\{[^}]*@apply[^}]*text-3xl[^}]*md:text-4xl[^}]*font-bold[^}]*\}/s);
  });

  it("h2 uses the section-title scale", () => {
    expect(css).toMatch(/h2\s*\{[^}]*@apply[^}]*text-2xl[^}]*md:text-\[28px\][^}]*\}/s);
  });

  it("h3 uses the card-title scale", () => {
    expect(css).toMatch(/h3\s*\{[^}]*@apply[^}]*text-lg[^}]*md:text-xl[^}]*\}/s);
  });

  it("all headings use Plus Jakarta Sans", () => {
    expect(css).toMatch(/h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*\{[^}]*Plus Jakarta Sans/);
  });
});

describe("typography contract — semantic component classes", () => {
  const expectClass = (cls: string, ...required: string[]) => {
    const re = new RegExp(`\\.${cls.replace(/-/g, "\\-")}\\s*\\{[^}]*\\}`, "s");
    const match = css.match(re);
    expect(match, `expected .${cls} to be defined in index.css`).toBeTruthy();
    const block = match![0];
    for (const token of required) {
      expect(
        block.includes(token),
        `.${cls} should @apply ${token}; got: ${block}`,
      ).toBe(true);
    }
  };

  it(".text-page-title mirrors h1 scale", () => {
    expectClass("text-page-title", "text-3xl", "md:text-4xl", "font-bold");
  });

  it(".text-section-title mirrors h2 scale", () => {
    expectClass("text-section-title", "text-2xl", "md:text-[28px]", "font-semibold");
  });

  it(".text-card-title matches CatalogOfferRow product name (17→18px)", () => {
    expectClass("text-card-title", "text-base", "sm:text-[17px]", "lg:text-[18px]");
  });

  it(".text-body is text-sm (the catalog flow size)", () => {
    expectClass("text-body", "text-sm");
  });

  it(".text-meta is text-xs muted (catalog metadata strip)", () => {
    expectClass("text-meta", "text-xs", "text-muted-foreground");
  });

  it(".text-micro is the 11→12px micro signal size", () => {
    expectClass("text-micro", "text-[11px]", "sm:text-xs");
  });

  it(".text-numeric is the prominent price/kpi scale with tabular-nums", () => {
    expectClass("text-numeric", "text-base", "sm:text-[17px]", "lg:text-[19px]", "tabular-nums");
  });
});
