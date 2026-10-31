<!-- PLAN-REVIEW-REPORT -->
# Plan Review: House cross-section with floors; "Do pokoju" always to the room in renovation

- **Plan**: context/changes/house-cross-section/plan.md
- **Mode**: Deep (code checks done inline, no sub-agent: the risky claims were a handful of targeted reads)
- **Date**: 2026-10-31
- **Verdict**: REVISE → SOUND after the in-place fixes below
- **Findings**: 2 critical, 4 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | WARNING (F2, F5) |
| Blind Spots | WARNING (F3, F4, F6) |
| Plan Completeness | WARNING (F1) |

## Grounding

Grounding: 12/12 paths ✓ (`src/core/roomVisit.ts`, `tests/roomVisit.test.ts`, `tests/roomVisitWiring.test.ts`, `tests/house.test.ts`,
`tests/layout.test.ts`, `tests/bootBudget.test.ts`, `tests/roomArt.test.ts`, `tests/uiArt.test.ts`, `scripts/check-deploy.ts`,
`scripts/make-task-art.mjs`, `src/pwa/registerServiceWorker.ts`, `tests/e2e/kitchen-room.spec.ts`; new files `src/core/houseCells.ts`,
`src/scenes/HouseScene.ts` absent as claimed), symbols ✓ (`loadErrorLine`/`ArtTable`/`TABLE_NAMES` in `src/core/artHealth.ts`;
`FallbackWhere`/`FALLBACK_ORDER`/`DrawnFallbackWhere` in `src/core/artPick.ts`; `roomDone`, `houseLayout`, `houseRoomList`;
`ROOM_LAYOUT.visitButton` 1622,172,256×104; `E2EArtSeam`; `trackStates`; `precacheCovers('room pictures')`; `-I` already in the
art script's python call), brief↔plan ✓ (6 phases, same drivers), Progress↔Phase ✓ (36 rows, one-to-one, `Driver:` on every phase).

### The two unproven claims, checked against `node_modules/phaser` 4.2.1

- **Wake data through `scene.switch(key, data)`: holds.** `ScenePlugin.switch` (src/scene/ScenePlugin.js) queues
  `queueOp('switch', this.key, key, data)`; `SceneManager.processQueue` runs `this[entry.op](entry.keyA, entry.keyB, entry.data)`;
  `SceneManager.switch(from, to, data)` sleeps `from`, then `wake(to, data)` if `to` sleeps, else `start(to, data)`;
  `Systems.wake(data)` emits `Events.WAKE` with `(this, data)`. So the room's `'wake'` listener gets `(sys, data)` and a first
  house open runs `create(data)`. The registry-key fallback is not expected to be needed.
- **DynamicTexture capture under Canvas: holds for drawing.** `DynamicTexture` builds a 2D canvas + `context` under Canvas;
  `render()` → `_renderCanvas`, whose `DRAW` command calls `object.renderCanvas(renderer, object, camera, null)` on the passed
  object (Container → children, Graphics included). `SalonBackdrop` already does this and the Canvas spec sees it drawn. The
  gap is the READ (F3).

### Driver check

Phase 1 `tdd` correct (pure `src/core/houseCells.ts` absent, literal oracles). Phases 2-5 `impl` correct (art/data glue, scene
glue, navigation + moved tests, docs/sweep/visual). Phase 6 `e2e` correct: browser-level risk (switch data, capture, seam),
feature built by phases 1-4, placed after the phase-5 seam sweep, contract `E2E=on`. No driver change.

### Product decisions against the PRD

P5 (roller blind read as FR-038 "sylwetki"; the kitchen shown closed while the salon is in renovation) is a defensible reading of
FR-033 "one room at a time" and is named by `[human]` row 5.7. P6/P7 (back to the room in renovation; copy "Dom"/"Wróć do
pokoju"; top-left back button) are named by `[human]` row 5.8. FR-039 holds by construction (verified in `RoomScene.create`:
`refresh` and `onSleep` both reset `visiting`; the notebook's `scene.switch(SCENE_KEYS.room)` passes no data). Nothing overturned.

### Follow-ups whose `Trigger:` names S-23

kitchen-room 1 (visit button → house: phase 4, gap 180 closed), kitchen-room 12 (house celebration → re-recorded `Trigger: S-24`,
justified: house 1 cannot finish before S-25), kitchen-room 16 (guarded: house button hidden while card/panel), kitchen-room 19
(backdrop: re-recorded, neighbouring view without a kit answer), rooms-as-data 11 (closed cells from the manifest; kids id → S-25):
all included or convincingly deferred. Generic file-change triggers fired by this slice were missing → F6.

## Findings

### F1 — The new e2e spec is not routed to the hook build

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 6 — Changes Required
- **Detail**: `playwright.config.ts` sends a spec to the hook build (`chromium-hook`, port 4397) only when its name is in the
  `ROUND_SPEC` alternation (it lists `kitchen-room`, `canvas-renderer`, …). Phase 6 never edits it, so `house-cross-section.spec.ts`
  would run in the production project without `window.__martynkaE2E` and fail, and the `+5` count would be wrong.
- **Fix**: Phase 6 adds `house-cross-section` to `ROUND_SPEC`; row 6.2 checks with `--list` that the new tests run under
  `chromium-hook` only.
- **Decision**: FIXED (in plan.md)

### F2 — Hook snapshot field `house` already exists

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 4 §3 — e2e hook
- **Detail**: `src/testing/e2eHook.ts` snapshot already returns `house:` = the saved `HouseState` from `REGISTRY_KEYS.house`
  (support type `house?: HouseShape | null` in `tests/e2e/support/hook.ts`), asserted by `tests/e2e/rooms-as-data.spec.ts`
  lines 31 and 73 (`expect(loaded.house).toEqual(HOUSE)`). The plan's `house: inHouse() ? house().snapshot() : null` would
  overwrite it and break that spec.
- **Fix**: name the house-view snapshot `houseView`; leave `house` as is.
- **Decision**: FIXED (in plan.md, phase 4 contract)

### F3 — Canvas pixel assert would pass vacuously

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 3 §3 hook surface `pixel(cellId)`; Phase 6 asserts
- **Detail**: the model the plan points at, `SalonBackdrop.pixel()`, returns `null` under Canvas ("async snapshot"). A copied
  `pixel` gives `null` under Canvas, and "not the background colour" is true for `null` — the Canvas case could never go red.
  The oracle is weak under WebGL too: the sky is not in the cell texture, so an empty (transparent) texture is also "not the
  background colour".
- **Fix**: under Canvas read the DynamicTexture's own 2D `context.getImageData` synchronously; the asserts become "non-null,
  alpha 255" (polled). The deliberate break "skip the capture" then turns both pixel asserts red.
  - Strength: uses the Canvas DT's real backing canvas (verified in `DynamicTexture` source: `this.context` with
    `willReadFrequently`); the oracle no longer depends on the sky colour.
  - Tradeoff: one renderer branch in a hook-only reader.
  - Confidence: HIGH — source read.
  - Blind spot: none significant.
- **Decision**: FIXED (in plan.md, phases 3 and 6)

### F4 — "Compute `visiting` before the resets" would be wiped by `refresh`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details; Phase 4 §1
- **Detail**: `RoomScene.create`'s `refresh` starts with `this.visiting = null`. Setting `visiting` "before the existing resets"
  as written means the reset clears it and the house's done-cell tap would open the room in renovation.
- **Fix**: `refresh(data)` replaces its own `visiting = null` with `visiting = houseWakeVisit(…)`, after the other resets and
  before the redraw; `create` calls it without data.
- **Decision**: FIXED (in plan.md)

### F5 — Sleeping task scene's summary targets still reported in the house

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 4 §3
- **Detail**: the hook nulls `nextRound`, `toRoom`, `unlockNext`, `ageBack` only for `inRoom()`. In the house they would be
  reported as tappable, so a spec helper could tap a sleeping button.
- **Fix**: null them for `inRoom() || inHouse()`.
- **Decision**: FIXED (in plan.md)

### F6 — Fired generic follow-ups missing from the phase-5 list

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 §1 follow-ups
- **Detail**: besides the S-23-named ones, this slice changes files that other open follow-ups name as triggers: `RoomScene`
  wake/sleep (notebook-polish §6, L-R11), `registerServiceWorker` (stale-tab-and-health "worker build id"), `check-deploy.ts`
  (salon-load-health M-6), the room miniature (audit-boot-hidden-tab G-3), `artHealth.ts` (save-reason-and-recovery 20,
  load-and-tab-guard A-11, audit-art-renderer 23, stale-tab-and-health 28). Two are already fixed in code (narrator-round-summary
  39: hook nulls summary targets in the room; load-and-tab-guard P-6: registration failure warns).
- **Fix**: phase 5 lists them; each is included, closed as stale with evidence, or re-recorded.
- **Decision**: FIXED (in plan.md)

### F7 — How `HouseScene` reads the `?e2eArt=house` seam

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §3
- **Detail**: the seam reaches scenes through `REGISTRY_KEYS.forcedArt` (`main.ts`; the name is deliberately not an e2e marker).
  Importing `src/testing/` from the scene would leak into `dist/` and fail `e2eHookGuard`.
- **Fix**: named in the phase-3 contract.
- **Decision**: FIXED (in plan.md)

### F8 — Source anchors of existing wiring guards

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 4 §1, §4
- **Detail**: `tests/salonStyleWiring.test.ts` cuts on `const onSleep = (): void => {` and `tests/roomVisitWiring.test.ts` on
  `const refresh = ()`; changing the refresh signature must keep or update those anchors.
- **Fix**: named in the phase-4 contract.
- **Decision**: FIXED (in plan.md)

### F9 — Known risks re-stated with the source evidence

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Known risks
- **Detail**: both "unproven" claims hold in the 4.2.1 source (see Grounding); the browser proof stays phase 6.
- **Fix**: Known risks updated with the call chains.
- **Decision**: FIXED (in plan.md)

## Triage summary

Fixed: F1-F9 (in place, minimal edits; phases, drivers and the 36 Progress rows unchanged). Skipped/accepted/dismissed: none.
Verdict after fixes: SOUND.

VERDICT: PROCEED — the approach (new HouseScene, switch wake data, per-cell DynamicTexture capture) holds in the Phaser 4.2.1 source; two critical wiring gaps (ROUND_SPEC, hook `house` name clash) and four warnings were fixed in plan.md.
