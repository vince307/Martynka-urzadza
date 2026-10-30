<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Rooms and the house as game data, save format v5 carrying the house

- **Plan**: context/changes/rooms-as-data/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7
- **Date**: 2026-10-30
- **Verdict**: APPROVED (after the fix commit `4b1c37e`)
- **Findings**: 0 critical, 2 warnings (both fixed), 4 observations

Reviewed by the impl-review step of run 2026-10-30-rooms-kitchen, diff `9d28753..66f16c4` read in full (src, scripts, vite,
playwright config, tests, fixtures) by the reviewer itself; no subagents (the code diff is ~900 lines and the save
migration needed first-hand probes). Phases 6.6–6.9 are manual/CI rows and were not ticked here.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS (after F2) |
| Architecture | PASS |
| Pattern Consistency | PASS (after F1) |
| Success Criteria | PASS |

## Save migration v4 -> v5 (ships to every child's device) — checked first-hand

| check | evidence (observed in this step) |
|---|---|
| Lossless lift | probe: `encodeSave(decodeSave(fixture).session)` deep-equals `{ ...fixture, version: 5, house: { id: 'house-1', rooms: [salon (0,0)] }, generation: 0, writer: '' }` for BOTH `save-v4-salon.json` and `save-v4.json` (every room incl. the unknown `living`, `tasksDone`, `chosen` variants, stage task, stars, settings, full learner, variants). Now pinned by the new `it.each` in `tests/saveV5.test.ts` (F2). Unknown TOP-level keys are dropped by `encodeSave` as in every version since v1 (field-by-field copy, pre-existing); the raw v4 bytes stay in `backup-v4` (F6). |
| Frozen fixtures v1–v4 untouched | `git diff --stat 9d28753..HEAD -- tests/fixtures/save-v1* save-v2* save-v3.json save-v4.json src/core/migrations/legacySalon.ts src/storage public src/data/balance.ts src/data/curriculum` empty; `save-v4-salon.json` has one commit (`dd6db69`, phase 1, while `SAVE_VERSION` was 4) |
| `backup-v4` write-once | no change to `putBackupOnce`/`backup`/`attempt` in `src/storage/idb.ts` (diff empty); `readBackups` loops `from < SAVE_VERSION` so v4 is read; `tests/idbStore.test.ts` "a v4 copy goes to backup-v4", `tests/autosave.test.ts` "a start migrated from v4 copies the raw v4 save with from 4" (`ops ['write','backup']`), `tests/fixtureLoadPath.test.ts` both v4 fixtures through real IndexedDB |
| Older build meets v5 as `future`, never overwrites | probe on a worktree of `main` at `9d28753` (v4 code): `decodeSave(save-v5.json)` = `{ kind: 'unreadable', reason: 'future' }`; `writeVerdict(v5, { version: 4 … }, 'normal'|'replace')` = `refuse NewerSave` both. Rollback note in `deploy/README.md`. |
| Strict check order | `saveProblem` checks `house` last; `tests/saveV5.test.ts` "checks the house after stars" |
| No start-time write for an unchanged v5 save | `src/main.ts` load path marks dirty on `!houseEqual(session.house, savedHouse)` (structural), on a move, or on repair only |

## Findings

### F1 — e2e finished-salon test opened IndexedDB directly

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: tests/e2e/rooms-as-data.spec.ts, test "#10 rooms-as-data a finished salon reopens in the salon, never in the kitchen cell"
- **Detail**: After `page.reload()` the test ran `indexedDB.open('martynka')` in the page and read `saves/profile:default`. Profile § 9: a test never opens or clears IndexedDB and reads the save only through the hook's read-only status. It also coupled the spec to the store's database and key names.
- **Fix**: the e2e hook snapshot (`installE2EHook` in `src/testing/e2eHook.ts`, e2e build only) gains `rooms` (a deep-frozen `structuredClone` of `REGISTRY_KEYS.rooms`), typed in `tests/e2e/support/hook.ts` `Snapshot.rooms`; the spec now asserts `save` `{ load: 'loaded', migratedFrom: null }` (the reloaded page read the stored save), `house`, `rooms.salon.tasksDone === SALON.tasks.length` and `Object.keys(rooms)` equal `['salon']` (stricter than the old "no kitchen key").
- **Decision**: FIXED — `4b1c37e`. Playwright could NOT be re-run in this step (ports 4397/4398 held by the orchestrator's full suite); the orchestrator re-runs `npx playwright test tests/e2e/rooms-as-data.spec.ts -g "finished salon"` green, then with the break "in `roomInRenovation` (`src/core/house.ts`) return `cell.room` instead of `continue` for an unknown room" red on `currentRoom` ("kitchen" vs "salon") and on the `rooms` keys, then restored.

### F2 — v4 lift test checked the learner by stage only

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: tests/saveV5.test.ts, "decodes the v4 salon fixture as migrated from 4 and keeps every field of the game"
- **Detail**: the test compared rooms, stars, settings and variants, but the learner only by `stage`: a loss of mastery, streak, history or unlock in the v4 -> v5 path would stay green (the v5-fixture round trip covers `toSession` for v5 input, not the migrated path of a real v4 device).
- **Fix**: `it.each(['save-v4-salon.json', 'save-v4.json'])` "survives decode and encode whole": `encodeSave(decodeSave(v4).session)` equals the literal `{ ...raw, version: 5, house: SALON_HOUSE, generation: 0, writer: '' }`.
- **Decision**: FIXED — `4b1c37e`. Breaks re-executed: `LIFT_V4_HOUSE` resetting `variants.roundsSince` → 4 red; `toSession` dropping `streak` → 3 red (both new cases + the v5 round trip) while the older "keeps every field" case stayed green, which is the gap this closes; each restored, `git diff --stat` empty.

### F3 — frozen `copyOfHouseV5` repeats `copyHouse`

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/core/migrations/house.ts `copyOfHouseV5`
- **Detail**: one more house-copy helper beside `copyHouse` (`src/core/house.ts`), against the phase-6 sweep wish "one `copyHouse`". It is right for a FROZEN migration step not to depend on live code (the `legacySalon.ts` pattern).
- **Fix**: keep; recorded as follow-up 15 so nobody "deduplicates" it.
- **Decision**: ACCEPTED

### F4 — done-card `mode` only follows the current room's tile

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/widgets/RoomDoneCard.ts `show` / `drawRoomTile` (`if (isCurrent) this.mode = mode`)
- **Detail**: when no listed room is `current` (unknown saved house, current room outside the list), `mode` keeps the previous card's value. Unreachable with one room.
- **Fix**: reset `mode` at the start of `show` when S-22 lists a second room (follow-up 14, Trigger: S-22).
- **Decision**: DEFERRED (follow-up 14)

### F5 — plan break 7.1 "drop `house` from `toSession`" is masked by design

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: src/main.ts load path (`mergeHouse`), plan row 7.1
- **Detail**: the phase-7 agent recorded that the literal break stays green in the browser because the load path rebuilds the house from data, and replaced it with a merge bypass. Correct; the unit break of the same rule (phase 2.2) is red in `tests/saveV5.test.ts`.
- **Decision**: ACCEPTED

### F6 — unknown top-level keys are not carried through a write

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/save.ts `encodeSave`
- **Detail**: pre-existing since v1 (field-by-field copy); not a regression of this change. Unknown room ids inside `rooms` ARE kept (proved with `save-v4.json` `living`), and the raw v4 save is kept whole in the write-once `backup-v4`.
- **Decision**: ACCEPTED

## Success criteria re-run in this step

| command | result |
|---|---|
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm test` at `66f16c4` (before the fix) | 213 files, 4012 passed |
| `npm test` at `9d28753` (worktree of main, same machine) | 209 files, 3962 passed = contract baseline 3962 |
| `npm test` after `4b1c37e` | 213 files, 4014 passed = 3962 + 50 (phases 1-7, +4 files) + 2 (F2) |
| `bash deploy/test-martynka-deploy.sh` / `bash deploy/ops/test-martynka-ops.sh` | OK / OK |
| `npm run sample -- E1` … `E6` | `Naruszenia: 0` ×6 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` (the `v4-salon` marker and the new `rooms` field are absent from `dist/`) |
| `validate-rule-files.sh` | PASS (24 files, 591 paths) |
| suppressions in the diff (`eslint-disable`, `@ts-ignore`, `.skip(`, `.only(`) | none (the one `as never` was in the removed IndexedDB read) |
| e2e | not run here (orchestrator's full suite held 4397/4398); evidence for 7.2 comes from the orchestrator |

Manual rows: 6.6 [visual] pending (visual gate), 6.7/6.8 [human] pending, 6.9 [reviewer] (CI at ship) stays open for ship —
it names job `check` of workflow `CI` and the log lines `Tests +[0-9]+ passed` and `e2e hook: absent \(`.

Content teacher read: the only player-facing text change is `pl.room.name: 'Salon'` → `pl.room.names: { salon: 'Salon' }`
(same word; parent summaries now say "Salon" instead of the raw id "salon", plan review F3). No new nouns, numerals or prompts.

MERGE: CLEAR — no CRITICAL; the v4→v5 lift is lossless, write-once backed up and refused by older builds; both WARNINGs fixed in 4b1c37e, pending only the orchestrator's re-run of the changed finished-salon spec.
