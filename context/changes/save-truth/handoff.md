# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-plan-review` step. The plan is reviewed (verdict PROCEED, SOUND after fixes) and ready for phase 1
(`Driver: tdd`). The next agent must not get two things wrong. First, the save format stays v4 and no `backup-v<N>` key
is ever overwritten or deleted. Second, after review F1 the T-3 rule is a renamed refusal (`PreviousPageSave`), never a
put: a late write of the previous page is never overwritten.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` (checked: `git branch --show-current`) |
| Commits | 4 on the branch: change identity, research, plan, and `docs(save-truth): plan review` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 82 (`grep -c '^- \[ \]' plan.md`), none done |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/save-truth/reviews/plan-review.md` | the review: 1 critical, 2 warnings, 3 observations, triage table, ends with `VERDICT: PROCEED — …` |
| `context/changes/save-truth/plan.md` | edited by triage: F1 (Desired End State, Phase 7 §2/§4/break, Progress 7.2, Phase 8 §2–§4, decision 10), F2 (Phase 4 §2/§4, Phase 5 §1/§3, Phase 6 §2, Known risks), F3 (Phase 9 §1), F5 (Phase 13 §4 follow-up list), F4/F6 (Known risks) |
| `context/changes/save-truth/change.md` | `status: planned → plan_reviewed` |
| `context/changes/save-truth/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/save-truth` |
| `ls` of 8 test/spec paths the plan edits + 5 e2e specs it names | all present |
| grep of `writeVerdict`, `OTHER_WRITER_SAVE`, `NEWER_SAVE`, `replaceGate`, `attempt`/`giveUpCopy`, `replace` copy branch, `skipBackup`, `E2E_SAVE_SEAMS` (`corrupt` is a v1 shape), `deviceStorage` | all match the plan's description |
| the five reversed test titles named in the plan | exist verbatim (`tests/autosave.test.ts`, `tests/saveFile.test.ts`, `save-transfer-blocked.spec.ts`, `save-backup-health.spec.ts`) |
| awk count of Success Criteria bullets vs Progress rows per phase | 15/15 equal; 82 rows; one `## Progress`; 15 `Driver:` lines |
| `REGISTRY_KEYS` in `src/main.ts` | only `saver` is set (no store) → review F3 |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed. Baseline inherited, unverified: unit 3416 passed, e2e 127 passed |

## 4. Next command

`/10x-tdd save-truth`

## 5. Open

- **Deliberate reversals the plan names** (any other red is a regression):
  - phase 2: `tests/autosave.test.ts` "a %s save is still replaced (the way out)", `tests/saveFile.test.ts` "an unreadable (%s) save is named, never summarised (overwriting stays allowed)";
  - phase 3: `save-transfer-blocked.spec.ts` "#2 an unavailable save is not overwritten…" and "#2 SIR-02 a save the browser never gives can be replaced after a second confirmation";
  - phase 5: `tests/autosave.test.ts` "after a failed copy the page-hide flush writes v2 without trying the copy again" and "the third failed copy in a session … (SV2-01)", plus `save-backup-health.spec.ts` "#2 SV2-01 …" only if it asserts the op order;
  - phase 10: `save-restart.spec.ts` and `save-transfer.spec.ts` assertions on `exportOutcome.downloaded`;
  - phase 11: `save-backup-health.spec.ts` "#2 SV2-02 …" (`resetFailed` → `replaceUnconfirmed`).
- **Review fixes the implementers must follow** (plan.md is the source):
  - phase 7: `writeVerdict` refuses an ended writer with `generation > base` as `PREVIOUS_PAGE_SAVE` (never a put); `autosave.ts` maps it to `blockedBy 'otherTab'`;
  - phase 8: `channelVerdict(msg, { writer, base })` without the ended exception; `onBlocked(reason, error)` feeds the card's `Kod:`;
  - phase 4: `backup` writes the `kept` record in both branches;
  - phase 5: `noteBackup(lost|uncertain)` before the first write that leaves the copy owed (hidden, cap, `replace` give-up), time-limited and non-blocking;
  - phase 6: `migrationOf` prefers the live status in the migrating session, the record on later launches;
  - phase 9: `Autosaver.readBackups()` pass-through, no new registry key.
- **Seams**: phase 1 turns the `corrupt` seam in `src/testing/e2eHook.ts` `e2eSaveStore` into a v4-shaped corrupt save; phase 13 adds `slowfail` to `E2E_SAVE_SEAMS` (marker `e2eSave` covers it, must stay absent from `dist/`).
- **DESIGN-GAP rows 126–138** in phase order (plan decision 14).
- **`[human]` rows** (post-run checklist): 3.8 SRR-08 force from the second start + gap 126 wording; 4.6 write-once keeps the FIRST old copy (reverses `stale-tab-and-health`); 11.6 wording of gaps 127–136; 14.4 two tabs on a tablet; 15.4 the old-copy file on a tablet.
- **Follow-ups**: phase 13 writes `context/changes/save-truth/follow-ups/review-fixes.md` with a `Trigger:` line per item in phase 13 §4 (now including SV2-08/M-S1, Escape during `replace`, `isRecord` watch, T-1 prevention).
- **Unverified platform facts** (feature-detected / best-effort): BroadcastChannel inside an iPadOS home-screen app; Safari version for `IDBObjectStore.count`.

## 6. Autonomous decisions

1. **F1 fixed by keeping the refusal and renaming it, not by a put.** Rejected: the plan's "ended writer → put" (silently overwrites the previous page's late write, which this page never read) and a store re-read + merge (new design, out of scope). Why: the audit's T-3 direction is "distinguish in the log", and the existing card ("zachowa najnowsze postępy") is already true for a reload race. Would change: a maintainer decision that a reload must never show the card even at the cost of the last flush, or a merge-on-write design.
2. **F2 fixed in plan** (record before the write that leaves the copy owed) rather than carried. Why: the plan's own Known risks claimed "recorded as lost", and SVB-01 is exactly the across-launch line. Would change: evidence that a tiny IDB record put before the write slows the hidden flush enough to lose the write (then note after the write instead).
3. **F4 and F6 accepted as Known risks**, not fixed: F4 is bounded by the copy retry; F6 is pre-existing and detection-only is fixed by change.md decision 4. Would change: a report of a lost copy due to the record, or the maintainer asking for T-1 prevention.
4. **No sub-agent for code verification**: the riskiest claims (writer verdict, copy branches, registry, seams, test titles) were checked directly by grep/sed; recorded in the review's Mode line. Would change: nothing for this step.
5. **Drivers unchanged**: every `Driver:` line was checked against the contract rule; none was wrong. Would change: a phase finding its implementation already present (then `tdd → impl` per contract rule 6).
6. **Skill's interactive menus decided in place**: "Save report + triage now", every finding triaged by the reviewer (Fixed/Accepted as in the review's triage table).
