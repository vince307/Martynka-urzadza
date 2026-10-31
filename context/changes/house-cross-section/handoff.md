# Handoff — `house-cross-section` (slice S-23)

Written by the `/10x-implement` step, phase 5 of run 2026-10-31-house-cross-section (commit `5d59882`, docs only, no code behaviour changed). The next step is phase 6 (e2e); it must add `house-cross-section` to `ROUND_SPEC` in `playwright.config.ts`, and `housePixel(cellId)` is a method on `window.__martynkaE2E` (call it with `page.evaluate`).

## 1. State

| | |
|---|---|
| branch | `feat/house-cross-section`, cut from `main` at `112f158` |
| commits | docs, `158004b` p1, `c470f94` p2, `518f581` p3, `b46f63f` p4, `5d59882` p5 (+ this handoff commit) |
| pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 3.5, 4.4, 4.6, 5.5 (orchestrator e2e), 2.7, 5.11 [reviewer], 5.6 [visual], 5.7-5.10 [human], phase 6 |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `docs/design-gaps.md` | rows 183-190 added (Dom button, back button, flat sky, frame, closed cell, known-not-reached room closed, stand-in shell, salon green board in cream cell); row 180 closed |
| `CLAUDE.md` | S-22 sentence: interim visit button replaced by the house cross-section; scene list has House; new S-23 paragraph |
| `context/changes/house-cross-section/follow-ups/review-fixes.md` | new, 23 `Trigger:` lines (new items, kitchen/rooms-as-data re-recorded, F6 list, 4 closed as stale with evidence) |
| `src/data/layout.ts`, `src/data/pl.ts`, `src/scenes/HouseScene.ts`, `src/ui/widgets/HouseView.ts` | comments only: DESIGN-GAP citations now name the row numbers |
| `context/changes/house-cross-section/plan.md` | rows 5.1-5.4 ticked |

## 3. Verification

| command | result |
|---|---|
| `validate-rule-files.sh` | PASS (25 files, 0 missing); `grep -nE "HouseScene\|houseWakeVisit\|HOUSE_ART" CLAUDE.md` present |
| `grep -c "Trigger:"` follow-ups / gap rows `1(8[3-9]\|9x)` | 23 (>= 10) / 8 (>= 7) |
| seam sweep greps (`visitTarget\|visitButton` in src tests CLAUDE.md; `252, 636\|1060, 236` outside `houses.ts`) | both empty |
| `git diff --stat 112f158 -- balance.ts curriculum save.ts fixtures public/assets/rooms` | empty |
| break: appended `// 252, 636` to `src/core/rng.ts` | the cell-rect grep caught it; restored with `git checkout`. Meta-check: the grep is the criterion itself, so it proves the criterion, not behaviour |
| lint, typecheck, `npm test`, deploy/ops tests, sample E1-E6, build | green; `Tests 4089 passed` (phase 4 4089, delta 0: docs/comments only); `e2e hook: absent (2 chunks checked)` |
| Playwright | NOT run (orchestrator owns ports 4397/4398); rows 5.5 and earlier e2e rows are its |

## 4. Next command

`/10x-e2e house-cross-section phase 6`

## 5. Open

- Seam sweep findings: none to fix. No leftovers of `visit` wording (remaining uses are the live `visiting`/`houseWakeVisit` symbols), no duplicated cell-rect constants outside `src/data/houses.ts`, every `pl.house` key is used (`open` in `RoomScene`, `back` in `HouseScene`), no "five scenes" text; capture duplication (`captureRoomMiniature` vs `SalonBackdrop.render`) kept and recorded as follow-up 3.
- Manual rows: 2.7, 5.11 `[reviewer]`; 5.6 `[visual]` (gate captures the 8 frames); 5.7-5.10 `[human]`.
- Gap rows 183-190 in `docs/design-gaps.md`; follow-ups in `context/changes/house-cross-section/follow-ups/review-fixes.md`.
- Follow-up 11 says "hook test in phase 6" for the Dom button hidden under the celebration card; phase 6 should cover it or the item stays open.

## 6. Autonomous decisions

- Narrator-round-summary 39 could not be found as an open item in the archive: recorded as closed as stale ("not found"). Would change: the maintainer pointing at the item.
- Salon-load-health M-6 and load-and-tab-guard P-6 closed as stale on the evidence of the current `registerServiceWorker.ts` warnings; audit-art-renderer 2 closed (`-I` present). Would change: a silent install failure reported.
- Deliberate break for a docs phase is the seam-sweep grep itself (no behaviour to break). Would change: the plan adding a test for it.
- Driver stays `impl`.
