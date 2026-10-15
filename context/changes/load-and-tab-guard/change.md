---
change_id: load-and-tab-guard
title: Total limit and slow signal for the boot load, save guard against an old tab
status: implemented
created: 2026-10-15
updated: 2026-10-15
archived_at: null
---

## Notes

Non-roadmap fix, first slice of autonomous run `2026-10-15-fix-s16bcd`. No roadmap status edits.

**Source:** observability audit 2026-10-15_2217 (PR #66, not merged; this change never edits or merges that branch), findings **A-1** (HIGH), **A-2**, **P-5**, plus the font load without a limit (A-7 partly / follow-up of salon-load-health) where it fits A-1's guard. Scope agreed with the maintainer on 2026-10-15:

- **A-1**: the loader limit is per file (`balance.loader` 12 s × (1 retry + 1) = 24 s per file), not for the whole boot load. Phaser downloads at most 6 files at once on Android, so a server that accepts connections and stays silent freezes the bar for minutes. Add a total limit for the boot load: when it runs out, `BootScene` goes on to `create()` with what has loaded, and stand-ins (`ArtImage`, `artFilter`, "Obrazki") cover the rest. It must also cover the ~13 sound files S-16b will add to the same queue.
- **A-2**: the loading screen (`LoadingScreen`) shows only a bar that moves when a file finishes; add a "still loading" line after a while (pure rule in `src/core`, number in `balance.ts`, text in `pl.ts`, the pattern of `saveSlow`).
- **P-5**: an old tab or an old PWA instance can silently overwrite a v3 save. The autosaver must not write over a newer save version it did not load: re-read the stored version before a write (or an equivalent guard), and weigh `skipWaiting`/`clientsClaim` in `vite/config.shared.mjs`.
- **Font**: Phaser's `FontFile` skips XHR, so the per-file limit never reaches it; the total limit should cover it as well.

Other findings of the audit (A-3..A-11, V-*, P-1..P-4, P-6..P-8) are not in scope; they become follow-ups with triggers in this change's `follow-ups/review-fixes.md`.

**Save format:** stays **v3** (`SAVE_VERSION` 3 in `src/core/save.ts`). The guard reads the `version` field that every save already has; it adds no field. Frozen fixtures in `tests/fixtures/` stay byte-identical. A guard that needed a new saved field (a write counter, a tab id) would need v4 and is out of scope for this run.

## Audit claims checked against the repo (main 6f5644c, branch feat/load-and-tab-guard)

| Audit claim | Repo now | Correction |
|---|---|---|
| A-1: limit per file, `balance.loader` = 12 000 ms, `maxRetries` 1, worst case 24 s per file | `src/data/balance.ts` `loader: { timeoutMs: 12000, maxRetries: 1 }`; `src/main.ts` `createGame` passes it as `loader.timeout`/`maxRetries`; `BootScene.preload` copies `this.load.xhr.timeout` onto every file on `Loader.Events.ADD` | none |
| A-1: Phaser downloads at most 6 files at once on Android, 32 elsewhere | `node_modules/phaser/src/core/Config.js` `loaderMaxParallelDownloads` = `Device.os.android ? 6 : 32`; `createGame` does not set `loader.maxParallelDownloads` | none |
| A-1: about 65 files in the boot queue | 64 WebP files under `public/assets/` (`TASK_ART` + `ROOM_ART`) + 1 font = 65 | none; S-16b adds about 13 sound files (13 OGG in the salon-v2 pack), so ~78 |
| A-1: no total limit for `preload` | `BootScene.preload` has none; `create()` runs only on Phaser's loader `COMPLETE` | none |
| A-2: `LoadingScreen` shows only `progress`, no slow line | `src/ui/widgets/LoadingScreen.ts` has `progress(value)` and `destroy()` only; `pl.loading` has only `title` | none |
| Font: `FontFile` is `FILE_POPULATED`, skips XHR, no limit | `node_modules/phaser/src/loader/filetypes/FontFile.js` sets `CONST.FILE_POPULATED` in the constructor and `.catch` → warn → `onProcessComplete` | none; also the `loaderror` font branch in `BootScene.preload` is dead (A-7), out of scope beyond the limit |
| P-5: the autosaver does not compare the stored version before writing | `src/core/autosave.ts` `SaveStore` has `read`, `write`, `backup`; the write path never reads; `src/storage/idb.ts` `write` is a plain `set` | none |
| P-5: SW uses `skipWaiting` + `clientsClaim`, an old instance can live beside a new one | `vite/config.shared.mjs` `workbox.skipWaiting: true`, `clientsClaim: true`, `registerType: 'autoUpdate'`; `src/pwa/registerServiceWorker.ts` registers `/sw.js` with no `controllerchange` handling | partial: the guard can only live in the code of THIS build onwards. A tab already running a v2 build (S-15..S-16a) has no guard and will still write v2 over v3; this change protects a v3 save against tabs of this build and later (and against a future v4 save), and can make this build notice that it became stale (a newer SW took control). The v2-tab-over-v3 window already shipped cannot be closed by code. |
| P-5: "extends the known two-tabs follow-up" | `context/archive/2026-10-15-salon-load-health/follow-ups/review-fixes.md` "Two tabs of one origin (`BroadcastChannel`)" and `context/archive/2026-10-13-autosave-versioned-save/follow-ups/review-fixes.md` (plan-review F5: "a fix (`BroadcastChannel` or a write counter) changes the format") | partial: a version re-read needs no format change; only a same-version, two-tab ordering guard (write counter) would. Same-version two tabs stay a follow-up. |

## Open follow-ups whose trigger names this kind of change

| Follow-up (source) | Trigger | Take on scope |
|---|---|---|
| Time limit of the font load (`FontFace`) in `BootScene` (`2026-10-15-salon-load-health`) | the next change to `BootScene.preload` | **in scope**: the total boot limit covers the font too (explicit in the maintainer's scope) |
| The per-file loader timeout is guarded only by e2e (c), no unit/break of the `Loader.Events.ADD` listener alone (`2026-10-15-salon-load-health`, impl-review) | a Phaser upgrade, or the next change to `BootScene.preload` | **in scope (light)**: when the total limit is wired, keep or extend the e2e that pins the per-file listener; research decides if a unit seam is possible |
| Two tabs of one origin (`BroadcastChannel`) (`2026-10-15-salon-load-health`; F5 in `2026-10-13-autosave-versioned-save`) | a parent report of lost progress with two tabs open, or the next save-format change (v4) | **partly in scope** via P-5 (newer stored version blocks the write, stale-build signal); same-version ordering stays a follow-up (needs v4 or a channel) |
| S14-08 (rest): the loader handler logs the font too, without URL, status or build (`2026-10-14-art-stand-in-and-load-signal`) | the next change to `BootScene.preload` | **out of scope**: that is audit A-3/A-7 (cause per key); carried forward as a follow-up of this change |
| Take the hand-over in `BootScene.create` out of the font promise (`2026-10-13-observability-c1-c2`) | S-11 or the next change to BootScene | **already done**: `BootScene.create` hands over through `this.time.delayedCall(0, …)`; record as closed in this change's follow-ups |
| Loading screen drawn in code, title in the fallback font (`2026-10-15-final-art-salon`) | the author delivers loading art, or a visual check finds the fallback title ugly | **out of scope**: belongs to S-16c (loading art); the slow line added here must use the same layout tokens so S-16c can restyle it |
| A slow start / memory trouble (`2026-10-15-final-art-salon`) | a tablet check (human checklist 10.4) | **out of scope**: no tablet check in an unattended run |
| S14-06/S14-07 (`2026-10-14-art-stand-in-and-load-signal`) | a production report of a missing task image | **out of scope** (no such report); S14-07 was already answered by the per-file limit |

## Autonomous decisions

- **Next step `/10x-research`, not `/10x-plan`**: the step prompt fixes it, and the change crosses Phaser's loader internals (whether a total timer can end `preload` cleanly while files are in flight), the service worker and the IndexedDB write path; that needs code reading before a plan. Would change: nothing, the run fixes the order.
- **Font limit taken into scope** (the maintainer's "if it fits A-1's guard"): a total boot limit ends the wait regardless of the file type, so the font is covered without its own timer. Would change: research showing that the loader cannot be ended while the font promise is pending (then a separate `FontFace` race, or a follow-up).
- **P-5 stated as "protect from this build on"**: code cannot reach a tab already running an older build; the change.md table records it rather than over-promising. Would change: evidence that the old build's own write path re-reads the version (it does not on 6f5644c).
- **Save format stays v3**, the guard reads only `version`: the contract forbids v4 in this run. Would change: research proving that a sound guard needs a saved field; then the slice stops at an open PR per the contract.
- **Same-version two-tab ordering stays a follow-up**: needs a write counter (format change) or a `BroadcastChannel` protocol; not in the agreed scope. Would change: the maintainer widening the scope.
- **Title in English**: identifiers, comments and context artifacts of this repo are written in English (archived changes); commit message in Polish per the profile. Would change: a maintainer rule for Polish change titles.
