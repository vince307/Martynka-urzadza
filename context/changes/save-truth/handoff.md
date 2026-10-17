# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-e2e save-truth phase 14` step. Phases 1-14 are committed and green. The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited, only `save-v1-legacy-salon.json` was added), and phase 15 is an e2e phase driven with `/10x-e2e` (hook build; uses `?e2eSave=slowfail`).

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phases 1-13 as before, phase 14 = `test(save-truth): Another window's save stops this one at once (p14)` 0a4676c, plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`); set to `implemented` only after phase 15 |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; 14.1, 14.2, 14.3, 14.5 ticked; 14.4 [human] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/stale-tab.spec.ts` | three tests added: `#2 T-2 a second window's save stops the first before it writes`, `#2 T-5 the refusal card names its code`, `#2 B-1 without BroadcastChannel the stale window's own write is refused`; helper `twoWindows` |
| `context/changes/save-truth/plan.md` | Progress row 14.5 added (orchestrator requirement, test c) |

Test (a) asserts A's `save.writes` and `failures` unchanged while B saves; the plan's `staleWork` does not exist in `src/`, so it is not asserted (the card is the check). Test (c) removes `BroadcastChannel` for the whole context (`context.addInitScript`), lets B save, then A answers one task (that change triggers its write) and the hook shows `blockedBy: otherTab` with the card; a new window then loads B's stars (read through the hook; IndexedDB never opened by the test).

## 3. Verification

| command | result |
|---|---|
| spec alone | 5 passed (2 existing + 3 new) |
| Break p14a (`main.ts` channel verdict never `stale`) | T-2 red: `Expected: "otherTab" Received: null`; restored |
| Break p14b (`main.ts` card `detail` not passed) | T-5 red: `Expected: visible ... element(s) not found` (the `Kod:` text); restored |
| Break p14c (`guardedPut` refuse branch skipped, so the write goes through) | (c) red: `Expected: "otherTab" Received: null`; restored |
| Meta-check | T-2/T-5 prove delivery between two pages of one Chromium context, not iPadOS; (c) proves the store's write-time rule with the channel absent |
| lint / typecheck / `npm test` (3535) / deploy scripts / sample E1-E6 / build | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | 130 passed (baseline 127 + 3: T-2, T-5, c) |
| stray processes | checked outside the sandbox before the report |

## 4. Next command

`/10x-e2e save-truth phase 15`

## 5. Open

- Rows 14.4 [human] and the earlier [reviewer]/[visual]/[human] rows (2.5, 2.6, 3.6-3.8, 4.5, 4.6, 5.4, 6.4, 6.5, 7.4, 7.5, 8.4, 8.5, 9.4, 9.5, 10.4, 10.5, 11.4-11.6, 12.4, 12.5, 13.6, 13.7) not ticked.
- Phase 15 (late read error and old-version copy; `?e2eSave=slowfail`) remains.
- `isRecord` still has three copies; the follow-ups are in `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. Driver `e2e`; Chromium started in this session (outside the sandbox), so no request-file protocol was needed.
2. `staleWork` is not in the code base; (a) asserts `writes`/`failures` unchanged instead.
3. In (c) A stops after one answered task rather than a full round, because the refusal card appears at the first refused write and takes the input.
4. Break p14c edits the `refuse` branch of `guardedPut` (store side); the autosaver side is covered by unit tests.
5. Commit message and next-phase prompts decided in place; the run stops after this phase.
