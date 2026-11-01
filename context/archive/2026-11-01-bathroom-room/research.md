---
date: 2026-11-01T15:52:30+01:00
researcher: Claude (autonomous run 2026-11-01-bathroom-polish-lab, research step)
git_commit: c208e25
branch: feat/bathroom-room
repository: vince307/Martynka-urzadza
topic: "S-31 bathroom-room: four-tile room-done card, tests pinning it, boot budget, house cell, pack manifest, rollback, house-1 last-room path"
tags: [research, rooms, RoomDoneCard, ROOM_DONE_LAYOUT, bootBudget, roomArt, house, houseCells, save, e2e]
status: complete
last_updated: 2026-11-01
last_updated_by: Claude (autonomous run 2026-11-01-bathroom-polish-lab, research step)
---

# Research: S-31 bathroom-room

**Date**: 2026-11-01T15:52:30+01:00
**Researcher**: Claude (autonomous run, research step; done in the main context without sub-agents, see handoff §6)
**Git Commit**: c208e25 (branch `feat/bathroom-room`, cut from `main` at `e451fa8`)
**Branch**: feat/bathroom-room
**Repository**: vince307/Martynka-urzadza

## Research Question

From `change.md` (§ Notes, roadmap-correction table, § Open follow-ups) and the step prompt: (1) how the "Pokój gotowy!" card can
fit four tiles at 1920×1080, with options and numbers; (2) which unit tests and e2e specs pin the card and the house-1 room list
today; (3) the boot budget with the bathroom and whether its art is booted or loaded at runtime; (4) the house cross-section cell
for the bathroom; (5) the art pack manifest of `designs/martynka-bathroom-v1`; (6) the rollback of a save with
`currentRoom: 'bathroom'` in an older build; (7) house-1-only assumptions on the "last room" path.

No `context/foundation/lessons.md` exists (checked), so no lesson applies.

## Summary

- **Card.** `RoomDoneCard.show` centres `items.length` tiles of `ROOM_DONE_LAYOUT.tiles.width` (340) with `tiles.gap` (32) inside a
  fixed `ROOM_DONE_LAYOUT.card` (left 388, width 1144). House 1 with the bathroom lists four rooms on **every** house-1 card (after
  the salon, kitchen, children's room and bathroom), because `houseRoomList` lists every known room of the house: 4×340 + 3×32 =
  1456 px > 1144. **Recommended: card width by tile count** — `width = max(1144, n·340 + (n−1)·32 + 2·30)`, centred on x 960, so
  four tiles give a card 1516 wide (left 202, right 1718) and the two- and three-tile cards stay pixel-identical (both resolve to
  1144). Tiles, miniature (0.12 → 230×130), captions, title, "Dalej" and burst centre stay as they are. It clears the HUD (which
  ends at y 148, the card starts at y 220) and the "Dom" button is hidden while the card is up (`RoomScene` `blocked`).
- **Tests that change.** Unit: `tests/layout.test.ts` ("lays the room list tiles…", pins `n` = 3 and the fixed card),
  `tests/roomsData.test.ts` (`houseRoomList` of the first house; "keeps the child in the children's room after its last task"),
  `tests/fixtureLoadPath.test.ts` (the kitchen-done fixture's house has three cells). E2E: `kids-room.spec.ts` #16 (card items, "Dalej
  stays"), `kitchen-room.spec.ts` and `rooms-as-data.spec.ts` (three `item` strings), `room-change.spec.ts` (`toHaveLength(3)`).
  No spec asserts card pixels or tile positions.
- **Boot budget.** The bathroom art is booted only while the bathroom is the room in renovation (`bootRoomArt`), otherwise loaded at
  runtime (`roomArtLoader`). Measured: 21 WebP files = 563 514 B with the script's exact `cwebp` options; boot payload 1 452 626 B
  = 29.1 s at 50 KB/s against the 48 s limit — the lightest room (salon 41.9 s is the worst case and unchanged).
- **House cell.** `upper-right` (floor 1, place 1, 1060,236, 608×342) of `HOUSE_GEOMETRY['house-1']`, free today; a row
  `{ room: 'bathroom', floor: 1, place: 1 }` in `HOUSES['house-1']` fills it. A not-yet-reached bathroom keeps the cell `closed`
  (`houseCells`), so no house e2e changes.
- **Pack.** One before/after pair, `shadowEllipses: []`, six slots with three families each, QA passed (21 source art, 18 variants).
- **Rollback.** An older build sends `currentRoom: 'bathroom'` to the salon (`repairCurrentRoom`), keeps `rooms.bathroom`
  (`repairCurrentRoom` copies `rooms`) and keeps the saved bathroom cell (`mergeHouse` appends unknown rooms); nothing is lost. No
  `deploy/README.md` line needed. Save format stays v6.
- **Last room path.** `roomInRenovation` returns null when every known room is done and `nextRoom` then keeps `currentRoom`: no
  house-1-only code found on that path. PRD FR-040 names a "house" celebration intensity, which `RoomScene` never asks for
  (it passes `'room'`); the roadmap gives the finished-house moment to S-24, so the bathroom card stays a room card.

## Detailed Findings

### 1. The room-done card and the four-tile problem

- `RoomDoneCard.show` (`src/ui/widgets/RoomDoneCard.ts`) draws the card from `ROOM_DONE_LAYOUT.card` (fixed left/width), then
  `total = items.length * tiles.width + (items.length - 1) * tiles.gap`, `first = card.left + card.width / 2 - total / 2`. The
  tile x is computed; `tiles.left` (490) is not read anywhere in `src/` (grep of `ROOM_DONE_LAYOUT` consumers: only
  `RoomDoneCard.ts` and `tests/layout.test.ts`) — kids-room follow-up 3 confirmed.
- `ROOM_DONE_LAYOUT` (`src/data/layout.ts`): `card { left 388, top 220, width 1144, height 560 }`, `title { x 960, y 262 }`,
  `tiles { top 372, width 340, height 200, gap 32, thumbTop 16, thumbScale 0.12, captionY 172, markRadius 22, markInset 28 }`,
  `button { left 735, top 624, width 450, height 108 }`; the DESIGN-GAP 204 comment states that four tiles do not fit.
- The items come from `RoomScene` → `roomsListView(houseRoomList(houseLayout(saved, HOUSES, FIRST_HOUSE), ROOMS), ROOMS, rooms)`.
  `houseRoomList` (`src/core/house.ts`) lists every known room of the house in order and a teaser only when it meets an unknown
  room. With the bathroom in `ROOMS` and in `HOUSES['house-1']`, house 1 gives four items on every card: after the salon
  `[salon done, kitchen unlocked, children locked, bathroom locked]`, …, after the bathroom four done tiles and no teaser.
- Caption widths measured with Pillow in `public/fonts/MartynkaNext.ttf` at the `bar` role (36 px, `FONT_WEIGHTS.bar` 650, values
  at 600/700): "Pokój dziecięcy" 257–261 px, "Łazienka" 150–152, "Laboratorium" (S-33) 223–227, "Wkrótce" 135–139. The widest
  caption needs a tile of at least ~280 px for visible padding.
- Overlap check for a wider card: HUD rects in `HUD_LAYOUT` end at y 148 (speaker, room switch at top 44, height 104) and
  `TASK_LAYOUT.starCounter` likewise (44 + 104); the gear sits at y 952–1048. The card spans y 220–780, so any card width up to
  1920 clears them. `ROOM_LAYOUT.houseButton` (1622–1878 × 172–276) would overlap a 1516 card (right edge 1718, top 220), but
  `RoomScene` hides it while the card is up (`const blocked = open || this.card` → `this.houseButton.hide()`), which is exactly
  what house-cross-section follow-up 21 wants a browser test for.

Options (all at 1920×1080, card centred on x 960):

| option | geometry | 2 / 3 tiles | caption "Pokój dziecięcy" | code touched | verdict |
|---|---|---|---|---|---|
| **A. Card width by count** | `width(n) = max(1144, n·340 + (n−1)·32 + 2·30)`; n=4 → 1516, left 202 | unchanged (1144) | 259 in 340, fits as today | `RoomDoneCard.show` reads a computed card rect; `ROOM_DONE_LAYOUT.card` gets `minWidth`/`padding` instead of `left`/`width` (or a pure helper `cardRect(n)` in `src/core/` tested in vitest) | **recommended**: no visual change to accepted cards, 202 px side margin |
| B. Fixed wider card | card left 202, width 1516 for every count | 2 tiles leave 402 px empty each side | fits | data only (`ROOM_DONE_LAYOUT.card`) | acceptable fallback (no code), but the base card (two tiles) looks sparse |
| C. Smaller tiles, one row | 4×256 + 3×24 = 1096 in the 1144 card (24 margin); miniature 0.12 = 230 wide still fits | every card changes | 259 > 256: must drop to `caption` role 32 px (≈230) | data + caption role | rejected: changes accepted cards, tight caption, smaller miniatures |
| D. Two rows (2×2) | 2×200 + 24 gap = 424 tall from y 372 → 796 > button top 624; card would grow to ~784 tall (220–1004), button to ~y 848 | layout differs by count | fits | data + row logic | rejected: crowds the bottom edge, more code |

Option A also serves S-33 (the base's three-tile card stays 1144) and any five-room house up to n = 5 (5·340 + 4·32 + 60 = 1888 <
1920; n = 6 would not fit — a trigger for a later change, not this slice).

### 2. Tests that pin the card and the house-1 room list

Unit (vitest):
- `tests/layout.test.ts` "lays the room list tiles of the 'Pokój gotowy!' card inside it and above 'Dalej'": computes
  `n = max(houseRoomList(h, ROOMS).length)` over `HOUSES`, `expect(n).toBe(3)`, then checks the tiles inside the fixed card. It fails
  as soon as the bathroom row lands (n = 4) — the guard for this slice; under option A it is rewritten against the computed card
  rect for every n in 2..4 (and the card inside `GAME_WIDTH`).
- `tests/layout.test.ts` (the test destructuring `{ button, card } = ROOM_DONE_LAYOUT`): checks `cardNext` touch size and the
  button against HUD rects; reads `card` only through destructuring — unaffected unless `card` loses its fields.
- `tests/layout.test.ts` "keeps the done mark of a room tile inside the tile and clear of the miniature": tile-relative, unaffected.
- `tests/roomDoneCardWiring.test.ts`: source guards (`catalogue[item.id]`, `this.drawRoomTile(left, room, state,`, one
  `recordFallback`, burst once) — must stay true after the edit.
- `tests/roomsData.test.ts`: "lists the salon first, then the kitchen and the children's room…" (`houseRoomList(FIRST_HOUSE, ROOMS)`
  three entries → four), "keeps the child in the children's room after its last task: Dalej stays (S-25)" (becomes: moves to the
  bathroom with an empty state), plus the per-room loops over `Object.keys(ROOMS)` that pick the bathroom up automatically.
- `tests/fixtureLoadPath.test.ts` "save-v6-kitchen-done meets the children's room": `merged.house.rooms` → four rooms; the current
  room stays `children`.
- `tests/houseCells.test.ts` "house-1 with the children's room (S-25)": uses `HOUSES` but its `doneOf` returns null for unknown ids,
  so the bathroom cell stays `closed` — unaffected.
- `tests/bootBudget.test.ts` and `tests/roomArt.test.ts`: iterate `Object.keys(ROOMS)` — pick the bathroom up automatically.

E2E (Playwright, hook build; snapshots carry `card.items`, no geometry):
- `tests/e2e/kids-room.spec.ts` #16: `card.items` equals three done rooms, no teaser, "Dalej" keeps `roomId` `children` → becomes four
  items (bathroom unlocked, not done) and "Dalej" moves to the bathroom. #2: upper-right stays `closed` (unchanged).
- `tests/e2e/kitchen-room.spec.ts` and `tests/e2e/rooms-as-data.spec.ts`: `['room:true:true', 'room:false:true', 'room:false:false']`
  → a fourth `'room:false:false'`.
- `tests/e2e/room-change.spec.ts`: `card?.items` `toHaveLength(3)` → 4 (plus an `items[3]` bathroom row if wanted).
- `tests/e2e/salon-extra-slots.spec.ts` (items[0], items[1] only), `final-art-room-done.spec.ts` (`doneMiniature` only),
  `house-cross-section.spec.ts` (cell states with unreached rooms `closed`), `hangar-module.spec.ts`, `base-cross-section.spec.ts`
  (base, two tiles): unaffected.
- No spec reads the card's rendered pixels; a four-tile fit is therefore proven by the unit layout test plus the visual gate. The
  e2e hook's `card` snapshot (`RoomSnapshot.card` in `tests/e2e/support/hook.ts`) has no rect; adding the card rect to the hook is
  optional (the plan decides).

### 3. Boot budget and art loading

- `bootRoomArt(currentRoom)` (`src/data/roomArt.ts`) boots only the current room's `roomArt`; `ROOM_ART` (all rooms) feeds the precache
  and the deploy smoke (`scripts/check-deploy.ts` `precacheCovers('room pictures', …)`), so the bathroom is covered once it has a
  `ROOM_SCENE_FILES` row. Other rooms load at runtime through `roomArtLoader` (`src/ui/roomArtLoader.ts`, per CLAUDE.md S-22).
- Measured today with the same sums as `tests/bootBudget.test.ts` (script in the session scratchpad, not committed): common payload
  (task art, UI art, font, boot sounds) 889 112 B; per room: salon 37 files 1 203 384 B → 41.85 s, kitchen 21 / 797 758 → 33.74 s,
  children 23 / 862 160 → 35.03 s, bridge 21 / 699 124 → 31.76 s, hangar 21 / 606 452 → 29.91 s; limit
  `(balance.loader.totalMs − 2000) / 1000` = 48 s.
- Bathroom: the 21 pack PNGs converted with the script's own options (`cwebp -q 85 -alpha_q 100 -m 6`, no resize, as
  `scripts/make-task-art.mjs` does for `ROOM_JOBS`) into the scratchpad = 563 514 B (before 103 048, after 67 620, shadows 4 056,
  furniture 5 786–44 934). Boot with the bathroom current: 1 452 626 B → **29.05 s**, the lightest room. The worst case stays the
  salon (41.85 s, 6.15 s headroom). Kids-room follow-up 7 (atlas) is not fired: headroom far above 2 s and the bathroom is lighter
  than the salon. `npm run art` output may differ by a few bytes only if `cwebp` differs; the plan re-measures after the real run.
- `recolourBoard: false` is correct: the pack README states the surround is `#FFF5DF` like the kitchen and children packs (the
  `ROOM_PACKS` rows of kitchen and children both carry `recolourBoard: false`).

### 4. House cross-section cell

- `HOUSE_GEOMETRY['house-1'].cells` (`src/data/houses.ts`): `upper-right` floor 1, place 1, x 1060, y 236, 608×342. `HOUSES` row
  `house-1` has salon (0,0), kitchen (0,1), children (1,0); no row names (1,1).
- `houseCells` (`src/core/houseCells.ts`): a cell is `closed` when it has no room or the room is neither current nor done; `current`
  for the room in renovation; `done` otherwise. After the bathroom row, a child before the bathroom still sees a closed upper-right
  cell; in the bathroom it is `current`; after it all four are `done`/`current`. `HouseView` draws the closed picture only for
  `closed` cells, so a finished house 1 shows no "Wkrótce" — matching PRD FR-038 (closed rooms as silhouettes with "Wkrótce": none
  remain).
- `HouseScene` / `HouseView` contain no house-1-specific branch (grep for `house-1`, `'salon'`, `upper-right` in
  `src/ui/widgets/HouseView.ts`, `src/scenes/HouseScene.ts`, `src/scenes/RoomScene.ts`: none besides generic `closed` state names).
- `backdropMode` (`src/core/backdrop.ts`) works on the given room's texture key (name `'salon'` is only the mode label), so the task
  backdrop follows the current room generically.

### 5. Art pack `designs/martynka-bathroom-v1`

- `manifest.json`: `canvas` 1920×1080, `families` natural "Naturalny" / sunny "Słoneczny" / mint "Miętowy"; `rooms.bathroom`
  label "Łazienka", `backgroundBefore` `assets/room/bathroom-before.png`, `backgroundAfter` `assets/room/bathroom-after.png`,
  `shadows` `assets/room/bathroom-shadows.png`, `shadowEllipses: []`.
- Slots `[id, label, x, y, width, height, z, anchor, visibleRect]`:

  | id | label | x | y | w | h | z | anchor | visibleRect |
  |---|---|---|---|---|---|---|---|---|
  | bathroom-tub | Wanna z zasłonką | 468 | 284 | 441 | 492 | 20 | 220,476 | 16,16,409,460 |
  | bathroom-sink | Umywalka i lustro | 943 | 291 | 313 | 478 | 25 | 156,462 | 16,16,281,446 |
  | bathroom-cabinet | Regał z ręcznikami | 1310 | 408 | 210 | 398 | 30 | 105,382 | 16,16,178,366 |
  | bathroom-rug | Dywanik | 800 | 712 | 346 | 188 | 10 | 173,172 | 16,16,314,156 |
  | bathroom-plant | Roślina | 363 | 583 | 205 | 225 | 40 | 102,209 | 16,16,173,193 |
  | bathroom-ducks | Półka z zabawkami | 1300 | 316 | 193 | 129 | 15 | 96,113 | 16,16,161,97 |

  Variant files `assets/furniture/bathroom-<slot>-{natural,sunny,mint}.png`. `qa-report.json`: `passed: true`, `failedChecks: []`,
  21 source art, 6 slots, 18 variants.
- Hit boxes (`slotBox` = `visibleRect` moved to x,y; `src/core/types.ts` says `[left, top, width, height]`): ducks 1316–1477 ×
  332–429 and cabinet 1326–1504 × 424–790 overlap by 5 px rows (y 424–429), the cabinet (z 30) wins there; ducks keep their other
  points, so `unreachableSlots` should report none (the plan's data test confirms). Plant (z 40) overlaps the tub's lower-left
  corner; the tub keeps its other points.
- Draw order from README: after background, shadows, slots by ascending `z` — what `RoomView` already does for every room.

### 6. Rollback to an older build

In `src/main.ts` the load path is `houseLayout` → `repairCurrentRoom(…, houseRoomIds(savedLayout, ROOMS), savedLayout.rooms[0].room)`
→ `mergeHouse(savedHouse, houseLayout(…))` → `nextRoom(…)`. In a build without the bathroom: `repairCurrentRoom`
(`src/core/rooms.ts`) sees an unknown `currentRoom` and returns the first room (salon) with `rooms` copied (bathroom state kept);
`mergeHouse` (`src/core/house.ts`) appends the saved bathroom cell as an extra room; `nextRoom` → `roomInRenovation` skips unknown
rooms and, with salon, kitchen and children done, returns null, so the child stays in the salon (done, change mode). Rolling
forward again finds `rooms.bathroom` intact. Same path as S-25 for `children`. No save-format change, no `deploy/README.md` line.

### 7. House 1 without a next room

- `roomInRenovation` returns null when every known room is done; `nextRoom` then keeps `session.currentRoom` (`src/core/house.ts`).
  After the bathroom, "Dalej" keeps the child in the bathroom; the mode button appears (`roomDone`) and "Dom" returns once the card is
  gone. The Hangar ships this path for the base (`tests/e2e/hangar-module.spec.ts`).
- `RoomScene` calls `celebrationView('room', …)` in both places it builds a celebration; `ANIMATION.celebration.house` exists in
  `src/data/layout.ts` (hold 1200, burst 22, keepsake true) but nothing asks for it. PRD FR-040 says completion of a room, house and
  street is celebrated by one mechanism with three intensities; FR-034 (residents) and the roadmap row S-24 (`residents-move-in`:
  FR-034, FR-040, FR-041, prerequisites S-23, S-25, S-31) carry the finished-house moment. So the PRD asks for a house celebration but
  the roadmap places it after this slice: recommended to keep `'room'` here and record it for S-24 (no new follow-up needed: S-24 is
  the trigger already).

## Code References

- `src/ui/widgets/RoomDoneCard.ts` `RoomDoneCard.show`, `drawRoomTile`, `drawTeaserTile` — tile layout from the fixed card.
- `src/data/layout.ts` `ROOM_DONE_LAYOUT`, `ROOM_TOUCH_TARGETS.cardNext`, `HUD_LAYOUT`, `ROOM_LAYOUT.houseButton`, `ANIMATION.celebration`.
- `src/scenes/RoomScene.ts` — `blocked` hides `houseButton` and `modeButton` while the card is up; `roomsListView(houseRoomList(…))`.
- `src/core/house.ts` `houseRoomList`, `roomInRenovation`, `nextRoom`, `mergeHouse`, `houseLayout`.
- `src/core/houseCells.ts` `houseCells`, `cellTap`.
- `src/core/rooms.ts` `roomsListView`, `repairCurrentRoom`.
- `src/data/roomArt.ts` `ROOM_SCENE_FILES`, `roomArt`, `ROOM_ART`, `bootRoomArt`.
- `src/data/houses.ts` `HOUSES`, `HOUSE_GEOMETRY['house-1']`.
- `src/data/rooms.ts` `KITCHEN` (one-stage shape to mirror), `CHILDREN`.
- `scripts/make-task-art.mjs` `ROOM_PACKS`, `ROOM_JOBS`, `convert`.
- `tests/layout.test.ts`, `tests/roomsData.test.ts`, `tests/fixtureLoadPath.test.ts`, `tests/bootBudget.test.ts`,
  `tests/roomDoneCardWiring.test.ts`; e2e `kids-room.spec.ts`, `kitchen-room.spec.ts`, `rooms-as-data.spec.ts`, `room-change.spec.ts`.

## Architecture Insights

- Adding a room changes every card of its house (the list is the whole house), so a room slice always edits earlier rooms' e2e card
  assertions; S-25 did the same to the kitchen specs.
- The card is the only house-size-sensitive layout; the cross-section has a fixed 2×2 cell grid from the pack.
- A computed card rect keeps data-as-tuning (`minWidth`, `padding` in `ROOM_DONE_LAYOUT`) and lets one pure function be tested for
  n = 2..5 without Phaser.

## Historical Context (from prior changes)

- `context/archive/2026-11-01-kids-room/follow-ups/review-fixes.md` items 1 (four tiles, trigger S-31), 3 (`tiles.left` unread),
  7 (atlas, measured above), 11 (house-cross-section 21: browser test of `houseButton` while the card is up).
- `docs/design-gaps.md` row 204 (kids-room): "tiles 340 wide with a 32 gap and a miniature at 0.12 on every card" — to be edited for
  the count-based card width. Rows 201, 202 are the precedent for "the pack gives labels only" copy gaps.
- S-30 (Hangar, `context/archive/2026-11-01-hangar-module/`) D3: last module, no teaser, "Dalej" stays — the pattern for D5.

## Related Research

- `context/archive/2026-11-01-kids-room/research.md` (boot budget method, save landing, house cell).

## Open Questions

- Product (ours, `[human]`): option A vs B for the card — A recommended (accepted 2/3-tile cards unchanged). Costs (D3) and wording
  (new gap row after 204) are the plan's, as change.md says.
- Whether finishing the bathroom (house 1 complete) should already use the `'house'` celebration intensity (PRD FR-040) — roadmap
  places it in S-24; recommended: no.
