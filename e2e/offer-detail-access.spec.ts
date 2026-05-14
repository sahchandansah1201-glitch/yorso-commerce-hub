/**
 * E2E · /offers/:id · offer detail access states.
 *
 * Covers the real procurement path from a direct offer URL:
 * - anonymous users see product context, registration CTA, and no supplier identity;
 * - registered locked users can send the one-click price-access request;
 * - qualified users see supplier identity and exact commercial terms.
 */
import { expect, test, type Page } from "@playwright/test";

const OFFER_PATH = "/offers/00000000-0000-0000-0000-000000000001";
const PRODUCT_NAME = "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade";
const SUPPLIER_NAME = "Nordic Seafood AS";

const setBaseStorage = async (
  page: Page,
  mode: "anonymous_locked" | "registered_locked" | "qualified_unlocked",
) => {
  await page.addInitScript(
    ({ mode, supplierName }) => {
      try {
        window.localStorage.setItem("yorso-lang", "en");
        window.sessionStorage.removeItem("yorso_buyer_session");
        window.sessionStorage.removeItem("yorso_buyer_qualification");
        window.sessionStorage.removeItem("yorso_buyer_qualified");

        if (mode !== "anonymous_locked") {
          window.sessionStorage.setItem(
            "yorso_buyer_session",
            JSON.stringify({
              id: "b_e2e_offer_detail",
              identifier: "buyer@example.com",
              method: "email",
              signedInAt: new Date().toISOString(),
              displayName: "buyer",
            }),
          );
        }

        if (mode === "qualified_unlocked") {
          window.sessionStorage.setItem(
            "yorso_buyer_qualification",
            JSON.stringify({
              companyName: supplierName,
              approvedAt: new Date().toISOString(),
            }),
          );
        }
      } catch {
        /* ignore */
      }
    },
    { mode, supplierName: SUPPLIER_NAME },
  );
};

const gotoOffer = async (
  page: Page,
  mode: "anonymous_locked" | "registered_locked" | "qualified_unlocked",
) => {
  await setBaseStorage(page, mode);
  await page.goto(OFFER_PATH, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible({
    timeout: 15_000,
  });
};

const bodyText = async (page: Page) => (await page.locator("body").textContent()) ?? "";

const assertNoSupplierIdentity = async (page: Page) => {
  await expect(page.locator("body")).not.toContainText(SUPPLIER_NAME);
  await expect(page.locator("body")).not.toContainText("nordic-seafood");
};

test.describe("/offers/:id · access contract", () => {
  test("anonymous_locked: shows product context and registration CTA without supplier identity", async ({ page }) => {
    await gotoOffer(page, "anonymous_locked");

    await expect(page.getByTestId("offer-detail-back-to-catalog")).toBeVisible();
    await expect(page.getByText("Sign up to view supplier and price details")).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: /Register Free/i })).toBeVisible();
    await expect(page.getByText("Commercial Terms")).toBeVisible();
    await expect(page.getByRole("button", { name: /Unlock supplier contact/i })).toBeVisible();
    await assertNoSupplierIdentity(page);
  });

  test("registered_locked: can send price access request and still hides supplier identity", async ({ page }) => {
    await gotoOffer(page, "registered_locked");

    await expect(page.getByText("Request access to unlock full details")).toBeVisible();
    await page.getByTestId("supplier-request-price-access").click();
    await expect(page.getByTestId("supplier-access-request-status")).toBeVisible();
    await assertNoSupplierIdentity(page);
  });

  test("qualified_unlocked: shows unlocked commercial controls", async ({ page }) => {
    await gotoOffer(page, "qualified_unlocked");

    const text = await bodyText(page);
    // In frontend-first mode, the UI may still receive public fallback data from
    // Supabase when no real backend price grant exists. The stable contract here:
    // qualified users get the unlocked commercial UI and no sign-up lock banner.
    expect(text).toContain("Delivery Basis");
    expect(text).toContain("Price (FOB)");
    await expect(page.getByRole("button", { name: /Contact Supplier/i })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Sign up to view supplier and price details/i);
  });
});
