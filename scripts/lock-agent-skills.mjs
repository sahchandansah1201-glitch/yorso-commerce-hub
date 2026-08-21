#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { hashSkillDirectory } from "./lib/agent-governance.mjs";

const root = process.cwd();
const manifest = JSON.parse(readFileSync(path.join(root, ".agents/manifest.json"), "utf8"));
const lock = {
  schemaVersion: 1,
  skills: [...manifest.skills]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((skill) => ({
      id: skill.id,
      path: skill.path,
      sourceRevision: skill.source.revision,
      contentSha256: hashSkillDirectory(path.join(root, skill.path)),
    })),
};

writeFileSync(
  path.join(root, ".agents/skills.lock.json"),
  `${JSON.stringify(lock, null, 2)}\n`,
  "utf8",
);
console.log(`Locked ${lock.skills.length} Yorso skill directories.`);
