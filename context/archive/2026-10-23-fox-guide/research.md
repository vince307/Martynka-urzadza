---
date: 2026-10-23T15:30:00+02:00
researcher: Claude (autonomous run 2026-10-23-fox-guide, step /10x-research)
git_commit: b72319e09cbaf757619f12db3e62ad4d46015117
branch: feat/fox-guide
repository: vince307/Martynka-urzadza
topic: "Fox guide (PRD FR-037): placement, screens, pose rule, motion, art pipeline, input, e2e"
tags: [research, fox-guide, TaskScene, layout, uiArt, make-task-art, e2eHook]
status: complete
last_updated: 2026-10-23
last_updated_by: Claude (autonomous run)
---

# Research: fox guide (PRD FR-037)

**Date**: 2026-10-23 · **Git Commit**: `b72319e` · **Branch**: `feat/fox-guide` · **Repository**: Martynka-urzadza

## Research Question

From `change.md` (claims table, D-3..D-5) and `context/runs/2026-10-23-fox-guide/scope.md` items 1–8: where exactly the
fox sits and at what size in the 1920 × 1080 scene, clear of every element of the task screen in every answer mode and
phase; on which screens it shows; how the pose follows the round; how it moves (≤ 300 ms, none under reduced motion)
without entering the salon backdrop capture; how the three poses enter the art pipeline; that it never takes input;
what the e2e hook exposes. Anchors are file + symbol (no line numbers, per the run contract).

## Summary

- **Placement (a):** the fox stands in the **right margin at the notebook's top-right corner, astride the frame**:
  anchor (feet) at scene **(1792, 400)**, origin `(0.5, 0.87890625)` (the pack's anchor 512, 900 of 1024), image shown at
  **320 × 320 scene px (the canvas)**, so the **silhouette is about 188 × 220 px** (union of the three poses' solid
  bounds: x 1714–1903, y 180–400). "180–240 px" is read as the **silhouette height** (ears to base, cheer star
  included); 220 is inside the range. No inner corner of the notebook face is free at that size in every mode (the
  claims table in `change.md` and the rect list below); the top-right margin is free of every listed rect with ≥ 14 px
  clearance. The largest size that fits this spot is a 333 px canvas (silhouette ≈ 196 × 229). If the maintainer meant
  the canvas, 240 px canvas (silhouette ≈ 141 × 165) at the same anchor also fits.
- **Screens (b):** show the fox on the task screen of every round kind (ordinary, warm-up, daily puzzle, word, dice) and
  on the round's end screen (`SummaryPanel`, and `MinigameDoneCard`, which is the word/dice round's summary), always in
  the **cheer** pose there; **hide it on the unlock card** (`UnlockCard`, the card's own notebook picture is the hero).
  Minimal: one Image created once in `TaskScene.create`, never moved.
- **Pose (c):** a pure function of the screen and the round `phase` (`RoundPhase` in `src/core/round.ts`): `first` →
  idle, `second` / `solution` / `retype` → think, `done` → cheer; summary/done card → cheer; unlock → hidden. No new state,
  no save field. One update point: the end of `TaskScene.render`.
- **Motion (d):** on a pose change, `setTexture` + a soft scale pop (base × 1.06, yoyo, 240 ms total, `Sine.easeOut`),
  no breathing; under `prefersReducedMotion()` only `setTexture`. The fox is never in the backdrop texture
  (`SalonBackdrop.render` draws only freshly built room-miniature pieces).
- **Art (e):** three **384 × 384** WebP (cwebp `-q 85 -alpha_q 100 -m 6`, measured 13 598–15 086 B each, 42 384 B
  together) through a third kit root in `scripts/make-task-art.mjs`; three `UI_ART` rows with `label: ''`; whole
  canvas kept, never trimmed.
- **Input (f):** a plain `Image` without `setInteractive` is not in Phaser's hit list; the fox sits over no control anyway.
- **E2E (g):** `TaskSnapshot.guide = { pose, visible, rect, interactive }`, new spec `tests/e2e/fox-guide.spec.ts`.
- **Phases:** 1 art + table (impl), 2 pure pose + geometry (tdd), 3 widget + scene + hook + design gaps (impl),
  4 e2e spec (e2e).

## Detailed Findings

### (a) Placement and size

**Art facts** (`designs/martynka-fox-guide-v1/README.md`, `manifest.json`, `qa-report.json`, read 2026-10-23): 1024 ×
1024 RGBA, common anchor (512, 900). Solid bounds: idle x 325–862, cheer x 264–866, think x 324–865; top y 200 / 200 /
196; bottom y 900 for all three. **Union** (the box the geometry must keep clear for any pose): x 264–866, y 196–900, i.e.
relative to the anchor −248 … +354 horizontally and −704 … 0 vertically, in 1024-units. The silhouette is right of the
anchor's x (the pack centred the canvas, not the body).

**Scale.** With display canvas `C` px, `s = C / 1024`; silhouette = `602 s` wide × `704 s` tall.

| canvas C | silhouette w × h | note |
|---|---|---|
| 240 | 141 × 165 | "180–240" read as canvas: too small to read the paw-at-chin of think (inference) |
| **320** | **188 × 220** | **recommended**: silhouette height inside 180–240 |
| 333 | 196 × 229 | largest canvas at this spot (width limit, below) |

**Notebook and margins** (`TASK_LAYOUT.notebook` left 180, top 204, 1560 × 788 → outer x 180–1740, y 204–992; border 16;
`notebookGeometry` face 196–1724 × 220–976; `NOTEBOOK.ribbon` → x 1600–1648, y 188–262). The right margin is x
1740–1920.

**Chosen rect** (silhouette union at C = 320, anchor (1792, 400)): x **1714.5–1902.6**, y **180–400**. The image's own
320 × 320 box (x 1632–1952, y 119–439) is transparent outside the silhouette; the geometry test uses the silhouette
union, not the canvas box (the canvas box would overlap the star counter's lower edge with transparent pixels only, and
the HUD scene draws above anyway).

**Every rect the fox must clear**, with source symbol and the clearance at the chosen rect (all scene px; "x ≤ N" means
the rect's right edge):

| rect | source symbol | extent that matters | clearance |
|---|---|---|---|
| prompt (centred) | `TASK_LAYOUT.prompt` (x 960, maxWidth 1292) | x ≤ 1606 | 108 px left |
| prompt beside keypad, expression | `TASK_LAYOUT.promptBeside`, `expression` | x ≤ 1000 | far |
| wide expression | `TASK_LAYOUT.expressionWide` (maxWidth 1300) | x ≤ 1610 | 104 |
| answer tiles | `TASK_LAYOUT.tiles` (top 712, h 136), centred in the notebook or in `answerSpans` | y 712–848 | y-disjoint (fox ends at 400) |
| keypad | `TASK_LAYOUT.keypad` (left 1120, width 516, top 342) | x ≤ 1636, y 342–~934 | 78 |
| select tiles + OK | `TASK_LAYOUT.select` (top 600, OK y 800) | y ≥ 600 | y-disjoint |
| drag tray / OK / mat / solution lines | `TASK_LAYOUT.drag` (`tray` 1240–1680 × 380–680, `ok` y 724–820, `mat` = `DRAG_MAT`, `solutionLines` = `DRAG_SOLUTION_LINES` 1240–1680 × 380–820) | x ≤ 1680 | 34 |
| coin tray / OK / wallet | `TASK_LAYOUT.coinDrag` (`tray` x ≤ 1680; `wallet` 314–1108 × 380–905) | x ≤ 1680 | 34 |
| clock to set | `clockSetLayout` (`src/core/round/pictureLayout.ts`) over `TASK_LAYOUT.drag` mat/ok/solutionLines | x ≤ 1680 | 34 |
| digits column + lines | `TASK_LAYOUT.picture.digits` (x 314–1020, y 340–848) | x ≤ 1020 | far |
| TaskPicture rects | `TASK_LAYOUT.picture` `tiles`, `tilesSolution`, `keypad`, `keypadSolution`, `select`, `long` (x ≤ 1684), `drag` | x ≤ 1684 | 30 |
| tall drawing column + lines + answers + bar | `TASK_LAYOUT.picture.tall` (`tiles.lines` 560–1700 × 330–690, `tiles.bar` 560–1700, `answers` 540–1724 at the tiles row) | x ≤ 1700 (lines, bar); answers row y ≥ 712 | 14 (lines); answers y-disjoint |
| hint number line + its lines | `TASK_LAYOUT.picture.hint.keypad` (x 314–1110), `hintPictureLayout` | x ≤ 1110 | far |
| hint/solution bar and "Dalej" | `TASK_LAYOUT.bar` (bottom 960, h 96) in `TASK_LAYOUT.barSpan` (`tiles` 355–1625, `keypad` 310–1020) or `tall.*.bar` (≤ 1700) | y 864–960 | y-disjoint |
| solution step lines | `TASK_LAYOUT.solution` inside the `*Solution`/`lines` rects above | x ≤ 1700 | ≥ 14 |
| progress beads | `TASK_LAYOUT.dots` (centre 960, y 96), `BEADS` (r 28, pitch 74; 6 beads in the warm-up → x 745–1175) | y 68–124 | far |
| HUD "Do pokoju" | `HUD_LAYOUT.roomSwitch` 104–420 × 44–148 | left side | far |
| HUD speaker | `HUD_LAYOUT.speaker` 1494–1598 × 44–148 | x ≤ 1598 | far |
| HUD star counter (+ pop) | `TASK_LAYOUT.starCounter` 1622–1818 × 44–148; `ANIMATION.counterPopScale` 1.18 → bottom ≈ 157 | y ≤ 157 | 23 px above the fox |
| settings gear | `HUD_LAYOUT.settings` 1782–1878 × 952–1048 | y ≥ 952 | far |
| settings hint bubble | `HUD_LAYOUT.settingsHint` (right 1912, bottom 936, width 212 → x 1700–1912; height = text + 24, five lines of 32 px, `SettingsHint` constructor) | top ≈ 712 (measured from the text at run time; a 6-line × 1.4 bound gives top ≥ 643) | ≥ 243 below the fox |
| "Wróć" | `TASK_LAYOUT.ageBack` 16–164 × 880–976 | left margin | far |
| build id | `TaskScene.create` text at (`PLACEHOLDER_FRAME.margin`, `GAME_HEIGHT − margin`), origin (0, 1) | bottom left | far |
| bookmark ribbon | `notebookGeometry().ribbon` x 1600–1648, y 188–262 | x ≤ 1648 | 66 |
| summary title / stars / +N / bonus / buttons | `SUMMARY_LAYOUT` (buttons 454–1390 × 816–944; stars row from 656) | x ≤ 1390 | far |
| unlock card | `UNLOCK_LAYOUT.card` 388–1532 × 284–944 | x ≤ 1532 | far (fox hidden there anyway) |
| minigame letters | `MINIGAME_LAYOUT.letters` (132 + 24 gap, centred 960); longest word `OBRAZKI` (7) in `MINIGAME_WORDS` → x 426–1494 | x ≤ 1494 | far |
| dice, board, done card | `MINIGAME_LAYOUT.dice` (centre 960), `board` (left 361, 7 × 160 + 6 × 20 → x ≤ 1601), `card` 440–1480 | x ≤ 1601 | 113 |

So the band x ≥ 1714, y 160–643 contains, among the rects above, only the notebook frame and paper edge (decoration).
The fox overlaps the frame's right strip (x 1724–1740) and 10 px of paper face (x 1714–1724) at y 220–400: that is the
"astride the corner" look D-3 allowed. Width limit: canvas edge 1920 minus 12 px margin = 1908, content edge 1700 + 12
= 1712 → silhouette ≤ 196 wide → C ≤ 333.

Rejected spots (observed in the table): bottom-right corner (bar/“Dalej” to x 1700 at y 864–960, the hint bubble over the
right margin y ≈ 712–936, the gear 952–1048); bottom-left (stitches x 236–262, "Wróć" 880–976, build id ≈ 1016–1056,
wallet / tall picture from x 314 down to y 905/960); top-left (prompt/margin line, "Do pokoju"); top edge above the
notebook (star counter bottom 148 → only 56 px to the notebook top 204).

**Geometry test (proposal).** Pure module `src/core/guideLayout.ts` (imports `src/data/layout.ts` like
`notebookGeometry` does): `guideRect(guide = GUIDE): Rect` = silhouette union scaled at the anchor. Test
`tests/guideLayout.test.ts` asserts, with a 12 px gap, that `guideRect()` is disjoint from: the rects of the table, taken
from the constants **and the real layout functions** — `pictureLayout(spec, input, shape, solution)` for every
`ANSWER_MODES` × {wide, tall, long} × {false, true}, `hintPictureLayout`, `answerSpans` (tall tiles and keypad),
`clockSetLayout(TASK_LAYOUT.drag, …)`, `dragLayout`/`coinLayout` for the max kinds, the keypad's computed bottom, the
bar spans of `TASK_LAYOUT.barSpan` and `tall.*.bar`, `notebookGeometry().ribbon` bbox, `HUD_LAYOUT` rects (star counter
grown by `counterPopScale`), a bound of the settings bubble, `letterRow(max word length, …)`, the summary/minigame/
unlock rects; and that it lies inside the 1920 × 1080 scene and touches the notebook's right frame (x 1740 inside the
rect, top within 40 px of the notebook top) so "in the corner" stays true if tokens move. A `never`-guarded switch over
`ANSWER_MODES` makes a new mode fail the test until its rects are listed (pattern of `modeWidgets`).

### (b) Screens

`TaskScene.render` branches (observed): unlock card (`unlockView()`) → else summary (`currentSummary()`; word and dice
→ `MinigameDoneCard`, others → `SummaryPanel`) → else the task layer. Every round kind — `RoundKind` 'round' (ordinary
and warm-up, `this.warmup`), 'puzzle', 'word', 'dice' — uses the same `RoundState` machine and notebook
(`freshRound`, `applyRound`). The puzzle draws like a task; word adds `LetterTiles` at the top; dice draws `Dice` and
`CoverBoard` (x ≤ 1601). Recommendation (minimal, D-4 refined):

| screen | fox | pose |
|---|---|---|
| task layer, any kind | shown | phase rule (c) |
| `SummaryPanel` | shown (scope: "may cheer on the round summary") | cheer |
| `MinigameDoneCard` (word/dice end) | shown — it is those rounds' summary | cheer |
| `UnlockCard` | hidden — scope names only task + summary; the card has its own picture (`UI_ART` notebook) | — |
| Welcome, Room | not in `TaskScene` → absent | — |

The cheer on a summary is unconditional: a round where every task was retyped earns 0 stars, and FR-037 forbids
disappointment, so no "sad summary" variant exists.

### (c) Pose rule

`src/core/round.ts`: `RoundPhase = 'first' | 'second' | 'solution' | 'retype' | 'done'`; `answer` moves first → done
(right) or second (wrong), second → done or solution, retype → done (right) or the same state (wrong);
`nextSolutionStep` → retype after the last step; `next` → `first` of the next task. Mapping:

- `first` → **idle** (default, and "back to idle at the next task")
- `second`, `solution`, `retype` → **think** ("after a miss, until the next correct answer or the next task")
- `done` → **cheer** ("after a correct answer"; also after a correct retype — it is a correct answer)

Proposal: `src/core/guide.ts` `guidePose(screen: 'task' | 'summary' | 'unlock', phase: RoundPhase): GuidePose | null`
with `GuidePose = 'idle' | 'cheer' | 'think'`, and `guideKey(pose)` mapping to `UI_ART_KEYS`. Tests: each phase, each
screen, and an exhaustive `never` guard over `RoundPhase`. `roundCues` (`src/core/sound.ts`) is the same
prior→after pattern for sounds; the fox needs no `prior` because the pose depends on the current phase only.

**TaskScene hooks** (observed): `submit` calls `wobble(face)` when the phase is not `done`, then `render()`, then
`bounce(face)` when done; `advance` (Dalej / next) and the solution-step button go through `render()`; `beginRound` and
`closeUnlock` call `render()`. So one call `this.guide.show(guidePose(screen, this.state.phase), reduced)` at the end of
`render()` covers every change; the widget animates only when the pose differs from the one shown (render runs
for non-pose changes too). The follow-up "`modeWidgets` not yet the only mode switch in `TaskScene.render`"
(child-flow-guards) stays open: the fox reads the phase, never the mode.

### (d) Motion, depth, backdrop

- Tweens in Phaser 4.2.1 are unchanged from v3 (`TweenManager.add`, `killTweensOf`; ease names in
  `math/easing/EaseMap.js`). `setDisplaySize` sets `scaleX/scaleY` (`components/Size.js`), so a pop must target
  `base × k`, not `k`; `setTexture` keeps scale and origin, and all three frames are 384 × 384, so the size is kept.
- Proposal: `ANIMATION.guidePoseMs: 240` (yoyo → 120 ms up, 120 down; ≤ 300 ms) and `ANIMATION.guidePopScale: 1.06`,
  ease `'Sine.easeOut'` like `TaskScene.bounce`. Cross-fade rejected: two silhouettes with different paws ghost through
  each other for half the fade, and it needs a second Image. No idle breathing (scope: optional; motion next to the task
  is a distraction) → DESIGN-GAP row.
- Reduced motion: `prefersReducedMotion()` (`src/ui/motion.ts`) read at the moment of the change, like `bounce`/`wobble`;
  then only `setTexture`, no tween; `killTweensOf` + reset to base scale before any change.
- Backdrop: `SalonBackdrop.render` builds an off-list holder from `drawRoomMiniature`, `dt.draw(holder)` once, then shows
  one Image at `BACKDROP.depth` −10. `DynamicTexture.draw` draws only the passed entries, no camera or display-list
  capture → a TaskScene Image is never captured, wherever it is created.
- Depth: TaskScene sets depth only for the backdrop (−10/−9) and the summary star burst (`ROOM_LAYOUT.depth.celebrate`
  130); everything else is depth 0 in creation order. Create the fox right after `drawNotebook` in `TaskScene.create`
  (depth 0): above the paper, below everything created later — flying stars, carried coins/blocks, summary burst all
  draw over it. UIScene (HUD) renders above the whole TaskScene (scene order in `src/main.ts`).

### (e) Art pipeline

- `scripts/make-task-art.mjs`: `UI_JOBS` `{ from, to, size }`, every one read from `SALON_V2`; the script exits unless
  `KIT` and `SALON_V2` exist; `convert` runs `cwebp -quiet [-resize W H] -q 85 -alpha_q 100 -m 6`; no trim or crop
  anywhere. Needed: a root `FOX = designs/martynka-fox-guide-v1`, either a `root` field on UI jobs or a `FOX_JOBS`
  list (+ the existence check and the file count line), header comment updated. `-resize 384 384` on a square source keeps
  the whole canvas → the anchor stays (0.5, 0.87890625).
- **Size 384 × 384.** The game canvas is a 1920 × 1080 backing store (no `resolution` in `src/main.ts`), so detail beyond
  the 320 scene px shown is lost on any tablet; 384 is 1.2 × the display size (the script's rule: at most 2 ×).
  Phaser defaults (no `mipmapFilter`, `antialias` true) give LINEAR minification without mipmaps; at 1.2 : 1 bilinear
  does not alias (aliasing shows above about 2 : 1). 512 would be 1.6 : 1, also fine, +20 KB, and POT (mipmaps possible
  only with a global `mipmapFilter`, which would mipmap every POT texture) — not needed. Measured in the scratchpad with
  the script's flags: idle 13 700 B, cheer 15 086 B, think 13 598 B (512: 20 282 / 22 466 / 20 160).
- `src/data/uiArt.ts`: add `guideIdle`, `guideCheer`, `guideThink` (`def` → `ui/fox-idle` … , 384 × 384, `label: ''`);
  `UI_ART_KEYS` gains the three. `tests/uiArt.test.ts` pins `toHaveLength(5)` → 8; its header-size, orphan, key and
  label checks cover the new rows unchanged.
- `BootScene.preload` `queuers.ui` iterates `UI_ART` (minus the two loading pictures) → loads the fox with no edit;
  `bootQueue` order keeps UI after task/room art. `BootScene.create` writes `REGISTRY_KEYS.uiArtHealth` via
  `withCauses('Ui', UI_ART, …)` → the "Obrazki" UI line counts 8. The `loaderror` line (`loadErrorLine`) logs a missing
  fox like other UI art. No edit of `BootScene` → the `BootScene` follow-ups stay open.
- Precache: `vite/config.shared.mjs` `globPatterns` includes webp. Deploy smoke: `scripts/check-deploy.ts`
  `precacheCovers('screen pictures', precache, UI_ART.map(a => a.url))` covers the rows automatically.
- Boot budget: the comment on `balance.loader` records 2 329 739 B (≈ 46.6 s at 50 KB/s, limit `totalMs` 50 000);
  +42 384 B → ≈ 47.4 s, still under; the comment should be updated.
- `?e2eArt=ui`: the `ui` queuer swaps every non-loading UI url for `UI_MISSING_URL` → all three fox textures missing →
  the widget shows nothing (no stand-in; `label ''`). Existing specs using it (`tests/e2e/health-lines.spec.ts` wallet and
  notebook tests) assert wallet/notebook fallbacks only and read `UI_ART.length` as the total → unaffected.
- Missing art rule: show a pose only when `textures.exists(key)` for that pose; otherwise hide the Image. No
  `recordFallback` (no drawn fallback exists; `FallbackWhere` unchanged).

### (f) Input

Only `scene.add.zone(...).setInteractive()` controls take input in TaskScene (`AnswerTiles`, `Keypad`, `SelectTiles`,
`CoverBoard`, `PageButton`, `ActionButton`); scene-level `pointerdown/move/up/upoutside` listeners feed the drag
reducers through `rawToDragEvent` with their own hit tests; no `currentlyOver`, `hitTestPointer` or `topOnly` in `src`.
Phaser's `InputPlugin.hitTestPointer` tests only objects registered by `setInteractive` (`InputManager.inputCandidate`
rejects objects with no `input`), so a plain Image never blocks a tap, at any depth. The fox also lies over no control
(table in (a)). The widget must never call `setInteractive`; the e2e hook reports `interactive: image.input != null`.

### (g) E2E

`src/testing/e2eHook.ts` reads `TaskScene.snapshot()`. Add `guide: { pose: GuidePose | null, visible: boolean, rect:
Rect, interactive: boolean }` to `TaskSnapshot` (read-only). New spec `tests/e2e/fox-guide.spec.ts` (hook build, like
`notebook-polish.spec.ts`): idle at a task start; cheer after `answerRight`; idle after `tapNext`; think after
`answerWrong`, still think in solution/retype; cheer on the summary; hidden on the unlock card (E4 until unlock, as in
`health-lines.spec.ts`); `?e2eArt=ui` → `visible false`; `interactive false`; `rect` equals `guideRect()`; reduced
motion (`page.emulateMedia({ reducedMotion: 'reduce' })`) → the pose is set with the scale at base right after the
answer.

### DESIGN-GAP rows to add (next free numbers in `docs/design-gaps.md`, last row 164)

| # | gap | provisional behaviour |
|---|---|---|
| 165 | The kit has no view of the guide; FR-037 says only "in the corner of the notebook", scope.md "about 180–240 px" | Right margin at the notebook's top-right corner, astride the frame, feet at (1792, 400), image 320 px, silhouette ≈ 188 × 220 (scope.md item 2, maintainer 2026-10-23) |
| 166 | No pose-change motion in the kit | `setTexture` + pop to 1.06 and back in 240 ms; none under reduced motion; no idle breathing |
| 167 | Screens of the guide not in the kit | Task layer of every round kind; cheer on `SummaryPanel` and `MinigameDoneCard`; hidden on the unlock card |
| 168 | No missing-art behaviour for the guide | A missing pose texture shows no fox (no stand-in box), counted in the "Obrazki" UI line |

## Code References

- `src/data/layout.ts` — `TASK_LAYOUT` (notebook, prompt, tiles, keypad, bar, barSpan, select, picture.*, drag, coinDrag,
  starCounter), `HUD_LAYOUT`, `SUMMARY_LAYOUT`, `UNLOCK_LAYOUT`, `MINIGAME_LAYOUT`, `NOTEBOOK`, `ANIMATION`, `BACKDROP`
- `src/core/notebookGeometry.ts` — `notebookGeometry` (face, ribbon)
- `src/core/round/pictureLayout.ts` — `pictureLayout`, `answerSpans`, `hintPictureLayout`, `clockSetLayout`
- `src/core/round/dragLayout.ts` — `dragLayout`, `coinLayout`; `src/core/minigames/word.ts` — `letterRow`;
  `src/data/minigames.ts` — `MINIGAME_WORDS`
- `src/core/round.ts` — `RoundPhase`, `answer`, `nextSolutionStep`, `next`
- `src/scenes/TaskScene.ts` — `create`, `render`, `submit`, `advance`, `bounce`, `wobble`, `flyStar`, `snapshot`
- `src/ui/widgets/SalonBackdrop.ts` — `render`; `src/ui/widgets/SettingsHint.ts` — constructor (bubble height)
- `src/ui/motion.ts` — `prefersReducedMotion`
- `scripts/make-task-art.mjs` — `UI_JOBS`, `convert`; `src/data/uiArt.ts` — `UI_ART`, `UI_ART_KEYS`;
  `tests/uiArt.test.ts`
- `src/scenes/BootScene.ts` — `queuers.ui`, `withCauses`; `src/core/artHealth.ts` — `artHealthLines`
- `scripts/check-deploy.ts`, `scripts/deploy-check/parse.ts` — `precacheCovers`
- `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` — `answerRight`, `answerWrong`, `tapNext`
- Phaser 4.2.1: `input/InputPlugin.js` `hitTestPointer`, `input/InputManager.js` `inputCandidate`,
  `textures/DynamicTexture.js` `draw`, `core/Config.js` `mipmapFilter`, `renderer/webgl/WebGLRenderer.js`
  `createTextureFromSource`

## Architecture Insights

Layout is data (`src/data/layout.ts`), placement logic pure in `src/core/` (`notebookGeometry`, `pictureLayout`),
widgets in `src/ui/widgets/` only draw. The fox follows that split: `GUIDE` tokens in `layout.ts`, `guidePose` and
`guideRect` in `src/core/`, a `GuideFox` widget, one call in `TaskScene.render`. UI art goes through one table
(`UI_ART`) that BootScene, health lines, precache test and deploy smoke all iterate, so three rows are the whole wiring.

## Historical Context (from prior changes)

- `context/archive/*notebook-polish*` — DESIGN-GAP rows 157–163 (press, bounce, wobble, beads, entrance, summary
  motion) set the motion vocabulary the fox reuses (`ANIMATION`, `prefersReducedMotion`).
- S-16c (final-art-p2) — `UI_ART` with `label: ''` for the loading pictures: precedent for "missing → nothing".
- Follow-ups with code-touch triggers listed in `change.md` (BootScene F3, G-2.., `UI_MISSING_URL`, `modeWidgets`,
  TaskScene lifecycle): none is touched by the proposed plan except `TaskScene.render` (one line), which leaves the
  `modeWidgets` follow-up open by design.

## Related Research

Not applicable beyond `change.md` of this change.

## Open Questions

- Size interpretation (silhouette vs. canvas) is an autonomous decision; reversal = change `GUIDE.displaySize`.
- Visual gate: whether 10 px of the fox over the paper face at the top-right reads as "sitting at the corner" or as
  clipping; fallback within the same test: anchor x 1802 (silhouette 1724–1913, still ≥ 7 px from the edge).

## Proposed phases for the plan

1. **Art and table** — `Driver: impl`. Third root in `scripts/make-task-art.mjs`, three 384² WebP in `public/assets/ui/`,
   `UI_ART`/`UI_ART_KEYS` rows (`label ''`), `tests/uiArt.test.ts` length 8, `balance.loader` comment, CLAUDE.md line.
2. **Pose and geometry** — `Driver: tdd`. `GUIDE` tokens + `ANIMATION.guide*` in `src/data/layout.ts`; `src/core/guide.ts`
   (`guidePose`, `guideKey`) and `src/core/guideLayout.ts` (`guideRect`); tests for the pose table and the no-overlap
   geometry over every answer mode × shape × solution phase and every screen rect.
3. **Widget, scene, hook, gaps** — `Driver: impl`. `src/ui/widgets/GuideFox.ts` (Image, origin, display size, no input,
   pop / reduced-motion swap, hidden on a missing texture), created after `drawNotebook` in `TaskScene.create`, updated
   at the end of `TaskScene.render`; `TaskSnapshot.guide`; DESIGN-GAP rows 165–168.
4. **E2E** — `Driver: e2e`. `tests/e2e/fox-guide.spec.ts` as in (g), deliberate break (e.g. pose fixed to idle) red first.
