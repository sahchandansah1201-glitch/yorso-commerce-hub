import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

const ALLOWED_STATUSES = new Set(["active", "experimental"]);
const ALLOWED_SOURCE_TYPES = new Set(["project-internal", "project-adaptation", "external-adaptation"]);
const ALLOWED_STAGE_B_STATUSES = new Set(["pending", "passed"]);
const VERIFIED_EXTERNAL_SOURCES = new Map([
  [
    "content-designer/ux-writing-skill@98cacde4ba2dd10ed28df43a8d53eef1e321c539",
    "MIT",
  ],
  [
    "hueyexe/frontend-agent-skills@2841c079dd8a9c634882227194dc42e25227710d",
    "MIT",
  ],
]);
const REQUIRED_PROMOTION_GATES = [
  "independent-review",
  "governance-check",
  "project-memory-check",
  "relevant-product-tests",
  "non-mutating-gates",
];
const REQUIRED_STAGE_B_FIXTURES = ["F1", "F2", "F3", "F4", "F5"];
const REQUIRED_STAGE_B_ARMS = ["baseline", "candidate"];
const STAGE_B_ARTIFACT_MINIMUMS = {
  prompts: 5,
  outputs: 30,
  reviewerSheets: 2,
  disagreementResolution: 1,
  costReport: 1,
};
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const REQUIRED_ROLES = [
  "founder-product-orchestrator",
  "human-steering-delivery",
  "product-ux-design",
  "multilingual-ux-copywriter",
  "frontend-engineer",
  "backend-platform-engineer",
  "buyer-procurement",
  "supplier-operations",
  "trust-compliance",
  "market-pricing-search",
  "qa-release-owner",
  "knowledge-analytics",
  "orders-logistics",
];

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const hashFile = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

const filesBelow = (root) => {
  const files = [];
  const visit = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      if (name === ".DS_Store") continue;
      const absolute = path.join(directory, name);
      const stats = statSync(absolute);
      if (stats.isDirectory()) visit(absolute);
      else if (stats.isFile()) files.push(absolute);
    }
  };
  visit(root);
  return files;
};

const containsSymbolicLink = (target) => {
  const stats = lstatSync(target);
  if (stats.isSymbolicLink()) return true;
  if (!stats.isDirectory()) return false;
  return readdirSync(target).some((name) => containsSymbolicLink(path.join(target, name)));
};

const isWithin = (parent, candidate) => candidate === parent || candidate.startsWith(`${parent}${path.sep}`);

const containsSymbolicLinkInPath = (root, target) => {
  const lexicalRoot = path.resolve(root);
  const lexicalTarget = path.resolve(target);
  if (!isWithin(lexicalRoot, lexicalTarget)) return true;
  const relative = path.relative(lexicalRoot, lexicalTarget);
  let current = lexicalRoot;
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (!existsSync(current) || lstatSync(current).isSymbolicLink()) return true;
  }
  return false;
};

const resolvesWithin = (root, candidate, allowedRoot) => {
  try {
    const lexicalRoot = path.resolve(root);
    const lexicalAllowedRoot = path.resolve(root, allowedRoot);
    const lexicalCandidate = path.resolve(candidate);
    if (!isWithin(lexicalRoot, lexicalAllowedRoot) || !isWithin(lexicalAllowedRoot, lexicalCandidate)) return false;
    if (
      containsSymbolicLinkInPath(lexicalRoot, lexicalAllowedRoot) ||
      containsSymbolicLinkInPath(lexicalRoot, lexicalCandidate)
    ) {
      return false;
    }
    const physicalRoot = realpathSync(lexicalRoot);
    const physicalAllowedRoot = realpathSync(lexicalAllowedRoot);
    const physicalCandidate = realpathSync(lexicalCandidate);
    return isWithin(physicalRoot, physicalAllowedRoot) && isWithin(physicalAllowedRoot, physicalCandidate);
  } catch {
    return false;
  }
};

const isSafeRelativePath = (value) => {
  if (typeof value !== "string" || value.length === 0 || path.isAbsolute(value)) return false;
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  return normalized === value && normalized !== ".." && !normalized.startsWith("../");
};

const normalizeRepository = (value = "") =>
  value
    .trim()
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/^git@github\.com:/, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");

const git = (root, args) => {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
};

const gitBuffer = (root, args) => {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "buffer",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
};

const hashSkillDirectoryAtRevision = (root, revision, skillPath) => {
  const listing = git(root, ["ls-tree", "-r", "--name-only", revision, "--", skillPath]);
  if (!listing) return null;
  const files = listing.split("\n").filter(Boolean).sort();
  const hash = createHash("sha256");
  for (const file of files) {
    const content = gitBuffer(root, ["show", `${revision}:${file}`]);
    if (content === null) return null;
    hash.update(path.posix.relative(skillPath, file));
    hash.update("\0");
    hash.update(content);
    hash.update("\0");
  }
  return hash.digest("hex");
};

const validateVerifiedExternalSource = ({ repository, revision, license, label, errors }) => {
  const key = `${normalizeRepository(repository)}@${revision}`;
  const verifiedLicense = VERIFIED_EXTERNAL_SOURCES.get(key);
  if (!verifiedLicense) {
    errors.push(`${label} is not in the verified external source allowlist: ${key}`);
    return;
  }
  if (license !== verifiedLicense) {
    errors.push(`${label} license does not match verified evidence: ${license} != ${verifiedLicense}`);
  }
};

const validateEvidenceFile = ({ root, evidence, source, skillId, errors }) => {
  const label = `external adaptation evidence for ${skillId}`;
  if (!isSafeRelativePath(evidence ?? "")) {
    errors.push(`${label} path is unsafe`);
    return;
  }
  const absolute = path.join(root, evidence);
  if (!existsSync(absolute)) {
    errors.push(`${label} is missing`);
    return;
  }
  if (!resolvesWithin(root, absolute, "docs/agents") || containsSymbolicLink(absolute)) {
    errors.push(`${label} must be a non-symlink file inside docs/agents`);
    return;
  }
  const text = readFileSync(absolute, "utf8");
  const requiredTokens = [normalizeRepository(source.repository), source.revision, source.license];
  if (requiredTokens.some((token) => !text.includes(token))) {
    errors.push(`${label} does not contain repository, revision and license provenance`);
  }
};

const validateBoundArtifact = ({ root, artifact, allowedRoot, label, errors }) => {
  if (!artifact || typeof artifact !== "object" || !isSafeRelativePath(artifact.path ?? "")) {
    errors.push(`${label} must provide a safe path and SHA-256`);
    return null;
  }
  if (!SHA256_PATTERN.test(artifact.sha256 ?? "")) {
    errors.push(`${label} must provide a lowercase SHA-256`);
    return null;
  }
  const absolute = path.join(root, artifact.path);
  if (
    !existsSync(absolute) ||
    !resolvesWithin(root, absolute, allowedRoot) ||
    containsSymbolicLink(absolute) ||
    !statSync(absolute).isFile()
  ) {
    errors.push(`${label} must be a non-symlink file inside ${allowedRoot}: ${artifact.path}`);
    return null;
  }
  if (statSync(absolute).size < 20) errors.push(`${label} is too small to be reviewable: ${artifact.path}`);
  if (hashFile(absolute) !== artifact.sha256) errors.push(`${label} SHA-256 mismatch: ${artifact.path}`);
  return artifact.path;
};

const validateStageBEvidence = ({ root, branchPolicy, errors, skipRepositoryInspection = false }) => {
  if (branchPolicy?.stageBPilotStatus !== "passed") return;
  const evidence = branchPolicy.stageBEvidence;
  if (!isSafeRelativePath(evidence ?? "")) {
    errors.push("branchPolicy.stageBEvidence is required when Stage B passes");
    return;
  }
  const absolute = path.join(root, evidence);
  if (!existsSync(absolute) || !resolvesWithin(root, absolute, "docs/agents/pilots/results") || containsSymbolicLink(absolute)) {
    errors.push("branchPolicy.stageBEvidence must be a non-symlink file inside docs/agents/pilots/results");
    return;
  }
  let report;
  try {
    report = readJson(absolute);
  } catch {
    errors.push("branchPolicy.stageBEvidence must contain valid JSON");
    return;
  }
  const metrics = report.metrics ?? {};
  const artifacts = report.artifacts ?? {};
  if (report.schemaVersion !== 2) errors.push("Stage B evidence schemaVersion must be 2");
  if (!/^[0-9a-f]{40}$/.test(report.evaluatedCommit ?? "") || /^0+$/.test(report.evaluatedCommit ?? "")) {
    errors.push("Stage B evidence requires a non-zero evaluatedCommit");
  } else if (!skipRepositoryInspection) {
    if (git(root, ["cat-file", "-e", `${report.evaluatedCommit}^{commit}`]) === null) {
      errors.push(`Stage B evaluatedCommit does not exist: ${report.evaluatedCommit}`);
    } else if (git(root, ["merge-base", "--is-ancestor", report.evaluatedCommit, "HEAD"]) === null) {
      errors.push("Stage B evaluatedCommit must be an ancestor of HEAD");
    } else if (git(root, ["diff", "--quiet", report.evaluatedCommit, "HEAD", "--", ".agents/skills"]) === null) {
      errors.push("Stage B evidence is stale because skill content changed after evaluatedCommit");
    }
  }
  if (
    !Array.isArray(report.fixtureIds) ||
    report.fixtureIds.length !== REQUIRED_STAGE_B_FIXTURES.length ||
    REQUIRED_STAGE_B_FIXTURES.some((fixture) => !report.fixtureIds.includes(fixture))
  ) {
    errors.push("Stage B evidence must name fixtures F1 through F5 exactly once");
  }
  if (!Array.isArray(report.arms) || report.arms.length !== 2 || REQUIRED_STAGE_B_ARMS.some((arm) => !report.arms.includes(arm))) {
    errors.push("Stage B evidence must name baseline and candidate arms");
  }
  if (report.repeatsPerArm !== 3) errors.push("Stage B evidence requires three repeats per arm");

  const runs = Array.isArray(report.runs) ? report.runs : [];
  const runKeys = new Set();
  for (const run of runs) {
    const key = `${run.fixtureId}:${run.arm}:${run.repeat}`;
    if (
      !REQUIRED_STAGE_B_FIXTURES.includes(run.fixtureId) ||
      !REQUIRED_STAGE_B_ARMS.includes(run.arm) ||
      !Number.isInteger(run.repeat) ||
      run.repeat < 1 ||
      run.repeat > 3
    ) {
      errors.push(`invalid Stage B run tuple: ${key}`);
    }
    if (runKeys.has(key)) errors.push(`duplicate Stage B run tuple: ${key}`);
    runKeys.add(key);
    if (!isSafeRelativePath(run.promptArtifact ?? "") || !isSafeRelativePath(run.outputArtifact ?? "")) {
      errors.push(`Stage B run must reference prompt and output artifacts: ${key}`);
    }
  }
  const expectedRunKeys = REQUIRED_STAGE_B_FIXTURES.flatMap((fixture) =>
    REQUIRED_STAGE_B_ARMS.flatMap((arm) => [1, 2, 3].map((repeat) => `${fixture}:${arm}:${repeat}`)),
  );
  if (runs.length !== 30 || expectedRunKeys.some((key) => !runKeys.has(key))) {
    errors.push("Stage B evidence must contain all 30 unique fixture/arm/repeat runs");
  }

  const reviewers = Array.isArray(report.reviewers) ? report.reviewers : [];
  const reviewerIds = reviewers.map((reviewer) => reviewer?.id).filter((id) => typeof id === "string" && id.trim());
  if (reviewerIds.length < 2 || new Set(reviewerIds).size !== reviewerIds.length) {
    errors.push("Stage B evidence requires at least two unique independent reviewers");
  }
  if (!Array.isArray(report.hardFailures) || report.hardFailures.length !== 0) {
    errors.push("Stage B evidence must explicitly record zero hard failures");
  }
  if (!Array.isArray(report.regressions) || report.regressions.length !== 0) {
    errors.push("Stage B evidence must explicitly record zero regressions");
  }
  const requiredMetrics = [
    "baselineMean",
    "candidateMean",
    "baselineCriticalDefectRecall",
    "candidateCriticalDefectRecall",
    "cohensKappa",
    "medianOverheadRatio",
  ];
  if (requiredMetrics.some((metric) => !Number.isFinite(metrics[metric]))) {
    errors.push("Stage B evidence requires all numeric metrics");
  } else if (
    metrics.candidateMean < 85 ||
    metrics.candidateCriticalDefectRecall !== 1 ||
    metrics.cohensKappa < 0.75
  ) {
    errors.push("Stage B evidence does not meet score, recall or reviewer-agreement thresholds");
  }
  if (Number.isFinite(metrics.medianOverheadRatio) && metrics.medianOverheadRatio > 0.25) {
    errors.push("Stage B evidence exceeds the median overhead threshold");
  }
  const scoreDelta = metrics.candidateMean - metrics.baselineMean;
  const recallDelta = metrics.candidateCriticalDefectRecall - metrics.baselineCriticalDefectRecall;
  if (!Number.isFinite(scoreDelta) || !Number.isFinite(recallDelta) || (scoreDelta < 8 && recallDelta < 0.2)) {
    errors.push("Stage B evidence does not meet the baseline improvement threshold");
  }

  const artifactPaths = new Set();
  const artifactPathsByCategory = new Map();
  for (const [key, minimum] of Object.entries(STAGE_B_ARTIFACT_MINIMUMS)) {
    if (!Array.isArray(artifacts[key]) || artifacts[key].length < minimum) {
      errors.push(`Stage B evidence artifact list is incomplete: ${key}`);
      continue;
    }
    const categoryPaths = new Set();
    for (const artifact of artifacts[key]) {
      const artifactPath = validateBoundArtifact({
        root,
        artifact,
        allowedRoot: "docs/agents/pilots/results",
        label: `Stage B ${key} artifact`,
        errors,
      });
      if (!artifactPath) continue;
      if (artifactPaths.has(artifactPath)) errors.push(`Stage B artifact path is reused: ${artifactPath}`);
      artifactPaths.add(artifactPath);
      categoryPaths.add(artifactPath);
    }
    artifactPathsByCategory.set(key, categoryPaths);
  }
  const promptPaths = artifactPathsByCategory.get("prompts") ?? new Set();
  const outputPaths = artifactPathsByCategory.get("outputs") ?? new Set();
  for (const run of runs) {
    if (!promptPaths.has(run.promptArtifact)) errors.push(`Stage B run prompt is not checksum-bound: ${run.promptArtifact}`);
    if (!outputPaths.has(run.outputArtifact)) errors.push(`Stage B run output is not checksum-bound: ${run.outputArtifact}`);
  }
  const reviewerSheetPaths = artifactPathsByCategory.get("reviewerSheets") ?? new Set();
  for (const reviewer of reviewers) {
    if (!reviewerSheetPaths.has(reviewer?.sheetArtifact)) {
      errors.push(`Stage B reviewer sheet is not checksum-bound: ${reviewer?.sheetArtifact}`);
    }
  }
};

const validatePromotionEvidence = ({ root, branchPolicy, errors, skipRepositoryInspection = false }) => {
  const evidence = branchPolicy?.promotionEvidence;
  if (!isSafeRelativePath(evidence ?? "")) {
    errors.push("main requires branchPolicy.promotionEvidence");
    return;
  }
  const absolute = path.join(root, evidence);
  if (!existsSync(absolute) || !resolvesWithin(root, absolute, "docs/agents/pilots/results") || containsSymbolicLink(absolute)) {
    errors.push("branchPolicy.promotionEvidence must be a non-symlink file inside docs/agents/pilots/results");
    return;
  }
  let report;
  try {
    report = readJson(absolute);
  } catch {
    errors.push("branchPolicy.promotionEvidence must contain valid JSON");
    return;
  }
  if (report.schemaVersion !== 2) errors.push("promotion evidence schemaVersion must be 2");
  const approvedBy = Array.isArray(report.approvedBy) ? report.approvedBy.filter((id) => typeof id === "string" && id.trim()) : [];
  if (approvedBy.length < 2 || new Set(approvedBy).size !== approvedBy.length) {
    errors.push("promotion evidence requires two unique independent approvers");
  }
  if (!/^[0-9a-f]{40}$/.test(report.reviewedCommit ?? "") || /^0+$/.test(report.reviewedCommit ?? "")) {
    errors.push("promotion evidence requires a non-zero reviewedCommit");
  } else if (!skipRepositoryInspection) {
    if (git(root, ["cat-file", "-e", `${report.reviewedCommit}^{commit}`]) === null) {
      errors.push(`promotion reviewedCommit does not exist: ${report.reviewedCommit}`);
    } else if (git(root, ["merge-base", "--is-ancestor", report.reviewedCommit, "HEAD"]) === null) {
      errors.push("promotion reviewedCommit must be an ancestor of HEAD");
    } else if (git(root, ["diff", "--quiet", report.reviewedCommit, "HEAD", "--", ".agents/skills"]) === null) {
      errors.push("promotion evidence is stale because skill content changed after reviewedCommit");
    }
  }
  if (report.stageBEvidence !== branchPolicy.stageBEvidence) {
    errors.push("promotion evidence must reference branchPolicy.stageBEvidence");
  }
  const gateResults = report.gateResults ?? {};
  const gateArtifactPaths = new Set();
  for (const required of REQUIRED_PROMOTION_GATES) {
    const result = gateResults[required];
    if (!result || result.status !== "passed" || typeof result.command !== "string" || result.command.trim().length === 0) {
      errors.push(`promotion evidence gate is missing or not passed: ${required}`);
      continue;
    }
    const artifactPath = validateBoundArtifact({
      root,
      artifact: result.artifact,
      allowedRoot: "docs/agents/pilots/results",
      label: `promotion ${required} artifact`,
      errors,
    });
    if (artifactPath && gateArtifactPaths.has(artifactPath)) {
      errors.push(`promotion gate artifact path is reused: ${artifactPath}`);
    }
    if (artifactPath) gateArtifactPaths.add(artifactPath);
  }
};

const validateSource = ({
  root,
  skill,
  canonicalRepository,
  expectedContentHash,
  skipSourceCommitVerification,
  errors,
}) => {
  const { source } = skill;
  if (!source?.repository || !source?.revision || !source?.license || !source?.type) {
    errors.push(`incomplete source provenance for ${skill.id}`);
    return;
  }
  if (!ALLOWED_SOURCE_TYPES.has(source.type)) errors.push(`invalid source type for ${skill.id}: ${source.type}`);
  if (!/^[0-9a-f]{40}$/.test(source.revision) || /^0+$/.test(source.revision)) {
    errors.push(`source revision must be a non-zero 40-character commit SHA for ${skill.id}`);
  }
  if (source.license === "unverified") errors.push(`source license is unverified for ${skill.id}`);

  const sourceRepository = normalizeRepository(source.repository);
  const canonical = normalizeRepository(canonicalRepository);
  const isProjectSource = sourceRepository === canonical;

  if (isProjectSource && source.license !== "project-internal") {
    errors.push(`project source must use project-internal license for ${skill.id}`);
  }
  if (!isProjectSource && source.license === "project-internal") {
    errors.push(`external source cannot use project-internal license for ${skill.id}`);
  }
  if (source.type === "external-adaptation") {
    if (isProjectSource) errors.push(`external adaptation must name an external repository for ${skill.id}`);
    validateVerifiedExternalSource({
      repository: source.repository,
      revision: source.revision,
      license: source.license,
      label: `external source for ${skill.id}`,
      errors,
    });
    validateEvidenceFile({ root, evidence: source.evidence, source, skillId: skill.id, errors });
  } else if (!isProjectSource) {
    errors.push(`${source.type} must use the canonical repository for ${skill.id}`);
  }

  if (isProjectSource && !skipSourceCommitVerification && /^[0-9a-f]{40}$/.test(source.revision)) {
    if (git(root, ["cat-file", "-e", `${source.revision}^{commit}`]) === null) {
      errors.push(`project source commit does not exist for ${skill.id}: ${source.revision}`);
    } else if (git(root, ["cat-file", "-e", `${source.revision}:${skill.path}/SKILL.md`]) === null) {
      errors.push(`skill path is absent from its project source commit for ${skill.id}`);
    } else if (
      expectedContentHash &&
      hashSkillDirectoryAtRevision(root, source.revision, skill.path) !== expectedContentHash
    ) {
      errors.push(`project source content hash mismatch for ${skill.id} at ${source.revision}`);
    }
  }

  for (const upstream of skill.upstream ?? []) {
    if (!upstream.repository || !/^[0-9a-f]{40}$/.test(upstream.revision ?? "") || /^0+$/.test(upstream.revision ?? "")) {
      errors.push(`invalid upstream provenance for ${skill.id}`);
    }
    if (!upstream.license || upstream.license === "unverified" || !upstream.scope) {
      errors.push(`incomplete upstream evidence for ${skill.id}`);
    }
    validateVerifiedExternalSource({
      repository: upstream.repository,
      revision: upstream.revision,
      license: upstream.license,
      label: `upstream source for ${skill.id}`,
      errors,
    });
  }
};

const validateDependencyCycles = (skills, errors) => {
  const graph = new Map(skills.map((skill) => [skill.id, skill.dependencies ?? []]));
  const visiting = new Set();
  const visited = new Set();
  const visit = (id, trail) => {
    if (visiting.has(id)) {
      errors.push(`dependency cycle: ${[...trail, id].join(" -> ")}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of graph.get(id) ?? []) visit(dependency, [...trail, id]);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of graph.keys()) visit(id, []);
};

export const hashSkillDirectory = (directory) => {
  const hash = createHash("sha256");
  for (const file of filesBelow(directory)) {
    hash.update(path.relative(directory, file));
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
};

export const loadAgentGovernance = (root) => ({
  manifest: readJson(path.join(root, ".agents/manifest.json")),
  lock: readJson(path.join(root, ".agents/skills.lock.json")),
});

export const validateAgentGovernance = (root, overrides = {}) => {
  const loaded = overrides.manifest && overrides.lock ? overrides : loadAgentGovernance(root);
  const { manifest, lock } = loaded;
  const errors = [];
  const roles = manifest.roles ?? [];
  const skills = manifest.skills ?? [];
  const roleIds = new Set();
  const skillIds = new Set();
  const roleProfiles = new Set();
  const skillPaths = new Set();
  const locked = new Map();

  for (const entry of lock.skills ?? []) {
    if (!entry.id || locked.has(entry.id)) errors.push(`duplicate or missing lock id: ${entry.id}`);
    else locked.set(entry.id, entry);
  }

  if (manifest.schemaVersion !== 1) errors.push("manifest.schemaVersion must be 1");
  if (lock.schemaVersion !== 1) errors.push("skills.lock schemaVersion must be 1");
  if (manifest.project !== "Yorso") errors.push("manifest.project must be Yorso");

  const canonical = normalizeRepository(manifest.canonicalRepository);
  if (!/^[^/]+\/[^/]+$/.test(canonical)) errors.push("canonicalRepository must be a GitHub owner/repository");
  if (!overrides.skipRepositoryInspection) {
    const origin = normalizeRepository(git(root, ["remote", "get-url", "origin"]) ?? "");
    if (!origin || origin !== canonical) errors.push(`canonicalRepository does not match origin: ${origin || "missing"}`);
  }

  const branchPolicy = manifest.branchPolicy;
  if (!branchPolicy || branchPolicy.productionSourceOfTruth !== "main") {
    errors.push("branchPolicy.productionSourceOfTruth must be main");
  }
  if (branchPolicy?.experimentalPattern !== "local-lab/<scope>") {
    errors.push("branchPolicy.experimentalPattern must be local-lab/<scope>");
  }
  if (!/^local-lab\/[a-z0-9][a-z0-9-]*$/.test(branchPolicy?.currentExperimentalBranch ?? "")) {
    errors.push("branchPolicy.currentExperimentalBranch must match local-lab/<scope>");
  }
  if (branchPolicy?.baseRef !== "origin/main") errors.push("branchPolicy.baseRef must be origin/main");
  if (!/^[0-9a-f]{40}$/.test(branchPolicy?.baseCommit ?? "") || /^0+$/.test(branchPolicy?.baseCommit ?? "")) {
    errors.push("branchPolicy.baseCommit must be a non-zero 40-character commit SHA");
  }
  if (!ALLOWED_STAGE_B_STATUSES.has(branchPolicy?.stageBPilotStatus)) {
    errors.push("branchPolicy.stageBPilotStatus must be pending or passed");
  }
  validateStageBEvidence({
    root,
    branchPolicy,
    errors,
    skipRepositoryInspection: overrides.skipRepositoryInspection,
  });
  const promotionGates = new Set(branchPolicy?.promotionRequires ?? []);
  for (const required of REQUIRED_PROMOTION_GATES) {
    if (!promotionGates.has(required)) errors.push(`branchPolicy promotion gate is missing: ${required}`);
  }
  if (!overrides.skipRepositoryInspection || hasOwn(overrides, "currentBranch")) {
    const currentBranch = hasOwn(overrides, "currentBranch")
      ? overrides.currentBranch
      : git(root, ["branch", "--show-current"]);
    const ciBranch = overrides.ciBranchName ?? process.env.GITHUB_HEAD_REF ?? process.env.GITHUB_REF_NAME ?? "";
    const ciTargetBranch = overrides.ciTargetBranch ?? process.env.GITHUB_BASE_REF ?? "";
    const branchToValidate = ciTargetBranch || currentBranch || ciBranch;
    if (!branchToValidate) {
      errors.push("detached HEAD requires an explicit CI branch name");
    } else if (branchToValidate === branchPolicy?.productionSourceOfTruth) {
      if (branchPolicy?.stageBPilotStatus !== "passed" || skills.some((skill) => skill.status !== "active")) {
        errors.push("main cannot use pending Stage B evidence or experimental skills");
      }
      validatePromotionEvidence({
        root,
        branchPolicy,
        errors,
        skipRepositoryInspection: overrides.skipRepositoryInspection,
      });
    } else if (branchToValidate !== branchPolicy?.currentExperimentalBranch) {
      errors.push(`current branch does not match branchPolicy: ${branchToValidate}`);
    }
    if (!overrides.skipRepositoryInspection) {
      if (git(root, ["cat-file", "-e", `${branchPolicy?.baseCommit}^{commit}`]) === null) {
        errors.push(`branchPolicy.baseCommit does not exist: ${branchPolicy?.baseCommit ?? "missing"}`);
      } else if (git(root, ["merge-base", "--is-ancestor", branchPolicy.baseCommit, "HEAD"]) === null) {
        errors.push(`branchPolicy.baseCommit is not an ancestor of HEAD: ${branchPolicy.baseCommit}`);
      } else if (git(root, ["merge-base", "--is-ancestor", branchPolicy.baseCommit, branchPolicy.baseRef]) === null) {
        errors.push(`branchPolicy.baseCommit is not an ancestor of ${branchPolicy.baseRef}`);
      }
    }
  }

  for (const role of roles) {
    if (!role.id || roleIds.has(role.id)) errors.push(`duplicate or missing role id: ${role.id}`);
    roleIds.add(role.id);
    if (!isSafeRelativePath(role.profile ?? "")) errors.push(`unsafe role profile path for ${role.id}`);
    if (roleProfiles.has(role.profile)) errors.push(`duplicate role profile path: ${role.profile}`);
    roleProfiles.add(role.profile);
    const profile = path.join(root, role.profile ?? "");
    if (!role.profile || !existsSync(profile)) errors.push(`role profile is missing for ${role.id}`);
    else if (!resolvesWithin(root, profile, ".agents/agents") || containsSymbolicLink(profile)) {
      errors.push(`role profile resolves outside .agents/agents for ${role.id}`);
    }
    if (!Array.isArray(role.skills) || role.skills.length === 0) errors.push(`role skills are missing for ${role.id}`);
    else if (new Set(role.skills).size !== role.skills.length) errors.push(`duplicate role skill for ${role.id}`);
  }
  for (const role of REQUIRED_ROLES) {
    if (!roleIds.has(role)) errors.push(`required role is missing: ${role}`);
  }

  for (const skill of skills) {
    if (!skill.id || skillIds.has(skill.id)) errors.push(`duplicate or missing skill id: ${skill.id}`);
    skillIds.add(skill.id);
    if (!isSafeRelativePath(skill.path ?? "")) errors.push(`unsafe skill path for ${skill.id}`);
    if (skillPaths.has(skill.path)) errors.push(`duplicate skill path: ${skill.path}`);
    skillPaths.add(skill.path);
  }

  for (const role of roles) {
    const profile = path.join(root, role.profile ?? "");
    const profileText = existsSync(profile) ? readFileSync(profile, "utf8") : "";
    for (const skillId of role.skills ?? []) {
      if (!skillIds.has(skillId)) errors.push(`unknown skill for role ${role.id}: ${skillId}`);
      if (!profileText.includes(`\`${skillId}\``)) errors.push(`role profile does not declare skill ${skillId}: ${role.id}`);
    }
  }

  for (const skill of skills) {
    if (!ALLOWED_STATUSES.has(skill.status)) errors.push(`invalid status for ${skill.id}: ${skill.status}`);
    if (!roleIds.has(skill.ownerRole)) errors.push(`unknown owner role for ${skill.id}: ${skill.ownerRole}`);
    if (!roleIds.has(skill.reviewerRole)) errors.push(`unknown reviewer role for ${skill.id}: ${skill.reviewerRole}`);
    if (skill.ownerRole === skill.reviewerRole) errors.push(`skill must have an independent reviewer: ${skill.id}`);
    if (branchPolicy?.stageBPilotStatus !== "passed" && skill.source?.type !== "project-internal" && skill.status === "active") {
      errors.push(`adapted skill cannot be active before Stage B passes: ${skill.id}`);
    }
    validateSource({
      root,
      skill,
      canonicalRepository: manifest.canonicalRepository,
      expectedContentHash: locked.get(skill.id)?.contentSha256,
      skipSourceCommitVerification: overrides.skipSourceCommitVerification,
      errors,
    });

    const absolute = path.join(root, skill.path ?? "");
    const skillFile = path.join(absolute, "SKILL.md");
    if (!existsSync(skillFile)) {
      errors.push(`SKILL.md is missing for ${skill.id}`);
      continue;
    }
    if (!resolvesWithin(root, absolute, ".agents/skills")) {
      errors.push(`skill path resolves outside .agents/skills for ${skill.id}`);
      continue;
    }
    if (containsSymbolicLink(absolute)) {
      errors.push(`symbolic links are not allowed in skill directories: ${skill.id}`);
      continue;
    }
    const declaredName = readFileSync(skillFile, "utf8").match(/^name:\s*(.+)$/m)?.[1]?.trim();
    if (declaredName !== skill.id) errors.push(`frontmatter name mismatch for ${skill.id}: ${declaredName}`);

    const lockEntry = locked.get(skill.id);
    if (!lockEntry) errors.push(`lock entry is missing for ${skill.id}`);
    else {
      if (lockEntry.path !== skill.path) errors.push(`lock path mismatch for ${skill.id}`);
      if (lockEntry.contentSha256 !== hashSkillDirectory(absolute)) errors.push(`content hash mismatch for ${skill.id}`);
      if (lockEntry.sourceRevision !== skill.source?.revision) errors.push(`source revision mismatch in lock for ${skill.id}`);
    }

    for (const dependency of skill.dependencies ?? []) {
      if (!skillIds.has(dependency)) errors.push(`unknown dependency for ${skill.id}: ${dependency}`);
    }
  }

  validateDependencyCycles(skills, errors);
  for (const id of locked.keys()) if (!skillIds.has(id)) errors.push(`orphan lock entry: ${id}`);

  const registeredAgentFiles = new Set(roles.map((role) => role.profile));
  const registeredSkillDirs = new Set(skills.map((skill) => skill.path));
  const agentsRoot = path.join(root, ".agents/agents");
  const skillsRoot = path.join(root, ".agents/skills");
  if (existsSync(agentsRoot)) {
    for (const name of readdirSync(agentsRoot).filter((item) => item.endsWith(".md"))) {
      const candidate = `.agents/agents/${name}`;
      if (!registeredAgentFiles.has(candidate)) errors.push(`unregistered role profile: ${candidate}`);
    }
  }
  if (existsSync(skillsRoot)) {
    for (const name of readdirSync(skillsRoot)) {
      const absolute = path.join(skillsRoot, name);
      if (!statSync(absolute).isDirectory()) continue;
      const candidate = `.agents/skills/${name}`;
      if (!registeredSkillDirs.has(candidate)) errors.push(`unregistered skill directory: ${candidate}`);
    }
  }

  return [...new Set(errors)];
};
