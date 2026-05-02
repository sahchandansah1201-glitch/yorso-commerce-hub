/**
 * SupplierProfile · Hero CTA cleanup.
 *
 * Гарантирует, что после консолидации CTA:
 *  • inline-CTA под замыленным H1 (`supplier-hero-inline-cta`) больше не
 *    рендерится ни в одном из 3 access-состояний;
 *  • главный CTA-блок (`supplier-cta-block`) присутствует во всех
 *    состояниях и содержит ровно одно primary-действие для locked-стейтов.
 */
import * as React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SupplierProfile from "@/pages/SupplierProfile";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";

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
const QUAL_KEY = "yorso_buyer_qualification";

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

const setQualified = () => {
  sessionStorage.setItem(
    QUAL_KEY,
    JSON.stringify({
      companyName: "Nordfjord Sjømat AS",
      approvedAt: new Date().toISOString(),
    }),
  );
};

const renderProfile = () => {
  cleanup();
  return render(
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
};

describe("SupplierProfile · hero CTA consolidation", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("anonymous_locked", () => {
    it("не рендерит inline-CTA под H1", () => {
      renderProfile();
      expect(screen.queryByTestId("supplier-hero-inline-cta")).toBeNull();
    });

    it("главный CTA остаётся в supplier-cta-block", () => {
      renderProfile();
      const block = screen.getByTestId("supplier-cta-block");
      expect(block).toBeInTheDocument();
      // Для анонима — ссылка на регистрацию внутри блока.
      const anon = within(block).getByTestId("supplier-anon-cta");
      expect(within(anon).getByRole("link")).toHaveAttribute("href", "/register");
    });
  });

  describe("registered_locked", () => {
    beforeEach(() => setSignedIn());

    it("не рендерит inline-CTA под H1", () => {
      renderProfile();
      expect(screen.queryByTestId("supplier-hero-inline-cta")).toBeNull();
    });

    it("главный CTA остаётся в supplier-cta-block (запрос доступа)", () => {
      renderProfile();
      const block = screen.getByTestId("supplier-cta-block");
      expect(block).toBeInTheDocument();
      expect(
        within(block).getByTestId("supplier-request-price-access"),
      ).toBeInTheDocument();
    });
  });

  describe("qualified_unlocked", () => {
    beforeEach(() => {
      setSignedIn();
      setQualified();
    });

    it("не рендерит inline-CTA под H1", () => {
      renderProfile();
      expect(screen.queryByTestId("supplier-hero-inline-cta")).toBeNull();
    });

    it("главный CTA остаётся в supplier-cta-block с контактными действиями", () => {
      renderProfile();
      const block = screen.getByTestId("supplier-cta-block");
      expect(block).toBeInTheDocument();
      expect(within(block).getAllByRole("button").length).toBeGreaterThan(0);
    });
  });
});
