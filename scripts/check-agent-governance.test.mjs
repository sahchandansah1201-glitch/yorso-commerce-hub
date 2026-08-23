import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { appendFileSync, cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  getDirtyGovernedSurface,
  loadAgentGovernance,
  validateAgentGovernance,
  validateReviewedCommit,
} from "./lib/agent-governance.mjs";

const root = process.cwd();

const removeFixture = (fixture) =>
  rmSync(fixture, {
    force: true,
    recursive: true,
    maxRetries: 5,
    retryDelay: 100,
  });

const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const TEST_PRIVATE_KEYS = new Map();
const testActor = (id, independenceGroup, allowedRoles) => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  TEST_PRIVATE_KEYS.set(id, privateKey);
  return {
    id,
    independenceGroup,
    allowedRoles,
    publicKeyPem: publicKey.export({ format: "pem", type: "spki" }),
  };
};

const TEST_ACTORS = {
  schemaVersion: 2,
  actors: [
    testActor("reviewer-a", "review-organization-a", ["stage-b-reviewer"]),
    testActor("reviewer-b", "review-organization-b", ["stage-b-reviewer"]),
    testActor("approver-a", "approval-organization-a", ["promotion-approver"]),
    testActor("approver-b", "approval-organization-b", ["promotion-approver"]),
  ],
};

const signPayload = (actorId, payload) =>
  sign(null, Buffer.from(canonicalJson(payload)), TEST_PRIVATE_KEYS.get(actorId)).toString("base64");

const canonicalSha256 = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");

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

const prepareValidStageBEvidence = (fixture, requestedSkillId, options = {}) => {
  const { manifest, lock, fixtureOracle } = loadAgentGovernance(fixture);
  const candidateSkill = manifest.skills.find(
    (skill) => skill.id === requestedSkillId || (!requestedSkillId && skill.source.type !== "project-internal"),
  );
  const candidateLock = lock.skills.find((skill) => skill.id === candidateSkill.id);
  const resultRoot = `docs/agents/pilots/results/stage-b-${candidateSkill.id}`;
  const fixtureIds = ["F1", "F2", "F3", "F4", "F5"];
  const evaluatedCommit = options.evaluatedCommit ?? "1".repeat(40);
  const fixtureOracleSha256 = sha256(path.join(fixture, "docs/agents/pilots/fixture-oracle.json"));
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
        const runKey = `${fixtureId}:${arm}:${repeat}`;
        const detectedDefects =
          arm === "baseline"
            ? oracleById.get(fixtureId).criticalDefectIds.slice(0, 3)
            : oracleById.get(fixtureId).criticalDefectIds;
        const findingLines = detectedDefects.map(
          (defectId, index) =>
            `Finding ${index + 1} ${defectId}: observed evidence for ${candidateSkill.id} in ${runKey}.`,
        );
        const outputText = findingLines.join("\n");
        let cursor = 0;
        const observations = findingLines.map((excerpt, index) => {
          const start = cursor;
          cursor += excerpt.length + 1;
          return { defectId: detectedDefects[index], start, end: start + excerpt.length, excerpt };
        });
        const output = writeJsonArtifact(
          fixture,
          `${resultRoot}/outputs/${fixtureId}-${arm}-${repeat}.json`,
          {
            schemaVersion: 1,
            runKey,
            evaluatedCommit,
            candidateSkillId: candidateSkill.id,
            candidateSkillContentSha256: candidateLock.contentSha256,
            outputText,
            observations,
          },
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
  const outputByPath = new Map(outputs.map((output) => [output.path, output]));
  const outputBindings = runs
    .map((run) => ({
      runKey: `${run.fixtureId}:${run.arm}:${run.repeat}`,
      outputArtifact: run.outputArtifact,
      outputSha256: outputByPath.get(run.outputArtifact).sha256,
    }))
    .sort((left, right) => left.runKey.localeCompare(right.runKey));
  const reviewerSheets = ["reviewer-a", "reviewer-b"].map((reviewer, reviewerIndex) => {
    const sheet = {
      schemaVersion: 4,
      candidateSkillId: candidateSkill.id,
      evaluatedCommit,
      candidateSkillContentSha256: candidateLock.contentSha256,
      fixtureOracleSha256,
      outputBindings,
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
    };
    sheet.signature = signPayload(reviewer, sheet);
    return writeJsonArtifact(fixture, `${resultRoot}/reviews/${reviewer}.json`, sheet);
  });
  const report = {
    schemaVersion: 5,
    candidateSkillId: candidateSkill.id,
    candidateSkillContentSha256: candidateLock.contentSha256,
    fixtureOracleSha256,
    evaluatedCommit,
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
  manifest.branchPolicy.stageBQualificationMode = "independent-review";
  manifest.branchPolicy.stageBEvidenceBySkill = Object.fromEntries(
    stageList.map((stage) => [stage.candidateSkill.id, stage.relativePath]),
  );
  for (const stage of stageList) {
    manifest.skills.find((skill) => skill.id === stage.candidateSkill.id).status = "active";
  }
};

const prepareAllStageBEvidence = (fixture, options = {}) => {
  const { manifest } = loadAgentGovernance(fixture);
  return manifest.skills
    .filter((skill) => skill.source.type !== "project-internal")
    .map((skill) => prepareValidStageBEvidence(fixture, skill.id, options));
};

const prepareValidPromotionEvidence = (fixture, stages, options = {}) => {
  const stageList = Array.isArray(stages) ? stages : [stages];
  const resultRoot = stageList[0].resultRoot;
  const reviewedCommit = options.reviewedCommit ?? "1".repeat(40);
  const gateResults = {};
  for (const gate of [
    "independent-review",
    "governance-check",
    "project-memory-check",
    "relevant-product-tests",
    "non-mutating-gates",
  ]) {
    const command = `verify ${gate}`;
    const stdout = `Verified ${gate} successfully for reviewed commit ${reviewedCommit}.`;
    gateResults[gate] = {
      status: "passed",
      command,
      artifact: writeJsonArtifact(fixture, `${resultRoot}/promotion/${gate}.json`, {
        schemaVersion: 1,
        gateId: gate,
        reviewedCommit,
        command,
        exitCode: 0,
        startedAt: "2026-08-22T10:00:00.000Z",
        finishedAt: "2026-08-22T10:00:01.000Z",
        stdout,
        stdoutSha256: createHash("sha256").update(stdout).digest("hex"),
      }),
    };
  }
  const report = {
    schemaVersion: 5,
    reviewedCommit,
    stageBEvidenceBySkill: Object.fromEntries(
      stageList.map((stage) => [stage.candidateSkill.id, stage.relativePath]),
    ),
    gateResults,
  };
  const approvalPayload = structuredClone(report);
  report.approvals = ["approver-a", "approver-b"].map((actorId) => ({
    actorId,
    signature: signPayload(actorId, approvalPayload),
  }));
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
    // Mutation tests start from the pre-qualification baseline so the real
    // owner-qualified manifest cannot leak unrelated evidence requirements
    // into independent-review scenarios.
    manifest.branchPolicy.stageBPilotStatus = "pending";
    delete manifest.branchPolicy.stageBQualificationMode;
    delete manifest.branchPolicy.stageBEvidenceBySkill;
    for (const skill of manifest.skills) {
      if (skill.source.type !== "project-internal") skill.status = "experimental";
    }
    Object.assign(actors, structuredClone(TEST_ACTORS));
    const trustedActorRegistrySha256 = canonicalSha256(actors);
    prepare?.(fixture, manifest, lock, actors, fixtureOracle);
    mutate?.(manifest, lock, actors, fixtureOracle);
    return validateAgentGovernance(fixture, {
      manifest,
      lock,
      actors,
      fixtureOracle,
      trustedActorRegistrySha256,
      skipRepositoryInspection: true,
      skipSourceCommitVerification: true,
      ...validationOverrides,
    });
  } finally {
    removeFixture(fixture);
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
    removeFixture(registered);
    symlinkSync(outside, registered, "dir");
  });
  assert.match(errors.join("\n"), /resolves outside \.agents\/skills/);
});

test("a symlinked registered skills root fails closed", () => {
  const errors = validateFixture(undefined, (fixture) => {
    const skillsRoot = path.join(fixture, ".agents/skills");
    const outside = path.join(fixture, "outside-skills-root");
    cpSync(skillsRoot, outside, { recursive: true });
    removeFixture(skillsRoot);
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
    manifest.branchPolicy.stageBQualificationMode = "independent-review";
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

test("Stage B rejects placeholder text instead of structured output evidence", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      const artifact = stage.report.artifacts.outputs[0];
      const absolute = path.join(manifest.__fixtureRoot, artifact.path);
      writeFileSync(absolute, "Generic output evidence with no structured defect observations.\n");
      artifact.sha256 = sha256(absolute);
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      delete manifest.__fixtureRoot;
      applyStageB(manifest, stage);
    },
    (fixture, manifest) => {
      manifest.__fixtureRoot = fixture;
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /output must contain structured JSON/);
});

test("Stage B rejects a forged reviewer signature", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      const artifact = stage.report.artifacts.reviewerSheets[0];
      const absolute = path.join(manifest.__fixtureRoot, artifact.path);
      const sheet = JSON.parse(readFileSync(absolute, "utf8"));
      sheet.signature = Buffer.from("forged-review").toString("base64");
      writeFileSync(absolute, `${JSON.stringify(sheet, null, 2)}\n`);
      artifact.sha256 = sha256(absolute);
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      delete manifest.__fixtureRoot;
      applyStageB(manifest, stage);
    },
    (fixture, manifest) => {
      manifest.__fixtureRoot = fixture;
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /reviewer sheet reviewer-a signature is invalid/);
});

test("Stage B rejects replayed reviewer sheets after an output artifact changes", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => {
      const artifact = stage.report.artifacts.outputs[0];
      const absolute = path.join(manifest.__fixtureRoot, artifact.path);
      const output = JSON.parse(readFileSync(absolute, "utf8"));
      output.outputText = `${output.outputText}\nAdditional evidence added after review.`;
      writeFileSync(absolute, `${JSON.stringify(output, null, 2)}\n`);
      artifact.sha256 = sha256(absolute);
      writeFileSync(stage.absolutePath, `${JSON.stringify(stage.report, null, 2)}\n`);
      delete manifest.__fixtureRoot;
      applyStageB(manifest, stage);
    },
    (fixture, manifest) => {
      manifest.__fixtureRoot = fixture;
      stage = prepareValidStageBEvidence(fixture);
    },
  );
  assert.match(errors.join("\n"), /reviewer sheet output bindings mismatch/);
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

test("actor registry rejects whitespace aliases for independence groups", () => {
  const errors = validateFixture((_manifest, _lock, actors) => {
    actors.actors[1].independenceGroup = ` ${actors.actors[1].independenceGroup} `;
  });
  assert.match(errors.join("\n"), /actor registry independenceGroup is missing/);
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
    mkdirSync(path.join(fixture, "src"), { recursive: true });
    writeFileSync(path.join(fixture, "src", "product-runtime.ts"), "export const dirty = true;\n");

    const dirty = getDirtyGovernedSurface(fixture);
    assert.match(dirty, /\.agents\/tracked\.json/);
    assert.match(dirty, /docs\/agents\/untracked\.md/);
    assert.match(dirty, /src\/product-runtime\.ts/);
  } finally {
    removeFixture(fixture);
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

test("reviewed commit freshness allows later evidence commits but rejects later candidate changes", () => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), "yorso-reviewed-commit-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: fixture });
    execFileSync("git", ["config", "user.email", "gate@example.test"], { cwd: fixture });
    execFileSync("git", ["config", "user.name", "Gate Test"], { cwd: fixture });
    mkdirSync(path.join(fixture, "src"), { recursive: true });
    writeFileSync(path.join(fixture, "src/candidate.ts"), "export const candidate = true;\n");
    execFileSync("git", ["add", "."], { cwd: fixture });
    execFileSync("git", ["commit", "-qm", "candidate"], { cwd: fixture });
    const candidateCommit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: fixture,
      encoding: "utf8",
    }).trim();

    mkdirSync(path.join(fixture, "docs/agents/pilots/results"), { recursive: true });
    mkdirSync(path.join(fixture, "docs/project-memory"), { recursive: true });
    writeFileSync(path.join(fixture, "docs/agents/pilots/results/evidence.json"), "{}\n");
    writeFileSync(path.join(fixture, "docs/project-memory/WORKLOG.md"), "Evidence recorded.\n");
    execFileSync("git", ["add", "."], { cwd: fixture });
    execFileSync("git", ["commit", "-qm", "evidence attestation"], { cwd: fixture });

    const evidenceErrors = [];
    validateReviewedCommit({
      root: fixture,
      commit: candidateCommit,
      label: "real Git evidence",
      errors: evidenceErrors,
      skipRepositoryInspection: false,
    });
    assert.deepEqual(evidenceErrors, []);

    writeFileSync(path.join(fixture, "src/candidate.ts"), "export const candidate = false;\n");
    execFileSync("git", ["add", "."], { cwd: fixture });
    execFileSync("git", ["commit", "-qm", "candidate changed after review"], { cwd: fixture });
    const staleErrors = [];
    validateReviewedCommit({
      root: fixture,
      commit: candidateCommit,
      label: "real Git evidence",
      errors: staleErrors,
      skipRepositoryInspection: false,
    });
    assert.match(staleErrors.join("\n"), /reviewed candidate surface changed/);
  } finally {
    removeFixture(fixture);
  }
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

test("repository-backed Stage B and promotion evidence satisfy main policy without inspection bypass", () => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), "yorso-main-promotion-"));
  try {
    cpSync(path.join(root, ".agents"), path.join(fixture, ".agents"), { recursive: true });
    mkdirSync(path.join(fixture, "docs/agents/pilots"), { recursive: true });
    cpSync(
      path.join(root, "docs/agents/role-skill-provenance-matrix.md"),
      path.join(fixture, "docs/agents/role-skill-provenance-matrix.md"),
    );
    cpSync(path.join(root, "docs/agents/pilots/fixtures"), path.join(fixture, "docs/agents/pilots/fixtures"), {
      recursive: true,
    });
    cpSync(
      path.join(root, "docs/agents/pilots/fixture-oracle.json"),
      path.join(fixture, "docs/agents/pilots/fixture-oracle.json"),
    );
    execFileSync("git", ["init", "-q"], { cwd: fixture });
    execFileSync("git", ["config", "user.email", "gate@example.test"], { cwd: fixture });
    execFileSync("git", ["config", "user.name", "Gate Test"], { cwd: fixture });
    execFileSync("git", ["remote", "add", "origin", "https://github.com/sahchandansah1201-glitch/yorso-commerce-hub.git"], {
      cwd: fixture,
    });
    execFileSync("git", ["add", "."], { cwd: fixture });
    execFileSync("git", ["commit", "-qm", "base"], { cwd: fixture });
    const baseCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: fixture, encoding: "utf8" }).trim();
    execFileSync("git", ["update-ref", "refs/remotes/origin/main", baseCommit], { cwd: fixture });

    const { manifest, actors } = loadAgentGovernance(fixture);
    Object.assign(actors, structuredClone(TEST_ACTORS));
    const adaptedSkills = manifest.skills.filter((skill) => skill.source.type !== "project-internal");
    manifest.branchPolicy.baseCommit = baseCommit;
    manifest.branchPolicy.stageBPilotStatus = "passed";
    manifest.branchPolicy.stageBQualificationMode = "independent-review";
    manifest.branchPolicy.stageBEvidenceBySkill = Object.fromEntries(
      adaptedSkills.map((skill) => [
        skill.id,
        `docs/agents/pilots/results/stage-b-${skill.id}/stage-b.json`,
      ]),
    );
    manifest.branchPolicy.promotionEvidence =
      `docs/agents/pilots/results/stage-b-${adaptedSkills[0].id}/promotion.json`;
    for (const skill of manifest.skills) skill.status = "active";
    writeFileSync(path.join(fixture, ".agents/manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    writeFileSync(path.join(fixture, ".agents/actors.json"), `${JSON.stringify(actors, null, 2)}\n`);
    execFileSync("git", ["add", "."], { cwd: fixture });
    execFileSync("git", ["commit", "-qm", "reviewed candidate"], { cwd: fixture });
    const reviewedCommit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: fixture,
      encoding: "utf8",
    }).trim();

    const stages = prepareAllStageBEvidence(fixture, { evaluatedCommit: reviewedCommit });
    prepareValidPromotionEvidence(fixture, stages, { reviewedCommit });
    execFileSync("git", ["add", "."], { cwd: fixture });
    execFileSync("git", ["commit", "-qm", "signed evidence attestation"], { cwd: fixture });

    const loaded = loadAgentGovernance(fixture);
    const errors = validateAgentGovernance(fixture, {
      ...loaded,
      currentBranch: "main",
      trustedActorRegistrySha256: canonicalSha256(loaded.actors),
      skipSourceCommitVerification: true,
    });
    assert.deepEqual(errors, []);
  } finally {
    removeFixture(fixture);
  }
});

test("passed Stage B rejects an untrusted actor registry", () => {
  let stage;
  const errors = validateFixture(
    (manifest) => applyStageB(manifest, stage),
    (fixture) => {
      stage = prepareValidStageBEvidence(fixture);
    },
    { trustedActorRegistrySha256: undefined },
  );
  assert.match(errors.join("\n"), /trusted actor registry SHA-256 is required/);
});

test("main promotion rejects gate output not bound to the declared command", () => {
  let stages;
  let promotion;
  const errors = validateFixture(
    (manifest) => {
      applyStageB(manifest, stages);
      manifest.branchPolicy.promotionEvidence = promotion.relativePath;
      for (const skill of manifest.skills) skill.status = "active";
      const result = promotion.report.gateResults["governance-check"];
      const absolute = path.join(manifest.__fixtureRoot, result.artifact.path);
      const artifact = JSON.parse(readFileSync(absolute, "utf8"));
      artifact.command = "different command";
      writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
      result.artifact.sha256 = sha256(absolute);
      writeFileSync(promotion.absolutePath, `${JSON.stringify(promotion.report, null, 2)}\n`);
      delete manifest.__fixtureRoot;
    },
    (fixture, manifest) => {
      manifest.__fixtureRoot = fixture;
      stages = prepareAllStageBEvidence(fixture);
      promotion = prepareValidPromotionEvidence(fixture, stages);
    },
    { currentBranch: "main" },
  );
  assert.match(errors.join("\n"), /artifact is not bound to its commit, command and successful output/);
});

test("main promotion rejects duplicate approvers and reused gate artifacts", () => {
  let stages;
  let promotion;
  const errors = validateFixture(
    (manifest) => {
      applyStageB(manifest, stages);
      manifest.branchPolicy.promotionEvidence = promotion.relativePath;
      for (const skill of manifest.skills) skill.status = "active";
      promotion.report.approvals = [
        { actorId: "same-approver", signature: "invalid" },
        { actorId: "same-approver ", signature: "invalid" },
      ];
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
