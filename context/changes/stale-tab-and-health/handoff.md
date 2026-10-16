# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Written by the `/10x-impl-review` step of run `2026-10-16-fix-stale-tab-health`. The change is `impl_reviewed`, MERGE: CLEAR; the next step is the visual gate (row 12.4). Do not tick 10.7 (CI at ship) or 11.4 [human] without observing them.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | phases 1–12 up to `10de24c`, then `cc1621d` (impl-review fix: one store test), then this review commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 3: 10.7 [reviewer] (CI at ship), 11.4 [human], 12.4 [visual] |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/stale-tab-and-health/reviews/impl-review.md` | full-plan review, phases 1–12: 0 critical, 1 warning (fixed), 4 observations; ends with `MERGE: CLEAR` |
| `tests/idbStore.test.ts` | new test "an own write that lands after a later own write started (an abandoned, timed-out write) is never refused" (commit `cc1621d`) |
| `context/changes/stale-tab-and-health/plan.md` | ticked [reviewer] rows 1.6, 2.5, 3.5, 4.4, 5.5, 6.4, 7.5, 8.4, 9.4, 10.5; 12.1 and 12.3 with the orchestrator gate (`10de24c`, 125 passed) |
| `context/changes/stale-tab-and-health/change.md` | status `impl_reviewed` |
| `context/changes/stale-tab-and-health/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK (on `10de24c` and again after `cc1621d`) |
| `npm test` | `10de24c`: 3138 = baseline 3076 + 62; after `cc1621d`: 3139 = 3076 + 63 |
| deploy scripts, `npm run sample -- E1`..`E6` | OK |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` (from this session, sandbox disabled) | 125 passed (10.9 min) = baseline 121 + 4; ports 4397/4398 free afterwards |
| `validate-rule-files.sh` | PASS (430 paths) |
| break: `writeVerdict` without `writer !== page.writer` | red: `saveV4.test.ts` "puts after its own write that is ahead" and the new store test; restored. Meta-check: the older store test "own writes in a row" stayed green under it, which is why the new test was added |
| break: `git apply e2e-break-p11b.patch`, `tests/e2e/stale-tab.spec.ts` | both tests red on `expect.poll(... save?.blockedBy).toBe('otherTab')` (received `null`); `git apply -R`, `src` diff empty |
| e2e after `cc1621d` | not re-run: the fix adds one unit test, no source change |

## 4. Next command

`visual gate (settings panel + child refusal card)`

## 5. Open

- 12.4 [visual]: settings panel at 1440 and 1024 in every new state ("Zapis gry" `otherTab`; "Gra bez internetu" ready, installing, install-failed with `Kod:`, unsupported, takenOver; "Obrazki" UI line ok and missing; "Dźwięki" music loading, waiting-unlock, missing, and `soundPrefsNotKept`) and the child card `saveRefused` over the task screen.
- 11.4 [human]: iPad, the card reads calmly to a 6–8-year-old and "Zacznij od nowa" brings back the newest stars.
- 10.7 (CI at ship): workflow `CI`, job `check`, log lines `e2e hook: absent \([0-9]+ chunks checked\)` (step `npm run build`) and `Tests +[0-9]+ passed` (step `npm test`).
- Observations recorded in the review: the refusal card hides the parent's reason line in that window (`src/main.ts` `onBlocked`, follow-up with `Trigger:` already present); `registerServiceWorker` names a throw in its `.then` as `register-failed`; the raw-save export carries the random `writer` id; a comment-only edit in `src/data/balance.ts` `balance.save`.
- Follow-ups: `follow-ups/review-fixes.md` unchanged (every entry has a `Trigger:` line). DESIGN-GAP rows 116–121 checked against the code comments.

## 6. Autonomous decisions

- **Phase-4 decision kept** (card on `newer` and `otherTab`, holds the input switch). Rejected: a parent-only signal or a card that lets the panel open. Why: the reload is the only useful action, it makes PRD FR-020 true again, it is not an update prompt (FR-003), and import/reset are refused in that window anyway (`replaceGate`). Would change: a parent report of a refusal card with no way to read the reason (the existing follow-up's trigger).
- **F1 fixed with a test, not a code change**: the code was right; the plan's "late own write accepted" row had no store-level proof. Would change: nothing.
- **e2e not re-run after `cc1621d`**: the commit touches only `tests/idbStore.test.ts`. Would change: any source change after this step.
- **Unit RED re-executed by hand** (copy, `sed`, restore from the copy) instead of a patch file; `git diff` confirmed clean afterwards.
