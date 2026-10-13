<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Eksport, import i reset zapisu w panelu rodzica oraz domknięcie ustaleń audytu zapisu

- **Plan**: context/changes/save-export-import-reset/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7
- **Date**: 2026-10-13
- **Verdict**: APPROVED (after fixes in b85f251)
- **Findings**: 0 critical, 3 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING (F1: change.md decision 5 dropped by the plan) |
| Scope Discipline | PASS |
| Safety & Quality | PASS (contract save-safety rules hold; F1 is a confirmed-action risk, follow-up) |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Verification (observed in this step, branch `feat/save-export-import-reset`)

| Gate | Result | Baseline + delta |
|---|---|---|
| `npm run lint`, `npm run typecheck` | OK | — |
| unit (`npm test` + deploy scripts + `sample` E1–E6) | 1247 passed, samples clean | 1176 + 71 |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` | — |
| `npx playwright test --config=…/playwright.config.ts` (plain command, Chromium launched) | 37 passed (before and after the fix commit) | 33 + 4 |
| Break p7e re-executed (`e2e-break-p7e.patch`: import applies right after `parseImport`) | RED: (b) on heading "Teraz", (c) on "7 gwiazdek"; (a), (d) green; restored | matches handoff §3 |
| Break p7c re-executed against unit (`e2e-break-p7c.patch`: `replaced = false`) | RED: `tests/autosave.test.ts` "turns every later write off after a success" and "a second replace … is Busy and writes once"; restored | p7c unit proof is adequate (the test drives `markDirty` + `flush('hidden')` after a successful replace, which is exactly the `pagehide` path the browser cannot provoke without a seam) |

Save safety: `tests/fixtures/` unchanged since `f3088d4`; `SAVE_VERSION = 1`; `encodeSave` untouched; `replace`/`persistence` live only in `AutosaveStatus` (runtime); a refused file only re-renders step 1 (`saveImportDialog.ts` `refuse`), cancel/close never calls `apply`; `apply` is reachable only from the "Wczytaj"/"Zacznij od nowa" handlers; a failed `replace` re-enables writes and re-arms the debounce. Export is a local `File` (share sheet or `a.download`), import a local `<input type=file>`; no network. Hooks: `.claude/settings.json` and `.claude/hooks/*` unmodified since 10–12 Oct (before the run); no bypass found.

## Findings

### F1 — Import or reset over an unreadable save shows "Teraz" as the fresh session and overwrites the stored save without saying so

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: `src/scenes/UIScene.ts` `openImport`, `openReset`; `src/ui/dom/saveImportDialog.ts` `openSaveImportDialog`; `src/ui/dom/saveResetDialog.ts` `openSaveResetDialog`
- **Detail**: With the saver blocked `unreadable`, `saver.current()` is this page load's fresh session, so "Teraz" reads "0 gwiazdek", and a confirmed import/reset replaces the unreadable stored value (allowed by plan decision 5). change.md decision 5 asked the summary to say the current save is unreadable and to point to "Zachowaj kopię" first; the plan dropped that sentence. The start card already offered the copy and "Zapis gry" says saving is off, and only a confirmed adult action reaches it, so no contract rule is broken; the risk is a `future` save after a deploy rollback.
- **Fix**: A line in both dialogs when `saver.status().blockedBy === 'unreadable'` (new `pl.saveTransfer` string + DESIGN-GAP row).
  - Strength: Restores change.md decision 5; small.
  - Tradeoff: New copy needs a teacher read and a screenshot; out of this review step's scope.
  - Confidence: MED — reachable only via the unreadable card path.
  - Blind spot: No e2e for import while `unreadable`.
- **Decision**: DEFERRED — follow-up "Import or reset over an unreadable save (impl-review F1)" in `follow-ups/review-fixes.md` with `Trigger:`.

### F2 — Teacher read: three new strings were ambiguous or off-register

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/data/pl.ts` `saveTransfer.exportOutcome.cancelled`, `saveTransfer.importPrivacy`, `saveTransfer.rejected['unknown-version']`
- **Detail**: "Anulowano. Nic nie zostało zapisane." can read as "the game did not save the progress"; "Wybierz plik zapisany z tej gry" is awkward ("zapisany z"); "Nie rozpoznaję wersji…" is the only first-person game line among impersonal parent copy.
- **Fix**: "Anulowano. Kopia nie powstała."; "Wybierz kopię zapisu z tej gry. Plik nie jest nigdzie wysyłany." (matches the "Kopia zapisu" title); "Nie można rozpoznać wersji tego zapisu. Obecne postępy zostały bez zmian."
- **Decision**: FIXED (b85f251)

### F3 — Seam: stale gap row and two wrong follow-up entries

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `docs/design-gaps.md` row 46; `follow-ups/review-fixes.md` "Two cards of one origin", "Full field path in saveProblem"
- **Detail**: Row 46 (phase 4) still described a single "Zapisz kopię" button after phases 5–6 added two more. The follow-up "Two cards of one origin" misread the plan's "druga karta tego samego originu" (a second browser TAB) as the unreadable card vs the export; "Full field path" pointed to `src/core/saveFile.ts` while `saveProblem` lives in `src/core/save.ts`. Later slices grep these.
- **Fix**: Row 46 lists all three buttons; follow-up retitled "Two browser tabs of one origin" with the real risk; file path corrected.
- **Decision**: FIXED (b85f251)

### F4 — `exportFileText` doc said "never throws"

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/core/saveFile.ts` `exportFileText`
- **Detail**: The `kind: 'save'` branch rethrows for an unserialisable save (unreachable: `encodeSave` builds plain data).
- **Fix**: Comment states the one throw.
- **Decision**: FIXED (b85f251)

### F5 — "Zacznij od nowa" means a harmless reload on the error card and a destructive reset in settings

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/data/pl.ts` `errorCard.restart`, `saveTransfer.resetButton`, `saveTransfer.resetConfirm`
- **Detail**: Same label, different consequences. The reset sits behind the adult gate, a summary and a second tap, so no accidental loss; recorded for the `[human]` copy acceptance (row 6.9).
- **Decision**: RECORDED

### F6 — Export date and size limit units

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/scenes/UIScene.ts` `openExport` (`now.toISOString().slice(0, 10)`); `src/core/saveFile.ts` `parseImport` (`fileText.length`)
- **Detail**: The file name date is UTC (an export just after midnight in Poland carries the previous day). `parseImport` compares UTF-16 length, not bytes; `File.size` (bytes) is checked first in the dialog, so the limit holds.
- **Decision**: RECORDED

### F7 — `replace` does not re-check `fatal` after awaiting the in-flight write

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/core/autosave.ts` `replace`
- **Detail**: A fatal error raised between the check and `store.write` still writes the (validated) replacement; the written state is the file's, not the uncertain runtime state, so the `fatal` rule (never save the state at an exception) is not violated.
- **Decision**: RECORDED

## [reviewer] rows

| Row | Result |
|---|---|
| 1.5 `replace` without `block()`; status runtime; `core` without globals | PASS — `replace` uses its own `replacing`/`replaced` flags and `writesOff()`; `replace`/`persistence` only in `AutosaveStatus`; ESLint boundary green |
| 2.4 `saveFile.ts` no globals, no `src/data/` import, build as a parameter | PASS — imports `./save`, `./types` only; `build` in `ExportInput` |
| 3.4 teacher read `saveNotYet`, `saveEarlier` (1/2/5), `savePersist.*` | PASS — "1 nieudana próba / 2 nieudane próby / 5 nieudanych prób", calm, error name only in brackets |
| 4.5 teacher read export copy, `saveFailed.detail`, privacy | PASS after F2 (`cancelled` reworded) |
| 5.4 `apply` only after step 2 + "Wczytaj"; refusal does not touch the saver; import copy | PASS — code read + break p7e re-executed RED; `importPrivacy`, `unknown-version` reworded (F2); star agreement tested 0/1/2/4/5/12/22/100 |
| 6.5 seam sweep, DESIGN-GAP 46–51, follow-ups with `Trigger:` | PASS after F3 (`rawExportText` gone, `freshSession` only in core, one summary helper, gap comments match rows 46–51) |
| 6.6 teacher read reset copy | PASS (see F5 for the shared label) |

MERGE: CLEAR — no open CRITICAL, all automated criteria met, every suite green after the fix commit (unit 1176 + 71, e2e 33 + 4); F1 deferred with a trigger.
