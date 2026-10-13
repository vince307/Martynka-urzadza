# Handoff — `first-launch-placement` (slice S-06)

Written by `/10x-e2e` phase 8 (risk #12 spec). Not the last phase. The next agent must not miss: phase 8 is NOT committed. Chromium cannot launch here (MachPort), so the spec `tests/e2e/first-launch.spec.ts` and the `playwright.config.ts` change (ROUND_SPEC) are uncommitted in the working tree; the orchestrator runs the commands in `context/runs/2026-10-12-s04-s08/e2e-request-s06-p8.md`, records the outputs there, and re-dispatches a finishing agent that commits `test(first-launch-placement): ... (p8)` and ticks 8.1-8.3.

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | plan-review commits + p1 `d79ba20` + p2 `403644c` + p3 `e4920f3` + p4 `a51338d` + p5 `012867b` + p6 `96674ca` + p7 (see `git log`) + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; phase 7 of nine) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` |
| Working tree | uncommitted: `tests/e2e/first-launch.spec.ts` (new), `playwright.config.ts` (ROUND_SPEC) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/layout.ts` | new tokens: `TASK_LAYOUT.keypad.keyBorder/fieldBorder` (3/4), `HUD_LAYOUT.roomSwitch.iconStroke` (4), `ANIMATION.shakeSegments` (6); used in `Keypad`, `RoomSwitchButton`, `TaskScene.shake`; no visual change |
| `docs/design-gaps.md` | rows 15-21 (parent entry, adult gate, stage panel, sixth dot, sixth star, no welcome art, picture mode skipped); code comments now cite the row numbers (`WelcomeScene`, `layout.ts`, `pl.ts`, `SummaryPanel`, `ProgressDots`) |
| `context/changes/first-launch-placement/follow-ups/review-fixes.md` | risk #12 text for `/10x-test-plan refresh`, `mountInstallHint` touch leak, S-11 save of the learner, S-08 gate for stage change, S-14 picture mode, early-save decision, duplicate warm-up prompt (S-07), bonus unscaled (S-17), silent E1/E2 on the parent path; each with `Trigger:` |
| `CLAUDE.md`, `AGENTS.md` | Current state: first launch (welcome, placement, warm-up, DOM gate and panel, hook month); AGENTS.md scenes list + `src/ui/dom/` (397 words) |
| stale comments fixed | `BootScene` header (`needsPlacement`), `TaskScene.autoReadFirst` doc |
| `plan.md` | rows 6.1, 6.2 (orchestrator, run-log "S-06 p6 impl"), 7.1-7.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `npx eslint` on spec + config, `npx tsc --noEmit` | clean |
| `npx playwright test tests/e2e/first-launch.spec.ts` (3 tries) | e2e: not runnable in this session (MachPort) — orchestrator gate |
| deliberate break | `e2e-break-s06-p8.patch` (TaskScene.finishWarmup ignores `warmupResult`); expected red: test 2 `expect(end.learner).toMatchObject({ stage: 'E2', ... })`; not yet observed |

Teacher read: no player-facing string added.

## 4. Next command

`/10x-e2e first-launch-placement phase 9` (after the orchestrator's phase 8 evidence and the finishing commit)

## 5. Open

- Phase 8 rows 8.1-8.3 open until the orchestrator run; 3 tests: age 8 clean warm-up stays E3 then 5-task round; age 8 with 3 first-try mistakes (minFirstTry 4 of 6) drops to E2; age 6 E1 without warm-up.

- E2E on the p7 commit is the orchestrator's gate (expected 8 passed; only comments, tokens with equal values and docs changed).
- Open rows: `[reviewer]` 1.4, 2.5, 4.6, 5.5, 7.4; `[visual]` 4.7, 5.6, 6.4; `[human]` 5.7, 6.5, 7.5-7.9.
- Risk #12 is only proposed in the follow-ups; the spec of phase 8 cites `#12` in titles.

## 6. Autonomous decisions

1. Bare numbers: only the three named in the S-05 follow-up were tokenised; the other house-icon coordinates in `RoomSwitchButton.draw` are icon geometry in a 56 px box and stay.
2. Gap rows 20 (no welcome art) and 21 (picture mode) added as the plan lists them; row 21 points at `src/data/placement.ts`, which has no code comment, so no `DESIGN-GAP` comment was added there.
3. AGENTS.md kept under 400 words by trimming one sentence and shortening another instead of dropping the scenes update.
4. Phase 8: E2 drop uses 3 wrong first tries (balance.warmup.minFirstTry = 4 of 6); helpers duplicated in the spec as the other specs do; no commit because Chromium cannot launch (contract fallback).
