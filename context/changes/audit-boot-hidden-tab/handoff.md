# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

Phase 9 (`/10x-e2e`) is committed as 48b2689: `tests/e2e/error-boundary.spec.ts` now asserts the exact `Kod: Error · Wersja <build>` line (frame and boot cases). Phases 1-9 done; 9.2 (full e2e `+0`) and 9.3 (full gate) are the orchestrator's.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | phases 1-9 (p9 48b2689), plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 9.2 (full e2e +0), 9.3 (full gate), 6.5/3.5/5.4 [visual], 3.4/2.5/7.5 [reviewer], 2.6 [human], phase 10 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/error-boundary.spec.ts` | tightened: frame and boot tests assert `pl.saveFailed.detail('Error', build)` exactly and that `pl.errorCard.build(build)` alone is not on the card |
| `context/changes/audit-boot-hidden-tab/plan.md` | rows 6.4, 7.4, 8.2, 8.3 (orchestrator gate, e2e 142) and 9.1 ticked |

## 3. Verification

| command | result |
|---|---|
| `npx playwright test --config=<abs> tests/e2e/error-boundary.spec.ts` | 4 passed (30 s), before and after the break |
| deliberate break: `main.ts` passes `''` instead of `errorCode(error)` to `mountErrorCard` | RED: test 1 `getByText('Kod: Error · Wersja f1aa80a')` not found; restored, green again. Meta-check: the break changes exactly the code part of the line, so the assertion proves the code is shown |
| eslint, tsc | OK; unit/build/full e2e not run by me |

## 4. Next command

`/10x-e2e audit-boot-hidden-tab phase 10`

## 5. Open

- 9.2 (full e2e `+0`) and 9.3 (full gate) for the orchestrator; visual, reviewer and human rows not mine.
- `pl.errorCard.build` stays: the spec uses it for the negative assertion (the boundary no longer renders it alone).
- Phase 10 is `Driver: e2e`.

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
