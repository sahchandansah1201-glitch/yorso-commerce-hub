/**
 * E2E · API-backed admin incident workload and correlation center.
 *
 * Batch #106 browser guard:
 * - /admin/incident-workload reads bounded workload from the self-hosted API;
 * - filters are sent to /v1/admin/incidents/execution-workload;
 * - JSON/CSV exports use /execution-workload/export;
 * - correlation drill-down calls /v1/admin/incidents/:incidentId/correlation;
 * - raw user ids, emails and session ids are not rendered.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000099";
const SESSION_ID = "session_admin_incident_workload_e2e_106";
const INCIDENT_ID = "audit:admin-blocked:v1-admin-audit-events";

const workloadPayload = () => ({
  generatedAt: "2026-05-20T10:25:00.000Z",
  hotIncidents: [
    {
      blockedItems: 1,
      dueAt: "2026-05-20T11:00:00.000Z",
      immediateItems: 2,
      incidentId: INCIDENT_ID,
      loadScore: 189,
      nextTargetDueAt: "2026-05-20T10:15:00.000Z",
      openItems: 4,
      overdueItems: 3,
      severity: "high",
      slaStatus: "breached",
      source: "audit",
      status: "open",
      title: "Blocked admin route access",
      topOwnerRole: "operator",
      unassignedItems: 2,
    },
  ],
  limit: 20,
  offset: 0,
  ok: true,
  owners: [
    {
      assigned: 1,
      blocked: 1,
      breachedIncidents: 1,
      done: 0,
      immediate: 2,
      inProgress: 1,
      loadScore: 123,
      oldestTargetMinutes: 45,
      open: 3,
      overdue: 2,
      ownerRole: "operator",
      skipped: 0,
      total: 5,
      unassigned: 2,
    },
    {
      assigned: 0,
      blocked: 0,
      breachedIncidents: 1,
      done: 0,
      immediate: 1,
      inProgress: 0,
      loadScore: 40,
      oldestTargetMinutes: 60,
      open: 1,
      overdue: 1,
      ownerRole: "engineering",
      skipped: 0,
      total: 1,
      unassigned: 1,
    },
    {
      assigned: 0,
      blocked: 0,
      breachedIncidents: 0,
      done: 0,
      immediate: 0,
      inProgress: 0,
      loadScore: 0,
      oldestTargetMinutes: 0,
      open: 0,
      overdue: 0,
      ownerRole: "security",
      skipped: 0,
      total: 0,
      unassigned: 0,
    },
    {
      assigned: 0,
      blocked: 0,
      breachedIncidents: 0,
      done: 0,
      immediate: 0,
      inProgress: 0,
      loadScore: 0,
      oldestTargetMinutes: 0,
      open: 0,
      overdue: 0,
      ownerRole: "founder",
      skipped: 0,
      total: 0,
      unassigned: 0,
    },
  ],
  requestId: "00000000-0000-4000-8000-000000000742",
  sourceMix: [
    { blocked: 1, done: 0, inProgress: 1, key: "audit", open: 4, overdue: 3, total: 5 },
  ],
  statusMix: [
    { blocked: 1, done: 0, inProgress: 1, key: "open", open: 4, overdue: 3, total: 5 },
  ],
  summary: {
    assigned: 1,
    blocked: 1,
    done: 0,
    hotIncidentCount: 1,
    inProgress: 1,
    loadScore: 163,
    open: 4,
    overdue: 3,
    total: 5,
    unassigned: 2,
  },
});

const correlationPayload = () => ({
  auditEvents: [
    {
      action: "admin.audit_events.read",
      actorUserHash: "sha256:111111111111111111111111",
      auditId: "aud_e2e_workload_1",
      correlationId: "corr_e2e_workload_1",
      httpMethod: "GET",
      occurredAt: "2026-05-20T10:20:00.000Z",
      outcome: "blocked",
      reason: "admin_role_required",
      requestId: "req_e2e_workload_1",
      resourceHash: null,
      resourceType: "admin_audit_events",
      route: "/v1/admin/audit-events",
      sessionHash: "sha256:222222222222222222222222",
      statusCode: 403,
    },
  ],
  executionItems: [
    {
      assignedToUserHash: null,
      blockedReason: "Admin role missing for route access.",
      completedAt: null,
      description: "Confirm whether the actor should have admin audit access.",
      evidenceNote: null,
      evidenceRequired: "Role assignment decision recorded",
      itemId: `${INCIDENT_ID}:execution:confirm-scope`,
      note: null,
      ownerRole: "operator",
      priority: "immediate",
      source: "remediation_step",
      status: "blocked",
      targetMinutes: 15,
      title: "Confirm scope",
      updatedAt: "2026-05-20T10:21:00.000Z",
      updatedByUserHash: null,
    },
  ],
  generatedAt: "2026-05-20T10:26:00.000Z",
  incident: {
    acknowledgedAt: null,
    acknowledgedByUserHash: null,
    assignedAt: null,
    assignedToUserHash: null,
    count: 2,
    description: "Blocked admin route access.",
    dueAt: "2026-05-20T11:00:00.000Z",
    escalatedAt: null,
    escalationLevel: "none",
    evidence: [{ label: "status", value: "403" }],
    firstSeenAt: "2026-05-20T10:00:00.000Z",
    id: INCIDENT_ID,
    lastSeenAt: "2026-05-20T10:21:00.000Z",
    note: null,
    recommendedActions: ["Confirm whether the blocked actor should have admin role."],
    relatedAuditIds: ["aud_e2e_workload_1"],
    route: "/v1/admin/audit-events",
    runbook: [
      {
        description: "Confirm admin role and review recent blocked attempts.",
        label: "Confirm scope",
        ownerRole: "operator",
        targetMinutes: 15,
      },
    ],
    severity: "high",
    slaStatus: "breached",
    source: "audit",
    status: "open",
    timelinePreview: [
      {
        actorUserHash: null,
        assignedToUserHash: null,
        escalationLevel: null,
        eventId: `${INCIDENT_ID}:created`,
        note: null,
        occurredAt: "2026-05-20T10:00:00.000Z",
        status: "open",
        type: "created",
      },
    ],
    title: "Blocked admin route access",
  },
  ok: true,
  recommendedNextSteps: [
    "Resolve blocked execution items before broadening scope.",
    "Confirm owner assignment for the oldest overdue item.",
  ],
  requestId: "00000000-0000-4000-8000-000000000743",
  signals: [
    {
      actorUserHash: "sha256:111111111111111111111111",
      evidence: [{ label: "auditId", value: "aud_e2e_workload_1" }],
      label: "admin.audit_events.read",
      occurredAt: "2026-05-20T10:20:00.000Z",
      priority: null,
      route: "/v1/admin/audit-events",
      source: "audit_event",
      status: "blocked",
    },
    {
      actorUserHash: null,
      evidence: [{ label: "ownerRole", value: "operator" }],
      label: "Confirm scope",
      occurredAt: "2026-05-20T10:21:00.000Z",
      priority: "immediate",
      route: null,
      source: "execution_item",
      status: "blocked",
    },
  ],
  summary: {
    auditEvents: 1,
    blockedItems: 1,
    doneItems: 0,
    openItems: 2,
    timelineEvents: 1,
  },
  timeline: [
    {
      actorUserHash: null,
      assignedToUserHash: null,
      escalationLevel: null,
      eventId: `${INCIDENT_ID}:created`,
      note: null,
      occurredAt: "2026-05-20T10:00:00.000Z",
      status: "open",
      type: "created",
    },
  ],
});

const forecastPayload = () => ({
  assumptions: [
    "Forecast window: 24 hour(s).",
    "Projection uses current bounded execution items only.",
  ],
  generatedAt: "2026-05-20T10:27:00.000Z",
  horizonHours: 24,
  ok: true,
  owners: [
    { capacityRisk: "high", currentOpen: 3, currentOverdue: 2, currentScore: 123, ownerRole: "operator", projectedOpen: 5, projectedOverdue: 3, recommendedAction: "Protect operator focus time and clear overdue items." },
    { capacityRisk: "moderate", currentOpen: 1, currentOverdue: 1, currentScore: 40, ownerRole: "engineering", projectedOpen: 2, projectedOverdue: 2, recommendedAction: "Keep engineering queue under review." },
    { capacityRisk: "low", currentOpen: 0, currentOverdue: 0, currentScore: 0, ownerRole: "security", projectedOpen: 0, projectedOverdue: 0, recommendedAction: "No extra security action required." },
    { capacityRisk: "low", currentOpen: 0, currentOverdue: 0, currentScore: 0, ownerRole: "founder", projectedOpen: 0, projectedOverdue: 0, recommendedAction: "No extra founder action required." },
  ],
  requestId: "00000000-0000-4000-8000-000000000744",
  summary: {
    capacityRisk: "high",
    highestRiskOwnerRole: "operator",
    projectedOpen: 7,
    projectedOverdue: 5,
    recommendedAction: "High capacity risk: clear operator overdue work before starting new remediation items.",
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
        displayName: "Admin Incident Workload",
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

test.describe("Admin incident workload", () => {
  test("filters, exports and opens correlation without leaking raw identities", async ({ page }) => {
    const requestHeaders: Array<Record<string, string>> = [];
    const requestedUrls: string[] = [];
    await installAdminSession(page);

    await page.route("**/__e2e-api/v1/admin/incidents/execution-workload/export**", async (route) => {
      requestedUrls.push(route.request().url());
      requestHeaders.push(route.request().headers());
      if (route.request().url().includes("format=csv")) {
        await route.fulfill({
          body: "\"incidentId\",\"title\",\"source\",\"severity\",\"slaStatus\"\n\"audit:admin-blocked:v1-admin-audit-events\",\"Blocked admin route access\",\"audit\",\"high\",\"breached\"",
          contentType: "text/csv",
          status: 200,
        });
        return;
      }
      await json(route, workloadPayload());
    });
    await page.route("**/__e2e-api/v1/admin/incidents/*/correlation?**", async (route) => {
      requestedUrls.push(route.request().url());
      requestHeaders.push(route.request().headers());
      await json(route, correlationPayload());
    });
    await page.route("**/__e2e-api/v1/admin/incidents/execution-workload/forecast?**", async (route) => {
      requestedUrls.push(route.request().url());
      requestHeaders.push(route.request().headers());
      await json(route, forecastPayload());
    });
    await page.route("**/__e2e-api/v1/admin/incidents/execution-workload?**", async (route) => {
      requestedUrls.push(route.request().url());
      requestHeaders.push(route.request().headers());
      await json(route, workloadPayload());
    });

    await page.goto("/admin/incident-workload");

    await expect(page.getByTestId("admin-incident-workload-page")).toBeVisible();
    await expect(page.getByText("Blocked admin route access")).toBeVisible();
    await expect(page.getByTestId("admin-incident-workload-summary")).toContainText("163");
    await expect(page.getByTestId("admin-incident-workload-owner-operator")).toContainText("operator");
    await expect(page.getByText("admin@yorso.test")).toHaveCount(0);
    await expect(page.getByText(SESSION_ID)).toHaveCount(0);

    await page.getByTestId("admin-incident-workload-status-filter").click();
    await page.getByRole("option", { name: "open" }).click();
    await page.getByTestId("admin-incident-workload-priority-filter").click();
    await page.getByRole("option", { name: "immediate" }).click();
    await page.getByTestId("admin-incident-workload-overdue-filter").click();

    await expect.poll(() => requestedUrls.some((url) =>
      url.includes("status=open") && url.includes("priority=immediate") && url.includes("overdueOnly=true"),
    )).toBe(true);

    await page.getByTestId("admin-incident-workload-export-json").click();
    await expect(page.getByTestId("admin-incident-workload-export-status")).toContainText("1 incidents");
    await page.getByTestId("admin-incident-workload-export-csv").click();
    await expect(page.getByTestId("admin-incident-workload-export-status")).toContainText("1 CSV rows");
    await page.getByTestId("admin-incident-workload-forecast-load").click();
    await expect(page.getByTestId("admin-incident-workload-forecast-summary")).toContainText("high");
    await expect(page.getByTestId("admin-incident-workload-forecast-owners")).toContainText("operator");

    await page.getByTestId(`admin-incident-workload-correlation-${INCIDENT_ID}`).click();
    await expect(page.getByTestId("admin-incident-workload-correlation-signals")).toContainText("admin.audit_events.read");
    await expect(page.getByTestId("admin-incident-workload-correlation-signals")).toContainText("Confirm scope");

    expect(requestHeaders[0]["x-yorso-user-id"]).toBe(USER_ID);
    expect(requestHeaders[0]["x-yorso-session-id"]).toBe(SESSION_ID);
    expect(requestedUrls.some((url) => url.includes("/execution-workload/export?format=json"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/execution-workload/export?format=csv"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/execution-workload/forecast?") && url.includes("limit=20"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes(`/${encodeURIComponent(INCIDENT_ID)}/correlation?limit=25`))).toBe(true);
  });
});
