#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { reportNames } from "./lib/report-artifact-config.mjs";
import {
  formatValidationResult,
  validateReportSuite,
} from "./lib/report-artifact-validation.mjs";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    roots: {},
    summaryOutput: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === "--company-root") {
      options.roots["account-company-save-flow"] = next;
      index += 1;
    } else if (arg === "--products-root") {
      options.roots["account-products-save-flow"] = next;
      index += 1;
    } else if (arg === "--summary-output") {
      options.summaryOutput = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
};

const renderSuiteSummary = (results) => [
  "## Account report suite verification",
  "",
  "Report | Result | Files | Steps | Screenshots | Playwright",
  "--- | --- | --- | --- | --- | ---",
  ...results.map((result) =>
    [
      result.title,
      result.passed ? "passed" : "failed",
      `${result.fileChecks.filter((file) => file.exists && file.isFile && file.size > 0).length}/${result.requiredFiles.length}`,
      `${result.reportJson.passed}/${result.expectedStepCount}`,
      `${result.screenshotCount}/${result.expectedScreenshotCount}`,
      result.playwrightStatus,
    ].join(" | "),
  ),
  "",
  ...results.flatMap((result) =>
    result.failures.length === 0
      ? []
      : [`### ${result.title}`, "", ...result.failures.map((failure) => `- ${failure}`), ""],
  ),
].join("\n");

try {
  const options = parseArgs();
  const results = validateReportSuite(options.roots);

  for (const result of results) {
    console.log(formatValidationResult(result));
    if (!result.passed) {
      for (const failure of result.failures) console.error(`- ${failure}`);
    }
  }

  if (options.summaryOutput) {
    writeFileSync(options.summaryOutput, renderSuiteSummary(results));
  }

  const missingReports = reportNames.filter(
    (reportName) => !results.some((result) => result.reportName === reportName),
  );
  if (missingReports.length > 0) {
    console.error(`Missing report validation results: ${missingReports.join(", ")}`);
    process.exit(1);
  }

  if (results.some((result) => !result.passed)) process.exit(1);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
