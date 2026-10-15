# Handoff — `save-v2-backup-health` (slice fix save-v2-backup-health, non-roadmap)

Written by the visual gate of run `2026-10-15-fix-s14c-s14d` (verdict `VISUAL: PASS`), final pre-merge state written by the ship step. One focus discrepancy on the slow-read card was fixed in `1c7bc51` and captured again. The [visual] rows are ticked, and only the [human] rows remain open. The next agent archives the change and ships it. It must not add to the PR body that the [human] rows are done.

## 1. State

| | |
|---|---|
| Branch | `feat/save-v2-backup-health`, cut from `main` at `16848c6` |
| Commits | plan commits + p1 `8430945` … p6 `e7407b7`, review fix `58cf156`, review docs `b9883d5`, visual fix `1c7bc51`, then this docs commit |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-15-fix-s14c-s14d/run-log.md |
| `change.md` status | `archived` (ship step, `chore(archive): close save-v2-backup-health`); non-roadmap change, no roadmap row |
| `## Progress` rows remaining | 4, all [human]: 2.5, 2.6, 4.7, 4.8 |
| Working tree | clean after the docs commit; the throwaway spec was moved out to the session scratchpad (`visual-sv2.local`) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/saveFailedCard.ts` | fix `1c7bc51`: `mountSaveFailedCard` moves the focus to "Graj dalej" when "Poczekaj dłużej" is tapped (DESIGN-GAP 96) |
| `context/changes/save-v2-backup-health/screenshots/*.png` | 40 frames: 20 states at 1440 and 1024 |
| `context/changes/save-v2-backup-health/screenshots/README.md` | frame table: state, widths, how each was reached |
| `context/changes/save-v2-backup-health/reviews/visual-review.md` | the judgement, focus log, hand check, ending `VISUAL: PASS — …` |
| `context/changes/save-v2-backup-health/plan.md` | [visual] rows 1.6, 3.5, 4.6 and 5.7 ticked |
| `context/changes/save-v2-backup-health/follow-ups/review-fixes.md` | V1 (code named twice after failed copies) and V2 (focus during an in-flight import/reset write), each with a `Trigger:` |
| `context/changes/save-v2-backup-health/handoff.md` | this file |

## 3. Verification

All observed in this step, after the fix `1c7bc51`. Baseline is main `16848c6`: unit 2445, e2e 77.

| Command | Result |
|---|---|
| visual spec (16 tests, 2 viewports, hook build on 4399) | 16 passed. The card tests were re-run after the fix: 4 passed, and the focus log reads `Graj dalej` in frames 20, 21, 22 and 26 |
| `npm run lint`, `npm run typecheck` | OK (the throwaway spec moved out first) |
| `npm test` + deploy and ops tests + `sample` E1–E6 | 2479 passed = baseline 2445 + 34, unchanged from impl-review; deploy OK, ops OK, every sample OK |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=…/playwright.config.ts --workers=4` | 82 passed (5.7 min) = baseline 77 + 5 |
| Deliberate break | none in this step: the fix is a DOM focus move with no unit DOM harness. The before/after focus log of the visual spec is the proof: `BODY` before and `BUTTON:Graj dalej` after |
| Ports 4397/4398/4399 | no listener after the runs |

## 4. Next command

none — shipped

## 5. Open

- Human checklist (`plan.md` Progress):
  - [ ] 2.5: after 3 failed copies (or at page hide after the first), v2 is written without the raw v1 copy.
  - [ ] 2.6: import and reset try a copy that is still owed once (SRR-04).
  - [ ] 4.7: there is no start counter; the way out of a timeout is a longer wait plus the advice.
  - [ ] 4.8: the N-7 iPad measurement (`balance.save.slowLoadTimeoutMs`).
- DESIGN-GAP rows 94–97 (`docs/design-gaps.md`) stay: the kit has no frames for these views. The wording is provisional and still needs a teacher read.
- Follow-ups with `Trigger:` are in `follow-ups/review-fixes.md`. New in this step:
  - V1: `createSaveHealthView` / `saveHealthView` names the copy failure code twice.
  - V2: the busy branch of `openSaveImportDialog` / `openSaveResetDialog` leaves no focus target during the write.
- The e2e slow-read constants are still timing-sensitive (`E2E_SLOW_READ_MS`; impl-review F5). They were green in this step.

## 6. Autonomous decisions

- **Playwright only, no Claude-in-Chrome pass.** Rejected: capturing the start cards in Chrome. Why: every panel and dialog state needs the gear hold, which Chrome cannot drive (profile § 8). The cards' timed states depend on the hook build's shortened limits. One renderer keeps the frames comparable, as in the save-reason-and-recovery gate. What would change it: Chrome learning to drive the Phaser hold, or a card-only change.
- **Fixed the slow-card focus instead of only recording it.** Why: DESIGN-GAP 96, written by this change, says "Graj dalej" keeps the focus, and the focus dropped to the page. The fix is one line in `mountSaveFailedCard` and never focuses an overwrite. What would change it: a maintainer preferring the focus on the disabled wait button's status text.
- **V1/V2 recorded as follow-ups, not fixed.** Why: V1 is a copy choice that needs a teacher read (rows 94–95). V2 is a 5 s window in which nothing can be done, and Escape is already guarded. What would change it: a parent report of confusion about the double code, or an accessibility requirement for keyboard users during the write.
- **Extra states beyond the [visual] rows** (`backuphang`, `slow`, the import after a timed-out write, the import at `hang`). Why: the step prompt names these seams and the import dialog after a timed-out write. What would change it: nothing; they only add evidence.
- **Archived with 4 open [human] rows (ship step).** Chosen: `Continue archiving (Recommended)` — the archive warning was `0 automated, 4 manual`. Rejected: resume implementation. Why: rows 2.5, 2.6, 4.7 and 4.8 are maintainer decisions and an iPad measurement; they are a post-run checklist in the PR body („Dla właściciela produktu”), not a blocker. Soft warning: [visual]/[reviewer]/e2e rows without a SHA suffix carry their evidence inline. What would change it: the maintainer rejecting decision 2.5 or 2.6, which reopens the policy in a new change.
