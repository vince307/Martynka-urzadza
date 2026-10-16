---
change_id: final-art-p2
title: P2 art from the salon-v2 pack (app icon, loading screen, room thumbnails, wallet, notebook, counting icons)
status: preparing
created: 2026-10-16
updated: 2026-10-16
archived_at: null
---

## Notes

Roadmap slice **S-16c** (`### S-16c: Grafika P2 z paczki salon-v2`), third slice of autonomous run `2026-10-15-fix-s16bcd`. PRD ref: FR-026 (target art on the screens the daughter sees; "zero placeholders" on E3–E4 and the salon, the rest listed as missing art).

**Outcome:** the child sees the target app icon (regular and maskable, plus the iPad apple-touch icon and the favicon), a loading screen with the blurred-salon background and the title emblem (the title "Martynka urządza" stays drawn by the game), the salon thumbnails on the "Pokój gotowy!" card, the notebook on the "Nowa umiejętność!" card, the open wallet in MONEY_PAY tasks and the plate / box / sticker icons in counting tasks; the placeholders and design gaps this art covers are closed.

**Source:** the gitignored pack `designs/martynka-salon-v2` (`manifest.json` keys `app`, `loading`, `learning`, `thumbnails`, `icons`; files under `assets/app`, `assets/loading`, `assets/thumbnails`, `assets/learning`, `assets/icons/{plate,box,sticker}.png`). Converted through `npm run art` (`scripts/make-task-art.mjs`, extended; WebP for game textures). App icons are PNG in `public/icons/` (the web manifest and iOS need PNG) and replace the generated placeholders. Converted files are committed (author consent 2026-10-13); the pack, `.gitignore` and `.claude/` are never staged.

**Save format:** stays **v3**. Nothing here touches `SaveState`; frozen fixtures in `tests/fixtures/` stay byte-identical.

**Allowed outside the usual paths:** `vite/config.shared.mjs` (manifest icons) and `public/icons/` (app icons), `index.html` icon links, `scripts/make-icons.mjs` / `scripts/make-task-art.mjs`. The service-worker precache grows by every new file (globs already cover png and webp).

## Roadmap claims checked against the repo (main c16734d, branch feat/final-art-p2)

| Roadmap claim (plan time) | Repo now | Correction |
|---|---|---|
| App icon from the pack (regular + maskable) replaces the placeholders | `public/icons/{icon-192,icon-512,icon-maskable-512,apple-touch-icon-180}.png` + `public/favicon.png` are made by `scripts/make-icons.mjs` (pure-JS PNG encoder, no native deps; turquoise tile + star); `vite/config.shared.mjs` `manifest.icons` lists 192, 512, maskable 512; `index.html` links `/favicon.png` and the 180 apple-touch icon. Pack: `app-icon.png` 1024² opaque (1.78 MB), `app-icon-maskable.png` 1024² with content in the central 560² / 80 % circle (`manifest.app.safeCircle`, `contentBounds`) | none on intent; the slice must also produce the 180 apple-touch icon and the favicon (brief P2.1: "gra wytnie 512, 192 i 180"). New: the outputs are PNG, which `cwebp` cannot write, so the resize tool (macOS `sips`, a pure-JS PNG decode in `make-icons.mjs`, or another way) is a research/plan decision; `npm run icons` either becomes the converter or is retired. `CLAUDE.md` "placeholder app icons … come from `npm run icons`" becomes stale (not edited by this step) |
| Loading screen with background and emblem | `src/ui/widgets/LoadingScreen.ts` draws an ivory rectangle, the title and a bar (DESIGN-GAP row 105), plus the slow line (row 112); `BootScene.preload` creates it and queues every texture/sound in one queue under the total limit `balance.loader.totalMs` | partial: the loading art must itself load before the screen can show it (chicken and egg). Research decides how (a tiny first queue / Phaser scene `pack`, a separate pre-boot scene, or showing art once it arrives over the drawn screen) and that a missing/slow loading picture keeps today's drawn screen. Pack: `background.png` 1920×1080 (2.56 MB PNG), `title-emblem.png` 600² alpha, `titleRenderedByGame: true` |
| Room thumbnails before/after on "Pokój gotowy!" | `RoomDoneCard` draws the salon tile with `RoomView.drawRoomMiniature` (the room's own pictures in scale, the CURRENT chosen look; DESIGN-GAP row 108); the teaser tile is a padlock | open design question: the pack thumbnails (480×270 `salon-after`, `salon-before`) show a fixed look, not the child's choices. Research/plan decides: static `salon-after` thumbnail (cheap, matches brief P2.3) vs keep the live miniature, and where `salon-before` is used (nothing shows a not-yet-done room list today). Taking the thumbnail also ends follow-up F2 (stand-in z-order in `drawRoomMiniature`) |
| Open wallet in MONEY_PAY | `CoinWallet` draws the wallet as the block mat's dashed field with a 5 × 2 grid for up to `balance.coinDrag.maxTotal` (10) coins (DESIGN-GAP row 104); `E1.11.money_pay_10` (1/2/5 zł, up to 10 zł) can need 10 coins | **conflict**: the pack wallet (`wallet-open.png` 640×420) has exactly **6** drop centres (`manifest.learning.wallet.dropCenters`, coin diameter 72). Research must decide: cap the paid set at 6 coins (generator/params + balance), lay coins out beyond the six centres (a second row/stack), or use the art as a frame around the existing grid. Any generator/params change needs the teacher read |
| Notebook on "Nowa umiejętność!" | `UnlockCard` shows the counting icon `book` through `ArtImage` (DESIGN-GAP row 22, narrowed in S-16a) | none; pack `skill-notebook.png` 400² alpha replaces it |
| Plate, box, sticker icons in counting tasks | `ICONS` in `src/data/measures.ts` has 12 ids (cup … yarn) used by COUNT, MULT_GROUPS (`PLATE_ICONS`), COMPARE_QTY, CHOOSE_OP, ORDINAL and MASS (`SCALE_ITEMS`); `TASK_ART` builds from `ICONS`; art script converts 12 icons at 256² | partial: adding ids to `ICONS` reaches every icon-using generator, including MASS on the scale (a "naklejka" or "pudełko" with a mass may be odd) — research checks each consumer and whether the new icons join all of them or only counting. Pack also carries 12 more expansion icons (banana, strawberry …): out of scope |
| Risk: new nouns talerz, pudełko, naklejka in `src/data/nouns.ts` | **already present**: `nouns.talerz`, `nouns.pudełko`, `nouns.naklejka` (and `talerzyk`) exist with all three forms | correction: no new nouns needed; the teacher read is still required for every prompt that now shows them (`npm run sample -- E1..E3 --count 6` on the icon skills), including the accusative ("naklejkę") in prompts that use one |
| Risk: precache weight | today `public/assets/` ≈ 2.8 MB (rooms 1.2 MB, sounds 1.1 MB, tasks 0.5 MB); `public/icons` 20 KB; globs `**/*.{js,css,html,png,webp,…}`, 10 MiB per-file limit | none; new adds ≈ background + emblem + 2 thumbnails + wallet + notebook + 3 icons as WebP and 4–5 PNG icons. The plan sets output sizes (at most 2× displayed, as the art script's rule) and measures the delta; the 1024² sources must not be shipped as-is |
| Prerequisite S-16a | archived 2026-10-15; S-16b archived 2026-10-16 (#70, c16734d) | none. The loader total limit (`load-and-tab-guard` A-1) must cover the new files |

**Design gaps this art closes or narrows:** 22 (notebook on the unlock card), 104 (wallet; tray and drop look may stay partly code), 105 (loading art), 108 (room miniature). Possibly 62 (MULT_GROUPS group frame "stands for a plate") if research uses `plate` as the group frame — not assumed. Not covered: 20 (welcome sunflower/cushion; the pack has `cushion`/`flower` icons only), 112 stays (slow line keeps its text).

## Open follow-ups whose trigger this slice fires

| Follow-up (source) | Trigger | Take on scope |
|---|---|---|
| Wallet art for MONEY_PAY, design-gaps 104 (`2026-10-15-final-art-salon`, `2026-10-15-e1-shapes-picture-mode`) | the author delivers wallet art | **in scope** (core of the slice); the 6-centre conflict above |
| Loading screen drawn in code, fallback title font (`2026-10-15-final-art-salon`) | the author delivers loading art | **in scope** |
| Book on the unlock card is the counting icon (`2026-10-15-final-art-salon`) | the author delivers the book art | **in scope** |
| F2: `drawRoomMiniature` stand-ins under all pictures (`2026-10-15-final-art-salon`) | next change to `RoomDoneCard` or `drawRoomMiniature` | **in scope if** the card changes (it will): fix or remove with the thumbnail decision |
| impl-review F3: slow-line timer asks `bootLoadPhase` with the constant (`2026-10-15-load-and-tab-guard`) | next change to `BootScene.preload` timers, or **S-16c restyling the loading screen** | **in scope** (named explicitly) |
| F3: `BootScene` never removes its loader `progress` listener (`2026-10-15-final-art-salon`) | next change to `BootScene` | **in scope** (one line, `BootScene` will change) |
| A-10 progress bar that cannot draw logs every event (`load-and-tab-guard`) | next change to the `BootScene.preload` progress handler | **in scope only if** the progress handler is touched (likely with the loading art) |
| A-3 / A-4 / S14-08 loader error lines without URL/status/kind (`load-and-tab-guard`, `art-stand-in-and-load-signal`) | next change to the `loaderror` listener / `BootScene.preload` | **out unless** the plan touches the `loaderror` listener; logging work, not art. Carried forward with the same trigger |
| Font load without a limit (`FontFace`) (`2026-10-15-salon-load-health`) | next change to `BootScene.preload` | **out**: A-1's total limit already cuts a pending font (`cutLoad`); carried forward |
| Per-file timeout guarded only by e2e (`salon-load-health`) | next change to `BootScene.preload` | **out**: not touched; carried forward |
| `CoinWallet.paint` hides the LAST coin of a lifted kind (`e1-shapes-picture-mode`) | next change to `src/ui/widgets/CoinWallet.ts` | **in scope** (the file changes for the wallet) |
| L-6 / L-8 / A-5 / F4 / ASL-02..09 ("Obrazki" section, art health) | next change to `artHealthView.ts` / `artHealth.ts` / `ArtImage` | **out unless** research shows the new pictures must be counted in "Obrazki" (then L-6, L-8, F4 join) — decided in research |
| Texture atlas (`final-art-salon`); both sound formats precached (`final-sound`) | precache over budget | **out** unless the measured delta makes the precache a problem |
| Thermometer 0…+30 frame, SPATIAL scene, in-between backgrounds | the author delivers that art | **not fired**: salon-v2 has none of them |

## Autonomous decisions

- **Next step `/10x-research`, not `/10x-plan`**: the step prompt fixes it; the slice has open design questions (loading art bootstrap, wallet 6 vs 10 coins, thumbnail vs live miniature, which generators get the new icons, PNG resize tool). Would change: nothing, the run fixes the order.
- **Title and artifacts in English**, commit messages in Polish (profile § 1, archived changes). Would change: a maintainer rule for Polish change titles.
- **No new nouns planned** because `talerz`, `pudełko`, `naklejka` already exist in `src/data/nouns.ts`; the teacher read stays mandatory. Would change: research finding a missing form (e.g. a locative "na talerzu" the validator does not know) or a prompt needing another noun.
- **Wallet capacity left to research** rather than fixed here: capping MONEY_PAY at 6 coins changes content (E1.11 "pay 10 zł") and needs a teacher read; laying coins outside the art's centres keeps content. Would change: nothing at this step; research weighs both.
- **Follow-ups on loader logging (A-3/A-4/S14-08), font limit and art health kept out** unless the plan touches those exact symbols: they fire on "next change to …", and pulling them in would widen an art slice into observability. Would change: the plan editing `loaderror` or `artHealthView.ts` anyway — then they join.
- **Save format v3 unchanged, no new e2e seams assumed**: art is static. Would change: research needing an `?e2eArt=` variant for the new pictures (marker in `vite/e2eHookGuard.mjs`, proven absent from `dist/`).
