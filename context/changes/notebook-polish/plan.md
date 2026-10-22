# Notebook polish (finished maths-A notebook, chunky controls, interface life, plain zero) — Implementation Plan

## Overview

The only slice of autonomous run `2026-10-22-notebook-polish` (non-roadmap fix). Source: the maintainer's request of
2026-10-22, fixed in `context/runs/2026-10-22-notebook-polish/scope.md` and copied in `change.md` as PA-1..PA-13; this
plan implements them and does not re-decide them:

- **Step 1 (PA-1..PA-4)** — the notebook as in the kit (stitch marks, margin line, butter bookmark, darker bottom edge,
  soft shadow, radius 44, `#54b5a9`, ivory gradient face) over a blurred, dimmed view of the child's CURRENT salon;
  chunky controls with a darker bottom lip and a press that moves the face onto the lip; HUD pills with the same lip.
- **Step 2 (PA-5..PA-9)** — correct bounce and a counter pop when the flying star lands; a slow "think" wobble instead
  of the camera shake; larger progress beads that fill with a pop; an entrance stagger of tiles and keys; summary stars
  popping in one by one and a bigger burst at the end of a round.
- **Step 3 (PA-10)** — a plain school "0": a reproducible modification of the bundled Atkinson Hyperlegible Next,
  renamed "Martynka Next", OFL kept.

**Save format stays v4** (`SAVE_VERSION` 4 in `src/core/save.ts`; `MIGRATIONS`, `validateSave`, `SAVE_KEYS` and every
frozen fixture `tests/fixtures/save-v*.json` untouched):

| piece | what it stores | why v4 is enough |
|---|---|---|
| notebook, lips, HUD pills, beads, motion | nothing; drawing and tweens only | no saved field |
| salon backdrop | nothing; READS `REGISTRY_KEYS.rooms`/`currentRoom` at create/wake | never written by the backdrop |
| plain zero | nothing; a new font file + `FONT_*` constants | the font is not saved |

**A phase that finds it must change what is saved, a balance number (`src/data/balance.ts`), curriculum, content or
storage stops with `STATUS: BLOCKED`** (scope.md hard limits, PA-11).

## Current State Analysis

Grounded in `research.md` (its Code References are the source, not re-searched) and spot-checked on this branch at
`2da4b37`:

- **Notebook.** `drawNotebook` (`src/ui/widgets/notebook.ts`) fills two rounded rects (palette turquoise outer, ivory
  inner) from `TASK_LAYOUT.notebook` `{ left 180, top 204, width 1560, height 788, border 16, radius 40 }`; the page
  behind is the game's `backgroundColor: PAGE_BACKGROUND` (`#FFF5DF`). Called by `TaskScene.create` and
  `WelcomeScene.create` only. Summary and unlock are layers of `TaskScene`.
- **Salon drawing.** `drawRoomMiniature(scene, g, room, state, left, top, scale, depth)` / `miniaturePieces`
  (`src/ui/widgets/RoomView.ts`) draw a `RoomState` into any scene, no input (used by `RoomDoneCard`). `TaskScene`
  sleeps on `scene.switch` to the room and wakes through `onWake`; `RoomScene.dispatch` always writes a new `rooms`
  object. Renderer `type: AUTO` (`src/main.ts`). Phaser 4.2.1: `obj.enableFilters()` returns early without
  `renderer.gl`, so an unguarded `obj.filters.internal.addBlur(...)` throws under Canvas.
- **Gradients.** `GraphicsCanvasRenderer` skips `GRADIENT_FILL_STYLE` (`node_modules/phaser/src/gameobjects/graphics/
  GraphicsCanvasRenderer.js`, `case Commands.GRADIENT_FILL_STYLE: index += 5`), so under Canvas a gradient fill draws
  with the previously set solid `fillStyle` — a solid top colour set first is the Canvas fallback (proven from source;
  WebGL look checked at the visual gate).
- **Controls.** Every control is absolute-coordinate `Graphics` + `Text` + a separate `Zone`; the e2e hook's
  `target()/targets()` read stored layout rects, never object bounds. Lips exist on `AnswerTiles` (+8 literal),
  `Keypad` (+6 literal), `AgeButton` (`WELCOME_LAYOUT.ages.shadow` 10); none on `ActionButton`, `PageButton`,
  `SpeakerButton`, `RoomSwitchButton`, `StarCounter`, `SettingsIcon`. Fire moments: tiles, keys, `ActionButton` on
  `pointerdown`; page, age, HUD buttons on `pointerup`. No "Podpowiedź"/"Pokaż kroki" button exists (`FeedbackBar` shows
  the hint by itself; `SolutionSteps` has "Następny krok"/"Już wiem" through `ActionButton`) — the lip on `ActionButton`
  covers them (research correction of scope.md).
- **Motion.** `TaskScene.shake` tweens `cameras.main.scrollX` (`ANIMATION.shakeMs/shakeSegments/shakeDistance`), reset in
  `applyParentStage`/`backToAge`. `TaskScene.flyStar` pops then flies 850 ms to `starCounterTarget`, destroyed in the
  chain's `onComplete`; `endFlyingStars` kills chains on "Do pokoju"/`backToAge`. `UIScene` `onStars` calls
  `StarCounter.setValue` synchronously on `changedata-stars` — 7 e2e specs read `counterText` at once. `ProgressDots`
  redraws one `Graphics` (`TASK_LAYOUT.dots` radius 20, gap 62). `SummaryPanel.show` draws all stars at once.
  `RoomScene.celebrate` builds `PURCHASE_STAR_TEXTURE` and `explode(ANIMATION.purchaseParticles)`.
- **Font.** `public/fonts/AtkinsonHyperlegibleNext.ttf` (variable `wght`, `zero` = outer + two counters, `zero.tf` a
  composite of `zero`); the identical original is committed at `designs/martynka-maths-A-v1/fonts/
  AtkinsonHyperlegibleNext.ttf`. `FONT_KEY`/`FONT_URL`/`FONT_FAMILY` in `src/data/layout.ts` are the only code
  references (plus a comment in `tests/pictureLayout.test.ts` and CLAUDE.md). `BootScene` loads through
  `this.load.font`; `fontHealth` keys off `FONT_KEY`. Precache globs include `ttf`.
- **Tests that pin today's behaviour:** `counterText` immediate (7 specs); source-regex tests
  `tests/variantCountWiring.test.ts`, `tests/overflowWiring.test.ts`, `tests/freshRoundWiring.test.ts`,
  `tests/gestureWiring.test.ts`, `tests/dialogSessions.test.ts` (their strings must stay); `tests/layout.test.ts` (rect
  sizes ≥ `MIN_TOUCH_TARGET` 96, HUD overlaps); `tests/dice.test.ts` counts `board.shadow`. Nothing pins the shake, dots
  or notebook drawing.
- `docs/design-gaps.md` ends at row 154; next free row **155**. `context/foundation/lessons.md` does not exist (checked;
  nothing to apply).
- **Baseline** (contract): `main` 6e426ed, unit 3736, e2e 144. Every phase measures its own branch baseline before its
  first edit and writes `baseline + delta`.

## Desired End State

- Task, summary, unlock and welcome show the kit notebook (stitch marks left, margin line, butter bookmark top right,
  12 px darker-teal bottom edge, soft shadow straight down) over a blurred, ivory-washed picture of the child's own salon;
  after a purchase, "Do zadań" shows the new piece in the blurred backdrop. With the salon scene picture missing, or
  under the Canvas renderer without a usable capture, the plain page colour shows as today.
- Answer tiles, keypad keys (OK, "kasuj"), `ActionButton` ("Dalej", "Następny krok", "Już wiem", OK of select/drag),
  page buttons (summary, unlock, done cards, "Rodzic", "Wróć") and age buttons have a darker lip; pressing moves the face
  down onto it (~80 ms) and releasing returns with a Back overshoot (~150 ms); hit zones never move; fire moments are
  unchanged. HUD speaker, "Do pokoju", star counter and gear are kit pills with a lip; the gear stays without press
  feedback.
- A correct answer bounces the answered object 1 → 1.12 → 1 and the counter pops when the flying star lands; the number
  changes at once. A wrong answer wobbles the answered object slowly, never red, no camera shake. Beads are larger and
  the bead that just filled pops. Tiles and keys enter with a ≤ 400 ms ease-out stagger, tappable from the first frame.
  Summary stars pop in one by one, then a burst; buttons tappable at once.
- Every new motion is off under `prefersReducedMotion()` (final state drawn at once).
- Every digit 0 in the game is a plain oval (no slash); Polish diacritics unchanged; `fontHealth` is `loaded`.
- DESIGN-GAP rows 155–164 written; rows 20 (narrowed), 25, 152 updated; CLAUDE.md "Current state" describes the change.

### Key Discoveries:

- An inner `Container` at `(-cx, -cy)` inside an outer `Container` at the rect centre `(cx, cy)` keeps every absolute
  drawing call AND every absolute `Text.setPosition` valid while scale/rotation pivot on the centre (two levels: a `Text`
  directly in the centred container would be double-offset — plan review F1) — the one trick that lets bounce, wobble, press and pop
  reuse today's drawing code (`research.md` (b)/(c): "scale tweens need a local origin").
- `src/core` may import `src/data/layout.ts` (precedent `src/core/roomHit.ts`, `src/core/round/drawingFit.ts`), so pure
  timing and geometry rules read `ANIMATION`/notebook tokens directly.
- `flyStar`'s `onComplete` does not run for a chain `endFlyingStars` killed, so a `starLanded` emit there never pops the
  counter for a star that did not land (closes the "star freezes while `TaskScene` sleeps" follow-up for the pop).
- `fontHealth` in the hook snapshot is the browser's verdict on the modified font (Chromium/OTS proof).

## What We're NOT Doing

- No save, storage, balance, curriculum, generator or task-copy change; no new raster art (the sunflower uses the
  existing `flower.webp`); no new `localStorage` key.
- No spine band and no lower-right offset shadow (D-1: kit CSS/screenshots beat the prose).
- No welcome cushion (collides with "Rodzic", gap 20 narrowed, not closed).
- No press motion on `SettingsIcon` (gaps 25/28/151 — static lip only); no change to the hold, its hint or `longPress`.
- No lip/press change to `SelectTiles` (keeps its toggle-on-down and existing lip), `CoverBoard`, `Dice`, `LetterTiles`,
  room widgets, DOM dialogs; no bounce/wobble for `digits` (written column) and dice answers (follow-ups).
- No burst on `UnlockCard` or `MinigameDoneCard` (scope: "only at the end of a round"); no motion on unlock card stars.
- No live per-frame blur filter; no second `RoomView` in `TaskScene`; no edit of `RoomScene` beyond swapping the burst
  code for the shared helper (identical parameters).
- No change of the 'star' sound delay (`balance.sound.starDelayMs`, balance untouched) although the pop lands later.
- No FontFace time limit (load path unchanged: only `FONT_URL`/`FONT_KEY`/`FONT_FAMILY` change; follow-ups re-recorded);
  no woff2 conversion; no DOM overlay font change (`src/style.css` keeps `sans-serif`).
- No roadmap status edit; no edit of `docs/human-checklist.md`; guide mascot (FR-037) and street (FR-032–FR-036) out.

## Implementation Approach

Tokens and pure rules first (tdd), then the static look (notebook, backdrop), then the chunky helper spread across
controls in three small phases, then motion in three phases, then the font, then docs + seam sweep, then one e2e
phase. Each UI phase introduces at most two new components (`kitDraw.ts`; `SalonBackdrop`; `chunky.ts`; `hudPill.ts`;
`starBurst.ts`). Every new number lives in `src/data/layout.ts`; every timing list is a pure function in
`src/core/motion.ts`; every tween site checks `prefersReducedMotion()` (`src/ui/motion.ts`), pinned by one source test
that grows phase by phase. Each phase that draws something the kit lacks writes its own DESIGN-GAP row (numbers fixed
below) so docs never lag the code.

DESIGN-GAP numbers (fixed here so phases do not collide): **155** salon backdrop, **156** lip on `ActionButton`,
**157** press motion + Back overshoot, **158** HUD pill for counter and gear (row 25 updated), **159** correct bounce +
counter pop, **160** think wobble, **161** beads, **162** entrance stagger, **163** summary pops + burst, **164** plain
zero (kit approved a slashed zero); row **20** narrowed (sunflower only), row **152** updated ("Wróć" lip).

## Critical Implementation Details

- **Never move a zone, never delay state, never delay the number.** The chunky helper moves only a face `Container`;
  the widget's `Zone` stays where it is. `StarCounter.setValue` stays synchronous in `UIScene` `onStars`; only the
  scale pop waits for `GAME_EVENTS.starLanded`. Entrance stagger and summary pops never gate `active`, `shown` or
  `setInteractive` — a tap on a still-fading tile counts (first-try rule has no time input, D-5).
- **Press guard order.** `ActionButton` "Dalej" hides itself in the same `pointerdown`: `press()` then the handler, and
  `hide()` calls the helper's `reset()` (kills tweens, `y = 0`) so the release never re-shows or offsets a hidden face.
  `PageButton` starts the press only after its own `pointerdown` (its `pressed` guard keeps a release of the tap that
  opened the summary from firing).
- **Tween ownership.** Any object that gets a tween is `killTweensOf`-ed before it is destroyed or redrawn
  (`AnswerTiles.destroyTiles`, `ProgressDots` per bead, `SummaryPanel.hide`, `Keypad` hide), so no tween touches a
  destroyed object after "Dalej" or `backToAge`.
- **Backdrop capture.** Capture once into a `DynamicTexture` at `BACKDROP.scale` of 1920×1080 (default ¼ = 480×270)
  using `drawRoomMiniature` with stand-ins suppressed, display one `Image` scaled up at a negative depth with
  `setScrollFactor(0)`, an ivory wash (`PAGE_BACKGROUND` α `BACKDROP.washAlpha` 0.6) above it. `addBlur` only when
  `scene.renderer.type === Phaser.WEBGL`, applied on the source container before capture; `dt.draw(container)` with no
  x/y, then `dt.render()` (v4 queues draw commands). Re-capture in `TaskScene` `onWake` only
  when the registry `rooms` reference differs from the captured one.

## Phase 1: Tokens and pure motion rules

Driver: tdd
Driver why: `staggerDelays`, `summaryPopDelays`, `newlyDone` and `notebookGeometry` are absent pure functions with exact oracles — failing tests lead.

### Overview

All new numbers in `src/data/layout.ts`; pure timing and geometry rules in `src/core/motion.ts` and
`src/core/notebookGeometry.ts` with unit tests. No consumer yet.

### Changes Required:

#### 1. Tokens

**File**: `src/data/layout.ts`

**Intent**: one place for every colour, size, duration and easing this change uses (D-2). Values from the kit CSS
(`research.md` "Design kit views") where the kit has them; the maintainer's numbers otherwise.

**Contract**:
- `TASK_LAYOUT.notebook` radius 44, plus `NOTEBOOK` `{ frame '#54b5a9', faceTop '#fffbef', faceBottom '#fff5df',
  edge { height 12, color '#328476' }, shadow { offsetY 22, blur 36, color '#564730', alpha 0.19 }, stitches { inset 40,
  width 26, overhang 20, height 10, every 100, color '#bfa577' }, margin { fromInnerLeft 92, inset 38, width 2, color
  '#e4ceb2' }, ribbon { width 48, height 74, fromRight 92, top -16, notch 0.78 (butter) } }`.
- `BACKDROP` `{ scale 0.25, washAlpha 0.6, blur { quality 1, x 2, y 2, strength 1, steps 4 }, depth -10 }`.
- `LIPS` (offset + colour + alpha per kit): `answer 8 '#a4bd96' 0.44`, `key 5 '#a4bd96' 0.31`, `age 10 '#a4bd96' 0.3`,
  `page 8 '#397f73' 0.19`, `hud 7 '#8f6d3d' 0.15`, `action 8 '#397f73' 0.19` (gap 156); `HUD_PILL` `{ top '#fffdf2',
  bottom '#fff0cc', border 5, borderColor '#d3b77d', radius 32, height 104 }`.
- `BEADS` `{ radius 28, gap 74, ring 4, currentRing 7 }` + kit bead colours (future `#fff8e5`/`#9cb8a0`, current teal/
  `#245c59`, done `#a6cf7f`/`#547e3d`); fallback if `tests/layout.test.ts` finds an overlap: radius 26, gap 70.
- `ANIMATION` adds `pressDownMs 80`, `pressUpMs 150`, `pressEase 'Quad.easeOut'`, `releaseEase 'Back.easeOut'`,
  `bounceScale 1.12`, `bounceMs 280`, `wobbleAngle 3`, `wobbleOffset 4`, `wobbleMs 520`, `wobbleSwings 2`,
  `counterPopScale 1.18`, `counterPopMs 220`, `beadPopScale 1.3`, `beadPopMs 260`, `entranceSpanMs 400`,
  `entranceItemMs 250`, `entranceRise 24`, `summaryStarStepMs 180`, `summaryStarPopMs 220`, `summaryBurstParticles 22`.
  The `shake*` keys stay until phase 7 removes them.
- `GAME_EVENTS.starLanded`.

#### 2. Pure rules

**Files**: `src/core/motion.ts` (new), `src/core/notebookGeometry.ts` (new)

**Intent**: timing and geometry the widgets apply; no Phaser.

**Contract**:
- `staggerDelays(count: number, spanMs: number, itemMs: number): number[]` — evenly spaced start delays, first 0, last
  start + `itemMs` ≤ `spanMs`; `count` 0 → `[]`; 1 → `[0]`; `itemMs ≥ spanMs` → all 0.
- `summaryPopDelays(stars: number, stepMs: number): number[]` — `i * stepMs`, length = stars (0..6, warm-up 6).
- `newlyDone(prev: RoundView["dots"] | null, next: RoundView["dots"]): number[]` — indices whose `status` became
  `done` (null prev or a length change → `[]`, so a new round never pops all beads). `RoundView["dots"]` (`src/core/round/view.ts`,
  statuses `done | current | todo`) is the type `ProgressDots.update` already takes (import, do not redefine).
- `notebookGeometry(nb = TASK_LAYOUT.notebook, t = NOTEBOOK)` → `{ face, edge, shadow, stitches: Rect[], margin: Rect,
  ribbon: Point[] }` in scene coordinates per the kit (stitches from `top - overhang` to `top + height + overhang` every
  `every` px, x at `left + border + inset`; margin x at `left + border + fromInnerLeft`, from `top + inset` to
  `top + height - inset`; ribbon polygon `(0,0) (w,0) (w,h) (w/2, notch*h) (0,h)` placed `fromRight` from the right edge,
  `top` above the notebook top).

#### 3. Tests

**Files**: `tests/motion.test.ts` (extend; it covers `prefersReducedMotion` today — add a `describe` for the core rules,
or `tests/motionRules.test.ts` new if the file imports Phaser-free code only), `tests/notebookGeometry.test.ts` (new)

**Contract**: literal oracles — `staggerDelays(4, 400, 250)` = `[0, 50, 100, 150]`; `staggerDelays(12, 400, 250)` last
≤ 150 and strictly increasing; edge cases above; `summaryPopDelays(5, 180)` = `[0,180,360,540,720]`;
`newlyDone([done,current,todo…],[done,done,current…])` = `[1]`, null prev → `[]`; geometry: 9 stitches for a 788 px
notebook (y 184, 284 … 984: from top − 20 to top + height + 20 every 100, counted by hand in the test), margin x = 180 + 16 + 92, ribbon top = 188,
ribbon right edge = 180 + 1560 − 92; every geometry rect lies within 0..1920 × 0..1080.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (stubs exported first, so failures are assertions, not import errors), green after; unit `<branch baseline> + N`
- Deliberate break: `staggerDelays` spreads over `spanMs` instead of `spanMs − itemMs` → the "last start + item ≤ span" case red; `newlyDone` returns every done index → the `[1]` case red; stitches start at `top` instead of `top − overhang` → the stitch count case red; each restored; meta-check: the oracles are literal numbers computed from the kit CSS by hand in the test, not from the function's own constants
- `git diff --stat main -- src/data/balance.ts src/core/save.ts tests/fixtures` empty
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

---

## Phase 2: The notebook as in the kit (and the welcome sunflower)

Driver: impl
Driver why: canvas drawing from phase-1 geometry and tokens — visual polish proven by the visual gate.

### Overview

`drawNotebook` draws the kit notebook; a small shared drawing helper holds the gradient fill (with the Canvas fallback)
and the lip; the welcome screen gets the sunflower.

### Changes Required:

#### 1. Drawing helper

**File**: `src/ui/widgets/kitDraw.ts` (new)

**Intent**: the two kit primitives every later phase reuses — a vertical gradient rounded rect that degrades to a solid
fill under Canvas, and a lip (darker rounded rect under a control).

**Contract**: `fillPaper(g: Graphics, rect, radius, top: number, bottom: number): void` — sets `fillStyle(top)` first,
then `fillGradientStyle(top, top, bottom, bottom)` and `fillRoundedRect` (Canvas skips the gradient command and draws
`top`, per `GraphicsCanvasRenderer`); `drawLip(g, rect, radius, lip: { offset, color, alpha }): void` — a rounded rect at
`rect.y + offset`. If `fillRoundedRect` ignores the gradient under WebGL (proof below), `fillPaper` falls back to two
stacked fills (top half `top`, bottom half `bottom`, decided now).

#### 2. Notebook

**File**: `src/ui/widgets/notebook.ts`

**Intent**: draw, in order: soft shadow (a few stacked translucent rounded rects stepping down to `shadow.offsetY`,
approximating `0 22px 36px` without filters), bottom edge (`edge.color` rect `edge.height` below), frame `#54b5a9`
radius 44, face via `fillPaper`, margin line, stitch marks (each with the kit's tiny drop shadow), the ribbon polygon in
butter — all from `notebookGeometry`. Same callers, same signature.

**Contract**: `drawNotebook(scene: Scene): void` unchanged; all at depth 0 (below every task widget, as today).

#### 3. Welcome sunflower

**File**: `src/scenes/WelcomeScene.ts`, `src/data/layout.ts` (`WELCOME_LAYOUT.flower` `{ left 360, top 790, size 152,
angle -14 }`)

**Intent**: the kit's `.welcome-flower` from the existing `flower` task icon (`TASK_ART`); missing texture → nothing
drawn (no stand-in on the welcome). Not interactive.

**Contract**: `docs/design-gaps.md` row 20 narrowed: sunflower drawn, cushion stays out (it overlaps
`WELCOME_LAYOUT.parent`).

### Success Criteria:

#### Automated Verification:

- `grep -n "notebookGeometry\|fillPaper" src/ui/widgets/notebook.ts` both present; `grep -rn "fillGradientStyle" src` lists only `src/ui/widgets/kitDraw.ts`
- Deliberate break: no unit test renders the canvas (node environment) — break `notebookGeometry` (ribbon `fromRight` from the left) → phase-1 geometry test red, restored; meta-check: this proves the geometry the notebook draws from, not the pixels — the pixels are proven by 2.4/2.5
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual Verification:

- [visual] Gradient proof (WebGL, hook build on 4399): the face shows a visible light-to-ivory gradient top to bottom; if flat, switch `fillPaper` to the two-band fallback in this phase and re-shoot; Canvas proof: no switch forces Canvas — record in the phase commit that Canvas draws `top` solid (source-proven) and the face still reads as ivory
- [visual] Desktop 1440 and tablet 1024: welcome and a task (tiles) next to `designs/martynka-maths-A-v1/screenshots/welcome.png` and `task-tiles.png` — stitch marks, margin line, ribbon top right over the frame, 12 px darker bottom edge, shadow below; nothing of the notebook covers the HUD, tiles, prompt or "Rodzic"; the sunflower sits left-bottom clear of the age buttons

---

## Phase 3: The child's salon, blurred, behind the notebook

Driver: impl
Driver why: scene glue over existing `drawRoomMiniature` plus a Phaser texture capture whose risk is visual; the pure mode rule gets a unit test.

### Overview

`SalonBackdrop` captures the current salon once into a small texture, blurs it on WebGL, washes it ivory and shows it
behind the notebook on task (summary, unlock) and welcome; the task scene refreshes it after a purchase.

### Changes Required:

#### 1. Mode rule

**File**: `src/core/backdrop.ts` (new), `tests/backdrop.test.ts` (new)

**Intent**: decide `'salon' | 'plain'` without Phaser: `plain` when the room's current scene picture key does not exist in the
given texture-exists predicate; `salon` otherwise. The key is `stagesDone(room, state) > 0 ? room.scene.after :
room.scene.before` built from `stagesDone` in `src/core/rooms.ts` (plan review F2: no pure key function exists — the rule
is inline in `RoomView.render` and `miniaturePieces`, and `src/core` must not import `src/ui/widgets/RoomView.ts`); the
test cross-checks it against `miniaturePieces(room, state)[0].key` for the fresh and the renovated salon.

**Contract**: `backdropMode(room: RoomDef, state: RoomState, hasTexture: (key: string) => boolean): 'salon' | 'plain'`.
Tests: fresh salon with scene textures → salon; scene key missing → plain; a slot picture missing → still salon (piece
left out).

#### 2. Widget

**File**: `src/ui/widgets/SalonBackdrop.ts` (new)

**Intent**: research option C + WebGL blur (`research.md` (a)). `render(rooms, currentRoom)`: if mode is `plain` draw
nothing and remember `plain`; else draw the pieces with `drawRoomMiniature(scene, g, room, state, 0, 0, BACKDROP.scale,
0)` where `g = scene.make.graphics({}, false)` (never on the display list, so stand-in boxes are never seen; destroyed
after), and move the returned `Image[]` (they are created by `scene.add.image`, i.e. ON the display list) into a
`scene.make.container({ x: 0, y: 0 }, false)` at once (adding to a container removes them from the display list), so
nothing flashes on screen; `enableFilters` + `filters.internal.addBlur(...)` on that container only when
`scene.renderer.type === Phaser.WEBGL` (`enableFilters` is a no-op under Canvas and `filters` stays unset, so an
unguarded `addBlur` throws); `dt.draw(container)` **with no x/y** (Phaser 4.2.1: WebGL adds x/y to the object's position,
Canvas overwrites it — `DynamicTexture.js` `_renderCanvas` vs `DynamicTextureHandler` — so only (0,0) is identical on
both renderers) followed by **`dt.render()`** (v4 queues commands; nothing is drawn without it); a DynamicTexture capture
runs the container's filter render step on WebGL (`Filters.js` `renderWebGLFilters`, confirmed from source in the plan
review), so the blur is baked in. Then destroy the container and its images, show one `Image` of the texture scaled to
1920×1080 at `BACKDROP.depth`, `setScrollFactor(0)`, and a wash rect above it. Re-render destroys the old texture first.
Exposes `mode` and `captures` (count) for the hook.

**Contract**: `class SalonBackdrop { constructor(scene); render(rooms: Record<string, RoomState>, currentRoom: string): void; get
mode(): 'salon' | 'plain'; get captures(): number; destroy(): void }`. No input, no registry writes. DESIGN-GAP comment
→ row **155** ("The kit blurs a static room picture; the game blurs the child's own salon; plain page colour when the
salon picture is missing").

#### 3. Wiring and hook

**Files**: `src/scenes/TaskScene.ts` (`create`: build before `drawNotebook`; `onWake`: re-render only when
`registry.get(REGISTRY_KEYS.rooms)` is not the captured reference — checked at the top of `onWake`, before its
`applyParentStage(false)` / `render()` branch, so a purchase followed by a parent stage change still refreshes), `src/scenes/WelcomeScene.ts` (`create`, from the
registry `rooms` — a fresh save is the neglected salon), `src/testing/e2eHook.ts` (task and welcome snapshots gain
`backdrop: { mode, captures }`, read-only)

**Contract**: the hook field exists only in the hook build (`npm run build` still prints `e2e hook: absent (`).

### Success Criteria:

#### Automated Verification:

- `tests/backdrop.test.ts` red before (stub returns `'salon'`), green after; unit `<phase-2 count> + N`
- Deliberate break: `backdropMode` ignores `hasTexture` → the missing-scene case red; restored; meta-check: the test's texture predicate is built from the real `ROOMS` salon keys, so it is the key `RoomView` draws
- `grep -n "renderer.type" src/ui/widgets/SalonBackdrop.ts` present before any `addBlur`; `grep -rn "addBlur" src` lists only `SalonBackdrop.ts`
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual Verification:

- [visual] Blur-capture proof (WebGL, hook build on 4399): the task screen backdrop is soft (no hard furniture edges) and recognisably the salon; if the capture did NOT bake the blur in (hard edges, blocky), drop the filter and set `BACKDROP.scale` to 0.125 in this phase (decided fallback: softening by the upscale only — never a live per-frame filter) and re-shoot
- [visual] Desktop 1440 and tablet 1024: welcome, task, summary, unlock with the backdrop vs the kit frames `welcome.png`, `task-tiles.png`, `summary.png`, `unlock.png` (kit wash 60 % ivory over a 5 px blur); `?e2eArt=room` shows the plain page colour; room → buy a piece → "Do zadań": the new piece is visible in the backdrop (hook `backdrop.captures` +1)

---

## Phase 4: Chunky helper and the task controls

Driver: impl
Driver why: a presentation helper wired into three widgets; risk is in rendered UI and fire moments, proven by a layout test, a source guard and the existing e2e round specs.

### Overview

`chunky.ts` owns the lip and a face container that moves on press; `AnswerTiles`, `Keypad` (incl. OK and "kasuj") and
`ActionButton` use it. Fire moments unchanged.

### Changes Required:

#### 1. Helper

**File**: `src/ui/widgets/chunky.ts` (new)

**Intent**: `research.md` (b) "Recommended helper", with the Key Discovery pivot done in TWO levels (plan review F1): an
outer `Container` `face` at the rect centre `(cx, cy)` (scale/rotation/`y` pivot here) holding one inner `Container` at
`(-cx, -cy)`; the widget's face `Graphics` AND `Text` go into the inner container and keep their absolute coordinates
and absolute `setPosition` calls unchanged (a `Text` placed directly in a centred container would be double-offset,
because its position is its coordinate — `ActionButton.place` and `PageButton.show` call `label.setPosition(absolute)`).
`place(rect)` moves the outer container to the new centre, the inner one to minus it, and redraws the lip (used by
`ActionButton.place` and `PageButton.show`, whose rect changes per call). A static lip `Graphics` (via `drawLip`)
beneath, outside the containers. Inside a container the children's own depths no longer count: `setDepth(d)` sets the
lip and the outer container (`PageButton.setDepth`, used by `RoomDoneCard`, keeps lip+face at d and the zone at d+2; the
label is ordered inside the face by insertion after its Graphics). `press()` tweens `face.y` to the lip offset
(`pressDownMs`, `pressEase`); `release()` back to 0 (`pressUpMs`, `releaseEase`); under `prefersReducedMotion()` both
set `y` at once. `reset()` kills tweens, `y = 0`, `scale = 1`, `angle = 0`. `setDepth(d)`, `setVisible`, `destroy`.
`face` is exposed for phase 7 (bounce/wobble) and phase 8 (entrance).

**Contract**: `class ChunkyFace { constructor(scene, rect, lip: LipToken, radius); readonly face: Container; add(...objs)
(into the inner container); place(rect); redrawLip(rect); press(); release(); reset(); setDepth(d); setVisible(v);
destroy() }` (`destroy` destroys both containers with their children; `AnswerTiles.destroyTiles` and every `hide`/
`destroy` path call it). No `Zone`, no input.

#### 2. Widgets

**Files**: `src/ui/widgets/AnswerTiles.ts` (`paint`: lip from `LIPS.answer` instead of the literal +8; `press` calls
`chunky.press()` after the synchronous highlight; `pointerup`/`pointerout` release), `src/ui/widgets/Keypad.ts`
(`paintButton`: `LIPS.key` 5 instead of 6, each key a `ChunkyFace`), `src/ui/widgets/ActionButton.ts` (lip
`LIPS.action`; `hide()` calls `reset()`; DESIGN-GAP comment → row **156**)

**Intent**: the lip and press on every task control; the handler still runs on `pointerdown` in the same order;
`destroyTiles`/`hide` reset tweens. DESIGN-GAP row **157** (press motion + Back overshoot beyond kit
`translateY(2px)`).

#### 3. Guards

**Files**: `tests/layout.test.ts` (new case: every chunky control's lip rect `rect.y + rect.height + lip.offset` stays
inside the scene and does not enter the next control's rect — tiles vs bar, keypad rows, bar vs bottom), 
`tests/reducedMotionWiring.test.ts` (new: every file under `src/ui/widgets/` and `src/scenes/` that calls `tweens.add`
or `tweens.chain` added by this change — list maintained in the test — also references `prefersReducedMotion`)

### Success Criteria:

#### Automated Verification:

- New tests green; unit `<phase-3 count> + N`
- Deliberate break: set `LIPS.answer.offset` to 40 → the lip-overlap case red; delete the `prefersReducedMotion` check in `chunky.ts` → the wiring test red; each restored; meta-check: the overlap case reads the real `TASK_LAYOUT` rects and `LIPS`, not copies
- `grep -n "+ 8\|+ 6" src/ui/widgets/AnswerTiles.ts src/ui/widgets/Keypad.ts` shows no lip literal left; existing source-regex tests (`gestureWiring`, `overflowWiring`, `variantCountWiring`) green unchanged
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`task-round`, `drawn-tasks`, `money-pay`, `clock-set` tap the same zones)

#### Manual Verification:

- [visual] Desktop 1440 and tablet 1024: task tiles, task keypad, solution steps ("Następny krok"/"Już wiem"), "Dalej" next to `task-tiles.png`, `task-keypad.png`, `solution-step-1.png`, `correct.png`; lips the kit depth and colour; a held press shows the face sitting on the lip; the tile highlight still appears at once (< 100 ms, PRD)

---

## Phase 5: Page and age buttons on the chunky helper

Driver: impl
Driver why: wiring the phase-4 helper into two more widgets — rendered-UI risk, proven by the layout test and the welcome/summary e2e specs.

### Overview

`PageButton` (summary, unlock "Dalej", done cards, "Rodzic", "Wróć", room buttons) and `AgeButton` use `ChunkyFace`.

### Changes Required:

#### 1. Widgets

**Files**: `src/ui/widgets/PageButton.ts` (lip `LIPS.page`; press on its own `pointerdown` only, release on
`pointerup`/`pointerout`; fire stays on `pointerup` behind the `pressed` guard; `setDepth` keeps lip+face d, label d+1,
zone d+2; `hide()` resets), `src/ui/widgets/AgeButton.ts` (lip `LIPS.age` replaces `ageButtonShadow`/
`WELCOME_LAYOUT.ages.shadow`; label object kept)

**Intent**: same lip and press as the task controls; "Wróć" (secondary `PageButton`) inherits it — `docs/design-gaps.md`
row **152** updated (lip + press like the other page buttons).

**Contract**: `PageButton` and `AgeButton` public APIs unchanged.

#### 2. Guards

**File**: `tests/layout.test.ts` (lip case extended to summary/unlock buttons, "Rodzic", "Wróć", age buttons: lips stay
inside the notebook bottom edge and clear of the build id), `tests/reducedMotionWiring.test.ts` (unchanged list: both
widgets go through `chunky.ts`)

### Success Criteria:

#### Automated Verification:

- Unit `<phase-4 count> + N`, green
- Deliberate break: start the `PageButton` press in `pointerup` instead of `pointerdown` → no unit red (record); instead break `LIPS.page.offset` to 60 → the summary-button lip case red; restored; meta-check: the fire moment is proven by e2e (`first-launch`, `task-round` summary taps) at the orchestrator gate, not by this unit case
- `grep -rn "ageButtonShadow" src` empty (or only the token in `layout.ts` if still used elsewhere, named in the commit)
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`first-launch`, `task-round`, `adaptive` tap these buttons)

#### Manual Verification:

- [visual] Desktop 1440 and tablet 1024: welcome (age buttons, "Rodzic"), summary, unlock, "Wróć" next to `welcome.png`, `summary.png`, `unlock.png`; lips present, no overlap with the notebook edge or the build id

---

## Phase 6: HUD pills

Driver: impl
Driver why: one shared pill drawing for four HUD widgets — visual polish; the layout test pins sizes and overlaps.

### Overview

`hudPill.ts` draws the kit HUD pill (gradient via `fillPaper`, border, lip) for `SpeakerButton`, `RoomSwitchButton`,
`StarCounter` and `SettingsIcon`; speaker and room switch get the chunky press; the counter and the gear stay static.

### Changes Required:

#### 1. Pill

**File**: `src/ui/widgets/hudPill.ts` (new)

**Intent**: closes the follow-up "Shared HUD button for `SpeakerButton`/`RoomSwitchButton`"
(`context/archive/2026-10-12-narrator-round-summary/`): one function for frame, gradient face, border and lip from
`HUD_PILL`/`LIPS.hud`; the pressed colour (`HUD_LAYOUT.speaker.pressed`) stays as a face variant.

**Contract**: `drawHudPill(g, rect, opts: { pressed?: boolean }): void`.

#### 2. Widgets and layout

**Files**: `src/ui/widgets/{SpeakerButton,RoomSwitchButton,StarCounter,SettingsIcon}.ts`, `src/data/layout.ts`
(`HUD_LAYOUT` heights 104 where the kit says so; the counter takes the pill style instead of butter border 4)

**Intent**: speaker and room switch: `ChunkyFace` press (fire on `pointerup` unchanged); counter: pill + a face
container at its centre (for the phase-7 pop), value text unchanged; gear: pill + static lip, no press motion, no
colour change while held (rows 25/28 keep "no feedback"). DESIGN-GAP row **158** (counter and gear as kit HUD pills;
the kit has no gear) and row **25** updated.

### Success Criteria:

#### Automated Verification:

- `tests/layout.test.ts` green with the new HUD heights (HUD rects ≥ 96, no overlap with beads at the phase-1 bead tokens — if it fails, apply the phase-1 bead fallback here and name it); unit `<phase-5 count> + N`
- Deliberate break: set `HUD_PILL.height` to 140 → the HUD overlap case red; restored; meta-check: the overlap case uses the real `HUD_LAYOUT` and `TASK_LAYOUT.dots`/`BEADS` rects
- `grep -n "tweens" src/ui/widgets/SettingsIcon.ts` empty (gear stays motionless); `tests/dialogSessions.test.ts` green unchanged
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`narrator`, `parent-settings`, `room-purchase` use these targets; `counterText` unchanged)

#### Manual Verification:

- [visual] Desktop 1440 and tablet 1024: HUD between tasks (speaker, "Do pokoju", counter, gear) next to `task-tiles.png` HUD; pills share gradient, border and lip; the gear hint bubble still points at the gear

---

## Phase 7: Correct bounce, think wobble, counter pop

Driver: impl
Driver why: scene glue over `TaskScene.submit`/`flyStar` and `UIScene` — the risk is timing in the rendered round; source-wiring tests pin the order like the project's other wiring tests.

### Overview

The answered object bounces on a correct answer and wobbles on a wrong one; the camera shake goes; the counter pops when
the star lands; the star starts from the keypad entry field instead of over the "9" key.

### Changes Required:

#### 1. Scene

**File**: `src/scenes/TaskScene.ts` (`submit`, `shake` → `wobble`, `flyStar`, `answerSpot`, `applyParentStage`,
`backToAge`)

**Intent**: after `render()`, if the phase became `done`: bounce the answered object (tiles mode → the picked tile's
`ChunkyFace.face`; keypad → the entry field, wrapped in a centre container like the chunky face; select/drag/coins/clock
→ the OK `ActionButton` face; digits, dice → none). At the old `shake()` call site: `wobble()` on the same object
(rotation ±`wobbleAngle`, x ±`wobbleOffset`, `wobbleMs`, `wobbleSwings`, `Sine.easeInOut`, ends at rest); colours
unchanged (never red). Remove the camera tween and both `scrollX` resets. `flyStar` `onComplete` emits
`GAME_EVENTS.starLanded` after destroying the star. Keypad `answerSpot` → the entry field centre (closes follow-up
"Flying star starts over the 9 key"). All motion skipped under `prefersReducedMotion()`. DESIGN-GAP rows **159**
(bounce + counter pop) and **160** (wobble).

**Contract**: the order of `answer()` → `playRoundCues` → `syncStars` → variant count → flush → resets → wobble →
`render()` → bounce keeps every string `tests/variantCountWiring.test.ts` asserts.

#### 2. Counter

**Files**: `src/ui/widgets/StarCounter.ts` (`pop()`: scale tween on the face container, `counterPopScale`/`counterPopMs`,
skipped under reduced motion; `setValue` unchanged and synchronous), `src/scenes/UIScene.ts` (listen to
`GAME_EVENTS.starLanded` → `counter.pop()`; remove the listener on shutdown like the others)

#### 3. Tokens and guards

**Files**: `src/data/layout.ts` (remove `ANIMATION.shakeMs/shakeSegments/shakeDistance`), `tests/motionWiring.test.ts`
(new, source-regex like `variantCountWiring`): `UIScene` `onStars` still calls `setValue` directly; `starLanded` is
emitted inside `flyStar`'s `onComplete` and handled by `pop()`; `TaskScene.ts` has no `scrollX`; `wobble` and bounce
sites reference `prefersReducedMotion`. `tests/reducedMotionWiring.test.ts` list gains `TaskScene.ts`, `StarCounter.ts`.

### Success Criteria:

#### Automated Verification:

- `tests/motionWiring.test.ts` red before the change (it asserts `starLanded` and no `scrollX`), green after; unit `<phase-6 count> + N`
- Deliberate break: move `setValue` into the `starLanded` handler → the "setValue in onStars" case red (and, at the orchestrator, `counterText` specs red); emit `starLanded` before the flight → the onComplete case red; each restored; meta-check: the regexes anchor on the method bodies (`onStars`, `flyStar`), not on any occurrence in the file
- `grep -rn "shakeMs\|shakeDistance\|shakeSegments\|cameras.main.scrollX" src` empty
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (7 `counterText` specs green)

#### Manual Verification:

- [visual] Desktop 1440 and tablet 1024 (hook build): correct tile (bounce, green, star flies from above the tile, counter pops on landing — `correct.png`), keypad correct (star starts at the entry field), wrong/second try (tile wobbles slowly, hint yellow, nothing red, notebook still — `second-try.png`, `hint-tiles.png`, `hint-keypad.png`); with `--force-prefers-reduced-motion`/`emulateMedia`: no bounce, wobble, flight or pop, counter number still changes

---

## Phase 8: Beads and entrance stagger

Driver: impl
Driver why: widget motion applying phase-1 pure rules — visual risk only; e2e taps prove tiles stay live.

### Overview

`ProgressDots` draws one bead object per dot with kit colours at the bead size and pops the bead that just filled;
`AnswerTiles` and the `Keypad` stagger their entrance.

### Changes Required:

#### 1. Beads

**File**: `src/ui/widgets/ProgressDots.ts`

**Intent**: one centred container per bead (kit colours, `BEADS` size); `update(dots)` keeps the previous states and pops
(`beadPopScale`/`beadPopMs`, Back.easeOut) the indices from `newlyDone(prev, dots)`; no pop under reduced motion;
`killTweensOf` before redraw/destroy. DESIGN-GAP row **161** (row 18 stays for the sixth dot).

**Contract**: `ProgressDots.update(dots)` signature unchanged; `HudTitle` replacing the dots in variants unchanged.

#### 2. Entrance

**Files**: `src/ui/widgets/AnswerTiles.ts` (`setChoices`), `src/ui/widgets/Keypad.ts` (per-task show)

**Intent**: each tile/key face starts at `y + entranceRise`, alpha 0 and tweens to rest with `Cubic.easeOut`,
`entranceItemMs`, delays from `staggerDelays(n, entranceSpanMs, entranceItemMs)`; zones and `active` live at once; a tap
during the entrance completes the face to rest (`reset()`), then the normal press. Off under reduced motion. DESIGN-GAP
row **162**.

### Success Criteria:

#### Automated Verification:

- `grep -n "staggerDelays" src/ui/widgets/AnswerTiles.ts src/ui/widgets/Keypad.ts` and `grep -n "newlyDone" src/ui/widgets/ProgressDots.ts` present; `tests/reducedMotionWiring.test.ts` list gains `ProgressDots.ts` (and stays green)
- Deliberate break: remove the reduced-motion branch in `ProgressDots` → the wiring test red; restored; meta-check: the e2e tap-during-entrance proof is phase 12 (#11), this unit guard only proves the branch exists
- Unit `<phase-7 count> + N`; full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (round specs tap tiles right after a task shows — proves the stagger does not gate input)

#### Manual Verification:

- [visual] Desktop 1440 and tablet 1024: beads row (future/current/done kit colours, larger, no overlap with HUD pills), a bead filling with a pop after a correct answer; tiles and keypad entering with the stagger (a short screen recording or 3 frames at 0/150/400 ms); reduced motion: everything at rest at once

---

## Phase 9: Summary pops and the end-of-round burst

Driver: impl
Driver why: widget motion plus extraction of the room burst into a shared helper — visual risk; buttons stay tappable (e2e).

### Overview

`SummaryPanel` shows one object per star and pops them one by one, then "+N", then a bigger star burst; the burst code
moves from `RoomScene.celebrate` into `starBurst.ts`, used by both.

### Changes Required:

#### 1. Burst helper

**File**: `src/ui/widgets/starBurst.ts` (new), `src/scenes/RoomScene.ts` (`celebrate` calls it with today's parameters)

**Intent**: one place for the star particle texture (`drawStar` + `generateTexture`, created once per texture manager)
and the `explode`; `RoomScene` behaviour identical (same count `purchaseParticles`, speeds, angles, depth). Editing
`celebrate` only swaps code for the helper — the salon sleep follow-ups (`final-art-salon` F1, `salon-extra-slots`
L-R8/L-R11) are re-recorded with that reason, not taken.

**Contract**: `starBurst(scene, x, y, opts: { count, depth, speed?, scale? }): void`; texture key constant in the helper.

#### 2. Summary

**File**: `src/ui/widgets/SummaryPanel.ts` (`show`, `hide`)

**Intent**: stars as separate centred objects popping in at `summaryPopDelays(n, summaryStarStepMs)`
(`summaryStarPopMs`, Back.easeOut), "+N" after the last, then `starBurst` with `summaryBurstParticles` from the "+N"
star; buttons shown and interactive at once; `hide()` kills tweens and pending delayed calls. Every `SummaryPanel`
(ordinary, warm-up 6 stars, daily puzzle) gets it; `UnlockCard`/`MinigameDoneCard` unchanged. Under reduced motion:
final row at once, no burst. DESIGN-GAP row **163**.

### Success Criteria:

#### Automated Verification:

- `grep -n "starBurst" src/scenes/RoomScene.ts src/ui/widgets/SummaryPanel.ts` present in both; `grep -rn "generateTexture" src/scenes/RoomScene.ts` empty
- Deliberate break: show the summary buttons only after the last pop (delayed call) → at the orchestrator `task-round`/`adaptive` specs red (they tap `nextRound` at once), restored — the agent records the break and its expected red; unit guard: `tests/reducedMotionWiring.test.ts` list gains `SummaryPanel.ts`, `starBurst.ts`
- Unit `<phase-8 count> + N`; full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`room-purchase`, `salon-art` still green after the burst move)

#### Manual Verification:

- [visual] Desktop 1440 and tablet 1024: summary of a clean round (5 stars pop in, "+N", burst) and a warm-up summary (6 stars centred) next to `summary.png`; a purchase in the room still bursts as before; reduced motion: static summary

---

## Phase 10: Plain zero (Martynka Next)

Driver: impl
Driver why: a font build script and constants — tooling, proven by a font-table unit test and the browser's `fontHealth`.

### Overview

`scripts/make-font.py` builds `public/fonts/MartynkaNext.ttf` from the committed original in `designs/`; the game loads
it under a new key; a unit test reads the shipped font's tables.

### Changes Required:

#### 1. Build script

**Files**: `scripts/make-font.py` (new), `package.json` (`"font": "python3 scripts/make-font.py"`)

**Intent**: research (d) option 1: replace the two counters of `zero` with one oval counter derived from the outer
contour per gvar master (IUP-inferred deltas filled first), `zero.tf` follows (composite); rename name IDs 1, 3, 4, 6,
16/17 (if present), 25 to "Martynka Next"; append a modification note to name ID 5; **name ID 0 untouched**; fixed
`head.modified`, `recalcTimestamp=False` (byte-identical rebuilds). Input `designs/martynka-maths-A-v1/fonts/
AtkinsonHyperlegibleNext.ttf`; output `public/fonts/MartynkaNext.ttf`; the old `public/fonts/AtkinsonHyperlegibleNext.ttf`
removed (no longer precached). `public/fonts/OFL.txt` kept with one added line naming the modification and the new
name. Local tool (needs `fontTools`), output committed, not run in CI; the script refuses to run on a `fontTools` version other
than the one it was written against (research ran 4.61.1; the pinned version is written in the script header and in the
commit) so a rebuild on another machine is byte-identical or fails loudly (plan review F5).

#### 1b. Deploy smoke

**File**: `scripts/check-deploy.ts`

**Intent**: the font joins the tables the smoke checks against the served precache (plan review F4): next to the four
`precacheCovers` calls inside `if (sha7)`, `record(precacheCovers('task font', precache, [FONT_URL]))` (`FONT_URL` from
`src/data/layout.ts`, which imports only a type, so the Node script can import it like `TASK_ART`). A rollback (no SHA)
skips it like the others.

#### 2. Constants

**File**: `src/data/layout.ts` (`FONT_KEY 'MartynkaNext'`, `FONT_URL 'fonts/MartynkaNext.ttf'`, `FONT_FAMILY
'MartynkaNext, sans-serif'`), comment in `tests/pictureLayout.test.ts` if it names the font

**Intent**: the load path in `BootScene` is unchanged (only the constants), so the FontFace time-limit follow-ups do not
fire (re-recorded in phase 11). DESIGN-GAP row **164** (plain zero overrides the kit's approved slashed zero, by the
maintainer).

#### 3. Test

**File**: `tests/fontZero.test.ts` (new; DataView over the TTF, no Python)

**Contract**: shipped font: `zero` glyph has exactly 2 contours (outer + one counter); `name` ID 1 / 16 contain "Martynka
Next" and no "Hyperlegible"; name ID 0 equals the original's in `designs/`; `cmap` U+0030 still maps to `zero`; the
glyph count equals the original's; `fvar` still has the `wght` axis 200–800.

### Success Criteria:

#### Automated Verification:

- `npm run font` run twice → `cmp` of the two outputs identical (recorded in the commit)
- `tests/fontZero.test.ts` red when pointed at the original (deliberate break: swap the path to `designs/…/AtkinsonHyperlegibleNext.ttf` → the 2-contour and name cases red), green on the shipped file; restored; meta-check: the contour count is read from `glyf`/`loca` bytes, independent of the script
- `grep -rn "AtkinsonHyperlegibleNext" src tests scripts vite` lists only `scripts/make-font.py` (input path); build green and `dist/sw.js` lists `fonts/MartynkaNext.ttf` (grep) and not the old file; `grep -n "precacheCovers('task font'" scripts/check-deploy.ts` present
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`; Chromium/OTS proof: the hook-build snapshot reads `fontHealth === 'loaded'` with the new font (read at the 10.5 visual pass, pinned later by phase 12 "#11 reduced motion round") — `health-lines.spec.ts` only proves a 404 still reads `fallback`, not that Chromium accepts the modified file

#### Manual Verification:

- [visual] Desktop 1440 and tablet 1024: keypad (0 key), a task with 0 in the prompt ("10 + 20"), summary "+10" if available: a plain oval 0, 0 visibly narrower than O, 1/7 unchanged, Polish diacritics (ą ę ł ś ć ź ż ń ó) render in prompts and the welcome title; fallback decided in advance: if the hook reports `fontHealth: 'fallback'` in Chromium, revert to the original file and constants in this phase, keep the script, and record a follow-up (the zero stays slashed)

---

## Phase 11: Docs, follow-ups, seam sweep and the full visual pass

Driver: impl
Driver why: rule-file text, design-gap rows, follow-ups and leftovers over phases 1–10 — docs and glue, proven by the gate and the screenshot pass.

### Overview

The rule files describe the new code; every deferred item has a trigger; duplicates and stale comments go.

### Changes Required:

#### 1. Rule files

**File**: `CLAUDE.md` "Current state" (and `AGENTS.md` if it repeats the facts — grep first)

**Intent**: one sentence group for this change: kit notebook (`notebookGeometry`, `kitDraw.ts`), `SalonBackdrop`
(capture, WebGL-only blur, plain fallback, refresh on wake), `chunky.ts` + `LIPS`, `hudPill.ts`, motion rules in
`src/core/motion.ts` + `ANIMATION` keys, `GAME_EVENTS.starLanded` (number synchronous, pop on landing), wobble instead of
the camera shake, beads, entrance stagger, summary pops + `starBurst.ts`, font "Martynka Next" (`npm run font`,
`scripts/make-font.py`, plain zero), gaps 155–164; save format stays v4. Fix sentences made untrue (the font file name
in the "Current state" paragraph and `## Commands`; the "flying star" sentence if it names the shake).

#### 2. Seam sweep

**Files**: anything phases 1–10 left

**Intent**: duplicated helpers (gradient/lip code outside `kitDraw.ts`, a second star-texture builder, per-widget press
code bypassing `chunky.ts`), stale comments (`shake`, `+ 8` lip, "slashed zero", "Atkinson" in comments describing the
shipped font), unused tokens (`ageButtonShadow`, `WELCOME_LAYOUT.ages.shadow`, old dot colours), the `HUD_LAYOUT.speaker`
fill now drawn by `hudPill`; `docs/design-gaps.md` rows 155–164 present and rows 20, 25, 152 read correctly; kit rows
nothing else changed.

#### 3. Follow-ups

**File**: `context/changes/notebook-polish/follow-ups/review-fixes.md` (new)

**Intent**: one entry per deferred item with a `Trigger:` line: bounce/wobble for `digits` and dice; lip/press for
`SelectTiles`, `CoverBoard`, `LetterTiles`, `Dice`; welcome cushion (Trigger: "Rodzic" moves); 'star' sound vs landing
pop timing (Trigger: S-17 balance pass); FontFace time limit (re-recorded, load path unchanged); salon sleep follow-ups
(re-recorded, `celebrate` swapped code only); solution step indicator dots (re-recorded); FeedbackBar text size
(Trigger: visual gate or tablet finds it unreadable); unlock/minigame-done bursts (Trigger: maintainer request); spine
band / offset shadow (Trigger: maintainer at the visual gate); Safari acceptance of the modified font (Trigger: [human]
iPad row finds a fallback); bare stroke/animation numbers in widgets this change did not touch (re-recorded from
`narrator-round-summary`). Closed entries marked closed: slashed zero (phase 10), shared HUD button (phase 6), star
over the 9 key (phase 7), star freezing while asleep — pop part (phase 7), `StarCounter` value never asserted.

### Success Criteria:

#### Automated Verification:

- `grep -c "^Trigger:" context/changes/notebook-polish/follow-ups/review-fixes.md` ≥ 12
- `for n in 155 156 157 158 159 160 161 162 163 164; do grep -q "^| $n |" docs/design-gaps.md || echo MISSING $n; done` prints nothing
- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS (every path CLAUDE.md names exists)
- `grep -rn "fillGradientStyle" src` only `kitDraw.ts`; `grep -rn "generateTexture" src` has no second star-texture builder; `git diff --stat main -- src/data/balance.ts src/core/save.ts src/core/migrations tests/fixtures src/data/curriculum src/data/wordTemplates.ts` empty
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] The CLAUDE.md sentences match the code (grep each named symbol); save format v4 stated; gaps 155–164 and the updated rows 20, 25, 152 read correctly
- [visual] Full screenshot pass, desktop 1440 and tablet 1024 (hook build on 4399), each state next to its kit frame in `designs/martynka-maths-A-v1/screenshots/`: welcome (`welcome.png`), task tiles (`task-tiles.png`), task keypad (`task-keypad.png`), correct (`correct.png`), wrong / second try (`second-try.png`, `hint-tiles.png`, `hint-keypad.png`), solution steps (`solution-step-1.png`, `solution-step-2.png`), summary (`summary.png`), unlock (`unlock.png`), room → buy a piece → back to the task (backdrop shows the new piece), reduced motion (static frames, no flight/pop); also `tablet-1024.png` for the 1024 layout; every chunky target still ≥ 96 px; nothing red after a wrong answer
- [human] The maintainer checks the look (notebook, backdrop, lips, motion feel) and the plain zero on the real tablet (iPad Safari: `fontHealth` loaded — the diacritics and 0 render in the new font) before "merguj", and confirms decision D-1, which departs from scope.md's words: no spine band (kit stitch marks only) and the shadow straight down, not lower-right

---

## Phase 12: The polished round stays playable by touch — e2e (#11, #12)

Driver: e2e
Driver why: risks #11 (round by touch: zones, stars, counter) and #12 (first launch by touch) exist only in the rendered canvas with motion on; the features are built by phases 3–10, contract `E2E=on`.

### Overview

One new spec `tests/e2e/notebook-polish.spec.ts` (hook build, port 4397) pins what the motion must never break and the
backdrop wiring.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/notebook-polish.spec.ts` (titles `#11 …` / `#12 …`)

**Contract**: model on `task-round.spec.ts` and `support/{hook,welcome,salon}.ts`; strings from `pl`, targets from the
hook, never fixed coordinates:
- `#12 welcome backdrop and age tap` — fresh context: welcome snapshot `backdrop.mode === 'salon'`; `passWelcomeAsChild`
  works with the chunky age buttons.
- `#11 counter immediate with motion on` — no reduced motion: tap the right tile the moment the task shows (during the
  entrance), `counterText` is the new total in the next snapshot (no wait for the landing).
- `#11 summary buttons live during the pops` — finish a round, tap `nextRound` immediately; next round starts.
- `#11 backdrop refreshes after a purchase` — `?e2eStars=N`, buy the first task in the room, back to the task:
  `backdrop.captures` increased and `mode === 'salon'`.
- `#11 plain page without salon art` — `?e2eArt=room`: task snapshot `backdrop.mode === 'plain'`, round playable.
- `#11 reduced motion round` — `page.emulateMedia({ reducedMotion: 'reduce' })` before `goto`: a full round plays, stars
  and counter as with motion; `fontHealth === 'loaded'`.

No `sleep`/`until`/`while` loops or `tail -f` waiters (profile § 8); waits through `expect.poll` on the hook.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each run alone with `-g`: move `setValue` into the `starLanded` handler → "counter immediate" red; skip the `onWake` re-capture → "backdrop refreshes" red; gate tile `active` until the stagger ends → "counter immediate" red (tap lands on an inactive tile); restored), green after
- `npx playwright test tests/e2e/notebook-polish.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 6`; total equals `npx playwright test --list | tail -1`
- Full local gate green

---

## Testing Strategy

### Unit Tests:

- `staggerDelays`, `summaryPopDelays`, `newlyDone`, `notebookGeometry` with literal kit-derived oracles (phase 1).
- `backdropMode` against the real salon keys (phase 3).
- Lip rects inside the scene and clear of neighbours; HUD pill heights vs beads (phases 4–6, `tests/layout.test.ts`).
- Source wiring: reduced-motion checks at every new tween site; `setValue` synchronous; `starLanded` on landing; no
  camera `scrollX` (phases 4–9).
- Shipped font tables: one counter in `zero`, renamed family, name ID 0 kept (phase 10).

### Integration Tests:

- Existing e2e suite unchanged in count through phases 1–11 (zones, `counterText`, summary taps); phase 12 adds 6 tests.

### Manual Testing Steps:

1. Hook build, fresh context: welcome over the blurred salon, sunflower, chunky age buttons.
2. A round with a wrong then right answer: wobble, hint, bounce, star flight, counter pop, bead pop.
3. Summary pops and burst; "Do pokoju" → buy → "Do zadań": backdrop shows the new piece.
4. Reduced motion: everything static, round playable.
5. Keypad 0 and "10 + 20" prompt: plain zero.

## Performance Considerations

The backdrop is one 480×270 texture and one quad per frame; the capture (≤ ~17 images) runs at create and at a wake
after a purchase only. Tweens are short-lived and per object; no per-frame filter.

## Migration Notes

None: save format v4 unchanged (table in Overview). The font file name changes, so the service worker precache drops the
old file and fetches the new one at the next update (normal precache revision behaviour).

## Known risks

- The capture-with-filter path is inferred from Phaser source, not run; phase 3 proves it and has the ⅛-scale fallback.
- WebGL `fillGradientStyle` on rounded rects may draw flat; phase 2 proves it and has the two-band fallback.
- Safari/iPadOS acceptance of the modified font is not provable locally (Chromium only); the [human] row checks it, and
  the game falls back to `sans-serif` with the existing "Obrazki" font line if rejected.
- Larger beads and 104 px HUD pills may crowd the HUD row; the phase-1 fallback tokens exist.
- Under Canvas the backdrop capture is unblurred (¼ scale upscaled); acceptable softening, not provable locally (no
  switch forces Canvas). Plan review F1/F2 fixes keep the Canvas path throw-free (no `filters` access, draw at (0,0)).

## Autonomous decisions

- **P-1 Twelve small phases** (research proposed 8). Rejected: research's phases 3/4 each touching 4–7 widgets and two
  components. Why: the step prompt caps a UI phase at ~2 new components and asks for small, independently green phases
  for fresh agents. Would change: the orchestrator's token measurements showing per-phase overhead dominates.
- **P-2 Pivot trick (child at `(-cx,-cy)` in a centred container)** for press, bounce, wobble and pops. Rejected:
  rewriting each widget's drawing in local coordinates. Why: zero drawing changes, zones untouched. Would change: a
  Phaser 4 input or mask quirk with nested containers found in phase 4.
- **P-3 Bounce/wobble targets**: picked tile, keypad entry field, the OK `ActionButton` for select/drag/coins/clock;
  none for digits and dice (follow-up). Why: these are the objects the child confirmed; the column and the board have no
  single "answer box". Would change: the maintainer asking for motion there.
- **P-4 Gradient via `fillGradientStyle` with a solid-first Canvas fallback** (source-proven skip), two-band fallback if
  WebGL draws flat. Rejected: pre-rendered gradient textures (more objects). Would change: the visual gate.
- **P-5 Backdrop = capture at ¼ + WebGL-only blur; ⅛ without blur as the decided fallback** (research option C).
  Rejected: live filter. Would change: the phase-3 proof row.
- **P-6 Font: modified Atkinson Next, renamed "Martynka Next" (`MartynkaNext.ttf`), built from the committed copy in
  `designs/`, old public file removed.** Rejected: second OFL digits font, composite `O`. Would change: Chromium
  reporting `fontHealth: 'fallback'` (then revert in phase 10, follow-up).
- **P-7 `starBurst` extracted and used by `RoomScene` with identical parameters**; salon sleep follow-ups re-recorded
  (code swap, no behaviour change). Rejected: copying the texture code (a duplicate the seam sweep would flag). Would
  change: the impl-review finding a behaviour change in `celebrate`.
- **P-8 Burst on every `SummaryPanel`** (ordinary, warm-up, daily puzzle); none on unlock/minigame-done cards. Why: each
  is "the end of a round" (scope); the cards are not. Would change: maintainer request.
- **P-9 `SelectTiles`, `CoverBoard`, `Dice`, `LetterTiles` keep their look** (not in scope's control list; `SelectTiles`
  toggles on down). Would change: maintainer request (follow-up).
- **P-10 One e2e phase with 6 tests after the seam sweep**; the hook gains `backdrop` in phase 3 (glue). Rejected: an e2e
  per motion phase (cost, flake budget). Would change: a motion phase breaking an existing spec the new one would not
  catch.
- **P-11 No PRD conflict.** PRD NFR "touch reaction < 100 ms" holds (highlight synchronous, press starts at once); "ogranicz
  ruch" holds (all new motion off); "nothing only by colour" holds (bounce + star with green). The plain zero overrides
  the KIT (not the PRD) by the maintainer's own decision (PA-10), so no `[human]` decision row beyond the required
  tablet check 11.8.
- **P-12 Gap numbers fixed in the plan** (155–164), each written by the phase that draws it; phase 11 only verifies.

## References

- Research: `context/changes/notebook-polish/research.md`
- Change identity, PA-1..PA-13, D-1..D-7: `context/changes/notebook-polish/change.md`
- Scope: `context/runs/2026-10-22-notebook-polish/scope.md`
- Kit: `designs/martynka-maths-A-v1/{style-guide.md,screen.css,maths.css,screenshots/}`
- Format example: `context/archive/2026-10-21-post-run-polish/plan.md`
- Test-plan risks #11, #12: `context/foundation/test-plan.md`; E2E setup: `context/foundation/test-stack.md` § E2E

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Tokens and pure motion rules

#### Automated

- [x] 1.1 New tests red before the change (stubs exported first, so failures are assertions, not import errors), green after; unit `<branch baseline> + N` — a659097
- [x] 1.2 Deliberate break: `staggerDelays` spreads over `spanMs` instead of `spanMs − itemMs` → the "last start + item ≤ span" case red; `newlyDone` returns every done index → the `[1]` case red; stitches start at `top` instead of `top − overhang` → the stitch count case red; each restored; meta-check: the oracles are literal numbers computed from the kit CSS by hand in the test, not from the function's own constants — a659097
- [x] 1.3 `git diff --stat main -- src/data/balance.ts src/core/save.ts tests/fixtures` empty — a659097
- [x] 1.4 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` — a659097

### Phase 2: The notebook as in the kit (and the welcome sunflower)

#### Automated

- [ ] 2.1 `grep -n "notebookGeometry\|fillPaper" src/ui/widgets/notebook.ts` both present; `grep -rn "fillGradientStyle" src` lists only `src/ui/widgets/kitDraw.ts`
- [ ] 2.2 Deliberate break: no unit test renders the canvas (node environment) — break `notebookGeometry` (ribbon `fromRight` from the left) → phase-1 geometry test red, restored; meta-check: this proves the geometry the notebook draws from, not the pixels — the pixels are proven by 2.4/2.5
- [ ] 2.3 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual

- [ ] 2.4 [visual] Gradient proof (WebGL, hook build on 4399): the face shows a visible light-to-ivory gradient top to bottom; if flat, switch `fillPaper` to the two-band fallback in this phase and re-shoot; Canvas proof: no switch forces Canvas — record in the phase commit that Canvas draws `top` solid (source-proven) and the face still reads as ivory
- [ ] 2.5 [visual] Desktop 1440 and tablet 1024: welcome and a task (tiles) next to `designs/martynka-maths-A-v1/screenshots/welcome.png` and `task-tiles.png` — stitch marks, margin line, ribbon top right over the frame, 12 px darker bottom edge, shadow below; nothing of the notebook covers the HUD, tiles, prompt or "Rodzic"; the sunflower sits left-bottom clear of the age buttons

### Phase 3: The child's salon, blurred, behind the notebook

#### Automated

- [ ] 3.1 `tests/backdrop.test.ts` red before (stub returns `'salon'`), green after; unit `<phase-2 count> + N`
- [ ] 3.2 Deliberate break: `backdropMode` ignores `hasTexture` → the missing-scene case red; restored; meta-check: the test's texture predicate is built from the real `ROOMS` salon keys, so it is the key `RoomView` draws
- [ ] 3.3 `grep -n "renderer.type" src/ui/widgets/SalonBackdrop.ts` present before any `addBlur`; `grep -rn "addBlur" src` lists only `SalonBackdrop.ts`
- [ ] 3.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual

- [ ] 3.5 [visual] Blur-capture proof (WebGL, hook build on 4399): the task screen backdrop is soft (no hard furniture edges) and recognisably the salon; if the capture did NOT bake the blur in (hard edges, blocky), drop the filter and set `BACKDROP.scale` to 0.125 in this phase (decided fallback: softening by the upscale only — never a live per-frame filter) and re-shoot
- [ ] 3.6 [visual] Desktop 1440 and tablet 1024: welcome, task, summary, unlock with the backdrop vs the kit frames `welcome.png`, `task-tiles.png`, `summary.png`, `unlock.png` (kit wash 60 % ivory over a 5 px blur); `?e2eArt=room` shows the plain page colour; room → buy a piece → "Do zadań": the new piece is visible in the backdrop (hook `backdrop.captures` +1)

### Phase 4: Chunky helper and the task controls

#### Automated

- [ ] 4.1 New tests green; unit `<phase-3 count> + N`
- [ ] 4.2 Deliberate break: set `LIPS.answer.offset` to 40 → the lip-overlap case red; delete the `prefersReducedMotion` check in `chunky.ts` → the wiring test red; each restored; meta-check: the overlap case reads the real `TASK_LAYOUT` rects and `LIPS`, not copies
- [ ] 4.3 `grep -n "+ 8\|+ 6" src/ui/widgets/AnswerTiles.ts src/ui/widgets/Keypad.ts` shows no lip literal left; existing source-regex tests (`gestureWiring`, `overflowWiring`, `variantCountWiring`) green unchanged
- [ ] 4.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`task-round`, `drawn-tasks`, `money-pay`, `clock-set` tap the same zones)

#### Manual

- [ ] 4.5 [visual] Desktop 1440 and tablet 1024: task tiles, task keypad, solution steps ("Następny krok"/"Już wiem"), "Dalej" next to `task-tiles.png`, `task-keypad.png`, `solution-step-1.png`, `correct.png`; lips the kit depth and colour; a held press shows the face sitting on the lip; the tile highlight still appears at once (< 100 ms, PRD)

### Phase 5: Page and age buttons on the chunky helper

#### Automated

- [ ] 5.1 Unit `<phase-4 count> + N`, green
- [ ] 5.2 Deliberate break: start the `PageButton` press in `pointerup` instead of `pointerdown` → no unit red (record); instead break `LIPS.page.offset` to 60 → the summary-button lip case red; restored; meta-check: the fire moment is proven by e2e (`first-launch`, `task-round` summary taps) at the orchestrator gate, not by this unit case
- [ ] 5.3 `grep -rn "ageButtonShadow" src` empty (or only the token in `layout.ts` if still used elsewhere, named in the commit)
- [ ] 5.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`first-launch`, `task-round`, `adaptive` tap these buttons)

#### Manual

- [ ] 5.5 [visual] Desktop 1440 and tablet 1024: welcome (age buttons, "Rodzic"), summary, unlock, "Wróć" next to `welcome.png`, `summary.png`, `unlock.png`; lips present, no overlap with the notebook edge or the build id

### Phase 6: HUD pills

#### Automated

- [ ] 6.1 `tests/layout.test.ts` green with the new HUD heights (HUD rects ≥ 96, no overlap with beads at the phase-1 bead tokens — if it fails, apply the phase-1 bead fallback here and name it); unit `<phase-5 count> + N`
- [ ] 6.2 Deliberate break: set `HUD_PILL.height` to 140 → the HUD overlap case red; restored; meta-check: the overlap case uses the real `HUD_LAYOUT` and `TASK_LAYOUT.dots`/`BEADS` rects
- [ ] 6.3 `grep -n "tweens" src/ui/widgets/SettingsIcon.ts` empty (gear stays motionless); `tests/dialogSessions.test.ts` green unchanged
- [ ] 6.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`narrator`, `parent-settings`, `room-purchase` use these targets; `counterText` unchanged)

#### Manual

- [ ] 6.5 [visual] Desktop 1440 and tablet 1024: HUD between tasks (speaker, "Do pokoju", counter, gear) next to `task-tiles.png` HUD; pills share gradient, border and lip; the gear hint bubble still points at the gear

### Phase 7: Correct bounce, think wobble, counter pop

#### Automated

- [ ] 7.1 `tests/motionWiring.test.ts` red before the change (it asserts `starLanded` and no `scrollX`), green after; unit `<phase-6 count> + N`
- [ ] 7.2 Deliberate break: move `setValue` into the `starLanded` handler → the "setValue in onStars" case red (and, at the orchestrator, `counterText` specs red); emit `starLanded` before the flight → the onComplete case red; each restored; meta-check: the regexes anchor on the method bodies (`onStars`, `flyStar`), not on any occurrence in the file
- [ ] 7.3 `grep -rn "shakeMs\|shakeDistance\|shakeSegments\|cameras.main.scrollX" src` empty
- [ ] 7.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (7 `counterText` specs green)

#### Manual

- [ ] 7.5 [visual] Desktop 1440 and tablet 1024 (hook build): correct tile (bounce, green, star flies from above the tile, counter pops on landing — `correct.png`), keypad correct (star starts at the entry field), wrong/second try (tile wobbles slowly, hint yellow, nothing red, notebook still — `second-try.png`, `hint-tiles.png`, `hint-keypad.png`); with `--force-prefers-reduced-motion`/`emulateMedia`: no bounce, wobble, flight or pop, counter number still changes

### Phase 8: Beads and entrance stagger

#### Automated

- [ ] 8.1 `grep -n "staggerDelays" src/ui/widgets/AnswerTiles.ts src/ui/widgets/Keypad.ts` and `grep -n "newlyDone" src/ui/widgets/ProgressDots.ts` present; `tests/reducedMotionWiring.test.ts` list gains `ProgressDots.ts` (and stays green)
- [ ] 8.2 Deliberate break: remove the reduced-motion branch in `ProgressDots` → the wiring test red; restored; meta-check: the e2e tap-during-entrance proof is phase 12 (#11), this unit guard only proves the branch exists
- [ ] 8.3 Unit `<phase-7 count> + N`; full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (round specs tap tiles right after a task shows — proves the stagger does not gate input)

#### Manual

- [ ] 8.4 [visual] Desktop 1440 and tablet 1024: beads row (future/current/done kit colours, larger, no overlap with HUD pills), a bead filling with a pop after a correct answer; tiles and keypad entering with the stagger (a short screen recording or 3 frames at 0/150/400 ms); reduced motion: everything at rest at once

### Phase 9: Summary pops and the end-of-round burst

#### Automated

- [ ] 9.1 `grep -n "starBurst" src/scenes/RoomScene.ts src/ui/widgets/SummaryPanel.ts` present in both; `grep -rn "generateTexture" src/scenes/RoomScene.ts` empty
- [ ] 9.2 Deliberate break: show the summary buttons only after the last pop (delayed call) → at the orchestrator `task-round`/`adaptive` specs red (they tap `nextRound` at once), restored — the agent records the break and its expected red; unit guard: `tests/reducedMotionWiring.test.ts` list gains `SummaryPanel.ts`, `starBurst.ts`
- [ ] 9.3 Unit `<phase-8 count> + N`; full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`room-purchase`, `salon-art` still green after the burst move)

#### Manual

- [ ] 9.4 [visual] Desktop 1440 and tablet 1024: summary of a clean round (5 stars pop in, "+N", burst) and a warm-up summary (6 stars centred) next to `summary.png`; a purchase in the room still bursts as before; reduced motion: static summary

### Phase 10: Plain zero (Martynka Next)

#### Automated

- [ ] 10.1 `npm run font` run twice → `cmp` of the two outputs identical (recorded in the commit)
- [ ] 10.2 `tests/fontZero.test.ts` red when pointed at the original (deliberate break: swap the path to `designs/…/AtkinsonHyperlegibleNext.ttf` → the 2-contour and name cases red), green on the shipped file; restored; meta-check: the contour count is read from `glyf`/`loca` bytes, independent of the script
- [ ] 10.3 `grep -rn "AtkinsonHyperlegibleNext" src tests scripts vite` lists only `scripts/make-font.py` (input path); build green and `dist/sw.js` lists `fonts/MartynkaNext.ttf` (grep) and not the old file; `grep -n "precacheCovers('task font'" scripts/check-deploy.ts` present
- [ ] 10.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`; Chromium/OTS proof: the hook-build snapshot reads `fontHealth === 'loaded'` with the new font (read at the 10.5 visual pass, pinned later by phase 12 "#11 reduced motion round") — `health-lines.spec.ts` only proves a 404 still reads `fallback`, not that Chromium accepts the modified file

#### Manual

- [ ] 10.5 [visual] Desktop 1440 and tablet 1024: keypad (0 key), a task with 0 in the prompt ("10 + 20"), summary "+10" if available: a plain oval 0, 0 visibly narrower than O, 1/7 unchanged, Polish diacritics (ą ę ł ś ć ź ż ń ó) render in prompts and the welcome title; fallback decided in advance: if the hook reports `fontHealth: 'fallback'` in Chromium, revert to the original file and constants in this phase, keep the script, and record a follow-up (the zero stays slashed)

### Phase 11: Docs, follow-ups, seam sweep and the full visual pass

#### Automated

- [ ] 11.1 `grep -c "^Trigger:" context/changes/notebook-polish/follow-ups/review-fixes.md` ≥ 12
- [ ] 11.2 `for n in 155 156 157 158 159 160 161 162 163 164; do grep -q "^| $n |" docs/design-gaps.md || echo MISSING $n; done` prints nothing
- [ ] 11.3 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS (every path CLAUDE.md names exists)
- [ ] 11.4 `grep -rn "fillGradientStyle" src` only `kitDraw.ts`; `grep -rn "generateTexture" src` has no second star-texture builder; `git diff --stat main -- src/data/balance.ts src/core/save.ts src/core/migrations tests/fixtures src/data/curriculum src/data/wordTemplates.ts` empty
- [ ] 11.5 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual

- [ ] 11.6 [reviewer] The CLAUDE.md sentences match the code (grep each named symbol); save format v4 stated; gaps 155–164 and the updated rows 20, 25, 152 read correctly
- [ ] 11.7 [visual] Full screenshot pass, desktop 1440 and tablet 1024 (hook build on 4399), each state next to its kit frame in `designs/martynka-maths-A-v1/screenshots/`: welcome (`welcome.png`), task tiles (`task-tiles.png`), task keypad (`task-keypad.png`), correct (`correct.png`), wrong / second try (`second-try.png`, `hint-tiles.png`, `hint-keypad.png`), solution steps (`solution-step-1.png`, `solution-step-2.png`), summary (`summary.png`), unlock (`unlock.png`), room → buy a piece → back to the task (backdrop shows the new piece), reduced motion (static frames, no flight/pop); also `tablet-1024.png` for the 1024 layout; every chunky target still ≥ 96 px; nothing red after a wrong answer
- [ ] 11.8 [human] The maintainer checks the look (notebook, backdrop, lips, motion feel) and the plain zero on the real tablet (iPad Safari: `fontHealth` loaded — the diacritics and 0 render in the new font) before "merguj", and confirms decision D-1, which departs from scope.md's words: no spine band (kit stitch marks only) and the shadow straight down, not lower-right

### Phase 12: The polished round stays playable by touch — e2e (#11, #12)

#### Automated

- [ ] 12.1 Spec red before (deliberate breaks, each run alone with `-g`: move `setValue` into the `starLanded` handler → "counter immediate" red; skip the `onWake` re-capture → "backdrop refreshes" red; gate tile `active` until the stagger ends → "counter immediate" red (tap lands on an inactive tile); restored), green after
- [ ] 12.2 `npx playwright test tests/e2e/notebook-polish.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 6`; total equals `npx playwright test --list | tail -1`
- [ ] 12.3 Full local gate green
