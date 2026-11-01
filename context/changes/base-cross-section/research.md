---
date: 2026-11-01T02:44:47+01:00
researcher: Claude (autonomous run 2026-10-31-space-base, /10x-research step)
git_commit: 2f8ccb0
branch: feat/base-cross-section
repository: Martynka-urzadza
topic: "S-29 base-cross-section: the base cross-section as data on the house scene, per-building art, label and style, the stale house scene, fallbacks, save format, Mostek celebration"
tags: [research, HouseScene, HouseView, houseCells, houses, houseArt, RoomScene, TaskScene, make-task-art, deploy-smoke, design-gaps]
status: complete
last_updated: 2026-11-01
last_updated_by: Claude (autonomous run 2026-10-31-space-base)
---

# Research: S-29 `base-cross-section`

**Date**: 2026-11-01T02:44:47+01:00
**Researcher**: Claude (autonomous run, research step; local reads, one image composite, one cwebp size probe; no workers: the scope is one subsystem already mapped by `change.md`)
**Git Commit**: 2f8ccb0
**Branch**: feat/base-cross-section
**Repository**: Martynka-urzadza

No lessons file exists in `context/foundation/` (checked at this step), so no lesson is applied.

## Research Question

Derived from `change.md` (roadmap corrections, D1-D8, triggered follow-ups) and `handoff.md` § 5:

1. Where the per-building cross-section style lives (stage background, closed-cell text colour/shadow/weight).
2. How `HOUSE_ART` becomes per building so `HouseScene` loads only the chosen building's pictures, with deploy-smoke coverage and `tests/houseArt.test.ts` kept.
3. Whether the house `cell-frame` reads on the base shell (the base pack has no frame).
4. The per-building zoom-out label ("Dom" / "Baza", FR-048).
5. Follow-up 17 (`TaskScene.backToChoice` + sleeping `HouseScene`) and follow-up 18 (`FIRST_ROOM` / `house-1` fallbacks): can the base reach them?
6. WebP sizes of the base shell and airlock.
7. An e2e path to a base child.
8. Save format (v6 expected to stay).
9. FR-046 Mostek celebration while no next module exists.

## Summary

- **The base cross-section is data on the existing scene (D1 holds).** `houseCells` (`src/core/houseCells.ts`) is generic over `HouseGeometry` + `HouseState`; for `HOUSES['base-1']` (`src/data/houses.ts`, one place `bridge` at floor 0 place 0) it yields ground-left `current` and three `closed` cells. The pack's four cells and lift shaft equal `HOUSE_GEOMETRY['house-1']` byte for byte (`designs/bystrow-space-base-v1/manifest.json` `bases.base-1`). What differs per building and is today a constant: the stage background `HOUSE_LAYOUT.background` (`0xe7f4f4`; base preview `#e8efeb`), the teaser style `HOUSE_LAYOUT.teaser` (house `#FFF5DF`, weight 650, `#245C59` shadow; base preview `#245c59`, weight 600, no shadow), the zoom-out label `pl.house.open` ('Dom'), and the art list `HOUSE_ART`. **Recommendation:** extend `HouseGeometry` (`src/core/types.ts`) with `background` and `teaser` (colour, shadow or null, weight), plus derive the art list from the geometry's own keys; the label is a record in `pl.house` keyed by house id.
- **The base teaser must be dark.** The airlock's round window is cream (screenshot `base-with-bridge.png`): the house's cream text with a 2 px shadow would be near-invisible there. Using the pack's `#245c59` without shadow is a copy of the pack preview, not a gap.
- **Per-building art = filter, not a second table.** Keep the flat `HOUSE_ART` (`src/data/houseArt.ts`) as the one precache/smoke list and add two rows; `HouseScene.shellReady` / `HouseScene.loadArt` read only the entries named by `this.geometry()` (`shell`, `cellClosed`, `cellFrame`). `scripts/check-deploy.ts` (`precacheCovers('house pictures', …, HOUSE_ART…)`) and `tests/houseArt.test.ts` ("holds every art key the house geometry names", "no orphan file") keep working unchanged. **Key collision to avoid:** the base airlock is also named `cell-closed.png` in its pack; the game file must be distinct, e.g. `public/assets/house/base-1-cell-closed.webp` (key `house/base-1-cell-closed`) beside `base-1-shell.webp`.
- **Size cap breaks:** cwebp with the art script's settings (`-q 85 -alpha_q 100 -m 6`, `convert` in `scripts/make-task-art.mjs`) gives `base-1-shell` 81 970 B and the airlock 12 308 B (measured this step). `tests/houseArt.test.ts` "weighs at most 80 000 B in all" sums the whole `HOUSE_ART` (today 59 118 B: 44 964 + 5 554 + 8 600). With the base it becomes about 153 400 B. The plan must change the cap to a per-building sum (house ≤ 80 000 B unchanged; base about 102 900 B with the shared frame, cap e.g. 110 000 B) — it is runtime-loaded, not boot (`tests/bootBudget.test.ts` untouched).
- **The house frame reads on the base shell** (composite of shell + three airlocks + `cell-frame.png` at ground-left minus inset 16, this step): a gold rounded frame on the cream cell beside the shell's gold trims. Default of `change.md` holds: `HOUSE_GEOMETRY['base-1'].cellFrame = 'house/cell-frame'` (shared picture), one DESIGN-GAP row; the visual gate confirms in the game.
- **Follow-up 17 is real, and stopping the scene is not enough.** `HouseScene.loadArt` guards with the instance field `artQueued`, which `create()` never resets; `SceneManager.start` (Phaser 4.2.1, `node_modules/phaser/src/scene/SceneManager.js` `switch` → `start` when not sleeping) reuses the same scene instance. So after `backToChoice` stops the house scene and the child picks the other building, the first "Dom"/"Baza" open would skip queuing that building's pictures and show the stand-in shell. Also the cell hit zones are built once in `create()` from the geometry at that time. Plan: stop `SCENE_KEYS.house` in `TaskScene.backToChoice` AND reset `artQueued`/`artSettled` in `HouseScene.create` (or key the queue by house id).
- **Follow-up 18: the base never reaches the fallbacks on the inspected paths.** `main.ts` `preBoot` sets `REGISTRY_KEYS.house` and `REGISTRY_KEYS.currentRoom` from the start state on every boot, and `WelcomeScene.pick` sets both from `buildingStart` before starting the task scene; the `?? FIRST_HOUSE` / `?? FIRST_ROOM` branches in `HouseScene.render`/`geometry`, `RoomScene.currentRoomId`/`houseCellList`/`redraw`/`listItems`/`moveAfterDone`, `TaskScene` (backdrop room) and `SalonBackdrop` fire only with an absent registry value. No fix needed; the trigger stays carried.
- **Save format: no change (v6 stays, D6 confirmed).** `SAVE_VERSION` is 6 (`src/core/save.ts`); the saved `house` (`HouseState`, id `base-1`) already selects the geometry, art and label; `RoomScene.visiting` is runtime only; geometry, art and labels are data.
- **FR-046 Mostek celebration (roadmap unknown): D4 default is consistent with code and PRD.** `houseRoomList(base-1)` = `[{ room: 'bridge' }]` (pinned in `tests/roomsData.test.ts`), so the card shows one tile, no teaser; `RoomScene.moveAfterDone` returns early when `nextRoom` gives `movedFrom === null`, so the child stays in Mostek with change mode. FR-040 asks for one mechanism with one "Dalej"; nothing in FR-046 asks for a teaser tile. The only missing piece is the "Baza" button after "Dalej" — which this slice adds.
- **E2E path exists:** `passWelcome(page, query, 'space')` (`tests/e2e/support/welcome.ts`) with `e2eStars` (Mostek costs sum to 100, gap 194) reaches a done Mostek, as `tests/e2e/first-building-choice.spec.ts` (#16 S-28 FR-044) already buys in Mostek.

## Detailed Findings

### 1. Cells, rules and the scene are building-neutral except four constants

- `houseCells(g, h, current, doneOf)` (`src/core/houseCells.ts`) maps each geometry cell to the house place on the same floor/place; `cellTap` and `houseWakeVisit` read only the cell view. No house-specific value inside.
- `HouseScene.geometry()` (`src/scenes/HouseScene.ts`) already selects `HOUSE_GEOMETRY[house.id]` with a `house-1` fallback; `RoomScene.houseCellList` does the same. Adding `HOUSE_GEOMETRY['base-1']` is the switch.
- Building-specific constants that are NOT keyed today:
  - `HOUSE_LAYOUT.background` `0xe7f4f4` (`src/data/layout.ts`), drawn first in `HouseView.render`; base pack preview (`preview.html`, `view=base`) fills `#e8efeb`.
  - `HOUSE_LAYOUT.teaser` `{ color: '#FFF5DF', shadow: '#245C59', size: 32, weight: 650, shadowOffset: 2 }`, applied in `HouseView.render` to every closed cell. House pack preview: `.soon` 32px/650 `#fff5df` with a `#245c59` text-shadow; base pack preview: `600 32px` `#245c59`, no shadow, centred at cell x+304, y+182 (the house centres the text in the cell: x+304, y+171).
  - `HOUSE_ART` loaded wholesale by `HouseScene.shellReady`/`loadArt`.
  - `pl.house.open` 'Dom' in `RoomScene.redraw`.
- `HouseView.standInShell` draws a roof triangle (house-shaped) for any geometry. For the base it would show a gabled roof on a base: a stand-in only (picture missing), so a DESIGN-GAP row ("the stand-in of the base is the house-shaped outline"), or a per-geometry flag to omit the roof. House-cross-section follow-up 20 (inline stand-in numbers) fires if `HouseView` changes; moving the numbers into `HOUSE_LAYOUT` is cheap and optional.
- Hit zones: `HouseScene.create` adds one zone per `geometry.cells` at create time. Base and house cells are identical, so it is harmless now; it becomes stale if a future building's cells differ (another reason to restart the scene per building, see § 5).
- `tests/houseCells.test.ts` "HOUSE_GEOMETRY data" asserts the houses without geometry equal `['base-1']`: this assertion flips with the slice (expected change, not a regression). `tests/roomVisitWiring.test.ts` pins `RoomScene.redraw`'s `hasOwnProperty.call(HOUSE_GEOMETRY, savedHouse.id)` hide branch, which stays valid (both buildings now have geometry) but its comment and gap 195 close.

**Where to put style (recommendation, not decided by any source):** `HouseGeometry` already carries a colour (`cellFill`, from the pack manifest) and art keys; adding `background: number` and `teaser: { color: string; shadow: string | null; weight: number }` keeps "one record per building view" and lets `HouseView` stay branch-free. A sibling `HOUSE_STYLE` record in `layout.ts` keyed by house id is the alternative (profile § 6 says colours come from `layout.ts` or the art-pack palette; both values here are pack palette, so either satisfies it). Rejected: an `if (house.id === 'base-1')` in `HouseView`/`HouseScene` (the roadmap risk).

### 2. Per-building art

- `HOUSE_ART` (`src/data/houseArt.ts`) is three `entry(file, w, h)` rows with key `house/<file>`, url `assets/house/<file>.webp`.
- Consumers (inspected set: `grep -l HOUSE_ART` over `src scripts tests`): `src/scenes/HouseScene.ts`, `scripts/check-deploy.ts`, `tests/houseArt.test.ts`, `tests/houseSceneWiring.test.ts` (asserts BootScene does not load it), `tests/choiceArt.test.ts` (key separation).
- Recommended shape: add `entry('base-1-shell', 1920, 1080)` and `entry('base-1-cell-closed', 608, 342)`; in `HouseScene`, `const art = HOUSE_ART.filter((e) => [g.shell, g.cellClosed, g.cellFrame].includes(e.key))` used by `shellReady`, the `missing` list, `onFail` and `onAdd`. The smoke (`precacheCovers('house pictures', …)`) then covers the base files with no script change.
- Pipeline: `scripts/make-task-art.mjs` already declares `SPACE` (= `designs/bystrow-space-base-v1`) and converts `HOUSE_FILES` from `HOUSE` into `HOUSE_OUT` (`public/assets/house`) with no recolour. The base rows are a second loop (or a `pack` field per row): `{ from: 'assets/base/base-1-shell.png', to: 'base-1-shell.webp' }`, `{ from: 'assets/base/cell-closed.png', to: 'base-1-cell-closed.webp' }` from `SPACE`. Folder choice `public/assets/house/` keeps `tests/houseArt.test.ts` "no orphan file" meaningful; plan § 10 naming has no rule for building shells (it names rooms/tasks/ui only).
- Sizes (cwebp `-q 85 -alpha_q 100 -m 6`, measured): `base-1-shell` 81 970 B, `base-1-cell-closed` 12 308 B. Existing cap test sums all of `HOUSE_ART` ≤ 80 000 B → must become per building (sum of the entries a geometry names).
- `HouseScene.loadArt` `seam === 'house'` (e2e `?e2eArt=house`) skips fetching for any building: it works for the base unchanged.
- House-cross-section follow-up 19 (an undecodable picture leaves no console line, `onProcessError`) fires because `loadArt` changes; cheap to add a `filecomplete`-less check (`settle()` already records `artFallbacks.house = 'drawn'`), plan decides.

### 3. Frame on the base shell

- Only the house pack has a frame (`designs/martynka-house-street-v1/assets/house/cell-frame.png`, 640×374, gold rounded rectangle, transparent inside). The base pack lists no frame (README § Pliki do gry; manifest `bases.base-1` has no `cellFrame`).
- Composite (this step, Pillow, scratchpad only): base stage `#e8efeb` + `base-1-shell.png` + airlocks in three cells + `cell-frame.png` at (236, 620): the frame is clearly visible on the cream cell, harmonises with the shell's gold trims, overlaps the shell pillar and the lift-shaft edge by the same 16 px as in the house (identical geometry). Verdict: reuse `house/cell-frame` for `base-1`, `frameInset: 16`; DESIGN-GAP row; the in-game visual gate confirms.

### 4. Zoom-out label

- `RoomScene.redraw` shows `pl.house.open` (`src/data/pl.ts` `house: { open: 'Dom', back: 'Wróć do pokoju' }`). FR-048 (`prd.md`) fixes the words "Dom" and "Baza" → not invented copy.
- Recommendation: `pl.house.open: { 'house-1': 'Dom', 'base-1': 'Baza' }` (or a `labelKey` on the geometry resolved in `pl`), read with the saved house id; a unit test that every `HOUSE_GEOMETRY` key has a label. The hook target `houseButton` (`RoomScene.houseButtonTarget`) keeps its name.
- `pl.house.back` 'Wróć do pokoju' stays for the base (D8).

### 5. Stale house scene (follow-up 17) and fallbacks (follow-up 18)

- `TaskScene.backToChoice` stops `SCENE_KEYS.ui` and `SCENE_KEYS.room`, not `SCENE_KEYS.house`, then starts the welcome. With a base geometry, the path base → "Do pokoju" → "Baza" (house scene created, base art queued) → back → notebook → "Wróć" → choose house → "Do pokoju" → "Dom" wakes the sleeping house scene. `show()`→`render()` re-reads geometry from the registry, but `loadArt` returns at once (`artQueued` true) so the house pictures are never queued and `shellReady()` (once per-building) stays false → stand-in shell for the whole session.
- Stopping the scene alone does not cure it: `SceneManager.switch` starts a non-sleeping target with `start`, which reuses the instance (`getScene(key)`); `artQueued`/`artSettled`/`cells`/`modes` are class fields initialised once in the constructor. `RoomScene` resets its runtime field `visiting` at the top of its own `create` (`this.visiting = null`), the pattern to copy.
- Fix shape: `this.scene.stop(SCENE_KEYS.house)` in `backToChoice` plus resetting the art flags at the top of `HouseScene.create`; source guards in the style of `tests/roomVisitWiring.test.ts`; e2e path optional (§ 7).
- Fallbacks: `main.ts` `preBoot` sets `REGISTRY_KEYS.house`/`currentRoom` from `start` unconditionally; `WelcomeScene.pick` sets both before `start(placed)`. No inspected path clears them (`backToChoice` clears `learner` only). The fallbacks are therefore unreachable for the base in the inspected paths; follow-up 18 stays carried.

### 6. Celebration after Mostek (FR-046, D4)

- `RoomScene.redraw` shows `RoomDoneCard` with `celebrationView('room', …)` and `listItems()` = `roomsListView(houseRoomList(houseLayout(saved, HOUSES, FIRST_HOUSE), ROOMS), …)`. For `base-1`: one tile (`bridge`), no teaser (`houseRoomList` emits a teaser only for an unknown room after a known one).
- "Dalej" → `moveAfterDone` → `nextRoom(...)`: `roomInRenovation` finds none → target = current → `movedFrom === null` → return. The card closes, change mode ("Zmień wygląd") appears (`roomDone`), and with S-29 the "Baza" button (hidden while the card is up: `blocked` includes `this.card`).
- PRD FR-046 says the next module "otwiera się, gdy zostanie dodany do gry"; `main.ts` already runs `mergeHouse` + `nextRoom` at load, so S-30 adding `hangar` to `HOUSES['base-1']` moves a finished-Mostek child on at the next start without code here.
- House-cross-section follow-up 21 (browser test: `houseButton` null while the card is up) fires: the Mostek completion e2e is the natural place.

### 7. E2E path

- `tests/e2e/support/welcome.ts`: `passWelcome(page, query, building)` and `passWelcomeAsChild(..., building)`; `Building = 'house' | 'space'`. `first-building-choice.spec.ts` uses `passWelcome(page, { ...QUIET, e2eStars: '40' }, 'space')` to buy in Mostek. A done Mostek needs `e2eStars: '100'` (costs 6/10/13/14/17/19/21, gap 194) and seven purchases via the existing room helpers.
- Hook: `screen: 'house'`, `houseView` (`HouseScene.snapshot`: cells with state/mode, `shellReady`), `housePixel`, `targets().houseButton` (`src/testing/e2eHook.ts`). The cross-section spec can assert `house.id === 'base-1'`, cells `[current, closed, closed, closed]`, `shellReady` true after load, and the label through a new snapshot field (the hook exposes no button text today; the plan adds e.g. `room.houseLabel`).

### 8. Save format

- `SAVE_VERSION = 6` (`src/core/save.ts`); `SaveState.house: HouseState` is validated (`validHouse`) and copied (`copyHouse`). No new saved field is needed: the geometry, art list, style and label are keyed by `house.id`. Verdict: **v6 stays**, no migration, no fixture.

## Code References

- `src/core/houseCells.ts` — `houseCells`, `cellTap`, `houseWakeVisit` (building-neutral).
- `src/core/types.ts` — `HouseGeometry` (shell, cellClosed, cellFrame, cellFill, frameInset, cells, stairwell).
- `src/data/houses.ts` — `HOUSES` (`base-1` = bridge at 0/0), `HOUSE_GEOMETRY` (`house-1` only), `BUILDING_CHOICES`.
- `src/data/houseArt.ts` — `HOUSE_ART`, `entry`.
- `src/data/layout.ts` — `HOUSE_LAYOUT` (`background`, `teaser`, `standIn`, `depth`), `ROOM_LAYOUT.houseButton`.
- `src/data/pl.ts` — `house.open`, `house.back`, `room.done.teaser`.
- `src/scenes/HouseScene.ts` — `create` (zones), `show`, `render`, `geometry`, `shellReady`, `loadArt` (`artQueued`), `settle`, `snapshot`.
- `src/ui/widgets/HouseView.ts` — `render` (background, teaser text, frame), `standInShell` (roof).
- `src/scenes/RoomScene.ts` — `redraw` (house button label and hide rule, done card), `moveAfterDone`, `houseCellList`, `currentRoomId`.
- `src/scenes/TaskScene.ts` — `backToChoice` (stops ui and room only).
- `src/scenes/WelcomeScene.ts` — `pick` (sets house, rooms, currentRoom).
- `src/main.ts` — `preBoot` registry seeding; load-time `mergeHouse` + `nextRoom`.
- `scripts/make-task-art.mjs` — `SPACE`, `HOUSE_FILES`, `HOUSE_OUT`, `convert`.
- `scripts/check-deploy.ts` — `precacheCovers('house pictures', …)`.
- `tests/houseArt.test.ts` — sizes, no orphan, geometry keys, 80 000 B cap, not in boot.
- `tests/houseCells.test.ts` — "HOUSE_GEOMETRY data" (expects `base-1` without geometry; flips).
- `tests/roomVisitWiring.test.ts` — guard on the house-button hide rule.
- `tests/e2e/support/welcome.ts` — `passWelcome`, `passChoice` with `'space'`.
- `designs/bystrow-space-base-v1/manifest.json` `bases.base-1`; `preview.html` `view=base`; `screenshots/base-with-bridge.png`; README § Manifest i integracja.
- `node_modules/phaser/src/scene/SceneManager.js` — `switch` (wake if sleeping, else `start`), `start` (reuses `getScene(key)`).

## Architecture Insights

- The house view is already "one scene, geometry by house id": the only obstacles to a second building are four un-keyed constants (background, teaser style, art list, label). Keying them by the geometry/house id keeps the street (S-26) a list of geometries, which is the roadmap's stated risk.
- Scene instances persist across stop/start in Phaser 4.2.1; any once-per-instance flag (`artQueued`) must be reset in `create`/`init` when the scene can be restarted with different data.
- The flat art table + per-geometry filter keeps one precache/smoke list and one orphan check, while loading only the chosen building at runtime (NFR "one building's art").

## Historical Context (from prior changes)

- `context/archive/2026-10-31-house-cross-section/research.md`, `plan.md` — S-23 built the scene, the runtime art load and the stand-in; follow-ups 19, 20, 21 (`follow-ups/review-fixes.md`) fire on files this slice changes (supported: the triggers name `HouseScene.loadArt`, `HouseView`/`HOUSE_LAYOUT`, `RoomScene.redraw`).
- `context/archive/2026-10-31-first-building-choice/research.md` and `follow-ups/review-fixes.md` — follow-up 17 ("harmless while `base-1` has no `HOUSE_GEOMETRY`") is supported and now fires; its proposed fix (stop the scene) is partial: the instance flag must also reset (§ 5). Follow-up 18 ("reached only with no `currentRoom`") is supported for the base on the inspected paths. Follow-up 9 (manifest label "Baza księżycowa"): supported that no code reads it (`grep` of `src` finds no `księżyc`); D5 closes it.
- `docs/design-gaps.md` rows 195 (no zoom-out in base) and 196 (celebration of the last module) were written as "until S-29"; 195 closes, 196 narrows to "no teaser tile while no next module exists".

## Related Research

- `context/archive/2026-10-31-house-cross-section/research.md`
- `context/archive/2026-10-31-first-building-choice/research.md`

## Open Questions

- Style location (`HouseGeometry` fields vs a `HOUSE_STYLE` record): a real design choice for `/10x-plan`; both are data, both satisfy profile § 6. Recommended: `HouseGeometry`.
- Stand-in for the base when its pictures fail: keep the house-shaped `standInShell` (DESIGN-GAP) or add a `roof: boolean` per geometry. Recommended: a geometry flag only if follow-up 20 is taken in the same phase; otherwise a gap row.
- Per-building size cap value for the base (about 102 900 B measured with the shared frame): plan picks the number.
- Gap rows to write (after 198): base cell frame reused from the house; base stage background and teaser style copied from the pack preview (not a gap, cite the preview); base stand-in shell; zoom-out "Baza" (closes 195); last-module celebration (narrows 196).
