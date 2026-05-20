import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { buyerSession } from "@/lib/buyer-session";
import type { AdminAccessGrantListResponse } from "@/lib/admin-access-grants-api";
import AdminAccessGrants from "./AdminAccessGrants";

const grantId = "00000000-0000-4000-8000-000000000301";
const adminUserId = "00000000-0000-4000-8000-000000000090";
const adminSessionId = "session-admin-access-grants-page";

const listPayload = (active = true): AdminAccessGrantListResponse => ({
  ok: true,
  items: [
    {
      ageHours: 5,
      buyer: {
        accountRole: "buyer",
        companyName: "Polar Buyer GmbH",
        countryCode: "DE",
        displayName: "Procurement Manager",
        userId: "00000000-0000-4000-8000-000000000001",
      },
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      expiresAt: active ? null : "2026-05-20T10:30:00.000Z",
      grantedAt: "2026-05-20T09:00:00.000Z",
      grantedByUserId: adminUserId,
      grants: [
        {
          buyerUserId: "00000000-0000-4000-8000-000000000001",
          expiresAt: active ? null : "2026-05-20T10:30:00.000Z",
          grantedAt: "2026-05-20T09:00:00.000Z",
          grantedByUserId: adminUserId,
          id: grantId,
          offerId: null,
          scope: "supplier_identity",
          supplierId: "sup-no-001",
        },
      ],
      id: grantId,
      isActive: active,
      request: {
        buyerUserId: "00000000-0000-4000-8000-000000000001",
        createdAt: "2026-05-20T08:00:00.000Z",
        decidedAt: "2026-05-20T09:00:00.000Z",
        decidedByUserId: adminUserId,
        id: "00000000-0000-4000-8000-000000000196",
        intent: "exact_price",
        message: "Need exact price",
        status: active ? "approved" : "revoked",
        supplierId: "sup-no-001",
        updatedAt: "2026-05-20T09:00:00.000Z",
      },
      scopes: ["offer_price", "supplier_identity"],
      supplier: {
        city: "Ålesund",
        companyName: active ? "Nordfjord Sjømat AS" : null,
        country: "Norway",
        maskedName: "Norwegian salmon producer",
        supplierId: "sup-no-001",
        verificationLevel: "documents_reviewed",
      },
      supplierId: "sup-no-001",
    },
  ],
  limit: 25,
  offset: 0,
  requestId: "00000000-0000-4000-8000-000000000296",
  summary: {
    active: active ? 1 : 0,
    expired: active ? 0 : 1,
    total: 1,
  },
  total: 1,
});

const renderPage = (initialPath = "/admin/access-grants?status=all") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <AdminAccessGrants />
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signInAdmin = () =>
  buyerSession.signIn({
    displayName: "Admin Grants",
    id: adminSessionId,
    identifier: "admin@yorso.test",
    method: "email",
    source: "self_hosted",
    userId: adminUserId,
  });

describe("AdminAccessGrants page", () => {
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

  it("shows explicit disabled and session-required states", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");
    signInAdmin();

    const { unmount } = renderPage();
    expect(screen.getByTestId("admin-access-grants-disabled")).toHaveTextContent(
      "Self-hosted API is not connected",
    );
    unmount();

    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    buyerSession.__resetForTests();
    renderPage();

    const gate = screen.getByTestId("admin-access-grants-session-required");
    expect(gate).toHaveTextContent("Self-hosted session required");
    expect(within(gate).getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
  });

  it("loads grants, revokes access, and refreshes without exposing session data", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    let active = true;
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith(`/v1/admin/access-grants/${grantId}/revoke`) && init?.method === "POST") {
        active = false;
        return new Response(JSON.stringify({
          accessGranted: false,
          ok: true,
          request: listPayload(false).items[0].request,
          requestId: "00000000-0000-4000-8000-000000000496",
          revokedGrants: listPayload(false).items[0].grants,
        }), {
          headers: { "content-type": "application/json" },
        });
      }
      if (url.includes("/v1/admin/access-grants")) {
        return new Response(JSON.stringify(listPayload(active)), {
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: false }), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchImpl);
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-access-grants-table");
    expect(screen.getByTestId(`admin-access-grants-row-${grantId}`)).toHaveTextContent("Polar Buyer GmbH");
    expect(screen.getByTestId(`admin-access-grants-row-${grantId}`)).toHaveTextContent("Nordfjord Sjømat AS");
    expect(document.body.textContent).not.toContain("admin@yorso.test");
    expect(document.body.textContent).not.toContain(adminSessionId);

    fireEvent.click(screen.getByTestId(`admin-access-grants-revoke-${grantId}`));

    await waitFor(() => expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.yorso.test/v1/admin/access-grants/${grantId}/revoke`,
      expect.objectContaining({
        method: "POST",
      }),
    ));
    await waitFor(() => expect(screen.getByTestId(`admin-access-grants-row-${grantId}`)).toHaveTextContent("Expired"));
    expect(screen.getByTestId(`admin-access-grants-row-${grantId}`)).toHaveTextContent("Norwegian salmon producer");
  });

  it("keeps RU copy localized for forbidden admin sessions", async () => {
    localStorage.setItem("yorso-lang", "ru");
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({
          ok: false,
          error: { code: "admin_role_required", message: "Admin role is required." },
        }), {
          headers: { "content-type": "application/json" },
          status: 403,
        }),
      ),
    );
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-access-grants-forbidden");
    expect(screen.getByText("Нужна роль администратора")).toBeInTheDocument();
    expect(screen.queryByText("Admin role required")).toBeNull();
  });
});
