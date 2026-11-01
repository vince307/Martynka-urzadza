---
change_id: hangar-module
title: Hangar z rakietą, drugi moduł bazy
status: preparing
created: 2026-11-01
updated: 2026-11-01
archived_at: null
---

## Notes

Roadmap S-30 (M-03, Stream D „Baza kosmiczna”), PRD FR-047. Autonomous run `2026-10-31-space-base`, branch
`feat/hangar-module` cut from `main` at `a4a0aee` (S-29 merge). Outcome: a child with the space base, after Mostek,
renovates the Hangar with the rocket (walls and floor, then rocket, rover, workbench, crates, lamp and mat in 3 variants
each); adding the module is building data plus art files, and the base cross-section shows it in its second cell.

No lessons file exists in `context/foundation/` (checked at this step), so no lesson is applied.

The roadmap Risk is the point of this slice: if adding the Hangar needs code outside data and art, S-28/S-29 broke the
"a module is a room" contract. Research must list every non-data file the plan touches and justify each.

## Roadmap claims re-verified against the repo (branch `feat/hangar-module` at `a4a0aee`)

| roadmap claim (S-30, plan time) | repo now | correction |
|---|---|---|
| Prerequisite S-29 (base cross-section) | Shipped (#128, archived `context/archive/2026-11-01-base-cross-section/`). `HOUSE_GEOMETRY['base-1']` (`src/data/houses.ts`) has the four cells of the pack, `houseArtKeys` filters `HOUSE_ART` per building, `pl.house.open['base-1']` = „Baza” | confirmed |
| „przekrój bazy pokazuje go w drugiej komórce” | `HOUSES` has `base-1` = `[{ room: 'bridge', floor: 0, place: 0 }]`; cell `ground-right` (floor 0, place 1, 1060,636, 608×342) exists in `HOUSE_GEOMETRY['base-1']` and is drawn as the closed airlock today | confirmed: one data row `{ room: 'hangar', floor: 0, place: 1 }` in `HOUSES` (D2) |
| „dodanie modułu to dane budowli i pliki grafiki” | Kitchen precedent (S-22): a room = a `RoomDef` in `src/data/rooms.ts` + `ROOMS` entry, a row in `ROOM_SCENE_FILES` (`src/data/roomArt.ts`), a row in `ROOM_PACKS` (`scripts/make-task-art.mjs`), copy in `pl.room.{names,tasks,slots,variants}`; `ROOM_ART`, the precache, `precacheCovers`/`roomArtCheck` of the deploy smoke and `tests/bootBudget.test.ts` (`it.each(Object.keys(ROOMS))`) derive from `ROOMS` | confirmed for the data path; the art script needs a new pack root constant (`designs/bystrow-space-base-v2`, today only v1 is named `SPACE_BASE`/`SPACE`). Expected non-data touches: tests that pin `base-1` as one room (gap 196 behaviour), nothing in scenes — research verifies |
| Content: „ściany i podłoga, potem rakieta, łazik, stół z narzędziami, skrzynie, lampa i mata w 3 wariantach” | Pack `designs/bystrow-space-base-v2/manifest.json` `rooms.hangar`: `hangar-before/after/shadows` 1920×1080 and 6 slots × 3 families (natural, sunny, mint): `hangar-rocket` „Rakieta”, `hangar-rover` „Łazik księżycowy”, `hangar-workbench` „Stół warsztatowy”, `hangar-crates` „Skrzynie z częściami”, `hangar-lamp` „Lampa warsztatowa”, `hangar-mat` „Mata startowa”, each with x, y, width, height, z, anchor, visibleRect; `shadowEllipses: []`; no decor, no worn look | confirmed; the roadmap's „stół z narzędziami” is the pack's „Stół warsztatowy” (pack name wins for the caption). Geometry copied slot by slot as for `bridgeSlots` |
| Blockers: „paczka `bystrow-space-base-v2` gotowa (QA 175/175)” | Present: `assets/room/` 3 PNG (3.5 MB), `assets/furniture/` 18 PNG (2.2 MB), `qa-report.json`, `screenshots/base-with-two-modules.png`, `references/` (copies of v1 shell, airlock, Mostek: not new art) | confirmed. Board: the backgrounds' corners and edges are cream `#FFF5DF` like `bridge-after` → `recolourBoard: false` (kitchen/bridge rows are the model) |
| Unknown „Ceny Hangara (jak Mostek: suma ok. 100 gwiazdek?) i która komórka przekroju” (Block: no) | Mostek `BRIDGE.tasks` costs 6/10/13/14/17/19/21 = 100 (FR-044, gap 194); pack README: „Pełną scenę skaluj … do 608×342 w (1060,636). Mostek zajmuje (252,636).” | decided: D1 (costs), D2 (cell) |
| Follow-up „luka 196 … z Hangarem „Dalej” po Mostku prowadzi do niego” | `houseRoomList` (`src/core/house.ts`) lists known rooms of the house in order; `nextRoom` → `roomInRenovation` picks the first not-done known room. With `hangar` in `HOUSES['base-1']` and `ROOMS`, the Mostek card shows two tiles (Mostek, Hangar) and „Dalej” moves to the Hangar with no code change (kitchen precedent) | confirmed mechanism; gap 196 does not close, it moves: the Hangar is now the base's last module (D3) |
| (implicit) existing base children | A v6 save of a base child holds `house` `{ id: 'base-1', rooms: [bridge] }`; the load path rebuilds the layout from data (`houseLayout`, `mergeHouse` keeps saved extras), so the Hangar appears; a child who finished Mostek before S-30 opens in the Hangar at load through `nextRoom` (same as a finished salon opened in the kitchen after S-22) | confirmed; research pins it with a test on a v6 base fixture (Mostek done) |
| (implicit) boot budget | Boot loads only the room in renovation (`bootRoomArt`); `tests/bootBudget.test.ts` iterates `ROOMS`, so the Hangar is checked automatically. Source PNGs are 5.7 MB vs Mostek's (WebP today 848 KB) | risk: Hangar WebP may be the heaviest room; research measures after `npm run art`. Atlas follow-up fires only if the budget test fails or headroom < 2 s |
| (implicit) save format | v6 carries `house`, `rooms`, `currentRoom`; a new room is data (S-22 kitchen added a room to `house-1` with no version bump, v5 stayed) | **no migration expected** (see Migration) |

## Design kit views and spec sections this change binds (profile § 6 + the space-base packs)

| source | what it binds |
|---|---|
| `designs/bystrow-space-base-v2/manifest.json` (`rooms.hangar`) | scene files `backgroundBefore`/`backgroundAfter`/`shadows`; six slots with id, x, y, width, height, z, anchor, visibleRect and three variant files each; labels (captions) |
| `designs/bystrow-space-base-v2/README.md` § Pliki i integracja | draw order (background, shadows, sprites by z ascending), x/y = top-left of the PNG; Hangar scaled whole into ground-right 608×342 at (1060,636); „Nie nakładaj dodatkowych dużych elips cienia” (`contactShadows: []`) |
| `designs/bystrow-space-base-v2/screenshots/base-with-two-modules.png`, `hangar-after-{natural,sunny,mint}.png`, `previews/hangar-before.png` | visual-gate references for the base cross-section with two modules and the Hangar room |
| `designs/bystrow-space-base-v2/preview.html` (`?view=base`, `?view=after&family=…`) | interactive reference for the same |
| `Martynka-urzadza.md` § 10 | asset naming: `public/assets/rooms/hangar/<file>.webp` |
| Copy keys (`src/data/pl.ts`) | NEW: `pl.room.names.hangar` „Hangar” (manifest label); `pl.room.slots['hangar-*']` nominative lower-case captions from the manifest labels („rakieta”, „łazik księżycowy”, „stół warsztatowy”, „skrzynie z częściami”, „lampa warsztatowa”, „mata startowa”); `pl.room.variants['hangar-*']` from the families with gender/number agreement (Naturalna/Słoneczna/Miętowa for rakieta, lampa, mata; Naturalny… for łazik, stół; Naturalne/Słoneczne/Miętowe for skrzynie: the manifest gives only masculine labels); `pl.room.tasks.*` six imperative + accusative labels (the kit has none, as for Mostek); EXISTING reused: `renovate` „Odnów ściany i podłogę”, `pl.room.done.*`, `pl.room.change.*`, `pl.house.open['base-1']` „Baza” |

### DESIGN-GAPs expected (rows in `docs/design-gaps.md`, numbering continues after 200)

- The kit has no Hangar renovation wording (task labels and the agreed variant names are ours), like gap 194 for Mostek.
- Gap 196 (no celebration for a building's last module) narrows again: Mostek now has a next module; the Hangar is the last one, its card shows two tiles and no teaser, „Dalej” stays in the Hangar in change mode with the „Baza” button (D3). The row is edited, not closed.
- Nothing else: the pack provides every picture the room needs; a missing one falls back to the existing `RoomLayer` stand-in box.

## Migration

**None expected.** The Hangar is a new `RoomDef` and a new cell in `HOUSES['base-1']`; the v6 save already carries
`house.rooms`, `rooms` and `currentRoom`, and the load path rebuilds the house layout from data. This is the same move as
S-22, which added the kitchen to `house-1` with no version bump (v5 stayed). Save format stays v6 (`SAVE_VERSION` 6).
Rollback below this build: the old build's `repairCurrentRoom` (called in `src/main.ts` with `savedLayout.rooms[0].room`)
sends a base child whose `currentRoom` is `hangar` back to the Mostek (not the salon), keeps `rooms.hangar` untouched,
and `mergeHouse` keeps the saved extra cell; research confirms this and the plan adds a line to `deploy/README.md` only if
it does not hold. What would change the answer: research finding a per-room saved field the v6 shape lacks (none foreseen).

## Open follow-ups triggered by this slice

| source | item | take |
|---|---|---|
| base-cross-section 5 (gap 196) | Trigger „a second module of the base (S-30 hangar-module)” | **in scope**: fires. After Mostek the card gains the Hangar tile and „Dalej” leads to it (data only); the last-module case moves to the Hangar. Edit gap 196, record the follow-up as narrowed, keep the trigger „a third base module or a designer answer for the last-module celebration” |
| kitchen-room 5 / first-building-choice 5 (texture atlas) | Trigger „`tests/bootBudget.test.ts` fails or headroom under `balance.loader.totalMs` drops below 2 s” | **conditional**: the Hangar is the next room the budget test covers; if it fails, the plan's first answer is WebP quality for the Hangar files, the atlas stays deferred; re-record either way |
| first-building-choice 18 / base-cross-section 8 | `FIRST_ROOM` fallbacks; trigger „a second building without a salon reaching a `FIRST_ROOM` fallback” | **not fired**: the base already exists; the Hangar adds no path with an empty `currentRoom`. Research confirms; carry |
| kitchen-room 4 (pack thumbnails) | Trigger „a not-done room shown with a pack thumbnail” | **not fired**: the Hangar tile uses the live or drawn miniature like the kitchen; carry |
| house-cross-section 4 / base-cross-section 13 („a known room not reached is shown closed”) | Trigger: next change to `HouseScene`/`HouseView`/`RoomScene.redraw` | **not fired** unless the plan touches those files (it should not); the Hangar cell is the airlock until Mostek is done, which is the intended look |
| base-cross-section 6, 7 (base frame, back label) | designer answer / playtest | not fired; carry |

## Autonomous decisions

- **D1. Hangar costs 6/10/13/14/17/19/21 = 100 stars, in the manifest's slot order (rocket, rover, workbench, crates, lamp, mat).**
  Chosen: the Mostek curve unchanged, so the second module costs the FR-044 „about 100” and keeps the same pace per task.
  Rejected: a steeper Hangar (e.g. 120): scope.md forbids balance changes beyond the module costs and there is no
  playtest measure yet (S-17); rejected: cheaper (kitchen-like 71): the base was set higher than the house by the
  maintainer (FR-044). Order: the roadmap outcome and the manifest list the rocket first; the hero piece first matches
  Mostek (console first). What would change it: S-17 measurements, the maintainer naming a price, or the plan finding
  that the rocket should close the module (then the order changes, not the sum).
- **D2. The Hangar sits in `ground-right` (floor 0, place 1) of `base-1`.** Evidence: v2 README „Pełną scenę skaluj …
  do 608×342 w (1060,636). Mostek zajmuje (252,636).”, `bases.base-1.cells` ground-right `col: 1`, `screenshots/base-with-two-modules.png`,
  and S-29 research which left ground-right closed for it. Rejected: an upper cell (no pack evidence). What would change
  it: a designer reorder of the base cells.
- **D3. The last-module behaviour stays as decided in S-29 (D4 there), now for the Hangar.** The card after the Hangar
  shows Mostek + Hangar and no teaser; „Dalej” keeps the child in the Hangar in change mode. Rejected: a teaser tile for
  a third module (no third module in data or art; inventing one breaks FR-046 „opens when added”). What would change it:
  a third base module in the data or a designer answer for the last-module celebration.
- **D4. No save-format change (v6 stays).** Why: precedent S-22; the room list is data. What would change it: see Migration.
- **D5. Slot captions use the pack labels, not the roadmap wording** („stół warsztatowy”, not „stół z narzędziami”),
  variant names follow the Mostek rule (family name agreed with the noun). What would change it: a teacher read in
  the plan finding a caption unclear for a 6-year-old.
- **D6. Next step is `/10x-research`, not `/10x-plan`**: the slice's risk is a hidden non-data dependency (tests pinning
  `base-1` as one room, the boot budget with heavier art, the art script's pack root), which needs a sweep before planning.
  What would change it: none for this run (the orchestrator's chain fixes research next).
