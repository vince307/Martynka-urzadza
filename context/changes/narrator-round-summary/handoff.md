# Handoff — `narrator-round-summary` (slice S-05)

The `/10x-tdd` phase 2 step of autonomous run 2026-10-12-s04-s08 wrote this file. Phase 2 (spoken text for the round) is committed in `2d43a08`; `spokenText`, `spokenTask` and `narrationOf` exist and nothing calls them yet. The next agent must not get this wrong: phase 3 builds the voice rules and narrator module on top of these; the scene wiring waits for phase 5.

## 1. State

| | |
|---|---|
| Branch | `feat/narrator-round-summary`, cut from `main` at `8467431` |
| Commits on branch | 5 docs commits + `d361c99` (p1) + handoff p1 + `2d43a08` (p2) + this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged; implementation continues) |
| `## Progress` rows remaining | 47 (`grep -c '^- \[ \]' plan.md`); rows 1.1–1.4 and 2.1–2.4 ticked; 1.5 and 2.5 `[reviewer]` open |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/narration/spoken.ts` | `SpeechWords`, `spokenText(text, words)`, `spokenTask(task, words, calculate)`, `narrationOf(state, {words, calculate, tryAgain, answerLine})` |
| `src/data/pl.ts` | new `pl.speech` (plus, minus, razy, podzielić przez, równa się, okienko, mniejsze niż, większe niż) |
| `scripts/sample.ts` | prints a `czyta:` line (`spokenTask`) under every task, replacing the phase 1 `mowa:` line |
| `tests/spoken.test.ts` | 25 tests: hand-written cases, glyph-free invariant, no standalone Roman token, no-leak invariant over all 84 skills of E1–E6 (20 seeds x 10 draws), `narrationOf` per phase |
| `context/changes/narrator-round-summary/plan.md` | rows 2.1–2.4 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub `spokenText` returning the text unchanged, `pl.speech` added) | 22 of 25 failed; first: `expected '38 + 27' to be 'Oblicz. trzydzieści osiem plus dwadzieścia siedem'` |
| GREEN | 25/25 after two test fixes: the no-leak check skips an answer whose form is already on the screen (an operand equal to the result), and compares number words as maximal runs ("siedemdziesiąt siedem" is 77, it does not contain 70) |
| Deliberate break | (a) `□` not replaced: 4 red; (b) colon always division: 2 red ("Uzupełnij ciąg:", fact family line); (c) number regex without NBSP grouping: the "12 345" case red; (d) ROMAN `speak` removed from the generator: "never speaks a standalone Roman numeral token" red on `E3.11.roman_12`. All restored (spoken.ts byte-identical to the backup, roman.ts by `git checkout`). Meta-check: invariants iterate the real `stages` skills, so (d) in a generator turns them red |
| `npm run lint`, `npm run typecheck` | OK (lint caught literal no-break spaces in the new files; now \\u00A0 escapes) |
| `npm test` | 636 passed (baseline on branch 611, +25) |
| deploy and ops scripts | OK, OK |
| `npm run sample -- E1` … `E6` | each exit 0, `Naruszenia: 0`, `czyta:` lines present |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` | 4 passed (baseline 4, +0); first run inside the sandbox failed, the rerun outside it (contract: excludedCommands) passed |

## 4. Next command

/10x-tdd narrator-round-summary phase 3

## 5. Open

Teacher read (author's pass, row 2.5 stays for the `[reviewer]`): E1–E6 `czyta:` lines read naturally: "Oblicz. trzydzieści osiem plus dwadzieścia siedem", "Jaki znak pasuje w okienku? trzy okienko pięć", "Porównaj wyniki. Jaki znak pasuje w okienku? dwa plus jeden okienko siedem minus trzy", "dwanaście podzielić przez trzy równa się okienko", "…równa się dwanaście. Sprawdź. dwanaście podzielić przez trzy równa się okienko". Observations for the reviewer: digits inside sentences stay digits (synthesizer reads them; E6 "701954 okienko 701957" is read by the engine); "równa się" as the plan fixed it ("4 = 1 + □" reads "cztery równa się jeden plus okienko"); a colon after a word is read as a full stop pause ("Sprawdź."); hint lines with Roman numerals ("V = 5; razem 5") are NOT spelled in the `second`/`solution` phases (only the task command is); NUMBER_WORDS "Jak zapisać słowami liczbę 26?" keeps digits, so the synthesizer says the number (known risk F9). `reviews/teacher-read.md` is not written (reviewer's file).

Manual-only Progress rows (checklist for the maintainer):
- [ ] 10.5 `[human]` auto-read only as a session default by stage (FR-009)
- [ ] 10.6 `[human]` „Do pokoju” not highlighted until S-09 (FR-010)
- [ ] 10.7 `[human]` the room returns to the screen the child left (kit `preview.js` `roomReturn`), against `change.md` decision 3
- [ ] 10.8 `[human]` the first task after a cold start is never read aloud automatically
- [ ] 10.9 `[human]` iPad and Android listening check (PRD OQ 7)

Review rows: `[reviewer]` 1.5, 2.5, 6.5, 7.4, 10.4; `[visual]` 5.4, 6.6, 7.5, 9.4.
Known risks F8, F9 in `plan.md` `## Known risks` unchanged. Deferred follow-ups: `pl.title` (S-06), solution-step dots (next `SolutionSteps` change).

## 6. Autonomous decisions

1. **Where the "Oblicz." prefix lives.** `spokenText` stays pure (text to speech); `spokenTask` / `narrationOf` add `pl.round.calculate` + "." when the whole `speak ?? prompt` is a bare calculation (`isExpression`, the same test the task scene uses). The plan listed the prefix under `spokenText`.
   - Why: a hint such as "2 + 1 = 3" is also a bare calculation and must not get "Oblicz." in the `second`/`solution` phases.
   - Would change: the reviewer wants `spokenText` to take `calculate` too.
2. **Expression scope.** Number words only inside a segment that is entirely a calculation (digits, spaces, `+ − · : ( ) □ = < >`); sentences keep digits (NBSP between digits removed). Glyphs are replaced in both. `(` becomes ", ", `)` is dropped, `;` becomes ",".
   - Would change: the teacher read wants sentence numbers in words.
3. **No-leak invariant.** An answer form (digits, number words, text, sign word) already present on the screen exempts the task; number words compare as maximal runs. Array answers are skipped. The invariant runs on `spokenTask` (the command), not on hints.
   - Would change: hints should also be checked (they reveal by design after the first mistake).
4. **Sample line.** `czyta:` replaces `mowa:` for every task (not only those with `speak`).
5. **Gate prompts.** Commit message and between-phase prompts decided in place; stopped after phase 2. Playwright rerun outside the sandbox as the contract's excludedCommands allow.
