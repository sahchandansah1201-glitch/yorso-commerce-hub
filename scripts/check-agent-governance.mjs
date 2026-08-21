#!/usr/bin/env node
import { validateAgentGovernance } from "./lib/agent-governance.mjs";

const errors = validateAgentGovernance(process.cwd());
if (errors.length > 0) {
  console.error("Agent governance check failed.");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Agent governance check passed.");
console.log("Roles, skill provenance, independent review and content locks are consistent.");
