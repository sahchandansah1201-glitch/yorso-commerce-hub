import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Page, TestInfo } from "@playwright/test";

export interface ReportStep {
  name: string;
  status: "passed" | "failed";
  detail: string;
  screenshot?: string;
}

interface ReportRecorderOptions {
  artifactSubdir: string;
  attachmentPrefix: string;
  title: string;
}

interface StepOptions {
  name: string;
  detail: string;
  page?: Page;
  screenshotName?: string;
  status?: ReportStep["status"];
  testInfo: TestInfo;
}

export const createReportRecorder = ({
  artifactSubdir,
  attachmentPrefix,
  title,
}: ReportRecorderOptions) => {
  const artifactDir = path.join(process.cwd(), "test-results", artifactSubdir);
  const steps: ReportStep[] = [];

  const saveScreenshot = async (page: Page, testInfo: TestInfo, name: string) => {
    await mkdir(artifactDir, { recursive: true });
    const fileName = `${String(steps.length + 1).padStart(2, "0")}-${name}.png`;
    const filePath = path.join(artifactDir, fileName);
    const body = await page.screenshot({ fullPage: true });
    await writeFile(filePath, body);
    await testInfo.attach(fileName, {
      body,
      contentType: "image/png",
    });
    return fileName;
  };

  const recordStep = async ({
    name,
    detail,
    page,
    screenshotName,
    status = "passed",
    testInfo,
  }: StepOptions) => {
    const screenshot =
      page && screenshotName ? await saveScreenshot(page, testInfo, screenshotName) : undefined;
    steps.push({ name, status, detail, screenshot });
  };

  const writeReport = async (testInfo: TestInfo) => {
    await mkdir(artifactDir, { recursive: true });
    const now = new Date().toISOString();
    const passed = steps.filter((step) => step.status === "passed").length;
    const failed = steps.filter((step) => step.status === "failed").length;
    const markdown = [
      `# ${title}`,
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
    const markdownPath = path.join(artifactDir, "report.md");
    const jsonPath = path.join(artifactDir, "report.json");

    await writeFile(markdownPath, markdown);
    await writeFile(jsonPath, json);

    await testInfo.attach(`${attachmentPrefix}.md`, {
      path: markdownPath,
      contentType: "text/markdown",
    });
    await testInfo.attach(`${attachmentPrefix}.json`, {
      path: jsonPath,
      contentType: "application/json",
    });
  };

  return {
    artifactDir,
    recordStep,
    steps,
    writeReport,
  };
};
