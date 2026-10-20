# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

Phase 10 (`/10x-e2e`, last phase) is committed as c5b4db4: `#2 Z-8` in `tests/e2e/save-transfer-blocked.spec.ts`. All phases are implemented; `change.md` is `implemented`. Rows 9.2, 10.2 (full e2e) and 9.3 are the orchestrator's.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | phases 1-10 (p10 c5b4db4), plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 9.2, 9.3, 10.2 (orchestrator full suite/gate), [visual] 6.5/3.5/5.4, [reviewer] 3.4/2.5/7.5, [human] 2.6 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/save-transfer-blocked.spec.ts` | new test `#2 Z-8 a reset refused as a newer save says so, blocks writes and shows the refusal card, never the site-data advice` (uses `?e2eSave=newer`) |
| `context/changes/audit-boot-hidden-tab/plan.md` | rows 10.1, 10.3, 10.4 ticked |
| `context/changes/audit-boot-hidden-tab/change.md` | status `implemented` |

## 3. Verification

| command | result |
|---|---|
| `npx playwright test --config=<abs> tests/e2e/save-transfer-blocked.spec.ts` | 8 passed (baseline 7, +1) |
| break 1: `failureText` without the `NEWER_SAVE` branch | RED: `deviceNewer` line not visible; restored. Meta-check: the branch alone decides that line |
| break 2: `replace` catch without `refuseWrites('newer', ...)` | RED: `blockedBy` expected `newer`, got null; restored. Meta-check: proves the replace path itself blocks writes and raises the card |
| eslint on the spec, `npm run typecheck`, `npm run build` | OK; build prints `e2e hook: absent (2 chunks checked)` |
| unit tests, full e2e | not run by me (orchestrator) |

## 4. Next command

`/10x-impl-review audit-boot-hidden-tab`

## 5. Open

- 9.2, 9.3, 10.2: orchestrator full e2e `+1` over phase 9 and the full gate.
- [visual], [reviewer], [human] rows are not mine.

## 6. Autonomous decisions



- D-1 **`assertDrawable` scope**: only checks the widgets already assert (icons, row, jugs, money items, number line); scale weights and coin tray left out, since widgets do not throw there and the plan (F5) forbids new round-build throws. Would change: the maintainer wanting every `ART_LIMITS` pool checked.
- D-2 **Test seam**: `vi.mock` of the registry's `getGenerator` for a `FAKE` type (generators are a frozen const table). Rejected: adding a registration API to production code.
- D-3 **Plan Driver** stays `tdd`; implementation did not exist at phase start.
- D-4 **Commit message / next-phase / manual-gate prompts** decided in place: planned set only, stop after phase 4.
- D-5 **Phase 5 decisions**: no options-object, a positional `code` parameter (one caller); `pl.errorCard.build` kept for now. Commit message and next-phase prompts decided in place, stop after phase 5.

- D-6 **Phase 6 decisions**: Driver stays `tdd` (no `refuseWrites` in the replace catch at start). Commit message, manual-gate, dirty-paths and next-phase prompts decided in place: planned set only, stop after phase 6. The pre-existing test pinning a silent listener on a refused replace was changed to expect `newer` (plan review F4 reverses it). Would change: the maintainer wanting replace refusals kept silent for the listener.

- D-7 **Phase 7 decisions**: Driver stays `impl`. Commit message, dirty-paths, next-phase prompts decided in place. AGENTS.md left alone (no stale sentence). Gap 153 already existed, so only rows 29, 51, 71 changed. Kept `pl.errorCard.build` for the e2e spec.

- D-8 **Phase 8 decisions**: the parent path to the settings panel is typed out in the spec (passWelcome navigates itself, which would lose the hidden span). The plan's "still loading while hidden" assertion is kept but the break-1 red comes from the elapsed-time assertion (see §3). Commit message and next-phase prompts decided in place. Would change: a seam that arms the cut while hidden.
- D-9 **Phase 9 decisions**: the boot test also asserts the exact line (build read from `#game-container`). `pl.errorCard.build` kept (grep: used by the spec). Commit message and next-phase prompts decided in place.
- D-10 **Phase 10 decisions**: existing `?e2eSave=newer` seam sufficed (no new seam, no hook/guard change). Commit message and next-phase prompts decided in place. Last phase: epilogue done.
