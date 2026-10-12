# Handoff — `generators-remaining-stages` (slice S-03)

The `/10x-impl-review generators-remaining-stages` step of run `2026-10-12-s03-remaining-stages` wrote this handoff. It covered the full plan (phases 1–10), the teacher read and one fix commit (`499e449`). The verdict is `MERGE: CLEAR`. Do not lose this before the merge: row 10.5 (CI log check) belongs to the ship step, and rows 10.6 and 10.7 are the maintainer's.

## 1. State

| | |
|---|---|
| Branch | `feat/generators-remaining-stages`, cut from `main` at `a24b502` |
| Commits | … `69cf447` (handoff p10) + `499e449` `fix(generators-remaining-stages): poprawki z impl-review …` + this `docs(generators-remaining-stages): impl-review` commit |
| Pushed / PR / merged | PR/CI/merge recorded in `context/runs/2026-10-12-s03-remaining-stages/run-log.md` (ship step: push + PR open, merge awaits the maintainer) |
| `change.md` status | `archived` (`chore(archive): close generators-remaining-stages`, b35787e); roadmap S-03 `done`, Backlog Handoff refreshed (S-04 ready for `/10x-plan`) |
| `## Progress` rows remaining | 3: 10.5 [reviewer] (CI at ship), 10.6 [human], 10.7 [human] |
| Working tree | clean except the maintainer's untracked `designs/martynka-expansion-v1/` (never staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/generators-remaining-stages/reviews/impl-review.md` | impl-review report: 1 CRITICAL, 7 WARNING, 2 OBSERVATION, with decisions; ends with `MERGE: CLEAR` |
| `context/changes/generators-remaining-stages/reviews/teacher-read.md` | teacher read of `sample --count 6` for E1–E6, with items a)–f) judged |
| `context/changes/generators-remaining-stages/follow-ups/review-fixes.md` | open content items resolved; 6 new follow-ups with `Trigger:` (10 `Trigger:` lines in total) |
| `context/changes/generators-remaining-stages/plan.md` | rows 6.4, 9.4 and 10.4 ticked with `499e449` |
| `context/changes/generators-remaining-stages/change.md` | `status: impl_reviewed` |
| `src/core/tasks/validate.ts` (`ACCUSATIVE_ONE`) | new validator rule: accusative after „ma/kupił/oddał/…/o” for feminine nouns in -a (in 499e449) |
| `src/core/tasks/generators/compareNum.ts` (`digitsPhrase`, `largePartner`), `mult.ts` (`multHint`), `addSub.ts` (`addSubHint`), `factFamily.ts` (`TABLE`), `compareExpr.ts`, `chooseOp.ts` (`MIN_TILES_MAX`), `arith.ts` (`SAME_SHARE`), `missingOp.ts` | content and parser fixes (499e449) |
| `src/data/pl.ts` (`complement`, `oneDigit`), `src/data/calendar.ts` (`timeFacts`), `src/data/curriculum/index.ts`, `CLAUDE.md` „Current state” | Polish text and doc fixes (499e449) |
| `tests/{validate,compareNum,mult,addSub,factFamily,complement,compareExpr,chooseOp,contentInvariants}.test.ts` | tests written first (red), then green (499e449) |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| `npm run lint` | exit 0 (before and after the fixes) |
| `npm run typecheck` | exit 0 (before and after) |
| `GATE_UNIT` from `autonomous-run.env` | exit 0. Before: `Tests 438 passed`. After: `Tests 441 passed` (baseline 236 + 205; review +3). Six `Naruszenia: 0` both times |
| `npm run build` | exit 0 (before and after) |
| `npm run sample -- E1..E6 --count 6` | exit 0, read in full before and after the fixes (`reviews/teacher-read.md`) |
| RED first | 8 new or changed assertions were red before the production edits, plus the 2 parser tests |
| Deliberate break | `compareNum.ts` `digitsPhrase` reverted to `countNoun`: the test "a one-digit number „ma 1 cyfrę”" went red with `"ma 1 cyfra" needs the accusative after "ma"`; restored (`cmp`) |
| Meta-check | at `max: 1 000 000` the same break stayed green, because one-digit numbers are unreachable there after F4. So the guard uses `max: 1000`. That proves both the validator wiring through `forEachDraw` and the fix |
| Hook bypass | none: `.claude/settings.json` was last modified 2026-10-10 and `.claude/hooks/*` before the run; no `--no-verify` |

## 4. Next command

none — PR open, merge awaits the maintainer's „merguj”

## 5. Open

- [ ] 10.5 [reviewer] (CI at ship): in the log of the `check` job of workflow `CI`, the steps matching `##\[group\]Run npm run sample -- E[1256]$`, each followed by `Naruszenia: 0`.
- [ ] 10.6 [human]: the maintainer reads `npm run sample -- <stage> --count 6` for E1, E2, E5 and E6 before merging. Pay special attention to E2.1 `20 − 7` under `bridge: 'none'` (see follow-up; `addSub.ts` `crossesTen`).
- [ ] 10.7 [human]: decide whether E1 uses `keypad` instead of 3–4 tiles (follow-up `Trigger: S-04`).
- Follow-ups with `Trigger:` lines are in `follow-ups/review-fixes.md`:
  - `wordTemplates.ts` `sum.bought` × `złoty` („kupił jeszcze 2 złote”), S-17;
  - step method for the COMPLEMENT and DIV teens hints, S-17;
  - stricter `bridge` option, at the maintainer read or S-17;
  - the AGENTS.md CI sentence;
  - the `parseComplementParams` / `parseRoundingParams` edge cases;
  - bare `\d+` in generator tests.

## 6. Autonomous decisions

1. **Item (a), `20 − 7` under `bridge: 'none'`, is not treated as a step violation. Only the hint is fixed.**
   - Rejected: a stricter `bridge` that excludes a full-ten minuend.
   - Why: ZADANIA E4.2 puts „50 − 3” in a step without crossing, the S-02 `crossesTen` rule says the same, and grade 1 teaches „20 − 7” by analogy with „10 − 7” (E2.1 „budowa 10 + n”).
   - Would change: the maintainer's read (10.6) asking for E2.1 without full-ten minuends. Then add `bridge: 'strict'` and use it in the E2.1 / E3.6 data.
2. **F12 is rewritten for every subtrahend, not restricted to ≥ 6.**
   - Chosen: „10 − b | (a − 10) + (10 − b)”.
   - Rejected: keeping „a − 10 | + rest” for 6–9 only.
   - Why: breaking one ten is the school method for „80 − 7”, reads naturally for 1–9, and its first line never holds the result.
   - Would change: a teacher preferring compensation for 8–9.
3. **The complement prompt is „Ile trzeba dodać do n, żeby było T?”.**
   - Rejected: „Ile brakuje liczbie n do T?” and „Uzupełnij: n + □ = T”.
   - Why: it is the same sentence as the BONDS hint, natural for grade 1, and the prompt stays outside the arithmetic-prompt pattern of the invariants.
   - Would change: an S-04 screen that shows the equation.
4. **„1 cyfrę” comes from a `pl.tasks.oneDigit` string, not from an accusative form in `nouns.ts`.**
   - Why: one use, minimal change. The validator rule `ACCUSATIVE_ONE` catches the whole class anyway.
   - Would change: a second generator needing the singular accusative of a dictionary noun. Then add an accusative form to `nouns.ts`.
5. **COMPARE_NUM partners of a different length differ by one digit, and lengths holding only `max` are skipped.**
   - Rejected: ±2 digits.
   - Why: E6.10 is about reading large numbers, and a 6-digit number against a 4-digit one is still trivial.
   - Would change: a teacher wanting the „more digits” rule shown with bigger gaps.
6. **`checkDiv` is capped at the times table (`TABLE` = 10).**
   - Why: E5.9 is „dzielenie do 100” in the times table.
   - Would change: an E6 step that checks division of a two-digit number by a two-digit one.
7. **Cheap warnings were fixed in the same commit; F8 (word-template context) was deferred.**
   - Why: F8 changes the S-02 word data and the rng sequence of WORD and CHOOSE_OP.
   - Would change: the maintainer flagging it in 10.6.
8. **The skill's continuation question was decided as "Triage findings now"** (contract: never ask). A "how to proceed" question means this step stops after the review.
9. **Archive step: the `/10x-archive` warning prompt was answered "Continue archiving"** (contract: never ask).
   - Warnings: 3 Progress rows pending (10.5 `[reviewer] (CI at ship)`, ticked by the ship step from the CI log; 10.6 and 10.7 `[human]`, a post-run checklist for the maintainer, not a blocker); rows 6.4/9.4/10.4 end with „(reviews/teacher-read.md)” after the SHA, so the SHA-suffix regex flags them (soft signal only).
   - SHA history: no PR merged yet, so the branch commits are not on `main` by design; no repointing offered.
   - Roadmap: S-03 `done` in At a glance and the item body, `## Done` entry added; Backlog Handoff S-04 „Ready for /10x-plan” = yes, with the two `Trigger: S-04` follow-ups restated (E1 keypad vs 3–4 tiles, F14 MISSING first hint).
   - Would change: CI red on the PR, or the maintainer's 10.6 read asking for content changes before merge.
