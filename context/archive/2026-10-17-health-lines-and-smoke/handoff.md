# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the visual-gate step of run `2026-10-16-audit-sweep`; the ship step (archive + ship) stamped the final pre-merge state. All six [visual] rows are captured and ticked: `VISUAL: PASS` in `reviews/visual-review.md`. The gate found and fixed one real defect, VG-1: the pictures the boot limit cut were reported as `network`. The fix is in commit `fix(health-lines-and-smoke): …`, and change.md status stays `impl_reviewed`. Do not get wrong: the save format stays v4, and rows 1.7 and 11.7 are proved by CI at ship. The CLAUDE.md paragraph still points into `context/changes/`, so re-point it after the archive.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | everything up to `d090f0b` (impl review), then the visual gate: `fix(health-lines-and-smoke): przyczyna „cut” dla obrazków uciętych limitem startu (VG-1)` 91671a4 and `docs(health-lines-and-smoke): bramka wizualna` c75033f, then the ship step: this handoff, `chore(archive): close health-lines-and-smoke` and the CLAUDE.md re-point |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-16-audit-sweep/run-log.md |
| `change.md` status | `archived` (set by `/10x-archive` in the ship step); non-roadmap change, no roadmap row to close |
| `## Progress` rows remaining | 6 open: [reviewer] (CI at ship) 1.7 and 11.7; [human] 2.6, 4.6, 8.6, 11.8 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/scenes/loaderCut.ts` | new `pendingKeys(load)`, which `cutLoad` also uses for its key list (VG-1) |
| `src/scenes/BootScene.ts` | `preload`: the cut timer records `this.cut = pendingKeys(this.load)` BEFORE `cutLoad`. Failing the last file runs `create()` synchronously inside `cutLoad`, and `create()` reads `this.cut` for `artCauses`. |
| `tests/loaderCut.test.ts` | `describe('pendingKeys')`, 2 cases |
| `tests/e2e/load-and-tab-guard.spec.ts` | "#14 B-4 a cut start says some pictures did not finish" also asserts no `artCause.network`, no `artRestart`, and `Kod: cut` |
| `context/changes/health-lines-and-smoke/reviews/visual-review.md` | verdict per row, hand-checked values, VG-1, decisions, `VISUAL: PASS` line |
| `context/changes/health-lines-and-smoke/screenshots/` | 26 JPEG frames (13 states × desktop 1440×900 / tablet 1024×768) + `README.md` (route, temporary seam, frame table) |
| `context/changes/health-lines-and-smoke/plan.md` | [visual] rows 2.5, 5.5, 6.5, 7.5, 8.5, 10.6 ticked |
| `context/changes/health-lines-and-smoke/follow-ups/review-fixes.md` | follow-ups 20 (the "rysuje: zeszyt" wording while the book icon shows) and 21 (`decode` under `vite preview` for `?e2eArt=ui`), each with a `Trigger:` |

## 3. Verification

| command | result |
|---|---|
| Visual capture (throwaway Playwright spec, hook build on 4399) | 22/22 runs green (11 states × 2 widths), plus the 2 re-shot sound states × 2. Frames were read by eye and the section texts were read from the DOM; both widths gave identical text. |
| Hand check | Folders 15 + 11 + 15 = 41 = "41 z 41" (from `TASK_ART`). Cut set 15 + 38 + 3 + 12 + 1 = 69 = "Boot load cut … 69 files". |
| VG-1 red | `npx playwright test … load-and-tab-guard.spec.ts -g "B-4"` on the unfixed code: RED by assertion, `toHaveCount(0)` on `artCause.network`, received 1 |
| VG-1 green | `load-and-tab-guard`, `final-sound-failure`, `final-art-loading`: 9/9 passed after the fix. The console now shows "Task art causes: …=cut". |
| meta-check | The break is the pre-fix code itself: `this.cut` assigned after `cutLoad`. The assertion reads the parent's panel, so it proves the cause reaching the line, not just the record. `pendingKeys` unit cases prove it names exactly what `cutLoad` ends. |
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + `sample` E1-E6 | `Tests 3656 passed` = branch 3654 + 2 (contract baseline 3545 + 111); deploy scripts OK; samples OK |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` (full) | 139 passed (11.6 m) = contract baseline 132 + 7, the same count as the impl review (B-4 gained assertions, not a test), no flakes |
| temporary seam | `?vgSwUpdateFailed` was patched into `src/main.ts` for the two `dist-e2e` builds and reverted with `git checkout` right after each. `git diff main...HEAD -- vite/e2eHookGuard.mjs src/main.ts` shows only planned changes. |

## 4. Next command

`none — shipped`

## 5. Open

- [reviewer] (CI at ship):
  - **1.7**: workflow `Deploy`, job `deploy`, step `Smoke check (deploy)`. The log must match `all [0-9]+ checks ok` and contain `precache served: n/n`.
  - **11.7**: workflow `CI`, job `check`. The log must show `e2e hook: absent (2 chunks checked)` and `Tests  3656 passed`.
- [human] rows:
  - 2.6: accept that the update check runs only at launch.
  - 4.6: optional throttled Android cold start.
  - 8.6: real iPad, 3 locked touches → `soundBlocked`.
  - 11.8: wording of gaps 139-150. See follow-up 20 for the notebook icon case.
- Follow-ups 1-21 are in `follow-ups/review-fixes.md`. New in this step:
  - 20: `pl.settings.artFallback` wording vs `UnlockCard`'s icon fallback.
  - 21: `?e2eArt=ui` reads `decode` under `vite preview`.
- Archive note: the CLAUDE.md paragraph points at `context/changes/health-lines-and-smoke/follow-ups/review-fixes.md`. Re-point it to the archive path and run `validate-rule-files.sh` after `/10x-archive`.
- No DESIGN-GAP was added: every line shown is one of gaps 139-150.

## 6. Autonomous decisions

1. **Playwright, not Claude in Chrome.** Every state needs the 2 s gear hold on the canvas, and profile § 8 says Chrome cannot drive it. Would change: a Chrome tool that drives canvas touches.
2. **Temporary seam `?vgSwUpdateFailed`.** It feeds the real reducer `stepSw` an installing worker that goes redundant once the real worker is ready. It was never committed. Rejected: a second `sw.js` build whose install fails, which is heavy and timing-bound. Would change: a committed `?e2eSw=` seam.
3. **VG-1 fixed in the gate, not deferred.** It is a wrong parent-facing line on this slice's own path, the cause is one statement order, and the e2e assertion was red first. Would change: a fix that needed Phaser internals beyond the pinned loader paths.
4. **Wallet and notebook fallbacks in separate sessions.** MONEY_PAY lives in E1/E2 and the unlock road in E4, and the record is runtime only, so it is lost on a reload. Would change: a seam that forces an unlock.
5. **The notebook wording (follow-up 20) was not changed.** Copy is the [human] row 11.8's call. Would change: the maintainer's wording read.
6. **Archived with 6 open rows (ship step).** `/10x-archive` warned: 6 Progress rows open (1.7 and 11.7 are proved by CI at ship, 2.6, 4.6, 8.6, 11.8 are [human]), and many ticked rows carry evidence text instead of a SHA suffix. Chosen: Continue archiving; the [human] rows are the post-run checklist, 11.7 is ticked from the CI log on the branch, 1.7 only by the post-merge Deploy run (the orchestrator ticks it in the run's docs PR). Rejected: Resume implementation (nothing left to implement). Would change: a red CI or a failed Deploy smoke.
