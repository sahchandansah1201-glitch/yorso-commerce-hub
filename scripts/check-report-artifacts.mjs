#!/usr/bin/env node
import { REPORTS, reportNames } from "./lib/report-artifact-config.mjs";
import {
  formatValidationResult,
  validateReportArtifact,
} from "./lib/report-artifact-validation.mjs";

const usage = () => {
  const names = reportNames.join(" | ");
  console.error(`Usage: node scripts/check-report-artifacts.mjs <${names}> [artifact-root] [--json] [--verbose]`);
};

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const positional = args.filter((arg) => !arg.startsWith("--"));
const reportName = positional[0];
if (!reportName || !REPORTS[reportName]) {
  usage();
  process.exit(1);
}

const root = positional[1];
const result = validateReportArtifact(reportName, root);

if (flags.has("--json")) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (flags.has("--verbose") && !flags.has("--json")) {
  console.log(formatValidationResult(result));
  for (const file of result.fileChecks) {
    console.log(
      `- ${file.fileName}: exists=${file.exists} size=${file.size} png=${file.pngSignature ?? "n/a"}`,
    );
  }
}

if (!result.passed) {
  console.error(`Report artifact check failed for ${reportName}`);
  for (const failure of result.failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Report artifact check passed for ${reportName}`);
console.log(formatValidationResult(result));
