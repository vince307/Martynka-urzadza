# Handoff — `save-v2-backup-health` (slice fix save-v2-backup-health, non-roadmap)

Written by the `/10x-implement` phase 4 step of run `2026-10-15-fix-s14c-s14d`. Phase 4 code is committed (`afbf9a8`); row 3.3 ticked from the orchestrator note, row 4.4 (e2e) waits for the orchestrator; 4.5 [reviewer], 4.6 [visual], 4.7 and 4.8 [human] are not mine.

## 1. State

| | |
|---|---|
| Branch | `feat/save-v2-backup-health`, cut from `main` at `16848c6` |
| Commits | plan commits + p1 `8430945` + p2 `ccbfc11` + p3 `ec72589` + p4 `afbf9a8` + handoff p4 |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (4.4 open for e2e; 1.5, 1.6, 2.5-2.7, 3.4, 3.5, 4.5-4.8 not mine) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/autosave.ts` | `loadSave`: one `store.read()`; a `timeout` outcome carries `waitLonger(ms)` (same read promise, longer limit, no further `waitLonger`) |
| `src/core/saveHealth.ts` | `cardCopyFor(kind, reason, error?)` returns `'slow'` for a timeout; `SaveCardKey` has `slow` |
| `src/main.ts` | `slowCard` with ONE `settled` flag: "Graj dalej" keeps the first outcome (saver blocked), a late read after it is only logged (`save: late read ignored`), a result before it closes the card and replaces `outcome` (an `unreadable` result then gets its normal card) |
| `src/ui/dom/saveFailedCard.ts` | `onWait`, `copy.wait/waiting/stillSlow`; focus stays on "Graj dalej" |
| `src/data/pl.ts`, `src/data/balance.ts` | `saveSlow`, advice added to `settings.saveOff.timeout` and `saveTransfer.deviceTimeout`; `save.slowLoadTimeoutMs: 20000` |
| `src/testing/e2eHook.ts` | seam `slow` (answers after `E2E_SLOW_READ_MS` 800 ms with a v2 save of 7 stars), `E2E_SLOWER_LOAD_TIMEOUT_MS` 1500 (second limit under `hang`/`slow`; first limit stays `E2E_LOAD_TIMEOUT_MS` 300) |
| `docs/design-gaps.md` | rows 96, 97 |
| `tests/autosave.test.ts`, `tests/saveHealth.test.ts`, `tests/e2eSave.test.ts`, `tests/e2eHookGuard.test.ts` | 7 new tests (4 waitLonger, 1 cardCopyFor, slow seam, guard case) |
| `tests/e2e/save-restart.spec.ts`, `tests/e2e/save-transfer-blocked.spec.ts` | the `hang` card is now found by `pl.saveSlow.title` and its button `pl.saveSlow.continue`: tests "#2 M-S4 a read that never answers ends in the same card after the load timeout" and "#2 SIR-02 a read that timed out offers no overwrite" |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | OK |
| `npm test` | 2478 passed (branch baseline 2471, +7) |
| deploy/ops shell tests, `sample` E1-E6 | OK (no content change) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | e2e: not runnable in this session — orchestrator gate (Chromium: MachPortRendezvous Permission denied, 3 plain tries). Expected 77 + 0, in particular the two edited specs above |
| RED | `AssertionError: expected 'unavailable' to be 'slow'`; the three waitLonger tests failed with `Error: expected a waitLonger` (missing field, thrown by the test helper) |
| Break (`waitLonger` calls `loadSave(store, …)` again, a second `store.read()`) | "waits on the SAME read" red (`expected 2 to be 1`) and "a second limit is a plain timeout" red; restored. Meta-check: the fake store counts `read` calls and the late answer comes from the first promise |
| Orchestrator note | row 3.3 ticked: 77 passed on ec72589 with `--workers=4` |
| `git diff --stat tests/fixtures` | empty; `SAVE_VERSION` 2 |

## 4. Next command

Next: `/10x-implement save-v2-backup-health phase 5` (Driver: impl)

## 5. Open

- Row 4.4 e2e (orkiestrator: `npx playwright test --workers=4`, expect 77; the two specs in §2 must be green).
- Rows 1.5, 2.7, 3.4, 4.5 [reviewer]; 1.6, 3.5, 4.6 [visual]; 2.5, 2.6, 4.7, 4.8 [human]; 3.3 e2e done via note.
- The "Poczekaj dłużej" path has no e2e yet (phase 6 covers SRR-02 with `slow` and `hang`).

## 6. Autonomous decisions

- Teacher-read wording of `saveSlow.*` and the advice in `saveOff.timeout`/`deviceTimeout` is exactly the plan's text (row 4.5 is the reviewer's).
- Implemented in this context, no subagent (no AskUserQuestion); commit message taken as proposed.
- `store.read()` is now called through `new Promise(resolve => resolve(store.read()))` so a synchronous throw is still a rejection.
- A late `unavailable` that is not a timeout (a rejected read) also ends in the `stillSlow` text; the card has no separate wording for it (rare, parent can only continue).
- Second-limit values in the hook build: first 300 ms, second 1500 ms (both `hang` and `slow`); the real build uses 5 s then 20 s.
- Did not set change.md status.
