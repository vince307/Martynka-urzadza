# Handoff — `save-v2-backup-health` (slice fix save-v2-backup-health, non-roadmap)

Written by `/10x-impl-review` of run `2026-10-15-fix-s14c-s14d`. Review verdict: APPROVED, `MERGE: CLEAR`. Two WARNINGs were fixed in `58cf156`, the reviewer rows are ticked, and `change.md` is `impl_reviewed`. The next agent runs the visual gate. It must not touch production code except to fix a visual-gate finding.

## 1. State

| | |
|---|---|
| Branch | `feat/save-v2-backup-health`, cut from `main` at `16848c6` |
| Commits | plan commits + p1 `8430945` … p6 `e7407b7`, review fix `58cf156`, then this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | only [visual] 1.6, 3.5, 4.6, 5.7 and [human] 2.5, 2.6, 4.7, 4.8 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-v2-backup-health/reviews/impl-review.md` | review report: a save-safety table by symbol, the reviewer rows, F1–F6, and `MERGE: CLEAR` |
| `tests/autosave.test.ts` | `hasSettled` helper; "a hung write is a timeout failure…" and "replace behind a write that never answers…" now fail by assertion, not by the vitest timeout (F1) |
| `src/data/pl.ts` | `settings.saveOff.timeout` and `saveTransfer.deviceTimeout` now say "może pomóc usunięcie danych tej strony" instead of "pomoże" (F2) |
| `context/changes/save-v2-backup-health/follow-ups/review-fixes.md` | new follow-up for F3/F4 (`replace` marks the copy `skipped` after one try; log `attempts: 0`), with a `Trigger:` |
| `context/changes/save-v2-backup-health/plan.md` | reviewer rows 1.5, 2.7, 3.4, 4.5, 5.6 ticked |
| `context/changes/save-v2-backup-health/change.md` | status `impl_reviewed` |

## 3. Verification

All observed in this step. Baseline is main `16848c6`: unit 2445, e2e 77.

| Command | Result |
|---|---|
| lint, typecheck | OK, before and after the fix |
| `npm test` + deploy tests + `sample` E1–E6 | 2479 passed (128 files) = baseline 2445 + 34; still 2479 after the fix (assertions added, no new tests); every sample OK |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=… --workers=4` (Chromium launched first try) | 82 passed (5.8 min) = baseline 77 + 5 |
| Break 1 (unit): `attempt` calls `store.write(encoded)` without `limited` | before F1: 3 tests red only by `Test timed out in 5000ms`; after F1: "hung write" and "replace behind…" red at once with `AssertionError: expected false to be true`; restored |
| Break 2 (unit): `idb.ts` `run` ignores `mayRetry` | "an abandoned write … is not retried once a newer write started" red (`expected 'ok' to be 'InvalidStateError'`); restored |
| Break 3 (e2e): `e2e-break-p6a.patch` (the copy never gives up), `-g "SV2-01"`, 1 worker | red: `toBe` Expected 2, Received null on `writtenVersion`; reversed with `git apply -R`; tree clean |
| Meta-check | break 1 now proves the time limit by assertion. Break 2 proves the write-order guard in the store, not in the autosaver. Break 3 proves SV2-01 in the browser (the save is never written as v2) |
| Fixtures and format | `git diff --stat main..HEAD -- tests/fixtures src/core/save.ts` empty; `SAVE_VERSION = 2` |
| Ports 4397/4398 | no listener after the runs |

## 4. Next command

Next: `visual gate`

## 5. Open

- Visual rows (`plan.md` Progress), for the visual gate:
  - 1.6: "Zapis gry" at `?e2eSave=writehang` shows `failing`.
  - 3.5: the panel at `v1`, `backupfail`, `writefail`, `writehang`.
  - 4.6: the slow card at `hang` (before, during, after) and at `unavailable`; the panel and reset dialog at `hang`.
  - 5.7: the reset dialog at `writehang`.
  - All at 1440 and 1024. Gestures and the adult gate go through the Playwright fallback (profile § 8).
- Human checklist:
  - [ ] 2.5: v2 is written without the raw v1 copy after 3 failed copies, or at page hide after the first.
  - [ ] 2.6: import and reset try a copy that is still owed once (SRR-04).
  - [ ] 4.7: no start counter; the way out of a timeout is a longer wait plus the advice.
  - [ ] 4.8: N-7 iPad measurement.
- Follow-ups with `Trigger:` are in `follow-ups/review-fixes.md`. New in this step: F3/F4 in `src/core/autosave.ts` `replace`/`skipBackup`.
- The e2e slow-read constants are timing-sensitive (`src/testing/e2eHook.ts` `E2E_SLOW_READ_MS`, spec `SLOW_READ_MS`; F5). They are green here.
- DESIGN-GAP rows 94–97 (`docs/design-gaps.md`) still need the visual gate.

## 6. Autonomous decisions

- **F1 fixed in tests (helper `hasSettled`), not by `vi.setConfig` or a shorter timeout.** Why: the contract asks for RED by assertion. The helper fails in milliseconds and names the cause. What would change it: a test-runner rule that forbids helper predicates (none exists).
- **F2 copy softened ("może pomóc").** Rejected: leaving "pomoże". Why: the game cannot know that clearing site data fixes a hang, and the brief asks for honest copy. No spec asserts the literal text. What would change it: a teacher or maintainer preferring the firmer wording.
- **F3/F4 recorded as a follow-up, not fixed.** Why: the behaviour is the plan's decision 3, under `[human]` 2.6, and no progress is lost (v2 ⊇ v1). Changing it would alter the reviewed SRR-04 contract. What would change it: the maintainer rejecting 2.6, or a v3 migration that can drop fields.
- **Verdict APPROVED / MERGE: CLEAR.** Why: no CRITICAL was found, the two WARNINGs are fixed, and every save-safety point was verified by symbol. What would change it: a visual-gate finding of a misleading parent line, or a flaky slow-read e2e.
