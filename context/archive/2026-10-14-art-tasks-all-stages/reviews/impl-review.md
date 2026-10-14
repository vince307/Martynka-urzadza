<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Zadania z grafiką paczki A (monety, waga, dzbanki, termometr, ikony) i widżety S-13 w E1–E2, E5–E6

- **Plan**: context/changes/art-tasks-all-stages/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
- **Date**: 2026-10-14
- **Verdict**: APPROVED (after the fixes below)
- **Findings**: 0 critical, 6 warnings (5 fixed, 1 to a follow-up), 8 observations

Autonomous run `2026-10-13-s12-s14`: no human in the loop. Triage was decided in place (contract rule 1): every
cheap WARNING is fixed in `fix(art-tasks-all-stages): poprawki z przeglądu implementacji`, the rest goes to
`follow-ups/review-fixes.md` with a `Trigger:` line. Lessons file: `context/foundation/lessons.md` does not exist; the
S-13 impl-review lessons (F1: drawn widgets checked by their own visible state; F2: bounded e2e runtime) were applied
as review checks.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (drifts recorded: E3.11 `low 0`, hook seam in `TaskScene.snapshot`, two cuts) |
| Scope Discipline | PASS (extras `artLayout.ts`, `tests/artLayout.test.ts`, `tests/measures.test.ts` are harmless helpers) |
| Safety & Quality | PASS after fixes (F1, F2) |
| Architecture | PASS after fix F4 |
| Pattern Consistency | WARNING (O1 duplication in the five widgets, follow-up) |
| Success Criteria | PASS (every automated row re-run, see below) |

## Verification (observed in this step)

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | clean (before and after the fixes) |
| `npm test` before the fixes | 1847 passed, 101 files = baseline 1482 + 365 |
| `npm test` after the fixes | 1853 passed (1847 + 6: price test x4, art-type bounds, older-save load) |
| deploy and ops scripts | OK, OK |
| `npm run sample -- E1` … `E6` | `Naruszenia: 0` each, before and after |
| `npm run build` | green, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=…/playwright.config.ts` (agent, Chromium launched) | 46 passed (3.6m) before the fixes and 46 passed (3.5m) after them = baseline 42 + 4 (art-tasks) |
| `npm run art` second run | `git status --porcelain public/assets` empty: deterministic, 38 files, 442 240 B |
| `dist/sw.js` vs `TASK_ART` | 38 `assets/tasks/…webp` URLs, identical sorted list |
| `designs/` | branch adds 0 files under `designs/` (the 155 tracked ones predate `bb00d7f`) |
| `grep -rl e2eSkills dist/` | nothing |
| `git diff bb00d7f -- tests/fixtures src/core/save.ts` | empty; save format v1 |
| Deliberate break 1 | `MINUS` in `src/core/text/measure.ts` set to a hyphen → 4 red (`measure.test`, two `temperature.test` 1000-draw tests, `visual.test`); restored. Meta-check: expectations come from the kit (U+2212), and the generator tests catch it through the validator, not by comparing with the implementation |
| Deliberate break 2 | new price test run against the pre-fix `money.ts` (stash) → 4 red (`rogalik`/`poduszkę` out of range); with the fix green |
| Deliberate break 3 | new older-save test with E1 expected 99 → red `expected 11 to be 99`; restored |

## Findings

### F1 — Implausible prices in MONEY_CHANGE

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (content)
- **Location**: src/core/tasks/generators/money.ts `generateMoneyChange`; src/data/wordTemplates.ts `contexts`
- **Detail**: Teacher read of E1.11/E2.2/E4.1: the bought thing was picked independently of the price — "Kupił rogalik za 13 zł", "Kupiła poduszkę za 3 zł". Sensible context is a CLAUDE.md working rule.
- **Fix**: `Context.price` (believable range in grosze, covering 1 gr…100 zł) and the generator picks a thing whose range holds the price; test `the thing bought has a believable price` with its own oracle table.
- **Decision**: FIXED

### F2 — Validator range does not bound the art types

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/bounds.ts `boundOf` / `validationBounds`; tests/contentInvariants.test.ts
- **Detail**: MONEY `params.max` is in grosze, so whole-złoty answers were checked against 10000; CAPACITY (`maxLitres`) and TEMPERATURE (`low`/`high`) have no `max`, so they had no range check at all without being in `UNBOUNDED_TYPES` — a later phase silently weakened the phase-1 contract.
- **Fix**: new `screenBound(skill)` (money by answer unit, capacity = jugs per litre × `maxLitres`, temperature = widest of |low|, |high|, high − low) used by `validationBounds` and the content invariants. `boundOf` (tile sizing in `generateTask`) is unchanged, so runtime tiles do not move. All 28 art skills pass the tighter bound.
  - Strength: restores the bound in the child's units without touching runtime behaviour.
  - Tradeoff: two bound functions; `boundOf` remains the tile-range source.
  - Confidence: HIGH — full suite and samples green under the new bound.
  - Blind spot: a future type with non-screen params needs its own branch.
- **Decision**: FIXED

### F3 — Thermometer with tiles is about 3 px per degree

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality (readability)
- **Location**: src/core/round/pictureLayout.ts `pictureLayout`; src/core/tasks/visual.ts `visualShape`
- **Detail**: the tall layout applies only to keypad + solution. E3.11 `temperature_read_30` and E6.1 `temperature_negative` (tiles) put the 1:3 thermometer into the 294 px tiles rectangle (scale ≈ 0.19); ±2 °C distractors sit 6 px apart. Needs a screenshot before choosing a layout.
- **Fix**: follow-up (`Trigger: visual gate S-14 …`) — the next step is the visual gate, which screenshots exactly this state.
- **Decision**: DEFERRED to follow-up

### F4 — Limits and literals duplicated between core and widgets

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: src/ui/widgets/{MoneyTable,BalanceScale,Jugs,IconGroups}.ts `MAX_*`, src/core/tasks/visual.ts `validateVisual`; src/ui/widgets/Thermometer.ts `LABELS`, `'°C'`; src/ui/widgets/Jugs.ts `imageSize: 512`
- **Detail**: the pool sizes 10/6/10/30 were typed twice (a change on one side would silently drop items and make the drawn sum differ from the answer); widgets carried a unit string and a number.
- **Fix**: `ART_LIMITS` and `JUG_SOURCE_SIZE` in src/data/measures.ts used by both sides; `CELSIUS` in src/core/text/measure.ts (also used by `formatCelsius`); `LABELS` derived from `THERMOMETER`.
- **Decision**: FIXED

### F5 — e2e (c) comment overstated what it reads

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/art-tasks.spec.ts (file header)
- **Detail**: `targets.picture` is the rectangle given to the drawing (`TaskPicture.bounds`, gated by `shown()`), so its proportions prove the tall layout choice (break p10d), not the frame's pixels; the header said "the drawing's interior rectangle". The S-13 F1 lesson holds because `bounds()` is null unless the thermometer frame and face are visible (break p10b red).
- **Fix**: header rewritten to say exactly that.
- **Decision**: FIXED

### F6 — A learner saved before S-14 had no load test

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/curriculumStart.test.ts `floorToCalendar (loaded learner, S-11)`
- **Detail**: five new playable steps move calendar starts; no test decoded an existing v1 save against the new curriculum.
- **Fix**: test decodes the frozen `save-v1.json`, floors it for November and checks E1 11 / E2 10 / E3 6 by hand from rule D, every stage ≥ saved and ≥ calendar start, mastery and pending unlock unchanged.
- **Decision**: FIXED

### O1 — Five widgets repeat the same shell

- **Severity**: OBSERVATION
- **Dimension**: Pattern Consistency
- **Location**: src/ui/widgets/{MoneyTable,BalanceScale,Jugs,IconGroups,Thermometer}.ts; `ArtImage.show`, `artLayout` aspect fits
- **Detail**: `area`/`bounds`/`setVisible`/`shown`/`art` and the aspect fit are copied; every widget does use `ArtImage` (no direct `scene.add.image`), `art()` lists only shown images, `TaskPicture.hide` hides all five. Hidden widgets' own `bounds()` still return the layout rect (unread).
- **Decision**: follow-up (`ArtPool`/`fitRect`, `Trigger: S-14b or the next widget built on ArtImage`)

### O2 — E3.11 departs from the plan and ZADANIA (`low 0`)

- **Severity**: OBSERVATION
- **Dimension**: Plan Adherence
- **Location**: src/data/curriculum/E3.ts `E3.11.temperature_read_30`
- **Detail**: changed in p9 after the orchestrator's teacher read (negative distractors before negatives are taught); recorded in gap 64, a follow-up and `[human]` 9.7. Spec (d) therefore no longer covers a negative tile; E6.1 does in unit tests.
- **Decision**: ACCEPTED (maintainer to confirm in 9.7)

### O3 — Hook seam lives in `TaskScene.snapshot`, not `src/testing/e2eHook.ts`

- **Severity**: OBSERVATION
- **Dimension**: Plan Adherence
- **Location**: src/scenes/TaskScene.ts `snapshot`
- **Detail**: `art` is spread by the existing hook; still hook-build-only (build guard green, `dist/` checked).
- **Decision**: ACCEPTED

### O4 — Money text distractors above the skill's max

- **Severity**: OBSERVATION
- **Dimension**: Safety & Quality (content)
- **Location**: src/core/tasks/generators/money.ts `textChoices`, `swapUnits`
- **Detail**: E4.1 `money_count_zl_gr` (max 20 zł) shows the swapped "50 zł 5 gr". This is the plan's intended misconception distractor; all stay below 100 zł, the stage's number range, never negative, never duplicate.
- **Decision**: ACCEPTED

### O5 — Negative exception covers the whole type, no lower bound

- **Severity**: OBSERVATION
- **Location**: src/core/tasks/validate.ts `NEGATIVE_TYPES`; src/core/tasks/bounds.ts `validationBounds`
- **Decision**: follow-up (`Trigger: a second type in NEGATIVE_TYPES …`)

### O6 — Units in hint lines are spoken raw

- **Severity**: OBSERVATION
- **Location**: src/core/narration/spoken.ts `spokenText`; src/core/text/measure.ts `spokenCelsius`
- **Detail**: prompts use `speak` ("minus osiem stopni", "trzy złote") and are correct; hint lines with "°C"/"zł"/"gr" go through `spokenText`. The `speak` of `temperatureDiff` reads "termometr. tyle jest teraz" (colon to period, lower case) — harmless for speech.
- **Decision**: follow-up (`Trigger: S-16 or a narrator check on the tablet`)

### O7 — Content notes for the human text acceptance

- **Severity**: OBSERVATION
- **Location**: src/data/measures.ts `SCALE_ITEMS`; E2.8 `mass_convert`, E4.1/E5.5 `mass_half_kg*` prompts
- **Detail**: "filiżanka waży 50 dag", "kłębek 40 dag"; "Ile dekagramów brakuje do kilograma?" does not name the item (the picture does). E1.8 ruler distractor 0 for a 1 cm segment. Numeral agreement (złote/złotych, grosze, dekagramy, litry, stopnie incl. negatives), accusative after "Kupił(a)", gendered verbs, U+2212, "3 zł 40 gr", first hints without the result, childNames: all correct in the read.
- **Decision**: follow-up for SCALE_ITEMS (`Trigger: [human] 9.8`)

### O8 — e2e coverage gaps and runtime

- **Severity**: OBSERVATION
- **Location**: tests/e2e/art-tasks.spec.ts
- **Detail**: jugs, unframed COUNT and MONEY_CHANGE have no browser test (unit + visual gate cover them). Waits bounded: `expect.poll` on the snapshot, no sleeps; full suite 3.6 min (art-tasks ≈ 35 s by the orchestrator). Answer helpers already handled string tiles before `playable` admitted them (no new answer form).
- **Decision**: ACCEPTED

## Teacher read (`npm run sample -- <stage> --count 6`, every new or changed skill)

E1.2 `count_5`, E1.4 `count_7`, E1.8 `length_ruler_cm_10`, E1.10 `count_12`, E1.11 `clock_read_full`, `money_count_10`,
`money_change_10`, `mass_kg_10`; E2.1 `place_read_20`, E2.2 `money_count_20`, `money_change_20`, `capacity_litres`, E2.8
`money_count_gr`, `mass_dag_100`, `mass_convert`, `length_convert_m`, E2.9 `place_read_99`, E2.10 `data_most_10`,
`data_howmany_10`, `clock_later_1h`; E3.4 `mass_kg_10`, `mass_dag_100`, E3.9 `mult_groups_result`, `mult_groups_expr`, E3.11
`temperature_read_30`; E4.1 `money_count_100`, `money_count_zl_gr`, `money_change_100`, `mass_half_kg`, E4.7
`capacity_half_l`, `capacity_litres_half`, E4.8 `place_read_1000`; E5.4 `temperature_read_0_30`, E5.5
`capacity_quarter_l`, `mass_half_kg_e5`, E5.7 `length_ruler_mm`; E6.1 `temperature_negative`, `temperature_diff`, E6.5
`place_read_1000`. Defect found and fixed: F1. Earlier orchestrator fixes confirmed in the output (E3 temperatures
non-negative, "Dwa takie dzbanki to razem jeden litr.", "Ociepliło/Ochłodziło się o N stopni"). Notes: O7.

MERGE: CLEAR — 0 critical; 5 of 6 warnings fixed (prices, art-type bounds, shared limits, spec comment, older-save test), the thermometer-with-tiles readability goes to the visual gate as a follow-up; full local gate and e2e green.
