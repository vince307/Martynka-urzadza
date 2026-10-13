# Handoff — `first-launch-placement` (slice S-06)

Written by `/10x-implement` phase 7: seam sweep, bare numbers to tokens, DESIGN-GAP rows 15-21, follow-ups, docs. Not the last phase: phase 8 is the e2e for risk #12. The next agent must not miss: e2e could not run in this session (MachPort), so the orchestrator runs `npx playwright test` on the phase 7 commit (expected 8 passed).

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | plan-review commits + p1 `d79ba20` + p2 `403644c` + p3 `e4920f3` + p4 `a51338d` + p5 `012867b` + p6 `96674ca` + p7 (see `git log`) + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; phase 7 of nine) |
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
| `plan.md` | rows 6.1, 6.2 (orchestrator, run-log "S-06 p6 impl"), 7.1-7.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | clean |
| `npm test` | 765 passed in 53 files (baseline 671; delta +94 from p1..p5; p7 +0) |
| deploy + ops shell tests; `sample -- E1..E6` | OK; `Naruszenia: 0` x6 |
| `npm run build` | ok, `e2e hook: absent (2 chunks checked)` |
| `validate-rule-files.sh` | PASS; break (`NOPE.md` added to `RULE_FILES` in `autonomous-run.env`) gave `missing: 1`, FAIL; restored, PASS. A first break in the profile markdown (§ 1 table) stayed PASS: the script reads the `.env`, not the markdown |
| `npx playwright test` | e2e: not runnable in this session (MachPort) — orchestrator gate (3 failed / 5 did not run, browser launch failures) |

Teacher read: no new player-facing Polish string in this phase.

## 4. Next command

`/10x-e2e first-launch-placement phase 8`

## 5. Open

- E2E on the p7 commit is the orchestrator's gate (expected 8 passed; only comments, tokens with equal values and docs changed).
- Open rows: `[reviewer]` 1.4, 2.5, 4.6, 5.5, 7.4; `[visual]` 4.7, 5.6, 6.4; `[human]` 5.7, 6.5, 7.5-7.9.
- Risk #12 is only proposed in the follow-ups; the spec of phase 8 cites `#12` in titles.

## 6. Autonomous decisions

1. Bare numbers: only the three named in the S-05 follow-up were tokenised; the other house-icon coordinates in `RoomSwitchButton.draw` are icon geometry in a 56 px box and stay.
2. Gap rows 20 (no welcome art) and 21 (picture mode) added as the plan lists them; row 21 points at `src/data/placement.ts`, which has no code comment, so no `DESIGN-GAP` comment was added there.
3. AGENTS.md kept under 400 words by trimming one sentence and shortening another instead of dropping the scenes update.
