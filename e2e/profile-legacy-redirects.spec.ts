/**
 * E2E · legacy /profile/* redirects.
 *
 * Existing YORSO cabinet links must keep working after the new /account
 * workspace is introduced. These checks catch regressions where legacy
 * profile routes fall back to 404 or point to the wrong account section.
 */
import { expect, test, type Page } from "@playwright/test";

const setSignedInStorage = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("yorso-lang", "en");
      window.sessionStorage.setItem(
        "yorso_buyer_session",
        JSON.stringify({
          id: "b_e2e_profile_redirect",
          identifier: "buyer@example.com",
          method: "email",
          signedInAt: new Date().toISOString(),
          displayName: "buyer",
        }),
      );
    } catch {
      /* ignore */
    }
  });
};

const CASES = [
  ["/profile", "/account/personal"],
  ["/profile/personal", "/account/personal"],
  ["/profile/company", "/account/company"],
  ["/profile/company-addresses", "/account/branches"],
  ["/profile/classify", "/account/products"],
  ["/profile/meta-regions", "/account/meta-regions"],
  ["/profile/company-spam", "/account/notifications"],
] as const;

test.describe("legacy profile redirects", () => {
  for (const [from, to] of CASES) {
    test(`${from} redirects to ${to}`, async ({ page }) => {
      await setSignedInStorage(page);
      await page.goto(from, { waitUntil: "domcontentloaded" });

      await expect(page).toHaveURL(new RegExp(`${to.replace("/", "\\/")}$`));
      await expect(page.getByTestId("account-content")).toBeVisible();
      await expect(page.locator("body")).not.toContainText(/404|Page not found/i);
    });
  }
});
