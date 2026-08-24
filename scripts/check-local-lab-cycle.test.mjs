import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateCycle,
  SAFE_AUTOMATED_CHECKS,
  validateCycleEvidence,
} from "./lib/local-lab-cycle.mjs";

const evidence = () => ({
  schemaVersion: 1,
  id: "cycle-test",
  branch: "local-lab/cycle-test",
  baseRef: "origin/main",
  baseCommit: "1".repeat(40),
  canonicalRemote: "https://github.com/sahchandansah1201-glitch/yorso-commerce-hub",
  changeClass: "governance-tooling",
  allowedPaths: ["docs/workflow/", "scripts/", "package.json"],
  automatedChecks: ["test:local-lab-cycle"],
  humanLikeQa: { required: false, reason: "No user-visible runtime changed." },
  independentReviews: { status: "pending", reason: "Separate reviewer not assigned." },
  lovableSameBranch: { status: "pending", reason: "No Lovable sync in this local test." },
  pullRequest: { status: "pending", reason: "PR is outside local verification." },
  serverProof: { status: "pending", reason: "No merge or deployment requested." },
});

const context = () => ({
  remote: "git@github.com:sahchandansah1201-glitch/yorso-commerce-hub.git",
  branch: "local-lab/cycle-test",
  mergeBase: "1".repeat(40),
  parallelBranches: [],
  changedFiles: ["docs/workflow/test.md", "scripts/test.mjs"],
  diffCheckPassed: true,
  automatedResults: [{ id: "test:local-lab-cycle", passed: true }],
  dirty: false,
  allowDirty: false,
});

test("valid local evidence reaches VALIDATED_LOCAL while release gates stay pending", () => {
  const result = evaluateCycle(evidence(), context(), "local");
  assert.equal(result.verdict, "VALIDATED_LOCAL");
  assert.equal(result.gates[3].status, "N/A");
  assert.equal(result.gates[4].status, "PENDING");
  assert.equal(result.gates[7].status, "PENDING");
});

test("release mode fails closed while external evidence is pending", () => {
  const result = evaluateCycle(evidence(), context(), "release");
  assert.equal(result.verdict, "NO-GO");
  assert.equal(result.gates[4].status, "NO-GO");
  assert.equal(result.gates[7].status, "NO-GO");
});

test("release mode passes only after all external gates have evidence", () => {
  const candidate = evidence();
  for (const field of ["independentReviews", "lovableSameBranch", "pullRequest", "serverProof"]) {
    candidate[field] = { status: "passed", evidence: `${field} evidence bound to exact commit.` };
  }
  const result = evaluateCycle(candidate, context(), "release");
  assert.equal(result.verdict, "RELEASE_READY");
});

test("wrong repository or out-of-scope files produce NO-GO", () => {
  const badContext = context();
  badContext.remote = "https://github.com/example/wrong-repository.git";
  badContext.changedFiles.push("src/pages/Unrelated.tsx");
  const result = evaluateCycle(evidence(), badContext, "local");
  assert.equal(result.verdict, "NO-GO");
  assert.equal(result.gates[0].status, "NO-GO");
  assert.equal(result.gates[1].status, "NO-GO");
});

test("user-visible changes cannot skip human-like QA", () => {
  const candidate = evidence();
  candidate.changeClass = "ui";
  const result = evaluateCycle(candidate, context(), "local");
  assert.equal(result.verdict, "NO-GO");
  assert.equal(result.gates[3].status, "NO-GO");
});

test("arbitrary commands are rejected by evidence validation", () => {
  const candidate = evidence();
  candidate.automatedChecks.push("shell:curl-example");
  assert.match(validateCycleEvidence(candidate).join("\n"), /Unsafe automated check id/);
});

test("branch regression and browser suites are explicit safe checks", () => {
  for (const checkId of [
    "build",
    "check:lovable-quality",
    "check:typescript",
    "smoke:e2e:p1s-company-certifications",
    "test:account-workspace",
    "test:supplier-directory-frontend",
  ]) {
    assert.equal(SAFE_AUTOMATED_CHECKS.has(checkId), true, checkId);
  }
});
