<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Fox guide (silent mascot at the corner of the task notebook, PRD FR-037)

- **Plan**: context/changes/fox-guide/plan.md
- **Mode**: Deep (claims checked directly against the code on `feat/fox-guide`, no sub-agent)
- **Date**: 2026-10-23
- **Verdict**: SOUND after the in-plan fixes below (was REVISE-light: 5 warnings, no critical)
- **Findings**: 0 critical, 5 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F2, F3, F5 — fixed in plan) |
| Plan Completeness | WARNING (F1, F4 — fixed in plan) |

## Grounding

Grounding: 7/7 paths ✓ (`src/data/uiArt.ts`, `scripts/make-task-art.mjs`, `src/scenes/TaskScene.ts`,
`src/core/round/pictureLayout.ts`, `src/core/round/dragLayout.ts`, `tests/uiArt.test.ts`,
`tests/reducedMotionWiring.test.ts`; new files absent as expected), 12/12 symbols ✓ (`UI_ART`, `UI_JOBS`, `RoundPhase`,
`pictureLayout`, `answerSpans`, `hintPictureLayout`, `clockSetLayout`, `dragLayout`, `coinLayout`, `notebookGeometry`,
`TALL_MODES`, `TWEENING_FILES`), brief↔plan ✓ (5 phases, P-1..P-11 match). Progress ↔ phases ✓ (24 rows, one per
criterion, no checkboxes in phase bodies). Every phase has `Driver:`; drivers right: p1 impl (pipeline + a guard test
that is green on arrival), p2 tdd (absent pure functions, literal oracles), p3/p4 impl, p5 e2e after the seam sweep
(p4), feature built in p3, contract `E2E=on`.

## Claims verified against the code

- **Placement rects (fox silhouette x 1714.5–1902.6, y 180–400).** Nearest content: tall tiles solution lines
  `picture.tall.tiles.lines` x 560–1700, y 330–690 → 14.5 px (the plan's "≥ 14 px" is this one); `picture.long.*` and
  `tilesSolution.lines` end at x 1684 (30 px); drag/coin tray and OK x 1240–1680 (34.5 px); keypad x ≤ 1636; prompt
  maxWidth 1292 centred → x ≤ 1606; `expressionWide` ≤ 1610; solution steps without a picture: centre 960, width
  `barSpan.tiles` 1270 → x ≤ 1595; ribbon (fromRight 92, width 48) x 1600–1648, y 188–262 (66 px); letters (7 letters max,
  `OBRAZKI`) x ≤ 1494; dice board x ≤ 1601; summary/minigame card/unlock card ≤ 1532. Star counter 1622–1818 × 44–148,
  grown by `counterPopScale` 1.18 → bottom 157.4 (22.6 px). HUD title maxWidth 960 → x ≤ 1440; speaker x ≤ 1598.
- **Settings gear hint bubble.** `SettingsHint` draws upward from `bottom` 936, x 1700–1912, height = wrapped text + 24;
  five to six lines at 32 px put its top near y 690–720 → ~290 px below the fox. ✓
- **Phaser Image without `setInteractive` cannot block taps.** `TaskScene` gestures are scene-level `this.input.on(...)`
  listeners (fire regardless of objects) feeding the drag reducers' own hit tests; Phaser's hit test lists only
  interactive objects; the HUD lives in `UIScene` above. Nothing interactive lies under the fox rect. ✓
- **SalonBackdrop capture cannot include the fox.** `SalonBackdrop.render` draws only `drawRoomMiniature` images into an
  off-list container (`make.container(…, false)`) into a DynamicTexture; the shown image is depth `BACKDROP.depth` −10,
  re-added on wake below the fox (depth 0, created after `drawNotebook`, no widget sets a depth). ✓
- **Pose mapping.** `RoundPhase` = first | second | solution | retype | done (`src/core/round.ts`); retype after the
  solution → think, a correct retype → `done` → cheer; every round kind (ordinary, warm-up, puzzle, word, dice) uses the
  same machine; every phase change ends in `render()` (`submit`, `advance`, `step`, `beginRound`, wake, parent stage);
  `render()`'s early returns are the unlock branch and the summary/done-card branch (plus an unreachable `never`
  default). The plan's "call before the first return" is right. ✓
- **Boot budget arithmetic.** Re-measured on disk: tasks 473 968 + rooms 1 489 688 + ui 119 288 + font 114 640 + 12 boot
  M4A 132 243 = 2 329 827 B → 46.6 s at 50 000 B/s; + 42 384 B → 47.4 s ≤ 48 s. ✓
- **bootBudget test determinism in CI.** It reads only committed `public/` files (`git ls-files public/assets`: tasks 41,
  rooms 38, sounds 26, ui 5 + `public/fonts/MartynkaNext.ttf`) through the boot tables; it never touches `designs/`. ✓
- **make-task-art without the fox pack.** The script already `process.exit(1)`s when `KIT` or `SALON_V2` is missing; the
  plan adds `FOX` to that check, so without `designs/martynka-fox-guide-v1` `npm run art` stops with "Art kit not
  found" before converting anything. Consistent with the existing contract (designs/ is local only; CI never runs
  `npm run art`); the pack is present on this machine (checked) — see F7 for the docs line.

## Follow-ups whose trigger this slice meets

- `2026-10-16-child-flow-guards` "`modeWidgets` not yet the only mode switch" (Trigger: next change to
  `TaskScene.render`): fires; deferral convincing (the fox reads the phase, never the mode; scope item 8 forbids
  unrelated refactors) and the plan keeps it open in phase 4's follow-ups. ✓
- `2026-10-12-narrator-round-summary` "e2e hook targets while the room is open" (Trigger: next change to
  `src/testing/e2eHook.ts`): does not fire as planned (the hook spreads `TaskSnapshot`); the plan now says to take it if
  the file is edited after all (F4).
- BootScene triggers (F3, G-2.., `UI_MISSING_URL`, S14-08): not fired, `BootScene` is not edited. ✓
- No follow-up names the fox/FR-037 (grep over `context/archive/*/follow-ups/`).

## Product decisions vs PRD

FR-037 "w rogu zeszytu" vs the margin astride the corner (P-2) and "180–240 px" read as the silhouette (P-1): defensible
(no inner corner is free in every mode, verified above) and named in `[human]` row 4.6. Cheer on the summary, hidden on
the unlock card (P-5) stays inside scope.md item 2; cheer on a 0-star summary is in `[human]` row 4.7. Nothing clearly
wrong; nothing overturned.

## Findings

### F1 — Geometry test calls `pictureLayout` with the wrong argument order and a throwing combination

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 § 4 Tests
- **Detail**: The plan wrote `pictureLayout(spec, input, shape, solution)`; the real signature is `(spec, input, solution,
  shape, skillId?)`. It also asked for every `ANSWER_MODES` × {wide, tall, long}, but `tallOf` throws for drag, select and
  digits (`TALL_MODES` = tiles, keypad).
- **Fix**: argument order corrected; tall iterated over `TALL_MODES` only.
- **Decision**: FIXED (plan.md Phase 2 § 4)

### F2 — `setDisplaySize` before the texture is known scales a later pose wrongly

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 3 § 1 Widget
- **Detail**: `setDisplaySize` stores `scaleX = displayWidth / frame.width`. An image created on a missing key (the idle
  pose cut by the boot limit, `?e2eArt=ui`) gets the 32 px `__MISSING` frame → scale 10; a later `setTexture` to a 384 px
  pose keeps scale 10 and draws a 3840 px fox over the whole task. The plan said only "display size `GUIDE.displaySize`,
  created hidden".
- **Fix**: re-apply `setDisplaySize(GUIDE.displaySize, …)` after every `setTexture` and take the pop's base scale from it;
  never size while the texture is missing.
  - Strength: one rule covers create, partial cut loads and pose swaps.
  - Tradeoff: none measurable.
  - Confidence: HIGH — Phaser's Size component semantics (scale relative to the current frame).
  - Blind spot: the phase-5 e2e only covers "all UI art missing"; a single missing pose stays a unit/visual concern.
- **Decision**: FIXED (plan.md Phase 3 § 1)

### F3 — The 1.06 pop shrinks every clearance below the test's 12 px

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 § 4 Tests
- **Detail**: Scaled about the feet, the silhouette reaches x 1709.9–1909.3, y 166.8: 9.85 px from the tall solution
  lines, 10.7 px from the right edge, 9.4 px from the popped star counter (both pop at a correct answer). No overlap,
  but the test proved only the rest pose.
- **Fix**: the test also asserts the popped rect keeps ≥ 8 px from the right edge, the tall lines and the grown counter.
- **Decision**: FIXED (plan.md Phase 2 § 4)

### F4 — The e2e `Snapshot` interface is hand-written and was not in the plan

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 § 2 Scene
- **Detail**: `tests/e2e/support/hook.ts` declares `interface Snapshot` by hand (e.g. `backdrop?`), not from
  `TaskSnapshot`; phase 5's `guide.*` reads would not type-check.
- **Fix**: phase 3 adds `guide?` to that interface; also notes the e2eHook.ts follow-up to take if that file is edited.
- **Decision**: FIXED (plan.md Phase 3 § 2)

### F5 — No rule when the real fox bytes break the new budget test in phase 1

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 1 § 3 / Known risks
- **Detail**: The budget leaves 0.56 s spare over research's 42 384 B estimate; the bytes are known only after
  `npm run art`. An agent finding it red had no instruction and might lower `HEADROOM_MS` or raise `totalMs`.
- **Fix**: Known risks: step down to 352² then 320², re-measure, record; never touch `totalMs`/`HEADROOM_MS`; still red →
  BLOCKED.
- **Decision**: FIXED (plan.md Known risks)

### F6 — "Obrazki" UI sentence says a caption or drawing replaces a missing picture

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 § 4 / Phase 4 § 3
- **Detail**: `pl.settings.uiArtMissing` ends "zamiast obrazka jest napis lub rysunek"; a missing fox shows nothing.
  Parent-facing, minor; scope item 8 forbids a text change.
- **Fix**: recorded in Known risks, DESIGN-GAP 168 and a phase-4 follow-up with a trigger.
- **Decision**: RECORDED

### F7 — `npm run art` now needs a third local pack

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 § 1
- **Detail**: Correct and consistent behaviour (exit 1 with "Art kit not found"), but CLAUDE.md's Commands line for
  `npm run art` names only the maths kit.
- **Fix**: phase 4's rule-file intent now includes that line.
- **Decision**: FIXED (plan.md Phase 4 § 1)

### F8 — "A tap on the fox changes nothing" is green without the feature

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5
- **Detail**: With nothing interactive under the rect the test passes on any build; its proof is the planned deliberate
  break (`setInteractive` + `pointerdown` → `advance`) plus `interactive === false` and the rect equality. Adequate.
- **Decision**: RECORDED

### F9 — Phase 4's visual matrix is large for one agent

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: Phase 4 row 4.5
- **Detail**: ~22 states × 2 widths; reachable through the existing hook seams (`?e2eSkills`, `?e2eVariant`,
  `?e2eArt=ui`) and a throwaway Playwright spec (profile § 8). Kept; the phase's code part is small.
- **Decision**: RECORDED

VERDICT: PROCEED — the approach holds against the code (placement clear in every mode and phase, decorative image cannot take input, backdrop capture excludes it, pose map complete, budget arithmetic and CI determinism verified); five warnings fixed in plan.md, no critical.
