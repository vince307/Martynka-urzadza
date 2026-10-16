# Handoff — `final-art-p2` (slice S-16c)

Written by the `/10x-research final-art-p2` step of autonomous run `2026-10-15-fix-s16bcd`: research is complete, no product code changed. The planner must not take the wallet at 10 coins (the art has 6 drop centres: research recommends `balance.coinDrag.maxTotal` 6, decoupled from `ART_LIMITS.moneyItems`, which stays 10) and must not load the loading art in a scene `pack` (outside the A-1 total limit).

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-p2`, cut from `main` at `c16734d` |
| Commits | 2 on the branch (`docs(final-art-p2): change identity (autonomous run)`, this step's `docs(final-art-p2): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three files below staged by path) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/final-art-p2/research.md` | source-backed answers: wallet 6 vs 10, loading-art bootstrap, room-done tile, notebook, `ICONS` consumers, app-icon tool, measured WebP/PNG sizes, A-1 budget |
| `context/changes/final-art-p2/change.md` | frontmatter only: `status: preparing`, `updated` |
| `context/changes/final-art-p2/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/final-art-p2` |
| `cwebp -q 85 -alpha_q 100 -m 6` (the `npm run art` settings) on the 11 P2 sources, into the session scratchpad | sizes in `research.md` § 7 (e.g. background 960×540 30 614 B, wallet 27 874 B, notebook 400² 17 862 B, plate/box/sticker 256² 31 728 B together) |
| `cwebp -lossless -exact -resize` + `dwebp` (PNG default) for app icons, scratchpad | 512: 323 406 B, 192: 53 585 B, 180: 47 808 B, 48: 5 046 B, maskable 512: 100 269 B; RGB PNG; re-run md5 identical (deterministic) |
| `sips -s format png -z 512 512` | fails in the sandbox ("Cannot write to file /var/folders/…"); outside the sandbox works, RGBA 429 602 B |
| tool probe (`command -v`) | present: `sips`, `cwebp`, `dwebp` 1.1.0; absent: `magick`, `convert`, `pngquant`, `optipng`, `oxipng`, `zopflipng`, `pngcrush` |
| decode of both 1024² app icons | 0 non-opaque pixels (fully opaque) |
| `npm run sample -- E1/E2/E3 --count 2` (by a research subagent) | prompts of COUNT/COMPARE_QTY/ORDINAL/MULT_GROUPS read; no change made |
| Lint / typecheck / unit / build / e2e | not run: docs-only step (baseline on main c16734d: unit 3034, e2e 109 — inherited, unverified) |

No deliberate break: nothing testable changed. Nothing was written to `public/`.

## 4. Next command

`/10x-plan final-art-p2`

## 5. Open

Decisions for the plan (details and anchors in `research.md` § Summary and § Open Questions):
- Wallet: `balance.coinDrag.maxTotal` 10 → 6 (checks in `stepTrayDrag`, `parseMoneyPayParams`, `walletCheck`, `validate.ts`, `canonicalInput.ts`), coins on the pack `dropCenters`; wallet area size and coin diameter (≈ 96 game px at `DRAG_MAT` height vs ≈ 168 today); the E2 `note-10zl` in a coin centre; full-wallet signal; fix `CoinWallet.paint` last-coin follow-up. Teacher read for E1.11/E2.2.
- Loading: background + emblem queued first in `BootScene.preload`, redrawn on `filecomplete`; own data table (not `TASK_ART`); take impl-review F3 (`bootLoadPhase` with the constant), F3 (`progress` listener removal) and A-10.
- `balance.loader.totalMs` 45 000: the boot queue reaches ≈ 44–45 s at 50 KB/s with the new files — recompute the comment, decide raise or keep.
- Room-done: keep `drawRoomMiniature`, `salon-after` as the fallback when a piece texture is missing (closes F2); `salon-before` not shipped.
- Notebook: new key for `UnlockCard`; `ArtImage` `SIZES` lookup must know it.
- Icons: plate/box/sticker into `ICONS` only (not `SCALE_ITEMS`, not `PLATE_ICONS`); `scripts/make-task-art.mjs` needs the salon-v2 source dir; tests `tests/measures.test.ts`, `tests/taskArt.test.ts` (38 → 41), `tests/artHealthText.test.ts`; teacher read E1–E3.
- App icons: cwebp→dwebp in the script; `npm run icons` retired or repointed; `CLAUDE.md` "Placeholder app icons" line goes stale; manifest paths unchanged; optional `globIgnores` for the 512 icon.
- Design gaps to close/narrow: 22, 104, 105, 108 (`docs/design-gaps.md`).

Follow-ups carried forward unchanged (same triggers): A-3/A-4/S14-08 (`loaderror` listener), `FontFace` limit, per-file timeout test, art-health set L-6/L-8/F4/A-5/ASL-02..09, texture atlas.

## 6. Autonomous decisions

- **Wallet cap 6 recommended**, rejected: coins beyond the centres (no room in the art), 5×2 grid inside the art (≈ 80 px coins, below the 96 px touch size). Why: every amount stays payable (fewest ≤ 3 in E1, ≤ 4 in E2), bigger targets and a visible full wallet for a 6-year-old. Would change: the teacher read finding that paying in 1-zł coins (7–10 pieces) must stay possible, or the author delivering a 10-place wallet.
- **Loading art in the same queue, first** (option c), rejected: scene `pack`/pre-boot scene (no per-file timeout, outside `totalMs`), a second `load.start()` pass (restructures `create`). Would change: Phaser exposing a per-file timeout for pack files, or the visual gate showing the drawn screen too long before the background arrives.
- **Live miniature kept, `salon-after` as fallback, `salon-before` dropped** — narrows the roadmap's "miniatury przed/po". Why: the card shows the child's own choices and S-16d slots without new art. Would change: the author asking for the fixed pack picture, or a screen listing not-done rooms (then `salon-before` has a place).
- **cwebp + dwebp for PNG icons**, rejected: `sips` (fails in the sandbox, larger RGBA output), a pure-JS PNG decoder (no size gain, more code). Would change: libwebp missing on the build machine (then `sips` outside the sandbox).
- **New icons only in `ICONS`**, not `SCALE_ITEMS`/`PLATE_ICONS`. Would change: the teacher read finding a prompt that does not read well with one of them (then a per-consumer list).
- **Background 960×540, emblem at display size** recommended for weight; left to the plan. Would change: visible blur loss at the visual gate.
- English artifact, Polish commit message (profile § 1).
