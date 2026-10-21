<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Task headings, round variety cap, "Obrazki" cut lines, skill id on drawing errors

- **Plan**: context/changes/post-run-polish/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9
- **Date**: 2026-10-21
- **Verdict**: APPROVED
- **Findings**: 0 critical, 0 warnings, 5 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

Branch `feat/post-run-polish` at `de5a308` (base `main` `ba3a7c4`). Source diff: 11 files under `src/`, `scripts/`,
`docs/`, `CLAUDE.md` (about 150 lines), tests in 10 files. Every planned file is in the diff; nothing outside the plan
changed (EXTRA: none). Save format: `SAVE_VERSION` 4; `git diff --stat ba3a7c4..HEAD -- src/core/save.ts
src/core/migrations tests/fixtures src/data/balance.ts src/core/curriculum.ts src/core/mastery.ts` empty.

## Scope fidelity (scope.md)

| scope item | implemented by | verdict |
|---|---|---|
| "Wstaw znak" on comparisons; other misfitting headings; narrator reads the same | `headingOf` (`src/core/round/heading.ts`), `pl.round.heading`, `TaskScene.drawPrompt`, `spokenTask`/`narrationOf` (`headings`), `scripts/sample.ts` | MATCH (MISSING_OP also "Wstaw znak", box-filling "Uzupełnij", gap 154) |
| F3 cap regardless of draw order, shares and unlock thresholds unchanged | `repairCap` in `src/core/round/variety.ts` (rng-free, after the unchanged draw) | MATCH |
| N-1 background sentence removed, `hiddenMs` kept, gap 153 updated | `artHealthLines`, `textOf` in `artHealthView.ts`, `UIScene.openSettings`, `pl.settings.artCutBackground` removed, `BootScene` still writes `hiddenMs` | MATCH |
| H-2 cut count pictures only | `pictureCutCount` (`src/core/artHealth.ts`) in `UIScene.openSettings` | MATCH |
| N-4 skill id on drawing errors, rng unchanged | `assertDrawable` `money` pay tray and `column` (`columnMarks`) cases, inside `generateTask`'s `try` | MATCH (faceDraw is a typed `never`; `faceLabel` already at generation, now pinned by a test) |

## Seams across phases

- **`headingOf` is the one rule.** `TaskScene.drawPrompt` (`wordRound ? null : headingOf(task)`) and `spokenTask`
  (`headings === null ? null : headingOf(task)`) both call it; `isExpression` remains only the layout switch
  (`drawPrompt`, `fitPromptToSteps`) and the first test inside `headingOf`. No second rule, no `'Oblicz'` literal
  outside `src/data/pl.ts`. Word round: no heading on screen and `headings: null` in `currentNarration`. Dice kind:
  `drawnHeading` reset before the early return.
- **`repairCap` vs `spreadTypes` vs the warm-up.** `repairCap` runs inside `pickVariedSkills` before `variedRound`'s
  `spreadTypes`, so the reorder still sees the final multiset; `pickVariedFromStage` (warm-up) untouched (it shares
  `counts` across halves and its pool is the whole stage). Repaired skills stay in their own rolled pool (oracle (e)).
- **`pictureCutCount` vs `artHealthLines`.** Both now speak of pictures: the `cut` input counts `task`/`room`/`ui`, the
  same three tables `artHealthLines` reports; the "cut says it" rule (`cause === 'cut' && cut > 0`) is now consistent
  (a picture with cause `cut` implies a picture cut). The font keeps its `font` line, sounds stay in "Dźwięki".
- **`assertDrawable` vs widget asserts.** The tray check reads the same constant `coinLayout` enforces
  (`TASK_LAYOUT.coinDrag.maxKinds`); the column check calls `columnMarks` itself (no copied limit). See O4.
- **Stale comments.** `grep` of `Oblicz`, `round.calculate`, `artCutBackground`, `bo gra była w tle` over `src scripts
  tests AGENTS.md CLAUDE.md`: only `pl.ts` strings (the heading and unrelated perimeter prompts), test expectations,
  and `TASK_LAYOUT` word-round comment ("no "Oblicz:" line in a word round", still true). `prompt.ts` header updated.

## Success criteria (re-run in this step)

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` | 3736 passed (baseline 3710, +26) |
| `bash deploy/test-martynka-deploy.sh`, `bash deploy/ops/test-martynka-ops.sh`, `npm run sample -- E1..E6` | OK (exit 0) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=<abs> tests/e2e/narrator.spec.ts tests/e2e/load-and-tab-guard.spec.ts` | 10 passed (narrator 4, load-and-tab-guard 6) |
| `npx playwright test --list` | Total: 144 tests (baseline 143, +1) |
| full e2e `--workers=4` on `de5a308` | 144 passed (baseline 143, +1) — orchestrator, observed by it; not re-run here (no product code changed in this step) |
| break 1: `pickVariedSkills` returns the greedy draw (`repairCap` skipped) | RED: 4 tests of `tests/variety.test.ts` (`seeded repro E2.1 seed 1/21`, `E1.10 seed 107`, the 200-seed loop) — `COUNT,BONDS,COUNT,COMPARE_QTY,COUNT: expected 3 to be less than or equal to 2`; restored |
| break 2: `drawPrompt` sets `drawnHeading = pl.round.heading.calculate` for every kind | RED: `#11 the heading …` `Expected: "Wstaw znak"`, `Received: "Oblicz"`; restored, re-run green (rebuilds `dist-e2e/`) |

Meta-check: break 1 proves the repair (the existence oracle in the test never calls `repairCap`); break 2 changes the
scene field the hook reads AND the drawn text (same variable), so the e2e sees the canvas heading, not a recomputation.
The e2e spec does not survive the break named in the handoff. No hook bypass: no `--no-verify` in the log, nothing under
`.claude/` or `.github/` changed by this branch.

## Teacher read ([reviewer] row 2.5)

`npm run sample -- <S> --count 6` for E1–E6, every `czyta:` line read. Heading counts (W = "Wstaw znak", U = "Uzupełnij",
O = "Oblicz"): E1 18/24/24, E2 6/24/30, E3 0/5/31, E4 6/10/68, E5 0/0/48, E6 6/2/36.

- **"Wstaw znak"**: COMPARE_NUM "3 □ 5", "69 □ 46", "614 126 □ 202 735" → "Wstaw znak. Jaki znak pasuje w okienku? …";
  COMPARE_EXPR "10 − 7 □ 6 − 3" → "Wstaw znak. Porównaj wyniki. Jaki znak pasuje w okienku? …"; MISSING_OP "10 □ 3 = 7"
  → "Wstaw znak. Jakiego znaku działania brakuje w okienku? …". Fits each task (tiles < > = or + −); a school
  imperative followed by one question, natural for 6–9-year-olds.
- **"Uzupełnij"**: MISSING with the box inside ("4 − □ = 1", "□ − 7 = 4") → "Uzupełnij. Jaka liczba pasuje w okienku?";
  FACT_FAMILY swap "11 + 3 = 3 + □"; PLACE_VALUE decompose "35 = 30 + □", "4466 = □ + 400 + 60 + 6". Fits: a number is
  missing inside an equality. No clash with ARROW_TABLE's own sentence "Uzupełnij graf." (no heading there: not an
  expression).
- **"Oblicz"**: bare ADD_SUB, MULT, DIV, CHAIN, ORDER_OPS; MISSING result slot "17 − 8 = □" → "Oblicz. Jaka liczba pasuje
  w okienku? …" (see O1).
- Numeral agreement, prompts, answers, hints unchanged by this change (phase 2/4/7 sample diffs).

Verdict: **pass** (row 2.5 ticked).

### Round print per stage (variety cap)

Scratch script over every playable step × seeds 1–200 with `variedRound` and the real buckets/weights, plus an
independent brute-force check of the rolled pools (replayed from the seed): rounds with 3+ of one type /
avoidable ones — E1 474/0, E2 543/0, E3 432/0, E4 424/0, E5 436/0, E6 316/0 (of 2200, 2000, 2200, 1600, 2400, 2200).
Sample rounds (seed 1): E1.4 `CALENDAR,COMPARE_NUM,CHOOSE_OP,COMPARE_QTY,CALENDAR`, E2.4
`FACT_FAMILY,MONEY_COUNT,CAPACITY,ADD_SUB,FACT_FAMILY`, E4.1 `MONEY_CHANGE,MASS,PLACE_VALUE,DATA,MONEY_CHANGE`, E6.4
`DIV,TIME_UNITS,MASS,CALENDAR,DIV`. **No avoidable 3-of-a-kind** in any stage; every remaining one is forced by the
rolled pools (see O3).

## [reviewer] row 8.5 (CLAUDE.md vs code)

`headingOf` (`src/core/round/heading.ts`), `pl.round.heading` (three keys as named), `pictureCutCount`
(`src/core/artHealth.ts`, used in `UIScene.openSettings`), `assertDrawable` cases `money` pay and `column` exist as the
sentences say; "save format stays v4" stated; the variety sentence names the rng-free repair; the boot sentence names
the ordinary cut line and the picture-only count; `artCutBackground` absent from `CLAUDE.md`. Gap 153 reads as closed
by post-run-polish with `hiddenMs` kept; gap 154 names both headings, the maintainer's and the agent's wording, files
`src/data/pl.ts` (`round.heading`), `src/core/round/heading.ts`. Pass (row 8.5 ticked).

## Findings

### O1 — "Oblicz." before a box question on a result slot

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/core/round/heading.ts (`headingOf`, trailing-slot rule), src/data/pl.ts (`pl.tasks.missing`)
- **Detail**: MISSING "17 − 8 = □" is read "Oblicz. Jaka liczba pasuje w okienku? …" — an imperative and a question about
  the box. Planned (P-1, P-2, Known risks); the teacher read finds it acceptable. Already in follow-ups ("The `speak`
  questions may be redundant after the heading").
- **Fix**: none now; the existing follow-up trigger covers it.
- **Decision**: ACCEPTED (follow-up exists)

### O2 — The repair takes the first skill of the new type in the pool

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/round/variety.ts (`repairCap`)
- **Detail**: a changed draw gets `pools[i].find(...)`, so in repaired rounds that skill is a little more frequent and may
  equal a skill drawn elsewhere in the round (prompts are still made distinct by `distinctTasks`). Plan Known risk,
  required to keep the rng use identical.
- **Fix**: none (rng-free is the share contract).
- **Decision**: ACCEPTED

### O3 — About one round in five still has 3 of a type, all forced

- **Severity**: OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: src/core/round/variety.ts (`pickVariedSkills`), src/data/balance.ts (`curriculum.weights`)
- **Detail**: over every step × 200 seeds, 316–543 rounds per stage keep 3+ of one type, none avoidable: they occur
  when 3+ draws roll a current bucket of one or two types (60 % share). This is PA-2's stated exception; lowering it
  needs a finer type key or a change to shares, both outside this scope. The follow-up "Finer type key for the variety
  rule" holds it.
- **Fix**: none in this change; the existing follow-up trigger (a playtest note of a repetitive round) covers it.
- **Decision**: ACCEPTED

### O4 — One coin-tray limit, two constants

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: src/core/tasks/visual.ts (`assertDrawable`), src/core/round/dragLayout.ts (`coinLayout`), src/data/measures.ts (`ART_LIMITS.trayKinds`)
- **Detail**: `assertDrawable` and `coinLayout` read the same `TASK_LAYOUT.coinDrag.maxKinds` (no copied number), while
  generators use `ART_LIMITS.trayKinds`; the new invariant test (`tests/coinLayout.test.ts`, "tray kinds limit") ties
  them. Pre-existing split, now guarded.
- **Fix**: none.
- **Decision**: ACCEPTED

### O5 — Numbers from 1000 are read as digits in the narration

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: src/core/narration/spoken.ts (`spokenText`, `MAX_NUMBER_WORD`)
- **Detail**: E6 lines read "Uzupełnij. 9440 równa się 9000 plus okienko …" and "… 70732 okienko 79656": numbers above
  `MAX_NUMBER_WORD` go to the speech engine as digits. Pre-existing, unchanged by this change
  (phase 2 sample diff touched only the heading prefix); recorded for the reader of the teacher read.
- **Fix**: none in scope.
- **Decision**: ACCEPTED (pre-existing, outside scope; no new follow-up)

## Autonomous decisions (review step)

- Both review lenses (plan drift; safety/quality/patterns) were done in this session instead of two subagents: the
  source diff is 11 files of about 150 lines, smaller than the subagents' hand-off. Would change: a diff large enough
  that reading it here would crowd the context.
- Triage decided in place (no AskUserQuestion, contract rule 1): no CRITICAL, no WARNING; observations accepted with
  their existing follow-ups. Would change: a CRITICAL or a cheap WARNING.
- Full e2e not re-run: no product code changed in this step; the orchestrator's 144 (+1) on `de5a308` is cited as theirs,
  the two changed spec files were re-run here. Would change: a fix commit in this step.

MERGE: CLEAR — no critical or warning findings; unit 3710+26 and the changed e2e specs re-run green, two deliberate breaks red, teacher read passed, save format v4.
