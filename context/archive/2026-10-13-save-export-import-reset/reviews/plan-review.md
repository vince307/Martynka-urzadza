<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Eksport, import i reset zapisu w panelu rodzica oraz domknięcie ustaleń audytu zapisu

- **Plan**: context/changes/save-export-import-reset/plan.md
- **Mode**: Deep (code verification done inline in this step, no sub-agent: the risky claims sit in six files)
- **Date**: 2026-10-13
- **Verdict**: SOUND (after the in-place fixes below; before them REVISE)
- **Findings**: 0 critical, 5 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F2, F3, F4, F5 — fixed in plan or moved to Known risks) |
| Plan Completeness | WARNING (F1 — fixed in plan) |

## Grounding

Grounding: 15/15 paths ✓ (`src/core/{autosave,save,saveHealth}.ts`, `src/storage/idb.ts`, `src/ui/dom/{saveExport,saveFailedCard,settingsPanel,saveHealthView,dialog}.ts`, `tests/{autosave,save,saveHealth,idbStore,plural}.test.ts`, `docs/design-gaps.md`), 9/9 symbols ✓ (`createAutosaver` `block` one-way and no `replace`; `freshSession` local in `src/main.ts`; `requestPersistence` drops the `persist()` result; `UIScene.openSettings` `openInputSession` + `saveHealthView(saver.status())`; `InputSession.run<T>` sync only; `DIALOG_CALLBACKS = {onPass,onConfirm,onCancel}` counts 4/4; e2e hook `save()` spreads `saver.status()` so new status fields reach the snapshot without hook code; `?e2eSave=unreadable` value `{version: 99, stars: 7}` → `future`; `countNoun` + `gwiazdka`), brief↔plan ✓ (brief updated: 5 e2e breaks), Progress↔Phase ✓ (7 phases, Success Criteria ↔ rows one-to-one, 43 rows), Drivers ✓ (1–3 `tdd`: `replace`/`current`/`saveFile.ts`/`notYet`/`persistence` absent in code; 4–6 `impl`: DOM dialogs; 7 `e2e` after the phase-6 seam sweep, contract `E2E=on`).

Triggered follow-ups (`Trigger: S-12` and conditional ones, change.md table) checked against the plan: export/import/reset + `validateSave` (in), privacy note S-08 F6 (in, phases 4–5), M-S2/M-S3/L-S2 (in), F3 field path (in as `saveProblem`), L-S1 and F7 (deferred with new triggers in phase 6 — convincing: `MIGRATIONS` empty, F7 is the progress preview), F5 (not fired: steps reuse the panel's input session, no second `suspend()`), F6 `WelcomeScene.openParent` (in, seam sweep), F2 `DIALOG_CALLBACKS` (in; extended by F1), L-S3 `visibilitychange` (not fired: the plan does not touch that handler). Product decisions against PRD: `.txt` vs FR-022 "plik JSON" has `[human]` 6.8; copy acceptance 6.9; device behaviour 4.7/5.6/6.10. "Anuluj in a step returns to the game" and "import only from the panel" are consistent with FR-022/US-03 and carry reversal conditions in plan § Autonomous decisions.

Step-prompt focus points: replace-then-reload race (contract correct: separate flag, awaits `inflight`, writes off after success so the reload's `pagehide`/`visibilitychange` flush is skipped; hardened by F4); failed import never touches the save (all rejections before `apply`, `file.size` pre-check, failed `store.write` leaves the old IndexedDB value — confirmed by contract and e2e (a)); e2e on real IndexedDB across reload (no `?e2eSave=`; `window.location.reload()` keeps the context's IndexedDB; a new context = fresh device; F2 fixes the fixture choice); e2e breaks break the RULE (p7a validation, p7b glue to `replace`, p7d reload, p4 L-S2 confirm — all rules; p7c is a rule but likely invisible in the browser, F3; the "summary before overwrite" rule had no break, F5 adds p7e).

## Findings

### F1 — `onClose` of the step dialogs is outside the session test

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Critical Implementation Details — Przepływ dialogów; Phase 4 § 5
- **Detail**: The new step dialogs take `onClose`, which `UIScene` wires to `closeSettings`, but the plan grows `DIALOG_CALLBACKS` (`tests/dialogSessions.test.ts`) only by `onExport/onImport/onReset`. A bare `onClose: () => this.closeSettings()` would leave the C-2 test green, the exact regression it exists to catch.
- **Fix**: add `onClose` to `DIALOG_CALLBACKS` in phase 4 (counts updated; `WelcomeScene.ts` unchanged) and break it in 4.3.
- **Decision**: FIXED (plan: Przepływ dialogów, Phase 4 § 5 and its deliberate break)

### F2 — e2e (b) imports a format fixture the game cannot play

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 7 § 2 (b)
- **Detail**: `tests/fixtures/save-v1.json` has room `living` (`FIRST_ROOM` is `salon`), skill ids `E3.add.100`/`E3.mult.table` absent from `src/data/curriculum/`, and a `pendingUnlock`. After the reload `repairCurrentRoom` rewrites the room, the summary shows no room line, and the round/unlock flow may not reach `task` — the spec would fail or assert something other than "the state from the file".
- **Fix**: build the bare v1 value in the spec as a playable state (salon, stars 7, a stage different from the welcome one, empty mastery/streak/history, no `pendingUnlock`) and assert the room line "Salon: 0 z 10". Strength: exercises the real reload path with a state the game accepts unchanged. Tradeoff: the spec owns a small literal instead of a shared fixture. Confidence: HIGH — fields read from the fixture and `src/data/rooms.ts`. Blind spot: none significant.
- **Decision**: FIXED (plan Phase 7 § 2 (b))

### F3 — the `pagehide`-after-`replace` break is probably invisible in the browser

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 7, break p7c (Progress 7.4)
- **Detail**: `save` returns at once when `!dirty`. At the moment of an import or reset the state was written at the round end (`flush('now')`), so with p7c applied the reload's `flush('hidden')` writes nothing and (b)/(d) stay green. The plan already allows a handoff note; the rule's real proof is the phase-1 unit test.
- **Fix**: recorded under `## Known risks` so nobody counts 7.4 as browser proof.
- **Decision**: FIXED (Known risks)

### F4 — `replace` under concurrency is underspecified

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details — Kontrakt `replace`; Phase 1 § 3
- **Detail**: (1) a second `replace` while one runs, or after success, is undefined (the UI disables buttons, but the core contract should refuse); (2) on failure, changes skipped during `replace` wait for the next `markDirty` because the debounce timer was cancelled; (3) the `save` loop condition checks only `blockedBy`, so the flag would be checked in three different ways; (4) success did not reset `consecutiveFailures`.
- **Fix**: `replacing || replaced` → `{ ok: false, error: 'Busy' }`; success sets `consecutiveFailures = 0`; failure re-arms the debounce when `dirty`; one `writesOff()` predicate in `save`, `markDirty` and the loop; tests added in phase 1.
- **Decision**: FIXED (plan contract + Phase 1 tests)

### F5 — no break proves "summary before overwrite"; file choice bypasses the tap

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 7 § 2 and Success Criteria
- **Detail**: FR-022's core rule (the parent sees the summary and taps "Wczytaj" before anything is overwritten) is only a `[reviewer]` row (5.4); no e2e break targets it. And `setInputFiles` on the hidden input would skip the real `input.click()` inside the tap, the path that matters on iPad.
- **Fix**: new break `e2e-break-p7e.patch` (apply right after `parseImport` `ok`) → (b) red on the summary; Progress 7.6 added (old 7.6 → 7.7); files chosen through `page.waitForEvent('filechooser')` after tapping "Wybierz plik"; the input's `value` is reset after each `change`.
- **Decision**: FIXED (plan Phase 7, Progress 7.6/7.7, brief)

### F6 — `UIScene` would call `Date`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 4 § 2, § 4
- **Detail**: `src/main.ts` states "scenes never call Date"; the plan had `UIScene` build `exportedAt` and the dated file name.
- **Fix**: `openSaveExportDialog({ file: (now) => { text, fileName }, now = () => new Date() })`; the scene passes a function.
- **Decision**: FIXED

### F7 — rows 6.8/6.9 carry the product decisions; nothing to overturn

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 6 Manual, Autonomous decisions 2, 4, 5
- **Detail**: `.txt` against FR-022's literal "plik JSON" is a justified deviation (Android share allow-list) and is a `[human]` row; panel-only import and "Anuluj returns to the game" fit FR-022/US-03. Not overturned.
- **Fix**: none.
- **Decision**: DISMISSED (recorded only)

### F8 — a reload that does not happen leaves writes off for the session

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details — Kontrakt `replace`
- **Detail**: After a successful `replace`, writes stay off until the reload; if `reload()` did not run, the session's progress would be lost silently (the next start loads the file's state). The reload is synchronous after success, so the window is tiny.
- **Fix**: recorded under `## Known risks`.
- **Decision**: ACCEPTED

## Triage summary

Fixed: F1, F2, F3 (Known risks), F4, F5, F6 (6) · Accepted: F8 (1) · Dismissed: F7 (1) · Verdict after fixes: REVISE → SOUND.

VERDICT: PROCEED — the replace-then-reload approach is sound and verified against the code; five warnings were narrow and are fixed in plan.md (session test covers `onClose`, playable e2e import file, `Busy`/re-arm/one predicate in `replace`, a break for "summary before overwrite", the invisible p7c break recorded as a known risk).
