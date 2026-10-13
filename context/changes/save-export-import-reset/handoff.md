# Handoff — `save-export-import-reset` (slice S-12)

Written by the `/10x-research` step of run `2026-10-13-s12-s14`. `research.md` answers the six questions of change.md
decision 8; no product code changed. The next agent must not get wrong: import/reset go through a NEW saver-owned
`replace` (stop snapshot writes → await in-flight → write → reload), never `block()` (one-way, would leave the game
unsaved after a failed import) and never a bare `store.write` (the reload's own `pagehide` flush would overwrite it);
and the export stays `.txt`/`text/plain` because Chrome's share allow-list rejects `.json`.

## 1. State

| | |
|---|---|
| Branch | `feat/save-export-import-reset`, cut from `main` at `f3088d4` |
| Commits | 2 on the branch: `docs(save-export-import-reset): change identity (autonomous run)` (`ca0c645`) and `docs(save-export-import-reset): research` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three files below staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-export-import-reset/research.md` | Research: apply path (options A/B/C, C recommended: `Autosaver.replace` + reload), import pipeline (`parseImport` in core, size limit, envelope unwrap, `decodeSave`), export envelope (`app/kind/build/exportedAt/reason/save|raw`), tablet file I/O table with primary sources, panel placement + input session (F2/F5/F6), audit items M-S3/L-S2/N-8/M-S2 with symbols, e2e approach |
| `context/changes/save-export-import-reset/change.md` | Frontmatter only: `status: new → preparing`, `updated` |
| `context/changes/save-export-import-reset/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-export-import-reset` (observed) |
| `ls context/foundation/lessons.md` | absent (no lessons to apply) |
| `metadata-guard.mjs inspect` / `mark-researched` | change.md sha matched; `changed: true` |
| `grep -n setInputFiles\|filechooser tests/e2e` | no hits (upload pattern is new) |
| Headless Chromium probe (web worker, scratchpad only, outside the sandbox) | `navigator.share`/`canShare` undefined → download branch (consistent with `tests/e2e/save-restart.spec.ts`) |
| lint / typecheck / unit / build / e2e | not run: docs-only step. Baseline on main (contract, inherited, unverified): `lint OK; typecheck OK; unit OK Tests 1176 passed; build OK; e2e OK 33 passed` |

No deliberate break: nothing testable was written.

## 4. Next command

`/10x-plan save-export-import-reset`

## 5. Open

- Plan decisions research leaves open (research.md § Open Questions): Polish copy of the new buttons and dialogs (DESIGN-GAP rows from 46 in `docs/design-gaps.md`); whether `saveProblem` (follow-up F3) returns a full path or only the first failing top-level key; import from the welcome screen's "Rodzic" path (not required by FR-022/US-03).
- Core shape to plan: `src/core/autosave.ts` `createAutosaver` gains `replace(state)` with a flag separate from `blockedBy` (allowed under `unreadable`/`unavailable`, refused under `fatal`); `freshSession` moves out of `src/main.ts` into core (takes `FIRST_ROOM` as a parameter); `src/core/saveHealth.ts` `saveHealthView` gains `notYet`, earlier failures and `persistence`; `src/storage/idb.ts` `requestPersistence` returns its result.
- E2E: import/reset specs must use the real IndexedDB store (the `?e2eSave=` in-memory stores of `src/testing/e2eHook.ts` `e2eSaveStore` do not survive the reload); the new spec file must be added to `ROUND_SPEC` in `playwright.config.ts`; subagents use the request-file protocol. The unreadable-recovery import is unit-only beyond the write (the seam is unreadable again after reload).
- Manual device rows (no local proof possible): iPad home-screen share sheet "Zapisz w Plikach" and Files picker for import; Android installed PWA share/download and picker; `persist()` answer on each.
- Carried risk: a second tab of the same origin overwrites an imported/reset save at its next write (follow-up of `2026-10-13-autosave-versioned-save`, unchanged).
- Follow-ups to carry (unchanged from change.md): L-S1 (`src/core/save.ts` `decodeSave` `catch`, Trigger: first migration step v2), F7 (`src/data/pl.ts` `settings.empty`, Trigger: parent's feedback or S-17), N-7 (`src/core/autosave.ts` `loadSave`, Trigger: iPad measurement).

## 6. Autonomous decisions

- **Question/scope taken from change.md decision 8 and the step prompt**, no interview (contract rule 1). Would change: none.
- **Recommended apply path C (saver-owned replace + reload)**; rejected A (hot-swap the registry: five scenes hold own state, no restart choreography) and B (direct `store.write`: store not reachable from scenes, and the reload's `pagehide` flush or a pending debounce writes the old snapshot over it). Would change: evidence that a reload in the iPad home-screen app loses something a child notices (beyond one tap to re-unlock speech).
- **Export stays `.txt` + `text/plain`, JSON content in an envelope**; rejected `.json`/`application/json` because chromium `share_service_impl.cc` excludes it (verified, H). Would change: Chrome adding JSON to the allow-list, or a device test showing the iPad share sheet hides `.txt` from "Zapisz w Plikach".
- **Reset writes an encoded fresh v1 save** instead of adding `delete` to `SaveStore`. Would change: a need to tell a reset from a first launch in the status (`load: 'loaded'` vs `'fresh'`).
- **One delegated worker (web research) instead of 2–4**: the code questions sit in ~15 small files read directly in the main context; only the device/browser behaviour needed an independent search. Would change: a larger codebase area.
