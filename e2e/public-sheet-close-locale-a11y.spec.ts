/**
 * E2E · public catalog sheet close-control localization.
 *
 * Contract:
 * - public catalog drawers expose localized programmatic close names;
 * - RU/ES catalog sheet state does not leak the default English "Close";
 * - compare drawer behavior, access gating and layout stability remain intact.
 */
import { expect, test, type Page } from "@playwright/test";
import type { E2ELang } from "./helpers/buyer-session";

const labels: Record<Exclude<E2ELang, "en">, { close: string }> = {
  ru: { close: "Закрыть" },
  es: { close: "Cerrar" },
};

const installAnonymousCatalogSession = async (page: Page, lang: E2ELang) => {
  await page.addInitScript((language) => {
    try {
      window.localStorage.setItem("yorso-lang", language);
      window.sessionStorage.removeItem("yorso_buyer_session");
      window.sessionStorage.removeItem("yorso_buyer_qualification");
      window.sessionStorage.removeItem("yorso_buyer_qualified");
    } catch {
      /* ignore */
    }
  }, lang);
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
  );
  expect(overflow).toBe(0);
};

const expectNoNestedInteractiveControls = async (page: Page) => {
  await expect(page.locator("a button, button a, a a, button button")).toHaveCount(0);
};

test.describe("public catalog sheet close-control localization", () => {
  for (const lang of ["ru", "es"] as const) {
    test(`${lang} compare drawer uses localized close name`, async ({ page }) => {
      await installAnonymousCatalogSession(page, lang);
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.goto("/offers", { waitUntil: "domcontentloaded" });

      await expect(page.getByTestId("catalog-result-count")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("catalog-selected-panel")).toBeVisible();

      await page.getByTestId("catalog-panel-compare-toggle").click();

      const visibleRows = page.locator('[data-testid="catalog-offer-row"]:visible');
      await visibleRows.nth(1).dispatchEvent("click");
      await expect(visibleRows.nth(1)).toHaveAttribute("data-selected", "true");

      await page.getByTestId("catalog-panel-compare-toggle").click();
      await expect(page.getByTestId("catalog-compare-open")).toBeEnabled();

      await page.getByTestId("catalog-compare-open").click();

      await expect(page.getByRole("button", { name: labels[lang].close, exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: /^Close$/ })).toHaveCount(0);
      await expect(page.getByTestId("catalog-row-price-block").first()).toHaveAttribute(
        "data-access-level",
        "anonymous_locked",
      );
      await expectNoNestedInteractiveControls(page);
      await expectNoHorizontalOverflow(page);
    });
  }
});
