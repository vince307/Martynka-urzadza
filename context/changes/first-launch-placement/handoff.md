# Handoff — `first-launch-placement` (slice S-06)

Written by the finishing agent of `/10x-e2e` phase 8 (risk #12 spec). Not the last phase. Phase 8 is committed (26f0787) with the orchestrator's evidence (spec 3/3, suite 11/11, break red). The next agent must not miss: phase 9 adds the parent-path tests to the same spec file; e2e is the orchestrator's gate (MachPort).

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | plan-review commits + p1 `d79ba20` + p2 `403644c` + p3 `e4920f3` + p4 `a51338d` + p5 `012867b` + p6 `96674ca` + p7 + p8 `26f0787` + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; phase 8 of nine) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/layout.ts` | new tokens: `TASK_LAYOUT.keypad.keyBorder/fieldBorder` (3/4), `HUD_LAYOUT.roomSwitch.iconStroke` (4), `ANIMATION.shakeSegments` (6); used in `Keypad`, `RoomSwitchButton`, `TaskScene.shake`; no visual change |
| `docs/design-gaps.md` | rows 15-21 (parent entry, adult gate, stage panel, sixth dot, sixth star, no welcome art, picture mode skipped); code comments now cite the row numbers (`WelcomeScene`, `layout.ts`, `pl.ts`, `SummaryPanel`, `ProgressDots`) |
| `context/changes/first-launch-placement/follow-ups/review-fixes.md` | risk #12 text for `/10x-test-plan refresh`, `mountInstallHint` touch leak, S-11 save of the learner, S-08 gate for stage change, S-14 picture mode, early-save decision, duplicate warm-up prompt (S-07), bonus unscaled (S-17), silent E1/E2 on the parent path; each with `Trigger:` |
| `CLAUDE.md`, `AGENTS.md` | Current state: first launch (welcome, placement, warm-up, DOM gate and panel, hook month); AGENTS.md scenes list + `src/ui/dom/` (397 words) |
| stale comments fixed | `BootScene` header (`needsPlacement`), `TaskScene.autoReadFirst` doc |
| `tests/e2e/first-launch.spec.ts`, `playwright.config.ts` | 3 tests of #12 (proposed); ROUND_SPEC includes first-launch (webServer untouched) |
| `plan.md` | rows 8.1-8.3 ticked; 6.1, 6.2 (orchestrator, run-log "S-06 p6 impl"), 7.1-7.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | clean |
| `npm test` | 53 files, 765 tests passed (production unchanged) |
| `npm run build` | ok, `e2e hook: absent (2 chunks checked)` |
| orchestrator `npx playwright test tests/e2e/first-launch.spec.ts` / full | 3 passed / 11 passed (baseline 8 + 3) |
| deliberate break (`e2e-break-s06-p8.patch`, finishWarmup ignores `warmupResult`) | red at first-launch.spec.ts:169 `toMatchObject({ stage: 'E2', ... })`: Expected stage "E2", Received "E3"; reverted; unit stays green |

Review against e2e-quality-rules: no waitForTimeout, web-first polls, titles carry `#12 (proposed)`, canvas locator is the only CSS (the game has no DOM roles), tests independent; no defect. Teacher read: no player-facing string added.

## 4. Next command



## 5. Open

- Rows 8.1-8.3 ticked. Phase 9 (rows 9.1-9.3) next: parent path through the gate by touch, test 6.
- E2E on later commits is the orchestrator's gate (MachPort in sub-sessions).
- Open rows:  1.4, 2.5, 4.6, 5.5, 7.4;  4.7, 5.6, 6.4;  5.7, 6.5, 7.5-7.9.
- Risk #12 is only proposed in the follow-ups; the spec cites  in titles.

## 6. Autonomous decisions

1. Bare numbers: only the three named in the S-05 follow-up were tokenised; the other house-icon coordinates in `RoomSwitchButton.draw` are icon geometry in a 56 px box and stay.
2. Gap rows 20 (no welcome art) and 21 (picture mode) added as the plan lists them; row 21 points at `src/data/placement.ts`, which has no code comment, so no `DESIGN-GAP` comment was added there.
3. AGENTS.md kept under 400 words by trimming one sentence and shortening another instead of dropping the scenes update.
4. Phase 8: E2 drop uses 3 wrong first tries (balance.warmup.minFirstTry = 4 of 6); helpers duplicated in the spec as the other specs do; no commit because Chromium cannot launch (contract fallback).
5. Phase 8 finish: spec not rewritten; reviewed and committed as is; row 8.3 ticked on local gate plus the orchestrator's e2e run.
