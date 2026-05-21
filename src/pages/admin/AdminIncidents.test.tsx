import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import type { AdminIncidentListResponse } from "@/lib/admin-incidents-api";
import { buyerSession } from "@/lib/buyer-session";
import AdminIncidents from "./AdminIncidents";

const adminUserId = "00000000-0000-4000-8000-000000000099";
const adminSessionId = "session-admin-incidents-page";

const incidentPayload = (): AdminIncidentListResponse => ({
  incidents: [
    {
      acknowledgedAt: null,
      acknowledgedByUserHash: null,
      count: 2,
      description: "Blocked admin route access.",
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
      severity: "high",
      source: "audit",
      status: "open",
      title: "Blocked admin route access",
    },
  ],
  limit: 25,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000505",
  summary: { acknowledged: 0, critical: 0, high: 1, open: 1, resolved: 0, total: 1 },
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
    expect(screen.getByTestId("admin-incidents-list")).toHaveTextContent("Blocked admin route access");

    fireEvent.change(screen.getByTestId("admin-incident-note-audit:admin-blocked:v1-admin-audit-events"), {
      target: { value: "Checking incident." },
    });
    fireEvent.click(screen.getByTestId("admin-incident-ack-audit:admin-blocked:v1-admin-audit-events"));
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));

    const firstUrl = String(fetchImpl.mock.calls[0][0]);
    expect(firstUrl).toContain("status=open");
    expect(String(fetchImpl.mock.calls[1][0])).toContain("/acknowledge");
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
