---
date: 2026-10-16T03:46:50+02:00
researcher: Claude (autonomous run 2026-10-15-fix-s16bcd, research step)
git_commit: f0fd66a372c151295604a7d6293633eccf0d364c
branch: feat/final-art-p2
repository: Martynka-urzadza
topic: "S-16c final-art-p2: how to bring the salon-v2 P2 art (app icon, loading screen, room thumbnail, wallet, notebook, plate/box/sticker icons) into the game"
tags: [research, art, BootScene, LoadingScreen, CoinWallet, RoomDoneCard, UnlockCard, ICONS, pwa-icons, precache]
status: complete
last_updated: 2026-10-16
last_updated_by: Claude (research step)
---

# Research: S-16c final-art-p2

**Date**: 2026-10-16T03:46:50+02:00 · **Git Commit**: f0fd66a (branch `feat/final-art-p2`, 1 commit on `main` c16734d) · **Repository**: Martynka-urzadza

## Research Question

The open questions of `change.md` (roadmap-claim table) and the step prompt: (1) wallet with 6 drop centres vs up to 10 coins; (2) loading-screen art bootstrap and fallback under the A-1 total limit; (3) room-done miniature: pack thumbnail vs the child's own look, F2 z-order; (4) unlock-card notebook; (5) plate/box/sticker in `ICONS` and their effect on every icon-drawing generator; (6) which local tool makes the PNG app icons without new native deps, and manifest/precache changes; (7) measured WebP sizes with the `npm run art` settings.

No lessons file exists (`context/foundation/lessons.md` absent). No product code was changed; conversions were made only in the session scratchpad.

## Summary

| Question | Answer (recommendation) |
|---|---|
| Wallet | **Cap the coins a child can lay in the wallet at 6** (one per pack `dropCenters` entry) through `balance.coinDrag.maxTotal`, decoupled from `ART_LIMITS.moneyItems` (stays 10 for MONEY_COUNT drawings). No generator amount changes: the fewest-coin answer needs at most 3 coins in E1 and 4 in E2, so every task stays payable; only "pay" wallets of 7–10 coins (e.g. ten 1-zł coins) become unreachable. Laying coins beyond the centres has no room in the art, and scaling the grid shrinks coins below the touch size. |
| Loading screen | **Queue `loading/background` and `title-emblem` FIRST in the existing one boot queue** and redraw `LoadingScreen` on their `filecomplete` events; the drawn screen is the stand-in until (or unless) they arrive. Rejected: a scene `pack` / pre-boot scene (no per-file timeout, outside the `totalMs` cut). Background as WebP 960×540 = 30.6 KB (1920×1080 = 70.2 KB). |
| Room-done tile | **Keep the live `drawRoomMiniature`** (the child's own chosen variants; S-16d slots appear in it for free); use `thumbnails/salon-after` as the **fallback when any miniature piece texture is missing** — this closes follow-up F2 without per-piece stand-in depths. `salon-before` has no place in today's UI; do not ship it. |
| Notebook | New non-task art key for `learning/skill-notebook` (400² = 2× the 200 px `UNLOCK_LAYOUT.art.size`, 17.9 KB WebP); `UnlockCard` swaps `ART_KEYS.icon('book')` for it; the book icon stays as stand-in-of-a-stand-in only if the plan wants it. |
| Icons | Add `plate`, `box`, `sticker` to `ICONS` → picked automatically by COUNT, COMPARE_QTY, ORDINAL, CHOOSE_OP-with-picture; **not** to `SCALE_ITEMS` (MASS) nor `PLATE_ICONS` (MULT_GROUPS). Nouns exist; teacher read of E1–E3 needed after the change. `TASK_ART` grows 38 → 41 (tests pin 38). |
| App icons | **`cwebp -lossless -exact -resize` then `dwebp` (PNG is its default output)** — the same libwebp binaries `npm run art` already needs, deterministic (identical md5 on re-run), works inside the agent sandbox. `sips` fails in the sandbox (writes its temp file to `/var/folders`) and gives RGBA files ~33 % larger. Manifest paths stay; regular icon also feeds apple-touch 180 and favicon 48. |
| Weight | New boot-queue WebP ≈ 177–204 KB; new app-icon PNGs ≈ 530 KB (precached via the `png` glob, not in the boot queue). The boot queue then sits at about the `totalMs` 45 s budget at 50 KB/s — the plan must recompute the `balance.loader` comment and decide on `totalMs`. |

## Detailed Findings

### 1. Wallet: 6 drop centres vs up to 10 coins

- Pack: `manifest.json` `learning.wallet` = `wallet-open.png` 640×420, `coinDiameter` 72, `dropCenters` [[200,160],[320,160],[440,160],[200,248],[320,248],[440,248]] — exactly 6 (README "miejsce na sześć monet"). Horizontal pitch 120 px, vertical 88 px (native).
- Today: `balance.coinDrag.maxTotal` = 10 (`src/data/balance.ts` `balance.coinDrag`); `TASK_LAYOUT.coinDrag` uses `wallet: DRAG_MAT` (944×460 at 236,380) with `columns: 5, rows: 2` (`src/data/layout.ts` `TASK_LAYOUT.coinDrag`, `DRAG_MAT`); cell i at `i % columns`, `floor(i / columns)` (`src/core/round/dragLayout.ts` coin layout). Coins are drawn inset by `coinPay.coinInset` 10 from a 188×230 cell → about 168 game px today.
- The cap is enforced in 5 places (all read `balance.coinDrag.maxTotal`): `stepTrayDrag` refuses a put at `total(mat) >= maxTotal` (`src/core/trayDrag.ts`), `parseMoneyPayParams` and `walletCheck` (`src/core/tasks/generators/moneyPay.ts`), `validate.ts` (money_pay check), `canonicalInput.ts`. `CoinWallet` pools `ART_LIMITS.moneyItems` (10) `ArtImage`s (`src/ui/widgets/CoinWallet.ts` constructor); `MoneyTable` and `validateVisual` also use `ART_LIMITS.moneyItems` for MONEY_COUNT drawings — that constant must stay 10.
- Content: `E1.11.money_pay_10` (tray 1/2/5 zł, 2–10 zł) and `E2.2.money_pay_20` (1/2/5 zł + 10 zł note, 3–20 zł), variants `pay` and `fewest` (`src/data/curriculum/E1.ts`, `E2.ts`). `fewestCoins` (`src/core/coins.ts`) gives at most 3 pieces for E1 amounts (8 = 5+2+1, 9 = 5+2+2) and at most 4 for E2 (18 = 10+5+2+1, 19 = 10+5+2+2). The 'pay' variant accepts any sum-correct wallet of ≤ maxTotal pieces; no param forces more than 4 pieces — the 7–10-piece case exists only because each tray holds `coin-1zl`.
- Options weighed:
  - **Cap at 6 (recommended).** Each coin sits on an art drop centre; "full wallet" becomes visible (the [human] 9.6 note "pełny portfel bez sygnału" in the S-17 roadmap row); every amount stays payable (≤4 needed). For a 6-year-old, 6 bigger coins are easier to aim at and to count than 10 small ones; a child who tries to pay 10 zł in 1-zł coins hits a full wallet at 6 and must exchange — a teacher-acceptable nudge, but the teacher read must confirm the wording of the prompt and hint for that case.
  - Lay coins beyond the six centres: the art interior has no room for a second set (picture above); stacking hides the count the child must check.
  - Use the art as a frame around a 5×2 grid: interior ≈ 400×200 native → coins ≈ 80 game px, smaller than today and than the 96 px touch target used for the clock handle (`balance.clockSet` comment).
- Coin size with the art: the wallet fitted to `DRAG_MAT` height scales 460/420 ≈ 1.095, so the 88-px vertical pitch gives ≈ 96 game px coins (the manifest 72 → ≈ 79). Coins shrink from ≈ 168 px today; the plan may enlarge the wallet area beyond `DRAG_MAT` — a layout decision for the visual gate.
- Open for the plan: the E2 tray has `note-10zl` (384×256 art); in a 96-px coin centre it must be drawn scaled to fit and may overlap a neighbour.
- Follow-up in scope (same file): `CoinWallet.paint` hides the LAST coin of the lifted kind (`list.lastIndexOf`) while `matAt` grabs the touched cell (`context/archive/2026-10-15-e1-shapes-picture-mode/follow-ups/review-fixes.md`). With fixed drop centres the plan should hide the touched slot.

### 2. Loading screen art

- Boot today: one queue in `BootScene.preload` (`src/scenes/BootScene.ts`): font (`this.load.font`), 38 `TASK_ART` images, 12 boot sounds (`queueSounds`), 26 `ROOM_ART` images — 77 files. Per-file timeout set by a `Loader.Events.ADD` listener copying `this.load.xhr.timeout`; `balance.loader = { timeoutMs: 12000, maxRetries: 1, slowAfterMs: 8000, totalMs: 45000 }`; slow timer and cut timer (`cutLoad`, `src/scenes/loaderCut.ts`) cleared on `once(COMPLETE)`; pure rule `bootLoadPhase` / `checkBootLimits` in `src/core/bootLoad.ts`.
- `LoadingScreen` (`src/ui/widgets/LoadingScreen.ts`) draws an ivory rect, `pl.loading.title`, a bar (`progress`) and `slow()`; layout `LOADING_LAYOUT` title y 450, bar top 580, slow line y 680.
- Options:
  - (a) Scene `pack` or a pre-boot scene: pack files load before `preload`, so the ADD timeout listener and the `totalMs` cut do not cover them; Phaser's default xhr timeout is 0, so a hanging pack file could block boot (the very A-1 failure). Rejected.
  - (b) Two passes (`load.start()` again from `create`): restructures `create` (health, hand-over, `creates` guard) and the `once(COMPLETE)` timer cleanup. Rejected as invasive.
  - (c) **Recommended**: add the two images first in the same queue; on `filecomplete-image-<key>` the `LoadingScreen` shows the background behind and the emblem above the title. The one cut, the per-file timeouts and the `creates` guard stay; a missing/cut picture leaves today's drawn screen. Queue order means "requested first", not "finished first".
- Keys must live in their own table (not `TASK_ART`): `artHealth(TASK_ART, …)` takes `total = entries.length` and feeds `missingIds` into `src/core/round/artFilter.ts`, and the `?e2eArt=missing` seam skips `TASK_ART` keys.
- Follow-ups fired here: impl-review F3 (slow-line timer asks `bootLoadPhase(limits.slowAfterMs, limits)` with the constant, `context/archive/2026-10-15-load-and-tab-guard/follow-ups/review-fixes.md`), F3 (the `progress` listener is never removed, `context/archive/2026-10-15-final-art-salon/follow-ups/review-fixes.md`), A-10 (progress bar that cannot draw logs every event — fires only if the progress handler is touched; with option (c) the redraw path is new, so the plan should take it).
- E2E: `tests/e2e/load-and-tab-guard.spec.ts` uses `?e2eArt=stallall`, holds routes, polls `snapshot().loading.phase` and checks `bootLoad.cut` and `creates == 1`; nothing reads the loading screen's pixels. The seams are `missing|corrupt|room|stall|stallall` (`src/testing/e2eHook.ts`, marker `e2eArt` in `vite/e2eHookGuard.mjs`).
- Emblem: 600² alpha, no title in the picture (`loading.titleRenderedByGame: true`). Its displayed size is not set anywhere yet (the title sits at y 450); at 1920 virtual width a 1× picture already matches a 2048-px-wide tablet, so ship at the displayed size (300 → 18.7 KB, 600 → 46.5 KB).

### 3. Room-done miniature

- `RoomDoneCard.show` → `drawRoomTile` draws `drawRoomMiniature` at `ROOM_DONE_LAYOUT.tiles.thumbScale` 0.13 (1920×1080 → ≈ 250×140) plus a check mark; `drawTeaserTile` is the "Wkrótce" tile (`src/ui/widgets/RoomDoneCard.ts`). `drawRoomMiniature` (`src/ui/widgets/RoomView.ts`) iterates `miniaturePieces(room, state)`; missing pieces become `drawStandIn` on one shared `Graphics` under all images — follow-up F2 ("a sofa stand-in sits under the rug picture").
- Pack thumbnails: 480×270 (≈ 1.9× the 250×140 tile) show a fixed look (turquoise sofa, curtains, plants) — not the child's variant choices.
- Recommendation: keep the live miniature (the card celebrates *her* salon; S-16d's five new slots appear without new art), and draw `salon-after` instead whenever any miniature texture is missing (one check over `miniaturePieces` with `textures.exists`); if that thumbnail is missing too, today's stand-in drawing remains. This removes the F2 case where it matters. `salon-before` would need a not-done room list, which no screen has; leave it out (25.1 KB saved). This narrows the roadmap claim "miniatury przed/po" — recorded as an autonomous decision.
- Tests: `tests/roomMiniature.test.ts` (pure `miniaturePieces`), `tests/rooms.test.ts` (`roomDone`), `tests/e2e/room-change.spec.ts`; nothing tests stand-in z-order.

### 4. Unlock-card notebook

- `UnlockCard` creates `this.book = new ArtImage(scene)` and shows `ART_KEYS.icon('book')` at `UNLOCK_LAYOUT.art` (200×200 at centre x 960, top 461) (`src/ui/widgets/UnlockCard.ts`; DESIGN-GAP row 22). Stand-in label comes from `TASK_ART.label` via the `SIZES` map in `src/ui/widgets/ArtImage.ts` — a new non-task key needs a label/size entry where `ArtImage` can find it (plan: extend `ArtImage`'s lookup or a parallel UI-art table).
- `skill-notebook.png` 400² alpha → 400 WebP = 17.9 KB (2× display); 256 = 10.2 KB.

### 5. Plate, box, sticker icons

- `ICONS` (`src/data/measures.ts`) has 12 `{ id, noun }`; `PLATE_ICONS` = apple, pear, croissant; `SCALE_ITEMS` 9 icons with grams; `TASK_ART` maps every `ICONS` entry to `icons/<id>.webp` 256² (`src/data/taskArt.ts`).
- Consumers that draw from all of `ICONS` (pick up new ids with no code change): COUNT (`rng.pick(ICONS)`, "Ile jest naklejek?"), COMPARE_QTY ("Gdzie jest więcej pudełek?"), ORDINAL (`rng.shuffle(ICONS).slice`, nominative "pudełko"), CHOOSE_OP picture ("Na stole były 4 talerze. Dołożono 2."; `chooseOp.ts` already avoids a < 2 so the gendered past tense is safe). Fixed lists, unaffected: MULT_GROUPS (`PLATE_ICONS`; frame noun `talerzyk`), MASS (`SCALE_ITEMS`). Not icon users: PATTERN, MONEY_*.
- `validateVisual` checks ids against `ICONS`, `describeVisual` prints ids — no change needed.
- Nouns present: `talerz`, `pudełko`, `naklejka` with three forms each (`src/data/nouns.ts`).
- Teacher-read notes: keep the three out of MASS ("Ile waży naklejka?" is absurd at the scale's 100 g+ range); do not put `plate` into `PLATE_ICONS` ("plates on plates"); `plate` art as the MULT_GROUPS group frame (design gap 62) is possible but changes `IconGroups` — out unless the plan chooses it. After adding, run `npm run sample -- E1|E2|E3 --count 6` and read every task with "talerzy/pudełek/naklejek" (CLAUDE.md working rule).
- Seeded outputs shift (longer pick arrays) but no test pins concrete tasks; tests to update: `tests/measures.test.ts` ("12 icons" + exact id list), `tests/taskArt.test.ts` (`toHaveLength(38)` → 41, plus file-on-disk checks), optionally `tests/artHealthText.test.ts` ("z 38 obrazków" literal). "Obrazki" will read "z 41".
- Script: `scripts/make-task-art.mjs` takes `icons` from `designs/martynka-maths-A-v1/assets/icons`; plate/box/sticker exist only in `designs/martynka-salon-v2/assets/icons` — the script needs a second source dir for them (and for the P2 files).

### 6. App icons (PNG)

- Today: `scripts/make-icons.mjs` draws placeholder icons with a pure-JS PNG encoder (`encodePng`, `deflateSync`) into `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon-180.png` and `public/favicon.png` (48); `vite/config.shared.mjs` `pwaOptions.manifest.icons` lists 192, 512, maskable 512; `includeManifestIcons: false` because the `png` glob precaches them; `index.html` links `/favicon.png` and the 180 apple-touch icon.
- Tools checked on this Mac: `sips` (/usr/bin), `cwebp`/`dwebp` 1.1.0 (/usr/local/bin) present; `magick`, `convert`, `pngquant`, `optipng`, `oxipng`, `zopflipng`, `pngcrush` absent; no image package in `node_modules` (`@napi-rs` holds only an lzma optional dep).
- `sips -s format png -z …` inside the sandbox fails ("Cannot write to file /var/folders/…", ignores `TMPDIR`); outside the sandbox it works but writes RGBA (512² = 429 602 B).
- **`cwebp -quiet -lossless -exact -resize N N <src> -o x.webp` + `dwebp -quiet x.webp -o out.png`** works in the sandbox, writes 8-bit RGB PNG (sources are fully opaque: 0 non-opaque pixels in both 1024² icons), and is deterministic (two runs, same md5). A pure-JS re-encode of the same pixels (PAM via `dwebp -pam`, Paeth filter, deflate 9) gives 323 282 B vs dwebp's 323 406 B for 512² — no gain, so dwebp's PNG is fine.
- Measured: icon-512 323 406 B, icon-192 53 585 B, apple-touch-180 47 808 B, favicon-48 5 046 B (from `app-icon.png`), maskable-512 100 269 B (from `app-icon-maskable.png`). Total 530 114 B vs ≈ 13 KB of placeholders today.
- Recommendation: the art script (or `make-icons.mjs` rewritten as the converter) produces the five PNGs; `npm run icons` is retired or repointed; the CLAUDE.md line "Placeholder app icons … `npm run icons`" must be updated. apple-touch 180 from the regular (full-bleed, opaque) icon — iOS rounds the corners itself. Manifest entries keep their paths; adding `purpose: 'any'` to the regular ones is optional. Optional saving: `globIgnores` for `icons/icon-512.png` (browsers fetch manifest icons themselves) — the plan decides; the 10 MiB per-file limit is far away.

### 7. Measured WebP sizes (`-q 85 -alpha_q 100 -m 6`, as `convert` in `scripts/make-task-art.mjs`)

| File | Output | Bytes |
|---|---|---|
| loading/background 1920×1080 | full | 70 170 |
| | 960×540 | 30 614 |
| loading/title-emblem 600² | full | 46 506 |
| | 300² | 18 674 |
| thumbnails/salon-after 480×270 | full | 24 262 |
| thumbnails/salon-before 480×270 | full | 25 132 |
| learning/wallet-open 640×420 | full | 27 874 |
| learning/skill-notebook 400² | full | 17 862 |
| | 256² | 10 156 |
| icons/plate, box, sticker 512² | 256² each | 10 596 / 11 878 / 9 254 |

Recommended set (bg 960, emblem 300, after, wallet, notebook 400, three icons): 30 614 + 18 674 + 24 262 + 27 874 + 17 862 + 31 728 = **151 014 B** added to the boot queue; with bg 1920 and emblem 600: 217 852 B.

### 8. The A-1 total limit

- The `balance.loader` comment budgets ≈ 1.9 MB (64 WebP + font) + 132 KB of boot sounds at 50 KB/s against `totalMs` 45 000 (≈ 41 s). Adding ≈ 0.15–0.22 MB brings the cold first start to ≈ 44–45 s at 50 KB/s — at the limit. Past it, the game starts with stand-ins and the service-worker cache serves the next start, so nothing breaks, but the plan must update the comment and either raise `totalMs` (keeping it above the 24 s single-file worst case) or accept it. The app-icon PNGs are not in the boot queue (only precache).
- Precache today: `public/assets` ≈ 2.86 MB (rooms 1.25 MB, sounds 1.1 MB, tasks 0.5 MB), `public/icons` 20 KB. Delta ≈ +0.15–0.22 MB WebP + 0.52 MB PNG.

## Code References

- `src/scenes/BootScene.ts` `preload`, `queueSounds`, `create` — one boot queue, timers, health
- `src/ui/widgets/LoadingScreen.ts` `progress`, `slow`, `destroy`; `src/data/layout.ts` `LOADING_LAYOUT`
- `src/core/bootLoad.ts` `bootLoadPhase`, `checkBootLimits`; `src/scenes/loaderCut.ts` `cutLoad`
- `src/data/balance.ts` `balance.loader`, `balance.coinDrag`
- `src/ui/widgets/CoinWallet.ts` `paint`; `src/core/trayDrag.ts` `stepTrayDrag`; `src/core/coins.ts` `fewestCoins`, `walletList`; `src/core/tasks/generators/moneyPay.ts` `parseMoneyPayParams`, `walletCheck`; `src/data/layout.ts` `TASK_LAYOUT.coinDrag`, `DRAG_MAT`
- `src/ui/widgets/RoomDoneCard.ts` `drawRoomTile`; `src/ui/widgets/RoomView.ts` `drawRoomMiniature`, `miniaturePieces`
- `src/ui/widgets/UnlockCard.ts` (`ART_KEYS.icon('book')`); `src/ui/widgets/ArtImage.ts` `SIZES`; `src/data/layout.ts` `UNLOCK_LAYOUT`
- `src/data/measures.ts` `ICONS`, `PLATE_ICONS`, `SCALE_ITEMS`, `ART_LIMITS`; `src/data/taskArt.ts` `TASK_ART`; `src/core/artHealth.ts` `artHealth`
- `scripts/make-task-art.mjs` `JOBS`, `convert`; `scripts/make-icons.mjs` `ICONS`, `encodePng`; `vite/config.shared.mjs` `pwaOptions`; `index.html` icon links

## Architecture Insights

- New P2 pictures that are not task drawings (loading bg/emblem, notebook, wallet, thumbnail) belong in a separate data table so `TASK_ART`-driven health and the art filter are unaffected; each widget keeps its drawn look as the stand-in.
- Boot loading stays a single queue under one total limit (A-1); new files join it, ordered first where they are shown during loading.

## Historical Context (from prior changes)

- `context/archive/2026-10-15-final-art-salon/follow-ups/review-fixes.md` — F2 (miniature stand-in z-order), F3 (progress listener), wallet/book/loading art follow-ups: supported, still open.
- `context/archive/2026-10-15-load-and-tab-guard/follow-ups/review-fixes.md` — impl-review F3 (`bootLoadPhase` with the constant), A-10: supported, still open.
- `context/archive/2026-10-15-e1-shapes-picture-mode/follow-ups/review-fixes.md` — `CoinWallet.paint` last-coin gap and silent fly-back on a full wallet: supported, still open.
- `change.md` claim "app-icon.png 1024² opaque": supported (0 non-opaque pixels after decode; the PNG header has an alpha channel).

## Related Research

Not applicable beyond the archived changes above.

## Open Questions (for /10x-plan)

1. Wallet layout: wallet area size (keep `DRAG_MAT` or larger), coin diameter at the centres, how the 10 zł note fits a coin centre, and a full-wallet signal.
2. Background 960 vs 1920 and emblem display size (300 recommended).
3. `totalMs`: raise or keep, with the recomputed comment.
4. Whether `plate` becomes the MULT_GROUPS group frame (design gap 62) — not recommended in this slice.
5. Whether the new UI pictures are counted anywhere in "Obrazki" (recommended: no; L-6/L-8/F4/A-5 follow-ups stay out).
