<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Kids' room, the third room of house 1

- **Plan**: context/changes/kids-room/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6
- **Date**: 2026-11-01
- **Verdict**: APPROVED (after the fixes below)
- **Findings**: 1 critical (fixed) 1 warning (fixed) 4 observations

Reviewed `git diff bfdf193..4c594c0` (61 files; code: `src/core/{types,rooms,backdrop}.ts`, `src/ui/widgets/RoomView.ts`,
`src/scenes/RoomScene.ts`, `src/data/{rooms,roomArt,houses,layout,pl}.ts`, `scripts/make-task-art.mjs`, `playwright.config.ts`,
23 WebP, tests). Fix commit `d544695`.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS (e2e: orchestrator full run at 4c594c0, result appended by the orchestrator; `kids-room.spec.ts` changed by `d544695` must be re-run) |

## Checks performed

- **Plan adherence, phase by phase.** P1 `sceneKey`/`stageFade` in `src/core/rooms.ts` exactly as the contract (last done stage's `scene`, else `scene.after`, else `scene.before`; `stageFade` null unless the last done task is a stage, `neglected` = previous `stagesDone === 0`); `backdropMode` reads `sceneKey`. P2 `RoomView.render` and `miniaturePieces` use `sceneKey`, the stand-in fill / shadows / worn gates keep `renovated`; `RoomScene.fadeStage` ghosts `fade.from`, shadows and worn ghosts only when `neglected`, the tween's `onComplete` drops itself from `ghostTweens` (salon-style F4); `roomArt` adds stage keys, deduplicated, never a role key; snapshot type lives in `RoomSnapshot` (`src/scenes/RoomScene.ts`), so `src/testing/e2eHook.ts` needed no edit (plan: "if typed there"). P3 `CHILDREN` matches the manifest literal, costs 5,6,7,7,9,10,12,13,15 = 84, `ROOM_PACKS` row, `ROOM_SCENE_FILES.children`, copy. P4 one `HOUSES['house-1']` row, `ROOM_DONE_LAYOUT.tiles` 340/32/0.12/28/22, frozen `save-v6-kitchen-done.json`, placement exemption removed (`grep "id === 'children' ? 0" tests` empty). P5 docs/gaps 202-204, row 109 narrowed. P6 spec.
- **Flipped tests (phase 4) against the plan's table**: `kitchen-room.spec.ts` #2 (third item `room:false:false`), #16 (third item `children` unlocked, "Dalej" → `children`, kitchen state equal, change mode proved through a `ground-right` visit), `rooms-as-data.spec.ts` `HOUSE` constant and #10 card items, `room-change.spec.ts` `toHaveLength(3)` + `items[2]` — each matches its row and reason. No other existing expectation changed (`git diff bfdf193..HEAD -- tests` reviewed in full: every other hunk is an added case).
- **Save path**: v6 stays; `tests/fixtures/` gained only `save-v6-kitchen-done.json` and `room-art-children.json`, no existing fixture touched; `fixtureLoadPath` mirrors `repairCurrentRoom` → `mergeHouse` → `nextRoom` and lands in `children` with `movedFrom 'kitchen'`, salon/kitchen equal to the fixture, stars kept.
- **Existing rooms unchanged**: `sceneKey` equals the old ternary for every room without stage `scene` (guard now covers salon, kitchen, Mostek, Hangar, F2); `stageFade` for a one-stage room gives `{ from: before, neglected: true }` = the old ghost set; `roomArt` snapshots of salon/kitchen/bridge/hangar unchanged.
- **Code outside data (D1)**: `src/core/types.ts`, `src/core/rooms.ts`, `src/core/backdrop.ts`, `src/ui/widgets/RoomView.ts`, `src/scenes/RoomScene.ts` (fade + one snapshot field), `src/data/roomArt.ts` logic. Minimal (≈60 lines), unit-covered (rooms, backdrop, roomArt, stageSceneWiring) and rendered-covered (kids-room #16); named in `change.md` and `[human]` row 5.7.
- **Content (teacher read, row 3.7)**: "Pokój dziecięcy"; captions in the nominative (łóżko, biurko i krzesło, regał na książki, skrzynia na zabawki, kącik czytelniczy, szafa); tasks imperative + accusative (Posprzątaj pokój, Pomaluj ściany, Odnów podłogę, Postaw łóżko / biurko i krzesło / regał na książki / skrzynię na zabawki, Urządź kącik czytelniczy, Postaw szafę); variants agree (Naturalne… for the plural "biurko i krzesło", Naturalny… for regał/kącik, Naturalna… for skrzynia/szafa), bed forms from the pack. No error. The longest label "Postaw skrzynię na zabawki" (26 characters) equals the shipped "Ustaw skrzynie z częściami" (Hangar), which fits `RoomTaskButton`. `npm run sample` E1-E6 green (no task content changed).
- **Art**: 23 WebP in `public/assets/rooms/children/`, all in `roomArt(CHILDREN)` (23 entries, snapshot), `dist/sw.js` lists 23 children files and 123 room pictures in total; `tests/bootBudget.test.ts` green.
- **Hooks**: `.claude/settings.json` (10 Oct) and `.claude/hooks/*` (10-12 Oct) untouched since before the run; no bypass seen.

## Findings

### F1 — Stage 1 and the after look were indistinguishable to the stage pixel oracle

- **Severity**: ❌ CRITICAL (fixed)
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/kids-room.spec.ts (`WALL_BY_STAGE`, the stage loop of test `#16 S-25 …`)
- **Detail**: `WALL_BY_STAGE[1]` (236,199,154) and `WALL_BY_STAGE[3]` (244,207,155) differ by 8/8/1, inside the tolerance 12 of `near`, so a room that showed the after picture at stage 1 (or stage 1 at stage 3) passed both polls. The plan's "every transition asserts the rendered pixel differs from the previous read by ≥ 30" was written as `apart(WALL_BY_STAGE[staged], WALL_BY_STAGE[staged - 1], 30)`, a comparison of two constants that cannot fail on a bug. The handoff's Break 1 (`sceneKey` always `after`) still went red, but by this arithmetic at stage 2, not stage 1 as recorded.
- **Fix**: `showsStage` = `near(…, 12)` AND the rendered pixel is closest to its own row of `WALL_BY_STAGE` (`nearestStage`); the constant check replaced by a rendered read compared with the previous rendered read (≥ 30 in one channel; measured gaps 31-146). — `d544695`
- **Decision**: FIXED (orchestrator re-runs `tests/e2e/kids-room.spec.ts`)

### F2 — The single-stage guard of `sceneKey` covered salon and kitchen only

- **Severity**: ⚠️ WARNING (fixed)
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/rooms.test.ts (`describe('sceneKey and stageFade (kids-room phase 1)')`)
- **Detail**: the step brief asks that salon, kitchen and the base rooms render exactly as before; the guard skipped `bridge` and `hangar`.
- **Fix**: the guard iterates `['salon', 'kitchen', 'bridge', 'hangar']`. — `d544695`
- **Decision**: FIXED

### F3 — `RoomScene.fadeStage` tween bookkeeping has no unit test

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/RoomScene.ts (`fadeStage`, `ghostTweens`)
- **Detail**: the self-removing `onComplete` is scene code; the e2e stage polls wait through three fades back to back, which exercises it. Consistent with the repo (scene code proven in the browser).
- **Fix**: none.
- **Decision**: RECORDED

### F4 — `ROOM_DONE_LAYOUT.tiles.left` unread

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/data/layout.ts (`ROOM_DONE_LAYOUT.tiles.left`)
- **Detail**: already follow-up 3 with a trigger.
- **Fix**: none.
- **Decision**: RECORDED

### F5 — Unit count reconciled

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: N/A
- **Detail**: `npm test` 4215 passed = 4194 + 21; `vitest list` per file vs a `bfdf193` worktree: backdrop +2, fixtureLoadPath +1, houseCells +1, layout +1, roomArt +1, roomHit +1, rooms +4, roomsData +6, stageSceneWiring +4 = 21. `d544695` changes one case's body, count unchanged. CI at ship (row 5.12): `Tests  4212 passed | 3 skipped (4215)`.
- **Decision**: RECORDED

### F6 — Roadmap row moved to `planning`

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: context/foundation/roadmap.md (S-25 row and status)
- **Detail**: bookkeeping by the chain; the ship step sets `done`.
- **Decision**: RECORDED

MERGE: CLEAR — F1 and F2 fixed in d544695, lint/typecheck/unit 4215 (4194 + 21)/deploy tests/sample E1-E6/build green; e2e pending the orchestrator's run plus a re-run of tests/e2e/kids-room.spec.ts
