# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-impl-review save-truth` step. All 15 phases were reviewed, two warnings were fixed in 209afe3, and `change.md` is `impl_reviewed`. Verdict: MERGE CLEAR. The next agent must not get two things wrong. First, the save format stays v4 (`SAVE_VERSION` 4, no existing `tests/fixtures/` file edited). Second, the [visual] and [human] rows and the `(CI at ship)` row 13.7 belong to their owners: the visual gate, the maintainer and the ship step.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phases 1-15 + handoffs, then `fix(save-truth): poprawki po przeglądzie implementacji` 209afe3, then `docs(save-truth): impl review` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 16 (`grep -c '^- \[ \]' plan.md`): 13.7 (CI at ship), [visual] 1.7, 2.6, 3.7, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, [human] 3.8, 4.6, 11.6, 14.4, 15.4 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/save-truth/reviews/impl-review.md` | review report: 0 critical, 6 warnings, 4 observations, decisions per finding |
| `src/core/autosave.ts` | `readBackups` under `limited()` (F1); `replace` asks `replaceGate` again after `await inflight` (F3) |
| `tests/autosave.test.ts` | 2 tests: hanging `readBackups` gives `[]` after the write limit; a write refused by another window while the parent confirmed blocks the replace |
| `tests/fixtureLoadPath.test.ts` | new: 8 frozen fixtures (v1, v1-fresh, v1-legacy-salon, v2, v2-fresh, v2-legacy-salon, v3, v4) through fake IndexedDB → `createIdbSaveStore` → `loadSave` → first write → reload, plus the write-once copy |
| `tests/e2e/save-backup-health.spec.ts` | SV2-04: `expect(keepCopy).toBeVisible()` before the tap (F8) |
| `CLAUDE.md`, `src/data/balance.ts`, `src/main.ts`, `src/data/pl.ts` | stale sentences and comments fixed (F4: S-15 copy order, hidden give-up, `backupAttempts`, seam list, DESIGN-GAP 129/131 placement) |
| `context/changes/save-truth/follow-ups/review-fixes.md` | entries 23-27, each with `Trigger:` (27 entries / 27 triggers) |
| `context/changes/save-truth/plan.md` | [reviewer] rows 1.6, 2.5, 3.6, 4.5, 5.4, 6.4, 7.4, 8.4, 9.4, 10.4, 11.4, 12.4, 13.6 ticked |
| `context/changes/save-truth/change.md` | status `impl_reviewed` |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK (before and after the fixes) |
| `npm test` | before the fixes 3535 passed (baseline 3416 + 119); after 3545 passed (baseline 3416 + 129: +8 fixture load path, +2 autosave) |
| deploy scripts, `sample` E1-E6 | OK, OK, no violation |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `grep -r "slowfail\|e2eSave" dist/` empty |
| `npx playwright test --workers=4` | before the fixes 132 passed (baseline 127 + 5); after the fixes 132 passed (baseline 127 + 5, 10.8 min) |
| Break 1: `putBackupOnce` `count === 0 \|\| true` | red: `idbStore` "a second backup … keeps the first bytes" (`expected 'written' to be 'kept'`) and 7 fixture cases; restored. Meta: proves write-once on fake-indexeddb, not Safari |
| Break 2: p15b (`settingsPanel.ts` backup button never added), with the new guard | red at `expect(keepCopy).toBeVisible()` "element(s) not found", 5 s instead of the 120 s timeout; restored |
| New review tests before the fix | red at assertions: `expected 'still waiting' to deeply equal []`, `expected { ok: true } to deeply equal { ok: false, error: 'Blocked' }` |
| Experiment: copy-first on the first attempt (F2) | 16 unit tests red (phase 5's planned order); reverted with `git checkout`, not committed |
| Save format | `SAVE_VERSION` 4, `encodeSave` and `MIGRATIONS` unchanged; `tests/fixtures` only gains `save-v1-legacy-salon.json`; new keys outside `SAVE_KEYS` |
| stray processes | `ps -U $(id -u) … sleep\|until\|while\|playwright\|vite` empty (run outside the sandbox) |

## 4. Next command

`visual gate ("Zapis gry" lines, export/import/reset dialogs, refusal card with Kod:, kept-copy button) then /10x-archive save-truth`

## 5. Open

- [visual] rows 1.7, 2.6, 3.7, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5 (the visual gate).
- [human] checklist:
  - 3.8: force only from the second `unavailable` start, and the wording of gap 126.
  - 4.6: the FIRST old copy is kept.
  - 11.6: the wording of gaps 127-136.
  - 14.4: two tablet tabs.
  - 15.4: the Files app opens the kept copy.
  - Also decide follow-up 23 (`attempt`/`startCopy` copy-after-write window for the first copy).
- 13.7 `(CI at ship)`: workflow `CI`, job `check`, log lines `Tests +[0-9]+ passed` and `e2e hook: absent \([0-9]+ chunks checked\)`.
- Follow-ups 23-27 in `follow-ups/review-fixes.md`:
  - `attempt` first-copy order.
  - `startCounter.bump` counts restarts of one episode.
  - `guardedPut` `read.onerror` puts in normal mode (pre-existing).
  - `putBackupOnce` microtask put, plus no copy on a forced replace.
  - `writeVerdict` `olderWriter` stays a put.
- Design gaps 126-138: rows and comments match the code keys.

## 6. Autonomous decisions

1. **F2 accepted, not fixed.** Chosen: keep phase 5's write-then-copy order and record follow-up 23. Rejected: copy-first on the first attempt. Why: the plan accepts the risk explicitly (Known risks "Copy after write", decision 8 "copy-before-write rejected"), the stored record already says `lost` before the write, the progress itself is complete (proven by `tests/fixtureLoadPath.test.ts`), and reversing it would rewrite 16 unit tests and 2 e2e specs in a review. Would change: a [human] decision at ship, or a device report of a missing `backup-v<N>`. Severity WARNING rather than CRITICAL because no progress is lost and the loss of the copy is told to the parent.
2. **F3 fixed although it predates the slice.** The fix is cheap, it closes an overwrite of another window's newer save, and phase 8 made `otherTab` reachable earlier.
3. **F5 and F6 deferred** (follow-ups 24, 25). F5 still needs two parent confirmations. F6 predates the slice and needs a design choice for normal-mode read errors.
4. **Gate fixes to CLAUDE.md** (stale sentences only) were made as part of seam-sweep row 13.6, not as a rule change.
5. The follow-ups were appended through a shell heredoc instead of the Write tool. The content is plain Markdown and was checked with `grep -c '^Trigger:'`.

MERGE: CLEAR — no open CRITICAL after the fixes, every automated criterion met, all suites green (unit baseline + 129, e2e baseline + 5); warnings are fixed or deferred with triggers.
