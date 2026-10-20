# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

Phase 8 (`/10x-e2e`) is committed as 8b157d0: one new test in `tests/e2e/load-and-tab-guard.spec.ts` (#15 H-1). Phases 1-7 are done; the orchestrator still owes the full e2e for 6.4, 7.4 and 8.2. The next agent must not tick 8.2/8.3 without the full-suite and full-gate runs.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | phases 1-8 (p8 8b157d0), plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 6.4, 7.4, 8.2 (orchestrator full e2e), 8.3 (full gate), 6.5/3.5/5.4 [visual], 3.4/2.5/7.5 [reviewer], 2.6 [human], phases 9-10 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/load-and-tab-guard.spec.ts` | new test "#15 H-1 a tab hidden during the load does not cut it..." (fake `document.hidden` via init script + `visibilitychange`; routes via `hold`; `?e2eArt=stallall`); imports `gateProblem`, `typeIntoGate`, `fromHook`, `tapScene` |
| `context/changes/audit-boot-hidden-tab/follow-ups/review-fixes.md` | "Isolation-only red of load-and-tab-guard" closed with evidence |
| `context/changes/audit-boot-hidden-tab/plan.md` | row 8.1 ticked |

## 3. Verification

| command | result |
|---|---|
| `npx playwright test --config=<abs> tests/e2e/load-and-tab-guard.spec.ts` (file alone, default workers) | 6 passed (34.5 s), again 6 passed (32.4 s); the isolation-only red did not reappear |
| deliberate break 1: `BootScene` passes `0` instead of `hiddenMsAt(...)` to `bootLimitReached`/`bootLimitWait`/`bootLimitDue` | RED on `elapsedMs >= 3000 + hiddenMs - 50` (received 4175, expected >= 6735); restored. Meta-check: the "still loading while hidden" assertion did NOT catch it, because hide clears the timers (nothing fires while hidden); the damage shows at the show, when the cut fires at once instead of after the remaining visible time, and the elapsed assertion proves exactly that |
| deliberate break 2: `UIScene` passes `background: false` | RED: `artCutBackground` line not found; restored |
| lint, tsc on the spec | OK; unit/build/full e2e not run by me |

## 4. Next command

`/10x-e2e audit-boot-hidden-tab phase 9`

## 5. Open

- Rows 6.4, 7.4, 8.2 (full e2e `<baseline> + 1`) and 8.3 (full gate) for the orchestrator; 6.5, 3.5, 5.4 [visual], 3.4, 2.5, 7.5 [reviewer], 2.6 [human] not mine.
- The spec starts hiding after the hook appears; on a very slow machine the 3 s visible-time cut could pass before the hide (then the first assertion `loading` fails, not a false green).
- `pl.errorCard.build` is still used by `tests/e2e/error-boundary.spec.ts`; phase 9 may drop it.
- Phase 9 is `Driver: e2e`; no implement epilogue before phase 10.

## 6. Autonomous decisions


- D-1 **`assertDrawable` scope**: only checks the widgets already assert (icons, row, jugs, money items, number line); scale weights and coin tray left out, since widgets do not throw there and the plan (F5) forbids new round-build throws. Would change: the maintainer wanting every `ART_LIMITS` pool checked.
- D-2 **Test seam**: `vi.mock` of the registry's `getGenerator` for a `FAKE` type (generators are a frozen const table). Rejected: adding a registration API to production code.
- D-3 **Plan Driver** stays `tdd`; implementation did not exist at phase start.
- D-4 **Commit message / next-phase / manual-gate prompts** decided in place: planned set only, stop after phase 4.
- D-5 **Phase 5 decisions**: no options-object, a positional `code` parameter (one caller); `pl.errorCard.build` kept for now. Commit message and next-phase prompts decided in place, stop after phase 5.

- D-6 **Phase 6 decisions**: Driver stays `tdd` (no `refuseWrites` in the replace catch at start). Commit message, manual-gate, dirty-paths and next-phase prompts decided in place: planned set only, stop after phase 6. The pre-existing test pinning a silent listener on a refused replace was changed to expect `newer` (plan review F4 reverses it). Would change: the maintainer wanting replace refusals kept silent for the listener.

- D-7 **Phase 7 decisions**: Driver stays `impl`. Commit message, dirty-paths, next-phase prompts decided in place. AGENTS.md left alone (no stale sentence). Gap 153 already existed, so only rows 29, 51, 71 changed. Kept `pl.errorCard.build` for the e2e spec.

- D-8 **Phase 8 decisions**: the parent path to the settings panel is typed out in the spec (passWelcome navigates itself, which would lose the hidden span). The plan's "still loading while hidden" assertion is kept but the break-1 red comes from the elapsed-time assertion (see §3). Commit message and next-phase prompts decided in place. Would change: a seam that arms the cut while hidden.
