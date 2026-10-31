# Handoff — `house-cross-section` (slice S-23)

Written by the visual-gate step of run 2026-10-31-house-cross-section. The gate found that the house shell covered every cell (empty house in the real game) and fixed it in `15a086f`; after the fix all eight row-5.6 items pass (`VISUAL: PASS`). The next agent must not tick the `(CI at ship)` rows 2.7 and 5.11 before the ship step reads the named CI/Deploy log lines, and must re-run e2e at the gate: the fix changed a depth token after the last full e2e run.

## 1. State

| | |
|---|---|
| branch | `feat/house-cross-section`, cut from `main` at `112f158` |
| commits | docs, p1 `158004b`, p2 `c470f94`, p3 `518f581`, p4 `b46f63f`, p5 `5d59882`, p6 `4112bd0`, epilogue `e18e4f5`, review fix `6431dde`, review docs `2bbf72f`, visual fix `15a086f`, + this `docs(house-cross-section): bramka wizualna` commit |
| pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` (unchanged) |
| `## Progress` rows remaining | 6 (`grep -c '^- \[ \]' plan.md`): 2.7 and 5.11 `[reviewer] (CI at ship)`, 5.7-5.10 `[human]` |
| working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/layout.ts` | `HOUSE_LAYOUT.depth`: shell 1 under cells 2 (pack README order) — commit `15a086f` |
| `src/ui/widgets/HouseView.ts` | class comment states the pack draw order — `15a086f` |
| `tests/layout.test.ts` | "draws the house shell under the cells …" pins the depth order — `15a086f` |
| `context/changes/house-cross-section/reviews/visual-review.md` | the gate report, ends with the VISUAL line |
| `context/changes/house-cross-section/screenshots/` | 24 game frames (`desktop-*`, `tablet-*`, 12 states) + `kit-house-with-dioramas.png`, `kit-house-empty.png` + `README.md` (route, frames, hook facts) |
| `context/changes/house-cross-section/plan.md` | Progress row 5.6 ticked with the gate note |
| `context/changes/house-cross-section/follow-ups/review-fixes.md` | item 20 extended: the stand-in roof renders as a sliver |
| `context/changes/house-cross-section/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK (after the fix, local specs moved out of the tree) |
| `npm test` | `Tests 4090 passed (4090)` = baseline 4057 + 33 (handoff of impl-review: +32; this step: +1 `tests/layout.test.ts` depth order) |
| deploy + ops shell tests, `sample` E1-E6 | OK, OK, exit 0 x6 |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `E2E_HOOK=1 npm run build -- --outDir dist-e2e` | OK, `e2e hook: present`; bundle contains `shell:1,cells:2` |
| break: depths swapped back (`shell: 2, cells: 1`) | `tests/layout.test.ts` 1 failed / 33 passed; restored. Meta-check: the depth tokens are the only thing ordering shell and cells in `HouseView.render`, so the test guards the actual fault |
| visual capture (throwaway Playwright spec, `--workers=1`, hook build on 4399) | 8 passed (3.9 min), 24 frames; first run on `2bbf72f` showed empty cells (WebGL and Canvas) |
| hand-checked stars | 40 − 5 − 7 − 9 = 19 (counter 19); 200 − 129 = 71 (counter 71) |
| full e2e suite | not run in this step (machine under load; the orchestrator runs it at the gate). Relevant specs `house-cross-section.spec.ts` and `canvas-renderer.spec.ts` read the cell texture (`housePixel`), not depth, so they are not expected to change |
| servers | 4399 preview and dev server stopped; `lsof -ti tcp:4399 -sTCP:LISTEN` empty |

## 4. Next command

`/10x-archive house-cross-section then ship`

## 5. Open

- `[human]` 5.7 roller blind as "sylwetki" and the kitchen shown closed (P5); 5.8 copy "Dom"/"Wróć do pokoju" and the corner button; 5.9 green salon board in a cream cell (gap 190, visible in frames 04); 5.10 real tablet offline.
- `[reviewer] (CI at ship)` 2.7: Deploy workflow, job `deploy`, step `Smoke check (deploy)` prints `ok +precache covers house pictures — 3 of 3 house pictures precached`. 5.11: workflow `CI`, job `check`, log lines `Tests +[0-9]+ passed` and `e2e hook: absent \(`.
- The e2e checks of the house (`housePixel` in `tests/e2e/house-cross-section.spec.ts`, `canvas-renderer.spec.ts`) read the cell texture, so they could not see the shell covering the cells; the depth is now guarded by `tests/layout.test.ts` only. A screen-pixel check would close it (not added: scope of a fix step).
- Follow-ups (`follow-ups/review-fixes.md`): 19 decode failure of a house picture logs nothing (`HouseScene.loadArt`), 20 stand-in shell numbers in `HouseView.standInShell` (roof a sliver), 21 no browser test for the "Dom" button under the celebration card (`RoomScene.redraw`).

## 6. Autonomous decisions

- Playwright fallback instead of Claude in Chrome: item (7) needs Chromium without WebGL and items (2)-(5), (8) need up to 13 purchases per width, which `tests/e2e/support/*` drives deterministically. Would change: a defect visible only in the maintainer's Chrome.
- Final frames from the rebuilt `dist-e2e/` under `vite preview` on 4399, not the dev server: the dev server kept serving the old layout after an in-place edit. Would change: nothing.
- Plan item (3) "partly furnished before its stage" read as "after the stage, partly furnished" (the stage is always first); the worn grade is shown in (2). Would change: the plan author meaning another state.
- The empty cells were fixed, not filed as a gap: the pack README states the order and the cell opacity. Would change: nothing.
- e2e suite not re-run here (load, and specs do not observe depth); left to the orchestrator's gate. Would change: the orchestrator asking the step to own it.
