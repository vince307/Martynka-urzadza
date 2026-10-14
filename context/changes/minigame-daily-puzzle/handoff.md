# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the `/10x-implement` phase 9 step. "Zakrywanka" is on screen and `balance.variants.minigames` is `['word', 'dice']`. The e2e run of phase 9 is NOT done (Chromium dies at launch in this session): the orchestrator must run the full suite (expected 63, +0).

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 4 docs + phases 1-9 (`b0ad4ba`, `8ee3d18`, `cd5b705`, `5a18b39`, `9f87fea`, `15fde6b`, `b3d448f`, `5acd621`, `120a26f`) + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; phase 8: 8.3 ticked from the orchestrator note (63 passed on 5acd621), 8.4 [visual], 8.5 [human] open; phase 9: 9.1, 9.2 ticked, 9.3 open (e2e), 9.4 [visual], 9.5 [human] open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/minigames/dice.ts` | + `coverBoardCells(grid, count)` (13 fields, second row from the second column), `CoverGrid`/`CoverCell`; every throw task now has `input: 'tiles'` and `choices` 0..12 so the round view treats the board as the tile row |
| `src/ui/widgets/Dice.ts`, `CoverBoard.ts` | two dice with the sign (pips drawn in code); the board (covered field = green + check drawn as strokes, ignores taps; `targets()` = uncovered fields only) |
| `src/data/layout.ts` | `MINIGAME_LAYOUT.dice` / `.board`, `PLACEHOLDER_COLORS.result*/die*`, `FONT_SIZES/WEIGHTS.result|diceSign` |
| `src/scenes/TaskScene.ts` | `dice` field, `kind === 'dice'` branch in `freshRound`, `render` (board + dice, answer tiles hidden, solution lines above the dice, done card "Brawo!" + "Wszystkie pola zakryte!"), `drawPrompt` returns early, `answerSpot`; snapshot `variant.covered`, hook `targets.tiles` = board fields in a dice round |
| `src/ui/widgets/MinigameDoneCard.ts` | the line shrinks to fit the card |
| `src/data/balance.ts` | `minigames: ['word', 'dice']` |
| `tests/dice.test.ts` | +3 tests (`coverBoardCells`: 13 fields in 7+6 rows, disjoint, throws offer tile mode) |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck / build | OK / OK / OK (`e2e hook: absent (2 chunks checked)`) |
| unit + deploy scripts + sample E1-E6 | 2322 passed (branch baseline 2319, +3); deploy scripts OK; every sample exit 0 |
| Break | `coverBoardCells` second row from column 0 -> `has 13 fields 0..12 in two rows…` red (`expected 361 to be 541`); restored, green. Meta-check: proves the board geometry only; the scene wiring (cover per finished throw, done card) is for the e2e and the visual gate |
| e2e | `e2e: not runnable in this session — orchestrator gate` (Chromium dies at launch, plain command, `task-round` filter). Expected 63 (+0) |
| Teacher read | no change to generators or content lists (flag `minigames`, layout); dice hints are the phase 6 strings |

**Specs the orchestrator must watch.** Dice is now on for EVERY stage. It appears as the 2nd variant of a context (alternation after `word`), or as the 1st when no word round can be built. Contexts that reach their 4th ordinary round get a variant, a 2nd variant needs 7 rounds. Specs without `e2eVariant=off` that play rounds: `task-round`, `first-launch`, `narrator`, `save-restart`, `room-change`, `save-transfer-blocked`, `error-boundary`, other `parent-settings` tests. A dice round has 13 tasks (`playRoundRight(page, 5)` would stop early); on a dice round `answerRight`/`answerWrong` work unchanged (hook `targets.tiles` = uncovered board fields, `input` is `'tiles'`). If one goes red with the board on screen ("Kostki · 0–12"), add `e2eVariant=off` there. Already off: `adaptive`, `room-purchase`, `parent-settings` (#14), `save-transfer`.

## 4. Next command

`/10x-implement minigame-daily-puzzle phase 10` (Phase 10: Seam sweep, luki projektu, follow-upy i dokumentacja).

## 5. Open

- 9.3 e2e (orchestrator), 9.4 [visual: `?e2eVariant=dice` — dice at start, second try, solution steps, a covered field, the done card; 1440x900 and 1024x768], 9.5 [human]; 8.4, 8.5, 7.5, 7.6, 6.5, 5.5, 5.6, 4.4, 3.4-3.6, 1.5, 1.6, 2.5 as before.
- Visual-gate risks: solution lines sit above the dice (y 232-336, ~3 lines scaled down to 0.6 minimum) and may crowd the HUD title; the bar sits under the board (board ends y 860, bar bottom 960); "Wszystkie pola zakryte!" is shrunk on the done card.
- DESIGN-GAP 86 (dice faces and solution lines above the dice) is named in `MINIGAME_LAYOUT` comments; the row in `docs/design-gaps.md` is due in phase 10 with 79-85. The kit has no covered-board feedback copy (`board-feedback`): the standard bar is used.

## 6. Autonomous decisions

1. The board is the `tiles` answer mode: throw tasks carry `input: 'tiles'` + `choices` 0..12; the scene hides `AnswerTiles` and answers come from `CoverBoard`. Chosen so the reducer, view, snapshot and e2e helpers (`answerRight`/`answerWrong`) work unchanged. Rejected: a new answer mode. Would change: a separate `board` target key is wanted.
2. A field is covered when its throw is finished, including one settled by solution + retype (same rule as Hasło letters).
3. Solution lines go above the dice (`solutionTop` 232, limit 336) since the kit has no solution spot and the board fills the lower half. Would change: the visual gate shows overlap.
4. Done card: title "Brawo!", line "Wszystkie pola zakryte!" shrunk to fit.
5. Mixed phase: none (impl).
