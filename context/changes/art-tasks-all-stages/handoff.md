# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the `/10x-tdd` step for phase 3 (commit `b6a947d`): generators MONEY_COUNT, MONEY_CHANGE and MASS with parsers, 60 new tests, not yet in the curriculum. Phase 2 closed first (commit `ab0dc05`, seed change). Phase 4 is next; do not add the new types to `src/data/curriculum/` before phases 5 and 8.

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | `46aff1d` (p1), `d4f4470` (p2 code), `ab0dc05` (p2 seed), `b6a947d` (p3), this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; the implement epilogue is for the last phase) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (open: 1.5, 2.8 reviewer; 2.9 human; 3.4 e2e part, 3.5 reviewer; later phases) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/seed.spec.ts` | (`ab0dc05`) seed asserts no `requestfailed` and every `TASK_ART` url served by the service worker |
| `src/core/tasks/generators/money.ts` | `parseMoneyCountParams`, `parseMoneyChangeParams`, `generateMoneyCount`, `generateMoneyChange`; params `{variant, ids, max (grosze), maxItems 2..10, answer: number-zl\|number-gr\|text}` |
| `src/core/tasks/generators/mass.ts` | `parseMassParams`, `generateMass`; params `{variant: read\|half\|convert, unit: kg\|dag, weights, max}` |
| `src/core/tasks/registry.ts` | `MONEY_COUNT`, `MONEY_CHANGE`, `MASS` in `generators` and `parsers` |
| `src/data/pl.ts` | `pl.tasks.money*` and `pl.tasks.mass*` strings |
| `src/data/measures.ts` | `SCALE_ITEMS` masses extended (book 300-800 and 1000, cushion 600-900 and up, apple/pear/yarn/teapot/lamp) so `convert` has answers 10..90 |
| `tests/money.test.ts`, `tests/mass.test.ts` | 1000-draw oracles from the drawing, parser rejections, task-space thresholds of the planned skills |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` (observed) |
| Phase 2 closing | orchestrator e2e on `ab0dc05`: seed 1 passed; break (`note-500zl.webp` out of the precache) RED on `expect(failed…).toEqual([])` received `["/assets/tasks/money/note-500zl.webp" ×3]` (`seed.spec.ts:45`); full suite 42 passed. Rows 2.5-2.7 ticked |
| RED (before the generators) | stubs returned an empty task; first assertions: `expected undefined to be 'money'` (money), `expected undefined to be 'scale'` (mass), `expected '' to be 'Ile złotych leży na stole?'` |
| `npm test` | 1575 passed (branch baseline 1515, +60) (observed) |
| `npm run lint`, `npm run typecheck` | clean (observed) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK (observed) |
| `npm run sample -- E1` … `E6` | exit 0 each; output unchanged (the types are not in the curriculum yet) |
| `npm run build` | green, `e2e hook: absent (2 chunks checked)` |
| Deliberate breaks | CHANGE price up to the whole amount -> `expected 700 to be less than 700` (4 tests); parser accepting an unknown nominal -> `expected function to throw an error, but it didn't` (2); MASS weights of another option -> `expected 1 to be 2` (5). All restored, 60 green. Meta-check: the oracles sum the `visual` (coins, weights) and check the mass against `SCALE_ITEMS`, they do not compare the answer with itself |
| e2e | not runnable in this session — orchestrator gate (`MachPortRendezvousServer ... Permission denied`, 2 plain tries, all specs "did not run"). Expected `42 passed + 0`; row 3.4 e2e part left unticked |
| Teacher read | no curriculum entry yet, so `npm run sample` cannot show these types; read 6 draws per variant with a scratch script (money count zł/gr/text, change zł/text, mass kg/dag/half/convert): agreement, gender of verbs, accusative of the purchase, spoken amounts, first hint without a result. Changes made from the read: weights at most 2 pieces above the fewest (no five 10 dag for 50 dag), full stop after "250 gr to 2 zł 50 gr" |

## 4. Next command

`/10x-tdd art-tasks-all-stages phase 4` (phase 4, Driver: tdd)

## 5. Open

- Row 3.4: e2e part by the orchestrator (`npx playwright test` expects 42 passed); row 3.5 `[reviewer]` (teacher read of `pl.tasks.money*`/`mass*` and 6 draws per variant, also `npm run sample` once phases 5 and 8 add data).
- `[reviewer]` 1.5, 2.8; `[human]` 2.9.
- Phase 5 must put planned skills only into steps already playable; E1.11 `mass_kg_10` etc. params are the ones measured in `tests/mass.test.ts` / `tests/money.test.ts` "task space of the planned skills" (change them there too).
- `ARTIFACT GAP: none`.

## 6. Autonomous decisions

1. Mixed phase handled as pure tdd; the strings in `pl.ts` and the `SCALE_ITEMS` table were written inline with the green step (data, not testable logic).
2. `variant` stays in the params (plan contract) but each type has its own parser that requires its own variant (`MONEY_COUNT` = `count`, `MONEY_CHANGE` = `change`). Rejected: dropping the field (contradicts the plan). Would change: phase 5 data writer finding it redundant.
3. MONEY_CHANGE states the amount in the prompt and the drawing shows the same amount (rejected: "she had what lies on the table", a two-step task too heavy for E1.11). Would change: teacher read wanting the count to be part of the task.
4. `maxItems` 2..10 and the picture always has at least 2 items (a single coin is a reading, not a sum). Text answers need a złoty and a grosz nominal and always draw a mixed sum (`3 zł 40 gr`), distractors: units swapped (`40 zł 3 gr`), a forgotten or doubled coin.
5. MASS: one unit per scale (kg weights read in kg, dag weights in dag, no "1 kg 20 dag"); `half`/`convert` only in dag. `SCALE_ITEMS` extended with believable masses; `speak` omitted (the prompt has no digits). No new nouns: the prompts use the 12 icon nouns, the abbreviations kg/dag/zł/gr, and "kilograma" without a numeral, so nothing needs agreement (plan listed `kilogram`, `dekagram`, `moneta` etc. for later phases).
6. Amount answers in grosze stay in grosze even at 100 ("100 gr", not "1 zł") so the last hint contains the answer.
7. e2e not run (Chromium cannot start in this session); nothing in this phase changes browser behaviour (generators are not in the curriculum).
