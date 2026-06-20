import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { installBuyerSession } from "./helpers/buyer-session";

const OUT = "test-results/p1r-products-picker-single-field";

const openProducts = async (page: Page, viewport: { width: number; height: number }) => {
  await page.setViewportSize(viewport);
  await installBuyerSession(page, { id: `b_p1r_${viewport.width}` });
  await page.addInitScript(() => {
    try {
      window.localStorage.removeItem("yorso_account_profile_v1");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/account/products", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-section-products")).toBeVisible({ timeout: 15_000 });
};

const programmaticChecks = async (page: Page) => {
  const overflow = await page.evaluate(
    () => document.body.scrollWidth <= document.documentElement.clientWidth,
  );
  const nested = await page.evaluate(
    () => document.querySelectorAll("a button, button a, a a, button button").length,
  );
  expect(overflow, "no horizontal overflow").toBe(true);
  expect(nested, "no nested interactive controls").toBe(0);
};

const selectFromCatalog = async (page: Page, latin: string) => {
  await page.getByTestId("account-product-catalog-search").fill(latin);
  await page
    .locator('[data-testid^="account-product-catalog-option-"]')
    .filter({ hasText: latin })
    .first()
    .click();
};

test.beforeAll(() => {
  mkdirSync(OUT, { recursive: true });
});

test.describe("P1R /account/products single-field catalog picker", () => {
  test("desktop edit lets a user clear the current product and select another one", async ({
    page,
  }) => {
    await openProducts(page, { width: 1366, height: 900 });

    await page.getByTestId("account-product-edit-p_2").click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByTestId("account-product-catalog-search")).toHaveValue(
      "Gadus chalcogrammus (Alaska Pollock Fillet)",
    );
    await expect(page.getByTestId("account-product-selected-summary")).toBeVisible();
    await expect(page.getByTestId("account-product-selected-latin")).toHaveCount(0);
    await expect(page.getByTestId("account-product-selected-commercial")).toHaveCount(0);
    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/desktop-edit-prefilled.png`, fullPage: true });

    await page.getByTestId("account-product-catalog-clear").click();
    await expect(page.getByTestId("account-product-catalog-search")).toHaveValue("");
    await expect(page.getByTestId("account-product-selected-summary")).toHaveCount(0);

    await page.getByTestId("account-product-save").click();
    await expect(page.getByTestId("account-product-catalog-error")).toBeVisible();

    await selectFromCatalog(page, "Scomber scombrus");
    await expect(page.getByTestId("account-product-catalog-search")).toHaveValue(
      "Scomber scombrus (Atlantic mackerel)",
    );
    await page.getByTestId("account-product-save").click();

    const replacedRow = page.getByTestId("account-product-row-p_2");
    await expect(replacedRow).toContainText("Scomber scombrus");
    await expect(replacedRow).toContainText("Atlantic mackerel");
    await expect(replacedRow).toContainText("80 t");
    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/desktop-edit-replaced.png`, fullPage: true });
  });

  test("mobile edit pre-fills the same field and exposes a clear target", async ({ page }) => {
    await openProducts(page, { width: 390, height: 844 });

    await page.getByTestId("account-product-mobile-edit-p_2").click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByTestId("account-product-catalog-search")).toHaveValue(
      "Gadus chalcogrammus (Alaska Pollock Fillet)",
    );
    const clearButton = page.getByTestId("account-product-catalog-clear");
    await expect(clearButton).toBeVisible();
    const box = await clearButton.boundingBox();
    expect(box?.width, "clear selected product touch width").toBeGreaterThanOrEqual(44);
    expect(box?.height, "clear selected product touch height").toBeGreaterThanOrEqual(44);
    await expect(page.getByTestId("account-product-selected-latin")).toHaveCount(0);
    await expect(page.getByTestId("account-product-selected-commercial")).toHaveCount(0);
    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/mobile-390-edit-prefilled.png`, fullPage: true });
  });
});
