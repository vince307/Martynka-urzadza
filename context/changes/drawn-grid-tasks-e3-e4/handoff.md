# Handoff — `drawn-grid-tasks-e3-e4` (slice S-13b)

Phase 2 (tdd) done and committed as 2166514. Phase 3 can use `cells`/`grid`/`figure` kinds, `GRID_ITEMS`/`GRID_LIMITS` and the registry pattern of `puzzleGrid.ts`; e2e for phase 2 is open (Chromium cannot start in this session).

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-grid-tasks-e3-e4` |
| Commits | 2166514 (phase 2) on c84ece8 (phase 1) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 2.1-2.3 ticked; 2.4 (e2e part) and 2.5 `[reviewer]` open; phases 3-12 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/visual.ts` | kinds `cells`, `grid`, `figure`: validation, key, one-line description (`visualShape` stays `wide`) |
| `src/data/gridItems.ts` | `GRID_ITEMS` (id + noun key), `GRID_LIMITS` |
| `src/data/nouns.ts`, `src/data/pl.ts` | nouns koło, kwadrat, trójkąt, serce; `tasks.puzzle*` strings |
| `src/core/tasks/generators/puzzleGrid.ts`, `registry.ts` | PUZZLE_GRID (`magic`, `pyramid`, `max` 15..30) registered with parser |
| `src/ui/widgets/TaskPicture.ts` | no-op `cells`/`grid`/`figure` cases (`drawn = null`) until phases 5-6 |
| `tests/visual.test.ts`, `tests/puzzleGrid.test.ts` | new tests |

## 3. Verification

| command | result |
|---|---|
| RED | stubbed generator/types: `AssertionError: expected [Function] to throw an error` (parser), `expected undefined to be [Function generatePuzzleGrid]` (registry), validateVisual/key/describe tests red for the new kinds |
| lint / typecheck | OK / OK |
| unit | baseline 2077 + 26 = 2103 passed; deploy and ops scripts OK; `sample` E1-E6 exit 0 (no skill uses PUZZLE_GRID yet, output unchanged) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session — orchestrator gate (Chromium: MachPortRendezvous Permission denied); expected baseline 57 + 0 |
| Deliberate breaks | mirror permutation with a duplicate index -> "cells differ: expected 8 to be 9" red; lattice slanted-edge check disabled -> "reports lattice figure with a slanted edge" red (expected 0 > 0); "exactly one empty" relaxed to `> 1` -> "no empty cell" case red; all restored. Meta-check: the oracle sums cells from the drawing with the answer filled in, not the generator's own `answer` |
| Teacher read (6 draws x 4 variants, scratch script) | hint[0] has no digit and teaches the rule; hints end with the answer; the magic line hints name the full line (wiersz/kolumna/przekątna) and subtract in two steps; pyramid sum case has 2 hints, base case 3 |

## 4. Next command

`/10x-tdd drawn-grid-tasks-e3-e4 phase 3`

## 5. Open

- 2.4 e2e part (orchestrator: 57 + 0), 2.5 `[reviewer]` teacher read of PUZZLE_GRID wording (samples above).
- No skill in the curriculum uses PUZZLE_GRID yet (phase 5 adds E3.5 skills; thresholds change there).

## 6. Autonomous decisions

1. TDD gate: testable, implementation absent -> TDD. Inline scaffolding: `TaskPicture` no-op cases, nouns, `gridItems.ts`, pl strings (phase keeps `Driver: tdd`).
2. Process slip: I wrote the `visual.ts` kinds before the tests, then reverted to HEAD's `visual.ts` for the RED run and restored it for GREEN; RED was observed on real assertions.
3. Magic squares are the 8 symmetries of Lo Shu plus a constant (sum 15 + 3c <= max); rejected random magic generation. Would change: a need for more variety at max 15 (72 variants).
4. Pyramid base cells limited to min(9, max/3) with rejection to keep the top <= max.
5. Grid item ids are English (`circle` ...) with Polish noun keys, drawing ids as elsewhere.
