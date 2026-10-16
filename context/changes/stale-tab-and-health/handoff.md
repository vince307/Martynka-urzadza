# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Written by the `/10x-tdd` step for phase 3 of run `2026-10-16-fix-stale-tab-health`. Phase 3 (`otherTab` block reason) is committed as `032adb1`. The next agent must not get wrong: `onBlocked` is NOT wired in `main.ts` yet (phase 4 does it, with the child card); `onBlocked` fires from `attempt` only, never from `replace` or load blocks.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | ..., `4342650` (p2), `8204b35` (p2 docs), `032adb1` (p3 code+tests), then a docs commit with this handoff and the ticks |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 3.4 (orchestrator e2e), 3.5 [reviewer], 2.5 [reviewer], 1.6 [reviewer] and phases 4-12 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/autosave.ts` | `BlockReason` + `'otherTab'`, `attempt` maps `OtherWriterSave`/`NewerSave`, `AutosaverOptions.onBlocked` (once, try/catch + log), `replaceGate` Blocked for `otherTab` |
| `src/core/saveHealth.ts`, `src/core/saveFile.ts` | `offState` and `deviceSaveView` know `otherTab` (never forceable) |
| `src/data/pl.ts`, `src/ui/dom/saveSummaryView.ts` | `settings.saveOff.otherTab`, `saveTransfer.deviceOtherTab` with DESIGN-GAP 116 comments, `blockedText` |
| `docs/design-gaps.md` | row 116 |
| `tests/autosave.test.ts`, `tests/saveHealth.test.ts`, `tests/saveFile.test.ts`, `tests/e2e/support/hook.ts` | 8 new tests; `blockedBy` type |
| `context/changes/stale-tab-and-health/plan.md` | rows 2.4 (orchestrator gate 8204b35, 121 passed), 3.1-3.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run, before code) | 6 failed; first assertion `AssertionError: expected { Object (load, blocked, ...) } to match object { blockedBy: 'otherTab', …(2) }`; also `expected [] to deeply equal [ 'newer' ]`, `expected 'ok' to be 'Blocked'` (replaceGate) |
| GREEN | autosave + saveHealth + saveFile 165/165 |
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` + deploy scripts + `sample` E1-E6 | OK; unit 3113 = phase-2 3105 + 8 (branch baseline main 3076 + 37) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not run by me (orchestrator gate; this phase touches only core, copy and a test type) |
| Deliberate break 1 | `OtherWriterSave` treated as ordinary failure: 2 red ("blocks ... never again", "listener that throws"); restored, green |
| Deliberate break 2 | `onBlocked` on every refusal (`first = true`): stayed GREEN — equivalent mutant: after the first block `writesOff()` stops `attempt` from running, so a second refusal cannot happen; the `first` guard is only defensive |
| Meta-check | proves the state machine with a fake store, not the card (phase 4) |

## 4. Next command

`/10x-implement stale-tab-and-health phase 4`

## 5. Open

- Rows: 3.4 e2e (orchestrator, `baseline + 0`), 3.5 [reviewer]; 2.5 and 1.6 [reviewer].
- `e2eSaveStore` (`src/testing/e2eHook.ts`) still uses `storedVersionNewer` and ignores `mode` (phase 11 territory).
- Phase 4 wires `onBlocked` in `main.ts` (`createAutosaver` call) to show the child card.
- `load-and-tab-guard` "#2 P-5" was green in the orchestrator's full run; I did not run e2e this phase.
- Carried from the plan review (unchanged): [human] rows 10.6, 11.4; [visual] 12.4; [reviewer] 10.7; Known risks; DESIGN-GAPs 117-121 in later phases; e2e phases 11-12 use the request-file protocol.

## 6. Autonomous decisions

- **Driver stays `tdd`**: no `otherTab` code existed; no redirect.
- **RED without a stub**: tests pass `onBlocked` through the existing `setup` spread, so failures were assertions; typecheck only went green after the option was added.
- **`replace` does not call `onBlocked`** (plan); it still maps `NewerSave` to `newer` as before.
- **Break 2 recorded as equivalent mutant** rather than weakening code to make it detectable.
- **Commit message** taken as proposed (Polish); ticks and handoff in a second docs commit.
