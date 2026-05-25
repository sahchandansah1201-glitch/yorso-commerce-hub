/**
 * E2E · /offers/:id · mobile accessibility and scanability.
 *
 * Guards the buyer decision detail route against small mobile targets and
 * unnamed gallery controls while preserving access gating and CTA semantics.
 */
import { expect, test, type Page } from "@playwright/test";

const OFFER_PATH = "/offers/00000000-0000-0000-0000-000000000001";
const PRODUCT_NAME = "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade";

const installAnonymousStorage = async (page: Page) => {
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

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  );
  expect(overflow).toBe(0);
};

const expectNoNestedControls = async (page: Page) => {
  await expect(page.locator("a button, button a, a a, button button")).toHaveCount(0);
};

const expectNoUnnamedVisibleButtons = async (page: Page) => {
  const unnamed = await page.evaluate(() => {
    const isVisible = (element: Element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) !== 0 &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const nameOf = (element: Element) => {
      const imgAlt = Array.from(element.querySelectorAll("img"))
        .map((img) => img.getAttribute("alt") ?? "")
        .join(" ");
      return (
        element.getAttribute("aria-label") ??
        element.getAttribute("title") ??
        element.textContent ??
        imgAlt
      )
        .replace(/\s+/g, " ")
        .trim();
    };

    return Array.from(document.querySelectorAll("button"))
      .filter(isVisible)
      .filter((element) => !nameOf(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          className: String(element.className).slice(0, 120),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });
  });

  expect(unnamed).toEqual([]);
};

const expectMarkedTargetsAreMobileSafe = async (page: Page) => {
  const targets = page.locator("[data-offer-detail-mobile-target]");
  const count = await targets.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const target = targets.nth(i);
    await expect(target).toBeVisible();
    const box = await target.boundingBox();
    expect(box, `offer-detail target ${i} should have a bounding box`).not.toBeNull();
    expect(Math.round(box?.width ?? 0), `offer-detail target ${i} width`).toBeGreaterThanOrEqual(44);
    expect(Math.round(box?.height ?? 0), `offer-detail target ${i} height`).toBeGreaterThanOrEqual(44);
  }
};

test.describe("/offers/:id · mobile accessibility and scanability", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("offer detail exposes named gallery controls and mobile-safe buyer decision targets", async ({ page }) => {
    await installAnonymousStorage(page);
    await page.goto(OFFER_PATH, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole("button", { name: "Previous offer photo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next offer photo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open offer photo gallery" })).toBeVisible();
    await expect(page.getByRole("button", { name: "View offer photo 1 of 3" })).toBeVisible();
    await expect(page.getByRole("button", { name: "View offer photo 2 of 3" })).toBeVisible();
    await expect(page.getByRole("button", { name: "View offer photo 3 of 3" })).toBeVisible();

    await expectMarkedTargetsAreMobileSafe(page);
    await expectNoUnnamedVisibleButtons(page);
    await expectNoNestedControls(page);
    await expectNoHorizontalOverflow(page);
  });

  test("offer detail lightbox keeps the close action named after opening the gallery", async ({ page }) => {
    await installAnonymousStorage(page);
    await page.goto(OFFER_PATH, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: PRODUCT_NAME })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Open offer photo gallery" }).click();
    await expect(page.getByRole("button", { name: "Close offer photo gallery" })).toBeVisible();
    await expectNoUnnamedVisibleButtons(page);
    await expectNoNestedControls(page);
    await expectNoHorizontalOverflow(page);
  });
});
