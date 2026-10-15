# Handoff — `e1-shapes-picture-mode` (slice S-14d)

Written by `/10x-tdd` phase 1 of run `2026-10-15-fix-s14c-s14d`. Phase 1 (face codes, SHAPES, PATTERN, the §3a answer path) is committed and green; no curriculum data yet, so nothing is reachable in the game. Do not let Phase 2 forget the stand-ins left on purpose: `TaskPicture` throws for a `pattern` drawing until the row widget exists, and tiles still draw text, not faces.

## 1. State

| | |
|---|---|
| Branch | `feat/e1-shapes-picture-mode`, cut from `main` at `10d6fe7` |
| Commits | identity `f3aa504`, research `5cab986`, plan `2f42f2e`, plan review, phase 1 code `a230f1a`, then this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; the last phase sets `implemented`) |
| `## Progress` rows remaining | 59 (`grep -c '^- \[ \]' plan.md`); rows 1.1-1.4 ticked with `a230f1a`, 1.5 is `[reviewer]` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/faces.ts` | `Face`, `faceKey`, `parseFace`, `isFace`, `faceLabel(code, {size})`, `faceText` (code to words, other values unchanged) |
| `src/data/shapes.ts` | figures with gender and Polish forms (`fact`, `look`), colour and size ids with gender forms, `PATTERN_LIMITS`, `SHAPES_LIMITS` |
| `src/core/tasks/generators/shapes.ts`, `pattern.ts` | SHAPES (`name`, `odd`, `all`) and PATTERN (AB, ABB, AAB, ABC; figure, colour or both) generators with params parsers; registered in `registry.ts` |
| `src/core/tasks/visual.ts`, `validate.ts` | `pattern` drawing (key, validation, `describeVisual` in words); rule `faces-distinct` |
| `src/core/tasks/types.ts`, `round/select.ts`, `round/hints.ts`, `round/canonicalInput.ts`, `round.ts` | §3a: `TaskAnswer` with `string[]`; `selectionAnswer` returns `SelectValue[]`; `solutionSteps` result line in words; `roundResults` example in words (saved shape stays v2) |
| `src/ui/widgets/SelectTiles.ts`, `TaskPicture.ts` | `onSubmit` takes `SelectValue[]`; `TaskPicture` throws for `pattern` until Phase 2 |
| `src/data/pl.ts`, `src/data/nouns.ts` | `tasks.shapes*`, `tasks.pattern*`; nouns `prostokąt`, `bok`, `róg` |
| `tests/faces.test.ts`, `tests/shapesTiles.test.ts`, `tests/pattern.test.ts` (new); `tests/validate.test.ts`, `select.test.ts`, `hints.test.ts`, `round.test.ts` (extended) | note: `tests/shapes.test.ts` already exists (number shapes); the tile tests are in `shapesTiles.test.ts` |
| `context/changes/e1-shapes-picture-mode/plan.md`, `handoff.md` | rows 1.1-1.4 ticked; this file |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK |
| `npm test` | 2708 passed (baseline 2672, +36); `deploy/test-martynka-deploy.sh` and `deploy/ops/test-martynka-ops.sh` OK |
| `npm run sample -- E1` ... `E6` | `Naruszenia: 0` x6 (curriculum untouched, E1.1 still has no skills) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test ... --workers=4` | 86 passed (baseline 86, +0), run in this session |
| RED observed | first assertion failures before any production code (stubs only): `AssertionError: expected null to deeply equal { figure: 'triangle', …(2) }` (faces), `expected 'Wynik: shape:triangle:red:big' to be 'Wynik: duży czerwony trójkąt'` (hints), `expected [] to deeply equal [ 'shape:circle:red:big', …(1) ]` (select), `E1.1.pattern_AB seed=1 draw=0 prompt="": expected [ Array(1) ] to deeply equal []` (pattern) |
| Break 1: intruder differs in two features | `tests/shapesTiles.test.ts` red: `expected [ Array(2) ] to have a length of 1 but got 2`; restored |
| Break 2: pattern row without the empty place | `tests/pattern.test.ts` red (5 tests); restored |
| Break 3: `faces-distinct` off | `tests/validate.test.ts` red (`expected [ 'choices' ] to include 'faces-distinct'`); restored |
| Break 4: `selectionAnswer` drops strings | `tests/select.test.ts` red (`expected [] to deeply equal [ 'shape:circle:red:big', …(1) ]`); restored |
| Break 5: raw code in the result line | `tests/hints.test.ts` red (`expected 'Wynik: shape:triangle:red:big' to be …`); restored |
| Meta-check | the odd-one-out oracle in the test counts features from `parseFace` of the tiles, not from generator fields; the pattern oracle finds the smallest period of the shown faces; so the breaks hit the rule, not a label |
| Teacher read (`scratchpad` script, 6 draws per SHAPES variant, 3 per PATTERN period, tiles and result in words) | read: "Dotknij trójkąta/kwadratu/koła/prostokąta", "Dotknij wszystkich kół/trójkątów", hints teach before the result ("Trójkąt ma 3 boki i 3 rogi." / "Szukaj figury z 3 rogami." / "Wynik: …"); no code in any text; gender agreement of "duże czerwone koło" / "duża żółta gwiazdka" correct. Nothing to change |

## 4. Next command

`/10x-implement e1-shapes-picture-mode phase 2` (Phase 2, `Driver: impl`)

## 5. Open

- `[reviewer]` row 1.5 (teacher read) is done in my own words above; the reviewer confirms. `[human]` rows 9.6, 9.7 as before.
- Phase 2 must: replace the `TaskPicture` `pattern` throw with the row widget; draw faces on `AnswerTiles`/`SelectTiles` (colour ids to layout tokens in `layout.ts`, not in core); add curriculum skills for E1.1 (the SHAPES `all` skill needs `answer: 'select'`, `name`/`odd` `tiles`; params `variants` and `figures`, figures from `NAMED_FIGURE_IDS` (>= 3), PATTERN figures from `FIGURE_IDS` (>= 3)); update `ORACLE` E1 and `playableSteps`; move SHAPES and PATTERN from `LATER` to `GROUP_1` in `tests/curriculum.test.ts`.
- Colour choice for PATTERN uses only `size: 'big'`; the faces tile size therefore matters only for SHAPES.
- `taskKey` (`src/core/round/unique.ts`) still ignores tiles for SHAPES `name` (plan Known risk F4); a redraw, not a stuck round.
- A `select` task has no first-wrong example, so `roundResults` never shows a list of faces to the parent (the conversion is in place for when it does).
- `tests/shapes.test.ts` (number shapes) kept; the plan names `tests/shapes.test.ts` for the tile tests, the file is `tests/shapesTiles.test.ts`.
- Unpinned E1 specs will draw SHAPES `all` after Phase 2; safe only because `selectionAnswer` now hands faces on and the e2e `answerRight` picks tile values (plan 2.6).

## 6. Autonomous decisions

1. **`odd` majority tiles are distinct faces, not copies.** Chosen: three tiles agree in the odd feature and differ in exactly one other feature, the third feature is constant, so exactly one (tile, feature) pair is a 3+1 split. Rejected: three identical tiles (violates `faces-distinct`/the duplicate rule, and a select value must be unique). Would change: a design that lets `odd` tiles repeat (then the validator rule and `AnswerTiles` values need an index).
2. **`faces-distinct` means: every `shape:` choice parses and none repeats; faces mixed with plain text are flagged.** The generic duplicate rule fires too, so the test asserts the face rule by name. Would change: a task type that legitimately mixes a face tile with a text tile.
3. **Result line in words via `faceText`/`faceLabel` (full label with size)**; `faceLabel(code, {size: false})` exists for PATTERN hints where the size is constant. `roundResults` converts a face (and a list) to words so the saved v2 example never holds a code. Would change: a save v3 with a typed example.
4. **SHAPES params require 3 or more distinct NAMED figures (no star, heart); PATTERN 3 or more of all six.** Would change: curriculum data asking for 2-figure rows.
5. **Mixed phase inline part:** the stand-in throw in `TaskPicture` and the `SelectTiles.onSubmit` type change were scaffolding added inline (no test of their own); Phase 2 replaces them. Driver stays `tdd`.
6. **e2e run by this session** (Chromium started with the plain command): 86 passed.
7. **Test file name:** `tests/shapesTiles.test.ts` because `tests/shapes.test.ts` is the number-shapes test; I first overwrote it by mistake and restored it from git before committing.
