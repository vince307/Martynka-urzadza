# Handoff — `observability-c1-c2` (slice fix:observability-c1-c2, non-roadmap)

Final pre-merge state, written by the ship step (autonomous run 2026-10-13-fix-observability) before `/10x-archive`. impl-review: APPROVED, `MERGE: CLEAR`; visual gate passed (rows 4.7, 5.8 ticked in d289783). Open [human] rows 2.6, 4.8, 5.9 are a post-run checklist for the maintainer.

## 1. State

| | |
|---|---|
| Branch | `feat/observability-c1-c2` (cut from `main` at `a34aeee`) |
| Commits | phases 1-7 (6ad5d53 … d6211e1), review fix a2472cf, impl-review 9219e25, visual gate d289783, then the archive commit |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-13-fix-observability/run-log.md |
| `change.md` status | `archived` (by `/10x-archive`) |
| `## Progress` rows remaining | 3 [human]: 2.6, 4.8, 5.9 (post-run checklist, not a blocker) |
| Working tree | clean after this commit (`context/runs/` untracked as always) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/observability-c1-c2/reviews/impl-review.md` | review report, 0 critical, 2 warnings fixed, 4 observations; ends `MERGE: CLEAR` |
| `tests/dialogSessions.test.ts` | new (a2472cf): parses `UIScene.ts`/`WelcomeScene.ts` with the TypeScript API; every `onPass`/`onConfirm`/`onCancel` must be `session.run(…)`, counts 4 + 4 pinned |
| `tests/e2e/error-boundary.spec.ts` | (a2472cf) settings dialog name from `pl.settings.title` |
| `context/changes/observability-c1-c2/plan.md` | rows 2.5, 4.5, 4.6, 5.6, 5.7 ticked |
| `context/changes/observability-c1-c2/change.md` | `status: impl_reviewed` |
| `context/changes/observability-c1-c2/follow-ups/review-fixes.md` | section "From impl-review": F2 maintenance, F3 `signalOfRejection`, F4 guard alignment, F5 `noVoice` how-to; each with `Trigger:` |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| lint / typecheck | OK / OK |
| unit | 974 passed = baseline 948 + 26 (branch's +24 recounted per file, +2 review test); deploy scripts OK; sample E1-E6 no violations |
| build | `e2e hook: absent (2 chunks checked)`; grep dist for e2eFail, e2e-forced-failure, e2eMonth, __martynkaE2E: empty |
| e2e `npx playwright test` | 23 passed = baseline 18 + 5, before and after the fix (Chromium ran in this session); 4397/4398 stopped |
| break: −1 re-applied in `recordRound` | 5 red (mastery "keeps mastery" ×2, "never lowers", bounds; curriculumEnd warm-up `expected 3 to be 4`); restored. Meta: inverted assertions do fail on the old rule |
| break: `openInputSession.run` without `end()` | "releases and rethrows …" red; restored |
| break: `main.ts` without `installErrorBoundary` | error-boundary (a) red at card `toBeVisible`; restored |
| break: `UIScene` `onConfirm` outside `session.run` | before fix: unit + error-boundary + parent-settings all green (F2); after fix: `dialogSessions` red; `WelcomeScene` `onCancel: resume` also red; restored |
| stale wording | no `releaseInput`, `a miss = -1`, `rules.loss`, "błąd −1" in src, docs, PRD, CLAUDE.md, AGENTS.md, plan |

## 4. Next command

none — shipped

## 5. Open

- [human] 2.6: H-7 in FR-013 and ZADANIA § 1; unlock at 60-70 % accuracy (~25-35 rounds), calibration S-17.
- [human] 4.8: until S-11 a restart from the card ends the session; the card shows on every failure.
- [human] 5.9: reading toggle stays active without a voice.
- Follow-ups: `follow-ups/review-fixes.md` (F3 `installErrorBoundary` `signalOfRejection`, F4 `WelcomeScene.openParent` guard, F5 `pl.settings.noVoice`, plus the plan's own items).

## 6. Autonomous decisions

1. F2 fixed with a structural vitest (TypeScript AST over the scene sources) instead of a behavioural e2e (a hold counter on `InputSuspender` exposed by the hook). Why: cheapest, covers all 8 sites incl. WelcomeScene (no e2e failure site there), no product change. Would change: when the error card stops being final (S-11), a behavioural e2e of the released input becomes possible and preferable.
2. F1 fixed only in the new spec; `tests/e2e/support/welcome.ts` keeps its literal dialog names (pre-existing pattern across the file). Would change: a cleanup change for the e2e support helpers.
3. F3-F6 recorded, not fixed: no effect on a child while the card is final; fixing touches product code after a green e2e run. Would change: a non-final error path or a parent's report.
4. Triage done in place (no AskUserQuestion, contract rule 1); continuation option "Done".
5. Ship step: archived with [human] 2.6, 4.8, 5.9 open. Why: they are product-owner confirmations of decisions already made (H-7 by the maintainer, the final card until S-11, the active toggle without a voice), no code depends on them; they are listed in the PR body. Would change: the maintainer rejecting one of them, which becomes a new change.
