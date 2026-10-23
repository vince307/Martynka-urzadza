<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Notebook polish (finished maths-A notebook, chunky controls, interface life, plain zero)

- **Plan**: context/changes/notebook-polish/plan.md
- **Mode**: Deep
- **Date**: 2026-10-22
- **Verdict**: REVISE → SOUND after the in-place fixes below
- **Findings**: 2 critical, 3 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | WARNING (F1, F2 — fixed) |
| Blind Spots | WARNING (F3, F4 — fixed) |
| Plan Completeness | PASS |

## Grounding

Grounding: 18/18 paths ✓ (all widgets, scenes, `e2eHook.ts`, `tests/layout.test.ts`, `tests/motion.test.ts`, kit font
in `designs/martynka-maths-A-v1/fonts/`), symbols ✓ (`drawRoomMiniature`, `miniaturePieces`, `onWake`, `endFlyingStars`,
`shake`, `GAME_EVENTS`, `FONT_KEY/FONT_URL/FONT_FAMILY`, `precacheCovers`, `?e2eArt=room`), brief↔plan ✓.
Progress↔Phase: 12/12 phases, every Success Criteria bullet equals its Progress row (script check after the edits), one
`## Progress`, every phase has `Driver:` + `Driver why:`.

Code verification (one sub-agent, Phaser 4.2.1 source + repo, file:line evidence):
- `DynamicTexture.draw` only queues; `render()` is required (`textures/DynamicTexture.js` `render`). CONFIRMED.
- Filters ARE applied inside a DynamicTexture capture on WebGL (`DynamicTextureHandler._draw` → `renderWebGLStep`,
  `components/Filters.js` `renderWebGLFilters`). CONFIRMED — the plan's inference holds; phase 3's ⅛ fallback stays.
- `enableFilters` is a no-op under Canvas (`if (this.filterCamera || !this.scene.renderer.gl) return this`); `filters`
  stays unset. CONFIRMED — the `renderer.type` guard is required.
- Draw x/y semantics differ: WebGL `object.x += x`, Canvas `object.x = x`. NEW (→ F2).
- `drawRoomMiniature` creates images with `scene.add.image` (on the display list) and draws stand-ins on the caller's
  `g`. NUANCE (→ F2).
- No pure "scene picture key" function exists; the rule is inline in `RoomView.render` and `miniaturePieces`
  (`src/ui`), so a `src/core/backdrop.ts` cannot reuse it. CONTRADICTED (→ F2).
- `endFlyingStars` uses `killTweensOf` → `BaseTween.destroy` clears callbacks, so an emit in the chain's `onComplete`
  never fires for a killed star. CONFIRMED (the plan's Key Discovery holds).
- `GAME_EVENTS` go over `game.events`; the counter is set from `registry` `changedata-stars` synchronously. CONFIRMED.
- e2e hook `targets()`/`target()` read stored rects, never object positions. CONFIRMED — zones/hit areas safe.
- `ActionButton.place` / `PageButton.show` call `label.setPosition(absolute)`; `PageButton.setDepth` sets per-object
  depths. NEW (→ F1).
- Keypad entry field is a separate `fieldGraphics` + `fieldText`, wrappable for the bounce. CONFIRMED.

Specific checks from the step prompt:
- Zones never move: ✓ (plan Critical Details; hook reads rects).
- Counter number synchronous: ✓ (`setValue` stays in `onStars`, phase 7 wiring test + phase 12 e2e).
- `prefersReducedMotion` on every new tween: ✓ (`tests/reducedMotionWiring.test.ts` grows per phase).
- Canvas path cannot throw: ✓ after F2 (guarded `addBlur`, draw at (0,0)); gradients source-proven to degrade.
- Font reproducible / license / precache / smoke: reproducible ✓ (byte-identical rebuild row) + F5 version pin;
  license ✓ (OFL kept, name ID 0 kept, renamed); precache ✓ (`ttf` glob, `dist/sw.js` grep); deploy smoke ✗ → F4.
- Backdrop refresh after a purchase: ✓ (`RoomScene.dispatch` always writes a new `rooms` object; reference check on
  wake) + F2 places the check before `onWake`'s stage branch.
- Older-tablet performance: ✓ one 480×270 texture, one quad per frame, capture only at create / wake-after-change.

Drivers: phase 1 `tdd` correct (four absent pure functions with literal oracles); phases 2–11 `impl` correct (drawing,
wiring, tooling, docs — no failing unit test can lead the visuals); phase 12 `e2e` correct (browser-level risks #11/#12,
features built by phases 3–10, after the phase-11 seam sweep, contract E2E=on). No driver change.

Follow-ups whose trigger names this area (change.md table): slashed zero, shared HUD button, star over the "9" key, star
freezing while asleep (pop part), `StarCounter` value never asserted — all taken (phases 6, 7, 10, 11). FontFace limit,
salon sleep items, step indicator dots, `SelectTiles` press, FeedbackBar size — deferral justified (load path unchanged;
`celebrate` code swap only; `SolutionSteps` not restyled beyond `ActionButton`; `SelectTiles` out of scope's control
list) and re-recorded in phase 11. Bare stroke numbers in untouched widgets were not re-recorded → added (O2).

## Findings

### F1 — Pivot trick double-offsets Text and ignores moving rects

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Architectural Fitness
- **Location**: Key Discoveries; Phase 4 `chunky.ts` contract (used by phases 5–8)
- **Detail**: The plan puts face children "at (-cx,-cy)" in a container at the rect centre. That works for a `Graphics`
  (its drawing is relative to its own position) but not for a `Text`, whose position IS its coordinate:
  `ActionButton.place` and `PageButton.show` call `label.setPosition(absolute)`, which inside a centred container lands
  at absolute + (cx,cy). `ActionButton.place` also changes the rect per call, and the contract had no way to move the
  pivot. Inside a container, children's depths stop counting, which breaks `PageButton.setDepth` (used by
  `RoomDoneCard`). Unit tests and e2e (which read stored rects) would stay green while labels draw off their buttons.
- **Fix**: Two-level pivot: outer container at (cx,cy) for scale/rotation/y, inner container at (-cx,-cy) holding
  Graphics and Text with their absolute coordinates; `ChunkyFace.place(rect)` re-centres both and redraws the lip;
  `setDepth` sets lip + outer container; `destroy` destroys both.
- **Decision**: FIXED (plan Key Discoveries + phase 4 Intent/Contract)

### F2 — Backdrop capture details that would fail silently or break boundaries

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 3 (mode rule, widget, wiring); Critical Implementation Details
- **Detail**: (a) Phaser 4 `DynamicTexture.draw` only queues — without `dt.render()` the texture stays empty and the
  backdrop is blank on both renderers. (b) `draw(obj, x, y)` adds x/y on WebGL but overwrites on Canvas — only (0,0) is
  identical. (c) `drawRoomMiniature` adds its images to the display list, so they would flash on screen unless moved
  into an off-list container at once. (d) `backdropMode` in `src/core` was told to "reuse" `miniaturePieces`, which
  lives in `src/ui/widgets/RoomView.ts` — an ESLint boundary violation; no pure key function exists. (e) `onWake`
  branches into `applyParentStage(false)` or `render()`; where the re-capture sits was unspecified.
- **Fix**: Phase 3 now spells out: throw-away `scene.make.graphics({}, false)`, images moved into
  `scene.make.container({x:0,y:0}, false)`, `addBlur` only under `renderer.type === WEBGL`, `dt.draw(container)` with no
  x/y then `dt.render()`; the key from `stagesDone` in `src/core/rooms.ts`, cross-checked in the test against
  `miniaturePieces(...)[0].key`; the reference check at the top of `onWake` before its branch.
- **Decision**: FIXED

### F3 — Phase 10's "Chromium/OTS proof" proves the opposite case

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 10, row 10.4
- **Detail**: Row 10.4 cited `health-lines.spec.ts` as the Chromium acceptance proof, but that spec routes
  `**/fonts/*.ttf` to a 404 and asserts `fontHealth === 'fallback'`; it would pass even if Chromium rejected the modified
  font. No existing spec asserts `loaded`.
- **Fix**: 10.4 now names the real proof — the hook snapshot `fontHealth === 'loaded'` read at the 10.5 visual pass,
  pinned by phase 12 "#11 reduced motion round" — and states what `health-lines` does prove.
- **Decision**: FIXED

### F4 — The deploy smoke does not check the font

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 10
- **Detail**: `scripts/check-deploy.ts` runs `precacheCovers` for `TASK_ART`, `UI_ART`, `ROOM_ART` and boot `SOUNDS` only;
  `precacheServed` HEADs whatever is in `sw.js`, so a font dropped from the precache (renamed file, glob change) would
  not be caught. The step prompt requires the font to be covered by the smoke.
- **Fix**: New phase-10 item 1b: `record(precacheCovers('task font', precache, [FONT_URL]))` inside `if (sha7)`; row 10.3
  greps for it.
- **Decision**: FIXED

### F5 — Byte-identical font rebuild depends on the fontTools version

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 10 build script
- **Detail**: Reproducibility was proven with fontTools 4.61.1 in research; another version can serialise tables
  differently, so "byte-identical rebuilds" holds only on a pinned version.
- **Fix**: The script refuses to run on any other fontTools version (pinned in its header and the commit).
- **Decision**: FIXED

### O1 — D-1 departs from scope.md's literal words without a human row

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: change.md D-1; What We're NOT Doing; row 11.8
- **Detail**: scope.md (the maintainer's pre-agreed words) says "spine with stitch marks" and "a soft lower-right shadow".
  The plan follows the approved kit CSS and screenshots instead (stitch marks only, shadow straight down). That is
  reasonable, since the kit is the approved design and the scope says "as in the kit screenshots", so it is not
  overturned. But it is a deviation from the maintainer's text, and no `[human]` row named it.
- **Fix**: Row 11.8 [human] now asks the maintainer to confirm D-1 explicitly.
- **Decision**: FIXED

### O2 — Bare-numbers follow-up not re-recorded

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 11 follow-ups list
- **Detail**: change.md takes the "bare animation/stroke numbers" follow-up only "where touched"; the remainder had no
  re-recorded entry.
- **Fix**: Added to the phase-11 follow-ups list.
- **Decision**: FIXED

## Triage (autonomous, contract rule 1)

Fixed in plan.md: F1, F2 (CRITICAL); F3, F4, F5 (WARNING); O1, O2 (OBSERVATION). A Canvas-path note was added to
`## Known risks`. No phase was split or merged, and Progress stays consistent (the 10.3, 10.4 and 11.8 texts were changed
in both the phase body and Progress). The approach is not fundamentally wrong: every risky Phaser inference was
confirmed from source, and the corrections are local to phases 3, 4 and 10.

VERDICT: PROCEED — approach confirmed against Phaser 4.2.1 source and the repo; two critical implementation details (two-level pivot, DynamicTexture render/coordinates/boundary) and three warnings fixed in plan.md
