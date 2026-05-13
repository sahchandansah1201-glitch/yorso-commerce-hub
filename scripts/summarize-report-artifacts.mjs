#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import path from "node:path";
import { reportNames } from "./lib/report-artifact-config.mjs";
import { validateReportArtifact } from "./lib/report-artifact-validation.mjs";

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

const summarizeReport = (reportName, root) => {
  const validation = validateReportArtifact(reportName, root);
  return {
    ...validation,
    failed: validation.reportJson.failed,
    stepCount: validation.reportJson.stepCount,
  };
};

const renderSummary = (summaries, runUrl) => {
  const rows = summaries.map((summary) =>
    [
      summary.title,
      summary.passed ? "passed" : "check",
      `${summary.reportJson.passed}/${summary.expectedStepCount}`,
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
    `Files: ${summary.fileChecks.filter((file) => file.exists && file.isFile && file.size > 0).length}/${summary.requiredFiles.length}`,
    ...(summary.failures.length > 0
      ? ["", "Failures:", "", ...summary.failures.map((failure) => `- ${failure}`)]
      : []),
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
