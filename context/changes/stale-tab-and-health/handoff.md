# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Written by the `/10x-tdd` step for phase 2 of run `2026-10-16-fix-stale-tab-health`. Phase 2 (compare-and-set inside `guardedPut`) is committed as `4342650`; the autosaver does not know `OtherWriterSave` yet (it counts as an ordinary failed write until phase 3). The next agent must not get wrong: `guardedPut` now takes `(os, key, value, page, mode)` and resolves with the written generation; `replace` passes mode `'replace'`; a failed read still writes through (`base + 1`).

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | ..., `c0d8343` (p1), `4342650` (p2 code+tests), then a docs commit with this handoff and the ticks |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 49 (2.4 orchestrator e2e, 2.5 reviewer, 1.6 reviewer among them) |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/storage/idb.ts` | `guardedPut` with `writeVerdict`, stamping, B-7 try/catch; `IdbSaveStoreOptions.writer` (default random per store), `base` tracked in `read()`/`write()` |
| `src/core/autosave.ts` | `SaveStore.write(value, mode?)`; `replace` passes `'replace'` |
| `src/main.ts` | `pageWriterId()` passed to `createIdbSaveStore({ writer })` |
| `tests/idbStore.test.ts` | new `describe('IndexedDB stale-writer guard')` (7 tests); existing tests updated to the stamped record (`toMatchObject`, `guardedPut` resolves `1`, puts carry `generation`/`writer`) |
| `context/changes/stale-tab-and-health/plan.md` | rows 1.5, 2.1-2.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run, before `idb.ts` change) | 7 of 7 new tests failed; first assertion `AssertionError: expected { version: 4, …(6) } to match object { generation: 1, writer: 'A', …(1) }` (no stamp), the B-7 test timed out |
| GREEN | `tests/idbStore.test.ts` 27/27 |
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` + deploy scripts + `sample` E1-E6 | OK; unit 3105 = baseline 3076 + 29 (phase 1 +22, phase 2 +7) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e (touched specs, sandbox off) | `save-migration` passed; `load-and-tab-guard` "#2 P-5 a newer save written by another tab" FAILED (`blockedBy` null, expected `newer`) both with my change AND on the stashed phase-1 tree when run in isolation; the orchestrator's full run on 94f7a38 was green, so it looks order/timing dependent, not caused by phase 2 (that spec uses the in-memory seam store, not `guardedPut`). Orchestrator: watch it at the gate |
| Deliberate break 1 | `guardedPut` ignoring the verdict's refusal: 6 red (stale-tab refusal, replace-then-refused, old build NewerSave, default writers, two older NewerSave tests); restored, green |
| Deliberate break 2 | `read()` not setting `base`: `a page that is created again reads the record and writes` red; restored, green |
| Meta-check | both prove the transaction rule on fake-indexeddb (two stores on one DB), not real browser tabs (phase 11) |

## 4. Next command

`/10x-tdd stale-tab-and-health phase 3`

## 5. Open

- **Rows left in phase 2**: 2.4 e2e full suite (orchestrator, `baseline + 0`; check the P-5 spec flake above); 2.5 [reviewer].
- Phase 1 row 1.6 [reviewer] still open.
- Phase 3 must map `OtherWriterSave` to the runtime `blockedBy 'otherTab'`; `e2eSaveStore` (`src/testing/e2eHook.ts`) still uses `storedVersionNewer` and ignores `mode`.
- Carried from the plan review (unchanged): [human] rows 10.6, 11.4; [visual] 12.4; [reviewer] 10.7; Known risks (reload race, stale-window `replace` summary, `register-failed` + `console.warn`); DESIGN-GAPs 116-121 in phases 3, 4, 6, 7, 8, 9; e2e phases 11-12 use the request-file protocol.

## 6. Autonomous decisions

- **Driver stays `tdd`**: no implementation existed (`guardedPut` had no verdict); no redirect.
- **RED without a stub**: the new tests drive the existing API (`createIdbSaveStore({ writer })`, extra args to `guardedPut`), so the first run failed on assertions, not on missing modules.
- **`guardedPut` signature**: `(os, key, value, page, mode)` required args, returns the generation; the old 3-arg tests were updated rather than keeping an optional `page`, so no path can skip the rule.
- **Non-Error put throw** is wrapped in a `DOMException` (lint `prefer-promise-reject-errors`); an `Error` is passed through unchanged.
- **Commit message** taken as proposed (Polish); ticks in a second docs commit. Full e2e left to the orchestrator.
