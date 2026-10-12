# Handoff — `task-round-stars` (slice S-04)

Written by `/10x-implement task-round-stars phase 5` of autonomous run 2026-10-12-s04-s08. Phases 1 (9f57306), 2 (d77b9c8), 3 (7d99976), 4 (6593472) and 5 (4471d8c) are committed; phases 6–11 are untouched. Phase 5 added the offline font, layout/text tokens, `TaskScene` with `ProgressDots` (input still inactive).

## 1. State

| | |
|---|---|
| Branch | `feat/task-round-stars`, cut from `main` at `58244a5` |
| Commits on branch | 5 docs + p1..p4 + p5 `4471d8c` + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; becomes `implemented` after phase 11) |
| `## Progress` rows remaining | 37 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `public/fonts/AtkinsonHyperlegibleNext.ttf`, `OFL.txt` | Copies from the art pack; precached via `ttf` in `vite/config.shared.mjs` globPatterns |
| `src/data/layout.ts` | + palette `tile/correct/hint/dotDone`, `FONT_SIZES` prompt/answer/key/expression/hint, `FONT_FAMILY/KEY/URL`, `SCENE_KEYS`, `TASK_LAYOUT` (notebook, dots, prompt, expression, tiles, keypad, bar), `TASK_TOUCH_TARGETS`, `ANIMATION` |
| `src/data/pl.ts` | + `pl.round` (calculate, correct, correctStar, next, tryAgain, nextStep, gotIt, deleteKey, okKey, stars, bonus, resultLine); bonus and resultLine marked DESIGN-GAP in a comment |
| `src/scenes/BootScene.ts`, `TaskScene.ts` | Boot loads the font and starts Task; Task builds a round (`balance.defaultStage`, seed = time), draws notebook, dots, prompt (bare calculation: "Oblicz" + 112 px expression), build id in the corner. `drawTask()` is a one-shot draw: phase 6+ must make it redraw per state |
| `src/ui/widgets/ProgressDots.ts` | `update(dots)` |
| `src/core/round/prompt.ts` | `isExpression(prompt)` |
| `tests/layout.test.ts` | New, 6 tests |
| `plan.md` | Progress rows 5.1-5.4 ticked with 4471d8c |

## 3. Verification

| Command | Result |
|---|---|
| `tests/layout.test.ts` | 6 passed (no RED phase: impl phase) |
| Deliberate break 1 | `ttf` removed from globPatterns: `grep -c AtkinsonHyperlegibleNext dist/sw.js` 1 -> 0. Restored. Meta-check: the font file stays in `dist/`, the grep reads the precache list in `sw.js`, so it proves the manifest |
| Deliberate break 2 | tile height 136 -> 90: 2 of 6 red in `layout.test.ts`. Restored |
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | Tests 579 passed (branch baseline 573, +6); deploy tests OK; `sample` E1-E6 `Naruszenia: 0` |
| `npm run build` | exit 0; `grep -c AtkinsonHyperlegibleNext dist/sw.js` = 1 |
| `npx playwright test` | 1 passed (baseline 1, +0), seed #8 offline OK with the font |
| Quick look | dev server on 4399 at 1440x900: Atkinson font, dots, "Oblicz" + expression render; server killed. Formal [visual] row 5.6 left for the visual gate |

## 4. Next command

`/10x-implement task-round-stars phase 6`

## 5. Open

- Manual rows 1.5, 2.5, 5.5 `[reviewer]` and 5.6 `[visual]` are NOT ticked. I read `pl.round` as a teacher: short, no harsh wording.
- Known gap (plan Known risks): single-line hints and HALF get no first hint, only "Spróbuj jeszcze raz" (human row 10.6).
- Placeholder notebook interior is ivory like the page (kit has a blurred room behind); revisit in the visual gate if it reads flat.
- Phase 6+ notes: the scene maps `bar.kind` and `bar.line === null` to `pl` strings; `inputActive` gates taps; "Dalej" maps to `next` (done/correct bar), `nextSolutionStep` (solution bar); `balance.keypad.maxDigits` goes to `keypadInput`. Geometry for tiles/keypad/bar is already in `TASK_LAYOUT`.
- Carried items: human rows 8.5, 10.5-10.8, `[visual]` rows 5.6, 6.4, 7.4, 8.4, DESIGN-GAPs and follow-ups written in Phase 10.

## 6. Autonomous decisions

1. **Bare calculation detection in `core/round/prompt.ts`** (regex of digits, operators, `□`), tested in `layout.test.ts`; scenes carry no logic. Would change: a Task field marking expressions.
2. **Build id moved from Boot to TaskScene** (Boot draws nothing now); `data-build` stays in `main.ts`, so seed #8 is unaffected.
3. **Palette `tile/correct/hint/dotDone`** use the plan's values (`#E3F0D9`, `#E5F2D4`, `#FFF0B9`, `#A6CF7F`), not the kit's research hex `#d7ebc1`. Would change: visual gate preferring the kit hex.
4. Skill prompts (exec mode, commit message, next phase) decided in place; stopped after phase 5.
