# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the `/10x-tdd` step for phase 4 (commit `ba4e0da`): generators CAPACITY, TEMPERATURE, COUNT and MULT_GROUPS with parsers, 74 new tests, not yet in the curriculum. Phase 5 (impl) is next; do not put the new types into `src/data/curriculum/` before the phase that plans them, and check the task spaces listed in §5 first.

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | `46aff1d` (p1), `d4f4470` + `ab0dc05` (p2), `b6a947d` (p3), `ba4e0da` (p4), this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; the implement epilogue is for the last phase) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (open: 1.5, 2.8 reviewer; 2.9 human; 3.5 reviewer; 4.4 e2e part, 4.5 reviewer; later phases) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/generators/capacity.ts` | `parseCapacityParams`, `generateCapacity`; params `{jugs, variant: toLitres\|howMany, maxLitres}`; rows enumerated (1 l alone, ½ l in pairs, ¼ l in fours, at most 10 jugs, whole litres 1..max) and picked uniformly |
| `src/core/tasks/generators/temperature.ts` | `parseTemperatureParams`, `generateTemperature`; params `{variant: read\|diff, low, high, step >= 2, answer: number\|text}`; text answer has 4 tiles (opposite sign always among them); `diff` never uses 0 |
| `src/core/tasks/generators/count.ts` | `parseCountParams`, `generateCount`; `{min, max <= 20, tens}`; always 3 tiles (n and neighbours within 1..max); `framed: false` |
| `src/core/tasks/generators/multGroups.ts` | `parseMultGroupsParams`, `generateMultGroups`; `{variant: result\|expr, groups, size, max <= 30}`; icons only from `PLATE_ICONS`; `expr` tiles: one sum (unless it equals the product) and wrong products, never the swapped factors |
| `src/core/tasks/registry.ts` | the four types in `generators` and `parsers` |
| `src/data/pl.ts` | `pl.tasks.capacity*`, `temperature*`, `count*`, `multGroups*` strings |
| `src/data/nouns.ts` | + `litr`, `dzbanek`, `stopień`, `talerzyk` |
| `src/data/measures.ts` | + `PLATE_ICONS` (apple, pear, croissant) |
| `tests/capacity.test.ts`, `temperature.test.ts`, `count.test.ts`, `multGroups.test.ts` | 1000-draw oracles read from the drawing, parser rejections, task-space thresholds of the planned skills |
| `context/changes/art-tasks-all-stages/plan.md` | rows 3.4 (e2e part from the orchestrator note), 4.1-4.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` (observed) |
| RED (stubs returning an empty task) | 70 of 74 failed on assertions, first: `E2.2.capacity_litres seed=1 draw=0 prompt="": expected [ { …(3) } ] to deeply equal []` (validator on an empty task), also `expected 1 to be greater than or equal to 12` (task space) |
| `npm test` | 1649 passed (branch baseline 1575, +74) (observed) |
| `npm run lint`, `npm run typecheck` | clean (observed) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK (observed) |
| `npm run sample -- E1` … `E6` | exit 0 each; output unchanged (types not in the curriculum yet) |
| `npm run build` | green, `e2e hook: absent (2 chunks checked)` |
| Deliberate breaks | TEMPERATURE tile with a hyphen minus -> 4 red (answer no longer among the tiles); CAPACITY half-litre jugs one at a time (odd) -> 5 red; MULT_GROUPS offering the swapped `k · g` -> 2 red (`expected '2 · 3' not to be '2 · 3'`); COUNT 4 tiles -> 3 red (`expected [ 12, 9, 10, 11 ] to have a length of 3`). All restored, 74 green. Meta-check: oracles sum the drawing (jug ml, thermometer value, icon groups), none compares the answer with itself; the hyphen break goes red through the choices check and the dedicated `^(−)?\d+ °C$` regex test |
| e2e | not runnable in this session — orchestrator gate (Chromium `MachPortRendezvousServer ... Permission denied`, one plain try on `seed.spec.ts`). Expected `42 passed + 0`; row 4.4 e2e part left unticked. Nothing browser-visible changed |
| Teacher read | no curriculum entry yet, so `npm run sample` cannot show them; 6 draws per variant read with a scratch script (capacity toLitres 1 l / mixed / with quarters, howMany ½ and ¼, temperature read text / number, diff, count 1-5 and 11-12, mult groups result / expr). Agreement checked: 1 litr, 2-4 litry, 5+ litrów, 1 dzbanek..., 2 stopnie, 6 stopni, genitive plural of the icon nouns (kredek, kłębków, lamp), "po 2 jabłka / po 5 gruszek", "minus dwanaście stopni" in `speak`, U+2212 in tiles and hints, "To razem 4 dzbanki." Hints: first hint has no digits, no result in the first hint |

## 4. Next command

`/10x-implement art-tasks-all-stages phase 5` (phase 5, Driver: impl)

## 5. Open

- Row 4.4: e2e part by the orchestrator (`npx playwright test` expects 42 passed); row 4.5 `[reviewer]` (teacher read of `pl.tasks.capacity*`, `temperature*`, `count*`, `multGroups*` and 6 draws per variant; `npm run sample` shows them after phases 6-8); 3.5 `[reviewer]`; `[reviewer]` 1.5, 2.8; `[human]` 2.9.
- Task spaces for the data phases (measured in the `task space of the planned skills` blocks): E2.2 `capacity_litres` and E4.7 `capacity_litres_half` have exactly 10 tasks each (`SMALL_SPACES` `minDistinct: 10`, top share about 10-12 %). **E5.5 `capacity_half_l_e5` (`howMany`, ½ l, `maxLitres 5`) has only 5 tasks, the most frequent about 20 % (> 15 % limit)**: it cannot go into the data as planned; raise `maxLitres` (10 repeats E4.7) or cut it (plan phase 8 already names it first in the cutting order). `capacity_quarter_l` (all three jugs, 4 l) is fine.
- `parseCapacityParams` rejects `howMany` with a 1 l jug and `toLitres` params that cannot reach `maxLitres` in 10 jugs; E4.7 `capacity_litres_half` answers go up to 20 (jugs), the drawing shows one jug.
- Phase 6/7 widgets: `jugs` rows are ordered 1 l, ½ l, ¼ l; `icons` for MULT_GROUPS has `framed: true` with equal groups (plates are drawn in code, DESIGN-GAP), COUNT is `framed: false` with `[n]` or `[10, n-10]`; temperature drawings use only multiples of `step >= 2`.
- Hint wording to look at in the teacher read: "2 + 2 = 4" for 2 l + 2 l from half-litre pairs has no label of what the numbers are.
- `ARTIFACT GAP: none`.

## 6. Autonomous decisions

1. Pure tdd; `pl.ts` strings, the four dictionary nouns and `PLATE_ICONS` written inline with the green step (data, not testable logic). Stubs were registered first so the RED was an assertion.
2. TEMPERATURE read number prompt is "Ile stopni pokazuje termometr?" (plan: one prompt "Jaką temperaturę…"); the text-tile prompt keeps the plan wording. Rejected: one prompt for both (a number keypad answer needs the unit implied). Would change: reviewer preferring one wording.
3. TEMPERATURE across zero uses the hint "Przejdź przez zero: policz osobno do zera i od zera." plus `|a| + |b| = d` instead of "Poniżej zera liczymy w dół." (kept for readings below zero only); `diff` excludes 0 for both readings (avoids "10 − 0 = 10"). Would change: teacher read.
4. Text temperature tiles: 4 (balance default), opposite sign always one of them. COUNT: 3 tiles as ZADANIA says (the plan break names 4).
5. MULT_GROUPS icons restricted to `PLATE_ICONS` (apple, pear, croissant): "lamps on plates" would be nonsense in the teacher read. Prompt: "Na 3 talerzykach leży po 4 jabłka. Ile jabłek jest razem?" (locative plural needs no agreement). `expr` hints end with "Pasuje 3 · 4." so the text answer appears in the last hint.
6. CAPACITY howMany last hint is "To razem N dzbanków." (nominative); "Potrzeba N dzbanków" would need the genitive. Rows in `toLitres` are chosen uniformly among all valid compositions, not by kind first.
7. COUNT parser caps `max` at 20 icons (the drawing limit is 30); MULT_GROUPS groups 2..8, size 2..10, `max <= 30`.
8. e2e not run (Chromium cannot start); nothing in this phase changes browser behaviour (generators are not in the curriculum). Orchestrator note applied: row 3.4 e2e part ticked.
