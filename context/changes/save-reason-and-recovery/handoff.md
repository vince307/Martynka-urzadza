# Handoff — `save-reason-and-recovery` (slice fix, non-roadmap)

The `/10x-plan` step of run `2026-10-14-save-s13b-s15-s14b` wrote this file. `plan.md` (6 phases) and `plan-brief.md` exist, and `change.md` is now `planned`. No product code changed.

The next agent must not get this wrong: the e2e seam `?e2eSave=unreadable` is a `future` save (v99). Phase 3 adds the `?e2eSave=corrupt` seam. In the same phase it moves the spec test "#2 an unreadable save warns instead of showing the fresh session" to that seam, so the full e2e suite stays green.

## 1. State

| | |
|---|---|
| Branch | `feat/save-reason-and-recovery`, cut from `main` at `16a0abd` |
| Commits | 3 (`docs(save-reason-and-recovery): change identity (autonomous run)`, `…: research`, `…: plan`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` |
| `## Progress` rows remaining | 38 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-reason-and-recovery/plan.md` | Plan with 6 phases, `## Autonomous decisions` and `## Progress` |
| `context/changes/save-reason-and-recovery/plan-brief.md` | Two-page brief |
| `context/changes/save-reason-and-recovery/change.md` | `status: preparing → planned` (metadata-guard `mark-planned`) |
| `context/changes/save-reason-and-recovery/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-reason-and-recovery` |
| Code reading at `8009d73` | Research claims re-confirmed for these symbols: `autosave.ts` (`replace`, `AutosaveStatus`), `saveFile.ts` `deviceSaveView`, `saveHealth.ts` `stateOf`, `main.ts` `start`, the import/reset/export dialogs, `UIScene` `openExport`/`openImport`/`openReset`, `e2eHook.ts` `e2eSaveStore`, `tests/deviceSaveWiring.test.ts` (literal `saver.status().blockedBy`), `save-transfer-blocked.spec.ts`, `save-restart.spec.ts` C-1/M-S4 |
| `metadata-guard.mjs inspect` / `mark-planned` | `changed: true`, status `planned` |
| Roadmap sync | No item with Change ID `save-reason-and-recovery`, so the roadmap was left untouched (non-roadmap change) |
| Plan structure | 6 `## Phase N:` headings, each with a `Driver:` line and a `Driver why:` line. Success criteria map 1:1 to Progress rows: 38 rows, all `[ ]` |
| lint / typecheck / tests / build / e2e | Not run. This was a docs-only step. The baseline in the contract (unit 1905, e2e 52) is inherited and unverified. |

## 4. Next command

/10x-plan-review save-reason-and-recovery

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
