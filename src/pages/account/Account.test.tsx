/**
 * Account workspace shell + section preview tests.
 * Account workspace shell + self-hosted API fallback assumptions.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import { resetAccountProfile } from "@/lib/account-store";
import Account from "@/pages/account/Account";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <Routes>
              <Route path="/account" element={<Navigate to="/account/personal" replace />} />
              <Route path="/account/:section" element={<Account />} />
              <Route path="/signin" element={<div data-testid="signin-target">Sign in</div>} />
            </Routes>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signIn = () =>
  buyerSession.signIn({ identifier: "demo@example.com", method: "email" });

const signInSelfHosted = () =>
  buyerSession.signIn({
    displayName: "Remote buyer",
    id: "session-api-1",
    identifier: "remote@example.com",
    method: "email",
    source: "self_hosted",
    userId: "user-api-1",
  });

const okJson = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });

const accountApiBody = (url: string) => {
  if (url.endsWith("/v1/auth/session")) {
    return {
      ok: true,
      requestId: "req-auth-session",
      session: {
        displayName: "Remote buyer",
        email: "remote@example.com",
        expiresAt: "2026-06-01T00:00:00.000Z",
        id: "session-api-1",
        issuedAt: "2026-05-28T00:00:00.000Z",
        userId: "user-api-1",
      },
    };
  }
  if (url.endsWith("/v1/account/me")) {
    return {
      ok: true,
      requestId: "req-account-me",
      user: {
        id: "user-api-1",
        firstName: "Remote",
        lastName: "Buyer",
        email: "remote@example.com",
        phone: "+34 611 000 000",
        preferredLanguage: "en",
        timezone: "Europe/Madrid",
        updatedAt: "2026-05-28T00:00:00.000Z",
      },
    };
  }
  if (url.endsWith("/v1/account/company")) {
    return {
      ok: true,
      requestId: "req-account-company",
      company: {
        id: "company-api-1",
        legalName: "Remote Seafood Trading S.L.",
        tradeName: "Remote Seafood",
        accountRole: "buyer",
        countryCode: "ES",
        website: "https://remote.example.com",
        yearFounded: 2020,
        contactEmail: "trade@remote.example.com",
        contactPhone: "+34 910 111 222",
        messengerHandle: "+34 611 111 222",
        description: "Remote backend company profile for account authority tests.",
        productFocus: ["Salmon"],
        certificates: ["MSC"],
        paymentTerms: ["LC at sight"],
        publicationStatus: "draft",
        buyerQualificationStatus: "pending",
        media: {
          logoObjectKey: null,
          coverObjectKey: null,
          logoAlt: null,
          coverAlt: null,
          logoFit: "contain",
          coverFocalX: 0.5,
          coverFocalY: 0.5,
        },
        updatedAt: "2026-05-28T00:00:00.000Z",
      },
    };
  }
  if (url.endsWith("/v1/account/branches")) {
    return { branches: [], ok: true, requestId: "req-account-branches" };
  }
  if (url.endsWith("/v1/account/products")) {
    return { ok: true, products: [], requestId: "req-account-products" };
  }
  if (url.endsWith("/v1/account/meta-regions")) {
    return { metaRegions: [], ok: true, requestId: "req-account-meta-regions" };
  }
  if (url.endsWith("/v1/account/notifications")) {
    return { notifications: [], ok: true, requestId: "req-account-notifications" };
  }
  if (url.endsWith("/v1/account/documents")) {
    return { accountVersion: "account-v1", documents: [], ok: true, requestId: "req-account-documents" };
  }
  return null;
};

const mockAccountFetch = (overrides?: {
  failAccountMe?: boolean;
}) =>
  vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    if (overrides?.failAccountMe && url.endsWith("/v1/account/me")) {
      return okJson({ error: { code: "account_unavailable" }, ok: false }, 503);
    }
    const body = accountApiBody(url);
    if (!body) return okJson({ error: { code: "not_found" }, ok: false }, 404);
    return okJson(body);
  });

describe("Account workspace", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_YORSO_API_URL", "");
    localStorage.clear();
    sessionStorage.clear();
    resetAccountProfile();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("/account redirects to /account/personal and renders shell", () => {
    signIn();
    renderAt("/account");
    expect(screen.getByTestId("account-content")).toBeInTheDocument();
    expect(screen.getByTestId("account-section-personal")).toBeInTheDocument();
  });

  it("sidebar contains all 6 sections", () => {
    signIn();
    renderAt("/account/personal");
    const sidebar = screen.getByTestId("account-sidebar");
    for (const label of [
      "Personal info",
      "Company profile",
      "Branches",
      "Products",
      "Meta-regions",
      "Notifications",
    ]) {
      expect(within(sidebar).getByText(label)).toBeInTheDocument();
    }
  });

  it("account completion is visible", () => {
    signIn();
    renderAt("/account/personal");
    expect(screen.getAllByTestId("account-overview").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("account-overview-percent").length).toBeGreaterThan(0);
  });

  it("products page renders buying, selling and both products", () => {
    signIn();
    renderAt("/account/products");
    expect(screen.getByTestId("account-products-table")).toBeInTheDocument();
    expect(screen.getAllByTestId("product-role-buying").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("product-role-selling").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("product-role-both").length).toBeGreaterThan(0);
  });

  it("branches page mentions delivery basis", () => {
    signIn();
    renderAt("/account/branches");
    const explainer = screen.getByTestId("account-branches-explainer");
    expect(explainer.textContent?.toLowerCase()).toMatch(/delivery basis|incoterms/);
  });

  it("meta-regions page renders countries and usedFor tags", () => {
    signIn();
    renderAt("/account/meta-regions");
    const section = screen.getByTestId("account-section-meta-regions");
    expect(within(section).getByText("Spain")).toBeInTheDocument();
    expect(within(section).getAllByText("Notifications").length).toBeGreaterThan(0);
  });

  it("notifications page renders all 4 channels", () => {
    signIn();
    renderAt("/account/notifications");
    expect(screen.getByTestId("account-notif-email")).toBeInTheDocument();
    expect(screen.getByTestId("account-notif-messenger")).toBeInTheDocument();
    expect(screen.getByTestId("account-notif-in_app")).toBeInTheDocument();
    expect(screen.getByTestId("account-notif-agent")).toBeInTheDocument();
  });

  it("signed-out state shows CTA to sign in", () => {
    renderAt("/account/personal");
    const gate = screen.getByTestId("account-signin-required");
    expect(gate).toBeInTheDocument();
    const cta = within(gate).getByRole("link");
    expect(cta).toHaveAttribute("href", "/signin");
  });

  it("RU locale renders shell labels in Russian without English fallback", () => {
    localStorage.setItem("yorso-lang", "ru");
    signIn();
    renderAt("/account/personal");
    const sidebar = screen.getByTestId("account-sidebar");
    expect(within(sidebar).getByText("Личные данные")).toBeInTheDocument();
    expect(within(sidebar).getByText("Профиль компании")).toBeInTheDocument();
    expect(within(sidebar).getByText("Филиалы")).toBeInTheDocument();
    expect(within(sidebar).getByText("Продукты")).toBeInTheDocument();
    expect(within(sidebar).getByText("Мета-регионы")).toBeInTheDocument();
    expect(within(sidebar).getByText("Уведомления")).toBeInTheDocument();
    expect(within(sidebar).queryByText("Personal info")).toBeNull();
    expect(within(sidebar).queryByText("Company profile")).toBeNull();
  });

  it("self-hosted account mode validates the session and renders only backend profile data", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    signInSelfHosted();
    const fetchMock = mockAccountFetch();
    vi.stubGlobal("fetch", fetchMock);

    renderAt("/account/company");

    expect(screen.getByTestId("account-session-loading")).toBeInTheDocument();
    expect((await screen.findAllByText("Remote Seafood")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Atlantic Bridge")).toBeNull();
    expect(screen.getByTestId("account-prototype-note")).toHaveTextContent(
      "Loaded from the YORSO backend",
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.yorso.test/v1/account/me",
        expect.objectContaining({
          headers: expect.any(Headers),
        }),
      ),
    );
    const accountMeCall = fetchMock.mock.calls.find(([input]) =>
      String(input).endsWith("/v1/account/me"),
    );
    const accountHeaders = accountMeCall?.[1]?.headers as Headers | undefined;
    expect(accountHeaders?.get("x-yorso-session-id")).toBe("session-api-1");
    expect(accountHeaders?.get("x-yorso-user-id")).toBe("user-api-1");
  });

  it("self-hosted account mode redirects missing local session to sign in", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");

    renderAt("/account/personal");

    expect(await screen.findByTestId("signin-target")).toBeInTheDocument();
    expect(screen.queryByTestId("account-content")).toBeNull();
  });

  it("self-hosted account mode keeps editable sections closed when backend profile load fails", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    signInSelfHosted();
    vi.stubGlobal("fetch", mockAccountFetch({ failAccountMe: true }));

    renderAt("/account/company");

    expect(await screen.findByTestId("account-backend-unavailable")).toBeInTheDocument();
    expect(screen.getByText("Account data is temporarily unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("account-content")).toBeNull();
    expect(screen.queryByText("Atlantic Bridge")).toBeNull();
  });
});

describe("calculateAccountCompletion", () => {
  it("returns a percent and items list", async () => {
    const { calculateAccountCompletion } = await import("@/lib/account-store");
    const { mockAccountProfile } = await import("@/data/mockAccount");
    const r = calculateAccountCompletion(mockAccountProfile);
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.percent).toBeGreaterThanOrEqual(0);
    expect(r.percent).toBeLessThanOrEqual(100);
  });
});
