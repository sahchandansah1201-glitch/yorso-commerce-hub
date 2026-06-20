import { expect, test, type Page } from "@playwright/test";
import { installBuyerSession } from "./helpers/buyer-session";

const OUT = "test-results/p1p-products-remove-extra-fields";

const openProducts = async (page: Page, lang: "en" | "ru" | "es" = "en") => {
  await installBuyerSession(page, { id: "b_p1p_products_verify", lang });
  await page.goto("/account/products", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-section-products")).toBeVisible({ timeout: 15_000 });
};

test.describe("P1P /account/products screenshots", () => {
  test("desktop table + add form", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await openProducts(page);
    await page.screenshot({ path: `${OUT}/desktop-table.png`, fullPage: true });

    await page.getByTestId("account-product-add").click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await page.screenshot({ path: `${OUT}/desktop-add-form.png`, fullPage: true });
  });

  test("mobile 390 list + add form + details", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProducts(page);
    await page.screenshot({ path: `${OUT}/mobile-390-list.png`, fullPage: true });

    await page.getByTestId("account-product-add").click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await page.screenshot({ path: `${OUT}/mobile-390-add-form.png`, fullPage: true });
    await page.getByTestId("account-product-cancel").click();

    await page.getByTestId("account-product-mobile-open-p_1").click();
    await expect(page.getByTestId("account-product-detail-p_1")).toBeVisible();
    await page.screenshot({ path: `${OUT}/mobile-390-details.png`, fullPage: true });
  });
});
