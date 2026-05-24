/**
 * E2E · /offers/:id · CTA semantics.
 *
 * Guard the buyer decision route against nested interactive controls.
 * The visual CTA affordance can look like a button, but the DOM target must be
 * one semantic link or one semantic button so mobile buyers and assistive
 * technology do not encounter duplicated actions.
 */
import { expect, test, type Page } from "@playwright/test";

const OFFER_PATH = "/offers/00000000-0000-0000-0000-000000000001";
const UNKNOWN_OFFER_PATH = "/offers/00000000-0000-0000-0000-000000009999";
const PRODUCT_NAME = "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade";

const setBaseStorage = async (
  page: Page,
  mode: "anonymous_locked" | "registered_locked",
) => {
  await page.addInitScript(({ mode }) => {
    try {
      window.localStorage.setItem("yorso-lang", "en");
      window.sessionStorage.removeItem("yorso_buyer_session");
      window.sessionStorage.removeItem("yorso_buyer_qualification");
      window.sessionStorage.removeItem("yorso_buyer_qualified");

      if (mode === "registered_locked") {
        window.sessionStorage.setItem(
          "yorso_buyer_session",
          JSON.stringify({
            id: "b_e2e_offer_detail_cta_semantics",
            identifier: "buyer@example.com",
            method: "email",
            signedInAt: new Date().toISOString(),
            displayName: "buyer",
          }),
        );
      }
    } catch {
      /* ignore */
    }
  }, { mode });
};

const expectNoNestedControls = async (page: Page) => {
  await expect(page.locator("a button, button a")).toHaveCount(0);
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  );
  expect(overflow).toBe(0);
};

test.describe("/offers/:id · CTA semantics", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("anonymous buyer sees single-link registration CTAs without nested controls", async ({ page }) => {
    await setBaseStorage(page, "anonymous_locked");
    await page.goto(OFFER_PATH, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole("main").getByRole("link", { name: /Register Free/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign up to view exact prices/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Register to Contact Supplier/i })).toBeVisible();
    await expectNoNestedControls(page);
    await expectNoHorizontalOverflow(page);
  });

  test("registered locked buyer gets hash access links as single anchors", async ({ page }) => {
    await setBaseStorage(page, "registered_locked");
    await page.goto(OFFER_PATH, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible({ timeout: 15_000 });

    const accessLinks = page.getByRole("link", { name: /Open access panel/i });
    await expect(accessLinks).toHaveCount(2);
    await accessLinks.first().click();
    await expect(page).toHaveURL(/#offer-supplier-access$/);
    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
    await expectNoNestedControls(page);
    await expectNoHorizontalOverflow(page);
  });

  test("unknown offer fallback exposes Browse all offers as one semantic link", async ({ page }) => {
    await setBaseStorage(page, "anonymous_locked");
    await page.goto(UNKNOWN_OFFER_PATH, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /offer not found/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: /Browse all offers/i })).toBeVisible();
    await expectNoNestedControls(page);
    await expectNoHorizontalOverflow(page);
  });
});
