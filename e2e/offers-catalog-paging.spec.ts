/**
 * E2E · /offers · catalog URL state, sorting, pagination and access gating.
 *
 * Batch #55 browser-level guard:
 * - URL-backed q/category/sort/dir/rows/page hydrate into the visible controls;
 * - sort/page-size/Next/Previous update the URL without losing default cleanup;
 * - locked buyers cannot discover private supplier identity through search;
 * - qualified buyers can use private supplier search in the local fallback.
 */
import { expect, test, type Page } from "@playwright/test";

const SUPPLIER_NAME = "Nordic Seafood AS";

const installCatalogStorage = async (
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

        if (accessMode === "qualified_unlocked") {
          window.sessionStorage.setItem(
            "yorso_buyer_session",
            JSON.stringify({
              id: "b_e2e_offer_catalog",
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

const gotoOffers = async (
  page: Page,
  path = "/offers",
  mode: "anonymous_locked" | "qualified_unlocked" = "anonymous_locked",
) => {
  await installCatalogStorage(page, mode);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("catalog-result-count")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("offer-catalog-sort")).toBeVisible();
  await expect(page.getByTestId("offer-catalog-direction")).toBeVisible();
  await expect(page.getByTestId("offer-catalog-page-size")).toBeVisible();
};

test.describe("/offers · catalog paging and sort", () => {
  test("hydrates URL-backed controls and clamps an out-of-range filtered page", async ({ page }) => {
    await gotoOffers(
      page,
      "/offers?q=salmon&category=Salmon&sort=origin&dir=asc&rows=20&page=2",
    );

    await expect(page.getByTestId("offer-catalog-sort")).toHaveValue("origin");
    await expect(page.getByTestId("offer-catalog-direction")).toHaveValue("asc");
    await expect(page.getByTestId("offer-catalog-page-size")).toHaveValue("20");
    await expect(page.getByTestId("offer-catalog-page-summary")).toContainText("Showing 1-1 of 1");
    await expect(page).not.toHaveURL(/page=2/);
  });

  test("updates URL and summary when rows and pagination controls change", async ({ page }) => {
    await gotoOffers(page, "/offers?sort=origin&dir=asc");

    await expect(page.getByTestId("offer-catalog-page-summary")).toContainText("Showing 1-10 of 12");
    await expect(page.getByTestId("offer-catalog-pagination")).toBeVisible();
    await expect(page.getByTestId("offer-catalog-prev")).toBeDisabled();
    await expect(page.getByTestId("offer-catalog-next")).toBeEnabled();

    await page.getByTestId("offer-catalog-next").click({ force: true });
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByTestId("offer-catalog-page-summary")).toContainText("Showing 11-12 of 12");

    await page.getByTestId("offer-catalog-prev").click({ force: true });
    await expect(page).not.toHaveURL(/page=2/);
    await expect(page.getByTestId("offer-catalog-page-summary")).toContainText("Showing 1-10 of 12");

    await page.getByTestId("offer-catalog-page-size").selectOption("20");
    await expect(page.getByTestId("offer-catalog-page-summary")).toContainText("Showing 1-12 of 12");
    await expect(page.getByTestId("offer-catalog-pagination")).toHaveCount(0);
    await expect(page).toHaveURL(/rows=20/);
  });

  test("keeps private supplier search locked until qualified access exists", async ({ page }) => {
    await gotoOffers(page, "/offers?q=Nordic%20Seafood");

    await expect(page.getByTestId("catalog-empty-reset")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(SUPPLIER_NAME);

    const qualified = await page.context().newPage();
    await gotoOffers(qualified, "/offers?q=Nordic%20Seafood", "qualified_unlocked");

    await expect(qualified.getByTestId("catalog-row-supplier-name").first()).toContainText(SUPPLIER_NAME);
    await expect(qualified.getByTestId("catalog-row-price-block").first()).toHaveAttribute(
      "data-access-level",
      "qualified_unlocked",
    );
    await qualified.close();
  });

  test("locked rows keep price and supplier identity gated while sort controls remain usable", async ({ page }) => {
    await gotoOffers(page, "/offers?sort=moq&dir=asc");

    await expect(page.getByTestId("offer-catalog-sort")).toHaveValue("moq");
    await expect(page.getByTestId("offer-catalog-direction")).toHaveValue("asc");
    await expect(page.getByTestId("catalog-row-price-block").first()).toHaveAttribute(
      "data-access-level",
      "anonymous_locked",
    );
    await expect(page.locator("body")).not.toContainText(SUPPLIER_NAME);
    await expect(page.locator("body")).not.toContainText("Qingdao Ocean Harvest Foods Co., Ltd.");
  });
});
