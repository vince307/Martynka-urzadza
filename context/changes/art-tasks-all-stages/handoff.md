# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the `/10x-tdd` step for phase 1 (commit `46aff1d`): the art model, measure texts, negative exception, text-answer leak rule and the "beside" layout are in `core`; no skill uses them yet (`sample` E1–E6 output byte-identical to main). Phase 2 is next; do not forget that the e2e part of row 1.4 is still open for the orchestrator.

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | 5 docs commits before this step, then `46aff1d` (phase 1 code) and this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; the implement epilogue is for the last phase) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (phase 1: 1.4 e2e part and `[reviewer]` 1.5 open) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/measures.ts` | NEW: money/weight/jug/icon ids and values from the kit manifest, `SCALE_ITEMS`, `THERMOMETER`, `JUG_VISIBLE_RECT` |
| `src/data/nouns.ts` | + lampa, czajniczek, klucz, kłębek (icon nouns) |
| `src/core/tasks/visual.ts` | 5 new `TaskVisual` kinds, exhaustive `validateVisual`, `describeVisual`, `visualKey`, `VisualShape`, `visualShape` |
| `src/core/text/measure.ts` | NEW: `formatMoney`, `formatCelsius`, `spokenMoney`, `spokenCelsius` |
| `src/core/tasks/validate.ts`, `bounds.ts` | `allowNegative`, `NEGATIVE_TYPES = {TEMPERATURE}`, `validationBounds(skill)`; all `validateTask` call sites for programme skills use it |
| `src/core/round/hints.ts` | signed `lastNumber`; `leaksAnswer` judges every wordlike text answer as a whole token (`containsToken`) |
| `src/core/geometry.ts` | NEW: shared `Rect`, `insideRect`, `interiorPoint` (re-exported by `dragLayout`, `pictureLayout` as `PictureRect`, `ui/widgets/geometry`) |
| `src/core/round/pictureLayout.ts`, `src/data/layout.ts` | `shape` parameter, `PictureSpec.keypadBeside`, `TASK_LAYOUT.picture.keypadBeside`; `TaskScene` passes `visualShape` at both calls |
| `src/ui/widgets/TaskPicture.ts` | tolerates the new kinds (no widget yet; `bounds()` null) until phases 5-7 |
| tests | `measures`, `measure` (new); `visual`, `validate`, `hints`, `pictureLayout`, `contentInvariants` extended; `helpers`, `curriculum`, `warmup`, `generateTask`, `scripts/sample.ts` use `validationBounds` |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` (observed) |
| RED (before implementation, stubs returning ''/[]/'wide') | `AssertionError: expected '' to be '5 zł'` (measure.test), `expected [] to not deeply equal []` (visual.test), 14 failed (observed) |
| `npm test` | 1510 passed (baseline 1482, +28) (observed) |
| `npm run lint`, `npm run typecheck` | clean (observed) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK (observed) |
| `npm run sample -- E1` … `E6` | exit 0 each; output `cmp`-identical to main (stash run) (observed); `git diff --stat tests/fixtures` empty |
| `npm run build` | green, `e2e hook: absent (2 chunks checked)` (observed) |
| Deliberate breaks | thermometer range rule removed -> `visual.test` "keeps the thermometer to whole degrees" red; `formatMoney` drops grosze at whole złoty -> `measure.test` red; `leaksAnswer` back to clock-time regex -> `hints.test` "every text answer stated as a whole token" red; `pictureLayout` ignoring `tall` -> `pictureLayout.test` "puts a tall drawing beside" red; each restored from a copy, suite green after. Meta-check: expectations are literals from the kit manifest/research, not read from the implementation |
| e2e | not runnable in this session — orchestrator gate (Chromium: `MachPortRendezvousServer ... Permission denied` with the plain `npx playwright test --config=...` command; expected e2e = baseline 42 + 0) |

## 4. Next command

`/10x-implement art-tasks-all-stages phase 2` (phase 2, Driver: impl)

## 5. Open

- Row 1.4: e2e part left for the orchestrator (`npx playwright test`, expect 42 passed).
- `[reviewer]` 1.5. All earlier `[human]` rows and risks from the plan review stand (see plan `## Known risks`).
- `ARTIFACT GAP: none`.

## 6. Autonomous decisions

1. Mixed phase: all of phase 1 was TDD'd; the only inline scaffolding is `TaskPicture` tolerating unknown kinds and the `TASK_LAYOUT.picture.keypadBeside` numbers (data from the plan), the phase keeps `Driver: tdd`.
2. Text-answer invariant widened from CLOCK to every text answer except COMPARE_NUM, EVEN_ODD, NUMBER_WORDS, ROMAN (`ANSWER_LINE_TYPES` in `contentInvariants.test.ts`): their last hint teaches the method and `solutionSteps` appends the answer line, so stating it is not required. Rejected: changing those generators (out of scope, sample output must stay identical). Would change: a teacher read wanting the answer in those hints.
3. `leaksAnswer` leak test for text answers: any answer containing a letter or digit, whole token (unicode letter/digit boundaries); a bare sign such as "<" is never judged (existing behaviour).
4. `spokenMoney(0)` is "zero złotych"; `formatMoney(0)` is "0 zł"; fractional or negative amounts throw `RangeError`.
5. `describeVisual` for jugs run-length encodes ("1 × 1 l, 1 × ½ l"). Would change: a teacher-read preference.
6. Four icon nouns added to the dictionary (lampa, czajniczek, klucz, kłębek) in phase 1 so `ICONS` can point at dictionary keys; the kit labels "Ołówek"/"Ciasteczko" are not used (dictionary wins: kredka).
