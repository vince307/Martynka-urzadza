# Kitchen, the second room from data, with the parameterised room celebration — Implementation Plan

## Overview

Roadmap slice S-22 `kitchen-room` (milestone M-03 `ulica-i-domy`), second slice of autonomous run
`2026-10-30-rooms-kitchen`, branch `feat/kitchen-room` cut from `main` at `942e237` (F-04 shipped). Outcome: after the
last salon purchase the child sees ONE parameterised celebration at room intensity (a hold of the finished room, a star
burst, at most one narrator sentence, one "Dalej"; static under reduced motion), "Dalej" moves her to the kitchen and
saves, and she furnishes the kitchen like the salon (walls and floor first, then 6 pieces with 3 variants for stars, in
the order of the room data). One room is in renovation at a time (FR-033). A done room stays reachable for "poprawki"
(FR-019): the room view shows one button with the other done room's name that opens it in place (runtime only, its art
loaded at runtime), and every way into the room view still opens the room in renovation (FR-039) — plan review F2.

The kitchen is data and art from `designs/martynka-locations-v2` (manifest room `kitchen`), converted by `npm run art`.
The boot budget is kept by loading at boot ONLY the room in renovation and loading every other room a child can see
(the next room, and done rooms drawn as miniatures on the celebration card) at runtime through the HUD loader, from the
service-worker precache. `balance.loader.totalMs` is NOT raised.

Fixed decisions: `context/runs/2026-10-30-rooms-kitchen/scope.md` (recorded below as "fixed by the maintainer
(scope.md)"). Research: `context/changes/kitchen-room/research.md` (its Code References are the grounding).
**A phase that finds it must change star income, mastery, curriculum, variants, a salon slot/cost/picture byte, the save
format (`SAVE_VERSION` stays 5) or `balance.loader.totalMs` stops with `STATUS: BLOCKED`.**

## Current State Analysis

Grounded in `research.md` and spot-checked on this branch at `c2bfe61`:

- **Boot queue.** `BootScene.preload` `queuers.room` loops over every entry of `ROOM_ART` (`src/data/roomArt.ts`,
  `Object.values(ROOMS).flatMap(roomArt)`), skipping all under `?e2eArt=room`; `BootScene.tables().room` is the key set
  of `ROOM_ART`; `BootScene.create` writes `REGISTRY_KEYS.roomArtHealth` from `withCauses('Room', ROOM_ART, artHealth(...))`.
  The registry already holds `currentRoom` (set by `preBoot` in `src/main.ts` after the load-time `nextRoom`).
- **Budget.** `tests/bootBudget.test.ts` `bootPayloadBytes` sums `TASK_ART + ROOM_ART + UI_ART` + font + boot sounds:
  2 092 496 B = 41.8 s at 50 KB/s against 48 s (`totalMs` 50 000 − `HEADROOM_MS` 2 000). Measured in research: shared
  part 889 112 B (17.8 s), salon 1 203 384 B, kitchen (21 WebP at the script's settings) 797 758 B; all rooms at boot =
  57.8 s (fails by 9.8 s); shared + kitchen alone = 33.7 s.
- **Runtime load precedent.** `createSoundService` `startMusic` (`src/ui/sound.ts`) fetches the music through the HUD
  scene's loader (`attachLoader(this.load)` in `UIScene`): per-file `xhrSettings.timeout` set on `addfile`, a keyed
  `loaderror` listener removed in every path, a cache check after `complete`. The precache (`vite/config.shared.mjs`
  `globPatterns` incl. `webp`, `clientsClaim`) serves it offline; CLAUDE.md's "every asset must be loaded at start (no
  lazy chunks)" means precache coverage and no lazy JS chunks.
- **Who draws room art.** `RoomScene.resolve` → `RoomView.render` (current room only); `SalonBackdrop.render` (current
  room only); `RoomDoneCard.show` → `drawRoomTile` → `drawRoomMiniature` for EVERY known room of `houseRoomList` — the
  only place another room is drawn. "Zmień wygląd" exists only for the current room when it is done; the HUD room switch
  always opens the current room.
- **Done card.** `RoomDoneCard` (`src/ui/widgets/RoomDoneCard.ts`): title `pl.room.done.title`, a tile per list item
  (room tile with miniature + check, or "Wkrótce" teaser), "Dalej"; no tweens, no burst; `mode` stored for the current
  tile only, but `recordFallback(scene, 'miniature', mode)` fires for ANY tile that is not live.
- **RoomScene.** `dispatch` sets `card` on `roomDone` after a purchase, waits
  `max(ANIMATION.purchasePopMs, ANIMATION.stageFadeMs)` (0 under `prefersReducedMotion()`) then `showCard` (cue
  `room-done`, narrator `pl.room.done.spoken` when auto-read is on); the "Dalej" callback only clears `card`/`cardDrawn`
  and redraws the same room; `onSleep` and the wake `refresh` drop the card. `starBurst` (`src/ui/widgets/starBurst.ts`)
  returns `void` and has no reduced-motion check itself (callers guard it).
- **House.** `HOUSES` (`src/data/houses.ts`) lists salon (0,0) and kitchen (0,1); `houseRoomList` turns the first
  unknown room into a teaser; `nextRoom` (`src/core/house.ts`) runs only at load in `src/main.ts`. With a kitchen in
  `ROOMS` the salon card lists `[salon (done), kitchen (unlocked, not done)]`, no teaser.
- **Room data/art.** `SALON` in `src/data/rooms.ts` (12 tasks, costs 5–15, sum 129); `ROOM_SCENE_FILES` has a salon row;
  `scripts/make-task-art.mjs` `ROOM_PACKS` has a salon row with `recolourBoard`; it calls `execFileSync('python3', …)`
  without `-I` (follow-up audit-art-renderer § 2). `tests/roomArt.test.ts` pins `ROOM_ART` length 37, the snapshot
  `tests/fixtures/room-art-salon.json`, the file list of `public/assets/rooms/` and a total weight cap of 1 550 000 B.
- **Copy.** `pl.room.names = { salon: 'Salon' }`, `pl.room.done = { title, spoken: 'Pokój gotowy!', teaser: 'Wkrótce' }`,
  `pl.settings.roomMismatch` / `pl.saveTransfer.roomMismatch` say "Stan salonu …" (F-04 follow-up 1).
- **e2e.** Specs that expect the teaser after the salon: `tests/e2e/rooms-as-data.spec.ts`
  (`['room:true:true','teaser:false:true']`), `tests/e2e/room-change.spec.ts` (`items[1]` teaser, and the FR-019 test
  taps `cardNext` then uses the salon's change mode), `tests/e2e/salon-extra-slots.spec.ts` (`items[1]` teaser). Specs
  that tap `cardNext`: `adaptive`, `final-art-room-done`, `health-lines`, `minigames`, `room-change`, `room-purchase`,
  `salon-extra-slots`. `tests/e2e/salon-art.spec.ts` #16 asserts `health.total === ROOM_ART.length`.
- `context/foundation/lessons.md` does not exist (nothing to apply).
- **CI evidence** for the `(CI at ship)` row: PR #117 `check` job of workflow `CI`, run 41142145249:
  `Tests  4011 passed | 3 skipped (4014)`, `e2e hook: absent (2 chunks checked)`.
- **Baseline** (contract): unit 4014 passed (CI 4011 + 3 skipped python tests), e2e 170. Every phase measures its own
  branch baseline before its first edit and writes `baseline + delta`.

## Desired End State

- A cold boot loads the art of ONE room — the room in renovation (or the current done room when none is left) —
  plus the shared tables; `tests/bootBudget.test.ts` proves shared + the heaviest single room (salon, 41.8 s) stays
  under 48 s with `balance.loader.totalMs` unchanged at 50 000.
- Every room a child can see has a defined load moment (table below) and never shows a broken screen: a texture not yet
  loaded is the existing stand-in (room layers, drawn miniature, plain backdrop) and the view redraws when the load
  completes. "Obrazki" reports only the current room's pictures, recomputed after a runtime load and after the move.
- After the last salon purchase: room pop + burst at the slot (as today), then the reveal hold, then the card with a star
  burst from the card, the `room-done` cue and at most `pl.room.done.spoken`; one "Dalej". Under reduced motion: no hold,
  no bursts, the card appears at once. "Dalej" writes `rooms` (with an empty kitchen state) and `currentRoom: 'kitchen'`,
  flushes the save, and draws the kitchen before its stage. A reload at any point after "Dalej" opens the kitchen.
- The kitchen plays like the salon: stage "Odnów ściany i podłogę" (before → after), then counter, fridge, table and
  chairs, coffee corner, bench, rack with 3 variants each, costs 5, 7, 9, 10, 12, 13, 15 (sum 71). After the kitchen's
  last purchase the card shows two done tiles (salon and kitchen) and "Dalej" stays in the kitchen with "Zmień wygląd".
- From the kitchen the room view offers the finished salon (one button named "Salon"; from the salon visit, a button
  named "Kuchnia" goes back): the salon opens in place with "Zmień wygląd", a change is free and saved, no purchase is
  possible there, and "Do pokoju", the HUD switch, a wake and a reload always open the room in renovation (FR-019,
  FR-035, FR-039). `currentRoom` never changes for a visit.
- `npm run art` regenerates the kitchen WebP deterministically in `public/assets/rooms/kitchen/` and leaves the salon
  bytes unchanged.

### Room-art load moments (every room a child can see)

| where a child sees a room | which room | when its art loads | what shows while it loads |
|---|---|---|---|
| Room view (`RoomScene`), HUD room switch, "Do pokoju" | current room | boot (`BootScene` room queuer over `bootRoomArt(currentRoom)`) | boot loading screen; a failed file = stand-in box (as today) |
| Task/welcome backdrop (`SalonBackdrop`) | current room | boot | plain page colour (`backdropMode`, as today) |
| "Zmień wygląd" (change mode of a done room) | current room only (the last room when no next room exists) | boot | as the room view |
| Celebration card, tile of the celebrated room | current room | boot | live miniature (already loaded) |
| Celebration card, tile of the next room (kitchen on the salon's card) | next room | runtime, queued at the last purchase (`RoomScene.dispatch`, the `roomDone` branch), before the reveal hold | drawn miniature without a fallback record; the card redraws on completion |
| Celebration card, tiles of done rooms (salon on the kitchen's card after a launch in the kitchen) | done rooms | runtime, same moment | same |
| Room view right after "Dalej" | next room (now current) | already queued at the last purchase; finished or still in flight | stand-in layers until completion, then redraw; "Obrazki" recomputed on completion |
| Task/welcome backdrop right after "Dalej" | next room (now current) | same runtime load; the backdrop is captured again on the task scene's wake when `roomLoad` changed since the last capture (plan review F3) | plain page colour (`backdropMode`) until the scene picture is loaded |
| Done-room visit (the room view's visit button, FR-019) | a done room that is not current (salon from the kitchen) | runtime, queued when the room view first shows the visit button (prefetch) and again on the tap (no-op when loaded/pending) | stand-in layers until completion, then redraw; no fallback record and no "Obrazki" line (only the current room is judged) |
| A reload after "Dalej" (or between the last purchase and "Dalej") | the room `nextRoom` picks at load | boot | as the room view |

## What We're NOT Doing

- No `SAVE_VERSION` 6, no "celebration shown" flag (research D3): a reload during the card skips the celebration and
  opens in the kitchen, nothing is lost.
- No raise of `balance.loader.totalMs`, no texture atlas, no downscaled kitchen (research: atlas re-recorded, q70 still
  fails); no derived kitchen thumbnail (no `UI_ART` row).
- No house cross-section (S-23 owns it). The done-room visit button of phase 6 is the interim way to a done room's
  change mode; S-23 replaces it (follow-up with trigger S-23). No room switcher list, no visit of a room that is not done.
- No house/street celebration copy, keepsake or sticker album (S-23/S-24, FR-041); only `'room'` is passed by any scene.
- No recolour of the kitchen margin to the salon green (DESIGN-GAP; designer brief P3.2 orders the salon on cream).
- No change to `RoomView.render`, `stepPanel`, `fadeStage`, `drawRoomMiniature`, purchase logic, `SalonBackdrop`
  (follow-ups VO2/F5/F7, L-R8, F1, F2/§27/§28, `ghostTweens` stay unfired and are re-recorded in phase 7).
- No service-worker install warning (F-04 follow-up 6) and no open-panel placeholder guard (follow-up 7): re-recorded
  with triggers (the purchase/panel path is unchanged).
- No balance change except the kitchen's own task costs; no curriculum, mastery, variants or star-income change.
- No change to the deploy scripts or `scripts/check-deploy.ts` (the precache check already iterates the full `ROOM_ART`).
- Nothing under `designs/` is edited; `designs/martynka-house-street-v1/` is not integrated.

## Implementation Approach

Pure rules first (phase 1: the celebration view and the room-load rules on synthetic rooms); then the boot change while
the build still has one room, so it is a no-op for the child and the budget test changes shape safely (phase 2); then
the runtime room-art loader as a service on the HUD loader (phase 3); then the celebration card and the "Dalej" move in
`RoomScene`, still with one room, so nothing visible moves yet except the reveal and the bursts (phase 4); then the
kitchen as data and art, which is where the card shows the kitchen and "Dalej" really moves — the e2e specs that expect
the teaser change in that phase (phase 5); then the done-room visit that keeps FR-019 reachable (phase 6); then docs, gap
rows, follow-ups, the seam sweep and the visual pass (phase 7, last impl); then the browser proof of the whole flow
(phase 8, e2e). Each phase touches at most two UI components.

## Critical Implementation Details

- **Order at "Dalej".** `nextRoom` → `registry.set(rooms)` → `registry.set(currentRoom)` → `saver.flush('now')` → health
  refresh → `redraw()`. The flush must come after both writes (the snapshot is taken when the write starts, as in
  `dispatch`), and `nextRoom` returns a fresh `rooms` object so `TaskScene.onWake` re-captures the backdrop.
- **HUD loader shared with the music.** The room loader and `startMusic` use the same `UIScene` loader. Every listener
  is keyed (file key / room keys) and removed in every path; completion is judged per room by `textures.exists`, never
  by "the loader emitted complete" alone (a `complete` can be the music's).
- **Fallback record.** `recordFallback(scene, 'miniature', …)` must stay a signal of a real missing picture: never for a
  tile whose room is still loading.
- **Health never judges a pending room (plan review F1).** `refreshHealth(room)` writes nothing while `room` is in the
  loader's pending set: the settle of that room writes the record. Without this, "Dalej" (which refreshes health for the
  new current room) would list all 21 kitchen pictures as missing in "Obrazki" while they are still in flight.

## Phase 1: Celebration view and room-load rules (pure)

Driver: tdd
Driver why: both modules are absent pure logic in `src/core/` whose behaviour is fixed by literal synthetic cases (intensity table, reduced motion, pending sets), so a failing test leads each.

### Overview

The two rules every later phase uses, with no Phaser and no data import.

### Changes Required:

#### 1. Celebration view

**File**: `src/core/celebration.ts` (new)

**Intent**: ONE parameterised celebration (FR-040): the scene asks the view for one intensity and draws what it says.

**Contract**: `type CelebrationIntensity = 'room' | 'house' | 'street'`; `interface CelebrationSpec { holdMs: number;
burstCount: number; keepsake: boolean }`; `celebrationView(intensity, reducedMotion: boolean, table:
Readonly<Record<CelebrationIntensity, CelebrationSpec>>): { intensity; revealMs: number; burstCount: number; keepsake:
boolean }` — `revealMs` = the spec's `holdMs`, `burstCount` the spec's; under `reducedMotion` both are 0 (static reveal,
no burst); `keepsake` passes through (false for `'room'`, FR-041 ties keepsakes to residents). Pure, no defaults read
from data.

#### 2. Room-load rules

**File**: `src/core/roomLoad.ts` (new)

**Intent**: decide which rooms a screen needs and which of them must be fetched, so the card and the loader agree.

**Contract**:
- `cardRooms(items: readonly RoomListItem[]): string[]` — ids of `kind: 'room'` items with a non-null id, in list order
  (teasers skipped).
- `roomsToLoad(wanted: readonly string[], keysOf: (room: string) => readonly string[], exists: (key: string) => boolean,
  pending: ReadonlySet<string>): { rooms: string[]; keys: string[] }` — rooms with at least one key not in the texture
  cache and not already pending, and their missing keys (deduplicated, in input order).
- `tileLoading(room: string, pending: ReadonlySet<string>): boolean`.

#### 3. Tests

**Files**: `tests/celebration.test.ts`, `tests/roomLoad.test.ts` (new)

**Contract**: celebration — a literal three-row table gives back each row; reduced motion → `revealMs` 0 and
`burstCount` 0 for every intensity; `keepsake` unchanged. Room load — synthetic lists (`[room a done, room b, teaser]` →
`['a','b']`); a room with every key cached is skipped; a pending room is skipped; keys are deduplicated.

### Success Criteria:

#### Automated Verification:

- `tests/celebration.test.ts` and `tests/roomLoad.test.ts` red before the modules exist, green after; unit `<branch baseline> + N`
- Deliberate break: ignore `reducedMotion` in `celebrationView` → the reduced-motion case red; drop the `pending` filter in `roomsToLoad` → the pending case red; each restored; meta-check: oracles are literal tables and literal id lists, not values computed by the code under test
- `npm run lint` passes (the boundary rules keep `src/core/celebration.ts` and `src/core/roomLoad.ts` free of Phaser and data imports)
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

---

## Phase 2: Boot loads only the room in renovation; the budget test per room

Driver: impl
Driver why: boot-queue wiring in `BootScene` and a reshaped data test — glue whose behaviour (one room today) does not change, proven by the budget test, a source guard and the existing salon e2e.

### Overview

With one room this is invisible to the child; it makes the budget a per-room property before the kitchen arrives.

### Changes Required:

#### 1. Boot art of one room

**File**: `src/data/roomArt.ts`

**Intent**: one data function the boot queue and the budget test share, so the test measures what the boot loads.

**Contract**: `bootRoomArt(currentRoom: string | undefined): RoomArtEntry[]` = `roomArt(ROOMS[currentRoom])` when known,
else `roomArt(ROOMS[FIRST_ROOM])`. `ROOM_ART` stays the full table (precache/deploy coverage, `tables().room`, labels).
Header comment: the boot loads the current room; other rooms load at runtime (phase 3).

#### 2. Boot queue and health

**File**: `src/scenes/BootScene.ts`

**Intent**: queue and judge only the current room at boot.

**Contract**: `queuers.room` iterates `bootRoomArt(registry currentRoom)` (seam `room` still queues none);
`roomArtHealth` in `create` is computed over the same list (same `withCauses('Room', …)` shape; extract the room
health computation into one helper that phase 3 reuses — e.g. `roomHealthOf(entries, exists, causes)` in
`src/core/artHealth.ts` or a small UI helper — so boot and runtime produce identical records). `tables().room` keeps
the full `ROOM_ART` key set.

#### 3. Budget and guards

**Files**: `tests/bootBudget.test.ts`, `tests/bootRoomArt.test.ts` (new), `tests/e2e/salon-art.spec.ts`, `src/data/balance.ts` (comment only)

**Contract**: `bootPayloadBytes(room)` = shared tables + font + boot sounds + `bootRoomArt(room)`; the test asserts
EVERY room id in `ROOMS` fits (message names the room and seconds), i.e. the worst case. `bootRoomArt.test.ts`: unknown
id → the first room's entries; a source guard that `BootScene.ts` does not iterate `ROOM_ART` in its preload (it may
still read it in `tables`). `salon-art.spec.ts` #16 compares `health.total` with `roomArt(ROOMS.salon).length` (equal
to `ROOM_ART.length` today). `balance.loader` comment: one room's art at boot, figure updated to the measured bytes.

### Success Criteria:

#### Automated Verification:

- `tests/bootBudget.test.ts` and `tests/bootRoomArt.test.ts` green; unit `<phase-1 count> + N`
- Deliberate break: make `bootRoomArt` return `ROOM_ART` → the source/behaviour case red (and once the kitchen exists, the budget red); make `BootScene` iterate `ROOM_ART` again → the source guard red; each restored; meta-check: the budget figure is file sizes on disk (`statSync`), not a value of the code under test; the guard proves wiring only, phase 8 proves the browser
- `git diff --stat 942e237 -- src/data/rooms.ts src/data/pl.ts public src/core/save.ts` empty; `grep -n "totalMs:" src/data/balance.ts` still shows 50 000 (`50_000`)
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (`salon-art`, `salon-load-health`, `health-lines` stay green)

---

## Phase 3: The runtime room-art loader on the HUD loader

Driver: tdd
Driver why: the service is absent and its contract (queue only missing keys, per-file limit, keyed failure, per-room completion, health refresh) can be led red-first by a fake loader as `tests/soundMusic.test.ts` does for the music.

### Overview

One service, created once and kept in the registry, that loads a list of rooms after boot and tells the scenes when a
room is ready.

### Changes Required:

#### 1. Service

**File**: `src/ui/roomArtLoader.ts` (new)

**Intent**: the runtime counterpart of the boot room queuer, modelled on `startMusic`.

**Contract**: `createRoomArtLoader(game, opts: { disabled: boolean }): RoomArtLoader` with `attachLoader(load)`,
`ensure(rooms: readonly string[]): void` (uses `roomsToLoad` with `roomArt`, `textures.exists`, its own pending set;
queues `load.image(key, url)` for the missing keys; sets `file.xhrSettings.timeout = balance.loader.timeoutMs` on
`addfile` for its own keys; keyed `loaderror` records the cause per key; on `complete` judges each pending room by
`textures.exists` and settles it), `pending(): ReadonlySet<string>`, `refreshHealth(currentRoom: string): void`
(writes `REGISTRY_KEYS.roomArtHealth` over `roomArt(currentRoom)` with the phase-2 helper; logs missing keys with
`loadErrorLine` as the boot does; a no-op while `currentRoom` is pending — plan review F1). On settling it bumps a runtime registry value `REGISTRY_KEYS.roomLoad`
(`{ pending: string[]; settled: string[] }`, outside `SAVE_KEYS`) and refreshes health when the settled room is the
current one. `disabled` (the `?e2eArt=room` seam) makes `ensure` a no-op. A throw while queueing warns and settles the
room as failed (stand-ins stay; never fatal).

#### 2. Wiring

**Files**: `src/main.ts`, `src/scenes/UIScene.ts`, `src/data/layout.ts`, `src/testing/e2eHook.ts`

**Intent**: one instance for the session on the loader that lives the whole session.

**Contract**: `main.ts` creates it beside the sound service (`REGISTRY_KEYS.roomArtLoader`) with `disabled` from the
e2e art seam (absent from `dist/`); `UIScene.create` calls `attachLoader(this.load)` next to the sound service's;
`REGISTRY_KEYS.roomArtLoader` and `REGISTRY_KEYS.roomLoad` added (not in `SAVE_KEYS`); the room snapshot of the e2e
hook reports `roomLoad`.

#### 3. Tests

**File**: `tests/roomArtLoader.test.ts` (new)

**Contract**: a fake loader and texture cache (as in `tests/soundMusic.test.ts`): `ensure(['b'])` queues only `b`'s
missing keys with the per-file timeout; a second `ensure` while pending queues nothing; a keyed `loaderror` for one key
leaves the room settled with that key missing in the health record and does not touch another room's record; a
`complete` caused by another file (music) does not settle a room whose keys are not in the cache; `disabled` queues
nothing; listeners are removed after settling; `refreshHealth(room)` while `room` is pending leaves the health record
untouched, and the settle of that (current) room writes it.

### Success Criteria:

#### Automated Verification:

- `tests/roomArtLoader.test.ts` red before the service exists, green after; unit `<phase-2 count> + N`
- Deliberate break: drop the per-file timeout → the timeout case red; settle on any `complete` without the texture check → the "music complete" case red; skip `off('loaderror')` → the listener case red; drop the pending check in `refreshHealth` → the pending-health case red; each restored; meta-check: the fake loader is the test's own, the oracle is the literal key list of a synthetic room
- `npm run build` prints `e2e hook: absent (` (the seam stays out of `dist/`)
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (`sound`/music specs stay green on the shared loader)

---

## Phase 4: The room celebration card and the move after "Dalej"

Driver: impl
Driver why: widget (`RoomDoneCard`) and scene (`RoomScene`) wiring of the phase-1 and phase-3 rules, with one room still in data; proven by source guards, the reduced-motion wiring test and the phase-8 e2e.

### Overview

The card becomes the room-intensity celebration; "Dalej" applies `nextRoom`. With one room the move is a no-op, so
only the reveal hold and the bursts are new to the child.

### Changes Required:

#### 1. Celebration numbers

**File**: `src/data/layout.ts`

**Intent**: the numbers live in data (no balance numbers in scenes).

**Contract**: `ANIMATION.celebration: Record<CelebrationIntensity, CelebrationSpec>`; `room.holdMs` =
`max(ANIMATION.purchasePopMs, ANIMATION.stageFadeMs)` plus a short hold of the finished room (agent picks within
400–800 ms), `room.burstCount` equal to the summary burst's count, `keepsake: false`; `house`/`street` rows carry the
room numbers with `keepsake: true` and a comment "not reachable before S-23/S-24, tuned there".

#### 2. Card

**File**: `src/ui/widgets/RoomDoneCard.ts`

**Intent**: draw the celebration of a given view and the honest state of each tile.

**Contract**: `show(items, catalogue, states, current, extras: { pending: ReadonlySet<string>; burst: number })` — a
tile whose room is pending draws the drawn miniature and records NO fallback (F-04 follow-up 14 and research (a));
`recordFallback` only for a non-pending tile whose mode is not live; `mode` stays the current tile's; when `burst > 0`
the card plays ONE `starBurst` from its centre at `ROOM_LAYOUT.depth.card + 1` on the first `show` of a visit and keeps
the handle; `hide()` destroys it. Doc comment updated (celebration, DESIGN-GAP row number from phase 7's list).

**File**: `src/ui/widgets/starBurst.ts`

**Contract**: returns the emitter so a caller can stop it; existing callers ignore it.

#### 3. Scene

**File**: `src/scenes/RoomScene.ts`

**Intent**: run the reveal, ensure the art the card needs, and move after "Dalej".

**Contract**:
- `dispatch`, `roomDone` branch: `roomArtLoader.ensure(cardRooms(this.listItems()))` at once; the card delay =
  `celebrationView('room', prefersReducedMotion(), ANIMATION.celebration).revealMs` (0 under reduced motion → at once).
- `showCard`: passes `burstCount` and the loader's `pending()` to the card; cue and narrator unchanged (one sentence,
  `pl.room.done.spoken`).
- A listener on `changedata-${REGISTRY_KEYS.roomLoad}` redraws when the scene is active (the card tile, or the new room
  after "Dalej"); removed on shutdown.
- "Dalej": `tap()`, clear the card, then `nextRoom({ rooms, currentRoom }, houseLayout(saved house, HOUSES,
  FIRST_HOUSE), ROOMS)`; when `movedFrom !== null`: write `rooms`, then `currentRoom`, `saver.flush('now')`,
  `roomArtLoader.ensure([currentRoom])` (no-op when already loaded/pending) and `refreshHealth(currentRoom)`; then
  `redraw()`. When `movedFrom === null` behave as today.
- `onSleep`: the card's burst is destroyed with the card (follow-up L-R11 for the new emitter).
- The e2e hook's room snapshot gains `card.celebration: { intensity, revealMs, burst }` (read from what the scene used).

**File**: `src/scenes/TaskScene.ts` (plan review F3)

**Contract**: the wake check that re-captures the backdrop when `REGISTRY_KEYS.rooms` changed also re-captures when
`REGISTRY_KEYS.roomLoad` is not the value seen at the last capture (store it beside `backdropRooms`), so a backdrop
captured plain while the new room was in flight is drawn again once it loaded. `SalonBackdrop` itself is unchanged.

#### 4. Tests

**Files**: `tests/celebrationWiring.test.ts` (new), `tests/reducedMotionWiring.test.ts`, `tests/roomDoneCardWiring.test.ts`

**Contract**: source guards — `RoomScene` calls `celebrationView('room'` and never another intensity; the card delay
comes from `revealMs`; "Dalej" calls `nextRoom` and `flush('now')` after both registry writes (order guard as in
`tests/houseWiring.test.ts`); `RoomDoneCard` calls `recordFallback` only outside the pending branch; the new `starBurst`
call sits behind a non-zero `burst` that the reduced-motion view makes 0 (`reducedMotionWiring` list extended);
`TaskScene`'s wake re-capture condition reads `REGISTRY_KEYS.roomLoad` (F3).

### Success Criteria:

#### Automated Verification:

- New and extended wiring tests green; unit `<phase-3 count> + N`
- Deliberate break: call `flush('now')` before `registry.set(currentRoom)` → the order guard red; record the fallback for a pending tile → the card guard red; pass a fixed delay instead of `revealMs` → the celebration guard red; each restored; meta-check: guards prove wiring only; the browser behaviour (move, save, reduced motion) is proven in phase 8
- `git diff --stat <phase-3 sha> -- src/data/rooms.ts src/data/pl.ts public src/core/save.ts` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (with one room "Dalej" still stays in the salon: `room-change` FR-019 and every `cardNext` spec stay green)

#### Manual Verification:

- [visual] Hook build on 4399, desktop 1440 and tablet 1024: the salon's last purchase → pop, the hold of the finished room, the card with its star burst, the salon tile and the "Wkrótce" tile; the same with the browser's reduced motion on (card at once, no burst)

---

## Phase 5: The kitchen as data and art

Driver: impl
Driver why: a data row, an art-script row and generated WebP whose proof is the art/data tests and byte-identical salon output; the visible move is exercised by the updated e2e specs and phase 8.

### Overview

The kitchen enters `ROOMS`; the salon card shows the kitchen tile and "Dalej" moves the child there. The specs that
expected the teaser change here.

### Changes Required:

#### 1. Art script and files

**File**: `scripts/make-task-art.mjs`; output `public/assets/rooms/kitchen/*.webp` (21 files)

**Intent**: convert the pack's kitchen the way the salon is converted (scope.md), and close follow-up audit-art-renderer § 2.

**Contract**: a `ROOM_PACKS` row `{ room: 'kitchen', pack: <designs/martynka-locations-v2>, scene: ['kitchen-before',
'kitchen-after', 'kitchen-shadows'], decor: [], furniture: [<6 slots × natural|sunny|mint in manifest order>],
recolourBoard: false }`; `execFileSync('python3', ['-I', …])`. `npm run art` leaves every salon file byte-identical.

#### 2. Room data

**Files**: `src/data/rooms.ts`, `src/data/roomArt.ts`

**Intent**: the kitchen from the manifest, nothing invented (research (c)).

**Contract**: `KITCHEN: RoomDef` — `id: 'kitchen'`, `scene` keys `kitchen/before|after|shadows`, `decor: []`,
`worn: []`, `contactShadows: []`, no `thumbnail`, no `formerTaskCounts`; 6 slots `kitchen-counter`, `kitchen-fridge`,
`kitchen-table`, `kitchen-coffee`, `kitchen-bench`, `kitchen-rack` with the manifest's `x, y, width, height, z, anchor,
visibleRect` (ignore `targetRect`), variants `kitchen/<slot>-natural|sunny|mint`; tasks in this order and cost:
`renovate` (stage, label `renovate`) 5, `place-counter` 7, `place-fridge` 9, `place-kitchen-table` 10,
`set-up-coffee` 12, `place-bench` 13, `set-out-dishes` 15 (sum 71; "new tasks at the END only" comment as in `SALON`).
`ROOMS = { salon, kitchen }`. `ROOM_SCENE_FILES.kitchen = { before: 'kitchen-before', after: 'kitchen-after',
shadows: 'kitchen-shadows' }`.

#### 3. Copy

**File**: `src/data/pl.ts`

**Intent**: child-facing kitchen words and room-neutral parent lines (F-04 follow-up 1).

**Contract**: `names.kitchen: 'Kuchnia'`; `slots`: `kitchen-counter: 'szafki'`, `kitchen-fridge: 'lodówka'`,
`kitchen-table: 'stół i krzesła'`, `kitchen-coffee: 'kącik kawowy'`, `kitchen-bench: 'ławka'`, `kitchen-rack:
'naczynia'`; `variants` (natural, sunny, mint) agreeing with each caption: szafki/stół i krzesła/naczynia → `Naturalne,
Słoneczne, Miętowe`; lodówka/ławka → `Naturalna, Słoneczna, Miętowa`; kącik kawowy → `Naturalny, Słoneczny, Miętowy`;
`tasks`: `placeCounter: 'Postaw szafki'`, `placeFridge: 'Postaw lodówkę'`, `placeKitchenTable: 'Postaw stół i
krzesła'`, `setUpCoffee: 'Urządź kącik kawowy'`, `placeBench: 'Postaw ławkę'`, `setOutDishes: 'Ustaw naczynia'`;
`settings.roomMismatch: 'Stan pokoju w zapisie nie pasuje do gry. Postępy zostają bez zmian.'`,
`saveTransfer.roomMismatch: 'Stan pokoju w tym pliku nie pasuje do gry.'`. Narrator line unchanged ("Pokój gotowy!").

#### 4. Tests and specs that move with the kitchen

**Files**: `tests/roomArt.test.ts`, `tests/fixtures/room-art-kitchen.json` (new), `tests/roomsData.test.ts` (if a
case is salon-only), `tests/e2e/rooms-as-data.spec.ts`, `tests/e2e/room-change.spec.ts`,
`tests/e2e/salon-extra-slots.spec.ts`; checked and adjusted only if red: `adaptive`, `final-art-room-done`,
`health-lines`, `minigames`, `room-purchase` specs (they tap `cardNext`)

**Contract**: `roomArt.test.ts` per room — salon length 37 and its frozen snapshot unchanged, kitchen length 21 and its
new snapshot, the file list per room folder, the weight cap `≤ 1 550 000` per room (not in total). Specs: the salon
card lists `['room:true:true','room:false:true']` (kitchen tile instead of the teaser); in `room-change.spec.ts` the
FR-019 test after `cardNext` asserts the move (`currentRoom` kitchen, no mode button) and its change-mode half moves to
phase 8 (the salon's change mode through the done-room visit, and the kitchen's own change mode); `salon-extra-slots`
`items[1]` is the kitchen room item. No spec loses a check without it being re-homed in phase 8 (listed in the phase-5
commit message).

### Success Criteria:

#### Automated Verification:

- `tests/roomArt.test.ts`, `tests/roomsData.test.ts`, `tests/bootBudget.test.ts` green with the kitchen (budget: salon 41.8 s and kitchen ≈ 33.7 s both under 48 s); unit `<phase-4 count> + N`
- `npm run art` then `git status --porcelain public/` lists only new files under `public/assets/rooms/kitchen/`; a second `npm run art` changes nothing
- Deliberate break: put the kitchen into the boot queue next to the salon (all of `ROOM_ART`) → `tests/bootBudget.test.ts` red (57.8 s); swap two kitchen variant keys → the kitchen snapshot red; each restored; meta-check: the snapshot is the manifest-derived table reviewed once in this phase (checked by eye against `designs/martynka-locations-v2/manifest.json`), sizes come from disk
- `git diff --stat 942e237 -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures/save-*.json public/assets/rooms/salon` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` with the three updated specs; total equals `npx playwright test --list | tail -1`

#### Manual Verification:

- [reviewer] Teacher read of every new Polish string: the six slot captions, the 18 variant labels (gender/number agreement with each caption), the six task imperatives (accusative: "lodówkę", "ławkę"), `names.kitchen`, the two room-neutral parent lines; short, child-friendly, no adult words ("zabudowa")
- [reviewer] The kitchen `RoomDef` geometry matches `designs/martynka-locations-v2/manifest.json` `rooms.kitchen` slot by slot (x, y, width, height, z, anchor, visibleRect); no slot, decor or art invented
- [human] S-17 tunes kitchen costs (5, 7, 9, 10, 12, 13, 15 = 71 stars; salon style, data only)

---

## Phase 6: Visit a done room in its change mode (FR-019)

Driver: impl
Driver why: a small pure helper with its own unit test plus one runtime field and one button in `RoomScene` over the phase-3 loader and the phase-5 kitchen — scene wiring proven by source guards and the layout test; the browser path is proven in phase 8.

### Overview

Plan review F2: without this, the child loses the salon's "poprawki" (PRD FR-019, must-have, live today) and cannot
even see her finished salon (FR-035) from the moment she taps "Dalej" until S-23. The room view gets ONE button that
opens the other done room in place; the room in renovation never changes (FR-033), every way into the room view still
opens it (FR-039), and the celebration card keeps one "Dalej" (FR-040). S-23's cross-section replaces the button.

### Changes Required:

#### 1. Visit rule

**File**: `src/core/roomVisit.ts` (new)

**Intent**: one pure answer to "which room does the visit button open".

**Contract**: `visitTarget(items: readonly RoomListItem[], current: string, visiting: string | null): string | null` —
while `visiting` is set, returns `current` (the way back); otherwise the first `kind: 'room'` item in list order that is
`done` and whose id is not `current`; `null` when none. No Phaser, no data import.

#### 2. Scene

**File**: `src/scenes/RoomScene.ts`

**Intent**: show a done room without touching the room in renovation.

**Contract**:
- `private visiting: string | null` (runtime only, never written to the registry or the save); `resolve()` uses
  `visiting` first, then `currentRoom` (one id, as today); `visiting = null` in `create`, in the wake `refresh` and in
  `onSleep`, so "Do pokoju", the HUD switch and a wake always open the room in renovation.
- One `PageButton` (`visitButton`, depth `controls`) labelled `roomText.name(<target nameKey>)` (existing name copy, no new
  string), shown only when not blocked (no panel, no card) and `visitTarget(this.listItems(), currentRoom, visiting)` is
  not null; showing it calls `roomArtLoader.ensure([target])` (prefetch; no-op when loaded or pending).
- Tap: `tap()`, close the panel, `mode = 'normal'`, `resetGesture()`, `visiting = target === currentRoom ? null : target`,
  `ensure([target])`, `redraw()`. The visited done room has no task (no task button, no purchase); "Zmień wygląd" and the
  hold work as today through `resolve()`, and a free change is written to `rooms[<visited id>]` by the existing
  `dispatch` `step.changed` path and saved by the autosave.
- The e2e hook room snapshot gains `visiting` and a `visitTarget()` tap point (as `modeButtonTarget`).

#### 3. Layout

**Files**: `src/data/layout.ts`, `tests/layout.test.ts`

**Contract**: `ROOM_LAYOUT.visitButton` and `ROOM_TOUCH_TARGETS.visitButton` (child-sized touch target like
`modeButton`); the layout test proves it overlaps none of `resume`, `taskButton`, `modeButton`, the variant panel area
and the HUD pills. DESIGN-GAP comment (row from phase 7's list).

#### 4. Tests

**Files**: `tests/roomVisit.test.ts`, `tests/roomVisitWiring.test.ts` (new)

**Contract**: unit, literal lists: `[salon done, kitchen not done]`, current kitchen → `'salon'`; same list, visiting
salon → `'kitchen'`; `[salon not done, kitchen not done]` → `null`; `[salon done, kitchen done]`, current kitchen →
`'salon'`; a teaser item is never a target. Wiring guards: `resolve` reads `visiting` before `currentRoom`; the wake
`refresh` and `onSleep` set `visiting = null`; the visit tap calls `ensure`; `RoomScene` never writes
`REGISTRY_KEYS.currentRoom` outside the "Dalej" branch.

### Success Criteria:

#### Automated Verification:

- `tests/roomVisit.test.ts`, `tests/roomVisitWiring.test.ts` and `tests/layout.test.ts` green; unit `<phase-5 count> + N`
- Deliberate break: drop `visiting = null` from the wake `refresh` → the wiring guard red; make `visitTarget` ignore `done` → the not-done unit case red; each restored; meta-check: the oracles are literal lists; the guards prove wiring only, phase 8 proves the browser
- `git diff --stat 942e237 -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures/save-*.json public/assets/rooms/salon` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

---

## Phase 7: Docs, gap rows, follow-ups, seam sweep and the visual pass

Driver: impl
Driver why: rule-file text, gap rows, follow-ups and leftovers over phases 1–6 plus the screenshot matrix — docs and glue.

### Overview

Close the slice in the repo's own records and look at every state the child sees.

### Changes Required:

#### 1. Docs

**Files**: `CLAUDE.md`, `docs/design-gaps.md`, `context/changes/kitchen-room/follow-ups/review-fixes.md` (new)

**Intent**: the next agent reads the truth.

**Contract**: CLAUDE.md "Current state": ONE compact S-22 sentence (kitchen from locations-v2 as data, `bootRoomArt`
boot of the room in renovation + `roomArtLoader` runtime load, `celebrationView`, "Dalej" → `nextRoom`, the done-room
visit `visitTarget`); stale
salon-only wording fixed (e.g. "the salon is data" lines that imply one room, `?e2eArt=room` "queues no salon
picture"); the sentence "every asset must be loaded at start (no lazy chunks)" reworded to "every asset is precached
(no lazy chunks); the Phaser loader may load a room's art after boot". Gap rows from 175: kitchen task imperatives and
slot captions (pack has names only), the celebration view at room intensity, the kitchen tile without a pack thumbnail,
salon green board vs kitchen cream margin (until brief P3.2), room-neutral mismatch lines, the done-room visit button
(the kit has no room switcher; interim until S-23). Follow-ups with `Trigger:` lines: F-04 follow-ups 4 (`salon-before`
thumbnail; the kitchen tile uses the live/drawn miniature), 5 (atlas), 6 (SW warning), 7 (open-panel guard), 12, 13
(L-R8), F1, F2/§27/§28, VO2/F5/F7, salon-load-health M-5 (purchase e2e under `writefail`) re-recorded; S-23 needs done
rooms drawn in the cross-section (use `roomArtLoader`) and replaces the visit button; the runtime loader does not run
the boot's `wrongSizes` check (plan review F5); house/street celebration copy and keepsake (S-23/S-24).

#### 2. Seam sweep

**Files**: as found

**Intent**: no leftover of phases 1–6.

**Contract**: `grep` for `teaser` expectations, `ROOM_ART.length` in specs, "salon" in comments of generic room code
(`RoomScene`, `RoomDoneCard`, `BootScene`, `roomArt.ts`, `e2eHook.ts` seam docs), unused exports from phases 1–6,
`starBurst` callers; the e2e hook seam doc for `?e2eArt=room` says it stops boot AND runtime room loads.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "bootRoomArt|roomArtLoader|celebrationView" CLAUDE.md` present
- `grep -c "Trigger:" context/changes/kitchen-room/follow-ups/review-fixes.md` ≥ 10; `grep -cE "^\| 1(7[5-9]|8[0-9]) " docs/design-gaps.md` ≥ 6
- `grep -rn "teaser:false:true\|ROOM_ART.length" tests/e2e` empty; `grep -n "every asset must be loaded at start" CLAUDE.md` empty
- `git diff --stat 942e237 -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures/save-*.json public/assets/rooms/salon` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [visual] Hook build on 4399 (`?e2eStars=N`), desktop 1440 and tablet 1024: (1) the finished salon's celebration card (salon tile with check, kitchen tile with its before-state miniature, "Dalej") and the same under reduced motion; (2) the kitchen before its stage; (3) the kitchen after the stage; (4) the kitchen with some furniture (bench drawn with and without the counter: its hidden end must not look broken); (5) the finished kitchen with the card (two done tiles) and then "Zmień wygląd" with the change panel; (6) the HUD room switch / task-screen backdrop showing the kitchen; (7) a forced runtime miss (`?e2eArt=room`): kitchen stand-ins, nothing broken; (8) the kitchen with the "Salon" visit button, then the visited salon in change mode with the "Kuchnia" button (no overlap with the task/mode/return buttons); each frame named in `reviews/visual-review.md`
- [human] Accept the interim "Salon"/"Kuchnia" visit button in the room view as the way to a done room's "poprawki" until S-23's house cross-section (decision K-6, DESIGN-GAP row)
- [human] Accept the salon green board next to the kitchen cream margin until the designer's salon re-export on cream (brief P3.2)
- [human] On a real tablet, installed and offline after one online launch: finish the salon, "Dalej", the kitchen draws its pictures (runtime load from the precache)
- [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in the `check` log of run 41142145249 of PR #117: `Tests  4011 passed | 3 skipped (4014)`, `e2e hook: absent (2 chunks checked)`)

---

## Phase 8: From the finished salon into the kitchen — e2e (#2, #16)

Driver: e2e
Driver why: the risk is the real browser path — last purchase → celebration → "Dalej" → runtime room load → save → reload in the kitchen → kitchen purchases → done-room visit (test-plan #2 progress kept, #16 a purchase deducts once); built by phases 3–6, after the phase-7 seam sweep, contract `E2E=on`.

### Overview

One spec, modelled on `tests/e2e/rooms-as-data.spec.ts` and `tests/e2e/room-change.spec.ts`, against the hook build.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/kitchen-room.spec.ts` (new)

**Contract**: tests (risk ids in titles):
- `#2 S-22 after the salon the card celebrates and "Dalej" moves into the kitchen, kept after a reload` — fresh context,
  `?e2eStars` enough for the salon; buy every salon task; card items `room:true:true`, `room:false:true`;
  `card.celebration.intensity === 'room'`, `burst > 0`; tap `cardNext` → `currentRoom` `kitchen`, kitchen state empty,
  salon state unchanged, stars unchanged; `roomLoad.settled` contains `kitchen`; `save` status written; reload →
  room `kitchen`.
- `#16 S-22 the kitchen furnishes like the salon and ends with its own card` — continue (or seed) to buy the kitchen's
  stage and 6 slots; each purchase deducts its cost once; the last shows the card with two done tiles; `cardNext` stays
  in the kitchen; the mode button opens the change mode; a change costs nothing (the change-mode check re-homed from
  `room-change.spec.ts`).
- `S-22 reduced motion: the card appears at once without a burst` — `page.emulateMedia({ reducedMotion: 'reduce' })`;
  `card.celebration.revealMs === 0`, `burst === 0`.
- `#16 S-22 FR-019 from the kitchen the finished salon opens for free changes and "Do pokoju" returns to the kitchen` —
  after the move (seeded or continued): tap `visitTarget` → room snapshot `salon`, `visiting` `salon`, no task button;
  the mode button opens the change mode; a change keeps the stars and is written to `rooms.salon`; `currentRoom` stays
  `kitchen`; "Wróć do notesu" then "Do pokoju" → room `kitchen`; reload → room `kitchen` with the salon change kept
  (the salon change-mode check re-homed from `room-change.spec.ts`).

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each run alone with `-g`: drop the `nextRoom` call from "Dalej" → the move test red on `currentRoom`; drop the `registry.set(currentRoom)` write in "Dalej" → the move and reload cases red on the room; ignore `reducedMotion` in `celebrationView` → the reduced-motion test red; make `roomArtLoader.ensure` a no-op → `roomLoad.settled` red; drop `visiting = null` from the wake `refresh` → the visit test red on the room after "Do pokoju"; each restored), green after
- `npx playwright test tests/e2e/kitchen-room.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 4`; total equals `npx playwright test --list | tail -1`
- Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)

---

## Testing Strategy

### Unit Tests:

- Pure: `celebrationView` (table, reduced motion), `cardRooms` / `roomsToLoad` / `tileLoading` on synthetic lists.
- Service: `roomArtLoader` with a fake loader (timeout, keyed error, shared-loader `complete`, disabled seam, listener cleanup).
- Data: `bootRoomArt`, per-room `roomArt` snapshots and weight caps, `roomsData` over both rooms, the boot budget per room.
- Wiring guards: boot queue, card fallback, "Dalej" order, celebration intensity, reduced-motion list, backdrop
  re-capture on `roomLoad`, done-room visit (`visiting` reset, `resolve` order).
- Pure: `visitTarget` on literal lists; the layout test for the visit button.

### Integration Tests:

- e2e phase 8 (hook build): salon → card → kitchen → reload → kitchen purchases → kitchen card → change mode; reduced
  motion; done-room visit (salon change from the kitchen, back to the kitchen).

### Manual Testing Steps:

1. Phase 7 visual matrix (eight states, two widths).
2. Teacher read of the kitchen copy (phase 5).
3. Offline tablet check of the runtime kitchen load (phase 7 `[human]`).

## Known risks

- **Runtime loads skip the boot's size check (plan review F5).** `BootScene` logs a picture whose size differs from its
  table (`wrongSizes`); `roomArtLoader` does not. A wrongly sized kitchen file loaded at runtime draws stretched without
  a log line. Mitigated: `tests/roomArt.test.ts` pins the sizes in the per-room snapshot and the boot of a launch in the
  kitchen runs the check. Re-recorded as a follow-up (phase 7).
- **A visited done room is not judged by "Obrazki" (plan review F2).** Its missing pictures show as stand-ins with no
  health line; only the current room is judged (requirement: never report a not-yet-loaded room as missing). A boot in
  the kitchen never loads the salon at boot, so the visit always relies on the runtime load from the precache.
- **Shared HUD loader.** The music's `once('addfile')` is synchronous with its own `loader.audio`, so it cannot catch a
  room file; the room loader must use keyed `on('addfile')` listeners removed on settle (phase 3 contract).

## Performance Considerations

Boot payload is shared + one room (worst: salon, 41.8 s at 50 KB/s, 6.2 s headroom; a kitchen launch 33.7 s). The
runtime load of the next room starts at the last purchase, so it overlaps the reveal hold and the card; on a cold link
the kitchen may show stand-ins for a few seconds after "Dalej". Each future room adds nothing to the boot budget unless
it is heavier than the salon (the budget test checks every room).

## Migration Notes

None. `SAVE_VERSION` stays 5; the kitchen state is an ordinary `RoomState` keyed `kitchen`, created empty by `nextRoom`.
A v5 save written before S-22 with a finished salon opens in the kitchen at the next launch through the existing
load-time `nextRoom`. Frozen fixtures v1–v5 are untouched.

## Autonomous decisions

- **K-0 Scope (fixed by the maintainer, scope.md).** Kitchen from `designs/martynka-locations-v2` (before/after,
  shadows, 6 slots × 3 variants natural/sunny/mint) via `npm run art`; one parameterised celebration, room intensity
  only; one room in renovation; no balance change but the kitchen's costs (5–15); the boot budget is measured, never
  silently raised. Would change: a new maintainer instruction.
- **K-1 Boot budget = load the room in renovation at boot, every other visible room at runtime (research option 2).**
  Rejected: all rooms at boot (57.8 s), done rooms at boot (same), raising `totalMs` (postpones; each room ~+16–24 s),
  downscale (52.7 s), atlas (heavy). Why: measured payloads; the runtime path is the music precedent and the precache
  keeps it offline. Would change: the e2e or the tablet check showing the runtime load unreliable offline → a recorded
  `totalMs` raise with a `[human]` row.
- **K-2 When a non-current room loads: at the last purchase of the current room** (queued before the reveal hold), for
  every room on the card (next room + done rooms). Rejected: when the last task becomes current (a load runs while the
  child may never finish; the HUD loader would carry it through task rounds), at "Dalej" (stand-ins on the card), when
  each room opens (stand-ins on every first visit). Why: the card is the first screen that needs them and the hold buys
  time. Would change: the visual gate showing stand-ins on the card on a normal link → start at the last task.
- **K-3 Loader on the HUD scene, as a session service.** Rejected: `RoomScene.load` (the scene sleeps when the child
  goes back to the notebook; its loader's progress across sleep is not a pattern in this repo). Why: `startMusic`
  already uses the HUD loader for the whole session. Would change: a conflict with the music load shown by the e2e.
- **K-4 Celebration = `celebrationView(intensity, reducedMotion, table)` over the existing card; reveal = a hold of the
  finished room before the card; one burst from the card; keepsake false at room intensity; narrator line unchanged
  ("Pokój gotowy!", room-neutral, no gender agreement per room name).** Rejected: a new scene, three widgets, naming the
  room ("Kuchnia gotowa!" needs per-room agreement). Why: FR-040, scope.md, research (b). Would change: the maintainer
  asking for the room's name or the visual gate showing the card hides the reveal.
- **K-5 House and street rows of the table exist with room numbers and `keepsake: true`; only `'room'` is ever passed**
  (source guard). Why: the type makes the parameter real without inventing copy; S-23/S-24 tune it. Would change:
  S-23/S-24.
- **K-6 (revised by the plan review, F2) Keep PRD FR-019's "poprawki" reachable with an interim done-room visit button
  in the room view (phase 6).** Chosen: one button named after the other done room opens it in place (runtime
  `visiting`, `currentRoom` untouched, reset on every wake/sleep), its art loaded at runtime through `roomArtLoader`.
  Rejected: leaving the salon unreachable until S-23 (the original K-6: takes a must-have, live today, away from the
  child and hides her finished salon, FR-035, for as long as S-23's art takes); a second button on the card (FR-040: one
  "Dalej"); keeping the child in the salon (FR-033); setting `currentRoom` to the salon for a visit (would move the room
  in renovation, the backdrop and the save). Why: `RoomScene.resolve()` is the one source of the room shown, so a visit
  is one field, one button and a pure rule — one phase; FR-039 holds because every way in resets the visit. `[human]`
  row 7.7 accepts the interim button. Would change: S-23 (the cross-section replaces it) or the maintainer preferring
  the gap until S-23.
- **K-7 Kitchen tasks in manifest order after the stage (counter before bench, so the bench's tucked end sits under the
  counter), costs 5, 7, 9, 10, 12, 13, 15 (sum 71)** — the ramp of the salon's first seven tasks (S-16a sum 71).
  Rejected: re-ordering by z; flat costs. Would change: S-17 (`[human]` row) or the visual gate showing the bench end.
- **K-8 Kitchen copy: "szafki" for "Zabudowa L", "Ustaw naczynia" for the rack, variant adjectives agreeing with each
  caption.** Why: child-facing words; research (d). Would change: the teacher read (`[reviewer]` row).
- **K-9 Parent mismatch lines room-neutral ("Stan pokoju …").** Would change: a per-room requirement.
- **K-10 No save-format change.** Would change: a persisted "celebration shown" flag being required (then v6 with a
  `[human]` row).
- **K-11 F-04 follow-ups 6 (SW install warning) and 7 (open-panel placeholder guard) re-recorded, not fixed.** Why: keep
  phases small; neither path changes. Would change: a phase touching `registerServiceWorker` or the panel path.
- **K-12 Offline proof of the runtime load is a `[human]` tablet check plus the deploy smoke's `precacheCovers` over the
  full `ROOM_ART`, not a browser e2e.** Why: the e2e hook build and the offline seed run on different servers; an
  offline e2e of a runtime room load would need a new seam. Would change: a regression report of offline kitchen art.
- **K-13 Phase drivers:** 1 tdd (pure, absent), 3 tdd (service absent, fake-loader precedent), 2/4/5/6/7 impl (wiring,
  data, the visit wiring, docs), 8 e2e (browser risk #2/#16 of features built in 3–6, after the phase-7 seam sweep).
  Phase 6 is impl, not tdd: its pure part is a few lines next to scene wiring; its unit test is written in the phase.

## References

- Research: `context/changes/kitchen-room/research.md`; change identity: `context/changes/kitchen-room/change.md`
- Scope: `context/runs/2026-10-30-rooms-kitchen/scope.md`
- Format example: `context/archive/2026-10-30-rooms-as-data/plan.md`
- Precedent runtime load: `src/ui/sound.ts` `startMusic`; tests `tests/soundMusic.test.ts`
- Card and scene: `src/ui/widgets/RoomDoneCard.ts` `show`, `drawRoomTile`; `src/scenes/RoomScene.ts` `dispatch`, `showCard`, `redraw`, `onSleep`
- Boot: `src/scenes/BootScene.ts` `preload` (`queuers.room`), `tables`, `create` (`roomArtHealth`); `tests/bootBudget.test.ts`
- House: `src/core/house.ts` `nextRoom`, `houseRoomList`; `src/data/houses.ts` `HOUSES`
- Pack: `designs/martynka-locations-v2/manifest.json` `rooms.kitchen` (read-only)
- Test plan: `context/foundation/test-plan.md` risks #2, #16

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Celebration view and room-load rules (pure)

#### Automated

- [x] 1.1 `tests/celebration.test.ts` and `tests/roomLoad.test.ts` red before the modules exist, green after; unit `<branch baseline> + N` — 3412b6e
- [x] 1.2 Deliberate break: ignore `reducedMotion` in `celebrationView` → the reduced-motion case red; drop the `pending` filter in `roomsToLoad` → the pending case red; each restored; meta-check: oracles are literal tables and literal id lists, not values computed by the code under test — 3412b6e
- [x] 1.3 `npm run lint` passes (the boundary rules keep `src/core/celebration.ts` and `src/core/roomLoad.ts` free of Phaser and data imports) — 3412b6e
- [ ] 1.4 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

### Phase 2: Boot loads only the room in renovation; the budget test per room

#### Automated

- [x] 2.1 `tests/bootBudget.test.ts` and `tests/bootRoomArt.test.ts` green; unit `<phase-1 count> + N` — 9deb86d
- [x] 2.2 Deliberate break: make `bootRoomArt` return `ROOM_ART` → the source/behaviour case red (and once the kitchen exists, the budget red); make `BootScene` iterate `ROOM_ART` again → the source guard red; each restored; meta-check: the budget figure is file sizes on disk (`statSync`), not a value of the code under test; the guard proves wiring only, phase 8 proves the browser — 9deb86d
- [x] 2.3 `git diff --stat 942e237 -- src/data/rooms.ts src/data/pl.ts public src/core/save.ts` empty; `grep -n "totalMs:" src/data/balance.ts` still shows 50 000 (`50_000`) — 9deb86d
- [ ] 2.4 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (`salon-art`, `salon-load-health`, `health-lines` stay green)

### Phase 3: The runtime room-art loader on the HUD loader

#### Automated

- [x] 3.1 `tests/roomArtLoader.test.ts` red before the service exists, green after; unit `<phase-2 count> + N` — f5f8904
- [x] 3.2 Deliberate break: drop the per-file timeout → the timeout case red; settle on any `complete` without the texture check → the "music complete" case red; skip `off('loaderror')` → the listener case red; drop the pending check in `refreshHealth` → the pending-health case red; each restored; meta-check: the fake loader is the test's own, the oracle is the literal key list of a synthetic room — f5f8904
- [x] 3.3 `npm run build` prints `e2e hook: absent (` (the seam stays out of `dist/`) — f5f8904
- [ ] 3.4 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (`sound`/music specs stay green on the shared loader)

### Phase 4: The room celebration card and the move after "Dalej"

#### Automated

- [x] 4.1 New and extended wiring tests green; unit `<phase-3 count> + N` — 74d5aea
- [x] 4.2 Deliberate break: call `flush('now')` before `registry.set(currentRoom)` → the order guard red; record the fallback for a pending tile → the card guard red; pass a fixed delay instead of `revealMs` → the celebration guard red; each restored; meta-check: guards prove wiring only; the browser behaviour (move, save, reduced motion) is proven in phase 8 — 74d5aea
- [x] 4.3 `git diff --stat <phase-3 sha> -- src/data/rooms.ts src/data/pl.ts public src/core/save.ts` empty — 74d5aea
- [ ] 4.4 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (with one room "Dalej" still stays in the salon: `room-change` FR-019 and every `cardNext` spec stay green)

#### Manual

- [ ] 4.5 [visual] Hook build on 4399, desktop 1440 and tablet 1024: the salon's last purchase → pop, the hold of the finished room, the card with its star burst, the salon tile and the "Wkrótce" tile; the same with the browser's reduced motion on (card at once, no burst)

### Phase 5: The kitchen as data and art

#### Automated

- [x] 5.1 `tests/roomArt.test.ts`, `tests/roomsData.test.ts`, `tests/bootBudget.test.ts` green with the kitchen (budget: salon 41.8 s and kitchen ≈ 33.7 s both under 48 s); unit `<phase-4 count> + N` — 18c0118
- [x] 5.2 `npm run art` then `git status --porcelain public/` lists only new files under `public/assets/rooms/kitchen/`; a second `npm run art` changes nothing — 18c0118
- [x] 5.3 Deliberate break: put the kitchen into the boot queue next to the salon (all of `ROOM_ART`) → `tests/bootBudget.test.ts` red (57.8 s); swap two kitchen variant keys → the kitchen snapshot red; each restored; meta-check: the snapshot is the manifest-derived table reviewed once in this phase (checked by eye against `designs/martynka-locations-v2/manifest.json`), sizes come from disk — 18c0118
- [x] 5.4 (against HEAD empty; against 942e237 only the phase-2 comment of `balance.loader`, `totalMs` 50 000) `git diff --stat 942e237 -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures/save-*.json public/assets/rooms/salon` empty — 18c0118
- [ ] 5.5 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` with the three updated specs; total equals `npx playwright test --list | tail -1`

#### Manual

- [ ] 5.6 [reviewer] Teacher read of every new Polish string: the six slot captions, the 18 variant labels (gender/number agreement with each caption), the six task imperatives (accusative: "lodówkę", "ławkę"), `names.kitchen`, the two room-neutral parent lines; short, child-friendly, no adult words ("zabudowa")
- [ ] 5.7 [reviewer] The kitchen `RoomDef` geometry matches `designs/martynka-locations-v2/manifest.json` `rooms.kitchen` slot by slot (x, y, width, height, z, anchor, visibleRect); no slot, decor or art invented
- [ ] 5.8 [human] S-17 tunes kitchen costs (5, 7, 9, 10, 12, 13, 15 = 71 stars; salon style, data only)

### Phase 6: Visit a done room in its change mode (FR-019)

#### Automated

- [x] 6.1 `tests/roomVisit.test.ts`, `tests/roomVisitWiring.test.ts` and `tests/layout.test.ts` green; unit `<phase-5 count> + N` — 0695012
- [x] 6.2 Deliberate break: drop `visiting = null` from the wake `refresh` → the wiring guard red; make `visitTarget` ignore `done` → the not-done unit case red; each restored; meta-check: the oracles are literal lists; the guards prove wiring only, phase 8 proves the browser — 0695012
- [x] 6.3 `git diff --stat 942e237 -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures/save-*.json public/assets/rooms/salon` empty (balance.ts differs only by the phase-2 comment) — 0695012
- [ ] 6.4 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

### Phase 7: Docs, gap rows, follow-ups, seam sweep and the visual pass

#### Automated

- [ ] 7.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "bootRoomArt|roomArtLoader|celebrationView" CLAUDE.md` present
- [ ] 7.2 `grep -c "Trigger:" context/changes/kitchen-room/follow-ups/review-fixes.md` ≥ 10; `grep -cE "^\| 1(7[5-9]|8[0-9]) " docs/design-gaps.md` ≥ 6
- [ ] 7.3 `grep -rn "teaser:false:true\|ROOM_ART.length" tests/e2e` empty; `grep -n "every asset must be loaded at start" CLAUDE.md` empty
- [ ] 7.4 `git diff --stat 942e237 -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures/save-*.json public/assets/rooms/salon` empty
- [ ] 7.5 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual

- [ ] 7.6 [visual] Hook build on 4399 (`?e2eStars=N`), desktop 1440 and tablet 1024: (1) the finished salon's celebration card (salon tile with check, kitchen tile with its before-state miniature, "Dalej") and the same under reduced motion; (2) the kitchen before its stage; (3) the kitchen after the stage; (4) the kitchen with some furniture (bench drawn with and without the counter: its hidden end must not look broken); (5) the finished kitchen with the card (two done tiles) and then "Zmień wygląd" with the change panel; (6) the HUD room switch / task-screen backdrop showing the kitchen; (7) a forced runtime miss (`?e2eArt=room`): kitchen stand-ins, nothing broken; (8) the kitchen with the "Salon" visit button, then the visited salon in change mode with the "Kuchnia" button (no overlap with the task/mode/return buttons); each frame named in `reviews/visual-review.md`
- [ ] 7.7 [human] Accept the interim "Salon"/"Kuchnia" visit button in the room view as the way to a done room's "poprawki" until S-23's house cross-section (decision K-6, DESIGN-GAP row)
- [ ] 7.8 [human] Accept the salon green board next to the kitchen cream margin until the designer's salon re-export on cream (brief P3.2)
- [ ] 7.9 [human] On a real tablet, installed and offline after one online launch: finish the salon, "Dalej", the kitchen draws its pictures (runtime load from the precache)
- [ ] 7.10 [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in the `check` log of run 41142145249 of PR #117: `Tests  4011 passed | 3 skipped (4014)`, `e2e hook: absent (2 chunks checked)`)

### Phase 8: From the finished salon into the kitchen — e2e (#2, #16)

#### Automated

- [ ] 8.1 Spec red before (deliberate breaks, each run alone with `-g`: drop the `nextRoom` call from "Dalej" → the move test red on `currentRoom`; drop the `registry.set(currentRoom)` write in "Dalej" → the move and reload cases red on the room; ignore `reducedMotion` in `celebrationView` → the reduced-motion test red; make `roomArtLoader.ensure` a no-op → `roomLoad.settled` red; drop `visiting = null` from the wake `refresh` → the visit test red on the room after "Do pokoju"; each restored), green after
- [ ] 8.2 `npx playwright test tests/e2e/kitchen-room.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 4`; total equals `npx playwright test --list | tail -1`
- [ ] 8.3 Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)
