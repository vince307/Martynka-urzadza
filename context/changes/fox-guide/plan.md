# Fox guide (silent mascot at the corner of the task notebook, PRD FR-037) — Implementation Plan

## Overview

The only slice of autonomous run `2026-10-23-fox-guide` (non-roadmap fix). Source: the maintainer's art delivery of
2026-10-23 (`designs/martynka-fox-guide-v1`, local and gitignored) and the pre-agreed decisions in
`context/runs/2026-10-23-fox-guide/scope.md` (items 1–8, copied as D-1 in `change.md`); `research.md` resolved the open
points (R-1..R-7). This plan implements them and does not re-decide them:

- a small fox stands in the right margin, astride the top-right corner of the task notebook (feet at scene (1792, 400),
  image 320 px, silhouette about 188 × 220), clear of every task element in every answer mode and phase;
- three poses: idle at a task start, cheer after a correct answer, think after a miss (until the next correct answer or
  task); cheer on the round's end screen (`SummaryPanel`, `MinigameDoneCard`); hidden on the unlock card;
- a 240 ms soft pop on a pose change, a plain texture swap under `prefersReducedMotion()`;
- decorative only (no input, no text, no sound, no narration); a missing pose texture shows no fox;
- three 384 × 384 WebP files through `npm run art` into `public/assets/ui/` and three `UI_ART` rows (`label: ''`).

**Save format stays v4** (`SAVE_VERSION` 4 in `src/core/save.ts`; `MIGRATIONS`, `validateSave`, `SAVE_KEYS` and every
frozen fixture untouched). The pose is derived from `RoundState.phase` at render time; nothing is stored. No balance
value, curriculum, generator or task-copy change (scope item 8); the only `src/data/balance.ts` edit is the comment on
`loader` (numbers of the boot payload), the values stay. **A phase that finds it must change what is saved, a balance
value, curriculum or content stops with `STATUS: BLOCKED`.**

## Current State Analysis

Grounded in `research.md` (its Code References are the source, not re-searched) and spot-checked on this branch at
`16b1e75`:

- **UI art wiring is one table.** `UI_ART` / `UiArtId` / `UI_ART_KEYS` (`src/data/uiArt.ts`, 5 rows) are iterated by
  `BootScene.preload` (`queuers.ui`), `BootScene.create` (`withCauses('Ui', UI_ART, …)` → `REGISTRY_KEYS.uiArtHealth`,
  the "Obrazki" UI line), the precache test, the deploy smoke `precacheCovers('screen pictures', …)` and
  `tests/e2e/health-lines.spec.ts` (`UI_ART.length` as the total). Three new rows are the whole loading wiring; no
  `BootScene` edit. `label: ''` (no stand-in) has precedent in the two loading pictures. `tests/uiArt.test.ts` pins
  `toHaveLength(5)`, WebP header sizes, no orphan file, keys = ids.
- **Pipeline.** `scripts/make-task-art.mjs` `UI_JOBS` read only from `SALON_V2`; the script exits unless `KIT` and
  `SALON_V2` exist; `convert` = `cwebp -quiet [-resize W H] -q 85 -alpha_q 100 -m 6`, no trim. The fox pack is a third
  root. All three `designs/` packs are present on this machine (checked).
- **Round phases.** `RoundPhase = 'first' | 'second' | 'solution' | 'retype' | 'done'` (`src/core/round.ts`). Every
  round kind (ordinary, warm-up, puzzle, word, dice) runs the same machine in `TaskScene`.
- **`TaskScene.render`** computes `summary` and `unlock` at the top, then branches: unlock card (returns), summary or
  minigame done card (returns), task layer. Every change of phase goes through `render()` (`submit`, `advance`, the
  solution-step button, `beginRound`, `closeUnlock`).
- **Motion.** `ANIMATION` in `src/data/layout.ts`; `prefersReducedMotion()` (`src/ui/motion.ts`) read at the moment of
  each tween; `tests/reducedMotionWiring.test.ts` lists every tweening file in `TWEENING_FILES` and checks the
  preference is read.
- **Input.** Only `setInteractive` zones take input; scene-level drag listeners hit-test through their reducers. A plain
  `Image` is never a hit candidate.
- **E2E hook.** `src/testing/e2eHook.ts` spreads `TaskScene.snapshot()` into the hook snapshot, so a new
  `TaskSnapshot.guide` field reaches the specs with no hook edit.
- **Boot budget (orchestrator note, verified here).** The `balance.loader` comment's "about 46.6 s at 50 KB/s" is
  `payload ÷ 50 000 B/s`: the bytes of every file the boot queue loads (all `TASK_ART`, `ROOM_ART` and `UI_ART` WebP,
  the font `FONT_URL`, the 12 boot sound effects as M4A — Phaser picks M4A first and it is the larger format) on an
  assumed 50 KB/s ≈ 400 kbit/s cold first start, as if the files shared that bandwidth serially. Measured on disk now:
  tasks 473 968 + rooms 1 489 688 + ui 119 288 + font 114 640 + boot M4A 132 243 = **2 329 827 B → 46.6 s** (the comment
  says 2 329 739 B, an 88 B drift since S-16d). The three fox files at 384² add 42 384 B (measured by research with the
  script's flags) → **2 372 211 B → 47.4 s**, 2.6 s (5 %) under `totalMs` 50 000. Past the limit nothing breaks: the game
  starts with what loaded, the cut UI pictures (fox included) are absent, "Obrazki" counts them, and the next start reads
  the service worker cache. Nothing pins this estimate today (`tests/loaderBalance.test.ts` only bounds the values).
- `docs/design-gaps.md` ends at row 164; next free row **165**. `context/foundation/lessons.md` does not exist (checked;
  nothing to apply).
- **Baseline** (contract): `main` `1962312`, unit 3781, e2e 150. Every phase measures its own branch baseline before its
  first edit and writes `baseline + delta`.

## Desired End State

- On the task screen of every round kind the fox stands in the right margin with its feet at (1792, 400), the silhouette
  overlapping the notebook frame's top-right corner; nothing of it covers the prompt, tiles, keypad, select tiles, drag
  tray/mat/wallet/clock, written column, drawings, hint number line, hint/solution bar, "Dalej", beads, ribbon or HUD.
- Idle at each task start; cheer after a correct answer (first, second or retyped); think from a miss through the
  second try, solution steps and retype; cheer on `SummaryPanel` and `MinigameDoneCard`; no fox on the unlock card.
- A pose change pops the fox to 1.06 and back in 240 ms; under reduced motion the texture swaps with no tween.
- With a pose texture missing (`?e2eArt=ui`, a cut boot load) that pose shows no fox; the "Obrazki" UI line counts 8.
- Tapping on the fox changes nothing in the round.
- `tests/bootBudget.test.ts` pins the boot payload against `balance.loader.totalMs` with a 2 s floor; the `loader`
  comment carries the measured numbers.
- DESIGN-GAP rows 165–168 written; CLAUDE.md "Current state" describes the fox; follow-ups with triggers recorded.

### Key Discoveries:

- The pack's union silhouette (solid bounds of the three poses, `qa-report.json`) is x 264–866, y 196–900 of 1024 with
  the anchor (512, 900); geometry must use this union, never the 320 px image box (the box's transparent top reaches the
  star counter's lower edge; research (a)).
- `setDisplaySize` sets `scaleX/scaleY`, so a pop targets `base × 1.06`, not `1.06` (research (d)).
- `render()` returns early in two branches, so the one guide update must sit after `summary`/`unlock` are computed and
  before the first `return`.
- `?e2eArt=ui` already swaps every non-loading `UI_ART` url for `UI_MISSING_URL` — a ready proof of "missing → no fox".

## What We're NOT Doing

- No save, storage, balance value, curriculum, generator or task-copy change; no player-facing text (no `pl.ts` edit);
  no sound cue and no narration for the fox.
- No idle breathing (scope: optional; motion beside the task distracts — DESIGN-GAP 166); no cross-fade.
- No fox on the unlock card, the welcome screen or the room; no fox outside `TaskScene`.
- No layout change of any existing element to make room; no change of `BootScene`, the `ui` queuer, `artHealth` or the
  deploy smoke (the table does the wiring), so the BootScene follow-ups (F3, G-2.., `UI_MISSING_URL`) stay open.
- No `balance.loader.totalMs` change (decision P-3); no new balance field.
- No `recordFallback` for the fox (no drawn fallback exists; `FallbackWhere` unchanged).
- The `modeWidgets` follow-up (child-flow-guards) stays open: the fox reads the phase, never the mode.
- Out of scope per scope.md: the observability audit findings of PR #101; street and houses (FR-032–FR-036).
- No roadmap status edit (non-roadmap change).

## Implementation Approach

Art and table first (the textures every later phase draws), then the pure pose rule and the geometry proof test-first,
then one widget wired by one call in `TaskScene.render`, then docs and the seam sweep with the full visual pass, then
one e2e phase. Each UI phase introduces at most one new component (`GuideFox`). Every number lives in
`src/data/layout.ts` (`GUIDE`, `ANIMATION.guide*`); pure rules in `src/core/guide.ts` and `src/core/guideLayout.ts`.

DESIGN-GAP numbers fixed here: **165** placement and size, **166** pose-change motion (no breathing), **167** screens,
**168** missing art → no fox. Phase 3 writes them (it draws the fox); phase 4 verifies.

## Critical Implementation Details

- **State sequencing in `render()`.** Compute the screen (`'unlock'` when `unlock`, else `'summary'` when `summary`, else
  `'task'`) and call the guide once, before the unlock branch's `return`. A call placed at the end of `render()` never
  runs on the summary or unlock screens.
- **Pop only on a visible change.** `render()` runs for non-pose changes too; the widget animates only when the shown
  pose differs from the new one and the fox stays visible. The first show after `create` and a show after the fox was
  hidden swap without a pop. Before any change: `killTweensOf` the image and reset the scale to base.
- **Boot budget.** The new budget test reads file sizes from `public/` through the same tables the boot queue iterates
  (`TASK_ART`, `ROOM_ART`, `UI_ART`, `FONT_URL`, `SOUNDS` with `boot: true`), so a later art addition trips it without
  anyone editing the test.

## Phase 1: Fox art, table rows and the boot budget

Driver: impl
Driver why: art conversion, data rows and a data-guard test — pipeline and config, no logic a failing test could lead.

### Overview

Three 384² WebP poses land in `public/assets/ui/` through `npm run art`; `UI_ART` gains three rows; a new budget test
pins the boot payload the fox grows.

### Changes Required:

#### 1. Art pipeline

**File**: `scripts/make-task-art.mjs`

**Intent**: add the fox pack as a third kit root so `npm run art` converts the three poses with the script's own cwebp
flags, keeping the whole 1024 canvas (resize only, never trim), so the anchor stays (0.5, 0.87890625).

**Contract**: a `FOX` root `designs/martynka-fox-guide-v1` with its existence check next to `KIT`/`SALON_V2`; jobs
`assets/fox-idle.png` → `public/assets/ui/fox-idle.webp`, `fox-cheer` → `fox-cheer.webp`, `fox-think` → `fox-think.webp`,
each `size: [384, 384]`; the header comment and the count line name them. After `npm run art`, `git status --short
public/` lists only the three new files; if cwebp rewrote other files byte-differently, restore them with
`git checkout -- <path>` and record it in the phase commit.

#### 2. UI art table

**File**: `src/data/uiArt.ts`

**Intent**: three rows so BootScene loads, the health line counts and the precache and deploy smoke cover the poses.

**Contract**: `UiArtId` gains `'guideIdle' | 'guideCheer' | 'guideThink'`; `UI_ART` rows `def('guideIdle', 'fox-idle',
384, 384, '')`, `def('guideCheer', 'fox-cheer', 384, 384, '')`, `def('guideThink', 'fox-think', 384, 384, '')`;
`UI_ART_KEYS` gains `ui/fox-idle`, `ui/fox-cheer`, `ui/fox-think`; the header comment names the guide.

**File**: `tests/uiArt.test.ts` — `toHaveLength(5)` → `toHaveLength(8)`; nothing else.

#### 3. Boot budget

**File**: `tests/bootBudget.test.ts` (new)

**Intent**: turn the `balance.loader` comment's estimate into a checked invariant so the next art addition forces a
decision instead of silently eating the margin.

**Contract**: a test-local `COLD_START_BYTES_PER_S = 50_000` (the comment's 50 KB/s, decimal) and `HEADROOM_MS = 2000`;
the payload = sum of `statSync(join('public', url)).size` over every `TASK_ART`, `ROOM_ART`, `UI_ART` url, `FONT_URL`, and
for each `SOUNDS` entry with `boot: true` the larger of its two urls; asserts
`payload / COLD_START_BYTES_PER_S * 1000 <= balance.loader.totalMs - HEADROOM_MS`, with the computed seconds in the
assertion message. Expected after this phase: ≈ 47.4 s ≤ 48 s.

**File**: `src/data/balance.ts` — the `loader` comment only: replace the S-16d payload sentence with the measured total
after the fox (≈ 2 372 211 B, ≈ 47.4 s at 50 KB/s), name `tests/bootBudget.test.ts` as the check; values unchanged.

### Success Criteria:

#### Automated Verification:

- `file public/assets/ui/fox-*.webp` lists three WebP images; `tests/uiArt.test.ts` green with 8 rows (header sizes 384 × 384, no orphan, keys = ids)
- `tests/bootBudget.test.ts` green; deliberate break: set `HEADROOM_MS` to 3000 → red with the computed seconds (≈ 47.4) in the message; restored; meta-check: the payload comes from file sizes on disk through the boot tables, not from a number copied from the comment, so the break proves the sum is real and near the limit
- `git diff main -- src/data/balance.ts` touches only the comment of `loader` (no value changed); `git diff --stat main -- src/core/save.ts tests/fixtures` empty
- Full local gate green (lint, typecheck, unit `<branch baseline> + N` + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

---

## Phase 2: Pose rule and geometry

Driver: tdd
Driver why: `guidePose` and `guideRect` are absent pure functions with exact oracles (the phase table, the layout rects from the real layout functions) — failing tests lead.

### Overview

Tokens, the pure pose rule and the silhouette rect, proven by a pose table and a no-overlap test over every answer mode,
drawing shape and phase.

### Changes Required:

#### 1. Tokens

**File**: `src/data/layout.ts`

**Intent**: every number of the fox as data.

**Contract**: `GUIDE = { anchor: { x: 1792, y: 400 }, displaySize: 320, sourceSize: 1024, origin: { x: 0.5, y:
0.87890625 }, silhouette: { left: 264, top: 196, right: 866, bottom: 900 } }` (silhouette = union of the three poses'
solid bounds from the pack's `qa-report.json`, in source px; comment cites research (a) and DESIGN-GAP 165);
`ANIMATION.guidePoseMs: 240`, `ANIMATION.guidePopScale: 1.06`, `ANIMATION.guideEase: 'Sine.easeOut'`.

#### 2. Pose rule

**File**: `src/core/guide.ts` (new)

**Intent**: the pose as a pure function of the screen and the round phase; no state.

**Contract**: `type GuidePose = 'idle' | 'cheer' | 'think'`; `type GuideScreen = 'task' | 'summary' | 'unlock'`;
`guidePose(screen: GuideScreen, phase: RoundPhase): GuidePose | null` — unlock → `null`; summary → `'cheer'`; task:
`first` → `'idle'`, `second` | `solution` | `retype` → `'think'`, `done` → `'cheer'`, with a `never` guard over
`RoundPhase`; `GUIDE_ART: Record<GuidePose, UiArtId>` (`guideIdle`, `guideCheer`, `guideThink`; type import from
`src/data/uiArt.ts`).

#### 3. Silhouette rect

**File**: `src/core/guideLayout.ts` (new)

**Intent**: the scene rect the fox's visible body may occupy, for the geometry test, the widget and the e2e hook.

**Contract**: `guideRect(guide = GUIDE): Rect` — scale `s = displaySize / sourceSize`; x from `anchor.x + (silhouette.left
− origin.x·sourceSize)·s` to `anchor.x + (silhouette.right − origin.x·sourceSize)·s`; y from `anchor.y +
(silhouette.top − origin.y·sourceSize)·s` to `anchor.y + (silhouette.bottom − origin.y·sourceSize)·s` (≈ x 1714.5–1902.6,
y 180–400).

#### 4. Tests

**Files**: `tests/guide.test.ts`, `tests/guideLayout.test.ts` (new); stubs exported first so the failures are assertions.

**Contract**: `guide.test.ts` — every `RoundPhase` × screen against a literal table; `GUIDE_ART` ids exist in
`UI_ART_KEYS`. `guideLayout.test.ts` — with a 12 px gap, `guideRect()` is disjoint from: `pictureLayout(spec, input,
solution, shape)` (real argument order: `solution` before `shape`) for every `ANSWER_MODES` × {wide, long} × {false, true}
plus `tall` only for `TALL_MODES` (`src/core/tasks/visual.ts`; `tallOf` throws for drag/select/digits — plan review F1)
(a `never`-guarded switch over `ANSWER_MODES` so a new mode fails until listed), `hintPictureLayout`, `answerSpans`, `clockSetLayout(TASK_LAYOUT.drag,
…)`, `dragLayout`/`coinLayout` at their max kinds, the keypad's computed bottom, `TASK_LAYOUT.prompt`/`expressionWide`
extents, `TASK_LAYOUT.barSpan` and `tall.*.bar`, `notebookGeometry().ribbon` bbox, `TASK_LAYOUT.dots` with the warm-up's 6
beads, `HUD_LAYOUT` rects (star counter grown by `counterPopScale`), a 6-line bound of the settings hint bubble,
`letterRow` at the longest `MINIGAME_WORDS` word, `MINIGAME_LAYOUT` board and card, `SUMMARY_LAYOUT` and
`UNLOCK_LAYOUT.card`; `guideRect()` lies inside 1920 × 1080 with ≥ 12 px to the right edge; the popped rect (the silhouette scaled by
`ANIMATION.guidePopScale` about the anchor, ≈ x 1709.9–1909.3, y 166.8–400) keeps ≥ 8 px from the right edge, the tall
solution lines (x ≤ 1700) and the star counter grown by `counterPopScale` (bottom ≈ 157.4) — plan review F3; "in the corner": the
notebook's right outer edge (x 1740) lies inside the rect's x span and the rect's top is within 40 px of the notebook top
(204); the silhouette height is within 180–240 (scope item 2, read as the silhouette — P-1).

### Success Criteria:

#### Automated Verification:

- New tests red before the change (stubs return `'idle'` / an empty rect), green after; unit `<branch baseline> + N`
- Deliberate break: `GUIDE.anchor.x` 1700 → the tall-lines and drag-tray cases red; `guidePose` maps `retype` to `'idle'` → the retype row red; each restored; meta-check: the overlap oracles come from the real layout functions and `TASK_LAYOUT`/`HUD_LAYOUT` constants, not from `guideRect`'s own tokens, and the pose oracle is a literal table
- `grep -n "never" src/core/guide.ts tests/guideLayout.test.ts` shows both exhaustive guards
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

---

## Phase 3: The fox in the task scene

Driver: impl
Driver why: one widget and scene glue over the phase-2 rules — the risk is in the rendered canvas, proven by source-wiring tests, the visual gate and the phase-5 e2e.

### Overview

`GuideFox` draws the pose, `TaskScene.render` drives it once, the hook reports it, the design gaps are written.

### Changes Required:

#### 1. Widget

**File**: `src/ui/widgets/GuideFox.ts` (new)

**Intent**: one `Image` at `GUIDE.anchor` with `GUIDE.origin` and display size `GUIDE.displaySize`, created hidden;
**after every `setTexture` call `setDisplaySize(GUIDE.displaySize, GUIDE.displaySize)` again and take the pop's base
scale from it** (plan review F2: `setDisplaySize` stores a scale relative to the current frame, so an image created on a
missing key's 32 px `__MISSING` frame would draw a later 384 px pose ten times too large; never `setDisplaySize` while the
texture is missing);
`show(pose: GuidePose | null)` hides it for `null` or a missing texture (`scene.textures.exists`), otherwise sets the
texture and pops (`base × ANIMATION.guidePopScale`, yoyo, `guidePoseMs` in total, `guideEase`) only when the shown pose
changed while visible and `prefersReducedMotion()` is false; `killTweensOf` + base scale before any change. Never calls
`setInteractive`. `DESIGN-GAP 165–168` comment.

**Contract**: `class GuideFox { constructor(scene: Scene); show(pose: GuidePose | null): void; snapshot(): { pose:
GuidePose | null; visible: boolean; rect: Rect; interactive: boolean; pops: number } }` — `rect` from `guideRect()`,
`interactive` = `image.input != null`, `pops` = pop tweens started since `create` (a counter, so a test never races the
240 ms tween).

#### 2. Scene

**File**: `src/scenes/TaskScene.ts`

**Intent**: create the fox right after `drawNotebook` in `create` (depth 0: above the paper, below everything created
later); in `render()`, after `summary` and `unlock` are computed and before the first `return`, one call
`this.guide.show(guidePose(screen, this.state.phase))`; `TaskSnapshot.guide` = `this.guide.snapshot()`.

**Contract**: `TaskSnapshot.guide: { pose; visible; rect; interactive; pops }` (read-only; the hook spreads it, so
`src/testing/e2eHook.ts` needs no edit — if it is edited after all, the narrator-round-summary follow-up "report `null`
targets while the room is open" fires and is taken in the same phase). **File**: `tests/e2e/support/hook.ts` — the
e2e `Snapshot` interface gains `guide?: { pose: 'idle' | 'cheer' | 'think' | null; visible: boolean; rect: { x: number;
y: number; width: number; height: number }; interactive: boolean; pops: number }` (it is a hand-written interface, not
derived from `TaskSnapshot`; plan review F4).

#### 3. Wiring tests

**Files**: `tests/reducedMotionWiring.test.ts` (`TWEENING_FILES` += `src/ui/widgets/GuideFox.ts`), `tests/guideWiring.test.ts`
(new)

**Contract**: source tests — `GuideFox.ts` has no `setInteractive` and reads `prefersReducedMotion()` before its
`tweens.add`; `TaskScene.render` calls `guidePose(` exactly once and before the first `return` of the method body.

#### 4. Design gaps

**File**: `docs/design-gaps.md` — rows 165–168 as in `research.md` § DESIGN-GAP rows, each citing scope.md as the
maintainer's decision (165 placement and size with the silhouette reading; 166 pop 1.06 / 240 ms, none under reduced
motion, no breathing; 167 task layer of every round kind, cheer on `SummaryPanel` and `MinigameDoneCard`, hidden on the
unlock card; 168 missing pose → no fox, counted in "Obrazki").

### Success Criteria:

#### Automated Verification:

- `tests/guideWiring.test.ts` and the grown `reducedMotionWiring` green; unit `<phase-2 count> + N`
- Deliberate break: move the `guide.show` call to the end of `render()` → the "before the first return" case red; add `setInteractive()` in `GuideFox` → the no-input case red; each restored; meta-check: these are source guards of the wiring; behaviour on screen is proven by 3.5 and phase 5
- `grep -c "^| 16[5-8] |" docs/design-gaps.md` prints 4
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`health-lines.spec.ts` follows `UI_ART.length`)

#### Manual Verification:

- [visual] Hook build on 4399, desktop 1440 and tablet 1024: a tiles task at its start (idle), after a right tap (cheer), after a wrong tap (think) — the fox stands at the notebook's top-right corner, feet at the frame line, nothing of the task covered, the pop soft

---

## Phase 4: Docs, follow-ups, seam sweep and the full visual pass

Driver: impl
Driver why: rule-file text, follow-ups and leftovers over phases 1–3 plus the screenshot matrix — docs and glue.

### Overview

The rule files describe the fox; deferred items get triggers; duplicates and stale comments go; every screen is shot.

### Changes Required:

#### 1. Rule files

**File**: `CLAUDE.md` "Current state" (and `AGENTS.md` if it repeats the facts — grep first)

**Intent**: one sentence group: fox guide (PRD FR-037, change fox-guide): `GuideFox` widget in `TaskScene`, pose from
`guidePose` (`src/core/guide.ts`) over `RoundPhase` and the screen, silhouette rect `guideRect`
(`src/core/guideLayout.ts`) proven clear of every mode by `tests/guideLayout.test.ts`, tokens `GUIDE` and
`ANIMATION.guide*`, three `UI_ART` rows from the third root of `npm run art`, `tests/bootBudget.test.ts` as the boot
payload check, `TaskSnapshot.guide` in the hook, gaps 165–168; save format stays v4. Fix sentences made untrue (the UI art
list in the S-16c sentence, "the UI pictures" counts, and the `npm run art` line of Commands: it now also needs the local
`designs/martynka-fox-guide-v1` pack — plan review F7).

#### 2. Seam sweep

**Files**: anything phases 1–3 left

**Intent**: duplicated helpers (a second silhouette or scale computation outside `guideLayout.ts`, a pose switch outside
`guide.ts`), stale comments (`uiArt.ts` header, `make-task-art.mjs` header, the `balance.loader` comment, the
`UI_ART`-count comments in tests), unused tokens; `docs/design-gaps.md` rows 165–168 read correctly; kit rows nothing
else changed.

#### 3. Follow-ups

**File**: `context/changes/fox-guide/follow-ups/review-fixes.md` (new)

**Intent**: one entry per deferred item with a `Trigger:` line: idle breathing (Trigger: maintainer asks for a livelier
fox); fox on the unlock card (Trigger: maintainer request); 512² art (Trigger: a game config `resolution`/zoom > 1 or a
larger `GUIDE.displaySize`); boot budget headroom (Trigger: `tests/bootBudget.test.ts` red — decide raising `totalMs`
within the 60 s bound of `loaderBalance.test.ts` or slimming art); fox placement fallback anchor x 1802 (Trigger: the
maintainer rejects the 10 px over the paper face); `modeWidgets` follow-up left open (the fox reads the phase only); the "Obrazki" UI sentence "napis lub rysunek" untrue
for a missing fox (Trigger: the maintainer reading "Obrazki" with a missing fox, or the next change to
`pl.settings.uiArtMissing`).

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -n "GuideFox\|guidePose\|bootBudget" CLAUDE.md` present
- `grep -c "Trigger:" context/changes/fox-guide/follow-ups/review-fixes.md` ≥ 6
- `grep -rn silhouette src` lists only `src/data/layout.ts` and `src/core/guideLayout.ts`
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual Verification:

- [visual] Hook build on 4399, desktop 1440 and tablet 1024, every state: tiles (idle, cheer, think), keypad second try (think), solution phase with step lines (think), retype, select, drag blocks, coin wallet, clock to set, digits column, tall picture with tiles, hint number line, word round with letters, dice board, daily puzzle, warm-up (6 beads), `SummaryPanel` (cheer), `MinigameDoneCard` (cheer), unlock card (no fox), `?e2eArt=ui` (no fox), the settings hint bubble open; plus a 420 × 760 same-origin iframe showing the "Obróć tablet" overlay over the fox — nothing of any task element, bead or HUD pill covered in any frame
- [human] Accept the fox's place and size: right margin astride the notebook's top-right corner (feet at 1792, 400; image 320 px, silhouette ≈ 188 × 220, "180–240 px" read as the silhouette height; about 10 px of the body over the paper face) — PRD FR-037 says "w rogu zeszytu"; this reading puts the fox mostly in the margin beside the corner (decisions P-1, P-2; fallback anchor x 1802 in the follow-ups)
- [human] On a real tablet: the fox is sharp at 384² art, the pop reads soft, and the cheer on a 0-star summary does not feel odd
- [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(`

---

## Phase 5: The fox follows the round and never takes a tap — e2e (#11)

Driver: e2e
Driver why: risk #11 (a round played to the end by touch; the fox must never steal a tap) and the pose wiring exist only in the rendered canvas; the feature is built by phase 3, contract `E2E=on`.

### Overview

One new spec `tests/e2e/fox-guide.spec.ts` (hook build, port 4397) pins the pose wiring, the no-input rule, the missing
art and reduced motion.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/fox-guide.spec.ts` (titles `#11 …`)

**Contract**: model on `notebook-polish.spec.ts` and `support/{hook,welcome}.ts`; targets from the hook, strings from
`pl`, never fixed coordinates; the expected rect from `guideRect()` imported from `src/core/guideLayout.ts`:
- `#11 fox follows the round` — idle at a task start; cheer after `answerRight`; idle after `tapNext`; think after
  `answerWrong`; still think through the solution phase and retype; cheer on the summary.
- `#11 a tap on the fox changes nothing` — `guide.interactive === false`, `guide.rect` equals `guideRect()`; `tapScene` at
  the rect's centre → `phase`, `index` and `counterText` unchanged.
- `#11 no fox without its art` — `?e2eArt=ui`: `guide.visible === false` on the task and on the summary; the round plays
  to the summary.
- `#11 no fox on the unlock card` — the road of `health-lines.spec.ts` `#14 U-1` (E4 in September, rounds right until a
  step unlocks): on screen `unlock` `guide.visible === false`; after `unlockNext` the fox is back (idle).
- `#11 reduced motion swaps the pose without a pop` — `page.emulateMedia({ reducedMotion: 'reduce' })` before `goto`:
  after `answerRight`, `guide.pose === 'cheer'` and `guide.pops === 0`; a control page without the emulation shows
  `guide.pops >= 1` after the same answer (proves the counter counts).

No `sleep`/`until`/`while` loops or `tail -f` waiters (profile § 8); waits through `expect.poll` on the hook.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each run alone with `-g`: `guidePose` returns `'idle'` for every task phase → "follows the round" red; `setInteractive()` on the fox image with a `pointerdown` that calls `advance` → "a tap on the fox" red; skip the `textures.exists` check → "no fox without its art" red; drop the `prefersReducedMotion()` check → "reduced motion" red; each restored), green after
- `npx playwright test tests/e2e/fox-guide.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 5`; total equals `npx playwright test --list | tail -1`
- Full local gate green

---

## Testing Strategy

### Unit Tests:

- Pose table over every `RoundPhase` × screen with an exhaustive guard (phase 2).
- No-overlap geometry over every answer mode × drawing shape × solution phase, every HUD/summary/minigame/unlock rect,
  inside the scene and touching the corner (phase 2).
- Boot payload against `totalMs` with a 2 s floor, from file sizes on disk (phase 1).
- Source wiring: one `guidePose` call before the first `return` of `render`, no `setInteractive`, reduced-motion check
  before the tween (phase 3).

### Integration Tests:

- `tests/e2e/fox-guide.spec.ts` (five tests, risk #11) on the hook build.

### Manual Testing Steps:

1. Play a tiles round: idle → right tap (cheer, soft pop) → "Dalej" (idle) → wrong tap (think) → second wrong (think
   through the steps) → retype (cheer).
2. Finish the round: cheer beside the summary; a word or dice round ends on the done card with the fox cheering.
3. Switch on reduced motion in the OS: the pose swaps with no pop.
4. Start with `?e2eArt=ui` (hook build): no fox, "Obrazki" counts the three missing.

## Performance Considerations

Three 384² textures (≈ 42 KB as WebP, ≈ 1.7 MB of GPU memory as RGBA) and one Image; one 240 ms tween per pose change.
The boot payload grows by 1.8 % (46.6 → 47.4 s at the pessimistic 50 KB/s), pinned by `tests/bootBudget.test.ts`.

## Migration Notes

None: save format stays v4, nothing stored.

## Known risks

- The visual gate may find the 10 px over the paper face reads as clipping → fallback anchor x 1802 (silhouette
  1724–1913, still ≥ 7 px from the edge; the geometry test's right-edge gap would then be lowered to 7 px in the same
  fix).
- The budget test leaves 0.6 s spare under its floor; the next ~28 KB of boot art trips it by design (follow-up).
- (plan review F5) The fox's real WebP bytes are known only after phase 1's conversion (research measured 42 384 B). If
  `tests/bootBudget.test.ts` is red with them, phase 1 converts at 352² (then 320²), re-measures, updates `GUIDE`-free
  numbers (`UI_ART` sizes, the `loader` comment) and records it in the commit; it never raises `totalMs` or lowers
  `HEADROOM_MS`. Still red at 320² → `STATUS: BLOCKED`.
- (plan review F6) `pl.settings.uiArtMissing` ends "Na tych ekranach zamiast obrazka jest napis lub rysunek." — for a
  missing fox nothing is drawn, so with only fox poses missing the parent's line is slightly inaccurate. No text change
  (scope item 8); DESIGN-GAP 168 names it, and a follow-up (Trigger: maintainer reading "Obrazki" with a missing fox)
  goes to phase 4's follow-ups.
- Reaching the unlock card in e2e is the slowest road in the suite (E4 rounds until a step unlocks), a known load flake
  family (profile § 8): the spec reuses the `health-lines.spec.ts` road.

## Autonomous decisions

- **P-1 "180–240 px" = the silhouette height** (research R-1): image 320 px, silhouette ≈ 188 × 220. Rejected: canvas
  180–240 (silhouette 123–165, the paw at the chin of think hard to read). **Departs from a literal reading of scope.md
  item 2** (which does not say which) → `[human]` row 4.6. Would change: the maintainer saying the canvas → `GUIDE.displaySize`
  240, same anchor (the geometry test's height bound then moves).
- **P-2 Placement right margin astride the top-right corner** (research R-2, orchestrator note: kept; the code did not
  prove it wrong — research's rect table shows ≥ 14 px clearance from every element). Rejected: bottom-right (bar,
  "Dalej", hint bubble, gear), bottom-left ("Wróć", build id, wallet, tall column), top-left/top edge (prompt, "Do
  pokoju", 56 px gap). **Departs from FR-037's literal "w rogu zeszytu"** (the fox is mostly in the margin beside the
  corner, not on the page) → `[human]` row 4.6 "accept the fox's place and size". Would change: the visual gate or the
  maintainer rejecting the look (fallback x 1802), or a layout change putting content right of x 1700 above y 643.
- **P-3 Boot budget: keep `balance.loader.totalMs` at 50 000 and pin the estimate with a test.** Verified: the estimate
  is payload ÷ 50 000 B/s (all boot WebP + font + 12 boot M4A), measured 46.6 s now, 47.4 s with the fox, 2.6 s (5 %)
  margin; going over cuts the slowest files to stand-ins/absent fox for one cold start only. Rejected: raising to 55 s (a
  stalled cold start would wait 5 s longer before the game starts, for a margin nobody has measured a need for);
  shrinking the fox to 320² (≈ 8 KB saved, softer art); a new balance field for the bandwidth (scope item 8: no balance
  change). The test's 2 s floor makes the next addition a recorded decision. Would change: a measured cold start on the
  maintainer's tablet past 40 s, or the test red on the next art slice.
- **P-4 Art 384² WebP** (research R-6). Rejected: 512² (+20 KB on a near-limit budget, no visible gain on a 1920-wide
  backing store). Would change: a game config `resolution`/zoom > 1.
- **P-5 Screens** (research R-3): task layer of every round kind, cheer on `SummaryPanel` and `MinigameDoneCard`, hidden
  on the unlock card. Would change: the maintainer wanting the fox on the unlock card.
- **P-6 Pose = pure function of screen + `RoundPhase`** (research R-4), `retype` → think, a correct retype → cheer
  (`done`). Would change: a new `RoundPhase` (the `never` guard forces the decision).
- **P-7 Motion = texture swap + 1.06 pop in 240 ms, no cross-fade, no breathing** (research R-5). Would change: the
  visual gate finding it too lively or too abrupt.
- **P-8 Missing pose → no fox, no `recordFallback`** (research R-7). Would change: a request to show the fox's absence
  beyond the UI count in "Obrazki".
- **P-9 Five phases** (research proposed four): docs and the seam sweep split from the widget phase so the widget phase
  stays one new component and the last impl phase carries the sweep (step prompt). Rejected: research's phase 3 with
  docs folded in. Would change: per-phase overhead dominating in the orchestrator's measurements.
- **P-10 e2e cites risk #11 only** (round by touch, the fox must not steal a tap); the unlock-card test also touches #13's
  road but asserts only the fox. Would change: the test-plan adding a mascot risk.
- **P-11 No `[human]` decision needed for PRD's "nie mówi … nigdy nie okazuje zawodu"**: no text, sound or narration;
  the cheer on a 0-star summary is unconditional (no sad variant exists); kept as a tablet check in row 4.7.

## References

- Research: `context/changes/fox-guide/research.md`
- Scope: `context/runs/2026-10-23-fox-guide/scope.md`; change identity `context/changes/fox-guide/change.md`
- Format example: `context/archive/2026-10-22-notebook-polish/plan.md`
- Code: `src/data/uiArt.ts` (`UI_ART`, `UI_ART_KEYS`), `scripts/make-task-art.mjs` (`UI_JOBS`, `convert`),
  `src/scenes/TaskScene.ts` (`create`, `render`, `snapshot`), `src/core/round.ts` (`RoundPhase`),
  `src/core/round/pictureLayout.ts`, `src/core/round/dragLayout.ts`, `src/core/notebookGeometry.ts`,
  `src/data/layout.ts` (`TASK_LAYOUT`, `HUD_LAYOUT`, `ANIMATION`), `src/data/balance.ts` (`loader`),
  `tests/loaderBalance.test.ts`, `tests/reducedMotionWiring.test.ts`, `tests/uiArt.test.ts`,
  `tests/e2e/health-lines.spec.ts`, `tests/e2e/notebook-polish.spec.ts`
- Test plan: `context/foundation/test-plan.md` risk #11

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Fox art, table rows and the boot budget

#### Automated

- [x] 1.1 `file public/assets/ui/fox-*.webp` lists three WebP images; `tests/uiArt.test.ts` green with 8 rows (header sizes 384 × 384, no orphan, keys = ids) — e392442
- [x] 1.2 `tests/bootBudget.test.ts` green; deliberate break: set `HEADROOM_MS` to 3000 → red with the computed seconds (≈ 47.4) in the message; restored; meta-check: the payload comes from file sizes on disk through the boot tables, not from a number copied from the comment, so the break proves the sum is real and near the limit — e392442
- [x] 1.3 `git diff main -- src/data/balance.ts` touches only the comment of `loader` (no value changed); `git diff --stat main -- src/core/save.ts tests/fixtures` empty — e392442
- [x] 1.4 Full local gate green (lint, typecheck, unit `<branch baseline> + N` + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` — e2e 150/150 on 8cc3500 (orchestrator)

### Phase 2: Pose rule and geometry

#### Automated

- [x] 2.1 New tests red before the change (stubs return `'idle'` / an empty rect), green after; unit `<branch baseline> + N` — 2d99dcf
- [x] 2.2 Deliberate break: `GUIDE.anchor.x` 1700 → the tall-lines and drag-tray cases red; `guidePose` maps `retype` to `'idle'` → the retype row red; each restored; meta-check: the overlap oracles come from the real layout functions and `TASK_LAYOUT`/`HUD_LAYOUT` constants, not from `guideRect`'s own tokens, and the pose oracle is a literal table — 2d99dcf
- [x] 2.3 `grep -n "never" src/core/guide.ts tests/guideLayout.test.ts` shows both exhaustive guards — 2d99dcf
- [x] 2.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` — e2e 150/150 on 8cc3500 (orchestrator)

### Phase 3: The fox in the task scene

#### Automated

- [x] 3.1 `tests/guideWiring.test.ts` and the grown `reducedMotionWiring` green; unit `<phase-2 count> + N` — 953ed88
- [x] 3.2 Deliberate break: move the `guide.show` call to the end of `render()` → the "before the first return" case red; add `setInteractive()` in `GuideFox` → the no-input case red; each restored; meta-check: these are source guards of the wiring; behaviour on screen is proven by 3.5 and phase 5 — 953ed88
- [x] 3.3 `grep -c "^| 16[5-8] |" docs/design-gaps.md` prints 4 — 953ed88
- [x] 3.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`health-lines.spec.ts` follows `UI_ART.length`) — e2e 150/150 on 8cc3500 (orchestrator)

#### Manual

- [ ] 3.5 [visual] Hook build on 4399, desktop 1440 and tablet 1024: a tiles task at its start (idle), after a right tap (cheer), after a wrong tap (think) — the fox stands at the notebook's top-right corner, feet at the frame line, nothing of the task covered, the pop soft

### Phase 4: Docs, follow-ups, seam sweep and the full visual pass

#### Automated

- [ ] 4.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -n "GuideFox\|guidePose\|bootBudget" CLAUDE.md` present
- [ ] 4.2 `grep -c "Trigger:" context/changes/fox-guide/follow-ups/review-fixes.md` ≥ 6
- [ ] 4.3 `grep -rn silhouette src` lists only `src/data/layout.ts` and `src/core/guideLayout.ts`
- [ ] 4.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual

- [ ] 4.5 [visual] Hook build on 4399, desktop 1440 and tablet 1024, every state: tiles (idle, cheer, think), keypad second try (think), solution phase with step lines (think), retype, select, drag blocks, coin wallet, clock to set, digits column, tall picture with tiles, hint number line, word round with letters, dice board, daily puzzle, warm-up (6 beads), `SummaryPanel` (cheer), `MinigameDoneCard` (cheer), unlock card (no fox), `?e2eArt=ui` (no fox), the settings hint bubble open; plus a 420 × 760 same-origin iframe showing the "Obróć tablet" overlay over the fox — nothing of any task element, bead or HUD pill covered in any frame
- [ ] 4.6 [human] Accept the fox's place and size: right margin astride the notebook's top-right corner (feet at 1792, 400; image 320 px, silhouette ≈ 188 × 220, "180–240 px" read as the silhouette height; about 10 px of the body over the paper face) — PRD FR-037 says "w rogu zeszytu"; this reading puts the fox mostly in the margin beside the corner (decisions P-1, P-2; fallback anchor x 1802 in the follow-ups)
- [ ] 4.7 [human] On a real tablet: the fox is sharp at 384² art, the pop reads soft, and the cheer on a 0-star summary does not feel odd
- [ ] 4.8 [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(`

### Phase 5: The fox follows the round and never takes a tap — e2e (#11)

#### Automated

- [ ] 5.1 Spec red before (deliberate breaks, each run alone with `-g`: `guidePose` returns `'idle'` for every task phase → "follows the round" red; `setInteractive()` on the fox image with a `pointerdown` that calls `advance` → "a tap on the fox" red; skip the `textures.exists` check → "no fox without its art" red; drop the `prefersReducedMotion()` check → "reduced motion" red; each restored), green after
- [ ] 5.2 `npx playwright test tests/e2e/fox-guide.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 5`; total equals `npx playwright test --list | tail -1`
- [ ] 5.3 Full local gate green
