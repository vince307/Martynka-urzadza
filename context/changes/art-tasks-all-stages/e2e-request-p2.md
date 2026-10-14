# E2E request, phase 2 (seed asserts every task drawing is served offline from the service worker)

Chromium cannot start in the agent session (`MachPortRendezvousServer ... Permission denied`, 4 plain tries over two dispatches). Run outside the sandbox on branch `feat/art-tasks-all-stages`.

Cause of the earlier red (orchestrator run on 1eccc62): Phaser's loader makes `blob:` object URLs for each fetched image; the old seed pushed their `pathname` into `servedByNetwork`. The updated patch classifies by `response.url()` scheme first: `blob:`/`data:` are counted apart (`objectUrls`, must reach `TASK_ART.length`, i.e. the images were decoded), everything else keeps the original rule (`servedByNetwork` must stay `[]`). No other spec uses `fromServiceWorker`, `on('response')` or `requestfailed` (grep).

## 1. Apply the seed change (not committed)

    git apply context/changes/art-tasks-all-stages/e2e-seed-p2.patch

It adds: `requestfailed` collector (`/assets/` and `/_app/` paths must be `[]`), the blob/data split, `expect.poll` that every `TASK_ART` url (38) is in `servedBySw`, and `objectUrls >= 38`.

## 2. Green run

    npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts seed     # expect 1 passed
    npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts           # expect 42 passed

## 3. Deliberate break (one image dropped from the precache)

    git apply context/changes/art-tasks-all-stages/e2e-break-p2.patch
    npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts seed
    # expect red: the poll ends with ['assets/tasks/money/note-500zl.webp'] (missing from servedBySw), or servedByNetwork / failed lists /assets/tasks/money/note-500zl.webp
    git apply -R context/changes/art-tasks-all-stages/e2e-break-p2.patch

## 4. Commit if green and red/green were as above

    git add tests/e2e/seed.spec.ts && git commit -m "test(art-tasks-all-stages): seed sprawdza precache grafik zadań (p2)"

Then tick plan rows 2.5-2.7.

## Verified without a browser

Both patches `git apply --check` cleanly (seed patch, then break patch on top). `npm run build` has 38 `assets/tasks/*.webp` entries in `dist/sw.js`.
