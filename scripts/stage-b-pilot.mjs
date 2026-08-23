#!/usr/bin/env node
import path from "node:path";

import {
  assignStageBExecutorTask,
  getStageBPilotStatus,
  initializeStageBPilot,
  prepareBlindReviewPacket,
  prepareStageBSubmissionPayload,
  qualifyStageBPilot,
  registerActor,
  submitStageBOutput,
} from "./lib/stage-b-pilot.mjs";

const args = process.argv.slice(2);
const command = args.shift();
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const root = process.cwd();
const pilotId = value("--pilot");
const workspace = pilotId ? path.join(root, ".data/stage-b", pilotId) : undefined;

const printStatus = (status) => {
  console.log(`Stage B pilot: ${status.pilotId}`);
  console.log(`Candidate: ${status.candidateSkillId}`);
  console.log(`Registered executors: ${status.executorCount}`);
  console.log(`Assignments: ${status.assignmentCount}/${status.taskCount}`);
  console.log(`Outputs: ${status.outputCount}/${status.taskCount}`);
  console.log(`Invalid signed outputs: ${status.invalidOutputCount}`);
  console.log(`Registered reviewers: ${status.reviewerCount}/2`);
  console.log(`Signed reviewer sheets: ${status.reviewerSheetCount}/2`);
  console.log(`Actor registry SHA-256: ${status.actorRegistrySha256}`);
  console.log(`Qualification: ${status.readyForQualification ? "READY" : "BLOCKED"}`);
  for (const blocker of status.blockers) console.log(`- ${blocker}`);
};

try {
  if (command === "init") {
    const skillId = value("--skill");
    if (!pilotId || !skillId) throw new Error("usage: stage-b:init -- --pilot <id> --skill <id>");
    const result = initializeStageBPilot({ root, skillId, pilotId, workspaceRoot: workspace });
    console.log(`Stage B workspace created: ${result.workspace}`);
    console.log(`Tasks: ${result.plan.tasks.length}`);
    console.log("Qualification remains blocked until real outputs and two signed independent reviews exist.");
  } else if (command === "status") {
    if (!workspace) throw new Error("usage: stage-b:status -- --pilot <id>");
    const status = getStageBPilotStatus({ root, workspace });
    printStatus(status);
    if (!status.readyForQualification) process.exitCode = 2;
  } else if (command === "next") {
    const executorId = value("--executor");
    if (!workspace || !executorId) {
      throw new Error("usage: stage-b:next -- --pilot <id> --executor <id> [--task <task-id>]");
    }
    const result = assignStageBExecutorTask({
      root,
      workspace,
      taskId: value("--task"),
      executorId,
    });
    console.log(`Executor packet: ${result.packetPath}`);
    console.log(`Task: ${result.task.taskId} (${result.task.sequence}/30)`);
    console.log(`Assigned executor: ${result.assignment.executorId}`);
    console.log(`Assignment: ${result.assignmentPath}`);
    console.log(`Packet SHA-256: ${result.packetSha256}`);
    console.log("Give only this packet to the executor. Do not give tasks/, coordinator.json or another arm packet.");
  } else if (command === "prepare-submission") {
    const taskId = value("--task");
    const executorId = value("--executor");
    const responseFile = value("--response-file");
    const payloadFile = value("--payload-file");
    if (!workspace || !taskId || !executorId || !responseFile || !payloadFile) {
      throw new Error(
        "usage: stage-b:prepare-submission -- --pilot <id> --task <task-id> --executor <id> --response-file <file> --payload-file <file>",
      );
    }
    const result = prepareStageBSubmissionPayload({
      root,
      workspace,
      taskId,
      executorId,
      responseFile,
      payloadFile,
    });
    console.log(`Canonical signing payload: ${payloadFile}`);
    console.log(`Signing payload SHA-256: ${result.payloadSha256}`);
    console.log("Sign this exact file with the assigned executor's Ed25519 private key outside the repository.");
  } else if (command === "submit-output") {
    const taskId = value("--task");
    const executorId = value("--executor");
    const responseFile = value("--response-file");
    const signatureFile = value("--signature-file");
    if (!workspace || !taskId || !executorId || !responseFile || !signatureFile) {
      throw new Error(
        "usage: stage-b:submit-output -- --pilot <id> --task <task-id> --executor <id> --response-file <file> --signature-file <file>",
      );
    }
    const result = submitStageBOutput({ root, workspace, taskId, executorId, responseFile, signatureFile });
    console.log(`Stage B output accepted: ${result.outputPath}`);
    console.log(`Executor: ${result.output.executor.id}`);
    console.log(`Response SHA-256: ${result.output.executor.responseSha256}`);
  } else if (command === "prepare-review") {
    if (!workspace) throw new Error("usage: stage-b:prepare-review -- --pilot <id>");
    const packet = prepareBlindReviewPacket({ root, workspace, force: args.includes("--force") });
    console.log(`Blind review packet created: ${packet}`);
  } else if (command === "qualify") {
    if (!workspace) throw new Error("usage: stage-b:qualify -- --pilot <id>");
    const result = qualifyStageBPilot({ root, workspace });
    printStatus(result.status);
    console.log(`Stage B evidence: ${result.evidencePath}`);
    console.log("Stage B qualification: PASSED");
  } else if (command === "register-actor") {
    const id = value("--id");
    const group = value("--group");
    const publicKeyFile = value("--public-key-file");
    const roles = (value("--roles") ?? "").split(",").filter(Boolean);
    if (!id || !group || !publicKeyFile || roles.length === 0) {
      throw new Error(
        "usage: stage-b:register-actor -- --id <id> --group <group> --roles <roles> --public-key-file <file>",
      );
    }
    const result = registerActor({ root, id, independenceGroup: group, allowedRoles: roles, publicKeyFile });
    console.log(`Registered actor: ${result.actor.id}`);
    console.log(`Actor registry SHA-256: ${result.registrySha256}`);
    console.log("Store this digest out-of-band; no private key was read or stored.");
  } else {
    throw new Error("commands: init, next, prepare-submission, submit-output, status, prepare-review, qualify, register-actor");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
