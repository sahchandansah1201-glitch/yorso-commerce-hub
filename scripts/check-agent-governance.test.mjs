import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadAgentGovernance, validateAgentGovernance } from "./lib/agent-governance.mjs";

const root = process.cwd();

const validateFixture = (mutate, prepare) => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), "yorso-agent-governance-"));
  try {
    cpSync(path.join(root, ".agents"), path.join(fixture, ".agents"), { recursive: true });
    mkdirSync(path.join(fixture, "docs/agents"), { recursive: true });
    cpSync(
      path.join(root, "docs/agents/role-skill-provenance-matrix.md"),
      path.join(fixture, "docs/agents/role-skill-provenance-matrix.md"),
    );
    const { manifest, lock } = loadAgentGovernance(fixture);
    prepare?.(fixture);
    mutate?.(manifest, lock);
    return validateAgentGovernance(fixture, {
      manifest,
      lock,
      skipRepositoryInspection: true,
      skipSourceCommitVerification: true,
    });
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
};

test("current agent governance is valid", () => {
  assert.deepEqual(validateAgentGovernance(root), []);
});

test("content hash drift fails closed", () => {
  const errors = validateFixture((_manifest, lock) => {
    lock.skills[0].contentSha256 = "0".repeat(64);
  });
  assert.match(errors.join("\n"), /content hash mismatch/);
});

test("self-review fails closed", () => {
  const errors = validateFixture((manifest) => {
    manifest.skills[0].reviewerRole = manifest.skills[0].ownerRole;
  });
  assert.match(errors.join("\n"), /independent reviewer/);
});

test("a nonexistent project source commit fails closed", () => {
  const { manifest, lock } = loadAgentGovernance(root);
  const changedManifest = structuredClone(manifest);
  changedManifest.skills[0].source.revision = "1".repeat(40);
  const errors = validateAgentGovernance(root, {
    manifest: changedManifest,
    lock,
    skipRepositoryInspection: true,
  });
  assert.match(errors.join("\n"), /project source commit does not exist/);
});

test("an unverified source license fails closed", () => {
  const errors = validateFixture((manifest) => {
    manifest.skills[0].source.license = "unverified";
  });
  assert.match(errors.join("\n"), /source license is unverified/);
});

test("a fabricated external source fails closed", () => {
  const errors = validateFixture((manifest) => {
    const external = manifest.skills.find((skill) => skill.source.type === "external-adaptation");
    external.source.repository = "example/fabricated-skill";
    external.source.revision = "a".repeat(40);
  });
  assert.match(errors.join("\n"), /verified external source allowlist/);
});

test("a fabricated external license fails closed", () => {
  const errors = validateFixture((manifest) => {
    const external = manifest.skills.find((skill) => skill.source.type === "external-adaptation");
    external.source.license = "Totally-Real-License";
  });
  assert.match(errors.join("\n"), /license does not match verified evidence/);
});

test("an all-zero source revision fails closed", () => {
  const errors = validateFixture((manifest) => {
    manifest.skills[0].source.revision = "0".repeat(40);
  });
  assert.match(errors.join("\n"), /non-zero 40-character commit SHA/);
});

test("an unregistered skill directory fails closed", () => {
  const errors = validateFixture(undefined, (fixture) => {
    const directory = path.join(fixture, ".agents/skills/unregistered-skill");
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, "SKILL.md"), "---\nname: unregistered-skill\n---\n");
  });
  assert.match(errors.join("\n"), /unregistered skill directory/);
});

test("a role referencing an unknown skill fails closed", () => {
  const errors = validateFixture((manifest) => {
    manifest.roles[0].skills.push("unknown-skill");
  });
  assert.match(errors.join("\n"), /unknown skill for role/);
});

test("a dependency cycle fails closed", () => {
  const errors = validateFixture((manifest) => {
    manifest.skills[0].dependencies = [manifest.skills[1].id];
    manifest.skills[1].dependencies = [manifest.skills[0].id];
  });
  assert.match(errors.join("\n"), /dependency cycle/);
});

test("an unsafe manifest path fails closed", () => {
  const errors = validateFixture((manifest) => {
    manifest.skills[0].path = "../outside";
  });
  assert.match(errors.join("\n"), /unsafe skill path/);
});

test("missing branch policy fails closed", () => {
  const errors = validateFixture((manifest) => {
    delete manifest.branchPolicy;
  });
  assert.match(errors.join("\n"), /branchPolicy/);
});

test("an adapted skill cannot become active before Stage B passes", () => {
  const errors = validateFixture((manifest) => {
    const adapted = manifest.skills.find((skill) => skill.source.type !== "project-internal");
    adapted.status = "active";
  });
  assert.match(errors.join("\n"), /cannot be active before Stage B passes/);
});
