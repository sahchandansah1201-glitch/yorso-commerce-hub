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
import { render, screen, cleanup, within, fireEvent, act, waitFor } from "@testing-library/react";
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

const remoteSupplierDetail = {
  id: "sup-remote-909",
  maskedName: "Remote salmon producer · NO-909",
  companyName: null,
  country: "Norway",
  countryCode: "NO",
  city: "Tromso",
  supplierType: "producer",
  inBusinessSinceYear: 2016,
  productFocus: [{ species: "Atlantic Salmon", forms: "HOG, fillet" }],
  certifications: ["ASC", "HACCP"],
  certificationBadges: [
    { code: "ASC", label: "ASC", logo: null },
    { code: "HACCP", label: "HACCP", logo: null },
  ],
  activeOffersCount: null,
  shortDescription: "Remote API supplier for frontend detail loading.",
  about: null,
  responseSignal: "normal",
  documentReadiness: "ready",
  verificationLevel: "documents_reviewed",
  heroImage: "/offers/salmon.webp",
  logoImage: null,
  deliveryCountries: [{ code: "DE", name: "Germany" }],
  deliveryCountriesTotal: null,
  totalProductsCount: null,
  productCatalogPreview: [
    {
      name: "Remote salmon HOG",
      species: "Atlantic Salmon",
      form: "HOG",
      image: "/offers/salmon.webp",
    },
  ],
  website: null,
  whatsapp: null,
  productionFacts: {
    dailyTons: 91,
    lines: 7,
    coldStorageT: 1400,
    blastFreezerT: 95,
    staff: 260,
  },
  logisticsFacts: {
    incoterms: ["DAP", "CIF"],
    transitDaysMin: 20,
    transitDaysMax: 28,
    minBatchTons: 12,
    containers: ["Backend reefer"],
    tempRange: "-20 C backend-owned",
  },
  shipmentCases: [
    {
      id: "backend-case-001",
      titleKey: "supplier_cases_caseTitle_de",
      dateISO: "2026-04-11",
      destinationKey: "supplier_cases_destination_de",
      product: "Backend salmon case",
      volumeTons: 77,
      incoterm: "DAP Backend Port",
      buyerTypeKey: "supplier_cases_buyerType_retail",
      notesKey: "supplier_cases_notes_de",
      photoCaptionKeys: ["supplier_cases_photoCaption_loading"],
    },
  ],
  faqItems: [
    {
      qKey: "supplier_faq_q1",
      aKey: "supplier_faq_a1",
      params: { n: 12 },
    },
  ],
  updatedAt: "2026-05-14T00:00:00.000Z",
  accessLevel: "anonymous_locked",
};

describe("SupplierProfile · access gating", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
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

    it("загружает профиль поставщика через self-hosted supplier directory API, если id отсутствует в локальных моках", async () => {
      vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
      const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
        new Response(JSON.stringify({
          ok: true,
          supplier: remoteSupplierDetail,
          accessLevel: "anonymous_locked",
          requestId: "remote-profile-test",
        }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      renderProfile(remoteSupplierDetail.id);

      await waitFor(() =>
        expect(fetchMock.mock.calls.some(([url]) =>
          String(url) === "http://api.test/v1/suppliers/sup-remote-909?accessLevel=anonymous_locked",
        )).toBe(true),
      );
      expect((await screen.findAllByText(remoteSupplierDetail.maskedName)).length).toBeGreaterThan(0);
      expect(document.body.textContent ?? "").not.toContain("Remote Legal Supplier AS");
    });

    it("рендерит production/logistics dossier facts из self-hosted API, а не пересчитывает их на клиенте", async () => {
      vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
      const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
        new Response(JSON.stringify({
          ok: true,
          supplier: remoteSupplierDetail,
          accessLevel: "anonymous_locked",
          requestId: "remote-profile-dossier-test",
        }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      renderProfile(remoteSupplierDetail.id);

      expect((await screen.findAllByText(remoteSupplierDetail.maskedName)).length).toBeGreaterThan(0);
      expect(await screen.findByText("91 t / day")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
      expect(screen.getByText("around 260")).toBeInTheDocument();
      expect(screen.getByText("1400 t simultaneous storage")).toBeInTheDocument();
      expect(screen.getByText("95 t / day")).toBeInTheDocument();
      expect(screen.getByText("DAP · CIF")).toBeInTheDocument();
      expect(screen.getByText("from 12 t / SKU")).toBeInTheDocument();
      expect(screen.getByText("20–28 days")).toBeInTheDocument();
      expect(screen.getByText("Backend reefer")).toBeInTheDocument();
      expect(screen.getByText("-20 C backend-owned")).toBeInTheDocument();
    });

    it("рендерит shipment evidence и FAQ из self-hosted API, а не пересчитывает их на клиенте", async () => {
      vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
      vi.stubGlobal("fetch", vi.fn(async () =>
        new Response(JSON.stringify({
          ok: true,
          supplier: remoteSupplierDetail,
          accessLevel: "anonymous_locked",
          requestId: "remote-profile-evidence-test",
        }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ));

      renderProfile(remoteSupplierDetail.id);

      expect((await screen.findAllByText(/Backend salmon case/)).length).toBeGreaterThan(0);
      expect(screen.getAllByText("DAP Backend Port").length).toBeGreaterThan(0);
      expect(screen.getByText("77 t")).toBeInTheDocument();
      await waitFor(() => {
        const faq = document.getElementById(`faq-jsonld-${remoteSupplierDetail.id}`);
        const json = JSON.parse(faq?.textContent ?? "{}");
        expect(json.mainEntity?.[0]?.acceptedAnswer?.text).toMatch(/from 12 tons per SKU/i);
      });
    });

    it("при ошибке self-hosted API не подставляет локальный fallback-профиль", async () => {
      vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
      const fetchMock = vi.fn(async () => {
        throw new Error("supplier api offline");
      });
      vi.stubGlobal("fetch", fetchMock);

      renderProfile();

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      expect(await screen.findByText("Supplier API unavailable")).toBeInTheDocument();
      expect(screen.queryByText(supplier.maskedName)).not.toBeInTheDocument();
      expect(document.body.innerHTML).not.toContain(supplier.companyName);
      expect(document.body.innerHTML).not.toContain(supplier.website!);
    });

    it("уважает supplier-specific downgrade от self-hosted API даже при global qualified", async () => {
      setSignedIn();
      setQualified();
      vi.stubEnv("VITE_YORSO_API_URL", "http://api.test");
      const downgradedSupplier = {
        ...remoteSupplierDetail,
        id: SUPPLIER_ID,
        maskedName: supplier.maskedName,
        country: supplier.country,
        countryCode: supplier.countryCode,
        city: supplier.city,
        shortDescription: supplier.shortDescription,
        productFocus: supplier.productFocus,
        heroImage: supplier.heroImage,
        accessLevel: "registered_locked",
      };
      const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
        new Response(JSON.stringify({
          ok: true,
          supplier: downgradedSupplier,
          accessLevel: "registered_locked",
          requestId: "supplier-specific-downgrade-test",
        }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      renderProfile();

      await waitFor(() =>
        expect(fetchMock.mock.calls.some(([url]) =>
          String(url) === "http://api.test/v1/suppliers/sup-no-001?accessLevel=qualified_unlocked",
        )).toBe(true),
      );
      expect(await screen.findByTestId("supplier-request-price-access")).toBeInTheDocument();
      expect(screen.getAllByText(supplier.maskedName).length).toBeGreaterThan(0);
      expect(document.body.textContent ?? "").not.toContain(supplier.companyName);
      expect(document.body.innerHTML).not.toMatch(/wa\.me\//);
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

    it("после клика появляется status-карточка sent/pending", async () => {
      renderProfile();
      const btn = screen.getByTestId("supplier-request-price-access");
      act(() => {
        fireEvent.click(btn);
      });
      const status = await screen.findByTestId("supplier-access-request-status");
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
      // Все возвращённые офферы — норвежского происхождения, и хотя бы
      // один Atlantic Salmon должен быть в каталоге профиля Nordfjord.
      const norwayOffers = expected.filter(
        (o) => o.origin.toLowerCase() === supplier.country.toLowerCase(),
      );
      expect(norwayOffers.length).toBeGreaterThan(0);
      // Профиль не должен показывать офферы, которые не вернул маппер.
      const text = document.body.textContent ?? "";
      const hasSalmon = expected.some((o) => /salmon/i.test(o.species)) &&
        /salmon/i.test(text);
      expect(hasSalmon, "Atlantic Salmon (species поставщика) должен быть в каталоге").toBe(true);
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
