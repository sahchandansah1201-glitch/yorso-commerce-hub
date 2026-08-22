import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const checker = path.join(path.dirname(fileURLToPath(import.meta.url)), "check-gate-mutation.mjs");

const withRepository = (run) => {
  const root = mkdtempSync(path.join(tmpdir(), "yorso-gate-mutation-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["config", "user.email", "gate@example.test"], { cwd: root });
    execFileSync("git", ["config", "user.name", "Gate Test"], { cwd: root });
    writeFileSync(path.join(root, "tracked.txt"), "base\n");
    execFileSync("git", ["add", "tracked.txt"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "base"], { cwd: root });
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const check = (root, script) =>
  spawnSync(process.execPath, [checker, process.execPath, "-e", script], {
    cwd: root,
    encoding: "utf8",
  });

test("allows a command that leaves an already-dirty tree unchanged", () => {
  withRepository((root) => {
    appendFileSync(path.join(root, "tracked.txt"), "dirty-before\n");
    const result = check(root, "process.exit(0)");
    assert.equal(result.status, 0, result.stderr);
  });
});

test("detects content mutation in an already-dirty tracked file", () => {
  withRepository((root) => {
    appendFileSync(path.join(root, "tracked.txt"), "dirty-before\n");
    const result = check(root, "require('node:fs').appendFileSync('tracked.txt', 'mutated\\n')");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /changed HEAD, branch, refs, tracked files/);
  });
});

test("detects content mutation in an existing untracked file", () => {
  withRepository((root) => {
    writeFileSync(path.join(root, "untracked.txt"), "before\n");
    const result = check(root, "require('node:fs').appendFileSync('untracked.txt', 'mutated\\n')");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /changed HEAD, branch, refs, tracked files/);
  });
});

test("detects a commit created by a gate", () => {
  withRepository((root) => {
    const script = [
      "const {execFileSync}=require('node:child_process')",
      "require('node:fs').appendFileSync('tracked.txt','committed\\n')",
      "execFileSync('git',['add','tracked.txt'])",
      "execFileSync('git',['commit','-qm','gate mutation'])",
    ].join(";");
    const result = check(root, script);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /changed HEAD, branch, refs, tracked files/);
  });
});

test("detects a branch switch by a gate", () => {
  withRepository((root) => {
    const result = check(
      root,
      "require('node:child_process').execFileSync('git',['checkout','-qb','other-branch'])",
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /changed HEAD, branch, refs, tracked files/);
  });
});

test("detects a ref created by a gate", () => {
  withRepository((root) => {
    const result = check(
      root,
      "require('node:child_process').execFileSync('git',['update-ref','refs/heads/gate-created','HEAD'])",
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /changed HEAD, branch, refs, tracked files/);
  });
});
