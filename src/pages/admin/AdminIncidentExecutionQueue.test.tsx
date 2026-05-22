import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { buyerSession } from "@/lib/buyer-session";
import AdminIncidentExecutionQueue from "./AdminIncidentExecutionQueue";

const adminUserId = "00000000-0000-4000-8000-000000000099";
const adminSessionId = "session-admin-incident-execution-queue-page";
const incidentId = "audit:admin-blocked:v1-admin-audit-events";
const itemId = "remediation:01:confirm-scope";

const queueItem = (status: "open" | "in_progress" | "done" = "open") => ({
  assignedToUserHash: null,
  blockedReason: null,
  completedAt: status === "done" ? "2026-05-20T10:16:00.000Z" : null,
  description: "Confirm admin role and review attempts.",
  evidenceNote: status === "done" ? "Evidence captured." : null,
  evidenceRequired: "Audit route evidence.",
  incidentDueAt: "2026-05-20T11:00:00.000Z",
  incidentId,
  incidentSeverity: "high",
  incidentSlaStatus: "breached",
  incidentSource: "audit",
  incidentStatus: "open",
  incidentTitle: "Blocked admin route access",
  itemId,
  note: null,
  overdue: true,
  ownerRole: "operator",
  priority: "immediate",
  source: "remediation_step",
  status,
  targetDueAt: "2026-05-20T10:15:00.000Z",
  targetMinutes: 15,
  title: "Confirm scope",
  updatedAt: status === "open" ? null : "2026-05-20T10:16:00.000Z",
  updatedByUserHash: status === "open" ? null : "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
});

const queuePayload = (status: "open" | "in_progress" | "done" = "open") => ({
  generatedAt: "2026-05-20T10:15:00.000Z",
  items: [queueItem(status)],
  limit: 50,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000751",
  summary: {
    assigned: 0,
    blocked: 0,
    done: status === "done" ? 1 : 0,
    inProgress: status === "in_progress" ? 1 : 0,
    open: status === "open" ? 1 : 0,
    overdue: status === "done" ? 0 : 1,
    skipped: 0,
    total: 1,
    unassigned: 1,
  },
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/incident-execution"]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <Routes>
              <Route path="/admin/incident-execution" element={<AdminIncidentExecutionQueue />} />
            </Routes>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signInAdmin = () =>
  buyerSession.signIn({
    displayName: "Admin Execution Queue",
    id: adminSessionId,
    identifier: "admin@yorso.test",
    method: "email",
    source: "self_hosted",
    userId: adminUserId,
  });

describe("AdminIncidentExecutionQueue page", () => {
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

  it("renders execution queue, exports and bulk updates selected items", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    signInAdmin();
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("/execution-queue/export") && url.includes("format=json")) {
        return new Response(JSON.stringify(queuePayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/execution-queue/export") && url.includes("format=csv")) {
        return new Response("\"incidentId\",\"itemId\"\n\"audit:admin-blocked:v1-admin-audit-events\",\"remediation:01:confirm-scope\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.endsWith("/execution-queue/bulk")) {
        return new Response(JSON.stringify({
          failed: [],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000752",
          succeeded: 1,
          updatedItems: [queueItem("in_progress")],
        }), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(queuePayload()), { headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchImpl);

    renderPage();

    await waitFor(() => expect(screen.getByTestId("admin-incident-execution-queue-page")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Blocked admin route access/)).toBeInTheDocument());
    expect(screen.queryByText("admin@yorso.test")).not.toBeInTheDocument();
    expect(screen.queryByText(adminSessionId)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("admin-incident-execution-export-json"));
    await waitFor(() => expect(screen.getByTestId("admin-incident-execution-export-status")).toHaveTextContent("1 items"));
    fireEvent.click(screen.getByTestId("admin-incident-execution-export-csv"));
    await waitFor(() => expect(screen.getByTestId("admin-incident-execution-export-status")).toHaveTextContent("1 CSV rows"));

    fireEvent.click(screen.getByTestId(`admin-incident-execution-select-${itemId}`));
    fireEvent.click(screen.getByTestId("admin-incident-execution-bulk-start"));

    await waitFor(() => expect(screen.getByText("in_progress")).toBeInTheDocument());
    expect(String(fetchImpl.mock.calls.at(-1)?.[0])).toContain("/execution-queue/bulk");
  });
});
