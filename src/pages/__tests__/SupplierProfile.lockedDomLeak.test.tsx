/**
 * SupplierProfile · DOM leak проверки для locked-стейтов и
 * локализация SupplierAccessRequestPanel.
 *
 * Эти тесты страхуют исправления Fix 1 и Fix 2:
 *   • точное число активных офферов (`14 active offers`) не выводится;
 *   • supplier-specific operational значения паспорта (т/сутки, SKU,
 *     дни транзита и т.п.) не присутствуют в DOM в любом текстовом виде.
 *
 * А также Fix 3 — английские строки SupplierAccessRequestPanel
 * заменяются на RU / ES при смене языка.
 */
import * as React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SupplierProfile from "@/pages/SupplierProfile";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { mockSuppliers } from "@/data/mockSuppliers";

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
const supplier = mockSuppliers.find((s) => s.id === SUPPLIER_ID)!;
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
    JSON.stringify({ companyName: supplier.companyName, approvedAt: new Date().toISOString() }),
  );
};

const LangSwitcher = ({ to }: { to: "en" | "ru" | "es" }) => {
  const { setLang } = useLanguage();
  React.useEffect(() => {
    setLang(to);
  }, [to, setLang]);
  return null;
};

const renderProfile = (langTo?: "en" | "ru" | "es") => {
  cleanup();
  document.head.querySelectorAll('script[id^="org-jsonld-"]').forEach((s) => s.remove());
  document.head.querySelectorAll('script[id^="faq-jsonld-"]').forEach((s) => s.remove());
  document.head.querySelectorAll('script[id^="itemlist-jsonld-"]').forEach((s) => s.remove());
  return render(
    <MemoryRouter initialEntries={[`/suppliers/${SUPPLIER_ID}`]}>
      <LanguageProvider>
        <BuyerSessionProvider>
          {langTo && <LangSwitcher to={langTo} />}
          <Routes>
            <Route path="/suppliers/:supplierId" element={<SupplierProfile />} />
          </Routes>
        </BuyerSessionProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

// Narrowed: only forbid operational supplier-specific values. The generic
// `\d+\s*active\s*offers` matcher was removed because innerText concatenates
// neighbouring labels (e.g. "Years on market22Active offers"), which is a
// false positive — we keep the exact-count check separately.
const FORBIDDEN_OPERATIONAL_PATTERNS: RegExp[] = [
  /\d+\s*t\s*\/\s*day/i,
  /\d+\s*т\s*\/\s*сутки/i,
  /\d+\s*t\s*\/\s*día/i,
  /\d+\s*t\s+simultaneous\s+storage/i,
  /\d+\s*т\s+единовременного\s+хранения/i,
  /from\s+\d+\s*t\s*\/\s*SKU/i,
  /от\s+\d+\s*т\s*\/\s*SKU/i,
  /desde\s+\d+\s*t\s*\/\s*SKU/i,
  // Note: `\d+[–-]\d+\s*days` (and локали) специально опущены —
  // строки вида "3–7 days after payment" в lead-times это статичная общая
  // копия, не supplier-specific operational data.
  /\d+\s*SKU/,
];

// Legal registration values that must not leak in locked DOM. Derived from
// the deterministic supplier-legal generator for sup-no-001.
const FORBIDDEN_LEGAL_PATTERNS: RegExp[] = [
  /Org\.\s*nr/i,
  /Brønnøysund/i,
  /\bVAT\b/,
  /\bEORI\b/,
  /AS\s*\(Aksjeselskap\)/i,
];

const assertSensitiveAboutNotInDom = () => {
  const text = document.body.textContent ?? "";
  // Real about copy starts with "Family-owned Norwegian salmon producer"
  expect(text).not.toContain(
    "Family-owned Norwegian salmon producer operating own farms",
  );
  expect(text).not.toContain(supplier.about);
};

describe("SupplierProfile · locked DOM leak (Fix 1 + Fix 2)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("anonymous_locked: точное число активных офферов и supplier operational не утекают", () => {
    renderProfile();
    const text = document.body.textContent ?? "";
    const html = document.body.innerHTML;
    // Точное "<count> active offers" должно быть скрыто (TrustFacts pill).
    expect(text).not.toMatch(
      new RegExp(`${supplier.activeOffersCount}\\s*active\\s*offers`, "i"),
    );
    for (const pattern of FORBIDDEN_OPERATIONAL_PATTERNS) {
      expect(text, `DOM contains forbidden pattern: ${pattern}`).not.toMatch(pattern);
      expect(html, `innerHTML contains forbidden pattern: ${pattern}`).not.toMatch(pattern);
    }
    // Локализованный locked-hint должен присутствовать
    expect(text).toContain("Active offers available after price access");
    // Trust pill использует mask вместо реального числа.
    const trustPills = screen.queryAllByText("••••••");
    expect(trustPills.length).toBeGreaterThan(0);
  });

  it("anonymous_locked: about / legal / catalog offer-leaks отсутствуют", () => {
    renderProfile();
    const text = document.body.textContent ?? "";
    // Fix 1: real `supplier.about` not in DOM
    assertSensitiveAboutNotInDom();
    // Fix 2: legal block placeholder только, без реальных значений
    for (const pattern of FORBIDDEN_LEGAL_PATTERNS) {
      expect(text, `Locked DOM leaks legal: ${pattern}`).not.toMatch(pattern);
    }
    // Fix 3: supplier-catalog rows не должны утекать имена/тиры цен.
    expect(text).not.toContain("Nordic Seafood AS");
    expect(text).not.toContain("Bergen Pelagic AS");
    // Volume tier строки вида "$8.50 – $9.20" / "5,000 – 19,999 kg"
    expect(text).not.toMatch(/\$\d+\.\d+\s*[–-]\s*\$\d+\.\d+/);
    expect(text).not.toMatch(/\d{1,3}(?:,\d{3})+\s*[–-]\s*\d{1,3}(?:,\d{3})+\s*kg/i);
    // Locked catalog preview всё же есть.
    expect(screen.queryAllByTestId("supplier-catalog-locked-row").length).toBeGreaterThan(0);
  });

  it("registered_locked: те же DOM-проверки + masked-name присутствует", () => {
    setSignedIn();
    renderProfile();
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(
      new RegExp(`${supplier.activeOffersCount}\\s*active\\s*offers`, "i"),
    );
    for (const pattern of FORBIDDEN_OPERATIONAL_PATTERNS) {
      expect(text, `DOM contains forbidden pattern: ${pattern}`).not.toMatch(pattern);
    }
    for (const pattern of FORBIDDEN_LEGAL_PATTERNS) {
      expect(text, `Locked DOM leaks legal: ${pattern}`).not.toMatch(pattern);
    }
    assertSensitiveAboutNotInDom();
    expect(text).not.toContain("Nordic Seafood AS");
    expect(text).toContain(supplier.maskedName);
  });

  it("qualified_unlocked: реальные значения паспорта и точное число офферов видны", () => {
    setSignedIn();
    setQualified();
    renderProfile();
    const text = document.body.textContent ?? "";
    // exact active offers count появляется
    expect(text).toMatch(new RegExp(`${supplier.activeOffersCount}\\s*active\\s*offers`, "i"));
    // хотя бы один operational pattern (t / day) появляется в паспорте
    expect(text).toMatch(/\d+\s*t\s*\/\s*day/i);
    // Real about copy is now in DOM
    expect(text).toContain("Family-owned Norwegian salmon producer");
    // Full catalog rows render (supplier name visible) — sample the first offer.
    expect(text).toContain("Nordic Seafood AS");
  });
});

describe("SupplierAccessRequestPanel · localization (Fix 3)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setSignedIn();
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("RU: показывает русские строки, не показывает английские", async () => {
    renderProfile("ru");
    // Дать LangSwitcher эффекту примениться
    await screen.findByTestId("supplier-request-price-access");
    const text = document.body.textContent ?? "";
    expect(text).not.toContain("Request price access");
    expect(text).not.toContain("Supplier:");
    expect(text).not.toContain("The supplier reviews");
    expect(text).toContain("Запросить доступ к цене");
    expect(text).toContain("Поставщик:");
  });

  it("ES: показывает испанские строки, не показывает английские", async () => {
    renderProfile("es");
    await screen.findByTestId("supplier-request-price-access");
    const text = document.body.textContent ?? "";
    expect(text).not.toContain("Request price access");
    expect(text).not.toContain("The supplier reviews");
    expect(text).toContain("Solicitar acceso al precio");
    expect(text).toContain("Proveedor:");
  });

  it("нет вложенных интерактивов внутри panel/sent (a>button / button>button)", () => {
    renderProfile();
    expect(document.querySelectorAll("a button").length).toBe(0);
    expect(document.querySelectorAll("button button").length).toBe(0);
  });
});
