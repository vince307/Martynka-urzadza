# Handoff — `art-stand-in-and-load-signal` (slice fix, non-roadmap)

Written by the `/10x-new` step of run `2026-10-14-fix-art-stand-in`. The change folder and `change.md` (identity, audit
claims checked against the repo, design binding, no migration, triggered follow-ups, 8 autonomous decisions) exist; no
code changed. The next agent must not treat the stand-in label as the whole fix: S14-01 also prefers skipping
art-dependent skills whose textures are missing (decision 2), and `MONEY` has no `label` field (use `formatMoney`).

## 1. State

| | |
|---|---|
| Branch | `feat/art-stand-in-and-load-signal`, cut from `main` at `1812347` |
| Commits | 1 on top of `1812347`: `docs(art-stand-in-and-load-signal): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| Progress rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/art-stand-in-and-load-signal/change.md` | Change identity: sources (audit 2026-10-14_0445 findings S14-01, S14-02, S14-03, S14-04, S14-11, S12-01; flaky `tests/spoken.test.ts`), deferred findings with reasons, audit-claim table, design binding (DESIGN-GAP 66 revision, new gap rows), no migration, triggered follow-ups, autonomous decisions |
| `context/changes/art-stand-in-and-load-signal/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-stand-in-and-load-signal` |
| Code reading of `src/ui/widgets/ArtImage.ts` `show`, `src/scenes/BootScene.ts` `preload`/`create`, `src/data/measures.ts` (`MONEY`, `JUGS`, `WEIGHTS`, `ICONS`), `src/core/autosave.ts` `replace`, `src/scenes/UIScene.ts` `openImport`/`openReset`, `tests/spoken.test.ts`, commit `cd42b4a` | every in-scope audit claim confirmed; corrections recorded in `change.md` "Audit claims vs repo now" |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline in the run contract, inherited, unverified here) |

No deliberate break: no test written in this step.

## 4. Next command

`/10x-research art-stand-in-and-load-signal`

## 5. Open

- Research must confirm Phaser 4.2.1 behaviour on a decode failure (`node_modules/phaser/src/loader/File.js` `onProcessError`): does `textures.exists(key)` stay false (decision 4)?
- Which task types carry the answer only in the art (MONEY_COUNT, MONEY_CHANGE, CAPACITY, MASS) vs remain solvable with boxes (COUNT, MULT_GROUPS, TEMPERATURE); whether skipping them can empty a step in `src/core/curriculum.ts` `buildAdaptiveRound` / `src/core/placement.ts` `buildWarmup` (decision 2).
- S12-01 shape: refuse vs warn-and-allow per `blockedBy` in `src/core/autosave.ts` `replace` and the dialogs `openSaveImportDialog` / `openSaveResetDialog` (decision 5).
- Timings of every `forEachTask` test in `tests/spoken.test.ts` (decision 6).
- DESIGN-GAPs to write in `docs/design-gaps.md`: revise row 66; new row for the art-health line in the parent panel; new row (or rev. of 48/49) for "Teraz" when the device save was not read.
- Follow-ups to close in this change: art-tasks-all-stages `BootScene.preload` `loaderror`; save-export-import-reset "Import or reset over an unreadable save (impl-review F1)". Deferred findings (S14-05..S14-10, S14-12, S12-02..S12-15, S13-*) go to this change's `follow-ups/review-fixes.md` with `Trigger:` lines (plan/ship).

## 6. Autonomous decisions

The 10x-new skill would suggest `/10x-plan` and waits for no input; the run fixes `/10x-research` as next step.
Decisions 1-8 are recorded in full (chosen, rejected, why, what would change the answer) in `change.md`
"## Autonomous decisions". Summary:

1. Scope = the six findings + the `spoken.test.ts` timeout + two open follow-ups; rest deferred. Would change: research shows S14-08 is a few lines in a rewritten handler.
2. S14-01 both layers: Polish stand-in label always, plus skipping art-dependent skills with missing textures (plan picks the final form). Would change: skipping can empty a step.
3. Label source is data (`formatMoney`, `JUGS[].label`, `WEIGHTS[].label`, `ICONS[].noun`), one key→label table beside `TASK_ART`, never the file id. Would change: teacher read rejects bare amounts on a box.
4. One runtime art-health record from `textures.exists` after load (covers S14-04), shown as a parent-panel line like `saveHealthView`; never saved, never shown to the child. Would change: Phaser registers a placeholder texture under the failed key.
5. S12-01: dialogs read `blockedBy`, never show the fresh session as "Teraz"; refuse or warn per reason (plan picks); no re-read of the store. Would change: N-7 measurement shows frequent `timeout` on a healthy store.
6. Raise per-test timeouts on slow `forEachTask` tests, like `cd42b4a`; no global `testTimeout`. Would change: only one test is near the limit.
7. E2E seam `?e2eArt=missing` (hook build only, marker in `vite/e2eHookGuard.mjs`). Would change: `page.route` can fail the requests without a seam.
8. Next step `/10x-research` (fixed by the run).
