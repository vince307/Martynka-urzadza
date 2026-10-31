# Handoff — `house-cross-section` (slice S-23)

Written by the `/10x-tdd` step, phase 1 of run 2026-10-31-house-cross-section. Phase 1 (pure house cells and wake rule) is
committed `158004b`. The next agent must not get wrong: in `RoomScene` `refresh(data)` REPLACES its own `this.visiting = null`
with `houseWakeVisit(...)` (setting it before the resets would be wiped), and the hook's house snapshot is `houseView`, never
`house` (that field is the saved `HouseState`).

## 1. State

| | |
|---|---|
| branch | `feat/house-cross-section`, cut from `main` at `112f158` |
| commits | change identity, research, plan, plan review, `158004b` `test(house-cross-section): house cells and the wake rule (p1)`, this handoff |
| pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 32 (`grep -c '^- \[ \]' plan.md`); phase 1 rows 1.1-1.4 ticked |
| working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/houseCells.ts` | `houseCells`, `cellTap`, `houseWakeVisit`, types `HouseCellState`, `HouseCellView`, `CellTap` |
| `src/core/types.ts` | `SceneRect`, `HouseCellDef`, `HouseGeometry` |
| `src/data/houses.ts` | `HOUSE_GEOMETRY['house-1']` from the pack manifest (keys `house/house-1-shell`, `house/cell-closed`, `house/cell-frame`) |
| `tests/houseCells.test.ts` | 21 cases (cell states, tap, wake rule, geometry data) |
| `context/changes/house-cross-section/plan.md` | rows 1.1-1.4 ticked with `158004b` |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/house-cross-section` |
| RED (stub returning wrong values) | `AssertionError: expected [ 'done', 'done', 'done', 'done' ] to deeply equal [ 'current', 'closed', 'closed', …(1) ]`; `expected 'x' to be null`; `expected { kind: 'none' } to deeply equal { kind: 'room', visit: 'salon' }` (15 failed, 6 passed) |
| GREEN | `npx vitest run tests/houseCells.test.ts` 21 passed |
| break 1: `houseCells` marks a not-reached room `done` | red: `expected [ 'current', 'done', 'closed', …(1) ] to deeply equal [ 'current', 'closed', 'closed', …(1) ]` (+1 more); restored |
| break 2: `houseWakeVisit` accepts the current room (drop the `visit === current` guard AND the `done`-only filter) | red: `expected 'kitchen' to be null`; restored. Meta-check: dropping only the `=== current` guard stays green, because the `current` cell state already excludes the current room (the guard is redundant defence); the `{ visit: 'kitchen' }` case therefore proves the state filter, which is the real protection |
| `npm run lint`, `typecheck`, `npm test` (+ deploy/ops tests, sample E1-E6), `npm run build` | all green; `Tests 4078 passed`; `e2e hook: absent (2 chunks checked)` |
| unit count | baseline 4057 + 21 = 4078 |
| `git diff --stat 112f158 -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures src/data/rooms.ts` | empty |
| e2e | not run (phase 1 names none; orchestrator `+ 0`) |

## 4. Next command

`/10x-implement house-cross-section phase 2`

## 5. Open

- Manual rows (human checklist): 2.7 and 5.11 `[reviewer] (CI at ship)`; 5.6 `[visual]`; 5.7, 5.8, 5.9, 5.10 `[human]`.
- Phase 6 must add `house-cross-section` to `ROUND_SPEC` in `playwright.config.ts`.
- `HOUSE_GEOMETRY` references art keys of phase 2 (`HOUSE_ART` table must use the same three keys).
- DESIGN-GAP rows planned from 183 in phase 5; row 180 closes.

## 6. Autonomous decisions

- Tests went into the new `tests/houseCells.test.ts` only (the data test included), not `tests/house.test.ts`: all new cases
  concern the new module. Plan row 1.1 command still passes. Would change: nothing.
- The pack's rect type is new (`SceneRect`) because `types.ts` has no rect type. Would change: a rect type appearing elsewhere.
- Wake-rule break: the plan's single break (accept the current room) is green alone because `current` cells are never `done`;
  recorded as the meta-check above, break done with both conditions. Would change: nothing.
- Driver stays `tdd`; no redirect.
