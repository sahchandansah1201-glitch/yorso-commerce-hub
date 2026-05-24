/**
 * E2E · public landmark labels.
 *
 * Contract:
 * - visible public navigation and supporting aside landmarks must have names;
 * - the header exposes separate desktop and mobile navigation labels;
 * - buyer-first content behavior stays unchanged.
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
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/cookies",
  "/gdpr",
  "/anti-fraud",
  "/careers",
  "/press",
  "/partners",
  "/blog",
  "/blog/atlantic-salmon-q1-price-pressure",
] as const;

type LandmarkIssue = {
  route: string;
  tag: string;
  role: string | null;
  html: string;
};

const visibleUnnamedLandmarks = async (page: Page, route: string): Promise<LandmarkIssue[]> =>
  page.locator("nav, aside, [role='navigation'], [role='complementary']").evaluateAll((nodes, currentRoute) => {
    const visible = (element: Element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };

    const labelledByText = (element: Element) => {
      const id = element.getAttribute("aria-labelledby");
      if (!id) return "";
      return document.getElementById(id)?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    };

    return nodes
      .filter(visible)
      .filter((element) => {
        const label = element.getAttribute("aria-label")?.trim() || labelledByText(element);
        return label.length === 0;
      })
      .map((element) => ({
        route: String(currentRoute),
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute("role"),
        html: element.outerHTML.replace(/\s+/g, " ").slice(0, 220),
      }));
  }, route);

test.describe("public landmark labels", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("yorso-lang", "en");
      window.sessionStorage.clear();
    });
  });

  for (const viewport of [
    { name: "mobile390", width: 390, height: 844 },
    { name: "desktop1024", width: 1024, height: 768 },
  ] as const) {
    test.describe(viewport.name, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const route of publicRoutes) {
        test(`${route} has no unnamed visible nav or aside landmarks`, async ({ page }) => {
          await page.goto(route, { waitUntil: "domcontentloaded" });

          await expect.poll(() => visibleUnnamedLandmarks(page, route)).toEqual([]);
        });
      }
    });
  }

  test("mobile menu exposes a named mobile navigation landmark", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Toggle menu" }).click();

    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await expect.poll(() => visibleUnnamedLandmarks(page, "/")).toEqual([]);
  });
});
