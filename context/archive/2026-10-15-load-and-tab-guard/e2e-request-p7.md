# E2E request, phase 7 (load-and-tab-guard)

Chromium cannot launch in the agent session (MachPortRendezvousServer ... Permission denied, 3 plain tries). Nothing is committed.
Uncommitted files: `tests/e2e/load-and-tab-guard.spec.ts` (3 tests), `playwright.config.ts` (`load-and-tab-guard` added to ROUND_SPEC),
`tests/e2e/support/hook.ts` (`blockedBy` type gains `'newer'`), patches in `context/changes/load-and-tab-guard/e2e/`.
Verified without a browser: `npx tsc --noEmit` clean, `npx eslint` on the spec, hook.ts and config clean, every patch passes `git apply --check`.

## Green run (outside the sandbox)

1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts load-and-tab-guard` : expected 3 passed (chromium-hook project).
2. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4` : expected 104 passed (101 + 3).

Tests: (a) "#15 A-1/A-2 many hanging pictures ... slow line first", (b) "#15 A-1 a file that answers after the cut does not start the game twice",
(c) "#2 P-5 a newer save written by another tab is not overwritten".
Unverified assumptions to check on the first run: the cut list contains `FONT_KEY` and a key with `salon`; `alertdialog` is the error card role;
the held font `route.continue()` makes `document.fonts` report the face `loaded` (if the family name differs from FONT_KEY, adjust (b)'s wait).

## Breaks (each: `git apply <patch>`, run the test with `-g`, expect red, then `git apply -R <patch>`)

| Patch | Command (-g) | Expected |
|---|---|---|
| e2e-break-p7a.patch (`cutLoad` returns `[]`) | `-g "many hanging pictures"` | red: welcome never comes (`screenIs welcome` times out; the loading stays) |
| e2e-break-p7b.patch (no no-op `onProcessComplete`) | `-g "answers after the cut"` | GREEN expected (plan-review F2: late font does not throw, `once` blocks a second create). Meta-check: p7b is not proof; (b) green with the patch confirms the late font is harmless. Red = the analysis is wrong, stop |
| e2e-break-p7c.patch (no `loading.slow()` call) | `-g "many hanging pictures"` | red on `loading.phase` expected `'slow'` |
| e2e-break-p7d.patch (seam write unguarded, store never newer) | `-g "newer save"` | red on `save.blockedBy` expected `'newer'` (poll times out) |

Note on p7c: the patch removes the widget call and the `this.phase = .slow.` line, so the phase stays `loading`.
Meta-checks: p7a/(a): SW blocked and per-file limit off (`stallall`), so only the total limit ends the load; p7d: the seam shares `storedVersionNewer` with idb.ts, the real transaction is proven by the phase 5 fake-indexeddb test.
After the run: kill 4397/4398 servers; commit spec + config + hook.ts as `test(load-and-tab-guard): ... (p7)` then tick rows 7.1-7.6 and the epilogue.
