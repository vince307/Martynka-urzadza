<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Minigry (Hasło z wyników, Zakrywanka) i zagadka dnia za podwójne gwiazdki

- **Plan**: context/changes/minigame-daily-puzzle/plan.md
- **Mode**: Deep (codebase checked directly in this step; no sub-agent)
- **Date**: 2026-10-14
- **Verdict**: REVISE → SOUND after triage (all findings applied to plan.md or recorded under `## Known risks`)
- **Findings**: 1 critical, 7 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING |
| Plan Completeness | WARNING |

## Grounding

Grounding: 12/12 paths ✓ (`src/core/{save,autosave,saveFile,saveHealth}.ts`, `src/main.ts`, `src/storage/idb.ts`,
`src/testing/e2eHook.ts`, `src/scenes/{TaskScene,UIScene}.ts`, `src/ui/dom/{saveFailedCard,saveImportDialog,saveExport}.ts`,
`vite/e2eHookGuard.mjs`, `tests/fixtures/save-v1*.json`), symbols ✓ (`MIGRATIONS`, `decodeSave`, `saveProblem`,
`validateSave`, `encodeSave`, `loadSave`, `createAutosaver` `attempt`, `replaceGate`, `deviceSaveView`, `parseImport`,
`RAW_FILE_NAME`, `stepTwo`, `freshRound`, `finishRound`, `beginRound`, `applyParentStage`, `E2E_SAVE_SEAMS`), brief↔plan ✓.
Progress↔Phase ✓ (13 phases, 68 rows, every success bullet has a row, no checkboxes outside Progress). `Driver:` 13/13.
No `lessons.md`, no `docs/reference/contract-surfaces.md`.

## Save-safety walk (the slice's one-way door)

Checked against the code, not the plan:

- `decodeSave`: the only version comparison is `from > SAVE_VERSION` → `future`; bumping to 2 makes v3 `future` with no
  other change. `replaceGate` and `deviceSaveView` key on `loadReason === 'future'` → SIR-01 holds for v2 unchanged. ✓
- A v1 save cannot be overwritten by a fresh session: `main.ts` creates the autosaver blocked (`blockedBy`) on
  `unreadable`/`unavailable`, so a `migration-failed` load never writes; `loadSave` maps only `undefined` to `fresh`. ✓
- Half-migrated: migration runs on a copy at read time, the result is validated before use, nothing is written during the
  load; the first write is an ordinary autosave of the full v2 state (one key, one transaction). ✓
- `backup-v1`: runs in `attempt`, i.e. on every autosave write path, before `store.write`; it is not part of `loadSave`,
  so it cannot fail the load. Gaps fixed below: optional `backup?` (F3), no in-app read path and permanent-failure policy
  (F5). `replace` (import/reset) bypasses it by design — explicit parent action behind confirmation (2.5 covers it).
- `MIGRATIONS[1]` as a record spread cannot throw, so `migration-failed` is practically unreachable in v2 (F7).
- Two tabs (old v1 tab still open next to a v2 tab): last writer wins as today; a v1 write over v2 is re-migrated (only
  `variants` reset). Deferral of the two-instance follow-up is justified in `change.md`.

## Triggered follow-ups

All follow-ups whose `Trigger:` names S-15 / "first save-format change (v2)" / "first migration step" are triaged in
`change.md` and the plan: in scope — MIGRATIONS 1→2 + fixtures + `backup-v1`, L-S1, visual-gate O1, S12-09, S12-14, M-1/M-2/M-13
for the new branch; substituted — two-build e2e (`?e2eSave=v1`, follow-up kept); deferred with justification and new
trigger — two instances / S12-15, S13-06 (and the S-13 `select` preview item), M-S1 `deploy/` part (contract forbids
`deploy/`), S12-07/08/12/13; not triggered (migration does not go through `replace`, import stays in the dialog) —
S12-02/03/11. Convincing.

## Product decisions

Every 4th round, ×2 multiplier, Hasło letter-per-answer, E3–E4-only pool, dice 0–12 for all stages, variants outside
mastery, no fail state, no timers: none clearly wrong against PRD FR-024/025, plan § 13 or ZADANIA § 4–5; each now has a
`[human]` row (8.5, 10.6 — F10 added ×2-for-second-try and `migration-failed` forceability).

## E2E seam coverage

Read every `tests/e2e/*.spec.ts`. Each test gets a fresh context (no shared `page` in serial files). Tests that can complete
3 ordinary rounds and start a 4th in one context: `adaptive` (up to 12), `room-purchase` (MAX_ROUNDS 4), `parent-settings`
(progress test, up to 3 then `nextRound`). `save-transfer` plays one round per test (seam harmless). No other spec reaches
a 4th round. The plan's phase-7 list is complete, and phase 7 is where variants first appear (puzzle, E3–E4) — every one
of those specs runs E3/E4. ✓

## Findings

### F1 — Phase 3 breaks two existing e2e specs it does not list

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3
- **Detail**: O1 gives the `future` save its own card copy and S12-14 dates the raw file name (`RAW_FILE_NAME =
  pl.saveFailed.fileName`). `?e2eSave=unreadable` is a `future` save; `save-restart.spec` (`#2 FR-021 an unreadable save…`)
  asserts `pl.saveFailed.title` and `suggestedFilename() === pl.saveFailed.fileName`, and `save-transfer-blocked.spec` calls
  `playOnWithBlockedSave(page, 'unreadable', pl.saveFailed)`. The phase claims e2e `+0` with no spec edits — not independently green.
- **Fix**: Phase 3 § 4 lists both specs and the new keys; criterion 3.4 names them.
- **Decision**: FIXED

### F2 — Phase 11(b) cannot observe the backup or the written version

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 3 § 3, Phase 11
- **Detail**: the hook's `save` is `saver.status()`; `saver.current()` always encodes v2, so "hook `save.version === 2`" is
  vacuous, and nothing exposes the order of `backup` and `write` in the in-memory store.
- **Fix**: the `v1` seam store keeps an op log and the last written version, exposed as `save.store` (e2e build only);
  phase 11(b) asserts `writtenVersion === 2` and `ops` starting `['backup', 'write']`.
  - Strength: proves the store, not the encoder. Tradeoff: one more hook field. Confidence: HIGH — read `e2eHook.ts` `save()`.
    Blind spot: none significant.
- **Decision**: FIXED

### F3 — Optional `SaveStore.backup?` can skip the backup silently

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 § 2
- **Detail**: with an optional method, a store without it (any of the fake stores, or a future adapter) would let the
  first write overwrite v1 with no copy. Key hard-coded to `default`/`v1`.
- **Fix**: `backup` required; key from `profileId` and `migratedFrom`; named unit tests (idbStore: copy deep-equals raw,
  main key untouched until the v2 write; autosave: throwing copy → zero writes, retry on next flush).
- **Decision**: FIXED

### F4 — Phase 13 break (b) may stay green

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 13 (13.3)
- **Detail**: removing `variants` from `SAVE_KEYS` only stops `markDirty` on that key; the last answer's stars already
  dirtied the save and `flush('now')` writes the whole `snapshot()`, variants included.
- **Fix**: break the snapshot in `main.ts` (start values instead of the registry's `variants`).
- **Decision**: FIXED

### F5 — `backup-v1` has no read path; permanent backup failure blocks every write

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 2, Migration Notes, Phase 10
- **Detail**: the copy protects against a migration bug found after the write, but a parent can only reach it with
  devtools/support; a device where the copy always fails loses each session's post-update progress (v1 survives).
  Decision 6 names this "would change" but no follow-up carried it.
- **Fix**: `## Known risks` entry + two follow-ups with triggers in phase 10's list.
- **Decision**: FIXED (recorded)

### F6 — Precedence of warm-up / `?e2eSkills` / unlock card vs a variant unspecified

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Critical Implementation Details (scene order)
- **Fix**: variant replaces only the adaptive round; warm-up and `e2eSkills` win; the unlock card's "Dalej" starts whatever `freshRound` returns.
- **Decision**: FIXED

### F7 — `migration-failed` is forceable like `corrupt`

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 2 § 1, decision 6
- **Detail**: a forced import/reset can overwrite a v1 save that a fixed build could migrate; the card offers export first
  (FR-021 satisfied). Unreachable today (`MIGRATIONS[1]` cannot throw). Not clearly wrong → kept.
- **Fix**: `## Known risks` entry; `[human]` 10.6 names it.
- **Decision**: ACCEPTED (recorded)

### F8 — Dist check greps a file name that is never in the bundle

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 (3.3)
- **Detail**: an imported JSON is inlined without its file name; `grep "save-v1"` would pass even if the fixture leaked.
- **Fix**: grep a value unique to the fixture (`1760000001000`).
- **Decision**: FIXED

### F9 — Phase 11(a) "same room" contradicts the fixture

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 11
- **Detail**: `save-v1.json` names room `living` (unknown); `repairCurrentRoom` moves `currentRoom` to the salon.
- **Fix**: assert stars, stage and mastery; say why the current room is not compared.
- **Decision**: FIXED

### F10 — Unlisted decisions in `[human]` 10.6; phase 7 is the heaviest

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 10 (10.6), Phase 7
- **Detail**: ×2 for the second try (decision 11) and `migration-failed` forceability were not on the author's checklist.
  Phase 7 (scene branch, seams, one widget, four spec edits) is large but has one new UI component and a Known-risks
  continuation note; not split (splitting would renumber 11–13 for little gain). Also recorded: phases 1 and 2 must ship
  together (Known risks).
- **Fix**: 10.6 extended (text and Progress row).
- **Decision**: FIXED

VERDICT: PROCEED — the approach is sound and save-safe (migration on read, validated before use, writes blocked on any unreadable load, SIR-01 keyed on reason); one CRITICAL (phase 3 spec edits) and the warnings are fixed in plan.md or recorded as Known risks.
