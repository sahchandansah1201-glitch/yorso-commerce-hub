import { expect, test, type Page } from "@playwright/test";

const setSignedInStorage = async (page: Page, lang: "en" | "ru" | "es" = "en") => {
  await page.addInitScript(
    ({ language }) => {
      try {
        window.localStorage.setItem("yorso-lang", language);
        window.sessionStorage.setItem(
          "yorso_buyer_session",
          JSON.stringify({
            id: "b_e2e_account_products",
            identifier: "buyer@example.com",
            method: "email",
            signedInAt: new Date().toISOString(),
            displayName: "buyer",
          }),
        );
      } catch {
        /* ignore */
      }
    },
    { language: lang },
  );
};

const openProducts = async (page: Page, lang: "en" | "ru" | "es" = "en") => {
  await setSignedInStorage(page, lang);
  await page.goto("/account/products", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-section-products")).toBeVisible({ timeout: 15_000 });
};

const mockClipboardSuccess = async (page: Page) => {
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

const mockClipboardUnavailable = async (page: Page) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "clipboard", {
      configurable: true,
      get: () => undefined,
    });
  });
};

const mainText = async (page: Page) => (await page.locator("main").textContent()) ?? "";

const firstProductRowText = async (page: Page) =>
  (await page.locator('[data-testid^="account-product-row-"]').first().textContent()) ?? "";

const expectStorageContains = async (page: Page, expected: string) => {
  await expect
    .poll(async () =>
      page.evaluate((needle) => localStorage.getItem("yorso_account_profile_v1")?.includes(needle), expected),
    )
    .toBe(true);
};

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
  },
) => {
  await selectFromCatalog(page, values.latin);
  await page.getByTestId("account-product-state").selectOption(values.state);
  await page.getByTestId("account-product-role").selectOption(values.role);
  await page.getByTestId("account-product-monthly-volume").fill(values.monthlyVolume);
  await page.getByTestId("account-product-format").fill(values.format);
};

test.describe("/account/products · editable product matrix", () => {
  test("adds a selling product and persists it after reload", async ({ page }) => {
    await openProducts(page);

    await page.getByTestId("account-product-add").click();
    await fillProductForm(page, {
      latin: "Salmo salar",
      state: "fresh",
      role: "selling",
      monthlyVolume: "18 t / month",
      format: "Skin-on fillet",
    });
    await page.getByTestId("account-product-save").click();

    const table = page.getByTestId("account-products-table");
    await expect(table).toContainText("Atlantic salmon");
    await expect(table).toContainText("Fresh");
    await expect(table).toContainText("Selling");
    await expectStorageContains(page, "Salmo salar");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-products-table")).toContainText("Atlantic salmon");
  });


  test("catalog picker fills commercial and Latin names from the workbook catalog", async ({
    page,
  }) => {
    await openProducts(page);

    await page.getByTestId("account-product-add").click();
    await page.getByTestId("account-product-catalog-search").fill("Atlantic mackerel");
    const option = page
      .locator('[data-testid^="account-product-catalog-option-"]')
      .filter({ hasText: "Scomber scombrus" })
      .first();

    await expect(option).toContainText("Scomber scombrus");
    await expect(option).toContainText("(Atlantic mackerel)");
    await option.click();

    await expect(page.getByTestId("account-product-catalog-search")).toHaveValue(
      "Scomber scombrus (Atlantic mackerel)",
    );
    await expect(page.getByTestId("account-product-selected-summary")).toBeVisible();
    await expect(page.getByTestId("account-product-selected-latin")).toHaveCount(0);
    await expect(page.getByTestId("account-product-selected-commercial")).toHaveCount(0);
  });

  test("validation keeps incomplete products out of the matrix", async ({ page }) => {
    await openProducts(page);

    await page.getByTestId("account-product-add").click();
    await page.getByTestId("account-product-save").click();

    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(1);
    await expect(page.getByTestId("account-product-catalog-error")).toBeVisible();
    expect(await mainText(page)).not.toContain("product_");
  });

  test("search and filters narrow the product matrix without changing storage", async ({
    page,
  }) => {
    await openProducts(page);

    await page.getByTestId("account-product-search").fill("salmon");
    await expect(page.getByTestId("account-product-results-count")).toContainText("1 of 6");
    await expect(page.getByTestId("account-products-table")).toContainText("Atlantic Salmon Fillet");
    await expect(page.getByTestId("account-products-table")).not.toContainText("Vannamei Shrimp");

    await page.getByTestId("account-product-search").fill("no product match");
    await expect(page.getByTestId("account-product-no-results")).toBeVisible();
    await page.getByTestId("account-product-no-results-reset").click();
    await expect(page.getByTestId("account-product-results-count")).toContainText("6 of 6");

    await page.getByTestId("account-product-state-filter").selectOption("alive");
    await expect(page.getByTestId("account-product-results-count")).toContainText("1 of 6");
    await expect(page.getByTestId("account-products-table")).toContainText("Live Mussels");
    await page.getByTestId("account-product-state-filter").selectOption("all");
    await page.getByTestId("account-product-role-filter").selectOption("selling");
    await expect(page.getByTestId("account-product-results-count")).toContainText("2 of 6");
    await expect(page.getByTestId("account-products-table")).toContainText("Atlantic Cod H&G");
    await expect(page.getByTestId("account-products-table")).toContainText("Mackerel WR");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-products-table")).toContainText("Vannamei Shrimp");
  });

  test("sort controls reorder visible rows without changing product data", async ({ page }) => {
    await openProducts(page);

    await page.getByTestId("account-product-sort-key").selectOption("commercialName");
    await page.getByTestId("account-product-sort-direction").selectOption("desc");
    await expect(page.getByTestId("account-product-results-count")).toContainText("Sorted by Product name");
    expect(await firstProductRowText(page)).toContain("Vannamei Shrimp");

    await page.getByTestId("account-product-sort-key").selectOption("monthlyVolume");
    await page.getByTestId("account-product-sort-direction").selectOption("desc");
    await expect(page.getByTestId("account-product-results-count")).toContainText("Sorted by Monthly volume");
    expect(await firstProductRowText(page)).toContain("Mackerel WR");

    await page.getByTestId("account-product-role-filter").selectOption("selling");
    await expect(page.getByTestId("account-product-results-count")).toContainText("2 of 6");
    expect(await firstProductRowText(page)).toContain("Mackerel WR");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-products-table")).toContainText("Atlantic Cod H&G");
    await expect(page.getByTestId("account-products-table")).toContainText("Mackerel WR");
  });

  test("sort preferences and page size persist after reload without persisting filters", async ({
    page,
  }) => {
    await openProducts(page);

    await page.getByTestId("account-product-sort-key").selectOption("monthlyVolume");
    await page.getByTestId("account-product-sort-direction").selectOption("desc");
    await page.getByTestId("account-product-page-size").selectOption("2");
    await page.getByTestId("account-product-role-filter").selectOption("selling");
    await expect(page.getByTestId("account-product-results-count")).toContainText("2 of 6");
    expect(await firstProductRowText(page)).toContain("Mackerel WR");

    await expect
      .poll(() =>
        page.evaluate(() => {
          const raw = localStorage.getItem("yorso_account_products_view_v1");
          return raw ? JSON.parse(raw) : null;
        }),
      )
      .toMatchObject({
        sortKey: "monthlyVolume",
        sortDirection: "desc",
        pageSize: 2,
      });

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("account-product-sort-key")).toHaveValue("monthlyVolume");
    await expect(page.getByTestId("account-product-sort-direction")).toHaveValue("desc");
    await expect(page.getByTestId("account-product-page-size")).toHaveValue("2");
    await expect(page.getByTestId("account-product-results-count")).toContainText("6 of 6");
    await expect(page.getByTestId("account-product-page-summary")).toContainText("Showing 1-2 of 6");
    expect(await firstProductRowText(page)).toContain("Mackerel WR");
  });

  test("pagination moves through product pages and resets when filters change", async ({ page }) => {
    await openProducts(page);

    await page.getByTestId("account-product-page-size").selectOption("2");
    await expect(page.getByTestId("account-product-page-summary")).toContainText("Showing 1-2 of 6");
    await expect(page.getByTestId("account-product-page-previous")).toBeDisabled();
    await expect(page.getByTestId("account-product-page-next")).toBeEnabled();
    await expect(page.locator('[data-testid^="account-product-row-"]')).toHaveCount(2);

    await page.getByTestId("account-product-page-next").click();
    await expect(page.getByTestId("account-product-page-summary")).toContainText("Showing 3-4 of 6");
    await expect(page.getByTestId("account-product-page-previous")).toBeEnabled();

    await page.getByTestId("account-product-page-next").click();
    await expect(page.getByTestId("account-product-page-summary")).toContainText("Showing 5-6 of 6");
    await expect(page.getByTestId("account-product-page-next")).toBeDisabled();

    await page.getByTestId("account-product-search").fill("salmon");
    await expect(page.getByTestId("account-product-results-count")).toContainText("1 of 6");
    await expect(page.getByTestId("account-product-page-summary")).toContainText("Showing 1-1 of 1");
    await expect(page.locator('[data-testid^="account-product-row-"]')).toHaveCount(1);
  });

  test("URL params hydrate product search, filters, sorting and page size", async ({
    page,
  }) => {
    await setSignedInStorage(page);
    await page.goto(
      "/account/products?q=shrimp&state=frozen&role=both&sort=monthlyVolume&dir=desc&rows=2&page=1",
      { waitUntil: "domcontentloaded" },
    );
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("account-section-products")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("account-product-search")).toHaveValue("shrimp");
    await expect(page.getByTestId("account-product-state-filter")).toHaveValue("frozen");
    await expect(page.getByTestId("account-product-role-filter")).toHaveValue("both");
    await expect(page.getByTestId("account-product-sort-key")).toHaveValue("monthlyVolume");
    await expect(page.getByTestId("account-product-sort-direction")).toHaveValue("desc");
    await expect(page.getByTestId("account-product-page-size")).toHaveValue("2");
    await expect(page.getByTestId("account-product-results-count")).toContainText("1 of 6");
    await expect(page.getByTestId("account-product-page-summary")).toContainText("Showing 1-1 of 1");
    expect(await firstProductRowText(page)).toContain("Vannamei Shrimp");
  });

  test("invalid product URL params fall back safely and show a localized warning", async ({
    page,
  }) => {
    await setSignedInStorage(page);
    await page.goto(
      "/account/products?q=&state=invalid-state&role=invalid-role&sort=unknown&dir=sideways&rows=3&page=0",
      { waitUntil: "domcontentloaded" },
    );
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("account-product-state-filter")).toHaveValue("all");
    await expect(page.getByTestId("account-product-role-filter")).toHaveValue("all");
    await expect(page.getByTestId("account-product-sort-key")).toHaveValue("commercialName");
    await expect(page.getByTestId("account-product-sort-direction")).toHaveValue("asc");
    await expect(page.getByTestId("account-product-page-size")).toHaveValue("10");
    await expect(page.getByTestId("account-product-results-count")).toContainText("6 of 6");

    const warning = page.getByTestId("account-product-link-warning");
    await expect(warning).toBeVisible();
    await expect(warning).toContainText("state");
    await expect(warning).toContainText("role");
    await expect(warning).toContainText("sort");
    await expect(warning).toContainText("dir");
    await expect(warning).toContainText("rows");
    await expect(warning).toContainText("page");

    await page.getByTestId("account-product-clean-link").click();
    await expect(warning).not.toBeVisible();
    await expect(page.getByTestId("account-product-share-view")).toBeFocused();
    const cleanParams = await page.evaluate(() =>
      Object.fromEntries(new URL(location.href).searchParams),
    );
    expect(cleanParams).not.toHaveProperty("state");
    expect(cleanParams).not.toHaveProperty("role");
    expect(cleanParams).not.toHaveProperty("sort");
    expect(cleanParams).not.toHaveProperty("dir");
    expect(cleanParams).not.toHaveProperty("rows");
    expect(cleanParams).not.toHaveProperty("page");
  });

  test("share view copies URL params, focuses the generated link and reset clears filters", async ({
    page,
  }) => {
    await mockClipboardSuccess(page);
    await openProducts(page);

    await page.getByTestId("account-product-search").fill("cod");
    await page.getByTestId("account-product-state-filter").selectOption("frozen");
    await page.getByTestId("account-product-role-filter").selectOption("selling");
    await page.getByTestId("account-product-sort-key").selectOption("monthlyVolume");
    await page.getByTestId("account-product-sort-direction").selectOption("desc");
    await page.getByTestId("account-product-page-size").selectOption("2");
    await page.getByTestId("account-product-share-view").click();

    await expect(page.getByTestId("account-product-link-status")).toBeVisible();
    await expect(page.getByTestId("account-product-link-status")).toContainText(
      "Product view link copied",
    );
    await expect(page.getByTestId("account-product-share-url")).toBeVisible();
    await expect(page.getByTestId("account-product-share-url")).toBeFocused();
    const params = await page.evaluate(() => Object.fromEntries(new URL(location.href).searchParams));
    expect(params).toMatchObject({
      q: "cod",
      state: "frozen",
      role: "selling",
      sort: "monthlyVolume",
      dir: "desc",
      rows: "2",
    });
    const generatedUrl = await page.getByTestId("account-product-share-url").inputValue();
    expect(generatedUrl).toContain("/account/products?");
    expect(generatedUrl).toContain("q=cod");
    expect(generatedUrl).toContain("sort=monthlyVolume");
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("yorso_e2e_copied_product_link")))
      .toBe(generatedUrl);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-product-search")).toHaveValue("cod");
    await expect(page.getByTestId("account-product-results-count")).toContainText("1 of 6");
    expect(await firstProductRowText(page)).toContain("Atlantic Cod H&G");

    await page.getByTestId("account-product-search-clear").click();
    const resetParams = await page.evaluate(() =>
      Object.fromEntries(new URL(location.href).searchParams),
    );
    expect(resetParams).not.toHaveProperty("q");
    expect(resetParams).not.toHaveProperty("state");
    expect(resetParams).not.toHaveProperty("role");
  });

  test("share view exposes a manual copy field when clipboard is unavailable", async ({ page }) => {
    await mockClipboardUnavailable(page);
    await openProducts(page);

    await page.getByTestId("account-product-search").fill("mackerel");
    await page.getByTestId("account-product-share-view").focus();
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("account-product-link-status")).toContainText(
      "Product view link is ready",
    );
    await expect(page.getByTestId("account-product-share-url")).toBeFocused();
    await expect(page.getByTestId("account-product-share-url")).toHaveValue(/q=mackerel/);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("yorso_e2e_copied_product_link")))
      .toBeNull();
  });

  test("product view controls expose accessible names", async ({ page }) => {
    await openProducts(page);

    await expect(page.getByLabel("Sort by")).toHaveValue("commercialName");
    await expect(page.getByLabel("Order")).toHaveValue("asc");
    await expect(page.getByLabel("Rows")).toHaveValue("10");
    await page.getByLabel("Rows").selectOption("2");
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share view" })).toBeVisible();
    await page.getByRole("button", { name: "Share view" }).click();
    await expect(page.getByLabel("Product view URL")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  test("product controls are not covered by the right readiness panel at desktop width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openProducts(page);

    const shareButton = page.getByTestId("account-product-share-view");
    await shareButton.scrollIntoViewIfNeeded();
    await expect(shareButton).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const button = document.querySelector<HTMLElement>(
            '[data-testid="account-product-share-view"]',
          );
          if (!button) return false;
          const rect = button.getBoundingClientRect();
          const target = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          );
          return Boolean(target && button.contains(target));
        }),
      )
      .toBe(true);
  });

  test("mobile renders Latin-first labelled product cards instead of a horizontal table", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProducts(page, "ru");

    await expect(page.getByTestId("account-products-mobile-cards")).toBeVisible();
    await expect(page.getByTestId("account-products-table")).toBeHidden();

    const firstCard = page.locator('[data-testid^="account-product-mobile-card-"]').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard).not.toContainText("Продукт");
    await expect(firstCard).toContainText("Gadus chalcogrammus");
    await expect(firstCard).toContainText("(Alaska Pollock Fillet)");
    await expect(firstCard).toContainText("Состояние");
    // Role rendered as a top-right badge without a separate label in the scanable card.
    await expect(firstCard).toContainText("Покупка");
    await expect(firstCard).toContainText("Объём");
    await expect(firstCard).not.toContainText("Сертификации");
    await expect(firstCard).not.toContainText("Целевые страны");

    const metrics = await page.evaluate(() => ({
      bodyDelta: document.body.scrollWidth - document.documentElement.clientWidth,
      pageDelta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      nestedControls: document.querySelectorAll("a button, button a, a a, button button").length,
    }));
    expect(metrics.bodyDelta).toBeLessThanOrEqual(0);
    expect(metrics.pageDelta).toBeLessThanOrEqual(0);
    expect(metrics.nestedControls).toBe(0);

    const touchTargets = await page
      .locator(
        [
          '[data-testid^="account-product-mobile-open-"]',
          '[data-testid^="account-product-mobile-edit-"]',
          '[data-testid^="account-product-mobile-delete-"]',
        ].join(", "),
      )
      .evaluateAll((elements) =>
        elements
          .filter((element) => element instanceof HTMLElement && element.offsetParent !== null)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          }),
      );

    expect(touchTargets.length).toBeGreaterThan(0);
    touchTargets.forEach((target) => {
      expect(target.width).toBeGreaterThanOrEqual(44);
      expect(target.height).toBeGreaterThanOrEqual(44);
    });
  });

  test("duplicate guard blocks identical product matching records", async ({ page }) => {
    await openProducts(page);

    await page.getByTestId("account-product-add").click();
    await fillProductForm(page, {
      latin: "Salmo salar",
      state: "fresh",
      role: "selling",
      monthlyVolume: "Original duplicate test volume",
      format: "Skin-on fillet",
    });
    await page.getByTestId("account-product-save").click();
    await expect(page.getByTestId("account-products-table")).toContainText("Atlantic salmon");

    await page.getByTestId("account-product-add").click();
    await fillProductForm(page, {
      latin: "Salmo salar",
      state: "fresh",
      role: "selling",
      monthlyVolume: "Duplicate volume should not persist",
      format: "Skin-on fillet",
    });
    await page.getByTestId("account-product-save").click();

    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByText("This product already exists")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          Boolean(
            localStorage
              .getItem("yorso_account_profile_v1")
              ?.includes("Duplicate volume should not persist"),
          ),
        ),
      )
      .toBe(false);
  });

  test("edits an existing product without exposing raw internal state values", async ({ page }) => {
    await openProducts(page);

    await page.getByTestId("account-product-edit-p_1").click();
    await page.getByTestId("account-product-state").selectOption("chilled");
    await page.getByTestId("account-product-role").selectOption("selling");
    await page.getByTestId("account-product-monthly-volume").fill("21 t / month");
    await page.getByTestId("account-product-save").click();

    const text = await mainText(page);
    expect(text).toContain("Atlantic Cod H&G");
    expect(text).toContain("Chilled");
    expect(text).toContain("Selling");
    expect(text).toContain("21 t / month");
    expect(text).not.toMatch(/\bfrozen\b|\bchilled\b|\bselling\b/);
    await expectStorageContains(page, "21 t / month");
  });

  test("product details panel shows matching profile and can start editing", async ({
    page,
  }) => {
    await openProducts(page);

    await page.getByTestId("account-product-open-p_3").click();
    const detail = page.getByTestId("account-product-detail-p_3");
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("Vannamei Shrimp");
    await expect(detail).toContainText("Litopenaeus vannamei");

    await page.getByTestId("account-product-detail-edit").click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByTestId("account-product-catalog-search")).toHaveValue(
      "Litopenaeus vannamei (Vannamei Shrimp)",
    );
    await expect(page.getByTestId("account-product-selected-latin")).toHaveCount(0);
    await expect(page.getByTestId("account-product-selected-commercial")).toHaveCount(0);
    await page.getByTestId("account-product-cancel").click();

    await page.getByTestId("account-product-close-detail").click();
    await expect(detail).not.toBeVisible();
  });

  test("deletes a product and keeps the removal after reload", async ({ page }) => {
    await openProducts(page);

    await page.getByTestId("account-product-add").click();
    await fillProductForm(page, {
      latin: "Scomber japonicus",
      state: "frozen",
      role: "buying",
      monthlyVolume: "6 t / month",
      format: "HGT 300-500",
    });
    await page.getByTestId("account-product-save").click();
    await expect(page.getByTestId("account-products-table")).toContainText("Pacific chub mackerel");

    const row = page.locator("tbody tr").filter({ hasText: "Pacific chub mackerel" });
    await row.getByRole("button", { name: /delete product/i }).click();
    await expect(page.getByTestId("account-product-delete-confirm")).toBeVisible();
    await expect(page.getByTestId("account-product-delete-confirm")).toContainText(
      "Pacific chub mackerel",
    );
    await expect(page.getByTestId("account-product-delete-confirm")).toContainText(
      "Scomber japonicus",
    );

    await page.getByTestId("account-product-delete-confirm-cancel").click();
    await expect(page.getByTestId("account-product-delete-confirm")).toBeHidden();
    await expect(page.getByTestId("account-products-table")).toContainText("Pacific chub mackerel");

    await row.getByRole("button", { name: /delete product/i }).click();
    await page.getByTestId("account-product-delete-confirm-submit").click();

    await expect(page.getByTestId("account-products-table")).not.toContainText("Pacific chub mackerel");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-products-table")).not.toContainText("Pacific chub mackerel");
  });

  test("mobile product delete confirmation cancels safely and confirms removal", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProducts(page, "ru");

    const firstCard = page.locator('[data-testid^="account-product-mobile-card-"]').first();
    const productName = "Alaska Pollock Fillet";
    await expect(firstCard).toContainText(productName);
    await firstCard.locator('[data-testid^="account-product-mobile-delete-"]').click();

    await expect(page.getByTestId("account-product-delete-confirm")).toBeVisible();
    await expect(page.getByTestId("account-product-delete-confirm")).toContainText(
      "Удалить продукт?",
    );
    await expect(page.getByTestId("account-product-delete-confirm")).toContainText(productName);
    await expect(page.getByTestId("account-product-delete-confirm")).not.toContainText(
      "Справочник продукции",
    );
    await expect(page.getByTestId("account-product-delete-confirm")).toContainText(
      "Gadus chalcogrammus",
    );

    await page.getByTestId("account-product-delete-confirm-cancel").click();
    await expect(page.getByTestId("account-product-delete-confirm")).toBeHidden();
    await expect(page.getByTestId("account-products-mobile-cards")).toContainText(productName);

    await firstCard.locator('[data-testid^="account-product-mobile-delete-"]').click();
    await page.getByTestId("account-product-delete-confirm-submit").click();
    await expect(page.getByTestId("account-products-mobile-cards")).not.toContainText(productName);

    const metrics = await page.evaluate(() => ({
      bodyDelta: document.body.scrollWidth - document.documentElement.clientWidth,
      pageDelta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      nestedControls: document.querySelectorAll("a button, button a, a a, button button").length,
    }));
    expect(metrics.bodyDelta).toBeLessThanOrEqual(0);
    expect(metrics.pageDelta).toBeLessThanOrEqual(0);
    expect(metrics.nestedControls).toBe(0);
  });

  test("Russian product matrix stays localized while editing", async ({ page }) => {
    await openProducts(page, "ru");

    await expect(page.getByTestId("account-section-products")).toContainText("Матрица продуктов");
    await page.getByTestId("account-product-add").click();
    await fillProductForm(page, {
      latin: "Salmo salar",
      state: "frozen",
      role: "buying",
      monthlyVolume: "12 т / месяц",
      format: "HOSO 40/50",
    });
    await page.getByTestId("account-product-save").click();

    const text = await mainText(page);
    expect(text).toContain("Лосось атлантический");
    expect(text).toContain("Мороженый");
    expect(text).toContain("Покупка");
    expect(text).toContain("Сортировать по");
    expect(text).toContain("Сортировка: Названию продукта");
    expect(text).toContain("Показаны 1-7 из 7");
    expect(text).toContain("Очистить фильтры");
    expect(text).toContain("Ссылка на вид");
    expect(text).not.toMatch(/\bfrozen\b|\bbuying\b|\bselling\b|\bboth\b|commercialName|monthlyVolume/);
  });
});
