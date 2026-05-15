/**
 * E2E · /suppliers/:id · supplier profile detail runtime contract.
 *
 * Batch #57 browser-level guard:
 * - registered buyers can submit the one-click supplier access request without
 *   exposing real supplier identity, contacts, legal values or exact breadth;
 * - local/mock approval events show the refresh banner and unlock only the
 *   matching supplier profile;
 * - unrelated supplier approval events do not unlock the current profile;
 * - unknown supplier ids render the not-found route without stale structured
 *   data from a previously opened supplier profile.
 */
import { expect, test, type Page } from "@playwright/test";

const SUPPLIER_PATH = "/suppliers/sup-no-001";
const UNKNOWN_SUPPLIER_PATH = "/suppliers/sup-not-real";
const SUPPLIER_ID = "sup-no-001";
const OTHER_SUPPLIER_ID = "sup-cn-207";
const COMPANY_NAME = "Nordfjord Sjømat AS";
const MASKED_NAME = "Norwegian salmon producer · NO-114";
const ABOUT_COPY = "Family-owned Norwegian salmon producer";
const WEBSITE_HOST = "example-nordfjord.no";
const WHATSAPP_DIGITS = "475550114";
const ACTIVE_OFFERS_COUNT = 14;
const ACCESS_STORAGE_KEY = "yorso_supplier_access_requests";
const ACCESS_CHANGE_EVENT = "yorso:supplier-access-change";

const installRegisteredStorage = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("yorso-lang", "en");
      window.localStorage.removeItem("yorso_supplier_access_requests");
      window.localStorage.removeItem("yorso_supplier_access_notifications");
      window.localStorage.removeItem("yorso_backend_access_notifications_seen");
      window.sessionStorage.removeItem("yorso_supplier_access_requests");
      window.sessionStorage.removeItem("yorso_buyer_qualification");
      window.sessionStorage.removeItem("yorso_buyer_qualified");
      window.sessionStorage.setItem(
        "yorso_buyer_session",
        JSON.stringify({
          id: "b_e2e_supplier_profile_detail",
          identifier: "buyer@example.com",
          method: "email",
          signedInAt: new Date().toISOString(),
          displayName: "buyer",
        }),
      );
    } catch {
      /* ignore */
    }
  });
};

const gotoRegisteredSupplier = async (page: Page) => {
  await installRegisteredStorage(page);
  await page.goto(SUPPLIER_PATH, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("supplier-request-price-access")).toBeVisible({
    timeout: 15_000,
  });
};

const bodyText = async (page: Page) => (await page.locator("body").textContent()) ?? "";

const headText = async (page: Page) =>
  page.evaluate(() => `${document.title}\n${document.head.innerHTML}`);

const assertNoRestrictedSupplierValues = async (page: Page) => {
  const text = await bodyText(page);
  const head = await headText(page);
  for (const source of [text, head]) {
    expect(source).not.toContain(COMPANY_NAME);
    expect(source).not.toContain(ABOUT_COPY);
    expect(source).not.toContain(WEBSITE_HOST);
    expect(source).not.toContain(WHATSAPP_DIGITS);
    expect(source).not.toMatch(new RegExp(`${ACTIVE_OFFERS_COUNT}\\s*active\\s*offers`, "i"));
    expect(source).not.toMatch(/Org\.\s*nr|Brønnøysund|\bVAT\b|\bEORI\b|Aksjeselskap/i);
  }
  await expect(page.locator(`#itemlist-jsonld-${SUPPLIER_ID}`)).toHaveCount(0);
};

const dispatchApprovedAccess = async (page: Page, supplierId: string) => {
  await page.evaluate(
    ({ key, eventName, supplierId }) => {
      const now = new Date().toISOString();
      const request = {
        supplierId,
        intent: "exact_price",
        status: "approved",
        sentAt: now,
        pendingAt: now,
        approvedAt: now,
        reasons: ["exact_price"],
        message: "",
      };
      const store = { [supplierId]: request };
      window.localStorage.setItem(key, JSON.stringify(store));
      window.sessionStorage.setItem(key, JSON.stringify(store));
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: {
            supplierId,
            status: "approved",
            source: "mock_progression",
            changedAt: now,
            intent: "exact_price",
          },
        }),
      );
    },
    { key: ACCESS_STORAGE_KEY, eventName: ACCESS_CHANGE_EVENT, supplierId },
  );
};

test.describe("/suppliers/:id · profile detail runtime", () => {
  test("registered buyer submits one-click access request without identity leakage", async ({ page }) => {
    await gotoRegisteredSupplier(page);

    await page.getByTestId("supplier-request-price-access").click();
    const status = page.getByTestId("supplier-access-request-status");
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute("data-status", /sent|pending/);
    await expect(status).toContainText(MASKED_NAME);

    await assertNoRestrictedSupplierValues(page);
    await expect(page.getByTestId("supplier-display-name").first()).toContainText(MASKED_NAME);

    const storedStatus = await page.evaluate(
      ({ key, supplierId }) => {
        const parsed = JSON.parse(window.localStorage.getItem(key) || "{}");
        return parsed[supplierId]?.status ?? null;
      },
      { key: ACCESS_STORAGE_KEY, supplierId: SUPPLIER_ID },
    );
    expect(["sent", "pending"]).toContain(storedStatus);
  });

  test("mock approval event shows refresh banner and unlocks the matching supplier", async ({ page }) => {
    await gotoRegisteredSupplier(page);
    await dispatchApprovedAccess(page, SUPPLIER_ID);

    await expect(page.getByTestId("supplier-access-refresh-banner")).toBeVisible();
    await page.getByTestId("supplier-access-refresh-now").click();

    await expect(page.getByTestId("supplier-display-name").first()).toContainText(COMPANY_NAME);
    await expect(page.getByTestId("supplier-cta-block")).toContainText("SEND MESSAGE");
    await expect(page.getByTestId("supplier-cta-block")).toContainText("WhatsApp");
    await expect(page.locator(`#itemlist-jsonld-${SUPPLIER_ID}`)).toHaveCount(1);

    const text = await bodyText(page);
    expect(text).toContain(COMPANY_NAME);
    expect(text).toMatch(new RegExp(`${ACTIVE_OFFERS_COUNT}\\s*active\\s*offers`, "i"));
    expect(await headText(page)).toContain(COMPANY_NAME);
  });

  test("approval event for another supplier does not unlock the current profile", async ({ page }) => {
    await gotoRegisteredSupplier(page);
    await dispatchApprovedAccess(page, OTHER_SUPPLIER_ID);

    await expect(page.getByTestId("supplier-access-refresh-banner")).toHaveCount(0);
    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
    await expect(page.getByTestId("supplier-display-name").first()).toContainText(MASKED_NAME);
    await assertNoRestrictedSupplierValues(page);
  });

  test("unknown supplier renders not found without stale supplier structured data", async ({ page }) => {
    await gotoRegisteredSupplier(page);
    await expect(page.getByTestId("supplier-display-name").first()).toContainText(MASKED_NAME);

    await page.goto(UNKNOWN_SUPPLIER_PATH, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /supplier not found/i })).toBeVisible();
    await expect(
      page.locator("main").getByRole("link", { name: /^supplier directory$/i }),
    ).toBeVisible();

    const text = await bodyText(page);
    expect(text).not.toContain(COMPANY_NAME);
    expect(text).not.toContain(MASKED_NAME);
    await expect(page.locator('[id^="itemlist-jsonld-"]')).toHaveCount(0);
    await expect(page.locator('[id^="org-jsonld-"]')).toHaveCount(0);
    await expect(page.locator('[id^="faq-jsonld-"]')).toHaveCount(0);
  });
});
