#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { evaluateCycle, SAFE_AUTOMATED_CHECKS } from "./lib/local-lab-cycle.mjs";

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};
const evidencePath = valueAfter("--evidence", "docs/workflow/runs/agent-capability-foundation.json");
const mode = valueAfter("--mode", "local");
const allowDirty = args.includes("--allow-dirty");

const git = (...commandArgs) => execFileSync("git", commandArgs, { encoding: "utf8" }).trim();
const evidence = JSON.parse(readFileSync(path.resolve(evidencePath), "utf8"));
const branch = git("branch", "--show-current");
const refs = git("for-each-ref", "--format=%(refname:short)", "refs/heads", "refs/remotes/origin")
  .split("\n")
  .filter(Boolean);
const scope = evidence.branch.replace(/^local-lab\//, "");
const parallelBranches = refs.filter((ref) =>
  [
    `codex/${scope}`,
    `lovable/test/${scope}`,
    `origin/codex/${scope}`,
    `origin/lovable/test/${scope}`,
  ].includes(ref),
);

const baseChanged = git("diff", "--name-only", `${evidence.baseRef}...HEAD`).split("\n").filter(Boolean);
const trackedDirty = [
  ...git("diff", "--name-only").split("\n"),
  ...git("diff", "--cached", "--name-only").split("\n"),
].filter(Boolean);
const untracked = git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean);
const changedFiles = [...new Set([...baseChanged, ...trackedDirty, ...untracked])].sort();

const diffChecks = [
  spawnSync("git", ["diff", "--check", `${evidence.baseRef}...HEAD`], { encoding: "utf8" }),
  spawnSync("git", ["diff", "--check"], { encoding: "utf8" }),
  spawnSync("git", ["diff", "--cached", "--check"], { encoding: "utf8" }),
];
for (const result of diffChecks) {
  if (result.status !== 0 && result.stderr) process.stderr.write(result.stderr);
}

const automatedResults = [];
for (const checkId of evidence.automatedChecks) {
  if (!SAFE_AUTOMATED_CHECKS.has(checkId)) {
    automatedResults.push({ id: checkId, passed: false });
    continue;
  }
  console.log(`\n[local-lab-cycle] running npm run ${checkId}`);
  const result = spawnSync("npm", ["run", checkId], { stdio: "inherit", env: process.env });
  automatedResults.push({ id: checkId, passed: result.status === 0 });
}

const dirty = git("status", "--porcelain").length > 0;
const context = {
  remote: git("remote", "get-url", "origin"),
  branch,
  mergeBase: git("merge-base", evidence.baseRef, "HEAD"),
  parallelBranches,
  changedFiles,
  diffCheckPassed: diffChecks.every((result) => result.status === 0),
  automatedResults,
  dirty,
  allowDirty,
};

const result = evaluateCycle(evidence, context, mode);
console.log("\n| Gate | Status | Detail |");
console.log("| --- | --- | --- |");
for (const [gate, outcome] of Object.entries(result.gates)) {
  const detail = String(outcome.detail ?? "No detail provided.").replaceAll("|", "\\|");
  console.log(`| ${gate} | ${outcome.status} | ${detail} |`);
}
console.log(`\nVerdict: ${result.verdict}`);
if (result.verdict === "NO-GO") process.exit(1);
