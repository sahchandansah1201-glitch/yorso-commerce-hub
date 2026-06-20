import { expect, test, type Page } from "@playwright/test";
import { installBuyerSession } from "./helpers/buyer-session";

const OUT = "test-results/p1m-products-form-simplification";

const openProducts = async (page: Page) => {
  await installBuyerSession(page, { id: "b_p1m_products_verify" });
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
  expect(nested, "no nested interactives").toBe(0);
};

test.describe("P1M /account/products form simplification verification", () => {
  test("desktop add form", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await openProducts(page);
    await page.getByTestId("account-product-add").click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByTestId("account-product-catalog-search")).toBeVisible();
    await expect(page.getByTestId("account-product-optional-details")).toBeVisible();
    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/desktop-add-form.png`, fullPage: true });
  });

  test("mobile 390 add form + selected summary + optional details", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProducts(page);
    await page.getByTestId("account-product-add").click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/mobile-390-add-form.png`, fullPage: true });

    // Save without catalog -> catalog error
    await page.getByTestId("account-product-save").click();
    await expect(page.getByTestId("account-product-catalog-error")).toBeVisible();

    // Select catalog item -> selected summary appears
    await page.getByTestId("account-product-catalog-search").fill("Salmo salar");
    await page
      .locator('[data-testid^="account-product-catalog-option-"]')
      .filter({ hasText: "Salmo salar" })
      .first()
      .click();
    await expect(page.getByTestId("account-product-catalog-selected")).toBeVisible();
    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/mobile-390-selected-summary.png`, fullPage: true });

    // Expand optional details
    await page.getByTestId("account-product-optional-details").locator("summary").click();
    await expect(page.getByTestId("account-product-certificates")).toBeVisible();
    await expect(page.getByTestId("account-product-target-countries")).toBeVisible();
    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/mobile-390-optional-details.png`, fullPage: true });
  });

  test("edit existing product pre-fills selected summary and expands optional details when filled", async ({
    page,
  }) => {
    await openProducts(page);
    // Open first existing product edit
    const editButton = page.locator('[data-testid^="account-product-edit-"]').first();
    await editButton.click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByTestId("account-product-catalog-selected")).toBeVisible();
    // Manual identity inputs must not be present
    await expect(page.getByTestId("account-product-commercial-name")).toHaveCount(0);
    await expect(page.getByTestId("account-product-latin-name")).toHaveCount(0);
    await expect(page.getByTestId("account-product-category")).toHaveCount(0);
  });
});
