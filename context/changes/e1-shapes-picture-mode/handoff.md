# Handoff — `e1-shapes-picture-mode` (slice S-14d)

Written by the visual-gate step of run `2026-10-15-fix-s14c-s14d`. Every [visual] row (2.8, 4.7, 8.7) is captured at 1440×900 and
1024×768 and ticked; three discrepancies were fixed in `c61099b` (COMPARE_QTY groups side by side, heart outline, unit wrap in solution
lines); `VISUAL: PASS`. The next agent must not reintroduce stacked groups for COMPARE_QTY: the tiles say left/right, so the drawing
carries `sides: true`.

## 1. State

| | |
|---|---|
| Branch | `feat/e1-shapes-picture-mode`, cut from `main` at `10d6fe7` |
| Commits | `f3aa504`..HEAD: phases 1-11, review fix `203b93c`, review docs `0727dfe`, visual fix `c61099b`, then this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` (unchanged; archive sets it) |
| Progress | 2 rows open (`grep -c '^- \[ \]' plan.md`): [human] 9.6, 9.7 |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/e1-shapes-picture-mode/reviews/visual-review.md` | visual review: V1-V3 fixed, states per plan row, hand checks, fit on the tablet, O1-O4; ends `VISUAL: PASS — …` |
| `context/changes/e1-shapes-picture-mode/screenshots/` | 84 frames (`desktop-*`, `tablet-*`) + `README.md` (route, states table) |
| `src/core/tasks/visual.ts` | `icons` drawing gains `sides?: true` (validation: two plain groups, no motion; key "sides"; `describeVisual` "3\|2") |
| `src/core/tasks/generators/compareQty.ts` (`generateCompareQty`) | sets `sides: true` |
| `src/ui/widgets/artLayout.ts` (`iconsLayout`) | `sides` parameter: groups on one line, each framed, first on the left |
| `src/ui/widgets/IconGroups.ts` (`render`), `src/ui/widgets/TaskPicture.ts` | pass `sides` |
| `src/ui/widgets/figurePoints.ts` (`heartPoints`), `src/ui/widgets/faceDraw.ts` (`drawShape` heart) | heart as one closed outline |
| `src/core/text/nowrap.ts` (`keepTogether`) | glues a number to its unit and an operator to the amount after it |
| `docs/design-gaps.md` | rows 100 (heart outline) and 102 (COMPARE_QTY left/right pair) extended |
| `tests/compareQty.test.ts`, `tests/visual.test.ts`, `tests/artLayout.test.ts`, `tests/figurePoints.test.ts`, `tests/nowrap.test.ts` | red-first tests for V1-V3 |
| `context/changes/e1-shapes-picture-mode/plan.md` | [visual] 2.8, 4.7, 8.7 ticked with frames and fix sha |
| `context/changes/e1-shapes-picture-mode/follow-ups/review-fixes.md` | section "From the visual gate": 4 follow-ups with triggers |

## 3. Verification

All observed in this step. Baseline main `10d6fe7`: unit 2672, e2e 86; branch before this step: unit 2834, e2e 93.

| Command | Result |
|---|---|
| Throwaway Playwright capture (`tests/e2e/visual.local/`, moved to `/private/tmp/claude-501/visual-s14d.local` before lint) against the hook build on 4399 | first run 26/28 states (unlock path needed the child route), then 28 passed (4.4 min) on the fixed build |
| Red-first tests | compareQty `expected undefined to be true`; visual/artLayout assertions red (`expected [] to have a length of 2`); figurePoints module missing; nowrap received plain spaces; all green after the fix |
| Deliberate break: heart curve → circle (`y = -16 cos t`) | `tests/figurePoints.test.ts` "dips between the two lobes" red (`expected 50 to be greater than 60`); restored, green. Meta-check: proves the points `drawShape` draws; frames `s11-*` prove the widget uses them |
| `npm run lint`, `npm run typecheck` | OK, OK |
| `npm test` | 2839 passed (branch 2834, +5; baseline 2672, +167) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh`, `sample` E1-E6 | OK, OK, `Naruszenia: 0` each |
| Teacher read `sample -- E1 --count 6` (E1.1 compare_qty) | prompts and hints unchanged; drawing `[icons yarn 4\|2]` matches "Z lewej strony: 4 kłębki" |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=<abs> --workers=4` | 93 passed (6.4 min; branch 93, +0; baseline 86, +7) |
| Ports 4397/4398/4399 | not listening afterwards |

## 4. Next command

`/10x-archive e1-shapes-picture-mode` then ship

## 5. Open

- Human checklist: [human] 9.6 (tablet with a 6-year-old: coin drag and tap-out, figure tiles, "Po lewej/Po prawej/Tyle samo"), [human] 9.7 (decisions against ZADANIA/roadmap, plus: wrong payment empties the wallet; CHOOSE_OP picture starts at 2; COMPARE_QTY groups in frames side by side).
- Follow-ups: `follow-ups/review-fixes.md` — review section (8) and "From the visual gate": stand-in labels ≈ 9–10 CSS px (`ArtImage`, `standInLabelFit`), check mark on a big figure (`SelectTiles`), 10 | 10 compare icons ≈ 22 CSS px (`iconsLayout` `sides`), tray coins smaller than wallet coins (`TASK_LAYOUT.coinPay`); the `CoinWallet.paint` lifted-cell item stays open (not captured).
- DESIGN-GAP: rows 100 and 102 extended (no new row).

## 6. Autonomous decisions

1. **Playwright only, no Claude in Chrome.** Chosen: the throwaway spec for every state. Rejected: Chrome for first-try frames. Why:
   every state but a first try needs canvas touches Chrome cannot drive (profile § 8), and one route keeps desktop/tablet frames
   comparable (as in the S-14c gate). Would change: a Chrome route that drives Phaser touch.
2. **COMPARE_QTY: `sides` flag rather than `framed: true`.** Rejected: reuse `framed` (validation requires equal groups, it means
   MULT_GROUPS plates, and its layout may still stack groups). Rejected: rename tiles to "Na górze/Na dole" (ZADANIA and the plan fix
   "Po lewej/Po prawej"). Why: the plan's tiles are left/right, so the picture must be. Would change: a kit frame for comparing groups.
3. **Unit wrap fixed in `keepTogether`, not by widening the strip.** Glue number+unit and operator+amount, allow a break only before an
   operator. Rejected: glue the whole sum (wider than the strip, Phaser would split inside a word). Would change: a wider solution strip.
4. **E1.1 unlock card judged on the first reachable card (E1.3).** E1.1 is the first step and never unlocked; the card is one layout
   for every `childName`. Would change: a product path that shows the E1.1 card.
5. **Small findings left as follow-ups (O1-O4)**, not fixed: none blocks answering; they need a tablet test or touch shared widgets
   (`ArtImage`) beyond this slice. Would change: [human] 9.6 showing children miss targets or cannot count.
