# P2 art from the salon-v2 pack (S-16c) — Plan Brief

> Full plan: `context/changes/final-art-p2/plan.md`
> Research: `context/changes/final-art-p2/research.md`

## What & Why

Roadmap slice S-16c (FR-026): put the pack's P2 art on the screens the child sees — app icon, loading screen, the open
wallet in MONEY_PAY, the notebook on "Nowa umiejętność!", plate / box / sticker counting icons, and a salon picture on
"Pokój gotowy!" — and close the placeholders and design gaps this art covers.

## Starting Point

All of these are drawn in code today: placeholder PNG icons (`scripts/make-icons.mjs`), an ivory loading screen, a
dashed 5 × 2 wallet for up to 10 coins, the counting `book` icon on the unlock card, and a live salon miniature whose
stand-ins sit under all pictures (F2). The pack wallet has only **six** coin places.

## Desired End State

The child sees the target icon on the home screen, the blurred-salon loading screen with the emblem, an open wallet with
six coin places (a full wallet dims the tray), the notebook, the three new icons in counting tasks, and her own salon on
the done card (the pack thumbnail when a picture is missing). Every new picture falls back to today's drawn look; the
game never waits on it beyond the existing boot limit. Save format stays v3.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Wallet capacity **[human]** | 6 coins (`maxTotal`), `ART_LIMITS.moneyItems` stays 10 | Every amount is payable in ≤ 4 pieces; only `pay` wallets of 7–10 pieces in E1.11 / E2.2 are refused; teacher read in phase 1 | Research → Plan |
| Wallet geometry | Art × 1.25 (800×525), coin box 144 × 104 on the drop centres | Keeps coins above the 96 px touch target | Plan |
| Full-wallet signal | Tray dims (new gap 115) | No art or cue for it; text would read as an error | Plan |
| Loading art | Requested first in the one boot queue, shown on `filecomplete` | A scene `pack` would escape the per-file timeout and the total cut | Research |
| Boot limit **[human]** | `totalMs` stays 45 s; comment recomputed (2.08 MB ≈ 41.6 s at 50 KB/s) | Raising it only lengthens the stalled-server wait | Plan |
| Room-done tile | Live miniature; `salon-after` when a picture is missing; `salon-before` **dropped [human]** | Shows her own choices; no screen lists not-done rooms | Research → Plan |
| UI art table | Own `UI_ART`, outside `TASK_ART` and "Obrazki" | A missing wallet must not skip MONEY_PAY tasks | Research |
| New icons | Only in `ICONS` (not `PLATE_ICONS`, `SCALE_ITEMS`) | "A sticker on a scale" and "plates on plates" read badly | Research |
| App icons | cwebp lossless + dwebp, `npm run icons` repointed | Sandbox-safe, deterministic, RGB PNG | Research |

## Scope

**In scope:** wallet cap and drop-centre layout, wallet art, loading art, notebook, room-done fallback, three icons, app
icons, boot follow-ups (F3 ×2, A-10), `CoinWallet.paint` lifted cell, F2, docs and gaps 22/104/105/108/115, three e2e specs.

**Out of scope:** `salon-before`, MULT_GROUPS plate frame (gap 62), UI art in "Obrazki", loader error lines (A-3/A-4),
`FontFace` limit, expansion icons, `globIgnores`, any save-format change, `deploy/`.

## Architecture / Approach

Pure rules in `core` first (wallet geometry/cap, `liftedSlot`, `walletFull`, `firstLoaded`, `miniatureMode`), then the
converted files with a `UI_ART` table, then each widget calls those rules and keeps its drawn look as the fallback. The
e2e hook gains read-only fields (`loading.art`, `coins.walletArt/full`, `room.doneMiniature`) so browser specs can
prove which picture was chosen; no new URL seam.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Six-place wallet (tdd) | Cap 6, drop-centre layout, lifted cell, full rule; e2e spread fix; teacher read | Existing `money-pay` spec paying 7 coins |
| 2. Art files and tables (tdd) | WebP files, `UI_ART`, `ICONS` 15, teacher read E1–E3 | Generator outputs shift with longer `ICONS` |
| 3. Fallback decisions (tdd) | `firstLoaded`, `miniatureMode` | Mirroring `drawRoomMiniature`'s skip rule |
| 4. Wallet widget (impl) | Art, six places, hole, dim tray, hook | Depth order coins vs art |
| 5. Loading screen (impl) | Background, emblem, listener fixes, limit comment | Late file redrawing a destroyed screen |
| 6. Unlock card + room-done (impl) | Notebook; thumbnail fallback | — |
| 7. App icons (impl) | Pack PNGs, size guard | Maskable crop (human) |
| 8. Docs (impl) | `CLAUDE.md`, gaps, follow-ups | Rule-file validator |
| 9. Loading e2e (#15) | Art shown; cut leaves drawn screen | Timing of held routes |
| 10. Wallet e2e (#11) | Six by touch, seventh refused, hole, drawn fallback | Mid-drag hold in the helper |
| 11. Room-done e2e (#16 / FR-019) | live / thumbnail / drawn | Reaching the card (slow spec) |

**Prerequisites:** S-16a, S-16b merged (main `c16734d`); local `designs/martynka-salon-v2`, `cwebp`/`dwebp`.
**Estimated effort:** 11 phase sessions; e2e phases run by the orchestrator (request-file protocol).

## Open Risks & Assumptions

- The 960-wide background may look soft at 1920 — visual gate.
- The loading art may arrive after other files on a slow start (drawn screen until then) — by design.
- S-16d adds salon art to the boot queue; the 45 s limit comment must be redone then.

## Success Criteria (Summary)

- The child sees every P2 picture; with any of them missing the game looks like today and plays on.
- MONEY_PAY in E1/E2 is fully playable by touch in a six-place wallet; the teacher read confirms content.
- Full local gate and e2e green with `+8` e2e tests; save v3 and fixtures unchanged.
