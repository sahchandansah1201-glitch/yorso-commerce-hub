/**
 * E2E · /suppliers -> /suppliers/:id -> /suppliers · directory/profile access bridge.
 *
 * Batch #60 browser-level guard:
 * - registered supplier directory rows stay locked before supplier approval;
 * - profile one-click access approval unlocks only the matching supplier;
 * - returning to directory preserves URL state and refreshes the approved row;
 * - unrelated approvals do not unlock current directory/profile state.
 */
import { expect, test, type Page } from "@playwright/test";

const DIRECTORY_PATH = "/suppliers?q=salmon&filter=salmon&sort=country&dir=asc&rows=20";
const SUPPLIER_ID = "sup-no-001";
const OTHER_SUPPLIER_ID = "sup-cn-002";
const COMPANY_NAME = "Nordfjord Sjømat AS";
const MASKED_NAME = "Norwegian salmon producer · NO-114";
const WEBSITE_HOST = "example-nordfjord.no";
const WHATSAPP_DIGITS = "475550114";
const ACTIVE_OFFERS_PATTERN = /14\s*active\s*offers/i;
const ACCESS_STORAGE_KEY = "yorso_supplier_access_requests";
const ACCESS_CHANGE_EVENT = "yorso:supplier-access-change";

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
          id: "b_e2e_supplier_directory_profile_flow",
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

const gotoRegisteredDirectory = async (page: Page, path = DIRECTORY_PATH) => {
  await installRegisteredStorage(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("supplier-directory-search")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("supplier-directory-sort")).toHaveValue("country");
  await expect(page.getByTestId("supplier-directory-page-size")).toHaveValue("20");
};

const bodyText = async (page: Page) => (await page.locator("body").textContent()) ?? "";

const nordfjordRow = (page: Page) =>
  page
    .getByTestId("supplier-row")
    .filter({ has: page.locator(`a[href="/suppliers/${SUPPLIER_ID}"]`) })
    .first();

const assertNoRestrictedSupplierValues = async (page: Page) => {
  const text = await bodyText(page);
  expect(text).not.toContain(COMPANY_NAME);
  expect(text).not.toContain(WEBSITE_HOST);
  expect(text).not.toContain(WHATSAPP_DIGITS);
  expect(text).not.toMatch(ACTIVE_OFFERS_PATTERN);
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

test.describe("/suppliers -> /suppliers/:id · supplier approval bridge", () => {
  test("approval on profile unlocks the matching directory row after return", async ({ page }) => {
    await gotoRegisteredDirectory(page);

    await expect(nordfjordRow(page)).toBeVisible();
    await expect(nordfjordRow(page)).toContainText(MASKED_NAME);
    await assertNoRestrictedSupplierValues(page);

    await nordfjordRow(page).getByTestId("supplier-row-title-link").click();
    await expect(page).toHaveURL(new RegExp(`/suppliers/${SUPPLIER_ID}`));
    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
    await assertNoRestrictedSupplierValues(page);

    await page.getByTestId("supplier-request-price-access").click();
    await expect(page.getByTestId("supplier-access-request-status")).toBeVisible();

    await dispatchApprovedAccess(page, SUPPLIER_ID);
    await expect(page.getByTestId("supplier-access-refresh-banner")).toBeVisible();
    await page.getByTestId("supplier-access-refresh-now").click();

    await expect(page.getByTestId("supplier-display-name").first()).toContainText(COMPANY_NAME);
    await expect(page.getByTestId("supplier-cta-block")).toContainText("SEND MESSAGE");
    expect(await bodyText(page)).toMatch(ACTIVE_OFFERS_PATTERN);

    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/suppliers/);
    await expect(page).toHaveURL(/q=salmon/);
    await expect(page).toHaveURL(/filter=salmon/);
    await expect(page).toHaveURL(/sort=country/);
    await expect(page).toHaveURL(/rows=20/);

    await expect(nordfjordRow(page)).toBeVisible();
    await expect(nordfjordRow(page)).toContainText(COMPANY_NAME);
    await expect(nordfjordRow(page)).toContainText(ACTIVE_OFFERS_PATTERN);
  });

  test("unrelated approval does not unlock the directory/profile flow", async ({ page }) => {
    await gotoRegisteredDirectory(page);
    await dispatchApprovedAccess(page, OTHER_SUPPLIER_ID);

    await expect(nordfjordRow(page)).toBeVisible();
    await expect(nordfjordRow(page)).toContainText(MASKED_NAME);
    await assertNoRestrictedSupplierValues(page);

    await nordfjordRow(page).getByTestId("supplier-row-title-link").click();
    await expect(page.getByTestId("supplier-access-refresh-banner")).toHaveCount(0);
    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
    await expect(page.getByTestId("supplier-display-name").first()).toContainText(MASKED_NAME);
    await assertNoRestrictedSupplierValues(page);
  });
});
