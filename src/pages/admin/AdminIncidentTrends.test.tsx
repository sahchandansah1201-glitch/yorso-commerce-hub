import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { buyerSession } from "@/lib/buyer-session";
import AdminIncidentTrends from "./AdminIncidentTrends";

const adminUserId = "00000000-0000-4000-8000-000000000099";
const adminSessionId = "session-admin-incident-trends-page";

const trendsPayload = () => ({
  buckets: [
    {
      acknowledged: 1,
      access: 0,
      atRisk: 1,
      audit: 2,
      breached: 1,
      critical: 1,
      endAt: "2026-05-22T23:59:59.000Z",
      executionBlocked: 1,
      executionDone: 1,
      executionOpen: 2,
      high: 1,
      key: "2026-05-22",
      loadScore: 144,
      open: 2,
      policy: 0,
      resolved: 0,
      runtime: 1,
      security: 0,
      startAt: "2026-05-22T00:00:00.000Z",
      total: 3,
    },
  ],
  generatedAt: "2026-05-22T10:05:00.000Z",
  granularity: "day",
  limit: 30,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000911",
  routeRisks: [
    {
      blocked: 1,
      breached: 1,
      critical: 1,
      loadScore: 144,
      recommendedAction: "Assign owner and inspect blocked admin route.",
      route: "/v1/admin/audit-events",
      total: 3,
    },
  ],
  severityMix: [{ breached: 1, critical: 1, key: "critical", label: "Critical", loadScore: 144, open: 2, sharePct: 100, total: 3 }],
  sla: { acknowledgedPct: 33, breachRatePct: 33, breached: 1, openCritical: 1, oldestOpenMinutes: 45, unresolved: 2 },
  sourceMix: [{ breached: 1, critical: 1, key: "audit", label: "Audit", loadScore: 144, open: 2, sharePct: 100, total: 3 }],
  statusMix: [{ breached: 1, critical: 1, key: "open", label: "Open", loadScore: 144, open: 2, sharePct: 100, total: 3 }],
  summary: {
    averageLoadScore: 144,
    breached: 1,
    critical: 1,
    peakBucketKey: "2026-05-22",
    peakBucketLoadScore: 144,
    total: 3,
    trendDirection: "up",
  },
  window: "7d",
});

const anomaliesPayload = () => ({
  anomalies: [
    {
      baseline: 1,
      current: 3,
      deltaPct: 200,
      evidence: [{ label: "route", value: "/v1/admin/audit-events" }],
      recommendedAction: "Review admin audit route pressure before capacity is saturated.",
      severity: "warning",
      signal: "route_pressure",
    },
  ],
  generatedAt: "2026-05-22T10:06:00.000Z",
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000912",
  summary: { critical: 0, highestSeverity: "warning", warning: 1, watch: 0 },
  window: "7d",
});

const briefingPayload = () => ({
  capacityReview: ["Keep admin audit inspection bounded to indexed route filters."],
  generatedAt: "2026-05-22T10:07:00.000Z",
  ok: true,
  operatorActions: ["Assign the blocked route incident.", "Review route pressure in the next shift."],
  requestId: "00000000-0000-4000-8000-000000000913",
  riskRegister: trendsPayload().routeRisks,
  sections: [
    { body: ["3 incidents in the selected trend window."], title: "Trend snapshot" },
    { body: ["1 critical item remains open."], title: "SLA posture" },
    { body: ["Route /v1/admin/audit-events needs owner review."], title: "Route risk" },
  ],
  summary: {
    headline: "Incident pressure is rising on admin audit routes.",
    highestAnomalySeverity: "warning",
    totalIncidents: 3,
    trendDirection: "up",
  },
  window: "7d",
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/incident-trends"]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <Routes>
              <Route path="/admin/incident-trends" element={<AdminIncidentTrends />} />
            </Routes>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signInAdmin = () =>
  buyerSession.signIn({
    displayName: "Admin Trends",
    id: adminSessionId,
    identifier: "admin@yorso.test",
    method: "email",
    source: "self_hosted",
    userId: adminUserId,
  });

describe("AdminIncidentTrends page", () => {
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

  it("renders trends, exports, anomalies and briefing without raw session data", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    signInAdmin();
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("/trends/export") && url.includes("format=json")) {
        return new Response(JSON.stringify(trendsPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/trends/export") && url.includes("format=csv")) {
        return new Response("\"key\",\"loadScore\"\n\"2026-05-22\",\"144\"", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.includes("/trends/anomalies")) {
        return new Response(JSON.stringify(anomaliesPayload()), { headers: { "content-type": "application/json" } });
      }
      if (url.includes("/trends/briefing")) {
        return new Response(JSON.stringify(briefingPayload()), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(trendsPayload()), { headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchImpl);

    renderPage();

    await waitFor(() => expect(screen.getByTestId("admin-incident-trends-page")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId("admin-incident-trends-buckets")).toHaveTextContent("2026-05-22"));
    expect(screen.getByTestId("admin-incident-trends-summary")).toHaveTextContent("144");
    expect(screen.getByTestId("admin-incident-trends-route-risks")).toHaveTextContent("/v1/admin/audit-events");
    expect(screen.queryByText("admin@yorso.test")).not.toBeInTheDocument();
    expect(screen.queryByText(adminSessionId)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("admin-incident-trends-export-json"));
    await waitFor(() => expect(screen.getByTestId("admin-incident-trends-export-status")).toHaveTextContent("1 buckets"));
    fireEvent.click(screen.getByTestId("admin-incident-trends-export-csv"));
    await waitFor(() => expect(screen.getByTestId("admin-incident-trends-export-status")).toHaveTextContent("1 CSV rows"));

    fireEvent.click(screen.getByTestId("admin-incident-trends-anomalies-load"));
    await waitFor(() => expect(screen.getByTestId("admin-incident-trends-anomalies")).toHaveTextContent("route_pressure"));

    fireEvent.click(screen.getByTestId("admin-incident-trends-briefing-load"));
    await waitFor(() => expect(screen.getByTestId("admin-incident-trends-briefing")).toHaveTextContent("Incident pressure is rising"));
  });
});
