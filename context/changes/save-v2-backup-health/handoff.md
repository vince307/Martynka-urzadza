# Handoff — `save-v2-backup-health` (slice fix save-v2-backup-health, non-roadmap)

Written by the `/10x-new` step of run `2026-10-15-fix-s14c-s14d`. The change identity exists; nothing is researched or
planned yet. Do not get wrong: SV2-01 is CRITICAL and live on production, and the save format stays v2 — every new
state (backup state, failure stage, timeout-start counter) is runtime or outside the save, fixtures byte-identical.

## 1. State

| | |
|---|---|
| Branch | `feat/save-v2-backup-health`, cut from `main` at `16848c6` |
| Commits | 1 on the branch: `docs(save-v2-backup-health): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-v2-backup-health/change.md` | Change identity: source (observability audit 2026-10-15_0253, PR #52: SV2-01, SV2-02, SV2-03, SRR-02), scope table, audit claim / repo now / correction table, SV2-01 product options A–D, design-kit and copy keys bound (no kit view; DESIGN-GAP rows 43, 45, 46–51, 50, 69–71; next free 94), triggered follow-ups with scope take, `## Autonomous decisions` |
| `context/changes/save-v2-backup-health/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-v2-backup-health` |
| Audit claims checked by reading `src/core/autosave.ts` (`attempt`, `save`, `replace`, `replaceGate`, `status`), `src/core/saveHealth.ts` (`stateOf`, `offState`), `src/core/saveFile.ts` (`deviceSaveView`), `src/storage/idb.ts` (`backup`, `run`), `src/ui/dom/saveHealthView.ts`, `src/ui/dom/saveImportDialog.ts`, `src/ui/dom/saveSummaryView.ts` (`failureText`), `src/main.ts` (`start`), `src/scenes/UIScene.ts` (`openImport`, `openReset`), `src/data/pl.ts` | all four in-scope claims confirmed; one precision (SRR-02: `siteDataAdvice` follows any store-error `replace` failure, not only a forced one) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main at `16848c6`: unit 2445, e2e 77, inherited from the run contract, unverified here) |

## 4. Next command

`/10x-research save-v2-backup-health`

## 5. Open

- SV2-01 policy is open: options A–D in `change.md` § "SV2-01 — decyzja produktowa"; recommendation A (retry with a cap, then write v2 without the copy, named state + code), plan decides N and where failures are counted.
- Research questions: how many write attempts a typical session makes (`src/core/autosave.ts` `save`, `flush` callers in `RoomScene`/`TaskScene`/`main.ts`); whether `localStorage` is usable when IndexedDB hangs (SRR-02 counter); which e2e specs rely on forcing at the first `unavailable` (SRR-08) or on `notYet`; content of S12-07/08/12/13; whether `MIGRATIONS[1]` (`src/core/save.ts`) carries every v1 field (bears on option A).
- Candidates for the plan: SRR-04 (`replace` takes the pending backup), S12-03, SRR-08, SRR-12, impl-review O2 (Escape during `replace`), L-S3 (`visibilitychange` handler in `src/main.ts`).
- New copy will need DESIGN-GAP rows in `docs/design-gaps.md` from 94.
- Out of scope (follow-ups to write later with triggers): SV2-04 unless option B, SV2-08 (`deploy/`, forbidden in the run), SV2-10..13, SV2-15, SRR-01, SRR-07, SRR-09..13, GRD-*, WNA-*.

## 6. Autonomous decisions

- Scope fixed to SV2-01/02/03 + SRR-02 per the contract; cheap neighbours listed as plan candidates. Rejected: taking the audit's whole fix order (SRR-09, SRR-07). Would change: research showing the SV2-01 policy forces a pending backup in `replace` (then SRR-04 is mandatory).
- SV2-01 recommendation A over D (still loses progress), C (changes the read path, fails under quota too) and plain B (extra UI). Would change: a v1 field that `MIGRATIONS[1]` drops or alters.
- Backup failures counted within the session, timeout-start counter outside the save. Would change: sessions with fewer than N attempts, or `localStorage` unavailable alongside a hung IndexedDB.
- Next step `/10x-research` (fixed by the run) instead of the skill's default `/10x-plan`; no clipboard copy (unattended).
- `/10x-new` skill's "next step" display skipped; no AskUserQuestion.
