export const SAFE_AUTOMATED_CHECKS = new Set([
  "check:agent-governance",
  "check:project-memory",
  "check:provider-boundary",
  "test:agent-governance",
  "test:local-lab-cycle",
  "test:project-memory",
]);

const RELEASE_GATE_FIELDS = [
  ["independentReviews", 4, "Independent reviews"],
  ["lovableSameBranch", 5, "Lovable same-branch"],
  ["pullRequest", 6, "Pull request"],
  ["serverProof", 7, "Server proof"],
];

const status = (value, detail) => ({ status: value, detail });

export const normalizeGitHubRemote = (value = "") =>
  value
    .trim()
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

export function validateCycleEvidence(evidence) {
  const errors = [];
  if (!evidence || typeof evidence !== "object") return ["Evidence must be an object."];
  if (evidence.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
  for (const key of ["id", "branch", "baseRef", "baseCommit", "canonicalRemote", "changeClass"]) {
    if (!isNonEmptyString(evidence[key])) errors.push(`${key} must be a non-empty string.`);
  }
  if (!/^local-lab\/[a-z0-9][a-z0-9._-]*$/.test(evidence.branch ?? "")) {
    errors.push("branch must match local-lab/<scope>.");
  }
  if (!/^[0-9a-f]{40}$/.test(evidence.baseCommit ?? "")) {
    errors.push("baseCommit must be a full 40-character Git SHA.");
  }
  if (!Array.isArray(evidence.allowedPaths) || evidence.allowedPaths.length === 0) {
    errors.push("allowedPaths must contain at least one path.");
  }
  if (!Array.isArray(evidence.automatedChecks) || evidence.automatedChecks.length === 0) {
    errors.push("automatedChecks must contain at least one safe check id.");
  } else {
    for (const checkId of evidence.automatedChecks) {
      if (!SAFE_AUTOMATED_CHECKS.has(checkId)) errors.push(`Unsafe automated check id: ${checkId}.`);
    }
  }
  if (!evidence.humanLikeQa || typeof evidence.humanLikeQa !== "object") {
    errors.push("humanLikeQa must be defined.");
  } else if (evidence.humanLikeQa.required === false && !isNonEmptyString(evidence.humanLikeQa.reason)) {
    errors.push("humanLikeQa.reason is required when human-like QA is not applicable.");
  }
  for (const [field] of RELEASE_GATE_FIELDS) {
    if (!evidence[field] || !["pending", "passed"].includes(evidence[field].status)) {
      errors.push(`${field}.status must be pending or passed.`);
    }
    if (evidence[field]?.status === "pending" && !isNonEmptyString(evidence[field].reason)) {
      errors.push(`${field}.reason is required while the gate is pending.`);
    }
    if (evidence[field]?.status === "passed" && !isNonEmptyString(evidence[field].evidence)) {
      errors.push(`${field}.evidence is required when the gate is passed.`);
    }
  }
  return errors;
}

const pathAllowed = (file, allowedPaths) =>
  allowedPaths.some((entry) => {
    const normalized = entry.replace(/^\.\//, "").replace(/\/$/, "");
    return file === normalized || file.startsWith(`${normalized}/`);
  });

const gateErrors = (items) => items.filter(Boolean);

export function evaluateCycle(evidence, context, mode = "local") {
  if (!new Set(["local", "release"]).has(mode)) throw new Error(`Unsupported mode: ${mode}`);

  const schemaErrors = validateCycleEvidence(evidence);
  const gates = new Map();

  const gate0Errors = gateErrors([
    ...schemaErrors,
    normalizeGitHubRemote(context.remote) !== normalizeGitHubRemote(evidence.canonicalRemote)
      ? `Remote mismatch: ${context.remote}`
      : null,
    context.branch !== evidence.branch ? `Branch mismatch: ${context.branch}` : null,
    context.mergeBase !== evidence.baseCommit
      ? `Merge-base mismatch: expected ${evidence.baseCommit}, got ${context.mergeBase}`
      : null,
    context.parallelBranches?.length
      ? `Parallel branches found: ${context.parallelBranches.join(", ")}`
      : null,
    mode === "release" && context.dirty ? "Release mode requires a clean worktree." : null,
    mode === "local" && context.dirty && !context.allowDirty
      ? "Local mode requires a clean worktree unless --allow-dirty is explicit."
      : null,
  ]);
  gates.set(0, gate0Errors.length ? status("NO-GO", gate0Errors.join(" ")) : status("PASS", "Repository, branch and base identity match."));

  const unexpectedFiles = (context.changedFiles ?? []).filter(
    (file) => !pathAllowed(file, evidence.allowedPaths ?? []),
  );
  const gate1Errors = gateErrors([
    unexpectedFiles.length ? `Out-of-scope files: ${unexpectedFiles.join(", ")}` : null,
    context.diffCheckPassed === false ? "git diff --check failed." : null,
  ]);
  gates.set(1, gate1Errors.length ? status("NO-GO", gate1Errors.join(" ")) : status("PASS", `${context.changedFiles?.length ?? 0} changed files are inside the declared scope.`));

  const automatedResults = context.automatedResults ?? [];
  const missingChecks = (evidence.automatedChecks ?? []).filter(
    (checkId) => !automatedResults.some((result) => result.id === checkId),
  );
  const failedChecks = automatedResults.filter((result) => result.passed === false).map((result) => result.id);
  const gate2Errors = gateErrors([
    missingChecks.length ? `Checks not executed: ${missingChecks.join(", ")}` : null,
    failedChecks.length ? `Checks failed: ${failedChecks.join(", ")}` : null,
  ]);
  gates.set(2, gate2Errors.length ? status("NO-GO", gate2Errors.join(" ")) : status("PASS", `${automatedResults.length} safe automated checks passed.`));

  let gate3;
  if (evidence.humanLikeQa?.required) {
    gate3 = evidence.humanLikeQa.status === "passed" && isNonEmptyString(evidence.humanLikeQa.evidence)
      ? status("PASS", evidence.humanLikeQa.evidence)
      : status("NO-GO", "Human-like QA is required but has no passed evidence.");
  } else if (["ui", "user-visible", "runtime"].includes(evidence.changeClass)) {
    gate3 = status("NO-GO", `${evidence.changeClass} changes cannot mark human-like QA as not applicable.`);
  } else {
    gate3 = status("N/A", evidence.humanLikeQa?.reason ?? "Not applicable.");
  }
  gates.set(3, gate3);

  for (const [field, gate, label] of RELEASE_GATE_FIELDS) {
    const record = evidence[field];
    if (record?.status === "passed") gates.set(gate, status("PASS", record.evidence));
    else if (mode === "release") gates.set(gate, status("NO-GO", `${label} pending: ${record?.reason ?? "missing evidence"}`));
    else gates.set(gate, status("PENDING", record?.reason ?? "Not required for local validation."));
  }

  const requiredGates = mode === "release" ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3];
  const blocked = requiredGates.some((gate) => gates.get(gate)?.status === "NO-GO");
  const verdict = blocked ? "NO-GO" : mode === "release" ? "RELEASE_READY" : "VALIDATED_LOCAL";
  return { verdict, mode, gates: Object.fromEntries(gates) };
}
