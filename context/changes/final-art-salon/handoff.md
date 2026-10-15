# Handoff — `final-art-salon` (slice S-16a)

Written by the `/10x-tdd` phase 3 step: the new salon is data (stage + 6 furniture slots + 4 decor layers from the manifest), hit-testing
uses the picture rectangles, `z` and an injected alpha predicate, the room scene draws stand-in boxes on depth `z` (0-99) with controls above
(100+), three room e2e specs are rewritten (commit 200d188). The next agent must not get wrong: the e2e part of the gate was NOT run (Chromium
cannot start in this session), so the orchestrator must run the full e2e once before trusting phase 3.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | phase 1 `d5d6993`, phase 2 `bab7ad7`, phase 3 `200d188`, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (flips to `implemented` at the last phase) |
| `## Progress` | phases 1-2 ticked except `[human]` 2.5; phase 3: 3.1, 3.2, 3.3, 3.5 ticked, 3.4 open (e2e part, orchestrator) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/types.ts` | `PlacedArt`, `LayerDef`, new `SlotDef` (x/y top-left, width, height, z, anchor, visibleRect, variants = texture keys), `RoomDef { scene, decor, slots, tasks }` |
| `src/core/roomHit.ts` | `slotBox(slot)` = visibleRect in scene, `slotAt(room, chosen, point, alphaAt?)`, `holdPoint(room, chosen, id, step, alphaAt?)`; `AlphaAt`; threshold `balance.roomHit.minAlpha` 16 |
| `src/data/rooms.ts` | `SALON` (stage `renovate` 5, sofa 7, rug 9, coffee-table 10, cabinet 12, armchair 13, wall-frames 15 = 71), keys `salon/<manifest id>`, `scene` keys `salon/before|after|furnishings-before|shadows`; `LEGACY_SALON` untouched |
| `src/data/layout.ts` | `ROOM_LAYOUT.scene` (replaces `area`), `.depth {outline 100, controls 110, panel 120, celebrate 130, card 140}`, `.standIn`, `.slot {radius, holdOutline}`, `thumbs.nameHeight/nameInset`, `thumbScale` 0.13 |
| `src/data/pl.ts`, `src/data/minigames.ts` | task labels (stage "Odnów ściany i podłogę"), `slots` captions, `variants` (18 names), `decor` captions, `roomText.variant/decor`; words SOFA DYWAN STOLIK KOMODA FOTEL OBRAZKI |
| `src/ui/widgets/RoomView.ts`, `VariantPanel.ts`, `RoomDoneCard.ts`, `RoomTaskButton.ts`, `PageButton.ts`, `src/scenes/RoomScene.ts` | stand-ins on depth `z`, controls on the band, `drawStandIn`, `layerBox`; pop at `slot.z + 0.25`; `RoomSnapshot.stageDone` |
| `tests/roomHit.test.ts`, `tests/roomsData.test.ts`, `tests/wordRound.test.ts`, `tests/layout.test.ts`, `tests/roomFixtures.ts` | new/rewritten; `roomFixtures.ts` has `testSlot`, `TEST_ROOM_PARTS` for inline rooms |
| `tests/e2e/room-purchase.spec.ts`, `room-change.spec.ts`, `save-restart.spec.ts`, `support/hook.ts` | stage one tap, double tap on the stage buys once, sofa panel, hold on sofa and rug, FR-019 with 7 tasks, save/restart with stage + sofa |

## 3. Verification

| Command | Result |
|---|---|
| RED (observed) | `AssertionError: expected 'coffee-table' to be 'rug'` (transparent corner of the table; `slotAt` stub had no alpha); 5 of the alpha/holdPoint tests failed |
| lint / typecheck | pass / pass |
| unit incl. deploy tests, sample E1-E6 | Tests 2925 passed (branch baseline 2910, +15); deploy and ops scripts OK; all six samples exit 0 |
| build | pass, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session — orchestrator gate (Chromium `MachPortRendezvousServer ... Permission denied`, 3 plain tries). Branch baseline 93; no spec added, three specs rewritten, plus ONE new test (`#16 the renovation stage is bought by one tap...` in room-purchase) so expect 94 |
| Deliberate break | `slotAt` ignores the alpha predicate: 5 failed (fall-through, min alpha, holdPoint on opaque pixel); restored. Meta: predicate always 255 in the fall-through test: that test red; restored |

## 4. Next command

`/10x-implement final-art-salon phase 4`

## 5. Open

- ORCHESTRATOR: run `npx playwright test --workers=4` (expect 94 passed); if `room-purchase`, `room-change` or `save-restart` fail, the defect is in the spec (written without a browser). Likely spots: the double tap on the stage button (second tap may or may not open the sofa panel; the spec handles both), `overThumb` on the rug (point (670, 844)) in `room-change`, e2eStars 30/71 budgets.
- Tick plan row 3.4 only after that run.
- Human checklist: `[human]` 2.5 remap rule B; `[human]` 10.4 iPad playthrough. Visual rows 4.7, 5.3, 5.4, 6.4, 7.4, 8.3.
- Phase 5 must re-check `room-change` `overThumb`: with real art the rug is transparent at some pixels, `slotAt` with alpha may not hit the rug at (670, 844); pick a point from the hook (`holdPoint` with the scene's alpha) if it fails.
- Phase 5: pass `alphaAt` (from `textures.getPixelAlpha`, only on `down`) to `slotAt`/`holdPoint` in `RoomScene`; today none is passed (no textures yet). The panel tray covers the lower part of the room (sofa to y 807, armchair to 899, rug to 1065): visual gate decides.
- Docs: `docs/design-gaps.md` has no row yet for the stand-in room (phase 9 sweep); `ROOM_LAYOUT.scene.thumbScale` mini-map is a stand-in until phase 6.
- `ROOM_LAYOUT.area` and the gear-vs-room-area assertion in `tests/layout.test.ts` are gone (the room fills the scene; the gear is a HUD overlay above it).

## 6. Autonomous decisions

1. Texture keys are `salon/<manifest id>` (room-id prefix, tested), file path in phase 4 `public/assets/rooms/salon/<id>.webp`. Would change: a key clash with `TASK_ART`.
2. `slotAt` signature `(room, chosen, point, alphaAt?)`, `holdPoint(room, chosen, id, step, alphaAt?)`; hit threshold `balance.roomHit.minAlpha` 16 (soft shadow edges stay below). Would change: art with a visible semi-transparent edge.
3. Empty slots draw nothing (the old dashed outline and caption are gone); the neglected furniture belongs to `furnishingsBefore`. Would change: the maintainer wanting a hint where furniture goes.
4. Stand-ins: variants differ by fill colour AND by caption (slot name + variant name); decor shown only after the stage. `thumbScale` 0.13 so the 1920x1080 miniature fits the tile.
5. Phase kept `Driver: tdd`; scene, widgets, data, copy and e2e specs were inline scaffolding around the tested core (`roomHit`, data invariants, word fit).
6. e2e stage double tap: the spec accepts both outcomes of the second tap (panel closed or open on the sofa) and requires only that nothing more is spent.
7. `needed` stars in room-purchase raised to 5 + 7 + 9 (so a double `Wybieram` on the sofa could buy the rug twice if broken), MAX_ROUNDS 5.
