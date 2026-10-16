<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: P2 art from the salon-v2 pack (S-16c `final-art-p2`)

- **Plan**: context/changes/final-art-p2/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
- **Date**: 2026-10-16
- **Verdict**: APPROVED (after the review fixes below)
- **Findings**: 0 critical, 4 warnings, 5 observations

Reviewed on `feat/final-art-p2` at `c903c12` (cut from main `c16734d`); two read-only subagents (plan drift; safety and patterns), the reviewer re-ran every suite. `context/foundation/lessons.md` does not exist (no lesson applied).

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING (F1, fixed) |
| Architecture | PASS |
| Pattern Consistency | WARNING (F2, F3, fixed) |
| Success Criteria | PASS (F9 fixed) |

## Suites observed in this review (not inherited)

| Gate | Result | vs baseline (main c16734d) |
|---|---|---|
| lint, typecheck | OK | |
| unit `npm test` at c903c12 | 3062 passed | 3034 + 28 |
| unit after the review fix | 3063 passed | 3034 + 29 (one source-order tripwire) |
| deploy scripts, `sample` E1-E6 | exit 0 | |
| build | `e2e hook: absent (2 chunks checked)` | |
| e2e full `--workers=4` at c903c12 | 116 passed, 1 failed: `load-and-tab-guard.spec.ts` "#15 A-1/A-2 many hanging pictures…" (default 5 s wait for `welcome` after the slow phase) | 109 + 8 = 117 expected |
| e2e boot specs after the fix (`load-and-tab-guard`, `final-art-loading`, `salon-load-health`, `final-sound-failure`) | 10 passed | |
| e2e full `--workers=4` at 04863b9 | 117 passed (8.8 min) | 109 + 8 |

Deliberate breaks re-executed by the reviewer:
- tdd phase 1: `liftedSlot` without the touched-cell branch (always `lastIndexOf`) → `tests/coinLayout.test.ts` "is the touched cell: the FIRST of two equal coins…" red (`expected 1 to be +0`); restored, 24 passed. Meta-check: proves the rule; the paint path calls the same function with the same input (below).
- F1 fix: the new tripwire in `tests/phaserLoaderPin.test.ts` run against the pre-fix `BootScene.ts` (git stash) → red (`expected 3799 to be less than 3467`); green with the fix.

## Seam checks

- **Loader event names**: every loader event in `src/` is a valid Phaser 4.2.1 name (`progress`, `loaderror`, `Loader.Events.ADD/COMPLETE`, and the two per-file events built by `fileKeyCompleteEvent` = `'filecomplete-' + 'image' + '-' + key`, pinned against `File.js` in `tests/phaserLoaderPin.test.ts`). No string literal bypasses the helper; no double dash left.
- **Lifted coin, paint vs hook**: `CoinWallet.paint` and `CoinWallet.targets` both call `liftedSlot(layout, walletList(mat), carrying)` on the same state; the reducer (`stepTrayDrag`) keeps `mat` unchanged while a coin is carried and only `take`s it on drop/tap, so the hidden painted cell is exactly the cell the hook leaves out, and the e2e (b) proof of the hook covers the paint by construction. Visual gate 4.4 still checks the look.
- **Save format**: `SAVE_VERSION = 3`; `git diff main...HEAD -- tests/fixtures src/core/save.ts` empty.
- **Untouched**: `deploy/`, `vite/` (manifest paths unchanged), `docs/human-checklist.md`, `designs/`, `.gitignore`, `.claude/` — diff empty. No commit uses `--no-verify`; hooks not edited.
- **Precache**: + 151 016 B WebP (5 UI + 3 icons) and app icons 13 KB → 530 114 B (O2).

## Teacher read (reviewer, `npm run sample -- E1|E2 --count 6`, E1-E3 seeds 1-8 × 12)

- MONEY_PAY `E1.11.money_pay_10` / `E2.2.money_pay_20`: prompts and hints unchanged ("Zapłać 9 zł. Użyj jak najmniej monet." → 5 + 2 + 2; "Połóż największą monetę, która nie jest za duża."); every amount needs ≤ 4 pieces, so the six places never block an answer; the `pay` variant refusing 7+ pieces is led by the first hint to bigger coins. Pre-existing wording "Użyj jak najmniej monet" with a banknote in E2 unchanged (not this slice).
- New icons: "Ile jest talerzy/pudełek/naklejek?", "Na obrazku: 3 talerze / 7 pudełek / 5 naklejek", "Gdzie jest więcej naklejek? … 4 naklejki, … 2 naklejki", "Na którym miejscu od lewej jest pudełko/naklejka/talerz?", "Na stole były 3 pudełka. Dołożono 2.", "Na stole było 5 talerzy. Zabrano 3." — agreement correct for 1 / 2-4 / 5+; no accusative needed; plate never drawn on a plate (`PLATE_ICONS` unchanged), MASS unchanged. Every skill still solvable in its own mode (`tests/solvableInMode.test.ts` in the 3063 green).

## Findings

### F1 — Loading pictures had no per-file timeout

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/BootScene.ts (`preload`, `Loader.Events.ADD` listener)
- **Detail**: Phase 5 queued the two loading pictures before the `ADD` listener that copies `load.xhr.timeout` onto each file; Phaser emits `ADD` synchronously in `addFile`, so both files kept Phaser's xhr timeout 0 and a stalled one was ended only by the 45 s total cut, against the `balance.loader` comment ("a single stalled file still ends by its own limit").
- **Fix**: register the `ADD` listener before the first queued file; tripwire test in `tests/phaserLoaderPin.test.ts` (ADD still emitted in `addFile`; listener before the first `this.load.<type>(`).
- **Decision**: FIXED (04863b9)

### F2 — `totalMs` comment byte counts did not match the files

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/data/balance.ts (`loader` comment)
- **Detail**: "WebP + font are 1 926 708 B" actually included the boot sounds and used a font size of 118 983 B (file is 114 552 B); new art is 151 016 B, not 151 014 B. Reviewer row 5.5 asked for matching numbers.
- **Fix**: comment now says pictures + font + 12 boot sounds (M4A) = 1 922 277 B, + 151 016 B = 2 073 293 B ≈ 41.5 s at 50 KB/s; 45 s unchanged.
- **Decision**: FIXED (04863b9)

### F3 — Stale names in CLAUDE.md and layout comments

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: CLAUDE.md (S-16c sentence); src/data/layout.ts (`UNLOCK_LAYOUT`, `LOADING_LAYOUT` doc comments)
- **Detail**: CLAUDE.md named `dropCentres` in `dragLayout.ts`; the symbol is `TASK_LAYOUT.coinDrag.art.dropCenters` in `src/data/layout.ts`. `UNLOCK_LAYOUT` still said the book art "waits for S-16" (gap 22 closed) and `LOADING_LAYOUT` "no brand art yet" (gap 105 closed).
- **Fix**: names and comments corrected; `validate-rule-files.sh` PASS.
- **Decision**: FIXED (04863b9)

### F9 — Boot-cut e2e waited only 5 s for the welcome screen

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/load-and-tab-guard.spec.ts ("#15 A-1/A-2 many hanging pictures …")
- **Detail**: red once in the reviewer's full `--workers=4` run (`Expected "welcome", Received "loading"` after `screenIs`' default 5 s poll); green alone and in the next full run. The cut runs on the game clock, which falls behind under load; the next test in the same describe already waits 15 s for the same reason, and phase 9 widened the same wait in `final-art-loading.spec.ts`. Not caused by this slice's code (the per-file limit is off under `stallall`).
- **Fix**: `expect.poll(... screen, { timeout: 15_000 }).toBe('welcome')` with a comment; the assertion is unchanged.
- **Decision**: FIXED (04863b9)

### F4 — Slow-timer start reads the scene clock before its first update

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/BootScene.ts (`startedAt = this.time.now`)
- **Detail**: in the first scene's `preload` the clock holds `loop.time` from boot (≈ 0 before the loop runs); after the first frame `now` is loop time. `elapsed` can overestimate, so the impl-review F3 re-arm branch is mostly inert; behaviour equals main (the timer still fires at `slowAfterMs`). No harm found.
- **Fix**: follow-up (read `this.game.loop.now` / a start mark in the first `update`), trigger recorded.
- **Decision**: DEFERRED (follow-up)

### F5 — App icons are heavy for the precache

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: public/icons/*.png, scripts/make-icons.mjs, tests/appIcons.test.ts
- **Detail**: `dwebp` writes unoptimised 24-bit PNG: icon-512 323 406 B, all icons 530 114 B (+0.52 MB precache, not in the boot queue, as the plan's Performance section estimated). The test floor `icon-512 > 100 KB` would block an optimised file.
- **Fix**: follow-up: a PNG recompress pass without new deps, then loosen the floor.
  - Strength: −0.3 MB on every cold install. · Tradeoff: needs a tool the sandbox/no-deps rule allows. · Confidence: MED. · Blind spot: launcher rendering of a palette PNG.
- **Decision**: DEFERRED (follow-up)

### F6 — `make-icons.mjs` leaves its temp dir on failure

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: scripts/make-icons.mjs (`fail()` inside `try`)
- **Detail**: `process.exit(1)` skips the `finally` cleanup; a missing binary prints `cwebp failed (ENOENT)` instead of the "is cwebp installed?" text of `make-task-art.mjs`. `execFileSync` with arrays: no injection.
- **Fix**: follow-up with the next change to the script.
- **Decision**: DEFERRED (follow-up)

### F7 — Plan drift recorded

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: tests/e2e/support/hook.ts; src/scenes/BootScene.ts; docs/design-gaps.md row 108
- **Detail**: `holdTouch` is named `holdDrag` (the name was taken; recorded in the phase-10 request); loading listeners are removed on `COMPLETE` only, not again in `create` (harmless: COMPLETE precedes `create`, and `create` nulls the screen); gap 108 row is updated to the thumbnail fallback but not prefixed "CLOSED" while CLAUDE.md lists it closed — the tile is still partly our design, so "narrowed" is the accurate word.
- **Fix**: none needed.
- **Decision**: ACCEPTED

### F8 — `UI_ART_KEYS` repeats the key strings

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/data/uiArt.ts
- **Detail**: keys are written twice; `tests/uiArt.test.ts` guards the drift.
- **Fix**: none now.
- **Decision**: ACCEPTED

## [reviewer] rows

- 1.5 PASS — teacher read above; `ART_LIMITS.moneyItems` 10; `dragLayout` takes all numbers from `TASK_LAYOUT`/`balance`.
- 2.5 PASS — nothing under `designs/` in the diff; no `salon-before` file; teacher read E1-E3 above.
- 3.4 PASS — `src/core/artPick.ts` imports nothing from Phaser, no browser globals (ESLint boundary green).
- 4.5 PASS — no number or Polish text added to `CoinWallet` (alpha from `TASK_LAYOUT.coinPay.fullTrayAlpha`); DESIGN-GAP comment names rows 104, 115; row 115 present.
- 5.5 PASS after F2 — `progress` listener removed on COMPLETE; `loaderror` listener byte-identical to main; `totalMs` comment numbers now match the files.
- 6.4 PASS — `src/ui/widgets/RoomView.ts` unchanged; live and drawn paths call `drawRoomMiniature` as before; no new text or numbers in widgets.
- 8.3 PASS after F3 — every name CLAUDE.md adds exists; `docs/human-checklist.md` unchanged vs main.

MERGE: CLEAR — no critical finding; four warnings fixed in 04863b9 (F1 with a red-then-green tripwire); unit 3034 + 29, e2e 109 + 8 = 117 passed with --workers=4 on 04863b9; save v3 and fixtures untouched; visual rows 4.4, 5.4, 6.3 and human rows 7.4, 10.4 stay for the visual gate and the maintainer.
