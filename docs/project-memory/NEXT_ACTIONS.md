# Next Actions

Updated: 2026-08-22

Repository: `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`

Remote: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub.git`

Branch: `local-lab/agent-capability-foundation`

## Immediate

1. Run the complete local capability-foundation acceptance suite on the final
   committed HEAD.
2. Obtain independent exact-HEAD code/QA review.
3. Push only `local-lab/agent-capability-foundation` to `origin`.
4. Verify the remote experimental hash and prove remote `main` is unchanged.
5. Keep `main` unchanged until Stage B and a separate promotion approval.

## Required Before Main Promotion

1. Execute the Stage B protocol in `docs/agents/skill-pilot-protocol.md`:
   five fixtures, two arms, three repeats, blind independent review.
2. Record raw outcomes and reviewer disagreements.
3. Require critical finding recall of 100%, score at least 85, inter-reviewer
   agreement at least 0.75 and bounded overhead.
4. Run a real product-code pilot for every experimental skill promoted to
   active.
5. Obtain a separate user-approved merge decision.

## Explicit Non-Goals

- Do not create `lovable/test/*` or `codex/*` branch layers.
- Do not merge or push directly to `main` in this workstream.
- Do not claim a measured improvement before Stage B evidence exists.
- Do not let checks delete or rewrite files as a hidden side effect.
