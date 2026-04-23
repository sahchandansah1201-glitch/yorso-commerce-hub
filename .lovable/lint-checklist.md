# Pre-Commit Lint Checklist

Run before merging any change. Goal: keep `npm run lint` at **0 errors, 0 warnings**.

## 1. Run the gates locally

```bash
npm run lint     # must exit 0, no output
npx vitest run   # 186/186 (or current baseline) passing
npm run build    # must succeed
```

If any gate fails, fix before requesting review.

## 2. Common error patterns to avoid

- **Empty interfaces** (`@typescript-eslint/no-empty-object-type`)
  - ❌ `interface Props extends BaseProps {}`
  - ✅ `type Props = BaseProps`
- **Ternary as statement** (`@typescript-eslint/no-unused-expressions`)
  - ❌ `cond ? a() : b();`
  - ✅ `if (cond) a(); else b();`
- **Useless regex escapes** (`no-useless-escape`)
  - ❌ `/[\s.\-]/` — `-` at end of char class needs no escape
  - ✅ `/[\s.-]/`
- **CommonJS `require()` in TS configs** (`no-require-imports`)
  - ❌ `plugins: [require("tailwindcss-animate")]`
  - ✅ `import plugin from "tailwindcss-animate"; plugins: [plugin]`

## 3. Common warning patterns

- **`react-refresh/only-export-components`** — fires when a file exports both a component and non-components (variants, hooks, contexts).
  - For shadcn UI / context files: add file-scoped `/* eslint-disable react-refresh/only-export-components */` at the top.
  - For app code: split non-component exports into a sibling `*.utils.ts` or `*-context.ts` file.
- **`react-hooks/exhaustive-deps`** — first try to add the missing dep or wrap the callback in `useCallback`. Only use `// eslint-disable-next-line` with a one-line comment explaining intent (e.g. one-shot mount effect, intentional single-trigger).
- **Unused `eslint-disable` directives** — remove them; they become stale when the underlying issue is fixed.

## 4. Hygiene rules

- Never add `/* eslint-disable */` without a rule name — always scope to a single rule.
- Never disable rules globally in `eslint.config.js` to silence a local issue.
- Prefer fixing the code over disabling the rule.
- When disabling is the right call, leave a one-line comment explaining **why**.

## 5. Pre-push smoke check (optional, ~5 s)

```bash
npm run lint && echo "✓ lint clean"
```

If this prints `✓ lint clean`, you're safe to push.
