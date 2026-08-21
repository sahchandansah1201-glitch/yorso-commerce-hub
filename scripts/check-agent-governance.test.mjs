import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadAgentGovernance, validateAgentGovernance } from "./lib/agent-governance.mjs";

const root = process.cwd();

const validateFixture = (mutate, prepare, validationOverrides = {}) => {
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
      ...validationOverrides,
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

test("a real but stale project source commit fails on content", () => {
  const { manifest, lock } = loadAgentGovernance(root);
  const changedManifest = structuredClone(manifest);
  const changedLock = structuredClone(lock);
  const skill = changedManifest.skills.find((item) => item.id === "yorso-access-state-ux");
  const lockEntry = changedLock.skills.find((item) => item.id === skill.id);
  const staleRevision = "38ca06847566358516e33dec3487f237ca424bd1";
  skill.source.revision = staleRevision;
  lockEntry.sourceRevision = staleRevision;
  const errors = validateAgentGovernance(root, {
    manifest: changedManifest,
    lock: changedLock,
    skipRepositoryInspection: true,
  });
  assert.match(errors.join("\n"), /project source content hash mismatch/);
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

test("external evidence outside docs agents fails closed", () => {
  const errors = validateFixture((manifest) => {
    const external = manifest.skills.find((skill) => skill.source.type === "external-adaptation");
    external.source.evidence = "package.json";
  });
  assert.match(errors.join("\n"), /external adaptation evidence.*missing|inside docs\/agents/);
});

test("external evidence without exact provenance fails closed", () => {
  const errors = validateFixture(
    (manifest) => {
      const external = manifest.skills.find((skill) => skill.source.type === "external-adaptation");
      external.source.evidence = "docs/agents/incomplete-evidence.md";
    },
    (fixture) => {
      writeFileSync(path.join(fixture, "docs/agents/incomplete-evidence.md"), "generic evidence only\n");
    },
  );
  assert.match(errors.join("\n"), /does not contain repository, revision and license provenance/);
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

test("a skill symlink escaping the registered skills root fails closed", () => {
  const errors = validateFixture(undefined, (fixture) => {
    const registered = path.join(fixture, ".agents/skills/yorso-access-state-ux");
    const outside = path.join(fixture, "outside-skill");
    cpSync(registered, outside, { recursive: true });
    rmSync(registered, { recursive: true, force: true });
    symlinkSync(outside, registered, "dir");
  });
  assert.match(errors.join("\n"), /resolves outside \.agents\/skills/);
});

test("a duplicate lock id fails closed", () => {
  const errors = validateFixture((_manifest, lock) => {
    lock.skills.push(structuredClone(lock.skills[0]));
  });
  assert.match(errors.join("\n"), /duplicate or missing lock id/);
});

test("a duplicate skill inside one role fails closed", () => {
  const errors = validateFixture((manifest) => {
    manifest.roles[0].skills.push(manifest.roles[0].skills[0]);
  });
  assert.match(errors.join("\n"), /duplicate role skill/);
});

test("missing branch policy fails closed", () => {
  const errors = validateFixture((manifest) => {
    delete manifest.branchPolicy;
  });
  assert.match(errors.join("\n"), /branchPolicy/);
});

test("missing branch base evidence fails closed", () => {
  const errors = validateFixture((manifest) => {
    delete manifest.branchPolicy.baseCommit;
  });
  assert.match(errors.join("\n"), /branchPolicy\.baseCommit/);
});

test("an adapted skill cannot become active before Stage B passes", () => {
  const errors = validateFixture((manifest) => {
    const adapted = manifest.skills.find((skill) => skill.source.type !== "project-internal");
    adapted.status = "active";
  });
  assert.match(errors.join("\n"), /cannot be active before Stage B passes/);
});

test("Stage B cannot pass without a structured evidence file", () => {
  const errors = validateFixture((manifest) => {
    manifest.branchPolicy.stageBPilotStatus = "passed";
    delete manifest.branchPolicy.stageBEvidence;
  });
  assert.match(errors.join("\n"), /stageBEvidence is required/);
});

test("an unrelated branch cannot use the experimental manifest", () => {
  const errors = validateFixture(undefined, undefined, { currentBranch: "codex/unrelated" });
  assert.match(errors.join("\n"), /current branch does not match branchPolicy/);
});

test("main rejects pending Stage B and missing promotion evidence", () => {
  const errors = validateFixture(undefined, undefined, { currentBranch: "main" });
  assert.match(errors.join("\n"), /main cannot use pending Stage B/);
  assert.match(errors.join("\n"), /main requires branchPolicy\.promotionEvidence/);
});
