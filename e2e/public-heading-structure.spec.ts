/**
 * E2E · public heading structure.
 *
 * Contract:
 * - public routes expose a sequential heading outline;
 * - footer navigation labels do not become page headings;
 * - supplier result cards sit under a real H2 results section.
 */
import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  "/",
  "/offers",
  "/suppliers",
  "/how-it-works",
  "/for-suppliers",
  "/signin",
  "/reset-password",
] as const;

const headingOutline = async (page: Page) =>
  page.locator("h1,h2,h3,h4,h5,h6").evaluateAll((nodes) =>
    nodes.map((heading) => ({
      level: Number(heading.tagName.slice(1)),
      text: (heading.textContent ?? "").replace(/\s+/g, " ").trim(),
      id: heading.id,
    })),
  );

const expectSequentialHeadingOutline = async (page: Page) => {
  const headings = await headingOutline(page);
  const skips: string[] = [];

  for (let index = 1; index < headings.length; index += 1) {
    const previous = headings[index - 1];
    const current = headings[index];
    if (current.level > previous.level + 1) {
      skips.push(`${previous.level}->${current.level}: ${current.text}`);
    }
  }

  expect(skips).toEqual([]);
};

test.describe("public route heading structure", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("yorso-lang", "en");
      window.sessionStorage.clear();
    });
  });

  for (const route of publicRoutes) {
    test(`${route} keeps a sequential heading outline`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });

      await expectSequentialHeadingOutline(page);
      await expect(page.locator("footer h1, footer h2, footer h3, footer h4, footer h5, footer h6")).toHaveCount(0);
    });
  }

  test("/suppliers places supplier rows under a results heading", async ({ page }) => {
    await page.goto("/suppliers", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#supplier-directory-results-heading")).toHaveText("Supplier results");

    const headings = await headingOutline(page);
    const resultsIndex = headings.findIndex(
      (heading) => heading.level === 2 && heading.id === "supplier-directory-results-heading",
    );
    const firstSupplierIndex = headings.findIndex(
      (heading) => heading.level === 3 && heading.text.includes("Norwegian salmon producer"),
    );

    expect(resultsIndex).toBeGreaterThan(0);
    expect(firstSupplierIndex).toBeGreaterThan(resultsIndex);
  });
});
