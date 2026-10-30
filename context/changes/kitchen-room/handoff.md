# Handoff — `kitchen-room` (slice S-22)

Written by the `/10x-implement kitchen-room phase 3` step of run 2026-10-30-rooms-kitchen (2026-10-31). Phases 1-2 are committed (3412b6e, 9deb86d); the plan has 8 phases. The next agent must not get this wrong: **`refreshHealth(room)` is a no-op
while `room` is pending in `roomArtLoader` (plan review F1) — "Obrazki" must never list a room still loading — and the
boot loads ONE room (`bootRoomArt(currentRoom)`) with `balance.loader.totalMs` unchanged at 50 000.**

## 1. State

| | |
|---|---|
| Branch | `feat/kitchen-room` |
| Commits | `3412b6e` (p1), `9deb86d feat(kitchen-room): Boot loads only the room in renovation; the budget test per room (p2)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` is not yet set by this step (unchanged: `plan_reviewed`) |
| `## Progress` rows remaining | 36 (1.1-1.3, 2.1-2.3 ticked with sha; 1.4 and 2.4 left: e2e clause belongs to the orchestrator) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/roomArt.ts` `bootRoomArt`; `src/core/artHealth.ts` `roomHealthOf` (reuse in phase 3); `BootScene` queues/judges the current room; `tests/bootRoomArt.test.ts` |
| `src/core/celebration.ts` | `celebrationView`, `CelebrationIntensity`, `CelebrationSpec`, `CelebrationView` |
| `src/core/roomLoad.ts` | `cardRooms`, `roomsToLoad`, `tileLoading` |
| `tests/celebration.test.ts`, `tests/roomLoad.test.ts` | 3 + 6 tests, literal oracles |
| `context/changes/kitchen-room/plan.md` | rows 1.1-1.3 ticked with `3412b6e` |

## 3. Verification

| command | result (observed) |
|---|---|
| bootBudget + bootRoomArt | 4 passed (budget is `it.each` over ROOMS) |
| Break 1 | `bootRoomArt` returns `ROOM_ART` (python replace confirmed): behaviour tests stay GREEN (one room: ROOM_ART == salon entries), as the plan foresees; the budget goes red only once the kitchen exists. Restored |
| Break 2 | `BootScene` iterates `ROOM_ART` again (confirmed): source guard red; restored |
| Meta-check | budget bytes are `statSync` of files on disk; the guard proves wiring only |
| lint / typecheck / build | OK / OK / OK (hook absent) |
| unit | 4026 passed = p1 4023 + 3; deploy, ops scripts OK; sample E1-E6 exit 0 |
| rows 2.3 | `git diff --stat 942e237 -- rooms.ts pl.ts public save.ts` empty; `totalMs: 50000` |
| e2e | `salon-art.spec.ts` 4 passed (workers=1); full suite is the orchestrator's |

## 4. Next command

`/10x-tdd kitchen-room phase 3`

## 5. Open

- Manual Progress rows (human checklist): 4.5 [visual] celebration on the salon (one room); 5.6 [reviewer] teacher read
  of the kitchen copy; 5.7 [reviewer] kitchen geometry vs `designs/martynka-locations-v2/manifest.json`; 5.8 [human]
  S-17 tunes kitchen costs; 7.6 [visual] eight-state matrix at 1440 + 1024 (frame 8 = the visit button); 7.7 [human]
  accept the interim "Salon"/"Kuchnia" visit button until S-23 (K-6 revised); 7.8 [human] salon green board vs kitchen
  cream margin; 7.9 [human] offline tablet check of the runtime kitchen load; 7.10 [reviewer] (CI at ship) job `check`.
- Phase 6 placement risk: the bottom bar is full (`ROOM_LAYOUT.resume`, `taskButton`, `modeButton`); `ROOM_LAYOUT.visitButton`
  must pass the extended `tests/layout.test.ts` overlap check and visual frame (8).
- Known risks in plan.md: runtime loads skip `wrongSizes` (F5); a visited done room is not judged by "Obrazki"; keyed
  `on('addfile')` on the shared HUD loader (F6).
- e2e specs that change in phase 5: `tests/e2e/rooms-as-data.spec.ts`, `tests/e2e/room-change.spec.ts` (its FR-019
  change-mode half re-homed to `tests/e2e/kitchen-room.spec.ts` phase 8: salon via the visit button + kitchen's own),
  `tests/e2e/salon-extra-slots.spec.ts`; `tests/e2e/salon-art.spec.ts` #16 changes in phase 2.
- DESIGN-GAP rows from 175 (phase 7): kitchen copy, celebration view, kitchen tile without thumbnail, green vs cream,
  room-neutral mismatch lines, the interim visit button.
- Follow-ups re-recorded in phase 7 (`context/changes/kitchen-room/follow-ups/review-fixes.md`): F-04 4, 5, 6, 7, 12, 13,
  F1, F2/§27/§28, VO2/F5/F7, salon-load-health M-5, runtime `wrongSizes`; new: S-23 replaces the visit button and draws
  done rooms through `roomArtLoader`; house/street celebration copy and keepsake (S-23/S-24).

## 6. Autonomous decisions

- **Fixed by the maintainer (scope.md):** unchanged from the plan review (kitchen from locations-v2, one celebration, room intensity only, one room in renovation, budget measured).
- **Phase 1 stayed `Driver: tdd`;** implementation was absent, so no redirect. Stubs returning sentinels gave an assertion-red, not a missing-module red.
- **Phase 2 (impl):** manual gate skipped (no manual rows), commit message as proposed, row 2.4 left for the orchestrator's e2e. Lessons file absent.
- **Row 1.4 left unticked:** its clause includes the orchestrator's e2e run. Would change: orchestrator ticks it at its gate.
- **Skill checkpoints decided in place:** manual gate skipped (no manual rows in phase 1), commit set = the four new files + plan.md, subject taken as proposed, no next-phase question (stop after this phase). `change.md` status not touched (still `plan_reviewed`). Lessons file absent; none applied.
