#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const REQUIRED_FILES = [
  "PROJECT_STATE.yaml",
  "CONTEXT_HEALTH.md",
  "HANDOFF.md",
  "WORKLOG.md",
  "NEXT_ACTIONS.md",
  "ARTIFACTS.md",
  "RISKS.md",
  "ENGINEERING_LESSONS.md",
];

const normalizeRepository = (value = "") =>
  value
    .trim()
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/^git@github\.com:/, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");

const git = (root, args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

export const validateProjectMemory = (candidateRoot, env = process.env) => {
  const root = realpathSync(candidateRoot);
  const memoryRoot = path.join(root, "docs/project-memory");
  const errors = [];

  for (const name of REQUIRED_FILES) {
    const file = path.join(memoryRoot, name);
    if (!existsSync(file) || !statSync(file).isFile() || statSync(file).size === 0) {
      errors.push(`required project-memory file is missing or empty: ${name}`);
    }
  }
  if (errors.length > 0) return { errors, requiredFiles: REQUIRED_FILES, root };

  const state = readFileSync(path.join(memoryRoot, "PROJECT_STATE.yaml"), "utf8");
  const value = (key) =>
    state.match(new RegExp(`^\\s*${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, "m"))?.[1]?.trim();
  const expectedBranch = value("active_branch");
  const expectedCwd = value("cwd");
  const expectedRemote = normalizeRepository(value("remote"));
  const updatedAt = value("updated_at");
  const currentBranch = git(root, ["branch", "--show-current"]);
  const origin = normalizeRepository(git(root, ["remote", "get-url", "origin"]));

  if (value("project") !== "yorso-commerce-hub") errors.push("PROJECT_STATE project must be yorso-commerce-hub");
  if (value("production_branch") !== "main") errors.push("PROJECT_STATE production_branch must be main");
  if (value("base_ref") !== "origin/main") errors.push("PROJECT_STATE base_ref must be origin/main");
  if (value("experimental_pattern") !== "local-lab/<scope>") {
    errors.push("PROJECT_STATE experimental_pattern must be local-lab/<scope>");
  }
  if (expectedRemote !== origin) {
    errors.push(`PROJECT_STATE remote does not match origin: ${expectedRemote || "missing"} != ${origin || "missing"}`);
  }
  if (!expectedBranch?.startsWith("local-lab/")) {
    errors.push(`PROJECT_STATE active_branch must be a local-lab branch: ${expectedBranch ?? "missing"}`);
  }
  if (currentBranch.startsWith("local-lab/") && expectedBranch !== currentBranch) {
    errors.push(`PROJECT_STATE active_branch does not match git: ${expectedBranch ?? "missing"} != ${currentBranch}`);
  }
  if (env.PROJECT_MEMORY_STRICT_LOCAL === "1") {
    if (!expectedCwd || !existsSync(expectedCwd) || realpathSync(expectedCwd) !== root) {
      errors.push(`PROJECT_STATE cwd does not match current repository: ${expectedCwd ?? "missing"}`);
    }
  }

  const updatedTime = Date.parse(`${updatedAt}T00:00:00Z`);
  const ageDays = (Date.now() - updatedTime) / 86_400_000;
  if (!updatedAt || Number.isNaN(updatedTime) || ageDays < -1 || ageDays > 30) {
    errors.push(`PROJECT_STATE updated_at is missing or stale: ${updatedAt ?? "missing"}`);
  }

  for (const name of ["CONTEXT_HEALTH.md", "HANDOFF.md", "NEXT_ACTIONS.md"]) {
    const text = readFileSync(path.join(memoryRoot, name), "utf8");
    if (!text.includes(value("remote"))) errors.push(`${name} does not name the canonical remote`);
    if (!text.includes(expectedBranch ?? "")) errors.push(`${name} does not name the active experimental branch`);
  }

  return {
    errors: [...new Set(errors)],
    requiredFiles: REQUIRED_FILES,
    root,
    currentBranch: currentBranch || "detached",
    updatedAt,
  };
};

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  const result = validateProjectMemory(process.cwd());
  if (result.errors.length > 0) {
    console.error("Project-memory check failed:\n- " + result.errors.join("\n- "));
    process.exit(1);
  }
  console.log(
    `Project-memory check passed: ${result.requiredFiles.length} files, ${result.currentBranch}, updated ${result.updatedAt}.`,
  );
}
