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
    expect(text).not.toMatch(/\bfrozen\b|\bbuying\b|\bselling\b|\bboth\b/);
  });
});
