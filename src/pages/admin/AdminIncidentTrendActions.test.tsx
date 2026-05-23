import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { buyerSession } from "@/lib/buyer-session";
import AdminIncidentTrendActions from "./AdminIncidentTrendActions";

const adminUserId = "00000000-0000-4000-8000-000000000099";
const adminSessionId = "session-admin-trend-action-queue-page";
const actionId = "trend:route_risk_review:7d:v1-admin-audit-events";

const queuePayload = (status: "proposed" | "dismissed" = "proposed") => ({
  actions: [
    {
      acceptedAt: null,
      actionId,
      decidedByUserHash: status === "proposed" ? null : "sha256:111111111111111111111111",
      description: "Review concentrated admin audit route pressure.",
      dismissedAt: status === "dismissed" ? "2026-05-22T10:10:00.000Z" : null,
      evidence: [{ label: "route", value: "/v1/admin/audit-events" }],
      kind: "route_risk_review",
      loadScore: 144,
      note: status === "dismissed" ? "Bulk trend action queue page test." : null,
      ownerRole: "engineering",
      priority: "immediate",
      recommendedAction: "Assign owner and inspect blocked admin route.",
      relatedIncidentIds: ["audit:admin-blocked:/v1/admin/audit-events"],
      route: "/v1/admin/audit-events",
      signal: "Route risk concentration",
      status,
      title: "Review route risk: /v1/admin/audit-events",
    },
  ],
  generatedAt: "2026-05-22T10:08:00.000Z",
  limit: 50,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000916",
  summary: {
    accepted: 0,
    dismissed: status === "dismissed" ? 1 : 0,
    immediate: 1,
    proposed: status === "proposed" ? 1 : 0,
    relatedIncidents: 1,
    total: 1,
  },
  window: "7d",
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/incident-trend-actions"]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <Routes>
              <Route path="/admin/incident-trend-actions" element={<AdminIncidentTrendActions />} />
            </Routes>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signInAdmin = () =>
  buyerSession.signIn({
    displayName: "Admin Trend Actions",
    id: adminSessionId,
    identifier: "admin@yorso.test",
    method: "email",
    source: "self_hosted",
    userId: adminUserId,
  });

describe("AdminIncidentTrendActions page", () => {
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

  it("renders queue, exports and bulk decisions without raw session data", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    signInAdmin();
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("/trend-action-queue/export") && url.includes("format=csv")) {
        return new Response("\"actionId\",\"status\"\n\"trend:route_risk_review:7d:v1-admin-audit-events\",\"proposed\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.includes("/trend-action-queue/export")) {
        return new Response(JSON.stringify(queuePayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/trend-action-queue/bulk")) {
        return new Response(JSON.stringify({
          failed: [{ actionId: "trend:missing:7d:not-found", code: "admin_incident_trend_action_not_found" }],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000917",
          succeeded: 1,
          timelineEventsCreated: 0,
          updatedActions: queuePayload("dismissed").actions,
        }), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(queuePayload()), { headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchImpl);

    renderPage();

    await waitFor(() => expect(screen.getByTestId("admin-incident-trend-actions-page")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId(`admin-incident-trend-action-queue-row-${actionId}`)).toHaveTextContent("Review route risk"));
    expect(screen.getByTestId("admin-incident-trend-actions-summary")).toHaveTextContent("Proposed");
    expect(screen.queryByText("admin@yorso.test")).not.toBeInTheDocument();
    expect(screen.queryByText(adminSessionId)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("admin-incident-trend-actions-export-json"));
    await waitFor(() => expect(screen.getByTestId("admin-incident-trend-actions-export-status")).toHaveTextContent("Trend action export ready"));
    fireEvent.click(screen.getByTestId("admin-incident-trend-actions-export-csv"));
    await waitFor(() => expect(screen.getByTestId("admin-incident-trend-actions-export-status")).toHaveTextContent("Trend action export ready"));

    fireEvent.click(screen.getByTestId(`admin-incident-trend-action-select-${actionId}`));
    fireEvent.click(screen.getByTestId("admin-incident-trend-actions-bulk-dismiss"));
    await waitFor(() => expect(screen.getByTestId(`admin-incident-trend-action-queue-row-${actionId}`)).toHaveTextContent("dismissed"));

    const urls = fetchImpl.mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.includes("/v1/admin/incidents/trend-action-queue?"))).toBe(true);
    expect(urls.some((url) => url.includes("/trend-action-queue/export") && url.includes("format=json"))).toBe(true);
    expect(urls.some((url) => url.includes("/trend-action-queue/export") && url.includes("format=csv"))).toBe(true);
    expect(urls.some((url) => url.includes("/trend-action-queue/bulk"))).toBe(true);
  });
});
