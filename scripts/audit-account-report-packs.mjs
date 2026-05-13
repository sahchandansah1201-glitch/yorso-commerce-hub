#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { reportNames } from "./lib/report-artifact-config.mjs";
import {
  formatValidationResult,
  validateReportSuite,
} from "./lib/report-artifact-validation.mjs";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    root: "account-report-packs",
    json: false,
    summaryOutput: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === "--root") {
      options.root = next;
      index += 1;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--summary-output") {
      options.summaryOutput = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
};

const renderMarkdown = (results, root) => [
  "# Account Report Pack Audit",
  "",
  `Root: \`${root}\``,
  "",
  "Report | Result | Schema | Files | Steps | Screenshots | Checksums | Playwright",
  "--- | --- | --- | --- | --- | --- | --- | ---",
  ...results.map((result) =>
    [
      result.title,
      result.passed ? "passed" : "failed",
      `v${result.reportJson.schemaVersion ?? "?"}`,
      `${result.fileChecks.filter((file) => file.exists && file.isFile && file.size > 0).length}/${result.requiredFiles.length}`,
      `${result.reportJson.passed}/${result.expectedStepCount}`,
      `${result.screenshotCount}/${result.expectedScreenshotCount}`,
      `${result.checksumChecks.filter((check) => check.passed).length}/${result.expectedScreenshotCount}`,
      result.playwrightStatus,
    ].join(" | "),
  ),
  "",
  ...results.flatMap((result) =>
    result.failures.length === 0
      ? []
      : [`## ${result.title}`, "", ...result.failures.map((failure) => `- ${failure}`), ""],
  ),
].join("\n");

try {
  const options = parseArgs();
  if (!existsSync(options.root)) {
    throw new Error(
      `Report pack root not found: ${options.root}. Run npm run smoke:e2e:account-reports first.`,
    );
  }

  const roots = Object.fromEntries(
    reportNames.map((reportName) => [reportName, path.join(options.root, reportName)]),
  );
  const results = validateReportSuite(roots);
  const markdown = renderMarkdown(results, options.root);

  if (options.json) {
    process.stdout.write(`${JSON.stringify({ root: options.root, results }, null, 2)}\n`);
  } else {
    console.log(markdown);
    for (const result of results) console.log(formatValidationResult(result));
  }

  if (options.summaryOutput) writeFileSync(options.summaryOutput, markdown);

  if (results.some((result) => !result.passed)) process.exit(1);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
