# Handoff — `task-round-stars` (slice S-04)

Written by `/10x-tdd task-round-stars phase 4` of autonomous run 2026-10-12-s04-s08. Phases 1 (9f57306), 2 (d77b9c8), 3 (7d99976) and 4 (6593472) are committed; phases 5–11 are untouched. Phase 4 added the pure view model, skill picker and keypad buffer in `src/core/round/`.

## 1. State

| | |
|---|---|
| Branch | `feat/task-round-stars`, cut from `main` at `58244a5` |
| Commits on branch | 5 docs + p1 `9f57306` + p2 `d77b9c8` + p3 `7d99976` + p4 `6593472` + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; becomes `implemented` after phase 11) |
| `## Progress` rows remaining | 41 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/round/view.ts` | New: `roundView(state, answerLine)` -> `RoundView` {dots (done/current/todo + outcome), input tiles/keypad (tiles iff `task.choices`), choices, bar (none / hint{line|null} / solution{lines up to step, button next|gotIt} / retype{last step} / correct{star} / roundEnd{bonus}), inputActive, switchVisible always false}; `answerLine` is the Polish "Wynik: x" mapper the scene passes (core has no text) |
| `src/core/round/pick.ts` | New: `pickSkills(stage, rng, count)` uniform over tiles/keypad skills with a registered generator, `RangeError` when empty; `buildRound(stage, rng, rules, tileCount)` via `generateTask` |
| `src/core/round/keypad.ts` | New: `keypadInput(buffer, key, maxDigits)` -> `{buffer, submit}`; digits, `delete`, `ok` (empty -> `submit: null`), no leading zeros |
| `src/data/balance.ts` | + `keypad: { maxDigits: 7 }` |
| `tests/roundView.test.ts`, `tests/pick.test.ts`, `tests/keypad.test.ts` | New, 10 + 7 + 7 = 24 tests |
| `plan.md` | Progress rows 4.1-4.3 ticked with 6593472 |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs returning empty values) | assertion failures, e.g. `appends digits`: `expected '' to be '12'`; `returns the requested count`: `expected [] to have a length of 5 but got +0`; `second try shows the first hint line`: `expected { kind: 'none' } to deeply equal { kind: 'hint', line: '2 + 3' }`; 19 of 24 red |
| GREEN | 24 passed |
| Deliberate break 1 | `pickSkills` without the tiles/keypad filter: 3 of 7 red in `pick.test.ts`. Restored. Meta-check: the stages really contain `select` skills (own test), so the 1000-seed filter test is not vacuous |
| Deliberate break 2 | `retype` bar without the last step: 1 of 10 red in `roundView.test.ts`. Restored |
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | Tests 573 passed (branch baseline 549, +24); deploy tests OK; `sample` E1-E6 `Naruszenia: 0` |
| `npm run build` | exit 0 |
| `npx playwright test` | 1 passed (baseline 1, +0) |

## 4. Next command

`/10x-implement task-round-stars phase 5`

## 5. Open

- Manual rows 1.5 and 2.5 `[reviewer]` are NOT ticked; no `reviews/teacher-read.md` written (reviewer row).
- Known gap (plan Known risks): single-line hints and HALF get no first hint, only "Spróbuj jeszcze raz" (human row 10.6).
- Phase 5+ notes: the scene maps `bar.kind` and `bar.line === null` to `pl` strings; `inputActive` gates taps; the "Dalej" button maps to `next` (done/correct bar), `nextSolutionStep` (solution bar); `balance.keypad.maxDigits` goes to `keypadInput`. Dots: current stays on the task until `next`.
- Carried items unchanged: human rows 8.5, 10.5-10.8, `[visual]` rows 5.6, 6.4, 7.4, 8.4, DESIGN-GAPs and follow-ups written in Phase 10.

## 6. Autonomous decisions

1. **`roundView` takes `answerLine` as an argument** (plan's `hintsFor`): core stays free of Polish text. Would change: a text-free solution walk.
2. **Input mode derives from `task.choices`** (tiles iff present), since `Task` carries no answer mode. Would change: a task type with both tiles and keypad.
3. **Dots**: a finished task is `done` only after "Dalej"; while in `done` phase it stays `current`. Would change: kit showing the dot filled at once.
4. **`keypadInput` returns `{buffer, submit}`** instead of a bare number|null so one call serves digits, delete and ok. A typed digit replaces a lone "0".
5. Skill prompts (exec mode, commit message, next phase) decided in place; stopped after phase 4.
