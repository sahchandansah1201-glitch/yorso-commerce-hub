# ADR-0001: Project Memory Is The Recovery Source

Status: Accepted

## Context

Long ChatGPT/Codex chats can hit context limits, fail during compaction, disappear from search, or become difficult to continue accurately.

## Decision

The project folder must contain a project-memory black box under `docs/project-memory/`.

For recovery, new chats must read project files before relying on chat memory.

## Consequences

- The user can continue work in a new chat without depending on the old chat.
- Agents must update project-memory files after meaningful state changes.
- Chat history becomes supporting context, not the source of truth.
