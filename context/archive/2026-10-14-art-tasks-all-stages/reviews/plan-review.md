<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Zadania z grafiką paczki A i widżety S-13 w E1–E2, E5–E6 (S-14 `art-tasks-all-stages`)

- **Plan**: context/changes/art-tasks-all-stages/plan.md
- **Mode**: Deep (codebase claims checked directly in this step, no sub-agent: the risky claims were few and file-local)
- **Date**: 2026-10-14
- **Verdict**: REVISE → SOUND after the in-place fixes below
- **Findings**: 0 critical, 5 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, F2, F3, F5 — fixed) |
| Plan Completeness | WARNING (F4, F6, F7 — fixed) |

## Grounding

Grounding: 38/38 kit files ✓ (`designs/martynka-maths-A-v1/assets/{money 15, measuring 11 + thermometer.png not bound, icons 12}`,
sizes 512²/768×512/1024×768/512×1536 match the plan's ½-resolution outputs), `cwebp` ✓ (`/usr/local/bin/cwebp` 1.1.0),
precache glob ✓ (`vite/config.shared.mjs` `globPatterns` has `webp`, 10 MiB limit), thermometer mapping ✓
(`reference/thermometer-face.js`: −30 → y1260, 16 px/°C), manifest values ✓ (`valueGrosze`, `grams`), symbols ✓
(`pictureLayout` 2 call sites in `TaskScene`, `PictureRect`, `dragLayout` `Rect`/`insideRect`/`interiorPoint`,
`ValidationContext {max, nouns}`, `NEGATIVE_NUMBER`, `lastNumber`/`leaksAnswer`, `forcedSkills`, seed counts only `response`),
`src/core/geometry.ts` absent (new, as planned) ✓, Progress 71 criteria = 71 rows ✓, brief↔plan ✓ (brief risk line added).
`docs/reference/contract-surfaces.md` and `context/foundation/lessons.md` absent (checks skipped).

## Triggered follow-ups (every open `Trigger:` naming this slice or a file it changes)

| Follow-up | Status |
|---|---|
| O2 picture beside the keypad (`Trigger: … S-14 adding more keypad pictures`) | Included for the thermometer (`keypadBeside`); chart, scale, money stay wide — decision 8, Known risk F8 |
| Three `Rect` types (`Trigger: next change to dragLayout or pictureLayout`) | Included (phase 1 § 5) |
| Number line hint, BONDS pairs / CHOOSE_OP picture, picture mode (`Trigger: S-14`) | Deferred to S-14b / S-14d with re-triggered follow-ups — justified (new answer modes, no art) |
| Hint highlight (`Trigger: S-14 or a teacher read`) | Deferred, trigger narrowed to „S-16 or a teacher read” — justified (text hints suffice for read-the-picture tasks) |
| Regrouping on the mat (`Trigger: S-14 or a child stuck on E4.8`) | Deferred, trigger kept „a child stuck on E4.8” — justified (no mat change in S-14) |
| `select`/`drag` picture area (`Trigger: first select or drag skill with a visual`) | Not triggered (MONEY_PAY deferred, no new select/drag) |
| e2e hook `nextRound`/`toRoom` null in the room (`Trigger: next change to src/testing/e2eHook.ts`) | Already done (`inRoom() ? null : …`) |
| `tests/hints.test.ts` skip counting (`Trigger: next change to tests/hints.test.ts`) | Already done (`skipped` counted, `expect(skipped).toBe(0)`) |
| `BootScene.create` hand-over outside the font promise (`Trigger: next change to BootScene`) | Already done (`time.delayedCall(0, …)`) |
| `playableSteps`/`firstPlayableSteps` one predicate (`Trigger: next change to pick.ts or curriculum.ts`) | Not triggered (plan changes curriculum data, not those files) |
| `adaptive.spec` near 180 s (`Trigger: … drag skills to E4`) | Not triggered (no new `drag`) |

## Product decisions checked (PRD FR-023, ZADANIA, plan § 10)

All kept, each named in a `[human]` row: WebP + loose files + `tasks/measuring/` vs plan § 10 PNG/atlas (2.9; measured 331 KB
vs ≈ 10 MB PNG — not wrong); S-14 narrowed vs roadmap literal (8.9; FR-023 makes the full set the end-of-M6 criterion, not
S-14's); MONEY_PAY deferred, MASS balanced only, negatives and zł + gr on tiles, temperatures 5/2 °C (9.7; the kit itself
claims no unbalanced scale, the keypad has no minus or comma). One product value overturned as clearly wrong: E4.1 money to
999 zł (F4).

## Findings

### F1 — Several planned skills cannot pass the content invariants, and MASS half/convert have a constant answer

- **Severity**: ⚠️ WARNING
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: Blind Spots
- **Location**: Phase 3 § 2 (MASS), Phase 4 § 1 (CAPACITY), Phase 6/8 data tables
- **Detail**: `tests/contentInvariants.test.ts` requires ≥ 12 distinct `prompt|visualKey|choices` per 1000 draws (`MIN_DISTINCT`)
  and the most frequent task ≤ 15 % (`MAX_TOP_SHARE`); `SMALL_SPACES` exempts only the distinct count. As planned: MASS `half`
  always answers 50 („Ile dekagramów to pół kilograma?”) and `convert` always 100 — one fact, not a skill, and only the few
  weight combinations vary; CAPACITY rows of one jug kind give ≤ 10 tasks (½ l to 5 l: 5 tasks at 20 % each → top share fails);
  `capacity_quarter_l {toLitres, 3}` needs 12 jugs while the parser caps rows at 10 (answers only 1 or 2);
  `E2.1.place_read_20` keypad measured in this review: 10 distinct, top 11 % (fails `MIN_DISTINCT`). Phases 3–4 (tdd) would
  stay green and the failure would surface only when data lands in phases 5–8, forcing a rework of a closed generator phase.
- **Fix (applied)**: phases 3–4 measure the invariant thresholds on the parameters of every skill planned for later phases
  (criteria 3.2/4.2); MASS `half` = „Ile dekagramów brakuje do pół kilograma?” (50 − m, m 10–40 dag), `convert` = „… do
  1 kilograma?” (100 − m); CAPACITY `jugs: JugId[]` mixes the step's kinds in one row (½ l in pairs, ¼ l in fours, ≤ 10 jugs),
  E4.7/E5.5 rows updated; `SMALL_SPACES` entries with measurement named for `E2.1.place_read_20`, `E2.2.capacity_litres`,
  `E4.7.capacity_litres_half`.
  - Strength: failure moves into the tdd phase where the generator is written; no global threshold is loosened.
  - Tradeoff: „ile brakuje” is a step harder than reading for E2.8.
  - Confidence: HIGH — thresholds read from the test file, place_read_20 measured.
  - Blind spot: exact distinct counts of the new generators are unknown until written.
- **Decision**: FIXED

### F2 — TEMPERATURE `min`/`max` params collide with `boundOf`; the difference skill draws 1 °C

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4 § 2 contract; Phase 6 table (E6.1)
- **Detail**: `src/core/tasks/bounds.ts` `boundOf` reads `params.max` as the bound of the answer and of every number in the
  texts; `temperature_diff {−20, 20}` answers up to 40 → `range` violation in every harness. Its step 1 also contradicts
  decision 6 (1 °C ticks unreadable; the picture shows `b`).
- **Fix (applied)**: params `low`/`high` (no `max`), `step ≥ 2` with a picture, `temperature_diff` step 2.
- **Decision**: FIXED

### F3 — `allowNegative` reaches only three of the six `validateTask` callers

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 1 § 4; Critical Implementation Details „Wyjątek ujemny”
- **Detail**: besides `scripts/sample.ts`, `contentInvariants`, `helpers`, every skill is validated in `tests/curriculum.test.ts`,
  `tests/generateTask.test.ts` and `tests/warmup.test.ts` (the E6 warm-up draws E6.1); a hint like „Wynik: −5 °C” matches
  `NEGATIVE_NUMBER` after „:” and would fail there.
- **Fix (applied)**: one `validationBounds(skill)` in `src/core/tasks/bounds.ts` (`max` + `allowNegative`), used by every caller (listed).
- **Decision**: FIXED

### F4 — E4.1 money sums to 999 zł in the step whose numbers end at 100

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Completeness
- **Location**: Phase 5 table, E4.1 `money_count_500 {…, 99900, …}`
- **Detail**: ZADANIA § 2 lists „banknoty do 500 zł” for E4, but E4.1 is „Dziesiątki do 100”; three-digit numbers start at E4.8.
  A keypad sum of 750 zł in E4.1 is beyond the step (the validator's `max` in grosze would not catch it).
- **Fix (applied)**: `money_count_100` (notes 10–100 zł + zł coins, ≤ 100 zł); 200/500 zł notes stay in `TASK_ART`/precache
  without a skill → Known risk + follow-up (`Trigger: S-14c or a money skill above 100 zł`).
  - Strength: keeps the step order the curriculum is built on.
  - Tradeoff: two converted notes unused for now (≈ 30 KB).
  - Confidence: HIGH — step titles in ZADANIA § 3.
  - Blind spot: none significant.
- **Decision**: FIXED

### F5 — The seed break removes every image, so it does not prove the per-image assertion

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 § 5, criterion 2.6
- **Detail**: `globPatterns` without `webp` turns the seed red even for an assertion that only checks „some image came from the
  worker”. The step prompt asks for proof that one missing image goes red.
- **Fix (applied)**: `e2e-break-p2.patch` = `globIgnores: ['**/tasks/money/note-500zl.webp']`; red on that one path. (The
  assertion itself is per path — `servedBySw` must contain every `TASK_ART` url, and offline the missing one surfaces as
  `requestfailed` — so it would go red; the patch now proves it.)
- **Decision**: FIXED

### F6 — Spec (d) can pass on an adaptive round; `art()` must not count pool objects

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 10 spec (d); Critical Implementation Details „Obraz z zapasem i hak”
- **Detail**: `forcedSkills` (`src/testing/e2eHook.ts`) returns null — an ordinary adaptive round — when any id is unplayable;
  (d) only played to the summary. `art()` returning pool entries would keep p10c's list length unchanged.
- **Fix (applied)**: (d) asserts `visual.kind` and `loaded` before each task; `art()` lists shown images only.
- **Decision**: FIXED

### F7 — Second `pictureLayout` call site in `TaskScene`

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 § 5
- **Detail**: the prompt-fitting `limit = pictureLayout(TASK_LAYOUT.picture, input, false)` also needs the shape (typecheck
  forces it; the plan named one call).
- **Fix (applied)**: both call sites named.
- **Decision**: FIXED

### F8 — Scale and money at 768×190 beside the keypad in the solution phase

- **Severity**: 💬 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Decision 8; Phase 5 visual rows
- **Detail**: the scale (4:3) gets ≈ 253×190 scene px with small weight labels; only the thermometer goes „beside”.
  Screenshots 5.9 cover it; the switch is one line in `visualShape`.
- **Fix (applied)**: Known risk with the trigger (unreadable weights on the screenshot → `scale` becomes `tall`).
- **Decision**: ACCEPTED (Known risks)

## Phase sizing and drivers

Ten phases, each green on its own: tdd 1, 3, 4 (pure core, no implementation exists — failing tests lead); impl 2, 5–9
(≤ 2 new UI components each: `ArtImage`; `MoneyTable` + `BalanceScale`; `Jugs` + `Thermometer`; `IconGroups`); e2e 10 after
the phase-9 seam sweep. The seed (#8) edit in phase 2 is the justified seed/offline exception (it proves that phase's
pipeline; request-file). Step order changes only in phase 8, which updates every pinned test (`curriculumStart`, `Pick`, `End`,
`progress`, `curriculum`, `warmup`, `first-launch`, `adaptive`) in the same phase. No new answer form → e2e helpers already
handle text tiles before `playable` admits them. S-13 lessons applied: F1 (hook `art` reads texture + visibility per image,
`shown()` per widget, thermometer needs frame and face), F2 (4 tests, < 60 s target, timings recorded). Break patches p10a–d
break rules (texture loaded, widget shown, every item drawn, `tall` layout), not labels.

VERDICT: PROCEED — five warnings fixed in plan.md (invariant thresholds measured in the tdd phases, constant-answer MASS variants replaced, TEMPERATURE bound, validator flag for every caller, E4.1 ≤ 100 zł, single-file seed break), no critical gap; product deviations carry [human] rows.
