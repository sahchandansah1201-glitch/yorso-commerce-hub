/**
 * E2E · API-backed admin incident execution queue.
 *
 * Batch #105 browser guard:
 * - /admin/incident-execution loads the self-hosted execution queue;
 * - filters are sent to /v1/admin/incidents/execution-queue;
 * - JSON/CSV exports are requested from /execution-queue/export;
 * - bulk updates post bounded execution item refs to /execution-queue/bulk;
 * - raw user identifiers, emails and session ids are not rendered.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000099";
const SESSION_ID = "session_admin_incident_execution_queue_e2e_105";
const INCIDENT_ID = "audit:admin-blocked:v1-admin-audit-events";
const ITEM_ID = "remediation:01:confirm-scope";

const queueItem = (status: "open" | "in_progress" | "blocked" | "done" | "skipped" = "open") => ({
  assignedToUserHash: null,
  blockedReason: status === "blocked" ? "Waiting for owner." : null,
  completedAt: status === "done" ? "2026-05-20T10:14:00.000Z" : null,
  description: "Confirm admin role and review attempts.",
  evidenceNote: status === "done" ? "Evidence captured." : null,
  evidenceRequired: "Audit route evidence.",
  incidentDueAt: "2026-05-20T11:00:00.000Z",
  incidentId: INCIDENT_ID,
  incidentSeverity: "high",
  incidentSlaStatus: "breached",
  incidentSource: "audit",
  incidentStatus: "open",
  incidentTitle: "Blocked admin route access",
  itemId: ITEM_ID,
  note: status === "in_progress" ? "Bulk started." : null,
  overdue: true,
  ownerRole: "operator",
  priority: "immediate",
  source: "remediation_step",
  status,
  targetDueAt: "2026-05-20T10:15:00.000Z",
  targetMinutes: 15,
  title: "Confirm scope",
  updatedAt: status === "open" ? null : "2026-05-20T10:12:00.000Z",
  updatedByUserHash: status === "open" ? null : "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
});

const queuePayload = (status: "open" | "in_progress" | "blocked" | "done" | "skipped" = "open") => ({
  generatedAt: "2026-05-20T10:15:00.000Z",
  items: [queueItem(status)],
  limit: 50,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000731",
  summary: {
    assigned: 0,
    blocked: status === "blocked" ? 1 : 0,
    done: status === "done" ? 1 : 0,
    inProgress: status === "in_progress" ? 1 : 0,
    open: status === "open" ? 1 : 0,
    overdue: status === "done" || status === "skipped" ? 0 : 1,
    skipped: status === "skipped" ? 1 : 0,
    total: 1,
    unassigned: 1,
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
        displayName: "Admin Execution Queue",
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

test.describe("Admin incident execution queue", () => {
  test("filters, exports and bulk-updates execution items", async ({ page }) => {
    const requestedUrls: string[] = [];
    const requestHeaders: Array<Record<string, string>> = [];
    const postedBodies: unknown[] = [];
    await installAdminSession(page);

    await page.route("**/__e2e-api/v1/admin/incidents/execution-queue/export**", async (route) => {
      requestedUrls.push(route.request().url());
      requestHeaders.push(route.request().headers());
      if (!route.request().url().includes("format=csv")) {
        await json(route, queuePayload());
        return;
      }
      await route.fulfill({
        body: "\"incidentId\",\"itemId\"\n\"audit:admin-blocked:v1-admin-audit-events\",\"remediation:01:confirm-scope\"",
        contentType: "text/csv",
      });
    });
    await page.route("**/__e2e-api/v1/admin/incidents/execution-queue/bulk", async (route) => {
      requestedUrls.push(route.request().url());
      requestHeaders.push(route.request().headers());
      postedBodies.push(route.request().postDataJSON());
      await json(route, {
        failed: [],
        ok: true,
        requestId: "00000000-0000-4000-8000-000000000732",
        succeeded: 1,
        updatedItems: [queueItem("in_progress")],
      });
    });
    await page.route("**/__e2e-api/v1/admin/incidents/execution-queue?**", async (route) => {
      requestedUrls.push(route.request().url());
      requestHeaders.push(route.request().headers());
      await json(route, queuePayload());
    });

    await page.goto("/admin/incident-execution");

    await expect(page.getByTestId("admin-incident-execution-queue-page")).toBeVisible();
    await expect(page.getByText("Blocked admin route access")).toBeVisible();
    await expect(page.getByText("Confirm scope")).toBeVisible();
    await expect(page.getByText("admin@yorso.test")).toHaveCount(0);
    await expect(page.getByText(SESSION_ID)).toHaveCount(0);

    await page.getByTestId("admin-incident-execution-status-filter").click();
    await page.getByRole("option", { name: "open" }).click();
    await page.getByTestId("admin-incident-execution-priority-filter").click();
    await page.getByRole("option", { name: "immediate" }).click();
    await page.getByTestId("admin-incident-execution-overdue-filter").click();

    await expect.poll(() => requestedUrls.some((url) =>
      url.includes("status=open") && url.includes("priority=immediate") && url.includes("overdueOnly=true"),
    )).toBe(true);

    await page.getByTestId("admin-incident-execution-export-json").click();
    await expect(page.getByTestId("admin-incident-execution-export-status")).toContainText("1 items");
    await page.getByTestId("admin-incident-execution-export-csv").click();
    await expect(page.getByTestId("admin-incident-execution-export-status")).toContainText("1 CSV rows");

    await page.getByTestId(`admin-incident-execution-select-${ITEM_ID}`).check();
    await page.getByTestId("admin-incident-execution-bulk-start").click();
    await expect(page.getByText("in_progress")).toBeVisible();

    expect(postedBodies[0]).toMatchObject({
      items: [{ incidentId: INCIDENT_ID, itemId: ITEM_ID }],
      status: "in_progress",
    });
    expect(requestHeaders[0]["x-yorso-user-id"]).toBe(USER_ID);
    expect(requestHeaders[0]["x-yorso-session-id"]).toBe(SESSION_ID);
    expect(requestedUrls.some((url) => url.includes("/execution-queue/export?format=json"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/execution-queue/export?format=csv"))).toBe(true);
    expect(requestedUrls.some((url) => url.endsWith("/execution-queue/bulk"))).toBe(true);
  });
});
