---
date: 2026-10-31T20:22:40+0100
researcher: Claude (autonomous run 2026-10-31-space-base, /10x-research step)
git_commit: 4e6b8d9
branch: feat/first-building-choice
repository: Martynka-urzadza
topic: "S-28 first-building-choice: save format, welcome flow, the base as data, boot, art pipeline, smoke, FR-049/FR-050 proofs"
tags: [research, save-format, migrations, WelcomeScene, houses, rooms, BootScene, make-task-art, deploy-smoke]
status: complete
last_updated: 2026-10-31
last_updated_by: Claude (autonomous run 2026-10-31-space-base)
---

# Research: S-28 `first-building-choice`

**Date**: 2026-10-31T20:22:40+0100
**Researcher**: Claude (autonomous run, research step; four read-only workers + local checks)
**Git Commit**: 4e6b8d9
**Branch**: feat/first-building-choice
**Repository**: Martynka-urzadza

## Research Question

Derived from `change.md` § Open research questions and the step prompt. Resolve, with source anchors (file + symbol):
1. the v6 save shape (explicit field vs version bump), migration, `backup-v5`, fixtures, rollback card, import of older files (PRD Open Question 17);
2. where the choice step sits in `WelcomeScene` (child and parent path), the theme "Wróć" until the first round ends, the narrator speaker;
3. how the second building and its module are data (houses/rooms), boot loading only the chosen building, `roomArtLoader`, `tests/bootBudget.test.ts`;
4. how the pack converts (`ROOM_PACKS`, board recolour, choice cards) and the deploy smoke precache coverage;
5. how FR-049 (old save → house, no choice screen) and FR-050 (same seed → same tasks in both themes) are proven;
6. Mostek prices summing to about 100.

No lessons file exists (`context/foundation/lessons.md` absent, checked in this step).

## Summary

- **Save: v6 as a version bump over the v5 shape (option a), no new field.** `house.id` already names the building (`HouseState` in `src/core/types.ts`, `freshSession(house, stars)` in `src/core/save.ts`). The bump is needed only as a rollback guard: a pre-S-28 v5 build reading a base save repairs `currentRoom` 'bridge' to the salon (`repairCurrentRoom` in `src/core/rooms.ts`, called from `src/main.ts` with `Object.keys(ROOMS)` and `FIRST_ROOM`), lets `nextRoom(houseLayout(..., FIRST_HOUSE))` pick the salon, marks the session dirty and writes it back (`writeVerdict` in `src/core/save.ts` refuses only a higher stored version). Under v6 the old build meets `decodeSave` → `{ kind: 'unreadable', reason: 'future' }`, shows `pl.saveFuture`, and `replaceGate` (`src/core/autosave.ts`) blocks `future` even with force. `MIGRATIONS[5]` is a frozen identity step `{ ...raw, version: 6 }`; `backup-v5`, `readBackups`, `migratedFrom` and the import path (`parseImport` in `src/core/saveFile.ts` → `decodeSave`) are generic in the version number and need no code.
- **Correction to the handoff claim:** `mergeHouse` is NOT applied to an unknown house id; `src/main.ts` only `console.warn`s "unknown house … kept as saved". The salon takeover comes from `repairCurrentRoom` + `nextRoom` over `houseLayout`'s `?? first` fallback (`src/core/house.ts` `houseLayout`). The conclusion (v6 needed) stands.
- **Flow: the choice is a second view of `WelcomeScene`**, reached from both paths through the one hand-off `WelcomeScene.start(placed)`; the card tap runs today's `start` body plus the building write. The choice is written **together with the learner** (registry `house`/`rooms`/`currentRoom` from `freshSession(<chosen house>, stars)` and then `learner`), so closing the app on the choice screen saves nothing and the next launch asks the age again (decision D3 confirmed).
- **Theme "Wróć"**: the existing task-screen "Wróć" (`TaskScene.renderAgeBack`/`backToAge`, today shown only on the child path by `ageBackOffered` in `src/core/placement.ts`) becomes a back to the **choice view** on both paths while `firstRoundDone` is false, by restarting `WelcomeScene` with the placed learner as scene data (runtime only, never saved). This fires follow-up N-2.
- **Speaker:** `UIScene` (home of `SpeakerButton`) does not run during `WelcomeScene`; the choice view adds its own `SpeakerButton` (`src/ui/widgets/SpeakerButton.ts`) using the narrator from `REGISTRY_KEYS.narrator`.
- **Data:** `base-1` is a second entry of `HOUSES` (`src/data/houses.ts`) with one cell `bridge` and **no** `HOUSE_GEOMETRY` entry; `bridge` joins the flat `ROOMS` (`src/data/rooms.ts`). Every `FIRST_HOUSE`/`FIRST_ROOM` fallback on a path a base child reaches is listed below and needs the current house instead.
- **Boot:** skip the `room` boot group while `needsPlacement` holds (no learner = no building chosen) and load two choice cards from a new small table only then; after the tap the chosen room's art comes through `roomArtLoader`. Returning players boot exactly as today (one room). The salon boot stays the worst case.
- **Art:** one `ROOM_PACKS` row `bridge` (`recolourBoard: false`; the flag is a no-op anyway because `BOARD_FILES` names only salon files), cards through a new root/table; deploy smoke covers Mostek automatically through `ROOM_ART` and needs one `precacheCovers` line for a new card table.
- **Prices:** 7 tasks, proposed 6/10/13/14/17/19/21 = 100, each above the salon's task at the same index (5/7/9/10/12/13/15). This **breaks the 5–15 cap** of `tests/roomsData.test.ts` (FR-044 "wyższe niż w salonie" cannot be met under it); the plan must widen the invariant.
- **FR-049** is proven on a new frozen `save-v5-salon.json` (unit, real load path) and a new e2e seam `?e2eSave=v5-salon`; **FR-050** by a pure test that rounds built from the sessions after either choice are deepEqual for seeds, plus a wiring guard that `TaskScene.freshRound` reads no house/room. The one existing theme-sensitive input is the Hasło word list (`MINIGAME_WORDS`), which must stay shared.

## Detailed Findings

### 1. Save format (PRD Open Question 17)

**What a pre-S-28 v5 build does with a base save** (traced on a v5 save `house.id='base-1'`, `currentRoom='bridge'`, `rooms.bridge`):
- `validHouse` (`src/core/save.ts`) checks types only (`typeof v.id === 'string'`), so the unknown id passes; `saveProblem` needs `currentRoom` to be a key of `rooms` → `decodeSave` returns `ok` (tests: `tests/saveV5.test.ts` "accepts duplicates and unknown room ids").
- `src/main.ts` load path: `repairCurrentRoom({...}, Object.keys(ROOMS), FIRST_ROOM)` sends the unknown 'bridge' to 'salon' (adds an empty salon, keeps `rooms.bridge`); the unknown house is kept as saved (`console.warn(... unknown house ...)`, no `mergeHouse`); `nextRoom(session, houseLayout(session.house, HOUSES, FIRST_HOUSE), ROOMS)` resolves `house-1` through `houseLayout`'s fallback; `roomRepaired = true` makes the start write.
- `writeVerdict` (`src/core/save.ts`) / `guardedPut` (`src/storage/idb.ts`) refuse only `stored.version > page.version`; 5 vs 5 writes. Result stored: house `base-1`, `currentRoom 'salon'`, rooms `{bridge, salon}`. Stars spent on the salon in that build would stay spent after a roll-forward (inference, not tested).
- Under v6 the same old build: `decodeSave` → `unreadable/future`, `src/main.ts` shows the card with `pl.saveFuture`, "Graj dalej" plays `freshSession(FIRST_HOUSE)` with the autosaver `blockedBy 'unreadable'`; `replaceGate` (`src/core/autosave.ts`) returns blocked for `future` even forced; `guardedPut` would also refuse with `NewerSave`. Nothing is overwritten.

**Option (a) version bump (recommended)** touches: `SaveV6` type over `SaveV5` with `version: 6` and `SaveState` pointing at it (`src/core/types.ts`), `SAVE_VERSION = 6`, `MIGRATIONS[5] = raw => ({ ...raw, version: 6 })` (frozen, must not call `copyHouse`, rooms-as-data follow-up 15), doc comments of `saveProblem`/`validateSave`. No change to `encodeSave`, `toSession`, `validHouse`, `freshSession`.
**Option (b) explicit `building` field** adds a second copy of the same fact (`house.id`), a new `corrupt/building` code, migration derivation with an unknown-id rule, a `freshSession` parameter and a consistency rule. Rejected: duplicates a fact that can disagree.

**Generic pieces (no code):** `backup(raw, from)` writes `${key}:backup-v${from}` (`src/storage/idb.ts`), `readBackups` loops `1..SAVE_VERSION-1`, `migratedFrom = from < SAVE_VERSION ? from : null` (`decodeSave`), backup export reason `backup-v${copy.from}` (`UIScene`). `parseImport` (`src/core/saveFile.ts`) → `decodeSave`, so a v5 export file migrates on import; `exportFileText` carries no version of its own.

**Fixtures and pins a bump moves** (never edit the frozen fixtures; add new ones):
- `tests/fixtures/`: save-v1, v1-fresh, v1-legacy-salon, v2, v2-fresh, v2-legacy-salon, v3, v4, v4-salon, v5 stay; add `save-v6.json` (base-1 + bridge, frozen) and `save-v5-salon.json` (learner + house-1 salon, frozen **while the code is still v5**, rooms-as-data phase-1 pattern; the existing `save-v5.json` holds an unknown room `living` and no learner-in-salon story, so it does not serve FR-049).
- Pins: `tests/save.test.ts` (`toBe(5)` ×3, `version: 5` encodes ×2, the "future" case uses 6 → needs 7); `tests/saveV5.test.ts` (version pin becomes a `MIGRATIONS[4]`-only check; the "save-v5 is unmigrated" cases must accept a migration; the "v6 future" case → 7); `tests/saveV4.test.ts` and `tests/legacySalonMigration.test.ts` (`version: 5`); `tests/autosave.test.ts` (future save `{version: 6}` → 7); `tests/fixtureLoadPath.test.ts` (title "writes v5", gains save-v6 and save-v5-salon rows, save-v5 row expects `migratedFrom 5` and `backup-v5`); `tests/idbStore.test.ts` (optional v5 backup case); `tests/e2e/rooms-as-data.spec.ts` (`expect(SAVE_VERSION).toBe(5)`).
- `deploy/README.md` § "6. Deploy, rollback, status", **Rollback** bullet: add a fourth note "Uwaga (format v6, first-building-choice)" in the form of the existing v3/v4/v5 notes (`pl.saveFuture` card, nothing overwritten).

**Load-path rule the bump does not give for free:** with `bridge` in the flat `ROOMS`, `repairCurrentRoom` accepts any known room in any house (a `currentRoom 'salon'` inside a `base-1` save would pass). The load path should repair to the **current house's first cell** (`houseLayout(session.house, HOUSES, FIRST_HOUSE).rooms[0].room`) and treat a `currentRoom` not in the house's cells as unknown. This is a load rule, not a format change.

### 2. Welcome flow (FR-042, FR-043, US-05, US-07)

- `WelcomeScene.create` builds `SalonBackdrop`, `drawNotebook`, the title, `pl.welcome.question`, one `AgeButton` per age and the "Rodzic" `PageButton`. `choose(age)` → `start(placeByChild(...))`; `openParent` (guard `if (!suspender || this.session?.active()) return;`) → `openParentGate` → `openStagePanel` → `onConfirm: (learner) => session.run(() => this.start(learner))`.
- `WelcomeScene.start(placed)` is the **only** writer of `REGISTRY_KEYS.learner` and the only hand-off to `TaskScene` (`this.registry.set(REGISTRY_KEYS.learner, learner); this.scene.start(SCENE_KEYS.task)`). Both paths meet there → the choice view goes in front of that body.
- Warm-up: `placeByChild` sets `warmupPending: previousStage(stage) !== null`; `placeByParent` sets it false when overridden; `TaskScene.create` reads it. The choice view does not touch it.
- Autosave: `learner` is in `SAVE_KEYS` (`src/data/layout.ts`); `src/main.ts` listens to `changedata` and `setdata`. `house`, `rooms`, `currentRoom` are save keys too (the room flow writes them); setting them and the learner in one tick gives one debounced write.
- **Recommendation:** `WelcomeScene` keeps the `PlacedLearner` in a field and draws the choice view (title "Co urządzamy najpierw?", two picture cards, speaker). The card tap: `session = freshSession(<house>, registry stars)` → set `house`, `rooms`, `currentRoom` → then today's `start` body (learner, `TaskScene`). Stars keep their balance (`REGISTRY_KEYS.stars` is the one source, `src/core/stars.ts`).
- **Theme "Wróć" (D4 refined):** today `ageBackOffered` (`src/core/placement.ts`) is `!stageOverriddenByParent && !firstRoundDone(...)` and `TaskScene.backToAge` nulls the learner, flushes, stops UI/Room and starts `WelcomeScene` at the age. US-07 wants the back to land on the **theme choice** on both paths. Recommended: one "Wróć" on the task screen, offered while `!firstRoundDone(...)` on both paths (new rule e.g. `themeBackOffered`), restarting `WelcomeScene` with `{ placed }` as scene data (runtime only) so it opens on the choice view; nulling the learner keeps "closing now asks the age again". From the choice view, a back to the age only on the child path (the parent path has no age step). Two "Wróć" meanings on the task screen are avoided.
- **Purchase before the first round ends:** the "Do pokoju" switch shows between tasks (`roundView.switchVisible` → `REGISTRY_KEYS.roomSwitch`, `UIScene`), so a child can buy in the first room during the warm-up/first round. Switching building then would drop that purchase (spent stars are not refunded: `src/core/stars.ts` only grows by earnings). Recommended: the theme back is also hidden once any room task is done (`tasksDone > 0`); alternative refund rejected (a second star source). Plan decides; recorded as an open choice.
- **Speaker:** the narrator is created once in `src/main.ts` (`createNarrator`, `src/ui/narrator.ts`) under `REGISTRY_KEYS.narrator`; `UIScene` is launched by `TaskScene`, so it is not running on the welcome screen, which has no speaker today. The choice view adds a `SpeakerButton` (speaks on `pointerup`, `ChunkyFace`), shown only while `narrator.available` (`onAvailability`), text from a new `pl.welcome.*` string through `spokenText` (`src/core/narration/spoken.ts`), `narrator.cancel()` on leaving. Position: a new `WELCOME_LAYOUT` token (the HUD's `HUD_LAYOUT.speaker` was not checked against the welcome layout). DESIGN-GAP row.
- **Reusable widgets:** `AgeButton` (ChunkyFace + `LIPS.age`, fires on pointerup only if the press began on it) is the template for a card button; `ArtImage.show(key, rect, standIn?)` draws a stand-in box with a label, but its sizes come from `TASK_ART` (not verified for UI art; plan checks); `ChunkyFace` skips motion under `prefersReducedMotion()` (`src/ui/widgets/chunky.ts`), the welcome screen has no entrance animation → NFR "bez animacji" is met by reuse.
- **e2e:** `tests/e2e/support/welcome.ts` `passWelcome` (→ `passWelcomeAsParent`: gate, age 10, stage E3 override, asserts `screen 'task'`) and `passWelcomeAsChild` are used across about 27 spec files (plus about 20 for `passWelcomeAsParent`, per-file line grep); the theme tap belongs **inside** the helpers (default Dom, parameter for Baza) so no spec changes. The hook (`src/testing/e2eHook.ts`) needs a choice sub-view on `screen: 'welcome'` (or a new screen name) and card targets in `targets()`.
- **Welcome backdrop:** `backdropMode` (`src/core/backdrop.ts`) shows the salon when its picture is loaded; a fresh install has `currentRoom = 'salon'` (`freshSession(FIRST_HOUSE)` in `src/main.ts`). If boot skips room art for a fresh install (§3), the welcome falls back to the plain page colour (the existing fallback) — a visible change, DESIGN-GAP row.

### 3. The base as data, boot and the room view

- `HOUSES` (`src/data/houses.ts`) = `[house-1 {salon 0/0, kitchen 0/1}]`; `FIRST_HOUSE = HOUSES[0]`; `HOUSE_GEOMETRY` keyed by house id with `house-1` only. `src/core/house.ts` functions take the house as an argument (`houseRoomList`, `roomInRenovation`, `nextRoom`, `mergeHouse`, `houseLayout`, `copyHouse`). Add `{ id: 'base-1', rooms: [{ room: 'bridge', floor: 0, place: 0 }] }`; no geometry until S-29.
- `FIRST_HOUSE`/`FIRST_ROOM` fallbacks that a base child would hit: `src/main.ts` (`repairCurrentRoom(..., FIRST_ROOM)`, `houseLayout(..., FIRST_HOUSE)` ×2, `freshSession(FIRST_HOUSE)` at a fresh start — fine, replaced at the choice), `src/scenes/RoomScene.ts` (several `houseLayout(registry.house ?? FIRST_HOUSE, ...)`), `src/scenes/HouseScene.ts` (`HOUSE_GEOMETRY[house.id] ?? HOUSE_GEOMETRY[FIRST_HOUSE.id]`), `src/scenes/UIScene.ts` (reset `freshSession(FIRST_HOUSE)` — correct: a reset leads back to the welcome and the choice), `src/scenes/TaskScene.ts`, `src/ui/widgets/SalonBackdrop.ts`, `src/data/roomArt.ts` `bootRoomArt` fallback, `src/testing/e2eHook.ts`. With `base-1` in `HOUSES`, `houseLayout` resolves it and most fallbacks are never taken; each remains to be read by the plan.
- **"Dom" button (D6):** created in `RoomScene` and shown whenever nothing blocks it (`this.houseButton.show(pl.house.open, ...)`); hide it when `HOUSE_GEOMETRY[house.id]` is undefined (one data-driven condition). Otherwise HouseScene would draw house-1 geometry with base cells.
- **After Mostek (D7 confirmed):** "Dalej" → `RoomScene.moveAfterDone` → `nextRoom(..., houseLayout(registry.house ?? FIRST_HOUSE, HOUSES, FIRST_HOUSE), ROOMS)`; with `movedFrom === null` it returns and the scene stays in the done room's change mode; it does not open `HouseScene`. Holds only while `base-1` is in `HOUSES` (otherwise the fallback moves the child to the salon). `celebrationView` (`src/core/celebration.ts`) is house-independent; the card list from `houseRoomList` shows one tile and no teaser for the base. `src/main.ts` runs the same `nextRoom` at load.
- `src/core/rooms.ts` `repairCurrentRoom(session, knownIds, firstRoom)` — caller supplies `firstRoom`; `roomDone`, `roomsListView`, `roomStateProblems` iterate saved rooms vs the catalogue, house-independent.
- **Test constraint:** `tests/roomsData.test.ts` "is keyed by its own id and placed in the first house" requires every `ROOMS` key in `FIRST_HOUSE` → must become "placed in exactly one house of `HOUSES`".
- **Boot:** `BootScene` runs `bootQueue(['loadingArt','font','task','room','ui','sound'])`; `room` loads `bootRoomArt(registry.currentRoom)`; `ui` loads all of `UI_ART` unconditionally; room health is computed for the boot room; `BootScene` then starts `needsPlacement(learner) ? welcome : task`. A fresh install boots the salon (about 1.2 MB) before any choice.
- **Recommendation (NFR "start ładuje grafiki tylko wybranej budowli"):** when `needsPlacement` holds, skip the `room` group (and its room-health record for a room not loaded) and queue the two choice cards; when a learner exists, boot exactly as today (one room, no cards). After the card tap, `roomArtLoader.ensure([firstRoom])` (`src/ui/roomArtLoader.ts`, the `RoomScene.moveAfterDone` pattern with `refreshHealth`). The plan must check that "Obrazki" does not report the unloaded room as missing.
- **Budget:** `tests/bootBudget.test.ts` sums on-disk sizes of `TASK_ART + bootRoomArt(room) + UI_ART + font + boot sounds` per room in `ROOMS` at 50 KB/s against `balance.loader.totalMs - 2000` = 48 s. Measured by the worker: task+UI 635 640 B, salon 1 203 384 B, kitchen 797 758 B, font 114 640 B, boot sounds about 132 000 B → salon boot about 2.086 MB (about 41.7 s). Mostek scene + furniture as WebP 699 124 B (change.md measurement) → lighter than the salon; worst case unchanged. Add a "fresh install" case (no room + cards about 107 KB). The texture-atlas follow-up (trigger "a third room") fires; take: re-record with `Trigger: tests/bootBudget.test.ts fails or headroom < 2 s`.
- **Room-size cap:** `tests/roomArt.test.ts` limits each room to 1 550 000 B; Mostek 699 124 B fits.

### 4. Art pipeline and deploy smoke

- `scripts/make-task-art.mjs` reads **no manifest**; file names are hard-coded. `ROOM_PACKS` has rows `salon` (`SALON_V2`, `recolourBoard: true`) and `kitchen` (`LOCATIONS_V2`, `recolourBoard: false`); `ROOM_JOBS` map `assets/room/<id>.png` / `assets/furniture/<id>.png` to `public/assets/rooms/<room>/<id>.webp`. The recolour fires only for `BOARD_FILES = ['architecture-before','architecture-after']` (salon names). The pack-existence check iterates `ROOM_PACKS.map(r => r.pack)`.
- New row: root `designs/bystrow-space-base-v1`, `{ room: 'bridge', scene: ['bridge-before','bridge-after','bridge-shadows'], decor: [], furniture: 18 × 'bridge-{console,chair,telescope,shelf,rug,plants}-{natural,sunny,mint}', recolourBoard: false }`. Background corners and edges are `(255,245,223,255)` = `#FFF5DF` (worker checked with Pillow; README § Manifest i integracja) → no board, `false`.
- Manifest vs locations-v2: same `schemaVersion: 1`, `families`, `rooms.<id>.{backgroundBefore, backgroundAfter, shadows, slots[]}` with `x, y, width, height, z, targetRect, sourceSceneRect, visibleRect, anchor, variants`. Differences: no top-level `font`, no `rooms.bridge.maths`, new `bases`/`choices`; all six groups are slots (no decor). z order: rug 5, shelf 15, telescope 18, console 20, chair 30, plants 40. `bases.base-1.label` reads "Baza księżycowa" (PRD says "Baza kosmiczna"; the game draws PRD wording, nit for S-29).
- Room data follows the kitchen: `ROOM_SCENE_FILES` row (`src/data/roomArt.ts`, or `roomArt` throws), slot frames from the manifest, `tests/roomArt.test.ts` needs `tests/fixtures/room-art-bridge.json`, the per-room count line (bridge 21 = 3 scene + 18), header-size checks, Polish labels without `-`/`/`, gender-matched variant names (`pl.room` like the kitchen: pulpit/fotel/teleskop/regał masculine "Naturalny…", mata/kapsuła feminine "Naturalna…").
- **Choice cards:** 720×480 RGBA, labels not in the picture (README). Recommended: a new small table (e.g. `src/data/choiceArt.ts`, output `public/assets/choice/`) loaded at boot only under `needsPlacement`, with a stand-in drawn in code when missing (DESIGN-GAP). Rejected: `UI_ART` (loaded at every boot, +about 106 KB for every returning player; `tests/uiArt.test.ts` orphan/size/label checks would apply).
- **Deploy smoke:** `scripts/check-deploy.ts` runs `precacheCovers` (`scripts/deploy-check/parse.ts`) per table when a SHA is given: `TASK_ART`, `UI_ART`, `FONT_URL`, `ROOM_ART`, `HOUSE_ART`, boot `SOUNDS`. `ROOM_ART = Object.values(ROOMS).flatMap(roomArt)` → Mostek covered with no smoke change. A new card table needs one `record(precacheCovers('choice pictures', ...))` line. Precache glob `**/*.{js,css,html,png,webp,ogg,m4a,woff2,ttf}` (`vite/config.shared.mjs`) covers any WebP. `roomArtCheck` is dead code (used only in `tests/deployCheck.test.ts`).

### 5. FR-049 and FR-050 proofs

- **FR-049 (unit):** `tests/fixtureLoadPath.test.ts` pattern on the real load path with frozen `save-v5-salon.json` (learner + salon + stars): decodes to v6, `house.id === 'house-1'`, same stars/rooms/stage, `needsPlacement(learner) === false`, `backup-v5` written; plus a `BootScene` routing guard (no new condition for a save with a learner). **(browser):** `?e2eSave=v5-salon` seam: `E2ESaveSeam`/`E2E_SAVE_SEAMS` and `e2eSaveStore` in `src/testing/e2eHook.ts`, marker `'v5-salon'` in `E2E_HOOK_MARKERS` (`vite/e2eHookGuard.mjs`; a bare `'v5'` would risk false matches in `dist/`); spec asserts no welcome/choice screen, house-1, and `writtenVersion === SAVE_VERSION`. Two real builds stay re-recorded (rooms-as-data follow-up 10, decision P-6 precedent).
- **FR-050:** `buildAdaptiveRound` (`src/core/curriculum.ts`) takes stage, previous, adaptation, weights, rng, rules, tileCount, art, options — no room/house. `TaskScene.freshRound` inputs: `artHealth.missingIds` (TASK_ART only, set in `BootScene`), `buildWarmup`, `nextKind()` (`nextRoundKind` over variants, `today`, the puzzle pool, `wordAvailable(..., MINIGAME_WORDS)`), puzzle/word/dice builders, `pictureMode(learner, month)`; `this.rng = createRng(Date.now() >>> 0)`. Only `SalonBackdrop` reads `currentRoom`/`rooms`, without the rng. **Risk:** `MINIGAME_WORDS` (`src/data/minigames.ts`) = `['SOFA','DYWAN','STOLIK','KOMODA','FOTEL','OBRAZKI']`, picked by `buildWordRound` with `rng.pick`; base-specific words would make tasks diverge → keep one shared list. Test: sessions after choosing Dom and Baza (same stars, learner, variants) → for seeds 1..20, `buildAdaptiveRound`, `buildWarmup`, `nextRoundKind`, `buildWordRound` deepEqual; a source guard in the style of `tests/freshRoundWiring.test.ts` that `freshRound` reads no `house`/`currentRoom`/`rooms`; the choice writes nothing into learner, variants or stars.

### 6. Mostek prices (FR-044)

- Salon (12 tasks): 5, 7, 9, 10, 12, 13, 15, 8, 10, 12, 13, 15 = 129 (pinned in `tests/roomsData.test.ts`); kitchen (7): 5, 7, 9, 10, 12, 13, 15 = 71.
- PRD FR-044 says "ceny są wyższe niż w salonie, tak że suma … podobna do salonu (ok. 100)". The "ok. 100" predates S-16d's five extra salon tasks (salon now 129), so the PRD is internally stale; the binding numbers are scope.md's "about 100" and "higher than the salon".
- `tests/roomsData.test.ts` caps every task at 5–15 and the first at `cleanRound` = 7. Seven tasks under that cap reach at most 7 + 6 × 15 = 97 and cannot all exceed the salon at the same index (the salon's 7th is 15).
- **Recommended:** stage 6, console 10, chair 13, telescope 14, shelf 17, rug 19, plants 21 = **100**; each above the salon's task at the same index; the first ≤ 7. Widen the test cap to a named maximum (e.g. 21, in data/balance terms) and keep the first-task rule. Alternative within the cap: 7/13/14/15/15/15/15 = 94 (flat, fails "higher than the salon" at the 7th) — rejected.

## Code References

- `src/core/save.ts` — `SAVE_VERSION`, `MIGRATIONS`, `decodeSave`, `validHouse`, `saveProblem`, `writeVerdict`, `freshSession`
- `src/core/migrations/house.ts` — `HOUSE_V5`, `copyOfHouseV5` (frozen v5 step)
- `src/core/autosave.ts` — `replaceGate`, backup copy policy
- `src/storage/idb.ts` — `guardedPut`, `backup`, `readBackups`
- `src/core/saveFile.ts` — `parseImport`, `exportFileText`
- `src/main.ts` — load path (`repairCurrentRoom`, unknown-house warn, `mergeHouse`, `nextRoom`), `freshSession(FIRST_HOUSE)`, narrator creation, `setdata`/`changedata` autosave listeners
- `src/scenes/WelcomeScene.ts` — `create`, `choose`, `openParent`, `start`
- `src/core/placement.ts` — `needsPlacement`, `firstRoundDone`, `ageBackOffered`, `placeByChild`, `placeByParent`
- `src/scenes/TaskScene.ts` — `renderAgeBack`, `backToAge`, `freshRound`, `nextKind`
- `src/scenes/BootScene.ts` — `bootQueue` groups, scene choice by `needsPlacement`
- `src/data/houses.ts` — `HOUSES`, `FIRST_HOUSE`, `HOUSE_GEOMETRY`; `src/core/house.ts` — `houseLayout`, `nextRoom`, `houseRoomList`
- `src/data/rooms.ts` — `ROOMS`, `FIRST_ROOM`, salon/kitchen task costs; `src/core/rooms.ts` — `repairCurrentRoom`
- `src/data/roomArt.ts` — `ROOM_SCENE_FILES`, `ROOM_ART`, `bootRoomArt`; `src/ui/roomArtLoader.ts`
- `src/scenes/RoomScene.ts` — house button, `moveAfterDone`; `src/core/celebration.ts` — `celebrationView`
- `src/data/minigames.ts` — `MINIGAME_WORDS`; `src/core/curriculum.ts` — `buildAdaptiveRound`
- `scripts/make-task-art.mjs` — `ROOM_PACKS`, `ROOM_JOBS`, `BOARD_FILES`, `UI_JOBS`
- `scripts/deploy-check/parse.ts` — `precacheCovers`; `scripts/check-deploy.ts`
- `src/testing/e2eHook.ts` — `E2E_SAVE_SEAMS`, `e2eSaveStore`; `vite/e2eHookGuard.mjs` — `E2E_HOOK_MARKERS`
- Tests: `tests/roomsData.test.ts`, `tests/bootBudget.test.ts`, `tests/roomArt.test.ts`, `tests/uiArt.test.ts`, `tests/fixtureLoadPath.test.ts`, `tests/save.test.ts`, `tests/saveV5.test.ts`, `tests/freshRoundWiring.test.ts`; e2e `tests/e2e/support/welcome.ts`, `tests/e2e/rooms-as-data.spec.ts`

## Architecture Insights

- The building is already in the save as `house.id`; the house functions in `src/core/house.ts` are parameterised; the remaining single-building assumptions are `FIRST_HOUSE`/`FIRST_ROOM` fallbacks at callers and one test. "The base is data" holds with no scene branch except a data-driven condition on `HOUSE_GEOMETRY` for the zoom-out button.
- Save versioning is generic in the version number (backups, notes, import); a bump is cheap and a field would only duplicate `house.id`.
- `WelcomeScene.start` is a single choke point for both placement paths, which makes the choice a local insertion.

## Historical Context (from prior changes)

- `context/archive/2026-10-30-rooms-as-data/plan.md` — v5 bump pattern: phase 1 freezes the old-version fixture while code is still old; phase 2 frozen migration + new fixture + moved pins + deliberate breaks (oracles are literals/frozen fixtures, never the migration's output); phase 3 load path + `?e2eSave=v4-salon` seam + marker; docs phase with the README rollback note and a `[human]` row; final e2e. Supported for S-28.
- rooms-as-data follow-ups: 8 (GRD-09/S13-06) fires on v6, unrelated → re-record; 9 (SV2-13 lenient `variants`) fires, v6 does not touch `validateSave` for `variants` → re-record; 10 (two real builds) → unit + seam, re-record; 15 (frozen `copyOfHouseV5`) → applies as a rule.
- `context/archive/2026-10-31-kitchen-room/follow-ups/review-fixes.md` item 6 (service-worker install warning): **already closed** by `context/archive/2026-10-31-house-cross-section/follow-ups/review-fixes.md` (redundant-worker warn exists in `src/pwa/registerServiceWorker.ts`); change.md's take "fires" is stale. The open item there is 16 (worker build id), triggered only by a change to `registerServiceWorker.ts`, which S-28 does not need.
- kitchen-room item 5 (texture atlas, trigger "a third room") fires → re-record.
- `context/archive/2026-10-21-post-run-polish/follow-ups/review-fixes.md` N-2 ("Wróć" leaves no trace of the stage change) fires on the `backToAge`/`ageBackOffered` change → plan decides (a `console.info` on the back is the cheap close).
- `context/archive/2026-10-24-audit-backdrop-fox/follow-ups/review-fixes.md` F4 (`openParent` guard) — the guard is already `this.session?.active()`; the suspender cast still has an `undefined` guard; verify and close in the plan.
- `context/archive/2026-10-22-notebook-polish/follow-ups/review-fixes.md` #16 (JSDoc of `targets` above `backdropState` in WelcomeScene) fires on a WelcomeScene change → cheap, in scope.

## Related Research

- `context/archive/2026-10-30-rooms-as-data/research.md`
- `context/archive/2026-10-31-kitchen-room/research.md`

## Open Questions

1. **Theme back after a purchase in the first round** — recommended: hidden once any room task is done; alternative refund rejected. Plan decides.
2. **Welcome backdrop on a fresh install without boot room art** — plain page colour (existing fallback) vs keep the salon backdrop by booting salon art for fresh installs (violates the "one building" NFR in spirit). Recommended: plain, DESIGN-GAP row.
3. **Cost cap in `tests/roomsData.test.ts`** — widen to a named max (recommended 21) or per-room cap; the plan picks the form.
4. **`ArtImage` for non-task art** — its sizes come from `TASK_ART`; not verified whether it draws a choice card with stand-in. Plan reads `src/ui/widgets/ArtImage.ts`.
5. **Choice-card WebP sizes** — 107 074 B for both measured in `/10x-new` (scratchpad), not by this step.
6. **"Obrazki" room health with no boot room** — the plan must make the health record honest when the `room` group is skipped.
