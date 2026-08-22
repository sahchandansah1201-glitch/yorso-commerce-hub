#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  lstatSync,
  openSync,
  readSync,
  readdirSync,
  readlinkSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const command = process.argv.slice(2);
if (command.length === 0) {
  console.error("Usage: npm run check:gate-mutation -- <command> [args...]");
  process.exit(2);
}

const runGit = (args) => {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  return result.stdout;
};

const gitStatus = () => runGit(["status", "--porcelain=v1", "--untracked-files=all"]);
const FORBIDDEN_IGNORED_PATHS = ["src/integrations/supabase", "supabase"];
const MAX_SNAPSHOT_FILE_BYTES = 256 * 1024 * 1024;
const SPECIAL_SCAN_EXCLUSIONS = new Set([
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
]);

const repositoryIdentity = () => {
  const head = runGit(["rev-parse", "--verify", "HEAD"]).trim();
  const branch = spawnSync("git", ["symbolic-ref", "--quiet", "HEAD"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const refs = runGit(["for-each-ref", "--format=%(refname)%00%(objectname)"])
    .split("\n")
    .filter(Boolean)
    .sort()
    .join("\n");
  return `${head}\0${branch.status === 0 ? branch.stdout.trim() : "(detached)"}\0${refs}`;
};

const hashRegularFile = (hash, file, stats) => {
  if (stats.size > MAX_SNAPSHOT_FILE_BYTES) {
    throw new Error(`Gate mutation snapshot refuses files larger than 256 MiB: ${file}`);
  }
  const descriptor = openSync(file, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytesRead;
    do {
      bytesRead = readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead > 0) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead > 0);
  } finally {
    closeSync(descriptor);
  }
};

const hashSafePath = (hash, relativePath) => {
  const absolute = path.resolve(process.cwd(), relativePath);
  const root = path.resolve(process.cwd());
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Gate mutation snapshot path escapes the repository: ${relativePath}`);
  }
  const stats = lstatSync(absolute);
  hash.update(relativePath);
  hash.update("\0");
  hash.update(String(stats.mode));
  hash.update("\0");
  if (stats.isSymbolicLink()) {
    throw new Error(`Gate mutation snapshot refuses symbolic links: ${relativePath} -> ${readlinkSync(absolute)}`);
  }
  if (stats.isDirectory()) {
    hash.update("directory\0");
    for (const name of readdirSync(absolute).sort()) {
      hashSafePath(hash, path.posix.join(relativePath.replaceAll("\\", "/"), name));
    }
    return;
  }
  if (!stats.isFile()) {
    throw new Error(`Gate mutation snapshot refuses non-regular files: ${relativePath}`);
  }
  hash.update("file\0");
  hash.update(String(stats.size));
  hash.update("\0");
  hashRegularFile(hash, absolute, stats);
  hash.update("\0");
};

const hashSpecialEntries = (hash, relativeDirectory = ".") => {
  const absoluteDirectory = path.resolve(process.cwd(), relativeDirectory);
  for (const name of readdirSync(absoluteDirectory).sort()) {
    if (relativeDirectory === "." && SPECIAL_SCAN_EXCLUSIONS.has(name)) continue;
    const relativePath = path.posix.join(relativeDirectory, name).replace(/^\.\//, "");
    const absolutePath = path.resolve(process.cwd(), relativePath);
    const stats = lstatSync(absolutePath);
    if (stats.isSymbolicLink()) {
      hash.update(`special\0symlink\0${relativePath}\0${readlinkSync(absolutePath)}\0`);
      continue;
    }
    if (stats.isDirectory()) {
      hashSpecialEntries(hash, relativePath);
      continue;
    }
    if (!stats.isFile()) {
      throw new Error(`Gate mutation snapshot refuses non-regular files: ${relativePath}`);
    }
  }
};

const worktreeFingerprint = () => {
  const hash = createHash("sha256");
  hash.update(repositoryIdentity());
  hash.update("\0");
  hash.update(runGit(["diff", "--binary", "--no-ext-diff", "HEAD", "--"]));

  const untracked = runGit(["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean)
    .sort();
  for (const file of untracked) {
    hashSafePath(hash, file);
  }
  for (const forbiddenPath of FORBIDDEN_IGNORED_PATHS) {
    if (existsSync(forbiddenPath)) hashSafePath(hash, forbiddenPath);
  }
  hashSpecialEntries(hash);
  return hash.digest("hex");
};

const beforeStatus = gitStatus();
const before = worktreeFingerprint();
const result = spawnSync(command[0], command.slice(1), { cwd: process.cwd(), stdio: "inherit" });
const afterStatus = gitStatus();
const after = worktreeFingerprint();

if (before !== after) {
  console.error(
    "Gate mutation check failed: the command changed HEAD, branch, refs, tracked files, untracked files or forbidden ignored scaffold state.",
  );
  console.error("--- before ---");
  console.error(beforeStatus || "(clean)");
  console.error("--- after ---");
  console.error(afterStatus || "(clean)");
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(
  `Gate mutation check passed for HEAD, branch, refs, tracked, untracked and forbidden ignored scaffold state: ${command.join(" ")}`,
);
