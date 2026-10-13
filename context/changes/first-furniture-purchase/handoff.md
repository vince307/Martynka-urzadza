# Handoff — `first-furniture-purchase` (slice S-09)

Written by `/10x-tdd first-furniture-purchase phase 3` (autonomous run 2026-10-13-s09-s11). Phase 3 (variant panel reducer) is committed `94873fd`; row 3.3 is open only for the e2e gate, which the orchestrator must run. Row 2.4 is ticked from the orchestrator's run on `382072a`.

## 1. State

| | |
|---|---|
| Branch | `feat/first-furniture-purchase`, cut from `main` at `bb969f7` |
| Commits | docs commits, `d792eee` p1, `59c9253` p2, `94873fd` test(p3), then this `docs(first-furniture-purchase): handoff p3` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 32 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/variantPanel.ts` | `stepPanel(panel, event, ctx)` reducer; types `PanelState` (`closed` or `open{taskId, preview}`), `PanelEvent` (`open`, `pick`, `confirm`, `close`), `PanelContext`, `PanelStep`, `Bought`, `Preview` |
| `tests/variantPanel.test.ts` | 32 tests: cases from the plan, stale panel, double confirm, property over 20 seeds x 200 events |

Phase 6 note: the scene calls `stepPanel` and writes `stars`/`state` back only when `bought !== null`; `state`/`stars` are `===` the input otherwise.

## 3. Verification

| Command | Result |
|---|---|
| RED (stub reducer returning its input) | 7 failed, e.g. `AssertionError: expected { kind: 'closed' } to deeply equal { kind: 'open', taskId: 't1', preview: null }` and `expected 5 to be +0` |
| GREEN | `npx vitest run tests/variantPanel.test.ts`: 32 passed |
| Deliberate break | (a) confirm keeps the panel open: "confirm with a preview buys, closes the panel" red; (b) `open` without affordability: "stays closed one star short" red; (c) (a) plus no stale-panel guard: double-confirm, stale panel and buy-closes tests red. Restored, 32 passed |
| Meta-check | (a) alone leaves the double-confirm test green because the stale guard closes the panel on the second confirm (two independent defences), so (c) removes both; the property test did not go red under (c) because a stale confirm legitimately buys the next task with a correct deduction; the property guards the balance/accounting invariants (balance >= 0, start + earned - end = spent, `bought` only on confirm), which break only if `purchase` is broken (phase 1 tests) |
| `npm run lint` / `typecheck` | OK / OK |
| unit (`npm test` + deploy tests + `sample` E1-E6) | OK, Tests 1027 passed (baseline 995 at p2, +32); all exits 0 |
| `npm run build` | OK, e2e hook absent |
| `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate |

## 4. Next command

`/10x-impl-review first-furniture-purchase` is NOT next; phase 4 has `Driver: impl`, so:

`/10x-implement first-furniture-purchase phase 4`

## 5. Open

- Row 3.3 open only for e2e: orchestrator runs `npx playwright test` on `94873fd` (core-only change, no scene touched; a red spec is unrelated to this commit).
- Earlier items unchanged: `[reviewer]` 2.5, 6.4, seam sweep 7.5; `[human]` 7.6-7.10; `[visual]` 4.6, 5.5, 6.5, 6.6; phase 4 break 4.4 and phase 8 need Chromium; DESIGN-GAP 31-36 in phase 7.

## 6. Autonomous decisions

- TDD gate: `src/core/variantPanel.ts` absent, so TDD with no redirect. No AskUserQuestion.
- RED via a throwaway stub reducer (returns input), then the real reducer.
- Reducer semantics chosen where the plan was silent: `open` while already open is a no-op; a `pick`/`confirm` on a stale panel closes it; `close` always closes. Would change: phase 6 scene needs another behaviour.
- Commit split: test+code commit, then SHA ticks plus handoff in a docs commit.
