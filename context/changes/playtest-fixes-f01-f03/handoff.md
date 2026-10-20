# Handoff — `playtest-fixes-f01-f03` (slice fix:playtest-fixes-f01-f03)

The visual gate step of run 2026-10-20-playtest-boot wrote this handoff. The gate found two defects in the gear hint and fixed both: the text was drawn under its box, and the bubble covered "Dalej", a tile and the room buttons. It also fixed a "Wróć" e2e flake that already failed on the base. The verdict is `VISUAL: PASS`, and every `[visual]` row is ticked. The next agent must not tick the two `[human]` rows (6.6, 7.4): they wait for the maintainer.

## 1. State

| | |
|---|---|
| Branch | `feat/playtest-fixes-f01-f03`, cut from `main` at 64fd3ea |
| Commits | fea1184 .. a7b1856 (phases 1-9, impl review). This step adds fixes e259870 and 69a2eb4, then the docs commit `docs(playtest-fixes-f01-f03): bramka wizualna` with the screenshots, the review and this handoff |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in `context/runs/2026-10-20-playtest-boot/run-log.md` (the ship step pushes, opens the PR, merges and watches the Deploy run after this archive) |
| `change.md` status | `archived` (archive + ship step, 2026-10-20) |
| `## Progress` rows remaining | 2, both [human]: 6.6 and 7.4 |
| Working tree | clean after the docs commit (the throwaway `tests/e2e/visual.local/` was moved to the session scratchpad; `test-results/` and `dist-e2e/` are gitignored and not committed) |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/SettingsHint.ts` | (e259870) the box graphics are created before the label, so the text draws on top (VG-1) and uses the new font role `settingsHint` |
| `src/data/layout.ts` | (e259870) `HUD_LAYOUT.settingsHint` is now right 1912, width 212, padding 12, radius 24: a narrow bubble in the right margin with its left edge at 1700. New `FONT_SIZES.settingsHint` 32 and `FONT_WEIGHTS.settingsHint` 650 (VG-2) |
| `tests/layout.test.ts` | (e259870) new test "keeps the gear hint bubble above the gear, inside the screen and right of every answer control and room control". It checks the keypad, tile and keypad bars, the tall-drawing bar and lines, the drag and coin trays, and the room task, choose, close and mode buttons, plus the wrap width against the longest word |
| `docs/design-gaps.md` | (e259870) row 151 describes the new bubble placement |
| `tests/e2e/first-launch.spec.ts` | (69a2eb4) the "Wróć" test waits on finished writes through the helpers `writesDone` and `savedSince` (hook `save.writes`, `lastReason`) instead of `dirty`. After "Wróć" the next finished write must be `'now'` (VG-3) |
| `context/changes/playtest-fixes-f01-f03/screenshots/` | 40 JPEG frames (20 states × desktop 1440×900 and tablet 1024×768) + `README.md` (route, table of state, desktop, tablet, how reached) |
| `context/changes/playtest-fixes-f01-f03/reviews/visual-review.md` | the gate report: states per row, hand-checked numbers, VG-1..VG-3, what is not covered, and the closing VISUAL line |
| `context/changes/playtest-fixes-f01-f03/plan.md` | rows 4.5, 4.6 and 6.4 ticked, citing e259870 |
| `context/changes/playtest-fixes-f01-f03/follow-ups/review-fixes.md` | impl-review F2 marked as fired, with the spec part done and the `writing` flag and the other reload specs still open |

## 3. Verification

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK on the fix tree |
| `npm test` | 3683 passed (baseline 3656, +27; +1 from the new layout test, +26 earlier in this branch) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh`, `sample` E1-E6 | OK, 0 violations |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| full e2e `npx playwright test --config=<abs> --workers=4`, run 1 (layout fix only) | 140 passed, 1 failed: first-launch "Wróć" (welcome after the reload) |
| "Wróć" spec alone on the base a7b1856 (fix stashed), `--repeat-each=6` | 4 of 6 failed, so the flake predates this step (impl-review F2) |
| "Wróć" spec after 69a2eb4, `--repeat-each=8` | 8 of 8 passed |
| first-launch + parent-settings `--repeat-each=3` (before 69a2eb4) | 35 passed, 1 failed (the same "Wróć" flake); the hint tests #14 green 6 of 6 |
| full e2e, run 2 on the final tree | 141 passed, 0 failed (baseline 139, +2 from this branch's specs) |
| break: `HUD_LAYOUT.settingsHint` back to right 1878, width 380 | the new layout test was red ("hint clear of keypad: expected 1498 to be greater than or equal to 1556"); restored, green. Meta-check: it compares constants only. The draw-order fix (VG-1) is proved only by the frames, because no test can read canvas draw order |
| break: `flush('now')` removed from `TaskScene.backToAge` | the "Wróć" spec was red 2 of 2 at the new assertion (expected `'now'`, received `'change'`); restored. Meta-check: without the flush, warm-up writes before the round ends come only from the debounce (`'change'`), so the `'now'` assertion pins the flush itself and not timing |
| visual capture | Playwright, 2 projects × 20 states, all through the product on the hook build at port 4399. The text widths were measured in the real font through canvas `measureText` |
| servers | 4399 stopped by this step; 4397, 4398 and 4399 have no LISTEN after the run |

## 4. Next command

`none — shipped` (archived by the ship step; no hosted db push — none exists; non-roadmap change, no roadmap row to mark)

## 5. Open

- [human] 6.6: the maintainer confirms the product choices A-2 ("Wróć" hidden after a parent's stage choice), A-3 (visible through the whole warm-up and first round) and A-4 (no confirmation).
- [human] 7.4: PRD FR-009 still says auto-read is on for E1-E2.
- DESIGN-GAP row 151 was updated for the new bubble placement; no new gap.
- Follow-ups in `follow-ups/review-fixes.md`:
  - impl-review F2, partly done: the `writing` flag in `AutosaveStatus` and the other reload specs are still open.
  - impl-review F3 (`pickVariedSkills` caps in draw order).
- Not captured: the hint over a coin-wallet task and over a digits column. Their controls sit in the tray and keypad column, which the layout test pins.
- The ship step sets F-01..F-03 to "naprawione (#PR)" in `docs/playtest-feedback.md` (scope.md § 1).

## 6. Autonomous decisions

- V-1 Playwright fallback instead of Claude in Chrome for every state. Every state needs canvas taps on Phaser targets and answered rounds, which the extension cannot drive (profile § 8). Rejected: Chrome for the static frames only, which would need the same Playwright flow to reach them anyway. Would change: a Chrome extension that delivers touch events to the canvas.
- V-2 Bubble placement: a narrow five-line bubble in the right margin (left edge 1700, 32 px text). Rejected:
  - a one-line strip under the notebook, which would cover the room task button and the panel (y up to 1040);
  - 24 px text inside the 180 px margin, about 13 CSS px on the tablet, too small to read;
  - keeping 40 px text, whose bubble needs 316 px of width and would overlap the tall-drawing bar.

  Would change: the kit or the maintainer giving a hint design, or a new answer control right of x 1700 (the layout test would go red).
- V-3 The "Wróć" flake was fixed in the spec (wait for finished writes), not with an in-flight flag in `autosave.ts`. Rejected: product code in a visual-gate step (follow-up F2 keeps the flag). Would change: another reload spec flaking the same way.
- V-4 Fix commit messages are in English, like the rest of this branch's log, although profile § 1 says Polish (the same as impl-review R-4). The docs commit uses the Polish title the step prompt gave. Would change: the maintainer asking for Polish on run commits.
- V-5 Kit frames are cited by path (`designs/martynka-maths-A-v1/screenshots/`, tracked in git), not copied into `screenshots/`. Would change: the kit leaving the repo.
- S-1 (ship step) `/10x-archive` warned of 2 pending manual rows (6.6, 7.4 [human]) and of 23 ticked rows without a SHA suffix (reviewer/visual rows and gate rows citing their proof in words); chosen "Continue archiving" (the skill's Recommended label for manual-only pending). Rejected: Resume implementation (nothing automated is open). The [human] rows are the maintainer's post-run checklist, listed in the PR under "dla właściciela produktu". Every cited SHA is an ancestor of HEAD, so no repoint was offered. Would change: an automated row left open.
- S-2 (ship step) Restated triggers from §5: FR-009 follow-up waits for the next `/10x-prd` refresh; impl-review F2 (`writing` flag) waits for a reload-spec flake or the next `AutosaveStatus` change; F3 waits for a playtest note of 3 tasks of one kind.
