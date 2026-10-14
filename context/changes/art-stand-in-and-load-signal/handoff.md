# Handoff — `art-stand-in-and-load-signal` (slice fix, non-roadmap)

Written by the visual-gate step of run `2026-10-14-fix-art-stand-in`. The gate passed (`VISUAL: PASS`) after one fix commit
(`8881888`: stand-in labels wrap and keep ≥ 12 CSS px in the keypad picture; jug and back-row weight boxes no longer overlap).
Next is archive, then ship. The two [human] rows (6.7, 7.7) stay open for the maintainer and do not block shipping.

## 1. State

| | |
|---|---|
| Branch | `feat/art-stand-in-and-load-signal`, cut from `main` at `1812347` |
| Commits | plan commits + p1 `3be41c7` … p9 `bdc45d8` + epilogue `92f1a76` + review `e5c2e91` + fix `8881888` + this visual-gate docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` (unchanged by this step) |
| `## Progress` rows remaining | 2: 6.7, 7.7 `[human]` |
| Working tree | clean after the docs commit (`dist-e2e/` and the moved-out `tests/e2e/visual.local/` are gitignored / absent) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/artLayout.ts` | `standInLabelFit` (one or two lines, padding narrowed to a share of the box), `ScaleLayout.uncovered` (the part of a weight the front row leaves) |
| `src/ui/widgets/ArtImage.ts` | `show(key, rect, standIn?)`: the box over `standIn` when given; label wrapped at its space via `standInLabelFit` |
| `src/ui/widgets/BalanceScale.ts`, `src/ui/widgets/Jugs.ts` | pass `layout.uncovered[i]` / `layout.jugs[i]` as the stand-in box |
| `src/data/layout.ts` | `ART_STAND_IN.paddingShare: 0.03`; stale "with the id" comment corrected |
| `tests/artLayout.test.ts` | +6 tests: `standInLabelFit` (wrap, one line, larger shrink, padding share, back-row ≥ 11.9 CSS px), `uncovered` disjoint and inside |
| `docs/design-gaps.md` | row 66 updated (wrap, padding, jug and back-row boxes) |
| `context/changes/art-stand-in-and-load-signal/reviews/visual-review.md` | visual review: F1 measurement, V1/V2 with fixes, states, hand-checks, gate; ends with the VISUAL line |
| `context/changes/art-stand-in-and-load-signal/screenshots/` | 60 PNG frames (desktop 1920×1080, tablet 1024×768, narrow 400×300) + `README.md` |
| `context/changes/art-stand-in-and-load-signal/plan.md` | rows 4.5, 5.6, 6.6 `[visual]` ticked |
| `context/changes/art-stand-in-and-load-signal/follow-ups/review-fixes.md` | "Impl-review F1" replaced by "Visual-gate O1" (solution-phase weight labels) with `Trigger:` |
| `context/changes/art-stand-in-and-load-signal/handoff.md` | this file |

## 3. Verification

All observed in this step on `8881888`.

| Command | Result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK |
| `npm test` | 1905 passed (105 files); branch before this step 1899 → +6; contract baseline on main 1865 → +40 |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1` … `E6` | exit 0 each (no generator or prompt changed) |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; no `e2eArt` / `forcedArt` in `dist/_app/*.js` |
| `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts` | Chromium launched in this session: 52 passed (3.8 m) = branch e2e 52 + 0 |
| Visual capture | throwaway Playwright spec (moved out of the repo before e2e), e2e hook build on 4399; 32 tests, 60 frames |
| F1 measurement (tablet, pixel profile) | weight label in the keypad picture: before ≈ 10.3 CSS px font (7.5 px digits), after ≈ 12.3 (9 px digits); coins 12.8 (full size) before and after; solution phase weights ≈ 5 → 7.5–9.5 (O1) |
| Deliberate break | `ART_STAND_IN.paddingShare` 1 (full padding) → `artLayout.test.ts` back-row test red (`expected 10.16 to be greater than or equal to 11.9`); restored → 90/90. Meta-check: the test's 10.16 equals the 10.3 measured in the browser before the fix, so the layout-data model matches the tablet |
| Servers | 4399 preview killed (LISTEN only); no other port used |

## 4. Next command

`/10x-archive art-stand-in-and-load-signal` then ship

## 5. Open

- [human] 6.7 FR-022: import and reset unavailable under `unavailable` until restart (`Autosaver.replace`, `openSaveImportDialog`/`openSaveResetDialog`); frames `screenshots/*-30-unavailable-*.png`.
- [human] 7.7 FR-013: skills with the answer only in a missing picture skipped from rounds (`withoutArtBlocked`, `unlockThreshold`).
- Follow-up "Visual-gate O1" in `follow-ups/review-fixes.md`: stand-in weight labels in `TASK_LAYOUT.picture.keypadSolution` ≈ 7.5–9.5 CSS px (values given by the next solution line in `mass.ts`).
- Other follow-ups unchanged in `follow-ups/review-fixes.md` (S14-05..S14-10, S12-02..S12-15, S13-*, M-1/M-2/M-13/H-3/H-4), each with `Trigger:`.
- DESIGN-GAP row 66 revised again (no new row).

## 6. Autonomous decisions

1. **Playwright, not Claude in Chrome.** Rejected: Claude in Chrome (its synthetic touch cannot drive the 2 s gear long-press; the solution phase needs two wrong answers). Why: the step prompt and the S-13/S-14 gates name this route. Would change: a Chrome tool that can hold a touch.
2. **F1 fixed by wrapping and narrowing the padding, not by a minimum font with growing boxes.** Rejected: boxes growing past the weight (they would cover neighbouring weights and labels, the overlap S14-02 removed), a larger `TASK_LAYOUT.scale.weightSize` (changes the real-art scale). Why: wrapping plus a 3 % padding reaches ≈ 12.3 CSS px with no overlap and leaves the real art untouched. Would change: a measurement under 12 px in the keypad picture on a real tablet.
3. **Solution-phase weights (≈ 7.5–9.5 px) accepted as follow-up O1, not fixed here.** Rejected: re-laying the keypad solution picture in this change. Why: in that phase the next solution line gives the values, so the label is not the only source (impl-review decision 1's criterion), and the real art there is equally small (S-14 O1). Would change: a parent or teacher report, or a layout change to `keypadSolution` (the trigger).
4. **V2 (jug boxes) fixed in this step.** Why: the boxes covered the solution line, which is a real defect visible on every two-row jug task with missing art. The fix reuses `jugsLayout().jugs` (already proven apart and inside).
5. **400×300 viewport instead of the iframe trick** for the panel and the dialogs. Why: Playwright sets the viewport directly; the result is the same CSS width. Would change: nothing (the iframe trick exists for Chrome windows that cannot go narrow).
6. **e2e run directly** (Chromium launched in this session) instead of the request-file protocol.
