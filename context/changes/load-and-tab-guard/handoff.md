# Handoff — `load-and-tab-guard` (slice fix, non-roadmap)

The `/10x-plan-review` step of run `2026-10-15-fix-s16bcd` wrote this handoff. The plan was reviewed against Phaser 4.2.1 and idb-keyval 6.3.0 source: 1 CRITICAL, 3 WARNING and 2 OBSERVATION findings. All fixes are in `plan.md`, the verdict is PROCEED, and `change.md` is `plan_reviewed`. The next agent must not use the bare idb-keyval `update` in phase 5. Phase 5 uses `guardedPut` on the raw store, so a failing `get` still puts (F1). A cut must also expect break p7b to stay green (F2).

## 1. State

| | |
|---|---|
| Branch | `feat/load-and-tab-guard`, cut from `main` at `6f5644c` |
| Commits | 5 on the branch: change identity, research, plan, plan handoff fix, and `docs(load-and-tab-guard): plan review` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 31 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (explicit paths only) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/load-and-tab-guard/reviews/plan-review.md` | review report: findings F1–F6, the verified claims, decisions, and the `VERDICT:` line |
| `context/changes/load-and-tab-guard/plan.md` | triaged plan. Edits: Critical Implementation Details (F2, F3), Phase 1 balance comment (F4), Phase 5 §1 `guardedPut` (F1), Phase 5 §2 seam log (F5), Phase 7 (b) and p7b (F2), Known risks (F4, F6), decision 9, Overview, Desired End State, Key Discoveries |
| `context/changes/load-and-tab-guard/plan-brief.md` | brief aligned to `guardedPut` |
| `context/changes/load-and-tab-guard/change.md` | status `plan_reviewed` |
| `context/changes/load-and-tab-guard/handoff.md` | this handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/load-and-tab-guard` |
| `node_modules/phaser/package.json` version | `4.2.1` |
| Source reads | Phaser loader internals:<br>• `LoaderPlugin` `checkLoadQueue`/`nextFile`/`fileProcessComplete`/`loadComplete`/`shutdown`<br>• `File` `load`/`onError`/`resetXHR`/`onProcessComplete`/`destroy`<br>• `XHRLoader` handlers<br>• `FontFile.onProcess`<br>• `SceneManager` `bootScene`/`loadComplete`/`update`<br><br>idb-keyval: `update`, `createStore`, exports.<br><br>Project code:<br>• `src/storage/idb.ts`<br>• `src/core/autosave.ts` `attempt`/`replaceGate`/`withTimeLimit`<br>• `src/testing/e2eHook.ts` `e2eSaveStore`/`snapshot`<br>• `src/scenes/BootScene.ts`<br>• `src/pwa/registerServiceWorker.ts`<br>• `vite/config.shared.mjs` |
| Progress↔phase check | 1:1 in all 7 phases. There is exactly one `## Progress`, with 31 rows. |
| lint / typecheck / unit / build / e2e | not run, because this step only touches docs. The baseline on main `6f5644c` (unit 2925, e2e 101) is inherited and was not verified here. |

No deliberate break was made, because no code changed. Phase 5 now carries an extra break: `guardedPut` without its `get` error branch must turn red.

## 4. Next command

`/10x-tdd load-and-tab-guard` (phase 1, `Driver: tdd`)

## 5. Open

- **Drivers by phase:**
  - Phase 1 `tdd`: `src/core/bootLoad.ts`, `balance.loader`.
  - Phase 2 `impl`: `src/scenes/loaderCut.ts` `cutLoad`, `REGISTRY_KEYS.bootLoad`, `?e2eArt=stallall`, hook `screen: 'loading'`, `tests/phaserLoaderPin.test.ts`.
  - Phase 3 `impl`: `LoadingScreen.slow`, `pl.loading.slow`, gap 112.
  - Phase 4 `tdd`: `storedVersionNewer`, `BlockReason 'newer'`, `replaceGate`, `offState`, `deviceSaveView`, gap 113.
  - Phase 5 `tdd`: `guardedPut` in `src/storage/idb.ts`, `?e2eSave=newer`.
  - Phase 6 `impl`: `CLAUDE.md` and `follow-ups/review-fixes.md`.
  - Phase 7 `e2e`: `tests/e2e/load-and-tab-guard.spec.ts`, request-file protocol, patches p7a–p7d.
- **Risks carried** (plan `## Known risks`):
  - Phaser internals: `^4.2.1`, guarded by the tripwire plus e2e #15.
  - The cold first start competes with the SW precache (F4).
  - The `creates` guard and the font swap are belts with no red test (F6, and p7b is expected green).
  - The guard only protects from this build onwards.
  - Two tabs of the same version stay unguarded.
  - `guardedPut` + `preventDefault` on a failing `get` is unverified on WebKit/iOS.
- **Manual-only rows (human checklist):**
  - 2.5: Android on a throttled network starts in about 45 s or less.
  - 7.7: iPad/WebKit shows the cut and the slow line.
  - 3.3 [visual]: the slow line.
- **DESIGN-GAPs planned:** 112 (`pl.loading.slow`) and 113 (`saveOff.newer`), added in phases 3 and 4.
- **Follow-ups:** none yet. Phase 6 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

- **No AskUserQuestion was asked.** The skill's "how to proceed" was decided as "Triage findings", with every finding decided in place (contract rule 1). Would change: none.
- **F1 (CRITICAL): use `guardedPut` on the raw `IDBObjectStore`, in one `readwrite` transaction.** If `get` fails, it calls `preventDefault` and puts anyway.
  - Rejected: bare `update`. It would block "Zastąp mimo to" for a record the browser cannot read.
  - Rejected: falling back to `set` on any error. That breaks atomicity on timeouts.
  - Rejected: letting the replace path skip the guard. An import could then erase a newer save.
  - Would change: WebKit evidence that the transaction aborts despite `preventDefault`.
- **F2: keep the `onProcessComplete` swap as a belt, and expect p7b green.** Scenario (b) now releases the font. Would change: a red p7b, which means the analysis is wrong, so stop and re-examine.
- **F4: keep `totalMs` 45 000 and only document the precache competition.** Would change: a tablet measurement (plan decision 2).
- **F6: accepted.** Phaser's `once` guarantees one `create`. Would change: a Phaser upgrade (tripwire).
