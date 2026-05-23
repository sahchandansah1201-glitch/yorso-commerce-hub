import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BuyerSessionProvider } from "@/contexts/BuyerSessionContext";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { translations, type Language } from "@/i18n/translations";
import { mockSuppliers } from "@/data/mockSuppliers";
import { seoTitleWithBrand } from "@/lib/public-route-seo";
import Index from "@/pages/Index";
import Offers from "@/pages/Offers";
import Suppliers from "@/pages/Suppliers";
import HowItWorks from "@/pages/HowItWorks";
import ForSuppliers from "@/pages/ForSuppliers";

const getMeta = (selector: string): string =>
  document.head.querySelector<HTMLMetaElement>(selector)?.getAttribute("content") ?? "";

const cleanHead = () => {
  document.head
    .querySelectorAll(
      [
        'meta[name="x-route-seo"]',
        'meta[name^="twitter:"]',
        'meta[property^="og:"]',
        'script[data-jsonld]',
        "script#ld-how-it-works",
        "script#ld-for-suppliers",
        'link[rel="canonical"]',
      ].join(","),
    )
    .forEach((el) => el.remove());
};

const Switcher = ({ onReady }: { onReady: (setLang: (lang: Language) => void) => void }) => {
  const { setLang } = useLanguage();
  onReady(setLang);
  return null;
};

const renderAt = (
  path: string,
  onReady?: (setLang: (lang: Language) => void) => void,
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <LanguageProvider>
          <TooltipProvider>
            <BuyerSessionProvider>
              <RegistrationProvider>
                {onReady ? <Switcher onReady={onReady} /> : null}
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/for-suppliers" element={<ForSuppliers />} />
                </Routes>
              </RegistrationProvider>
            </BuyerSessionProvider>
          </TooltipProvider>
        </LanguageProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("public buyer routes own route-level SEO", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_YORSO_API_URL", "");
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("yorso-lang", "en");
    cleanHead();
    document.title = "Lovable App";
  });

  afterEach(() => {
    cleanup();
    cleanHead();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each([
    {
      path: "/",
      title: translations.en.meta_siteTitle,
      description: translations.en.meta_siteDescription,
      jsonLd: 'script[data-jsonld="home-webpage"]',
    },
    {
      path: "/offers",
      title: seoTitleWithBrand(translations.en.offers_title),
      description: translations.en.offers_subtitle,
      jsonLd: 'script[data-jsonld="offers-webpage"]',
    },
    {
      path: "/suppliers",
      title: seoTitleWithBrand(translations.en.suppliersPage_title),
      description: translations.en.suppliersPage_subtitle,
      jsonLd: 'script[data-jsonld="suppliers-webpage"]',
    },
    {
      path: "/how-it-works",
      title: "How Yorso works — B2B seafood sourcing, verified suppliers, RFQ workflow",
      description:
        "Yorso is a B2B seafood trade workflow: wholesale seafood sourcing, verified suppliers, RFQ and procurement comparison, price and market context, and a defensible procurement decision report.",
      jsonLd: "script#ld-how-it-works",
    },
    {
      path: "/for-suppliers",
      title: "Seafood Suppliers · Controlled Price Access · YORSO B2B",
      description:
        "YORSO for seafood suppliers: controlled price access, qualified B2B buyer requests, one supplier card with documents and certifications. Free to register.",
      jsonLd: "script#ld-for-suppliers",
    },
  ])("$path sets canonical, social metadata, marker and JSON-LD", ({ path, title, description, jsonLd }) => {
    const { unmount } = renderAt(path);

    expect(document.head.querySelector('meta[name="x-route-seo"]')).not.toBeNull();
    expect(document.title).toBe(title);
    expect(getMeta('meta[name="description"]')).toBe(description);
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe(
      new URL(path, window.location.origin).toString(),
    );
    expect(getMeta('meta[property="og:title"]')).toBe(title);
    expect(getMeta('meta[property="og:description"]')).toBe(description);
    expect(getMeta('meta[property="og:url"]')).toBe(
      new URL(path, window.location.origin).toString(),
    );
    expect(getMeta('meta[property="og:site_name"]')).toBe("YORSO");
    expect(getMeta('meta[name="twitter:title"]')).toBe(title);
    expect(getMeta('meta[name="twitter:description"]')).toBe(description);
    expect(document.head.querySelector(jsonLd)).not.toBeNull();

    unmount();
  });

  it("/offers keeps route metadata localized after a language switch", async () => {
    let setLang!: (lang: Language) => void;
    renderAt("/offers", (setter) => {
      setLang = setter;
    });

    expect(document.title).toBe(seoTitleWithBrand(translations.en.offers_title));

    await act(async () => {
      setLang("ru");
      await new Promise((resolve) => window.setTimeout(resolve, 300));
    });

    expect(document.title).toBe(seoTitleWithBrand(translations.ru.offers_title));
    expect(getMeta('meta[name="description"]')).toBe(translations.ru.offers_subtitle);
    expect(document.title).not.toBe(translations.ru.meta_siteTitle);
  });

  it("route SEO cleanup removes marker and canonical when no previous canonical existed", () => {
    const { unmount } = renderAt("/offers");

    expect(document.head.querySelector('meta[name="x-route-seo"]')).not.toBeNull();
    expect(document.head.querySelector('link[rel="canonical"]')).not.toBeNull();

    unmount();

    expect(document.head.querySelector('meta[name="x-route-seo"]')).toBeNull();
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it("/suppliers SEO does not leak exact supplier company names before access", () => {
    renderAt("/suppliers");

    const headSnapshot = [
      document.title,
      document.head.innerHTML,
      document.head.textContent ?? "",
    ].join("\n");

    for (const supplier of mockSuppliers) {
      expect(headSnapshot).not.toContain(supplier.companyName);
    }
  });

  it("homepage H1 keeps a readable boundary between stacked title lines", () => {
    renderAt("/");

    expect(document.querySelector("h1")?.textContent).toContain("Prices. Full");
  });
});
