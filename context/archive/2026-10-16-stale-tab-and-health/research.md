---
date: 2026-10-16T10:15:00+02:00
researcher: Claude (autonomous run 2026-10-16-fix-stale-tab-health, /10x-research step)
git_commit: e6b0006fb5d9d6be30110f52523bf1c2c489cb4a
branch: feat/stale-tab-and-health
repository: Martynka-urzadza
topic: "stale-tab-and-health: B-1 save guard (v3 runtime vs v4), P-1 service-worker install signal, G-1 UI art health, S-1 music status; candidates B-2, S-8, S-6"
tags: [research, save, autosave, idb, service-worker, pwa, sound, art-health, settings-panel]
status: complete
last_updated: 2026-10-16
last_updated_by: Claude (autonomous run, /10x-research step)
---

# Research: stale-tab-and-health

**Date**: 2026-10-16T10:15:00+02:00
**Researcher**: Claude (autonomous run 2026-10-16-fix-stale-tab-health)
**Git Commit**: e6b0006 (branch `feat/stale-tab-and-health`, cut from `main` 9a64fd6; the one commit on top is docs only)
**Branch**: feat/stale-tab-and-health
**Repository**: Martynka-urzadza

## Research Question

Derived from `change.md` (no user question beyond the change id): for the four HIGH findings of the observability audit 2026-10-16_0915 (PR #73, branch `docs/observability-audit-2026-10-15-fix-s16bcd`) — B-1, G-1, S-1, P-1 — find the existing code paths and the smallest honest data path for each, and decide the items `change.md` left to research:

1. **B-1** (central): (a) save format v4 with a write counter / writer id refused in `guardedPut`, (b) a runtime guard without a format change (`BroadcastChannel`, Web Locks, `controllerchange`), (c) a combination. What each protects, what it cannot, migration/rollback cost, test strategy, browser support (iPad Safari, Android Chrome). Recommend one; v3 or v4.
2. **P-1**: how the page observes a failed install of vite-plugin-pwa's generated `sw.js`, what `src/pwa/` does now, how (or whether) to learn the active worker's build id, keeping `src/core` pure.
3. **G-1, S-1**: existing runtime records and how the settings panel reads them; minimal data path.
4. **Candidates**: B-2 (child card on refusal), S-8 (`soundHealth` absent after the `catch`), S-6 (sound-pref write result dropped).
5. Design gaps (next free row) and `pl.ts` keys to extend.

## Summary

- **B-1 recommendation: (c) — save format v4 with a per-record `generation` + `writer` compare-and-set decided by a pure rule in `src/core/save.ts` and applied inside the existing one-transaction `guardedPut`, plus the `controllerchange` stale record (B-8) and the B-2 child card.** No Web Locks / `BroadcastChannel` in this slice (follow-up). Save format becomes **v4**. Reason: the case the audit names (an already-running OLDER build of the same format) can only be stopped by what that build already checks, which is `storedVersionNewer` → `stamp > version` (`src/core/save.ts` `storedVersionNewer`, used by `src/storage/idb.ts` `guardedPut`); every build from #69 on carries it, so only a version bump reaches them. The `generation`/`writer` pair then covers same-build and future-build tabs at the data layer, independent of any browser API.
- The v4 bump is a maintainer-level decision per audit § 6 ("zapis zostaje v3, chyba że opiekun zdecyduje o v4"); profile § 5 does not cover a format bump. **The ship step should stop at an open PR** (recorded in handoff § 5).
- **B-2: in** (a calm DOM card at the first refusal): the v4 guard refuses more often by design (any concurrent tab), and today a refusal only shows behind the adult gate (`src/core/saveHealth.ts` `offState`); without the card the child silently loses a whole session (FR-020 "po ponownym otwarciu stan jest identyczny").
- **S-8: in (light), no new copy**: in the `catch` of `BootScene.create` call `setMissing` with every boot effect key, so the existing `pl.settings.soundMissing(n)` line is honest.
- **S-6: in (light)**: keep the boolean that `SoundPrefStore.write` already returns (`src/storage/soundPrefs.ts`) in a runtime registry key and show one muted line; it is the same "Dźwięki" section S-1 edits. First to drop under phase-budget pressure.
- **P-1**: a failed precache never rejects `register()`; the page sees it as the installing worker's `statechange` → `redundant` with no newer worker replacing it. Record a runtime status (`unsupported | registering | installing | ready | install-failed | register-failed` + error name) through a pure reducer in `src/core`; the build id of the active worker is not needed (recommend: do not add one).
- **G-1**: a third `artHealth` record for `UI_ART` under a NEW registry key (`uiArtHealth`), never `REGISTRY_KEYS.artHealth` (that one feeds `TaskScene.freshRound` → `artFilter`).
- **S-1**: pass `SoundService.status().music` and `locked` (already computed, read only by the e2e hook) into the panel; split `'loading'` into `'loading'` and `'waiting-unlock'` (S-3) and guard `sound.play()` in the `start` closure (S-11).
- Design gaps: next free row **116** (`docs/design-gaps.md` ends at 115). Proposed rows 116-121 below.

## Detailed Findings

### B-1 — what exists

- `src/core/save.ts` `SAVE_VERSION` = 3; `NEWER_SAVE` = `'NewerSave'`; `storedVersionNewer(stored, version)` returns true only for an object with a finite numeric `version` strictly greater than `version`. Equal versions pass.
- `src/storage/idb.ts` `guardedPut(os, key, value)`: one `readwrite` transaction — `os.get(key)`, then `os.put` unless `storedVersionNewer(read.result, value.version)`; a failed read is `preventDefault`ed and the put still happens (so "Zastąp mimo to" keeps working). `createIdbSaveStore` `write` wraps it in `run` with `writeSeq` so an abandoned write is not retried once a newer one started; `backup(raw, from)` writes `${key}:backup-v${from}` with a plain `set` (overwrites).
- `src/core/autosave.ts` `createAutosaver` `attempt`: on `lastError === NEWER_SAVE` sets `blockedBy ??= 'newer'` and cancels the timer; `writesOff()` then stops every later write; `replace` refuses through `replaceGate` (`blockedBy 'newer'` → `'Blocked'`) and also turns a `NewerSave` from the store into `blockedBy 'newer'`.
- `src/core/saveHealth.ts` `offState`: `'newer'` → `{ kind: 'off', cause: 'newer', code }`; `src/ui/dom/saveHealthView.ts` `createSaveHealthView` shows `pl.settings.saveOff.newer` (DESIGN-GAP 113). Nothing else shows a refusal (no card).
- `saveProblem` (`src/core/save.ts`) checks the known keys only and does NOT reject extra keys; `encodeSave` writes only the known keys. So extra fields on a v3 record would be read by older v3 builds and dropped on their next write — they can detect nothing.
- `grep` over `src/` (checked on this branch): no `BroadcastChannel`, `navigator.locks`, write counter or build id in the record; `__BUILD_ID__` is used for display and export only (`src/main.ts`).
- Frozen fixtures: `tests/fixtures/save-v1.json`, `save-v1-fresh.json`, `save-v2.json`, `save-v2-fresh.json`, `save-v2-legacy-salon.json`, `save-v3.json`. Header comment of `src/core/save.ts`: "A change to the shape adds a version, a migration step in MIGRATIONS and a frozen fixture … it never edits an older fixture."
- Store tests: `tests/idbStore.test.ts` (fake-indexeddb 6.2.5) `describe('IndexedDB newer-save guard')` already models "a store holding version 4 refuses a v3 write from another store with NewerSave and keeps v4" — the exact pattern for the v4 proofs.

### B-1 — the three options compared

| | (a) v4 + `generation`/`writer` CAS in `guardedPut` | (b) runtime only, v3 (Web Locks steal / `BroadcastChannel` / `controllerchange`) | (c) = (a) + `controllerchange` record + B-2 card |
|---|---|---|---|
| Second tab, same build (from this fix on) | **yes** — a tab whose `base` generation is behind the stored one, written by another `writer`, is refused | yes, if the newest tab steals the lock (`navigator.locks.request(name, { steal: true }, …)`; the old holder's request rejects with `AbortError`) or announces itself on a channel; first-holder-wins would make the tab the child is USING read-only | yes |
| Already-running older build of v3 from #69 on (S-16b/c/d, the audit's case) | **yes** — it reads stored `version 4 > 3` and refuses (`storedVersionNewer`) | **no** — the old code takes no lock and listens on no channel | yes |
| Builds before #69 (no `guardedPut`, plain `set`) | no (nothing can reach them) | no | no |
| Import/reset in tab A reversed by tab B | yes (B's base is behind A's replace) | yes with steal/channel | yes |
| Old PWA instance (home-screen) | as tabs (same rule) | depends on the instance holding/hearing the lock while suspended (unverified on iPadOS) | yes |
| Signal that a newer build is deployed while playing | no | `controllerchange` (only from this build on) | yes (record only, no prompt — FR-003) |
| Format/migration cost | `MIGRATIONS[3]` (add `generation: 0`, `writer: ''`, `version: 4`), frozen `save-v4.json`, `backup-v3` copy under the existing policy, `validateSave` strict on the two fields, import of v1-v3 files goes through the chain | none | as (a) |
| Rollback cost | a rollback to any v3 build shows the `future` card ("Ten zapis pochodzi z nowszej wersji gry", `pl.saveFuture`) and plays without saving until roll-forward; `deploy/README.md` § 6 already says this for v3 and needs "v4" | none | as (a) |
| Browser API dependence | IndexedDB only (already required) | Web Locks and `BroadcastChannel`: Chrome 69 / 54, Safari (and iOS, mirrored) 15.4 (MDN browser-compat-data `api/LockManager.json`, `api/BroadcastChannel.json`, fetched 2026-10-16) | `controllerchange`: Chrome 40, Safari 11.1 |

**Recommendation: (c).** (b) alone leaves the audit's case open by construction and its liveness (who wins, bfcache, suspended home-screen instances) is unverified on iPadOS; (a) alone gives no early signal. (c) = data-level correctness in one place (`guardedPut`, which already holds the one transaction) + the cheapest signal (B-8) + an honest child-facing outcome (B-2).

**Rule sketch for the plan (to be pure in `src/core/save.ts`, replacing/extending `storedVersionNewer`):** each page load has a `writer` id (injected from `main.ts`, e.g. `crypto.randomUUID()` with a fallback — `src/core` may not touch `crypto`); the autosaver keeps `base` = the `generation` it loaded or last wrote. Inside the transaction: stored `version > mine` → `NewerSave` (unchanged); stored `generation > base` and stored `writer !== mine` → a new refusal (e.g. `OtherWriterSave`, a new `BlockReason` such as `'otherTab'`, or the same `'newer'` with a different cause — plan decides); otherwise put with `generation = max(stored.generation, base) + 1`, `writer = mine`, and the autosaver moves `base` on success. The `writer` check matters: an own write abandoned by `withTimeLimit` (`writeTimeoutMs`) may land later and raise the stored generation; without the writer id the same tab would refuse itself.
- `replace` (import/reset) should write over a higher stored `generation` (the parent chose it) but still refuse on `version` — keeps `replaceGate` as the one rule.
- A read error inside the transaction keeps today's behaviour (write through).
- Who stamps `generation`: the store, inside the transaction (only it knows the stored value atomically), using the pure rule — like `storedVersionNewer` today.

**What (c) still cannot do:** stop a pre-#69 build; save the refused tab's last unsaved changes (they are lost; the B-2 card tells the child to restart, the restart reads the other tab's newer save). A race of two first writes is "first writer wins" — the loser's session since its load is lost, which is why B-2 is needed.

**Inference, not verified:** on iPadOS a home-screen web app has storage separate from Safari tabs, so the Safari-tab-vs-PWA conflict may not exist there; on Android Chrome an installed PWA shares the origin's storage with tabs. Does not change the recommendation.

**Test strategy:**
- Unit (vitest, `src/core`): the pure verdict table (newer version, other writer ahead, own abandoned write, read error, empty store); `MIGRATIONS[3]` on the frozen `save-v3.json` (and v1/v2 fixtures through the chain) → new frozen `save-v4.json`; `importProblem` of v3 files; `saveHealthView` for the new cause.
- Store (fake-indexeddb, `tests/idbStore.test.ts` pattern): two `createIdbSaveStore` on one DB — A writes, B (stale base) refused, A's own late write accepted; a store simulating the v3 `guardedPut` (version 3) refused by a stored v4.
- Autosaver: refusal → block, timer cancelled, `replace` over a higher generation allowed.
- E2E (hook build, real IndexedDB, two pages from ONE context — `page.context().newPage()`; `tests/e2e/save-transfer.spec.ts` opens a second page in a NEW context (another device), so no existing spec has two pages in one context yet; profile § 9: pages in one context share IndexedDB): page A and B load; B earns/buys and flushes; A answers a task → A's write refused → A shows the B-2 card (DOM text); reload A → hook shows B's stars. Deliberate break: drop the generation check → A's write lands, assertion on B's stars goes red. A two-build e2e (old build vs v4) is the separate follow-up "E2E on two real builds" — the store test with a version-3 writer is the cheaper proof.

**Ship/maintainer:** v4 is a one-way door for children's devices (save.ts header) and audit § 6 makes it the maintainer's call: the ship step stops at an open PR. `deploy/README.md` § 6 rollback note must name v4; profile § 5 says "changes under `deploy/` are never shipped by a run" — the plan must decide whether a docs-only edit of `deploy/README.md` falls under it (it is not synced to the VPS) or carry the note elsewhere and leave a follow-up.

**Follow-ups this fires (v4):** P-8 (`backup-v2` overwritten by a second migration): with v4 the v3 → v4 copy goes to `backup-v3` through `createIdbSaveStore` `backup` (plain `set`); a pre-#69 build rewriting v3 over a v4 save would make the next load migrate again and overwrite `backup-v3` — recommend "keep the first copy" (do not overwrite an existing backup key) or record it as a follow-up. "Order of two cards (`future` vs `newer`)" and "E2E on two real builds" are triggered by v4: the plan takes them or re-triggers them. B-7 (`os.put` throwing synchronously inside the IDB handler) is in the function being rewritten: ride along (`try/catch` → `reject`).

### B-8 — `controllerchange` (stale build record)

- `src/pwa/registerServiceWorker.ts` `registerServiceWorker` registers `/sw.js` on `load`; no listener of any kind. `vite/config.shared.mjs` `pwaOptions.workbox`: `skipWaiting: true`, `clientsClaim: true`, `cleanupOutdatedCaches: true`.
- With `clientsClaim`, the FIRST install of a worker also fires `controllerchange` in the page (the page goes from no controller to a controller). The stale rule must therefore be: `navigator.serviceWorker.controller` was non-null at page start AND `controllerchange` fires → a newer worker (newer build) took over.
- PRD FR-003 ("Gra instaluje nową wersję sama przy następnym uruchomieniu, bez pytania") forbids a "reload to update" prompt: `controllerchange` should be a runtime record and a "Zapis gry"/offline line, not a card mid-play. The card (B-2) appears only on a refused write.

### P-1 — service-worker install signal

- Today: `register('/sw.js', { scope: '/' }).catch(() => undefined)`; skipped in dev (`import.meta.env.DEV`) and when `'serviceWorker' in navigator` is false. The e2e hook build (`dist-e2e/`) is a production build, so it registers too.
- A failed precache (one 404, quota) does not reject `register()`: the registration resolves, `registration.installing` (or a later `updatefound` → `registration.installing`) moves to `state === 'redundant'`. A worker also becomes `redundant` when a newer one replaces it, so "failed" = the tracked installing worker became `redundant` while no newer worker is `installing`/`waiting`/`active` in its place (`registration.active !== worker`).
- Observable events: `register()` rejection (name), `registration.installing` / `updatefound`, worker `statechange` (`installed`, `activating`, `activated`, `redundant`), `navigator.serviceWorker.controller`, `controllerchange`. Support: Chrome 40, Safari/iOS 11.1 (MDN BCD `api/ServiceWorkerContainer.json`, `api/ServiceWorker.json`).
- The page cannot learn WHY an install failed (the reason is only in the worker's console). Record the error name for a rejected `register()` only.
- Build id of the active worker: `sw.js` carries none, and the generated worker (`generateSW`, `injectRegister: null`) has no message handler. Options: switch to `injectManifest` with a custom worker answering `postMessage`, or compare precache revisions. **Recommend: not at all** — `controllerchange` (B-8) already says "a newer build took over", and install success/failure is what the parent needs. Re-trigger as a follow-up if a parent report needs the worker build.
- Purity: put the decision in a pure reducer in `src/core` (e.g. `swStatus(state, event)` over plain event objects — no `navigator`, ESLint boundary rules forbid browser globals there); `src/pwa/registerServiceWorker.ts` translates browser events and reports through a callback; `src/main.ts` stores it in a runtime registry key (outside `SAVE_KEYS`) after `createGame` (`registerServiceWorker()` is called at the end of `main.ts`). The settings panel reads it once when it opens, like `saveHealth`.
- Test: unit tests of the reducer (first install ok, install → redundant without replacement = failed, replaced by newer = not failed, register rejected with name, unsupported, controllerchange with/without an initial controller). E2E of a real install failure would need a 404 inside the worker's precache fetch; Playwright routing of service-worker requests is not a stable Chromium feature — the plan should use a hook-build seam for the panel line (marker in `vite/e2eHookGuard.mjs`) or keep it unit-only.
- Light ride-along F4 (`src/pwa/installHint.ts` `mountInstallHint`): the `beforeinstallprompt` listener keeps calling `preventDefault()` after "Graj w przeglądarce" (`dismiss` clears `onPromptAvailable` but not the listener). The "tap-through" follow-up is already closed: `mountInstallHint` takes `suspend` and releases it in `dismiss`.

### G-1 — UI art health

- `src/scenes/BootScene.ts` `create`: `artHealth(TASK_ART, …)` → `REGISTRY_KEYS.artHealth`; `artHealth(ROOM_ART…)` → `REGISTRY_KEYS.roomArtHealth`; sounds → `REGISTRY_KEYS.soundHealth`. `preload` queues `UI_ART` (the two loading pictures first, the rest in the `for (const art of UI_ART)` loop) but `create` builds no record for it.
- `src/core/artHealth.ts` `artHealth(entries, exists)` takes `{ key, id }[]` — `UI_ART` entries already have both, so `artHealth(UI_ART, key => this.textures.exists(key))` fits with no core change.
- `REGISTRY_KEYS.artHealth` is read by `src/scenes/TaskScene.ts` (`missingIds` → `src/core/round/artFilter.ts`). The UI record MUST get its own key (e.g. `REGISTRY_KEYS.uiArtHealth`, runtime only, not in `SAVE_KEYS`) so a missing wallet never skips MONEY_PAY (final-art-p2 decision 8).
- Panel path: `UIScene.openSettings` passes `artHealth` and `roomArtHealth` views to `openSettingsPanel`; `createArtHealthView(view, roomView?)` appends the room line. Add a third optional view and line; L-6 (section `data-state` = the worse of its lines; today it is the task line only) and L-8 (a unit test of `createArtHealthView` with all lines) fire because the function changes.
- Note: the panel shows the "Obrazki" section only when the task view is not `unknown` (`openSettingsPanel`), unchanged.

### S-1 / S-3 / S-11 — music status

- `src/ui/sound.ts` `SoundStatus` has `locked` and `music: 'off' | 'loading' | 'playing' | 'missing'`; `status()` returns them; only `src/testing/e2eHook.ts` `soundSnapshot` reads `music`/`locked`.
- `UIScene.openSettings` passes `sound: { prefs: sound.prefs(), missing: sound.status().missing.length }`; `SettingsPanelOptions.sound` is `{ prefs; missing }`; `openSettingsPanel` renders `soundMissing` (hidden when 0).
- `playMusic` sets `'loading'` and waits on `game.sound.once('unlocked', start)` while locked — the same state as a download in flight (`startMusic`), so the panel cannot tell "waits for a tap" (S-3). `start` calls `sound.play()` unguarded (S-11). `stopMusic` decides "waiting for the unlock" from `musicSound !== undefined`, which a separate state makes explicit.
- Minimal path: a new state `'waiting-unlock'` set in `playMusic`; `try` around `sound.play()` in `start` (→ `'missing'` + warn); pass `{ prefs, missing, music, locked }` to the panel; one muted line when music is on and the state is `missing` / `waiting-unlock` / `loading`. Rule of which line shows should be pure (e.g. in `src/core/sound.ts`, which already holds `soundOutcome`).

### Candidates

- **B-2 — in.** Refusals become more frequent with (c). Hook point: the autosaver knows the moment (`attempt` sets `blockedBy ??= 'newer'`); there is no listener today — an `onBlocked` option (or `main.ts` polling `status()`) lets `main.ts` mount a DOM card in the existing pattern (`src/ui/dom/saveFailedCard.ts`, `dialog.ts`, holding the input switch via `openInputSession`/`inputSuspender`). One button "Uruchom grę ponownie" → `window.location.reload()` (same as the error card). Shown once per page load.
- **S-8 — in (light).** `BootScene.create` `catch` ('Sound setup failed; playing without effects') leaves `setMissing` uncalled, so `SoundService` `missing` stays `[]`. `missing` is used only by `status()` (the panel count and the e2e hook), not by `play` (which checks the cache), so calling `setMissing` with every boot effect key in the `catch` makes the panel honest with the existing `pl.settings.soundMissing(n)` and no new copy.
- **S-6 — in (light, first to drop).** `UIScene.applySettings` calls `createSoundPrefStore(deviceStorage()).write(soundPrefs)` and drops the boolean. A runtime registry key (e.g. `soundPrefsKept: boolean`, also `false` when `deviceStorage()` is `undefined`) and one muted line "the setting holds until the game is closed" closes it.

### PRD anchors

- FR-020 (`context/foundation/prd.md`): automatic save, "po ponownym otwarciu stan jest identyczny" — B-1 and B-2.
- FR-021: old saves survive updates (versioned, migrated); a failed migration keeps the old save — v4 must add `MIGRATIONS[3]` and the backup copy.
- FR-003: silent update at the next launch, no prompt — `controllerchange` is a record, not a card.
- FR-001: offline from the home screen — P-1.
- Privacy (non-functional): nothing leaves the device — every record stays local.
- **PRD silent** on: two tabs or windows of the game, rollback of a release, a save written by an older build. Recommendation above; the scale note ("jedno dziecko na jednym urządzeniu") does not exclude two tabs on one device.

## Code References

- `src/core/save.ts` `SAVE_VERSION`, `NEWER_SAVE`, `storedVersionNewer`, `MIGRATIONS`, `saveProblem`, `encodeSave`, `decodeSave`, `importProblem`
- `src/storage/idb.ts` `guardedPut`, `createIdbSaveStore` (`write`, `backup`, `run`, `writeSeq`)
- `src/core/autosave.ts` `createAutosaver` (`attempt`, `writesOff`, `replace`), `replaceGate`, `BlockReason`, `withTimeLimit`
- `src/core/saveHealth.ts` `offState`, `saveHealthView`; `src/ui/dom/saveHealthView.ts` `createSaveHealthView`
- `src/pwa/registerServiceWorker.ts` `registerServiceWorker`; `src/pwa/installHint.ts` `mountInstallHint`; `vite/config.shared.mjs` `pwaOptions`
- `src/scenes/BootScene.ts` `preload` (UI_ART loop), `create` (art/room/sound records, sound `catch`)
- `src/core/artHealth.ts` `artHealth`, `artHealthView`; `src/ui/dom/artHealthView.ts` `createArtHealthView`; `src/data/uiArt.ts` `UI_ART`
- `src/scenes/TaskScene.ts` `freshRound` (reads `REGISTRY_KEYS.artHealth` for `artFilter`)
- `src/scenes/UIScene.ts` `openSettings`, `applySettings`
- `src/ui/sound.ts` `SoundStatus`, `createSoundService` (`playMusic`, `startMusic`, `stopMusic`, `status`, `setMissing`)
- `src/storage/soundPrefs.ts` `createSoundPrefStore` (`write` returns boolean), `deviceStorage`
- `src/ui/dom/settingsPanel.ts` `SettingsPanelOptions`, `openSettingsPanel`
- `src/data/layout.ts` `REGISTRY_KEYS` (`artHealth`, `roomArtHealth`, `bootLoad`, `soundPrefs`, `soundHealth`)
- `src/testing/e2eHook.ts` `E2ESaveSeam` (`'newer'`), `soundSnapshot`
- `tests/idbStore.test.ts` `describe('IndexedDB newer-save guard')`; `tests/fixtures/save-v3.json`; `tests/e2e/save-transfer.spec.ts` (second page in a new context = another device)

## Design gaps and copy

The kit has no settings view (gaps 25-28); `docs/design-gaps.md` ends at row **115**. Rows the plan should add (numbers in order of the phases; wording left to the plan, keys proposed):

| Row | View | Proposed `pl.ts` keys |
|---|---|---|
| 116 | "Obrazki": third line for the screen pictures (G-1) | `pl.settings.uiArtOk`, `pl.settings.uiArtMissing(count, total)` (verb agreement as `artMissing`) |
| 117 | "Dźwięki": music status line (S-1/S-3) | `pl.settings.musicStatus.{loading, waitingUnlock, missing}` |
| 118 | "Dźwięki": setting kept only for this session (S-6) | `pl.settings.soundPrefsNotKept` |
| 119 | "Zapis gry": refusal because another tab/window saved later (B-1) and the stale-build line (B-8) | `pl.settings.saveOff.<newCause>` (e.g. `otherTab`), `pl.settings.staleBuild` |
| 120 | child-facing card at the first refused write (B-2) | `pl.saveRefused.{title, body, restart}` |
| 121 | offline readiness line (P-1) | `pl.settings.offline.{ready, installing, failed, registerFailed, unsupported}` (+ heading if a new section) |

`pl.settings.saveOff.newer` keeps its text for the version case.

## Architecture Insights

- Runtime health records follow one pattern: computed once (BootScene / autosaver), kept in a `REGISTRY_KEYS` entry outside `SAVE_KEYS`, read once by `UIScene.openSettings`, turned into a view by a pure `src/core` function, rendered by a `src/ui/dom/*View.ts` with copy from `pl.ts` and a DESIGN-GAP comment. G-1, S-1, S-6 and P-1 all fit it.
- The store owns atomicity (`guardedPut` one transaction), the core owns the rule (`storedVersionNewer`), the autosaver owns the block state. The v4 CAS keeps that split.
- Save versions are one-way doors; each adds a migration + frozen fixture + backup copy key.

## Historical Context (from prior changes)

- `context/archive/2026-10-16-salon-extra-slots/plan.md`: risk "A still-open S-16c tab or PWA instance can overwrite…", decision "No action" — supported (still open, = B-1).
- `context/archive/2026-10-15-salon-load-health/follow-ups/review-fixes.md` "Two tabs of one origin (`BroadcastChannel`)", trigger "a parent report … or the next save-format change (v4)" — fired by this change; this research recommends the record-level guard instead of `BroadcastChannel` and re-triggers the channel as a follow-up (earlier signal only).
- `context/archive/2026-10-15-load-and-tab-guard/follow-ups/review-fixes.md`: P-8 (`backup-v2` overwritten by a second migration, trigger v4) — fired if v4; B-2 card — taken.
- `context/archive/2026-10-16-final-art-p2/follow-ups/review-fixes.md` decision 8 (UI art not counted) — fired; the constraint (no `artFilter` feed) holds.
- `deploy/README.md` § 6: rollback note for v3 (`pl.saveFuture` card) — supported, needs a v4 version.

## Related Research

- `context/archive/2026-10-15-load-and-tab-guard/` (the `guardedPut` change, #69) and `context/archive/2026-10-15-salon-load-health/` (save v3) — research artifacts in those folders, where present.

## Open Questions

- Maintainer: v4 allowed for this run? (Recommendation: yes; ship stops at an open PR either way.)
- Whether a docs-only edit of `deploy/README.md` counts as "a change under `deploy/`" for profile § 5 (plan decides; fallback: follow-up).
- One `BlockReason` for both refusals or a new one (`'otherTab'`): affects `replaceGate`, `offState`, `deviceSaveView` callers — plan decides; recommendation: a new reason so the parent line can tell "another window" from "newer version".
- Not verified: iPadOS storage separation of home-screen apps; Web Locks behaviour of a suspended page (irrelevant to the recommendation).
