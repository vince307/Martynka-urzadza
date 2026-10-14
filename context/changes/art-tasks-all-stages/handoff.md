# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the `/10x-implement` step for phase 7 (commit `5cdf740`): `IconGroups` widget over `ArtImage`, `iconsLayout`, COUNT skills in E1.2 and E1.4, MULT_GROUPS in E3.9. Phase 8 (impl) is next; the e2e of this phase (7.5) was NOT run (Chromium cannot start here) and the tall-layout browser break (6.3) is still open for phase 10.

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | `46aff1d` (p1), `d4f4470` + `ab0dc05` (p2), `b6a947d` (p3), `ba4e0da` (p4), `89e5ea0` (p5), `44c4f19` (p6), `5cdf740` (p7), this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; the implement epilogue is for the last phase) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; open for this phase: 7.5 e2e (orchestrator), 7.6 reviewer, 7.7 visual; row 6.5 ticked from the orchestrator note |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/artLayout.ts` | new pure `iconsLayout(groups, framed, area, spec)` returning `icons`, `frames`, `icon` (side in px): one group = grid with rows of up to `maxPerRow` 6; `[10, k]` = the ten in one row, the rest left-aligned under it; framed groups side by side (two lines of frames from four groups); fits the area, capped at `maxIcon` |
| `src/ui/widgets/IconGroups.ts` | Graphics for the frames (created first, so drawn under the icons) + pool of 30 `ArtImage`; `render(icon, groups, framed, rect)`, `setVisible`, `shown`, `art`, `bounds` |
| `src/ui/widgets/TaskPicture.ts` | the `icons` case now dispatches to `IconGroups`; every visual kind has a widget |
| `src/data/layout.ts` | `TASK_LAYOUT.icons` (gap 0.12, maxPerRow 6, framePad 0.2, frameGap 0.35, maxIcon 150, radius, border); DESIGN-GAP comment (row in phase 9: the kit has no plates) |
| `src/data/curriculum/E1.ts`, `E3.ts` | `E1.2.count_5` (1..5), `E1.4.count_7` (4..7), `E3.9.mult_groups_result`, `E3.9.mult_groups_expr` (2-5 groups of 2-6, max 30), all tiles |
| `tests/artLayout.test.ts` | +25 tests for `iconsLayout` (7 shapes x 3 areas inside and apart, icons inside their frame, >= 96 px for 1/5/7 icons in 294 px tall areas, ten in a row, cap) |
| `context/changes/art-tasks-all-stages/plan.md` | rows 6.5, 7.1-7.4 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` (observed) |
| `npm test` | 1782 passed (branch baseline 1745, +37: 25 layout tests, 12 from the 4 new skills' invariants and generator tests) (observed) |
| `npm run lint`, `npm run typecheck` | clean (observed; one `eslint --fix` for unnecessary assertions in the new test) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK (observed) |
| `npm run sample -- E1` ... `E6` | "Naruszenia: 0" each; `--count 6` read for E1.2, E1.4, E3.9 |
| `npm run build` | green, `e2e hook: absent (2 chunks checked)` |
| Deliberate break | `E1.2.count_5` answer `'tiles'` -> `'keypad'`: `tests/generateTask.test.ts` red (`expected [ 'E1.2.count_5' ] to deeply equal []`, "E1 has no keypad skill"); restored. Meta-check: the pin covers the new skill by listing it |
| e2e | not runnable in this session — orchestrator gate (`MachPortRendezvousServer ... Permission denied`, plain `npx playwright test --config=...` tried). Expected `42 passed + 0`; row 7.5 unticked |
| Teacher read | "Ile jest gruszek/jabłek/lamp/kluczy/książek/rogalików?", hints "Na obrazku: 3 gruszki / 5 gruszek", "Na 4 talerzykach leży po 4 gruszki", expression distractors (sum, wrong product, swapped factors not offered): no violation |

## 4. Next command

`/10x-implement art-tasks-all-stages phase 8` (phase 8, Driver: impl)

## 5. Open

- Row 7.5 (orchestrator): `npx playwright test` expects 42 passed. Rows 7.6 `[reviewer]`, 7.7 `[visual]`. Row 6.3 (TaskScene tall-layout break) stays open for phase 10 (row 10.5) or the orchestrator. Earlier open: 1.5, 2.8, 2.9 `[human]`, 3.5, 4.5, 5.7, 5.8, 5.9, 6.6, 6.7.
- Readability for the visual gate: a ten in one row in a 600 px wide area is about 55 px per icon (plan wanted >= 96 px only up to 12 icons, but a ten in one row cannot do that in the narrow areas); 12 icons in 6+6 rows give about 91 px at 600 px width. Frames have a fill and border from `PLACEHOLDER_COLORS`, never seen on a canvas.
- Browser proof of `art` for icons: phase 10 should assert keys `tasks/icons/<id>` one per icon, all `loaded`, `art` empty after hide.
- DESIGN-GAP rows (from 59) are written in phase 9 for money, scale, jugs, thermometer small sizes, icons without plates; E4.1 banknotes 200/500 zl follow-up `Trigger: S-14c`.
- `ARTIFACT GAP: none`.

## 6. Autonomous decisions

1. The ten of `[10, k]` stays in one row as the plan says, accepting small icons in narrow areas; the 96 px test covers 1/5/7 icons in areas 294 px tall only. Rejected: two rows of five for the ten (changes the "ten in a row" teaching picture). Would change: the visual gate finding the ten unreadable.
2. Frames are one Graphics object created before the icon pool, so they sit under the icons without depth values.
3. Framed groups are laid in one line up to three groups, two lines from four; unframed multi-group drawings stack one group per row left-aligned.
4. e2e not run (Chromium cannot start); the orchestrator note applied to row 6.5.
