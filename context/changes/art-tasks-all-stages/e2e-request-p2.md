# E2E request, phase 2 (seed asserts every task drawing is served offline from the service worker)

Chromium could not start in the agent session (`MachPortRendezvousServer ... Permission denied`). Run outside the sandbox, on branch `feat/art-tasks-all-stages`.

## 1. Apply the seed assertion (not committed; the agent could not prove it)

    git apply context/changes/art-tasks-all-stages/e2e-seed-p2.patch

It adds a `requestfailed` collector (expected `[]`) and, after the offline reload, `expect.poll` until `servedBySw` contains `/` + `url` of every `TASK_ART` entry (38). If `requestfailed` catches an unrelated request, filter it to `/assets/` and `/_app/` instead of weakening the assertion.

## 2. Green run

    npx playwright test tests/e2e/seed.spec.ts        # expect 1 passed
    npx playwright test                               # expect 42 passed (baseline 42 + 0)

## 3. Deliberate break (one image dropped from the precache)

    git apply context/changes/art-tasks-all-stages/e2e-break-p2.patch    # globIgnores: note-500zl.webp only
    npx playwright test tests/e2e/seed.spec.ts        # expect red: the poll ends with ['assets/tasks/money/note-500zl.webp'] missing from servedBySw (or requestfailed lists it)
    git apply -R context/changes/art-tasks-all-stages/e2e-break-p2.patch

Meta-check: before this phase the same break leaves the seed green (no assertion on any image), so the red proves the new per-image assertion.

## 4. Commit the seed change if green and red/green were as above

    git add tests/e2e/seed.spec.ts && git commit -m "test(art-tasks-all-stages): seed sprawdza precache grafik zadań (p2)"

## Verified without a browser

`npm run build` writes 38 `assets/tasks/*.webp` entries into `dist/sw.js`; `git apply --check` passes for both patches.
