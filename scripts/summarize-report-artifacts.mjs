#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { REPORTS, expectedScreenshotsFor, reportNames } from "./lib/report-artifact-config.mjs";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    roots: {},
    output: null,
    runUrl: process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === "--output") {
      options.output = next;
      index += 1;
    } else if (arg === "--run-url") {
      options.runUrl = next;
      index += 1;
    } else if (arg === "--company-root") {
      options.roots["account-company-save-flow"] = next;
      index += 1;
    } else if (arg === "--products-root") {
      options.roots["account-products-save-flow"] = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
};

const readJson = (filePath) => JSON.parse(readFileSync(filePath, "utf8"));

const summarizeReport = (reportName, root) => {
  const report = REPORTS[reportName];
  const reportJsonPath = path.join(root, "report.json");
  const playwrightJsonPath = path.join(root, "playwright-report.json");
  const result = {
    reportName,
    artifactName: report.artifactName,
    title: report.title,
    root,
    exists: existsSync(reportJsonPath),
    passed: 0,
    failed: 0,
    stepCount: 0,
    screenshotCount: 0,
    expectedScreenshotCount: expectedScreenshotsFor(report).length,
    steps: [],
    playwrightStatus: "missing",
  };

  if (!result.exists) return result;

  const reportJson = readJson(reportJsonPath);
  result.passed = reportJson.passed ?? 0;
  result.failed = reportJson.failed ?? 0;
  result.steps = Array.isArray(reportJson.steps) ? reportJson.steps : [];
  result.stepCount = result.steps.length;
  result.screenshotCount = result.steps.filter((step) => step.screenshot).length;

  if (existsSync(playwrightJsonPath)) {
    const playwrightJson = readJson(playwrightJsonPath);
    const asText = JSON.stringify(playwrightJson);
    result.playwrightStatus =
      /"status":"failed"|"status":"timedOut"/.test(asText) ? "failed" : "passed";
  }

  return result;
};

const renderSummary = (summaries, runUrl) => {
  const rows = summaries.map((summary) =>
    [
      summary.title,
      summary.failed === 0 && summary.playwrightStatus === "passed" ? "passed" : "check",
      `${summary.passed}/${summary.stepCount}`,
      `${summary.screenshotCount}/${summary.expectedScreenshotCount}`,
      `\`${summary.artifactName}\``,
    ].join(" | "),
  );

  const details = summaries.flatMap((summary) => [
    "",
    `### ${summary.title}`,
    "",
    `Artifact: \`${summary.artifactName}\``,
    `Root checked: \`${summary.root}\``,
    `Playwright JSON: ${summary.playwrightStatus}`,
    "",
    ...summary.steps.map((step, index) => {
      const screenshot = step.screenshot ? `, screenshot: \`${step.screenshot}\`` : "";
      return `${index + 1}. ${step.status} - ${step.name}${screenshot}`;
    }),
  ]);

  return [
    "## Account report artifacts",
    "",
    runUrl ? `Run: [GitHub Actions](${runUrl})` : "Run: local",
    "",
    "Report | Result | Steps | Screenshots | Artifact",
    "--- | --- | --- | --- | ---",
    ...rows,
    ...details,
    "",
  ].join("\n");
};

try {
  const options = parseArgs();
  const summaries = reportNames.map((reportName) =>
    summarizeReport(
      reportName,
      options.roots[reportName] ?? path.join("test-results", reportName),
    ),
  );
  const markdown = renderSummary(summaries, options.runUrl);

  if (options.output) {
    writeFileSync(options.output, markdown);
  } else {
    process.stdout.write(markdown);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
