/**
 * E2E · real self-hosted API access runtime.
 *
 * Batch #65 real self-hosted API browser guard:
 * - the browser talks to a real memory-mode apps/api process;
 * - Vite is built with VITE_YORSO_API_URL pointing at that process;
 * - this spec intentionally uses no Playwright route interception;
 * - supplier access approval unlocks offer detail, offer catalog private search,
 *   and supplier directory private search through the same backend grant state.
 *
 * The wrapper script prints self_hosted_access_runtime_e2e=ok on success.
 */
import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL = process.env.E2E_YORSO_API_URL ?? "";
const ACCOUNT_USER_ID =
  process.env.E2E_YORSO_ACCOUNT_USER_ID ?? "00000000-0000-4000-8000-000000000001";
const SESSION_ID = process.env.E2E_YORSO_SESSION_ID ?? "self-hosted-access-runtime-e2e";

const SUPPLIER_ID = "sup-no-001";
const SUPPLIER_NAME = "Nordfjord Sjømat AS";
const PRODUCT_NAME = "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade";
const EXACT_PRICE = /\$8\.50\s*[–-]\s*\$9\.20/;
const DETAIL_EXACT_PRICE = /\$(?:9\.00\s*[–-]\s*\$9\.20|8\.50\s*[–-]\s*\$8\.70)/;

test.skip(!API_BASE_URL, "E2E_YORSO_API_URL is required for the self-hosted runtime smoke");

const accountHeaders = {
  "content-type": "application/json",
  "x-yorso-user-id": ACCOUNT_USER_ID,
  "x-yorso-session-id": SESSION_ID,
};

async function apiJson(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...accountHeaders,
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`API ${path} failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

async function installRegisteredBuyer(page: Page) {
  await page.addInitScript(
    ({ accountUserId, sessionId }) => {
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
            id: sessionId,
            identifier: `${accountUserId}@self-hosted-e2e.local`,
            method: "email",
            signedInAt: new Date().toISOString(),
            displayName: "self-hosted buyer",
            source: "self_hosted",
            userId: accountUserId,
          }),
        );
      } catch {
        // Storage may be unavailable in edge browser contexts; the test will fail on UI assertions.
      }
    },
    { accountUserId: ACCOUNT_USER_ID, sessionId: SESSION_ID },
  );
}

test.describe.serial("Self-hosted access runtime · real API", () => {
  test.describe.configure({ retries: 0 });

  test("request approval unlocks offer detail, catalog search, and supplier directory search", async ({ page }) => {
    await installRegisteredBuyer(page);

    await page.goto("/offers?q=Nordfjord&sort=origin&rows=20", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toContainText(SUPPLIER_NAME);

    await page.goto("/offers/1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("supplier-request-price-access")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(SUPPLIER_NAME);
    await expect(page.locator("body")).not.toContainText(EXACT_PRICE);

    await page.getByTestId("supplier-request-price-access").click();
    await expect(page.getByTestId("supplier-access-request-status")).toHaveAttribute("data-status", "sent");

    const requestId = await expect
      .poll(async () => {
        const response = await apiJson(`/v1/access/suppliers/${SUPPLIER_ID}/request`);
        return response.request?.status === "sent" ? response.request.id : null;
      }, { timeout: 15_000 })
      .toBeTruthy()
      .then(async () => {
        const response = await apiJson(`/v1/access/suppliers/${SUPPLIER_ID}/request`);
        return response.request.id as string;
      });

    const approval = await apiJson(`/v1/access/supplier-requests/${encodeURIComponent(requestId)}/decision`, {
      method: "POST",
      body: JSON.stringify({ status: "approved" }),
    });
    expect(approval.request?.status).toBe("approved");
    expect(approval.notification?.type).toBe("price_access_approved");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(SUPPLIER_NAME).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("body")).toContainText(DETAIL_EXACT_PRICE);
    await expect(page.getByTestId("supplier-request-price-access")).toHaveCount(0);

    await page.goto("/offers?q=Nordfjord&sort=origin&rows=20", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toContainText(SUPPLIER_NAME, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText("$8.50");

    await page.goto("/suppliers?q=Nordfjord&sort=country&rows=20", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(SUPPLIER_NAME).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("body")).not.toContainText("Pacific Blue Export SAC");
  });
});
