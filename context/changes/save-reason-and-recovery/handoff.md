# Handoff — `save-reason-and-recovery` (slice fix, non-roadmap)

The visual-gate step of run `2026-10-14-save-s13b-s15-s14b` wrote this file. The verdict is `VISUAL: PASS`, with 44 frames (22 states × 1440/1024) on `49e468e` and no code fix. The next step archives and ships. The four `[human]` rows (3.7, 4.7, 4.8, 5.8) stay open for the maintainer and are no reason to block.

## 1. State

| | |
|---|---|
| Branch | `feat/save-reason-and-recovery`, cut from `main` at `16a0abd` |
| Commits | 22 commits `16a0abd`..HEAD (exclusive of the base). This step added `docs(save-reason-and-recovery): bramka wizualna` plus this count correction, and no fix commit |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-14-save-s13b-s15-s14b/run-log.md |
| `change.md` status | `archived` (stamped by `/10x-archive` in the ship step) |
| `## Progress` rows remaining | 4, all `[human]`: 3.7, 4.7, 4.8, 5.8 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-reason-and-recovery/screenshots/*.png` | 44 frames: `desktop-NN-…` (1440×900) and `tablet-NN-…` (1024×768) |
| `context/changes/save-reason-and-recovery/screenshots/README.md` | frame table: state, both widths, how each state was reached |
| `context/changes/save-reason-and-recovery/reviews/visual-review.md` | judgement per plan row, focus log, layout and code-line checks. Ends with `VISUAL: PASS — …` |
| `context/changes/save-reason-and-recovery/plan.md` | `[visual]` rows 2.5, 3.6, 4.6, 5.7 ticked |
| `context/changes/save-reason-and-recovery/follow-ups/review-fixes.md` | Visual-gate O1 (start card for `future`) and O2 (reset lead's colon without a list), each with a `Trigger:` |
| `context/changes/save-reason-and-recovery/handoff.md` | this file |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| Throwaway capture spec, hook build on 4399, `npx playwright test --config=<visual.local config>` | 10 passed (5 flows × 2 viewports), twice. The second pass centred the "Zapis gry" section; its frames are kept |
| Focus and layout log per frame | Initial focus is never on "Zastąp mimo to", an overwrite or a destructive action. Every dialog is inside the viewport. `scrollWidth` equals the viewport width |
| Code lines vs seams | `UnknownError` (unavailable), `timeout` (hang), `future` (unreadable), `corrupt` (corrupt); `Wersja 49e468e` = HEAD |
| `npm run lint` / `npm run typecheck` | OK / OK, after the throwaway spec was moved out of the repo |
| `npm test` | 1927 passed = main baseline 1905 + 22, unchanged from impl-review |
| deploy + ops tests, `sample` E1–E6 | OK; exit 0 each |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` (full) | not re-run here, because no source changed. Last full run was 57 passed on `92cbf33` (impl-review step), inherited and not re-verified |
| Deliberate break | none: the step changed no code |
| Port 4399 | nothing listening after the run (`lsof -ti tcp:4399 -sTCP:LISTEN` empty) |

## 4. Next command

none — shipped

## 5. Open

- `[human]` checklist (`plan.md` `## Progress`):
  - 3.7: a `future` save is never overwritten by import or reset (`replaceGate`, `deviceSaveView`).
  - 4.7: a forced overwrite after the second confirmation under a permanent `unavailable`. Impl-review O3: the button already shows on the first `unavailable` start.
  - 4.8: `pl.saveTransfer.siteDataAdvice` checked on an iPad (Safari and the home-screen icon) and on Android (Chrome).
  - 5.8: the N-7 measurement of a cold IndexedDB read on an iPad (`balance.save.loadTimeoutMs`).
- Follow-ups in `follow-ups/review-fixes.md`, new from this step:
  - Visual-gate O1: `saveFailedCard.ts` shows the generic `pl.saveFailed` body for `future`.
  - Visual-gate O2: the colon of the reset lead in `saveResetDialog.ts` when no list follows.
  - Earlier items keep their triggers.
- No DESIGN-GAP was added. Rows 69–72 cover the absent kit frames.

## 6. Autonomous decisions

1. **Playwright instead of Claude in Chrome.** Chosen: the throwaway spec on 4399. Rejected: Chrome for the start cards with Playwright for the rest. Why: every other state sits behind the 2 s gear long press, which Claude in Chrome cannot drive (profile § 8), and one renderer keeps the frames comparable. Would change if Claude in Chrome could dispatch the Phaser long press.
2. **No fix for O1/O2.** Chosen: follow-ups with triggers. Rejected: changing `pl.saveFailed` or the reset lead now. Why: both are copy questions outside the agreed SIR scope. They need a teacher read and a new `pl` key, and neither misleads into data loss (the code line and the dialogs are correct). Would change if the maintainer reads the `future` card as misleading enough for this slice.
3. **Full e2e suite not re-run.** Why: the step changed only docs, and the capture spec exercised the same seams in the browser. Would change if any source file had changed (then the full suite runs before the commit).
4. **Viewports 1440×900 / 1024×768** (profile § 9 and the step prompt), not the 1920/400 set of the previous gate. Would change if the profile's widths change.
5. **No `AskUserQuestion`.** Every choice was made in place, following the step prompt and the contract.
6. **Archive despite open rows (ship step).** Chosen: `Continue archiving (Recommended)` — the warnings were 4 pending `[human]` rows (0 automated) and 14 `[reviewer]`/`[visual]` rows without a SHA suffix (rows with no commit of their own); every cited SHA is an ancestor of HEAD and a `--merge` keeps it. Rejected: resume implementation. Why: the `[human]` rows are a post-run checklist for the maintainer (PR section „Dla właściciela produktu”). Non-roadmap change: no roadmap row to close; `## Backlog Handoff` does not name it. Would change if an automated row were still open.
