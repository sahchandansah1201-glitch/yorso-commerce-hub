/**
 * E2E · public offer locale/a11y labels.
 *
 * Guards English public catalog and offer-detail routes against hardcoded
 * Russian visible/programmatic labels in buyer decision controls.
 */
import { expect, test, type Page } from "@playwright/test";

const OFFER_PATH = "/offers/00000000-0000-0000-0000-000000000001";
const PRODUCT_NAME = "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade";

const installEnglishAnonymousSession = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("yorso-lang", "en");
      window.sessionStorage.removeItem("yorso_buyer_session");
      window.sessionStorage.removeItem("yorso_buyer_qualification");
      window.sessionStorage.removeItem("yorso_buyer_qualified");
    } catch {
      /* ignore */
    }
  });
};

const expectNoRussianAriaLabels = async (page: Page) => {
  const russianAriaLabels = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[aria-label]"))
      .map((el) => el.getAttribute("aria-label") ?? "")
      .filter((label) => /[А-Яа-яЁё]/.test(label)),
  );
  expect(russianAriaLabels).toEqual([]);
};

const expectNoKnownRussianOfferCopy = async (page: Page) => {
  for (const text of [
    "Открыть карточку",
    "Базис поставки",
    "Уровень запасов",
    "Сертификаты соответствия",
    "Мин. партия",
    "Цена и поставщик",
    "Без обрезки",
  ]) {
    await expect(page.locator(`text=${text}`)).toHaveCount(0);
  }
};

test.describe("public offer routes · English locale a11y labels", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("catalog mobile card exposes English offer and delivery-basis names", async ({ page }) => {
    await installEnglishAnonymousSession(page);
    await page.goto("/offers", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("catalog-result-count")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("catalog-row-view-details").first()).toHaveAttribute(
      "aria-label",
      `Open offer details: ${PRODUCT_NAME}`,
    );
    await expect(page.getByTestId("catalog-row-basis").first()).toHaveAttribute(
      "aria-label",
      /Delivery basis .+, .+, lead time .+/,
    );

    await expectNoRussianAriaLabels(page);
    await expectNoKnownRussianOfferCopy(page);
  });

  test("offer detail summary exposes English inventory and commercial labels", async ({ page }) => {
    await installEnglishAnonymousSession(page);
    await page.goto(OFFER_PATH, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Inventory level")).toBeVisible();
    await expect(page.getByLabel("Inventory level: medium volume")).toBeVisible();
    await expect(page.getByText("Compliance certifications")).toBeVisible();
    await expect(page.getByText("Delivery basis", { exact: true })).toBeVisible();
    await expect(page.getByText("Price and supplier — after sign-up")).toBeVisible();

    await expectNoRussianAriaLabels(page);
    await expectNoKnownRussianOfferCopy(page);
  });
});
