#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { REPORTS, expectedScreenshotsFor, reportNames } from "./lib/report-artifact-config.mjs";

const usage = () => {
  const names = reportNames.join(" | ");
  console.error(`Usage: node scripts/check-report-artifacts.mjs <${names}> [artifact-root]`);
};

const reportName = process.argv[2];
if (!reportName || !REPORTS[reportName]) {
  usage();
  process.exit(1);
}

const root = process.argv[3] ?? path.join("test-results", reportName);
const report = REPORTS[reportName];
const expectedScreenshots = expectedScreenshotsFor(report);
const requiredFiles = [
  "report.md",
  "report.json",
  "playwright-report.json",
  ...expectedScreenshots,
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

const hasPngSignature = (filePath) => {
  const bytes = readFileSync(filePath).subarray(0, 8);
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return signature.every((value, index) => bytes[index] === value);
};

for (const fileName of requiredFiles) {
  const filePath = requireFile(fileName);
  if (filePath && fileName.endsWith(".png") && !hasPngSignature(filePath)) {
    failures.push(`invalid PNG signature ${filePath}`);
  }
}

const reportJsonPath = path.join(root, "report.json");
if (existsSync(reportJsonPath)) {
  try {
    const parsed = JSON.parse(readFileSync(reportJsonPath, "utf8"));
    const expectedStepCount = report.expectedSteps.length;
    if (parsed.failed !== 0) failures.push(`report.json failed count is ${parsed.failed}`);
    if (parsed.passed !== expectedStepCount) {
      failures.push(`report.json passed count is ${parsed.passed}, expected ${expectedStepCount}`);
    }
    if (!Array.isArray(parsed.steps) || parsed.steps.length !== expectedStepCount) {
      failures.push(`report.json steps length mismatch, expected ${expectedStepCount}`);
    }
    const steps = Array.isArray(parsed.steps) ? parsed.steps : [];
    const screenshotSet = new Set(steps.map((step) => step.screenshot).filter(Boolean));
    for (const expectedScreenshot of expectedScreenshots) {
      if (!screenshotSet.has(expectedScreenshot)) {
        failures.push(`report.json missing screenshot reference ${expectedScreenshot}`);
      }
    }
    for (const [index, expectedStep] of report.expectedSteps.entries()) {
      const actual = steps[index];
      if (!actual) continue;
      if (actual.status !== "passed") {
        failures.push(`step ${index + 1} status is ${actual.status}, expected passed`);
      }
      if (actual.name !== expectedStep.name) {
        failures.push(
          `step ${index + 1} name is "${actual.name}", expected "${expectedStep.name}"`,
        );
      }
      if (actual.screenshot !== expectedStep.screenshot) {
        failures.push(
          `step ${index + 1} screenshot is "${actual.screenshot}", expected "${expectedStep.screenshot}"`,
        );
      }
      if (typeof actual.detail !== "string" || actual.detail.length < 20) {
        failures.push(`step ${index + 1} detail is missing or too short`);
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
