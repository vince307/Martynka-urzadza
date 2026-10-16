# Save truth: what the parent is told about save, import/reset and a stale tab — Implementation Plan

## Overview

Slice 2 of the audit sweep 2026-10-16 (non-roadmap fix, autonomous run `2026-10-16-audit-sweep`): every place found by
the observability audits where the parent is told something untrue or nothing at all about the save, the copy of an
old save, an import/reset or a second tab — and the few places where a save path silently loses a chance to write or to
keep the old copy. Scope = `change.md` § Findings: 15 MEDIUM ids (SVB-01..04, SRR-01, SRR-08, SRR-09, SV2-04, V-1,
P-1 (audit 2217), V-4, S12-07, S12-08, T-2, R-4) and 12 LOW ids (T-1 detection only, T-3, T-5, FU-3/P-8, S12-04,
S12-05, SRR-10, SRR-11, SV2-07, SV2-11, C-2r, L-S1), plus the fired follow-ups research folded in (V-6, V-7, visual V1,
V2, O2, O4). Deferred with triggers: S12-03, S12-11, S12-13, SRR-07, SRR-13, SV2-13, SV2-15 (written to
`follow-ups/review-fixes.md` in phase 13).

**Save format stays v4** (`SAVE_VERSION` 4 in `src/core/save.ts`, frozen fixtures `tests/fixtures/save-v1*.json` …
`save-v4*.json` untouched and still loading). Everything new lives outside the save record: the IndexedDB key
`profile:default:backup-status`, the existing `backup-v<N>` keys (now write-once and readable), `localStorage`
`martynka:unavailableStarts`, `sessionStorage` `martynka:writer`, a `BroadcastChannel('martynka-save')` message, and
runtime `AutosaveStatus` fields (research § Storage outside the save). **A phase that finds it must change what is
saved or its meaning, or that could overwrite or delete an existing `backup-v<N>` copy, stops with `STATUS: BLOCKED`.**

## Current State Analysis

Grounded in `research.md` (its Code References are the source, not re-searched) and re-checked on this branch at
`d7b4e1e`:

- `src/core/save.ts` `decodeSave` returns `{unreadable, reason:'corrupt'}` with no field and no `from` at the shape check,
  after the migration loop (`!validateSave(current)`, SRR-01) and in the final `catch` (L-S1); `migration-failed` carries
  `step`, which `src/core/autosave.ts` `loadSave` drops when it builds `LoadOutcome` `{kind:'unreadable', reason, raw}`
  (SV2-07). `src/main.ts` `start` shows `pl.saveFailed.detail(reason …)` = "Kod: corrupt" and warns
  `Save unreadable (${reason})` (V-1, C-2r). `src/core/saveHealth.ts` `cardCopyFor` maps only `migration-failed` to the
  migration card.
- `replaceGate` (`src/core/autosave.ts`): `blockedBy === 'unreadable'` → `loadReason === 'future' ? 'Blocked' : 'ok'`
  (SRR-09: `migration-failed`/`unknown-version` replaced without the force step); `unavailable` → forceable on the first
  start (SRR-08) although `pl.saveTransfer.deviceUnavailable` says "Jeśli to się powtarza przy każdym uruchomieniu".
  `replace` returns `Busy`/`InvalidSave` without a log (SRR-10). `src/core/saveFile.ts` `deviceSaveView` returns
  `{kind:'unreadable'}` for every non-future unreadable save.
- `src/core/autosave.ts` `attempt`: a hidden flush gives the copy one try (`reason === 'hidden' && backupFails > 0` →
  `giveUpCopy`; the catch rethrows only when not hidden), `skipBackup` only logs, a copy failure can be counted twice
  (V-6) and retried after a give-up (V-7); a failed first write after a migration is not re-armed (P-1, `save` loop stops,
  `arm` only from `markDirty`/start). `withTimeLimit` drops a late success (SVB-03); `block(reason)` keeps no error
  (SRR-11). `src/core/saveHealth.ts` `migrationOf` needs session-only `migratedFrom`/`writes`.
- `src/storage/idb.ts`: `backup` = plain `set(backup-v${from})` (overwrites, P-8), no read path (SV2-04); `writer` is an
  option of `createIdbSaveStore`, defaulting to `randomWriter()` per page load (T-3); `guardedPut` asks `writeVerdict`,
  which treats a record without `generation` as generation 0 and puts silently (T-1). No `BroadcastChannel` anywhere in
  `src/` (T-2). `src/ui/dom/saveRefusedCard.ts` has no code line; `onBlocked` in `main.ts` ignores `reason` (T-5).
- Dialogs: `src/ui/dom/saveExport.ts` `saveFileToDevice` returns `'downloaded'` after `link.click()` (S12-07);
  `UIScene.openExport` exports `saver.current()` unvalidated (S12-04); `UIScene.openImport`/`openReset` close the panel
  silently on `deviceSaveView` `broken` (S12-05); `saveImportDialog.ts` `stepOne` maps a `file.text()` rejection to
  `not-json` (S12-08); `saveSummaryView.ts` `failureText` says "…bez zmian" for a timed-out replace (SVB-04).
- `src/main.ts` `start` → `slowCard` `onWait`: any late `unavailable` → `'still-slow'`, error name dropped (SVB-02).
  `src/core/save.ts` `validRoom` checks shape only; `src/core/rooms.ts` never compares room state with the catalogue
  (R-4). `TaskScene.freshRound`: a null `buildWordRound` silently becomes dice (SV2-11). No frozen v1 old-salon fixture
  (V-4).
- e2e seams (`src/testing/e2eHook.ts` `E2ESaveSeam`/`E2E_SAVE_SEAMS`): `corrupt` is a **v1** save with `stars: 'many'`
  (so after SRR-01 it would read as "corrupt after a migration"); no seam rejects late (`slow` resolves, `hang` never
  answers). `vite/e2eHookGuard.mjs` marker `e2eSave` covers every seam value.
- `docs/design-gaps.md` ends at row 125. `context/foundation/lessons.md` does not exist (nothing to apply).
- Baseline (contract, main `24b3e4b`, inherited, not re-measured): unit `Tests 3416 passed`, e2e `127 passed`. Every
  phase measures its own branch baseline and writes `baseline + delta`.

## Desired End State

- An unreadable save names its cause: `Kod: corrupt/<field>` on the card and in the log (`corrupt/exception:<Name>` for
  a decode that threw); a migration step's number survives to the status; a save that becomes invalid only after a
  migration gets the migration card ("stary zapis nietknięty", FR-021) and, like `migration-failed`/`unknown-version`,
  can be replaced only through the second step "Zastąp mimo to".
- An `unavailable` save is forceable only from the second consecutive `unavailable` start (localStorage counter); before
  that the dialogs say "Uruchom grę ponownie" and promise nothing they cannot keep.
- The first `backup-v<N>` copy is kept forever (write-once) together with a `backup-status` record; the copy is retried
  after the progress is written while the raw value is in memory; a failed first write after a migration is retried
  (bounded); "Zapis gry" tells across launches whether the old copy is kept, lost, uncertain or still being moved, names
  a timed-out write as "mogło się zapisać", and names the fatal error.
- The parent can save the kept old-version copy from "Zapis gry" ("Zachowaj kopię starego zapisu").
- A reload is never refused as "another window"; an older build writing over the save is noticed and named; a second tab
  that saved stops this tab at once (BroadcastChannel, when the browser has it), and the refusal card shows a code line.
- Export says "pobieranie rozpoczęte" (not "pobrany") after a link click and refuses a state that does not validate; an
  unreadable file is named as such; a broken device save gets a line instead of a silent close; a timed-out import/reset
  says "nie potwierdzono"; a room state that does not match the salon is logged and named in "Zapis gry" and the import
  preview; a late read error leaves the slow card for the error card; a word round that cannot be built warns.
- Verify: unit tests per phase (red first), the full local gate, e2e `+ 0` per code phase (named reversals included),
  `+ 2` in phase 14 and `+ 2` in phase 15.

### Key Discoveries:

- `tests/legacySalonMigration.test.ts` pins "the step is total: … gives corrupt, never migration-failed": SRR-01 keeps
  `reason: 'corrupt'` and adds `from`/`problem`; consumers derive "migrated corrupt" from `from !== null && from <
  SAVE_VERSION` (research § A).
- `idb-keyval` 6.3.0 `update` always puts, so write-once is a custom `s('readwrite', os => …)` callback with `os.count`
  (not `getKey`, Safari 15+) in the style of `guardedPut` (research § C).
- `writer` is already an option of `createIdbSaveStore`; `main.ts` can pass the two-part id without touching the store's
  write path (T-3).
- A duplicated tab copies `sessionStorage`: a plain tab id would make two duplicated tabs equal writers and switch off
  B-1, hence `tabId:loadNonce` with an ended-nonce list (research § E).
- The SRR-08 counter fails together with IndexedDB only when site data is blocked; the first-start line therefore
  promises nothing (research Open Question 1).

## What We're NOT Doing

- No save-format change (v4 stays), no new field in the save record, no change to which saves `validateSave` accepts
  (SV2-13 deferred), no repair of room state (R-4 reports only).
- No forced reload or service-worker eviction of an older build (T-1 is detection only, change.md decision 4).
- Deferred LOW, each with a trigger in `follow-ups/review-fixes.md`: S12-03, S12-11, S12-13, SRR-07, SRR-13, SV2-13,
  SV2-15. Carried, not fired: T-4/F6 stale-window replace, V-3/V-5/V-8, P-7, L-S3, import from the welcome screen, raw
  copy from inside the dialogs, abort of an IDB transaction after a timeout, e2e on two real builds, SV2-08/M-S1 deploy
  guard.
- No new view and no new style: every new line or button goes into the existing overlay components
  (`src/ui/dom/overlay.ts` `createText`/`createButton`, `saveHealthView.ts`, `saveSummaryView.ts`, the dialogs and the
  two cards). No change under `deploy/`.
- No `unknown-room` line for the parent (the `living` room of S-09 placeholder builds sits in every v1–v4 fixture and on
  early devices): log only.

## Implementation Approach

Pure rule in `src/core` first with a failing unit test, then the storage module in `src/storage/` (browser storage only
there, pattern `src/storage/soundPrefs.ts` `deviceStorage`), then the one call site in `main.ts`, a dialog or
`UIScene`, phase by phase, grouped by the code each phase touches so every phase is green alone. One rule per decision:
`replaceGate` stays the only gate for `replace` and `deviceSaveView.forceable`; `writeVerdict` stays the only write
verdict (a channel message is a hint checked by a sibling pure rule). Player-visible lines carry a DESIGN-GAP row (126
onward, numbered in phase order) and a `[visual]` row. Phase 13 sweeps seams and updates `CLAUDE.md`; phases 14–15 prove
the browser-level risks.

## Critical Implementation Details

- **Backups are never lost.** `backup` writes only when `os.count(key) === 0`; no phase deletes or rewrites a
  `backup-v<N>` key; the `backup-status` record is written in the copy's transaction (`kept`) or best-effort (`lost`,
  `uncertain`), and a failure to write it is logged and never blocks a save write.
- **Copy after write only while the raw value is in memory.** The new SVB-01 order (write the v4 progress on a hidden
  flush after a failed copy, keep the copy owed) is valid because `AutosaverOptions.migrated.raw` holds the raw old save
  for the whole session and the single-key IndexedDB write is atomic. A copy is never attempted from the stored key
  after the v4 write (it would copy v4 bytes as `backup-v<N>`).
- **SRR-01/SRR-09 share one input.** The gate learns "migrated corrupt" through the status (`loadFrom`), not through a
  second check in the dialogs; `deviceSaveView` keeps calling `replaceGate(status, true)` for `forceable`.
- **The `corrupt` e2e seam stays "corrupt in its own version".** Phase 1 changes its value from a v1 shape to a
  `version: SAVE_VERSION` shape with a bad `stars`, so existing specs keep their meaning; the migrated-corrupt path is
  proven by unit tests (`tests/save.test.ts`, `tests/autosave.test.ts`).
- **Two loads for SRR-08 in e2e.** `localStorage` survives a reload in one browser context; the spec plays on the
  `unavailable` seam, reloads, and only then sees the force step. No new seam.

## Phase 1: Decode truth (V-1, SV2-07, L-S1, C-2r, SRR-01 report, V-4)

Driver: tdd
Driver why: the decode result and the card code are pure functions with exact `toEqual` oracles — the widened results fail first.

### Overview

An unreadable save says which field broke and from which version it was lifted; a save that becomes invalid after a
migration gets the migration card; a frozen v1 old-salon fixture proves v1 → v4.

### Changes Required:

#### 1. Decode result

**File**: `src/core/save.ts` (`DecodeResult`, `decodeSave`)

**Intent**: The `corrupt` branches carry `from: number | null` (the version read, null at the shape check) and
`problem: string | null` (`saveProblem(current)` after the migration loop, `exception:<errorName>` in the final catch).
The reason stays `corrupt`; the accepted set of saves does not change.

**Contract**: `{ kind:'unreadable'; reason:'corrupt'; from: number | null; problem: string | null }`; other variants
unchanged; `decodeSave` stays total.

#### 2. Load outcome and card

**File**: `src/core/autosave.ts` (`LoadOutcome`, `loadSave`); `src/core/saveHealth.ts` (`cardCopyFor`, new
`unreadableCode(outcome)`); `src/main.ts` (`start`: the unreadable card's detail and the warn; `attempt`'s
`InvalidSave` log in `autosave.ts`)

**Intent**: `LoadOutcome.unreadable` carries `from`, `problem`, `step`; `cardCopyFor` gives `migrationFailed` for
`corrupt` with `from < SAVE_VERSION`; the card's code reads `corrupt/<problem>` (or `migration-failed/<step>`); the
start warn and the autosaver's `InvalidSave` log name `saveProblem` (C-2r).

**Contract**: `pl.saveFailed.detail` unchanged (it already takes a code string); no new pl string.

#### 3. Seam and fixture

**File**: `src/testing/e2eHook.ts` (`e2eSaveStore`, seam `corrupt` → `{ version: SAVE_VERSION, profileId:'default',
stars:'many' }` with a comment why); new frozen `tests/fixtures/save-v1-legacy-salon.json` (v1 shape of `save-v1.json`,
`currentRoom:'salon'`, old salon keys from `LEGACY_SALON_V2` incl. one old-only key and `table`, `tasksDone: 6`)

#### 4. Tests

**File**: `tests/save.test.ts`, `tests/legacySalonMigration.test.ts`, `tests/e2eSave.test.ts`, `tests/saveHealth.test.ts`

**Contract**: exact `toEqual` cases updated with `from`/`problem` (expected red first: they fail by the added fields);
new: a v4 save with `stars:'x'` → `problem:'stars'`; a decode that throws → `problem:'exception:<Name>'`; a migration
step that returns an invalid shape (test-local migration table or a spy on the step) → `corrupt` with `from:1`;
`cardCopyFor('unreadable','corrupt', …, from 1)` → `migrationFailed`; the v1 old-salon fixture → `ok`, `migratedFrom:1`,
`generation:0`, `writer:''`, prefix 6 (armchair a gift, `table` → `coffee-table`), stars unchanged.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `problem` left null after the migration loop → the `stars` case red; `cardCopyFor` without the `from` branch → its case red; each restored; meta-check: proves the decode report, not that the card renders it (phase 15 / visual gate)
- `git diff --stat tests/fixtures` shows only the new `save-v1-legacy-salon.json`; `SAVE_VERSION` still 4; every v1–v4 fixture test green
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`)
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `save-restart.spec.ts` and `save-transfer-blocked.spec.ts` green with the changed `corrupt` seam

#### Manual Verification:

- [reviewer] `decodeSave` still never throws; `validateSave`/`saveProblem` rules unchanged; the new fixture is not referenced by any write path
- [visual] The unreadable-save card with `Kod: corrupt/stars` (seam `corrupt`), at 1440 (1920×1080 fit) and 1024×768

---

## Phase 2: Replace gate for saves that cannot be read (SRR-09, SRR-01 gate, SRR-10)

Driver: tdd
Driver why: `replaceGate` and `deviceSaveView` are pure with exact outcomes — the two reversed tests and new cases fail first.

### Overview

`migration-failed`, `unknown-version` and migrated-corrupt saves can be replaced only through the second step "Zastąp
mimo to"; `replace` logs every refusal.

### Changes Required:

#### 1. Gate

**File**: `src/core/autosave.ts` (`replaceGate`, `AutosaveStatus.loadFrom`, `AutosaverOptions.loadFrom`, `replace`)

**Intent**: For `blockedBy === 'unreadable'`: `future` → `Blocked`; `migration-failed`, `unknown-version`, and `corrupt`
with `loadFrom < SAVE_VERSION` → `force ? 'ok' : 'Blocked'`; plain `corrupt` → `ok` (as today). `replace` logs `Busy` and
`InvalidSave` (with `saveProblem(state)`).

**Contract**: `replaceGate(status: Pick<AutosaveStatus,'blockedBy'|'loadReason'|'loadError'|'loadFrom'|…>, force)`;
`loadFrom` runtime only, set by `main.ts` from the outcome.

#### 2. Device view

**File**: `src/core/saveFile.ts` (`deviceSaveView`, `DeviceSaveView` cause), the dialogs' blocked branch
(`src/ui/dom/saveSummaryView.ts` cause → line)

**Intent**: The three saves map to `{kind:'blocked', cause:'unreadable', forceable:true}`; the blocked line for
`unreadable` reuses `pl.saveTransfer.deviceUnreadable`, the force step reuses `force` + `forcedWarning`. Plain `corrupt`
stays `{kind:'unreadable'}`.

**Contract**: no new pl string.

#### 3. Tests (deliberate reversals)

**File**: `tests/autosave.test.ts` "a %s save is still replaced (the way out)" → split: `corrupt` (not migrated) still
replaced; `unknown-version`, `migration-failed`, migrated `corrupt` refused without force and replaced with force.
`tests/saveFile.test.ts` "an unreadable (%s) save is named, never summarised (overwriting stays allowed)" → the three
map to `blocked`/`forceable`. Reversed because FR-021 ("stary zapis nietknięty") and `pl.saveOff['migration-failed']`
("Został bez zmian") must stay true until the parent confirms twice. New: `replace` logs `Busy`/`InvalidSave`
(`t.logs` count); `tests/deviceSaveWiring.test.ts` unchanged.

### Success Criteria:

#### Automated Verification:

- Reversed and new tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `replaceGate` back to `loadReason === 'future' ? 'Blocked' : 'ok'` → the reversed cases red; restored; meta-check: proves the one gate both `replace` and `deviceSaveView` use (the dialog wiring is proven by `save-transfer-blocked.spec.ts`)
- Full local gate green; build prints `e2e hook: absent (`
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `save-transfer-blocked.spec.ts` "#2 an unreadable save warns instead of showing the fresh session" green (plain `corrupt` keeps step one)

#### Manual Verification:

- [reviewer] No second gate in the dialogs: `force` offered only through `deviceSaveView.forceable`
- [visual] Reset dialog over a `migration-failed` save (unit-built state through the hook build, or seam `v1` with a throwing step patched locally, never committed): step one without "Zacznij od nowa", then "Zastąp mimo to" + warning, at 1440 and 1024×768

---

## Phase 3: Unavailable starts counter (SRR-08)

Driver: tdd
Driver why: the counter rules and the gate input are pure (`replaceGate`, the counter's read/bump/reset over an injected storage) — failing tests lead.

### Overview

An `unavailable` (non-timeout) save becomes forceable only from the second consecutive `unavailable` start; the first
start's line asks for a restart and promises nothing.

### Changes Required:

#### 1. Counter

**File**: new `src/storage/startCounter.ts` (`localStorage` key `martynka:unavailableStarts`; `bump(): number`,
`reset(): void`, `read(): number`; every access in try/catch, a failure reads 0; pattern `soundPrefs.ts` `deviceStorage`)

#### 2. Gate and wiring

**File**: `src/core/autosave.ts` (`AutosaverOptions.unavailableStarts`, `AutosaveStatus.unavailableStarts`,
`replaceGate`: `unavailable` → `!timeout && force && unavailableStarts >= balance.save.forceAfterStarts`);
`src/data/balance.ts` (`save.forceAfterStarts: 2` with a comment); `src/main.ts` (`start`: bump on `unavailable`
non-timeout, reset on `loaded`/`fresh`, pass the value); `src/core/saveFile.ts` (`deviceSaveView` cause
`unavailable-first` when not forceable for the count)

#### 3. Copy

**File**: `src/data/pl.ts` (`saveTransfer.deviceUnavailableFirst`: "Gra nie mogła odczytać zapisu na tym urządzeniu.
Uruchom grę ponownie. Zapis zostaje bez zmian." — DESIGN-GAP 126 comment); `docs/design-gaps.md` row 126

#### 4. Tests (deliberate reversals)

**File**: `tests/autosave.test.ts` ("unavailable needs force…" gets a count: 1 → `Blocked` even with force, 2 → `ok`
with force); new `tests/startCounter.test.ts` (fake storage, throwing storage → 0); `tests/saveFile.test.ts` (cause by
count); e2e `tests/e2e/save-transfer-blocked.spec.ts`: "#2 an unavailable save is not overwritten…" now expects
`deviceUnavailableFirst` on the first start; "#2 SIR-02 a save the browser never gives can be replaced after a second
confirmation" reloads once on the seam before forcing (two `unavailable` starts). Reversed because the copy promised
"jeśli to się powtarza" while the first start was already forceable.

### Success Criteria:

#### Automated Verification:

- New and reversed tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `replaceGate` ignoring `unavailableStarts` → the count-1 case red; `bump` returning 2 on a throwing storage → the storage case red; each restored; meta-check: proves the rule and the module, the two-load path is proven by the e2e spec
- `martynka:unavailableStarts` is not a registry key and not in `SAVE_KEYS` (`tests/saveKeys.test.ts` green unchanged)
- Full local gate green; build prints `e2e hook: absent (`
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; the two edited `save-transfer-blocked.spec.ts` tests green

#### Manual Verification:

- [reviewer] DESIGN-GAP 126 row and comment present; `src/core` reads no `localStorage`
- [visual] Import dialog on the first `unavailable` start (`?e2eSave=unavailable`, first load) and on the second (after a reload, with "Zastąp mimo to"), at 1440 and 1024×768
- [human] Accept that a save the browser refuses can be overwritten only after a second start, and the wording of gap 126

---

## Phase 4: Write-once, readable backups and the backup record (FU-3/P-8, SV2-04 store, SVB-01 record)

Driver: tdd
Driver why: the store contract is testable on fake-indexeddb (`tests/idbStore.test.ts`) — "a second backup keeps the first" fails first.

### Overview

`backup-v<N>` is written only when absent, together with a `backup-status` record; the store can read the copies and
the record.

### Changes Required:

#### 1. Store contract

**File**: `src/core/autosave.ts` (`SaveStore`: `backup(raw, from): Promise<'written' | 'kept'>`;
`readBackups(): Promise<{ from: number; raw: unknown }[]>`; `backupRecord(): Promise<BackupRecord | null>`;
`noteBackup(record: BackupRecord): Promise<void>`; `BackupRecord = { from; result: 'kept'|'lost'|'uncertain'; error:
string | null; at: number }`, all required, so no store can skip them)

#### 2. IndexedDB

**File**: `src/storage/idb.ts` (`createIdbSaveStore`)

**Intent**: `backup` runs one `readwrite` transaction: `os.count(backup-v<from>)`; when 0, put the raw copy and the
record `kept`; resolve `'written'` or `'kept'` on `tx.oncomplete`. `readBackups` gets `backup-v1..v{SAVE_VERSION-1}`
(absent keys skipped). `backupRecord`/`noteBackup` get/set `profile:default:backup-status`. The main key is never
touched by any of them.

**Contract**: `count`, not `getKey` (build target `safari14`); key names unchanged, so existing copies stay readable.

#### 3. Other stores

**File**: `src/testing/e2eHook.ts` (`e2eSaveStore`: in-memory copies and record; `backupfail`/`backuphang` keep their
behaviour for `backup`); the test stores in `tests/autosave.test.ts` (one shared helper if several copies exist)

#### 4. Tests

**File**: `tests/idbStore.test.ts`, `tests/e2eSave.test.ts`

**Contract**: second `backup` for the same `from` → `'kept'`, first bytes unchanged; record `kept` written with the copy;
`readBackups` returns only present versions; `noteBackup` never touches `profile:default` or a `backup-v<N>` key.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `backup` without the `count` check → "a second backup keeps the first" red; restored; meta-check: proves the store on fake-indexeddb, not Safari's IndexedDB (a `[human]` row covers the tablet)
- `SAVE_VERSION` still 4; `git diff --stat tests/fixtures` empty
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `save-backup-health.spec.ts` and `save-migration.spec.ts` green

#### Manual Verification:

- [reviewer] No code path deletes or overwrites a `backup-v<N>` key; the record is never read by `decodeSave` or `read`
- [human] Accept that a later migration keeps the FIRST old copy (reverses `stale-tab-and-health` plan-brief "a later migration overwrites `backup-v3`")

---

## Phase 5: Copy after the write, bounded retry of the first write (SVB-01, V-6, V-7, P-1)

Driver: tdd
Driver why: the autosaver with fake timers and a scripted store gives exact op orders — the hidden-flush case and the re-arm case fail first.

### Overview

A failed copy never costs the child's progress: a hidden flush writes v4 and keeps the copy owed; the copy is retried
after later writes until `backupAttempts`, then given up once with a `lost`/`uncertain` record; a failed first write
after a migration re-arms itself (bounded).

### Changes Required:

#### 1. Copy accounting

**File**: `src/core/autosave.ts` (`attempt`, `skipBackup`, `backupFails`)

**Intent**: On a hidden flush with the copy owed and failing, write the progress and leave `backup = 'failed'`; later
attempts write first, then retry the copy from `migrated.raw` while `backupFails < backupAttempts`; at the cap
`skipped` and one `noteBackup({result: lastError is timeout ? 'uncertain' : 'lost'})` (best-effort, logged on failure).
A failed copy counts once per attempt (V-6); after `skipped` the copy is never retried, whatever a write does (V-7). A
`'kept'` answer from `backup` is `done`.

**Contract**: the comment "the child's progress is worth more than the raw old bytes" kept; the copy source is only
`migrated.raw`, never the stored key.

#### 2. First write retry

**File**: `src/core/autosave.ts` (`save`, `arm`); `src/data/balance.ts` (`save.migrationWriteRetries` =
`backupAttempts + 1`, with a comment)

**Intent**: After a failed attempt while `!writesOff() && options.migrated && migrationWrittenAt === null`, re-arm, at
most `migrationWriteRetries` times per session; a store that never works stops retrying as today.

#### 3. Tests (deliberate reversals)

**File**: `tests/autosave.test.ts`

**Contract**: new "a hidden flush after a failed copy writes progress and keeps the copy owed"; new "a failed first
write after a migration is retried without markDirty, at most N times"; new V-6 (one failure per attempt) and V-7 (no
copy after `skipped`). Reversed: "after a failed copy the page-hide flush writes v2 without trying the copy again" and
"the third failed copy in a session writes v2 without the copy, once, … (SV2-01)" — the order becomes write-then-copy
and the give-up writes a record; reversed because a hidden flush is the common flush on a tablet ("3 tries" were 1). If
`tests/e2e/save-backup-health.spec.ts` "#2 SV2-01 a v1 save whose copy always fails is written as v4 after three tries"
asserts the op order, its assertion moves with it (named here as the third reversal).

### Success Criteria:

#### Automated Verification:

- New and reversed tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: hidden branch back to `giveUpCopy` on the first failure → the hidden case red; `arm` call removed → the retry case red; each restored; meta-check: proves the scheduler over a scripted store, not real IndexedDB timing
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `save-backup-health.spec.ts` and `save-migration.spec.ts` green

#### Manual Verification:

- [reviewer] The copy is never taken from the stored key; `noteBackup` failure never blocks a write; the retry is bounded

---

## Phase 6: "Zapis gry" tells the truth across launches (SVB-01 line, P-1 line, SVB-03, SRR-11, visual V1)

Driver: tdd
Driver why: `saveHealthView` and `withTimeLimit`'s observer are pure with exact line keys — failing view tests lead.

### Overview

The migration line comes from the stored record (kept / lost / uncertain) on every launch, "przenoszenie w toku" shows
until the first v4 write, a timed-out write says "mogło się zapisać", and a fatal block names its own error.

### Changes Required:

#### 1. Runtime inputs

**File**: `src/core/autosave.ts` (`AutosaverOptions.backupRecord`, `AutosaveStatus.backupRecord`, `lateWrite:
'landed'|'failed'|null`, `fatalError`; `withTimeLimit(work, timers, ms, onLate?)` — the observer is attached only after
the limit fired and never changes the result; `block(reason, error?)`); `src/main.ts` (reads `store.backupRecord()`
beside `loadSave` and passes it; the error boundary passes `errorName(error)` to `block('fatal', …)`)

#### 2. View

**File**: `src/core/saveHealth.ts` (`migrationOf`: record first, then session status; a `pending` state while
`migratedFrom !== null && migrationWrittenAt === null`; an `uncertain` record with the copy present (`readBackups` at
panel open is phase 9 — here the record alone) shows as `uncertain`; `stateOf`/`offState`: `failing` with
`lastFailure.error` timeout and `lateWrite !== 'failed'` → the timeout variant; fatal → `fatalError ?? lastError`; a
`backup`-stage failure is not repeated in `earlierFailures` (V1)); `src/ui/dom/saveHealthView.ts` (renders the new keys)

#### 3. Copy

**File**: `src/data/pl.ts` (`settings.migration.uncertain(from)` — gap 127; `settings.migration.pending(from)` "Zapis
jest przenoszony z wersji N…" — gap 128; `settings.saveFailingTimeout` "Zapis trwał za długo. Mógł się udać, gra
spróbuje jeszcze raz." — gap 129); `docs/design-gaps.md` rows 127–129

#### 4. Tests

**File**: `tests/saveHealth.test.ts` (record without `writes` → kept/lost/uncertain lines; `pending`; timeout variant;
"a fatal block carries lastError as code, or null" rewritten to `fatalError`; no duplicate code for a `backup` failure),
`tests/autosave.test.ts` (`withTimeLimit` `onLate` with a write resolving after the limit, fake timers; `lateWrite`)

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `migrationOf` reading `writes` again → the record case red; `onLate` changing the race result → its case red; each restored; meta-check: proves the view and the observer, not that a real late IDB write lands
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `save-backup-health.spec.ts`, `save-migration.spec.ts`, `health-lines.spec.ts` and `save-restart.spec.ts` "#2 C-2 …" green

#### Manual Verification:

- [reviewer] DESIGN-GAP 127–129 rows and comments present; `backupRecord`, `lateWrite`, `fatalError` absent from `encodeSave` and `SAVE_KEYS`
- [visual] "Zapis gry" with the `pending` line (`?e2eSave=backuphang`), the `lost` line after three failed copies (`?e2eSave=backupfail`) and the timeout line (`?e2eSave=writehang`), at 1440 and 1024×768

---

## Phase 7: Writer identity and an older build's write (T-3, T-1)

Driver: tdd
Driver why: `writeVerdict` is pure with exact verdicts, the writer module works over an injected storage — failing cases lead.

### Overview

A reload is the same tab, never "another window"; a duplicated tab stays a different writer; a v3 record written over
this page's v4 save by an older build is noticed, logged once and named in "Zapis gry".

### Changes Required:

#### 1. Writer id

**File**: new `src/storage/writerId.ts` (`sessionStorage` `martynka:writer` = `{ tabId, ended: string[] }`; returns
`{ writer: \`${tabId}:${nonce}\`, endedWriters, end(): void }`; `end` records this nonce on `pagehide`; the list keeps
the last 8; any throw → a fresh random id with no ended list, today's behaviour); `src/main.ts` passes `writer` and
`endedWriters` to `createIdbSaveStore`

#### 2. Verdicts

**File**: `src/core/save.ts` (`writeVerdict(stored, page: { version; base; writer; endedWriters? }, mode)`): a stored
record whose `writer` is in `endedWriters` counts as this tab's previous document (put, not refuse); a put over a stored
`version < page.version` while `page.base > 0` returns `{ kind:'put', generation, olderWriter: true }`;
`src/storage/idb.ts` (`guardedPut` resolves the flag; the store calls `options.onOlderWriter?.()`); `src/core/autosave.ts`
(`noteOlderWriter()` → runtime `olderWriterSeen`, one `log`)

#### 3. Copy

**File**: `src/data/pl.ts` (`settings.olderWriter` "Starsza wersja gry zapisała tu postępy. Uruchom grę ponownie." —
gap 130), `src/core/saveHealth.ts` + `saveHealthView.ts` (one line when `olderWriterSeen`); `docs/design-gaps.md` row 130

#### 4. Tests

**File**: `tests/saveV4.test.ts` (or the `writeVerdict` cases in `tests/save.test.ts`): same `tabId`, ended nonce →
put; same `tabId`, live nonce → refuse; base 0 over v3 → plain put (first write after a migration); base ≥ 1 over v3 →
`olderWriter`. New `tests/writerId.test.ts` (copied list in a duplicated tab does not contain the original's live
nonce; throwing storage). `tests/idbStore.test.ts` (flag reaches `onOlderWriter`), `tests/saveHealth.test.ts`.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`; every existing `writeVerdict` and B-1 test green unchanged
- Deliberate break: ended-list check matching on `tabId` alone → the duplicated-tab case red; `olderWriter` without `base > 0` → the migration case red; each restored; meta-check: proves the verdict, the reload race itself is not reproduced in a browser
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `stale-tab.spec.ts` and `load-and-tab-guard.spec.ts` green

#### Manual Verification:

- [reviewer] DESIGN-GAP 130 row and comment present; `writer`/`generation` stamping in the stored record unchanged (format v4)
- [visual] "Zapis gry" with the older-writer line (state built through the hook build), at 1440 and 1024×768

---

## Phase 8: Early stale signal and the refusal code line (T-2, T-5)

Driver: tdd
Driver why: the channel verdict and the autosaver's `noticeOtherWriter` are pure with exact outcomes — failing tests lead; the browser path is phase 14.

### Overview

A second tab that saved tells this tab at once (when `BroadcastChannel` exists), which stops writing and shows the
refusal card once; the card shows `Kod:` like the save card.

### Changes Required:

#### 1. Channel

**File**: new `src/storage/saveChannel.ts` (`typeof BroadcastChannel === 'function'` feature check, try/catch around
the constructor and `postMessage`, name `martynka-save`, message `{ writer, generation }`, never stored; `post`,
`onMessage`, `close`); `src/storage/idb.ts` (after every successful `guardedPut`, `replace` included, the store calls
`options.onWritten?.({ writer, generation })`; a `stamp()` read of `{ writer, base }`)

#### 2. Verdict and autosaver

**File**: `src/core/save.ts` (`channelVerdict(msg, page: { writer; base; endedWriters }) → 'stale' | 'ignore'`: stale
when `msg.writer !== page.writer`, not in `endedWriters`, and `msg.generation > page.base`); `src/core/autosave.ts`
(`noticeOtherWriter()` shares the refusal branch: `blockedBy 'otherTab'`, `onBlocked('otherTab')` once, writes stop);
`src/main.ts` wires channel → verdict → `noticeOtherWriter`, and `onWritten` → `post`

#### 3. Code line

**File**: `src/ui/dom/saveRefusedCard.ts` (`mountSaveRefusedCard({ …, detail? })`, the `overlay-muted` line of
`saveFailedCard`); `src/main.ts` `onBlocked(reason)` passes `pl.saveFailed.detail(reason === 'newer' ? NEWER_SAVE :
OTHER_WRITER_SAVE, __BUILD_ID__)` (no new pl string)

#### 4. Tests

**File**: `tests/save.test.ts` (`channelVerdict` cases incl. equal writer and ended nonce), `tests/autosave.test.ts`
(`noticeOtherWriter` blocks, calls `onBlocked` once, a later `markDirty` writes nothing), new `tests/saveChannel.test.ts`
(missing `BroadcastChannel` → no-op; throwing constructor → no-op)

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `channelVerdict` without the `generation > base` guard → its case red; restored; meta-check: proves the rule, the cross-page delivery is phase 14
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `stale-tab.spec.ts` green

#### Manual Verification:

- [reviewer] `writeVerdict` remains the authority (the channel never allows a write); no `BroadcastChannel` outside `src/storage/`
- [visual] Refusal card with the `Kod:` line (`stale-tab.spec.ts` scenario), at 1440 and 1024×768

---

## Phase 9: Keep a copy of the old save from "Zapis gry" (SV2-04 UI)

Driver: impl
Driver why: one button wired to existing export functions — glue proven by a wiring source test and the phase-15 e2e.

### Overview

When the store holds a `backup-v<N>`, "Zapis gry" offers "Zachowaj kopię starego zapisu", which exports it through the
existing raw export (`exportFileText({ kind:'raw', reason:'backup-v<N>', raw })`, `openSaveExportDialog`); such a file
can be imported again (`parseImport` → `decodeSave`).

### Changes Required:

#### 1. Wiring

**File**: `src/scenes/UIScene.ts` (`openSettings` reads `store.readBackups()` through the registry's saver/store
accessor once at panel open; new `openBackupExport(from, raw)` inside the same input session); `src/ui/dom/saveHealthView.ts`
(one button when a copy exists, the newest `from`; an `uncertain` record with a present copy reads as kept)

#### 2. Copy

**File**: `src/data/pl.ts` (`settings.backupExport` "Zachowaj kopię starego zapisu" — gap 131; the file name reuses
the raw file name of `pl.saveFailed`); `docs/design-gaps.md` row 131

#### 3. Tests

**File**: `tests/deviceSaveWiring.test.ts` (or a new source test in its style): `openBackupExport` runs inside the input
session and passes `kind:'raw'`; `tests/saveFile.test.ts`: a `backup-v1` export envelope parses back through
`parseImport` to a v4 session.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `kind:'save'` instead of `'raw'` → the round-trip test red; restored; meta-check: proves the envelope and wiring, the download is phase 15
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `parent-settings` and `save-transfer.spec.ts` green

#### Manual Verification:

- [reviewer] DESIGN-GAP 131 row and comment present; no read of backups outside the panel open
- [visual] "Zapis gry" with the "Zachowaj kopię starego zapisu" button after a v1 migration (`?e2eSave=v1`), at 1440 and 1024×768

---

## Phase 10: Export says what happened (S12-07, S12-04, O4)

Driver: impl
Driver why: an outcome rename and a validation branch in the export dialog — glue proven by the wiring test and the reversed e2e assertion.

### Overview

A link-click download says "pobieranie rozpoczęte, sprawdź Pobrane"; a state that does not validate is never exported
and says so.

### Changes Required:

#### 1. Outcomes

**File**: `src/ui/dom/saveExport.ts` (`saveFileToDevice` returns `'downloadStarted'` after `link.click()`;
`'downloaded'` removed if no path still produces it); `src/ui/dom/saveExportDialog.ts` (done branch for
`downloadStarted`; `file()` may return null → `invalid` line); `src/scenes/UIScene.ts` (`openExport` validates
`saver.current()`, logs `saveProblem` on failure)

#### 2. Copy

**File**: `src/data/pl.ts` (`saveTransfer.exportOutcome.downloadStarted` "Pobieranie pliku się zaczęło. Sprawdź folder
Pobrane." — gap 132; `exportOutcome.invalid` "Tej kopii nie da się zapisać: stan gry jest uszkodzony." — gap 133);
`docs/design-gaps.md` rows 132–133

#### 3. Tests (deliberate reversal)

**File**: `tests/deviceSaveWiring.test.ts` (O4: assert the `deviceSaveView` argument and `warning`; `openExport`
validates before `file()`); `tests/saveTransferCopy.test.ts` (outcome keys); e2e `tests/e2e/save-restart.spec.ts` "#2
FR-021 an unreadable save shows the parent card, exports the raw copy and is never written" and
`tests/e2e/save-transfer.spec.ts` assertions on `exportOutcome.downloaded` move to `downloadStarted` — reversed because a
link click cannot know the file landed (S12-07, L-S2).

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `openExport` without the validation → the wiring test red; restored; meta-check: proves the source wiring, not a browser download
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; the two edited specs green

#### Manual Verification:

- [reviewer] DESIGN-GAP 132–133 rows and comments present; the share-sheet path (`shared`) unchanged
- [visual] Export dialog after "Zapisz plik" with the `downloadStarted` line, at 1440 and 1024×768

---

## Phase 11: Import and reset say what happened (SVB-04, S12-08, S12-05, O2, V2)

Driver: tdd
Driver why: `failureText` and `ImportRejection` are pure enough for unit oracles (`overlay.ts` touches `document` only inside its functions) — failing tests lead.

### Overview

A timed-out import/reset says it was not confirmed and to restart; a file the browser cannot read is named; a broken
device save shows a line instead of closing the panel.

### Changes Required:

#### 1. Failure text

**File**: `src/ui/dom/saveSummaryView.ts` (`failureText`: first branch `isTimeoutError(result.error)` →
`replaceUnconfirmed`; O2: the reset lead line ends without a dangling colon when no list follows; V2: the busy status
line gets `tabindex=-1` and focus)

#### 2. Import rejection

**File**: `src/core/saveFile.ts` (`ImportRejection` gains `'unreadable-file'`); `src/ui/dom/saveImportDialog.ts`
(`stepOne`: `file.text()` rejection → `refuse('unreadable-file', errorName(e))`)

#### 3. Broken device save

**File**: `src/scenes/UIScene.ts` (`openImport`/`openReset`: `broken` → log `saveProblem(saver.current())` and open the
dialog's blocked branch with `deviceBroken`, never a silent `closeSettings()`); `src/core/saveFile.ts` (cause `broken`
if the blocked branch needs it)

#### 4. Copy

**File**: `src/data/pl.ts` (`saveTransfer.replaceUnconfirmed` "Gra nie dostała potwierdzenia zapisu. Uruchom grę
ponownie i sprawdź postępy." — gap 134; `saveTransfer.rejected['unreadable-file']` "Nie udało się odczytać tego pliku.
Spróbuj wybrać go jeszcze raz." — gap 135; `saveTransfer.deviceBroken` "Obecnego stanu gry nie da się odczytać. Uruchom
grę ponownie." — gap 136); `docs/design-gaps.md` rows 134–136

#### 5. Tests (deliberate reversal)

**File**: new `tests/saveSummaryView.test.ts` (`failureText` for timeout, forced, unforced); `tests/saveTransferCopy.test.ts`
(every rejection reason incl. `unreadable-file`); `tests/deviceSaveWiring.test.ts` (no `closeSettings()` on `broken`);
e2e `tests/e2e/save-backup-health.spec.ts` "#2 SV2-02 a write that never answers is a named failure and the reset dialog
comes back" asserts `replaceUnconfirmed` instead of `resetFailed` — reversed because "Obecne postępy zostały bez zmian"
is not known after a timeout (SVB-04).

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: timeout branch removed from `failureText` → its unit case red; restored; meta-check: proves the text rule, the `writehang` path is proven by the edited spec
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; the edited SV2-02 spec green

#### Manual Verification:

- [reviewer] DESIGN-GAP 134–136 rows and comments present; `rejected` stays an exhaustive record
- [visual] Reset dialog after a `writehang` timeout with `replaceUnconfirmed`, at 1440 and 1024×768
- [human] Accept the wording of gaps 127–136 as one read of the parent's save copy (kit has no parent views)

---

## Phase 12: Room state checked against the salon (R-4)

Driver: tdd
Driver why: `roomStateProblems` is pure over a validated session and the catalogue — failing cases lead.

### Overview

A room state that does not match the catalogue (over-count, unknown slot, chosen but not bought, variant out of range)
is logged once at load and named in "Zapis gry" and in the import preview; nothing is repaired; an unknown room is
logged only.

### Changes Required:

#### 1. Rule

**File**: `src/core/rooms.ts` (`roomStateProblems(rooms, catalogue) → { room; kind: 'unknown-room'|'tasks-overflow'|
'unknown-slot'|'chosen-not-bought'|'variant-out-of-range' }[]`, `parentVisible(problem)` false for `unknown-room`)

#### 2. Wiring

**File**: `src/main.ts` (one `console.warn` at load with the list; runtime registry key `REGISTRY_KEYS.roomProblems`,
never in `SAVE_KEYS`); `src/core/saveHealth.ts` + `saveHealthView.ts` (one line when a visible problem exists);
`src/core/saveFile.ts` (`saveSummary` gains `mismatch: boolean`) + `saveSummaryView.ts` (one preview line)

#### 3. Copy

**File**: `src/data/pl.ts` (`settings.roomMismatch` "Stan salonu w zapisie nie pasuje do gry. Postępy zostają bez
zmian." — gap 137; `saveTransfer.roomMismatch` "Stan salonu w tym pliku nie pasuje do gry." — gap 138);
`docs/design-gaps.md` rows 137–138

#### 4. Tests

**File**: `tests/rooms.test.ts` (each kind; the audit's `chosen.curtains` with `tasksDone: 7`; every v1–v4 fixture
gives only `unknown-room` for `living`, which is not parent-visible), `tests/saveFile.test.ts` (`mismatch`),
`tests/saveKeys.test.ts` unchanged and green

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: `parentVisible` true for `unknown-room` → the fixture case red; restored; meta-check: proves the rule over the frozen fixtures, not every device's history
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `room-*.spec.ts` and `save-transfer.spec.ts` green

#### Manual Verification:

- [reviewer] DESIGN-GAP 137–138 rows and comments present; no repair of `rooms` anywhere; `REGISTRY_KEYS.roomProblems` absent from `SAVE_KEYS`
- [visual] Import preview of a file whose salon has an over-count (built from a fixture copy in a `*.local` folder), at 1440 and 1024×768

---

## Phase 13: Late read error, word round warn, docs and seam sweep (SVB-02, SV2-11)

Driver: impl
Driver why: a small pure verdict, a hook-build seam, one warn, rule-file text and a sweep of earlier phases — glue and docs, proven by unit tests and the e2e gate.

### Overview

A late read *error* behind the slow card leaves for the error card with its name; a word round that cannot be built
warns before dice; `CLAUDE.md` and follow-ups record the slice; seams left by phases 1–12 are removed.

### Changes Required:

#### 1. Late read

**File**: `src/core/autosave.ts` (new pure `lateReadVerdict(late: LoadOutcome) → 'still-slow' | 'settle'`:
`still-slow` only for `unavailable` with a timeout error); `src/main.ts` (`slowCard` `onWait` uses it; `settle` logs the
error name, removes the card and resolves the outcome so the normal card path shows `Kod: <name>`)

#### 2. Seam

**File**: `src/testing/e2eHook.ts` (`E2ESaveSeam`/`E2E_SAVE_SEAMS` gain `slowfail`: read rejects `UnknownError` after
`E2E_SLOW_READ_MS`; the two `seam === 'hang' || seam === 'slow'` checks in `main.ts` `start` include it);
`tests/e2eSave.test.ts`, `tests/e2eHookGuard.test.ts` (seam lists); marker `e2eSave` in `vite/e2eHookGuard.mjs` already
covers the value (verify the build guard still reports it absent from `dist/`)

#### 3. Word round

**File**: `src/scenes/TaskScene.ts` (`freshRound`: `console.warn` naming stage and the reason when `buildWordRound`
returns null, before the dice branch); `tests/freshRoundWiring.test.ts` (the `calls('console.warn')` helper)

#### 4. Docs and follow-ups

**File**: `CLAUDE.md` ("Current state": one paragraph for this change in the neighbouring style — `DecodeResult`
`from`/`problem` and `Kod: corrupt/<field>`, `replaceGate` force for migration-failed/unknown-version/migrated corrupt,
`src/storage/startCounter.ts` + `balance.save.forceAfterStarts`, write-once `backup-v<N>` + `profile:default:backup-status`
(`readBackups`, `backupRecord`, `noteBackup`), copy after write + `balance.save.migrationWriteRetries`, `withTimeLimit`
`onLate`/`lateWrite`, `fatalError`, `src/storage/writerId.ts` (`tabId:nonce`, ended list) + `olderWriter`,
`src/storage/saveChannel.ts` + `channelVerdict` + `noticeOtherWriter`, refusal card `Kod:`, "Zachowaj kopię starego
zapisu", `downloadStarted`/`invalid`, `replaceUnconfirmed`, `unreadable-file`, `deviceBroken`, `roomStateProblems`,
`lateReadVerdict` + `?e2eSave=slowfail`, design gaps 126–138; save format stays v4); new
`context/changes/save-truth/follow-ups/review-fixes.md` (each with `Trigger:`: S12-03, S12-11, S12-13, SRR-07, SRR-13,
SV2-13, SV2-15, T-4/F6, V-3/V-5/V-8, P-7, L-S3, welcome-screen import, raw copy inside the dialogs, abort after a
timeout, two-build e2e, BroadcastChannel inside an iPadOS home-screen app (unverified), Safari floor for `count`)

#### 5. Seam sweep

**Contract**: no duplicated helper (one `isTimeoutError`, one `errorName`, one gate, one `deviceStorage`-style accessor
per storage kind); no fourth `isRecord` copy (if a phase added one, extract `src/core/isRecord.ts`); no stale comment
naming "hidden gives up after one", "a late success is dropped" without the observer, `'downloaded'`, or "later
migration overwrites backup-v3"; `docs/design-gaps.md` rows 126–138 match the DESIGN-GAP comments; every new storage key
listed in research's table and nowhere in `SAVE_KEYS`.

### Success Criteria:

#### Automated Verification:

- New `lateReadVerdict`, seam and warn tests red before, green after; unit `<branch baseline> + N`
- Deliberate break: `lateReadVerdict` returning `still-slow` for every `unavailable` → its case red; restored; meta-check: proves the verdict, the card flow is phase 15
- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; a deliberate broken path in `CLAUDE.md` → FAIL; restored
- Every follow-up entry has a `Trigger:` line (`grep -c '^Trigger:'` equals the entry count)
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] Seam sweep: every name `CLAUDE.md` adds exists in `src/`; no duplicated helper; gap rows 126–138 match the code comments; `SAVE_VERSION` 4 and `git diff --stat main -- tests/fixtures` shows only `save-v1-legacy-salon.json` added
- [reviewer] (CI at ship) workflow `CI` job `check` log matches `e2e hook: absent \([0-9]+ chunks checked\)` and `Tests +[0-9]+ passed` (seen in CI run 38966095199, job 117192831932: `Tests  3416 passed (3416)`, `e2e hook: absent (2 chunks checked)`)

---

## Phase 14: Another window's save stops this one at once — e2e (#2)

Driver: e2e
Driver why: risk #2 (progress lost or overwritten) for two pages of one origin exists only with real IndexedDB and a real BroadcastChannel — built in phases 7 and 8, contract `E2E=on`.

### Overview

Extend `tests/e2e/stale-tab.spec.ts` (hook build).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/stale-tab.spec.ts`

**Intent**:
(a) "#2 T-2 a second window's save stops the first before it writes": window B plays a saved round (`playSavedRound`);
without any action in window A, A's hook `save.blockedBy` becomes `otherTab` and the refusal card shows (no `staleWork`
in A), A's `writes` unchanged.
(b) "#2 T-5 the refusal card names its code": the card shows `pl.saveFailed.detail(OTHER_WRITER_SAVE, <build>)` text
(`Kod:` line).

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; hook read-only; never open IndexedDB from the
test; request-file protocol if Chromium will not start in the agent session (profile § 8): `e2e-request-p14.md` +
`e2e-break-p14a.patch` (`main.ts` channel wiring removed → (a) red) + `e2e-break-p14b.patch` (`detail` not passed →
(b) red); each expected-red test run alone (`-g`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/stale-tab.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2`
- Deliberate break p14a → (a) red; p14b → (b) red; each restored; meta-check: (a) proves delivery between two pages of one Chromium context, not iPadOS home-screen behaviour
- Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

#### Manual Verification:

- [human] Tablet with two browser tabs of the game: play in the second, return to the first — the calm card shows at once with a `Kod:` line

---

## Phase 15: A late read error and the old-version copy in the browser — e2e (#2, #7)

Driver: e2e
Driver why: risk #2 (a failed read must reach the parent truthfully; the old copy must be exportable, FR-021) and #7 (the exported copy imports) cross the load card, the download and the import dialog — built in phases 9 and 13, contract `E2E=on`.

### Overview

New tests in `tests/e2e/save-backup-health.spec.ts` (hook build).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/save-backup-health.spec.ts`

**Intent**:
(a) "#2 SVB-02 a read that fails while the parent waits shows the error card with its code": `?e2eSave=slowfail`,
`openSlowCard`, tap "Poczekaj dłużej" → the `pl.saveUnavailable` card with `Kod: UnknownError`, never the still-slow
line.
(b) "#2 #7 SV2-04 the kept old save can be saved and imported again": `?e2eSave=v1`, play until the hook shows the copy
`done`, open "Zapis gry", tap "Zachowaj kopię starego zapisu", confirm, `page.waitForEvent('download')`, then import
the downloaded file in a NEW browser context (fresh device) → the summary step lists the v1 save's stars.

**Contract**: as phase 14; break patches `e2e-break-p15a.patch` (`onWait` back to `still-slow` for every
`unavailable` → (a) red) and `e2e-break-p15b.patch` (button hidden → (b) red).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/save-backup-health.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2`
- Deliberate break p15a → (a) red; p15b → (b) red; each restored; meta-check: (b) proves the copy's bytes survive export and import, not that Safari keeps the key
- Build prints `e2e hook: absent (` (and `slowfail` absent from `dist/`); full local gate green; servers 4397/4398 killed

#### Manual Verification:

- [human] Tablet: after an update that migrated the save, "Zachowaj kopię starego zapisu" saves a file the Files app can open

---

## Testing Strategy

### Unit Tests:

- Decode report (`from`, `problem`, `step`), card code, v1 old-salon fixture; gate for migration-failed /
  unknown-version / migrated corrupt and for `unavailable` by count; `replace` logs.
- Store on fake-indexeddb: write-once, record, `readBackups`; autosaver op orders with fake timers (copy after write,
  bounded retry, V-6/V-7, `onLate`); `saveHealthView` lines across launches.
- `writeVerdict` ended nonces and `olderWriter`; `writerId`; `channelVerdict`, `noticeOtherWriter`, `saveChannel`
  no-op paths; `failureText`, rejection keys, source wiring tests; `roomStateProblems`; `lateReadVerdict`.

### Integration Tests:

- Phases 14–15 e2e plus the reversed assertions in `save-transfer-blocked.spec.ts`, `save-restart.spec.ts`,
  `save-transfer.spec.ts`, `save-backup-health.spec.ts`; existing specs as the regression net at every gate.

### Manual Testing Steps:

1. Two tabs on a tablet: save in the second, the first stops at once with a code line.
2. After an update that migrated the save: "Zachowaj kopię starego zapisu" gives a file.
3. Private mode / blocked storage: import dialog says "Uruchom grę ponownie" on the first start.

## Performance Considerations

One extra IndexedDB read (`backupRecord`) at start beside `loadSave`, `readBackups` only at panel open, one
`BroadcastChannel` post per write. Nothing on a frame path.

## Migration Notes

None for the save: format v4 unchanged, no fixture edited (one new frozen fixture). Existing `backup-v<N>` keys stay as
they are and become readable; the first launch of this build writes no record for a copy made by an older build (the
line then falls back to the session status, as today).

## Known risks

- **Write-once reverses `stale-tab-and-health`'s choice**: after two migrations the first raw copy is kept, not the
  latest (FU-3/P-8). `[human]` row 4.6.
- **SRR-08 makes the first `unavailable` start non-forceable**: a parent with a broken browser must restart once;
  where `localStorage` is blocked too, force never unlocks (the line promises nothing). `[human]` row 3.8.
- **BroadcastChannel inside an iPadOS home-screen app is unverified**: the channel is a hint; without it today's
  refusal at the next write stays.
- **Copy after write**: a kill between the v4 write and a later successful copy loses the copy — the same outcome as
  today's hidden give-up, now recorded as `lost`.
- **Several reversed tests** (phases 2, 3, 5, 10, 11): each is named in its phase; any other red test is a regression.
- **e2e load sensitivity** (profile § 8): the full suite runs ~10–12 min at 4 workers; a single flaky spec is re-run
  alone before it counts.

## References

- Research `context/changes/save-truth/research.md`; change `context/changes/save-truth/change.md`
- Scope and triage: `context/runs/2026-10-16-audit-sweep/audit-sweep-scope.md` § Slice 2, `triage-A.md`, `triage-B.md`, `triage-C.md`
- Audits `context/audits/observability/2026-10-14_0445-eksport-import-reset-widzety-obrazki.md`, `2026-10-15_0253-zapis-v2-siatka-minigry-slupek.md`, `2026-10-15_1314-limity-zapisu-zadania-tekstowe-obrazki.md`, `2026-10-15_2217-zapis-v3-ladowanie-grafiki.md`, `2026-10-16_0915-start-dzwieki-grafika-salon.md`, `2026-10-16_1419` (T-1..T-5)
- Contract `context/runs/2026-10-16-audit-sweep/agent-contract.md`; profile `context/foundation/autonomous-run.md` § 2, § 3, § 6, § 8, § 9
- Test plan `context/foundation/test-plan.md` risks #2, #7, #10; `context/foundation/test-stack.md` § E2E
- Format example `context/archive/2026-10-16-child-flow-guards/plan.md`
- Design: `Martynka-urzadza.md` § 8 "Zapis postępu", PRD FR-020..FR-022, `docs/design-gaps.md`

## Autonomous decisions

1. **SRR-01 keeps `reason: 'corrupt'` and adds `from`/`problem`**; "migrated corrupt" = `from < SAVE_VERSION`, treated
   like `migration-failed` by the card and the gate. Rejected: renaming to `migration-failed` (breaks the pinned
   `legacySalonMigration` rule). Also treats a save that was already bad in an older version as migrated-corrupt (it
   cannot be told apart; the cautious reading keeps it until a double confirmation). Would change: a reason-only
   consumer that cannot take `from`.
2. **The `corrupt` e2e seam becomes a v4-shaped corrupt save** so existing specs keep "corrupt in its own version";
   migrated corrupt is unit-proven. Rejected: reversing three specs to the migration card. Would change: a need to prove
   migrated corrupt in a browser.
3. **SRR-08: localStorage counter, force from the 2nd consecutive `unavailable` start** (`balance.save.forceAfterStarts`
   2), first-start line `deviceUnavailableFirst` promising nothing (research Q1). Rejected: wording change only. Would
   change: evidence that realistic iPad `unavailable` cases are all "site data blocked". `[human]` row 3.8.
4. **SRR-08 e2e by two loads, no new seam** (research Q5). Would change: the reload making the spec flaky.
5. **SRR-09 reuses `deviceUnreadable` + `force` + `forcedWarning`** (no new copy). Would change: the visual gate finding
   the line wrong for `unknown-version`.
6. **SRR-01 card reuses `saveMigrationFailed`** (research Q3, FR-021). Would change: the author's wording.
7. **Write-once `backup-v<N>` via `os.count` + `put` in one transaction** (not idb-keyval `update`, not `getKey`).
   Reverses `stale-tab-and-health`'s "later migration overwrites `backup-v3`" (design docs are silent; not against their
   text). `[human]` row 4.6. Would change: a project floor of Safari ≥ 15 (then `getKey`), or the maintainer preferring
   the latest copy.
8. **SVB-01: write first on a hidden flush, copy owed while `migrated.raw` is in memory.** Rejected: copy-before-write
   with only a persisted status. Would change: evidence that a v4 write can corrupt the key on a kill.
9. **P-1 retry cap `backupAttempts + 1`** as `balance.save.migrationWriteRetries` (research Q4). Would change: a store
   that recovers only after more tries.
10. **T-3 two-part writer `tabId:nonce` with an ended list** (last 8). Rejected: plain sessionStorage id (breaks B-1
    for duplicated tabs), BroadcastChannel collision check (not available everywhere). Would change: a report of a
    reload still refused.
11. **T-1 detection only**: `olderWriter` when `stored.version < page.version && page.base > 0`; the base-0 migration
    race stays undetected. Would change: a report of a lost save after a rollback.
12. **T-2 channel is a hint** behind `channelVerdict`; `writeVerdict` stays the authority. Would change: a false block
    report.
13. **R-4 `unknown-room` is log-only** (research Q2): every v1–v4 fixture and early devices hold `living`. Would change:
    a second room in the catalogue.
14. **Design gaps numbered in phase order 126–138**: 126 first-start line, 127 uncertain, 128 pending, 129 timeout, 130
    older writer, 131 old-copy button, 132 download started, 133 invalid export, 134 replace unconfirmed, 135 unreadable
    file, 136 broken device save, 137 panel room mismatch, 138 preview room mismatch. One `[human]` wording row (11.6)
    covers 127–136; 126 sits in row 3.8.
15. **Phases**: 1–8, 11, 12 `tdd`; 9, 10, 13 `impl`; 14, 15 `e2e` (risks #2, #7). ≤ 1 new UI element per phase (phase 9
    one button, phase 8 one card line); phase 13 is the last impl/tdd phase and carries the seam sweep, `CLAUDE.md` and
    the follow-ups file.
16. **Seven LOW deferred** as change.md lists, plus carried items; follow-ups written in phase 13. Would change: plan
    review asking to fold any back.
17. **Plan in English** like `change.md` and `research.md`; commit messages in Polish (profile § 1). No lessons file;
    no roadmap row (non-roadmap change).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Decode truth (V-1, SV2-07, L-S1, C-2r, SRR-01 report, V-4)

#### Automated

- [ ] 1.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- [ ] 1.2 Deliberate break: `problem` null after the loop / `cardCopyFor` without the `from` branch → red; restored; meta-check (decode report, not rendering)
- [ ] 1.3 `git diff --stat tests/fixtures` shows only the new `save-v1-legacy-salon.json`; `SAVE_VERSION` still 4; every v1–v4 fixture test green
- [ ] 1.4 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`)
- [ ] 1.5 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `save-restart.spec.ts` and `save-transfer-blocked.spec.ts` green with the changed `corrupt` seam

#### Manual

- [ ] 1.6 [reviewer] `decodeSave` still never throws; `validateSave`/`saveProblem` rules unchanged; the new fixture is not referenced by any write path
- [ ] 1.7 [visual] The unreadable-save card with `Kod: corrupt/stars` (seam `corrupt`), at 1440 (1920×1080 fit) and 1024×768

### Phase 2: Replace gate for saves that cannot be read (SRR-09, SRR-01 gate, SRR-10)

#### Automated

- [ ] 2.1 Reversed and new tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 2.2 Deliberate break: `replaceGate` back to `future ? Blocked : ok` → reversed cases red; restored; meta-check (one gate)
- [ ] 2.3 Full local gate green; build prints `e2e hook: absent (`
- [ ] 2.4 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; "#2 an unreadable save warns instead of showing the fresh session" green

#### Manual

- [ ] 2.5 [reviewer] No second gate in the dialogs: `force` offered only through `deviceSaveView.forceable`
- [ ] 2.6 [visual] Reset dialog over a `migration-failed` save: step one without "Zacznij od nowa", then "Zastąp mimo to" + warning, at 1440 and 1024×768

### Phase 3: Unavailable starts counter (SRR-08)

#### Automated

- [ ] 3.1 New and reversed tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 3.2 Deliberate break: `replaceGate` ignoring `unavailableStarts` / `bump` on a throwing storage returning 2 → red; restored; meta-check (rule and module)
- [ ] 3.3 `martynka:unavailableStarts` not a registry key and not in `SAVE_KEYS` (`tests/saveKeys.test.ts` green unchanged)
- [ ] 3.4 Full local gate green; build prints `e2e hook: absent (`
- [ ] 3.5 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; the two edited `save-transfer-blocked.spec.ts` tests green

#### Manual

- [ ] 3.6 [reviewer] DESIGN-GAP 126 row and comment present; `src/core` reads no `localStorage`
- [ ] 3.7 [visual] Import dialog on the first `unavailable` start and on the second (with "Zastąp mimo to"), at 1440 and 1024×768
- [ ] 3.8 [human] Accept that a save the browser refuses can be overwritten only after a second start, and the wording of gap 126

### Phase 4: Write-once, readable backups and the backup record (FU-3/P-8, SV2-04 store, SVB-01 record)

#### Automated

- [ ] 4.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 4.2 Deliberate break: `backup` without the `count` check → "a second backup keeps the first" red; restored; meta-check (fake-indexeddb)
- [ ] 4.3 `SAVE_VERSION` still 4; `git diff --stat tests/fixtures` empty
- [ ] 4.4 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `save-backup-health.spec.ts` and `save-migration.spec.ts` green

#### Manual

- [ ] 4.5 [reviewer] No code path deletes or overwrites a `backup-v<N>` key; the record is never read by `decodeSave` or `read`
- [ ] 4.6 [human] Accept that a later migration keeps the FIRST old copy (reverses `stale-tab-and-health` "a later migration overwrites `backup-v3`")

### Phase 5: Copy after the write, bounded retry of the first write (SVB-01, V-6, V-7, P-1)

#### Automated

- [ ] 5.1 New and reversed tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 5.2 Deliberate break: hidden give-up on the first failure / `arm` call removed → red; restored; meta-check (scheduler over a scripted store)
- [ ] 5.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `save-backup-health.spec.ts` and `save-migration.spec.ts` green

#### Manual

- [ ] 5.4 [reviewer] The copy is never taken from the stored key; `noteBackup` failure never blocks a write; the retry is bounded

### Phase 6: "Zapis gry" tells the truth across launches (SVB-01 line, P-1 line, SVB-03, SRR-11, visual V1)

#### Automated

- [ ] 6.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 6.2 Deliberate break: `migrationOf` reading `writes` / `onLate` changing the race result → red; restored; meta-check (view and observer)
- [ ] 6.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `save-backup-health.spec.ts`, `save-migration.spec.ts`, `health-lines.spec.ts` and `save-restart.spec.ts` "#2 C-2 …" green

#### Manual

- [ ] 6.4 [reviewer] DESIGN-GAP 127–129 rows and comments present; `backupRecord`, `lateWrite`, `fatalError` absent from `encodeSave` and `SAVE_KEYS`
- [ ] 6.5 [visual] "Zapis gry" with the `pending` line, the `lost` line and the timeout line, at 1440 and 1024×768

### Phase 7: Writer identity and an older build's write (T-3, T-1)

#### Automated

- [ ] 7.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`; existing `writeVerdict` and B-1 tests green unchanged
- [ ] 7.2 Deliberate break: ended-list check on `tabId` alone / `olderWriter` without `base > 0` → red; restored; meta-check (verdict, not the reload race)
- [ ] 7.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `stale-tab.spec.ts` and `load-and-tab-guard.spec.ts` green

#### Manual

- [ ] 7.4 [reviewer] DESIGN-GAP 130 row and comment present; `writer`/`generation` stamping unchanged (format v4)
- [ ] 7.5 [visual] "Zapis gry" with the older-writer line, at 1440 and 1024×768

### Phase 8: Early stale signal and the refusal code line (T-2, T-5)

#### Automated

- [ ] 8.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 8.2 Deliberate break: `channelVerdict` without the `generation > base` guard → red; restored; meta-check (rule, not delivery)
- [ ] 8.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `stale-tab.spec.ts` green

#### Manual

- [ ] 8.4 [reviewer] `writeVerdict` remains the authority; no `BroadcastChannel` outside `src/storage/`
- [ ] 8.5 [visual] Refusal card with the `Kod:` line, at 1440 and 1024×768

### Phase 9: Keep a copy of the old save from "Zapis gry" (SV2-04 UI)

#### Automated

- [ ] 9.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 9.2 Deliberate break: `kind:'save'` instead of `'raw'` → round-trip test red; restored; meta-check (envelope and wiring)
- [ ] 9.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `parent-settings` and `save-transfer.spec.ts` green

#### Manual

- [ ] 9.4 [reviewer] DESIGN-GAP 131 row and comment present; no read of backups outside the panel open
- [ ] 9.5 [visual] "Zapis gry" with the "Zachowaj kopię starego zapisu" button after a v1 migration, at 1440 and 1024×768

### Phase 10: Export says what happened (S12-07, S12-04, O4)

#### Automated

- [ ] 10.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 10.2 Deliberate break: `openExport` without the validation → wiring test red; restored; meta-check (source wiring)
- [ ] 10.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; the two edited specs green

#### Manual

- [ ] 10.4 [reviewer] DESIGN-GAP 132–133 rows and comments present; the share-sheet path unchanged
- [ ] 10.5 [visual] Export dialog after "Zapisz plik" with the `downloadStarted` line, at 1440 and 1024×768

### Phase 11: Import and reset say what happened (SVB-04, S12-08, S12-05, O2, V2)

#### Automated

- [ ] 11.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 11.2 Deliberate break: timeout branch removed from `failureText` → red; restored; meta-check (text rule)
- [ ] 11.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; the edited SV2-02 spec green

#### Manual

- [ ] 11.4 [reviewer] DESIGN-GAP 134–136 rows and comments present; `rejected` stays an exhaustive record
- [ ] 11.5 [visual] Reset dialog after a `writehang` timeout with `replaceUnconfirmed`, at 1440 and 1024×768
- [ ] 11.6 [human] Accept the wording of gaps 127–136 as one read of the parent's save copy

### Phase 12: Room state checked against the salon (R-4)

#### Automated

- [ ] 12.1 New tests red before the change (assertion), green after; unit `<branch baseline> + N`
- [ ] 12.2 Deliberate break: `parentVisible` true for `unknown-room` → fixture case red; restored; meta-check (rule over frozen fixtures)
- [ ] 12.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `room-*.spec.ts` and `save-transfer.spec.ts` green

#### Manual

- [ ] 12.4 [reviewer] DESIGN-GAP 137–138 rows and comments present; no repair of `rooms`; `REGISTRY_KEYS.roomProblems` absent from `SAVE_KEYS`
- [ ] 12.5 [visual] Import preview of a file whose salon has an over-count, at 1440 and 1024×768

### Phase 13: Late read error, word round warn, docs and seam sweep (SVB-02, SV2-11)

#### Automated

- [ ] 13.1 New `lateReadVerdict`, seam and warn tests red before, green after; unit `<branch baseline> + N`
- [ ] 13.2 Deliberate break: `lateReadVerdict` `still-slow` for every `unavailable` → red; restored; meta-check (verdict)
- [ ] 13.3 `validate-rule-files.sh` PASS; deliberate broken path in `CLAUDE.md` → FAIL; restored
- [ ] 13.4 Every follow-up entry has a `Trigger:` line
- [ ] 13.5 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual

- [ ] 13.6 [reviewer] Seam sweep: every name `CLAUDE.md` adds exists in `src/`; no duplicated helper; gap rows 126–138 match the code comments; `SAVE_VERSION` 4 and only `save-v1-legacy-salon.json` added under `tests/fixtures`
- [ ] 13.7 [reviewer] (CI at ship) workflow `CI` job `check` log matches `e2e hook: absent \([0-9]+ chunks checked\)` and `Tests +[0-9]+ passed` (seen in CI run 38966095199, job 117192831932)

### Phase 14: Another window's save stops this one at once — e2e (#2)

#### Automated

- [ ] 14.1 `npx playwright test tests/e2e/stale-tab.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2`
- [ ] 14.2 Deliberate break p14a → (a) red; p14b → (b) red; each restored; meta-check
- [ ] 14.3 Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

#### Manual

- [ ] 14.4 [human] Tablet with two browser tabs: play in the second, return to the first — the calm card at once with a `Kod:` line

### Phase 15: A late read error and the old-version copy in the browser — e2e (#2, #7)

#### Automated

- [ ] 15.1 `npx playwright test tests/e2e/save-backup-health.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2`
- [ ] 15.2 Deliberate break p15a → (a) red; p15b → (b) red; each restored; meta-check
- [ ] 15.3 Build prints `e2e hook: absent (` (and `slowfail` absent from `dist/`); full local gate green; servers 4397/4398 killed

#### Manual

- [ ] 15.4 [human] Tablet: after an update that migrated the save, "Zachowaj kopię starego zapisu" saves a file the Files app can open
