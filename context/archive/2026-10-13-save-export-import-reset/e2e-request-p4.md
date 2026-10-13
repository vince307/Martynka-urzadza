# E2E request, phase 4 (run by the orchestrator, outside the sandbox)

Run on the phase 4 commit:
1. `npx playwright test tests/e2e/save-restart.spec.ts` — expect all green (FR-021 now goes gate -> dialog "Kopia zapisu" -> "Zapisz plik" -> download -> line "Plik został pobrany na to urządzenie." -> "Zamknij"; the file has `"build"` and `"reason": "future"`; the card shows "Kod: future · Wersja …").
2. `npx playwright test` — expect 33 passed (baseline + 0).
3. Deliberate break: `git apply context/changes/save-export-import-reset/e2e-break-p4.patch` (src/main.ts downloads right after the gate, no dialog), run `npx playwright test tests/e2e/save-restart.spec.ts -g FR-021` — expect RED on `getByRole('dialog', { name: 'Kopia zapisu' })`; then `git checkout -- src/main.ts`. Unit tests stay green under this break (L-S2 is proven only by e2e).
