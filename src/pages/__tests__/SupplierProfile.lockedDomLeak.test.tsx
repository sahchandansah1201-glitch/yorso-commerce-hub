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

const FORBIDDEN_OPERATIONAL_PATTERNS: RegExp[] = [
  /\d+\s*active\s*offers/i,
  /\d+\s*активных\s*офферов/i,
  /\d+\s*ofertas\s*activas/i,
  /\d+\s*t\s*\/\s*day/i,
  /\d+\s*т\s*\/\s*сутки/i,
  /\d+\s*t\s*\/\s*día/i,
  /\d+\s*t\s+simultaneous\s+storage/i,
  /\d+\s*т\s+единовременного\s+хранения/i,
  /from\s+\d+\s*t\s*\/\s*SKU/i,
  /от\s+\d+\s*т\s*\/\s*SKU/i,
  /desde\s+\d+\s*t\s*\/\s*SKU/i,
  /\d+[–-]\d+\s*days/i,
  /\d+[–-]\d+\s*дней/i,
  /\d+[–-]\d+\s*días/i,
  /\d+\s*SKU/,
];

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
    // Конкретный exact-format должен быть невидим
    expect(text).not.toMatch(new RegExp(`${supplier.activeOffersCount}\\s*active\\s*offers`, "i"));
    for (const pattern of FORBIDDEN_OPERATIONAL_PATTERNS) {
      expect(text, `DOM contains forbidden pattern: ${pattern}`).not.toMatch(pattern);
      expect(html, `innerHTML contains forbidden pattern: ${pattern}`).not.toMatch(pattern);
    }
    // Локализованный locked-hint должен присутствовать
    expect(text).toContain("Active offers available after price access");
  });

  it("registered_locked: те же DOM-проверки + masked-name присутствует", () => {
    setSignedIn();
    renderProfile();
    const text = document.body.textContent ?? "";
    for (const pattern of FORBIDDEN_OPERATIONAL_PATTERNS) {
      expect(text, `DOM contains forbidden pattern: ${pattern}`).not.toMatch(pattern);
    }
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
