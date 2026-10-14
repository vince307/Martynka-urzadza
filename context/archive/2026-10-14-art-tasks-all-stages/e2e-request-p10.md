# e2e request — phase 10 (`art-tasks-all-stages`)

Chromium cannot start in the agent session (`MachPortRendezvousServer ... Permission denied`, 3 plain tries). Nothing is committed for phase 10.
Uncommitted, ready for the orchestrator: `tests/e2e/art-tasks.spec.ts` (new, 4 tests, serial), `playwright.config.ts` (`art-tasks` in `ROUND_SPEC`), plan row 9.1 ticked from the orchestrator note. The hook needed no change: `Snapshot.art` already exists (TaskScene.snapshot, read from the widgets' own objects) and `support/hook.ts` already types it. The four patches touch production code only.

## Green runs (outside the sandbox)
1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts art-tasks` -> `4 passed` (target < 60 s).
2. `npx playwright test --config=...` -> `46 passed` (42 + 4). Record the time of the full suite.
Verified without a browser: `npx tsc --noEmit` and ESLint on the spec and config are clean. Field names read from `src/core/tasks/visual.ts` (money.items, scale.weights, thermometer, icons).

## Breaks (`git apply`, run the spec, expect red, `git apply -R`)
| Patch | Break | Expected red |
|---|---|---|
| `e2e-break-p10a.patch` | `taskArt` builds the `money` url under `coins/` | (a) money: `art` entries have `loaded: false` (stand-in box), `every(loaded)` fails. Unit `taskArt` test also red |
| `e2e-break-p10b.patch` | `Thermometer.render` leaves the face (column, ticks) hidden | (c) thermometer: `artLoaded` poll on `art.length >= 1` times out (`shown()` is false, `art` is `[]`) |
| `e2e-break-p10c.patch` | `MoneyTable` lays out only the first item | (a) money: `art` length 1, expected `items.length` (>= 2 for this skill) |
| `e2e-break-p10d.patch` | `TaskScene` always passes shape `wide` | (c) thermometer: in the solution `picture.height > picture.width` fails (768 x 190 rectangle) |

Row 6.3 (TaskScene tall layout beside the keypad) is covered by test (c) and break p10d (= row 10.5); tick 6.3 with 10.5.
Seam note: `artLoaded` reads `loaded` from `ArtImage.state()`, which looks at the visible Phaser image, not at the request; the test (d) round also covers E3.11 (0..30) and both MULT_GROUPS variants.

## Update (re-dispatch)

Orchestrator run found test (c) RED at art-tasks.spec.ts:91 (`phaseIs 'done'`, got 'solution'): after the second wrong answer the round is in the solution phase and the spec retyped without walking the steps. Fixed: the thermometer test now loops tapping `targets(page).step` while phase is 'solution' (waiting for `solutionStep` to advance), then `phaseIs 'retype'`, then `answerRight`, then 'done' with outcome 'retype' (same pattern as task-round.spec.ts). Picture-proportion assertions stay during 'solution'. Test (d) answers right on the first try, no solution phase, so no similar assumption. Added `tapScene` import. tsc and eslint on the spec pass. Chromium still cannot launch in the subagent sandbox (MachPortRendezvous Permission denied), so nothing was committed. Re-run: `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts art-tasks` expects 4 passed; breaks p10a-d unchanged.

## Orchestrator results (2026-10-14, on 8bee547 + the uncommitted spec, after the re-dispatch fix)

- First run (before the fix): (c) RED at spec:91 `phaseIs('done')` received 'solution' (retype without walking the solution steps) — fixed by the re-dispatch.
- `art-tasks`: 4 passed (35.2s).
- p10a (money url under coins/): RED (a) — `expect(art.every(loaded)).toBe(true)` received false (spec:26 via :39). Reverted.
- p10b (thermometer face hidden): RED (c) — art poll `>= 1` received 0 (spec:24 via :73). Reverted.
- p10c (MoneyTable lays out only the first item): RED (a) — art poll `>= 4` received 1 (spec:24 via :39). Reverted.
- p10d (TaskScene always passes shape wide): RED (c) — `expect(picture.height).toBeGreaterThan(picture.width)` 190 vs 768 (spec:87). Reverted.
- Full suite: 46 passed (42 + 4), 3.2m.
