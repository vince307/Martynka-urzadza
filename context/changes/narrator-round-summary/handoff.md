# Handoff — `narrator-round-summary` (slice S-05)

The `/10x-tdd` phase 1 step of autonomous run 2026-10-12-s04-s08 wrote this file. Phase 1 (spoken text in generators) is committed in `d361c99`. The next agent must not get this wrong: the `speak` texts still contain raw operation symbols and `□`; phase 2 turns them into words ("okienko", "plus", ...) and adds the no-leak invariant over E1–E6.

## 1. State

| | |
|---|---|
| Branch | `feat/narrator-round-summary`, cut from `main` at `8467431` |
| Commits on branch | 5 docs commits + `d361c99` (phase 1) + this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged; implementation continues) |
| `## Progress` rows remaining | 51 (`grep -c '^- \[ \]' plan.md`); rows 1.1–1.4 ticked, 1.5 `[reviewer]` open |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/pl.ts` | `pl.tasks.romanLetters`, `romanSpeakContexts`, `romanMonthSpeak`, `compareSpeak`, `compareExprSpeak`, `missingOpSpeak` |
| `src/core/text/roman.ts` | `spellRoman(text, letters)` |
| `src/core/tasks/generators/{compareNum,compareExpr,missingOp,roman,calendar}.ts` | set `Task.speak` (ROMAN only for the reading direction; `toRoman` direction has none) |
| `scripts/sample.ts` | prints a `mowa:` line under a task that has `speak` |
| `tests/taskSpeech.test.ts`, `tests/taskSpeechHelpers.ts` | one new file over the real skills of all stages (instead of five edited files): question + whole expression, question text without sign glyphs, ROMAN/CALENDAR without numeral token, digits, number words or month name, `spellRoman` |
| `context/changes/narrator-round-summary/plan.md` | rows 1.1–1.4 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub state: src changes stashed) | `tests/taskSpeech.test.ts` 12 of 15 failed; first: `E1.2.compare_num_5 seed=1 draw=0 prompt="2 □ 1": expected undefined to be defined` |
| GREEN | 15/15 after a test fix (substring `trzy` matched inside "zatrzymała"; now whole-word match) |
| Deliberate break | ROMAN `speak` = `prompt` text and COMPARE_NUM large-branch `speak` removed: 4 red (`E6.10.compare_num_1000000`, `E3.11.roman_12`, `E5.2.roman_12`, `E6.10.roman_2000`); restored, green. Meta-check: the cases come from generators on real stage data, so the break is what turns them red |
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` | 611 passed (baseline 596, +15) |
| deploy and ops scripts | OK, OK |
| `npm run sample -- E1` … `E6` | each exit 0, `Naruszenia: 0`, `mowa:` lines present |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` | 4 passed (baseline 4, +0) |

## 4. Next command

/10x-tdd narrator-round-summary phase 2

## 5. Open

Teacher read (author's pass, row 1.5 stays for the `[reviewer]`): questions read naturally ("Jaki znak pasuje w okienku? 3 □ 5", "Porównaj wyniki. ...", "Jakiego znaku działania brakuje w okienku? 8 □ 2 = 10"); Roman letters are spelled "fau, i, i", "iks, el, i, iks"; the answer is never in the question. Observations: a single letter reads "zapis rzymski i" (the conjunction "i"), acceptable; E6 long numerals (8 letters) are a long list. `reviews/teacher-read.md` is not written (reviewer's file).

Manual-only Progress rows (checklist for the maintainer):
- [ ] 10.5 `[human]` auto-read only as a session default by stage (FR-009)
- [ ] 10.6 `[human]` „Do pokoju” not highlighted until S-09 (FR-010)
- [ ] 10.7 `[human]` the room returns to the screen the child left (kit `preview.js` `roomReturn`), against `change.md` decision 3
- [ ] 10.8 `[human]` the first task after a cold start is never read aloud automatically
- [ ] 10.9 `[human]` iPad and Android listening check (PRD OQ 7)

Review rows: `[reviewer]` 1.5, 2.5, 6.5, 7.4, 10.4; `[visual]` 5.4, 6.6, 7.5, 9.4.
Known risks F8, F9 in `plan.md` `## Known risks` unchanged. Deferred follow-ups: `pl.title` (S-06), solution-step dots (next `SolutionSteps` change).

## 6. Autonomous decisions

1. **Mixed-phase / test layout.** One new test file `tests/taskSpeech.test.ts` over the real curriculum skills instead of edits to five files.
   - Why: one place for the shared no-leak definition; the plan said "testy w pięciu plikach" only as a location.
   - Would change: the reviewer wants per-generator files.
2. **ROMAN context pick.** The generator now draws the context index with `rng.int` (same draw count as `rng.pick`) so the spoken context matches the written one.
3. **Phrasing.** Roman reading uses "zapis rzymski ${letters}" for the number question so one letter does not need a plural.
   - Would change: the teacher read prefers "cyfry rzymskie".
4. **Gate prompts.** Commit message and between-phase prompts decided in place; stopped after phase 1.
