# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the visual-gate step: `VISUAL: PASS` (reviews/visual-review.md), five visual discrepancies fixed in `b04a5ca`, every [visual] row ticked; `change.md` stays `impl_reviewed`. Next is archive then ship; the save format v2 is a one-way door, so the [human] row 1.6 must be accepted before the merge.

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | docs + phases 1-13 + handoffs, review fix `06ba5cf`, impl-review docs `ac3ad5c`, visual fix `b04a5ca`, this docs commit (`docs(minigame-daily-puzzle): bramka wizualna`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 5 (`grep -c '^- \[ \]' plan.md`), all [human]: 1.6, 5.6, 8.5, 9.5, 10.6 |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/minigame-daily-puzzle/reviews/visual-review.md` | visual review: V1–V5 with fixes, states vs kit, hand-checks, O1–O4, verdict line |
| `context/changes/minigame-daily-puzzle/screenshots/` | 78 PNG (39 states × 1440×900 / 1024×768) + `README.md` (routes, values, not captured) |
| `context/changes/minigame-daily-puzzle/plan.md` | [visual] rows 3.6, 7.6, 8.4, 9.4 ticked |
| `context/changes/minigame-daily-puzzle/follow-ups/review-fixes.md` | visual-gate follow-ups O1–O4 with `Trigger:` |
| `src/core/round/view.ts` (`barOf`), `src/ui/widgets/FeedbackBar.ts` (`textOf`), `src/data/pl.ts` (`round.correctStar`) | V1: "Brawo! +N ★" with the stars the task paid (fix `b04a5ca`) |
| `src/data/layout.ts` (`HUD_LAYOUT.title`, `MINIGAME_LAYOUT.buttons`, `MINIGAME_LAYOUT.board`), `src/ui/widgets/HudTitle.ts` (`set`), `src/scenes/TaskScene.ts` (`render` dots) | V2 centred variant title, dots hidden in a variant; V3 centred done-card buttons; V5 board 16 px higher |
| `src/scenes/TaskScene.ts` (`drawPrompt`, `fitPromptToSteps`, `render` solution limit), `src/ui/widgets/SolutionSteps.ts` (`fits`) | V4: long sentence prompts fitted above the bar/tiles and again for the solution lines |
| `tests/roundView.test.ts`, `tests/wordScreen.test.ts`, `tests/dice.test.ts` | 4 new tests (V1, V2, V3, V5), each red before the fix |
| `docs/design-gaps.md` row 79 | title placement and "+N ★" recorded |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK (after the throwaway spec left the repo) |
| `npm test` + deploy/ops tests + `sample` E1-E6 | 2326 passed = branch 2322 + 4 (baseline main 2224 + 102); deploy/ops OK; `Naruszenia: 0` ×6 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=<abs> --workers=4` | 71 passed (branch 71, +0; baseline 63 + 8), 5.2 min; ports 4397/4398/4399 free afterwards |
| Red before green | V1 `expected { kind: 'correct', star: true } to deeply equal { …, stars: 2 }`; V2 `expected undefined to be 960`; V3 `expected 1030 to be 960`; V5 `expected 867 to be less than or equal to 852`; all green after `b04a5ca`. Meta: each test asserts the property the frame showed broken, not the new constant |
| V4 (no unit test, Phaser text metrics) | proven by frames p09–p11 (the three longest puzzles: start, all steps, retype) re-captured after the fix; follow-up O4 |
| Visual capture | Playwright throwaway spec (gitignored, moved out to the session scratchpad before the gate) against the hook build on 4399; `migration-failed` on a throwaway build with a throwing `MIGRATIONS[1]`, `src/core/save.ts` restored (no diff) |

## 4. Next command

`/10x-archive minigame-daily-puzzle` then ship

## 5. Open

- Human checklist: 1.6 (save v2 one-way door, accept before the merge), 5.6 (author reads the 15 puzzles), 8.5 (Hasło rule and words), 9.5 (finger taps on the board fields, 85 × 72 CSS px on the 1024 tablet), 10.6 (decisions against PRD/ZADANIA/kit; also F1: E5-E6 get the E3-E4 puzzle pool via `puzzlePool` in `src/core/puzzles.ts`; and the visual-gate choice to hide progress dots in a variant, `TaskScene.render`).
- Follow-ups: `follow-ups/review-fixes.md` (earlier items + visual-gate O1 unit wrap, O2 en dash in `pl.minigames.diceTitle`, O3 summary of doubled stars, O4 no unit test for `fitPromptToSteps`).
- Design gaps 79-87 in `docs/design-gaps.md` (row 79 updated for the centred title).
- Not captured: PÓŁKA in the final frames (seen in an intermediate capture only).

## 6. Autonomous decisions

1. Playwright instead of Claude in Chrome. Rejected: Chrome (canvas taps and the 2 s gear hold cannot be synthesised, profile § 8). Would change: a Chrome tool that drives touch on the canvas.
2. V2 fixed by centring the title and hiding the progress dots in a variant, not by moving the title right. Rejected: shifting the title (13 dots span most of the HUD; no room). Why: the kit minigame screens have a centred title and no dots; the letters and the board show progress. Would change: the author wanting dots in minigames (then a smaller dot gap for >5 tasks).
3. V4 fixed generally (any plain sentence prompt beside the keypad or above tiles is fitted; solution lines of every tiles task stop above the tiles), not only for puzzles. Rejected: shortening puzzle texts (content change needing the author's read). Why: the same overlap would hit any long word problem. Would change: a regression in an ordinary round's layout.
4. `migration-failed` card captured on a throwaway build with a throwing migration. Rejected: leaving it NOT-CAPTURED (the row asks for it) or adding a seam (scope). Would change: a new e2e seam for a failing migration (follow-up trigger v3).
5. V5 board moved up 16 px instead of shrinking the fields. Why: the 160×136 field size is the [human] 9.5 subject. Would change: the author's finger test.
