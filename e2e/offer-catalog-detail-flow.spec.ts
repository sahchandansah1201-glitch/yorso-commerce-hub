/**
 * E2E · /offers -> /offers/:id -> /offers · catalog/detail access bridge.
 *
 * Batch #59 browser-level guard:
 * - registered catalog rows stay locked before supplier approval;
 * - detail one-click access approval unlocks only the matching supplier;
 * - returning to catalog preserves URL state and refreshes the approved row;
 * - unrelated approvals do not unlock current catalog/detail state.
 */
import { expect, test, type Page } from "@playwright/test";

const CATALOG_PATH = "/offers?q=salmon&category=Salmon&sort=origin&dir=asc&rows=20";
const PRODUCT_NAME = "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade";
const SUPPLIER_NAME = "Nordic Seafood AS";
const SUPPLIER_ID = "nordic-seafood";
const OTHER_SUPPLIER_ID = "pacifico-export";
const ACCESS_STORAGE_KEY = "yorso_supplier_access_requests";
const ACCESS_CHANGE_EVENT = "yorso:supplier-access-change";
const EXACT_PRICE_PATTERN = /\$(8\.50|8\.70|8\.90|9\.00|9\.10|9\.20|9\.30|9\.80|10\.00)/;

const installRegisteredStorage = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("yorso-lang", "en");
      window.localStorage.removeItem("yorso_supplier_access_requests");
      window.localStorage.removeItem("yorso_supplier_access_notifications");
      window.localStorage.removeItem("yorso_backend_access_notifications_seen");
      window.sessionStorage.removeItem("yorso_supplier_access_requests");
      window.sessionStorage.removeItem("yorso_buyer_qualification");
      window.sessionStorage.removeItem("yorso_buyer_qualified");
      window.sessionStorage.setItem(
        "yorso_buyer_session",
        JSON.stringify({
          id: "b_e2e_offer_catalog_detail_flow",
          identifier: "buyer@example.com",
          method: "email",
          signedInAt: new Date().toISOString(),
          displayName: "buyer",
        }),
      );
    } catch {
      /* ignore */
    }
  });
};

const gotoRegisteredCatalog = async (page: Page, path = CATALOG_PATH) => {
  await installRegisteredStorage(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("catalog-result-count")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("offer-catalog-sort")).toHaveValue("origin");
  await expect(page.getByTestId("offer-catalog-page-size")).toHaveValue("20");
};

const bodyText = async (page: Page) => (await page.locator("body").textContent()) ?? "";

const salmonRow = (page: Page) =>
  page.locator('[data-testid="catalog-offer-row"][data-offer-id="1"]:visible');

const assertNoRestrictedValues = async (page: Page) => {
  const text = await bodyText(page);
  expect(text).not.toContain(SUPPLIER_NAME);
  expect(text).not.toContain(SUPPLIER_ID);
  expect(text).not.toMatch(EXACT_PRICE_PATTERN);
};

const dispatchApprovedAccess = async (page: Page, supplierId: string) => {
  await page.evaluate(
    ({ key, eventName, supplierId }) => {
      const now = new Date().toISOString();
      const request = {
        supplierId,
        intent: "exact_price",
        status: "approved",
        sentAt: now,
        pendingAt: now,
        approvedAt: now,
        reasons: ["exact_price"],
        message: "",
      };
      const store = { [supplierId]: request };
      window.localStorage.setItem(key, JSON.stringify(store));
      window.sessionStorage.setItem(key, JSON.stringify(store));
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: {
            supplierId,
            status: "approved",
            source: "mock_progression",
            changedAt: now,
            intent: "exact_price",
          },
        }),
      );
    },
    { key: ACCESS_STORAGE_KEY, eventName: ACCESS_CHANGE_EVENT, supplierId },
  );
};

test.describe("/offers -> /offers/:id · supplier approval bridge", () => {
  test("approval on detail unlocks the matching catalog row after return", async ({ page }) => {
    await gotoRegisteredCatalog(page);

    await expect(salmonRow(page)).toBeVisible();
    await expect(salmonRow(page).getByTestId("catalog-row-price-block")).toHaveAttribute(
      "data-access-level",
      "registered_locked",
    );
    await assertNoRestrictedValues(page);

    await salmonRow(page).getByTestId("catalog-row-view-details").click();
    await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible();
    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
    await assertNoRestrictedValues(page);

    await page.getByTestId("supplier-request-price-access").click();
    await expect(page.getByTestId("supplier-access-request-status")).toBeVisible();

    await dispatchApprovedAccess(page, SUPPLIER_ID);
    await expect(page.getByTestId("supplier-access-refresh-banner")).toBeVisible();
    await page.getByTestId("supplier-access-refresh-now").click();

    await expect(page.locator("body")).toContainText(SUPPLIER_NAME);
    expect(await bodyText(page)).toMatch(EXACT_PRICE_PATTERN);

    await page.getByTestId("offer-detail-back-to-catalog").click();
    await expect(page).toHaveURL(/\/offers/);
    await expect(page).toHaveURL(/q=salmon/);
    await expect(page).toHaveURL(/category=Salmon/);
    await expect(page).toHaveURL(/sort=origin/);
    await expect(page).toHaveURL(/rows=20/);

    await expect(salmonRow(page)).toBeVisible();
    await expect(salmonRow(page).getByTestId("catalog-row-price-block")).toHaveAttribute(
      "data-access-level",
      "qualified_unlocked",
    );
    await expect(salmonRow(page).getByTestId("catalog-row-supplier-name")).toContainText(SUPPLIER_NAME);
    await expect(salmonRow(page).getByTestId("catalog-row-price")).toContainText("USD");
  });

  test("unrelated approval does not unlock the catalog/detail flow", async ({ page }) => {
    await gotoRegisteredCatalog(page);
    await dispatchApprovedAccess(page, OTHER_SUPPLIER_ID);

    await expect(salmonRow(page).getByTestId("catalog-row-price-block")).toHaveAttribute(
      "data-access-level",
      "registered_locked",
    );
    await assertNoRestrictedValues(page);

    await salmonRow(page).getByTestId("catalog-row-view-details").click();
    await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible();
    await expect(page.getByTestId("supplier-access-refresh-banner")).toHaveCount(0);
    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
    await assertNoRestrictedValues(page);
  });
});
