import { expect, test } from "@playwright/test";
import { installBuyerSession } from "./helpers/buyer-session";
import { createReportRecorder } from "./helpers/report-artifacts";

test.describe("/account/company · save-flow report artifacts", () => {
  test("generates screenshots and a machine-readable report", async ({ page }, testInfo) => {
    const report = createReportRecorder({
      artifactSubdir: "account-company-save-flow",
      attachmentPrefix: "account-company-save-flow-report",
      title: "Account company save-flow report",
    });

    await installBuyerSession(page, {
      id: "b_e2e_account_company_report",
    });

    await page.goto("/account/company", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-section-company")).toBeVisible();
    await report.recordStep({
      name: "signed-in company profile opened",
      detail: "deterministic buyer session opens /account/company without manual auth",
      page,
      screenshotName: "company-profile-loaded",
      testInfo,
    });

    const contacts = page.getByTestId("account-card-company-contacts");
    await contacts.getByTestId("account-card-company-contacts-edit").click();
    await contacts.getByTestId("account-company-contact-email").fill("broken");
    await contacts.getByTestId("account-company-contact-phone").fill("123");
    await contacts.getByTestId("account-company-whatsapp").fill("abc");
    await contacts.getByTestId("account-card-company-contacts-save").click();

    await expect(contacts).toHaveAttribute("data-editing", "true");
    await expect(contacts).toHaveAttribute("data-save-state", "error");
    await expect(contacts.locator('[aria-invalid="true"]')).toHaveCount(3);
    await report.recordStep({
      name: "invalid contacts blocked",
      detail: "invalid email, phone and WhatsApp keep the card in edit mode",
      page,
      screenshotName: "contacts-validation-error",
      testInfo,
    });

    await contacts.getByTestId("account-company-contact-email").fill("sales@blueharbor.example");
    await contacts.getByTestId("account-company-contact-phone").fill("+47900111222");
    await contacts.getByTestId("account-company-whatsapp").fill("+47900333444");
    await contacts.getByTestId("account-card-company-contacts-save").click();

    await expect(contacts).toHaveAttribute("data-editing", "false", { timeout: 15_000 });
    await expect(contacts).toContainText("sales@blueharbor.example");
    await expect(contacts).toContainText("+47900111222");
    await expect(contacts).toContainText("+47900333444");
    await report.recordStep({
      name: "valid contacts saved",
      detail: "email, phone and WhatsApp persist in the visible company card",
      page,
      screenshotName: "contacts-saved",
      testInfo,
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const reloadedContacts = page.getByTestId("account-card-company-contacts");
    await expect(reloadedContacts).toContainText("sales@blueharbor.example");
    await expect(reloadedContacts).toContainText("+47900111222");
    await expect(reloadedContacts).toContainText("+47900333444");
    await report.recordStep({
      name: "saved contacts survived reload",
      detail: "local account profile storage still contains saved commercial contacts after reload",
      page,
      screenshotName: "contacts-after-reload",
      testInfo,
    });

    await report.writeReport(testInfo);
  });
});
