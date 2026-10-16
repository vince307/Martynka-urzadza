<!-- PLAN-REVIEW-REPORT -->
# Plan Review: P2 art from the salon-v2 pack (S-16c `final-art-p2`)

- **Plan**: context/changes/final-art-p2/plan.md
- **Mode**: Deep (claims checked directly against the code on `feat/final-art-p2` at `ce4b00e`; no subagent)
- **Date**: 2026-10-16
- **Verdict**: REVISE before the fixes; SOUND after the in-plan fixes below
- **Findings**: 3 critical, 2 warnings, 1 observation (all critical and warning findings fixed in plan.md)

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F4, F5, fixed) |
| Plan Completeness | FAIL before the fixes (F1–F3), PASS after |

## Grounding

Paths: 22/22 exist (`src/data/balance.ts`, `src/data/layout.ts`, `src/core/round/dragLayout.ts`, `src/ui/widgets/{CoinWallet,LoadingScreen,UnlockCard,RoomDoneCard,RoomView,ArtImage}.ts`, `src/scenes/BootScene.ts`, `scripts/make-{task-art,icons}.mjs`, `vite/config.shared.mjs`, `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`, `playwright.config.ts`, `tests/{coinLayout,blockDrag,moneyPay,measures,taskArt}.test.ts`, `tests/e2e/money-pay.spec.ts`). Symbols: `balance.coinDrag.maxTotal` (read by `stepTrayDrag` rules, `parseMoneyPayParams`, `walletCheck`, `validate.ts`, `canonicalInput.ts`, `tests/moneyPay.test.ts`, `tests/coinLayout.test.ts`, `tests/blockDrag.test.ts`) ✓; `coinLayout`/`coinGeometry`/`CoinSpec` ✓; `CoinWallet.paint` `lastIndexOf` ✓; `miniaturePieces` `{ key, alpha }` ✓; `cutLoad`, `bootLoadPhase(limits.slowAfterMs, limits)`, `progress` listener ✓; `e2eArt` seams `missing|corrupt|room|stall|stallall` ✓ (`room` + `e2eStars` already combined in `salon-art.spec.ts`); nouns `talerz`/`pudełko`/`naklejka` ✓; pack files and `manifest.learning.wallet.dropCenters` (6) ✓; `cwebp`/`dwebp` present ✓; last design-gap row 114 ✓. Brief↔plan ✓. Progress↔Phase: 46 rows = 46 criteria, no checkbox inside a phase block ✓. No `lessons.md`.

Claims verified as stated:
- **Wallet cap 10 → 6**: `fewestCoins` gives ≤ 3 pieces for every E1.11 amount (2–10 zł on 1/2/5) and ≤ 4 for E2.2 (3–20 zł on 1/2/5/10); `parseMoneyPayParams` rejects a range only if a fewest wallet exceeds the cap, so both skills still parse; `generateMoneyPay` answer = fewest wallet, so `canonicalInput`, `solvableInMode` and `contentInvariants` stay satisfiable; `answerWrong` pays answer + one 1-zł coin (≤ 5 pieces) ✓. No other MONEY_PAY skill in `src/data/curriculum/`. `docs/ZADANIA.md` MONEY_PAY ("Przeciągnij monety do portfela, aż będzie n zł; wariant najmniej monet") fixes no coin count — the cap does not contradict it.
- The phase-1 `spread` fix (largest coin → fewest smaller tray nominals) gives at most 5 coins for every E1 answer (9 zł: 2+2+1+2+2) and is always longer than the answer ✓.
- ICONS growth: consumers drawing from all of `ICONS` are COUNT, COMPARE_QTY, CHOOSE_OP, ORDINAL (`rng.pick`/`rng.shuffle`, no length pins); MULT_GROUPS (`PLATE_ICONS`) and MASS (`SCALE_ITEMS`) are fixed lists; `validateVisual` checks membership only; the literal 38 in `tests/artHealth*.test.ts` is independent of `TASK_ART`; the seed spec uses `TASK_ART.length` ✓.
- UI art outside `TASK_ART`/`ROOM_ART`: no `e2eArt` seam skips it, so `?e2eArt=room` proves the thumbnail branch ✓. `vite/config.shared.mjs`: manifest paths unchanged, `png`/`webp` globs already precache the new files ✓.
- Drivers: 1–3 `tdd` (pure core/data), 4–8 `impl`, 9–11 `e2e` after the phases that build them ✓.
- `[human]` rows present: wallet cap (decision 1), `salon-before` dropped (2), `totalMs` kept 45 s (3) ✓.

## Findings

### F1 — Wallet art is never loaded in phase 4

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 / Phase 5
- **Detail**: `UI_ART` was first queued in `BootScene.preload` in phase 5, but phase 4 draws the wallet from `UI_ART_KEYS.wallet` and its visual row 4.4 checks the wallet art. In phase 4, `textures.exists` is always false. The widget would only ever take the drawn branch, and the hook's `walletArt` would read `'drawn'`.
- **Fix**: Phase 4 gains "#### 3. Boot queue for the non-loading UI art": every `UI_ART` entry except the loading pair is queued after `ROOM_ART`. Phase 5 adds only the loading pair at the front.
- **Decision**: FIXED

### F2 — The lifted-cell tests cannot tell `liftedSlot` from `lastIndexOf`

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 §2 (unit test, deliberate break), Phase 10 (b) (`e2e-break-p10a.patch`)
- **Detail**: Both tests lifted the SECOND (last) of two equal coins. For the last coin, `list.lastIndexOf(kind)` returns the same index as the touched cell. The deliberate break "always `lastIndexOf`" would stay green, so the follow-up would look closed without proof.
- **Fix**: Both tests lift the FIRST of two equal coins, index 0 of `[2 zł, 2 zł]`. Phase 10 (b) asserts that the drawn cells still hold cell 1 and not cell 0.
- **Decision**: FIXED

### F3 — The hook contract for drawn coins and the mid-drag helper were missing

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 §1 contract, Phase 10 files
- **Detail**: Phase 10 said "`coins.coins` must list drawn cells only (phase 4 contract)". Phase 4 said `targets()` is "unchanged in shape", and today `targets().coins` lists every wallet coin, including a lifted one. There is also no support helper that holds a touch mid-drag: `dragTouch`, `cancelTouch` and `payCoins` all end the touch.
- **Fix**: The phase 4 contract now leaves out the entry at `liftedSlot(...)` while a coin is carried; existing specs read it only at rest. Phase 10 adds `holdTouch(page, from, to)` with `release(end)` to `tests/e2e/support/hook.ts`.
- **Decision**: FIXED

### F4 — Fired follow-ups not dispositioned

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Autonomous decision 12, Phase 8 carry list
- **Detail**: The slice fires these triggers, but the plan did not name them:
  - "three identical rectangle types", trigger "next change to dragLayout" (`2026-10-13-drawn-widget-tasks-e3-e4`). Phase 1 edits `dragLayout`.
  - `ArtPool`/`fitRect` and S14-09/S14-10, trigger "the next widget built on ArtImage" (`2026-10-14-art-tasks-all-stages`, `2026-10-14-art-stand-in-and-load-signal`).
  - ASL-02..09, trigger "next change to … ArtImage" (`2026-10-14-save-reason-and-recovery`).
  - The coin stand-in label size, trigger "next change to ArtImage" (`2026-10-15-e1-shapes-picture-mode`). Phase 2 edits `ArtImage` `SIZES`.
  - V3 slashed zero, trigger "S-16 (art pack)" (`2026-10-12-task-round-stars`).
  
  The narrator item about hook room targets, fired by e2eHook edits, is already fixed (`inRoom() ? null`).
- **Fix**: Decision 12 and the phase-8 carry list now defer each item with a reason and a reversal condition. S14-09 is recorded as closed for `UI_ART` keys.
- **Decision**: FIXED

### F5 — The wallet reaches into the feedback-bar zone

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 1 §1 geometry, Phase 4
- **Detail**: The wallet at 800×525 from y 380 ends at y 905. `TASK_LAYOUT.bar` is 96 high with its bottom at 960, so the bar spans 864–960 across x 355–1625. That bar zone overlaps the wallet's lower 41 px, which is empty leather: the lowest coin box ends at about y 742. `TaskScene` creates `CoinWallet` before `FeedbackBar`, so the bar draws above as long as the wallet has no `setDepth`. Fitting the wallet under the bar would shrink the coin boxes to about 96 px, right at the touch limit.
- **Fix**: The phase-4 contract now requires the wallet image to be created in the `CoinWallet` constructor with no `setDepth`. Visual row 4.4 checks that the bar draws above the wallet after a miss. A Known-risks entry was added.
- **Decision**: FIXED

### F6 — The app-icon test should read the Vite config as text

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 7 §2
- **Detail**: Importing `vite/config.shared.mjs` into vitest pulls in `vite-plugin-pwa` and the build plugins.
- **Fix**: The contract now says to read the file as text and match `src: '/icons/…'`.
- **Decision**: FIXED

## Autonomous decisions

- **Triage without a human** (agent contract rule 1): every critical and warning finding has an obvious, narrow fix, so each was fixed in plan.md rather than deferred to Known risks. Rejected: RETHINK. Every risky claim (cap feasibility, ICONS consumers, seams, drivers) held against the code. **Would change**: a phase finding a MONEY_PAY amount that needs more than 6 pieces, or the teacher read rejecting the cap.
- **F5 keeps the 1.25 scale** (bigger coins for a 6-year-old) and relies on creation order. Rejected: scale 1.114 under the bar, which gives coin boxes of about 96.0 px, at the limit. **Would change**: the visual gate finding the bar overlap ugly; the scale is one constant in `TASK_LAYOUT.coinDrag`.

VERDICT: PROCEED — three contract and ordering defects (UI art queued too late, a lifted-cell test that cannot fail, a missing hook contract and helper) and two blind spots were fixed in plan.md; the wallet cap, ICONS growth, seams and drivers hold against the code.
