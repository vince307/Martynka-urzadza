# Handoff — `fox-guide` (slice fix:fox-guide)

Written by step `/10x-impl-review fox-guide` of run 2026-10-23-fox-guide: full-plan review APPROVED, 0 critical, 0 warnings, 4 observations, `MERGE: CLEAR`; change.md is `impl_reviewed`. The next agent must not tick the [visual]/[human] rows without real screenshots or the maintainer's word.

## 1. State

| | |
|---|---|
| Branch | `feat/fox-guide`, cut from `main` at `1962312` |
| Commits | phases 1-5 `e392442`, `2d99dcf`, `953ed88`, `4d590fd`, `d228146`, handoff commits, plus this review commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| Progress rows open | 5 (`grep -c '^- \[ \]' plan.md`): 3.5, 4.5 [visual]; 4.6, 4.7 [human]; 4.8 [reviewer] (CI at ship) |
| Working tree | clean after the review commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/fox-guide/reviews/impl-review.md` | full-plan review (phases 1-5), evidence, F1-F4 observations, ends `MERGE: CLEAR — …` |
| `context/changes/fox-guide/plan.md` | row 4.4 ticked with the measured numbers |
| `context/changes/fox-guide/change.md` | `status: impl_reviewed` |
| `context/changes/fox-guide/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/fox-guide` |
| lint, typecheck | OK |
| `npm test` | 3891 passed = baseline 3781 + 110 (109 in `guide`, `guideLayout`, `guideWiring`, `bootBudget` tests + 1 `reducedMotionWiring` case) |
| deploy/ops script tests, `sample` E1-E6 | OK |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --list` | 155 = baseline 150 + 5 (p5 spec) |
| `npx playwright test --workers=3` | 140 passed, 13 failed, 2 did not run (load); `--last-failed --workers=1`: 15 passed → 155 / 155 |
| break: `guidePose` retype → idle | `tests/guide.test.ts` retype row red; restored |
| break: `GUIDE.anchor.x` 1700 | 16 of 88 `guideLayout` cases red; restored |
| break (e2e): drop `textures.exists` in `GuideFox.show` | `#11 no fox without its art` red (Expected false, Received true); restored, `dist/` rebuilt |
| scope | `SAVE_VERSION` 4; no diff in save/migrations/fixtures/storage/pl.ts/curriculum/generators; balance.ts only the `loader` comment; `.claude/settings.json` and hooks untouched, no `--no-verify` |

## 4. Next command

`visual gate (rows 3.5, 4.5) — then /10x-archive fox-guide`

## 5. Open

- [visual] 3.5 and 4.5 (`plan.md` Phase 3/4 Manual): hook build on 4399, desktop 1440 and tablet 1024, the state matrix of 4.5.
- [human] 4.6 accept the fox's place and size (`GUIDE` in `src/data/layout.ts`; fallback anchor x 1802, follow-up F5); 4.7 real tablet sharpness, pop and the cheer on a 0-star summary.
- [reviewer] (CI at ship) 4.8: workflow `CI`, job `check`; proof lines `Tests  <N> passed` (`npm test`) and `e2e hook: absent (` (`npm run build`).
- Observations F1-F4 in `reviews/impl-review.md` (tap test lands on an empty margin; plan payload numbers drifted to the measured 47.6 s, `tests/bootBudget.test.ts` leaves ~0.4 s spare; `modeWidgets` follow-up left open; `GuideFox.snapshot` `rect` is static). Follow-ups F1-F7 in `follow-ups/review-fixes.md`, unchanged.
- DESIGN-GAP 165-168 in `docs/design-gaps.md` (written in p3).

## 6. Autonomous decisions

- Triage choice "Done" (no interactive triage): no critical or warning finding, so nothing to fix; observations recorded with `Decision: RECORDED`. Would change: a finding of WARNING or above.
- Row 4.4 ticked by this step on its own run (unit 3781 + 110, e2e 150 + 5), as the step prompt allowed. Would change: a red rerun.
- e2e parallel failures judged as load: all 15 passed serially with no code change. Would change: a failure that repeats serially.
