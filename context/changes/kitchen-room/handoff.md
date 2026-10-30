# Handoff — `kitchen-room` (slice S-22)

Written by the `/10x-tdd kitchen-room phase 1` step of run 2026-10-30-rooms-kitchen (2026-10-31). Phase 1 is committed (3412b6e); the plan has 8 phases. The next agent must not get this wrong: **`refreshHealth(room)` is a no-op
while `room` is pending in `roomArtLoader` (plan review F1) — "Obrazki" must never list a room still loading — and the
boot loads ONE room (`bootRoomArt(currentRoom)`) with `balance.loader.totalMs` unchanged at 50 000.**

## 1. State

| | |
|---|---|
| Branch | `feat/kitchen-room` |
| Commits | plan-review state + `3412b6e test(kitchen-room): Celebration view and room-load rules (p1)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` is not yet set by this step (unchanged: `plan_reviewed`) |
| `## Progress` rows remaining | 39 (1.1-1.3 ticked with sha; 1.4 left: its e2e clause belongs to the orchestrator) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/celebration.ts` | `celebrationView`, `CelebrationIntensity`, `CelebrationSpec`, `CelebrationView` |
| `src/core/roomLoad.ts` | `cardRooms`, `roomsToLoad`, `tileLoading` |
| `tests/celebration.test.ts`, `tests/roomLoad.test.ts` | 3 + 6 tests, literal oracles |
| `context/changes/kitchen-room/plan.md` | rows 1.1-1.3 ticked with `3412b6e` |

## 3. Verification

| command | result (observed) |
|---|---|
| RED (stubs returning sentinels) | 9 failed, first: `AssertionError: expected { intensity: 'room', ...(3) } to deeply equal` (revealMs -1 vs 700); `expected [ '?' ] to deeply equal [ 'a', 'b' ]` |
| GREEN | 9 passed |
| Deliberate break 1 | `revealMs: spec.holdMs` (reducedMotion ignored; grep confirmed the edit) -> `is a static reveal with no burst under reduced motion` red; restored |
| Deliberate break 2 | `if (pending.has(room)) continue;` removed (grep count 0) -> `skips a room already pending` red; restored, 9 green |
| Meta-check | oracles are literal tables and id lists in the tests; the breaks fail only the matching case |
| lint / typecheck | OK / OK |
| unit | `npm test`: 4023 passed (215 files) = baseline 4014 + 9; deploy and ops scripts OK; sample E1-E6 OK |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not run (orchestrator) |

## 4. Next command

`/10x-implement kitchen-room phase 2`

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
- **Row 1.4 left unticked:** its clause includes the orchestrator's e2e run. Would change: orchestrator ticks it at its gate.
- **Skill checkpoints decided in place:** manual gate skipped (no manual rows in phase 1), commit set = the four new files + plan.md, subject taken as proposed, no next-phase question (stop after this phase). `change.md` status not touched (still `plan_reviewed`). Lessons file absent; none applied.
