# Stale-tab save guard, UI art health, music status and service-worker install signal — Implementation Plan

## Overview

A fix slice for the four HIGH findings of the observability audit 2026-10-16_0915 (PR #73): **B-1** (a stale tab or
an older build of the same save format silently overwrites newer progress), **G-1** (no health record for the UI art),
**S-1** (music that failed or waits for a tap shows as "Włączone"), **P-1** (a failed service-worker registration or
install is swallowed). Ride-alongs where the same symbol is edited: B-2 (child card on a refused write), B-7
(`os.put` throwing inside `guardedPut`), B-8 (`controllerchange` stale-build record), S-3, S-11, S-8, S-6, F4
(`beforeinstallprompt` listener), L-6/L-8 (art section state and test).

The save format becomes **v4** (`generation` + `writer`, compare-and-set inside the one IndexedDB transaction). The run
ships to production (orchestrator decision 1, maintainer's Step 0 choice); the v4 one-way door is a `[human]` row and a
Known risk.

## Current State Analysis

Grounded in `research.md` (Code References are the source; not re-searched) and re-read on this branch:

- `src/core/save.ts`: `SAVE_VERSION = 3`, `MIGRATIONS = { 1, 2 }`, `storedVersionNewer(stored, version)` = numeric
  `stamp > version`; `saveProblem` checks known keys only (extra keys pass, `encodeSave` drops them), so a v3 record
  cannot carry a guard old v3 builds would respect. Header: every shape change adds a version, a migration step and a
  frozen fixture; older fixtures never change.
- `src/storage/idb.ts` `guardedPut`: one `readwrite` transaction, `get` then `put` unless `storedVersionNewer`;
  a failed read is prevented and the put still happens; `os.put` is called without `try` (B-7).
  `createIdbSaveStore` `write` (with `writeSeq` retry guard), `backup(raw, from)` → `${key}:backup-v${from}` (plain `set`).
- `src/core/autosave.ts`: `SaveStore { read; write(value); backup }`; `BlockReason = 'unreadable' | 'unavailable' |
  'fatal' | 'newer'`; `attempt` and `replace` turn `NEWER_SAVE` into `blockedBy ??= 'newer'`; `replaceGate` is the one
  overwrite rule (`newer` → `Blocked`); a migrated load copies the raw previous save once before the first write
  (`backupAttempts` policy, key from `migrated.from`).
- `src/core/saveHealth.ts` `offState` (`newer` → `pl.settings.saveOff.newer`, gap 113); `src/core/saveFile.ts`
  `deviceSaveView` (`cause` union incl. `newer`) and `src/ui/dom/saveSummaryView.ts` `blockedText`. No child-facing
  signal for any refused write.
- `src/pwa/registerServiceWorker.ts`: `register('/sw.js').catch(() => undefined)`, no lifecycle listener;
  `vite/config.shared.mjs`: `skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches`. A failed precache does not reject
  `register()`: the installing worker turns `redundant`.
- `src/scenes/BootScene.ts` `create`: `artHealth` records for `TASK_ART` (`REGISTRY_KEYS.artHealth`, feeds
  `TaskScene.freshRound` → `artFilter`) and `ROOM_ART` (`roomArtHealth`), sound effects (`soundHealth`, `setMissing`);
  `UI_ART` is loaded but never counted; the sound `catch` leaves `setMissing` uncalled (S-8).
- `src/ui/sound.ts`: `SoundStatus.music: 'off' | 'loading' | 'playing' | 'missing'`, `locked`; `playMusic` uses
  `'loading'` both for a download and for waiting on the audio unlock (S-3); `sound.play()` in its `start` closure is
  unguarded (S-11). `UIScene.openSettings` passes only `{ prefs, missing }`; `applySettings` drops the boolean of
  `createSoundPrefStore(...).write` (S-6).
- `src/pwa/installHint.ts` `mountInstallHint`: `dismiss` clears the callback but the `beforeinstallprompt` listener keeps
  calling `preventDefault()` (F4).
- Fixtures `tests/fixtures/save-v1.json`, `save-v1-fresh.json`, `save-v2.json`, `save-v2-fresh.json`,
  `save-v2-legacy-salon.json`, `save-v3.json`. E2E specs asserting `writtenVersion` 3: `salon-load-health`,
  `save-backup-health`, `salon-art`, `save-migration`; `load-and-tab-guard` uses `SAVE_VERSION + 1`.
- No e2e spec opens two pages in ONE browser context (`save-transfer.spec.ts` uses a new context = another device).
- `docs/design-gaps.md` ends at row 115. `context/foundation/lessons.md` does not exist.

## Desired End State

- Save format **v4** = v3 + `generation: number` (whole, ≥ 0) + `writer: string`. A store write is decided inside its
  one transaction by a pure rule: stored `version` above mine → `NewerSave` (unchanged); stored `generation` above the
  page's `base` AND stored `writer` ≠ mine → `OtherWriterSave`; otherwise put with `generation = max(stored, base) + 1`,
  `writer = mine`. A `replace` (import/reset) skips the generation check, never the version check.
- Every running build from #69 on meets a v4 record as `newer` and stops writing; a v3 rollback shows the `future` card.
- The autosaver turns `OtherWriterSave` into `blockedBy 'otherTab'`; "Zapis gry" names it; the child sees a calm card
  with one "restart" button at the first refusal (`newer` or `otherTab`), once per page load.
- The parent's panel reports: offline readiness (`ready | installing | install-failed | register-failed | unsupported`)
  and "a newer version took over" after a `controllerchange` with an initial controller; a UI-art line in "Obrazki";
  a music status line (`loading`, `waiting-unlock`, `missing`); a "setting kept only until the game closes" line.
- Verify: unit + store tests (fake-indexeddb) for the rule, migration on populated fixtures, autosaver; e2e with two
  pages in one context (risk #2) and panel lines from a real worker install and an aborted UI picture (risks #8, #14).

### Key Discoveries:

- `storedVersionNewer` is the only check builds from #69 on run (`src/storage/idb.ts` `guardedPut`) — only a version
  bump reaches them (research § B-1 options table).
- `tests/idbStore.test.ts` `describe('IndexedDB newer-save guard')` already models two stores on one fake DB — the
  pattern for the CAS proofs.
- With `clientsClaim`, the first install also fires `controllerchange`; "a newer build took over" requires
  `navigator.serviceWorker.controller` non-null at page start (research § B-8).
- `artHealth(entries, exists)` already takes `{ key, id }[]`; `UI_ART` fits without a core change (research § G-1).
- `SoundStatus.music`/`locked` are computed already and read only by the e2e hook (research § S-1).

## What We're NOT Doing

- Web Locks / `BroadcastChannel` single-writer signal (earlier signal only; re-triggered follow-up).
- A build id of the active service worker (no message handler in `generateSW`; `controllerchange` covers "newer build").
- A "reload to update" prompt mid-play (PRD FR-003); `controllerchange` is a record only.
- Changing the backup-copy policy (P-8 "keep the first copy"): the existing overwrite policy is kept for `backup-v3`
  (decision 6); re-triggered.
- E2E on two real builds (old v3 build vs v4) — the store test with a version-3 writer is the proof; re-triggered.
- The order of the `future` and `newer` cards; heading alignment of the panel; S-2, S-4, S-5, S-7, S-9, S-10, G-2, G-3,
  B-4, B-5, P-2..P-6 smoke work; any WebKit project — follow-ups.
- Saving the refused tab's unsaved changes (they are lost; the card sends the child to the newer save).
- Any edit under `deploy/` other than the docs-only rollback note in `deploy/README.md` (orchestrator decision 2).

## Implementation Approach

Data layer first (format, then the atomic rule in the store, then the autosaver's block state and copy), then the
child card, then the read-only health records (service worker, UI art, music, prefs), each through the existing
runtime-record pattern: computed once → `REGISTRY_KEYS` entry outside `SAVE_KEYS` → read once by
`UIScene.openSettings` → pure view in `src/core` → DOM view in `src/ui/dom` with copy from `pl.ts` and a DESIGN-GAP
row. Documentation and the seam sweep close the code phases; two e2e phases prove the browser behaviour.

## Critical Implementation Details

- **Who stamps, who remembers `base`.** The store stamps `generation`/`writer` inside the transaction (only it reads the
  stored record atomically); `createIdbSaveStore` keeps `base` = the `generation` of the record its `read()` returned
  (0 when absent, older than v4 or malformed) and moves it only when a put's transaction completes. An abandoned
  (`withTimeLimit`) own write that lands later carries `writer === mine`, so the same tab never refuses itself.
  `encodeSave` emits placeholders (`generation: 0`, `writer: ''`) that the store overwrites; `current()`/export carry them.
- **Order of v4 and the guard.** Phase 1 ships v4 with placeholders (behaviour as today); phase 2 adds the CAS. Each is
  green alone; the slice ships both.
- **UI art never under `REGISTRY_KEYS.artHealth`** (that key feeds `artFilter`; final-art-p2 decision 8): a missing
  wallet must not skip MONEY_PAY.
- **Install failure is not a rejection**: the reducer marks `install-failed` only when the tracked installing worker
  becomes `redundant` and no other worker replaced it; `register()` rejection is `register-failed` with the error name.

## Phase 1: Save format v4 (`generation`, `writer`) and the pure write rule

Driver: tdd
Driver why: the migration step, strict validation and the write verdict are pure `core` functions with exact oracles on frozen fixtures — failing tests lead them before any store uses them.

### Overview

`SAVE_VERSION` 4, `MIGRATIONS[3]`, a frozen v4 fixture, and `writeVerdict` (not yet called by the store). Behaviour on
devices: v3 saves migrate to v4 with a `backup-v3` copy under the existing policy; writes as today.

### Changes Required:

#### 1. Format and migration

**File**: `src/core/types.ts` (`SaveV4`, `SaveState`); `src/core/save.ts` (`SAVE_VERSION`, `MIGRATIONS[3]`, `saveProblem`, `encodeSave`, header comments "v3")

**Intent**: Add the two guard fields as a new format version so every build from #69 on refuses to overwrite it.

**Contract**: `SaveV4 extends Omit<SaveV3, 'version'> { version: 4; generation: number; writer: string }`;
`MIGRATIONS[3] = (raw) => ({ ...raw, version: 4, generation: 0, writer: '' })` (reads, never mutates); `saveProblem`
returns `'generation'` unless a whole number ≥ 0, `'writer'` unless a string (after `variants`); `encodeSave` writes
`generation: 0, writer: ''`. `decodeSave`'s `migratedFrom` is 3 for a v3 save. `MIGRATIONS[2]`/`legacySalon.ts`
unchanged (it still produces v3, then step 3 lifts it).

#### 2. Pure write rule

**File**: `src/core/save.ts` (new `OTHER_WRITER_SAVE`, `writeVerdict`); `storedVersionNewer` kept (used by the e2e seam store)

**Intent**: One pure rule the store applies inside its transaction.

**Contract**:
`OTHER_WRITER_SAVE = 'OtherWriterSave'`;
`writeVerdict(stored: unknown, page: { version: number; base: number; writer: string }, mode: 'normal' | 'replace'):
{ kind: 'refuse'; error: typeof NEWER_SAVE | typeof OTHER_WRITER_SAVE } | { kind: 'put'; generation: number }` —
`storedVersionNewer` → refuse `NewerSave` (both modes); stored generation (0 when absent/not a whole number ≥ 0) `> base`
and stored writer (`''` when absent) `!== page.writer` and `mode === 'normal'` → refuse `OtherWriterSave`; else put with
`max(storedGeneration, base) + 1`. No record / non-object → put `base + 1`.

#### 3. Fixtures and tests

**File**: `tests/fixtures/save-v4.json` (new, populated: stars, salon with purchases, learner with history, `generation` 5,
`writer` `"fixture-writer"`); `tests/save.test.ts`, `tests/legacySalonMigration.test.ts`, `tests/saveFile.test.ts`,
`tests/autosave.test.ts`, `tests/e2eSave.test.ts`, `tests/idbStore.test.ts` (version literals); new `tests/saveV4.test.ts`

**Intent**: Prove the step on POPULATED saves and freeze v4.

**Contract**: each of `save-v1.json`, `save-v2.json`, `save-v2-legacy-salon.json`, `save-v3.json` decodes to `ok` with
`migratedFrom` = its version and the same stars, rooms, learner and variants as before the bump (oracle: the
pre-change v3 decode of the same file, written as literals); `save-v4.json` decodes and `encodeSave` of its session
equals it except `generation`/`writer` placeholders; `saveProblem` rejects `generation` -1, 1.5, `"3"` and `writer` 7;
`writeVerdict` table (newer version both modes, other writer ahead normal → refuse / replace → put, own writer ahead →
put `stored + 1`, equal generation → put, empty store, malformed stored generation → treated as 0); `importProblem` of
the v3 fixture → null; a `createIdbSaveStore` `backup(raw, 3)` writes `profile:default:backup-v3`.
Tests changed on purpose: "the current version is 3" → 4; "v3 fixture encodes back to itself" → "v3 fixture decodes to
v4 (`migratedFrom 3`)". `git diff --stat tests/fixtures` = one new file.

#### 4. E2E literals

**File**: `tests/e2e/salon-load-health.spec.ts`, `tests/e2e/save-backup-health.spec.ts`, `tests/e2e/salon-art.spec.ts`, `tests/e2e/save-migration.spec.ts`

**Intent**: Keep the e2e suite green on the new version without changing behaviour.

**Contract**: `writtenVersion` `toBe(3)` → `toBe(SAVE_VERSION)` (import from `src/core/save`) or 4; titles naming
"v3 build" updated only where they state the written version.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `MIGRATIONS[3]` returning `{ ...raw, version: 4 }` → `saveProblem` 'generation' makes the populated v3 test red; `writeVerdict` ignoring `writer` → "own writer ahead" red; each restored; meta-check: proves the format and the rule on data, not the transaction (phase 2)
- `git diff --stat tests/fixtures` shows only `save-v4.json` added; v1–v3 fixtures byte-identical
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`)
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] `src/core/save.ts` has no browser globals; `MIGRATIONS[3]` total on any raw object (no throw on missing keys); older fixtures untouched

---

## Phase 2: Compare-and-set inside `guardedPut`

Driver: tdd
Driver why: the atomic refusal is a store contract with an exact oracle on fake-indexeddb (two stores on one DB) — failing store tests lead it.

### Overview

The store applies `writeVerdict` in its one transaction, stamps the record and tracks `base`; `main.ts` injects a
per-page `writer`. The autosaver does not know the new error yet (it counts as a failed write; phase 3).

### Changes Required:

#### 1. Store

**File**: `src/storage/idb.ts` (`guardedPut`, `createIdbSaveStore`, `IdbSaveStoreOptions`)

**Intent**: Refuse a stale page's write atomically and stamp the winner.

**Contract**: `IdbSaveStoreOptions.writer?: string` (default: a fresh random id per `createIdbSaveStore` call, never a shared constant — a forgotten option must not make two tabs the same writer and silently switch the guard off; tests pass explicit writers); `guardedPut(os, key, value,
page, mode)` calls `writeVerdict` on the read result, rejects with an error whose `name` is the verdict's error, or puts
`{ ...value, generation, writer }`; resolves with the written generation on `tx.oncomplete`. B-7: `os.put` in
`try`/`catch` → reject with the thrown value. A failed read keeps today's write-through. `createIdbSaveStore`:
`read()` sets `base` from the record it returns (a v4 record's `generation`, else 0); `write(value, mode = 'normal')`
moves `base` to the written generation on success.

#### 2. Store interface and callers

**File**: `src/core/autosave.ts` (`SaveStore.write`, `replace` passes `'replace'`); `src/testing/e2eHook.ts` (`e2eSaveStore` accepts and ignores `mode`); `src/main.ts` (writer id)

**Intent**: Let `replace` bypass the generation check and give each page load its own writer id.

**Contract**: `SaveStore.write(value: SaveState, mode?: 'normal' | 'replace'): Promise<void>`; `main.ts` creates
`writer` once per page load (`crypto.randomUUID()` when present, else a time + random fallback) and passes it to
`createIdbSaveStore({ writer })`. No browser global enters `src/core`.

#### 3. Tests

**File**: `tests/idbStore.test.ts` (new `describe('IndexedDB stale-writer guard')`)

**Contract**: two stores (writers A, B) on one fake DB: both read empty; A writes → stored `generation` 1, `writer` A;
B writes → rejects `OtherWriterSave`, stored record still A's; B `replace` → lands (`generation` 2, writer B); A's next
write → `OtherWriterSave`; A re-created (new page, reads) → writes; A writes twice in a row → generations 1, 2 (no
self-refusal); a late own write after another own write → accepted; a store writing version 3 (simulated old build:
`storedVersionNewer` path) meets stored v4 → `NewerSave`, record unchanged; `os.put` throwing (fake store patched) →
the promise rejects (B-7).

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `guardedPut` skipping `writeVerdict`'s refusal → "B writes → rejects" red; `read()` not setting `base` → "re-created A writes" red; each restored; meta-check: proves the transaction rule on fake-indexeddb, not real browser tabs (phase 11)
- Full local gate green; build prints `e2e hook: absent (`
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] `src/storage/idb.ts` stays the only importer of `idb-keyval`; read and put share one transaction; `writer` never logged

---

## Phase 3: `otherTab` block reason, health line and refusal hook

Driver: tdd
Driver why: the block state, `replaceGate`, `offState` and `deviceSaveView` are pure `core` reducers with fake stores — failing tests lead them.

### Overview

The autosaver blocks on `OtherWriterSave` like on `NewerSave`, with its own reason, tells a listener once, and the
parent panel names it.

### Changes Required:

#### 1. Autosaver

**File**: `src/core/autosave.ts` (`BlockReason`, `attempt`, `replace`, `replaceGate`, `AutosaverOptions.onBlocked`)

**Intent**: Stop writing at the first stale refusal and let `main.ts` react.

**Contract**: `BlockReason` adds `'otherTab'` (runtime only); `attempt` maps `OTHER_WRITER_SAVE` → `blockedBy ??=
'otherTab'`, cancels the timer, no retry; `onBlocked?: (reason: 'newer' | 'otherTab') => void` called once, when a
write refusal in `attempt` first sets `blockedBy` (never for load blocks, never from `replace`: the import/reset dialog
already reports its own refusal to the parent); the call is wrapped in `try`/`catch` + `log` so a throwing listener can
never break `attempt`'s "never throws" contract; `replaceGate` returns `Blocked` for `'otherTab'`
(decision 4).

#### 2. Parent views and copy

**File**: `src/core/saveHealth.ts` (`offState`), `src/core/saveFile.ts` (`deviceSaveView` cause union), `src/ui/dom/saveSummaryView.ts` (`blockedText`), `src/data/pl.ts` (`pl.settings.saveOff.otherTab`, `pl.saveTransfer.deviceOtherTab`), `docs/design-gaps.md` (row 116), `tests/e2e/support/hook.ts` (`blockedBy` type)

**Intent**: The parent reads "another window of the game saved later" apart from "a newer version".

**Contract**: `offState` `'otherTab'` → `{ kind: 'off', cause: 'otherTab', code: lastFailure?.error ?? lastError }`;
`deviceSaveView` cause `'otherTab'`, `forceable` false; DESIGN-GAP comment at the `pl.ts` keys naming row 116 ("Zapis
gry": refusal because another window saved later). Copy calm, adult-facing, ends with the restart advice like
`saveOff.newer`.

#### 3. Tests

**File**: `tests/autosave.test.ts`, `tests/saveHealth.test.ts`, `tests/saveFile.test.ts`

**Contract**: a store rejecting `OtherWriterSave` → `blockedBy 'otherTab'`, no later write, `onBlocked` called once
with `'otherTab'`; `NewerSave` → `onBlocked('newer')` once; a load block never calls it; `replaceGate` table row;
`saveHealthView` and `deviceSaveView` rows for `otherTab`.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `attempt` treating `OtherWriterSave` as an ordinary failure → "no later write" red; `onBlocked` called on every refusal → "once" red; each restored; meta-check: proves the state machine with a fake store, not the card (phase 4)
- Full local gate green; build prints `e2e hook: absent (`
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] No Polish text in `src/core`; `pl.ts` keys carry the DESIGN-GAP 116 comment; `docs/design-gaps.md` row 116 present

---

## Phase 4: Child card at the first refused write (B-2)

Driver: impl
Driver why: a DOM card mounted from `main.ts` on the phase-3 hook — glue and markup in an existing pattern; its browser proof is phase 11.

### Overview

One new DOM component, shown once per page load when the autosaver reports `newer` or `otherTab`.

### Changes Required:

#### 1. Card

**File**: `src/ui/dom/saveRefusedCard.ts` (new); `src/data/pl.ts` (`pl.saveRefused.{title, body, restart}`); `docs/design-gaps.md` (row 117); `src/style.css` only if the existing card classes do not cover it

**Intent**: Tell the child calmly that the game must restart to keep the newest progress, with one button.

**Contract**: `mountSaveRefusedCard(parent, onRestart): () => void`, modelled on `src/ui/dom/saveFailedCard.ts` /
`errorCard.ts` (dialog parts from `dialog.ts`, holds the one input switch through `openInputSession`/`inputSuspender`
like the other cards); DESIGN-GAP 117 comment; button → `window.location.reload()` from `main.ts`.

#### 2. Wiring

**File**: `src/main.ts` (`createAutosaver` options)

**Intent**: Mount the card from `onBlocked`, at most once per page load.

**Contract**: `onBlocked` mounts the card unless already mounted; no card for load blocks (those have their own cards).

### Success Criteria:

#### Automated Verification:

- Full local gate green; unit `<branch baseline> + N` (a jsdom-free source test is not required; if a DOM test exists for `saveFailedCard`, mirror it for the new card); build prints `e2e hook: absent (`
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `load-and-tab-guard.spec.ts` (`?e2eSave=newer`) still green — if it asserts the panel after the refusal, it closes the card first (the card is the intended new behaviour)
- Deliberate break: patch `e2e-break-p11a.patch` written (`onBlocked` wiring removed in `main.ts`); meta-check in the handoff (proof in phase 11)

#### Manual Verification:

- [reviewer] No text in the component outside `pl.ts`; the card holds and releases the input switch like `saveFailedCard`

---

## Phase 5: Service-worker status reducer and registration signal (P-1, B-8, F4)

Driver: tdd
Driver why: install success/failure and "newer build took over" are a pure reducer over plain events with an exact oracle — failing tests lead it; `registerServiceWorker` only translates browser events.

### Overview

A runtime record of the worker's state, kept in the registry, readable by the panel (phase 6) and the e2e hook.

### Changes Required:

#### 1. Reducer

**File**: `src/core/swStatus.ts` (new); `tests/swStatus.test.ts` (new)

**Intent**: Decide offline readiness and staleness from events without browser globals.

**Contract**: `SwPhase = 'unsupported' | 'registering' | 'installing' | 'ready' | 'install-failed' | 'register-failed'`;
`SwStatus = { phase: SwPhase; error: string | null; takenOver: boolean }`; events `{ type: 'unsupported' } |
{ type: 'register' ; hadController: boolean } | { type: 'registerFailed'; error: string } | { type: 'installing'; id: number } |
{ type: 'state'; id: number; state: 'installed' | 'activating' | 'activated' | 'redundant' } | { type: 'active'; id: number } |
{ type: 'controllerChange' }`; `stepSw(status, event)` pure. An already active worker keeps the phase `ready` while an update installs, and a failed
update with an active worker stays `ready` (offline play still works; the error name is kept in `error`). Tests: first install → `ready`;
active worker + failed update → `ready`; tracked installing →
`redundant` with no other active → `install-failed`; replaced by a newer installing worker → not failed; an already
active worker at registration → `ready`; `registerFailed` keeps the name; `controllerChange` sets `takenOver` only
when `hadController`; `unsupported`.

#### 2. Registration

**File**: `src/pwa/registerServiceWorker.ts`; `src/main.ts`; `src/data/layout.ts` (`REGISTRY_KEYS.swStatus`, runtime only, not in `SAVE_KEYS`); `src/testing/e2eHook.ts` (snapshot `sw`, read-only); `tests/e2e/support/hook.ts` (type)

**Intent**: Feed real lifecycle events to the reducer and keep the result in the registry.

**Contract**: `registerServiceWorker(onStatus: (s: SwStatus) => void)`; listens to `register()` result, `updatefound`,
the installing worker's `statechange`, `navigator.serviceWorker` `controllerchange`; reads `controller` at start;
`register()` rejection → `registerFailed` with `errorName` and one `console.warn` (name only); dev and missing
`serviceWorker` → `unsupported`. `main.ts` stores each status in `REGISTRY_KEYS.swStatus` once the game exists (keep the
last status from before `createGame` and set it then).

#### 3. Install hint listener (F4)

**File**: `src/pwa/installHint.ts` (`mountInstallHint`)

**Intent**: Stop calling `preventDefault()` after "Graj w przeglądarce".

**Contract**: `dismiss` removes the `beforeinstallprompt` listener.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `redundant` always → `install-failed` (ignoring a replacing worker) → "replaced by a newer worker" red; `takenOver` ignoring `hadController` → red; each restored; meta-check: proves the decision on events, not that Chromium emits them (phase 12)
- Full local gate green; build prints `e2e hook: absent (`
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `seed.spec.ts` (offline start) green

#### Manual Verification:

- [reviewer] `src/core/swStatus.ts` has no browser globals (ESLint boundary passes); `registerServiceWorker` never throws into `main.ts`

---

## Phase 6: Offline status section in the parent's panel

Driver: impl
Driver why: one pure view function plus one DOM view in the existing runtime-record pattern; the browser proof is phase 12.

### Overview

A new short section in the settings panel shows offline readiness and the "newer version took over" line.

### Changes Required:

#### 1. View

**File**: `src/core/swStatus.ts` (`offlineView(status): { line: 'ready' | 'installing' | 'failed' | 'registerFailed' | 'unsupported'; code: string | null; takenOver: boolean }`); `src/ui/dom/offlineView.ts` (new, `createOfflineView`); `src/data/pl.ts` (`pl.settings.offline.{heading, ready, installing, failed, registerFailed, unsupported, takenOver}`); `docs/design-gaps.md` (row 118); `tests/swStatus.test.ts` (view rows)

**Intent**: The parent can tell whether the game will start without internet and whether a newer build is waiting for
the next launch.

**Contract**: `registering` maps to `installing`; the `Kod:` line pattern of `saveHealthView` for `code`; DESIGN-GAP 118
comment; the takenOver line says the new version starts at the next launch (no restart prompt, FR-003).

#### 2. Panel wiring

**File**: `src/ui/dom/settingsPanel.ts` (`SettingsPanelOptions.offline?`); `src/scenes/UIScene.ts` (`openSettings` reads `REGISTRY_KEYS.swStatus` once)

**Contract**: section placed after "Zapis gry" and before "Obrazki"; absent when the registry key is absent.

### Success Criteria:

#### Automated Verification:

- New view tests red before the change, green after; full local gate green; unit `<branch baseline> + N`; build prints `e2e hook: absent (`
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `parent-settings.spec.ts` green
- Deliberate break: patch `e2e-break-p12a.patch` written (`offlineView` never `ready`); meta-check in the handoff (proof in phase 12)

#### Manual Verification:

- [reviewer] No Polish text in the scene or core; DESIGN-GAP 118 row and comment present

---

## Phase 7: UI art health in "Obrazki" (G-1, L-6, L-8)

Driver: tdd
Driver why: the section state (worst of its lines) and the third line are a pure view with exact rows — failing tests lead it; the BootScene record is one line of glue.

### Overview

A third `artHealth` record for `UI_ART` under its own key, shown as a third line; the section's `data-state` becomes
the worst of its lines.

### Changes Required:

#### 1. Record

**File**: `src/scenes/BootScene.ts` (`create`); `src/data/layout.ts` (`REGISTRY_KEYS.uiArtHealth`, runtime only, not in `SAVE_KEYS`)

**Intent**: Count the UI pictures without letting them feed `artFilter`.

**Contract**: `artHealth(UI_ART, key => this.textures.exists(key))` → `REGISTRY_KEYS.uiArtHealth`; `REGISTRY_KEYS.artHealth`
unchanged; one `console.warn` with the missing ids, like the sound record.

#### 2. View

**File**: `src/core/artHealth.ts` (a `sectionState(views)` helper or equivalent); `src/ui/dom/artHealthView.ts` (`createArtHealthView(view, roomView?, uiView?)`); `src/ui/dom/settingsPanel.ts`, `src/scenes/UIScene.ts` (pass the view); `src/data/pl.ts` (`pl.settings.uiArtOk`, `pl.settings.uiArtMissing(count, total)` with verb agreement as `artMissing`); `docs/design-gaps.md` (row 119); `tests/artHealth.test.ts` (new or extended)

**Intent**: The parent sees "screen pictures" health; the section never says "all fine" while one line is missing.

**Contract**: section `data-state` = `missing` when any line is missing (L-6); L-8: a test of the pure state over three
views (all ok, only UI missing, only room missing); plural agreement checked for 1, 2, 5 missing.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: section state from the task line only → "only UI missing" red; restored; meta-check: proves the view rule, not the loader (phase 12)
- `grep -n "uiArtHealth" src/scenes/TaskScene.ts src/core/round/artFilter.ts` empty
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] `artFilter` input unchanged; DESIGN-GAP 119 row and comment present

---

## Phase 8: Music status line (S-1, S-3, S-11)

Driver: tdd
Driver why: which line the panel shows for which music state is a pure rule next to `soundOutcome` — failing tests lead it; the service change is one state and one `try`.

### Overview

`'waiting-unlock'` becomes its own music state; the panel gets the music state and shows one muted line when music is
on and not playing.

### Changes Required:

#### 1. Service

**File**: `src/ui/sound.ts` (`SoundStatus.music`, `playMusic`, `stopMusic`); `src/testing/e2eHook.ts` (`soundSnapshot` type)

**Intent**: Tell "downloading" from "waiting for a tap"; a throwing `play()` ends as `missing`.

**Contract**: `music: 'off' | 'loading' | 'waiting-unlock' | 'playing' | 'missing'`; `playMusic` sets `'waiting-unlock'`
while locked and `'loading'` only while the file is in flight; `start` wraps `sound.play()` in `try` → `'missing'` +
`console.warn` (name only); `stopMusic` decides "was waiting" from the state.

#### 2. Rule and panel

**File**: `src/core/sound.ts` (`musicLine(prefs, music): 'loading' | 'waitingUnlock' | 'missing' | null`); `tests/sound.test.ts`; `src/ui/dom/settingsPanel.ts` (`sound: { prefs; missing; music }`); `src/scenes/UIScene.ts` (`openSettings`); `src/data/pl.ts` (`pl.settings.musicStatus.{loading, waitingUnlock, missing}`); `docs/design-gaps.md` (row 120)

**Contract**: null when `prefs.music` is off or the state is `playing`/`off`; the line sits under the music group,
muted, DESIGN-GAP 120 comment.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `musicLine` ignoring `prefs.music` → "music off shows nothing" red; restored; meta-check: proves the rule, not Phaser's unlock
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `final-sound.spec.ts`, `final-sound-failure.spec.ts` green (update a `music: 'loading'` assertion only where it waits for the unlock)

#### Manual Verification:

- [reviewer] `src/core/sound.ts` stays pure; no sound state written to the save

---

## Phase 9: Honest sound section after a setup failure and an unsaved preference (S-8, S-6)

Driver: impl
Driver why: a call in an existing `catch` and a boolean kept in the registry — glue with one new muted line, no new rule worth a red test beyond a view row.

### Overview

The "Dźwięki" section reports every effect missing when sound setup threw, and says the setting holds only for this
session when the device storage refused it.

### Changes Required:

#### 1. S-8

**File**: `src/scenes/BootScene.ts` (`create`, the sound `catch`)

**Intent**: The existing `pl.settings.soundMissing(n)` line becomes true after a setup failure.

**Contract**: in the `catch`, `setMissing(allEffectKeys(SOUNDS))` guarded so it cannot throw; `allEffectKeys` is a small
pure helper in `src/core/sound.ts` (the table is passed in, `core` does not import `data`) with a unit row in
`tests/sound.test.ts` (every effect of a two-effect table, no music key).

#### 2. S-6

**File**: `src/scenes/UIScene.ts` (`applySettings`); `src/data/layout.ts` (`REGISTRY_KEYS.soundPrefsKept`, runtime only); `src/ui/dom/settingsPanel.ts`; `src/data/pl.ts` (`pl.settings.soundPrefsNotKept`); `docs/design-gaps.md` (row 121)

**Intent**: The parent learns the sound choice will not survive a restart.

**Contract**: the boolean of `createSoundPrefStore(deviceStorage()).write` (false when `deviceStorage()` is undefined)
goes to `REGISTRY_KEYS.soundPrefsKept`; the panel shows the muted line when it is `false`; DESIGN-GAP 121 comment.

### Success Criteria:

#### Automated Verification:

- Full local gate green; unit `<branch baseline> + N` (a `soundPrefs` test for the `false` path if none exists); build prints `e2e hook: absent (`
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`
- Deliberate break: `allEffectKeys` returning the music key too (or nothing) → its unit row red; restored; meta-check: proves the key list, the one-line `catch` wiring is read by the reviewer (9.4)

#### Manual Verification:

- [reviewer] No new copy beyond `soundPrefsNotKept`; the `catch` calls `setMissing(allEffectKeys(...))` and still never rethrows

---

## Phase 10: Documentation, follow-ups and seam sweep

Driver: impl
Driver why: text-only changes (`CLAUDE.md`, `deploy/README.md` note, follow-ups) and a sweep of earlier phases — nothing to drive by a test beyond the rule-file validator.

### Overview

Record v4 and the new records where the next agent looks, carry the follow-ups, and remove seams left by phases 1–9.

### Changes Required:

#### 1. Rule file and deploy note

**File**: `CLAUDE.md` ("Current state": one paragraph for this change: save format v4 `generation`/`writer`,
`writeVerdict`, `OtherWriterSave` → `blockedBy 'otherTab'`, `backup-v3`, `saveRefusedCard`, `swStatus` +
`REGISTRY_KEYS.swStatus`, `uiArtHealth`, music `waiting-unlock`, `soundPrefsKept`, design gaps 116-121; also update the
earlier sentences that say "`SAVE_VERSION` 3 now" / "save format stays v3"); `deploy/README.md` § 6 rollback note
(docs only, orchestrator decision 2: a rollback below the v4 build shows the `future` card; nothing else under `deploy/`)

#### 2. Follow-ups

**File**: `context/changes/stale-tab-and-health/follow-ups/review-fixes.md` (new)

**Contract**: each entry with `Trigger:`: Web Locks/`BroadcastChannel` earlier signal; worker build id; P-8 keep the
first backup; E2E on two real builds; order of `future`/`newer` cards; panel heading alignment; S-2, S-4, S-5, S-7,
S-9, S-10; G-2, G-3, B-4, B-5; P-2..P-6; iPadOS home-screen storage separation (unverified); closed: `mountInstallHint`
tap-through (already holds the input switch).

#### 3. Seam sweep

**Intent**: Leave no duplicate or stale seam from phases 1–9.

**Contract**: one writer-id helper (no copy in tests and `main.ts`); no second "card once" flag; comments still saying
"v3" in `save.ts`, `autosave.ts`, `idb.ts`, `saveHealth.ts`, `e2eHook.ts` updated; `docs/design-gaps.md` rows 116-121
match the DESIGN-GAP comments in `pl.ts` and the views; `storedVersionNewer` still has a caller or is removed.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; a deliberate broken path in `CLAUDE.md` → FAIL; restored
- Every follow-up entry has a `Trigger:` line (`grep -c '^Trigger:'` equals the entry count)
- `git diff --stat main -- deploy/` shows only `deploy/README.md`
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] Seam sweep: every name `CLAUDE.md` adds exists in `src/`; no duplicated helper or stale "v3" comment; gap rows 116-121 match the code comments
- [human] Accept or reverse save format v4 (one-way door for children's devices; a rollback below this build shows the `future` card and plays without saving)
- [reviewer] (CI at ship) workflow `CI` job `check` log matches the regex `e2e hook: absent \([0-9]+ chunks checked\)` and `Tests +[0-9]+ passed`

---

## Phase 11: A stale tab never overwrites newer progress — e2e (#2)

Driver: e2e
Driver why: risk #2 (progress gone after a restart) for two pages in ONE browser context sharing real IndexedDB exists only in the browser — built in phases 1-4, contract `E2E=on`.

### Overview

New spec `tests/e2e/stale-tab.spec.ts` in the `chromium-hook` project (`stale-tab` added to `ROUND_SPEC` in
`playwright.config.ts`).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/stale-tab.spec.ts` (new); `playwright.config.ts` (`ROUND_SPEC`)

**Intent**:
(a) "#2 B-1 a second window that saved later wins; the stale one stops and shows the card": page A passes the welcome
and finishes a round (stars `s1`, written); page B = `page.context().newPage()` on the same URL loads A's save, earns
more stars and flushes (`s2 > s1`); A (`bringToFront`) finishes a round (answering one task changes no `SAVE_KEYS`
value, so it would trigger no write) → A's `save.blockedBy === 'otherTab'` and the card text
`pl.saveRefused.title` is visible; B's stars unchanged in B's `save` status; a new page C in the same context loads
`s2`.
(b) "#2 B-1 a reset in one window is not undone by the other": A and B loaded; A resets through the settings dialog
(helpers in `tests/e2e/support/saveImport.ts`), reloads fresh; B finishes a round (a change to a `SAVE_KEYS` value) → B blocked `otherTab`; a new page loads
the fresh game.

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; hook read-only (`readHook`/`snapshot` polls);
never open IndexedDB from the test; request-file protocol (Chromium not available to phase agents): `e2e-request-p11.md`
+ `e2e-break-p11a.patch` (phase 4: card wiring removed → (a) red on the card) + `e2e-break-p11b.patch` (`writeVerdict`
never refuses `OtherWriterSave` → (a) and (b) red on `blockedBy`/stars); each expected-red test run alone (`-g`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/stale-tab.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2`
- Deliberate break p11a → (a) red; p11b → (a) and (b) red; each restored; meta-check: (b) proves the data rule in a real browser, (a) the child-facing outcome
- Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

#### Manual Verification:

- [human] iPad: the card reads calmly to a 6–8-year-old and "restart" brings back the newest stars

---

## Phase 12: The parent's panel tells offline readiness and a missing screen picture — e2e (#8, #14)

Driver: e2e
Driver why: risk #8 (the worker never takes control) and #14 (the panel claims health it does not have) exist only with a real worker install and a real loader — built in phases 5-7.

### Overview

New spec `tests/e2e/health-lines.spec.ts` in `chromium-hook` (`health-lines` added to `ROUND_SPEC`).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/health-lines.spec.ts` (new); `playwright.config.ts` (`ROUND_SPEC`)

**Intent**:
(a) "#8 P-1 after the worker installs the panel says the game starts offline": wait for `snapshot.sw.phase === 'ready'`,
open settings (`openSettings` in `support/welcome.ts`), the offline section shows `pl.settings.offline.ready`.
(b) "#14 G-1 a screen picture that did not load is named in »Obrazki«": `page.route` aborts one `UI_ART` file (the
wallet) before the first load; settings → the UI-art line shows `pl.settings.uiArtMissing(1, total)`; the task line
still says all task pictures loaded (`artFilter` untouched).

**Contract**: as phase 11; (b) sits in its own `test.describe` with `test.use({ serviceWorkers: 'block' })` like
`final-art-wallet.spec.ts` (a worker that claims the page bypasses `page.route`), (a) runs with workers allowed;
patches `e2e-break-p12a.patch` (phase 6: `offlineView` never `ready` → (a) red) and
`e2e-break-p12b.patch` (BootScene not setting `uiArtHealth` → (b) red); request-file protocol.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/health-lines.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2`
- Deliberate break p12a → (a) red; p12b → (b) red; each restored; meta-check: (a) proves Chromium's real install reaches the reducer, (b) the real loader reaches the panel
- Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

#### Manual Verification:

- [visual] Settings panel at 1440 and 1024 in every new state: "Zapis gry" `otherTab`; offline `ready`, `installing`, `install-failed` with `Kod:`, `unsupported`, `takenOver`; "Obrazki" with the UI line ok and missing; "Dźwięki" music `loading`, `waiting-unlock`, `missing`, and `soundPrefsNotKept`; the child card (`saveRefused`) over the task screen

---

## Testing Strategy

### Unit Tests:

- `writeVerdict` table; `MIGRATIONS[3]` on every populated frozen fixture (v1, v2, v2-legacy-salon, v3) → v4; v4 fixture
  round trip; strict `generation`/`writer`.
- Store (fake-indexeddb): two writers, replace, self-writes, old-version writer, throwing `put`.
- Autosaver: `otherTab` block, `onBlocked` once, `replaceGate`; views `offState`, `deviceSaveView`, `offlineView`,
  art section state, `musicLine`.
- `stepSw` reducer.

### Integration Tests:

- E2E phase 11 (two pages in one context, real IndexedDB) and phase 12 (real worker install, real loader).

### Manual Testing Steps:

1. Two tabs on a tablet: play in tab B after A; return to A, answer → the card; restart → B's stars.
2. Settings panel in airplane mode after the first visit → offline line "ready".
3. Turn music on before any tap → "waits for a tap" line.

## Performance Considerations

One extra `get` field read per write (already inside the transaction); the reducer runs on a handful of events.

## Migration Notes

v3 → v4: `MIGRATIONS[3]` adds `generation: 0`, `writer: ''`; the raw v3 save is copied to `profile:default:backup-v3`
under the existing policy (`backupAttempts`, the start write after a migration). v1/v2 go through the chain with one
copy keyed by their own version. Rollback to any v3 build from #69 on: the `future` card, no write, progress kept until
roll-forward (`deploy/README.md` § 6). A pre-#69 build (no `guardedPut`) could still overwrite with v3; the v4 build then
migrates that save again.

## Known risks

- **v4 is a one-way door** for children's devices: a rollback below this build plays without saving until the next
  release; reversing v4 later needs v5, not a revert. The run ships it under the maintainer's Step 0 choice
  (orchestrator decision 1); `[human]` row 10.6 asks to accept or reverse it.
- **First writer wins**: two windows opened at once — the one that saves second is refused even if the child is using
  it; the card sends the child to restart, the restart loads the other window's save. Progress of the refused window
  since its load is lost (bounded by one session).
- **Already-running v3 tabs** (S-16b/c/d builds) are stopped by `storedVersionNewer` but show no card (old code);
  pre-#69 builds are not reachable at all.
- **A second migration overwrites `backup-v3`** (P-8, decision 6) when a pre-#69 build rewrote v3 over v4.
- **Reload race (plan review F4)**: a write of the previous document of the same tab that lands AFTER the new
  document's read (e.g. a pagehide flush stuck behind a backup copy) makes the new document's first write refused and
  shows the card on a legitimate reload; the restart then loads that late write, so nothing is lost. Rare; the e2e gate
  `+ 0` from phase 2 on is the detector (many specs reload).
- **Stale-window replace (plan review F6)**: import/reset from a window that has not yet been refused uses `replace`
  (no generation check) and its summary shows that window's loaded save, not the newer stored one. The parent asked to
  replace anyway; recorded, not changed.
- **Blocked worker registration in e2e (plan review F5)**: specs with `serviceWorkers: 'block'` now produce a
  `register-failed` status and one `console.warn`; no spec fails on warnings today, the phase-5 e2e gate confirms.
- **iPadOS home-screen storage** may be separate from Safari (unverified); does not change the rule.
- **Real worker install in e2e** depends on Chromium installing a ~5.3 MiB precache within the test limit; the seed
  spec already does this on 4398.

## References

- Research `context/changes/stale-tab-and-health/research.md`; change `context/changes/stale-tab-and-health/change.md`
- Audit `context/audits/observability/2026-10-16_0915-start-dzwieki-grafika-salon.md` on branch `docs/observability-audit-2026-10-15-fix-s16bcd` (PR #73)
- Contract `context/runs/2026-10-16-fix-stale-tab-health/agent-contract.md`; profile `context/foundation/autonomous-run.md` § 2, § 3, § 5, § 6, § 8, § 9
- Test plan `context/foundation/test-plan.md` risks #2, #8, #14; `context/foundation/test-stack.md` § E2E
- Format examples `context/archive/2026-10-15-salon-load-health/plan.md` (v3 bump), `context/archive/2026-10-16-salon-extra-slots/plan.md`
- Follow-ups fired: `context/archive/2026-10-15-salon-load-health/follow-ups/review-fixes.md` ("Two tabs of one origin", "E2E on two real builds"), `context/archive/2026-10-15-load-and-tab-guard/follow-ups/review-fixes.md` (B-2 card, P-6, P-8, card order), `context/archive/2026-10-16-final-art-p2/follow-ups/review-fixes.md` (UI art, decision 8), `context/archive/2026-10-16-final-sound/` (music `loading` while locked)
- PRD `context/foundation/prd.md` FR-001, FR-003, FR-020, FR-021

## Autonomous decisions

1. **[human] Save format v4** with `generation` + `writer` CAS (research option (c)). Rejected: (b) runtime-only v3 (cannot
   reach running v3 builds, liveness unverified on iPadOS); v3 + optional fields (old builds drop and ignore them). The run
   ships it (orchestrator decision 1, not re-opened); research's "stop at an open PR" is not this plan's call. Would change:
   the maintainer reversing v4 at the `[human]` row (then a v5 that drops the fields, or a revert before any device loads v4).
2. **`deploy/README.md` rollback note edited in phase 10** (docs only; orchestrator decision 2, precedent 27406ab). Would
   change: nothing in this run.
3. **The store stamps and remembers `base`; the core owns the rule** (`writeVerdict`). Rejected: `base` in the autosaver
   (the transaction is the only place the stored generation is known atomically). Would change: a store without
   transactions.
4. **New `BlockReason 'otherTab'`, `replaceGate` → `Blocked`**. Rejected: reusing `'newer'` (the parent could not tell the
   cause); allowing import/reset from a stale window (could undo the other window's work the parent did not see; the card
   asks for a restart first). Would change: a parent report needing import from a refused window.
5. **B-2 card for `newer` and `otherTab`, once per page load, one restart button**. Rejected: parent-only line (silent
   session loss for the child; FR-020). Would change: a decision to keep refusals parent-only.
6. **Backup policy unchanged (P-8 not taken)**: the latest raw v3 is the more recent progress; "keep the first copy" would
   keep an older one. Re-triggered. Would change: a parent report of a lost `backup-v3`.
7. **No worker build id; `controllerchange` is a record, not a card** (FR-003). Would change: a parent report needing the
   worker's build, or a maintainer wanting a restart prompt.
8. **Offline status as a new panel section** (one DOM view), not a line in "Zapis gry" (different subject). Would change:
   the visual gate showing the panel too long.
9. **S-8 and S-6 in (light), S-6 first to drop** under budget pressure. Would change: phase 9 running over budget (then S-6
   becomes a follow-up).
10. **No new e2e URL seam**: phase 12 uses a real worker install and `page.route` abort; phase 11 two real pages. Rejected:
    `?e2eSw=fail` (more seam surface; the failure path is unit-proven). Would change: Chromium's worker install proving
    flaky within the test limit.
11. **Design gaps numbered by phase order**: 116 otherTab line, 117 child card, 118 offline section, 119 UI-art line, 120
    music status, 121 prefs not kept (research proposed another order; numbers follow the phases that add them).
12. **Phases 1, 2, 3, 5, 7, 8 `tdd`; 4, 6, 9, 10 `impl`; 11, 12 `e2e`** (pure logic test-first; UI ≤ 1 new component per
    phase; e2e after what it proves; risks #2, #8, #14).
13. **Plan in English** like `change.md` and `research.md`; commit messages in Polish (profile § 1). No lessons file exists.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Save format v4 (`generation`, `writer`) and the pure write rule

#### Automated

- [x] 1.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N` — c0d8343
- [x] 1.2 Deliberate break: `MIGRATIONS[3]` without the fields / `writeVerdict` ignoring `writer` → red; restored; meta-check (format and rule on data) — c0d8343
- [x] 1.3 `git diff --stat tests/fixtures` shows only `save-v4.json` added; v1–v3 fixtures byte-identical — c0d8343
- [x] 1.4 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`) — c0d8343
- [x] 1.5 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` — orchestrator gate 94f7a38 (121 passed)

#### Manual

- [ ] 1.6 [reviewer] `src/core/save.ts` has no browser globals; `MIGRATIONS[3]` total on any raw object; older fixtures untouched

### Phase 2: Compare-and-set inside `guardedPut`

#### Automated

- [x] 2.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N` — 4342650
- [x] 2.2 Deliberate break: refusal skipped / `base` not set on read → red; restored; meta-check (transaction rule on fake-indexeddb) — 4342650
- [x] 2.3 Full local gate green; build prints `e2e hook: absent (` — 4342650
- [ ] 2.4 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual

- [ ] 2.5 [reviewer] `src/storage/idb.ts` stays the only importer of `idb-keyval`; read and put share one transaction; `writer` never logged

### Phase 3: `otherTab` block reason, health line and refusal hook

#### Automated

- [ ] 3.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- [ ] 3.2 Deliberate break: `OtherWriterSave` as ordinary failure / `onBlocked` on every refusal → red; restored; meta-check (state machine, not the card)
- [ ] 3.3 Full local gate green; build prints `e2e hook: absent (`
- [ ] 3.4 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual

- [ ] 3.5 [reviewer] No Polish text in `src/core`; `pl.ts` keys carry the DESIGN-GAP 116 comment; `docs/design-gaps.md` row 116 present

### Phase 4: Child card at the first refused write (B-2)

#### Automated

- [ ] 4.1 Full local gate green; unit `<branch baseline> + N`; build prints `e2e hook: absent (`
- [ ] 4.2 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `load-and-tab-guard.spec.ts` still green
- [ ] 4.3 Deliberate break: patch `e2e-break-p11a.patch` written; meta-check in the handoff

#### Manual

- [ ] 4.4 [reviewer] No text in the component outside `pl.ts`; the card holds and releases the input switch like `saveFailedCard`

### Phase 5: Service-worker status reducer and registration signal (P-1, B-8, F4)

#### Automated

- [ ] 5.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- [ ] 5.2 Deliberate break: `redundant` always failed / `takenOver` ignoring `hadController` → red; restored; meta-check (events, not Chromium)
- [ ] 5.3 Full local gate green; build prints `e2e hook: absent (`
- [ ] 5.4 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `seed.spec.ts` green

#### Manual

- [ ] 5.5 [reviewer] `src/core/swStatus.ts` has no browser globals; `registerServiceWorker` never throws into `main.ts`

### Phase 6: Offline status section in the parent's panel

#### Automated

- [ ] 6.1 New view tests red before the change, green after; full local gate green; unit `<branch baseline> + N`; build prints `e2e hook: absent (`
- [ ] 6.2 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `parent-settings.spec.ts` green
- [ ] 6.3 Deliberate break: patch `e2e-break-p12a.patch` written; meta-check in the handoff

#### Manual

- [ ] 6.4 [reviewer] No Polish text in the scene or core; DESIGN-GAP 118 row and comment present

### Phase 7: UI art health in "Obrazki" (G-1, L-6, L-8)

#### Automated

- [ ] 7.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- [ ] 7.2 Deliberate break: section state from the task line only → red; restored; meta-check (view rule, not the loader)
- [ ] 7.3 `grep -n "uiArtHealth" src/scenes/TaskScene.ts src/core/round/artFilter.ts` empty
- [ ] 7.4 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual

- [ ] 7.5 [reviewer] `artFilter` input unchanged; DESIGN-GAP 119 row and comment present

### Phase 8: Music status line (S-1, S-3, S-11)

#### Automated

- [ ] 8.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- [ ] 8.2 Deliberate break: `musicLine` ignoring `prefs.music` → red; restored; meta-check (rule, not Phaser's unlock)
- [ ] 8.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `final-sound` specs green

#### Manual

- [ ] 8.4 [reviewer] `src/core/sound.ts` stays pure; no sound state written to the save

### Phase 9: Honest sound section after a setup failure and an unsaved preference (S-8, S-6)

#### Automated

- [ ] 9.1 Full local gate green; unit `<branch baseline> + N`; build prints `e2e hook: absent (`
- [ ] 9.2 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`
- [ ] 9.3 Deliberate break: `allEffectKeys` returning the music key or nothing → red; restored; meta-check recorded

#### Manual

- [ ] 9.4 [reviewer] No new copy beyond `soundPrefsNotKept`; the `catch` calls `setMissing(allEffectKeys(...))` and still never rethrows

### Phase 10: Documentation, follow-ups and seam sweep

#### Automated

- [ ] 10.1 `validate-rule-files.sh` PASS; deliberate broken path in `CLAUDE.md` → FAIL; restored
- [ ] 10.2 Every follow-up entry has a `Trigger:` line
- [ ] 10.3 `git diff --stat main -- deploy/` shows only `deploy/README.md`
- [ ] 10.4 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual

- [ ] 10.5 [reviewer] Seam sweep: every name `CLAUDE.md` adds exists in `src/`; no duplicated helper or stale "v3" comment; gap rows 116-121 match the code comments
- [ ] 10.6 [human] Accept or reverse save format v4 (one-way door; rollback below this build shows the `future` card)
- [ ] 10.7 [reviewer] (CI at ship) workflow `CI` job `check` log matches the regex `e2e hook: absent \([0-9]+ chunks checked\)` and `Tests +[0-9]+ passed`

### Phase 11: A stale tab never overwrites newer progress — e2e (#2)

#### Automated

- [ ] 11.1 `npx playwright test tests/e2e/stale-tab.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2`
- [ ] 11.2 Deliberate break p11a → (a) red; p11b → (a) and (b) red; each restored; meta-check
- [ ] 11.3 Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

#### Manual

- [ ] 11.4 [human] iPad: the card reads calmly to a 6–8-year-old and "restart" brings back the newest stars

### Phase 12: The parent's panel tells offline readiness and a missing screen picture — e2e (#8, #14)

#### Automated

- [ ] 12.1 `npx playwright test tests/e2e/health-lines.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2`
- [ ] 12.2 Deliberate break p12a → (a) red; p12b → (b) red; each restored; meta-check
- [ ] 12.3 Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

#### Manual

- [ ] 12.4 [visual] Settings panel at 1440 and 1024 in every new state (otherTab; offline ready/installing/install-failed/unsupported/takenOver; UI art ok/missing; music loading/waiting-unlock/missing; prefs not kept) and the child card over the task screen
