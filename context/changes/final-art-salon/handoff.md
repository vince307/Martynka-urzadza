# Handoff — `final-art-salon` (slice S-16a)

Written by the `/10x-tdd` phase 2 step: `remapLegacySalon` carries a pre-S-16a salon save to the new task list at load
(commit bab7ad7). The next agent must not get wrong: the remap is wired but a no-op today (the data still has the old
10 tasks, so every `chosen` key is a valid slot); it starts working when phase 3 swaps `SALON`. Phase 3 must keep
`LEGACY_SALON` untouched and update `tests/salonRemap.test.ts` only if `RoomTaskDef` changes (it uses a
`Pick<RoomDef,'tasks'>` room written inline: stage, sofa, rug, coffee-table, cabinet, armchair, wall-frames, costs 5, 7, 9, 10, 12, 13, 15).

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | phase 1 `d5d6993`, phase 2 `bab7ad7`, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (flips to `implemented` at the last phase) |
| `## Progress` | phase 1: 1.1-1.3 ticked; phase 2: 2.1-2.4 ticked, 2.5 `[human]` open |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/rooms.ts` | `remapLegacySalon(session, legacy, room)`: rule B (shortest new prefix with cost >= old spent, capped at the list), variants carried by `renames`, gifted furniture gets 0, old keys dropped, idempotent (`toBe`) |
| `src/core/types.ts`, `src/data/rooms.ts` | `LegacyRoomLayout`; frozen `LEGACY_SALON` (10 old tasks, renames table/shelf/picture) |
| `src/main.ts`, `src/scenes/UIScene.ts` | remap after `repairCurrentRoom` before `createGame`; import preview `summarize` remaps first |
| `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs`, `tests/e2eHookGuard.test.ts` | e2e-only seam `?e2eSave=legacy-salon` (old list, 4 done, floor 0 walls 1 curtains 2 sofa 2, 3 stars); marker `legacy-salon`, absent from `dist/` |
| `tests/salonRemap.test.ts` | 62 tests: every old `tasksDone` 0-10, idempotence, gift rule, fixtures pass through unchanged, no mutation |

## 3. Verification

| Command | Result |
|---|---|
| RED (observed) | `AssertionError: expected [ 'floor' ] to deeply equal []` (old key kept by the stub); 33 of 62 failed |
| lint / typecheck | pass / pass |
| unit incl. deploy tests, sample E1-E6 | Tests 2910 passed (branch baseline 2847, +63: 62 remap + 1 marker row) |
| build | pass, `e2e hook: absent (2 chunks checked)`; `legacy-salon` absent from `dist/_app` |
| e2e | `npx playwright test --workers=4`: 93 passed (branch baseline 93, no change) |
| `git diff --exit-code tests/fixtures/` | clean |
| Deliberate break | rounding down (prefix while cost + next <= spent): 8 failed incl. `covers the spent stars...`; restored. Meta: keeping old `chosen` keys: 22 failed (idempotence, chosen-entry); restored |

## 4. Next command

`/10x-tdd final-art-salon phase 3`

## 5. Open

- Human checklist: `[human]` 2.5 remap rule B vs rule A (gifted furniture variant 0; old 9-10 surplus not refunded); `[human]` 10.4 iPad playthrough.
- Visual rows: 4.7, 5.3, 5.4, 6.4, 7.4, 8.3. Phase 3 stays one phase; on context pressure return `NEEDS_CONTINUATION`.
- Phase 10 e2e for the seam: reload re-remaps from the in-memory store (idempotence), persistence is proven by the seam log `writtenVersion` 2 after the next change (plan-review F4).
- Phase 3: criterion `rg SALON_PLACEHOLDERS` empty; the remap test's inline room needs no change unless types change.

## 6. Autonomous decisions

1. Marker for a legacy save: any `chosen` key that is not a slot of the new room. Old `tasksDone` >= 1 always has `floor`, so it is reliable; with the current (old) data the remap is a no-op.
2. `remapLegacySalon` takes `Pick<RoomDef,'tasks'>` so the test room and phase 3 data need no slot geometry. Would change: a need to read slots.
3. Seam value `legacy-salon` added to the existing `e2eSave` seam list with its own guard marker `legacy-salon` (plan-review F4); stars 3.
4. Phase kept `Driver: tdd`; wiring (main, UIScene, seam, guard) was inline scaffolding.
