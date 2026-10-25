---
date: 2026-10-25T15:57:11+0100
researcher: Claude (autonomous run 2026-10-25-audit-art-renderer, research step)
git_commit: b2bde3a
branch: feat/audit-art-renderer
repository: Martynka-urzadza
topic: "Board recolour refuses a wrong image (M-1), Canvas renderer named in Obrazki (L-1), pouf contact shadow under the return button"
tags: [research, recolour-board, applyWornGrade, artFallbacks, artHealth, phaser-canvas, e2e, design-gap]
status: complete
last_updated: 2026-10-25
last_updated_by: Claude (autonomous run 2026-10-25-audit-art-renderer)
---

# Research: audit-art-renderer

**Date**: 2026-10-25T15:57:11+0100
**Researcher**: Claude (autonomous run, research step)
**Git Commit**: b2bde3a
**Branch**: feat/audit-art-renderer
**Repository**: Martynka-urzadza

## Research Question

From `change.md` (scope items 1-6, pre-agreed by the maintainer 2026-10-25) and its open unknowns, for the findings M-1 and
L-1 of the audit report on branch docs/observability-audit-2026-10-24-salon-style (PR #107) and the visual-gate observation
about the pouf:

- (a) M-1: the real board-mask share of both salon backgrounds, refusal bounds with margin, and proof that a guarded
  `scripts/recolour-board.py` still produces byte-identical output;
- (b) how a Python check is tested from vitest, with a stated skip in CI and no silent pass locally;
- (c) L-1: the record shape, every caller of `applyWornGrade` and how each reports, the parent sentence, the renderer
  `console.info`, and the proof (can headless Chromium run the game under Phaser's Canvas renderer?);
- (d) pouf: what the "Wróć do notesu" button actually covers in the empty after room; fix vs DESIGN-GAP.

## Summary

- **(a)** Measured with the pinned Pillow 12.1.0 / numpy 2.4.3 on `designs/martynka-salon-v2/assets/room/`: the board mask
  (`board_mask`, edge flood fill) covers **13.47 %** of `architecture-before.png` and **13.45 %** of `architecture-after.png`
  (both 1920 x 1080). Chosen bounds: **5 %-30 %** (2.7x below, 2.2x above the measured shares). A guarded draft of the script
  (checks added after `out` is computed, share printed in `main`) produced PNGs whose SHA-256 equals the current script's
  for both backgrounds, and `cwebp` with the arguments of `convert` in `scripts/make-task-art.mjs` turned them into WebP files
  byte-identical (`cmp`) to the committed `public/assets/rooms/salon/architecture-{before,after}.webp`. Nothing in `public/`
  was written.
- **(b)** A vitest file runs the script as a CLI with `python3 -I -B` on synthetic PNGs that Python itself writes into a temp
  dir. The guard order "non-finite first, then share" makes both refusals reachable through the CLI: an image with no green at
  the edge (empty mask) is refused as non-finite (share 0.0 %), an all-green image as share 100.0 %; a third image with a green
  frame band (share 15.00 %) is accepted and prints its share — so the suite cannot pass with a no-op guard. The suite runs only
  when a probe sees `python3` with exactly the pins the script declares, and otherwise skips with the reason in its title.
  CI (`.github/workflows/ci.yml`: `ubuntu-latest`, Node 22, no Python setup step) is expected to skip.
- **(c)** The two call sites of `applyWornGrade` (`buildWorn` and `drawRoomMiniature` in `src/ui/widgets/RoomView.ts`) serve
  four uses (room, stage ghosts, done-card miniature, welcome/task backdrop). The smallest complete wiring records inside
  `applyWornGrade` itself on its `false` path (its `_scene` parameter is already there and unused) through `recordFallback`
  with a new `FallbackWhere` value `worn`; `noteFallback` keeps the first record for the whole game, so a per-scene guard is
  unnecessary. The parent line is its own `ArtHealthLine` kind (like `guide`), not part of the "gra rysuje" list. Headless
  Chromium launched with `--disable-webgl --disable-webgl2 --disable-3d-apis` makes Phaser's `AUTO` fall back to Canvas, and the
  hook build ran the welcome backdrop, a round and the room under Canvas with no page error — so the proof is an e2e spec in the
  `chromium-hook` project using `test.use({ launchOptions })`, with **no new seam and no change to `vite/e2eHookGuard.mjs`**.
- **(d)** Frame of the empty after room (WebGL, hook build, 1920 x 1080): the button covers the **bottom 46 px of the painted
  pouf** (painted rows y 752-937 from the texture's alpha; button y 892-1008) across the pouf's whole painted width, and the
  contact-shadow ellipse (y 895-969) lies inside the button's rows. No shadow tweak can show the shadow without drawing it on the
  pouf's body; the cause is the pack's slot position vs the kit's button. Decision: **DESIGN-GAP row, no code change**, a
  `[human]` choice (move pouf / move button / accept) recorded.

## Detailed Findings

### (a) M-1 — board-mask share and the guard

- `scripts/recolour-board.py` `recolour`: `mean_lum = a[filled].mean()` is NaN on an empty mask; `out` is clipped and cast
  with no finiteness check; `main` saves unconditionally. `board_mask` has no bound on `filled.sum()`. (Re-verified; matches the
  change.md claim table.)
- Measurement (script in `$TMPDIR`, module loaded by path, run with `python3 -I`): `architecture-before.png` mask 0.1347, core
  (hue 95-165, s > 0.30) 0.1347, core not reached by the flood 0.0000; `architecture-after.png` mask 0.1345, core 0.1433, core not
  reached 0.0088 (the green trees in the window, untouched by design).
- Bounds 5 %-30 %: the scope's coming art (pack `martynka-salon-worn-v1`, "the SAME board pixels as architecture-after") would
  measure the same share; a mask that leaks into the room would add the floor/walls and pass 30 %; an empty or nearly empty
  mask falls under 5 %. The audit's own suggestion was 5-60 %; 30 % keeps the same lower bound and a tighter upper one.
- Guarded draft (in `$TMPDIR`, not committed): `class BoardError(ValueError)`, constants `MIN_SHARE = 0.05`, `MAX_SHARE = 0.30`;
  in `recolour`, after `out` is computed: `share = float(filled.mean())`; non-finite `out` → `BoardError('board mask covers
  {share:.1%} and the result has non-finite values')`; share outside bounds → `BoardError('board mask covers {share:.1%},
  outside 5%-30%')`; `recolour` returns `(image, share)`; `main` turns `BoardError` into `sys.exit(f'recolour-board: {src}:
  {error}')` (exit 1, message on stderr) and otherwise prints `recolour-board: {src}: board mask {share:.2%}` on stdout before
  saving. Observed:
  - real art: `board mask 13.47%` / `13.45%`, exit 0; PNG SHA-256 identical to the current script's output
    (`f5c1e777…` before, `eafd2d46…` after); WebP from `cwebp -quiet -q 85 -alpha_q 100 -m 6` identical (`cmp`) to the committed
    files.
  - synthetic 60 x 40 no-green: exit 1, `…nogreen.png: board mask covers 0.0% and the result has non-finite values`, plus numpy's
    two `RuntimeWarning` lines; no output file written.
  - synthetic all-green: exit 1, `…allgreen.png: board mask covers 100.0%, outside 5%-30%`; no output file.
  - synthetic 3-px green top/bottom band: exit 0, `board mask 15.00%`, output written.
- `scripts/make-task-art.mjs` (ROOM_JOBS loop, `BOARD_JOBS`): `execFileSync('python3', …, { stdio: ['ignore', 'inherit',
  'inherit'] })` inside `try`, `process.exit(1)` on a throw — a non-zero exit stops `npm run art` with the source path, and the
  printed share lands in its log (stdout inherited). No change needed there; the call has no `-I` (the plan may leave it).
- Byte-identity proof for the implement phase: re-run `npm run art` (needs `cwebp` and the pins, both present) and
  `git status --porcelain public/` empty — the draft already showed the identity at PNG and WebP level.

### (b) Testing the Python guard from vitest

- No test in `tests/` spawns a process today (search for `child_process|spawnSync|execFileSync` in `tests/*.test.ts`: none);
  `tests/fontZero.test.ts` reads bytes in TypeScript. `vitest.config.mts` has `testTimeout: 30_000`.
- Proposed `tests/recolourBoard.test.ts`:
  - probe once at module level: `spawnSync('python3', ['-I', '-B', '-c', 'import PIL, numpy; print(PIL.__version__,
    numpy.__version__)'])`; ready iff status 0 and the output equals the `PINNED_PILLOW` / `PINNED_NUMPY` read from the
    script's source (no second copy of the pins);
  - `describe.skipIf(!ready)` with the reason in the title (`python3 missing` / `Pillow x / numpy y, needs 12.1.0 / 2.4.3`), so a
    skipped run says why in the reporter; where the pins are present the suite runs (no silent pass);
  - synthetic images written by a `python3 -I -B -c` snippet into `mkdtempSync(join(tmpdir(), …))`; three cases: empty mask
    (exit != 0, stderr names the file and "non-finite", no output file), all green (exit != 0, names the file and "100.0%"),
    band (exit 0, stdout `board mask 15.00%`, output exists).
  - `-B` matters: loading the script as a module wrote `scripts/__pycache__/` during this research (removed); running it as a
    CLI script does not, but `-B` keeps any future import-based test from dirtying the tree.
- Deliberate break for the phase: remove the share check → the all-green case goes green-exit → red; remove the finite check →
  the no-green case exits 0 with a black image → red.

### (c) L-1 — record, line, log, proof

- Grade path: `src/ui/wornGrade.ts` `addGrade` returns false when `image.enableFilters().filters?.internal.addColorMatrix()` is
  absent. Phaser 4.2.1 `node_modules/phaser/src/gameobjects/components/Filters.js` `enableFilters` returns early when
  `!this.scene.renderer.gl`, so under Canvas `filters` stays unset and every `applyWornGrade` call returns false.
- Call sites of `applyWornGrade` (search over `src/`): exactly two, both in `src/ui/widgets/RoomView.ts`:
  - `buildWorn` (uses the result for `WornBuild.graded`) — called by `RoomView.drawWorn` (room; lays
    `ROOM_LAYOUT.worn.canvasWash` when not graded) and `RoomScene.fadeStage` (stage ghosts);
  - `drawRoomMiniature` (drops the result) — called by `RoomDoneCard` (done-card miniature) and `SalonBackdrop.render` (welcome
    and task backdrop; derives its hook-only `gradedCount` from `filters?.internal.list.length`).
- Recording inside `applyWornGrade` (one place) covers all four uses and any future caller; it touches neither
  `drawRoomMiniature`, `fadeStage`, `RoomView.render`, `SalonBackdrop.render` nor `RoomScene`, which keeps their triggered
  follow-ups unfired. Under Canvas the first record lands on the welcome or task screen (the backdrop), before the child ever
  opens the room, so the parent sees the line from the first session.
- `recordFallback` (`src/ui/artFallbacks.ts`) reads `REGISTRY_KEYS.artFallbacks` from the game registry and writes only when
  `noteFallback` (`src/core/artPick.ts`) returns a new record; `noteFallback` keeps the first mode per key. Effect: one record per
  game; a repeat call is one registry read. "Once per scene" (scope item 3) is satisfied a fortiori; no per-scene guard needed.
- Record shape: `FallbackWhere` gains `'worn'` (appended to `FALLBACK_ORDER`), mode `'ungraded'`; `DrawnFallbackWhere` becomes
  `Exclude<FallbackWhere, 'guide' | 'worn'>`; `artHealthLines` (`src/core/artHealth.ts`) pushes `{ kind: 'worn' }` after the
  `guide` line and filters `'worn'` out of the `fallback` list; `src/ui/dom/artHealthView.ts` `textOf` gets `case 'worn'`
  (`textOf` returns `string` under `strict`, so a missing case fails `tsc`). `pl.settings.artFallbackNames` needs no `worn` key.
- Parent sentence (draft, `src/data/pl.ts`, beside `guideMissing`):
  `wornPlain: 'Przeglądarka rysuje grę w prostszym trybie, więc meble przed remontem nie wyglądają na stare.'`
  True under Canvas (the room shows full-colour furniture under a light wash, miniature and backdrop show it plain — frame
  `before-canvas.png` of this research), claims no stand-in, names no fault. DESIGN-GAP: the kit has no line for it (new row).
- Renderer log: Phaser already prints its banner `Phaser v4.2.1 (Canvas | Web Audio)` as a styled `console.log` (seen in both
  runs), but nothing of the game's own. One `console.info` in `BootScene.create` (runs once per page load; `this.sys.game.renderer.type`
  against Phaser's `CANVAS`/`WEBGL`), e.g. `Renderer: Canvas (no filters: the worn salon look is off)` / `Renderer: WebGL`.
  Precedent for `console.info` lines: `src/main.ts` (room grown, salon carried) and `TaskScene` (art filter fallback).
- Canvas in headless Chromium — observed with a throwaway spec (gitignored `*.local` folder, moved out after) against
  `dist-e2e/` served on the visual port 4399 (server killed after):
  - launch args `--disable-webgl --disable-webgl2 --disable-3d-apis` → `getContext('webgl'|'webgl2')` null, Phaser banner
    "Canvas"; hook `backdrop` = `{ mode: 'salon', drawn: true, blurred: false, renderer: 'canvas', graded: 0 }`; `room.worn` =
    `{ keys: [10 pieces], graded: false }`; `artFallbacks` `{}` (the gap L-1 names); `pageerror` none; welcome, a whole task and
    the room switch worked.
  - without the args (WebGL control): `backdrop.renderer 'webgl'`, `graded: 10`, `artFallbacks` `{}`.
- Proof chosen: e2e in the `chromium-hook` project, a new spec (name added to `ROUND_SPEC` in `playwright.config.ts`, as every
  hook spec before it) with file-level `test.use({ launchOptions: { args: [...] } })` — this exercises the production
  `AUTO` → Canvas path, needs no `?e2eArt=canvas` seam and no marker change. Assertions: `artFallbacks.worn === 'ungraded'`
  after the welcome backdrop; the "Obrazki" paragraph text in the settings panel (DOM) equals `pl.settings.wornPlain`; the
  console has the renderer line. WebGL control: one added assertion in `tests/e2e/salon-style.spec.ts` (`artFallbacks.worn`
  undefined). Unit tests: `artHealthLines` kind and ordering, `noteFallback` unchanged; a source guard (like
  `tests/guideWiring.test.ts`) that `applyWornGrade` calls `recordFallback(…'worn'…)` on its false path and `BootScene.create`
  logs the renderer.

### (d) Pouf and the return button

- Data: pouf slot `src/data/rooms.ts` (`id: 'pouf'`, x 458, y 736, 278 x 218); texture `public/assets/rooms/salon/pouf.webp`
  278 x 218, alpha > 8 bounding box x 16-261, y 16-201 → painted scene rows y 752-937, columns x 474-719. Button
  `ROOM_LAYOUT.resume` (`src/data/layout.ts`) left 240, top 892, 480 x 116 → x 240-720, y 892-1008, depth above the room.
  Contact shadow (`SALON.contactShadows` pouf `widthFactor 0.95, offset [8,-6]`, `ROOM_LAYOUT.contactShadow.heightRatio`) →
  ellipse x 488-722, y 895-969 (change.md figures).
- Frame `after-empty-webgl.png` (hook build, WebGL, after the stage, 1920 x 1080): the pouf's lower quarter (46 of 186 painted
  rows) is hidden under "Wróć do notesu"; no shadow is visible; the same overlap shows before the stage (frame
  `before-canvas.png`). Hook `room.unreachable: []` (the pouf stays reachable by its hold point).
- Options: a shadow offset upward would draw a dark ellipse across the pouf's body (wrong); hiding the pouf's shadow changes
  nothing visible; moving the slot or the button is out of scope without a `[human]` row (scope item 4). Decision: DESIGN-GAP row
  (proposed 174), comment at `ROOM_LAYOUT.resume`, `[human]` row in the change's follow-ups.

## Code References

- `scripts/recolour-board.py` — `recolour`, `board_mask`, `main`, `check_versions`, `PINNED_PILLOW`, `PINNED_NUMPY`
- `scripts/make-task-art.mjs` — `BOARD_JOBS`, `ROOM_JOBS` loop, `convert` (cwebp arguments)
- `src/ui/wornGrade.ts` — `applyWornGrade`, `addGrade`
- `src/ui/widgets/RoomView.ts` — `buildWorn`, `RoomView.drawWorn`, `drawRoomMiniature`
- `src/scenes/RoomScene.ts` — `fadeStage`; `src/ui/widgets/RoomDoneCard.ts`; `src/ui/widgets/SalonBackdrop.ts` — `render`
- `src/ui/artFallbacks.ts` — `recordFallback`; `src/core/artPick.ts` — `FallbackWhere`, `DrawnFallbackWhere`, `FALLBACK_ORDER`,
  `noteFallback`
- `src/core/artHealth.ts` — `ArtHealthLine`, `artHealthLines`; `src/ui/dom/artHealthView.ts` — `textOf`, `createArtHealthView`
- `src/scenes/UIScene.ts` — the `artHealthLines({ … fallbacks … })` call; `src/scenes/BootScene.ts` — `create`
- `src/data/pl.ts` — `pl.settings.guideMissing`, `artFallback`, `artFallbackNames`
- `src/data/layout.ts` — `ROOM_LAYOUT.resume`, `ROOM_LAYOUT.worn.canvasWash`, `ROOM_LAYOUT.contactShadow`
- `src/data/rooms.ts` — pouf slot, `contactShadows`
- `playwright.config.ts` — `ROUND_SPEC`, project `chromium-hook`; `tests/e2e/salon-style.spec.ts`; `tests/e2e/support/welcome.ts`
  `openWelcome`, `openSettings`; `tests/guideWiring.test.ts` (source-guard precedent)
- `vite/e2eHookGuard.mjs` — `E2E_HOOK_MARKERS` (unchanged by the chosen proof)

## Architecture Insights

- The project's fallback channel is "record once per game in the registry, render in the parent panel"; the fox (audit-backdrop-fox
  D3) set the precedent for a record that is not a drawn stand-in getting its own line kind. `worn` follows it.
- A degraded-renderer path can be tested without a seam: Chromium launch flags push Phaser's `AUTO` into the same fallback a real
  device takes, which proves more than a forced `type: CANVAS` would.
- Local art tools guard their environment (pins) but not their output; the new guard adds output assertions without touching
  the arithmetic, so the outputs stay byte-identical.

## Historical Context (from prior changes)

- `context/archive/2026-10-24-audit-backdrop-fox/research.md` — worked example; D3 (fox gets its own line, not "gra rysuje").
- Triggered follow-ups (list in `change.md`): with the choke-point wiring and no pouf code, the fired ones are salon-style F2
  (`applyWornGrade` edited), final-art-salon F4 + salon-load-health L-6/L-8 + audit-backdrop-fox F5 (art-health files edited),
  audit-backdrop-fox F1 (a Canvas e2e now exists: it checks the record, not pixels; F1 stays open). Not fired: salon-style F4
  (`fadeStage`), final-art-salon F2 / salon-extra-slots F2 (`drawRoomMiniature`), L-R8/L-R11 (`RoomScene`), F6 / notebook-polish
  16 (`SalonBackdrop.render`), G-3 (`src/ui/artFallbacks.ts` unchanged), VO2/F5/F7 (`RoomView.render`).

## Related Research

- `context/archive/2026-10-24-audit-backdrop-fox/research.md`

## Open Questions

- None blocking. The wording of `wornPlain` and the pouf DESIGN-GAP are autonomous and go to `[human]` rows.

## Autonomous decisions

- **R1 bounds 5 %-30 %** (rejected: the audit's 5-60 %, too loose to catch a leak into the floor). Would change: a new
  background whose measured share falls near either bound.
- **R2 guard order non-finite → share**, so both refusals are CLI-reachable on synthetic images (rejected: share first, which
  makes the non-finite branch unreachable by a test). Would change: a test that imports the module instead of running the CLI.
- **R3 Python test via CLI spawn with a pin probe and a titled skip** (rejected: extracting the check to TypeScript — it would
  test a copy, not the script; adding Python to CI — scope says CI stays as it is). Would change: the maintainer adding the
  pins to CI.
- **R4 record inside `applyWornGrade`** (rejected: changing `drawRoomMiniature` to return the result and each caller recording —
  four edits, more triggered follow-ups, same record). Scope item 3's "`drawRoomMiniature` stops ignoring the result" is met in
  effect: the result of every grade call, the miniature's included, is now recorded. Would change: a plan-review or maintainer
  reading that requires `drawRoomMiniature` itself to return the flag (then add it, keeping the record in `applyWornGrade`).
- **R5 own line kind `worn`, mode `ungraded`** (rejected: joining `DrawnFallbackWhere`). Would change: maintainer preferring one
  combined sentence.
- **R6 e2e by Chromium launch flags, no seam** (rejected: `?e2eArt=canvas` forcing `type: CANVAS` in `src/main.ts` — more code,
  tests a path no device takes). Would change: a Chromium update where the flags no longer disable WebGL (the spec then fails
  loudly on `backdrop.renderer`).
- **R7 renderer `console.info` in `BootScene.create`** (rejected: `src/main.ts`, where the renderer is not yet created). Would
  change: nothing known.
- **R8 pouf: DESIGN-GAP row, no code** (rejected: shadow offset — draws on the pouf; slot/button move — needs `[human]`). Would
  change: the maintainer choosing to move the pouf slot or the button.
