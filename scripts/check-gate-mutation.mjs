#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

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
    hash.update(file);
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
};

const beforeStatus = gitStatus();
const before = worktreeFingerprint();
const result = spawnSync(command[0], command.slice(1), { cwd: process.cwd(), stdio: "inherit" });
const afterStatus = gitStatus();
const after = worktreeFingerprint();

if (before !== after) {
  console.error(
    "Gate mutation check failed: the command changed HEAD, branch, refs, tracked files or nonignored untracked state.",
  );
  console.error("--- before ---");
  console.error(beforeStatus || "(clean)");
  console.error("--- after ---");
  console.error(afterStatus || "(clean)");
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(
  `Gate mutation check passed for HEAD, branch, refs, tracked and nonignored untracked state: ${command.join(" ")}`,
);
