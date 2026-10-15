# E2E request, phase 6 (save-v2-backup-health)

Chromium does not launch in the agent session (3 plain tries, `MachPortRendezvousServer ... Permission denied`). The spec is finished and typechecked/linted, NOT committed.

Uncommitted files: `tests/e2e/save-backup-health.spec.ts` (new, 5 tests), `tests/e2e/support/hook.ts` (type `save` extended), `playwright.config.ts` (`save-backup-health` added to ROUND_SPEC), this file, `e2e-break-p6{a..e}.patch`, plan.md row 5.5 ticked (orchestrator note: 77 passed on 087d9de).

## Green run (outside the sandbox)
1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 tests/e2e/save-backup-health.spec.ts` -> expect `5 passed`.
2. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4` -> expect `82 passed` (77 + 5).
Tests (use `-g` with the quoted fragment):
- a `SV2-01 a v1 save whose copy always fails`
- b `SV2-02 a write that never answers`
- c `SRR-02 a slow read can be waited for`
- d `SRR-02 a read that never answers`
- e `SRR-02 continuing while the slow read is still answering`

## Breaks (production code only). For each: `git apply <patch>`, run the command, expect red, then `git apply -R <patch>`.
Command: `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=1 tests/e2e/save-backup-health.spec.ts -g "<fragment>"`
- p6a (`src/core/autosave.ts`: the copy never gives up, `backupAttempts` ignored). Test a: red at `expect.poll(... writtenVersion).toBe(2)` (stays null: no `write` ever). Others green.
- p6b (`replace` writes without `limited(...)`). Test b: red at `expect(dialog.getByText(pl.saveTransfer.resetFailed)).toBeVisible()` (the write hangs, the dialog stays disabled).
- p6c (`saveFailedCard.ts`: no wait button). Tests c and d: red at `card.getByRole('button', { name: 'Poczekaj dłużej' }).tap()` (element not found).
- p6d (`saveResetDialog.ts`: Escape without the `busy` guard). Test b: red at `expect(dialog).toBeVisible()` right after `keyboard.press('Escape')` (dialog closed).
- p6e (`main.ts`: "Graj dalej" on a timed-out read resolves a `fresh` outcome, i.e. the saver is not blocked). Test e: red at `toMatchObject({ load: 'unavailable', blocked: true, blockedBy: 'unavailable' })` (load is `fresh`). Test d is red too (same `onContinue`), a side effect.

## Deviation from the plan (p6e)
The plan says "late `waitLonger` result accepted without the `settled` flag". In `start` that is a no-op: the card's promise is already resolved by "Graj dalej", so `resolve(late)` changes nothing observable. The break therefore targets the rule behind F2 (the saver stays blocked after playing on a timed-out read). Edit the plan row 6.6 wording if you agree.

## Verified without a browser
`npx tsc --noEmit` and ESLint on the spec, hook.ts and config clean; all five patches pass `git apply --check` on the clean tree; selectors and strings are taken from `src/data/pl.ts` per dialog state (reset: `pl.saveTransfer.resetButton` on the panel, `resetConfirm` in the dialog, `close` after a failure); spec relies on assumptions to check on the first run: (a) three failed copies come within one to three rounds; (b) the busy window (>= 300 ms, the shortened write limit) is long enough for the Escape press; (e) a round pays fewer than 7 stars, so `counterText < 7` tells a late-adopted read from the fresh session; `startAsChild` taps `ages[0]` (E1, no warm-up).

## After a green run
Tick rows 6.1-6.7 in plan.md, set change.md status `implemented`, commit spec + hook.ts + config as `test(save-v2-backup-health): ... (p6)` (patches and this file may be dropped or committed), write handoff p6.
