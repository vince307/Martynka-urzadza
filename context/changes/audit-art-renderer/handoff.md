# Handoff — `audit-art-renderer` (slice fix:audit-art-renderer)

Written by the `/10x-plan-review` step of run 2026-10-25-audit-art-renderer: verdict PROCEED, 0 critical / 4 warnings /
3 observations, all fixed in `plan.md`; no product code changed. The next agent must not forget that the `worn` record lives
in ONE place (`applyWornGrade`, no caller edits) and that the Python guard must leave every byte of `public/` unchanged
(phase 1 re-runs `npm run art`); a skipped `tests/recolourBoard.test.ts` locally is NOT green (compare passed counts).

## 1. State

| | |
|---|---|
| Branch | `feat/audit-art-renderer`, cut from `main` at `c123331` |
| Commits | 4 on the branch: change identity, research, plan, `docs(audit-art-renderer): plan review` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 29 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-art-renderer/reviews/plan-review.md` | plan review report (F1-F7, all FIXED), ends `VERDICT: PROCEED` |
| `context/changes/audit-art-renderer/plan.md` | rows 1.2, 2.2, 3.4 reworded (body + Progress identical); phase 3 renderer log after the `creates > 1` return; phase 4 follow-ups name `Kod:` not muted / L-8 / final-art-salon F3 closed; phase 5 console listener before `goto`; Known risk on local skip; plan-review line in Autonomous decisions |
| `context/changes/audit-art-renderer/change.md` | status `planned` → `plan_reviewed` |
| `context/changes/audit-art-renderer/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/audit-art-renderer` |
| success criteria vs `## Progress` rows (python over `plan.md`) | 29 = 29, identical text, in order |
| `grep -rn "applyWornGrade(" src` (read) | definition in `src/ui/wornGrade.ts`, calls only in `src/ui/widgets/RoomView.ts` (`buildWorn`, `drawRoomMiniature`) |
| `src/ui/artFallbacks.ts` `recordFallback` / `src/core/artPick.ts` `noteFallback` (read) | first-wins, game-wide registry → once per game |
| `playwright.config.ts` (read) | `chromium-hook` `use` has no `launchOptions`; `ROUND_SPEC` regex, file-level `test.use` compatible |
| `scripts/recolour-board.py` (read) | `share = filled.mean()` is 0.0 on an empty mask (basis of F1) |
| lint / typecheck / unit / build / e2e | not run: review only, no code touched (baseline on `main` c123331 inherited, unverified: unit 3936, e2e 164) |

## 4. Next command

`/10x-tdd audit-art-renderer phase 1`

## 5. Open

- Phases and drivers unchanged: 1 `tdd` recolour guard + `tests/recolourBoard.test.ts`; 2 `tdd` `FallbackWhere` `worn`,
  `ArtHealthLine` `worn`, `pl.settings.wornPlain`, `artHealthView.ts` `textOf`; 3 `impl` `applyWornGrade` record +
  `BootScene.create` `console.info` (after the `creates > 1` return) + guards + gap rows 173/174; 4 `impl` docs, follow-ups,
  seam sweep, manual rows; 5 `e2e` `tests/e2e/canvas-renderer.spec.ts` (`ROUND_SPEC`) + WebGL control in `salon-style.spec.ts`.
- Manual-only Progress rows: 4.6 `[human]` wording of `pl.settings.wornPlain`; 4.7 `[human]` pouf under "Wróć do notesu"
  (DESIGN-GAP 174); 4.8 `[human]` `drawRoomMiniature` still drops the boolean; 4.9 `[visual]` Canvas vs WebGL at 1440/1024;
  4.10 `[reviewer] (CI at ship)` job `check`, Python test expected to skip in CI.
- DESIGN-GAPs to add (phase 3): 173, 174. Follow-ups to record (phase 4): see plan phase 4 change 2.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

- R-1 PROCEED, not RETHINK: every risky claim held against the code (one choke point, skip design, Canvas spec fit). Would
  change: a third `applyWornGrade` call site with a scene-less context, or Phaser AUTO no longer falling back to Canvas.
- R-2 Kept the record-in-callee departure from scope item 3's literal text (already a `[human]` row 4.8) instead of
  forcing `drawRoomMiniature` to return the flag. Why: coverage is identical and keeps four unfired follow-ups unfired.
  Would change: the maintainer asking for the returned flag.
- R-3 Fixed all four warnings in place (all obvious, wording/placement only); none moved to Known risks except F7's habit
  note. Would change: a warning needing a design choice.
- R-4 No phase split/merge: each phase is one concern and independently green. Would change: phase 1 needing more than
  one fresh agent (e.g. `npm run art` slower than the step budget).
