import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync, cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  getDirtyGovernedSurface,
  loadAgentGovernance,
  validateAgentGovernance,
} from "./lib/agent-governance.mjs";

const root = process.cwd();

const TEST_ACTORS = {
  schemaVersion: 1,
  actors: [
    {
      id: "reviewer-a",
      independenceGroup: "review-organization-a",
      allowedRoles: ["stage-b-reviewer"],
    },
    {
      id: "reviewer-b",
      independenceGroup: "review-organization-b",
      allowedRoles: ["stage-b-reviewer"],
    },
    {
      id: "approver-a",
      independenceGroup: "approval-organization-a",
      allowedRoles: ["promotion-approver"],
    },
    {
      id: "approver-b",
      independenceGroup: "approval-organization-b",
      allowedRoles: ["promotion-approver"],
    },
  ],
};

const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

const writeArtifact = (fixture, relativePath, content) => {
  const absolute = path.join(fixture, relativePath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${content}\n`.repeat(2));
  return { path: relativePath, sha256: sha256(absolute) };
};

const writeJsonArtifact = (fixture, relativePath, value) => {
  const absolute = path.join(fixture, relativePath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
  return { path: relativePath, sha256: sha256(absolute) };
};

const prepareValidStageBEvidence = (fixture, requestedSkillId) => {
  const { manifest, lock, fixtureOracle } = loadAgentGovernance(fixture);
  const candidateSkill = manifest.skills.find(
    (skill) => skill.id === requestedSkillId || (!requestedSkillId && skill.source.type !== "project-internal"),
  );
  const candidateLock = lock.skills.find((skill) => skill.id === candidateSkill.id);
  const resultRoot = `docs/agents/pilots/results/stage-b-${candidateSkill.id}`;
  const fixtureIds = ["F1", "F2", "F3", "F4", "F5"];
  const oracleById = new Map(fixtureOracle.fixtures.map((entry) => [entry.id, entry]));
  const prompts = fixtureIds.map((fixtureId) =>
    writeArtifact(
      fixture,
      `${resultRoot}/prompts/${fixtureId}.md`,
      `Prompt evidence for ${candidateSkill.id} using ${fixtureId}`,
    ),
  );
  const outputs = [];
  const runs = [];
  for (const [fixtureIndex, fixtureId] of fixtureIds.entries()) {
    for (const arm of ["baseline", "candidate"]) {
      for (const repeat of [1, 2, 3]) {
        const output = writeArtifact(
          fixture,
          `${resultRoot}/outputs/${fixtureId}-${arm}-${repeat}.md`,
          `Output evidence for ${candidateSkill.id} ${fixtureId} ${arm} repeat ${repeat}`,
        );
        outputs.push(output);
        runs.push({
          fixtureId,
          arm,
          repeat,
          promptArtifact: prompts[fixtureIndex].path,
          outputArtifact: output.path,
          costUnits: arm === "baseline" ? 100 : 120,
        });
      }
    }
  }
  const reviewerSheets = ["reviewer-a", "reviewer-b"].map((reviewer, reviewerIndex) =>
    writeJsonArtifact(fixture, `${resultRoot}/reviews/${reviewer}.json`, {
      schemaVersion: 2,
      candidateSkillId: candidateSkill.id,
      reviewerId: reviewer,
      reviews: runs.map((run) => ({
        runKey: `${run.fixtureId}:${run.arm}:${run.repeat}`,
        score: run.arm === "baseline" ? 72 + reviewerIndex * 2 : 88 + reviewerIndex * 2,
        criticalDefectIdsFound:
          run.arm === "baseline"
            ? oracleById.get(run.fixtureId).criticalDefectIds.slice(0, 3)
            : oracleById.get(run.fixtureId).criticalDefectIds,
        pass: run.arm === "candidate",
      })),
    }),
  );
  const report = {
    schemaVersion: 4,
    candidateSkillId: candidateSkill.id,
    candidateSkillContentSha256: candidateLock.contentSha256,
    fixtureOracleSha256: sha256(path.join(fixture, "docs/agents/pilots/fixture-oracle.json")),
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
      baselineMean: 73,
      candidateMean: 89,
      baselineCriticalDefectRecall: 0.6,
      candidateCriticalDefectRecall: 1,
      cohensKappa: 1,
      medianOverheadRatio: 0.2,
    },
    artifacts: {
      prompts,
      outputs,
      reviewerSheets,
      disagreementResolution: [
        writeArtifact(
          fixture,
          `${resultRoot}/reviews/disagreement-resolution.md`,
          `Resolved reviewer disagreements for ${candidateSkill.id}`,
        ),
      ],
      costReport: [
        writeArtifact(
          fixture,
          `${resultRoot}/cost/report.md`,
          `Measured token and latency overhead for ${candidateSkill.id}`,
        ),
      ],
    },
  };
  const relativePath = `${resultRoot}/stage-b.json`;
  const absolutePath = path.join(fixture, relativePath);
  writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`);
  return { absolutePath, relativePath, report, resultRoot, candidateSkill };
};

const applyStageB = (manifest, stages) => {
  const stageList = Array.isArray(stages) ? stages : [stages];
  manifest.branchPolicy.stageBPilotStatus = "passed";
  manifest.branchPolicy.stageBEvidenceBySkill = Object.fromEntries(
    stageList.map((stage) => [stage.candidateSkill.id, stage.relativePath]),
  );
  for (const stage of stageList) {
    manifest.skills.find((skill) => skill.id === stage.candidateSkill.id).status = "active";
  }
};

const prepareAllStageBEvidence = (fixture) => {
  const { manifest } = loadAgentGovernance(fixture);
  return manifest.skills
    .filter((skill) => skill.source.type !== "project-internal")
    .map((skill) => prepareValidStageBEvidence(fixture, skill.id));
};

const prepareValidPromotionEvidence = (fixture, stages) => {
  const stageList = Array.isArray(stages) ? stages : [stages];
  const resultRoot = stageList[0].resultRoot;
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
      artifact: writeArtifact(fixture, `${resultRoot}/promotion/${gate}.md`, `Evidence for ${gate}`),
    };
  }
  const report = {
    schemaVersion: 4,
    reviewedCommit: "1".repeat(40),
    stageBEvidenceBySkill: Object.fromEntries(
      stageList.map((stage) => [stage.candidateSkill.id, stage.relativePath]),
    ),
    approvedBy: ["approver-a", "approver-b"],
    gateResults,
  };
  const relativePath = `${resultRoot}/promotion.json`;
  const absolutePath = path.join(fixture, relativePath);
  writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`);
  return { absolutePath, relativePath, report };
};

const validateFixture = (mutate, prepare, validationOverrides = {}) => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), "yorso-agent-governance-"));
  try {
    cpSync(path.join(root, ".agents"), path.join(fixture, ".agents"), { recursive: true });
    mkdirSync(path.join(fixture, "docs/agents/pilots"), { recursive: true });
    cpSync(
      path.join(root, "docs/agents/role-skill-provenance-matrix.md"),
      path.join(fixture, "docs/agents/role-skill-provenance-matrix.md"),
    );
    cpSync(
      path.join(root, "docs/agents/pilots/fixtures"),
      path.join(fixture, "docs/agents/pilots/fixtures"),
      { recursive: true },
    );
    cpSync(
      path.join(root, "docs/agents/pilots/fixture-oracle.json"),
      path.join(fixture, "docs/agents/pilots/fixture-oracle.json"),
    );
    const { manifest, lock, actors, fixtureOracle } = loadAgentGovernance(fixture);
    Object.assign(actors, structuredClone(TEST_ACTORS));
    prepare?.(fixture, manifest, lock, actors, fixtureOracle);
    mutate?.(manifest, lock, actors, fixtureOracle);
    return validateAgentGovernance(fixture, {
      manifest,
      lock,
      actors,
      fixtureOracle,
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
    delete manifest.branchPolicy.stageBEvidenceBySkill;
  });
  assert.match(errors.join("\n"), /stageBEvidenceBySkill is required/);
});

test("a complete checksum-bound Stage B run matrix is accepted", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      applyStageB(manifest, stage);
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
      applyStageB(manifest, stage);
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /Stage B artifact path is reused/);
});

test("Stage B rejects duplicate artifact bytes under different paths", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      const first = stage.report.artifacts.outputs[0];
      const second = stage.report.artifacts.outputs[1];
      const firstBytes = readFileSync(path.join(manifest.__fixtureRoot, first.path));
      const secondAbsolute = path.join(manifest.__fixtureRoot, second.path);
      writeFileSync(secondAbsolute, firstBytes);
      second.sha256 = sha256(secondAbsolute);
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      delete manifest.__fixtureRoot;
      applyStageB(manifest, stage);
    },
    (fixture, manifest) => {
      manifest.__fixtureRoot = fixture;
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /Stage B artifact content is reused/);
});

test("Stage B rejects reviewer aliases that normalize to the same identity", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      stage.report.reviewers[1].id = "reviewer-a ";
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      applyStageB(manifest, stage);
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /two unique canonical reviewer IDs/);
});

test("Stage B rejects an unregistered reviewer actor", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      stage.report.reviewers[1].id = "unknown-reviewer";
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      applyStageB(manifest, stage);
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /Stage B reviewer actor is not registered/);
});

test("Stage B rejects reviewers from the same independence group", () => {
  let stage;
  const errors = validateFixture(
    (manifest, _lock, actors) => {
      actors.actors[1].independenceGroup = actors.actors[0].independenceGroup;
      applyStageB(manifest, stage);
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /distinct independence groups/);
});

test("fixture oracle rejects a critical-defect-free fixture", () => {
  const errors = validateFixture((_manifest, _lock, _actors, fixtureOracle) => {
    fixtureOracle.fixtures[0].criticalDefectIds = [];
  });
  assert.match(errors.join("\n"), /fixture oracle critical defects are invalid/);
});

test("Stage B rejects a stale fixture oracle checksum", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      stage.report.fixtureOracleSha256 = "0".repeat(64);
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      applyStageB(manifest, stage);
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /fixture oracle hash mismatch/);
});

test("dirty governed surface detection includes tracked and untracked governance files", () => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), "yorso-governed-surface-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: fixture });
    execFileSync("git", ["config", "user.email", "gate@example.test"], { cwd: fixture });
    execFileSync("git", ["config", "user.name", "Gate Test"], { cwd: fixture });
    mkdirSync(path.join(fixture, ".agents"), { recursive: true });
    writeFileSync(path.join(fixture, ".agents", "tracked.json"), "{}\n");
    execFileSync("git", ["add", ".agents/tracked.json"], { cwd: fixture });
    execFileSync("git", ["commit", "-qm", "base"], { cwd: fixture });
    appendFileSync(path.join(fixture, ".agents", "tracked.json"), "dirty\n");
    mkdirSync(path.join(fixture, "docs", "agents"), { recursive: true });
    writeFileSync(path.join(fixture, "docs", "agents", "untracked.md"), "untracked\n");

    const dirty = getDirtyGovernedSurface(fixture);
    assert.match(dirty, /\.agents\/tracked\.json/);
    assert.match(dirty, /docs\/agents\/untracked\.md/);
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});

test("Stage B rejects a reviewer-supplied defect denominator", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      const sheetArtifact = stage.report.artifacts.reviewerSheets[0];
      const sheetPath = path.join(manifest.__fixtureRoot, sheetArtifact.path);
      const sheet = JSON.parse(readFileSync(sheetPath, "utf8"));
      sheet.reviews[0].criticalDefectsExpected = 0;
      writeFileSync(sheetPath, `${JSON.stringify(sheet, null, 2)}\n`);
      sheetArtifact.sha256 = sha256(sheetPath);
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      delete manifest.__fixtureRoot;
      applyStageB(manifest, stage);
    },
    (fixture, manifest) => {
      manifest.__fixtureRoot = fixture;
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /review defect evidence is invalid/);
});

test("Stage B rejects defect ids that are absent from the fixture oracle", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      const sheetArtifact = stage.report.artifacts.reviewerSheets[0];
      const sheetPath = path.join(manifest.__fixtureRoot, sheetArtifact.path);
      const sheet = JSON.parse(readFileSync(sheetPath, "utf8"));
      sheet.reviews[0].criticalDefectIdsFound.push("invented-defect");
      writeFileSync(sheetPath, `${JSON.stringify(sheet, null, 2)}\n`);
      sheetArtifact.sha256 = sha256(sheetPath);
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      delete manifest.__fixtureRoot;
      applyStageB(manifest, stage);
    },
    (fixture, manifest) => {
      manifest.__fixtureRoot = fixture;
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /review defect evidence is invalid/);
});

test("Stage B rejects reviewer decisions with undefined Cohen's kappa", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      for (const artifact of stage.report.artifacts.reviewerSheets) {
        const sheetPath = path.join(manifest.__fixtureRoot, artifact.path);
        const sheet = JSON.parse(readFileSync(sheetPath, "utf8"));
        for (const review of sheet.reviews) review.pass = true;
        writeFileSync(sheetPath, `${JSON.stringify(sheet, null, 2)}\n`);
        artifact.sha256 = sha256(sheetPath);
      }
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      delete manifest.__fixtureRoot;
      applyStageB(manifest, stage);
    },
    (fixture, manifest) => {
      manifest.__fixtureRoot = fixture;
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /kappa is undefined/);
});

test("each active adapted skill requires its own Stage B evidence", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      applyStageB(manifest, stage);
      const second = manifest.skills.filter((skill) => skill.source.type !== "project-internal")[1];
      second.status = "active";
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /evidence is required for active adapted skill/);
});

test("Stage B rejects artifact reuse across different skills", () => {
  let stages;
  const errors = validateFixture(
    (manifest) => {
      const first = stages[0].report.artifacts.outputs[0];
      const second = stages[1].report.artifacts.outputs[0];
      const firstBytes = readFileSync(path.join(manifest.__fixtureRoot, first.path));
      const secondPath = path.join(manifest.__fixtureRoot, second.path);
      writeFileSync(secondPath, firstBytes);
      second.sha256 = sha256(secondPath);
      writeFileSync(stages[1].absolutePath, `${JSON.stringify(stages[1].report, null, 2)}\n`);
      delete manifest.__fixtureRoot;
      applyStageB(manifest, stages);
    },
    (fixture, manifest) => {
      manifest.__fixtureRoot = fixture;
      stages = prepareAllStageBEvidence(fixture).slice(0, 2);
    },
  );
  assert.match(errors.join("\n"), /artifact content is reused across skills/);
});

test("Stage B rejects an incomplete run matrix", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      stage.report.runs.pop();
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      applyStageB(manifest, stage);
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /all 30 unique/);
});

test("Stage B rejects manually altered metrics and hard failures", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      stage.report.metrics.baselineMean = 84;
      stage.report.metrics.baselineCriticalDefectRecall = 0.9;
      stage.report.hardFailures = ["false release claim"];
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      applyStageB(manifest, stage);
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /zero hard failures/);
  assert.match(errors.join("\n"), /metric does not match reviewer\/run evidence/);
});

test("Stage B rejects evidence-backed results below the improvement threshold", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      for (const artifact of stage.report.artifacts.reviewerSheets) {
        const absolute = path.join(manifest.__fixtureRoot, artifact.path);
        const sheet = JSON.parse(readFileSync(absolute, "utf8"));
        for (const review of sheet.reviews) {
          if (review.runKey.includes(":baseline:")) {
            review.score = 84;
            const fixtureId = review.runKey.split(":")[0];
            const oracle = JSON.parse(
              readFileSync(path.join(manifest.__fixtureRoot, "docs/agents/pilots/fixture-oracle.json"), "utf8"),
            );
            review.criticalDefectIdsFound = oracle.fixtures.find((fixture) => fixture.id === fixtureId).criticalDefectIds;
          } else {
            review.score = 89;
          }
        }
        writeFileSync(absolute, `${JSON.stringify(sheet, null, 2)}\n`);
        artifact.sha256 = sha256(absolute);
      }
      stage.report.metrics = {
        baselineMean: 84,
        candidateMean: 89,
        baselineCriticalDefectRecall: 1,
        candidateCriticalDefectRecall: 1,
        cohensKappa: 1,
        medianOverheadRatio: 0.2,
      };
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      delete manifest.__fixtureRoot;
      applyStageB(manifest, stage);
    },
    (fixture, manifest) => {
      manifest.__fixtureRoot = fixture;
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /baseline improvement threshold/);
});

test("Stage B rejects a missing required metric", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      delete stage.report.metrics.cohensKappa;
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      applyStageB(manifest, stage);
    },
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /metric does not match reviewer\/run evidence/);
});

test("Stage B rejects an artifact checksum mismatch", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      stage.report.artifacts.outputs[0].sha256 = "0".repeat(64);
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      applyStageB(manifest, stage);
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
  let stages;
  let promotion;
  const errors = validateFixture(
    (manifest) => {
      applyStageB(manifest, stages);
      manifest.branchPolicy.promotionEvidence = promotion.relativePath;
      for (const skill of manifest.skills) skill.status = "active";
    },
    (fixture) => {
      stages = prepareAllStageBEvidence(fixture);
      promotion = prepareValidPromotionEvidence(fixture, stages);
    },
    { currentBranch: "main" },
  );
  assert.deepEqual(errors, []);
});

test("main promotion rejects duplicate approvers and reused gate artifacts", () => {
  let stages;
  let promotion;
  const errors = validateFixture(
    (manifest) => {
      applyStageB(manifest, stages);
      manifest.branchPolicy.promotionEvidence = promotion.relativePath;
      for (const skill of manifest.skills) skill.status = "active";
      promotion.report.approvedBy = ["same-approver", "same-approver "];
      promotion.report.gateResults["project-memory-check"].artifact =
        promotion.report.gateResults["governance-check"].artifact;
      writeFileSync(promotion.absolutePath, `${JSON.stringify(promotion.report, null, 2)}\n`);
    },
    (fixture) => {
      stages = prepareAllStageBEvidence(fixture);
      promotion = prepareValidPromotionEvidence(fixture, stages);
    },
    { currentBranch: "main" },
  );
  assert.match(errors.join("\n"), /two unique canonical independent approvers/);
  assert.match(errors.join("\n"), /promotion gate artifact path is reused/);
});
