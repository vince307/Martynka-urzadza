# Handoff — `save-reason-and-recovery` (slice fix, non-roadmap)

Written by the `/10x-new` step of run `2026-10-14-save-s13b-s15-s14b`. The change identity exists (`change.md`, status
`new`); no code changed. The next agent must not get wrong: the save format stays v1, and the `?e2eSave=unreadable`
seam is a `future` save (version 99), so SIR-01 changes what the existing e2e specs expect.

## 1. State

| | |
|---|---|
| Branch | `feat/save-reason-and-recovery`, cut from `main` at `16a0abd` |
| Commits | 1 (this docs commit) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-reason-and-recovery/change.md` | identity: source (audit 2026-10-14_1110, PR #45: SIR-01..04, ASL-01), scope table, audit-claim verification table, design-gap / copy-key binding, triggered follow-ups, autonomous decisions |
| `context/changes/save-reason-and-recovery/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-reason-and-recovery` |
| Audit claims vs repo (grep/read of `src/core/autosave.ts` `LoadOutcome`/`BlockReason`/`replace`, `src/core/saveFile.ts` `deviceSaveView`, `src/core/save.ts` `decodeSave`, `src/core/saveHealth.ts` `stateOf`, `src/ui/dom/saveHealthView.ts`, `src/main.ts` `start`, `src/scenes/UIScene.ts` `openExport`, `src/scenes/TaskScene.ts` `freshRound`, `src/testing/e2eHook.ts`) | all five in-scope findings confirmed; one extra observation (e2e `unreadable` seam = `future`) |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no source changed |

## 4. Next command

/10x-research save-reason-and-recovery

## 5. Open

- Research questions (change.md decision 6): which e2e specs (`tests/e2e/save-transfer-blocked.spec.ts` and the unreadable-save specs) rely on `?e2eSave=unreadable` allowing import/reset; whether `localStorage` survives when IndexedDB is `unavailable`; the shape of a `freshRound` wiring test (model `tests/deviceSaveWiring.test.ts`).
- Triggered follow-ups to settle in the plan: S12-02..S12-15 list (`context/archive/2026-10-14-art-stand-in-and-load-signal/follow-ups/review-fixes.md`, needs a concrete new trigger — SIR-07), N-7 (text part only), impl-review F1 of S-12 (closed by SIR-01).
- New player/parent copy goes to `src/data/pl.ts` with a DESIGN-GAP row (next free number 69 in `docs/design-gaps.md`).

## 6. Autonomous decisions

1. Scope fixed to SIR-01..04 + ASL-01 (run contract). Rejected: adding ASL-02 and the S12 list. Would change: research showing `stateOf` is rewritten anyway (S12-03 joins).
2. SIR-01 leans to refusing import/reset over a `future` save, final choice in the plan. Rejected: text-only warning. Why: overwriting a healthy newer save is the one irreversible loss. Would change: refusal leaving the parent with no exit (then the SIR-02 exit covers `future` too).
3. Load reason kept as runtime status, format v1 unchanged. Would change: nothing in this change.
4. SIR-02 counter outside the save (injected into `core`) is a candidate; plan picks it or a second confirmation. Would change: `localStorage` unavailable in the same conditions as IndexedDB.
5. Next step `/10x-research` (set by the run), not the skill's default `/10x-plan`. Would change: nothing (run order).
