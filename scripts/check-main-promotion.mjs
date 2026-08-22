#!/usr/bin/env node
import { validateAgentGovernance } from "./lib/agent-governance.mjs";

const errors = validateAgentGovernance(process.cwd(), {
  currentBranch: "main",
  ciTargetBranch: "main",
});

if (errors.length > 0) {
  console.error("Main promotion readiness: BLOCKED");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Main promotion readiness: READY");
console.log("Stage B, signed independent review and exact-commit promotion evidence are valid.");
