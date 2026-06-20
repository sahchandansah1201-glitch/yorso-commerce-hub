import { expect, test, type Page } from "@playwright/test";
import { installBuyerSession } from "./helpers/buyer-session";

const OUT = "test-results/p1q-products-table-actions-density";

const openProducts = async (page: Page) => {
  await installBuyerSession(page, { id: "b_p1q_products_actions", lang: "ru" });
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

test.describe("P1Q /account/products table action density", () => {
  test("desktop table prioritizes product state role and volume over actions", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await openProducts(page);

    const table = page.getByTestId("account-products-table");
    const firstRow = page.getByTestId("account-product-row-p_1");
    await expect(table).toBeVisible();
    await expect(firstRow).toContainText("Gadus morhua");
    await expect(firstRow).toContainText("Мороженый");
    await expect(firstRow).toContainText("Продажа");
    await expect(firstRow).toContainText("120 t");

    await expect(table).not.toContainText("Редактировать");
    await expect(table).not.toContainText("Детали");

    const openButton = page.getByTestId("account-product-open-p_1");
    const editButton = page.getByTestId("account-product-edit-p_1");
    const deleteButton = page.getByTestId("account-product-delete-p_1");

    await expect(openButton).toHaveAttribute("aria-label", /Детал|Скрыть/);
    await expect(editButton).toHaveAttribute("aria-label", /Редактировать/);
    await expect(deleteButton).toHaveAttribute("aria-label", /Удалить/);

    for (const button of [openButton, editButton, deleteButton]) {
      const box = await button.boundingBox();
      expect(box?.width, "desktop action button stays compact").toBeLessThanOrEqual(44);
      expect(box?.height, "desktop action button stays compact").toBeLessThanOrEqual(44);
      expect(box?.width, "desktop action button remains easy to target").toBeGreaterThanOrEqual(32);
      expect(box?.height, "desktop action button remains easy to target").toBeGreaterThanOrEqual(32);
    }

    await openButton.click();
    await expect(table.getByTestId("account-product-detail-p_1")).toBeVisible();
    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/desktop-actions-density.png`, fullPage: true });
  });
});
