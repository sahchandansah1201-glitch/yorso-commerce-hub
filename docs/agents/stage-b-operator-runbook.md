# Stage B Blind Pilot Operator Runbook

Last updated: 2026-08-23

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
- Every task is assigned once to one registered `stage-b-executor`. An
  assignment cannot be moved to another actor after it is written.
- Executors sign the exact canonical submission payload outside the repository.
  Any response, packet, assignment, actor key or signature drift fails closed
  during submission, status and blind-review preparation.
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

## 3. Enrol a real executor

Generate and retain the Ed25519 private key outside the repository. Register
only its public key:

```bash
npm run stage-b:register-actor -- \
  --id executor.one \
  --group execution-a \
  --roles stage-b-executor \
  --public-key-file /secure/outside-repo/executor-one.pub.pem
```

Store the reported actor-registry SHA-256 out of band. Do not commit private
keys, raw responses, canonical signing payloads or detached signatures.

## 4. Assign and generate one isolated executor packet

Generate the next packet whose output is still missing:

```bash
npm run stage-b:next -- \
  --pilot copywriter-2026-08 \
  --executor executor.one
```

To resume a known task, add `--task <task-id>`. Give the executor only the
reported packet. The command also writes an immutable task assignment. Never
provide `tasks/`, `coordinator.json`, another executor packet or an earlier
response.

The executor returns only its complete response as a UTF-8 text file. It must
not manufacture run keys, commit hashes or skill hashes.

### Codex CLI isolation

For Codex CLI executors, `--ignore-user-config --ignore-rules` is not a complete
isolation boundary when the normal `CODEX_HOME` still exposes global skills or
plugins. Use a fresh temporary `CODEX_HOME` and an empty working directory for
each run. Copy only the minimum authentication material into that temporary
home for the process lifetime, and remove the temporary home after retaining
the response outside the repository.

The temporary `CODEX_HOME`, executor working directory and operator artifacts
(event trace, raw response, canonical payload and detached signature) must use
separate physical roots. Do not place them in sibling directories under one
shared parent. A read-only sandbox may still allow the executor to discover or
read sibling files that the operator assumed were private.

The executor process must be ephemeral, use a read-only sandbox and receive
only the assigned packet content. It must not receive repository access, user
skills, rules, memory, another task packet or coordinator files. Never commit
or copy authentication material, private keys, raw responses, signing payloads
or signatures into the repository or pilot workspace.

Treat any run that reads external skills, rules, memory or project files as
contaminated. Interrupt it and do not sign or submit its response. Start again
with a fresh isolated home and empty working directory.

Inspect the complete Codex JSON event trace before signing. Reject the run if
any command or tool access mentions repository paths, user skills, memory,
coordinator/task mappings, another executor packet, operator logs,
authentication material or private keys. A sandbox denial proves that access
was blocked, not that the whole run is valid: retain the denial in the operator
audit, then accept the response only when the remaining trace and response are
free of forbidden context.

## 5. Prepare and sign the canonical submission payload

```bash
npm run stage-b:prepare-submission -- \
  --pilot copywriter-2026-08 \
  --task <task-id> \
  --executor executor.one \
  --response-file /secure/outside-repo/response.txt \
  --payload-file /secure/outside-repo/submission.json

openssl pkeyutl -sign -rawin \
  -inkey /secure/outside-repo/executor-one.private.pem \
  -in /secure/outside-repo/submission.json \
  -out /secure/outside-repo/submission.sig
```

Sign the exact bytes written by `stage-b:prepare-submission`. Editing the
response or payload after this step invalidates the signature.

## 6. Submit the signed response

```bash
npm run stage-b:submit-output -- \
  --pilot copywriter-2026-08 \
  --task <task-id> \
  --executor executor.one \
  --response-file /secure/outside-repo/response.txt \
  --signature-file /secure/outside-repo/submission.sig
```

The command regenerates the expected packet from the evaluated Git commit,
rejects packet tampering and output overwrite, and writes the structured output
with executor, assignment, packet, response and signing-payload provenance plus
the detached Ed25519 signature:

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
    "responseSha256": "64-character-sha256",
    "assignmentSha256": "64-character-sha256",
    "signingPayloadSha256": "64-character-sha256",
    "signature": "base64-ed25519-signature"
  }
}
```

Do not write files under `assignments/` or `outputs/` by hand. Repeat steps 4
through 6 until status
reports 30/30 outputs. Real executor responses are required; the command does
not generate or score content.

## 7. Prepare the blind review packet

```bash
npm run stage-b:prepare-review -- --pilot copywriter-2026-08
```

This command refuses incomplete, unsigned or identity-mismatched outputs. It
revalidates the stored assignment, response, canonical payload, registered
executor key and Ed25519 signature. The generated packet omits skill identity,
experiment arm and run key.

## 8. Enrol real reviewers and approvers

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

## 9. Inspect fail-closed status

```bash
npm run stage-b:status -- --pilot copywriter-2026-08
```

Exit code `2` means evidence is incomplete. This is expected until all tasks
have assignments and valid signed outputs, one real executor is registered,
two real reviewers exist, exactly two signed sheets exist and the trusted
registry digest is supplied.

## 10. Qualification

After signed reviewer sheets and schema-version-5 evidence are committed and
the manifest maps the active skill to that evidence:

```bash
YORSO_TRUSTED_ACTOR_REGISTRY_SHA256=<out-of-band-digest> \
  npm run stage-b:qualify -- --pilot copywriter-2026-08
```

The command passes only when both workspace readiness and repository governance
validation pass. It does not mutate the manifest or promote a skill.

## 11. Main promotion readiness

Main remains a separate gate:

```bash
YORSO_TRUSTED_ACTOR_REGISTRY_SHA256=<out-of-band-digest> \
  npm run check:main-promotion
```

This command is intentionally not part of normal experimental CI because it
must fail while Stage B is pending or any skill remains experimental.
