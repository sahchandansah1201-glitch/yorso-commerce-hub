import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildStageBPlan,
  canonicalSha256,
  getStageBPilotStatus,
  prepareBlindReviewPacket,
  registerActor,
} from "./lib/stage-b-pilot.mjs";

const root = process.cwd();
const candidate = {
  id: "candidate-skill",
  path: ".agents/skills/candidate-skill",
};
const candidateSkillContentSha256 = "a".repeat(64);
const evaluatedCommit = "b".repeat(40);
const fixtures = ["F1", "F2", "F3", "F4", "F5"].map((id) => ({ id, path: `fixtures/${id}.md` }));

const deterministicBytes = (() => {
  let value = 0;
  return (size) => {
    const bytes = Buffer.alloc(size);
    bytes.writeUInt32BE(value, Math.max(0, size - 4));
    value += 1;
    return bytes;
  };
})();

test("buildStageBPlan creates 30 unique randomized arm tuples with executable output identity", () => {
  const plan = buildStageBPlan({
    pilotId: "pilot-one",
    candidateSkill: candidate,
    candidateSkillContentSha256,
    evaluatedCommit,
    fixtures,
    randomBytesFn: deterministicBytes,
  });

  assert.equal(plan.tasks.length, 30);
  assert.equal(new Set(plan.tasks.map((task) => task.taskId)).size, 30);
  assert.equal(new Set(plan.tasks.map((task) => task.runKey)).size, 30);
  for (const fixtureId of ["F1", "F2", "F3", "F4", "F5"]) {
    for (const arm of ["baseline", "candidate"]) {
      assert.deepEqual(
        plan.tasks.filter((task) => task.fixtureId === fixtureId && task.setup.mode === arm).map((task) => task.repeat).sort(),
        [1, 2, 3],
      );
    }
  }
  for (const task of plan.tasks) {
    assert.equal(task.evaluatedCommit, evaluatedCommit);
    assert.equal(task.candidateSkillId, candidate.id);
    assert.equal(task.candidateSkillContentSha256, candidateSkillContentSha256);
    assert.equal(task.outputContract.requiredFields.includes("outputText"), true);
  }
});

test("prepareBlindReviewPacket strips candidate and arm identity while retaining oracle defects", () => {
  const workspace = mkdtempSync(path.join(os.tmpdir(), "yorso-stage-b-review-"));
  const plan = buildStageBPlan({
    pilotId: "pilot-review",
    candidateSkill: candidate,
    candidateSkillContentSha256,
    evaluatedCommit,
    fixtures,
  });
  const fixtureOracle = JSON.parse(readFileSync(path.join(root, "docs/agents/pilots/fixture-oracle.json"), "utf8"));
  writeFileSync(
    path.join(workspace, "coordinator.json"),
    `${JSON.stringify({ ...plan.coordinator, fixtureOracleSha256: "c".repeat(64) }, null, 2)}\n`,
  );
  writeFileSync(
    path.join(workspace, "review-queue.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      pilotId: "pilot-review",
      items: plan.tasks.map((task) => ({
        reviewItemId: task.taskId,
        fixtureId: task.fixtureId,
        promptPath: task.promptPath,
        expectedOutputPath: task.outputPath,
      })),
    }, null, 2)}\n`,
  );
  mkdirSync(path.join(workspace, "outputs"));
  mkdirSync(path.join(workspace, "reviews"));
  for (const task of plan.tasks) {
    writeFileSync(
      path.join(workspace, task.outputPath),
      `${JSON.stringify({
        schemaVersion: 1,
        runKey: task.runKey,
        evaluatedCommit,
        candidateSkillId: candidate.id,
        candidateSkillContentSha256,
        outputText: `Detailed independent response for ${task.fixtureId} and task ${task.taskId}.`,
      }, null, 2)}\n`,
    );
  }

  const packet = prepareBlindReviewPacket({ root, workspace });
  const serialized = readFileSync(path.join(packet, "manifest.json"), "utf8");
  const manifest = JSON.parse(serialized);
  assert.equal(serialized.includes(candidate.id), false);
  assert.equal(serialized.includes("baseline"), false);
  assert.equal(serialized.includes("candidate"), false);
  assert.equal(serialized.includes(evaluatedCommit), false);
  assert.equal(serialized.includes("runKey"), false);
  assert.equal(manifest.items.length, 30);
  assert.deepEqual(
    manifest.items.find((item) => item.fixtureId === "F1").criticalDefectIds,
    fixtureOracle.fixtures.find((fixture) => fixture.id === "F1").criticalDefectIds,
  );
});

test("registerActor stores only a valid Ed25519 public key and returns the registry digest", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "yorso-stage-b-actor-"));
  mkdirSync(path.join(tempRoot, ".agents"));
  writeFileSync(path.join(tempRoot, ".agents/actors.json"), '{"schemaVersion":2,"actors":[]}\n');
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" });
  const publicKeyFile = path.join(tempRoot, "reviewer.pub.pem");
  writeFileSync(publicKeyFile, publicKeyPem);

  const result = registerActor({
    root: tempRoot,
    id: "reviewer.one",
    independenceGroup: "quality-a",
    allowedRoles: ["stage-b-reviewer"],
    publicKeyFile,
  });
  const registryText = readFileSync(path.join(tempRoot, ".agents/actors.json"), "utf8");
  const registry = JSON.parse(registryText);
  assert.equal(registryText.includes(privateKeyPem.toString()), false);
  assert.equal(registry.actors[0].publicKeyPem.includes("PUBLIC KEY"), true);
  assert.equal(result.registrySha256, canonicalSha256(registry));
});

test("status remains fail-closed without real outputs, reviewers, signatures and trusted registry", () => {
  const workspace = mkdtempSync(path.join(os.tmpdir(), "yorso-stage-b-status-"));
  mkdirSync(path.join(workspace, "outputs"));
  mkdirSync(path.join(workspace, "reviews"));
  writeFileSync(
    path.join(workspace, "coordinator.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      pilotId: "pilot-status",
      candidateSkillId: "yorso-multilingual-ux-copywriter-agent",
      evaluatedCommit,
      taskCount: 30,
    }, null, 2)}\n`,
  );
  const status = getStageBPilotStatus({ root, workspace, env: {} });
  assert.equal(status.readyForReview, false);
  assert.equal(status.readyForQualification, false);
  assert.equal(status.blockers.includes("missing outputs: 30"), true);
  assert.equal(status.blockers.includes("missing registered Stage B reviewers: 2"), true);
  assert.equal(status.blockers.includes("missing signed reviewer sheets: 2"), true);
  assert.equal(status.blockers.includes("YORSO_TRUSTED_ACTOR_REGISTRY_SHA256 is not set"), true);
});
