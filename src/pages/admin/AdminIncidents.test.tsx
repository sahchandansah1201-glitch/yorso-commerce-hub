import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import type { AdminIncidentListResponse, AdminIncidentSummary } from "@/lib/admin-incidents-api";
import { buyerSession } from "@/lib/buyer-session";
import AdminIncidents from "./AdminIncidents";

const adminUserId = "00000000-0000-4000-8000-000000000099";
const adminSessionId = "session-admin-incidents-page";

const incidentSummary = (patch: Partial<AdminIncidentSummary> = {}): AdminIncidentSummary => ({
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
  ...patch,
});

const incidentPayload = (): AdminIncidentListResponse => ({
  incidents: [
    {
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
      id: "audit:admin-blocked:v1-admin-audit-events",
      lastSeenAt: "2026-05-20T10:01:00.000Z",
      note: null,
      recommendedActions: ["Confirm whether the blocked actor should have admin role."],
      relatedAuditIds: ["aud_page_1"],
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
          eventId: "audit:admin-blocked:v1-admin-audit-events:created",
          note: null,
          occurredAt: "2026-05-20T10:00:00.000Z",
          status: "open",
          type: "created",
        },
      ],
      title: "Blocked admin route access",
    },
  ],
  limit: 25,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000505",
  summary: incidentSummary(),
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/incidents"]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <AdminIncidents />
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signInAdmin = () =>
  buyerSession.signIn({
    displayName: "Admin Incidents",
    id: adminSessionId,
    identifier: "admin@yorso.test",
    method: "email",
    source: "self_hosted",
    userId: adminUserId,
  });

describe("AdminIncidents page", () => {
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
    expect(screen.getByTestId("admin-incidents-disabled")).toHaveTextContent("Self-hosted API is not connected");
    expect(screen.getByTestId("admin-operator-nav-incidents")).toHaveAttribute("aria-current", "page");
    unmount();

    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    buyerSession.__resetForTests();
    renderPage();

    const gate = screen.getByTestId("admin-incidents-session-required");
    expect(gate).toHaveTextContent("Self-hosted session required");
    expect(within(gate).getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
  });

  it("renders incidents and acknowledges from the console without leaking secrets", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("/export?format=json")) {
        return new Response(JSON.stringify({
          count: 1,
          generatedAt: "2026-05-20T10:08:00.000Z",
          incidents: incidentPayload().incidents,
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000518",
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/export?format=csv")) {
        return new Response("\"id\",\"status\"\n\"audit:admin-blocked:v1-admin-audit-events\",\"open\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.endsWith("/workflow/bulk")) {
        return new Response(JSON.stringify({
          failed: [],
          incidents: [
            {
              ...incidentPayload().incidents[0],
              assignedAt: "2026-05-20T10:06:00.000Z",
              assignedToUserHash: "sha256:cccccccccccccccccccccccc",
              escalationLevel: "executive",
              escalatedAt: "2026-05-20T10:07:00.000Z",
              status: "acknowledged",
            },
          ],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000517",
          succeeded: 1,
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/acknowledge")) {
        return new Response(JSON.stringify({
          incident: {
            ...incidentPayload().incidents[0],
            acknowledgedAt: "2026-05-20T10:03:00.000Z",
            acknowledgedByUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
            note: "Checking incident.",
            status: "acknowledged",
          },
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000506",
          timeline: incidentPayload().incidents[0].timelinePreview,
        }), { headers: { "content-type": "application/json" } });
      }
      if (url.endsWith("/workflow")) {
        return new Response(JSON.stringify({
          incident: {
            ...incidentPayload().incidents[0],
            assignedAt: "2026-05-20T10:04:00.000Z",
            assignedToUserHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
            escalationLevel: "engineering",
            escalatedAt: "2026-05-20T10:05:00.000Z",
            status: "acknowledged",
            timelinePreview: [
              ...incidentPayload().incidents[0].timelinePreview,
              {
                actorUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
                assignedToUserHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
                escalationLevel: "engineering",
                eventId: "evt_workflow",
                note: "Workflow update.",
                occurredAt: "2026-05-20T10:05:00.000Z",
                status: "acknowledged",
                type: "escalated",
              },
            ],
          },
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000516",
          timeline: incidentPayload().incidents[0].timelinePreview,
        }), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(incidentPayload()), {
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchImpl);
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-incidents-list");
    expect(screen.getByTestId("admin-incidents-summary")).toHaveTextContent("Open incidents");
    expect(screen.getByTestId("admin-incidents-workload-summary")).toHaveTextContent("Assignment coverage");
    expect(screen.getByTestId("admin-incidents-workload-summary")).toHaveTextContent("Breach rate");
    expect(screen.getByTestId("admin-incidents-escalation-load")).toHaveTextContent("lead: 0");
    expect(screen.getByTestId("admin-incidents-source-mix")).toHaveTextContent("audit: 1");
    expect(screen.getByTestId("admin-incidents-list")).toHaveTextContent("Blocked admin route access");
    expect(screen.getByTestId("admin-incidents-list")).toHaveTextContent("Confirm scope");

    fireEvent.change(screen.getByTestId("admin-incident-note-audit:admin-blocked:v1-admin-audit-events"), {
      target: { value: "Checking incident." },
    });
    fireEvent.click(screen.getByTestId("admin-incident-ack-audit:admin-blocked:v1-admin-audit-events"));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));

    fireEvent.change(screen.getByTestId("admin-incident-assignee-audit:admin-blocked:v1-admin-audit-events"), {
      target: { value: adminUserId },
    });
    fireEvent.click(screen.getByTestId("admin-incident-assign-audit:admin-blocked:v1-admin-audit-events"));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(3));

    fireEvent.mouseDown(screen.getByTestId("admin-incident-escalation-audit:admin-blocked:v1-admin-audit-events"));
    fireEvent.click(screen.getByText("engineering"));
    fireEvent.click(screen.getByTestId("admin-incident-escalate-audit:admin-blocked:v1-admin-audit-events"));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(4));

    fireEvent.click(screen.getByTestId("admin-incident-select-audit:admin-blocked:v1-admin-audit-events"));
    expect(screen.getByTestId("admin-incidents-selected-count")).toHaveTextContent("1 selected");
    fireEvent.change(screen.getByTestId("admin-incidents-bulk-note"), {
      target: { value: "Bulk workflow note." },
    });
    fireEvent.change(screen.getByTestId("admin-incidents-bulk-assignee"), {
      target: { value: adminUserId },
    });
    fireEvent.click(screen.getByTestId("admin-incidents-bulk-assign"));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(5));

    fireEvent.click(screen.getByTestId("admin-incidents-export-json"));
    await waitFor(() => expect(screen.getByTestId("admin-incidents-export-status")).toHaveTextContent("JSON 1"));
    fireEvent.click(screen.getByTestId("admin-incidents-export-csv"));
    await waitFor(() => expect(screen.getByTestId("admin-incidents-export-status")).toHaveTextContent("CSV 1"));

    const firstUrl = String(fetchImpl.mock.calls[0][0]);
    expect(firstUrl).toContain("status=open");
    expect(String(fetchImpl.mock.calls[1][0])).toContain("/acknowledge");
    expect(String(fetchImpl.mock.calls[2][0])).toContain("/workflow");
    expect(String(fetchImpl.mock.calls[3][0])).toContain("/workflow");
    expect(String(fetchImpl.mock.calls[4][0])).toContain("/workflow/bulk");
    expect(String(fetchImpl.mock.calls[5][0])).toContain("/export?format=json");
    expect(String(fetchImpl.mock.calls[6][0])).toContain("/export?format=csv");
    const bodyText = document.body.textContent ?? "";
    expect(bodyText).not.toContain("admin@yorso.test");
    expect(bodyText).not.toContain(adminSessionId);
    expect(bodyText).not.toContain("postgres://");
  });

  it("keeps RU copy localized for forbidden sessions", async () => {
    localStorage.setItem("yorso-lang", "ru");
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({
          error: { code: "admin_role_required", message: "Admin role is required." },
        }), {
          headers: { "content-type": "application/json" },
          status: 403,
        }),
      ),
    );
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-incidents-forbidden");
    expect(screen.getByText("Нужна роль администратора")).toBeInTheDocument();
    expect(screen.queryByText("Admin role required")).toBeNull();
  });
});
