# Project Agent Notes

## Что это за проект

`yorso-commerce-hub` — рабочий frontend/backend prototype для Yorso, созданный и развиваемый вокруг Lovable, B2B marketplace UX, self-hosted backend planning, Supabase boundary checks, account reports, e2e tests and production-scale readiness.

## Где смотреть в первую очередь

- `README.md` — краткое описание проекта.
- `package.json` — scripts, checks, build/test entrypoints.
- `src/` — frontend implementation.
- `apps/`, `packages/`, `infra/`, `supabase/` — backend, database, infrastructure and boundary areas if present.
- `docs/project-memory/` — recovery source for project status and new-chat handoff.

## Правила для изменений

1. Не считай историю чата источником правды, если она не подтверждена файлами проекта или явным handoff от пользователя.

2. Перед крупной работой сначала прочитай:
   - `docs/project-memory/CONTEXT_HEALTH.md`
   - `docs/project-memory/PROJECT_STATE.yaml`
   - `docs/project-memory/HANDOFF.md`
   - `docs/project-memory/NEXT_ACTIONS.md`

3. После значимого изменения состояния проекта обновляй:
   - `docs/project-memory/CONTEXT_HEALTH.md`
   - `docs/project-memory/PROJECT_STATE.yaml`
   - `docs/project-memory/HANDOFF.md`
   - `docs/project-memory/WORKLOG.md`
   - `docs/project-memory/NEXT_ACTIONS.md`
   - `docs/project-memory/ARTIFACTS.md`, если появились новые outputs
   - `docs/project-memory/RISKS.md`, если появился новый риск

4. Для новых, неоднозначных или high-stakes задач сначала используй Discovery Interview:
   - objective / decision
   - stakeholder
   - evidence / source materials
   - constraints / anti-goals
   - approval or risk boundary
   - done condition

5. Для production-facing frontend, backend, persistence, queues, integrations or runtime decisions проектируй с baseline не ниже `10 000` concurrent users and document:
   - expected read/write profile;
   - cache/queue/backpressure strategy;
   - database indexing and pagination strategy;
   - failure mode and graceful degradation;
   - observability and load-test plan.

6. Не храни secrets, API keys, passwords, private tokens or client credentials in `docs/project-memory`.

7. Не откатывай пользовательские изменения и не выполняй destructive git actions без явного запроса пользователя.

8. Engineer Agent Action Contract:
   - If the user repeats a process instruction twice, promote it to an explicit working contract before continuing.
   - Do not keep answering with explanations when the correct engineer-agent action is to update the project rules, project memory, plan, tests, or implementation.
   - For Yorso production batches, default to large connected batches unless the user asks for a small fix.
   - A normal production batch should include multiple connected layers: runtime/backend or frontend feature, integration, tests, smoke/e2e or runtime validation, docs, guard scripts, and CI wiring.
   - If a batch must be smaller, state the blocker before implementation.
   - Each completed batch must include a Batch Size Report: files changed, layers touched, tests added, docs/guards updated, and plan items closed.
   - User instruction "Увеличивай объем кода в каждом batch / PR" is a standing workflow rule, not a one-off preference.
   - Failure Learning Contract:
     - When a batch exposes a process or code mistake, record it in `docs/project-memory/ENGINEERING_LESSONS.md` with symptom, root cause, fix and guard.
     - API-backed e2e specs that require `VITE_YORSO_API_URL` must not be added to generic `smoke:e2e:run`; use a dedicated `smoke:e2e:*` script that builds with `VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`.
     - Do not run two Vite build-based e2e commands in parallel when both write to shared `dist/`; run sequentially or isolate output directories.
     - Memory repository smoke tests must assert stable contract fields, not production display names unavailable to the memory repository.
