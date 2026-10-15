<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Zapis v3 z migracją starego salonu, limit czasu ładowania grafiki i zapis po migracji przy starcie

- **Plan**: context/changes/salon-load-health/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5
- **Date**: 2026-10-15
- **Verdict**: APPROVED (after the fixes in 4fb1a5b)
- **Findings**: 0 critical, 3 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (F1 fixed) |
| Scope Discipline | PASS |
| Safety & Quality | WARNING (F2, F3: recorded, no data-loss path) |
| Architecture | PASS |
| Pattern Consistency | PASS (F4 fixed) |
| Success Criteria | PASS |

## Evidence (observed in this review, not inherited)

| Check | Result |
|---|---|
| `npm run lint`, `typecheck` | pass, pass (before and after 4fb1a5b) |
| `npm test` | 2925 passed (158 files). Reconciliation: main 7f831c5 has 2939; the deleted `tests/salonRemap.test.ts` had 62 (11 × 5 per old count + 7); new and changed tests add 48: 2939 − 62 + 48 = 2925. 4fb1a5b changes one assertion, adds none (+0) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh`, `sample` E1–E6 | pass |
| `npm run build` | pass, `e2e hook: absent (2 chunks checked)` |
| Full e2e `npx playwright test --config=…/playwright.config.ts --workers=4` (this session, Chromium started, tree including 4fb1a5b) | **101 passed** (7.2 m) = baseline 98 + 3 |
| Deliberate break 1 (phase 2, tdd): `createAutosaver` start arming disabled (`if (false && …)`) | 5 failed in `tests/autosave.test.ts` ("a migrated start writes without a change…", "a failed copy keeps the device save untouched…", "a hidden flush…", "a v2 copy and the log name the real versions (F4)", F3); restored |
| Deliberate break 2 (phase 1, tdd): `LIFT_V2_SALON` without the `isRecord(salon.chosen)` guard | 1 failed: "the step is total: chosen is null gives corrupt, never migration-failed" (assertion, not an import error); restored |
| Deliberate break 3 (F1 fix): 4fb1a5b's migration change reverted, test kept | 1 failed: "an old salon that also holds an unknown key…" ; fix restored, green |
| Save data on the real chain (scratch script through `decodeSave`/`parseImport`) | v1, v1-fresh → ok `migratedFrom 1`; v2, v2-fresh, v2-legacy-salon → ok `migratedFrom 2` (legacy salon → `{tasksDone 4, chosen {sofa 2, rug 0, coffee-table 0}}`); v3 → ok `migratedFrom null`; every decoded session encodes as `version 3`; `version: 4` → `future`; null, 1, "x", [], {}, `{version:2}`, bad variants, `rooms: null`, `version: "2"`, own `__proto__` keys → `corrupt`, never a throw; `parseImport` accepts v1, v2, v2-legacy, v3 files |
| Fixtures | `git diff --name-status main -- tests/fixtures/` = `A save-v2-legacy-salon.json`, `A save-v3.json` only (v1/v2 byte-identical) |
| `deploy/` | `git diff --stat main -- deploy/` = `deploy/README.md` 1 line (rollback note citing `pl.saveFuture`) |
| Phaser 4.2.1 loader (source read) | `File.js` gives every file `XHRSettings()` with `timeout: 0`; `MergeXHRSettings` copies every local value that is not `undefined`, so 0 overrides `loader.timeout` (the phase-3 config alone was a no-op, as the plan note says). `LoaderPlugin.addFile` emits `Events.ADD` per file (arrays included) before loading; BootScene attaches the listener before `load.font` and the image loops; `File.onError` → `resetXHR()` + `load()` on the same object, so `file.xhrSettings.timeout` survives every retry (`retryAttempts` from `maxRetries` per file). Font: see F2 |
| Hooks | no `--no-verify`, no harness edits in `git log main..HEAD` |

## Reviewer rows

- 1.5 PASS: `src/core/save.ts` imports only `./placement`, `./migrations/legacySalon`, `./rooms`, `./types`; `legacySalon.ts` imports nothing; tables are literals with "FROZEN LITERALS, never edited"; `SaveV3 = Omit<SaveV2,'version'> & {version: 3}`, no new fields.
- 2.5 PASS: `migrationWrittenAt` and `'migration'` live only in `AutosaveStatus`/`WriteReason` (not in `encodeSave`/`saveProblem`); the only start-write decision is in `createAutosaver` (main.ts calls `markDirty` only for a repaired room); copy logs use `v${SAVE_VERSION}`/`v${from}`, last hard-coded comments fixed in 4fb1a5b.
- 3.4 PASS: `timeoutMs`/`maxRetries` only in `balance.loader` with the budget comment; the 2000 ms seam constant sits with the other `E2E_*` constants in `src/testing/e2eHook.ts` and is used only under `__E2E_HOOK__ && forcedArt === 'stall'`; build guard reports the hook absent.
- 4.4 PASS: `grep -rnE "remapLegacySalon|LEGACY_SALON\b|LegacyRoomLayout" src tests CLAUDE.md docs deploy scripts vite` empty; the README note quotes `pl.saveFuture.title` and matches its body (save safe, not changed, plays without saving until the newer build).

## Findings

### F1 — M-2: an unknown non-legacy key in an old salon was dropped, and the test did not check it

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/core/migrations/legacySalon.ts (`LIFT_V2_SALON`), tests/legacySalonMigration.test.ts
- **Detail**: Plan decision 3 and the contract ("keep unknown non-legacy keys") require such a key to stay in `chosen`. The step rebuilt `chosen` from the target prefix only, so the key was lost; the test titled "...keeps that key ... in the data" used `toMatchObject`, which passes without the key. No live v2 build wrote such keys, so no device was at risk.
- **Fix**: Carry keys that are neither old-only nor target slots; assert the whole `chosen` with `toEqual`.
- **Decision**: FIXED (4fb1a5b; red without the code change, green with it)

### F2 — The font file has no load time limit (H-2 open for one file)

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/scenes/BootScene.ts (`preload`, `this.load.font`)
- **Detail**: Phaser 4.2.1 `FontFile` is `FILE_POPULATED` in its constructor, so `File.load` skips XHR and `onProcess` awaits `new FontFace(...).load()` with no limit; the per-file timeout copy does not reach it. A font fetch that never answers on a first launch (before the service worker caches it) still keeps the loading bar. The plan already listed "FontFace limit" as out of scope; the review sharpened the note (the first load is unlimited too, not only a second one).
- **Fix**: Wrap the font in a time-limited own load (race `FontFace.load()` against a timer from `balance.loader.timeoutMs`) when the trigger fires.
  - Strength: closes H-2 for every queued file.
  - Tradeoff: a custom loader path beside Phaser's.
  - Confidence: MED — font is precached after the first start, so the window is first launch only.
  - Blind spot: WebKit behaviour of a stalled `FontFace` not observed.
- **Decision**: DEFERRED to follow-ups (Trigger: a parent report of a blank start, or the next change to `BootScene.preload`)

### F3 — The v3 start write makes every rollback below this build a no-save state

- **Severity**: ⚠️ WARNING
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: Safety & Quality
- **Location**: src/core/autosave.ts (start arming), src/core/save.ts (`SAVE_VERSION = 3`)
- **Detail**: With M-3 every device that opens this build writes v3 within ~0.5 s; a rollback to a v2 build shows the `future` card and plays without saving until the newer build returns. Progress is never lost (the v3 save is untouched, `backup-v2` holds the raw v2), but play during a rollback is not saved. This is the one-way door accepted by the maintainer at Step 0 and documented in `deploy/README.md`.
- **Fix**: none in code; `[human]` row 1.6 stays for the maintainer.
- **Decision**: ACCEPTED (maintainer, run Step 0)

### F4 — Stale version wording and a hook type gap

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/core/autosave.ts (`backupAttempts` doc, attempt comment), src/testing/e2eHook.ts (`slow`/`v1` seam docs), tests/roomsData.test.ts (marker comment), src/scenes/BootScene.ts (seam comment), tests/e2e/support/hook.ts (`lastReason` union without `'migration'`)
- **Fix**: Version-neutral wording; `'migration'` in the hook type.
- **Decision**: FIXED (4fb1a5b)

### F5 — The BootScene timeout listener is protected only by e2e (c)

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: src/scenes/BootScene.ts (`Loader.Events.ADD` listener, f4415a5)
- **Detail**: Phase 3 planned a config-only change; f4415a5 changed that contract (documented in the plan note). Break p5c removes the config key, the pre-fix state was red too, so (c) proves the listener; no unit test isolates it.
- **Decision**: RECORDED (follow-up, Trigger: a Phaser upgrade, or the next change to `BootScene.preload`)

### F6 — `isRecord` copied three times in `src/core`

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/core/save.ts, src/core/saveFile.ts, src/core/migrations/legacySalon.ts
- **Decision**: RECORDED (follow-up, Trigger: a fourth copy)

### F7 — A failed copy at start leaves the v3 write waiting for a change or flush

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/autosave.ts (`attempt`, `save`)
- **Detail**: Known risk plan-review F8, pinned by a unit test; copy goes before speed, the device save stays v2 and readable. Also: outside the `replace` path, a write that fails after the copy was given up leaves the copy owed, so later attempts retry it once more each (more tries, never a block).
- **Decision**: RECORDED (follow-up)

MERGE: CLEAR — no CRITICAL; save format v3 verified on data (total step, future at v4, single backup per original version, copy before every first v3 write, fixtures byte-identical), unit 2925 = 2939 − 62 + 48, e2e 101 = 98 + 3 observed in this session, F1/F4 fixed in 4fb1a5b, remaining warnings recorded with triggers or accepted by the maintainer.
