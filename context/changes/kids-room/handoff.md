# Handoff — `kids-room` (slice S-25)

Written by the `/10x-implement kids-room phase 3` step of run 2026-11-01-kids-room. Phases 1 (5fe9dd2) and 2 (f2b304a) are done: the background rule `sceneKey`/`stageFade` is used by `RoomView.render`, `miniaturePieces`, `RoomScene.fadeStage`, `backdropMode` and `roomArt`. Nothing visible changed for existing rooms. Phase 3 adds the children's room data and art. Keep two things in mind from the plan review: the children's costs
are 5/6/7 + 7/9/10/12/13/15 = 84, and phase 3 adds a temporary placement exemption in `tests/roomsData.test.ts` that phase 4 removes.

## 1. State

| | |
|---|---|
| Branch | `feat/kids-room`, cut from `main` at `bfdf193` |
| Commits on the branch | 9: ..., phase 1 (5fe9dd2), handoff, phase 2 (f2b304a), handoff |
| Pushed / PR / merged | no / no / no |
| `## Progress` rows remaining | 29 (1.1-1.4, 2.1-2.3 ticked; 2.4 left to the orchestrator e2e) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/RoomView.ts` | `render` and `miniaturePieces` pick the background with `sceneKey` |
| `src/scenes/RoomScene.ts` | `fadeStage` ghosts `stageFade(...).from`, shadows/worn ghosts only when `neglected`; tween drops itself from `ghostTweens`; snapshot field `stagesDone: number` |
| `src/data/roomArt.ts` | `roomArt` emits one entry per stage-task `scene` key (`urlOf(key)`), deduped, after the role entries |
| `tests/roomArt.test.ts` | `stageScenes` helper in the two key cases; synthetic-room case |
| `tests/stageSceneWiring.test.ts` | new source test: call sites use `sceneKey`/`stageFade`, no `scene.after :` ternary |

## 3. Verification

| command | result |
|---|---|
| Break 1: restore the ternary in `miniaturePieces` | `stageSceneWiring` 2 red, restored |
| Break 2: stage-key filter always false in `roomArt` | synthetic-room case red, restored |
| Meta-check | wiring test proves call sites only; pixels are phase 6 |
| lint, typecheck, `npm test` (4203 passed = 4198 + 5), deploy/ops tests, `sample` E1-E6, `npm run build` (`e2e hook: absent`) | green |
| `git diff --stat 5fe9dd2 -- tests/fixtures src/data/rooms.ts src/data/houses.ts src/data/pl.ts public` | empty |
| e2e | Chromium launches but the full suite is very slow (15 tests in ~10 min at --workers=3, one load timeout in `adaptive.spec.ts`), so it was stopped; run instead: room-purchase, salon-style, salon-art, canvas-renderer = 14 passed. Full suite (row 2.4) left to the orchestrator |

## 4. Next command

`/10x-implement kids-room phase 2`

## 5. Open

- Phases 3-6 as in the plan (3 impl, 4 tdd, 5 impl, 6 e2e). Phase 3 needs `npm run art` (cwebp, Pillow, numpy); missing = BLOCKED.
- `roomArt` stage-key url is `assets/rooms/<key>.webp` as the plan says; phase 3 must pick stage keys so this matches the files under `public/assets/rooms/children/` (e.g. key `children/stage-1`).
- Manual rows 3.7, 3.8, 5.6-5.12 stay as the human/reviewer/visual checklist.
- Risks unchanged: smaller miniature on every card, `npm run art` needs local tools (missing = BLOCKED), purchase-heavy e2e is load-sensitive.

## 6. Autonomous decisions

- **Skill gates decided in place**: commit message taken as proposed; stopped after phase 1. Driver stays `tdd`; no part was done inline.
- **Stubs before RED**: `sceneKey`/`stageFade` stubs and the `scene?` field were added first so the RED is an assertion failure, not a missing export.
- **`stageFade` uses `{...state, tasksDone - 1}`** for the previous state, so `chosen` is carried unchanged (irrelevant to the rule).
- **Phase 2**: commit message as proposed; stopped after the phase; full e2e not run (too slow here), see §3.
- **`fadeStage` guard**: returns early when `stageFade` is null (cannot happen on its trigger).
