---
date: 2026-10-14T01:40:38+02:00
researcher: Claude (autonomous run 2026-10-13-s12-s14, research step)
git_commit: dcb3d0bbffa339a6852efcacf63a9745cc0912ae
branch: feat/art-tasks-all-stages
repository: Martynka-urzadza
topic: "S-14 art-tasks-all-stages: first raster art (money, scale, jugs, thermometer, icons), answer modes for negative and decimal values, MONEY_PAY drag, curriculum and e2e effects of newly playable steps"
tags: [research, tasks, assets, pwa, BootScene, widgets, drag, curriculum, e2e, nouns, save]
status: complete
last_updated: 2026-10-14
last_updated_by: Claude (autonomous run, research step)
---

# Research: S-14 art-tasks-all-stages

**Git Commit**: `dcb3d0b` · **Branch**: `feat/art-tasks-all-stages` · Research only, no product code changed.
Anchors are file + symbol (run contract: no line numbers). `docs/zrodla/` was not read. `lessons.md` in
`context/foundation/` does not exist (checked), so no lesson applies. Three read-only workers covered
(A) asset loading / PWA / conversion / Phaser composition / thermometer face, (B) task model, answer modes, drag,
layout, (C) curriculum, tests, e2e, save; nouns and the validator were read in the main context.

## Research Question

From `change.md` (scope, three unknowns, triggered follow-ups, proposed S-14b/c/d split): what does the code need so
that S-14 can ship pack-A art tasks (MONEY_COUNT, MONEY_CHANGE, MONEY_PAY, MASS, CAPACITY, TEMPERATURE, COUNT,
MULT_GROUPS) plus data-only use of S-13 widgets in E1/E2/E5/E6, within ≤ ~10 small phases? Settle: the first image
load and its precache proof; the WebP pipeline; answer modes for negative temperatures and money; whether `blockDrag`
generalises to coins; which steps become playable and which tests pin step order; e2e runtime; Polish nouns and
agreement for the new units; save format v1.

## Summary

1. **Images.** Nothing raster exists yet: `src/scenes/BootScene.ts` `BootScene.preload` loads only the font
   (`FONT_URL` in `src/data/layout.ts`), and `public/assets/` does not exist. The image batch goes in the same
   `preload`, driven by a data table (proposed `src/data/taskArt.ts`: key `tasks/<group>/<id>`, url
   `assets/tasks/<group>/<id>.webp`, plus manifest metadata). The precache glob in `vite/config.shared.mjs`
   (`globPatterns` includes `webp`, `maximumFileSizeToCacheInBytes` 10 MiB) already covers it, Caddy needs nothing
   (`deploy/Caddyfile`: only `/_app/*` immutable). A failed image load is **silent, not fatal** (no `loaderror`
   listener in `src`; `installErrorBoundary` ignores resource loads) and renders Phaser's `__MISSING` texture.
   **Gap:** `tests/e2e/seed.spec.ts` would still pass offline if an asset were missing from the precache (a failed
   request emits `requestfailed`, not `response`); the plan must add an assertion.
2. **Pipeline.** Local `cwebp` 1.1.0 is present (`/usr/local/bin`), no WebP-capable npm dependency exists; two runs of
   the same command give the same bytes. Recommended: `scripts/make-task-art.mjs` (`npm run art`), modelled on
   `scripts/make-icons.mjs`, outputs committed, CI never needs `cwebp`. Sizes ≤ 2× display: icons/coins/weights/jugs
   256², notes 384×256, scale 512×384, thermometer frame 256×768 → ≈ 0.5 MB in total.
3. **Answer modes.** Answers may be strings (`round.ts` `isCorrect`), tiles show `String(value)` (`AnswerTiles`), the
   keypad has no minus or comma (`src/core/round/keypad.ts` `KeypadKey`) and the keypad retype phase makes a negative or
   decimal keypad answer impossible to enter. `validate.ts` `validateTask` rejects negative answers, negative choices
   and minus-led text (`NEGATIVE_NUMBER`), so TEMPERATURE needs a validator exemption. **Recommendation (confirms
   change.md decision 5):** negative temperatures and amounts with grosze as **string tiles** generated with their own
   `choices` (`"−5 °C"`, `"3 zł 40 gr"`), whole złote / positive degrees as number tiles (E1, E2) or keypad (E3+).
   E1 stays tiles-only (maintainer decision in `src/data/curriculum/E1.ts` header, pinned by `tests/generateTask.test.ts`
   "E1 numeric skills are tile skills, and E1 has no keypad skill").
4. **MONEY_PAY.** The `stepBlockDrag` reducer logic is kind-agnostic and could become generic, but `dragLayout`
   (one mat column per kind, 3-cell grid) does not fit 6–9 denominations, `TaskScene` drag wiring, `BlockMat`,
   `pl.round.trayLabels`, and the e2e helpers (`tests/e2e/support/hook.ts` `buildOnMat`, `Snapshot.mat`,
   `Targets.drag`) are hard-wired to blocks; a money skill reusing `input: 'drag'` would be answered as blocks and fail
   random specs. MONEY_PAY therefore needs its own layout, `Wallet` widget, a drag variant dispatch, hook targets and
   helper branches (≈ 2 phases + e2e risk). **Scope decision: drop MONEY_PAY from S-14** (first cut, as change.md
   decision 2 foresaw) → follow-up / S-14d.
5. **Curriculum.** A step is playable iff it has ≥ 1 playable skill (`curriculum.ts` `playableSteps`). Filling E1.8,
   E1.10, E2.2, E2.8, E5.5 shifts `calendarStart` for E1 (Nov 5→6, Dec 7→8, Jan 11→10), E2 (Feb 3→2, Mar 4→3,
   Jun 10→9; ahead-stage floor 3→2) and E5 (Oct 3→4); unlocks stop at the new steps; E2 warm-ups gain E2.2 money tasks.
   Six test files pin today's order (list in § 5).
6. **E2E.** Every spec answers through `answerRight`/`answerWrong`; new string-tile skills are answered generically
   (tap the tile equal to the answer), so they add no helper work; only a new drag variant would. `adaptive.spec`
   (180 s, E4) draws from E4.1 and all of E3 — new tile/keypad skills there dilute the drag share and do not slow it.
7. **Nouns.** `src/data/nouns.ts` has `złoty`, `grosz`, `talerz`, but not `litr`, `kilogram`, `dekagram`, `stopień`,
   `moneta`, `banknot`, `odważnik`, `dzbanek`, `lampa`, `klucz`, `kłębek`, `czajniczek`. `pluralCategory` throws on
   negatives (agree on the absolute value). Decimals ("2,5 litra") trip `NUMBER_WORD` ("5 litra"): use unit
   abbreviations on screen and words only in `speak`.
8. **Save v1 stays.** `SAVE_VERSION = 1`; `validLearner` checks shapes only; fixtures use made-up skill ids and pass.
9. **Scope:** S-14 = 9 phases without MONEY_PAY (§ 9). The S-14b/c/d split in change.md is confirmed, with MONEY_PAY
   added to S-14d (or its own item).

## Detailed Findings

### 1. First image load (BootScene, PWA, offline proof)

- `src/scenes/BootScene.ts` `BootScene.preload`: `this.load.font(FONT_KEY, FONT_URL, 'truetype', …)` only; `create`
  has the e2e-only forced `'boot'` failure and `time.delayedCall(0, …)` → `scene.start(welcome | task)`. The loader
  completes every queued file before `create`, so `this.load.image(key, url)` calls in `preload` make every texture
  available to `TaskScene` with no lazy chunk (CLAUDE.md precache rule).
- Paths: `vite/config.shared.mjs` `base: '/'`, `build.assetsDir: '_app'`; `public/` is copied verbatim to `dist/`,
  so `public/assets/tasks/money/coin-1zl.webp` is `/assets/tasks/money/coin-1zl.webp` and Phaser url
  `assets/tasks/money/coin-1zl.webp` (same relative style as `FONT_URL`).
- Key naming, `Martynka-urzadza.md` § 10: "`tasks/icons/<nazwa>.png`, `tasks/money/<nominal>.png` … klucze ramek =
  ścieżki bez rozszerzenia"; "Pomoce | PNG lub rysowane w kodzie". So key = `tasks/money/coin-1zl`,
  `tasks/measuring/thermometer-frame`, `tasks/icons/apple`. Deviations to record: WebP instead of PNG, loose files
  instead of an atlas (atlas is M7), `measuring/` folder by analogy.
- Errors: no `loaderror` listener in `src`; `src/ui/dom/errorBoundary.ts` `installErrorBoundary` documents that
  "failed resource loads do not count"; `src/core/errorSignal.ts` `isFatalSignal` never sees them. Recommended: a
  `loaderror` warn in `BootScene` and widgets falling back to a drawn placeholder when `scene.textures.exists(key)` is
  false — non-fatal, consistent with "no fail states".
- PWA: `vite/config.shared.mjs` `pwaOptions.workbox.globPatterns` = `**/*.{js,css,html,png,webp,ogg,m4a,woff2,ttf}`,
  `maximumFileSizeToCacheInBytes` = 10 MiB, `clientsClaim`, `skipWaiting`, `cleanupOutdatedCaches`. WebP is covered.
- Caddy: `deploy/Caddyfile` `@immutable path /_app/*` is the only immutable rule; `/assets/*` gets defaults;
  Go's MIME table maps `.webp`. No `deploy/` change (and the run forbids one).
- `scripts/check-deploy.ts` + `scripts/deploy-check/parse.ts` `compareBundles(bundlesFromHtml, precacheFromSw)` checks
  `/_app/*` bundles only — assets are not checked. Optional: a pure helper asserting the precache lists
  `/assets/tasks/` entries.
- `tests/e2e/seed.spec.ts` (project `chromium`, production build on 4398): offline reload asserts same `data-build`,
  visible canvas, `servedByNetwork` = `[]`, `servedBySw` contains `/`, ≥ 2 `/_app/*.js` from the SW. It does not
  enumerate the precache. **A non-precached asset would fail with `requestfailed` and the spec stays green.** Plan:
  collect `requestfailed` (expect `[]`) and assert `servedBySw` contains the `/assets/tasks/**.webp` urls (at least
  one per folder, or all of the data table).

### 2. Conversion pipeline and sizes

- `scripts/make-icons.mjs`: pure-Node PNG encoder (own CRC32 + `zlib.deflateSync`), deterministic, outputs committed,
  `"icons": "node scripts/make-icons.mjs"` in `package.json`.
- ESLint (`eslint.config.mjs`): `**/*.mjs` get `js.configs.recommended` + Node globals (untyped, no boundary rules);
  `designs/**` ignored. A new `.mjs` script fits without config changes.
- Encoders: `cwebp` 1.1.0 at `/usr/local/bin/cwebp`; no `sharp`/`@jsquash`/`pngjs`/`canvas` in `package.json` or
  `node_modules`; ImageMagick absent. Same command twice → identical SHA (worker A, observed).
- Recommended: `scripts/make-task-art.mjs` reads the kit's `manifest.json`, shells out to `cwebp -resize W H -q 85
  -alpha_q 100 -m 6`, fails with a clear message when `cwebp` is missing; outputs committed to
  `public/assets/tasks/{money,measuring,icons}/`. Rejected: a WASM encoder dependency (weight, complexity for a one-off
  conversion). `designs/` stays gitignored; only outputs are staged.
- Sources (`designs/martynka-maths-A-v1/assets`, PNG with alpha): icons 12 × 512², coins 9 × 512², notes 6 × 768×512,
  balance scale 1024×768, weights 6 × 512², containers 3 × 512², thermometer-frame 512×1536.
- Manifest metadata: money `valueGrosze` (1 … 50000), `moneyUnits.groszePerZloty` 100; weights `grams`
  (100, 200, 500, 1000, 2000, 5000); containers `millilitres` 1000/500/250, `sharedVisibleRect [32, 78, 448, 356]`;
  thermometer `minCelsius −30`, `maxCelsius 30`, `scaleMapping { yForMinus30: 1260, pixelsPerDegree: 16 }`;
  scale `emptyPans: true`. These belong in `src/data/` (content as data); geometry scaled by the output factor.
- Measured WebP (q85, m6): apple 256 px 9.5 KB, coin-1zl 256 px 12 KB, note-100zl 384×256 13 KB, balance-scale
  512×384 28 KB, thermometer-frame 256×768 14 KB. Whole set at the proposed sizes ≈ 0.5 MB (change.md measured
  331 KB for money + measuring at ½ resolution; both far under 10 MiB).
- Filtering: `src/main.ts` `createGame` sets no `antialias`/`pixelArt`/`mipmapFilter` → LINEAR, no mipmaps; notes
  and the thermometer are not power-of-two, so mipmaps would not apply anyway. Pre-downscaling to ≤ 2× display size is
  the fix for shimmer. Picture rects are ≤ 768×378 scene px (§ 4), so the sizes above hold.

### 3. Phaser composition and the thermometer face

- Widgets do not use Containers: each owns `scene.add.graphics()` + `scene.add.text(...)`, toggled by `setVisible`,
  drawn in absolute scene coordinates fitted to a `Rect` (e.g. `ClockFace.render` scale `min(w, h) / (2·DIAL.outer +
  border)`). `src/ui/widgets/TaskPicture.ts` dispatches on `TaskVisual.kind`; `bounds()` feeds the e2e hook.
- An image widget follows the same pattern: create once `scene.add.image(0, 0, key).setVisible(false)`, then in
  `render` `setTexture(key).setPosition(cx, cy).setDisplaySize(w, h).setVisible(true)` (Phaser 4.2.1 `Image` has
  `Components.Size.setDisplaySize`; checked in `node_modules/phaser` types, context7 not queried). Keep aspect from
  the data table's pixel size. Draw order = creation order or `setDepth` (thermometer: frame image first, Graphics
  face after).
- `designs/martynka-maths-A-v1/reference/thermometer-face.js` `drawThermometerFace(ctx, celsius)` in 512×1536 frame
  space: `y(v) = 1260 − (v + 30)·16`; tube `roundRect(178, 286, 34, 1040, r17)` fill ink @ alpha 0x20, stroke ink 4 px;
  liquid `roundRect(184, y(c), 22, 1322 − y(c), r11)` turquoise; bulb `arc(195, 1334, r34)` turquoise + ink stroke;
  ticks per integer from x 220 to 246 (×10, 4 px) / 239 (×5) / 231; labels every 10 at (301, y+17) with U+2212 minus
  and `+` signs; "°C" at (274, 222) bold 50 px. Colours: ink `#245C59`, liquid `#54BEB4`. Port: Graphics
  `fillRoundedRect`/`strokeRoundedRect`/`fillCircle`/`lineBetween` + Text with `setOrigin(0.5)`, coordinates scaled by
  (output factor × fit scale). Colours enter `src/data/layout.ts` as tokens (profile § 6). At a 294 px tall picture
  (tiles mode) the scale is ≈ 4.5 px/°C: ticks every 2 °C at best, labels every 10.

### 4. Task model, visual kinds, layout

- `src/core/tasks/types.ts` `Task`: `answer: number | string | number[]`, `choices?: (number|string)[]`,
  `visual?: TaskVisual`, `input?: AnswerMode`, `check?`, `speak?`, `hint`. `src/core/tasks/visual.ts` `TaskVisual` =
  `clock | ruler | blocks | bars`.
- Adding a kind touches: `visual.ts` `TaskVisual`, `visualKey` (exhaustive; feeds `src/core/round/unique.ts`
  `distinctTasks` and `tests/contentInvariants.test.ts`), `validateVisual` (non-exhaustive switch: a missing case
  compiles and goes unchecked — the plan should make it exhaustive), `describeVisual` (exhaustive; `scripts/sample.ts`),
  `src/ui/widgets/TaskPicture.ts` (field, constructor, `drawn` map, `render` switch, `hide`, widget `shown()` for
  `bounds()`), `tests/visual.test.ts`. `validateTask`, `roundView` and `TaskScene.render` are kind-agnostic.
- Narration: `src/core/narration/spoken.ts` `spokenTask` reads `task.speak ?? task.prompt` and never describes the
  picture; `glyphsToWords` maps `−` to "minus" but not `°C`, `zł`, `gr`, `kg`, `dag`, `l`. Pictured tasks need a
  `speak` with words ("minus 5 stopni", "2 złote 50 groszy").
- Layout (`src/data/layout.ts` `TASK_LAYOUT`, 1920×1080): `picture.tiles` 661,396 600×294; `picture.tilesSolution`
  picture 236,396 624×294; `picture.keypad` 236,470 768×378; `picture.keypadSolution.picture` 236,470 **768×190**
  (lines 236,668 768×180); select falls back to the tiles rect, overlapping `select.top` 600 by ≈ 90 px; drag has no
  picture rect (mat 236,380 944×460, tray 1240,380 440×300).
  - Fit: 4:3 scale gets 392×294 (tiles), 504×378 (keypad), **253×190 (keypad solution)**; 1:3 thermometer gets
    98×294, 126×378, **63×190 (unreadable)**; a coin row fits everywhere.
  - **O2 is triggered:** MASS/CAPACITY/TEMPERATURE on the keypad (E3+) need a `keypadSolution` variant with picture
    left (≈ 236,470 240×378) and lines right (≈ 500,470 504×378), or an aspect-aware `pictureLayout`.
  - The `pictureLayout` select/drag follow-up is **not** triggered if no select/drag skill gets a picture (true once
    MONEY_PAY is out and MASS heavier/lighter uses tiles).
- Three identical rect types: `src/core/round/dragLayout.ts` `Rect` (+ `insideRect`, `interiorPoint`),
  `src/core/round/pictureLayout.ts` `PictureRect`, `src/ui/widgets/geometry.ts` `Rect`. Unify in core (ESLint: core may
  not import ui), ui re-exports. Trigger "next change to dragLayout or pictureLayout" fires with the O2 change to
  `pictureLayout`.

### 5. Answer modes, negative values, money

- Mode: `generateTask` stamps `input = skill.answer`; `pick.ts` `playable` accepts tiles/keypad/select/drag with a
  registered generator; number tiles are auto-added (`numberChoices`, `balance.tiles.count` 4) only for number answers
  without generator choices; string answers need generator `choices` (as `clock.ts` `timeChoices`).
- Tiles render `String(value)` (`AnswerTiles`, `SelectTiles`) with a shared shrink to the 254 px tile; a number −5
  would show "-5" (hyphen) and 2.5 "2.5" — hence string answers. Readability of "12 zł 50 gr" after the shrink was not
  measured (visual gate).
- Keypad: `KeypadKey` digits, `delete`, `ok`; submits `Number(buffer)`, `balance.keypad.maxDigits` 7; no unit suffix;
  in the solution phase a keypad task is retyped, so negatives/decimals cannot be entered.
- Validator and hints that break on negatives/strings: `validate.ts` (`answer < 0`, negative `choices`,
  `NEGATIVE_NUMBER`, `range` 0..max); `src/core/round/hints.ts` `lastNumber` ignores the minus (solution "Wynik: -5"),
  `leaksAnswer` checks string answers only for `TIME_TEXT`; `tests/contentInvariants.test.ts` "string answer in the
  last hint" only for `CLOCK`. Plan: a type-scoped negative allowance (e.g. `ValidationContext.allowNegative` set by the
  sample/test harness for TEMPERATURE), a generic string-answer leak check, and the invariant widened to every string
  answer.
- Recommendation per type:
  - TEMPERATURE E3.11 (−30…+30) and E6.1 (negatives, differences): string tiles `"−5 °C"` (U+2212); differences as
    number tiles/keypad (non-negative). E5.4 (0–30): keypad.
  - MONEY_COUNT/CHANGE: E1.11, E2.2 whole złote → number tiles (E1 rule; E2 may use keypad); E2.8 grosze ≤ 1 zł →
    number in grosze with unit in prompt ("Ile groszy?"); E4.1 zł + gr → string tiles `"3 zł 40 gr"` (school
    notation; "3,40 zł" from E5). Internal values in grosze as integers.
  - MASS at balance: keypad/tiles with unit in prompt (kg or dag); ½ kg as string tile or "ile dekagramów?" (50).
  - CAPACITY: ½ l, ¼ l as string tiles or as counts ("ile szklanek/dzbanków ½ l?" → integer).
  - COUNT: tiles (3 tiles per ZADANIA, generator `choices`); MULT_GROUPS: tiles (number, or string "3 · 4").
  - Rejected: adding `−`/`,` keys to `Keypad` (shared component for all stages, not in the kit).

### 6. Drag and MONEY_PAY

- `src/core/blockDrag.ts`: `BlockKind = 'hundred'|'ten'|'one'`, `Mat = Record<BlockKind, number>`,
  `stepBlockDrag(state, event, geo, rules)` (down/move/up/cancel/reset; `geo` injected; `rules` from
  `balance.blockDrag` `{startDistance: 12, maxPerKind: 9}`); target not checked in the reducer — `BlockMat` OK submits
  `matValue` (100·h + 10·t + o).
- `src/core/round/dragLayout.ts` `dragLayout(spec, kinds)`: one mat column per kind, `columns × ceil(maxPerKind/
  columns)` grid. With 6–9 denominations the 944 px mat gives ≈ 35–50 px cells — too small for coins.
- `TaskScene`: `create` feeds pointer events to `feedDrag`; `pointerupoutside`/`wasCanceled` → `cancel`; `render`
  calls `dragKinds(task.answer)` → `dragLayout(TASK_LAYOUT.drag, kinds)` → `blockMat.setLayout`; labels from
  `pl.round.trayLabels`.
- E2E: `tests/e2e/support/hook.ts` `answerRight`/`answerWrong` branch on `snapshot.input`; drag → `buildOnMat`
  (hundred/ten/one split) then `drag.ok`; `Snapshot.mat`, `Targets.drag` typed by `BlockKind`. `src/core/round/pick.ts`
  header: helpers must handle a mode before `playable` lists it.
- Verdict: generic reducer feasible (`stepBlockDrag<K>` with a value function), but MONEY_PAY also needs a wallet
  layout, `Wallet` widget, a drag-variant dispatch in `TaskScene`, hook targets, helper branches, and the "fewest coins"
  variant needs a non-number input + `check` (and `round.ts` `captureFirstWrong` records only number/string input).
  Pinned by `tests/blockDrag.test.ts` (~20 cases), `tests/dragLayout.test.ts`, e2e `drawn-tasks.spec.ts`
  (`E3.6.place_build_30`) and `adaptive.spec` (`E4.1.place_build_100`). **Out of S-14.**

### 7. Curriculum effects of the newly playable steps

- Playable step = ≥ 1 playable skill (`src/core/curriculum.ts` `playableSteps`, `src/core/round/pick.ts`
  `firstPlayableSteps`); `childName` does not decide it, but `tests/curriculum.test.ts` "child-facing step names"
  requires one on every playable step (≤ 28 chars, capital, no dot, distinct per stage) and forbids it elsewhere.
- `calendarStart` (rule D) picks the k-th playable step, k = min(n, max(2, ceil(progress·n))): positions shift.
  Measured by worker C with a throwaway script (dummy skill in E1.8, E1.10, E2.2, E2.8, E5.5; scratchpad only):
  E1 Nov 5→6, Dec 7→8, Jan 11→10; E2 (calendar stage, spring) Feb 3→2, Mar 4→3, Jun 10→9; E2 ahead-stage floor 3→2;
  E5 Oct 3→4. Behind-stage starts (last playable step) unchanged. `floorToCalendar` = max(saved, floor) raises loaded
  E1 (Nov/Dec) and E5 (Oct) learners by one step; drops never lower a save.
- `skillBuckets`: for a child past a new step its skills join "earlier" (30 %, 50 % eased) at mastery 0 and the
  "previous" bucket (10 %) of the next stage; `unlockReady` checks only the current step, so nothing blocks.
- `unlockReady` now stops at the new steps: E1 7→8 and 9→10, E2 1→2 and 7→8, E5 4→5 ("Nowa umiejętność!" card).
- Warm-up `src/core/round/warmup.ts` `buildWarmup`: current half = `firstPlayableSteps(stage, 2)` → E2 becomes steps
  1 and 2 (E2.2 money in E2 warm-ups); previous half gains E1.8/E1.10 (E2), E2.2/E2.8 (E3), E5.5 (E6).
- Unlock threshold `ceil(0.5·n)` (`balance.curriculum.unlockShare`) rises for E2.1 (1→2 skills: still 1), E4.1 (4→5:
  2→3), others similarly; practice spreads over more skills, so unlocks from these steps are slower (PR note, as S-13).
- Still empty after S-14: E1.1, E5.12, E6.2, E6.3, E6.11.

### 8. Tests and specs to update

- `tests/curriculumStart.test.ts`: `playableSteps` (E1 `[2..11]`, E2 `[1..10]`, E5 `[1..11]`) and `ORACLE` rows
  E1 age 6 `[3,4,6,8,10,11]`, E2 age 7 `[2,3,5,7,9,10]`, E5 age 9 `[2,4,6,8,10,11]` (hand arithmetic in a comment,
  as S-13 P6). These assume E1.1, E5.12, E6.2, E6.3, E6.11 stay empty.
- `tests/curriculumPick.test.ts`: "unplayable unlocked step falls back…" on E5 step 5 → move to E5.12 or E6.3.
- `tests/curriculumEnd.test.ts`: data pin `skillIds('E2', 1)` length 1; the E2.1→3 tests (→2); "E5 step 4 leads to
  step 6" (→5) and the E5 unlocked 5 test → move to E6.
- `tests/progress.test.ts`: the E5 step 5 test (index, total 11).
- `tests/generateTask.test.ts`: E1 tiles-only pin (keep: every new E1 skill is tiles).
- `tests/curriculum.test.ts`: five `childName`s.
- `tests/pick.test.ts`, `isPlayable` in `curriculumPick.test.ts`: only if a mode is added (not with MONEY_PAY out).
- E2E: `first-launch.spec.ts` (E2 drop round, warm-up pools), `adaptive.spec.ts` (E4.1 and E3 pools), every
  `passWelcome` spec (E3 step 11: earlier = all E3, previous = all E2) — re-run, no edits expected while all new skills
  are tiles/keypad. New `?e2eSkills` specs for E1/E2/E5 skills must use `passWelcomeAsParent` with that stage
  (`tests/e2e/support/welcome.ts`); `src/testing/e2eHook.ts` `forcedSkills` silently returns null for an id outside
  the current stage.

### 9. E2E runtime

- `playwright.config.ts`: webServer timeouts 180 s, CI retries 2 / workers 1, no global test timeout; projects
  `chromium` (seed) and `chromium-hook` (round specs on 4397). `adaptive.spec.ts` `test.setTimeout(180_000)`, E4 age 8
  September, up to `MAX_ROUNDS = 12` rounds of `playRoundRight` until `pendingUnlock` 3.
- Follow-up in `context/archive/2026-10-13-drawn-widget-tasks-e3-e4/follow-ups/review-fixes.md`: ≈ 1.8 min under
  load (37 s alone); "Trigger: a timeout of adaptive.spec, or the next change adding `drag` skills to E4" — **not
  triggered** by the S-14 scope (no drag skills; new E4.1/E3 skills are tiles/keypad, which lower the drag share).
- New e2e work: extend `drawn-tasks.spec.ts`-style coverage with one spec per new picture kind (forced via
  `?e2eSkills`), plus the seed offline asset assertion. Each new spec adds tens of seconds; keep it to one task per kind.

### 10. Polish nouns and agreement

- `src/core/text/plural.ts` `pluralCategory` throws `RangeError` on negatives → agree on `Math.abs` ("minus 5
  stopni", "minus 2 stopnie", "minus 1 stopień").
- `src/data/nouns.ts` has `złoty ['złoty','złote','złotych']`, `grosz ['grosz','grosze','groszy']`, `talerz`,
  `jabłko`, `gruszka`, `rogalik`, `książka`, `kredka`, `filiżanka`, `kwiatek`, `poduszka`, `ciastko`, `pudełko`.
  Missing (forms to add if used in prompts, with accusative in the context): `litr` (litr/litry/litrów),
  `kilogram` (kilogram/kilogramy/kilogramów), `dekagram` (…/dekagramy/dekagramów), `stopień` (stopień/stopnie/stopni),
  `moneta` (moneta/monety/monet, acc. monetę), `banknot` (banknot/banknoty/banknotów), `odważnik`
  (odważnik/odważniki/odważników), `dzbanek` (dzbanek/dzbanki/dzbanków), icons `lampa` (lampa/lampy/lamp, acc. lampę),
  `klucz` (klucz/klucze/kluczy), `kłębek` (kłębek/kłębki/kłębków), `czajniczek` (czajniczek/czajniczki/czajniczków).
  Kit labels "Ołówek"/"Ciasteczko" yield to the dictionary (`kredka`, `ciastko`) per contract.
- `validate.ts` `NUMBER_WORD` = `(${NUMBER_SOURCE})\s+(\p{L}+)`, `NUMBER_SOURCE` has no comma: "2,5 litra" is read as
  "5 litra" → false inflection violation. Fractions take the genitive singular ("pół litra", "ćwierć kilograma",
  "2,5 kilograma"): on screen use abbreviations (`l`, `kg`, `dag`, `zł`, `gr`, `°C`; not in the dictionary, never
  checked) and "pół"/"ćwierć" forms; spell out units only in `speak`. Whole amounts in words follow the 3-form rule
  ("22 złote", "12 złotych", "5 groszy").
- `ACCUSATIVE_ONE` (ma/miał/kupił/za/… 1 X): "za 1 złoty" (masc., same form) is fine; feminine `moneta` → "1 monetę".

### 11. Save format

- `src/core/save.ts` `SAVE_VERSION = 1`; `SavedLearner` (`src/core/types.ts`): `unlockedStep: Record<StageId,
  number>`, `mastery`/`streak` keyed by skill id, `history` by skill id, `pendingUnlock {stage, step} | null`.
  `validLearner` checks shapes only; `tests/fixtures/save-v1.json` uses made-up ids (`E3.add.100`) and loads in
  `tests/save.test.ts`, `tests/saveFile.test.ts`, `tests/autosave.test.ts`. New skills/steps need **no migration**;
  the only load effect is `floorToCalendar` (§ 7). Confirms change.md decision 6.

## Code References

- `src/scenes/BootScene.ts` `BootScene.preload` / `create` — font load, scene start; image batch goes here.
- `vite/config.shared.mjs` `pwaOptions.workbox` — `globPatterns` (webp), `maximumFileSizeToCacheInBytes`.
- `deploy/Caddyfile` `@immutable` — only `/_app/*` immutable (read only; no change).
- `tests/e2e/seed.spec.ts` — offline check without asset enumeration.
- `scripts/make-icons.mjs` — deterministic committed-output model; `scripts/check-deploy.ts`, `scripts/deploy-check/parse.ts` `compareBundles`.
- `src/core/tasks/visual.ts` `TaskVisual`, `visualKey`, `validateVisual`, `describeVisual`.
- `src/ui/widgets/TaskPicture.ts` — kind dispatch, `bounds()`.
- `src/core/tasks/validate.ts` `validateTask`, `NEGATIVE_NUMBER`, `NUMBER_WORD`, `ACCUSATIVE_ONE`.
- `src/core/round/hints.ts` `lastNumber`, `leaksAnswer`; `src/core/round/keypad.ts` `KeypadKey`.
- `src/core/blockDrag.ts` `stepBlockDrag`, `BlockKind`; `src/core/round/dragLayout.ts` `dragLayout`, `Rect`.
- `src/core/round/pictureLayout.ts` `pictureLayout`, `PictureRect`; `src/data/layout.ts` `TASK_LAYOUT.picture`.
- `src/core/curriculum.ts` `playableSteps`, `calendarStart`, `floorToCalendar`, `skillBuckets`, `unlockReady`.
- `src/core/round/warmup.ts` `buildWarmup`; `src/core/round/pick.ts` `playable`, `firstPlayableSteps`.
- `src/testing/e2eHook.ts` `e2eSkills`, `forcedSkills`; `tests/e2e/support/hook.ts` `answerRight`, `buildOnMat`.
- `src/core/text/plural.ts` `pluralCategory`; `src/data/nouns.ts` `nouns`; `src/core/narration/spoken.ts` `spokenTask`.
- `src/core/save.ts` `SAVE_VERSION`, `validateSave`.
- `designs/martynka-maths-A-v1/reference/thermometer-face.js` `drawThermometerFace`; `manifest.json` (read-only kit).

## Architecture Insights

- Content-as-data holds: art keys, manifest metadata (grosze, grams, ml, thermometer mapping) and colours belong in
  `src/data/`; generators stay pure and emit `TaskVisual` with numbers/ids only; widgets map ids to texture keys.
- New visual kinds are cheap in core (four switches in `visual.ts`) and one widget each; the cost sits in layout
  (O2) and in any new input mode (drag variant), which ripples into the e2e helpers.
- String tile answers are the established escape hatch for non-integer/negative answers (CLOCK precedent).

## Historical Context (from prior changes)

- `context/archive/2026-10-13-drawn-widget-tasks-e3-e4/` (S-13): `TaskVisual`, `Task.input`, select/drag; plan P6
  recomputed `ORACLE` by hand and moved "unplayable step" tests onto E2.2/E5.5 — **those steps are now filled by S-14,
  so the tests move again** (supported). Its follow-ups O2, `pictureLayout` select/drag overlap, three Rect types,
  `pointerupoutside`, adaptive.spec timing are assessed above.
- `change.md` decisions: 1 (split) supported with MONEY_PAY moved out; 2 (MONEY_PAY first to cut) — triggered;
  3 (WebP, ½ res, committed, no atlas) supported, sizes refined to ≤ 2× display; 4 (MASS level only) supported by the
  kit README; 5 (tiles for negatives / zł+gr) supported; 6 (no migration) supported.

## Related Research

- `context/archive/2026-10-13-drawn-widget-tasks-e3-e4/research.md` — S-13 widget and answer-mode research.

## Autonomous decisions (research step)

1. **Drop MONEY_PAY from S-14** (follow-up, proposed into S-14d or its own slice). Rejected: generic reducer + wallet
   in S-14. Why: needs a new layout, widget, drag-variant dispatch, hook targets and helper branches, and a non-number
   input for "fewest coins" — ≈ 2 phases plus e2e risk to all specs that answer through `answerRight`. Would change:
   the plan finds phase budget left after P1–P9, or the maintainer asks for it.
2. **Answer modes**: string tiles for negatives and zł+gr amounts, number tiles in E1, keypad from E3 for whole units;
   `Keypad` unchanged. Would change: a teacher read finds E5/E6 tiles too guessable → split question ("ile stopni
   poniżej zera?") rather than keypad keys.
3. **Pipeline**: local `cwebp` script with committed outputs, sizes ≤ 2× display. Would change: the maintainer wants
   CI to regenerate assets (then a WASM encoder dependency).
4. **Missing images non-fatal** with a drawn fallback. Would change: a decision to treat missing art as a build-time
   failure (could be added as a unit test over the data table vs `public/assets/`).

## Proposed S-14 phases (input for `/10x-plan`)

1. Core: visual kinds `money`, `scale`, `jugs`, `thermometer`, `icons` in `visual.ts` (exhaustive `validateVisual`),
   money/measure formatting (grosze → "3 zł 40 gr"), validator negative allowance + string-answer leak check, unified
   `Rect` (tdd).
2. Assets: `scripts/make-task-art.mjs`, `public/assets/tasks/**`, `src/data/taskArt.ts`, `BootScene` load +
   `loaderror`, unit test data table ↔ files, seed spec offline assertion (impl + e2e request).
3. MONEY_COUNT + MONEY_CHANGE + `MoneyTable` (E1.11, E2.2, E2.8, E4.1).
4. MASS + `BalanceScale` (E1.11, E2.8, E3.4, E4.1, E5.5).
5. CAPACITY + `Jugs` (E2.2, E4.7, E5.5).
6. TEMPERATURE + `Thermometer` + O2 `keypadSolution` picture-left layout (E3.11, E5.4, E6.1).
7. COUNT + MULT_GROUPS + `IconGroups` (E1.2, E1.4, E1.10, E3.9) + nouns.
8. S-13 widget data (CLOCK E1.11/E2.10, DATA E2.10, LENGTH E1.8/E2.8/E5.7, PLACE_VALUE E1.10/E2.1/E2.9/E6.5),
   five `childName`s, curriculum test pins (§ 8).
9. E2E per picture kind (`?e2eSkills`, `passWelcomeAsParent` for E1/E2/E5) + visual gate + full suite timing.
   If the budget is tight, drop next: CAPACITY ¼ l / E5.5 extras, then E6.1 differences.

## Open Questions

- Readability of long string tiles ("12 zł 50 gr") after the shared shrink in `AnswerTiles` — visual gate.
- How iPad Safari's Polish voice reads "°C"/"zł" — avoided by `speak` text; not verified.
- Whether the `check:deploy` asset check is worth adding (optional; not a CI gate today).
