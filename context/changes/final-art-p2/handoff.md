# Handoff — `final-art-p2` (slice S-16c)

The `/10x-plan-review final-art-p2` step of autonomous run `2026-10-15-fix-s16bcd` wrote this. The plan is reviewed (verdict PROCEED) and the fixes are applied to `plan.md`. No product code has changed. Next is phase 1 (`Driver: tdd`). The phase-1 agent must test the lifted cell with the FIRST of two equal coins: lifting the last one cannot tell `liftedSlot` from `lastIndexOf`. It must also fix the `money-pay.spec.ts` `spread` in the same commit as `maxTotal` 6.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-p2`, cut from `main` at `c16734d` |
| Commits | 4 on the branch after this step's commit (identity, research, plan, `docs(final-art-p2): plan review`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 46 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (staged by explicit path) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/final-art-p2/reviews/plan-review.md` | plan review: 3 critical, 2 warning, 1 observation, all fixed in the plan; ends `VERDICT: PROCEED` |
| `context/changes/final-art-p2/plan.md` | fixes applied: phase 4 §1 contract (`targets().coins` leaves out the lifted coin; wallet image created in the constructor, no `setDepth`) and new §3 (BootScene queues the non-loading `UI_ART` after `ROOM_ART`); phase 5 intent (only the loading pair at the front); phase 1 §2 and phase 10 (b) (lift the FIRST of two equal coins); phase 10 files (`holdTouch` helper in `tests/e2e/support/hook.ts`); phase 7 contract (read the Vite config as text); phase 8 carry list and decision 12 (fired follow-ups deferred with reasons); visual 4.4 and Progress 4.4 (bar draws above the wallet); Known risks (wallet reaches into the bar zone) |
| `context/changes/final-art-p2/change.md` | status `planned` → `plan_reviewed` |
| `context/changes/final-art-p2/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/final-art-p2` |
| Progress↔Phase script (criteria bullets per phase vs `N.M` rows; no checkbox inside a phase block) | 46 = 46, per phase 5/5/4/5/5/4/4/3/4/4/3 |
| code checks (grep/read) | `maxTotal` has 5 readers plus 3 tests; `fewestCoins` needs at most 3 pieces in E1 and 4 in E2; `answerWrong` coins ≤ 5; ICONS consumers COUNT/COMPARE_QTY/CHOOSE_OP/ORDINAL with no length pins; `e2eArt` seams skip only `TASK_ART`/`ROOM_ART`; `TaskScene` creates `CoinWallet` before `FeedbackBar`; `TASK_LAYOUT.bar` spans 864–960 |
| lint / typecheck / unit / build / e2e | not run: docs-only step (baseline on main `c16734d`: unit 3034, e2e 109, inherited, unverified) |

No deliberate break was made: nothing testable changed.

## 4. Next command

`/10x-tdd final-art-p2` (phase 1: Six-place wallet, `Driver: tdd`)

## 5. Open

- `[human]` decisions in plan `## Autonomous decisions` 1–3: wallet cap 10 → 6 (teacher read of E1.11/E2.2 in phase 1), `salon-before` not shipped, `balance.loader.totalMs` kept at 45 s.
- Manual-only Progress rows for the human checklist: 7.4 (iPad home-screen icon, Android maskable crop) and 10.4 (paying by finger on the wallet art).
- Visual rows: 4.4 (wallet, and the feedback bar above the wallet's lower edge), 5.4 (loading screen), 6.3 (unlock card, room-done tile).
- Planned DESIGN-GAP 115 (a full wallet dims the tray) in phase 4. Gaps 22, 105 and 108 close and 104 narrows in phase 8.
- Follow-ups are carried with triggers to `follow-ups/review-fixes.md` in phase 8. The list now includes the review F4 items:
  - the three `Rect` types (`dragLayout`)
  - `ArtPool`/`fitRect` and S14-10
  - ASL-02..09
  - the coin stand-in label size (`ArtImage`)
  - the V3 slashed zero
- Phase 10 needs the new `holdTouch` helper in `tests/e2e/support/hook.ts`. Phase 4 must change `CoinWallet.targets` so it leaves out the lifted coin.

## 6. Autonomous decisions

- **Verdict PROCEED with the fixes in the plan** rather than RETHINK. Every risky claim held against the code (cap feasibility, ICONS consumers, seams, drivers), and each defect has a narrow fix. Would change: a phase finding a MONEY_PAY amount that needs more than 6 pieces.
- **F1: phase 4 queues the non-loading `UI_ART`**, rejected: moving the whole queue edit into phase 2. Phase 2 is `tdd`, and a boot-queue edit is Phaser code with no unit oracle. Would change: the plan merging phases 4 and 5.
- **F5: wallet scale 1.25 kept, bar above by creation order**, rejected: scale 1.114 to fit under the bar, which gives coin boxes of about 96.0 px, at the touch limit. Would change: the visual gate finding the overlap ugly.
- **F4: fired follow-ups deferred with reasons**, not pulled in: they are refactors or font decisions outside an art slice. Would change: a phase having to edit those symbols anyway.
- No `AskUserQuestion`: the skill's "how to proceed" and triage questions were decided in place (contract rule 1). Every critical and warning finding was fixed in the plan.
