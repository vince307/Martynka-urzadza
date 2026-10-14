# E2E request, phase 9 (#2 import/reset with an unread save), art-stand-in-and-load-signal

Chromium cannot launch in the agent session (MachPortRendezvous Permission denied, 3 plain tries). Nothing is committed.
Uncommitted in the tree: `tests/e2e/save-transfer-blocked.spec.ts` (2 tests, chromium-hook), `playwright.config.ts` (`save-transfer-blocked` added to `ROUND_SPEC`; required, the
old `save-transfer` alternative does not match `save-transfer-blocked.spec.ts`). Verified without a browser: `tsc --noEmit` and ESLint clean; both patches pass `git apply --check`.
The spec does not use serial mode; its two tests are independent. The hook installs only after "Graj dalej", so the tests use page.goto + the card, never openWelcome.

## Green runs (outside the agent sandbox, ports 4397/4398 free)
1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts save-transfer-blocked` : expect 2 passed.
2. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts` : expect 52 passed (50 + 2).
3. `npm run build` prints `e2e hook: absent (`.

## Breaks (apply, run command 1 with ports free, expect red, then `git apply -R`; production code only)
| Patch | Change | Tests that must turn red |
|---|---|---|
| `e2e-break-p9a.patch` | `UIScene.openImport/openReset` pass `deviceSaveView(null, …)` (ignore `blockedBy`) | BOTH: (a) `unavailable` on `deviceUnavailable` text (the dialog shows step one / "Teraz" instead); (b) `unreadable` on `deviceUnreadable` text / `stars(0)` count 0 expectation. Run each alone with `-g "unavailable save cannot"` and `-g "unreadable save warns"` |
| `e2e-break-p9b.patch` | reset dialog always appends the confirm button; `replace` refuses only `fatal` | (a) only: `resetDialog.getByRole('button', {name: 'Zacznij od nowa'})` `toHaveCount(0)` fails. (b) must stay green (it expects the confirm button). The `replace` half has no e2e red: the test never taps the confirm (a tap would reload and mask the check); that half is covered by the unit tests of `replace`. If you want it e2e-visible, the break is still valid for the dialog half |
Meta-check: p9a proves the seam (UIScene -> saver status -> dialog), not the copy; a copy edit in `pl.ts` changes spec and UI together and stays green.

## Commit and epilogue the orchestrator must do
1. After green + breaks: commit `tests/e2e/save-transfer-blocked.spec.ts`, `playwright.config.ts` as `test(art-stand-in-and-load-signal): Import i reset przy nieodczytanym zapisie — e2e #2 (p9)` (the two request/patch files may be committed with it or left out).
2. Tick plan rows 9.1-9.4 with the sha; baseline 50 -> 52 e2e, unit 1899 unchanged.
3. Epilogue (last phase): `change.md` status `implemented`, `updated: 2026-10-14`; commit plan.md + change.md as `chore(art-stand-in-and-load-signal): close out plan (epilogue)`.
4. Handoff §4 Next command: `/10x-impl-review art-stand-in-and-load-signal`; §5 keep the open [reviewer]/[visual]/[human] rows.
