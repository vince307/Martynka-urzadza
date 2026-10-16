# Handoff — `salon-extra-slots` (slice S-16d)

Written by the phase 3 `/10x-tdd` step of autonomous run `2026-10-15-fix-s16bcd`: phases 1-3 are implemented (phase 3 = the content: 11 slots, 12 tasks, copy, art, boot limit). The next agent must not get this wrong: phase order is load-bearing (phase 1 `holdPoint` clip and phase 2 render wiring before phase 3 adds the curtains and moves the decor), and `SALON_V3_TARGET`, `LEGACY_SALON_V2` and `tests/fixtures/` stay byte-identical.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-extra-slots` |
| Commits | p1 4ac1460, p2 12202f6, p3 `feat(salon-extra-slots): pięć nowych miejsc w salonie (p3)` 0bc3fec, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| Progress rows | phases 1-2 e2e rows 1.4, 2.2 ticked (orchestrator note: 117 passed after 12202f6); phase 3: 3.1-3.4 ticked; 3.5 (e2e, orchestrator), 3.6 ([reviewer]), 3.7 ([visual]) open |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/rooms.ts` | decor = `plant-right`; 11 slots (curtains, wall-shelf, lamp-table, plant-left, pouf added; last three `shownBeforePurchase: 0`); 12 tasks (+ hang-curtains 8, hang-shelf 10, swap-lamp 12, swap-plant 13, swap-pouf 15) |
| `src/data/pl.ts` | five task labels, captions, variant names; `decor` = `plant-right` only |
| `src/data/balance.ts` | `loader.totalMs` 50000, comment recomputed (2 329 739 B, 46.6 s) |
| `scripts/make-task-art.mjs`, `public/assets/rooms/salon/` | room read from salon-v2; 38 WebP (12 new, 2 architecture files changed) |
| `tests/roomsData.test.ts`, `roomArt`, `roomMiniature`, `legacySalonMigration` | changed on purpose + M-R4 order pin, default-look pin, `curtains` named exception, v3-curtains decode, lifted-v2 no curtains |
| `tests/e2e/{salon-art,room-change,final-art-room-done}.spec.ts` | `health.total` 38; `setTimeout` 180 s |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | clean |
| Unit | 3074 passed = branch baseline 3070 + 4 (M-R4 order, default-look pin, v3 curtains decode, lifted v2 no curtains) |
| RED | first assertions: `expected [ 5, 7, 9, 10, 12, 13, 15 ] to deeply equal [ Array(12) ]` (costs), `expected [] to deeply equal [ 'lamp-table', 'plant-left', 'pouf' ]` (default look), `expected [ Array(26) ] to have a length of 38` (art); 8 red in total before data and art |
| Deliberate breaks | swap hang-curtains/hang-shelf -> M-R4 red; `pouf` without `shownBeforePurchase` -> `expected [ 'lamp-table', 'plant-left' ] to deeply equal [ 'lamp-table', 'plant-left', 'pouf' ]`; curtains y -700 -> `curtains: expected -352.5 to be greater than or equal to 0`; all restored. Meta-check: prove data and files only, not drawing (phases 6-8) |
| `npm run art` twice | second run no diff; changed: the two architecture files, 12 added; room folder 1 489 688 B in 38 files (as the plan measured) |
| deploy scripts, `sample` E1-E6, build | pass; `e2e hook: absent (2 chunks checked)`; `dist/sw.js` lists `curtains-leaf.webp` |
| `git diff --name-status main -- tests/fixtures src/core/migrations` | empty |
| e2e | not runnable in this session - orchestrator gate (Chromium MachPortRendezvous Permission denied). Expected affected specs: `salon-art` (38 pictures; the stand-in/count test), `room-change`, `final-art-room-done` (12 purchases), and any spec that buys the whole salon or counts tasks (`room-purchase`, `save-restart`, `save-transfer`, `review-round`, `final-sound` read `tasksDone`/`SALON.tasks`) |
| Teacher read | labels: "Powieś zasłony", "Powieś półkę", "Wymień lampę", "Wymień roślinę", "Wymień pufę" (imperative + accusative, correct); captions nominative zasłony, półka, lampa, roślina, pufa; variants from the pack; "Salon: 7 z 12" reads correctly; `sample` E1 content unchanged |

## 4. Next command

`/10x-tdd salon-extra-slots phase 4` (phase 4, `Driver: tdd`)

## 5. Open

- Rows 3.5 (orchestrator e2e), 3.6 ([reviewer]), 3.7 ([visual]) and earlier 1.5, 2.4 ([reviewer]) open. Human decisions and phase 5 follow-ups unchanged from the plan.

## 6. Autonomous decisions

1. `EXPANSION` constant removed from `scripts/make-task-art.mjs` (no job reads expansion-v1 any more; the existence check covers KIT and SALON_V2). Would change: a later job needing expansion-v1.
2. `plant-right` was the only decor, so its caption stays in `pl.room.decor`; the stale "minigame words" comment on `pl.room.slots` was replaced.
3. In the "inside the scene" test the curtains exception is by id `curtains` with the half-height rule. Would change: a second room with a piece above the scene.
4. Earlier decisions of p1/p2 unchanged.
