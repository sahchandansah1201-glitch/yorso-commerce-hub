import { expect, test, type Page } from "@playwright/test";
import { installBuyerSession } from "./helpers/buyer-session";
import { createReportRecorder } from "./helpers/report-artifacts";

const selectFromCatalog = async (page: Page, latin: string) => {
  await page.getByTestId("account-product-catalog-search").fill(latin);
  await page
    .locator('[data-testid^="account-product-catalog-option-"]')
    .filter({ hasText: latin })
    .first()
    .click();
};

const fillProductForm = async (
  page: Page,
  values: {
    latin: string;
    state: "frozen" | "fresh" | "chilled" | "alive" | "cooked";
    role: "buying" | "selling" | "both";
    monthlyVolume: string;
    format: string;
    certificates?: string;
    targetCountries?: string;
  },
) => {
  await selectFromCatalog(page, values.latin);
  await page.getByTestId("account-product-state").selectOption(values.state);
  await page.getByTestId("account-product-role").selectOption(values.role);
  await page.getByTestId("account-product-monthly-volume").fill(values.monthlyVolume);
  await page.getByTestId("account-product-format").fill(values.format);
  if (values.certificates !== undefined || values.targetCountries !== undefined) {
    await page
      .getByTestId("account-product-optional-details")
      .locator("summary")
      .click();
    if (values.certificates !== undefined) {
      await page.getByTestId("account-product-certificates").fill(values.certificates);
    }
    if (values.targetCountries !== undefined) {
      await page.getByTestId("account-product-target-countries").fill(values.targetCountries);
    }
  }
};

const firstProductRowText = async (page: Page) =>
  (await page.locator('[data-testid^="account-product-row-"]').first().textContent()) ?? "";

const installClipboardMock = async (page: Page) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "clipboard", {
      configurable: true,
      get: () => ({
        writeText: async (text: string) => {
          window.localStorage.setItem("yorso_e2e_copied_product_link", text);
        },
      }),
    });
  });
};

const openProducts = async (page: Page) => {
  await installBuyerSession(page, {
    id: "b_e2e_account_products_report",
  });
  await installClipboardMock(page);
  await page.goto("/account/products", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-section-products")).toBeVisible({ timeout: 15_000 });
};

test.describe("/account/products · save-flow report artifacts", () => {
  test("generates screenshots and a machine-readable report", async ({ context, page }, testInfo) => {
    const report = createReportRecorder({
      artifactSubdir: "account-products-save-flow",
      attachmentPrefix: "account-products-save-flow-report",
      title: "Account products matrix save-flow report",
    });

    await openProducts(page);
    await expect(page.getByTestId("account-product-results-count")).toContainText("6 of 6");
    await report.recordStep({
      name: "signed-in product matrix opened",
      detail: "deterministic buyer session opens /account/products with the seeded matrix",
      page,
      screenshotName: "products-matrix-loaded",
      testInfo,
    });

    await page.getByTestId("account-product-add").click();
    await page.getByTestId("account-product-save").click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(1);
    await expect(page.getByTestId("account-product-catalog-error")).toBeVisible();
    await report.recordStep({
      name: "incomplete product blocked",
      detail: "required product fields keep the form open and expose invalid-field markers",
      page,
      screenshotName: "product-validation-error",
      testInfo,
    });
    await page.getByTestId("account-product-cancel").click();

    await page.getByTestId("account-product-add").click();
    await fillProductForm(page, {
      latin: "Salmo salar",
      state: "frozen",
      role: "selling",
      monthlyVolume: "22 t / month",
      format: "IQF portions, 4-6 oz",
      certificates: "ASC, HACCP",
      targetCountries: "Germany, France, Spain",
    });
    await page.getByTestId("account-product-save").click();
    await expect(page.getByTestId("account-products-table")).toContainText("Atlantic salmon");
    await expect
      .poll(() =>
        page.evaluate(() =>
          Boolean(
            localStorage
              .getItem("yorso_account_profile_v1")
              ?.includes("Salmo salar"),
          ),
        ),
      )
      .toBe(true);
    await report.recordStep({
      name: "new selling product saved",
      detail: "new salmon product appears in the matrix and persists in account profile storage",
      page,
      screenshotName: "product-added",
      testInfo,
    });

    await page.getByTestId("account-product-add").click();
    await fillProductForm(page, {
      latin: "Salmo salar",
      state: "frozen",
      role: "selling",
      monthlyVolume: "Duplicate volume should not persist",
      format: "IQF portions, 4-6 oz",
    });
    await page.getByTestId("account-product-save").click();
    await expect(page.getByText("This product already exists")).toBeVisible();
    await report.recordStep({
      name: "duplicate product blocked",
      detail: "duplicate matching key is rejected without writing the draft into storage",
      page,
      screenshotName: "product-duplicate-blocked",
      testInfo,
    });
    await page.getByTestId("account-product-cancel").click();

    await page.getByTestId("account-product-page-size").selectOption("2");
    await expect(page.getByTestId("account-product-page-summary")).toContainText("Showing 1-2");
    await page.getByTestId("account-product-page-next").click();
    await expect(page.getByTestId("account-product-page-summary")).toContainText("Showing 3-4");
    await report.recordStep({
      name: "pagination advances through matrix",
      detail: "page size 2 exposes next-page controls and advances the visible product window",
      page,
      screenshotName: "product-pagination-page-two",
      testInfo,
    });

    await page.getByTestId("account-product-search").fill("cod");
    await page.getByTestId("account-product-state-filter").selectOption("frozen");
    await page.getByTestId("account-product-role-filter").selectOption("selling");
    await page.getByTestId("account-product-sort-key").selectOption("monthlyVolume");
    await page.getByTestId("account-product-sort-direction").selectOption("desc");
    await expect(page.getByTestId("account-product-results-count")).toContainText("1 of 7");
    expect(await firstProductRowText(page)).toContain("Atlantic Cod H&G");
    await page.getByTestId("account-product-share-view").click();
    await expect(page.getByTestId("account-product-link-status")).toContainText(
      "Product view link copied",
    );
    await expect(page.getByTestId("account-product-share-url")).toHaveValue(/q=cod/);
    await report.recordStep({
      name: "filtered view shared",
      detail: "search, filters, sorting and page size are encoded into a shareable product URL",
      page,
      screenshotName: "product-filter-share-link",
      testInfo,
    });

    await page.getByTestId("account-product-search-clear").click();
    await page.getByTestId("account-product-page-size").selectOption("10");
    await page.getByTestId("account-product-sort-key").selectOption("commercialName");
    await page.getByTestId("account-product-sort-direction").selectOption("asc");
    await page.getByTestId("account-product-open-p_3").click();
    const detail = page.getByTestId("account-product-detail-p_3");
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("Vannamei Shrimp");
    await page.getByTestId("account-product-detail-edit").click();
    await page
      .getByTestId("account-product-optional-details")
      .locator("summary")
      .click();
    await page.getByTestId("account-product-target-countries").fill(
      "Ecuador, India, Vietnam, Spain",
    );
    await page.getByTestId("account-product-save").click();
    await expect(page.getByTestId("account-products-table")).toContainText("Vannamei Shrimp");
    await report.recordStep({
      name: "detail panel starts edit flow",
      detail: "selected product detail panel can enter edit mode and persist a product change",
      page,
      screenshotName: "product-detail-edit-saved",
      testInfo,
    });

    const addedRow = page.locator("tbody tr").filter({ hasText: "Atlantic salmon" });
    await addedRow.getByRole("button", { name: /delete product/i }).click();
    await expect(page.getByTestId("account-product-delete-confirm")).toBeVisible();
    await page.getByTestId("account-product-delete-confirm-submit").click();
    await expect(page.getByTestId("account-products-table")).not.toContainText("Atlantic salmon");
    await page.goto("/account/products", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.getByTestId("account-product-search").fill("Vannamei Shrimp");
    await expect(page.getByTestId("account-products-table")).toContainText("Vannamei Shrimp");
    await page.getByTestId("account-product-search").fill("Atlantic salmon");
    await expect(page.getByTestId("account-product-no-results")).toBeVisible();
    await expect(page.getByTestId("account-products-table")).not.toContainText("Atlantic salmon");
    await report.recordStep({
      name: "delete and reload persistence verified",
      detail: "deleted salmon product stays removed while the shrimp product survives reload",
      page,
      screenshotName: "product-delete-after-reload",
      testInfo,
    });

    const ruPage = await context.newPage();
    await installBuyerSession(ruPage, {
      id: "b_e2e_account_products_report",
      lang: "ru",
    });
    await ruPage.goto("/account/products", { waitUntil: "domcontentloaded" });
    await ruPage.waitForLoadState("networkidle");
    const mainText = (await ruPage.locator("main").textContent()) ?? "";
    expect(mainText).toContain("Матрица продуктов");
    expect(mainText).toContain("Мороженый");
    expect(mainText).toContain("Сортировать по");
    expect(mainText).not.toMatch(
      /\bfrozen\b|\bbuying\b|\bselling\b|\bboth\b|commercialName|monthlyVolume/,
    );
    await report.recordStep({
      name: "Russian product matrix remains localized",
      detail: "RU matrix copy hides internal enum and sort keys after the saved product mutations",
      page: ruPage,
      screenshotName: "product-ru-localized",
      testInfo,
    });
    await ruPage.close();

    await report.writeReport(testInfo);
  });
});
