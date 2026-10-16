# P2 art from the salon-v2 pack (S-16c `final-art-p2`) — Implementation Plan

## Overview

Roadmap slice **S-16c** (FR-026). The child sees the target app icon (regular, maskable, apple-touch, favicon), a
loading screen with the pack's background and title emblem (the title stays drawn by the game), the open wallet with six
coin places in MONEY_PAY tasks, the notebook on the "Nowa umiejętność!" card, the plate / box / sticker icons in counting
tasks, and on "Pokój gotowy!" her own live salon miniature with the pack's `salon-after` thumbnail as the fallback when a
miniature picture is missing. Every new picture has a drawn fallback (today's look), so a missing or cut file never stops
the game. Save format stays **v3**; frozen fixtures byte-identical. Closes design gaps 22, 104 (narrowed), 105, 108 and
the follow-ups whose trigger this slice fires (wallet art, notebook, loading art, F2 miniature z-order, `CoinWallet.paint`
lifted cell, load-and-tab-guard impl-review F3, final-art-salon F3 progress listener, A-10).

## Current State Analysis

(From `research.md`; anchors re-checked in this step on `e41be09`.)

- **Wallet.** `balance.coinDrag = { startDistance: 12, maxTotal: 10 }`; the cap is read by `stepTrayDrag` (via rules),
  `parseMoneyPayParams`, `walletCheck` (`src/core/tasks/generators/moneyPay.ts`), `validate.ts` (money_pay rule) and
  `canonicalInput.ts`. `coinLayout` (`src/core/round/dragLayout.ts`) puts coin i in a `columns × rows` (5 × 2) grid over
  `TASK_LAYOUT.coinDrag.wallet = DRAG_MAT` (944×460 at 236,380). `CoinWallet` (`src/ui/widgets/CoinWallet.ts`) pools
  `ART_LIMITS.moneyItems` (10) placed images, draws a dashed field, and `paint` hides `list.lastIndexOf(kind)` for a lifted
  coin while `coinGeometry.matAt` grabs the touched cell (follow-up). `Carrying` already keeps `startX/startY`.
  `tests/coinLayout.test.ts` asserts ≥ 96 px (`MIN_TOUCH_TARGET`) coins, inside the notebook, apart, `columns*rows ≥ maxTotal`;
  `tests/blockDrag.test.ts` pins `balance.coinDrag` to `{ 12, 10 }`. `tests/e2e/money-pay.spec.ts` "#11 a wallet with too
  many coins…" builds `spread` = the biggest coin as 1-zł coins + the rest — up to 7 coins (8 zł, 9 zł).
- **Pack wallet** (`manifest.learning.wallet`): `wallet-open.png` 640×420, `coinDiameter` 72, six `dropCenters`
  [[200,160],[320,160],[440,160],[200,248],[320,248],[440,248]] (pitch 120 × 88 native).
- **Content.** `E1.11.money_pay_10` (tray 1/2/5 zł, 2–10 zł) and `E2.2.money_pay_20` (1/2/5 zł + 10 zł note, 3–20 zł),
  variants `pay` / `fewest`. `fewestCoins` gives ≤ 3 pieces in E1 and ≤ 4 in E2; the answer is always the fewest wallet.
- **Boot.** `BootScene.preload`: one queue (font, 38 `TASK_ART`, 12 boot sounds, 26 `ROOM_ART`), per-file timeout via
  `Loader.Events.ADD`, slow timer that asks `bootLoadPhase(limits.slowAfterMs, limits)` with the constant (impl-review F3),
  cut timer (`cutLoad`), a `progress` listener never removed (F3) that logs every failed draw (A-10). `LoadingScreen` draws
  an ivory rect, `pl.loading.title` at `LOADING_LAYOUT.title` (960,450), a bar at top 580 and the slow line (gap 112).
  The e2e hook's loading snapshot is `{ screen: 'loading', loading: { phase } }`.
- **Measured boot queue now** (bytes on disk): `public/assets/tasks` 442 240 + `public/assets/rooms` 1 233 242 + font
  118 983 + boot sounds 132 243 (M4A) = 1 926 708 B ≈ 38.5 s at 50 KB/s (the `balance.loader` comment says "≈ 1.9 MB").
- **Unlock card.** `UnlockCard` shows `ART_KEYS.icon('book')` through `ArtImage` at `UNLOCK_LAYOUT.art` (200² at 960/461).
  `ArtImage` knows aspect and stand-in label only for `TASK_ART` keys (`SIZES`).
- **Room done.** `RoomDoneCard.drawRoomTile` → `drawRoomMiniature` (`src/ui/widgets/RoomView.ts`) at `thumbScale` 0.13;
  missing pieces become `drawStandIn` on one shared `Graphics` under all images (F2). `miniaturePieces` is pure and tested
  (`tests/roomMiniature.test.ts`). Pack thumbnails 480×270 show a fixed look.
- **Icons.** `ICONS` (`src/data/measures.ts`) 12 ids; COUNT, COMPARE_QTY, ORDINAL and CHOOSE_OP-with-picture draw from all
  of `ICONS`; `PLATE_ICONS` (MULT_GROUPS) and `SCALE_ITEMS` (MASS) are fixed lists. `TASK_ART` builds from `ICONS`
  (`tests/taskArt.test.ts` pins 38). Nouns `talerz`, `pudełko`, `naklejka` exist in `src/data/nouns.ts`.
- **App icons.** `scripts/make-icons.mjs` (`npm run icons`) draws placeholders; `vite/config.shared.mjs`
  `manifest.icons` lists 192, 512, maskable 512 (`includeManifestIcons: false`, the `png` glob precaches them);
  `index.html` links `/favicon.png` and `/icons/apple-touch-icon-180.png`.
- **Art script.** `scripts/make-task-art.mjs` (`npm run art`) reads `designs/martynka-maths-A-v1` and
  `designs/martynka-expansion-v1`; `cwebp -q 85 -alpha_q 100 -m 6`, deterministic. Pack `designs/martynka-salon-v2` is local.
- `context/foundation/lessons.md` does not exist. Last `docs/design-gaps.md` row: 114.

## Desired End State

- `public/assets/ui/{loading-background,loading-emblem,wallet-open,skill-notebook,salon-after}.webp` (960×540, 300²,
  640×420, 400², 480×270) and `public/assets/tasks/icons/{plate,box,sticker}.webp` (256²), made by `npm run art`;
  `UI_ART` table in `src/data/uiArt.ts` equal to the files (test); `ICONS` has 15 ids, `TASK_ART` 41.
- `public/icons/{icon-192,icon-512,icon-maskable-512,apple-touch-icon-180}.png` and `public/favicon.png` (48) from the
  pack via `npm run icons` (rewritten converter); manifest paths unchanged; test checks PNG dimensions and manifest.
- `balance.coinDrag.maxTotal` 6; `coinLayout` places coins on the six pack drop centres scaled into the wallet rect;
  pure `liftedSlot` and `walletFull`; `CoinWallet` draws the wallet art (drawn dashed field when missing), hides the
  touched cell, dims the tray when the wallet is full.
- `BootScene` queues the two loading pictures first and `LoadingScreen` shows each when its `filecomplete` arrives;
  without them it is today's drawn screen; progress listener removed at complete, a failed bar draw logged once, the slow
  timer asks `bootLoadPhase` with the real elapsed time; `balance.loader.totalMs` stays 45 000 with a recomputed comment.
- `UnlockCard` shows the notebook (book icon, then its stand-in, as fallbacks); `RoomDoneCard` shows the live miniature
  when every needed picture is loaded, else `salon-after`, else today's drawn miniature (pure `miniatureMode`).
- Hook (e2e build only, read-only): `loading.art`, `coins.walletArt` / `coins.full`, `room.doneMiniature`.
- e2e specs: loading art and its cut fallback (#15), MONEY_PAY six-place wallet by touch (#11), room-done miniature
  fallback (#16 / FR-019); full suite green with `--workers=4`.
- Design gaps 22, 105, 108 closed, 104 narrowed (tray and full-wallet look still ours, new row 115 for the full signal);
  `CLAUDE.md` current-state line updated; follow-ups carried with triggers.
- `SAVE_VERSION` 3; `git diff --stat main -- tests/fixtures` empty; nothing under `deploy/`, `designs/`, `.gitignore`, `.claude/`.

### Key Discoveries:

- The wallet art has exactly six places; every MONEY_PAY amount is payable in ≤ 4 pieces, so a 6-coin cap removes no
  task — it only refuses wallets of 7–10 pieces in the `pay` variant (e.g. 8 zł in 1-zł coins).
- At wallet scale 1.25 (800×525) the drop-centre pitch is 150 × 110 game px: a 144 × 104 coin box clears the 96 px touch
  target; at `DRAG_MAT` height (scale 1.095) it would be 96 px, at the limit. The wallet rect therefore grows below
  `DRAG_MAT` (y 380 → 905, inside the notebook bottom 992) and narrows (x 308 → 1108, clear of the tray at 1240).
- Phaser emits `filecomplete-image-<key>` per image; queue order is "requested first", not "arrives first". A scene `pack`
  would sit outside the per-file timeout and the total cut (research § 2), so the loading art joins the one queue.
- New non-task pictures must stay out of `TASK_ART`: `artHealth(TASK_ART)` drives "Obrazki" and `artFilter`, and
  `?e2eArt=missing|room` skip only `TASK_ART` / `ROOM_ART` — that lets `?e2eArt=room` prove the thumbnail fallback.
- With new files the boot queue is 1 926 708 + 151 014 = 2 077 722 B ≈ 41.6 s at 50 KB/s: under 45 s.

## What We're NOT Doing

- `salon-before` thumbnail (no screen lists a not-done room) — `[human]` decision row.
- Changing MONEY_PAY amounts, trays, prompts, hints or `ART_LIMITS.moneyItems` (stays 10 for MONEY_COUNT drawings).
- `plate` as the MULT_GROUPS group frame (gap 62) and the three new icons in `PLATE_ICONS` / `SCALE_ITEMS`.
- Counting UI pictures in "Obrazki" / art health (L-6, L-8, F4, A-5, ASL-02..09 stay out with their triggers).
- Loader error lines with URL/status (A-3/A-4/S14-08), `FontFace` limit, per-file timeout unit test, texture atlas —
  carried forward unchanged; the `loaderror` listener is not edited.
- The 12 expansion icons of the pack (banana, strawberry …), `globIgnores` for the 512 icon, new e2e URL seams.
- Nothing in `deploy/`, `designs/`, `.gitignore`, `.claude/`, `docs/human-checklist.md`; no new npm dependency.

## Implementation Approach

Pure logic first, test-first: the wallet geometry and cap (phase 1), the art files and tables with their tests (phase 2),
the fallback decisions (phase 3). Then the widgets, one per phase: wallet (4), loading screen (5), unlock card and
room-done tile (6), app icons (7), docs (8). Then three browser phases after what they prove is built: loading (9),
wallet by touch (10), room-done miniature (11). Every phase leaves the full local gate green and the e2e suite at
`<branch baseline> + delta` (orchestrator runs e2e at each gate; phase agents use the request-file protocol).

## Critical Implementation Details

- **Phase 1 touches an existing e2e spec**: with `maxTotal` 6 the "spread" wallet of `money-pay.spec.ts` can reach 7
  coins and `payCoins` would poll forever. Phase 1 changes the spread to "the biggest coin broken into the fewest coins of
  smaller tray nominals" (5 → 2+2+1, 2 → 1+1), which stays ≤ 6 for every E1 amount and still has more coins than the answer.
- **Loading art redraw**: `LoadingScreen.showArt(key)` is called from `this.load.on('filecomplete-image-<key>')` for the
  two keys only, inside `try` (a failed draw logs once, never stops the load); the background is added at the lowest
  depth (under the ivory rect it replaces: the rect is hidden when the background shows), the emblem above the title.
  Both are destroyed in `destroy()`. A file cut by `cutLoad` never fires `filecomplete`.
- **Listener hygiene**: the `progress` and both `filecomplete-image-*` listeners are removed in the `COMPLETE` handler
  (and in `create`), so a late file after the cut cannot redraw a destroyed screen.
- **Lifted cell**: `liftedSlot` reads `carrying.startX/startY` against `layout.coin(i)`; it returns the touched index
  only when that cell's kind equals `carrying.kind`, else `lastIndexOf` (never a wrong-kind hole).

## Phase 1: Six-place wallet — cap, drop-centre layout, lifted cell, full wallet (pure logic)

Driver: tdd
Driver why: the cap, the coin rectangles on the drop centres, the lifted-cell index and the full-wallet rule are pure `core`/`data` functions with geometric oracles — failing tests drive them before any widget uses them.

### Overview

The wallet takes at most six coins, each on a pack drop centre; no visible change yet beyond the cap (the widget still
draws the dashed field, now over the new rect).

### Changes Required:

#### 1. Cap and layout data

**File**: `src/data/balance.ts` (`coinDrag`); `src/data/layout.ts` (`TASK_LAYOUT.coinDrag`)

**Intent**: Cap the wallet at the six places of the pack art and describe the wallet as the art scaled into the notebook.

**Contract**: `balance.coinDrag = { startDistance: 12, maxTotal: 6 }` with the comment rewritten (six drop centres of the
pack wallet; every amount needs ≤ 4 pieces; `ART_LIMITS.moneyItems` stays 10 for MONEY_COUNT). `TASK_LAYOUT.coinDrag`
drops `columns`, `rows`, `cellInset` and gains `art: { width: 640, height: 420, dropCenters: [[200,160],[320,160],
[440,160],[200,248],[320,248],[440,248]] }` (numbers from the pack manifest, comment says so), `wallet: { x: 308, y: 380,
width: 800, height: 525 }` (art × 1.25) and `coinGap: 6`. The layout comment names DESIGN-GAP 104 and the visual gate.

#### 2. Layout and rules

**File**: `src/core/round/dragLayout.ts` (`CoinSpec`, `coinLayout`, new `liftedSlot`, `walletFull`); `tests/coinLayout.test.ts`; `tests/blockDrag.test.ts`

**Intent**: Coin i (wallet list order, largest first) sits in a box centred on drop centre i scaled into the wallet rect;
the reducer's touched cell and the full state become pure functions the widget calls.

**Contract**: `CoinSpec` = `{ tray, wallet, ok, art: { width; height; dropCenters: readonly (readonly [number, number])[] }, coinGap, rowKinds, maxKinds }`;
`coin(i)` for `i ≥ dropCenters.length` throws (the art has no place for it); scale `s = wallet.width / art.width` (equal to the height ratio within 1 %, asserted in the test); box =
`(pitchX·s − coinGap) × (pitchY·s − coinGap)` where pitch = the smallest non-zero distance between centres on each axis.
`liftedSlot(layout, list, carrying): number` → index of the cell containing `(startX, startY)` when `carrying.from ===
'mat'` and `list[i] === carrying.kind`, else `list.lastIndexOf(carrying.kind)`; −1 when not carrying from the mat.
`walletFull(mat, maxTotal): boolean`. Tests: six coins inside the wallet, ≥ `MIN_TOUCH_TARGET` both ways, pairwise apart,
each centred on its scaled drop centre (±1 px); `dropCenters.length === balance.coinDrag.maxTotal`; tray and OK still
apart from the wallet and inside the notebook for 1–4 kinds; `liftedSlot` picks the touched FIRST of two 2-zł coins (index 0 of
`[2 zł, 2 zł]`, where `lastIndexOf` would give 1 — touching the last one cannot tell the two apart; plan review F2), falls back
for a wrong-kind cell; `walletFull` at 5 / 6; `blockDrag.test` pin → `{ startDistance: 12, maxTotal: 6 }`.

#### 3. Content checks follow the cap

**File**: `tests/moneyPay.test.ts`; `src/core/tasks/generators/moneyPay.ts`, `src/core/tasks/validate.ts`, `src/core/round/canonicalInput.ts` (unchanged code, they read the balance)

**Intent**: Prove no MONEY_PAY skill became infeasible and the `pay` check refuses a 7-coin wallet.

**Contract**: new test: for every E1/E2 MONEY_PAY skill and every amount `fewestCoins(...).length ≤ 4 ≤ maxTotal`;
`walletCheck` (via a generated task's `check`) refuses seven 1-zł coins for 7 zł and accepts 5+2.

#### 4. The e2e spread stays within six coins

**File**: `tests/e2e/money-pay.spec.ts` ("#11 a wallet with too many coins in the fewest-coins task …")

**Intent**: Keep the existing spec valid under the cap (see Critical Implementation Details).

**Contract**: `spread` = the first coin replaced by the fewest coins of smaller tray nominals + the rest; assert
`spread.length > answer.length` and `spread.length <= 6`. No other e2e change.

#### 5. Teacher read

**Intent**: Content change for E1.11 / E2.2 (the `pay` variant refuses wallets of 7+ pieces).

**Contract**: `npm run sample -- E1 --count 6` and `-- E2 --count 6`; read every `E1.11.money_pay_10` and
`E2.2.money_pay_20` task as a teacher: prompt and hints unchanged, every amount payable within six places, and the
first hint ("Połóż największą monetę…") leads a child stuck at a full wallet of 1-zł coins to exchange; recorded in the handoff.

### Success Criteria:

#### Automated Verification:

- New/changed tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `maxTotal` back to 10 → "drop centres equal the cap" red; box without `coinGap` → "apart" red; `liftedSlot` returning `lastIndexOf` always → touched-cell test red; restored; meta-check: proves geometry and rules, not that the widget draws them (phase 10)
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`)
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`, `money-pay.spec.ts` green

#### Manual Verification:

- [reviewer] Teacher read of E1.11 / E2.2 recorded; `ART_LIMITS.moneyItems` still 10; no number in `core` that belongs in `balance`/`layout`

---

## Phase 2: Art files and tables — UI art, three counting icons

Driver: tdd
Driver why: the tables (`UI_ART`, `ICONS`, `TASK_ART`) are data with file-on-disk oracles — failing table tests (15 icons, 41 task pictures, every `UI_ART` file present at its size) come first, then the conversion makes them green.

### Overview

Converted WebP files and the data that names them; nothing draws them yet except the three icons, which the icon
generators pick up at once (teacher read).

### Changes Required:

#### 1. Conversion

**File**: `scripts/make-task-art.mjs`

**Intent**: Convert the P2 files of `designs/martynka-salon-v2` with the same settings and determinism.

**Contract**: a third source dir `designs/martynka-salon-v2` (exit 1 with the same message when absent); jobs:
`assets/loading/background.png` → `ui/loading-background.webp` 960×540, `assets/loading/title-emblem.png` →
`ui/loading-emblem.webp` 300², `assets/learning/wallet-open.png` → `ui/wallet-open.webp` 640×420 (no resize),
`assets/learning/skill-notebook.png` → `ui/skill-notebook.webp` 400², `assets/thumbnails/salon-after.png` →
`ui/salon-after.webp` 480×270, `assets/icons/{plate,box,sticker}.png` → `tasks/icons/<id>.webp` 256². UI files land in
`public/assets/ui/` (new output root beside `tasks/` and `rooms/`). Header comment updated. Re-run → no diff.

#### 2. Tables

**File**: `src/data/uiArt.ts` (new); `src/data/measures.ts` (`ICONS`); `src/data/taskArt.ts` (unchanged code); `src/ui/widgets/ArtImage.ts` (`SIZES`)

**Intent**: One source for the non-task pictures (key, url, size, Polish stand-in label) and three new counting icons.

**Contract**: `export interface UiArtDef { id: UiArtId; key: string; url: string; width: number; height: number; label: string }`,
`UiArtId = 'loadingBackground' | 'loadingEmblem' | 'wallet' | 'notebook' | 'salonAfter'`, keys `ui/<file>`,
`UI_ART` and `UI_ART_KEYS: Record<UiArtId, string>`; labels in Polish data (e.g. "zeszyt", "portfel"). `ICONS` appends
`{ id: 'plate', noun: 'talerz' }`, `{ id: 'box', noun: 'pudełko' }`, `{ id: 'sticker', noun: 'naklejka' }` (match the
existing entry shape). `ArtImage` `SIZES` built from `TASK_ART` and `UI_ART`. `PLATE_ICONS`, `SCALE_ITEMS` unchanged.

#### 3. Tests

**File**: `tests/uiArt.test.ts` (new); `tests/taskArt.test.ts`; `tests/measures.test.ts`

**Contract**: `UI_ART` keys unique and disjoint from `TASK_ART`/`ROOM_ART` keys; every url exists under `public/` with the
table's pixel size (read the WebP `VP8X`/`VP8 `/`VP8L` header); `TASK_ART` length 41 with files present; `ICONS` 15 with
the exact id list; `plate|box|sticker` not in `PLATE_ICONS` or `SCALE_ITEMS`.

#### 4. Teacher read

**Contract**: `npm run sample -- E1|E2|E3 --count 6`; read every COUNT, COMPARE_QTY, ORDINAL and CHOOSE_OP-with-picture
task that shows talerz / pudełko / naklejka (genitive plural "talerzy/pudełek/naklejek", accusative "naklejkę", gendered
past tense); `npm run sample` exits 0 for E1–E6; recorded in the handoff.

### Success Criteria:

#### Automated Verification:

- New/changed tests red before conversion (assertion on missing file / length), green after; unit `<branch baseline> + N`
- `npm run art` twice → `git status --porcelain public/` unchanged after the second run
- Deliberate break: delete `public/assets/ui/wallet-open.webp` → `tests/uiArt.test.ts` red; drop `sticker` from `ICONS` → `measures`/`taskArt` red; restored; meta-check: proves files and tables agree, not that a widget shows them
- Full local gate green; `dist/sw.js` lists `assets/ui/loading-background.webp` and `assets/tasks/icons/plate.webp`

#### Manual Verification:

- [reviewer] Nothing from `designs/` staged; `salon-before` not converted; teacher read E1–E3 recorded

---

## Phase 3: Fallback decisions — which picture to show (pure logic)

Driver: tdd
Driver why: "first loaded key" for the notebook and "live / thumbnail / drawn" for the room-done tile are pure decisions over an injected `exists` — failing tests drive them before the widgets call them.

### Overview

Two small rules in `core`, used by phases 4–6.

### Changes Required:

#### 1. Rules

**File**: `src/core/artPick.ts` (new); `tests/artPick.test.ts` (new)

**Intent**: Every new picture keeps a drawn fallback chosen by one tested rule, not by ad-hoc checks in widgets.

**Contract**: `firstLoaded(keys: readonly string[], exists: (key: string) => boolean): string | null` — first existing
key, null when none. `miniatureMode(needed: readonly string[], exists, thumbnailKey: string): 'live' | 'thumbnail' | 'drawn'`
— `live` when every needed key exists (also for an empty list), else `thumbnail` when it exists, else `drawn`.
`neededMiniatureKeys(pieces: readonly { key: string; alpha: number }[]): string[]` — the keys a miniature draws (every
piece except a missing-allowed `alpha === 0` piece, mirroring `drawRoomMiniature`'s skip) — the piece type is a
structural `{ key, alpha }` so `core` does not import `ui`. Tests: each branch, order of `firstLoaded`, a salon state
from `miniaturePieces(SALON, …)` where one furniture key is missing → `thumbnail`.

### Success Criteria:

#### Automated Verification:

- New tests red before implementation (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `miniatureMode` returning `live` when any key exists → "one missing piece gives the thumbnail" red; restored; meta-check: rule only, the tile is proven in phase 11
- Full local gate green; build prints `e2e hook: absent (`

#### Manual Verification:

- [reviewer] `src/core/artPick.ts` has no Phaser or browser globals (ESLint boundary)

---

## Phase 4: Wallet widget with the pack art

Driver: impl
Driver why: `CoinWallet` drawing the wallet image, the six coins, the touched hole and the dimmed tray is Phaser rendering over the phase-1 rules — no new logic; browser proof in phase 10.

### Overview

The child sees the open wallet; coins sit in its six places; a full wallet dims the tray.

### Changes Required:

#### 1. Widget

**File**: `src/ui/widgets/CoinWallet.ts`; `src/data/layout.ts` (`TASK_LAYOUT.coinPay`, if a dim alpha is needed)

**Intent**: Draw the wallet art in `layout.wallet` when `UI_ART_KEYS.wallet` is loaded, else today's field + dashed rect;
coins at `layout.coin(i)` (a note fits its box keeping its aspect through `ArtImage`); the lifted coin's hole at
`liftedSlot(...)` (closes the `CoinWallet.paint` follow-up); when `walletFull(state.mat, balance.coinDrag.maxTotal)` the
tray tiles draw at `TASK_LAYOUT.coinPay.fullTrayAlpha` (new, e.g. 0.45) — the full-wallet signal (DESIGN-GAP 115, new row).

**Contract**: `placed` pool length `balance.coinDrag.maxTotal`; a wallet `Image` (or `ArtImage` without stand-in use)
created in the `CoinWallet` constructor before the placed coins so coins draw above it (no `setDepth`: `TaskScene` creates
`CoinWallet` before `FeedbackBar`, so the bar and its buttons draw above the wallet's lower edge, which at y 905 reaches into
the bar zone 864–960); `targets()` keeps its shape plus `walletArt: 'art' | 'drawn'` and `full: boolean`, and
`targets().coins` lists only the coins DRAWN in the wallet: while a coin is lifted from the wallet, the entry at
`liftedSlot(...)` is left out (plan review F3; existing specs read `coins.coins` only at rest); header DESIGN-GAP comment
narrowed to the tray, drop and full look.

#### 2. Hook

**File**: `src/testing/e2eHook.ts`; `tests/e2e/support/hook.ts` (types)

**Contract**: the read-only `coins` snapshot gains `walletArt` and `full`; no URL seam, no marker change.

#### 3. Boot queue for the non-loading UI art

**File**: `src/scenes/BootScene.ts` (`preload`)

**Intent**: The wallet texture must be loaded for this phase to draw it (plan review F1): queue every `UI_ART` entry except
`loadingBackground` / `loadingEmblem` after the `ROOM_ART` loop (same queue, per-file limit and total cut; no seam skips
them). Phase 5 adds the two loading entries at the front of the queue. Notebook and `salon-after` are loaded from here on
too (drawn by phase 6).

### Success Criteria:

#### Automated Verification:

- Full local gate green; unit `<branch baseline> + 0`; build prints `e2e hook: absent (`
- e2e (orchestrator) `<branch e2e baseline> + 0`, `money-pay.spec.ts` green
- Deliberate break: request-file patches for phase 10 written (`e2e-break-p10a.patch`: `paint` hides `lastIndexOf`; `e2e-break-p10b.patch`: wallet image always drawn even when the texture is missing); meta-check in the handoff (proof in phase 10)

#### Manual Verification:

- [visual] MONEY_PAY E1 and E2 at 1440 and 1024: wallet art, six coins centred in their places, the 10 zł note fits, full wallet dims the tray, coins ≥ touch size; after a miss the feedback bar and its buttons draw above the wallet's lower edge
- [reviewer] No number or text in the widget; DESIGN-GAP 115 row and comment

---

## Phase 5: Loading screen with background and emblem

Driver: impl
Driver why: queue order, `filecomplete` listeners and redraw are Phaser loader and rendering code; the rule for the slow line already exists (`bootLoadPhase`) — browser proof in phase 9.

### Overview

The loading screen shows the pack background and emblem as soon as they arrive; until then, or if they never do, it is
today's drawn screen. Three boot follow-ups are fixed in the same handler.

### Changes Required:

#### 1. Boot queue and listeners

**File**: `src/scenes/BootScene.ts` (`preload`, `create`)

**Intent**: Queue `UI_ART` loading background and emblem FIRST (the other `UI_ART` entries are already queued after the room
art since phase 4; same queue, same per-file limit and total cut); redraw on their `filecomplete-image-<key>`; remove `progress` and those listeners on
`COMPLETE`; a failed bar or art draw logs once (A-10); the slow timer passes the elapsed scene time since `preload`
began, not the constant (impl-review F3).

**Contract**: `UI_ART` is not part of `artHealth` / `artFilter`; `?e2eArt=missing|room|corrupt` unchanged (they skip only
`TASK_ART`/`ROOM_ART`). `balance.loader.totalMs` stays 45 000; its comment recomputed with the measured numbers
(1 926 708 B today + 151 014 B new = 2 077 722 B ≈ 41.6 s at 50 KB/s; the loading art is requested first; past the limit the
game starts and the next start reads the service-worker cache).

#### 2. Screen

**File**: `src/ui/widgets/LoadingScreen.ts`; `src/data/layout.ts` (`LOADING_LAYOUT.emblem`, `LOADING_LAYOUT.background`)

**Intent**: `showArt(id: 'loadingBackground' | 'loadingEmblem')`: background fills 1920×1080 and hides the ivory rect;
emblem 300² centred above the title (`LOADING_LAYOUT.emblem = { x: 960, y: 270, size: 300 }`); both behind the bar and
title in depth. `artShown(): { background: boolean; emblem: boolean }` for the hook. DESIGN-GAP comment for gap 105
removed; gap 112 (slow line) stays.

#### 3. Hook

**File**: `src/testing/e2eHook.ts`; `tests/e2e/support/hook.ts`

**Contract**: loading snapshot `loading: { phase, art: { background, emblem } }` read from `BootScene` (new read-only
`loadingArt()`).

### Success Criteria:

#### Automated Verification:

- Full local gate green; build prints `e2e hook: absent (`
- e2e (orchestrator) `<branch e2e baseline> + 0`, `load-and-tab-guard.spec.ts` and `salon-load-health.spec.ts` green
- Deliberate break: request-file patches for phase 9 written (`e2e-break-p9a.patch`: no `showArt` on `filecomplete`; `e2e-break-p9b.patch`: loading art in a scene `pack` / outside the cut); meta-check in the handoff

#### Manual Verification:

- [visual] Loading screen at 1440 and 1024 (held with a throttled route): background, emblem, title readable over the background, bar and slow line
- [reviewer] `progress` listener removed; `loaderror` listener untouched; `totalMs` comment numbers match the files

---

## Phase 6: Notebook on the unlock card, salon thumbnail fallback on "Pokój gotowy!"

Driver: impl
Driver why: two widgets call the phase-3 rules and draw an image — no new logic; the room-done tile is proven in the browser in phase 11.

### Overview

The unlock card shows the notebook; the room-done tile keeps the child's live salon and falls back to the pack thumbnail.

### Changes Required:

#### 1. Unlock card

**File**: `src/ui/widgets/UnlockCard.ts`

**Intent**: Show `firstLoaded([UI_ART_KEYS.notebook, ART_KEYS.icon('book')], exists) ?? ART_KEYS.icon('book')` through
`ArtImage` at `UNLOCK_LAYOUT.art` (the book's stand-in box stays the last fallback). DESIGN-GAP 22 comment removed.

#### 2. Room-done tile

**File**: `src/ui/widgets/RoomDoneCard.ts` (`drawRoomTile`); `src/ui/widgets/RoomView.ts` (`drawRoomMiniature` unchanged)

**Intent**: `miniatureMode(neededMiniatureKeys(miniaturePieces(room, state)), exists, UI_ART_KEYS.salonAfter)`: `live` →
`drawRoomMiniature` as today; `thumbnail` → one image of `salon-after` in the same thumb rect (250×140 at
`thumbScale`); `drawn` → `drawRoomMiniature` as today (stand-ins). Closes F2 where it matters. DESIGN-GAP 108 comment
updated. The card records the mode for the hook.

**Contract**: hook `room` snapshot gains `doneMiniature: 'live' | 'thumbnail' | 'drawn' | null` (null while no card).

### Success Criteria:

#### Automated Verification:

- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator) `<branch e2e baseline> + 0`
- Deliberate break: request-file patch for phase 11 written (`e2e-break-p11a.patch`: tile always `live`); meta-check in the handoff

#### Manual Verification:

- [visual] Unlock card with the notebook; "Pokój gotowy!" with the live miniature and (with `?e2eArt=room`) the thumbnail, at 1440 and 1024
- [reviewer] `drawRoomMiniature` untouched for the live path; no new text or numbers in widgets

---

## Phase 7: App icons from the pack

Driver: impl
Driver why: a deterministic file conversion and a static manifest check — no logic to drive by a test beyond the file-dimension guard written with it.

### Overview

Home-screen icon, maskable icon, iPad apple-touch icon and favicon are the pack's.

### Changes Required:

#### 1. Converter

**File**: `scripts/make-icons.mjs` (rewritten); `package.json` (`icons` script kept)

**Intent**: Produce the five PNGs from `designs/martynka-salon-v2/assets/app` with `cwebp -quiet -lossless -exact -resize
N N` then `dwebp -quiet … -o out.png` in a temp dir (sandbox-safe, deterministic): `icon-512`, `icon-192`,
`apple-touch-icon-180`, `favicon.png` 48 from `app-icon.png`; `icon-maskable-512` from `app-icon-maskable.png`. Exits 1
when the pack or a binary is missing. The placeholder PNG encoder is removed.

#### 2. Files and guard

**File**: `public/icons/*.png`, `public/favicon.png`; `tests/appIcons.test.ts` (new); `vite/config.shared.mjs`, `index.html` (paths unchanged; only touched if a `purpose: 'any'` is added — not planned)

**Contract**: test reads each PNG's IHDR: 192², 512², 512², 180², 48²; every `manifest.icons[].src` in
`vite/config.shared.mjs` (read as text with a regex over `src: '/icons/…'`, not imported: the module pulls in
`vite-plugin-pwa`; plan review F6) exists under `public/`; `icon-512.png` larger than 100 KB (not the placeholder).

### Success Criteria:

#### Automated Verification:

- `npm run icons` twice → no diff in `public/icons`, `public/favicon.png`
- Deliberate break: `icon-192.png` replaced by the 512 file → `tests/appIcons.test.ts` red; restored; meta-check: proves sizes and manifest paths, not how a launcher crops the maskable icon
- Full local gate green; `dist/sw.js` lists `icons/icon-512.png`; `dist/manifest.webmanifest` icon paths unchanged

#### Manual Verification:

- [human] iPad: add to home screen shows the new icon; Android launcher maskable crop keeps the content in the safe circle

---

## Phase 8: Documentation, design gaps, follow-ups

Driver: impl
Driver why: text-only changes in `CLAUDE.md`, `docs/design-gaps.md` and the follow-ups file — nothing to test beyond the rule-file validator.

### Overview

Docs match the code; carried follow-ups keep their triggers.

### Changes Required:

#### 1. Docs

**File**: `CLAUDE.md` (current-state paragraph: "Placeholder app icons…" → pack icons via `npm run icons`; one S-16c
sentence: `UI_ART`, `public/assets/ui/`, six-place wallet, `artPick`); `docs/design-gaps.md` (rows 22, 105, 108 closed
with the S-16c note; 104 narrowed; new row 115 "full wallet dims the tray"); `context/changes/final-art-p2/follow-ups/review-fixes.md`
(carried: A-3/A-4/S14-08, `FontFace` limit, per-file timeout test, art-health set, texture atlas, `salon-before`, plate as
MULT_GROUPS frame; and, fired by this slice but deferred (plan review F4): the three `Rect` types (`dragLayout`/`pictureLayout`/
`geometry`, fired by phase 1), shared `ArtPool`/`fitRect` and S14-10 (fired by the `ArtImage` edit), ASL-02..09 and the coin
stand-in label size (fired by the `ArtImage` `SIZES` edit), the slashed zero V3 (fired by "S-16 art pack"; a font decision
for the maintainer) — each with `Trigger:`; S14-09 recorded as closed for `UI_ART` keys by the `SIZES` change).

### Success Criteria:

#### Automated Verification:

- `.claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; deliberate break (a wrong path in `CLAUDE.md`) → FAIL; restored
- Every follow-up entry has a `Trigger:` line; full local gate green

#### Manual Verification:

- [reviewer] Seam sweep: every name `CLAUDE.md` adds exists; `docs/human-checklist.md` untouched

---

## Phase 9: Loading screen art and its drawn fallback when cut — e2e (#15)

Driver: e2e
Driver why: risk #15 (the start must not hang or break when the loading pictures are slow or never come) exists only in the browser — queue order, `filecomplete` and the total cut are Phaser loader internals built in phase 5.

### Overview

New spec `tests/e2e/final-art-loading.spec.ts` in the `chromium-hook` project (`final-art-loading` added to
`ROUND_SPEC` in `playwright.config.ts`).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/final-art-loading.spec.ts` (new); `playwright.config.ts` (`ROUND_SPEC`)

**Intent**:
(a) "#15 S-16c the loading screen shows the background and the emblem while the rest still loads": hold the room-art
routes (as `load-and-tab-guard.spec.ts` does), poll the hook until `loading.art` = `{ background: true, emblem: true }`
while `screen === 'loading'`, release, the game reaches the welcome screen.
(b) "#15 S-16c loading pictures that never answer leave the drawn screen and the game starts at the limit":
`?e2eArt=stallall` (reduced limits) plus a hanging route for `assets/ui/loading-*`; `loading.art` stays both false,
phase reaches `over`, `bootLoad.creates === 1`, welcome screen appears.

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; hook read-only; Chromium not available in agent
sessions: request-file protocol — `e2e-request-p9.md` + `e2e-break-p9a.patch` (→ (a) red), `e2e-break-p9b.patch` (→ (b)
red: the loading art outside the cut blocks the start); `STATUS: BLOCKED — e2e needs orchestrator run (request file
written)`; each expected-red test run alone (`-g`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/final-art-loading.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2`
- Deliberate break p9a → (a) red; restored; meta-check: proves the screen received the art, not how it looks (visual 5)
- Deliberate break p9b → (b) red; restored
- Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

---

## Phase 10: MONEY_PAY with the six-place wallet by touch — e2e (#11)

Driver: e2e
Driver why: risk #11 (a payment task played to the end by touch) with the new wallet exists only in the browser — drag over the art, the full-wallet refusal and the touched-cell hole are built in phases 1 and 4.

### Overview

New spec `tests/e2e/final-art-wallet.spec.ts` (`chromium-hook`, added to `ROUND_SPEC`).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/final-art-wallet.spec.ts` (new); `playwright.config.ts`; `tests/e2e/support/hook.ts` (new helper
`holdTouch(page, from, to): Promise<{ release(end: Point): Promise<void> }>` — one CDP session: `touchStart`, moves past
`startDistance`, returns while the finger is down; `release` moves to `end` and sends `touchEnd`, then detaches; plan review F3)

**Intent**:
(a) "#11 S-16c six coins fill the wallet art, a seventh flies back and the tray dims": `?e2eVariant=off&e2eSkills=E1.11.money_pay_10`
(parent path and stage pair as in `money-pay.spec.ts`); `coins.walletArt === 'art'`; drag six 1-zł coins → `wallet`
length 6, `full === true`; a seventh drag → length stays 6; take one out → `full === false`.
(b) "#11 S-16c lifting the first of two equal coins leaves its own place empty": two 2-zł coins, start a drag on the
FIRST coin's target (index 0; `lastIndexOf` would hide index 1) and hold mid-way with a new support helper; the hook's
`coins.coins` (drawn cells) still holds the point of cell 1 and not that of cell 0; release outside the wallet → wallet length 1.
(c) "#11 S-16c without the wallet picture the drawn wallet still pays": `page.route('**/assets/ui/wallet-open.webp', abort)`
→ `walletArt === 'drawn'`; `answerRight` pays and earns a star.

**Contract**: as phase 9; patches `e2e-break-p10a.patch` (→ (b) red), `e2e-break-p10b.patch` (→ (c) red),
`e2e-break-p10c.patch` (`maxTotal` 10 → (a) red). Hook `coins.coins` must list drawn cells only (phase 4 contract).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/final-art-wallet.spec.ts tests/e2e/money-pay.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 3`
- Deliberate break p10a → (b) red; p10b → (c) red; p10c → (a) red; each restored; meta-check: (a) proves the cap in the real touch path, not just the reducer
- Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

#### Manual Verification:

- [human] iPad: paying with the finger on the wallet art feels right for a 6-year-old (place size, full-wallet dim)

---

## Phase 11: Room-done miniature and its thumbnail fallback — e2e (#16 / FR-019)

Driver: e2e
Driver why: risk #16 / FR-019 (the last purchase shows "Pokój gotowy!") with the tile's picture choice depends on textures loaded in the browser — built in phases 3 and 6.

### Overview

New spec `tests/e2e/final-art-room-done.spec.ts` (`chromium-hook`, added to `ROUND_SPEC`).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/final-art-room-done.spec.ts` (new); `playwright.config.ts`

**Intent**: reach "Pokój gotowy!" as `room-change.spec.ts` "FR-019 …" does (`?e2eStars=`):
(a) "FR-019 S-16c the done card shows the child's own salon" → `room.doneMiniature === 'live'`;
(b) "FR-019 S-16c with salon pictures missing the done card shows the pack thumbnail" → `?e2eArt=room` → `'thumbnail'`;
(c) "FR-019 S-16c with the thumbnail missing too the drawn miniature stays" → `?e2eArt=room` + abort route for
`assets/ui/salon-after.webp` → `'drawn'`; in all three "Dalej" closes the card.

**Contract**: as phase 9; patch `e2e-break-p11a.patch` (→ (b) red).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/final-art-room-done.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 3`
- Deliberate break p11a → (b) red; restored; meta-check: proves the choice of picture, not its look (visual 6)
- Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

---

## Testing Strategy

### Unit Tests:

- `coinLayout` on drop centres, `liftedSlot`, `walletFull`, `balance.coinDrag` pin, MONEY_PAY feasibility under the cap.
- `UI_ART` ⇔ files (sizes), `ICONS` 15, `TASK_ART` 41; `firstLoaded`, `miniatureMode`, `neededMiniatureKeys`; app-icon PNG sizes and manifest paths.

### Integration Tests:

- `npm run build` (precache lists the new files, hook guard); `sample` E1–E6; e2e phases 9–11 (eight tests, six break
  patches); existing `money-pay`, `load-and-tab-guard`, `salon-load-health`, `room-change`, seed green at every gate.

### Manual Testing Steps:

1. [visual] Wallet (phase 4), loading screen (5), unlock card and room-done tile (6) at 1440 and 1024.
2. [human] iPad: home-screen icon, maskable crop (7); paying on the wallet by finger (10).

## Performance Considerations

Boot queue +151 014 B (WebP) → ≈ 2.08 MB, ≈ 41.6 s at 50 KB/s, under `totalMs` 45 s; the loading pictures are requested
first. Precache +≈ 0.15 MB WebP + ≈ 0.52 MB PNG icons (not in the boot queue). Six wallet images instead of ten.

## Migration Notes

None: save format v3 unchanged; no new storage key.

## Known risks

- **Loading art arrives late** on a slow first start (requested first, not guaranteed first): the drawn screen shows
  until it does — acceptable, proven by phase 9 (b).
- **Background upscaled 2×** (960 → 1920) may look soft; it is a blurred salon by design — visual gate decides, the
  script size is one constant.
- **Full-wallet dim** is our own signal (gap 115); a child may still try a seventh coin — it flies back, no penalty.
- **Wallet reaches the bar zone** (wallet bottom 905, feedback bar 864–960): the bar draws above by creation order
  (plan review F5); a later `setDepth` on the wallet would hide the hint bar — visual 4.4 checks it.
- **`payCoins` helper** waits for the wallet length to grow; any future spec paying 7+ coins would hang — the phase-1
  spec fix documents the cap.

## References

- Research `context/changes/final-art-p2/research.md`; change `context/changes/final-art-p2/change.md`
- Roadmap `context/foundation/roadmap.md` `### S-16c`; PRD FR-026, FR-019; `Martynka-urzadza.md` (art naming)
- Contract `context/runs/2026-10-15-fix-s16bcd/agent-contract.md` § S-16c; profile `context/foundation/autonomous-run.md` § 2, § 6, § 8, § 9
- Test plan `context/foundation/test-plan.md` risks #8, #11, #15, #16; `context/foundation/test-stack.md` § E2E
- Format example `context/archive/2026-10-16-final-sound/plan.md`; loader pattern `context/archive/2026-10-15-load-and-tab-guard/plan.md`
- Follow-ups: `context/archive/2026-10-15-final-art-salon/follow-ups/review-fixes.md` (F2, F3, wallet/book/loading art),
  `context/archive/2026-10-15-load-and-tab-guard/follow-ups/review-fixes.md` (impl-review F3, A-10),
  `context/archive/2026-10-15-e1-shapes-picture-mode/follow-ups/review-fixes.md` (`CoinWallet.paint`)
- Pack (read-only, never committed): `designs/martynka-salon-v2/manifest.json` (`app`, `loading`, `learning`, `thumbnails`, `icons`)

## Autonomous decisions

1. **[human] Wallet cap 10 → 6 coins** (`balance.coinDrag.maxTotal`), decoupled from `ART_LIMITS.moneyItems` (10).
   Content change for **`E1.11.money_pay_10`** and **`E2.2.money_pay_20`**, variant **`pay`** only: a wallet of 7–10
   pieces is no longer accepted (and cannot be laid) — e.g. 7–10 zł in 1-zł coins in E1, 20 zł in ten 2-zł coins or 15 zł
   as 5 + ten 1-zł in E2. Unchanged: amounts (E1 2–10 zł, E2 3–20 zł), trays, prompts, hints, the model answer (fewest
   wallet, ≤ 3 pieces in E1, ≤ 4 in E2), the `fewest` variant. Teacher read in phase 1. Rejected: coins beyond the six
   centres (no room in the art), a 5×2 grid inside the art (≈ 80 px coins, under the 96 px target). Would change: the
   teacher read finding that paying in 1-zł coins up to 10 zł must stay possible, or the author delivering a 10-place wallet.
2. **[human] `salon-before` thumbnail dropped** (roadmap says "miniatury przed/po"). Live miniature kept, `salon-after`
   only as the fallback. Why: no screen lists a not-done room, and the card should show her own choices (S-16d slots appear
   for free). Would change: the author asking for the fixed pack picture, or a room list with not-done rooms.
3. **[human] Boot total limit kept at 45 s** (`balance.loader.totalMs`), comment recomputed: 2 077 722 B ≈ 41.6 s at
   50 KB/s. Rejected: raising it (a longer frozen bar in the stalled-server case A-1 is about, for ≈ 3 s of slack the cold
   start already has). Would change: the precache or boot queue growing past ≈ 2.2 MB (S-16d adds salon art) or a field
   report of stand-ins on a first start.
4. **Wallet geometry**: art × 1.25 (800×525 at 308,380), coin box 144 × 104 on the scaled drop centres, `coinGap` 6.
   Why: ≥ 96 px touch target with margin; inside the notebook and clear of the tray. Would change: the visual gate.
5. **Full-wallet signal = dimmed tray** (new gap 115). Rejected: a sound (S-16b has no "full" cue), a text line (reads as
   an error). Would change: author art for a full wallet or playtest S-17.
6. **Loading art in the one boot queue, requested first**, redrawn on `filecomplete` (research option c). Rejected: scene
   `pack` / pre-boot scene (outside the per-file timeout and the total cut). Would change: Phaser giving pack files a timeout.
7. **Background 960×540, emblem 300²** (30.6 KB + 18.7 KB vs 116.7 KB). Would change: visible softness at the visual gate.
8. **Non-task pictures in their own `UI_ART` table**, not counted in "Obrazki". Why: `artHealth(TASK_ART)` feeds
   `artFilter`; a missing wallet must not skip MONEY_PAY. Would change: a parent need to see UI art health (then L-6/L-8/F4 join).
9. **Notebook fallbacks: notebook → book icon → book stand-in box.** Would change: nothing likely; the book icon is shipped.
10. **New icons only in `ICONS`** (COUNT, COMPARE_QTY, ORDINAL, CHOOSE_OP picture), not `PLATE_ICONS` / `SCALE_ITEMS`.
    Would change: the teacher read finding a prompt that reads badly with one of them.
11. **App icons via cwebp lossless + dwebp**, `npm run icons` repointed (placeholder encoder removed); no `globIgnores`.
    Rejected: `sips` (fails in the sandbox, RGBA, larger). Would change: libwebp missing on the build machine.
12. **Follow-ups taken**: impl-review F3 (slow timer elapsed), F3 (`progress` listener), A-10 (log once), F2 (miniature,
    by the thumbnail fallback), `CoinWallet.paint` lifted cell. Carried: A-3/A-4/S14-08, `FontFace`, per-file timeout test,
    art-health set, atlas — their symbols are not edited. Fired but deferred (plan review F4): three `Rect` types (phase 1
    edits `dragLayout`; unifying them touches `pictureLayout` and every widget, a refactor outside an art slice); `ArtPool` /
    `fitRect`, S14-10, ASL-02..09 and the coin stand-in label size (phase 2 edits only `ArtImage`'s `SIZES` lookup, not
    pooling, fitting or stand-in text); V3 slashed zero (needs a font decision, no font in the pack). S14-09 (a key outside
    `TASK_ART` drawn 1:1) is closed for the new keys by `SIZES` from `UI_ART`. Would change: a phase having to edit those
    symbols anyway.
13. **Phases 1–3 `tdd`, 4–8 `impl`, 9–11 `e2e`** (contract: pure logic test-first; e2e after the phases that build it;
    risks #11, #15, #16). Driver per phase as above.
14. **Plan written in English** like `change.md` and `research.md` of this slice; commit messages in Polish (profile § 1).
    Would change: a maintainer rule for Polish plans.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Six-place wallet — cap, drop-centre layout, lifted cell, full wallet (pure logic)

#### Automated

- [x] 1.1 New/changed tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N` — afac8e1
- [x] 1.2 Deliberate break: `maxTotal` 10 / box without `coinGap` / `liftedSlot` always `lastIndexOf` → red; restored; meta-check (geometry, not drawing) — afac8e1
- [x] 1.3 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`) — afac8e1
- [x] 1.4 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`, `money-pay.spec.ts` green — orchestrator note: full e2e after afac8e1, 109 passed (--workers=4)

#### Manual

- [ ] 1.5 [reviewer] Teacher read of E1.11 / E2.2 recorded; `ART_LIMITS.moneyItems` still 10; no number in `core` that belongs in `balance`/`layout`

### Phase 2: Art files and tables — UI art, three counting icons

#### Automated

- [x] 2.1 New/changed tests red before conversion (assertion on missing file / length), green after; unit `<branch baseline> + N` — 1dd8fb1
- [x] 2.2 `npm run art` twice → `git status --porcelain public/` unchanged after the second run — 1dd8fb1
- [x] 2.3 Deliberate break: delete `wallet-open.webp` / drop `sticker` from `ICONS` → red; restored; meta-check (tables vs files) — 1dd8fb1
- [x] 2.4 Full local gate green; `dist/sw.js` lists `assets/ui/loading-background.webp` and `assets/tasks/icons/plate.webp` — 1dd8fb1

#### Manual

- [ ] 2.5 [reviewer] Nothing from `designs/` staged; `salon-before` not converted; teacher read E1–E3 recorded

### Phase 3: Fallback decisions — which picture to show (pure logic)

#### Automated

- [x] 3.1 New tests red before implementation (assertion), green after; unit `<branch baseline> + N` — 59ebc25
- [x] 3.2 Deliberate break: `miniatureMode` `live` when any key exists → red; restored; meta-check (rule only) — 59ebc25
- [x] 3.3 Full local gate green; build prints `e2e hook: absent (` — 59ebc25 (e2e: orchestrator note, full e2e after 59ebc25 108 passed + 1 known flake)

#### Manual

- [ ] 3.4 [reviewer] `src/core/artPick.ts` has no Phaser or browser globals (ESLint boundary)

### Phase 4: Wallet widget with the pack art

#### Automated

- [x] 4.1 Full local gate green; unit `<branch baseline> + 0`; build prints `e2e hook: absent (` — d56c3b2
- [x] 4.2 e2e (orchestrator) `<branch e2e baseline> + 0`, `money-pay.spec.ts` green — orchestrator note: full e2e after d56c3b2, 109 passed (--workers=4)
- [x] 4.3 Deliberate break: patches `e2e-break-p10a.patch` and `e2e-break-p10b.patch` written; meta-check in the handoff (proof in phase 10) — d56c3b2

#### Manual

- [ ] 4.4 [visual] MONEY_PAY E1 and E2 at 1440 and 1024: wallet art, six coins centred, 10 zł note fits, full wallet dims the tray, coins ≥ touch size; feedback bar above the wallet's lower edge
- [ ] 4.5 [reviewer] No number or text in the widget; DESIGN-GAP 115 row and comment

### Phase 5: Loading screen with background and emblem

#### Automated

- [x] 5.1 Full local gate green; build prints `e2e hook: absent (` (e2e part: orchestrator) — 3df2b56
- [x] 5.2 e2e (orchestrator) `<branch e2e baseline> + 0`, `load-and-tab-guard.spec.ts` and `salon-load-health.spec.ts` green — orchestrator note: full e2e after 3df2b56, 109 passed (--workers=4)
- [x] 5.3 Deliberate break: patches `e2e-break-p9a.patch` and `e2e-break-p9b.patch` written; meta-check in the handoff — 3df2b56

#### Manual

- [ ] 5.4 [visual] Loading screen at 1440 and 1024: background, emblem, title readable, bar and slow line
- [ ] 5.5 [reviewer] `progress` listener removed; `loaderror` listener untouched; `totalMs` comment numbers match the files

### Phase 6: Notebook on the unlock card, salon thumbnail fallback on "Pokój gotowy!"

#### Automated

- [x] 6.1 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator) `<branch e2e baseline> + 0` — 64932d6 (e2e run here: 109 passed, --workers=4)
- [x] 6.2 Deliberate break: patch `e2e-break-p11a.patch` written; meta-check in the handoff — 64932d6

#### Manual

- [ ] 6.3 [visual] Unlock card with the notebook; "Pokój gotowy!" live and (with `?e2eArt=room`) thumbnail, at 1440 and 1024
- [ ] 6.4 [reviewer] `drawRoomMiniature` untouched for the live path; no new text or numbers in widgets

### Phase 7: App icons from the pack

#### Automated

- [x] 7.1 `npm run icons` twice → no diff in `public/icons`, `public/favicon.png` — fcaa3dc
- [x] 7.2 Deliberate break: `icon-192.png` replaced by the 512 file → `tests/appIcons.test.ts` red; restored; meta-check (sizes and paths, not launcher crop) — fcaa3dc
- [ ] 7.3 Full local gate green; `dist/sw.js` lists `icons/icon-512.png`; manifest icon paths unchanged

#### Manual

- [ ] 7.4 [human] iPad home-screen icon; Android maskable crop keeps the content in the safe circle

### Phase 8: Documentation, design gaps, follow-ups

#### Automated

- [x] 8.1 `validate-rule-files.sh` PASS; deliberate break in `CLAUDE.md` → FAIL; restored — SHA
- [x] 8.2 Every follow-up entry has a `Trigger:` line; full local gate green (lint, typecheck, unit 3061; docs only, no build/e2e change) — SHA

#### Manual

- [ ] 8.3 [reviewer] Seam sweep: every name `CLAUDE.md` adds exists; `docs/human-checklist.md` untouched

### Phase 9: Loading screen art and its drawn fallback when cut — e2e (#15)

#### Automated

- [ ] 9.1 `npx playwright test tests/e2e/final-art-loading.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2`
- [ ] 9.2 Deliberate break p9a → (a) red; restored; meta-check (art received, not its look)
- [ ] 9.3 Deliberate break p9b → (b) red; restored
- [ ] 9.4 Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

### Phase 10: MONEY_PAY with the six-place wallet by touch — e2e (#11)

#### Automated

- [ ] 10.1 `npx playwright test tests/e2e/final-art-wallet.spec.ts tests/e2e/money-pay.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 3`
- [ ] 10.2 Deliberate break p10a → (b) red; p10b → (c) red; p10c → (a) red; each restored; meta-check (cap in the real touch path)
- [ ] 10.3 Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

#### Manual

- [ ] 10.4 [human] iPad: paying with the finger on the wallet art feels right for a 6-year-old

### Phase 11: Room-done miniature and its thumbnail fallback — e2e (#16 / FR-019)

#### Automated

- [ ] 11.1 `npx playwright test tests/e2e/final-art-room-done.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 3`
- [ ] 11.2 Deliberate break p11a → (b) red; restored; meta-check (choice of picture, not its look)
- [ ] 11.3 Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed
