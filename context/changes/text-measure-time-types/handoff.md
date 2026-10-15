# Handoff — `text-measure-time-types` (slice S-14c)

Written by `/10x-tdd` phase 7 of run `2026-10-15-fix-s14c-s14d`. Phase 7 is done and committed (PLACE_VALUE variants `thousands` and `orders`; E6.9 and E6.10 got a skill each). The next agent must not get wrong: the 999 cap in `parsePlaceValueParams` now applies only to the block variants (`read`, `tens`, `build`); `thousands` takes `max` 1000-10000, `orders` 110000-1000000 and both ignore `min`; E6.9 and E6.10 now have 3 skills each (threshold 1 -> 2); `vite/e2eHookGuard.mjs` stays unchanged.

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | plan commits, p1 `9507da3`, p2 `ab3d603`, p3 `1b18c9e`, p4 `1ced210`, p5 `43b12f4`, p6 `4319de4`, p7 `379721f` + this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; status changes are the orchestrator's) |
| `## Progress` rows remaining | 7.5 `[reviewer]`, 7.6 `[visual]`; 6.5, 6.6, 5.5, 5.6, 4.6, 4.7, 4.8 as before; 1.5, 2.6, 2.7, 3.5, 3.6 as before; phases 8-11 pending |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/generators/placeValue.ts` | `thousands` (digit at a place, gap in a decomposition, composed from "3 tysiące, 5 setek, ..."; numbers 1000-9999 with 2+ non-zero digits) and `orders` (70 % composed "3 setki tysięcy i 40 tysięcy", 15 % "Ile tysięcy to 250 000?", 15 % "Ile setek tysięcy ma 700 000?"); `speak` without the grouping space |
| `src/data/pl.ts`, `src/data/nouns.ts` | `pl.tasks.placeValue{Places,DigitPrompt,Compose*,Orders*}`, noun `tysiąc` |
| `src/data/curriculum/E6.ts` | `E6.9.place_value_10000`, `E6.10.place_value_1000000` |
| `tests/placeValue.test.ts` | new describe "thousands and orders" (7 tests) |
| `plan.md` | rows 7.1-7.4 ticked |

## 3. Verification

| command | result |
|---|---|
| RED (stub parser, empty-task stub generator) | `AssertionError: unknown prompt shape ""`; `expected '' to match /(^|\s)1 tysiąc[ ,]/m`; `expected 0 to be greater than 100`; `expected undefined to deeply equal { variant: 'thousands', max: 10000 }`; 5 tests red |
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2656 passed = baseline 2641 + 15 (7 new tests plus the per-skill suites over the two new skills) |
| `sample` E1-E6, deploy and ops scripts | `Naruszenia: 0` each / OK / OK |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `tests/fixtures/` untouched |
| e2e `--workers=4` (plain command, ran in this session) | 82 passed (5.5 min) = baseline 82 + 0 |
| Deliberate breaks | block cap `max > 999` removed -> 2 red (`rejects max above 999`, the per-variant limit test); `speak` dropped -> `numbers from 10 000 are grouped ... spoken without it` red; orders answer x10 -> 3 red (orders oracle, grouping, keypad digits). Restored, green. Meta-check: the oracle parses the prompt and never reads `task.answer` |
| Teacher read E6.9, E6.10 `--count 6` | "9 tysięcy, 9 setek, 1 dziesiątka i 8 jedności to jaka liczba?" 9918; "9440 = 9000 + □ + 40" 400 (hint "9440 − 9000 − 40 = 400"); "Jaka cyfra jest na miejscu dziesiątek w liczbie 8066?"; "Ile tysięcy to 201 000?" 201; "3 setki tysięcy i 70 tysięcy to jaka liczba?" 370 000; "Ile setek tysięcy ma 900 000?" 9; grouping from 10 000 with a space, agreement (1 dziesiątka, 2 setki, 5 setek, 70 tysięcy) correct; first hints carry no digit; the narrator reads "201000" |

## 4. Next command

`/10x-tdd text-measure-time-types phase 8` (phase 8, `Driver: tdd`)

## 5. Open

- `[reviewer]` 7.5 (done informally above), `[visual]` 7.6 screenshots (E6.9 gap in the decomposition, E6.10 prompt with 250 000 and a six-digit answer typed on the keypad, solution step; 1440x900 and 1024x768); 6.5, 6.6, 5.5, 5.6, 4.6, 4.7, 1.5, 2.6, 2.7, 3.5, 3.6 as before; `[human]` 4.8, 9.6.
- Unlock thresholds now (PR body): E6.9 n 2 -> 3 (1 -> 2), E6.10 n 2 -> 3 (1 -> 2).
- Phase 11 can rely on `E6.10.place_value_1000000` (via `?e2eSkills`): about 70 % of its tasks have an answer of 100 000 or more (the unit test pins at least 50 % over 1000 draws); the six-digit answers are the composed ones ("A setki tysięcy i B tysięcy").
- Digit-at-a-place tasks always ask about a non-zero digit.

## 6. Autonomous decisions

1. **Parser limits:** `thousands` max 1000-10000, `orders` max 110000-1000000 (the smallest composed sum is 110 000); `min` is ignored for both. Rejected: keeping `min` required (nothing to configure). Would change: a skill that needs a lower bound.
2. **Compose with zeros:** zero orders are left out of the sentence ("3 tysiące i 7 jedności"), numbers need at least two non-zero digits so no sentence has a single part.
3. **`orders` mix:** 70 % composed (six digits), the rest split evenly; chosen over a fixed 50 % so the 50 % pin has margin. Composed hundreds of thousands 1-9 and tens of thousands (40, 70 ...) 10-90.
4. **`speak`** is set only when the prompt carries a grouped number (plain digits); the narrator already strips the grouping space from hints.
5. **Mixed phase:** none; whole phase TDD (stub parser and empty-task generator first), data last. Test-only edits outside the new tests: none.
