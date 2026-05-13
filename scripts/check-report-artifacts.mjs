#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const REPORTS = {
  "account-company-save-flow": {
    title: "Account company save-flow report",
    expectedScreenshots: [
      "01-company-profile-loaded.png",
      "02-contacts-validation-error.png",
      "03-contacts-saved.png",
      "04-contacts-after-reload.png",
    ],
  },
  "account-products-save-flow": {
    title: "Account products matrix save-flow report",
    expectedScreenshots: [
      "01-products-matrix-loaded.png",
      "02-product-validation-error.png",
      "03-product-added.png",
      "04-product-duplicate-blocked.png",
      "05-product-pagination-page-two.png",
      "06-product-filter-share-link.png",
      "07-product-detail-edit-saved.png",
      "08-product-delete-after-reload.png",
      "09-product-ru-localized.png",
    ],
  },
};

const usage = () => {
  const names = Object.keys(REPORTS).join(" | ");
  console.error(`Usage: node scripts/check-report-artifacts.mjs <${names}> [artifact-root]`);
};

const reportName = process.argv[2];
if (!reportName || !REPORTS[reportName]) {
  usage();
  process.exit(1);
}

const root = process.argv[3] ?? path.join("test-results", reportName);
const report = REPORTS[reportName];
const requiredFiles = [
  "report.md",
  "report.json",
  "playwright-report.json",
  ...report.expectedScreenshots,
];

const failures = [];
const requireFile = (fileName) => {
  const filePath = path.join(root, fileName);
  if (!existsSync(filePath)) {
    failures.push(`missing ${filePath}`);
    return null;
  }
  const stat = statSync(filePath);
  if (!stat.isFile() || stat.size === 0) {
    failures.push(`empty or invalid file ${filePath}`);
    return null;
  }
  return filePath;
};

for (const fileName of requiredFiles) {
  requireFile(fileName);
}

const reportJsonPath = path.join(root, "report.json");
if (existsSync(reportJsonPath)) {
  try {
    const parsed = JSON.parse(readFileSync(reportJsonPath, "utf8"));
    const expectedStepCount = report.expectedScreenshots.length;
    if (parsed.failed !== 0) failures.push(`report.json failed count is ${parsed.failed}`);
    if (parsed.passed !== expectedStepCount) {
      failures.push(`report.json passed count is ${parsed.passed}, expected ${expectedStepCount}`);
    }
    if (!Array.isArray(parsed.steps) || parsed.steps.length !== expectedStepCount) {
      failures.push(`report.json steps length mismatch, expected ${expectedStepCount}`);
    }
    const screenshotSet = new Set(parsed.steps?.map((step) => step.screenshot).filter(Boolean));
    for (const expectedScreenshot of report.expectedScreenshots) {
      if (!screenshotSet.has(expectedScreenshot)) {
        failures.push(`report.json missing screenshot reference ${expectedScreenshot}`);
      }
    }
  } catch (error) {
    failures.push(`report.json is not valid JSON: ${error.message}`);
  }
}

const reportMarkdownPath = path.join(root, "report.md");
if (existsSync(reportMarkdownPath)) {
  const markdown = readFileSync(reportMarkdownPath, "utf8");
  if (!markdown.includes(`# ${report.title}`)) failures.push("report.md title mismatch");
  if (!markdown.includes("Result: passed")) failures.push("report.md does not show passed result");
}

const playwrightJsonPath = path.join(root, "playwright-report.json");
if (existsSync(playwrightJsonPath)) {
  try {
    const parsed = JSON.parse(readFileSync(playwrightJsonPath, "utf8"));
    const suites = Array.isArray(parsed.suites) ? parsed.suites : [];
    if (suites.length === 0) failures.push("playwright-report.json has no suites");
    const text = JSON.stringify(parsed);
    if (/"status":"failed"/.test(text) || /"status":"timedOut"/.test(text)) {
      failures.push("playwright-report.json contains failed or timedOut status");
    }
  } catch (error) {
    failures.push(`playwright-report.json is not valid JSON: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error(`Report artifact check failed for ${reportName}`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Report artifact check passed for ${reportName}`);
console.log(`Verified ${requiredFiles.length} files in ${root}`);
