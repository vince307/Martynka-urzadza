# Handoff — `first-launch-placement` (slice S-06)

Written by the finishing agent of `/10x-e2e` phase 9, the LAST phase. All nine phases are committed; change.md status is `implemented`. The next step is `/10x-impl-review`; open rows tagged [reviewer]/[visual]/[human] are not the implementer's.

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | plan-review commits + p1 `d79ba20` + p2 `403644c` + p3 `e4920f3` + p4 `a51338d` + p5 `012867b` + p6 `96674ca` + p7 `22db90d` + p8 `26f0787` + p9 `3320b20` + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (reviewer / visual / human rows only) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/first-launch.spec.ts` | 6 tests of risk #12 (proposed): 3 child path (p8) + 3 parent path (p9: wrong gate answer twice then override to E4, confirm proposal with warm-up, input blocked under the gate) |
| `context/changes/first-launch-placement/follow-ups/review-fixes.md` | follow-ups with `Trigger:` (risk #12 text for test-plan refresh, installHint touch leak, S-11, S-08, S-14, etc.) |
| `docs/design-gaps.md` | rows 15-21 |
| `plan.md` | rows 9.1-9.3 ticked citing the orchestrator run |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | clean |
| `npm test` | 53 files, 765 tests passed (production unchanged in p9) |
| `npm run build` | ok, `e2e hook: absent (2 chunks checked)` |
| orchestrator `npx playwright test tests/e2e/first-launch.spec.ts` / full | 6 passed / 14 passed (baseline 11 + 3) |
| deliberate break (`e2e-break-s06-p9.patch`, `WelcomeScene.openParent` without `this.input.enabled = false`) | red at first-launch.spec.ts:286 `expect(blocked.learner).toBeNull()`, Received {"age": 8, "stage": "E3", ...}; reverted; unit stays green |

Review against e2e-quality-rules: no waitForTimeout, web-first assertions and polls, getByRole dialogs/buttons, titles carry `#12 (proposed)`, tests independent, answer read from dialog text like an adult (hook never exposes it), no lockout asserted; no defect. Minor: one `!` non-null assertion after an `expect(...).not.toBeNull()`, lint clean. The test does not compare new vs old gate problem text (1/49 flake avoided).

## 4. Next command

`/10x-impl-review first-launch-placement`

## 5. Open

- Open rows: `[reviewer]` 1.4, 2.5, 4.6, 5.5, 7.4; `[visual]` 4.7, 5.6, 6.4; `[human]` 5.7, 6.5, 7.5-7.9.
- Risk #12 is only proposed in the follow-ups; the spec cites `#12` in titles.

## 6. Autonomous decisions

1. Bare numbers: only the three named in the S-05 follow-up were tokenised; the other house-icon coordinates in `RoomSwitchButton.draw` are icon geometry in a 56 px box and stay.
2. Gap rows 20 (no welcome art) and 21 (picture mode) added as the plan lists them; row 21 points at `src/data/placement.ts`, which has no code comment, so no `DESIGN-GAP` comment was added there.
3. AGENTS.md kept under 400 words by trimming one sentence and shortening another instead of dropping the scenes update.
4. Phase 8: E2 drop uses 3 wrong first tries (balance.warmup.minFirstTry = 4 of 6); helpers duplicated in the spec as the other specs do; committed in the finishing step after the orchestrator's run (MachPort fallback).
5. Phase 8 finish: spec not rewritten; reviewed and committed as is; row 8.3 ticked on local gate plus the orchestrator's e2e run.
6. Phase 9 finish: spec not rewritten; reviewed and committed as is; rows 9.1-9.3 ticked on the local gate plus the orchestrator's run; change.md set to `implemented` (updated date already 2026-10-13).
