import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import type { AdminSupplierDocumentManagementEventsListResponse } from "@/lib/admin-supplier-document-management-events-api";
import { buyerSession } from "@/lib/buyer-session";
import AdminSupplierDocumentManagementEvents from "./AdminSupplierDocumentManagementEvents";

const adminUserId = "00000000-0000-4000-8000-000000000099";
const adminSessionId = "session-admin-management-events-page";

const eventsPayload = (): AdminSupplierDocumentManagementEventsListResponse => ({
  items: [
    {
      action: "supplier_document.approve",
      actorRole: "admin",
      actorUserId: adminUserId,
      createdAt: "2026-05-31T08:00:00.000Z",
      documentId: "sup-no-001-health-certificate",
      id: "sdme_page_1",
      nextStatus: "approved",
      previousStatus: "review",
      reason: "Approved for buyer visibility",
      requestId: "req_management_page_1",
      supplierId: "sup-no-001",
    },
  ],
  limit: 50,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000451",
});

const actionableEventsPayload = (): AdminSupplierDocumentManagementEventsListResponse => ({
  ...eventsPayload(),
  items: [
    {
      ...eventsPayload().items[0],
      action: "supplier_document.create",
      id: "sdme_page_review",
      nextStatus: "review",
      previousStatus: null,
      reason: "Supplier uploaded document for review",
    },
    {
      ...eventsPayload().items[0],
      id: "sdme_page_approved",
      nextStatus: "approved",
      previousStatus: "review",
    },
  ],
});

const actionPayload = (action: string) => ({
  audit: {
    action,
    actorRole: "admin",
    createdAt: "2026-05-31T08:05:00.000Z",
    documentId: "sup-no-001-health-certificate",
    nextStatus: action === "supplier_document.expire" ? "expired" : "approved",
    previousStatus: action === "supplier_document.expire" ? "approved" : "review",
    reason: "Reviewed by admin",
    requestId: "req_management_action_page",
    supplierId: "sup-no-001",
  },
  document: {
    documentType: "health_certificate",
    expiresAt: null,
    id: "sup-no-001-health-certificate",
    issuedAt: null,
    status: action === "supplier_document.expire" ? "expired" : "approved",
    title: "Health certificate",
  },
  ok: true,
  requestId: "req_management_action_page",
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/supplier-document-management-events"]}>
      <LanguageProvider>
        <TooltipProvider>
          <BuyerSessionProvider>
            <Routes>
              <Route
                element={<AdminSupplierDocumentManagementEvents />}
                path="/admin/supplier-document-management-events"
              />
            </Routes>
          </BuyerSessionProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const signInAdmin = () =>
  buyerSession.signIn({
    displayName: "Admin Management Events",
    id: adminSessionId,
    identifier: "admin@yorso.test",
    method: "email",
    source: "self_hosted",
    userId: adminUserId,
  });

describe("AdminSupplierDocumentManagementEvents page", () => {
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
    expect(screen.getByTestId("admin-document-management-events-disabled")).toHaveTextContent(
      "Self-hosted API is not connected",
    );
    expect(screen.getByTestId("admin-operator-nav-document-management-events")).toHaveAttribute("aria-current", "page");
    unmount();

    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    buyerSession.__resetForTests();
    renderPage();

    const gate = screen.getByTestId("admin-document-management-events-session-required");
    expect(gate).toHaveTextContent("Self-hosted session required");
    expect(within(gate).getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
  });

  it("renders sanitized management event rows and exports JSON/CSV", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("/management-events/export") && url.includes("format=csv")) {
        return new Response("id,createdAt,action\nsdme_page_1,2026-05-31T08:00:00.000Z,supplier_document.approve\n", {
          headers: { "content-type": "text/csv" },
        });
      }
      if (url.includes("/management-events/export")) {
        return new Response(JSON.stringify(eventsPayload()), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(eventsPayload()), {
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchImpl);
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-document-management-events-rows");
    expect(screen.getByTestId("admin-document-management-events-rows")).toHaveTextContent("sdme_page_1");
    expect(screen.getByTestId("admin-document-management-events-rows")).toHaveTextContent("supplier_document.approve");
    expect(screen.getByTestId("admin-document-management-events-rows")).toHaveTextContent("review → approved");
    expect(screen.getAllByTestId("admin-document-management-events-row")).toHaveLength(1);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      "https://api.yorso.test/v1/admin/supplier-documents/management-events?limit=50&offset=0",
    );

    fireEvent.click(screen.getByTestId("admin-document-management-events-export-json"));
    await waitFor(() =>
      expect(screen.getByTestId("admin-document-management-events-export-status")).toHaveTextContent(
        "Management event export ready",
      ),
    );
    fireEvent.click(screen.getByTestId("admin-document-management-events-export-csv"));
    await waitFor(() => {
      const urls = fetchImpl.mock.calls.map((call) => String(call[0]));
      expect(urls.some((url) => url.includes("/management-events/export") && url.includes("format=csv"))).toBe(true);
    });

    const bodyText = document.body.textContent ?? "";
    expect(bodyText).not.toContain("fileAssetId");
    expect(bodyText).not.toContain("downloadPath");
    expect(bodyText).not.toContain("objectKey");
    expect(bodyText).not.toContain("storage");
    expect(bodyText).not.toContain(adminSessionId);
    expect(bodyText).not.toContain("admin@yorso.test");
  });

  it("runs status-aware approve and confirmed expire actions then refreshes the event list", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith("/decision")) {
        return new Response(JSON.stringify(actionPayload("supplier_document.approve")), {
          headers: { "content-type": "application/json" },
        });
      }
      if (url.endsWith("/lifecycle")) {
        return new Response(JSON.stringify(actionPayload("supplier_document.expire")), {
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify(actionableEventsPayload()), {
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchImpl);
    signInAdmin();

    renderPage();

    await screen.findByTestId("admin-document-management-events-rows");
    fireEvent.click(screen.getByTestId("admin-document-management-events-approve-sdme_page_review"));
    await waitFor(() => {
      const decisionCall = fetchImpl.mock.calls.find((call) => String(call[0]).endsWith("/decision"));
      expect(decisionCall).toBeTruthy();
      expect(JSON.parse(String(decisionCall?.[1]?.body))).toEqual({ decision: "approve" });
    });

    expect(screen.getByTestId("admin-document-management-events-expire-sdme_page_approved")).toBeDisabled();
    fireEvent.change(screen.getByTestId("admin-document-management-events-reason-sdme_page_approved"), {
      target: { value: "Certificate validity passed" },
    });
    fireEvent.click(screen.getByTestId("admin-document-management-events-expire-sdme_page_approved"));

    expect(screen.getByTestId("admin-document-management-events-confirmation")).toHaveTextContent(
      "Confirm document action",
    );
    expect(fetchImpl.mock.calls.find((call) => String(call[0]).endsWith("/lifecycle"))).toBeUndefined();
    fireEvent.click(screen.getByTestId("admin-document-management-events-confirm-cancel"));
    await waitFor(() =>
      expect(screen.queryByTestId("admin-document-management-events-confirmation")).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("admin-document-management-events-expire-sdme_page_approved"));
    fireEvent.click(screen.getByTestId("admin-document-management-events-confirm-submit"));

    await waitFor(() => {
      const lifecycleCall = fetchImpl.mock.calls.find((call) => String(call[0]).endsWith("/lifecycle"));
      expect(lifecycleCall).toBeTruthy();
      expect(JSON.parse(String(lifecycleCall?.[1]?.body))).toEqual({
        action: "expire",
        reason: "Certificate validity passed",
      });
    });
    await waitFor(() => expect(fetchImpl.mock.calls.filter((call) => String(call[0]).includes("/management-events?"))).toHaveLength(3));

    const bodyText = document.body.textContent ?? "";
    expect(bodyText).not.toContain("fileAssetId");
    expect(bodyText).not.toContain("downloadPath");
    expect(bodyText).not.toContain(adminSessionId);
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

    await screen.findByTestId("admin-document-management-events-forbidden");
    expect(screen.getByText("Нужна роль администратора")).toBeInTheDocument();
    expect(screen.queryByText("Admin role required")).toBeNull();
  });
});
