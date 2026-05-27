/**
 * E2E · public info/legal route SEO.
 *
 * Contract:
 * - info/legal trust pages own title, description and canonical URL;
 * - route-owned SEO remains localized on direct RU entry;
 * - shared info pages keep mobile overflow and CTA semantics safeguards.
 */
import { expect, test, type Page } from "@playwright/test";

const infoRoutes = [
  {
    path: "/about",
    heading: "About YORSO",
    title: "About YORSO | YORSO",
    description: "YORSO is the global B2B seafood marketplace",
    jsonLd: "info-page-about",
  },
  {
    path: "/contact",
    heading: "Contact Us",
    title: "Contact Us | YORSO",
    description: "Whether you're a buyer looking for sourcing support",
    jsonLd: "info-page-contact",
  },
  {
    path: "/terms",
    heading: "Terms of Service",
    title: "Terms of Service | YORSO",
    description: "govern your access to and use of the YORSO platform",
    jsonLd: "info-page-terms",
  },
  {
    path: "/privacy",
    heading: "Privacy Policy",
    title: "Privacy Policy | YORSO",
    description: "respects your privacy and is committed to protecting your personal data",
    jsonLd: "info-page-privacy",
  },
  {
    path: "/cookies",
    heading: "Cookie Policy",
    title: "Cookie Policy | YORSO",
    description: "YORSO uses cookies and similar technologies",
    jsonLd: "info-page-cookies",
  },
  {
    path: "/gdpr",
    heading: "GDPR Compliance",
    title: "GDPR Compliance | YORSO",
    description: "committed to compliance with the General Data Protection Regulation",
    jsonLd: "info-page-gdpr",
  },
  {
    path: "/anti-fraud",
    heading: "Anti-Fraud Policy",
    title: "Anti-Fraud Policy | YORSO",
    description: "protect both buyers and suppliers from fraudulent activity",
    jsonLd: "info-page-anti-fraud",
  },
  {
    path: "/careers",
    heading: "Careers at YORSO",
    title: "Careers at YORSO | YORSO",
    description: "building the future of B2B seafood trade",
    jsonLd: "info-page-careers",
  },
  {
    path: "/press",
    heading: "Press & Media",
    title: "Press & Media | YORSO",
    description: "media inquiries, interview requests, or press materials",
    jsonLd: "info-page-press",
  },
  {
    path: "/partners",
    heading: "Partner Program",
    title: "Partner Program | YORSO",
    description: "YORSO partners with industry organizations",
    jsonLd: "info-page-partners",
  },
] as const;

const installLocale = async (page: Page, locale: "en" | "ru") => {
  await page.addInitScript((nextLocale) => {
    window.localStorage.setItem("yorso-lang", nextLocale);
    window.sessionStorage.clear();
  }, locale);
};

const expectNoNestedControls = async (page: Page) => {
  await expect
    .poll(async () => page.evaluate(() => document.querySelectorAll("a button, button a, a a, button button").length))
    .toBe(0);
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
  );
  expect(overflow).toBe(0);
};

test.describe("public info/legal routes · route-owned SEO", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await installLocale(page, "en");
  });

  for (const route of infoRoutes) {
    test(`${route.path} owns localized SEO and mobile-safe semantics`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });

      await expect(page.getByRole("heading", { name: route.heading, level: 1 })).toBeVisible();
      await expect(page).toHaveTitle(route.title);
      await expect(page.locator('meta[name="x-route-seo"]')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${route.path.replace("/", "\\/")}$`),
      );
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", new RegExp(route.description));
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", route.title);
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", route.title);
      await expect(page.locator(`script[data-jsonld="${route.jsonLd}"]`)).toHaveCount(1);

      await expect(page.getByRole("link", { name: /Back to homepage/i })).toHaveAttribute("href", "/");
      await expectNoNestedControls(page);
      await expectNoHorizontalOverflow(page);
    });
  }

  test("RU direct entry keeps info route SEO localized instead of falling back to global metadata", async ({ page }) => {
    await installLocale(page, "ru");
    await page.goto("/anti-fraud", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Политика противодействия мошенничеству", level: 1 })).toBeVisible();
    await expect(page).toHaveTitle("Политика противодействия мошенничеству | YORSO");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /защиты как покупателей, так и поставщиков/i,
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "ru_RU");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/anti-fraud$/);
    await expect
      .poll(() =>
        page
          .locator('script[data-jsonld="info-page-anti-fraud"]')
          .evaluate((node) => node.textContent ?? ""),
      )
      .toContain('"inLanguage":"ru"');

    await expectNoNestedControls(page);
    await expectNoHorizontalOverflow(page);
  });
});
