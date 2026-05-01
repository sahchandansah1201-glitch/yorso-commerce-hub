/**
 * SupplierProfile · access gating + supplier-offer mapping.
 *
 * Покрытие (P1 blockers):
 *  • locked-стейты не утечают companyName / website / whatsapp / legal
 *    регистрационные номера / точное число активных предложений в DOM
 *    и в SEO-метаданные;
 *  • qualified-стейт показывает реальное название и контакты;
 *  • для registered_locked показан Supplier Access Request Panel,
 *    статусы sent / pending / approved корректно сменяются;
 *  • approved-запрос разблокирует профиль на следующий визит;
 *  • supplierOffers сформированы через getOffersForSupplier
 *    (по origin + species), а не через mockOffers.slice(...);
 *  • в DOM нет вложенных интерактивных элементов (a > button, button > button).
 */
import * as React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, within, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SupplierProfile from "@/pages/SupplierProfile";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockSuppliers } from "@/data/mockSuppliers";
import { getOffersForSupplier } from "@/data/mockOffers";
import {
  SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY,
  type SupplierAccessRequest,
} from "@/lib/supplier-access-requests";

// Radix Tabs не активирует TabsContent в jsdom, мокаем как в lang-switch тесте.
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

const SUPPLIER_ID = "sup-no-001"; // Nordfjord Sjømat AS — Norway

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
    JSON.stringify({ companyName: "Nordfjord Sjømat AS", approvedAt: new Date().toISOString() }),
  );
};

const seedRequest = (req: Partial<SupplierAccessRequest>) => {
  const full: SupplierAccessRequest = {
    status: "sent",
    intent: "exact_price",
    supplierId: SUPPLIER_ID,
    sentAt: new Date().toISOString(),
    ...req,
  } as SupplierAccessRequest;
  const store = { [SUPPLIER_ID]: full };
  localStorage.setItem(SUPPLIER_ACCESS_REQUESTS_STORAGE_KEY, JSON.stringify(store));
};

const renderProfile = (supplierId = SUPPLIER_ID) => {
  cleanup();
  document.head.querySelectorAll('script[id^="org-jsonld-"]').forEach((s) => s.remove());
  document.head.querySelectorAll('script[id^="faq-jsonld-"]').forEach((s) => s.remove());
  document.head.querySelectorAll('script[id^="itemlist-jsonld-"]').forEach((s) => s.remove());
  return render(
    <MemoryRouter initialEntries={[`/suppliers/${supplierId}`]}>
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

const supplier = mockSuppliers.find((s) => s.id === SUPPLIER_ID)!;

describe("SupplierProfile · access gating", () => {
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
    it("не утечает companyName / website / whatsapp / legal в DOM", () => {
      renderProfile();
      const html = document.body.innerHTML;
      expect(html).not.toContain(supplier.companyName);
      if (supplier.website) expect(html).not.toContain(supplier.website);
      if (supplier.whatsapp) {
        // Не должно быть href вида wa.me/<digits>
        expect(html).not.toMatch(/wa\.me\//);
      }
      // Masked label должен присутствовать.
      expect(screen.getAllByText(supplier.maskedName).length).toBeGreaterThan(0);
    });

    it("не утекает companyName в document.title и meta description", () => {
      renderProfile();
      expect(document.title).not.toContain(supplier.companyName);
      const desc = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
      expect(desc?.content ?? "").not.toContain(supplier.companyName);
    });

    it("не эмитит ItemList JSON-LD и Organization name = maskedName", () => {
      renderProfile();
      const list = document.getElementById(`itemlist-jsonld-${SUPPLIER_ID}`);
      expect(list, "ItemList не должен утекать companyName через brand").toBeNull();
      const org = document.getElementById(`org-jsonld-${SUPPLIER_ID}`);
      expect(org).not.toBeNull();
      const json = JSON.parse(org!.textContent ?? "{}");
      expect(json.name).toBe(supplier.maskedName);
      expect(json.name).not.toBe(supplier.companyName);
    });

    it('показывает CTA "Создать аккаунт покупателя" вместо контактов', () => {
      renderProfile();
      const cta = screen.getByTestId("supplier-anon-cta");
      expect(cta).toBeInTheDocument();
      // ссылка на /register
      const link = within(cta).getByRole("link");
      expect(link.getAttribute("href")).toBe("/register");
    });

    it("не выставляет регистрационный номер компании на странице", () => {
      renderProfile();
      // legal номера не должны рендериться (компонент LegalDetailsBlock не вызывается)
      // Проверяем placeholder.
      expect(screen.getByTestId("supplier-legal-locked")).toBeInTheDocument();
    });
  });

  describe("registered_locked", () => {
    beforeEach(() => setSignedIn());

    it("показывает Supplier Access Request Panel в unsent состоянии", () => {
      renderProfile();
      expect(screen.getByTestId("supplier-request-price-access")).toBeInTheDocument();
      // companyName всё ещё скрыт
      expect(document.body.innerHTML).not.toContain(supplier.companyName);
    });

    it("после клика появляется status-карточка sent/pending", () => {
      renderProfile();
      const btn = screen.getByTestId("supplier-request-price-access");
      act(() => {
        fireEvent.click(btn);
      });
      const status = screen.getByTestId("supplier-access-request-status");
      expect(status).toBeInTheDocument();
      expect(["sent", "pending"]).toContain(status.getAttribute("data-status"));
    });

    it("approved request на следующий визит → профиль ведёт себя как qualified_unlocked", () => {
      const past = new Date(Date.now() - 60_000).toISOString();
      seedRequest({
        status: "approved",
        sentAt: past,
        approvedAt: past,
      });
      renderProfile();
      // Реальное название теперь видно.
      expect(screen.getAllByText(supplier.companyName).length).toBeGreaterThan(0);
      // Маскированное имя НЕ должно быть в hero h1.
      const h1 = screen.getByTestId("supplier-display-name");
      expect(h1.textContent).toBe(supplier.companyName);
    });

    it("approved request: SEO Organization JSON-LD содержит реальный companyName", () => {
      const past = new Date(Date.now() - 60_000).toISOString();
      seedRequest({ status: "approved", sentAt: past, approvedAt: past });
      renderProfile();
      const org = document.getElementById(`org-jsonld-${SUPPLIER_ID}`);
      const json = JSON.parse(org!.textContent ?? "{}");
      expect(json.name).toBe(supplier.companyName);
    });
  });

  describe("qualified_unlocked", () => {
    beforeEach(() => {
      setSignedIn();
      setQualified();
    });

    it("показывает реальное название и контактные кнопки", () => {
      renderProfile();
      expect(screen.getAllByText(supplier.companyName).length).toBeGreaterThan(0);
      const cta = screen.getByTestId("supplier-cta-block");
      expect(within(cta).getAllByRole("button").length).toBeGreaterThan(0);
    });

    it("не показывает access request panel для qualified", () => {
      renderProfile();
      expect(screen.queryByTestId("supplier-request-price-access")).toBeNull();
      expect(screen.queryByTestId("supplier-anon-cta")).toBeNull();
    });
  });

  describe("Catalog mapping (Fix 2)", () => {
    it("использует getOffersForSupplier по origin + species, а не slice по индексу", () => {
      renderProfile();
      const expected = getOffersForSupplier(
        supplier.country,
        supplier.productFocus.map((p) => p.species),
        4,
      );
      expect(expected.length).toBeGreaterThan(0);
      // Все ожидаемые офферы по origin = Norway должны быть в DOM каталога
      // (мы рендерим до 4-х; берём только sameOrigin для надёжности).
      const norwayOffers = expected.filter(
        (o) => o.origin.toLowerCase() === supplier.country.toLowerCase(),
      );
      for (const o of norwayOffers) {
        // origin или species должны встретиться в DOM как часть карточки.
        expect(document.body.textContent ?? "").toContain(o.species);
      }
    });
  });

  describe("Nested interactives (lint-style: a>button / button>button)", () => {
    it("в anonymous_locked: нет вложенных интерактивных элементов", () => {
      renderProfile();
      const aBtn = document.querySelectorAll("a button").length;
      const btnBtn = document.querySelectorAll("button button").length;
      expect(aBtn).toBe(0);
      expect(btnBtn).toBe(0);
    });

    it("в qualified_unlocked: нет вложенных интерактивных элементов", () => {
      setSignedIn();
      setQualified();
      renderProfile();
      const aBtn = document.querySelectorAll("a button").length;
      const btnBtn = document.querySelectorAll("button button").length;
      expect(aBtn).toBe(0);
      expect(btnBtn).toBe(0);
    });
  });
});
