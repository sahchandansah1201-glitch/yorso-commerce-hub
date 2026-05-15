/**
 * E2E · API-backed Header supplier access notification center.
 *
 * Batch #63 API-backed browser-level guard:
 * - Header notification center uses the self-hosted API adapter when configured;
 * - the bell itself does not auto-load feed data on render;
 * - opening the bell refreshes `/v1/access/notifications`;
 * - Mark all read and row open acknowledge notifications through PATCH;
 * - notification requests carry self-hosted session headers;
 * - app-level background sync remains bounded and does not create rapid polling.
 *
 * Run through `VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`
 * so Playwright can intercept `__e2e-api/v1/*` without a real backend.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const SUPPLIER_ID = "sup-no-001";
const NOTIFICATION_ID = "notification-sup-no-001";
const ACCOUNT_USER_ID = "00000000-0000-4000-8000-000000000001";
const SESSION_ID = "b_e2e_supplier_access_notification_center_api_flow";

interface ApiState {
  feedAvailable: boolean;
  getCount: number;
  patchCount: number;
  patchBodies: Array<{ notificationIds?: unknown[] }>;
  requestHeaders: Array<Record<string, string>>;
  notificationStatus: "unread" | "read";
}

const nowIso = () => new Date().toISOString();

const installRegisteredStorage = async (page: Page) => {
  await page.addInitScript(({ sessionId }) => {
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
          identifier: "buyer@example.com",
          method: "email",
          signedInAt: new Date().toISOString(),
          displayName: "buyer",
        }),
      );
    } catch {
      /* ignore */
    }
  }, { sessionId: SESSION_ID });
};

const notification = (status: "unread" | "read") => ({
  id: NOTIFICATION_ID,
  buyerUserId: ACCOUNT_USER_ID,
  supplierId: SUPPLIER_ID,
  type: "price_access_approved",
  title: "Price access approved",
  body: "Supplier approved exact price access.",
  status,
  createdAt: "2026-05-15T00:00:00.000Z",
  readAt: status === "read" ? nowIso() : null,
});

const json = async (route: Route, body: unknown, status = 200) => {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
};

const installAccessNotificationApiMock = async (page: Page, state: ApiState) => {
  await page.route("**/__e2e-api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/__e2e-api/, "");
    const method = request.method();

    if (path === "/v1/access/notifications" && method === "GET") {
      state.getCount += 1;
      state.requestHeaders.push(request.headers());
      await json(route, {
        ok: true,
        notifications: state.feedAvailable ? [notification(state.notificationStatus)] : [],
        requestId: `e2e-access-notifications-${state.getCount}`,
      });
      return;
    }

    if (path === "/v1/access/notifications" && method === "PATCH") {
      state.patchCount += 1;
      state.requestHeaders.push(request.headers());
      let payload: { notificationIds?: unknown[] } = {};
      try {
        payload = request.postDataJSON() as { notificationIds?: unknown[] };
      } catch {
        payload = {};
      }
      state.patchBodies.push(payload);
      if (payload.notificationIds?.includes(NOTIFICATION_ID)) {
        state.notificationStatus = "read";
      }
      await json(route, {
        ok: true,
        notifications: [notification("read")],
        markedReadCount: payload.notificationIds?.length ?? 0,
        requestId: "e2e-access-notifications-ack",
      });
      return;
    }

    await json(route, { ok: false, error: { code: "e2e_unhandled_route", path, method } }, 404);
  });
};

const gotoHomeWithApiNotifications = async (page: Page, state: ApiState) => {
  await installAccessNotificationApiMock(page, state);
  await installRegisteredStorage(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("header-supplier-access-notifications-bell")).toBeVisible({
    timeout: 15_000,
  });
};

const expectSessionHeaders = (state: ApiState) => {
  expect(state.requestHeaders.length).toBeGreaterThan(0);
  for (const headers of state.requestHeaders) {
    expect(headers["x-yorso-user-id"]).toBe(ACCOUNT_USER_ID);
    expect(headers["x-yorso-session-id"]).toBe(SESSION_ID);
  }
};

test.describe("Header supplier access notifications · API-backed center", () => {
  test("opens on demand, marks all read via PATCH, and avoids rapid polling", async ({ page }) => {
    const state: ApiState = {
      feedAvailable: false,
      getCount: 0,
      patchCount: 0,
      patchBodies: [],
      requestHeaders: [],
      notificationStatus: "unread",
    };

    await gotoHomeWithApiNotifications(page, state);
    await expect.poll(() => state.getCount).toBe(1);
    await page.waitForTimeout(1_000);
    expect(state.getCount).toBe(1);
    expect(state.patchCount).toBe(0);
    await expect(page.getByTestId("header-supplier-access-notifications-count")).toHaveCount(0);

    state.feedAvailable = true;
    await page.getByTestId("header-supplier-access-notifications-bell").click();

    await expect.poll(() => state.getCount).toBe(2);
    await expect(page.getByTestId("supplier-access-notifications-popover")).toBeVisible();
    await expect(page.getByTestId("header-supplier-access-notifications-count")).toHaveText("1");
    await expect(page.getByTestId(`supplier-access-notification-${NOTIFICATION_ID}`)).toContainText(
      "Price access approved",
    );

    await page.getByTestId("supplier-access-notifications-mark-all").click();

    await expect.poll(() => state.patchCount).toBe(1);
    expect(state.patchBodies[0]).toEqual({ notificationIds: [NOTIFICATION_ID] });
    await expect(page.getByTestId("header-supplier-access-notifications-count")).toHaveCount(0);
    expectSessionHeaders(state);
  });

  test("row open acknowledges the notification and navigates to the supplier profile", async ({ page }) => {
    const state: ApiState = {
      feedAvailable: false,
      getCount: 0,
      patchCount: 0,
      patchBodies: [],
      requestHeaders: [],
      notificationStatus: "unread",
    };

    await gotoHomeWithApiNotifications(page, state);
    await expect.poll(() => state.getCount).toBe(1);

    state.feedAvailable = true;
    await page.getByTestId("header-supplier-access-notifications-bell").click();
    await expect(page.getByTestId(`supplier-access-notification-${NOTIFICATION_ID}`)).toBeVisible();

    await page.getByTestId(`supplier-access-notification-${NOTIFICATION_ID}`).click();

    await expect.poll(() => state.patchCount).toBe(1);
    expect(state.patchBodies[0]).toEqual({ notificationIds: [NOTIFICATION_ID] });
    await expect(page).toHaveURL(new RegExp(`/suppliers/${SUPPLIER_ID}`));
    expectSessionHeaders(state);
  });
});
