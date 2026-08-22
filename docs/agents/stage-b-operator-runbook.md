# Stage B Blind Pilot Operator Runbook

Last updated: 2026-08-22

## Purpose

This runbook turns the Stage B evidence contract into an executable, fail-closed
workflow. It does not create reviewers, signatures, scores or promotion proof.
Those inputs must come from real independent humans and external private keys.

## Security boundary

- Pilot workspaces live under ignored `.data/stage-b/<pilot-id>`.
- Executors receive only their assigned file from `tasks/` and the referenced
  fixture prompt.
- Reviewers receive only `review-packet/`; they must never receive
  `coordinator.json` or `tasks/`.
- Only Ed25519 public keys are committed to `.agents/actors.json`.
- Private keys stay outside the repository and pilot workspace.
- The accepted actor-registry SHA-256 is stored out of band and supplied as
  `YORSO_TRUSTED_ACTOR_REGISTRY_SHA256` during qualification.

## 1. Commit the candidate surface

Pilot initialization requires a clean repository. Commit the candidate skill,
governance tooling and fixtures before creating the workspace.

## 2. Initialize 30 blind-pilot tasks

```bash
npm run stage-b:init -- \
  --pilot copywriter-2026-08 \
  --skill yorso-multilingual-ux-copywriter-agent
```

The command creates five fixtures x two arms x three repeats. Task order and
task ids are randomized. Executor task files include the exact structured output
identity required by the evidence validator. The reviewer queue does not expose
the arm mapping.

## 3. Run tasks

For every task, write exactly one JSON file at its `outputPath`:

```json
{
  "schemaVersion": 1,
  "runKey": "F1:baseline:1",
  "evaluatedCommit": "40-character-commit",
  "candidateSkillId": "candidate-skill-id",
  "candidateSkillContentSha256": "64-character-sha256",
  "outputText": "The complete executor response"
}
```

Copy identity fields from the assigned task file. Do not infer or edit them.

## 4. Prepare the blind review packet

```bash
npm run stage-b:prepare-review -- --pilot copywriter-2026-08
```

This command refuses incomplete or identity-mismatched outputs. The generated
packet omits skill identity, experiment arm and run key.

## 5. Enrol real reviewers and approvers

Generate and retain each Ed25519 private key outside the repository. Register
only its public key:

```bash
npm run stage-b:register-actor -- \
  --id reviewer.one \
  --group quality-a \
  --roles stage-b-reviewer \
  --public-key-file /secure/outside-repo/reviewer-one.pub.pem
```

Use two reviewers from distinct independence groups. Promotion approvers are
registered separately with the `promotion-approver` role.

## 6. Inspect fail-closed status

```bash
npm run stage-b:status -- --pilot copywriter-2026-08
```

Exit code `2` means evidence is incomplete. This is expected until all outputs,
two real reviewers, exactly two signed sheets and the trusted registry digest
exist.

## 7. Qualification

After signed reviewer sheets and schema-version-5 evidence are committed and
the manifest maps the active skill to that evidence:

```bash
YORSO_TRUSTED_ACTOR_REGISTRY_SHA256=<out-of-band-digest> \
  npm run stage-b:qualify -- --pilot copywriter-2026-08
```

The command passes only when both workspace readiness and repository governance
validation pass. It does not mutate the manifest or promote a skill.

## 8. Main promotion readiness

Main remains a separate gate:

```bash
YORSO_TRUSTED_ACTOR_REGISTRY_SHA256=<out-of-band-digest> \
  npm run check:main-promotion
```

This command is intentionally not part of normal experimental CI because it
must fail while Stage B is pending or any skill remains experimental.
