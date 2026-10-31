# Handoff — `house-cross-section` (slice S-23)

Written by the `/10x-implement` step, phase 3 of run 2026-10-31-house-cross-section. Phases 1 (`158004b`), 2 (`c470f94`) and 3 (`518f581`, house scene) are committed. The next agent must not get wrong: in `RoomScene` `refresh(data)` REPLACES its own `this.visiting = null`
with `houseWakeVisit(...)` (setting it before the resets would be wiped), and the hook's house snapshot is `houseView`, never
`house` (that field is the saved `HouseState`).

## 1. State

| | |
|---|---|
| branch | `feat/house-cross-section`, cut from `main` at `112f158` |
| commits | change identity, research, plan, plan review, `158004b` `test(house-cross-section): house cells and the wake rule (p1)`, this handoff |
| pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 22; rows 1.1-1.4, 2.1-2.6 and 3.1-3.4 ticked (3.5 is the orchestrator's e2e) |
| working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/houseArt.ts` | `HOUSE_ART` (3 entries, keys `house/house-1-shell`, `house/cell-closed`, `house/cell-frame`), not imported by BootScene |
| `public/assets/house/*.webp` | 44964 + 5554 + 8600 = 59118 B, made by `npm run art` (`HOUSE_FILES` in `scripts/make-task-art.mjs`) |
| `tests/houseArt.test.ts` | 6 cases (sizes, orphans, disjoint keys, geometry keys, <= 80000 B, BootScene guard) |
| `scripts/check-deploy.ts`, `src/pwa/registerServiceWorker.ts` | `house pictures` precache check; `console.warn` on a `redundant` worker |
| `src/core/houseCells.ts` | `houseCells`, `cellTap`, `houseWakeVisit`, types `HouseCellState`, `HouseCellView`, `CellTap` |
| `src/core/types.ts` | `SceneRect`, `HouseCellDef`, `HouseGeometry` |
| `src/data/houses.ts` | `HOUSE_GEOMETRY['house-1']` from the pack manifest (keys `house/house-1-shell`, `house/cell-closed`, `house/cell-frame`) |
| `tests/houseCells.test.ts` | 21 cases (cell states, tap, wake rule, geometry data) |
| `context/changes/house-cross-section/plan.md` | rows 1.1-1.4 ticked with `158004b` |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/house-cross-section` |
| `npm run art` | only `public/assets/house/` changed (3 new files, 59118 B) |
| `npx vitest run tests/houseArt.test.ts tests/roomArt.test.ts tests/uiArt.test.ts tests/bootBudget.test.ts` | 4 files, 20 passed |
| break 1: `cell-frame.webp` moved away | red: `ENOENT ... cell-frame.webp` and the orphan case `expected [ 'cell-closed.webp', ...(1) ] to deeply equal [ ...(2) ]`; restored |
| break 2: `HOUSE_ART` imported in `BootScene.ts` | red: `is not loaded by BootScene`; restored. Meta-check: sizes are literals from the pack manifest in the test, not read from the table |
| lint, typecheck, `npm test`, deploy/ops tests, sample E1-E6, `npm run build` | all green; `Tests 4084 passed`; `e2e hook: absent (2 chunks checked)` |
| unit count | phase 1 4078 + 6 = 4084 |
| `grep -o "assets/house/..." dist/sw.js` | 3 distinct files precached (the minified sw.js is one line, so `grep -c` says 1) |
| `git diff --stat 112f158 -- deploy/ public/assets/rooms ui tasks balance.ts save.ts` | empty |
| e2e | not run (orchestrator `+ 0`) |

## 2b. Phase 3 artifacts

| path | what it is |
|---|---|
| `src/scenes/HouseScene.ts` | `show()` (create and wake), `render()`, taps via `cellTap`, own loader for `HOUSE_ART`, hook surface `snapshot()`, `targets()`, `pixel(cellId)` |
| `src/ui/widgets/HouseView.ts`, `roomCapture.ts` | cells re-captured on every render (textures removed in `clear()`), stand-in shell, `pixel` (WebGL snapshotPixel, Canvas 2D context) |
| `src/data/layout.ts` | `SCENE_KEYS.house`, `HOUSE_LAYOUT`, `HOUSE_TOUCH_TARGETS`, `ROOM_LAYOUT.houseButton` (copy of `visitButton`, which phase 4 removes) |
| `pl.house`, `FallbackWhere 'house'`, `LoadTable`, `E2EArtSeam 'house'` | copy, fallback record (no "Obrazki" line), seam inside marker `e2eArt` |
| tests | `tests/houseSceneWiring.test.ts` (6), two layout cases, `backdropRestoreWiring` pixel guard now lists `HouseView`; unit 4084 + 8 = 4092 |

Phase 3 verification: break 1 `back.left` 240 -> layout roof case red (`expected 660 to be less than or equal to 456`); break 2 RESTORE_WEBGL listener dropped -> wiring guard red; both restored. Meta-check: source guards and geometry only; the browser proof is phase 6. Build prints `e2e hook: absent (2 chunks checked)`; row 3.4 diff empty; e2e not run (orchestrator `+ 0`).

## 4. Next command

`/10x-implement house-cross-section phase 4`

## 5. Open

- Manual rows (human checklist): 2.7 (deploy smoke line `house pictures`) and 5.11 `[reviewer] (CI at ship)`; 5.6 `[visual]`; 5.7, 5.8, 5.9, 5.10 `[human]`.
- Row 2.4 wording `grep -c` is 1 on the minified one-line sw.js; the check was `grep -o` (3 files).
- Phase 6 must add `house-cross-section` to `ROUND_SPEC` in `playwright.config.ts`.
- DESIGN-GAP rows planned from 183 in phase 5; row 180 closes.

## 6. Autonomous decisions

- Tests went into the new `tests/houseCells.test.ts` only (the data test included), not `tests/house.test.ts`: all new cases
  concern the new module. Plan row 1.1 command still passes. Would change: nothing.
- The pack's rect type is new (`SceneRect`) because `types.ts` has no rect type. Would change: a rect type appearing elsewhere.
- Wake-rule break: the plan's single break (accept the current room) is green alone because `current` cells are never `done`;
  recorded as the meta-check above, break done with both conditions. Would change: nothing.
- Driver stays `tdd`; no redirect.
- Phase 3: `HouseScene` is not yet reachable (phase 4 wires the "Dom" button and the wake data). `recreate` was dropped from `HouseView`: it removes its cell textures on every render, which also covers a restored context. The `?e2eArt=house` seam only skips the fetch and records the fallback. Would change: a flicker seen in the phase 5 visual pass.
- The house `pixel` uses `snapshotPixel` and so the guard "only SalonBackdrop reads a pixel" was widened to `HouseView`.
- Phase 2 is `impl`: the SW `redundant` warning (kitchen follow-up 6) has no unit test (browser-only path); the lint rule accepted `console.warn` there. Would change: a test seam for `trackStates`.
