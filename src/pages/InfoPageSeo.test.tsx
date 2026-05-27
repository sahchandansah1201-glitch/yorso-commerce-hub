import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
import { seoTitleWithBrand } from "@/lib/public-route-seo";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Cookies from "@/pages/Cookies";
import GDPR from "@/pages/GDPR";
import AntiFraud from "@/pages/AntiFraud";
import Careers from "@/pages/Careers";
import Press from "@/pages/Press";
import Partners from "@/pages/Partners";

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
        'link[rel="canonical"]',
      ].join(","),
    )
    .forEach((el) => el.remove());
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/gdpr" element={<GDPR />} />
            <Route path="/anti-fraud" element={<AntiFraud />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/press" element={<Press />} />
            <Route path="/partners" element={<Partners />} />
          </Routes>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const jsonLdIdForPath = (path: string) =>
  `info-page-${path.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9-]+/gi, "-") || "home"}`;

describe("info and legal pages own route-level SEO", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("yorso-lang", "en");
    cleanHead();
    document.title = "Lovable App";
  });

  afterEach(() => {
    cleanup();
    cleanHead();
  });

  it.each([
    {
      path: "/about",
      title: translations.en.info_about_title,
      description: translations.en.info_about_intro,
      schemaType: "AboutPage",
    },
    {
      path: "/contact",
      title: translations.en.info_contact_title,
      description: translations.en.info_contact_intro,
      schemaType: "ContactPage",
    },
    {
      path: "/terms",
      title: translations.en.info_terms_title,
      description: translations.en.info_terms_intro,
      schemaType: "WebPage",
    },
    {
      path: "/privacy",
      title: translations.en.info_privacy_title,
      description: translations.en.info_privacy_intro,
      schemaType: "WebPage",
    },
    {
      path: "/cookies",
      title: translations.en.info_cookies_title,
      description: translations.en.info_cookies_intro,
      schemaType: "WebPage",
    },
    {
      path: "/gdpr",
      title: translations.en.info_gdpr_title,
      description: translations.en.info_gdpr_intro,
      schemaType: "WebPage",
    },
    {
      path: "/anti-fraud",
      title: translations.en.info_antifraud_title,
      description: translations.en.info_antifraud_intro,
      schemaType: "WebPage",
    },
    {
      path: "/careers",
      title: translations.en.info_careers_title,
      description: translations.en.info_careers_intro,
      schemaType: "WebPage",
    },
    {
      path: "/press",
      title: translations.en.info_press_title,
      description: translations.en.info_press_intro,
      schemaType: "WebPage",
    },
    {
      path: "/partners",
      title: translations.en.info_partners_title,
      description: translations.en.info_partners_intro,
      schemaType: "WebPage",
    },
  ])("$path sets localized title, canonical, social meta and JSON-LD", async ({ path, title, description, schemaType }) => {
    renderAt(path);
    const expectedTitle = seoTitleWithBrand(title);
    const expectedCanonical = new URL(path, window.location.origin).toString();

    await waitFor(() => {
      expect(document.head.querySelector('meta[name="x-route-seo"]')).not.toBeNull();
      expect(document.title).toBe(expectedTitle);
    });

    expect(getMeta('meta[name="description"]')).toBe(description);
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe(expectedCanonical);
    expect(getMeta('meta[property="og:title"]')).toBe(expectedTitle);
    expect(getMeta('meta[property="og:description"]')).toBe(description);
    expect(getMeta('meta[property="og:url"]')).toBe(expectedCanonical);
    expect(getMeta('meta[property="og:site_name"]')).toBe("YORSO");
    expect(getMeta('meta[name="twitter:title"]')).toBe(expectedTitle);
    expect(getMeta('meta[name="twitter:description"]')).toBe(description);

    const jsonLd = document.head.querySelector<HTMLScriptElement>(
      `script[data-jsonld="${jsonLdIdForPath(path)}"]`,
    );
    expect(jsonLd).not.toBeNull();
    expect(JSON.parse(jsonLd?.text ?? "{}")).toMatchObject({
      "@type": schemaType,
      url: expectedCanonical,
      name: expectedTitle,
      description,
      inLanguage: "en",
    });
  });

  it("keeps info route metadata localized on direct RU entry", async () => {
    localStorage.setItem("yorso-lang", "ru");
    renderAt("/anti-fraud");

    const expectedTitle = seoTitleWithBrand(translations.ru.info_antifraud_title);

    await waitFor(() => {
      expect(document.documentElement.getAttribute("lang")).toBe("ru");
      expect(document.title).toBe(expectedTitle);
    });

    expect(getMeta('meta[name="description"]')).toBe(translations.ru.info_antifraud_intro);
    expect(document.title).not.toBe(translations.ru.meta_siteTitle);
    expect(getMeta('meta[name="description"]')).not.toBe(translations.ru.meta_siteDescription);
  });
});
