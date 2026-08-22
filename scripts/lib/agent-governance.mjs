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
const STAGE_B_EVIDENCE_SCHEMA_VERSION = 4;
const PROMOTION_EVIDENCE_SCHEMA_VERSION = 4;
const REVIEWER_SHEET_SCHEMA_VERSION = 2;
const ACTOR_REGISTRY_SCHEMA_VERSION = 1;
const FIXTURE_ORACLE_SCHEMA_VERSION = 1;
const GOVERNANCE_SURFACE_PATHS = [
  ".agents",
  ".github/workflows/ci.yml",
  "AGENTS.md",
  "docs/agents",
  "docs/project-memory",
  "package.json",
  "scripts/check-agent-governance.mjs",
  "scripts/check-agent-governance.test.mjs",
  "scripts/check-gate-mutation.mjs",
  "scripts/check-gate-mutation.test.mjs",
  "scripts/check-project-memory.mjs",
  "scripts/check-project-memory.test.mjs",
  "scripts/check-provider-production-boundary.mjs",
  "scripts/lib/agent-governance.mjs",
  "src/test/provider-free-tooling-retirement.test.ts",
  "src/test/self-hosted-backend-policy.test.ts",
];
const STAGE_B_ARTIFACT_MINIMUMS = {
  prompts: 5,
  outputs: 30,
  reviewerSheets: 2,
  disagreementResolution: 1,
  costReport: 1,
};
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const CANONICAL_ACTOR_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
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
const REQUIRED_ACTOR_ROLES = new Set(["stage-b-reviewer", "promotion-approver"]);

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const canonicalActorId = (value) =>
  typeof value === "string" ? value.normalize("NFKC").trim().toLowerCase() : "";

const isCanonicalActorId = (value) =>
  typeof value === "string" && value === canonicalActorId(value) && CANONICAL_ACTOR_ID_PATTERN.test(value);

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

const approximatelyEqual = (left, right, tolerance = 1e-6) =>
  Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= tolerance;

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

const validateActorRegistry = (registry, errors) => {
  if (registry?.schemaVersion !== ACTOR_REGISTRY_SCHEMA_VERSION) {
    errors.push(`actors.schemaVersion must be ${ACTOR_REGISTRY_SCHEMA_VERSION}`);
  }
  const actors = Array.isArray(registry?.actors) ? registry.actors : [];
  const actorIds = new Set();
  for (const actor of actors) {
    if (!isCanonicalActorId(actor?.id) || actorIds.has(actor.id)) {
      errors.push(`actor registry contains a duplicate or non-canonical id: ${actor?.id ?? "missing"}`);
    }
    actorIds.add(actor?.id);
    if (typeof actor?.independenceGroup !== "string" || actor.independenceGroup.trim().length === 0) {
      errors.push(`actor registry independenceGroup is missing for ${actor?.id ?? "missing"}`);
    }
    if (
      !Array.isArray(actor?.allowedRoles) ||
      actor.allowedRoles.length === 0 ||
      actor.allowedRoles.some((role) => !REQUIRED_ACTOR_ROLES.has(role))
    ) {
      errors.push(`actor registry allowedRoles are invalid for ${actor?.id ?? "missing"}`);
    }
  }
  return new Map(actors.filter((actor) => isCanonicalActorId(actor?.id)).map((actor) => [actor.id, actor]));
};

const validateActorsForRole = ({ ids, role, actors, label, errors }) => {
  const resolved = ids.map((id) => actors.get(id));
  ids.forEach((id, index) => {
    if (!resolved[index]) errors.push(`${label} actor is not registered: ${id}`);
    else if (!resolved[index].allowedRoles.includes(role)) errors.push(`${label} actor lacks ${role}: ${id}`);
  });
  const groups = resolved.filter(Boolean).map((actor) => actor.independenceGroup);
  if (groups.length === ids.length && new Set(groups).size !== groups.length) {
    errors.push(`${label} actors must belong to distinct independence groups`);
  }
};

const validateFixtureOracle = ({ root, fixtureOracle, errors }) => {
  if (fixtureOracle?.schemaVersion !== FIXTURE_ORACLE_SCHEMA_VERSION) {
    errors.push(`fixture oracle schemaVersion must be ${FIXTURE_ORACLE_SCHEMA_VERSION}`);
  }
  const fixtures = Array.isArray(fixtureOracle?.fixtures) ? fixtureOracle.fixtures : [];
  const byId = new Map();
  for (const fixture of fixtures) {
    if (!REQUIRED_STAGE_B_FIXTURES.includes(fixture?.id) || byId.has(fixture?.id)) {
      errors.push(`fixture oracle contains an invalid or duplicate fixture: ${fixture?.id ?? "missing"}`);
      continue;
    }
    const artifact = { path: fixture.path, sha256: fixture.sha256 };
    validateBoundArtifact({
      root,
      artifact,
      allowedRoot: "docs/agents/pilots/fixtures",
      label: `fixture oracle ${fixture.id}`,
      errors,
    });
    if (
      !Array.isArray(fixture.criticalDefectIds) ||
      fixture.criticalDefectIds.length === 0 ||
      new Set(fixture.criticalDefectIds).size !== fixture.criticalDefectIds.length ||
      fixture.criticalDefectIds.some((id) => !isCanonicalActorId(id))
    ) {
      errors.push(`fixture oracle critical defects are invalid for ${fixture.id}`);
    }
    byId.set(fixture.id, fixture);
  }
  if (fixtures.length !== REQUIRED_STAGE_B_FIXTURES.length || REQUIRED_STAGE_B_FIXTURES.some((id) => !byId.has(id))) {
    errors.push("fixture oracle must define F1 through F5 exactly once");
  }
  return byId;
};

export const getDirtyGovernedSurface = (root) =>
  git(root, ["status", "--porcelain=v1", "--untracked-files=all", "--", ...GOVERNANCE_SURFACE_PATHS]) ?? "";

const validateGovernedCommit = ({ root, commit, label, errors, skipRepositoryInspection }) => {
  if (!/^[0-9a-f]{40}$/.test(commit ?? "") || /^0+$/.test(commit ?? "")) {
    errors.push(`${label} requires a non-zero commit`);
    return;
  }
  if (skipRepositoryInspection) return;
  if (getDirtyGovernedSurface(root)) {
    errors.push(`${label} cannot be validated while the governed surface has uncommitted changes`);
    return;
  }
  if (git(root, ["cat-file", "-e", `${commit}^{commit}`]) === null) {
    errors.push(`${label} commit does not exist: ${commit}`);
  } else if (git(root, ["merge-base", "--is-ancestor", commit, "HEAD"]) === null) {
    errors.push(`${label} commit must be an ancestor of HEAD`);
  } else if (git(root, ["diff", "--quiet", commit, "HEAD", "--", ...GOVERNANCE_SURFACE_PATHS]) === null) {
    errors.push(`${label} is stale because the governed surface changed after ${commit}`);
  }
};

const readReviewerSheet = ({
  root,
  artifactPath,
  reviewerId,
  candidateSkillId,
  runKeys,
  fixtureOracleById,
  errors,
}) => {
  let sheet;
  try {
    sheet = readJson(path.join(root, artifactPath));
  } catch {
    errors.push(`Stage B reviewer sheet must contain valid JSON: ${artifactPath}`);
    return null;
  }
  if (
    sheet.schemaVersion !== REVIEWER_SHEET_SCHEMA_VERSION ||
    sheet.reviewerId !== reviewerId ||
    sheet.candidateSkillId !== candidateSkillId
  ) {
    errors.push(`Stage B reviewer sheet identity mismatch: ${artifactPath}`);
  }
  const reviews = Array.isArray(sheet.reviews) ? sheet.reviews : [];
  const seen = new Set();
  for (const review of reviews) {
    const key = review?.runKey;
    if (!runKeys.has(key) || seen.has(key)) errors.push(`invalid or duplicate Stage B review tuple: ${key}`);
    seen.add(key);
    if (!Number.isFinite(review?.score) || review.score < 0 || review.score > 100) {
      errors.push(`Stage B review score must be between 0 and 100: ${key}`);
    }
    const fixtureId = key?.split(":")[0];
    const expectedDefects = new Set(fixtureOracleById.get(fixtureId)?.criticalDefectIds ?? []);
    const foundDefects = Array.isArray(review?.criticalDefectIdsFound) ? review.criticalDefectIdsFound : [];
    if (
      foundDefects.length !== new Set(foundDefects).size ||
      foundDefects.some((id) => !expectedDefects.has(id)) ||
      hasOwn(review ?? {}, "criticalDefectsExpected") ||
      hasOwn(review ?? {}, "criticalDefectsFound")
    ) {
      errors.push(`Stage B review defect evidence is invalid: ${key}`);
    }
    if (typeof review?.pass !== "boolean") errors.push(`Stage B review pass decision is missing: ${key}`);
  }
  if (reviews.length !== runKeys.size || [...runKeys].some((key) => !seen.has(key))) {
    errors.push(`Stage B reviewer sheet must review every run exactly once: ${artifactPath}`);
  }
  return reviews;
};

const computeStageBMetrics = ({ runs, reviewerReviews, fixtureOracleById, errors }) => {
  const runByKey = new Map(runs.map((run) => [`${run.fixtureId}:${run.arm}:${run.repeat}`, run]));
  const allReviews = reviewerReviews.flat();
  const reviewsForArm = (arm) => allReviews.filter((review) => runByKey.get(review.runKey)?.arm === arm);
  const baselineReviews = reviewsForArm("baseline");
  const candidateReviews = reviewsForArm("candidate");
  if (baselineReviews.length === 0 || candidateReviews.length === 0) return null;
  const recall = (reviews) => {
    const expected = reviews.reduce((sum, review) => {
      const fixtureId = review.runKey.split(":")[0];
      return sum + (fixtureOracleById.get(fixtureId)?.criticalDefectIds.length ?? 0);
    }, 0);
    const found = reviews.reduce((sum, review) => sum + review.criticalDefectIdsFound.length, 0);
    if (expected === 0) {
      errors.push("Stage B critical-defect recall requires a non-empty fixture oracle");
      return Number.NaN;
    }
    return found / expected;
  };
  const pairedReviews = new Map();
  reviewerReviews.forEach((reviews, reviewerIndex) => {
    for (const review of reviews) {
      const decisions = pairedReviews.get(review.runKey) ?? [];
      decisions[reviewerIndex] = review.pass;
      pairedReviews.set(review.runKey, decisions);
    }
  });
  const pairs = [...pairedReviews.values()].filter((decisions) => decisions.length === 2);
  if (reviewerReviews.length !== 2 || pairs.length !== runs.length) {
    errors.push("Stage B Cohen's kappa requires exactly two complete reviewer sheets");
    return null;
  }
  const observedAgreement = pairs.filter(([left, right]) => left === right).length / pairs.length;
  const leftPassRate = pairs.filter(([left]) => left).length / pairs.length;
  const rightPassRate = pairs.filter(([, right]) => right).length / pairs.length;
  const expectedAgreement =
    leftPassRate * rightPassRate + (1 - leftPassRate) * (1 - rightPassRate);
  if (expectedAgreement === 1) {
    errors.push("Stage B Cohen's kappa is undefined when reviewer decisions have no variance");
    return null;
  }
  const cohensKappa = (observedAgreement - expectedAgreement) / (1 - expectedAgreement);
  const overheadRatios = REQUIRED_STAGE_B_FIXTURES.flatMap((fixtureId) =>
    [1, 2, 3].map((repeat) => {
      const baseline = runByKey.get(`${fixtureId}:baseline:${repeat}`)?.costUnits;
      const candidate = runByKey.get(`${fixtureId}:candidate:${repeat}`)?.costUnits;
      if (!Number.isFinite(baseline) || baseline <= 0 || !Number.isFinite(candidate) || candidate <= 0) {
        errors.push(`Stage B run costUnits must be positive for ${fixtureId}:${repeat}`);
        return Number.NaN;
      }
      return candidate / baseline - 1;
    }),
  );
  if (overheadRatios.some((ratio) => !Number.isFinite(ratio))) return null;
  return {
    baselineMean: mean(baselineReviews.map((review) => review.score)),
    candidateMean: mean(candidateReviews.map((review) => review.score)),
    baselineCriticalDefectRecall: recall(baselineReviews),
    candidateCriticalDefectRecall: recall(candidateReviews),
    cohensKappa,
    medianOverheadRatio: median(overheadRatios),
  };
};

const validateStageBEvidenceFile = ({
  root,
  evidence,
  skill,
  skillContentSha256,
  actors,
  fixtureOracleById,
  fixtureOracleSha256,
  globalArtifactPaths,
  globalArtifactHashes,
  errors,
  skipRepositoryInspection,
}) => {
  const absolute = path.join(root, evidence);
  if (!existsSync(absolute) || !resolvesWithin(root, absolute, "docs/agents/pilots/results") || containsSymbolicLink(absolute)) {
    errors.push(`Stage B evidence must be a non-symlink file inside docs/agents/pilots/results: ${evidence}`);
    return;
  }
  let report;
  try {
    report = readJson(absolute);
  } catch {
    errors.push(`Stage B evidence must contain valid JSON: ${evidence}`);
    return;
  }
  const metrics = report.metrics ?? {};
  const artifacts = report.artifacts ?? {};
  if (report.schemaVersion !== STAGE_B_EVIDENCE_SCHEMA_VERSION) {
    errors.push(`Stage B evidence schemaVersion must be ${STAGE_B_EVIDENCE_SCHEMA_VERSION}`);
  }
  if (report.candidateSkillId !== skill.id) errors.push(`Stage B evidence skill mismatch for ${skill.id}`);
  if (report.candidateSkillContentSha256 !== skillContentSha256) {
    errors.push(`Stage B evidence content hash mismatch for ${skill.id}`);
  }
  if (report.fixtureOracleSha256 !== fixtureOracleSha256) {
    errors.push(`Stage B evidence fixture oracle hash mismatch for ${skill.id}`);
  }
  validateGovernedCommit({
    root,
    commit: report.evaluatedCommit,
    label: `Stage B evidence for ${skill.id}`,
    errors,
    skipRepositoryInspection,
  });
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
    if (!Number.isFinite(run.costUnits) || run.costUnits <= 0) {
      errors.push(`Stage B run costUnits must be positive: ${key}`);
    }
  }
  const expectedRunKeys = REQUIRED_STAGE_B_FIXTURES.flatMap((fixture) =>
    REQUIRED_STAGE_B_ARMS.flatMap((arm) => [1, 2, 3].map((repeat) => `${fixture}:${arm}:${repeat}`)),
  );
  if (runs.length !== 30 || expectedRunKeys.some((key) => !runKeys.has(key))) {
    errors.push("Stage B evidence must contain all 30 unique fixture/arm/repeat runs");
  }

  const reviewers = Array.isArray(report.reviewers) ? report.reviewers : [];
  const reviewerIds = reviewers.map((reviewer) => reviewer?.id);
  if (
    reviewerIds.length !== 2 ||
    reviewerIds.some((id) => !isCanonicalActorId(id)) ||
    new Set(reviewerIds.map(canonicalActorId)).size !== reviewerIds.length
  ) {
    errors.push("Stage B evidence requires exactly two unique canonical reviewer IDs");
  }
  validateActorsForRole({
    ids: reviewerIds,
    role: "stage-b-reviewer",
    actors,
    label: "Stage B reviewer",
    errors,
  });
  if (!Array.isArray(report.hardFailures) || report.hardFailures.length !== 0) {
    errors.push("Stage B evidence must explicitly record zero hard failures");
  }
  if (!Array.isArray(report.regressions) || report.regressions.length !== 0) {
    errors.push("Stage B evidence must explicitly record zero regressions");
  }
  const artifactPaths = new Set();
  const artifactHashes = new Set();
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
      if (artifactHashes.has(artifact.sha256)) errors.push(`Stage B artifact content is reused: ${artifact.sha256}`);
      if (globalArtifactPaths.has(artifactPath)) {
        errors.push(`Stage B artifact path is reused across skills: ${artifactPath}`);
      }
      if (globalArtifactHashes.has(artifact.sha256)) {
        errors.push(`Stage B artifact content is reused across skills: ${artifact.sha256}`);
      }
      artifactPaths.add(artifactPath);
      artifactHashes.add(artifact.sha256);
      globalArtifactPaths.add(artifactPath);
      globalArtifactHashes.add(artifact.sha256);
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
  const reviewerReviews = [];
  for (const reviewer of reviewers) {
    if (!reviewerSheetPaths.has(reviewer?.sheetArtifact)) {
      errors.push(`Stage B reviewer sheet is not checksum-bound: ${reviewer?.sheetArtifact}`);
      continue;
    }
    const reviews = readReviewerSheet({
      root,
      artifactPath: reviewer.sheetArtifact,
      reviewerId: reviewer.id,
      candidateSkillId: report.candidateSkillId,
      runKeys,
      fixtureOracleById,
      errors,
    });
    if (reviews) reviewerReviews.push(reviews);
  }
  const promptUsage = new Map([...promptPaths].map((artifactPath) => [artifactPath, 0]));
  const outputUsage = new Map([...outputPaths].map((artifactPath) => [artifactPath, 0]));
  for (const run of runs) {
    if (promptUsage.has(run.promptArtifact)) promptUsage.set(run.promptArtifact, promptUsage.get(run.promptArtifact) + 1);
    if (outputUsage.has(run.outputArtifact)) outputUsage.set(run.outputArtifact, outputUsage.get(run.outputArtifact) + 1);
  }
  if (promptPaths.size !== 5 || [...promptUsage.values()].some((count) => count !== 6)) {
    errors.push("Stage B requires five prompt artifacts used by exactly six runs each");
  }
  if (outputPaths.size !== 30 || [...outputUsage.values()].some((count) => count !== 1)) {
    errors.push("Stage B requires 30 unique output artifacts used exactly once");
  }
  if (reviewerSheetPaths.size !== 2) errors.push("Stage B requires exactly two reviewer sheet artifacts");

  const computedMetrics = computeStageBMetrics({ runs, reviewerReviews, fixtureOracleById, errors });
  if (computedMetrics) {
    for (const [metric, computed] of Object.entries(computedMetrics)) {
      if (!approximatelyEqual(metrics[metric], computed)) {
        errors.push(`Stage B metric does not match reviewer/run evidence: ${metric}`);
      }
    }
    if (
      computedMetrics.candidateMean < 85 ||
      computedMetrics.candidateCriticalDefectRecall !== 1 ||
      computedMetrics.cohensKappa < 0.75
    ) {
      errors.push("Stage B evidence does not meet score, recall or reviewer-agreement thresholds");
    }
    if (computedMetrics.medianOverheadRatio > 0.25) {
      errors.push("Stage B evidence exceeds the median overhead threshold");
    }
    const scoreDelta = computedMetrics.candidateMean - computedMetrics.baselineMean;
    const recallDelta =
      computedMetrics.candidateCriticalDefectRecall - computedMetrics.baselineCriticalDefectRecall;
    if (scoreDelta < 8 && recallDelta < 0.2) {
      errors.push("Stage B evidence does not meet the baseline improvement threshold");
    }
  }
};

const validateStageBEvidence = ({
  root,
  branchPolicy,
  skills,
  locked,
  actors,
  fixtureOracleById,
  fixtureOracleSha256,
  errors,
  skipRepositoryInspection = false,
}) => {
  if (branchPolicy?.stageBPilotStatus !== "passed") return;
  const evidenceBySkill = branchPolicy.stageBEvidenceBySkill;
  if (!evidenceBySkill || typeof evidenceBySkill !== "object" || Array.isArray(evidenceBySkill)) {
    errors.push("branchPolicy.stageBEvidenceBySkill is required when Stage B passes");
    return;
  }
  const activeAdaptedSkills = skills.filter(
    (skill) => skill.source?.type !== "project-internal" && skill.status === "active",
  );
  if (activeAdaptedSkills.length === 0) errors.push("passed Stage B requires at least one active adapted skill");
  const evidencePaths = new Set();
  const globalArtifactPaths = new Set();
  const globalArtifactHashes = new Set();
  for (const skill of activeAdaptedSkills) {
    const evidence = evidenceBySkill[skill.id];
    if (!isSafeRelativePath(evidence ?? "")) {
      errors.push(`Stage B evidence is required for active adapted skill: ${skill.id}`);
      continue;
    }
    if (evidencePaths.has(evidence)) errors.push(`Stage B evidence file is reused across skills: ${evidence}`);
    evidencePaths.add(evidence);
    validateStageBEvidenceFile({
      root,
      evidence,
      skill,
      skillContentSha256: locked.get(skill.id)?.contentSha256,
      actors,
      fixtureOracleById,
      fixtureOracleSha256,
      globalArtifactPaths,
      globalArtifactHashes,
      errors,
      skipRepositoryInspection,
    });
  }
  const allowedSkillIds = new Set(activeAdaptedSkills.map((skill) => skill.id));
  for (const skillId of Object.keys(evidenceBySkill)) {
    if (!allowedSkillIds.has(skillId)) errors.push(`Stage B evidence maps a non-active adapted skill: ${skillId}`);
  }
};

const validatePromotionEvidence = ({ root, branchPolicy, actors, errors, skipRepositoryInspection = false }) => {
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
  if (report.schemaVersion !== PROMOTION_EVIDENCE_SCHEMA_VERSION) {
    errors.push(`promotion evidence schemaVersion must be ${PROMOTION_EVIDENCE_SCHEMA_VERSION}`);
  }
  const approvedBy = Array.isArray(report.approvedBy) ? report.approvedBy : [];
  if (
    approvedBy.length < 2 ||
    approvedBy.some((id) => !isCanonicalActorId(id)) ||
    new Set(approvedBy.map(canonicalActorId)).size !== approvedBy.length
  ) {
    errors.push("promotion evidence requires two unique canonical independent approvers");
  }
  validateActorsForRole({
    ids: approvedBy,
    role: "promotion-approver",
    actors,
    label: "promotion approver",
    errors,
  });
  validateGovernedCommit({
    root,
    commit: report.reviewedCommit,
    label: "promotion evidence",
    errors,
    skipRepositoryInspection,
  });
  if (canonicalJson(report.stageBEvidenceBySkill) !== canonicalJson(branchPolicy.stageBEvidenceBySkill)) {
    errors.push("promotion evidence must reference branchPolicy.stageBEvidenceBySkill");
  }
  const gateResults = report.gateResults ?? {};
  const gateArtifactPaths = new Set();
  const gateArtifactHashes = new Set();
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
    if (artifactPath && gateArtifactHashes.has(result.artifact.sha256)) {
      errors.push(`promotion gate artifact content is reused: ${result.artifact.sha256}`);
    }
    if (artifactPath) gateArtifactPaths.add(artifactPath);
    if (artifactPath) gateArtifactHashes.add(result.artifact.sha256);
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
  actors: readJson(path.join(root, ".agents/actors.json")),
  fixtureOracle: readJson(path.join(root, "docs/agents/pilots/fixture-oracle.json")),
});

export const validateAgentGovernance = (root, overrides = {}) => {
  const loaded = overrides.manifest && overrides.lock && overrides.actors && overrides.fixtureOracle
    ? overrides
    : { ...loadAgentGovernance(root), ...overrides };
  const { manifest, lock, actors: actorRegistry, fixtureOracle } = loaded;
  const errors = [];
  const roles = manifest.roles ?? [];
  const skills = manifest.skills ?? [];
  const roleIds = new Set();
  const skillIds = new Set();
  const roleProfiles = new Set();
  const skillPaths = new Set();
  const locked = new Map();
  const actors = validateActorRegistry(actorRegistry, errors);
  const fixtureOracleById = validateFixtureOracle({ root, fixtureOracle, errors });
  const fixtureOracleSha256 = hashFile(path.join(root, "docs/agents/pilots/fixture-oracle.json"));

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
    skills,
    locked,
    actors,
    fixtureOracleById,
    fixtureOracleSha256,
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
        actors,
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
