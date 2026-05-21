#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import {
  analyzeE2EScriptPolicy,
  formatE2EScriptPolicyReport,
} from "./lib/e2e-script-policy.mjs";

const requiredFiles = [
  "AGENTS.md",
  "docs/project-memory/ENGINEERING_LESSONS.md",
  "docs/project-memory/WORKLOG.md",
  "docs/project-memory/RISKS.md",
  "docs/project-memory/PROJECT_STATE.yaml",
  "docs/backend/production-scale-baseline.md",
  "scripts/lib/e2e-script-policy.mjs",
  "scripts/check-engineering-lessons.mjs",
  "src/test/engineering-lessons-guard.test.ts",
  "package.json",
  "scripts/smoke-self-hosted-admin-access-grants.mjs",
];

const releasePolicyMarkers = [
  "API-backed spec",
  "smoke:e2e:run",
];

const failures = [];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required lessons file ${file}`);
}

const read = (file) => readFileSync(file, "utf8");
const requireText = (file, text, marker) => {
  if (!text.includes(marker)) failures.push(`${file}: missing marker "${marker}"`);
};
const forbidText = (file, text, marker) => {
  if (text.includes(marker)) failures.push(`${file}: forbidden marker "${marker}"`);
};

const pkg = JSON.parse(read("package.json"));
const agents = read("AGENTS.md");
const lessons = read("docs/project-memory/ENGINEERING_LESSONS.md");
const worklog = read("docs/project-memory/WORKLOG.md");
const risks = read("docs/project-memory/RISKS.md");
const productionScale = read("docs/backend/production-scale-baseline.md");
const e2eScriptPolicySource = read("scripts/lib/e2e-script-policy.mjs");
const adminGrantSmoke = read("scripts/smoke-self-hosted-admin-access-grants.mjs");

const e2ePolicy = analyzeE2EScriptPolicy(pkg);
failures.push(...e2ePolicy.failures);

for (const marker of releasePolicyMarkers) {
  requireText("scripts/lib/e2e-script-policy.mjs", e2eScriptPolicySource, marker);
}

for (const marker of [
  "Failure Learning Contract",
  "API-backed e2e specs that require `VITE_YORSO_API_URL`",
  "Do not run two Vite build-based e2e commands in parallel",
  "Memory repository smoke tests must assert stable contract fields",
]) {
  requireText("AGENTS.md", agents, marker);
}

for (const marker of [
  "Batch #98",
  "API-backed e2e",
  "VITE_YORSO_API_URL",
  "shared `dist/`",
  "memory repository",
  "stable contract fields",
]) {
  requireText("docs/project-memory/ENGINEERING_LESSONS.md", lessons, marker);
}

for (const marker of [
  "Batch #98",
  "check:engineering-lessons",
  "test:engineering-lessons",
]) {
  requireText("docs/project-memory/WORKLOG.md", worklog, marker);
}

for (const marker of [
  "API-backed browser specs can fail in generic smoke",
  "Parallel Vite builds can race on shared `dist/`",
]) {
  requireText("docs/project-memory/RISKS.md", risks, marker);
}

for (const marker of [
  "Batch #98",
  "check:engineering-lessons",
  "test:engineering-lessons",
  "API-backed e2e release policy",
]) {
  requireText("docs/backend/production-scale-baseline.md", productionScale, marker);
}

if (!pkg.scripts["check:engineering-lessons"]?.includes("scripts/check-engineering-lessons.mjs")) {
  failures.push("package.json: check:engineering-lessons must run scripts/check-engineering-lessons.mjs");
}
if (!pkg.scripts["test:engineering-lessons"]?.includes("src/test/engineering-lessons-guard.test.ts")) {
  failures.push("package.json: test:engineering-lessons must cover engineering lesson guards");
}
if (!pkg.scripts["ci:core"]?.includes("npm run check:engineering-lessons")) {
  failures.push("package.json: ci:core must run check:engineering-lessons");
}
if (!pkg.scripts["ci:core"]?.includes("npm run test:engineering-lessons")) {
  failures.push("package.json: ci:core must run test:engineering-lessons");
}

requireText(
  "scripts/smoke-self-hosted-admin-access-grants.mjs",
  adminGrantSmoke,
  "admin grants supplier id",
);
forbidText(
  "scripts/smoke-self-hosted-admin-access-grants.mjs",
  adminGrantSmoke,
  "admin grants supplier name",
);

if (failures.length > 0) {
  console.error("Engineering lessons check failed.");
  console.error(formatE2EScriptPolicyReport(e2ePolicy));
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Engineering lessons check passed.");
console.log(formatE2EScriptPolicyReport(e2ePolicy));
