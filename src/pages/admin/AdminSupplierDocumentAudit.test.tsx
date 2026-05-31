import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import type { AdminSupplierDocumentAuditListResponse } from "@/lib/admin-supplier-document-audit-api";
import { buyerSession } from "@/lib/buyer-session";
import AdminSupplierDocumentAudit from "./AdminSupplierDocumentAudit";

const adminUserId = "00000000-0000-4000-8000-000000000099";
const adminSessionId = "session-admin-document-audit-page";

const grantPayload = (): AdminSupplierDocumentAuditListResponse => ({
  items: [
    {
      buyerUserId: "00000000-0000-4000-8000-000000000001",
      createdAt: "2026-05-31T08:00:00.000Z",
      documentId: "sup-no-001-health-certificate",
      expiresAt: "2026-05-31T08:15:00.000Z",
      grantedAt: "2026-05-31T08:00:00.000Z",
      id: "sdg_page_1",
      reason: "granted",
      requestId: "req_grant_page_1",
      status: "granted",
      supplierId: "sup-no-001",
    },
  ],
  limit: 25,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000401",
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/supplier-document-audit"]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <AdminSupplierDocumentAudit />
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signInAdmin = () =>
  buyerSession.signIn({
    displayName: "Admin Documents",
    id: adminSessionId,
    identifier: "admin@yorso.test",
    method: "email",
    source: "self_hosted",
    userId: adminUserId,
  });

describe("AdminSupplierDocumentAudit page", () => {
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
    expect(screen.getByTestId("admin-document-audit-disabled")).toHaveTextContent("Self-hosted API is not connected");
    expect(screen.getByTestId("admin-operator-nav-document-audit")).toHaveAttribute("aria-current", "page");
    unmount();

    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    buyerSession.__resetForTests();
    renderPage();

    const gate = screen.getByTestId("admin-document-audit-session-required");
    expect(gate).toHaveTextContent("Self-hosted session required");
    expect(within(gate).getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
  });

  it("renders grant audit rows without leaking storage fields", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify(grantPayload()), {
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchImpl);
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-document-audit-rows");
    expect(screen.getByTestId("admin-document-audit-rows")).toHaveTextContent("sdg_page_1");
    expect(screen.getByTestId("admin-document-audit-rows")).toHaveTextContent("sup-no-001");
    expect(screen.getAllByTestId("admin-document-audit-row")).toHaveLength(1);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      "https://api.yorso.test/v1/admin/supplier-documents/download-grants?limit=25&offset=0",
    );

    const bodyText = document.body.textContent ?? "";
    expect(bodyText).not.toContain("fileAssetId");
    expect(bodyText).not.toContain("downloadPath");
    expect(bodyText).not.toContain("objectKey");
    expect(bodyText).not.toContain("storage");
  });

  it("keeps RU forbidden copy localized", async () => {
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

    await screen.findByTestId("admin-document-audit-forbidden");
    expect(screen.getByText("Нужна роль администратора")).toBeInTheDocument();
    expect(screen.queryByText("Admin role required")).toBeNull();
  });
});
