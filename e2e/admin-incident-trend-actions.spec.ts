/**
 * E2E · API-backed admin incident trend action queue.
 *
 * Batch #109 browser guard:
 * - /admin/incident-trend-actions reads the bounded self-hosted queue;
 * - filters, JSON/CSV export and bulk decisions use dedicated backend routes;
 * - requests carry self-hosted session headers;
 * - raw admin email, session id and connection strings are not rendered.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000099";
const SESSION_ID = "session_admin_trend_actions_e2e_109";

const actionId = "trend:route_risk_review:7d:v1-admin-audit-events";

const queuePayload = (status: "proposed" | "dismissed" = "proposed") => ({
  actions: [
    {
      acceptedAt: null,
      actionId,
      decidedByUserHash: status === "proposed" ? null : "sha256:0123456789abcdef01234567",
      description: "Review concentrated incident pressure on /v1/admin/audit-events.",
      dismissedAt: status === "dismissed" ? "2026-05-22T10:12:00.000Z" : null,
      evidence: [
        { label: "route", value: "/v1/admin/audit-events" },
        { label: "loadScore", value: "144" },
      ],
      kind: "route_risk_review",
      loadScore: 144,
      note: status === "dismissed" ? "Dismissed from browser smoke." : null,
      ownerRole: "engineering",
      priority: "immediate",
      recommendedAction: "Assign an owner and inspect blocked admin audit route pressure.",
      relatedIncidentIds: ["audit:admin-audit-events:critical"],
      route: "/v1/admin/audit-events",
      signal: "Route risk concentration",
      status,
      title: "Review route risk: /v1/admin/audit-events",
    },
  ],
  generatedAt: "2026-05-22T10:08:00.000Z",
  limit: 50,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000956",
  summary: {
    accepted: 0,
    dismissed: status === "dismissed" ? 1 : 0,
    immediate: 1,
    proposed: status === "proposed" ? 1 : 0,
    relatedIncidents: 1,
    total: 1,
  },
  window: "7d",
});

const bulkPayload = () => ({
  failed: [{ actionId: "trend:missing:7d:not-found", code: "admin_incident_trend_action_not_found" }],
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000957",
  succeeded: 1,
  timelineEventsCreated: 0,
  updatedActions: queuePayload("dismissed").actions,
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
        displayName: "Admin Trend Actions",
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

test.describe("Admin incident trend action queue", () => {
  test("loads filters, exports and bulk decisions through self-hosted API headers", async ({ page }) => {
    const requestUrls: string[] = [];
    const requestHeaders: Array<Record<string, string>> = [];
    let currentStatus: "proposed" | "dismissed" = "proposed";
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/incidents/trend-action-queue**", async (route) => {
      const url = route.request().url();
      requestUrls.push(url);
      requestHeaders.push(route.request().headers());
      if (url.includes("/bulk")) {
        currentStatus = "dismissed";
        await json(route, bulkPayload());
        return;
      }
      if (url.includes("/export") && url.includes("format=csv")) {
        await route.fulfill({
          body: "\"actionId\",\"status\"\n\"trend:route_risk_review:7d:v1-admin-audit-events\",\"proposed\"",
          contentType: "text/csv",
          status: 200,
        });
        return;
      }
      await json(route, queuePayload(currentStatus));
    });

    await page.goto("/admin/incident-trend-actions", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-incident-trend-actions-page")).toBeVisible();
    await expect(page.getByTestId("admin-operator-nav-incident-trend-actions")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("admin-incident-trend-actions-summary")).toContainText("Proposed");
    await expect(page.getByTestId(`admin-incident-trend-action-queue-row-${actionId}`)).toContainText("Review route risk");

    await page.getByTestId("admin-incident-trend-actions-export-json").click();
    await expect(page.getByTestId("admin-incident-trend-actions-export-status")).toContainText("Trend action export ready");
    await page.getByTestId("admin-incident-trend-actions-export-csv").click();
    await expect(page.getByTestId("admin-incident-trend-actions-export-status")).toContainText("Trend action export ready");

    await page.getByTestId(`admin-incident-trend-action-select-${actionId}`).check();
    await page.getByTestId("admin-incident-trend-actions-bulk-dismiss").click();
    await expect(page.getByTestId(`admin-incident-trend-action-queue-row-${actionId}`)).toContainText("dismissed");

    expect(requestHeaders[0]["x-yorso-user-id"]).toBe(USER_ID);
    expect(requestHeaders[0]["x-yorso-session-id"]).toBe(SESSION_ID);
    expect(requestUrls.some((url) => url.includes("/trend-action-queue?"))).toBe(true);
    expect(requestUrls.some((url) => url.includes("/trend-action-queue/export") && url.includes("format=json"))).toBe(true);
    expect(requestUrls.some((url) => url.includes("/trend-action-queue/export") && url.includes("format=csv"))).toBe(true);
    expect(requestUrls.some((url) => url.includes("/trend-action-queue/bulk"))).toBe(true);
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("admin@yorso.test");
    expect(body).not.toContain(SESSION_ID);
    expect(body).not.toContain("postgres://");
    expect(body).not.toContain("redis://");
  });

  test("renders admin-role guard from queue endpoint", async ({ page }) => {
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/incidents/trend-action-queue**", async (route) => {
      await json(route, {
        error: { code: "admin_role_required", message: "Admin role is required." },
        ok: false,
      }, 403);
    });

    await page.goto("/admin/incident-trend-actions", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Admin role required")).toBeVisible();
  });
});
