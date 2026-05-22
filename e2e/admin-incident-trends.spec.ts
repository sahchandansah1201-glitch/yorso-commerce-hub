/**
 * E2E · API-backed admin incident trend analytics.
 *
 * Batch #107 browser guard:
 * - /admin/incident-trends reads bounded trend buckets from the self-hosted API;
 * - export JSON/CSV, anomalies and briefing use dedicated backend endpoints;
 * - requests carry x-yorso-user-id and x-yorso-session-id;
 * - raw admin email, session id and connection strings are not rendered.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000099";
const SESSION_ID = "session_admin_incident_trends_e2e_107";

const trendsPayload = () => ({
  buckets: [
    {
      acknowledged: 1,
      access: 0,
      atRisk: 1,
      audit: 2,
      breached: 1,
      critical: 1,
      endAt: "2026-05-22T23:59:59.000Z",
      executionBlocked: 1,
      executionDone: 1,
      executionOpen: 2,
      high: 1,
      key: "2026-05-22",
      loadScore: 144,
      open: 2,
      policy: 0,
      resolved: 0,
      runtime: 1,
      security: 0,
      startAt: "2026-05-22T00:00:00.000Z",
      total: 3,
    },
  ],
  generatedAt: "2026-05-22T10:05:00.000Z",
  granularity: "day",
  limit: 30,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000951",
  routeRisks: [
    {
      blocked: 1,
      breached: 1,
      critical: 1,
      loadScore: 144,
      recommendedAction: "Assign owner and inspect blocked admin route.",
      route: "/v1/admin/audit-events",
      total: 3,
    },
  ],
  severityMix: [{ breached: 1, critical: 1, key: "critical", label: "Critical", loadScore: 144, open: 2, sharePct: 100, total: 3 }],
  sla: { acknowledgedPct: 33, breachRatePct: 33, breached: 1, openCritical: 1, oldestOpenMinutes: 45, unresolved: 2 },
  sourceMix: [{ breached: 1, critical: 1, key: "audit", label: "Audit", loadScore: 144, open: 2, sharePct: 100, total: 3 }],
  statusMix: [{ breached: 1, critical: 1, key: "open", label: "Open", loadScore: 144, open: 2, sharePct: 100, total: 3 }],
  summary: {
    averageLoadScore: 144,
    breached: 1,
    critical: 1,
    peakBucketKey: "2026-05-22",
    peakBucketLoadScore: 144,
    total: 3,
    trendDirection: "up",
  },
  window: "7d",
});

const anomaliesPayload = () => ({
  anomalies: [
    {
      baseline: 1,
      current: 3,
      deltaPct: 200,
      evidence: [{ label: "route", value: "/v1/admin/audit-events" }],
      recommendedAction: "Review admin audit route pressure before capacity is saturated.",
      severity: "warning",
      signal: "route_pressure",
    },
  ],
  generatedAt: "2026-05-22T10:06:00.000Z",
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000952",
  summary: { critical: 0, highestSeverity: "warning", warning: 1, watch: 0 },
  window: "7d",
});

const briefingPayload = () => ({
  capacityReview: ["Keep admin audit inspection bounded to indexed route filters."],
  generatedAt: "2026-05-22T10:07:00.000Z",
  ok: true,
  operatorActions: ["Assign the blocked route incident.", "Review route pressure in the next shift."],
  requestId: "00000000-0000-4000-8000-000000000953",
  riskRegister: trendsPayload().routeRisks,
  sections: [
    { body: ["3 incidents in the selected trend window."], title: "Trend snapshot" },
    { body: ["1 critical item remains open."], title: "SLA posture" },
    { body: ["Route /v1/admin/audit-events needs owner review."], title: "Route risk" },
  ],
  summary: {
    headline: "Incident pressure is rising on admin audit routes.",
    highestAnomalySeverity: "warning",
    totalIncidents: 3,
    trendDirection: "up",
  },
  window: "7d",
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
        displayName: "Admin Trends",
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

test.describe("Admin incident trends", () => {
  test("loads trend analytics and drill-down endpoints through self-hosted API headers", async ({ page }) => {
    const requestUrls: string[] = [];
    const requestHeaders: Array<Record<string, string>> = [];
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/incidents/trends**", async (route) => {
      const url = route.request().url();
      requestUrls.push(url);
      requestHeaders.push(route.request().headers());
      if (url.includes("/export") && url.includes("format=csv")) {
        await route.fulfill({
          body: "\"key\",\"loadScore\"\n\"2026-05-22\",\"144\"",
          contentType: "text/csv",
          status: 200,
        });
        return;
      }
      if (url.includes("/export")) {
        await json(route, trendsPayload());
        return;
      }
      if (url.includes("/anomalies")) {
        await json(route, anomaliesPayload());
        return;
      }
      if (url.includes("/briefing")) {
        await json(route, briefingPayload());
        return;
      }
      await json(route, trendsPayload());
    });

    await page.goto("/admin/incident-trends", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-incident-trends-page")).toBeVisible();
    await expect(page.getByTestId("admin-incident-trends-buckets")).toContainText("2026-05-22");
    await expect(page.getByTestId("admin-incident-trends-summary")).toContainText("144");
    await expect(page.getByTestId("admin-incident-trends-route-risks")).toContainText("/v1/admin/audit-events");
    await expect(page.getByTestId("admin-operator-nav-incident-trends")).toHaveAttribute("aria-current", "page");

    await page.getByTestId("admin-incident-trends-export-json").click();
    await expect(page.getByTestId("admin-incident-trends-export-status")).toContainText("1 buckets");
    await page.getByTestId("admin-incident-trends-export-csv").click();
    await expect(page.getByTestId("admin-incident-trends-export-status")).toContainText("1 CSV rows");
    await page.getByTestId("admin-incident-trends-anomalies-load").click();
    await expect(page.getByTestId("admin-incident-trends-anomalies")).toContainText("route_pressure");
    await page.getByTestId("admin-incident-trends-briefing-load").click();
    await expect(page.getByTestId("admin-incident-trends-briefing")).toContainText("Incident pressure is rising");

    expect(requestHeaders[0]["x-yorso-user-id"]).toBe(USER_ID);
    expect(requestHeaders[0]["x-yorso-session-id"]).toBe(SESSION_ID);
    expect(requestUrls.some((url) => url.includes("/trends?"))).toBe(true);
    expect(requestUrls.some((url) => url.includes("/trends/export") && url.includes("format=json"))).toBe(true);
    expect(requestUrls.some((url) => url.includes("/trends/export") && url.includes("format=csv"))).toBe(true);
    expect(requestUrls.some((url) => url.includes("/trends/anomalies"))).toBe(true);
    expect(requestUrls.some((url) => url.includes("/trends/briefing"))).toBe(true);
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("admin@yorso.test");
    expect(body).not.toContain(SESSION_ID);
    expect(body).not.toContain("postgres://");
    expect(body).not.toContain("redis://");
  });

  test("renders admin-role guard from trend endpoint", async ({ page }) => {
    await installAdminSession(page);
    await page.route("**/__e2e-api/v1/admin/incidents/trends**", async (route) => {
      await json(route, {
        error: { code: "admin_role_required", message: "Admin role is required." },
        ok: false,
      }, 403);
    });

    await page.goto("/admin/incident-trends", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Admin role required")).toBeVisible();
  });
});
