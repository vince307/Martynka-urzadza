# Handoff — `fox-guide` (slice fix:fox-guide)

Written by the archive + ship step of run 2026-10-23-fox-guide, before the archive move and the push, so the archived copy carries the final pre-merge state. The run stops at an open PR (scope.md "How far"); the maintainer reviews and merges on "zmerguj".

## 1. State

| | |
|---|---|
| Branch | `feat/fox-guide`, cut from `main` at `1962312` |
| Commits | phases 1-5 `e392442`, `2d99dcf`, `953ed88`, `4d590fd`, `d228146`; review, visual and handoff commits up to `23f95c3`; this handoff; `chore(archive): close fox-guide`; the path update and, after CI, `docs(fox-guide): dowody z CI` |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in `context/runs/2026-10-23-fox-guide/run-log.md` |
| `change.md` status | `archived` (folder `context/archive/2026-10-23-fox-guide/`) |
| Progress rows open | 4.6, 4.7 [human] (post-run checklist for the maintainer); 4.8 [reviewer] ticked at ship from the PR's CI log if the log proves it |
| Working tree | clean |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/archive/2026-10-23-fox-guide/` | the whole change: change.md, research, plan, reviews (`impl-review.md` MERGE: CLEAR, `visual-review.md` VISUAL: PASS), screenshots, follow-ups |
| `context/archive/2026-10-23-fox-guide/follow-ups/review-fixes.md` | follow-ups F1-F7 with triggers |
| `CLAUDE.md` | fox sentence now points at the archive folder |

## 3. Verification

| command | result |
|---|---|
| local gate after the doc edits (lint, typecheck, npm test + deploy scripts + sample E1-E6, build) | run once by the ship step after the archive; result in the PR body and run-log |
| e2e | 150 → 155 (orchestrator, earlier steps; unchanged since, only docs edited) |

## 4. Next command

none — PR open, waits for the maintainer's "zmerguj"

## 5. Open

- [human] 4.6 accept the fox's place and size (`GUIDE` in `src/data/layout.ts`; fallback anchor x 1802, follow-up F5). Not a blocker for archiving: a post-run checklist item for the maintainer.
- [human] 4.7 real tablet: sharpness at 384² art, the pop's feel, the cheer on a 0-star summary. Not a blocker either.
- Follow-ups F1-F7 in `follow-ups/review-fixes.md` (triggers unchanged); DESIGN-GAP 165-168 in `docs/design-gaps.md`.
- Boot budget: 47.6 s of the 48 s cap checked by `tests/bootBudget.test.ts`, about 0.4 s left for future art.

## 6. Autonomous decisions

- Archive despite 3 open Progress rows (0 automated, 3 manual: 4.6, 4.7 [human], 4.8 [reviewer]) and 6 ticked rows without a SHA suffix (gate and visual rows, no diff of their own): the skill labels "Continue archiving" Recommended for manual-only pending rows; the [human] rows are the maintainer's post-run checklist. Would change: an open automated row.
- Roadmap edit skipped: a non-roadmap change, `context/foundation/roadmap.md` has no item with Change ID `fox-guide`.
- Handoff written before the move (archived folders are read-only by convention), with archive paths.
