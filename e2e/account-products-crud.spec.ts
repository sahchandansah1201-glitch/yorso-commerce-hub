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

const fillProductForm = async (
  page: Page,
  values: {
    commercialName: string;
    latinName: string;
    category: string;
    state: "frozen" | "fresh" | "chilled" | "alive" | "cooked";
    role: "buying" | "selling" | "both";
    monthlyVolume: string;
    format: string;
    certificates: string;
    targetCountries: string;
  },
) => {
  await page.getByTestId("account-product-commercial-name").fill(values.commercialName);
  await page.getByTestId("account-product-latin-name").fill(values.latinName);
  await page.getByTestId("account-product-category").fill(values.category);
  await page.getByTestId("account-product-state").selectOption(values.state);
  await page.getByTestId("account-product-role").selectOption(values.role);
  await page.getByTestId("account-product-monthly-volume").fill(values.monthlyVolume);
  await page.getByTestId("account-product-format").fill(values.format);
  await page.getByTestId("account-product-certificates").fill(values.certificates);
  await page.getByTestId("account-product-target-countries").fill(values.targetCountries);
};

test.describe("/account/products · editable product matrix", () => {
  test("adds a selling product and persists it after reload", async ({ page }) => {
    await openProducts(page);

    await page.getByTestId("account-product-add").click();
    await fillProductForm(page, {
      commercialName: "Norwegian Salmon Fillet 2-4 lb",
      latinName: "Salmo salar",
      category: "Salmon",
      state: "fresh",
      role: "selling",
      monthlyVolume: "18 t / month",
      format: "Skin-on fillet",
      certificates: "ASC, HACCP",
      targetCountries: "Germany, France",
    });
    await page.getByTestId("account-product-save").click();

    const table = page.getByTestId("account-products-table");
    await expect(table).toContainText("Norwegian Salmon Fillet 2-4 lb");
    await expect(table).toContainText("Fresh");
    await expect(table).toContainText("Selling");
    await expect(table).toContainText("ASC");
    await expectStorageContains(page, "Norwegian Salmon Fillet 2-4 lb");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-products-table")).toContainText(
      "Norwegian Salmon Fillet 2-4 lb",
    );
  });

  test("validation keeps incomplete products out of the matrix", async ({ page }) => {
    await openProducts(page);

    await page.getByTestId("account-product-add").click();
    await page.getByTestId("account-product-save").click();

    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(4);
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
  });

  test("share view writes URL params and reset clears filter params", async ({ page }) => {
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
      "Product view link updated",
    );
    const params = await page.evaluate(() => Object.fromEntries(new URL(location.href).searchParams));
    expect(params).toMatchObject({
      q: "cod",
      state: "frozen",
      role: "selling",
      sort: "monthlyVolume",
      dir: "desc",
      rows: "2",
    });

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

  test("product view controls expose accessible names", async ({ page }) => {
    await openProducts(page);

    await expect(page.getByLabel("Sort by")).toHaveValue("commercialName");
    await expect(page.getByLabel("Order")).toHaveValue("asc");
    await expect(page.getByLabel("Rows")).toHaveValue("10");
    await page.getByLabel("Rows").selectOption("2");
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share view" })).toBeVisible();
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

  test("duplicate guard blocks identical product matching records", async ({ page }) => {
    await openProducts(page);

    await page.getByTestId("account-product-add").click();
    await fillProductForm(page, {
      commercialName: " Atlantic Cod H&G ",
      latinName: "gadus morhua",
      category: "whitefish",
      state: "frozen",
      role: "selling",
      monthlyVolume: "Duplicate product should not persist",
      format: "H&G, IQF, 1-2 / 2-4 kg",
      certificates: "MSC",
      targetCountries: "Spain",
    });
    await page.getByTestId("account-product-save").click();

    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByText("This product already exists")).toBeVisible();
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(1);
    await expect(page.getByTestId("account-product-results-count")).toContainText("6 of 6");
    await expect
      .poll(() =>
        page.evaluate(() =>
          Boolean(
            localStorage
              .getItem("yorso_account_profile_v1")
              ?.includes("Duplicate product should not persist"),
          ),
        ),
      )
      .toBe(false);
  });

  test("edits an existing product without exposing raw internal state values", async ({ page }) => {
    await openProducts(page);

    await page.getByTestId("account-product-edit-p_1").click();
    await page.getByTestId("account-product-commercial-name").fill("Atlantic Salmon Fillet EU");
    await page.getByTestId("account-product-state").selectOption("chilled");
    await page.getByTestId("account-product-role").selectOption("selling");
    await page.getByTestId("account-product-target-countries").fill("Germany, Poland, Spain");
    await page.getByTestId("account-product-save").click();

    const text = await mainText(page);
    expect(text).toContain("Atlantic Salmon Fillet EU");
    expect(text).toContain("Chilled");
    expect(text).toContain("Selling");
    expect(text).not.toMatch(/\bfrozen\b|\bchilled\b|\bselling\b/);
    await expectStorageContains(page, "Atlantic Salmon Fillet EU");
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
    await expect(detail).toContainText("Ecuador, India, Vietnam, Spain");

    await page.getByTestId("account-product-detail-edit").click();
    await expect(page.getByTestId("account-product-form")).toBeVisible();
    await expect(page.getByTestId("account-product-commercial-name")).toHaveValue("Vannamei Shrimp");
    await page.getByTestId("account-product-cancel").click();

    await page.getByTestId("account-product-close-detail").click();
    await expect(detail).not.toBeVisible();
  });

  test("deletes a product and keeps the removal after reload", async ({ page }) => {
    await openProducts(page);

    await page.getByTestId("account-product-add").click();
    await fillProductForm(page, {
      commercialName: "Trial Mackerel HGT",
      latinName: "Scomber japonicus",
      category: "Mackerel",
      state: "frozen",
      role: "buying",
      monthlyVolume: "6 t / month",
      format: "HGT 300-500",
      certificates: "HACCP",
      targetCountries: "China",
    });
    await page.getByTestId("account-product-save").click();
    await expect(page.getByTestId("account-products-table")).toContainText("Trial Mackerel HGT");

    const row = page.locator("tbody tr").filter({ hasText: "Trial Mackerel HGT" });
    await row.getByRole("button", { name: /delete product/i }).click();

    await expect(page.getByTestId("account-products-table")).not.toContainText("Trial Mackerel HGT");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-products-table")).not.toContainText("Trial Mackerel HGT");
  });

  test("Russian product matrix stays localized while editing", async ({ page }) => {
    await openProducts(page, "ru");

    await expect(page.getByTestId("account-section-products")).toContainText("Матрица продуктов");
    await page.getByTestId("account-product-add").click();
    await fillProductForm(page, {
      commercialName: "Креветка ваннамей HOSO",
      latinName: "Litopenaeus vannamei",
      category: "Креветка",
      state: "frozen",
      role: "buying",
      monthlyVolume: "12 т / месяц",
      format: "HOSO 40/50",
      certificates: "BAP, HACCP",
      targetCountries: "Эквадор, Индия",
    });
    await page.getByTestId("account-product-save").click();

    const text = await mainText(page);
    expect(text).toContain("Креветка ваннамей HOSO");
    expect(text).toContain("Замороженный");
    expect(text).toContain("Покупка");
    expect(text).toContain("Сортировать по");
    expect(text).toContain("Сортировка: Названию продукта");
    expect(text).toContain("Показаны 1-7 из 7");
    expect(text).toContain("Очистить фильтры");
    expect(text).not.toMatch(/\bfrozen\b|\bbuying\b|\bselling\b|\bboth\b|commercialName|monthlyVolume/);
  });
});
