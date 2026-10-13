# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by `/10x-tdd` phase 3 (commit d481d3c): generators PLACE_VALUE and DATA exist (plus CLOCK and LENGTH from phase 2), registered, not yet in the curriculum data (phase 6).
The ordering rule stays: no answer mode enters `playable` (`src/core/round/pick.ts`) before `tests/e2e/support/hook.ts` `answerRight`/`answerWrong` can answer it (`select` phase 7, `drag` phase 9).

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | docs/plan commits + `42a0bee` p1 + `43002aa` p2 + `d481d3c` p3 + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (open: 1.5, 2.5, 3.4 [reviewer]; 3.3 e2e part; phases 4-11) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/generators/placeValue.ts` | `generatePlaceValue`, `parsePlaceValueParams` (read, tens, decompose, build) |
| `src/core/tasks/generators/data.ts` | `generateData`, `parseDataParams` (most, least, howMany, diff; all bar values distinct) |
| `src/data/charts.ts` | `chartThemes` (fruit, animal, colour: label + accusative) |
| `src/core/tasks/registry.ts`, `src/data/{pl,nouns}.ts` | PLACE_VALUE/DATA registered; `pl.tasks.placeValue*`/`data*`; noun `setka` |
| `tests/placeValue.test.ts`, `tests/data.test.ts` | new (30 tests) |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs in place) | `AssertionError: E3.4.data_most_10 seed=1 draw=0 prompt="": expected [ { …(3) } ] to deeply equal []`; same shape for place_read_*; parser rejects: `expected function to throw` (observed) |
| `npm test` | 1340 passed (branch baseline 1310, +30) (observed) |
| lint / typecheck / build | OK / OK / OK, `e2e hook: absent (2 chunks checked)` (observed) |
| deploy tests, `npm run sample -- E1..E6` | OK; exit 0 each; `git diff --stat tests/fixtures` empty (observed) |
| Deliberate breaks | DATA values with ties -> 3 data tests red; `read` answer 10h+t+o -> 3 place_read tests red; parser accepts build max 999 -> parser test red; all restored. Meta-check: oracles read the drawing fields (blocks, bars), not `task.answer` (observed) |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied); expected `37 passed` (baseline 37, +0). Row 2.4 ticked from the orchestrator note; row 3.3 e2e part left unticked |

## 4. Next command

`/10x-implement drawn-widget-tasks-e3-e4 phase 4`

## 5. Open

- Row 3.3 stays unticked until the orchestrator runs e2e (expect 37 passed); rows 1.5, 2.5, 3.4 are [reviewer]. Teacher read of printed draws: agreement ("5 setek", "2 dziesiątki", "1 jedność"), accusative after "na" ("na kota", "na kolor czerwony"), hints do not state the result first; `sample` shows PLACE_VALUE/DATA only after phase 6.
- Manual `[human]` rows and DESIGN-GAPs 52-58 as in the plan-review handoff (phases 4-10).
- `TaskScene.render` temporary throw for `select`/`drag` is removed in phases 7 and 9.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. DATA prompt = one theme sentence ("Dzieci głosowały na swój ulubiony owoc.") + the question; votes are phrased "dostał najwięcej głosów" / "zagłosowało na <accusative>", so no counted noun appears and no chart noun needs a nouns.ts entry (only `setka` added). Reverses if the teacher read wants the theme sentence dropped.
2. DATA `most`/`least` offer all 3-4 bar labels as tiles (not a fixed 3); bar values are always distinct (no ties anywhere), so `diff` is always positive.
3. PLACE_VALUE `tens` answers the tens digit and is restricted to 10..99; `decompose` skips full tens and numbers up to 10; `read` hints list hundreds/tens lines, a sum line when two or more places, then the answer; `build` hints are 2 lines, the first without digits.
4. Mixed phase: none; the pl strings, nouns and `charts.ts` are part of the tested behaviour.
