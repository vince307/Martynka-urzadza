# Handoff — `final-art-p2` (slice S-16c)

The visual gate step of autonomous run `2026-10-15-fix-s16bcd` wrote this; the ship step updated §1 and §4 before the archive move. The gate returns `VISUAL: PASS`. It made one fix in `076c213`: an ivory outline on the loading title and slow line over the pack background. The rows [visual] 4.4, 5.4 and 6.3 are ticked. Archive next. Only two [human] rows remain open, 7.4 and 10.4, and they must stay open.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-p2`, cut from `main` at `c16734d` |
| Commits | phases 1-11 (`afac8e1` … `b434ef7`), review fix `04863b9`, impl-review docs `8b3f2d8`, visual fix `076c213`, visual gate docs `e5b020e`, then the ship step's handoff and archive commits |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-15-fix-s16bcd/run-log.md |
| `change.md` status | `archived` (stamped by the ship step's `/10x-archive`) |
| `## Progress` rows remaining | 2 (`grep -c '^- \[ \]' plan.md`): 7.4 and 10.4, both [human] |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/LoadingScreen.ts` (`showArt`, `slow`) | visual fix: `setStroke(PAGE_BACKGROUND, …)` on the title and slow line while the background is shown |
| `src/data/layout.ts` (`LOADING_LAYOUT.textStroke`) | outline widths: title 12, slow 8 |
| `context/changes/final-art-p2/reviews/visual-review.md` | the verdict per row, the hand-checked coin total, observations VO1-VO3, and the `VISUAL:` line |
| `context/changes/final-art-p2/screenshots/*.jpg` + `README.md` | 44 frames (22 states × 1440/1024) and the maskable safe-circle overlay; the README gives the route per state |
| `context/changes/final-art-p2/plan.md` | rows 4.4, 5.4 and 6.3 ticked with frame references |
| `context/changes/final-art-p2/follow-ups/review-fixes.md` | new section "From the visual gate" with VO1-VO3, each with a `Trigger:` |

## 3. Verification

Observed in this step. Baseline is main `c16734d`: unit 3034, e2e 109.

| command | result |
|---|---|
| lint, typecheck, deploy scripts, `sample` E1-E6 at `076c213` | OK |
| `npm test` at `076c213` | 3063 passed (3034 + 29, the same as 04863b9) |
| `npm run build` at `076c213` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` on `final-art-loading`, `load-and-tab-guard` and `salon-load-health` after the fix | 8 passed |
| full e2e suite | not re-run in this step. The fix changes only text style in `LoadingScreen`, and the three boot specs that draw it are green. 117 passed at 04863b9 is inherited from impl-review and was not re-observed |
| visual capture (throwaway Playwright spec, hook build on 4399) | 26/26 passed. The four loading tests were re-run after the fix |
| maskable icon measurement (PIL) | farthest motif pixel at 165.7 px from the centre; the 80 % safe radius is 204.8 px; 0 pixels outside |
| ports | 4399 stopped. 4397 and 4398 not listening. `tests/e2e/visual.local/` deleted |

No deliberate break in this step. The fix is visual only, and no test asserts the text style.

## 4. Next command

none — shipped

## 5. Open

- [human] 7.4: on the iPad, add the game to the home screen and check the new icon. On an Android launcher, check that the maskable crop keeps the motif inside the safe circle. The measurement passes, but no real device has been checked.
- [human] 10.4: on the iPad, pay by finger on the wallet art. It must feel right for a 6-year-old: the size of the places and the dimmed tray when the wallet is full.
- Follow-ups VO1-VO3 are in `follow-ups/review-fixes.md` under "From the visual gate":
  - VO1: the wallet coin picture is smaller than the tray coin (`CoinWallet.paint`).
  - VO2: the loading composition is the plan's, not the pack preview's (`LOADING_LAYOUT`).
  - VO3: the drawn wallet fallback looks plain.
- F4-F6 and the carried items are unchanged.

## 6. Autonomous decisions

- **Fixed the loading-title contrast in the gate instead of deferring it.**
  - Why: the row says "title readable", and the pack's own title has a light outline. The fix is two `setStroke` calls with widths taken from `src/data/layout.ts`, and it applies only while the background shows.
  - Rejected: moving the title to the pack's position at the bottom. That would be a redesign against the plan's `LOADING_LAYOUT` decision, so it is recorded as VO2.
  - Would change: the author asking for the pack composition.
- **Playwright fallback instead of Claude in Chrome.** The coin drag, the held finger and the held or aborted routes cannot be driven by Chrome's synthetic events, as in the S-16a gate. Would change: nothing for this slice.
- **Wallet coin size accepted (VO1).** The touch box is 77 × 55 CSS px at 1024, above the 44 px limit. Only the picture is smaller. Would change: the [human] row 10.4 finding the coins hard to see or tap.
