/**
 * E2E · public breadcrumb locale/a11y labels.
 *
 * Guards public buyer-facing routes against English breadcrumb landmark names
 * leaking into localized navigation.
 */
import { expect, test, type Page } from "@playwright/test";

const PUBLIC_BREADCRUMB_ROUTES = [
  { path: "/suppliers", readyTestId: "supplier-directory-search" },
  { path: "/blog", readyTestId: "blog-list" },
  {
    path: "/blog/atlantic-salmon-q1-price-pressure",
    readyTestId: "blog-article",
  },
] as const;

const installRussianSession = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("yorso-lang", "ru");
      window.sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
};

const visibleNavigationLabels = async (page: Page) =>
  page.locator("nav, [role='navigation']").evaluateAll((nodes) => {
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
      .map((element) => element.getAttribute("aria-label")?.trim() || labelledByText(element))
      .filter(Boolean);
  });

test.describe("public breadcrumbs · localized a11y labels", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const route of PUBLIC_BREADCRUMB_ROUTES) {
    test(`${route.path} exposes a localized breadcrumb navigation name`, async ({ page }) => {
      await installRussianSession(page);
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId(route.readyTestId)).toBeVisible({ timeout: 15_000 });

      await expect(page.getByRole("navigation", { name: "Хлебные крошки" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveCount(0);
      expect(await visibleNavigationLabels(page)).not.toContain("Breadcrumb");
      await expectNoHorizontalOverflow(page);
    });
  }
});
