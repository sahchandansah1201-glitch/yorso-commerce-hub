import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFileSync, cpSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateProjectMemory } from "./check-project-memory.mjs";

const root = process.cwd();

const withRepository = (run, { detached = true } = {}) => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), "yorso-project-memory-"));
  try {
    mkdirSync(path.join(fixture, "docs"), { recursive: true });
    cpSync(path.join(root, "docs/project-memory"), path.join(fixture, "docs/project-memory"), { recursive: true });
    execFileSync("git", ["init", "-qb", "main"], { cwd: fixture });
    execFileSync("git", ["config", "user.email", "memory@example.test"], { cwd: fixture });
    execFileSync("git", ["config", "user.name", "Memory Test"], { cwd: fixture });
    execFileSync(
      "git",
      ["remote", "add", "origin", "https://github.com/sahchandansah1201-glitch/yorso-commerce-hub.git"],
      { cwd: fixture },
    );
    execFileSync("git", ["add", "docs/project-memory"], { cwd: fixture });
    execFileSync("git", ["commit", "-qm", "memory fixture"], { cwd: fixture });
    if (detached) execFileSync("git", ["checkout", "-q", "--detach"], { cwd: fixture });
    run(fixture);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
};

test("current project memory is valid", () => {
  assert.deepEqual(validateProjectMemory(root).errors, []);
});

test("project memory is portable to a detached CI checkout", () => {
  withRepository((fixture) => {
    assert.deepEqual(validateProjectMemory(fixture).errors, []);
  });
});

test("strict local mode still detects a repository path mismatch", () => {
  withRepository((fixture) => {
    assert.match(validateProjectMemory(fixture, { PROJECT_MEMORY_STRICT_LOCAL: "1" }).errors.join("\n"), /cwd/);
  });
});

test("an attached branch that disagrees with project memory fails closed", () => {
  withRepository(
    (fixture) => {
      assert.match(validateProjectMemory(fixture).errors.join("\n"), /active_branch does not match git/);
    },
    { detached: false },
  );
});

test("a tampered recovery archive fails closed", () => {
  withRepository((fixture) => {
    appendFileSync(
      path.join(
        fixture,
        "docs/project-memory/archive/2026-08-21-pre-capability/PROJECT_STATE.yaml.gz",
      ),
      "tampered",
    );
    assert.match(validateProjectMemory(fixture).errors.join("\n"), /archive checksum mismatch/);
  });
});
