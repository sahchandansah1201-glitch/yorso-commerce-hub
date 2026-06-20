import { expect, test, type Page } from "@playwright/test";
import { installBuyerSession } from "./helpers/buyer-session";

const OUT = "test-results/p1o-products-read-scanability";

const openProducts = async (page: Page, lang: "en" | "ru" | "es" = "en") => {
  await installBuyerSession(page, { id: "b_p1o_products_verify", lang });
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

test.describe("P1O/P1P /account/products read-view scanability", () => {
  test("desktop table shows core columns only; details hide certs/targets/category", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await openProducts(page);

    const table = page.getByTestId("account-products-table");
    await expect(table).toBeVisible();

    // P1P: cert/target columns gone
    await expect(page.getByTestId("account-product-targets-p_1")).toHaveCount(0);
    await expect(page.getByTestId("account-product-certs-p_1")).toHaveCount(0);
    const tableText = (await table.textContent()) ?? "";
    expect(tableText.toLowerCase()).not.toContain("certif");
    expect(tableText.toLowerCase()).not.toContain("target");

    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/desktop-products-table.png`, fullPage: true });

    await page.getByTestId("account-product-open-p_1").click();
    const detail = page.getByTestId("account-product-detail-p_1");
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("Gadus morhua");
    await expect(detail).toContainText("Atlantic Cod H&G");
    await expect(detail).toContainText("H&G, IQF, 1-2 / 2-4 kg");
    const detailText = (await detail.textContent()) ?? "";
    expect(detailText.toLowerCase()).not.toContain("certif");
    expect(detailText.toLowerCase()).not.toContain("target");
    expect(detailText.toLowerCase()).not.toContain("categor");
    expect(detailText).not.toContain("Spain, Portugal");

    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/desktop-product-details.png`, fullPage: true });
  });

  test("mobile 390 cards hide certifications and target countries", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProducts(page);

    const cards = page.getByTestId("account-products-mobile-cards");
    await expect(cards).toBeVisible();

    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/mobile-390-products-list.png`, fullPage: true });

    const cardP1 = page.getByTestId("account-product-mobile-card-p_1");
    await expect(cardP1).toBeVisible();
    await expect(page.getByTestId("account-product-mobile-targets-p_1")).toHaveCount(0);
    await expect(page.getByTestId("account-product-mobile-certs-p_1")).toHaveCount(0);
    const cardText = (await cardP1.textContent()) ?? "";
    expect(cardText.toLowerCase()).not.toContain("certif");
    expect(cardText.toLowerCase()).not.toContain("target");

    await cardP1.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${OUT}/mobile-390-product-card.png`, fullPage: false });

    await page.getByTestId("account-product-mobile-open-p_1").click();
    const detail = page.getByTestId("account-product-detail-p_1");
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("H&G, IQF, 1-2 / 2-4 kg");

    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/mobile-390-product-details.png`, fullPage: true });
  });

  test("RU locale: 'Мороженый' shown, no raw enum strings", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await openProducts(page, "ru");

    const table = page.getByTestId("account-products-table");
    await expect(table).toContainText("Мороженый");
    const tableText = (await table.textContent()) ?? "";
    expect(tableText).not.toMatch(/\bfrozen\b|\bselling\b|\bbuying\b/);
    expect(tableText).not.toContain("Сертификации");
    expect(tableText).not.toContain("Целевые");
  });

  test("Add/Edit form contract preserved: no manual identity / certs / targets inputs", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await openProducts(page);

    // Add mode
    await page.getByTestId("account-product-add").click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByTestId("account-product-commercial-name")).toHaveCount(0);
    await expect(page.getByTestId("account-product-latin-name")).toHaveCount(0);
    await expect(page.getByTestId("account-product-category")).toHaveCount(0);
    await expect(page.getByTestId("account-product-certificates")).toHaveCount(0);
    await expect(page.getByTestId("account-product-target-countries")).toHaveCount(0);
    await expect(page.getByTestId("account-product-optional-details")).toHaveCount(0);
    await page.getByTestId("account-product-cancel").click();

    // Edit mode
    await page.locator('[data-testid^="account-product-edit-"]').first().click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByTestId("account-product-commercial-name")).toHaveCount(0);
    await expect(page.getByTestId("account-product-latin-name")).toHaveCount(0);
    await expect(page.getByTestId("account-product-category")).toHaveCount(0);
    await expect(page.getByTestId("account-product-certificates")).toHaveCount(0);
    await expect(page.getByTestId("account-product-target-countries")).toHaveCount(0);
    await expect(page.getByTestId("account-product-optional-details")).toHaveCount(0);
  });
});
