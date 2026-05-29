/**
 * E2E · /offers/:id · offer detail runtime approval contract.
 *
 * Batch #58 browser-level guard:
 * - registered buyers can request price access without supplier identity or
 *   exact price leakage in page body/head;
 * - matching supplier approval shows the refresh banner and unlocks exact
 *   commercial data for the current offer;
 * - unrelated approval events do not unlock the current offer;
 * - unknown offer ids render the not-found route without stale offer data.
 */
import { expect, test, type Page } from "@playwright/test";

const OFFER_PATH = "/offers/00000000-0000-0000-0000-000000000001";
const UNKNOWN_OFFER_PATH = "/offers/00000000-0000-0000-0000-000000009999";
const PRODUCT_NAME = "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade";
const SUPPLIER_NAME = "Nordic Seafood AS";
const SUPPLIER_ID = "nordic-seafood";
const OTHER_SUPPLIER_ID = "pacifico-export";
const ACCESS_STORAGE_KEY = "yorso_supplier_access_requests";
const ACCESS_CHANGE_EVENT = "yorso:supplier-access-change";
const EXACT_PRICE_PATTERN = /\$(8\.50|8\.70|8\.85|8\.90|9\.00|9\.10|9\.20|9\.30|9\.80|10\.00)/;

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
          id: "b_e2e_offer_detail_runtime",
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

const gotoRegisteredOffer = async (page: Page) => {
  await installRegisteredStorage(page);
  await page.goto(OFFER_PATH, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
};

const bodyText = async (page: Page) => (await page.locator("body").textContent()) ?? "";

const headText = async (page: Page) =>
  page.evaluate(() => `${document.title}\n${document.head.innerHTML}`);

const assertNoRestrictedOfferValues = async (page: Page) => {
  const text = await bodyText(page);
  const head = await headText(page);
  for (const source of [text, head]) {
    expect(source).not.toContain(SUPPLIER_NAME);
    expect(source).not.toContain(SUPPLIER_ID);
    expect(source).not.toMatch(EXACT_PRICE_PATTERN);
  }
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

test.describe("/offers/:id · runtime approval contract", () => {
  test("registered buyer submits one-click access request without supplier or exact price leakage", async ({ page }) => {
    await gotoRegisteredOffer(page);

    await assertNoRestrictedOfferValues(page);
    await page.getByTestId("supplier-request-price-access").click();

    const status = page.getByTestId("supplier-access-request-status");
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute("data-status", /sent|pending/);
    await expect(status).toContainText("Verified supplier");
    await assertNoRestrictedOfferValues(page);

    const storedStatus = await page.evaluate(
      ({ key, supplierId }) => {
        const parsed = JSON.parse(window.localStorage.getItem(key) || "{}");
        return parsed[supplierId]?.status ?? null;
      },
      { key: ACCESS_STORAGE_KEY, supplierId: SUPPLIER_ID },
    );
    expect(["sent", "pending"]).toContain(storedStatus);
  });

  test("matching approval event shows refresh banner and unlocks current offer detail", async ({ page }) => {
    await gotoRegisteredOffer(page);
    await dispatchApprovedAccess(page, SUPPLIER_ID);

    await expect(page.getByTestId("supplier-access-refresh-banner")).toBeVisible();
    await page.getByTestId("supplier-access-refresh-now").click();

    const text = await bodyText(page);
    expect(text).toContain(SUPPLIER_NAME);
    expect(text).toMatch(EXACT_PRICE_PATTERN);
    await expect(page.getByRole("button", { name: /Contact Supplier/i })).toBeVisible();
    await expect(page.getByTestId("supplier-request-price-access")).toHaveCount(0);
  });

  test("approval event for another supplier does not unlock the current offer", async ({ page }) => {
    await gotoRegisteredOffer(page);
    await dispatchApprovedAccess(page, OTHER_SUPPLIER_ID);

    await expect(page.getByTestId("supplier-access-refresh-banner")).toHaveCount(0);
    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
    await assertNoRestrictedOfferValues(page);
  });

  test("unknown offer renders not found without stale offer or supplier data", async ({ page }) => {
    await gotoRegisteredOffer(page);
    await page.goto(UNKNOWN_OFFER_PATH, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /offer not found/i })).toBeVisible();
    const text = await bodyText(page);
    const head = await headText(page);
    for (const source of [text, head]) {
      expect(source).not.toContain(PRODUCT_NAME);
      expect(source).not.toContain(SUPPLIER_NAME);
      expect(source).not.toMatch(EXACT_PRICE_PATTERN);
    }
  });
});
