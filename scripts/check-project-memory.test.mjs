import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, cpSync, mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { gunzipSync, gzipSync } from "node:zlib";
import { validateProjectMemory } from "./check-project-memory.mjs";

const root = process.cwd();
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

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
    const currentStatePath = path.join(fixture, "docs/project-memory/PROJECT_STATE.yaml");
    const currentHandoffPath = path.join(fixture, "docs/project-memory/HANDOFF.md");
    const currentState = readFileSync(currentStatePath, "utf8");
    const currentHandoff = readFileSync(currentHandoffPath, "utf8");
    writeFileSync(
      currentStatePath,
      gunzipSync(
        readFileSync(path.join(fixture, "docs/project-memory/archive/2026-08-21-pre-capability/PROJECT_STATE.yaml.gz")),
      ),
    );
    writeFileSync(
      currentHandoffPath,
      gunzipSync(readFileSync(path.join(fixture, "docs/project-memory/archive/2026-08-21-pre-capability/HANDOFF.md.gz"))),
    );
    execFileSync("git", ["add", "docs/project-memory"], { cwd: fixture });
    execFileSync("git", ["commit", "-qm", "archived memory source"], { cwd: fixture });
    const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: fixture, encoding: "utf8" }).trim();
    writeFileSync(
      currentStatePath,
      currentState.replace(/previous_expanded_state_commit:\s*"[0-9a-f]{40}"/, `previous_expanded_state_commit: "${sourceCommit}"`),
    );
    writeFileSync(currentHandoffPath, currentHandoff);
    execFileSync("git", ["add", "docs/project-memory"], { cwd: fixture });
    execFileSync("git", ["commit", "-qm", "current memory fixture"], { cwd: fixture });
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

test("a self-consistent archive that differs from its source commit fails closed", () => {
  withRepository((fixture) => {
    const archivePath = path.join(
      fixture,
      "docs/project-memory/archive/2026-08-21-pre-capability/PROJECT_STATE.yaml.gz",
    );
    const replacement = gzipSync("self-consistent but not source-bound\n");
    writeFileSync(archivePath, replacement);
    const statePath = path.join(fixture, "docs/project-memory/PROJECT_STATE.yaml");
    writeFileSync(
      statePath,
      readFileSync(statePath, "utf8").replace(
        /previous_expanded_state_archive_sha256:\s*"[0-9a-f]{64}"/,
        `previous_expanded_state_archive_sha256: "${sha256(replacement)}"`,
      ),
    );
    assert.match(validateProjectMemory(fixture).errors.join("\n"), /does not match source commit/);
  });
});

test("a symlinked archive root fails closed", () => {
  withRepository((fixture) => {
    const archiveRoot = path.join(fixture, "docs/project-memory/archive");
    const outside = path.join(fixture, "outside-archive");
    renameSync(archiveRoot, outside);
    symlinkSync(outside, archiveRoot, "dir");
    assert.match(validateProjectMemory(fixture).errors.join("\n"), /archive is missing or unsafe/);
  });
});
