import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { installBuyerSession } from "./helpers/buyer-session";

const OUT = "test-results/p1s-products-inline-profile-optional-volume";

const openProducts = async (
  page: Page,
  viewport: { width: number; height: number },
  lang: "en" | "ru" | "es" = "en",
) => {
  await page.setViewportSize(viewport);
  await installBuyerSession(page, { id: `b_p1s_${viewport.width}_${lang}`, lang });
  await page.addInitScript(() => {
    try {
      window.localStorage.removeItem("yorso_account_profile_v1");
    } catch {
      // localStorage can be unavailable in some restricted browser contexts.
    }
  });
  await page.goto("/account/products", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-section-products")).toBeVisible({ timeout: 15_000 });
};

const programmaticChecks = async (page: Page) => {
  const metrics = await page.evaluate(() => ({
    overflow: document.body.scrollWidth - document.documentElement.clientWidth,
    nested: document.querySelectorAll("a button, button a, a a, button button").length,
  }));
  expect(metrics.overflow, "no horizontal overflow").toBeLessThanOrEqual(0);
  expect(metrics.nested, "no nested interactive controls").toBe(0);
};

const selectFromCatalog = async (page: Page, latin: string) => {
  await page.getByTestId("account-product-catalog-search").fill(latin);
  await page
    .locator('[data-testid^="account-product-catalog-option-"]')
    .filter({ hasText: latin })
    .first()
    .click();
};

test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

test.describe("P1S /account/products inline profile and optional volume", () => {
  test("desktop edit keeps matching profile directly under edited row", async ({ page }) => {
    await openProducts(page, { width: 1366, height: 900 });
    await page.getByTestId("account-product-edit-p_2").click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByTestId("account-product-format")).toHaveCount(0);

    const inline = await page.evaluate(() => {
      const row = document.querySelector('[data-testid="account-product-row-p_2"]');
      return Boolean(
        row?.nextElementSibling?.querySelector('[data-testid="account-product-detail-p_2"]'),
      );
    });
    expect(inline).toBe(true);
    const desktopDetail = page
      .getByTestId("account-products-table")
      .getByTestId("account-product-detail-p_2");
    await expect(desktopDetail).toContainText("Gadus chalcogrammus");

    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/desktop-edit-inline-profile.png`, fullPage: true });
  });

  test("desktop single picker can clear current product and select another", async ({ page }) => {
    await openProducts(page, { width: 1366, height: 900 });
    await page.getByTestId("account-product-edit-p_2").click();

    const search = page.getByTestId("account-product-catalog-search");
    await expect(search).toHaveValue("Gadus chalcogrammus (Alaska Pollock Fillet)");
    await page.getByTestId("account-product-catalog-clear").click();
    await expect(search).toHaveValue("");
    await expect(page.getByTestId("account-product-selected-summary")).toHaveCount(0);

    await page.getByTestId("account-product-save").click();
    await expect(page.getByTestId("account-product-catalog-error")).toBeVisible();

    await selectFromCatalog(page, "Scomber scombrus");
    await expect(search).toHaveValue("Scomber scombrus (Atlantic mackerel)");
    await expect(page.getByTestId("account-product-catalog-error")).toHaveCount(0);

    await programmaticChecks(page);
    await page.screenshot({
      path: `${OUT}/desktop-picker-cleared-and-reselected.png`,
      fullPage: true,
    });
  });

  test("add product can save without monthly volume", async ({ page }) => {
    await openProducts(page, { width: 1366, height: 900 });
    await page.getByTestId("account-product-add").click();
    await selectFromCatalog(page, "Scomber japonicus");
    await page.getByTestId("account-product-state").selectOption("frozen");
    await page.getByTestId("account-product-role").selectOption("buying");
    await expect(page.getByTestId("account-product-monthly-volume")).toHaveValue("");
    await expect(page.getByTestId("account-product-format")).toHaveCount(0);
    await page.getByTestId("account-product-save").click();

    const row = page
      .locator('[data-testid^="account-product-row-"]')
      .filter({ hasText: "Scomber japonicus" })
      .first();
    await expect(row).toBeVisible();
    await expect(row).toContainText("Not specified");

    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/desktop-add-without-volume.png`, fullPage: true });
  });

  test("mobile details open directly under tapped card and no format field exists", async ({
    page,
  }) => {
    await openProducts(page, { width: 390, height: 844 });
    await page.getByTestId("account-product-mobile-open-p_2").click();

    const mobileCard = page.getByTestId("account-product-mobile-card-p_2");
    const mobileDetail = page
      .getByTestId("account-products-mobile-cards")
      .getByTestId("account-product-mobile-detail-p_2");
    await expect(mobileDetail).toBeVisible();
    const [cardBox, detailBox] = await Promise.all([
      mobileCard.boundingBox(),
      mobileDetail.boundingBox(),
    ]);
    expect(cardBox, "mobile product card should have a layout box").not.toBeNull();
    expect(detailBox, "mobile inline detail should have a layout box").not.toBeNull();
    expect(detailBox!.y).toBeGreaterThanOrEqual(cardBox!.y + cardBox!.height - 2);
    expect(detailBox!.y).toBeLessThanOrEqual(cardBox!.y + cardBox!.height + 24);

    await page.getByTestId("account-product-mobile-edit-p_2").click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByTestId("account-product-format")).toHaveCount(0);

    await programmaticChecks(page);
    await page.screenshot({ path: `${OUT}/mobile-390-inline-profile.png`, fullPage: true });
  });
});
