# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the `/10x-implement` phase 8 step. "Hasło z wyników" is on screen and `balance.variants.minigames` is `['word']`. The e2e run of phase 8 is NOT done (Chromium dies at launch in this session): the orchestrator must run the full suite (expected 63, +0).

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 4 docs + phases 1-8 (`b0ad4ba`, `8ee3d18`, `cd5b705`, `5a18b39`, `9f87fea`, `15fde6b`, `b3d448f`, `5acd621`) + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; phase 8: 8.1, 8.2 ticked, 8.3 open (e2e), 8.4 [visual], 8.5 [human] open; 7.4 ticked from the orchestrator note (63 passed on b3d448f) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/minigames/word.ts` | + `wordAvailable(stage, previous, adaptation, words)`, `lettersUncovered(outcomes)` (one letter per finished task, retype counts), `letterRow(count, {width, gap}, centerX)` |
| `src/ui/widgets/LetterTiles.ts`, `MinigameDoneCard.ts` | letter boxes (hidden = "·" from `pl.minigames.hiddenLetter`, uncovered on green); done card ("Brawo!", the word, "+N" with a star, "Kolejna runda"/"Do pokoju"), shared with the dice game in phase 9 via `show({title, line, earned, roomHighlighted})` |
| `src/data/layout.ts` | `MINIGAME_LAYOUT`, `PLACEHOLDER_COLORS.letter*`, `FONT_SIZES/WEIGHTS.letter|doneWord` |
| `src/scenes/TaskScene.ts` | `word` field, `kind === 'word'` branch in `freshRound` (null build falls back to an ordinary round), `render` (letters; done card instead of `SummaryPanel`), `drawPrompt` (no "Oblicz:", expression on `expressionY`, sentence on `promptY`), solution lines stop above the tiles in a word round, `nextKind` uses `wordAvailable`; snapshot `variant.letters`, targets `doneNext`/`doneRoom` |
| `tests/wordScreen.test.ts` | +7 tests |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck / build | OK / OK / OK (`e2e hook: absent (2 chunks checked)`) |
| unit + deploy scripts + sample E1-E6 | 2319 passed (branch baseline 2312, +7); deploy scripts OK; every sample exit 0 |
| Break | `letterRow` without the gap (`total = count * width`, step `width`) -> `puts 5/6 letters side by side, a gap apart…` red (`box 1: expected 132 to be 156`); restored, green. Meta-check: it proves the row geometry only; the scene wiring (reveal per task, card instead of summary) is covered by the orchestrator's e2e and the visual gate, not by unit tests |
| e2e | `e2e: not runnable in this session — orchestrator gate` (Chromium dies at launch, plain command, `task-round` filter). Expected 63 (+0) |
| Teacher read | no change to generators or content lists (flag `minigames`, layout, one glyph in `pl.ts`); the word tasks are existing ADD_SUB/MULT/DIV skills rendered as 3 tiles |

**Specs the orchestrator must watch** (minigames are now on for EVERY stage: the 4th ordinary round of a context without `e2eVariant=off` is a puzzle on E3/E4, otherwise a Hasło):
- already have `e2eVariant=off`: `adaptive`, `room-purchase`, `parent-settings` (#14), `save-transfer`.
- no seam, at most 1-2 ordinary rounds per context (counter should not reach 3): `task-round`, `first-launch`, `narrator`, `save-restart` (#2/#10 plays 1 round, then reloads; counter is saved), `room-change`, `save-transfer-blocked`, `error-boundary`, other `parent-settings` tests; `?e2eSkills` specs bypass the schedule. If one goes red with a word round on screen (letters row, 3 tiles, "Ukryte słowo" title), add `e2eVariant=off` there.
- Hasło's `screen` in the hook is still `'summary'` at the end (the done card is the summary's variant); its buttons are `targets.doneNext`/`doneRoom`, `targets.nextRound` is null.

## 4. Next command

`/10x-implement minigame-daily-puzzle phase 9` (Phase 9: Zakrywanka na ekranie).

## 5. Open

- 8.3 e2e (orchestrator), 8.4 [visual: `?e2eVariant=word` — start, first letter, hint after a miss, second try, solution steps, done card, KANAPA and PÓŁKA; 1440x900 and 1024x768], 8.5 [human]; 7.5, 7.6, 6.5, 5.5, 5.6, 4.4, 3.4, 3.5, 3.6, 1.5, 1.6, 2.5 as before.
- Visual-gate risks to look at: the answer tiles are the default 254 x 136 (plan says 312 x 138; `AnswerTiles` takes its geometry from `TASK_LAYOUT.tiles`), the solution lines of a word round are squeezed above the tiles (limit `tiles.top`), a sentence prompt of 3 lines may touch the tiles.
- `pl.minigames.wordHint` is defined and unused (no hint line drawn).
- DESIGN-GAP 85 is named in code comments (layout, `MinigameDoneCard`); the row in `docs/design-gaps.md` is due in phase 10 with 79-84.

## 6. Autonomous decisions

1. Letters reveal per finished task (outcome set), including a task settled by solution + retype: the word always completes. Would change: the author wants only correct answers to reveal.
2. Word round layout: no "Oblicz:" line (kit shows the equation alone), letters at y 232-370, expression centred on 540, sentence prompts from 420. Would change: the visual gate shows overlaps -> `MINIGAME_LAYOUT`.
3. Kept the default answer tiles (254 x 136) instead of 312 x 138: a second tile size is a change of `AnswerTiles`/`tileRow` for 58 px. Would change: the visual gate asks for the kit size.
4. `freshRound` falls back to an ordinary round when `buildWordRound` returns null; `wordAvailable` is a cheap pre-check, so the schedule rarely picks `word` in vain.
5. Done card sizes: card 1040 x 540 (kit min-height 510 raised by 30 for the star line), buttons 400 x 108.
6. Mixed phase: none (impl).
