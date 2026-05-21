import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import type { AdminAuditListResponse } from "@/lib/admin-audit-api";
import { buyerSession } from "@/lib/buyer-session";
import AdminAuditEvents from "./AdminAuditEvents";

const adminUserId = "00000000-0000-4000-8000-000000000099";
const adminSessionId = "session-admin-audit-page";

const auditPayload = (): AdminAuditListResponse => ({
  events: [
    {
      action: "admin.operations.overview.read",
      actorUserHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
      auditId: "aud_page_1",
      correlationId: "corr_page_1",
      httpMethod: "GET",
      occurredAt: "2026-05-20T10:00:00.000Z",
      outcome: "success",
      reason: null,
      requestId: "req_page_1",
      resourceHash: null,
      resourceType: "admin_operations_overview",
      route: "/v1/admin/operations/overview",
      sessionHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbb",
      statusCode: 200,
    },
    {
      action: "admin.audit.blocked",
      actorUserHash: "sha256:cccccccccccccccccccccccc",
      auditId: "aud_page_2",
      correlationId: "corr_page_2",
      httpMethod: "GET",
      occurredAt: "2026-05-20T09:59:00.000Z",
      outcome: "blocked",
      reason: "admin_role_required",
      requestId: "req_page_2",
      resourceHash: null,
      resourceType: "admin_audit",
      route: "/v1/admin/audit-events",
      sessionHash: null,
      statusCode: 403,
    },
  ],
  limit: 25,
  nextCursor: null,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000401",
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/audit"]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <AdminAuditEvents />
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signInAdmin = () =>
  buyerSession.signIn({
    displayName: "Admin Audit",
    id: adminSessionId,
    identifier: "admin@yorso.test",
    method: "email",
    source: "self_hosted",
    userId: adminUserId,
  });

describe("AdminAuditEvents page", () => {
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
    expect(screen.getByTestId("admin-audit-disabled")).toHaveTextContent("Self-hosted API is not connected");
    expect(screen.getByTestId("admin-operator-nav-audit")).toHaveAttribute("aria-current", "page");
    unmount();

    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    buyerSession.__resetForTests();
    renderPage();

    const gate = screen.getByTestId("admin-audit-session-required");
    expect(gate).toHaveTextContent("Self-hosted session required");
    expect(within(gate).getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
  });

  it("renders audit events and sends filters to the backend", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify(auditPayload()), {
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-audit-events");
    expect(screen.getByTestId("admin-audit-events")).toHaveTextContent("admin.operations.overview.read");
    expect(screen.getAllByTestId("admin-audit-event-row")).toHaveLength(2);
    expect(screen.getByTestId("admin-audit-export-csv")).toHaveAttribute(
      "href",
      "https://api.yorso.test/v1/admin/audit-events/export?format=csv&limit=1000",
    );

    fireEvent.change(screen.getByTestId("admin-audit-route-filter"), {
      target: { value: "/v1/admin/audit-events" },
    });

    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
    expect(String(fetchImpl.mock.calls[1][0])).toContain("route=%2Fv1%2Fadmin%2Faudit-events");

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

    await screen.findByTestId("admin-audit-forbidden");
    expect(screen.getByText("Нужна роль администратора")).toBeInTheDocument();
    expect(screen.queryByText("Admin role required")).toBeNull();
  });
});
