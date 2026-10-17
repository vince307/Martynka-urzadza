---
date: 2026-10-17T04:58:00+02:00
researcher: Claude (autonomous run 2026-10-16-audit-sweep, research step)
git_commit: af4ddecf73f8bda2dcf899274587745026b6befa
branch: feat/health-lines-and-smoke
repository: Martynka-urzadza
topic: "health-lines-and-smoke: root cause, smallest fix, first failing test and risk for every in-scope finding; how the live server answers the new smoke checks"
tags: [research, deploy-smoke, service-worker, phaser-loader, art-health, sound, save-notes]
status: complete
last_updated: 2026-10-17
last_updated_by: Claude (research step)
---

# Research: health-lines-and-smoke

**Date**: 2026-10-17T04:58+02:00
**Researcher**: Claude (autonomous run `2026-10-16-audit-sweep`, research step; three read-only workers for the smoke/SW, loader/art and sound/save areas, decisive claims re-checked in the main session)
**Git Commit**: `af4ddec` (branch tip; product code identical to `main` `dfc49ae`)
**Branch**: `feat/health-lines-and-smoke`
**Repository**: Martynka-urzadza

## Research Question

From `change.md` (findings table, open unknowns, decisions 1, 3, 5, 7, 8): for every in-scope finding give the root
cause (file + symbol), the smallest fix, the test that fails first (unit vs e2e) and the risk to existing behaviour;
and settle the open unknowns: how the LIVE server answers the new smoke checks (HEAD vs GET, `index.html`/`/`, content
type per precached extension, cache headers), where Phaser 4.2.1 drops image/audio decode failures, whether a font
failure fires `loaderror`, which clock the boot limits run on, and whether a cold-start measurement exists.

## Summary

1. **The live server satisfies a strict per-entry smoke.** 18 read-only requests on 2026-10-17 against
   https://martynka-urzadza.pl (table below): every precached extension answers `HEAD` with **200 and the right
   `Content-Type`**, including `.ttf` → `font/ttf`, `.m4a` → `audio/mp4`, `.ogg` → `audio/ogg` (the system MIME table
   covers them, so decision 5's "status only for fonts/audio" can become a full type assertion). `/index.html` answers
   **200** (no canonical redirect), a missing file answers **404**, `HEAD` gives the same status/type as `GET`. Under
   `Accept-Encoding` the `HEAD` of `index.html` shows `content-encoding: zstd` and `content-length: 13` (length of the
   compressed empty body) — the smoke must **not** assert `content-length`.
2. **Local `vite preview` is not a substitute for the 404 check**: it answers a missing `nope.webp` with
   **200 `text/html`** (SPA fallback) and `Cache-Control: no-cache` on every file. The per-entry check therefore has to
   assert the content type per extension (a `text/html` answer for a `.webp` is the failure signal locally), and a
   local run can prove the check's wiring but not the 404 path; that stays unit-tested on pure helpers.
3. **Precache**: the served `sw.js` and a local build both list **121** entries in one minified `precacheAndRoute`
   array of `{url:"…",revision:…}` (84 webp, 13 m4a, 13 ogg, 5 png, 2 js, 1 css, 1 html, 1 ttf, 1 webmanifest; no
   woff2). Live and local lists differ only in the hashed entry bundle name (`_app/index-*.js`).
4. **Phaser 4.2.1** (installed source, re-checked): an image that downloads but fails to decode goes
   `ImageFile.onProcess` → `onerror` → `File.onProcessError` with **no `loaderror`** (that event is emitted only in
   `LoaderPlugin.nextFile(file, false)`); `'load'` (`FILE_LOAD`) has fired before. Audio decode failure behaves the
   same (`AudioFile.onProcess` callback form, promise dropped → unhandled `EncodingError`). A font never fires
   `loaderror` (`FontFile.onProcess` warns `Font failed to load` and still calls `onProcessComplete`). The audio unlock
   (`WebAudioSoundManager.unlock`) removes its listeners on a rejected `resume()` and emits nothing — `locked` stays
   true for the session; no public failure signal.
5. **B-3 confirmed**: `TimeStep.smoothDelta` replaces frames over 200 ms and caps deltas during the 120-frame cool-down
   and while unfocused; `Clock` adds that smoothed delta, so `delayedCall` timers in `BootScene.preload` fire late
   during a heavy load while `this.time.now` is wall clock. Fix: `performance.now()` + `window.setTimeout`.
6. **The 46.6 s cold start is arithmetic, not a measurement** (`context/archive/2026-10-16-salon-extra-slots/research.md`
   "2 329 739 B ≈ 46.6 s at 50 KB/s"); recomputed today from `dist/`: 2 082 944 B pictures + 132 243 B M4A effects +
   114 552 B font = 2 329 739 B — unchanged. No throttled run exists; B-6 can only reorder now, `totalMs` stays.
7. Every in-scope id has a located root cause and an additive fix; none needs a save-format change (v4 stays), a
   `deploy/` change or a new dev dependency. One choice is real: S-2's source catch needs an internal per-file seam
   (wrap `file.config.context.decodeAudioData`), the same tier as `loaderCut.ts`, pinned by a tripwire.

## Live server observations (2026-10-17 ~02:52 UTC, 18 requests: 1 GET `sw.js`, 11 HEAD, 2 GET + 2 HEAD with compression, 1 HEAD `www`)

| request | status | Content-Type | Cache-Control | notes |
|---|---|---|---|---|
| GET `/sw.js` | 200 | `text/javascript; charset=utf-8` | `no-cache` | 121 precache entries |
| HEAD `/index.html` | 200 | `text/html; charset=utf-8` | `no-cache` | **no redirect** to `/` |
| HEAD `/` | 200 | `text/html; charset=utf-8` | `no-cache` | |
| HEAD `/_app/index-a3P6x3g-.css` | 200 | `text/css; charset=utf-8` | `public, max-age=31536000, immutable` | |
| HEAD `/_app/phaser-V-i9RVMB.js` | 200 | `text/javascript; charset=utf-8` | immutable | |
| HEAD `/assets/sounds/m4a/variant-pick.m4a` | 200 | `audio/mp4` | (none) | |
| HEAD `/assets/sounds/ogg/variant-pick.ogg` | 200 | `audio/ogg` | (none) | |
| HEAD `/favicon.png` | 200 | `image/png` | (none) | |
| HEAD `/fonts/AtkinsonHyperlegibleNext.ttf` | 200 | `font/ttf` | (none) | |
| HEAD `/manifest.webmanifest` | 200 | `application/manifest+json` | `no-cache` | Caddyfile override |
| HEAD `/assets/ui/wallet-open.webp` | 200 | `image/webp` | (none) | |
| HEAD `/assets/does-not-exist.webp` | **404** | — | — | no SPA fallback (Caddyfile has no `try_files`) |
| GET vs HEAD `/index.html`, `Accept-Encoding: gzip, deflate, br, zstd` | 200 / 200 | same | — | GET `content-encoding: zstd`, length 523; HEAD `zstd`, **length 13** |
| GET vs HEAD `/assets/ui/wallet-open.webp`, same header | 200 / 200 | `image/webp` | — | not compressed, length 27 874 both |
| HEAD `https://www.martynka-urzadza.pl/` | 301 | — | — | `location: https://martynka-urzadza.pl/` |

Same file types against a local `npx vite preview --config vite/config.prod.mjs --port 4398` (killed after): 200 and
the same types (`text/html;charset=utf-8`, `text/css`, `audio/mp4`, `audio/ogg`, `font/ttf`,
`application/manifest+json`, `image/webp`), `Cache-Control: no-cache` on everything (so the existing immutable check, `check-deploy.ts` `main` →
`cacheControlCheck(bundle, …, 'immutable')`, is not skipped for localhost and fails there: open question 1), missing file →
**200 `text/html`**.

Consequences for the plan's smoke:
- Expected-type map can cover **all** nine precached extensions (js, css, html, png, webp, webmanifest, ttf, m4a, ogg);
  a `.woff2` entry (none today) gets status only. Match the media type before `;` (charset differs live vs local).
- `/index.html` precache entry: 200 observed; keeping the "301/308 to `/` or `./`" tolerance from `change.md` is
  harmless but not needed for the current server.
- Do not assert `content-length` on HEAD; do not assert `Cache-Control` per entry (assets carry none, by design).
- Use `fetch(…, { method: 'HEAD', redirect: 'manual' })`; Node's fetch sends `accept-encoding` itself.

## Detailed Findings

### A. Deploy smoke — `scripts/check-deploy.ts`, `scripts/deploy-check/parse.ts`, `tests/deployCheck.test.ts`

Today (`check-deploy.ts` `main`): `/`, `/index.html` (cache-control only), manifest, `/sw.js` → `precacheFromSw`
(normalises to leading `/`), `roomArtCheck(precache, ROOM_ART…)`, an **unconditional**
`get('/assets/rooms/salon/architecture-after.webp')` (status + `image/webp`), `compareBundles` + immutable GETs, build id
only with `sha7`, `www` redirect (skipped for localhost). `get` retries only `GET /` and rethrows other errors bare; the
final rejection handler prints `FAIL request error — <message>`. `deploy.yml` passes the SHA on deploy and omits it on
rollback.

| id | root cause | smallest fix | first failing test | risk |
|---|---|---|---|---|
| O-1(a)/P-3 | no request per precache entry | pure `entryVerdict(url, status, contentType, location)` + `EXPECTED_TYPES` map in `parse.ts`; HEAD pool (≈8 concurrent, constant in `scripts/`) in `check-deploy.ts`; one aggregated line `precache served: n/N` + first failures | `tests/deployCheck.test.ts` (verdicts: 200+type ok; 404; `text/html` for `.webp` fails; charset tolerated; index.html redirect tolerance) | 121 extra HEADs per deploy (~2–3 s); a server MIME change fails the smoke after the switch (release already live) |
| P-2 (0915) | HEAD's `ROOM_ART` and a hard-coded salon file checked against an older release on rollback | table checks under `if (sha7)`; drop the hard-coded GET (the per-entry check covers it) | `tests/deployCheck.test.ts` only if the gating is extracted (`checksFor(sha7)`); otherwise review | rollback smoke weaker on purpose |
| S14-06 / P-4 (2217) | only `ROOM_ART` compared with the precache | generalise `roomArtCheck` → `precacheCovers(name, precache, urls)` for `TASK_ART` (`url`), `UI_ART` (`url`), `ROOM_ART`, boot `SOUNDS` (flatten `urls` over `boot`) | `tests/deployCheck.test.ts` (existing "requires every room picture…" keeps passing through a wrapper or is renamed) | none; all four tables import no Phaser/browser code (`taskArt` → `core/text/measure`, `roomArt` → `pl`, `rooms`; `sounds` type-only; `uiArt` none) |
| P-4 (0915) | `get` loses the path; FAIL line does not say the switch already happened | `get` throws `new Error(\`${path}: ${msg}\`, { cause })`; FAIL line adds "release is already live" | `tests/deployCheck.test.ts` if the line is a pure formatter (`failLine`) | none |

Note: the existing `/index.html` check reads only `Cache-Control`; since Caddy's `header` runs before `file_server`, it
would pass on a redirect too. The per-entry status check closes that.

### B. Service worker — `src/core/swStatus.ts`, `src/pwa/registerServiceWorker.ts`, `src/ui/dom/offlineView.ts`

Registration: `vite/config.shared.mjs` `injectRegister: null`, `registerType: 'autoUpdate'`, own
`navigator.serviceWorker.register('/sw.js')`; `workbox-window` / `virtual:pwa-register` unused.

| id | root cause | smallest fix | first failing test | risk |
|---|---|---|---|---|
| O-2 | `stepSw` `case 'state'` `redundant` with `status.active` → `phase 'ready'`, `error: INSTALL_FAILED`; `offlineView` prints `LINES.ready` ("Gra jest gotowa") + `Kod:` | a line `'updateFailed'` chosen when `phase === 'ready' && error !== null` (view-level, reducer unchanged) + `pl.settings.offline.updateFailed` (required by type: the view indexes `pl.settings.offline[view.line]`) | `tests/swStatus.test.ts` (the case "keeps a failed update behind an active worker as ready with a code" pins today's output) | DOM copy only; DESIGN-GAP row |
| O-4 | `register().then` handles `registration.active`, `installing` only | `if (registration.waiting) track(registration.waiting)` before `installing` | `tests/swStatus.test.ts` only if a `waiting` event joins `stepSw`; wiring has no unit test (nothing in `tests/` imports `src/pwa`) | small: with `skipWaiting` a waiting worker is transient |
| O-3 = VG-1 | no `registration.update()` | on `visibilitychange` → visible, throttled by a new `balance.pwa.updateEveryMs`; catch and log the name | unit test of a pure throttle (`shouldCheckUpdate(now, last, every)`) | **behaviour change**: with `skipWaiting` + `clientsClaim` an update found mid-session takes over the open page (today only at launch). All boot assets are already loaded; the lazy music file would come from the new cache. The plan must accept it against plan § 9 ("silent update at the next launch") or call `update()` only at launch; see open question 2 |
| O-5 | `emit` `catch { // advisory }` | `console.warn` the error name | none in unit (DOM); review | none |
| O-1(b) | page sees only `redundant`; neither `vite-plugin-pwa` 2.0.0 `registerSW` (`onRegisterError` covers register/import failures only; its autoUpdate also reloads the page) nor workbox-window passes the install error | **stays deferred** (decision 3 confirmed: needs an SW snippet) | — | — |

### C. e2e marker — `vite/e2eHookGuard.mjs`

P-6: `E2E_BOOT_LIMITS` (`src/testing/e2eHook.ts`) is used in `BootScene.preload` only behind
`__E2E_HOOK__ && seamEarly === 'stallall'`; `E2E_HOOK_MARKERS` lacks a marker. In the local builds `stallall` is
present in `dist-e2e/` and absent from `dist/` (minified number forms like `totalMs:3e3` are terser-dependent).
Fix: add `'stallall'` (required in the hook build automatically via `E2E_REQUIRED_MARKERS`). Test:
`tests/e2eHookGuard.test.ts`. Risk: none today.

### D. Phaser loader, boot record and art health — `src/scenes/BootScene.ts`, `loaderCut.ts`, `src/core/artHealth.ts`, `src/ui/dom/artHealthView.ts`

Phaser facts (installed `node_modules/phaser/src`): `loaderror` = `Events.FILE_LOAD_ERROR` emitted only in
`LoaderPlugin.nextFile(file, false)` (HTTP ≥ 400 in `File.onLoad`, xhr error/timeout after retries in `File.onError`);
`Events.FILE_LOAD` emitted in `nextFile(file, true)`; texture added only on `FILE_COMPLETE`. In the `loaderror`
listener `file.src` and `file.xhrLoader?.status` are readable (0 = timeout or network). `cutLoad` fires `loaderror`
through `nextFile` for in-flight files before `this.cut` is assigned, and fails queued files without any event.
Queue order: `addFile` into an insertion-ordered `Set`; `checkLoadQueue` starts in that order up to
`maxParallelDownloads` (32, **6 on Android**, `core/Config.js`; `main.ts` does not set it). Current order in
`BootScene.preload`: 2 loading pictures, font, 46 `TASK_ART`, boot sounds, 38 `ROOM_ART`, other 3 `UI_ART`.

Cause rule from public events: record keys seen on `'load'` and on `'loaderror'`; in `create()` a missing texture is
**fetch** (loaderror, with status), **decode** (load seen, no texture), **cut** (in `bootLoad.cut`) or **never
started**. `?e2eArt=corrupt` (money gets the font URL) is exactly the decode case.

| id | root cause | smallest fix | first failing test | risk |
|---|---|---|---|---|
| A-3 = L-3 = B-5 = U-3 = S14-08 | `loaderror` ternary: font / audio / else "Task art failed to load: <key>" | pure `loadErrorLine(kind, key, src, status)` with kind from the tables (tasks/rooms/ui/sound); drop the dead font branch | `tests/artHealth.test.ts` (or new `tests/loadErrorLine.test.ts`) | console only |
| A-4 + ASL-07 | `create()` decides by `textures.exists` only | cause per key (rule above) + size check `textures.get(key).source[0].width/height` vs table `width/height` — report, never drop | unit on the cause classifier; e2e `?e2eArt=corrupt` expects decode cause | table sizes already pinned by `tests/uiArt.test.ts`/`taskArt` header tests |
| A-7 = ASL-06 | dead `font` branch; no font check | in `create()`: `[...document.fonts].some(f => f.family === FONT_KEY && f.status === 'loaded')` (`document.fonts.check` returns true when no face matches — browser behaviour, verify in e2e); `REGISTRY_KEYS.fontHealth` runtime only | e2e routing `**/fonts/*.ttf` to 404, line in "Obrazki" | low |
| B-3 | timers on `this.time.delayedCall` (smoothed clock, paused when hidden via `Game.onHidden` → `loop.pause()`) | `startedAt = performance.now()`, slow/cut timers on `window.setTimeout`, cleared on `COMPLETE` and scene shutdown, callbacks in `try`; keep the rule pure with an injected clock | unit test of the injected-clock scheduler; `load-and-tab-guard.spec.ts` `stallall` stays green | timers outlive the scene unless cleared |
| B-4 = U-2 = A-11 | `publish()` writes `{cut, creates}`; `createArtHealthView` takes three views, no cut | `bootLoad` gains `elapsedMs` and cut per table; cut line in the lines builder; extend `bootLoadSnapshot` in the hook | lines-builder unit; e2e `stallall` expects the cut line | hook type grows |
| B-6 | sounds queued before `ROOM_ART` (Android: 6 parallel) | move `queueSounds()` after `UI_ART`, optionally via a pure `bootQueue()` order | unit on `bootQueue()` order if extracted | effects are cut first on a slow link (quiet); `totalMs` unchanged (no measurement) |
| P-5 | `Loader.Events.ADD` listener without `try` | wrap with a warn-once | review | none |
| A-5 + R-5 | `artHealth()` = `{total, missing, missingIds}` | additive `causes` map + up to `balance.artHealth.labelCap` labels | `tests/artHealth.test.ts` | `artFilter` reads `missingIds` only |
| ASL-02 + L-8 + final-art-salon F4 | `artHealthView.ts` builds DOM directly; `settingsPanel.ts` hides the whole section while task art is `unknown` | pure `artHealthLines(task, room, ui, font, fallbacks, cut, build)` in `core`, thin DOM renderer; each known line shown; per-folder counts, muted `__BUILD_ID__` line, "tasks skipped" sentence, no restart advice for a repeating cause | new `tests/artHealthLines.test.ts` | copy changes → DESIGN-GAP rows from 139 |
| U-1 = G-2 (+ G-3 record) , G-7 | fallbacks chosen locally (`CoinWallet` `walletArt`, `UnlockCard` `firstLoaded(…) ?? icon`, `RoomDoneCard.miniature()`, `LoadingScreen.artShown()`), only the hook sees some | `REGISTRY_KEYS.artFallbacks: Partial<Record<'wallet'|'notebook'|'miniature'|'loading', string>>` through one setter, runtime only; `?e2eArt=ui` skips the non-loading `UI_ART` (marker `e2eArt` exists) | e2e `?e2eArt=ui` (wallet `drawn`, book fallback, panel line) | registry writes from widgets: keep one setter |
| G-5 | `tests/uiArt.test.ts` table → file only | add readdir of `public/assets/ui` → table | the test itself | none |
| A-9 | no e2e for one stalled task picture | `page.route` hangs one `tasks/money/*` under the short e2e loader timeout, expects skipped skill + cause line | new e2e | timing flake (known load flakes) |
| ASL-03 | `withoutArtBlocked` `minCurrent` | docs note on design-gaps row 66 | — | none |
| ASL-04 = S14-05 | `withoutArtBlocked` falls back silently (all empty → original buckets; current under threshold → unfiltered) | additive `fallback: 'none'|'current'|'all'` (or a counter) + console summary; mastery untouched | `artFilter` unit tests | callers destructure buckets: keep additive |

### E. Sound — `src/ui/sound.ts`, `src/core/sound.ts`, `src/storage/soundPrefs.ts`, `src/core/errorSignal.ts`, `src/ui/dom/errorBoundary.ts`

Phaser facts: `WebAudioSoundManager` sets `locked = context.state === 'suspended'` once and `unlock()` adds
`touchstart/touchend/mousedown/mouseup/keydown` listeners on `document.body` that call `context.resume()`; on resolve
`unlocked = true` → next `BaseSoundManager.update` sets `locked = false` and emits `'unlocked'`; **on reject the
listeners are removed and nothing is emitted** (re-checked in source); a never-settling `resume()` leaves the
listeners. `AudioFile.onProcess` uses the callback form of `decodeAudioData`; its failure path logs and calls
`onProcessError` (no `loaderror`); the returned promise is dropped (unhandled `EncodingError` in browsers that return
one — spec behaviour, not run here). Per-file seam: in an `addfile` listener wrap `file.config.context` so the
returned promise gets `.catch(noop)` and a named log — internal, same tier as `loaderCut.ts`, needs a pin test in
`tests/phaserLoaderPin.test.ts`.

| id | root cause | smallest fix | first failing test | risk |
|---|---|---|---|---|
| M-1 = S-4 | `musicLine` `waiting-unlock` → `waitingUnlock` regardless of touches; `SoundService.play` records `locked` in `log` only | count `locked` outcomes (or body `pointerup` while locked) in `createSoundService`, `status().lockedCount`; `musicLine(prefs, music, lockedCount = 0, threshold)` → `'blocked'` at `balance.sound.lockedTouches`; an effects line when locked over the threshold; optional `context.state` | `tests/sound.test.ts` | low (defaulted parameter); WebKit truth = [human] tablet row |
| S-2 | `installErrorBoundary` warns `signal.message` only; `QUIET_REJECTIONS` quiets `EncodingError`/`NotSupportedError` globally | warn name + message via a pure `noiseLine(signal)`; source catch through the per-file context wrap (BootScene `addfile`, `startMusic`) logging `Sound decode failed: <key> (<name>)`; `QUIET_REJECTIONS` unchanged | `tests/errorSignal.test.ts` (`noiseLine`); pin test for the seam | the seam depends on `file.config.context` (internal) |
| S-5 | `startMusic` `done` warns `Music missing` for every cause | keyed `loaderror`/`load` listeners on the shared HUD loader (filter `file.key`, removed in `done`) → `status().musicError` `http:<n>`/`timeout`/`decode`/`trim` | `tests/soundMusic.test.ts` (fake loader gains `on`/`off`) | low |
| S-7 | `parseSoundPrefs` silently returns defaults | parser returns a `problem`; `createSoundPrefStore.read` warns when `raw !== null && problem` | `tests/soundPrefsStore.test.ts` | none |
| S-9 | `play` catch records `missing` but never grows `setMissing`'s set; no-Web-Audio shows "12 not loaded" | add the key to `missing` (dedup); `status().device: 'none'` when no context and no `webAudio`/`audioData` → "no sound on this device" line | `tests/soundMusic.test.ts` / `tests/soundCues.test.ts` with a throwing fake `play` | count may grow mid-session |
| S-10 | `play` catch warns each call | warn once per id | same fake | none |
| M-2 | `REGISTRY_KEYS.soundPrefsKept` written only in `UIScene.applySettings` | `probe()` on the store (separate key `martynka:sound:probe`, set+remove), called in `main.ts` beside the prefs read | `tests/soundPrefsStore.test.ts` | one extra storage write per start |
| FU-16 | no test of `prefsKept` false | extract pure `applySoundPrefs(prefs, {service, store, registry})` from `UIScene.applySettings` | new `tests/soundPrefsApply.test.ts` | none |

### F. Save notes and room — `src/core/save.ts`, `src/core/migrations/legacySalon.ts`, `src/main.ts`, `src/core/rooms.ts`, `src/scenes/RoomScene.ts`

| id | root cause | smallest fix | first failing test | risk |
|---|---|---|---|---|
| M-4 = R-3 | `DecodeResult` ok = `{kind:'ok', session, migratedFrom}`; `LIFT_V2_SALON` returns only the value; `main.ts` `start` warns `Save migrated from vN` | split `carryV2Salon(raw) → {value, carried: {from, to} | null}`, `LIFT_V2_SALON = r => carryV2Salon(r).value` (MIGRATIONS[2] output byte-identical); `decodeSave` records `salonCarried` at the v2 step; runtime registry key → 4th argument of `saveHealthView` → line "Pokój przeniesiony na nowy wygląd". Copy the **room-problems** path (`REGISTRY_KEYS.roomProblems` → `UIScene` → `saveHealthView`), not `migratedFrom` | `tests/legacySalonMigration.test.ts` (fixture `save-v2-legacy-salon.json`), then `tests/save.test.ts`, `tests/saveHealth.test.ts`; e2e seam `?e2eSave=legacy-salon` exists | every `kind:'ok'` literal (incl. `saveFile.parseImport`) needs the field |
| R-2 | `main.ts` logs migration, `repairCurrentRoom`, R-4 problems only; S-16d grew the salon from 7 to 12 tasks | pure `roomGrowth(rooms, catalogue)` with former lengths as data (`RoomDef.formerTaskCounts: [7]`), `console.info` beside the R-4 warn; **not** a `RoomProblemKind` (would show `roomMismatch` to the parent) | `tests/rooms.test.ts` | logs a child who bought exactly 7 under the new list too (log only) |
| M-5 | `writefail` exercised only by a round in `save-restart.spec.ts`; `RoomScene.dispatch` `void saver.flush('now')` for stage and slot | e2e only: `passWelcome(page,{e2eSave:'writefail', e2eStars:'12', e2eVariant:'off'})`, stage + sofa purchase, `consecutiveFailures` grows, `section.parent-save[data-state=failing]`, no fatal card | new case in `tests/e2e/save-restart.spec.ts` | test only |
| R-6 | `RoomScene.slotTargets` `if (at)` skips silently; `holdPoint` null for unchosen and for unreachable chosen slots | hook field `unreachable: string[]` (chosen and `at === null`) | assert empty in `tests/e2e/room-change.spec.ts` (optionally unit in `tests/roomHit.test.ts`, coverage there unchecked) | none |

## Code References

- `scripts/check-deploy.ts` `main`, `get`, final rejection handler — smoke flow, bare error.
- `scripts/deploy-check/parse.ts` `precacheFromSw`, `roomArtCheck`, `compareBundles` — pure helpers to extend.
- `deploy/Caddyfile` — `encode zstd gzip`, `@immutable`, `@nocache`, manifest type override, `file_server`, no `try_files`.
- `src/core/swStatus.ts` `stepSw` (`case 'state'`, `INSTALL_FAILED`); `src/pwa/registerServiceWorker.ts` `emit`, `register().then`.
- `src/ui/dom/offlineView.ts` `LINES`; `src/data/pl.ts` `settings.offline`.
- `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`; `src/testing/e2eHook.ts` `E2E_BOOT_LIMITS`, `E2EArtSeam`.
- `src/scenes/BootScene.ts` `preload` (ADD listener, `loaderror` listener, queue order, `armSlow`, cut timer), `publish`, `create`.
- `node_modules/phaser/src/loader/LoaderPlugin.js` `nextFile`, `checkLoadQueue`; `loader/File.js` `onProcessError`; `loader/filetypes/{ImageFile,AudioFile,FontFile}.js` `onProcess`; `core/TimeStep.js` `smoothDelta`; `time/Clock.js` `update`; `sound/webaudio/WebAudioSoundManager.js` `unlock`.
- `src/core/artHealth.ts` `artHealth`, `sectionState`; `src/ui/dom/artHealthView.ts` `createArtHealthView`; `src/ui/dom/settingsPanel.ts` "Obrazki" section.
- `src/core/round/artFilter.ts` `withoutArtBlocked`, `minCurrent`.
- `src/ui/widgets/{CoinWallet,UnlockCard,RoomDoneCard,LoadingScreen}.ts` — fallback choices.
- `src/ui/sound.ts` `createSoundService` (`play`, `status`, `setMissing`, `startMusic`); `src/core/sound.ts` `musicLine`, `parseSoundPrefs`; `src/storage/soundPrefs.ts` `createSoundPrefStore`.
- `src/core/errorSignal.ts` `QUIET_REJECTIONS`; `src/ui/dom/errorBoundary.ts` `installErrorBoundary`.
- `src/core/save.ts` `DecodeResult`, `decodeSave`; `src/core/migrations/legacySalon.ts` `LIFT_V2_SALON`; `src/main.ts` `start`; `src/core/saveHealth.ts` `saveHealthView`.
- `src/core/rooms.ts` `roomStateProblems`; `src/scenes/RoomScene.ts` `slotTargets`, `dispatch`; `src/core/roomHit.ts` `holdPoint`.

## Architecture Insights

- Panel sections are tested as pure views in `core` with thin DOM renderers (`saveHealthView`, `offlineView`,
  `progressView`); L-8 follows that (decision 6 confirmed; no DOM test environment).
- Runtime health is registry state outside `SAVE_KEYS` (`artHealth`, `uiArtHealth`, `bootLoad`, `swStatus`,
  `soundHealth`); `artFallbacks`, `fontHealth`, `salonCarried` follow the same rule.
- Phaser internals are touched only through pinned seams (`loaderCut.ts` + `tests/phaserLoaderPin.test.ts`); a new
  reliance on `FILE_LOAD` and on `file.config.context` belongs in that tripwire.

## Historical Context (from prior changes)

- `context/archive/2026-10-16-salon-extra-slots/research.md`, `plan.md`, `plan-brief.md` — the 46.6 s figure is a byte
  count at 50 KB/s (supported as arithmetic; "documented cold start" in audit 0915 B-6 is **partial**: no timing exists).
- `context/archive/2026-10-16-load-and-tab-guard/` follow-ups — A-6 per-file limit waits for a [human] throttled Android
  measurement (still not fired); impl-review F3 slow-line timer note is obsolete (B-3 rewrites the timers).
- `context/archive/2026-10-16-stale-tab-and-health/` — `swStatus`, `musicLine`, `soundPrefsKept`, `sectionState`
  introduced; follow-ups FU-7, FU-10..FU-13, FU-16 fired by this change.

## Related Research

- `context/archive/2026-10-16-salon-extra-slots/research.md` (boot queue budget)
- `context/archive/2026-10-16-stale-tab-and-health/research.md` (SW status, sound health)

## Open Questions

1. **Immutable check on localhost**: local `vite preview` sends `Cache-Control: no-cache` for `_app/*`; the plan's local
   proof run (`check:deploy` against preview) must expect the existing immutable check to fail locally or skip it for
   localhost as the `www` check is — the plan decides; not a server question.
2. **O-3 mid-session takeover**: calling `registration.update()` during a session with `skipWaiting` + `clientsClaim`
   (`vite/config.shared.mjs`) lets a new worker control the open page. Plan § 9 says "silent update at the next
   launch"; the plan must either accept the takeover (assets already loaded) or call `update()` only at launch. Choice,
   not a missing fact.
3. **Cold-start time**: not measured; a throttled Chromium run (CDP `Network.emulateNetworkConditions` 50 KB/s with the
   SW installing) is possible in e2e but slow (≈ 45–90 s); recommended as [human]/optional, `totalMs` unchanged.
4. **Browser behaviour from spec, not run**: the unhandled `decodeAudioData` promise rejection and
   `document.fonts.check` returning true for an unknown family — the e2e of A-7 and the S-2 seam verify them.

## Recommended phase grouping (for `/10x-plan`)

1. Smoke: per-entry HEAD + type map, table coverage, SHA gating, error path (O-1a/P-3, P-2, S14-06, P-4 0915) — impl/tdd, unit.
2. Service worker: O-2 line, O-4 waiting, O-3 throttled update, O-5 warn — tdd.
3. Loader log + cause classifier + size check + font check + dead branch + ADD `try` + marker (A-3, A-4, ASL-07, A-7, P-5, P-6) — tdd.
4. Boot clock + record + reorder (B-3, B-4, B-6) — tdd.
5. "Obrazki" lines builder (A-5, R-5, ASL-02, L-8, F4) — tdd.
6. Fallback record + `?e2eArt=ui` (U-1, G-2, G-7) + G-5 test — impl + e2e.
7. Sound lines (M-1, S-9, S-10, S-5) — tdd.
8. S-2 noise line + decode seam + prefs (S-7, M-2, FU-16) — tdd.
9. Salon note + room growth (M-4, R-3, R-2) + ASL-04 counter + ASL-03 doc — tdd.
10. e2e: M-5, A-9, R-6, B-4 cut line, A-7 font — e2e.
