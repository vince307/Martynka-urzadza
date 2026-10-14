# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the `/10x-implement` phase 3 step (autonomous run 2026-10-14-save-s13b-s15-s14b). Save texts and the `?e2eSave=v1` seam are built and committed (`cd5b705`); phases 4-13 are untouched. The e2e run of phase 3 is NOT done (Chromium cannot start in this session): the orchestrator must run the full suite and watch the tests named in §3.

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 4 docs + phase 1 `b0ad4ba` + phase 2 `8ee3d18` + phase 3 `cd5b705` + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; phase 3: 3.1-3.3 ticked, 3.4 open (e2e), 3.5 [reviewer], 3.6 [visual] open; 2.4 ticked citing the orchestrator note |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/saveHealth.ts` | `cardCopyFor(kind, reason)` -> `future` / `migrationFailed` / `failed` / `unavailable`; `SaveHealthView.migratedFrom`; cause `migration-failed` |
| `src/data/pl.ts` | `saveFuture`, `saveMigrationFailed` cards (DESIGN-GAP 82 comment; gap row for `docs/design-gaps.md` still to add in phase 10), `saveFailed.fileName(date)` = `martynka-zapis-surowy-<date>.txt`, `saveTransfer.fileInfo`, `settings.saveMigrated`, `saveOff['migration-failed']` |
| `src/main.ts` | picks the card copy by `cardCopyFor`; raw copy dated; `RAW_FILE_NAME` removed from `src/ui/dom/saveExport.ts` |
| `src/ui/dom/saveImportDialog.ts`, `saveHealthView.ts` | file date + build line in the summary step; "Zapis przeniesiono z wersji N." |
| `src/testing/e2eHook.ts` | `E2ESaveSeam` + `'v1'` (store filled from the imported `tests/fixtures/save-v1.json`); `save.store` = `{ ops: ('backup'|'write')[]; writtenVersion }` on the hook snapshot `save` (null with IndexedDB); `tests/e2e/support/hook.ts` type updated |
| tests | `tests/saveHealth.test.ts` (cardCopyFor, migration lines), `tests/e2eSave.test.ts` (v1 seam), `tests/saveTransferCopy.test.ts` (names/info), e2e specs `save-restart.spec.ts`, `save-transfer-blocked.spec.ts` |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK |
| `npm test` + deploy scripts + `sample` E1-E6 | unit 2255 passed (baseline 2251, +4); sample no violations |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `grep -c 1760000001000 dist/_app/*.js` = 0 in every chunk |
| Break: `cardCopyFor('unreadable','future')` returns `failed` | `AssertionError: expected 'failed' to be 'future'` (1 red); restored. Meta: `main.ts` takes the card only through this function |
| `npx playwright test --config=...` | e2e: not runnable in this session — orchestrator gate (MachPortRendezvous Permission denied); expected 63 (+0) |

Tests the orchestrator must watch (changed strings): `save-restart.spec` "#2 FR-021 an unreadable save shows the parent card, exports the raw copy and is never written" (now `pl.saveFuture` card, filename regex `martynka-zapis-surowy-YYYY-MM-DD.txt`); `save-transfer-blocked.spec` "#2 SIR-01 a save from a newer version is never offered for overwrite" (`playOnWithBlockedSave(... pl.saveFuture)`). The `corrupt` and `unavailable` tests keep `pl.saveFailed` / `pl.saveUnavailable`. `?e2eSave=v1` is not used by a spec yet (phase 11).

## 4. Next command

`/10x-tdd minigame-daily-puzzle phase 4` (Phase 4: Harmonogram wariantów i dzień kalendarzowy; `Driver: tdd`)

## 5. Open

- 3.4 e2e (orchestrator), 3.5 [reviewer], 3.6 [visual]; earlier 1.5, 1.6, 2.5.
- Add a DESIGN-GAP 82 row to `docs/design-gaps.md` (future / migration-failed cards, file-info line) in phase 10.
- No teacher read needed (no generator or curriculum data touched; only save texts, for the 3.5 reviewer).

## 6. Autonomous decisions

1. **Raw copy name `martynka-zapis-surowy-<date>.txt`**: "surowy" keeps it apart from the current save's `martynka-zapis-<date>.txt`. Would change: parent-facing naming wish.
2. **Migrated line lives in `SaveHealthView.migratedFrom`** (view carries it; DOM only renders). `migration-failed` is its own cause with its own sentence.
3. **Seam log on the hook as `save.store`** merged into the existing `save` snapshot (plan contract), via a module-level log set by `e2eSaveStore`.
4. Exec mode: implemented in this context (no delegation); commit message taken as proposed.
