import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { buyerSession } from "@/lib/buyer-session";
import type { AdminAccessReviewListResponse } from "@/lib/admin-access-review-api";
import AdminAccessRequests from "./AdminAccessRequests";

const requestId = "00000000-0000-4000-8000-000000000196";
const adminUserId = "00000000-0000-4000-8000-000000000090";
const adminSessionId = "session-admin-access-review-page";

const listPayload = (status: "sent" | "pending" | "approved" = "sent"): AdminAccessReviewListResponse => ({
  ok: true,
  items: [
    {
      ageHours: 4,
      buyer: {
        accountRole: "buyer",
        companyName: "Polar Buyer GmbH",
        countryCode: "DE",
        displayName: "Procurement Manager",
        userId: "00000000-0000-4000-8000-000000000001",
      },
      decisionSla: "fresh",
      request: {
        buyerUserId: "00000000-0000-4000-8000-000000000001",
        createdAt: "2026-05-20T08:00:00.000Z",
        decidedAt: status === "approved" ? "2026-05-20T09:00:00.000Z" : null,
        decidedByUserId: status === "approved" ? adminUserId : null,
        id: requestId,
        intent: "exact_price",
        message: "Need exact price for weekly salmon purchasing",
        status,
        supplierId: "sup-no-001",
        updatedAt: "2026-05-20T09:00:00.000Z",
      },
      supplier: {
        city: "Ålesund",
        companyName: status === "approved" ? "Nordfjord Sjømat AS" : null,
        country: "Norway",
        maskedName: "Norwegian salmon producer",
        supplierId: "sup-no-001",
        verificationLevel: "documents_reviewed",
      },
    },
  ],
  limit: 25,
  offset: 0,
  requestId: "00000000-0000-4000-8000-000000000296",
  summary: {
    approved: status === "approved" ? 1 : 0,
    open: status === "approved" ? 0 : 1,
    pending: status === "pending" ? 1 : 0,
    rejected: 0,
    revoked: 0,
    sent: status === "sent" ? 1 : 0,
  },
  total: 1,
});

const decisionPayload = () => ({
  grants: [
    {
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      expiresAt: null,
      grantedAt: "2026-05-20T09:00:00.000Z",
      grantedByUserId: adminUserId,
      id: "grant_supplier_identity",
      offerId: null,
      scope: "supplier_identity",
      supplierId: "sup-no-001",
    },
    {
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      expiresAt: null,
      grantedAt: "2026-05-20T09:00:00.000Z",
      grantedByUserId: adminUserId,
      id: "grant_offer_price",
      offerId: null,
      scope: "offer_price",
      supplierId: "sup-no-001",
    },
  ],
  notification: {
    body: "The supplier approved your request. Exact prices and supplier details are now available.",
    buyerUserId: "00000000-0000-4000-8000-000000000001",
    createdAt: "2026-05-20T09:00:00.000Z",
    id: "00000000-0000-4000-8000-000000000396",
    readAt: null,
    status: "unread",
    supplierId: "sup-no-001",
    title: "Price access approved",
    type: "price_access_approved",
  },
  ok: true,
  request: listPayload("approved").items[0].request,
  requestId: "00000000-0000-4000-8000-000000000496",
});

const renderPage = (initialPath = "/admin/access-requests?status=all") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <AdminAccessRequests />
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signInAdmin = () =>
  buyerSession.signIn({
    displayName: "Admin Access",
    id: adminSessionId,
    identifier: "admin@yorso.test",
    method: "email",
    source: "self_hosted",
    userId: adminUserId,
  });

describe("AdminAccessRequests page", () => {
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
    expect(screen.getByTestId("admin-access-review-disabled")).toHaveTextContent(
      "Self-hosted API is not connected",
    );
    unmount();

    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    buyerSession.__resetForTests();
    renderPage();

    const gate = screen.getByTestId("admin-access-review-session-required");
    expect(gate).toHaveTextContent("Self-hosted session required");
    expect(within(gate).getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
  });

  it("loads review queue, sends admin decision, and refreshes without exposing session data", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    let approved = false;
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith(`/v1/admin/access-requests/${requestId}/decision`) && init?.method === "POST") {
        approved = true;
        return new Response(JSON.stringify(decisionPayload()), {
          headers: { "content-type": "application/json" },
        });
      }
      if (url.includes("/v1/admin/access-requests")) {
        return new Response(JSON.stringify(listPayload(approved ? "approved" : "sent")), {
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: false }), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchImpl);
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-access-review-queue");
    expect(screen.getByTestId(`admin-access-review-row-${requestId}`)).toHaveTextContent("Polar Buyer GmbH");
    expect(screen.getByTestId(`admin-access-review-row-${requestId}`)).toHaveTextContent(
      "Norwegian salmon producer",
    );
    expect(document.body.textContent).not.toContain("admin@yorso.test");
    expect(document.body.textContent).not.toContain(adminSessionId);

    fireEvent.click(screen.getByTestId(`admin-access-review-approve-${requestId}`));

    await waitFor(() => expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.yorso.test/v1/admin/access-requests/${requestId}/decision`,
      expect.objectContaining({
        body: JSON.stringify({ status: "approved" }),
        method: "POST",
      }),
    ));
    await waitFor(() => expect(screen.getByTestId(`admin-access-review-row-${requestId}`)).toHaveTextContent("Approved"));
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes("status=all"))).toBe(true);
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

    await screen.findByTestId("admin-access-review-forbidden");
    expect(screen.getByText("Нужна роль администратора")).toBeInTheDocument();
    expect(screen.queryByText("Admin role required")).toBeNull();
  });
});
