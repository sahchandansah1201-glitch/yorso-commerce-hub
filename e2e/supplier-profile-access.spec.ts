/**
 * E2E · /suppliers/:id · access-sensitive SupplierProfile contract.
 *
 * This browser-level smoke check complements jsdom tests:
 *   - locked states must not expose real supplier identity, contacts, legal
 *     values, exact active-offer count, or ItemList JSON-LD;
 *   - locked states must still expose public production capability facts and
 *     public trade/logistics terms;
 *   - qualified state unlocks real identity/contact actions;
 *   - downgrade from qualified to registered_locked clears stale head metadata.
 */
import { test, expect, type Page } from "@playwright/test";

const SUPPLIER_PATH = "/suppliers/sup-no-001";
const COMPANY_NAME = "Nordfjord Sjømat AS";
const MASKED_NAME = "Norwegian salmon producer · NO-114";
const ABOUT_COPY = "Family-owned Norwegian salmon producer";
const WEBSITE_HOST = "example-nordfjord.no";
const WHATSAPP_DIGITS = "475550114";
const ACTIVE_OFFERS_COUNT = 14;

const setBaseStorage = async (
  page: Page,
  mode: "anonymous_locked" | "registered_locked" | "qualified_unlocked",
) => {
  await page.addInitScript(
    ({ mode, companyName }) => {
      try {
        window.localStorage.setItem("yorso-lang", "en");
        window.sessionStorage.removeItem("yorso_buyer_session");
        window.sessionStorage.removeItem("yorso_buyer_qualification");
        window.sessionStorage.removeItem("yorso_buyer_qualified");

        if (mode !== "anonymous_locked") {
          window.sessionStorage.setItem(
            "yorso_buyer_session",
            JSON.stringify({
              id: "b_e2e_supplier_access",
              identifier: "buyer@example.com",
              method: "email",
              signedInAt: new Date().toISOString(),
              displayName: "buyer",
            }),
          );
        }

        if (mode === "qualified_unlocked") {
          window.sessionStorage.setItem(
            "yorso_buyer_qualification",
            JSON.stringify({
              companyName,
              approvedAt: new Date().toISOString(),
            }),
          );
        }
      } catch {
        /* ignore */
      }
    },
    { mode, companyName: COMPANY_NAME },
  );
};

const gotoSupplier = async (
  page: Page,
  mode: "anonymous_locked" | "registered_locked" | "qualified_unlocked",
) => {
  await setBaseStorage(page, mode);
  await page.goto(SUPPLIER_PATH, { waitUntil: "domcontentloaded" });
  await page.getByTestId("supplier-display-name").first().waitFor({ state: "visible" });
};

const openProductionPassport = async (page: Page) => {
  await page.getByRole("tab", { name: "Production passport" }).click();
  await expect(page.locator("#passport-production")).toBeVisible();
};

const bodyText = async (page: Page) => (await page.locator("body").textContent()) ?? "";

const headText = async (page: Page) =>
  page.evaluate(() => `${document.title}\n${document.head.innerHTML}`);

const assertNoRestrictedSupplierValues = (text: string) => {
  expect(text).not.toContain(COMPANY_NAME);
  expect(text).not.toContain(ABOUT_COPY);
  expect(text).not.toContain(WEBSITE_HOST);
  expect(text).not.toContain(WHATSAPP_DIGITS);
  expect(text).not.toMatch(new RegExp(`${ACTIVE_OFFERS_COUNT}\\s*active\\s*offers`, "i"));
  expect(text).not.toMatch(/Org\.\s*nr|Brønnøysund|\bVAT\b|\bEORI\b|Aksjeselskap/i);
};

const assertPublicProductionAndLogisticsFacts = (text: string) => {
  expect(text).toMatch(/\d+\s*t\s*\/\s*day/i);
  expect(text).toMatch(/\d+\s*t\s+simultaneous\s+storage/i);
  expect(text).toMatch(/from\s+\d+\s*t\s*\/\s*SKU/i);
  expect(text).toMatch(/\d+[–-]\d+\s*days/i);
  expect(text).toMatch(/\b(?:FOB|FCA|CIF|CFR|DAP)\b/);
};

test.describe("/suppliers/:id · access contract", () => {
  test("anonymous_locked: restricted data hidden, public production/logistics facts visible", async ({ page }) => {
    await gotoSupplier(page, "anonymous_locked");
    await expect(page.getByTestId("supplier-anon-cta")).toBeVisible();

    await openProductionPassport(page);

    const text = await bodyText(page);
    expect(text).toContain(MASKED_NAME);
    assertNoRestrictedSupplierValues(text);
    assertPublicProductionAndLogisticsFacts(text);

    const head = await headText(page);
    expect(head).toContain(MASKED_NAME);
    assertNoRestrictedSupplierValues(head);
    expect(await page.locator(`#itemlist-jsonld-sup-no-001`).count()).toBe(0);
  });

  test("registered_locked: access panel visible, restricted data still hidden", async ({ page }) => {
    await gotoSupplier(page, "registered_locked");
    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();

    await openProductionPassport(page);

    const text = await bodyText(page);
    expect(text).toContain(MASKED_NAME);
    assertNoRestrictedSupplierValues(text);
    assertPublicProductionAndLogisticsFacts(text);

    const head = await headText(page);
    assertNoRestrictedSupplierValues(head);
    expect(await page.locator(`#itemlist-jsonld-sup-no-001`).count()).toBe(0);
  });

  test("qualified_unlocked: real identity and contact actions are available", async ({ page }) => {
    await gotoSupplier(page, "qualified_unlocked");

    await expect(page.getByTestId("supplier-display-name").first()).toContainText(COMPANY_NAME);
    await expect(page.getByTestId("supplier-cta-block")).toContainText("SEND MESSAGE");
    await expect(page.getByTestId("supplier-cta-block")).toContainText("WhatsApp");
    await expect(page.locator(`#itemlist-jsonld-sup-no-001`)).toHaveCount(1);

    const text = await bodyText(page);
    expect(text).toContain(COMPANY_NAME);
    expect(text).toMatch(new RegExp(`${ACTIVE_OFFERS_COUNT}\\s*active\\s*offers`, "i"));
    expect(await headText(page)).toContain(COMPANY_NAME);
  });

  test("qualified_unlocked -> registered_locked: stale identity and ItemList are removed", async ({ page }) => {
    await gotoSupplier(page, "qualified_unlocked");
    await expect(page.locator(`#itemlist-jsonld-sup-no-001`)).toHaveCount(1);
    expect(await headText(page)).toContain(COMPANY_NAME);

    await page.evaluate(() => {
      window.sessionStorage.removeItem("yorso_buyer_qualification");
      window.sessionStorage.removeItem("yorso_buyer_qualified");
      window.dispatchEvent(new CustomEvent("yorso:qualified-change"));
    });

    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
    await expect(page.locator(`#itemlist-jsonld-sup-no-001`)).toHaveCount(0);

    const text = await bodyText(page);
    expect(text).toContain(MASKED_NAME);
    assertNoRestrictedSupplierValues(text);

    const head = await headText(page);
    expect(head).toContain(MASKED_NAME);
    assertNoRestrictedSupplierValues(head);
  });
});
