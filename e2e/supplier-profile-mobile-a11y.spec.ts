/**
 * E2E · /suppliers/:id · mobile accessibility and scanability.
 *
 * Guards the supplier trust/supply detail route against small mobile targets
 * while preserving access gating and supplier identity redaction.
 */
import { expect, test, type Page } from "@playwright/test";

const SUPPLIER_PATH = "/suppliers/sup-no-001";
const UNKNOWN_SUPPLIER_PATH = "/suppliers/sup-not-real";
const MASKED_NAME = "Norwegian salmon producer · NO-114";

const installAnonymousStorage = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("yorso-lang", "en");
      window.localStorage.removeItem("yorso_supplier_access_requests");
      window.localStorage.removeItem("yorso_supplier_access_notifications");
      window.sessionStorage.removeItem("yorso_buyer_session");
      window.sessionStorage.removeItem("yorso_buyer_qualification");
      window.sessionStorage.removeItem("yorso_buyer_qualified");
    } catch {
      /* ignore */
    }
  });
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  );
  expect(overflow).toBe(0);
};

const expectNoNestedControls = async (page: Page) => {
  await expect(page.locator("a button, button a, a a, button button")).toHaveCount(0);
};

const expectMarkedTargetsAreMobileSafe = async (page: Page) => {
  const targets = page.locator("[data-supplier-profile-mobile-target]");
  const count = await targets.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const target = targets.nth(i);
    await expect(target).toBeVisible();
    const box = await target.boundingBox();
    expect(box, `supplier-profile target ${i} should have a bounding box`).not.toBeNull();
    expect(Math.round(box?.width ?? 0), `supplier-profile target ${i} width`).toBeGreaterThanOrEqual(44);
    expect(Math.round(box?.height ?? 0), `supplier-profile target ${i} height`).toBeGreaterThanOrEqual(44);
  }
};

test.describe("/suppliers/:id · mobile accessibility and scanability", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("supplier profile keeps breadcrumbs and trust tabs mobile-safe", async ({ page }) => {
    await installAnonymousStorage(page);
    await page.goto(SUPPLIER_PATH, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: new RegExp(MASKED_NAME) })).toBeVisible({
      timeout: 15_000,
    });

    const breadcrumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs.getByRole("link", { name: /^Home$/ })).toBeVisible();
    await expect(breadcrumbs.getByRole("link", { name: /^Suppliers$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: "About supplier" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Catalog (2)" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Production passport" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Shipment reports & cases" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "FAQ" })).toBeVisible();

    await expectMarkedTargetsAreMobileSafe(page);
    await expectNoNestedControls(page);
    await expectNoHorizontalOverflow(page);
  });

  test("supplier not-found fallback keeps directory recovery target mobile-safe", async ({ page }) => {
    await installAnonymousStorage(page);
    await page.goto(UNKNOWN_SUPPLIER_PATH, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /supplier not found/i })).toBeVisible();
    await expect(
      page.locator("main").getByRole("link", { name: /^supplier directory$/i }),
    ).toBeVisible();

    await expectMarkedTargetsAreMobileSafe(page);
    await expectNoNestedControls(page);
    await expectNoHorizontalOverflow(page);
  });
});
