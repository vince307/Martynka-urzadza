# Handoff — `fox-guide` (slice fix:fox-guide)

Written by step `/10x-tdd fox-guide phase 2` of run 2026-10-23-fox-guide: the fox tokens (`GUIDE`, `ANIMATION.guide*`), the pure pose rule and the silhouette rect are committed test-first as `2d99dcf`. The next agent starts phase 3 (the widget and scene glue); it must call `guidePose`/`guideRect`/`GUIDE_ART`, never copy their numbers.

## 1. State

| | |
|---|---|
| Branch | `feat/fox-guide`, cut from `main` at `1962312` |
| Commits | phase 1 `e392442`, phase 2 `2d99dcf` (`test(fox-guide): regula pozy i geometria liska (p2)`), plus the handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 18 (`grep -c '^- \[ \]' plan.md`); 1.4 and 2.4 wait for the orchestrator's e2e |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/layout.ts` | `GUIDE` (anchor 1792,400; displaySize 320; sourceSize 1024; origin; silhouette) and `ANIMATION.guidePoseMs/guidePopScale/guideEase` |
| `src/core/guide.ts` | `GuidePose`, `GuideScreen`, `GUIDE_ART`, `guidePose` (two `never` guards) |
| `src/core/guideLayout.ts` | `guideRect(guide = GUIDE)` |
| `tests/guide.test.ts` | literal pose table (3 screens x 5 phases), `GUIDE_ART` ids in `UI_ART_KEYS` |
| `tests/guideLayout.test.ts` | rect values, corner, scene margin, pop margins, ~85 no-overlap cases (12 px gap) from the real layout functions and `TASK_LAYOUT`/`HUD_LAYOUT`/`MINIGAME_LAYOUT`/`SUMMARY_LAYOUT`/`UNLOCK_LAYOUT` |
| `context/changes/fox-guide/plan.md` | rows 2.1-2.3 ticked with the sha |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/fox-guide` (observed) |
| first RED (stubs: `guidePose` -> `'idle'`, `guideRect` -> zero rect, `GUIDE_ART` all `guideIdle`) | 18 assertion failures, e.g. "expected 1 to be 3" (distinct poses) and "expected +0 to be close to 1714.5, received difference is 1714.5" (rect); the no-overlap cases pass vacuously on the empty stub rect and are proven by the break below |
| GREEN | `tests/guide.test.ts` + `tests/guideLayout.test.ts`: 104 passed |
| deliberate break `GUIDE.anchor.x` 1792 -> 1700 | 16 red: tall lines, drag tray and tile, coin tray tile, keypad, clock lines, ribbon, rect values and pop margin; restored, green |
| deliberate break `retype` -> `'idle'` | 1 red ("task / retype -> think"); restored, green |
| meta-check | overlap oracles come from `pictureLayout`, `answerSpans`, `dragLayout`, `coinLayout`, `keypadGrid` and the layout constants, not from `guideRect`'s tokens, so moving the anchor turns them red; the pose oracle is a literal table |
| `grep -n never src/core/guide.ts tests/guideLayout.test.ts` | guards in both files |
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | baseline 3782 (phase 1) + 104 = 3886 passed (202 files) |
| deploy scripts, `sample` E1-E6, `npm run build` | OK; build prints `e2e hook: absent (2 chunks checked)` |
| e2e (`npx playwright test`) | NOT run (Chromium cannot start in the sandbox); orchestrator runs it, expect 150 + 0 |

## 4. Next command

`/10x-implement fox-guide phase 3`

## 5. Open

- Rows 1.4 and 2.4 stay unticked until the orchestrator's e2e run (150 + 0).
- Manual rows still open: 3.5 [visual], 4.5 [visual], 4.6 [human], 4.7 [human], 4.8 [reviewer].
- DESIGN-GAP rows 165-168 and follow-ups are planned for phases 3 and 4; boot payload 47.6 s of 48 s (see phase 1): no more boot art.
- The overlap cases model text blocks as boxes (prompt 120 px, expressions 160 px, settings hint 6 lines at 1.4 line height); the visual pass (4.5) is the real check.

## 6. Autonomous decisions

- Mixed-phase question: not asked; the phase is pure functions plus data tokens, all done test-first, `Driver: tdd` kept. The tokens in `layout.ts` were added with the stubs (data, no behaviour). Would change: none.
- Commit message taken as proposed in spirit (Polish, `test(fox-guide): ... (p2)`); stopped after this phase.
- Test names use `%s` instead of the `%i` first written (it printed NaN). Plan ticks 2.1-2.3 cite `2d99dcf`; 2.4 left for the orchestrator.
