import { createHash, createPublicKey, randomBytes } from "node:crypto";
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
const ACTOR_REGISTRY_SCHEMA_VERSION = 2;
const FIXTURE_IDS = ["F1", "F2", "F3", "F4", "F5"];
const ARMS = ["baseline", "candidate"];
const REPEATS = [1, 2, 3];
const ACTOR_ROLES = new Set(["stage-b-reviewer", "promotion-approver"]);
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
      "1. Give executors only the task files they need.\n" +
      "2. Store one structured JSON output per task under outputs/.\n" +
      "3. Run prepare-review only after all 30 outputs exist.\n" +
      "4. Give reviewers only review-packet/, never coordinator.json or tasks/.\n" +
      "5. Private signing keys must remain outside this repository and workspace.\n",
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

export const getStageBPilotStatus = ({ root, workspace, env = process.env }) => {
  const coordinator = readJson(path.join(workspace, "coordinator.json"));
  const governance = loadAgentGovernance(root);
  const outputs = outputFiles(workspace);
  const reviews = reviewFiles(workspace);
  const reviewers = governance.actors.actors.filter((actor) => actor.allowedRoles?.includes("stage-b-reviewer"));
  const reviewerGroups = new Set(reviewers.map((actor) => actor.independenceGroup));
  const registrySha256 = canonicalSha256(governance.actors);
  const trustedRegistry = env.YORSO_TRUSTED_ACTOR_REGISTRY_SHA256;
  const blockers = [];

  if (outputs.length !== coordinator.taskCount) {
    blockers.push(
      outputs.length < coordinator.taskCount
        ? `missing outputs: ${coordinator.taskCount - outputs.length}`
        : `unexpected extra outputs: ${outputs.length - coordinator.taskCount}`,
    );
  }
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
    outputCount: outputs.length,
    reviewerCount: reviewers.length,
    reviewerSheetCount: reviews.length,
    actorRegistrySha256: registrySha256,
    readyForReview: outputs.length === coordinator.taskCount,
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
    const run = runByTask.get(queued.reviewItemId);
    if (
      output.schemaVersion !== 1 ||
      output.runKey !== run.runKey ||
      output.evaluatedCommit !== coordinator.evaluatedCommit ||
      output.candidateSkillId !== coordinator.candidateSkillId ||
      output.candidateSkillContentSha256 !== coordinator.candidateSkillContentSha256 ||
      typeof output.outputText !== "string" ||
      output.outputText.trim().length < 20
    ) {
      throw new Error(`invalid Stage B output identity: ${queued.expectedOutputPath}`);
    }
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
    throw new Error("actor role must be stage-b-reviewer or promotion-approver");
  }
  const publicKeyPem = readFileSync(publicKeyFile, "utf8");
  const publicKey = createPublicKey(publicKeyPem);
  if (publicKey.asymmetricKeyType !== "ed25519") throw new Error("actor public key must use Ed25519");

  const registryFile = path.join(root, ".agents/actors.json");
  const registry = readJson(registryFile);
  if (registry.schemaVersion !== ACTOR_REGISTRY_SCHEMA_VERSION) throw new Error("unsupported actor registry schema");
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
