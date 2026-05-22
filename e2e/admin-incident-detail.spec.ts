/**
 * E2E · API-backed admin incident detail.
 *
 * Batch #103 browser guard:
 * - /admin/incidents/:incidentId renders a single sanitized incident from the self-hosted API;
 * - workflow actions update the detail page without raw user ids, emails or session ids;
 * - JSON and Markdown handoff exports are requested from /handoff with admin session headers;
 * - remediation plan is requested from /remediation and shown as bounded operator steps;
 * - JSON and Markdown postmortem drafts are requested from /postmortem without leaking secrets;
 * - Batch #104 execution tracker requests /execution, exports JSON/CSV and posts bounded item status evidence;
 * - the list page links to the detail route.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-4000-8000-000000000099";
const SESSION_ID = "session_admin_incident_detail_e2e_103";
const INCIDENT_ID = "audit:admin-blocked:v1-admin-audit-events";
const EXECUTION_ITEM_ID = "remediation:01:confirm-scope";

const timeline = [
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
];

const incident = (patch = {}) => ({
  acknowledgedAt: null,
  acknowledgedByUserHash: null,
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
  note: null,
  recommendedActions: ["Confirm whether the blocked actor should have admin role."],
  relatedAuditIds: ["aud_e2e_detail_1"],
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
  timelinePreview: timeline,
  title: "Blocked admin route access",
  ...patch,
});

const listPayload = () => ({
  incidents: [incident()],
  limit: 25,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000721",
  summary: {
    acknowledged: 0,
    access: 0,
    assigned: 0,
    assignmentCoveragePct: 0,
    atRisk: 0,
    audit: 1,
    breachRatePct: 100,
    breached: 1,
    critical: 0,
    engineeringEscalations: 0,
    escalated: 0,
    executiveEscalations: 0,
    high: 1,
    leadEscalations: 0,
    open: 1,
    openCritical: 0,
    oldestOpenMinutes: 1,
    policy: 0,
    resolved: 0,
    runtime: 0,
    security: 0,
    total: 1,
    unassigned: 1,
  },
});

const detailPayload = (patch = {}) => ({
  incident: incident(patch),
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000722",
  timeline,
});

const executionPayload = (status: "open" | "in_progress" | "blocked" | "done" | "skipped" = "open") => ({
  generatedAt: "2026-05-20T10:07:00.000Z",
  incident: incident(),
  items: [
    {
      assignedToUserHash: null,
      blockedReason: status === "blocked" ? "Waiting for audit owner." : null,
      completedAt: status === "done" ? "2026-05-20T10:08:00.000Z" : null,
      description: "Confirm admin role and review attempts.",
      evidenceNote: status === "done" ? "Audit route evidence captured." : null,
      evidenceRequired: "Audit route evidence.",
      itemId: EXECUTION_ITEM_ID,
      note: status === "in_progress" ? "Starting execution." : null,
      ownerRole: "operator",
      priority: "immediate",
      source: "remediation_step",
      status,
      targetMinutes: 15,
      title: "Confirm scope",
      updatedAt: status === "open" ? null : "2026-05-20T10:08:00.000Z",
      updatedByUserHash: status === "open" ? null : "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
    },
  ],
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000728",
  summary: {
    blocked: status === "blocked" ? 1 : 0,
    done: status === "done" ? 1 : 0,
    inProgress: status === "in_progress" ? 1 : 0,
    open: status === "open" ? 1 : 0,
    skipped: status === "skipped" ? 1 : 0,
    total: 1,
  },
});

const executionUpdatePayload = () => ({
  ...executionPayload("done"),
  updatedItem: executionPayload("done").items[0],
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
        displayName: "Admin Incident Detail",
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

test.describe("Admin incident detail", () => {
  test("opens from list, updates workflow and exports sanitized handoff", async ({ page }) => {
    const requestHeaders: Array<Record<string, string>> = [];
    const requestedUrls: string[] = [];
    const postedBodies: unknown[] = [];
    await installAdminSession(page);

    await page.route("**/__e2e-api/v1/admin/incidents?**", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await json(route, listPayload());
    });
    await page.route("**/__e2e-api/v1/admin/incidents/*/handoff?format=json", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await json(route, {
        checklist: [
          { detail: "Owner missing.", label: "Owner assigned", status: "needs_attention" },
          { detail: "Escalation reviewed.", label: "Escalation reviewed", status: "ready" },
          { detail: "Evidence bounded.", label: "Evidence bounded", status: "ready" },
        ],
        generatedAt: "2026-05-20T10:04:00.000Z",
        handoffId: `handoff:${INCIDENT_ID}`,
        incident: incident(),
        ok: true,
        requestId: "00000000-0000-4000-8000-000000000725",
        sections: [
          { body: ["Status: open"], title: "Incident snapshot" },
          { body: ["Confirm admin role."], title: "Recommended next actions" },
          { body: ["Confirm scope."], title: "Runbook" },
        ],
        timeline,
      });
    });
    await page.route("**/__e2e-api/v1/admin/incidents/*/remediation", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await json(route, {
        capacityNotes: [
          "Control-plane route.",
          "No polling.",
        ],
        generatedAt: "2026-05-20T10:05:00.000Z",
        incident: incident(),
        ok: true,
        requestId: "00000000-0000-4000-8000-000000000726",
        rollbackPlan: [
          "Do not delete audit evidence.",
          "Rollback the last runtime change.",
        ],
        steps: [
          {
            description: "Confirm admin role and review attempts.",
            evidenceRequired: "Audit route evidence.",
            ownerRole: "operator",
            priority: "immediate",
            targetMinutes: 15,
            title: "Confirm scope",
          },
          {
            description: "Review metrics.",
            evidenceRequired: "Metrics snapshot.",
            ownerRole: "engineering",
            priority: "next",
            targetMinutes: 20,
            title: "Validate runtime",
          },
          {
            description: "Write final note.",
            evidenceRequired: "Timeline note.",
            ownerRole: "operator",
            priority: "follow_up",
            targetMinutes: 60,
            title: "Close loop",
          },
        ],
        verificationChecks: [
          "No raw identifiers.",
          "Route still blocked.",
        ],
      });
    });
    await page.route("**/__e2e-api/v1/admin/incidents/*/handoff?format=markdown", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await route.fulfill({
        body: "# Incident handoff\n\n- Status: open\n",
        contentType: "text/markdown",
        status: 200,
      });
    });
    await page.route("**/__e2e-api/v1/admin/incidents/*/postmortem?format=json", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await json(route, {
        actionItems: [
          {
            evidenceRequired: "Timeline note.",
            ownerRole: "operator",
            priority: "immediate",
            targetHours: 1,
            title: "Close incident narrative",
          },
          {
            evidenceRequired: "Regression guard.",
            ownerRole: "engineering",
            priority: "next",
            targetHours: 48,
            title: "Add regression guard",
          },
          {
            evidenceRequired: "Capacity note.",
            ownerRole: "engineering",
            priority: "follow_up",
            targetHours: 72,
            title: "Update capacity review",
          },
        ],
        capacityReview: ["Explicit operator action.", "Bounded payload.", "No customer hot-path scan."],
        executiveSummary: "Blocked admin route access was derived from audit signals.",
        generatedAt: "2026-05-20T10:06:00.000Z",
        impactSummary: ["Source: audit.", "Status: open."],
        incident: incident(),
        ok: true,
        postmortemId: `postmortem:${INCIDENT_ID}`,
        preventionChecks: ["No raw identifiers.", "Route guard remains active.", "No polling added."],
        requestId: "00000000-0000-4000-8000-000000000727",
        rootCauseHypotheses: ["Role mismatch.", "Expected admin guard."],
        timeline,
      });
    });
    await page.route("**/__e2e-api/v1/admin/incidents/*/postmortem?format=markdown", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await route.fulfill({
        body: "# Incident postmortem draft\n\n- Source: audit\n",
        contentType: "text/markdown",
        status: 200,
      });
    });
    await page.route("**/__e2e-api/v1/admin/incidents/*/execution/export?format=json", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await json(route, executionPayload());
    });
    await page.route("**/__e2e-api/v1/admin/incidents/*/execution/export?format=csv", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await route.fulfill({
        body: "\"itemId\",\"status\"\n\"remediation:01:confirm-scope\",\"open\"",
        contentType: "text/csv",
        status: 200,
      });
    });
    await page.route(`**/__e2e-api/v1/admin/incidents/*/execution/${encodeURIComponent(EXECUTION_ITEM_ID)}`, async (route) => {
      postedBodies.push(route.request().postDataJSON());
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await json(route, executionUpdatePayload());
    });
    await page.route("**/__e2e-api/v1/admin/incidents/*/execution", async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await json(route, executionPayload());
    });
    await page.route("**/__e2e-api/v1/admin/incidents/*/workflow", async (route) => {
      postedBodies.push(route.request().postDataJSON());
      await json(route, {
        incident: incident({
          assignedAt: "2026-05-20T10:04:00.000Z",
          assignedToUserHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
          status: "acknowledged",
        }),
        ok: true,
        requestId: "00000000-0000-4000-8000-000000000724",
        timeline: [
          ...timeline,
          {
            actorUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
            assignedToUserHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
            escalationLevel: null,
            eventId: "evt_assign",
            note: "Assign detail.",
            occurredAt: "2026-05-20T10:04:00.000Z",
            status: "acknowledged",
            type: "assigned",
          },
        ],
      });
    });
    await page.route(`**/__e2e-api/v1/admin/incidents/${encodeURIComponent(INCIDENT_ID)}`, async (route) => {
      requestHeaders.push(route.request().headers());
      requestedUrls.push(route.request().url());
      await json(route, detailPayload());
    });

    await page.goto("/admin/incidents", { waitUntil: "domcontentloaded" });
    await page.getByTestId(`admin-incident-open-detail-${INCIDENT_ID}`).click();

    await expect(page).toHaveURL(new RegExp(`/admin/incidents/${encodeURIComponent(INCIDENT_ID)}$`));
    await expect(page.getByTestId("admin-incident-detail-page")).toBeVisible();
    await expect(page.getByTestId("admin-incident-detail-hero")).toContainText("Blocked admin route access");
    await expect(page.getByTestId("admin-incident-detail-evidence")).toContainText("403");
    await expect(page.getByTestId("admin-incident-detail-runbook")).toContainText("Confirm scope");
    await expect(page.getByTestId("admin-incident-detail-timeline")).toContainText("created");
    await expect(page.getByTestId("admin-incident-detail-readiness")).toContainText("3/5");
    await expect(page.getByTestId("admin-incident-detail-readiness")).toContainText("Owner assigned");
    await expect(page.getByTestId("admin-incident-detail-readiness")).toContainText("Needs attention");
    await expect(page.getByTestId("admin-incident-readiness-owner")).toContainText("Assign an owner");

    await page.getByTestId("admin-incident-detail-note").fill("Assign detail.");
    await page.getByTestId("admin-incident-detail-assignee").fill(USER_ID);
    await page.getByTestId("admin-incident-detail-assign").click();
    await expect(page.getByTestId("admin-incident-detail-page")).toContainText("sha256:bbbbbbbbbbbbbbbbbbbbbbbb");
    await expect(page.getByTestId("admin-incident-detail-readiness")).toContainText("4/5");
    await expect(page.getByTestId("admin-incident-detail-readiness")).toContainText("sha256:bbbbbbbbbbbbbbbbbbbbbbbb");
    await expect(page.getByTestId("admin-incident-readiness-owner")).toContainText("Ready");
    expect(postedBodies[0]).toEqual({
      action: "assign",
      assignedToUserId: USER_ID,
      note: "Assign detail.",
    });

    await page.getByTestId("admin-incident-detail-handoff-json").click();
    await expect(page.getByTestId("admin-incident-detail-handoff-preview")).toContainText("handoff:audit");
    await page.getByTestId("admin-incident-detail-handoff-markdown").click();
    await expect(page.getByTestId("admin-incident-detail-handoff-markdown-preview")).toContainText("# Incident handoff");
    await page.getByTestId("admin-incident-detail-remediation-load").click();
    await expect(page.getByTestId("admin-incident-detail-remediation-plan")).toContainText("Confirm scope");
    await expect(page.getByTestId("admin-incident-detail-remediation-plan")).toContainText("No polling");
    await page.getByTestId("admin-incident-detail-postmortem-json").click();
    await expect(page.getByTestId("admin-incident-detail-postmortem-preview")).toContainText("Add regression guard");
    await page.getByTestId("admin-incident-detail-postmortem-markdown").click();
    await expect(page.getByTestId("admin-incident-detail-postmortem-markdown-preview")).toContainText("Incident postmortem draft");
    await page.getByTestId("admin-incident-detail-execution-load").click();
    await expect(page.getByTestId("admin-incident-detail-execution-plan")).toContainText("Confirm scope");
    await expect(page.getByTestId("admin-incident-detail-execution-status")).toContainText("0/1 done");
    await page.getByTestId("admin-incident-detail-execution-json").click();
    await expect(page.getByTestId("admin-incident-detail-execution-export-preview")).toContainText("Confirm scope");
    await page.getByTestId("admin-incident-detail-execution-csv").click();
    await expect(page.getByTestId("admin-incident-detail-execution-csv-preview")).toContainText("\"itemId\",\"status\"");
    await page.getByTestId("admin-incident-detail-execution-note").fill("Email admin@yorso.test");
    await expect(page.getByTestId("admin-incident-detail-execution-note-unsafe")).toContainText("Remove raw emails");
    await expect(page.getByTestId(`admin-incident-execution-start-${EXECUTION_ITEM_ID}`)).toBeDisabled();
    await page.getByTestId("admin-incident-detail-execution-note").fill("Execution started.");
    await page.getByTestId("admin-incident-detail-execution-evidence").fill("Audit route evidence captured.");
    await page.getByTestId(`admin-incident-execution-done-${EXECUTION_ITEM_ID}`).click();
    await expect(page.getByTestId("admin-incident-detail-execution-status")).toContainText("1/1 done");
    await expect(page.getByTestId(`admin-incident-execution-item-${EXECUTION_ITEM_ID}`)).toContainText("Audit route evidence captured.");

    expect(requestHeaders[0]["x-yorso-user-id"]).toBe(USER_ID);
    expect(requestHeaders[0]["x-yorso-session-id"]).toBe(SESSION_ID);
    expect(requestedUrls.some((url) => url.includes("/handoff?format=json"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/handoff?format=markdown"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/remediation"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/postmortem?format=json"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/postmortem?format=markdown"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/execution"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/execution/export?format=json"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("/execution/export?format=csv"))).toBe(true);
    expect(postedBodies).toContainEqual({
      evidenceNote: "Audit route evidence captured.",
      note: "Execution started.",
      status: "done",
    });
    await expect(page.getByTestId("admin-incident-detail-page")).not.toContainText("admin@yorso.test");
    await expect(page.getByTestId("admin-incident-detail-page")).not.toContainText(SESSION_ID);
  });
});
