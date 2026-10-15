# Handoff — `text-measure-time-types` (slice S-14c)

Written by `/10x-tdd` phase 1 of run `2026-10-15-fix-s14c-s14d`. Phase 1 is done and committed (rule `check` in validator and leak test, INEQUALITY generator registered, no skill in the data). The next agent must not get wrong: no INEQUALITY skill enters `src/data/curriculum/` before phase 2, and phase 2 must NOT add snapshot field names to `vite/e2eHookGuard.mjs`.

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | plan commits + `test(text-measure-time-types): check w walidatorze, przecieku i dystraktorach; generator INEQUALITY (p1)` + this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (tdd skill sets `implementing`; left as is, status changes are the orchestrator's) |
| `## Progress` rows remaining | 60 (`grep -c '^- \[ \]' plan.md`); 1.1-1.4 ticked, 1.5 `[reviewer]` open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/generators/inequality.ts` | `generateInequality`, `parseInequalityParams` (`{max, shapes}`), shapes `add<`, `add>`, `box+<`, `sub>`; own tile builder (2 right + 2 wrong at the boundary), `check`, 3 hint lines; first-line tail number rejected by `check` (draw loop with `MAX_ATTEMPTS`) |
| `src/core/tasks/validate.ts` | new rules `check-answer`, `check-no-wrong`, `check-one-right` (only tasks with `check`, numeric answer, `choices`, input not `select`) |
| `src/core/round/hints.ts` | `leaksAnswer` accepts any number `check` accepts (`isAnswerNumber`) |
| `src/core/tasks/registry.ts` | INEQUALITY registered in `generators` and `parsers` |
| `src/data/pl.ts` | `tasks.inequality`, `inequalityEquality`, `inequalityBoundary`, `inequalityExample` |
| `tests/inequality.test.ts` (new), `tests/validate.test.ts`, `tests/hints.test.ts` | the tests |
| `context/changes/text-measure-time-types/plan.md` | Progress 1.1-1.4 ticked |

## 3. Verification

| command | result |
|---|---|
| RED (stubs first, assertions) | `tests/hints.test.ts`: `AssertionError: expected 'Najpierw zobacz 2' to be null`; `tests/validate.test.ts`: `expected [] to deeply equal [ 'check-answer' ]` (same for `check-no-wrong`, `check-one-right`); `tests/inequality.test.ts` red on the stub; 10 failed / 30 passed |
| `npm run lint` / `npm run typecheck` | OK / OK |
| `npm test` + deploy tests + `sample` E1-E6 | 2491 passed = baseline 2479 + 12 (6 inequality, 5 validate, 1 hints); sample E1-E6 exit 0, output unchanged (no skill uses INEQUALITY) |
| `npm run build` | OK (`e2e hook: absent`) |
| e2e `npx playwright test --config=... --workers=4` | 82 passed = baseline 82 + 0, run in this session |
| Deliberate breaks | `isAnswerNumber` ignoring `check`, validator `check-no-wrong` disabled, `TILES_RIGHT = 3`: 6 tests red (hints, validate, 4 inequality draws); restored, 40/40 green. Meta-check: the inequality tests count right tiles from the printed inequality (regex oracle), not through `task.check`, so the 3-tile break is caught independently |
| Teacher read (INEQUALITY, 4 draws per shape, max 10) | prompts "Jaka liczba pasuje do okienka? 5 + □ < 9", tiles near the boundary, line 1 gives the equality without the result, line 3 "Na przykład 5 + 2 = 7, a 7 < 9. Pasuje 2."; sub> and add> use the reversed equation ("3 = 6 − □", "5 = 2 + □") so the line's last number is never a right tile. Variety: sub> max 10 gives 28 distinct prompts per 400 draws |

## 4. Next command

`/10x-implement text-measure-time-types phase 2` (phase 2, `Driver: impl`)

## 5. Open

- `[reviewer]` 1.5 teacher read: done informally above; the reviewer may re-read `npm run sample` after phase 2 adds the skill.
- `[human]` rows 4.8 and 9.6 as before; DESIGN-GAP row 98 planned in phase 2; follow-ups listed in phase 9 as before.
- Known risks in `plan.md` `## Known risks` unchanged.
- `src/core/tasks/distractors.ts` needed no change (O9). `answerWrong` in `tests/e2e/support/hook.ts` still picks `!== state.answer`: fixed in phase 2 together with the scene.

## 6. Autonomous decisions

1. **Stubbed `generateInequality`/`parseInequalityParams` first so RED is an assertion.** Rejected: red from a missing module. Would change: n/a.
2. **Validator rules apply only to tasks with a numeric answer, `choices` and input not `select`.** Why: EVEN_ODD select has an array answer and must stay green. Would change: another numeric multi-right type with `select`.
3. **Equation orientation in hints ("5 = 2 + □") for `add>` and `sub>`** instead of constraining the numbers, to keep the first line free of a right-tile number while allowing the whole number range. Would change: the author's preference in the 9.6 read.
4. **`MIN_MAX` per shape (5, 5, 5, 4)** as the parser's feasibility test. Would change: other tile counts.
