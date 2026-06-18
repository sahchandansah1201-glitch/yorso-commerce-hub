/**
 * Editability, media, redirects and locale-leak tests for /account.
 * Local fallback plus self-hosted API bridge.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within, fireEvent, act, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { buyerSession } from "@/lib/buyer-session";
import {
  resetAccountProfile,
  getAccountProfile,
  ACCOUNT_STORAGE_KEY,
  calculateAccountCompletion,
} from "@/lib/account-store";
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
              <Route path="/profile/company" element={<Navigate to="/account/company" replace />} />
              <Route path="/profile/company-addresses" element={<Navigate to="/account/branches" replace />} />
              <Route path="/profile/classify" element={<Navigate to="/account/products" replace />} />
              <Route path="/profile/meta-regions" element={<Navigate to="/account/meta-regions" replace />} />
              <Route path="/profile/company-spam" element={<Navigate to="/account/notifications" replace />} />
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

const accountApiBody = (url: string, init?: RequestInit) => {
  const method = init?.method ?? "GET";
  const patchBody = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
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
  if (url.endsWith("/v1/account/workspace")) {
    return {
      ok: true,
      accountVersion: "account-v1",
      requestId: "req-account-workspace",
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
        description: "Remote backend company profile for account save tests.",
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
      branches: [],
      products: [],
      metaRegions: [],
      notifications: [],
    };
  }
  if (url.endsWith("/v1/account/me")) {
    return {
      ok: true,
      requestId: "req-account-me",
      user: {
        id: "user-api-1",
        firstName: method === "PATCH" ? String(patchBody.firstName ?? "Remote") : "Remote",
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
        description: "Remote backend company profile for account save tests.",
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
  if (url.includes("/v1/account/branches/")) {
    const id = decodeURIComponent(url.split("/v1/account/branches/")[1] ?? "branch-api-1");
    return {
      branch: {
        id,
        name: String(patchBody.name ?? "Remote branch"),
        type: patchBody.type ?? "warehouse",
        country: String(patchBody.country ?? "Spain"),
        region: String(patchBody.region ?? ""),
        city: String(patchBody.city ?? "Barcelona"),
        addressLine: String(patchBody.addressLine ?? "Remote address"),
        defaultIncoterms: String(patchBody.defaultIncoterms ?? "EXW"),
        portOrPickupPoint: String(patchBody.portOrPickupPoint ?? "Barcelona"),
        notes: String(patchBody.notes ?? ""),
      },
      ok: true,
      requestId: "req-account-branch-row",
    };
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

const mockAccountFetch = () =>
  vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = accountApiBody(String(input), init);
    if (!body) return okJson({ error: { code: "not_found" }, ok: false }, 404);
    return okJson(body);
  });

describe("Account editability", () => {
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

  it("Personal: edit -> save persists to localStorage", () => {
    signIn();
    renderAt("/account/personal");
    const card = screen.getByTestId("account-card-personal-basic");
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    const input = within(card).getByTestId("account-input-firstName") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Maria" } });
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-save"));
    expect(getAccountProfile().user.firstName).toBe("Maria");
    expect(localStorage.getItem(ACCOUNT_STORAGE_KEY)).toContain("Maria");
  });

  it("Personal: cancel restores previous value", () => {
    signIn();
    renderAt("/account/personal");
    const card = screen.getByTestId("account-card-personal-basic");
    const before = getAccountProfile().user.firstName;
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    fireEvent.change(within(card).getByTestId("account-input-firstName"), {
      target: { value: "Throwaway" },
    });
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-cancel"));
    expect(getAccountProfile().user.firstName).toBe(before);
  });

  it("Personal: invalid email blocks save", () => {
    signIn();
    renderAt("/account/personal");
    const card = screen.getByTestId("account-card-personal-basic");
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    const inputs = within(card).getAllByRole("textbox");
    // 3rd field is email
    const emailInput = inputs.find((i) => (i as HTMLInputElement).type === "email")!;
    fireEvent.change(emailInput, { target: { value: "broken" } });
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-save"));
    expect(card.getAttribute("data-editing")).toBe("true");
  });

  it("Company media card exists with logo and cover preview slots", () => {
    signIn();
    renderAt("/account/company");
    const media = screen.getByTestId("account-card-company-media");
    expect(media).toBeInTheDocument();
    fireEvent.click(within(media).getByTestId("account-card-company-media-edit"));
    expect(within(media).getByTestId("account-media-logo-url")).toBeInTheDocument();
    expect(within(media).getByTestId("account-media-cover-url")).toBeInTheDocument();
  });

  it("Adding logo+cover URLs increases completion", () => {
    signIn();
    renderAt("/account/company");
    const before = calculateAccountCompletion(getAccountProfile()).percent;
    const media = screen.getByTestId("account-card-company-media");
    fireEvent.click(within(media).getByTestId("account-card-company-media-edit"));
    fireEvent.change(within(media).getByTestId("account-media-logo-url"), {
      target: { value: "https://example.com/logo.png" },
    });
    fireEvent.change(within(media).getByTestId("account-media-cover-url"), {
      target: { value: "https://example.com/cover.jpg" },
    });
    fireEvent.click(within(media).getByTestId("account-card-company-media-save"));
    const after = calculateAccountCompletion(getAccountProfile()).percent;
    expect(after).toBeGreaterThan(before);
    expect(getAccountProfile().company.logoImageUrl).toContain("logo.png");
  });

  it("Supplier profile preview renders on company page", () => {
    signIn();
    renderAt("/account/company");
    expect(screen.getByTestId("account-supplier-preview")).toBeInTheDocument();
  });

  it("Company documents: local fallback adds a document record", async () => {
    signIn();
    renderAt("/account/company");
    const card = screen.getByTestId("account-company-documents");

    await act(async () => {
      fireEvent.change(within(card).getByTestId("account-company-document-title"), {
        target: { value: "HACCP certificate" },
      });
      fireEvent.change(within(card).getByTestId("account-company-document-file"), {
        target: {
          files: [new File(["document-bytes"], "haccp.pdf", { type: "application/pdf" })],
        },
      });
      fireEvent.click(within(card).getByTestId("account-company-document-save"));
    });

    expect(await within(card).findByText("HACCP certificate")).toBeInTheDocument();
    expect(within(card).getByText(/haccp\.pdf/i)).toBeInTheDocument();
    expect(within(card).getByText("Stored locally")).toBeInTheDocument();
  });

  it("self-hosted account mode saves personal edits to backend before leaving edit mode", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    signInSelfHosted();
    const fetchMock = mockAccountFetch();
    vi.stubGlobal("fetch", fetchMock);

    renderAt("/account/personal");
    const card = await screen.findByTestId("account-card-personal-basic");

    await act(async () => {
      fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    });
    await act(async () => {
      fireEvent.change(within(card).getByTestId("account-input-firstName"), {
        target: { value: "Alicia" },
      });
    });
    await act(async () => {
      fireEvent.click(within(card).getByTestId("account-card-personal-basic-save"));
    });

    await waitFor(() => expect(card.getAttribute("data-editing")).toBe("false"));
    expect(within(card).getByText("Alicia")).toBeInTheDocument();
    const userPatch = fetchMock.mock.calls.find(
      ([input, init]) => String(input).endsWith("/v1/account/me") && init?.method === "PATCH",
    );
    expect(userPatch).toBeTruthy();
    expect(JSON.parse(String(userPatch?.[1]?.body))).toMatchObject({ firstName: "Alicia" });
    const headers = userPatch?.[1]?.headers as Headers | undefined;
    expect(headers?.get("x-yorso-session-id")).toBe("session-api-1");
    expect(headers?.get("x-yorso-user-id")).toBe("user-api-1");
    expect(
      fetchMock.mock.calls
        .filter(([, init]) => init?.method === "PATCH")
        .map(([input]) => String(input).replace("https://api.yorso.test", "")),
    ).toEqual(["/v1/account/me"]);
    expect(localStorage.getItem(ACCOUNT_STORAGE_KEY) ?? "").not.toContain("Alicia");
  });

  it("self-hosted account mode loads company documents through the validated account session", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    signInSelfHosted();
    const fetchMock = mockAccountFetch();
    vi.stubGlobal("fetch", fetchMock);

    renderAt("/account/company");
    await screen.findByTestId("account-company-documents");

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.yorso.test/v1/account/documents",
        expect.objectContaining({
          headers: expect.any(Headers),
        }),
      ),
    );
    const documentsCall = fetchMock.mock.calls.find(([input]) =>
      String(input).endsWith("/v1/account/documents"),
    );
    const headers = documentsCall?.[1]?.headers as Headers | undefined;
    expect(headers?.get("x-yorso-session-id")).toBe("session-api-1");
    expect(headers?.get("x-yorso-user-id")).toBe("user-api-1");
  });

  it("self-hosted account mode shows a reloadable conflict state when account data is stale", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    signInSelfHosted();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/v1/account/me") && init?.method === "PATCH") {
        return okJson({
          ok: false,
          error: {
            code: "account_snapshot_conflict",
            message: "Account data changed since it was loaded.",
          },
        }, 409);
      }
      const body = accountApiBody(url, init);
      if (!body) return okJson({ error: { code: "not_found" }, ok: false }, 404);
      return okJson({ ...body, accountVersion: "account-v1" });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderAt("/account/personal");
    const card = await screen.findByTestId("account-card-personal-basic");

    await act(async () => {
      fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    });
    await act(async () => {
      fireEvent.change(within(card).getByTestId("account-input-firstName"), {
        target: { value: "Stale" },
      });
    });
    await act(async () => {
      fireEvent.click(within(card).getByTestId("account-card-personal-basic-save"));
    });

    expect(await screen.findByTestId("account-save-conflict")).toBeInTheDocument();
    expect(within(card).getByText("Account data changed. Reload the profile and try again.")).toBeInTheDocument();
    expect(card.getAttribute("data-editing")).toBe("true");

    const callsBeforeReload = fetchMock.mock.calls.length;
    await act(async () => {
      fireEvent.click(screen.getByTestId("account-save-conflict-reload"));
    });

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBeforeReload));
    await waitFor(() => expect(screen.queryByTestId("account-save-conflict")).not.toBeInTheDocument());
  });

  it("self-hosted account mode adds a branch through only the row-level branch endpoint", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    signInSelfHosted();
    const fetchMock = mockAccountFetch();
    vi.stubGlobal("fetch", fetchMock);

    renderAt("/account/branches");
    await screen.findByTestId("account-section-branches");

    await act(async () => {
      fireEvent.click(screen.getByTestId("account-branch-add"));
    });
    await act(async () => {
      fireEvent.change(screen.getByTestId("account-branch-name"), {
        target: { value: "Barcelona cold store" },
      });
      fireEvent.change(screen.getByTestId("account-branch-country"), {
        target: { value: "Spain" },
      });
      fireEvent.change(screen.getByTestId("account-branch-city"), {
        target: { value: "Barcelona" },
      });
      fireEvent.change(screen.getByTestId("account-branch-address"), {
        target: { value: "Moll de Barcelona 1" },
      });
      fireEvent.change(screen.getByTestId("account-branch-incoterms"), {
        target: { value: "dap" },
      });
      fireEvent.change(screen.getByTestId("account-branch-pickup"), {
        target: { value: "Port of Barcelona" },
      });
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("account-branch-save"));
    });

    await waitFor(() => {
      expect(screen.queryByTestId("account-branch-form")).not.toBeInTheDocument();
      expect(screen.getAllByText("Barcelona cold store").length).toBeGreaterThan(0);
    });
    const writeCalls = fetchMock.mock.calls
      .filter(([, init]) => ["POST", "PATCH", "DELETE"].includes(String(init?.method ?? "")))
      .map(([input, init]) => [String(input).replace("https://api.yorso.test", ""), init?.method]);
    expect(writeCalls).toHaveLength(1);
    expect(writeCalls[0]?.[0]).toMatch(/^\/v1\/account\/branches\/branch_/);
    expect(writeCalls[0]?.[1]).toBe("POST");
    expect(
      fetchMock.mock.calls
        .filter(([, init]) => init?.method === "PATCH")
        .map(([input]) => String(input).replace("https://api.yorso.test", "")),
    ).toEqual([]);
  });
});

describe("Account legacy /profile redirects", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetAccountProfile();
  });

  const cases: Array<[string, string]> = [
    ["/profile/company", "account-section-company"],
    ["/profile/company-addresses", "account-section-branches"],
    ["/profile/classify", "account-section-products"],
    ["/profile/meta-regions", "account-section-meta-regions"],
    ["/profile/company-spam", "account-section-notifications"],
  ];

  for (const [from, target] of cases) {
    it(`${from} redirects to /account/* equivalent`, () => {
      signIn();
      renderAt(from);
      expect(screen.getByTestId(target)).toBeInTheDocument();
    });
  }
});

describe("Account RU locale enum leaks", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetAccountProfile();
  });

  it("RU products page does not show raw English state enum values", () => {
    localStorage.setItem("yorso-lang", "ru");
    signIn();
    renderAt("/account/products");
    const table = screen.getByTestId("account-products-table");
    const html = table.innerHTML;
    expect(html).not.toMatch(/>\s*frozen\s*</);
    expect(html).not.toMatch(/>\s*fresh\s*</);
    expect(html).not.toMatch(/>\s*alive\s*</);
    // Cyrillic state label visible
    expect(within(table).getAllByText("Мороженный").length).toBeGreaterThan(0);
  });

  it("RU company page uses localized accountRole label, not raw enum", () => {
    localStorage.setItem("yorso-lang", "ru");
    signIn();
    renderAt("/account/company");
    const id = screen.getByTestId("account-card-company-identity");
    expect(within(id).queryByText("both")).toBeNull();
    expect(within(id).getByText("Покупатель и поставщик")).toBeInTheDocument();
  });

  it("does not render em dash fallback in personal page", () => {
    signIn();
    renderAt("/account/personal");
    const section = screen.getByTestId("account-section-personal");
    expect(section.textContent ?? "").not.toMatch(/[—–]/);
  });
});

describe("Account save UX (indicator + error handling)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetAccountProfile();
  });

  it("validation failure shows inline error summary and keeps edit mode", () => {
    signIn();
    renderAt("/account/personal");
    const card = screen.getByTestId("account-card-personal-basic");
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    fireEvent.change(within(card).getByTestId("account-input-firstName"), {
      target: { value: "" },
    });
    fireEvent.click(within(card).getByTestId("account-card-personal-basic-save"));
    expect(within(card).getByTestId("account-card-personal-basic-error")).toBeInTheDocument();
    expect(card.getAttribute("data-save-state")).toBe("error");
    expect(card.getAttribute("data-editing")).toBe("true");
  });

  it("successful save shows 'Saved' indicator and exits edit mode", async () => {
    signIn();
    renderAt("/account/personal");
    const card = screen.getByTestId("account-card-personal-basic");
    await act(async () => {
      fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    });
    await act(async () => {
      fireEvent.change(within(card).getByTestId("account-input-firstName"), {
        target: { value: "Olga" },
      });
    });
    await act(async () => {
      fireEvent.click(within(card).getByTestId("account-card-personal-basic-save"));
    });
    expect(card.getAttribute("data-editing")).toBe("false");
    expect(within(card).getByTestId("account-card-personal-basic-saved-indicator")).toBeInTheDocument();
  });

  it("localStorage write failure surfaces an inline error", async () => {
    signIn();
    renderAt("/account/personal");
    const card = screen.getByTestId("account-card-personal-basic");
    await act(async () => {
      fireEvent.click(within(card).getByTestId("account-card-personal-basic-edit"));
    });
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    try {
      await act(async () => {
        fireEvent.change(within(card).getByTestId("account-input-firstName"), {
          target: { value: "Quota" },
        });
      });
      await act(async () => {
        fireEvent.click(within(card).getByTestId("account-card-personal-basic-save"));
      });
      expect(within(card).getByTestId("account-card-personal-basic-error")).toBeInTheDocument();
      expect(card.getAttribute("data-save-state")).toBe("error");
      expect(card.getAttribute("data-editing")).toBe("true");
    } finally {
      Storage.prototype.setItem = original;
    }
  });
});
