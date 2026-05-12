import { expect, test, type Page } from "@playwright/test";

const setSignedInStorage = async (page: Page, lang: "en" | "ru" | "es" = "en") => {
  await page.addInitScript(
    ({ language }) => {
      try {
        window.localStorage.setItem("yorso-lang", language);
        window.sessionStorage.setItem(
          "yorso_buyer_session",
          JSON.stringify({
            id: "b_e2e_account_branches",
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

const openBranches = async (page: Page, lang: "en" | "ru" | "es" = "en") => {
  await setSignedInStorage(page, lang);
  await page.goto("/account/branches", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-section-branches")).toBeVisible({ timeout: 15_000 });
};

const mainText = async (page: Page) => (await page.locator("main").textContent()) ?? "";

const expectStorageContains = async (page: Page, expected: string) => {
  await expect
    .poll(async () =>
      page.evaluate((needle) => localStorage.getItem("yorso_account_profile_v1")?.includes(needle), expected),
    )
    .toBe(true);
};

const fillBranchForm = async (
  page: Page,
  values: {
    name: string;
    type:
      | "registered_address"
      | "office"
      | "warehouse"
      | "processing_plant"
      | "sales_office"
      | "loading_point";
    country: string;
    region: string;
    city: string;
    address: string;
    incoterms: string;
    pickup: string;
    notes: string;
  },
) => {
  await page.getByTestId("account-branch-name").fill(values.name);
  await page.getByTestId("account-branch-type").selectOption(values.type);
  await page.getByTestId("account-branch-country").fill(values.country);
  await page.getByTestId("account-branch-region").fill(values.region);
  await page.getByTestId("account-branch-city").fill(values.city);
  await page.getByTestId("account-branch-address").fill(values.address);
  await page.getByTestId("account-branch-incoterms").fill(values.incoterms);
  await page.getByTestId("account-branch-pickup").fill(values.pickup);
  await page.getByTestId("account-branch-notes").fill(values.notes);
};

test.describe("/account/branches · editable branch and loading point matrix", () => {
  test("adds a loading point and persists it after reload", async ({ page }) => {
    await openBranches(page);

    await page.getByTestId("account-branch-add").click();
    await fillBranchForm(page, {
      name: "Rotterdam Reefer Hub",
      type: "loading_point",
      country: "Netherlands",
      region: "South Holland",
      city: "Rotterdam",
      address: "Waalhaven 10",
      incoterms: "fca",
      pickup: "Port of Rotterdam",
      notes: "Cross-dock point for North Sea and EU buyers.",
    });
    await page.getByTestId("account-branch-save").click();

    const section = page.getByTestId("account-section-branches");
    await expect(section).toContainText("Rotterdam Reefer Hub");
    await expect(section).toContainText("Loading point");
    await expect(section).toContainText("FCA");
    await expect(section).toContainText("Port of Rotterdam");
    await expectStorageContains(page, "Rotterdam Reefer Hub");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-section-branches")).toContainText("Rotterdam Reefer Hub");
  });

  test("validation keeps incomplete branches out of the list", async ({ page }) => {
    await openBranches(page);

    await page.getByTestId("account-branch-add").click();
    await page.getByTestId("account-branch-save").click();

    await expect(page.getByTestId("account-branch-form")).toBeVisible();
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(6);
    expect(await mainText(page)).not.toContain("branch_");
  });

  test("edits an existing branch without exposing raw branch type values", async ({ page }) => {
    await openBranches(page);

    await page.getByTestId("account-branch-edit-br_2").click();
    await page.getByTestId("account-branch-name").fill("Algeciras Cold Hub");
    await page.getByTestId("account-branch-type").selectOption("warehouse");
    await page.getByTestId("account-branch-incoterms").fill("dap");
    await page.getByTestId("account-branch-pickup").fill("Algeciras cold store");
    await page.getByTestId("account-branch-save").click();

    const text = await mainText(page);
    expect(text).toContain("Algeciras Cold Hub");
    expect(text).toContain("Warehouse");
    expect(text).toContain("DAP");
    expect(text).not.toMatch(/registered_address|processing_plant|sales_office|loading_point/);
    await expectStorageContains(page, "Algeciras Cold Hub");
  });

  test("deletes a branch and keeps the removal after reload", async ({ page }) => {
    await openBranches(page);

    await page.getByTestId("account-branch-add").click();
    await fillBranchForm(page, {
      name: "Trial Vigo Pickup",
      type: "office",
      country: "Spain",
      region: "Galicia",
      city: "Vigo",
      address: "Test street 1",
      incoterms: "exw",
      pickup: "Vigo office",
      notes: "Temporary commercial pickup point.",
    });
    await page.getByTestId("account-branch-save").click();
    await expect(page.getByTestId("account-section-branches")).toContainText("Trial Vigo Pickup");

    await page.getByRole("button", { name: /delete branch: trial vigo pickup/i }).click();

    await expect(page.getByTestId("account-section-branches")).not.toContainText("Trial Vigo Pickup");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-section-branches")).not.toContainText(
      "Trial Vigo Pickup",
    );
  });

  test("Russian branch editing stays localized and hides raw branch type enum values", async ({
    page,
  }) => {
    await openBranches(page, "ru");

    await expect(page.getByTestId("account-section-branches")).toContainText(
      "Филиалы и точки отгрузки",
    );
    await page.getByTestId("account-branch-add").click();
    await fillBranchForm(page, {
      name: "Склад Клайпеда",
      type: "warehouse",
      country: "Литва",
      region: "Клайпедский уезд",
      city: "Клайпеда",
      address: "Minijos 180",
      incoterms: "fca",
      pickup: "Порт Клайпеда",
      notes: "Холодный склад для белой рыбы.",
    });
    await page.getByTestId("account-branch-save").click();

    const text = await mainText(page);
    expect(text).toContain("Склад Клайпеда");
    expect(text).toContain("Склад");
    expect(text).toContain("FCA");
    expect(text).not.toMatch(/registered_address|processing_plant|sales_office|loading_point|warehouse/);
  });
});
