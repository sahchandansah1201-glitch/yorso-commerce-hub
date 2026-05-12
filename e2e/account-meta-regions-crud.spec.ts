import { expect, test, type Page } from "@playwright/test";

const setSignedInStorage = async (page: Page, lang: "en" | "ru" | "es" = "en") => {
  await page.addInitScript(
    ({ language }) => {
      try {
        window.localStorage.setItem("yorso-lang", language);
        window.sessionStorage.setItem(
          "yorso_buyer_session",
          JSON.stringify({
            id: "b_e2e_account_meta_regions",
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

const openMetaRegions = async (page: Page, lang: "en" | "ru" | "es" = "en") => {
  await setSignedInStorage(page, lang);
  await page.goto("/account/meta-regions", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-section-meta-regions")).toBeVisible({ timeout: 15_000 });
};

const mainText = async (page: Page) => (await page.locator("main").textContent()) ?? "";

const expectStorageContains = async (page: Page, expected: string) => {
  await expect
    .poll(async () =>
      page.evaluate((needle) => localStorage.getItem("yorso_account_profile_v1")?.includes(needle), expected),
    )
    .toBe(true);
};

const fillMetaRegionForm = async (
  page: Page,
  values: {
    name: string;
    countries: string;
    reason:
      | "similar_freight_cost"
      | "same_customs_zone"
      | "same_sales_market"
      | "same_warehouse_route"
      | "manual";
    currency: string;
    notes: string;
    uses?: Array<
      "notifications" | "price_access" | "campaigns" | "landed_cost" | "supplier_matching"
    >;
  },
) => {
  await page.getByTestId("account-meta-name").fill(values.name);
  await page.getByTestId("account-meta-countries").fill(values.countries);
  await page.getByTestId("account-meta-reason").selectOption(values.reason);
  await page.getByTestId("account-meta-currency").fill(values.currency);
  await page.getByTestId("account-meta-notes").fill(values.notes);

  if (values.uses) {
    for (const use of [
      "notifications",
      "price_access",
      "campaigns",
      "landed_cost",
      "supplier_matching",
    ] as const) {
      const checkbox = page.getByTestId(`account-meta-use-${use}`);
      const shouldBeChecked = values.uses.includes(use);
      if ((await checkbox.isChecked()) !== shouldBeChecked) {
        await checkbox.click();
      }
    }
  }
};

test.describe("/account/meta-regions · editable logistics groups", () => {
  test("adds a meta-region and persists it after reload", async ({ page }) => {
    await openMetaRegions(page);

    await page.getByTestId("account-meta-add").click();
    await fillMetaRegionForm(page, {
      name: "Baltic Cold Route",
      countries: "Lithuania, Latvia, Estonia",
      reason: "same_warehouse_route",
      currency: "eur",
      notes: "Shared reefer route through Klaipeda and Riga.",
      uses: ["landed_cost", "supplier_matching", "notifications"],
    });
    await page.getByTestId("account-meta-save").click();

    const section = page.getByTestId("account-section-meta-regions");
    await expect(section).toContainText("Baltic Cold Route");
    await expect(section).toContainText("Lithuania");
    await expect(section).toContainText("Same warehouse route");
    await expect(section).toContainText("EUR");
    await expectStorageContains(page, "Baltic Cold Route");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-section-meta-regions")).toContainText(
      "Baltic Cold Route",
    );
  });

  test("validation keeps incomplete meta-regions out of the list", async ({ page }) => {
    await openMetaRegions(page);

    await page.getByTestId("account-meta-add").click();
    await page.getByTestId("account-meta-name").fill("");
    await page.getByTestId("account-meta-countries").fill("");
    await page.getByTestId("account-meta-currency").fill("");
    await page.getByTestId("account-meta-save").click();

    await expect(page.getByTestId("account-meta-form")).toBeVisible();
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(3);
    expect(await mainText(page)).not.toContain("meta_");
  });

  test("edits an existing meta-region without exposing raw logistics enums", async ({ page }) => {
    await openMetaRegions(page);

    await page.getByTestId("account-meta-edit-mr_3").click();
    await page.getByTestId("account-meta-name").fill("LATAM Shrimp Corridor");
    await page.getByTestId("account-meta-reason").selectOption("similar_freight_cost");
    await page.getByTestId("account-meta-countries").fill("Ecuador, Peru, Honduras, India");
    await page.getByTestId("account-meta-save").click();

    const text = await mainText(page);
    expect(text).toContain("LATAM Shrimp Corridor");
    expect(text).toContain("Similar freight cost");
    expect(text).toContain("India");
    expect(text).not.toMatch(/similar_freight_cost|same_warehouse_route|supplier_matching/);
    await expectStorageContains(page, "LATAM Shrimp Corridor");
  });

  test("deletes a meta-region and keeps the removal after reload", async ({ page }) => {
    await openMetaRegions(page);

    await page.getByTestId("account-meta-add").click();
    await fillMetaRegionForm(page, {
      name: "Trial Freight Zone",
      countries: "Chile, Peru",
      reason: "manual",
      currency: "USD",
      notes: "Temporary test route.",
      uses: ["campaigns"],
    });
    await page.getByTestId("account-meta-save").click();
    await expect(page.getByTestId("account-section-meta-regions")).toContainText(
      "Trial Freight Zone",
    );

    await page
      .getByRole("button", { name: /delete meta-region: trial freight zone/i })
      .click();

    await expect(page.getByTestId("account-section-meta-regions")).not.toContainText(
      "Trial Freight Zone",
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-section-meta-regions")).not.toContainText(
      "Trial Freight Zone",
    );
  });

  test("Russian meta-regions stay localized while editing", async ({ page }) => {
    await openMetaRegions(page, "ru");

    await expect(page.getByTestId("account-section-meta-regions")).toContainText("Мета-регионы");
    await page.getByTestId("account-meta-add").click();
    await fillMetaRegionForm(page, {
      name: "Балтийский холодный маршрут",
      countries: "Литва, Латвия, Эстония",
      reason: "same_customs_zone",
      currency: "EUR",
      notes: "Единая таможенная и логистическая зона.",
      uses: ["notifications", "landed_cost"],
    });
    await page.getByTestId("account-meta-save").click();

    const text = await mainText(page);
    expect(text).toContain("Балтийский холодный маршрут");
    expect(text).toContain("Одна таможенная зона");
    expect(text).toContain("Уведомления");
    expect(text).not.toMatch(/same_customs_zone|landed_cost|supplier_matching|notifications/);
  });
});
