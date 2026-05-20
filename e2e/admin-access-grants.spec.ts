/**
 * E2E · API-backed supplier access grants console.
 *
 * Batch #97 browser guard:
 * - /admin/access-grants uses the self-hosted admin API adapter;
 * - requests carry x-yorso-user-id and x-yorso-session-id;
 * - non-admin API responses render a role guard;
 * - admin revoke posts to /v1/admin/access-grants/:grantId/revoke;
 * - the refreshed list shows expired access without leaking admin email or session id.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000090";
const SESSION_ID = "session_admin_access_grants_e2e_97";
const GRANT_ID = "00000000-0000-4000-8000-000000000397";

interface ApiState {
  revoked: boolean;
  revokeBodies: unknown[];
  requestHeaders: Array<Record<string, string>>;
}

const grantRow = (revoked: boolean) => ({
  ageHours: 5,
  buyer: {
    accountRole: "buyer",
    companyName: "Polar Buyer GmbH",
    countryCode: "DE",
    displayName: "Procurement Manager",
    userId: "00000000-0000-4000-8000-000000000001",
  },
  buyerUserId: "00000000-0000-4000-8000-000000000001",
  expiresAt: revoked ? "2026-05-20T10:30:00.000Z" : null,
  grantedAt: "2026-05-20T09:00:00.000Z",
  grantedByUserId: USER_ID,
  grants: [
    {
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      expiresAt: revoked ? "2026-05-20T10:30:00.000Z" : null,
      grantedAt: "2026-05-20T09:00:00.000Z",
      grantedByUserId: USER_ID,
      id: GRANT_ID,
      offerId: null,
      scope: "supplier_identity",
      supplierId: "sup-no-001",
    },
    {
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      expiresAt: revoked ? "2026-05-20T10:30:00.000Z" : null,
      grantedAt: "2026-05-20T09:00:00.000Z",
      grantedByUserId: USER_ID,
      id: "00000000-0000-4000-8000-000000000398",
      offerId: null,
      scope: "offer_price",
      supplierId: "sup-no-001",
    },
  ],
  id: GRANT_ID,
  isActive: !revoked,
  request: {
    buyerUserId: "00000000-0000-4000-8000-000000000001",
    createdAt: "2026-05-20T08:00:00.000Z",
    decidedAt: "2026-05-20T09:00:00.000Z",
    decidedByUserId: USER_ID,
    id: "00000000-0000-4000-8000-000000000196",
    intent: "exact_price",
    message: "Need exact price",
    status: revoked ? "revoked" : "approved",
    supplierId: "sup-no-001",
    updatedAt: "2026-05-20T09:00:00.000Z",
  },
  scopes: ["offer_price", "supplier_identity"],
  supplier: {
    city: "Ålesund",
    companyName: revoked ? null : "Nordfjord Sjømat AS",
    country: "Norway",
    maskedName: "Norwegian salmon producer",
    supplierId: "sup-no-001",
    verificationLevel: "documents_reviewed",
  },
  supplierId: "sup-no-001",
});

const listPayload = (state: ApiState) => ({
  items: [grantRow(state.revoked)],
  limit: 25,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000297",
  summary: {
    active: state.revoked ? 0 : 1,
    expired: state.revoked ? 1 : 0,
    total: 1,
  },
  total: 1,
});

const revokePayload = () => ({
  accessGranted: false,
  ok: true,
  request: grantRow(true).request,
  requestId: "00000000-0000-4000-8000-000000000497",
  revokedGrants: grantRow(true).grants,
});

const json = async (route: Route, body: unknown, status = 200) => {
  await route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json",
    status,
  });
};

const installAdminSession = async (page: Page) => {
  await page.addInitScript(({ sessionId, userId }) => {
    window.localStorage.setItem("yorso-lang", "en");
    window.sessionStorage.setItem(
      "yorso_buyer_session",
      JSON.stringify({
        displayName: "Admin Grants",
        id: sessionId,
        identifier: "admin@yorso.test",
        method: "email",
        signedInAt: new Date().toISOString(),
        source: "self_hosted",
        userId,
      }),
    );
  }, { sessionId: SESSION_ID, userId: USER_ID });
};

const installGrantsApiMock = async (page: Page, state: ApiState) => {
  await page.route("**/__e2e-api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/__e2e-api/, "");
    const method = request.method();

    if (path === "/v1/admin/access-grants" && method === "GET") {
      state.requestHeaders.push(request.headers());
      await json(route, listPayload(state));
      return;
    }

    if (path === `/v1/admin/access-grants/${GRANT_ID}/revoke` && method === "POST") {
      state.requestHeaders.push(request.headers());
      state.revokeBodies.push(request.postDataJSON());
      state.revoked = true;
      await json(route, revokePayload());
      return;
    }

    await json(route, { ok: false, error: { code: "e2e_unhandled", message: path } }, 404);
  });
};

const expectSessionHeaders = (state: ApiState) => {
  expect(state.requestHeaders.length).toBeGreaterThan(0);
  for (const headers of state.requestHeaders) {
    expect(headers["x-yorso-user-id"]).toBe(USER_ID);
    expect(headers["x-yorso-session-id"]).toBe(SESSION_ID);
  }
};

test.describe("Admin supplier access grants console", () => {
  test("loads active grants, revokes access, and refreshes the row", async ({ page }) => {
    const state: ApiState = {
      revoked: false,
      requestHeaders: [],
      revokeBodies: [],
    };
    await installAdminSession(page);
    await installGrantsApiMock(page, state);

    await page.goto("/admin/access-grants?status=all", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-access-grants-page")).toBeVisible();
    await expect(page.getByTestId("admin-access-grants-table")).toContainText("Polar Buyer GmbH");
    await expect(page.getByTestId(`admin-access-grants-row-${GRANT_ID}`)).toContainText("Nordfjord Sjømat AS");
    await expect(page.getByTestId(`admin-access-grants-row-${GRANT_ID}`)).toContainText("Active");
    await expect(page.getByTestId("admin-access-grants-summary")).toContainText("Active");

    const bodyBefore = await page.locator("body").textContent();
    expect(bodyBefore).not.toContain("admin@yorso.test");
    expect(bodyBefore).not.toContain(SESSION_ID);

    await page.getByTestId(`admin-access-grants-revoke-${GRANT_ID}`).click();

    await expect.poll(() => state.revokeBodies.length).toBe(1);
    expect(state.revokeBodies[0]).toEqual({ reason: "Admin revoked access from console" });
    await expect(page.getByTestId(`admin-access-grants-row-${GRANT_ID}`)).toContainText("Expired");
    await expect(page.getByTestId(`admin-access-grants-row-${GRANT_ID}`)).toContainText("Norwegian salmon producer");
    await expect(page.getByTestId(`admin-access-grants-row-${GRANT_ID}`)).not.toContainText("Nordfjord Sjømat AS");
    expectSessionHeaders(state);
  });

  test("renders admin-role guard from the self-hosted API", async ({ page }) => {
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/access-grants**", async (route) => {
      await json(route, {
        ok: false,
        error: {
          code: "admin_role_required",
          message: "Admin role is required.",
        },
      }, 403);
    });

    await page.goto("/admin/access-grants", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-access-grants-forbidden")).toBeVisible();
    await expect(page.getByText("Admin role required")).toBeVisible();
  });
});
