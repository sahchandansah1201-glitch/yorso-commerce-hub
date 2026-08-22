# Stage B Blind Pilot Operator Runbook

Last updated: 2026-08-22

## Purpose

This runbook turns the Stage B evidence contract into an executable, fail-closed
workflow. It does not create reviewers, signatures, scores or promotion proof.
Those inputs must come from real independent humans and external private keys.

## Security boundary

- Pilot workspaces live under ignored `.data/stage-b/<pilot-id>`.
- Executors receive only their generated file from `executor-packets/`.
- Baseline packets contain neither candidate identity nor candidate skill
  material. Candidate packets contain the exact skill bundle read from the
  evaluated commit, not the mutable working tree.
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

## 3. Generate one isolated executor packet

Generate the next packet whose output is still missing:

```bash
npm run stage-b:next -- --pilot copywriter-2026-08
```

To resume a known task, add `--task <task-id>`. Give the executor only the
reported packet. Never provide `tasks/`, `coordinator.json`, another executor
packet or an earlier response.

The executor returns only its complete response as a UTF-8 text file. It must
not manufacture run keys, commit hashes or skill hashes.

## 4. Submit the raw response

```bash
npm run stage-b:submit-output -- \
  --pilot copywriter-2026-08 \
  --task <task-id> \
  --executor <canonical-executor-id> \
  --response-file /path/outside-workspace/response.txt
```

The command regenerates the expected packet from the evaluated Git commit,
rejects packet tampering and output overwrite, and writes the structured output
with executor, packet and response SHA-256 provenance:

```json
{
  "schemaVersion": 1,
  "runKey": "F1:baseline:1",
  "evaluatedCommit": "40-character-commit",
  "candidateSkillId": "candidate-skill-id",
  "candidateSkillContentSha256": "64-character-sha256",
  "outputText": "The complete executor response",
  "executor": {
    "id": "executor.one",
    "packetSha256": "64-character-sha256",
    "responseSha256": "64-character-sha256"
  }
}
```

Do not write files under `outputs/` by hand. Repeat steps 3 and 4 until status
reports 30/30 outputs. Real executor responses are required; the command does
not generate or score content.

## 5. Prepare the blind review packet

```bash
npm run stage-b:prepare-review -- --pilot copywriter-2026-08
```

This command refuses incomplete or identity-mismatched outputs. The generated
packet omits skill identity, experiment arm and run key.

## 6. Enrol real reviewers and approvers

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

## 7. Inspect fail-closed status

```bash
npm run stage-b:status -- --pilot copywriter-2026-08
```

Exit code `2` means evidence is incomplete. This is expected until all outputs,
two real reviewers, exactly two signed sheets and the trusted registry digest
exist.

## 8. Qualification

After signed reviewer sheets and schema-version-5 evidence are committed and
the manifest maps the active skill to that evidence:

```bash
YORSO_TRUSTED_ACTOR_REGISTRY_SHA256=<out-of-band-digest> \
  npm run stage-b:qualify -- --pilot copywriter-2026-08
```

The command passes only when both workspace readiness and repository governance
validation pass. It does not mutate the manifest or promote a skill.

## 9. Main promotion readiness

Main remains a separate gate:

```bash
YORSO_TRUSTED_ACTOR_REGISTRY_SHA256=<out-of-band-digest> \
  npm run check:main-promotion
```

This command is intentionally not part of normal experimental CI because it
must fail while Stage B is pending or any skill remains experimental.
