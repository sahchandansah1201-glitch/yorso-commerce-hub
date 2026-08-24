import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const knowledgePath = "docs/lovable/project-knowledge-block.md";
const lifecycleSkills = [
  "yorso-lovable-discovery-plan",
  "yorso-lovable-ui-build",
  "yorso-lovable-browser-acceptance",
  "yorso-lovable-visual-critique",
  "yorso-lovable-sync-verification",
];

const failures = [];

async function read(relativePath) {
  try {
    return await readFile(path.join(root, relativePath), "utf8");
  } catch (error) {
    failures.push(`${relativePath}: ${error.code ?? error.message}`);
    return "";
  }
}

async function requireFile(relativePath) {
  try {
    const file = await stat(path.join(root, relativePath));
    if (!file.isFile()) failures.push(`${relativePath}: expected a file`);
  } catch (error) {
    failures.push(`${relativePath}: ${error.code ?? error.message}`);
  }
}

function requireText(text, token, label) {
  if (!text.includes(token)) failures.push(`${label}: missing ${JSON.stringify(token)}`);
}

const knowledge = await read(knowledgePath);
if (knowledge.length > 10_000) {
  failures.push(`${knowledgePath}: ${knowledge.length} characters exceeds Lovable's 10000-character limit`);
}

for (const token of [
  "local-lab/<scope>",
  "self-hosted, provider-free",
  "Capability Preflight",
  "Plan mode",
  "Build mode",
  "browser acceptance",
  "390px",
  "console/page errors",
  "report defects before fixing",
]) {
  requireText(knowledge, token, knowledgePath);
}

for (const skill of lifecycleSkills) {
  const skillPath = `.agents/skills/${skill}/SKILL.md`;
  const yamlPath = `.agents/skills/${skill}/agents/openai.yaml`;
  await requireFile(skillPath);
  await requireFile(yamlPath);
  const contents = await read(skillPath);
  requireText(contents, `name: ${skill}`, skillPath);
}

const matrixPath = ".agents/skills/yorso-lovable-browser-acceptance/references/human-flow-matrix.md";
const matrix = await read(matrixPath);
for (const token of [
  "at least three options consecutively",
  "remove and re-add",
  "Duplicate",
  "ArrowDown",
  "reload the route",
  "390px",
  "console errors, page errors",
  "Report defects before fixing",
]) {
  requireText(matrix, token, matrixPath);
}

const briefPath = ".agents/skills/yorso-lovable-component-brief-agent/SKILL.md";
const brief = await read(briefPath);
if (brief.includes("docs/pipelines/yorso-lovable-capabilities-playbook.md")) {
  failures.push(`${briefPath}: references the removed Lovable playbook path`);
}
requireText(brief, knowledgePath, briefPath);

if (failures.length > 0) {
  console.error("Lovable quality layer check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Lovable quality layer check passed. Project Knowledge: ${knowledge.length}/10000 characters; lifecycle skills: ${lifecycleSkills.length}.`,
);
