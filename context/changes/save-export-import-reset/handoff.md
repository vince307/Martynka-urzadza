# Handoff — `save-export-import-reset` (slice S-12)

Written by the `/10x-new` step of run `2026-10-13-s12-s14`. The change folder exists with `change.md` (identity,
roadmap-vs-repo table, scope incl. audit M-S3/L-S2/N-8/M-S2, triggered follow-ups, decisions); no code changed.
The next agent must not get wrong: the save format stays v1 (no migration) and a running game has no "replace the
session" path today — import/reset need one (change.md decision 5), research must settle it.

## 1. State

| | |
|---|---|
| Branch | `feat/save-export-import-reset`, cut from `main` at `f3088d4` |
| Commits | 1 on the branch: `docs(save-export-import-reset): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-export-import-reset/change.md` | Change identity: sources, roadmap claim / repo now / correction table, design source and copy keys (DESIGN-GAP rows from 46), migration verdict (none), scope (roadmap outcome + audit M-S3, L-S2, N-8, M-S2 with file + SYMBOL; N-7 out), triggered follow-ups with a take on each, 8 autonomous decisions |
| `context/changes/save-export-import-reset/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-export-import-reset` (observed) |
| `ls context/changes context/archive` | no existing `save-export-import-reset` folder (uniqueness check passed); `context/changes/` exists |
| `ls context/foundation/lessons.md` | absent (no lessons to apply) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code touched. Baseline on main (contract, inherited, unverified): `lint OK; typecheck OK; unit OK Tests 1176 passed; build OK; e2e OK 33 passed` |

No deliberate break: nothing testable was written.

## 4. Next command

`/10x-research save-export-import-reset`

## 5. Open

- Research questions (change.md decision 8): how import/reset apply to a running game (`src/main.ts` `start` loads once; `createAutosaver` `snapshot` would overwrite a direct `SaveStore.write` — candidate: block saver, write, `location.reload()`); where export/import/reset sit in `src/ui/dom/settingsPanel.ts` `openSettingsPanel` and whether they stay inside the `openInputSession` of `src/scenes/UIScene.ts` `openSettings` (decides follow-ups F5 and F2 `tests/dialogSessions.test.ts` `DIALOG_CALLBACKS`); file envelope (build, reason) vs bare v1 value for `src/ui/dom/saveExport.ts` `exportRawSave` / `src/core/save.ts` `rawExportText`; `<input type=file>` + share sheet behaviour on iPad home-screen app; where the `persist()` result lives (`src/storage/idb.ts` `requestPersistence` → `src/core/autosave.ts` `AutosaveStatus`).
- Import while the saver is blocked by `unreadable`/`unavailable` is the recovery path (decision 5) — the plan must prove the current save is untouched on every failure (test-plan risk #7).
- DESIGN-GAPs to add in `docs/design-gaps.md` (rows 46+): export/import/reset actions, export confirmation (L-S2), import summary + rejected-file message, reset confirmation, "not saved yet" / earlier failures / persistence lines in "Zapis gry", reason + build on the unreadable card (revises 42/44).
- Follow-ups to carry with new triggers (written by plan/ship into this change's `follow-ups/review-fixes.md`): L-S1 (`src/core/save.ts` `decodeSave` `catch` → `migration-failed`, Trigger: first migration step v2), F7 (`src/data/pl.ts` `settings.empty`, Trigger: parent's feedback on the preview or S-17), N-7 (`src/core/autosave.ts` `loadSave` timeout, Trigger: iPad cold-open measurement).
- Carried risk: two instances of one origin (import/reset in one tab does not warn the other) — follow-up of `2026-10-13-autosave-versioned-save`, unchanged.

## 6. Autonomous decisions

- **Next step `/10x-research` instead of the skill's default `/10x-plan`** — fixed by the step prompt; also justified: the apply-to-running-game mechanism is unknown. Would change: none (prompt-fixed).
- **No clipboard copy of the next command** (skill step) — skipped: unattended run, the orchestrator reads §4. Would change: an interactive session.
- **Title in Polish** (repo convention, profile § 1 language) while the skill derives one from the id. Would change: a maintainer rule for English titles.
- Scope, migration verdict, apply mechanism, summary shape, export confirmation, file type and E2E approach: decisions 1–8 in `change.md` § Autonomous decisions, each with the rejected option, the reason and what would change the answer.
