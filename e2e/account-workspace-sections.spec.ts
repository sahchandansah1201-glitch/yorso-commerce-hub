import { Buffer } from "node:buffer";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { installBuyerSession, type E2ELang } from "./helpers/buyer-session";

const LOGO_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZmY2YjAwIi8+PC9zdmc+";
const COVER_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0ODAiIGhlaWdodD0iMjcwIj48cmVjdCB3aWR0aD0iNDgwIiBoZWlnaHQ9IjI3MCIgZmlsbD0iIzE0MmEzYiIvPjwvc3ZnPg==";
const MEDIA_LOGO_ALT = "Atlantic Bridge orange logo";
const MEDIA_COVER_ALT = "Atlantic Bridge frozen seafood cover";
const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lM8VxQAAAABJRU5ErkJggg==",
  "base64",
);

const openAccount = async (
  page: Page,
  section: string,
  lang: E2ELang = "en",
) => {
  await installBuyerSession(page, {
    id: "b_e2e_account_workspace",
    lang,
  });
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

const openCompanyMediaEdit = async (page: Page): Promise<Locator> => {
  await openAccount(page, "company");
  const media = page.getByTestId("account-card-company-media");
  await media.getByTestId("account-card-company-media-edit").click();
  await expect(media.getByTestId("account-card-company-media-save")).toBeVisible();
  return media;
};

const fillCompanyMedia = async (media: Locator) => {
  await media.getByTestId("account-media-logo-url").fill(LOGO_URL);
  await media.getByTestId("account-media-logo-alt").fill(MEDIA_LOGO_ALT);
  await media.getByTestId("account-media-logo-fit").selectOption("cover");
  await media.getByTestId("account-media-cover-url").fill(COVER_URL);
  await media.getByTestId("account-media-cover-alt").fill(MEDIA_COVER_ALT);
  await media.getByTestId("account-media-focal-bottom").click();
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

    await media.getByTestId("account-card-company-media-edit").click();
    await fillCompanyMedia(media);
    await media.getByTestId("account-card-company-media-save").click();

    await expect(media.getByTestId("account-card-company-media-edit")).toBeVisible();
    await expect(media.getByTestId("account-media-logo-preview")).toHaveAttribute("src", LOGO_URL);
    await expect(media.getByTestId("account-media-cover-preview")).toHaveAttribute("src", COVER_URL);
    await expect.poll(() => parseOverviewPercent(page)).toBeGreaterThan(beforePercent);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-media-logo-preview")).toHaveAttribute("src", LOGO_URL);
    await expect(page.getByTestId("account-media-cover-preview")).toHaveAttribute("src", COVER_URL);
  });

  test("company media edit previews reflect URL, alt, logo fit and cover focal controls", async ({
    page,
  }) => {
    const media = await openCompanyMediaEdit(page);

    await fillCompanyMedia(media);

    await expect(media.getByTestId("account-media-logo-edit-preview")).toHaveAttribute(
      "src",
      LOGO_URL,
    );
    await expect(media.getByTestId("account-media-logo-edit-preview")).toHaveAttribute(
      "alt",
      MEDIA_LOGO_ALT,
    );
    await expect(media.getByTestId("account-media-logo-edit-preview")).toHaveCSS(
      "object-fit",
      "cover",
    );
    await expect(media.getByTestId("account-media-cover-edit-preview")).toHaveAttribute(
      "src",
      COVER_URL,
    );
    await expect(media.getByTestId("account-media-cover-edit-preview")).toHaveAttribute(
      "alt",
      MEDIA_COVER_ALT,
    );
    await expect(media.getByTestId("account-media-cover-edit-preview")).toHaveCSS(
      "object-position",
      "50% 100%",
    );
    await expect(media.getByTestId("account-media-focal-bottom")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  test("saved company media propagates into supplier profile preview", async ({ page }) => {
    const media = await openCompanyMediaEdit(page);

    await fillCompanyMedia(media);
    await media.getByTestId("account-card-company-media-save").click();

    const supplierPreview = page.getByTestId("account-supplier-preview");
    await expect(supplierPreview.getByTestId("account-supplier-preview-logo")).toHaveAttribute(
      "src",
      LOGO_URL,
    );
    await expect(supplierPreview.getByTestId("account-supplier-preview-logo")).toHaveAttribute(
      "alt",
      MEDIA_LOGO_ALT,
    );
    await expect(supplierPreview.getByTestId("account-supplier-preview-logo")).toHaveCSS(
      "object-fit",
      "cover",
    );
    await expect(supplierPreview.getByTestId("account-supplier-preview-cover")).toHaveAttribute(
      "src",
      COVER_URL,
    );
    await expect(supplierPreview.getByTestId("account-supplier-preview-cover")).toHaveAttribute(
      "alt",
      MEDIA_COVER_ALT,
    );
    await expect(supplierPreview.getByTestId("account-supplier-preview-cover")).toHaveCSS(
      "object-position",
      "50% 100%",
    );
  });

  test("media clear controls remove saved logo and cover and reduce completion", async ({
    page,
  }) => {
    const media = await openCompanyMediaEdit(page);

    await fillCompanyMedia(media);
    await media.getByTestId("account-card-company-media-save").click();
    const filledPercent = await parseOverviewPercent(page);

    await media.getByTestId("account-card-company-media-edit").click();
    await media.getByTestId("account-media-logo-clear").click();
    await media.getByTestId("account-media-cover-clear").click();
    await media.getByTestId("account-card-company-media-save").click();

    await expect(media.getByTestId("account-media-logo-preview")).toHaveCount(0);
    await expect(media.getByTestId("account-media-cover-preview")).toHaveCount(0);
    await expect(page.getByTestId("account-supplier-preview-logo")).toHaveCount(0);
    await expect(page.getByTestId("account-supplier-preview-cover")).toHaveCount(0);
    await expect.poll(() => parseOverviewPercent(page)).toBeLessThan(filledPercent);
  });

  test("company media file upload produces data URLs without stealing focus from save flow", async ({
    page,
  }) => {
    const media = await openCompanyMediaEdit(page);

    await media.getByTestId("account-media-logo-file").setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: ONE_PIXEL_PNG,
    });
    await media.getByTestId("account-media-cover-file").setInputFiles({
      name: "cover.png",
      mimeType: "image/png",
      buffer: ONE_PIXEL_PNG,
    });

    await expect(media.getByTestId("account-media-logo-edit-preview")).toHaveAttribute(
      "src",
      /^data:image\/png;base64,/,
    );
    await expect(media.getByTestId("account-media-cover-edit-preview")).toHaveAttribute(
      "src",
      /^data:image\/png;base64,/,
    );

    await media.getByTestId("account-card-company-media-save").focus();
    await expect(media.getByTestId("account-card-company-media-save")).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(media.getByTestId("account-media-logo-preview")).toHaveAttribute(
      "src",
      /^data:image\/png;base64,/,
    );
    await expect(media.getByTestId("account-media-cover-preview")).toHaveAttribute(
      "src",
      /^data:image\/png;base64,/,
    );
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
    expect(tableText).toContain("Мороженный");
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
