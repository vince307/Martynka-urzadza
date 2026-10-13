# Handoff — `save-observability-c1-c2` (slice fix, non-roadmap)

Written by the `new` step. The change identity exists; every in-scope audit claim was checked against the code at
`4698110`. The next agent must not tighten `validateSave` with the shipped `ROOMS` for H-R3 (decision 6: repair at load).

## 1. State

| | |
|---|---|
| Branch | `feat/save-observability-c1-c2`, cut from `main` at `4698110` |
| Commits | 1 on the branch (this step: `docs(save-observability-c1-c2): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| Progress rows remaining | n/a (no plan.md yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-observability-c1-c2/change.md` | identity: sources, audit claim / repo now / correction table, design binding, no migration, triggered follow-ups, 8 autonomous decisions |
| `context/changes/save-observability-c1-c2/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-observability-c1-c2` |
| code reading (`src/core/autosave.ts` `loadSave`/`createAutosaver`/`attempt`/`block`, `src/main.ts` `start`, `src/scenes/RoomScene.ts` `room`/`roomState`/`dispatch`, `src/scenes/TaskScene.ts` `nextRoomTaskCost`, `src/core/save.ts` `validateSave`, `src/testing/e2eHook.ts` `save`/`e2eSave`, `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`) | C-1, C-2, M-S4, M-S5, M-R6, H-R3 confirmed; H-R3 fix direction corrected |
| lint / typecheck / unit / build / e2e | not run — docs-only step, no code changed (baseline in the contract: unit 1142, e2e 29) |

## 4. Next command

`/10x-research save-observability-c1-c2`

## 5. Open

- Research questions (change.md decision 8): form and placement of the `unavailable` card (DOM before the game, like `src/ui/dom/saveFailedCard.ts` `mountSaveFailedCard`); injected clock for `createAutosaver`; where the unknown-`currentRoom` repair plugs in (`src/main.ts` `start` vs `src/core/save.ts` `toSession`); whether M-R5 (`tests/roomsData.test.ts` over `ROOMS`) and M-S2 (`src/storage/idb.ts` `requestPersistence` result) are cheap enough to include; whether Safari private mode makes `unavailable` routine.
- DESIGN-GAP: row 43 in `docs/design-gaps.md` to be rewritten (save-health line in the parent panel + `unavailable` signal); possible new row after 44 for the `unavailable` card.
- Triggered follow-ups: F3 `?e2eSave=unavailable` seam + spec (in scope); F4 `tests/e2eHookGuard.test.ts` explicit cases (conditional); S-12 "show the save state to the parent" (partly closed here). Out-of-scope audit findings (M-S1, M-S2, M-S3, M-R4, M-R5, L-*) go to `follow-ups/review-fixes.md` later.
- Every new Polish string in `src/data/pl.ts` needs a `[reviewer]` teacher-read row in the plan.

## 6. Autonomous decisions

See `change.md` `## Autonomous decisions` (1–8) for full chosen / rejected / why / what would change. Summary:
scope C-1, C-2, H-R3, M-R6, M-S5 + M-S4 + follow-up F3 (reversal: research shows M-R5/M-S2 trivial); signal = settings-panel save-health line + a pre-game card for `unavailable` (reversal: `unavailable` routine on target tablets → panel line only); status fields live in `AutosaveStatus`, not `SaveState`, `SAVE_VERSION` stays 1 (reversal: none short of a format change); H-R3 = load-time repair with known ids as a parameter, not stricter `validateSave` (reversal: a second room shipped first); no scene reaction to a failed `flush('now')` (reversal: maintainer wants purchases blocked without a save). Next step `/10x-research` is fixed by the run prompt, overriding the skill's default `/10x-plan`.
