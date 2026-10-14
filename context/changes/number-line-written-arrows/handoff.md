# Handoff — `number-line-written-arrows` (slice S-14b)

Phase 8 (impl) is committed (`295a5f4`): `playable` admits `digits`, the e2e helpers answer it, E5.2 and E6.7 carry four WRITTEN skills. The e2e part of row 8.1 is NOT verified (Chromium would not start in this session): the orchestrator must run the full suite before anything is built on this phase.

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, from `main` at `882cd93` |
| Commits | plan commits + p1 `cfea708` .. p7 `fd50454` + p8 `295a5f4` + this handoff |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` | 8.2-8.4 ticked; open: 8.1 (e2e part), 8.5 (orchestrator), 1.5, 2.5, 3.5, 4.5, 5.6, 6.5, 7.5, 8.6 [reviewer]; 5.7, 6.6, 8.7 [visual]; 8.8 [human] |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/round/pick.ts` | `playable` admits `digits`; header comment updated |
| `src/data/curriculum/E5.ts`, `E6.ts` | `E5.2.written_add_100` / `written_sub_100` (`carry: 'any'`), `E6.7.written_add_1000` / `written_sub_1000` (`carry: 'required'`), childNames |
| `src/data/pl.ts` | O5: `capacityHalfFact` "Dwa dzbanki po pół litra to litr.", `capacityQuarterAlso` "Cztery po ćwierć litra też." (first hint 61 chars) |
| `tests/e2e/support/hook.ts` | `Snapshot.input: AnswerMode`, `digits` in the snapshot type, `typeDigits(page, value, columns)`, `digits` branches of `answerRight`/`answerWrong`, `unanswerable(never)` guard |
| `tests/pick.test.ts`, `tests/curriculumPick.test.ts`, `tests/warmup.test.ts` | hand lists of playable modes now include `digits` (plan-review F3); `playable` digits assertion |
| `tests/answerModes.test.ts` | oracle expects all five modes playable |
| `tests/curriculum.test.ts` | `WRITTEN` moved from LATER to GROUP_1 |
| `tests/contentInvariants.test.ts` | `LONG_KEYPAD_HINTS` empty; the 64-char rule covers `digits` |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | OK |
| unit `npm test` + deploy + ops tests | 2429 passed (baseline 2417, +12: generated per-skill tests of the four new skills) |
| sample E1-E6 | exit 0, 0 violations; E5 `--count 6` and E6 `--count 6` read |
| build | OK, `e2e hook: absent (2 chunks checked)`; `tests/fixtures/` untouched |
| e2e | `e2e: not runnable in this session — orchestrator gate` (MachPortRendezvous Permission denied on 3 plain tries). Baseline 71 + 0 expected |
| deliberate breaks | (1) `digits` branch removed from `answerRight`: typecheck red (`"digits"` not assignable to `never`). (2) old O5 texts with empty `LONG_KEYPAD_HINTS`: invariant red (75 > 64). (3) `playable` without `digits`: `answerModes`, `curriculumPick`, `pick` tests red. (4) WRITTEN generator allowing a result below the range (the "E6 carry any, result < 100" break): `written`/content tests red. All restored. Meta-check: each red is the rule it names (exhaustiveness, hint length, playability oracle, result range) |
| teacher read | E5.2: add/sub 2-digit tasks, units line "Jedności: 5 + 6 = 11. Piszę 1, 1 dalej."; borrow line "Pożyczam dziesiątkę: 15 − 6 = 9", then "było 6, po pożyczce 5. 5 − 2 = 3"; last line the whole sum; the first hint is only the units column, never the result. E6.7: `required` gives carries/borrows in every task, borrow across a zero ("było 0, po pożyczce 9") reads right. O5: "Dwa dzbanki po pół litra to litr. Cztery po ćwierć litra też." fine. Note: `carry: 'any'` in E5.2 often yields tasks without a carry (accepted by the plan) |

## 4. Next command

`/10x-implement number-line-written-arrows phase 9` (Driver: impl)

## 5. Open

- Orchestrator: run the full e2e suite on `295a5f4`. Specs that can now draw a `digits` task: any spec whose rounds reach E5/E6 with the new steps unlocked: `art-tasks.spec.ts` (opens E5 with forced skills via `?e2eSkills`, so unaffected), `daily-puzzle.spec.ts` (E4, unaffected); rounds from `first-launch.spec.ts` age 10+ proposals (E5/E6 warm-up draws WRITTEN skills from the first 2 playable steps / previous stage) and `playRoundRight`/`answerRight` users now meet `digits` through the new helpers. Watch first-launch, adaptive, narrator, parent-settings, task-round.
- Rows 1.5, 2.5, 3.5, 4.5, 5.6, 6.5, 7.5, 8.6 [reviewer]; 5.7, 6.6, 8.7 [visual]; 8.8 [human] (carry/borrow notation).
- Phase 9: DESIGN-GAP rows 88+ (result boxes, active box, borrow notation, `TASK_LAYOUT.written`), the `WrittenColumn` geometry has still never been seen on screen (2-/3-column, scale 1.3 mark collisions).

## 6. Autonomous decisions

1. Executed in this context via the 10x-implement skill, no subagent; commit message as drafted.
2. `childName` of E5.2 is "Dwucyfrowe, rzymskie, słupek" (28 chars) instead of the plan's "Dwucyfrowe, rzymskie i słupek" (29): the childName test caps at 28. Would change if the cap is raised.
3. `WRITTEN` moved from LATER to GROUP_1 in `tests/curriculum.test.ts` so steps must now keep a WRITTEN skill.
4. `answerWrong` for `digits` gives the answer +1 (or -1 at a digit-count boundary) typed in the same number of boxes.
5. Row 8.1 left unticked (e2e unverified); 8.5 is the orchestrator's.
