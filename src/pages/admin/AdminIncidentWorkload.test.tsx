import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { buyerSession } from "@/lib/buyer-session";
import AdminIncidentWorkload from "./AdminIncidentWorkload";

const adminUserId = "00000000-0000-4000-8000-000000000099";
const adminSessionId = "session-admin-incident-workload-page";
const incidentId = "audit:admin-blocked:v1-admin-audit-events";

const incident = {
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
  id: incidentId,
  lastSeenAt: "2026-05-20T10:01:00.000Z",
  note: null,
  recommendedActions: ["Confirm admin role."],
  relatedAuditIds: ["aud_1"],
  route: "/v1/admin/audit-events",
  runbook: [{ description: "Confirm admin role.", label: "Confirm scope", ownerRole: "operator", targetMinutes: 15 }],
  severity: "high",
  slaStatus: "breached",
  source: "audit",
  status: "open",
  timelinePreview: [{
    actorUserHash: null,
    assignedToUserHash: null,
    escalationLevel: null,
    eventId: "audit:admin-blocked:v1-admin-audit-events:created",
    note: null,
    occurredAt: "2026-05-20T10:00:00.000Z",
    status: "open",
    type: "created",
  }],
  title: "Blocked admin route access",
};

const workloadPayload = () => ({
  generatedAt: "2026-05-20T10:16:00.000Z",
  hotIncidents: [{
    blockedItems: 0,
    dueAt: "2026-05-20T11:00:00.000Z",
    immediateItems: 1,
    incidentId,
    loadScore: 24,
    nextTargetDueAt: "2026-05-20T10:15:00.000Z",
    openItems: 1,
    overdueItems: 1,
    severity: "high",
    slaStatus: "breached",
    source: "audit",
    status: "open",
    title: "Blocked admin route access",
    topOwnerRole: "operator",
    unassignedItems: 1,
  }],
  limit: 20,
  offset: 0,
  ok: true,
  owners: [
    { assigned: 0, blocked: 0, breachedIncidents: 1, done: 0, immediate: 1, inProgress: 0, loadScore: 24, oldestTargetMinutes: 1, open: 1, overdue: 1, ownerRole: "operator", skipped: 0, total: 1, unassigned: 1 },
    { assigned: 0, blocked: 0, breachedIncidents: 0, done: 0, immediate: 0, inProgress: 0, loadScore: 0, oldestTargetMinutes: 0, open: 0, overdue: 0, ownerRole: "engineering", skipped: 0, total: 0, unassigned: 0 },
    { assigned: 0, blocked: 0, breachedIncidents: 0, done: 0, immediate: 0, inProgress: 0, loadScore: 0, oldestTargetMinutes: 0, open: 0, overdue: 0, ownerRole: "security", skipped: 0, total: 0, unassigned: 0 },
    { assigned: 0, blocked: 0, breachedIncidents: 0, done: 0, immediate: 0, inProgress: 0, loadScore: 0, oldestTargetMinutes: 0, open: 0, overdue: 0, ownerRole: "founder", skipped: 0, total: 0, unassigned: 0 },
  ],
  requestId: "00000000-0000-4000-8000-000000000781",
  sourceMix: [{ blocked: 0, done: 0, inProgress: 0, key: "audit", open: 1, overdue: 1, total: 1 }],
  statusMix: [{ blocked: 0, done: 0, inProgress: 0, key: "open", open: 1, overdue: 1, total: 1 }],
  summary: { assigned: 0, blocked: 0, done: 0, hotIncidentCount: 1, inProgress: 0, loadScore: 24, open: 1, overdue: 1, total: 1, unassigned: 1 },
});

const correlationPayload = () => ({
  auditEvents: [],
  executionItems: [],
  generatedAt: "2026-05-20T10:17:00.000Z",
  incident,
  ok: true,
  recommendedNextSteps: ["Compare audit and execution state.", "Record sanitized operator note."],
  requestId: "00000000-0000-4000-8000-000000000782",
  signals: [{ actorUserHash: null, evidence: [{ label: "type", value: "created" }], label: "Timeline created", occurredAt: "2026-05-20T10:00:00.000Z", priority: "next", route: null, source: "timeline_event", status: "open" }],
  summary: { auditEvents: 0, blockedItems: 0, doneItems: 0, openItems: 0, timelineEvents: 1 },
  timeline: incident.timelinePreview,
});

const forecastPayload = () => ({
  assumptions: [
    "Forecast window: 24 hour(s).",
    "Projection uses current bounded execution items only.",
  ],
  generatedAt: "2026-05-20T10:18:00.000Z",
  horizonHours: 24,
  ok: true,
  owners: [
    { capacityRisk: "moderate", currentOpen: 1, currentOverdue: 1, currentScore: 24, ownerRole: "operator", projectedOpen: 2, projectedOverdue: 2, recommendedAction: "Keep operator queue under review." },
    { capacityRisk: "low", currentOpen: 0, currentOverdue: 0, currentScore: 0, ownerRole: "engineering", projectedOpen: 0, projectedOverdue: 0, recommendedAction: "No extra engineering action required." },
    { capacityRisk: "low", currentOpen: 0, currentOverdue: 0, currentScore: 0, ownerRole: "security", projectedOpen: 0, projectedOverdue: 0, recommendedAction: "No extra security action required." },
    { capacityRisk: "low", currentOpen: 0, currentOverdue: 0, currentScore: 0, ownerRole: "founder", projectedOpen: 0, projectedOverdue: 0, recommendedAction: "No extra founder action required." },
  ],
  requestId: "00000000-0000-4000-8000-000000000783",
  summary: {
    capacityRisk: "moderate",
    highestRiskOwnerRole: "operator",
    projectedOpen: 2,
    projectedOverdue: 2,
    recommendedAction: "Moderate capacity risk: monitor operator workload and assign unowned work.",
  },
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/incident-workload"]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <Routes>
              <Route path="/admin/incident-workload" element={<AdminIncidentWorkload />} />
            </Routes>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signInAdmin = () =>
  buyerSession.signIn({
    displayName: "Admin Workload",
    id: adminSessionId,
    identifier: "admin@yorso.test",
    method: "email",
    source: "self_hosted",
    userId: adminUserId,
  });

describe("AdminIncidentWorkload page", () => {
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
    expect(screen.getByText("Self-hosted API is not connected")).toBeInTheDocument();
    unmount();

    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    buyerSession.__resetForTests();
    renderPage();

    expect(screen.getByText("Self-hosted session required")).toBeInTheDocument();
  });

  it("renders workload, exports and correlation drill-down", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    signInAdmin();
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("/execution-workload/export") && url.includes("format=json")) {
        return new Response(JSON.stringify(workloadPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/execution-workload/export") && url.includes("format=csv")) {
        return new Response("\"incidentId\",\"loadScore\"\n\"audit:admin-blocked:v1-admin-audit-events\",\"24\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.includes("/correlation")) {
        return new Response(JSON.stringify(correlationPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/execution-workload/forecast")) {
        return new Response(JSON.stringify(forecastPayload()), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(workloadPayload()), { headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchImpl);

    renderPage();

    await waitFor(() => expect(screen.getByTestId("admin-incident-workload-page")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Blocked admin route access/)).toBeInTheDocument());
    expect(screen.queryByText("admin@yorso.test")).not.toBeInTheDocument();
    expect(screen.queryByText(adminSessionId)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("admin-incident-workload-export-json"));
    await waitFor(() => expect(screen.getByTestId("admin-incident-workload-export-status")).toHaveTextContent("1 incidents"));
    fireEvent.click(screen.getByTestId("admin-incident-workload-export-csv"));
    await waitFor(() => expect(screen.getByTestId("admin-incident-workload-export-status")).toHaveTextContent("1 CSV rows"));

    fireEvent.click(screen.getByTestId(`admin-incident-workload-correlation-${incidentId}`));

    await waitFor(() => expect(screen.getByTestId("admin-incident-workload-correlation-signals")).toHaveTextContent("Timeline created"));
    expect(String(fetchImpl.mock.calls.at(-1)?.[0])).toContain("/correlation");

    fireEvent.click(screen.getByTestId("admin-incident-workload-forecast-load"));
    await waitFor(() => expect(screen.getByTestId("admin-incident-workload-forecast-summary")).toHaveTextContent("moderate"));
    expect(screen.getByTestId("admin-incident-workload-forecast-owners")).toHaveTextContent("operator");
  });
});
