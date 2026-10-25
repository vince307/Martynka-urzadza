# Board recolour refuses a wrong image, the Canvas renderer named in "Obrazki", the pouf under the return button — Implementation Plan

## Overview

The only slice of autonomous run `2026-10-25-audit-art-renderer` (non-roadmap fix change, no roadmap edit). Source: the
maintainer's "jedziemy" (2026-10-25) on the fix PR offered for the closing observability audit of run
2026-10-24-salon-style (audit report on branch docs/observability-audit-2026-10-24-salon-style, PR #107: M-1, L-1) plus the
visual-gate observation that the pouf contact shadow sits behind "Wróć do notesu". The pre-agreed decisions are
`context/runs/2026-10-25-audit-art-renderer/scope.md` items 1-6 (S1-S6 in `change.md`); `research.md` answered every
unknown (R1-R8). This plan implements them and does not re-decide them:

- **M-1**: `scripts/recolour-board.py` refuses (exit 1, file name on stderr, no output file) when the result has
  non-finite values or the board mask covers less than 5 % or more than 30 % of the image, and prints the mask share on
  stdout; the real art stays byte-identical; `tests/recolourBoard.test.ts` proves both refusals and one acceptance on
  synthetic images and skips with a stated reason where `python3` with the pins is absent (CI).
- **L-1**: `applyWornGrade` records `worn: 'ungraded'` through `recordFallback` on its `false` path (one place for the room,
  the stage ghosts, the done-card miniature and the backdrop); `BootScene.create` logs the renderer once with
  `console.info`; "Obrazki" reads one true sentence `pl.settings.wornPlain` in its own line kind `worn`.
- **Pouf**: the button covers the bottom 46 px of the painted pouf by the pack's layout, so no shadow tweak can help:
  DESIGN-GAP row 174 and a comment at `ROOM_LAYOUT.resume`, no geometry change, a `[human]` choice.

**Save format stays v4** (`SAVE_VERSION` 4 in `src/core/save.ts`; `MIGRATIONS`, `validateSave`, `SAVE_KEYS` and every
frozen fixture untouched). The fallback record is runtime only. No game logic, balance, cost, slot, variant, curriculum,
generator or child-facing content change; no asset byte changes (scope item 5). Nothing else is folded in (scope item 6:
FU-SS F2 pixel guard, N-7, N-8 stay open). **A phase that finds it must change what is saved, a balance value, slot
geometry, a button position, curriculum, child-facing content or a byte of `public/` stops with `STATUS: BLOCKED`.**

## Current State Analysis

Grounded in `research.md` (its Code References are the source, not re-searched) and spot-checked on this branch at
`dbff636`:

- **Recolour.** `scripts/recolour-board.py`: `check_versions` (pins `PINNED_PILLOW` 12.1.0, `PINNED_NUMPY` 2.4.3),
  `board_mask` (edge flood fill over hue 95-165, s > 0.30; no bound on its size), `recolour` (`mean_lum =
  a[filled].mean()` is NaN on an empty mask; `np.clip(out, 0, 255).astype(np.uint8)` with no finiteness check; returns
  the image), `main` (argv and colour checks, saves unconditionally, prints nothing). `scripts/make-task-art.mjs` calls it
  with `stdio: ['ignore', 'inherit', 'inherit']` inside `try` and exits 1 on a throw — a non-zero exit already stops
  `npm run art`, and stdout already lands in its log. Measured shares (pinned libs): before 13.47 %, after 13.45 %.
- **No test spawns a process today**; `vitest.config.mts` `testTimeout: 30_000`; CI (`.github/workflows/ci.yml`,
  `ubuntu-latest`, Node 22) has no Python setup step. Last observed CI `check` log (run 40146540454, job 121028985242):
  `Test Files  207 passed (207)`, `Tests  3936 passed (3936)`, `e2e hook: absent (2 chunks checked)`.
- **Grade.** `src/ui/wornGrade.ts` `applyWornGrade(_scene, image, soft)` returns false when
  `enableFilters().filters?.internal.addColorMatrix()` is absent (always under Canvas: Phaser 4.2.1 `enableFilters` returns
  early without `renderer.gl`). Callers: `src/ui/widgets/RoomView.ts` `buildWorn` (room, `RoomScene.fadeStage` ghosts) and
  `drawRoomMiniature` (result dropped; `RoomDoneCard`, `SalonBackdrop.render`). Nothing records the renderer; the hook's
  `backdrop.renderer` / `room.worn.graded` are hook-only; `artFallbacks` stays `{}` under Canvas (research run).
- **Fallback channel.** `src/core/artPick.ts`: `FallbackWhere = 'wallet' | 'notebook' | 'miniature' | 'loading' |
  'guide'`, `DrawnFallbackWhere = Exclude<FallbackWhere, 'guide'>`, `FALLBACK_ORDER`, `noteFallback` (first mode per key
  wins — one record per game). `src/ui/artFallbacks.ts` `recordFallback(scene, where, mode)`. `src/core/artHealth.ts`
  `ArtHealthLine` has `{ kind: 'guide' }` and `{ kind: 'fallback'; where: DrawnFallbackWhere[] }`; `artHealthLines` pushes
  `guide` after `font`, then the drawn list filtered by `where !== 'guide'`. `src/ui/dom/artHealthView.ts` `textOf` is an
  exhaustive switch. `src/data/pl.ts` `pl.settings.guideMissing`, `artFallback`, `artFallbackNames` (four drawn screens).
- **Existing source-guard file for this area**: `tests/salonStyleWiring.test.ts` (salon-style); precedent for a
  separate guard file: `tests/guideWiring.test.ts`.
- **Boot.** `src/scenes/BootScene.ts` `create` runs once per page load and logs only `console.warn` lines today;
  `console.info` precedent: `src/main.ts` (room grown, salon carried), `TaskScene` (art filter fallback).
- **Pouf.** Slot `src/data/rooms.ts` `pouf` (458, 736, 278 x 218), painted rows y 752-937; `ROOM_LAYOUT.resume`
  (`src/data/layout.ts`) y 892-1008; contact ellipse y 895-969 — fully inside the button rows. Gap rows end at 172.
- **e2e.** `playwright.config.ts` `ROUND_SPEC` lists every hook spec (project `chromium-hook`, port 4397);
  `tests/e2e/salon-style.spec.ts` `#12 … welcome backdrop … graded worn salon`; the hook snapshot carries
  `artFallbacks` (`src/testing/e2eHook.ts` `artFallbacksSnapshot`, typed in `tests/e2e/support/hook.ts`). Chromium flags
  `--disable-webgl --disable-webgl2 --disable-3d-apis` make Phaser's `AUTO` choose Canvas; welcome, a round and the room
  run with no page error (research).
- `context/foundation/lessons.md` does not exist (checked; nothing to apply).
- **Baseline** (contract): `main` `c123331`, unit `Tests  3936 passed`, e2e 164. Every phase measures its own branch
  baseline before its first edit and writes `baseline + delta`.

## Desired End State

- `npm run art` prints `recolour-board: <path>/architecture-before.png: board mask 13.47%` and the same for `after`
  (13.45 %) and leaves `git status --porcelain public/` empty; a synthetic image with no green edge or an all-green
  image makes the script exit 1 naming the file, with no output file written.
- `npx vitest run tests/recolourBoard.test.ts` runs 3 tests locally (pins present); in CI the file is skipped and the log
  carries the reason line.
- In a browser without WebGL: the console has `Renderer: Canvas …` once, the hook's `artFallbacks.worn === 'ungraded'`
  from the welcome screen on, and "Obrazki" reads `pl.settings.wornPlain`; under WebGL `artFallbacks.worn` is absent and
  the console has `Renderer: WebGL`.
- `docs/design-gaps.md` rows 173 (Canvas parent sentence) and 174 (pouf under the return button); CLAUDE.md "Current
  state" carries one sentence group for this change; follow-ups with triggers recorded.

### Key Discoveries:

- Guard order matters for testability: non-finite first, then share — an empty mask yields NaN, so a share-first guard
  would make the non-finite branch unreachable through the CLI (research R2).
- The checks are pure observations after `out` is computed; the arithmetic is untouched, so outputs stay byte-identical
  (research proved PNG SHA-256 and WebP `cmp` identity with the draft).
- `noteFallback` keeps the first record for the whole game, so recording inside `applyWornGrade` costs one registry read
  per later call and satisfies "once per scene" a fortiori (research R4).
- A new `FallbackWhere` value must be excluded from `DrawnFallbackWhere`, or `artFallbackNames[where]` fails `tsc`
  and the parent would read the untrue "Zamiast obrazka gra rysuje: …".
- `test.use({ launchOptions })` at file level forces a fresh worker with those Chromium args; no seam, no edit of
  `vite/e2eHookGuard.mjs`.

## What We're NOT Doing

- No change to the recolour arithmetic, `board_mask`, the pins, `scripts/make-task-art.mjs` or any file in `public/`;
  no Python in CI (scope item 2).
- No new `?e2eArt` value, no edit of `vite/e2eHookGuard.mjs` or `src/main.ts` `type: AUTO` (research R6).
- No edit of `drawRoomMiniature`, `RoomScene.fadeStage`, `RoomView.render`, `SalonBackdrop.render` or
  `src/ui/artFallbacks.ts` (research R4 — keeps their follow-ups unfired); no per-scene guard.
- No edit of `pl.settings.artFallback` / `artFallbackNames` (health-lines FU 20 stays unfired).
- No change to the Canvas look itself (the wash stays; salon-style follow-up 3), no pixel guard of the worn look (FU-SS F2),
  no N-7, N-8 (scope item 6), no use of the author's coming worn pack.
- No pouf slot, button, hit-area or shadow change (research R8; `[human]` row).
- No roadmap status edit (non-roadmap change).

## Implementation Approach

The script guard and its test first (phase 1, test-led, closes M-1 alone); then the pure record and line rules with the
copy (phase 2, test-led); then the one-place wiring and the renderer log with source guards and the DESIGN-GAP rows
(phase 3); then docs, follow-ups, the seam sweep and the visual pass (phase 4, the last impl phase); then one e2e phase
under forced Canvas (phase 5). Each phase is independently green.

## Critical Implementation Details

- **Recolour byte identity.** Compute `share = float(filled.mean())` and check `np.isfinite(out).all()` on the float
  `out` before `np.clip`; do not reorder, recast or add any operation on the path from `a` to the saved PNG. `save` stays
  the last statement of `main`, after the print, so a refusal writes no file.
- **Skip must be loud.** The test's probe runs once at module level; when not ready, the `describe` title carries the
  reason and one module-level `console.warn` repeats it (vitest's default non-verbose reporter in CI prints console output
  with the file header but not skipped test titles).

## Phase 1: Board recolour refuses a wrong image (M-1)

Driver: tdd
Driver why: the guard is absent and a CLI test on synthetic images fails today (all-green and no-green both exit 0) — failing tests lead.

### Overview

Two refusals and a printed share in `scripts/recolour-board.py`, proven by a spawned-CLI vitest file with a pin probe and
a titled skip, and by an `npm run art` re-run that changes no byte of `public/`.

### Changes Required:

#### 1. Test first

**File**: `tests/recolourBoard.test.ts` (new)

**Intent**: prove both refusals and one acceptance through the real script, run only where `python3` has exactly the
pinned libraries, and say why it skipped everywhere else.

**Contract**: the interpreter is `process.env.RECOLOUR_BOARD_PYTHON ?? 'python3'` (the override exists only to
demonstrate the skip path locally). Module-level probe: `spawnSync(py, ['-I', '-B', '-c', 'import PIL, numpy;
print(PIL.__version__, numpy.__version__)'])`; ready iff status 0 and the output equals `PINNED_PILLOW` / `PINNED_NUMPY`
parsed from the script source (no second copy of the pins). Not ready → reason text `python3 cannot import PIL and
numpy` (spawn error or non-zero status) or `found Pillow <x> / numpy <y>`; the describe title is `recolour-board guard`
when ready and `recolour-board guard (skipped: <reason>; needs Pillow 12.1.0 / numpy 2.4.3)` otherwise, plus one
module-level `console.warn('recolourBoard: skipped: <reason>; needs Pillow 12.1.0 / numpy 2.4.3')`; `describe.skipIf(!ready)`.
Synthetic PNGs are written by a `py -I -B -c` snippet into `mkdtempSync(join(tmpdir(), 'recolour-'))` (removed in
`afterAll`); the script runs as `py -I -B scripts/recolour-board.py <in> <out> #BCD799`. Three tests:
- no green at the edge (e.g. 60 x 40 grey) → status ≠ 0, stderr contains the input file name and `non-finite`, output
  file absent;
- all green (hue ~120, s > 0.30) → status ≠ 0, stderr contains the file name and `100.0%`, output file absent;
- grey with a 3-px green band at top and bottom (share exactly 15 %) → status 0, stdout contains `board mask 15.00%`,
  output file exists.

#### 2. Guard

**File**: `scripts/recolour-board.py`

**Intent**: never write a wrong image with exit 0 (M-1), and put the share in the `npm run art` log.

**Contract**: `class BoardError(ValueError)`; constants `MIN_SHARE = 0.05`, `MAX_SHARE = 0.30` with a comment naming the
measured shares (13.47 % / 13.45 %) and research R1. In `recolour`, after `out` is computed and before the clip:
`share = float(filled.mean())`; `out` not all finite → `BoardError(f'board mask covers {share:.1%} and the result has
non-finite values')`; share outside the bounds → `BoardError(f'board mask covers {share:.1%}, outside 5%-30%')` (this
order — research R2); `recolour` returns `(image, share)`. `main`: `BoardError` → `sys.exit(f'recolour-board: {src}:
{error}')`; otherwise `print(f'recolour-board: {src}: board mask {share:.2%}')` then save. Docstring gains one paragraph
on the refusal. numpy's `RuntimeWarning` on the empty mask may stay on stderr (harmless, research).

#### 3. Byte identity

**Files**: none changed — `npm run art` re-run (needs `designs/`, `cwebp`, the pins; all present locally).

**Contract**: its log shows the two `board mask` lines; afterwards `git status --porcelain public/` is empty.

### Success Criteria:

#### Automated Verification:

- `tests/recolourBoard.test.ts` red before the guard (all-green and no-green cases exit 0; band case lacks the share line), green after; unit `<branch baseline> + 3`
- Deliberate break: remove the share check → the all-green case red; remove the finiteness check → the no-green case red (exit 0, black image written); each restored; meta-check: the band case stays green under both breaks and passes only with the share printed, so a blanket refusal or a silent no-op guard cannot pass; the oracles are literal synthetic images, not values computed by the script
- Skip path: `RECOLOUR_BOARD_PYTHON=/nonexistent/python3 npx vitest run tests/recolourBoard.test.ts` → 3 skipped, the output shows `recolourBoard: skipped: python3 cannot import PIL and numpy; needs Pillow 12.1.0 / numpy 2.4.3`; without the variable → 3 passed (no silent skip where the pins exist)
- `npm run art` prints `board mask 13.47%` and `board mask 13.45%`, then `git status --porcelain public/` empty
- `git status --porcelain scripts/` shows only `recolour-board.py` (no `__pycache__`)
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

---

## Phase 2: The `worn` record and its "Obrazki" line (L-1 rules and copy)

Driver: tdd
Driver why: the `worn` place, its own line kind and the exclusion from the drawn list are absent pure rules with literal oracles — failing tests lead.

### Overview

The record value, the line, the parent sentence and the view's `case`, without any widget change.

### Changes Required:

#### 1. Fallback place

**File**: `src/core/artPick.ts`

**Intent**: an ungraded worn look can be recorded like the fox, but is not a drawn stand-in.

**Contract**: `FallbackWhere` gains `'worn'`; `FALLBACK_ORDER` appends `'worn'` after `'guide'`; `DrawnFallbackWhere =
Exclude<FallbackWhere, 'guide' | 'worn'>`; the doc comment says the worn look records `'ungraded'` (the furniture shows,
only without the worn grade). `noteFallback` unchanged.

#### 2. Line

**File**: `src/core/artHealth.ts`

**Intent**: one true parent line, after the fox's and before the drawn list.

**Contract**: `ArtHealthLine` gains `{ kind: 'worn' }`; `artHealthLines` pushes it when `fallbacks?.worn !== undefined`,
right after the `guide` line; the drawn list filter excludes `'worn'` as well as `'guide'` (type guard to
`DrawnFallbackWhere`). Doc comment updated (order: font → guide → worn → fallback → code).

#### 3. Copy and view

**File**: `src/data/pl.ts` — `pl.settings.wornPlain: 'Przeglądarka rysuje grę w prostszym trybie, więc meble przed
remontem nie wyglądają na stare.'` beside `guideMissing`, with a `DESIGN-GAP 173` comment (the kit has no parent text for
the renderer). `artFallback` / `artFallbackNames` untouched.

**File**: `src/ui/dom/artHealthView.ts` — `textOf`: `case 'worn': return pl.settings.wornPlain;`. Nothing else.

#### 4. Tests

**Files**: `tests/artHealthLines.test.ts`, `tests/artHealthText.test.ts` (and `tests/artHealth.test.ts` only if it pins
`FALLBACK_ORDER`).

**Contract**: `artHealthLines` with `fallbacks: { worn: 'ungraded' }` → exactly one `{ kind: 'worn' }` and no `fallback`
line; `{ worn, wallet }` → `worn` line then `fallback` with `where` `['wallet']`; `{ guide, worn, wallet }` → order guide,
worn, fallback; no `worn` key → no `worn` line. `FALLBACK_ORDER` ends with `'worn'`. `wornPlain` is one sentence ending
with a full stop and does not contain `rysuje:` or `zamiast` (no stand-in claim).

### Success Criteria:

#### Automated Verification:

- New cases red against stubs (no `worn` line; `worn` left in the drawn list), green after; unit `<phase-1 count> + N`
- Deliberate break: drop `'worn'` from the drawn-list filter → typecheck red in `artHealthView.ts` (`artFallbackNames['worn']`) and the `{ worn, wallet }` case red; push the `worn` line before `guide` → the order case red; each restored; meta-check: the oracles are literal records and literal line lists, not values computed by the code under test
- `git diff main -- src/data/pl.ts` shows only the added `wornPlain` line and its comment (no edit of `artFallback`/`artFallbackNames`)
- `git diff --stat main -- src/core/save.ts tests/fixtures src/data/balance.ts src/data/curriculum src/data/rooms.ts` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

---

## Phase 3: Record the ungraded look in one place and log the renderer (L-1 wiring)

Driver: impl
Driver why: Phaser glue (filters absent under Canvas, registry write, boot log) that no pure test can lead; proven by source guards here and the phase-5 e2e under real Canvas.

### Overview

`applyWornGrade` records on its `false` path; `BootScene.create` logs the renderer; source guards keep both in place;
the two DESIGN-GAP rows and the comment at `ROOM_LAYOUT.resume`.

### Changes Required:

#### 1. Grade wiring

**File**: `src/ui/wornGrade.ts`

**Intent**: every grade caller (room, ghosts, miniature, backdrop, any future one) reports an ungraded look through one
choke point (research R4).

**Contract**: the parameter `_scene` becomes `scene`; when the result would be `false` (either `addGrade` call), call
`recordFallback(scene, 'worn', 'ungraded')` once, then return `false`. Return value and filter behaviour unchanged. The
JSDoc names the record and DESIGN-GAP 173. No caller edited.

#### 2. Renderer log

**File**: `src/scenes/BootScene.ts`

**Intent**: one start-up line naming the renderer (scope item 3), so a Canvas device is visible in a console or a
remote-inspector session.

**Contract**: in `create`, one `console.info` (developer English): `Renderer: WebGL` when
`this.sys.game.renderer.type === WEBGL` (the named `WEBGL` import from `'phaser'`, as `SalonBackdrop.ts` does), otherwise `Renderer: Canvas (no
filters: the worn salon look is off)`. Wrapped like the other `create` diagnostics so a throw never stops boot.

#### 3. Source guards

**File**: `tests/salonStyleWiring.test.ts` (extend; new `describe('worn record wiring')`)

**Contract**: `src/ui/wornGrade.ts` calls `recordFallback(` with `'worn'` and `'ungraded'`, and has no `_scene`;
`applyWornGrade(` is called only from `src/ui/widgets/RoomView.ts` within `src/` (a new caller would bypass nothing, but the
guard tells the reader the record lives in the callee); `recordFallback(` with `'worn'` appears only in
`src/ui/wornGrade.ts`; `BootScene.ts`'s `create` body contains exactly one `console.info(` whose text starts `Renderer:`.

#### 4. Design gaps

**File**: `docs/design-gaps.md` — row 173 (change audit-art-renderer): the kit has no parent text for a browser that
cannot draw the worn look → "Obrazki" line `pl.settings.wornPlain` (wording autonomous, `[human]` read), record
`artFallbacks.worn = 'ungraded'`; files `src/ui/wornGrade.ts`, `src/core/artHealth.ts`, `src/data/pl.ts`. Row 174: the
pack's pouf slot puts the bottom 46 px of the painted pouf and its whole contact shadow under the kit's "Wróć do notesu"
button (frame measurement in `research.md` (d)) → left as is; options move the pouf slot / move the button / accept, for
the maintainer; files `src/data/rooms.ts` (`pouf`), `src/data/layout.ts` (`ROOM_LAYOUT.resume`).

**File**: `src/data/layout.ts` — one comment at `ROOM_LAYOUT.resume` naming DESIGN-GAP 174 (no value change).

### Success Criteria:

#### Automated Verification:

- `tests/salonStyleWiring.test.ts` green with the new cases; unit `<phase-2 count> + N`
- Deliberate break: delete the `recordFallback` call → its case red; change `console.info` to `console.log` → the renderer case red; each restored; meta-check: these are source guards of the wiring; the record under a real Canvas renderer and the panel text are proven by phase 5
- `git diff --stat main -- src/ui/widgets src/scenes/RoomScene.ts src/ui/artFallbacks.ts src/main.ts vite/e2eHookGuard.mjs public` empty
- `git diff main -- src/data/layout.ts` is one added comment line (no value change); `grep -n "^| 17[34] |" docs/design-gaps.md` shows both rows
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (`salon-style.spec.ts` green under WebGL: nothing recorded there)

---

## Phase 4: Docs, follow-ups, seam sweep and the visual pass

Driver: impl
Driver why: rule-file text, follow-ups and leftovers over phases 1-3 plus the screenshot matrix — docs and glue.

### Overview

CLAUDE.md, follow-ups with triggers, the seam sweep, screenshots of every touched state, and the rows only a human or CI
can close.

### Changes Required:

#### 1. Rule files

**File**: `CLAUDE.md` "Current state" (and `AGENTS.md` only if it repeats the facts — grep first)

**Intent**: one sentence group in the existing style, e.g.: Art guard and renderer record (change audit-art-renderer; save
format stays v4): `scripts/recolour-board.py` refuses an implausible board mask (outside 5 %-30 %) or a non-finite result
with exit 1 and the file name, prints the mask share in the `npm run art` log, and is tested on synthetic images by
`tests/recolourBoard.test.ts` (skips with its reason where `python3` lacks the pinned Pillow/numpy, as in CI);
`applyWornGrade` records `worn: 'ungraded'` in `REGISTRY_KEYS.artFallbacks` when the renderer has no filters (Canvas),
`BootScene` logs the renderer once, "Obrazki" names it with `pl.settings.wornPlain`, and `tests/e2e/canvas-renderer.spec.ts`
runs the hook build with WebGL disabled; the pouf under "Wróć do notesu" is design gap 174. Also fix any sentence made
untrue (the salon-style group's "WebGL only; Canvas gets a wash" stays true — add nothing there).

#### 2. Follow-ups

**File**: `context/changes/audit-art-renderer/follow-ups/review-fixes.md` (new)

**Intent**: one entry per deferred or re-recorded item, each with a `Trigger:` line: pouf vs return button (DESIGN-GAP
174, Trigger: the maintainer's choice or the author's worn pack touching the pouf); `make-task-art.mjs` runs Python
without `-I` (Trigger: next change to `scripts/make-task-art.mjs`); re-recorded open, fired by this change: salon-style F2 /
impl-review F2 (pixel guard of the worn look; `applyWornGrade` edited), final-art-salon F4 and salon-load-health L-6/L-8
(art-health view), audit-backdrop-fox F5 (generic `artHealth.ts` group), audit-backdrop-fox F1 (`pixel()` null under
Canvas — the new Canvas e2e checks the record, not pixels); salon-style 3 (Canvas look itself) referenced as still open
with the new signal named. Unfired ones (salon-style F4, final-art-salon F2, salon-extra-slots F2, L-R8/L-R11, F6 /
notebook-polish 16, G-3, VO2/F5/F7) are not re-recorded.

#### 3. Seam sweep

**Files**: anything phases 1-3 left

**Intent**: one place records `worn` (`src/ui/wornGrade.ts`); no `_scene` left; `DrawnFallbackWhere` users and
`FALLBACK_ORDER` users still right (`UIScene` `artHealthLines` call, e2e `hook.ts` typing); stale comments
(`artPick.ts` `FallbackWhere` doc, `artHealthLines` doc, `applyWornGrade` JSDoc, `recolour-board.py` docstring, the
salon-style comment in `RoomView.drawWorn` that says nothing records the wash, if any); no duplicated pin constants
(the test parses the script); `pl.settings.wornPlain` used exactly once in `src/`; row 169/170 cross-reference 173 if
their text claims the Canvas look is silent.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -n "recolourBoard\|wornPlain" CLAUDE.md` present
- `grep -c "Trigger:" context/changes/audit-art-renderer/follow-ups/review-fixes.md` ≥ 6
- `grep -rn "'worn', 'ungraded'" src` lists only `src/ui/wornGrade.ts`; `grep -rn "wornPlain" src` lists `src/data/pl.ts` and `src/ui/dom/artHealthView.ts` only
- `git diff --stat main -- src/core/save.ts tests/fixtures src/data/balance.ts src/data/curriculum public` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [human] Accept the parent sentence `pl.settings.wornPlain` "Przeglądarka rysuje grę w prostszym trybie, więc meble przed remontem nie wyglądają na stare." (scope item 3 fixes the place and "true, no stand-in claim", not the words; DESIGN-GAP 173; decision P-4)
- [human] Choose for the pouf under "Wróć do notesu" (DESIGN-GAP 174): move the pouf slot, move the button, or accept — this change ships a gap row instead of a code fix (scope item 4 allows it; research R8; decision P-5)
- [human] Accept that `drawRoomMiniature` still drops the boolean: its grade result is recorded inside `applyWornGrade` (research R4), which meets scope item 3's intent ("stops ignoring the result") but not its literal wording (decision P-3)
- [visual] Hook build on 4399, desktop 1440 and tablet 1024 (Playwright fallback with the Canvas launch args for the Canvas states; Claude in Chrome cannot disable WebGL): settings "Obrazki" under Canvas with the `wornPlain` line; settings "Obrazki" under WebGL without it; the room before the stage under Canvas (wash, full-colour furniture) vs under WebGL (graded worn set); the welcome backdrop under Canvas vs WebGL; the empty after room under WebGL showing the pouf under "Wróć do notesu" (gap 174, unchanged)
- [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in the `check` log of run 40146540454, job 121028985242: `Tests  3936 passed (3936)`, `e2e hook: absent (2 chunks checked)`); the Python test SKIPS in CI, so the log is expected to show `recolourBoard: skipped: python3 cannot import PIL and numpy; needs Pillow 12.1.0 / numpy 2.4.3` (or the `found Pillow <x> / numpy <y>` variant if the runner image ships other versions) and `Tests  <n> passed | 3 skipped` — CI never proves M-1; phase 1's local gate does

---

## Phase 5: Under the Canvas renderer the ungraded look is recorded and named — e2e (#12, #16, #14)

Driver: e2e
Driver why: the `false` path of `applyWornGrade` exists only under a real Canvas renderer in the browser (risk #12 welcome backdrop, #16 room, #14 parent panel); built by phases 2-3, contract `E2E=on`.

### Overview

One new hook spec run with WebGL disabled, and one WebGL-control assertion in the existing salon-style spec.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/canvas-renderer.spec.ts` (new; `canvas-renderer` added to `ROUND_SPEC` in `playwright.config.ts`, as
every hook spec before it)

**Contract**: file-level `test.use({ launchOptions: { args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] } })`;
model on `salon-style.spec.ts` and `support/{hook,welcome}.ts`; a `pageerror` collector asserting none in each test.
- `#12 canvas-renderer the welcome backdrop under Canvas records the ungraded worn look` — on the welcome:
  `backdrop.renderer === 'canvas'` (fails loudly if the flags stop disabling WebGL), `artFallbacks.worn === 'ungraded'`; a
  console message `Renderer: Canvas` seen exactly once.
- `#16 canvas-renderer the before room under Canvas shows the worn set ungraded and still sells the stage` — pass the
  welcome, answer the open task, `roomSwitch`: `room.worn.graded === false`, worn keys present, `artFallbacks.worn ===
  'ungraded'`; the stage purchase works (seed stars through `?e2eStars`, as `salon-style.spec.ts` does).
- `#14 canvas-renderer the pictures section names the plain look` — `openSettings`: `pl.settings.wornPlain` visible
  (exact); no text matching `pl.settings.artFallback(` prefix "Zamiast obrazka gra rysuje".

**File**: `tests/e2e/salon-style.spec.ts` — in `#12 salon-style the welcome backdrop … graded worn salon`, one added
assertion `artFallbacks.worn` undefined (WebGL control).

No `sleep`/`until`/`while` loops or `tail -f` waiters (profile § 8); waits through `expect.poll`.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each run alone with `-g`: delete the `recordFallback` call in `applyWornGrade` → `#12` and `#16` red on `artFallbacks.worn`; return `pl.settings.guideMissing` from `case 'worn'` in `textOf` → `#14` red; remove the `console.info` → `#12` red; drop the launch args → `#12` red on `renderer`; each restored), green after; `salon-style.spec.ts` `#12` red when `applyWornGrade` records unconditionally, restored
- `npx playwright test tests/e2e/canvas-renderer.spec.ts tests/e2e/salon-style.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 3`; total equals `npx playwright test --list | tail -1`
- Full local gate green

---

## Testing Strategy

### Unit Tests:

- `tests/recolourBoard.test.ts`: two refusals and one acceptance through the real CLI on synthetic images, pin probe,
  titled skip with a warn line (phase 1).
- `artHealthLines` `worn` line, order and exclusion from the drawn list; `FALLBACK_ORDER`; `wornPlain` shape (phase 2).
- Source guards: one `worn` record in `applyWornGrade`, one renderer `console.info` in `BootScene.create` (phase 3).

### Integration Tests:

- `tests/e2e/canvas-renderer.spec.ts` (three tests under real Canvas, risks #12/#16/#14) and one WebGL-control assertion
  in `tests/e2e/salon-style.spec.ts`.

### Manual Testing Steps:

1. `npm run art`: two `board mask` lines, `git status --porcelain public/` empty.
2. Hook build in Chromium started with `--disable-webgl --disable-webgl2 --disable-3d-apis`: console `Renderer: Canvas …`;
   settings "Obrazki" shows the plain-look sentence.
3. Same build in a normal browser: `Renderer: WebGL`, no such sentence.

## Performance Considerations

One registry read per `applyWornGrade` call under Canvas after the first record (a handful per render); one
`console.info` per page load. The script adds one `isfinite` pass and one mean over the mask (milliseconds, local tool).
No boot payload change.

## Migration Notes

None: save format stays v4; the record is runtime only.

## Known risks

- A Chromium update where the flags no longer disable WebGL: `#12` fails loudly on `backdrop.renderer` (research R6).
- A runner image that ships exactly Pillow 12.1.0 / numpy 2.4.3 would run the Python test in CI; it would then pass (the
  script needs no `designs/`), not fail.
- numpy prints `RuntimeWarning` lines on the empty-mask refusal; the test matches substrings, not the whole stderr.

## Autonomous decisions

- **P-1 Five phases** (tdd script guard → tdd rules/copy → impl wiring + gaps → impl docs/sweep/visual → e2e), research's
  four plus a separate docs/sweep phase. Rejected: folding the docs into phase 3. Why: the step prompt wants the seam sweep
  in the last impl phase and phases small. Would change: per-phase overhead dominating in the orchestrator's measurements.
- **P-2 Skip visibility by a module-level `console.warn` plus the titled describe**. Rejected: a verbose reporter in CI
  (changes `.github/workflows/ci.yml`, out of scope). Why: the default non-verbose reporter prints console output but not
  skipped titles. Would change: CI switching to a reporter that lists skipped titles.
- **P-3 Record inside `applyWornGrade`, `drawRoomMiniature` left untouched** (research R4). **Departs from scope item 3's
  literal "`drawRoomMiniature` stops ignoring the result"** → `[human]` row 4.8. Would change: the maintainer or
  plan-review requiring the flag returned by `drawRoomMiniature` (then add it, keeping the record in the callee).
- **P-4 Parent copy `wornPlain`** (research draft). Rejected: a member of the "gra rysuje" list (untrue). Wording chosen
  without the maintainer → `[human]` row 4.6. Would change: the maintainer's wording.
- **P-5 Pouf: DESIGN-GAP 174, no code** (research R8). The scope allows it, but the user-visible issue stays → `[human]`
  row 4.7. Would change: the maintainer choosing to move the slot or the button.
- **P-6 Source guards in `tests/salonStyleWiring.test.ts`**, not a new file. Why: same widget family, existing salon-style
  guard file. Would change: the file growing past one concern.
- **P-7 `RECOLOUR_BOARD_PYTHON` override in the test only**, so the skip path can be shown locally. Rejected: no override
  (skip path never observed on this machine). Would change: nothing known; the script itself never reads it.
- **P-8 Risk ids** #12 (welcome), #16 (room), #14 (parent panel), as `salon-style.spec.ts` and the fox specs use them. Would
  change: the test plan adding a renderer risk.
- **P-9 Renderer log is `console.info`**, not `warn`: Canvas is a supported path, not a fault. Would change: a maintainer
  wanting it in the error-level filter.

## References

- Research: `context/changes/audit-art-renderer/research.md`; identity `context/changes/audit-art-renderer/change.md`
- Scope: `context/runs/2026-10-25-audit-art-renderer/scope.md`
- Format example: `context/archive/2026-10-24-audit-backdrop-fox/plan.md`
- Code: `scripts/recolour-board.py` (`recolour`, `board_mask`, `main`, `check_versions`), `scripts/make-task-art.mjs`
  (`BOARD_JOBS`, `convert`), `src/ui/wornGrade.ts` (`applyWornGrade`, `addGrade`), `src/ui/widgets/RoomView.ts`
  (`buildWorn`, `drawRoomMiniature`), `src/ui/artFallbacks.ts` (`recordFallback`), `src/core/artPick.ts`
  (`FallbackWhere`, `DrawnFallbackWhere`, `FALLBACK_ORDER`, `noteFallback`), `src/core/artHealth.ts` (`artHealthLines`),
  `src/ui/dom/artHealthView.ts` (`textOf`), `src/scenes/BootScene.ts` (`create`), `src/data/pl.ts` (`settings`),
  `src/data/layout.ts` (`ROOM_LAYOUT.resume`), `src/data/rooms.ts` (`pouf`), `playwright.config.ts` (`ROUND_SPEC`),
  `tests/e2e/salon-style.spec.ts`, `tests/salonStyleWiring.test.ts`
- Docs: `docs/design-gaps.md` rows 169-172 (new 173, 174)
- Test plan: `context/foundation/test-plan.md` risks #12, #14, #16

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Board recolour refuses a wrong image (M-1)

#### Automated

- [ ] 1.1 `tests/recolourBoard.test.ts` red before the guard (all-green and no-green cases exit 0; band case lacks the share line), green after; unit `<branch baseline> + 3`
- [ ] 1.2 Deliberate break: remove the share check → the all-green case red; remove the finiteness check → the no-green case red (exit 0, black image written); each restored; meta-check: the band case stays green under both breaks and passes only with the share printed, so a blanket refusal or a silent no-op guard cannot pass; the oracles are literal synthetic images, not values computed by the script
- [ ] 1.3 Skip path: `RECOLOUR_BOARD_PYTHON=/nonexistent/python3 npx vitest run tests/recolourBoard.test.ts` → 3 skipped, the output shows `recolourBoard: skipped: python3 cannot import PIL and numpy; needs Pillow 12.1.0 / numpy 2.4.3`; without the variable → 3 passed (no silent skip where the pins exist)
- [ ] 1.4 `npm run art` prints `board mask 13.47%` and `board mask 13.45%`, then `git status --porcelain public/` empty
- [ ] 1.5 `git status --porcelain scripts/` shows only `recolour-board.py` (no `__pycache__`)
- [ ] 1.6 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

### Phase 2: The `worn` record and its "Obrazki" line (L-1 rules and copy)

#### Automated

- [ ] 2.1 New cases red against stubs (no `worn` line; `worn` left in the drawn list), green after; unit `<phase-1 count> + N`
- [ ] 2.2 Deliberate break: drop `'worn'` from the drawn-list filter → typecheck red in `artHealthView.ts` (`artFallbackNames['worn']`) and the `{ worn, wallet }` case red; push the `worn` line before `guide` → the order case red; each restored; meta-check: the oracles are literal records and literal line lists, not values computed by the code under test
- [ ] 2.3 `git diff main -- src/data/pl.ts` shows only the added `wornPlain` line and its comment (no edit of `artFallback`/`artFallbackNames`)
- [ ] 2.4 `git diff --stat main -- src/core/save.ts tests/fixtures src/data/balance.ts src/data/curriculum src/data/rooms.ts` empty
- [ ] 2.5 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

### Phase 3: Record the ungraded look in one place and log the renderer (L-1 wiring)

#### Automated

- [ ] 3.1 `tests/salonStyleWiring.test.ts` green with the new cases; unit `<phase-2 count> + N`
- [ ] 3.2 Deliberate break: delete the `recordFallback` call → its case red; change `console.info` to `console.log` → the renderer case red; each restored; meta-check: these are source guards of the wiring; the record under a real Canvas renderer and the panel text are proven by phase 5
- [ ] 3.3 `git diff --stat main -- src/ui/widgets src/scenes/RoomScene.ts src/ui/artFallbacks.ts src/main.ts vite/e2eHookGuard.mjs public` empty
- [ ] 3.4 `git diff main -- src/data/layout.ts` is one added comment line (no value change); `grep -n "^| 17[34] |" docs/design-gaps.md` shows both rows
- [ ] 3.5 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (`salon-style.spec.ts` green under WebGL: nothing recorded there)

### Phase 4: Docs, follow-ups, seam sweep and the visual pass

#### Automated

- [ ] 4.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -n "recolourBoard\|wornPlain" CLAUDE.md` present
- [ ] 4.2 `grep -c "Trigger:" context/changes/audit-art-renderer/follow-ups/review-fixes.md` ≥ 6
- [ ] 4.3 `grep -rn "'worn', 'ungraded'" src` lists only `src/ui/wornGrade.ts`; `grep -rn "wornPlain" src` lists `src/data/pl.ts` and `src/ui/dom/artHealthView.ts` only
- [ ] 4.4 `git diff --stat main -- src/core/save.ts tests/fixtures src/data/balance.ts src/data/curriculum public` empty
- [ ] 4.5 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual

- [ ] 4.6 [human] Accept the parent sentence `pl.settings.wornPlain` "Przeglądarka rysuje grę w prostszym trybie, więc meble przed remontem nie wyglądają na stare." (scope item 3 fixes the place and "true, no stand-in claim", not the words; DESIGN-GAP 173; decision P-4)
- [ ] 4.7 [human] Choose for the pouf under "Wróć do notesu" (DESIGN-GAP 174): move the pouf slot, move the button, or accept — this change ships a gap row instead of a code fix (scope item 4 allows it; research R8; decision P-5)
- [ ] 4.8 [human] Accept that `drawRoomMiniature` still drops the boolean: its grade result is recorded inside `applyWornGrade` (research R4), which meets scope item 3's intent ("stops ignoring the result") but not its literal wording (decision P-3)
- [ ] 4.9 [visual] Hook build on 4399, desktop 1440 and tablet 1024 (Playwright fallback with the Canvas launch args for the Canvas states; Claude in Chrome cannot disable WebGL): settings "Obrazki" under Canvas with the `wornPlain` line; settings "Obrazki" under WebGL without it; the room before the stage under Canvas (wash, full-colour furniture) vs under WebGL (graded worn set); the welcome backdrop under Canvas vs WebGL; the empty after room under WebGL showing the pouf under "Wróć do notesu" (gap 174, unchanged)
- [ ] 4.10 [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in the `check` log of run 40146540454, job 121028985242: `Tests  3936 passed (3936)`, `e2e hook: absent (2 chunks checked)`); the Python test SKIPS in CI, so the log is expected to show `recolourBoard: skipped: python3 cannot import PIL and numpy; needs Pillow 12.1.0 / numpy 2.4.3` (or the `found Pillow <x> / numpy <y>` variant if the runner image ships other versions) and `Tests  <n> passed | 3 skipped` — CI never proves M-1; phase 1's local gate does

### Phase 5: Under the Canvas renderer the ungraded look is recorded and named — e2e (#12, #16, #14)

#### Automated

- [ ] 5.1 Spec red before (deliberate breaks, each run alone with `-g`: delete the `recordFallback` call in `applyWornGrade` → `#12` and `#16` red on `artFallbacks.worn`; return `pl.settings.guideMissing` from `case 'worn'` in `textOf` → `#14` red; remove the `console.info` → `#12` red; drop the launch args → `#12` red on `renderer`; each restored), green after; `salon-style.spec.ts` `#12` red when `applyWornGrade` records unconditionally, restored
- [ ] 5.2 `npx playwright test tests/e2e/canvas-renderer.spec.ts tests/e2e/salon-style.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 3`; total equals `npx playwright test --list | tail -1`
- [ ] 5.3 Full local gate green
