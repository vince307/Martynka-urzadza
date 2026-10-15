# E2E request — phase 5 (salon-load-health)

Chromium cannot start in the agent session (MachPortRendezvousServer ... Permission denied, 3 plain tries). Nothing is committed.
Uncommitted in the tree: `tests/e2e/salon-load-health.spec.ts` (new, 3 tests), `tests/e2e/support/hook.ts` (type `save.migrationWrittenAt`),
`playwright.config.ts` (`salon-load-health` in `ROUND_SPEC`). Verified without a browser: `tsc --noEmit` and eslint clean on these files; patches apply.

## Green run
1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 salon-load-health` → expected 3 passed.
2. Full: `npx playwright test --config=... --workers=4` → expected 101 passed (98 + 3).

If a test is red for a reason other than the break (e.g. the "Zapis gry" locator `section.parent-save` after `passWelcome` with `e2eSave=legacy-salon`, or
`roomArtHealth.total > missing` in (c)), fix the spec, not the app.

## Breaks (each: `git apply <patch>`, run, expect red, `git checkout <file>`)
| Patch | Command | Expected red |
|---|---|---|
| `e2e/e2e-break-p5a.patch` (autosave.ts: no start write at `migrated`) | `... salon-load-health` | test (a) red: `writtenVersion` stays null (poll timeout). Test (b) MAY stay green (v1 fixture room repair calls `markDirty`, plan-review F4); only (a) is the proof |
| `e2e/e2e-break-p5b.patch` (save.ts: `MIGRATIONS[2]` only sets version 3) | `... salon-load-health -g "old list"` | (a) red or, if the start write still passes, the room recount is not asserted in this spec (it is in "salon-art #2"); run `salon-art` too: its "#2 a salon saved under the old task list" must go red on `tasksDone` 4 |
| `e2e/e2e-break-p5c.patch` (main.ts: no `loader` key) | `... salon-load-health -g "never answers"` | (c) red: after `passWelcome` the `roomArtHealth.missing` poll never reaches 1 (no limit, the file hangs) or the welcome never shows within the test timeout |

Note on p5b: plan text expects (a) red on `tasksDone`/`chosen`; the spec follows plan-review F3 (welcome asserts only the write log, room recount left to
`salon-art.spec.ts`), so p5b is expected red in `salon-art.spec.ts` "#2 a salon saved under the old task list". If it stays green in both, delete the claim and report.
Meta-check for p5c: the route really hangs the file (SW blocked); with the limit present the same test is green.

## After green
Commit `test(salon-load-health): stary salon zapisany jako v3 przy starcie i zawieszony plik — e2e (p5)` (spec, hook.ts, playwright.config.ts, plan rows 5.1-5.5, handoff),
then the epilogue: `change.md` status `implemented`. Kill servers on 4397/4398.
