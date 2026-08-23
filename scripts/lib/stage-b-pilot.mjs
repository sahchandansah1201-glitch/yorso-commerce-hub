import { createHash, createPublicKey, randomBytes, verify } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  getDirtyGovernedSurface,
  loadAgentGovernance,
  validateAgentGovernance,
} from "./agent-governance.mjs";

const PILOT_SCHEMA_VERSION = 1;
const TASK_SCHEMA_VERSION = 1;
const REVIEW_PACKET_SCHEMA_VERSION = 1;
const EXECUTOR_PACKET_SCHEMA_VERSION = 1;
const EXECUTOR_ASSIGNMENT_SCHEMA_VERSION = 1;
const EXECUTOR_SUBMISSION_SCHEMA_VERSION = 1;
const ACTOR_REGISTRY_SCHEMA_VERSION = 2;
const FIXTURE_IDS = ["F1", "F2", "F3", "F4", "F5"];
const ARMS = ["baseline", "candidate"];
const REPEATS = [1, 2, 3];
const ACTOR_ROLES = new Set(["stage-b-executor", "stage-b-reviewer", "promotion-approver"]);
const CANONICAL_ID = /^[a-z0-9][a-z0-9._-]*$/;
const SHA256 = /^[0-9a-f]{64}$/;

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

export const canonicalSha256 = (value) =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const fileSha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const textSha256 = (value) => createHash("sha256").update(value).digest("hex");

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const writeJson = (file, value) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};

const git = (root, args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

const gitBuffer = (root, args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "buffer",
    stdio: ["ignore", "pipe", "pipe"],
  });

const shuffle = (items, randomBytesFn = randomBytes) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const random = randomBytesFn(4).readUInt32BE(0);
    const target = random % (index + 1);
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
};

const assertCanonicalId = (value, label) => {
  if (typeof value !== "string" || !CANONICAL_ID.test(value)) {
    throw new Error(`${label} must use lowercase ASCII letters, digits, '.', '_' or '-'`);
  }
};

const actorRegistry = (root) => {
  const registry = readJson(path.join(root, ".agents/actors.json"));
  if (registry.schemaVersion !== ACTOR_REGISTRY_SCHEMA_VERSION || !Array.isArray(registry.actors)) {
    throw new Error("unsupported actor registry schema");
  }
  return registry;
};

const requireActorRole = ({ root, actorId, role }) => {
  assertCanonicalId(actorId, "actor id");
  const actor = actorRegistry(root).actors.find((entry) => entry.id === actorId);
  if (!actor) throw new Error(`executor is not registered: ${actorId}`);
  if (!actor.allowedRoles?.includes(role)) throw new Error(`actor lacks ${role}: ${actorId}`);
  const publicKey = createPublicKey(actor.publicKeyPem);
  if (publicKey.asymmetricKeyType !== "ed25519") throw new Error(`actor public key must use Ed25519: ${actorId}`);
  return actor;
};

const readPilotTask = ({ workspace, taskId }) => {
  assertCanonicalId(taskId, "taskId");
  const taskFile = path.join(workspace, "tasks", `${taskId}.json`);
  if (!existsSync(taskFile)) throw new Error(`unknown Stage B task: ${taskId}`);
  return readJson(taskFile);
};

const assertTaskIdentity = ({ coordinator, task }) => {
  const run = coordinator.runMap.find((entry) => entry.taskId === task.taskId);
  if (
    task.schemaVersion !== TASK_SCHEMA_VERSION ||
    !run ||
    run.runKey !== task.runKey ||
    run.arm !== task.setup?.mode ||
    task.evaluatedCommit !== coordinator.evaluatedCommit ||
    task.candidateSkillId !== coordinator.candidateSkillId ||
    task.candidateSkillContentSha256 !== coordinator.candidateSkillContentSha256
  ) {
    throw new Error(`invalid Stage B task identity: ${task.taskId}`);
  }
};

const filesAtRevision = ({ root, revision, directory }) => {
  const listing = git(root, ["ls-tree", "-r", "--name-only", revision, "--", directory]);
  if (!listing) throw new Error(`no files found at ${revision}:${directory}`);
  return listing.split("\n").filter(Boolean).sort().map((file) => ({
    path: path.posix.relative(directory, file),
    content: gitBuffer(root, ["show", `${revision}:${file}`]).toString("utf8"),
  }));
};

const hashRevisionFiles = (files) => {
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file.path);
    hash.update("\0");
    hash.update(file.content);
    hash.update("\0");
  }
  return hash.digest("hex");
};

const buildExecutorPacket = ({ root, coordinator, task }) => {
  assertTaskIdentity({ coordinator, task });
  const prompt = gitBuffer(root, ["show", `${coordinator.evaluatedCommit}:${task.promptPath}`]).toString("utf8");
  const packet = {
    schemaVersion: EXECUTOR_PACKET_SCHEMA_VERSION,
    taskId: task.taskId,
    fixture: { id: task.fixtureId, prompt },
    execution: {
      instruction:
        task.setup.mode === "candidate"
          ? "Complete the fixture using the supplied candidate skill bundle. Return only the complete response."
          : "Complete the fixture using only general capabilities and the materials in this packet. Return only the complete response.",
      minimumResponseCharacters: 20,
    },
  };

  if (task.setup.mode === "candidate") {
    const files = filesAtRevision({
      root,
      revision: coordinator.evaluatedCommit,
      directory: coordinator.candidateSkillPath,
    });
    const contentSha256 = hashRevisionFiles(files);
    if (contentSha256 !== coordinator.candidateSkillContentSha256) {
      throw new Error("candidate skill bundle does not match the locked evaluated commit");
    }
    packet.skillBundle = {
      skillId: coordinator.candidateSkillId,
      contentSha256,
      files,
    };
  }
  return packet;
};

export const prepareNextStageBExecutorTask = ({ root, workspace, taskId }) => {
  const coordinator = readJson(path.join(workspace, "coordinator.json"));
  const tasks = readdirSync(path.join(workspace, "tasks"))
    .filter((name) => name.endsWith(".json"))
    .map((name) => readJson(path.join(workspace, "tasks", name)))
    .sort((left, right) => left.sequence - right.sequence);
  const task = taskId
    ? readPilotTask({ workspace, taskId })
    : tasks.find((entry) => !existsSync(path.join(workspace, entry.outputPath)));
  if (!task) throw new Error("all Stage B executor tasks already have outputs");
  if (existsSync(path.join(workspace, task.outputPath))) throw new Error(`Stage B output already exists: ${task.outputPath}`);

  const packet = buildExecutorPacket({ root, coordinator, task });
  const packetPath = path.join(workspace, "executor-packets", `${task.taskId}.json`);
  if (existsSync(packetPath)) {
    const existing = readJson(packetPath);
    if (canonicalSha256(existing) !== canonicalSha256(packet)) {
      throw new Error(`executor packet does not match evaluated commit: ${task.taskId}`);
    }
  } else {
    writeJson(packetPath, packet);
  }
  return { task, packet, packetPath, packetSha256: canonicalSha256(packet) };
};

const assignmentFile = (workspace, taskId) => path.join(workspace, "assignments", `${taskId}.json`);

export const assignStageBExecutorTask = ({ root, workspace, taskId, executorId }) => {
  const actor = requireActorRole({ root, actorId: executorId, role: "stage-b-executor" });
  const coordinator = readJson(path.join(workspace, "coordinator.json"));
  const prepared = prepareNextStageBExecutorTask({ root, workspace, taskId });
  const assignment = {
    schemaVersion: EXECUTOR_ASSIGNMENT_SCHEMA_VERSION,
    pilotId: coordinator.pilotId,
    taskId: prepared.task.taskId,
    executorId: actor.id,
    evaluatedCommit: coordinator.evaluatedCommit,
    packetSha256: prepared.packetSha256,
  };
  const file = assignmentFile(workspace, prepared.task.taskId);
  if (existsSync(file)) {
    const existing = readJson(file);
    if (canonicalSha256(existing) !== canonicalSha256(assignment)) {
      throw new Error(`Stage B task is already assigned to another executor: ${prepared.task.taskId}`);
    }
  } else {
    writeJson(file, assignment);
  }
  return { ...prepared, actor, assignment, assignmentPath: file };
};

const requireExecutorAssignment = ({ root, workspace, taskId, executorId, prepared }) => {
  const actor = requireActorRole({ root, actorId: executorId, role: "stage-b-executor" });
  const coordinator = readJson(path.join(workspace, "coordinator.json"));
  const file = assignmentFile(workspace, taskId);
  if (!existsSync(file)) throw new Error(`Stage B task is not assigned: ${taskId}`);
  const assignment = readJson(file);
  if (
    assignment.schemaVersion !== EXECUTOR_ASSIGNMENT_SCHEMA_VERSION ||
    assignment.pilotId !== coordinator.pilotId ||
    assignment.taskId !== taskId ||
    assignment.executorId !== executorId ||
    assignment.evaluatedCommit !== prepared.task.evaluatedCommit ||
    assignment.packetSha256 !== prepared.packetSha256
  ) {
    throw new Error(`Stage B task assignment does not match executor or packet: ${taskId}`);
  }
  return { actor, assignment };
};

export const prepareStageBSubmissionPayload = ({
  root,
  workspace,
  taskId,
  executorId,
  responseFile,
  payloadFile,
}) => {
  const prepared = prepareNextStageBExecutorTask({ root, workspace, taskId });
  const { actor, assignment } = requireExecutorAssignment({ root, workspace, taskId, executorId, prepared });
  const outputText = readFileSync(responseFile, "utf8").trim();
  if (outputText.length < 20) throw new Error("Stage B executor response must contain at least 20 characters");
  const payload = {
    schemaVersion: EXECUTOR_SUBMISSION_SCHEMA_VERSION,
    pilotId: assignment.pilotId,
    taskId,
    executorId,
    evaluatedCommit: assignment.evaluatedCommit,
    packetSha256: assignment.packetSha256,
    responseSha256: textSha256(outputText),
  };
  if (payloadFile) {
    mkdirSync(path.dirname(payloadFile), { recursive: true });
    writeFileSync(payloadFile, canonicalJson(payload));
  }
  return {
    payload,
    payloadSha256: canonicalSha256(payload),
    outputText,
    prepared,
    actor,
    assignment,
  };
};

export const submitStageBOutput = ({ root, workspace, taskId, executorId, responseFile, signatureFile }) => {
  assertCanonicalId(executorId, "executor id");
  const task = readPilotTask({ workspace, taskId });
  const outputPath = path.join(workspace, task.outputPath);
  if (existsSync(outputPath)) throw new Error(`Stage B output already exists: ${task.outputPath}`);
  const submission = prepareStageBSubmissionPayload({ root, workspace, taskId, executorId, responseFile });
  const { prepared, outputText, payload } = submission;
  const existingPacket = readJson(prepared.packetPath);
  if (canonicalSha256(existingPacket) !== prepared.packetSha256) {
    throw new Error(`executor packet does not match evaluated commit: ${taskId}`);
  }
  if (!signatureFile) throw new Error("Stage B executor signature file is required");
  const signature = readFileSync(signatureFile);
  if (!verify(null, Buffer.from(canonicalJson(payload)), submission.actor.publicKeyPem, signature)) {
    throw new Error(`Stage B executor signature is invalid: ${executorId}`);
  }

  const output = {
    schemaVersion: 1,
    runKey: task.runKey,
    evaluatedCommit: task.evaluatedCommit,
    candidateSkillId: task.candidateSkillId,
    candidateSkillContentSha256: task.candidateSkillContentSha256,
    outputText,
    executor: {
      id: executorId,
      packetSha256: prepared.packetSha256,
      responseSha256: textSha256(outputText),
      assignmentSha256: canonicalSha256(submission.assignment),
      signingPayloadSha256: submission.payloadSha256,
      signature: signature.toString("base64"),
    },
  };
  writeJson(outputPath, output);
  return { output, outputPath };
};

const validateStoredExecutorOutput = ({ root, workspace, coordinator, task, output, outputPath }) => {
  try {
    const expectedPacket = buildExecutorPacket({ root, coordinator, task });
    const expectedPacketSha256 = canonicalSha256(expectedPacket);
    const packetPath = path.join(workspace, "executor-packets", `${task.taskId}.json`);
    const packet = existsSync(packetPath) ? readJson(packetPath) : undefined;
    const executorId = output.executor?.id;
    const actor = requireActorRole({ root, actorId: executorId, role: "stage-b-executor" });
    const assignmentPath = assignmentFile(workspace, task.taskId);
    const assignment = existsSync(assignmentPath) ? readJson(assignmentPath) : undefined;
    const expectedAssignment = {
      schemaVersion: EXECUTOR_ASSIGNMENT_SCHEMA_VERSION,
      pilotId: coordinator.pilotId,
      taskId: task.taskId,
      executorId,
      evaluatedCommit: coordinator.evaluatedCommit,
      packetSha256: expectedPacketSha256,
    };
    const responseSha256 = textSha256(output.outputText);
    const signingPayload = {
      schemaVersion: EXECUTOR_SUBMISSION_SCHEMA_VERSION,
      pilotId: coordinator.pilotId,
      taskId: task.taskId,
      executorId,
      evaluatedCommit: coordinator.evaluatedCommit,
      packetSha256: expectedPacketSha256,
      responseSha256,
    };
    const signature = Buffer.from(output.executor?.signature ?? "", "base64");
    const valid =
      output.schemaVersion === 1 &&
      output.runKey === task.runKey &&
      output.evaluatedCommit === coordinator.evaluatedCommit &&
      output.candidateSkillId === coordinator.candidateSkillId &&
      output.candidateSkillContentSha256 === coordinator.candidateSkillContentSha256 &&
      typeof output.outputText === "string" &&
      output.outputText.trim().length >= 20 &&
      packet &&
      canonicalSha256(packet) === expectedPacketSha256 &&
      assignment &&
      canonicalSha256(assignment) === canonicalSha256(expectedAssignment) &&
      output.executor.packetSha256 === expectedPacketSha256 &&
      output.executor.responseSha256 === responseSha256 &&
      output.executor.assignmentSha256 === canonicalSha256(expectedAssignment) &&
      output.executor.signingPayloadSha256 === canonicalSha256(signingPayload) &&
      signature.length > 0 &&
      verify(null, Buffer.from(canonicalJson(signingPayload)), actor.publicKeyPem, signature);
    if (!valid) throw new Error("stored executor provenance is invalid");
  } catch {
    throw new Error(`invalid Stage B output identity: ${outputPath}`);
  }
};

const findCandidate = ({ manifest, lock }, skillId) => {
  const skill = manifest.skills.find((entry) => entry.id === skillId);
  if (!skill) throw new Error(`unknown candidate skill: ${skillId}`);
  if (skill.status !== "experimental" || skill.source?.type === "project-internal") {
    throw new Error(`candidate skill must be an experimental adapted skill: ${skillId}`);
  }
  const lockEntry = lock.skills.find((entry) => entry.id === skillId);
  if (!lockEntry) throw new Error(`candidate skill has no lock entry: ${skillId}`);
  return { skill, lockEntry };
};

export const buildStageBPlan = ({
  pilotId,
  candidateSkill,
  candidateSkillContentSha256,
  evaluatedCommit,
  fixtures,
  randomBytesFn = randomBytes,
}) => {
  assertCanonicalId(pilotId, "pilotId");
  if (!SHA256.test(candidateSkillContentSha256)) throw new Error("candidate skill hash is invalid");
  if (!/^[0-9a-f]{40}$/.test(evaluatedCommit)) throw new Error("evaluated commit is invalid");
  if (fixtures.length !== 5 || FIXTURE_IDS.some((id) => !fixtures.some((fixture) => fixture.id === id))) {
    throw new Error("Stage B requires fixtures F1 through F5");
  }

  const runs = FIXTURE_IDS.flatMap((fixtureId) =>
    REPEATS.flatMap((repeat) =>
      ARMS.map((arm) => ({ fixtureId, repeat, arm })),
    ),
  );
  const randomized = shuffle(runs, randomBytesFn);
  const tasks = randomized.map((run, index) => {
    const nonce = randomBytesFn(16).toString("hex");
    const taskId = createHash("sha256")
      .update(`${pilotId}:${run.fixtureId}:${run.repeat}:${run.arm}:${nonce}`)
      .digest("hex")
      .slice(0, 20);
    const fixture = fixtures.find((entry) => entry.id === run.fixtureId);
    return {
      schemaVersion: TASK_SCHEMA_VERSION,
      taskId,
      sequence: index + 1,
      fixtureId: run.fixtureId,
      repeat: run.repeat,
      runKey: `${run.fixtureId}:${run.arm}:${run.repeat}`,
      evaluatedCommit,
      candidateSkillId: candidateSkill.id,
      candidateSkillContentSha256,
      promptPath: fixture.path,
      outputPath: `outputs/${taskId}.json`,
      setup:
        run.arm === "candidate"
          ? { mode: "candidate", skillId: candidateSkill.id, skillPath: candidateSkill.path }
          : { mode: "baseline" },
      outputContract: {
        schemaVersion: 1,
        requiredFields: [
          "schemaVersion",
          "runKey",
          "evaluatedCommit",
          "candidateSkillId",
          "candidateSkillContentSha256",
          "outputText",
          "executor",
        ],
      },
    };
  });

  return {
    coordinator: {
      schemaVersion: PILOT_SCHEMA_VERSION,
      pilotId,
      candidateSkillId: candidateSkill.id,
      candidateSkillPath: candidateSkill.path,
      candidateSkillContentSha256,
      evaluatedCommit,
      repeatsPerArm: 3,
      taskCount: tasks.length,
      runMap: tasks.map((task) => ({
        taskId: task.taskId,
        runKey: task.runKey,
        arm: task.setup.mode,
      })),
    },
    tasks,
  };
};

export const initializeStageBPilot = ({ root, skillId, pilotId, workspaceRoot }) => {
  const governanceErrors = validateAgentGovernance(root);
  if (governanceErrors.length > 0) {
    throw new Error(`agent governance is invalid:\n${governanceErrors.map((error) => `- ${error}`).join("\n")}`);
  }
  const dirty = getDirtyGovernedSurface(root);
  if (dirty) throw new Error(`repository must be clean before pilot initialization:\n${dirty}`);

  const governance = loadAgentGovernance(root);
  const { skill, lockEntry } = findCandidate(governance, skillId);
  const evaluatedCommit = git(root, ["rev-parse", "HEAD"]);
  const fixtureOraclePath = path.join(root, "docs/agents/pilots/fixture-oracle.json");
  const plan = buildStageBPlan({
    pilotId,
    candidateSkill: skill,
    candidateSkillContentSha256: lockEntry.contentSha256,
    evaluatedCommit,
    fixtures: governance.fixtureOracle.fixtures,
  });
  const workspace = workspaceRoot ?? path.join(root, ".data/stage-b", pilotId);
  if (existsSync(workspace)) throw new Error(`pilot workspace already exists: ${workspace}`);

  writeJson(path.join(workspace, "coordinator.json"), {
    ...plan.coordinator,
    fixtureOracleSha256: fileSha256(fixtureOraclePath),
  });
  for (const task of plan.tasks) writeJson(path.join(workspace, "tasks", `${task.taskId}.json`), task);
  writeJson(path.join(workspace, "review-queue.json"), {
    schemaVersion: REVIEW_PACKET_SCHEMA_VERSION,
    pilotId,
    note: "Arm mapping is intentionally absent. Generate the review packet only after all outputs exist.",
    items: shuffle(plan.tasks).map((task) => ({
      reviewItemId: task.taskId,
      fixtureId: task.fixtureId,
      promptPath: task.promptPath,
      expectedOutputPath: task.outputPath,
    })),
  });
  mkdirSync(path.join(workspace, "outputs"), { recursive: true });
  mkdirSync(path.join(workspace, "reviews"), { recursive: true });
  writeFileSync(
    path.join(workspace, "README.md"),
    `# Stage B workspace: ${pilotId}\n\n` +
      `Candidate: ${skillId}\nEvaluated commit: ${evaluatedCommit}\nTasks: 30\n\n` +
      "1. Never give executors tasks/ or coordinator.json.\n" +
      "2. Register an executor public key, then use stage-b:next with --executor to assign one isolated packet.\n" +
      "3. Use stage-b:prepare-submission, sign its exact payload outside the workspace, then use stage-b:submit-output.\n" +
      "4. Run prepare-review only after all 30 outputs exist.\n" +
      "5. Give reviewers only review-packet/, never coordinator.json, tasks/ or executor-packets/.\n" +
      "6. Private signing keys must remain outside this repository and workspace.\n",
  );
  return { workspace, plan };
};

const outputFiles = (workspace) => {
  const directory = path.join(workspace, "outputs");
  return existsSync(directory) ? readdirSync(directory).filter((name) => name.endsWith(".json")) : [];
};

const reviewFiles = (workspace) => {
  const directory = path.join(workspace, "reviews");
  return existsSync(directory) ? readdirSync(directory).filter((name) => name.endsWith(".json")) : [];
};

const assignmentFiles = (workspace) => {
  const directory = path.join(workspace, "assignments");
  return existsSync(directory) ? readdirSync(directory).filter((name) => name.endsWith(".json")) : [];
};

export const getStageBPilotStatus = ({ root, workspace, env = process.env }) => {
  const coordinator = readJson(path.join(workspace, "coordinator.json"));
  const governance = loadAgentGovernance(root);
  const outputs = outputFiles(workspace);
  const assignments = assignmentFiles(workspace);
  const reviews = reviewFiles(workspace);
  const executors = governance.actors.actors.filter((actor) => actor.allowedRoles?.includes("stage-b-executor"));
  const reviewers = governance.actors.actors.filter((actor) => actor.allowedRoles?.includes("stage-b-reviewer"));
  const reviewerGroups = new Set(reviewers.map((actor) => actor.independenceGroup));
  const registrySha256 = canonicalSha256(governance.actors);
  const trustedRegistry = env.YORSO_TRUSTED_ACTOR_REGISTRY_SHA256;
  const blockers = [];
  let invalidOutputCount = 0;

  for (const file of outputs) {
    const taskId = path.basename(file, ".json");
    try {
      const task = readPilotTask({ workspace, taskId });
      const outputPath = path.join("outputs", file);
      validateStoredExecutorOutput({
        root,
        workspace,
        coordinator,
        task,
        output: readJson(path.join(workspace, outputPath)),
        outputPath,
      });
    } catch {
      invalidOutputCount += 1;
    }
  }

  if (outputs.length !== coordinator.taskCount) {
    blockers.push(
      outputs.length < coordinator.taskCount
        ? `missing outputs: ${coordinator.taskCount - outputs.length}`
        : `unexpected extra outputs: ${outputs.length - coordinator.taskCount}`,
    );
  }
  if (assignments.length !== coordinator.taskCount) {
    blockers.push(
      assignments.length < coordinator.taskCount
        ? `missing executor assignments: ${coordinator.taskCount - assignments.length}`
        : `unexpected extra executor assignments: ${assignments.length - coordinator.taskCount}`,
    );
  }
  if (invalidOutputCount > 0) blockers.push(`invalid signed executor outputs: ${invalidOutputCount}`);
  if (executors.length < 1) blockers.push("missing registered Stage B executors: 1");
  if (reviewers.length < 2) blockers.push(`missing registered Stage B reviewers: ${2 - reviewers.length}`);
  if (reviewerGroups.size < 2) blockers.push("Stage B reviewers must use distinct independence groups");
  if (reviews.length !== 2) {
    blockers.push(reviews.length < 2 ? `missing signed reviewer sheets: ${2 - reviews.length}` : "exactly two reviewer sheets are required");
  }
  if (!SHA256.test(trustedRegistry ?? "")) blockers.push("YORSO_TRUSTED_ACTOR_REGISTRY_SHA256 is not set");
  else if (trustedRegistry !== registrySha256) blockers.push("trusted actor registry SHA-256 does not match");

  return {
    pilotId: coordinator.pilotId,
    candidateSkillId: coordinator.candidateSkillId,
    evaluatedCommit: coordinator.evaluatedCommit,
    taskCount: coordinator.taskCount,
    assignmentCount: assignments.length,
    outputCount: outputs.length,
    invalidOutputCount,
    executorCount: executors.length,
    reviewerCount: reviewers.length,
    reviewerSheetCount: reviews.length,
    actorRegistrySha256: registrySha256,
    readyForReview:
      assignments.length === coordinator.taskCount &&
      outputs.length === coordinator.taskCount &&
      invalidOutputCount === 0,
    readyForQualification: blockers.length === 0,
    blockers,
  };
};

export const prepareBlindReviewPacket = ({ root, workspace, force = false }) => {
  const status = getStageBPilotStatus({ root, workspace });
  if (!status.readyForReview) throw new Error(status.blockers[0]);
  const packetRoot = path.join(workspace, "review-packet");
  if (existsSync(packetRoot)) {
    if (!force) throw new Error(`review packet already exists: ${packetRoot}`);
    rmSync(packetRoot, { recursive: true, force: true });
  }
  const coordinator = readJson(path.join(workspace, "coordinator.json"));
  const queue = readJson(path.join(workspace, "review-queue.json"));
  const oracle = loadAgentGovernance(root).fixtureOracle;
  const fixtures = new Map(oracle.fixtures.map((fixture) => [fixture.id, fixture]));
  const runByTask = new Map(coordinator.runMap.map((entry) => [entry.taskId, entry]));
  const items = [];

  for (const queued of queue.items) {
    const output = readJson(path.join(workspace, queued.expectedOutputPath));
    const task = readPilotTask({ workspace, taskId: queued.reviewItemId });
    if (!runByTask.has(queued.reviewItemId)) throw new Error(`invalid Stage B task identity: ${queued.reviewItemId}`);
    validateStoredExecutorOutput({
      root,
      workspace,
      coordinator,
      task,
      output,
      outputPath: queued.expectedOutputPath,
    });
    const reviewOutput = `outputs/${queued.reviewItemId}.txt`;
    mkdirSync(path.join(packetRoot, "outputs"), { recursive: true });
    writeFileSync(path.join(packetRoot, reviewOutput), output.outputText);
    items.push({
      reviewItemId: queued.reviewItemId,
      fixtureId: queued.fixtureId,
      fixturePath: queued.promptPath,
      criticalDefectIds: fixtures.get(queued.fixtureId).criticalDefectIds,
      outputPath: reviewOutput,
      outputSha256: fileSha256(path.join(packetRoot, reviewOutput)),
    });
  }
  writeJson(path.join(packetRoot, "manifest.json"), {
    schemaVersion: REVIEW_PACKET_SCHEMA_VERSION,
    pilotId: coordinator.pilotId,
    note: "This packet intentionally omits skill identity, experiment arms and run keys.",
    items,
  });
  return packetRoot;
};

export const registerActor = ({ root, id, independenceGroup, allowedRoles, publicKeyFile }) => {
  assertCanonicalId(id, "actor id");
  assertCanonicalId(independenceGroup, "independence group");
  const roles = [...new Set(allowedRoles)];
  if (roles.length === 0 || roles.some((role) => !ACTOR_ROLES.has(role))) {
    throw new Error("actor role must be stage-b-executor, stage-b-reviewer or promotion-approver");
  }
  const publicKeyPem = readFileSync(publicKeyFile, "utf8");
  const publicKey = createPublicKey(publicKeyPem);
  if (publicKey.asymmetricKeyType !== "ed25519") throw new Error("actor public key must use Ed25519");

  const registryFile = path.join(root, ".agents/actors.json");
  const registry = actorRegistry(root);
  if (registry.actors.some((actor) => actor.id === id)) throw new Error(`actor already exists: ${id}`);
  registry.actors.push({ id, independenceGroup, allowedRoles: roles.sort(), publicKeyPem });
  registry.actors.sort((left, right) => left.id.localeCompare(right.id));
  writeJson(registryFile, registry);
  return { actor: registry.actors.find((actor) => actor.id === id), registrySha256: canonicalSha256(registry) };
};

export const qualifyStageBPilot = ({ root, workspace, env = process.env }) => {
  const status = getStageBPilotStatus({ root, workspace, env });
  if (!status.readyForQualification) {
    throw new Error(`Stage B qualification is blocked:\n${status.blockers.map((blocker) => `- ${blocker}`).join("\n")}`);
  }

  const governance = loadAgentGovernance(root);
  const candidate = governance.manifest.skills.find((skill) => skill.id === status.candidateSkillId);
  const evidencePath = governance.manifest.branchPolicy?.stageBEvidenceBySkill?.[status.candidateSkillId];
  if (governance.manifest.branchPolicy?.stageBPilotStatus !== "passed") {
    throw new Error("Stage B qualification is blocked: manifest stageBPilotStatus is not passed");
  }
  if (!candidate || candidate.status !== "active") {
    throw new Error(`Stage B qualification is blocked: candidate is not active: ${status.candidateSkillId}`);
  }
  if (!evidencePath) {
    throw new Error(`Stage B qualification is blocked: evidence mapping is missing for ${status.candidateSkillId}`);
  }

  const errors = validateAgentGovernance(root, {
    trustedActorRegistrySha256: env.YORSO_TRUSTED_ACTOR_REGISTRY_SHA256,
  });
  if (errors.length > 0) {
    throw new Error(`Stage B qualification is blocked:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
  return { status, evidencePath };
};
