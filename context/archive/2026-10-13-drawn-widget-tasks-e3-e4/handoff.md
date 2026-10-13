# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by the visual-gate step: every drawn task type was captured in a real round (Playwright, hook build on 4399), three
discrepancies were fixed in `26a25df`, verdict `VISUAL: PASS`. The next agent must not re-open the [visual] rows; the
five [human] rows stay open for the maintainer and belong in the PR body.

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | docs/plan + p1–p11 (`42a0bee` … `bf87c24`) + handoffs + review fix `1965c28` + review `7ab1e78` + visual fix `26a25df` + this docs commit |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-13-s12-s14/run-log.md |
| `change.md` status | `archived` (ship step, `/10x-archive`; folder moved to `context/archive/2026-10-13-drawn-widget-tasks-e3-e4/`) |
| `## Progress` rows remaining | 5 (`grep -c '^- \[ \]' plan.md`): [human] 4.6, 6.9, 9.8, 10.6, 10.7. [visual] 4.4, 6.8, 7.6, 9.7 ticked in this step |
| Working tree | clean after the commit (the throwaway spec lives in the session scratchpad, not in the repo) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/drawn-widget-tasks-e3-e4/reviews/visual-review.md` | visual review: V1–V3 fixed, states vs kit, hand-checks (dial 4.30, ruler 2–12 cm and 0–41 mm, bars 7/8/3, blocks 109/358), O1–O5, ends `VISUAL: PASS — …` |
| `context/changes/drawn-widget-tasks-e3-e4/screenshots/*.png` + `README.md` | 31 states × desktop 1440×900 + tablet 1024×768 (62 PNG), table state · desktop · tablet · how reached |
| `context/changes/drawn-widget-tasks-e3-e4/plan.md` | [visual] 4.4, 6.8, 7.6, 9.7 ticked with frame refs |
| `context/changes/drawn-widget-tasks-e3-e4/follow-ups/review-fixes.md` | + section "From the visual gate" (O1–O3, lifted mat block), each with `Trigger:` |
| `src/core/round/pictureLayout.ts` | `belowPrompt` (picture rect under a long prompt, bottom kept), `fitSize` (largest font that fits) — `26a25df` |
| `src/scenes/TaskScene.ts` | `drawPrompt`: pictured sentence prompt font 64 → ≥ 44 to end above the picture; `render`: picture rect through `belowPrompt` — `26a25df` |
| `src/data/layout.ts` | `TASK_LAYOUT.picture.promptGap/promptMinSize/promptSizeStep`; `TASK_LAYOUT.drag.trayScale` 1.3 → 1.2 — `26a25df` |
| `src/ui/widgets/Ruler.ts` | `RULER.unitX` 27 → 41 (kit ruler.svg) — `26a25df` |
| `tests/pictureLayout.test.ts` | `belowPrompt`, `fitSize` tests (+5) — `26a25df` |
| `docs/design-gaps.md` | row 52: long prompt shrink + picture moves under it — `26a25df` |

## 3. Verification

| Command | Result (observed in this step, on `26a25df`) |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK |
| `npm test` | 1482 passed (contract baseline 1247 on `b57433c`, +235; branch before this step 1477, +5) |
| deploy + ops tests, `sample` E1–E6 | OK; `Naruszenia: 0` each |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts` | 42 passed (baseline 37, +5) |
| Visual capture (throwaway spec, hook build on 4399) | 34 tests × 2 viewports green (one desktop select retry: the draw had a 2-tile answer set, so "two marked" completed it; re-run drew 4) |
| Deliberate break: `belowPrompt` ignoring the prompt (`top = rect.y`) | RED: "moves the top under a long prompt and keeps the bottom", "never gives a negative height"; restored → 13/13. Meta-check: proves the pure clamp; the scene wiring is proven by frames 15/16 (prompt and chart apart), not by a test |
| Servers | 4397/4398/4399 not listening after the step; the two 4399 preview shells stopped |
| Hooks / save | hooks and settings untouched; no `--no-verify`; save format untouched |

## 4. Next command

none — shipped

## 5. Open

- Human rows (PR body checklist): 4.6 ("15.00" vs kit "3:30"), 6.9 (scope vs roadmap letter), 9.8 (real tablet drag/select feel; also O3 small mat blocks), 10.6 (departures from ZADANIA), 10.7 (texts and `childName`; F12: quarter/5-min skills draw halves and full hours, "po południu" for 18–23).
- Visual observations as follow-ups (`follow-ups/review-fixes.md` "From the visual gate"): O1 `blocksLayout` splits the ones over two rows; O2 chart unreadable in the keypad solution (`TASK_LAYOUT.picture.keypadSolution`); O3 small mat blocks (`TASK_LAYOUT.drag.mat`); lifted mat block not captured (`BlockMat.render`).
- Not captured: unlock card for E3.3 (E4.3 captured instead), exactly 7.45 (9.45 captured).
- DESIGN-GAP: row 52 extended (no new row).
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. **Long prompt over a picture: shrink the prompt font (≥ 44) and clamp the picture under it** instead of rewording `E3.4.data_diff_10` or widening the column. Rejected: shorter text (a content change for the [human] 10.7 text read), a wider prompt column (would collide with the keypad). Why: general for any long pictured prompt, kit font stays 64 where it fits. What would change it: the teacher/text read (10.7) shortening the chart prompts, or the maintainer wanting all prompts at 64 px.
2. **`trayScale` 1.3 → 1.2** rather than insetting the tray area. Why: one number, no hit-geometry change. What would change it: the tablet test (9.8) finding the tray rod too small to grab.
3. **Unlock card captured for E4.3, not E3.3.** The E3 route (age 10+, E3, September) gave no unlock in 14 clean rounds; the E4/September route of `adaptive.spec` #13 unlocks step 3 ("Zegar: minuty i kwadrans", an S-13 `childName`). Row 6.8 ticked with that note. What would change it: the maintainer requiring the E3.3 card itself → a route with E3 started on step 2.
4. **O1–O3 left as follow-ups, not fixed here.** Why: they are legibility choices without a kit reference (layout of many blocks, solution split beside the keypad), and fixing them changes shared layout code (`blocksLayout` feeds the mat) after the review; counts and readings are correct. What would change it: [human] 9.8/10.7 calling them confusing, or a gap the next slice must touch anyway.
5. **Kit frames compared, not copied into `screenshots/`** (`designs/` is gitignored, the repo is public). What would change it: the maintainer asking for `kit-*` copies in the change folder.
6. **Capture build id shows `7ab1e78`**: frames were taken on the working tree with the fix before it was committed as `26a25df` (README says so). What would change it: a reviewer needing the corner id to match → re-capture on the committed tree.
7. **Archived with 5 open [human] rows (ship step).** `/10x-archive` warned: 5 manual Progress rows pending (4.6, 6.9, 9.8, 10.6, 10.7), 0 automated; 32 ticked rows without a sha suffix (docs/visual ticks; every cited sha is an ancestor of HEAD, no repoint). Chosen: archive (the skill's Recommended option for manual-only rows); rejected: resume implementation. Why: [human] rows are the maintainer's post-run checklist, listed in the PR body. What would change it: an automated row left open, or the maintainer rejecting a decision in 4.6/6.9/10.6.
