/**
 * E2E · API-backed admin incident response page.
 *
 * Batch #101 browser guard:
 * - /admin/incidents renders derived incidents from the self-hosted API;
 * - requests carry x-yorso-user-id and x-yorso-session-id;
 * - filters update the backend query;
 * - acknowledgement posts to the incident endpoint;
 * - emails, raw session ids and connection strings are not rendered.
 *
 * Batch #102 browser guard:
 * - assignment posts to /workflow with assignedToUserId;
 * - escalation posts to /workflow with escalationLevel;
 * - workflow filters send assigned, escalationLevel and slaStatus query params;
 * - operator workflow state is rendered without exposing raw user ids.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000099";
const SESSION_ID = "session_admin_incidents_e2e_101";
const INCIDENT_ID = "audit:admin-blocked:v1-admin-audit-events";

const incident = (status = "open") => ({
  acknowledgedAt: status === "open" ? null : "2026-05-20T10:03:00.000Z",
  acknowledgedByUserHash: status === "open" ? null : "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
  assignedAt: null,
  assignedToUserHash: null,
  count: 2,
  description: "Blocked admin route access.",
  dueAt: "2026-05-20T11:00:00.000Z",
  escalatedAt: null,
  escalationLevel: "none",
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
  status,
  timelinePreview: [
    {
      actorUserHash: null,
      assignedToUserHash: null,
      escalationLevel: null,
      eventId: "audit:admin-blocked:v1-admin-audit-events:created",
      note: null,
      occurredAt: "2026-05-20T10:00:00.000Z",
      status: "open",
      type: "created",
    },
  ],
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
    access: 0,
    assigned: 0,
    assignmentCoveragePct: 0,
    atRisk: 0,
    audit: 1,
    breachRatePct: status === "resolved" ? 0 : 100,
    breached: status === "resolved" ? 0 : 1,
    critical: 0,
    engineeringEscalations: 0,
    escalated: 0,
    executiveEscalations: 0,
    high: 1,
    leadEscalations: 0,
    open: status === "open" ? 1 : 0,
    openCritical: 0,
    oldestOpenMinutes: 1,
    policy: 0,
    resolved: status === "resolved" ? 1 : 0,
    runtime: 0,
    security: 0,
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
    await page.route("**/__e2e-api/v1/admin/incidents/export?**", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      if (route.request().url().includes("format=csv")) {
        await route.fulfill({
          body: "\"id\",\"status\"\n\"audit:admin-blocked:v1-admin-audit-events\",\"open\"",
          contentType: "text/csv",
          status: 200,
        });
        return;
      }
      await json(route, {
        count: 1,
        generatedAt: "2026-05-20T10:08:00.000Z",
        incidents: incidentPayload().incidents,
        ok: true,
        requestId: "00000000-0000-4000-8000-000000000605",
      });
    });
    await page.route("**/__e2e-api/v1/admin/incidents/*/acknowledge", async (route) => {
      postedBodies.push(route.request().postDataJSON());
      await json(route, {
        incident: incident("acknowledged"),
        ok: true,
        requestId: "00000000-0000-4000-8000-000000000602",
        timeline: incident("acknowledged").timelinePreview,
      });
    });
    await page.route("**/__e2e-api/v1/admin/incidents/workflow/bulk", async (route) => {
      postedBodies.push(route.request().postDataJSON());
      const body = route.request().postDataJSON() as { action: string; escalationLevel?: string };
      await json(route, {
        failed: [],
        incidents: [
          {
            ...incident("acknowledged"),
            assignedAt: body.action === "assign" ? "2026-05-20T10:06:00.000Z" : null,
            assignedToUserHash: body.action === "assign" ? "sha256:cccccccccccccccccccccccc" : "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
            escalatedAt: body.action === "escalate" ? "2026-05-20T10:07:00.000Z" : null,
            escalationLevel: body.escalationLevel ?? "engineering",
          },
        ],
        ok: true,
        requestId: "00000000-0000-4000-8000-000000000604",
        succeeded: 1,
      });
    });
    await page.route("**/__e2e-api/v1/admin/incidents/*/workflow", async (route) => {
      postedBodies.push(route.request().postDataJSON());
      const body = route.request().postDataJSON() as { action: string; escalationLevel?: string };
      await json(route, {
        incident: {
          ...incident("acknowledged"),
          assignedAt: body.action === "assign" ? "2026-05-20T10:04:00.000Z" : null,
          assignedToUserHash: body.action === "assign" ? "sha256:bbbbbbbbbbbbbbbbbbbbbbbb" : null,
          escalatedAt: body.action === "escalate" ? "2026-05-20T10:05:00.000Z" : null,
          escalationLevel: body.escalationLevel ?? "none",
          timelinePreview: [
            ...incident("acknowledged").timelinePreview,
            {
              actorUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
              assignedToUserHash: body.action === "assign" ? "sha256:bbbbbbbbbbbbbbbbbbbbbbbb" : null,
              escalationLevel: body.escalationLevel ?? null,
              eventId: `evt_${body.action}`,
              note: "Workflow update.",
              occurredAt: "2026-05-20T10:05:00.000Z",
              status: "acknowledged",
              type: body.action === "assign" ? "assigned" : "escalated",
            },
          ],
        },
        ok: true,
        requestId: "00000000-0000-4000-8000-000000000603",
        timeline: incident("acknowledged").timelinePreview,
      });
    });

    await page.goto("/admin/incidents", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("admin-incidents-page")).toBeVisible();
    await expect(page.getByTestId("admin-incidents-list")).toContainText("Blocked admin route access");
    await expect(page.getByTestId("admin-incidents-list")).toContainText("Confirm scope");
    await expect(page.getByTestId("admin-incidents-bulk-workflow")).toBeVisible();
    await expect(page.getByTestId("admin-incidents-workload-summary")).toContainText("Assignment coverage");
    await expect(page.getByTestId("admin-incidents-escalation-load")).toContainText("lead: 0");
    await expect(page.getByTestId("admin-incidents-source-mix")).toContainText("audit: 1");
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

    await page.getByTestId(`admin-incident-assignee-${INCIDENT_ID}`).fill(USER_ID);
    await page.getByTestId(`admin-incident-assign-${INCIDENT_ID}`).click();
    await expect.poll(() => postedBodies.length).toBe(2);
    expect(postedBodies[1]).toEqual({
      action: "assign",
      assignedToUserId: USER_ID,
      note: "Checking incident.",
    });
    await expect(page.getByTestId("admin-incidents-list")).toContainText("sha256:bbbbbbbbbbbbbbbbbbbbbbbb");

    await page.getByTestId(`admin-incident-escalation-${INCIDENT_ID}`).click();
    await page.getByRole("option", { name: "engineering" }).click();
    await page.getByTestId(`admin-incident-escalate-${INCIDENT_ID}`).click();
    await expect.poll(() => postedBodies.length).toBe(3);
    expect(postedBodies[2]).toEqual({
      action: "escalate",
      escalationLevel: "engineering",
      note: "Checking incident.",
    });
    await expect(page.getByTestId("admin-incidents-list")).toContainText("engineering");

    await page.getByTestId("admin-incidents-assigned-filter").click();
    await page.getByRole("option", { name: "Assigned only", exact: true }).click();
    await page.getByTestId("admin-incidents-escalation-filter").click();
    await page.getByRole("option", { name: "engineering" }).click();
    await page.getByTestId("admin-incidents-sla-filter").click();
    await page.getByRole("option", { name: "breached" }).click();
    await expect.poll(() => requestedUrls.some((url) =>
      url.includes("assigned=assigned") &&
      url.includes("escalationLevel=engineering") &&
      url.includes("slaStatus=breached"),
    )).toBe(true);

    await page.getByTestId(`admin-incident-select-${INCIDENT_ID}`).check();
    await expect(page.getByTestId("admin-incidents-selected-count")).toContainText("1 selected");
    await page.getByTestId("admin-incidents-bulk-note").fill("Bulk workflow note.");
    await page.getByTestId("admin-incidents-bulk-assignee").fill(USER_ID);
    await page.getByTestId("admin-incidents-bulk-assign").click();
    await expect.poll(() => postedBodies.length).toBe(4);
    expect(postedBodies[3]).toEqual({
      action: "assign",
      assignedToUserId: USER_ID,
      incidentIds: [INCIDENT_ID],
      note: "Bulk workflow note.",
    });
    await expect(page.getByTestId("admin-incidents-list")).toContainText("sha256:cccccccccccccccccccccccc");

    await page.getByTestId("admin-incidents-bulk-escalation").click();
    await page.getByRole("option", { name: "executive" }).click();
    await page.getByTestId("admin-incidents-bulk-escalate").click();
    await expect.poll(() => postedBodies.length).toBe(5);
    expect(postedBodies[4]).toEqual({
      action: "escalate",
      escalationLevel: "executive",
      incidentIds: [INCIDENT_ID],
      note: "Bulk workflow note.",
    });
    await expect(page.getByTestId("admin-incidents-list")).toContainText("executive");

    await page.getByTestId("admin-incidents-export-json").click();
    await expect(page.getByTestId("admin-incidents-export-status")).toContainText("JSON 1");
    await page.getByTestId("admin-incidents-export-csv").click();
    await expect(page.getByTestId("admin-incidents-export-status")).toContainText("CSV 1");

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
