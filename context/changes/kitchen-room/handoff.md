# Handoff — `kitchen-room` (slice S-22)

Written by the `/10x-implement kitchen-room phase 5` step of run 2026-10-30-rooms-kitchen (2026-10-31). Phases 1-5 are committed (3412b6e, 9deb86d, f5f8904, 74d5aea, 18c0118); the plan has 8 phases. The next agent must not get this wrong: **the kitchen is now data, so "Dalej" really moves and a reload after a finished salon opens in the kitchen (`nextRoom` at load); phase 6 adds the done-room visit button and must pass the extended `tests/layout.test.ts` overlap check because the bottom bar is full.**

## 1. State

| | |
|---|---|
| Branch | `feat/kitchen-room` |
| Commits | `3412b6e` (p1), `9deb86d` (p2), `f5f8904` (p3), `74d5aea` (p4), `18c0118` (p5: `feat(kitchen-room): The kitchen as data and art (p5)`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows | 5.1-5.4 ticked with sha; 5.5 left (e2e clause belongs to the orchestrator); 5.6 [reviewer], 5.7 [reviewer], 5.8 [human] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `public/assets/rooms/kitchen/*.webp` | 21 new files, 797 758 B (3 scenes, 18 variants), from `designs/martynka-locations-v2` by `npm run art`; salon bytes untouched |
| `scripts/make-task-art.mjs` | `LOCATIONS_V2` + kitchen `ROOM_PACKS` row (`recolourBoard: false`); `python3 -I` for the recolour (follow-up audit-art-renderer § 2) |
| `src/data/rooms.ts` | `KITCHEN` (stage + 6 slots, manifest geometry, costs 5, 7, 9, 10, 12, 13, 15), `ROOMS = { salon, kitchen }` |
| `src/data/roomArt.ts` | `ROOM_SCENE_FILES.kitchen` |
| `src/data/pl.ts` | `names.kitchen`, 6 task imperatives, 6 slot captions, 6 x 3 variant labels, room-neutral `settings.roomMismatch` / `saveTransfer.roomMismatch` |
| `tests/roomArt.test.ts`, `tests/fixtures/room-art-kitchen.json` | per-room snapshots (salon 37, kitchen 21), weight cap per room |
| `tests/roomsData.test.ts` | house list is `[salon, kitchen]`; `nextRoom` moves into the kitchen with an empty state |
| `tests/e2e/rooms-as-data.spec.ts`, `room-change.spec.ts`, `salon-extra-slots.spec.ts` | updated for the kitchen tile (see below); NOT run |

## 3. Verification

| command | result (observed) |
|---|---|
| unit | 4045 passed = 4044 + 1 (bootBudget now one case per room) |
| lint / typecheck / build | OK / OK / OK, `e2e hook: absent (2 chunks checked)`; deploy and ops scripts OK; sample E1-E6 OK |
| `npm run art` x2 | first run: `git status --porcelain public` lists only `?? public/assets/rooms/kitchen/`; second run changed nothing; `public/assets/rooms/salon` empty |
| Boot budget | shared 889 112 B + salon 1 203 384 B = 2 092 496 B = 41.8 s; shared + kitchen 797 758 B = 1 686 870 B = 33.7 s; limit 48 s; `balance.loader.totalMs` 50 000 unchanged (against 942e237 `balance.ts` differs only by the phase-2 comment) |
| Break 1 | `bootRoomArt` returning all of `ROOM_ART` -> `tests/bootBudget.test.ts` red, "boot payload 2890254 B = 57.8 s", both rooms; restored from a copy (confirmed changed by `git diff --quiet`) |
| Break 2 | two kitchen fridge variant keys swapped in `src/data/rooms.ts` -> `tests/roomArt.test.ts` snapshot case red; restored from a copy (`cmp` identical) |
| Meta-check | the kitchen snapshot is generated from the data, so it proves data and table agree; its geometry was checked by eye against the manifest (coffee `visibleRect [17,16,342,312]`, anchor `[188,328]` differ from the others by design) and sizes come from disk |
| e2e | NOT run (orchestrator owns ports 4397/4398). Specs and titles changed for the orchestrator: `tests/e2e/rooms-as-data.spec.ts` "#10 rooms-as-data a finished salon reloads into the kitchen (S-22), the salon state kept and the kitchen empty" and its "#10 ... v4 salon save" neighbours' card list; `tests/e2e/room-change.spec.ts` "FR-019 the last purchase shows »Pokój gotowy!« and »Dalej« moves the child into the kitchen"; `tests/e2e/salon-extra-slots.spec.ts` "#2 FR-019 S-16d a salon finished with seven tasks gets the five new ones and the done card again at the twelfth". Also run `adaptive`, `final-art-room-done`, `health-lines`, `minigames`, `room-purchase`, `salon-art` (they tap `cardNext`; `salon-art` #16 asserts `health.total === ROOM_ART.length`, which is now 58 and may need the current-room count instead) |

## 4. Next command

`/10x-implement kitchen-room phase 6`

## 5. Open

- Row 5.5 e2e clause (orchestrator, `--workers=4`, three updated specs plus the cardNext specs above). Re-homed to phase 8: the salon's change mode through the done-room visit and the kitchen's own change mode (the change-mode half of the old FR-019 test).
- Manual rows: 4.5 [visual]; 5.6 [reviewer] Polish read of kitchen strings; 5.7 [reviewer] kitchen geometry against the manifest (done by eye here, not ticked); 5.8 [human] S-17 tunes costs; 7.6-7.9; 7.10.
- Risk: after "Dalej" the kitchen art comes from the runtime loader (phase 3); on a cold link the kitchen may show stand-ins briefly. Phase 8 proves it in the browser.
- Risk: the Polish captions "szafki" / "stół i krzesła" / "naczynia" are plural, "kącik kawowy" masculine; variant labels agree per caption (plan contract).
- DESIGN-GAP rows from 175 and follow-ups are phase 7.

## 6. Autonomous decisions

- **Fixed by the maintainer (scope.md):** unchanged (kitchen from locations-v2, costs 5-15 salon style, one celebration, one room in renovation, budget measured, no `totalMs` raise).
- **Driver impl;** no skill checkpoint needed a user answer: execution mode in this context, no unrelated dirty paths, commit message as proposed, stop after the phase. Lessons file absent.
- Kitchen texture keys are `kitchen/kitchen-<slot>-<look>` because `roomArt` derives the URL from the key and the pack files are named `kitchen-<slot>-<look>`; the plan's `kitchen/<slot>-natural` reads the same with the slot id `kitchen-counter` etc.
- Existing `rooms-as-data` #10 (reload of a finished salon) changed its oracle to "opens in the kitchen" because `nextRoom` runs at load; that is the F-04 rule the kitchen activates, not a regression.
- Row 5.4 ticked with a note: against HEAD the diff is empty; against 942e237 `balance.ts` differs only by the phase-2 comment.
- A restore by `git checkout` during break 1 also dropped my uncommitted kitchen row in `roomArt.ts`; it was re-applied from a backup before the next step (no effect on the commit).
