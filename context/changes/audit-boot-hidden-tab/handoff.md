# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

Phase 6 (`/10x-tdd`) is committed as 814e37b: a replace refused with `NewerSave` blocks like an ordinary refusal and the dialogs show `deviceNewer`. Phases 1-5 are done (e6a0b43, 2e67a1d, 9013f59, 511d4f1, 1482ff4); orchestrator e2e for 3-5 was 141+0 and rows 3.3, 4.5, 5.3 are ticked.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | phases 1-6 (p6 814e37b), plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 6.4 e2e (orchestrator), 6.5 [visual], phases 7-10; 3.4 [reviewer], 3.5 [visual] open |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/autosave.ts` | `replace` catch: `refuseWrites('newer', NEWER_SAVE)` instead of bare `blockedBy ??= 'newer'` (onBlocked once, timer cancelled) |
| `src/ui/dom/saveSummaryView.ts` | `failureText`: `NewerSave` -> `pl.saveTransfer.deviceNewer` before the forced branch |
| `tests/autosave.test.ts` | new describe "a replace refused with NewerSave blocks like an ordinary refusal (Z-8)"; the old "replace meets ... NewerSave" test now expects `['newer']` |
| `tests/saveSummaryView.test.ts` | describe "failureText (Z-8)" |

## 3. Verification

| command | result |
|---|---|
| RED (observed) | `expected [] to deeply equal [ [ 'newer', 'NewerSave' ] ]`; `expected 'plain' to be 'Nowsza wersja gry...'` (forced=false); forced=true Received the `siteDataAdvice` text ("usuń dane tej strony ... To usuwa też zapis gry.") |
| Deliberate break 1 | bare `blockedBy ??= 'newer'` back -> 2 autosave tests red (new one and the updated old one); restored |
| Deliberate break 2 | `NewerSave` branch removed from `failureText` -> both Z-8 text cases red, forced one Received `siteDataAdvice`; restored |
| Meta-check | the forced case goes red on today's text with the harmful advice, so the test sees it; the updated old test pinned the pre-fix silent listener, changed on purpose per plan review F4 |
| lint, typecheck | OK |
| unit | 3707 passed, 192 files (phase-5 3703 + 4) |
| deploy scripts, sample E1-E6, build | OK; `e2e hook: absent (2 chunks checked)` |
| row 6.3 | `git diff main -- src/core/save.ts src/storage`: only phase-4 `errorCode`; `writeVerdict`/`guardedPut` untouched |
| e2e | left to the orchestrator (`<branch e2e baseline> + 0`; `save-transfer-blocked.spec.ts`, `stale-tab.spec.ts`) |

## 4. Next command

`/10x-implement audit-boot-hidden-tab phase 7`

## 5. Open

- Row 6.4 until the orchestrator's e2e; 6.5 [visual] (phase 10), 3.4 [reviewer], 3.5 [visual], 5.4 [visual], 2.5 [reviewer], 2.6 [human], 7.5 [reviewer] not mine.
- `pl.errorCard.build` still used by `tests/e2e/error-boundary.spec.ts`; phase 7 row 7.3 removes it only if unused.
- Phase 7 is `Driver: impl` (docs, follow-ups, seam sweep).

## 6. Autonomous decisions


- D-1 **`assertDrawable` scope**: only checks the widgets already assert (icons, row, jugs, money items, number line); scale weights and coin tray left out, since widgets do not throw there and the plan (F5) forbids new round-build throws. Would change: the maintainer wanting every `ART_LIMITS` pool checked.
- D-2 **Test seam**: `vi.mock` of the registry's `getGenerator` for a `FAKE` type (generators are a frozen const table). Rejected: adding a registration API to production code.
- D-3 **Plan Driver** stays `tdd`; implementation did not exist at phase start.
- D-4 **Commit message / next-phase / manual-gate prompts** decided in place: planned set only, stop after phase 4.
- D-5 **Phase 5 decisions**: no options-object, a positional `code` parameter (one caller); `pl.errorCard.build` kept for now. Commit message and next-phase prompts decided in place, stop after phase 5.

- D-6 **Phase 6 decisions**: Driver stays `tdd` (no `refuseWrites` in the replace catch at start). Commit message, manual-gate, dirty-paths and next-phase prompts decided in place: planned set only, stop after phase 6. The pre-existing test pinning a silent listener on a refused replace was changed to expect `newer` (plan review F4 reverses it). Would change: the maintainer wanting replace refusals kept silent for the listener.
