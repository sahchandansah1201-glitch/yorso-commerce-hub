import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync("index.html", "utf8");
const indexCss = readFileSync("src/index.css", "utf8");
const tailwindConfig = readFileSync("tailwind.config.ts", "utf8");

describe("font loading", () => {
  it("does not block CSS parsing with a Google Fonts import", () => {
    expect(indexCss).not.toMatch(/@import\s+url\(["']https:\/\/fonts\.googleapis\.com/);
    expect(indexCss).not.toContain("fonts.googleapis.com");
  });

  it("loads the existing font contract from the document head", () => {
    expect(indexHtml).toContain('<link rel="preconnect" href="https://fonts.googleapis.com" />');
    expect(indexHtml).toContain('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />');
    expect(indexHtml).toContain('rel="stylesheet"');
    expect(indexHtml).toContain("family=Plus+Jakarta+Sans:wght@400;500;600;700;800");
    expect(indexHtml).toContain("family=Inter:wght@400;500;600");
    expect(indexHtml).toContain("display=swap");
  });

  it("keeps Inter for body copy and Plus Jakarta Sans for headings", () => {
    expect(indexCss).toContain("font-family: 'Inter', system-ui, sans-serif;");
    expect(indexCss).toContain("font-family: 'Plus Jakarta Sans', system-ui, sans-serif;");
    expect(tailwindConfig).toContain('heading: [\'"Plus Jakarta Sans"\', \'system-ui\', \'sans-serif\']');
    expect(tailwindConfig).toContain("body: ['Inter', 'system-ui', 'sans-serif']");
  });
});
