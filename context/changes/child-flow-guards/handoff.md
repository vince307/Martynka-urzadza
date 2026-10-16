# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-new` step of run 2026-10-16-audit-sweep (slice 1 of 3). The change identity exists with every
slice-1 finding re-verified against the repo; nothing is implemented. The next agent must use the **audit's** ids for
PIC-01 (ORDINAL in `artBlocked`) and PIC-03 (picture-mode threshold) — the run's scope file has their labels swapped.

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | 1 on the branch: `docs(child-flow-guards): change identity (autonomous run)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/child-flow-guards/change.md` | change identity: source, re-verification table (finding / audit says / repo now / in scope), save-format statement (stays v4), generators to teacher-read, new `pl.ts` string (PIC-05), design-kit binding, E2E candidates, area follow-ups with takes, deferred LOW items with triggers, autonomous decisions |
| `context/changes/child-flow-guards/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/child-flow-guards` |
| `git log d8ca132..HEAD --stat` (non-context files) | only `docs/human-checklist.md` changed since the triage base: the triage file:line evidence still applies |
| grep/read of every slice-1 symbol (`artBlocked`, `buildAdaptiveRound`, `CoinWallet` ok, `captureFirstWrong`, `walletCheck`, `generateCompareQty`, `skillBuckets`, `unlockReady`, `canonicalInput`, `stepClockSet`, `TaskScene.create` cancel wiring, `figureLayout` `minCell`, `SolutionSteps.show`, the generator loops, `tallOf`, `validateTask` mode rules, `countRound`, widget `images[i]?.show`, `forcedSkills`, `coinMm`, `TaskPicture` widgets map, `written.ts` borrow loop, `NumberLine.render`, `clockElapsed` `swap`, `placeValue` parser) | all 21 MEDIUM and 20 LOW still open; none dropped |
| lint / typecheck / tests / build / e2e | not run — docs-only step, no code changed (baseline on main 9b7fe37: unit 3139 passed, e2e 125 passed, inherited, unverified) |

## 4. Next command

`/10x-research child-flow-guards`

## 5. Open

- Research questions: (a) how `Task.check` can report a reason for PIC-05 (`src/core/tasks/generators/moneyPay.ts`
  `walletCheck`, `src/core/round.ts` `answer`, `src/scenes/TaskScene.ts` `submit`) without changing round semantics;
  (b) the G-4 redraw point (`src/core/curriculum.ts` `buildAdaptiveRound` vs `src/core/round/pick.ts`) and its bound;
  (c) TXT-01 weights on a review step and which previous-stage skills `src/core/progress.ts` `progressView` should show;
  (d) whether CDP multi-touch in `tests/e2e/support/hook.ts` can drive a second finger (PIC-02, GRD-02);
  (e) a pure "fits" rule per drawing kind (GRD-04, WNA-04) over every skill × `TASK_LAYOUT` rect;
  (f) where SV2-10 writes the variant state (`TaskScene` `countRound` vs the answer path that calls `earn`).
- DESIGN-GAP rows expected: 122 (PIC-05 wallet reason line), possibly 123 (COMPARE_QTY tile order/arrow).
- Teacher read required for every changed generator (list in `change.md` § Generators touched).
- Deferred LOW items with triggers: GRD-09, WNA-08, WNA-09, TXT-06 (`change.md` § Deferred); they go to
  `follow-ups/review-fixes.md` at archive time.

## 6. Autonomous decisions

- Next step `/10x-research` instead of the skill default `/10x-plan`: fixed by the step prompt and justified by ~40
  findings across many modules. Would change: a much smaller scope.
- Audit ids over the scope file's swapped PIC-01/PIC-03 labels: the audit is the primary source and the triage agrees.
  Would change: nothing (both are in scope).
- 4 LOW deferred (GRD-09 format change, WNA-08 test churn, WNA-09 no kit view, TXT-06 M-size DOM plumbing), all MEDIUM
  kept. Would change: plan review finding the scope over ~12 phases (next to defer: GRD-06, GRD-07, WNA-10).
- PIC-04/S13-06 example stored as a formatted string in the existing `given` field: keeps the save at v4. Would change:
  a need to show the drawing with the example (then v5 together with GRD-09).
- Fired-but-carried follow-ups (placeValue/clockElapsed duplicates, VO3 wallet look): no child-flow impact or no kit view.
  Would change: the plan editing those exact lines anyway.
