# Follow-ups — load-and-tab-guard

Findings of the observability audit 2026-10-15_2217 (PR #66) and of this change's research that this change does not fix. Each has a trigger.

- A-3 (the `loaderror` line has no URL, status or kind: timeout, http, network). Trigger: the next change to the `loaderror` listener in `BootScene.preload`, or a parent report of missing pictures.
- A-4 (a truncated WebP leaves only Phaser's own "Failed to process file" line, no URL). Trigger: the next change to `BootScene.preload`, or a report of a corrupt picture.
- A-5 ("Obrazki" counts only what is missing, not why: slow first start, files lost by a deploy, corruption). Trigger: a parent report that the section did not help, or the next change to `artHealthView.ts`.
- A-6 (the per-file limit is not scaled by file size; 289 KB fails below about 24 KB/s). Trigger: the [human] 2.5 measurement on a throttled Android start showing pictures missing on a working link.
- A-7 and `loaderror` for files from the queue (a font that fails to load ends as COMPLETE, so the app line is dead). Trigger: A-7 taken up, or a report of the fallback font.
- A-8 (a silent retry leaves no trace). Trigger: the next change to the loader retry settings.
- A-9 (e2e gaps: retry with the copied limit, a stalled task file on the `artFilter` path, the console line, the service worker path). Trigger: the next change to `tests/e2e/salon-load-health.spec.ts`.
- A-10 (a progress bar that cannot draw logs on every progress event). Trigger: the next change to `BootScene.preload` progress handler.
- A-11 (no load time and `totalFailed` in the art health record). Trigger: the next change to `artHealth.ts` or a report of a slow start.
- V-1 to V-8 (save v3 findings: the field behind `corrupt`, `step` and error name lost in `decodeSave`, import of a v2 file without "moved from v2", fixtures of v1 with the old salon, `saveFile` import tests on the legacy salon, a failed copy counted twice, the copy retried after it was given up, the migration line only in the session that wrote). Trigger: the next change to `autosave.ts` attempt, `save.ts` `decodeSave`, `saveFile.ts` `parseImport` or `saveHealth.ts`, or the v4 save format.
- P-1, P-2 (a failed first v3 write has no retry; the migration in progress is not shown to the parent). Trigger: the next change to `arm` in `src/core/autosave.ts`, or a parent report of lost progress.
- P-3 (the `Loader.Events.ADD` listener has no try/catch, so a Phaser shape change would show the fatal card). Trigger: any change of the `node_modules/phaser` version, or the next change to the listener.
- P-4 (a rollback below v3 has no guard; the smoke does not check `assets/**/*.webp` in the precache). Trigger: a human deploy/ change, or the first rollback across a save version.
- P-6 (a failed service worker registration is silent). Trigger: the next change to `src/pwa/registerServiceWorker.ts`.
- P-7 (the `future` card does not name the save version and the highest version the build reads). Trigger: the first deploy rollback across a save version, or the next change to the `future` branch of `saveFailedCard.ts`.
- P-8 (`backup-v2` is overwritten by a second migration). Trigger: a parent report of lost progress, or the v4 save format.
- A card for the child when a newer save blocks writing (`'newer'` is shown to the parent only). Trigger: a parent report of lost progress with two tabs or an old home-screen instance.
- The order of two cards of the same version (a `future` card against a `newer` block). Trigger: the same report, or v4.
- WebKit for the loader cut (`guardedPut` with `preventDefault` on a failing `get`, and the cut by loader paths, are verified in Chromium only). Trigger: a WebKit project in `playwright.config.ts`.
- Phaser upgrade (`src/scenes/loaderCut.ts` depends on Phaser 4.2.1 loader internals; `tests/phaserLoaderPin.test.ts` is the tripwire). Trigger: any change of the `node_modules/phaser` version.
- Closed in this change: the "font promise hand-over in `BootScene.create`" item, recorded as closed by the plan. Trigger: none (closed).
- impl-review F3: the slow-line timer in `BootScene.preload` asks `bootLoadPhase(limits.slowAfterMs, limits)` with the constant, not the elapsed time, so the rule only confirms the timer; the scene, not `src/core/bootLoad.ts`, effectively decides. Trigger: the next change to `BootScene.preload` timers, or S-16c restyling the loading screen.
