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

test.describe("P1O /account/products read-view scanability", () => {
  test("desktop table + details show full data; +N preview collapses extras", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await openProducts(page);

    const table = page.getByTestId("account-products-table");
    await expect(table).toBeVisible();

    // Atlantic Cod H&G (p_1) has 4 target countries → expect first 3 chips + "+1"
    const targetsPreview = page.getByTestId("account-product-targets-p_1");
    await expect(targetsPreview).toBeVisible();
    await expect(targetsPreview).toContainText("Spain");
    await expect(targetsPreview).toContainText("Portugal");
    await expect(targetsPreview).toContainText("France");
    await expect(targetsPreview).not.toContainText("Italy");
    const moreBadge = page.getByTestId("account-product-targets-p_1-more");
    await expect(moreBadge).toHaveText("+1");
    await expect(moreBadge).toHaveAttribute("title", "Italy");
    await expect(moreBadge).toHaveAttribute("aria-label", "Italy");

    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/desktop-products-table.png`, fullPage: true });

    // Open Details for p_1 — full hidden data must be visible
    await page.getByTestId("account-product-open-p_1").click();
    const detail = page.getByTestId("account-product-detail-p_1");
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("Gadus morhua");
    await expect(detail).toContainText("Atlantic Cod H&G");
    await expect(detail).toContainText("H&G, IQF, 1-2 / 2-4 kg");
    await expect(detail).toContainText("Spain, Portugal, France, Italy");
    await expect(detail).toContainText("MSC");

    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/desktop-product-details.png`, fullPage: true });
  });

  test("mobile 390 list + card + details", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProducts(page);

    const cards = page.getByTestId("account-products-mobile-cards");
    await expect(cards).toBeVisible();

    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/mobile-390-products-list.png`, fullPage: true });

    const cardP1 = page.getByTestId("account-product-mobile-card-p_1");
    await expect(cardP1).toBeVisible();
    const cardTargets = page.getByTestId("account-product-mobile-targets-p_1");
    await expect(cardTargets).toContainText("Spain");
    await expect(cardTargets).toContainText("France");
    await expect(cardTargets).not.toContainText("Italy");
    const cardMore = page.getByTestId("account-product-mobile-targets-p_1-more");
    await expect(cardMore).toHaveText("+1");
    await expect(cardMore).toHaveAttribute("aria-label", "Italy");

    await cardP1.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${OUT}/mobile-390-product-card.png`, fullPage: false });

    // Open Details from mobile card
    await page.getByTestId("account-product-mobile-open-p_1").click();
    const detail = page.getByTestId("account-product-detail-p_1");
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("Spain, Portugal, France, Italy");
    await expect(detail).toContainText("H&G, IQF, 1-2 / 2-4 kg");
    await expect(detail).toContainText("MSC");

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
  });

  test("Add/Edit form contract preserved: no manual identity inputs", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await openProducts(page);

    // Add mode
    await page.getByTestId("account-product-add").click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByTestId("account-product-commercial-name")).toHaveCount(0);
    await expect(page.getByTestId("account-product-latin-name")).toHaveCount(0);
    await expect(page.getByTestId("account-product-category")).toHaveCount(0);
    await page.getByTestId("account-product-cancel").click();

    // Edit mode
    await page.locator('[data-testid^="account-product-edit-"]').first().click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByTestId("account-product-commercial-name")).toHaveCount(0);
    await expect(page.getByTestId("account-product-latin-name")).toHaveCount(0);
    await expect(page.getByTestId("account-product-category")).toHaveCount(0);
  });
});
