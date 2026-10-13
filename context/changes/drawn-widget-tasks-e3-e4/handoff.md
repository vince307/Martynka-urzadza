# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by `/10x-tdd` phase 2 (commit 43002aa): generators CLOCK and LENGTH exist, registered, not yet in the curriculum data (phase 6).
The ordering rule stays: no answer mode enters `playable` (`src/core/round/pick.ts`) before `tests/e2e/support/hook.ts` `answerRight`/`answerWrong` can answer it (`select` phase 7, `drag` phase 9).

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | docs/plan commits + `42a0bee` p1 + `43002aa` p2 + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (open: 1.5 [reviewer], 2.4 e2e part, 2.5 [reviewer], phases 3-11) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/generators/clock.ts` | `generateClock`, `parseClockParams` (variants read / later / h24, 3 text tiles) |
| `src/core/tasks/generators/length.ts` | `generateLength`, `parseLengthParams` (ruler cm/mm with optional shifted start, convert m to cm) |
| `src/core/tasks/{registry,bounds,validate}.ts` | CLOCK/LENGTH registered; CLOCK in `UNBOUNDED_TYPES`; accusative rule now also after "za" |
| `src/core/round/hints.ts` | `leaksAnswer` judges clock-text answers ("15.00") as whole tokens |
| `src/data/pl.ts`, `src/data/nouns.ts` | `pl.tasks.clock*`/`length*`; nouns `godzina`, `minuta` |
| `tests/clock.test.ts`, `tests/length.test.ts`, `tests/{hints,validate,contentInvariants}.test.ts` | new/extended tests |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs in place) | `AssertionError: E3.3.clock_read_full seed=1 draw=0 prompt="": expected [ { …(3) } ] to deeply equal []`; `expected function to throw an error, but it didn't`; `expected 'Po południu dodaj 12: 15.00' to be null` (observed) |
| `npm test` | 1310 passed (branch baseline 1276, +34) (observed) |
| lint / typecheck / build | OK / OK / OK, `e2e hook: absent (2 chunks checked)` (observed) |
| deploy tests, `npm run sample -- E1..E6` | OK; exit 0 each; `git diff --stat tests/fixtures` empty (observed) |
| Deliberate breaks | `later` without wrap12 -> 2 clock tests red; ruler answer = end mark -> both ruler 1000-draw tests red; `leaksAnswer` numeric only -> clock-token test red; accusative regex without "za" -> validate test red; all restored. Meta-check: oracles read the drawing (`visual`), not `task.answer` (observed) |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied); expected `37 passed` (baseline 37, +0). Row 1.4 ticked from the orchestrator note |

## 4. Next command

`/10x-tdd drawn-widget-tasks-e3-e4 phase 3`

## 5. Open

- Row 2.4 stays unticked until the orchestrator runs e2e (expect 37 passed); rows 1.5 and 2.5 are [reviewer]. Reviewer: sample draws printed during the phase looked right (agreement "za 1 godzinę", hints gradual: hands, short hand, long hand, answer); `sample` shows CLOCK/LENGTH only after phase 6.
- Manual `[human]` rows and DESIGN-GAPs 52-58 as in the plan-review handoff (phases 4-10).
- `TaskScene.render` temporary throw for `select`/`drag` is removed in phases 7 and 9.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. Hint text for `read`/`later` is 4/4 lines (hands overview without numbers, short hand, long hand, answer) so the first hint never states the hour. Reverses if the teacher read wants shorter hints.
2. `leaksAnswer` judges only time-shaped text answers (`^\d{1,2}\.\d{2}$`), matched as a whole token ("1.00" is not found in "11.00"); symbol/word answers ("<", month names) stay unjudged.
3. Accusative check extended with "za" in `validate.ts` (needed for "za 1 godzinę"); `pl.tasks.clockLater` writes "1 godzinę" explicitly.
4. `h24` third tile is a neighbouring afternoon hour; the "without 12" tile (3.00 for 15.00) is always present. `convert` never draws "1 m" without centimetres (would leave a one-line hint).
5. Plan item "hints.test try/catch counts skips": every skill generates today, so the expected skip count is 0 in both loops (asserted).
6. Mixed phase: none; all inline pieces (registry, nouns, pl strings) are part of the tested behaviour.
