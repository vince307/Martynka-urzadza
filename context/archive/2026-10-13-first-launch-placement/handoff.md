# Handoff — `first-launch-placement` (slice S-06)

Written by the visual-gate step. Every [visual] state of rows 4.7, 5.6 and 6.4 was captured at 1440 and 1024×768 with Claude in Chrome; two real discrepancies were fixed on the branch (`aa34170` „Rodzic” inside the notebook, `317926b` the stage panel fits a 768 px tablet), the full local gate and `npx playwright test` (14 passed) were re-run after each, and the verdict is `VISUAL: GAPS` only for a follow-up outside this slice's views (O1, tiny □ glyph in E2 sentence prompts, Trigger: S-07).

UPDATE (re-dispatch): O1 is fixed in `9b9b9d3` (sentence prompts draw the box; `wrapBlankLines`, +2 unit tests) and re-captured at 1440 and 1024×768; the verdict is now `VISUAL: PASS`. The next agent must not miss this: code changed after the impl-review (`a6f091b`), but only `src/data/layout.ts`, `tests/layout.test.ts`, `src/style.css` and `docs/design-gaps.md`, and e2e was observed green on `317926b` in this step.

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | O1 fix `9b9b9d3`, p1 `d79ba20` … p9 `3320b20`, review fix `a6f091b`, visual fixes `aa34170`, `317926b`, plus docs/handoff commits; the last is `docs(first-launch-placement): bramka wizualna` |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-12-s04-s08/run-log.md |
| `change.md` status | `archived` (folder moved to `context/archive/2026-10-13-first-launch-placement/` by `c23b48a`; roadmap S-06 `done`, Backlog Handoff refreshed) |
| `## Progress` rows remaining | 7, all `[human]`: 5.7, 6.5, 7.5–7.9 |
| Working tree | clean after the visual-gate commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/layout.ts` | `WELCOME_LAYOUT.parent` moved to left 1420, top 834 (inside the notebook; DESIGN-GAP 15 comment updated) — `aa34170` |
| `tests/layout.test.ts` | the parent-button layout test asserts the button sits inside the notebook (red on the old values) — `aa34170` |
| `src/style.css` | `.parent-choices-stages` two-column grid, smaller half-width stage labels, „(propozycja)” on its own line, `.parent-dialog` `margin-block: auto` — `317926b` |
| `docs/design-gaps.md` | rows 15 and 17 describe the new placement and the two-column panel |
| `context/changes/first-launch-placement/screenshots/*.png` | 12 desktop frames (incl. 2 before-fix) + 9 tablet frames, PNG, ~4 MB |
| `context/changes/first-launch-placement/screenshots/README.md` | state · desktop · tablet · how reached; capture setup, month (October 2026) |
| `context/changes/first-launch-placement/reviews/visual-review.md` | states, hand-checked numbers, touch targets, findings and fixes; ends with the `VISUAL:` line |
| `context/changes/first-launch-placement/follow-ups/review-fixes.md` | new section „From the visual gate”: O1 (□ glyph in sentence prompts, Trigger: S-07) |
| `context/changes/first-launch-placement/plan.md` | rows 4.7, 5.6, 6.4 ticked |

## 3. Verification

Observed in this step.

| Command | Result |
|---|---|
| `npx vitest run tests/layout.test.ts` with the new assertion on the old layout | red: `expected 1856 to be less than or equal to 1724` (deliberate red-first; then fixed, 14 passed). Meta-check: the assertion compares the real `WELCOME_LAYOUT.parent` with the real `TASK_LAYOUT.notebook`, so it proves the placement, not a fixture |
| `npm run lint`, `npm run typecheck` | exit 0 (after `aa34170` and after the CSS fix) |
| After `9b9b9d3` | lint, typecheck OK; `npm test` 767 passed (671 + 96); deploy/ops OK; `sample` E1–E6 0 violations; build `e2e hook: absent`; `npx playwright test` 14 passed; deliberate break (box piece replaced by text in `wrapBlankLines`) red on `tests/promptBlank.test.ts`, restored |
| `npm test` (earlier) | 53 files, 765 passed (main baseline 671, +94; the fixes add no test case, they tighten one) |
| `bash deploy/test-martynka-deploy.sh`, `bash deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1` … `E6` | `Naruszenia: 0` each |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` (one plain command, Chromium launched) | 14 passed on `aa34170`'s tree and again on the CSS fix (baseline 8 + 6); ports 4397/4398 had no listener afterwards |
| Visual capture (Claude in Chrome, own tab, port 4399) | 21 frames; every [visual] state at both sizes; build id `317926b` in the final frames; tab closed, server on 4399 stopped |
| Hooks | `.claude/settings.json` and `.claude/hooks/*` untouched; no `--no-verify` |

## 4. Next command

none — shipped

## 5. Open

- `VISUAL: PASS`. O1 (tiny □ glyph in sentence prompts) is closed by `9b9b9d3`; the follow-up is marked closed.
- `[human]` checklist (unchanged):
  - 5.7: on an iPad, use the gate and the panel with a finger and check that no touch reaches the welcome screen underneath (also: the two-column panel reads well in landscape).
  - 6.5: on an iPad, check that the first E1/E2 task is read aloud automatically.
  - 7.5: the child starts alone; parent confirmation is optional.
  - 7.6: PRD OQ1, no warm-up after a parent override.
  - 7.7: warm-up composition 3 + 3, threshold < 4 of 6.
  - 7.8: until S-11 the welcome screen appears at every cold start.
  - 7.9: gate range 13–19 × 13–19.
- DESIGN-GAP rows 15 and 17 were reworded (placement, two columns); no new row.
- Earlier follow-ups stay in `follow-ups/review-fixes.md` (risk #12, `mountInstallHint` touch leak, S-11, S-08, S-14, earlier learner save, duplicate warm-up prompt, warm-up bonus, parent-path speech, F2, F5, F6).

## 6. Autonomous decisions


Earlier steps (kept):
1. Bare numbers: only the three named in the S-05 follow-up were tokenised; the other house-icon coordinates in `RoomSwitchButton.draw` stay.
2. Gap rows 20 and 21 were added as the plan lists them. Row 21 has no code comment.
3. AGENTS.md was kept under 400 words.
4. Phase 8: the E2 drop uses 3 wrong first tries. Helpers were duplicated in the spec, as the other specs do. The spec was committed after the orchestrator's run.
5. Phase 8 finish: the spec was committed as is.
6. Phase 9 finish: the spec was committed as is; change.md was set to `implemented`.

Impl-review step:
7. **Warnings fixed in place, not deferred**: F1, the aria ids (a real accessibility defect, two-line fix), and F3, the stale docs. Rejected: deferring them, because they are cheap and the code change does not touch anything a spec selects. Would change the answer: if a spec selected the group by name or id, I would have deferred the change to avoid an unverified e2e change.
8. **F2 (e2e helper duplication) deferred** to S-08. Rejected: refactoring four specs now, because Chromium cannot run in this session and the change would be unverified e2e code right before ship. Would change the answer: a session that can run Playwright.
9. **Row 7.4 ticked** although the e2e helpers stay duplicated. The production code has no duplicates, and the test-code duplication was a deliberate earlier decision (4) now queued as F2. Rejected: leaving 7.4 open, because nothing in production code fails the sweep. Would change the answer: the maintainer counts test-helper duplication as a seam-sweep failure.
10. **MERGE: CLEAR, conditional on the orchestrator's e2e re-run on `a6f091b`.** Rejected: BLOCKED, because there are no critical findings and every other suite is green as observed in this step. Would change the answer: a red e2e run on `a6f091b`.
11. The `a6f091b` commit message says "JSDoc nad installE2EHook", but the header actually stays at the top of the module, separated by a blank line. It was not amended (the contract forbids amending); the discrepancy is noted in the report under F3.

Visual-gate step:

18. **O1 fixed in this slice** (`9b9b9d3`) after the orchestrator re-dispatched: core wraps the sentence (pure, tested), scene draws boxes with a prompt-sized `blankInline` layout entry. Rejected: keeping sentence prompts free of `□` (generators and task data stay unchanged). Re-capture used the first sentence prompts that came up (E2 FACT_FAMILY on desktop, E1 domek on the tablet); no SEQUENCE prompt appeared, covered by the unit test. Would change: the maintainer wants a SEQUENCE frame specifically.

12. **Fixed „Rodzic” over the notebook border on the branch** (`aa34170`) instead of recording it: a button straddling the notebook frame is a layout defect, not something the kit lacks. Placed where the kit draws the cushion (DESIGN-GAP 20 leaves that corner empty). Rejected: outside the notebook (no room: 88 px below, 180 px to the right for a 260 px button) and a smaller button (≥ 96 px rule). Would change: the maintainer prefers the parent entry outside the child's notebook — then a smaller corner icon needs a kit view first.
13. **Fixed the stage panel overflow with CSS only** (`317926b`): two columns, one row per grade. Rejected: leaving the scroll (the primary action hidden below the fold on the target tablet), shrinking every button under 64 px, and shortening the copy (`pl.stages` passed the teacher read). Would change: a kit view for the parent panel.
14. **`VISUAL: GAPS`, not PASS**, because O1 is a visible defect a child now meets in the warm-up, even though it lives in the S-04 prompt renderer; not fixed here (needs boxes inside wrapped text plus its own test, outside this slice's views). Would change: the maintainer counts O1 as S-06's (E2 became playable here) — then a `fix(first-launch-placement)` before ship.
15. **The dev server was restarted after each fix** because Vite's watcher did not pick up edits in this sandboxed session (the served `style.css` stayed stale); the build id in the frames therefore names the commit. Kill ran outside the sandbox (signals are blocked inside), LISTEN pid only. Would change: a session where HMR works (then one server for the whole gate).
16. **Tablet warm-up reached through the parent path (confirm the proposal), desktop through the child path**, so both entries into the warm-up are on record; the tablet has no override-round frame (row 5.6 does not ask for it). Would change: nothing.
17. **Ran the e2e suite myself** (Chromium launched in this session as one plain command), so the orchestrator's re-run is a confirmation, not a dependency. Would change: a Chromium launch failure (then the orchestrator's run is the evidence).

Archive + ship step:

19. **Archived despite 7 open Progress rows** (`Continue archiving`, the skill's recommended label for 0 automated / 7 manual): rows 5.7, 6.5, 7.5–7.9 are all `[human]` and form the post-run checklist for the maintainer, not a blocker. No SHA repointing: every Progress SHA is an ancestor of the branch and the PR merges with `--merge` (no squash), so the SHAs survive on main. Rows without a SHA suffix (reviewer/visual/validator rows) stay as they are. Would change: a `[human]` row the maintainer marks as blocking before merge.
20. **Roadmap Backlog Handoff**: S-06 → Done; S-07 stays ready (gains the S-06 `Trigger: S-07` follow-ups: duplicate warm-up prompt, impl-review F5); S-08 stays `no` (S-07 not done) with the S-06 `Trigger: S-08` follow-ups (stage change behind `openParentGate`, F2 e2e helpers); S-11, S-14, S-17 rows restate their S-06 triggers; risk #12 is named in the S-06 row for `/10x-test-plan --refresh`. Would change: nothing.
