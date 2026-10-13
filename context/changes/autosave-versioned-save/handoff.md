# Handoff — `autosave-versioned-save` (slice S-11)

Written by `/10x-implement autosave-versioned-save phase 6` of run 2026-10-13-s09-s11. Phase 6 (seam sweep, DESIGN-GAP 42-44, follow-ups, CLAUDE.md) is committed at ae919d0. Do not edit `tests/fixtures/save-v1*.json` (frozen).

## 1. State

| | |
|---|---|
| Branch | `feat/autosave-versioned-save`, cut from `main` at `f67b9f4` |
| Commits | docs x4, `7cf32a4` p1, `76f6df1` p2, `43af7ea` p3, `29da899` p4, `00998c0` p5, `ae919d0` p6, plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; 1.x-6.4 done (4.6 human open; manual rows 5.5-5.8, 6.5-6.9 open) |
| Roadmap | S-11 `planning` (unchanged) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/saveFailedCard.ts`, `saveExport.ts` | card (`mountSaveFailedCard`, z-index 10 so the adult gate (15) opens over it, no input switch: no canvas yet) and `exportRawSave` (`canShare({files})` -> share, AbortError silent, else `<a download>`) |
| `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs`, `tests/e2eSave.test.ts` | `e2eSave(search)`, `e2eSaveStore()` (in memory, version 99, never IndexedDB), marker `e2eSave` |
| `src/main.ts` | `start()` async: `createIdbSaveStore` -> `loadSave` -> session (`floorToCalendar` on a loaded learner; `?e2eStars` only on `fresh`) -> `createGame(session)` -> `createAutosaver` (blocked on `unreadable`/`unavailable`) -> `setdata` + `changedata` listeners filtered by `SAVE_KEYS`; `visibilitychange` hidden and `pagehide` call `flush('hidden')`; error boundary calls `saver.block('fatal')` |
| `src/data/layout.ts` | `REGISTRY_KEYS.saver`, `SAVE_KEYS` (five keys) |
| `src/scenes/{RoomScene,TaskScene,BootScene}.ts` | `flush('now')` after the `bought` registry writes and at the very end of `finishRound` (after `finishWarmup`); BootScene hands over in `time.delayedCall(0)` |
| `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` | read-only `save` status in the snapshot (welcome and later screens) |
| `tests/saveKeys.test.ts` | SAVE_KEYS lists exactly the five keys |
| `context/runs/2026-10-13-s09-s11/e2e-break-s11-p4.patch` | deliberate e2e break (gitignored dir): `createGame` always gets `freshSession(0)`; expect phase 7 test 1 red on `screen !== 'welcome'` after reload; `git apply --check` passes on 29da899 |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint`, `typecheck` | OK |
| `npm test` | 1139 passed (baseline 1079, +60 over main incl. phases 1-3, +1 this phase) |
| deploy tests, `sample` E1..E6, `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `dist/sw.js` precaches both js chunks |
| `grep idb-keyval src/` | only `src/storage/idb.ts` |
| `npx playwright test` | (e2e: orchestrator gate after fix round, 6e1cf7b) orchestrator run on 36d40c9 was 25 passed, 1 failed (`parent-settings.spec.ts:158`, second part resumed the saved game: `task` instead of `welcome`; cause: `context.newPage()` shares IndexedDB; fix: `browser.newContext()` for the second part, closed at the end; no other spec opens a second page in one context; round 2 here: Chromium not runnable (MachPort)). Earlier note: not runnable in this session (MachPort denied, ran plain once: 10 failed at browser launch, 16 not run) -- orchestrator gate for 29da899; it must stay 26 green |
| Unit break | drop `REGISTRY_KEYS.settings` from `SAVE_KEYS` -> `tests/saveKeys.test.ts` red (`expected [ 'currentRoom', 'learner', ...(2) ] to deeply equal [ ...(3) ]`); restored |
| E2E break (deferred) | `e2e-break-s11-p4.patch`, proof in phase 7 row 7.3. Meta-check: without a reload spec nothing in the suite sees the seam load -> registry -> save; the break is meaningless before phase 7 |

Phase 5 verification: lint, typecheck OK; npm test 1142 passed (baseline 1079, +63; +3 this phase); deploy tests and sample E1..E6 OK;
`npm run build` `e2e hook: absent`, `E2E_HOOK=1` build `present`. Break: `e2eSave(...)` in `main.ts` without `__E2E_HOOK__` -> build red
(`e2e hook leaked ... (e2eSave in _app/index-*.js)`); restored, proves the guard on the real bundle. `npx playwright test`: not
runnable in this session (MachPort) -- orchestrator gate; must stay 26 passed. No e2e spec added (phase 7).

Phase 6 verification: `validate-rule-files.sh` PASS (189 paths); break (`CLAUDE.md` -> `src/core/saves.ts`) -> `MISSING: src/core/saves.ts`, FAIL; restored, PASS.
lint, typecheck OK; npm test 1142 passed (baseline 1142, +0); build `e2e hook: absent`; `npx playwright test` ran here: 26 passed.
`grep S-11 src/` has no "will/until/replaces" announcements.

## 4. Next command

`/10x-e2e autosave-versioned-save phase 7`

## 5. Open

- Manual rows (human checklist): 4.6 [human] iPad/Android restart, kill, silent update keep state; 5.5 [reviewer] teacher
  read `pl.saveFailed`; 5.6 [visual] card, gate over card, welcome after „Graj dalej” at 1440×900 and 1024×768; 5.7 [human]
  export on iPad home-screen app and Android; 5.8 [human] `?e2eSave` seam; 6.5 [reviewer] seam sweep; 6.6 [human] v1
  deviates from plan §5; 6.7 [human] card gating (against research recommendation); 6.8 [human] two-build e2e (#10)
  deferred to v2; 6.9 [human] `pl.errorCard.body` unchanged, fatal error blocks autosave.
- DESIGN-GAPs planned: rows 42 (failed-load card), 43 (save invisible to the child), 44 (export as `.txt`, share first).
- E2E protocol: phase 4 writes `context/runs/2026-10-13-s09-s11/e2e-break-s11-p4.patch`; phase 7 writes
  `e2e-request-s11-p7.md` + `e2e-break-s11-p7a/c/d.patch`.
- - Carried follow-ups (unchanged triggers): observability F3 (`installErrorBoundary` `signalOfRejection`), F4
  (`WelcomeScene.openParent`), parent-settings F7 (`pl.settings.empty`).
- New Known risks from the review (plan.md `## Known risks`): v1 validation never tightens without a migration (F4);
  two same-origin instances, last writer wins (F5, follow-up in phase 6 with the v2 trigger).


## 6. Autonomous decisions

- Phase 5: card z-index 10 (not 18 like the error card) so the parent gate dialog (15) shows over it; "Zachowaj kopię" is class `overlay-secondary`.
- Phase 5: export file via `canShare({ files })`; the plan's `text/plain` .txt kept; `URL.revokeObjectURL` on a 0 ms timeout after the click.
- Phase 5: strings in `pl.saveFailed` as planned (teacher read by the author: short, no numerals, parent understands the save is untouched); rows 5.5-5.8 stay open for reviewer/visual/human. DESIGN-GAP rows 42-44 are written in phase 6.
- Phase 5: first-RED not observed separately for `e2eSave.test.ts` (impl phase); break proven on the real bundle.

- Phase 3: npm install ran sandboxed with `allowed_domains: ["registry.npmjs.org"]` and worked; exact versions, no `^`.
- Phase 3: `idb-keyval` restriction lives in a separate block for scenes/pwa/ui/testing/main plus entries in the core and data
  blocks (flat config replaces a rule per block). Reversal: none needed.
- Phase 3: `requestPersistence` reads `navigator.storage` (global, allowed in `src/storage`); no `indexedDB` use outside idb-keyval.
- Phase 4: Chromium could not launch (MachPort); e2e is the orchestrator gate. Rows 4.3/4.5 cite it; 3.4 now cites the orchestrator run on bffbb30.
- Phase 4: rotate overlay, speech unlock, contextmenu and service worker stay synchronous at module level; only the hook and the install hint (need the game) are inside `start()`.
- Phase 4: `registry.get(saver)` typed `Pick<Autosaver,'flush'>` in scenes; no scene knows the store.
- Phase 4: no change to `error-boundary.spec.ts` (step 5 only if red; orchestrator run decides).
- Phase 2's row 2.3 now cites the orchestrator e2e run on 75eaa08 (26 passed).
- E2E: not run (MachPort); orchestrator gate for 43af7ea, no game wiring changed.
- Phase 4 round 2: spec `parent-settings.spec.ts` #14 second part now uses a fresh browser context (`6e1cf7b`); product behaviour (resume) was correct. `error-boundary.spec.ts` untouched (green in orchestrator run).

- Phase 6: `SAVE_KEYS` stays in `src/data/layout.ts` (subset of `REGISTRY_KEYS`, `core` cannot import it, `main.ts` already imports layout); recorded in follow-ups. `LearnerState` is not dead (`SavedLearner`/`Adaptation` pick from it), no change.
- Phase 6: profile (`autonomous-run.md` sec. 10, `idb.ts` no longer planned) and `docs/human-checklist.md` S-11 wording left to the orchestrator; listed in follow-ups. For the profile: from S-11 a "fresh device" in e2e is a new browser context.
- Phase 6: DESIGN-GAP comments for rows 43 and 44 added in `main.ts` and `saveExport.ts`; the roadmap and test-plan texts untouched (follow-up `/10x-test-plan refresh`).
