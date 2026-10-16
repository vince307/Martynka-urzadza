# Handoff — `final-art-p2` (slice S-16c)

Written by the `/10x-new final-art-p2` step of autonomous run `2026-10-15-fix-s16bcd`: the change identity exists, nothing is researched or planned yet. The next agent must not assume the roadmap's "new nouns" (they already exist) or that the pack wallet fits today's 10-coin MONEY_PAY (it has 6 drop centres) — both are corrected in `change.md`.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-p2`, cut from `main` at `c16734d` |
| Commits | 1 on the branch (this step: `docs(final-art-p2): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/final-art-p2/change.md` | change identity: outcome, source pack, save format v3, roadmap-claim table (repo now / correction), design gaps closed (22, 104, 105, 108; 62 possible), follow-ups fired with scope take, autonomous decisions |
| `context/changes/final-art-p2/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/final-art-p2` |
| `ls context/archive \| grep final-art-p2`, `ls context/changes` | no collision; change-id unique and kebab-case |
| Lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main c16734d: unit 3034 passed, e2e 109 passed — inherited, unverified) |
| Repo facts in `change.md` | observed in this step: `public/icons/*` + `scripts/make-icons.mjs`, `vite/config.shared.mjs` `manifest.icons`, `index.html` icon links, `src/data/nouns.ts` (`talerz`, `pudełko`, `naklejka` present), `src/data/measures.ts` `ICONS` (12 ids) / `PLATE_ICONS`, `balance.coinDrag.maxTotal` 10, `E1.11.money_pay_10` max 10, pack `manifest.json` `app`/`loading`/`learning`/`thumbnails`/`icons`, `du` of `public/assets/*` |

No deliberate break: nothing testable changed.

## 4. Next command

`/10x-research final-art-p2`

## 5. Open

Questions research must answer (all in `change.md`, roadmap-claim table):
- Loading art bootstrap: how `BootScene.preload` / `LoadingScreen` shows `loading/background` + `title-emblem` before the main queue, and falls back to today's drawn screen when they are missing or slow (total limit `balance.loader.totalMs`).
- Wallet: pack `wallet-open.png` has 6 `dropCenters`; `CoinWallet` lays out up to `balance.coinDrag.maxTotal` (10). Cap content (teacher read) or lay out beyond the centres.
- Thumbnail: static `thumbnails/salon-after` vs the live `RoomView.drawRoomMiniature`; any use for `salon-before`.
- New icons `plate`/`box`/`sticker`: which `ICONS` consumers get them (COUNT, MULT_GROUPS `PLATE_ICONS`, COMPARE_QTY, CHOOSE_OP, ORDINAL, MASS `SCALE_ITEMS`); teacher read on every changed step.
- App icons: PNG outputs (192, 512, maskable 512, apple-touch 180, favicon 48) from 1024² sources — tool choice (`sips`, pure-JS decode in `scripts/make-icons.mjs`); fate of `npm run icons`; `CLAUDE.md` line on placeholder icons goes stale.
- Precache delta measured; output sizes at most 2× displayed.

Follow-ups fired (table in `change.md`): in scope — wallet art (gap 104), loading art (gap 105), book art (gap 22), F2 `drawRoomMiniature`, load-and-tab-guard impl-review F3 (`bootLoadPhase` timer), final-art-salon F3 (`BootScene` progress listener), `CoinWallet.paint` last-coin gap; conditional — A-10 (progress handler), "Obrazki"/art-health set (L-6, L-8, F4, A-5, ASL-02..09); out, carried forward — A-3/A-4/S14-08, `FontFace` limit, per-file timeout test, atlas.

No DESIGN-GAP rows added at this step.

## 6. Autonomous decisions

- **Next step `/10x-research`** — chosen over `/10x-plan` because the step prompt fixes it and five design questions are open. Would change: nothing (run order fixed).
- **No new nouns** — `talerz`, `pudełko`, `naklejka` already in `src/data/nouns.ts`; teacher read still required. Would change: research finding a missing form or a prompt needing another noun.
- **Wallet capacity not decided here** — content cap (6 coins, teacher read) vs layout beyond the art's centres left to research. Would change: nothing at this step.
- **Loader-logging, font-limit and art-health follow-ups kept out** unless the plan edits those symbols. Would change: the plan touching `loaderror`, `artHealthView.ts` or `artHealth.ts`.
- **Save format v3, no new e2e seam assumed.** Would change: research needing a `?e2eArt=` variant for the new pictures (hook build only, marker in `vite/e2eHookGuard.mjs`).
- **English artifacts, Polish commit message** — profile § 1 and archived changes. Would change: a maintainer rule.
