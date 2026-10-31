<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Kitchen, the second room from data, with the parameterised room celebration

- **Plan**: context/changes/kitchen-room/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8
- **Date**: 2026-10-31
- **Verdict**: APPROVED (after the fix commit 82b690c; REJECTED at 8ab15e2 on F1)
- **Findings**: 1 critical, 1 warning, 7 observations

Step of run 2026-10-30-rooms-kitchen (autonomous, no triage questions: the contract's triage rule decided each finding:
CRITICAL fixed, WARNING fixed when cheap, else a follow-up with `Trigger:`). Two read-only subagents (plan drift; safety and
patterns) plus my own pass over the focus risks; every claim below was re-checked against the source.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (small drifts recorded as observations) |
| Scope Discipline | PASS |
| Safety & Quality | PASS after 82b690c (FAIL at 8ab15e2: F1) |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Gate (re-run in this step)

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK, OK (at 8ab15e2 and again at 82b690c) |
| `npm test` at 8ab15e2 | 220 files, 4055 passed = main 4014 + 41. Per-file case delta from base: bootBudget +1 (`it.each` over 2 rooms replaces one case), bootRoomArt +3, celebration +3, celebrationWiring +8, layout +1, reducedMotionWiring +1, roomArtLoader +7, roomDoneCardWiring +2, roomLoad +6, roomVisit +5, roomVisitWiring +4, roomArt 0, roomsData 0 = 41 |
| `npm test` at 82b690c | 4057 passed = 4055 + 2 (the two new roomArtLoader cases) |
| deploy + ops shell tests, `sample` E1-E6 | OK, OK, all six exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test tests/e2e/kitchen-room.spec.ts --workers=1` at 82b690c | 4 passed (2.8m) |
| Deliberate break (re-executed): swap `flush('now')` before `registry.set(currentRoom)` in `RoomScene.moveAfterDone` | `celebrationWiring` "Dalej moves with nextRoom and saves after both registry writes" red; file restored from a copy, 8/8 green |
| RED of the fix | the two new `roomArtLoader` cases failed on the pre-fix code on real assertions (`pending().size` expected 0, received 1), green after |

## Focus risks

1. Runtime room-art loading. Precache: `vite/config.shared.mjs` `globPatterns` includes `webp`, cap 10 MB (largest kitchen file 128 KB);
   `scripts/check-deploy.ts` runs `precacheCovers('room pictures', ..., ROOM_ART)` and `ROOM_ART` is `Object.values(ROOMS).flatMap(roomArt)`,
   so the kitchen is covered. Shared HUD loader: files added while the music loads join the same batch (`LoaderPlugin.addFile` while
   `isLoading()`); the music's `once('addfile')` is consumed by its own synchronous `loader.audio`. Decode failure: see F1 (the
   assumption was wrong; fixed). Room listeners are keyed and removed on settle.
2. "Dalej" order: `moveAfterDone` = `nextRoom` -> `registry.set(rooms)` -> `registry.set(currentRoom)` -> `flush('now')` -> `ensure` ->
   `refreshHealth`, then `redraw`; the e2e move test reloads into the kitchen (green). `nextRoom` is idempotent (`movedFrom: null`).
3. Visit button: `visiting` is runtime only, reset in `create`, wake `refresh` and `onSleep`; the only `registry.set(REGISTRY_KEYS.currentRoom`
   is in `moveAfterDone`; `visitTarget` returns done rooms only, so no task or purchase; a free change writes `rooms[visited]` only.
4. Boot budget: `bootRoomArt(currentRoom)`, `tests/bootBudget.test.ts` `it.each(Object.keys(ROOMS))`; `totalMs` still 50000.
5. Save format: `SAVE_VERSION` 5, `src/core/save.ts` and `tests/fixtures/save-*.json` untouched; `roomLoad`/`roomArtLoader` are outside `SAVE_KEYS`.
6. Reduced motion: `celebrationView` gives `revealMs` 0 and `burstCount` 0; the card's `starBurst` sits behind `burst > 0`; e2e reduced-motion test green.

## Reviewer rows

- 5.6 Teacher read: PASS. Imperatives in the accusative ("Postaw szafki", "Postaw lodówkę", "Postaw stół i krzesła", "Urządź kącik kawowy",
  "Postaw ławkę", "Ustaw naczynia"); variant adjectives agree with each caption (szafki / stół i krzesła / naczynia -> Naturalne,
  Słoneczne, Miętowe; lodówka / ławka -> Naturalna, Słoneczna, Miętowa; kącik kawowy -> Naturalny, Słoneczny, Miętowy); "Kuchnia";
  the two room-neutral lines "Stan pokoju ..." are correct; all 1-3 words, child words, no "zabudowa".
- 5.7 Geometry: PASS. All six `kitchenSlots` rows equal `designs/martynka-locations-v2/manifest.json` `rooms.kitchen.slots` in x, y, width,
  height, z, anchor, visibleRect and variant ids; no decor (the manifest has none); `shadowEllipses` of the manifest unused (the
  `kitchen-shadows` layer is drawn; no contact shadows, as planned).
- 7.10 (CI at ship): stays open; it names job `check` of workflow `CI` and the log lines `Tests +[0-9]+ passed` and `e2e hook: absent \(`.

## Findings

### F1 — A room picture that fails to decode left its room pending forever, and a failing file looped fetch + redraw

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/roomArtLoader.ts `createRoomArtLoader` (`resolved`, `ensure`)
- **Detail**: (a) Phaser 4.2.1 emits `FILE_LOAD` then `File.onProcessError` for an image that does not decode, never `loaderror`
  (`LoaderPlugin.nextFile`; already pinned by `tests/phaserLoaderPin.test.ts`). `resolved` checked only `exists || failed`, so the room
  stayed in `pending` for the session: `refreshHealth` stayed a no-op ("Obrazki" kept the previous room's record), the card tile never
  recorded its fallback, and `onComplete` re-armed itself on every later `complete`. (b) `roomsToLoad` was given only `exists` and
  `failed.delete(key)` ran before re-queueing, so after a fetch failure the settle -> `publish` -> `changedata-roomLoad` -> `RoomScene.redraw`
  -> `ensure([visit target])` chain fetched the file again, without bound, while the room view was open (e.g. a launch in the kitchen with a
  salon file missing from the server or cache).
- **Fix**: `attempted = exists || failed.has || loaded.has` settles a room and is what `ensure` passes to `roomsToLoad`; `failed.delete` dropped;
  a failed key is retried only by a reload (as at boot). Two fake-loader tests (decode failure settles with cause `decode`; a failed key is
  not queued again).
- **Decision**: FIXED — 82b690c

### F2 — Stale comments and gap wording

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/data/layout.ts `REGISTRY_KEYS.roomArtHealth`; src/scenes/BootScene.ts queue-order comment in `preload`; docs/design-gaps.md row 175
- **Detail**: "ArtHealth of the salon pictures, set by BootScene" (now the current room's, also written by `roomArtLoader`); "then the salon and
  the screens"; gap 175 named "Wstaw ..." / "Wymień ..." while the copy is "Postaw / Urządź / Ustaw ..." and said the teacher read was owed.
- **Fix**: comments and row reworded.
- **Decision**: FIXED — 82b690c

### F3 — The catch path of `ensure` detaches another room's listeners

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/roomArtLoader.ts `ensure` (catch)
- **Detail**: `detach()` is chained, so a throw while queueing room B removes room A's listeners too. `load.image` practically never throws.
- **Fix**: detach only this call's listeners.
- **Decision**: DEFERRED — follow-up 14

### F4 — Repeated `once('complete', onComplete)` registrations

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/ui/roomArtLoader.ts `ensure`, `onComplete`
- **Detail**: bounded (does not grow; `detach` removes all), only redundant `publish` calls.
- **Fix**: keep one registration.
- **Decision**: DEFERRED — follow-up 15

### F5 — A card dropped by sleep/wake never runs `moveAfterDone`; burst destroyed at the next redraw, not in `onSleep`

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/RoomScene.ts `create` (`refresh`, `onSleep`)
- **Detail**: unreachable today (the way out is hidden while the card is up); a reload moves the child through the load-time `nextRoom`.
- **Fix**: call the idempotent `moveAfterDone` when a drawn card is dropped.
- **Decision**: DEFERRED — follow-up 16

### F6 — Task backdrop re-captured only on wake

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/scenes/TaskScene.ts `onWake` (`backdropRoomLoad`)
- **Detail**: as planned (F3 of the plan review); kitchen art that lands while the task screen is up shows at the next switch.
- **Decision**: DEFERRED — follow-up 17

### F7 — Small drifts

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/data/layout.ts `ANIMATION.celebration`; src/scenes/RoomScene.ts `moveAfterDone`; src/data/balance.ts `loader` comment
- **Detail**: `burstCount: 22` is a literal, not `ANIMATION.summaryBurstParticles` (follow-up 18); `moveAfterDone` passes `resolve().room.id`
  (visit first) instead of the registry `currentRoom` — safe, the card cannot appear during a visit (no purchase there); the `balance.loader`
  comment keeps the salon's 41.8 s figure, which is still the worst room; the hook tap point is `visitButton`, the plan said `visitTarget()`.
- **Decision**: ACCEPTED

### F8 — Gap row 181 and hook types beyond the plan

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: docs/design-gaps.md row 181; tests/e2e/support/hook.ts; playwright.config.ts `ROUND_SPEC`
- **Detail**: EXTRA but needed (bench join gap, read-only hook types, the new spec on the hook server).
- **Decision**: ACCEPTED

### F9 — Specs to re-run after the fix

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/kitchen-room.spec.ts (re-run here: 4/4), tests/e2e/rooms-as-data.spec.ts, tests/e2e/salon-art.spec.ts, tests/e2e/health-lines.spec.ts
- **Detail**: 82b690c touches only the runtime loader's settle and re-queue rule; the orchestrator's full e2e at the gate covers the rest.
- **Decision**: ACCEPTED

MERGE: CLEAR — the one CRITICAL (runtime room-art decode/retry loop) is fixed in 82b690c with red-then-green tests, the full local gate is green (unit 4014 + 43), kitchen-room.spec 4/4, save format stays v5, and the remaining findings are observations with triggers.
