# Handoff — `save-reason-and-recovery` (slice fix, non-roadmap)

The `/10x-plan-review` step of run `2026-10-14-save-s13b-s15-s14b` wrote this file. Verdict PROCEED (0 critical, 2 warnings fixed in `plan.md`, 2 observations recorded); `change.md` is `plan_reviewed`. No product code changed.

The next agent must not get this wrong: phase 1 is `tdd` and must stay invisible in the browser — `main.ts` starts passing `loadReason` only in phase 3, and `UIScene` keeps calling `saver.replace(state)` without `force` until phase 4; `tests/deviceSaveWiring.test.ts` (literal `saver.status().blockedBy`) changes in phase 1 together with the `deviceSaveView` signature.

## 1. State

| | |
|---|---|
| Branch | `feat/save-reason-and-recovery`, cut from `main` at `16a0abd` |
| Commits | 4 (`…: change identity (autonomous run)`, `…: research`, `…: plan`, `docs(save-reason-and-recovery): plan review`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 38 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-reason-and-recovery/reviews/plan-review.md` | Plan review (SOUND, F1–F4), ends with `VERDICT: PROCEED` |
| `context/changes/save-reason-and-recovery/plan.md` | F1: new triggers for S12-03/S12-05/S12-11 (phase 5 §4); F2: `siteDataAdvice` scope (phase 4 Contract) and p6b expectation (phase 6); F3/F4 in `## Known risks`. Phases, drivers and Progress unchanged |
| `context/changes/save-reason-and-recovery/change.md` | `status: planned → plan_reviewed` |
| `context/changes/save-reason-and-recovery/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-reason-and-recovery` |
| `ls -l` of 18 planned paths | all exist |
| Code reading (symbols) | `Autosaver.replace` (refuses `fatal`/`unavailable`, `Busy` first, failures counted), `AutosaveStatus.replace`, `saveHealth.ts` `stateOf`, `saveHealthView.ts` `pl.settings.saveOff[view.cause]`, `deviceSaveView` callers (only `UIScene.openImport`/`openReset`, `tests/saveFile.test.ts`), dialogs `blockedStep`/`stepOne`/`stepTwo` + `reload()` after ok, `e2eHook.ts` `E2E_SAVE_SEAMS`/`e2eSaveStore` (v99), `main.ts` `start` (`detail` only for `unreadable`), `TaskScene.freshRound` (`missingIds`, `blocked`) — all match the plan |
| e2e seam audit | `?e2eSave=unreadable` used by `save-restart.spec.ts` FR-021 (card only, unaffected) and `save-transfer-blocked.spec.ts` "warns" (moved to `corrupt` in phase 3); `unavailable`/`hang` specs stay green per phase (see review "Checks") |
| Progress↔Phase consistency | 6 phases, 38 rows, criteria map 1:1, one `## Progress` at the end |
| lint / typecheck / tests / build / e2e | Not run: docs-only step. Contract baseline (unit 1905, e2e 52 at `16a0abd`) inherited, unverified |

## 4. Next command

/10x-tdd save-reason-and-recovery phase 1

## 5. Open

- **Phases:**
  1. tdd: `replaceGate` and `loadReason`/`loadError` in the status, `deviceSaveView` per cause with `forceable`, SIR-05 log.
  2. tdd: `stateOf` with `cause` and `code`, the code line in "Zapis gry", `detail` on the `unavailable` card.
  3. impl: `main.ts` passes `loadReason`, texts per cause in the dialogs, the `corrupt` seam, the "warns" test moved to it.
  4. impl: "Zastąp mimo to", `force`, `siteDataAdvice`, `resetFailed`.
  5. impl: `exportNotDevice`, `tests/freshRoundWiring.test.ts`, seam sweep, follow-ups, `CLAUDE.md`.
  6. e2e (risk #2): +4 tests in `save-transfer-blocked.spec.ts`, plus extended asserts in `save-restart.spec.ts` C-1/M-S4; request-file protocol.
- **Human checklist** (`[human]` rows):
  - 3.7: SIR-01 refusal, decided where the PRD is silent.
  - 4.7: forced overwrite of an unread save, which reverses part of the earlier 6.7.
  - 4.8: check the `siteDataAdvice` wording on an iPad and on Android.
  - 5.8: N-7 iPad measurement of a cold IndexedDB `timeout`.
- **DESIGN-GAP rows to add:** 69 ("Zapis gry" cause and code), 70 (lines per cause), 71 (way out of a permanent `unavailable`), 72 (export warning). Each gets a comment in the code.
- **Follow-ups** go to `follow-ups/review-fixes.md` in phase 5 (list in plan phase 5 §4): S12-02, S12-03, S12-05, S12-07..09, S12-11..15, ASL-02..09, the `timeout` card body, the start counter. Each gets a new trigger.
- **Plan-review fixes the implementers must follow:** F1 (phase 5 §4: S12-03, S12-05, S12-11 get the NEW triggers written there, not „the next change to …”); F2 (phase 4: `siteDataAdvice` only for a store error, `Busy`/`Blocked`/`InvalidSave` → `applyFailed`/`resetFailed`; phase 6 p6b expects `resetFailed` + no reload). F3/F4 in plan `## Known risks`.
- **Watch for:**
  - Phase 1 changes the `deviceSaveView` signature, so `tests/deviceSaveWiring.test.ts` (literal `saver.status().blockedBy`) must change in the same phase.
  - `pl.saveTransfer.deviceUnavailable` stays the key for the `unavailable` cause. Its text changes in phase 4, and the specs reference the key.

## 6. Autonomous decisions

1. **SIR-01: refuse `future` in core and in the dialog, with no `force` path.**
   - Rejected: a warning that still allows the overwrite.
   - Why: the save is healthy and recoverable by an update; the PRD guardrail and FR-021 favour keeping it. Recorded as `[human]` 3.7.
   - What would change it: the maintainer allowing a deliberate discard of a newer save. Then `replaceGate` would accept `force` for `future`.
2. **SIR-02: option A (second confirmation), with `timeout` excluded, plus `siteDataAdvice` when the forced write fails.**
   - Rejected: a `localStorage` start counter, an in-app `deleteDatabase`, text only.
   - Why: the exit is reachable on the first start and works in the audit case. Recorded as `[human]` 4.7.
   - What would change it: N-7 showing frequent permanent `timeout`. Then a counter, or a second read with a longer limit, is needed.
3. **One pure `replaceGate` shared by `replace` and `deviceSaveView.forceable`, guarded by a lockstep test.**
   - Rejected: two hand-synced conditions.
   - What would change it: nothing.
4. **`loadError` as an immutable status field; `timeout` decisions read it, not `lastError`.**
   - Why: a failed forced write changes `lastError`.
   - What would change it: nothing.
5. **SIR-04: a dialog line, not an envelope mark.**
   - Why: a mark in the envelope is invisible to the parent.
   - What would change it: an import summary that shows the envelope.
6. **Cheap extras taken: SIR-05, SIR-06, S12-06.** S12-03, S12-11 and S12-02 left as follow-ups.
   - What would change it: plan-review judging a phase too big.
7. **ASL-01 as an AST test with driver `impl`, not `tdd`, because the implementation exists.**
   - Rejected: e2e, because it is probabilistic and `?e2eSkills` bypasses the path.
8. **The `corrupt` seam and the spec move go in phase 3, the phase that changes `unreadable` behaviour.** New e2e tests come after the seam sweep, in phase 6.
9. **No `AskUserQuestion`** (contract rule 1).
   - Complexity: MEDIUM.
   - Every product question was answered from research recommendations or `change.md`.
   - No `plan-brief` deviation.
   - `lessons.md` is absent, so no lesson was applied.

### Plan-review step

10. **Triage done in place (no AskUserQuestion), verdict PROCEED.** F1 and F2 fixed in `plan.md` (single obvious fix each); F3, F4 accepted into `## Known risks`. Rejected: overturning the `future` refusal or the forced `unavailable` overwrite — both fit the contract's SIR-01/SIR-02 scope and the PRD guardrail, and `[human]` rows 3.7 and 4.7 already name them. What would change it: the maintainer rejecting either `[human]` decision.
11. **S12-03/S12-05/S12-11 stay deferred, with new triggers** instead of being pulled into phases 1–2: each is unreachable or masked today (reload after replace; `off` while blocked; `broken` needs an invalid in-memory session). What would change it: a replace path without reload, or S-15 v2 routing a migration through `replace`.
12. **`siteDataAdvice` limited to store errors.** Rejected: any non-ok forced result. Why: the advice destroys the save; `Busy`/`Blocked`/`InvalidSave` are not storage failures. What would change it: nothing short of a new `ReplaceResult` error kind.
13. **Review without a sub-agent** (skill step 3): the risky claims were a handful of local symbols, checked directly. No `lessons.md` exists, so none applied.
