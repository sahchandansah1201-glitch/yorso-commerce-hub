#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

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

const gitBuffer = (root, args) =>
  execFileSync("git", args, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });

const gitSucceeds = (root, args) => {
  try {
    gitBuffer(root, args);
    return true;
  } catch {
    return false;
  }
};

const isWithin = (parent, candidate) => candidate === parent || candidate.startsWith(`${parent}${path.sep}`);

const containsSymbolicLinkInPath = (root, target) => {
  const lexicalRoot = path.resolve(root);
  const lexicalTarget = path.resolve(target);
  if (!isWithin(lexicalRoot, lexicalTarget)) return true;
  const relative = path.relative(lexicalRoot, lexicalTarget);
  let current = lexicalRoot;
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (!existsSync(current) || lstatSync(current).isSymbolicLink()) return true;
  }
  return false;
};

const isSafeRelativePath = (value) => {
  if (typeof value !== "string" || value.length === 0 || path.isAbsolute(value)) return false;
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  return normalized === value && normalized !== ".." && !normalized.startsWith("../");
};

const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

export const validateProjectMemory = (candidateRoot, env = process.env) => {
  const root = realpathSync(candidateRoot);
  const memoryRoot = path.join(root, "docs/project-memory");
  const errors = [];

  for (const name of REQUIRED_FILES) {
    const file = path.join(memoryRoot, name);
    let safe = false;
    try {
      safe =
        existsSync(file) &&
        !containsSymbolicLinkInPath(root, memoryRoot) &&
        !containsSymbolicLinkInPath(root, file) &&
        !lstatSync(file).isSymbolicLink() &&
        lstatSync(file).isFile() &&
        lstatSync(file).size > 0 &&
        isWithin(realpathSync(root), realpathSync(memoryRoot)) &&
        isWithin(realpathSync(memoryRoot), realpathSync(file));
    } catch {
      safe = false;
    }
    if (!safe) {
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
  if (currentBranch && expectedBranch !== currentBranch) {
    errors.push(`PROJECT_STATE active_branch does not match git: ${expectedBranch ?? "missing"} != ${currentBranch}`);
  }
  if (env.PROJECT_MEMORY_STRICT_LOCAL === "1") {
    if (!expectedCwd || !existsSync(expectedCwd) || realpathSync(expectedCwd) !== root) {
      errors.push(`PROJECT_STATE cwd does not match current repository: ${expectedCwd ?? "missing"}`);
    }
  }

  const archiveRoot = path.join(memoryRoot, "archive");
  const previousExpandedCommit = value("previous_expanded_state_commit");
  const previousCommitIsValid =
    /^[0-9a-f]{40}$/.test(previousExpandedCommit ?? "") &&
    !/^0+$/.test(previousExpandedCommit ?? "") &&
    gitSucceeds(root, ["cat-file", "-e", `${previousExpandedCommit}^{commit}`]) &&
    gitSucceeds(root, ["merge-base", "--is-ancestor", previousExpandedCommit, "HEAD"]);
  if (!previousCommitIsValid) {
    errors.push(`PROJECT_STATE previous_expanded_state_commit is missing, unknown or not an ancestor: ${previousExpandedCommit ?? "missing"}`);
  }

  for (const [pathKey, hashKey, sourcePath] of [
    ["previous_expanded_state_archive", "previous_expanded_state_archive_sha256", "docs/project-memory/PROJECT_STATE.yaml"],
    ["previous_expanded_handoff_archive", "previous_expanded_handoff_archive_sha256", "docs/project-memory/HANDOFF.md"],
  ]) {
    const archive = value(pathKey);
    const expectedHash = value(hashKey);
    if (!isSafeRelativePath(archive ?? "") || !archive?.startsWith("docs/project-memory/archive/")) {
      errors.push(`PROJECT_STATE ${pathKey} must be a safe project-memory archive path`);
      continue;
    }
    const absolute = path.join(root, archive);
    if (
      !existsSync(absolute) ||
      containsSymbolicLinkInPath(root, archiveRoot) ||
      containsSymbolicLinkInPath(root, absolute) ||
      !lstatSync(absolute).isFile() ||
      lstatSync(absolute).isSymbolicLink()
    ) {
      errors.push(`PROJECT_STATE archive is missing or unsafe: ${archive}`);
      continue;
    }
    if (!isWithin(realpathSync(root), realpathSync(archiveRoot)) || !isWithin(realpathSync(archiveRoot), realpathSync(absolute))) {
      errors.push(`PROJECT_STATE archive resolves outside project-memory archive: ${archive}`);
      continue;
    }
    if (!/^[0-9a-f]{64}$/.test(expectedHash ?? "") || sha256(absolute) !== expectedHash) {
      errors.push(`PROJECT_STATE archive checksum mismatch: ${archive}`);
      continue;
    }
    try {
      const expanded = gunzipSync(readFileSync(absolute));
      if (expanded.length === 0) {
        errors.push(`PROJECT_STATE archive is empty: ${archive}`);
      } else if (previousCommitIsValid) {
        const sourceAtCommit = gitBuffer(root, ["show", `${previousExpandedCommit}:${sourcePath}`]);
        if (!expanded.equals(sourceAtCommit)) {
          errors.push(`PROJECT_STATE archive does not match source commit ${previousExpandedCommit}: ${archive}`);
        }
      }
    } catch {
      errors.push(`PROJECT_STATE archive is not valid gzip: ${archive}`);
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
