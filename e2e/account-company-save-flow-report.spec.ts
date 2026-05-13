import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { installBuyerSession } from "./helpers/buyer-session";

const ARTIFACT_DIR = path.join(process.cwd(), "test-results", "account-company-save-flow");

interface ReportStep {
  name: string;
  status: "passed" | "failed";
  detail: string;
  screenshot?: string;
}

const recordStep = (steps: ReportStep[], step: ReportStep) => {
  steps.push(step);
};

const saveScreenshot = async (
  page: Page,
  testInfo: TestInfo,
  steps: ReportStep[],
  name: string,
) => {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const fileName = `${String(steps.length + 1).padStart(2, "0")}-${name}.png`;
  const filePath = path.join(ARTIFACT_DIR, fileName);
  const body = await page.screenshot({ fullPage: true });
  await writeFile(filePath, body);
  await testInfo.attach(fileName, {
    body,
    contentType: "image/png",
  });
  return fileName;
};

const writeReport = async (testInfo: TestInfo, steps: ReportStep[]) => {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const now = new Date().toISOString();
  const passed = steps.filter((step) => step.status === "passed").length;
  const failed = steps.filter((step) => step.status === "failed").length;
  const markdown = [
    "# Account company save-flow report",
    "",
    `Generated: ${now}`,
    `Result: ${failed === 0 ? "passed" : "failed"}`,
    `Steps: ${passed} passed, ${failed} failed`,
    "",
    "## Steps",
    "",
    ...steps.map((step, index) => {
      const screenshot = step.screenshot ? ` Screenshot: \`${step.screenshot}\`.` : "";
      return `${index + 1}. ${step.status.toUpperCase()} - ${step.name}: ${step.detail}.${screenshot}`;
    }),
    "",
  ].join("\n");

  const json = JSON.stringify({ generatedAt: now, passed, failed, steps }, null, 2);
  const markdownPath = path.join(ARTIFACT_DIR, "report.md");
  const jsonPath = path.join(ARTIFACT_DIR, "report.json");

  await writeFile(markdownPath, markdown);
  await writeFile(jsonPath, json);

  await testInfo.attach("account-company-save-flow-report.md", {
    path: markdownPath,
    contentType: "text/markdown",
  });
  await testInfo.attach("account-company-save-flow-report.json", {
    path: jsonPath,
    contentType: "application/json",
  });
};

test.describe("/account/company · save-flow report artifacts", () => {
  test("generates screenshots and a machine-readable report", async ({ page }, testInfo) => {
    const steps: ReportStep[] = [];

    await installBuyerSession(page, {
      id: "b_e2e_account_company_report",
    });

    await page.goto("/account/company", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("account-section-company")).toBeVisible();
    recordStep(steps, {
      name: "signed-in company profile opened",
      status: "passed",
      detail: "deterministic buyer session opens /account/company without manual auth",
      screenshot: await saveScreenshot(page, testInfo, steps, "company-profile-loaded"),
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
    recordStep(steps, {
      name: "invalid contacts blocked",
      status: "passed",
      detail: "invalid email, phone and WhatsApp keep the card in edit mode",
      screenshot: await saveScreenshot(page, testInfo, steps, "contacts-validation-error"),
    });

    await contacts.getByTestId("account-company-contact-email").fill("sales@blueharbor.example");
    await contacts.getByTestId("account-company-contact-phone").fill("+47900111222");
    await contacts.getByTestId("account-company-whatsapp").fill("+47900333444");
    await contacts.getByTestId("account-card-company-contacts-save").click();

    await expect(contacts).toHaveAttribute("data-editing", "false", { timeout: 15_000 });
    await expect(contacts).toContainText("sales@blueharbor.example");
    await expect(contacts).toContainText("+47900111222");
    await expect(contacts).toContainText("+47900333444");
    recordStep(steps, {
      name: "valid contacts saved",
      status: "passed",
      detail: "email, phone and WhatsApp persist in the visible company card",
      screenshot: await saveScreenshot(page, testInfo, steps, "contacts-saved"),
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const reloadedContacts = page.getByTestId("account-card-company-contacts");
    await expect(reloadedContacts).toContainText("sales@blueharbor.example");
    await expect(reloadedContacts).toContainText("+47900111222");
    await expect(reloadedContacts).toContainText("+47900333444");
    recordStep(steps, {
      name: "saved contacts survived reload",
      status: "passed",
      detail: "local account profile storage still contains saved commercial contacts after reload",
      screenshot: await saveScreenshot(page, testInfo, steps, "contacts-after-reload"),
    });

    await writeReport(testInfo, steps);
  });
});
