# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the visual-gate step of run 2026-10-16-audit-sweep. All five `[visual]` rows are captured at 1440×900 and 1024×768 and ticked, with `VISUAL: PASS`. No source changed in this step. The save format stays v4 and the frozen fixtures are untouched; the next agent must not change what is saved.

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | docs + p1-p14 + handoffs, then review fix `03a597e`, then `76daf9a` `docs(child-flow-guards): impl review`, then `docs(child-flow-guards): bramka wizualna` (this step) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` (unchanged; `/10x-archive` sets the next status) |
| `## Progress` rows remaining | 6 (`grep -c '^- \[ \]' plan.md`): `[human]` 2.7, 5.7, 6.7, 9.5, 14.4; `[reviewer] (CI at ship)` 13.7 |
| Working tree | clean after the commit (the throwaway spec was moved out of the repo) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/child-flow-guards/reviews/visual-review.md` | visual review: verdict per row, hand-checked numbers, decisions; ends with `VISUAL: PASS — …` |
| `context/changes/child-flow-guards/screenshots/README.md` | table of states, frames and how each was reached |
| `context/changes/child-flow-guards/screenshots/*.jpg` | 30 frames (`desktop-*` 1440×900, `tablet-*` 1024×768): wallet line, COMPARE_QTY, HALF hint, progress E1 and E6.11, pyramid steps 0-2 + retype, perimeter steps 0-1 + retype |
| `context/changes/child-flow-guards/plan.md` | `[visual]` rows 2.6, 3.6, 5.6, 6.6, 10.5 ticked |
| `context/changes/child-flow-guards/follow-ups/review-fixes.md` | new section "From the visual gate": VG-1 (pyramid overflow) and VG-2 (zł wrap). F3 and F7 now carry what the frames show, with new triggers; 20 triggers in total |
| `context/changes/child-flow-guards/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `E2E_HOOK=1 npm run build -- --outDir dist-e2e` | `e2e hook: present (2 chunks checked)` (the hook build, as intended) |
| throwaway Playwright spec, 5 scenarios × 2 projects, against `npm run preview -- --outDir dist-e2e --port 4399 --strictPort` | `10 passed (1.3m)`, then the pyramid and perimeter re-run with per-step frames: `4 passed` |
| hook `solutionOverflow` | perimeter composite: false at every step, both widths. Pyramid with the base cell empty: false at steps 0-1, **true at step 2**, both widths (VG-1) |
| hand checks | wallet 2+2+2+2+1 = 9 = 5+2+2 (5 coins > 3) and 1+1+1 = 3 = 2+1; perimeter 4+1+1+2+3+3 = 14 and 7+5+5+4+1+4+1+5 = 32; pyramid 6+1 = 7, 7+3 = 10, ? = 3−1 = 2; 30 : 3 = 10; half of 24 = 12, not in the first hint |
| local gate (lint, typecheck, unit, build, e2e) | **not re-run**: no source file changed. Last observed green by the impl-review step on `03a597e`: unit 3416 = 3139 + 277, e2e 127 = 125 + 2 (inherited, unverified here) |
| port 4399 after the step | no listener (`lsof -ti tcp:4399 -sTCP:LISTEN` empty) |

There were no deliberate breaks in this step (no test or source was added).

## 4. Next command

`/10x-archive child-flow-guards then ship`

## 5. Open

**Human checklist (manual-only Progress rows):**
- 2.7: accept the 90/10 share on E6.11 (easing 70/30).
- 5.7: accept the wallet line wording "Kwota się zgadza. Spróbuj zapłacić mniejszą liczbą monet." (gap 124; frames `*-wallet-line.jpg`).
- 6.7: accept the fixed COMPARE_QTY order "Po lewej · Tyle samo · Po prawej" (gap 125; frames `*-compare-qty.jpg`).
- 9.5: on a tablet, "OK" does nothing while a coin, block or clock hand is held.
- 14.4: answer the daily puzzle, close before "Dalej", reopen; there is no second ×2 that day.

**Ship row:**
- 13.7 `[reviewer] (CI at ship)`: workflow `CI`, job `check`. The `npm test` step must print `Tests +[0-9]+ passed` and the `npm run build` step must print `e2e hook: absent ([0-9]+ chunks checked)`.

**Follow-ups** (in `follow-ups/review-fixes.md`):
- **VG-1:** in `SolutionSteps.show`, the E3.5 `pyramid_30` with an empty base cell overflows at `minScale` on its third line. The lines are still on screen, but the text is about 10 px tall at 1024. Trigger: a change to `puzzleGrid.ts` hint lines or `TASK_LAYOUT.keypadSolution`, or the console warning for that skill.
- **VG-2:** wallet examples in `progressView.ts` can wrap between the number and "zł".
- **F2-F7** are unchanged. F3 (cell floor under a long prompt) holds in the frames: pyramid about 63 game px, 7×5 lattice 36.7 game px. F7 (the "began" rule) also has a visual note.
- The 12 entries from phase 13 are unchanged.

**DESIGN-GAP rows:** 122-125 are unchanged. No new gap: everything shown is covered by them.

## 6. Autonomous decisions

- **Playwright fallback, not Claude in Chrome.** Every state needs canvas touches (wallet drags, the 2 s gear hold, whole rounds), and the previous gate took the same route. Would change: a Chrome tool that drives canvas touches.
- **E6.11 reached through the parent import plus play.** I imported the save file of `tests/e2e/review-round.spec.ts` through the parent's "Wczytaj z pliku", widened to every E6 skill at mastery 5, then unlocked E6.11 with one round of play. The rejected options were mastering E6 by play (out of reach) and writing IndexedDB (forbidden). Would change: an `e2eStep` URL seam.
- **Every review task missed once, rather than only the E5 ones.** The hook snapshot has no skill id, so E5 tasks cannot be picked out. Would change: a `skillId` in the hook snapshot.
- **VG-1 deferred, not fixed.** Row 10.5's criterion (cells readable, lines inside the screen) is met. A fix is either PUZZLE_GRID hint content (needs a teacher read) or the keypad-solution layout of every drawn skill, both outside this fix slice. The new WNA-04 signal reports it as designed. Would change: a reviewer judging 10 px text at 1024 unreadable, which would make it a fix before ship.
- **Verdict PASS rather than GAPS.** Every row was captured and matches its copy and gap row. The findings are follow-ups, not missing kit UI. Would change: VG-1 judged a row-10.5 failure.
