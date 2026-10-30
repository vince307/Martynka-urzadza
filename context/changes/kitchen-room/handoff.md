# Handoff — `kitchen-room` (slice S-22)

Written by the `/10x-tdd kitchen-room phase 3` step of run 2026-10-30-rooms-kitchen (2026-10-31). Phases 1-3 are committed (3412b6e, 9deb86d, f5f8904); the plan has 8 phases. The next agent must not get this wrong: **`RoomArtLoader.refreshHealth(room)` is a no-op
while `room` is pending in `roomArtLoader` (plan review F1) — "Obrazki" must never list a room still loading — and the
boot loads ONE room (`bootRoomArt(currentRoom)`) with `balance.loader.totalMs` unchanged at 50 000.**

## 1. State

| | |
|---|---|
| Branch | `feat/kitchen-room` |
| Commits | `3412b6e` (p1), `9deb86d` (p2), `f5f8904 feat(kitchen-room): The runtime room-art loader on the HUD loader (p3)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows | 3.1-3.3 ticked with sha; 3.4 left (e2e clause belongs to the orchestrator) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/roomArtLoader.ts` | `createRoomArtLoader(game, {disabled, entriesOf?})`: `attachLoader`, `ensure(rooms)`, `pending()`, `refreshHealth(currentRoom)`; type `RoomArtLoader`, `RoomLoadState` |
| `src/data/layout.ts` | `REGISTRY_KEYS.roomArtLoader`, `REGISTRY_KEYS.roomLoad` (runtime, not in SAVE_KEYS) |
| `src/main.ts`, `src/scenes/UIScene.ts` | service created in preBoot (`disabled` on `?e2eArt=room`); attached to the HUD loader beside the sound service |
| `src/testing/e2eHook.ts` | top-level snapshot field `roomLoad` (pending, settled) |
| `tests/roomArtLoader.test.ts` | 7 tests, fake loader and cache, literal key lists |

## 3. Verification

| command | result (observed) |
|---|---|
| RED | service stub: `AssertionError: expected [] to deeply equal [ 'b/two', 'b/three' ]` (6 of 6 behaviour cases red) |
| GREEN | `tests/roomArtLoader.test.ts` 7 passed |
| Break timeout | drop `xhrSettings.timeout` -> per-file-limit case red |
| Break complete | settle without `resolved()` -> "complete caused by another file" case red |
| Break listener | drop `off('loaderror')` -> "removes its listeners" case red |
| Break F1 | drop pending check in `refreshHealth` -> pending-health case red; each confirmed changed (cmp with the original) and restored |
| Meta-check | loader and cache are the test's own fakes; oracles are literal key lists of a synthetic room |
| lint / typecheck / build | OK / OK / OK, `e2e hook: absent (2 chunks checked)` |
| unit | 4033 passed = 4026 + 7; deploy, ops scripts OK; sample E1-E6 OK |
| e2e | `salon-art.spec.ts` 4 passed (workers=1); full suite is the orchestrator's |

## 4. Next command

`/10x-implement kitchen-room phase 4`

## 5. Open

- Phase 4 uses `REGISTRY_KEYS.roomArtLoader` (`ensure(cardRooms(...))` when the card opens, `refreshHealth(currentRoom)` after a room switch) and `roomLoad` for tile loading (`tileLoading`).
- Settle rule: a room settles on a `complete` only when each of its keys is in the texture cache or failed (keyed `loaderror`); an unrelated `complete` re-arms `once('complete')`. A decode failure is assumed to raise `loaderror` through Phaser's `nextFile(false)`, not browser-verified.
- Manual Progress rows (human checklist): 4.5 [visual] celebration on the salon (one room); 5.6 [reviewer] teacher read of the kitchen copy; 5.7 [reviewer] kitchen geometry vs `designs/martynka-locations-v2/manifest.json`; 5.8 [human] S-17 tunes kitchen costs; 7.6 [visual] eight-state matrix at 1440 + 1024; 7.7 [human] accept the interim "Salon"/"Kuchnia" visit button until S-23; 7.8 [human] salon green board vs kitchen cream margin; 7.9 [human] offline tablet check of the runtime kitchen load; 7.10 [reviewer] CI job `check`.
- Phase 6 placement risk: the bottom bar is full; `ROOM_LAYOUT.visitButton` must pass the extended `tests/layout.test.ts` overlap check.
- Known risks in plan.md: runtime loads skip `wrongSizes` (the loader passes a no-op size reader, F5); a visited done room is not judged by "Obrazki"; shared HUD loader listeners are keyed (F6).
- e2e specs that change in phase 5: `tests/e2e/rooms-as-data.spec.ts`, `tests/e2e/room-change.spec.ts`, `tests/e2e/salon-extra-slots.spec.ts`.
- DESIGN-GAP rows from 175 (phase 7); follow-ups re-recorded in phase 7 (`context/changes/kitchen-room/follow-ups/review-fixes.md`).

## 6. Autonomous decisions

- **Fixed by the maintainer (scope.md):** unchanged from the plan review (kitchen from locations-v2, one celebration, room intensity only, one room in renovation, budget measured).
- **Phase 3 stayed `Driver: tdd`;** the service was absent. Stub first (no-op methods) gave assertion-red.
- **Contract refinement:** `RoomArtLoaderOptions.entriesOf` (default: the room table) added so the test uses a synthetic room; "complete from another file" keeps the room pending (re-armed `once`), per the plan's wording, instead of settling it failed.
- **Skill checkpoints decided in place:** no manual rows in phase 3 (gate skipped), commit set = the six code/test files + plan.md, subject as proposed, stop after this phase. Row 3.4 left for the orchestrator's e2e. Lessons file absent.
- Phases 1-2 decisions: unchanged (row 1.4 and 2.4 left for the orchestrator's e2e).
