# Handoff — `kitchen-room` (slice S-22)

Written by the `/10x-implement kitchen-room phase 7` step of run 2026-10-30-rooms-kitchen (2026-10-31). Phases 1-6 are committed (3412b6e, 9deb86d, f5f8904, 74d5aea, 18c0118, 0695012); the plan has 8 phases. The next agent must not get this wrong: **the room view now has a visit button (top right under the star counter) that opens the other done room in place; `visiting` is runtime only and `currentRoom` is written only by "Dalej". Phase 7 owns the DESIGN-GAP row for this button, docs and the visual pass.**

## 1. State

| | |
|---|---|
| Branch | `feat/kitchen-room` |
| Commits | `3412b6e` (p1), `9deb86d` (p2), `f5f8904` (p3), `74d5aea` (p4), `18c0118` (p5), `0695012` (p6: `feat(kitchen-room): Visit a done room in its change mode (p6)`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows | 5.1-5.4, 6.1-6.3 ticked with sha; 5.5 and 6.4 left (e2e clause belongs to the orchestrator); 5.6/5.7 [reviewer], 5.8 [human] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/roomVisit.ts` | pure `visitTarget(items, current, visiting)` |
| `src/scenes/RoomScene.ts` | `visiting` (runtime only, reset in create/wake/sleep), `visitButton` (label `roomText.name(target)`), `visit()`, `resolve()` reads `visiting` first; snapshot gains `visiting` |
| `src/data/layout.ts` | `ROOM_LAYOUT.visitButton` {1622,172,256x104} + `ROOM_TOUCH_TARGETS.visitButton`; DESIGN-GAP comment (row is phase 7) |
| `src/testing/e2eHook.ts` | targets gain `visitButton` (tap point) |
| `tests/roomVisit.test.ts`, `tests/roomVisitWiring.test.ts`, `tests/layout.test.ts` | 5 + 4 + 1 new cases |

## 3. Verification

| command | result (observed) |
|---|---|
| unit | 4055 passed = 4045 + 10 |
| lint / typecheck / build | OK / OK / OK, `e2e hook: absent (2 chunks checked)` |
| 6.3 diff | empty except `src/data/balance.ts` (the phase-2 comment, as in 5.4) |
| Break 1 | dropped `visiting = null` from the wake `refresh` -> `roomVisitWiring` "wake refresh and onSleep end a visit" red; restored (`git checkout`, staged copy) |
| Break 2 | `visitTarget` ignoring `done` -> `roomVisit` "is null when no other room is done" red; restored |
| Meta-check | each break verified by `git diff --quiet` = changed before running; oracles are literal lists; wiring guards prove source shape only, the browser path is phase 8 |
| e2e | NOT run. Specs changed in this phase: none. Phase 8 must tap `visitButton` from the hook targets |

## 4. Next command

`/10x-implement kitchen-room phase 7`

## 5. Open

- Rows 5.5 and 6.4 e2e clauses (orchestrator, `--workers=4`; the three specs listed in the phase-5 handoff, see git history of this file, plus the cardNext specs).
- Manual rows: 4.5 [visual]; 5.6/5.7 [reviewer]; 5.8 [human]; 7.6-7.10 (7.6 must show the visit button frames, not overlapping the HUD pills at 1622,172).
- Phase 7 must add the DESIGN-GAP row for the visit button (layout.ts comment says "kitchen-room visit button") and a follow-up (S-23 replaces it; a visited room is not judged by "Obrazki").
- Risk: the visit button sits top right under the star counter (the bottom bar is full); the gear hint bubble sits above the gear and was not checked against it, the visual pass should.

## 6. Autonomous decisions

- **Fixed by the maintainer (scope.md):** unchanged (kitchen from locations-v2, costs 5-15 salon style, one celebration, one room in renovation, budget measured, no `totalMs` raise).
- **Driver impl;** no skill checkpoint needed a user answer: execution mode in this context, no unrelated dirty paths, commit message as proposed, stop after the phase. Lessons file absent.
- Kitchen texture keys are `kitchen/kitchen-<slot>-<look>` because `roomArt` derives the URL from the key and the pack files are named `kitchen-<slot>-<look>`; the plan's `kitchen/<slot>-natural` reads the same with the slot id `kitchen-counter` etc.
- Existing `rooms-as-data` #10 (reload of a finished salon) changed its oracle to "opens in the kitchen" because `nextRoom` runs at load; that is the F-04 rule the kitchen activates, not a regression.
- Row 5.4 ticked with a note: against HEAD the diff is empty; against 942e237 `balance.ts` differs only by the phase-2 comment.
- A restore by `git checkout` during break 1 also dropped my uncommitted kitchen row in `roomArt.ts`; it was re-applied from a backup before the next step (no effect on the commit).
- **Phase 6 (driver impl):** visit button placed top right under the star counter (1622,172, 256x104) because the bottom bar (resume, task, mode) leaves no 96 px gap; label is the existing `pl.room.names` copy; the target is prefetched on show and on tap. Lessons file absent; no skill checkpoint needed a user answer; commit message as proposed.
