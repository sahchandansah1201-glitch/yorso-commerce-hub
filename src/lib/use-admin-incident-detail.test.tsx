import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  AdminIncidentDetailResponse,
  AdminIncidentSummary,
} from "@/lib/admin-incidents-api";
import type { BuyerSession } from "@/lib/buyer-session";
import { useAdminIncidentDetail } from "@/lib/use-admin-incident-detail";

const adminSession: BuyerSession = {
  displayName: "Admin",
  id: "session-admin-incident-detail-hook",
  identifier: "admin@yorso.test",
  method: "email",
  signedInAt: "2026-05-20T10:00:00.000Z",
  source: "self_hosted",
  userId: "00000000-0000-4000-8000-000000000099",
};

const summary = (): AdminIncidentSummary => ({
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
});

const detailPayload = (): AdminIncidentDetailResponse => ({
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
    evidence: [{ label: "route", value: "/v1/admin/audit-events" }],
    firstSeenAt: "2026-05-20T10:00:00.000Z",
    id: "audit:admin-blocked:v1-admin-audit-events",
    lastSeenAt: "2026-05-20T10:01:00.000Z",
    note: null,
    recommendedActions: ["Confirm admin role."],
    relatedAuditIds: ["aud_1"],
    route: "/v1/admin/audit-events",
    runbook: [
      {
        description: "Confirm admin role and review attempts.",
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
        eventId: "audit:admin-blocked:v1-admin-audit-events:created",
        note: null,
        occurredAt: "2026-05-20T10:00:00.000Z",
        status: "open",
        type: "created",
      },
    ],
    title: "Blocked admin route access",
  },
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000701",
  timeline: [
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
});

describe("useAdminIncidentDetail", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns disabled state without VITE_YORSO_API_URL", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    const { result } = renderHook(() =>
      useAdminIncidentDetail(adminSession, "audit:admin-blocked:v1-admin-audit-events"),
    );

    expect(result.current.status).toBe("disabled");
  });

  it("loads detail, updates workflow and exports sanitized handoff", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn(async (input) => {
      const url = String(input);
      if (url.endsWith("/handoff?format=json")) {
        return new Response(JSON.stringify({
          checklist: [
            { detail: "Owner missing.", label: "Owner assigned", status: "needs_attention" },
            { detail: "Escalation reviewed.", label: "Escalation reviewed", status: "ready" },
            { detail: "Evidence bounded.", label: "Evidence bounded", status: "ready" },
          ],
          generatedAt: "2026-05-20T10:04:00.000Z",
          handoffId: "handoff:audit:admin-blocked:v1-admin-audit-events",
          incident: detailPayload().incident,
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000704",
          sections: [
            { body: ["Status: open"], title: "Incident snapshot" },
            { body: ["Confirm admin role."], title: "Recommended next actions" },
            { body: ["Confirm scope."], title: "Runbook" },
          ],
          timeline: detailPayload().timeline,
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/handoff?format=markdown")) {
        return new Response("# Incident handoff\n\n- Status: open\n", {
          headers: { "content-type": "text/markdown" },
        });
      }
      if (url.endsWith("/remediation")) {
        return new Response(JSON.stringify({
          capacityNotes: ["Control-plane route.", "No polling."],
          generatedAt: "2026-05-20T10:05:00.000Z",
          incident: detailPayload().incident,
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000705",
          rollbackPlan: ["Keep evidence.", "Rollback latest runtime change."],
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
          verificationChecks: ["No raw identifiers.", "Route still blocked."],
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/postmortem?format=json")) {
        return new Response(JSON.stringify({
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
          incident: detailPayload().incident,
          ok: true,
          postmortemId: "postmortem:audit:admin-blocked:v1-admin-audit-events",
          preventionChecks: ["No raw identifiers.", "Route guard remains active.", "No polling added."],
          requestId: "00000000-0000-4000-8000-000000000706",
          rootCauseHypotheses: ["Role mismatch.", "Expected admin guard."],
          timeline: detailPayload().timeline,
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/postmortem?format=markdown")) {
        return new Response("# Incident postmortem draft\n\n- Source: audit\n", {
          headers: { "content-type": "text/markdown" },
        });
      }
      if (url.endsWith("/execution")) {
        return new Response(JSON.stringify({
          generatedAt: "2026-05-20T10:07:00.000Z",
          incident: detailPayload().incident,
          items: [
            {
              assignedToUserHash: null,
              blockedReason: null,
              completedAt: null,
              description: "Confirm admin role and review attempts.",
              evidenceNote: null,
              evidenceRequired: "Audit route evidence.",
              itemId: "remediation:01:confirm-scope",
              note: null,
              ownerRole: "operator",
              priority: "immediate",
              source: "remediation_step",
              status: "open",
              targetMinutes: 15,
              title: "Confirm scope",
              updatedAt: null,
              updatedByUserHash: null,
            },
          ],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000707",
          summary: { blocked: 0, done: 0, inProgress: 0, open: 1, skipped: 0, total: 1 },
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/execution/export?format=json")) {
        return new Response(JSON.stringify({
          generatedAt: "2026-05-20T10:07:30.000Z",
          incident: detailPayload().incident,
          items: [
            {
              assignedToUserHash: null,
              blockedReason: null,
              completedAt: null,
              description: "Confirm admin role and review attempts.",
              evidenceNote: null,
              evidenceRequired: "Audit route evidence.",
              itemId: "remediation:01:confirm-scope",
              note: null,
              ownerRole: "operator",
              priority: "immediate",
              source: "remediation_step",
              status: "open",
              targetMinutes: 15,
              title: "Confirm scope",
              updatedAt: null,
              updatedByUserHash: null,
            },
          ],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000709",
          summary: { blocked: 0, done: 0, inProgress: 0, open: 1, skipped: 0, total: 1 },
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/execution/export?format=csv")) {
        return new Response("\"itemId\",\"status\"\n\"remediation:01:confirm-scope\",\"open\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.endsWith("/execution/remediation%3A01%3Aconfirm-scope")) {
        return new Response(JSON.stringify({
          generatedAt: "2026-05-20T10:08:00.000Z",
          incident: detailPayload().incident,
          items: [
            {
              assignedToUserHash: null,
              blockedReason: null,
              completedAt: "2026-05-20T10:08:00.000Z",
              description: "Confirm admin role and review attempts.",
              evidenceNote: "Audit route verified.",
              evidenceRequired: "Audit route evidence.",
              itemId: "remediation:01:confirm-scope",
              note: "Done.",
              ownerRole: "operator",
              priority: "immediate",
              source: "remediation_step",
              status: "done",
              targetMinutes: 15,
              title: "Confirm scope",
              updatedAt: "2026-05-20T10:08:00.000Z",
              updatedByUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
            },
          ],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000708",
          summary: { blocked: 0, done: 1, inProgress: 0, open: 0, skipped: 0, total: 1 },
          updatedItem: {
            assignedToUserHash: null,
            blockedReason: null,
            completedAt: "2026-05-20T10:08:00.000Z",
            description: "Confirm admin role and review attempts.",
            evidenceNote: "Audit route verified.",
            evidenceRequired: "Audit route evidence.",
            itemId: "remediation:01:confirm-scope",
            note: "Done.",
            ownerRole: "operator",
            priority: "immediate",
            source: "remediation_step",
            status: "done",
            targetMinutes: 15,
            title: "Confirm scope",
            updatedAt: "2026-05-20T10:08:00.000Z",
            updatedByUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
          },
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/workflow")) {
        return new Response(JSON.stringify({
          incident: {
            ...detailPayload().incident,
            assignedAt: "2026-05-20T10:03:00.000Z",
            assignedToUserHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
            status: "acknowledged",
          },
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000703",
          timeline: detailPayload().timeline,
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/acknowledge")) {
        return new Response(JSON.stringify({
          incident: { ...detailPayload().incident, status: "acknowledged" },
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000702",
          timeline: detailPayload().timeline,
        }), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(detailPayload()), {
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchImpl);

    const { result } = renderHook(() =>
      useAdminIncidentDetail(adminSession, "audit:admin-blocked:v1-admin-audit-events"),
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.incident.title).toBe("Blocked admin route access");

    await act(async () => {
      await result.current.acknowledge("acknowledged", "Checking incident.");
    });
    expect(result.current.data?.incident.status).toBe("acknowledged");

    await act(async () => {
      await result.current.workflow({
        action: "assign",
        assignedToUserId: "00000000-0000-4000-8000-000000000099",
        note: "Assign incident.",
      });
    });
    expect(result.current.data?.incident.assignedToUserHash).toBe("sha256:bbbbbbbbbbbbbbbbbbbbbbbb");

    await act(async () => {
      await result.current.exportHandoffJson();
      await result.current.exportHandoffMarkdown();
      await result.current.loadRemediationPlan();
      await result.current.exportPostmortemJson();
      await result.current.exportPostmortemMarkdown();
      await result.current.loadExecution();
      await result.current.exportExecutionJson();
      await result.current.exportExecutionCsv();
    });
    expect(result.current.handoffJson?.sections.map((section) => section.title)).toContain("Runbook");
    expect(result.current.handoffMarkdown).toContain("# Incident handoff");
    expect(result.current.handoffStatus).toContain("Markdown");
    expect(result.current.remediationPlan?.steps.map((step) => step.title)).toContain("Confirm scope");
    expect(result.current.remediationStatus).toContain("steps");
    expect(result.current.postmortemJson?.actionItems.map((item) => item.title)).toContain("Add regression guard");
    expect(result.current.postmortemMarkdown).toContain("# Incident postmortem draft");
    expect(result.current.postmortemStatus).toContain("Markdown");
    expect(result.current.execution?.items[0].itemId).toBe("remediation:01:confirm-scope");
    expect(result.current.executionStatus).toBe("0/1 done");
    expect(result.current.executionExportJson?.summary.total).toBe(1);
    expect(result.current.executionCsv).toContain("\"itemId\",\"status\"");
    expect(result.current.executionExportStatus).toContain("CSV");
    await act(async () => {
      await result.current.updateExecutionItem("remediation:01:confirm-scope", {
        evidenceNote: "Audit route verified.",
        note: "Done.",
        status: "done",
      });
    });
    expect(result.current.execution?.summary.done).toBe(1);
    expect(result.current.execution?.items[0].evidenceNote).toBe("Audit route verified.");
    expect(result.current.executionStatus).toBe("1/1 done");
    expect(JSON.stringify(result.current.handoffJson)).not.toContain("admin@yorso.test");
    expect(JSON.stringify(result.current.postmortemJson)).not.toContain("admin@yorso.test");
    expect(summary().total).toBe(1);
  });

  it("maps forbidden state", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: { code: "admin_role_required" } }), {
        headers: { "content-type": "application/json" },
        status: 403,
      }),
    ));

    const { result } = renderHook(() =>
      useAdminIncidentDetail(adminSession, "audit:admin-blocked:v1-admin-audit-events"),
    );

    await waitFor(() => expect(result.current.status).toBe("forbidden"));
  });
});
