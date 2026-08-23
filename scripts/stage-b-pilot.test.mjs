import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assignStageBExecutorTask,
  buildStageBPlan,
  canonicalSha256,
  getStageBPilotStatus,
  prepareNextStageBExecutorTask,
  prepareBlindReviewPacket,
  prepareStageBSubmissionPayload,
  registerActor,
  submitStageBOutput,
} from "./lib/stage-b-pilot.mjs";

const root = process.cwd();
const candidate = {
  id: "candidate-skill",
  path: ".agents/skills/candidate-skill",
};
const candidateSkillContentSha256 = "a".repeat(64);
const evaluatedCommit = "b".repeat(40);
const fixtures = ["F1", "F2", "F3", "F4", "F5"].map((id) => ({ id, path: `fixtures/${id}.md` }));

const actualGovernance = {
  manifest: JSON.parse(readFileSync(path.join(root, ".agents/manifest.json"), "utf8")),
  lock: JSON.parse(readFileSync(path.join(root, ".agents/skills.lock.json"), "utf8")),
  fixtureOracle: JSON.parse(readFileSync(path.join(root, "docs/agents/pilots/fixture-oracle.json"), "utf8")),
};
const actualCandidate = actualGovernance.manifest.skills.find(
  (skill) => skill.id === "yorso-multilingual-ux-copywriter-agent",
);
const actualCandidateHash = actualGovernance.lock.skills.find(
  (skill) => skill.id === actualCandidate.id,
).contentSha256;
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

const runGit = (repository, args) =>
  execFileSync("git", args, { cwd: repository, encoding: "utf8" }).trim();

const createExecutorWorkspace = () => {
  const repository = mkdtempSync(path.join(os.tmpdir(), "yorso-stage-b-repository-"));
  mkdirSync(path.join(repository, ".agents/skills"), { recursive: true });
  mkdirSync(path.join(repository, "docs/agents"), { recursive: true });
  cpSync(path.join(root, ".agents/manifest.json"), path.join(repository, ".agents/manifest.json"));
  cpSync(path.join(root, ".agents/skills.lock.json"), path.join(repository, ".agents/skills.lock.json"));
  cpSync(
    path.join(root, actualCandidate.path),
    path.join(repository, actualCandidate.path),
    { recursive: true },
  );
  cpSync(path.join(root, "docs/agents/pilots"), path.join(repository, "docs/agents/pilots"), { recursive: true });

  const executorKeys = new Map();
  const actors = ["executor.one", "executor.two", "executor.review"].map((id, index) => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    executorKeys.set(id, privateKey);
    return {
      id,
      independenceGroup: `execution-${index + 1}`,
      allowedRoles: ["stage-b-executor"],
      publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
    };
  });
  writeFileSync(
    path.join(repository, ".agents/actors.json"),
    `${JSON.stringify({ schemaVersion: 2, actors }, null, 2)}\n`,
  );

  runGit(repository, ["init", "--quiet"]);
  runGit(repository, ["config", "user.name", "Stage B test"]);
  runGit(repository, ["config", "user.email", "stage-b-test@example.invalid"]);
  runGit(repository, ["add", "."]);
  runGit(repository, ["commit", "--quiet", "-m", "Stage B test fixture"]);
  const repositoryCommit = runGit(repository, ["rev-parse", "HEAD"]);

  const workspace = mkdtempSync(path.join(os.tmpdir(), "yorso-stage-b-executor-"));
  const plan = buildStageBPlan({
    pilotId: "pilot-executor",
    candidateSkill: actualCandidate,
    candidateSkillContentSha256: actualCandidateHash,
    evaluatedCommit: repositoryCommit,
    fixtures: actualGovernance.fixtureOracle.fixtures,
    randomBytesFn: deterministicBytes,
  });
  mkdirSync(path.join(workspace, "tasks"));
  mkdirSync(path.join(workspace, "outputs"));
  mkdirSync(path.join(workspace, "reviews"));
  writeFileSync(path.join(workspace, "coordinator.json"), `${JSON.stringify(plan.coordinator, null, 2)}\n`);
  for (const task of plan.tasks) {
    writeFileSync(path.join(workspace, "tasks", `${task.taskId}.json`), `${JSON.stringify(task, null, 2)}\n`);
  }
  return { root: repository, workspace, plan, executorKeys };
};

const prepareSignedSubmission = ({
  root: fixtureRoot,
  workspace,
  task,
  executorId,
  executorKeys,
  responseFile,
}) => {
  assignStageBExecutorTask({ root: fixtureRoot, workspace, taskId: task.taskId, executorId });
  const payloadFile = path.join(workspace, `${task.taskId}.payload.json`);
  const signatureFile = path.join(workspace, `${task.taskId}.signature.bin`);
  const prepared = prepareStageBSubmissionPayload({
    root: fixtureRoot,
    workspace,
    taskId: task.taskId,
    executorId,
    responseFile,
    payloadFile,
  });
  assert.equal(readFileSync(payloadFile, "utf8"), canonicalJson(prepared.payload));
  assert.equal(prepared.payloadSha256, canonicalSha256(prepared.payload));
  writeFileSync(
    signatureFile,
    sign(null, readFileSync(payloadFile), executorKeys.get(executorId)),
  );
  return { ...prepared, payloadFile, signatureFile };
};

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

test("executor packets isolate baseline from candidate metadata and pin candidate materials to the evaluated commit", () => {
  const { root: fixtureRoot, workspace, plan } = createExecutorWorkspace();
  const baselineTask = plan.tasks.find((task) => task.setup.mode === "baseline");
  const candidateTask = plan.tasks.find((task) => task.setup.mode === "candidate");

  const baseline = prepareNextStageBExecutorTask({ root: fixtureRoot, workspace, taskId: baselineTask.taskId });
  const baselineText = readFileSync(baseline.packetPath, "utf8");
  assert.equal(baselineText.includes(actualCandidate.id), false);
  assert.equal(baselineText.includes(actualCandidate.path), false);
  assert.equal(baselineText.includes(actualCandidateHash), false);
  assert.equal(baselineText.toLowerCase().includes("candidate"), false);
  assert.equal(baselineText.toLowerCase().includes("experiment"), false);
  assert.equal(baseline.packet.skillBundle, undefined);
  assert.match(baseline.packet.fixture.prompt, /Given an existing region/);

  const candidatePacket = prepareNextStageBExecutorTask({ root: fixtureRoot, workspace, taskId: candidateTask.taskId });
  assert.equal(candidatePacket.packet.skillBundle.skillId, actualCandidate.id);
  assert.equal(candidatePacket.packet.skillBundle.contentSha256, actualCandidateHash);
  assert.equal(candidatePacket.packet.skillBundle.files.some((file) => file.path === "SKILL.md"), true);
  assert.equal(candidatePacket.packet.skillBundle.files.some((file) => file.path === "references/ui-copy-matrix.md"), true);
});

test("submission wraps raw executor text with verified identity and rejects packet tampering or overwrite", () => {
  const { root: fixtureRoot, workspace, plan, executorKeys } = createExecutorWorkspace();
  const task = plan.tasks[0];
  const responseFile = path.join(workspace, "response.txt");
  writeFileSync(responseFile, "A complete executor response with enough detail for independent review.\n");
  const signed = prepareSignedSubmission({
    root: fixtureRoot,
    workspace,
    task,
    executorId: "executor.one",
    executorKeys,
    responseFile,
  });

  const submitted = submitStageBOutput({
    root: fixtureRoot,
    workspace,
    taskId: task.taskId,
    executorId: "executor.one",
    responseFile,
    signatureFile: signed.signatureFile,
  });
  const output = JSON.parse(readFileSync(submitted.outputPath, "utf8"));
  assert.equal(output.runKey, task.runKey);
  assert.equal(output.executor.id, "executor.one");
  assert.match(output.executor.packetSha256, /^[0-9a-f]{64}$/);
  assert.match(output.executor.responseSha256, /^[0-9a-f]{64}$/);
  assert.match(output.executor.assignmentSha256, /^[0-9a-f]{64}$/);
  assert.match(output.executor.signingPayloadSha256, /^[0-9a-f]{64}$/);
  assert.equal(Buffer.from(output.executor.signature, "base64").length > 0, true);

  assert.throws(
    () => submitStageBOutput({
      root: fixtureRoot,
      workspace,
      taskId: task.taskId,
      executorId: "executor.one",
      responseFile,
      signatureFile: signed.signatureFile,
    }),
    /already exists/,
  );

  const secondTask = plan.tasks[1];
  const second = assignStageBExecutorTask({
    root: fixtureRoot,
    workspace,
    taskId: secondTask.taskId,
    executorId: "executor.two",
  });
  const tampered = JSON.parse(readFileSync(second.packetPath, "utf8"));
  tampered.fixture.prompt = "Tampered fixture";
  writeFileSync(second.packetPath, `${JSON.stringify(tampered, null, 2)}\n`);
  assert.throws(
    () => submitStageBOutput({
      root: fixtureRoot,
      workspace,
      taskId: secondTask.taskId,
      executorId: "executor.two",
      responseFile,
      signatureFile: signed.signatureFile,
    }),
    /executor packet does not match evaluated commit/,
  );
});

test("submission rejects an unregistered and unassigned executor", () => {
  const { root: fixtureRoot, workspace, plan } = createExecutorWorkspace();
  const task = plan.tasks[0];
  const responseFile = path.join(workspace, "response-unregistered.txt");
  writeFileSync(responseFile, "A complete but untrusted executor response that must be rejected.\n");

  assert.throws(
    () => submitStageBOutput({
      root: fixtureRoot,
      workspace,
      taskId: task.taskId,
      executorId: "executor.unregistered",
      responseFile,
    }),
    /executor is not registered|task is not assigned/,
  );
});

test("assignment is identity-bound and cannot be moved to another executor", () => {
  const { root: fixtureRoot, workspace, plan } = createExecutorWorkspace();
  const task = plan.tasks[0];
  const first = assignStageBExecutorTask({
    root: fixtureRoot,
    workspace,
    taskId: task.taskId,
    executorId: "executor.one",
  });
  const repeated = assignStageBExecutorTask({
    root: fixtureRoot,
    workspace,
    taskId: task.taskId,
    executorId: "executor.one",
  });
  assert.equal(repeated.assignmentPath, first.assignmentPath);
  assert.equal(repeated.assignment.executorId, "executor.one");
  assert.throws(
    () => assignStageBExecutorTask({
      root: fixtureRoot,
      workspace,
      taskId: task.taskId,
      executorId: "executor.two",
    }),
    /already assigned to another executor/,
  );
});

test("submission rejects forged signatures and response changes after signing", () => {
  const { root: fixtureRoot, workspace, plan, executorKeys } = createExecutorWorkspace();
  const task = plan.tasks[0];
  const responseFile = path.join(workspace, "signed-response.txt");
  writeFileSync(responseFile, "A signed response that must remain byte-bound after preparation.\n");
  const signed = prepareSignedSubmission({
    root: fixtureRoot,
    workspace,
    task,
    executorId: "executor.one",
    executorKeys,
    responseFile,
  });
  const forgedSignature = path.join(workspace, "forged.signature.bin");
  writeFileSync(
    forgedSignature,
    sign(null, readFileSync(signed.payloadFile), executorKeys.get("executor.two")),
  );
  assert.throws(
    () => submitStageBOutput({
      root: fixtureRoot,
      workspace,
      taskId: task.taskId,
      executorId: "executor.one",
      responseFile,
      signatureFile: forgedSignature,
    }),
    /signature is invalid/,
  );

  writeFileSync(responseFile, "A changed response that no longer matches the previously signed payload.\n");
  assert.throws(
    () => submitStageBOutput({
      root: fixtureRoot,
      workspace,
      taskId: task.taskId,
      executorId: "executor.one",
      responseFile,
      signatureFile: signed.signatureFile,
    }),
    /signature is invalid/,
  );
});

test("prepareBlindReviewPacket strips candidate and arm identity while retaining oracle defects", () => {
  const { root: fixtureRoot, workspace, plan, executorKeys } = createExecutorWorkspace();
  const fixtureOracle = JSON.parse(readFileSync(path.join(root, "docs/agents/pilots/fixture-oracle.json"), "utf8"));
  writeFileSync(
    path.join(workspace, "review-queue.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      pilotId: plan.coordinator.pilotId,
      items: plan.tasks.map((task) => ({
        reviewItemId: task.taskId,
        fixtureId: task.fixtureId,
        promptPath: task.promptPath,
        expectedOutputPath: task.outputPath,
      })),
    }, null, 2)}\n`,
  );
  for (const task of plan.tasks) {
    const responseFile = path.join(workspace, `${task.taskId}.txt`);
    writeFileSync(responseFile, `Detailed independent response for ${task.fixtureId} and task ${task.taskId}.`);
    const signed = prepareSignedSubmission({
      root: fixtureRoot,
      workspace,
      task,
      executorId: "executor.review",
      executorKeys,
      responseFile,
    });
    submitStageBOutput({
      root: fixtureRoot,
      workspace,
      taskId: task.taskId,
      executorId: "executor.review",
      responseFile,
      signatureFile: signed.signatureFile,
    });
  }

  const packet = prepareBlindReviewPacket({ root: fixtureRoot, workspace });
  const serialized = readFileSync(path.join(packet, "manifest.json"), "utf8");
  const manifest = JSON.parse(serialized);
  assert.equal(serialized.includes(actualCandidate.id), false);
  assert.equal(serialized.includes("baseline"), false);
  assert.equal(serialized.includes("candidate"), false);
  assert.equal(serialized.includes(plan.coordinator.evaluatedCommit), false);
  assert.equal(serialized.includes("runKey"), false);
  assert.equal(manifest.items.length, 30);
  assert.deepEqual(
    manifest.items.find((item) => item.fixtureId === "F1").criticalDefectIds,
    fixtureOracle.fixtures.find((fixture) => fixture.id === "F1").criticalDefectIds,
  );
});

test("prepareBlindReviewPacket rejects a tampered executor signature", () => {
  const { root: fixtureRoot, workspace, plan, executorKeys } = createExecutorWorkspace();
  const fixtureOracle = JSON.parse(
    readFileSync(path.join(fixtureRoot, "docs/agents/pilots/fixture-oracle.json"), "utf8"),
  );
  writeFileSync(
    path.join(workspace, "review-queue.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      pilotId: plan.coordinator.pilotId,
      items: plan.tasks.map((task) => ({
        reviewItemId: task.taskId,
        fixtureId: task.fixtureId,
        promptPath: task.promptPath,
        expectedOutputPath: task.outputPath,
      })),
    }, null, 2)}\n`,
  );
  assert.equal(fixtureOracle.fixtures.length, 5);
  for (const task of plan.tasks) {
    const responseFile = path.join(workspace, `${task.taskId}.txt`);
    writeFileSync(responseFile, `Signed response for tamper review task ${task.taskId}.`);
    const signed = prepareSignedSubmission({
      root: fixtureRoot,
      workspace,
      task,
      executorId: "executor.review",
      executorKeys,
      responseFile,
    });
    submitStageBOutput({
      root: fixtureRoot,
      workspace,
      taskId: task.taskId,
      executorId: "executor.review",
      responseFile,
      signatureFile: signed.signatureFile,
    });
  }
  const tamperedTask = plan.tasks[0];
  const tamperedPath = path.join(workspace, tamperedTask.outputPath);
  const tamperedOutput = JSON.parse(readFileSync(tamperedPath, "utf8"));
  tamperedOutput.executor.signature = Buffer.from("forged-signature").toString("base64");
  writeFileSync(tamperedPath, `${JSON.stringify(tamperedOutput, null, 2)}\n`);

  assert.throws(
    () => prepareBlindReviewPacket({ root: fixtureRoot, workspace }),
    /invalid signed executor outputs|invalid Stage B output identity/,
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

test("registerActor accepts a canonical Stage B executor identity", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "yorso-stage-b-executor-actor-"));
  mkdirSync(path.join(tempRoot, ".agents"));
  writeFileSync(path.join(tempRoot, ".agents/actors.json"), '{"schemaVersion":2,"actors":[]}\n');
  const { publicKey } = generateKeyPairSync("ed25519");
  const publicKeyFile = path.join(tempRoot, "executor.pub.pem");
  writeFileSync(publicKeyFile, publicKey.export({ type: "spki", format: "pem" }));

  const result = registerActor({
    root: tempRoot,
    id: "executor.one",
    independenceGroup: "execution-a",
    allowedRoles: ["stage-b-executor"],
    publicKeyFile,
  });

  assert.deepEqual(result.actor.allowedRoles, ["stage-b-executor"]);
});

test("status remains fail-closed without real outputs, reviewers, signatures and trusted registry", () => {
  const governanceRoot = mkdtempSync(path.join(os.tmpdir(), "yorso-stage-b-status-governance-"));
  mkdirSync(path.join(governanceRoot, ".agents"), { recursive: true });
  mkdirSync(path.join(governanceRoot, "docs/agents/pilots"), { recursive: true });
  cpSync(path.join(root, ".agents/manifest.json"), path.join(governanceRoot, ".agents/manifest.json"));
  cpSync(path.join(root, ".agents/skills.lock.json"), path.join(governanceRoot, ".agents/skills.lock.json"));
  cpSync(
    path.join(root, "docs/agents/pilots/fixture-oracle.json"),
    path.join(governanceRoot, "docs/agents/pilots/fixture-oracle.json"),
  );
  writeFileSync(path.join(governanceRoot, ".agents/actors.json"), '{"schemaVersion":2,"actors":[]}\n');
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
  const status = getStageBPilotStatus({ root: governanceRoot, workspace, env: {} });
  assert.equal(status.readyForReview, false);
  assert.equal(status.readyForQualification, false);
  assert.equal(status.blockers.includes("missing executor assignments: 30"), true);
  assert.equal(status.blockers.includes("missing outputs: 30"), true);
  assert.equal(status.blockers.includes("missing registered Stage B executors: 1"), true);
  assert.equal(status.blockers.includes("missing registered Stage B reviewers: 2"), true);
  assert.equal(status.blockers.includes("missing signed reviewer sheets: 2"), true);
  assert.equal(status.blockers.includes("YORSO_TRUSTED_ACTOR_REGISTRY_SHA256 is not set"), true);
});
