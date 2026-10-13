# Handoff — `save-observability-c1-c2` (slice fix, non-roadmap)

Written by the implementation-review step: full plan reviewed, verdict APPROVED, `MERGE: CLEAR`; one warning and two observations fixed in d455c40 (test + CSS comment + docs only). `change.md` is `impl_reviewed`. The orchestrator must re-run e2e on the final commit (Chromium cannot launch in the agent sandbox).

## 1. State

| | |
|---|---|
| Branch | `feat/save-observability-c1-c2`, cut from `main` at `4698110` |
| Commits | phases `fb2e7bb`..`a44f3b4`, handoffs, review fix `d455c40`, this review commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| Progress rows remaining | 5 (`grep -c '^- \[ \]' plan.md`): 4.5, 5.9, 5.10 [human]; 4.6, 5.8 [visual] |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-observability-c1-c2/reviews/impl-review.md` | review report (findings, suites, breaks, audit map, save-path walk, teacher read, MERGE line) |
| `tests/e2eHookGuard.test.ts` | +4 cases: production chunk holding each `?e2eSave=` seam fails the guard (S-11 F4, d455c40) |
| `src/style.css` | comment-only: own comment for `.parent-save`, S-08 comment back above `.parent-progress` (d455c40) |
| `context/changes/save-observability-c1-c2/follow-ups/review-fixes.md` | descriptions for L-S2, L-S3, L-R8, L-R9, L-R11; S-11 F4 moved to Closed (d455c40) |
| `context/changes/save-observability-c1-c2/plan.md` | [reviewer] rows 1.5, 3.5, 4.4, 5.6, 5.7 ticked |
| `context/changes/save-observability-c1-c2/change.md` | status `impl_reviewed` |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | clean / clean (before and after d455c40) |
| unit (`npm test` + deploy tests + `sample` E1-E6) | 1172 before the fix (baseline 1142, +30); 1176 after d455c40 (+34); samples 0 violations |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `grep -rlE "e2eSave\|e2eStars" dist/` empty |
| `npx playwright test` | not runnable here: `browserType.launch: Target page, context or browser has been closed`; evidence = orchestrator run on a44f3b4, 33 passed (baseline 29, +4). e2e: orchestrator re-runs on the review's final commit |
| Break `block` last-reason-wins | RED "…a later fatal block keeps the first reason"; restored |
| Break `repairCurrentRoom` drops other rooms | RED "…leaves every other room untouched"; restored |
| Break `loadSave` orphan `.catch` alone | GREEN (race already handles `read`) → F4 observation; with `read` also out of the race: RED via the test's `unhandledRejection` listener; restored |
| Break `'e2eSave'` removed from `E2E_HOOK_MARKERS` | RED the 4 new guard cases; restored |
| Meta-check | breaks target contract/audit rules (first reason, other rooms untouched, no late rejection, seams out of dist); tree clean after each restore |

## 4. Next command

visual gate (unavailable card, Zapis gry section: ok / failing / off)

## 5. Open

- [visual] 4.6: `src/ui/dom/saveFailedCard.ts` `mountSaveFailedCard` with `?e2eSave=unavailable` and `?e2eSave=unreadable` (regression), 1440×900 and 1024×768, hook build on 4399.
- [visual] 5.8: `src/ui/dom/saveHealthView.ts` `createSaveHealthView` in the settings panel: ok (with time), failing (`?e2eSave=writefail`), off (`?e2eSave=unavailable`); "Zatwierdź"/"Anuluj" reachable.
- [human] 4.5 device check (iPad Safari private / blocked site data, Android without site storage): card only when storage is really unavailable; `balance.save.loadTimeoutMs` (F5).
- [human] 5.9 signal form (DESIGN-GAP 43 revision), 5.10 copy acceptance (`pl.saveUnavailable`, `pl.settings.save*`).
- Follow-ups with `Trigger:` in `follow-ups/review-fixes.md`; DESIGN-GAP 43 and 45 in `docs/design-gaps.md`.

## 6. Autonomous decisions

- Reviewed the diff directly instead of dispatching the skill's two subagents: the source diff is ~500 lines in 13 files, all read in full here. Would change if: the diff were large enough that the main context could not hold it.
- F1 (S-11 F4) fixed rather than re-filed: its own trigger fired in this change and the fix is 6 test lines. Would change if: the guard test needed production changes.
- F4 (redundant orphan `.catch`) accepted, not removed: harmless, guards a refactor that drops `read` from the race. Would change if: the comment in `loadSave` claimed the `.catch` were the only protection.
- Teacher read passed for all new strings; ticked 4.4 and 5.6. Would change if: the [human] 5.10 acceptance rejects a wording.
- Playwright was invoked twice (the second only to read the launch error from the same sandbox failure); both died at `browserType.launch`, sandbox not disabled.
