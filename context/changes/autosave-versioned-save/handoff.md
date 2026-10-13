# Handoff — `autosave-versioned-save` (slice S-11)

Written by `/10x-tdd autosave-versioned-save phase 3` of run 2026-10-13-s09-s11. Phase 3 (IndexedDB adapter, dependencies, lint
boundary) is committed at 43af7ea; the adapter is still unused by `main.ts`. Do not edit `tests/fixtures/save-v1*.json` (frozen).

## 1. State

| | |
|---|---|
| Branch | `feat/autosave-versioned-save`, cut from `main` at `f67b9f4` |
| Commits | docs x4, `7cf32a4` p1, `76f6df1` p2, `43af7ea` p3, plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 29 (`grep -c '^- \[ \]' plan.md`); 1.x-3.x done |
| Roadmap | S-11 `planning` (unchanged) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/storage/idb.ts` | `createIdbSaveStore` (one key `profile:<id>`, one retry with a fresh store on `InvalidStateError`/`UnknownError`), `requestPersistence`, `SAVE_KEY_PREFIX` |
| `eslint.config.mjs` | `idb-keyval` restricted outside `src/storage` (consts `IDB_KEYVAL*` repeated in the core/data/other blocks), `indexedDB` banned in `src/core`, `src/storage` has browser globals |
| `tests/idbStore.test.ts` | 6 tests on fake-indexeddb; `tests/lint-boundaries.test.ts` +3 cases |
| `package.json`, `package-lock.json` | `idb-keyval` 6.3.0, `fake-indexeddb` 6.2.5 (dev), exact |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub `read` undefined, no rules) | idbStore: `AssertionError: expected undefined to deeply equal { version: 1, ... }` (4 of 6 red); lint-boundaries: `expected [] to include 'no-restricted-imports'` (2 red) |
| GREEN | 14/14 in the two files |
| Break A: core block without the `phaser` entries | red: "src/core must not import Phaser", "the idb-keyval rule keeps the Phaser and src/data boundaries"; restored |
| Break B: adapter writes `JSON.stringify(value)` | red: round-trip, second write, profiles, uncloneable (4 of 6); restored |
| Meta-check | break A proves flat-config override order; break B proves a real structured-clone round trip (fake-indexeddb), not a port mock |
| `npm run lint`, `typecheck` | OK |
| `npm test` | 1138 passed (baseline 1079, +59 over main incl. phases 1-2) |
| deploy tests, `sample` E1..E6, `npm run build` | OK, `e2e hook: absent` |
| `npx playwright test` | not runnable in this session (MachPort) -- orchestrator gate; adapter unused by the game |

## 4. Next command

`/10x-implement autosave-versioned-save phase 4` (`Driver: impl`)

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

- Phase 3: npm install ran sandboxed with `allowed_domains: ["registry.npmjs.org"]` and worked; exact versions, no `^`.
- Phase 3: `idb-keyval` restriction lives in a separate block for scenes/pwa/ui/testing/main plus entries in the core and data
  blocks (flat config replaces a rule per block). Reversal: none needed.
- Phase 3: `requestPersistence` reads `navigator.storage` (global, allowed in `src/storage`); no `indexedDB` use outside idb-keyval.
- Phase 2's row 2.3 now cites the orchestrator e2e run on 75eaa08 (26 passed).
- E2E: not run (MachPort); orchestrator gate for 43af7ea, no game wiring changed.
