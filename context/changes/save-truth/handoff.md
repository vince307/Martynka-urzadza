# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-implement save-truth phase 13` step. Phases 1-13 are committed and green (phase 13 = see §1). The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited, only `save-v1-legacy-salon.json` was added), and phases 14-15 are e2e phases driven with `/10x-e2e` (hook build; Chromium may not start in the agent session, then the request-file protocol of the plan applies).

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phases 1-12 as before, phase 13 = `feat(save-truth): Late read error, word round warn, docs and seam sweep (p13)` d7492b3, plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`); set to `implemented` only after phase 15 |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; 13.1-13.5 ticked; 13.6, 13.7 [reviewer] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/autosave.ts` | `lateReadVerdict(late)` -> `'still-slow'` only for `unavailable` with a timeout error, else `'settle'`; `errorName` now re-exported from `save.ts` |
| `src/core/save.ts` | `errorName` (was the private `errorNameOf` here and a copy in `autosave.ts`: one helper now) |
| `src/main.ts` | `slowCard` `onWait` asks `lateReadVerdict`; a non-timeout late error logs `save: late read failed (<name>)` and resolves, so the normal card shows `Kod: <name>`; the slow limits also apply under `slowfail` |
| `src/testing/e2eHook.ts` | seam `?e2eSave=slowfail` (read rejects `UnknownError` after `E2E_SLOW_READ_MS`) in `E2ESaveSeam`/`E2E_SAVE_SEAMS`; guarded by the existing marker `e2eSave` |
| `src/scenes/TaskScene.ts` | `freshRound` warns when `buildWordRound` returns null, before the dice branch |
| `CLAUDE.md` | "Current state": one paragraph "Save truth" (every name checked to exist in `src/`) |
| `context/changes/save-truth/follow-ups/review-fixes.md` | 22 deferred items, each with a `Trigger:` line |
| tests | `autosave.test.ts` (`lateReadVerdict`, 2 cases), `e2eSave.test.ts` (seam list + `slowfail` rejects), `e2eHookGuard.test.ts` (seam list), `freshRoundWiring.test.ts` (warn before dice) |

Seam sweep (phases 1-12): duplicated `errorName`/`errorNameOf` merged (fixed); `isRecord` has three copies (`save.ts`, `saveFile.ts`, `migrations/legacySalon.ts`), none added by this change, kept as a watch follow-up; no stale comments found for the named phrases ("a late success is dropped" is true with the `onLate` observer); gap rows 126-138 each have a matching `DESIGN-GAP` comment in `src/data/pl.ts` / `src/ui/dom/`; new storage keys (`profile:default:backup-status`, `martynka:unavailableStarts`, `martynka:writer`, `backup-v<N>`) are outside `SAVE_KEYS`; `git diff --stat main -- tests/fixtures` shows only `save-v1-legacy-salon.json`.

## 3. Verification

| command | result |
|---|---|
| RED (observed) | the break below; new cases were written with the code in the same step, the verdict case went red under the break |
| Deliberate break | `lateReadVerdict` returned `still-slow` for every `unavailable`: `settles for a read refused with a named error…` red (`expected 'still-slow' to be 'settle'`); restored. Meta-check: proves the verdict only, the card flow is phase 15 |
| `validate-rule-files.sh` | PASS; a broken path in `CLAUDE.md` -> FAIL (missing: 1); restored, PASS |
| `npm test` | 3535 passed (baseline after p12: 3530, +5) |
| lint / typecheck / deploy scripts / sample E1-E6 / build | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | see the Progress row 13.5 (run once after the last code edit) |
| `grep -c '^Trigger:'` follow-ups | 22 entries, 22 triggers |
| stray processes | checked outside the sandbox before the report |

## 4. Next command

`/10x-e2e save-truth phase 14`

## 5. Open

- Rows 13.6, 13.7 [reviewer] not ticked (plus earlier [reviewer]/[visual]/[human] rows: 2.5, 2.6, 3.6-3.8, 4.5, 4.6, 5.4, 6.4, 6.5, 7.4, 7.5, 8.4, 8.5, 9.4, 9.5, 10.4, 10.5, 11.4-11.6, 12.4, 12.5).
- Phase 14 (stale-tab e2e) and 15 (late read error and old-version copy; uses `?e2eSave=slowfail`) remain; both need the hook build.
- `isRecord` still has three copies; the 22 follow-ups are in `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. Driver `impl` as planned; the verdict and the warn were written with their tests in the same step, the break proves the verdict.
2. The warn text names the stage id and the generic reason; `buildWordRound` returns null without telling which cause, so no finer reason is claimed.
3. `slowfail` is covered by the existing `e2eSave` marker; no new marker added (the build guard line still says absent).
4. Merged the two `errorName` copies by moving the function into `save.ts` (no cycle: `autosave.ts` already imports `save.ts`) and re-exporting it from `autosave.ts`, so importers did not change.
5. The follow-up list adds the item "pending reviewer/visual/human rows" so the ship step sees them; "Safari floor" entry says `count` was chosen over `getKey`.
6. Commit message and next-phase prompts decided in place; the run stops after this phase.
