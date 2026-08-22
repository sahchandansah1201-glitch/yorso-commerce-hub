import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadAgentGovernance, validateAgentGovernance } from "./lib/agent-governance.mjs";

const root = process.cwd();

const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

const writeArtifact = (fixture, relativePath, content) => {
  const absolute = path.join(fixture, relativePath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${content}\n`.repeat(2));
  return { path: relativePath, sha256: sha256(absolute) };
};

const prepareValidStageBEvidence = (fixture) => {
  const resultRoot = "docs/agents/pilots/results/stage-b-fixture";
  const fixtureIds = ["F1", "F2", "F3", "F4", "F5"];
  const prompts = fixtureIds.map((fixtureId) =>
    writeArtifact(fixture, `${resultRoot}/prompts/${fixtureId}.md`, `Prompt evidence for ${fixtureId}`),
  );
  const outputs = [];
  const runs = [];
  for (const [fixtureIndex, fixtureId] of fixtureIds.entries()) {
    for (const arm of ["baseline", "candidate"]) {
      for (const repeat of [1, 2, 3]) {
        const output = writeArtifact(
          fixture,
          `${resultRoot}/outputs/${fixtureId}-${arm}-${repeat}.md`,
          `Output evidence for ${fixtureId} ${arm} repeat ${repeat}`,
        );
        outputs.push(output);
        runs.push({
          fixtureId,
          arm,
          repeat,
          promptArtifact: prompts[fixtureIndex].path,
          outputArtifact: output.path,
        });
      }
    }
  }
  const reviewerSheets = ["reviewer-a", "reviewer-b"].map((reviewer) =>
    writeArtifact(fixture, `${resultRoot}/reviews/${reviewer}.md`, `Independent review sheet for ${reviewer}`),
  );
  const report = {
    schemaVersion: 2,
    evaluatedCommit: "1".repeat(40),
    fixtureIds,
    arms: ["baseline", "candidate"],
    repeatsPerArm: 3,
    runs,
    reviewers: [
      { id: "reviewer-a", sheetArtifact: reviewerSheets[0].path },
      { id: "reviewer-b", sheetArtifact: reviewerSheets[1].path },
    ],
    hardFailures: [],
    regressions: [],
    metrics: {
      baselineMean: 75,
      candidateMean: 85,
      baselineCriticalDefectRecall: 0.7,
      candidateCriticalDefectRecall: 1,
      cohensKappa: 0.8,
      medianOverheadRatio: 0.2,
    },
    artifacts: {
      prompts,
      outputs,
      reviewerSheets,
      disagreementResolution: [
        writeArtifact(fixture, `${resultRoot}/reviews/disagreement-resolution.md`, "Resolved reviewer disagreements"),
      ],
      costReport: [writeArtifact(fixture, `${resultRoot}/cost/report.md`, "Measured token and latency overhead")],
    },
  };
  const relativePath = `${resultRoot}/stage-b.json`;
  const absolutePath = path.join(fixture, relativePath);
  writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`);
  return { absolutePath, relativePath, report, resultRoot };
};

const prepareValidPromotionEvidence = (fixture, stage) => {
  const gateResults = {};
  for (const gate of [
    "independent-review",
    "governance-check",
    "project-memory-check",
    "relevant-product-tests",
    "non-mutating-gates",
  ]) {
    gateResults[gate] = {
      status: "passed",
      command: `verify ${gate}`,
      artifact: writeArtifact(fixture, `${stage.resultRoot}/promotion/${gate}.md`, `Evidence for ${gate}`),
    };
  }
  const report = {
    schemaVersion: 2,
    reviewedCommit: "1".repeat(40),
    stageBEvidence: stage.relativePath,
    approvedBy: ["approver-a", "approver-b"],
    gateResults,
  };
  const relativePath = `${stage.resultRoot}/promotion.json`;
  const absolutePath = path.join(fixture, relativePath);
  writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`);
  return { absolutePath, relativePath, report };
};

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

test("a symlinked registered skills root fails closed", () => {
  const errors = validateFixture(undefined, (fixture) => {
    const skillsRoot = path.join(fixture, ".agents/skills");
    const outside = path.join(fixture, "outside-skills-root");
    cpSync(skillsRoot, outside, { recursive: true });
    rmSync(skillsRoot, { recursive: true, force: true });
    symlinkSync(outside, skillsRoot, "dir");
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

test("a complete checksum-bound Stage B run matrix is accepted", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      manifest.branchPolicy.stageBPilotStatus = "passed";
      manifest.branchPolicy.stageBEvidence = stage.relativePath;
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.deepEqual(errors.filter((error) => error.startsWith("Stage B")), []);
});

test("Stage B rejects reused placeholder artifacts", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      const shared = stage.report.artifacts.prompts[0];
      stage.report.artifacts.outputs[0] = shared;
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      manifest.branchPolicy.stageBPilotStatus = "passed";
      manifest.branchPolicy.stageBEvidence = stage.relativePath;
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /Stage B artifact path is reused/);
});

test("Stage B rejects an incomplete run matrix", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      stage.report.runs.pop();
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      manifest.branchPolicy.stageBPilotStatus = "passed";
      manifest.branchPolicy.stageBEvidence = stage.relativePath;
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /all 30 unique/);
});

test("Stage B rejects missing improvement and hard failures", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      stage.report.metrics.baselineMean = 84;
      stage.report.metrics.baselineCriticalDefectRecall = 0.9;
      stage.report.hardFailures = ["false release claim"];
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      manifest.branchPolicy.stageBPilotStatus = "passed";
      manifest.branchPolicy.stageBEvidence = stage.relativePath;
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /zero hard failures/);
  assert.match(errors.join("\n"), /baseline improvement threshold/);
});

test("Stage B rejects a missing required metric", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      delete stage.report.metrics.cohensKappa;
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      manifest.branchPolicy.stageBPilotStatus = "passed";
      manifest.branchPolicy.stageBEvidence = stage.relativePath;
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /requires all numeric metrics/);
});

test("Stage B rejects an artifact checksum mismatch", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      stage.report.artifacts.outputs[0].sha256 = "0".repeat(64);
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      manifest.branchPolicy.stageBPilotStatus = "passed";
      manifest.branchPolicy.stageBEvidence = stage.relativePath;
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /SHA-256 mismatch/);
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

test("a pull request targeting main is evaluated by main policy", () => {
  const errors = validateFixture(undefined, undefined, {
    currentBranch: "local-lab/agent-capability-foundation",
    ciTargetBranch: "main",
  });
  assert.match(errors.join("\n"), /main cannot use pending Stage B/);
  assert.match(errors.join("\n"), /main requires branchPolicy\.promotionEvidence/);
});

test("complete Stage B and promotion evidence satisfy main policy", () => {
  let stage;
  let promotion;
  const errors = validateFixture(
    (manifest) => {
      manifest.branchPolicy.stageBPilotStatus = "passed";
      manifest.branchPolicy.stageBEvidence = stage.relativePath;
      manifest.branchPolicy.promotionEvidence = promotion.relativePath;
      for (const skill of manifest.skills) skill.status = "active";
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
      promotion = prepareValidPromotionEvidence(fixture, stage);
    },
    { currentBranch: "main" },
  );
  assert.deepEqual(errors, []);
});

test("main promotion rejects duplicate approvers and reused gate artifacts", () => {
  let stage;
  let promotion;
  const errors = validateFixture(
    (manifest) => {
      manifest.branchPolicy.stageBPilotStatus = "passed";
      manifest.branchPolicy.stageBEvidence = stage.relativePath;
      manifest.branchPolicy.promotionEvidence = promotion.relativePath;
      for (const skill of manifest.skills) skill.status = "active";
      promotion.report.approvedBy = ["same-approver", "same-approver"];
      promotion.report.gateResults["project-memory-check"].artifact =
        promotion.report.gateResults["governance-check"].artifact;
      writeFileSync(promotion.absolutePath, `${JSON.stringify(promotion.report, null, 2)}\n`);
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
      promotion = prepareValidPromotionEvidence(fixture, stage);
    },
    { currentBranch: "main" },
  );
  assert.match(errors.join("\n"), /two unique independent approvers/);
  assert.match(errors.join("\n"), /promotion gate artifact path is reused/);
});
