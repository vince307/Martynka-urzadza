# Handoff — `drawn-grid-tasks-e3-e4` (slice S-13b)

The visual gate captured every new view (29 states, 1440×900 and 1024×768), fixed three discrepancies in `7aa3485` and ended `reviews/visual-review.md` with `VISUAL: PASS`. Next is archive, then ship. Only the `[human]` rows 8.7 and 10.6 stay open; they never block shipping.

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-grid-tasks-e3-e4`, cut from `main` at `9554e96` |
| Commits | `7aa3485` (visual-gate fix) on `e48c9cb` (impl-review docs) … `1c01e0c`, plus this docs commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` (unchanged; `/10x-archive` stamps it) |
| Progress rows remaining | 2 (`grep -c '^- \[ \]' plan.md`): `[human]` 8.7 and 10.6 |
| Working tree | clean after the docs commit; the throwaway spec was moved to the session scratchpad |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/generators/perimeter.ts` | `triangleShape`: the triangle is drawn to scale, with the longest side as the base and a flat apex raised to 0.25 of the base (V1) |
| `src/data/pl.ts` | shorter `puzzleMagicHint` and `perimeterSideRectHint` (V2). `clockSetAnswerHint` now reads "Wtedy zegar pokaże …" (V3). |
| `tests/perimeter.test.ts` | the triangle drawing keeps the order of the labels |
| `tests/contentInvariants.test.ts` | `KEYPAD_HINT_MAX = 64` for the first hint of every keypad skill, with `LONG_KEYPAD_HINTS` listing `E5.5.capacity_quarter_l` |
| `tests/clock.test.ts` | set skills: no hint line says "Zegar pokazuje" |
| `context/changes/drawn-grid-tasks-e3-e4/screenshots/` | 70 PNG frames (`desktop-*`, `tablet-*`) and `README.md` (state, frames, how each was reached, values) |
| `context/changes/drawn-grid-tasks-e3-e4/reviews/visual-review.md` | the gate report: V1–V3 fixed, states against the kit, hand-checks, O1–O6, ends `VISUAL: PASS` |
| `context/changes/drawn-grid-tasks-e3-e4/plan.md` | `[visual]` rows 5.7, 6.7, 8.6, 9.6 ticked |
| `context/changes/drawn-grid-tasks-e3-e4/follow-ups/review-fixes.md` | new section "From the visual gate", O1–O6, each with a `Trigger:` line |
| `context/changes/drawn-grid-tasks-e3-e4/handoff.md` | this file |

## 3. Verification

| command | result (observed in this step, on `7aa3485`) |
|---|---|
| lint / typecheck | OK / OK |
| `npm test` | 2224 passed = contract baseline 1927 + 297. The branch before this step had 2223, so +1: the new triangle test. The other new checks are assertions inside existing tests. |
| deploy + ops tests, `sample` E1–E6 | OK, OK, `Naruszenia: 0` for every stage |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=<abs>` | 63 passed (baseline 57, +6) in 4.1 min; ports 4397, 4398 and 4399 free afterwards |
| Visual capture | throwaway Playwright spec against the hook build on 4399; 24/24 capture tests passed on the fixed tree |
| RED → GREEN | V1: the triangle order test was red on the old fixed shape (`side 1 (7 cm) vs 2 (2 cm): expected 5 to be greater than 5`). V2: the content invariant was red for `E3.5.magic_square_30` (102) and `E5.12.perimeter_side_rect` (76). V3: four set-clock tests were red on "Zegar pokazuje". All went green after the fix. |
| Meta-check | The V2 invariant measures characters, not pixels. 64 characters is the longest first hint seen to wrap into 2 lines of the 662 px bar; the frames `tablet-02` and `tablet-20h` show the pixel result (3 lines, 12.8 CSS px). The V1 test compares the drawn edge lengths with the labels, so it does not depend on how the generator builds the shape. |
| Teacher read | `sample` E3 / E4 / E5 `--count 6` for E3.5, E4.3, E4.7 and E5.12 after the fixes; recorded in `visual-review.md` |

## 4. Next command

`/10x-archive drawn-grid-tasks-e3-e4` then ship

## 5. Open

- `[human]` 8.7: test the gesture on a tablet (5-minute snap, grabbing a hand with a child's finger). This also covers O2: a ring hides the numeral under the tip.
- `[human]` 10.6: the author reads the decisions made against ZADANIA. Add three new wording points:
  - "Wiersze, kolumny i przekątne mają równe sumy. Dodaj pełną linię."
  - "Obwód to dwa razy suma dwóch sąsiednich boków."
  - "Wtedy zegar pokaże …"
- Follow-ups are in `follow-ups/review-fixes.md` under "From the visual gate":
  - O1: grid size, in `CoordGrid`
  - O2: rings, in `ClockSet`
  - O3: the dial shows the start pose during the solution
  - O4: the fill of the composite figure, in `FigureGrid`
  - O5: `E5.5.capacity_quarter_l` hint length, `Trigger: S-14b`
  - O6: the magic square in the 190 px solution strip
- The impl-review follow-ups F4, F5, O2 and O4 are unchanged.
- No new DESIGN-GAP rows. Rows 73–78 cover every state that has no kit frame.

## 6. Autonomous decisions

1. **Playwright only, not Claude in Chrome.**
   - Rejected: Chrome first.
   - Why: every state needs taps, wrong answers or a held drag on the Phaser canvas, and Chrome cannot synthesise these (profile § 8). The S-13 and S-14 gates used the same route.
   - What would change it: a state that is reachable without input, such as a static page.
2. **V2 fixed by shortening the content, not by changing `FeedbackBar`.**
   - Rejected: a taller bar, or a minimum scale with clipping. Both are shared widgets, and the change would alter every task's layout.
   - Why: the kit `hint-keypad.png` keeps the bar at two lines. Only two new strings broke that.
   - What would change it: several more long keypad hints. Then a layout change, such as a wrapping bar, beats editing content.
3. **V3 fixed in the text ("Wtedy zegar pokaże …"), not by drawing the target pose at the last solution step.**
   - Rejected: changing `ClockSet.render` in the solution phase. That is a new behaviour with no kit frame.
   - Why: the text change removes the contradiction with no UI change. The pose idea is follow-up O3.
   - What would change it: the author wants the dial to demonstrate the answer.
4. **V1: the triangle is drawn to scale, with a raised apex for flat triangles.**
   - Rejected: keeping the stylised shape and only ordering the labels. A stylised shape cannot match all three ratios.
   - Rejected: an exact scale with no floor. Some flat triangles, such as 20/18/3, would leave the labels overlapping.
   - Why: the drawing must never contradict the labels. The floor keeps the order of the sides (proven by the test).
   - What would change it: the author prefers non-scaled sketches, as many textbooks use. Then revert, with labels sorted to fit.
5. **`E5.5.capacity_quarter_l` is an exception to the new invariant, not fixed here.**
   - Rejected: shortening an S-14 string in this slice.
   - Why: it is outside S-13b scope and needs its own teacher read. The exception set is named, and the item is follow-up O5.
   - What would change it: the orchestrator wants it fixed before ship. It is a one-line content change.
