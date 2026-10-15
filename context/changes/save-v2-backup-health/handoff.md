# Handoff — `save-v2-backup-health` (slice fix save-v2-backup-health, non-roadmap)

Written by the `/10x-tdd` phase 2 step of run `2026-10-15-fix-s14c-s14d`. Phase 2 code is committed (ccbfc11); only the e2e part of row 2.4 and the [human]/[reviewer] rows remain. The next agent must keep the backup policy in `src/core/autosave.ts` `attempt` (v1 copy first on a healthy device, v2 without it only by policy) intact.

## 1. State

| | |
|---|---|
| Branch | `feat/save-v2-backup-health`, cut from `main` at `16848c6` |
| Commits | plan commits + `8430945` (p1) + `ccbfc11` (p2) + handoff p2 |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (1.4 ticked by the orchestrator note; 2.1-2.3 done; 2.4 open for e2e; 1.5, 1.6, 2.5-2.7 not mine) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/autosave.ts` | `backupAttempts` option, status `backup` (none/pending/failed/done/skipped) + `backupError` replacing `backedUp`; `attempt` skips the copy after the Nth failed copy or on `hidden` after a failed copy; `replace` tries an owed copy once; log `autosave: backup failed` and `autosave: writing v2 without the v1 copy` |
| `src/data/balance.ts`, `src/main.ts` | `balance.save.backupAttempts` 3, wiring; `backuphang` uses the short e2e write limit |
| `src/testing/e2eHook.ts` | seams `backupfail`, `backuphang` (v1 fixture; hook build only, covered by marker `e2eSave`) |
| `tests/autosave.test.ts` | 6 new tests + 2 changed on the copy policy and replace; `tests/e2eSave.test.ts`, `tests/e2eHookGuard.test.ts` seam cases; `tests/saveFile.test.ts`, `tests/saveHealth.test.ts` option/status fields |
| `plan.md` | rows 1.4, 2.1-2.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | OK |
| `npm test` | 2466 passed (branch baseline 2455, +11) |
| deploy/ops shell tests, `sample` E1-E6 | OK |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied); expected 77 + 0, incl. `save-migration.spec.ts` "#2 ... with a v1 backup first" |
| RED (9 failures, assertions) | e.g. `expected [ 'backup', 'backup', 'backup' ] to deeply equal [ 'backup', 'backup', 'backup', 'write' ]`; `expected undefined to be 'done'`; `expected [ 'write' ] to deeply equal [ 'backup', 'write' ]` |
| Break A (limit never reached: `true` in place of `backupFails < backupAttempts`) | "third failed copy writes v2" red, restored |
| Break B (`hidden` exception removed) | "page-hide flush ... without trying the copy again" red, restored |
| Break C (`replace` ignores owed copy) | 2 replace tests red, restored |
| Meta-check | tests count store `ops` order, not only `status().backup`, so the breaks are real |
| `git diff --stat tests/fixtures` | empty; `SAVE_VERSION` 2 |

## 4. Next command

`/10x-tdd save-v2-backup-health phase 3` (Driver: tdd)

## 5. Open

- Row 2.4 e2e part (orchestrator: `npx playwright test --workers=4`, expect 77).
- Rows 1.5, 2.7 [reviewer]; 1.6 [visual]; 2.5, 2.6 [human].
- Earlier open items unchanged: [human] 4.7, 4.8; DESIGN-GAP 94-97; follow-ups in phase 5.

## 6. Autonomous decisions

- Third failed copy counts `failures`/`lastError`/`lastFailure` but not `consecutiveFailures` (the same attempt then succeeds in writing v2). Would change: the panel needing the failed copy as a consecutive failure.
- Hidden-first attempt with a failing copy: copy tried once, v2 written anyway (plan text). Replace's failed copy only sets `backupError`, no failure counters.
- Mixed phase: balance, wiring, seams inline; the phase keeps Driver: tdd. RED was assertion failures after stubbing the `backupAttempts` option type.
- Did not set change.md status.
