# Handoff — `art-stand-in-and-load-signal` (slice fix, non-roadmap)

Written by the implementation-review step of run `2026-10-14-fix-art-stand-in`. Review saved, verdict APPROVED, `MERGE: CLEAR`; `change.md` is `impl_reviewed`. Next is the visual gate: the stand-in boxes (check the label size of weights on the scale in the keypad solution phase, review F1), the "Obrazki" panel line and the import/reset dialogs are still unseen.

## 1. State

| | |
|---|---|
| Branch | `feat/art-stand-in-and-load-signal`, cut from `main` at `1812347` |
| Commits | plan commits + p1 `3be41c7` … p9 `bdc45d8` + epilogue `92f1a76` + this review commit (docs only, no fix commit) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 5: 4.5, 5.6, 6.6 `[visual]`; 6.7, 7.7 `[human]` |
| Working tree | clean after the review commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/art-stand-in-and-load-signal/reviews/impl-review.md` | full-plan review (phases 1-9): 0 critical, 1 warning (F1), 5 observations; evidence table, teacher read, `MERGE: CLEAR` |
| `context/changes/art-stand-in-and-load-signal/plan.md` | `## Progress`: [reviewer] rows 1.5, 2.5, 3.5, 4.4, 5.5, 6.5, 7.5, 7.6 ticked (`— impl-review`); row 8.3 got its sha `0f1a43b` (F6) |
| `context/changes/art-stand-in-and-load-signal/follow-ups/review-fixes.md` | new item "Impl-review F1" (stand-in label minimum size) with `Trigger: visual gate of this change (row 5.6)` |
| `context/changes/art-stand-in-and-load-signal/change.md` | `status: impl_reviewed` |
| `context/changes/art-stand-in-and-load-signal/handoff.md` | this file |

## 3. Verification

All observed in this step on `92f1a76` (code unchanged by the review).

| Command | Result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK |
| `npm test` | 1899 passed (105 files); contract baseline on main 1865 → +34; the baseline flaky `spoken.test.ts` timeout did not recur |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1` … `E6` | exit 0 each |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; grep of `dist/_app/*.js`: no `e2eArt`, no `forcedArt`; `corrupt` only as the save-decode reason |
| `npx playwright test --config=…/playwright.config.ts` | Chromium launched in this session: 52 passed (3.9 m) = baseline 46 + 4 (`art-stand-in`) + 2 (`save-transfer-blocked`); ports 4397/4398 free afterwards |
| Break 1 | `withoutArtBlocked` without the threshold (`current.length > 0` only) → `tests/artFilter.test.ts` 2 red (E2.2 and "below the threshold", `AssertionError` on bucket contents); restored, 12 passed. Meta-check: break in the rule, test data is the real E2.2 step, so it proves the unlock guarantee |
| Break 2 | `UIScene.openImport` with `deviceSaveView(null, …)` → `tests/deviceSaveWiring.test.ts` openImport red; restored, `git status src` clean. Meta-check: proves the source tripwire for the direct regression; a contrived bypass is possible, e2e p9 (break p9a) is the behavioural proof (review F2) |
| Hook integrity | `.claude/settings.json` and `.claude/hooks/*` predate the run; no `--no-verify` in the branch |

## 4. Next command

`visual gate`

## 5. Open

- [visual] 4.5 "Obrazki" line (ok, `?e2eArt=missing`, `?e2eArt=corrupt`) at 1920×1080 and ~400 px; 5.6 stand-ins with `?e2eArt=missing` (coins, notes, jugs, scale with weights, COUNT/MULT_GROUPS icons, thermometer), each also in the keypad solution phase, at 1920×1080 and 1024×768 — measure the weight and coin labels (`ArtImage.show`, review F1: arithmetic says ~5 CSS px for a weight in `TASK_LAYOUT.picture.keypadSolution`); 6.6 import/reset dialogs at `?e2eSave=unavailable` and `?e2eSave=unreadable` and on a healthy save.
- [human] 6.7 FR-022: import and reset unavailable under `unavailable` until restart (`Autosaver.replace`, `openSaveImportDialog`/`openSaveResetDialog`). 7.7 FR-013: skills with the answer only in a missing picture skipped from rounds (`withoutArtBlocked`, `unlockThreshold`), E5.5 drops the jug skill when only the half-litre jug is missing.
- Follow-ups: `follow-ups/review-fixes.md` (S14-05..S14-10, S12-02..S12-15 incl. S12-04 panel export under `unreadable`, S13-*, raw copy in dialog, M-1/M-2/M-13/H-3/H-4, impl-review F1), each with `Trigger:`.
- DESIGN-GAP rows 66 (revised), 67, 68 in `docs/design-gaps.md`; none added by the review.

## 6. Autonomous decisions

1. **F1 (stand-in text minimum size) as WARNING → follow-up for the visual gate, not fixed now.** Rejected: tuning `ART_STAND_IN.padding` / a minimum scale blind (a minimum scale brings back the overlap of adjacent weights S14-02 described). Why: the fit is correct and the case is rare; the size question needs a measurement the next step makes anyway. Would change: the visual gate measuring a label under ~10 CSS px in a phase where the label is the only source of the value → fix in this change before ship.
2. **F2 `deviceSaveWiring.test.ts` (AST read of UIScene source) kept.** Rejected: deleting it (e2e p9 alone is slow and runs outside CI). Why: cheap CI tripwire that went red on the direct regression; repo already has AST-reading tests. Would change: a DOM/scene harness for `UIScene`.
3. **F3 E5.5 rule accepted as implemented**; the composition question stays with the maintainer (7.7). Would change: the maintainer wanting E5.5 never filtered (`minCurrent` = n).
4. **F5 panel export under `unreadable` accepted as residual** (out of scope, S12-04 follow-up). Would change: a parent report of exporting the fresh session believing it was the old save.
5. **MERGE: CLEAR with [visual] and [human] rows open**: the review's blocking criteria are critical findings, unmet automated criteria and red suites; [visual] rows belong to the next step and [human] rows to the maintainer. Would change: the run contract making [human] rows a merge condition.
6. **e2e run directly** (Chromium launched in this session) instead of citing the orchestrator's runs.
