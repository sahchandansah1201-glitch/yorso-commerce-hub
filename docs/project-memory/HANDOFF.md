# Handoff

Project: `yorso-commerce-hub`

## Read First

1. `AGENTS.md`
2. `docs/project-memory/CONTEXT_HEALTH.md`
3. `docs/project-memory/PROJECT_STATE.yaml`
4. `docs/project-memory/NEXT_ACTIONS.md`
5. `docs/project-memory/WORKLOG.md`
6. `docs/project-memory/ARTIFACTS.md`

## Current Goal

Continue self-hosted production backend/frontend batches for Yorso with large connected PRs and explicit quality gates.

## Current Status

- Batch #107 is in progress locally on branch `codex/batch107-incident-trend-analytics`.
- Batch #107 extends self-hosted admin incidents with trend analytics:
  - `GET /v1/admin/incidents/trends` returns bucketed incident pressure, source/status/severity mix, route risks and SLA posture;
  - `GET /v1/admin/incidents/trends/export?format=json|csv` exports the same bounded aggregate trend shape;
  - `GET /v1/admin/incidents/trends/anomalies` returns bounded anomaly rows;
  - `GET /v1/admin/incidents/trends/briefing` returns shift briefing sections, operator actions, capacity review and risk register;
  - frontend `/admin/incident-trends` renders `admin-incident-trends-page`, filters, summary, buckets, route risks, SLA, anomalies, briefing and export controls;
  - browser/runtime payloads keep raw emails, session ids, database URLs and Redis URLs out of UI and exports;
  - routes remain behind self-hosted admin session and role guards.
- Size contract for Batch #107: Batch #106 was `39 files / 3872 insertions`; Batch #107 target is at least `47 files / 4647 insertions`.
- Pending handoff steps: size re-measure, validation, `git diff --check`, commit, push, PR, GitHub checks, merge to `main`, then Lovable sync confirmation.

## Next Action

```text
Finish Batch #107 publication:
1. run final untracked-aware size report and confirm >= 47 files and >= 4647 insertions;
2. run validation listed in RUNS/2026-05-22-batch107-validation-plan.md;
3. run `git diff --check`;
4. commit and push branch codex/batch107-incident-trend-analytics;
5. open PR [codex] Batch #107 admin incident trend analytics;
6. merge after checks pass;
7. give numbered Lovable Prompt #107 to sync latest GitHub main.
```

## Rules

- Files are the source of truth.
- Do not invent old-chat context.
- Do not store secrets in project-memory.
- Keep production-facing decisions tied to the 10000 concurrent users capacity review.
- Treat repeated process instructions from the user as workflow rules. If the user repeats a rule twice, write it into the working contract before continuing.
