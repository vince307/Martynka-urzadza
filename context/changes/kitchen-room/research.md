---
date: 2026-10-31T00:21:25+0100
researcher: Claude (autonomous run 2026-10-30-rooms-kitchen, /10x-research step)
git_commit: efc45c972256732e1fad06ee4fa2e1b44bfc1ff6
branch: feat/kitchen-room
repository: Martynka-urzadza
topic: "S-22 kitchen-room: boot budget, parameterised room celebration, kitchen as data, kitchen copy"
tags: [research, rooms, boot-load, art-health, celebration, kitchen, RoomScene, BootScene, RoomDoneCard]
status: complete
last_updated: 2026-10-31
last_updated_by: Claude (autonomous run)
---

# Research: S-22 `kitchen-room`

**Date**: 2026-10-31T00:21:25+0100
**Researcher**: Claude (autonomous run, /10x-research step)
**Git Commit**: efc45c9 (branch head; `main` at 942e237 plus the change-identity commit)
**Branch**: feat/kitchen-room
**Repository**: Martynka-urzadza

## Research Question

From `change.md` (D1-D5, the triggered follow-ups) and the step prompt:

- (a) **Boot budget.** The kitchen pushes the boot payload past `balance.loader.totalMs`. Compare (1) loading a room's
  art when the room opens, (2) loading at boot only the room in renovation (+ done rooms), (3) raising the limit
  (a `[human]` row per scope.md). Check what CLAUDE.md's "every asset must be loaded at start (no lazy chunks)" means and
  how the load limit, `cutLoad`, art health, stand-ins and "Obrazki" treat a lazily loaded room.
- (b) **Room celebration** as ONE parameterised mechanism (FR-040) built on `RoomDoneCard`: intensity, narrator line,
  `starBurst` reuse, reduced motion, the move to the next room after "Dalej".
- (c) **Kitchen as data**: `RoomDef`, tasks and costs, art rows, art script row, thumbnail, shadows, worn grade, board vs
  cream margin.
- (d) **Kitchen copy**: the "Stan salonu" lines, kitchen slot captions, variant labels, task imperatives.

## Summary

- **(a) Recommendation: per-room boot load = option (2) narrowed to the room in renovation only, plus a runtime load
  of the next room when the current one is finished.** At boot, `BootScene.preload` queues `ROOM_ART` (every room) in its
  `room` group; replacing it by `roomArt(ROOMS[currentRoom])` keeps every boot payload under the limit: shared payload
  889 112 B (17.8 s) + salon 1 203 384 B = 41.8 s, or + kitchen 797 758 B = 33.7 s, both under 48 s. A done room is not
  drawn by any screen after the move (only the current room is drawn: `RoomScene.resolve`, `SalonBackdrop.render`),
  so done rooms need not be at boot. The "every asset at start" rule is about the **service-worker precache** (Workbox
  `globPatterns`, "Everything must be precached (no lazy loading)" in `vite/config.shared.mjs`), not the Phaser loader:
  the music loop is already fetched by the Phaser loader at runtime from the precache (`createSoundService` `startMusic`
  in `src/ui/sound.ts`). Offline stays whole because `ROOM_ART` still lists every room and `precacheCovers('room
  pictures', …, ROOM_ART)` in `scripts/check-deploy.ts` keeps checking it. Option (3) needs `totalMs` >= 59.8 s now and
  ~+16 s per future room (only postpones); downscaling (measured: q70 still 52.7 s) does not fit. What changes with (2):
  `tests/bootBudget.test.ts` (sum per room, max over rooms), `roomArtHealth` (per loaded room, refreshed after a runtime
  load), `BootScene.tables().room` / `cutByTable`, the `?e2eArt=room` seam, and `tests/e2e/salon-art.spec.ts` #16
  (`total` = `ROOM_ART.length` becomes the salon's own count).
- **(b)** The done card is drawn by `RoomDoneCard.show` and opened by `RoomScene.showCard`; it has no tweens and no burst
  today; "Dalej" only clears `card`/`cardDrawn` and redraws the SAME room; `nextRoom` (`src/core/house.ts`) runs only in
  `src/main.ts` at load. Recommendation: a pure `celebrationView(intensity, …)` in `src/core/` (intensity
  `'room' | 'house' | 'street'`, only `'room'` reachable), the card keeps the room list, adds a `starBurst` (guarded by
  `prefersReducedMotion()` like `RoomScene.celebrate`), one narrator line (`pl.room.done.spoken`, unchanged), and on
  "Dalej" calls `nextRoom` → writes `REGISTRY_KEYS.rooms` + `currentRoom` → `saver.flush('now')` → `redraw()`.
  The keepsake ("pamiątka", FR-040) belongs to the house intensity (FR-041 residents' stickers), not the room one.
- **(c)/(d)**: see the sections below.

## Detailed Findings

### (a) Boot budget and the room art load path

**Measured payload (this step and the `/10x-new` step).**

| set | bytes | seconds at 50 KB/s | vs 48 s (`totalMs` 50 000 - `HEADROOM_MS` 2 000) |
|---|---|---|---|
| boot today (`TASK_ART` + `ROOM_ART` + `UI_ART` + font + boot sounds, as `bootPayloadBytes` in `tests/bootBudget.test.ts` sums) | 2 092 496 | 41.8 | pass |
| of which salon (`ROOM_ART`, 37 files) | 1 203 384 | 24.1 | |
| shared part (boot today minus salon) | 889 112 | 17.8 | |
| kitchen, 21 files, `cwebp -q 85 -alpha_q 100 -m 6` (the art script's settings; measured in the session scratchpad) | 797 758 | 16.0 | |
| everything (option 3 baseline) | 2 890 254 | 57.8 | **fail by 9.8 s** |
| everything with the kitchen at `-q 70 -alpha_q 80` (downscale probe, scratchpad) | 2 636 336 | 52.7 | fail |
| shared + salon only (option 2, salon in renovation) | 2 092 496 | 41.8 | pass |
| shared + kitchen only (option 2, kitchen in renovation) | 1 686 870 | 33.7 | pass |

**What the boot queue loads.** `BootScene.preload` builds `queuers` per `BootGroup` and runs them in `bootQueue` order
(`src/core/artHealth.ts` `QUEUE_ORDER`: loadingArt, font, task, room, ui, sound); the `room` queuer loops over all of
`ROOM_ART` (`src/data/roomArt.ts`, `Object.values(ROOMS).flatMap(roomArt)`), skipping all under the e2e seam
`?e2eArt=room`. The save is loaded in `src/main.ts` before `createGame`, and `preBoot` sets `REGISTRY_KEYS.rooms`,
`currentRoom` and `house` (main.ts `createGame` callback), after `nextRoom` already moved a finished room on
(`nextRoom(session, houseLayout(...), ROOMS)` in main.ts). So `BootScene.preload` can read the room in renovation from
the registry: no new data plumbing is needed for option (2).

**Who draws room textures (inspected: every `drawRoomMiniature`, `ROOM_ART`, `roomArtHealth` consumer in `src/`).**

| consumer | which room |
|---|---|
| `RoomScene` → `RoomView.render(room, state, preview)` | `RoomScene.resolve()` reads `REGISTRY_KEYS.currentRoom` on every redraw (no caching in `create`) |
| `SalonBackdrop.render(rooms, currentRoom)` (TaskScene, WelcomeScene) | the current room only (`id = currentRoom && ROOMS[currentRoom] ? currentRoom : FIRST_ROOM`) |
| `RoomDoneCard.show` → `drawRoomTile` → `drawRoomMiniature` | **every known room in the house list** (`houseRoomList`) — the only place a second room is drawn |
| `UIScene` `missingRoomLabels` / "Obrazki" | labels of `ROOM_ART` entries in `roomArtHealth.missing` |

So after the move, a done room is drawn only on the done card, and the done card is shown only at the moment of the
last purchase (`RoomScene.dispatch` sets `card` when `roomDone`), i.e. while that room's art is loaded. No screen lets
the child revisit a done room before S-23 (`house-cross-section`, roadmap). Inference: **done rooms are not needed at
boot in this slice**; S-23 (the cross-section draws miniatures of all rooms, PRD Open Question 13: "Miniatury pokoi w
przekroju rysuje gra z żywych warstw") will need its own answer (load done rooms when the cross-section opens, or the
pack thumbnail).

**The "every asset at start" rule.** CLAUDE.md: "the precache globs cover js, css, html, png, webp, ogg, m4a, woff2 and
ttf, so every asset must be loaded at start (no lazy chunks) while the service worker uses `clientsClaim`".
`vite/config.shared.mjs` `pwaOptions.workbox`: `globPatterns: ['**/*.{js,css,html,png,webp,ogg,m4a,woff2,ttf}']`,
comment "Everything must be precached (no lazy loading): fail loudly, not at the default 2 MiB", `skipWaiting: true`,
`clientsClaim: true`. The rule therefore binds the **precache** (every file in the build is downloaded by the worker's
install) and the absence of lazy JS chunks; it does not forbid a Phaser load after boot. Precedent: the 48 s music loop
(not `boot` in `src/data/sounds.ts`) is fetched by the HUD scene's Phaser loader when the parent turns music on
(`startMusic` in `src/ui/sound.ts`, with its own `xhrSettings.timeout` = `balance.sound.musicLoadTimeoutMs` set on
`addfile`, a keyed `loaderror` listener and a cache check after `complete`). A runtime room load copies that pattern.
Recommend rewording the CLAUDE.md sentence in the implement step ("every asset is precached; the Phaser loader may load a
room's art when the room opens") so the next agent does not read it as a ban.

**Offline.** The kitchen files under `public/assets/rooms/kitchen/*.webp` match the `webp` glob, so the worker
precaches them at install; a runtime `this.load.image` is served from the precache offline. The deploy smoke keeps the
guarantee: `precacheCovers('room pictures', precache, ROOM_ART.map((a) => a.url))` in `scripts/check-deploy.ts` runs over
the full table as long as `ROOM_ART` keeps listing every room (it must: `tests/roomArt.test.ts` also checks the table
against the files). Residual risk (not new): a first launch that goes offline before the worker's install finished has
neither room cached — the same as today for the salon.

**Load limit, cut, health and stand-ins under option (2).**

- Boot limit and cut (`bootLimitSchedule`, `cutNow`, `cutLoad` in `src/scenes/loaderCut.ts`, `pendingKeys`) work on the
  scene's own loader queue, so a smaller `room` group needs no change there. `BootScene.tables().room` (used by
  `cutByTable`, `tableOf` for `loadErrorLine`) is a set of keys; it may stay the full `ROOM_ART` key set (a key is a key)
  — only `roomArtHealth` must change.
- `roomArtHealth` is computed in `BootScene.create` as `artHealth(ROOM_ART…, textures.exists)`. With option (2) the
  kitchen keys are not loaded at boot, so this would report them missing and "Obrazki" (`UIScene` `artHealthLines`,
  `missingRoomLabels`) would tell the parent the kitchen pictures are missing. **Required change:** compute it over
  `roomArt(ROOMS[currentRoom])`, and recompute it (same `withCauses` shape) after a runtime load, writing
  `REGISTRY_KEYS.roomArtHealth` again.
- Runtime load needs its own limits: Phaser sets each file's `xhrSettings.timeout` to 0 (comment in `BootScene.preload`
  and in `startMusic`), so the runtime loader must copy `balance.loader.timeoutMs` on `Loader.Events.ADD` as both do.
  There is no whole-load cut at runtime; with per-file timeouts x (`maxRetries` + 1) the worst case is 24 s per file in
  parallel (comment on `balance.loader`), after which a missing texture is a stand-in (below).
- Stand-ins already cover a not-yet-loaded texture: `RoomView` / `RoomLayer` draw a Polish stand-in box when
  `textures.exists` is false, `drawRoomMiniature` draws stand-ins, `miniatureMode` falls back to `'drawn'`, and
  `SalonBackdrop` uses `backdropMode` (plain page colour). A redraw on the loader's `complete` replaces them.
- Side effect to handle: `RoomDoneCard` calls `recordFallback(scene, 'miniature', mode)` for any tile whose miniature is
  not live; on the salon's card the kitchen tile (not done, unlocked) would be `'drawn'` if the kitchen is not yet loaded
  and record a false fallback. Also F-04 follow-up 14 (the reported `mode` is the current room's tile only). Plan
  should start the next room's load **when the current room becomes done** (in `RoomScene.dispatch`, the branch that sets
  `card`) — or earlier, when the last task is current — and draw the card's next-room tile after `complete`, and keep
  the fallback record to the celebrated room's tile.
- e2e seams and specs touched: `?e2eArt=room` (queue no room art) must also stop the runtime load (or the spec #16 in
  `tests/e2e/salon-art.spec.ts` asserts `health.total === ROOM_ART.length`, which becomes the salon's own count);
  `tests/e2e/salon-load-health.spec.ts` #15 (stalled `salon/shadows.webp`) is unaffected while the salon is current.

**Option comparison.**

| option | budget | cost | verdict |
|---|---|---|---|
| (1) load each room only when it opens (nothing at boot) | best (17.8 s) | the first room view after every launch shows stand-ins until loaded; the task-screen backdrop (`SalonBackdrop`) at boot would be plain | rejected: the backdrop and the first `RoomScene` visit regress for the room the child is in |
| (2) boot loads the room in renovation; the next room loads at runtime when the current one is done | 41.8 s worst (salon) | `BootScene` room queuer + per-room `roomArtHealth`, a runtime room loader (music pattern), budget test per room | **recommended**: scales with the house (S-25, S-26 each add a room without touching the boot budget), no `[human]` raise |
| (2b) as (2) plus done rooms at boot | 57.8 s once the salon is done | as (2) | rejected now: nothing draws a done room before S-23 |
| (3) raise `totalMs` to >= 60 s | passes | one number + `[human]` row; each further room ~+16-30 s | rejected: postpones; the PRD Open Question 13 already flags the per-room pack weight |
| downscale the kitchen (q70) | 52.7 s | quality loss | rejected: does not fit |
| texture atlas (F-04 follow-up 5) | unmeasured | packer, `ArtImage`/`RoomLayer` changes | rejected for this slice: heavy, and does not reduce bytes much for already-compressed WebP; re-record |

**Budget test under (2).** `bootPayloadBytes` should become shared + `max over ROOMS of roomArt(room)`; the test name
and message keep "boot payload". The balance comment on `loader` ("totalMs is ONE limit for the whole boot load …
2 092 396 B") should say the boot loads one room.

### (b) Celebration and the move to the next room

**Today (inspected `src/ui/widgets/RoomDoneCard.ts`, `src/scenes/RoomScene.ts`, `src/ui/widgets/starBurst.ts`,
`src/ui/motion.ts`, `src/core/house.ts`, `src/core/rooms.ts`, `src/data/pl.ts`).**

- `RoomDoneCard` (`constructor(scene, onNext)`) draws the card, the title `pl.room.done.title` and a `PageButton`
  "Dalej" (`pl.unlock.next`); `show(items, catalogue, states, current)` draws a tile per `RoomListItem`
  (`drawRoomTile` with a miniature and a check when `done`; `drawTeaserTile` with `pl.room.done.teaser` "Wkrótce" and a
  padlock when not unlocked). The miniature mode (`miniatureMode(neededMiniatureKeys(miniaturePieces(room, state)),
  exists, room.thumbnail)`) is stored only for the `current` room; `miniature()` returns it, `target()` the "Dalej"
  centre. No tweens, no burst.
- `RoomScene.dispatch` (purchase): writes `rooms` + `stars`, `saver.flush('now')`, sets `card` when `roomDone`,
  schedules `showCard` after `max(ANIMATION.purchasePopMs, ANIMATION.stageFadeMs)` (at once under reduced motion), and
  runs `celebrate()` (pop + `starBurst` at the slot, early return under `prefersReducedMotion()`) or `fadeStage()`.
- `RoomScene.showCard`: `cardDrawn = true`, `redraw()`, `playBeforeSpeech(sound, 'room-done')`, and when
  `effectiveAutoRead(...)` the narrator speaks `pl.room.done.spoken` after the cue, guarded by `cardDrawn`.
- "Dalej" callback (in `RoomScene.create`): `tap(); card = false; cardDrawn = false; redraw()` — no room change.
- `onSleep` and the `wake` `refresh` both reset `card`/`cardDrawn` (the card never survives sleep/wake) and clear ghosts.
- `starBurst(scene, x, y, { count, depth, speed?, scale? })` makes a particle emitter (texture `BURST_STAR_TEXTURE`),
  destroys it after `ANIMATION.purchaseParticleMs` + 100 ms; it has no reduced-motion check itself — both callers guard
  it (`RoomScene.celebrate`, `SummaryPanel` with `prefersReducedMotion()`).
- Copy: `pl.room.done = { title: 'Pokój gotowy!', spoken: 'Pokój gotowy!', teaser: 'Wkrótce' }`.
- `nextRoom(session, house, known)` returns `{ rooms, currentRoom, movedFrom }` and adds `emptyRoomState()` for the
  target; `roomInRenovation` = the first known, not-done room in house order. Called only in `src/main.ts` at load.

**Recommendation (one mechanism, FR-040; PRD FR-040 quoted: "pełne odsłonięcie urządzonego miejsca, wybuch gwiazdek, co
najwyżej jedno zdanie czytane przez lektora i pamiątka; … kończy się jednym „Dalej”. Przy systemowym „ogranicz ruch”
odsłonięcie jest bez animacji").**

- Pure rule in `src/core/` (e.g. `celebration.ts`): `type CelebrationIntensity = 'room' | 'house' | 'street'` and
  `celebrationView(intensity)` → `{ titleKey, spokenKey, burstCount, revealMs, keepsake: boolean }`, numbers in
  `ANIMATION`/`balance` and strings in `pl.ts` (scenes carry neither, CLAUDE.md working rules). Only `'room'` is
  reachable; `keepsake: false` for `'room'` (FR-041 ties keepsakes to residents of a done house).
- "Full reveal" at room intensity: the room is already fully drawn behind the card; the reveal can be the card sliding
  in after a short hold of the finished room (`revealMs`), static under `prefersReducedMotion()` (show at once), plus one
  `starBurst` from the card centre with `ROOM_LAYOUT.depth.card + 1`. Keep the room list (D5 holds: the list fits on the
  card; the reveal is the hold before the card, not a hidden list).
- Narrator: keep exactly one sentence, `pl.room.done.spoken` (could name the room: "Kuchnia gotowa!" would need gender
  agreement per room name; keep "Pokój gotowy!" — room-neutral, no grammar risk).
- "Dalej": `nextRoom(...)` with `houseLayout(savedHouse, HOUSES, FIRST_HOUSE)` and `ROOMS` → `registry.set(rooms)`,
  `registry.set(currentRoom)` → `saver.flush('now')` → `redraw()` (RoomScene re-resolves the room). `TaskScene.onWake`
  re-captures the backdrop when the `rooms` object reference changed, which `nextRoom` guarantees (`{ ...session.rooms }`).
  When there is no next room (`movedFrom === null`) "Dalej" behaves as today.
- New tweens/emitter must stop in `onSleep` (follow-up L-R11); the card is dropped on sleep today, so a reload or sleep
  between the last purchase and "Dalej" skips the celebration and the next launch opens in the kitchen through the
  load-time `nextRoom` (D3: no save-format change, nothing is lost).
- Specs that expect the teaser tile after the salon (`room-change.spec.ts`, `salon-extra-slots.spec.ts`,
  `rooms-as-data.spec.ts` `['room:true:true','teaser:false:true']`, `final-art-room-done.spec.ts`,
  `health-lines.spec.ts`) will see `{kind:'room', id:'kitchen'}` instead of the teaser once the kitchen is in `ROOMS`;
  after "Dalej" they will be in the kitchen.

### (c) Kitchen as data

**Types (`src/core/types.ts`).** `PlacedArt` = `id, x, y, width, height, z` (0-99, the draw order), `anchor`,
`visibleRect`; `SlotDef` = `PlacedArt` + `variants` (exactly 3) + optional `shownBeforePurchase`; `RoomTaskDef` =
`{ kind: 'stage', id, label, cost }` | `{ kind: 'slot', id, slot, label, cost }`; `RoomDef` requires `id`, `scene`
(`before`/`after`/`shadows`), `decor`, `slots`, `tasks`, `worn`, `contactShadows`; `thumbnail` and `formerTaskCounts`
are optional. `ROOM_ORDER` no longer exists (`tests/houseWiring.test.ts` keeps it out of `src`); room order is
`FIRST_HOUSE` in `src/data/houses.ts`, which already lists `{ room: 'kitchen', floor: 0, place: 1 }`.

**The kitchen `RoomDef`** (all from `designs/martynka-locations-v2/manifest.json` `rooms.kitchen`, no invention):
`id: 'kitchen'`, `scene` keys `kitchen/before|after|shadows`, `decor: []`, `worn: []`, `contactShadows: []`, no
`thumbnail`, no `shownBeforePurchase`, 6 slots with the manifest's `x, y, width, height, z, anchor, visibleRect` and
variants `kitchen/<slot>-natural|sunny|mint` (manifest order natural, sunny, mint). `targetRect` is ignored (the game
reads none; the salon rows carry none). `ROOMS` becomes `{ salon, kitchen }`.

- **Tasks**: one stage task first ("before → after" exactly like the salon: `RoomView.render` picks `scene.before` until
  the stage task is done, then `scene.after` + slots), then one task per slot in manifest order (counter, fridge, table,
  coffee, bench, rack). Keep the counter before the bench (bench z 18 tucks under the counter's z 20). The stage task may
  reuse the label `renovate` (shared text "Odnów ściany i podłogę"; `roomText.task` is a flat key map, task ids are only
  checked unique within a room by `tests/roomsData.test.ts`).
- **Costs**: `tests/roomsData.test.ts` requires integer costs 5-15 and the first task at most the clean-round total;
  salon style = stage 5, slots 7-15 (salon sum 129 over 12 tasks). The kitchen has 7 tasks; a salon-style list (e.g.
  stage 5, big built-ins 12-15, small pieces 8-10) is the plan's call within scope.md (S-17 tunes).
- **Worn grade**: not needed. `wornPieces` / `contactShadowPieces` (`src/core/rooms.ts`) map their lists, so `[]` gives
  `[]`; `buildWorn`/`drawWorn` in `RoomView` add nothing (and no Canvas wash) without images; `applyWornGrade` runs per
  image only. The pack's before picture is a full worn scene (README), so the kitchen has no worn pieces. The e2e room
  snapshot then reports `worn.graded: false`, `keys: []` for the kitchen; `tests/e2e/canvas-renderer.spec.ts` and the
  salon specs read the salon (current room at start), so they stay valid.
- **Shadows**: the pack's `kitchen-shadows.png` is fully transparent ("technical empty layer"); `RoomView.render` draws
  the shadows layer anyway — harmless; it keeps `scene.shadows` uniform and the art table complete.
- **Art table**: `ROOM_SCENE_FILES.kitchen = { before: 'kitchen-before', after: 'kitchen-after', shadows:
  'kitchen-shadows' }` (`src/data/roomArt.ts`; `roomArt` throws for a room without a row). Furniture urls follow
  `assets/rooms/<key>.webp`, so keys `kitchen/kitchen-counter-natural` etc. land in `public/assets/rooms/kitchen/`.
- **Art script**: one `ROOM_PACKS` row in `scripts/make-task-art.mjs` (`room: 'kitchen'`, pack = the locations-v2
  folder, `scene: ['kitchen-before','kitchen-after','kitchen-shadows']`, `decor: []`, 18 furniture ids,
  `recolourBoard: false`). `BOARD_FILES` only names the salon's two backgrounds, so recolouring could not fire anyway;
  the kitchen margin is ivory (corner pixel about (255,245,223), salon corner (114,169,107) green). The Python call is
  `execFileSync('python3', [recolour-board.py, …])` **without `-I`** (audit-art-renderer follow-up § 2 fires, trivial).
- **Thumbnail**: the pack has none. `miniatureMode` (`src/core/artPick.ts`) gives `'live'` when every needed key is
  loaded, `'thumbnail'` only with a loaded `thumbnail`, else `'drawn'`; with the runtime load in (a) the kitchen tile is
  live once loaded. A derived thumbnail (from the pack's `previews/`) would add a `UI_ART` row and boot bytes — not
  needed; DESIGN-GAP row for "no pack thumbnail".
- **Board vs margin**: salon green `#BCD799` board (recoloured) vs kitchen ivory margin. Not fixable from data without
  inventing art; `docs/designer-brief-m03.md` P3.2 orders the salon on cream. DESIGN-GAP row.
- **Tests that move with the kitchen**: `tests/roomArt.test.ts` — `toHaveLength(37)`, the snapshot
  `tests/fixtures/room-art-salon.json` and **`weighs at most 1 550 000 bytes in total`** (salon 1 203 384 + kitchen
  797 758 = 2 001 142 B fails): turn the weight cap per room (each room <= 1 550 000) and the length/snapshot per room.
  `tests/roomsData.test.ts` ("every room in ROOMS": text for every slot/variant/task, `visibleRect` inside the scene,
  distinct `z` below `depth.outline`, keys prefixed `kitchen/`) and `tests/layout.test.ts` (`z` > `depth.shadows` 2;
  the rack's z 10 passes) already iterate `ROOMS`.

### (d) Kitchen copy (`src/data/pl.ts`, teacher read)

Current room copy: `pl.room.names = { salon: 'Salon' }` (capitalised, despite the "lower case in data" comment on the
names list — keep capitalised, it is a tile caption), `tasks` imperatives with the accusative ("Postaw sofę", "Połóż
dywan", "Powieś półkę", "Wymień lampę"), `slots` nominative lower case, `variants` per slot (so gender agreement per
slot is possible: salon `cabinet: ['Dębowa', …]`, `armchair: ['Kremowy', …]`). Lookups through `roomText` are flat keys;
the kitchen slot ids are prefixed `kitchen-`, so no collision. Stand-in labels (`${slot} ${variant}`) must contain no
`-` or `/` (`tests/roomArt.test.ts`).

Proposal (DESIGN-GAP: the pack has piece names only; teacher read in `/10x-plan`/implement):

| slot | pack label | caption (`slots`) | task (`tasks`) | variants (natural, sunny, mint) |
|---|---|---|---|---|
| `kitchen-counter` | Zabudowa L | `szafki` ("zabudowa" is an adult word) | `Postaw szafki` | Naturalne, Słoneczne, Miętowe |
| `kitchen-fridge` | Lodówka | `lodówka` | `Postaw lodówkę` | Naturalna, Słoneczna, Miętowa |
| `kitchen-table` | Stół i krzesła | `stół i krzesła` | `Postaw stół i krzesła` | Naturalne, Słoneczne, Miętowe |
| `kitchen-coffee` | Kącik kawowy | `kącik kawowy` | `Urządź kącik kawowy` | Naturalny, Słoneczny, Miętowy |
| `kitchen-bench` | Ławka w wykuszu | `ławka` | `Postaw ławkę` | Naturalna, Słoneczna, Miętowa |
| `kitchen-rack` | Naczynia | `naczynia` | `Ustaw naczynia` | Naturalne, Słoneczne, Miętowe |

The manifest's family labels are masculine ("Naturalny", "Słoneczny", "Miętowy"); agreement with each caption is ours.
`names.kitchen = 'Kuchnia'` (manifest label). The stage reuses `renovate`.

**Mismatch lines** (F-04 follow-up 1): `pl.settings.roomMismatch` "Stan salonu w zapisie nie pasuje do gry. Postępy
zostają bez zmian." (shown in `src/ui/dom/saveHealthView.ts`) and `pl.saveTransfer.roomMismatch` "Stan salonu w tym
pliku nie pasuje do gry." (`src/ui/dom/saveImportDialog.ts`); the flag comes from `roomStateProblems`
(`src/core/rooms.ts`) via `src/main.ts`, `src/core/saveFile.ts`, `src/core/saveHealth.ts`. No test pins the text.
Recommend room-neutral wording: "Stan pokoju w zapisie nie pasuje do gry. Postępy zostają bez zmian." / "Stan pokoju w
tym pliku nie pasuje do gry." (a per-room name would need the genitive of every room name; not worth it for a parent
line). DESIGN-GAP row.

## Code References

- `src/scenes/BootScene.ts` `BootScene.preload` (`queuers.room` over `ROOM_ART`, seam `room`), `BootScene.tables`, `BootScene.create` (`roomArtHealth`)
- `src/data/roomArt.ts` `ROOM_SCENE_FILES`, `roomArt`, `ROOM_ART`
- `src/core/artHealth.ts` `bootQueue`, `cutByTable`, `pictureCutCount`, `artHealth`
- `src/scenes/loaderCut.ts` `cutLoad`, `pendingKeys`
- `src/ui/sound.ts` `createSoundService` → `startMusic` (runtime Phaser load precedent)
- `vite/config.shared.mjs` `pwaOptions.workbox` (`globPatterns`, `clientsClaim`)
- `scripts/check-deploy.ts` `precacheCovers('room pictures', …)`; `scripts/deploy-check/parse.ts` `precacheCovers`
- `tests/bootBudget.test.ts` `bootPayloadBytes`; `tests/roomArt.test.ts` (length 37, snapshot, 1 550 000 B cap)
- `src/ui/widgets/RoomDoneCard.ts` `show`, `drawRoomTile`, `drawTeaserTile`, `miniature`
- `src/scenes/RoomScene.ts` `dispatch`, `showCard`, `redraw`, `resolve`, `celebrate`, `listItems`, `onSleep`
- `src/ui/widgets/starBurst.ts` `starBurst`; `src/ui/motion.ts` `prefersReducedMotion`
- `src/core/house.ts` `nextRoom`, `roomInRenovation`, `houseRoomList`; `src/main.ts` load-time `nextRoom`
- `src/ui/widgets/RoomView.ts` `RoomView.render`, `drawRoomMiniature`, `miniaturePieces`; `src/ui/widgets/SalonBackdrop.ts` `render`
- `src/core/artPick.ts` `miniatureMode`
- `src/data/rooms.ts` `SALON`, `ROOMS`, `FIRST_ROOM`; `src/data/houses.ts` `FIRST_HOUSE`
- `src/data/pl.ts` `pl.room.{names,done,tasks,slots,variants}`, `pl.settings.roomMismatch`, `pl.saveTransfer.roomMismatch`
- `scripts/make-task-art.mjs` `ROOM_PACKS`, `BOARD_FILES`, `execFileSync('python3', …)`

## Architecture Insights

- Rooms are data end to end except the art **load timing**: `ROOM_ART` serves three roles at once (boot queue,
  health record, precache/deploy coverage). Option (2) splits the first two per room and leaves the third global.
- The Phaser loader at runtime is already a pattern (music) with its own per-file limit and cause naming.
- `RoomScene` resolves the room on every redraw, so a runtime switch is registry writes + `redraw()`.

## Historical Context (from prior changes)

- `context/archive/2026-10-30-rooms-as-data/` — F-04 follow-ups 1 (mismatch lines), 2 (`nextRoom` after "Dalej"),
  3 (room without thumbnail), 5 (atlas / boot budget), 6, 7, 14 (miniature mode per tile): all re-read in `change.md`;
  supported as described there.
- `balance.loader` comment (`src/data/balance.ts`): "tests/bootBudget.test.ts … so the next art addition forces a
  decision" — supported: the kitchen is that addition.
- `docs/human-checklist.md`: a row says the budget stood at 47.6 s; partial — salon-style later dropped the worn
  picture, the measured figure now is 41.8 s.

## Related Research

- `context/archive/2026-10-30-rooms-as-data/research.md` (rooms as data, save v5).

## Open Questions

- Exact kitchen costs (plan, within 5-15).
- Teacher read of the copy table in (d) ("szafki" vs "zabudowa", "Ustaw naczynia").
- When to start the next room's load: at the last purchase (simplest) or when the last task becomes current (more time
  on slow links). Plan decides; both keep the card's next-room tile honest only after `complete`.
- S-23 (cross-section) will need done rooms drawn again: not this slice.
