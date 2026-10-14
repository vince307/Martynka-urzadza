# e2e request, phase 6 (save-reason-and-recovery)

Chromium cannot start in the agent session (MachPortRendezvous ... Permission denied, 3 plain tries). The spec is finished and NOT committed:
`tests/e2e/save-transfer-blocked.spec.ts` (+5 tests) and `tests/e2e/save-restart.spec.ts` (extended assertions in C-1 and M-S4, count unchanged).
Verified without a browser: `npx tsc --noEmit` and `npx eslint` on both specs clean; all three patches pass `git apply --check`.

## Green run (outside the sandbox, ports 4397/4398 free first)
1. `npx playwright test tests/e2e/save-transfer-blocked.spec.ts tests/e2e/save-restart.spec.ts` -> all green (save-transfer-blocked: 7 tests, 2 old + 5 new; save-restart: unchanged count).
2. `npx playwright test` -> 52 baseline + 5 = 57 passed. (The plan said +4; the SIR-04 pair - warning present on `unavailable`, absent on a healthy save - is two tests, so +5.)

## Breaks (each: `git apply <patch>`, run, expect red, then `git apply -R <patch>`; kill servers on 4397/4398 between runs)
- p6a `e2e-break-p6a.patch` (replaceGate lets `future` through):
  `npx playwright test tests/e2e/save-transfer-blocked.spec.ts -g "SIR-01 a save from a newer version"`
  Expect red: import dialog `getByRole('button', {name: 'Zastąp mimo to'})` toHaveCount(0) fails (received 1).
- p6b `e2e-break-p6b.patch` (reset calls `saver.replace(state)` without force):
  `npx playwright test tests/e2e/save-transfer-blocked.spec.ts -g "SIR-02 a save the browser never gives"`
  Expect red: the card `alertdialog` "Gra nie może teraz zapisywać postępów" never reappears (the write is refused, no reload; dialog shows resetFailed).
- p6c `e2e-break-p6c.patch` (`openExport` without `warning`):
  `npx playwright test tests/e2e/save-transfer-blocked.spec.ts -g "SIR-04 a copy from the panel says"`
  Expect red: `getByText(exportNotDevice)` toBeVisible fails. (The "healthy save" test stays green by design.)
Meta-check: the other tests in the file must stay green under each break except the named one (a also may redden the hang test? no: timeout is never forceable).

## After green
Commit by path: the two specs, plan.md, change.md, handoff.md as `test(save-reason-and-recovery): Przyczyny odczytu w przeglądarce — e2e (#2) (p6)`; tick 6.1-6.5; set change.md status `implemented`; epilogue commit.
