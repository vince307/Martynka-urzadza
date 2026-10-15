# Handoff — `text-measure-time-types` (slice S-14c)

Written by the visual gate of run `2026-10-15-fix-s14c-s14d`. Verdict `VISUAL: PASS`: every `[visual]` row is captured at 1440×900 and 1024×768, and three discrepancies are fixed in `da12957`. The slice is ready to archive. The next agent must not get wrong: the only open Progress rows are `[human]` 4.8 and 9.6, which stay open through archive and ship.

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | plan commits, p1 `9507da3` ... p11 `093b129`, review fix `6d20b08`, review docs `70cc262`, visual fix `da12957`, then this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` (unchanged; archive sets its own) |
| `## Progress` rows remaining | 2 (`grep -c '^- \[ \]' plan.md`): `[human]` 4.8 and 9.6 only |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/text-measure-time-types/reviews/visual-review.md` | visual review: V1-V3 with fixes, verdict per plan row, hand checks, legibility; ends with the `VISUAL:` line |
| `context/changes/text-measure-time-types/screenshots/` | 176 PNG frames (`desktop-*`, `tablet-*`) and `README.md` (state, frames, how reached, values) |
| `src/core/round/promptBlank.ts` | `blankAsText` (a blank inside a text line reads "?") and `fitPieces` (an expression shrinks to its room) |
| `src/core/round/keypad.ts` | `keypadDisplay` (the typed number grouped like `formatNumber`) |
| `src/ui/widgets/FeedbackBar.ts`, `src/ui/widgets/SolutionSteps.ts` | hint, retype and solution lines go through `blankAsText` |
| `src/ui/widgets/Keypad.ts` | `paintField` shows `keypadDisplay` and shrinks a long number to the field |
| `src/scenes/TaskScene.ts` | `drawExpression` lays out through `fitPieces` with `maxWidth` |
| `src/data/layout.ts` | `TASK_LAYOUT.expression.maxWidth` 760, `expressionWide.maxWidth` 1300, `keypad.fieldPadding` 24 |
| `tests/promptBlank.test.ts`, `tests/keypad.test.ts` | 3 new tests: blank as text, expression fit, keypad grouping |
| `docs/design-gaps.md` | row 99: blank inside a hint or solution line written as "?" |
| `context/changes/text-measure-time-types/plan.md` | `[visual]` rows 2.7, 3.6, 4.7, 5.6, 6.6, 7.6, 8.7 ticked |
| `context/changes/text-measure-time-types/follow-ups/review-fixes.md` | section "From the visual gate": 3 follow-ups, each with `Trigger:` |

## 3. Verification

All observed in this step. The baseline is main `e2f7caa`: unit 2479, e2e 82.

| command | result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK (after the fix, visual spec moved out of the repo) |
| `npm test` | 2672 passed (139 files) = 2479 + 193 (branch before this step 2669, +3) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1` ... `E6` | `Naruszenia: 0` × 6 (no content changed) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=… --workers=4` | 86 passed (5.8 min) = 82 + 4 (branch +0) |
| new tests before the code | red: `blankAsText`, `keypadDisplay`, `fitPieces` not exported |
| break: `fitPieces` scale fixed at 1 | `tests/promptBlank.test.ts` "shrinks an expression …" red (`expected 1 to be close to 0.5`); restored |
| break: `keypadDisplay` returns the bare buffer | `tests/keypad.test.ts` `keypadDisplay` red; restored. Meta-check: the tests prove the pure functions; that the widgets call them is proved by the re-captured frames `i04-*`, `v04-*`, `v02b/c-*` |
| visual capture | Playwright on the hook build, port 4399: 26 tests (13 states × 2 widths) green, then `V1` re-captured twice after the expression fit |
| servers 4397/4398/4399 | no listener at the end (`lsof -sTCP:LISTEN`) |

## 4. Next command

`/10x-archive text-measure-time-types` then ship

## 5. Open

- `[human]` 4.8: the tablet voice reads `spokenTime` "8 15" as a time. Also listen for "okienko plus jeden mniejsze niż pięć" (`pl.speech.less`), unit symbols such as "560 g", and the hint "czyli do 24.00" (follow-up from this gate).
- `[human]` 9.6: the decisions that differ from ZADANIA/PRD (plan row 9.6).
- DESIGN-GAP row 99 (`docs/design-gaps.md`): a blank in a hint or solution line reads "?". It is our choice, and the kit may replace it.
- Follow-ups in `follow-ups/review-fixes.md`, section "From the visual gate": spoken "24.00" in the E5.8 hint, the three-line hint bar at the 12-px floor (`FeedbackBar.update`), and no minimum scale in `fitPieces`. The earlier sections are unchanged.
- At archive time: the roadmap still shows S-14c as `planning`.

## 6. Autonomous decisions

1. **I captured with Playwright and not Claude in Chrome.** Every state past a first try needs canvas taps, so I followed the precedent of S-13 to S-14b (profile § 8). What would change this: Chrome driving Phaser touch.
2. **I wrote the blank in text lines as "?" (gap 99).** I rejected drawing boxes inside the wrapped hint and solution text, which is a larger widget change for one hint line. I also rejected the word "okienko" in the equation, which reads worse. "?" is how E2.7 already marks a missing term. What would change this: a kit frame for hints with a box, or a teacher read preferring another mark.
3. **I set the expression room beside the keypad to 760 px, not 800.** At 800 the shrunk E6.9 row ended 20 px from the keypad. 760 keeps 40 px clear and changes no expression that fit before. What would change this: a kit `.equation` width.
4. **I grouped the keypad field (V2) although the plan row only asked that six digits fit.** The project rule is grouping from 10 000, and the solution lines the child copies are grouped. What would change this: a teacher read wanting raw digits while typing.
5. **I added states beyond the plan rows** (tare solution, E5.12 solution, a long E6.9 decomposition) because the step prompt names long prompts and the solution beside the keypad as the risk. V3 was found only through the added E6.9 state. What would change this: nothing; extra frames do not affect ticking.
