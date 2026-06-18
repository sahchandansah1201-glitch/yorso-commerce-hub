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
  await expect(page.getByTestId("account-section-meta-regions")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("account-meta-add")).toBeVisible({ timeout: 15_000 });
};

const mainText = async (page: Page) => (await page.locator("main").textContent()) ?? "";

const expectStorageContains = async (page: Page, expected: string) => {
  await expect
    .poll(async () =>
      page.evaluate((needle) => localStorage.getItem("yorso_account_profile_v1")?.includes(needle), expected),
    )
    .toBe(true);
};

const selectCountryFromList = async (
  page: Page,
  query: string,
  countryId: string,
  expectedName: string,
) => {
  const combo = page.getByTestId("account-meta-country-combobox");
  await combo.click();
  await combo.fill(query);
  await expect(combo).toHaveValue(query);
  const option = page.getByTestId(`account-meta-country-combobox-option-${countryId}`);
  await expect(option).toBeVisible();
  await option.click();
  await expect(page.getByTestId(`account-meta-selected-country-${countryId}`)).toContainText(
    expectedName,
  );
};

test.describe("/account/meta-regions · country list builder", () => {
  test("adds a meta-region with picked countries and persists it after reload", async ({ page }) => {
    await openMetaRegions(page);

    await page.getByTestId("account-meta-add").click();
    await page.getByTestId("account-meta-name").fill("Baltic Cold Route");
    await selectCountryFromList(page, "Lith", "lt", "Lithuania");
    await selectCountryFromList(page, "Latv", "lv", "Latvia");
    await selectCountryFromList(page, "Esto", "ee", "Estonia");
    await page.keyboard.press("Escape");
    await page.getByTestId("account-meta-save").click();

    const section = page.getByTestId("account-section-meta-regions");
    await expect(section).toContainText("Baltic Cold Route");
    await expect(section).toContainText("Lithuania");
    await expect(section).toContainText("Latvia");
    await expect(section).toContainText("Estonia");
    // No raw enum leakage in read view
    expect(await mainText(page)).not.toMatch(
      /similar_freight_cost|same_warehouse_route|supplier_matching|landed_cost/,
    );
    await expectStorageContains(page, "Baltic Cold Route");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("account-section-meta-regions")).toContainText("Baltic Cold Route", {
      timeout: 15_000,
    });
  });

  test("validation keeps meta-regions with empty name or countries out of the list", async ({ page }) => {
    await openMetaRegions(page);

    await page.getByTestId("account-meta-add").click();
    await page.getByTestId("account-meta-name").fill("");
    await page.getByTestId("account-meta-save").click();

    await expect(page.getByTestId("account-meta-form")).toBeVisible();
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(2);
    expect(await mainText(page)).not.toContain("meta_");
  });

  test("requires at least two countries and keeps the list ready for repeated selection", async ({ page }) => {
    await openMetaRegions(page);

    await page.getByTestId("account-meta-add").click();
    await page.getByTestId("account-meta-name").fill("South Atlantic Route");

    await selectCountryFromList(page, "Argen", "ar", "Argentina");
    await expect(page.getByTestId("account-meta-country-combobox-listbox")).toBeVisible();
    await expect(page.getByTestId("account-meta-country-combobox-option-ar")).toHaveCount(0);

    await page.getByTestId("account-meta-save").click();
    await expect(page.getByTestId("account-meta-form")).toBeVisible();
    await expect(page.getByText("Add at least 2 countries", { exact: true })).toBeVisible();

    await selectCountryFromList(page, "Braz", "br", "Brazil");
    await page.keyboard.press("Escape");
    await page.getByTestId("account-meta-save").click();

    const section = page.getByTestId("account-section-meta-regions");
    await expect(section).toContainText("South Atlantic Route");
    await expect(section).toContainText("Argentina");
    await expect(section).toContainText("Brazil");
  });

  test("edits an existing meta-region: add and remove a country", async ({ page }) => {
    await openMetaRegions(page);

    await page.getByTestId("account-meta-edit-mr_3").click();
    await page.getByTestId("account-meta-name").fill("LATAM Shrimp Corridor");
    // mr_3 fixture countries: Ecuador, Peru, Honduras
    await selectCountryFromList(page, "Indi", "in", "India");
    await page.getByTestId("account-meta-remove-country-hn").click();
    await page.keyboard.press("Escape");
    await page.getByTestId("account-meta-save").click();

    const text = await mainText(page);
    expect(text).toContain("LATAM Shrimp Corridor");
    expect(text).toContain("India");
    expect(text).not.toContain("Honduras");
    expect(text).not.toMatch(/similar_freight_cost|same_warehouse_route|supplier_matching/);
    await expectStorageContains(page, "LATAM Shrimp Corridor");
  });

  test("deletes a meta-region and keeps the removal after reload", async ({ page }) => {
    await openMetaRegions(page);

    await page.getByTestId("account-meta-add").click();
    await page.getByTestId("account-meta-name").fill("Trial Freight Zone");
    await selectCountryFromList(page, "Chil", "cl", "Chile");
    await selectCountryFromList(page, "Per", "pe", "Peru");
    await page.keyboard.press("Escape");
    await page.getByTestId("account-meta-save").click();
    await expect(page.getByTestId("account-section-meta-regions")).toContainText("Trial Freight Zone");

    await page
      .getByRole("button", { name: /delete meta-region: trial freight zone/i })
      .click();

    await expect(page.getByTestId("account-section-meta-regions")).not.toContainText("Trial Freight Zone");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("account-section-meta-regions")).not.toContainText(
      "Trial Freight Zone",
      { timeout: 15_000 },
    );
  });

  test("duplicate country is not added twice", async ({ page }) => {
    await openMetaRegions(page);

    await page.getByTestId("account-meta-add").click();
    await page.getByTestId("account-meta-name").fill("Dup Region");
    await selectCountryFromList(page, "Spa", "es", "Spain");
    await page.getByTestId("account-meta-country-combobox").fill("Spain");
    await expect(page.getByTestId("account-meta-country-duplicate")).toBeVisible();
    await expect(page.getByTestId("account-meta-selected-country-es")).toHaveCount(1);
  });

  test("Russian meta-regions stay localized while editing", async ({ page }) => {
    await openMetaRegions(page, "ru");

    await expect(page.getByTestId("account-section-meta-regions")).toContainText("Мета-регионы");
    await page.getByTestId("account-meta-add").click();
    await page.getByTestId("account-meta-name").fill("Балтийский холодный маршрут");
    await selectCountryFromList(page, "Лит", "lt", "Литва");
    await selectCountryFromList(page, "Лат", "lv", "Латвия");
    await selectCountryFromList(page, "Эсто", "ee", "Эстония");
    await page.keyboard.press("Escape");
    await page.getByTestId("account-meta-save").click();

    const text = await mainText(page);
    expect(text).toContain("Балтийский холодный маршрут");
    expect(text).toContain("Литва");
    expect(text).not.toMatch(/same_customs_zone|landed_cost|supplier_matching|notifications/);
  });
});
