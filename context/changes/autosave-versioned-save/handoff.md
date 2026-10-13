# Handoff — `autosave-versioned-save` (slice S-11)

Written by `/10x-tdd autosave-versioned-save phase 2` of run 2026-10-13-s09-s11. Phase 2 (autosave state machine, load, calendar
floor) is committed at 76f6df1; still nothing is wired to the game or IndexedDB. `src/core/autosave.ts` must stay pure (clocks,
store and log injected). Do not edit `tests/fixtures/save-v1*.json` (frozen).

## 1. State

| | |
|---|---|
| Branch | `feat/autosave-versioned-save`, cut from `main` at `f67b9f4` |
| Commits | docs x4, `7cf32a4` test p1, `7149039` handoff p1, `76f6df1` test p2, then this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 33 (`grep -c '^- \[ \]' plan.md`); 1.1-1.3 and 2.1-2.3 done |
| Roadmap | S-11 `planning` (unchanged) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/autosave.ts` | `SaveStore`, `LoadOutcome`, `WriteReason`, `AutosaveStatus`, `loadSave` (never rejects, never writes), `createAutosaver` (`markDirty`, `flush`, `block`, `status`) |
| `src/core/curriculum.ts` | `floorToCalendar(learner, stages, month, data, rules)` |
| `src/data/balance.ts` | `save.debounceMs: 500` |
| `tests/autosave.test.ts` | 12 tests (load outcomes, debounce, flush, onFirstWrite, block, failures, seeded property) |
| `tests/curriculumStart.test.ts` | +3 floor tests, +1 `balance.save` pin |
| `context/changes/autosave-versioned-save/plan.md`, `change.md` | Progress 1.3 e2e citation, 2.1-2.3 ticked; status `implementing` |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs: fresh / no-op saver / learner unchanged) `npx vitest run tests/autosave.test.ts tests/curriculumStart.test.ts` | autosave 11 of 12 failed, first: `AssertionError: expected 'fresh' to be 'loaded'`; floor: `expected 1 to be 6`, `expected undefined to be 3` |
| GREEN | 28/28 in those two files |
| Break A: drop the `blocked` check in `save` | red: both "nothing is ever written" tests and "block() ... cancels it"; restored |
| Break B: `save` does not cancel the timer | red: "flush writes now, cancels the timer ..."; restored |
| Break C: `attempt` rethrows instead of catching | red: onFirstWrite, rejected write, snapshot throws, property (unhandled rejection / failures); restored |
| Meta-check | expectations come from FR-020/FR-021 and the plan's rules (hand-written literals, fixtures), not from the saver output; break A reds on `writes`, not on a timeout |
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` | 1129 passed (baseline 1079, +50 over main incl. phase 1) |
| deploy tests, `npm run sample -- E1..E6`, `npm run build` | OK, e2e hook absent |
| `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate; no game wiring changed |

## 4. Next command

`/10x-tdd autosave-versioned-save phase 3` (`Driver: tdd`)

## 5. Open

- Manual rows (human checklist): 4.6 [human] iPad/Android restart, kill, silent update keep state; 5.5 [reviewer] teacher
  read `pl.saveFailed`; 5.6 [visual] card, gate over card, welcome after „Graj dalej” at 1440×900 and 1024×768; 5.7 [human]
  export on iPad home-screen app and Android; 5.8 [human] `?e2eSave` seam; 6.5 [reviewer] seam sweep; 6.6 [human] v1
  deviates from plan §5; 6.7 [human] card gating (against research recommendation); 6.8 [human] two-build e2e (#10)
  deferred to v2; 6.9 [human] `pl.errorCard.body` unchanged, fatal error blocks autosave.
- DESIGN-GAPs planned: rows 42 (failed-load card), 43 (save invisible to the child), 44 (export as `.txt`, share first).
- E2E protocol: phase 4 writes `context/runs/2026-10-13-s09-s11/e2e-break-s11-p4.patch`; phase 7 writes
  `e2e-request-s11-p7.md` + `e2e-break-s11-p7a/c/d.patch`.
- Phase 3 needs network: `npm_config_cache="$TMPDIR/npm-cache" npm install --save-exact idb-keyval@6.3.0` and `… install
  --save-exact -D fake-indexeddb@6.2.5` with `allowed_domains: ["registry.npmjs.org"]`.
- Carried follow-ups (unchanged triggers): observability F3 (`installErrorBoundary` `signalOfRejection`), F4
  (`WelcomeScene.openParent`), parent-settings F7 (`pl.settings.empty`).
- New Known risks from the review (plan.md `## Known risks`): v1 validation never tightens without a migration (F4);
  two same-origin instances, last writer wins (F5, follow-up in phase 6 with the v2 trigger).


## 6. Autonomous decisions

- Phase 2: `flush`/`markDirty` while blocked only count `skipped`; `block()` is permanent for the session (plan). Reversal: a
  "retry load" flow would need an `unblock`, deliberately absent.
- Phase 2: a write that fails never schedules its own retry (plan); the next `markDirty` or `flush` retries. A change during a
  write coalesces into exactly one more write (`rerun` loop inside the single in-flight promise).
- Phase 2: `dirty` is cleared when the snapshot is taken and restored on failure, so a change made during the write stays dirty.
- Phase 2: break C is "rethrow instead of catch" (the same effect as a write without `catch`).
- Phase 2: the first commit left plan.md/change.md out by a shell slip; they are committed with this handoff.
- E2E: not run (Chromium MachPort denied); orchestrator gate for 76f6df1, no e2e-relevant code changed.
