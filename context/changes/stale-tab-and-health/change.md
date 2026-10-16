---
change_id: stale-tab-and-health
title: Stale-tab save guard, UI art health, music status and service-worker install signal
status: impl_reviewed
created: 2026-10-16
updated: 2026-10-16
archived_at: null
---

## Notes

Non-roadmap fix, the only slice of autonomous run `2026-10-16-fix-stale-tab-health`. No roadmap status edits (no matching row in `context/foundation/roadmap.md`).

**Source:** observability audit 2026-10-16_0915 (PR #73, branch `docs/observability-audit-2026-10-15-fix-s16bcd`, file `context/audits/observability/2026-10-16_0915-start-dzwieki-grafika-salon.md`; not merged to `main`, this change never edits or merges that branch), findings **B-1, G-1, S-1, P-1** (all HIGH). Audit § 6 order: G-1 first (cheapest, widest), then S-1, then the stale-build signal (B-8, B-2) before B-1, then P-1 with the smoke work.

- **B-1** (`src/core/save.ts` `storedVersionNewer`, `src/storage/idb.ts` `guardedPut`): the write guard compares only the format number with a strict `>`; an old tab or home-screen instance writing the SAME format (v3, e.g. an S-16c build with a 7-task salon) or a second tab of the same build overwrites newer progress (purchases, stars, an import or reset made in the other tab) with no signal in any channel.
- **G-1** (`src/scenes/BootScene.ts` `create`, `src/data/uiArt.ts` `UI_ART`): there is no health record for `UI_ART` (loading background and emblem, wallet, notebook, salon thumbnail); a missing one gives the drawn fallback while "Obrazki" says all pictures loaded.
- **S-1** (`src/scenes/UIScene.ts` `openSettings`, `src/ui/dom/settingsPanel.ts` "Dźwięki"): the panel gets only `prefs` and the count of missing effects; music that did not load, failed to decode or waits for the audio unlock shows as "Muzyka: Włączone" with silence.
- **P-1** (`src/pwa/registerServiceWorker.ts`, `vite/config.shared.mjs`): a failed service-worker registration is swallowed by `.catch(() => undefined)` and a failed install (one precache entry 404 or quota) has no listener at all; offline play silently stops working.

**Constraints (audit § 6, project rules):** nothing leaves the device; parent text only in `src/data/pl.ts`; `src/core` without browser globals; scenes without player text or balance numbers; every new parent line is a `DESIGN-GAP` row in `docs/design-gaps.md` (next free number 116). A new `UI_ART` health record must NOT feed `src/core/round/artFilter.ts` (a missing wallet must not skip MONEY_PAY; final-art-p2 plan decision 8).

## Audit claims checked against the repo (main 9a64fd6, branch feat/stale-tab-and-health)

| Audit claim | Repo now | Correction |
|---|---|---|
| B-1: `storedVersionNewer` compares only `version`, strict `>`, equal versions pass | `src/core/save.ts` `storedVersionNewer` returns `stamp > version`; `src/storage/idb.ts` `guardedPut` reads and puts in one `readwrite` transaction and refuses only on that rule | none |
| B-1: an old tab of the same format overwrites; no channel shows it | `src/core/autosave.ts` turns only `NEWER_SAVE` into `blockedBy 'newer'`; no `BroadcastChannel`, `navigator.locks`, write counter or build id in the record (`grep` over `src/` finds none; `__BUILD_ID__` is used only for display and export) | none. Precision: a fix in this build protects only from this build on; an already-running older build keeps its own write path. Builds from #69 on carry `guardedPut`, so a format bump would make every one of them refuse (they treat the higher number as `newer`); builds before #69 (pre `guardedPut`) cannot be reached by any fix |
| B-1: "known risk, plan-review S-16d F4, follow-up 'two tabs'" | `context/archive/2026-10-16-salon-extra-slots/plan.md` (risk "A still-open S-16c tab or PWA instance can overwrite…", "No action"); `context/archive/2026-10-15-salon-load-health/follow-ups/review-fixes.md` "Two tabs of one origin (`BroadcastChannel`)" | none |
| B-1: an import or reset in the second tab is reversed | `saveImportDialog`/`saveResetDialog` reload only the tab that did it (`Autosaver.replace`); the other tab's next debounced write lands over it under the same rule | none (read from code, not reproduced in e2e) |
| G-1: `BootScene.create` builds `artHealth` only from `TASK_ART` and `ROOM_ART` | `BootScene.create`: `artHealth(TASK_ART, …)` → `REGISTRY_KEYS.artHealth`, `artHealth(ROOM_ART…)` → `REGISTRY_KEYS.roomArtHealth`; `UI_ART` is queued in `preload` but never counted | none |
| G-1: the parent reads "Wszystkie obrazki zadań są wczytane" | `pl.settings.artOk` = 'Wszystkie obrazki zadań są wczytane.'; `createArtHealthView` (`src/ui/dom/artHealthView.ts`) gets the task and room views only | none |
| G-1: the only trace is a mislabelled `loaderror` line | `BootScene.preload` `loaderror` listener logs `Task art failed to load: <key>` for every image (fonts and audio have their own labels) | partial: the mislabel applies to images (`ui/*`, `rooms/*`), not to sounds or the font (B-5 overstates it for sounds); a decode failure fires no `loaderror` and leaves no line |
| G-1: UI art left out on purpose | `context/archive/2026-10-16-final-art-p2/follow-ups/review-fixes.md` "Art-health set: UI art (`UI_ART`) is not counted in 'Obrazki' (decision 8)" | none; that follow-up's trigger ("a parent need to see UI art health") is fired by this audit |
| S-1: the panel gets only `prefs` and the missing-effect count | `UIScene.openSettings` passes `sound: { prefs: sound.prefs(), missing: sound.status().missing.length }`; `SettingsPanelOptions.sound` is `{ prefs; missing }` | none |
| S-1: music can fail after 30 s, fail to decode or wait for the unlock forever | `balance.sound.musicLoadTimeoutMs` 30000; `src/ui/sound.ts` `startMusic` `done` sets `musicState = 'missing'` on a missing or untrimmable buffer; `playMusic` sets `'loading'` and waits on `game.sound.once('unlocked', …)` | none; `SoundStatus.music` and `locked` exist and are read only by `src/testing/e2eHook.ts` `soundSnapshot` |
| S-1: the only trace is `console.warn('Music missing: …')` | `startMusic` warns `Music missing`, `Music could not be queued`; `playMusic` warns `Music failed to play`; the unlock wait logs nothing | partial: three different warnings, and none for the unlock wait (that is S-3) |
| P-1: `.catch(() => undefined)`, no lifecycle listeners | `src/pwa/registerServiceWorker.ts` `registerServiceWorker`: `navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined)`, nothing else | none. Precision: a failed precache does NOT reject `register()`; it shows as the installing worker turning `redundant`, so the fix needs `updatefound`/`statechange` (or the workbox-window events), not only the `catch` |
| P-1: precache about 5.9 MB, m4a and ogg | `vite/config.shared.mjs` `globPatterns` include both `ogg` and `m4a`, `maximumFileSizeToCacheInBytes` 10 MiB, `skipWaiting`/`clientsClaim`; local `dist/` built after 9a64fd6: `sw.js` lists 121 entries totalling 5.33 MiB (`dist/` folder 5.9 MB on disk) | size: about 5.3 MiB of precache, 121 entries (the 5.9 MB is the whole `dist/` folder); the direction of the claim holds |
| P-1: "build of the active SW in a runtime record" (fix direction) | `sw.js` carries no build id; `__BUILD_ID__` exists only in the page bundle | research must decide how the page learns which build the active worker serves (e.g. not at all: record only install success/failure and the error name) |

## Design kit and copy this change binds

The kit (`Martynka-urzadza.md`, `designs/martynka-maths-A-v1/style-guide.md`, screenshots) has **no settings view** (gaps 25-28); every parent line in the settings panel is already a DESIGN-GAP pattern. Bound views and keys:

| View | File / symbol | Copy keys (`src/data/pl.ts`) | Gap rows |
|---|---|---|---|
| "Obrazki" section | `src/ui/dom/artHealthView.ts` `createArtHealthView`, `src/core/artHealth.ts` `artHealthView` | `pl.settings.artHeading`, `artOk`, `artMissing`, `roomArtOk`, `roomArtMissing` | 67 (existing); a UI-art line → **new DESIGN-GAP** |
| "Dźwięki" section | `src/ui/dom/settingsPanel.ts` `openSettingsPanel` (`soundMissing` line) | `pl.settings.soundHeading`, `effectsHeading`, `musicHeading`, `soundMissing` | 114 (existing); music "did not load" / "waits for a tap" lines → **new DESIGN-GAP** |
| "Zapis gry" section | `src/ui/dom/saveHealthView.ts`, `src/core/saveHealth.ts` `offState` | `pl.settings.saveOff.newer` (and siblings in `saveOff`) | 113 (existing); a same-format/stale-tab refusal line and any child-facing restart card → **new DESIGN-GAP** |
| Offline/install status line | none yet (candidate: "Zapis gry" or a new muted line in the panel) | none yet | **new DESIGN-GAP** (the kit has no offline-readiness line) |

No new copy is invented here; the plan names the keys and the gap rows (from 116).

## Save-format migration: expected?

**My take: probably yes (v4), but the plan decides.** Two layers of B-1:

1. *Two tabs of THIS build or later* — solvable without the format: a runtime single-writer guard (`BroadcastChannel` hand-over or `navigator.locks`) or a `controllerchange` stale signal (B-8). No saved field, v3 stays.
2. *An already-running OLDER build of the same format* (the case the audit names) — only reachable through what the old build already checks, which is `version > own`. Bumping to **v4** (with, e.g., a write generation counter so future same-version tabs are refused too) makes every build from #69 on refuse to overwrite. That needs `MIGRATIONS[3]`, a `backup-v3` copy under the existing policy, frozen v3 fixtures, and rollback below v4 shows the `future` card (`deploy/README.md` note).

Audit § 6 calls v4 a maintainer decision. If the plan takes v4, the run's ship step should stop at an open PR unless the standing authorisation covers a format bump (it does not say so; profile § 5 is silent).

## Open follow-ups whose trigger names this area

| Follow-up (source) | Trigger | Take on scope |
|---|---|---|
| Two tabs of one origin (`BroadcastChannel`) (`2026-10-15-salon-load-health`) | a parent report of lost progress with two tabs, or the next save-format change (v4) | **in scope**: this is B-1 |
| A card for the child when a newer save blocks writing (`2026-10-15-load-and-tab-guard`, audit B-2) | a parent report of lost progress with two tabs or an old home-screen instance | **candidate, research decides (default in, light)**: a B-1 guard that refuses more often makes the silent session loss more frequent; needs a DESIGN-GAP card |
| The order of two cards of the same version (`future` against `newer`) (`2026-10-15-load-and-tab-guard`) | the same report, or v4 | **in only if v4**; otherwise stays |
| P-6 a failed service-worker registration is silent (`2026-10-15-load-and-tab-guard`) | the next change to `src/pwa/registerServiceWorker.ts` | **in scope**: this is P-1 |
| P-8 `backup-v2` overwritten by a second migration (`2026-10-15-load-and-tab-guard`) | a parent report of lost progress, or the v4 save format | **in only if v4** (the backup policy for v3 → v4 must not repeat it) |
| V-1..V-8 save v3 findings (`2026-10-15-load-and-tab-guard`) | the next change to `autosave.ts` attempt, `decodeSave`, `parseImport`, `saveHealth.ts`, or v4 | **out unless the plan edits those symbols**; any that fire are re-triggered in this change's follow-ups |
| Art-health set: `UI_ART` not counted in "Obrazki" (`2026-10-16-final-art-p2`, decision 8; L-6/L-8/F4 join) | a parent need to see UI art health | **in scope**: this is G-1 |
| L-6 `data-state` of the "Obrazki" section is the worse of its lines; L-8 unit test of `createArtHealthView` with two lines (`2026-10-15-salon-load-health`) | the next change to `artHealthView.ts` | **in scope (light)**: G-1 adds a third line to `createArtHealthView`, so both fire; the test becomes "three lines" |
| E2E on two real builds (old build meets a newer save) (`2026-10-15-salon-load-health`) | the next save-format change (v4) | **in only if v4**; a same-build two-tab e2e (two pages in one context) is the cheaper proof of B-1 either way |
| Music status stays `loading` while the audio context is locked (`2026-10-16-final-sound`) | a parent report that the panel shows music as loading | **in scope** via S-3 (needed for S-1's "waits for a tap" line) |
| Parent panel heading alignment ("Dźwięki" centred, "Zapis gry"/"Obrazki" left) (`2026-10-16-final-sound`) | the next change to the settings panel layout | **out**: this change adds lines, not layout; re-trigger |
| Both formats (m4a, ogg) precached (`2026-10-16-final-sound`) | precache weight becomes a problem on the tablet, or S-17 | **out**: P-1 records the failure; size is a separate decision |
| `beforeinstallprompt` listener keeps `preventDefault()` after "Graj w przeglądarce" (`2026-10-13-parent-settings-progress` F4) | the next change to `src/pwa` | **in scope (light)** if the plan edits `src/pwa` (P-1 does): still open in `src/pwa/installHint.ts` `mountInstallHint` |
| `mountInstallHint` tap-through (`2026-10-13-first-launch-placement`) | the next change to `src/ui/dom` or `src/pwa` | **already done**: `mountInstallHint` holds the input switch (`suspend`); record as closed |
| WebKit project for the loader cut / sound (`2026-10-15-load-and-tab-guard`, `2026-10-16-final-sound`) | a WebKit project in `playwright.config.ts` | **out** (no WebKit project added) |

## Neighbouring audit findings (ride-along decision)

| Finding | Same code as | Decision |
|---|---|---|
| B-8 `controllerchange` not handled (low) | P-1 (`registerServiceWorker.ts`), B-1 (stale signal) | **in**: the cheapest stale-build signal, same file |
| S-3 `'loading'` also means "waiting for the unlock" (medium) | S-1 | **in**: S-1's line needs the distinction |
| S-11 `sound.play()` unguarded in the `start` closure of `playMusic` (low) | S-3 (`playMusic`) | **in**: one `try`, same closure |
| B-2 child card on `newer` (medium) | B-1 | **candidate** (see follow-ups table) |
| S-8 `soundHealth` absent after the `catch` in `BootScene.create` (low) | S-1 section honesty | **candidate (light)**: an "unknown" state instead of "all fine" |
| S-6 sound-pref write failure dropped by `UIScene.applySettings` (medium) | S-1 section | **candidate**; default out |
| S-10 warn once per id in `SoundService.play` (low) | `play`, which S-1 does not touch | **out**, follow-up |
| G-2, G-3, B-4, B-5 (fallback choice, miniature, cut reason, loaderror label) | G-1 view | **out**, follow-ups (B-5's label fix is a candidate if the plan touches the `loaderror` listener) |
| S-2, S-4, S-5, S-7, S-9 | sound | **out**, follow-ups |
| P-2..P-6 (smoke, `ADD` listener, e2e marker) | `scripts/`, `BootScene.preload` | **out**, follow-ups (different area) |

## Autonomous decisions

- **Next step `/10x-research`, not `/10x-plan`** (the skill's default): fixed by the step prompt, and the change crosses IndexedDB transactions, the service-worker lifecycle (install failure is not a `register()` rejection), the Phaser sound unlock and possibly a save-format bump. Would change: nothing in this run (prompt-fixed).
- **Scope = B-1, G-1, S-1, P-1 + B-8, S-3, S-11 (+ light: F4 `beforeinstallprompt`, L-6/L-8 art-section state and test)**; B-2, S-8, S-6 are candidates for research. Rejected: the whole audit § 6 items 1-3 (too wide for one slice; the smoke work is `scripts/`). Why: the neighbours ride along only where the fix of a HIGH finding already edits the same symbol or cannot be correct without them. Would change: research showing a candidate is needed for a HIGH fix to be honest (then in), or the plan running over its phase budget (then drop the light items).
- **Save format: no decision here, take recorded** ("probably v4"). Rejected: fixing v3 now. Why: `/10x-new` only frames; the trade-off (old-build reach vs. rollback cost and maintainer decision) belongs to research and plan. Would change: the maintainer stating v4 is allowed or forbidden for this run.
- **Title in English**, commit message in Polish per profile § 1 (same as the worked examples). Would change: a maintainer rule for Polish change titles.
- **Precache size corrected to ~5.3 MiB / 121 entries**, measured on a local `dist/` built after 9a64fd6 (not rebuilt in this step). Would change: a fresh `npm run build` giving a different count.
