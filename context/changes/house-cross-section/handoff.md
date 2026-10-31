# Handoff — `house-cross-section` (slice S-23)

Written by the `/10x-implement` step, phase 4 of run 2026-10-31-house-cross-section. Phases 1-3 (`158004b`, `c470f94`, `518f581`) and 4 (this commit) are committed. The next agent must not get wrong: the hook's house snapshot is `houseView` (the field `house` is the saved `HouseState`), and `housePixel(cellId)` is a method on `window.__martynkaE2E` (not in the `Hook` type of `tests/e2e/support/hook.ts`, call it with `page.evaluate`).

## 1. State

| | |
|---|---|
| branch | `feat/house-cross-section`, cut from `main` at `112f158` |
| commits | docs, `158004b` p1, `c470f94` p2, `518f581` p3, phase 4 (`feat(house-cross-section): room to house navigation, the hook and the moved tests (p4)`) |
| pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 4.4 and 4.6 (orchestrator e2e), then phases 5-6 |
| working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/scenes/RoomScene.ts` | `houseButton` ("Dom", hidden while blocked) replaces the visit button; wake handler `refresh(_sys, data)` sets `visiting = houseWakeVisit(data, current, houseCellList())`; `houseButtonTarget()` |
| `src/core/roomVisit.ts`, `tests/roomVisit.test.ts` | deleted |
| `src/data/layout.ts` | `visitButton` layout and touch target removed |
| `src/testing/e2eHook.ts` | `screen: 'house'`, snapshot `houseView`, `housePixel(cellId)`, targets `houseButton`, `houseBack`, `houseCells`; room targets and the sleeping task scene's summary targets null in the house |
| `tests/e2e/support/hook.ts` | types, `openHouse(page)` |
| `tests/e2e/kitchen-room.spec.ts` | the #16 visit test goes room "Dom" -> house cell `ground-left` -> room |
| `tests/roomVisitWiring.test.ts` | 7 cases rewritten for the wake data; `tests/layout.test.ts` visit-button case deleted |

## 3. Verification

| command | result |
|---|---|
| `npx vitest run tests/roomVisitWiring.test.ts tests/layout.test.ts tests/houseCells.test.ts` | 3 files, 61 passed |
| `grep -rn "visitTarget\|visitButton\|roomVisit'" src tests` | empty |
| break 1: `visiting` set from raw `data.visit` instead of `houseWakeVisit` | red: `only houseWakeVisit sets visiting on a wake`; restored |
| break 2: `visiting = null` dropped from `onSleep` | red: `onSleep sets visiting to null`; restored. Meta-check: both guards are source-level; the browser proof is the kitchen spec and phase 6 |
| lint, typecheck, `npm test`, deploy/ops tests, sample E1-E6, build | green; `Tests 4089 passed` (phase 3 4092, minus deleted roomVisit and visit-layout cases, plus 4 wiring cases); `e2e hook: absent (2 chunks checked)` |
| `git diff --stat 112f158 -- save.ts balance.ts rooms.ts roomArtLoader.ts` | empty |
| e2e `kitchen-room.spec.ts` | NOT run: ports 4397/4398 were busy (orchestrator suite); rows 4.4 and 4.6 are the orchestrator's at the gate |

## 4. Next command

`/10x-implement house-cross-section phase 5`

## 5. Open

- Rows 4.4 and 4.6: the orchestrator runs `kitchen-room.spec.ts` (rewired, never run by me) and the full suite; if the kitchen test fails, the likely cause is the wake data path (`scene.switch(room, { visit })`, first proof in a browser).
- Manual rows: 2.7, 5.11 `[reviewer]`; 5.6 `[visual]`; 5.7-5.10 `[human]`.
- Phase 6 must add `house-cross-section` to `ROUND_SPEC` in `playwright.config.ts`.
- DESIGN-GAP rows planned from 183 in phase 5; row 180 closes. The `houseButton` layout comment refers to "house rows" of `docs/design-gaps.md` (phase 5 writes them).

## 6. Autonomous decisions

- `refresh` is now `(_sys?, data?)` and is also called directly from `create` without data (visiting null). Would change: nothing.
- `houseCellList()` in `RoomScene` builds the cells from the registry for the wake rule (same call as `HouseScene.render`). Would change: a third caller, then a shared helper.
- `housePixel` is left out of the e2e `Hook` type (it is a method with an argument; `readHook` only reads values). Would change: phase 6 wanting a typed helper.
- Driver stays `impl`.
