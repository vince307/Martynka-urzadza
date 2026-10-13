---
date: 2026-10-13T13:40:07+0200
researcher: Claude (autonomous run 2026-10-13-s09-s11, research step)
git_commit: 5b49883
branch: feat/autosave-versioned-save
repository: Martynka-urzadza
topic: "S-11 autosave-versioned-save: v1 save format, idb-keyval adapter, autosave triggers, load at start, failed-load path, tests"
tags: [research, save, indexeddb, idb-keyval, pwa, lifecycle, migrations, e2e-hook]
status: complete
last_updated: 2026-10-13
last_updated_by: Claude (autonomous run)
---

# Research: S-11 autosave and versioned save

**Date**: 2026-10-13T13:40:07+0200 · **Git Commit**: 5b49883 · **Branch**: feat/autosave-versioned-save

## Research Question

Resolve the unknowns `change.md` leaves to research (`## Roadmap claims vs repo now`, last row; handoff §5) plus the
run prompt's extras: (1) idb-keyval version, API, bundling and precache; (2) how to test persistence in unit (fake
IndexedDB vs an injected port) and e2e (reload through the product, read back through the hook) and how a
previous-version fixture is tested; (3) service-worker update path: can a new build read a save written mid-session by
the old one, and what does a deploy rollback do; (4) which page-lifecycle events reliably fire before iPad Safari /
Android Chrome PWAs are killed; (5) how a failed write is surfaced given `QUIET_REJECTIONS`; plus the v1 shape,
`rngSeed`, the profile slot, the async load before `BootScene`, `?e2eStars` vs a loaded save, Safari eviction.

## Summary

- **The format is a one-way door, and the game holds more than plan §5's `SaveState`.** The runtime learner is
  `SessionLearner` (`src/core/placement.ts`): `PlacedLearner` (with `warmupPending`) & `Adaptation` &
  `pendingUnlock: number | null`, and it is absent until `WelcomeScene.start` sets it. `SaveState` in
  `src/core/types.ts` has no reader or writer in `src/` (grep for `SaveState`). v1 should be what the game holds,
  chosen key by key (change.md decision 1 confirmed).
- **`rngSeed`: drop it.** Every RNG is seeded per use from the clock or `Math.random` (`TaskScene.create`
  `createRng(Date.now() >>> 0)`, `WelcomeScene` and `UIScene` `createRng(Math.floor(Math.random() * 2 ** 32))`); no
  code reads a stored seed. Only the comment at the top of `src/core/rng.ts` mentions it (to update).
- **idb-keyval 6.3.0** (npm, published 2026-07-08), ESM, no dependencies, ~1 KB gzipped. `update` and `setMany` are
  single `readwrite` transactions; `set` resolves on transaction `complete`; `createStore` opens lazily, caches the open
  promise and drops it on `db.onclose` (comment: "Safari sometimes likes to just close the connection"). A static import
  lands in the main entry chunk (`vite/config.shared.mjs` `manualChunks` only splits `phaser`) and `sw.js` precaches it
  (`workbox.globPatterns` includes `js`). Not installed yet (`package.json`).
- **Unit tests need no IndexedDB for core.** Recommended: a `SaveStore` port (load raw / write raw) that `src/core`
  owns as a type; `src/core/save.ts` (encode, decode, migrate, validate) and an autosave scheduler with injected timers
  are tested against a `Map`; `src/storage/idb.ts` is a thin adapter tested once with `fake-indexeddb` 6.2.5
  (`import 'fake-indexeddb/auto'`, vitest's default node environment; `vitest.config.mts` sets none). Test-plan risk #2
  warns against mocking so deep that serialization is never exercised: the fixture tests must run the real
  `JSON`/structured-clone round-trip through `decode`.
- **E2E: `page.reload()` keeps IndexedDB within the Playwright context**, and every test gets a fresh context, so a
  spec plays through the product, waits for the save to land (read-only hook field), reloads and compares the hook's
  stars/rooms/learner/screen. Reading IndexedDB directly with `indexedDB.open` would create an empty DB and break
  idb-keyval's store creation: read through the hook only.
- **SW update path: a new build never reads a save mid-session in one page.** `registerType: 'autoUpdate'` +
  `skipWaiting` + `clientsClaim` without reload (`vite/config.shared.mjs`, `src/pwa/registerServiceWorker.ts`): the open
  page keeps running the old modules; the new build reads the save once, at its next launch. Two clients at once (a
  browser tab plus the home-screen app) can run two builds against the same origin's IndexedDB; that and a deploy
  rollback both reduce to "a build meets a save newer than it knows" → load without writing (decision 5 confirmed).
  Rolling back to a pre-S-11 build is harmless: that build never touches IndexedDB, so the save waits untouched.
- **Lifecycle: `visibilitychange` → `hidden` is the last reliable signal** (Chrome Page Lifecycle doc, MDN); iOS does
  not fire `pagehide`/`unload` on a swipe-kill or OS kill (WebKit bug 199854). So: debounced save as the main path,
  flush on `hidden`, `pagehide` as a cheap second flush, never `unload`/`beforeunload`; write the whole snapshot in one
  key so an aborted write leaves the previous save intact.
- **Failed writes must never reach the error boundary.** `QUIET_REJECTIONS` (`src/core/errorSignal.ts`) would hide an
  `AbortError` as `console.warn`, but any other unhandled IDB rejection (`QuotaExceededError`, `InvalidStateError`,
  `UnknownError`) would raise the restart card over a child's game. The save module catches every rejection itself,
  logs `console.error`, keeps the state dirty, recreates the store and retries once on a connection-lost error, and
  otherwise retries at the next change or flush. No child-facing message; nothing leaves the device.
- **Plan §8 also requires `navigator.storage.persist()` after start** (missing from change.md): Safari 17+ and Chrome
  support it, neither prompts; call once, ignore `false`.

## Detailed Findings

### 1. What the game holds vs plan §5 (v1 shape)

- Registry keys that make up the save (`src/data/layout.ts` `REGISTRY_KEYS`): `stars`, `rooms`, `currentRoom`,
  `learner`, `settings`. The others (`narration`, `narrator`, `roomSwitch`, `month`, `inputSuspender`,
  `forcedFailure`) are session-only by their own comments.
- Initial values are set in `src/main.ts` `createGame` → `callbacks.preBoot`: `settings` = `initialSettings()`
  (`{ autoRead: null }`), `stars` = `startStars` (0, or `?e2eStars` in the e2e build), `rooms` =
  `{ [FIRST_ROOM]: emptyRoomState() }`, `currentRoom` = `FIRST_ROOM`; the comment there already says "S-11 replaces
  these values with the saved ones".
- Writers of those keys (grep `registry.set` in `src/scenes/`, this inspected set):
  `TaskScene.syncStars` (stars, after each task), `TaskScene.finishRound` (learner: adaptation + `pendingUnlock`),
  `TaskScene.finishWarmup` (learner: stage, `warmupPending: false`), `TaskScene.closeUnlock` (learner: `pendingUnlock:
  null`), `RoomScene.dispatch` (`changed` → rooms; `bought` → rooms then stars), `UIScene` settings callback
  (settings; learner via `changeStageByParent`), `WelcomeScene.start` (learner). Nobody writes `currentRoom` after
  `preBoot` (one room).
- `SessionLearner` fields beyond `LearnerState`: `warmupPending` (placement, S-06) and `pendingUnlock` (S-07). Both
  matter after a restart: a child killed before the warm-up ends must get the warm-up again; an unlock earned at the end
  of the last round before a kill would otherwise never be announced.
- `pendingUnlock` is a bare step number read against `this.stage` (`TaskScene.unlockView`). `changeStageByParent`
  already clears it (`src/core/placement.ts`), so in a running session it cannot point at the wrong stage. In a save
  it is still worth storing as `{ stage, step }` (adaptive-curriculum follow-up): the loader can drop it when its stage
  is not the learner's, at no cost now and a migration later. The runtime type can stay a number (decode maps).
- History: `balance.mastery.historyLength` = 200 entries (`src/data/balance.ts`), each with optional `example`
  (`MistakeExample`: strings/numbers/number[], JSON-safe by its own doc comment). The snapshot is small (tens of KB),
  well within any quota.
- **Pick keys explicitly on encode.** `endRound` returns an `Adaptation` built from the session learner (follow-up in
  `context/archive/2026-10-13-adaptive-curriculum/follow-ups/review-fixes.md`), and `TaskScene.finishRound` spreads it
  over the learner: an encode that spreads the session object would leak any future session-only field into the
  one-way format.

### 2. Profile slot and key layout (plan §1: "format zapisu zostawia miejsce na profile")

- Options: (a) one key `save` holding `{ version, profiles: { default: … }, active }`; (b) one key per profile
  (`save:default`) with the profile list added later as its own key. Both are one `put` per write.
- Recommendation: (b), key `profile:default` in a dedicated database (`createStore('martynka', 'saves')`). Adding
  profiles later adds keys and an index without rewriting the existing save (no migration on devices); a write touches
  only one child's data. The envelope carries `version` and `profileId` so an exported file is self-describing.
  idb-keyval's custom-store caveat (store created only when the DB is new) is harmless with one store per DB.
- Store the snapshot as a plain object (structured clone), not a JSON string: decode validates the shape either way;
  the raw export (`JSON.stringify`) works on any decoded-or-not object.

### 3. Load at start, `?e2eStars`, calendar floor

- Today the game is created synchronously in `src/main.ts` after `installErrorBoundary`. Loading is async: the plan
  should create the game inside `load().then(...)` (or `await` at module top level; both bundle fine in an ES module)
  with the boundary already installed, so a rejected load is caught by the save module and never becomes an unhandled
  rejection. Expected IDB open + get time is a few tens of ms; the font is still loaded by `BootScene.preload`.
- `BootScene.create` decides on `needsPlacement(learner)`; with the loaded learner in the registry it already skips
  the welcome. The observability follow-up ("take the hand-over in `BootScene.create` out of Phaser's font promise")
  touches the same method; S-11 changes start-up, so it is in scope as the change.md table says.
- `?e2eStars` (`src/testing/e2eHook.ts` `e2eStars`) should seed only a fresh start (no save): a spec reloading with
  the same URL must see the saved balance, not the seed.
- Calendar floor (adaptive-curriculum follow-up): at session start, for each stage, `unlockedStep =
  max(saved, calendarStart(stage, age, month, …))` — a pure function next to `startLearning` in
  `src/core/curriculum.ts`, tested first. It does not change the format.

### 4. idb-keyval (version, API, bundling)

- Version 6.3.0 (registry, 2026-07-08; previous 6.2.6). Exports `get, set, setMany, getMany, update, del, delMany,
  clear, keys, values, entries, createStore, promisifyRequest`; ESM with a CJS fallback; no `dependencies`.
- `createStore(db, store)` returns a function that opens on first use, caches `dbp`, creates the store in
  `onupgradeneeded`, retries the open after a failed open, and sets `db.onclose = () => (dbp = undefined)`. A
  transaction running when the connection dies still rejects; there is no retry inside the library.
- `node_modules/idb` exists only as a transitive dependency (workbox); it is not idb-keyval.
- ESLint: `src/storage/**` is not in the browser-globals block (`eslint.config.mjs`); the plan adds it there and a
  `no-restricted-imports` rule so only `src/storage/` imports `idb-keyval` (mirror of the `phaser` rule for core),
  with a case in `tests/lint-boundaries.test.ts`.

### 5. Testing

- Unit (core): `save.ts` encode/decode/migrate/validate against fixtures in `tests/fixtures/` (v1 valid, v1 with
  optional fields missing, future `version: 2`, wrong types, non-object, truncated history entries); the autosave
  scheduler (debounce, flush, coalescing, blocked after a failed load, retry after a failed write) with injected
  timers, as `createNarrator` takes `setTimeout`/`clearTimeout` in `src/main.ts`.
- "A failed migration leaves the old save untouched": assert the port saw zero writes after a decode failure, and that
  the autosaver stays blocked for that key for the session.
- Previous-version fixture (test-plan §6.5 is "TBD"): no build ever saved, so v1 is the first fixture. Convention for
  later: freeze `tests/fixtures/save-v<N>.json` as written by version N (never edited), and a test per fixture that
  loads it through `decode` and compares with the expected current-version object. S-11 writes the convention into
  §6.5 at archive time.
- Adapter: one `fake-indexeddb` test (fresh `createStore('db-'+n, …)` per test, since the open promise is cached).
  Optional; a dev dependency.
- E2E (chromium-hook project, port 4397): `passWelcomeAsChild` (`tests/e2e/support/welcome.ts`), answer a round, wait
  until the hook reports the save landed (new read-only field, e.g. `save: { status, writes }`), `page.reload()`,
  assert the hook's stars/learner/rooms equal the pre-reload copy and the screen is `task` (no welcome). A purchase
  variant uses `?e2eStars` for the first load only. Never `page.evaluate` into IndexedDB (profile §9; it would also
  create an empty DB).
- Risk #10 (two builds): IndexedDB is per origin, and the origin includes the port, so the two builds must be served
  one after the other **on the same port**. `buildId` in `vite/config.shared.mjs` reads `GITHUB_SHA` first, so
  `GITHUB_SHA=<fake> npm run build -- --outDir …` gives a second build a different id. The current `webServer` entries
  in `playwright.config.ts` cannot swap a directory on one port; it needs a small static server the spec controls (or
  two sequential preview processes started by the spec). Cost is real; with only format v1 existing, the state part
  of #10 is the same code path as the restart spec. Recommendation: a later phase or a follow-up with
  `Trigger: first save-format change (v2) or test-plan phase 4`.

### 6. Service worker update and rollback

- Update: see Summary. Old page keeps old modules (no reload); next launch runs the new build, which reads the save
  once at start. A mid-session read by a newer build happens only with two clients open at once; the older one then
  meets a newer `version`.
- Rule for every build: `version > CURRENT` → do not migrate, do not write that key for the session, show the parent
  card (raw export). `version < CURRENT` → migrate in memory, validate, and only write after the first successful
  autosave of a valid state (the old bytes stay until then). Optional hardening for v2+: copy the old raw value to
  `profile:default:backup-v<N>` before the first write of a migrated save.
- Rollback below S-11: no reader, no writer; save survives (and the welcome appears for that session, since that
  build has no learner).

### 7. Lifecycle events (iPad Safari standalone, Android Chrome PWA)

- Chrome Page Lifecycle (https://developer.chrome.com/docs/web-platform/page-lifecycle-api): `hidden` is "the last
  state change that's reliably observable"; `unload` "extremely unreliable, especially on mobile"; a frozen page may
  be discarded without resuming. It recommends `IDBTransaction.commit()` in `freeze`/`visibilitychange` handlers;
  idb-keyval does not call it, but its one-put transaction auto-commits immediately.
- MDN `visibilitychange`: fires on app switch on mobile; use it, not `unload`.
- WebKit 199854 (open): `visibilitychange` fires on home button and tab switch, not on tab close or kill; `pagehide`
  not reliable on iOS. 205942: the switcher fires it late. WebKit 235579: a backgrounded process may abort an IDB
  transaction.
- iOS connection loss after resume: WebKit 197050 ("Connection to Indexed Database server lost"), 273827, 277615,
  201483; 309386 (recover IDB connections after network-process crash) RESOLVED FIXED for Safari 26 (which iOS 26.x
  ships it is unverified). Mitigation: on a failed get/set with `InvalidStateError`/`UnknownError`, make a new store
  with `createStore` and retry once; optionally re-create on `visible`.
- Net: the debounced save (~500 ms) is the main guarantee; at most the last ~500 ms of changes can be lost on an OS
  kill, and round end and purchase are immediate. Existing listener: `src/main.ts` `visibilitychange` (narrator cancel
  only) — the flush joins it.

### 8. Eviction and private mode

- WebKit ITP 7-day cap: home-screen web apps have their own day counter, reset by use; WebKit calls deleting their
  first-party data a "serious bug" (https://webkit.org/blog/10218/). Safari 17+ quotas ~60 % of disk per origin, LRU
  eviction of whole origins, persistent origins skipped (https://webkit.org/blog/14403/).
- `navigator.storage.persist()`: Safari 17+, Chrome; no prompt, heuristic grant (MDN). Plan §8 asks for it after
  start; call once after the first successful save, treat `false` as normal. The real backup is S-12's export.
- Private browsing: IDB works in memory on current Safari (unverified exact version); open may throw on old ones.
  Treat "IDB unavailable" as session-only play without a card (distinct from "save present but unreadable").

### 9. Failure surfacing and the error card

- `isFatalSignal` (`src/core/errorSignal.ts`): a rejection whose `name` is in `QUIET_REJECTIONS` (`AbortError`,
  `NotAllowedError`) is noise; every other rejection is fatal. So the save module must never leave a rejected promise
  unhandled. Keep `QUIET_REJECTIONS` as is (the observability follow-up is closed by making save errors never global).
- States the module can report (for the hook and, later, S-12's panel): `fresh` (no save), `loaded`, `unreadable`
  (corrupt/future: blocked, card), `unavailable` (no IDB: session only), last write ok/failed. A parent-facing
  "last save failed" line in settings is not needed in S-11 (decision 6 stands); what would change it is evidence of
  repeated silent failures on a device.
- Failed-load card: DOM, modelled on `src/ui/dom/errorCard.ts` `mountErrorCard`, holds the input switch through
  `openInputSession`; raw export of the untouched value. **A blob `<a download>` is unreliable in an iPad home-screen
  app**: WebKit 209407 (fails silently only when installed), 231892 (a window the child cannot close), 290847 ("Open
  in…" splash blocks the app, iOS 18.4), 275288 (nothing happens). `navigator.share({ files })` (Safari 15+, Chrome
  Android 89+, needs a tap; https://web.dev/web-share/) opens the share sheet with "Save to Files". Recommended flow:
  `canShare({ files })` → share a `text/plain` file `martynka-zapis.txt` (Chromium's share allow-list is believed to
  exclude `.json`; unverified, so check `canShare`); otherwise blob download (Android/desktop); a cancelled share
  (`AbortError`) is a quiet no-op. S-12's import should accept `.txt` and `.json`.
- `pl.errorCard.body` ("Dotknij przycisku, a gra uruchomi się od nowa.") can promise saved progress once the restart
  reloads into the last save; the boundary should not flush the save on a fatal error (the state at a throw is not
  known to be sound), so the promise is "almost all" (≤ ~500 ms lost). Copy + teacher read in the plan.

## Code References

- `src/main.ts` `createGame` / `callbacks.preBoot` — initial registry values, the S-11 replacement point
- `src/main.ts` `visibilitychange` listener — narrator cancel; flush joins here
- `src/core/types.ts` `SaveState`, `LearnerState`, `RoomState`, `Settings` — unused save type to replace
- `src/core/placement.ts` `SessionLearner`, `PlacedLearner`, `needsPlacement`, `initialSettings`, `changeStageByParent`
- `src/core/curriculum.ts` `calendarStart`, `startLearning` — calendar floor sits beside them
- `src/scenes/TaskScene.ts` `syncStars`, `finishRound`, `finishWarmup`, `closeUnlock`, `unlockView`, `create`
- `src/scenes/RoomScene.ts` `dispatch` (`changed`, `bought` branches)
- `src/scenes/UIScene.ts` settings callback (settings, `changeStageByParent`)
- `src/scenes/WelcomeScene.ts` `start`
- `src/scenes/BootScene.ts` `create` — `needsPlacement` on the loaded learner
- `src/core/errorSignal.ts` `QUIET_REJECTIONS`, `isFatalSignal`; `src/ui/dom/errorBoundary.ts` `installErrorBoundary`
- `src/ui/dom/errorCard.ts` `mountErrorCard`; `src/data/pl.ts` `errorCard`
- `src/testing/e2eHook.ts` `e2eStars`, `installE2EHook` — hook gains a read-only save status
- `src/core/rng.ts` header comment — mentions `rngSeed`
- `vite/config.shared.mjs` `buildId` (reads `GITHUB_SHA` first), `workbox`, `manualChunks`
- `src/pwa/registerServiceWorker.ts` `registerServiceWorker`
- `eslint.config.mjs` browser-globals block, core restrictions; `vitest.config.mts` (no environment)
- `playwright.config.ts` projects `chromium` / `chromium-hook`, `webServer` (4398 / 4397)

## Architecture Insights

- Pure in core, edges thin: `core/save.ts` (format), a core autosave scheduler (timers injected), `storage/idb.ts`
  (the only idb-keyval importer), wiring in `main.ts`. Scenes keep writing the registry; the autosaver listens to
  `changedata-<key>` for the five save keys (the registry already emits these; `UIScene` and `RoomScene` listen to
  `changedata-stars`) and exposes `flushNow()` that `RoomScene.dispatch` (`bought`) and `TaskScene.finishRound` call
  through a registry key — the snapshot is taken from the registry at write time, after both stars and learner are set.
- Balance number: debounce delay in `src/data/balance.ts` (scenes carry none).

## Historical Context (from prior changes)

- `context/archive/2026-10-13-first-furniture-purchase/follow-ups/review-fixes.md` — save after purchase (supported, in scope)
- `context/archive/2026-10-13-variant-change-room-done/follow-ups/review-fixes.md` — save after variant change; "room done seen" flag (not needed: card is event-driven)
- `context/archive/2026-10-13-adaptive-curriculum/follow-ups/review-fixes.md` — full `SessionLearner`, calendar floor, explicit keys, `pendingUnlock` as `{ stage, step }` (all supported by this research)
- `context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md` — persist `warmupPending`, `needsPlacement` on the loaded state (supported)
- `context/archive/2026-10-13-observability-c1-c2/follow-ups/review-fixes.md` — error card promise, `AbortError` noise list, `BootScene` font promise (addressed in §9 and §3)
- `context/archive/2026-10-13-parent-settings-progress/follow-ups/review-fixes.md` — history `example` persisted (supported); F7 out of scope

## Related Research

- `context/archive/2026-10-13-variant-change-room-done/research.md`, `context/archive/2026-10-13-first-furniture-purchase/research.md` (room state shape)

## Open Questions

- Export on real devices: share-first is recommended from WebKit bug reports (§9), but whether `canShare` accepts the
  `text/plain` file on the target Android tablet and the share sheet works on the iPad home-screen app needs a
  `[human]` device check row.
- Which iOS 26.x ships WebKit 309386 (IDB reconnect): unverified; the retry-once mitigation does not depend on it.
- Whether the failed-load card lets the child keep playing without saving, or waits for the parent: product choice
  for the plan (FR-021 forbids an empty game; it does not forbid a session-only game). Recommendation: the card offers
  export and "Graj dalej bez zapisu" behind the adult gate, autosave stays blocked.
- Risk #10 two-build e2e: in S-11 or deferred (§5); the plan decides and records it.
