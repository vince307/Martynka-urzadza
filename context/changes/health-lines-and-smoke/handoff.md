# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-e2e` phase 14 step (last phase) of run `2026-10-16-audit-sweep`. All 14 phases are committed and `change.md` status is `implemented`. Do not get wrong: save format stays v4; open [reviewer]/[visual]/[human] rows are not mine.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phases 1-13 with handoffs, phase 14 (`test(health-lines-and-smoke): The screen fallback reaches the panel (p14)`, 2500ae5) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | only [reviewer]/[visual]/[human] rows (14.1-14.3 ticked with 2500ae5) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/health-lines.spec.ts` | describe "screen fallbacks reach the panel": `#14 U-1 a missing wallet is named in the pictures section` (`?e2eArt=ui`, money_pay_10), `#14 U-1 a missing notebook on the unlock card is named in the pictures section` (E4 rounds to the unlock card), `#14 G-7 a drawn room miniature is named in the pictures section` |
| `tests/e2e/support/salon.ts` | new: `finishSalon`, `room` moved out of `final-art-room-done.spec.ts` for sharing |
| `tests/e2e/final-art-room-done.spec.ts` | imports the helpers from support |
| `tests/e2e/support/hook.ts` | snapshot type: `artFallbacks` |
| `context/changes/health-lines-and-smoke/{plan,change}.md` | rows 14.1-14.3 ticked; status implemented |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + sample E1-E6 | Tests 3653 passed (baseline 3653, +0); deploy scripts OK; samples OK |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 138 passed + 1 load flake (`stale-tab #2 T-5`, passes alone 5/5); `playwright --list` 139; baseline 136, +3 |
| break p14a (`CoinWallet` no `recordFallback`) | RED by assertion: `expect(received).toBe(expected)` Expected "drawn", Received undefined (wallet); restored |
| break p14b (`UnlockCard` no `recordFallback`) | RED by assertion: `expect(received).toBeTruthy()` Received undefined (notebook); restored |
| break p14c (`RoomDoneCard` no `recordFallback`) | RED by assertion: Expected "drawn", Received undefined (miniature); restored |
| meta-check | breaks prove each widget writes the record the hook and panel read; the panel-read half (`artHealthView` mapping) is not broken separately, the panel text assertion covers it only when green. Copy look of fallback is the visual gate |
| restored | `git diff -- src` empty |
| stray processes | ps grep for sleep/until/while/tail -f/playwright/vite (sandbox disabled): empty |

## 4. Next command

`/10x-impl-review health-lines-and-smoke`

## 5. Open

- [reviewer] rows 1.6, 1.7, 2.4, 3.4, 4.5, 5.4, 6.4, 7.4, 8.4, 9.4, 10.5, 11.6, 11.7; [visual] 2.5, 5.5, 6.5, 7.5, 8.5, 10.6; [human] 2.6, 4.6, 8.6, 11.8 not mine.
- Follow-ups: `context/changes/health-lines-and-smoke/follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. **Plan test (a) split in two** (wallet in an E1 forced round, notebook via the E4 unlock road), because the two screens need different starts; suite delta is +3, not +2.
2. **(b) uses `?e2eArt=room` plus an aborted `salon-after.webp`**, not `?e2eArt=ui`: with `ui` the live salon pieces load and the card picks `live`, which records no fallback. Would change: a seam that cuts only the miniature.
3. **Break targets** are the `recordFallback` calls in the three widgets (plan named patches did not exist).
4. **Helpers moved to `support/salon.ts`** rather than importing between specs.
