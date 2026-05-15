/**
 * E2E · /suppliers · directory URL state, sorting, pagination and access gating.
 *
 * Batch #56 browser-level guard:
 * - URL-backed q/filter/sort/dir/rows/page hydrate into visible controls;
 * - sort/page-size/Next/Previous update the URL and visible range summary;
 * - locked users cannot discover private supplier identity through search;
 * - qualified users can search private supplier identity in the local fallback;
 * - locked rows keep exact catalog breadth and active offer counts hidden.
 */
import { expect, test, type Page } from "@playwright/test";

const SUPPLIER_NAME = "Nordfjord Sjømat AS";
const LOCKED_ACTIVE_COUNT = "14 active offers";
const LOCKED_CATALOG_COUNT = "32 products";

const installSupplierStorage = async (
  page: Page,
  mode: "anonymous_locked" | "qualified_unlocked" = "anonymous_locked",
) => {
  await page.addInitScript(
    ({ accessMode, supplierName }) => {
      try {
        window.localStorage.setItem("yorso-lang", "en");
        window.sessionStorage.removeItem("yorso_buyer_session");
        window.sessionStorage.removeItem("yorso_buyer_qualification");
        window.sessionStorage.removeItem("yorso_buyer_qualified");
        window.sessionStorage.removeItem("yorso_supplier_shortlist");

        if (accessMode === "qualified_unlocked") {
          window.sessionStorage.setItem(
            "yorso_buyer_session",
            JSON.stringify({
              id: "b_e2e_supplier_directory",
              identifier: "buyer@example.com",
              method: "email",
              signedInAt: new Date().toISOString(),
              displayName: "buyer",
            }),
          );
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
    { accessMode: mode, supplierName: SUPPLIER_NAME },
  );
};

const gotoSuppliers = async (
  page: Page,
  path = "/suppliers",
  mode: "anonymous_locked" | "qualified_unlocked" = "anonymous_locked",
) => {
  await installSupplierStorage(page, mode);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("supplier-directory-search")).toBeVisible();
  await expect(page.getByTestId("supplier-directory-sort")).toBeVisible();
  await expect(page.getByTestId("supplier-directory-direction")).toBeVisible();
  await expect(page.getByTestId("supplier-directory-page-size")).toBeVisible();
};

test.describe("/suppliers · directory paging and sort", () => {
  test("hydrates URL-backed controls and clamps an out-of-range filtered page", async ({ page }) => {
    await gotoSuppliers(
      page,
      "/suppliers?q=salmon&filter=salmon&sort=country&dir=asc&rows=20&page=2",
    );

    await expect(page.getByTestId("supplier-directory-search")).toHaveValue("salmon");
    await expect(page.getByTestId("supplier-directory-filter-salmon")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("supplier-directory-sort")).toHaveValue("country");
    await expect(page.getByTestId("supplier-directory-direction")).toHaveValue("asc");
    await expect(page.getByTestId("supplier-directory-page-size")).toHaveValue("20");
    await expect(page.getByTestId("supplier-directory-page-summary")).toContainText(/Showing 1-\d+ of \d+/);
    await expect(page).not.toHaveURL(/page=2/);
  });

  test("updates URL and summary when rows and pagination controls change", async ({ page }) => {
    await gotoSuppliers(page, "/suppliers?sort=country&dir=asc");

    await expect(page.getByTestId("supplier-row").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("supplier-directory-page-summary")).toContainText("Showing 1-10 of 12");
    await expect(page.getByTestId("supplier-directory-pagination")).toBeVisible();
    await expect(page.getByTestId("supplier-directory-prev")).toBeDisabled();
    await expect(page.getByTestId("supplier-directory-next")).toBeEnabled();

    await page.getByTestId("supplier-directory-next").click({ force: true });
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByTestId("supplier-directory-page-summary")).toContainText("Showing 11-12 of 12");

    await page.getByTestId("supplier-directory-prev").click({ force: true });
    await expect(page).not.toHaveURL(/page=2/);
    await expect(page.getByTestId("supplier-directory-page-summary")).toContainText("Showing 1-10 of 12");

    await page.getByTestId("supplier-directory-page-size").selectOption("20");
    await expect(page.getByTestId("supplier-directory-page-summary")).toContainText("Showing 1-12 of 12");
    await expect(page.getByTestId("supplier-directory-pagination")).toHaveCount(0);
    await expect(page).toHaveURL(/rows=20/);
  });

  test("keeps private supplier search locked until qualified access exists", async ({ page }) => {
    await gotoSuppliers(page, "/suppliers?q=Nordfjord");

    await expect(page.getByText(/No suppliers match/i)).toBeVisible();
    await expect(page.locator("body")).not.toContainText(SUPPLIER_NAME);

    const qualified = await page.context().newPage();
    await gotoSuppliers(qualified, "/suppliers?q=Nordfjord", "qualified_unlocked");

    await expect(qualified.getByTestId("supplier-row").first()).toBeVisible({ timeout: 15_000 });
    await expect(qualified.getByTestId("supplier-row").first()).toContainText(SUPPLIER_NAME);
    await expect(qualified.getByTestId("supplier-directory-page-summary")).toContainText("Showing 1-1 of 1");
    await qualified.close();
  });

  test("locked rows keep exact supplier breadth hidden while controls remain usable", async ({ page }) => {
    await gotoSuppliers(page, "/suppliers?sort=verification&dir=asc");

    await expect(page.getByTestId("supplier-row").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("supplier-directory-sort")).toHaveValue("verification");
    await expect(page.getByTestId("supplier-directory-direction")).toHaveValue("asc");
    await expect(page.locator("body")).not.toContainText(SUPPLIER_NAME);
    await expect(page.locator("body")).not.toContainText(LOCKED_ACTIVE_COUNT);
    await expect(page.locator("body")).not.toContainText(LOCKED_CATALOG_COUNT);
    await expect(page.getByTestId("supplier-row").first()).toContainText(/approval|access/i);
  });

  test("quick filters update URL state and can be cleared without leaking private identity", async ({ page }) => {
    await gotoSuppliers(page);

    await page.getByTestId("supplier-directory-filter-certified").click();
    await expect(page).toHaveURL(/filter=certified/);
    await expect(page.getByTestId("supplier-directory-filter-certified")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("supplier-directory-page-summary")).toContainText(/Showing 1-\d+ of \d+/);
    await expect(page.locator("body")).not.toContainText(SUPPLIER_NAME);

    await page.getByRole("button", { name: /clear filters/i }).click();
    await expect(page).not.toHaveURL(/filter=certified/);
    await expect(page.getByTestId("supplier-directory-filter-certified")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("supplier-directory-page-summary")).toContainText("Showing 1-10 of 12");
  });
});
