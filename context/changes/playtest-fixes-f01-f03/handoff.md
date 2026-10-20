# Handoff — `playtest-fixes-f01-f03` (slice fix:playtest-fixes-f01-f03)

Written by the `/10x-plan-review` step of run 2026-10-20-playtest-boot. Verdict PROCEED: the plan holds against the
code; two self-contradicting test contracts and three gaps were fixed in plan.md; no product code yet. The next agent
must keep the variety picker's rng calls identical to `pickRoundSkills` (one `next()` + one `pick` per draw, two picks
on the review path) and treat the warm-up's cross-half seed as soft (Critical Implementation Details, plan-review F2).

## 1. State

| | |
|---|---|
| Branch | `feat/playtest-fixes-f01-f03`, cut from `main` at `64fd3ea` |
| Commits | 5 on the branch: `fea1184`, `8a884c1`, `afaf7d4`, `19b145b`, this step's `docs(playtest-fixes-f01-f03): plan review` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 42 (`grep -c '^- \[ \]' plan.md`; +1 row 6.6) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/playtest-fixes-f01-f03/reviews/plan-review.md` | the review: 2 critical, 3 warnings, 2 observations, all triaged; ends with `VERDICT: PROCEED` |
| `context/changes/playtest-fixes-f01-f03/plan.md` | fixes: warm-up soft seed (F2), phase 5 v1-fixture case (F1, rows 5.2), row 6.4 "no HUD on the welcome" (F3), phase 7 follow-up `firstPlayableSteps`/`playableSteps` + 7.2 count ≥ 6 (F4), row 6.6 [human] for A-2/A-3/A-4 (F5), new `## Known risks`, baseline line now cites the contract |
| `context/changes/playtest-fixes-f01-f03/change.md` | frontmatter `status: planned → plan_reviewed` only |
| `context/changes/playtest-fixes-f01-f03/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/playtest-fixes-f01-f03` |
| `ls -l` of 20 plan paths | all present |
| sub-agent code check (rng, post-pick redraws, history/variants, welcome re-entry, `longPress` callers, `autoReadStages` type, `Martynka-urzadza.md` lines, test-plan #12/#14, touch-target tests) | plan claims confirmed except F1/F2/F3 (fixed in plan) |
| `node -e` over `tests/fixtures/save-v1*.json` | v1 learner history length 2 (`save-v1.json`, `-legacy-salon`), `variants` absent → F1 |
| `grep -c '^Driver: ' plan.md`; Progress `### Phase` count | 9 / 9 |
| lint / typecheck / tests / build / e2e | not run: docs-only step |

## 4. Next command

`/10x-tdd playtest-fixes-f01-f03 phase 1`

## 5. Open

- Manual rows (human checklist): 1.6 [reviewer] teacher read of printed rounds; 3.5 [reviewer] teacher read of the
  balance change; 4.5, 4.6 [visual] gear and hint at 1440/1024 (task and room); 4.7 [reviewer] the hint string;
  6.4 [visual] "Wróć" states at 1440/1024 incl. no HUD on the welcome after it; 6.5 [reviewer] `TaskScene.backToAge`
  exit order; **6.6 [human]** A-2/A-3/A-4 ("Wróć" hidden for a parent-placed learner, visible mid-task, no confirm);
  **7.4 [human]** PRD FR-009 vs the new default; 7.5 [reviewer] `Martynka-urzadza.md` edits.
- DESIGN-GAPs to add: row 151 (gear tap hint, phase 4), row 152 ("Wróć", phase 6); rows 25 and 28 rewritten (phase 4).
- Follow-ups to write in phase 7 (`follow-ups/review-fixes.md`): as listed in plan phase 7 § 3, now including the
  `firstPlayableSteps` (`src/core/round/pick.ts`) / `playableSteps` (`src/core/curriculum.ts`) single-source item.
- Known risks (plan `## Known risks`): `TaskScene` shutdown does not stop `UIScene` (`backToAge` must); phase 4 "hint
  once" unproven until phase 9.
- Ship step (not a phase row): F-01..F-03 status "naprawione (#PR)" in `docs/playtest-feedback.md` (PA-5).

## 6. Autonomous decisions

- R-1 No questions asked; triage done in place (contract rule 1). Every CRITICAL/WARNING got the single obvious fix.
  Would change: none.
- R-2 A-2 (hide "Wróć" for a parent-placed learner) kept, not overturned: scope.md § 1 speaks of the child correcting
  her own age; a parent keeps the settings panel. Named in [human] row 6.6. Would change: the maintainer wanting
  "Wróć" for every learner.
- R-3 A-7 (no PRD hand edit) kept: scope.md asks only for `Martynka-urzadza.md`, which phase 7 edits (both "E1–E2"
  lines); [human] row 7.4 stays. Would change: the maintainer allowing a hand edit of `context/foundation/prd.md`.
- R-4 F1: the v1 fixture with 2 history entries stays "offered" (the brief's accepted edge) instead of adding a
  stronger signal to the predicate (e.g. non-empty `mastery`, which the warm-up also writes). Would change: a real v1
  save in the wild — none expected, v1 predates S-15.
- R-5 F2: soft seed (in-half variety beats the cross-half boundary) rather than a smarter look-ahead greedy. Would
  change: a test showing an avoidable boundary neighbour that matters to the teacher read.
- R-6 F4: the `firstPlayableSteps` follow-up deferred, not done in phase 1: merging the predicates would move warm-up
  pools under phase 2's oracle. Would change: the two predicates found to already disagree on a real step.
- R-7 Drivers left as written (1, 2, 3, 5 `tdd`; 4, 6, 7 `impl`; 8, 9 `e2e` after the phase-7 seam sweep, `E2E=on`);
  no phase split or merge needed. Would change: an implementer finding phase 6 too large for one session.
