# Handoff — `notebook-polish` (slice fix:notebook-polish)

The visual gate step wrote this. Every [visual] row (2.4-11.7) was captured at 1440 and 1024 in the hook build next to its kit frame. The gate found two real discrepancies and fixed them in `3c58eec`: a pale correct tile and an over-blurred salon backdrop. Verdict: `VISUAL: PASS`. The next step must archive the change and then ship, stopping at an open PR. The [human] row 11.8 stays open for the maintainer.

## 1. State

| | |
|---|---|
| Branch | `feat/notebook-polish` (cut from `main` at `6e426ed`) |
| Commits | 38 on the branch: p1 `a659097` ... p12 `18d0cee`, review fix `050b185`, review docs `30d51ee`, visual fix `3c58eec`, then this docs commit `docs(notebook-polish): bramka wizualna` |
| Pushed / PR / merged | pushed by the ship step; PR/CI recorded in context/runs/2026-10-22-notebook-polish/run-log.md; merge waits for the maintainer |
| `change.md` status | `archived` (stamped by the ship step's `/10x-archive`) |
| `## Progress` rows remaining | 1 (`grep -c '^- \[ \]' plan.md`): [human] 11.8 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/AnswerTiles.ts` | `paint`: the correct tile uses `PLACEHOLDER_COLORS.selected` and `selectedBorder`, the kit's `.answer.selected` (fix `3c58eec`) |
| `src/data/layout.ts` | `BACKDROP.blur` is `{ quality 1, x 1, y 1, strength 1, steps 1 }` (was x/y 2, steps 4). The comment on `PLACEHOLDER_COLORS.selected` names the correct tile (fix `3c58eec`) |
| `context/changes/notebook-polish/reviews/visual-review.md` | The judgement per row, the hand-checked numbers, the fixes, and the line `VISUAL: PASS` |
| `context/changes/notebook-polish/screenshots/` | Frames: 58 desktop and 58 tablet JPEGs, 12 `kit-*` copies, 4 `before-fix-*`, plus `README.md` (route, how each state was reached) |
| `context/changes/notebook-polish/plan.md` | Rows ticked: [visual] 2.4, 2.5, 3.5, 3.6, 4.5, 5.5, 6.5, 7.5, 8.4, 9.4, 10.5 and 11.7, each with its evidence |
| `context/changes/notebook-polish/follow-ups/review-fixes.md` | New entry 17: check mark on the correct tile, and the keypad hint bar measured clear of the margin line. 22 `Trigger:` lines |
| `context/changes/notebook-polish/handoff.md` | This file |

## 3. Verification

All observed in this step. The baselines come from the contract: unit 3736, e2e 144.

| command | result |
|---|---|
| Capture, Playwright on the hook build, port 4399 | 32 of 32 capture tests passed on `3c58eec`. The build id in the corner matches HEAD |
| `npm run lint`, `npm run typecheck` | green |
| `npm test`, both deploy scripts, `sample` E1-E6 | green; unit 3781 (3736 + 45, no change from the fix) |
| `npm run build` | green; `e2e hook: absent (2 chunks checked)` |
| full e2e, `--workers=2`, with the fix in the tree | 149 of 150 passed; the failure was the known load flake `stale-tab` #2 B-1 |
| `stale-tab.spec.ts` alone, `--workers=1` | 5 of 5 passed |
| Hand-check: the counter after the tiles round | outcomes [first, retype, first, first, first] → 4 × `starPerTask` 1 + `cleanRoundBonus` 0 = 4; counter went 0 → 4, as in the frame |
| Hand-check: warm-up | 6 × 1 + 2 = 8, as in the frame |
| Hand-check: room | 30 + 1 − 5 (stage) = 26, then − 7 (sofa) = 19, as in the frames |
| Before/after evidence for the fix | `before-fix-correct-tile-*` (old face `#e5f2d4` vs tile `#e3f0d9`) against `correct-bounce`; `before-fix-backdrop-*` (old blur) against `task-tiles`. The fix is visual, so the evidence is these re-shot frames, not a red test |
| Ports | servers on 4399, 4398 and 4397 stopped; no listener left |

## 4. Next command

none — PR open for the maintainer

## 5. Open

- **[human] row 11.8, maintainer checklist:**
  - On iPad Safari: the hook or settings report the font as loaded; the plain 0 and the diacritics render.
  - The feel of the motion: bounce, wobble, stagger, star pops.
  - The new correct-tile green and the lighter backdrop blur from `3c58eec`.
  - Confirm decision D-1: no spine band, and the shadow falls straight down.
- **Follow-ups 1-17** are in `follow-ups/review-fixes.md`:
  - 17 is new: the kit's check mark on the correct tile (`AnswerTiles.paint`) is not drawn.
  - 13 stands: the hint number line labels are small at 1024 (`NumberLine`).
- **Observed, not this slice:**
  - The kit second-try bar shows "Pokaż kroki" after the first miss; the game offers steps after the second miss.
  - The kit welcome cushion is absent.
- **Known load flakes under `--workers=2`:** `stale-tab` #2 B-1, `adaptive` #13, `first-launch` #12.
- No DESIGN-GAP rows added.
- `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **Capture tool.**
  - Chosen: the Playwright fallback, with throwaway gitignored specs moved out of the repo before lint.
  - Rejected: Claude in Chrome. My own tab loaded the build, but the canvas never appeared: another tab of the same origin was holding IndexedDB. The held key, the drags and the clock also need raw touch.
  - What would change it: an extension that drives touch, and a clean origin.
- **Correct tile colour.**
  - Chosen: `AnswerTiles` only, using the kit's `.answer.selected` tokens.
  - Rejected: changing `PLACEHOLDER_COLORS.correct`. It is shared with the feedback bar, the keypad field and the written column, and the kit draws those pale green.
  - Rejected: the select tiles. Their marked state already uses `selected`, so a correct tile would look marked.
  - What would change it: the maintainer wants the same green on every correct object.
- **Backdrop blur.**
  - Chosen: one 1 px pass at quarter scale, so the salon is recognisable as in the kit's "60 % wash over a 5 px blur".
  - Rejected: the plan's `BACKDROP.scale 0.125` fallback, which is for an unbaked blur. The blur was baked, only too strong.
  - What would change it: the maintainer finds the salon distracting behind the tasks.
- **Check mark.**
  - Chosen: left as follow-up 17.
  - Rejected: drawing "✓" now. The glyph is not proven in `MartynkaNext.ttf`, and it is not in the plan.
  - What would change it: a maintainer request at row 11.8.
- **Stagger evidence.**
  - Chosen: frames from a Playwright video.
  - Rejected: screenshots. The hook polling makes them arrive about 1.1 s after "Dalej".
  - What would change it: a hook event at the entrance start.
- **Frames saved as JPEG (q82).**
  - Chosen: JPEG, which brings the folder from 40 MB to 9 MB. Profile § 8 allows JPEG frames.
  - What would change it: a rule that frames must be PNG.
