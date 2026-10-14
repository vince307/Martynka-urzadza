# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the impl-review step: the full-plan review is done (`reviews/impl-review.md`, `MERGE: CLEAR`), 5 warnings fixed in one fix commit, change `impl_reviewed`. Next is the visual gate; it must screenshot the thermometer with tiles (E3.11, E6.1), where the review found about 3 px per degree (follow-up F3), and decide from the picture.

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | p1 `46aff1d` … p10 `79da1a7`, handoff commits, then this step: `fix(art-tasks-all-stages): poprawki z przeglądu implementacji` + `docs(art-tasks-all-stages): przegląd implementacji` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows open | 10 (`grep -c '^- \[ \]' plan.md`): `[visual]` 5.9, 6.7, 7.7, 8.8, 9.6; `[human]` 2.9, 8.9, 9.7, 9.8, 9.9 |
| Working tree | clean after the two commits |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/art-tasks-all-stages/reviews/impl-review.md` | review report: 0 CRIT, 6 WARN (F1, F2, F4, F5, F6 fixed; F3 follow-up), 8 OBS, teacher read, `MERGE: CLEAR` |
| `src/data/wordTemplates.ts` (`Context.price`, `contexts`), `src/core/tasks/generators/money.ts` (`generateMoneyChange`) | F1: the thing bought has a believable price |
| `src/core/tasks/bounds.ts` (`screenBound`, `validationBounds`), `tests/contentInvariants.test.ts`, `tests/validate.test.ts` | F2: range check in the child's units for MONEY_*, CAPACITY, TEMPERATURE |
| `src/data/measures.ts` (`ART_LIMITS`, `JUG_SOURCE_SIZE`), `src/core/tasks/visual.ts` (`validateVisual`), `src/core/text/measure.ts` (`CELSIUS`), `src/ui/widgets/{MoneyTable,BalanceScale,Jugs,IconGroups,Thermometer}.ts` | F4: one source for pool sizes, the jug image size, the degree unit and the label count |
| `tests/e2e/art-tasks.spec.ts` (header comment) | F5: says what `targets.picture` proves |
| `tests/curriculumStart.test.ts` (`loads a learner saved before S-14`) | F6: frozen v1 save loads and is only floored up |
| `tests/money.test.ts` (`the thing bought has a believable price`) | F1 test, own oracle table |
| `context/changes/art-tasks-all-stages/follow-ups/review-fixes.md` | 7 new follow-ups with `Trigger:` |
| `context/changes/art-tasks-all-stages/plan.md`, `change.md` | `[reviewer]` rows 1.5, 2.8, 3.5, 4.5, 5.7, 5.8, 6.6, 7.6, 8.7, 9.5 ticked; status `impl_reviewed` |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` |
| `npm run lint`, `npm run typecheck` | clean, before and after the fixes |
| `npm test` | before: 1847 passed (baseline 1482 + 365); after: 1853 (1482 + 371; +6 from this step) |
| deploy / ops scripts | OK, OK |
| `npm run sample -- E1` … `E6` | `Naruszenia: 0` each, before and after |
| `npm run build` | green, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts` | before the fixes: 46 passed (3.6m) = baseline 42 + 4; after the fixes (fix commit `79e92ee`): 46 passed (3.5m) = baseline 42 + 4 |
| `npm run art` again | `public/assets` unchanged (deterministic, 38 files, 442 240 B) |
| `dist/sw.js` vs `TASK_ART` | the same 38 URLs |
| `grep -rl e2eSkills dist/` | nothing |
| `tests/fixtures/`, `src/core/save.ts` | unchanged since `bb00d7f` (format v1) |
| Break: `MINUS` in `measure.ts` as a hyphen | 4 red (`measure`, 2 × `temperature` 1000-draw, `visual`); restored. Meta: oracle is the kit's U+2212, caught through the validator too |
| Break: new price test vs pre-fix `money.ts` | 4 red; fixed code green. Meta: oracle typed in the test, not read from `wordTemplates` |
| Break: older-save test expecting E1 99 | red `expected 11 to be 99`; restored |

Servers: Playwright starts and stops 4397/4398 itself; `lsof -ti tcp:4397|4398 -sTCP:LISTEN` empty after each run.

## 4. Next command

visual gate (S-14: money table, balance scale, jugs, thermometer incl. beside-keypad solution, icon groups, negative °C (E6), zł+gr tiles, hint/solution beside a picture)

## 5. Open

- `[visual]` 5.9, 6.7, 7.7, 8.8, 9.6 — the visual gate; include the thermometer with tiles (E3.11 `temperature_read_30`, E6.1 `temperature_negative`) for follow-up F3 (`src/core/round/pictureLayout.ts` `pictureLayout`).
- `[human]` 2.9 WebP/loose files/`tasks/measuring/`; 8.9 narrowed scope; 9.7 departures from ZADANIA (incl. E3.11 `low 0`); 9.8 text acceptance (incl. `SCALE_ITEMS` masses, O7); 9.9 tablet sharpness.
- Follow-ups: `follow-ups/review-fixes.md` (earlier ones plus 7 from the review: thermometer with tiles, `ArtPool`/`fitRect`, hidden widgets' `bounds()`, `allowNegative` lower bound, spoken units in hints, `BootScene.preload` `loaderror`, `SCALE_ITEMS` masses).
- Design gaps 59-66 in `docs/design-gaps.md` (none added here).
- `ARTIFACT GAP: none`.

## 6. Autonomous decisions

1. Triage without asking (contract rule 1): every cheap WARNING fixed (F1, F2, F4, F5, F6); F3 (layout of a tall picture with tiles) deferred to the visual gate, because the right layout depends on the screenshot. Would change: the visual gate finding the thermometer readable (close F3) or unreadable (a `tall` tiles layout in a new phase).
2. F2 fixed with a separate `screenBound` for validation only; `boundOf` keeps sizing number tiles in `generateTask`, so nothing changes for the child at runtime. Rejected: changing `boundOf` (would move tile ranges). Would change: a type whose tile range should follow the screen bound.
3. O4 accepted: the swapped "50 zł 5 gr" tile exceeds the skill's 20 zł but is the plan's intended misconception distractor and stays below 100 zł (the stage range). Would change: the maintainer's text acceptance (9.8) rejecting it.
4. F1 price ranges are my teacher-read judgement (grosze, in `contexts`); they cover 1 gr…100 zł, so the fallback never fires. Would change: 9.8 text acceptance.
5. Ran e2e myself (Chromium launched in this session) instead of the request-file protocol.
