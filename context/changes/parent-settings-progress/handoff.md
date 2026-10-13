# Handoff — `parent-settings-progress` (slice S-08)

Written by the phase 2 step (`/10x-tdd` phase 2, autonomous run 2026-10-12-s04-s08). Phase 2 added the long-press reducer and
the input-suspension counter (with the plan-review F1 `onRelease`) as pure `src/core` modules, test-first. Rows 1.3 and 1.4
are ticked citing the orchestrator's run-log line "S-08 p1 impl".

## 1. State

| | |
|---|---|
| Branch | `feat/parent-settings-progress`, cut from `main` at `bfbd18a` |
| Commits | `db487d2`, `965c602`, `d355ca0`, `33a40d3`, `d72768a` (p1), `6616124`, `7087b16` (phase 2), plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (phases 1-2 of 11 committed; status moves at the last phase) |
| `## Progress` rows remaining | 46 (phases 1 and 2 fully ticked) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/longPress.ts` | `LongPressState`, `LongPressEvent` (`down`/`move`/`up`/`cancel`/`reset`/`tick`, time as argument), `LongPressRules {holdMs, moveTolerance}`, `IDLE`, `longPress(state, event, rules) → {state, fire}` |
| `src/core/inputSuspend.ts` | `createInputSuspender(target, onRelease?) → {suspend(): () => void, suspended()}`; `onRelease` once per return to zero, before `target.enabled = true`; per-handle idempotent resume |
| `src/data/balance.ts` | `parentSettings: { holdMs: 2000, moveTolerance: 30, weakestCount: 3, examplesPerSkill: 2 }` |
| `tests/longPress.test.ts`, `tests/inputSuspend.test.ts` | 14 + 7 tests (thresholds written as literals in the test, plus one test pinning the `balance` numbers) |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| RED (stubs exporting the symbols, wrong values) | `AssertionError: expected true to be false` (inputSuspend, suspend disables target), `expected +0 to be 1` (longPress, fires at exactly 2000 ms), 14 of 21 red; green after implementation |
| `npm run lint` / `npm run typecheck` | both clean |
| `npm test` + deploy tests + `sample` E1-E6 | exit 0; 59 files, 902 passed (baseline 881 + 21) |
| `npm run build` | OK, `e2e hook: absent` |
| Deliberate break 1 | `>=` to `>` on `holdMs`: 5 longPress tests red (fires at exactly 2000 ms, 30 px edge, euclidean, other finger, fired cycle); restored |
| Deliberate break 2 | removed the `if (released) return;` guard: 2 inputSuspend tests red (double resume of one handle, `onRelease` once); restored |
| Meta-check | expectations come from US-03 AC and the plan (2000/30 literals in the test), not from the implementation; the `balance` test pins the real numbers separately |
| e2e | `e2e: not runnable in this session (MachPort) — orchestrator gate`. Phase 2 touches no scene, only new `src/core` files and one `balance` key; expected `npx playwright test` 15 passed |

## 4. Next command

/10x-tdd parent-settings-progress phase 3

## 5. Open

- Phase 2 full-gate row 2.3 is open only for e2e (orchestrator); re-dispatch if `npx playwright test` is red on `7087b16`.
- Wiring is phase 6/7: `UIScene.update` feeds `tick(time.now)`; `main.ts` passes `onRelease = () => game.input.pointers.forEach((p) => p.reset())`; each suspension resets the long-press machine.
- `[human]` rows (post-run checklist): 6.7 install hint no longer leaks taps; 9.6 session-only settings until S-11; 9.7 feel of the 2 s hold on iPad/Android; 9.8 PRD deviations (a)-(e).
- Phase 8: the visual gate must show "Zatwierdź"/"Anuluj" without scrolling at 1024x768 (row 8.5).
- DESIGN-GAPs 25-28 and follow-ups as planned for phase 9 (including the S-12 export privacy note).
- Every `Trigger: S-08` follow-up is in scope (list in reviews/plan-review.md Grounding).

## 6. Autonomous decisions

1. **Event shape is a discriminated union** (`{ type: 'down', id, x, y, now }` etc.) rather than method-per-event; matches the plan's `down/move/up/cancel/tick/reset` list. What would change it: a scene wanting positional arguments.
2. **`IDLE` constant exported** for tests and the scene's initial state. A `down` while `fired` is ignored (plan: fired ignores everything but `up`/`cancel`/`reset`); `move` of another finger is ignored, `down` of another finger while holding returns to idle.
3. **Tolerance is inclusive** (distance exactly 30 stays, over 30 cancels); hold is `>=` (2000 ms fires), per the plan's numbers.
4. **Commit message and stop-after-phase decided in place** (contract rule 1); no AskUserQuestion.
