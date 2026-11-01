# Handoff — `house-1-polish` (slice S-32)

Written by the `/10x-new` step of run 2026-11-01-bathroom-polish-lab: the change exists (`change.md`, status `new`) with
roadmap claims re-verified, bound kit sources, migration call and triggered follow-ups. The one thing not to get wrong:
the kitchen's two new stages go at the FRONT of `KITCHEN.tasks`, so a saved kitchen's `tasksDone` must be remapped
(v6 → v7, `k ≥ 1 → k + 2`), not left as is and not mapped by cost.

## 1. State

| | |
|---|---|
| branch | `feat/house-1-polish`, cut from `main` at `964285b` (S-31 merge #136) |
| commits | 1 on top of `964285b`: `docs(house-1-polish): change identity (autonomous run)` |
| pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| Progress rows remaining | n/a (no `plan.md` yet) |
| working tree | clean after the commit (only the two files below staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/house-1-polish/change.md` | change identity: roadmap claim table, bound kit views and copy keys, Migration (v6 → v7 expected), triggered follow-ups, autonomous decisions D1–D6 |
| `context/changes/house-1-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/house-1-polish` |
| pixel check (python, Pillow) `salon-after-cream` vs `salon-v2/architecture-after` | 13.5 % pixels differ (the board only) |
| pixel check `salon-before-cream` vs `salon-worn-v2/architecture-before` / vs `salon-v2/architecture-before` | identical interior (13.5 %, board) / 98 % differ → the cream before is the worn-v2 background |
| `designs/martynka-house-1-polish-v1/qa-report.json` | `passed: false`, failed only `kitchen-outline:kitchen-stage-{1,2}:before` (2.93 % vs 1 %) |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed (baseline on `main` at `964285b` per the contract: unit 4233, e2e 193) |

## 4. Next command

`/10x-research house-1-polish`

## 5. Open

- Migration (change.md § Migration): research confirms every reader of kitchen `tasksDone` (`src/core/rooms.ts`
  `currentTask`, `sceneKey`, `roomStateProblems`, `roomGrowth`; `src/core/save.ts` `MIGRATIONS`, `importProblem`,
  `decodeSave`; `src/core/saveFile.ts` `saveSummary`; frozen fixtures `tests/fixtures/save-v6*.json`; e2e
  `tests/e2e/kitchen-room.spec.ts`, `house-cross-section.spec.ts`, `kids-room.spec.ts`, `bathroom-room.spec.ts`) and the
  backup/rollback path (`backup-v6`, `deploy/README.md`).
- Salon on cream: `ROOM_SCENE_FILES.salon` (`src/data/roomArt.ts`), `ROOM_PACKS` row `salon` (`scripts/make-task-art.mjs`,
  scene from the polish pack, furniture from `salon-v2`), fate of `scripts/recolour-board.py` + `tests/recolourBoard.test.ts`;
  `SalonBackdrop` / `backdropMode` (`src/core/backdrop.ts`) and the house miniature (`captureRoomMiniature`, `HouseView`)
  with a cream salon; `UI_ART` `salonAfter` fallback thumbnail stays green.
- `[human]` rows the plan must carry: D2 (save v7 overturns „v6 stays”), D4 (salon cell fill, checklist P2), D5 (worn
  grade kept over the worn-v2 background; Unknown 3 of the roadmap).
- Follow-ups triggered: kids-room 2 / bathroom-room 11, kitchen-room 19 / house-cross-section 12 (gap 182),
  final-art-salon gap-109 and append-rule items; takes in change.md § Open follow-ups.
- DESIGN-GAP edits expected: rows 109, 203, 182, 169/171 (`docs/design-gaps.md`); no new row foreseen.

## 6. Autonomous decisions

- D1 kitchen stages as data at the front of `KITCHEN.tasks` (clean → `kitchen/kitchen-stage-1`, walls →
  `kitchen/kitchen-stage-2`, floor → `kitchen/after`). Rejected: new mechanism; stages appended. Changes if: none foreseen.
- D2 save v6 → v7, kitchen `tasksDone k ≥ 1 → k + 2`, `chosen` unchanged. Rejected: no version (ambiguous states), rule B
  by cost (regresses walls). Changes if: research finds a field that distinguishes the lists.
- D3 kitchen costs 5/6/7 + 7/9/10/12/13/15 = 84 (children precedent). Changes if: author or S-17.
- D4 salon keeps the tight crop in the house cell. Rejected: code shrink, new crop. Changes if: the visual gate shows
  clipping/overlap or the author orders a recrop.
- D5 salon: the pack's three cream scene files (before = worn-v2 background) + code worn grade and contact shadows kept;
  worn-v2 furniture not imported. Rejected: own recolour of the shipped before; worn-v2 furniture. Changes if: the gate
  shows a clash, or the author decides roadmap Unknown 3.
- D6 next is `/10x-research` (migration seams, backdrop, art script, boot budget). Changes if: none.
- `/10x-new` clipboard copy skipped (no human at the terminal); next command recorded in §4.
