# Handoff — `audit-backdrop-fox` (slice fix:audit-backdrop-fox)

Written by the archive + ship step of run 2026-10-24-audit-backdrop-fox, before the archive move and the push, so the archived copy carries the final pre-merge state. The run stops at an open PR (scope.md "How far"); the maintainer reviews and merges on "zmerguj".

## 1. State

| | |
|---|---|
| Branch | `feat/audit-backdrop-fox`, cut from `main` at `e020886` |
| Commits | phases 1-6 `8263f8b`, `63fb936`, `706a01b`, `b46be2a`, `abadce5`, `18e7eff`; impl-review fixes `22c80e2`; review, visual and handoff commits up to `7c74edb`; this handoff; `chore(archive): close audit-backdrop-fox`; the path update and, after CI, `docs(audit-backdrop-fox): dowody z CI` |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in `context/runs/2026-10-24-audit-backdrop-fox/run-log.md` |
| `change.md` status | `archived` (folder `context/archive/2026-10-24-audit-backdrop-fox/`) |
| Progress rows open | 4.7, 4.8 [human] (post-run checklist for the maintainer); 4.10 [reviewer] ticked at ship from the PR's CI log if the log proves it |
| Working tree | clean |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/archive/2026-10-24-audit-backdrop-fox/` | the whole change: change.md, research, plan, reviews (`impl-review.md` MERGE: CLEAR, `visual-review.md` VISUAL: PASS), screenshots, follow-ups |
| `context/archive/2026-10-24-audit-backdrop-fox/follow-ups/review-fixes.md` | follow-ups F1-F6 with triggers |
| `CLAUDE.md`, `docs/design-gaps.md` | references now point at the archive folder |

## 3. Verification

| command | result |
|---|---|
| local gate after the doc edits (lint, typecheck, npm test + deploy scripts + sample E1-E6, build) | run once by the ship step after the archive; result in the PR body and run-log |
| unit | 3891 → 3915 (impl-review step) |
| e2e | 155 → 160 (orchestrator and impl-review; unchanged since, only docs edited) |

## 4. Next command

none — PR open, waits for the maintainer's "zmerguj"

## 5. Open

- [human] 4.7 accept `pl.settings.guideMissing` "Lisek w rogu zeszytu się nie pokazuje, bo brakuje jego obrazka." and the count line without "napis lub rysunek" for a fox-only miss (decision P-5). Not a blocker for archiving: a post-run checklist item for the maintainer.
- [human] 4.8 accept the G-2 proof form (`page.route` abort of `fox-think.webp`, not a new `e2eArt` seam; decision P-4). Not a blocker either.
- Follow-ups F1-F6 in `follow-ups/review-fixes.md`, triggers restated: F1 a Canvas-renderer report or an e2e project on Canvas; F2 a playtest note of a plain page after the tablet slept or switched apps; F3 the next change to `starBurst`, `Keypad` or the bar layout; F4 a non-final error path in WelcomeScene or the next change to `WelcomeScene.openParent`; F5 unchanged, as cited in the earlier changes; F6 the next change to `SalonBackdrop.render` or the backdrop blur, or a report of a wrong-looking backdrop after a restore.
- After the merge, PRs #101 and #104 (audit reports) can be merged as docs.
- Observed, not this slice: the "Wróć" age-back button overlaps the notebook's bottom-left frame before the first round ends.

## 6. Autonomous decisions

- Archive despite 3 open Progress rows (0 automated, 3 manual: 4.7, 4.8 [human], 4.10 [reviewer]): the skill labels "Continue archiving" Recommended for manual-only pending rows; the [human] rows are the maintainer's post-run checklist, 4.10 is ticked at ship from CI. Would change: an open automated row.
- Roadmap edit skipped: a non-roadmap change, `context/foundation/roadmap.md` has no item with Change ID `audit-backdrop-fox`.
- Handoff written before the move (archived folders are read-only by convention), with archive paths.
