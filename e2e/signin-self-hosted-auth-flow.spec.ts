/**
 * E2E · self-hosted sign-in frontend bridge.
 *
 * Batch #74 self-hosted auth frontend guard:
 * - /signin posts email/password to the owned `/v1/auth/sign-in` API when
 *   `VITE_YORSO_API_URL` is configured;
 * - the returned backend session id and user id are stored in
 *   `yorso_buyer_session`;
 * - downstream self-hosted catalog requests use `x-yorso-user-id` and
 *   `x-yorso-session-id` from that session.
 *
 * Run through `VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`
 * so Playwright can intercept `__e2e-api/v1/*` without a real backend.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const EMAIL = "buyer@yorso.test";
const PASSWORD = "Password123";
const SESSION_ID = "session_self_hosted_e2e_00000000000000000074";
const USER_ID = "00000000-0000-4000-8000-000000000074";

const json = async (route: Route, body: unknown, status = 200) => {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
};

const installSelfHostedAuthApiMock = async (page: Page) => {
  const catalogHeaders: Record<string, string | null> = {};
  await page.route("**/__e2e-api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/__e2e-api/, "");
    const method = request.method();

    if (path === "/v1/auth/sign-in" && method === "POST") {
      expect(await request.postDataJSON()).toEqual({
        email: EMAIL,
        password: PASSWORD,
      });
      await json(route, {
        ok: true,
        requestId: "00000000-0000-4000-8000-000000000474",
        session: {
          id: SESSION_ID,
          userId: USER_ID,
          email: EMAIL,
          displayName: "Buyer Self Hosted",
          issuedAt: "2026-05-19T12:00:00.000Z",
          expiresAt: "2026-05-20T12:00:00.000Z",
        },
      });
      return;
    }

    if (path === "/v1/offers" && method === "GET") {
      catalogHeaders["x-yorso-user-id"] = request.headers()["x-yorso-user-id"] ?? null;
      catalogHeaders["x-yorso-session-id"] = request.headers()["x-yorso-session-id"] ?? null;
      await json(route, {
        ok: true,
        offers: [],
        total: 0,
        accessLevel: url.searchParams.get("accessLevel") ?? "registered_locked",
        limit: Number(url.searchParams.get("limit") ?? "20"),
        offset: Number(url.searchParams.get("offset") ?? "0"),
        requestId: "00000000-0000-4000-8000-000000000574",
      });
      return;
    }

    await json(route, { ok: false, error: { code: "e2e_unhandled", message: path } }, 404);
  });

  return catalogHeaders;
};

test.describe("self-hosted sign-in frontend bridge", () => {
  test("stores backend session and sends it to downstream self-hosted API calls", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("yorso-lang", "en");
      window.sessionStorage.clear();
    });
    const catalogHeaders = await installSelfHostedAuthApiMock(page);

    await page.goto("/signin");
    await page.getByPlaceholder("you@company.com").fill(EMAIL);
    await page.getByPlaceholder("Enter your password").fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/offers/);
    await expect
      .poll(() => catalogHeaders["x-yorso-session-id"], { timeout: 10_000 })
      .toBe(SESSION_ID);
    expect(catalogHeaders["x-yorso-user-id"]).toBe(USER_ID);

    const storedSession = await page.evaluate(() =>
      JSON.parse(window.sessionStorage.getItem("yorso_buyer_session") ?? "{}"),
    );
    expect(storedSession).toMatchObject({
      displayName: "Buyer Self Hosted",
      expiresAt: "2026-05-20T12:00:00.000Z",
      id: SESSION_ID,
      identifier: EMAIL,
      method: "email",
      signedInAt: "2026-05-19T12:00:00.000Z",
      source: "self_hosted",
      userId: USER_ID,
    });
  });
});
