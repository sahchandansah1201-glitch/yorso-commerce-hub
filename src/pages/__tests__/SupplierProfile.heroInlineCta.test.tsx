/**
 * SupplierProfile · inline CTA под залюренным H1 в hero.
 *
 * Проверяет три locked-состояния:
 *  • anonymous_locked → ссылка-кнопка на /register;
 *  • registered_locked без заявки → кнопка «Запросить подтверждение поставщика»,
 *    клик создаёт SupplierAccessRequest и переключает CTA на pending-бейдж;
 *  • registered_locked с уже отправленной заявкой → pending-бейдж.
 */
import * as React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SupplierProfile from "@/pages/SupplierProfile";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import {
  SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
  type SupplierAccessRequest,
} from "@/lib/supplier-access-requests";

vi.mock("@/components/ui/tabs", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  return {
    Tabs: Pass,
    TabsList: Pass,
    TabsTrigger: ({ children }: { children?: React.ReactNode }) => (
      <button type="button">{children}</button>
    ),
    TabsContent: Pass,
  };
});

const SUPPLIER_ID = "sup-no-001";
const SESSION_KEY = "yorso_buyer_session";

const setSignedIn = () => {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: "b_test",
      identifier: "tester@example.com",
      method: "email",
      signedInAt: new Date().toISOString(),
      displayName: "tester",
    }),
  );
};

const seedRequest = (status: SupplierAccessRequest["status"] = "sent") => {
  const req: SupplierAccessRequest = {
    status,
    intent: "exact_price",
    supplierId: SUPPLIER_ID,
    sentAt: new Date().toISOString(),
  } as SupplierAccessRequest;
  localStorage.setItem(
    SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
    JSON.stringify({ [SUPPLIER_ID]: req }),
  );
};

const renderProfile = () =>
  render(
    <MemoryRouter initialEntries={[`/suppliers/${SUPPLIER_ID}`]}>
      <LanguageProvider>
        <BuyerSessionProvider>
          <Routes>
            <Route path="/suppliers/:supplierId" element={<SupplierProfile />} />
          </Routes>
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

describe("SupplierProfile · hero inline CTA", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("anonymous_locked: показывает ссылку-кнопку на /register", () => {
    renderProfile();
    const cta = screen.getByTestId("supplier-hero-cta-anon");
    expect(cta).toBeInTheDocument();
    const link = cta.tagName === "A" ? cta : cta.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/register");
    expect(screen.queryByTestId("supplier-hero-cta-request")).toBeNull();
    expect(screen.queryByTestId("supplier-hero-cta-pending")).toBeNull();
  });

  it("registered_locked без заявки: кнопка «Запросить» создаёт заявку и переключает на pending", () => {
    setSignedIn();
    renderProfile();
    const requestBtn = screen.getByTestId("supplier-hero-cta-request");
    expect(requestBtn).toBeInTheDocument();
    expect(screen.queryByTestId("supplier-hero-cta-pending")).toBeNull();

    act(() => {
      fireEvent.click(requestBtn);
    });

    expect(screen.queryByTestId("supplier-hero-cta-request")).toBeNull();
    expect(screen.getByTestId("supplier-hero-cta-pending")).toBeInTheDocument();

    const stored = JSON.parse(
      localStorage.getItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY) ?? "{}",
    );
    expect(stored[SUPPLIER_ID]).toBeTruthy();
  });

  it("registered_locked с уже отправленной заявкой: показывает pending-бейдж", () => {
    setSignedIn();
    seedRequest("sent");
    renderProfile();
    expect(screen.getByTestId("supplier-hero-cta-pending")).toBeInTheDocument();
    expect(screen.queryByTestId("supplier-hero-cta-request")).toBeNull();
    expect(screen.queryByTestId("supplier-hero-cta-anon")).toBeNull();
  });
});
