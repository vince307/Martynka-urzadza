# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

Phase 7 (`/10x-implement`) is committed as e33fbff: CLAUDE.md, design gaps 29/51/71, follow-ups file, seam sweep. Phases 1-6 are done (e6a0b43, 2e67a1d, 9013f59, 511d4f1, 1482ff4, 814e37b); orchestrator e2e for 3-5 was 141+0 and rows 3.3, 4.5, 5.3 are ticked.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | phases 1-7 (p7 e33fbff), plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 6.4 and 7.4 e2e (orchestrator), 6.5 [visual], 7.5 [reviewer], phases 8-10; 3.4 [reviewer], 3.5 [visual] open |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `CLAUDE.md` | "Current state": boot limits on visible time with `hiddenMs`, error card `Kod:`, one new sentence for this change; AGENTS.md says nothing of these, untouched |
| `docs/design-gaps.md` | rows 29, 51, 71 updated (gap 153 already existed from phase 3) |
| `context/changes/audit-boot-hidden-tab/follow-ups/review-fixes.md` | 13 `Trigger:` lines (H-6, A-6/B-6, A-10, L-8, ASL, G-3, S12, FontFace, focus, device, TXT-06 closed, isolation red, `pl.errorCard.build`) |
| `src/core/bootLimits.ts`, `src/scenes/BootScene.ts` | sweep: `bootLimitReached` replaces a second copy of the hidden-time subtraction |

## 3. Verification

| command | result |
|---|---|
| rows 7.1-7.3 | wall-clock greps show only hidden-time text; 13 triggers; `errorCard.build` absent from `src` (still used by `tests/e2e/error-boundary.spec.ts`, kept, named in the commit) |
| lint, typecheck | OK |
| unit | 3707 passed, 192 files (phase 6 3707, delta 0) |
| deploy scripts, sample E1-E6, build | OK; `e2e hook: absent (2 chunks checked)` |
| validate-rule-files.sh | PASS |
| e2e | left to the orchestrator (`<branch e2e baseline> + 0`) |

## 4. Next command

`/10x-e2e audit-boot-hidden-tab phase 8`

## 5. Open

- Rows 6.4 and 7.4 until the orchestrator's e2e; 6.5 and 3.5, 5.4 [visual], 3.4, 2.5, 7.5 [reviewer], 2.6 [human] not mine.
- `pl.errorCard.build` is used only by `tests/e2e/error-boundary.spec.ts`; phase 9 may drop it.
- The follow-up "isolation-only red of load-and-tab-guard" is restated in the follow-ups file; phase 8 closes or restates it with evidence.
- Phase 8 is `Driver: e2e`; do not run the implement epilogue before phase 10.

## 6. Autonomous decisions


- D-1 **`assertDrawable` scope**: only checks the widgets already assert (icons, row, jugs, money items, number line); scale weights and coin tray left out, since widgets do not throw there and the plan (F5) forbids new round-build throws. Would change: the maintainer wanting every `ART_LIMITS` pool checked.
- D-2 **Test seam**: `vi.mock` of the registry's `getGenerator` for a `FAKE` type (generators are a frozen const table). Rejected: adding a registration API to production code.
- D-3 **Plan Driver** stays `tdd`; implementation did not exist at phase start.
- D-4 **Commit message / next-phase / manual-gate prompts** decided in place: planned set only, stop after phase 4.
- D-5 **Phase 5 decisions**: no options-object, a positional `code` parameter (one caller); `pl.errorCard.build` kept for now. Commit message and next-phase prompts decided in place, stop after phase 5.

- D-6 **Phase 6 decisions**: Driver stays `tdd` (no `refuseWrites` in the replace catch at start). Commit message, manual-gate, dirty-paths and next-phase prompts decided in place: planned set only, stop after phase 6. The pre-existing test pinning a silent listener on a refused replace was changed to expect `newer` (plan review F4 reverses it). Would change: the maintainer wanting replace refusals kept silent for the listener.

- D-7 **Phase 7 decisions**: Driver stays `impl`. Commit message, dirty-paths, next-phase prompts decided in place. AGENTS.md left alone (no stale sentence). Gap 153 already existed, so only rows 29, 51, 71 changed. Kept `pl.errorCard.build` for the e2e spec.
