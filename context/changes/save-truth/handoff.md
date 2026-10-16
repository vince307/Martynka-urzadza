# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-new` step. The change identity exists with every slice-2 finding re-verified against `24b3e4b`;
nothing is researched or planned yet. The next agent must not change the save format (stays v4) and must keep the
2026-10-15_2217 meaning of `P-1` (retry after migration), not the 09:15 service-worker P-1 (slice 3).

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` (checked: `git branch --show-current`) |
| Commits | 1 on the branch: `docs(save-truth): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/save-truth/change.md` | change identity: source, save-format verdict, state outside the save, re-verified findings table (35 ids), pl.ts strings expected, design-kit binding, follow-ups with triggers in this area, deferred LOWs, autonomous decisions |
| `context/changes/save-truth/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/save-truth` |
| re-read of the code each finding names (`src/core/autosave.ts`, `src/core/save.ts`, `src/core/saveHealth.ts`, `src/core/saveFile.ts`, `src/storage/idb.ts`, `src/main.ts` `start`, `src/scenes/UIScene.ts` `openExport`/`openImport`/`openReset`, `src/scenes/TaskScene.ts` `freshRound`, `src/ui/dom/save*.ts`, `tests/fixtures/`) | every slice-2 id still open; none fixed or obsolete |
| `git diff --stat 9b7fe37 24b3e4b -- src` | slice 1 touched no save-area file except `UIScene.openSettings` and task strings in `pl.ts` |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main inherited, unverified: unit 3416 passed, e2e 127 passed) |

## 4. Next command

`/10x-research save-truth`

## 5. Open

- Scope: 15 MEDIUM + 12 LOW in, 7 LOW deferred (S12-03, S12-11, S12-13, SRR-07, SRR-13, SV2-13, SV2-15), 0 dropped —
  table and triggers in `change.md`.
- Research questions: BroadcastChannel availability in iPadOS standalone PWAs and Safari (T-2, feature-detect);
  `idb-keyval` `update` (or one readwrite transaction) for a write-once `backup-v<N>` (FU-3/P-8) and the
  `profile:default:backup-status` record (SVB-01); whether `localStorage` is still writable when IndexedDB is refused
  (decides SRR-08, see `change.md` decision 3); an e2e seam for a late *error* after "Poczekaj dłużej" (SVB-02); how
  `withTimeLimit` can observe a late settlement without un-abandoning the write (SVB-03); which existing
  `?e2eSave=` seams cover SVB-04 and T-2.
- New DESIGN-GAP rows expected from **126** in `docs/design-gaps.md` for every new parent-facing line (list in
  `change.md` § New `src/data/pl.ts` strings).
- Conditional follow-ups to decide in the plan: V-6/V-7 and impl-review F3/F4 (copy accounting in `attempt`/`replace`),
  visual V2 (focus during a busy dialog write), O2 (reset dialog colon), `isRecord` fourth copy.

## 6. Autonomous decisions

See `change.md` § Autonomous decisions (7 items): research before plan (step prompt); seven LOWs deferred with triggers
(reversal: a deferred item falls out of a MEDIUM fix for free); SRR-08 as a `localStorage` counter (reversal:
`localStorage` blocked together with IndexedDB → wording change instead); T-1 detection only (step prompt); no v5
(reversal: a step needing a new save field → defer it with a v5 trigger); `P-1` = the 2217 id; SRR-01/SRR-09 kept
although latent (scope lists them MEDIUM). Also here: the skill's clipboard hand-off was skipped (unattended run; the
next command is §4).
