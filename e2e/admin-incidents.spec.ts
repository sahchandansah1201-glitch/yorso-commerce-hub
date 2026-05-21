/**
 * E2E · API-backed admin incident response page.
 *
 * Batch #101 browser guard:
 * - /admin/incidents renders derived incidents from the self-hosted API;
 * - requests carry x-yorso-user-id and x-yorso-session-id;
 * - filters update the backend query;
 * - acknowledgement posts to the incident endpoint;
 * - emails, raw session ids and connection strings are not rendered.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000099";
const SESSION_ID = "session_admin_incidents_e2e_101";
const INCIDENT_ID = "audit:admin-blocked:v1-admin-audit-events";

const incident = (status = "open") => ({
  acknowledgedAt: status === "open" ? null : "2026-05-20T10:03:00.000Z",
  acknowledgedByUserHash: status === "open" ? null : "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
  count: 2,
  description: "Blocked admin route access.",
  evidence: [
    { label: "outcome", value: "blocked" },
    { label: "status", value: "403" },
  ],
  firstSeenAt: "2026-05-20T10:00:00.000Z",
  id: INCIDENT_ID,
  lastSeenAt: "2026-05-20T10:01:00.000Z",
  note: status === "open" ? null : "Checking incident.",
  recommendedActions: ["Confirm whether the blocked actor should have admin role."],
  relatedAuditIds: ["aud_e2e_incident_1"],
  route: "/v1/admin/audit-events",
  severity: "high",
  source: "audit",
  status,
  title: "Blocked admin route access",
});

const incidentPayload = (status = "open") => ({
  incidents: [incident(status)],
  limit: 25,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000601",
  summary: {
    acknowledged: status === "acknowledged" ? 1 : 0,
    critical: 0,
    high: 1,
    open: status === "open" ? 1 : 0,
    resolved: status === "resolved" ? 1 : 0,
    total: 1,
  },
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
        displayName: "Admin Incidents",
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

test.describe("Admin incidents", () => {
  test("loads, filters and acknowledges sanitized incidents", async ({ page }) => {
    const requestHeaders: Array<Record<string, string>> = [];
    const requestedUrls: string[] = [];
    const postedBodies: unknown[] = [];
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/incidents?**", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await json(route, incidentPayload());
    });
    await page.route("**/__e2e-api/v1/admin/incidents/*/acknowledge", async (route) => {
      postedBodies.push(route.request().postDataJSON());
      await json(route, {
        incident: incident("acknowledged"),
        ok: true,
        requestId: "00000000-0000-4000-8000-000000000602",
      });
    });

    await page.goto("/admin/incidents", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-incidents-page")).toBeVisible();
    await expect(page.getByTestId("admin-incidents-list")).toContainText("Blocked admin route access");
    await expect(page.getByTestId("admin-operator-nav-incidents")).toHaveAttribute("aria-current", "page");

    await page.getByTestId("admin-incidents-severity-filter").click();
    await page.getByRole("option", { name: "high" }).click();
    await expect.poll(() => requestedUrls.length).toBeGreaterThanOrEqual(2);
    expect(requestedUrls[requestedUrls.length - 1]).toContain("severity=high");
    expect(requestHeaders[0]["x-yorso-user-id"]).toBe(USER_ID);
    expect(requestHeaders[0]["x-yorso-session-id"]).toBe(SESSION_ID);

    await page.getByTestId(`admin-incident-note-${INCIDENT_ID}`).fill("Checking incident.");
    await page.getByTestId(`admin-incident-ack-${INCIDENT_ID}`).click();
    await expect.poll(() => postedBodies.length).toBe(1);
    expect(postedBodies[0]).toEqual({ note: "Checking incident.", status: "acknowledged" });
    await expect(page.getByTestId("admin-incidents-list")).toContainText("acknowledged");

    const body = await page.locator("body").textContent();
    expect(body).not.toContain("admin@yorso.test");
    expect(body).not.toContain(SESSION_ID);
    expect(body).not.toContain("postgres://");
    expect(body).not.toContain("redis://");
  });

  test("renders admin role guard from the self-hosted API", async ({ page }) => {
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/incidents?**", async (route) => {
      await json(route, {
        error: { code: "admin_role_required", message: "Admin role is required." },
        ok: false,
      }, 403);
    });

    await page.goto("/admin/incidents", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-incidents-forbidden")).toBeVisible();
    await expect(page.getByText("Admin role required")).toBeVisible();
  });
});
