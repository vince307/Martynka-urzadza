# Handoff — `house-1-polish` (slice S-32)

Written by the `/10x-implement` step, phase 2, of run 2026-11-01-bathroom-polish-lab: the kitchen renovates in three stages (data, copy, two
art files), committed as `d2b8c24` and green. Phase 3 (salon on cream) is next; the per-file `{ pack, id, as }` scene source it needs exists now.

## 1. State

| | |
|---|---|
| branch | `feat/house-1-polish`, from `main` at `964285b` |
| commits | phase 1 `13cb528`, phase 2 `d2b8c24` `feat(house-1-polish): kuchnia remontowana w trzech etapach (p2)` (+ this handoff commit) |
| pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| Progress rows remaining | 28 (`grep -c '^- \[ \]' plan.md`); phase 2 rows 2.1-2.7 ticked; 2.8 `[reviewer]`, 2.9 `[reviewer] (CI)` left |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `scripts/make-task-art.mjs` | `HOUSE_1_POLISH` constant; a `ROOM_PACKS` `scene` entry may be `{ pack, id, as? }`; `ROOM_JOBS` and the pack-existence loop read both forms; kitchen row gained `kitchen-stage-1/2` |
| `public/assets/rooms/kitchen/kitchen-stage-{1,2}.webp` | new: 87 604 B and 86 592 B (equal to research), 174 196 B together; `npm run art` changed nothing else under `public/assets` |
| `src/data/rooms.ts` | `KITCHEN.tasks` = clean-kitchen 5 (scene stage-1), renew-walls 6 (scene stage-2), renew-floor 7, then the six slots; 9 tasks, 84 stars |
| `src/data/pl.ts` | `room.tasks.cleanKitchen` "Posprzątaj kuchnię", `renewWalls` "Odnów ściany" (renewFloor reused), DESIGN-GAP comment pointing at gap 202 |
| `tests/roomArt.test.ts`, `tests/fixtures/room-art-kitchen.json` | kitchen 23 entries; two entries written from the pack |
| `tests/rooms.test.ts` | kitchen leaves the ternary case; new staged `sceneKey`/`stageFade` case and no-worn/no-contact-shadow case for tasksDone 0..9 |
| `tests/roomsData.test.ts` | new kitchen order/cost/scene pin from literals |
| `tests/fixtureLoadPath.test.ts` | the temporary `TASKS_OVERFLOW_KITCHEN` is gone, both cases expect `[]` |

## 3. Verification

| command | result |
|---|---|
| RED first | tests edited before data: 6 failures (2 fixtureLoadPath, 2 roomArt, rooms, roomsData) |
| GREEN | 119 passed in the four files; bootBudget + deployCheck included in the 147 run |
| Break A (swap the two stage `scene` keys) | red: roomArt snapshot, rooms staged case, roomsData pin (3); restored |
| Break B (delete `kitchen-stage-2.webp`) | red: roomArt count, orphan/size, weight (3); restored |
| Break C (`renovate` first task) | red: both fixtureLoadPath landings, rooms staged case, roomsData pin (4); restored |
| Meta-check | the order pin, costs, scene keys and the art fixture are literals from the pack and the plan, not read from `KITCHEN`. Whether each stage looks right is the phase-5 visual pass |
| 2.5 diff | `git diff --stat 37332b9 -- src/core src/scenes src/ui … public/assets/rooms/{salon,children,bathroom,bridge,hangar} tests/fixtures/save-*.json` empty |
| local gate | lint clean (one `no-unsafe-assignment` fixed in the new test), typecheck clean, unit 4252 passed (phase 1 4249, +3), deploy and ops tests OK, `sample` E1-E6 0 violations, build `e2e hook: absent (2 chunks checked)`, `grep -o "assets/rooms/kitchen/" dist/sw.js` = 23 |
| single e2e specs (sandbox disabled, `--workers=1`) | `kitchen-room`, `room-change`, `rooms-as-data`, `house-cross-section`, `kids-room`, `salon-extra-slots`, `bathroom-room`: 21 passed, none edited |
| 2.8 sample note | no task content changed; `npm run sample` unaffected |

## 4. Next command

`/10x-implement house-1-polish phase 3` (phase 3, `Driver: impl`)

## 5. Open

- `[human]` rows 5.7-5.11 (save v7, costs 5/6/7 + slots = 84, salon cell fill gap 207, salon before look gap 206, real tablet offline).
- `[reviewer]` 2.8 (Polish read of "Posprzątaj kuchnię" / "Odnów ściany", button fit) and `[reviewer] (CI at ship)` 2.9 (smoke 146 of 146) and 5.12.
- Phase 3 needs `cwebp` and Pillow/numpy as phase 2 did; expected salon bytes 75 794 / 70 842 / 68 792.
- Code outside data for the product owner (PR body): `src/core/save.ts`, `src/core/types.ts`, `src/core/migrations/kitchenStages.ts`, `scripts/make-task-art.mjs`, later `src/testing/e2eHook.ts` + `vite/e2eHookGuard.mjs`, `deploy/README.md`.
- Full e2e: orchestrator, once after phase 6. DESIGN-GAPs 206, 207 and edits to 109, 182, 203, 169/171 and the follow-ups come in phase 5.

## 6. Autonomous decisions

- No `AskUserQuestion`; manual gate, commit message and next-phase prompts decided in place (commit the planned set, stop after phase 2).
- A first mutation script lost its backup directory (`mktemp` refused in the sandbox) and left `kitchen-stage-2.webp` deleted and the stage keys swapped; both were restored (art re-run gave identical bytes, data re-edited by hand) before the real breaks, which then ran from a scratchpad backup. Final tree matches the committed content.
- The new design-gap comment in `pl.ts` points at the existing row 202 (children's labels) instead of a new row; phase 5 may add the kitchen to that row. Would change: a reviewer wanting a row of its own.
- Stage-2 and stage-1 art come from the pack unconverted otherwise (`convert()` unchanged).
