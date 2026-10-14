# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the `/10x-tdd` phase 6 step. The minigame rounds exist in `core` (`15fde6b`); phases 7-13 are untouched. The e2e run of phase 6 is NOT done (Chromium dies at launch in this session): the orchestrator must run the full suite (expected 63, +0). Do not enable `balance.variants.minigames` before phases 8/9.

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 4 docs + phases 1-6 (`b0ad4ba`, `8ee3d18`, `cd5b705`, `5a18b39`, `9f87fea`, `15fde6b`) + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; phase 6: 6.1-6.3 ticked, 6.4 open (e2e), 6.5 [reviewer] open; 5.4 ticked from the orchestrator note |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/minigames/dice.ts` | `diceBoard(rng, rules, text)` -> 13 `DiceThrow {a,b,op,target,task}` (targets 0..12 shuffled, once each; 0-1 only differences, 6-12 only sums, 2-5 either), `coveredAfter(board, completed)` |
| `src/core/minigames/word.ts` | `buildWordRound(stage, previous, adaptation, rng, {tiles, uniqueRetries, words})` -> `{word, tasks}` or null (pools: unlocked steps, first step with arithmetic, previous stage); `revealed(word, completed)` |
| `src/data/minigames.ts` | `MINIGAME_WORDS` (KANAPA, DYWAN, STOLIK, LAMPA, PÓŁKA, OBRAZ) |
| `src/data/pl.ts` | `pl.minigames` (HUD titles, dice hints, `puzzleDone`, `wordHint`) |
| `scripts/sample.ts` | `--variants` also prints one dice board and `--count` word rounds, validated |
| `tests/dice.test.ts`, `tests/wordRound.test.ts` | 4 + 13 tests |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck / build | OK / OK / OK (`e2e hook: absent`) |
| unit + deploy scripts + sample E1-E6 (+ `--variants` E1-E6) | 2304 passed (branch baseline 2287, +17); deploy scripts OK; every sample exit 0 |
| RED | stubs returning empty: `AssertionError: seed 0: expected +0 to be 13`, `expected [ -1 ] to deeply equal []`, `expected [ 'KANAPA', … ] to include ''` |
| Breaks | subtrahend `rng.int(1, 6)` instead of `1..6-target` -> `expected 10 to be less than or equal to 6`; targets drawn with repeats instead of a shuffle -> coverage red; word: `LENGTH` added to the types AND the drawing guard removed -> 4 red; the drawing guard alone removed with `LENGTH` allowed -> 2 red (first attempt with `CLOCK` stayed green: its answers are strings, so the number-answer guard caught it - a wrong break, replaced by `LENGTH`); all restored |
| Teacher read (own) | `sample -- E1/E3/E5 --variants`: hints "Policz razem oczka obu kostek." / "Odejmij oczka drugiej kostki." then "Zacznij od 6 i dodaj 6." never ends with the result; prompts `6 − 4` with the true minus; word tasks stay in the stage (E1 to 10, E3 to 20, E5 `48 : 8`, `95 − 30`), 3 tiles, answer among them, no repeated prompt; words with Ó/Ł (PÓŁKA) handled letter by letter |
| e2e | not runnable in this session - orchestrator gate (Chromium MachPortRendezvous Permission denied, 3 plain tries); expected 63 (+0), no UI touched |

## 4. Next command

`/10x-implement minigame-daily-puzzle phase 7` (Phase 7: Wariant rundy w `TaskScene`, zagadka dnia x2, tytuł HUD i szwy e2e).

## 5. Open

- 6.4 e2e part (orchestrator), 6.5 [reviewer]; 5.5 [reviewer], 5.6 [human]; 4.4 [reviewer]; 3.4 e2e, 3.5 [reviewer], 3.6 [visual]; earlier 1.5, 1.6, 2.5.
- DESIGN-GAP 82 row in `docs/design-gaps.md` still due in phase 10 (the new `pl.minigames` texts are ours).
- Phase 7 builds `variantRules(kind, n, balance)` (`src/core/variants.ts`); dice rules there: length 13, bonus 0.

## 6. Autonomous decisions

1. Dice tasks keep `skillId: 'DICE'` and a keypad-less shape (no `input`, no `choices`): the screen in phase 9 decides the answer mode. Would change: phase 9 wants tiles -> add `choices` in `makeThrow`.
2. `DiceThrow` is its own type (a, b, op, target, task); `Task.visual` was not extended, so no exhaustive `TaskVisual` switch changed. Would change: the e2e hook needs the dice as a visual.
3. `core` gets hint texts and words as parameters (`DiceText`, `WordRules.words`), tests pass `pl`/`MINIGAME_WORDS`.
4. Word pool fallback follows the plan: unlocked steps, then the first step of the stage with arithmetic, then the previous stage; `ADD_SUB`/`MULT`/`DIV` keypad skills are drawn as 3 tiles (skill copy with `answer: 'tiles'`), tasks with a drawing or a non-number answer are redrawn.
5. Mixed phase: none; the `sample.ts` flag and `pl.minigames` texts were inline scaffolding.
