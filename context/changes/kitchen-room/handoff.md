# Handoff — `kitchen-room` (slice S-22)

Written by the `/10x-implement kitchen-room phase 4` step of run 2026-10-30-rooms-kitchen (2026-10-31). Phases 1-4 are committed (3412b6e, 9deb86d, f5f8904, p4 below); the plan has 8 phases. The next agent must not get this wrong: **phase 5 adds the kitchen, so "Dalej" really moves for the first time; the order at "Dalej" is `nextRoom` -> `rooms` -> `currentRoom` -> `flush('now')` -> `ensure` + `refreshHealth` -> `redraw()` (guarded by `tests/celebrationWiring.test.ts`), and "Obrazki" must never list a room still loading.**

## 1. State

| | |
|---|---|
| Branch | `feat/kitchen-room` |
| Commits | `3412b6e` (p1), `9deb86d` (p2), `f5f8904` (p3), `feat(kitchen-room): The room celebration card and the move after "Dalej" (p4)` `74d5aea` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows | 4.1-4.3 ticked with sha; 4.4 left (e2e clause belongs to the orchestrator); 4.5 [visual] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/layout.ts` | `ANIMATION.celebration` (room/house/street rows; room `holdMs` 1200 = 600 stage fade + 600 look, `burstCount` 22 = summary burst, `keepsake` false) |
| `src/ui/widgets/RoomDoneCard.ts` | `show(..., extras: CardExtras {pending, burst})`; no fallback record for a pending tile; ONE `starBurst` per visit from the card centre, destroyed in `hide()` |
| `src/ui/widgets/starBurst.ts` | returns the emitter |
| `src/scenes/RoomScene.ts` | `dispatch` ensures `cardRooms(...)` at the last purchase, delay = `celebrationView('room', ...).revealMs`; `moveAfterDone()` on "Dalej"; `changedata-roomLoad` redraw listener; snapshot `card.celebration` |
| `src/scenes/TaskScene.ts` | wake re-captures the backdrop when `roomLoad` changed (`backdropRoomLoad`, F3) |
| `tests/celebrationWiring.test.ts` (new, 8), `tests/roomDoneCardWiring.test.ts` (+2), `tests/reducedMotionWiring.test.ts` (+1) | source guards |

## 3. Verification

| command | result (observed) |
|---|---|
| Wiring tests | 4 files, 30 passed |
| Break order | `flush('now')` before `registry.set(currentRoom)` -> "Dalej moves ... after both registry writes" red |
| Break fallback | record fallback for a pending tile -> "records a fallback only for a tile that is not loading" red |
| Break delay | fixed `600` instead of `revealMs` -> "delay of the card comes from revealMs" red |
| Meta-check | each break confirmed changed (`git diff --quiet` reported CHANGED) and restored by `git checkout`; guards prove wiring only, browser behaviour is phase 8 |
| lint / typecheck / build | OK / OK / OK, `e2e hook: absent (2 chunks checked)` |
| unit | 4044 passed = 4033 + 11; deploy, ops scripts OK; sample E1-E6 OK |
| 4.3 | `git diff` of `src/data/rooms.ts`, `src/data/pl.ts`, `public`, `src/core/save.ts` empty |
| e2e | `room-change`, `final-art-room-done`, `room-purchase` specs, workers=1: 7 passed; full suite is the orchestrator's |

## 4. Next command

`/10x-implement kitchen-room phase 5`

## 5. Open

- Phase 5 (kitchen data and art) changes the e2e specs `tests/e2e/rooms-as-data.spec.ts`, `room-change.spec.ts`, `salon-extra-slots.spec.ts` (the teaser tile becomes the kitchen tile).
- Manual rows: 4.5 [visual] pop, hold, card with burst, salon tile and "Wkrótce" tile at 1440 and 1024, plus reduced motion; 5.6 [reviewer] kitchen copy; 5.7 [reviewer] kitchen geometry; 5.8 [human] S-17 tunes costs; 7.6 [visual] eight-state matrix; 7.7-7.9 [human]; 7.10 [reviewer] CI `check`.
- Known: the celebration burst count (22) and hold (1200) are agent picks within the plan's range, tuned by the 4.5 visual look; `house`/`street` rows are placeholders for S-23/S-24.
- Phase 6 placement risk: the bottom bar is full; `ROOM_LAYOUT.visitButton` must pass the extended `tests/layout.test.ts` overlap check.
- Known risks in plan.md: runtime loads skip `wrongSizes` (F5); a visited done room is not judged by "Obrazki"; shared HUD loader listeners are keyed (F6).
- DESIGN-GAP rows from 175 (phase 7); follow-ups re-recorded in phase 7.

## 6. Autonomous decisions

- **Fixed by the maintainer (scope.md):** unchanged (kitchen from locations-v2, one celebration, room intensity only, one room in renovation, budget measured).
- **Driver impl;** no skill checkpoint needed a user answer: execution mode = in this context, no unrelated dirty paths, commit message as proposed, stop after the phase. Lessons file absent.
- **Hold = 1200 ms** (600 stage fade + 600 look) and `burstCount` 22, within the plan's 400-800 ms extra. What would change it: the 4.5 visual look.
- **Burst once per visit** via a `burstPlayed` flag on the card (cleared in `hide()`), because the card redraws on every `roomLoad` change.
- Card `extras` has a default (`pending` empty, `burst` 0) so other callers stay valid.
- Phases 1-3 decisions: unchanged (rows 1.4, 2.4, 3.4 and 4.4 left for the orchestrator's e2e).
