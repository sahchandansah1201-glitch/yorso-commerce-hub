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

const addCountry = async (page: Page, name: string) => {
  const combo = page.getByTestId("account-meta-country-combobox");
  await combo.click();
  await combo.fill(name);
  // Combobox auto-adds when the typed value exactly matches a catalog name
  // (lookup is by localized EN/RU/ES name or ISO alpha-2/alpha-3).
  // Close the listbox so subsequent clicks (e.g. Save) are not intercepted.
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("account-meta-selected-countries")).toContainText(name);
};

test.describe("/account/meta-regions · country list builder", () => {
  test("adds a meta-region with picked countries and persists it after reload", async ({ page }) => {
    await openMetaRegions(page);

    await page.getByTestId("account-meta-add").click();
    await page.getByTestId("account-meta-name").fill("Baltic Cold Route");
    await addCountry(page, "Lithuania");
    await addCountry(page, "Latvia");
    await addCountry(page, "Estonia");
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
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-section-meta-regions")).toContainText("Baltic Cold Route");
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

  test("edits an existing meta-region: add and remove a country", async ({ page }) => {
    await openMetaRegions(page);

    await page.getByTestId("account-meta-edit-mr_3").click();
    await page.getByTestId("account-meta-name").fill("LATAM Shrimp Corridor");
    // mr_3 fixture countries: Ecuador, Peru, Honduras
    await addCountry(page, "India");
    await page.getByTestId("account-meta-remove-country-hn").click();
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
    await addCountry(page, "Chile");
    await addCountry(page, "Peru");
    await page.getByTestId("account-meta-save").click();
    await expect(page.getByTestId("account-section-meta-regions")).toContainText("Trial Freight Zone");

    await page
      .getByRole("button", { name: /delete meta-region: trial freight zone/i })
      .click();

    await expect(page.getByTestId("account-section-meta-regions")).not.toContainText("Trial Freight Zone");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-section-meta-regions")).not.toContainText("Trial Freight Zone");
  });

  test("duplicate country is not added twice", async ({ page }) => {
    await openMetaRegions(page);

    await page.getByTestId("account-meta-add").click();
    await page.getByTestId("account-meta-name").fill("Dup Region");
    await addCountry(page, "Spain");
    await page.getByTestId("account-meta-country-combobox").fill("Spain");
    await expect(page.getByTestId("account-meta-country-duplicate")).toBeVisible();
    await expect(page.getByTestId("account-meta-selected-country-es")).toHaveCount(1);
  });

  test("Russian meta-regions stay localized while editing", async ({ page }) => {
    await openMetaRegions(page, "ru");

    await expect(page.getByTestId("account-section-meta-regions")).toContainText("Мета-регионы");
    await page.getByTestId("account-meta-add").click();
    await page.getByTestId("account-meta-name").fill("Балтийский холодный маршрут");
    await addCountry(page, "Литва");
    await addCountry(page, "Латвия");
    await addCountry(page, "Эстония");
    await page.getByTestId("account-meta-save").click();

    const text = await mainText(page);
    expect(text).toContain("Балтийский холодный маршрут");
    expect(text).toContain("Литва");
    expect(text).not.toMatch(/same_customs_zone|landed_cost|supplier_matching|notifications/);
  });
});
