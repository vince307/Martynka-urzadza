# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the `/10x-tdd` phase 5 step (phase 4's e2e row 4.3 ticked from the orchestrator note: 63 passed on 5a18b39). The LOGIC puzzle pool is built and committed (`9f87fea`); phases 6-13 are untouched. The e2e run of phase 5 is NOT done (Chromium dies at launch in this session): the orchestrator must run the full suite (expected 63, +0).

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 4 docs + phases 1-5 (`b0ad4ba`, `8ee3d18`, `cd5b705`, `5a18b39`, `9f87fea`) + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; phase 5: 5.1-5.3 ticked, 5.4 open (e2e), 5.5 [reviewer], 5.6 [human] open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/puzzles.ts` | `PuzzleDef`, `PuzzleKind`, `puzzleTask(def)` (skillId `PUZZLE.<id>`, tiles if choices else keypad), `puzzlePool(stageId, puzzles, allowedStages)` |
| `src/data/puzzles.ts` | `PUZZLES`: 15 original puzzles (9 E3, 6 E4; floors 3, train 2, number 4, scale 3, water 3) |
| `src/data/nouns.ts` | + piętro, wagon, osoba, paczka, śliwka |
| `scripts/sample.ts` | `--variants` flag: prints the stage's puzzles and validates them (round variants join in phase 6) |
| `tests/puzzles.test.ts` | 18 tests (pool shape, per-puzzle validity, dictionary nouns, pool by stage) |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck / build | OK / OK / OK (`e2e hook: absent`) |
| unit + deploy scripts + sample E1-E6 | 2287 passed (branch baseline 2269, +18); sample exit 0; `sample -- E3 --variants` 9 puzzles, `E4 --variants` 15, 0 violations |
| RED | stubbed exports, empty pool: `AssertionError: expected 0 to be greater than or equal to 10` and `expected 0 to be greater than 0` |
| Breaks | hint 1 ending with the answer (", to 5") -> red; `choices` without the answer -> red; `5 piętra` -> inflection red; `wagon` removed from nouns -> dictionary test red (the validator alone skips unlisted nouns, so that test is the guard); all restored |
| Teacher read (own, all 15) | each answer unique (number-odd 17 with 19 excluded; number-digits 63; train-bear 9 = 3+1+5; train-queue 12 = 7+1+4; water-empty 3, emptying the small jug is the distractor); E3 answers <= 25, E4 uses `· 5`, `: 5`; agreement 3 piętra / 7 pięter, 5 wagonów, 4 osoby, 2 dziesiątki, 2 paczki, 2/4 śliwki, 5/3/2/8/7/4 litr forms right; verbs match names (Kasia mieszka, Janek stoi); "Jestem większa/liczbą" feminine; hint 1 names a method and never ends with the answer; hint 2 closes with the answer. Original puzzles; `docs/zrodla/` not read |
| e2e | not runnable in this session - orchestrator gate (Chromium fails at launch); expected 63 (+0), no UI touched |

## 4. Next command

`/10x-tdd minigame-daily-puzzle phase 6` (Phase 6: Rundy minigier w `core` - rzuty Zakrywanki i zadania Hasla).

## 5. Open

- 5.4 e2e part (orchestrator), 5.5 [reviewer], 5.6 [human]; 4.4 [reviewer]; 3.4 e2e, 3.5 [reviewer], 3.6 [visual]; earlier 1.5, 1.6, 2.5.
- DESIGN-GAP 82 row in `docs/design-gaps.md` still due in phase 10.

## 6. Autonomous decisions

1. `PuzzleDef` lives in `src/core/puzzles.ts` (data imports the type from core, as the boundary allows); `puzzlePool` takes the allowed stage list (`balance.variants.puzzleStages`) as a parameter. Would change: the pool rule moves into the scheduler.
2. The prompt-length check allows up to 3 sentences (plan: 1-3).
3. The plan's table text was used verbatim; no puzzle changed after my read.
