# Handoff — `save-export-import-reset` (slice S-12)

Written by the `/10x-plan` step of run `2026-10-13-s12-s14`. `plan.md` has 7 phases (3 tdd core, 3 impl UI with one new
DOM dialog each, 1 e2e after the seam sweep); no product code changed. The next agent must not get wrong: import and reset
apply through a NEW `Autosaver.replace` (own flag, awaits the in-flight write, keeps writes off after success so the
reload's `pagehide` flush cannot overwrite) — never `block()`; and phase 4 changes the flow of the existing e2e test
"#2 FR-021 …" in `tests/e2e/save-restart.spec.ts` (export confirm step), so that phase updates it.

## 1. State

| | |
|---|---|
| Branch | `feat/save-export-import-reset`, cut from `main` at `f3088d4` |
| Commits | 3 on the branch: `ca0c645` change identity, `23d8dcc` research, and `docs(save-export-import-reset): plan` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (`metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 42 (`grep -c '^- \[ \]' plan.md`) |
| Roadmap | S-12 `proposed → planning` (At a glance row + body `Status`), committed with the plan |
| Working tree | clean after the commit (five files staged by path) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-export-import-reset/plan.md` | Plan: 7 phases with `Driver:`/`Driver why:` lines, Critical Implementation Details (contracts of `replace`, the file envelope/`parseImport`/`saveSummary`, save health, dialog flow), `## Autonomous decisions` (12), `## Progress` (42 rows) |
| `context/changes/save-export-import-reset/plan-brief.md` | Two-page brief |
| `context/changes/save-export-import-reset/change.md` | Frontmatter `status: planned` |
| `context/foundation/roadmap.md` | S-12 status → `planning` |
| `context/changes/save-export-import-reset/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-export-import-reset` (observed) |
| `ls context/foundation/lessons.md` | absent — no lesson applies |
| `metadata-guard.mjs inspect` → `mark-planned --expected-sha256 b854b18…` | `{"changed":true}` |
| `grep -c '^Driver: ' plan.md` | 7 (one per phase body: tdd, tdd, tdd, impl, impl, impl, e2e) |
| Success Criteria ↔ Progress | one-to-one per phase (P1 4+1, P2 3+1, P3 3+1, P4 4+3, P5 3+3, P6 4+6, P7 6) |
| Code facts the plan relies on | read in this step: `src/core/autosave.ts` (`block` one-way, no `replace`), `src/main.ts` `start`/`freshSession`/`pagehide`, `src/storage/idb.ts` `requestPersistence(): void`, `src/core/saveHealth.ts`, `src/ui/dom/{saveExport,saveFailedCard,settingsPanel,saveHealthView,dialog}.ts`, `src/scenes/UIScene.ts` `openSettings`, `src/scenes/WelcomeScene.ts` `openParent` (already guards `this.session`), `tests/dialogSessions.test.ts` (`DIALOG_CALLBACKS`, counts 4/4), `tests/e2e/save-restart.spec.ts` FR-021 test |
| lint / typecheck / unit / build / e2e | not run: docs-only step. Baseline on main (contract, inherited, unverified): `lint OK; typecheck OK; unit OK Tests 1176 passed; build OK; e2e OK 33 passed` |

No deliberate break: nothing testable was written.

## 4. Next command

`/10x-plan-review save-export-import-reset`

## 5. Open

- Human checklist (Progress `[human]` rows): 4.7 iPad home-screen share sheet → Files and Android PWA share/download;
  5.6 file picker import on both tablets; 6.8 decision against FR-022's literal "plik JSON" (export is `.txt` with JSON
  content); 6.9 acceptance of the new copy (`pl.saveTransfer`, `pl.saveFailed.detail`, `pl.settings.saveNotYet`/
  `saveEarlier`/`savePersist`); 6.10 `persist()` answer on both tablets.
- DESIGN-GAP rows to add in `docs/design-gaps.md`: 46 (save actions in the panel), 47 (export confirm + outcome line),
  48 (import summary + rejected file), 49 (reset confirm), 50 (revision of 43: `notYet`, earlier failures, persistence),
  51 (revision of 42: code + build line on the card); row 44 rewritten in phase 4.
- E2E: phases 4–7 need the orchestrator's Chromium (request-file protocol: `e2e-request-p<N>.md` + `git apply` break
  patches in the change dir). Phase 7 adds `save-transfer` to `ROUND_SPEC` in `playwright.config.ts`; the gate command
  stays `npx playwright test`. Import/reset specs use the real IndexedDB store (no `?e2eSave=`).
- Carried risks: a second tab of one origin overwrites an imported/reset save; the reload may start a waiting newer
  build (same as any launch).
- Follow-ups to write in phase 6 (`follow-ups/review-fixes.md`): L-S1 (`src/core/save.ts` `decodeSave`), N-7
  (`src/core/autosave.ts` `loadSave`), F7 (`src/data/pl.ts` `settings.empty`), two tabs, full field path in `saveProblem`,
  import from the welcome screen — each with `Trigger:`.

## 6. Autonomous decisions

- **No interview** (contract rule 1): complexity HIGH, decisions taken from research recommendations, change.md
  decisions 1–8 and the step prompt; all 12 recorded in `plan.md` § Autonomous decisions. Would change: none.
- **Apply path = `Autosaver.replace` + reload** (research option C, recommended). Rejected: registry hot-swap, bare
  `store.write`, `block()`. Would change: evidence a reload in the iPad home-screen app loses something the child notices.
- **Export `.txt`/`text/plain` with a JSON envelope, against FR-022's literal "plik JSON"** → `[human]` 6.8. Rejected:
  `.json` (Chromium share allow-list rejects it). Would change: Chrome allowing JSON, or an iPad test hiding `.txt`.
- **Actions sit in the settings panel; each step replaces the panel in the same input session; "Anuluj" returns to the
  game** (unconfirmed panel choices are dropped). Rejected: back-to-panel navigation, a second `suspend()` (would trigger
  F5). Would change: a parent reporting a lost stage choice.
- **Import only from the panel** (not the welcome screen). Would change: a parent unable to reach the panel after an
  unreadable save (follow-up trigger).
- **Seven phases, one new DOM component per UI phase**, the e2e phase after the seam sweep (step prompt: ≤ ~2 components
  per phase). Rejected: one UI phase for all three dialogs (cost precedent 320k tokens). Would change: plan-review finding
  phase 3's DOM edits too large for a tdd phase — then move them to phase 6.
- **The FR-021 e2e test is updated inside phase 4** (impl), not in phase 7, because L-S2 changes its flow and the gate
  would be red otherwise. Would change: none.
- **Roadmap edit committed with the plan** (contract clean tree beats the skill's "leave it uncommitted").
