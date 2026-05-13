#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { REPORTS, reportNames } from "./lib/report-artifact-config.mjs";
import { defaultReportRoot } from "./lib/report-artifact-validation.mjs";

const reportName = process.argv[2];
const targetRoot = process.argv[3] ?? path.join("account-report-packs", reportName ?? "");
const sourceRoot = process.argv[4] ?? defaultReportRoot(reportName);

if (!reportName || !REPORTS[reportName]) {
  console.error(`Usage: node scripts/copy-account-report-pack.mjs <${reportNames.join(" | ")}> [target-root] [source-root]`);
  process.exit(1);
}

if (!existsSync(path.join(sourceRoot, "report.json"))) {
  console.error(`Cannot copy ${reportName}: missing ${path.join(sourceRoot, "report.json")}`);
  process.exit(1);
}

rmSync(targetRoot, { force: true, recursive: true });
mkdirSync(path.dirname(targetRoot), { recursive: true });
cpSync(sourceRoot, targetRoot, { recursive: true });
console.log(`Copied ${reportName} report pack`);
console.log(`source=${sourceRoot}`);
console.log(`target=${targetRoot}`);
