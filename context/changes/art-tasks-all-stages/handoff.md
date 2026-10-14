# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the `/10x-implement` step for phase 5 (commit `89e5ea0`): `MoneyTable` and `BalanceScale` on `ArtImage`, the e2e hook field `art`, money and mass skills in E1.11, E3.4 and E4.1. Phase 6 (impl) is next; the e2e of this phase (5.5) was NOT run (Chromium cannot start here), and the hook's `art` has no browser proof yet: phase 10 (or the orchestrator for 5.5) must assert it against the real page.

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | `46aff1d` (p1), `d4f4470` + `ab0dc05` (p2), `b6a947d` (p3), `ba4e0da` (p4), `89e5ea0` (p5), this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; the implement epilogue is for the last phase) |
| `## Progress` rows remaining | 47 (`grep -c '^- \[ \]' plan.md`); open for this phase: 5.5 e2e (orchestrator), 5.7 and 5.8 reviewer, 5.9 visual |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/artLayout.ts` | pure `moneyLayout` (notes row above coins row, centred, scaled to fit, `maxScale`) and `scaleLayout` (scale image fitted, item on the left pan, up to 6 weights on the right pan in rows of 3, the second row higher) |
| `src/ui/widgets/MoneyTable.ts`, `BalanceScale.ts` | widgets over a fixed pool of `ArtImage` (10 for money; scale + item + 6 weights, first weight row drawn last so it is on top); `render`, `setVisible`, `shown`, `art`, `bounds` |
| `src/ui/widgets/ArtImage.ts` | `state()` now reads the game objects: a visible image with `texture.key` equal to the requested key and a non-zero display size gives `{key, loaded: true}`; the visible stand-in box and label give `loaded: false`; else null |
| `src/ui/widgets/TaskPicture.ts` | dispatches `money` and `scale`; exhaustive `switch` (`never` default); `jugs`, `thermometer`, `icons` are explicit empty cases for phases 6-7; `art()` returns the drawing widget's on-screen images, `[]` when hidden |
| `src/scenes/TaskScene.ts` | `TaskSnapshot.art` (frozen copy of `picture.art()`), hook build only reads it |
| `tests/e2e/support/hook.ts` | `Snapshot.art?: { key: string; loaded: boolean }[]` |
| `src/data/layout.ts` | `TASK_LAYOUT.money` (note 192x128, coin diameter = real mm x 4.8, gaps) and `TASK_LAYOUT.scale` (pan centres 90/421 x 240 in the 512x384 image, item 104, weights 52, perRow 3, rowLift 38); comments say `DESIGN-GAP (row added in S-14 phase 9)` |
| `src/data/curriculum/E1.ts`, `E3.ts`, `E4.ts` | E1.11 `money_count_10`, `money_change_10`, `mass_kg_10` (tiles); E3.4 `mass_kg_10`, `mass_dag_100` (keypad); E4.1 `money_count_100` (keypad), `money_count_zl_gr` (tiles, text), `money_change_100` (keypad), `mass_half_kg` (keypad); `childName` untouched |
| `tests/artLayout.test.ts` | 31 tests: money items inside 3 picture rectangles, apart, notes above coins, note wider than coin, 5 zł larger than 1 gr; scale with 1..6 weights inside the image, item left of centre, weights right, same-row weights apart |
| `context/changes/art-tasks-all-stages/plan.md` | rows 4.4 (e2e part from the orchestrator note), 5.1-5.4, 5.6 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` (observed) |
| `npm test` | 1707 passed (branch baseline 1649, +58: 27 invariants of the 9 new skills x 3, rest + 31 layout) (observed) |
| `npm run lint`, `npm run typecheck` | clean (observed; the first lint run flagged 6 needless `!` in the new test, fixed with `eslint --fix`) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK (observed) |
| `npm run sample -- E1` ... `E6` | exit 0 each (observed); E1.11, E3.4, E4.1 read: amounts, change, masses, "5 zł 50 gr" tiles, hints |
| `npm run build` | green, `e2e hook: absent (2 chunks checked)` |
| Deliberate break | removed `case 'money'` from `TaskPicture.render`: `npm run typecheck` red (`TS2322 ... kind: "money" ... not assignable to type 'never'`); restored, green. Meta-check: proves the dispatcher is exhaustive only, not that anything is drawn |
| e2e | not runnable in this session — orchestrator gate (`playwright test` on `drawn-tasks.spec.ts`: `MachPortRendezvousServer ... Permission denied`, launch dies). Expected `42 passed + 0`; row 5.5 left unticked. A spec I wrote for the hook's `art` (E3.4.mass_dag_100: keys = scale + item + each weight, all `loaded`) was reverted unrun, since a spec is committed only after its break turned red |
| Teacher read | read the `sample` output of E1.11, E3.4, E4.1 (6 draws each); no violation; agreement and hints fine |

## 4. Next command

`/10x-implement art-tasks-all-stages phase 6` (phase 6, Driver: impl)

## 5. Open

- Row 5.5 (orchestrator): `npx playwright test` expects 42 passed. Rows 5.7, 5.8 `[reviewer]`, 5.9 `[visual]` (screens: coins E1.11 on tiles, notes E4.1 on the keypad, zł + gr tiles, scale kg on tiles, scale dag on the keypad, scale with a hint, scale with solution steps beside the keypad, money with solution steps beside tiles; 1440x900 and 1024x768). Earlier open: 1.5, 2.8, 3.5, 4.5 `[reviewer]`, 2.9 `[human]`.
- Browser proof of the hook's `art` is missing: `ArtImage.state()` reads `image.visible`, `image.texture.key`, `displayWidth/Height` and the stand-in box/label visibility; the e2e of phase 10 should assert, for a scale task, keys `tasks/measuring/balance-scale`, `tasks/icons/<item>`, one `tasks/measuring/<weight>` per weight, all `loaded: true`, and `art` empty after the picture is hidden (summary, next task without a drawing). A break that hides the image (e.g. skip `setVisible(true)` in `ArtImage.show`) must turn it red.
- Layout numbers (pan centres, item/weight sizes, coin diameters) were chosen by eye from the 512x384 scale image and the real coin sizes, not seen on a canvas: the visual gate (5.9) may need to tune `TASK_LAYOUT.scale` and `TASK_LAYOUT.money`. A small picture rectangle (keypad solution, 768x190) scales the scale image to about 0.49.
- DESIGN-GAP comments are in `src/data/layout.ts` (`money`, `scale`); the rows in `docs/design-gaps.md` (from 59) are written in phase 9.
- E4.1 banknotes 200/500 zł are loaded but no skill uses them (follow-up in phase 9, `Trigger: S-14c`).
- Phase 6/7 widgets are plain cases in `TaskPicture` (`jugs`, `thermometer`, `icons`); replace the empty cases and add the widgets to the `widgets` map. Phase 6 also needs the `tall` shape in the scene (already in `pictureLayout`) and the task space of E5.5 `capacity_half_l_e5` (see the phase 4 handoff, now in git history: only 5 tasks, the most frequent about 20 %).
- `ARTIFACT GAP: none`.

## 6. Autonomous decisions

1. `ArtImage` is one image, so widgets own a fixed pool created in the constructor (money 10, scale 8); fixed creation order gives the draw order. Rejected: creating images per render (leaks game objects, and unused pool members would break the `art()` length check of plan-review F6).
2. `art()` is derived from the objects' real state (visible image with the loaded texture, or the visible stand-in), not from the last `show` call; `TaskPicture.art()` returns `[]` unless the drawing widget reports `shown()`. Would change: nothing; this is the S-13 F1 lesson.
3. Layout functions are pure in `src/ui/widgets/artLayout.ts` with a unit test, so the geometry has proof without a browser; the scene-visible proof stays e2e/visual.
4. Weights above 3 go to a second row behind the first (higher, partly hidden), so same-row weights never touch but rows overlap; the test checks only same-row pairs. Would change: visual gate preferring a spaced pyramid.
5. E1.11 kept `childName` "Miesiące roku" (phase 8 owns `childName`); E4.1 text tiles use ids with złoty and grosze coins only (`ZL_GR`), money keypad skills use `ZL_100` (notes to 100 zł, plan-review F4).
6. e2e not run (Chromium cannot start); orchestrator note applied to row 4.4. The hook-art spec was not committed (no red break could be proven).
