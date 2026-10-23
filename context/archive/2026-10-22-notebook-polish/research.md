---
date: 2026-10-22T18:29:28+02:00
researcher: Claude (autonomous run 2026-10-22-notebook-polish, research step)
git_commit: 40e27fe5b1790868f628c55e9cf0eecd54964c08
branch: feat/notebook-polish
repository: Martynka-urzadza
topic: "notebook-polish: salon backdrop, chunky buttons, interface life, plain zero — how to build it on the current code"
tags: [research, notebook, TaskScene, WelcomeScene, UIScene, RoomView, PageButton, ActionButton, AnswerTiles, Keypad, StarCounter, ProgressDots, SummaryPanel, phaser4-filters, font, OFL]
status: complete
last_updated: 2026-10-22
last_updated_by: Claude (research step)
---

# Research: notebook-polish

**Date**: 2026-10-22T18:29:28+02:00 · **Git Commit**: `40e27fe` · **Branch**: `feat/notebook-polish`

## Research Question

From `change.md` (corrections, D-1..D-7, DESIGN-GAP list, triggered follow-ups) and the maintainer's `scope.md`
(PA-1..PA-13), answer: (a) how to draw the child's CURRENT salon blurred behind the notebook (reuse vs snapshot, Phaser
4.2.1 blur API, Canvas fallback, cost, refresh after a purchase, what the e2e hook reads); (b) one shared "chunky
button" (lip + press motion) and which widgets use it without moving e2e hit areas; (c) where the bounce, counter pop,
wobble, beads, entrance stagger and summary pops live, timing tokens, reduced-motion paths; (d) an OFL-compliant plain
zero; (e) which tests pin today's visuals; (f) a phase split. Where `scope.md` and the kit differ, `scope.md` wins and is
named.

Method: three read-only sub-agents (backdrop/renderer, button inventory, motion/tests) plus local checks of the
decisive anchors (Phaser source, `TaskScene`, `UIScene`, `layout.ts`) and a throw-away fontTools experiment in
`$TMPDIR/zero/` (nothing of it committed). Anchors are file + symbol; no line numbers.

## Summary

- **(a) Backdrop.** Reuse the salon drawing, not `RoomScene`: `drawRoomMiniature` / `miniaturePieces`
  (`src/ui/widgets/RoomView.ts`) already draw a `RoomState` into another scene at any scale (used by `RoomDoneCard`) and
  create no input. Draw it ONCE into a `DynamicTexture` and show a single image behind the notebook; refresh only in
  `TaskScene`'s existing `wake` handler (`onWake`) when the `REGISTRY_KEYS.rooms` reference changed (purchases happen only
  while `TaskScene` sleeps; `RoomScene.dispatch` writes a new object each time). Phaser 4.2.1 blur =
  `obj.enableFilters(); obj.filters.internal.addBlur(quality, x, y, strength, color, steps)` (`FilterList#addBlur`,
  `src/filters/Blur.js`; v4 docs via context7 agree). Under Canvas `Filters#enableFilters` returns early (`!renderer.gl`)
  and `filters` is `null`, so an unguarded `addBlur` throws; the guard is `renderer.type === WEBGL`. Renderer-independent
  softening is available too: draw the salon at a reduced size (¼) into the texture and scale it up (bilinear). Missing
  scene picture → draw nothing (plain `PAGE_BACKGROUND`, PA-1). The e2e hook finds scenes by key and never walks display
  lists, so a backdrop image is invisible to it.
- **(b) Chunky button.** Every listed control is an absolute-coordinate `Graphics` + `Text` + a separate `Zone`; the e2e
  hook's `target()/targets()` read stored layout rects, never object bounds. A helper that keeps the `Zone` fixed and
  moves only a face container (lip drawn underneath) cannot move a hit area. Shareable by: `AnswerTiles`, `Keypad`,
  `ActionButton` (covers "Dalej", "Następny krok"/"Już wiem", and the OK of `SelectTiles`/`BlockMat`/`CoinWallet`/
  `ClockSet`), `PageButton` (summary, unlock, done cards, "Rodzic", "Wróć", room buttons), `AgeButton`, `SelectTiles`,
  `CoverBoard`, `SpeakerButton`, `RoomSwitchButton`. Exceptions: `SettingsIcon` (static lip only, no press motion — gaps
  25/28/151), `StarCounter` (not a button: a pop, not a press). Correction to scope.md: there is no "Podpowiedź"/"Pokaż
  kroki" button in the code — the hint shows by itself (`FeedbackBar`), the solution buttons are "Następny krok"/"Już
  wiem" (`SolutionSteps`).
- **(c) Motion.** Correct bounce after `render()` in `TaskScene.submit` when the phase became `done`; wobble where
  `TaskScene.shake` is called (the camera shake and its `scrollX` resets in `applyParentStage`/`backToAge` go); counter
  value stays synchronous (`UIScene` `onStars` → `StarCounter.setValue`), only a scale pop waits for a new
  `GAME_EVENTS.starLanded` emitted in `flyStar`'s `onComplete` (not fired when `endFlyingStars` kills the chain); beads in
  `ProgressDots`; stagger in `AnswerTiles.setChoices` and the per-task `Keypad` show; summary pops + burst in
  `SummaryPanel.show` with a `starBurst` helper extracted from `RoomScene.celebrate`. Scale tweens need a local origin
  (all these objects draw at absolute coordinates). Pure delay rules go to a new `src/core/` module with unit tests; tokens
  to `ANIMATION`.
- **(d) Zero.** Recommended: a reproducible modification of the bundled Atkinson Hyperlegible Next — replace the two
  slash-split counters of `zero` with one oval counter derived from the outer contour per gvar master (`zero.tf` is a
  composite of `zero` and follows). Proven in the experiment: valid variable font, deterministic bytes, plain 0 at 400/700/
  800 weights, Polish diacritics untouched, 0 still narrower than O. Ship it renamed (OFL FAQ advice; no Reserved Font
  Name is declared) with the original copyright line and OFL kept.
- **(e) Tests.** Nothing pins the camera shake, dots or drawing (no screenshot assertions, no unit test on colours/lips).
  What must stay: `counterText` asserted immediately after taps in 7 specs; source-regex tests on `TaskScene.submit` /
  `UIScene` / `SolutionSteps` / `CoinWallet`; zone rects (`tests/layout.test.ts`); `tests/dice.test.ts` counts
  `board.shadow`.
- **(f) Phases:** 8 proposed (below), UI phases with ≤ 2 new components each.

## Detailed Findings

### (a) The salon behind the notebook

**What draws the salon.** `RoomView` (`src/ui/widgets/RoomView.ts`) is a plain class over a `Scene`: constructor makes
two `Graphics` (`backdrop`, `outline`), `RoomView.render(room, state, preview)` lazily builds one `RoomLayer` per id
(scene picture chosen by `stagesDone`, furnishings before the renovation, shadows when `roomDone`, decor, then slots from
`shownVariants` in `src/core/rooms.ts`, which covers `shownBeforePurchase` through `shownVariant`). Layers go straight to
the scene display list at absolute depths from `ROOM_LAYOUT.depth`. `RoomLayer` (`src/ui/widgets/RoomLayer.ts`) checks
`scene.textures.exists` and draws a stand-in box with a caption for a missing slot picture. Neither `RoomView` nor
`RoomLayer` calls `setInteractive`; all room input lives in `RoomScene.create`. `miniaturePieces(room, state)` returns a
pure list of pieces and `drawRoomMiniature(scene, g, room, state, left, top, scale, depth)` draws them into any scene —
already reused by `RoomDoneCard`.

**Conflicts if `RoomView` itself were dropped into `TaskScene`:** `drawNotebook` and most task widgets sit at default
depth 0, so the room layers (depths up to ~99) would cover the notebook; and `TaskScene.shake` tweens
`cameras.main.scrollX`, which would shake the backdrop too. A single pre-rendered image at a negative depth with
`setScrollFactor(0)` avoids both.

**Phaser 4.2.1 filter API** (`node_modules/phaser/package.json` version `4.2.1`; checked in source and in the v4 docs via
context7, `/websites/phaser_io_api-documentation_4_0_0-rc_6`):
- Every game object mixes in `Components.Filters` (`src/gameobjects/GameObject.js`). `enableFilters()` must be called
  first; the docs: "This is a WebGL only feature. It will return early if not available."
- `FilterList#addBlur(quality, x, y, strength, color, steps)` (`src/gameobjects/components/FilterList.js`, filter
  `src/filters/Blur.js`): quality 0/1/2, x/y offset default 2, strength default 1, steps default 4.
- Camera: `camera.filters.internal.addBlur(...)` (`src/cameras/2d/Camera.js`).
- **Canvas renderer:** `Filters#enableFilters` returns early on `!this.scene.renderer.gl` and the `filters` getter
  stays `null`, so `obj.filters.internal.addBlur` throws a `TypeError`; camera filters do not throw but the Canvas
  renderer never reads them. `src/main.ts` `createGame` uses `type: AUTO`; nothing in `src/` checks the renderer type
  today (grep for `WEBGL`, `CANVAS`, `renderer.type`).
- **DynamicTexture:** in v4 commands are queued and applied on `render()` (`draw`, `stamp`, `capture`, `snapshot`,
  `fill`, `clear`). The sub-agent read in `DynamicTextureHandler` that a capture calls the object's render steps, which
  include `renderWebGLFilters` after `enableFilters` — so a capture of a filtered container should bake the blur in.
  **Not run** (inference from source); the plan needs a spike/visual check.

**Options (D-4):**

| option | per-frame cost | Canvas | notes |
|---|---|---|---|
| A. Live blur filter on a container/camera hosting the room layers | multi-pass blur over 1920×1080 every frame | throws unless guarded; no blur | rejected: pays a static picture's blur 60×/s on an older tablet |
| B. One capture into a `DynamicTexture` (blur filter baked in on WebGL) + one `Image` | one textured quad | the capture works without filter; needs softening another way | recommended base |
| C. B at reduced size (draw at scale ¼ into a 480×270 texture, display scaled ×4, linear filtering) | one quad, tiny texture (~0.5 MB GPU vs ~8 MB at full size) | same path on both renderers (softening comes from the upscale) | recommended combination: C everywhere, plus `addBlur` on WebGL to smooth the bilinear blockiness; quality judged at the visual gate |

**Dim.** Kit `.stage:after` = ivory `#fff5df` at 60 % (`99`) over a 5 px CSS blur — one `Rectangle`/`Graphics` in
`PAGE_BACKGROUND` at alpha 0.6 above the image (token in `layout.ts`).

**Refresh after a purchase.** `REGISTRY_KEYS.rooms`/`currentRoom` are set once in `preBoot` (`src/main.ts`
`createGame`) and afterwards written only by `RoomScene.dispatch` (on a change or a purchase, always a new object;
import/reset reload the page). `TaskScene` leaves via `GAME_EVENTS.toRoom` → `scene.switch(SCENE_KEYS.room)` and comes
back by `scene.switch(SCENE_KEYS.task)`; `TaskScene.create` registers `onWake`. So: capture in `create`, re-capture in
`onWake` only when the `rooms` reference differs from the one captured. `changedata-rooms` also reaches a sleeping
scene but fires while the backdrop is not visible — the wake check is enough. Summary and unlock are layers of
`TaskScene`, so they share its backdrop. `WelcomeScene` (no learner yet) draws the same capture from the registry
`rooms` (a fresh save = the neglected salon; PA-1 allows it).

**Missing art.** `BootScene` writes `REGISTRY_KEYS.roomArtHealth` (`artHealth` in `src/core/artHealth.ts`:
`{ total, missing, missingIds }`); `artHealth` is task art only. Rule for the backdrop: if the scene picture
(`room.scene.after`/`before`) does not exist as a texture → no backdrop, plain page (PA-1). A missing slot picture →
leave that piece out (no stand-in box in a blurred backdrop: `drawRoomMiniature` draws stand-ins through its `g`
`Graphics`; the backdrop passes a throw-away or skips them — the plan picks).

**Cost.** `public/assets/rooms/salon/` holds 38 files (~1.5 MB). A render draws at most ~15–17 images (scene,
shadows, decor, 11 slots). Option C costs one capture per create/wake-with-change and one quad per frame.

**e2e hook.** `src/testing/e2eHook.ts` looks scenes up by key (`game.scene.getScene(SCENE_KEYS.room)`), `inRoom()` is
`scene.isActive(SCENE_KEYS.room)`, the room snapshot and `unreachable` come from `RoomScene.snapshot()` /
`unreachableSlots` with `RoomScene`'s own `alphaAt`. It never walks display lists; `inputEnabled` is
`game.input.enabled`. A backdrop image in `TaskScene`/`WelcomeScene` changes nothing it reads. Suggested addition for an
e2e assertion: a read-only `backdrop: 'salon' | 'plain'` field in the task/welcome snapshot (hook build only).

### (b) Chunky button with lip and press

Inventory (sub-agent read of each widget; all symbols in `src/ui/widgets/`):

| widget | drawing today | input (phase, guard) | hook target |
|---|---|---|---|
| `AnswerTiles` (`paint`) | Graphics per tile, lip already: `dotDone` α 0.5, offset +8 (literal) | Zone = `rect`; `onPick` on **pointerdown**, guard `active` | `targets()` from `rect`; `answerRight`/`answerWrong` |
| `Keypad` (`paintButton`; OK, "kasuj" = `pl.round.deleteKey`) | Graphics per key, lip +6 (literal); labels not kept on `Button` | Zone 156×104, **pointerdown** | `targets()`; `tapNumber`, `typeDigits` |
| `ActionButton` | fill + border, **no lip, no pressed state** (`TASK_LAYOUT.bar` h 96, r 24) | **pointerdown** when `shown`; `onTap` often hides it at once ("Dalej") | `target()`; `next`, `step`, `selectOk`, `drag.ok`, `coins.ok`, `clock.ok` |
| `PageButton` | primary/secondary fill + border, **no lip, no pressed colour**; `setDepth` = graphics d, label d+1, zone d+2 | **pointerup**, guard `pressed` (press must start on it) + `shown` | `target()`; `nextRound`, `toRoom`, `doneNext`, `doneRoom`, `unlockNext`, `ageBack`, `parent`, `resume`, `modeButton`, `cardNext` |
| `AgeButton` | lip `ageButtonShadow`, offset `WELCOME_LAYOUT.ages.shadow` 10; label not kept | **pointerup**, `pressed` guard | fixed `center`; `passWelcomeAsChild` |
| `SpeakerButton` | icon in the same Graphics, no lip, `HUD_LAYOUT.speaker.pressed` | **pointerup**, no press-start guard | `speaker` |
| `RoomSwitchButton` | Graphics + label (label positioned in `draw()`), no lip | **pointerup**, `pressed` guard | `roomSwitch` |
| `StarCounter` | static pill (butter border 4, h 100) | not interactive | `counterText`; landing point `starCounterTarget` |
| `SettingsIcon` | static, deliberately no press feedback (gaps 25/28/151) | down/up/out → long-press reducer in `UIScene` | `settingsIcon`; `openSettings` |
| `SelectTiles` | lip +8 like tiles; marked = `selected`/`selectedBorder` + tick; no pressed state | toggles on **pointerdown**, no up/out | `selectTiles`, `selectOk` |
| `CoverBoard` | tile + lip `MINIGAME_LAYOUT.board.shadow` 7 | toggles on pointerdown | board targets |

Kit lip values (from `change.md`, `screen.css`): `.answer` 8 px `#a4bd9670`, `.key` 5 px `#a4bd9650` (game 6),
`.age-button` 10 px `#a4bd964d`, `.page-button` 8 px `#397f7330`, HUD 7 px `#8f6d3d25`; `.hint-button`/`.next-button`
have none (scope.md asks for one → DESIGN-GAP). Kit motion is only `button:active{transform:translateY(2px)}`; the lip
travel + Back overshoot is the maintainer's (scope.md wins, DESIGN-GAP).

**Recommended helper** (`src/ui/widgets/chunky.ts`, name is the plan's): owns a static lip `Graphics` drawn at
`rect.y + lip` and a face `Container` at (0,0) holding the face `Graphics` and the label/icon (drawn in absolute
coordinates as today, so nothing else moves); the widget's existing `Zone` stays outside and fixed. `press()` tweens
`face.y` to the lip depth (`ANIMATION.pressDownMs` ~80), `release()` back to 0 with `Back.easeOut`
(`ANIMATION.pressUpMs` ~150); under `prefersReducedMotion()` set `y` instantly (or colour only); `reset()` kills tweens
and zeroes `y` — called from `hide`, `place`, `setChoices`/`destroyTiles` and before `destroy`. `setDepth(d)` keeps
`PageButton`'s order (lip+face d, label d+1, zone d+2). Widgets keep their handlers and fire moments; they only call
`press()`/`release()`. Care points: `ActionButton` "Dalej" hides in the same pointerdown (release must not re-show it);
`Keypad` and `AgeButton` must keep their label objects; `RoomSwitchButton`'s `draw()` positions the label; `PageButton`
shows the press only after its own pointerdown (keeps the `pressed` guard that stops the release of the tap that opened
the summary). The lip draws below the rect: `tests/layout.test.ts` checks rects (not lips) for size/overlap; space below
exists (tiles end at y 856, the bar starts at 864; the gear ends at 1048 of 1080).

**HUD pills.** Kit `.hud button,.stars`: gradient `#fffdf2 → #fff0cc`, border 5 `#d3b77d`, radius 32, min-height 104,
lip `0 7px 0 #8f6d3d25`. Today `HUD_LAYOUT.speaker` has the kit colours but a flat fill and no lip; `StarCounter` differs
(butter border 4, height 100). One pill-drawing function (face gradient approximated by two fills or a vertical
gradient fill — Phaser `Graphics.fillGradientStyle` is WebGL-only; plan decides) shared by speaker, room switch, counter,
gear; this also closes the follow-up "Shared HUD button for `SpeakerButton`/`RoomSwitchButton`". Gear: same pill and a
static lip, no press motion (row 28 unchanged). "Wróć" is a secondary `PageButton` (`TASK_LAYOUT.ageBack`) → inherits
the lip; row 152 updated.

### (c) Interface life

- **Order in `TaskScene.submit`** (verified by sub-agent and partly locally): core `answer()` → `playRoundCues` →
  `syncStars(before, answerSpot(value))` (registry write first, then `flyStar`) → variant count + flush → if
  `state.phase !== 'done'`: resets of keypad/boxes/select/drag/clock/coins, then `shake()` → `render()`. A correct answer
  is shown by `render()` (`tiles.markCorrect`, `keypad.markCorrect`, `select.markCorrect`).
- **Bounce (PA-5)**: after `render()` when the previous phase was not `done` and the new one is. The "answer box" per
  mode, mirroring `TaskScene.answerSpot`: tiles (incl. daily puzzle, word round) → the picked `AnswerTiles` tile; keypad →
  the entry field (`fieldGraphics`/`fieldText`); digits → the `WrittenColumn` boxes; select → `SelectTiles` (the marked
  tiles or the OK); drag blocks/clock/coins → the OK of `BlockMat`/`ClockSet`/`CoinWallet`; dice → the `CoverBoard`
  field. Proposal: bounce the object the child confirmed (tile, keypad field, the OK `ActionButton` for
  select/drag), leave digits/dice to the plan. Scale needs a local origin (a container at the rect centre); the tile
  lives until the next `setChoices` (`destroyTiles` must `killTweensOf`).
- **Wobble (PA-6)**: replaces `TaskScene.shake` at the same call site; a small rotation/offset of the same answer
  object, slow (e.g. ±3°, ~500 ms, tokens). Remove `ANIMATION.shakeMs/shakeSegments/shakeDistance` and the camera
  `scrollX` resets in `applyParentStage`/`backToAge`. Nothing tests the shake (see (e)). Never red: colours stay
  `hint`/neutral.
- **Counter pop (PA-5)**: `UIScene` `onStars` calls `StarCounter.setValue` synchronously on `changedata-stars` — keep.
  `flyStar` (`tweens.chain`: pop `starPopMs`, flight `starFlightMs - starPopMs`) destroys the star in `onComplete`; add
  `game.events.emit(GAME_EVENTS.starLanded)` there; `UIScene` calls a new scale-only `StarCounter.pop()`. When
  `endFlyingStars` kills the chain (on "Do pokoju", `backToAge`) `onComplete` does not run, so no pop fires on a killed
  star — this closes the follow-up "star in flight freezes while `TaskScene` sleeps" for the pop. Under reduced motion no
  star flies (`syncStars`), so no pop. Note: the 'star' sound plays at `balance.sound.starDelayMs` (250 ms), the landing
  is at 850 ms — the pop will not coincide with the sound (balance untouched by the hard limits; record, do not change).
  Follow-up "star starts over the 9 key" (`ANIMATION.starStartLift`, keypad `answerSpot` = OK key): cheap to fix in the
  same edit by starting from the entry field.
- **Beads (PA-7)**: `ProgressDots.update(dots)` clears and redraws one `Graphics` per `render()`; tokens
  `TASK_LAYOUT.dots {centerX 960, y 96, radius 20, gap 62, ringWidth 4}` (kit dot is 40 px = today's radius 20). A pop
  needs per-dot objects and memory of the previous state (pop only on the dot that just became `done`). Kit colours to
  align (change.md). Larger radius must keep the HUD rects clear (`tests/layout.test.ts`).
- **Entrance stagger (PA-8)**: tiles are rebuilt per task in `AnswerTiles.setChoices` (from `TaskScene.render` when
  `shownIndex !== state.index`); `SelectTiles.setChoices`/`CoverBoard` likewise; the `Keypad` is built once in its
  constructor and shown/hidden — a stagger there tweens existing objects per task. Zones are live at once; `core/round.ts`
  `answer` decides first try with no time input, so a visual-only stagger cannot change first try, stars or mastery (D-5).
  Keep zones and `active` unchanged during the tween (an early tap on a still-fading tile is allowed).
- **Summary (PA-9)**: `SummaryPanel.show` draws all stars into one `row` Graphics and "+N" (`earnedStar` + `earned`
  text) at once; `UnlockCard`/`MinigameDoneCard` have the same shape. Per-star pops need one object per star. Buttons
  must be shown and tappable at once (specs tap `nextRound`/`toRoom` immediately). Burst: `RoomScene.celebrate` makes
  `PURCHASE_STAR_TEXTURE` with `drawStar` and `generateTexture`, then `add.particles(...).explode(
  ANIMATION.purchaseParticles)`, speeds/angles inline. Extract a `starBurst(scene, x, y, count, tokens)` helper; editing
  `celebrate` fires the conditional follow-ups on `RoomScene` (`fadeStage`/`celebrate`/`onSleep`, salon-extra-slots
  L-R8/L-R11) — the plan either takes them or copies the texture code instead. "End of a round" = ordinary and warm-up
  summaries; unlock and minigame-done cards: no burst (scope.md says "only at the end of a round").
- **Pure rules**: no motion module exists in `src/core/`. Closest pattern: `src/core/sound.ts` (`roundCues` returns
  `{ id, delayMs }[]`, applied by the scene). A `src/core/motion.ts` (or `src/core/round/motion.ts`) with
  `staggerDelays(count, spanMs)` and `summaryPopDelays(stars)` fits, unit-tested; numbers from `ANIMATION`
  (`src/data/layout.ts`; `src/core` already imports `src/data`, e.g. `src/core/roomHit.ts` imports `data/layout` and
  `src/core/autosave.ts` imports `data/balance`, so the boundary rules allow it). `prefersReducedMotion()` stays in the scenes/widgets
  (`src/ui/motion.ts`).

### (d) Zero without a slash

**The font.** `public/fonts/AtkinsonHyperlegibleNext.ttf` (114 552 B, v2.001, variable `wght` 200–800, default 400,
tables incl. `glyf gvar HVAR MVAR STAT avar fvar`). `zero` has 3 contours: the outer (16 points) and **two counters**
(11 + 12 points) — the slash is the gap between them, so "delete the slash contour" is not possible; `zero.tf` is a
composite of `zero`; no other glyph uses `zero`; `cmap` U+0030 → `zero`. gvar tuples of `zero`: peaks at normalized
-1, 0.842, 1 with non-overlapping regions, so each master = default + one tuple.

**Loaded as.** `BootScene` queue `font`: `this.load.font(FONT_KEY, FONT_URL, 'truetype', { weight: FONT_WEIGHT_RANGE })`;
`FONT_FAMILY = 'AtkinsonHyperlegibleNext, sans-serif'`, `FONT_KEY = 'AtkinsonHyperlegibleNext'`,
`FONT_URL = 'fonts/AtkinsonHyperlegibleNext.ttf'` (`src/data/layout.ts`); health `fontHealth(faces, FONT_KEY)`
(`src/core/artHealth.ts`). The FontFace family is the Phaser key, not the font's internal name. DOM overlays use
`sans-serif` (`src/style.css`), not this font. Precache globs include `ttf` (`vite/config.shared.mjs`); the deploy smoke
maps `ttf` → `font/ttf` (`scripts/deploy-check/parse.ts`) and HEADs every precache entry — no font file name is
hard-coded anywhere outside `layout.ts`.

**Options.**

| | route | evidence | verdict |
|---|---|---|---|
| 1 | Modify `zero` in Atkinson Next: replace both counters with ONE counter = the outer contour scaled into the box (left/bottom of counter 1, right/top of counter 2), reversed direction, computed per master; gvar deltas recomputed (IUP-inferred deltas filled first) | experiment `$TMPDIR/zero/make_zero.py` (fontTools 4.61.1, Python 3.14): font saves, re-run gives byte-identical output, rendered at wght 400/700/800 with PIL: a plain oval 0; 1, 7, 6, 9, ½, ąęłśćźżńóŻÓŁĆ unchanged; 0 (stem 144 side / 106 top at 700) visibly narrower than O (626 vs 528 units wide) | **recommended** |
| 2 | Composite `zero` = `O` scaled 0.83 in x | arithmetic at wght 700: side stems 128 vs the zero's 144, top 120 vs 106 — heavier top than sides, off-design | rejected |
| 3 | Second local OFL font for U+0030 only (`unicode-range` FontFace descriptor; e.g. Lexend, Andika) | Phaser `load.font` passes descriptors to `FontFace`, but a foreign 0 next to Atkinson digits mismatches weight/height; a second file to precache and a second health record | rejected (style mismatch, more moving parts) |

**OFL.** `public/fonts/OFL.txt` copyright line: "Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors"
with **no Reserved Font Name** declared, so a modified version may keep the name legally; the OFL FAQ still advises
renaming modified versions, and a new name avoids clashing with an installed original. Rules for the script: keep name
ID 0 (copyright) untouched (the experiment's naive search-and-replace altered it — must not), change name IDs 1, 3, 4,
6, 16/17 (if present), 25 to a new family (proposal "Martynka Next"; avoid "Hyperlegible", a Braille Institute brand
term), append to name ID 5 a modification note, set `head.modified` fixed and save with `recalcTimestamp=False` for
byte-identical rebuilds. Ship `OFL.txt` unchanged plus a short added line naming the modification (OFL §2/§3: notice and
licence must accompany modified versions; the modified font stays OFL and is not sold by itself).

**Build path.** `scripts/make-font.py` (Python, fontTools) + `npm run font` (like `icons`/`art`, a local tool, output
committed: `public/fonts/MartynkaNext.ttf` or same file name — plan decides; a new name also busts any old precache entry
cleanly). Input: the committed original (or `designs/martynka-maths-A-v1/fonts/AtkinsonHyperlegibleNext.ttf`, the same
file). A unit test can assert, without Python, that the committed font's bytes differ from the original and that its
`zero` has 2 contours only if a TS font parser is added — cheaper: a vitest test parsing the `glyf`/`loca` tables with a
few lines of DataView, or just the visual gate. Then `FONT_URL` (and `FONT_KEY`/`FONT_FAMILY` if renamed) in
`layout.ts`; `fontHealth` keys off `FONT_KEY`. Size stays ~114 KB (ttf; no `brotli` module locally for woff2).
Changing only the URL/key does not change the load mechanism, so the FontFace time-limit follow-ups do not fire
(re-record). Browser validation (OTS) was not run (no `ots-sanitize` locally): the visual gate / e2e `fontHealth:
'loaded'` must prove Chromium accepts the file.

### (e) Tests pinning today's visuals

- No match in `tests/` or `src/testing/` for `shake`, `camera`, `scrollX`, `toHaveScreenshot`, `page.screenshot`,
  `emulateMedia`, `reducedMotion` (sub-agent grep); Playwright `screenshot: 'only-on-failure'` is not an assertion.
  Removing the camera shake breaks no test.
- `counterText` (drawn counter text) read with an immediate `expect(...).toBe(...)` in `task-round.spec.ts`,
  `minigames.spec.ts`, `drawn-tasks.spec.ts`, `room-purchase.spec.ts`, `salon-art.spec.ts`, `save-restart.spec.ts`,
  `save-backup-health.spec.ts` → `setValue` must stay synchronous (D-5).
- Source-regex tests: `tests/variantCountWiring.test.ts` (patterns and order in `TaskScene.submit`: `lastTaskSettled`
  before `countRound`, `flush('now')`), `tests/overflowWiring.test.ts` (`SolutionSteps.ts`), `tests/freshRoundWiring.test.ts`,
  `tests/gestureWiring.test.ts` (`canSubmit(this.state)` in `CoinWallet`; `new BlockMat(this, (value) => { if
  (canSubmit(this.dragState))` in `TaskScene`), `tests/dialogSessions.test.ts` (`UIScene`). Edits must keep those
  strings.
- `tests/layout.test.ts`: rect sizes vs `MIN_TOUCH_TARGET` (96) and overlaps (HUD, summary/unlock inside the notebook) —
  larger beads and HUD pill height 104 must pass it. `tests/dice.test.ts` counts `board.shadow`. `tests/motion.test.ts`
  covers `prefersReducedMotion`.
- e2e taps use `targets()`/`target()` from stored rects through `toPage` (camera ignored); hiding summary buttons during
  a pop-in would break specs that tap `nextRound`/`toRoom` at once.

### (f) Phase split proposal

| # | phase | driver | new components |
|---|---|---|---|
| 1 | Tokens + pure motion rules: `NOTEBOOK`/`CHUNKY`/HUD pill/bead tokens and new `ANIMATION` keys in `layout.ts`; `src/core/motion.ts` (`staggerDelays`, `summaryPopDelays`) | tdd | 0 (core module) |
| 2 | Notebook per kit + salon backdrop (`drawNotebook` stitches, margin, ribbon, bottom edge, shadow, radius 44, `#54b5a9`; backdrop capture/refresh/Canvas/missing-art; welcome sunflower) | impl | 1 (`SalonBackdrop`) |
| 3 | Chunky helper + task controls (`AnswerTiles`, `Keypad`, `ActionButton`, `SelectTiles`) | impl | 1 (`chunky.ts`) |
| 4 | Page/age buttons and HUD pills (`PageButton`, `AgeButton`, `SpeakerButton`, `RoomSwitchButton`, `StarCounter`, `SettingsIcon`, "Wróć") | impl | 1 (`hudPill` drawing) |
| 5 | Correct bounce, wobble (shake removed), counter pop via `starLanded`, flying-star start fix | impl | 0 |
| 6 | Beads + entrance stagger + summary pops and end-of-round burst (`starBurst`) | impl | 1 (`starBurst`) |
| 7 | Plain zero: `scripts/make-font.py`, `npm run font`, font file, `OFL.txt` note, `layout.ts` font constants | impl | 0 |
| 8 | e2e: backdrop field in the hook + a spec (counter immediate with motion on, reduced-motion path, `fontHealth` loaded with the new font) and `docs/design-gaps.md` rows 155+ / updates 18, 20, 25, 152 | e2e | 0 |

## Code References

- `src/ui/widgets/RoomView.ts` — `RoomView.render`, `miniaturePieces`, `drawRoomMiniature` (salon drawing reusable in another scene)
- `src/ui/widgets/RoomLayer.ts` — `RoomLayer.show` (texture check, stand-in)
- `src/scenes/RoomScene.ts` — `dispatch` (writes `REGISTRY_KEYS.rooms`), `celebrate` + `PURCHASE_STAR_TEXTURE` (burst)
- `src/scenes/TaskScene.ts` — `submit`, `shake`, `syncStars`, `flyStar`, `endFlyingStars`, `answerSpot`, `onWake`, `applyParentStage`, `backToAge`
- `src/scenes/UIScene.ts` — `onStars` on `changedata-stars`
- `src/ui/widgets/{AnswerTiles,Keypad,ActionButton,PageButton,AgeButton,SpeakerButton,RoomSwitchButton,StarCounter,SettingsIcon,SelectTiles,CoverBoard,ProgressDots,SummaryPanel,UnlockCard,MinigameDoneCard,notebook}.ts`
- `src/data/layout.ts` — `ANIMATION`, `TASK_LAYOUT.notebook`, `TASK_LAYOUT.dots`, `WELCOME_LAYOUT`, `HUD_LAYOUT`, `GAME_EVENTS`, `FONT_KEY`/`FONT_URL`/`FONT_FAMILY`, `PAGE_BACKGROUND`
- `src/scenes/BootScene.ts` — font queue (`this.load.font`), `fontHealth` record
- `node_modules/phaser/src/gameobjects/components/Filters.js` — `enableFilters` (returns early without `renderer.gl`)
- `node_modules/phaser/src/gameobjects/components/FilterList.js` — `addBlur`
- `src/testing/e2eHook.ts` — scene lookup by key, `counterText`, `fontHealth`
- `vite/config.shared.mjs` — precache `globPatterns` (ttf included); `scripts/deploy-check/parse.ts` — content type map

## Architecture Insights

- Widgets draw at absolute scene coordinates with separate `Zone`s; the hook reads stored rects. This makes "move the
  face, never the zone" safe, but scale tweens need a container at a local origin.
- Registry `changedata-*` events and scene sleep/wake are the existing wiring; a game event (`GAME_EVENTS`) is the
  existing way for `TaskScene` → `UIScene` signals.
- `src/core/sound.ts` `roundCues` is the precedent for pure timing lists applied by scenes.

## Historical Context (from prior changes)

- Follow-up "Slashed zero in the task font (V3)" (`context/archive/2026-10-16-final-art-p2/follow-ups/review-fixes.md`
  and earlier copies) — fires; closed by phase 7.
- Follow-up "Shared HUD button" (`context/archive/2026-10-12-narrator-round-summary/...`) — fires; closed by phase 4.
- Follow-up "star in flight freezes while `TaskScene` sleeps" — supported as closed for the pop: `endFlyingStars` kills
  the chain before the switch, so `onComplete` (and a `starLanded` emit there) does not run.
- Follow-up "`StarCounter` value never asserted" (`2026-10-12-task-round-stars`) — supported as closed: `counterText`
  is asserted in 7 specs.
- FontFace time-limit follow-ups (`2026-10-20-audit-boot-hidden-tab`, `2026-10-15-load-and-tab-guard` A-7) — do not
  fire if only `FONT_URL`/`FONT_KEY` change; re-record.
- DESIGN-GAP 20 (welcome sunflower/cushion): kit `.welcome-cushion` (right 310, top 780, 160 px → x 1450–1610,
  y 780–940) overlaps the "Rodzic" button `WELCOME_LAYOUT.parent` (x 1420–1680, y 834–944): per D-3 the cushion stays
  out and row 20 is **narrowed** (sunflower only, kit `.welcome-flower` left 360, top 790, 152 px, −14°, clear of the
  age buttons ending at y 716), not closed. `flower.webp`/`cushion.webp` are in `public/assets/tasks/icons/` and loaded
  by `BootScene` before `WelcomeScene`.

## Related Research

Not applicable (no earlier research on the notebook visuals).

## Open Questions

- DynamicTexture capture baking a filter in (WebGL) is inferred from source, not run — spike in phase 2; option C
  (downscale) does not depend on it.
- Gradient faces (kit `linear-gradient`) — `Graphics.fillGradientStyle` support under Canvas is not verified; a two-band
  fill is the safe fallback (plan decides).
- Exact bead size, wobble amplitude, bounce target for digits/dice: plan picks within the DESIGN-GAP rows.
- Chromium acceptance of the modified font (OTS) not run locally — must be proven by `fontHealth: 'loaded'` in e2e or the
  visual gate.
