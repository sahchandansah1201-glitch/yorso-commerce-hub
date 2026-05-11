import { expect, test, type Page } from "@playwright/test";

const setSignedInStorage = async (page: Page, lang: "en" | "ru" | "es" = "en") => {
  await page.addInitScript(
    ({ language }) => {
      try {
        window.localStorage.setItem("yorso-lang", language);
        window.sessionStorage.setItem(
          "yorso_buyer_session",
          JSON.stringify({
            id: "b_e2e_account_workspace",
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

const openAccount = async (
  page: Page,
  section: string,
  lang: "en" | "ru" | "es" = "en",
) => {
  await setSignedInStorage(page, lang);
  await page.goto(`/account/${section}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("account-content")).toBeVisible();
};

const accountMainText = async (page: Page) =>
  (await page.locator("main").textContent()) ?? "";

const pageHasNoHorizontalOverflow = async (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const parseOverviewPercent = async (page: Page) => {
  const raw = await page.getByTestId("account-overview-percent").first().textContent();
  return Number((raw ?? "").replace(/[^\d]/g, ""));
};

test.describe("/account workspace sections", () => {
  test("signed-out users see the account sign-in gate", async ({ page }) => {
    await page.goto("/account/company", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("account-signin-required")).toBeVisible();
    await expect(page.getByTestId("account-content")).toHaveCount(0);
  });

  test("desktop sidebar navigates across all account sections", async ({ page }) => {
    await openAccount(page, "personal");

    const sidebar = page.getByTestId("account-sidebar");
    await expect(sidebar).toBeVisible();

    const cases: Array<[string, string, string]> = [
      ["Company profile", "/account/company", "account-section-company"],
      ["Branches", "/account/branches", "account-section-branches"],
      ["Products", "/account/products", "account-section-products"],
      ["Meta-regions", "/account/meta-regions", "account-section-meta-regions"],
      ["Notifications", "/account/notifications", "account-section-notifications"],
      ["Personal info", "/account/personal", "account-section-personal"],
    ];

    for (const [label, url, testId] of cases) {
      await sidebar.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`${url}$`));
      await expect(page.getByTestId(testId)).toBeVisible();
    }
  });

  test("company media edit saves logo and cover URLs and survives reload", async ({ page }) => {
    await openAccount(page, "company");

    const beforePercent = await parseOverviewPercent(page);
    const media = page.getByTestId("account-card-company-media");
    const logoUrl =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZmY2YjAwIi8+PC9zdmc+";
    const coverUrl =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0ODAiIGhlaWdodD0iMjcwIj48cmVjdCB3aWR0aD0iNDgwIiBoZWlnaHQ9IjI3MCIgZmlsbD0iIzE0MmEzYiIvPjwvc3ZnPg==";

    await media.getByTestId("account-card-company-media-edit").click();
    await media.getByTestId("account-media-logo-url").fill(logoUrl);
    await media.getByTestId("account-media-cover-url").fill(coverUrl);
    await media.getByTestId("account-media-focal-bottom").click();
    await media.getByTestId("account-card-company-media-save").click();

    await expect(media.getByTestId("account-card-company-media-edit")).toBeVisible();
    await expect(media.getByTestId("account-media-logo-preview")).toHaveAttribute("src", logoUrl);
    await expect(media.getByTestId("account-media-cover-preview")).toHaveAttribute("src", coverUrl);
    await expect.poll(() => parseOverviewPercent(page)).toBeGreaterThan(beforePercent);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-media-logo-preview")).toHaveAttribute("src", logoUrl);
    await expect(page.getByTestId("account-media-cover-preview")).toHaveAttribute("src", coverUrl);
  });

  test("supporting sections expose procurement data without raw internal enums", async ({ page }) => {
    await openAccount(page, "branches");
    await expect(page.getByTestId("account-branches-explainer")).toContainText(/delivery basis|Incoterms/i);
    await expect(page.getByTestId("account-branch-br_1")).toBeVisible();
    await expect(page.getByTestId("account-branch-br_2")).toBeVisible();

    await page.goto("/account/meta-regions", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-meta-mr_1")).toBeVisible();
    await expect(page.getByTestId("account-meta-mr_3")).toBeVisible();
    expect(await accountMainText(page)).not.toMatch(/similar_freight_cost|same_warehouse_route/);

    await page.goto("/account/notifications", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-notif-email")).toBeVisible();
    await expect(page.getByTestId("account-notif-messenger")).toBeVisible();
    await expect(page.getByTestId("account-notif-in_app")).toBeVisible();
    await expect(page.getByTestId("account-notif-agent")).toBeVisible();
    expect(await accountMainText(page)).not.toMatch(/price_access_approved|new_matching_product|rfq_response/);
  });

  test("RU products and notifications pages avoid English system enum leaks", async ({ page }) => {
    await openAccount(page, "products", "ru");

    const tableText = (await page.getByTestId("account-products-table").textContent()) ?? "";
    expect(tableText).toContain("Замороженный");
    expect(tableText).not.toMatch(/\b(frozen|fresh|alive|buying|selling|both)\b/i);

    await page.goto("/account/notifications", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const mainText = await accountMainText(page);
    expect(mainText).toContain("Уведомления");
    expect(mainText).not.toMatch(/price_access_approved|new_matching_product|rfq_response/);
  });

  test("mobile account sections do not create document-level horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });

    for (const section of [
      "personal",
      "company",
      "branches",
      "products",
      "meta-regions",
      "notifications",
    ]) {
      await openAccount(page, section);
      await expect(page.getByTestId(`account-section-${section}`)).toBeVisible();
      await expect.poll(() => pageHasNoHorizontalOverflow(page)).toBe(true);
    }
  });
});
