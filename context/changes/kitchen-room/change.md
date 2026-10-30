---
change_id: kitchen-room
title: Kitchen, the second room from data, with the parameterised room celebration
status: preparing
created: 2026-10-31
updated: 2026-10-31
archived_at: null
---

## Notes

Roadmap slice S-22 (milestone M-03 `ulica-i-domy`), second slice of run 2026-10-30-rooms-kitchen, branch
`feat/kitchen-room` cut from `main` at `942e237` (merge of #117, F-04 `rooms-as-data` shipped). Outcome (roadmap): after
finishing the salon the child sees the room celebration (full reveal, star burst, at most one narrator sentence, one
"Dalej") and moves to the kitchen, which she furnishes like the salon: walls and floor first, then pieces with 3
variants for stars, in the order of the room data; one room in renovation at a time. PRD refs: FR-033 (a room works
like the salon, from data; the next room opens after the previous one is done), FR-035 (stars stay the only currency,
nothing furnished disappears), FR-040 (one celebration mechanism with an intensity parameter; this slice uses the room
intensity only), US-02 (furnishing for stars, "Pokój gotowy!" after the last task).

The measure of F-04 is this slice: adding the kitchen should be data (`src/data/rooms.ts`, `src/data/roomArt.ts`
`ROOM_SCENE_FILES`, `src/data/pl.ts`), one row of `ROOM_PACKS` in `scripts/make-task-art.mjs` and the WebP files. Code
work is expected only where F-04 left a named follow-up: the runtime move to the next room after "Dalej", the
celebration, per-room copy on the parent lines, and the boot budget (see below: it fails).

## Roadmap claims re-verified against the repo (branch `feat/kitchen-room` at `942e237`)

| roadmap claim (S-22, plan time) | repo now | correction |
|---|---|---|
| Prerequisite F-04: rooms are data, the save carries the house | Shipped (#117). `SAVE_VERSION` 5 (`src/core/save.ts`) with `house: HouseState`; `HOUSES` (`src/data/houses.ts`) already lists `house-1` = salon (0,0) + **kitchen (0,1)**; `houseRoomList` (`src/core/house.ts`) turns the first unknown room into a teaser, so today the card shows salon + "Wkrótce" | confirmed. The kitchen cell is already in the house data; S-22 only has to make `kitchen` a known room (`ROOMS`) |
| "dziecko po „Pokój gotowy!” ... przechodzi do kuchni" | `nextRoom` (`src/core/house.ts`) runs only at load in `src/main.ts` (after `mergeHouse`); `RoomDoneCard`'s "Dalej" callback in `RoomScene.create` only clears `card`/`cardDrawn` and redraws the same room; `currentRoom` never changes at runtime | real gap (F-04 follow-up 2): wire `nextRoom` (or `roomInRenovation`) after "Dalej", write `REGISTRY_KEYS.rooms`/`currentRoom`, flush the save, redraw the new room. Today, with a kitchen in `ROOMS`, a finished salon would move to the kitchen only on the NEXT launch |
| Celebration: full reveal, star burst, one narrator sentence, one "Dalej" (FR-040) | `RoomDoneCard` (`src/ui/widgets/RoomDoneCard.ts`) is a card OVER the room (title `pl.room.done.title`, a tile per room with a miniature, teaser, "Dalej"); `RoomScene.showCard` plays the `room-done` cue and speaks `pl.room.done.spoken` when auto-read is on; the purchase `starBurst` already exists (`src/ui/widgets/starBurst.ts`, shared with the summary); no intensity parameter anywhere | real gap: one parameterised celebration (scope.md: the card becomes a celebration with an intensity parameter, not three scenes); this run uses `room` only. The reveal under `prefersReducedMotion()` is static (FR-040) |
| "elementy z 3 wariantami za gwiazdki w kolejności z danych pokoju" | `RoomDef.tasks` is ordered data; `currentTask`, `taskButtonView`, `stepPanel` are generic; slot ids are global keys of `pl.room.slots`/`variants` (`roomText`) | confirmed; kitchen slot ids are prefixed `kitchen-` in the pack, so no key collides with the salon |
| "dopóki paczka kuchni nie dotrze, kuchnia stoi na rysowanych zastępnikach i nie trafia do dziecka" | The pack HAS arrived (`designs/martynka-locations-v2`, the author consents to publishing). Stand-ins exist for a missing texture (`RoomLayer`, `drawBackdrop` in `RoomView`) | correction: the "not shipped until the pack arrives" branch is moot; the kitchen ships with its art. Stand-ins remain the missing-file fallback only |
| Unknown: which kitchen pieces are slots and which are fixed decoration | Pack inventory (below): 6 slots x 3 variants; the plants, pantry and frames are baked into the after background ("Pozostawione w architekturze rośliny i drobne detale są stałe", style-guide); the before background is a full furnished worn scene ("Stan przed jest pełnym obrazem, bez oddzielnych zniszczonych mebli", README) | resolved from the pack: `decor: []`, `worn: []`, all 6 groups are slots |
| Unknown: kitchen costs (sum vs the salon) | Salon: 12 tasks, costs 5-15, sum 129 | decided in `/10x-plan` within scope.md (5-15 per task, salon style, S-17 tunes); the kitchen has 7 tasks (stage + 6 slots), so its sum is about half the salon's |
| Risk: the pack exceeds the boot load limit ("dziś blisko granicy") | Measured now: boot payload **2 092 496 B = 41.8 s** at 50 KB/s vs limit **48 s** (`balance.loader.totalMs` 50 000 - 2 000 headroom), headroom 6.2 s = about 310 KB. (F-04's change.md quoted 1 977 856 B; the current figure includes the fox poses and boot sounds as `tests/bootBudget.test.ts` sums them.) Kitchen WebP, converted in the scratchpad with the art script's settings (`cwebp -q 85 -alpha_q 100 -m 6`, full size): **21 files, 797 758 B** -> **2 890 254 B = 57.8 s** | **the budget test FAILS with the kitchen in the boot queue** (by about 9.8 s). S-22 must decide; see decision D4. Never a silent raise of `totalMs` (scope.md) |
| Kitchen pack: before/after, 6 slots with manifest, 3 variants | Confirmed (inventory below). `shadowEllipses: []` and the `shadows` layer is "a technical empty layer" (README: contact shadows are in the furniture sprites) | correction to F-04's note "the kitchen pack carries its own `shadowEllipses`": it carries an EMPTY list, so `contactShadows: []` |
| (implicit) The kitchen backgrounds look like the salon's | Salon backgrounds have the green board recoloured to `#BCD799` by `scripts/recolour-board.py` (`BOARD_FILES` = `architecture-before/after`); the kitchen backgrounds are a diorama on a **cream** margin, no green board. `docs/designer-brief-m03.md` P3.2 orders the salon re-exported on cream to match the other rooms | do NOT recolour the kitchen (the mask guard would also refuse: cream is not the board). The visual mismatch salon green vs kitchen cream is a DESIGN-GAP until P3.2 arrives |
| Save format | v5 already carries `house`, `rooms: Record<string, RoomState>`, `currentRoom`; `validateSave` accepts any room id; `nextRoom` adds an empty kitchen state | **no migration expected** (no `SAVE_VERSION` 6). A v5 save written before S-22 with a done salon reopens in the kitchen at load through the existing `nextRoom` path |

## Kitchen pack inventory (`designs/martynka-locations-v2`, read-only)

Manifest `rooms.kitchen` (`label` "Kuchnia"), canvas 1920 x 1080, families natural / sunny / mint (labels "Naturalny",
"Słoneczny", "Miętowy").

| role | file (PNG) | px | PNG B | WebP B (estimate) |
|---|---|---|---|---|
| before (full furnished worn scene) | `assets/room/kitchen-before.png` | 1920 x 1080 | 1 998 611 | 128 376 |
| after (empty renovated architecture, plants and pantry baked in) | `assets/room/kitchen-after.png` | 1920 x 1080 | 1 684 023 | 94 156 |
| shadows (technical, empty) | `assets/room/kitchen-shadows.png` | 1920 x 1080 | 44 075 | 4 056 |

| slot id | pack label | x, y, w x h | z | anchor | visibleRect | WebP B, 3 variants |
|---|---|---|---|---|---|---|
| `kitchen-counter` | Zabudowa L | 630, 221, 653 x 434 | 20 | 327, 418 | 16, 62, 621, 356 | 183 666 |
| `kitchen-fridge` | Lodówka | 1236, 296, 166 x 347 | 25 | 83, 331 | 16, 27, 134, 304 | 33 734 |
| `kitchen-table` | Stół i krzesła | 658, 539, 446 x 377 | 40 | 223, 361 | 16, 25, 414, 336 | 151 136 |
| `kitchen-coffee` | Kącik kawowy | 1221, 575, 375 x 344 | 45 | 188, 328 | 17, 16, 342, 312 | 109 780 |
| `kitchen-bench` | Ławka w wykuszu | 440, 446, 300 x 223 | 18 | 150, 207 | 16, 35, 268, 172 | 39 446 |
| `kitchen-rack` | Naczynia | 347, 301, 200 x 354 | 10 | 100, 338 | 16, 92, 168, 246 | 53 410 |

Variants per slot: `<slot>-natural`, `<slot>-sunny`, `<slot>-mint` (files `assets/furniture/<id>.png`, every variant
the same size as its slot). Total: 3 scene + 18 furniture = **21 files, 797 758 B WebP** (PNG 6.6 MB). No decor, no
worn list, no thumbnail (`thumbnail` stays unset: the done card draws the live or drawn miniature, F-04 follow-up 3),
no task wording (the pack has piece names, not imperatives). Also in the pack, not for this slice: `maths` (a sample
counting task "Ile jest filiżanek?" with `assets/icons/cup.png`; the game already has a `cup` counting icon) and the
`studio` room (house 2, S-26).

Pack notes to carry into research: (1) the bench's `targetRect` `[16,16,168,191]` does not span its 300 x 223 file
while its `visibleRect` does; the game reads `x, y, width, height, anchor, visibleRect` only (the salon rows have no
`targetRect`), so check `slotBox`/`holdPoint` against `visibleRect` and ignore `targetRect`. (2) The bench "hides its
right end behind the counter corner on purpose" (visual-review.md): z 18 under the counter's 20; with the counter not
yet bought the bench's hidden end may show over the bare wall (check in the visual gate). (3) `composition` maps a
1672 x 941 source canvas into `[130,128,1660,934]`; the exports are already 1920 x 1080, so the game uses them as is.

## Design kit views and spec sections this change binds (profile § 6)

- Room screen and its flow: the kit's room-return view only (`pl.room.resume`); the room, task button, variant panel,
  done card and change mode are ours (DESIGN-GAP rows 12, 31-41, 105-111 in `docs/design-gaps.md`). The kitchen reuses
  every one of them unchanged; its geometry and art come from the locations-v2 manifest and assets (source of truth
  for this room, scope.md), composed like the salon (`designs/martynka-salon-v2/manifest.json` shape).
- Celebration (FR-040): **the kit has no celebration view** -> DESIGN-GAP. The pack's `screenshots/kitchen-room-*.png`
  and `preview.html` show the furnished room and the chooser, not a celebration. Built from the existing pieces
  (`RoomDoneCard`, `starBurst`, `ANIMATION`, `prefersReducedMotion`), never a new invented visual language.
- Spec: PRD FR-033, FR-035, FR-040, US-02; `Martynka-urzadza.md` section 5 (room data model) and 14 (no player text or
  balance numbers in scenes); `docs/designer-brief-m03.md` "Układ domów" (house 1: salon left, kitchen right on the
  ground floor) and P3 (kitchen intermediate stages and the salon on cream: future, not in this pack).
- Copy keys this slice binds (`src/data/pl.ts`): `pl.room.names` (add `kitchen: 'Kuchnia'`, the manifest label;
  note the comment "Room names are lower case in data" vs `salon: 'Salon'`, settle in research),
  `pl.room.slots` (the 6 nominative captions; the manifest labels are capitalised display names, lower-case them like
  the salon's), `pl.room.variants` (manifest family labels, gender agreement with each slot noun is a teacher-read item:
  "Zabudowa ... Naturalna"? the pack uses the neuter-free family label "Naturalny" for every slot), `pl.room.tasks`
  (6 new imperatives + the shared `renovate` "Odnów ściany i podłogę"), `pl.room.done.title` / `spoken` (celebration
  line, room intensity), `pl.settings.roomMismatch` and `pl.saveTransfer.roomMismatch` ("Stan salonu ...", F-04
  follow-up 1: a second room needs its own or a room-neutral line).
- DESIGN-GAP candidates (rows go to `docs/design-gaps.md`, next number **175**): kitchen task imperatives and slot
  captions (the pack has names only); the celebration view and its room-intensity reveal; the kitchen tile on the done
  card without a pack thumbnail; salon green board vs kitchen cream margin (until brief P3.2); room-neutral mismatch
  lines.

## Migration

None expected. Save format stays **v5** (`SAVE_VERSION` 5): the house, its cells (salon (0,0), kitchen (0,1)) and the
room map are already saved; the kitchen's state is an ordinary `RoomState` keyed `kitchen`, created empty by
`nextRoom`. Frozen fixtures v1-v5 must still load unchanged; a test should prove that a v5 save with a done salon and
no `kitchen` key opens in the kitchen. Would change: research finding a field the celebration or the move must persist
(e.g. "celebration already shown" across a reload) that cannot be derived from `rooms` + `house`; then that is a v6
decision with a `[human]` row, not a silent addition.

## Open follow-ups triggered by this slice

| follow-up (source) | trigger | take |
|---|---|---|
| 1 "Stan salonu" mismatch lines (rooms-as-data) | S-22 | **in scope**: room-neutral or per-room wording of `pl.settings.roomMismatch` / `pl.saveTransfer.roomMismatch` (teacher read, gap row) |
| 2 wire `nextRoom` after "Dalej" (rooms-as-data) | S-22 | **in scope**: the core of the outcome |
| 3 room without a pack thumbnail shown through the `drawn` miniature (rooms-as-data) | S-22 kitchen tile | **in scope** as a visual-gate check; code only if it looks wrong |
| 4 `salon-before` thumbnail not converted; salon thumbnail and loading background show curtains (rooms-as-data, final-art-p2, salon-style) | S-22 kitchen tile shown not done | fires only if a not-done room appears as a tile. With the move after "Dalej" the kitchen tile shows NOT done on the salon's card. It uses the live/drawn miniature (no thumbnail), not `salon-before`; **re-record** unless the gate finds it wrong |
| 5 texture atlas and boot budget (rooms-as-data; final-art-salon, final-art-p2, salon-extra-slots, salon-style § 35) | S-22 `tests/bootBudget.test.ts` fails / a second room | **fires (measured: fails by ~9.8 s)**. Atlas is the heavy option (packer, `ArtImage` changes); see D4 for the chosen direction. Atlas re-recorded unless research picks it |
| 6 M-6 second half, service-worker install warning (rooms-as-data, salon-load-health, salon-style § 32) | the next change to the room art set | **fires**; small (a `console.warn` in `registerServiceWorker`); in scope if cheap, else re-record with the reason |
| 7 F3 / M-R5 throw when the room panel is open and the placeholder is missing (rooms-as-data, save-observability-c1-c2) | S-22 celebration / second room | **fires**; research decides (the celebration rewrite touches `redraw`); default in scope as a small guard |
| 14 `RoomDoneCard.show` `mode` only from the current room's tile (rooms-as-data impl-review F4) | S-22 second real room on the card | **fires, in scope**: with two rooms the reported miniature mode must follow the current (or celebrated) room deterministically |
| 12 / F5, F7, VO2 one `Box` helper, one stand-in drawer, overlapping stand-in labels (final-art-salon, salon-extra-slots, salon-style § 29) | a second room or the next change to `RoomView.render` | **fires on "a second room"**; out of scope unless the plan edits `RoomView.render` (data-only kitchen should not need it). Re-record with trigger "the next change to `RoomView.render`" |
| 13 / L-R8 `stepPanel` refusals; L-R11 `celebrate`/`onSleep` (save-observability, salon-extra-slots, salon-style § 31) | the next change to `RoomScene` | **fires** (the "Dalej" wiring and celebration edit `RoomScene`). L-R11 `onSleep` was folded in salon-style; the celebration's new tweens/emitter must be stopped on sleep (in scope as part of the new code). L-R8 out of scope (purchase unchanged), re-record |
| final-art-salon F1 stage cross-fade ghosts on sleep | the next change to `RoomScene.fadeStage` | not fired unless the kitchen needs a `fadeStage` change (expected not: same single stage) |
| final-art-salon F2, salon-extra-slots F2, salon-style § 27/28, audit-art-renderer § 7 (`drawRoomMiniature`: stand-in depth, curtains clip, worn stand-ins, grade boolean) | the next change to `drawRoomMiniature` | fires only if the kitchen tile needs a miniature change; default re-record |
| salon-load-health M-5 e2e of a purchase under `writefail` | a change to the purchase flow in `RoomScene` | not fired (purchase unchanged) |
| notebook-polish wake/sleep | the next change to `RoomScene` wake and sleep handling | fires only if the move to the kitchen needs wake handling (e.g. `SalonBackdrop` refresh on wake shows the new current room); research checks |
| audit-art-renderer § 2 `make-task-art.mjs` runs Python without `-I` | the next change to `scripts/make-task-art.mjs` | **fires** (the `ROOM_PACKS` row); trivial fix (`python3 -I`), in scope |
| salon-style § 39 / audit-backdrop-fox: `SalonBackdrop` follow-ups | the next change to `SalonBackdrop` | fires only if the backdrop must show the kitchen differently; it already renders `currentRoom` |
| GRD-09, S13-06, SV2-13, E2E on two builds, F-04 15 (frozen `copyOfHouseV5`) | v6 / the next change to `src/core/migrations/` | not fired (no migration) |
| F-04 11 kids' room id and closed cells | S-25 / S-23 | not fired |

## Autonomous decisions

- **D0 Scope (fixed by the maintainer, scope.md).** The kitchen comes from `designs/martynka-locations-v2` (manifest
  room `kitchen`: before/after, shadows, 6 slots x 3 variants, families natural/sunny/mint), converted to WebP in
  `public/assets/rooms/kitchen/` by `npm run art` through a `ROOM_PACKS` row; never invented slots or art; the author
  consents to publishing. One parameterised celebration (FR-040), this run uses the room intensity only. One room in
  renovation at a time: the kitchen opens only after the salon is done. No balance change except the kitchen's own
  costs (5-15 per task, salon style). Boot budget measured with `tests/bootBudget.test.ts`; a raise is a recorded
  decision with a `[human]` row, never silent. Recorded as fixed. Would change: a new maintainer instruction.
- **D1 Kitchen content from the pack: 6 slots, no decor, no worn list, no contact shadows, no thumbnail.** Chosen:
  `decor: []`, `worn: []`, `contactShadows: []`, `thumbnail` unset, scene files `kitchen-before/after/shadows`.
  Rejected: inventing decor layers or worn pieces (nothing in the pack; scope forbids invention); recolouring the
  cream margin to the salon green (the brief P3.2 goes the other way, and `recolour-board.py`'s mask guard would
  refuse). Why: the README and style guide say the before state is one full picture, plants are architecture, contact
  shadows live in the sprites. Would change: a pack revision with separate worn pieces or a thumbnail, or the
  maintainer asking for the green board on every room.
- **D2 Task order = the pack's slot order after the stage.** Chosen (proposal for `/10x-plan`): stage "Odnów ściany i
  podłogę", then counter, fridge, table, coffee corner, bench, rack (manifest order, big built-ins first). Rejected:
  re-ordering by z. Why: the manifest order is the designer's; the plan may still swap to keep the bench after the
  counter (it tucks behind it). Would change: the visual gate showing a hidden end of the bench before the counter.
- **D3 No save-format change.** Chosen: stay on v5. Rejected: a v6 "celebration shown" flag. Why: `roomDone` +
  `nextRoom` derive everything; a reload after the last purchase but before "Dalej" opens straight in the kitchen
  (the celebration is not replayed, acceptable: nothing is lost, FR-035). Would change: research showing the child can
  lose the celebration in a common path (e.g. the tab sleeping during the card) and the maintainer wanting it replayed.
- **D4 Boot budget: do not raise `totalMs`; research must pick a way to keep the kitchen out of the cold boot
  payload or under it.** Measured: 57.8 s vs a 48 s limit. Candidates for `/10x-research`: (a) the boot queue loads the
  art of the room in renovation and of done rooms the child can see, and a newly opened room's art loads when it opens
  (the precache still covers every file offline, so `precacheCovers` and the deploy smoke stay whole; CLAUDE.md's "every
  asset must be loaded at start" is about precache coverage and no lazy JS chunks); (b) downscaling the kitchen
  backgrounds/large pieces; (c) a texture atlas (heavy, follow-up 5); (d) raising `totalMs` with a `[human]` row (last
  resort, scope.md). Leaning: (a), because the house will keep growing (S-25, S-26) and every room is about 0.8-1.5 MB,
  so a per-room load is needed anyway and a raise would only postpone it. Rejected now: deciding the mechanism before
  research reads `BootScene.preload`, `bootQueue`, `loaderCut`, `artHealth` and the miniature's texture needs. Would
  change: research finding that a runtime load breaks the art-health lines or the stand-in path in a way that costs
  more than the slice, then (b) or (d) with a `[human]` row.
- **D5 Celebration as a parameter of the existing done card.** Chosen (direction for research/plan): one widget and one
  pure view rule taking an intensity (`'room' | 'house' | 'street'`, only `'room'` reachable), built from `RoomDoneCard`,
  `starBurst` and the existing cue/narrator path; the reveal is static under `prefersReducedMotion()`. Rejected: a new
  scene; three widgets. Why: scope.md and FR-040. Would change: research showing the card cannot do a "full reveal"
  of the room without hiding the room list, in which case the plan picks reveal first, then the list, still one "Dalej".
- **D6 Next step is `/10x-research`, not the skill's default `/10x-plan`.** Fixed by the step prompt; also warranted by
  D4 (boot path) and the runtime room move. Would change: nothing in this run.
- **D7 Title.** No intent text was given; the title is written from the roadmap outcome. Would change: nothing.
- **Lessons file:** `context/foundation/lessons.md` does not exist; none applied.
