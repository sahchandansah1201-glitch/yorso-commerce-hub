# Recovery Prompt

Use this in a new ChatGPT or Codex chat.

```text
Continue this project from files, not from previous chat memory.

Primary source of truth:
1. AGENTS.md, if present
2. docs/project-memory/PROJECT_STATE.yaml
3. docs/project-memory/HANDOFF.md
4. docs/project-memory/NEXT_ACTIONS.md
5. docs/project-memory/WORKLOG.md
6. files listed in docs/project-memory/ARTIFACTS.md

Do not use similarly named chats as source of truth.
Do not invent old-chat content.
If old-chat history is missing, reconstruct only from repository files and mark hypotheses.

First answer with:
1. confirmed project status
2. confirmed next action
3. risks or missing context

Then continue the next action if it is safe.
```
