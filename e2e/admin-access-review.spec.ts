/**
 * E2E · API-backed supplier access review console.
 *
 * Batch #96 browser guard:
 * - /admin/access-requests uses the self-hosted admin API adapter;
 * - requests carry x-yorso-user-id and x-yorso-session-id;
 * - non-admin API responses render a role guard;
 * - admin approval posts to /v1/admin/access-requests/:requestId/decision;
 * - the refreshed queue shows approved requests without leaking admin email or session id.
 *
 * Run through `VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`
 * so Playwright can intercept `__e2e-api/v1/*` without a real backend.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000090";
const SESSION_ID = "session_admin_access_review_e2e_96";
const REQUEST_ID = "00000000-0000-4000-8000-000000000196";

interface ApiState {
  approved: boolean;
  decisionBodies: unknown[];
  requestHeaders: Array<Record<string, string>>;
}

const requestRow = (status: "sent" | "approved") => ({
  ageHours: status === "approved" ? 5 : 4,
  buyer: {
    accountRole: "buyer",
    companyName: "Polar Buyer GmbH",
    countryCode: "DE",
    displayName: "Procurement Manager",
    userId: "00000000-0000-4000-8000-000000000001",
  },
  decisionSla: "fresh",
  request: {
    buyerUserId: "00000000-0000-4000-8000-000000000001",
    createdAt: "2026-05-20T08:00:00.000Z",
    decidedAt: status === "approved" ? "2026-05-20T09:00:00.000Z" : null,
    decidedByUserId: status === "approved" ? USER_ID : null,
    id: REQUEST_ID,
    intent: "exact_price",
    message: "Need exact price for weekly salmon purchasing",
    status,
    supplierId: "sup-no-001",
    updatedAt: "2026-05-20T09:00:00.000Z",
  },
  supplier: {
    city: "Ålesund",
    companyName: status === "approved" ? "Nordfjord Sjømat AS" : null,
    country: "Norway",
    maskedName: "Norwegian salmon producer",
    supplierId: "sup-no-001",
    verificationLevel: "documents_reviewed",
  },
});

const queuePayload = (state: ApiState) => ({
  items: [requestRow(state.approved ? "approved" : "sent")],
  limit: 25,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000296",
  summary: {
    approved: state.approved ? 1 : 0,
    open: state.approved ? 0 : 1,
    pending: 0,
    rejected: 0,
    revoked: 0,
    sent: state.approved ? 0 : 1,
  },
  total: 1,
});

const decisionPayload = () => ({
  grants: [
    {
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      expiresAt: null,
      grantedAt: "2026-05-20T09:00:00.000Z",
      grantedByUserId: USER_ID,
      id: "grant_supplier_identity",
      offerId: null,
      scope: "supplier_identity",
      supplierId: "sup-no-001",
    },
    {
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      expiresAt: null,
      grantedAt: "2026-05-20T09:00:00.000Z",
      grantedByUserId: USER_ID,
      id: "grant_offer_price",
      offerId: null,
      scope: "offer_price",
      supplierId: "sup-no-001",
    },
  ],
  notification: {
    body: "The supplier approved your request. Exact prices and supplier details are now available.",
    buyerUserId: "00000000-0000-4000-8000-000000000001",
    createdAt: "2026-05-20T09:00:00.000Z",
    id: "00000000-0000-4000-8000-000000000396",
    readAt: null,
    status: "unread",
    supplierId: "sup-no-001",
    title: "Price access approved",
    type: "price_access_approved",
  },
  ok: true,
  request: requestRow("approved").request,
  requestId: "00000000-0000-4000-8000-000000000496",
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
        displayName: "Admin Access",
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

const installReviewApiMock = async (page: Page, state: ApiState) => {
  await page.route("**/__e2e-api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/__e2e-api/, "");
    const method = request.method();

    if (path === "/v1/admin/access-requests" && method === "GET") {
      state.requestHeaders.push(request.headers());
      await json(route, queuePayload(state));
      return;
    }

    if (path === `/v1/admin/access-requests/${REQUEST_ID}/decision` && method === "POST") {
      state.requestHeaders.push(request.headers());
      state.decisionBodies.push(request.postDataJSON());
      state.approved = true;
      await json(route, decisionPayload());
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

test.describe("Admin supplier access review console", () => {
  test("loads the queue, approves a request, and refreshes the row", async ({ page }) => {
    const state: ApiState = {
      approved: false,
      decisionBodies: [],
      requestHeaders: [],
    };
    await installAdminSession(page);
    await installReviewApiMock(page, state);

    await page.goto("/admin/access-requests?status=all", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-access-review-page")).toBeVisible();
    await expect(page.getByTestId("admin-access-review-queue")).toContainText("Polar Buyer GmbH");
    await expect(page.getByTestId(`admin-access-review-row-${REQUEST_ID}`)).toContainText(
      "Norwegian salmon producer",
    );
    await expect(page.getByTestId(`admin-access-review-row-${REQUEST_ID}`)).toContainText("Sent");
    await expect(page.getByTestId("admin-access-review-summary")).toContainText("Open");

    const bodyBefore = await page.locator("body").textContent();
    expect(bodyBefore).not.toContain("admin@yorso.test");
    expect(bodyBefore).not.toContain(SESSION_ID);

    await page.getByTestId(`admin-access-review-approve-${REQUEST_ID}`).click();

    await expect.poll(() => state.decisionBodies.length).toBe(1);
    expect(state.decisionBodies[0]).toEqual({ status: "approved" });
    await expect(page.getByTestId(`admin-access-review-row-${REQUEST_ID}`)).toContainText("Approved");
    await expect(page.getByTestId(`admin-access-review-row-${REQUEST_ID}`)).toContainText("Nordfjord Sjømat AS");
    expectSessionHeaders(state);
  });

  test("renders admin-role guard from the self-hosted API", async ({ page }) => {
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/access-requests**", async (route) => {
      await json(route, {
        ok: false,
        error: {
          code: "admin_role_required",
          message: "Admin role is required.",
        },
      }, 403);
    });

    await page.goto("/admin/access-requests", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-access-review-forbidden")).toBeVisible();
    await expect(page.getByText("Admin role required")).toBeVisible();
  });
});
