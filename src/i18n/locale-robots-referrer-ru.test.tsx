/**
 * <meta name="robots"> и <meta name="referrer"> — глобальные политики, не
 * зависящие от локали и маршрута. При ru-локали они должны:
 *   1) Присутствовать в DOM ровно по одному с ожидаемыми content.
 *   2) Не сбрасываться, не дублироваться и не пересоздаваться при переходах
 *      по 14 public-маршрутам.
 *   3) Не реагировать на смену языка (en ↔ ru ↔ es).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import DocumentMetaSync from "@/i18n/DocumentMetaSync";
import { RegistrationProvider } from "@/contexts/RegistrationContext";
import type { Language } from "@/i18n/translations";

import Index from "@/pages/Index";
import RegisterChoose from "@/pages/register/RegisterChoose";
import SignIn from "@/pages/SignIn";
import Offers from "@/pages/Offers";
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

const STORAGE_KEY = "yorso-lang";

// Должно совпадать с index.html.
const EXPECTED_ROBOTS = "index, follow";
const EXPECTED_REFERRER = "strict-origin-when-cross-origin";

const setBrowserLanguages = (primary: string, list?: string[]) => {
  Object.defineProperty(window.navigator, "language", { value: primary, configurable: true });
  Object.defineProperty(window.navigator, "languages", {
    value: list ?? [primary],
    configurable: true,
  });
};

type Api = { setLang: (l: Language) => void; navigateTo: (p: string) => void };

const Probe = ({ onReady }: { onReady: (api: Api) => void }) => {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  onReady({ setLang, navigateTo: (p) => navigate(p) });
  return <span data-testid="lang">{lang}</span>;
};

const renderApp = (onReady: (api: Api) => void, initialPath = "/") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LanguageProvider>
        <TooltipProvider>
          <RegistrationProvider>
            <DocumentMetaSync />
            <Probe onReady={onReady} />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<RegisterChoose />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/offers" element={<Offers />} />
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
          </RegistrationProvider>
        </TooltipProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );

const PUBLIC_ROUTES = [
  "/",
  "/register",
  "/signin",
  "/offers",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/cookies",
  "/gdpr",
  "/anti-fraud",
  "/careers",
  "/press",
  "/partners",
];

const seedHeadFromIndexHtml = () => {
  document
    .querySelectorAll('meta[name="robots"], meta[name="referrer"]')
    .forEach((el) => el.remove());

  const robots = document.createElement("meta");
  robots.setAttribute("name", "robots");
  robots.setAttribute("content", EXPECTED_ROBOTS);
  robots.setAttribute("data-testid", "meta-robots");
  document.head.appendChild(robots);

  const referrer = document.createElement("meta");
  referrer.setAttribute("name", "referrer");
  referrer.setAttribute("content", EXPECTED_REFERRER);
  referrer.setAttribute("data-testid", "meta-referrer");
  document.head.appendChild(referrer);
};

const robotsTags = () =>
  Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="robots"]'));
const referrerTags = () =>
  Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="referrer"]'));

describe("robots/referrer мета: стабильны при ru-локали и переходах по public-маршрутам", () => {
  const originalLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, "languages");

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = "";
    setBrowserLanguages("en-US", ["en-US", "en"]);
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
    seedHeadFromIndexHtml();
  });

  afterEach(() => {
    cleanup();
    if (originalLanguage) Object.defineProperty(window.navigator, "language", originalLanguage);
    if (originalLanguages) Object.defineProperty(window.navigator, "languages", originalLanguages);
    document
      .querySelectorAll('meta[name="robots"], meta[name="referrer"]')
      .forEach((el) => el.remove());
  });

  it("При ru-локали robots и referrer присутствуют ровно по одному с корректными content", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    const robots = robotsTags();
    expect(robots.length, "ожидался ровно 1 <meta name=\"robots\">").toBe(1);
    expect(robots[0].getAttribute("content")).toBe(EXPECTED_ROBOTS);

    const referrer = referrerTags();
    expect(referrer.length, "ожидался ровно 1 <meta name=\"referrer\">").toBe(1);
    expect(referrer[0].getAttribute("content")).toBe(EXPECTED_REFERRER);
  });

  it("На каждом public-маршруте robots/referrer не сбрасываются, не дублируются и не пересоздаются", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    act(() => api.setLang("ru"));

    const initialRobots = robotsTags()[0];
    const initialReferrer = referrerTags()[0];

    for (const path of PUBLIC_ROUTES) {
      act(() => api.navigateTo(path));

      expect(localStorage.getItem(STORAGE_KEY), `storage сбросился на ${path}`).toBe("ru");

      const robots = robotsTags();
      expect(robots.length, `на ${path} robots-теги дублируются (${robots.length})`).toBe(1);
      expect(robots[0].getAttribute("content"), `robots content изменился на ${path}`).toBe(
        EXPECTED_ROBOTS,
      );
      expect(robots[0], `robots-узел был пересоздан на ${path}`).toBe(initialRobots);

      const referrer = referrerTags();
      expect(referrer.length, `на ${path} referrer-теги дублируются (${referrer.length})`).toBe(1);
      expect(referrer[0].getAttribute("content"), `referrer content изменился на ${path}`).toBe(
        EXPECTED_REFERRER,
      );
      expect(referrer[0], `referrer-узел был пересоздан на ${path}`).toBe(initialReferrer);
    }
  });

  it("Переключение языков en ↔ ru ↔ es не меняет robots/referrer", () => {
    let api!: Api;
    renderApp((a) => (api = a), "/");

    const initialRobots = robotsTags()[0];
    const initialReferrer = referrerTags()[0];

    for (const lang of ["ru", "en", "es", "ru"] as Language[]) {
      act(() => api.setLang(lang));

      const robots = robotsTags();
      expect(robots.length, `после setLang(${lang}) robots-теги дублируются`).toBe(1);
      expect(robots[0]).toBe(initialRobots);
      expect(robots[0].getAttribute("content")).toBe(EXPECTED_ROBOTS);

      const referrer = referrerTags();
      expect(referrer.length, `после setLang(${lang}) referrer-теги дублируются`).toBe(1);
      expect(referrer[0]).toBe(initialReferrer);
      expect(referrer[0].getAttribute("content")).toBe(EXPECTED_REFERRER);
    }
  });

  it("Прямой вход на public-маршрут с ru-локалью даёт корректные robots/referrer", () => {
    localStorage.setItem(STORAGE_KEY, "ru");

    let api!: Api;
    renderApp((a) => (api = a), "/about");

    expect(robotsTags().length).toBe(1);
    expect(robotsTags()[0].getAttribute("content")).toBe(EXPECTED_ROBOTS);
    expect(referrerTags().length).toBe(1);
    expect(referrerTags()[0].getAttribute("content")).toBe(EXPECTED_REFERRER);

    act(() => api.navigateTo("/contact"));
    expect(robotsTags().length).toBe(1);
    expect(robotsTags()[0].getAttribute("content")).toBe(EXPECTED_ROBOTS);
    expect(referrerTags().length).toBe(1);
    expect(referrerTags()[0].getAttribute("content")).toBe(EXPECTED_REFERRER);
  });
});
