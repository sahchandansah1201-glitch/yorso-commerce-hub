import { expect, test, type Page } from "@playwright/test";

type RegistrationSeed = Partial<{
  role: "buyer" | "supplier" | null;
  sessionId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  company: string;
  password: string;
  country: string;
  vatTin: string;
  phone: string;
  phoneVerified: boolean;
  categories: string[];
  certifications: string[];
  countries: string[];
  volume: string;
  onboardingSkipped: boolean;
  countriesSkipped: boolean;
  completed: boolean;
  startedAt: number;
  emailSubmittedAt: number;
}>;

const defaultRegistration = {
  role: null,
  sessionId: "",
  email: "",
  emailVerified: false,
  fullName: "",
  company: "",
  password: "",
  country: "",
  vatTin: "",
  phone: "",
  phoneVerified: false,
  categories: [],
  certifications: [],
  countries: [],
  volume: "",
  onboardingSkipped: false,
  countriesSkipped: false,
  completed: false,
  startedAt: 0,
  emailSubmittedAt: 0,
};

const REGISTRATION_ROUTES: Array<{ path: string; seed?: RegistrationSeed }> = [
  { path: "/register" },
  { path: "/register/email", seed: { role: "buyer", startedAt: Date.now() } },
  {
    path: "/register/verify",
    seed: {
      role: "buyer",
      email: "buyer@example.com",
      sessionId: "session-verify",
      startedAt: Date.now(),
      emailSubmittedAt: Date.now(),
    },
  },
  {
    path: "/register/details",
    seed: {
      role: "buyer",
      email: "buyer@example.com",
      emailVerified: true,
      sessionId: "session-details",
      startedAt: Date.now(),
      emailSubmittedAt: Date.now(),
    },
  },
  {
    path: "/register/onboarding",
    seed: {
      role: "supplier",
      email: "supplier@example.com",
      emailVerified: true,
      sessionId: "session-onboarding",
      fullName: "Test Buyer",
      company: "North Sea Foods",
      startedAt: Date.now(),
      emailSubmittedAt: Date.now(),
    },
  },
  {
    path: "/register/countries",
    seed: {
      role: "buyer",
      email: "buyer@example.com",
      emailVerified: true,
      sessionId: "session-countries",
      fullName: "Test Buyer",
      company: "North Sea Foods",
      startedAt: Date.now(),
      emailSubmittedAt: Date.now(),
    },
  },
  {
    path: "/register/ready",
    seed: {
      role: "buyer",
      email: "buyer@example.com",
      emailVerified: true,
      sessionId: "session-ready",
      fullName: "Test Buyer",
      company: "North Sea Foods",
      country: "Germany",
      categories: ["Salmon"],
      countries: ["Germany"],
      startedAt: Date.now(),
      emailSubmittedAt: Date.now(),
    },
  },
];

const seedRegistration = async (page: Page, seed?: RegistrationSeed) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ defaultRegistration, seed }) => {
      window.localStorage.setItem("yorso-language", "en");
      window.localStorage.removeItem("yorso-buyer-session");
      window.sessionStorage.clear();
      if (seed) {
        window.sessionStorage.setItem(
          "yorso_registration",
          JSON.stringify({ ...defaultRegistration, ...seed }),
        );
      }
    },
    { defaultRegistration, seed },
  );
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
  );
  expect(overflow).toBe(0);
};

const expectNoNestedInteractiveControls = async (page: Page) => {
  await expect
    .poll(async () => page.evaluate(() => document.querySelectorAll("a button, button a, a a, button button").length))
    .toBe(0);
};

const expectRegistrationTargets = async (page: Page) => {
  const targets = page.locator("[data-registration-mobile-target]");
  const count = await targets.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const target = targets.nth(i);
    await expect(target).toBeVisible();
    const box = await target.boundingBox();
    expect(box, `registration target ${i} should have a bounding box`).not.toBeNull();
    expect(Math.round(box?.width ?? 0), `registration target ${i} width`).toBeGreaterThanOrEqual(44);
    expect(Math.round(box?.height ?? 0), `registration target ${i} height`).toBeGreaterThanOrEqual(44);
  }
};

test.describe("public auth and registration accessibility", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sign-in inputs expose browser completion hints", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("yorso-language", "en");
      window.localStorage.removeItem("yorso-buyer-session");
    });
    await page.goto("/signin", { waitUntil: "domcontentloaded" });

    await expect(page.locator("#signin-email")).toHaveAttribute("autocomplete", "email");
    await expect(page.locator("#signin-password")).toHaveAttribute("autocomplete", "current-password");

    await page.getByRole("button", { name: /^phone$/i }).click();
    await expect(page.locator("#signin-phone")).toHaveAttribute("autocomplete", "tel");

    await page.getByRole("button", { name: /email/i }).click();
    await page.getByRole("button", { name: /forgot password/i }).click();
    await expect(page.locator("#signin-forgot-email")).toHaveAttribute("autocomplete", "email");
    await expectNoHorizontalOverflow(page);
  });

  for (const route of REGISTRATION_ROUTES) {
    test(`${route.path} exposes registration shell landmarks and mobile targets`, async ({ page }) => {
      await seedRegistration(page, route.seed);
      await page.goto(route.path, { waitUntil: "domcontentloaded" });

      await expect(page.locator("main#main")).toHaveCount(1);
      await expect(page.locator("main:not(#main)")).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Skip to main content" })).toHaveCount(1);
      await expectRegistrationTargets(page);
      await expectNoNestedInteractiveControls(page);
      await expectNoHorizontalOverflow(page);
    });
  }

  test("registration skip link moves focus to main", async ({ page }) => {
    await seedRegistration(page);
    await page.goto("/register", { waitUntil: "domcontentloaded" });

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await skipLink.focus();
    await page.keyboard.press("Enter");

    await expect(page.locator("main#main")).toBeFocused();
    await expect(page).toHaveURL(/#main$/);
  });

  test("registration forms expose names and completion hints", async ({ page }) => {
    await seedRegistration(page, { role: "buyer", startedAt: Date.now() });
    await page.goto("/register/email", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Email")).toHaveAttribute("autocomplete", "email");

    await seedRegistration(page, {
      role: "buyer",
      email: "buyer@example.com",
      sessionId: "session-verify",
      startedAt: Date.now(),
      emailSubmittedAt: Date.now(),
    });
    await page.goto("/register/verify", { waitUntil: "domcontentloaded" });
    for (let i = 1; i <= 6; i += 1) {
      await expect(page.getByLabel(`SMS code ${i}`)).toHaveAttribute("autocomplete", "one-time-code");
    }

    await seedRegistration(page, {
      role: "buyer",
      email: "buyer@example.com",
      emailVerified: true,
      sessionId: "session-details",
      startedAt: Date.now(),
      emailSubmittedAt: Date.now(),
    });
    await page.goto("/register/details", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Full name")).toHaveAttribute("autocomplete", "name");
    await expect(page.getByLabel("Company name")).toHaveAttribute("autocomplete", "organization");
    await expect(page.locator("#register-country")).toHaveAttribute("autocomplete", "country-name");
    await expect(page.getByLabel("VAT / TIN number")).toHaveAttribute("autocomplete", "off");
    await expect(page.getByLabel("Phone number")).toHaveAttribute("autocomplete", "tel");
    await expect(page.getByLabel("Password")).toHaveAttribute("autocomplete", "new-password");
  });
});
