import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { REPORTS, expectedScreenshotsFor, reportNames } from "./report-artifact-config.mjs";

const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const REPORT_SCHEMA_VERSION = 1;

export const defaultReportRoot = (reportName) => path.join("test-results", reportName);

export const readJsonFile = (filePath) => JSON.parse(readFileSync(filePath, "utf8"));

export const hasPngSignature = (filePath) => {
  const bytes = readFileSync(filePath).subarray(0, 8);
  return pngSignature.every((value, index) => bytes[index] === value);
};

export const sha256File = (filePath) => createHash("sha256").update(readFileSync(filePath)).digest("hex");

export const expectedFilesFor = (report) => [
  "report.md",
  "report.json",
  "playwright-report.json",
  ...expectedScreenshotsFor(report),
];

const parsePlaywrightStatus = (playwrightJsonPath, failures) => {
  if (!existsSync(playwrightJsonPath)) return "missing";

  try {
    const parsed = readJsonFile(playwrightJsonPath);
    const suites = Array.isArray(parsed.suites) ? parsed.suites : [];
    if (suites.length === 0) failures.push("playwright-report.json has no suites");
    const text = JSON.stringify(parsed);
    if (/"status":"failed"/.test(text) || /"status":"timedOut"/.test(text)) {
      failures.push("playwright-report.json contains failed or timedOut status");
      return "failed";
    }
    return "passed";
  } catch (error) {
    failures.push(`playwright-report.json is not valid JSON: ${error.message}`);
    return "invalid";
  }
};

export const validateReportArtifact = (reportName, root = defaultReportRoot(reportName)) => {
  const report = REPORTS[reportName];
  if (!report) {
    throw new Error(`Unknown report "${reportName}". Expected one of: ${reportNames.join(", ")}`);
  }

  const failures = [];
  const expectedScreenshots = expectedScreenshotsFor(report);
  const requiredFiles = expectedFilesFor(report);
  const fileChecks = [];

  const requireFile = (fileName) => {
    const filePath = path.join(root, fileName);
    const check = {
      fileName,
      filePath,
      exists: existsSync(filePath),
      isFile: false,
      size: 0,
      pngSignature: fileName.endsWith(".png") ? false : null,
    };

    if (!check.exists) {
      failures.push(`missing ${filePath}`);
      fileChecks.push(check);
      return null;
    }

    const stat = statSync(filePath);
    check.isFile = stat.isFile();
    check.size = stat.size;
    if (!check.isFile || check.size === 0) {
      failures.push(`empty or invalid file ${filePath}`);
      fileChecks.push(check);
      return null;
    }

    if (fileName.endsWith(".png")) {
      check.pngSignature = hasPngSignature(filePath);
      if (!check.pngSignature) failures.push(`invalid PNG signature ${filePath}`);
    }

    fileChecks.push(check);
    return filePath;
  };

  for (const fileName of requiredFiles) {
    requireFile(fileName);
  }

  const reportJsonPath = path.join(root, "report.json");
  const expectedStepCount = report.expectedSteps.length;
  const result = {
    reportName,
    artifactName: report.artifactName,
    title: report.title,
    root,
    passed: false,
    failures,
    fileChecks,
    requiredFiles,
    expectedStepCount,
    expectedScreenshotCount: expectedScreenshots.length,
    reportJson: {
      exists: existsSync(reportJsonPath),
      passed: 0,
      failed: 0,
      stepCount: 0,
      schemaVersion: null,
      generatedAt: null,
      title: null,
      artifactSubdir: null,
    },
    steps: [],
    screenshotCount: 0,
    playwrightStatus: "missing",
    checksumChecks: [],
  };

  if (result.reportJson.exists) {
    try {
      const parsed = readJsonFile(reportJsonPath);
      const steps = Array.isArray(parsed.steps) ? parsed.steps : [];
      result.reportJson.schemaVersion = parsed.schemaVersion ?? null;
      result.reportJson.generatedAt = parsed.generatedAt ?? null;
      result.reportJson.title = parsed.title ?? null;
      result.reportJson.artifactSubdir = parsed.artifactSubdir ?? null;
      result.reportJson.passed = parsed.passed ?? 0;
      result.reportJson.failed = parsed.failed ?? 0;
      result.reportJson.stepCount = steps.length;
      result.steps = steps;
      result.screenshotCount = steps.filter((step) => step.screenshot).length;

      if (parsed.schemaVersion !== REPORT_SCHEMA_VERSION) {
        failures.push(
          `report.json schemaVersion is ${parsed.schemaVersion ?? "missing"}, expected ${REPORT_SCHEMA_VERSION}`,
        );
      }
      if (parsed.title !== report.title) {
        failures.push(`report.json title is "${parsed.title}", expected "${report.title}"`);
      }
      if (parsed.artifactSubdir !== reportName) {
        failures.push(
          `report.json artifactSubdir is "${parsed.artifactSubdir}", expected "${reportName}"`,
        );
      }
      if (typeof parsed.generatedAt !== "string" || Number.isNaN(Date.parse(parsed.generatedAt))) {
        failures.push("report.json generatedAt is missing or not an ISO timestamp");
      }
      if (parsed.failed !== 0) failures.push(`report.json failed count is ${parsed.failed}`);
      if (parsed.passed !== expectedStepCount) {
        failures.push(`report.json passed count is ${parsed.passed}, expected ${expectedStepCount}`);
      }
      if (steps.length !== expectedStepCount) {
        failures.push(`report.json steps length mismatch, expected ${expectedStepCount}`);
      }

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
        const screenshotPath = actual.screenshot ? path.join(root, actual.screenshot) : null;
        if (!screenshotPath || !existsSync(screenshotPath)) {
          failures.push(`step ${index + 1} screenshot file is missing`);
          continue;
        }
        const screenshotStat = statSync(screenshotPath);
        const actualSha256 = sha256File(screenshotPath);
        result.checksumChecks.push({
          step: index + 1,
          fileName: actual.screenshot,
          expectedBytes: actual.screenshotBytes ?? null,
          actualBytes: screenshotStat.size,
          expectedSha256: actual.screenshotSha256 ?? null,
          actualSha256,
          passed:
            actual.screenshotBytes === screenshotStat.size &&
            actual.screenshotSha256 === actualSha256,
        });
        if (actual.screenshotBytes !== screenshotStat.size) {
          failures.push(
            `step ${index + 1} screenshotBytes is ${actual.screenshotBytes}, expected ${screenshotStat.size}`,
          );
        }
        if (actual.screenshotSha256 !== actualSha256) {
          failures.push(`step ${index + 1} screenshotSha256 does not match ${actual.screenshot}`);
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

  result.playwrightStatus = parsePlaywrightStatus(
    path.join(root, "playwright-report.json"),
    failures,
  );
  result.passed = failures.length === 0;

  return result;
};

export const validateReportSuite = (roots = {}) =>
  reportNames.map((reportName) =>
    validateReportArtifact(reportName, roots[reportName] ?? defaultReportRoot(reportName)),
  );

export const formatValidationResult = (result) => [
  `${result.passed ? "passed" : "failed"} ${result.reportName}`,
  `root=${result.root}`,
  `schema=v${result.reportJson.schemaVersion ?? "?"}`,
  `files=${result.fileChecks.filter((file) => file.exists && file.isFile && file.size > 0).length}/${result.requiredFiles.length}`,
  `steps=${result.reportJson.passed}/${result.expectedStepCount}`,
  `screenshots=${result.screenshotCount}/${result.expectedScreenshotCount}`,
  `checksums=${result.checksumChecks.filter((check) => check.passed).length}/${result.expectedScreenshotCount}`,
  `playwright=${result.playwrightStatus}`,
].join(" ");
