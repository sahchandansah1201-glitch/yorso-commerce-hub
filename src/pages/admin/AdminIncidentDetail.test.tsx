import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import type { AdminIncidentDetailResponse } from "@/lib/admin-incidents-api";
import { buyerSession } from "@/lib/buyer-session";
import AdminIncidentDetail from "./AdminIncidentDetail";

const adminUserId = "00000000-0000-4000-8000-000000000099";
const adminSessionId = "session-admin-incident-detail-page";
const incidentId = "audit:admin-blocked:v1-admin-audit-events";

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
    evidence: [{ label: "status", value: "403" }],
    firstSeenAt: "2026-05-20T10:00:00.000Z",
    id: incidentId,
    lastSeenAt: "2026-05-20T10:01:00.000Z",
    note: null,
    recommendedActions: ["Confirm admin role."],
    relatedAuditIds: ["aud_page_detail_1"],
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
        eventId: `${incidentId}:created`,
        note: null,
        occurredAt: "2026-05-20T10:00:00.000Z",
        status: "open",
        type: "created",
      },
    ],
    title: "Blocked admin route access",
  },
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000705",
  timeline: [
    {
      actorUserHash: null,
      assignedToUserHash: null,
      escalationLevel: null,
      eventId: `${incidentId}:created`,
      note: null,
      occurredAt: "2026-05-20T10:00:00.000Z",
      status: "open",
      type: "created",
    },
  ],
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={[`/admin/incidents/${encodeURIComponent(incidentId)}`]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <Routes>
              <Route path="/admin/incidents/:incidentId" element={<AdminIncidentDetail />} />
            </Routes>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signInAdmin = () =>
  buyerSession.signIn({
    displayName: "Admin Incident Detail",
    id: adminSessionId,
    identifier: "admin@yorso.test",
    method: "email",
    source: "self_hosted",
    userId: adminUserId,
  });

describe("AdminIncidentDetail page", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("yorso-lang", "en");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    buyerSession.__resetForTests();
  });

  it("shows disabled and session-required states explicitly", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");
    signInAdmin();

    const { unmount } = renderPage();
    expect(screen.getByTestId("admin-incident-detail-disabled")).toHaveTextContent("Self-hosted API is not connected");
    unmount();

    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    buyerSession.__resetForTests();
    renderPage();

    expect(screen.getByTestId("admin-incident-detail-session-required")).toHaveTextContent("Self-hosted session required");
  });

  it("renders detail, workflow and handoff without leaking raw identifiers", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith("/handoff?format=json")) {
        return new Response(JSON.stringify({
          checklist: [
            { detail: "Owner missing.", label: "Owner assigned", status: "needs_attention" },
            { detail: "Escalation reviewed.", label: "Escalation reviewed", status: "ready" },
            { detail: "Evidence bounded.", label: "Evidence bounded", status: "ready" },
          ],
          generatedAt: "2026-05-20T10:04:00.000Z",
          handoffId: `handoff:${incidentId}`,
          incident: detailPayload().incident,
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000708",
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
          capacityNotes: [
            "Control-plane route.",
            "No polling.",
          ],
          generatedAt: "2026-05-20T10:05:00.000Z",
          incident: detailPayload().incident,
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000709",
          rollbackPlan: [
            "Do not delete audit evidence.",
            "Rollback the last runtime change.",
          ],
          steps: [
            {
              description: "Confirm admin role and review attempts.",
              evidenceRequired: "Audit screenshot.",
              ownerRole: "operator",
              priority: "immediate",
              targetMinutes: 15,
              title: "Confirm scope",
            },
            {
              description: "Record final timeline note.",
              evidenceRequired: "Timeline note.",
              ownerRole: "operator",
              priority: "follow_up",
              targetMinutes: 60,
              title: "Close loop",
            },
            {
              description: "Check metrics.",
              evidenceRequired: "Metric snapshot.",
              ownerRole: "engineering",
              priority: "next",
              targetMinutes: 20,
              title: "Validate runtime",
            },
          ],
          verificationChecks: [
            "No raw identifiers.",
            "Route still blocked.",
          ],
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
          postmortemId: `postmortem:${incidentId}`,
          preventionChecks: ["No raw identifiers.", "Route guard remains active.", "No polling added."],
          requestId: "00000000-0000-4000-8000-000000000710",
          rootCauseHypotheses: ["Role mismatch.", "Expected admin guard."],
          timeline: detailPayload().timeline,
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/postmortem?format=markdown")) {
        return new Response("# Incident postmortem draft\n\n- Source: audit\n", {
          headers: { "content-type": "text/markdown" },
        });
      }
      if (url.endsWith("/workflow")) {
        return new Response(JSON.stringify({
          incident: {
            ...detailPayload().incident,
            assignedAt: "2026-05-20T10:04:00.000Z",
            assignedToUserHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
            status: "acknowledged",
          },
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000707",
          timeline: detailPayload().timeline,
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/acknowledge")) {
        return new Response(JSON.stringify({
          incident: { ...detailPayload().incident, status: "acknowledged" },
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000706",
          timeline: detailPayload().timeline,
        }), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(detailPayload()), {
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchImpl);
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-incident-detail-hero");
    expect(screen.getByTestId("admin-incident-detail-page")).toHaveTextContent("Blocked admin route access");
    expect(screen.getByTestId("admin-incident-detail-evidence")).toHaveTextContent("403");
    expect(screen.getByTestId("admin-incident-detail-runbook")).toHaveTextContent("Confirm scope");
    expect(screen.getByTestId("admin-incident-detail-timeline")).toHaveTextContent("created");
    expect(screen.getByTestId("admin-incident-detail-readiness")).toHaveTextContent("3/5");
    expect(screen.getByTestId("admin-incident-detail-readiness")).toHaveTextContent("Owner assigned");
    expect(screen.getByTestId("admin-incident-detail-readiness")).toHaveTextContent("Needs attention");
    expect(screen.getByTestId("admin-incident-readiness-owner")).toHaveTextContent("Assign an owner");

    fireEvent.change(screen.getByTestId("admin-incident-detail-note"), {
      target: { value: "Email admin@yorso.test" },
    });
    expect(screen.getByTestId("admin-incident-detail-note-unsafe")).toHaveTextContent("Remove raw emails");
    expect(screen.getByTestId("admin-incident-detail-comment")).toBeDisabled();

    fireEvent.change(screen.getByTestId("admin-incident-detail-note"), {
      target: { value: "Checking detail." },
    });
    fireEvent.change(screen.getByTestId("admin-incident-detail-assignee"), {
      target: { value: adminUserId },
    });
    fireEvent.click(screen.getByTestId("admin-incident-detail-assign"));
    await waitFor(() => expect(screen.getByTestId("admin-incident-detail-page")).toHaveTextContent("sha256:bbbbbbbbbbbbbbbbbbbbbbbb"));
    expect(screen.getByTestId("admin-incident-detail-readiness")).toHaveTextContent("4/5");
    expect(screen.getByTestId("admin-incident-detail-readiness")).toHaveTextContent("sha256:bbbbbbbbbbbbbbbbbbbbbbbb");
    expect(screen.getByTestId("admin-incident-readiness-owner")).toHaveTextContent("Ready");

    fireEvent.click(screen.getByTestId("admin-incident-detail-handoff-json"));
    await screen.findByTestId("admin-incident-detail-handoff-preview");
    fireEvent.click(screen.getByTestId("admin-incident-detail-handoff-markdown"));
    await screen.findByTestId("admin-incident-detail-handoff-markdown-preview");
    fireEvent.click(screen.getByTestId("admin-incident-detail-remediation-load"));
    await screen.findByTestId("admin-incident-detail-remediation-plan");
    expect(screen.getByTestId("admin-incident-detail-remediation-plan")).toHaveTextContent("Confirm scope");
    expect(screen.getByTestId("admin-incident-detail-remediation-plan")).toHaveTextContent("No polling");
    fireEvent.click(screen.getByTestId("admin-incident-detail-postmortem-json"));
    await screen.findByTestId("admin-incident-detail-postmortem-preview");
    fireEvent.click(screen.getByTestId("admin-incident-detail-postmortem-markdown"));
    await screen.findByTestId("admin-incident-detail-postmortem-markdown-preview");
    expect(screen.getByTestId("admin-incident-detail-postmortem-preview")).toHaveTextContent("Add regression guard");
    expect(screen.getByTestId("admin-incident-detail-postmortem-markdown-preview")).toHaveTextContent("Incident postmortem draft");

    expect(screen.getByTestId("admin-incident-detail-page")).not.toHaveTextContent("admin@yorso.test");
    expect(screen.getByTestId("admin-incident-detail-page")).not.toHaveTextContent(adminSessionId);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.yorso.test/v1/admin/incidents/audit%3Aadmin-blocked%3Av1-admin-audit-events",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
