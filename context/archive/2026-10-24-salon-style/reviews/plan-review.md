<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Salon before state in the house clay style, palette board, contact shadows in the empty room

- **Plan**: context/changes/salon-style/plan.md
- **Mode**: Deep (claims checked directly against the code and `node_modules/phaser` 4.2.1; no sub-agent needed for the size of the claim set)
- **Date**: 2026-10-24
- **Verdict**: SOUND (after the in-plan fixes below)
- **Findings**: 0 critical, 1 warning, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING |
| Plan Completeness | PASS |

## Grounding

Grounding: 13/13 paths ✓ (`RoomView.ts`, `RoomScene.ts`, `rooms.ts` core+data, `roomArt.ts`, `make-task-art.mjs`, `make-font.py`,
`SalonBackdrop.ts`, `roomMiniature`/`roomShown`/`roomFixtures`/`phaserLoaderPin` tests, `salon-load-health.spec.ts`), symbols ✓
(`depth.furnishingsBefore` 1 / `shadows` 2 in `ROOM_LAYOUT`, `miniaturePieces` alpha = stand-in alpha not draw alpha, `neededMiniatureKeys`
filters `alpha !== 0`, `#15 H-2` routes `furnishings-before.webp`, `roomArtCheck` takes expected URLs derived from `ROOM_ART`, roomArt
size cap 1 550 000 B), brief↔plan ✓, Progress↔Phase ✓ (33 rows = 4+5+5+5+11+3, one `## Progress`, no checkboxes in phase bodies).

Claims verified against code:
- `gradeMatrix` literal for grade E recomputed by hand from Phaser's `saturate` (`x = 1+2v/3`, `y = -v/3`) and `ColorMatrix.SEPIA`:
  row R = 0.81 × [0.7153, 0.2274, 0.1162] = [0.5794, 0.1842, 0.0941], offset (1−0.9)·128+4 = 16.8 ✓ (oracle independent of the code).
- `contactShadowPieces` literals recomputed from `src/data/rooms.ts`: lamp (897, 487, 155.25, 49.68), plant-left (223, 653, 141.9),
  pouf (605, 932, 233.7), plant-right (1778, 737, 127.2) ✓.
- Phaser 4.2.1: `FilterList#addColorMatrix` exists (`gameobjects/components/FilterList.js`); `filters/ColorMatrix.js` exposes
  `colorMatrix` (`Display.ColorMatrix`); `ColorMatrix#getData` divides indices 4/9/14/19 by 255 (offsets in 0–255) ✓;
  `enableFilters` returns without filters when `!renderer.gl` (Canvas → `filters` null) ✓; `renderNodes/Camera.js` runs
  `internalFilters` from index 0 upward ✓. Nested per-image filters inside the blurred holder of a DynamicTexture draw are not
  provable from source alone — already a Known risk with a named fallback and an e2e oracle (`graded`), accepted.
- Phase 1 driver `tdd`: `gradeMatrix`, `wornPieces`, `contactShadowPieces`, `applyWornGrade` absent from `src`/`tests` ✓.
- Scope guards: worn pieces outside `chosen`/`shownVariants` (hit tests `slotAt`/`holdPoint` unchanged); save untouched (diff
  checks in 1.3 and 3.4); stand-in truth (a missing whole-scene worn layer showed nothing before, a missing worn piece shows nothing
  now; the scene stand-in is unchanged); art health and deploy smoke derive from `ROOM_ART`, so removing the file keeps them
  consistent; boot budget gains ~288 KB of headroom; Python pins available locally (Pillow 12.1.0, numpy 2.4.3).

Driver check: P1 `tdd` (absent pure rules, literal oracles) ✓; P2–P5 `impl` (scene glue, removal, build-time tool, docs/sweep) ✓;
P6 `e2e` after the seam sweep (phase 5), over a feature built by phases 2–3, browser-level risks #16/#12 ✓. No change.

Product decisions: P-1 (grade stronger than scope's numbers, no dust overlay), P-2 (soft extra), P-4 (board colour + Python),
P-5 (no turquoise nudge) each have a `[human]` row (5.6–5.9). Not overturned: research montages back them and scope item 2 lets
research "confirm or pick better".

## Findings

### F1 — Two fired follow-ups recorded as "not fired" (SalonBackdrop.render is edited)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 §1 (`SalonBackdrop.render` counts `graded`) vs Phase 5 §4 follow-up list
- **Detail**: audit-backdrop-fox F6 (`Trigger: the next change to SalonBackdrop.render …`) and notebook-polish 16 (`Trigger: the next
  change to SalonBackdrop …`) fire, because phase 3 edits `render` and `BackdropSnapshot`. Phase 5 re-recorded them as "open (render
  not edited)", which would be false. The items themselves (an e2e pixel tolerance in `backdrop-restore.spec.ts`; Keypad/starBurst/bar
  seams) are outside this change's subject, so deferral is right but must name the fired trigger. Also missing from the list:
  save-observability L-R9 (`Trigger: the next change to RoomScene / stars.ts`) and salon-load-health M-5 (`Trigger: … a change to the
  purchase flow in RoomScene`), both fired by the `RoomScene` edit.
- **Fix**: Phase 5 §4 now records F6 and 16 as fired and re-recorded with the reason, and adds L-R9 and M-5 as re-recorded open.
- **Decision**: FIXED (plan.md phase 5 §4 edited)

### F2 — Canvas wash colour named as a cast of a CSS string

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 §3 (`ROOM_LAYOUT.worn.canvasWash`)
- **Detail**: `PAGE_BACKGROUND` is the string `'#FFF5DF'`; `hexToNumber` lives in `src/ui/widgets/kitDraw.ts`, which `src/data` may not
  import. `PLACEHOLDER_COLORS.ivory` (0xfff5df) is the numeric twin in the same file.
- **Fix**: plan now names `PLACEHOLDER_COLORS.ivory`.
- **Decision**: FIXED

### F3 — Canvas wash with no worn piece drawn

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 §2
- **Detail**: Under Canvas with every salon picture missing the wash would grey the stand-in room for nothing.
- **Fix**: the wash is drawn only when at least one worn image was drawn (one clause in phase 2 §2).
- **Decision**: FIXED

### F4 — Board recolour may change background file sizes

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4
- **Detail**: `tests/roomArt.test.ts` caps the room set at 1 550 000 B and the boot budget at 48 s; the two recoloured backgrounds may
  encode to a different size. Phase 3 frees ~288 KB first and 4.3 re-runs both tests, so the gate catches it.
- **Fix**: none needed (covered by 4.3).
- **Decision**: ACCEPTED

VERDICT: PROCEED — claims hold against the code and Phaser 4.2.1, drivers are right, product departures carry [human] rows; one warning and two observations fixed in plan.md
