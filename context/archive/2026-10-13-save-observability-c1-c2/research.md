---
date: 2026-10-13T16:33:11+02:00
researcher: Claude (autonomous run 2026-10-13-fix-save-observability, research step)
git_commit: 1e17ccf266a27b65efc7b6b9a856d347c8a1214c
branch: feat/save-observability-c1-c2
repository: Martynka-urzadza
topic: "Save health visible to the parent, the cause of a failed read, a load timeout and the unknown-room repair (C-1, C-2, H-R3, M-R6, M-S5, M-S4)"
tags: [research, autosave, save, settings-panel, room-scene, e2e-hook, observability]
status: complete
last_updated: 2026-10-13
last_updated_by: Claude (autonomous run, research step)
---

# Research: save health, failed-read cause, load timeout, unknown-room repair

**Date**: 2026-10-13T16:33:11+02:00
**Git Commit**: `1e17ccf` (branch `feat/save-observability-c1-c2`, cut from `main` @ `4698110`; only the change identity commit on top)
**Repository**: Martynka-urzadza

## Research Question

From `change.md` (decisions 1–8) and the run prompt: (1) where `AutosaveStatus` grows (`blockedBy`, last error name,
last successful write time, consecutive failures) without touching the saved v1 shape; (2) how the settings panel shows
a save-health line from `saver.status()` and how it refreshes; (3) the pre-game card for `unavailable`/timeout — reuse of
`mountSaveFailedCard` or a variant, and how "Graj dalej" behaves; (4) the load timeout (injected timers, value in
`balance.save`, a late read after the timeout); (5) the unknown-`currentRoom` repair at load and `RoomScene` reading room
and state from one id; (6) the `?e2eSave=unavailable` seam and how e2e proves the timeout without `page.clock`;
(7) Polish copy; plus the cheapness of M-R5 and M-S2 (change.md decision 1).

## Summary

All six questions have a code-backed answer; nothing needs a save-format change.

1. **Status** lives entirely in the closure of `src/core/autosave.ts` `createAutosaver`; `status()` builds a fresh object
   each call and `SaveState`/`encodeSave` (`src/core/save.ts`) never see it. New fields go into `AutosaveStatus` plus one
   injected `now: () => number` in `AutosaverOptions` (the module already injects `timers`; tests already have a manual
   clock, `tests/autosave.test.ts` `makeClock`, whose `now` only needs exposing). `block(reason)` must keep the reason.
   `LoadOutcome`'s `unavailable` variant gains `error: string` (error name or `'timeout'`).
2. **Panel**: the saver is in the registry (`REGISTRY_KEYS.saver`, set in `src/main.ts` `start`); `UIScene.openSettings`
   is the only opener of `openSettingsPanel`. Pass a pure view (`saveHealthView(status, now)` in core) as a new option,
   rendered by a small DOM section like `createProgressView`. A snapshot at open is enough (see Detailed Findings).
3. **Card**: `mountSaveFailedCard` hard-codes the export button and the `pl.saveFailed` copy. Parametrise it (copy group +
   optional `onExport`) rather than writing a second card. In `start`, the same `await new Promise(... onContinue ...)`
   pattern applies; "Graj dalej" then starts a fresh session with the saver blocked, exactly like `unreadable`.
4. **Timeout**: `loadSave(store, { timers, timeoutMs })` racing the read; the abandoned read promise needs its own
   `.catch` or a late rejection reaches `installErrorBoundary`'s `unhandledrejection` listener and shows the fatal card.
   A late success is harmless: `loadSave` never writes and the saver has no unblock path. Value: `balance.save.loadTimeoutMs`.
5. **Room repair**: a pure core function with known room ids as a parameter, called in `start` on the `loaded` branch
   next to `floorToCalendar`; it runs before `createGame`'s `preBoot` and before the registry listeners exist, so it
   writes nothing by itself. `RoomScene` should derive `room` and `state` from one resolved id.
6. **E2E**: extend `e2eSave` to return `'unavailable'` (and optionally `'hang'`); the marker `e2eSave` already sits in
   `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`, so no guard change. Timeout proof: a hang store plus a short timeout
   chosen by the seam in the hook build only — no `page.clock` (project rule, `context/foundation/test-plan.md`).

M-R5 (data tests over every `ROOMS` entry) is a few-line test change — cheap, include. M-S2 (`persist()` result) needs a
new async channel from `src/storage/idb.ts` `requestPersistence` into the status — not trivially adjacent, follow-up.

## Detailed Findings

### 1. `AutosaveStatus` — where the new fields go (C-1, C-2, M-S5)

- `src/core/autosave.ts` `AutosaveStatus` today: `load, blocked, dirty, writes, failures, skipped, lastReason`.
  `createAutosaver` keeps them as closure `let`s and `status()` returns
  `{ load: options.load, blocked, dirty, writes, failures, skipped, lastReason }` — a runtime object, never encoded.
- The saved shape is produced only by `src/core/save.ts` `encodeSave(session)`, whose input is `SessionSave`
  (`stars, rooms, currentRoom, settings, learner`) taken from `snapshot()`; `AutosaveStatus` is not reachable from it.
  So the fields can grow with `SAVE_VERSION` staying 1 and no fixture change (`tests/fixtures/save-v1-*.json`).
- Proposed additions (all runtime):
  - `blockedBy: 'unreadable' | 'unavailable' | 'fatal' | null` — set from `options` at creation (load kind) and by
    `block(reason)`; `Autosaver.block(reason: string)` should narrow its type to the union. Today `block: () => {...}`
    drops the argument; the only caller is `src/main.ts` `installErrorBoundary` callback → `booted.saver?.block('fatal')`.
    First reason wins (a fatal after `unavailable` keeps the original cause) — a choice for the plan.
  - `lastError: string | null` — the error's `name` only (`(e as {name?}).name ?? 'Error'`), never message or stack.
    The `validateSave` branch of `attempt` throws a plain `Error('autosave: encoded state does not validate')`; give
    it a distinct name (e.g. `'InvalidSave'`) so the line can tell "state rejected" from "storage failed".
  - `lastWriteAt: number | null` — set from the injected clock in `attempt` after `store.write` resolves.
  - `consecutiveFailures: number` — `++` in the `attempt` catch, `= 0` on success. (`failures` stays the lifetime count;
    `tests/autosave.test.ts` asserts it in "…failures: 2…".)
- Clock: `AutosaverOptions` has `timers` but no `now`. Add `now: () => number`; `src/main.ts` passes `() => Date.now()`.
  `tests/autosave.test.ts` `makeClock` already tracks `now` internally; exposing it is the only test-helper change.
- `LoadOutcome` `{ kind: 'unavailable' }` → `{ kind: 'unavailable'; error: string }`. Two places branch on it:
  `src/main.ts` `start` (`blocked: … || outcome.kind === 'unavailable'`) and the `load: LoadOutcome['kind']` status
  field (unchanged). `tests/autosave.test.ts` "reads once and reports fresh / loaded / unreadable / unavailable…"
  asserts `toEqual({ kind: 'unavailable' })` and must change with the type.
- Logging: `start` today logs only `unreadable` (`console.warn(\`Save unreadable (...)\`)`); add the same for
  `unavailable` with the error name. Write failures keep `log('autosave: write failed', e)` → `console.error` in
  `main.ts`; that is a device-only console, not telemetry (contract: nothing leaves the device).
- The e2e hook `src/testing/e2eHook.ts` `save` returns `deepFreeze({ ...saver.status() })`, so new primitive fields reach
  the hook snapshot with no hook change.

### 2. Settings panel save-health line (C-2, M-R6)

- Saver location: `src/main.ts` `start` → `game.registry.set(REGISTRY_KEYS.saver, saver)`; key documented in
  `src/data/layout.ts` `REGISTRY_KEYS.saver`. Also kept in `booted.saver` for the boundary.
- The only opener is `src/scenes/UIScene.ts` `openSettings` (gear long press → `openParentGate` → `onPass` →
  `openSettingsPanel({...})`). It already reads registry state (learner, settings) at that moment and passes a
  precomputed `progress: progressView(...)` — the same shape fits `saveHealth: saveHealthView(saver.status(), Date.now())`.
  Scenes must not hold texts or numbers; the pure mapping (status → `{ kind: 'ok' | 'failing' | 'off'; cause?; lastWriteAt? }`)
  belongs in `src/core/` (e.g. next to `src/core/progress.ts`), the words in `pl.settings`, the DOM in a new
  `src/ui/dom/saveHealthView.ts` modelled on `src/ui/dom/progressView.ts` `createProgressView` (renders, computes nothing).
- Refresh: the panel is modal (it holds the input switch through `openInputSession`; the game is paused under it), so
  the only writes that can happen while it is open are `flush('hidden')` on `visibilitychange`/`pagehide` (`main.ts`).
  A snapshot at open is therefore accurate; reopening re-reads. The `watchVoice` subscribe/unsubscribe pattern in
  `src/ui/dom/settingsPanel.ts` would need an event channel the autosaver does not have — not worth it.
- Reachability: `openSettings` returns early when there is no learner, i.e. before the welcome is passed. For
  `unavailable`, the parent cannot see the line until after the welcome — which is why the pre-game card (§3) is
  still needed (change.md decision 2 stands).
- Testability: the settings panel e2e (`tests/e2e/parent-settings.spec.ts`) already reaches the panel; one assertion of
  the "ok" line after a normal write is enough there; the "off" line belongs to the `unavailable` spec.

### 3. The pre-game card for `unavailable` / timeout

- `src/ui/dom/saveFailedCard.ts` `mountSaveFailedCard(parent, { onExport, onContinue })` reads `pl.saveFailed.*`
  directly and always builds the export button. For `unavailable` there is no raw value to export (the read threw).
- Recommended: one card function with the copy group and an optional `onExport` (no button when absent), and a new
  copy group (e.g. `pl.saveUnavailable`) — the look (DESIGN-GAP 42, `role="alertdialog"`, focus on "Graj dalej") stays
  shared. A second near-identical card would duplicate the overlay wiring; rejected.
- `src/main.ts` `start` wraps the unreadable card in `await new Promise<void>(resolve => … onContinue: () => { card.remove(); resolve(); })`.
  Running the same block for `unavailable` gives identical "Graj dalej" behaviour: the game starts afterwards with
  `freshSession(0)` (the `else` branch; `?e2eStars` seeds only `fresh`) and `createAutosaver({ blocked: true })`; the
  `booted.failed` check after the card still applies. The card returns at the next launch only if the read still fails.
- Routine-ness (decision 2's reversal condition): **inference, not verified in this session** — current Safari (since
  14.x), Chrome and Firefox (since 115) give private windows a working, ephemeral IndexedDB, so `unavailable` is not the
  normal path on the target iPad/Android tablets; it signals blocked storage or a broken database. The card is kept.
  If device testing shows otherwise, the plan's stated fallback is the panel line only.

### 4. Load timeout (M-S4)

- `src/main.ts` `start`: `const outcome = await loadSave(store);` with no limit. `src/storage/idb.ts`
  `createIdbSaveStore` → `run` retries once on `InvalidStateError`/`UnknownError` but has no timeout; idb-keyval's
  `createStore` opens the database lazily on the first operation, so a hung `indexedDB.open` hangs inside `read`.
  A timeout around `store.read()` in `loadSave` therefore covers both the open and the get; no limit is needed in
  `src/storage` (change.md decision 5's reversal condition does not apply).
- Shape: `loadSave(store, { timers, timeoutMs })` (optional second argument keeps existing tests valid), racing
  `store.read()` against `timers.setTimeout`; on timeout → `{ kind: 'unavailable', error: 'timeout' }`; clear the timer
  when the read wins.
- **Late rejection hazard**: the abandoned `read` promise must get `.catch(() => undefined)` (or the race must consume
  it). Otherwise a read that rejects after the timeout is an unhandled rejection; `src/ui/dom/errorBoundary.ts` listens
  to `unhandledrejection` and `src/core/errorSignal.ts` `isFatalSignal` treats every name outside
  `QUIET_REJECTIONS` (`AbortError`, `NotAllowedError`) as fatal → error card over a running game. A unit test must
  cover "read rejects after the timeout → no unhandled rejection".
- **Late success**: harmless by construction. `loadSave` never writes (`tests/autosave.test.ts` "…without ever
  writing"); the saver is created with `blocked: true` for `unavailable` and `Autosaver` exposes no unblock. The late
  value is simply dropped; nothing may "upgrade" the session to it (that would race the child's play).
- Value: `src/data/balance.ts` `balance.save` holds only `debounceMs: 500`; add `loadTimeoutMs` there. Suggested 5000 ms:
  long enough for a cold IndexedDB open on an older iPad, short enough that a blank page is not mistaken for a crash.
  The page is blank during the read (the game is created after it), so the value is a trade-off the plan should name.

### 5. Unknown `currentRoom` repair (H-R3)

- `src/core/save.ts` `validateSave` guarantees `currentRoom ∈ rooms` (own property) but not `currentRoom ∈ ROOMS`
  nor `FIRST_ROOM ∈ rooms`. `ROOMS` = `{ salon }` (`src/data/rooms.ts`), `FIRST_ROOM = 'salon'`. Core has no import
  from `src/data/` (grep of `src/core` for `../data`: none), so known ids come in as a parameter.
- Pure function (e.g. `repairCurrentRoom(session, knownIds, firstRoom)` in `src/core/rooms.ts`): if `currentRoom` is
  known → same object, `repairedFrom: null`; else `currentRoom = firstRoom`, `rooms[firstRoom] ??= emptyRoomState()`,
  every other room (including the unknown one) copied untouched; returns `repairedFrom: <old id>` for the log.
  Preserving the unknown room keeps its state for a later build that knows it; `encodeSave` copies all rooms and the
  repaired value still passes `validateSave` (`firstRoom` is now in `rooms`).
- Placement: `src/main.ts` `start`, `outcome.kind === 'loaded'` branch, beside `floorToCalendar`, with
  `console.warn` naming the old id. Not in `decodeSave`/`toSession`: those are data-free and `decodeSave` is also the
  future import validator (S-12). Nothing is written: `createGame` → `preBoot` sets the registry before
  `game.registry.events.on('changedata'/'setdata', onChange)` is attached, so the repaired session reaches disk only on
  the first real change — after a successful read (S-11 rule held).
- `src/scenes/RoomScene.ts`: `room()` = `ROOMS[roomId()] ?? ROOMS[FIRST_ROOM]` while `roomState()` = `rooms[roomId()]`;
  `dispatch` writes `rooms[room.id]` with a state computed from `rooms[roomId()]`. Fix: one private resolver returning
  `{ room, state }` where `state = rooms[room.id] ?? emptyRoomState()`; every method that calls `room()` (six call sites at
  `1e17ccf`, including `dispatch` and `redraw`) uses it. `src/scenes/TaskScene.ts` `nextRoomTaskCost` returns
  `null` for an unknown id, which the repair makes unreachable; leave it.

### 6. E2E seams

- `src/testing/e2eHook.ts` `e2eSave(search)` returns `'unreadable' | null`; `e2eSaveStore()` builds the in-memory store.
  `src/main.ts` picks it with `__E2E_HOOK__ && e2eSave(...) === 'unreadable'`. Extend to `'unavailable'` (read rejects
  with a named error, e.g. `DOMException('e2e', 'UnknownError')`) and `'hang'` (read never settles), each a parameter of
  `e2eSaveStore(kind)`.
- Guard: `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS` already contains `'e2eSave'` and the string stays in the hook build
  (the query key); no new marker, so follow-up F4 (`tests/e2eHookGuard.test.ts` explicit cases) is not triggered by a
  guard change — the plan may still take it (cheap). `tests/e2eSave.test.ts` must grow the new values.
- Timeout without `page.clock`: `context/foundation/test-plan.md` "Never `page.clock`" (Phaser tweens freeze). Two
  options: (a) `?e2eSave=hang` plus the real `balance.save.loadTimeoutMs` — the spec waits ~5 s for the card; (b) the
  hook build passes a short timeout (e.g. 200 ms) when `e2eSave === 'hang'`. Prefer (b): the override is chosen in the
  hook-build branch of `start` only (guarded by `__E2E_HOOK__`, stripped from `dist/`), and the unit test proves the real
  value path. Either way the spec asserts the card, then "Graj dalej", then `snapshot.save` `{ load: 'unavailable',
  blocked: true, blockedBy: 'unavailable', lastError: 'timeout' }` and `writes: 0` after an age tap — modelled on
  `tests/e2e/save-restart.spec.ts` "#2 FR-021 an unreadable save…".
- Fresh device = new browser context (Playwright default per test); no IndexedDB access from the test.

### 7. Polish copy (all new, teacher read required)

Existing `pl.saveFailed`: `title` "Nie udało się wczytać zapisu", `body`, `export` "Zachowaj kopię", `continue`
"Graj dalej", `note` "Tym razem gra nie zapisze postępów.". Reusable as-is for the unavailable card: `continue`, `note`.
Suggested new strings (calm, adult-facing, no technical names, no numbers needing numeral agreement):

- Card (`pl.saveUnavailable`): title "Gra nie może teraz zapisywać postępów", body "Przeglądarka nie pozwoliła
  odczytać zapisu. Możesz grać dalej; jeśli to się powtarza, sprawdź, czy przeglądarka nie blokuje danych stron."
- Panel (`pl.settings`): heading "Zapis gry"; ok "Postępy zapisują się na tym tablecie." (optionally
  "Ostatni zapis: {HH:MM}" via `toLocaleTimeString('pl-PL', …)` in the DOM layer); failing "Ostatnie próby zapisu się
  nie udały. Postępy z tej gry mogą nie zostać zachowane."; off-unreadable "Zapis jest wyłączony: starego zapisu nie
  udało się wczytać."; off-unavailable "Zapis jest wyłączony: przeglądarka nie pozwoliła odczytać zapisu.".
  A count of failures would need `src/core/text/plural.ts` agreement ("1 raz / 2 razy / 5 razy" — irregular); keep the
  number in the hook/console only.

## Code References

- `src/core/autosave.ts` `AutosaveStatus`, `AutosaverOptions`, `LoadOutcome`, `loadSave`, `createAutosaver` (`attempt`, `block`, `status`)
- `src/main.ts` `start` (store choice, `loadSave`, unreadable card, `freshSession`, `createAutosaver` options, registry), `installErrorBoundary` callback (`block('fatal')`)
- `src/core/save.ts` `validateSave`, `encodeSave`, `toSession`, `decodeSave`, `SAVE_VERSION`
- `src/ui/dom/saveFailedCard.ts` `mountSaveFailedCard`; `src/ui/dom/settingsPanel.ts` `openSettingsPanel`; `src/ui/dom/progressView.ts` `createProgressView`
- `src/scenes/UIScene.ts` `openSettings`; `src/scenes/RoomScene.ts` `roomId`, `roomState`, `room`, `dispatch`; `src/scenes/TaskScene.ts` `nextRoomTaskCost`
- `src/data/balance.ts` `balance.save`; `src/data/layout.ts` `REGISTRY_KEYS.saver`; `src/data/pl.ts` `saveFailed`, `settings`; `src/data/rooms.ts` `ROOMS`, `FIRST_ROOM`
- `src/storage/idb.ts` `createIdbSaveStore` (`run`, `LOST_CONNECTION`), `requestPersistence`
- `src/core/errorSignal.ts` `QUIET_REJECTIONS`, `isFatalSignal`; `src/ui/dom/errorBoundary.ts` `installErrorBoundary`
- `src/testing/e2eHook.ts` `e2eSave`, `e2eSaveStore`, `save`; `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`
- `tests/autosave.test.ts` `makeStore`, `makeClock`; `tests/e2eSave.test.ts`; `tests/e2eHookGuard.test.ts`; `tests/roomsData.test.ts` `salon data`; `tests/e2e/save-restart.spec.ts`

## Architecture Insights

- The S-11 rule set holds: the store, clock and log are injected into core; the only browser binding is `main.ts`.
  Every new dependency (clock, timeout timers, known room ids) follows that pattern.
- Signals stay on the device: console + a parent-only DOM line/card. No new channel leaves the tablet.
- Defence in depth for H-R3: data-aware repair at the edge (`main.ts`) + a scene that cannot mix two ids.

## Historical Context (from prior changes)

- `context/archive/2026-10-13-autosave-versioned-save/` — S-11: decision "nothing is shown" (DESIGN-GAP 43, now revisited);
  follow-up F3 (`?e2eSave=unavailable` + spec, Trigger: next change to `start()` / `e2eSaveStore`) — in scope here;
  F4 (guard test cases) — conditional, not triggered by a guard edit.
- `context/archive/2026-10-13-observability-c1-c2/` — same audit → fix pattern; error boundary and `QUIET_REJECTIONS`.
- `docs/design-gaps.md` rows 42–44: unreadable card, "nothing shown", export file. Row 43 is to be rewritten; a new row
  (45) for the unavailable card variant if the copy differs.

## Related Research

- `context/archive/2026-10-13-autosave-versioned-save/research.md`

## Open Questions (decisions for the plan, with recommendations)

1. First `blockedBy` reason wins vs last — recommend first (the original cause is the useful one).
2. Timeout value — recommend 5000 ms in `balance.save.loadTimeoutMs`; e2e override through the hook-build branch only.
3. Clock time in the panel "ok" line — optional; recommend yes ("Ostatni zapis: 14:05") via `toLocaleTimeString` in the DOM layer, `lastWriteAt` from core.
4. M-R5: include the `tests/roomsData.test.ts` loop over `Object.values(ROOMS)` (test-only, a few lines). M-S2, M-S3,
   M-R4, L-*: follow-ups with `Trigger:` lines.
