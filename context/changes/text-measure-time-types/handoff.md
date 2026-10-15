# Handoff — `text-measure-time-types` (slice S-14c)

Written by the `/10x-research` step of run `2026-10-15-fix-s14c-s14d`. `research.md` answers the change's questions with
file + symbol anchors; the slice is ready for `/10x-plan`. The next agent must not get wrong: a `review` flag alone
leaves E6.11 invisible (`playableSteps` needs one shared predicate), and INEQUALITY on tiles needs the scene, e2e,
distractor and validator fixes from research § 3 even though `isCorrect` already honours `check`.

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | 2 on top of `e2f7caa`: `docs(text-measure-time-types): change identity (autonomous run)`, `docs(text-measure-time-types): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | no `plan.md` yet |
| Working tree | clean after the commit (three files staged by path) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/text-measure-time-types/research.md` | research: per-type shapes/ranges/modes/hints table, INEQUALITY options, MIX shape, calendar-start effect, nouns and validator, threshold table, generator extension points, invariants |
| `context/changes/text-measure-time-types/change.md` | frontmatter only: status `new` → `preparing`, `updated` 2026-10-15 |
| `context/changes/text-measure-time-types/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/text-measure-time-types` |
| decisive anchors re-read in main context | `isCorrect` (`src/core/round.ts`) checks `task.check` first; `answerWrong` (`tests/e2e/support/hook.ts`) picks first tile `!== state.answer`; `TaskScene` `markCorrect`/`markHint` use `task.answer`; `parsePlaceValueParams` throws for `max > 999`; `artBlocked` MASS/CAPACITY cases; `UNBOUNDED_TYPES`/`screenBound`; `calendarStart`/`skillBuckets`/`unlockThreshold`; `ACCUSATIVE_ONE` verb list; 23 nouns absent from `src/data/nouns.ts` (grep) |
| `metadata-guard.mjs mark-researched` | `changed: true` |
| lint / typecheck / tests / build / e2e | not run: research-only step, no code touched (baseline on main e2f7caa: lint OK, typecheck OK, 2479 tests, build OK, e2e 82 — inherited, unverified) |

## 4. Next command

`/10x-plan text-measure-time-types`

## 5. Open

- Plan decisions (research § Open Questions): INEQUALITY several right tiles (recommended, + DESIGN-GAP row from 98 in `docs/design-gaps.md`) vs one; MIX round composition (step-first recommended); review step excluded from `calendarStart`/`floorToCalendar`/`firstPlayableSteps` (recommended); `speak` texts for times and numbers ≥ 1000 (`MAX_NUMBER_WORD` in `src/core/text/numberWords.ts`).
- Calendar side effect even with the review step excluded: E6.2 playable moves autumn E6 start from E6.3 to E6.2 and puts E6.2 into the E6 warm-up; `tests/curriculumStart.test.ts` oracle and E6 lists, `tests/curriculumEnd.test.ts`, `tests/curriculumPick.test.ts`, `tests/progress.test.ts`, `tests/perimeterSkills.test.ts`, `tests/mass.test.ts` pin today's data.
- Unlock-threshold rises (research § 7 table): E1.9, E5.3, E5.7, E5.10, E5.12, E6.3, E6.5, E6.9, E6.10 (+ E5.5 if `capacity_half_l_e5`) — `[human]` PR note; nothing moves backwards (`endRound`, `floorToCalendar`).
- `artBlocked` (`src/core/round/artFilter.ts`) must exempt MASS text variants; `parsePlaceValueParams` 999 check per variant.
- Validator: add duration verbs (trwa…) to `ACCUSATIVE_ONE` or avoid "1 godzinę/minutę" in durations; avoid locative time phrases ("po … minutach").
- Not inspected: e2e specs referencing E6 steps — plan greps them before changing E6 data.
- Follow-ups out of scope keep/retarget triggers at archive (change.md § Triggered follow-ups).

## 6. Autonomous decisions

1. **Scope from change.md, no interview.** Chosen: research the questions in change.md and the step prompt. Rejected: asking. Why: contract rule 1. Would change: nothing.
2. **INEQUALITY recommendation = several correct tiles (option A).** Rejected: one correct tile (B). Why: ZADANIA § 4 "wiele poprawnych odpowiedzi"; `isCorrect` already supports it; four bounded fixes. Would change: plan budget exceeded or the teacher read finding several right tiles confusing for E1.
3. **Review step excluded from calendar start and warm-up (recommendation, agrees with change.md decision 4).** Rejected: summer start on E6.11. Why: ZADANIA calls E6.11 a "finałowe wyzwanie" reached by progress. Would change: the author wanting the summer start to be the year's review.
4. **MIX composition: step first, then skill (recommendation).** Rejected: uniform over skills. Why: ZADANIA is silent; uniform lets many-skill steps dominate. Would change: the teacher read or playtest preferring weighting by skills.
5. **`capacity_half_l_e5` judged feasible as text (½ and ¼ l, both directions).** Rejected: moving the trigger now. Why: ≥ 20 distinct tasks vs `MIN_DISTINCT` 12. Would change: the invariants failing in implementation → trigger to S-17 (change.md).
6. **Research written in English** like prior research artifacts in `context/archive/`. Would change: a maintainer rule for Polish artifacts.
